import { z } from "zod";
import { RESOURCE_TYPES } from "@/types";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@/utils/constants";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
  departmentId: z.string().min(1, "Select your department"),
  level: z.number().int().min(100).max(600),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const submissionSchema = z.object({
  resourceTitle: z
    .string()
    .trim()
    .min(3, "Title is too short")
    .max(120, "Title is too long"),
  description: z
    .string()
    .trim()
    .max(500, "Keep the description under 500 characters")
    .default(""),
  courseId: z.string().min(1, "Select a course"),
  academicSessionId: z.string().min(1, "Select an academic session"),
  resourceType: z.enum(RESOURCE_TYPES),
});
export type SubmissionInput = z.input<typeof submissionSchema>;

export interface FileLike {
  name: string;
  type: string;
  size: number;
}

/** Returns an error message, or null when the file is acceptable. Runs in the browser and later again on the server. */
export function validateFile(file: FileLike): string | null {
  if (!(ALLOWED_FILE_TYPES as readonly string[]).includes(file.type)) {
    return "Upload a PDF, JPG, PNG or WEBP file.";
  }
  if (file.size > MAX_FILE_SIZE) return "This file is over the 20 MB limit.";
  if (file.size === 0) return "This file is empty.";
  return null;
}
