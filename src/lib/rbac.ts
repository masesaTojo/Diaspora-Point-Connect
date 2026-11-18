import type { Role, User } from '../types/index.ts';

export const BOOTSTRAP_SUPER_ADMIN_EMAIL = 'masesawilson3@gmail.com';

export const STAFF_ROLES: Role[] = [
  'SUPER_ADMIN',
  'STORE_MANAGER',
  'ORDER_MANAGER',
  'INVENTORY_MANAGER',
  'FINANCE_MANAGER',
  'CONTENT_MANAGER',
  'DELIVERY_MANAGER',
  'SUPPORT_AGENT',
];

export const ADMIN_ROUTE_ROLES = {
  dashboard: STAFF_ROLES,
  sales: ['SUPER_ADMIN', 'STORE_MANAGER', 'ORDER_MANAGER', 'DELIVERY_MANAGER', 'FINANCE_MANAGER', 'SUPPORT_AGENT'] as Role[],
  catalog: ['SUPER_ADMIN', 'STORE_MANAGER', 'CONTENT_MANAGER'] as Role[],
  inventory: ['SUPER_ADMIN', 'STORE_MANAGER', 'INVENTORY_MANAGER', 'ORDER_MANAGER'] as Role[],
  logistics: ['SUPER_ADMIN', 'STORE_MANAGER', 'DELIVERY_MANAGER', 'ORDER_MANAGER'] as Role[],
  suppliers: ['SUPER_ADMIN', 'STORE_MANAGER', 'INVENTORY_MANAGER'] as Role[],
  customers: ['SUPER_ADMIN', 'STORE_MANAGER', 'ORDER_MANAGER', 'FINANCE_MANAGER', 'SUPPORT_AGENT'] as Role[],
  support: ['SUPER_ADMIN', 'STORE_MANAGER', 'ORDER_MANAGER', 'SUPPORT_AGENT'] as Role[],
  marketing: ['SUPER_ADMIN', 'STORE_MANAGER', 'CONTENT_MANAGER'] as Role[],
  content: ['SUPER_ADMIN', 'STORE_MANAGER', 'CONTENT_MANAGER'] as Role[],
  giftBuilder: ['SUPER_ADMIN', 'STORE_MANAGER', 'CONTENT_MANAGER'] as Role[],
  analytics: ['SUPER_ADMIN', 'STORE_MANAGER', 'FINANCE_MANAGER'] as Role[],
  settings: ['SUPER_ADMIN'] as Role[],
  migration: ['SUPER_ADMIN'] as Role[],
};

export interface EffectiveRoleContext {
  firebaseEmail?: string | null;
  emailVerified?: boolean;
}

export function isVerifiedBootstrapAdmin(
  firebaseEmail?: string | null,
  emailVerified?: boolean
): boolean {
  return (
    Boolean(firebaseEmail) &&
    firebaseEmail!.trim().toLowerCase() === BOOTSTRAP_SUPER_ADMIN_EMAIL &&
    emailVerified === true
  );
}

export function resolveEffectiveRoles(
  user: Pick<User, 'roles'> | null | undefined,
  ctx?: EffectiveRoleContext
): Role[] {
  const baseRoles: Role[] = Array.isArray(user?.roles) ? [...user.roles] : [];
  if (isVerifiedBootstrapAdmin(ctx?.firebaseEmail, ctx?.emailVerified)) {
    if (!baseRoles.includes('SUPER_ADMIN')) {
      baseRoles.push('SUPER_ADMIN');
    }
  }
  return baseRoles;
}

export function rolesMatch(effectiveRoles: Role[], required: Role | Role[]): boolean {
  if (effectiveRoles.length === 0) return false;
  if (effectiveRoles.includes('SUPER_ADMIN')) return true;

  if (Array.isArray(required)) {
    return required.some((role) => effectiveRoles.includes(role));
  }
  return effectiveRoles.includes(required);
}

export function hasStaffAccess(effectiveRoles: Role[]): boolean {
  return effectiveRoles.some((role) => STAFF_ROLES.includes(role));
}
