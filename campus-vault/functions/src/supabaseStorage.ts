export interface SupabaseStorageEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_STORAGE_BUCKET?: string;
}

export class SupabaseStorageError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'SupabaseStorageError';
    this.status = status;
    this.code = code;
  }
}

function storageConfig(env: SupabaseStorageEnv): { baseUrl: string; key: string; bucket: string } {
  const projectUrl = env.SUPABASE_URL?.trim().replace(/\/+$/, '');
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = env.SUPABASE_STORAGE_BUCKET?.trim();
  if (!projectUrl || !serviceRoleKey || !bucket) {
    throw new SupabaseStorageError(
      'Supabase private storage is not configured on the backend.',
      503,
      'STORAGE_NOT_CONFIGURED',
    );
  }
  let baseUrl: URL;
  try {
    baseUrl = new URL(projectUrl);
  } catch {
    throw new SupabaseStorageError('Supabase storage configuration is invalid.', 503, 'STORAGE_NOT_CONFIGURED');
  }
  if (baseUrl.protocol !== 'https:') {
    throw new SupabaseStorageError('Supabase storage must use HTTPS.', 503, 'STORAGE_NOT_CONFIGURED');
  }
  return { baseUrl: baseUrl.toString().replace(/\/+$/, ''), key: serviceRoleKey, bucket };
}

function objectPath(path: string): string {
  const normalized = path.trim().replace(/^\/+/, '');
  if (!normalized || normalized.includes('..') || normalized.includes('\\')) {
    throw new SupabaseStorageError('The storage path is invalid.', 400, 'STORAGE_PATH_INVALID');
  }
  return normalized;
}

async function storageRequest(
  env: SupabaseStorageEnv,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const config = storageConfig(env);
  return fetch(`${config.baseUrl}/storage/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.key}`,
      apikey: config.key,
      ...init.headers,
    },
  });
}

export async function uploadPrivateObject(
  env: SupabaseStorageEnv,
  path: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const config = storageConfig(env);
  const result = await storageRequest(
    env,
    `/object/${encodeURIComponent(config.bucket)}/${objectPath(path).split('/').map(encodeURIComponent).join('/')}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'x-upsert': 'false',
      },
      body,
    },
  );
  if (!result.ok) {
    console.error('Supabase object upload failed.', result.status);
    throw new SupabaseStorageError('The file could not be stored.', 503, 'STORAGE_UPLOAD_FAILED');
  }
}

export async function createPrivateSignedUrl(
  env: SupabaseStorageEnv,
  path: string,
  expiresInSeconds = 300,
): Promise<string> {
  const config = storageConfig(env);
  const result = await storageRequest(
    env,
    `/object/sign/${encodeURIComponent(config.bucket)}/${objectPath(path).split('/').map(encodeURIComponent).join('/')}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    },
  );
  if (!result.ok) {
    const detail = await result.text().catch(() => '');
    console.error('Supabase signed URL request failed.', result.status, detail.slice(0, 300));
    throw new SupabaseStorageError('A temporary file access link could not be created.', 503, 'STORAGE_SIGN_FAILED');
  }
  const payload = await result.json() as { signedURL?: unknown };
  if (typeof payload.signedURL !== 'string' || !payload.signedURL) {
    throw new SupabaseStorageError('Supabase returned an invalid file access link.', 503, 'STORAGE_SIGN_FAILED');
  }
  if (/^https?:\/\//i.test(payload.signedURL)) {
    return new URL(payload.signedURL).toString();
  }
  const signedPath = payload.signedURL.startsWith('/storage/v1/')
    ? payload.signedURL
    : `/storage/v1${payload.signedURL.startsWith('/') ? '' : '/'}${payload.signedURL}`;
  return new URL(signedPath, config.baseUrl).toString();
}

export async function removePrivateObject(env: SupabaseStorageEnv, path: string): Promise<void> {
  const config = storageConfig(env);
  const result = await storageRequest(
    env,
    '/object/' + encodeURIComponent(config.bucket),
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: [objectPath(path)] }),
    },
  );
  if (!result.ok && result.status !== 404) {
    console.error('Supabase object deletion failed.', result.status);
    throw new SupabaseStorageError('The stored file could not be removed.', 503, 'STORAGE_DELETE_FAILED');
  }
}

export interface PrivateStorageObject {
  name: string;
  size: number;
  createdAt: string | null;
}

export async function listPrivateObjects(
  env: SupabaseStorageEnv,
  limit = 100,
): Promise<PrivateStorageObject[]> {
    const config = storageConfig(env);
    const result = await storageRequest(
      env,
      `/object/list/${encodeURIComponent(config.bucket)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: '', limit, offset: 0 }),
      },
    );
    if (!result.ok) {
      const detail = await result.text().catch(() => '');
      console.error('Supabase object listing failed.', result.status, detail.slice(0, 300));
      throw new SupabaseStorageError('The uploaded files could not be listed.', 503, 'STORAGE_LIST_FAILED');
    }
    const payload = await result.json();
    if (!Array.isArray(payload)) {
      throw new SupabaseStorageError('Supabase returned an invalid file listing.', 503, 'STORAGE_LIST_FAILED');
    }
    return payload
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => {
        const metadata = typeof item.metadata === 'object' && item.metadata !== null
          ? item.metadata as Record<string, unknown>
          : {};
        return {
          name: typeof item.name === 'string' ? item.name : '',
          size: typeof metadata.size === 'number'
            ? metadata.size
            : typeof metadata.size === 'string'
              ? Number(metadata.size) || 0
              : 0,
          createdAt: typeof item.created_at === 'string' ? item.created_at : null,
        };
      })
      .filter((item) => item.name && item.name.toLowerCase().endsWith('.pdf'));
}
