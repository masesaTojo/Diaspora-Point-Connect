import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Driver, Order, OrderStatus } from '@/src/types';
import { Search, Eye, Truck, Check, X, Package, Download, MessageSquare, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { auth, db } from '@/src/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { buildFirestoreErrorInfo, OperationType } from '@/src/lib/firestoreErrors';
import { downloadCsvFile } from '@/src/lib/csv';
import { useAuth } from '@/src/contexts/AuthContext';

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  PAYMENT_PENDING: 'bg-amber-100 text-amber-800',
  PAYMENT_CONFIRMED: 'bg-emerald-100 text-emerald-800',
  CONFIRMED: 'bg-indigo-100 text-indigo-800',
  PROCESSING: 'bg-yellow-100 text-yellow-800',
  READY_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
  DISPATCHED: 'bg-orange-200 text-orange-900',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  PAYMENT_FAILED: 'bg-red-100 text-red-800',
  STOCK_ISSUE: 'bg-rose-100 text-rose-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

const ALL_STATUSES: OrderStatus[] = [
  "NEW", "PAYMENT_PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_DELIVERY",
  "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED", "PAYMENT_FAILED", "STOCK_ISSUE", "CANCELLED", "REFUNDED"
];

export default function Orders() {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [deliveryProofInput, setDeliveryProofInput] = useState('');
  const [expectedTimeInput, setExpectedTimeInput] = useState('');

  useEffect(() => {
    if (!currentUser) return;
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
  }, [currentUser]);

  const loadOrders = useCallback(async () => {
    if (!auth.currentUser) {
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
      const loadedOrders: Order[] = Array.isArray(data.orders) ? data.orders : [];
      setOrders(loadedOrders);

      const orderIdParam = searchParams.get('order');
      if (orderIdParam) {
        const matched = loadedOrders.find(o => o.id === orderIdParam);
        if (matched) setSelectedOrder(matched);
      } else if (loadedOrders.length > 0) {
        setSelectedOrder(prev =>
          prev ? loadedOrders.find(o => o.id === prev.id) || loadedOrders[0] : loadedOrders[0]
        );
      } else {
        setSelectedOrder(null);
      }
    } catch (err) {
      setOrdersError((err as Error)?.message || 'Unable to load orders from server.');
    } finally {
      setLoadingOrders(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (currentUser) {
      loadOrders();
    }
  }, [currentUser, loadOrders]);

  useEffect(() => {
    if (selectedOrder) {
      setDeliveryProofInput(selectedOrder.proofOfDelivery || '');
      setExpectedTimeInput(selectedOrder.expectedDeliveryTime || '');
    }
  }, [selectedOrder?.id]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus, extraData: Partial<Order> = {}) => {
    if (!auth.currentUser) return;
    setUpdatingOrderId(orderId);
    setOrdersError(null);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          status: newStatus,
          ...extraData,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.order) {
        throw new Error(data.message || `Failed to update order (${res.status})`);
      }
      const updatedOrder: Order = data.order;
      setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
    } catch (err) {
      setOrdersError((err as Error)?.message || 'Failed to update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Recipient Name',
      'Recipient Phone',
      'City',
      'Address',
      'Scheduled Date',
      'Delivery ETA',
      'Driver',
      'Proof of Delivery',
      'Status',
      'Payment Status',
      'Currency',
      'Total (USD)',
    ];
    const rows = filteredOrders.map((o) => [
      o.id,
      o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '',
      o.customerName || '',
      o.customerEmail || '',
      o.customerPhone || '',
      o.recipientName || '',
      o.recipientPhone || '',
      o.deliveryCity || '',
      o.deliveryAddress || '',
      o.deliveryDate || '',
      o.expectedDeliveryTime || '',
      o.driverName || '',
      o.proofOfDelivery || '',
      o.status || '',
      o.paymentStatus || '',
      o.currency || 'USD',
      o.total?.toFixed(2) || '0.00',
    ]);

    downloadCsvFile(`dpc_orders_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.deliveryCity?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Sales & Orders</h2>
          <p className="text-sm text-text-muted">Manage all cross-border customer orders and track fulfillment in Kenya.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input 
              type="text"
              placeholder="Search ID, customer, city..."
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm bg-white focus:ring-dpc-blue focus:border-dpc-blue"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses ({orders.length})</option>
            {ALL_STATUSES.map(status => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')} ({orders.filter(o => o.status === status).length})
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={loadOrders} disabled={loadingOrders} className="border-neutral-300 hover:bg-neutral-50">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingOrders ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="border-neutral-300 hover:bg-neutral-50">
            <Download className="w-4 h-4 mr-1.5" /> CSV
          </Button>
        </div>
      </div>

      {ordersError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{ordersError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Order List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-navy font-semibold border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 whitespace-nowrap">Order ID</th>
                  <th className="px-6 py-3 whitespace-nowrap">Sender</th>
                  <th className="px-6 py-3 whitespace-nowrap">Recipient</th>
                  <th className="px-6 py-3 whitespace-nowrap">Status</th>
                  <th className="px-6 py-3 whitespace-nowrap text-right">Total</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                      No orders found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${selectedOrder?.id === order.id ? 'bg-blue-50/80 border-l-4 border-dpc-blue' : ''}`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-6 py-4 font-mono font-medium text-navy">#{order.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-navy">{order.customerName}</div>
                        <div className="text-xs text-text-muted">{order.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-navy">{order.recipientName}</div>
                        <div className="text-xs text-text-muted">{order.deliveryCity}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${STATUS_COLORS[order.status || 'NEW'] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-navy">
                        ${order.total?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Detail View */}
        <div className="lg:col-span-1">
          {selectedOrder ? (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 sticky top-24">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-navy">Order #{selectedOrder.id}</h3>
                  <p className="text-sm text-text-muted">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : ''}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[selectedOrder.status || 'NEW'] || 'bg-gray-100 text-gray-800'}`}>
                    {selectedOrder.status?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] font-semibold text-text-muted">
                    Payment: {selectedOrder.paymentStatus || 'PENDING'}
                    {selectedOrder.pesapalConfirmationCode ? ` (${selectedOrder.pesapalConfirmationCode})` : ''}
                  </span>
                </div>
              </div>

              {/* Status Manager */}
              <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <label className="block text-sm font-semibold text-navy mb-2">
                  Update Status &amp; Workflow {updatingOrderId === selectedOrder.id ? '(Saving...)' : ''}
                </label>
                <div className="flex gap-2 flex-wrap mb-4">
                  {selectedOrder.status === 'CONFIRMED' && (
                    <Button size="sm" onClick={() => handleStatusChange(selectedOrder.id!, 'PROCESSING')}>
                      Start Processing (Reserve Inventory)
                    </Button>
                  )}
                  {selectedOrder.status === 'PROCESSING' && (
                    <Button size="sm" onClick={() => handleStatusChange(selectedOrder.id!, 'READY_FOR_DELIVERY')} className="bg-orange-500 hover:bg-orange-600">
                      <Package className="h-4 w-4 mr-1" /> Ready for Delivery
                    </Button>
                  )}
                  {selectedOrder.status === 'READY_FOR_DELIVERY' && (
                    <div className="flex flex-col gap-2 w-full">
                      <label className="text-xs font-bold text-navy">Assign Driver for Dispatch:</label>
                      <div className="flex gap-2 items-center w-full">
                        <select 
                          className="text-sm p-2 border border-neutral-300 rounded flex-1 bg-white"
                          id="driver-select"
                          defaultValue={selectedOrder.driverId || ""}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusChange(selectedOrder.id!, 'DISPATCHED', { driverId: e.target.value });
                            }
                          }}
                        >
                          <option value="">Select a Driver...</option>
                          {drivers.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  {selectedOrder.status === 'DISPATCHED' && (
                    <div className="flex flex-col gap-2 w-full">
                      <input
                        type="text"
                        placeholder="Expected delivery ETA (e.g. Today 3:30 PM EAT)"
                        value={expectedTimeInput}
                        onChange={(e) => setExpectedTimeInput(e.target.value)}
                        className="text-xs p-2 border border-neutral-300 rounded bg-white"
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStatusChange(selectedOrder.id!, 'OUT_FOR_DELIVERY', {
                            expectedDeliveryTime: expectedTimeInput.trim() || undefined,
                          })
                        }
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Truck className="h-4 w-4 mr-1" /> Out For Delivery
                      </Button>
                    </div>
                  )}
                  {selectedOrder.status === 'OUT_FOR_DELIVERY' && (
                    <div className="flex flex-col gap-2 w-full">
                      <input
                        type="text"
                        placeholder="Proof note or photo URL (e.g. Received by Mary / https://...)"
                        value={deliveryProofInput}
                        onChange={(e) => setDeliveryProofInput(e.target.value)}
                        className="text-xs p-2 border border-neutral-300 rounded bg-white"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const proof =
                            deliveryProofInput.trim() ||
                            `Handed over to ${selectedOrder.recipientName || 'recipient'} (${new Date().toISOString().split('T')[0]})`;
                          handleStatusChange(selectedOrder.id!, 'DELIVERED', { proofOfDelivery: proof });
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" /> Mark Delivered (Save Proof)
                      </Button>
                    </div>
                  )}
                  {['NEW', 'CONFIRMED', 'PROCESSING'].includes(selectedOrder.status || '') && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(selectedOrder.id!, 'CANCELLED')} className="text-red-600 border-red-200 hover:bg-red-50 mt-2">
                      <X className="h-4 w-4 mr-1" /> Cancel Order
                    </Button>
                  )}
                </div>
                
                <div className="border-t border-neutral-200 pt-4 mt-2">
                   <label className="block text-xs text-text-muted mb-1">Manual Override</label>
                   <select 
                     className="w-full text-sm p-2 border border-neutral-300 rounded bg-white"
                     value={selectedOrder.status}
                     onChange={(e) => handleStatusChange(selectedOrder.id!, e.target.value as OrderStatus)}
                   >
                      {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                   </select>
                </div>
              </div>

              <div className="space-y-6">
                
                {/* Logistics Info Block */}
                {(selectedOrder.driverId || selectedOrder.expectedDeliveryTime || selectedOrder.proofOfDelivery) && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-1.5">
                    <h4 className="font-semibold text-dpc-blue mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Truck className="w-4 h-4" /> Logistics Details
                    </h4>
                    {selectedOrder.driverId && (
                      <p className="text-sm">
                        <span className="text-text-muted">Assigned Driver:</span>{' '}
                        <span className="font-medium text-navy">{drivers.find(d => d.id === selectedOrder.driverId)?.name || selectedOrder.driverId}</span>
                      </p>
                    )}
                    {selectedOrder.expectedDeliveryTime && (
                      <p className="text-xs text-navy">
                        <span className="text-text-muted">Expected ETA:</span> {selectedOrder.expectedDeliveryTime}
                      </p>
                    )}
                    {selectedOrder.proofOfDelivery && (
                      <div className="mt-2 text-xs text-emerald-800 bg-white/80 p-2 rounded border border-emerald-200">
                        <span className="font-semibold flex items-center gap-1.5 mb-0.5"><Check className="w-3.5 h-3.5 text-green-600" /> Proof of Delivery Verified</span>
                        <span className="break-all text-text-muted">{selectedOrder.proofOfDelivery}</span>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-navy mb-2 text-sm uppercase tracking-wider">Customer</h4>
                  <p className="text-sm font-medium">{selectedOrder.customerName}</p>
                  <p className="text-sm text-text-muted">{selectedOrder.customerEmail} • {selectedOrder.customerPhone || 'Diaspora'}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-navy mb-2 text-sm uppercase tracking-wider">Recipient & Delivery</h4>
                  <p className="text-sm font-medium">{selectedOrder.recipientName} ({selectedOrder.recipientPhone})</p>
                  <p className="text-sm text-text-muted mt-1">{selectedOrder.deliveryAddress}, {selectedOrder.deliveryCity}</p>
                  {selectedOrder.deliveryNotes && (
                    <p className="text-xs bg-amber-50 text-amber-800 p-2 rounded-md border border-amber-200 mt-2">
                      <strong>Delivery Instructions:</strong> {selectedOrder.deliveryNotes}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-navy mb-2 text-sm uppercase tracking-wider border-b border-neutral-100 pb-2">Order Items</h4>
                  <div className="space-y-3 mt-3">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100 text-sm">
                        <div className="flex justify-between">
                          <div className="flex-1 pr-4">
                            <span className="font-medium text-navy">{item.quantity}x {item.productName}</span>
                          </div>
                          <span className="font-bold text-navy whitespace-nowrap">${item.totalPrice?.toFixed(2)}</span>
                        </div>
                        {item.giftMessage && (
                          <div className="mt-2 text-xs text-text-muted bg-white p-2 rounded border border-neutral-200 flex items-start gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-dpc-blue shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-navy">Gift Card Message:</span> "{item.giftMessage}"
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-text-muted">
                    <span>Subtotal</span>
                    <span>${selectedOrder.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Delivery</span>
                    <span>${selectedOrder.deliveryFee?.toFixed(2)}</span>
                  </div>
                  {selectedOrder.serviceFee && (
                    <div className="flex justify-between text-text-muted">
                      <span>Service Fee</span>
                      <span>${selectedOrder.serviceFee?.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.discount && selectedOrder.discount > 0 ? (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>-${selectedOrder.discount?.toFixed(2)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between font-bold text-navy text-lg pt-2 border-t border-neutral-100">
                    <span>Total</span>
                    <span>${selectedOrder.total?.toFixed(2)}</span>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-12 text-center text-text-muted flex flex-col items-center justify-center h-full min-h-[400px]">
              <Search className="h-12 w-12 text-neutral-300 mb-4" />
              <p>Select an order from the list to view details and manage fulfillment.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
