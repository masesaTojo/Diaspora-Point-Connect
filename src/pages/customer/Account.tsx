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
  Check,
  Heart,
  ShoppingBag,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { Order, SupportTicket } from '@/src/types';
import { Button } from '@/src/components/ui/Button';
import { useShop } from '@/src/contexts/ShopContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { auth, db } from '@/src/lib/firebase';
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { buildFirestoreErrorInfo, handleFirestoreError, OperationType } from '@/src/lib/firestoreErrors';

interface SavedRecipient {
  id: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function Account() {
  const [searchParams] = useSearchParams();
  const { convertPrice, wishlist, toggleWishlist, addToCart, products } = useShop();
  const { currentUser, loading: authLoading, login } = useAuth();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Recipients State
  const [recipients, setRecipients] = useState<SavedRecipient[]>([]);
  const [isEditingRecipient, setIsEditingRecipient] = useState<boolean>(false);
  const [currentRecipient, setCurrentRecipient] = useState<Partial<SavedRecipient>>({});

  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadCustomerOrders = async () => {
      if (!auth.currentUser) {
        setOrders([]);
        setSelectedOrder(null);
        return;
      }
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const idToken = await auth.currentUser.getIdToken();
        const res = await fetch('/api/orders/my', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || `Unable to load your orders (${res.status})`);
        }
        const loadedOrders: Order[] = Array.isArray(data.orders) ? data.orders : [];
        setOrders(loadedOrders);

        const targetOrderId = searchParams.get('orderId');
        if (targetOrderId && loadedOrders.length > 0) {
          const match = loadedOrders.find(o => o.id === targetOrderId);
          if (match) {
            setSelectedOrder(match);
            setActiveTab('orders');
          }
        }
      } catch (err) {
        setOrdersError((err as Error)?.message || 'Failed to load orders.');
      } finally {
        setOrdersLoading(false);
      }
    };

    if (!authLoading) {
      loadCustomerOrders();
    }
  }, [searchParams, currentUser, authLoading]);

  // Real-time Firestore sync for customer's saved Kenya recipients
  useEffect(() => {
    if (!currentUser?.id || !auth.currentUser?.emailVerified) {
      setRecipients([]);
      return;
    }
    const recipientsPath = `users/${currentUser.id}/recipients`;
    const unsubscribe = onSnapshot(
      collection(db, 'users', currentUser.id, 'recipients'),
      (snapshot) => {
        setRecipients(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SavedRecipient)));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, recipientsPath);
      }
    );
    return () => unsubscribe();
  }, [currentUser?.id]);

  // Real-time Firestore sync for customer's support tickets
  useEffect(() => {
    if (!currentUser?.id || !auth.currentUser?.emailVerified) {
      setTickets([]);
      setTicketsError(null);
      return;
    }
    const ticketsQuery = query(
      collection(db, 'supportTickets'),
      where('customerId', '==', currentUser.id)
    );
    const unsubscribe = onSnapshot(
      ticketsQuery,
      (snapshot) => {
        const loaded = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as SupportTicket))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTickets(loaded);
        setTicketsError(null);
      },
      (err) => {
        console.error('Support tickets listener error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.LIST, 'supportTickets')));
        setTicketsError('Support ticket history is temporarily unavailable.');
      }
    );
    return () => unsubscribe();
  }, [currentUser?.id]);

  const handleSaveRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecipient.name || !currentRecipient.phone || !currentUser?.id) return;

    const nowIso = new Date().toISOString();
    const recId = currentRecipient.id || `rec-${Date.now()}`;
    const payload: SavedRecipient = {
      id: recId,
      name: currentRecipient.name.trim(),
      phone: currentRecipient.phone.trim(),
      city: (currentRecipient.city || 'Nairobi').trim(),
      address: (currentRecipient.address || '').trim(),
      createdAt: currentRecipient.createdAt || nowIso,
      updatedAt: nowIso,
    };

    try {
      await setDoc(doc(db, 'users', currentUser.id, 'recipients', recId), payload);
      setIsEditingRecipient(false);
      setCurrentRecipient({});
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.id}/recipients/${recId}`);
    }
  };

  const handleDeleteRecipient = async (id: string) => {
    if (!currentUser?.id) return;
    if (confirm('Are you sure you want to delete this recipient?')) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.id, 'recipients', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.id}/recipients/${id}`);
      }
    }
  };

  const displayName = currentUser
    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email.split('@')[0]
    : 'Guest Customer';
  const initials = displayName
    .split(/\s+/)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'GC';

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
    if (status === 'CONFIRMED' || status === 'PAYMENT_CONFIRMED' || status === 'NEW' || status === 'PAYMENT_PENDING') activeIndex = 0;
    else if (status === 'PROCESSING') activeIndex = 1;
    else if (status === 'DISPATCHED' || status === 'OUT_FOR_DELIVERY' || status === 'READY_FOR_DELIVERY') activeIndex = 2;
    else if (status === 'DELIVERED') activeIndex = 3;
    else if (status === 'CANCELLED' || status === 'REFUNDED') activeIndex = -1;

    if (status === 'CANCELLED' || status === 'REFUNDED') {
      return (
        <div className="py-4 text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg font-semibold text-sm border border-red-200">
            <AlertCircle className="w-4 h-4" /> This order has been {status.toLowerCase()}.
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
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-navy truncate">{displayName}</p>
                  <p className="text-xs text-text-muted truncate">{currentUser?.email || 'Not signed in'}</p>
                  <span className="inline-block mt-1 text-[10px] bg-blue-100 text-dpc-blue font-bold px-1.5 py-0.5 rounded">
                    {currentUser ? 'Verified Customer' : 'Sign In Required'}
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
                  onClick={() => { setActiveTab('wishlist'); setSelectedOrder(null); }}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${activeTab === 'wishlist' ? 'bg-blue-50 text-dpc-blue font-semibold' : 'text-text hover:bg-neutral-50'}`}
                >
                  <span className="flex items-center gap-3">
                    <Heart className="w-5 h-5" /> Saved Wishlist
                  </span>
                  <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold">
                    {wishlist.length}
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
                <button 
                  onClick={() => { setActiveTab('tickets'); setSelectedOrder(null); }}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${activeTab === 'tickets' ? 'bg-blue-50 text-dpc-blue font-semibold' : 'text-text hover:bg-neutral-50'}`}
                >
                  <span className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5" /> Support Tickets
                  </span>
                  <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold">
                    {tickets.length}
                  </span>
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
                      <h2 className="text-2xl font-display font-bold text-navy">Order History &amp; Tracking</h2>
                      <span className="text-xs text-text-muted">Total: {orders.length} orders</span>
                    </div>

                    {ordersError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{ordersError}</span>
                      </div>
                    )}

                    {!currentUser && !authLoading ? (
                      <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-sm">
                        <User className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-navy mb-2">Sign in to view your orders</h3>
                        <p className="text-text-muted mb-6">Order history and delivery tracking are protected to keep your gift details private.</p>
                        <Button size="lg" onClick={login}>Sign in with Google</Button>
                      </div>
                    ) : ordersLoading ? (
                      <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-sm">
                        <RefreshCw className="w-8 h-8 text-dpc-blue animate-spin mx-auto mb-3" />
                        <p className="text-text-muted text-sm">Loading your verified orders...</p>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-sm">
                        <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-navy mb-2">No orders placed yet</h3>
                        <p className="text-text-muted mb-6">You haven&apos;t placed any gift orders yet. Explore our selection of gifts and hampers for your loved ones in Kenya.</p>
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
                                <span className="font-bold text-navy text-lg">{convertPrice(order.total)}</span>
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
                                    <span className="font-medium text-navy">{order.customerName || displayName}</span>
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
                        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1 ${
                          selectedOrder.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : selectedOrder.paymentStatus === 'FAILED'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          <Check className="w-3.5 h-3.5" /> Payment {selectedOrder.paymentStatus || 'PENDING'}
                        </span>
                      </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200 mb-8">
                      <OrderTimeline status={selectedOrder.status} />
                      {selectedOrder.paymentStatus === 'PENDING' && (
                        <div className="mt-4 pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <span className="text-amber-800 font-medium">
                            Awaiting PesaPal settlement verification.
                          </span>
                          <Link to={`/checkout?orderId=${selectedOrder.id}&pesapalCallback=1${selectedOrder.pesapalTrackingId ? `&OrderTrackingId=${selectedOrder.pesapalTrackingId}` : ''}`}>
                            <Button size="sm" variant="outline">Verify Payment Status</Button>
                          </Link>
                        </div>
                      )}
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
                            <p><span className="text-text-muted">Name:</span> <span className="font-semibold text-navy">{selectedOrder.customerName || displayName}</span></p>
                            <p><span className="text-text-muted">Email:</span> {selectedOrder.customerEmail || currentUser?.email || '—'}</p>
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
                            {selectedOrder.expectedDeliveryTime && (
                              <p><span className="text-text-muted">Delivery ETA:</span> <span className="font-medium text-dpc-blue">{selectedOrder.expectedDeliveryTime}</span></p>
                            )}
                            {selectedOrder.deliveryNotes && (
                              <p className="text-xs italic text-text-muted mt-1 bg-neutral-50 p-1.5 rounded border border-neutral-100">
                                Notes: "{selectedOrder.deliveryNotes}"
                              </p>
                            )}
                            {selectedOrder.proofOfDelivery && (
                              <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                <ShieldCheck className="w-4 h-4 shrink-0" />
                                <span>Delivery Proof: {selectedOrder.proofOfDelivery}</span>
                              </div>
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
                                <span>Unit Price: {convertPrice(item.unitPrice)}</span>
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
                              {convertPrice(item.totalPrice)}
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
                          <span className="font-medium">{convertPrice(selectedOrder.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Delivery Fee ({selectedOrder.deliveryCity || 'Standard'})</span>
                          <span className="font-medium">{convertPrice(selectedOrder.deliveryFee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Service Fee</span>
                          <span className="font-medium">{convertPrice(selectedOrder.serviceFee)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-navy text-base pt-3 border-t border-neutral-200">
                          <span>Total Amount Paid</span>
                          <span className="text-dpc-blue">{convertPrice(selectedOrder.total)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-navy mb-1">My Saved Wishlist</h2>
                    <p className="text-text-muted text-sm">Gifts and items you've saved to purchase for family and friends in Kenya.</p>
                  </div>
                  <Link to="/shop">
                    <Button variant="outline" size="sm">Browse More Gifts</Button>
                  </Link>
                </div>

                {wishlist.length === 0 ? (
                  <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-sm">
                    <Heart className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-navy mb-2">Your wishlist is empty</h3>
                    <p className="text-text-muted mb-6">You haven't saved any items yet. Click the heart icon on any product to save it here.</p>
                    <Link to="/shop">
                      <Button size="lg">Explore Gift Catalog</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {wishlist.map(productId => {
                      const product = products.find(p => p.id === productId);
                      if (!product) return null;
                      return (
                        <div key={product.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col">
                          <Link to={`/product/${product.slug || product.id}`} className="block relative aspect-square bg-neutral-100 overflow-hidden">
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                          </Link>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <Link to={`/product/${product.slug || product.id}`}>
                                <h4 className="font-bold text-navy hover:text-dpc-blue transition-colors line-clamp-1">{product.name}</h4>
                              </Link>
                              <div className="mt-1 font-bold text-navy">
                                {product.salePrice ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-red-600">{convertPrice(product.salePrice)}</span>
                                    <span className="text-xs text-text-muted line-through">{convertPrice(product.price)}</span>
                                  </div>
                                ) : (
                                  <span>{convertPrice(product.price)}</span>
                                )}
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-neutral-100 flex gap-2">
                              <Button 
                                size="sm" 
                                className="flex-1 flex items-center justify-center gap-1.5"
                                onClick={() => addToCart({ productId: product.id, quantity: 1 })}
                              >
                                <ShoppingBag className="w-4 h-4" /> Add to Cart
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 p-2"
                                title="Remove from Wishlist"
                                onClick={() => toggleWishlist(product.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                <h2 className="text-2xl font-display font-bold text-navy mb-2">Account Profile & Hubs</h2>
                <p className="text-text-muted mb-6 max-w-md mx-auto">Your verified overseas account is used for order confirmations and cross-border billing receipts.</p>
                {currentUser ? (
                  <div className="max-w-md mx-auto bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-left mb-6 space-y-1">
                    <span className="text-xs font-bold uppercase text-dpc-blue">Verified Diaspora Account</span>
                    <p className="font-bold text-navy mt-1">{displayName}</p>
                    <p className="text-sm text-text-muted">{currentUser.email}</p>
                    <p className="text-xs text-text-muted pt-1">
                      Kenya delivery addresses are managed under <button onClick={() => setActiveTab('recipients')} className="text-dpc-blue underline font-medium">My Recipients in Kenya</button>.
                    </p>
                  </div>
                ) : (
                  <Button onClick={login}>Sign in with Google</Button>
                )}
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-navy mb-1">Support Tickets</h2>
                    <p className="text-text-muted text-sm">Track concierge responses for your delivery inquiries and assistance requests.</p>
                  </div>
                  <Link to="/support">
                    <Button className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Open New Ticket
                    </Button>
                  </Link>
                </div>

                {ticketsError && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{ticketsError}</span>
                  </div>
                )}

                {!currentUser && !authLoading ? (
                  <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-sm">
                    <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-navy mb-2">Sign in to view your support tickets</h3>
                    <p className="text-text-muted mb-6">Your support conversations are private to your verified Google account.</p>
                    <Button size="lg" onClick={login}>Sign in with Google</Button>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-sm">
                    <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-navy mb-2">No support tickets yet</h3>
                    <p className="text-text-muted mb-6">Need help coordinating a surprise gift or checking delivery timing? Reach out to our Nairobi concierge desk.</p>
                    <Link to="/support">
                      <Button variant="outline">Contact Concierge Support</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => {
                      const badgeColor =
                        ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : ticket.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200';
                      return (
                        <div key={ticket.id} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                            <div>
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="font-mono text-xs font-bold text-dpc-blue bg-blue-50 px-2 py-0.5 rounded">
                                  {ticket.id}
                                </span>
                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                                  {ticket.status.replace(/_/g, ' ')}
                                </span>
                                {ticket.orderId && (
                                  <Link
                                    to={`/track?orderId=${encodeURIComponent(ticket.orderId)}`}
                                    className="text-xs font-medium text-navy underline hover:text-dpc-blue"
                                  >
                                    Order #{ticket.orderId}
                                  </Link>
                                )}
                              </div>
                              <h3 className="font-bold text-navy text-lg mt-2">{ticket.subject}</h3>
                            </div>
                            <span className="text-xs text-text-muted">
                              {new Date(ticket.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-sm text-text whitespace-pre-line">{ticket.message}</p>

                          {ticket.resolutionNote && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm">
                              <p className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                Concierge Update
                                {ticket.assignedToEmail && (
                                  <span className="text-xs font-normal text-emerald-700 ml-1">
                                    ({ticket.assignedToEmail})
                                  </span>
                                )}
                              </p>
                              <p className="text-emerald-900 whitespace-pre-line">{ticket.resolutionNote}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
