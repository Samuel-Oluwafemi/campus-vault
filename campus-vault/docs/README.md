# Campus Vault

> **Every student deserves access to quality academic resources.**

Campus Vault is a student-focused academic resource platform designed to make lecture notes, past questions, test questions, handouts, and other learning materials accessible in one organised digital library.

Instead of relying entirely on scattered WhatsApp messages, borrowing notes, or searching through different student groups, students can access relevant academic resources based on their department, level, semester, and course.

The goal is simple: **make academic resources easier to find, easier to share, and available to every student who needs them.**

---

## Table of Contents

- [The Problem](<#the-problem>)
- [Our Vision](<#our-vision>)
- [Core Principles](<#core-principles>)
- [How Campus Vault Works](<#how-campus-vault-works>)
- [Core Features](<#core-features>)
- [User Roles](<#user-roles>)
- [Resource Organisation](<#resource-organisation>)
- [MVP Scope](<#mvp-scope>)
- [Proposed Technology Stack](<#proposed-technology-stack>)
- [Data Structure](<#data-structure>)
- [Resource Management Workflow](<#resource-management-workflow>)
- [Security and Content Guidelines](<#security-and-content-guidelines>)
- [Development Roadmap](<#development-roadmap>)
- [Long-Term Possibilities](<#long-term-possibilities>)

---

## The Problem

Students often struggle to access complete and reliable academic materials.

Resources such as lecture notes, past examination questions, test questions, and handouts are frequently distributed through WhatsApp groups or passed between students.

This creates several challenges:

- **Scattered resources:** Academic materials are spread across different WhatsApp groups, devices, and conversations.
- **Incomplete notes:** Some students have complete notes while others have missing topics or outdated materials.
- **Limited access:** Students who are not connected to the right people may struggle to obtain important resources.
- **Poor organisation:** Finding a particular course material or past question from a previous academic session can be difficult.
- **Lost knowledge:** Useful academic resources may disappear when students graduate or leave their groups.

Campus Vault aims to address these problems through a centralised, searchable, and organised academic resource library.

---

## Our Vision

To build a reliable academic resource library where students can access, contribute, and preserve learning materials across different academic levels and generations.

We believe that a student's access to useful academic resources should not depend on who they know, whether they belong to a particular WhatsApp group, or whether someone is available to lend them notes.

Campus Vault is designed around four important ideas:

1. **No student left behind:** Students should have access to complete and useful learning materials.
2. **Prepare ahead:** Students should be able to find relevant past questions, test questions, and lecture materials before examinations.
3. **Preserve academic knowledge:** Resources contributed by current students should remain useful to future students.
4. **Build together:** Students can contribute materials, helping the academic library grow over time.

---

## Core Principles

- **Free access:** Students should be able to access approved academic resources without paying subscription or download fees.
- **Community contribution:** Students can contribute useful notes and other permitted learning materials.
- **Quality control:** Submitted resources should be reviewed before becoming publicly available in the library.
- **Easy discovery:** Materials should be organised by department, level, semester, course, academic session, and resource type.
- **Long-term accessibility:** The platform should preserve useful resources beyond the academic session in which they were contributed.

---

## How Campus Vault Works

Campus Vault follows a simple contribution and access cycle:

1. A student or authorised contributor submits an academic resource.
2. An authorised administrator or course representative reviews the submission.
3. Once approved, the resource becomes available in the relevant course library.
4. Students browse, preview, and download the resource.
5. Future students can access the same approved material.

This creates a growing academic library that benefits multiple student generations.

---

## Core Features

### 1\. Student Accounts

Students can create accounts and access resources relevant to their academic information.

Planned functionality:

- Student registration and login.
- Secure authentication.
- Department selection.
- Academic level selection.
- Access to the relevant resource library.

### 2\. Academic Resource Library

Students can browse resources organised according to their academic structure.

Resources can be filtered by:

- Department.
- Academic level.
- Semester.
- Course.
- Academic session.
- Resource type.

### 3\. Resource Preview and Download

Students can:

- Preview available PDF resources.
- Download approved resources to their devices.
- Access materials using mobile phones and desktop devices.

### 4\. Resource Contributions

Students can submit useful academic materials to help improve the library.

Submissions may include:

- Personal lecture notes.
- Past examination questions.
- Test questions.
- Study materials.
- Other permitted academic resources.

Submitted materials remain pending until reviewed and approved.

### 5\. Admin Dashboard

The admin dashboard provides tools for managing the academic resource library.

Planned functionality:

- Upload academic resources.
- Create and manage departments.
- Create and manage courses.
- Organise resources by level and semester.
- Assign academic sessions and resource types.
- Review pending submissions.
- Approve or reject submissions.
- Edit or remove resources.
- Monitor resource activity.

### 6\. Course Resource Availability

Each course should display the academic resources currently available.

For example:

A course page could show:

- Lecture notes: Available.
- Past questions: Available.
- Test questions: Not yet available.
- Additional study materials: Available.

This makes it easier to identify missing resources and encourages students to contribute what is needed.

---

## User Roles

Campus Vault will initially support three main roles.

| Role | Responsibilities |
| --- | --- |
| Student | Browse, preview, and download approved resources. |
| Contributor | Submit academic resources for review. |
| Administrator | Manage the platform, review submissions, and publish approved resources. |

Course representatives may also be given authorised moderation permissions to help organise and verify resources.

---

## Resource Organisation

Every resource should have enough information to make it easy to identify and retrieve.

Proposed resource metadata:

- Resource title.
- Description.
- Department.
- Academic level.
- Semester.
- Course.
- Academic session.
- Resource type.
- Uploaded by.
- Upload date.
- Approval status.
- File storage reference.

Example:

``` text
Department: Geology
Level: 400
Semester: First Semester
Course: Mineral Exploration
Academic Session: 2025/2026
Resource Type: Past Questions
File Type: PDF
Status: Approved
```

---

## MVP Scope

The first version of Campus Vault will focus on the essential features needed to validate the product with real students.

### Student Experience

- Student registration and login.
- Department and level selection.
- Browse academic resources.
- Filter by semester, course, session, and resource type.
- Preview PDF documents.
- Download resources.

### Admin Experience

- Secure administrator authentication.
- Create and manage courses.
- Upload academic resources.
- Assign resource categories and academic details.
- Review and approve submissions.
- Edit and delete existing resources.
- Manage student and contributor access.

### Initial Pilot

The first pilot will focus on a small collection of academic resources.

Proposed starting targets:

- Three courses.
- Two semesters where materials are available.
- Multiple academic sessions of past questions where available.
- A small collection of lecture notes and test questions.
- Two or more course representatives or trusted contributors.

The platform will initially be tested with students from the relevant department before considering expansion.

---

## Proposed Technology Stack

The following technologies are proposed for the initial implementation. Final storage and infrastructure choices will be confirmed during development.

| Technology | Purpose |
| --- | --- |
| React \& Typescript&#32; | Frontend application |
| Vite | Development and build tooling |
| Firebase Authentication | Student and administrator authentication |
| Cloud Firestore | Academic data and resource metadata |
| Cloudflare R2 or Supabase Storage | Document and file storage |

### Storage Approach

Campus Vault will separate file storage from resource metadata.

- Firestore will store information about courses, users, and uploaded resources.
- Object storage will hold the actual PDF documents and other files.
- Resource records will reference their corresponding storage objects.

This separation makes it easier to manage academic information without storing large document files directly in the database.

---

## Data Structure

The initial database design may include the following collections:

``` text
users/
departments/
courses/
resources/
academicSessions/
activityLogs/
```

### Example Resource Record

``` json
{
  "title": "Mineral Exploration Past Questions",
  "departmentId": "geology",
  "level": 400,
  "semester": "first",
  "courseId": "mineral-exploration",
  "academicSession": "2025/2026",
  "resourceType": "past-question",
  "storagePath": "resources/geology/400/mineral-exploration/file.pdf",
  "uploadedBy": "user-id",
  "approvalStatus": "approved"
}
```

The actual implementation may include additional fields for file size, upload timestamps, review history, and resource verification.

---

## Resource Management Workflow

Campus Vault will use a controlled upload and approval process.

``` text
Student / Contributor
        |
        v
Submit Academic Resource
        |
        v
File Validation
        |
        v
Pending Review
        |
        v
Admin / Course Representative
        |
        v
Approve or Reject
        |
        v
Approved Resource Library
        |
        v
Students Access and Download
```

Files should be checked for supported formats, reasonable file sizes, readability, duplicates, and inappropriate or private information before publication.

---

## Security and Content Guidelines

Campus Vault should protect both its users and the academic resources hosted on the platform.

Important considerations:

- Only authenticated users should access protected platform features.
- Only authorised administrators should approve, edit, or delete published resources.
- Upload permissions must be enforced through backend security rules, not simply hidden frontend buttons.
- Files should be validated before upload.
- Private files should not be exposed through unrestricted public storage links.
- Student personal information should not be published accidentally.
- Contributors should have permission to share materials they submit.
- Copyrighted lecture materials and restricted examination documents must only be distributed where permission or applicable rules allow.
- Student-created notes should be clearly distinguished from official university materials.

Campus Vault is intended to support learning, not replace official course materials or university communication channels.

---

## Development Roadmap

The project will be developed in stages.

| Stage | Focus |
| --- | --- |
| 1\. Discovery | Speak with students and course representatives; validate the problem. |
| 2\. Resource Collection | Obtain and organise permitted academic materials. |
| 3\. Product Design | Design the student experience and admin dashboard. |
| 4\. Core Development | Build authentication, resource browsing, uploads, and management. |
| 5\. Testing | Test file uploads, access permissions, downloads, and mobile usability. |
| 6\. Pilot Launch | Introduce the platform to a small group of students. |
| 7\. Improvement | Gather feedback and improve the experience before expanding. |

---

## Long-Term Possibilities

Once the initial platform is working reliably, Campus Vault could expand to support:

- More departments and faculties.
- More academic levels and institutions.
- Advanced search across academic resources.
- Resource contribution tracking.
- Course representative dashboards.
- Recently added resources.
- Resource quality ratings or feedback.
- Improved resource verification.
- Academic resource analytics.

These are future possibilities, not requirements for the first release.

---

## Our Commitment

Campus Vault is built around a simple belief:

**No student should have to struggle to access useful academic resources simply because they do not know the right person.**

By bringing students together to contribute, organise, and preserve academic materials, we can create a resource library that benefits not only current students but also the generations that come after them.

**Campus Vault — Learn together. Share knowledge. Stay prepared.**