import React, { useState } from 'react';
import { mockProducts } from '@/src/lib/mockData';
import { Search, Plus, Filter, Edit, Trash2, Tag, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function Catalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const categories = Array.from(new Set(mockProducts.map(p => p.primaryCategoryId)));

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || product.primaryCategoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Catalog Manager</h2>
          <p className="text-sm text-text-muted">Manage products, pricing, and inventory.</p>
        </div>
        
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add New Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input 
            type="text"
            placeholder="Search products by name..."
            className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-dpc-blue focus:border-dpc-blue text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border border-neutral-300 rounded-md text-sm bg-white focus:ring-dpc-blue focus:border-dpc-blue"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="ALL">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" /> More Filters
        </Button>
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
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 rounded overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-neutral-300" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-navy">{product.name}</div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                      <Tag className="h-3 w-3" /> {product.occasions.join(', ')}
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
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="ghost" size="sm" className="text-dpc-blue">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
