import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, Calendar } from 'lucide-react';
import { Order } from '@/src/types';

interface CustomerSummary {
  email: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);

  useEffect(() => {
    // Generate customers from local storage orders
    const savedOrders = localStorage.getItem('dpc_orders');
    if (savedOrders) {
      const orders: Partial<Order>[] = JSON.parse(savedOrders);
      
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
    }
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Customers</h2>
          <p className="text-sm text-text-muted">Manage your customer base and view purchasing history.</p>
        </div>
      </div>

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
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                    No customers found. Place an order to see customers here.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50 transition-colors">
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
