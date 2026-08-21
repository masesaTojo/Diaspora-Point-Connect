import React, { useState, useMemo } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { ProductCard } from '@/src/components/ui/ProductCard';
import { Button } from '@/src/components/ui/Button';
import { mockProducts, mockCategories, mockRecipients, mockOccasions } from '@/src/lib/mockData';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categorySlug, collectionSlug } = useParams();
  
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Parse filters from URL
  const query = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'featured';
  const recipientFilter = searchParams.get('recipient') || '';
  const occasionFilter = searchParams.get('occasion') || '';
  const minPrice = Number(searchParams.get('minPrice')) || 0;
  const maxPrice = Number(searchParams.get('maxPrice')) || 10000;

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return mockProducts.filter((p) => {
      // 1. Search Query
      if (query && !p.name?.toLowerCase().includes(query.toLowerCase()) && !p.description?.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      
      // 2. Category
      if (categorySlug) {
        const category = mockCategories.find(c => c.slug === categorySlug);
        if (category && p.primaryCategoryId !== category.slug) {
          return false;
        }
      }

      // 3. Collection
      if (collectionSlug) {
        // Special case for our demo collections mapping
        if (collectionSlug === 'bestsellers' && !p.isBestseller && !p.collections?.includes('Bestsellers')) return false;
        if (collectionSlug === 'new-arrivals' && !p.isNewArrival && !p.collections?.includes('New Arrivals')) return false;
        
        // General array check
        if (collectionSlug !== 'bestsellers' && collectionSlug !== 'new-arrivals') {
           const collMatch = p.collections?.some(c => c.toLowerCase().replace(/\s+/g, '-') === collectionSlug);
           if (!collMatch) return false;
        }
      }

      // 4. Price
      const price = p.salePrice || p.price || 0;
      if (price < minPrice || price > maxPrice) return false;

      // 5. Recipient
      if (recipientFilter && !p.recipients?.includes(recipientFilter)) return false;

      // 6. Occasion
      if (occasionFilter && !p.occasions?.includes(occasionFilter)) return false;

      return true;
    }).sort((a, b) => {
      const priceA = a.salePrice || a.price || 0;
      const priceB = b.salePrice || b.price || 0;

      switch (sortBy) {
        case 'price-asc': return priceA - priceB;
        case 'price-desc': return priceB - priceA;
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'newest': return b.isNewArrival === a.isNewArrival ? 0 : b.isNewArrival ? 1 : -1;
        case 'featured':
        default:
          return (b.isFeatured === a.isFeatured) ? 0 : b.isFeatured ? 1 : -1;
      }
    });
  }, [query, categorySlug, minPrice, maxPrice, recipientFilter, occasionFilter, sortBy]);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const categoryName = categorySlug 
    ? mockCategories.find(c => c.slug === categorySlug)?.name || 'All Products'
    : 'All Products';

  const resultsTitle = query ? `Search results for "${query}"` : categoryName;

  return (
    <div className="bg-neutral-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-neutral-border pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-navy mb-2">{resultsTitle}</h1>
            <p className="text-text-muted">{filteredProducts.length} items found</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              className="lg:hidden flex items-center gap-2"
              onClick={() => setIsMobileFiltersOpen(true)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
            
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm font-medium text-navy hidden sm:block">Sort by:</label>
              <select 
                id="sort" 
                value={sortBy}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="border-neutral-border rounded-md text-sm py-2 pl-3 pr-8 focus:ring-dpc-blue focus:border-dpc-blue bg-white text-navy"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar / Filters */}
          <aside className={`
            lg:w-64 flex-shrink-0 
            ${isMobileFiltersOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden lg:block'}
          `}>
            {isMobileFiltersOpen && (
              <div className="flex justify-between items-center mb-6 lg:hidden">
                <h2 className="text-xl font-bold text-navy">Filters</h2>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 text-text-muted hover:text-navy">
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}

            <div className="space-y-8">
              
              {/* Category Links */}
              <div>
                <h3 className="font-display font-semibold text-lg text-navy mb-4 border-b border-neutral-border pb-2">Categories</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/shop" className={`text-sm ${!categorySlug ? 'text-dpc-blue font-bold' : 'text-text hover:text-dpc-blue transition-colors'}`}>
                      All Products
                    </Link>
                  </li>
                  {mockCategories.map(cat => (
                    <li key={cat.id}>
                      <Link 
                        to={`/shop/category/${cat.slug}`} 
                        className={`text-sm ${categorySlug === cat.slug ? 'text-dpc-blue font-bold' : 'text-text hover:text-dpc-blue transition-colors'}`}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="font-display font-semibold text-lg text-navy mb-4 border-b border-neutral-border pb-2">Price</h3>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    className="w-full border border-neutral-border rounded p-2 text-sm"
                    value={searchParams.get('minPrice') || ''}
                    onChange={(e) => updateParam('minPrice', e.target.value)}
                  />
                  <span>-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    className="w-full border border-neutral-border rounded p-2 text-sm"
                    value={searchParams.get('maxPrice') || ''}
                    onChange={(e) => updateParam('maxPrice', e.target.value)}
                  />
                </div>
              </div>

              {/* Recipient Filter */}
              <div>
                <h3 className="font-display font-semibold text-lg text-navy mb-4 border-b border-neutral-border pb-2">Recipient</h3>
                <div className="space-y-2">
                  {mockRecipients.map((rec) => (
                    <label key={rec.name} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="recipient"
                        value={rec.name}
                        checked={recipientFilter === rec.name}
                        onChange={(e) => updateParam('recipient', e.target.value)}
                        className="text-dpc-blue focus:ring-dpc-blue"
                      />
                      <span className="text-sm text-text">{rec.name}</span>
                    </label>
                  ))}
                  {recipientFilter && (
                    <button onClick={() => updateParam('recipient', '')} className="text-xs text-dpc-blue underline mt-2">Clear</button>
                  )}
                </div>
              </div>

              {/* Occasion Filter */}
              <div>
                <h3 className="font-display font-semibold text-lg text-navy mb-4 border-b border-neutral-border pb-2">Occasion</h3>
                <div className="space-y-2">
                  {mockOccasions.map((occ) => (
                    <label key={occ.name} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="occasion"
                        value={occ.name}
                        checked={occasionFilter === occ.name}
                        onChange={(e) => updateParam('occasion', e.target.value)}
                        className="text-dpc-blue focus:ring-dpc-blue"
                      />
                      <span className="text-sm text-text">{occ.name}</span>
                    </label>
                  ))}
                  {occasionFilter && (
                    <button onClick={() => updateParam('occasion', '')} className="text-xs text-dpc-blue underline mt-2">Clear</button>
                  )}
                </div>
              </div>

            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-neutral-200">
                <h3 className="text-2xl font-display font-bold text-navy mb-2">No products found</h3>
                <p className="text-text-muted mb-6">Try adjusting your search or filters.</p>
                <Button onClick={() => setSearchParams({})}>Clear All Filters</Button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
