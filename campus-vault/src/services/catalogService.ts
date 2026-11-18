import { z } from 'zod';
import { publicApiRequest } from '@/services/apiClient';

const courseSchema = z.object({
  id: z.string().min(1),
  departmentId: z.literal('geology'),
  code: z.string().min(1),
  title: z.string().nullable(),
  level: z.literal(300),
  semester: z.string().nullable(),
  status: z.literal('provisional'),
  levelInferred: z.literal(true),
  sourceFiles: z.array(z.string()),
  resourcesAvailable: z.boolean().optional().default(false),
});

const catalogResponseSchema = z.object({
  departmentId: z.literal('geology'),
  status: z.literal('provisional'),
  courses: z.array(courseSchema),
  unassignedPastQuestionReferences: z.array(z.string().min(1)),
});

export type CatalogCourse = z.infer<typeof courseSchema>;

export async function getGeologyCourseCatalog(signal?: AbortSignal) {
  return publicApiRequest(
    '/courses?departmentId=geology',
    catalogResponseSchema,
    { signal },
  );
}
