import React, { useState } from 'react';
import { mockSuppliers, mockProducts } from '@/src/lib/mockData';
import { Search, Plus, MapPin, Mail, Phone, ShoppingCart } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function Suppliers() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = mockSuppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Suppliers & Purchasing</h2>
          <p className="text-sm text-text-muted">Manage vendors and purchase orders.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> New Purchase Order
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Supplier
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input 
            type="text"
            placeholder="Search suppliers by name..."
            className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-navy">{supplier.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-bold ${supplier.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {supplier.status}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-text-muted mb-6 flex-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-neutral-400" /> {supplier.location}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-neutral-400" /> {supplier.contactPhone}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-neutral-400" /> {supplier.contactEmail}
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Lead Time:</span>
                <span className="font-medium text-navy">{supplier.leadTimeDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Payment Terms:</span>
                <span className="font-medium text-navy">{supplier.paymentTerms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Products Supplied:</span>
                <span className="font-medium text-navy">{supplier.suppliedProductIds.length} items</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <Button variant="outline" className="w-full">View Details</Button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
