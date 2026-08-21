import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/src/types';
import { Card } from './Card';
import { Badge } from './Badge';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useShop } from '@/src/contexts/ShopContext';

interface ProductCardProps {
  product: Partial<Product>;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { wishlist, toggleWishlist, addToCart } = useShop();
  
  // Safe default for ID
  const productId = product.id || '';
  const isWishlisted = wishlist.includes(productId);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (productId) toggleWishlist(productId);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (productId) {
      addToCart({
        productId,
        quantity: 1
      });
    }
  };

  return (
    <Card className="group overflow-hidden flex flex-col h-full hover:shadow-lg transition-all duration-300 border-neutral-200 relative">
      <Link to={`/product/${product.slug}`} className="relative aspect-square overflow-hidden bg-neutral-100 block">
        <img 
          src={product.images?.[0]} 
          alt={product.name} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isBestseller && (
            <Badge variant="default" className="bg-dpc-yellow text-navy shadow-sm">Bestseller</Badge>
          )}
          {product.isNewArrival && (
            <Badge variant="default" className="bg-dpc-blue text-white shadow-sm">New</Badge>
          )}
        </div>
      </Link>
      
      <button 
        onClick={handleWishlist}
        className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center text-navy hover:bg-white hover:text-red-500 transition-colors z-10"
      >
        <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
      </button>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-1 text-xs text-text-muted uppercase tracking-wider font-semibold">
          {product.primaryCategoryId?.replace('-', ' ')}
        </div>
        <Link to={`/product/${product.slug}`} className="hover:text-dpc-blue transition-colors">
          <h3 className="font-display font-semibold text-lg text-navy leading-tight mb-2 line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        {product.rating && (
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-4 h-4 fill-dpc-yellow text-dpc-yellow" />
            <span className="text-sm font-medium text-navy">{product.rating}</span>
            <span className="text-xs text-text-muted">({product.reviewCount})</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div className="text-xl font-bold text-navy">
            ${product.price?.toFixed(2)}
          </div>
          <button 
            onClick={handleAddToCart}
            className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-navy hover:bg-dpc-blue hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-dpc-blue focus:ring-offset-2"
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
