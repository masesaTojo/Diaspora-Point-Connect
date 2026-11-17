import { Router, type Request, type Response } from 'express';
import { createAuthMiddleware, type AuthMiddlewareDeps } from '../middleware/auth.ts';
import { requireAuth, requireStaff, requireSuperAdmin } from '../middleware/requireRole.ts';

export function createAuthRouter(authDeps?: AuthMiddlewareDeps) {
  const router = Router();
  const authenticate = createAuthMiddleware(authDeps);

  router.get('/auth/me', authenticate, requireAuth, (req: Request, res: Response) => {
    const auth = req.auth!;
    res.status(200).json({
      ok: true,
      uid: auth.uid,
      email: auth.email,
      emailVerified: auth.emailVerified,
      roles: auth.roles,
      isStaff: auth.isStaff,
      isSuperAdmin: auth.isSuperAdmin,
      roleLookupUnavailable: auth.roleLookupUnavailable,
    });
  });

  router.get('/admin/session', authenticate, requireStaff, (req: Request, res: Response) => {
    const auth = req.auth!;
    res.status(200).json({
      ok: true,
      uid: auth.uid,
      email: auth.email,
      emailVerified: auth.emailVerified,
      roles: auth.roles,
      isSuperAdmin: auth.isSuperAdmin,
    });
  });

  router.get('/admin/super-check', authenticate, requireSuperAdmin, (req: Request, res: Response) => {
    const auth = req.auth!;
    res.status(200).json({
      ok: true,
      uid: auth.uid,
      email: auth.email,
      roles: auth.roles,
    });
  });

  return router;
}
