import { z } from 'zod';
import { academicLevelOptions } from '@/types/profile';

export const academicProfileInputSchema = z.object({
  department: z.enum(['geology', 'other'], {
    error: 'Choose Geology or indicate that your department is not listed.',
  }),
  level: z.preprocess(
    (value) => typeof value === 'string' && value !== '' ? Number(value) : value,
    z.union(academicLevelOptions.map((level) => z.literal(level))),
  ),
});

export const profileCreationInputSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(120, 'Your name must be 120 characters or fewer.'),
});

export type AcademicProfileInput = z.infer<typeof academicProfileInputSchema>;
