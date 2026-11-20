import { readDb, wait } from "./mockDb";
import { requireUser } from "./authService";
import type { ActivityLog } from "@/types";

export interface PlatformStats {
  approvedResources: number;
  pendingSubmissions: number;
  students: number;
  courses: number;
  totalDownloads: number;
}

export const adminService = {
  async getStats(): Promise<PlatformStats> {
    await wait();
    requireUser("admin");
    const db = readDb();
    return {
      approvedResources: db.resources.filter(
        (r) => r.approvalStatus === "approved",
      ).length,
      pendingSubmissions: db.submissions.filter((s) => s.status === "pending")
        .length,
      students: db.users.filter((u) => u.role !== "admin").length,
      courses: db.courses.filter((c) => c.isActive).length,
      totalDownloads: db.resources.reduce((sum, r) => sum + r.downloadCount, 0),
    };
  },

  async listActivity(limit = 20): Promise<ActivityLog[]> {
    await wait();
    requireUser("admin");
    return readDb().activityLogs.slice(0, limit);
  },
};
