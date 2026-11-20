import { z } from "zod";

export const userProfileSchema = z.object({
  uid: z.string().min(1),
  fullName: z.string().min(2),
  email: z.string().email(),
  departmentId: z.string().nullable(),
  level: z.number().int().min(100).max(600).nullable(),
  role: z.enum(["student", "contributor", "admin"]),
  isActive: z.boolean(),
  emailVerified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const userSessionSchema = z.object({
  profile: userProfileSchema,
  emailVerified: z.literal(true),
});

export const academicLevelOptions = [100, 200, 300, 400, 500] as const;

export type AcademicLevel = (typeof academicLevelOptions)[number];
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserSession = z.infer<typeof userSessionSchema>;
