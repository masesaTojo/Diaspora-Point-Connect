import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../../types/index.ts';
import { isVerifiedBootstrapAdmin, resolveEffectiveRoles, STAFF_ROLES } from '../../lib/rbac.ts';
import { getFirebaseAdminContext } from '../firebaseAdmin.ts';

export interface DecodedTokenLike {
  uid: string;
  email?: string;
  email_verified?: boolean;
}

export interface RequestAuthContext {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  roles: Role[];
  isStaff: boolean;
  isSuperAdmin: boolean;
  roleLookupUnavailable: boolean;
}

export interface AuthMiddlewareDeps {
  verifyIdToken?: (token: string) => Promise<DecodedTokenLike>;
  loadUserRoles?: (uid: string) => Promise<{ roles: Role[]; isAdminDoc: boolean }>;
}

declare global {
  namespace Express {
    interface Request {
      auth?: RequestAuthContext;
    }
  }
}

function normalizeRoles(rawRoles: unknown): Role[] {
  if (!Array.isArray(rawRoles)) return [];
  const validSet = new Set<string>([...STAFF_ROLES, 'CUSTOMER']);
  return rawRoles.filter((r): r is Role => typeof r === 'string' && validSet.has(r));
}

async function defaultLoadUserRoles(uid: string): Promise<{ roles: Role[]; isAdminDoc: boolean }> {
  const { db, credentialMode } = getFirebaseAdminContext();
  if (!db || credentialMode === 'project_only') {
    throw new Error('Firebase Admin Firestore credentials are not configured');
  }

  const [userSnap, adminSnap] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('admins').doc(uid).get(),
  ]);

  const userData = userSnap.exists ? userSnap.data() : undefined;
  const roles = normalizeRoles(userData?.roles);
  return {
    roles,
    isAdminDoc: adminSnap.exists,
  };
}

async function defaultVerifyIdToken(token: string): Promise<DecodedTokenLike> {
  const { auth, credentialMode } = getFirebaseAdminContext();
  const checkRevoked = credentialMode !== 'project_only';
  return (await auth.verifyIdToken(token, checkRevoked)) as DecodedTokenLike;
}

export function createAuthMiddleware(deps: AuthMiddlewareDeps = {}) {
  const verifyIdToken = deps.verifyIdToken ?? defaultVerifyIdToken;
  const loadUserRoles = deps.loadUserRoles ?? defaultLoadUserRoles;

  return async function authenticateFirebaseBearer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or malformed Authorization Bearer token.',
      });
      return;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Empty Bearer token.',
      });
      return;
    }

    let decoded: DecodedTokenLike;
    try {
      decoded = await verifyIdToken(token);
    } catch {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired Firebase ID token.',
      });
      return;
    }

    const email = typeof decoded.email === 'string' ? decoded.email : null;
    const emailVerified = decoded.email_verified === true;

    let baseRoles: Role[] = [];
    let isAdminDoc = false;
    let roleLookupUnavailable = false;

    try {
      const loaded = await loadUserRoles(decoded.uid);
      baseRoles = loaded.roles;
      isAdminDoc = loaded.isAdminDoc;
    } catch (err) {
      roleLookupUnavailable = true;
      console.warn('Role lookup unavailable for uid:', decoded.uid, (err as Error)?.message);
    }

    const effectiveRoles = resolveEffectiveRoles(
      { roles: baseRoles.length > 0 ? baseRoles : [] },
      { firebaseEmail: email, emailVerified }
    );

    if (isAdminDoc && emailVerified && !effectiveRoles.some((r) => STAFF_ROLES.includes(r))) {
      effectiveRoles.push('STORE_MANAGER');
    }

    // Preserve verified bootstrap access explicitly even if Firestore lookup is offline
    const bootstrapVerified = isVerifiedBootstrapAdmin(email, emailVerified);
    const finalRoles =
      bootstrapVerified && !effectiveRoles.includes('SUPER_ADMIN')
        ? [...effectiveRoles, 'SUPER_ADMIN' as Role]
        : effectiveRoles;

    const isSuperAdmin = emailVerified && finalRoles.includes('SUPER_ADMIN');
    const isStaff = emailVerified && finalRoles.some((role) => STAFF_ROLES.includes(role));

    req.auth = {
      uid: decoded.uid,
      email,
      emailVerified,
      roles: finalRoles,
      isStaff,
      isSuperAdmin,
      roleLookupUnavailable: bootstrapVerified ? false : roleLookupUnavailable,
    };

    next();
  };
}
