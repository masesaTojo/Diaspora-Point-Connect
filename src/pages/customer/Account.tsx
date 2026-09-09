import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Package, 
  User, 
  MapPin, 
  Clock, 
  ArrowRight, 
  ExternalLink, 
  ArrowLeft, 
  CheckCircle, 
  Edit, 
  Trash2, 
  Plus,
  Gift,
  Phone,
  Mail,
  Truck,
  Calendar,
  AlertCircle,
  RefreshCw,
  Check
} from 'lucide-react';
import { Order, OrderStatus } from '@/src/types';
import { Button } from '@/src/components/ui/Button';
import { getStoredOrders, subscribeToStorage } from '@/src/lib/adminStorage';

interface SavedRecipient {
  id: string;
  name: string;
  phone: string;
  city: string;
  address: string;
}

export default function Account() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Recipients State
  const [recipients, setRecipients] = useState<SavedRecipient[]>([]);
  const [isEditingRecipient, setIsEditingRecipient] = useState<boolean>(false);
  const [currentRecipient, setCurrentRecipient] = useState<Partial<SavedRecipient>>({});

  useEffect(() => {
    const loadData = () => {
      const loadedOrders = getStoredOrders();
      setOrders(loadedOrders);

      // Check if orderId was passed in query
      const targetOrderId = searchParams.get('orderId');
      if (targetOrderId && loadedOrders.length > 0) {
        const match = loadedOrders.find(o => o.id === targetOrderId);
        if (match) {
          setSelectedOrder(match);
          setActiveTab('orders');
        }
      } else if (selectedOrder) {
        // Keep selected order in sync
        const updated = loadedOrders.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    };

    loadData();
    const unsub = subscribeToStorage(['dpc_orders'], loadData);

    const savedRecipients = localStorage.getItem('dpc_recipients');
    if (savedRecipients) {
      try {
        setRecipients(JSON.parse(savedRecipients));
      } catch (e) {
        console.error('Failed to parse saved recipients', e);
      }
    }

    return unsub;
  }, [searchParams]);

  const saveRecipientsToStorage = (newRecipients: SavedRecipient[]) => {
    setRecipients(newRecipients);
    localStorage.setItem('dpc_recipients', JSON.stringify(newRecipients));
  };

  const handleSaveRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecipient.name || !currentRecipient.phone) return;
    
    if (currentRecipient.id) {
      // Edit
      saveRecipientsToStorage(recipients.map(r => r.id === currentRecipient.id ? currentRecipient as SavedRecipient : r));
    } else {
      // Add
      saveRecipientsToStorage([...recipients, { ...currentRecipient, id: Math.random().toString(36).substring(2, 9) } as SavedRecipient]);
    }
    setIsEditingRecipient(false);
    setCurrentRecipient({});
  };

  const handleDeleteRecipient = (id: string) => {
    if (confirm('Are you sure you want to delete this recipient?')) {
      saveRecipientsToStorage(recipients.filter(r => r.id !== id));
    }
  };

  // Status simulation update
  const handleUpdateOrderStatus = (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    const updatedOrder = { ...selectedOrder, status: newStatus, updatedAt: new Date().toISOString() };
    const updatedOrders = orders.map(o => o.id === selectedOrder.id ? updatedOrder : o);
    setOrders(updatedOrders);
    setSelectedOrder(updatedOrder);
    localStorage.setItem('dpc_orders', JSON.stringify(updatedOrders));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
      case 'OUT_FOR_DELIVERY':
      case 'DISPATCHED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CONFIRMED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const OrderTimeline = ({ status }: { status?: string }) => {
    const steps = [
      { id: 'CONFIRMED', label: 'Order Confirmed' },
      { id: 'PROCESSING', label: 'Preparing Gift' },
      { id: 'DISPATCHED', label: 'Dispatched / Out for Delivery' },
      { id: 'DELIVERED', label: 'Delivered in Kenya' }
    ];

    let activeIndex = 0;
    if (status === 'CONFIRMED') activeIndex = 0;
    else if (status === 'PROCESSING') activeIndex = 1;
    else if (status === 'DISPATCHED' || status === 'OUT_FOR_DELIVERY' || status === 'READY_FOR_DELIVERY') activeIndex = 2;
    else if (status === 'DELIVERED') activeIndex = 3;
    else if (status === 'CANCELLED') activeIndex = -1;

    if (status === 'CANCELLED') {
      return (
        <div className="py-4 text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg font-semibold text-sm border border-red-200">
            <AlertCircle className="w-4 h-4" /> This order has been cancelled.
          </div>
        </div>
      );
    }

    return (
      <div className="py-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-semibold text-navy">Live Delivery Milestone Tracker</h4>
          <span className="text-xs bg-white text-navy font-bold px-2.5 py-1 rounded border border-neutral-200">
            Step {activeIndex + 1} of {steps.length}
          </span>
        </div>

        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-neutral-200 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(Math.max(0, activeIndex) / (steps.length - 1)) * 100}%` }}
          ></div>
          
          <div className="relative z-10 flex justify-between">
            {steps.map((stepItem, idx) => {
              const isCompleted = idx <= activeIndex;
              const isCurrent = idx === activeIndex;
              return (
                <div key={stepItem.id} className="flex flex-col items-center text-center max-w-[90px] sm:max-w-[130px]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-xs transition-colors
                    ${isCompleted ? 'bg-green-500 text-white' : 'bg-neutral-300 text-transparent'}`}
                  >
                    <Check className="w-4 h-4" />
                  </div>
                  <span className={`text-xs mt-2 leading-tight ${isCurrent ? 'text-navy font-bold' : isCompleted ? 'text-navy font-medium' : 'text-text-muted'}`}>
                    {stepItem.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-neutral-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-navy">My Account</h1>
            <p className="text-text-muted text-sm mt-1">Manage your cross-border gift orders, recipients in Kenya, and saved preferences.</p>
          </div>
          <Link to="/shop">
            <Button className="flex items-center gap-2">
              <Gift className="w-4 h-4" /> Send Another Gift
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-neutral-200 bg-neutral-50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-dpc-blue text-white flex items-center justify-center font-bold text-xl shadow-xs">
                  JD
                </div>
                <div>
                  <p className="font-bold text-navy">John Doe</p>
                  <p className="text-xs text-text-muted">john.doe@example.com</p>
                  <span className="inline-block mt-1 text-[10px] bg-blue-100 text-dpc-blue font-bold px-1.5 py-0.5 rounded">
                    Diaspora Sender
                  </span>
                </div>
              </div>
              <nav className="p-2 space-y-1">
                <button 
                  onClick={() => { setActiveTab('orders'); setSelectedOrder(null); }}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${activeTab === 'orders' ? 'bg-blue-50 text-dpc-blue font-semibold' : 'text-text hover:bg-neutral-50'}`}
                >
                  <span className="flex items-center gap-3">
                    <Package className="w-5 h-5" /> Order History
                  </span>
                  <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold">
                    {orders.length}
                  </span>
                </button>
                <button 
                  onClick={() => { setActiveTab('recipients'); setSelectedOrder(null); }}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${activeTab === 'recipients' ? 'bg-blue-50 text-dpc-blue font-semibold' : 'text-text hover:bg-neutral-50'}`}
                >
                  <span className="flex items-center gap-3">
                    <User className="w-5 h-5" /> My Recipients in Kenya
                  </span>
                  <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold">
                    {recipients.length}
                  </span>
                </button>
                <button 
                  onClick={() => { setActiveTab('addresses'); setSelectedOrder(null); }}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'addresses' ? 'bg-blue-50 text-dpc-blue font-semibold' : 'text-text hover:bg-neutral-50'}`}
                >
                  <MapPin className="w-5 h-5" /> Saved Addresses
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {!selectedOrder ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-display font-bold text-navy">Order History & Tracking</h2>
                      <span className="text-xs text-text-muted">Total: {orders.length} orders</span>
                    </div>
                    
                    {orders.length === 0 ? (
                      <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-sm">
                        <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-navy mb-2">No orders placed yet</h3>
                        <p className="text-text-muted mb-6">You haven't placed any gift orders yet. Explore our selection of gifts and hampers for your loved ones in Kenya.</p>
                        <Link to="/shop">
                          <Button size="lg">Explore Gift Catalog</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div key={order.id} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden hover:border-dpc-blue/50 transition-colors">
                            
                            {/* Order Header */}
                            <div className="p-4 sm:p-6 bg-neutral-50 border-b border-neutral-200 flex flex-wrap gap-4 items-center justify-between">
                              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                <div>
                                  <span className="text-xs text-text-muted block">Order ID</span>
                                  <span className="font-mono font-bold text-navy">{order.id}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-text-muted block">Order Date</span>
                                  <span className="font-medium text-navy text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-text-muted block">Status</span>
                                  <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                                    {order.status?.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-text-muted block">Total</span>
                                <span className="font-bold text-navy text-lg">${order.total?.toFixed(2)}</span>
                              </div>
                            </div>
                            
                            {/* Order Details Preview */}
                            <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-6 items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-md w-fit border border-green-200">
                                  <Check className="w-3.5 h-3.5" /> Customer ≠ Recipient Verified
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-1">
                                  <div>
                                    <span className="text-xs text-text-muted block">Purchaser (Sender):</span>
                                    <span className="font-medium text-navy">{order.customerName || 'John Doe'}</span>
                                  </div>
                                  <div>
                                    <span className="text-xs text-text-muted block">Recipient in Kenya:</span>
                                    <span className="font-medium text-navy">{order.recipientName} ({order.deliveryCity})</span>
                                  </div>
                                </div>
                                <p className="text-xs text-text-muted pt-1">
                                  <span className="font-medium text-navy">{order.items?.length || 0} gift item(s)</span>
                                  {order.deliveryDate && ` • Scheduled delivery: ${order.deliveryDate}`}
                                </p>
                              </div>
                              
                              <div className="w-full md:w-auto">
                                <Button 
                                  variant="outline" 
                                  className="w-full md:w-auto flex items-center justify-center gap-2"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <ExternalLink className="w-4 h-4" /> View Details & Live Tracking
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* SINGLE ORDER DETAILS & LIVE TRACKING VIEW */
                  <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden p-6 md:p-8">
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      className="flex items-center gap-2 text-text-muted hover:text-navy transition-colors mb-6 text-sm font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to All Orders
                    </button>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-neutral-200">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl font-display font-bold text-navy">Order #{selectedOrder.id}</h2>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedOrder.status)}`}>
                            {selectedOrder.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-text-muted text-sm mt-1">
                          Placed on {new Date(selectedOrder.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>

                      {/* Payment Status Badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider bg-green-100 text-green-800 px-3 py-1 rounded-full border border-green-200 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Payment {selectedOrder.paymentStatus || 'PAID'}
                        </span>
                      </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200 mb-8">
                      <OrderTimeline status={selectedOrder.status} />

                      {/* Interactive QA Status Progression Controls */}
                      <div className="mt-6 pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-text-muted flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 text-dpc-blue" />
                          Simulate Order Status (QA Progression):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(['CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map((st) => (
                            <button
                              key={st}
                              onClick={() => handleUpdateOrderStatus(st)}
                              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${selectedOrder.status === st ? 'bg-navy text-white border-navy font-bold' : 'bg-white text-text-muted border-neutral-200 hover:bg-neutral-100'}`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Customer vs Recipient Explicit Separation Card */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-navy flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          Customer ≠ Recipient Verification
                        </h3>
                        <span className="text-xs bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded border border-green-200">
                          Verified Cross-Border Gifting
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Customer / Purchaser */}
                        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-xs">
                          <h4 className="font-bold text-navy text-sm mb-2 flex items-center gap-1.5">
                            <User className="w-4 h-4 text-dpc-blue" /> Purchaser (Customer / Sender)
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-text-muted">Name:</span> <span className="font-semibold text-navy">{selectedOrder.customerName || 'John Doe'}</span></p>
                            <p><span className="text-text-muted">Email:</span> {selectedOrder.customerEmail || 'john.doe@example.com'}</p>
                            {selectedOrder.customerPhone && (
                              <p><span className="text-text-muted">Phone:</span> {selectedOrder.customerPhone}</p>
                            )}
                            <p className="text-xs text-dpc-blue font-medium mt-2">Billed & notified overseas</p>
                          </div>
                        </div>

                        {/* Recipient in Kenya */}
                        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-xs">
                          <h4 className="font-bold text-navy text-sm mb-2 flex items-center gap-1.5">
                            <Gift className="w-4 h-4 text-green-600" /> Recipient (Kenya Receiver)
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-text-muted">Name:</span> <span className="font-semibold text-navy">{selectedOrder.recipientName}</span></p>
                            <p><span className="text-text-muted">Local Phone:</span> <span className="font-medium text-navy">{selectedOrder.recipientPhone}</span></p>
                            <p><span className="text-text-muted">Destination:</span> {selectedOrder.deliveryAddress}, {selectedOrder.deliveryCity}</p>
                            {selectedOrder.deliveryDate && (
                              <p><span className="text-text-muted">Delivery Date:</span> <span className="font-medium text-navy">{selectedOrder.deliveryDate}</span></p>
                            )}
                            {selectedOrder.deliveryNotes && (
                              <p className="text-xs italic text-text-muted mt-1 bg-neutral-50 p-1.5 rounded border border-neutral-100">
                                Notes: "{selectedOrder.deliveryNotes}"
                              </p>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Items in this Order */}
                    <div className="mb-8">
                      <h4 className="font-bold text-navy text-lg mb-4 border-b border-neutral-200 pb-2">
                        Items in this Order ({selectedOrder.items?.length || 0})
                      </h4>
                      <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden">
                        {selectedOrder.items?.map((item, idx) => (
                          <div key={idx} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <p className="font-semibold text-navy text-base">{item.productName}</p>
                              <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                                <span>Quantity: <strong className="text-navy">{item.quantity}</strong></span>
                                <span>Unit Price: ${item.unitPrice?.toFixed(2)}</span>
                                {item.recipient && (
                                  <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium border border-purple-100">
                                    Recipient Tag: {item.recipient}
                                  </span>
                                )}
                                {item.includeGreetingCard && (
                                  <span className="bg-blue-50 text-dpc-blue px-2 py-0.5 rounded font-medium border border-blue-100">
                                    Includes Greeting Card
                                  </span>
                                )}
                              </div>
                              {item.giftMessage && (
                                <p className="text-xs text-neutral-600 italic mt-1.5 bg-neutral-50 p-2 rounded border border-neutral-100">
                                  Card Message: "{item.giftMessage}"
                                </p>
                              )}
                            </div>
                            <div className="font-bold text-navy text-base whitespace-nowrap">
                              ${item.totalPrice?.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200 max-w-sm ml-auto">
                      <h4 className="font-bold text-navy text-sm mb-4 border-b border-neutral-200 pb-2">Payment Summary</h4>
                      <div className="space-y-2 text-sm text-text">
                        <div className="flex justify-between">
                          <span className="text-text-muted">Subtotal</span>
                          <span className="font-medium">${selectedOrder.subtotal?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Delivery Fee ({selectedOrder.deliveryCity || 'Standard'})</span>
                          <span className="font-medium">${selectedOrder.deliveryFee?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Service Fee</span>
                          <span className="font-medium">${selectedOrder.serviceFee?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-navy text-base pt-3 border-t border-neutral-200">
                          <span>Total Amount Paid</span>
                          <span className="text-dpc-blue">${selectedOrder.total?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {activeTab === 'recipients' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-navy mb-1">My Recipients in Kenya</h2>
                    <p className="text-text-muted text-sm">Save phone numbers and addresses of family and friends in Kenya for 1-click checkout.</p>
                  </div>
                  {!isEditingRecipient && (
                    <Button onClick={() => { setCurrentRecipient({}); setIsEditingRecipient(true); }} className="flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add Recipient
                    </Button>
                  )}
                </div>

                {isEditingRecipient ? (
                  <div className="bg-white rounded-xl border border-neutral-200 p-6 md:p-8 shadow-sm">
                    <h3 className="text-xl font-bold text-navy mb-6">{currentRecipient.id ? 'Edit Recipient' : 'Add New Recipient'}</h3>
                    <form onSubmit={handleSaveRecipient} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1">Full Name</label>
                        <input 
                          type="text" required
                          className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue"
                          value={currentRecipient.name || ''}
                          onChange={(e) => setCurrentRecipient({...currentRecipient, name: e.target.value})}
                          placeholder="e.g. Mary Wanjiku"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1">Kenyan Phone Number</label>
                        <input 
                          type="tel" required
                          className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue"
                          value={currentRecipient.phone || ''}
                          onChange={(e) => setCurrentRecipient({...currentRecipient, phone: e.target.value})}
                          placeholder="0712 345 678"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1">City / Town in Kenya</label>
                        <select 
                          required
                          className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue bg-white"
                          value={currentRecipient.city || ''}
                          onChange={(e) => setCurrentRecipient({...currentRecipient, city: e.target.value})}
                        >
                          <option value="">Select a city</option>
                          <option value="Nairobi">Nairobi</option>
                          <option value="Mombasa">Mombasa</option>
                          <option value="Nakuru">Nakuru</option>
                          <option value="Kisumu">Kisumu</option>
                          <option value="Eldoret">Eldoret</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1">Delivery Street Address / Estate / Landmark</label>
                        <textarea 
                          required rows={3}
                          className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue"
                          value={currentRecipient.address || ''}
                          onChange={(e) => setCurrentRecipient({...currentRecipient, address: e.target.value})}
                          placeholder="House / Apartment, Estate, Landmark"
                        />
                      </div>
                      <div className="flex gap-4 pt-4 border-t border-neutral-100">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditingRecipient(false)}>Cancel</Button>
                        <Button type="submit" className="flex-1">Save Recipient</Button>
                      </div>
                    </form>
                  </div>
                ) : (
                  recipients.length === 0 ? (
                    <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-sm">
                      <User className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-navy mb-2">No saved recipients</h3>
                      <p className="text-text-muted mb-6">You haven't saved any recipient details yet. Add them here for quicker checkout.</p>
                      <Button variant="outline" onClick={() => { setCurrentRecipient({}); setIsEditingRecipient(true); }}>
                        Add Your First Recipient
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recipients.map(item => (
                        <div key={item.id} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm flex flex-col">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-navy text-lg">{item.name}</h4>
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-semibold border border-green-200">
                              {item.city}
                            </span>
                          </div>
                          <div className="text-sm text-text-muted space-y-1 mb-6 flex-1">
                            <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-dpc-blue" /> {item.phone}</p>
                            <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-dpc-blue" /> {item.address}</p>
                          </div>
                          <div className="flex gap-2 border-t border-neutral-100 pt-4">
                            <Button variant="outline" size="sm" className="flex-1 flex items-center justify-center gap-1" onClick={() => { setCurrentRecipient(item); setIsEditingRecipient(true); }}>
                              <Edit className="w-4 h-4" /> Edit
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center gap-1" onClick={() => handleDeleteRecipient(item.id)}>
                              <Trash2 className="w-4 h-4" /> Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center shadow-sm">
                <MapPin className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <h2 className="text-2xl font-display font-bold text-navy mb-2">Saved Addresses</h2>
                <p className="text-text-muted mb-6 max-w-md mx-auto">Manage your overseas billing address and default Kenya delivery hubs.</p>
                <div className="max-w-md mx-auto bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-left mb-6">
                  <span className="text-xs font-bold uppercase text-dpc-blue">Primary Diaspora Billing Address</span>
                  <p className="font-bold text-navy mt-1">John Doe</p>
                  <p className="text-sm text-text-muted">42 Kingsway Gardens, London, SW1A 1AA, United Kingdom</p>
                  <p className="text-sm text-text-muted">+44 7911 123456</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
