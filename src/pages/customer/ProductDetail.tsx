import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Truck, Calendar, Gift, Heart, Plus, Minus, CheckCircle, Info, User, AlertCircle, ShieldCheck, Send } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { ProductCard } from '@/src/components/ui/ProductCard';
import { STOREFRONT_RECIPIENTS } from '@/src/lib/storefrontConstants';
import { useShop } from '@/src/contexts/ShopContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { auth, db } from '@/src/lib/firebase';
import { collection, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { buildFirestoreErrorInfo, OperationType, stripUndefined } from '@/src/lib/firestoreErrors';
import { ProductReview } from '@/src/types';

interface SavedRecipientOption {
  id: string;
  name: string;
  city: string;
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, toggleWishlist, wishlist, convertPrice } = useShop();
  const { currentUser, login } = useAuth();
  
  const product = products.find(p => p.slug === slug || p.id === slug);
  
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [includeCard, setIncludeCard] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');

  // Saved Recipients & Live Reviews State
  const [savedRecipients, setSavedRecipients] = useState<SavedRecipientOption[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const productId = product?.id || '';

  useEffect(() => {
    if (!currentUser?.id || !auth.currentUser?.emailVerified) {
      setSavedRecipients([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, 'users', currentUser.id, 'recipients'),
      (snap) => {
        setSavedRecipients(
          snap.docs.map((d) => ({
            id: d.id,
            name: String(d.data().name || ''),
            city: String(d.data().city || ''),
          }))
        );
      },
      (err) => {
        console.warn('Unable to load saved recipients:', buildFirestoreErrorInfo(err, OperationType.LIST, `users/${currentUser.id}/recipients`));
      }
    );
    return () => unsub();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!productId) {
      setReviews([]);
      return;
    }
    const reviewsQuery = query(
      collection(db, 'productReviews'),
      where('productId', '==', productId)
    );
    const unsub = onSnapshot(
      reviewsQuery,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as ProductReview))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(list);
      },
      (err) => {
        console.warn('Product reviews listener unavailable:', buildFirestoreErrorInfo(err, OperationType.LIST, 'productReviews'));
      }
    );
    return () => unsub();
  }, [productId]);

  const liveReviewStats = useMemo(() => {
    if (reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length;
      return {
        rating: Number(avg.toFixed(1)),
        count: reviews.length,
      };
    }
    return {
      rating: product?.rating || 0,
      count: product?.reviewCount || 0,
    };
  }, [reviews, product?.rating, product?.reviewCount]);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-3xl font-display font-bold text-navy mb-4">Product Not Found</h2>
        <p className="text-text-muted mb-8">The product you are looking for does not exist or has been removed from our catalog.</p>
        <Link to="/shop">
          <Button>Return to Shop</Button>
        </Link>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(productId);
  const isOutOfStock = product.availability === 'OUT_OF_STOCK' || (typeof product.inventory === 'number' && product.inventory <= 0);
  const isLowStock = !isOutOfStock && typeof product.inventory === 'number' && product.inventory > 0 && product.inventory <= 5;

  const relatedProducts = products
    .filter(p => p.primaryCategoryId === product.primaryCategoryId && p.id !== product.id && p.status !== 'ARCHIVED')
    .slice(0, 4);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccess(false);

    if (!currentUser || !auth.currentUser || !auth.currentUser.emailVerified) {
      setReviewError('Please sign in with a verified Google account to submit a product review.');
      return;
    }

    const trimmedComment = reviewComment.trim();
    if (trimmedComment.length < 3 || trimmedComment.length > 2000) {
      setReviewError('Please write a review comment between 3 and 2,000 characters.');
      return;
    }

    setReviewSubmitting(true);
    try {
      let verifiedPurchase = false;
      try {
        const idToken = await auth.currentUser.getIdToken();
        const res = await fetch('/api/orders/my', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          const orders = Array.isArray(data.orders) ? data.orders : [];
          verifiedPurchase = orders.some(
            (ord: { items?: { productId?: string }[] }) =>
              Array.isArray(ord.items) && ord.items.some((item) => item.productId === productId)
          );
        }
      } catch {
        // Non-blocking fallback
      }

      const revId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const userName =
        `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
        currentUser.email.split('@')[0] ||
        'Verified Customer';

      const payload: ProductReview = stripUndefined({
        id: revId,
        productId,
        userId: currentUser.id,
        userName,
        rating: Math.min(5, Math.max(1, Math.round(reviewRating))),
        comment: trimmedComment,
        verifiedPurchase,
        createdAt: new Date().toISOString(),
      });

      await setDoc(doc(db, 'productReviews', revId), payload);
      setReviewComment('');
      setReviewRating(5);
      setReviewSuccess(true);
    } catch (err) {
      console.error('Review submission failed:', buildFirestoreErrorInfo(err, OperationType.CREATE, 'productReviews'));
      setReviewError('Unable to publish review right now. Please try again later.');
    } finally {
      setReviewSubmitting(false);
    }
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
                {isOutOfStock && <Badge className="bg-red-600 text-white">Out of Stock</Badge>}
                {isLowStock && <Badge className="bg-amber-600 text-white">Only {product.inventory} Left</Badge>}
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
              {liveReviewStats.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-dpc-yellow text-dpc-yellow" />
                  <span className="font-bold text-navy">{liveReviewStats.rating}</span>
                  <span className="text-text-muted">({liveReviewStats.count} {liveReviewStats.count === 1 ? 'review' : 'reviews'})</span>
                </div>
              )}
              {isOutOfStock ? (
                <div className="flex items-center gap-1.5 text-red-600 text-sm font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  Out of Stock
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-1.5 text-amber-700 text-sm font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  Low Stock ({product.inventory} left)
                </div>
              ) : (
                <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  In Stock &amp; Ready for Delivery
                </div>
              )}
            </div>

            <div className="text-3xl font-bold text-navy mb-6">
              {product.salePrice ? (
                <div className="flex items-center gap-3">
                  <span className="text-red-600">{convertPrice(product.salePrice)}</span>
                  <span className="text-xl text-text-muted line-through">{convertPrice(product.price || 0)}</span>
                </div>
              ) : (
                <span>{convertPrice(product.price || 0)}</span>
              )}
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
                    className="w-full border border-neutral-300 rounded-md p-3 text-navy focus:ring-dpc-blue focus:border-dpc-blue bg-white"
                  >
                    <option value="">Select Recipient (Optional)</option>
                    {savedRecipients.length > 0 && (
                      <optgroup label="My Saved Recipients in Kenya">
                        {savedRecipients.map((r) => (
                          <option key={r.id} value={`${r.name} (${r.city})`}>
                            {r.name} ({r.city})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Recipient Relationship">
                      {STOREFRONT_RECIPIENTS.map((rec) => (
                        <option key={rec.name} value={rec.name.toLowerCase()}>
                          {rec.name}
                        </option>
                      ))}
                      <option value="other">Other</option>
                    </optgroup>
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
                  <span className="block text-sm text-text-muted">+{convertPrice(5)}</span>
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
              <Button onClick={handleAddToCart} size="lg" className="flex-1 text-lg" disabled={isOutOfStock}>
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
            <p className="text-center text-sm text-text-muted mt-4">
              Secure payment processing. Delivery guaranteed.
            </p>

          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="border-t border-neutral-200 pt-14 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-2xl font-display font-bold text-navy">Customer Reviews</h2>
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl font-bold text-navy">
                    {liveReviewStats.rating > 0 ? liveReviewStats.rating.toFixed(1) : '—'}
                  </span>
                  <div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(liveReviewStats.rating)
                              ? 'fill-dpc-yellow text-dpc-yellow'
                              : 'text-neutral-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      Based on {liveReviewStats.count} {liveReviewStats.count === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h3 className="font-bold text-navy mb-3">Write a Review</h3>
                {!currentUser ? (
                  <div className="space-y-3 text-sm text-text-muted">
                    <p>Sign in with your Google account to share feedback about this gift.</p>
                    <Button size="sm" variant="outline" onClick={login}>
                      Sign in with Google
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-navy mb-1.5">Your Rating</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1"
                            aria-label={`Rate ${star} stars`}
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                star <= reviewRating
                                  ? 'fill-dpc-yellow text-dpc-yellow'
                                  : 'text-neutral-300 hover:text-dpc-yellow'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-navy mb-1.5">Your Review</label>
                      <textarea
                        rows={3}
                        required
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="How was the gift quality and Kenya delivery experience?"
                        className="w-full border border-neutral-300 rounded-md p-2.5 text-sm text-navy focus:ring-dpc-blue focus:border-dpc-blue"
                      />
                    </div>
                    {reviewError && <p className="text-xs text-red-600">{reviewError}</p>}
                    {reviewSuccess && (
                      <p className="text-xs text-emerald-700 font-medium">
                        Thank you! Your review has been published.
                      </p>
                    )}
                    <Button type="submit" size="sm" disabled={reviewSubmitting} className="w-full flex items-center justify-center gap-2">
                      <Send className="w-3.5 h-3.5" />
                      {reviewSubmitting ? 'Publishing...' : 'Publish Review'}
                    </Button>
                  </form>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {reviews.length === 0 ? (
                <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
                  <p className="text-navy font-semibold mb-1">No verified customer reviews submitted yet</p>
                  <p className="text-sm text-text-muted">Be the first diaspora sender to review this gift after delivery in Kenya.</p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="bg-white rounded-xl border border-neutral-200 p-6 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy">{rev.userName}</span>
                        {rev.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= rev.rating ? 'fill-dpc-yellow text-dpc-yellow' : 'text-neutral-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-text leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
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
