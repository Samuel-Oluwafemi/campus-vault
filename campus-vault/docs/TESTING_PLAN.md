# TESTING_PLAN

## Campus Vault — Testing Plan

**Version:** 1.0  
**Status:** Proposed — Not Yet Implemented  
**Product:** Campus Vault  
**Testing Approach:** Unit, Integration, Security, End-to-End, and User Acceptance Testing

---

## 1. Purpose

This document defines the testing strategy for Campus Vault.

The purpose is to ensure that the application is functional, secure, reliable, accessible, and ready for real students.

Testing must cover both the student application and the admin dashboard.

The goal is not simply to confirm that buttons work. It is to verify that the entire system behaves correctly, including its backend operations, database records, file storage, and permission controls.

## 2. Testing objectives

The testing process must verify that:

1. Students can register and authenticate successfully.
2. Users can only access features permitted by their roles.
3. Academic records are correctly organised.
4. Students can find relevant academic resources.
5. Approved PDFs can be previewed and downloaded.
6. Student submissions follow the correct review process.
7. Admins can manage resources and academic records.
8. Private documents remain protected.
9. Invalid files and requests are rejected.
10. The application works across supported devices and screen sizes.
11. Errors are handled without corrupting application data.
12. The application can recover from common operational failures.

## 3. Testing levels

Campus Vault will use five main testing levels.

### 3.1 Unit testing

Tests individual functions and components independently.

Examples:

- Form validation.
- Resource filtering.
- Academic level selection.
- File size validation.
- Role permission checks.
- Resource availability calculations.
- Date formatting.

Recommended tools:

- Vitest.
- React Testing Library.

### 3.2 Integration testing

Tests whether multiple parts of the system work together correctly.

Examples:

- Firebase authentication and user profile creation.
- Backend authentication middleware.
- Firestore resource retrieval.
- Storage upload verification.
- Submission approval and resource creation.
- Admin operations and audit logging.

### 3.3 End-to-end testing

Tests complete user journeys from beginning to end.

Examples:

- Student registration to resource download.
- Student submission to admin approval.
- Admin upload to student access.
- Admin suspension of a user.

Recommended tool:

- Playwright.

### 3.4 Security testing

Verifies that unauthorised users cannot access protected data or perform restricted operations.

Examples:

- Student attempting admin operations.
- Accessing another user's submission.
- Downloading an unapproved document.
- Manipulating role information.
- Uploading an unsupported file.
- Reusing an expired upload URL.

### 3.5 User acceptance testing

Involves real students and administrators testing the application.

The purpose is to determine whether Campus Vault solves the academic resource discovery problem in practice.

---

## 4. Testing environments

Testing should be conducted in separate environments.

| Environment | Purpose |
|---|---|
| Local development | Initial feature testing |
| Test environment | Integration and automated testing |
| Staging | Production-like verification |
| Production | Live application monitoring |

Do not use real production student records for ordinary development testing.

Use test accounts and sample academic resources.

### Recommended test data

Create:

- Two or more departments.
- Multiple academic levels.
- Several courses.
- At least two academic sessions.
- Sample lecture notes.
- Sample past questions.
- Sample test questions.
- Test student accounts.
- Test contributor accounts.
- Test admin accounts.

Test documents must be permitted for testing and must not contain private student information.

---

## 5. Authentication testing

**Objective:** Verify that account creation, login, session handling, and profile management work correctly.

| Test ID | Test scenario | Expected result |
|---|---|---|
| AUTH-01 | Register with valid details | Account is created |
| AUTH-02 | Register with an invalid email | Validation error appears |
| AUTH-03 | Register with an existing email | Duplicate account is rejected |
| AUTH-04 | Register with missing fields | Required fields are identified |
| AUTH-05 | Login with valid credentials | User is authenticated |
| AUTH-06 | Login with incorrect password | Login is rejected |
| AUTH-07 | Request password recovery | Recovery process is initiated |
| AUTH-08 | Logout | Session is terminated |
| AUTH-09 | Access protected page without authentication | User is redirected or denied |
| AUTH-10 | Use an invalid Firebase token | Backend rejects the request |
| AUTH-11 | Access account with suspended status | Protected operations are denied |
| AUTH-12 | Attempt to assign oneself admin privileges | Operation is rejected |

### Authentication acceptance criteria

- Valid users can authenticate.
- Invalid credentials are rejected.
- Protected routes require authentication.
- Backend endpoints verify Firebase tokens.
- User roles cannot be modified through ordinary profile updates.
- Suspended accounts cannot perform protected operations.

---

## 6. User profile testing

**Objective:** Ensure that academic and personal information is correctly managed.

| Test ID | Test scenario | Expected result |
|---|---|---|
| USER-01 | Complete profile with valid information | Profile is saved |
| USER-02 | Select a valid department | Department is associated correctly |
| USER-03 | Select an invalid department ID | Backend rejects the request |
| USER-04 | Update permitted profile fields | Changes are saved |
| USER-05 | Attempt to change role through profile update | Request is rejected |
| USER-06 | Retrieve current profile | Correct user information is returned |
| USER-07 | Access another user's private profile data | Access is denied unless authorised |

---

## 7. Academic data testing

**Objective:** Verify that departments, courses, academic levels, semesters, and sessions are organised correctly.

| Test ID | Test scenario | Expected result |
|---|---|---|
| ACAD-01 | Retrieve departments | Active departments are returned |
| ACAD-02 | Create a department as admin | Department is created |
| ACAD-03 | Create a course with valid details | Course is created |
| ACAD-04 | Associate course with invalid department | Request is rejected |
| ACAD-05 | Retrieve courses by department | Correct courses are returned |
| ACAD-06 | Filter courses by academic level | Correct results are returned |
| ACAD-07 | Filter courses by semester | Correct results are returned |
| ACAD-08 | Create an academic session | Session is created |
| ACAD-09 | Archive a course | Course is no longer available for new normal browsing |
| ACAD-10 | Retrieve archived academic records | Archived records follow the defined admin access policy |

### Academic data acceptance criteria

- Course associations are correct.
- Invalid references are rejected.
- Duplicate records are handled according to the data model.
- Archived records do not appear in normal student results.
- Academic records remain consistent with associated resources.

---

## 8. Resource discovery testing

**Objective:** Verify that students can find the correct academic materials.

| Test ID | Test scenario | Expected result |
|---|---|---|
| RES-01 | Open academic library | Library loads |
| RES-02 | Search using course code | Matching courses appear |
| RES-03 | Search using course title | Relevant courses appear |
| RES-04 | Filter by department | Results match selected department |
| RES-05 | Filter by level | Results match selected level |
| RES-06 | Filter by semester | Results match selected semester |
| RES-07 | Filter by resource type | Only matching resources appear |
| RES-08 | Filter by academic session | Correct session resources appear |
| RES-09 | Combine multiple filters | All selected filters are applied |
| RES-10 | Search for nonexistent resource | Clear empty state appears |
| RES-11 | Retrieve resources for a course | Only approved resources appear |
| RES-12 | Request next page of results | Correct next page is returned |

### Resource availability testing

Verify that a course can independently show:

- Lecture notes available.
- Past questions available.
- Test questions missing.
- Handouts available.
- Additional materials missing.

A course must not be marked as fully populated merely because one resource exists.

---

## 9. File upload testing

**Objective:** Ensure that file uploads are valid, secure, and reliable.

Initial proposed upload limit: 20MB.

Initial supported format: PDF.

| Test ID | Test scenario | Expected result |
|---|---|---|
| FILE-01 | Upload valid PDF within size limit | Upload succeeds |
| FILE-02 | Upload PDF exceeding size limit | Upload is rejected |
| FILE-03 | Upload unsupported file type | Upload is rejected |
| FILE-04 | Upload executable file renamed as PDF | File is rejected |
| FILE-05 | Upload invalid or corrupted PDF | File is rejected or flagged |
| FILE-06 | Upload with missing metadata | Request is rejected |
| FILE-07 | Upload using expired upload URL | Upload fails |
| FILE-08 | Complete upload for nonexistent intent | Request is rejected |
| FILE-09 | Complete upload without actual file | Verification fails |
| FILE-10 | Upload with mismatched checksum | Verification fails |
| FILE-11 | Retry upload completion | No duplicate submission is created |
| FILE-12 | Interrupt upload | User receives recoverable error feedback |
| FILE-13 | Upload duplicate document | Duplicate handling follows defined policy |
| FILE-14 | Upload a document with a misleading filename | Actual file content is checked |

### File upload acceptance criteria

- File size is enforced by the backend and storage configuration.
- File content is verified.
- Upload intents are associated with the correct user.
- Expired upload URLs cannot be used as valid completed submissions.
- Incomplete uploads do not become published resources.
- Failed uploads can be retried safely.
- Duplicate detection does not automatically reject legitimate reuse of the same document across academic sessions.

---

## 10. Resource preview and download testing

**Objective:** Ensure that approved documents are accessible while private documents remain protected.

| Test ID | Test scenario | Expected result |
|---|---|---|
| DL-01 | Preview approved resource | PDF preview loads |
| DL-02 | Download approved resource | File downloads successfully |
| DL-03 | Preview pending submission | Access is denied |
| DL-04 | Download rejected submission | Access is denied |
| DL-05 | Access archived resource as student | Normal access is denied |
| DL-06 | Request nonexistent resource | Not-found response is returned |
| DL-07 | Use expired preview URL | Access expires |
| DL-08 | Use expired download URL | Access expires |
| DL-09 | Attempt direct access to private storage | Access is denied |
| DL-10 | Request resource from another course | Access follows the platform's resource access policy |
| DL-11 | Download large permitted PDF | Download completes or reports a clear failure |
| DL-12 | Download using a mobile device | File downloads correctly |

### Download acceptance criteria

- Only approved resources are accessible to students.
- Storage buckets remain private.
- Temporary URLs expire.
- Resource metadata does not expose permanent public file locations.
- Download requests are recorded consistently.
- Failed downloads are not falsely counted as completed downloads.

---

## 11. Student submission testing

**Objective:** Verify that the complete student contribution workflow works correctly.

| Test ID | Test scenario | Expected result |
|---|---|---|
| SUB-01 | Submit resource with valid metadata and PDF | Submission is created |
| SUB-02 | Submit without title | Validation error appears |
| SUB-03 | Submit with invalid course ID | Request is rejected |
| SUB-04 | Submit unsupported file | Upload is rejected |
| SUB-05 | Complete valid upload | Submission becomes pending |
| SUB-06 | Open My Submissions | User sees their own submissions |
| SUB-07 | View another user's submission | Access is denied |
| SUB-08 | Submit duplicate request using same idempotency key | Duplicate is not created |
| SUB-09 | Submit without required permission | Request is rejected |
| SUB-10 | Attempt to publish own submission | Operation is rejected |

### Submission acceptance criteria

- Students can submit permitted resources.
- Every submission has an identifiable owner.
- Submission metadata is validated.
- Uploaded files are verified.
- Submissions remain private while pending.
- Students can track their own submission status.

---

## 12. Admin moderation testing

**Objective:** Verify that only authorised admins can review and publish student submissions.

| Test ID | Test scenario | Expected result |
|---|---|---|
| MOD-01 | Admin opens review queue | Pending submissions appear |
| MOD-02 | Admin opens a submission | Details and permitted preview are available |
| MOD-03 | Admin approves a valid submission | Resource becomes approved |
| MOD-04 | Admin rejects a submission | Status changes to rejected |
| MOD-05 | Admin adds review note | Note is saved |
| MOD-06 | Student attempts approval endpoint | Request is rejected |
| MOD-07 | Contributor attempts approval endpoint | Request is rejected in the initial MVP |
| MOD-08 | Approve already approved submission | Duplicate resource is not created |
| MOD-09 | Reject already rejected submission | Invalid state transition is rejected |
| MOD-10 | Approve missing submission | Not-found response is returned |
| MOD-11 | Approve invalid stored file | Approval is rejected |
| MOD-12 | Complete approval | Audit record is created |

### Moderation acceptance criteria

- Only authorised admins can approve or reject.
- Approved submissions create the correct resource records.
- Rejected files remain private.
- Review notes and reviewer details are preserved.
- Repeated operations do not create duplicate resources.
- Important moderation actions are logged.

---

## 13. Admin dashboard testing

**Objective:** Verify that administrative management functions work correctly.

| Test ID | Test scenario | Expected result |
|---|---|---|
| ADM-01 | Admin opens dashboard | Dashboard loads |
| ADM-02 | Admin views resource list | Resources appear |
| ADM-03 | Admin edits resource metadata | Changes are saved |
| ADM-04 | Admin archives resource | Resource becomes archived |
| ADM-05 | Admin restores resource | Resource becomes available again |
| ADM-06 | Admin creates department | Department is created |
| ADM-07 | Admin creates course | Course is created |
| ADM-08 | Admin creates academic session | Session is created |
| ADM-09 | Admin searches users | Matching users appear |
| ADM-10 | Admin changes user role | Role is updated |
| ADM-11 | Admin suspends user | Account becomes suspended |
| ADM-12 | Admin accesses analytics | Statistics are returned |
| ADM-13 | Admin views activity logs | Recorded actions appear |
| ADM-14 | Non-admin accesses admin API | Request is rejected |
| ADM-15 | Last active admin attempts demotion | Operation is rejected |

---

## 14. Security testing

Security testing is mandatory before the first production release.

### 14.1 Authentication security

Test:

- Invalid Firebase tokens.
- Expired tokens.
- Missing authentication headers.
- Suspended accounts.
- Disabled accounts.
- Session expiration.
- Unauthorised API access.

### 14.2 Role and permission security

Test:

- Student attempting admin actions.
- Contributor attempting admin-only moderation.
- User attempting to change their own role.
- User attempting to modify another user's profile.
- User attempting to approve their own submission.
- Admin role changes through unauthorised routes.

### 14.3 Storage security

Test:

- Direct access to private bucket objects.
- Expired signed URLs.
- Reused upload URLs.
- Incorrect storage keys.
- Uploads using another user's upload intent.
- Access to pending and rejected files.
- Access after resource archiving.

### 14.4 Input security

Test:

- Malformed JSON.
- Unexpected fields.
- Excessively long input.
- Invalid identifiers.
- Script injection attempts in text fields.
- File extension spoofing.
- MIME type spoofing.
- Oversized requests.

### 14.5 Operational security

Verify:

- Secrets are not exposed in frontend bundles.
- Environment variables are configured correctly.
- CORS is restricted to approved origins.
- Sensitive actions are rate-limited.
- Admin actions are logged.
- Error responses do not expose internal implementation details.
- Firestore security rules are tested independently.
- Backend operations using privileged SDK access enforce their own permissions.

### Security acceptance criteria

No known critical or high-severity security vulnerability should remain unresolved before production release.

---

## 15. UI and responsive testing

**Objective:** Ensure that the application is usable across supported screen sizes.

Test the following screens:

- Landing page.
- Registration.
- Login.
- Student dashboard.
- Academic library.
- Course details.
- Resource viewer.
- Submit resource.
- My submissions.
- Admin dashboard.
- Admin resource management.
- Admin review queue.

### Device coverage

| Device category | Test focus |
|---|---|
| Small Android phone | Layout and touch controls |
| Large Android phone | Responsive layouts |
| iPhone | Safari compatibility |
| Tablet | Navigation and content arrangement |
| Desktop | Full dashboard functionality |

### UI test cases

- No horizontal page overflow.
- Navigation works on mobile.
- Forms are usable on touch screens.
- Buttons have adequate touch targets.
- Text remains readable.
- Tables adapt to small screens.
- PDF preview remains usable.
- Loading indicators appear correctly.
- Error messages are understandable.
- Empty states display useful guidance.
- Keyboard navigation works.
- Focus indicators remain visible.

Target WCAG 2.2 Level AA where practical.

---

## 16. Performance testing

**Objective:** Identify performance problems before they affect real students.

Test:

- Initial page loading.
- Dashboard loading.
- Course listing.
- Resource search.
- Resource filtering.
- Pagination.
- PDF preview.
- File upload.
- File download.
- Admin dashboard data loading.

### Performance considerations

- Avoid retrieving every resource at once.
- Use cursor-based pagination.
- Optimise images.
- Lazy-load nonessential content.
- Avoid unnecessary API requests.
- Handle slow network conditions.
- Keep frontend bundles reasonably small.
- Avoid blocking the main interface during document operations.

Suggested initial targets under a defined test environment:

| Metric | Target |
|---|---|
| Largest Contentful Paint | 2.5 seconds or less |
| Interaction to Next Paint | 200ms or less |
| Cumulative Layout Shift | 0.1 or less |

These are performance goals, not guaranteed results. Measure them on representative devices and network conditions.

---

## 17. Error handling and recovery testing

**Objective:** Ensure that failures do not leave the platform in inconsistent states.

Test scenarios:

- Internet connection interrupted during upload.
- Storage provider temporarily unavailable.
- Firestore request fails.
- Firebase token expires.
- User refreshes during an upload.
- Upload URL expires before completion.
- Approval operation is retried.
- Resource is archived while a user is viewing it.
- Backend returns an unexpected error.

Expected behaviour:

- Display a clear error message.
- Preserve user-entered form information where safe.
- Provide a retry option where appropriate.
- Avoid duplicate database records.
- Avoid publishing incomplete files.
- Clean up abandoned temporary uploads.
- Record relevant backend failures without exposing sensitive information.

For operations involving multiple services, implement safe retry and reconciliation procedures.

---

## 18. End-to-end testing

The following complete workflows must be tested.

### E2E-01: New student onboarding

1. Open Campus Vault.
2. Register a new account.
3. Complete email verification if enabled.
4. Complete academic profile.
5. Log in.
6. Open student dashboard.
7. Browse the academic library.

**Expected result:** The student successfully accesses the platform.

### E2E-02: Find and download a past question

1. Log in.
2. Open the library.
3. Select a department.
4. Select an academic level.
5. Select a semester.
6. Open a course.
7. Select past questions.
8. Choose an academic session.
9. Preview a resource.
10. Download the PDF.

**Expected result:** The student successfully finds and downloads the correct approved resource.

### E2E-03: Submit lecture notes

1. Log in as a student.
2. Open Submit Resource.
3. Enter valid metadata.
4. Select the correct course.
5. Upload a valid PDF.
6. Complete the submission.
7. Open My Submissions.

**Expected result:** The submission appears with pending status.

### E2E-04: Admin approves submission

1. Log in as admin.
2. Open the submission queue.
3. Select the pending submission.
4. Preview the document.
5. Approve the submission.
6. Open the course library as a student.
7. Find the approved resource.

**Expected result:** The approved resource becomes available to students.

### E2E-05: Admin rejects submission

1. Log in as admin.
2. Open a pending submission.
3. Reject it with a review note.
4. Log in as the submission owner.
5. Open My Submissions.

**Expected result:** The submission displays rejected status and its review note, while the file remains inaccessible through student resource endpoints.

### E2E-06: Admin uploads resource

1. Log in as admin.
2. Open resource management.
3. Enter resource metadata.
4. Upload a valid PDF.
5. Complete the upload.
6. Open the relevant course as a student.

**Expected result:** The resource is available according to the admin publishing policy.

---

## 19. User acceptance testing

The first pilot should involve actual students from the initial department.

### Suggested participants

- 30–50 student testers.
- Two or more contributors or course representatives.
- At least one administrator.

The numbers are initial planning targets and can be adjusted.

### Tasks for student testers

Ask students to:

1. Create an account.
2. Find a specific course.
3. Locate a past question.
4. Identify which resource types are missing.
5. Preview a PDF.
6. Download a PDF.
7. Submit a permitted academic resource.
8. Check their submission status.

### Questions to ask

- Was it easy to find the course you needed?
- Did the academic organisation make sense?
- Could you identify the correct resource type?
- Was the PDF preview easy to use?
- Did downloading work correctly?
- Was submitting a resource straightforward?
- What confused you?
- What would you improve?

### Suggested success indicators

- At least 70% of testers can find a requested resource without assistance.
- Students can complete the download workflow.
- Contributors can complete a submission.
- Admins can review submissions without manual database changes.
- No critical security issue is discovered.
- Students understand resource availability and submission statuses.

Collect observations, not just numerical ratings.

---

## 20. Test automation strategy

Automate repeatable tests as the application develops.

### Frontend

Recommended:

- Vitest.
- React Testing Library.
- Playwright.

### Backend

Use:

- Unit tests for validation and business logic.
- Integration tests for Firestore and storage operations.
- Authentication and permission tests.
- API contract tests.

### Continuous integration

A GitHub Actions workflow should eventually run:

1. Dependency installation.
2. TypeScript checks.
3. Linting.
4. Unit tests.
5. Build verification.
6. Integration tests where configured.

Production deployment should not proceed if required checks fail.

---

## 21. Bug severity classification

| Severity | Description | Required action |
|---|---|---|
| Critical | Data breach, unauthorised admin access, major data loss | Block release |
| High | Core workflow broken or significant security issue | Fix before release |
| Medium | Important feature malfunction with workaround | Prioritise fix |
| Low | Minor visual or usability issue | Fix when practical |

Every reported issue should include:

- Bug title.
- Description.
- Steps to reproduce.
- Expected result.
- Actual result.
- Device/browser.
- Severity.
- Screenshot or logs where useful.

Do not include passwords, private tokens, or sensitive student data in bug reports.

---

## 22. Release readiness checklist

### Authentication

- [ ] Registration works.
- [ ] Login works.
- [ ] Password recovery works.
- [ ] Protected routes work.
- [ ] Backend token verification works.
- [ ] Role restrictions work.

### Academic library

- [ ] Departments load.
- [ ] Courses load.
- [ ] Academic sessions load.
- [ ] Search works.
- [ ] Filters work.
- [ ] Resource availability is correct.
- [ ] Pagination works.

### File management

- [ ] Valid PDF upload works.
- [ ] Invalid files are rejected.
- [ ] File size restrictions work.
- [ ] Upload verification works.
- [ ] Preview works.
- [ ] Download works.
- [ ] Private storage is protected.

### Student submissions

- [ ] Submission creation works.
- [ ] Submission status is correct.
- [ ] Students can view their own submissions.
- [ ] Students cannot publish their own submissions.
- [ ] Failed uploads are handled safely.

### Admin dashboard

- [ ] Admin authentication works.
- [ ] Submission queue works.
- [ ] Approval works.
- [ ] Rejection works.
- [ ] Resource management works.
- [ ] Academic management works.
- [ ] User management works.
- [ ] Activity logs work.

### Quality and deployment

- [ ] Mobile responsiveness tested.
- [ ] Desktop responsiveness tested.
- [ ] Accessibility checks completed.
- [ ] Critical performance issues resolved.
- [ ] Error handling tested.
- [ ] Backups configured.
- [ ] Recovery procedure tested.
- [ ] Production environment verified.

---

## 23. Testing completion criteria

Campus Vault is ready for its initial release when:

- All critical authentication tests pass.
- All core academic library workflows pass.
- File uploads and downloads work reliably.
- Student submissions and admin moderation work correctly.
- Backend permissions are independently verified.
- No known critical or high-severity security issue remains unresolved.
- Mobile and desktop interfaces are usable.
- Major error and recovery scenarios are handled.
- User acceptance testing has been conducted.
- Production readiness checks are complete.

Testing should continue after release. New features, database changes, and security-related modifications must introduce appropriate regression tests.

---

## 24. Final testing principle

A feature is not complete merely because it works once during development.

It is complete when it behaves correctly with valid input, rejects invalid input, respects permissions, handles failures, and remains usable in realistic conditions.

**Campus Vault must protect the academic resources students trust it with, while making those resources genuinely easy to access.**