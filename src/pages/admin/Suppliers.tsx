import React, { useState, useEffect } from 'react';
import { Supplier, Product } from '@/src/types';
import { getStoredSuppliers, saveStoredSuppliers, getStoredProducts, recordStockReceipt } from '@/src/lib/adminStorage';
import { Search, Plus, MapPin, Mail, Phone, ShoppingCart, Check, X, Building, Clock, Edit2 } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add / Edit Supplier Modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    location: '',
    leadTimeDays: 2,
    paymentTerms: 'Net 30',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  // Purchase Order Modal
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedSupplierForPO, setSelectedSupplierForPO] = useState<Supplier | null>(null);
  const [poData, setPOData] = useState({
    productId: '',
    quantity: 50,
    unitCost: 15,
    notes: 'Restock shipment for holiday diaspora rush'
  });

  useEffect(() => {
    setSuppliers(getStoredSuppliers());
    setProducts(getStoredProducts());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierFormData({
      name: '',
      contactEmail: '',
      contactPhone: '+254 ',
      location: 'Nairobi, Kenya',
      leadTimeDays: 2,
      paymentTerms: 'Net 30',
      status: 'ACTIVE'
    });
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormData({
      name: supplier.name,
      contactEmail: supplier.contactEmail,
      contactPhone: supplier.contactPhone,
      location: supplier.location,
      leadTimeDays: supplier.leadTimeDays,
      paymentTerms: supplier.paymentTerms,
      status: supplier.status
    });
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierFormData.name.trim()) return;

    if (editingSupplier) {
      const updated = suppliers.map(s => {
        if (s.id === editingSupplier.id) {
          return {
            ...s,
            ...supplierFormData
          };
        }
        return s;
      });
      setSuppliers(updated);
      saveStoredSuppliers(updated);
      showToast(`Supplier "${supplierFormData.name}" updated successfully.`);
    } else {
      const newSupplier: Supplier = {
        id: `sup-${Date.now()}`,
        name: supplierFormData.name,
        contactEmail: supplierFormData.contactEmail,
        contactPhone: supplierFormData.contactPhone,
        location: supplierFormData.location,
        leadTimeDays: supplierFormData.leadTimeDays,
        paymentTerms: supplierFormData.paymentTerms,
        status: supplierFormData.status,
        suppliedProductIds: []
      };
      const updated = [newSupplier, ...suppliers];
      setSuppliers(updated);
      saveStoredSuppliers(updated);
      showToast(`New supplier "${newSupplier.name}" added successfully.`);
    }
    setIsSupplierModalOpen(false);
  };

  const handleOpenPO = (supplier?: Supplier) => {
    const target = supplier || suppliers[0] || null;
    setSelectedSupplierForPO(target);
    setPOData({
      productId: products[0]?.id || '',
      quantity: 50,
      unitCost: 15,
      notes: 'Procurement PO for Nairobi central hub'
    });
    setIsPOModalOpen(true);
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPO || !poData.productId) return;

    const prod = products.find(p => p.id === poData.productId);
    const prodName = prod ? prod.name : 'Product';

    // Record stock receipt into inventory ledger
    recordStockReceipt(
      poData.productId,
      poData.quantity,
      selectedSupplierForPO.name,
      `PO-${Math.floor(100000 + Math.random() * 900000)}`,
      poData.unitCost,
      poData.notes
    );

    showToast(`PO issued to ${selectedSupplierForPO.name} & received +${poData.quantity} units of "${prodName}".`);
    setIsPOModalOpen(false);
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Suppliers & Purchasing</h2>
          <p className="text-sm text-text-muted">Manage Kenyan artisan vendors, flower farms, bakeries, and purchase orders.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleOpenPO()} className="flex items-center gap-2 border-neutral-300">
            <ShoppingCart className="h-4 w-4" /> New Purchase Order
          </Button>
          <Button onClick={handleOpenAddSupplier} className="flex items-center gap-2 bg-dpc-blue hover:bg-dpc-blue/90 text-white font-bold">
            <Plus className="h-4 w-4" /> Add Supplier
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input 
            type="text"
            placeholder="Search suppliers by name or location..."
            className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm flex flex-col justify-between hover:border-dpc-blue/40 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-dpc-blue flex items-center justify-center font-bold">
                    <Building className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-navy">{supplier.name}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${supplier.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {supplier.status}
                </span>
              </div>
              
              <div className="space-y-2 text-xs text-text-muted mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-neutral-400" /> {supplier.location}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-neutral-400" /> {supplier.contactPhone}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-neutral-400" /> {supplier.contactEmail}
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Lead Time:</span>
                  <span className="font-semibold text-navy flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-400" /> {supplier.leadTimeDays} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Payment Terms:</span>
                  <span className="font-semibold text-navy">{supplier.paymentTerms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Supplied Products:</span>
                  <span className="font-semibold text-navy">{supplier.suppliedProductIds?.length || 1} catalog items</span>
                </div>
              </div>
            </div>
            
            <div className="mt-5 pt-3 border-t border-neutral-100 flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleOpenPO(supplier)}
                className="flex-1 text-xs border-neutral-300 hover:bg-blue-50 hover:text-dpc-blue"
              >
                <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Order PO
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleOpenEditSupplier(supplier)}
                className="text-xs text-navy hover:bg-neutral-100"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-neutral-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-4">
              <h3 className="text-lg font-bold text-navy">
                {editingSupplier ? 'Edit Vendor Profile' : 'Add New Local Supplier'}
              </h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-text-muted hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Company / Vendor Name *</label>
                <input 
                  type="text" 
                  required
                  value={supplierFormData.name}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                  placeholder="e.g. Rift Valley Floral Exporters"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Contact Email *</label>
                  <input 
                    type="email" 
                    required
                    value={supplierFormData.contactEmail}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, contactEmail: e.target.value })}
                    placeholder="sales@vendor.co.ke"
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Phone Number *</label>
                  <input 
                    type="text" 
                    required
                    value={supplierFormData.contactPhone}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, contactPhone: e.target.value })}
                    placeholder="+254 7..."
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Location & Hub City *</label>
                <input 
                  type="text" 
                  required
                  value={supplierFormData.location}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, location: e.target.value })}
                  placeholder="e.g. Naivasha Flower Belt, Kenya"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Lead Time (Days)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={supplierFormData.leadTimeDays}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, leadTimeDays: parseInt(e.target.value) || 1 })}
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Payment Terms</label>
                  <select 
                    value={supplierFormData.paymentTerms}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, paymentTerms: e.target.value })}
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg bg-white"
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Cash On Delivery">Cash On Delivery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Status</label>
                <select 
                  value={supplierFormData.status}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, status: e.target.value as any })}
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg bg-white"
                >
                  <option value="ACTIVE">Active Vendor</option>
                  <option value="INACTIVE">Inactive / On Hold</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <Button type="button" variant="outline" onClick={() => setIsSupplierModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-dpc-blue hover:bg-dpc-blue/90 text-white font-bold">
                  {editingSupplier ? 'Update Vendor' : 'Save Supplier'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Purchase Order Modal */}
      {isPOModalOpen && selectedSupplierForPO && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-neutral-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-navy">Issue Purchase Order</h3>
                <p className="text-xs text-text-muted">Vendor: {selectedSupplierForPO.name}</p>
              </div>
              <button onClick={() => setIsPOModalOpen(false)} className="text-text-muted hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Select Catalog Item to Replenish *</label>
                <select 
                  value={poData.productId}
                  onChange={(e) => setPOData({ ...poData, productId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg bg-white"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.inventory})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Order Quantity *</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={poData.quantity}
                    onChange={(e) => setPOData({ ...poData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Agreed Unit Cost ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={poData.unitCost}
                    onChange={(e) => setPOData({ ...poData, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">PO Batch Notes & Reference</label>
                <input 
                  type="text" 
                  value={poData.notes}
                  onChange={(e) => setPOData({ ...poData, notes: e.target.value })}
                  placeholder="e.g. Batch #KE-9921 for warehouse delivery"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs flex justify-between font-medium">
                <span>Estimated PO Value:</span>
                <span className="font-bold text-navy">${(poData.quantity * poData.unitCost).toFixed(2)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <Button type="button" variant="outline" onClick={() => setIsPOModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-dpc-blue hover:bg-dpc-blue/90 text-white font-bold">
                  Issue PO & Receive Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

