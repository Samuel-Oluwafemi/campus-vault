import {
  ApiError,
  commit,
  logActivity,
  newId,
  nowIso,
  readDb,
  wait,
} from "./mockDb";
import { requireUser } from "./authService";
import {
  submissionSchema,
  validateFile,
  type FileLike,
  type SubmissionInput,
} from "@/validators";
import type { Resource, Submission } from "@/types";

export const submissionService = {
  /**
   * Mirrors POST /api/submissions. Per spec 4.1 any signed-in student can submit.
   * (Spec 4.2 also defines a separate contributor role. Decide before the backend exists.)
   */
  async create(input: SubmissionInput, file: FileLike): Promise<Submission> {
    await wait(400, 900);
    const user = requireUser();
    const parsed = submissionSchema.safeParse(input);
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_FAILED",
        parsed.error.issues[0]?.message ?? "Check the form.",
        422,
      );
    }
    const fileError = validateFile(file);
    if (fileError) {
      throw new ApiError(
        file.size > 0 && file.type && fileError.includes("20 MB")
          ? "FILE_TOO_LARGE"
          : "VALIDATION_FAILED",
        fileError,
        422,
      );
    }
    const db = readDb();
    if (!db.courses.some((c) => c.id === parsed.data.courseId)) {
      throw new ApiError("VALIDATION_FAILED", "Select a valid course.", 422);
    }
    const id = newId("s");
    const ext = file.name.split(".").pop() ?? "pdf";
    const submission: Submission = {
      id,
      resourceTitle: parsed.data.resourceTitle,
      description: parsed.data.description,
      courseId: parsed.data.courseId,
      academicSessionId: parsed.data.academicSessionId,
      resourceType: parsed.data.resourceType,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      storageKey: `pending/submissions/${id}.${ext}`,
      uploadedBy: user.uid,
      status: "pending",
      reviewedBy: null,
      reviewNote: null,
      createdAt: nowIso(),
      reviewedAt: null,
    };
    db.submissions.unshift(submission);
    commit();
    return submission;
  },

  async listMine(): Promise<Submission[]> {
    await wait();
    const user = requireUser();
    return readDb().submissions.filter((s) => s.uploadedBy === user.uid);
  },

  // ---- admin ----
  async listForReview(
    status: Submission["status"] = "pending",
  ): Promise<Submission[]> {
    await wait();
    requireUser("admin");
    return readDb()
      .submissions.filter((s) => s.status === status)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  /** Approving publishes a new Resource built from the submission. */
  async approve(
    id: string,
    reviewNote: string | null = null,
  ): Promise<Resource> {
    await wait();
    const admin = requireUser("admin");
    const db = readDb();
    const s = db.submissions.find((x) => x.id === id);
    if (!s)
      throw new ApiError(
        "RESOURCE_NOT_FOUND",
        "This submission could not be found.",
        404,
      );
    if (s.status !== "pending")
      throw new ApiError(
        "CONFLICT",
        "This submission was already reviewed.",
        409,
      );
    const course = db.courses.find((c) => c.id === s.courseId);
    if (!course)
      throw new ApiError(
        "VALIDATION_FAILED",
        "The course for this submission no longer exists.",
        422,
      );

    const resource: Resource = {
      id: newId("r"),
      title: s.resourceTitle,
      description: s.description,
      departmentId: course.departmentId,
      courseId: course.id,
      level: course.level,
      semester: course.semester,
      academicSessionId: s.academicSessionId,
      resourceType: s.resourceType,
      fileName: s.fileName,
      storageKey: `resources/${course.departmentId}/${course.id}/${s.id}`,
      fileType: s.fileType,
      fileSize: s.fileSize,
      uploadedBy: s.uploadedBy,
      approvalStatus: "approved",
      approvedBy: admin.uid,
      approvedAt: nowIso(),
      downloadCount: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.resources.unshift(resource);
    Object.assign(s, {
      status: "approved",
      reviewedBy: admin.uid,
      reviewNote,
      reviewedAt: nowIso(),
    });
    logActivity(db, admin.uid, "submission.approved", s.id, "submission");
    commit();
    return resource;
  },

  async reject(
    id: string,
    reviewNote: string | null = null,
  ): Promise<Submission> {
    await wait();
    const admin = requireUser("admin");
    const db = readDb();
    const s = db.submissions.find((x) => x.id === id);
    if (!s)
      throw new ApiError(
        "RESOURCE_NOT_FOUND",
        "This submission could not be found.",
        404,
      );
    if (s.status !== "pending")
      throw new ApiError(
        "CONFLICT",
        "This submission was already reviewed.",
        409,
      );
    Object.assign(s, {
      status: "rejected",
      reviewedBy: admin.uid,
      reviewNote,
      reviewedAt: nowIso(),
    });
    logActivity(db, admin.uid, "submission.rejected", s.id, "submission");
    commit();
    return s;
  },
};
