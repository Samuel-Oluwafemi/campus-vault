# Campus Vault — Security and Permissions

**Document:** SECURITY_AND_PERMISSIONS.md  
**Version:** 1.0  
**Status:** Proposed — MVP  
**Authentication:** Firebase Authentication  
**Database:** Cloud Firestore  
**File Storage:** Cloudflare R2  
**Backend:** Cloudflare Workers

---

# 1. Overview

This document defines the security architecture, user permissions, authentication requirements, database access policies, and file protection mechanisms for Campus Vault.

Campus Vault will contain student accounts, academic information, contributed documents, and administrative operations.

The system must ensure that:

- Students can only perform actions permitted by their roles.
- Contributors can submit resources without publishing them directly.
- Administrators can manage and moderate academic resources.
- Uploaded documents remain protected until approved.
- Users cannot gain additional permissions by manipulating frontend code or database requests.
- Sensitive operations are performed through trusted backend services.

Security must be enforced across the frontend, backend, database, and file storage layers.

---

# 2. Security Principles

Campus Vault will follow these principles:

## 2.1 Least Privilege

Every user should receive only the permissions required to perform their responsibilities.

Students should not receive administrative permissions by default.

## 2.2 Server-Side Authorisation

All sensitive operations must be validated by the backend.

The application must never rely solely on frontend conditions to protect privileged actions.

## 2.3 Private File Storage

Academic documents should not be exposed through unrestricted public storage access.

Only authorised requests should receive temporary access to stored files.

## 2.4 Data Integrity

Users must not be able to manipulate important database fields such as:

- User roles.
- Account status.
- Resource approval status.
- Moderation records.
- Download statistics.
- Administrative activity logs.

## 2.5 Accountability

Important administrative actions must be recorded so that changes can be traced to the responsible account.

---

# 3. User Roles

Campus Vault will initially support three roles.

```text
student
contributor
admin
```

## 3.1 Student

A student can:

- Register an account.
- Log in and log out.
- View their own profile.
- Update permitted profile information.
- Browse approved resources.
- Search and filter resources.
- Preview approved documents.
- Download approved documents.
- Submit academic resources.
- View their own submission history.

A student cannot:

- Approve resources.
- Publish resources.
- Modify another user's profile.
- Access the admin dashboard.
- Create administrator accounts.
- Change their own role.
- Access pending resources belonging to other students.
- Delete published academic resources.

## 3.2 Contributor

A contributor has the same access as a student, with additional resource submission privileges.

A contributor can:

- Submit academic materials.
- View their own submissions.
- View submission review statuses.
- Respond to moderation feedback where supported.

A contributor cannot:

- Approve their own submissions.
- Publish resources directly.
- Modify other users' submissions.
- Access administrator operations.

A course representative may be assigned contributor permissions without automatically receiving administrator permissions.

## 3.3 Administrator

An administrator can:

- Access the admin dashboard.
- Manage departments.
- Manage courses.
- Manage academic sessions.
- Upload resources.
- Review submissions.
- Approve resources.
- Reject resources.
- Edit published resource metadata.
- Archive or remove resources.
- Manage user roles.
- Deactivate accounts.
- View administrative activity.
- Monitor resource and storage statistics.

Administrator permissions must be explicitly granted through a trusted backend process.

---

# 4. Permission Matrix

The following matrix defines the initial permission model.

| Action | Student | Contributor | Admin |
|---|---|---|---|
| Register | Yes | Yes | Controlled |
| Log in | Yes | Yes | Yes |
| View own profile | Yes | Yes | Yes |
| Edit permitted profile fields | Yes | Yes | Yes |
| Browse approved resources | Yes | Yes | Yes |
| Preview approved resources | Yes | Yes | Yes |
| Download approved resources | Yes | Yes | Yes |
| Submit resources | Yes | Yes | Yes |
| View own submissions | Yes | Yes | Yes |
| View all submissions | No | No | Yes |
| Approve submissions | No | No | Yes |
| Reject submissions | No | No | Yes |
| Create courses | No | No | Yes |
| Edit courses | No | No | Yes |
| Create departments | No | No | Yes |
| Manage academic sessions | No | No | Yes |
| Manage user roles | No | No | Yes |
| Archive resources | No | No | Yes |
| View admin analytics | No | No | Yes |
| View admin activity logs | No | No | Yes |

Permissions should be checked on every protected backend request.

---

# 5. Authentication Security

Firebase Authentication will manage user identity.

## 5.1 Registration

Registration must:

1. Validate submitted account information.
2. Create the authentication account through Firebase.
3. Require email verification before granting normal student access.
4. Create the corresponding user profile.
5. Assign the default `student` role.
6. Prevent users from choosing privileged roles during registration.

A user must never be able to register as an administrator by submitting:

```json
{
  "role": "admin"
}
```

The backend must ignore or reject client-supplied privileged role values.

## 5.2 Login

After successful authentication:

1. Firebase issues an ID token.
2. The frontend obtains the token.
3. The frontend sends it to protected backend endpoints.
4. The backend verifies the token.
5. The backend retrieves the user's current profile and permissions.
6. The backend authorises or rejects the operation.

The frontend must not be treated as the authority on user identity or permissions.

## 5.3 Password Security

Password handling should be delegated to Firebase Authentication.

Campus Vault must never:

- Store plain-text passwords.
- Store user passwords in Firestore.
- Log passwords.
- Send passwords to custom backend endpoints unnecessarily.

## 5.4 Password Recovery

Password recovery should use Firebase's password reset functionality.

The application should provide clear feedback without exposing whether unrelated accounts exist.

## 5.5 Session Management

The application should:

- Detect expired authentication sessions.
- Handle invalid ID tokens.
- Redirect unauthenticated users to login.
- Require reauthentication for particularly sensitive account operations where appropriate.
- Support account deactivation and revocation of access.

For sensitive administrator operations, the backend should verify current role status rather than relying on potentially stale frontend state.

---

# 6. Role and Permission Enforcement

## 6.1 Backend Role Verification

Every protected request must verify:

- The Firebase ID token is valid.
- The authenticated account exists.
- The account is active.
- The user's current role permits the requested operation.

Example authorisation logic:

```text
Incoming request
       |
       v
Verify Firebase ID token
       |
       v
Retrieve user profile
       |
       v
Check account status
       |
       v
Check required permission
       |
       +--------------------+
       |                    |
       v                    v
  Permission granted   Permission denied
       |                    |
       v                    v
Process operation       Return 403
```

## 6.2 Role Changes

Role changes must be performed through a protected backend operation.

For example:

```http
PATCH /api/admin/users/{userId}/role
```

The backend must:

1. Verify the requesting administrator.
2. Confirm that the target user exists.
3. Validate the requested role.
4. Prevent unauthorised privilege escalation.
5. Update the user's role.
6. Record the action in activity logs.

Only an authorised administrator or a controlled initial provisioning process should be able to assign administrative privileges.

## 6.3 Last Administrator Protection

The system should prevent accidental removal or deactivation of the last active administrator.

Administrative role changes should check that at least one active administrator remains.

---

# 7. Firestore Security

Firestore security rules must restrict direct client access.

The frontend should not be allowed to perform privileged writes simply because a user is authenticated.

## 7.1 General Rules

- Users can read their own profile.
- Users can update only permitted profile fields.
- Users cannot modify their own role.
- Students cannot create approved resource records.
- Students cannot approve or reject submissions.
- Students cannot modify administrative activity logs.
- Only authorised backend operations can modify protected records.
- Public student-facing queries should expose approved resources only.

## 7.2 Example Firestore Rules

The following is an illustrative starting point. It must be adapted and tested against the final database schema before deployment.

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return signedIn() &&
        request.auth.uid == userId;
    }

    function isAdmin() {
      return signedIn() &&
        exists(
          /databases/$(database)/documents/users/$(request.auth.uid)
        ) &&
        get(
          /databases/$(database)/documents/users/$(request.auth.uid)
        ).data.role == "admin" &&
        get(
          /databases/$(database)/documents/users/$(request.auth.uid)
        ).data.isActive == true;
    }

    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();

      allow create, update, delete: if false;
    }

    match /departments/{departmentId} {
      allow read: if signedIn();
      allow write: if false;
    }

    match /courses/{courseId} {
      allow read: if signedIn();
      allow write: if false;
    }

    match /academicSessions/{sessionId} {
      allow read: if signedIn();
      allow write: if false;
    }

    match /resources/{resourceId} {
      allow read: if signedIn() &&
        resource.data.approvalStatus == "approved";

      allow write: if false;
    }

    match /submissions/{submissionId} {
      allow read: if signedIn() &&
        resource.data.uploadedBy == request.auth.uid;

      allow write: if false;
    }

    match /activityLogs/{logId} {
      allow read: if isAdmin();
      allow write: if false;
    }
  }
}
```

### Important implementation note

Cloudflare Workers will use trusted server-side Firestore access for protected operations.

Server-side Firebase Admin SDK or equivalent privileged service access bypasses Firestore Security Rules. Therefore, the backend must independently enforce all authentication, role, ownership, and validation checks.

The example rules above are intentionally restrictive. They should not be deployed unchanged if the frontend needs direct profile updates or other client writes. Those operations should either receive carefully defined rules or go through the backend.

---

# 8. File Storage Security

Cloudflare R2 will store uploaded academic documents.

## 8.1 Private Bucket

The R2 bucket should remain private by default.

Users should not be able to access objects simply by guessing storage paths.

## 8.2 Presigned Upload URLs

The frontend should never receive permanent storage credentials.

Instead, the backend generates a short-lived presigned upload URL after validating the request.

Upload process:

1. User selects a document.
2. Frontend requests upload authorisation.
3. Backend verifies authentication.
4. Backend checks upload permission.
5. Backend validates metadata and file constraints.
6. Backend generates a temporary upload URL.
7. Frontend uploads the file directly to R2.
8. Backend verifies the uploaded object.
9. The corresponding submission or resource metadata is recorded.

Presigned upload URLs should be restricted to the intended object key, method, and short validity period.

## 8.3 Presigned Download URLs

When a student requests an approved resource:

1. Backend verifies authentication.
2. Backend retrieves the resource metadata.
3. Backend checks that the resource is approved and accessible.
4. Backend generates a short-lived download or preview URL.
5. The frontend receives the temporary URL.

The backend must not issue download URLs for pending, rejected, deleted, or otherwise inaccessible resources.

## 8.4 File Validation

Every uploaded file must be checked for:

- Supported MIME type.
- Actual file content.
- File size.
- Valid upload authorisation.
- Malicious or suspicious content where scanning is available.
- Duplicate content where applicable.

Initial maximum file size:

**20 MB per file.**

This limit should be adjustable through configuration.

## 8.5 File Access Separation

The system should distinguish between:

- Pending submission files.
- Approved resource files.
- Archived resource files.

Pending files must never become available through the public student resource library.

---

# 9. Resource Approval Security

Resource approval is a privileged operation.

Only authorised administrators should publish resources in the initial MVP.

## 9.1 Approval Process

```text
Pending Submission
        |
        v
Admin Requests Review
        |
        v
Backend Verifies Admin
        |
        v
Backend Validates Submission
        |
        v
Create Approved Resource
        |
        v
Update Submission Status
        |
        v
Record Activity Log
```

## 9.2 Approval Requirements

Before approval, the backend must verify:

- Submission exists.
- Submission is still pending.
- File exists in storage.
- File passed validation.
- Course exists.
- Department matches the course.
- Academic session exists.
- Required metadata is present.
- Requesting user has admin permission.

## 9.3 Rejection Requirements

When rejecting a submission:

- The submission status becomes `rejected`.
- The reviewing administrator is recorded.
- The review timestamp is recorded.
- An optional review note can be supplied.
- The file remains private.
- The contributor can see the rejection status.

The system should define a retention and cleanup policy for rejected files.

## 9.4 Duplicate Approval Prevention

Approval operations must be idempotent.

If the same approval request is submitted more than once, the backend must not create multiple published resources.

---

# 10. API Security

All protected API endpoints must require authentication.

## 10.1 Authentication Header

```http
Authorization: Bearer <firebase-id-token>
```

## 10.2 Request Validation

All incoming requests must be validated using server-side schemas.

The backend must reject:

- Missing required fields.
- Invalid IDs.
- Unsupported resource types.
- Invalid academic levels.
- Invalid file metadata.
- Unexpected privileged fields.
- Malformed JSON.
- Oversized requests.

## 10.3 Rate Limiting

Rate limiting should be applied to:

- Login-related custom endpoints, if any.
- Upload authorisation requests.
- Submission requests.
- Download URL generation.
- Resource search endpoints.
- Administrative operations.

Firebase should handle normal authentication throttling where applicable.

## 10.4 CORS

Configure CORS to allow only the intended Campus Vault application origins in production.

Do not use unrestricted origins for privileged API endpoints.

CORS is not authentication; backend authorisation must still be enforced.

## 10.5 Error Responses

The backend should return safe error messages.

Example:

```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to perform this action."
  }
}
```

Never expose:

- Private access keys.
- Firebase service credentials.
- Stack traces.
- Internal storage secrets.
- Sensitive user information.

---

# 11. User Data Protection

Campus Vault should collect only information necessary for the platform to operate.

## 11.1 Personal Information

Potentially stored information includes:

- Full name.
- Email address.
- Department.
- Academic level.
- Account role.
- Contribution history.

The application should avoid collecting unnecessary personal information.

## 11.2 Access Restrictions

Students should only be able to view their own private profile and submission history.

Administrative access to user information should be restricted to authorised operations.

## 11.3 Account Deactivation

When an account is deactivated:

- New protected operations must be denied.
- Existing sessions should be invalidated where appropriate.
- Historical contributions should remain traceable.
- The user's academic contributions should not automatically be deleted.

## 11.4 Data Retention

The project should establish a policy for:

- Deactivated accounts.
- Rejected submissions.
- Deleted resources.
- Administrative activity logs.
- Backups.

Retention decisions should balance privacy, operational requirements, and the preservation of legitimate academic resources.

---

# 12. Audit Logging

Important actions must be recorded in the `activityLogs` collection.

Examples:

```text
resource.submitted
resource.approved
resource.rejected
resource.archived
resource.deleted
user.role_changed
user.deactivated
course.created
course.updated
department.created
department.updated
```

Each log should contain:

- Actor ID.
- Action.
- Target ID.
- Target type.
- Timestamp.
- Relevant non-sensitive details.

Activity logs must be created by trusted backend operations.

Do not store passwords, authentication tokens, presigned URLs, or private credentials in logs.

---

# 13. Backup and Recovery Security

Campus Vault must protect against accidental deletion, compromised accounts, and infrastructure failures.

Requirements:

- Back up Firestore data regularly.
- Maintain a backup strategy for R2 objects.
- Restrict backup access to authorised personnel.
- Protect backup credentials.
- Test database restoration.
- Test document restoration.
- Maintain documented recovery procedures.

A backup is only useful if the team can successfully restore it.

---

# 14. Security Testing

Security tests must be performed before the pilot launch.

## 14.1 Authentication Tests

- Unauthenticated users cannot access protected endpoints.
- Invalid tokens are rejected.
- Expired tokens are rejected.
- Inactive accounts cannot perform protected operations.
- Users cannot register with an admin role.
- Users cannot change their own roles.

## 14.2 Permission Tests

- Students cannot access admin endpoints.
- Contributors cannot approve submissions.
- Students cannot view other users' private submissions.
- Only administrators can manage courses.
- Only administrators can publish resources.
- Only authorised users can change roles.

## 14.3 File Security Tests

- Pending documents cannot be downloaded through student-facing access.
- Rejected documents cannot be downloaded.
- Unauthenticated users cannot obtain protected download URLs.
- Expired presigned URLs no longer work.
- Unsupported files are rejected.
- Oversized files are rejected.
- Guessing a storage key does not grant access.

## 14.4 Database Security Tests

- Users cannot edit protected role fields.
- Students cannot create approved resources directly.
- Users cannot modify activity logs.
- Unauthorised users cannot update course records.
- Client-side requests cannot bypass moderation.

---

# 15. Security Acceptance Criteria

The MVP security implementation is ready for pilot testing when:

- [ ] Firebase Authentication is configured.
- [ ] Protected API requests verify ID tokens.
- [ ] Backend permissions are role-based.
- [ ] Users cannot grant themselves admin access.
- [ ] Students cannot publish resources directly.
- [ ] Only authorised administrators can approve submissions.
- [ ] Firestore rules restrict direct client access.
- [ ] R2 storage is private.
- [ ] Uploads use temporary authorisation.
- [ ] Downloads use temporary authorisation.
- [ ] Pending and rejected files remain inaccessible to ordinary students.
- [ ] File validation is performed server-side.
- [ ] Administrative actions are logged.
- [ ] Account deactivation is enforced.
- [ ] Backup and recovery procedures are documented.
- [ ] Security tests pass before pilot deployment.

---

# 16. Final Security Principle

Campus Vault must remain trustworthy as its resource library grows.

Students should be able to contribute without gaining control over publication. Administrators should be able to manage the platform without exposing unnecessary access to student information. Academic documents should remain available only through authorised access.

The system must never confuse a visible frontend control with a real security boundary.

**The backend decides what a user can do. The database preserves the rules. The storage layer protects the files.**

**Campus Vault — Learn together. Share knowledge. Stay prepared.**