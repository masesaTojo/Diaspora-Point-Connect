import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { BOOTSTRAP_SUPER_ADMIN_EMAIL, STAFF_ROLES } from '@/src/lib/rbac';
import { Role, User } from '@/src/types';
import { db } from '@/src/lib/firebase';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { buildFirestoreErrorInfo, OperationType, stripUndefined } from '@/src/lib/firestoreErrors';
import {
  Shield,
  Users,
  Activity,
  Lock,
  Search,
  CheckCircle2,
  LogOut,
  AlertCircle,
  Save,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

const ALL_ASSIGNABLE_ROLES: Role[] = ['CUSTOMER', ...STAFF_ROLES];

export default function Settings() {
  const { currentUser, effectiveRoles, emailVerified, logout, auditLogs, hasRole, logAction } = useAuth();
  const [activeTab, setActiveTab] = useState<'security' | 'roles' | 'audit'>('security');
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, Role[]>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isSuperAdmin = hasRole('SUPER_ADMIN');

  useEffect(() => {
    if (!isSuperAdmin) {
      setUsersLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as User));
        list.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
        setUsers(list);
        setRoleDrafts((prev) => {
          const next = { ...prev };
          list.forEach((u) => {
            if (!next[u.id]) {
              next[u.id] = Array.isArray(u.roles) && u.roles.length > 0 ? [...u.roles] : ['CUSTOMER'];
            }
          });
          return next;
        });
        setUsersLoading(false);
      },
      (err) => {
        console.error(
          'Users directory listener error:',
          JSON.stringify(buildFirestoreErrorInfo(err, OperationType.LIST, 'users'))
        );
        setUsersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Access Denied. You must be a SUPER_ADMIN to view Security & Settings.
      </div>
    );
  }

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.email || '').toLowerCase().includes(q) ||
        `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const toggleUserRole = (user: User, role: Role) => {
    setFeedback(null);
    const current = roleDrafts[user.id] || user.roles || ['CUSTOMER'];
    const isBootstrap = (user.email || '').trim().toLowerCase() === BOOTSTRAP_SUPER_ADMIN_EMAIL;
    const isSelf = user.id === currentUser?.id;

    let next: Role[];
    if (current.includes(role)) {
      if ((isBootstrap || isSelf) && role === 'SUPER_ADMIN') {
        setFeedback({
          type: 'error',
          message: 'Cannot remove SUPER_ADMIN from the bootstrap owner or your own active session.',
        });
        return;
      }
      if (current.length <= 1) {
        setFeedback({ type: 'error', message: 'Every user must retain at least 1 role.' });
        return;
      }
      next = current.filter((r) => r !== role);
    } else {
      if (current.length >= 5) {
        setFeedback({ type: 'error', message: 'A user can hold at most 5 roles.' });
        return;
      }
      next = [...current, role];
    }

    setRoleDrafts((prev) => ({ ...prev, [user.id]: next }));
  };

  const handleSaveUserRoles = async (user: User) => {
    const draft = roleDrafts[user.id] || user.roles || ['CUSTOMER'];
    if (draft.length === 0 || draft.length > 5) {
      setFeedback({ type: 'error', message: 'Roles must contain between 1 and 5 items.' });
      return;
    }

    setSavingUserId(user.id);
    setFeedback(null);
    try {
      const payload = stripUndefined({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: draft,
        createdAt: user.createdAt,
        updatedAt: new Date().toISOString(),
      });

      await updateDoc(doc(db, 'users', user.id), payload);
      logAction(
        'UPDATE_ROLES',
        'User',
        user.id,
        (user.roles || []).join(', '),
        draft.join(', ')
      );
      setFeedback({
        type: 'success',
        message: `Updated roles for ${user.email}: ${draft.join(', ')}`,
      });
    } catch (err) {
      console.error(
        'Role update error:',
        JSON.stringify(buildFirestoreErrorInfo(err, OperationType.UPDATE, `users/${user.id}`))
      );
      setFeedback({
        type: 'error',
        message: (err as Error)?.message || 'Failed to update user roles in Firestore.',
      });
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Security & Audit</h2>
          <p className="text-sm text-text-muted">Manage staff roles, review audit logs, and security settings.</p>
        </div>
      </div>

      <div className="flex border-b border-neutral-200">
        <button
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'security' ? 'border-dpc-blue text-dpc-blue' : 'border-transparent text-text-muted hover:text-navy'
          }`}
          onClick={() => setActiveTab('security')}
        >
          <Lock className="w-4 h-4" /> Security
        </button>
        <button
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'roles' ? 'border-dpc-blue text-dpc-blue' : 'border-transparent text-text-muted hover:text-navy'
          }`}
          onClick={() => setActiveTab('roles')}
        >
          <Users className="w-4 h-4" /> Users & Roles ({users.length})
        </button>
        <button
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'audit' ? 'border-dpc-blue text-dpc-blue' : 'border-transparent text-text-muted hover:text-navy'
          }`}
          onClick={() => setActiveTab('audit')}
        >
          <Activity className="w-4 h-4" /> Audit Logs
        </button>
      </div>

      {activeTab === 'security' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <Shield className="w-5 h-5 text-dpc-blue shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-navy">Firebase Authentication & RBAC Active</h4>
              <p className="text-sm text-text-muted mt-1">
                Administrative routes are protected by verified Firebase Authentication and role-based route guards. Role switching via mock profiles has been disabled.
              </p>
            </div>
          </div>

          <div className="p-5 border border-neutral-200 rounded-xl bg-neutral-50/70 space-y-3">
            <h4 className="font-bold text-navy">Active Administrator Session</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs font-semibold text-text-muted block">Email</span>
                <span className="font-medium text-navy">{currentUser?.email}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-text-muted block">Effective Roles</span>
                <span className="font-semibold text-dpc-blue">{effectiveRoles.join(', ')}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-text-muted block">Email Verification</span>
                <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" /> {emailVerified ? 'Verified via Google OAuth' : 'Unverified'}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-text-muted block">User ID</span>
                <span className="font-mono text-xs text-text-muted">{currentUser?.id}</span>
              </div>
            </div>
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={logout} className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5">
                <LogOut className="w-4 h-4" /> Sign Out & Switch Account
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search logs by action, entity, or user..."
                className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-md text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-navy font-semibold border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-text-muted whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-navy">{log.userEmail}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-neutral-100 rounded text-xs font-bold text-neutral-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.entity} {log.entityId ? `(#${log.entityId})` : ''}
                    </td>
                    <td className="px-6 py-4 text-xs text-text-muted">
                      {log.oldValue && <div className="line-through text-red-400">{log.oldValue}</div>}
                      {log.newValue && <div className="text-green-600">{log.newValue}</div>}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-navy text-lg">Live User & Staff Role Assignments</h3>
                <p className="text-xs text-text-muted">
                  Assign or revoke Control Center staff privileges for registered Google-authenticated accounts.
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-md text-sm"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {usersLoading ? (
              <div className="py-10 text-center text-sm text-text-muted">Loading user directory...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-10 text-center text-sm text-text-muted">No matching user accounts found.</div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => {
                  const draft = roleDrafts[user.id] || user.roles || ['CUSTOMER'];
                  const originalSorted = [...(user.roles || [])].sort().join(',');
                  const draftSorted = [...draft].sort().join(',');
                  const hasChanges = originalSorted !== draftSorted;
                  const isBootstrap =
                    (user.email || '').trim().toLowerCase() === BOOTSTRAP_SUPER_ADMIN_EMAIL;

                  return (
                    <div key={user.id} className="p-4 border border-neutral-200 rounded-xl bg-neutral-50/40 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-navy text-sm">
                              {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                            </span>
                            {isBootstrap && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200">
                                Bootstrap Owner
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-text-muted">
                            {user.email} • <span className="font-mono">{user.id}</span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          disabled={!hasChanges || savingUserId === user.id}
                          onClick={() => handleSaveUserRoles(user)}
                          className="gap-1.5 self-start sm:self-auto"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {savingUserId === user.id ? 'Saving...' : 'Save Roles'}
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {ALL_ASSIGNABLE_ROLES.map((role) => {
                          const selected = draft.includes(role);
                          return (
                            <button
                              key={role}
                              type="button"
                              onClick={() => toggleUserRole(user, role)}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                                selected
                                  ? role === 'SUPER_ADMIN'
                                    ? 'bg-red-600 text-white border-red-600'
                                    : role === 'CUSTOMER'
                                      ? 'bg-neutral-700 text-white border-neutral-700'
                                      : 'bg-dpc-blue text-white border-dpc-blue'
                                  : 'bg-white text-text-muted border-neutral-300 hover:border-navy hover:text-navy'
                              }`}
                            >
                              {role}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
            <h3 className="font-bold text-navy mb-4">Role Matrix Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STAFF_ROLES.map((role) => (
                <div key={role} className="p-4 border border-neutral-200 rounded-lg">
                  <h4 className="font-bold text-navy">{role}</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">VIEW</span>
                    {role !== 'SUPPORT_AGENT' && role !== 'DELIVERY_MANAGER' && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">EDIT</span>
                    )}
                    {(role === 'SUPPORT_AGENT' || role === 'ORDER_MANAGER' || role === 'STORE_MANAGER') && (
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">SUPPORT DESK</span>
                    )}
                    {role === 'SUPER_ADMIN' && (
                      <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded">ADMIN / MIGRATION</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
