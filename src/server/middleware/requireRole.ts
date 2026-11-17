import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../../types/index.ts';
import { rolesMatch, STAFF_ROLES } from '../../lib/rbac.ts';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    return;
  }
  next();
}

export function requireVerifiedEmail(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    return;
  }
  if (!req.auth.emailVerified) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'A verified email address is required for this resource.',
    });
    return;
  }
  next();
}

export function requireRole(allowedRoles: Role | Role[]) {
  return function enforceRole(req: Request, res: Response, next: NextFunction): void {
    if (!req.auth) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
      return;
    }

    if (!req.auth.emailVerified) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Verified email required to exercise privileged roles.',
      });
      return;
    }

    if (req.auth.roleLookupUnavailable) {
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Unable to verify server-side role assignments. Fail-closed protection active.',
      });
      return;
    }

    if (!rolesMatch(req.auth.roles, allowedRoles)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions to access this administrative endpoint.',
      });
      return;
    }

    next();
  };
}

export const requireStaff = requireRole(STAFF_ROLES);
export const requireSuperAdmin = requireRole(['SUPER_ADMIN']);
