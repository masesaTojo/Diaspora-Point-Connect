import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, Category, DeliveryZone, Coupon, CmsSection, GiftBuilderConfig, Order } from '../types';
import { 
  getStoredProducts, 
  getStoredCategories, 
  getStoredDeliveryZones, 
  getStoredCoupons, 
  getStoredCmsSections, 
  getStoredGiftConfig, 
  subscribeToStorage,
  validateCoupon,
  recordOrderSale
} from '../lib/adminStorage';

export interface CartItem {
  id: string; // unique id for the cart item
  productId: string;
  quantity: number;
  recipient?: string;
  giftMessage?: string;
  includeGreetingCard?: boolean;
  deliveryDate?: string;
  deliveryLocation?: string;
  customPrice?: number;
  productName?: string;
}

interface ShopContextType {
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItem: (cartItemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  cartCount: number;
  
  // Currency Management
  currency: 'USD' | 'KES' | 'GBP' | 'EUR';
  setCurrency: (currency: 'USD' | 'KES' | 'GBP' | 'EUR') => void;
  convertPrice: (price: number) => string;
  currencySymbol: string;
  
  // Live Storefront <-> Admin Catalog Linkage
  products: Product[];
  categories: Category[];
  deliveryZones: DeliveryZone[];
  coupons: Coupon[];
  giftConfig: GiftBuilderConfig;
  cmsSections: CmsSection[];
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string, subtotal: number) => { success: boolean; message: string; discount: number };
  removeCoupon: () => void;
  getProductById: (id: string) => Product | undefined;
  getProductBySlug: (slug: string) => Product | undefined;
  placeOrder: (order: Order, couponCode?: string) => void;
  refreshCatalog: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currency, setCurrencyState] = useState<'USD' | 'KES' | 'GBP' | 'EUR'>('USD');
  
  // Dynamic live entities synced with Admin
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [giftConfig, setGiftConfig] = useState<GiftBuilderConfig>(() => getStoredGiftConfig());
  const [cmsSections, setCmsSections] = useState<CmsSection[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Conversion rates (Fixed for demo purposes)
  const rates = {
    USD: 1,
    KES: 135.50,
    GBP: 0.78,
    EUR: 0.92
  };

  const currencySymbols = {
    USD: '$',
    KES: 'KSh',
    GBP: '£',
    EUR: '€'
  };

  const setCurrency = (newCurrency: 'USD' | 'KES' | 'GBP' | 'EUR') => {
    setCurrencyState(newCurrency);
    localStorage.setItem('dpc_currency', newCurrency);
  };

  const convertPrice = useCallback((priceInUSD: number) => {
    const rate = rates[currency];
    const converted = priceInUSD * rate;
    
    if (currency === 'KES') {
      return `${currencySymbols[currency]} ${Math.round(converted).toLocaleString()}`;
    }
    return `${currencySymbols[currency]}${converted.toFixed(2)}`;
  }, [currency]);

  const currencySymbol = currencySymbols[currency];

  const refreshCatalog = useCallback(() => {
    setProducts(getStoredProducts());
    setCategories(getStoredCategories());
    setDeliveryZones(getStoredDeliveryZones());
    setCoupons(getStoredCoupons());
    setGiftConfig(getStoredGiftConfig());
    setCmsSections(getStoredCmsSections());
  }, []);

  // Initial load
  useEffect(() => {
    refreshCatalog();

    const savedCurrency = localStorage.getItem('dpc_currency') as any;
    if (savedCurrency && ['USD', 'KES', 'GBP', 'EUR'].includes(savedCurrency)) {
      setCurrencyState(savedCurrency);
    }

    const savedWishlist = localStorage.getItem('dpc_wishlist');
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error('Failed to parse wishlist', e);
      }
    }
    
    const savedCart = localStorage.getItem('dpc_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, [refreshCatalog]);

  // Reactive subscription: instantly re-read whenever admin adds/edits/removes anything
  useEffect(() => {
    const unsubscribe = subscribeToStorage([
      'dpc_catalog_products',
      'dpc_categories',
      'dpc_inventory_records',
      'dpc_delivery_zones',
      'dpc_coupons',
      'dpc_gift_builder_config',
      'dpc_cms_sections'
    ], () => {
      refreshCatalog();
    });

    return () => unsubscribe();
  }, [refreshCatalog]);

  // Save changes to wishlist & cart
  useEffect(() => {
    localStorage.setItem('dpc_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('dpc_cart', JSON.stringify(cart));
  }, [cart]);

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    setCart(prev => {
      // Check if identical item exists (same product, recipient, message, date)
      const existingIdx = prev.findIndex(i => 
        i.productId === item.productId &&
        i.recipient === item.recipient &&
        i.giftMessage === item.giftMessage &&
        i.includeGreetingCard === item.includeGreetingCard &&
        i.deliveryDate === item.deliveryDate &&
        i.deliveryLocation === item.deliveryLocation
      );

      if (existingIdx >= 0) {
        const newCart = [...prev];
        newCart[existingIdx] = {
          ...newCart[existingIdx],
          quantity: newCart[existingIdx].quantity + item.quantity
        };
        return newCart;
      }

      return [...prev, { ...item, id: Math.random().toString(36).substr(2, 9) }];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const updateCartItem = (cartItemId: string, updates: Partial<CartItem>) => {
    setCart(prev => prev.map(item => item.id === cartItemId ? { ...item, ...updates } : item));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const getProductById = useCallback((id: string): Product | undefined => {
    return products.find(p => p.id === id);
  }, [products]);

  const getProductBySlug = useCallback((slug: string): Product | undefined => {
    return products.find(p => p.slug === slug || p.id === slug);
  }, [products]);

  const applyCoupon = useCallback((code: string, subtotal: number) => {
    const result = validateCoupon(code, subtotal);
    if (result.valid && result.coupon) {
      setAppliedCoupon(result.coupon);
      return { success: true, message: result.message, discount: result.discountAmount };
    }
    return { success: false, message: result.message, discount: 0 };
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const placeOrder = useCallback((order: Order, couponCode?: string) => {
    recordOrderSale(order, couponCode);
    clearCart();
    refreshCatalog();
  }, [refreshCatalog]);

  return (
    <ShopContext.Provider value={{ 
      wishlist, 
      toggleWishlist, 
      cart, 
      addToCart, 
      removeFromCart, 
      updateCartItem, 
      clearCart, 
      cartCount,
      currency,
      setCurrency,
      convertPrice,
      currencySymbol,
      products,
      categories,
      deliveryZones,
      coupons,
      giftConfig,
      cmsSections,
      appliedCoupon,
      applyCoupon,
      removeCoupon,
      getProductById,
      getProductBySlug,
      placeOrder,
      refreshCatalog
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
