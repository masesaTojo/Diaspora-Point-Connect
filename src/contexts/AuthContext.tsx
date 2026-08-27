import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { mockUsers, mockAuditLogs } from '../lib/mockData';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string) => void;
  logout: () => void;
  hasRole: (role: Role | Role[]) => boolean;
  logAction: (action: string, entity: string, entityId?: string, oldValue?: string, newValue?: string) => void;
  auditLogs: any[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(mockUsers[0]);
  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('dpc_audit_logs');
    return saved ? JSON.parse(saved) : mockAuditLogs;
  });

  const saveLogs = (logs: any[]) => {
    setAuditLogs(logs);
    localStorage.setItem('dpc_audit_logs', JSON.stringify(logs));
  };

  const login = (email: string) => {
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      logAction('LOGIN', 'Auth', user.id, undefined, 'Success');
    } else {
      logAction('FAILED_LOGIN', 'Auth', undefined, email, 'Failed');
    }
  };

  const logout = () => {
    if (currentUser) {
      logAction('LOGOUT', 'Auth', currentUser.id);
    }
    setCurrentUser(null);
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
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, hasRole, logAction, auditLogs }}>
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
