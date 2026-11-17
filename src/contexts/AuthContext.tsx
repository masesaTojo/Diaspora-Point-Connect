import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: Role | Role[]) => boolean;
  logAction: (action: string, entity: string, entityId?: string, oldValue?: string, newValue?: string) => void;
  auditLogs: any[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('dpc_audit_logs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch or create user profile in Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as User);
        } else {
          // Create new user profile
          const newUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            firstName: firebaseUser.displayName?.split(' ')[0] || '',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            roles: ['CUSTOMER'], // Default role
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setCurrentUser(newUser);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveLogs = (logs: any[]) => {
    setAuditLogs(logs);
    localStorage.setItem('dpc_audit_logs', JSON.stringify(logs));
  };

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      logAction('LOGIN', 'Auth', undefined, undefined, 'Success');
    } catch (error) {
      console.error('Login failed', error);
      logAction('FAILED_LOGIN', 'Auth', undefined, undefined, 'Failed');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      logAction('LOGOUT', 'Auth');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const hasRole = (role: Role | Role[]) => {
    if (!currentUser) return false;
    if (currentUser.roles.includes("SUPER_ADMIN")) return true;
    
    if (Array.isArray(role)) {
      return role.some(r => currentUser.roles.includes(r));
    }
    return currentUser.roles.includes(role);
  };

  const logAction = (action: string, entity: string, entityId?: string, oldValue?: string, newValue?: string) => {
    const newLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.id || 'anonymous',
      userEmail: currentUser?.email || 'unknown',
      action,
      entity,
      entityId,
      oldValue,
      newValue,
      timestamp: new Date().toISOString()
    };
    saveLogs([newLog, ...auditLogs]);
    // In production, we'd write this to Firestore:
    // addDoc(collection(db, 'auditLogs'), newLog);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, hasRole, logAction, auditLogs }}>
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
