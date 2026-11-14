# UI_UX_SPECIFICATION

## Campus Vault — UI/UX Specification

**Version:** 1.0  
**Status:** Proposed — Not Yet Implemented  
**Product:** Campus Vault  
**Platform:** Responsive Web Application

---

## 1. Purpose

This document defines the user interface and user experience requirements for Campus Vault.

It describes the application's structure, navigation, page layouts, user journeys, interactions, responsive behaviour, accessibility requirements, and visual design direction.

The goal is to make academic resources easy to discover, understand, preview, and download without forcing students to navigate complicated menus or depend on WhatsApp groups.

The interface should feel like a well-organised academic library, not a generic file-sharing website.

## 2. UX principles

The entire experience should follow these principles.

### 2.1 Simplicity

Students should be able to find a course and locate its available resources without unnecessary steps.

### 2.2 Clear organisation

Resources must be grouped by:

- Department.
- Academic level.
- Semester.
- Course.
- Academic session.
- Resource type.

Students should always understand where a resource belongs.

### 2.3 Accessibility

Students should be able to access useful academic materials regardless of whether they contributed them.

Access to the student library and approved downloads should remain free.

### 2.4 Transparency

Students should know:

- Which resource types are available.
- Which resource types are missing.
- When a resource was uploaded.
- Which academic session it belongs to.
- Whether their own submissions are pending, approved, or rejected.

### 2.5 Mobile-first experience

Many students will access Campus Vault through their phones.

The interface must work comfortably on small screens, including Android and iPhone browsers.

### 2.6 Trust

The interface should distinguish student-contributed materials from official university publications.

It should also display moderation status and resource information clearly.

---

## 3. User roles

The interface supports three initial roles.

### Student

Students can:

- Browse the academic library.
- Search and filter courses.
- Preview approved resources.
- Download approved resources.
- Submit permitted academic materials.
- Track their submissions.
- Manage their profile.

### Contributor

Contributors have student access plus the ability to submit academic materials.

A contributor may be a student who regularly helps organise useful resources.

### Admin

Admins can:

- Manage departments.
- Manage courses.
- Manage academic sessions.
- Upload resources.
- Review submissions.
- Approve or reject submissions.
- Edit and archive resources.
- Manage users and roles.
- View platform statistics.
- Review activity logs.

The initial MVP does not provide course representatives with independent approval privileges. This can be introduced later through scoped moderation permissions if needed.

---

## 4. Information architecture

The application should have two main environments:

1. Student application.
2. Admin dashboard.

### 4.1 Student application structure

```text
Campus Vault
│
├── Authentication
│   ├── Sign Up
│   ├── Login
│   ├── Forgot Password
│   └── Complete Profile
│
├── Student Dashboard
│   ├── Overview
│   ├── My Department
│   ├── My Level
│   ├── Recently Added
│   └── Quick Access
│
├── Academic Library
│   ├── Departments
│   ├── Levels
│   ├── Semesters
│   ├── Courses
│   └── Course Resources
│
├── Resource Viewer
│   ├── PDF Preview
│   └── Download
│
├── Submit Resource
│   ├── Resource Details
│   ├── File Upload
│   └── Submission Confirmation
│
├── My Submissions
│   ├── Pending
│   ├── Approved
│   └── Rejected
│
└── Profile
    ├── Personal Details
    ├── Academic Details
    └── Account Settings
```

### 4.2 Admin dashboard structure

```text
Admin Dashboard
│
├── Overview
├── Resource Management
│   ├── All Resources
│   ├── Upload Resource
│   └── Archived Resources
│
├── Submission Management
│   ├── Pending Submissions
│   ├── Approved Submissions
│   └── Rejected Submissions
│
├── Academic Management
│   ├── Departments
│   ├── Courses
│   └── Academic Sessions
│
├── User Management
│   ├── All Users
│   ├── Contributors
│   └── Administrators
│
├── Analytics
│
└── Activity Logs
```

---

## 5. Visual design direction

Campus Vault should have a clean, modern, academic identity.

The visual experience should communicate:

- Organisation.
- Reliability.
- Accessibility.
- Knowledge.
- Academic collaboration.

### 5.1 Design style

Recommended direction:

- Minimal and structured.
- Spacious layouts.
- Clear typography.
- Subtle borders and shadows.
- Consistent spacing.
- Simple icons.
- Strong visual hierarchy.
- Restrained use of colour.

Avoid:

- Excessive gradients.
- Too many colours.
- Unnecessary animations.
- Crowded dashboards.
- Overly decorative cards.
- Complicated navigation.

### 5.2 Suggested colour palette

The following palette is a starting point, not a final brand decision.

| Purpose | Colour |
|---|---|
| Primary | Deep navy `#172554` |
| Secondary | Slate blue `#334155` |
| Accent | Blue `#2563EB` |
| Background | `#F8FAFC` |
| Surface | `#FFFFFF` |
| Main text | `#0F172A` |
| Secondary text | `#64748B` |
| Success | `#15803D` |
| Warning | `#D97706` |
| Error | `#DC2626` |
| Borders | `#E2E8F0` |

Use semantic colours consistently for statuses and actions.

### 5.3 Typography

Recommended typography:

- Inter for interface text.
- A clear, readable font size hierarchy.
- Medium or semibold weights for section headings.
- Comfortable line height for descriptions and resource details.

Body text should remain readable on mobile devices.

### 5.4 Icons

Use consistent icons for:

- Dashboard.
- Library.
- Courses.
- Search.
- Upload.
- Download.
- Documents.
- Notifications.
- Settings.
- Users.
- Analytics.

Icons should support text labels rather than replace important navigation labels.

---

## 6. Student application screens

### 6.1 Landing page

**Purpose:** Explain Campus Vault and direct students into the platform.

Recommended sections:

1. Header and navigation.
2. Hero section.
3. Product explanation.
4. How it works.
5. Key benefits.
6. Call to action.
7. Footer.

Suggested hero message:

**Your academic resources, organised in one place.**

Supporting text:

Find lecture notes, past questions, test questions, and other useful learning materials shared by your academic community.

Primary action: `Explore Library`

Secondary action: `Get Started`

The landing page should communicate that student access is free.

Do not imply that the platform is officially operated by a university unless that relationship has been confirmed.

### 6.2 Registration page

**Purpose:** Allow students to create accounts.

Fields:

- Full name.
- Email address.
- Password.
- Confirm password.

After registration, students complete their academic profile.

Include:

- Password visibility toggle.
- Password requirements.
- Form validation.
- Loading state.
- Clear error messages.
- Link to login.

If email verification is required, show a clear verification instruction.

### 6.3 Login page

**Purpose:** Authenticate existing users.

Fields:

- Email address.
- Password.

Additional interactions:

- Remember session where supported by the authentication implementation.
- Forgot password.
- Show/hide password.
- Login loading state.
- Authentication error feedback.

After successful login, redirect users to the correct application area based on their role.

### 6.4 Complete profile page

**Purpose:** Collect academic information required for relevant resource discovery.

Fields:

- Department.
- Academic level.
- Optional additional academic information if required.

Department and level options should come from approved platform records rather than arbitrary free-text input.

Students should be able to update permitted profile details later.

### 6.5 Student dashboard

**Purpose:** Give students a quick overview of relevant academic resources.

Recommended sections:

**Welcome area**

Display the student's name and academic information.

**Quick actions**

- Explore library.
- Browse courses.
- Submit a resource.
- View my submissions.

**My academic area**

Display the student's department and level.

**Recently added resources**

Show recently approved resources relevant to the student's department or courses.

**Resource availability**

Show courses with available materials and indicate missing resource types.

**Contribution overview**

Display the student's own submission counts, such as pending and approved submissions.

Avoid overwhelming students with too many statistics.

### 6.6 Academic library page

**Purpose:** Allow students to discover resources across the academic library.

Main elements:

- Search bar.
- Department filter.
- Level filter.
- Semester filter.
- Course search or selection.
- Resource type filter.
- Academic session filter.
- Course results.

A course result should display:

- Course code.
- Course title.
- Department.
- Level.
- Semester.
- Available resource types.
- Number of approved resources, where useful.

The interface should support both direct search and browsing.

### 6.7 Course details page

**Purpose:** Present a course's academic resources in an organised format.

Suggested layout:

**Course information**

- Course code.
- Course title.
- Department.
- Academic level.
- Semester.

**Resource availability**

Display separate categories:

- Lecture notes.
- Past questions.
- Test questions.
- Handouts.
- Additional materials.

Each category should show one of the following:

- Available.
- Not yet available.

Where useful, display the number of approved resources.

Do not mark an entire course as complete simply because one document exists.

**Resource list**

Each resource should display:

- Title.
- Resource type.
- Academic session.
- File format.
- File size.
- Upload date.
- Preview action.
- Download action.

Use clear labels and avoid making students guess what a document contains.

### 6.8 Resource details and PDF viewer

**Purpose:** Allow students to inspect a document before downloading it.

Recommended layout:

- Resource title.
- Course information.
- Resource type.
- Academic session.
- Contributor or source information where appropriate.
- PDF preview.
- Download button.

The viewer should support:

- Page navigation.
- Zoom controls.
- Fit-to-width where supported.
- Loading indicator.
- Error state.
- Download action.

On mobile, the viewer should not make the rest of the interface difficult to navigate.

If a document cannot be previewed, show a clear message and provide a download option when permitted.

### 6.9 Submit resource page

**Purpose:** Allow students and contributors to share useful academic materials.

Recommended form fields:

- Resource title.
- Description.
- Department.
- Course.
- Academic level.
- Semester.
- Academic session.
- Resource type.
- File upload.

File upload should display:

- Selected filename.
- File size.
- File type.
- Upload progress.
- Upload success or failure.

Before submission, show a short declaration confirming that the contributor has permission to share the material.

Suggested declaration:

"I confirm that I have the right or permission to share this material and that it does not contain private or sensitive personal information."

The submit button should remain disabled until required information and a valid file are provided.

After successful submission, show:

**Your resource has been submitted for review.**

Explain that the material will become available after approval.

### 6.10 My submissions page

**Purpose:** Help contributors track their submitted resources.

Display submissions in a list or table.

Each item should show:

- Resource title.
- Course.
- Resource type.
- Submission date.
- Current status.
- Review note, where available.

Status indicators:

| Status | Meaning |
|---|---|
| Uploading | File is being uploaded |
| Pending | Awaiting review |
| Approved | Accepted into the library |
| Rejected | Not accepted |
| Failed | Upload or processing failed |
| Expired | Upload session expired |

A rejected submission should display a useful explanation when the reviewer provides one.

Students should not be able to change an approved resource's moderation status.

### 6.11 Profile page

**Purpose:** Let students manage their account information.

Display:

- Full name.
- Email.
- Department.
- Academic level.
- Account role.
- Account status.

Allow editing only of permitted fields.

Role and account status should be read-only for ordinary students.

---

## 7. Admin dashboard screens

The admin dashboard should be visually separate from the student experience while maintaining the same design system.

### 7.1 Admin layout

Desktop layout:

- Fixed or collapsible sidebar.
- Main content area.
- Top navigation bar.
- Admin profile menu.
- Optional notification area.

Mobile layout:

- Collapsible navigation drawer.
- Compact top bar.
- Full-width content.
- Responsive tables or card-based records.

### 7.2 Admin overview

**Purpose:** Give administrators a quick view of platform activity.

Recommended statistics:

- Total registered users.
- Active users.
- Total approved resources.
- Pending submissions.
- Rejected submissions.
- Download requests.

Additional sections:

- Recent submissions.
- Recently added resources.
- Resource distribution by department.
- Recent administrative activity.

Statistics must come from trusted backend data.

### 7.3 Resource management

**Purpose:** Give admins control over the academic library.

Main features:

- Search resources.
- Filter by department.
- Filter by course.
- Filter by resource type.
- Filter by academic session.
- Edit metadata.
- Archive resources.
- Restore archived resources.
- Upload new resources.

Resource records should display clear status information.

Permanent deletion should not be the default action.

### 7.4 Upload resource screen

Admin upload form:

- Title.
- Description.
- Department.
- Course.
- Level.
- Semester.
- Academic session.
- Resource type.
- PDF file.

Show file validation before upload.

After successful upload and server-side verification, display a confirmation.

Admin-uploaded resources may be published directly after validation under the initial proposed workflow.

### 7.5 Submission review screen

**Purpose:** Help admins review student contributions efficiently.

Display:

- Submission title.
- Contributor.
- Department.
- Course.
- Resource type.
- Academic session.
- Submission date.
- Current status.

Admin actions:

- Open submission.
- Preview file.
- Approve.
- Reject.
- Add review note.

Before approval or rejection, provide a confirmation step.

The review interface should make it easy to check:

- Whether the file opens.
- Whether the metadata is accurate.
- Whether the resource belongs to the selected course.
- Whether the document is relevant and permitted to share.
- Whether the document contains private information.

### 7.6 Department management

Admins should be able to:

- Create departments.
- Edit department details.
- Assign department codes.
- Archive inactive departments.

Avoid permanently deleting departments with associated academic records.

### 7.7 Course management

Admins should be able to:

- Create courses.
- Assign course codes.
- Associate courses with departments.
- Set academic levels.
- Set semesters.
- Edit course details.
- Archive courses.

Course codes must be unique within the relevant institution and department scope, according to the final data model.

### 7.8 Academic session management

Admins should be able to:

- Create academic sessions.
- Edit session labels.
- Set active sessions.
- Archive outdated sessions.

Do not automatically delete resources when an academic session becomes inactive.

### 7.9 User management

Display:

- User name.
- Email.
- Department.
- Level.
- Role.
- Account status.
- Registration date.

Admin actions:

- View user.
- Change role.
- Suspend account.
- Reactivate account.

Protect role-changing operations with confirmation and backend permission checks.

### 7.10 Analytics

The analytics page should provide basic information about platform usage.

Potential charts:

- Resource uploads over time.
- Approved resources by department.
- Resources by type.
- Download requests over time.
- User growth.

Do not introduce complex analytics before the core resource workflow works reliably.

### 7.11 Activity logs

Display important platform actions:

- Resource uploaded.
- Submission approved.
- Submission rejected.
- Resource archived.
- Course created.
- Department updated.
- User role changed.
- Account suspended.

Each record should show the actor, action, target, and timestamp.

Activity logs should not be editable through the dashboard.

---

## 8. Navigation design

### Student navigation

Recommended desktop navigation:

- Home.
- Library.
- My Submissions.
- Profile.

A prominent action can be provided for submitting resources.

On mobile, use a compact bottom navigation or menu drawer.

Keep the most frequently used destinations easily accessible.

### Admin navigation

Recommended sidebar:

- Overview.
- Resources.
- Submissions.
- Departments.
- Courses.
- Academic Sessions.
- Users.
- Analytics.
- Activity Logs.

The admin sidebar should clearly distinguish management functions from the student library.

---

## 9. Search and filtering experience

Search should be straightforward and predictable.

Students should be able to search using:

- Course code.
- Course title.
- Resource title.

Filters should be combinable.

Example:

A student should be able to select:

- Department: Geology.
- Level: 400.
- Semester: First.
- Resource type: Past questions.
- Academic session: 2024/2025.

The results should reflect all selected filters.

Search results should provide useful empty states when nothing matches.

Example:

"No resources found for these filters yet. Try another academic session or resource type."

Do not display fake results or misleading resource counts.

---

## 10. Important interaction states

Every important screen must support more than its normal successful state.

### Loading state

Show a clear loading indicator while retrieving data.

Avoid leaving empty screens that make users think the application is broken.

### Empty state

Examples:

- No courses available.
- No resources found.
- No submissions yet.
- No pending submissions.

Explain what the user can do next.

### Error state

Provide understandable error messages and a retry action where appropriate.

Do not expose raw backend errors to students.

### Success state

Confirm important completed actions.

Examples:

- Profile updated.
- Resource uploaded.
- Submission received.
- Resource approved.
- Resource archived.

### Disabled state

Buttons should visually communicate when an action is unavailable.

For example, an upload button should remain disabled while required information is missing.

### Confirmation state

Ask for confirmation before sensitive actions such as:

- Rejecting a submission.
- Suspending a user.
- Archiving a resource.
- Changing an administrative role.

---

## 11. Responsive design requirements

Campus Vault must be designed for mobile, tablet, and desktop.

Suggested breakpoints:

| Device | Width |
|---|---|
| Small mobile | Below 480px |
| Mobile | 480px–767px |
| Tablet | 768px–1023px |
| Desktop | 1024px and above |

These are starting design breakpoints, not strict device classifications.

### Mobile

- Single-column layouts.
- Readable text.
- Large touch targets.
- Simple filters.
- Responsive resource lists.
- No horizontal page overflow.
- Accessible upload controls.
- Usable PDF preview.

### Tablet

- Two-column layouts where appropriate.
- Collapsible navigation.
- Flexible resource cards.
- Adaptable admin tables.

### Desktop

- Wider content layouts.
- Sidebar navigation.
- Multi-column dashboard sections.
- Full resource tables.
- Larger PDF preview area.

The interface should remain usable even when a student has a small screen or slow internet connection.

---

## 12. Accessibility requirements

Campus Vault should follow practical accessibility principles.

Requirements:

- Use semantic HTML.
- Provide labels for form controls.
- Support keyboard navigation.
- Maintain readable colour contrast.
- Use visible focus indicators.
- Provide meaningful button labels.
- Do not communicate status using colour alone.
- Provide text alternatives for meaningful icons.
- Make error messages understandable to screen readers.
- Ensure forms can be completed without a mouse.

Target WCAG 2.2 Level AA where practical.

---

## 13. Performance and usability

The interface should remain responsive on typical mobile internet connections.

Requirements:

- Lazy-load nonessential content.
- Paginate large resource lists.
- Avoid loading every resource at once.
- Optimise images and interface assets.
- Avoid unnecessarily large JavaScript bundles.
- Show upload progress.
- Handle interrupted uploads gracefully.
- Avoid unnecessary repeated API requests.
- Cache safe, non-sensitive data where appropriate.

The PDF viewer should not block navigation or make the entire application unresponsive.

---

## 14. Security-related UX requirements

Security must be reflected in the interface.

Examples:

- Students should never see admin controls.
- Pending submissions must not appear in the public library.
- Rejected resources must remain inaccessible.
- Admin-only pages must require authorised access.
- Expired upload links should trigger a clear retry process.
- Users should receive a clear message when their session expires.
- Sensitive actions should require confirmation.

Hiding a button is not sufficient security. The backend must independently enforce all permissions.

---

## 15. Key user journeys

### Journey A: Student finds a past question

1. Student logs in.
2. Opens the academic library.
3. Selects a department.
4. Selects academic level.
5. Selects semester.
6. Opens a course.
7. Selects past questions.
8. Chooses an academic session.
9. Opens a resource.
10. Previews or downloads the PDF.

**Success condition:** The student finds the correct approved resource without needing to search through WhatsApp groups.

### Journey B: Student submits lecture notes

1. Student logs in.
2. Opens Submit Resource.
3. Enters resource details.
4. Selects the correct course.
5. Selects the resource type.
6. Uploads a permitted PDF.
7. Confirms the sharing declaration.
8. Submits the resource.
9. Receives confirmation.
10. Tracks the submission under My Submissions.

**Success condition:** The resource enters the review queue and remains private until approval.

### Journey C: Admin reviews a submission

1. Admin logs in.
2. Opens the admin dashboard.
3. Selects Submissions.
4. Opens the pending review queue.
5. Selects a submission.
6. Reviews its metadata and PDF.
7. Approves or rejects it.
8. Adds a review note where necessary.
9. Confirms the action.
10. The submission status is updated.

**Success condition:** Only an authorised admin can publish a student submission.

### Journey D: Admin uploads a resource

1. Admin logs in.
2. Opens Resource Management.
3. Selects Upload Resource.
4. Enters metadata.
5. Selects a PDF.
6. Uploads the file.
7. The backend verifies the file.
8. The resource is published according to the admin upload policy.

**Success condition:** A valid resource is added to the library with the correct academic associations.

---

## 16. MVP screen priority

The following implementation order is recommended.

### Priority 1 — Essential

- Registration.
- Login.
- Complete profile.
- Student dashboard.
- Academic library.
- Course details.
- Resource details.
- PDF preview.
- Download.
- Admin login.
- Admin dashboard.
- Resource management.
- Submission review.

### Priority 2 — Important

- Submit resource.
- My submissions.
- Department management.
- Course management.
- Academic session management.
- User management.
- Search and advanced filters.

### Priority 3 — Later improvements

- Analytics dashboard.
- Activity log viewer.
- Notifications.
- Saved resources.
- Recently viewed resources.
- Improved search.
- More advanced contribution features.

The first release should prioritise finding and accessing resources over decorative dashboard features.

---

## 17. UX acceptance criteria

The UI/UX implementation is acceptable for the MVP when:

- A new student can register and complete their profile.
- An existing student can log in.
- Students can navigate departments, levels, semesters, and courses.
- Students can identify available and missing resource categories.
- Students can search and filter resources.
- Students can preview and download approved PDFs.
- Students can submit permitted academic materials.
- Students can track submission status.
- Admins can review and moderate submissions.
- Admins can manage academic records and library resources.
- The interface works on mobile, tablet, and desktop.
- Loading, empty, success, and error states are implemented.
- Navigation is understandable without prior instructions.
- The application does not expose admin controls to ordinary students.
- Important actions provide clear feedback.

---

## 18. Design and implementation decisions still to confirm

Before final UI implementation, confirm:

1. The final Campus Vault logo and brand identity.
2. Whether the first release will serve only the Geology department or the entire institution.
3. Whether the landing page is public or users go directly to login.
4. Whether student dashboards show only their own department or allow browsing all departments.
5. Whether email verification is mandatory before accessing the library.
6. Whether notifications are required in the first release.

These decisions may affect navigation, onboarding, and access control.

**Final UX principle:** A student should spend their time learning from academic resources, not figuring out how to use Campus Vault.