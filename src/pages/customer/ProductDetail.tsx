import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Truck, Calendar, Gift, Heart, Plus, Minus, CheckCircle, Info, User } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { ProductCard } from '@/src/components/ui/ProductCard';
import { mockProducts, mockRecipients } from '@/src/lib/mockData';
import { useShop } from '@/src/contexts/ShopContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist } = useShop();
  
  const product = mockProducts.find(p => p.slug === slug);
  
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [includeCard, setIncludeCard] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-3xl font-display font-bold text-navy mb-4">Product Not Found</h2>
        <p className="text-text-muted mb-8">The product you are looking for does not exist or has been removed.</p>
        <Link to="/shop">
          <Button>Return to Shop</Button>
        </Link>
      </div>
    );
  }

  const productId = product.id || '';
  const isWishlisted = wishlist.includes(productId);

  const relatedProducts = mockProducts
    .filter(p => p.primaryCategoryId === product.primaryCategoryId && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    addToCart({
      productId,
      quantity,
      recipient: selectedRecipient,
      giftMessage,
      includeGreetingCard: includeCard,
      deliveryDate
    });
    navigate('/cart');
  };

  return (
    <div className="bg-neutral-bg min-h-screen pb-20">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-neutral-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center text-sm text-text-muted">
          <Link to="/" className="hover:text-dpc-blue">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-dpc-blue">Shop</Link>
          <span className="mx-2">/</span>
          <Link to={`/shop/category/${product.primaryCategoryId}`} className="hover:text-dpc-blue capitalize">
            {product.primaryCategoryId?.replace('-', ' ')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-navy font-medium truncate">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12 mb-20">
          
          {/* Left: Image Gallery */}
          <div className="lg:w-1/2">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-neutral-200 mb-4">
              <img 
                src={product.images?.[activeImage]} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isBestseller && <Badge className="bg-dpc-yellow text-navy">Bestseller</Badge>}
                {product.isNewArrival && <Badge className="bg-dpc-blue text-white">New</Badge>}
              </div>
              <button 
                onClick={() => toggleWishlist(productId)}
                className="absolute top-4 right-4 h-12 w-12 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-navy hover:text-red-500 transition-colors"
              >
                <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>
            
            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 flex-shrink-0 ${activeImage === idx ? 'border-dpc-blue' : 'border-transparent'}`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details & Forms */}
          <div className="lg:w-1/2 flex flex-col">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-navy mb-2">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              {product.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-dpc-yellow text-dpc-yellow" />
                  <span className="font-bold text-navy">{product.rating}</span>
                  <span className="text-text-muted">({product.reviewCount} reviews)</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                {product.availability === 'IN_STOCK' ? 'In Stock' : 'Pre-order'}
              </div>
            </div>

            <div className="text-3xl font-bold text-navy mb-6">
              ${product.price?.toFixed(2)}
            </div>

            <p className="text-text text-lg leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Whats Included */}
            {product.whatsIncluded && product.whatsIncluded.length > 0 && (
              <div className="mb-8 p-4 bg-white rounded-xl border border-neutral-200">
                <h3 className="font-semibold text-navy mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-dpc-blue" />
                  What's Included
                </h3>
                <ul className="space-y-2">
                  {product.whatsIncluded.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-text">
                      <span className="text-dpc-blue mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Delivery Info */}
            <div className="flex items-center gap-3 text-sm text-text-muted mb-8 pb-8 border-b border-neutral-200">
              <Truck className="w-5 h-5 text-dpc-blue" />
              <span>Delivers to: <span className="font-semibold text-navy">{product.deliveryZones?.join(', ')}</span></span>
            </div>

            {/* Configurator Form */}
            <div className="space-y-6 mb-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Delivery Date
                  </label>
                  <input 
                    type="date" 
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full border border-neutral-300 rounded-md p-3 text-navy focus:ring-dpc-blue focus:border-dpc-blue"
                  />
                </div>
                
                {/* Recipient Selection */}
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" /> Who is this for?
                  </label>
                  <select 
                    value={selectedRecipient}
                    onChange={(e) => setSelectedRecipient(e.target.value)}
                    className="w-full border border-neutral-300 rounded-md p-3 text-navy focus:ring-dpc-blue focus:border-dpc-blue"
                  >
                    <option value="">Select Recipient (Optional)</option>
                    <option value="mum">Mum</option>
                    <option value="dad">Dad</option>
                    <option value="partner">Partner</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Gift Message */}
              <div>
                <label className="block text-sm font-semibold text-navy mb-2 flex items-center gap-2">
                  <Gift className="w-4 h-4" /> Gift Message
                </label>
                <textarea 
                  rows={3}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Write a message to be included with your gift..."
                  className="w-full border border-neutral-300 rounded-md p-3 text-navy focus:ring-dpc-blue focus:border-dpc-blue resize-none"
                />
              </div>

              {/* Greeting Card Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-neutral-200 rounded-xl hover:bg-white transition-colors">
                <input 
                  type="checkbox" 
                  checked={includeCard}
                  onChange={(e) => setIncludeCard(e.target.checked)}
                  className="w-5 h-5 text-dpc-blue focus:ring-dpc-blue rounded"
                />
                <div className="flex-1">
                  <span className="block font-medium text-navy">Add a premium greeting card</span>
                  <span className="block text-sm text-text-muted">+$5.00</span>
                </div>
              </label>

            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <div className="flex items-center border border-neutral-300 rounded-md bg-white">
                <button 
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 text-navy hover:bg-neutral-100 transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="w-12 text-center font-bold text-navy">{quantity}</span>
                <button 
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 text-navy hover:bg-neutral-100 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <Button onClick={handleAddToCart} size="lg" className="flex-1 text-lg">
                Add to Cart
              </Button>
            </div>
            <p className="text-center text-sm text-text-muted mt-4">
              Secure payment processing. Delivery guaranteed.
            </p>

          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-neutral-200 pt-16">
            <h2 className="text-3xl font-display font-bold text-navy mb-8">You may also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(rp => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
