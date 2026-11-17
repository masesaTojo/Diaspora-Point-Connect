import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role, AuditLogEntry } from '../types';
import { auth, db } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { resolveEffectiveRoles, rolesMatch, hasStaffAccess } from '../lib/rbac';
import { buildFirestoreErrorInfo, OperationType, stripUndefined } from '../lib/firestoreErrors';

interface AuthContextType {
  currentUser: User | null;
  effectiveRoles: Role[];
  isStaff: boolean;
  emailVerified: boolean;
  loading: boolean;
  authError: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: Role | Role[]) => boolean;
  logAction: (
    action: string,
    entity: string,
    entityId?: string,
    oldValue?: string,
    newValue?: string
  ) => void;
  auditLogs: AuditLogEntry[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [effectiveRoles, setEffectiveRoles] = useState<Role[]>([]);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const isStaff = hasStaffAccess(effectiveRoles);
  const isSuperAdmin = rolesMatch(effectiveRoles, 'SUPER_ADMIN');

  const appendLog = useCallback(
    async (
      action: string,
      entity: string,
      entityId?: string,
      oldValue?: string,
      newValue?: string,
      actor?: { userId?: string; userEmail?: string }
    ) => {
      const uid = actor?.userId || auth.currentUser?.uid || currentUser?.id;
      const email = actor?.userEmail || auth.currentUser?.email || currentUser?.email || 'unknown';
      const newLog: AuditLogEntry = stripUndefined({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: uid || 'anonymous',
        userEmail: email,
        action: action.slice(0, 64),
        entity: entity.slice(0, 64),
        entityId: entityId ? String(entityId).slice(0, 128) : undefined,
        oldValue: oldValue !== undefined ? String(oldValue).slice(0, 500) : undefined,
        newValue: newValue !== undefined ? String(newValue).slice(0, 500) : undefined,
        timestamp: new Date().toISOString(),
      }) as AuditLogEntry;

      if (auth.currentUser && auth.currentUser.emailVerified && hasStaffAccess(effectiveRoles)) {
        try {
          await setDoc(doc(db, 'auditLogs', newLog.id), newLog);
        } catch (err) {
          console.error(
            'Failed to persist audit log to Firestore:',
            JSON.stringify(buildFirestoreErrorInfo(err, OperationType.CREATE, `auditLogs/${newLog.id}`))
          );
        }
      }
    },
    [currentUser, effectiveRoles]
  );

  // Subscribe to real-time Firestore auditLogs for SUPER_ADMIN only
  useEffect(() => {
    if (!currentUser || !emailVerified || !isSuperAdmin) {
      setAuditLogs([]);
      return;
    }

    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(200));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLogEntry));
        setAuditLogs(docs);
      },
      (err) => {
        console.error(
          'Audit logs stream error:',
          JSON.stringify(buildFirestoreErrorInfo(err, OperationType.LIST, 'auditLogs'))
        );
      }
    );

    return () => unsubscribe();
  }, [currentUser, emailVerified, isSuperAdmin]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setAuthError(null);
      try {
        if (firebaseUser) {
          setEmailVerified(Boolean(firebaseUser.emailVerified));
          let resolvedUser: User;
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            resolvedUser = userDoc.data() as User;
          } else {
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              firstName: firebaseUser.displayName?.split(' ')[0] || '',
              lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
              roles: ['CUSTOMER'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userRef, newUser);
            resolvedUser = newUser;
          }

          setCurrentUser(resolvedUser);
          setEffectiveRoles(
            resolveEffectiveRoles(resolvedUser, {
              firebaseEmail: firebaseUser.email,
              emailVerified: firebaseUser.emailVerified,
            })
          );
        } else {
          setCurrentUser(null);
          setEffectiveRoles([]);
          setEmailVerified(false);
        }
      } catch (error: any) {
        console.error('Auth state initialization failed', error);
        setAuthError(error?.message || 'Unable to verify user profile.');
        if (firebaseUser) {
          const fallbackUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            firstName: firebaseUser.displayName?.split(' ')[0] || '',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            roles: ['CUSTOMER'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setCurrentUser(fallbackUser);
          setEffectiveRoles(
            resolveEffectiveRoles(fallbackUser, {
              firebaseEmail: firebaseUser.email,
              emailVerified: firebaseUser.emailVerified,
            })
          );
          setEmailVerified(Boolean(firebaseUser.emailVerified));
        } else {
          setCurrentUser(null);
          setEffectiveRoles([]);
          setEmailVerified(false);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      const cred = await signInWithPopup(auth, provider);
      const userSnap = await getDoc(doc(db, 'users', cred.user.uid)).catch(() => null);
      const userData = userSnap?.exists() ? (userSnap.data() as User) : null;
      const roles = resolveEffectiveRoles(userData, {
        firebaseEmail: cred.user.email,
        emailVerified: cred.user.emailVerified,
      });
      if (cred.user.emailVerified && hasStaffAccess(roles)) {
        const logId = `log-login-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        await setDoc(doc(db, 'auditLogs', logId), {
          id: logId,
          userId: cred.user.uid,
          userEmail: cred.user.email || 'unknown',
          action: 'LOGIN',
          entity: 'Auth',
          entityId: cred.user.uid,
          newValue: 'Staff Google OAuth login',
          timestamp: new Date().toISOString(),
        }).catch(() => undefined);
      }
    } catch (error: any) {
      console.error('Login failed', error);
      setAuthError(error?.message || 'Google sign-in was cancelled or blocked.');
    }
  };

  const logout = async () => {
    const actor = {
      userId: currentUser?.id,
      userEmail: currentUser?.email,
    };
    try {
      if (auth.currentUser && emailVerified && isStaff) {
        await appendLog('LOGOUT', 'Auth', actor.userId, undefined, 'Signed out', actor);
      }
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const hasRole = useCallback(
    (role: Role | Role[]) => rolesMatch(effectiveRoles, role),
    [effectiveRoles]
  );

  const logAction = useCallback(
    (action: string, entity: string, entityId?: string, oldValue?: string, newValue?: string) => {
      void appendLog(action, entity, entityId, oldValue, newValue);
    },
    [appendLog]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        effectiveRoles,
        isStaff,
        emailVerified,
        loading,
        authError,
        login,
        logout,
        hasRole,
        logAction,
        auditLogs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
