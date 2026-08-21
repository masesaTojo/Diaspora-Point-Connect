import React, { useState, useEffect } from 'react';
import { mockProducts, mockInventoryRecords } from '@/src/lib/mockData';
import { Search, AlertTriangle, ArrowRightLeft, Plus } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Combine mockProducts with their inventory records.
  // In a real app this would be a unified backend query.
  const inventoryData = mockProducts.map(product => {
    const record = mockInventoryRecords.find(r => r.productId === product.id) || {
      productId: product.id,
      stock: 0,
      reserved: 0,
      damaged: 0,
      sold: 0,
      incoming: 0,
      lowStockThreshold: 10
    };
    const available = record.stock - record.reserved;
    const status = available <= record.lowStockThreshold ? (available <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK') : 'IN_STOCK';
    
    return {
      ...product,
      inventoryRecord: record,
      available,
      status
    };
  });

  const filteredInventory = inventoryData.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Inventory Management</h2>
          <p className="text-sm text-text-muted">Track available stock, reservations, and incoming inventory.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" /> Stock Movement
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Receive Stock
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input 
            type="text"
            placeholder="Search by product name..."
            className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-navy font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Product Name</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Physical Stock</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Reserved (Orders)</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Available to Sell</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Damaged</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Incoming</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-navy">{item.name}</div>
                    <div className="text-xs text-text-muted mt-1">Threshold: {item.inventoryRecord.lowStockThreshold}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{item.inventoryRecord.stock}</td>
                  <td className="px-6 py-4 text-right text-orange-600 font-medium">{item.inventoryRecord.reserved}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold text-lg ${item.available <= item.inventoryRecord.lowStockThreshold ? 'text-red-600' : 'text-green-600'}`}>
                      {item.available}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-red-500">{item.inventoryRecord.damaged}</td>
                  <td className="px-6 py-4 text-right text-blue-600">{item.inventoryRecord.incoming}</td>
                  <td className="px-6 py-4 text-center">
                    {item.status === 'IN_STOCK' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">In Stock</span>
                    )}
                    {item.status === 'LOW_STOCK' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 flex items-center justify-center gap-1 w-max mx-auto">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    )}
                    {item.status === 'OUT_OF_STOCK' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 flex items-center justify-center gap-1 w-max mx-auto">
                        <AlertTriangle className="w-3 h-3" /> Out of Stock
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
