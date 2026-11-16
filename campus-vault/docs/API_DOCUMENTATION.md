# API DOCUMENTATION

## Campus Vault API

**Version:** 1.0  
**Status:** Partially implemented — Worker identity/profile endpoints are available; academic, resource, and admin endpoints remain proposed.
**Base URL:** `/api/v1`  
**Backend:** Cloudflare Workers  
**Authentication:** Firebase Authentication

---

## 1. Purpose

This document defines the API contract for Campus Vault.

The API connects the student-facing application and admin dashboard to the backend services responsible for:

- User profiles and account information.
- Departments, courses, and academic sessions.
- Academic resource discovery.
- Resource previews and downloads.
- Student resource submissions.
- Admin moderation and resource management.
- User and role management.
- Platform analytics and activity logs.

The API is designed around a REST architecture using JSON for requests and responses.

The authentication and student-profile endpoints in §3 are implemented in the
Cloudflare Worker. Other endpoints described here remain proposed and must be
implemented before they can be used.

## 2. API conventions

### 2.1 Base URL

All API routes use the `/api/v1` prefix.

Example:

`https://api.example.com/api/v1/departments`

The production API domain will be configured before deployment.

### 2.2 Request headers

Protected endpoints require a Firebase ID token.

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
Content-Type: application/json
Accept: application/json
```

The frontend obtains the ID token from Firebase Authentication and sends it with each protected request.

The backend must verify the token before processing the request.

### 2.3 Response format

Successful responses should follow a consistent structure.

```json
{
  "success": true,
  "data": {
    "id": "resource_123",
    "title": "Introduction to Geology"
  },
  "meta": {}
}
```

The `meta` property is optional and may contain pagination information or other response metadata.

Error responses should follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted information is invalid.",
    "details": {}
  }
}
```

Never return internal stack traces, private storage credentials, Firebase secrets, or sensitive implementation details.

### 2.4 HTTP status codes

| Status | Meaning |
|---|---|
| 200 | Request successful |
| 201 | Resource created |
| 202 | Request accepted for processing |
| 204 | Successful request with no response body |
| 400 | Invalid request |
| 401 | Authentication required or invalid |
| 403 | Permission denied |
| 404 | Resource not found |
| 409 | Conflict or duplicate operation |
| 413 | File or request too large |
| 415 | Unsupported file type |
| 422 | Validation failed |
| 429 | Too many requests |
| 500 | Internal server error |
| 503 | Service temporarily unavailable |

## 3. Authentication and user profiles

Firebase Authentication handles account registration, login, email verification, and password recovery.

The backend provides additional profile and account-management functionality.

### 3.1 Get current user

`GET /auth/session`

**Access:** Authenticated users with a verified email and active profile.

Returns the current user's Firestore-backed profile. The profile must already
exist; this endpoint does not create it.

Example response:

```json
{
  "success": true,
  "data": {
    "profile": {
      "uid": "firebase-user-id",
      "fullName": "Samuel Oluwafemi",
      "email": "student@example.com",
      "departmentId": null,
      "level": null,
      "role": "student",
      "isActive": true,
      "emailVerified": true,
      "createdAt": "2026-11-15T16:00:00.000Z",
      "updatedAt": "2026-11-15T16:00:00.000Z"
    },
    "emailVerified": true
  }
}
```

### 3.2 Create the current user's profile

`POST /auth/profile`

**Access:** Authenticated users with a verified email.

Creates a student profile after Firebase Authentication registration. The
backend assigns the authenticated user's UID and email, `student` role, active
status, and timestamps; client role and status fields are never accepted.
Creation is idempotent and returns an existing profile if one already exists.

Example request:

```json
{
  "fullName": "Samuel Oluwafemi"
}
```

Returns the profile/session envelope from §3.1. Department and academic level
are initially `null` and can be completed using §3.3.

### 3.3 Update the current user's academic profile

`PATCH /auth/profile`

**Access:** Authenticated users with a verified email and active profile.

Updates only the caller's academic level and optional department. The current
pilot accepts department ID `geology` or `null` (for FUNAAB departments not yet
listed) and academic levels 100, 200, 300, 400, or 500.

Example request:

```json
{
  "departmentId": "geology",
  "level": 400
}
```

The backend rejects attempts to change protected fields such as:

- `role`
- `isActive`
- `email`
- `uid`
- Account approval privileges

The update is limited to the caller's profile document. `departmentId` may be
`null`; `level` is required. Returns the updated profile/session envelope from
§3.1.

The routes in this section are relative to the `/api/v1` base URL and require
the Firebase ID token in the `Authorization: Bearer <token>` header. Requests
are JSON and responses use the standard success/error envelopes in §2.

## 4. Academic data endpoints

These endpoints provide the information needed to organise and browse the academic library.

### 4.1 List departments

`GET /departments`

**Access:** Authenticated users.

Returns active departments.

Example response:

```json
{
  "success": true,
  "data": [
    {
      "id": "geology",
      "name": "Geology",
      "code": "GLY",
      "status": "active"
    },
    {
      "id": "computer-science",
      "name": "Computer Science",
      "code": "CSC",
      "status": "active"
    }
  ]
}
```

### 4.2 Get department details

`GET /departments/:departmentId`

**Access:** Authenticated users.

Returns department information and relevant academic details.

### 4.3 List courses

`GET /courses`

**Access:** Public.

The current Worker implementation supports the provisional FUNAAB Geology seed catalog
at `GET /courses?departmentId=geology`. Its records are derived from reference filenames,
not an official course handbook. Course titles and semesters are unverified, level 300 is
inferred from course-code prefixes, and listed filenames are not hosted resources. It also
returns level-wide past-question filenames that cannot be mapped to an individual course.
This endpoint does not read from Firestore; other department IDs return `404`.

The query parameters below describe the planned full catalog API. Filters other than
`departmentId` are not currently implemented by this provisional endpoint.

Supported query parameters:

| Parameter | Description |
|---|---|
| `departmentId` | Filter by department |
| `level` | Filter by academic level |
| `semester` | Filter by semester |
| `search` | Search course title or code |
| `cursor` | Pagination cursor |
| `limit` | Number of records to return |

Example:

`GET /courses?departmentId=geology&level=400&semester=first&limit=20`

### 4.4 Get course details

`GET /courses/:courseId`

**Access:** Authenticated users.

Returns course information, including:

- Course title.
- Course code.
- Department.
- Academic level.
- Semester.
- Available resource categories.

Resource availability should be calculated from approved resources rather than manually maintained counts.

### 4.5 List academic sessions

`GET /academic-sessions`

**Access:** Authenticated users.

Returns available academic sessions.

Optional query parameter:

`?status=active`

Example response:

```json
{
  "success": true,
  "data": [
    {
      "id": "2025-2026",
      "name": "2025/2026",
      "status": "active"
    }
  ]
}
```

## 5. Academic resource endpoints

These endpoints allow students to discover and access approved academic resources.

### 5.1 List resources for a course

`GET /courses/:courseId/resources`

**Access:** Authenticated users.

Supported query parameters:

| Parameter | Description |
|---|---|
| `resourceType` | Filter by resource type |
| `academicSessionId` | Filter by academic session |
| `level` | Filter by level |
| `semester` | Filter by semester |
| `cursor` | Pagination cursor |
| `limit` | Number of results |

Only approved and accessible resources should be returned.

Example:

`GET /courses/gly401/resources?resourceType=past-question&limit=20`

### 5.2 Get resource details

`GET /resources/:resourceId`

**Access:** Authenticated users.

Returns resource metadata.

Example response:

```json
{
  "success": true,
  "data": {
    "id": "resource_123",
    "title": "Structural Geology Past Questions",
    "description": "Past examination questions for revision.",
    "resourceType": "past-question",
    "courseId": "gly401",
    "academicSessionId": "2024-2025",
    "file": {
      "originalName": "gly401-past-questions.pdf",
      "mimeType": "application/pdf",
      "size": 2457600
    },
    "downloadCount": 45,
    "approvalStatus": "approved"
  }
}
```

The response must not expose private storage keys, permanent public file URLs, or administrative information.

### 5.3 Generate preview URL

`POST /resources/:resourceId/preview-url`

**Access:** Authenticated users.

Generates a temporary URL for viewing an approved resource.

Example response:

```json
{
  "success": true,
  "data": {
    "previewUrl": "https://temporary-storage-url.example",
    "expiresAt": "2026-11-14T15:30:00Z"
  }
}
```

The URL must expire after a short period.

### 5.4 Generate download URL

`POST /resources/:resourceId/download-url`

**Access:** Authenticated users.

Generates a temporary download URL for an approved resource.

Example response:

```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://temporary-storage-url.example",
    "expiresAt": "2026-11-14T15:30:00Z",
    "fileName": "gly401-past-questions.pdf"
  }
}
```

The backend should record the download request.

Important: issuing a download URL does not prove that the file was successfully downloaded. If accurate completed-download statistics are required, use a verified download-completion mechanism or reliable storage access logs.

## 6. Student resource submissions

Students and authorised contributors can submit academic resources for review.

Student submissions must not become publicly accessible immediately after upload.

### 6.1 Request a submission upload URL

`POST /submissions/upload-intents`

**Access:** Student and contributor roles.

Example request:

```json
{
  "title": "Introduction to Mineralogy Notes",
  "description": "Lecture notes for revision.",
  "departmentId": "geology",
  "courseId": "gly401",
  "level": "400",
  "semester": "first",
  "academicSessionId": "2025-2026",
  "resourceType": "lecture-note",
  "file": {
    "originalName": "mineralogy-notes.pdf",
    "mimeType": "application/pdf",
    "size": 5242880,
    "sha256": "example-sha256-hash"
  }
}
```

The backend must:

1. Authenticate the user.
2. Confirm that the account is active.
3. Validate the supplied metadata.
4. Validate the file size and permitted file type.
5. Confirm that the department, course, and academic session exist.
6. Generate a private storage key.
7. Create a submission with an `uploading` status.
8. Generate a short-lived upload URL.

Example response:

```json
{
  "success": true,
  "data": {
    "submissionId": "submission_123",
    "uploadUrl": "https://temporary-upload-url.example",
    "storageKey": "private/submissions/submission_123",
    "expiresAt": "2026-11-14T15:30:00Z",
    "requiredHeaders": {
      "Content-Type": "application/pdf"
    }
  }
}
```

The frontend uploads the file directly to the storage provider using the returned temporary URL.

The frontend must not receive permanent storage credentials.

### 6.2 Complete a submission upload

`POST /submissions/:submissionId/complete`

**Access:** Submission owner or authorised admin.

After uploading the file, the frontend calls this endpoint.

The backend must:

- Confirm ownership or admin authority.
- Confirm that the upload intent is valid and has not expired.
- Verify that the file exists in private storage.
- Check actual file size and content type.
- Verify the checksum where supported.
- Confirm that the file meets the upload requirements.
- Change the submission status to `pending`.

Example response:

```json
{
  "success": true,
  "data": {
    "submissionId": "submission_123",
    "status": "pending",
    "message": "Your resource has been submitted for review."
  }
}
```

The completion operation must be idempotent so that retrying a request does not create duplicate submissions.

### 6.3 Get my submissions

`GET /submissions/mine`

**Access:** Authenticated students and contributors.

Returns the current user's submissions.

Optional query parameters:

- `status`
- `cursor`
- `limit`

Example response:

```json
{
  "success": true,
  "data": [
    {
      "id": "submission_123",
      "title": "Introduction to Mineralogy Notes",
      "status": "pending",
      "submittedAt": "2026-11-14T12:00:00Z"
    }
  ]
}
```

### 6.4 Get a submission

`GET /submissions/:submissionId`

**Access:** Submission owner or admin.

Returns submission information and moderation status.

A student must never be able to inspect another student's private submission.

## 7. Admin moderation endpoints

Only authorised admins can access these endpoints in the initial MVP.

### 7.1 Get submission review queue

`GET /admin/submissions`

**Access:** Admin.

Supported query parameters:

- `status`
- `departmentId`
- `courseId`
- `resourceType`
- `cursor`
- `limit`

The default queue should return pending submissions.

### 7.2 Approve a submission

`POST /admin/submissions/:submissionId/approve`

**Access:** Admin.

Example request:

```json
{
  "reviewNote": "Reviewed and approved."
}
```

The backend must:

1. Verify admin privileges.
2. Confirm that the submission exists.
3. Confirm that its status is `pending`.
4. Revalidate the stored file and metadata.
5. Create the approved resource record.
6. Update the submission status.
7. Record the reviewer and review timestamp.
8. Write an audit log.

The resource creation and submission status update should be performed atomically where possible using a Firestore transaction.

Approval must be idempotent. Repeated approval requests must not create duplicate resources.

### 7.3 Reject a submission

`POST /admin/submissions/:submissionId/reject`

**Access:** Admin.

Example request:

```json
{
  "reviewNote": "The document is incomplete or does not meet submission requirements."
}
```

The backend must:

- Confirm admin privileges.
- Confirm the submission is pending.
- Update its status to `rejected`.
- Store the review note.
- Record the reviewer and timestamp.
- Write an audit log.

Rejected files remain private and must not be available through student resource endpoints.

## 8. Admin resource management

### 8.1 Create an admin resource upload

`POST /admin/resources/upload-intents`

**Access:** Admin.

Allows an admin to upload a resource directly into the library.

The request contains the resource metadata and file metadata.

The backend validates the request and returns a short-lived upload URL.

### 8.2 Complete an admin resource upload

`POST /admin/resources/upload-complete`

**Access:** Admin.

After verifying the uploaded file, the backend creates the resource record.

For the initial MVP, admin uploads may be published directly after successful validation and explicit admin submission.

The backend must still record who uploaded and published the resource.

### 8.3 Update resource metadata

`PATCH /admin/resources/:resourceId`

**Access:** Admin.

Permitted fields include:

- Title.
- Description.
- Department.
- Course.
- Academic level.
- Semester.
- Academic session.
- Resource type.

Protected fields such as `uploadedBy`, `approvalStatus`, `storageKey`, and moderation history must not be freely editable through a generic metadata update.

### 8.4 Archive a resource

`POST /admin/resources/:resourceId/archive`

**Access:** Admin.

Archives a resource without permanently deleting its file.

Archived resources must no longer appear in normal student library results.

### 8.5 Restore an archived resource

`POST /admin/resources/:resourceId/restore`

**Access:** Admin.

Restores an archived resource after the backend verifies that the file still exists and the metadata is valid.

### 8.6 Delete a resource

`DELETE /admin/resources/:resourceId`

**Access:** Admin.

Permanent deletion should be restricted and protected by an explicit confirmation process.

The default removal action should be archiving.

If permanent deletion is implemented, the backend must consider retention requirements, audit history, backups, and storage cleanup.

## 9. Admin academic management

These endpoints allow admins to maintain the academic structure.

### Departments

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/departments` | List departments |
| POST | `/admin/departments` | Create department |
| PATCH | `/admin/departments/:id` | Update department |
| POST | `/admin/departments/:id/archive` | Archive department |

### Courses

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/courses` | List courses |
| POST | `/admin/courses` | Create course |
| PATCH | `/admin/courses/:id` | Update course |
| POST | `/admin/courses/:id/archive` | Archive course |

### Academic sessions

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/academic-sessions` | List sessions |
| POST | `/admin/academic-sessions` | Create session |
| PATCH | `/admin/academic-sessions/:id` | Update session |
| POST | `/admin/academic-sessions/:id/archive` | Archive session |

The backend must prevent invalid references and accidental deletion of academic records associated with existing resources.

## 10. Admin user management

### 10.1 List users

`GET /admin/users`

**Access:** Admin.

Supported query parameters:

- `role`
- `status`
- `departmentId`
- `search`
- `cursor`
- `limit`

### 10.2 Update user role

`PATCH /admin/users/:userId/role`

**Access:** Admin.

Example request:

```json
{
  "role": "contributor"
}
```

Allowed roles in the initial MVP:

- `student`
- `contributor`
- `admin`

Role changes must be validated on the backend.

Users must not be allowed to grant themselves administrative privileges.

The backend should prevent removal or demotion of the last active administrator.

### 10.3 Update user status

`PATCH /admin/users/:userId/status`

**Access:** Admin.

Example request:

```json
{
  "status": "suspended"
}
```

Possible statuses:

- `active`
- `suspended`
- `disabled`

Suspended or disabled accounts must not be allowed to perform protected operations.

## 11. Admin analytics and activity logs

### 11.1 Analytics overview

`GET /admin/analytics/overview`

**Access:** Admin.

Returns high-level platform statistics, including:

- Total registered users.
- Active users.
- Total approved resources.
- Pending submissions.
- Rejected submissions.
- Total download requests.
- Resources grouped by department.
- Resources grouped by resource type.

Example response:

```json
{
  "success": true,
  "data": {
    "totalUsers": 120,
    "activeUsers": 105,
    "approvedResources": 250,
    "pendingSubmissions": 12,
    "rejectedSubmissions": 4,
    "downloadRequests": 850
  }
}
```

These values must be calculated from trusted backend data.

### 11.2 List activity logs

`GET /admin/activity-logs`

**Access:** Admin.

Supported query parameters:

- `actorId`
- `action`
- `resourceType`
- `from`
- `to`
- `cursor`
- `limit`

Activity logs should be read-only through the API.

Clients must never be allowed to create, edit, or delete audit records directly.

## 12. Pagination

List endpoints should use cursor-based pagination.

Default page size: 20 records.

Maximum page size: 50 records.

Example request:

`GET /courses?departmentId=geology&limit=20`

Example response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "nextCursor": "opaque-cursor-value",
    "hasMore": true
  }
}
```

The frontend uses `nextCursor` to request the next page.

The backend must validate pagination parameters and avoid exposing internal database document paths unnecessarily.

## 13. Validation rules

All validation must happen on the backend, even when the frontend already validates the same information.

Recommended validation approach: Zod schemas.

### General validation

- Required fields must not be empty.
- IDs must reference existing records.
- String lengths must have sensible limits.
- Enum values must belong to approved lists.
- Unsupported fields must be rejected or ignored according to the endpoint contract.
- Users cannot override protected fields.

### File validation

Initial proposed upload limit: 20MB per file.

Allowed file types for the MVP:

- PDF documents.

Additional formats may be introduced later after security and preview support are implemented.

File validation must include:

- File extension.
- Declared MIME type.
- Actual file content or file signature where possible.
- File size.
- Checksum verification.
- Upload intent ownership.
- Upload intent expiry.

Do not trust a filename or browser-provided MIME type as proof that a file is safe.

## 14. Error codes

| Error code | Meaning |
|---|---|
| `AUTH_REQUIRED` | Authentication is required |
| `TOKEN_INVALID` | Firebase token is invalid |
| `ACCOUNT_INACTIVE` | Account is suspended or disabled |
| `EMAIL_NOT_VERIFIED` | Email verification is required |
| `PERMISSION_DENIED` | User lacks required permissions |
| `VALIDATION_ERROR` | Request validation failed |
| `RESOURCE_NOT_FOUND` | Resource does not exist |
| `RESOURCE_NOT_APPROVED` | Resource is not available to students |
| `COURSE_NOT_FOUND` | Course does not exist |
| `ACADEMIC_SESSION_NOT_FOUND` | Academic session does not exist |
| `UPLOAD_TOO_LARGE` | File exceeds the permitted size |
| `UNSUPPORTED_FILE_TYPE` | File type is not supported |
| `UPLOAD_EXPIRED` | Upload URL or intent has expired |
| `UPLOAD_VERIFICATION_FAILED` | Uploaded file could not be verified |
| `DUPLICATE_SUBMISSION` | Duplicate submission detected |
| `SUBMISSION_NOT_PENDING` | Submission is not awaiting review |
| `RATE_LIMITED` | Request limit exceeded |
| `INTERNAL_ERROR` | Unexpected server error |

Error messages should be understandable to users while avoiding disclosure of sensitive backend details.

## 15. Security requirements

Every protected endpoint must enforce the following:

1. Verify the Firebase ID token.
2. Retrieve the current user record.
3. Confirm that the account is active.
4. Check the user's role and permissions.
5. Validate all submitted data.
6. Verify resource ownership where applicable.
7. Apply rate limits to sensitive operations.
8. Record important administrative actions.

Additional requirements:

- Admin operations must never rely on frontend-only role checks.
- Firestore Admin SDK operations must perform their own authorisation checks because the SDK bypasses Firestore Security Rules.
- Student submissions must remain private until approved.
- Storage buckets must remain private.
- Temporary upload and download URLs must expire.
- Secrets must be stored in server-side environment configuration.
- CORS must allow only approved application origins.
- Avoid returning private student information in public resource responses.

## 16. Rate limiting

Rate limits should be applied to prevent abuse.

Sensitive operations that require rate limiting include:

- Authentication-related backend requests.
- Resource upload-intent creation.
- Submission completion.
- Preview URL generation.
- Download URL generation.
- Admin moderation actions.

Initial rate limits should be determined during testing based on legitimate usage.

Rate limits must be enforced server-side, not only in the frontend.

## 17. Idempotency and reliability

Certain requests may be retried because of network interruptions.

The backend should support idempotency for operations such as:

- Upload completion.
- Submission approval.
- Submission rejection.
- Admin resource creation.

An idempotency key may be supplied through:

`Idempotency-Key: <unique-request-key>`

Repeated requests using the same key should not create duplicate records or repeat irreversible operations.

For operations involving both Firestore and object storage, the backend must handle partial failures and provide a cleanup or retry strategy.

## 18. Date and time format

All API timestamps should use ISO 8601 format.

Example:

`2026-11-14T12:30:00Z`

Firestore timestamps must be serialised consistently before being returned to the frontend.

The API should use UTC for stored timestamps. The frontend can display dates in the user's local timezone.

## 19. Frontend integration expectations

The frontend should use a central API service rather than scattering direct fetch requests across components.

Suggested structure:

```text
src/
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── departments.ts
│   ├── courses.ts
│   ├── resources.ts
│   ├── submissions.ts
│   └── admin.ts
```

The API service should handle:

- Firebase ID token retrieval.
- Authentication headers.
- JSON serialisation.
- Error handling.
- Pagination.
- Request cancellation where appropriate.
- Consistent response parsing.

The frontend must not contain private storage credentials or administrative secrets.

## 20. API implementation phases

### Phase 1 — Core functionality

- Authentication integration.
- Current user profile.
- Department endpoints.
- Course endpoints.
- Academic session endpoints.
- Resource listing and details.
- Resource availability.

### Phase 2 — Resource access

- Preview URL generation.
- Download URL generation.
- Download request tracking.
- Pagination and filtering.

### Phase 3 — Student submissions

- Upload-intent creation.
- Direct storage upload.
- Upload completion and verification.
- Submission history.
- Submission status tracking.

### Phase 4 — Admin operations

- Submission review queue.
- Approval and rejection.
- Admin resource uploads.
- Resource editing and archiving.
- Department and course management.
- Academic session management.

### Phase 5 — Platform management

- User management.
- Role management.
- Analytics.
- Activity logs.
- Rate limiting and operational monitoring.

## 21. API acceptance criteria

The API is considered ready for the MVP when:

- Authenticated users can retrieve their profiles.
- Students can browse departments and courses.
- Students can filter and discover approved resources.
- Students can preview and download approved resources.
- Students can submit permitted academic materials.
- Uploaded files are verified before entering the review queue.
- Students can view their submission history.
- Admins can review, approve, and reject submissions.
- Approved submissions become accessible through the library.
- Admins can manage academic records and resources.
- Students cannot modify administrative data or publish resources.
- Private storage files cannot be accessed through permanent public URLs.
- API errors are consistent and understandable.
- Pagination works correctly.
- Important administrative actions are recorded.
- Backend authorisation is tested independently of frontend restrictions.

---

## 22. Important implementation notes

This API specification is a proposed contract, not evidence that the endpoints already exist.

Before implementation, confirm:

1. Whether Campus Vault will initially serve one institution or multiple institutions.
2. Whether course representatives will receive moderation permissions or only contribute resources.
3. Whether students must verify their institutional email before submitting resources.
4. Whether resource availability should be restricted to particular departments or open to all registered students.
5. Whether admin-uploaded resources should be published immediately or pass through the same review process.

The submission lifecycle also introduces temporary `uploading` and potentially `failed` or `expired` states. These should be added to the database schema when the API design is finalised.

**Core principle:** The frontend requests actions; the backend verifies permission, validates data, and controls what actually happens. No critical security decision should depend on the frontend alone.