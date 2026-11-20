import { z } from "zod";

export const uploadStatusSchema = z.enum([
  "intent",
  "uploading",
  "verifying",
  "complete",
  "failed",
  "expired",
]);

export const moderationStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
]);
export const publicationStatusSchema = z.enum([
  "unpublished",
  "published",
  "archived",
]);

export const submissionLifecycleSchema = z.object({
  uploadStatus: uploadStatusSchema,
  moderationStatus: moderationStatusSchema,
  publicationStatus: publicationStatusSchema,
});

export type UploadStatus = z.infer<typeof uploadStatusSchema>;
export type ModerationStatus = z.infer<typeof moderationStatusSchema>;
export type PublicationStatus = z.infer<typeof publicationStatusSchema>;
export type SubmissionLifecycle = z.infer<typeof submissionLifecycleSchema>;

const uploadTransitions: Record<UploadStatus, readonly UploadStatus[]> = {
  intent: ["uploading", "expired", "failed"],
  uploading: ["verifying", "expired", "failed"],
  verifying: ["complete", "failed", "expired"],
  complete: [],
  failed: [],
  expired: [],
};

const moderationTransitions: Record<
  ModerationStatus,
  readonly ModerationStatus[]
> = {
  pending: ["approved", "rejected"],
  approved: [],
  rejected: [],
};

const publicationTransitions: Record<
  PublicationStatus,
  readonly PublicationStatus[]
> = {
  unpublished: ["published"],
  published: ["archived"],
  archived: ["published"],
};

export function canTransitionUpload(
  current: UploadStatus,
  next: UploadStatus,
): boolean {
  return uploadTransitions[current].includes(next);
}

export function canTransitionModeration(
  current: ModerationStatus,
  next: ModerationStatus,
): boolean {
  return moderationTransitions[current].includes(next);
}

export function canTransitionPublication(
  current: PublicationStatus,
  next: PublicationStatus,
): boolean {
  return publicationTransitions[current].includes(next);
}

export function isStudentLibraryAccessible(
  lifecycle: SubmissionLifecycle,
): boolean {
  return (
    lifecycle.uploadStatus === "complete" &&
    lifecycle.moderationStatus === "approved" &&
    lifecycle.publicationStatus === "published"
  );
}
