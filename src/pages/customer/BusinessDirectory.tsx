import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Building2, 
  Landmark, 
  Hammer, 
  Briefcase, 
  ShieldCheck, 
  Search, 
  ExternalLink, 
  Phone, 
  Mail, 
  MapPin, 
  Tag, 
  Copy, 
  Check, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight,
  Megaphone
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { mockAdvertisers } from '@/src/lib/rentalsAndAdsData';
import { Advertiser } from '@/src/types';

export default function BusinessDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const catParam = searchParams.get('category') || 'all';

  const [activeCategory, setActiveCategory] = useState<string>(catParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Sync category from URL param
  React.useEffect(() => {
    const p = searchParams.get('category');
    if (p) setActiveCategory(p);
  }, [searchParams]);

  const categories = [
    { id: 'all', label: 'All Verified Businesses', icon: Building2 },
    { id: 'real-estate', label: 'Real Estate & Land', icon: MapPin },
    { id: 'banking', label: 'Banking & Mortgages', icon: Landmark },
    { id: 'construction', label: 'Construction & Home Services', icon: Hammer },
    { id: 'professional', label: 'Professional Services', icon: Briefcase },
  ];

  // Enhanced directory items
  const allBusinesses: Advertiser[] = [
    ...mockAdvertisers,
    {
      id: 'adv-7',
      businessName: 'Co-op Bank Diaspora Banking',
      tagline: 'Kingdom Bank Diaspora Mortgages & Transact Anytime via MCo-op Cash',
      category: 'Banking & Mortgages',
      description: 'Open a Co-op Diaspora Current or Savings Account online from abroad. Access up to 105% diaspora home mortgages with zero hidden charges and competitive interest rates.',
      logo: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?auto=format&fit=crop&w=300&q=80',
      bannerImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      websiteUrl: 'https://co-opbank.co.ke/diaspora',
      promoBadge: 'Zero Account Opening Fee',
      promoCode: 'COOP-DIASPORA',
      contactEmail: 'diaspora@co-opbank.co.ke',
      phone: '+254 703 027 000',
      location: 'Nairobi, Kenya',
      featured: true,
      keyHighlights: [
        'USD, GBP, EUR, and KES dedicated accounts with free internet banking',
        'Direct standing orders to pay school fees, utility bills, and relatives in Kenya',
        'Dedicated Diaspora mortgage desks in UK, USA, and Dubai'
      ]
    },
    {
      id: 'adv-8',
      businessName: 'Archiform Kenya Architectural & Project Management',
      tagline: 'Certified architects and quantity surveyors managing your build remotely',
      category: 'Building & Construction',
      description: 'BORAQS-registered architects and engineers providing architectural blueprints, county council approvals, structural engineering, and weekly video progress audits for diaspora builds.',
      logo: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=300&q=80',
      bannerImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80',
      websiteUrl: 'https://archiformkenya.com',
      promoBadge: 'Free Initial Blueprint Review',
      promoCode: 'ARCHI-DPC',
      contactEmail: 'projects@archiformkenya.com',
      phone: '+254 722 400 900',
      location: 'Kilimani, Nairobi',
      featured: false,
      keyHighlights: [
        'Weekly drone inspection videos and bill of quantities (BOQ) cost controls',
        'Direct liaison with county planning departments for stamped building permits',
        'Over 120 completed residential and commercial builds across Kenya'
      ]
    },
    {
      id: 'adv-9',
      businessName: 'Daly & Inamdar Conveyancing & Diaspora Tax Advocates',
      tagline: 'Trusted legal guidance for property acquisition, probate and KRA tax filing',
      category: 'Professional Services',
      description: 'One of East Africa’s oldest and most respected law firms. Specialized diaspora desk assisting with real estate contracts, land registry title searches, succession, power of attorney, and KRA PIN compliance.',
      logo: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=300&q=80',
      bannerImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      websiteUrl: 'https://dalyinamdar.com',
      promoBadge: '15% Off Legal Retainers',
      promoCode: 'DALY-DIASPORA',
      contactEmail: 'diaspora@dalyinamdar.com',
      phone: '+254 20 221 2345',
      location: 'ABC Place, Westlands, Nairobi',
      featured: true,
      keyHighlights: [
        'Remote execution of Power of Attorney and Sectional Property Act deeds',
        'Comprehensive title registry due diligence and green card verification',
        'Diaspora inheritance, wills, and estate asset protection'
      ]
    }
  ];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredBusinesses = useMemo(() => {
    return allBusinesses.filter(biz => {
      // Category match
      if (activeCategory === 'real-estate' && !biz.category.includes('Real Estate') && !biz.category.includes('Land')) {
        return false;
      }
      if (activeCategory === 'banking' && !biz.category.includes('Banking') && !biz.category.includes('Mortgages')) {
        return false;
      }
      if (activeCategory === 'construction' && !biz.category.includes('Building') && !biz.category.includes('Construction')) {
        return false;
      }
      if (activeCategory === 'professional' && !biz.category.includes('Legal') && !biz.category.includes('Professional')) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return biz.businessName.toLowerCase().includes(q) ||
          biz.tagline.toLowerCase().includes(q) ||
          biz.description.toLowerCase().includes(q) ||
          biz.location.toLowerCase().includes(q);
      }

      return true;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="bg-neutral-50 min-h-screen pb-16">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-navy via-navy-light to-dpc-blue text-white py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-400/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Vetted Diaspora Service Directory
            </span>
            <h1 className="text-3xl md:text-5xl font-display font-bold leading-tight mb-4">
              Connect with Vetted Kenyan Businesses You Can Trust
            </h1>
            <p className="text-blue-100 text-base md:text-lg mb-8 leading-relaxed">
              Find licensed banks, verified title deed developers, certified structural engineers, and top corporate conveyancing lawyers ready to serve Kenyans living abroad.
            </p>

            <div className="flex flex-wrap gap-4">
              <a href="#directory" className="inline-flex items-center gap-2 bg-dpc-yellow text-navy px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-yellow-400 transition-colors">
                Browse Verified Directory
              </a>
              <Link to="/advertise" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-bold text-sm border border-white/20 transition-colors">
                <Megaphone className="w-4 h-4 text-dpc-yellow" /> Advertise Your Business
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 -mt-6" id="directory">

        {/* Filter & Category Tabs */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-neutral-200 mb-8">
          
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by business name, bank, mortgage, lawyers, construction services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-dpc-blue focus:bg-white"
            />
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSearchParams(cat.id === 'all' ? {} : { category: cat.id });
                  }}
                  className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all ${
                    isActive 
                      ? 'bg-navy text-white border-navy shadow-sm' 
                      : 'bg-neutral-50 text-navy border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-dpc-yellow' : 'text-dpc-blue'}`} />
                  <span className="text-xs font-bold leading-tight">{cat.label}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Directory Listings Grid */}
        <div className="space-y-6 mb-16">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-navy">
              {categories.find(c => c.id === activeCategory)?.label || 'Verified Businesses'}
            </h2>
            <span className="text-xs text-text-muted font-medium">
              {filteredBusinesses.length} verified listings
            </span>
          </div>

          {filteredBusinesses.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-neutral-200">
              <Briefcase className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-navy mb-1">No businesses found</h3>
              <p className="text-sm text-text-muted mb-4">Try searching with different keywords or switch categories.</p>
              <Button onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}>
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBusinesses.map(biz => (
                <div 
                  key={biz.id}
                  className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top banner / header */}
                    <div className="relative h-40 bg-neutral-900 overflow-hidden">
                      <img 
                        src={biz.bannerImage} 
                        alt={biz.businessName}
                        className="w-full h-full object-cover opacity-80" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                      
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-navy text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                        {biz.category}
                      </div>

                      {biz.promoBadge && (
                        <div className="absolute top-3 right-3 bg-dpc-yellow text-navy text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-navy" /> {biz.promoBadge}
                        </div>
                      )}

                      <div className="absolute bottom-3 left-3 right-3 flex items-end gap-3">
                        <img 
                          src={biz.logo} 
                          alt={biz.businessName}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-white bg-white shrink-0 shadow-xs" 
                        />
                        <div className="min-w-0">
                          <h3 className="font-bold text-white text-base leading-tight truncate">
                            {biz.businessName}
                          </h3>
                          <p className="text-[11px] text-blue-200 flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" /> {biz.location}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <p className="text-xs font-semibold text-dpc-blue mb-2 italic">
                        "{biz.tagline}"
                      </p>
                      <p className="text-xs text-text-muted leading-relaxed mb-4">
                        {biz.description}
                      </p>

                      {/* Key highlights */}
                      <div className="space-y-1.5 mb-5 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                        {biz.keyHighlights.slice(0, 3).map((hl, i) => (
                          <div key={i} className="flex items-start gap-2 text-[11px] text-navy font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{hl}</span>
                          </div>
                        ))}
                      </div>

                      {/* Promo Code Box */}
                      {biz.promoCode && (
                        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-2 mb-4">
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-amber-800 block">Diaspora Exclusive Code</span>
                            <span className="text-xs font-mono font-bold text-navy truncate block">{biz.promoCode}</span>
                          </div>
                          <button
                            onClick={() => handleCopyCode(biz.promoCode!)}
                            className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                          >
                            {copiedCode === biz.promoCode ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy Code
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="p-5 pt-0 border-t border-neutral-100 flex flex-wrap gap-2 mt-auto">
                    <a 
                      href={biz.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[130px]"
                    >
                      <Button size="sm" className="w-full text-xs font-bold flex items-center justify-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5" /> Visit Official Portal
                      </Button>
                    </a>
                    <a 
                      href={`mailto:${biz.contactEmail}`}
                      className="shrink-0"
                      title={biz.contactEmail}
                    >
                      <Button variant="outline" size="sm" className="text-xs px-3">
                        <Mail className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                    <a 
                      href={`tel:${biz.phone}`}
                      className="shrink-0"
                      title={biz.phone}
                    >
                      <Button variant="outline" size="sm" className="text-xs px-3">
                        <Phone className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advertise Your Business Banner */}
        <div className="bg-gradient-to-r from-navy to-dpc-blue text-white rounded-3xl p-8 md:p-12 shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-dpc-yellow block mb-2">
              For Kenya Businesses & Service Providers
            </span>
            <h3 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Reach 45,000+ Verified Diaspora Customers Monthly
            </h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-4">
              Are you a developer with title deeds, a registered bank offering diaspora mortgages, or a legal firm specializing in cross-border property? Get listed on Diaspora Point Connect.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-blue-200">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Direct Diaspora Leads</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Exclusive Promo Code Distribution</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Monthly Analytics Report</span>
            </div>
          </div>
          <Link to="/advertise" className="shrink-0">
            <Button size="lg" className="bg-dpc-yellow text-navy hover:bg-yellow-400 font-bold border-none px-8 py-3.5 shadow-md">
              Advertise Your Business
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
