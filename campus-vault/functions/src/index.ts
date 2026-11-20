import { createRemoteJWKSet, errors as joseErrors, importPKCS8, jwtVerify, SignJWT } from 'jose';
import { z } from 'zod';
import { provisionalGeologyCourses, provisionalGeologyPastQuestionReferences } from './catalog.ts';
import type { SupabaseStorageEnv } from './supabaseStorage.ts';
import { createPrivateSignedUrl, listPrivateObjects, removePrivateObject, uploadPrivateObject, SupabaseStorageError } from './supabaseStorage.ts';

interface Env extends SupabaseStorageEnv {
  APP_ORIGIN?: string;
  ADMIN_EMAILS?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_SERVICE_ACCOUNT_EMAIL?: string;
  FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
}

const firebaseClaimsSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email().optional(),
  email_verified: z.boolean().optional().default(false),
});

const profileSchema = z.object({
  uid: z.string().min(1),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().email(),
  departmentId: z.string().nullable(),
  level: z.number().int().min(100).max(600).nullable(),
  role: z.enum(['student', 'contributor', 'admin']),
  isActive: z.boolean(),
  emailVerified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict();

const createProfileBodySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
}).strict();

const submissionFormSchema = z.object({
  resourceTitle: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).default(''),
  courseId: z.string().trim().min(1),
  academicSessionId: z.string().trim().min(1),
  resourceType: z.enum(['lecture-note', 'past-question', 'test-question', 'handout', 'study-material', 'other']),
}).strict();

const adminResourceFormSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).default(''),
  courseId: z.string().trim().min(1).max(80),
  level: z.union([z.literal(100), z.literal(200), z.literal(300), z.literal(400), z.literal(500)]),
  semester: z.enum(['first', 'second']),
  academicSessionId: z.string().trim().min(1).max(30),
  resourceType: z.enum(['lecture-note', 'past-question', 'test-question', 'handout', 'study-material', 'other']),
}).strict();

const importAdminResourceSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).default(''),
  fileName: z.string().trim().min(1).max(255),
  courseId: z.string().trim().min(1).max(80),
  level: z.union([z.literal(100), z.literal(200), z.literal(300), z.literal(400), z.literal(500)]),
  semester: z.enum(['first', 'second']),
  academicSessionId: z.string().trim().min(1).max(30),
  resourceType: z.enum(['lecture-note', 'past-question', 'test-question', 'handout', 'study-material', 'other']),
}).strict();

export const updateAcademicProfileBodySchema = z.object({
  departmentId: z.literal('geology').nullable(),
  level: z.union([
    z.literal(100),
    z.literal(200),
    z.literal(300),
    z.literal(400),
    z.literal(500),
  ]),
}).strict();

const firestoreDocumentSchema = z.object({
  fields: z.record(z.string(), z.unknown()),
});
const firestoreStringValue = z.object({ stringValue: z.string() }).strict();
const firestoreBooleanValue = z.object({ booleanValue: z.boolean() }).strict();
const firestoreIntegerValue = z.object({ integerValue: z.union([z.string(), z.number()]) }).strict();
const firestoreTimestampValue = z.object({ timestampValue: z.string() }).strict();
const firestoreNullValue = z.object({ nullValue: z.string().nullable() }).strict();
const googleAccessTokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().positive(),
  token_type: z.literal('Bearer'),
});

type FirebaseClaims = z.infer<typeof firebaseClaimsSchema>;
type UserProfile = z.infer<typeof profileSchema>;

const firebaseJwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

let cachedGoogleToken: { token: string; expiresAt: number } | null = null;
let googleTokenRequest: Promise<string> | null = null;

class ProfileStoreError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    message: string,
    status: number,
    code: string,
  ) {
    super(message);
    this.name = 'ProfileStoreError';
    this.status = status;
    this.code = code;
  }
}

function response(data: unknown, status: number, origin: string | null, env: Env): Response {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  if (origin && allowedOrigin(origin, env)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  origin: string | null,
  env: Env,
): Response {
  return response({ success: false, error: { code, message } }, status, origin, env);
}

function allowedOrigin(origin: string | null, env: Env): boolean {
  return origin === null ||
    origin === env.APP_ORIGIN ||
    origin === 'http://localhost:5173';
}

export async function authenticateRequest(
  request: Request,
  env: Env,
  keySet: ReturnType<typeof createRemoteJWKSet> = firebaseJwks,
): Promise<{ claims: FirebaseClaims } | { response: Response }> {
  const origin = request.headers.get('Origin');
  const tokenMatch = request.headers.get('Authorization')?.match(/^Bearer\s+([^\s]+)$/i);
  if (!tokenMatch) {
    return { response: errorResponse('AUTH_REQUIRED', 'A Firebase ID token is required.', 401, origin, env) };
  }

  const projectId = env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId || projectId.startsWith('your-')) {
    return {
      response: errorResponse(
        'API_NOT_CONFIGURED',
        'Firebase project configuration is missing on the backend.',
        503,
        origin,
        env,
      ),
    };
  }

  try {
    const { payload } = await jwtVerify(tokenMatch[1], keySet, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256'],
    });
    const parsedClaims = firebaseClaimsSchema.safeParse(payload);
    if (!parsedClaims.success) {
      return { response: errorResponse('TOKEN_INVALID', 'The Firebase ID token is invalid.', 401, origin, env) };
    }
    if (!parsedClaims.data.email_verified) {
      return {
        response: errorResponse(
          'EMAIL_NOT_VERIFIED',
          'Verify your email before using protected student features.',
          403,
          origin,
          env,
        ),
      };
    }
    return { claims: parsedClaims.data };
  } catch (error) {
    console.warn('Firebase ID token verification failed.', error instanceof Error ? error.name : 'Unknown error');
    if (!(error instanceof joseErrors.JOSEError)) {
      return {
        response: errorResponse(
          'AUTH_PROVIDER_UNAVAILABLE',
          'Authentication could not be verified right now. Try again shortly.',
          503,
          origin,
          env,
        ),
      };
    }
    return {
      response: errorResponse('TOKEN_INVALID', 'The Firebase ID token is invalid or expired.', 401, origin, env),
    };
  }
}

function configuredProjectId(env: Env): string {
  const projectId = env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId || projectId.startsWith('your-')) {
    throw new ProfileStoreError('Firebase project configuration is missing.', 503, 'API_NOT_CONFIGURED');
  }
  return projectId;
}

function parseFirestoreProfile(value: unknown, expectedUid: string): UserProfile {
  const document = firestoreDocumentSchema.safeParse(value);
  if (!document.success) {
    throw new ProfileStoreError('The stored user profile is invalid.', 500, 'PROFILE_INVALID');
  }

  const fields = document.data.fields;
  function stringField(name: string): string {
    const parsed = firestoreStringValue.safeParse(fields[name]);
    if (!parsed.success) throw new ProfileStoreError('The stored user profile is invalid.', 500, 'PROFILE_INVALID');
    return parsed.data.stringValue;
  }
  function nullableStringField(name: string): string | null {
    if (fields[name] === undefined) return null;
    const parsedString = firestoreStringValue.safeParse(fields[name]);
    if (parsedString.success) return parsedString.data.stringValue;
    const parsedNull = firestoreNullValue.safeParse(fields[name]);
    if (parsedNull.success) return null;
    throw new ProfileStoreError('The stored user profile is invalid.', 500, 'PROFILE_INVALID');
  }

  let level: number | null = null;
  if (fields.level !== undefined) {
    const parsedNull = firestoreNullValue.safeParse(fields.level);
    if (!parsedNull.success) {
      const parsedInteger = firestoreIntegerValue.safeParse(fields.level);
      if (!parsedInteger.success) {
        throw new ProfileStoreError('The stored user profile is invalid.', 500, 'PROFILE_INVALID');
      }
      level = Number(parsedInteger.data.integerValue);
    }
  }

  const isActive = firestoreBooleanValue.safeParse(fields.isActive);
  const emailVerified = firestoreBooleanValue.safeParse(fields.emailVerified);
  const createdAt = firestoreTimestampValue.safeParse(fields.createdAt);
  const updatedAt = firestoreTimestampValue.safeParse(fields.updatedAt);
  if (!isActive.success || !emailVerified.success || !createdAt.success || !updatedAt.success) {
    throw new ProfileStoreError('The stored user profile is invalid.', 500, 'PROFILE_INVALID');
  }

  const profile = profileSchema.safeParse({
    uid: stringField('uid'),
    fullName: stringField('fullName'),
    email: stringField('email'),
    departmentId: nullableStringField('departmentId'),
    level,
    role: stringField('role'),
    isActive: isActive.data.booleanValue,
    emailVerified: emailVerified.data.booleanValue,
    createdAt: createdAt.data.timestampValue,
    updatedAt: updatedAt.data.timestampValue,
  });
  if (!profile.success || profile.data.uid !== expectedUid) {
    throw new ProfileStoreError('The stored user profile is invalid.', 500, 'PROFILE_INVALID');
  }
  return profile.data;
}

async function getGoogleAccessToken(env: Env): Promise<string> {
  if (cachedGoogleToken && cachedGoogleToken.expiresAt > Date.now() + 60_000) {
    return cachedGoogleToken.token;
  }
  if (googleTokenRequest) return googleTokenRequest;

  googleTokenRequest = (async () => {
    const serviceAccountEmail = env.FIREBASE_SERVICE_ACCOUNT_EMAIL?.trim();
    const privateKeyPem = env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
    if (!serviceAccountEmail || !privateKeyPem || serviceAccountEmail.startsWith('your-')) {
      throw new ProfileStoreError(
        'Firestore service-account credentials are not configured on the backend.',
        503,
        'BACKEND_NOT_CONFIGURED',
      );
    }

    try {
      const issuedAt = Math.floor(Date.now() / 1000);
      const key = await importPKCS8(privateKeyPem, 'RS256');
      const assertion = await new SignJWT({
        scope: 'https://www.googleapis.com/auth/datastore',
      })
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuer(serviceAccountEmail)
        .setAudience('https://oauth2.googleapis.com/token')
        .setIssuedAt(issuedAt)
        .setExpirationTime(issuedAt + 3600)
        .sign(key);

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion,
        }),
      });
      if (!tokenResponse.ok) {
        throw new ProfileStoreError('Google could not authorize Firestore access.', 503, 'FIRESTORE_AUTH_FAILED');
      }

      const token = googleAccessTokenSchema.safeParse(await tokenResponse.json());
      if (!token.success) {
        throw new ProfileStoreError('Google returned an invalid authorization response.', 503, 'FIRESTORE_AUTH_FAILED');
      }
      cachedGoogleToken = {
        token: token.data.access_token,
        expiresAt: Date.now() + token.data.expires_in * 1000,
      };
      return token.data.access_token;
    } catch (error) {
      if (error instanceof ProfileStoreError) throw error;
      console.error('Firestore service-account authorization failed.', error instanceof Error ? error.name : 'Unknown error');
      throw new ProfileStoreError('Firestore authorization could not be completed.', 503, 'FIRESTORE_AUTH_FAILED');
    } finally {
      googleTokenRequest = null;
    }
  })();

  return googleTokenRequest;
}

async function firestoreRequest(env: Env, path: string, init: RequestInit = {}): Promise<Response> {
  const projectId = configuredProjectId(env);
  const accessToken = await getGoogleAccessToken(env);
  try {
    return await fetch(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${path}`,
      {
        ...init,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...init.headers,
        },
      },
    );
  } catch (error) {
    console.error('Firestore request failed.', error instanceof Error ? error.name : 'Unknown error');
    throw new ProfileStoreError('Firestore could not be reached.', 503, 'FIRESTORE_UNAVAILABLE');
  }
}

async function readProfile(env: Env, uid: string): Promise<UserProfile> {
  const result = await firestoreRequest(env, `users/${encodeURIComponent(uid)}`);
  if (result.status === 404) {
    throw new ProfileStoreError('The user profile has not been created.', 404, 'PROFILE_NOT_FOUND');
  }
  if (!result.ok) {
    console.error('Firestore profile read failed.', result.status);
    throw new ProfileStoreError('The user profile could not be loaded.', 503, 'FIRESTORE_UNAVAILABLE');
  }
  const profile = parseFirestoreProfile(await result.json(), uid);
  const adminEmails = (env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.includes(profile.email.toLowerCase())) {
    return { ...profile, role: 'admin' };
  }
  return profile;
}

export function firestoreValue(value: string | number | boolean | null): Record<string, unknown> {
  if (value === null) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return { integerValue: value.toString() };
  return { stringValue: value };
}

function firestoreString(fields: Record<string, unknown>, name: string): string | null {
  const value = fields[name] as { stringValue?: unknown } | undefined;
  return typeof value?.stringValue === 'string' ? value.stringValue : null;
}

function firestoreNumber(fields: Record<string, unknown>, name: string, fallback = 0): number {
  const value = fields[name] as { integerValue?: unknown } | undefined;
  const parsed = typeof value?.integerValue === 'string'
    ? Number(value.integerValue)
    : typeof value?.integerValue === 'number'
      ? value.integerValue
      : fallback;
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function listFirestoreDocuments(env: Env, collection: string): Promise<Array<{ id: string; fields: Record<string, unknown> }>> {
  const result = await firestoreRequest(env, `${collection}?pageSize=100`);
  if (result.status === 404) {
    return [];
  }
  if (!result.ok) {
    console.error('Firestore resource collection read failed.', result.status);
    throw new ProfileStoreError('The resource records could not be loaded.', 503, 'FIRESTORE_UNAVAILABLE');
  }
  const payload = await result.json() as { documents?: Array<{ name?: string; fields?: Record<string, unknown> }> };
  return (payload.documents ?? []).map((document) => ({
    id: document.name?.split('/').pop() ?? '',
    fields: document.fields ?? {},
  })).filter((document) => document.id);
}

async function createProfile(
  env: Env,
  claims: FirebaseClaims,
  fullName: string,
): Promise<UserProfile> {
  if (!claims.email) {
    throw new ProfileStoreError('The verified account does not contain an email address.', 400, 'EMAIL_REQUIRED');
  }

  const now = new Date().toISOString();
  const fields = {
    uid: firestoreValue(claims.sub),
    fullName: firestoreValue(fullName),
    email: firestoreValue(claims.email),
    departmentId: firestoreValue(null),
    level: firestoreValue(null),
    role: firestoreValue('student'),
    isActive: firestoreValue(true),
    emailVerified: firestoreValue(true),
    createdAt: { timestampValue: now },
    updatedAt: { timestampValue: now },
  };
  const result = await firestoreRequest(
    env,
    `users?documentId=${encodeURIComponent(claims.sub)}`,
    { method: 'POST', body: JSON.stringify({ fields }) },
  );
  if (result.status === 409) return readProfile(env, claims.sub);
  if (!result.ok) {
    console.error('Firestore profile create failed.', result.status);
    throw new ProfileStoreError('The user profile could not be created.', 503, 'PROFILE_CREATE_FAILED');
  }
  return parseFirestoreProfile(await result.json(), claims.sub);
}

async function updateAcademicProfile(
  env: Env,
  uid: string,
  input: z.infer<typeof updateAcademicProfileBodySchema>,
): Promise<UserProfile> {
  const updatedAt = new Date().toISOString();
  const updateMask = new URLSearchParams();
  for (const field of ['departmentId', 'level', 'updatedAt']) {
    updateMask.append('updateMask.fieldPaths', field);
  }
  updateMask.set('currentDocument.exists', 'true');
  const fields = {
    departmentId: firestoreValue(input.departmentId),
    level: firestoreValue(input.level),
    updatedAt: { timestampValue: updatedAt },
  };
  const result = await firestoreRequest(
    env,
    `users/${encodeURIComponent(uid)}?${updateMask.toString()}`,
    { method: 'PATCH', body: JSON.stringify({ fields }) },
  );
  if (result.status === 404) {
    throw new ProfileStoreError('The user profile has not been created.', 404, 'PROFILE_NOT_FOUND');
  }
  if (!result.ok) {
    console.error('Firestore profile update failed.', result.status);
    throw new ProfileStoreError('The academic profile could not be updated.', 503, 'PROFILE_UPDATE_FAILED');
  }
  return parseFirestoreProfile(await result.json(), uid);
}

function profileStoreErrorResponse(error: unknown, origin: string | null, env: Env): Response {
  if (error instanceof SupabaseStorageError) {
    return errorResponse(error.code, error.message, error.status, origin, env);
  }
  if (error instanceof ProfileStoreError) {
    return errorResponse(error.code, error.message, error.status, origin, env);
  }
  console.error('Unexpected profile operation failure.', error instanceof Error ? error.name : 'Unknown error');
  return errorResponse('INTERNAL_ERROR', 'The request could not be completed.', 500, origin, env);
}

export function createWorker(
  keySet: ReturnType<typeof createRemoteJWKSet> = firebaseJwks,
): ExportedHandler<Env> {
  return {
    async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      if (!allowedOrigin(origin, env)) {
        return errorResponse('ORIGIN_NOT_ALLOWED', 'This application origin is not allowed.', 403, null, env);
      }
      const headers = new Headers({
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '600',
        'Vary': 'Origin',
      });
      if (origin) headers.set('Access-Control-Allow-Origin', origin);
      return new Response(null, { status: 204, headers });
    }

    if (!allowedOrigin(origin, env)) {
      return errorResponse('ORIGIN_NOT_ALLOWED', 'This application origin is not allowed.', 403, null, env);
    }

    if (url.pathname === '/api/v1/health' && request.method === 'GET') {
      return response({ success: true, data: { status: 'ok' } }, 200, origin, env);
    }

    if (url.pathname === '/api/v1/courses' && request.method === 'GET') {
      const departmentId = url.searchParams.get('departmentId');
      if (departmentId && departmentId !== 'geology') {
        return errorResponse(
          'DEPARTMENT_NOT_FOUND',
          'The requested department is not in the provisional catalog.',
          404,
          origin,
          env,
        );
      }
      return response(
        {
          success: true,
          data: {
            departmentId: 'geology',
            status: 'provisional',
            courses: provisionalGeologyCourses,
            unassignedPastQuestionReferences: provisionalGeologyPastQuestionReferences,
          },
        },
        200,
        origin,
        env,
      );
    }

    const isSessionRequest = url.pathname === '/api/v1/auth/session' && request.method === 'GET';
    const isProfileCreateRequest = url.pathname === '/api/v1/auth/profile' && request.method === 'POST';
    const isProfileUpdateRequest = url.pathname === '/api/v1/auth/profile' && request.method === 'PATCH';
    const isSubmissionCreateRequest = url.pathname === '/api/v1/submissions' && request.method === 'POST';
    const isSubmissionListRequest = url.pathname === '/api/v1/submissions/mine' && request.method === 'GET';
    const isAdminResourceCreateRequest = url.pathname === '/api/v1/admin/resources' && request.method === 'POST';
    const isAdminResourceImportRequest = url.pathname === '/api/v1/admin/resources/import' && request.method === 'POST';
    const isResourceListRequest = url.pathname === '/api/v1/resources' && request.method === 'GET';
    const accessMatch = url.pathname.match(/^\/api\/v1\/resources\/([^/]+)\/(preview|download)$/);
    const isResourceAccessRequest = Boolean(accessMatch &&
      ((accessMatch[2] === 'preview' && request.method === 'POST') ||
        (accessMatch[2] === 'download' && request.method === 'GET')));
    if (!isSessionRequest && !isProfileCreateRequest && !isProfileUpdateRequest &&
      !isSubmissionCreateRequest && !isSubmissionListRequest && !isAdminResourceCreateRequest &&
      !isAdminResourceImportRequest &&
      !isResourceListRequest && !isResourceAccessRequest) {
      const knownPath =
        url.pathname === '/api/v1/auth/session' ||
        url.pathname === '/api/v1/auth/profile' ||
        url.pathname === '/api/v1/courses' ||
        url.pathname === '/api/v1/submissions' ||
        url.pathname === '/api/v1/submissions/mine' ||
        url.pathname === '/api/v1/admin/resources' ||
        url.pathname === '/api/v1/admin/resources/import' ||
        url.pathname === '/api/v1/resources' ||
        /^\/api\/v1\/resources\/[^/]+\/(preview|download)$/.test(url.pathname);
      return knownPath
        ? errorResponse('METHOD_NOT_ALLOWED', 'This method is not supported for the route.', 405, origin, env)
        : errorResponse('NOT_FOUND', 'The requested API route was not found.', 404, origin, env);
    }

    const authentication = await authenticateRequest(request, env, keySet);
    if ('response' in authentication) return authentication.response;

    try {
      if (isSubmissionCreateRequest || isSubmissionListRequest || isAdminResourceCreateRequest ||
        isAdminResourceImportRequest || isResourceListRequest || isResourceAccessRequest) {
        const profile = await readProfile(env, authentication.claims.sub);
        if (!profile.isActive) {
          return errorResponse('ACCOUNT_INACTIVE', 'This account is not active.', 403, origin, env);
        }

        if ((isAdminResourceCreateRequest || isAdminResourceImportRequest) && profile.role !== 'admin') {
          return errorResponse('PERMISSION_DENIED', 'Only admins can publish resources.', 403, origin, env);
        }
        if ((isSubmissionCreateRequest || isSubmissionListRequest) && profile.role !== 'admin') {
          return errorResponse(
            'PERMISSION_DENIED',
            'Only an admin can use the resource submission workflow.',
            403,
            origin,
            env,
          );
        }

        if (isAdminResourceImportRequest) {
          const body = await request.json().catch(() => null);
          const input = importAdminResourceSchema.safeParse(body);
          if (!input.success) {
            return errorResponse('VALIDATION_ERROR', 'Check the resource metadata and filename.', 422, origin, env);
          }
          const normalizedFileName = input.data.fileName.replace(/^\/+/, '').replace(/\\/g, '/');
          if (!normalizedFileName || normalizedFileName.includes('..') || normalizedFileName.includes('/')) {
            return errorResponse('VALIDATION_ERROR', 'Use a filename that is directly in the resources bucket root.', 422, origin, env);
          }

          const existingResources = await listFirestoreDocuments(env, 'resources');
          if (existingResources.some((resource) =>
            firestoreString(resource.fields, 'fileName') === normalizedFileName)) {
            return errorResponse('CONFLICT', 'This PDF is already indexed.', 409, origin, env);
          }

          const resourceId = crypto.randomUUID();
          const now = new Date().toISOString();
          const fields = {
            title: firestoreValue(input.data.title),
            description: firestoreValue(input.data.description),
            departmentId: firestoreValue('geology'),
            courseId: firestoreValue(input.data.courseId),
            level: firestoreValue(input.data.level),
            semester: firestoreValue(input.data.semester),
            academicSessionId: firestoreValue(input.data.academicSessionId),
            resourceType: firestoreValue(input.data.resourceType),
            fileName: firestoreValue(normalizedFileName),
            storageKey: firestoreValue(normalizedFileName),
            fileType: firestoreValue('application/pdf'),
            fileSize: firestoreValue(0),
            uploadedBy: firestoreValue(authentication.claims.sub),
            approvalStatus: firestoreValue('approved'),
            approvedBy: firestoreValue(authentication.claims.sub),
            approvedAt: { timestampValue: now },
            downloadCount: firestoreValue(0),
            createdAt: { timestampValue: now },
            updatedAt: { timestampValue: now },
          };
          const createResult = await firestoreRequest(
            env,
            `resources?documentId=${encodeURIComponent(resourceId)}`,
            { method: 'POST', body: JSON.stringify({ fields }) },
          );
          if (!createResult.ok) {
            throw new ProfileStoreError('The existing PDF could not be indexed.', 503, 'FIRESTORE_UNAVAILABLE');
          }
          return response({
            success: true,
            data: { id: resourceId, title: input.data.title, fileName: normalizedFileName, approvalStatus: 'approved' },
          }, 201, origin, env);
        }

        if (isAdminResourceCreateRequest) {
          const form = await request.formData();
          const input = adminResourceFormSchema.safeParse({
            title: form.get('title'),
            description: form.get('description') ?? '',
            courseId: form.get('courseId'),
            level: Number(form.get('level')),
            semester: form.get('semester'),
            academicSessionId: form.get('academicSessionId'),
            resourceType: form.get('resourceType'),
          });
          if (!input.success) {
            return errorResponse('VALIDATION_ERROR', 'Check the resource title, course, level, session, semester, and type.', 422, origin, env);
          }
          const file = form.get('file');
          if (!(file instanceof File) || file.size === 0) {
            return errorResponse('VALIDATION_ERROR', 'Choose a non-empty PDF file.', 422, origin, env);
          }
          if (file.type !== 'application/pdf') {
            return errorResponse('VALIDATION_ERROR', 'Only PDF files are allowed.', 422, origin, env);
          }
          if (file.size > 20 * 1024 * 1024) {
            return errorResponse('FILE_TOO_LARGE', 'This file is over the 20 MB limit.', 422, origin, env);
          }

          const resourceId = crypto.randomUUID();
          const safeCourseId = input.data.courseId.replace(/[^a-zA-Z0-9_-]/g, '-');
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/\.{2,}/g, '.');
          const storageKey = `resources/${input.data.level}/${safeCourseId}/${resourceId}-${safeName}`;
          await uploadPrivateObject(env, storageKey, await file.arrayBuffer(), 'application/pdf');

          const now = new Date().toISOString();
          const fields = {
            title: firestoreValue(input.data.title),
            description: firestoreValue(input.data.description),
            departmentId: firestoreValue('geology'),
            courseId: firestoreValue(input.data.courseId),
            level: firestoreValue(input.data.level),
            semester: firestoreValue(input.data.semester),
            academicSessionId: firestoreValue(input.data.academicSessionId),
            resourceType: firestoreValue(input.data.resourceType),
            fileName: firestoreValue(file.name),
            storageKey: firestoreValue(storageKey),
            fileType: firestoreValue('application/pdf'),
            fileSize: firestoreValue(file.size),
            uploadedBy: firestoreValue(authentication.claims.sub),
            approvalStatus: firestoreValue('approved'),
            approvedBy: firestoreValue(authentication.claims.sub),
            approvedAt: { timestampValue: now },
            downloadCount: firestoreValue(0),
            createdAt: { timestampValue: now },
            updatedAt: { timestampValue: now },
          };
          const createResult = await firestoreRequest(
            env,
            `resources?documentId=${encodeURIComponent(resourceId)}`,
            { method: 'POST', body: JSON.stringify({ fields }) },
          );
          if (!createResult.ok) {
            await removePrivateObject(env, storageKey);
            throw new ProfileStoreError('The resource metadata could not be recorded.', 503, 'FIRESTORE_UNAVAILABLE');
          }
          return response({
            success: true,
            data: { id: resourceId, title: input.data.title, storageKey, approvalStatus: 'approved' },
          }, 201, origin, env);
        }

        if (isResourceListRequest) {
          const objects = await listPrivateObjects(env);
          const items = objects.map((object) => {
            const name = object.name;
            const courseMatch = name.match(/(?:GLY\s*|gly[- ]*)(304|305|306|308|310|311|314|316)/i);
            const courseCode = courseMatch ? `GLY ${courseMatch[1]}` : '';
            const title = name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
            return {
              id: name,
              title: title || name,
              description: courseCode ? `Approved Geology resource for ${courseCode}.` : 'Approved Geology resource.',
              departmentId: 'geology',
              courseId: courseCode || 'geology-300',
              level: 300,
              semester: 'first',
              academicSessionId: '2025/2026',
              resourceType: /PQ|past|question/i.test(name) ? 'past-question' : 'study-material',
              fileName: name,
              storageKey: name,
              fileType: 'application/pdf',
              fileSize: object.size,
              uploadedBy: '',
              approvalStatus: 'approved',
              approvedBy: authentication.claims.sub,
              approvedAt: object.createdAt,
              downloadCount: 0,
              createdAt: object.createdAt ?? new Date().toISOString(),
              updatedAt: object.createdAt ?? new Date().toISOString(),
            };
          });
          return response({ success: true, data: { items, nextCursor: null } }, 200, origin, env);
        }

        if (isSubmissionListRequest) {
          const documents = await listFirestoreDocuments(env, 'submissions');
          const items = documents
            .filter((document) => firestoreString(document.fields, 'uploadedBy') === authentication.claims.sub)
            .map((document) => ({
              id: document.id,
              resourceTitle: firestoreString(document.fields, 'resourceTitle') ?? '',
              description: firestoreString(document.fields, 'description') ?? '',
              courseId: firestoreString(document.fields, 'courseId') ?? '',
              academicSessionId: firestoreString(document.fields, 'academicSessionId') ?? '',
              resourceType: firestoreString(document.fields, 'resourceType') ?? 'other',
              fileName: firestoreString(document.fields, 'fileName') ?? '',
              fileType: firestoreString(document.fields, 'fileType') ?? 'application/pdf',
              fileSize: firestoreNumber(document.fields, 'fileSize'),
              storageKey: firestoreString(document.fields, 'storageKey') ?? '',
              uploadedBy: firestoreString(document.fields, 'uploadedBy') ?? '',
              status: firestoreString(document.fields, 'status') ?? 'pending',
              reviewedBy: firestoreString(document.fields, 'reviewedBy'),
              reviewNote: firestoreString(document.fields, 'reviewNote'),
              createdAt: firestoreString(document.fields, 'createdAt') ?? new Date().toISOString(),
              reviewedAt: firestoreString(document.fields, 'reviewedAt'),
            }));
          return response({ success: true, data: items }, 200, origin, env);
        }

        if (isResourceAccessRequest && accessMatch) {
          const resourceId = accessMatch[1];
          const kind = accessMatch[2] as 'preview' | 'download';
          let storageKey: string;
          try {
            storageKey = decodeURIComponent(resourceId);
          } catch {
            return errorResponse('RESOURCE_NOT_FOUND', 'This resource is unavailable.', 404, origin, env);
          }
          const objects = await listPrivateObjects(env);
          if (!objects.some((object) => object.name === storageKey)) {
            return errorResponse('RESOURCE_NOT_FOUND', 'This resource is unavailable.', 404, origin, env);
          }
          const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
          const downloadName = kind === 'download'
            ? storageKey.split('/').pop() ?? 'campus-vault-resource.pdf'
            : undefined;
          const url = await createPrivateSignedUrl(env, storageKey, 300, downloadName);
          if (kind === 'download') {
            const fileResponse = await fetch(url);
            if (!fileResponse.ok) {
              console.error('Signed PDF download fetch failed.', fileResponse.status);
              return errorResponse('STORAGE_DOWNLOAD_FAILED', 'The PDF could not be downloaded.', 503, origin, env);
            }
            const headers = new Headers({
              'Content-Type': fileResponse.headers.get('Content-Type') ?? 'application/pdf',
              'Content-Disposition': `attachment; filename="${downloadName ?? 'campus-vault-resource.pdf'}"`,
              'Cache-Control': 'no-store',
              'X-Content-Type-Options': 'nosniff',
            });
            if (origin && allowedOrigin(origin, env)) {
              headers.set('Access-Control-Allow-Origin', origin);
              headers.set('Vary', 'Origin');
            }
            return new Response(fileResponse.body, { status: 200, headers });
          }
          return response({ success: true, data: { url, expiresAt, kind } }, 200, origin, env);
        }

        const form = await request.formData();
        const input = submissionFormSchema.safeParse({
          resourceTitle: form.get('resourceTitle'),
          description: form.get('description') ?? '',
          courseId: form.get('courseId'),
          academicSessionId: form.get('academicSessionId'),
          resourceType: form.get('resourceType'),
        });
        if (!input.success) {
          return errorResponse('VALIDATION_ERROR', 'Check the submission title, course, session, and resource type.', 422, origin, env);
        }
        const course = provisionalGeologyCourses.find((item) => item.id === input.data.courseId);
        if (!course) {
          return errorResponse('VALIDATION_ERROR', 'Select a valid course.', 422, origin, env);
        }
        const file = form.get('file');
        if (!(file instanceof File) || file.size === 0) {
          return errorResponse('VALIDATION_ERROR', 'Choose a non-empty PDF file.', 422, origin, env);
        }
        if (file.type !== 'application/pdf') {
          return errorResponse('VALIDATION_ERROR', 'Only PDF files are allowed.', 422, origin, env);
        }
        if (file.size > 20 * 1024 * 1024) {
          return errorResponse('FILE_TOO_LARGE', 'This file is over the 20 MB limit.', 422, origin, env);
        }

        const submissionId = crypto.randomUUID();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/\.{2,}/g, '.');
        const storageKey = `pending/submissions/${submissionId}-${safeName}`;
        await uploadPrivateObject(env, storageKey, await file.arrayBuffer(), 'application/pdf');

        const now = new Date().toISOString();
        const fields = {
          resourceTitle: firestoreValue(input.data.resourceTitle),
          description: firestoreValue(input.data.description),
          courseId: firestoreValue(input.data.courseId),
          academicSessionId: firestoreValue(input.data.academicSessionId),
          resourceType: firestoreValue(input.data.resourceType),
          fileName: firestoreValue(file.name),
          fileType: firestoreValue('application/pdf'),
          fileSize: firestoreValue(file.size),
          storageKey: firestoreValue(storageKey),
          uploadedBy: firestoreValue(authentication.claims.sub),
          status: firestoreValue('pending'),
          reviewedBy: firestoreValue(null),
          reviewNote: firestoreValue(null),
          createdAt: { timestampValue: now },
          reviewedAt: firestoreValue(null),
        };
        const createResult = await firestoreRequest(
          env,
          `submissions?documentId=${encodeURIComponent(submissionId)}`,
          { method: 'POST', body: JSON.stringify({ fields }) },
        );
        if (!createResult.ok) {
          await removePrivateObject(env, storageKey);
          throw new ProfileStoreError('The submission could not be recorded.', 503, 'FIRESTORE_UNAVAILABLE');
        }
        const submission = await createResult.json() as { fields: Record<string, unknown> };
        return response({
          success: true,
          data: {
            id: submissionId,
            ...input.data,
            fileName: file.name,
            fileType: 'application/pdf',
            fileSize: file.size,
            storageKey,
            uploadedBy: authentication.claims.sub,
            status: 'pending',
            reviewedBy: null,
            reviewNote: null,
            createdAt: now,
            reviewedAt: null,
          },
        }, 201, origin, env);
      }

      if (isSessionRequest) {
        const profile = await readProfile(env, authentication.claims.sub);
        if (!profile.isActive) {
          return errorResponse('ACCOUNT_INACTIVE', 'This account is not active.', 403, origin, env);
        }
        if (
          authentication.claims.email &&
          authentication.claims.email.toLowerCase() !== profile.email.toLowerCase()
        ) {
          return errorResponse(
            'PROFILE_EMAIL_MISMATCH',
            'The account email changed. Contact support to refresh your profile.',
            409,
            origin,
            env,
          );
        }
        return response(
          { success: true, data: { profile, emailVerified: authentication.claims.email_verified } },
          200,
          origin,
          env,
        );
      }

      if (isProfileUpdateRequest) {
        const body = await request.json().catch(() => null);
        const parsedBody = updateAcademicProfileBodySchema.safeParse(body);
        if (!parsedBody.success) {
          return errorResponse(
            'VALIDATION_ERROR',
            'Choose a supported academic level and an available department or leave it unselected.',
            422,
            origin,
            env,
          );
        }

        const profile = await readProfile(env, authentication.claims.sub);
        if (!profile.isActive) {
          return errorResponse('ACCOUNT_INACTIVE', 'This account is not active.', 403, origin, env);
        }
        if (
          authentication.claims.email &&
          authentication.claims.email.toLowerCase() !== profile.email.toLowerCase()
        ) {
          return errorResponse(
            'PROFILE_EMAIL_MISMATCH',
            'The account email changed. Contact support to refresh your profile.',
            409,
            origin,
            env,
          );
        }

        const updatedProfile = await updateAcademicProfile(
          env,
          authentication.claims.sub,
          parsedBody.data,
        );
        return response(
          { success: true, data: { profile: updatedProfile, emailVerified: authentication.claims.email_verified } },
          200,
          origin,
          env,
        );
      }

      const body = await request.json().catch(() => null);
      const parsedBody = createProfileBodySchema.safeParse(body);
      if (!parsedBody.success) {
        return errorResponse('VALIDATION_ERROR', 'A valid full name is required.', 422, origin, env);
      }

      try {
        const profile = await readProfile(env, authentication.claims.sub);
        if (!profile.isActive) {
          return errorResponse('ACCOUNT_INACTIVE', 'This account is not active.', 403, origin, env);
        }
        return response(
          { success: true, data: { profile, emailVerified: authentication.claims.email_verified } },
          200,
          origin,
          env,
        );
      } catch (error) {
        if (!(error instanceof ProfileStoreError) || error.code !== 'PROFILE_NOT_FOUND') {
          throw error;
        }
      }

      const profile = await createProfile(env, authentication.claims, parsedBody.data.fullName);
      return response(
        { success: true, data: { profile, emailVerified: authentication.claims.email_verified } },
        201,
        origin,
        env,
      );
    } catch (error) {
      return profileStoreErrorResponse(error, origin, env);
    }
    },
  };
}

const worker = createWorker();

export default worker;
