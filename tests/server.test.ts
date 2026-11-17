import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApiApp } from '../src/server/app.ts';
import type { Role } from '../src/types/index.ts';

interface MockTokenRecord {
  uid: string;
  email?: string;
  email_verified?: boolean;
}

const TOKEN_FIXTURES: Record<string, MockTokenRecord> = {
  'customer-token': { uid: 'cust-1', email: 'customer@example.com', email_verified: true },
  'unverified-super-spoof': { uid: 'spoof-1', email: 'masesawilson3@gmail.com', email_verified: false },
  'store-manager-token': { uid: 'mgr-1', email: 'manager@example.com', email_verified: true },
  'bootstrap-super-token': { uid: 'super-1', email: 'masesawilson3@gmail.com', email_verified: true },
  'lookup-fail-customer-token': { uid: 'fail-1', email: 'someone@example.com', email_verified: true },
};

const ROLE_FIXTURES: Record<string, { roles: Role[]; isAdminDoc: boolean }> = {
  'cust-1': { roles: ['CUSTOMER'], isAdminDoc: false },
  'spoof-1': { roles: ['CUSTOMER'], isAdminDoc: false },
  'mgr-1': { roles: ['STORE_MANAGER'], isAdminDoc: false },
  'super-1': { roles: ['CUSTOMER'], isAdminDoc: false },
};

async function withTestServer(run: (baseUrl: string) => Promise<void>) {
  const app = createApiApp({
    authDeps: {
      verifyIdToken: async (token: string) => {
        const record = TOKEN_FIXTURES[token];
        if (!record) throw new Error('Invalid token');
        return record;
      },
      loadUserRoles: async (uid: string) => {
        if (uid === 'fail-1') {
          throw new Error('Simulated Firestore Admin lookup error');
        }
        return ROLE_FIXTURES[uid] ?? { roles: [], isAdminDoc: false };
      },
    },
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

test('GET /api/health returns 200 JSON with project metadata and zero secrets', async () => {
  await withTestServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /application\/json/);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.ok, true);
    assert.equal(body.service, 'dpc-api');
    assert.equal(body.firebaseProjectId, 'coherent-stacker-mdtd0');
    assert.ok(typeof body.firestoreDatabaseId === 'string' && body.firestoreDatabaseId.length > 0);
    assert.equal('privateKey' in body, false);
  });
});

test('Unknown /api/* routes return JSON 404 instead of falling back to HTML', async () => {
  await withTestServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/does-not-exist`);
    assert.equal(res.status, 404);
    assert.match(res.headers.get('content-type') || '', /application\/json/);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.error, 'Not Found');
  });
});

test('Protected routes reject missing or invalid Bearer tokens with 401', async () => {
  await withTestServer(async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(missing.status, 401);

    const malformed = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Basic abc' },
    });
    assert.equal(malformed.status, 401);

    const invalid = await fetch(`${baseUrl}/api/admin/session`, {
      headers: { Authorization: 'Bearer bad-token' },
    });
    assert.equal(invalid.status, 401);
  });
});

test('Verified CUSTOMER can inspect /api/auth/me (200) but is denied /api/admin/session (403)', async () => {
  await withTestServer(async (baseUrl) => {
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer customer-token' },
    });
    assert.equal(meRes.status, 200);
    const me = (await meRes.json()) as { roles: Role[]; isStaff: boolean; isSuperAdmin: boolean };
    assert.deepEqual(me.roles, ['CUSTOMER']);
    assert.equal(me.isStaff, false);
    assert.equal(me.isSuperAdmin, false);

    const adminRes = await fetch(`${baseUrl}/api/admin/session`, {
      headers: { Authorization: 'Bearer customer-token' },
    });
    assert.equal(adminRes.status, 403);
  });
});

test('Unverified email matching bootstrap email is rejected from admin routes (403)', async () => {
  await withTestServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/admin/session`, {
      headers: { Authorization: 'Bearer unverified-super-spoof' },
    });
    assert.equal(res.status, 403);
  });
});

test('Verified STORE_MANAGER passes /api/admin/session (200) but is blocked from /api/admin/super-check (403)', async () => {
  await withTestServer(async (baseUrl) => {
    const staffRes = await fetch(`${baseUrl}/api/admin/session`, {
      headers: { Authorization: 'Bearer store-manager-token' },
    });
    assert.equal(staffRes.status, 200);
    const staffBody = (await staffRes.json()) as { roles: Role[]; isSuperAdmin: boolean };
    assert.deepEqual(staffBody.roles, ['STORE_MANAGER']);
    assert.equal(staffBody.isSuperAdmin, false);

    const superRes = await fetch(`${baseUrl}/api/admin/super-check`, {
      headers: { Authorization: 'Bearer store-manager-token' },
    });
    assert.equal(superRes.status, 403);
  });
});

test('Verified bootstrap administrator passes both /api/admin/session and /api/admin/super-check (200)', async () => {
  await withTestServer(async (baseUrl) => {
    const superRes = await fetch(`${baseUrl}/api/admin/super-check`, {
      headers: { Authorization: 'Bearer bootstrap-super-token' },
    });
    assert.equal(superRes.status, 200);
    const body = (await superRes.json()) as { roles: Role[]; email: string };
    assert.equal(body.email, 'masesawilson3@gmail.com');
    assert.equal(body.roles.includes('SUPER_ADMIN'), true);
  });
});

test('Server role lookup failure fails closed with 503 on privileged routes for non-bootstrap users', async () => {
  await withTestServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/admin/session`, {
      headers: { Authorization: 'Bearer lookup-fail-customer-token' },
    });
    assert.equal(res.status, 503);
  });
});
