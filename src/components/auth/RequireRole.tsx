import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, LogIn, LogOut, Store, Loader2, ArrowLeft } from 'lucide-react';
import { Role } from '@/src/types';
import { useAuth } from '@/src/contexts/AuthContext';
import { STAFF_ROLES } from '@/src/lib/rbac';
import { Button } from '@/src/components/ui/Button';

interface RequireRoleProps {
  allowedRoles?: Role[];
  children?: React.ReactNode;
  title?: string;
}

export const RequireRole: React.FC<RequireRoleProps> = ({
  allowedRoles = STAFF_ROLES,
  children,
  title = 'Control Center',
}) => {
  const { currentUser, effectiveRoles, loading, login, logout, hasRole, isStaff, authError } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-bg flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-dpc-blue animate-spin mb-3" />
        <p className="text-sm font-semibold text-navy">Verifying authorization...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md w-full border border-neutral-200">
          <div className="w-14 h-14 bg-dpc-blue/10 text-dpc-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-display font-bold text-navy mb-2">{title} Sign In</h2>
          <p className="text-sm text-text-muted mb-6">
            Sign in with your authorized staff Google account to access the Diaspora Point Connect management portal.
          </p>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-left">
              {authError}
            </div>
          )}

          <Button onClick={login} className="w-full h-11 font-bold gap-2 mb-5">
            <LogIn className="w-4 h-4" />
            Sign in with Google
          </Button>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-navy transition-colors"
          >
            <Store className="w-4 h-4" /> Return to Customer Store
          </Link>
        </div>
      </div>
    );
  }

  if (!hasRole(allowedRoles)) {
    return (
      <div className="min-h-[70vh] bg-neutral-bg flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-lg w-full border border-red-200">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-display font-bold text-navy mb-2">Access Denied</h2>
          <p className="text-sm text-text-muted mb-4">
            Your account (<span className="font-semibold text-navy">{currentUser.email}</span>) does not have permission to access this area.
          </p>
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 text-xs text-left space-y-1.5 mb-6">
            <div>
              <span className="font-bold text-navy">Assigned Roles:</span>{' '}
              <span className="text-text-muted">{effectiveRoles.length ? effectiveRoles.join(', ') : 'None'}</span>
            </div>
            <div>
              <span className="font-bold text-navy">Required Roles:</span>{' '}
              <span className="text-text-muted">{allowedRoles.join(', ')}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isStaff && (
              <Link to="/admin">
                <Button variant="outline" className="w-full sm:w-auto gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Admin Dashboard
                </Button>
              </Link>
            )}
            <Link to="/">
              <Button className="w-full sm:w-auto gap-1.5">
                <Store className="w-4 h-4" /> Return to Storefront
              </Button>
            </Link>
            <Button variant="outline" onClick={logout} className="w-full sm:w-auto gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
