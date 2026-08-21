import React, { useState } from 'react';
import { mockGiftBuilderConfig, mockProducts } from '@/src/lib/mockData';
import { Settings, Plus, X, Package } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function GiftBuilderManager() {
  const [config, setConfig] = useState(mockGiftBuilderConfig);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Gift Builder Config</h2>
          <p className="text-sm text-text-muted">Manage the custom gift box creation experience.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={config.isActive ? "outline" : "default"} onClick={() => setConfig({...config, isActive: !config.isActive})}>
            {config.isActive ? 'Disable Gift Builder' : 'Enable Gift Builder'}
          </Button>
          <Button>Save Settings</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
          <h3 className="font-bold text-navy mb-4 flex items-center gap-2"><Settings className="w-5 h-5" /> Rules & Discounting</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1">Minimum Items</label>
              <input type="number" className="w-full p-2 border border-neutral-300 rounded" value={config.minItems} onChange={e => setConfig({...config, minItems: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1">Maximum Items</label>
              <input type="number" className="w-full p-2 border border-neutral-300 rounded" value={config.maxItems} onChange={e => setConfig({...config, maxItems: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1">Bundle Discount (%)</label>
              <input type="number" className="w-full p-2 border border-neutral-300 rounded" value={config.bundleDiscountPercentage} onChange={e => setConfig({...config, bundleDiscountPercentage: parseInt(e.target.value)})} />
              <p className="text-xs text-text-muted mt-1">Discount applied when customers build a custom box.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
          <h3 className="font-bold text-navy mb-4 flex items-center gap-2"><Package className="w-5 h-5" /> Allowed Components</h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {config.components.map((comp: string, idx: number) => (
              <div key={idx} className="flex items-center gap-1 bg-neutral-100 text-navy px-3 py-1.5 rounded-full text-sm font-medium">
                {comp}
                <button className="text-text-muted hover:text-red-500"><X className="w-3 h-3" /></button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="rounded-full px-3 py-1.5 h-auto text-sm"><Plus className="w-3 h-3 mr-1" /> Add Component</Button>
          </div>

          <h4 className="font-semibold text-navy text-sm mt-6 mb-2">Eligible Products Pool</h4>
          <div className="text-sm text-text-muted bg-neutral-50 p-4 border border-neutral-200 rounded-lg">
            {config.eligibleProductIds.length} products currently eligible to be included in custom boxes.
            <Button variant="link" className="px-0 ml-2">Manage Pool</Button>
          </div>
        </div>

      </div>
    </div>
  );
}
