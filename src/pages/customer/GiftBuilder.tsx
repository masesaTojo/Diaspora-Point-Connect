import React, { useState } from 'react';
import { mockProducts, mockGiftBuilderConfig } from '@/src/lib/mockData';
import { Product } from '@/src/types';
import { PackageOpen, Gift, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { useShop } from '@/src/contexts/ShopContext';
import { useNavigate } from 'react-router-dom';

export default function GiftBuilder() {
  const { addToCart } = useShop();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [personalization, setPersonalization] = useState({ to: '', from: '', message: '' });

  const eligibleProducts = mockProducts.filter(p => mockGiftBuilderConfig.eligibleProductIds.includes(p.id));

  const toggleProduct = (product: Product) => {
    const isSelected = selectedProducts.find(p => p.id === product.id);
    if (isSelected) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      if (selectedProducts.length < mockGiftBuilderConfig.maxItems) {
        setSelectedProducts([...selectedProducts, product]);
      }
    }
  };

  const calculateSubtotal = () => selectedProducts.reduce((sum, p) => sum + (p.salePrice || p.price), 0);
  const discount = (calculateSubtotal() * mockGiftBuilderConfig.bundleDiscountPercentage) / 100;
  const total = calculateSubtotal() - discount;

  const handleAddToCart = () => {
    // In a real app, we might add this as a single "Bundle" item, but for now we'll add items individually 
    // or as a grouped item structure if supported. We'll simulate adding the items.
    selectedProducts.forEach(p => {
      addToCart({
        id: `bundle-${Date.now()}-${p.id}`,
        productId: p.id,
        productName: `[Gift Box] ${p.name}`,
        price: (p.salePrice || p.price) * (1 - mockGiftBuilderConfig.bundleDiscountPercentage/100),
        quantity: 1,
        image: p.images[0],
        customMessage: personalization.message
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
          <p className="text-lg text-text-muted">Curate the perfect box for your loved ones. Get {mockGiftBuilderConfig.bundleDiscountPercentage}% off when you build a bundle!</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="lg:w-2/3">
            {step === 1 && (
              <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-neutral-200">
                <h2 className="text-2xl font-display font-bold text-navy mb-6">1. Select Items ({selectedProducts.length}/{mockGiftBuilderConfig.maxItems})</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {eligibleProducts.map(product => {
                    const isSelected = selectedProducts.find(p => p.id === product.id);
                    return (
                      <div 
                        key={product.id} 
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex gap-4 ${isSelected ? 'border-dpc-blue bg-blue-50/30' : 'border-neutral-200 hover:border-dpc-blue/50 bg-white'}`}
                        onClick={() => toggleProduct(product)}
                      >
                        <div className="w-24 h-24 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-navy leading-tight mb-1">{product.name}</h3>
                            <div className="text-dpc-blue font-bold">${(product.salePrice || product.price).toFixed(2)}</div>
                          </div>
                          <div className="self-end">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-dpc-blue border-dpc-blue text-white' : 'border-neutral-300 text-transparent'}`}>
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
                    disabled={selectedProducts.length < mockGiftBuilderConfig.minItems}
                    className="flex items-center gap-2"
                  >
                    Continue to Personalize <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                {selectedProducts.length < mockGiftBuilderConfig.minItems && (
                  <p className="text-right text-sm text-red-500 mt-2">Select at least {mockGiftBuilderConfig.minItems} items to continue.</p>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-neutral-200">
                <h2 className="text-2xl font-display font-bold text-navy mb-6">2. Add a Personal Note</h2>
                
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-sm font-semibold text-navy mb-1">To</label>
                    <input type="text" className="w-full p-3 border border-neutral-300 rounded-md" placeholder="Recipient Name" value={personalization.to} onChange={e => setPersonalization({...personalization, to: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-navy mb-1">From</label>
                    <input type="text" className="w-full p-3 border border-neutral-300 rounded-md" placeholder="Your Name" value={personalization.from} onChange={e => setPersonalization({...personalization, from: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-navy mb-1">Message</label>
                    <textarea rows={4} className="w-full p-3 border border-neutral-300 rounded-md" placeholder="Write something sweet..." value={personalization.message} onChange={e => setPersonalization({...personalization, message: e.target.value})}></textarea>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={handleAddToCart} className="flex items-center gap-2 text-lg px-8">
                    <Gift className="w-5 h-5" /> Add Box to Cart
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sticky top-24">
              <h3 className="font-display font-bold text-xl text-navy mb-4 border-b border-neutral-200 pb-4">Your Custom Box</h3>
              
              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <PackageOpen className="w-12 h-12 mx-auto text-neutral-300 mb-2" />
                  <p>Your box is empty.</p>
                  <p className="text-sm">Select items to start building.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                    {selectedProducts.map(p => (
                      <div key={p.id} className="flex gap-3">
                        <img src={p.images[0]} alt="" className="w-12 h-12 object-cover rounded bg-neutral-100 shrink-0" />
                        <div className="flex-1 text-sm">
                          <p className="font-bold text-navy line-clamp-1">{p.name}</p>
                          <p className="text-dpc-blue font-medium">${(p.salePrice || p.price).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-neutral-200 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-text-muted">
                      <span>Subtotal</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Bundle Discount (10%)</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg text-navy pt-2 border-t border-neutral-100">
                      <span>Box Total</span>
                      <span>${total.toFixed(2)}</span>
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
