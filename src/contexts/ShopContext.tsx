import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, Category, DeliveryZone, Coupon, CmsSection, GiftBuilderConfig, Order } from '../types';
import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  setDoc, 
  doc, 
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { validateCoupon, recordOrderSale } from '../lib/adminStorage';
import { mockProducts, mockCategories } from '../lib/mockData';

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
  convertPrice: (price: number | string) => string;
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
  loading: boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currency, setCurrencyState] = useState<'USD' | 'KES' | 'GBP' | 'EUR'>('USD');
  const [loading, setLoading] = useState(true);
  
  // Dynamic live entities synced with Firestore
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [giftConfig, setGiftConfig] = useState<GiftBuilderConfig>({
    eligibleProductIds: [],
    components: [],
    minItems: 1,
    maxItems: 5,
    isActive: true
  });
  const [cmsSections, setCmsSections] = useState<CmsSection[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Conversion rates (Fixed for demo purposes)
  const [rates, setRates] = useState({
    USD: 1,
    KES: 135.50,
    GBP: 0.78,
    EUR: 0.92
  });

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

  const convertPrice = useCallback((price: number | string) => {
    const rate = rates[currency];
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
    
    if (isNaN(numPrice)) return String(price);

    const converted = numPrice * rate;
    
    if (currency === 'KES') {
      return `${currencySymbols[currency]} ${Math.round(converted).toLocaleString()}`;
    }
    return `${currencySymbols[currency]}${converted.toFixed(2)}`;
  }, [currency, rates]);

  const currencySymbol = currencySymbols[currency];

  const refreshCatalog = useCallback(() => {
    // This is now handled by Firestore onSnapshot listeners
  }, []);

  // Fetch FX rates (Simulated daily update or API)
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // In a real app, use fetch('https://api.exchangerate-api.com/...')
        // For now, we'll keep the base rates but could update KES slightly for realism
        setRates(prev => ({
          ...prev,
          KES: 134.80 + (Math.random() * 2) // fluctuates between 134.8 and 136.8
        }));
      } catch (error) {
        console.error('Failed to fetch rates', error);
      }
    };
    fetchRates();
  }, []);

  // Set up real-time listeners
  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const firestoreProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        const firestoreIds = new Set(firestoreProducts.map(p => p.id));
        const supplementalSampleProducts = (mockProducts as Product[]).filter(p => !firestoreIds.has(p.id));
        setProducts([...firestoreProducts, ...supplementalSampleProducts]);
      },
      (error) => {
        console.error('Error listening to products:', error);
        setProducts(mockProducts as Product[]);
      }
    );

    const unsubCategories = onSnapshot(
      query(collection(db, 'categories'), orderBy('name')),
      (snapshot) => {
        const firestoreCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        const firestoreSlugs = new Set(firestoreCategories.map(c => c.slug));
        const supplementalCategories = mockCategories.filter(c => !firestoreSlugs.has(c.slug));
        setCategories([...firestoreCategories, ...supplementalCategories].sort((a, b) => a.name.localeCompare(b.name)));
      },
      (error) => {
        console.error('Error listening to categories:', error);
        setCategories([...mockCategories].sort((a, b) => a.name.localeCompare(b.name)));
      }
    );

    const unsubDeliveryZones = onSnapshot(collection(db, 'deliveryZones'), (snapshot) => {
      setDeliveryZones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeliveryZone)));
    });

    const unsubCoupons = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon)));
    });

    const unsubCms = onSnapshot(query(collection(db, 'cmsSections'), orderBy('order')), (snapshot) => {
      setCmsSections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CmsSection)));
    });

    const unsubGiftConfig = onSnapshot(doc(db, 'config', 'giftBuilder'), (docSnap) => {
      if (docSnap.exists()) {
        setGiftConfig(docSnap.data() as GiftBuilderConfig);
      }
    });

    setLoading(false);

    return () => {
      unsubProducts();
      unsubCategories();
      unsubDeliveryZones();
      unsubCoupons();
      unsubCms();
      unsubGiftConfig();
    };
  }, []);

  // Initial load of cart/wishlist from local storage (keep as is for user's personal items)
  useEffect(() => {
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
  }, []);

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
  const placeOrder = useCallback(async (order: Order, couponCode?: string) => {
    try {
      await addDoc(collection(db, 'orders'), {
        ...order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      clearCart();
    } catch (error) {
      console.error('Error placing order', error);
    }
  }, []);

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
      refreshCatalog,
      loading
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
