# Campus Vault — Implementation Decisions

**Status:** Audit complete; some product decisions pending  
**Scope:** Documentation audit and safe project-foundation work  
**Last reviewed:** 2026-11-15

This document records what the current project documents establish, where they
conflict or leave product decisions open, and recommended resolutions. These
recommendations are not product approvals. The source documents have not been
rewritten to conceal or resolve their differences.

## 1. Product and architecture summary

Campus Vault is a free academic library that helps students find, preview,
download, and contribute organised course materials. Its central workflow is
not generic file sharing: resources need academic context, student submissions
must remain private until moderation, and only approved material belongs in the
student library. Mobile usability is a primary requirement.

The proposed stack is React, TypeScript, Vite, React Router, Firebase
Authentication, Cloud Firestore, Zod, and Cloudflare Workers. Cloudflare R2 is
the leading file-storage proposal, but Supabase Storage remains an alternative.
The application currently has only a frontend and local mock services.

## 2. Confirmed requirements

The following requirements are consistently supported across the documentation:

- Student access to approved resources is free.
- Resources are organised by department, level, semester, course, academic
  session, and resource type.
- Student-contributed material must not become available in the library before
  review and approval.
- Students cannot approve their own submissions or change their own roles.
- Backend authorization—not frontend visibility or client-side state—must
  protect privileged operations and files.
- The MVP prioritises resource discovery, PDF preview/download, contributions,
  moderation, and mobile usability over social, paid, AI, or recommendation
  features.
- Resource availability is derived from approved resource records, not manually
  maintained course labels.
- Destructive removal should default to archive; important administrative
  changes should be auditable.

## 3. Documentation audit

| Area | Finding and source documents | Risk / implementation consequence |
|---|---|---|
| Submission lifecycle | The product owner confirmed separate upload, moderation, and publication/archive states on 2026-11-14. `DATABASE_SCHEMA.md` models only `pending`, `approved`, and `rejected`; `API_DOCUMENTATION.md` and `DEVELOPMENT_ROADMAP.md` also require upload-intent, `uploading`, verification, `failed`, and `expired`; `UI_UX_SPECIFICATION.md` displays those upload states. | Domain schemas and transition guards now cover the three axes. Persistence, retry policy, and storage cleanup remain part of the backend implementation. |
| Moderation vs publication | Resource `approvalStatus` combines `pending`, `approved`, `rejected`, and `archived` in the schema. `archived` is publication/lifecycle state, not a moderation decision. Submission status is separately defined but varies by document. | Queries and state transitions can conflate “reviewed” with “visible”; restore, re-review, and audit history are ambiguous. |
| Admin uploads | The product owner confirmed that admin-created resources require a separate explicit publish action after file verification on 2026-11-14. `API_DOCUMENTATION.md` had allowed direct publication, while `SECURITY_AND_PERMISSIONS.md` §7.3 required explicit approval. | The upload must remain unpublished after verification until the authorized publish operation succeeds and is audited. |
| Course representative permissions | The product owner confirmed only admins can approve/reject in the MVP on 2026-11-15. This aligns with `SECURITY_AND_PERMISSIONS.md`, `TESTING_PLAN.md`, and `UI_UX_SPECIFICATION.md`; the README and technical specification also mention representative moderation. | Contributors and course representatives cannot moderate. Scoped representative privileges remain deferred. |
| Institution scope | The product owner confirmed the Federal University of Agriculture, Abeokuta (FUNAAB) as the pilot institution and selected Geology as the initial catalog on 2026-11-15. The official FUNAAB [Department of Geology page](https://funaab.edu.ng/section/department-of-geology/) confirms the department exists. The product owner also confirmed students from any FUNAAB department may use the platform while the Geology catalog is the initial collection. | Keep one-institution scope, but do not assume every account holder studies Geology or make department a library access boundary. Support other departments only when their approved records are available. |
| Academic relationships | The product owner confirmed that department, level, and semester remain on each course record for the MVP on 2026-11-14. FUNAAB Geology is the initial catalog; profiles are open to students from other departments, whose department remains unset until an approved catalog record exists. Academic session remains resource metadata. | Keep user department/level nullable during registration and profile completion; courses still require their approved academic attributes. Revisit separate offerings before broader expansion if course identity needs reuse across academic structures. |
| Storage provider | The product owner selected Cloudflare R2 on 2026-11-14. The source documents had kept R2 and Supabase Storage as alternatives, with the technical specification leaning toward R2. | Use R2 for the MVP; private access, upload signing, verification, cleanup, Worker credentials, and operational configuration still need implementation and testing. |
| Email verification | The product owner confirmed that verified email is required before protected student features, with no university-domain restriction, on 2026-11-14. | Authentication must retain an unverified state and gate protected features until Firebase confirms verification. |
| Resource access | The product owner confirmed that any verified, active FUNAAB student may browse approved resources, including resources in the initial Geology catalog, on 2026-11-15. Department information organizes the library; it is not an access boundary. | The Worker must enforce verified identity and active account status, but must not restrict student library queries to the user's department. |
| Copyright and moderation | The documents require a permission declaration and moderation, and warn about copyrighted or restricted materials. They do not define complaint/takedown handling, retention, appeals, or who makes a legal determination. | A declaration alone does not resolve rights disputes or define a safe response to reported content. |
| API contract | `API_DOCUMENTATION.md` specifies `/api/v1`, while other sections and docs use `/api` and inconsistent endpoint shapes. Resource fields and status names also vary (`status`, `approvalStatus`, `fileType`, `mimeType`). | Client and Worker implementations could drift, and security-sensitive states may be parsed inconsistently. |
| File policy | Roadmap and API documents specify PDF-only for the MVP. `DATABASE_SCHEMA.md` and `README.md` also mention images; UI plans a PDF viewer and the security plan requires actual-content checks. | Supporting images expands validation, preview, and abuse-handling requirements without clear MVP need. |
| Data and storage consistency | Firestore and object storage cannot share a transaction. The schema and technical docs mention retry, cleanup, and idempotency but do not select a reconciliation/retention policy for abandoned or rejected files. | Partial failures can leave orphaned objects or records unless upload state and cleanup are designed together. |
| Current implementation | Firebase Authentication client flows, a Firebase-token API client, and Cloudflare Worker Firestore-backed profile endpoints are implemented but require project/API configuration. Academic/admin services still use localStorage, demo identities, client-side role checks, simulated latency, and sample PDF access. | The Worker verifies Firebase ID tokens, verified email, profile shape, active status, and role enum before returning a session. Resource authorization, role-specific admin operations, uploads, previews, and downloads remain unimplemented or prototype behavior. |

## 4. Decisions and recommendations

### 4.1 Safe defaults to use for initial foundation work

These are narrow defaults aligned with the documents and do not implement
backend or product behavior:

| Decision | Default | Consequence |
|---|---|---|
| Frontend foundation | Keep the existing React + TypeScript + Vite + React Router structure; retain strict TypeScript and the existing Vite alias. | Avoids replacing a working project shell or adding a second framework. |
| Client environment examples | List only placeholder Firebase web configuration and API base URL variables in `.env.example`. Treat them as configuration, not privileged secrets. Keep Worker/storage credentials server-side and out of `VITE_*` variables. | Provides a safe integration boundary without claiming that Firebase or a Worker is connected. |
| MVP file format | Plan for PDF-only until a broader format policy is approved. | Keeps validation and preview requirements consistent with the core MVP. |
| Initial moderation baseline | Only administrators may approve/reject in the MVP; ordinary contributors may submit and track their own submissions. | Least-privilege implementation; course-representative moderation remains deferred. |
| Removal behavior | Archive approved resources by default; reserve permanent deletion for a separately authorized and audited operation. | Preserves historical records and supports recovery. |

### 4.2 Confirmed decisions and remaining approvals

Rows marked **Confirmed** were approved by the product owner. Other rows remain
recommendations and should be confirmed before their dependent functionality is
implemented.

| Decision requiring approval | Recommendation | Consequence of recommendation |
|---|---|---|
| Initial institutional scope | **Confirmed:** Federal University of Agriculture, Abeokuta (FUNAAB); Geology is the initial academic catalog, but students from any FUNAAB department may use the platform. Do not design cross-institution access into the MVP. | Keep the pilot institution boundary simple without treating the initial catalog as a student eligibility or resource-access restriction. Other departments require approved platform records before they can be selected in profiles. |
| Storage provider | **Confirmed:** Cloudflare R2. Keep objects private and issue short-lived URLs only from the trusted backend. | Aligns with the documented Workers architecture; requires R2 configuration and Worker-held credentials. |
| Submission states | **Confirmed:** separate upload processing (`intent`, `uploading`, `verifying`, `failed`, `expired`, `complete`) from moderation (`pending`, `approved`, `rejected`) and resource publication (`unpublished`, `published`, `archived`). Use explicit, auditable transitions. | Prevents upload failures and archival from masquerading as moderation decisions. Domain schemas and transition guards are in place; persistence and API implementation require the backend phase. |
| Admin-created resources | **Confirmed:** require a distinct explicit publish action after a successful verified upload. Student submissions still require an admin moderation decision. | Resolves the docs' immediate-publication vs approval conflict. Publication remains an explicit, auditable backend action. |
| Course representatives | **Confirmed:** course representatives have no approval/rejection privileges in the MVP. They can contribute as students/contributors. Revisit scoped moderation only with explicit assignment, scope, audit, conflict-of-interest, and revocation rules. | Avoids granting broad admin access and narrows the initial permission model. |
| Academic data model | **Confirmed:** keep department, level, and semester on each course record. FUNAAB Geology is the initial course catalog; any FUNAAB student may register, and the user-profile department field remains unset until an approved department is available. Keep the single-institution boundary; do not design cross-institution access into the MVP. | Matches the course schema without limiting student eligibility to the first catalog. Reassess before expanding to structures where the same course has multiple offerings. |
| Email verification | **Confirmed:** require verified email before access to protected student features; no university-domain restriction. | Reduces disposable-account abuse while avoiding an institution-specific email restriction. |
| Student library visibility | **Confirmed:** any verified, active FUNAAB student may browse approved resources, including the initial Geology catalog. Department is an organizational filter, not an access boundary. | Matches the free, open library goal. Backend authorization will check verified identity and account status, not department membership. |
| Copyright/content process | Require a contributor rights/permission declaration and provide a clear reporting/takedown and review path before pilot. Do not claim that the declaration alone establishes legal permission. | Gives moderators a response path; policy wording and retention/appeal details still need product/legal input. |
| Canonical API contract | Use `/api/v1`, one set of field names, and shared Zod contracts at the Worker boundary; route all protected data through the Worker rather than relying on client-side Firestore permissions. | The identity profile endpoints use `/api/v1`; further domain endpoints and their contracts remain to be implemented. |
| Initial profile completeness | Registration creates a verified Firebase identity, then the Worker provisions a server-owned student profile with nullable department and level. The verified profile-completion flow requires an approved level (100-500) and allows department to remain unset unless the student selects an available department. | User-profile schema now permits nullable department/level until completion; course records still require approved academic values. Students may select Geology or leave department unset until other approved departments are seeded. |

## 5. Architectural blockers

The following work is blocked pending decisions or infrastructure:

1. **Real file upload, preview, and download:** blocked by private R2 bucket
   setup, Worker credentials, and upload lifecycle persistence and verification.
2. **Submission and moderation implementation:** lifecycle dimensions,
   admin-only moderation, and the admin explicit-publish policy are confirmed;
   persistence, API behavior, and private storage workflow remain unimplemented.
3. **Production authorization and academic data seeding:** Worker profile
   lookup and active-account checks are implemented. Role-specific operations,
   verified Geology catalog data, and an approved list of profile-selectable
   departments beyond Geology remain.
4. **Authentication rollout:** client-side Firebase Auth, Worker ID-token
   verification, and Firestore profile provisioning/lookup are implemented.
   Firebase and Worker service-account configuration, live project testing, and
   initial admin provisioning remain.
5. **Production deployment:** blocked by the choice/configuration of frontend
   hosting, Cloudflare Worker environment, Firebase project, storage provider,
   CORS origins, secrets, backup, and recovery procedures.
6. **Copyright response workflow:** a pilot should not treat a checkbox as a
   complete rights-management process; reporting, review, and removal handling
   need to be defined.

The existing local mocks can be run for prototype inspection, but cannot satisfy
authentication, authorization, privacy, upload, or publication acceptance
criteria.

## 6. Implementation sequence

The sequence follows `DEVELOPMENT_ROADMAP.md`, with gates added where decisions
are required:

1. **Foundation (safe to proceed):** preserve the existing Vite/React setup;
   add documented visual tokens and placeholder-only client environment
   examples; run the production build.
2. **Decision gate:** confirm the copyright/reporting response. Institution
   scope, pilot department, storage provider, lifecycle, moderation roles,
   admin publication, course shape, email verification, and library visibility
   are confirmed.
3. **Firebase and identity:** registration, verification, profile provisioning,
   and session lookup are implemented. Configure the Firebase and Worker
   projects and verify the live flow before enabling it for users. Secure
   initial-admin provisioning remains unimplemented; do not treat frontend
   role state as authority.
4. **Trusted API boundary:** extend the Worker profile-backed identity
   foundation with role-specific endpoints and tested server-side permissions.
5. **Academic model and admin setup:** implement departments, courses or
   offerings, sessions, validation, indexes, and initial approved academic
   records.
6. **Student discovery:** implement library search/filtering, course availability
   derived from approved resources, and mobile-first routes/states.
7. **Private files:** implement storage intents, content/size verification,
   private-object lifecycle, expiry/failure recovery, temporary access URLs,
   PDF preview, and downloads.
8. **Contributions and moderation:** implement student submission tracking,
   admin review, idempotent approval/rejection, auditing, cleanup, and
   reporting/takedown handling.
9. **Administration:** implement resource/course/user management, archival,
   constrained role changes, analytics, and logs.
10. **Verification and pilot:** execute unit, integration, security, and
    end-to-end flows; test mobile/low-bandwidth use; conduct student acceptance
    testing; then configure production deployment, monitoring, backups, and
    recovery.

Each phase should remain buildable and be tested before proceeding. No feature
should be described as real until its backend path and relevant authorization
tests exist.

## 7. Foundation work completed now

- The existing React/TypeScript/Vite scaffold was retained.
- A responsive, accessible public landing page and site header were added.
  Its project-status section distinguishes implemented authentication/profile
  flows from the live project configuration, library, uploads, and downloads
  that are still required or unimplemented.
- A restrained academic visual-token foundation was added to Tailwind CSS.
- After owner approval of separate lifecycle dimensions, a Zod-validated
  lifecycle model and transition guards were added for upload processing,
  moderation, and publication. Student library access requires a completed
  upload, approved moderation, and published resource.
- The product owner confirmed that admin-created uploads require an explicit
  publish action after verification; automatic publication is not allowed.
- The product owner confirmed that only admins can approve or reject
  submissions in the MVP; course representatives cannot moderate.
- The product owner confirmed that department, level, and semester remain on
  course records, with Geology as the initial FUNAAB catalog.
- The product owner confirmed email verification before protected student
  features, without requiring a university-domain email address.
- The product owner confirmed that any verified, active FUNAAB student can
  access approved resources in the pilot library; department is not an access
  boundary. The pilot institution is FUNAAB, and students from any FUNAAB
  department may use the initial Geology catalog.
- Firebase Authentication client flows for account creation, sign-in,
  verification/resend, and password reset were added. They require a configured
  Firebase web app in `.env`.
- Registration validates the full name, email, password, and matching password
  confirmation before calling Firebase.
- A typed API client was added to attach verified Firebase ID tokens, enforce
  the configured HTTPS API base, and validate success/error response envelopes
  and endpoint payloads with Zod.
- A Cloudflare Worker foundation now provides health and authenticated session
  endpoints, Firebase JWT signature/issuer/audience verification, verified
  email enforcement, and restricted-origin CORS.
- The Worker provisions student profiles and reads profiles from Firestore
  through Google service-account OAuth. Privileged service-account credentials
  are Worker-only; client Firestore rules deny all direct reads and writes.
  Profile creation is idempotent, including concurrent creation attempts.
- Session requests fail closed unless the Firebase email is verified, a
  correctly shaped Firestore user profile exists, and the account is active.
  Profile creation always assigns the `student` role and ignores client-supplied
  roles or account status.
- Profiles start with nullable department and academic level; the student can
  complete academic details through the verified `/complete-profile` flow.
  The Worker accepts academic levels 100-500 and the approved `geology`
  department ID; other FUNAAB departments remain optional and are stored as
  unset until their approved department records exist. `PATCH
  /api/v1/auth/profile` changes only department, level, and timestamp fields;
  role and active status cannot be supplied by the client.
- The Firestore profile update uses an update mask and an `exists=true`
  precondition, so unrelated fields are preserved and a concurrent document
  deletion cannot create a partial profile.
- `.env.example` shows placeholder-only client configuration; no Worker or
  storage secrets are exposed.
- Firebase project `campus-vault-7575d` now has a registered `Campus Vault Web`
  app, Email/Password Authentication enabled, and `localhost` listed as an
  authorized domain. The default Firestore database was created in `nam5`
  (United States) in Production mode with deny-all client rules, matching
  `firestore.rules`.
- The web app's public Firebase configuration is stored in the ignored local
  `.env.local`; service-account credentials have not been created or configured.
  Firestore profile reads and writes are implemented, but live Worker/Firestore
  operations still require the Worker service-account credentials.
- Academic/resource Firestore integration and R2 integration are not
  implemented. No mock service was relabeled as production functionality.
- The reference folder now contains 10 Geology teaching materials in
  `campus-vault-reference/geology/resources` (five PDFs, three Word documents,
  and two PowerPoint files). Their filenames indicate materials for GLY 306,
  GLY 308, GLY 311, GLY 314, GLY 316, and a 300-level question collection, but
  filenames are not authoritative catalog data. A provisional CSV and README
  have been placed in `campus-vault-reference/geology/catalog/Geology`; they
  mark inferred levels, unknown semesters/titles, and files that cannot be
  mapped to a course. No official course list has been verified, and none of
  the source teaching materials have been copied into the app, seeded, or
  published.
- The Worker now exposes a factory that accepts a token key set for isolated
  tests; production still uses Firebase's remote signing keys. Offline
  integration tests simulate Google OAuth and Firestore to exercise profile
  creation, session loading, and academic updates without a configured Firebase
  project or real credentials. These tests exposed and fixed Firestore's
  permissive tagged-value parsing, which had caused integer academic levels to
  be returned as `null`.

### Local identity setup and verification

The Firebase project, Web app, Email/Password provider, `localhost` authorized
domain, and Firestore database have been initialized. The public landing page
and application shell can run without Worker credentials. Real profile/session
operations still require the Worker service-account configuration:

1. The Web app config is already in the ignored `.env.local`. Restart Vite to
   load the Firebase project settings.
2. In Google Cloud IAM, create a dedicated service account for the Worker with
   only the Firestore profile permissions needed at this stage. Avoid project
   Owner/Editor and broad service-account roles.
3. Add the service-account email and private key to
   `functions/.dev.vars`, using `functions/.dev.vars.example` as the template.
   Never commit `.dev.vars` or expose its private key in frontend variables.
4. Confirm the Firestore rules in the Firebase Console match `firestore.rules`.
5. Start/restart the API from `campus-vault/functions` with `npm run dev`.
6. Test registration, email verification, profile creation, academic profile
   update, sign-in, and session loading against the configured project.

Local project setup verification:

- The database console showed location `nam5`, no collections yet, and the
  initial production rules denied all client reads and writes.
- Email/Password sign-in showed `Enabled`; `localhost` appeared in Authorized
  domains.
- The project has a registered Web app named `Campus Vault Web`; its public
  configuration is in the ignored `.env.local`.
- The private Worker service-account credentials are intentionally not included
  in the repository or chat.

Automated checks run after implementing Firestore-backed identity:

- `functions`: `npm test` passed (11 JWT/authentication, profile-validation,
  Firestore serialization, and simulated profile-flow tests) and
  `npm run typecheck` passed.
- Frontend: `npm run build` passed with the academic profile route. Vite emitted
  non-fatal Rollup annotation warnings from Zod dependency comments.
- `npm audit --omit=dev` reported zero vulnerabilities in both the frontend and
  Worker production dependencies.
- Live Firebase Authentication, Firestore, and service-account operations
  remain unverified until a project is configured.

## 8. Source documents reviewed

- `README.md`
- `TECHNICAL-SPECIFICATION.md`
- `DATABASE_SCHEMA.md`
- `SECURITY_AND_PERMISSIONS.md`
- `API_DOCUMENTATION.md`
- `UI_UX_SPECIFICATION.md`
- `DEVELOPMENT_ROADMAP.md`
- `TESTING_PLAN.md`
