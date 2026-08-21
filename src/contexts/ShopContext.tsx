import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: string; // unique id for the cart item (since same product might have different configs)
  productId: string;
  quantity: number;
  recipient?: string;
  giftMessage?: string;
  includeGreetingCard?: boolean;
  deliveryDate?: string;
  deliveryLocation?: string;
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
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load from local storage for persistence across reloads
  useEffect(() => {
    const savedWishlist = localStorage.getItem('dpc_wishlist');
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    
    const savedCart = localStorage.getItem('dpc_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // Save changes
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

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <ShopContext.Provider value={{ wishlist, toggleWishlist, cart, addToCart, removeFromCart, updateCartItem, clearCart, cartCount }}>
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
