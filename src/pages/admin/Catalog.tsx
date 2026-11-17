import React, { useState } from 'react';
import { Product } from '@/src/types';
import { useShop } from '@/src/contexts/ShopContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { ADMIN_ROUTE_ROLES } from '@/src/lib/rbac';
import { db } from '@/src/lib/firebase';
import { doc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
import { buildFirestoreErrorInfo, OperationType, stripUndefined } from '@/src/lib/firestoreErrors';
import { Search, Plus, Edit, Trash2, Tag, Image as ImageIcon, X, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function Catalog() {
  const { products, categories: availableCategories } = useShop();
  const { hasRole, logAction } = useAuth();
  const canSyncInventory = hasRole(ADMIN_ROUTE_ROLES.inventory);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    category: 'gifts',
    price: 45,
    salePrice: 0,
    inventory: 25,
    status: 'ACTIVE' as 'ACTIVE' | 'DRAFT' | 'ARCHIVED',
    occasions: 'Birthday, Celebration',
    imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=600',
    description: ''
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const categories = Array.from(new Set(products.map(p => p.primaryCategoryId).filter(Boolean)));

  const handleOpenAdd = () => {
    setProductToEdit(null);
    setFormData({
      name: '',
      category: availableCategories[0]?.slug || 'gifts',
      price: 45,
      salePrice: 0,
      inventory: 25,
      status: 'ACTIVE',
      occasions: 'Birthday, Celebration',
      imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=600',
      description: 'Handcrafted diaspora gift package curated for family celebrations across Kenya.'
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setProductToEdit(product);
    setFormData({
      name: product.name,
      category: product.primaryCategoryId,
      price: product.price,
      salePrice: product.salePrice || 0,
      inventory: product.inventory,
      status: product.status,
      occasions: (product.occasions || []).join(', '),
      imageUrl: product.images?.[0] || '',
      description: product.description || ''
    });
    setIsFormModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || saving) return;

    setSaving(true);
    const now = new Date().toISOString();

    try {
      const batch = writeBatch(db);

      if (productToEdit) {
        const { salePrice: _droppedSalePrice, ...existingRest } = productToEdit;
        const parsedInventory = Math.max(0, Number(formData.inventory) || 0);
        const updatedProduct = stripUndefined({
          ...existingRest,
          id: productToEdit.id,
          name: formData.name.trim(),
          slug: existingRest.slug || formData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          primaryCategoryId: formData.category,
          price: Number(formData.price),
          ...(formData.salePrice > 0 ? { salePrice: Number(formData.salePrice) } : {}),
          inventory: parsedInventory,
          availability: parsedInventory > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
          status: formData.status,
          occasions: formData.occasions.split(',').map(s => s.trim()).filter(Boolean),
          images: [formData.imageUrl.trim() || productToEdit.images?.[0] || ''],
          description: formData.description.trim(),
          createdAt: productToEdit.createdAt || now,
          updatedAt: now,
        });

        batch.set(doc(db, 'products', productToEdit.id), updatedProduct);

        if (canSyncInventory) {
          const invRef = doc(db, 'inventoryRecords', productToEdit.id);
          const invSnap = await getDoc(invRef);
          const existingInv = invSnap.exists() ? invSnap.data() : {};
          batch.set(invRef, {
            productId: productToEdit.id,
            stock: parsedInventory,
            reserved: Number(existingInv.reserved ?? 0),
            damaged: Number(existingInv.damaged ?? 0),
            sold: Number(existingInv.sold ?? 0),
            incoming: Number(existingInv.incoming ?? 0),
            lowStockThreshold: Number(existingInv.lowStockThreshold ?? 8),
            updatedAt: now,
          });
        }

        await batch.commit();
        await logAction('UPDATE', 'Product', productToEdit.id, productToEdit.name, updatedProduct.name);
        showToast(`Updated "${updatedProduct.name}" in Firestore.`);
      } else {
        const newId = `p-${Date.now()}`;
        const parsedInventory = Math.max(0, Number(formData.inventory) || 0);
        const slugBase = formData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || newId;
        const newProduct: Product = stripUndefined({
          id: newId,
          slug: `${slugBase}-${newId.slice(-4)}`,
          name: formData.name.trim(),
          primaryCategoryId: formData.category,
          price: Number(formData.price),
          ...(formData.salePrice > 0 ? { salePrice: Number(formData.salePrice) } : {}),
          inventory: parsedInventory,
          availability: (parsedInventory > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK') as Product['availability'],
          status: formData.status,
          recipients: ['Family', 'Friend'],
          occasions: formData.occasions.split(',').map(s => s.trim()).filter(Boolean),
          collections: ['Diaspora Favorites'],
          tags: ['Kenya', 'Gift'],
          deliveryZones: ['zone-nairobi', 'zone-mombasa'],
          isFeatured: false,
          isBestseller: false,
          isNewArrival: true,
          images: [formData.imageUrl.trim() || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=600'],
          description: formData.description.trim() || 'Premium gift package.',
          createdAt: now,
          updatedAt: now,
        });

        batch.set(doc(db, 'products', newId), newProduct);
        if (canSyncInventory) {
          batch.set(doc(db, 'inventoryRecords', newId), {
            productId: newId,
            stock: parsedInventory,
            reserved: 0,
            damaged: 0,
            sold: 0,
            incoming: 0,
            lowStockThreshold: 8,
            updatedAt: now,
          });
        }

        await batch.commit();
        await logAction('CREATE', 'Product', newId, undefined, newProduct.name);
        showToast(`Added "${newProduct.name}" to catalog.`);
      }

      setIsFormModalOpen(false);
    } catch (err) {
      console.error('Catalog save error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.WRITE, 'products')));
      showToast('Failed to save product to Firestore. Check permissions or fields.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete || saving) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'products', productToDelete.id));
      await logAction('DELETE', 'Product', productToDelete.id, productToDelete.name, undefined);
      showToast(`Removed "${productToDelete.name}" from catalog.`);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Catalog delete error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.DELETE, `products/${productToDelete.id}`)));
      showToast('Failed to delete product from Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.primaryCategoryId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || product.primaryCategoryId === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
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
          <h2 className="text-2xl font-display font-bold text-navy">Catalog Manager</h2>
          <p className="text-sm text-text-muted">Manage diaspora gift products, pricing, categories, and availability.</p>
        </div>
        
        <Button onClick={handleOpenAdd} className="flex items-center gap-2 bg-dpc-blue hover:bg-dpc-blue/90 shadow-sm">
          <Plus className="h-4 w-4" /> Add New Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input 
            type="text"
            placeholder="Search products by title or category..."
            className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-neutral-300 rounded-md text-sm bg-white focus:ring-dpc-blue focus:border-dpc-blue"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="ALL">All Categories ({products.length})</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 border border-neutral-300 rounded-md text-sm bg-white focus:ring-dpc-blue focus:border-dpc-blue"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active Only</option>
          <option value="DRAFT">Drafts</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-navy font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap w-16">Image</th>
                <th className="px-6 py-4 whitespace-nowrap">Product Name</th>
                <th className="px-6 py-4 whitespace-nowrap">Category</th>
                <th className="px-6 py-4 whitespace-nowrap">Price</th>
                <th className="px-6 py-4 whitespace-nowrap">Inventory</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-neutral-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-navy">{product.name}</div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                        <Tag className="h-3 w-3" /> {(product.occasions || []).join(', ') || 'All Occasions'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted capitalize">
                      {product.primaryCategoryId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-navy">${(product.salePrice || product.price).toFixed(2)}</div>
                      {product.salePrice && <div className="text-xs text-red-500 line-through">${product.price.toFixed(2)}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${product.inventory > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.inventory} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenEdit(product)}
                        className="text-dpc-blue hover:bg-blue-50"
                        title="Edit Product"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setProductToDelete(product); setIsDeleteModalOpen(true); }}
                        className="text-red-500 hover:bg-red-50"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-neutral-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-100 mb-4">
              <h3 className="text-lg font-bold text-navy">
                {productToEdit ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="text-text-muted hover:text-navy p-1 rounded-md hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Product Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Belgian Chocolate Celebration Cake" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg bg-white"
                  >
                    {availableCategories.map(cat => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg bg-white"
                  >
                    <option value="ACTIVE">Active (Live in Store)</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Regular Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="1"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Sale Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    placeholder="Optional"
                    value={formData.salePrice || ''}
                    onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Initial Stock</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={formData.inventory}
                    onChange={(e) => setFormData({ ...formData, inventory: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Occasions (Comma separated)</label>
                <input 
                  type="text" 
                  value={formData.occasions}
                  onChange={(e) => setFormData({ ...formData, occasions: e.target.value })}
                  placeholder="e.g. Birthday, Anniversary, Mother's Day" 
                  className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Image URL</label>
                <input 
                  type="url" 
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..." 
                  className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Description</label>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed product notes, recipient highlights..." 
                  className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="bg-dpc-blue hover:bg-dpc-blue/90 text-white font-semibold">
                  {saving ? 'Saving...' : productToEdit ? 'Save Changes' : 'Create Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-neutral-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy text-center mb-1">Delete Product?</h3>
            <p className="text-xs text-text-muted text-center mb-6">
              Are you sure you want to remove <strong>"{productToDelete.name}"</strong>? This product will no longer appear in the store.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => { setIsDeleteModalOpen(false); setProductToDelete(null); }}
              >
                Cancel
              </Button>
              <Button 
                disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteConfirm}
              >
                {saving ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
