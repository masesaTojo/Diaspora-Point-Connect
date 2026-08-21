import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, Driver } from '@/src/types';
import { Search, Filter, MoreVertical, Eye, Truck, Check, X, MapPin, Package } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { mockDrivers } from '@/src/lib/mockData';

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-indigo-100 text-indigo-800',
  PROCESSING: 'bg-yellow-100 text-yellow-800',
  READY_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
  DISPATCHED: 'bg-orange-200 text-orange-900',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

const ALL_STATUSES: OrderStatus[] = [
  "NEW", "CONFIRMED", "PROCESSING", "READY_FOR_DELIVERY", 
  "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"
];

export default function Orders() {
  const [orders, setOrders] = useState<Partial<Order>[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Partial<Order> | null>(null);

  // Load orders from localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem('dpc_orders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, []);

  const saveOrders = (newOrders: Partial<Order>[]) => {
    setOrders(newOrders);
    localStorage.setItem('dpc_orders', JSON.stringify(newOrders));
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus, extraData: Partial<Order> = {}) => {
    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString(), ...extraData } : o
    );
    saveOrders(updatedOrders);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(updatedOrders.find(o => o.id === orderId) || null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.recipientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Sales & Orders</h2>
          <p className="text-sm text-text-muted">Manage all customer orders and fulfillments.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input 
              type="text"
              placeholder="Search orders..."
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-neutral-300 rounded-md text-sm bg-white focus:ring-dpc-blue focus:border-dpc-blue"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            {ALL_STATUSES.map(status => (
              <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Order List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-navy font-semibold border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 whitespace-nowrap">Order ID</th>
                  <th className="px-6 py-3 whitespace-nowrap">Customer</th>
                  <th className="px-6 py-3 whitespace-nowrap">Date</th>
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
                      className={`hover:bg-neutral-50 cursor-pointer transition-colors ${selectedOrder?.id === order.id ? 'bg-blue-50/50' : ''}`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-6 py-4 font-medium text-navy">#{order.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-navy">{order.customerName}</div>
                        <div className="text-xs text-text-muted">{order.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-text-muted whitespace-nowrap">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
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
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-navy">Order #{selectedOrder.id}</h3>
                  <p className="text-sm text-text-muted">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : ''}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[selectedOrder.status || 'NEW'] || 'bg-gray-100 text-gray-800'}`}>
                  {selectedOrder.status?.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Status Manager */}
              <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <label className="block text-sm font-semibold text-navy mb-2">Update Status & Workflow</label>
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
                    <div className="flex gap-2 items-center w-full">
                      <select 
                        className="text-sm p-2 border border-neutral-300 rounded flex-1"
                        id="driver-select"
                        defaultValue={selectedOrder.driverId || ""}
                        onChange={(e) => handleStatusChange(selectedOrder.id!, 'DISPATCHED', { driverId: e.target.value })}
                      >
                        <option value="">Assign Driver...</option>
                        {mockDrivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {selectedOrder.status === 'DISPATCHED' && (
                    <Button size="sm" onClick={() => handleStatusChange(selectedOrder.id!, 'OUT_FOR_DELIVERY')} className="bg-purple-600 hover:bg-purple-700">
                      <Truck className="h-4 w-4 mr-1" /> Out For Delivery
                    </Button>
                  )}
                  {selectedOrder.status === 'OUT_FOR_DELIVERY' && (
                    <Button size="sm" onClick={() => handleStatusChange(selectedOrder.id!, 'DELIVERED', { proofOfDelivery: 'https://example.com/signature.png' })} className="bg-green-600 hover:bg-green-700">
                      <Check className="h-4 w-4 mr-1" /> Mark Delivered (Capture Proof)
                    </Button>
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
                {selectedOrder.driverId && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="font-semibold text-dpc-blue mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Truck className="w-4 h-4" /> Logistics Details
                    </h4>
                    <p className="text-sm">
                      <span className="text-text-muted">Assigned Driver:</span>{' '}
                      <span className="font-medium text-navy">{mockDrivers.find(d => d.id === selectedOrder.driverId)?.name || 'Unknown'}</span>
                    </p>
                    {selectedOrder.proofOfDelivery && (
                      <div className="mt-2 text-sm">
                        <span className="text-text-muted flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Proof of Delivery Captured</span>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-navy mb-2 text-sm uppercase tracking-wider">Customer</h4>
                  <p className="text-sm font-medium">{selectedOrder.customerName}</p>
                  <p className="text-sm text-text-muted">{selectedOrder.customerEmail}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-navy mb-2 text-sm uppercase tracking-wider">Recipient & Delivery</h4>
                  <p className="text-sm font-medium">{selectedOrder.recipientName} ({selectedOrder.recipientPhone})</p>
                  <p className="text-sm text-text-muted mt-1">{selectedOrder.deliveryAddress}, {selectedOrder.deliveryCity}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-navy mb-2 text-sm uppercase tracking-wider border-b border-neutral-100 pb-2">Order Items</h4>
                  <div className="space-y-3 mt-3">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div className="flex-1 pr-4">
                          <span className="font-medium text-navy">{item.quantity}x {item.productName}</span>
                        </div>
                        <span className="font-medium text-navy whitespace-nowrap">${item.totalPrice?.toFixed(2)}</span>
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
                  <div className="flex justify-between font-bold text-navy text-lg pt-2">
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
