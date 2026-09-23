import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Gift, 
  Phone, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { useShop } from '@/src/contexts/ShopContext';
import { getStoredOrders, subscribeToStorage } from '@/src/lib/adminStorage';
import { Order, OrderStatus } from '@/src/types';

export default function TrackOrder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { convertPrice } = useShop();
  
  const queryOrderId = searchParams.get('orderId') || '';
  const [orderQuery, setOrderQuery] = useState(queryOrderId);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadOrders = () => {
      const stored = getStoredOrders();
      setOrders(stored);
      if (queryOrderId && stored.length > 0) {
        const found = stored.find(o => 
          o.id.toLowerCase() === queryOrderId.trim().toLowerCase() ||
          o.recipientPhone?.replace(/\D/g, '').includes(queryOrderId.trim())
        );
        if (found) {
          setSearchedOrder(found);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
        setHasSearched(true);
      }
    };

    loadOrders();
    const unsub = subscribeToStorage(['dpc_orders'], loadOrders);
    return unsub;
  }, [queryOrderId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = orderQuery.trim().toLowerCase();
    if (!query) return;

    setHasSearched(true);
    setSearchParams({ orderId: orderQuery.trim() });

    const found = orders.find(o => 
      o.id.toLowerCase() === query ||
      o.id.toLowerCase().includes(query) ||
      (o.recipientPhone && o.recipientPhone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))) ||
      (o.customerEmail && o.customerEmail.toLowerCase().includes(query))
    );

    if (found) {
      setSearchedOrder(found);
      setNotFound(false);
    } else {
      setSearchedOrder(null);
      setNotFound(true);
    }
  };

  const getStatusStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'CONFIRMED': return 0;
      case 'PROCESSING': return 1;
      case 'DISPATCHED':
      case 'OUT_FOR_DELIVERY':
      case 'READY_FOR_DELIVERY': return 2;
      case 'DELIVERED': return 3;
      default: return 0;
    }
  };

  const steps = [
    { title: 'Order Confirmed', desc: 'Payment verified via PesaPal / M-Pesa' },
    { title: 'Gift Prepared', desc: 'Handcrafted hamper & fresh items packaged' },
    { title: 'Dispatched & On Route', desc: 'Driver en route in Kenya' },
    { title: 'Delivered with Joy', desc: 'Handed to your recipient' }
  ];

  return (
    <div className="bg-neutral-50 min-h-screen py-10 md:py-16">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-dpc-blue font-semibold text-xs mb-3">
            <Truck className="w-3.5 h-3.5" />
            <span>Real-Time Cross-Border Tracking</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-navy mb-3">
            Track Your Gift Delivery in Kenya
          </h1>
          <p className="text-text-muted text-base max-w-xl mx-auto">
            Enter your Order ID (e.g. ORD-1001) or recipient phone number to get live milestone updates from our Nairobi dispatch hub.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-neutral-200 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Enter Order ID (e.g. ORD-1001) or Phone Number"
                className="w-full pl-12 pr-4 py-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-dpc-blue focus:border-dpc-blue text-navy placeholder:text-gray-400 font-medium"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="sm:px-8 shrink-0">
              Track Order
            </Button>
          </form>

          {/* Quick Order Suggestions */}
          {orders.length > 0 && !hasSearched && (
            <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <span className="font-semibold text-navy">Recent orders:</span>
              {orders.slice(0, 3).map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setOrderQuery(o.id);
                    setSearchedOrder(o);
                    setHasSearched(true);
                    setNotFound(false);
                    setSearchParams({ orderId: o.id });
                  }}
                  className="bg-neutral-100 hover:bg-neutral-200 text-navy px-2.5 py-1 rounded-md font-mono transition-colors"
                >
                  {o.id} ({o.recipientName})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        {hasSearched && notFound && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-navy mb-2">Order Not Found</h3>
            <p className="text-text-muted max-w-md mx-auto mb-6 text-sm">
              We couldn't locate an order with identifier "{orderQuery}". Please verify your Order ID from your confirmation email or invoice.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => { setOrderQuery(''); setHasSearched(false); }}>
                Try Another Search
              </Button>
              <Link to="/support">
                <Button variant="ghost">Contact Support</Button>
              </Link>
            </div>
          </div>
        )}

        {searchedOrder && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Status Banner */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-navy">Order #{searchedOrder.id}</h2>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                      {searchedOrder.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mt-1">
                    Placed on {new Date(searchedOrder.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-text-muted block">Payment Method</span>
                  <span className="font-semibold text-navy text-sm uppercase">
                    {searchedOrder.paymentMethod || 'PesaPal'} (Paid: {convertPrice(searchedOrder.total)})
                  </span>
                </div>
              </div>

              {/* Step Progress Tracker */}
              <div className="py-8">
                {searchedOrder.status === 'CANCELLED' ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center text-sm font-medium">
                    This order was cancelled. If you believe this is in error, please contact customer care.
                  </div>
                ) : (
                  <div className="relative">
                    <div className="hidden sm:block absolute top-4 left-6 right-6 h-1 bg-neutral-200 -z-0">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-700"
                        style={{ width: `${(getStatusStepIndex(searchedOrder.status) / (steps.length - 1)) * 100}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative z-10">
                      {steps.map((step, idx) => {
                        const currentIdx = getStatusStepIndex(searchedOrder.status);
                        const isDone = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                          <div key={idx} className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors shadow-xs ${
                              isDone ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'
                            }`}>
                              {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                            </div>
                            <div>
                              <h4 className={`text-sm font-semibold ${isCurrent ? 'text-dpc-blue' : 'text-navy'}`}>
                                {step.title}
                              </h4>
                              <p className="text-xs text-text-muted mt-0.5">{step.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Details Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-neutral-200">
                <div className="bg-neutral-50 p-4 rounded-xl">
                  <h4 className="font-bold text-navy text-sm mb-3 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-emerald-600" />
                    Recipient in Kenya
                  </h4>
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-navy">{searchedOrder.recipientName}</p>
                    <p className="text-text-muted flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {searchedOrder.recipientPhone}
                    </p>
                    <p className="text-text-muted flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {searchedOrder.deliveryAddress}, {searchedOrder.deliveryCity}
                    </p>
                    {searchedOrder.deliveryDate && (
                      <p className="text-xs text-emerald-700 font-semibold mt-2 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Scheduled: {searchedOrder.deliveryDate}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-neutral-50 p-4 rounded-xl">
                  <h4 className="font-bold text-navy text-sm mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-dpc-blue" />
                    Sender (Diaspora Customer)
                  </h4>
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-navy">{searchedOrder.customerName || 'Diaspora Customer'}</p>
                    <p className="text-text-muted">{searchedOrder.customerEmail || 'sender@example.com'}</p>
                    <p className="text-xs text-dpc-blue font-medium mt-3 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Delivery coordination handled directly with recipient
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <h4 className="font-bold text-navy text-sm mb-3">Order Items ({searchedOrder.items.length})</h4>
                <div className="divide-y divide-neutral-100">
                  {searchedOrder.items.map((item, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-navy">{item.productName}</span>
                        <span className="text-text-muted ml-2">x{item.quantity}</span>
                        {item.includeGreetingCard && (
                          <span className="ml-2 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">
                            + Card
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-navy">{convertPrice(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Link to={`/account?orderId=${searchedOrder.id}`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    View in Customer Account <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Dispatch & Delivery Help info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
            <Clock className="w-8 h-8 text-dpc-blue mb-3" />
            <h3 className="font-bold text-navy mb-1">Nairobi Same-Day Delivery</h3>
            <p className="text-xs text-text-muted">Orders placed before 2:00 PM EAT are dispatched same-day with direct recipient phone coordination.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
            <Phone className="w-8 h-8 text-emerald-600 mb-3" />
            <h3 className="font-bold text-navy mb-1">Recipient Courtesy Call</h3>
            <p className="text-xs text-text-muted">Our friendly Kenyan couriers call before arrival without spoiling surprise gifts.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
            <ShieldCheck className="w-8 h-8 text-amber-500 mb-3" />
            <h3 className="font-bold text-navy mb-1">Delivered Guarantee</h3>
            <p className="text-xs text-text-muted">You receive SMS & Email confirmation with delivery confirmation once handed over.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
