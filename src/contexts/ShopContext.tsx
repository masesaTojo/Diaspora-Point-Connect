import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product,
  Category,
  DeliveryZone,
  Coupon,
  Promotion,
  CmsSection,
  GiftBuilderConfig,
} from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import {
  mockProducts,
  mockCategories,
  mockDeliveryZones,
  mockCoupons,
  mockPromotions,
  mockCmsSections,
  mockGiftBuilderConfig,
} from '../lib/mockData';
import { buildFirestoreErrorInfo, OperationType } from '../lib/firestoreErrors';

export interface CartItem {
  id: string;
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

  // Live Storefront <-> Admin Catalog Linkage (Firestore authoritative)
  products: Product[];
  categories: Category[];
  deliveryZones: DeliveryZone[];
  coupons: Coupon[];
  promotions: Promotion[];
  giftConfig: GiftBuilderConfig;
  cmsSections: CmsSection[];
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string, subtotal: number) => { success: boolean; message: string; discount: number };
  removeCoupon: () => void;
  getProductById: (id: string) => Product | undefined;
  getProductBySlug: (slug: string) => Product | undefined;
  refreshCatalog: () => void;
  loading: boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currency, setCurrencyState] = useState<'USD' | 'KES' | 'GBP' | 'EUR'>('USD');
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [giftConfig, setGiftConfig] = useState<GiftBuilderConfig>(mockGiftBuilderConfig as GiftBuilderConfig);
  const [cmsSections, setCmsSections] = useState<CmsSection[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const [rates, setRates] = useState({
    USD: 1,
    KES: 129.0,
    GBP: 0.79,
    EUR: 0.92,
  });

  const currencySymbols = {
    USD: '$',
    KES: 'KSh',
    GBP: '£',
    EUR: '€',
  };

  const setCurrency = (newCurrency: 'USD' | 'KES' | 'GBP' | 'EUR') => {
    setCurrencyState(newCurrency);
    localStorage.setItem('dpc_currency', newCurrency);
  };

  const convertPrice = useCallback(
    (price: number | string) => {
      const rate = rates[currency];
      const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
      if (isNaN(numPrice)) return String(price);
      const converted = numPrice * rate;
      if (currency === 'KES') {
        return `${currencySymbols[currency]} ${Math.round(converted).toLocaleString()}`;
      }
      return `${currencySymbols[currency]}${converted.toFixed(2)}`;
    },
    [currency, rates]
  );

  const currencySymbol = currencySymbols[currency];

  const refreshCatalog = useCallback(() => {
    // Live-synced via Firestore onSnapshot listeners
  }, []);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
          const data = await res.json();
          if (data?.rates?.KES && data?.rates?.GBP && data?.rates?.EUR) {
            setRates({
              USD: 1,
              KES: Number(data.rates.KES),
              GBP: Number(data.rates.GBP),
              EUR: Number(data.rates.EUR),
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch live FX rates, using baseline fallback', error);
      }
    };
    fetchRates();
  }, []);

  // Authoritative real-time Firestore listeners (seed fallback only when unseeded/empty)
  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreProducts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
          setProducts(firestoreProducts);
        } else {
          setProducts(mockProducts as Product[]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Firestore listener error:', JSON.stringify(buildFirestoreErrorInfo(error, OperationType.LIST, 'products')));
        setProducts(mockProducts as Product[]);
        setLoading(false);
      }
    );

    const unsubCategories = onSnapshot(
      query(collection(db, 'categories'), orderBy('name')),
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreCategories = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
          setCategories(firestoreCategories);
        } else {
          setCategories([...mockCategories].sort((a, b) => a.name.localeCompare(b.name)));
        }
      },
      (error) => {
        console.error('Firestore listener error:', JSON.stringify(buildFirestoreErrorInfo(error, OperationType.LIST, 'categories')));
        setCategories([...mockCategories].sort((a, b) => a.name.localeCompare(b.name)));
      }
    );

    const unsubDeliveryZones = onSnapshot(
      collection(db, 'deliveryZones'),
      (snapshot) => {
        if (!snapshot.empty) {
          setDeliveryZones(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryZone)));
        } else {
          setDeliveryZones(mockDeliveryZones as DeliveryZone[]);
        }
      },
      (error) => {
        console.error('Firestore listener error:', JSON.stringify(buildFirestoreErrorInfo(error, OperationType.LIST, 'deliveryZones')));
        setDeliveryZones(mockDeliveryZones as DeliveryZone[]);
      }
    );

    const unsubCoupons = onSnapshot(
      collection(db, 'coupons'),
      (snapshot) => {
        if (!snapshot.empty) {
          setCoupons(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon)));
        } else {
          setCoupons(mockCoupons as Coupon[]);
        }
      },
      (error) => {
        console.error('Firestore listener error:', JSON.stringify(buildFirestoreErrorInfo(error, OperationType.LIST, 'coupons')));
        setCoupons(mockCoupons as Coupon[]);
      }
    );

    const unsubPromotions = onSnapshot(
      collection(db, 'promotions'),
      (snapshot) => {
        if (!snapshot.empty) {
          setPromotions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Promotion)));
        } else {
          setPromotions(mockPromotions as Promotion[]);
        }
      },
      (error) => {
        console.error('Firestore listener error:', JSON.stringify(buildFirestoreErrorInfo(error, OperationType.LIST, 'promotions')));
        setPromotions(mockPromotions as Promotion[]);
      }
    );

    const unsubCms = onSnapshot(
      query(collection(db, 'cmsSections'), orderBy('order')),
      (snapshot) => {
        if (!snapshot.empty) {
          setCmsSections(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CmsSection)));
        } else {
          setCmsSections(mockCmsSections as CmsSection[]);
        }
      },
      (error) => {
        console.error('Firestore listener error:', JSON.stringify(buildFirestoreErrorInfo(error, OperationType.LIST, 'cmsSections')));
        setCmsSections(mockCmsSections as CmsSection[]);
      }
    );

    const unsubGiftConfig = onSnapshot(
      doc(db, 'config', 'giftBuilder'),
      (docSnap) => {
        if (docSnap.exists()) {
          setGiftConfig(docSnap.data() as GiftBuilderConfig);
        }
      },
      (error) => {
        console.error('Firestore listener error:', JSON.stringify(buildFirestoreErrorInfo(error, OperationType.GET, 'config/giftBuilder')));
      }
    );

    return () => {
      unsubProducts();
      unsubCategories();
      unsubDeliveryZones();
      unsubCoupons();
      unsubPromotions();
      unsubCms();
      unsubGiftConfig();
    };
  }, []);

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

  useEffect(() => {
    localStorage.setItem('dpc_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('dpc_cart', JSON.stringify(cart));
  }, [cart]);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) =>
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
          quantity: newCart[existingIdx].quantity + item.quantity,
        };
        return newCart;
      }

      return [...prev, { ...item, id: Math.random().toString(36).substr(2, 9) }];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateCartItem = (cartItemId: string, updates: Partial<CartItem>) => {
    setCart((prev) => prev.map((item) => (item.id === cartItemId ? { ...item, ...updates } : item)));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const getProductById = useCallback(
    (id: string): Product | undefined => products.find((p) => p.id === id),
    [products]
  );

  const getProductBySlug = useCallback(
    (slug: string): Product | undefined => products.find((p) => p.slug === slug || p.id === slug),
    [products]
  );

  const applyCoupon = useCallback(
    (code: string, subtotal: number) => {
      if (!code || !code.trim()) {
        return { success: false, message: 'Please enter a coupon code.', discount: 0 };
      }
      const sourceCoupons = coupons.length > 0 ? coupons : (mockCoupons as Coupon[]);
      const found = sourceCoupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
      if (!found) {
        return { success: false, message: 'Invalid coupon code.', discount: 0 };
      }
      if (!found.isActive) {
        return { success: false, message: 'This coupon code is no longer active.', discount: 0 };
      }
      const expiryDate = found.validUntil || found.endDate;
      if (expiryDate && new Date(expiryDate) < new Date()) {
        return { success: false, message: 'This coupon code has expired.', discount: 0 };
      }
      if (found.usageLimit && (found.usedCount || 0) >= found.usageLimit) {
        return { success: false, message: 'This coupon has reached its maximum usage limit.', discount: 0 };
      }
      const minSpend = found.minOrderAmount ?? found.minSpend ?? 0;
      if (minSpend > 0 && subtotal < minSpend) {
        return {
          success: false,
          message: `Minimum order amount of $${minSpend} required for this coupon.`,
          discount: 0,
        };
      }

      const isPercentage = found.type === 'PERCENTAGE' || found.isPercentage;
      const couponVal = found.value ?? found.discountValue ?? 0;
      const discountAmount = isPercentage
        ? Math.round(((subtotal * couponVal) / 100) * 100) / 100
        : Math.min(subtotal, couponVal);

      setAppliedCoupon(found);
      return {
        success: true,
        message: `Coupon "${found.code}" applied! Save $${discountAmount.toFixed(2)}`,
        discount: discountAmount,
      };
    },
    [coupons]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  return (
    <ShopContext.Provider
      value={{
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
        promotions,
        giftConfig,
        cmsSections,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        getProductById,
        getProductBySlug,
        refreshCatalog,
        loading,
      }}
    >
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
