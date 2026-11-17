import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, ChevronDown, Heart, ShieldCheck } from 'lucide-react';
import { Button, buttonVariants } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { cn } from '@/src/lib/utils';
import { useShop } from '@/src/contexts/ShopContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { OfflineIndicator } from '../pwa/OfflineIndicator';

export function CustomerLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount, wishlist, categories, currency, setCurrency } = useShop();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/shop?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const navLinks = [
    { 
      name: 'Home', 
      path: '/',
      hasDropdown: false 
    },
    { 
      name: 'Shop', 
      path: '/shop',
      hasDropdown: true,
      dropdownItems: [
        { name: 'Gifts & Hampers', path: '/shop/category/gifts' },
        { name: 'Flowers & Cakes', path: '/shop/category/flowers' },
        { name: 'Groceries & Essentials', path: '/shop/category/groceries' },
        { name: 'Electronics & Appliances', path: '/shop/category/electronics' },
        { name: 'Made in Kenya', path: '/shop/category/kenya' },
        { name: 'Gift builder', path: '/gift-builder' },
      ]
    },
    { 
      name: 'About Us', 
      path: '/about',
      hasDropdown: true,
      dropdownItems: [
        { name: 'About Diaspora Point Connect', path: '/about' },
        { name: 'How It Works', path: '/about#how-it-works' },
        { name: 'Contact Us', path: '/about#contact' },
      ]
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="absolute top-0 left-0 w-full z-[60] bg-white border-b border-neutral-border shadow-md animate-in slide-in-from-top-4 p-4">
          <div className="max-w-4xl mx-auto flex items-center space-x-4 h-16">
            <Search className="h-6 w-6 text-text-muted flex-shrink-0" />
            <form onSubmit={handleSearch} className="flex-1">
              <Input 
                autoFocus
                type="text" 
                placeholder="Search for gifts, groceries, flowers..." 
                className="w-full text-lg border-none shadow-none focus-visible:ring-0 px-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <button onClick={() => setIsSearchOpen(false)} className="p-2 text-navy hover:text-dpc-blue transition-colors rounded-full hover:bg-neutral-100">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-dpc-blue text-white py-2 text-sm hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span className="font-medium tracking-tight">Connecting Homes, Connecting Lives.</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center border-r border-white/20 pr-4 mr-2">
              <span className="text-[10px] uppercase font-bold text-blue-100 mr-2">Currency:</span>
              <select 
                className="bg-transparent border-none text-white focus:ring-0 cursor-pointer font-bold text-xs p-0 h-auto"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
              >
                <option value="USD" className="bg-dpc-blue text-white">USD ($)</option>
                <option value="KES" className="bg-dpc-blue text-white">KES (KSh)</option>
                <option value="GBP" className="bg-dpc-blue text-white">GBP (£)</option>
                <option value="EUR" className="bg-dpc-blue text-white">EUR (€)</option>
              </select>
            </div>
            <Link to="/support" className="hover:text-dpc-yellow transition-colors font-medium">Support</Link>
            <Link to="/track" className="hover:text-dpc-yellow transition-colors font-medium">Track Order</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-dpc-yellow text-navy border-b border-dpc-yellow-dark shadow-xs sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4 lg:w-auto lg:shrink-0">
            <button 
              className="lg:hidden p-2 -ml-2 text-navy hover:text-dpc-blue-dark transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link to="/" className="flex items-center space-x-2 bg-white px-2.5 py-1 rounded-lg shadow-xs shrink-0" onClick={() => setIsMobileMenuOpen(false)}>
              <img src="/logo.png" alt="Diaspora Point Connect" className="h-9 md:h-11 object-contain" onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.style.display = 'none';
              }} />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center space-x-3 xl:space-x-6 flex-1 h-full px-2">
            {navLinks.map((link) => {
              const isActive = link.path === '/' 
                ? location.pathname === '/' 
                : location.pathname.startsWith(link.path);
              return (
                <div key={link.name} className="relative h-full flex items-center group">
                  <Link 
                    to={link.path} 
                    className={cn(
                      "font-semibold transition-colors flex items-center text-xs xl:text-sm whitespace-nowrap py-2 tracking-tight",
                      isActive ? "text-navy font-bold underline decoration-2 underline-offset-4" : "text-navy/90 group-hover:text-dpc-blue-dark"
                    )}
                  >
                    <span>{link.name}</span>
                    {link.hasDropdown && <ChevronDown className="ml-1 h-3.5 w-3.5 transition-transform group-hover:rotate-180" />}
                  </Link>
                  
                  {/* Mega Menu Dropdown */}
                  {link.hasDropdown && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-64 bg-white border border-neutral-200 shadow-xl rounded-b-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-3 flex flex-col z-50 transform translate-y-1 group-hover:translate-y-0">
                      {link.dropdownItems?.map((sub) => (
                        <Link 
                          key={sub.name} 
                          to={sub.path}
                          className="px-5 py-2 hover:bg-neutral-50 text-navy hover:text-dpc-blue transition-colors font-medium text-xs xl:text-sm"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center justify-end space-x-2 sm:space-x-4 lg:w-auto lg:shrink-0">
            <div className="hidden md:block">
              <PWAInstallButton />
            </div>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-navy hover:text-dpc-blue-dark transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <Link to="/account?tab=wishlist" className="p-2 text-navy hover:text-dpc-blue-dark transition-colors hidden sm:block relative" title="View Wishlist">
              <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 bg-navy text-dpc-yellow text-[10px] sm:text-xs font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link to="/account" className="p-2 text-navy hover:text-dpc-blue-dark transition-colors hidden sm:block" aria-label="My Account">
              <User className="h-6 w-6" />
            </Link>
            <Link to="/cart" className="p-2 text-navy hover:text-dpc-blue-dark transition-colors relative" aria-label="Shopping Cart">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-navy text-dpc-yellow text-[10px] sm:text-xs font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-20 left-0 w-full h-[calc(100vh-80px)] bg-white border-t border-neutral-border shadow-lg overflow-y-auto z-50">
            <div className="p-6 space-y-6">
              
              {/* Mobile Currency Selector */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-2">Display Currency</span>
                <div className="grid grid-cols-4 gap-2">
                  {(['USD', 'KES', 'GBP', 'EUR'] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setCurrency(curr)}
                      className={cn(
                        "py-2 text-xs font-bold rounded-lg border transition-all text-center",
                        currency === curr
                          ? "bg-navy text-white border-navy shadow-xs"
                          : "bg-white text-navy border-neutral-200 hover:bg-neutral-100"
                      )}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              <nav className="flex flex-col space-y-5">
                {navLinks.map((link) => {
                  const isActive = link.path === '/' 
                    ? location.pathname === '/' 
                    : location.pathname.startsWith(link.path);
                  return (
                    <div key={link.name} className="flex flex-col space-y-2 border-b border-neutral-100 pb-3">
                      <Link 
                        to={link.path} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "font-semibold text-lg",
                          isActive ? "text-dpc-blue" : "text-navy"
                        )}
                      >
                        {link.name}
                      </Link>
                      {link.hasDropdown && (
                        <div className="flex flex-col space-y-2 pl-4 border-l-2 border-neutral-100 mt-1">
                          {link.dropdownItems?.map(sub => (
                            <Link 
                              key={sub.name}
                              to={sub.path}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="text-text-muted text-sm hover:text-dpc-blue"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Mobile Quick Service Links */}
                <div className="pt-2 flex flex-col space-y-3 border-t border-neutral-200">
                  <Link 
                    to="/track" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-medium text-base text-navy hover:text-dpc-blue flex items-center justify-between"
                  >
                    <span>Track Order in Kenya</span>
                    <span className="text-xs bg-blue-50 text-dpc-blue px-2 py-0.5 rounded font-bold">Live Status</span>
                  </Link>
                  <Link 
                    to="/account?tab=wishlist" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-medium text-base text-navy hover:text-dpc-blue flex items-center justify-between"
                  >
                    <span>Saved Wishlist</span>
                    {wishlist.length > 0 && (
                      <span className="text-xs bg-amber-100 text-navy px-2 py-0.5 rounded-full font-bold">{wishlist.length}</span>
                    )}
                  </Link>
                  <Link 
                    to="/support" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-medium text-base text-navy hover:text-dpc-blue"
                  >
                    Customer Care & WhatsApp Support
                  </Link>
                  <Link 
                    to="/faq" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-medium text-base text-navy hover:text-dpc-blue"
                  >
                    FAQ & PesaPal Payments
                  </Link>
                  <Link 
                    to="/account" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-semibold text-lg text-navy flex items-center space-x-3 pt-2 text-dpc-blue"
                  >
                    <User className="h-5 w-5" />
                    <span>My Account</span>
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Sub-Navigation Bar */}
      <div className="bg-white/95 border-b border-neutral-200 sticky top-20 z-40 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs py-2 font-medium">
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 overflow-x-auto scrollbar-none py-0.5 w-full lg:w-auto">
            <Link 
              to="/shop/category/gifts" 
              className={cn("px-2.5 py-1 rounded-md transition-colors whitespace-nowrap", location.pathname === '/shop/category/gifts' ? "text-dpc-blue font-bold bg-blue-50" : "text-text-muted hover:text-navy")}
            >
              Gifts & Hampers
            </Link>
            <Link 
              to="/shop/category/flowers" 
              className={cn("px-2.5 py-1 rounded-md transition-colors whitespace-nowrap", location.pathname === '/shop/category/flowers' ? "text-dpc-blue font-bold bg-blue-50" : "text-text-muted hover:text-navy")}
            >
              Flowers & Cakes
            </Link>
            <Link 
              to="/shop/category/groceries" 
              className={cn("px-2.5 py-1 rounded-md transition-colors whitespace-nowrap", location.pathname === '/shop/category/groceries' ? "text-dpc-blue font-bold bg-blue-50" : "text-text-muted hover:text-navy")}
            >
              Groceries & Essentials
            </Link>
            <Link 
              to="/shop/category/electronics" 
              className={cn("px-2.5 py-1 rounded-md transition-colors whitespace-nowrap", location.pathname === '/shop/category/electronics' ? "text-dpc-blue font-bold bg-blue-50" : "text-text-muted hover:text-navy")}
            >
              Electronics & Appliances
            </Link>
            <Link 
              to="/shop/category/kenya" 
              className={cn("px-2.5 py-1 rounded-md transition-colors whitespace-nowrap", location.pathname === '/shop/category/kenya' ? "text-dpc-blue font-bold bg-blue-50" : "text-text-muted hover:text-navy")}
            >
              Made in Kenya
            </Link>
            <Link 
              to="/gift-builder" 
              className={cn("px-2.5 py-1 rounded-md transition-colors whitespace-nowrap", location.pathname === '/gift-builder' ? "text-dpc-blue font-bold bg-blue-50" : "text-text-muted hover:text-navy")}
            >
              Gift Builder
            </Link>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 text-text-muted text-[11px] shrink-0 pl-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>PesaPal, M-Pesa & Card Secured</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      <OfflineIndicator />

      {/* Footer */}
      <footer className="bg-navy-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <img src="/logo.png" alt="DPC" className="h-10 object-contain mb-6 bg-white p-1 rounded" onError={(e) => e.currentTarget.style.display = 'none'} />
            <p className="text-gray-200 text-sm max-w-sm mb-4">Connecting diaspora to their loved ones back home in Kenya with verified gifting and essential groceries.</p>
            <div className="flex items-center gap-3 text-xs text-gray-200">
              <Link to="/about" className="hover:text-dpc-yellow underline transition-colors">About Us</Link>
              <span>•</span>
              <Link to="/about#how-it-works" className="hover:text-dpc-yellow underline transition-colors">How It Works</Link>
              <span>•</span>
              <Link to="/about#contact" className="hover:text-dpc-yellow underline transition-colors">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-bold text-dpc-yellow mb-4 text-base tracking-wide">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-200">
              <li><Link to="/shop/category/gifts" className="hover:text-dpc-yellow transition-colors">Gifts &amp; Hampers</Link></li>
              <li><Link to="/shop/category/flowers" className="hover:text-dpc-yellow transition-colors">Flowers &amp; Cakes</Link></li>
              <li><Link to="/shop/category/groceries" className="hover:text-dpc-yellow transition-colors">Groceries &amp; Essentials</Link></li>
              <li><Link to="/shop/category/electronics" className="hover:text-dpc-yellow transition-colors">Electronics &amp; Appliances</Link></li>
              <li><Link to="/shop/category/kenya" className="hover:text-dpc-yellow transition-colors">Made in Kenya</Link></li>
              <li><Link to="/gift-builder" className="hover:text-dpc-yellow transition-colors">Gift Builder</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-dpc-yellow mb-4 text-base tracking-wide">Customer Care</h4>
            <ul className="space-y-2 text-sm text-gray-200">
              <li><Link to="/track" className="hover:text-dpc-yellow transition-colors">Track Order</Link></li>
              <li><Link to="/support" className="hover:text-dpc-yellow transition-colors">Support Concierge</Link></li>
              <li><Link to="/faq" className="hover:text-dpc-yellow transition-colors">FAQ &amp; Payments</Link></li>
              <li><Link to="/shipping" className="hover:text-dpc-yellow transition-colors">Shipping Coverage</Link></li>
              <li><Link to="/returns" className="hover:text-dpc-yellow transition-colors">Returns Policy</Link></li>
              <li><Link to="/admin" className="text-dpc-yellow font-semibold hover:underline">Admin Login</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
