import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/Card';
import { Order } from '@/src/types';
import { useShop } from '@/src/contexts/ShopContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { auth } from '@/src/lib/firebase';
import { ADMIN_ROUTE_ROLES } from '@/src/lib/rbac';
import { Package, ShoppingBag, Users, Truck, ArrowRight, PlusCircle, ArrowUpRight, Box, Megaphone, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function Dashboard() {
  const navigate = useNavigate();
  const { products } = useShop();
  const { currentUser, hasRole } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const canViewOrders = hasRole(ADMIN_ROUTE_ROLES.sales);

  const loadOrders = useCallback(async () => {
    if (!canViewOrders || !auth.currentUser) {
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `Failed to load orders (${res.status})`);
      }
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setOrdersError((err as Error)?.message || 'Unable to load dashboard orders.');
    } finally {
      setLoadingOrders(false);
    }
  }, [canViewOrders]);

  useEffect(() => {
    if (currentUser) {
      loadOrders();
    }
  }, [currentUser, loadOrders]);

  const productsCount = products.filter(p => p.status !== 'ARCHIVED').length;

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  
  // Calculate unique customers by email
  const uniqueCustomers = new Set(orders.map(o => o.customerEmail).filter(Boolean)).size;

  const pendingDeliveries = orders.filter(o => 
    ['NEW', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'].includes(o.status || '')
  ).length;

  const recentOrders = [...orders].sort((a, b) => 
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  ).slice(0, 6);

  const getStatusBadgeClass = (status?: string) => {
    switch(status) {
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'DISPATCHED':
      case 'OUT_FOR_DELIVERY': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'READY_FOR_DELIVERY': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CANCELLED':
      case 'PAYMENT_FAILED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="bg-gradient-to-r from-navy to-navy-dark text-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-dpc-gold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Operations Overview
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold">Diaspora Parcel Concierge</h2>
          <p className="text-gray-300 text-sm mt-1 max-w-xl">
            Live monitoring for cross-border diaspora gift deliveries across Nairobi, Mombasa, Kisumu, Nakuru, and all 47 counties.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Link to="/admin/sales">
            <Button className="bg-dpc-yellow text-navy hover:bg-dpc-yellow-hover font-bold shadow-xs">
              <ShoppingBag className="w-4 h-4 mr-2" /> Fulfill Orders
            </Button>
          </Link>
          <Link to="/admin/catalog">
            <Button variant="outline" className="text-white border-navy-light hover:bg-navy-light/40">
              <PlusCircle className="w-4 h-4 mr-2" /> Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-muted flex items-center justify-between">
              Total Revenue
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><ShoppingBag className="w-4 h-4" /></span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-text-muted mt-1">From {orders.length} diaspora orders</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-muted flex items-center justify-between">
              Active Catalog
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Package className="w-4 h-4" /></span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{productsCount}</div>
            <p className="text-xs text-text-muted mt-1">Products in active catalog</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-muted flex items-center justify-between">
              Unique Customers
              <span className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Users className="w-4 h-4" /></span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{uniqueCustomers}</div>
            <p className="text-xs text-text-muted mt-1">UK, USA, Canada & Diaspora</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-muted flex items-center justify-between">
              Active Deliveries
              <span className="p-2 bg-orange-50 text-orange-600 rounded-xl"><Truck className="w-4 h-4" /></span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{pendingDeliveries}</div>
            <p className="text-xs text-text-muted mt-1">In processing & transit</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link to="/admin/inventory" className="p-4 bg-white rounded-xl border border-neutral-200 hover:border-dpc-blue hover:shadow-sm transition-all flex items-center gap-3 group">
          <div className="p-2.5 bg-neutral-100 text-navy rounded-lg group-hover:bg-blue-50 group-hover:text-dpc-blue">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-navy">Inventory</div>
            <div className="text-xs text-text-muted">Stock movements</div>
          </div>
        </Link>
        <Link to="/admin/logistics" className="p-4 bg-white rounded-xl border border-neutral-200 hover:border-dpc-blue hover:shadow-sm transition-all flex items-center gap-3 group">
          <div className="p-2.5 bg-neutral-100 text-navy rounded-lg group-hover:bg-blue-50 group-hover:text-dpc-blue">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-navy">Logistics</div>
            <div className="text-xs text-text-muted">Zones & Drivers</div>
          </div>
        </Link>
        <Link to="/admin/marketing" className="p-4 bg-white rounded-xl border border-neutral-200 hover:border-dpc-blue hover:shadow-sm transition-all flex items-center gap-3 group">
          <div className="p-2.5 bg-neutral-100 text-navy rounded-lg group-hover:bg-blue-50 group-hover:text-dpc-blue">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-navy">Coupons</div>
            <div className="text-xs text-text-muted">Promotions</div>
          </div>
        </Link>
        <Link to="/admin/analytics" className="p-4 bg-white rounded-xl border border-neutral-200 hover:border-dpc-blue hover:shadow-sm transition-all flex items-center gap-3 group">
          <div className="p-2.5 bg-neutral-100 text-navy rounded-lg group-hover:bg-blue-50 group-hover:text-dpc-blue">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-navy">Analytics</div>
            <div className="text-xs text-text-muted">Diaspora metrics</div>
          </div>
        </Link>
      </div>

      {ordersError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{ordersError}</span>
        </div>
      )}

      {/* Recent Orders Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Diaspora Orders</CardTitle>
            <p className="text-xs text-text-muted mt-0.5">Click any order row to view details or manage status in Sales</p>
          </div>
          <div className="flex items-center gap-3">
            {canViewOrders && (
              <Button variant="outline" size="sm" onClick={loadOrders} disabled={loadingOrders} className="border-neutral-300">
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingOrders ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            )}
            <Link to="/admin/sales" className="text-xs font-bold text-dpc-blue hover:underline flex items-center gap-1">
              View All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-navy font-semibold border-y border-neutral-200">
                <tr>
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Sender (Diaspora)</th>
                  <th className="px-6 py-3">Recipient in Kenya</th>
                  <th className="px-6 py-3">City</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loadingOrders ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                      Loading live diaspora orders...
                    </td>
                  </tr>
                ) : !canViewOrders ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                      Order list requires Sales &amp; Order Management permissions.
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map(order => (
                    <tr 
                      key={order.id} 
                      onClick={() => navigate(`/admin/sales?order=${order.id}`)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-dpc-blue group-hover:underline">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-navy">{order.customerName}</div>
                        <div className="text-xs text-text-muted">{order.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-navy">{order.recipientName}</div>
                        <div className="text-xs text-text-muted">{order.recipientPhone}</div>
                      </td>
                      <td className="px-6 py-4 text-text-muted font-medium">
                        {order.deliveryCity || 'Nairobi'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(order.status)}`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-navy">
                        ${order.total?.toFixed(2)}
                      </td>
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

