# DEVELOPMENT ROADMAP

## Campus Vault — Development Roadmap

**Version:** 1.0  
**Status:** Proposed — Not Yet Implemented  
**Product:** Campus Vault  
**Development Approach:** Incremental MVP Development

---

## 1. Purpose

This document defines the development phases, implementation priorities, milestones, dependencies, and delivery criteria for Campus Vault.

The objective is to build a functional academic resource platform in manageable stages rather than attempting to implement every feature simultaneously.

Development will follow this principle:

**Build the foundation, validate it, then expand.**

Every phase should produce a working part of the application that can be tested before the next phase begins.

## 2. Product development goals

The initial development effort will focus on five outcomes:

1. Students can create accounts and access the platform.
2. Students can browse an organised academic library.
3. Students can preview and download approved resources.
4. Students can contribute academic materials for review.
5. Admins can manage the library and moderate submissions.

These outcomes define the MVP.

Features that do not directly support these outcomes should not delay the first release.

## 3. Development principles

### 3.1 Build in small, testable stages

Each development phase should have a clear output and acceptance criteria.

Do not build several interconnected features without testing the earlier foundations.

### 3.2 Security before convenience

Authentication, permissions, file access, and administrative controls must be designed before implementing sensitive operations.

A visually hidden admin button does not provide security.

### 3.3 Validate real workflows

The application should be tested using realistic student and admin scenarios.

### 3.4 Keep the MVP focused

Avoid introducing AI features, social networking, complex analytics, or payment systems before the core library works reliably.

### 3.5 Document important decisions

Changes to the database structure, API contract, storage provider, or permission model should be reflected in the relevant documentation.

---

## 4. Proposed technology stack

The following stack is proposed for the initial release.

| Layer | Technology |
|---|---|
| Frontend | React |
| Language | TypeScript |
| Build tool | Vite |
| Routing | React Router |
| Styling | Tailwind CSS, Framer Motion |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| File storage | Cloudflare R2 |
| Backend | Cloudflare Workers |
| Validation | Zod |
| PDF preview | PDF.js |
| Frontend hosting | Netlify |
| Version control | Git and GitHub |

Cloudflare R2 remains the proposed storage choice, not a final commitment. Supabase Storage remains an alternative.

The final provider should be selected after testing upload, download, access control, pricing, and operational requirements.

## 5. Development phases

<text> </text>

### Phase 0 — Product and architecture preparation

**Goal:** Resolve the important decisions before writing substantial application code.

Tasks:

- Review the README.
- Review the technical specification.
- Review the database schema.
- Review security and permissions.
- Review API documentation.
- Review the UI/UX specification.
- Confirm the initial institution and department scope.
- Decide between R2 and Supabase Storage.
- Confirm the user roles and moderation workflow.
- Confirm the academic structure.
- Create the GitHub repository.
- Set up the development environment.

**Deliverables:**

- Confirmed MVP scope.
- Final initial technology choices.
- Repository created.
- Development environment ready.
- Architecture decisions documented.

**Exit criteria:**

The developer can explain how authentication, database records, file storage, and backend permissions work together.

Do not proceed with file upload implementation while the storage and security architecture remain unresolved.

### Phase 1 — Project foundation

**Goal:** Establish the application structure and development environment.

Tasks:

1. Create the React and TypeScript project using Vite.
2. Configure the project structure.
3. Install and configure React Router.
4. Set up the styling system.
5. Create reusable layout components.
6. Create the public landing page.
7. Create authentication page layouts.
8. Configure environment variables.
9. Connect the application to Firebase.
10. Set up Git version control.

Suggested folder structure:

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
│   │   ├── forms/
│   │   └── resources/
│   │
│   ├── pages/
│   │   ├── auth/
│   │   ├── student/
│   │   └── admin/
│   │
│   ├── routes/
│   │
│   ├── services/
│   │
│   ├── hooks/
│   │
│   ├── context/
│   │
│   ├── types/
│   │
│   ├── utils/
│   │
│   ├── styles/
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── functions/
│   └── src/
│       ├── routes/
│       ├── middleware/
│       ├── services/
│       ├── validators/
│       └── index.ts
│
├── docs/
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

The backend directory may be maintained as a separate project or workspace if that better suits the deployment setup.

**Deliverables:**

- Running frontend application.
- Configured routing.
- Reusable layout structure.
- Firebase connection.
- Initial GitHub repository.

**Exit criteria:**

The application runs locally, routes load correctly, and environment configuration works without exposing secrets.

### Phase 2 — Authentication and user profiles

**Goal:** Establish secure user access and account management.

Tasks:

- Configure Firebase Authentication.
- Implement registration.
- Implement login.
- Implement logout.
- Implement password recovery.
- Implement email verification if required.
- Create user profile records.
- Implement profile completion.
- Retrieve authenticated user information.
- Implement protected routes.
- Add role-aware navigation.
- Configure backend token verification.

User roles:

- Student.
- Contributor.
- Admin.

Account statuses:

- Active.
- Suspended.
- Disabled.

Important security requirements:

- Users cannot assign themselves admin roles.
- The frontend must not be trusted to determine permissions.
- Backend endpoints must verify current account status and role.
- Admin access must be protected independently of the UI.

**Deliverables:**

- Working authentication.
- User profile management.
- Protected student routes.
- Protected admin routes.
- Backend authentication middleware.

**Exit criteria:**

A student can register, log in, complete their profile, and access permitted pages. An ordinary student cannot access protected admin operations.

### Phase 3 — Academic database and library structure

**Goal:** Build the academic organisation system.

Tasks:

- Create Firestore collections.
- Implement departments.
- Implement courses.
- Implement academic sessions.
- Associate courses with departments.
- Associate courses with levels and semesters.
- Build admin department management.
- Build admin course management.
- Build academic session management.
- Seed the initial academic records.

Initial database collections:

- `users`
- `departments`
- `courses`
- `academicSessions`
- `resources`
- `submissions`
- `activityLogs`

The exact schema must follow the approved database design.

**Deliverables:**

- Working academic data structure.
- Department management.
- Course management.
- Academic session management.
- Initial academic records.

**Exit criteria:**

An admin can create and manage academic records. Students can retrieve valid departments, courses, levels, semesters, and academic sessions.

### Phase 4 — Student library and resource discovery

**Goal:** Make academic resources discoverable.

Tasks:

- Build the student dashboard.
- Build the academic library page.
- Implement department browsing.
- Implement level selection.
- Implement semester selection.
- Implement course browsing.
- Build course detail pages.
- Implement resource categories.
- Implement search.
- Implement filtering.
- Implement cursor-based pagination.
- Show resource availability.
- Implement empty and loading states.

Resource categories:

- Lecture notes.
- Past questions.
- Test questions.
- Handouts.
- Study materials.
- Other permitted academic materials.

Availability must be calculated from approved resource records.

For example, a course may have:

- Lecture notes: Available.
- Past questions: Available.
- Test questions: Not yet available.
- Handouts: Not yet available.

**Deliverables:**

- Student dashboard.
- Academic library.
- Course pages.
- Resource filtering.
- Search and pagination.
- Resource availability indicators.

**Exit criteria:**

A student can navigate the academic structure and find the correct course and resource category without needing to know internal database identifiers.

### Phase 5 — File storage and resource access

**Goal:** Implement secure document storage, preview, and download.

Tasks:

1. Finalise the storage provider.
2. Configure a private storage bucket.
3. Implement backend upload-intent generation.
4. Implement temporary upload URLs.
5. Implement direct file uploads.
6. Verify uploaded files server-side.
7. Store file metadata in Firestore.
8. Generate temporary preview URLs.
9. Generate temporary download URLs.
10. Implement PDF preview.
11. Implement download functionality.
12. Record download requests.
13. Handle upload failures and expired URLs.
14. Implement file cleanup for abandoned uploads.

Initial proposed file limit: 20MB per file.

Initial supported file format: PDF.

The upload system must verify actual file content and not rely solely on the filename or browser-provided MIME type.

**Deliverables:**

- Private document storage.
- Secure upload pipeline.
- PDF preview.
- Download functionality.
- File validation.
- Download request tracking.

**Exit criteria:**

An authorised admin can upload a valid PDF, and an authenticated student can preview and download an approved resource without receiving permanent public storage access.

### Phase 6 — Student contribution and moderation

**Goal:** Allow students to contribute resources safely.

Tasks:

- Build the Submit Resource page.
- Implement resource metadata forms.
- Implement upload-intent creation.
- Implement direct file upload.
- Implement upload completion and verification.
- Implement submission history.
- Implement submission status tracking.
- Build the admin review queue.
- Build submission detail pages.
- Implement approval.
- Implement rejection.
- Implement review notes.
- Implement audit logging.

Submission lifecycle:

```text
Draft / Upload Intent
        |
        v
    Uploading
        |
        v
   Verification
        |
        v
     Pending
      /   \
     /     \
    v       v
Approved  Rejected
```

Additional failure states should be supported where appropriate:

- Failed.
- Expired.

Approved submissions become accessible through the resource library.

Rejected submissions remain private.

**Deliverables:**

- Student submission workflow.
- Submission tracking.
- Admin moderation interface.
- Approval and rejection endpoints.
- Audit records.

**Exit criteria:**

A student can submit a permitted document, an admin can review it, and only an approved submission becomes available to students.

### Phase 7 — Admin dashboard and platform management

**Goal:** Give admins control over the platform.

Tasks:

- Build admin dashboard overview.
- Build resource management.
- Implement admin resource uploads.
- Implement resource metadata editing.
- Implement resource archiving and restoration.
- Build user management.
- Implement role changes.
- Implement account suspension.
- Build basic analytics.
- Build activity log viewer.

Administrative actions must be recorded.

The backend must prevent unauthorised users from performing admin operations even if they manually call the API.

**Deliverables:**

- Admin dashboard.
- Resource management.
- User management.
- Academic management integration.
- Analytics overview.
- Activity logs.

**Exit criteria:**

An authorised admin can manage the library and users through the dashboard, with backend-enforced permissions and audit history.

### Phase 8 — Testing, refinement, and pilot

**Goal:** Verify that the application works reliably with real students and academic resources.

Tasks:

- Run unit tests.
- Run integration tests.
- Test authentication and permissions.
- Test upload and download workflows.
- Test file validation.
- Test moderation.
- Test mobile responsiveness.
- Test slow network conditions.
- Test empty and error states.
- Conduct user acceptance testing.
- Collect feedback from students.
- Fix high-priority issues.
- Prepare the initial resource collection.

Pilot recommendation:

- Begin with the Geology department.
- Start with approximately three courses.
- Include more than one academic session where available.
- Involve two or more course representatives or resource contributors.
- Invite a small group of students to test the complete workflow.

The pilot size is a planning recommendation, not a validated requirement.

**Deliverables:**

- Tested MVP.
- Fixed critical issues.
- Pilot feedback report.
- Initial academic resource collection.
- Release candidate.

**Exit criteria:**

Students can complete the primary workflows without assistance, and no known critical security or data-integrity issues remain.

### Phase 9 — Deployment and initial release

**Goal:** Make Campus Vault available to its first student users.

Tasks:

- Configure production environment variables.
- Deploy frontend.
- Deploy backend.
- Configure authentication domains.
- Configure production database access.
- Configure private storage.
- Set up monitoring and error reporting.
- Configure backups.
- Test production upload and download.
- Verify security rules.
- Create admin accounts securely.
- Publish the initial resource collection.
- Prepare user onboarding instructions.

**Deliverables:**

- Production application.
- Production API.
- Secure storage.
- Initial admin access.
- Backup and monitoring configuration.
- Initial student release.

**Exit criteria:**

The production application is accessible, its critical workflows function correctly, and recovery procedures have been tested.

---

## 6. Suggested milestone overview

| Milestone | Completion outcome |
|---|---|
| M0 | Architecture and decisions confirmed |
| M1 | Project foundation running |
| M2 | Authentication working |
| M3 | Academic database ready |
| M4 | Student library working |
| M5 | Secure file access working |
| M6 | Submission and moderation working |
| M7 | Admin management working |
| M8 | MVP tested and piloted |
| M9 | Initial production release |

The milestones represent logical delivery points. They do not require fixed calendar dates.

## 7. Development dependencies

Some features depend on earlier work.

| Feature | Depends on |
|---|---|
| Student dashboard | Authentication and profiles |
| Course browsing | Academic database |
| Resource availability | Approved resource records |
| PDF preview | Secure file storage |
| Resource download | Secure file storage and authorisation |
| Student submissions | Authentication, academic database, storage |
| Admin moderation | Submission workflow and admin permissions |
| Admin analytics | Reliable platform records |
| Activity logs | Backend administrative operations |
| Production deployment | Testing and environment configuration |

Avoid implementing a feature before its essential dependencies are ready.

## 8. Recommended development order

Although the phases above describe the full delivery process, the following order should guide actual implementation:

1. Project setup.
2. Firebase configuration.
3. Authentication.
4. User profiles and roles.
5. Academic data structure.
6. Admin academic management.
7. Student library.
8. Resource storage.
9. Preview and download.
10. Student submissions.
11. Admin moderation.
12. Resource management.
13. User management.
14. Testing and refinement.
15. Pilot deployment.

This order reduces unnecessary rework.

## 9. MVP scope control

### Must be included

- Registration and login.
- Student profiles.
- Departments and courses.
- Academic sessions.
- Resource browsing.
- Resource search and filters.
- PDF preview.
- PDF download.
- Student submissions.
- Submission moderation.
- Admin dashboard.
- Resource management.
- Basic user management.
- Backend permission enforcement.

### Should be included if feasible

- Basic analytics.
- Activity logs.
- Upload progress indicators.
- Submission review notes.
- Recently added resources.

### Not required for the first release

- AI-powered summaries.
- AI-generated questions.
- Online examinations.
- Student-to-student messaging.
- Discussion forums.
- Social networking.
- Paid subscriptions.
- Advanced recommendation engines.
- Native Android or iOS applications.
- Complex gamification.
- Automated academic performance tracking.

These features may be considered after the core platform has been validated.

## 10. Initial pilot strategy

The first pilot should test the product with a manageable academic community.

### Pilot objectives

- Determine whether students can find resources faster.
- Identify missing resource categories.
- Test whether students understand the course organisation.
- Determine whether contributors can submit materials easily.
- Measure whether admins can review submissions efficiently.
- Identify usability problems on mobile devices.

### Suggested pilot structure

| Item | Initial target |
|---|---|
| Department | Geology |
| Courses | 3 or more |
| Course representatives/contributors | 2 or more |
| Student testers | 30–50 |
| Resource types | At least 3 |
| Device coverage | Android, iPhone, desktop |

These are suggested pilot targets. Adjust them based on actual student participation and resource availability.

### Pilot success indicators

- At least 70% of testers can find a requested resource without assistance.
- Students can successfully preview and download available PDFs.
- Contributors can complete a submission.
- Admins can process submissions without manual database editing.
- No critical access-control vulnerabilities are identified.
- Students understand resource availability and submission statuses.

Collect qualitative feedback as well as usage numbers.

## 11. Deployment and operational readiness

Before the initial release, confirm:

### Infrastructure

- Frontend hosting configured.
- Backend deployed.
- Firestore configured.
- Storage bucket configured.
- Authentication domains configured.
- Environment variables secured.

### Security

- Production authentication verified.
- Backend permissions tested.
- Storage bucket remains private.
- Temporary URLs expire.
- Admin accounts are protected.
- Upload validation works.
- Rate limits are active.

### Reliability

- Database backups configured.
- File recovery strategy documented.
- Error monitoring enabled.
- Failed uploads can be recovered or cleaned up.
- Production environment has been tested.

### Product readiness

- Initial resources uploaded.
- Course records checked.
- Admins trained.
- Student onboarding instructions prepared.
- Feedback channel established.

## 12. Risks and mitigation

| Risk | Mitigation |
|---|---|
| Not enough academic resources | Start with a small verified collection and involve course representatives |
| Unauthorised document sharing | Require permission declarations and moderation |
| Incorrect course metadata | Use structured academic records and admin review |
| Upload failures | Implement retries, verification, and abandoned-upload cleanup |
| Unauthorised resource access | Use private storage and backend-generated temporary URLs |
| Excessive storage costs | Compress where appropriate, monitor usage, and define upload limits |
| Low student adoption | Test with real students and make navigation simple |
| Admin workload | Provide a clear review queue and efficient moderation actions |
| Data loss | Back up Firestore and storage objects and test restoration |
| Feature creep | Keep the first release focused on the agreed MVP |

## 13. Post-MVP development

Only after the initial release has been tested should additional features be prioritised.

Potential improvements:

### Resource discovery

- Better search.
- Saved resources.
- Recently viewed resources.
- More advanced filtering.

### Student experience

- Notifications when submissions are reviewed.
- Resource request suggestions.
- Improved mobile document viewing.
- Personal resource collections.

### Academic collaboration

- Scoped course representative moderation.
- Department-specific contributor programmes.
- Better resource completeness reporting.

### Platform intelligence

- Resource usage analytics.
- Search analytics.
- Frequently requested missing materials.
- AI-assisted resource categorisation, subject to review.

### Platform expansion

- Additional departments.
- Additional faculties.
- Additional institutions, if the data model and operational arrangements support multi-institution use.

Expansion should be based on evidence of successful use, not simply the ability to add more records.

## 14. Project completion criteria

The initial Campus Vault MVP is considered complete when:

- Authentication works reliably.
- Students can manage their academic profiles.
- Academic records are organised correctly.
- Students can browse and search the library.
- Approved resources can be previewed and downloaded.
- Students can submit permitted materials.
- Admins can review and moderate submissions.
- Admins can manage courses, departments, sessions, and resources.
- Backend security checks are implemented.
- The interface works on mobile and desktop.
- Critical workflows pass testing.
- The initial pilot has been conducted.
- Production deployment and backup procedures are in place.

---

## 15. Final development principle

Campus Vault should not be measured by the number of features it has.

It should be measured by whether students can reliably find useful academic resources, whether contributors can preserve and share permitted knowledge, and whether administrators can maintain a trustworthy library.

**The first objective is not to build the biggest academic platform. It is to build one that students genuinely find useful, starting with a real department and real academic resources.**