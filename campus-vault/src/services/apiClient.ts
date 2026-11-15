import { z } from 'zod';
import { getFirebaseAuth } from '@/firebase/client';

const successEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  message: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

const errorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

function getApiUrl(path: string): URL {
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!configuredBase) {
    throw new ApiRequestError(
      'The backend API is not configured. Set VITE_API_BASE_URL and restart the app.',
      'API_NOT_CONFIGURED',
      503,
    );
  }

  if (!path || path.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(path)) {
    throw new ApiRequestError('API paths must be relative to the configured API base URL.', 'INVALID_API_PATH', 400);
  }

  let base: URL;
  try {
    base = new URL(configuredBase);
  } catch {
    throw new ApiRequestError('VITE_API_BASE_URL must be a valid absolute URL.', 'INVALID_API_CONFIGURATION', 500);
  }

  const isLoopback = base.hostname === 'localhost' || base.hostname === '127.0.0.1';
  if (
    (base.protocol !== 'https:' && !(isLoopback && base.protocol === 'http:')) ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  ) {
    throw new ApiRequestError(
      'The API base URL must use HTTPS and cannot include credentials, a query, or a fragment.',
      'INVALID_API_CONFIGURATION',
      500,
    );
  }

  const basePath = base.pathname.endsWith('/') ? base.pathname : `${base.pathname}/`;
  const url = new URL(path.replace(/^\/+/, ''), `${base.origin}${basePath}`);
  if (url.origin !== base.origin || !url.pathname.startsWith(basePath)) {
    throw new ApiRequestError('The API path is outside the configured API base URL.', 'INVALID_API_PATH', 400);
  }
  return url;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ApiRequestError(
      'The backend returned an invalid response.',
      'INVALID_API_RESPONSE',
      response.status,
    );
  }
}

export async function apiRequest<T>(
  path: string,
  responseSchema: z.ZodType<T>,
  options: ApiRequestOptions = {},
): Promise<T> {
  const url = getApiUrl(path);
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new ApiRequestError('Sign in to continue.', 'AUTH_REQUIRED', 401);
  }
  if (!user.emailVerified) {
    throw new ApiRequestError('Verify your email before using protected student features.', 'EMAIL_NOT_VERIFIED', 403);
  }

  const token = await user.getIdToken();
  const headers = new Headers({ Accept: 'application/json', Authorization: `Bearer ${token}` });
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiRequestError(
        'The backend could not be reached. Check your connection and API configuration.',
        'NETWORK_ERROR',
        0,
      );
    }
    throw error;
  }

  const payload = await readJson(response);
  if (!response.ok) {
    const parsedError = errorEnvelopeSchema.safeParse(payload);
    if (parsedError.success) {
      throw new ApiRequestError(
        parsedError.data.error.message,
        parsedError.data.error.code,
        response.status,
        parsedError.data.error.details,
      );
    }
    throw new ApiRequestError(
      'The backend request failed.',
      `HTTP_${response.status}`,
      response.status,
    );
  }

  const envelope = successEnvelopeSchema.safeParse(payload);
  if (!envelope.success) {
    throw new ApiRequestError(
      'The backend returned an unexpected response.',
      'INVALID_API_RESPONSE',
      response.status,
    );
  }

  const data = responseSchema.safeParse(envelope.data.data);
  if (!data.success) {
    throw new ApiRequestError(
      'The backend response did not match the expected data format.',
      'INVALID_API_DATA',
      response.status,
    );
  }
  return data.data;
}
