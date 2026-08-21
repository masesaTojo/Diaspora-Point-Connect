import React, { useState } from 'react';
import { mockPromotions, mockCoupons, mockCampaigns } from '@/src/lib/mockData';
import { Tag, Ticket, Megaphone, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function Marketing() {
  const [activeTab, setActiveTab] = useState<'promotions' | 'coupons' | 'campaigns'>('promotions');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Marketing & Promotions</h2>
          <p className="text-sm text-text-muted">Manage discounts, coupons, and seasonal campaigns.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add New
        </Button>
      </div>

      <div className="flex border-b border-neutral-200">
        <button
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'promotions' ? 'border-dpc-blue text-dpc-blue' : 'border-transparent text-text-muted hover:text-navy'}`}
          onClick={() => setActiveTab('promotions')}
        >
          <Tag className="w-4 h-4" /> Promotions
        </button>
        <button
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'coupons' ? 'border-dpc-blue text-dpc-blue' : 'border-transparent text-text-muted hover:text-navy'}`}
          onClick={() => setActiveTab('coupons')}
        >
          <Ticket className="w-4 h-4" /> Coupons
        </button>
        <button
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'campaigns' ? 'border-dpc-blue text-dpc-blue' : 'border-transparent text-text-muted hover:text-navy'}`}
          onClick={() => setActiveTab('campaigns')}
        >
          <Megaphone className="w-4 h-4" /> Campaigns
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
              {mockPromotions.map((promo: any) => (
                <tr key={promo.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 font-bold text-navy">{promo.name}</td>
                  <td className="px-6 py-4">{promo.type}</td>
                  <td className="px-6 py-4 font-medium text-dpc-blue">
                    {promo.type === 'PERCENTAGE' ? `${promo.discountValue}%` : `$${promo.discountValue}`}
                  </td>
                  <td className="px-6 py-4 text-text-muted">
                    {promo.conditions.minSpend ? `Min Spend: $${promo.conditions.minSpend}` : 'None'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${promo.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
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
              {mockCoupons.map((coupon: any) => (
                <tr key={coupon.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 font-bold text-navy font-mono text-lg">{coupon.code}</td>
                  <td className="px-6 py-4 font-medium text-dpc-blue">
                    {coupon.isPercentage ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                    {coupon.minSpend > 0 && <span className="text-xs text-text-muted block">Min $${coupon.minSpend}</span>}
                  </td>
                  <td className="px-6 py-4 text-text-muted">
                    {coupon.usedCount} / {coupon.usageLimit || '∞'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockCampaigns.map((campaign: any) => (
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
                <h3 className="font-bold text-navy text-lg mb-1">{campaign.name}</h3>
                <p className="text-sm text-text-muted line-clamp-2 mb-4">{campaign.description}</p>
                <div className="flex justify-between items-center text-sm border-t border-neutral-100 pt-4">
                  <span className="text-text-muted">{campaign.productIds.length} Products</span>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
