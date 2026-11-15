# Campus Vault — Implementation Decisions

**Status:** Audit complete; some product decisions pending  
**Scope:** Documentation audit and safe project-foundation work  
**Last reviewed:** 2026-11-14

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
| Institution scope | The product owner confirmed a one-department pilot within one university on 2026-11-14, and selected Geology on 2026-11-15. `TECHNICAL-SPECIFICATION.md` excludes multiple-university tenancy for the MVP. | Use a single-institution Geology pilot. Do not design cross-institution access into the MVP. |
| Academic relationships | The product owner confirmed that department, level, and semester remain on each course record for the one-department MVP on 2026-11-14. Academic session remains resource metadata. | Matches the current schema and seed model and keeps the pilot simple. Revisit separate offerings before broader expansion if course identity needs reuse across academic structures. |
| Storage provider | The product owner selected Cloudflare R2 on 2026-11-14. The source documents had kept R2 and Supabase Storage as alternatives, with the technical specification leaning toward R2. | Use R2 for the MVP; private access, upload signing, verification, cleanup, Worker credentials, and operational configuration still need implementation and testing. |
| Email verification | The product owner confirmed that verified email is required before protected student features, with no university-domain restriction, on 2026-11-14. | Authentication must retain an unverified state and gate protected features until Firebase confirms verification. |
| Resource access | The product owner confirmed that any verified, active student at the university may browse approved resources for the one-department pilot on 2026-11-15. Department information organizes the library; it is not an access boundary. | The Worker must enforce verified identity and active account status, but must not restrict student library queries to the user's department. |
| Copyright and moderation | The documents require a permission declaration and moderation, and warn about copyrighted or restricted materials. They do not define complaint/takedown handling, retention, appeals, or who makes a legal determination. | A declaration alone does not resolve rights disputes or define a safe response to reported content. |
| API contract | `API_DOCUMENTATION.md` specifies `/api/v1`, while other sections and docs use `/api` and inconsistent endpoint shapes. Resource fields and status names also vary (`status`, `approvalStatus`, `fileType`, `mimeType`). | Client and Worker implementations could drift, and security-sensitive states may be parsed inconsistently. |
| File policy | Roadmap and API documents specify PDF-only for the MVP. `DATABASE_SCHEMA.md` and `README.md` also mention images; UI plans a PDF viewer and the security plan requires actual-content checks. | Supporting images expands validation, preview, and abuse-handling requirements without clear MVP need. |
| Data and storage consistency | Firestore and object storage cannot share a transaction. The schema and technical docs mention retry, cleanup, and idempotency but do not select a reconciliation/retention policy for abandoned or rejected files. | Partial failures can leave orphaned objects or records unless upload state and cleanup are designed together. |
| Current implementation | Firebase Authentication client flows, a Firebase-token API client, and a Cloudflare Worker health/session endpoint are implemented but require project/API configuration. Academic/admin services still use localStorage, demo identities, client-side role checks, simulated latency, and sample PDF access; Firestore integration is not implemented. | The Worker verifies Firebase token signatures and email verification for its session endpoint, but does not yet verify a Firestore user profile, active account status, or roles. Resource authorization, uploads, previews, and downloads remain unimplemented or prototype behavior. |

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
| Initial institutional scope | **Confirmed:** one Geology department in one university for the initial pilot. Do not design cross-institution access into the MVP. | Simpler data boundaries and admin operations. Expansion beyond the pilot will require a deliberate schema and authorization migration. |
| Storage provider | **Confirmed:** Cloudflare R2. Keep objects private and issue short-lived URLs only from the trusted backend. | Aligns with the documented Workers architecture; requires R2 configuration and Worker-held credentials. |
| Submission states | **Confirmed:** separate upload processing (`intent`, `uploading`, `verifying`, `failed`, `expired`, `complete`) from moderation (`pending`, `approved`, `rejected`) and resource publication (`unpublished`, `published`, `archived`). Use explicit, auditable transitions. | Prevents upload failures and archival from masquerading as moderation decisions. Domain schemas and transition guards are in place; persistence and API implementation require the backend phase. |
| Admin-created resources | **Confirmed:** require a distinct explicit publish action after a successful verified upload. Student submissions still require an admin moderation decision. | Resolves the docs' immediate-publication vs approval conflict. Publication remains an explicit, auditable backend action. |
| Course representatives | **Confirmed:** course representatives have no approval/rejection privileges in the MVP. They can contribute as students/contributors. Revisit scoped moderation only with explicit assignment, scope, audit, conflict-of-interest, and revocation rules. | Avoids granting broad admin access and narrows the initial permission model. |
| Academic data model | **Confirmed:** keep department, level, and semester on each course record for the one-department MVP. Keep the single-institution boundary; do not design cross-institution access into the MVP. | Matches the current course schema and reduces pilot complexity. Reassess before expanding to structures where the same course has multiple offerings. |
| Email verification | **Confirmed:** require verified email before access to protected student features; no university-domain restriction. | Reduces disposable-account abuse while avoiding an institution-specific email restriction. |
| Student library visibility | **Confirmed:** any verified, active student at the university may browse approved resources in the one-department pilot. Department is an organizational filter, not an access boundary. | Matches the free, open library goal. Backend authorization will check verified identity and account status, not department membership. |
| Copyright/content process | Require a contributor rights/permission declaration and provide a clear reporting/takedown and review path before pilot. Do not claim that the declaration alone establishes legal permission. | Gives moderators a response path; policy wording and retention/appeal details still need product/legal input. |
| Canonical API contract | Use `/api/v1`, one set of field names, and shared Zod contracts at the Worker boundary; route all protected data through the Worker rather than relying on client-side Firestore permissions. | `/api/v1` is configured as the example base URL; the Worker contract and Firebase trust configuration remain to be implemented and tested. |

## 5. Architectural blockers

The following work is blocked pending decisions or infrastructure:

1. **Real file upload, preview, and download:** blocked by private R2 bucket
   setup, Worker credentials, and upload lifecycle persistence and verification.
2. **Submission and moderation implementation:** lifecycle dimensions,
   admin-only moderation, and the admin explicit-publish policy are confirmed;
   persistence, API behavior, and private storage workflow remain unimplemented.
3. **Production authorization and academic data seeding:** pilot scope and
   course data shape are confirmed; real backend enforcement and verified
   Geology academic catalog data are still required.
4. **Authentication rollout:** client-side Firebase Auth flows and Worker ID
   token verification are implemented. The Firebase project must be configured;
   Firestore profiles, active-account/role checks, and initial admin provisioning
   remain unimplemented.
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
3. **Firebase and identity:** configure Firebase Authentication; implement
   registration, verification, profiles, sessions, and secure initial-admin
   provisioning. Do not treat frontend role state as authority.
4. **Trusted API boundary:** extend the Worker token-verification foundation
   with Firestore profile/role access, shared endpoint schemas, and tested
   server-side permissions.
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
  Its project-status section distinguishes configured Firebase authentication
  from the unconnected profiles, live library, uploads, and downloads.
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
  course records for the one-department MVP.
- The product owner confirmed email verification before protected student
  features, without requiring a university-domain email address.
- The product owner confirmed that any verified, active university student can
  access approved resources in the pilot library; department is not an access
  boundary.
- Firebase Authentication client flows for account creation, sign-in,
  verification/resend, and password reset were added. They require a configured
  Firebase web app in `.env`; no Firestore profile is connected yet.
- Registration validates the full name, email, password, and matching password
  confirmation before calling Firebase.
- A typed API client was added to attach verified Firebase ID tokens, enforce
  the configured HTTPS API base, and validate success/error response envelopes
  and endpoint payloads with Zod.
- A Cloudflare Worker foundation now provides health and authenticated session
  endpoints, Firebase JWT signature/issuer/audience verification, verified
  email enforcement, and restricted-origin CORS. It does not yet check a
  Firestore user profile, active status, or role, and therefore does not expose
  resource or admin operations.
- `.env.example` shows placeholder-only client configuration; no Worker or
  storage secrets are exposed.
- Firebase Authentication SDK and Worker dependencies are installed. Firestore
  and R2 integration are not implemented, and no mock service was relabeled as
  production functionality.

## 8. Source documents reviewed

- `README.md`
- `TECHNICAL-SPECIFICATION.md`
- `DATABASE_SCHEMA.md`
- `SECURITY_AND_PERMISSIONS.md`
- `API_DOCUMENTATION.md`
- `UI_UX_SPECIFICATION.md`
- `DEVELOPMENT_ROADMAP.md`
- `TESTING_PLAN.md`
