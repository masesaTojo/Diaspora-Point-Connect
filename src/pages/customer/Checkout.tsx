import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useShop } from '@/src/contexts/ShopContext';
import { Button } from '@/src/components/ui/Button';
import { 
  Check, 
  CreditCard, 
  Truck, 
  User, 
  AlertCircle, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowLeft, 
  Gift, 
  Phone, 
  Mail, 
  MapPin, 
  RefreshCw, 
  XCircle,
  Clock,
  Info,
  Tag
} from 'lucide-react';
import { Order, OrderStatus } from '@/src/types';

interface SavedRecipient {
  id: string;
  name: string;
  phone: string;
  city: string;
  address: string;
}

export default function Checkout() {
  const { 
    cart, 
    clearCart, 
    products, 
    deliveryZones, 
    appliedCoupon, 
    applyCoupon, 
    removeCoupon, 
    placeOrder 
  } = useShop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Partial<Order> | null>(null);
  
  const [savedRecipients, setSavedRecipients] = useState<SavedRecipient[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('new');
  const [saveRecipientForFuture, setSaveRecipientForFuture] = useState(true);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [customer, setCustomer] = useState({ 
    name: 'John Doe', 
    email: 'john.doe@example.com', 
    phone: '+44 7911 123456' 
  });
  const [customerErrors, setCustomerErrors] = useState<{ [key: string]: string }>({});

  const [recipient, setRecipient] = useState({ 
    name: '', 
    phone: '' 
  });
  const [recipientErrors, setRecipientErrors] = useState<{ [key: string]: string }>({});

  // Default delivery date: 2 days from now formatted YYYY-MM-DD
  const getDefaultDeliveryDate = () => {
    // Check if cart has a delivery date
    const itemWithDate = cart.find(i => i.deliveryDate);
    if (itemWithDate?.deliveryDate) {
      return itemWithDate.deliveryDate;
    }
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  };

  const [delivery, setDelivery] = useState({ 
    address: '', 
    city: 'Nairobi', 
    date: getDefaultDeliveryDate(),
    notes: '' 
  });
  const [deliveryErrors, setDeliveryErrors] = useState<{ [key: string]: string }>({});

  // Payment Options & Simulation
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mpesa'>('card');
  const [paymentSimulation, setPaymentSimulation] = useState<'success' | 'failed'>('success');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Card mock state
  const [cardDetails, setCardDetails] = useState({
    number: '•••• •••• •••• 4242',
    expiry: '12/28',
    cvc: '123',
    name: 'John Doe'
  });
  const [mpesaPhone, setMpesaPhone] = useState('+254 712 345 678');

  useEffect(() => {
    const recipients = localStorage.getItem('dpc_recipients');
    if (recipients) {
      try {
        const parsed = JSON.parse(recipients);
        setSavedRecipients(parsed);
      } catch (e) {
        console.error('Failed to parse saved recipients');
      }
    }
  }, []);

  // Map cart items with live product details
  const cartItemsWithDetails = cart.map(item => ({
    ...item,
    product: products.find(p => p.id === item.productId)
  })).filter(item => item.product);

  // Check for out-of-stock items or quantity exceeding current inventory
  const hasOutOfStock = cartItemsWithDetails.some(item => 
    item.product?.availability === 'OUT_OF_STOCK' || 
    (typeof item.product?.inventory === 'number' && item.product.inventory < item.quantity)
  );

  // Check for multiple distinct recipients in cart
  const distinctLineRecipients = Array.from(
    new Set(cart.map(item => item.recipient).filter(Boolean) as string[])
  );

  const subtotal = cartItemsWithDetails.reduce((sum, item) => {
    const price = item.product?.salePrice || item.product?.price || 0;
    return sum + (price * item.quantity) + (item.includeGreetingCard ? 5 * item.quantity : 0);
  }, 0);
  
  const selectedZone = deliveryZones.find(z => z.name === delivery.city);
  const deliveryFee = subtotal > 0 ? (selectedZone?.fee ?? 10) : 0;
  const serviceFee = subtotal > 0 ? 5 : 0;
  
  // Calculate discount from applied coupon
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'PERCENTAGE') {
      discount = (subtotal * appliedCoupon.value) / 100;
    } else {
      discount = appliedCoupon.value;
    }
  }
  const total = Math.max(0, subtotal + deliveryFee + serviceFee - discount);

  // Safeguard: Redirect if empty cart and not on confirmation
  if (cart.length === 0 && step !== 6) {
    return (
      <div className="bg-neutral-bg min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-3xl font-display font-bold text-navy mb-3">Your Cart is Empty</h2>
        <p className="text-text-muted mb-6 max-w-md">Please add items to your cart before proceeding to checkout.</p>
        <Button onClick={() => navigate('/shop')}>Explore Gifts</Button>
      </div>
    );
  }

  // VALIDATIONS

  const validateCustomer = () => {
    const errors: { [key: string]: string } = {};
    if (!customer.name.trim() || customer.name.trim().length < 2) {
      errors.name = 'Please enter your full name (minimum 2 characters)';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customer.email.trim() || !emailRegex.test(customer.email.trim())) {
      errors.email = 'Please enter a valid email address for your order confirmation';
    }
    if (customer.phone && customer.phone.trim().length < 7) {
      errors.phone = 'Please enter a valid phone number';
    }
    setCustomerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRecipient = () => {
    const errors: { [key: string]: string } = {};
    if (!recipient.name.trim() || recipient.name.trim().length < 2) {
      errors.name = "Please enter the recipient's full name (minimum 2 characters)";
    }
    
    // Kenyan phone format check: should be at least 9 digits, typically starts with 07, 01, 254, or +254
    const cleanedPhone = recipient.phone.replace(/[\s\-()]/g, '');
    const kenyaPhoneRegex = /^(?:(?:\+?254)|0)?([17]\d{8})$/;
    if (!cleanedPhone || cleanedPhone.length < 9 || !kenyaPhoneRegex.test(cleanedPhone)) {
      errors.phone = 'Please enter a valid Kenyan phone number (e.g. 0712 345 678 or +254 712 345 678)';
    }

    setRecipientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateDelivery = () => {
    const errors: { [key: string]: string } = {};
    if (!delivery.city) {
      errors.city = 'Please select a delivery zone or city in Kenya';
    }
    if (!delivery.address.trim() || delivery.address.trim().length < 5) {
      errors.address = 'Please enter a detailed delivery address, estate, or landmark (min 5 characters)';
    }
    if (!delivery.date) {
      errors.date = 'Please select an estimated delivery date';
    }
    setDeliveryErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // HANDLERS

  const handleNextFromCustomer = () => {
    if (validateCustomer()) {
      setStep(2);
    }
  };

  const handleNextFromRecipient = () => {
    if (validateRecipient()) {
      // Save recipient if selected
      if (selectedRecipientId === 'new' && saveRecipientForFuture && recipient.name && recipient.phone) {
        const newSaved: SavedRecipient = {
          id: `rec_${Date.now()}`,
          name: recipient.name.trim(),
          phone: recipient.phone.trim(),
          city: delivery.city || 'Nairobi',
          address: delivery.address || ''
        };
        const updated = [...savedRecipients, newSaved];
        setSavedRecipients(updated);
        localStorage.setItem('dpc_recipients', JSON.stringify(updated));
      }
      setStep(3);
    }
  };

  const handleNextFromDelivery = () => {
    if (validateDelivery()) {
      setStep(4);
    }
  };

  const handleCancelPayment = () => {
    // User cancels the payment transaction - safely return to cart with notice
    navigate('/cart?cancelled=true');
  };

  const handlePlaceOrder = async () => {
    setPaymentError(null);
    setIsProcessing(true);

    // Mock network authorization delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check payment simulation
    if (paymentSimulation === 'failed') {
      setIsProcessing(false);
      setPaymentError(
        paymentMethod === 'card'
          ? 'Payment Failed: Transaction was declined by card issuer (05: Do Not Honor / Insufficient funds). Your cart and details have been preserved. Please try again or choose another payment method.'
          : 'Payment Failed: M-Pesa transaction was cancelled or timed out on subscriber phone. Please verify your phone number and try again.'
      );
      return;
    }

    // SUCCESSFUL ORDER CREATION
    const orderId = `DPC-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: Order = {
      id: orderId,
      customerEmail: customer.email.trim(),
      customerName: customer.name.trim(),
      customerPhone: customer.phone.trim(),
      paymentStatus: 'PAID',
      
      recipientName: recipient.name.trim(),
      recipientPhone: recipient.phone.trim(),
      
      deliveryAddress: delivery.address.trim(),
      deliveryCity: delivery.city,
      deliveryDate: delivery.date,
      deliveryNotes: delivery.notes.trim() || undefined,
      
      status: 'CONFIRMED' as OrderStatus,
      
      items: cart.map(item => {
        const p = products.find(x => x.id === item.productId);
        const unitPrice = p?.salePrice || p?.price || 0;
        return {
          id: item.id,
          productId: item.productId,
          productName: p?.name || 'Gift Item',
          quantity: item.quantity,
          unitPrice,
          totalPrice: unitPrice * item.quantity + (item.includeGreetingCard ? 5 * item.quantity : 0),
          recipient: item.recipient,
          giftMessage: item.giftMessage,
          includeGreetingCard: item.includeGreetingCard
        };
      }),
      
      total,
      subtotal,
      deliveryFee,
      serviceFee,
      discount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Atomically persist order, decrement inventory, log stock movement, and track coupon usage
    placeOrder(newOrder, appliedCoupon?.code);

    setIsProcessing(false);
    setPlacedOrderId(orderId);
    setPlacedOrder(newOrder);
    setStep(6);
  };

  const StepIndicator = ({ number, title, current, completed }: any) => (
    <div className={`flex items-center gap-2 ${current ? 'text-dpc-blue font-bold' : completed ? 'text-green-600' : 'text-neutral-400'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors
        ${current ? 'border-dpc-blue bg-dpc-blue text-white shadow-sm' : completed ? 'border-green-600 bg-green-600 text-white' : 'border-neutral-300 bg-white text-neutral-400'}`}>
        {completed ? <Check className="w-4 h-4" /> : number}
      </div>
      <span className={`text-sm hidden sm:inline ${current ? 'text-navy font-bold' : completed ? 'text-navy font-medium' : 'text-text-muted'}`}>{title}</span>
    </div>
  );

  return (
    <div className="bg-neutral-bg min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Out of Stock Notice */}
        {hasOutOfStock && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Out-of-Stock Item in Cart</p>
              <p className="text-sm">One or more items in your cart are currently out of stock. Please return to your cart and remove them before completing checkout.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/cart')}>
              Return to Cart
            </Button>
          </div>
        )}

        {/* Checkout Header / Steps */}
        {step !== 6 && (
          <div className="bg-white rounded-xl p-4 sm:p-6 mb-8 border border-neutral-200 shadow-sm flex items-center justify-between overflow-x-auto">
            <StepIndicator number={1} title="Customer" current={step === 1} completed={step > 1} />
            <div className="h-px bg-neutral-200 flex-1 mx-2 min-w-[12px]"></div>
            <StepIndicator number={2} title="Recipient" current={step === 2} completed={step > 2} />
            <div className="h-px bg-neutral-200 flex-1 mx-2 min-w-[12px]"></div>
            <StepIndicator number={3} title="Delivery" current={step === 3} completed={step > 3} />
            <div className="h-px bg-neutral-200 flex-1 mx-2 min-w-[12px]"></div>
            <StepIndicator number={4} title="Payment" current={step === 4} completed={step > 4} />
            <div className="h-px bg-neutral-200 flex-1 mx-2 min-w-[12px]"></div>
            <StepIndicator number={5} title="Review" current={step === 5} completed={step > 5} />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Form Area */}
          <div className={step === 6 ? "w-full" : "lg:w-2/3"}>
            
            {/* STEP 1: CUSTOMER DETAILS (PURCHASER / DIASPORA SENDER) */}
            {step === 1 && (
              <div className="bg-white rounded-xl p-6 md:p-8 border border-neutral-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-display font-bold text-navy flex items-center gap-2">
                    <User className="text-dpc-blue w-6 h-6" /> Customer Details
                  </h2>
                  <span className="text-xs bg-blue-50 text-dpc-blue font-semibold px-2.5 py-1 rounded-full border border-blue-100">
                    Overseas Purchaser
                  </span>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3.5 mb-6 text-sm text-blue-900">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-dpc-blue" /> Diaspora Purchaser Information
                  </p>
                  <p className="text-xs mt-1 text-blue-800">
                    Enter your contact details as the buyer. Your payment receipts, shipment tracking updates, and delivery confirmations will be sent to this email. This is distinct from the recipient in Kenya.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Your Full Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      className={`w-full p-3 border rounded-md focus:ring-dpc-blue focus:border-dpc-blue ${customerErrors.name ? 'border-red-500 bg-red-50/20' : 'border-neutral-300'}`}
                      value={customer.name}
                      onChange={(e) => {
                        setCustomer({...customer, name: e.target.value});
                        if (customerErrors.name) setCustomerErrors({...customerErrors, name: ''});
                      }}
                      placeholder="e.g. John Doe"
                    />
                    {customerErrors.name && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {customerErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Your Email Address <span className="text-red-500">*</span></label>
                    <input 
                      type="email" 
                      className={`w-full p-3 border rounded-md focus:ring-dpc-blue focus:border-dpc-blue ${customerErrors.email ? 'border-red-500 bg-red-50/20' : 'border-neutral-300'}`}
                      value={customer.email}
                      onChange={(e) => {
                        setCustomer({...customer, email: e.target.value});
                        if (customerErrors.email) setCustomerErrors({...customerErrors, email: ''});
                      }}
                      placeholder="e.g. john.doe@example.com"
                    />
                    {customerErrors.email && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {customerErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Your International Phone Number</label>
                    <input 
                      type="tel" 
                      className={`w-full p-3 border rounded-md focus:ring-dpc-blue focus:border-dpc-blue ${customerErrors.phone ? 'border-red-500 bg-red-50/20' : 'border-neutral-300'}`}
                      value={customer.phone}
                      onChange={(e) => {
                        setCustomer({...customer, phone: e.target.value});
                        if (customerErrors.phone) setCustomerErrors({...customerErrors, phone: ''});
                      }}
                      placeholder="e.g. +44 7911 123456 or +1 202 555 0192"
                    />
                    <p className="text-xs text-text-muted mt-1">Used for order queries and SMS delivery milestones.</p>
                  </div>

                  <Button 
                    className="w-full mt-6" 
                    size="lg"
                    disabled={hasOutOfStock}
                    onClick={handleNextFromCustomer}
                  >
                    Continue to Recipient Details
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: RECIPIENT DETAILS (RECEIVER IN KENYA) */}
            {step === 2 && (
              <div className="bg-white rounded-xl p-6 md:p-8 border border-neutral-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-display font-bold text-navy flex items-center gap-2">
                    <Gift className="text-dpc-blue w-6 h-6" /> Gift Recipient in Kenya
                  </h2>
                  <span className="text-xs bg-green-50 text-green-700 font-semibold px-2.5 py-1 rounded-full border border-green-200">
                    Local Kenyan Contact
                  </span>
                </div>

                {/* Multiple Recipients in Cart Notice */}
                {distinctLineRecipients.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3.5 mb-6 text-sm text-purple-900">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-purple-600" /> Multiple Recipients Specified
                    </p>
                    <p className="text-xs mt-1 text-purple-800">
                      Your cart items include personalized gifts for: <span className="font-bold">{distinctLineRecipients.join(', ')}</span>.
                      Enter the primary local recipient who will receive the delivery package in Kenya below.
                    </p>
                  </div>
                )}

                {/* Customer vs Recipient Notice if matching */}
                {customer.name && recipient.name && customer.name.trim().toLowerCase() === recipient.name.trim().toLowerCase() && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 mb-6 text-sm text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Customer ≠ Recipient Reminder</p>
                      <p className="text-xs mt-1 text-amber-800">
                        You entered <span className="font-bold">{recipient.name}</span> for both purchaser and recipient. Please ensure this is the person in Kenya who will physically receive the package and has a local Kenyan phone number.
                      </p>
                    </div>
                  </div>
                )}

                {savedRecipients.length > 0 && (
                  <div className="mb-6 space-y-2">
                    <label className="block text-sm font-medium text-navy">Select a Saved Recipient</label>
                    <select 
                      className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue bg-white text-navy"
                      value={selectedRecipientId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedRecipientId(val);
                        if (val !== 'new') {
                          const r = savedRecipients.find(sr => sr.id === val);
                          if (r) {
                            setRecipient({ name: r.name, phone: r.phone });
                            if (r.city) setDelivery(prev => ({ ...prev, city: r.city, address: r.address || prev.address }));
                          }
                        } else {
                          setRecipient({ name: '', phone: '' });
                        }
                      }}
                    >
                      <option value="new">+ Enter new recipient details</option>
                      {savedRecipients.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.phone}) - {r.city}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={`space-y-4 ${selectedRecipientId !== 'new' ? 'bg-neutral-50 p-4 rounded-lg border border-neutral-200' : ''}`}>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Recipient Full Name in Kenya <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      className={`w-full p-3 border rounded-md focus:ring-dpc-blue focus:border-dpc-blue ${recipientErrors.name ? 'border-red-500 bg-red-50/20' : 'border-neutral-300'}`}
                      value={recipient.name}
                      onChange={(e) => {
                        setRecipient({...recipient, name: e.target.value});
                        if (recipientErrors.name) setRecipientErrors({...recipientErrors, name: ''});
                      }}
                      placeholder="e.g. Mary Wanjiku or Mama Brian"
                    />
                    {recipientErrors.name && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {recipientErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Recipient Local Phone (Kenya) <span className="text-red-500">*</span></label>
                    <input 
                      type="tel" 
                      className={`w-full p-3 border rounded-md focus:ring-dpc-blue focus:border-dpc-blue ${recipientErrors.phone ? 'border-red-500 bg-red-50/20' : 'border-neutral-300'}`}
                      value={recipient.phone}
                      onChange={(e) => {
                        setRecipient({...recipient, phone: e.target.value});
                        if (recipientErrors.phone) setRecipientErrors({...recipientErrors, phone: ''});
                      }}
                      placeholder="e.g. 0712 345 678 or +254 712 345 678"
                    />
                    {recipientErrors.phone ? (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {recipientErrors.phone}
                      </p>
                    ) : (
                      <p className="text-xs text-text-muted mt-1">Required so our local dispatch courier can coordinate safe delivery.</p>
                    )}
                  </div>

                  {selectedRecipientId === 'new' && (
                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                      <input 
                        type="checkbox" 
                        checked={saveRecipientForFuture} 
                        onChange={(e) => setSaveRecipientForFuture(e.target.checked)}
                        className="w-4 h-4 text-dpc-blue rounded"
                      />
                      <span className="text-sm text-text">Save recipient to My Account for future orders</span>
                    </label>
                  )}
                </div>

                <div className="flex gap-4 mt-8">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleNextFromRecipient}
                  >
                    Continue to Delivery Location
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: DELIVERY LOCATION & DATE */}
            {step === 3 && (
              <div className="bg-white rounded-xl p-6 md:p-8 border border-neutral-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-display font-bold text-navy flex items-center gap-2">
                    <Truck className="text-dpc-blue w-6 h-6" /> Delivery Location & Schedule
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">City / Delivery Zone in Kenya <span className="text-red-500">*</span></label>
                    <select 
                      className={`w-full p-3 border rounded-md focus:ring-dpc-blue focus:border-dpc-blue bg-white text-navy ${deliveryErrors.city ? 'border-red-500' : 'border-neutral-300'}`}
                      value={delivery.city}
                      onChange={(e) => {
                        setDelivery({...delivery, city: e.target.value});
                        if (deliveryErrors.city) setDeliveryErrors({...deliveryErrors, city: ''});
                      }}
                    >
                      <option value="">-- Select delivery zone --</option>
                      {deliveryZones.map(zone => (
                        <option key={zone.id} value={zone.name}>
                          {zone.name} — Fee: ${zone.fee.toFixed(2)} ({zone.estimatedTime})
                        </option>
                      ))}
                    </select>
                    {deliveryErrors.city && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {deliveryErrors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-dpc-blue" /> Requested Delivery Date <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date" 
                      className={`w-full p-3 border rounded-md focus:ring-dpc-blue focus:border-dpc-blue text-navy ${deliveryErrors.date ? 'border-red-500' : 'border-neutral-300'}`}
                      value={delivery.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setDelivery({...delivery, date: e.target.value});
                        if (deliveryErrors.date) setDeliveryErrors({...deliveryErrors, date: ''});
                      }}
                    />
                    {deliveryErrors.date && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {deliveryErrors.date}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Street Address / Estate / Landmark <span className="text-red-500">*</span></label>
                    <textarea 
                      className={`w-full p-3 border rounded-md focus:ring-dpc-blue focus:border-dpc-blue ${deliveryErrors.address ? 'border-red-500 bg-red-50/20' : 'border-neutral-300'}`}
                      value={delivery.address}
                      onChange={(e) => {
                        setDelivery({...delivery, address: e.target.value});
                        if (deliveryErrors.address) setDeliveryErrors({...deliveryErrors, address: ''});
                      }}
                      placeholder="e.g. House 14B, Greenpark Estate, Off Mombasa Road, Near Total Petrol Station"
                      rows={3}
                    />
                    {deliveryErrors.address && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {deliveryErrors.address}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Special Delivery Instructions / Gate Code (Optional)</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue"
                      value={delivery.notes}
                      onChange={(e) => setDelivery({...delivery, notes: e.target.value})}
                      placeholder="e.g. Please ring gate bell or call recipient upon arrival"
                    />
                  </div>

                  <div className="flex gap-4 mt-8">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button 
                      className="flex-1" 
                      onClick={handleNextFromDelivery}
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: PAYMENT OPTIONS & SIMULATION */}
            {step === 4 && (
              <div className="bg-white rounded-xl p-6 md:p-8 border border-neutral-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-display font-bold text-navy flex items-center gap-2">
                    <CreditCard className="text-dpc-blue w-6 h-6" /> Payment Method
                  </h2>
                  <span className="text-xs bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> SSL Encrypted
                  </span>
                </div>

                {/* QA Payment Testing Controls */}
                <div className="p-4 border-2 border-dashed border-indigo-200 bg-indigo-50/70 rounded-xl mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      🧪 QA Payment Simulation Controls
                    </span>
                    <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded font-mono">Test Sandbox</span>
                  </div>
                  <p className="text-xs text-indigo-800 mb-3">
                    Select a transaction test outcome to verify checkout behavior (Successful payment, Card decline / Insufficient funds, or Cancellation):
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${paymentSimulation === 'success' ? 'bg-white border-green-500 font-semibold text-green-800 shadow-xs' : 'bg-white/60 border-neutral-200 text-neutral-700 hover:bg-white'}`}>
                      <input 
                        type="radio" 
                        name="qaSimulation" 
                        checked={paymentSimulation === 'success'}
                        onChange={() => setPaymentSimulation('success')}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <span>🟢 1. Simulate Successful Payment</span>
                    </label>
                    <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${paymentSimulation === 'failed' ? 'bg-white border-red-500 font-semibold text-red-800 shadow-xs' : 'bg-white/60 border-neutral-200 text-neutral-700 hover:bg-white'}`}>
                      <input 
                        type="radio" 
                        name="qaSimulation" 
                        checked={paymentSimulation === 'failed'}
                        onChange={() => setPaymentSimulation('failed')}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span>🔴 2. Simulate Payment Failure (Card Decline)</span>
                    </label>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-4 mb-6">
                  <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-dpc-blue bg-blue-50/50 shadow-xs' : 'border-neutral-200 hover:bg-neutral-50'}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === 'card'} 
                      onChange={() => setPaymentMethod('card')}
                      className="text-dpc-blue" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-navy">Credit / Debit Card (Overseas or Local)</span>
                        <div className="flex gap-1.5 text-xs text-text-muted">
                          <span className="px-1.5 py-0.5 bg-neutral-200 rounded font-semibold text-[10px]">VISA</span>
                          <span className="px-1.5 py-0.5 bg-neutral-200 rounded font-semibold text-[10px]">MC</span>
                          <span className="px-1.5 py-0.5 bg-neutral-200 rounded font-semibold text-[10px]">AMEX</span>
                        </div>
                      </div>
                      <span className="block text-xs text-text-muted mt-0.5">Pay in USD, GBP, or EUR via secure Stripe checkout</span>
                    </div>
                  </label>

                  {paymentMethod === 'card' && (
                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-navy mb-1">Card Number</label>
                        <input 
                          type="text" 
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                          className="w-full p-2.5 text-sm border border-neutral-300 rounded-md bg-white font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-navy mb-1">Expiry Date</label>
                          <input 
                            type="text" 
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                            className="w-full p-2.5 text-sm border border-neutral-300 rounded-md bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-navy mb-1">CVC / CVV</label>
                          <input 
                            type="text" 
                            value={cardDetails.cvc}
                            onChange={(e) => setCardDetails({...cardDetails, cvc: e.target.value})}
                            className="w-full p-2.5 text-sm border border-neutral-300 rounded-md bg-white font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-navy mb-1">Cardholder Name</label>
                        <input 
                          type="text" 
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                          className="w-full p-2.5 text-sm border border-neutral-300 rounded-md bg-white"
                        />
                      </div>
                    </div>
                  )}

                  <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'mpesa' ? 'border-dpc-blue bg-blue-50/50 shadow-xs' : 'border-neutral-200 hover:bg-neutral-50'}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === 'mpesa'} 
                      onChange={() => setPaymentMethod('mpesa')}
                      className="text-dpc-blue" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-navy">M-Pesa Express (STK Push)</span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded">Instant Safaricom</span>
                      </div>
                      <span className="block text-xs text-text-muted mt-0.5">Receive prompt directly on your Kenyan phone</span>
                    </div>
                  </label>

                  {paymentMethod === 'mpesa' && (
                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                      <label className="block text-xs font-semibold text-navy mb-1">Safaricom Mobile Number</label>
                      <input 
                        type="tel" 
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder="07XX XXX XXX"
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-md bg-white font-mono"
                      />
                      <p className="text-xs text-text-muted">A prompt will pop up on this phone asking for your M-Pesa PIN.</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Button variant="outline" className="sm:w-1/3" onClick={() => setStep(3)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button 
                    variant="outline"
                    className="sm:w-1/3 text-amber-700 border-amber-300 hover:bg-amber-50"
                    onClick={handleCancelPayment}
                  >
                    <XCircle className="w-4 h-4 mr-1 text-amber-600" /> Cancel Payment
                  </Button>
                  <Button 
                    className="sm:w-1/3" 
                    onClick={() => setStep(5)}
                  >
                    Continue to Review
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW & CONFIRM */}
            {step === 5 && (
              <div className="bg-white rounded-xl p-6 md:p-8 border border-neutral-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-display font-bold text-navy">Review & Place Order</h2>
                  <span className="text-xs bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full border border-green-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Customer ≠ Recipient Verified
                  </span>
                </div>

                {/* Error Banner if simulation failed */}
                {paymentError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{paymentError}</p>
                      <div className="flex gap-3 mt-3">
                        <Button size="sm" variant="outline" onClick={() => setStep(4)}>
                          Change Payment Method
                        </Button>
                        <Button size="sm" onClick={() => { setPaymentSimulation('success'); handlePlaceOrder(); }}>
                          Switch to Success & Retry
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6 mb-8">
                  
                  {/* Customer vs Recipient Comparative Card */}
                  <div className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Purchaser Column */}
                      <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-navy flex items-center gap-1.5">
                            <User className="w-4 h-4 text-dpc-blue" /> Purchaser (Sender)
                          </h4>
                          <span className="text-[11px] font-semibold bg-blue-50 text-dpc-blue px-2 py-0.5 rounded">
                            Overseas Buyer
                          </span>
                        </div>
                        <p className="font-semibold text-navy">{customer.name}</p>
                        <p className="text-text-muted flex items-center gap-1 mt-1 text-xs">
                          <Mail className="w-3.5 h-3.5" /> {customer.email}
                        </p>
                        {customer.phone && (
                          <p className="text-text-muted flex items-center gap-1 mt-1 text-xs">
                            <Phone className="w-3.5 h-3.5" /> {customer.phone}
                          </p>
                        )}
                        <p className="text-[11px] text-neutral-400 mt-2 italic">Will receive billing receipt & tracking alerts</p>
                      </div>

                      {/* Recipient Column */}
                      <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-navy flex items-center gap-1.5">
                            <Gift className="w-4 h-4 text-green-600" /> Recipient (Kenya)
                          </h4>
                          <span className="text-[11px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded">
                            Delivery Contact
                          </span>
                        </div>
                        <p className="font-semibold text-navy">{recipient.name}</p>
                        <p className="text-text-muted flex items-center gap-1 mt-1 text-xs">
                          <Phone className="w-3.5 h-3.5" /> {recipient.phone}
                        </p>
                        <p className="text-text-muted flex items-center gap-1 mt-1 text-xs">
                          <MapPin className="w-3.5 h-3.5" /> {delivery.city}, Kenya
                        </p>
                        <p className="text-[11px] text-green-700 mt-2 font-medium">Local courier contact for delivery handover</p>
                      </div>

                      {/* Delivery Address & Schedule */}
                      <div className="col-span-1 md:col-span-2 bg-white p-4 rounded-lg border border-neutral-200 shadow-xs">
                        <h4 className="font-bold text-navy mb-1 flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-dpc-blue" /> Delivery Destination & Schedule
                        </h4>
                        <p className="text-sm text-text">{delivery.address}, {delivery.city}</p>
                        <p className="text-xs text-navy font-semibold mt-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-dpc-blue" /> Estimated Delivery Date: {new Date(delivery.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        {delivery.notes && (
                          <p className="text-xs text-text-muted italic mt-1.5 bg-neutral-50 p-2 rounded border border-neutral-200">
                            Note for driver: "{delivery.notes}"
                          </p>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Items Configuration Summary */}
                  <div className="border border-neutral-200 rounded-xl overflow-hidden">
                    <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 font-semibold text-sm text-navy">
                      Items & Configurations ({cartItemsWithDetails.length})
                    </div>
                    <div className="divide-y divide-neutral-200">
                      {cartItemsWithDetails.map(item => (
                        <div key={item.id} className="p-4 flex gap-4">
                          <img src={item.product?.images?.[0]} alt="" className="w-14 h-14 object-cover rounded-md border border-neutral-200 flex-shrink-0" />
                          <div className="flex-1 text-sm">
                            <div className="flex justify-between">
                              <span className="font-semibold text-navy">{item.product?.name}</span>
                              <span className="font-bold text-navy">${((item.product?.salePrice || item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-text-muted mt-1 space-y-0.5">
                              <p>Qty: {item.quantity}</p>
                              {item.recipient && <p className="font-medium text-purple-700">Gift For: {item.recipient}</p>}
                              {item.giftMessage && <p className="italic text-neutral-600">"{item.giftMessage}"</p>}
                              {item.includeGreetingCard && <p className="text-dpc-blue">+ Premium Greeting Card ($5.00)</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(4)} disabled={isProcessing}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 text-amber-700 border-amber-300 hover:bg-amber-50" 
                    onClick={handleCancelPayment}
                    disabled={isProcessing}
                  >
                    <XCircle className="w-4 h-4 mr-1 text-amber-600" /> Cancel Payment
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handlePlaceOrder}
                    disabled={isProcessing || hasOutOfStock}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Authorizing Payment...
                      </span>
                    ) : (
                      `Place Order ($${total.toFixed(2)})`
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* STEP 6: ORDER CONFIRMATION & TRACKING */}
            {step === 6 && (
              <div className="bg-white rounded-xl p-8 md:p-12 border border-neutral-200 shadow-sm text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs">
                  <Check className="w-10 h-10" />
                </div>
                
                <h2 className="text-3xl md:text-4xl font-display font-bold text-navy mb-2">Order Confirmed!</h2>
                <p className="text-text-muted mb-6 text-lg">
                  Thank you for your purchase. Your order <span className="font-bold text-navy">{placedOrderId}</span> has been confirmed.
                </p>

                <div className="max-w-xl mx-auto bg-neutral-50 rounded-xl p-6 border border-neutral-200 text-left mb-8 space-y-4">
                  <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                    <span className="text-sm font-semibold text-text-muted">Order Number</span>
                    <span className="font-mono font-bold text-dpc-blue text-base">{placedOrderId}</span>
                  </div>
                  
                  <div className="flex justify-between items-center border-b border-neutral-200 pb-3 text-sm">
                    <span className="text-text-muted">Purchaser (Receipts Sent To)</span>
                    <span className="font-medium text-navy">{customer.name} ({customer.email})</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-neutral-200 pb-3 text-sm">
                    <span className="text-text-muted">Recipient in Kenya</span>
                    <span className="font-medium text-navy">{recipient.name} ({recipient.phone})</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-neutral-200 pb-3 text-sm">
                    <span className="text-text-muted">Delivery Schedule</span>
                    <span className="font-medium text-navy">{delivery.city}, on {delivery.date}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="font-bold text-navy">Total Paid</span>
                    <span className="font-bold text-navy text-lg">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button variant="outline" size="lg" onClick={() => navigate('/shop')}>
                    Continue Shopping
                  </Button>
                  <Button size="lg" onClick={() => navigate(`/account?orderId=${placedOrderId}`)}>
                    Track Order in My Account
                  </Button>
                </div>
              </div>
            )}

          </div>

          {/* Right sidebar summary */}
          {step !== 6 && (
            <div className="lg:w-1/3">
              <div className="bg-white rounded-xl border border-neutral-200 p-6 sticky top-24 shadow-sm">
                <h3 className="text-lg font-display font-bold text-navy mb-4 border-b border-neutral-200 pb-4">
                  Order Summary
                </h3>
                
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                  {cartItemsWithDetails.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-12 bg-neutral-100 rounded overflow-hidden flex-shrink-0 border border-neutral-200">
                        <img src={item.product?.images?.[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-medium text-navy line-clamp-1">{item.product?.name}</p>
                        <p className="text-text-muted text-xs">Qty: {item.quantity}</p>
                        {item.recipient && <p className="text-[11px] text-purple-700">For: {item.recipient}</p>}
                      </div>
                      <div className="font-medium text-navy text-sm">
                        ${((item.product?.salePrice || item.product?.price || 0) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon / Promo Code Input */}
                <div className="border-t border-neutral-200 pt-4 mb-4">
                  {appliedCoupon ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{appliedCoupon.code}</span>
                          <span className="block text-xs text-emerald-700">
                            {appliedCoupon.type === 'PERCENTAGE' ? `${appliedCoupon.value}% OFF` : `$${appliedCoupon.value} OFF`} applied
                          </span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          removeCoupon();
                          setCouponFeedback(null);
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-navy mb-1.5 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-dpc-blue" /> Have a Promo Code?
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. WELCOME10" 
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            setCouponFeedback(null);
                          }}
                          className="flex-1 p-2 text-xs border border-neutral-300 rounded uppercase font-mono tracking-wider"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            if (!couponInput.trim()) return;
                            const res = applyCoupon(couponInput.trim(), subtotal);
                            if (res.success) {
                              setCouponFeedback({ type: 'success', message: res.message });
                              setCouponInput('');
                            } else {
                              setCouponFeedback({ type: 'error', message: res.message });
                            }
                          }}
                          className="px-3 py-1.5 bg-navy hover:bg-navy/90 text-white rounded text-xs font-semibold transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                      {couponFeedback && (
                        <p className={`text-[11px] mt-1.5 ${couponFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {couponFeedback.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-neutral-200 pt-4 space-y-2 text-sm text-text mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Zone ({delivery.city || 'Standard'})</span>
                    <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Fee</span>
                    <span className="font-medium">${serviceFee.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span className="font-medium">-${discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-neutral-200 pt-4 flex justify-between items-center text-lg">
                  <span className="font-bold text-navy">Total</span>
                  <span className="font-bold text-dpc-blue text-xl">${total.toFixed(2)}</span>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100 text-xs text-text-muted space-y-1">
                  <p className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span>Cross-border Diaspora guarantee</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-dpc-blue" />
                    <span>Real-time delivery SMS updates</span>
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
