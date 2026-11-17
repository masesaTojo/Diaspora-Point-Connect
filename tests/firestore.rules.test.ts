import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');

function extractMatchBlock(source: string, matchHeader: string): string {
  const idx = source.indexOf(matchHeader);
  assert.notEqual(idx, -1, `Expected match block "${matchHeader}" to exist in firestore.rules`);
  const lineEnd = source.indexOf('\n', idx);
  const braceStart = source.lastIndexOf('{', lineEnd === -1 ? source.length : lineEnd);
  assert.notEqual(braceStart, -1, `Expected opening brace for "${matchHeader}"`);
  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') depth--;
    if (depth === 0) {
      return source.slice(idx, i + 1);
    }
  }
  throw new Error(`Unclosed brace in match block "${matchHeader}"`);
}

function extractFunctionBlock(source: string, fnSignatureStart: string): string {
  const idx = source.indexOf(fnSignatureStart);
  assert.notEqual(idx, -1, `Expected helper function "${fnSignatureStart}" in firestore.rules`);
  const braceStart = source.indexOf('{', idx);
  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') depth--;
    if (depth === 0) {
      return source.slice(idx, i + 1);
    }
  }
  throw new Error(`Unclosed brace in function "${fnSignatureStart}"`);
}

test('Global deny safety net & verified-email identity helpers exist', () => {
  const globalDeny = extractMatchBlock(rulesContent, 'match /{document=**}');
  assert.match(globalDeny, /allow read, write:\s*if false;/);

  const isSuperAdmin = extractFunctionBlock(rulesContent, 'function isSuperAdmin()');
  assert.match(isSuperAdmin, /isEmailVerified\(\)/);
  assert.match(isSuperAdmin, /masesawilson3@gmail\.com/);
  assert.match(isSuperAdmin, /hasUserDoc\(\)/);
  assert.match(isSuperAdmin, /userRoles\(\)\.hasAny\(\['SUPER_ADMIN'\]\)/);

  const isAdmin = extractFunctionBlock(rulesContent, 'function isAdmin()');
  assert.match(isAdmin, /isEmailVerified\(\)/);
  assert.match(isAdmin, /'STORE_MANAGER'/);
  assert.match(isAdmin, /'DELIVERY_MANAGER'/);

  const isEmailVerifiedFn = extractFunctionBlock(rulesContent, 'function isEmailVerified()');
  assert.match(isEmailVerifiedFn, /request\.auth\.token\.email_verified == true/);
});

test('Users collection blocks privilege escalation, cross-user reads/writes, and unverified creates', () => {
  const usersBlock = extractMatchBlock(rulesContent, 'match /users/{userId}');
  assert.doesNotMatch(usersBlock, /allow read:\s*if true/);
  assert.doesNotMatch(usersBlock, /allow write:\s*if true/);
  assert.match(usersBlock, /allow get:\s*if isSignedIn\(\) && \(request\.auth\.uid == userId \|\| isAdmin\(\)\);/);
  assert.match(usersBlock, /allow list:\s*if isAdmin\(\);/);
  assert.match(usersBlock, /incoming\(\)\.roles == \['CUSTOMER'\]/);
  assert.match(usersBlock, /incoming\(\)\.email == request\.auth\.token\.email/);
  assert.match(usersBlock, /incoming\(\)\.roles == existing\(\)\.roles/);
  assert.match(usersBlock, /isSuperAdmin\(\)/);
  assert.match(usersBlock, /allow delete:\s*if false;/);
});

test('Admins marker collection is server-managed and read-restricted', () => {
  const adminsBlock = extractMatchBlock(rulesContent, 'match /admins/{adminId}');
  assert.match(adminsBlock, /allow get:\s*if isSignedIn\(\) && \(request\.auth\.uid == adminId \|\| isSuperAdmin\(\)\);/);
  assert.match(adminsBlock, /allow list:\s*if isSuperAdmin\(\);/);
  assert.match(adminsBlock, /allow write:\s*if false;/);
});

test('Orders collection blocks unauthenticated access, cross-customer reads, and forged PAID/CONFIRMED/zero-total orders', () => {
  const ordersBlock = extractMatchBlock(rulesContent, 'match /orders/{orderId}');
  assert.doesNotMatch(ordersBlock, /allow read:\s*if true/);
  assert.doesNotMatch(ordersBlock, /allow write:\s*if true/);
  assert.match(ordersBlock, /allow get:\s*if isSignedIn\(\) && isEmailVerified\(\) && \(existing\(\)\.customerId == request\.auth\.uid \|\| isOrderStaff\(\)\);/);
  assert.match(ordersBlock, /allow list:\s*if isSignedIn\(\) && isEmailVerified\(\) && \(existing\(\)\.customerId == request\.auth\.uid \|\| isOrderStaff\(\)\);/);
  assert.match(ordersBlock, /allow create:\s*if isSignedIn\(\) && isEmailVerified\(\) && isValidId\(orderId\) && isValidCustomerOrderCreate\(incoming\(\)\);/);
  assert.match(ordersBlock, /allow update:\s*if isValidId\(orderId\) && isOrderStaff\(\) && isValidOrderStaffUpdate\(incoming\(\), existing\(\)\);/);
  assert.match(ordersBlock, /allow delete:\s*if false;/);

  const orderCreateFn = extractFunctionBlock(rulesContent, 'function isValidCustomerOrderCreate(data)');
  assert.match(orderCreateFn, /data\.customerId == request\.auth\.uid/);
  assert.match(orderCreateFn, /data\.status in \['NEW', 'PAYMENT_PENDING'\]/);
  assert.match(orderCreateFn, /data\.paymentStatus == 'PENDING'/);
  assert.match(orderCreateFn, /data\.total is number && data\.total > 0/);
  assert.match(orderCreateFn, /data\.subtotal \+ data\.deliveryFee \+ data\.serviceFee - data\.discount/);
});

test('Public storefront collections allow read but restrict writes to authorized roles with schema validation', () => {
  for (const col of ['products', 'categories']) {
    const block = extractMatchBlock(rulesContent, `match /${col}/{id}`);
    assert.match(block, /allow read:\s*if true;/);
    assert.match(block, /isCatalogAdmin\(\)/);
    assert.doesNotMatch(block, /allow write:\s*if true/);
  }

  const productsBlock = extractMatchBlock(rulesContent, 'match /products/{id}');
  assert.match(productsBlock, /isInventoryAdmin\(\)/);
  assert.match(productsBlock, /affectedKeys\(\)\.hasOnly\(\['inventory', 'availability', 'updatedAt'\]\)/);

  const zonesBlock = extractMatchBlock(rulesContent, 'match /deliveryZones/{id}');
  assert.match(zonesBlock, /allow read:\s*if true;/);
  assert.match(zonesBlock, /isLogisticsAdmin\(\)/);
  assert.doesNotMatch(zonesBlock, /allow write:\s*if true/);

  for (const col of ['coupons', 'promotions', 'campaigns']) {
    const block = extractMatchBlock(rulesContent, `match /${col}/{id}`);
    assert.match(block, /allow read:\s*if true;/);
    assert.match(block, /isMarketingAdmin\(\)/);
    assert.doesNotMatch(block, /allow write:\s*if true/);
  }

  const cmsBlock = extractMatchBlock(rulesContent, 'match /cmsSections/{id}');
  assert.match(cmsBlock, /allow read:\s*if true;/);
  assert.match(cmsBlock, /isCatalogAdmin\(\)/);

  const configBlock = extractMatchBlock(rulesContent, 'match /config/{id}');
  assert.match(configBlock, /allow read:\s*if true;/);
  assert.match(configBlock, /isSuperAdmin\(\)/);
  assert.match(configBlock, /id == 'giftBuilder' && isCatalogAdmin\(\)/);
});

test('Phase 3 inventory, suppliers, drivers, recipients, and connection collections are hardened', () => {
  const recipientsBlock = extractMatchBlock(rulesContent, 'match /recipients/{recipientId}');
  assert.match(recipientsBlock, /request\.auth\.uid == userId/);
  assert.match(recipientsBlock, /isEmailVerified\(\)/);
  assert.match(recipientsBlock, /isValidSavedRecipient\(incoming\(\), recipientId\)/);

  const invBlock = extractMatchBlock(rulesContent, 'match /inventoryRecords/{id}');
  assert.match(invBlock, /allow read:\s*if isAdmin\(\);/);
  assert.match(invBlock, /isInventoryAdmin\(\)/);
  assert.match(invBlock, /allow delete:\s*if false;/);

  const movBlock = extractMatchBlock(rulesContent, 'match /stockMovements/{id}');
  assert.match(movBlock, /allow read:\s*if isInventoryAdmin\(\);/);
  assert.match(movBlock, /allow create:\s*if isValidId\(id\) && isInventoryAdmin\(\) && isValidStockMovement\(incoming\(\), id\);/);
  assert.match(movBlock, /allow update, delete:\s*if false;/);

  const supBlock = extractMatchBlock(rulesContent, 'match /suppliers/{id}');
  assert.match(supBlock, /allow read:\s*if isInventoryAdmin\(\);/);
  assert.match(supBlock, /isInventoryAdmin\(\)/);
  assert.match(supBlock, /allow delete:\s*if isValidId\(id\) && isSuperAdmin\(\);/);

  const drvBlock = extractMatchBlock(rulesContent, 'match /drivers/{id}');
  assert.match(drvBlock, /allow read:\s*if isOrderStaff\(\);/);
  assert.match(drvBlock, /isLogisticsAdmin\(\)/);

  const connBlock = extractMatchBlock(rulesContent, 'match /test/connection');
  assert.match(connBlock, /allow get:\s*if true;/);
  assert.match(connBlock, /allow write:\s*if false;/);
});

test('Audit logs are SUPER_ADMIN readable, admin append-only, and strictly immutable', () => {
  const auditBlock = extractMatchBlock(rulesContent, 'match /auditLogs/{id}');
  assert.match(auditBlock, /allow read:\s*if isSuperAdmin\(\);/);
  assert.match(auditBlock, /allow create:\s*if isValidId\(id\) && isAdmin\(\) && isValidAuditLog\(incoming\(\)\);/);
  assert.match(auditBlock, /allow update, delete:\s*if false;/);
});

test('PaymentTransactions collection is strictly server-written and owner/staff read-restricted', () => {
  const paymentTxBlock = extractMatchBlock(rulesContent, 'match /paymentTransactions/{trackingId}');
  assert.doesNotMatch(paymentTxBlock, /allow read:\s*if true/);
  assert.doesNotMatch(paymentTxBlock, /allow write:\s*if true/);
  assert.match(
    paymentTxBlock,
    /allow get:\s*if isSignedIn\(\) && isEmailVerified\(\) && \(existing\(\)\.customerId == request\.auth\.uid \|\| isOrderStaff\(\)\);/
  );
  assert.match(paymentTxBlock, /allow list:\s*if isOrderStaff\(\);/);
  assert.match(paymentTxBlock, /allow write:\s*if false;/);

  const staffUpdateFn = extractFunctionBlock(rulesContent, 'function isValidOrderStaffUpdate(data, prev)');
  assert.match(staffUpdateFn, /'pesapalTrackingId'/);
  assert.match(staffUpdateFn, /'stockDeducted'/);
  assert.match(staffUpdateFn, /'paidAt'/);
});

test('firebase-blueprint.json documents all protected collections in firestore.rules', () => {
  const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));
  const expectedCollections = [
    'users',
    'users/{userId}/recipients',
    'admins',
    'categories',
    'products',
    'inventoryRecords',
    'stockMovements',
    'suppliers',
    'orders',
    'paymentTransactions',
    'auditLogs',
    'deliveryZones',
    'drivers',
    'coupons',
    'promotions',
    'campaigns',
    'cmsSections',
    'config',
  ];
  for (const col of expectedCollections) {
    assert.ok(blueprint.firestore?.[col], `Missing "${col}" in firebase-blueprint.json`);
  }
});
