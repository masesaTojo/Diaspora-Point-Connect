/**
 * Runtime Firestore Emulator Security Test Suite (Phase 1, Step 3).
 *
 * Prerequisites (requires JDK 11+ & Firebase Emulator):
 *   npm install -D @firebase/rules-unit-testing
 *   firebase emulators:exec --only firestore "npx tsx --test tests/firestore.rules.emulator.mjs"
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const hasJava = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

test('Firestore Emulator runtime suite (12 scenarios)', async (t) => {
  if (!hasJava) {
    t.skip('FIRESTORE_EMULATOR_HOST not set (Java/Firestore Emulator unavailable in container)');
    return;
  }

  const { initializeTestEnvironment, assertFails, assertSucceeds } = await import(
    '@firebase/rules-unit-testing'
  );
  const { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc } = await import(
    'firebase/firestore'
  );

  const testEnv = await initializeTestEnvironment({
    projectId: 'dpc-rules-test',
    firestore: {
      rules: fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });

  try {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users/cust1'), {
        id: 'cust1',
        email: 'cust1@example.com',
        roles: ['CUSTOMER'],
      });
      await setDoc(doc(db, 'users/cust2'), {
        id: 'cust2',
        email: 'cust2@example.com',
        roles: ['CUSTOMER'],
      });
      await setDoc(doc(db, 'users/staff1'), {
        id: 'staff1',
        email: 'staff1@example.com',
        roles: ['ORDER_MANAGER'],
      });
      await setDoc(doc(db, 'orders/ord-cust2'), {
        id: 'ord-cust2',
        customerId: 'cust2',
        status: 'PAYMENT_PENDING',
        paymentStatus: 'PENDING',
        items: [{ id: '1', productId: 'p1', productName: 'Gift', quantity: 1, unitPrice: 50, totalPrice: 50 }],
        subtotal: 50,
        deliveryFee: 10,
        serviceFee: 5,
        discount: 0,
        total: 65,
      });
      await setDoc(doc(db, 'products/p1'), {
        id: 'p1',
        name: 'Gift Box',
        slug: 'gift-box',
        price: 50,
        status: 'ACTIVE',
      });
      await setDoc(doc(db, 'auditLogs/log1'), {
        id: 'log1',
        userId: 'staff1',
        action: 'UPDATE',
        entity: 'Product',
        timestamp: '2026-01-01T00:00:00.000Z',
      });
    });

    const unauthDb = testEnv.unauthenticatedContext().firestore();
    const cust1Db = testEnv.authenticatedContext('cust1', { email: 'cust1@example.com', email_verified: true }).firestore();
    const unverifiedSuperDb = testEnv.authenticatedContext('spoof', { email: 'masesawilson3@gmail.com', email_verified: false }).firestore();
    const verifiedSuperDb = testEnv.authenticatedContext('super1', { email: 'masesawilson3@gmail.com', email_verified: true }).firestore();

    // 1-4: Unauthenticated denials
    await assertFails(getDocs(collection(unauthDb, 'users')));
    await assertFails(getDocs(collection(unauthDb, 'orders')));
    await assertFails(getDocs(collection(unauthDb, 'auditLogs')));
    await assertFails(setDoc(doc(unauthDb, 'products/p2'), { id: 'p2', name: 'X', slug: 'x', price: 10, status: 'ACTIVE' }));

    // 5-6: Privilege escalation & unverified email spoofing
    await assertFails(setDoc(doc(cust1Db, 'users/newcust'), { id: 'newcust', email: 'cust1@example.com', roles: ['SUPER_ADMIN'] }));
    await assertFails(updateDoc(doc(cust1Db, 'users/cust1'), { roles: ['SUPER_ADMIN'] }));
    await assertFails(getDocs(collection(unverifiedSuperDb, 'auditLogs')));

    // 7-8: Cross-customer isolation
    await assertFails(getDoc(doc(cust1Db, 'users/cust2')));
    await assertFails(updateDoc(doc(cust1Db, 'users/cust2'), { firstName: 'Hacked' }));
    await assertFails(getDoc(doc(cust1Db, 'orders/ord-cust2')));

    // 9: Forged PAID/CONFIRMED or zero-total order blocked
    await assertFails(setDoc(doc(cust1Db, 'orders/forged1'), {
      id: 'forged1', customerId: 'cust1', status: 'CONFIRMED', paymentStatus: 'PAID',
      items: [{ id: '1' }], subtotal: 50, deliveryFee: 10, serviceFee: 5, discount: 0, total: 65,
    }));
    await assertFails(setDoc(doc(cust1Db, 'orders/forged0'), {
      id: 'forged0', customerId: 'cust1', status: 'PAYMENT_PENDING', paymentStatus: 'PENDING',
      items: [{ id: '1' }], subtotal: 50, deliveryFee: 10, serviceFee: 5, discount: 0, total: 0,
    }));

    // 10-11: Allowed public storefront reads & valid customer order create
    await assertSucceeds(getDoc(doc(unauthDb, 'products/p1')));
    await assertSucceeds(setDoc(doc(cust1Db, 'orders/valid1'), {
      id: 'valid1', customerId: 'cust1', status: 'PAYMENT_PENDING', paymentStatus: 'PENDING',
      items: [{ id: '1' }], subtotal: 50, deliveryFee: 10, serviceFee: 5, discount: 0, total: 65,
    }));

    // 12: Verified SUPER_ADMIN permissions & immutable audit logs
    await assertSucceeds(updateDoc(doc(verifiedSuperDb, 'users/cust1'), { roles: ['STORE_MANAGER'] }));
    await assertSucceeds(getDoc(doc(verifiedSuperDb, 'auditLogs/log1')));
    await assertFails(updateDoc(doc(verifiedSuperDb, 'auditLogs/log1'), { action: 'TAMPER' }));
    await assertFails(deleteDoc(doc(verifiedSuperDb, 'auditLogs/log1')));
    assert.ok(true);
  } finally {
    await testEnv.cleanup();
  }
});
