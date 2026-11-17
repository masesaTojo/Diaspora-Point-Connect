import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Driver, Order } from '@/src/types';
import { auth, db } from '@/src/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { buildFirestoreErrorInfo, OperationType } from '@/src/lib/firestoreErrors';
import { Globe, Truck, DollarSign, Package, TrendingUp, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/src/components/ui/Button';

export default function Analytics() {
  const { hasRole, currentUser } = useAuth();
  const [timeframe, setTimeframe] = useState('30days');
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const isAllowed = hasRole(['SUPER_ADMIN', 'STORE_MANAGER', 'FINANCE_MANAGER']);

  const loadOrders = useCallback(async () => {
    if (!isAllowed || !auth.currentUser) {
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
        throw new Error(data.message || `Failed to load analytics orders (${res.status})`);
      }
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setOrdersError((err as Error)?.message || 'Unable to load analytics data.');
    } finally {
      setLoadingOrders(false);
    }
  }, [isAllowed]);

  useEffect(() => {
    if (currentUser && isAllowed) {
      loadOrders();
    }
  }, [currentUser, isAllowed, loadOrders]);

  useEffect(() => {
    if (!currentUser || !isAllowed) return;
    const unsub = onSnapshot(
      collection(db, 'drivers'),
      (snap) => {
        setDrivers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Driver)));
      },
      (err) => {
        console.error('Drivers listener error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.LIST, 'drivers')));
      }
    );
    return () => unsub();
  }, [currentUser, isAllowed]);

  const filteredOrders = useMemo(() => {
    if (timeframe === 'custom') return orders;
    const now = Date.now();
    let cutoffMs = 0;
    if (timeframe === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      cutoffMs = start.getTime();
    } else if (timeframe === '7days') {
      cutoffMs = now - 7 * 86400000;
    } else if (timeframe === '30days') {
      cutoffMs = now - 30 * 86400000;
    } else if (timeframe === '12months') {
      cutoffMs = now - 365 * 86400000;
    }
    return orders.filter((order) => {
      if (!order.createdAt) return false;
      return new Date(order.createdAt).getTime() >= cutoffMs;
    });
  }, [orders, timeframe]);

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalDeliveryRevenue = filteredOrders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);
  const completedOrders = filteredOrders.filter(o => o.status === 'DELIVERED').length;
  const paidOrders = filteredOrders.filter(o => o.paymentStatus === 'PAID').length;
  const proofConfirmed = filteredOrders.filter(o => o.status === 'DELIVERED' && Boolean(o.proofOfDelivery)).length;
  const inTransitCount = filteredOrders.filter(o => ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(o.status || '')).length;
  const activeDriversCount = drivers.filter(d => d.status === 'AVAILABLE' || d.status === 'ON_DELIVERY').length;

  const deliveryDestinations = filteredOrders.reduce((acc, order) => {
    const city = order.deliveryCity || (typeof order.deliveryAddress === 'string' ? order.deliveryAddress.split(',')[0] : 'Nairobi') || 'Nairobi';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!isAllowed) {
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
          <h2 className="text-2xl font-display font-bold text-navy">Analytics & Diaspora Reports</h2>
          <p className="text-sm text-text-muted">Live metrics calculated directly from Firestore orders and fleet status.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            className="p-2 border border-neutral-300 rounded-md text-sm bg-white"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="12months">Last 12 Months</option>
            <option value="custom">All Time</option>
          </select>
          <Button variant="outline" size="sm" onClick={loadOrders} disabled={loadingOrders} className="border-neutral-300">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingOrders ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {ordersError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{ordersError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-text-muted text-xs font-semibold uppercase tracking-wider">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Gross Diaspora GMV
          </div>
          <div className="text-3xl font-bold text-navy">${totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-emerald-600 font-medium mt-2">{paidOrders} paid orders reconciled in USD</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-text-muted text-xs font-semibold uppercase tracking-wider">
            <Package className="w-4 h-4 text-dpc-blue" /> Total Placed Orders
          </div>
          <div className="text-3xl font-bold text-navy">{totalOrders}</div>
          <p className="text-xs text-text-muted mt-2">{completedOrders} fulfilled & delivered</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-text-muted text-xs font-semibold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-indigo-600" /> Average Order Value
          </div>
          <div className="text-3xl font-bold text-navy">${averageOrderValue.toFixed(2)}</div>
          <p className="text-xs text-text-muted mt-2">Gifting basket avg ticket</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-text-muted text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-green-600" /> Delivery Completion Rate
          </div>
          <div className="text-3xl font-bold text-navy">
            {totalOrders > 0 ? `${Math.round((completedOrders / totalOrders) * 100)}%` : '0%'}
          </div>
          <p className="text-xs text-green-600 font-medium mt-2">Nairobi & regional corridors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <h3 className="font-bold text-navy mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-dpc-gold" /> Diaspora Delivery Destinations</h3>
          <ul className="space-y-3">
            {Object.entries(deliveryDestinations).map(([city, count]) => (
              <li key={city} className="flex justify-between items-center text-sm border-b border-neutral-50 pb-2">
                <span className="font-medium text-navy">{city}</span>
                <span className="font-bold text-dpc-blue">{Number(count)} Orders ({totalOrders > 0 ? (Number(count) / totalOrders * 100).toFixed(1) : 0}%)</span>
              </li>
            ))}
            {Object.keys(deliveryDestinations).length === 0 && (
              <li className="text-sm text-text-muted">No delivery destination data logged for this timeframe.</li>
            )}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <h3 className="font-bold text-navy mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-blue-500" /> Kenya Logistics Performance</h3>
          <ul className="space-y-3">
            <li className="flex justify-between items-center text-sm border-b border-neutral-100 pb-2">
              <span className="text-text-muted">Total Courier & Delivery Fees</span>
              <span className="font-bold text-navy">${totalDeliveryRevenue.toFixed(2)}</span>
            </li>
            <li className="flex justify-between items-center text-sm border-b border-neutral-100 pb-2">
              <span className="text-text-muted">Orders Currently In Transit</span>
              <span className="font-bold text-navy">{inTransitCount}</span>
            </li>
            <li className="flex justify-between items-center text-sm border-b border-neutral-100 pb-2">
              <span className="text-text-muted">Live Active Drivers</span>
              <span className="font-bold text-emerald-600">{activeDriversCount} on duty ({drivers.length} total)</span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Proof of Delivery Verification</span>
              <span className="font-bold text-navy">
                {completedOrders > 0
                  ? `${Math.round((proofConfirmed / completedOrders) * 100)}% (${proofConfirmed}/${completedOrders} delivered)`
                  : 'No delivered orders yet'}
              </span>
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}
