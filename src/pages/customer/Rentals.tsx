import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  MapPin, 
  Calendar, 
  Users, 
  Bed, 
  Bath, 
  ShieldCheck, 
  Zap, 
  Wifi, 
  Waves, 
  Utensils, 
  Car, 
  Plane, 
  Star, 
  Check, 
  Search, 
  X, 
  ArrowRight, 
  Heart, 
  Phone, 
  Mail, 
  Sparkles,
  PlusCircle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  DollarSign
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { mockHouseRentals } from '@/src/lib/rentalsAndAdsData';
import { HouseRental, RentalInquiry } from '@/src/types';

export default function Rentals() {
  const [searchParams] = useSearchParams();
  const cityParam = searchParams.get('city');

  const [rentals, setRentals] = useState<HouseRental[]>(mockHouseRentals);
  const [selectedCity, setSelectedCity] = useState<string>(cityParam || 'ALL');

  useEffect(() => {
    if (cityParam) {
      setSelectedCity(cityParam);
    }
  }, [cityParam]);

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStayType, setSelectedStayType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'KES'>('USD');
  const [maxPrice, setMaxPrice] = useState<number>(250);
  const [generatorOnly, setGeneratorOnly] = useState<boolean>(false);
  const [poolOnly, setPoolOnly] = useState<boolean>(false);

  // Selected rental for detail modal
  const [activeRental, setActiveRental] = useState<HouseRental | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Booking inquiry state
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState<boolean>(false);
  const [inquiryRental, setInquiryRental] = useState<HouseRental | null>(null);
  const [inquirySubmitted, setInquirySubmitted] = useState<boolean>(false);
  const [inquiryReference, setInquiryReference] = useState<string>('');

  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    senderLocation: 'United States',
    purpose: 'Personal Stay / Vacation' as RentalInquiry['purpose'],
    checkInDate: '',
    checkOutDate: '',
    guestsCount: 2,
    needAirportPickup: false,
    specialRequests: ''
  });

  // Host submission modal
  const [isHostModalOpen, setIsHostModalOpen] = useState<boolean>(false);
  const [hostSubmitted, setHostSubmitted] = useState<boolean>(false);
  const [hostFormData, setHostFormData] = useState({
    ownerName: '',
    email: '',
    phone: '',
    city: 'Nairobi',
    propertyType: 'Serviced Apartment',
    bedrooms: 2,
    expectedPriceUSD: 60,
    hasGenerator: true,
    hasWifi: true,
    address: ''
  });

  // Currency converter
  const formatPrice = (usd: number) => {
    if (currency === 'USD') return `$${usd}`;
    const kes = Math.round(usd * 130);
    return `KES ${kes.toLocaleString()}`;
  };

  // Filter rentals
  const filteredRentals = useMemo(() => {
    return rentals.filter(rental => {
      if (selectedCity !== 'ALL' && rental.city !== selectedCity) return false;
      if (selectedType !== 'ALL' && rental.propertyType !== selectedType) return false;
      if (selectedStayType === 'Short-Stay' && rental.availableFor === 'Long-Term') return false;
      if (selectedStayType === 'Long-Term' && rental.availableFor === 'Short-Stay') return false;
      if (rental.pricePerNight > maxPrice) return false;
      if (generatorOnly && !rental.amenities.hasGenerator) return false;
      if (poolOnly && !rental.amenities.hasPool) return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = rental.title.toLowerCase().includes(q);
        const matchLocation = rental.location.toLowerCase().includes(q);
        const matchCity = rental.city.toLowerCase().includes(q);
        const matchNeighborhood = rental.neighborhood.toLowerCase().includes(q);
        if (!matchTitle && !matchLocation && !matchCity && !matchNeighborhood) return false;
      }
      return true;
    });
  }, [rentals, selectedCity, selectedType, selectedStayType, maxPrice, generatorOnly, poolOnly, searchQuery]);

  const handleOpenInquiry = (rental: HouseRental) => {
    setInquiryRental(rental);
    setIsInquiryModalOpen(true);
    setInquirySubmitted(false);
  };

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    const refCode = 'RENT-' + Math.floor(100000 + Math.random() * 900000);
    setInquiryReference(refCode);
    setInquirySubmitted(true);
  };

  const handleHostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHostSubmitted(true);
  };

  return (
    <div className="bg-neutral-bg min-h-screen pb-20">
      
      {/* Hero Banner with Diaspora Focus */}
      <section className="relative bg-navy-dark text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80" 
            alt="Kenya Luxury Homes" 
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-dark via-navy-dark/90 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-dpc-yellow/20 text-dpc-yellow px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-dpc-yellow/30">
              <ShieldCheck className="w-4 h-4" /> Vetted Diaspora Accommodations in Kenya
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 leading-tight">
              House & Apartment <span className="text-dpc-yellow">Rentals</span> Back Home
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
              Book verified, secure homes for your holiday homecoming, remote-work stay, or arrange comfortable housing for visiting family members. All properties feature guaranteed power backup, high-speed fiber internet, and 24/7 security.
            </p>

            {/* Value Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10 flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-dpc-yellow shrink-0" />
                <span className="text-xs font-medium text-gray-200">Generator & Solar Backup</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10 flex items-center gap-2.5">
                <Wifi className="w-5 h-5 text-dpc-yellow shrink-0" />
                <span className="text-xs font-medium text-gray-200">High-Speed Fiber WiFi</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-dpc-yellow shrink-0" />
                <span className="text-xs font-medium text-gray-200">24/7 Manned Security</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10 flex items-center gap-2.5">
                <Plane className="w-5 h-5 text-dpc-yellow shrink-0" />
                <span className="text-xs font-medium text-gray-200">JKIA Airport Transfers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
        
        {/* Search & Filter Bar Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-neutral-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            
            {/* Search Input */}
            <div className="relative">
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Location or Keyword</label>
              <div className="relative">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="e.g. Kilimani, Karen, Diani, Pool..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                />
              </div>
            </div>

            {/* City Select */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Destination / City</label>
              <select 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full py-2.5 px-3 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue bg-white"
              >
                <option value="ALL">All Cities in Kenya</option>
                <option value="Nairobi">Nairobi (Kilimani, Karen, Westlands)</option>
                <option value="Mombasa">Mombasa (Nyali & North Coast)</option>
                <option value="Diani Beach">Diani Beach (South Coast)</option>
                <option value="Naivasha">Naivasha & Great Rift Valley</option>
                <option value="Kisumu">Kisumu (Lake Victoria View)</option>
                <option value="Nakuru">Nakuru</option>
              </select>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Property Type</label>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full py-2.5 px-3 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue bg-white"
              >
                <option value="ALL">All Property Types</option>
                <option value="Serviced Apartment">Serviced Apartment</option>
                <option value="Holiday Villa">Holiday Villa</option>
                <option value="Family Townhouse">Family Townhouse</option>
                <option value="Cottage">Country Cottage</option>
                <option value="Penthouse">Penthouse</option>
              </select>
            </div>

            {/* Stay Duration */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Stay Duration</label>
              <select 
                value={selectedStayType} 
                onChange={(e) => setSelectedStayType(e.target.value)}
                className="w-full py-2.5 px-3 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue bg-white"
              >
                <option value="ALL">Short-Stay & Long-Term</option>
                <option value="Short-Stay">Vacation & Short-Stay (Daily)</option>
                <option value="Long-Term">Monthly / Extended Stay</option>
              </select>
            </div>

          </div>

          {/* Secondary Filters & Quick Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-100 text-sm">
            
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Essential Amenities:
              </span>
              <button 
                onClick={() => setGeneratorOnly(!generatorOnly)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 ${generatorOnly ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-neutral-50 text-text-muted border-neutral-200 hover:bg-neutral-100'}`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Guaranteed Generator / Solar
              </button>
              <button 
                onClick={() => setPoolOnly(!poolOnly)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 ${poolOnly ? 'bg-blue-100 text-dpc-blue border-blue-300' : 'bg-neutral-50 text-text-muted border-neutral-200 hover:bg-neutral-100'}`}
              >
                <Waves className="w-3.5 h-3.5 text-blue-600" />
                Swimming Pool
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
                <span className="text-xs text-text-muted">Max Nightly:</span>
                <span className="text-xs font-bold text-navy">{formatPrice(maxPrice)}</span>
                <input 
                  type="range" 
                  min="40" 
                  max="250" 
                  step="10"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-24 accent-dpc-blue cursor-pointer"
                />
              </div>
            </div>

            {/* Currency Switcher & Host Button */}
            <div className="flex items-center gap-3 ml-auto">
              <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-100 text-xs">
                <button 
                  onClick={() => setCurrency('USD')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${currency === 'USD' ? 'bg-white text-navy shadow-xs font-bold' : 'text-text-muted'}`}
                >
                  USD ($)
                </button>
                <button 
                  onClick={() => setCurrency('KES')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${currency === 'KES' ? 'bg-white text-navy shadow-xs font-bold' : 'text-text-muted'}`}
                >
                  KES (Ksh)
                </button>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1.5 text-xs text-navy border-navy/30 hover:bg-navy/5"
                onClick={() => { setIsHostModalOpen(true); setHostSubmitted(false); }}
              >
                <PlusCircle className="w-3.5 h-3.5 text-dpc-blue" />
                List Your Property in Kenya
              </Button>
            </div>

          </div>
        </div>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-navy">
              Available Vetted Rentals in Kenya
            </h2>
            <p className="text-sm text-text-muted mt-0.5">
              Showing {filteredRentals.length} curated properties tailored for diaspora homecoming and family comfort
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500"></span>
            All homes vetted by Diaspora Point Connect local teams
          </div>
        </div>

        {/* Rental Properties Grid */}
        {filteredRentals.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-neutral-200 max-w-lg mx-auto my-8">
            <HomeIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-navy mb-2">No rentals matched your exact filters</h3>
            <p className="text-sm text-text-muted mb-6">Try broadening your search query or increasing the maximum price limit.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedCity('ALL');
                setSelectedType('ALL');
                setSelectedStayType('ALL');
                setSearchQuery('');
                setMaxPrice(250);
                setGeneratorOnly(false);
                setPoolOnly(false);
              }}
            >
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRentals.map((rental) => (
              <div 
                key={rental.id}
                className="bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-sm hover:shadow-xl hover:border-dpc-blue/40 transition-all duration-300 flex flex-col group"
              >
                {/* Image & Badges */}
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 cursor-pointer" onClick={() => { setActiveRental(rental); setActiveImageIndex(0); }}>
                  <img 
                    src={rental.images[0]} 
                    alt={rental.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="bg-navy/90 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-white/20">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> Vetted
                    </span>
                    {rental.isFeatured && (
                      <span className="bg-dpc-yellow text-navy px-2.5 py-1 rounded-full text-xs font-bold">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-navy flex items-center gap-1 shadow-xs">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{rental.rating}</span>
                    <span className="text-text-muted font-normal">({rental.reviewCount})</span>
                  </div>

                  {/* Bottom Location Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                    <span className="text-xs font-medium flex items-center gap-1 drop-shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-dpc-yellow shrink-0" />
                      {rental.location}
                    </span>
                    <span className="text-xs bg-white/20 backdrop-blur-md px-2 py-0.5 rounded font-semibold">
                      {rental.propertyType}
                    </span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 
                      onClick={() => { setActiveRental(rental); setActiveImageIndex(0); }}
                      className="font-display font-bold text-navy text-lg group-hover:text-dpc-blue transition-colors cursor-pointer line-clamp-1 mb-2"
                    >
                      {rental.title}
                    </h3>

                    {/* Room & Specs Icons */}
                    <div className="flex items-center gap-4 text-xs text-text-muted mb-4 pb-3 border-b border-neutral-100">
                      <span className="flex items-center gap-1 font-medium text-navy">
                        <Bed className="w-3.5 h-3.5 text-dpc-blue" /> {rental.bedrooms} Bed{rental.bedrooms > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-navy">
                        <Bath className="w-3.5 h-3.5 text-dpc-blue" /> {rental.bathrooms} Bath{rental.bathrooms > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-navy">
                        <Users className="w-3.5 h-3.5 text-dpc-blue" /> Max {rental.maxGuests}
                      </span>
                    </div>

                    {/* Highlight Features */}
                    <div className="space-y-1.5 mb-5 text-xs text-text-muted">
                      {rental.amenities.hasGenerator && (
                        <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2 py-1 rounded">
                          <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Guaranteed Generator / Solar (No blackouts)</span>
                        </div>
                      )}
                      {rental.amenities.hasWifi && (
                        <div className="flex items-center gap-1.5 text-blue-800 bg-blue-50 px-2 py-1 rounded">
                          <Wifi className="w-3.5 h-3.5 text-dpc-blue shrink-0" />
                          <span>High-Speed Fiber Internet</span>
                        </div>
                      )}
                      {rental.amenities.hasChefService && (
                        <div className="flex items-center gap-1.5 text-green-800 bg-green-50 px-2 py-1 rounded">
                          <Utensils className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          <span>Chef Service Available on Demand</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Action Buttons */}
                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-navy">{formatPrice(rental.pricePerNight)}</span>
                        <span className="text-xs text-text-muted">/ night</span>
                      </div>
                      {rental.pricePerMonth && (
                        <span className="text-[11px] text-text-muted block">
                          or {formatPrice(rental.pricePerMonth)}/month
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setActiveRental(rental); setActiveImageIndex(0); }}
                        className="text-xs"
                      >
                        Details
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleOpenInquiry(rental)}
                        className="text-xs flex items-center gap-1 bg-dpc-blue hover:bg-dpc-blue-dark"
                      >
                        Book / Inquire <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* DETAIL MODAL */}
      {activeRental && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200 my-auto">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white z-20 px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-dpc-blue tracking-wider">
                  {activeRental.propertyType} • {activeRental.city}
                </span>
                <h2 className="text-xl md:text-2xl font-display font-bold text-navy">
                  {activeRental.title}
                </h2>
              </div>
              <button 
                onClick={() => setActiveRental(null)}
                className="p-2 rounded-full hover:bg-neutral-100 text-navy transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              
              {/* Image Gallery */}
              <div className="space-y-3">
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-neutral-900 shadow-sm">
                  <img 
                    src={activeRental.images[activeImageIndex]} 
                    alt={activeRental.title} 
                    className="w-full h-full object-cover"
                  />
                  {activeRental.images.length > 1 && (
                    <>
                      <button 
                        onClick={() => setActiveImageIndex((prev) => (prev === 0 ? activeRental.images.length - 1 : prev - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-navy flex items-center justify-center shadow-md transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setActiveImageIndex((prev) => (prev === activeRental.images.length - 1 ? 0 : prev + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-navy flex items-center justify-center shadow-md transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full font-medium">
                    Photo {activeImageIndex + 1} of {activeRental.images.length}
                  </div>
                </div>

                {/* Thumbnails */}
                {activeRental.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {activeRental.images.map((img, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${idx === activeImageIndex ? 'border-dpc-blue scale-105 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'}`}
                      >
                        <img src={img} alt="thumb" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Details Bar */}
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-xs text-text-muted block">Location</span>
                    <span className="font-semibold text-navy flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-dpc-blue" /> {activeRental.location}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted block">Configuration</span>
                    <span className="font-semibold text-navy">
                      {activeRental.bedrooms} Bed • {activeRental.bathrooms} Bath • Max {activeRental.maxGuests} Guests
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted block">Host</span>
                    <span className="font-semibold text-navy flex items-center gap-1">
                      {activeRental.hostName} ({activeRental.hostType})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-2xl font-bold text-navy">{formatPrice(activeRental.pricePerNight)}</span>
                    <span className="text-xs text-text-muted"> / night</span>
                  </div>
                  <Button 
                    onClick={() => { setActiveRental(null); handleOpenInquiry(activeRental); }}
                    className="bg-dpc-blue hover:bg-dpc-blue-dark"
                  >
                    Reserve / Inquire Now
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-bold text-navy mb-2">About this Rental</h3>
                <p className="text-text leading-relaxed text-sm md:text-base">
                  {activeRental.description}
                </p>
              </div>

              {/* Highlights & Features */}
              <div>
                <h3 className="text-lg font-bold text-navy mb-3">Key Property Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {activeRental.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-text bg-white p-3 rounded-lg border border-neutral-200 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities Grid */}
              <div>
                <h3 className="text-lg font-bold text-navy mb-3">Verified Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                  <div className={`p-3 rounded-lg border flex items-center gap-2 ${activeRental.amenities.hasGenerator ? 'bg-amber-50 border-amber-200 text-amber-900 font-semibold' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    <Zap className="w-4 h-4" /> Generator / Solar
                  </div>
                  <div className={`p-3 rounded-lg border flex items-center gap-2 ${activeRental.amenities.hasWifi ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    <Wifi className="w-4 h-4" /> Fiber WiFi
                  </div>
                  <div className={`p-3 rounded-lg border flex items-center gap-2 ${activeRental.amenities.hasSecurity ? 'bg-green-50 border-green-200 text-green-900 font-semibold' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    <ShieldCheck className="w-4 h-4" /> 24/7 Security
                  </div>
                  <div className={`p-3 rounded-lg border flex items-center gap-2 ${activeRental.amenities.hasPool ? 'bg-cyan-50 border-cyan-200 text-cyan-900 font-semibold' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    <Waves className="w-4 h-4" /> Swimming Pool
                  </div>
                  <div className={`p-3 rounded-lg border flex items-center gap-2 ${activeRental.amenities.hasKitchen ? 'bg-purple-50 border-purple-200 text-purple-900 font-semibold' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    <Utensils className="w-4 h-4" /> Chef Kitchen
                  </div>
                  <div className={`p-3 rounded-lg border flex items-center gap-2 ${activeRental.amenities.hasParking ? 'bg-gray-50 border-gray-200 text-gray-900 font-semibold' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    <Car className="w-4 h-4" /> Free Parking
                  </div>
                  <div className={`p-3 rounded-lg border flex items-center gap-2 ${activeRental.amenities.hasAirportPickup ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    <Plane className="w-4 h-4" /> Airport Shuttle
                  </div>
                  <div className={`p-3 rounded-lg border flex items-center gap-2 ${activeRental.amenities.hasChefService ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                    <Utensils className="w-4 h-4" /> Chef Available
                  </div>
                </div>
              </div>

              {/* Peace of Mind Notice */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
                <ShieldCheck className="w-8 h-8 text-dpc-blue shrink-0 mt-0.5" />
                <div className="text-sm">
                  <h4 className="font-bold text-navy mb-1">Diaspora Safe-Stay Guarantee</h4>
                  <p className="text-neutral-600 leading-relaxed">
                    Diaspora Point Connect holds your booking in escrow until you or your designated family check in and confirm that power, security, and amenities match specifications. No surprises upon arrival in Kenya.
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div className="text-xs text-text-muted">
                Need help coordinating? WhatsApp Concierge available 24/7.
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setActiveRental(null)}>
                  Close
                </Button>
                <Button 
                  onClick={() => { setActiveRental(null); handleOpenInquiry(activeRental); }}
                  className="bg-dpc-blue hover:bg-dpc-blue-dark"
                >
                  Book / Inquire Now
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* BOOKING INQUIRY MODAL */}
      {isInquiryModalOpen && inquiryRental && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-neutral-200 my-auto overflow-hidden">
            
            <div className="bg-navy p-6 text-white flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-dpc-yellow tracking-wider">
                  Reserve Accommodation
                </span>
                <h3 className="text-xl font-display font-bold">
                  {inquiryRental.title}
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  {inquiryRental.location} • {formatPrice(inquiryRental.pricePerNight)} / night
                </p>
              </div>
              <button 
                onClick={() => setIsInquiryModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {inquirySubmitted ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-bold text-navy">Reservation Request Received!</h4>
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-left max-w-sm mx-auto text-sm space-y-1">
                    <p><span className="text-text-muted">Inquiry Reference:</span> <strong className="text-navy">{inquiryReference}</strong></p>
                    <p><span className="text-text-muted">Property:</span> {inquiryRental.title}</p>
                    <p><span className="text-text-muted">Guest:</span> {formData.guestName}</p>
                    <p><span className="text-text-muted">Purpose:</span> {formData.purpose}</p>
                    {formData.checkInDate && (
                      <p><span className="text-text-muted">Dates:</span> {formData.checkInDate} to {formData.checkOutDate}</p>
                    )}
                  </div>
                  <p className="text-text-muted text-sm max-w-md mx-auto">
                    The host (<strong>{inquiryRental.hostName}</strong>) and our DPC Diaspora Concierge have been notified via SMS & email. We will confirm dates and payment link within 2 hours.
                  </p>
                  <div className="flex gap-3 justify-center pt-2">
                    <Button onClick={() => setIsInquiryModalOpen(false)}>
                      Done & Return
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  
                  {/* Purpose */}
                  <div>
                    <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                      Who is staying?
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {(['Personal Stay / Vacation', 'For Family in Kenya', 'Business Travel', 'Long-term Relocation'] as RentalInquiry['purpose'][]).map((p) => (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setFormData({ ...formData, purpose: p })}
                          className={`p-2.5 rounded-lg border text-left font-medium transition-colors ${formData.purpose === p ? 'bg-blue-50 border-dpc-blue text-dpc-blue font-bold shadow-2xs' : 'bg-neutral-50 border-neutral-200 text-text-muted hover:bg-neutral-100'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Guest Contact Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-navy mb-1">Your Full Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="John Doe"
                        value={formData.guestName}
                        onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy mb-1">Your Overseas Location</label>
                      <select
                        value={formData.senderLocation}
                        onChange={(e) => setFormData({ ...formData, senderLocation: e.target.value })}
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue bg-white"
                      >
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany / Europe">Germany / Europe</option>
                        <option value="UAE / Gulf">UAE / Gulf</option>
                        <option value="Other Diaspora">Other Diaspora</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-navy mb-1">Email Address</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="john@example.com"
                        value={formData.guestEmail}
                        onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy mb-1">WhatsApp / Phone Number</label>
                      <input 
                        type="tel" 
                        required 
                        placeholder="+1 (555) 000-0000"
                        value={formData.guestPhone}
                        onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                      />
                    </div>
                  </div>

                  {/* Dates & Guests */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-navy mb-1">Check-in Date</label>
                      <input 
                        type="date" 
                        required
                        value={formData.checkInDate}
                        onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy mb-1">Check-out Date</label>
                      <input 
                        type="date" 
                        required
                        value={formData.checkOutDate}
                        onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy mb-1">Guests Count</label>
                      <input 
                        type="number" 
                        min="1" 
                        max={inquiryRental.maxGuests}
                        value={formData.guestsCount}
                        onChange={(e) => setFormData({ ...formData, guestsCount: Number(e.target.value) })}
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                      />
                    </div>
                  </div>

                  {/* Airport Transfer Checkbox */}
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="pickup"
                      checked={formData.needAirportPickup}
                      onChange={(e) => setFormData({ ...formData, needAirportPickup: e.target.checked })}
                      className="w-4 h-4 text-dpc-blue rounded border-neutral-300 focus:ring-dpc-blue"
                    />
                    <label htmlFor="pickup" className="text-xs text-navy font-medium cursor-pointer">
                      I would like to request JKIA / local Airport Chauffeur Pickup upon arrival
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">Special Inquiries or Family Viewing Request</label>
                    <textarea 
                      rows={2}
                      placeholder="e.g. Would like a family member in Nairobi to view the property first, need extra cot for baby, high-speed WiFi required for US working hours."
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                      className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setIsInquiryModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-dpc-blue hover:bg-dpc-blue-dark"
                    >
                      Submit Reservation Request
                    </Button>
                  </div>

                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* HOST LISTING MODAL */}
      {isHostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-neutral-200 my-auto overflow-hidden">
            <div className="bg-navy p-6 text-white flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-dpc-yellow tracking-wider">
                  Landlord & Host Portal
                </span>
                <h3 className="text-xl font-display font-bold">
                  List Your Property to Diaspora Guests
                </h3>
              </div>
              <button onClick={() => setIsHostModalOpen(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {hostSubmitted ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-bold text-navy">Property Application Submitted!</h4>
                  <p className="text-text-muted text-sm max-w-md mx-auto">
                    Thank you {hostFormData.ownerName}. A DPC inspection specialist will contact you within 24 hours to schedule a physical quality and security verification of your property in {hostFormData.city}.
                  </p>
                  <Button onClick={() => setIsHostModalOpen(false)}>Done</Button>
                </div>
              ) : (
                <form onSubmit={handleHostSubmit} className="space-y-4">
                  <p className="text-xs text-text-muted">
                    Diaspora guests look for quality, security, and power backup. Submit your property to be vetted and featured.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-navy mb-1">Host / Owner Name</label>
                      <input 
                        type="text" required placeholder="Jane Doe"
                        value={hostFormData.ownerName}
                        onChange={(e) => setHostFormData({ ...hostFormData, ownerName: e.target.value })}
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy mb-1">Kenyan Phone (WhatsApp)</label>
                      <input 
                        type="tel" required placeholder="0712 345 678"
                        value={hostFormData.phone}
                        onChange={(e) => setHostFormData({ ...hostFormData, phone: e.target.value })}
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-navy mb-1">City</label>
                      <select 
                        value={hostFormData.city}
                        onChange={(e) => setHostFormData({ ...hostFormData, city: e.target.value })}
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue bg-white"
                      >
                        <option value="Nairobi">Nairobi</option>
                        <option value="Mombasa">Mombasa</option>
                        <option value="Diani Beach">Diani Beach</option>
                        <option value="Naivasha">Naivasha</option>
                        <option value="Kisumu">Kisumu</option>
                        <option value="Nakuru">Nakuru</option>
                        <option value="Eldoret">Eldoret</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy mb-1">Property Type</label>
                      <select 
                        value={hostFormData.propertyType}
                        onChange={(e) => setHostFormData({ ...hostFormData, propertyType: e.target.value })}
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue bg-white"
                      >
                        <option value="Serviced Apartment">Serviced Apartment</option>
                        <option value="Holiday Villa">Holiday Villa</option>
                        <option value="Family Townhouse">Family Townhouse</option>
                        <option value="Cottage">Cottage</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy mb-1">Bedrooms</label>
                      <input 
                        type="number" min="1" max="10"
                        value={hostFormData.bedrooms}
                        onChange={(e) => setHostFormData({ ...hostFormData, bedrooms: Number(e.target.value) })}
                        className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">Physical Address & Estate</label>
                    <input 
                      type="text" required placeholder="e.g. Kilimani, Rose Avenue, Royal Palms Court Unit B4"
                      value={hostFormData.address}
                      onChange={(e) => setHostFormData({ ...hostFormData, address: e.target.value })}
                      className="w-full p-2.5 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                    />
                  </div>

                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-navy cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={hostFormData.hasGenerator}
                        onChange={(e) => setHostFormData({ ...hostFormData, hasGenerator: e.target.checked })}
                        className="w-4 h-4 text-dpc-blue rounded"
                      />
                      Has Generator / Inverter Power Backup
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-navy cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={hostFormData.hasWifi}
                        onChange={(e) => setHostFormData({ ...hostFormData, hasWifi: e.target.checked })}
                        className="w-4 h-4 text-dpc-blue rounded"
                      />
                      Has High-Speed Fiber WiFi
                    </label>
                  </div>

                  <div className="pt-3 flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsHostModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      Submit for DPC Inspection
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
