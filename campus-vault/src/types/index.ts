export const ROLES = ['student', 'contributor', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const SEMESTERS = ['first', 'second'] as const;
export type Semester = (typeof SEMESTERS)[number];

export const RESOURCE_TYPES = [
  'lecture-note',
  'past-question',
  'test-question',
  'handout',
  'study-material',
  'other',
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'archived';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

/** ISO 8601 string. Firestore Timestamps get converted at the service boundary later. */
export type ISODate = string;

export interface User {
  uid: string;
  fullName: string;
  email: string;
  departmentId: string;
  level: number;
  role: Role;
  isActive: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt: ISODate;
}

export interface Course {
  id: string;
  courseCode: string;
  courseTitle: string;
  departmentId: string;
  level: number;
  semester: Semester;
  isActive: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface AcademicSession {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: ISODate;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  courseId: string;
  level: number;
  semester: Semester;
  academicSessionId: string;
  resourceType: ResourceType;
  fileName: string;
  storageKey: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  approvalStatus: ApprovalStatus;
  approvedBy: string | null;
  approvedAt: ISODate | null;
  downloadCount: number;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Submission {
  id: string;
  resourceTitle: string;
  description: string;
  courseId: string;
  academicSessionId: string;
  resourceType: ResourceType;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  uploadedBy: string;
  status: SubmissionStatus;
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: ISODate;
  reviewedAt: ISODate | null;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  action: string;
  targetId: string;
  targetType: string;
  createdAt: ISODate;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/** Mirrors the error codes in the spec's API section so the swap to a real backend is painless. */
export type ApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'PERMISSION_DENIED'
  | 'RESOURCE_NOT_FOUND'
  | 'CONFLICT'
  | 'FILE_TOO_LARGE'
  | 'VALIDATION_FAILED'
  | 'INTERNAL_ERROR';
