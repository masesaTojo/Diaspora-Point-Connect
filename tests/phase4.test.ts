import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ADMIN_ROUTE_ROLES } from '../src/lib/rbac.ts';

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
}

test('Root ErrorBoundary exists and wraps App in src/main.tsx', () => {
  const errorBoundarySrc = readSrc('src/components/ui/ErrorBoundary.tsx');
  assert.match(errorBoundarySrc, /export class ErrorBoundary/);
  assert.match(errorBoundarySrc, /getDerivedStateFromError/);
  assert.match(errorBoundarySrc, /operationType/);

  const mainSrc = readSrc('src/main.tsx');
  assert.match(mainSrc, /ErrorBoundary/);
  assert.match(mainSrc, /<ErrorBoundary>[\s\S]*<App\s*\/>[\s\S]*<\/ErrorBoundary>/);
});

test('Zero mockData imports remain in customer storefront pages (Home, Shop, ProductDetail)', () => {
  for (const file of [
    'src/pages/customer/Home.tsx',
    'src/pages/customer/Shop.tsx',
    'src/pages/customer/ProductDetail.tsx',
  ]) {
    const src = readSrc(file);
    assert.doesNotMatch(src, /from ['"]@\/src\/lib\/mockData['"]/, `Unexpected mockData import in ${file}`);
    assert.match(src, /storefrontConstants/, `Expected storefrontConstants usage in ${file}`);
  }
});

test('Orders.tsx and TrackOrder.tsx use real operator-captured delivery proof and remove placeholder fallbacks', () => {
  const ordersSrc = readSrc('src/pages/admin/Orders.tsx');
  assert.doesNotMatch(ordersSrc, /images\.unsplash\.com/, 'Orders.tsx must not use hardcoded Unsplash proofOfDelivery URLs');
  assert.match(ordersSrc, /expectedDeliveryTime/);
  assert.match(ordersSrc, /proofOfDelivery/);

  const trackSrc = readSrc('src/pages/customer/TrackOrder.tsx');
  assert.doesNotMatch(trackSrc, /sender@example\.com/, 'TrackOrder.tsx must not fallback to sender@example.com');
  assert.match(trackSrc, /expectedDeliveryTime/);
  assert.match(trackSrc, /proofOfDelivery/);
  assert.match(trackSrc, /DELIVERY_FAILED/);
});

test('Support Desk, Support, Contact, AboutUs, and Account persist and read supportTickets in Firestore', () => {
  for (const file of [
    'src/pages/customer/Support.tsx',
    'src/pages/customer/Contact.tsx',
    'src/pages/customer/AboutUs.tsx',
  ]) {
    const src = readSrc(file);
    assert.match(src, /collection\(db,\s*['"]supportTickets['"]|doc\(db,\s*['"]supportTickets['"]/, `${file} must write supportTickets to Firestore`);
    assert.match(src, /setDoc\(/, `${file} must persist ticket via setDoc`);
  }

  const accountSrc = readSrc('src/pages/customer/Account.tsx');
  assert.match(accountSrc, /supportTickets/);
  assert.match(accountSrc, /Support Tickets/);
  assert.match(accountSrc, /proofOfDelivery/);

  const deskSrc = readSrc('src/pages/admin/SupportDesk.tsx');
  assert.match(deskSrc, /supportTickets/);
  assert.match(deskSrc, /UPDATE_TICKET/);
  assert.match(deskSrc, /resolutionNote/);
});

test('ProductDetail integrates live Firestore productReviews and saved customer recipients', () => {
  const src = readSrc('src/pages/customer/ProductDetail.tsx');
  assert.match(src, /productReviews/);
  assert.match(src, /verifiedPurchase/);
  assert.match(src, /recipients/);
});

test('Settings manages Firestore user roles and /admin/support route is RBAC protected', () => {
  assert.deepEqual(ADMIN_ROUTE_ROLES.support, [
    'SUPER_ADMIN',
    'STORE_MANAGER',
    'ORDER_MANAGER',
    'SUPPORT_AGENT',
  ]);

  const settingsSrc = readSrc('src/pages/admin/Settings.tsx');
  assert.match(settingsSrc, /collection\(db,\s*['"]users['"]\)/);
  assert.match(settingsSrc, /updateDoc\(/);
  assert.match(settingsSrc, /stripUndefined/);

  const appSrc = readSrc('src/App.tsx');
  assert.match(appSrc, /path="support"/);
  assert.match(appSrc, /ADMIN_ROUTE_ROLES\.support/);

  const layoutSrc = readSrc('src/components/layout/AdminLayout.tsx');
  assert.match(layoutSrc, /\/admin\/support/);
  assert.match(layoutSrc, /Support Desk/);
});
