import { ApiError, commit, newId, nowIso, readDb, wait } from "./mockDb";
import { registerSchema, type RegisterInput } from "@/validators";
import type { Role, User } from "@/types";

const SESSION_KEY = "campus-vault:session";

function currentUid(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}
function setUid(uid: string | null) {
  try {
    if (uid) localStorage.setItem(SESSION_KEY, uid);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Used by the other services to mimic "the backend verified the token". Not for components. */
export function requireUser(...roles: Role[]): User {
  const uid = currentUid();
  const user = uid
    ? readDb().users.find((u) => u.uid === uid && u.isActive)
    : undefined;
  if (!user) throw new ApiError("UNAUTHENTICATED", "Log in to continue.", 401);
  if (roles.length && !roles.includes(user.role)) {
    throw new ApiError(
      "PERMISSION_DENIED",
      "You do not have permission to do this.",
      403,
    );
  }
  return user;
}

export const authService = {
  async getCurrentUser(): Promise<User | null> {
    await wait(100, 250);
    const uid = currentUid();
    return (
      (uid && readDb().users.find((u) => u.uid === uid && u.isActive)) || null
    );
  },

  /** Mock login: any password works. Real version: Firebase signInWithEmailAndPassword. */
  async login(email: string, _password = ""): Promise<User> {
    await wait();
    const user = readDb().users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!user || !user.isActive) {
      throw new ApiError(
        "UNAUTHENTICATED",
        "Email or password is incorrect.",
        401,
      );
    }
    setUid(user.uid);
    return user;
  },

  async register(input: RegisterInput): Promise<User> {
    await wait();
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_FAILED",
        parsed.error.issues[0]?.message ?? "Check your details.",
        422,
      );
    }
    const db = readDb();
    if (
      db.users.some(
        (u) => u.email.toLowerCase() === parsed.data.email.toLowerCase(),
      )
    ) {
      throw new ApiError(
        "CONFLICT",
        "An account with this email already exists.",
        409,
      );
    }
    const user: User = {
      uid: newId("u"),
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      departmentId: parsed.data.departmentId,
      level: parsed.data.level,
      role: "student",
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.users.push(user);
    commit();
    setUid(user.uid);
    return user;
  },

  async logout(): Promise<void> {
    await wait(50, 120);
    setUid(null);
  },

  /** Dev only: lets you flip between student, contributor and admin without a login form. */
  async listDemoUsers(): Promise<User[]> {
    return readDb().users;
  },
  async switchDemoUser(uid: string): Promise<User> {
    const user = readDb().users.find((u) => u.uid === uid);
    if (!user) throw new ApiError("RESOURCE_NOT_FOUND", "User not found.", 404);
    setUid(uid);
    return user;
  },
};
