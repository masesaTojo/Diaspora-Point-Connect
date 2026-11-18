import React, { useState, useEffect } from 'react';
import { Product } from '@/src/types';
import { PackageOpen, Gift, Check, ArrowRight, User } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { useShop } from '@/src/contexts/ShopContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { auth, db } from '@/src/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

interface SavedRecipientQuick {
  id: string;
  name: string;
  city: string;
}

export default function GiftBuilder() {
  const { addToCart, products, giftConfig, convertPrice } = useShop();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [personalization, setPersonalization] = useState({ to: '', from: '', message: '' });
  const [savedRecipients, setSavedRecipients] = useState<SavedRecipientQuick[]>([]);

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
      () => {
        // Non-blocking fallback
      }
    );
    return () => unsub();
  }, [currentUser?.id]);

  const activeConfig = giftConfig;
  const minItems = activeConfig.minItems ?? 1;
  const maxItems = activeConfig.maxItems ?? 5;
  const discountPct = activeConfig.bundleDiscountPercentage ?? 0;

  if (!activeConfig.isActive) {
    return (
      <div className="bg-neutral-50 min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-neutral-200 p-8 text-center shadow-sm">
          <PackageOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-navy mb-2">Custom Gift Builder Paused</h1>
          <p className="text-sm text-text-muted mb-6">
            The custom gift hamper builder is currently unavailable. Explore our ready-curated hampers and gifts instead.
          </p>
          <Link to="/shop">
            <Button>Browse Gift Catalog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const eligibleProducts = products.filter(
    (p) =>
      p.status !== 'ARCHIVED' &&
      p.availability !== 'OUT_OF_STOCK' &&
      (typeof p.inventory !== 'number' || p.inventory > 0) &&
      (activeConfig.eligibleProductIds?.length ? activeConfig.eligibleProductIds.includes(p.id) : true)
  );

  const toggleProduct = (product: Partial<Product>) => {
    const isSelected = selectedProducts.find((p) => p.id === product.id);
    if (isSelected) {
      setSelectedProducts(selectedProducts.filter((p) => p.id !== product.id));
    } else {
      if (selectedProducts.length < maxItems) {
        setSelectedProducts([...selectedProducts, product as Product]);
      }
    }
  };

  const calculateSubtotal = () =>
    selectedProducts.reduce((sum, p) => sum + (p.salePrice || p.price || 0), 0);
  const discount = (calculateSubtotal() * discountPct) / 100;
  const total = calculateSubtotal() - discount;

  const handleAddToCart = () => {
    selectedProducts.forEach((p) => {
      addToCart({
        productId: p.id,
        quantity: 1,
        recipient: personalization.to || undefined,
        giftMessage: personalization.message
          ? `${personalization.message}${personalization.from ? ` (From: ${personalization.from})` : ''}`
          : undefined,
        includeGreetingCard: true,
      });
    });
    navigate('/cart');
  };

  return (
    <div className="bg-neutral-50 min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-dpc-gold/20 text-dpc-gold rounded-full mb-4">
            <PackageOpen className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-display font-bold text-navy mb-4">Custom Gift Builder</h1>
          <p className="text-lg text-text-muted">
            Curate the perfect box for your loved ones.{' '}
            {discountPct > 0 ? `Get ${discountPct}% off when you build a bundle!` : 'Personalize every item for Kenya delivery.'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            {step === 1 && (
              <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-neutral-200">
                <h2 className="text-2xl font-display font-bold text-navy mb-6">
                  1. Select Items ({selectedProducts.length}/{maxItems})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {eligibleProducts.map((product) => {
                    const isSelected = selectedProducts.find((p) => p.id === product.id);
                    return (
                      <div
                        key={product.id}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex gap-4 ${
                          isSelected
                            ? 'border-dpc-blue bg-blue-50/30'
                            : 'border-neutral-200 hover:border-dpc-blue/50 bg-white'
                        }`}
                        onClick={() => toggleProduct(product)}
                      >
                        <div className="w-24 h-24 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-navy leading-tight mb-1">{product.name}</h3>
                            <div className="text-dpc-blue font-bold">
                              {convertPrice(product.salePrice || product.price)}
                            </div>
                          </div>
                          <div className="self-end">
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? 'bg-dpc-blue border-dpc-blue text-white'
                                  : 'border-neutral-300 text-transparent'
                              }`}
                            >
                              <Check className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={selectedProducts.length < minItems}
                    className="flex items-center gap-2"
                  >
                    Continue to Personalize <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                {selectedProducts.length < minItems && (
                  <p className="text-right text-sm text-red-500 mt-2">
                    Select at least {minItems} items to continue.
                  </p>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-neutral-200">
                <h2 className="text-2xl font-display font-bold text-navy mb-6">2. Add a Personal Note</h2>

                <div className="space-y-4 max-w-lg">
                  {savedRecipients.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-navy mb-2 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-dpc-blue" /> Quick Select Saved Recipient in Kenya
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {savedRecipients.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setPersonalization({ ...personalization, to: r.name })}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                              personalization.to === r.name
                                ? 'bg-dpc-blue text-white border-dpc-blue'
                                : 'bg-neutral-50 text-navy border-neutral-200 hover:border-dpc-blue'
                            }`}
                          >
                            {r.name} ({r.city})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-navy mb-1">To</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-neutral-300 rounded-md"
                      placeholder="Recipient Name"
                      value={personalization.to}
                      onChange={(e) => setPersonalization({ ...personalization, to: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-navy mb-1">From</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-neutral-300 rounded-md"
                      placeholder="Your Name"
                      value={personalization.from}
                      onChange={(e) => setPersonalization({ ...personalization, from: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-navy mb-1">Message</label>
                    <textarea
                      rows={4}
                      className="w-full p-3 border border-neutral-300 rounded-md"
                      placeholder="Write something sweet..."
                      value={personalization.message}
                      onChange={(e) => setPersonalization({ ...personalization, message: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={handleAddToCart} className="flex items-center gap-2 text-lg px-8">
                    <Gift className="w-5 h-5" /> Add Box to Cart
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sticky top-24">
              <h3 className="font-display font-bold text-xl text-navy mb-4 border-b border-neutral-200 pb-4">
                Your Custom Box
              </h3>

              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <PackageOpen className="w-12 h-12 mx-auto text-neutral-300 mb-2" />
                  <p>Your box is empty.</p>
                  <p className="text-sm">Select items to start building.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                    {selectedProducts.map((p) => (
                      <div key={p.id} className="flex gap-3">
                        <img
                          src={p.images[0]}
                          alt=""
                          className="w-12 h-12 object-cover rounded bg-neutral-100 shrink-0"
                        />
                        <div className="flex-1 text-sm">
                          <p className="font-bold text-navy line-clamp-1">{p.name}</p>
                          <p className="text-dpc-blue font-medium">
                            {convertPrice(p.salePrice || p.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-neutral-200 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-text-muted">
                      <span>Subtotal</span>
                      <span>{convertPrice(calculateSubtotal())}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Bundle Discount ({discountPct}%)</span>
                        <span>-{convertPrice(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg text-navy pt-2 border-t border-neutral-100">
                      <span>Box Total</span>
                      <span>{convertPrice(total)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
