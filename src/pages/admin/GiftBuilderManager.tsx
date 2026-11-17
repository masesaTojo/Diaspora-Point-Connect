import React, { useState, useEffect } from 'react';
import { GiftBuilderConfig } from '@/src/types';
import { useShop } from '@/src/contexts/ShopContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { db } from '@/src/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { buildFirestoreErrorInfo, OperationType, stripUndefined } from '@/src/lib/firestoreErrors';
import { Settings, Plus, X, Package, Check, Layers } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function GiftBuilderManager() {
  const { products, giftConfig } = useShop();
  const { currentUser, logAction } = useAuth();
  const [config, setConfig] = useState<GiftBuilderConfig>(giftConfig);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Component add state
  const [newComponentName, setNewComponentName] = useState('');
  const [isAddingComponent, setIsAddingComponent] = useState(false);

  // Eligible products modal
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [poolSearch, setPoolSearch] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(
      doc(db, 'config', 'giftBuilder'),
      (snap) => {
        if (snap.exists()) {
          setConfig(snap.data() as GiftBuilderConfig);
        } else {
          setConfig(giftConfig);
        }
      },
      (err) => {
        console.error('GiftBuilder config listener error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.GET, 'config/giftBuilder')));
      }
    );
    return () => unsub();
  }, [currentUser, giftConfig]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const persistConfig = async (nextConfig: GiftBuilderConfig, auditDetail: string, toastMsg: string) => {
    setSaving(true);
    try {
      const cleanPayload = stripUndefined({
        eligibleProductIds: nextConfig.eligibleProductIds || [],
        components: nextConfig.components || [],
        minItems: Math.max(1, Number(nextConfig.minItems) || 1),
        maxItems: Math.max(1, Number(nextConfig.maxItems) || 1),
        bundleDiscountPercentage: Math.min(100, Math.max(0, Number(nextConfig.bundleDiscountPercentage) || 0)),
        isActive: Boolean(nextConfig.isActive),
      });
      await setDoc(doc(db, 'config', 'giftBuilder'), cleanPayload);
      await logAction('UPDATE', 'GiftBuilderConfig', 'giftBuilder', undefined, auditDetail);
      setConfig(cleanPayload);
      showToast(toastMsg);
    } catch (err) {
      console.error('GiftBuilder save error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.WRITE, 'config/giftBuilder')));
      showToast('Failed to update Gift Builder config in Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = () => {
    persistConfig(
      config,
      `min=${config.minItems}, max=${config.maxItems}, discount=${config.bundleDiscountPercentage ?? 0}%`,
      'Gift Builder configuration saved to Firestore.'
    );
  };

  const handleToggleActive = () => {
    const updated = { ...config, isActive: !config.isActive };
    persistConfig(
      updated,
      `isActive=${updated.isActive}`,
      updated.isActive ? 'Gift Builder is now active on storefront.' : 'Gift Builder deactivated.'
    );
  };

  const handleAddComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComponentName.trim()) return;
    const trimmed = newComponentName.trim();
    if ((config.components || []).includes(trimmed)) return;

    const updated = {
      ...config,
      components: [...(config.components || []), trimmed]
    };
    setNewComponentName('');
    setIsAddingComponent(false);
    persistConfig(updated, `added component "${trimmed}"`, `Added component step "${trimmed}".`);
  };

  const handleRemoveComponent = (compName: string) => {
    const updated = {
      ...config,
      components: (config.components || []).filter(c => c !== compName)
    };
    persistConfig(updated, `removed component "${compName}"`, `Removed "${compName}".`);
  };

  const toggleProductEligibility = (productId: string) => {
    const current = config.eligibleProductIds || [];
    const isSelected = current.includes(productId);
    const updatedIds = isSelected 
      ? current.filter(id => id !== productId)
      : [...current, productId];

    const updated = { ...config, eligibleProductIds: updatedIds };
    persistConfig(updated, `eligible products count=${updatedIds.length}`, 'Updated eligible products pool.');
  };

  const selectAllProducts = () => {
    const allIds = products.map(p => p.id);
    const updated = { ...config, eligibleProductIds: allIds };
    persistConfig(updated, `selected all ${allIds.length} products`, `Selected all ${allIds.length} products.`);
  };

  const clearAllProducts = () => {
    const updated = { ...config, eligibleProductIds: [] };
    persistConfig(updated, 'cleared all eligible products', 'Cleared eligible products list.');
  };

  const filteredPoolProducts = products.filter(p => 
    p.name.toLowerCase().includes(poolSearch.toLowerCase()) ||
    (p.primaryCategoryId || '').toLowerCase().includes(poolSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-navy-light text-sm font-medium animate-in fade-in slide-in-from-bottom-3">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Gift Builder Config</h2>
          <p className="text-sm text-text-muted">Configure the custom Kenyan gift curation builder for diaspora senders.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={config.isActive ? "outline" : "default"} 
            onClick={handleToggleActive}
            disabled={saving}
            className="border-neutral-300"
          >
            {config.isActive ? 'Deactivate Builder' : 'Activate Builder'}
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving} className="bg-dpc-blue hover:bg-dpc-blue/90 text-white font-bold">
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Rules & Discounting */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-navy flex items-center gap-2">
            <Settings className="w-5 h-5 text-dpc-blue" /> Step Rules & Discounting
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">Minimum Items Required in Custom Box</label>
              <input 
                type="number" 
                min="1"
                className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm" 
                value={config.minItems} 
                onChange={e => setConfig({...config, minItems: parseInt(e.target.value) || 1})} 
              />
              <p className="text-xs text-text-muted mt-1">Sender must choose at least this many items to checkout.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">Maximum Items Capacity</label>
              <input 
                type="number" 
                min="1"
                className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm" 
                value={config.maxItems} 
                onChange={e => setConfig({...config, maxItems: parseInt(e.target.value) || 10})} 
              />
              <p className="text-xs text-text-muted mt-1">Maximum number of items that fit into the standard curated gift hamper.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">Bundle Incentive Discount (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  className="w-full p-2.5 pr-8 border border-neutral-300 rounded-lg text-sm" 
                  value={config.bundleDiscountPercentage ?? 0} 
                  onChange={e => setConfig({...config, bundleDiscountPercentage: parseInt(e.target.value) || 0})} 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">%</span>
              </div>
              <p className="text-xs text-text-muted mt-1">Automatic bundle savings applied when customers complete a gift box.</p>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-xs font-bold text-navy">Builder Status</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${config.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'}`}>
                {config.isActive ? 'Enabled & Live' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Builder Component Steps & Product Pool */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-navy flex items-center gap-2">
                <Layers className="w-5 h-5 text-dpc-blue" /> Gift Step Components
              </h3>
              <span className="text-xs text-text-muted">{(config.components || []).length} curation steps</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {(config.components || []).map((comp: string, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5 bg-neutral-100 text-navy px-3 py-1.5 rounded-full text-xs font-semibold border border-neutral-200">
                  <span>{comp}</span>
                  {(config.components || []).length > 1 && (
                    <button 
                      onClick={() => handleRemoveComponent(comp)}
                      className="text-text-muted hover:text-red-500 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isAddingComponent ? (
              <form onSubmit={handleAddComponent} className="flex gap-2 items-center mt-2">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Step title (e.g. Scented Candle)" 
                  value={newComponentName}
                  onChange={(e) => setNewComponentName(e.target.value)}
                  className="text-xs p-2 border border-neutral-300 rounded-lg flex-1"
                />
                <Button type="submit" size="sm" className="bg-dpc-blue text-white text-xs h-8">Add</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingComponent(false)} className="text-xs h-8">Cancel</Button>
              </form>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAddingComponent(true)}
                className="rounded-full px-3 py-1.5 h-auto text-xs border-dashed"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Component Step
              </Button>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-100">
            <h4 className="font-bold text-navy text-sm mb-2 flex items-center gap-2">
              <Package className="w-4 h-4 text-dpc-blue" /> Eligible Products Pool
            </h4>
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-navy">
                    {config.eligibleProductIds?.length || 0} Products Included
                  </div>
                  <div className="text-xs text-text-muted">
                    Out of {products.length} total catalog items
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setIsPoolModalOpen(true)}
                  className="bg-white text-xs font-bold border-neutral-300"
                >
                  Manage Product Pool
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Eligible Products Pool Modal */}
      {isPoolModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-neutral-200 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-3">
              <div>
                <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                  <Package className="w-5 h-5 text-dpc-blue" /> Select Eligible Gift Box Products
                </h3>
                <p className="text-xs text-text-muted">Choose which products customers can add when crafting a custom diaspora box.</p>
              </div>
              <button onClick={() => setIsPoolModalOpen(false)} className="text-text-muted hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 mb-3">
              <input 
                type="text" 
                placeholder="Search products by title or category..." 
                value={poolSearch}
                onChange={(e) => setPoolSearch(e.target.value)}
                className="text-xs p-2 border border-neutral-300 rounded-lg flex-1"
              />
              <div className="flex gap-2">
                <button onClick={selectAllProducts} className="text-xs text-dpc-blue hover:underline font-medium">Select All</button>
                <span className="text-neutral-300">|</span>
                <button onClick={clearAllProducts} className="text-xs text-red-600 hover:underline font-medium">Clear All</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredPoolProducts.map(prod => {
                const isSelected = config.eligibleProductIds?.includes(prod.id);
                return (
                  <div 
                    key={prod.id} 
                    onClick={() => toggleProductEligibility(prod.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'border-dpc-blue bg-blue-50/50' : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                        {prod.images?.[0] && <img src={prod.images[0]} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <div className="font-bold text-navy text-xs sm:text-sm">{prod.name}</div>
                        <div className="text-[11px] text-text-muted capitalize">
                          {prod.primaryCategoryId} • ${(prod.salePrice || prod.price).toFixed(2)} • {prod.inventory} in stock
                        </div>
                      </div>
                    </div>
                    <div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded bg-dpc-blue text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded border border-neutral-300 bg-white" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-neutral-100 flex justify-between items-center">
              <span className="text-xs text-text-muted">
                <strong>{config.eligibleProductIds?.length || 0}</strong> products selected
              </span>
              <Button onClick={() => setIsPoolModalOpen(false)} className="bg-dpc-blue hover:bg-dpc-blue/90 text-white font-bold text-xs">
                Done & Apply
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
