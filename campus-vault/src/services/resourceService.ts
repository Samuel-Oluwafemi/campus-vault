import { ApiError, commit, logActivity, nowIso, readDb, wait } from "./mockDb";
import { requireUser } from "./authService";
import { SAMPLE_PDF_URL } from "@/data/seed";
import { PAGE_SIZE } from "@/utils/constants";
import { RESOURCE_TYPES } from "@/types";
import type {
  ApprovalStatus,
  Page,
  Resource,
  ResourceType,
  Semester,
} from "@/types";

export interface ResourceFilters {
  departmentId?: string;
  level?: number;
  semester?: Semester;
  courseId?: string;
  academicSessionId?: string;
  resourceType?: ResourceType;
  search?: string;
  cursor?: string | null;
  pageSize?: number;
}

export interface AccessGrant {
  url: string;
  expiresAt: string;
}

function paginate<T>(
  items: T[],
  cursor: string | null | undefined,
  pageSize = PAGE_SIZE,
): Page<T> {
  const start = cursor ? Number(cursor) || 0 : 0;
  const slice = items.slice(start, start + pageSize);
  const next = start + pageSize;
  return {
    items: slice,
    nextCursor: next < items.length ? String(next) : null,
  };
}

export const resourceService = {
  /** Approved resources only, newest first. Mirrors GET /api/resources. */
  async list(f: ResourceFilters = {}): Promise<Page<Resource>> {
    await wait();
    requireUser();
    const db = readDb();
    const q = f.search?.trim().toLowerCase();
    const matched = db.resources
      .filter((r) => r.approvalStatus === "approved")
      .filter((r) => !f.departmentId || r.departmentId === f.departmentId)
      .filter((r) => !f.level || r.level === f.level)
      .filter((r) => !f.semester || r.semester === f.semester)
      .filter((r) => !f.courseId || r.courseId === f.courseId)
      .filter(
        (r) =>
          !f.academicSessionId || r.academicSessionId === f.academicSessionId,
      )
      .filter((r) => !f.resourceType || r.resourceType === f.resourceType)
      .filter((r) => {
        if (!q) return true;
        const c = db.courses.find((x) => x.id === r.courseId);
        return [r.title, r.description, c?.courseCode, c?.courseTitle].some(
          (s) => s?.toLowerCase().includes(q),
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return paginate(matched, f.cursor, f.pageSize);
  },

  async getById(id: string): Promise<Resource> {
    await wait();
    const user = requireUser();
    const r = readDb().resources.find((x) => x.id === id);
    const visible =
      r && (r.approvalStatus === "approved" || user.role === "admin");
    if (!r || !visible)
      throw new ApiError(
        "RESOURCE_NOT_FOUND",
        "This resource is unavailable.",
        404,
      );
    return r;
  },

  /** Derived from approved records, never stored as labels (spec 8.4). */
  async getAvailability(
    courseId: string,
  ): Promise<Record<ResourceType, boolean>> {
    await wait(100, 250);
    requireUser();
    const approved = readDb().resources.filter(
      (r) => r.courseId === courseId && r.approvalStatus === "approved",
    );
    return Object.fromEntries(
      RESOURCE_TYPES.map((t) => [
        t,
        approved.some((r) => r.resourceType === t),
      ]),
    ) as Record<ResourceType, boolean>;
  },

  /** Mirrors POST /api/resources/:id/preview and /download. Real version returns a short-lived R2 URL. */
  async requestAccess(
    id: string,
    kind: "preview" | "download",
  ): Promise<AccessGrant> {
    await wait();
    const user = requireUser();
    const db = readDb();
    const r = db.resources.find((x) => x.id === id);
    if (!r || (r.approvalStatus !== "approved" && user.role !== "admin")) {
      throw new ApiError(
        "RESOURCE_NOT_FOUND",
        "This resource is unavailable.",
        404,
      );
    }
    if (kind === "download") {
      r.downloadCount += 1;
      commit();
    }
    return {
      url: SAMPLE_PDF_URL,
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    };
  },

  // ---- admin ----
  async adminList(status?: ApprovalStatus): Promise<Resource[]> {
    await wait();
    requireUser("admin");
    return readDb()
      .resources.filter((r) => !status || r.approvalStatus === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async updateMetadata(
    id: string,
    patch: Partial<
      Pick<
        Resource,
        | "title"
        | "description"
        | "courseId"
        | "academicSessionId"
        | "resourceType"
      >
    >,
  ): Promise<Resource> {
    await wait();
    const admin = requireUser("admin");
    const db = readDb();
    const r = db.resources.find((x) => x.id === id);
    if (!r)
      throw new ApiError(
        "RESOURCE_NOT_FOUND",
        "This resource could not be found.",
        404,
      );
    Object.assign(r, patch, { updatedAt: nowIso() });
    if (patch.courseId) {
      const c = db.courses.find((x) => x.id === patch.courseId);
      if (c)
        Object.assign(r, {
          departmentId: c.departmentId,
          level: c.level,
          semester: c.semester,
        });
    }
    logActivity(db, admin.uid, "resource.updated", id, "resource");
    commit();
    return r;
  },

  async setStatus(
    id: string,
    status: "approved" | "archived",
  ): Promise<Resource> {
    await wait();
    const admin = requireUser("admin");
    const db = readDb();
    const r = db.resources.find((x) => x.id === id);
    if (!r)
      throw new ApiError(
        "RESOURCE_NOT_FOUND",
        "This resource could not be found.",
        404,
      );
    r.approvalStatus = status;
    r.updatedAt = nowIso();
    logActivity(
      db,
      admin.uid,
      status === "archived" ? "resource.archived" : "resource.approved",
      id,
      "resource",
    );
    commit();
    return r;
  },

  async remove(id: string): Promise<void> {
    await wait();
    const admin = requireUser("admin");
    const db = readDb();
    const i = db.resources.findIndex((x) => x.id === id);
    if (i === -1)
      throw new ApiError(
        "RESOURCE_NOT_FOUND",
        "This resource could not be found.",
        404,
      );
    db.resources.splice(i, 1);
    logActivity(db, admin.uid, "resource.deleted", id, "resource");
    commit();
  },
};
