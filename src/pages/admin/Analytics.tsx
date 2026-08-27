import React, { useState } from 'react';
import { mockOrders, mockProducts, mockInventoryRecords } from '@/src/lib/mockData';
import { BarChart, Users, Globe, Truck, DollarSign, Package, TrendingUp } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';

export default function Analytics() {
  const { hasRole } = useAuth();
  const [timeframe, setTimeframe] = useState('30days');

  // Simple analytics logic based on mock data
  const totalRevenue = mockOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = mockOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalDeliveryRevenue = mockOrders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);

  // Diaspora logic
  // Just count customer origins vs delivery cities.
  const deliveryDestinations = mockOrders.reduce((acc, order) => {
    const city = order.deliveryAddress?.city || 'Unknown';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!hasRole(["SUPER_ADMIN", "STORE_MANAGER", "FINANCE_MANAGER"])) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Access Denied. You do not have permission to view Analytics.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Analytics & Reports</h2>
          <p className="text-sm text-text-muted">Overview of store performance and demographics.</p>
        </div>
        
        <select 
          className="p-2 border border-neutral-300 rounded-md text-sm"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
        >
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="12months">Last 12 Months</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-text-muted text-sm font-semibold">
            <DollarSign className="w-4 h-4" /> Total Revenue
          </div>
          <div className="text-3xl font-bold text-navy">${totalRevenue.toFixed(2)}</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-text-muted text-sm font-semibold">
            <Package className="w-4 h-4" /> Total Orders
          </div>
          <div className="text-3xl font-bold text-navy">{totalOrders}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-text-muted text-sm font-semibold">
            <TrendingUp className="w-4 h-4" /> Average Order Value
          </div>
          <div className="text-3xl font-bold text-navy">${averageOrderValue.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <h3 className="font-bold text-navy mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-dpc-gold" /> Diaspora Delivery Zones</h3>
          <ul className="space-y-3">
            {Object.entries(deliveryDestinations).map(([city, count]) => (
              <li key={city} className="flex justify-between items-center text-sm">
                <span className="font-medium text-text-muted">{city}</span>
                <span className="font-bold text-navy">{Number(count)} Orders ({(Number(count) / totalOrders * 100).toFixed(1)}%)</span>
              </li>
            ))}
            {Object.keys(deliveryDestinations).length === 0 && (
              <li className="text-sm text-text-muted">No delivery data available.</li>
            )}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <h3 className="font-bold text-navy mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-blue-500" /> Operations</h3>
          <ul className="space-y-3">
            <li className="flex justify-between items-center text-sm border-b border-neutral-100 pb-2">
              <span className="text-text-muted">Delivery Revenue</span>
              <span className="font-bold text-navy">${totalDeliveryRevenue.toFixed(2)}</span>
            </li>
            <li className="flex justify-between items-center text-sm border-b border-neutral-100 pb-2">
              <span className="text-text-muted">Avg. Processing Time</span>
              <span className="font-bold text-navy">1.2 Days</span>
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}
