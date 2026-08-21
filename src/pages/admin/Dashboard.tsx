import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/Card';
import { Order } from '@/src/types';
import { mockProducts } from '@/src/lib/mockData';
import { Package, ShoppingBag, Users, Truck } from 'lucide-react';

export default function Dashboard() {
  const [orders, setOrders] = useState<Partial<Order>[]>([]);
  
  useEffect(() => {
    const savedOrders = localStorage.getItem('dpc_orders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, []);

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  
  // Calculate unique customers by email
  const uniqueCustomers = new Set(orders.map(o => o.customerEmail).filter(Boolean)).size;

  const pendingDeliveries = orders.filter(o => 
    ['NEW', 'CONFIRMED', 'PROCESSING', 'DISPATCHED'].includes(o.status || '')
  ).length;

  const recentOrders = [...orders].sort((a, b) => 
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-muted flex items-center justify-between">
              Total Revenue
              <span className="p-2 bg-green-50 text-green-600 rounded-md"><ShoppingBag className="w-4 h-4" /></span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-text-muted mt-1">From {orders.length} total orders</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-muted flex items-center justify-between">
              Active Catalog
              <span className="p-2 bg-blue-50 text-blue-600 rounded-md"><Package className="w-4 h-4" /></span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{mockProducts.length}</div>
            <p className="text-xs text-text-muted mt-1">Products in stock</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-muted flex items-center justify-between">
              Unique Customers
              <span className="p-2 bg-purple-50 text-purple-600 rounded-md"><Users className="w-4 h-4" /></span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{uniqueCustomers}</div>
            <p className="text-xs text-text-muted mt-1">Customers with placed orders</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-muted flex items-center justify-between">
              Pending Fulfillment
              <span className="p-2 bg-orange-50 text-orange-600 rounded-md"><Truck className="w-4 h-4" /></span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{pendingDeliveries}</div>
            <p className="text-xs text-text-muted mt-1">Orders requiring attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-navy font-semibold border-y border-neutral-200">
                <tr>
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-text-muted">
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 font-medium text-navy">#{order.id}</td>
                      <td className="px-6 py-4">{order.customerName}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded text-xs font-bold bg-neutral-100 text-neutral-800">
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-navy">${order.total?.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
