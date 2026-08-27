import React, { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { mockUsers } from '@/src/lib/mockData';
import { Shield, Users, Activity, Lock, Search } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function Settings() {
  const { currentUser, login, auditLogs, hasRole } = useAuth();
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
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-yellow-800">Security Review (Development)</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Authentication, Authorization, and Input Validation have been conceptually applied via local contexts. In a production environment, sensitive operations and secrets must NEVER be exposed to the browser.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-navy mb-2">Simulate Login (Test Roles)</h4>
            <p className="text-sm text-text-muted mb-4">Switch the current active user to test role-based access control.</p>
            <div className="space-y-2 max-w-sm">
              {mockUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg">
                  <div>
                    <div className="font-medium text-navy">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-text-muted">{user.roles.join(", ")}</div>
                  </div>
                  <Button 
                    size="sm" 
                    variant={currentUser?.id === user.id ? "default" : "outline"}
                    onClick={() => login(user.email)}
                    disabled={currentUser?.id === user.id}
                  >
                    {currentUser?.id === user.id ? 'Active' : 'Login'}
                  </Button>
                </div>
              ))}
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
           <div className="space-y-4">
             {["SUPER_ADMIN", "STORE_MANAGER", "FINANCE_MANAGER", "DELIVERY_MANAGER"].map(role => (
               <div key={role} className="p-4 border border-neutral-200 rounded-lg">
                 <h4 className="font-bold text-navy">{role}</h4>
                 <div className="flex gap-2 mt-2">
                   <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">VIEW</span>
                   {role !== "DELIVERY_MANAGER" && <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">EDIT</span>}
                   {role === "SUPER_ADMIN" && <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded">DELETE</span>}
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
