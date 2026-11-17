import React, { useState, useEffect, useCallback } from 'react';
import { Search, Mail, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { Order } from '@/src/types';
import { auth } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/src/components/ui/Button';

interface CustomerSummary {
  email: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

export default function Customers() {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    if (!auth.currentUser) {
      setLoadingCustomers(false);
      return;
    }
    setLoadingCustomers(true);
    setErrorMsg(null);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `Failed to load customers (${res.status})`);
      }
      const orders: Order[] = Array.isArray(data.orders) ? data.orders : [];
      const customerMap: Record<string, CustomerSummary> = {};

      orders.forEach(order => {
        if (!order.customerEmail) return;
        const email = order.customerEmail.toLowerCase();

        if (!customerMap[email]) {
          customerMap[email] = {
            email,
            name: order.customerName || 'Unknown',
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: order.createdAt || ''
          };
        }

        customerMap[email].totalOrders += 1;
        customerMap[email].totalSpent += (order.total || 0);

        if (order.createdAt && (!customerMap[email].lastOrderDate || new Date(order.createdAt) > new Date(customerMap[email].lastOrderDate))) {
          customerMap[email].lastOrderDate = order.createdAt;
        }
      });

      setCustomers(Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent));
    } catch (err) {
      setErrorMsg((err as Error)?.message || 'Unable to load customer order history.');
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadCustomers();
    }
  }, [currentUser, loadCustomers]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Customers</h2>
          <p className="text-sm text-text-muted">Manage your customer base and view live purchasing history.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadCustomers} disabled={loadingCustomers} className="border-neutral-300">
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingCustomers ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input 
            type="text"
            placeholder="Search customers by name or email..."
            className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-navy font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                <th className="px-6 py-4 whitespace-nowrap">Total Orders</th>
                <th className="px-6 py-4 whitespace-nowrap">Total Spent</th>
                <th className="px-6 py-4 whitespace-nowrap">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loadingCustomers ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                    Loading customer records...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.email} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-navy">{customer.name}</div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                        <Mail className="h-3 w-3" /> {customer.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-navy">{customer.totalOrders}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-dpc-blue">${customer.totalSpent.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'Unknown'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
