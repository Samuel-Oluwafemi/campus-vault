import type { ResourceType, Semester } from '@/types';

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  'lecture-note': 'Lecture notes',
  'past-question': 'Past questions',
  'test-question': 'Test questions',
  handout: 'Handouts',
  'study-material': 'Study materials',
  other: 'Other',
};

export const SEMESTER_LABELS: Record<Semester, string> = {
  first: 'First semester',
  second: 'Second semester',
};

export const PAGE_SIZE = 20;
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB, spec 7.2
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
