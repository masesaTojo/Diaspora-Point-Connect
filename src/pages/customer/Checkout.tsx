import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useShop } from '@/src/contexts/ShopContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { auth, db } from '@/src/lib/firebase';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { buildFirestoreErrorInfo, OperationType } from '@/src/lib/firestoreErrors';
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
  Tag,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Order } from '@/src/types';

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
    currency,
    convertPrice,
  } = useShop();
  const { currentUser, emailVerified, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const callbackOrderId = searchParams.get('orderId') || searchParams.get('OrderMerchantReference') || '';
  const callbackTrackingId = searchParams.get('OrderTrackingId') || searchParams.get('trackingId') || '';
  const isPesaPalCallback =
    searchParams.get('pesapalCallback') === '1' || Boolean(callbackOrderId && callbackTrackingId);

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifyingCallback, setIsVerifyingCallback] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(() => callbackOrderId || null);
  const [pendingTrackingId, setPendingTrackingId] = useState<string | null>(() => callbackTrackingId || null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const [savedRecipients, setSavedRecipients] = useState<SavedRecipient[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('new');
  const [saveRecipientForFuture, setSaveRecipientForFuture] = useState(true);

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [customerErrors, setCustomerErrors] = useState<{ [key: string]: string }>({});

  const [recipient, setRecipient] = useState({
    name: '',
    phone: '',
  });
  const [recipientErrors, setRecipientErrors] = useState<{ [key: string]: string }>({});

  const getDefaultDeliveryDate = () => {
    const itemWithDate = cart.find((i) => i.deliveryDate);
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
    notes: '',
  });
  const [deliveryErrors, setDeliveryErrors] = useState<{ [key: string]: string }>({});

  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pendingVerificationNotice, setPendingVerificationNotice] = useState<string | null>(null);
  const hasAutoVerifiedRef = useRef(false);

  useEffect(() => {
    if (currentUser) {
      const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
      setCustomer((prev) => ({
        name: prev.name || fullName || currentUser.email.split('@')[0] || '',
        email: currentUser.email || prev.email,
        phone: prev.phone,
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.id || !emailVerified) {
      setSavedRecipients([]);
      return;
    }
    const recipientsPath = `users/${currentUser.id}/recipients`;
    const unsubscribe = onSnapshot(
      collection(db, 'users', currentUser.id, 'recipients'),
      (snapshot) => {
        setSavedRecipients(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SavedRecipient)));
      },
      (err) => {
        console.error(
          'Checkout recipients load error:',
          JSON.stringify(buildFirestoreErrorInfo(err, OperationType.LIST, recipientsPath))
        );
      }
    );
    return () => unsubscribe();
  }, [currentUser?.id, emailVerified]);

  const verifyPesaPalPayment = useCallback(
    async (orderIdToVerify: string, trackingIdToVerify?: string) => {
      if (!auth.currentUser) {
        setPaymentError('Please sign in with the Google account used to place this order to verify payment.');
        return;
      }

      setIsVerifyingCallback(true);
      setPaymentError(null);
      setPendingVerificationNotice(null);

      try {
        const idToken = await auth.currentUser.getIdToken();
        const res = await fetch('/api/payments/pesapal/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            orderId: orderIdToVerify,
            trackingId: trackingIdToVerify || undefined,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          confirmed?: boolean;
          paymentStatus?: string;
          statusDescription?: string;
          message?: string;
          order?: Order;
        };

        if (!res.ok) {
          setPaymentError(
            data.message || `Payment verification failed (${res.status}). Your order has NOT been confirmed.`
          );
          setStep(5);
          return;
        }

        if (data.confirmed && data.order && data.paymentStatus === 'PAID') {
          clearCart();
          setPlacedOrderId(data.order.id);
          setPlacedOrder(data.order);
          setPendingOrderId(null);
          setPendingTrackingId(null);
          setStep(6);
          return;
        }

        if (data.paymentStatus === 'PENDING') {
          setPendingOrderId(orderIdToVerify);
          if (trackingIdToVerify) setPendingTrackingId(trackingIdToVerify);
          setPendingVerificationNotice(
            `PesaPal reported status "${data.statusDescription || 'PENDING'}" for order ${orderIdToVerify}. Click "Re-check Payment Status" once payment completes.`
          );
          setStep(5);
          return;
        }

        setPaymentError(
          `Payment was not completed (status: ${data.statusDescription || data.paymentStatus || 'FAILED'}). Your cart has been preserved so you can retry.`
        );
        setStep(5);
      } catch (err) {
        setPaymentError(
          (err as Error)?.message || 'Network error while verifying payment with server. Please retry verification.'
        );
        setStep(5);
      } finally {
        setIsVerifyingCallback(false);
      }
    },
    [clearCart]
  );

  // Trigger automatic server-side verification once when returning from PesaPal callback URL
  useEffect(() => {
    if (
      isPesaPalCallback &&
      callbackOrderId &&
      !authLoading &&
      currentUser &&
      !hasAutoVerifiedRef.current
    ) {
      hasAutoVerifiedRef.current = true;
      setStep(5);
      verifyPesaPalPayment(callbackOrderId, callbackTrackingId || undefined);
    }
  }, [isPesaPalCallback, callbackOrderId, callbackTrackingId, authLoading, currentUser, verifyPesaPalPayment]);

  const cartItemsWithDetails = cart
    .map((item) => ({
      ...item,
      product: products.find((p) => p.id === item.productId),
    }))
    .filter((item) => item.product);

  const hasOutOfStock = cartItemsWithDetails.some(
    (item) =>
      item.product?.availability === 'OUT_OF_STOCK' ||
      (typeof item.product?.inventory === 'number' && item.product.inventory < item.quantity)
  );

  const distinctLineRecipients = Array.from(
    new Set(cart.map((item) => item.recipient).filter(Boolean) as string[])
  );

  const subtotal = cartItemsWithDetails.reduce((sum, item) => {
    const price = item.product?.salePrice || item.product?.price || 0;
    return sum + price * item.quantity + (item.includeGreetingCard ? 5 * item.quantity : 0);
  }, 0);

  const selectedZone = deliveryZones.find((z) => z.name === delivery.city);
  const deliveryFee = subtotal > 0 ? selectedZone?.fee ?? 10 : 0;
  const serviceFee = subtotal > 0 ? 5 : 0;

  let discount = 0;
  if (appliedCoupon) {
    const isPct = appliedCoupon.type === 'PERCENTAGE' || appliedCoupon.isPercentage;
    const val = appliedCoupon.value ?? appliedCoupon.discountValue ?? 0;
    discount = isPct ? (subtotal * val) / 100 : Math.min(subtotal, val);
  }
  const total = Math.max(0, subtotal + deliveryFee + serviceFee - discount);

  if (cart.length === 0 && step !== 6 && !isPesaPalCallback && !pendingOrderId) {
    return (
      <div className="bg-neutral-bg min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-3xl font-display font-bold text-navy mb-3">Your Cart is Empty</h2>
        <p className="text-text-muted mb-6 max-w-md">
          Please add items to your cart before proceeding to checkout.
        </p>
        <Button onClick={() => navigate('/shop')}>Explore Gifts</Button>
      </div>
    );
  }

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

  const handleNextFromCustomer = () => {
    if (!currentUser || !emailVerified) {
      setCustomerErrors({
        auth: 'Please sign in with a verified Google account to continue checkout.',
      });
      return;
    }
    if (validateCustomer()) {
      setStep(2);
    }
  };

  const handleNextFromRecipient = () => {
    if (validateRecipient()) {
      setStep(3);
    }
  };

  const persistRecipientIfRequested = async (cityVal: string, addressVal: string) => {
    if (
      selectedRecipientId === 'new' &&
      saveRecipientForFuture &&
      currentUser?.id &&
      emailVerified &&
      recipient.name &&
      recipient.phone
    ) {
      const recId = `rec-${Date.now()}`;
      const nowIso = new Date().toISOString();
      const newSaved: SavedRecipient = {
        id: recId,
        name: recipient.name.trim(),
        phone: recipient.phone.trim(),
        city: cityVal || 'Nairobi',
        address: addressVal.trim() || 'Kenya',
      };
      try {
        await setDoc(doc(db, 'users', currentUser.id, 'recipients', recId), {
          ...newSaved,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      } catch (err) {
        console.error(
          'Failed to save recipient to Firestore:',
          JSON.stringify(buildFirestoreErrorInfo(err, OperationType.WRITE, `users/${currentUser.id}/recipients/${recId}`))
        );
      }
    }
  };

  const handleNextFromDelivery = () => {
    if (validateDelivery()) {
      void persistRecipientIfRequested(delivery.city, delivery.address);
      setStep(4);
    }
  };

  const handleCancelPayment = () => {
    navigate('/cart?cancelled=true');
  };

  const handleProceedToPesaPal = async () => {
    setPaymentError(null);
    setPendingVerificationNotice(null);

    if (!auth.currentUser || !emailVerified) {
      setPaymentError('Please sign in with a verified Google account before completing payment.');
      setStep(1);
      return;
    }

    setIsProcessing(true);

    try {
      const idToken = await auth.currentUser.getIdToken();
      let targetOrderId = pendingOrderId;

      if (!targetOrderId) {
        const checkoutRes = await fetch('/api/orders/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            customer: {
              name: customer.name.trim(),
              email: customer.email.trim(),
              phone: customer.phone.trim() || undefined,
            },
            recipient: {
              name: recipient.name.trim(),
              phone: recipient.phone.trim(),
            },
            delivery: {
              address: delivery.address.trim(),
              city: delivery.city,
              date: delivery.date,
              notes: delivery.notes.trim() || undefined,
            },
            items: cart.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              recipient: item.recipient,
              giftMessage: item.giftMessage,
              includeGreetingCard: Boolean(item.includeGreetingCard),
            })),
            couponCode: appliedCoupon?.code || undefined,
            currency,
          }),
        });

        const checkoutData = (await checkoutRes.json().catch(() => ({}))) as {
          ok?: boolean;
          orderId?: string;
          message?: string;
        };

        if (!checkoutRes.ok || !checkoutData.orderId) {
          throw new Error(
            checkoutData.message || `Failed to persist pending order (${checkoutRes.status}).`
          );
        }

        targetOrderId = checkoutData.orderId;
        setPendingOrderId(targetOrderId);
      }

      const initRes = await fetch('/api/payments/pesapal/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ orderId: targetOrderId }),
      });

      const initData = (await initRes.json().catch(() => ({}))) as {
        ok?: boolean;
        trackingId?: string;
        redirectUrl?: string;
        code?: string;
        message?: string;
      };

      if (!initRes.ok || !initData.redirectUrl) {
        if (initData.trackingId) setPendingTrackingId(initData.trackingId);
        throw new Error(
          initData.message || `Unable to initialize PesaPal checkout (${initRes.status}).`
        );
      }

      if (initData.trackingId) {
        setPendingTrackingId(initData.trackingId);
      }

      window.location.assign(initData.redirectUrl);
    } catch (err) {
      setPaymentError(
        (err as Error)?.message ||
          'Unable to reach payment service. No payment was taken and your cart is intact.'
      );
      setIsProcessing(false);
    }
  };

  const StepIndicator = ({ number, title, current, completed }: any) => (
    <div
      className={`flex items-center gap-2 ${
        current ? 'text-dpc-blue font-bold' : completed ? 'text-green-600' : 'text-neutral-400'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${
          current
            ? 'border-dpc-blue bg-dpc-blue text-white shadow-sm'
            : completed
              ? 'border-green-600 bg-green-600 text-white'
              : 'border-neutral-300 bg-white text-neutral-400'
        }`}
      >
        {completed ? <Check className="w-4 h-4" /> : number}
      </div>
      <span
        className={`text-sm hidden sm:inline ${
          current ? 'text-navy font-bold' : completed ? 'text-navy font-medium' : 'text-text-muted'
        }`}
      >
        {title}
      </span>
    </div>
  );

  return (
    <div className="bg-neutral-bg min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4">
        {hasOutOfStock && step !== 6 && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Out-of-Stock Item in Cart</p>
              <p className="text-sm">
                One or more items in your cart are currently out of stock. Please return to your cart and remove them before completing checkout.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/cart')}>
              Return to Cart
            </Button>
          </div>
        )}

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
          <div className={step === 6 ? 'w-full' : 'lg:w-2/3'}>
            {/* STEP 1: CUSTOMER DETAILS */}
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

                {!authLoading && (!currentUser || !emailVerified) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-navy">Sign in required for verified checkout</p>
                        <p className="text-xs text-amber-900 mt-0.5">
                          Sign in with your Google account so your order, payment receipt, and delivery tracking stay protected.
                        </p>
                        {customerErrors.auth && (
                          <p className="text-xs text-red-600 font-semibold mt-1">{customerErrors.auth}</p>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={login} className="shrink-0">
                      Sign in with Google
                    </Button>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3.5 mb-6 text-sm text-blue-900">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-dpc-blue" /> Diaspora Purchaser Information
                  </p>
                  <p className="text-xs mt-1 text-blue-800">
                    Enter your contact details as the buyer. Your payment receipts, shipment tracking updates, and delivery confirmations will be sent to this email.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full p-3 border rounded-md focus:ring-dpc-blue focus:border-dpc-blue ${
                        customerErrors.name ? 'border-red-500 bg-red-50/20' : 'border-neutral-300'
                      }`}
                      value={customer.name}
                      onChange={(e) => {
                        setCustomer({ ...customer, name: e.target.value });
                        if (customerErrors.name) setCustomerErrors({ ...customerErrors, name: '' });
                      }}
                      placeholder="e.g. Sarah Wanjiku"
                    />
                    {customerErrors.name && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {customerErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      Your Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      className={`w-full p-3 border rounded-md focus:ring-dpc-blue focus:border-dpc-blue ${
                        customerErrors.email ? 'border-red-500 bg-red-50/20' : 'border-neutral-300'
                      }`}
                      value={customer.email}
                      onChange={(e) => {
                        setCustomer({ ...customer, email: e.target.value });
                        if (customerErrors.email) setCustomerErrors({ ...customerErrors, email: '' });
                      }}
                      placeholder="you@example.com"
                    />
                    {customerErrors.email && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {customerErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      Your International Phone Number
                    </label>
                    <input
                      type="tel"
                      className={`w-full p-3 border rounded-md focus:ring-dpc-blue focus:border-dpc-blue ${
                        customerErrors.phone ? 'border-red-500 bg-red-50/20' : 'border-neutral-300'
                      }`}
                      value={customer.phone}
                      onChange={(e) => {
                        setCustomer({ ...customer, phone: e.target.value });
                        if (customerErrors.phone) setCustomerErrors({ ...customerErrors, phone: '' });
                      }}
                      placeholder="e.g. +44 7911 123456 or +1 202 555 0192"
                    />
                    <p className="text-xs text-text-muted mt-1">Used for order queries and delivery milestone updates.</p>
                  </div>

                  <Button
                    className="w-full mt-6"
                    size="lg"
                    disabled={hasOutOfStock || !currentUser || !emailVerified}
                    onClick={handleNextFromCustomer}
                  >
                    Continue to Recipient Details
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: RECIPIENT DETAILS */}
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

                {distinctLineRecipients.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3.5 mb-6 text-sm text-purple-900">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-purple-600" /> Multiple Recipients Specified
                    </p>
                    <p className="text-xs mt-1 text-purple-800">
                      Your cart items include personalized gifts for:{' '}
                      <span className="font-bold">{distinctLineRecipients.join(', ')}</span>.
                    </p>
                  </div>
                )}

                {customer.name &&
                  recipient.name &&
                  customer.name.trim().toLowerCase() === recipient.name.trim().toLowerCase() && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 mb-6 text-sm text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Customer ≠ Recipient Reminder</p>
                        <p className="text-xs mt-1 text-amber-800">
                          You entered <span className="font-bold">{recipient.name}</span> for both purchaser and recipient. Ensure this is the local contact receiving the package in Kenya.
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
                          const r = savedRecipients.find((sr) => sr.id === val);
                          if (r) {
                            setRecipient({ name: r.name, phone: r.phone });
                            if (r.city)
                              setDelivery((prev) => ({
                                ...prev,
                                city: r.city,
                                address: r.address || prev.address,
                              }));
                          }
                        } else {
                          setRecipient({ name: '', phone: '' });
                        }
                      }}
                    >
                      <option value="new">+ Enter new recipient details</option>
                      {savedRecipients.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.phone}) - {r.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div
                  className={`space-y-4 ${
                    selectedRecipientId !== 'new' ? 'bg-neutral-50 p-4 rounded-lg border border-neutral-200' : ''
                  }`}
                >
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      Recipient Full Name in Kenya <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full p-3 border rounded-md focus:ring-dpc-blue focus:border-dpc-blue ${
                        recipientErrors.name ? 'border-red-500 bg-red-50/20' : 'border-neutral-300'
                      }`}
                      value={recipient.name}
                      onChange={(e) => {
                        setRecipient({ ...recipient, name: e.target.value });
                        if (recipientErrors.name) setRecipientErrors({ ...recipientErrors, name: '' });
                      }}
                      placeholder="e.g. Mary Wanjiku"
                    />
                    {recipientErrors.name && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {recipientErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      Recipient Local Phone (Kenya) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      className={`w-full p-3 border rounded-md focus:ring-dpc-blue focus:border-dpc-blue ${
                        recipientErrors.phone ? 'border-red-500 bg-red-50/20' : 'border-neutral-300'
                      }`}
                      value={recipient.phone}
                      onChange={(e) => {
                        setRecipient({ ...recipient, phone: e.target.value });
                        if (recipientErrors.phone) setRecipientErrors({ ...recipientErrors, phone: '' });
                      }}
                      placeholder="e.g. 0712 345 678 or +254 712 345 678"
                    />
                    {recipientErrors.phone ? (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {recipientErrors.phone}
                      </p>
                    ) : (
                      <p className="text-xs text-text-muted mt-1">
                        Required so our local dispatch courier can coordinate safe delivery.
                      </p>
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
                  <Button className="flex-1" onClick={handleNextFromRecipient}>
                    Continue to Delivery Location
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: DELIVERY LOCATION */}
            {step === 3 && (
              <div className="bg-white rounded-xl p-6 md:p-8 border border-neutral-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-display font-bold text-navy flex items-center gap-2">
                    <Truck className="text-dpc-blue w-6 h-6" /> Delivery Location & Schedule
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      City / Delivery Zone in Kenya <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`w-full p-3 border rounded-md focus:ring-dpc-blue focus:border-dpc-blue bg-white text-navy ${
                        deliveryErrors.city ? 'border-red-500' : 'border-neutral-300'
                      }`}
                      value={delivery.city}
                      onChange={(e) => {
                        setDelivery({ ...delivery, city: e.target.value });
                        if (deliveryErrors.city) setDeliveryErrors({ ...deliveryErrors, city: '' });
                      }}
                    >
                      <option value="">-- Select delivery zone --</option>
                      {deliveryZones.map((zone) => (
                        <option key={zone.id} value={zone.name}>
                          {zone.name} — Fee: {convertPrice(zone.fee)} ({zone.estimatedTime})
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
                      <Calendar className="w-4 h-4 text-dpc-blue" /> Requested Delivery Date{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className={`w-full p-3 border rounded-md focus:ring-dpc-blue focus:border-dpc-blue text-navy ${
                        deliveryErrors.date ? 'border-red-500' : 'border-neutral-300'
                      }`}
                      value={delivery.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setDelivery({ ...delivery, date: e.target.value });
                        if (deliveryErrors.date) setDeliveryErrors({ ...deliveryErrors, date: '' });
                      }}
                    />
                    {deliveryErrors.date && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {deliveryErrors.date}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      Street Address / Estate / Landmark <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className={`w-full p-3 border rounded-md focus:ring-dpc-blue focus:border-dpc-blue ${
                        deliveryErrors.address ? 'border-red-500 bg-red-50/20' : 'border-neutral-300'
                      }`}
                      value={delivery.address}
                      onChange={(e) => {
                        setDelivery({ ...delivery, address: e.target.value });
                        if (deliveryErrors.address) setDeliveryErrors({ ...deliveryErrors, address: '' });
                      }}
                      placeholder="e.g. House 14B, Greenpark Estate, Off Mombasa Road"
                      rows={3}
                    />
                    {deliveryErrors.address && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {deliveryErrors.address}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      Special Delivery Instructions / Gate Code (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue"
                      value={delivery.notes}
                      onChange={(e) => setDelivery({ ...delivery, notes: e.target.value })}
                      placeholder="e.g. Please ring gate bell or call recipient upon arrival"
                    />
                  </div>

                  <div className="flex gap-4 mt-8">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button className="flex-1" onClick={handleNextFromDelivery}>
                      Continue to Payment
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: PESAPAL VERIFIED GATEWAY */}
            {step === 4 && (
              <div className="bg-white rounded-xl p-6 md:p-8 border border-neutral-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-display font-bold text-navy flex items-center gap-2">
                    <CreditCard className="text-dpc-blue w-6 h-6" /> Secure Payment Gateway
                  </h2>
                  <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Server-Verified PesaPal v3
                  </span>
                </div>

                <div className="p-5 border-2 border-dpc-blue bg-blue-50/40 rounded-xl mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-navy text-base">
                      PesaPal Hosted Checkout (Card, M-Pesa, Airtel Money)
                    </span>
                    <div className="flex gap-1.5 text-xs text-navy font-semibold">
                      <span className="px-2 py-0.5 bg-white border border-neutral-200 rounded">VISA</span>
                      <span className="px-2 py-0.5 bg-white border border-neutral-200 rounded">MC</span>
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded">
                        M-PESA
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">
                    On the next step, your order total is verified on our server and saved as{' '}
                    <span className="font-semibold text-navy">PAYMENT_PENDING</span>. You will then be redirected to PesaPal&apos;s encrypted portal to pay via Visa/Mastercard, M-Pesa STK Push, or mobile wallet. Order confirmation and stock allocation happen automatically once PesaPal confirms settlement.
                  </p>
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
                  <Button className="sm:w-1/3" onClick={() => setStep(5)}>
                    Continue to Review
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW & PESAPAL SUBMISSION / VERIFICATION */}
            {step === 5 && (
              <div className="bg-white rounded-xl p-6 md:p-8 border border-neutral-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-display font-bold text-navy">Review &amp; Pay</h2>
                  <span className="text-xs bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full border border-green-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Server-Authoritative Total
                  </span>
                </div>

                {isVerifyingCallback && (
                  <div className="bg-blue-50 border border-blue-200 text-navy p-5 rounded-xl mb-6 flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-dpc-blue animate-spin flex-shrink-0" />
                    <div>
                      <p className="font-bold">Verifying payment with PesaPal...</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        Confirming settlement status and transaction amount for order {pendingOrderId || callbackOrderId}.
                      </p>
                    </div>
                  </div>
                )}

                {pendingVerificationNotice && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl mb-6 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{pendingVerificationNotice}</p>
                      <div className="flex flex-wrap gap-3 mt-3">
                        <Button
                          size="sm"
                          onClick={() =>
                            pendingOrderId && verifyPesaPalPayment(pendingOrderId, pendingTrackingId || undefined)
                          }
                          disabled={isVerifyingCallback}
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-check Payment Status
                        </Button>
                        {pendingOrderId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/account?orderId=${pendingOrderId}`)}
                          >
                            View Pending Order
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {paymentError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{paymentError}</p>
                      {pendingOrderId && (
                        <p className="text-xs text-red-700 mt-1">
                          Pending Order Reference: <span className="font-mono font-bold">{pendingOrderId}</span>{' '}
                          (status: PAYMENT_PENDING — not confirmed).
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-3">
                        {pendingOrderId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              verifyPesaPalPayment(pendingOrderId, pendingTrackingId || undefined)
                            }
                            disabled={isVerifyingCallback || isProcessing}
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Verify Payment Status
                          </Button>
                        )}
                        {pendingOrderId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/account?orderId=${pendingOrderId}`)}
                          >
                            View Order in Account
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {cartItemsWithDetails.length > 0 && (
                  <div className="space-y-6 mb-8">
                    <div className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        </div>

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
                        </div>

                        <div className="col-span-1 md:col-span-2 bg-white p-4 rounded-lg border border-neutral-200 shadow-xs">
                          <h4 className="font-bold text-navy mb-1 flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-dpc-blue" /> Delivery Destination &amp; Schedule
                          </h4>
                          <p className="text-sm text-text">
                            {delivery.address}, {delivery.city}
                          </p>
                          <p className="text-xs text-navy font-semibold mt-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-dpc-blue" /> Estimated Delivery Date:{' '}
                            {new Date(delivery.date).toLocaleDateString(undefined, {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          {delivery.notes && (
                            <p className="text-xs text-text-muted italic mt-1.5 bg-neutral-50 p-2 rounded border border-neutral-200">
                              Note for driver: &quot;{delivery.notes}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border border-neutral-200 rounded-xl overflow-hidden">
                      <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 font-semibold text-sm text-navy">
                        Items &amp; Configurations ({cartItemsWithDetails.length})
                      </div>
                      <div className="divide-y divide-neutral-200">
                        {cartItemsWithDetails.map((item) => (
                          <div key={item.id} className="p-4 flex gap-4">
                            <img
                              src={item.product?.images?.[0]}
                              alt=""
                              className="w-14 h-14 object-cover rounded-md border border-neutral-200 flex-shrink-0"
                            />
                            <div className="flex-1 text-sm">
                              <div className="flex justify-between">
                                <span className="font-semibold text-navy">{item.product?.name}</span>
                                <span className="font-bold text-navy">
                                  {convertPrice((item.product?.salePrice || item.product?.price || 0) * item.quantity)}
                                </span>
                              </div>
                              <div className="text-xs text-text-muted mt-1 space-y-0.5">
                                <p>Qty: {item.quantity}</p>
                                {item.recipient && (
                                  <p className="font-medium text-purple-700">Gift For: {item.recipient}</p>
                                )}
                                {item.giftMessage && (
                                  <p className="italic text-neutral-600">&quot;{item.giftMessage}&quot;</p>
                                )}
                                {item.includeGreetingCard && (
                                  <p className="text-dpc-blue">
                                    + Premium Greeting Card ({convertPrice(5 * item.quantity)})
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(4)}
                    disabled={isProcessing || isVerifyingCallback}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                    onClick={handleCancelPayment}
                    disabled={isProcessing || isVerifyingCallback}
                  >
                    <XCircle className="w-4 h-4 mr-1 text-amber-600" /> Cancel Payment
                  </Button>
                  <Button
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={handleProceedToPesaPal}
                    disabled={isProcessing || isVerifyingCallback || hasOutOfStock || cart.length === 0}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Initializing PesaPal...
                      </span>
                    ) : (
                      <>
                        <span>Pay with PesaPal ({convertPrice(total)})</span>
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 6: VERIFIED ORDER CONFIRMATION */}
            {step === 6 && placedOrder && (
              <div className="bg-white rounded-xl p-8 md:p-12 border border-neutral-200 shadow-sm text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs">
                  <Check className="w-10 h-10" />
                </div>

                <h2 className="text-3xl md:text-4xl font-display font-bold text-navy mb-2">
                  Order Confirmed!
                </h2>
                <p className="text-text-muted mb-6 text-lg">
                  Payment verified via PesaPal. Your order{' '}
                  <span className="font-bold text-navy">{placedOrderId}</span> is now queued for fulfillment.
                </p>

                <div className="max-w-xl mx-auto bg-neutral-50 rounded-xl p-6 border border-neutral-200 text-left mb-8 space-y-4">
                  <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                    <span className="text-sm font-semibold text-text-muted">Order Number</span>
                    <span className="font-mono font-bold text-dpc-blue text-base">{placedOrder.id}</span>
                  </div>

                  {placedOrder.pesapalConfirmationCode && (
                    <div className="flex justify-between items-center border-b border-neutral-200 pb-3 text-sm">
                      <span className="text-text-muted">PesaPal Confirmation Code</span>
                      <span className="font-mono font-semibold text-emerald-700">
                        {placedOrder.pesapalConfirmationCode}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-b border-neutral-200 pb-3 text-sm">
                    <span className="text-text-muted">Purchaser (Receipts Sent To)</span>
                    <span className="font-medium text-navy">
                      {placedOrder.customerName} ({placedOrder.customerEmail})
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-neutral-200 pb-3 text-sm">
                    <span className="text-text-muted">Recipient in Kenya</span>
                    <span className="font-medium text-navy">
                      {placedOrder.recipientName} ({placedOrder.recipientPhone})
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-neutral-200 pb-3 text-sm">
                    <span className="text-text-muted">Delivery Schedule</span>
                    <span className="font-medium text-navy">
                      {placedOrder.deliveryCity}, on {placedOrder.deliveryDate}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="font-bold text-navy">Total Paid (USD Equivalent)</span>
                    <span className="font-bold text-navy text-lg">
                      ${placedOrder.total.toFixed(2)}
                      {placedOrder.paymentCurrency && placedOrder.paymentCurrency !== 'USD' && placedOrder.paymentAmount
                        ? ` (${placedOrder.paymentCurrency} ${placedOrder.paymentAmount.toFixed(2)})`
                        : ''}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button variant="outline" size="lg" onClick={() => navigate('/shop')}>
                    Continue Shopping
                  </Button>
                  <Button size="lg" onClick={() => navigate(`/account?orderId=${placedOrder.id}`)}>
                    Track Order in My Account
                  </Button>
                </div>
              </div>
            )}
          </div>

          {step !== 6 && (
            <div className="lg:w-1/3">
              <div className="bg-white rounded-xl border border-neutral-200 p-6 sticky top-24 shadow-sm">
                <h3 className="text-lg font-display font-bold text-navy mb-4 border-b border-neutral-200 pb-4">
                  Order Summary
                </h3>

                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                  {cartItemsWithDetails.map((item) => (
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
                        {convertPrice((item.product?.salePrice || item.product?.price || 0) * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-neutral-200 pt-4 mb-4">
                  {appliedCoupon ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                            {appliedCoupon.code}
                          </span>
                          <span className="block text-xs text-emerald-700">
                            {appliedCoupon.type === 'PERCENTAGE' || appliedCoupon.isPercentage
                              ? `${appliedCoupon.value ?? appliedCoupon.discountValue}% OFF`
                              : `${convertPrice(appliedCoupon.value ?? appliedCoupon.discountValue)} OFF`}{' '}
                            applied
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
                        <p
                          className={`text-[11px] mt-1.5 ${
                            couponFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {couponFeedback.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-neutral-200 pt-4 space-y-2 text-sm text-text mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium">{convertPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Zone ({delivery.city || 'Standard'})</span>
                    <span className="font-medium">{convertPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Fee</span>
                    <span className="font-medium">{convertPrice(serviceFee)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span className="font-medium">-{convertPrice(discount)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-neutral-200 pt-4 flex justify-between items-center text-lg">
                  <span className="font-bold text-navy">Total</span>
                  <span className="font-bold text-dpc-blue text-xl">{convertPrice(total)}</span>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100 text-xs text-text-muted space-y-1">
                  <p className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span>Server-verified payment &amp; pricing</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-dpc-blue" />
                    <span>Real-time delivery updates in My Account</span>
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
