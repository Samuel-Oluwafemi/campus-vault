import type {
  AcademicSession, ActivityLog, Course, Department, Resource, Submission, User,
} from '@/types';

export const SAMPLE_PDF_URL =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

export interface Db {
  users: User[];
  departments: Department[];
  academicSessions: AcademicSession[];
  courses: Course[];
  resources: Resource[];
  submissions: Submission[];
  activityLogs: ActivityLog[];
}

const departments: Department[] = [
  { id: 'geology', name: 'Geology', code: 'GEO', description: 'Department of Geology', isActive: true, createdAt: d(200) },
  { id: 'chemistry', name: 'Chemistry', code: 'CHM', description: 'Department of Chemistry', isActive: true, createdAt: d(200) },
];

const academicSessions: AcademicSession[] = [
  { id: '2024-2025', name: '2024/2025', isActive: false, createdAt: d(400) },
  { id: '2025-2026', name: '2025/2026', isActive: true, createdAt: d(200) },
];

const course = (
  id: string, courseCode: string, courseTitle: string, departmentId: string,
  level: number, semester: 'first' | 'second',
): Course => ({ id, courseCode, courseTitle, departmentId, level, semester, isActive: true, createdAt: d(200), updatedAt: d(200) });

const courses: Course[] = [
  course('geo201', 'GEO201', 'Structural Geology', 'geology', 200, 'first'),
  course('geo301', 'GEO301', 'Sedimentology', 'geology', 300, 'second'),
  course('geo401', 'GEO401', 'Mineral Exploration', 'geology', 400, 'first'),
  course('geo402', 'GEO402', 'Hydrogeology', 'geology', 400, 'second'),
  course('chm101', 'CHM101', 'General Chemistry I', 'chemistry', 100, 'first'),
];

const users: User[] = [
  { uid: 'u-student', fullName: 'Ada Student', email: 'ada@student.test', departmentId: 'geology', level: 300, role: 'student', isActive: true, createdAt: d(150), updatedAt: d(150) },
  { uid: 'u-contrib', fullName: 'Tunde Rep', email: 'tunde@student.test', departmentId: 'geology', level: 400, role: 'contributor', isActive: true, createdAt: d(150), updatedAt: d(150) },
  { uid: 'u-admin', fullName: 'Admin User', email: 'admin@campusvault.test', departmentId: 'geology', level: 400, role: 'admin', isActive: true, createdAt: d(150), updatedAt: d(150) },
];

const res = (
  id: string, title: string, courseId: string, resourceType: Resource['resourceType'],
  academicSessionId: string, approvalStatus: Resource['approvalStatus'], daysAgo: number, downloads = 0,
): Resource => {
  const c = courses.find((x) => x.id === courseId)!;
  const approved = approvalStatus === 'approved';
  return {
    id, title, description: `${title} for ${c.courseCode}`, departmentId: c.departmentId, courseId,
    level: c.level, semester: c.semester, academicSessionId, resourceType,
    fileName: `${c.courseCode.toLowerCase()}-${resourceType}.pdf`,
    storageKey: `resources/${c.departmentId}/${courseId}/${id}.pdf`,
    fileType: 'application/pdf', fileSize: 1_200_000 + daysAgo * 10_000,
    uploadedBy: 'u-admin', approvalStatus,
    approvedBy: approved ? 'u-admin' : null, approvedAt: approved ? d(daysAgo) : null,
    downloadCount: downloads, createdAt: d(daysAgo), updatedAt: d(daysAgo),
  };
};

const resources: Resource[] = [
  res('r1', 'Structural Geology Lecture Notes', 'geo201', 'lecture-note', '2025-2026', 'approved', 30, 42),
  res('r2', 'Sedimentology Past Questions', 'geo301', 'past-question', '2024-2025', 'approved', 25, 77),
  res('r3', 'Mineral Exploration Past Questions', 'geo401', 'past-question', '2025-2026', 'approved', 12, 130),
  res('r4', 'Mineral Exploration Lecture Notes', 'geo401', 'lecture-note', '2025-2026', 'approved', 10, 64),
  res('r5', 'Mineral Exploration Handout: Sampling', 'geo401', 'handout', '2025-2026', 'approved', 5, 9),
  res('r6', 'Hydrogeology Test Questions', 'geo402', 'test-question', '2025-2026', 'approved', 3, 4),
  res('r7', 'General Chemistry I Past Questions', 'chm101', 'past-question', '2024-2025', 'approved', 40, 210),
  res('r8', 'Outdated Structural Geology Handout', 'geo201', 'handout', '2024-2025', 'archived', 90, 15),
];

const submissions: Submission[] = [
  {
    id: 's1', resourceTitle: 'Hydrogeology Lecture Notes', description: 'Full semester notes from Dr. Bello.',
    courseId: 'geo402', academicSessionId: '2025-2026', resourceType: 'lecture-note',
    fileName: 'geo402-notes.pdf', fileType: 'application/pdf', fileSize: 3_100_000,
    storageKey: 'pending/submissions/s1.pdf', uploadedBy: 'u-contrib', status: 'pending',
    reviewedBy: null, reviewNote: null, createdAt: d(1), reviewedAt: null,
  },
  {
    id: 's2', resourceTitle: 'Blurry Scan of Sedimentology Notes', description: '',
    courseId: 'geo301', academicSessionId: '2025-2026', resourceType: 'lecture-note',
    fileName: 'scan.jpg', fileType: 'image/jpeg', fileSize: 900_000,
    storageKey: 'pending/submissions/s2.jpg', uploadedBy: 'u-student', status: 'rejected',
    reviewedBy: 'u-admin', reviewNote: 'The scan is not readable. Upload a clearer copy.', createdAt: d(6), reviewedAt: d(5),
  },
];

export const seed: Db = { users, departments, academicSessions, courses, resources, submissions, activityLogs: [] };
