import React, { useState, useEffect } from 'react';
import { InventoryRecord } from '@/src/types';
import { useShop } from '@/src/contexts/ShopContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { db } from '@/src/lib/firebase';
import { collection, doc, getDoc, onSnapshot, orderBy, query, writeBatch } from 'firebase/firestore';
import { buildFirestoreErrorInfo, OperationType } from '@/src/lib/firestoreErrors';
import { Search, AlertTriangle, X, Check, PackagePlus, History, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  change: number;
  type: 'RECEIVED' | 'SALE' | 'ORDER_FULFILLED' | 'DAMAGED_WRITE_OFF' | 'MANUAL_ADJUSTMENT';
  notes?: string;
  timestamp: string;
}

export default function Inventory() {
  const { products } = useShop();
  const { currentUser, logAction } = useAuth();
  const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Modals
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  
  // Receive Stock Form State
  const [receiveForm, setReceiveForm] = useState({
    productId: '',
    quantity: 20,
    notes: 'Restock shipment from Nairobi supplier hub'
  });

  useEffect(() => {
    if (!currentUser) return;

    const unsubInventory = onSnapshot(
      collection(db, 'inventoryRecords'),
      (snap) => {
        setInventoryRecords(snap.docs.map((d) => d.data() as InventoryRecord));
      },
      (err) => {
        console.error('Inventory listener error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.LIST, 'inventoryRecords')));
      }
    );

    const unsubMovements = onSnapshot(
      query(collection(db, 'stockMovements'), orderBy('timestamp', 'desc')),
      (snap) => {
        setMovements(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockMovement)));
      },
      (err) => {
        console.error('Stock movements listener error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.LIST, 'stockMovements')));
      }
    );

    return () => {
      unsubInventory();
      unsubMovements();
    };
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenReceiveStock = (preselectedProductId?: string) => {
    setReceiveForm({
      productId: preselectedProductId || (products[0]?.id || ''),
      quantity: 25,
      notes: 'Shipment received and inspected at warehouse'
    });
    setIsReceiveModalOpen(true);
  };

  const handleReceiveStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveForm.productId || receiveForm.quantity <= 0 || saving) return;

    setSaving(true);
    const now = new Date().toISOString();
    const targetProduct = products.find(p => p.id === receiveForm.productId);
    const productName = targetProduct ? targetProduct.name : 'Product';

    try {
      const prodRef = doc(db, 'products', receiveForm.productId);
      const invRef = doc(db, 'inventoryRecords', receiveForm.productId);
      const [prodSnap, invSnap] = await Promise.all([getDoc(prodRef), getDoc(invRef)]);

      const existingInv = invSnap.exists() ? (invSnap.data() as Partial<InventoryRecord>) : undefined;
      const baseStock = existingInv?.stock ?? (prodSnap.exists() ? Number(prodSnap.data().inventory ?? 0) : (targetProduct?.inventory ?? 0));
      const nextStock = Math.max(0, baseStock + Number(receiveForm.quantity));

      const batch = writeBatch(db);
      if (prodSnap.exists()) {
        batch.update(prodRef, {
          inventory: nextStock,
          availability: nextStock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
          updatedAt: now,
        });
      }

      batch.set(invRef, {
        productId: receiveForm.productId,
        stock: nextStock,
        reserved: Number(existingInv?.reserved ?? 0),
        damaged: Number(existingInv?.damaged ?? 0),
        sold: Number(existingInv?.sold ?? 0),
        incoming: Number(existingInv?.incoming ?? 0),
        lowStockThreshold: Number(existingInv?.lowStockThreshold ?? 8),
        updatedAt: now,
      });

      const movId = `mov-${Date.now()}`;
      batch.set(doc(db, 'stockMovements', movId), {
        id: movId,
        productId: receiveForm.productId,
        productName,
        change: Number(receiveForm.quantity),
        type: 'RECEIVED',
        notes: (receiveForm.notes || '').trim() || 'Warehouse restock',
        timestamp: now,
      });

      await batch.commit();
      await logAction('STOCK_RECEIVED', 'Inventory', receiveForm.productId, String(baseStock), String(nextStock));
      setIsReceiveModalOpen(false);
      showToast(`Received +${receiveForm.quantity} units for ${productName}.`);
    } catch (err) {
      console.error('Receive stock error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.WRITE, `inventoryRecords/${receiveForm.productId}`)));
      showToast('Failed to update stock in Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const inventoryData = products.map(product => {
    const record = inventoryRecords.find(r => r.productId === product.id) || {
      productId: product.id,
      stock: product.inventory || 0,
      reserved: 0,
      damaged: 0,
      sold: 0,
      incoming: 0,
      lowStockThreshold: 8
    };
    const available = Math.max(0, record.stock - record.reserved);
    const status = available <= 0 
      ? 'OUT_OF_STOCK' 
      : available <= record.lowStockThreshold 
        ? 'LOW_STOCK' 
        : 'IN_STOCK';
    
    return {
      ...product,
      inventoryRecord: record,
      available,
      status
    };
  });

  const filteredInventory = inventoryData.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.primaryCategoryId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStockStatus === 'ALL' || item.status === filterStockStatus;
    return matchesSearch && matchesStatus;
  });

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
          <h2 className="text-2xl font-display font-bold text-navy">Inventory Management</h2>
          <p className="text-sm text-text-muted">Track physical stock, reservations for diaspora orders, and incoming shipments.</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsMovementModalOpen(true)}
            className="flex items-center gap-2 border-neutral-300"
          >
            <History className="h-4 w-4 text-dpc-blue" /> Stock Movements ({movements.length})
          </Button>
          <Button 
            onClick={() => handleOpenReceiveStock()}
            className="flex items-center gap-2 bg-dpc-blue hover:bg-dpc-blue/90"
          >
            <PackagePlus className="h-4 w-4" /> Receive Stock
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input 
            type="text"
            placeholder="Search inventory by product name..."
            className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-neutral-300 rounded-md text-sm bg-white focus:ring-dpc-blue focus:border-dpc-blue"
          value={filterStockStatus}
          onChange={(e) => setFilterStockStatus(e.target.value as any)}
        >
          <option value="ALL">All Stock Levels ({inventoryData.length})</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock Alert</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
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
                <th className="px-6 py-4 whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-text-muted">
                    No inventory records match your criteria.
                  </td>
                </tr>
              ) : (
                filteredInventory.map(item => (
                  <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-navy">{item.name}</div>
                      <div className="text-xs text-text-muted mt-1">Threshold: {item.inventoryRecord.lowStockThreshold} units</div>
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
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      )}
                      {item.status === 'OUT_OF_STOCK' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenReceiveStock(item.id)}
                        className="text-dpc-blue hover:bg-blue-50 text-xs font-bold"
                      >
                        + Stock
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receive Stock Modal */}
      {isReceiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-neutral-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-4">
              <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-dpc-blue" /> Receive Stock Shipment
              </h3>
              <button onClick={() => setIsReceiveModalOpen(false)} className="text-text-muted hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Product *</label>
                <select 
                  value={receiveForm.productId}
                  onChange={(e) => setReceiveForm({ ...receiveForm, productId: e.target.value })}
                  className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg bg-white"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Current: {p.inventory})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Quantity Received *</label>
                <input 
                  type="number" 
                  min="1" 
                  required
                  value={receiveForm.quantity}
                  onChange={(e) => setReceiveForm({ ...receiveForm, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Receipt Note / PO Reference</label>
                <input 
                  type="text" 
                  value={receiveForm.notes}
                  onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
                  placeholder="e.g. PO-7492 from Kericho Tea Hub"
                  className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <Button type="button" variant="outline" onClick={() => setIsReceiveModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="bg-dpc-blue hover:bg-dpc-blue/90 text-white font-bold">
                  {saving ? 'Updating...' : 'Confirm & Update Stock'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movements Ledger Modal */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-neutral-200 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                  <History className="w-5 h-5 text-dpc-blue" /> Stock Movement History
                </h3>
                <p className="text-xs text-text-muted">Audit trail of receipts, order deductions, and manual adjustments.</p>
              </div>
              <button onClick={() => setIsMovementModalOpen(false)} className="text-text-muted hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {movements.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm">No stock movements recorded yet.</div>
              ) : (
                movements.map(m => (
                  <div key={m.id} className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${m.change > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                        {m.change > 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-navy text-sm">{m.productName}</div>
                        <div className="text-text-muted">{m.notes || m.type}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">{new Date(m.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className={`font-mono font-bold text-sm ${m.change > 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {m.change > 0 ? `+${m.change}` : m.change} units
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-neutral-100 flex justify-end">
              <Button variant="outline" onClick={() => setIsMovementModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
