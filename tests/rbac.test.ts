import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_ROUTE_ROLES,
  BOOTSTRAP_SUPER_ADMIN_EMAIL,
  STAFF_ROLES,
  hasStaffAccess,
  isVerifiedBootstrapAdmin,
  resolveEffectiveRoles,
  rolesMatch,
} from '../src/lib/rbac';

test('Unauthenticated / empty roles are denied all admin & sensitive routes', () => {
  const roles = resolveEffectiveRoles(null);
  assert.deepEqual(roles, []);
  assert.equal(hasStaffAccess(roles), false);
  assert.equal(rolesMatch(roles, STAFF_ROLES), false);
  assert.equal(rolesMatch(roles, ADMIN_ROUTE_ROLES.migration), false);
  assert.equal(rolesMatch(roles, ADMIN_ROUTE_ROLES.settings), false);
});

test('CUSTOMER account cannot access /admin, /admin/migration, or /admin/settings', () => {
  const roles = resolveEffectiveRoles({ roles: ['CUSTOMER'] });
  assert.deepEqual(roles, ['CUSTOMER']);
  assert.equal(hasStaffAccess(roles), false);
  assert.equal(rolesMatch(roles, ADMIN_ROUTE_ROLES.dashboard), false);
  assert.equal(rolesMatch(roles, ADMIN_ROUTE_ROLES.sales), false);
  assert.equal(rolesMatch(roles, ADMIN_ROUTE_ROLES.migration), false);
  assert.equal(rolesMatch(roles, ADMIN_ROUTE_ROLES.settings), false);
});

test('Verified bootstrap administrator retains SUPER_ADMIN UI access without overwriting customer doc', () => {
  assert.equal(isVerifiedBootstrapAdmin(BOOTSTRAP_SUPER_ADMIN_EMAIL, true), true);
  assert.equal(isVerifiedBootstrapAdmin('MASESAWILSON3@GMAIL.COM', true), true);
  assert.equal(isVerifiedBootstrapAdmin(BOOTSTRAP_SUPER_ADMIN_EMAIL, false), false);

  const roles = resolveEffectiveRoles(
    { roles: ['CUSTOMER'] },
    { firebaseEmail: BOOTSTRAP_SUPER_ADMIN_EMAIL, emailVerified: true }
  );
  assert.equal(roles.includes('SUPER_ADMIN'), true);
  assert.equal(hasStaffAccess(roles), true);
  assert.equal(rolesMatch(roles, ADMIN_ROUTE_ROLES.dashboard), true);
  assert.equal(rolesMatch(roles, ADMIN_ROUTE_ROLES.migration), true);
  assert.equal(rolesMatch(roles, ADMIN_ROUTE_ROLES.settings), true);
  assert.equal(rolesMatch(roles, ADMIN_ROUTE_ROLES.analytics), true);
});

test('Unverified email matching bootstrap email is NEVER granted SUPER_ADMIN', () => {
  const roles = resolveEffectiveRoles(
    { roles: ['CUSTOMER'] },
    { firebaseEmail: BOOTSTRAP_SUPER_ADMIN_EMAIL, emailVerified: false }
  );
  assert.equal(roles.includes('SUPER_ADMIN'), false);
  assert.equal(hasStaffAccess(roles), false);
  assert.equal(rolesMatch(roles, ADMIN_ROUTE_ROLES.migration), false);
});

test('Authorized SUPER_ADMIN user doc accesses all routes including migration & settings', () => {
  const roles = resolveEffectiveRoles({ roles: ['SUPER_ADMIN'] });
  assert.equal(hasStaffAccess(roles), true);
  for (const allowed of Object.values(ADMIN_ROUTE_ROLES)) {
    assert.equal(rolesMatch(roles, allowed), true);
  }
});

test('Granular staff roles access permitted routes and are blocked from restricted routes', () => {
  const storeManager = resolveEffectiveRoles({ roles: ['STORE_MANAGER'] });
  assert.equal(hasStaffAccess(storeManager), true);
  assert.equal(rolesMatch(storeManager, ADMIN_ROUTE_ROLES.dashboard), true);
  assert.equal(rolesMatch(storeManager, ADMIN_ROUTE_ROLES.catalog), true);
  assert.equal(rolesMatch(storeManager, ADMIN_ROUTE_ROLES.analytics), true);
  assert.equal(rolesMatch(storeManager, ADMIN_ROUTE_ROLES.migration), false);
  assert.equal(rolesMatch(storeManager, ADMIN_ROUTE_ROLES.settings), false);

  const deliveryManager = resolveEffectiveRoles({ roles: ['DELIVERY_MANAGER'] });
  assert.equal(hasStaffAccess(deliveryManager), true);
  assert.equal(rolesMatch(deliveryManager, ADMIN_ROUTE_ROLES.logistics), true);
  assert.equal(rolesMatch(deliveryManager, ADMIN_ROUTE_ROLES.sales), true);
  assert.equal(rolesMatch(deliveryManager, ADMIN_ROUTE_ROLES.catalog), false);
  assert.equal(rolesMatch(deliveryManager, ADMIN_ROUTE_ROLES.analytics), false);
  assert.equal(rolesMatch(deliveryManager, ADMIN_ROUTE_ROLES.migration), false);
  assert.equal(rolesMatch(deliveryManager, ADMIN_ROUTE_ROLES.settings), false);

  const inventoryManager = resolveEffectiveRoles({ roles: ['INVENTORY_MANAGER'] });
  assert.equal(rolesMatch(inventoryManager, ADMIN_ROUTE_ROLES.inventory), true);
  assert.equal(rolesMatch(inventoryManager, ADMIN_ROUTE_ROLES.suppliers), true);
  assert.equal(rolesMatch(inventoryManager, ADMIN_ROUTE_ROLES.marketing), false);
  assert.equal(rolesMatch(inventoryManager, ADMIN_ROUTE_ROLES.migration), false);
});
