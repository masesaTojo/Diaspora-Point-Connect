import React, { useState, useEffect } from 'react';
import { Package, User, MapPin, Clock, ArrowRight, ExternalLink, ArrowLeft, CheckCircle, Edit, Trash2, Plus } from 'lucide-react';
import { Order } from '@/src/types';
import { Button } from '@/src/components/ui/Button';
import { Link } from 'react-router-dom';

interface SavedRecipient {
  id: string;
  name: string;
  phone: string;
  city: string;
  address: string;
}

export default function Account() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Partial<Order>[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Partial<Order> | null>(null);

  // Recipients State
  const [recipients, setRecipients] = useState<SavedRecipient[]>([]);
  const [isEditingRecipient, setIsEditingRecipient] = useState<boolean>(false);
  const [currentRecipient, setCurrentRecipient] = useState<Partial<SavedRecipient>>({});

  useEffect(() => {
    const savedOrders = localStorage.getItem('dpc_orders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
    const savedRecipients = localStorage.getItem('dpc_recipients');
    if (savedRecipients) {
      setRecipients(JSON.parse(savedRecipients));
    }
  }, []);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'OUT_FOR_DELIVERY':
      case 'DISPATCHED':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const OrderTimeline = ({ status }: { status?: string }) => {
    const steps = [
      { id: 'CONFIRMED', label: 'Order Placed' },
      { id: 'PROCESSING', label: 'Preparing Gift' },
      { id: 'DISPATCHED', label: 'Dispatched' },
      { id: 'DELIVERED', label: 'Delivered' }
    ];

    const currentIndex = steps.findIndex(s => s.id === status);
    // Default to first step if unmapped
    const activeIndex = currentIndex >= 0 ? currentIndex : 0;

    return (
      <div className="py-6">
        <h4 className="font-semibold text-navy mb-6">Delivery Status</h4>
        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-neutral-200 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          ></div>
          
          <div className="relative z-10 flex justify-between">
            {steps.map((step, idx) => {
              const isCompleted = idx <= activeIndex;
              const isCurrent = idx === activeIndex;
              return (
                <div key={step.id} className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white transition-colors
                    ${isCompleted ? 'bg-green-500 text-white' : 'bg-neutral-300 text-transparent'}`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span className={`text-xs sm:text-sm font-medium ${isCurrent ? 'text-navy font-bold' : isCompleted ? 'text-navy' : 'text-text-muted'}`}>
                    {step.label}
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
        <h1 className="text-3xl md:text-4xl font-display font-bold text-navy mb-8">My Account</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-neutral-200 bg-neutral-50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-dpc-blue text-white flex items-center justify-center font-bold text-xl">
                  JD
                </div>
                <div>
                  <p className="font-bold text-navy">John Doe</p>
                  <p className="text-sm text-text-muted">john@example.com</p>
                </div>
              </div>
              <nav className="p-2">
                <button 
                  onClick={() => { setActiveTab('orders'); setSelectedOrder(null); }}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'orders' ? 'bg-blue-50 text-dpc-blue font-semibold' : 'text-text hover:bg-neutral-50'}`}
                >
                  <Package className="w-5 h-5" /> Order History
                </button>
                <button 
                  onClick={() => { setActiveTab('recipients'); setSelectedOrder(null); }}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'recipients' ? 'bg-blue-50 text-dpc-blue font-semibold' : 'text-text hover:bg-neutral-50'}`}
                >
                  <User className="w-5 h-5" /> My Recipients
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
                    <h2 className="text-2xl font-display font-bold text-navy mb-4">Order History</h2>
                    
                    {orders.length === 0 ? (
                      <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-sm">
                        <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-navy mb-2">No orders yet</h3>
                        <p className="text-text-muted mb-6">You haven't placed any gift orders yet.</p>
                        <Link to="/shop">
                          <Button>Start Shopping</Button>
                        </Link>
                      </div>
                    ) : (
                      orders.map(order => (
                        <div key={order.id} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                          {/* Order Header */}
                          <div className="bg-neutral-50 p-4 sm:p-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold text-navy">Order #{order.id}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(order.status || '')}`}>
                                  {order.status?.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p className="text-sm text-text-muted flex items-center gap-1">
                                <Clock className="w-4 h-4" /> Placed on {new Date(order.createdAt || '').toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-sm text-text-muted mb-1">Total Amount</p>
                              <p className="font-bold text-navy text-lg">${order.total?.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          {/* Order Body */}
                          <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                              <h4 className="font-semibold text-navy mb-2">Delivery Details</h4>
                              <p className="text-sm text-text"><span className="font-medium text-text-muted">Recipient:</span> {order.recipientName}</p>
                              <p className="text-sm text-text"><span className="font-medium text-text-muted">Address:</span> {order.deliveryAddress}, {order.deliveryCity}</p>
                              <p className="text-sm text-text"><span className="font-medium text-text-muted">Phone:</span> {order.recipientPhone}</p>
                            </div>
                            
                            <div className="md:w-64 border-t md:border-t-0 md:border-l border-neutral-200 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center gap-3">
                              <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => setSelectedOrder(order)}>
                                <ExternalLink className="w-4 h-4" /> View Details & Track
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                ) : (
                  <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden p-6">
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      className="flex items-center gap-2 text-text-muted hover:text-navy transition-colors mb-6 text-sm font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Orders
                    </button>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                      <div>
                        <h2 className="text-2xl font-display font-bold text-navy mb-1">Order #{selectedOrder.id}</h2>
                        <p className="text-text-muted">Placed on {new Date(selectedOrder.createdAt || '').toLocaleDateString()}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(selectedOrder.status || '')} self-start sm:self-auto`}>
                        {selectedOrder.status?.replace(/_/g, ' ')}
                      </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-100 mb-8">
                      <OrderTimeline status={selectedOrder.status} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div>
                        <h4 className="font-semibold text-navy border-b border-neutral-200 pb-2 mb-4">Recipient Information</h4>
                        <p className="text-text mb-1"><span className="font-medium text-text-muted">Name:</span> {selectedOrder.recipientName}</p>
                        <p className="text-text mb-1"><span className="font-medium text-text-muted">Phone:</span> {selectedOrder.recipientPhone}</p>
                        <p className="text-text mb-1"><span className="font-medium text-text-muted">Address:</span> {selectedOrder.deliveryAddress}, {selectedOrder.deliveryCity}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-navy border-b border-neutral-200 pb-2 mb-4">Payment Summary</h4>
                        <div className="space-y-2 text-sm text-text">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-medium">${selectedOrder.subtotal?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Delivery Fee</span>
                            <span className="font-medium">${selectedOrder.deliveryFee?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-navy text-base mt-2 pt-2 border-t border-neutral-100">
                            <span>Total</span>
                            <span>${selectedOrder.total?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-navy border-b border-neutral-200 pb-2 mb-4">Items in this Order</h4>
                      <div className="space-y-4">
                        {selectedOrder.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                            <div>
                              <p className="font-medium text-navy">{item.productName}</p>
                              <div className="text-sm text-text-muted flex gap-4 mt-1">
                                <span>Qty: {item.quantity}</span>
                                {item.recipient && <span>For: {item.recipient}</span>}
                              </div>
                            </div>
                            <div className="font-medium text-navy">
                              ${item.totalPrice?.toFixed(2)}
                            </div>
                          </div>
                        ))}
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
                    <h2 className="text-2xl font-display font-bold text-navy mb-1">My Recipients</h2>
                    <p className="text-text-muted">Manage addresses and contact details for your frequent gift receivers.</p>
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
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1">Phone Number</label>
                        <input 
                          type="tel" required
                          className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue"
                          value={currentRecipient.phone || ''}
                          onChange={(e) => setCurrentRecipient({...currentRecipient, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1">City/Town</label>
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
                        <label className="block text-sm font-medium text-navy mb-1">Street Address / Landmark</label>
                        <textarea 
                          required rows={3}
                          className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue"
                          value={currentRecipient.address || ''}
                          onChange={(e) => setCurrentRecipient({...currentRecipient, address: e.target.value})}
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
                      <p className="text-text-muted mb-6">You haven't added any recipients yet. Save their details here for faster checkout.</p>
                      <Button variant="outline" onClick={() => { setCurrentRecipient({}); setIsEditingRecipient(true); }}>
                        Add Your First Recipient
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recipients.map(recipient => (
                        <div key={recipient.id} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm flex flex-col">
                          <h4 className="font-bold text-navy text-lg mb-2">{recipient.name}</h4>
                          <div className="text-sm text-text-muted space-y-1 mb-6 flex-1">
                            <p>📞 {recipient.phone}</p>
                            <p>🏙️ {recipient.city}</p>
                            <p>📍 {recipient.address}</p>
                          </div>
                          <div className="flex gap-2 border-t border-neutral-100 pt-4">
                            <Button variant="outline" size="sm" className="flex-1 flex items-center justify-center gap-1" onClick={() => { setCurrentRecipient(recipient); setIsEditingRecipient(true); }}>
                              <Edit className="w-4 h-4" /> Edit
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center gap-1" onClick={() => handleDeleteRecipient(recipient.id)}>
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
                <h2 className="text-2xl font-display font-bold text-navy mb-4">Saved Addresses</h2>
                <p className="text-text-muted mb-6">Save your billing and default delivery addresses for faster checkout.</p>
                <Button variant="outline" className="mx-auto flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Add New Address
                </Button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
