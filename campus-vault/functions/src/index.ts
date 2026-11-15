import { createRemoteJWKSet, jwtVerify } from 'jose';
import { z } from 'zod';

interface Env {
  APP_ORIGIN?: string;
  FIREBASE_PROJECT_ID?: string;
}

const firebaseClaimsSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email().optional(),
  email_verified: z.boolean().optional().default(false),
});

type FirebaseClaims = z.infer<typeof firebaseClaimsSchema>;

const firebaseJwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

function response(
  data: unknown,
  status: number,
  origin: string | null,
  env: Env,
): Response {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  if (origin && origin === env.APP_ORIGIN) {
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
  return origin === null || origin === env.APP_ORIGIN;
}

async function authenticate(
  request: Request,
  env: Env,
): Promise<{ claims: FirebaseClaims } | { response: Response }> {
  const origin = request.headers.get('Origin');
  const authorization = request.headers.get('Authorization');
  const tokenMatch = authorization?.match(/^Bearer\s+([^\s]+)$/i);
  if (!tokenMatch) {
    return {
      response: errorResponse('AUTH_REQUIRED', 'A Firebase ID token is required.', 401, origin, env),
    };
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
    const { payload } = await jwtVerify(tokenMatch[1], firebaseJwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256'],
    });
    const claims = firebaseClaimsSchema.safeParse(payload);
    if (!claims.success) {
      return {
        response: errorResponse('TOKEN_INVALID', 'The Firebase ID token is invalid.', 401, origin, env),
      };
    }
    if (!claims.data.email_verified) {
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
    return { claims: claims.data };
  } catch {
    return {
      response: errorResponse('TOKEN_INVALID', 'The Firebase ID token is invalid or expired.', 401, origin, env),
    };
  }
}

const worker: ExportedHandler<Env> = {
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

    if (url.pathname !== '/api/v1/auth/session' || request.method !== 'GET') {
      return errorResponse('NOT_FOUND', 'The requested API route was not found.', 404, origin, env);
    }

    const authentication = await authenticate(request, env);
    if ('response' in authentication) return authentication.response;

    return response(
      {
        success: true,
        data: {
          uid: authentication.claims.sub,
          email: authentication.claims.email ?? null,
          emailVerified: authentication.claims.email_verified,
        },
      },
      200,
      origin,
      env,
    );
  },
};

export default worker;
