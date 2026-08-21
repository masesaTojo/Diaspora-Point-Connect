import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '@/src/contexts/ShopContext';
import { mockProducts, mockDeliveryZones } from '@/src/lib/mockData';
import { Button } from '@/src/components/ui/Button';
import { Check, CreditCard, Truck, User } from 'lucide-react';
import { Order, OrderStatus } from '@/src/types';

interface SavedRecipient {
  id: string;
  name: string;
  phone: string;
  city: string;
  address: string;
}

export default function Checkout() {
  const { cart, clearCart } = useShop();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [savedRecipients, setSavedRecipients] = useState<SavedRecipient[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('new');

  useEffect(() => {
    const recipients = localStorage.getItem('dpc_recipients');
    if (recipients) {
      setSavedRecipients(JSON.parse(recipients));
    }
  }, []);

  // Form State
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [recipient, setRecipient] = useState({ name: '', phone: '' });
  const [delivery, setDelivery] = useState({ address: '', city: '', notes: '' });

  // Calculate totals
  const cartItemsWithDetails = cart.map(item => ({
    ...item,
    product: mockProducts.find(p => p.id === item.productId)
  })).filter(item => item.product);

  const subtotal = cartItemsWithDetails.reduce((sum, item) => {
    const price = item.product?.salePrice || item.product?.price || 0;
    return sum + (price * item.quantity) + (item.includeGreetingCard ? 5 * item.quantity : 0);
  }, 0);
  
  const selectedZone = mockDeliveryZones.find(z => z.name === delivery.city);
  const deliveryFee = subtotal > 0 ? (selectedZone?.fee || 15) : 0;
  const serviceFee = subtotal > 0 ? 5 : 0;
  const discount = 0;
  const total = subtotal + deliveryFee + serviceFee - discount;

  if (cart.length === 0 && step < 5 && step !== 6) {
    navigate('/cart');
    return null;
  }

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    // Mock network request
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real app, this would post to a backend to create the Order
    // and initiate the payment flow. For now, we mock success.
    
    // Example order object (not strictly saved anywhere persistently yet since no backend)
    const orderId = `DPC-${Math.floor(Math.random() * 100000)}`;
    const mockOrder: Partial<Order> = {
      id: orderId,
      customerEmail: customer.email,
      customerName: customer.name,
      recipientName: recipient.name,
      recipientPhone: recipient.phone,
      deliveryAddress: delivery.address,
      deliveryCity: delivery.city,
      status: 'CONFIRMED' as OrderStatus,
      items: cart.map(item => {
        const p = mockProducts.find(x => x.id === item.productId);
        return {
          ...item,
          productName: p?.name || 'Unknown',
          unitPrice: p?.salePrice || p?.price || 0,
          totalPrice: (p?.salePrice || p?.price || 0) * item.quantity
        };
      }),
      total,
      subtotal,
      deliveryFee,
      serviceFee,
      discount,
      createdAt: new Date().toISOString()
    };
    
    // Store in local storage to simulate "Order History"
    const existingOrders = JSON.parse(localStorage.getItem('dpc_orders') || '[]');
    localStorage.setItem('dpc_orders', JSON.stringify([mockOrder, ...existingOrders]));

    clearCart();
    setIsProcessing(false);
    setPlacedOrderId(orderId);
    setStep(6);
  };

  const StepIndicator = ({ number, title, current, completed }: any) => (
    <div className={`flex items-center gap-2 ${current ? 'text-dpc-blue' : completed ? 'text-green-600' : 'text-neutral-400'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 
        ${current ? 'border-dpc-blue bg-dpc-blue text-white' : completed ? 'border-green-600 bg-green-600 text-white' : 'border-neutral-300 bg-white'}`}>
        {completed ? <Check className="w-4 h-4" /> : number}
      </div>
      <span className={`font-semibold hidden md:block ${current ? 'text-navy' : ''}`}>{title}</span>
    </div>
  );

  return (
    <div className="bg-neutral-bg min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Checkout Header / Steps */}
        {step !== 6 && (
        <div className="bg-white rounded-xl p-4 sm:p-6 mb-8 border border-neutral-200 shadow-sm flex items-center justify-between overflow-x-auto">
          <StepIndicator number={1} title="Customer" current={step === 1} completed={step > 1} />
          <div className="h-px bg-neutral-200 flex-1 mx-4 min-w-[20px]"></div>
          <StepIndicator number={2} title="Recipient" current={step === 2} completed={step > 2} />
          <div className="h-px bg-neutral-200 flex-1 mx-4 min-w-[20px]"></div>
          <StepIndicator number={3} title="Delivery" current={step === 3} completed={step > 3} />
          <div className="h-px bg-neutral-200 flex-1 mx-4 min-w-[20px]"></div>
          <StepIndicator number={4} title="Payment" current={step === 4} completed={step > 4} />
          <div className="h-px bg-neutral-200 flex-1 mx-4 min-w-[20px]"></div>
          <StepIndicator number={5} title="Review" current={step === 5} completed={step > 5} />
        </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Form Area */}
          <div className={step === 6 ? "w-full" : "lg:w-2/3"}>
            
            {/* Step 1: Customer */}
            {step === 1 && (
              <div className="bg-white rounded-xl p-6 md:p-8 border border-neutral-200 shadow-sm">
                <h2 className="text-2xl font-display font-bold text-navy mb-6 flex items-center gap-2">
                  <User className="text-dpc-blue" /> Customer Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue"
                      value={customer.name}
                      onChange={(e) => setCustomer({...customer, name: e.target.value})}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue"
                      value={customer.email}
                      onChange={(e) => setCustomer({...customer, email: e.target.value})}
                      placeholder="For order receipts"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue"
                      value={customer.phone}
                      onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                      placeholder="Optional"
                    />
                  </div>
                  <Button 
                    className="w-full mt-6" 
                    size="lg"
                    disabled={!customer.name || !customer.email}
                    onClick={() => setStep(2)}
                  >
                    Continue to Recipient
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Recipient */}
            {step === 2 && (
              <div className="bg-white rounded-xl p-6 md:p-8 border border-neutral-200 shadow-sm">
                <h2 className="text-2xl font-display font-bold text-navy mb-6 flex items-center gap-2">
                  <User className="text-dpc-blue" /> Who is receiving this?
                </h2>
                
                {savedRecipients.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <label className="block text-sm font-medium text-navy">Select a saved recipient</label>
                    <select 
                      className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue bg-white"
                      value={selectedRecipientId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedRecipientId(val);
                        if (val !== 'new') {
                          const r = savedRecipients.find(sr => sr.id === val);
                          if (r) {
                            setRecipient({ name: r.name, phone: r.phone });
                            setDelivery(prev => ({ ...prev, city: r.city, address: r.address }));
                          }
                        } else {
                          setRecipient({ name: '', phone: '' });
                          setDelivery({ address: '', city: '', notes: '' });
                        }
                      }}
                    >
                      <option value="new">+ Enter new recipient details</option>
                      {savedRecipients.map(r => (
                        <option key={r.id} value={r.id}>{r.name} - {r.phone}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={`space-y-4 ${selectedRecipientId !== 'new' ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Recipient Name</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue"
                      value={recipient.name}
                      onChange={(e) => setRecipient({...recipient, name: e.target.value})}
                      placeholder="Their full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Recipient Local Phone (Kenya)</label>
                    <input 
                      type="tel" 
                      className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue"
                      value={recipient.phone}
                      onChange={(e) => setRecipient({...recipient, phone: e.target.value})}
                      placeholder="07XX XXX XXX"
                    />
                    <p className="text-xs text-text-muted mt-1">We need this to coordinate delivery.</p>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button 
                    className="flex-1" 
                    disabled={!recipient.name || !recipient.phone}
                    onClick={() => setStep(3)}
                  >
                    Continue to Delivery
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Delivery */}
            {step === 3 && (
              <div className="bg-white rounded-xl p-6 md:p-8 border border-neutral-200 shadow-sm">
                <h2 className="text-2xl font-display font-bold text-navy mb-6 flex items-center gap-2">
                  <Truck className="text-dpc-blue" /> Delivery Location
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">City/Town</label>
                    <select 
                      className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue bg-white"
                      value={delivery.city}
                      onChange={(e) => setDelivery({...delivery, city: e.target.value})}
                    >
                      <option value="">Select a delivery zone</option>
                      {mockDeliveryZones.map(zone => (
                        <option key={zone.id} value={zone.name}>{zone.name} (Delivery: ${zone.fee.toFixed(2)})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Street Address / Estate / Landmark</label>
                    <textarea 
                      className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue"
                      value={delivery.address}
                      onChange={(e) => setDelivery({...delivery, address: e.target.value})}
                      placeholder="e.g. House 4, Sunrise Estate, Off Ngong Road"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Special Delivery Instructions (Optional)</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue"
                      value={delivery.notes}
                      onChange={(e) => setDelivery({...delivery, notes: e.target.value})}
                      placeholder="Leave at reception, call upon arrival, etc."
                    />
                  </div>
                  <div className="flex gap-4 mt-6">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                    <Button 
                      className="flex-1" 
                      disabled={!delivery.city || !delivery.address}
                      onClick={() => setStep(4)}
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Payment Mock */}
            {step === 4 && (
              <div className="bg-white rounded-xl p-6 md:p-8 border border-neutral-200 shadow-sm">
                <h2 className="text-2xl font-display font-bold text-navy mb-6 flex items-center gap-2">
                  <CreditCard className="text-dpc-blue" /> Payment
                </h2>
                
                <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg mb-8 text-blue-900 text-sm">
                  <p className="font-semibold mb-1">Mock Payment Interface</p>
                  <p>In a production environment, this would integrate with Stripe, PayPal, or M-Pesa. For this demo, clicking "Place Order" will simulate a successful transaction.</p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-4 p-4 border border-dpc-blue bg-blue-50 rounded-lg cursor-pointer">
                    <input type="radio" name="payment" defaultChecked className="text-dpc-blue" />
                    <div>
                      <span className="block font-bold text-navy">Credit / Debit Card</span>
                      <span className="block text-sm text-text-muted">Processed securely via Stripe</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-4 p-4 border border-neutral-200 rounded-lg opacity-50 cursor-not-allowed">
                    <input type="radio" name="payment" disabled />
                    <div>
                      <span className="block font-bold text-navy">M-Pesa (Coming Soon)</span>
                      <span className="block text-sm text-text-muted">Pay directly from your mobile</span>
                    </div>
                  </label>
                </div>

                <div className="flex gap-4 mt-8">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Back</Button>
                  <Button 
                    className="flex-1" 
                    onClick={() => setStep(5)}
                  >
                    Continue to Review
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Review & Confirm */}
            {step === 5 && (
              <div className="bg-white rounded-xl p-6 md:p-8 border border-neutral-200 shadow-sm">
                <h2 className="text-2xl font-display font-bold text-navy mb-6">Review & Confirm</h2>
                
                <div className="space-y-6 mb-8">
                  <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-bold text-navy mb-1">Customer</h4>
                        <p>{customer.name}</p>
                        <p className="text-text-muted">{customer.email}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-navy mb-1">Recipient</h4>
                        <p>{recipient.name}</p>
                        <p className="text-text-muted">{recipient.phone}</p>
                      </div>
                      <div className="col-span-2">
                        <h4 className="font-bold text-navy mb-1">Delivery Address</h4>
                        <p>{delivery.address}, {delivery.city}</p>
                        {delivery.notes && <p className="text-text-muted italic mt-1 text-xs">Note: {delivery.notes}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(4)} disabled={isProcessing}>Back</Button>
                  <Button 
                    className="flex-1" 
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : `Place Order ($${total.toFixed(2)})`}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 6: Confirmation */}
            {step === 6 && (
              <div className="bg-white rounded-xl p-8 md:p-12 border border-neutral-200 shadow-sm text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-display font-bold text-navy mb-2">Order Confirmed!</h2>
                <p className="text-text-muted mb-8 text-lg">Thank you for your purchase. Your order <span className="font-bold">{placedOrderId}</span> has been placed successfully.</p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button variant="outline" onClick={() => navigate('/shop')}>Continue Shopping</Button>
                  <Button onClick={() => navigate('/account')}>Track Order Status</Button>
                </div>
              </div>
            )}

          </div>

          {/* Right sidebar summary */}
          {step !== 6 && (
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 sticky top-24 shadow-sm">
              <h3 className="text-lg font-display font-bold text-navy mb-4 border-b border-neutral-200 pb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                {cartItemsWithDetails.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                      <img src={item.product?.images?.[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-navy line-clamp-1">{item.product?.name}</p>
                      <p className="text-text-muted">Qty: {item.quantity}</p>
                    </div>
                    <div className="font-medium text-navy text-sm">
                      ${((item.product?.salePrice || item.product?.price || 0) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-neutral-200 pt-4 space-y-2 text-sm text-text mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Fee</span>
                  <span className="font-medium">${serviceFee.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-${discount.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="border-t border-neutral-200 pt-4 flex justify-between items-center text-lg">
                <span className="font-bold text-navy">Total</span>
                <span className="font-bold text-dpc-blue text-xl">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          )}

        </div>
      </div>
    </div>
  );
}
