import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, AlertTriangle } from 'lucide-react';
import { useShop } from '@/src/contexts/ShopContext';
import { Button } from '@/src/components/ui/Button';

export default function Cart() {
  const { cart, products, removeFromCart, updateCartItem, convertPrice } = useShop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCancelled = searchParams.get('cancelled') === 'true';

  const cartItemsWithDetails = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      ...item,
      product
    };
  }).filter(item => item.product); // Filter out any invalid items

  const hasOutOfStock = cartItemsWithDetails.some(item => 
    item.product?.availability === 'OUT_OF_STOCK' || 
    (typeof item.product?.inventory === 'number' && item.product.inventory < item.quantity)
  );
  const subtotal = cartItemsWithDetails.reduce((sum, item) => {
    const price = item.product?.salePrice || item.product?.price || 0;
    const itemTotal = price * item.quantity;
    const cardCost = item.includeGreetingCard ? 5 * item.quantity : 0;
    return sum + itemTotal + cardCost;
  }, 0);

  const deliveryFee = subtotal > 0 ? 15 : 0; // Simple mock fee
  const serviceFee = subtotal > 0 ? 5 : 0;
  const discount = 0;
  const total = subtotal + deliveryFee + serviceFee - discount;

  if (cart.length === 0) {
    return (
      <div className="bg-neutral-bg min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-3xl font-display font-bold text-navy mb-4">Your Cart is Empty</h2>
        <p className="text-text-muted mb-8 max-w-md">Looks like you haven't added any gifts yet. Discover our premium selection of hampers, flowers, and more.</p>
        <Link to="/shop">
          <Button size="lg">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-neutral-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-navy mb-8">Your Gift Order</h1>
        
        {isCancelled && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Payment was cancelled</p>
              <p className="text-sm text-amber-700">Your gift items have been preserved in your cart. You can review your details and try again whenever you are ready.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart Items */}
          <div className="lg:w-2/3 space-y-6">
            {cartItemsWithDetails.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-6 flex flex-col sm:flex-row gap-6">
                
                {/* Product Image */}
                <div className="w-full sm:w-32 h-32 flex-shrink-0 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200">
                  <img 
                    src={item.product?.images?.[0]} 
                    alt={item.product?.name} 
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <Link to={`/product/${item.product?.slug}`} className="hover:text-dpc-blue transition-colors">
                      <h3 className="font-semibold text-lg text-navy">{item.product?.name}</h3>
                    </Link>
                    <div className="font-bold text-navy whitespace-nowrap">
                      {convertPrice((item.product?.salePrice || item.product?.price || 0) * item.quantity)}
                    </div>
                  </div>
                  
                  {/* Configuration Info */}
                  <div className="text-sm text-text-muted space-y-1 mb-4">
                    {item.recipient && <p><span className="font-medium text-navy">For:</span> {item.recipient}</p>}
                    {item.deliveryDate && <p><span className="font-medium text-navy">Date:</span> {new Date(item.deliveryDate).toLocaleDateString()}</p>}
                    {item.giftMessage && <p className="italic line-clamp-1">"{item.giftMessage}"</p>}
                    {item.includeGreetingCard && <p className="text-dpc-blue">+ Premium Greeting Card ({convertPrice(5 * item.quantity)})</p>}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center border border-neutral-300 rounded-md bg-white">
                      <button 
                        onClick={() => updateCartItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                        className="p-2 text-navy hover:bg-neutral-100 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-navy text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateCartItem(item.id, { quantity: item.quantity + 1 })}
                        className="p-2 text-navy hover:bg-neutral-100 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 sticky top-24 shadow-sm">
              <h2 className="text-xl font-display font-bold text-navy mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 text-sm text-text">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">{convertPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-medium">{convertPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Fee</span>
                  <span className="font-medium">{convertPrice(serviceFee)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-{convertPrice(discount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-200 pt-4 mb-6">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold text-navy">Total</span>
                  <span className="font-bold text-dpc-blue text-2xl">{convertPrice(total)}</span>
                </div>
                <p className="text-xs text-text-muted mt-1 text-right">Includes taxes</p>
              </div>

              {hasOutOfStock && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
                  One or more items in your cart are out of stock. Please remove them to proceed.
                </div>
              )}
              <Button disabled={hasOutOfStock} 
                className="w-full text-lg group" 
                size="lg"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <p className="text-center text-xs text-text-muted mt-4 flex items-center justify-center gap-1">
                <span>🔒 Secure checkout. We accept major credit cards and mobile money.</span>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
