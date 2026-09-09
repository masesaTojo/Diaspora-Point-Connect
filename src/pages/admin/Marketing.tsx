import React, { useState, useEffect } from 'react';
import { Promotion, Coupon } from '@/src/types';
import { getStoredPromotions, saveStoredPromotions, getStoredCoupons, saveStoredCoupons } from '@/src/lib/adminStorage';
import { mockCampaigns } from '@/src/lib/mockData';
import { Tag, Ticket, Megaphone, Plus, Edit, Trash2, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function Marketing() {
  const [activeTab, setActiveTab] = useState<'promotions' | 'coupons' | 'campaigns'>('promotions');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>(mockCampaigns);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Promotion modal
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoForm, setPromoForm] = useState({
    name: '',
    type: 'PERCENTAGE' as Promotion['type'],
    discountValue: 15,
    minSpend: 50,
    isActive: true
  });

  // Add Coupon modal
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountValue: 10,
    isPercentage: true,
    minSpend: 0,
    usageLimit: 100,
    isActive: true
  });

  useEffect(() => {
    setPromotions(getStoredPromotions());
    setCoupons(getStoredCoupons());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    if (activeTab === 'promotions') {
      setPromoForm({
        name: '',
        type: 'PERCENTAGE',
        discountValue: 15,
        minSpend: 50,
        isActive: true
      });
      setIsPromoModalOpen(true);
    } else if (activeTab === 'coupons') {
      setCouponForm({
        code: '',
        discountValue: 10,
        isPercentage: true,
        minSpend: 0,
        usageLimit: 100,
        isActive: true
      });
      setIsCouponModalOpen(true);
    } else {
      showToast('Campaign management is active. Use existing campaign cards below.');
    }
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.name.trim()) return;

    const newPromo: Promotion = {
      id: `promo-${Date.now()}`,
      name: promoForm.name,
      type: promoForm.type,
      discountValue: promoForm.discountValue,
      conditions: { minSpend: promoForm.minSpend },
      isActive: promoForm.isActive
    };

    const updated = [newPromo, ...promotions];
    setPromotions(updated);
    saveStoredPromotions(updated);
    showToast(`Promotion "${newPromo.name}" created successfully.`);
    setIsPromoModalOpen(false);
  };

  const handleTogglePromoStatus = (promoId: string) => {
    const updated = promotions.map(p => p.id === promoId ? { ...p, isActive: !p.isActive } : p);
    setPromotions(updated);
    saveStoredPromotions(updated);
    showToast('Promotion status updated.');
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;

    const newCoupon: Coupon = {
      id: `cpn-${Date.now()}`,
      code: couponForm.code.trim().toUpperCase(),
      discountValue: couponForm.discountValue,
      isPercentage: couponForm.isPercentage,
      minSpend: couponForm.minSpend,
      usageLimit: couponForm.usageLimit,
      usedCount: 0,
      isActive: couponForm.isActive
    };

    const updated = [newCoupon, ...coupons];
    setCoupons(updated);
    saveStoredCoupons(updated);
    showToast(`Coupon code "${newCoupon.code}" added.`);
    setIsCouponModalOpen(false);
  };

  const handleToggleCouponStatus = (couponId: string) => {
    const updated = coupons.map(c => c.id === couponId ? { ...c, isActive: !c.isActive } : c);
    setCoupons(updated);
    saveStoredCoupons(updated);
    showToast('Coupon status updated.');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-navy-light text-sm font-medium animate-in fade-in slide-in-from-bottom-3">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Marketing & Promotions</h2>
          <p className="text-sm text-text-muted">Manage discounts, coupon codes, and diaspora seasonal campaigns.</p>
        </div>
        <Button onClick={handleOpenAdd} className="flex items-center gap-2 bg-dpc-blue hover:bg-dpc-blue/90 text-white font-bold">
          <Plus className="h-4 w-4" /> Add New {activeTab === 'coupons' ? 'Coupon' : 'Promotion'}
        </Button>
      </div>

      <div className="flex border-b border-neutral-200">
        <button
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'promotions' ? 'border-dpc-blue text-dpc-blue' : 'border-transparent text-text-muted hover:text-navy'}`}
          onClick={() => setActiveTab('promotions')}
        >
          <Tag className="w-4 h-4" /> Promotions ({promotions.length})
        </button>
        <button
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'coupons' ? 'border-dpc-blue text-dpc-blue' : 'border-transparent text-text-muted hover:text-navy'}`}
          onClick={() => setActiveTab('coupons')}
        >
          <Ticket className="w-4 h-4" /> Coupons ({coupons.length})
        </button>
        <button
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'campaigns' ? 'border-dpc-blue text-dpc-blue' : 'border-transparent text-text-muted hover:text-navy'}`}
          onClick={() => setActiveTab('campaigns')}
        >
          <Megaphone className="w-4 h-4" /> Campaigns ({campaigns.length})
        </button>
      </div>

      {activeTab === 'promotions' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-navy font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Discount</th>
                <th className="px-6 py-4">Conditions</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {promotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 font-bold text-navy">{promo.name}</td>
                  <td className="px-6 py-4 font-mono text-xs">{promo.type}</td>
                  <td className="px-6 py-4 font-semibold text-dpc-blue">
                    {promo.type === 'PERCENTAGE' ? `${promo.discountValue}%` : `$${promo.discountValue}`}
                  </td>
                  <td className="px-6 py-4 text-text-muted">
                    {promo.conditions?.minSpend ? `Min Spend: $${promo.conditions.minSpend}` : 'No minimum'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${promo.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleTogglePromoStatus(promo.id)}
                      className="text-xs"
                    >
                      {promo.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'coupons' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-navy font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Discount</th>
                <th className="px-6 py-4">Usage</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 font-bold text-navy font-mono text-base">{coupon.code}</td>
                  <td className="px-6 py-4 font-semibold text-dpc-blue">
                    {coupon.isPercentage ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                    {coupon.minSpend > 0 && <span className="text-xs text-text-muted block">Min ${coupon.minSpend}</span>}
                  </td>
                  <td className="px-6 py-4 text-text-muted text-xs">
                    {coupon.usedCount} / {coupon.usageLimit || '∞'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleToggleCouponStatus(coupon.id)}
                      className="text-xs"
                    >
                      {coupon.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign: any) => (
            <div key={campaign.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
              <div className="h-32 bg-neutral-200 relative">
                {campaign.heroImage && (
                  <img src={campaign.heroImage} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${campaign.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                    {campaign.isActive ? 'Active' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-navy text-base mb-1">{campaign.name}</h3>
                <p className="text-xs text-text-muted line-clamp-2 mb-4">{campaign.description}</p>
                <div className="flex justify-between items-center text-xs border-t border-neutral-100 pt-3">
                  <span className="text-text-muted">{campaign.productIds.length} Products</span>
                  <span className="font-semibold text-dpc-blue">Seasonal Spotlight</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Promotion Modal */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-neutral-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-4">
              <h3 className="text-lg font-bold text-navy">Create Promotion Rule</h3>
              <button onClick={() => setIsPromoModalOpen(false)} className="text-text-muted hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Promotion Title *</label>
                <input 
                  type="text" 
                  required
                  value={promoForm.name}
                  onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                  placeholder="e.g. Jamhuri Day Special 15% Off"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Discount Type</label>
                  <select 
                    value={promoForm.type}
                    onChange={(e) => setPromoForm({ ...promoForm, type: e.target.value as any })}
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Discount Value *</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={promoForm.discountValue}
                    onChange={(e) => setPromoForm({ ...promoForm, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Minimum Spend ($)</label>
                <input 
                  type="number" 
                  min="0"
                  value={promoForm.minSpend}
                  onChange={(e) => setPromoForm({ ...promoForm, minSpend: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs text-navy cursor-pointer pt-2">
                  <input 
                    type="checkbox" 
                    checked={promoForm.isActive}
                    onChange={(e) => setPromoForm({ ...promoForm, isActive: e.target.checked })}
                    className="rounded text-dpc-blue focus:ring-dpc-blue h-4 w-4"
                  />
                  <span>Active immediately upon creation</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <Button type="button" variant="outline" onClick={() => setIsPromoModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-dpc-blue hover:bg-dpc-blue/90 text-white font-bold">
                  Create Promotion
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-neutral-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-4">
              <h3 className="text-lg font-bold text-navy">Add Diaspora Coupon</h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-text-muted hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Coupon Code (Uppercase) *</label>
                <input 
                  type="text" 
                  required
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. DIASPORA2026"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg uppercase font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Type</label>
                  <select 
                    value={couponForm.isPercentage ? 'PCT' : 'FIXED'}
                    onChange={(e) => setCouponForm({ ...couponForm, isPercentage: e.target.value === 'PCT' })}
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg bg-white"
                  >
                    <option value="PCT">Percentage (%)</option>
                    <option value="FIXED">Fixed ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Discount Amount *</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Min Spend ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={couponForm.minSpend}
                    onChange={(e) => setCouponForm({ ...couponForm, minSpend: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Usage Limit</label>
                  <input 
                    type="number" 
                    min="1"
                    value={couponForm.usageLimit}
                    onChange={(e) => setCouponForm({ ...couponForm, usageLimit: parseInt(e.target.value) || 100 })}
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <Button type="button" variant="outline" onClick={() => setIsCouponModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-dpc-blue hover:bg-dpc-blue/90 text-white font-bold">
                  Save Coupon
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

