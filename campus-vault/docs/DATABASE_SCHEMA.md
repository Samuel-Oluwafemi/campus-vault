# Campus Vault — Database Schema

**Document:** DATABASE_SCHEMA.md  
**Version:** 1.0  
**Database:** Cloud Firestore  
**Status:** Proposed — MVP

---

# 1. Overview

This document defines the database structure for Campus Vault.

The database will store information about:

- Users and their academic profiles.
- Departments.
- Courses.
- Academic sessions.
- Academic resources.
- Resource submissions.
- Administrative activity.

The actual academic files (PDFs, images, and other supported documents) will be stored in Cloudflare R2.

Firestore will store the metadata and storage references needed to identify, organise, retrieve, and manage those files.

## 1.1 Database Design Principles

The database should:

1. Support multiple departments.
2. Organise courses by department, level, and semester.
3. Preserve resources across academic sessions.
4. Separate submitted resources from approved resources.
5. Support student contributions and administrative moderation.
6. Avoid unnecessary duplication of data.
7. Support efficient filtering and pagination.
8. Allow future expansion without major restructuring.

---

# 2. Collection Structure

The initial Firestore database will contain the following collections:

```text
firestore/
│
├── users/
│
├── departments/
│
├── courses/
│
├── academicSessions/
│
├── resources/
│
├── submissions/
│
└── activityLogs/
```

Each collection will contain documents identified by unique document IDs.

---

# 3. Users Collection

**Collection:** `users`

**Document path:**

```text
users/{userId}
```

Each document represents one registered Campus Vault user.

## 3.1 User Document

```json
{
  "uid": "firebase-auth-uid",
  "fullName": "Samuel Oluwafemi",
  "email": "student@example.com",
  "departmentId": null,
  "level": null,
  "role": "student",
  "isActive": true,
  "emailVerified": true,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## 3.2 Field Definitions

| Field | Type | Required | Description |
|---|---|---|---|
| uid | String | Yes | Firebase Authentication UID |
| fullName | String | Yes | User's full name |
| email | String | Yes | Registered email |
| departmentId | String or null | No | Reference to an approved department; remains null until the student's department is available in the platform |
| level | Number or null | No | Current academic level; null until profile completion |
| role | String | Yes | User permission role |
| isActive | Boolean | Yes | Account status |
| emailVerified | Boolean | Yes | Email verification status |
| createdAt | Timestamp | Yes | Account creation time |
| updatedAt | Timestamp | Yes | Last profile update |

## 3.3 Supported Roles

```text
student
contributor
admin
```

A contributor receives additional submission permissions.

An administrator receives management and moderation permissions.

Role changes must be performed through authorised backend operations.

## 3.4 Important Rules

- A user document ID should match the Firebase Authentication UID.
- Users must not be able to change their own role.
- Users must not be able to change their own account status.
- Academic level must be selected from the supported levels (100, 200, 300, 400, or 500).
- A non-null department must reference an active, approved department record. The current profile flow exposes Geology only; students in other FUNAAB departments leave this field null until their department is seeded.
- Account deletion should follow a controlled process so existing academic contributions are not accidentally lost.

---

# 4. Departments Collection

**Collection:** `departments`

**Document path:**

```text
departments/{departmentId}
```

This collection stores the academic departments supported by Campus Vault.

## 4.1 Department Document

```json
{
  "name": "Geology",
  "code": "GEO",
  "description": "Department of Geology",
  "levels": [100, 200, 300, 400, 500],
  "isActive": true,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## 4.2 Field Definitions

| Field | Type | Description |
|---|---|---|
| name | String | Department name |
| code | String | Department abbreviation |
| description | String | Department description |
| levels | Array of Numbers | Supported academic levels |
| isActive | Boolean | Whether the department is active |
| createdAt | Timestamp | Creation date |
| updatedAt | Timestamp | Last update |

## 4.3 Important Rules

- Department names should be unique within the institution.
- Department codes should be unique.
- Departments should be deactivated rather than deleted when historical resources exist.
- Courses and resources should reference departments using `departmentId`.

---

# 5. Courses Collection

**Collection:** `courses`

**Document path:**

```text
courses/{courseId}
```

Each document represents an academic course.

## 5.1 Course Document

```json
{
  "courseCode": "GEO401",
  "courseTitle": "Mineral Exploration",
  "departmentId": "geology",
  "level": 400,
  "semester": "first",
  "description": "Introduction to mineral exploration.",
  "isActive": true,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## 5.2 Field Definitions

| Field | Type | Description |
|---|---|---|
| courseCode | String | Course code |
| courseTitle | String | Course name |
| departmentId | String | Department reference |
| level | Number | Academic level |
| semester | String | First or second semester |
| description | String | Optional course description |
| isActive | Boolean | Course availability |
| createdAt | Timestamp | Creation date |
| updatedAt | Timestamp | Last update |

## 5.3 Semester Values

```text
first
second
```

## 5.4 Course Rules

- Every course must belong to a valid department.
- Every course must have an academic level.
- Every course must have a semester.
- Course codes should be unique within the relevant department and academic structure.
- Deactivating a course must not automatically delete its resources.

Course identity should remain stable even when its title or description changes.

---

# 6. Academic Sessions Collection

**Collection:** `academicSessions`

**Document path:**

```text
academicSessions/{sessionId}
```

This collection stores academic sessions.

## 6.1 Academic Session Document

```json
{
  "name": "2025/2026",
  "startYear": 2025,
  "endYear": 2026,
  "isActive": true,
  "createdAt": "Timestamp"
}
```

## 6.2 Field Definitions

| Field | Type | Description |
|---|---|---|
| name | String | Academic session name |
| startYear | Number | Starting year |
| endYear | Number | Ending year |
| isActive | Boolean | Whether the session is active |
| createdAt | Timestamp | Creation date |

## 6.3 Important Rules

- Academic session names must be unique.
- Only one session should be designated as the active session for a given academic structure, unless the institution requires otherwise.
- Old sessions must remain available because historical examination questions are important resources.
- Deactivating a session must not delete its resources.

---

# 7. Resources Collection

**Collection:** `resources`

**Document path:**

```text
resources/{resourceId}
```

This is one of the most important collections in Campus Vault.

It stores the metadata for every resource that has been approved for the academic library.

The actual document file will be stored in R2.

## 7.1 Resource Document

```json
{
  "title": "Mineral Exploration Past Questions",
  "description": "Past examination questions for GEO401.",
  "departmentId": "geology",
  "courseId": "geo401",
  "level": 400,
  "semester": "first",
  "academicSessionId": "2025-2026",
  "resourceType": "past-question",

  "file": {
    "originalName": "GEO401-Past-Questions.pdf",
    "storageKey": "resources/geology/geo401/resource-id.pdf",
    "mimeType": "application/pdf",
    "size": 2457600,
    "sha256": "file-content-hash"
  },

  "uploadedBy": "user-id",
  "approvalStatus": "approved",

  "moderation": {
    "approvedBy": "admin-id",
    "approvedAt": "Timestamp",
    "reviewNote": null
  },

  "downloadCount": 0,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## 7.2 Field Definitions

| Field | Type | Description |
|---|---|---|
| title | String | Resource title |
| description | String | Resource description |
| departmentId | String | Department reference |
| courseId | String | Course reference |
| level | Number | Academic level |
| semester | String | Semester |
| academicSessionId | String | Academic session reference |
| resourceType | String | Type of academic material |
| file | Map | File metadata and storage reference |
| uploadedBy | String | Original contributor UID |
| approvalStatus | String | Publication status |
| moderation | Map | Review information |
| downloadCount | Number | Download count |
| createdAt | Timestamp | Creation date |
| updatedAt | Timestamp | Last modification |

## 7.3 Resource Types

```text
lecture-note
past-question
test-question
handout
study-material
other
```

## 7.4 Approval Statuses

```text
pending
approved
rejected
archived
```

Only resources with `approvalStatus: approved` should be available to students.

## 7.5 File Metadata

The `file` object stores information about the uploaded document.

| Field | Type | Description |
|---|---|---|
| originalName | String | Original filename |
| storageKey | String | R2 object key |
| mimeType | String | Actual supported file MIME type |
| size | Number | File size in bytes |
| sha256 | String | File content hash |

Do not store permanent presigned URLs in the resource document.

The backend should generate temporary URLs when an authorised user requests a preview or download.

## 7.6 Moderation Metadata

The `moderation` object stores information about the approval process.

| Field | Type | Description |
|---|---|---|
| approvedBy | String | Administrator UID |
| approvedAt | Timestamp | Approval date |
| reviewNote | String or Null | Optional review note |

Rejected and archived resources should retain appropriate moderation history.

## 7.7 Resource Rules

- Every resource must reference a valid department.
- Every resource must reference a valid course.
- Every resource must reference a valid academic session.
- Resource metadata must match its associated course structure.
- Only approved resources should be returned by student-facing queries.
- Students must not directly create approved resource records.
- File access must be authorised by the backend.
- Deletion must coordinate Firestore metadata and R2 object cleanup.

---

# 8. Submissions Collection

**Collection:** `submissions`

**Document path:**

```text
submissions/{submissionId}
```

This collection tracks academic materials submitted by students or contributors for moderation.

Submissions are separate from published resources.

## 8.1 Submission Document

```json
{
  "title": "GEO401 Complete Lecture Notes",
  "description": "Lecture notes covering the course topics.",
  "departmentId": "geology",
  "courseId": "geo401",
  "level": 400,
  "semester": "first",
  "academicSessionId": "2025-2026",
  "resourceType": "lecture-note",

  "file": {
    "originalName": "GEO401-Notes.pdf",
    "storageKey": "pending/submissions/submission-id.pdf",
    "mimeType": "application/pdf",
    "size": 1850000,
    "sha256": "file-content-hash"
  },

  "uploadedBy": "student-id",
  "status": "pending",

  "review": {
    "reviewedBy": null,
    "reviewedAt": null,
    "reviewNote": null
  },

  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## 8.2 Submission Statuses

```text
pending
approved
rejected
```

## 8.3 Submission Workflow

```text
Student submits resource
          |
          v
Submission document created
          |
          v
Status: Pending
          |
          v
Administrator reviews
          |
          +-------------------+
          |                   |
          v                   v
       Approve              Reject
          |                   |
          v                   v
Create published        Record rejection
resource record         and review note
          |
          v
Remove or relocate
pending file
          |
          v
Resource becomes
available in library
```

The approval process should be atomic from the application's perspective.

If resource creation fails, the submission must not be marked as successfully approved.

The system should prevent the same submission from being approved twice.

---

# 9. Activity Logs Collection

**Collection:** `activityLogs`

**Document path:**

```text
activityLogs/{logId}
```

This collection records important system and administrative activities.

## 9.1 Activity Log Document

```json
{
  "actorId": "admin-id",
  "action": "resource.approved",
  "targetId": "resource-id",
  "targetType": "resource",
  "details": {
    "courseId": "geo401",
    "resourceTitle": "Mineral Exploration Past Questions"
  },
  "createdAt": "Timestamp"
}
```

## 9.2 Supported Activity Types

```text
user.registered
user.role_changed
resource.submitted
resource.approved
resource.rejected
resource.updated
resource.archived
resource.deleted
course.created
course.updated
department.created
department.updated
```

Additional activity types can be introduced when needed.

## 9.3 Rules

- Activity logs should be created through trusted backend operations.
- Users must not modify existing logs.
- Students must not access administrative activity records.
- Sensitive personal information and authentication credentials must never be stored in logs.

---

# 10. Database Relationships

The primary relationships are:

```text
Department
    |
    +------ Courses
    |          |
    |          +------ Resources
    |          |
    |          +------ Submissions
    |
    +------ Users

Academic Session
    |
    +------ Resources
    |
    +------ Submissions

User
    |
    +------ Submissions
    |
    +------ Resources (uploadedBy)
    |
    +------ Activity Logs
```

Firestore does not enforce traditional relational foreign keys.

The backend must validate referenced document IDs before creating or updating related records.

For example, when a resource is uploaded, the backend must confirm that:

1. The department exists.
2. The course exists.
3. The academic session exists.
4. The course belongs to the selected department.
5. The selected level and semester match the course.

---

# 11. Required Firestore Indexes

The following query patterns are expected to require composite indexes.

Actual index requirements should be confirmed against the implemented Firestore queries.

| Collection | Query fields | Purpose |
|---|---|---|
| resources | departmentId + level + approvalStatus | Browse approved resources by level |
| resources | courseId + approvalStatus + createdAt | Course resource listing |
| resources | courseId + resourceType + approvalStatus | Filter by resource type |
| resources | courseId + academicSessionId + approvalStatus | Filter by session |
| resources | departmentId + level + semester + approvalStatus | Academic library filtering |
| submissions | uploadedBy + createdAt | User submission history |
| submissions | status + createdAt | Admin review queue |
| activityLogs | actorId + createdAt | User activity history |
| activityLogs | targetType + targetId + createdAt | Record history for a resource |

Firestore may prompt for additional indexes when queries are implemented.

All required indexes should be maintained in `firestore.indexes.json`.

---

# 12. Resource Availability Logic

Course resource availability should be calculated from approved resources.

For each course, the application should check whether approved resources exist for each resource type.

Example:

```text
GEO401 — Mineral Exploration

Lecture Notes:
Available

Past Questions:
Available

Test Questions:
Not Available

Study Materials:
Available
```

The system should not mark a course as complete simply because one resource has been uploaded.

Availability means at least one approved resource of that type exists.

A future completeness indicator may consider the number of topics, sessions, or expected documents available, but this should not be part of the initial MVP.

---

# 13. Data Validation Rules

All data entering the database must be validated.

## 13.1 User Validation

- Full name must not be empty.
- Email must be valid.
- Department may be null during profile completion; otherwise it must reference an active, approved department.
- Academic level may be null until profile completion; otherwise it must be a supported level (100, 200, 300, 400, or 500).
- Students may register while their department is not yet available in the platform; department is used for organization and is not an access boundary.
- Role must be assigned through a trusted process.

## 13.2 Course Validation

- Course code must not be empty.
- Course title must not be empty.
- Department must exist.
- Level must be valid.
- Semester must be either `first` or `second`.

## 13.3 Resource Validation

- Title must not be empty.
- Course must exist.
- Department must match the course.
- Academic session must exist.
- Resource type must be supported.
- File must pass content and size validation.
- Contributor must be authenticated.
- Approval status must be assigned by an authorised process.

Use Zod schemas in the backend for request validation.

Firestore security rules should independently restrict client access.

---

# 14. Pagination and Query Strategy

The application must avoid loading large collections in a single request.

Initial pagination:

```text
Page size: 20 documents
Pagination method: Firestore cursor-based pagination
```

Use `limit()` and `startAfter()` for resource and submission lists.

Avoid repeatedly downloading the same documents when users change filters or navigate between pages.

Use only the fields required by the current interface where practical.

---

# 15. Data Integrity and File Lifecycle

Firestore and R2 are separate services, so operations involving both cannot rely on a single shared database transaction.

The backend must handle partial failures.

## 15.1 Upload Failure

If file upload succeeds but metadata creation fails:

- Do not publish the resource.
- Record or identify the unreferenced file.
- Retry metadata creation where safe, or schedule cleanup.

## 15.2 Resource Deletion

When an administrator deletes a resource:

1. Mark the resource as unavailable or pending deletion.
2. Delete the associated storage object through a trusted backend operation.
3. Confirm successful deletion.
4. Finalise metadata deletion or archival.
5. Record the action.

If storage deletion fails, retain enough metadata to retry cleanup.

## 15.3 Submission Approval

Approval must:

1. Confirm the submission exists.
2. Confirm it is still pending.
3. Validate the administrator's permission.
4. Create the published resource.
5. Record moderation details.
6. Update the submission status.
7. Record the administrative activity.

The operation must be idempotent so repeated requests do not create duplicate published resources.

---

# 16. Backup and Recovery

The platform should have a recovery strategy for both database records and stored files.

Requirements:

- Schedule regular Firestore backups or exports.
- Maintain a backup strategy for R2 objects.
- Preserve original uploaded files.
- Document restoration procedures.
- Protect backup access.
- Test recovery before production launch.

Backups should not be treated as complete until restoration has been tested.

---

# 17. Future Database Expansion

The initial schema should allow the following additions without requiring a complete redesign:

- More departments.
- More academic levels.
- More courses.
- More academic sessions.
- Multiple institutions.
- Course representative assignments.
- Resource version history.
- Resource feedback.
- Advanced search indexing.
- Resource contribution statistics.

If Campus Vault expands to multiple universities, institution identifiers and institution-level access boundaries should be introduced deliberately before that expansion.

---

# 18. Database Acceptance Criteria

The database implementation is considered ready for the MVP when:

- [ ] Users can be stored and retrieved using Firebase Authentication UIDs.
- [ ] Departments can be created and managed.
- [ ] Courses can be assigned to departments, levels, and semesters.
- [ ] Academic sessions can be managed independently.
- [ ] Resources can reference valid courses and sessions.
- [ ] Submissions can be stored separately from approved resources.
- [ ] Approval creates a valid published resource.
- [ ] Rejected resources remain unpublished.
- [ ] Resource availability is derived from approved records.
- [ ] Activity logs are created for important administrative actions.
- [ ] Required Firestore indexes are configured.
- [ ] Database permissions prevent unauthorised changes.
- [ ] Storage references remain valid and recoverable.

---

# 19. Final Database Principle

The Campus Vault database must preserve the relationship between academic resources and the academic structure they belong to.

A document should never exist as an unorganised file without meaningful academic context.

Every approved resource should be traceable to:

- A department.
- A course.
- An academic level.
- A semester.
- An academic session.
- A contributor or uploader.
- An approval record.

This ensures that resources remain organised, searchable, verifiable, and useful to future students.

**Campus Vault — Learn together. Share knowledge. Stay prepared.**