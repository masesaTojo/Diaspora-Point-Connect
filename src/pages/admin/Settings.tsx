import React, { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { STAFF_ROLES } from '@/src/lib/rbac';
import { Shield, Users, Activity, Lock, Search, CheckCircle2, LogOut } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function Settings() {
  const { currentUser, effectiveRoles, emailVerified, logout, auditLogs, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'security' | 'roles' | 'audit'>('security');
  const [searchTerm, setSearchTerm] = useState('');

  if (!hasRole("SUPER_ADMIN")) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Access Denied. You must be a SUPER_ADMIN to view Security & Settings.
      </div>
    );
  }

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Security & Audit</h2>
          <p className="text-sm text-text-muted">Manage roles, review audit logs, and security settings.</p>
        </div>
      </div>

      <div className="flex border-b border-neutral-200">
        <button
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'security' ? 'border-dpc-blue text-dpc-blue' : 'border-transparent text-text-muted hover:text-navy'}`}
          onClick={() => setActiveTab('security')}
        >
          <Lock className="w-4 h-4" /> Security
        </button>
        <button
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'roles' ? 'border-dpc-blue text-dpc-blue' : 'border-transparent text-text-muted hover:text-navy'}`}
          onClick={() => setActiveTab('roles')}
        >
          <Users className="w-4 h-4" /> Roles & Permissions
        </button>
        <button
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'audit' ? 'border-dpc-blue text-dpc-blue' : 'border-transparent text-text-muted hover:text-navy'}`}
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
              {filteredLogs.map(log => (
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
                  <td className="px-6 py-4">{log.entity} {log.entityId ? `(#${log.entityId})` : ''}</td>
                  <td className="px-6 py-4 text-xs text-text-muted">
                    {log.oldValue && <div className="line-through text-red-400">{log.oldValue}</div>}
                    {log.newValue && <div className="text-green-600">{log.newValue}</div>}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">No audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
           <h3 className="font-bold text-navy mb-4">Role System Config</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {STAFF_ROLES.map(role => (
               <div key={role} className="p-4 border border-neutral-200 rounded-lg">
                 <h4 className="font-bold text-navy">{role}</h4>
                 <div className="flex gap-2 mt-2">
                   <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">VIEW</span>
                   {role !== "SUPPORT_AGENT" && role !== "DELIVERY_MANAGER" && (
                     <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">EDIT</span>
                   )}
                   {role === "SUPER_ADMIN" && <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded">ADMIN / MIGRATION</span>}
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
