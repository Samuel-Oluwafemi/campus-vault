import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { createLocalJWKSet, exportJWK, exportPKCS8, generateKeyPair, SignJWT } from 'jose';
import {
  authenticateRequest,
  createWorker,
  firestoreValue,
  updateAcademicProfileBodySchema,
  default as worker,
} from '../src/index.ts';

const projectId = 'campus-vault-test';
const serviceOrigin = `https://securetoken.google.com/${projectId}`;
const env = { FIREBASE_PROJECT_ID: projectId, APP_ORIGIN: 'http://localhost:5173' };
let keySet;
let privateKey;
let keyId;

before(async () => {
  const keys = await generateKeyPair('RS256');
  privateKey = keys.privateKey;
  keyId = 'campus-vault-test-key';
  const publicJwk = {
    ...(await exportJWK(keys.publicKey)),
    kid: keyId,
    alg: 'RS256',
    use: 'sig',
  };
  keySet = createLocalJWKSet({ keys: [publicJwk] });
});

async function createToken(claims = {}) {
  return new SignJWT({
    email: 'student@example.test',
    email_verified: true,
    ...claims,
  })
    .setProtectedHeader({ alg: 'RS256', kid: keyId })
    .setIssuer(serviceOrigin)
    .setAudience(projectId)
    .setSubject('test-student')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
}

async function authenticate(token, requestEnv = env) {
  return authenticateRequest(
    new Request('https://api.example.test/api/v1/auth/session', {
      headers: { Authorization: `Bearer ${token}` },
    }),
    requestEnv,
    keySet,
  );
}

test('accepts a correctly signed, verified Firebase token for the configured project', async () => {
  const result = await authenticate(await createToken());
  assert.ok('claims' in result);
  assert.equal(result.claims.sub, 'test-student');
  assert.equal(result.claims.email_verified, true);
});

test('rejects a correctly signed but unverified account', async () => {
  const result = await authenticate(await createToken({ email_verified: false }));
  assert.ok('response' in result);
  assert.equal(result.response.status, 403);
  assert.equal((await result.response.json()).error.code, 'EMAIL_NOT_VERIFIED');
});

test('rejects a token with the wrong project audience', async () => {
  const token = await new SignJWT({ email: 'student@example.test', email_verified: true })
    .setProtectedHeader({ alg: 'RS256', kid: keyId })
    .setIssuer(serviceOrigin)
    .setAudience('another-project')
    .setSubject('test-student')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
  const result = await authenticate(token);
  assert.ok('response' in result);
  assert.equal(result.response.status, 401);
});

test('rejects a malformed token', async () => {
  const result = await authenticate('not.a.jwt');
  assert.ok('response' in result);
  assert.equal(result.response.status, 401);
});

test('rejects requests without a bearer token before checking configuration', async () => {
  const result = await authenticateRequest(
    new Request('https://api.example.test/api/v1/auth/session'),
    {},
    keySet,
  );
  assert.ok('response' in result);
  assert.equal(result.response.status, 401);
  assert.equal((await result.response.json()).error.code, 'AUTH_REQUIRED');
});

test('reports missing Firebase project configuration without accepting a token', async () => {
  const result = await authenticate(await createToken(), {});
  assert.ok('response' in result);
  assert.equal(result.response.status, 503);
  assert.equal((await result.response.json()).error.code, 'API_NOT_CONFIGURED');
});

test('accepts a supported level with an optional approved department', () => {
  assert.deepEqual(
    updateAcademicProfileBodySchema.parse({ departmentId: 'geology', level: 300 }),
    { departmentId: 'geology', level: 300 },
  );
  assert.deepEqual(
    updateAcademicProfileBodySchema.parse({ departmentId: null, level: 500 }),
    { departmentId: null, level: 500 },
  );
});

test('rejects unsupported departments, levels, and protected profile fields', () => {
  assert.equal(updateAcademicProfileBodySchema.safeParse({ departmentId: 'chemistry', level: 300 }).success, false);
  assert.equal(updateAcademicProfileBodySchema.safeParse({ departmentId: null, level: 600 }).success, false);
  assert.equal(updateAcademicProfileBodySchema.safeParse({
    departmentId: 'geology',
    level: 300,
    role: 'admin',
  }).success, false);
});

test('serializes Firestore integer values as decimal strings', () => {
  assert.deepEqual(firestoreValue(400), { integerValue: '400' });
});

test('serves the provisional geology course index publicly with CORS headers', async () => {
  const response = await worker.fetch(
    new Request('https://api.example.test/api/v1/courses?departmentId=geology', {
      headers: { Origin: env.APP_ORIGIN },
    }),
    env,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), env.APP_ORIGIN);

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.departmentId, 'geology');
  assert.equal(payload.data.status, 'provisional');
  assert.equal(payload.data.courses.length, 7);
  assert.deepEqual(payload.data.unassignedPastQuestionReferences, [
    '300lv PQ_2025.pdf',
    'Geology 300lvl Past Questions.pdf',
  ]);
  for (const course of payload.data.courses) {
    assert.equal(course.status, 'provisional');
    assert.equal(course.title, null);
    assert.equal(course.semester, null);
    assert.equal(course.levelInferred, true);
    assert.equal(course.resourcesAvailable, false);
    assert.ok(Array.isArray(course.sourceFiles));
  }
});

test('rejects unsupported departments and methods for the course index', async () => {
  const unknownDepartment = await worker.fetch(
    new Request('https://api.example.test/api/v1/courses?departmentId=chemistry', {
      headers: { Origin: env.APP_ORIGIN },
    }),
    env,
  );
  assert.equal(unknownDepartment.status, 404);
  assert.equal((await unknownDepartment.json()).error.code, 'DEPARTMENT_NOT_FOUND');

  const unsupportedMethod = await worker.fetch(
    new Request('https://api.example.test/api/v1/courses', {
      method: 'POST',
      headers: { Origin: env.APP_ORIGIN },
    }),
    env,
  );
  assert.equal(unsupportedMethod.status, 405);
  assert.equal((await unsupportedMethod.json()).error.code, 'METHOD_NOT_ALLOWED');
});

test('requires authentication for academic profile updates and rejects unsupported methods', async () => {
  const patchResponse = await worker.fetch(
    new Request('https://api.example.test/api/v1/auth/profile', {
      method: 'PATCH',
      headers: { Origin: env.APP_ORIGIN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ departmentId: null, level: 300 }),
    }),
    env,
  );
  assert.equal(patchResponse.status, 401);
  assert.equal((await patchResponse.json()).error.code, 'AUTH_REQUIRED');

  const getResponse = await worker.fetch(
    new Request('https://api.example.test/api/v1/auth/profile', {
      method: 'GET',
      headers: { Origin: env.APP_ORIGIN },
    }),
    env,
  );
  assert.equal(getResponse.status, 405);
});

test('creates, reads, and updates a profile through authenticated Firestore routes', async () => {
  const serviceAccount = await generateKeyPair('RS256');
  const privateKeyPem = await exportPKCS8(serviceAccount.privateKey);
  const integrationEnv = {
    ...env,
    FIREBASE_SERVICE_ACCOUNT_EMAIL: 'campus-vault-worker@campus-vault-test.iam.gserviceaccount.com',
    FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY: privateKeyPem,
  };
  const app = createWorker(keySet);
  const documents = new Map();
  const firestoreRequests = [];
  const originalFetch = globalThis.fetch;

  function makeFirestoreDocument(uid, fields) {
    return {
      name: `projects/${projectId}/databases/(default)/documents/users/${uid}`,
      fields,
    };
  }

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.hostname === 'oauth2.googleapis.com') {
      return Response.json({
        access_token: 'test-google-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
      });
    }

    assert.equal(url.hostname, 'firestore.googleapis.com');
    assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer test-google-access-token');
    firestoreRequests.push({ url, method: init.method ?? 'GET', body: init.body });

    const profilePath = url.pathname.match(/\/documents\/users(?:\/([^/]+))?$/);
    assert.ok(profilePath, `Unexpected Firestore path: ${url.pathname}`);
    const uid = profilePath[1] ? decodeURIComponent(profilePath[1]) : null;

    if ((init.method ?? 'GET') === 'GET') {
      const document = documents.get(uid);
      return document
        ? Response.json(makeFirestoreDocument(uid, document))
        : Response.json({ error: { status: 'NOT_FOUND' } }, { status: 404 });
    }

    if (init.method === 'POST') {
      const documentId = url.searchParams.get('documentId');
      assert.equal(documentId, 'test-student');
      const body = JSON.parse(String(init.body));
      documents.set(documentId, body.fields);
      return Response.json(makeFirestoreDocument(documentId, body.fields), { status: 200 });
    }

    if (init.method === 'PATCH') {
      assert.equal(url.searchParams.get('currentDocument.exists'), 'true');
      assert.deepEqual(url.searchParams.getAll('updateMask.fieldPaths'), [
        'departmentId',
        'level',
        'updatedAt',
      ]);
      assert.ok(documents.has(uid), 'profile update must not create a missing document');
      const body = JSON.parse(String(init.body));
      assert.deepEqual(Object.keys(body.fields).sort(), ['departmentId', 'level', 'updatedAt']);
      documents.set(uid, { ...documents.get(uid), ...body.fields });
      return Response.json(makeFirestoreDocument(uid, documents.get(uid)));
    }

    throw new Error(`Unexpected Firestore method: ${init.method}`);
  };

  try {
    const token = await createToken();
    const request = (path, method, body) => new Request(`https://api.example.test${path}`, {
      method,
      headers: {
        Origin: env.APP_ORIGIN,
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const rejectedCreate = await app.fetch(
      request('/api/v1/auth/profile', 'POST', { fullName: 'Test Student', role: 'admin' }),
      integrationEnv,
    );
    assert.equal(rejectedCreate.status, 422);
    assert.equal(firestoreRequests.length, 0);

    const createResponse = await app.fetch(
      request('/api/v1/auth/profile', 'POST', { fullName: 'Test Student' }),
      integrationEnv,
    );
    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();
    assert.equal(created.data.profile.role, 'student');
    assert.equal(created.data.profile.level, null);
    assert.equal(created.data.profile.departmentId, null);
    assert.equal(documents.get('test-student').role.stringValue, 'student');

    const duplicateCreateResponse = await app.fetch(
      request('/api/v1/auth/profile', 'POST', { fullName: 'Different Client Name' }),
      integrationEnv,
    );
    assert.equal(duplicateCreateResponse.status, 200);
    const duplicateProfile = await duplicateCreateResponse.json();
    assert.equal(duplicateProfile.data.profile.fullName, 'Test Student');
    assert.equal(firestoreRequests.filter(({ method }) => method === 'POST').length, 1);

    const sessionResponse = await app.fetch(
      request('/api/v1/auth/session', 'GET'),
      integrationEnv,
    );
    assert.equal(sessionResponse.status, 200);
    assert.equal((await sessionResponse.json()).data.profile.uid, 'test-student');

    const tamperedUpdateResponse = await app.fetch(
      request('/api/v1/auth/profile', 'PATCH', {
        departmentId: 'geology',
        level: 400,
        role: 'admin',
      }),
      integrationEnv,
    );
    assert.equal(tamperedUpdateResponse.status, 422);

    const otherEmailToken = await createToken({ email: 'different@example.test' });
    const mismatchedEmailResponse = await app.fetch(
      new Request('https://api.example.test/api/v1/auth/profile', {
        method: 'PATCH',
        headers: {
          Origin: env.APP_ORIGIN,
          Authorization: `Bearer ${otherEmailToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ departmentId: 'geology', level: 400 }),
      }),
      integrationEnv,
    );
    assert.equal(mismatchedEmailResponse.status, 409);
    assert.equal((await mismatchedEmailResponse.json()).error.code, 'PROFILE_EMAIL_MISMATCH');

    const updateResponse = await app.fetch(
      request('/api/v1/auth/profile', 'PATCH', { departmentId: 'geology', level: 400 }),
      integrationEnv,
    );
    assert.equal(updateResponse.status, 200);
    const updated = await updateResponse.json();
    assert.equal(updated.data.profile.departmentId, 'geology');
    assert.equal(updated.data.profile.level, 400);
    assert.equal(updated.data.profile.role, 'student');
    assert.equal(documents.get('test-student').role.stringValue, 'student');
    assert.equal(firestoreRequests.filter(({ method }) => method === 'POST').length, 1);
    assert.equal(firestoreRequests.filter(({ method }) => method === 'PATCH').length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
