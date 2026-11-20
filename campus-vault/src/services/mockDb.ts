import { seed, type Db } from "@/data/seed";
import type { ApiErrorCode } from "@/types";

const KEY = "campus-vault:db:v1";
let cache: Db | null = null;

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage unavailable: state lives in memory for this tab */
  }
}

export function readDb(): Db {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as Db;
      return cache;
    }
  } catch {
    /* fall through to seed */
  }
  cache = structuredClone(seed);
  persist();
  return cache;
}

/** Call after mutating the object returned by readDb(). */
export const commit = persist;

export function resetDb() {
  cache = structuredClone(seed);
  persist();
}

/** Simulates network latency so loading states get built for real. */
export const wait = (min = 200, max = 500) =>
  new Promise<void>((resolve) =>
    setTimeout(resolve, min + Math.random() * (max - min)),
  );

export const newId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
export const nowIso = () => new Date().toISOString();

/** Same shape as the spec's error response: { code, message } plus an HTTP-style status. */
export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  constructor(code: ApiErrorCode, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function logActivity(
  db: Db,
  actorId: string,
  action: string,
  targetId: string,
  targetType: string,
) {
  db.activityLogs.unshift({
    id: newId("log"),
    actorId,
    action,
    targetId,
    targetType,
    createdAt: nowIso(),
  });
}
