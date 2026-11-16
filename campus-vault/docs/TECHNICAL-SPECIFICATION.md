# Campus Vault — Technical Specification

**Document type:** Software Technical Specification  
**Product:** Campus Vault  
**Version:** 1.0  
**Status:** Proposed — MVP  
**Primary platform:** Web application  
**Initial audience:** University students  
**Access model:** Free for students

---

# 1. Project Overview

## 1.1 Purpose

Campus Vault is a web-based academic resource management platform that enables students to access, contribute, and preserve academic learning materials through a centralised digital library.

The platform will provide structured access to lecture notes, past questions, test questions, handouts, and other permitted educational resources.

The system will consist of two primary interfaces:

1. **Student Application:** For discovering, previewing, downloading, and submitting academic resources.
2. **Administration Dashboard:** For managing academic information, uploaded resources, users, submissions, and platform activity.

## 1.2 Primary Objectives

- Provide a centralised academic resource repository.
- Organise resources by department, level, semester, course, and academic session.
- Allow students to contribute academic materials.
- Introduce a resource approval process.
- Provide reliable document preview and download functionality.
- Preserve resources for future academic sessions.
- Ensure secure access and controlled resource management.

## 1.3 MVP Constraints

The first release will focus on one university department or a limited pilot group.

The MVP will not include:

- Paid subscriptions.
- Student-to-student messaging.
- Online examinations.
- AI-generated summaries.
- Social networking features.
- Complex recommendation systems.
- Multiple university tenancy.

These features may be considered after the initial product has been validated.

---

# 2. Technology Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React | User interface |
| Language | TypeScript | Type safety |
| Build tool | Vite | Development and production builds |
| Routing | React Router | Application navigation |
| Styling | CSS / Tailwind CSS | Interface styling |
| Authentication | Firebase Authentication | User identity |
| Database | Cloud Firestore | Application data |
| File storage | Cloudflare R2 | PDF and document storage |
| Backend | Cloudflare Workers | Secure server-side operations |
| Validation | Zod | Input and data validation |
| PDF preview | Browser PDF viewer / PDF.js | Document preview |
| Deployment | Netlify or Vercel | Frontend hosting |

### Architecture decision

The frontend must not be trusted to perform privileged operations.

Cloudflare Workers will handle sensitive operations such as:

- Validating uploaded files.
- Generating authorised upload URLs.
- Verifying user permissions.
- Publishing approved resources.
- Generating temporary download URLs.
- Recording administrative actions.

Firebase Authentication will establish user identity. The backend will verify Firebase ID tokens before processing protected requests.

Firestore will store resource metadata and application records. R2 will store the actual files.

**Important:** R2 is a proposed choice, not a final commitment. Its pricing, access controls, CORS configuration, and integration requirements should be checked before production deployment.

---

# 3. System Architecture

## 3.1 High-Level Architecture

```text
              CAMPUS VAULT
                    |
          React + TypeScript
                    |
             Firebase Auth
                    |
             Authenticated User
                    |
              Cloudflare API
                    |
        Cloudflare Workers Backend
                    |
          +---------+---------+
          |                   |
          v                   v
    Cloud Firestore       Cloudflare R2
    Application Data      Document Storage
          |                   |
          v                   v
   Users, Courses,       PDFs, Notes,
   Resources, Logs       Study Materials
```

## 3.2 Architecture Responsibilities

### Frontend

Responsible for:

- Rendering student and admin interfaces.
- Handling navigation.
- Displaying academic resources.
- Collecting form inputs.
- Uploading files through authorised upload URLs.
- Displaying validation errors and system feedback.
- Handling preview and download interactions.

### Firebase Authentication

Responsible for:

- Account registration.
- Login and logout.
- Password reset.
- Identity verification.
- Providing Firebase ID tokens.

### Cloud Firestore

Responsible for storing:

- User profiles.
- Department information.
- Academic levels.
- Courses.
- Academic sessions.
- Resource metadata.
- Submission records.
- Activity logs.

### Cloudflare R2

Responsible for:

- Storing uploaded documents.
- Preserving original files.
- Providing file objects for preview and download through authorised access.

### Cloudflare Workers

Responsible for:

- Verifying Firebase authentication tokens.
- Checking user roles and permissions.
- Validating upload requests.
- Generating presigned upload URLs.
- Handling approval and publication operations.
- Generating temporary download URLs.
- Recording sensitive operations.

---

# 4. User Roles and Permissions

The application will support three primary roles.

## 4.1 Student

A student can:

- Register an account.
- Log in and log out.
- Update permitted profile information.
- Select or update academic information.
- Browse approved resources.
- Search and filter resources.
- Preview documents.
- Download approved resources.
- Submit academic resources.
- View their own submission status.

A student cannot:

- Approve resources.
- Publish resources.
- Delete another user's submission.
- Modify course records.
- Access administrative operations.

## 4.2 Contributor

A contributor has student access plus permission to submit academic resources.

A contributor may be an ordinary student or an authorised course representative.

Contributor permissions should be explicitly assigned rather than assumed from a user's display name or profile information.

## 4.3 Administrator

An administrator can:

- Access the admin dashboard.
- Create and edit departments.
- Create and edit courses.
- Manage academic sessions.
- Upload resources.
- Review submissions.
- Approve or reject submissions.
- Edit resource metadata.
- Remove resources.
- Manage user roles.
- View platform activity.
- Monitor storage and resource statistics.

Administrative permissions must be enforced by the backend.

Hiding admin buttons in the frontend is not sufficient security.

---

# 5. Authentication and User Management

## 5.1 Registration

Students should be able to create accounts using:

- Full name.
- Email address.
- Password.
- Department.
- Academic level.

Registration flow:

```text
Student opens registration
          |
          v
Enters account information
          |
          v
Firebase creates account
          |
          v
Email verification
          |
          v
Backend creates user profile
          |
          v
Student accesses Campus Vault
```

The system must handle cases where authentication succeeds but profile creation fails. Profile creation should be safely retryable.

## 5.2 Login

Students authenticate through Firebase Authentication.

After successful authentication:

1. Firebase provides an ID token.
2. The frontend retrieves the user's profile.
3. The application loads the appropriate interface.
4. Backend requests include the ID token for verification.

## 5.3 Password Recovery

The application should provide a password-reset flow through Firebase Authentication.

## 5.4 Role Management

User roles must be assigned securely.

Proposed roles:

```text
student
contributor
admin
```

The first administrator should be provisioned through a controlled server-side process.

Users must not be able to promote themselves by editing Firestore documents or changing frontend state.

---

# 6. Database Design

Cloud Firestore will serve as the primary application database.

## 6.1 Collections

```text
users/
departments/
courses/
academicSessions/
resources/
submissions/
activityLogs/
```

## 6.2 Users Collection

Document path:

```text
users/{userId}
```

Example:

```json
{
  "uid": "firebase-user-id",
  "fullName": "Samuel Oluwafemi",
  "email": "student@example.com",
  "departmentId": null,
  "level": null,
  "role": "student",
  "isActive": true,
  "emailVerified": true,
  "createdAt": "server-timestamp",
  "updatedAt": "server-timestamp"
}
```

Fields:

| Field | Type | Description |
|---|---|---|
| uid | String | Firebase user ID |
| fullName | String | Student's name |
| email | String | Account email |
| departmentId | String or null | Approved department reference, or null until the student's department is available |
| level | Number or null | Current academic level, or null until profile completion |
| role | String | User role |
| isActive | Boolean | Account status |
| emailVerified | Boolean | Whether Firebase email verification is confirmed |
| createdAt | Timestamp | Account creation date |
| updatedAt | Timestamp | Last profile update |

The user's role must be protected from client-side modification.
Newly registered profiles may have a null department and level until the
verified profile-completion flow saves an approved academic level. The initial
catalog is Geology at FUNAAB; students from other FUNAAB departments may
register and leave their department unset until its approved department record
is added. Department does not restrict access to approved library resources.

## 6.3 Departments Collection

Document path:

```text
departments/{departmentId}
```

Example:

```json
{
  "name": "Geology",
  "code": "GEO",
  "description": "Department of Geology",
  "isActive": true,
  "createdAt": "server-timestamp"
}
```

## 6.4 Courses Collection

Document path:

```text
courses/{courseId}
```

Example:

```json
{
  "courseCode": "GEO401",
  "courseTitle": "Mineral Exploration",
  "departmentId": "geology",
  "level": 400,
  "semester": "first",
  "isActive": true,
  "createdAt": "server-timestamp",
  "updatedAt": "server-timestamp"
}
```

Each course belongs to a department, level, and semester.

Course codes should be unique within their relevant academic structure.

## 6.5 Academic Sessions Collection

Document path:

```text
academicSessions/{sessionId}
```

Example:

```json
{
  "name": "2025/2026",
  "isActive": true,
  "createdAt": "server-timestamp"
}
```

Academic sessions should be managed separately from courses so resources can be preserved across multiple sessions.

## 6.6 Resources Collection

Document path:

```text
resources/{resourceId}
```

Example:

```json
{
  "title": "Mineral Exploration Past Questions",
  "description": "Past examination questions for GEO401",
  "departmentId": "geology",
  "courseId": "geo401",
  "level": 400,
  "semester": "first",
  "academicSessionId": "2025-2026",
  "resourceType": "past-question",
  "fileName": "geo401-past-questions.pdf",
  "storageKey": "resources/geology/geo401/resource-id.pdf",
  "fileType": "application/pdf",
  "fileSize": 2457600,
  "uploadedBy": "user-id",
  "approvalStatus": "approved",
  "approvedBy": "admin-id",
  "approvedAt": "server-timestamp",
  "downloadCount": 0,
  "createdAt": "server-timestamp",
  "updatedAt": "server-timestamp"
}
```

### Resource Types

```text
lecture-note
past-question
test-question
handout
study-material
other
```

### Approval Statuses

```text
pending
approved
rejected
archived
```

Only approved resources should appear in the student resource library.

## 6.7 Submissions Collection

Document path:

```text
submissions/{submissionId}
```

This collection will track user-submitted resources awaiting moderation.

Example:

```json
{
  "resourceTitle": "GEO401 Lecture Notes",
  "courseId": "geo401",
  "uploadedBy": "user-id",
  "storageKey": "pending/submissions/submission-id.pdf",
  "resourceType": "lecture-note",
  "status": "pending",
  "reviewedBy": null,
  "reviewNote": null,
  "createdAt": "server-timestamp",
  "reviewedAt": null
}
```

Submission statuses:

```text
pending
approved
rejected
```

The original submission should not automatically become publicly accessible.

## 6.8 Activity Logs Collection

Document path:

```text
activityLogs/{logId}
```

Example:

```json
{
  "actorId": "admin-id",
  "action": "resource.approved",
  "targetId": "resource-id",
  "targetType": "resource",
  "createdAt": "server-timestamp"
}
```

Activity logs should record important actions such as:

- Resource uploads.
- Resource approvals.
- Resource rejections.
- Resource deletions.
- Role changes.
- Course creation and modification.

Logs should be written by trusted backend operations and should not be editable by ordinary users.

---

# 7. File Storage and Upload System

## 7.1 Supported File Types

Initial supported formats:

| Format | Purpose |
|---|---|
| PDF | Lecture notes and examination questions |
| JPG / JPEG | Scanned academic materials |
| PNG | Images and diagrams |
| WEBP | Optimised images |

PDF should be the primary document format.

Additional file formats may be introduced after the MVP.

## 7.2 Initial File Size Limit

Proposed maximum upload size:

**20 MB per file.**

This is an initial product policy, not a permanent infrastructure limit.

The maximum should be reviewed after testing with actual student documents.

## 7.3 Upload Process

```text
User selects a file
        |
        v
Frontend validates file
        |
        v
Backend verifies user
        |
        v
Backend validates metadata
        |
        v
Backend creates upload authorisation
        |
        v
Frontend uploads file to R2
        |
        v
Backend verifies uploaded object
        |
        v
Firestore record is created
        |
        v
Resource enters pending review
```

For administrator uploads, an authorised admin may submit the resource directly into the approval workflow. Publishing still requires an explicit approval operation.

## 7.4 File Validation

The system should validate:

- File extension.
- Actual file content or MIME type.
- File size.
- Required resource metadata.
- User upload permissions.
- Duplicate file detection where practical.

Do not rely only on the file extension supplied by the browser.

## 7.5 File Compression

Files should be optimised before storage where appropriate.

Recommended handling:

- PDFs: compress while preserving text readability.
- Scanned PDFs: optimise embedded images.
- JPEG images: compress or convert to WebP when suitable.
- PNG images: optimise or convert where transparency is unnecessary.
- Preserve original files when optimisation could damage document quality.

Do not convert every PDF page into an image.

## 7.6 Duplicate Detection

The backend should calculate a cryptographic hash, such as SHA-256, for uploaded files.

The hash can be used to identify identical files and reduce unnecessary duplicate storage.

Duplicate detection should not automatically reject a resource if the same file is legitimately associated with another course or academic session. The system should allow metadata reuse or a controlled duplicate workflow.

## 7.7 File Access

R2 objects should not be exposed through unrestricted public access by default.

The backend should generate short-lived authorised URLs for:

- Document previews.
- Document downloads.

The system should verify that the requesting user is authenticated and that the resource is approved before issuing access.

## 7.8 Download Tracking

When a download is requested successfully, the backend should record the activity.

The system may maintain:

- Total resource downloads.
- Most downloaded resources.
- Recent download activity.

Download counts should be updated server-side to avoid arbitrary client manipulation.

---

# 8. Student Application

## 8.1 Main Pages

The student application should include:

```text
/
├── /
├── /register
├── /login
├── /forgot-password
├── /dashboard
├── /library
├── /departments
├── /courses
├── /courses/:courseId
├── /resources/:resourceId
├── /contribute
├── /my-submissions
└── /profile
```

## 8.2 Dashboard

The student dashboard should display:

- Welcome message.
- Selected department.
- Current academic level.
- Recently added resources.
- Recommended course navigation based on academic profile.
- Quick access to the resource library.
- Submission status, where applicable.

## 8.3 Resource Library

The library should provide filters for:

- Department.
- Level.
- Semester.
- Course.
- Academic session.
- Resource type.

Search should initially support course titles, course codes, resource titles, and relevant metadata.

## 8.4 Course Page

Each course page should display:

- Course title.
- Course code.
- Level.
- Semester.
- Available resources.
- Resource types.
- Academic sessions.

### Resource Availability Indicators

The course page should show which types of materials are available.

Example:

```text
GEO401 — Mineral Exploration

Lecture Notes          Available
Past Questions         Available
Test Questions         Not Available
Study Materials        Available
```

These indicators should be derived from approved resource records rather than manually maintained labels.

## 8.5 Resource Details

Each resource detail page should display:

- Resource title.
- Course information.
- Academic session.
- Resource type.
- Upload date.
- Preview option.
- Download option.

The application should show a useful message when a document is unavailable or has been archived.

## 8.6 Mobile Responsiveness

The platform must support:

- Android smartphones.
- iPhones.
- Tablets.
- Desktop browsers.

Mobile usability is a priority because many students will access Campus Vault through their phones.

---

# 9. Administration Dashboard

## 9.1 Admin Pages

```text
/admin
/admin/dashboard
/admin/resources
/admin/resources/upload
/admin/submissions
/admin/courses
/admin/departments
/admin/sessions
/admin/users
/admin/activity
/admin/settings
```

## 9.2 Admin Dashboard Overview

Display:

- Total approved resources.
- Pending submissions.
- Total registered students.
- Total courses.
- Total downloads.
- Recently uploaded resources.
- Recent administrative activity.

## 9.3 Resource Management

Administrators should be able to:

- Upload resources.
- Edit resource metadata.
- Assign courses and academic sessions.
- Change resource categories.
- Approve or reject pending submissions.
- Archive or remove resources.

## 9.4 Submission Review

The review interface should display:

- Submitted resource title.
- Contributor information.
- Associated course.
- Resource type.
- Upload date.
- Document preview.
- Approve action.
- Reject action.
- Optional review note.

Every approval or rejection must be processed through a protected backend operation.

## 9.5 Course Management

Administrators should be able to:

- Create courses.
- Edit course information.
- Assign departments.
- Assign academic levels.
- Assign semesters.
- Deactivate courses.

Deactivating a course should not automatically delete its historical resources.

---

# 10. Backend API Specification

The backend will expose protected HTTP endpoints through Cloudflare Workers.

All protected endpoints must verify Firebase ID tokens.

The API should return consistent JSON responses.

## 10.1 Authentication

Authentication itself will be handled by Firebase Authentication.

The frontend sends a Firebase ID token using:

```http
Authorization: Bearer <firebase-id-token>
```

The backend verifies the token and retrieves the corresponding user profile and permissions.

## 10.2 Resource Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/resources | List approved resources |
| GET | /api/resources/:id | Get resource details |
| POST | /api/resources/upload-intent | Request upload authorisation |
| POST | /api/resources/:id/preview | Request preview access |
| POST | /api/resources/:id/download | Request download access |

## 10.3 Submission Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/submissions | Submit a resource |
| GET | /api/submissions/mine | List own submissions |
| GET | /api/admin/submissions | List pending submissions |
| POST | /api/admin/submissions/:id/approve | Approve submission |
| POST | /api/admin/submissions/:id/reject | Reject submission |

## 10.4 Academic Data Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/departments | List departments |
| GET | /api/courses | List courses |
| GET | /api/courses/:id | Get course information |
| GET | /api/sessions | List academic sessions |

## 10.5 Administration Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/admin/courses | Create course |
| PATCH | /api/admin/courses/:id | Update course |
| POST | /api/admin/departments | Create department |
| PATCH | /api/admin/departments/:id | Update department |
| GET | /api/admin/users | List users |
| PATCH | /api/admin/users/:id/role | Change user role |
| GET | /api/admin/analytics | Retrieve platform statistics |

All admin endpoints must require an authorised administrator.

## 10.6 API Response Format

Successful response:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource could not be found."
  }
}
```

Use appropriate HTTP status codes, including:

- 200 — Successful request.
- 201 — Resource created.
- 400 — Invalid request.
- 401 — Unauthenticated.
- 403 — Permission denied.
- 404 — Resource not found.
- 409 — Conflict.
- 413 — File too large.
- 422 — Validation failed.
- 429 — Rate limit exceeded.
- 500 — Internal server error.

---

# 11. Firestore Security Rules

Firestore security rules must prevent users from modifying protected data.

Core rules:

- Users can read their own profile.
- Users cannot change their own role.
- Students cannot approve resources.
- Students cannot create published resource records directly.
- Only authorised administrators can manage academic structures.
- Only backend-controlled operations can perform sensitive moderation actions.
- Activity logs cannot be modified by ordinary users.

Where practical, sensitive resource and submission operations should be performed through the backend rather than direct client writes.

The application must also use least-privilege backend service credentials.

---

# 12. Search, Filtering and Pagination

## 12.1 Search

Initial search should support:

- Course code.
- Course title.
- Resource title.
- Resource type.

Firestore does not provide full-text search natively.

For the MVP, use structured queries and simple prefix or metadata search where appropriate.

A dedicated search service can be introduced later if the library grows enough to justify it.

## 12.2 Filtering

Users should be able to filter by:

- Department.
- Level.
- Semester.
- Course.
- Academic session.
- Resource type.

## 12.3 Pagination

Resource lists should use cursor-based pagination.

Recommended initial page size:

**20 resources per request.**

The system should avoid loading the entire resource collection at once.

Required Firestore composite indexes should be documented and committed to the project repository.

---

# 13. Error Handling and User Feedback

The frontend should handle:

- Authentication failures.
- Network errors.
- Missing resources.
- Invalid file formats.
- Files exceeding the upload limit.
- Upload interruptions.
- Failed document previews.
- Failed downloads.
- Permission errors.
- Empty search results.

User-facing messages should be clear and actionable.

Example:

```text
No resources found for this course yet.

Help improve the library by submitting
a permitted academic resource.
```

The interface should not expose internal server errors, access tokens, storage credentials, or sensitive database information.

---

# 14. Performance and Reliability

The application should be designed for low-bandwidth environments and mobile devices.

Requirements:

- Lazy-load resource lists.
- Paginate Firestore queries.
- Optimise images before storage.
- Compress documents where appropriate.
- Avoid unnecessary database reads.
- Cache suitable static content.
- Display upload progress.
- Support retrying interrupted uploads.
- Provide clear loading and empty states.
- Keep the interface responsive on smaller screens.

Original academic documents should remain readable after optimisation.

---

# 15. Security Requirements

Security must be implemented as part of the system architecture, not added after the interface is complete.

Required protections:

1. Firebase ID token verification on protected backend endpoints.
2. Server-side role and permission checks.
3. Secure administrator provisioning.
4. Protected storage access.
5. Short-lived presigned upload and download URLs.
6. File type and size validation.
7. Rate limiting on sensitive endpoints.
8. Input validation and sanitisation.
9. Duplicate upload detection.
10. Audit logs for administrative actions.
11. Protection against unauthorised role changes.
12. Secrets stored in server-side environment variables.
13. Appropriate CORS restrictions.
14. Backup and recovery procedures.

Presigned URLs should have short expiry periods and should not be stored as permanent resource metadata.

---

# 16. Testing Requirements

## 16.1 Authentication Tests

- Student can register.
- Student can log in.
- Student can log out.
- Password reset works.
- Unauthenticated users cannot access protected endpoints.
- Users cannot change their own roles.

## 16.2 Resource Tests

- Approved resources appear in the library.
- Pending resources remain hidden.
- Rejected resources remain inaccessible.
- Resource filters return the correct results.
- Course availability indicators reflect actual approved resources.

## 16.3 Upload Tests

- Valid PDFs can be uploaded.
- Unsupported file types are rejected.
- Oversized files are rejected.
- Upload interruptions are handled.
- Duplicate files are detected.
- Uploads from unauthorised users are rejected.

## 16.4 Admin Tests

- Administrators can create courses.
- Administrators can edit resource metadata.
- Administrators can approve submissions.
- Administrators can reject submissions.
- Students cannot access admin operations.
- Administrative actions are recorded.

## 16.5 Mobile Tests

- Registration works on Android.
- Resource browsing works on mobile.
- PDF preview works on supported mobile browsers.
- Downloads work correctly.
- Navigation remains usable on small screens.

---

# 17. Project Folder Structure

Proposed frontend and backend organisation:

```text
campus-vault/
│
├── public/
│
├── src/
│   ├── assets/
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── resources/
│   │   └── forms/
│   │
│   ├── pages/
│   │   ├── auth/
│   │   ├── student/
│   │   └── admin/
│   │
│   ├── features/
│   │   ├── authentication/
│   │   ├── library/
│   │   ├── resources/
│   │   ├── submissions/
│   │   └── administration/
│   │
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── routes/
│   ├── context/
│   │
│   ├── firebase/
│   │   └── config.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── functions/
│   └── src/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       ├── validators/
│       ├── utils/
│       └── index.ts
│
├── firestore.rules
├── firestore.indexes.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
├── .gitignore
└── README.md
```

The backend can be maintained in a separate package or repository if deployment requirements make that preferable.

---

# 18. Environment Variables

Example frontend environment configuration:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_API_BASE_URL=
```

Example backend secrets:

```env
FIREBASE_PROJECT_ID=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=
```

Backend secrets must only exist in the server environment.

Never commit real credentials, private keys, or access tokens to GitHub.

---

# 19. MVP Acceptance Criteria

The MVP can be considered ready for its initial pilot when the following conditions are met.

### Student Experience

- [ ] Students can register and authenticate.
- [ ] Students can select their academic information.
- [ ] Students can browse the academic library.
- [ ] Students can find resources by course and resource type.
- [ ] Students can preview approved PDFs.
- [ ] Students can download approved resources.
- [ ] Students can submit academic resources.
- [ ] Students can view their submission status.

### Administration

- [ ] Administrators can securely access the dashboard.
- [ ] Administrators can create departments and courses.
- [ ] Administrators can upload academic resources.
- [ ] Administrators can review submissions.
- [ ] Administrators can approve and reject resources.
- [ ] Administrators can edit and archive resources.
- [ ] Administrators can manage authorised roles.
- [ ] Important administrative actions are logged.

### Security and Reliability

- [ ] Protected endpoints verify authentication.
- [ ] Role permissions are enforced server-side.
- [ ] Unapproved resources cannot be accessed by students.
- [ ] Storage objects are not unnecessarily exposed publicly.
- [ ] Invalid and oversized uploads are rejected.
- [ ] Mobile browsing and downloading work.
- [ ] Database and storage backups are planned.

---

# 20. Development Phases

The project should be developed in controlled stages.

| Phase | Development Focus |
|---|---|
| 1 | Project setup, architecture, and Firebase configuration |
| 2 | Authentication and user profiles |
| 3 | Department, course, and academic session management |
| 4 | Student dashboard and academic library |
| 5 | Resource upload and storage integration |
| 6 | Resource preview and download |
| 7 | Admin dashboard and moderation workflow |
| 8 | Search, filtering, and resource availability |
| 9 | Security rules and backend protection |
| 10 | Testing, optimisation, and pilot deployment |

Each phase should be tested before proceeding to the next.

---

# 21. Future Technical Improvements

The architecture should allow future expansion without overcomplicating the MVP.

Potential improvements:

- Advanced full-text search.
- Resource version history.
- Course representative management.
- Multiple department support.
- Multiple university support.
- Automated document processing.
- Resource contribution analytics.
- Improved file deduplication.
- Automated backups.
- Progressive Web App capabilities.
- Offline access to previously downloaded resources.

These are future improvements, not mandatory MVP requirements.

---

# 22. Final Engineering Principle

Campus Vault should be built as a reliable academic resource management system, not simply a file-upload website.

The most important engineering priorities are:

1. Correct academic resource organisation.
2. Reliable document storage and retrieval.
3. Secure authentication and role management.
4. Controlled resource approval.
5. A simple, accessible student experience.
6. Long-term maintainability.

Every technical decision should support the central purpose of Campus Vault:

**Making academic knowledge accessible to every student and preserving it for the students who come next.**

**Campus Vault — Learn together. Share knowledge. Stay prepared.**