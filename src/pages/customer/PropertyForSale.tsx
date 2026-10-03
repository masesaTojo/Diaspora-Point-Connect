import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  ExternalLink, 
  Search, 
  SlidersHorizontal, 
  Eye, 
  Check, 
  Sparkles, 
  FileCheck, 
  KeyRound, 
  Award, 
  BadgeCheck, 
  BedDouble, 
  Bath, 
  Maximize2, 
  X, 
  PhoneCall, 
  Send,
  Users,
  DollarSign,
  BarChart
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { useShop } from '@/src/contexts/ShopContext';
import { Property } from '@/src/types';

export const mockProperties: Property[] = [
  {
    id: 'prop-1',
    referenceNumber: 'DPC-001',
    originalProjectName: 'San Remo Heights',
    publicListingName: 'Premium Westlands Apartments',
    type: 'New Development',
    location: 'Westlands Road, Westlands, Nairobi',
    neighborhood: 'Westlands',
    city: 'Nairobi',
    developer: 'TBD',
    propertyCompany: 'TBD',
    unitTypes: [
      { type: '1-Bedroom', size: '55 m²', price: 6000000 },
      { type: '1-Bedroom + Study', size: '75 m²', price: 8500000 },
      { type: '2-Bedroom Master Ensuite', size: '110 m²', price: 12000000 }
    ],
    currentPrice: 'KSh 6,000,000',
    priceUSD: 46153, // Approx for calculation
    availableUnits: 0, // TBD
    paymentPlan: '20% deposit within 14 days, 30% after 6 months, 20% one year later, 30% upon completion',
    expectedCompletionDate: 'December 2028',
    indicativeROI: '11%–14%',
    commissionRate: '3%',
    commissionTerms: 'TBD',
    contactDetails: 'TBD',
    status: 'Available',
    internalNotes: 'TBD',
    lastUpdated: '2026-09-23',
    completionYear: '2028',
    bedrooms: 1,
    bathrooms: 1,
    areaSqFt: 592, // 55 sqm to sqft
    titleStatus: 'Under Registration',
    isVerified: true,
    isNewDevelopment: true,
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Discover a prime off-plan apartment investment opportunity along Westlands Road, approximately 600 metres from GTC and Sarit Centre. The development offers modern apartments designed for convenient urban living.',
    amenities: ['GTC and Sarit Centre (600m)', 'Leading hotels and restaurants', 'Major shopping centres', 'Nairobi Expressway Access', 'Naivas & Quickmart (5 min walk)', 'Street Kitchen (2 min away)'],
    rentalYield: '11%–14% Est. ROI',
    parkingDetails: 'TBD',
    serviceCharge: 'TBD',
    informationSource: 'TBD',
    exactProjectAddress: 'Westlands Road',
    googleMapsLocation: 'TBD'
  },
  {
    id: 'prop-2',
    referenceNumber: 'DPC-002',
    originalProjectName: 'Riverside Emerald Residency',
    publicListingName: 'Kileleshwa Riverside Luxury 3-Bedroom Ensuite with DSQ',
    type: 'Apartment',
    location: 'Mandera Road, Kileleshwa',
    neighborhood: 'Kileleshwa',
    city: 'Nairobi',
    developer: 'Emerald Crest Properties',
    propertyCompany: 'Emerald Crest Properties',
    unitTypes: [
      { type: '3 Bedroom + DSQ', size: '1850 Sq Ft', price: 165000 }
    ],
    currentPrice: 165000,
    priceUSD: 165000,
    availableUnits: 4,
    paymentPlan: 'Cash or Mortgage (Pre-approved with KCB Diaspora)',
    expectedCompletionDate: 'Ready for Occupation',
    indicativeROI: '8.5%',
    commissionRate: '3%',
    commissionTerms: 'Paid upon full payment by client',
    contactDetails: 'Sarah Wambui - +254 722 987 654',
    status: 'Available',
    internalNotes: 'Ready units. High demand for rentals.',
    lastUpdated: '2026-09-22',
    completionYear: 'Ready for Occupation',
    bedrooms: 3,
    bathrooms: 3.5,
    areaSqFt: 1850,
    titleStatus: 'Sectional Title Deed (99 Yrs)',
    isVerified: true,
    isNewDevelopment: false,
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Move-in ready luxury apartment overlooking the lush greenery of the Nairobi Arboretum fringe. Solar water heating, separate domestic servant quarter (DSQ), and dedicated 2 parking slots.',
    amenities: ['Separate Servant Quarter (DSQ)', 'Solar Water Heating', '2 Covered Parking Bays', 'Electric Fence & CCTV', 'Clubhouse & Coffee Lounge'],
    rentalYield: '8.5% Est. ROI'
  },
  {
    id: 'prop-3',
    referenceNumber: 'DPC-003',
    originalProjectName: 'Westlands Pinnacle Suites',
    publicListingName: 'The Westlands Pinnacle Studio & 1-Bedroom Executive Suites',
    type: 'New Development',
    location: 'Westlands, Close to Sarit Centre',
    neighborhood: 'Westlands',
    city: 'Nairobi',
    developer: 'Prime West Capital Ltd',
    propertyCompany: 'Prime West Capital Ltd',
    unitTypes: [
      { type: 'Studio', size: '400 Sq Ft', price: 55000 },
      { type: '1 Bedroom', size: '620 Sq Ft', price: 78000 }
    ],
    currentPrice: 78000,
    priceUSD: 78000,
    availableUnits: 12,
    paymentPlan: '10% Deposit, Balance over 24 months',
    expectedCompletionDate: 'Q2 2026',
    indicativeROI: '11.5%',
    commissionRate: '4%',
    commissionTerms: 'Standard',
    contactDetails: 'Peter Kamau - +254 733 111 222',
    status: 'Available',
    internalNotes: 'Perfect for Airbnb. Managed services available.',
    lastUpdated: '2026-09-21',
    completionYear: 'Q2 2026',
    bedrooms: 1,
    bathrooms: 1,
    areaSqFt: 620,
    titleStatus: 'Sectional Title Deed (99 Yrs)',
    isVerified: true,
    isNewDevelopment: true,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Engineered specifically for Airbnb and executive diaspora rentals. High rental yields from multinational diplomats and corporate travelers in Westlands commercial corridor.',
    amenities: ['Turnkey Airbnb Management Support', 'Automatic Backup Generator', 'Rooftop Bar & Lounge', 'Co-working Business Hub', 'Intercom Security'],
    rentalYield: '11.5% Est. ROI'
  },
  {
    id: 'prop-4',
    referenceNumber: 'DPC-004',
    originalProjectName: 'Swahili Nyali Heights',
    publicListingName: 'Nyali Coastal Haven 3-Bedroom Ocean-Breeze Apartments',
    type: 'Apartment',
    location: 'Links Road, Nyali',
    neighborhood: 'Nyali',
    city: 'Mombasa',
    developer: 'Swahili Horizon Builders',
    propertyCompany: 'Swahili Horizon Builders',
    unitTypes: [
      { type: '3 Bedroom', size: '1900 Sq Ft', price: 135000 }
    ],
    currentPrice: 135000,
    priceUSD: 135000,
    availableUnits: 2,
    paymentPlan: 'Cash only',
    expectedCompletionDate: 'Ready for Occupation',
    indicativeROI: '9.2%',
    commissionRate: '3%',
    commissionTerms: 'Paid upon transfer',
    contactDetails: 'Mombasa Office - +254 744 555 666',
    status: 'Available',
    internalNotes: 'Freehold title. Rare in Nyali.',
    lastUpdated: '2026-09-19',
    completionYear: 'Ready for Occupation',
    bedrooms: 3,
    bathrooms: 3,
    areaSqFt: 1900,
    titleStatus: 'Freehold Title Deed',
    isVerified: true,
    isNewDevelopment: false,
    images: [
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Located in serene Nyali just 5 minutes walk to the sandy beach. Large wraparound balconies to catch the Indian Ocean breeze, private swimming pool, and pristine borehole water.',
    amenities: ['500m to Sandy Beach', 'Private Residents Swimming Pool', 'Standby Generator', 'High-Ceiling Architecture', 'Secure Gated Compound'],
    rentalYield: '9.2% Est. ROI'
  },
  {
    id: 'prop-5',
    referenceNumber: 'DPC-005',
    originalProjectName: 'Riverside Crest Duplexes',
    publicListingName: 'Riverside Serenade 4-Bedroom Duplex Penthouse',
    type: 'Apartment',
    location: 'Riverside Drive, Nairobi',
    neighborhood: 'Riverside',
    city: 'Nairobi',
    developer: 'Riverside Crest Holdings',
    propertyCompany: 'Riverside Crest Holdings',
    unitTypes: [
      { type: '4 Bedroom Duplex', size: '3100 Sq Ft', price: 290000 }
    ],
    currentPrice: 290000,
    priceUSD: 290000,
    availableUnits: 1,
    paymentPlan: 'Bank mortgage or cash',
    expectedCompletionDate: 'Ready for Occupation',
    indicativeROI: '8.0%',
    commissionRate: '2.5%',
    commissionTerms: 'Standard',
    contactDetails: 'Main Sales - +254 755 000 111',
    status: 'Available',
    internalNotes: 'Ultra luxury. Diplomatic zone.',
    lastUpdated: '2026-09-23',
    completionYear: 'Ready for Occupation',
    bedrooms: 4,
    bathrooms: 4.5,
    areaSqFt: 3100,
    titleStatus: 'Sectional Title Deed (99 Yrs)',
    isVerified: true,
    isNewDevelopment: false,
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Prestigious duplex penthouse nestled among diplomatic embassies on Riverside Drive. Features panoramic views of Nairobi skyline, private jacuzzi terrace, and smart home automation.',
    amenities: ['Private Jacuzzi Terrace', 'Smart Home Automation', '3 Parking Slots', 'Full Generator & Borehole', 'Diplomatic Security Clearance'],
    rentalYield: '8.0% Est. ROI'
  },
  {
    id: 'prop-6',
    referenceNumber: 'DPC-006',
    originalProjectName: 'Karen Forest Villas',
    publicListingName: 'Karen Forest View 4-Bedroom Gated Villa with Private Garden',
    type: 'Villa / Townhouse',
    location: 'Mbagathi Way / Karen Enclave',
    neighborhood: 'Karen',
    city: 'Nairobi',
    developer: 'Karen Crest Luxury Living',
    propertyCompany: 'Karen Crest Luxury Living',
    unitTypes: [
      { type: '4 Bedroom Villa', size: '3800 Sq Ft', price: 360000 }
    ],
    currentPrice: 360000,
    priceUSD: 360000,
    availableUnits: 1,
    paymentPlan: 'Cash / Bank Guarantee',
    expectedCompletionDate: 'Ready for Occupation',
    indicativeROI: '7.5%',
    commissionRate: '2%',
    commissionTerms: 'Standard',
    contactDetails: 'Karen Office - +254 766 222 333',
    status: 'Available',
    internalNotes: 'Last unit remaining in this phase.',
    lastUpdated: '2026-09-24',
    completionYear: 'Ready for Occupation',
    bedrooms: 4,
    bathrooms: 4.5,
    areaSqFt: 3800,
    titleStatus: 'Freehold Title Deed',
    isVerified: true,
    isNewDevelopment: false,
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Freehold suburban villa set on half-acre compound in leafy Karen. Lush private gardens, solar power system, electric fencing, and stone finishes throughout.',
    amenities: ['Half-Acre Private Compound', 'Freehold Title Deed Ready', 'Solar Power Battery Bank', 'Clubhouse & Tennis Courts', '24/7 Armed Response Patrol'],
    rentalYield: '7.5% Est. ROI'
  }
];

export default function PropertyForSale() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { convertPrice } = useShop();

  const typeParam = searchParams.get('type') || 'ALL';
  const locationParam = searchParams.get('location') || 'ALL';

  const [selectedType, setSelectedType] = useState<string>(typeParam);
  const [selectedLocation, setSelectedLocation] = useState<string>(locationParam);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Property for View Modal
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);

  // Site Visit Modal State
  const [isSiteVisitOpen, setIsSiteVisitOpen] = useState(false);
  const [visitProperty, setVisitProperty] = useState<Property | null>(null);
  const [visitFormSubmitted, setVisitFormSubmitted] = useState(false);
  const [visitForm, setVisitForm] = useState({
    diasporaName: '',
    diasporaEmail: '',
    diasporaPhone: '',
    currentCountry: 'United States',
    kenyaContactName: '',
    kenyaContactPhone: '',
    preferredDate: '',
    preferredTime: 'Morning (10:00 AM)',
    notes: ''
  });

  const locations = ['ALL', 'Kilimani', 'Kileleshwa', 'Westlands', 'Riverside', 'Karen', 'Nyali'];

  const filteredProperties = useMemo(() => {
    return mockProperties.filter(item => {
      // Type
      if (selectedType === 'Apartments' && item.type !== 'Apartment') return false;
      if (selectedType === 'Developments' && !item.isNewDevelopment) return false;
      if (selectedType !== 'ALL' && selectedType !== 'Apartments' && selectedType !== 'Developments' && item.type !== selectedType) return false;

      // Location
      if (selectedLocation !== 'ALL' && item.neighborhood.toLowerCase() !== selectedLocation.toLowerCase()) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.publicListingName.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.developer.toLowerCase().includes(q) ||
          item.neighborhood.toLowerCase().includes(q);
      }

      return true;
    });
  }, [selectedType, selectedLocation, searchQuery]);

  const handleOpenSiteVisit = (prop: Property) => {
    setVisitProperty(prop);
    setVisitFormSubmitted(false);
    setIsSiteVisitOpen(true);
  };

  const handleSiteVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVisitFormSubmitted(true);
  };

  return (
    <div className="bg-neutral-50 min-h-screen pb-16">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-navy via-navy-light to-dpc-blue text-white py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-400/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Title-Verified Diaspora Real Estate
            </span>
            <h1 className="text-3xl md:text-5xl font-display font-bold leading-tight mb-4">
              Invest in Verified Property Across Kenya Without Anxiety
            </h1>
            <p className="text-blue-100 text-base md:text-lg mb-8 leading-relaxed">
              We eliminate fraud for Kenyans abroad. Every apartment, townhome, and off-plan project on Diaspora Point Connect undergoes title deed validation, site coordinates inspection, and escrow contract protection.
            </p>

            <div className="flex flex-wrap gap-4 text-xs md:text-sm font-medium text-blue-100">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-lg border border-white/10">
                <BadgeCheck className="w-4 h-4 text-emerald-400" /> Clean Title Search Guarantee
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-lg border border-white/10">
                <Users className="w-4 h-4 text-dpc-yellow" /> Representative / Family Site Visits
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-lg border border-white/10">
                <FileCheck className="w-4 h-4 text-blue-300" /> Milestone-Based Escrow Payments
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-neutral-200 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search developments, neighborhoods, developers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-dpc-blue focus:bg-white"
              />
            </div>

            {/* Property Type Filter */}
            <div>
              <label className="text-xs font-bold text-navy uppercase tracking-wider block mb-1">Property Type</label>
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium text-navy focus:ring-2 focus:ring-dpc-blue"
              >
                <option value="ALL">All Property Types</option>
                <option value="Apartments">Verified Apartments</option>
                <option value="Developments">New Off-Plan Developments</option>
                <option value="Villa / Townhouse">Villas & Townhouses</option>
              </select>
            </div>

            {/* Location Filter */}
            <div id="locations">
              <label className="text-xs font-bold text-navy uppercase tracking-wider block mb-1">Apartments by Location</label>
              <select 
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium text-navy focus:ring-2 focus:ring-dpc-blue"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>
                    {loc === 'ALL' ? 'All Locations (Nairobi & Coastal)' : loc}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Quick Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-neutral-100">
            <span className="text-xs font-bold text-text-muted mr-2">Quick Navigation:</span>
            <button 
              onClick={() => { setSelectedType('Apartments'); setSelectedLocation('ALL'); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedType === 'Apartments' ? 'bg-navy text-white' : 'bg-neutral-100 text-navy hover:bg-neutral-200'}`}
            >
              Verified Apartments
            </button>
            <button 
              onClick={() => { setSelectedType('Developments'); setSelectedLocation('ALL'); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedType === 'Developments' ? 'bg-navy text-white' : 'bg-neutral-100 text-navy hover:bg-neutral-200'}`}
            >
              New Developments
            </button>
            {['Kilimani', 'Kileleshwa', 'Westlands', 'Riverside', 'Nyali'].map(loc => (
              <button 
                key={loc}
                onClick={() => { setSelectedLocation(loc); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${selectedLocation === loc ? 'bg-dpc-blue text-white' : 'bg-neutral-100 text-text-muted hover:bg-neutral-200'}`}
              >
                {loc}
              </button>
            ))}
            {(selectedType !== 'ALL' || selectedLocation !== 'ALL' || searchQuery) && (
              <button 
                onClick={() => { setSelectedType('ALL'); setSelectedLocation('ALL'); setSearchQuery(''); }}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-red-600 hover:bg-red-50 ml-auto"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Property Grid */}
        <div id="listings" className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-navy">Featured Verified Properties</h2>
              <p className="text-sm text-text-muted">Showing {filteredProperties.length} verified listings ready for diaspora acquisition</p>
            </div>
          </div>

          {filteredProperties.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-neutral-200">
              <Building2 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-navy mb-1">No matching properties found</h3>
              <p className="text-sm text-text-muted mb-4">Try broadening your search or resetting the location filter.</p>
              <Button onClick={() => { setSelectedType('ALL'); setSelectedLocation('ALL'); setSearchQuery(''); }}>
                Reset All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map(property => (
                <div 
                  key={property.id}
                  className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Image Carousel Preview */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                    <img 
                      src={property.images[0]} 
                      alt={property.publicListingName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="bg-navy/90 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                        {property.type}
                      </span>
                      {property.isNewDevelopment && (
                        <span className="bg-dpc-yellow text-navy text-[11px] font-extrabold px-2.5 py-1 rounded-md">
                          New Development
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1 shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Title Verified
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Price & ROI */}
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-2xl font-bold text-navy">
                          {typeof property.currentPrice === 'number' ? convertPrice(property.currentPrice) : property.currentPrice}
                        </span>
                        <span className="text-xs font-bold text-dpc-blue bg-blue-50 px-2 py-0.5 rounded">
                          {property.rentalYield}
                        </span>
                      </div>

                      {/* Title & Location */}
                      <h3 className="font-bold text-navy text-lg leading-snug mb-2 group-hover:text-dpc-blue transition-colors line-clamp-1">
                        {property.publicListingName}
                      </h3>
                      <p className="text-xs text-text-muted flex items-center gap-1 mb-4">
                        <MapPin className="w-3.5 h-3.5 text-dpc-blue shrink-0" />
                        {property.location}
                      </p>

                      {/* Specs */}
                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-neutral-100 text-xs font-semibold text-navy mb-4">
                        <div className="flex items-center gap-1.5">
                          <BedDouble className="w-4 h-4 text-gray-400" />
                          <span>{property.bedrooms} Beds</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bath className="w-4 h-4 text-gray-400" />
                          <span>{property.bathrooms} Baths</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Maximize2 className="w-4 h-4 text-gray-400" />
                          <span>{property.areaSqFt} Sq Ft</span>
                        </div>
                      </div>

                      <div className="text-xs text-text-muted mb-4 space-y-1">
                        <p><strong className="text-navy">Title:</strong> {property.titleStatus}</p>
                        <p><strong className="text-navy">Completion:</strong> {property.completionYear}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 font-bold text-xs"
                        onClick={() => setActiveProperty(property)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 font-bold text-xs bg-navy hover:bg-navy-light"
                        onClick={() => handleOpenSiteVisit(property)}
                      >
                        <Calendar className="w-3.5 h-3.5 mr-1" /> Request Visit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Property Buying Process Roadmap */}
        <div id="process" className="bg-white rounded-3xl p-8 md:p-12 border border-neutral-200 shadow-sm mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-dpc-blue bg-blue-50 px-3 py-1 rounded-full">
              Safe Diaspora Acquisition Roadmap
            </span>
            <h2 className="text-3xl font-display font-bold text-navy mt-3 mb-3">
              The Diaspora Property Buying Process
            </h2>
            <p className="text-text-muted text-sm md:text-base">
              How we protect your hard-earned funds through verified registry checks, family site verification, and licensed conveyancing advocates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 flex flex-col justify-between relative">
              <span className="text-4xl font-extrabold text-blue-100 font-display mb-3">01</span>
              <div>
                <h3 className="font-bold text-navy text-lg mb-2">Search & Pre-Approval</h3>
                <p className="text-xs text-text-muted leading-relaxed mb-4">
                  Select your apartment or villa. If using diaspora financing, obtain pre-approval letters from our partner diaspora mortgage banks (KCB, Co-op, Equity).
                </p>
              </div>
              <span className="text-xs font-bold text-dpc-blue flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 1-3 Business Days
              </span>
            </div>

            {/* Step 2 */}
            <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 flex flex-col justify-between relative">
              <span className="text-4xl font-extrabold text-blue-100 font-display mb-3">02</span>
              <div>
                <h3 className="font-bold text-navy text-lg mb-2">Registry Due Diligence</h3>
                <p className="text-xs text-text-muted leading-relaxed mb-4">
                  Our certified conveyancing lawyers conduct official Lands Registry searches, verify green card records, and ensure zero court caveats or unpaid land rates.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Official Search Certificate
              </span>
            </div>

            {/* Step 3 */}
            <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 flex flex-col justify-between relative">
              <span className="text-4xl font-extrabold text-blue-100 font-display mb-3">03</span>
              <div>
                <h3 className="font-bold text-navy text-lg mb-2">Escrow Agreement</h3>
                <p className="text-xs text-text-muted leading-relaxed mb-4">
                  Sign formal Sale Agreement. Your 10% - 20% deposit is held in a protected bank escrow client account and only released upon verified contract milestones.
                </p>
              </div>
              <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" /> Legal Escrow Protection
              </span>
            </div>

            {/* Step 4 */}
            <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 flex flex-col justify-between relative">
              <span className="text-4xl font-extrabold text-blue-100 font-display mb-3">04</span>
              <div>
                <h3 className="font-bold text-navy text-lg mb-2">Title Transfer & Keys</h3>
                <p className="text-xs text-text-muted leading-relaxed mb-4">
                  Payment of balance and statutory stamp duty. The Ministry of Lands transfers sectional title deed or freehold title to your name. Keys handed over!
                </p>
              </div>
              <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" /> Title Deed in Your Hands
              </span>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-text-muted text-center sm:text-left">
              Need assistance understanding legal fees, stamp duty (4% in municipalities), or bank transfer logistics?
            </p>
            <Link to="/support">
              <Button variant="outline" size="sm">Talk to Real Estate Concierge</Button>
            </Link>
          </div>
        </div>

      </div>

      {/* Property Details View Modal */}
      {activeProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="relative aspect-[16/9] bg-neutral-900">
              <img src={activeProperty.images[0]} alt={activeProperty.publicListingName} className="w-full h-full object-cover" />
              <button 
                onClick={() => setActiveProperty(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4 bg-navy/90 backdrop-blur-xs text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                {activeProperty.developer}
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-neutral-200">
                <div>
                  <span className="text-xs font-bold text-dpc-blue uppercase">{activeProperty.neighborhood}, {activeProperty.city} | REF: {activeProperty.referenceNumber}</span>
                  <h2 className="text-2xl font-bold text-navy mt-1">{activeProperty.publicListingName}</h2>
                  {activeProperty.isNewDevelopment && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold uppercase mt-2 border border-amber-100">
                      <Sparkles className="w-3 h-3" /> Prime Off-Plan Investment
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-navy block">
                    {typeof activeProperty.currentPrice === 'number' ? convertPrice(activeProperty.currentPrice) : activeProperty.currentPrice}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    {activeProperty.indicativeROI ? `${activeProperty.indicativeROI} Indicative ROI` : activeProperty.rentalYield}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-2">Project Overview</h4>
                    <p className="text-sm text-text-muted leading-relaxed">{activeProperty.description}</p>
                  </div>

                  {activeProperty.unitTypes && activeProperty.unitTypes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-3">Available Unit Types</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {activeProperty.unitTypes.map((unit, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-lg">🏠</div>
                              <div>
                                <div className="font-bold text-navy">{unit.type}</div>
                                <div className="text-xs text-text-muted">Size: {unit.size}</div>
                              </div>
                            </div>
                            {unit.price && (
                              <div className="font-bold text-dpc-blue">
                                {typeof unit.price === 'number' ? convertPrice(unit.price) : unit.price}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-3">Prime {activeProperty.neighborhood} Location</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeProperty.amenities.map((amenity, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-navy font-medium bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                          <MapPin className="w-4 h-4 text-dpc-blue shrink-0" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-navy text-white rounded-2xl p-5 shadow-lg">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-blue-200">Investment Summary</h4>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-[10px] uppercase font-bold text-blue-300">Presale Price</div>
                          <div className="text-sm font-bold">{typeof activeProperty.currentPrice === 'number' ? convertPrice(activeProperty.currentPrice) : activeProperty.currentPrice}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <BarChart className="w-5 h-5 text-dpc-yellow shrink-0" />
                        <div>
                          <div className="text-[10px] uppercase font-bold text-blue-300">Indicative ROI</div>
                          <div className="text-sm font-bold">{activeProperty.indicativeROI || activeProperty.rentalYield}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-blue-400 shrink-0" />
                        <div>
                          <div className="text-[10px] uppercase font-bold text-blue-300">Expected Completion</div>
                          <div className="text-sm font-bold">{activeProperty.expectedCompletionDate}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Secure Payment Plan
                    </h4>
                    <div className="space-y-3">
                      {activeProperty.paymentPlan.split(',').map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <div className="w-5 h-5 rounded-full bg-white border border-blue-200 flex items-center justify-center shrink-0 font-bold text-dpc-blue">{idx + 1}</div>
                          <p className="text-navy leading-tight pt-0.5">{step.trim()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    className="flex-1 bg-navy hover:bg-navy-light h-12 text-base font-bold shadow-md"
                    onClick={() => {
                      const prop = activeProperty;
                      setActiveProperty(null);
                      handleOpenSiteVisit(prop);
                    }}
                  >
                    Secure Your Apartment & Book Visit
                  </Button>
                  <Button variant="outline" className="h-12 px-8" onClick={() => setActiveProperty(null)}>
                    Close
                  </Button>
                </div>
                <p className="text-[10px] text-text-muted mt-4 text-center">
                  *Prices, availability, projected returns and completion timelines are subject to change and should be independently verified.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request a Site Visit Modal */}
      {isSiteVisitOpen && visitProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsSiteVisitOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-navy p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {visitFormSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-navy mb-2">Site Visit Request Booked!</h3>
                <p className="text-sm text-text-muted max-w-md mx-auto mb-6">
                  Our Nairobi site concierge will contact both you and your Kenya representative ({visitForm.kenyaContactName || 'your family member'}) to coordinate the gate pass and on-ground tour.
                </p>
                <Button onClick={() => setIsSiteVisitOpen(false)} className="w-full">
                  Return to Property Listings
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSiteVisitSubmit}>
                <div className="mb-6">
                  <span className="text-xs font-bold text-dpc-blue uppercase tracking-wider block">Free Diaspora Site Inspection</span>
                  <h3 className="text-xl font-bold text-navy mt-1">Request a Site Visit</h3>
                  <p className="text-xs text-text-muted mt-1">
                    Visiting: <strong className="text-navy">{visitProperty.publicListingName}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-navy block mb-1">Your Full Name (Diaspora)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Wilson Masesa"
                        value={visitForm.diasporaName}
                        onChange={(e) => setVisitForm({...visitForm, diasporaName: e.target.value})}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-navy block mb-1">Current Country of Residence</label>
                      <select 
                        value={visitForm.currentCountry}
                        onChange={(e) => setVisitForm({...visitForm, currentCountry: e.target.value})}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm"
                      >
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                        <option value="UAE / Gulf">UAE / Gulf</option>
                        <option value="Other">Other Country</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-navy block mb-1">Your Email</label>
                      <input 
                        type="email" 
                        required
                        placeholder="wilson@example.com"
                        value={visitForm.diasporaEmail}
                        onChange={(e) => setVisitForm({...visitForm, diasporaEmail: e.target.value})}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-navy block mb-1">Your WhatsApp / Phone</label>
                      <input 
                        type="text" 
                        required
                        placeholder="+1 (555) 000-0000"
                        value={visitForm.diasporaPhone}
                        onChange={(e) => setVisitForm({...visitForm, diasporaPhone: e.target.value})}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                    <span className="text-xs font-bold text-navy block mb-2">Kenya Representative for On-Ground Inspection</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input 
                          type="text" 
                          required
                          placeholder="Representative Name (Brother, Mum, Lawyer)"
                          value={visitForm.kenyaContactName}
                          onChange={(e) => setVisitForm({...visitForm, kenyaContactName: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <input 
                          type="text" 
                          required
                          placeholder="Kenyan Phone (+254 7XX...)"
                          value={visitForm.kenyaContactPhone}
                          onChange={(e) => setVisitForm({...visitForm, kenyaContactPhone: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-navy block mb-1">Preferred Date</label>
                      <input 
                        type="date" 
                        required
                        value={visitForm.preferredDate}
                        onChange={(e) => setVisitForm({...visitForm, preferredDate: e.target.value})}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-navy block mb-1">Preferred Time Window</label>
                      <select 
                        value={visitForm.preferredTime}
                        onChange={(e) => setVisitForm({...visitForm, preferredTime: e.target.value})}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm"
                      >
                        <option value="Morning (10:00 AM)">Morning (10:00 AM)</option>
                        <option value="Midday (12:30 PM)">Midday (12:30 PM)</option>
                        <option value="Afternoon (2:30 PM)">Afternoon (2:30 PM)</option>
                        <option value="Late Afternoon (4:30 PM)">Late Afternoon (4:30 PM)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-navy block mb-1">Notes / Specific Inquiries</label>
                    <textarea 
                      rows={2}
                      placeholder="e.g. Please verify parking allocations and check water pressure on 4th floor."
                      value={visitForm.notes}
                      onChange={(e) => setVisitForm({...visitForm, notes: e.target.value})}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button type="submit" className="w-full bg-navy hover:bg-navy-light font-bold">
                    Confirm Site Visit Request
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
