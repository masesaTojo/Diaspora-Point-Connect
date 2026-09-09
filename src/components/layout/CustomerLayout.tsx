import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, ChevronDown, Heart, Home, Award, Sparkles } from 'lucide-react';
import { Button, buttonVariants } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { cn } from '@/src/lib/utils';
import { useShop } from '@/src/contexts/ShopContext';

export function CustomerLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount, wishlist, categories } = useShop();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/shop?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const navLinks = [
    { 
      name: 'Shop', 
      path: '/shop',
      hasDropdown: true,
      dropdownItems: [
        ...categories.map(cat => ({
          name: cat.name,
          path: `/shop/category/${cat.slug}`
        })),
        { name: 'House Rentals in Kenya', path: '/rentals' },
        { name: 'Verified Diaspora Advertisers', path: '/advertise' },
      ]
    },
    { 
      name: 'House Rentals', 
      path: '/rentals',
      hasDropdown: true,
      dropdownItems: [
        { name: 'All Rentals in Kenya', path: '/rentals' },
        { name: 'Nairobi Serviced Stays', path: '/rentals?city=Nairobi' },
        { name: 'Mombasa Coastal Villas', path: '/rentals?city=Mombasa' },
        { name: 'Naivasha Holiday Cottages', path: '/rentals?city=Naivasha' },
        { name: 'Diani Beach Retreats', path: '/rentals?city=Diani Beach' },
        { name: 'List Your Property (Host)', path: '/rentals#host' },
      ]
    },
    { 
      name: 'Advertisers', 
      path: '/advertise',
      hasDropdown: true,
      dropdownItems: [
        { name: 'Verified Partner Directory', path: '/advertise' },
        { name: 'Banking & Diaspora Mortgages', path: '/advertise?cat=Banking' },
        { name: 'Verified Land & Real Estate', path: '/advertise?cat=RealEstate' },
        { name: 'Building & Construction Supplies', path: '/advertise?cat=Building' },
        { name: 'Advertise With Us (Media Kit)', path: '/advertise#packages' },
      ]
    },
    { name: 'Family Support', path: '/shop/category/family-support' },
    { name: 'Gift Builder', path: '/gift-builder' },
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
      <div className="bg-navy text-white py-2 text-sm hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span>Connecting Homes, Connecting Lives.</span>
          <div className="flex items-center space-x-4">
            <Link to="/support" className="hover:text-dpc-yellow transition-colors">Support</Link>
            <Link to="/track" className="hover:text-dpc-yellow transition-colors">Track Order</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-neutral-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4 lg:w-1/4">
            <button 
              className="lg:hidden p-2 -ml-2 text-navy hover:text-dpc-blue"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link to="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
              <img src="/logo.png" alt="Diaspora Point Connect" className="h-10 md:h-12 object-contain" onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.style.display = 'none';
              }} />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center space-x-8 flex-1 h-full">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <div key={link.name} className="relative h-full flex items-center group">
                  <Link 
                    to={link.path} 
                    className={cn(
                      "font-semibold transition-colors flex items-center text-[15px]",
                      isActive ? "text-dpc-blue" : "text-navy group-hover:text-dpc-blue"
                    )}
                  >
                    {link.name}
                    {link.hasDropdown && <ChevronDown className="ml-1 h-4 w-4" />}
                  </Link>
                  
                  {/* Mega Menu Dropdown */}
                  {link.hasDropdown && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-64 bg-white border border-neutral-border shadow-xl rounded-b-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-4 flex flex-col z-50 transform translate-y-2 group-hover:translate-y-0">
                      {link.dropdownItems?.map((sub) => (
                        <Link 
                          key={sub.name} 
                          to={sub.path}
                          className="px-6 py-2.5 hover:bg-neutral-50 text-navy hover:text-dpc-blue transition-colors font-medium text-sm"
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

          <div className="flex items-center justify-end space-x-2 sm:space-x-4 lg:w-1/4">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-navy hover:text-dpc-blue transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <Link to="/account" className="p-2 text-navy hover:text-dpc-blue transition-colors hidden sm:block relative">
              <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 bg-dpc-yellow text-navy text-[10px] sm:text-xs font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link to="/account" className="p-2 text-navy hover:text-dpc-blue transition-colors hidden sm:block">
              <User className="h-6 w-6" />
            </Link>
            <Link to="/cart" className="p-2 text-navy hover:text-dpc-blue transition-colors relative">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-dpc-yellow text-navy text-[10px] sm:text-xs font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-20 left-0 w-full h-[calc(100vh-80px)] bg-white border-t border-neutral-border shadow-lg overflow-y-auto z-50">
            <nav className="flex flex-col p-6 space-y-6">
              {navLinks.map((link) => {
                const isActive = location.pathname.startsWith(link.path);
                return (
                  <div key={link.name} className="flex flex-col space-y-3 border-b border-neutral-100 pb-4">
                    <Link 
                      to={link.path} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "font-semibold text-xl",
                        isActive ? "text-dpc-blue" : "text-navy"
                      )}
                    >
                      {link.name}
                    </Link>
                    {link.hasDropdown && (
                      <div className="flex flex-col space-y-3 pl-4 border-l-2 border-neutral-100 mt-2">
                        {link.dropdownItems?.map(sub => (
                          <Link 
                            key={sub.name}
                            to={sub.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-text-muted text-lg hover:text-dpc-blue"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="pt-4 flex flex-col space-y-4">
                <Link 
                  to="/account" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-semibold text-xl text-navy flex items-center space-x-3"
                >
                  <User className="h-6 w-6 text-dpc-blue" />
                  <span>My Account</span>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Sub-Navigation Bar */}
      <div className="bg-neutral-50/95 border-b border-neutral-200 sticky top-20 z-40 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs py-2 font-medium">
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 overflow-x-auto scrollbar-none py-0.5 w-full lg:w-auto">
            <Link 
              to="/rentals" 
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
                location.pathname.startsWith('/rentals')
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-navy border border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              )}
            >
              <Home className="w-3.5 h-3.5 text-emerald-500" />
              <span>House Rentals</span>
              <span className={cn("text-[10px] font-bold px-1.5 py-0.2 rounded-full", location.pathname.startsWith('/rentals') ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-800")}>New</span>
            </Link>

            <Link 
              to="/advertise" 
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
                location.pathname.startsWith('/advertise') || location.pathname.startsWith('/advertisers')
                  ? "bg-navy text-white shadow-xs"
                  : "bg-white text-navy border border-amber-300 hover:bg-amber-50 hover:text-navy"
              )}
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Verified Advertisers</span>
            </Link>

            <div className="h-4 w-px bg-neutral-300 mx-1 shrink-0 hidden sm:block" />

            <Link 
              to="/shop/category/gifts" 
              className={cn("px-2.5 py-1 rounded-md transition-colors whitespace-nowrap", location.pathname === '/shop/category/gifts' ? "text-dpc-blue font-bold bg-white" : "text-text-muted hover:text-navy")}
            >
              Gifts & Hampers
            </Link>
            <Link 
              to="/shop/category/flowers" 
              className={cn("px-2.5 py-1 rounded-md transition-colors whitespace-nowrap", location.pathname === '/shop/category/flowers' ? "text-dpc-blue font-bold bg-white" : "text-text-muted hover:text-navy")}
            >
              Flowers & Cakes
            </Link>
            <Link 
              to="/shop/category/home" 
              className={cn("px-2.5 py-1 rounded-md transition-colors whitespace-nowrap", location.pathname === '/shop/category/home' ? "text-dpc-blue font-bold bg-white" : "text-text-muted hover:text-navy")}
            >
              Shop for Home
            </Link>
            <Link 
              to="/shop/category/family-support" 
              className={cn("px-2.5 py-1 rounded-md transition-colors whitespace-nowrap", location.pathname === '/shop/category/family-support' ? "text-dpc-blue font-bold bg-white" : "text-text-muted hover:text-navy")}
            >
              Family Support
            </Link>
            <Link 
              to="/shop/category/kenya" 
              className={cn("px-2.5 py-1 rounded-md transition-colors whitespace-nowrap", location.pathname === '/shop/category/kenya' ? "text-dpc-blue font-bold bg-white" : "text-text-muted hover:text-navy")}
            >
              Made in Kenya
            </Link>
            <Link 
              to="/gift-builder" 
              className={cn("px-2.5 py-1 rounded-md transition-colors whitespace-nowrap", location.pathname === '/gift-builder' ? "text-dpc-blue font-bold bg-white" : "text-text-muted hover:text-navy")}
            >
              Custom Gift Box
            </Link>
          </div>

          <div className="hidden xl:flex items-center gap-2 text-text-muted text-[11px] shrink-0 pl-4">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>M-Pesa, Card & Escrow Secured</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-navy-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src="/logo.png" alt="DPC" className="h-10 object-contain mb-6 bg-white p-1 rounded" onError={(e) => e.currentTarget.style.display = 'none'} />
            <p className="text-gray-400 text-sm">Connecting diaspora to their loved ones back home in Kenya with premium gifting and support services.</p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-4 text-lg">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/shop/category/gifts" className="hover:text-white transition-colors">Gifts & Hampers</Link></li>
              <li><Link to="/shop/category/flowers" className="hover:text-white transition-colors">Flowers & Cakes</Link></li>
              <li><Link to="/shop/category/electronics" className="hover:text-white transition-colors">Electronics & Appliances</Link></li>
              <li><Link to="/shop/category/family-support" className="hover:text-white transition-colors">Family Support</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-4 text-lg">Services & Rentals</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/rentals" className="hover:text-white transition-colors flex items-center gap-1.5"><span className="text-dpc-yellow">●</span> House Rentals in Kenya</Link></li>
              <li><Link to="/advertise" className="hover:text-white transition-colors">Verified Advertisers</Link></li>
              <li><Link to="/advertise" className="hover:text-white transition-colors">Advertise With Us</Link></li>
              <li><Link to="/shop/category/family-support" className="hover:text-white transition-colors">Family Essentials Support</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-4 text-lg">Customer Care</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping & Delivery</Link></li>
              <li><Link to="/returns" className="hover:text-white transition-colors">Returns Policy</Link></li>
              <li><Link to="/admin" className="text-dpc-yellow hover:underline">Admin Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-4 text-lg">Partner With Us</h4>
            <p className="text-sm text-gray-400 mb-4">Are you a Kenyan bank, developer, or service provider?</p>
            <Link to="/advertise" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Partner & Advertise
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
