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
import type { AcademicSession, Course, Department, Semester } from "@/types";

export interface CourseFilters {
  departmentId?: string;
  level?: number;
  semester?: Semester;
  includeInactive?: boolean;
}

export const academicService = {
  async listDepartments(): Promise<Department[]> {
    await wait();
    requireUser();
    return readDb().departments.filter((x) => x.isActive);
  },

  async listSessions(): Promise<AcademicSession[]> {
    await wait();
    requireUser();
    return [...readDb().academicSessions].sort((a, b) =>
      b.name.localeCompare(a.name),
    );
  },

  async listCourses(f: CourseFilters = {}): Promise<Course[]> {
    await wait();
    requireUser();
    return readDb()
      .courses.filter((c) => (f.includeInactive ? true : c.isActive))
      .filter((c) => !f.departmentId || c.departmentId === f.departmentId)
      .filter((c) => !f.level || c.level === f.level)
      .filter((c) => !f.semester || c.semester === f.semester)
      .sort((a, b) => a.courseCode.localeCompare(b.courseCode));
  },

  async getCourse(id: string): Promise<Course> {
    await wait();
    requireUser();
    const course = readDb().courses.find((c) => c.id === id);
    if (!course)
      throw new ApiError(
        "RESOURCE_NOT_FOUND",
        "This course could not be found.",
        404,
      );
    return course;
  },

  // ---- admin ----
  async createCourse(
    input: Pick<
      Course,
      "courseCode" | "courseTitle" | "departmentId" | "level" | "semester"
    >,
  ): Promise<Course> {
    await wait();
    const admin = requireUser("admin");
    const db = readDb();
    const code = input.courseCode.trim().toUpperCase();
    if (
      db.courses.some(
        (c) => c.courseCode === code && c.departmentId === input.departmentId,
      )
    ) {
      throw new ApiError(
        "CONFLICT",
        `${code} already exists in this department.`,
        409,
      );
    }
    const course: Course = {
      ...input,
      courseCode: code,
      courseTitle: input.courseTitle.trim(),
      id: code.toLowerCase(),
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.courses.push(course);
    logActivity(db, admin.uid, "course.created", course.id, "course");
    commit();
    return course;
  },

  async updateCourse(
    id: string,
    patch: Partial<
      Pick<Course, "courseTitle" | "level" | "semester" | "isActive">
    >,
  ): Promise<Course> {
    await wait();
    const admin = requireUser("admin");
    const db = readDb();
    const course = db.courses.find((c) => c.id === id);
    if (!course)
      throw new ApiError(
        "RESOURCE_NOT_FOUND",
        "This course could not be found.",
        404,
      );
    Object.assign(course, patch, { updatedAt: nowIso() });
    logActivity(db, admin.uid, "course.updated", id, "course");
    commit();
    return course;
  },

  async createDepartment(
    input: Pick<Department, "name" | "code" | "description">,
  ): Promise<Department> {
    await wait();
    const admin = requireUser("admin");
    const db = readDb();
    const code = input.code.trim().toUpperCase();
    if (db.departments.some((x) => x.code === code)) {
      throw new ApiError(
        "CONFLICT",
        `A department with code ${code} already exists.`,
        409,
      );
    }
    const dept: Department = {
      id: newId("dept"),
      ...input,
      code,
      isActive: true,
      createdAt: nowIso(),
    };
    db.departments.push(dept);
    logActivity(db, admin.uid, "department.created", dept.id, "department");
    commit();
    return dept;
  },
};
