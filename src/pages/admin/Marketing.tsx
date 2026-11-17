import React, { useState, useEffect } from 'react';
import { Campaign, Coupon, Promotion } from '@/src/types';
import { useAuth } from '@/src/contexts/AuthContext';
import { db } from '@/src/lib/firebase';
import { collection, doc, onSnapshot, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import { buildFirestoreErrorInfo, OperationType, stripUndefined } from '@/src/lib/firestoreErrors';
import { Tag, Ticket, Megaphone, Plus, Check, X } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function Marketing() {
  const { currentUser, logAction } = useAuth();
  const [activeTab, setActiveTab] = useState<'promotions' | 'coupons' | 'campaigns'>('promotions');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    if (!currentUser) return;

    const unsubPromos = onSnapshot(
      query(collection(db, 'promotions'), orderBy('name')),
      (snap) => {
        setPromotions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Promotion)));
      },
      (err) => {
        console.error('Promotions listener error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.LIST, 'promotions')));
      }
    );

    const unsubCoupons = onSnapshot(
      query(collection(db, 'coupons'), orderBy('code')),
      (snap) => {
        setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon)));
      },
      (err) => {
        console.error('Coupons listener error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.LIST, 'coupons')));
      }
    );

    const unsubCampaigns = onSnapshot(
      query(collection(db, 'campaigns'), orderBy('name')),
      (snap) => {
        setCampaigns(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Campaign)));
      },
      (err) => {
        console.error('Campaigns listener error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.LIST, 'campaigns')));
      }
    );

    return () => {
      unsubPromos();
      unsubCoupons();
      unsubCampaigns();
    };
  }, [currentUser]);

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
      showToast('Campaign management is active. Toggle campaign status on the cards below.');
    }
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.name.trim() || saving) return;

    setSaving(true);
    try {
      const promoId = `promo-${Date.now()}`;
      const newPromo: Promotion = stripUndefined({
        id: promoId,
        name: promoForm.name.trim(),
        type: promoForm.type,
        discountValue: Number(promoForm.discountValue),
        conditions: { minSpend: Number(promoForm.minSpend) || 0 },
        isActive: promoForm.isActive
      });

      await setDoc(doc(db, 'promotions', promoId), newPromo);
      await logAction('CREATE', 'Promotion', promoId, undefined, newPromo.name);
      showToast(`Promotion "${newPromo.name}" saved to Firestore.`);
      setIsPromoModalOpen(false);
    } catch (err) {
      console.error('Save promotion error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.WRITE, 'promotions')));
      showToast('Failed to save promotion.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePromoStatus = async (promo: Promotion) => {
    const nextState = !promo.isActive;
    try {
      await updateDoc(doc(db, 'promotions', promo.id), { isActive: nextState });
      await logAction('UPDATE', 'Promotion', promo.id, String(promo.isActive), String(nextState));
      showToast(`Promotion "${promo.name}" ${nextState ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      console.error('Toggle promotion error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.UPDATE, `promotions/${promo.id}`)));
      showToast('Failed to update promotion status.');
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim() || saving) return;

    setSaving(true);
    try {
      const couponId = `cpn-${Date.now()}`;
      const newCoupon: Coupon = stripUndefined({
        id: couponId,
        code: couponForm.code.trim().toUpperCase(),
        discountValue: Number(couponForm.discountValue),
        isPercentage: couponForm.isPercentage,
        minSpend: Number(couponForm.minSpend) || 0,
        usageLimit: Number(couponForm.usageLimit) || 100,
        usedCount: 0,
        isActive: couponForm.isActive
      });

      await setDoc(doc(db, 'coupons', couponId), newCoupon);
      await logAction('CREATE', 'Coupon', couponId, undefined, newCoupon.code);
      showToast(`Coupon code "${newCoupon.code}" saved to Firestore.`);
      setIsCouponModalOpen(false);
    } catch (err) {
      console.error('Save coupon error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.WRITE, 'coupons')));
      showToast('Failed to save coupon.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCouponStatus = async (coupon: Coupon) => {
    const nextState = !coupon.isActive;
    try {
      await updateDoc(doc(db, 'coupons', coupon.id), { isActive: nextState });
      await logAction('UPDATE', 'Coupon', coupon.id, String(coupon.isActive), String(nextState));
      showToast(`Coupon "${coupon.code}" ${nextState ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      console.error('Toggle coupon error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.UPDATE, `coupons/${coupon.id}`)));
      showToast('Failed to update coupon status.');
    }
  };

  const handleToggleCampaignStatus = async (campaign: Campaign) => {
    const nextState = !campaign.isActive;
    try {
      await updateDoc(doc(db, 'campaigns', campaign.id), { isActive: nextState });
      await logAction('UPDATE', 'Campaign', campaign.id, String(campaign.isActive), String(nextState));
      showToast(`Campaign "${campaign.name}" ${nextState ? 'activated' : 'paused'}.`);
    } catch (err) {
      console.error('Toggle campaign error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.UPDATE, `campaigns/${campaign.id}`)));
      showToast('Failed to update campaign status.');
    }
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
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    No promotions configured yet.
                  </td>
                </tr>
              ) : (
                promotions.map((promo) => (
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
                        onClick={() => handleTogglePromoStatus(promo)}
                        className="text-xs"
                      >
                        {promo.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
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
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    No coupon codes configured yet.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 font-bold text-navy font-mono text-base">{coupon.code}</td>
                    <td className="px-6 py-4 font-semibold text-dpc-blue">
                      {coupon.isPercentage ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                      {(coupon.minSpend ?? 0) > 0 && <span className="text-xs text-text-muted block">Min ${coupon.minSpend}</span>}
                    </td>
                    <td className="px-6 py-4 text-text-muted text-xs">
                      {coupon.usedCount || 0} / {coupon.usageLimit || '∞'}
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
                        onClick={() => handleToggleCouponStatus(coupon)}
                        className="text-xs"
                      >
                        {coupon.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'campaigns' && (
        campaigns.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center text-sm text-text-muted">
            No seasonal campaigns found in Firestore. Seed data in Database Setup or add campaigns.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
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
                    <span className="text-text-muted">{campaign.productIds?.length || 0} Products</span>
                    <button
                      onClick={() => handleToggleCampaignStatus(campaign)}
                      className="font-semibold text-dpc-blue hover:underline"
                    >
                      {campaign.isActive ? 'Set Draft' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
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
                <Button type="submit" disabled={saving} className="bg-dpc-blue hover:bg-dpc-blue/90 text-white font-bold">
                  {saving ? 'Saving...' : 'Create Promotion'}
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
                <Button type="submit" disabled={saving} className="bg-dpc-blue hover:bg-dpc-blue/90 text-white font-bold">
                  {saving ? 'Saving...' : 'Save Coupon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
