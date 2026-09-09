import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building, 
  ExternalLink, 
  Tag, 
  Check, 
  Copy, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  Award, 
  Users, 
  Globe2, 
  Briefcase,
  Phone,
  Mail,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { mockAdvertisers } from '@/src/lib/rentalsAndAdsData';
import { Advertiser } from '@/src/types';

interface AdvertisersSectionProps {
  showMediaBanner?: boolean;
  limit?: number;
}

export function AdvertisersSection({ showMediaBanner = true, limit }: AdvertisersSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activePartnerModal, setActivePartnerModal] = useState<Advertiser | null>(null);

  const categories = [
    'ALL',
    'Banking & Mortgages',
    'Real Estate & Land',
    'Building & Construction',
    'Flights & Travel',
    'Healthcare',
    'Legal & Relocation'
  ];

  const filtered = mockAdvertisers.filter(ad => {
    if (selectedCategory === 'ALL') return true;
    return ad.category === selectedCategory;
  });

  const displayedAdvertisers = limit ? filtered.slice(0, limit) : filtered;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  return (
    <section className="py-20 bg-white border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dpc-blue bg-blue-50 px-3 py-1 rounded-full mb-3 border border-blue-100">
              <Award className="w-3.5 h-3.5 text-dpc-blue" />
              Verified Diaspora Partners & Advertisers
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-navy">
              Diaspora Services & Partner Directory
            </h2>
            <p className="text-text-muted text-base mt-2 max-w-2xl">
              Trusted Kenyan institutions, diaspora mortgages, verified land developers, and direct-to-site building suppliers vetted to serve Kenyans abroad without middlemen.
            </p>
          </div>

          <Link to="/advertise" className="shrink-0">
            <Button variant="outline" className="flex items-center gap-2 border-dpc-blue/30 text-navy hover:text-dpc-blue hover:bg-blue-50/50">
              <TrendingUp className="w-4 h-4 text-dpc-blue" />
              Advertise With Us
            </Button>
          </Link>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-navy text-white shadow-xs' : 'bg-neutral-100 text-text-muted hover:bg-neutral-200 hover:text-navy'}`}
            >
              {cat === 'ALL' ? 'All Verified Partners' : cat}
            </button>
          ))}
        </div>

        {/* Advertiser Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedAdvertisers.map((partner) => (
            <div 
              key={partner.id}
              className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-dpc-blue/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Banner & Logo */}
                <div className="relative h-44 overflow-hidden bg-neutral-100">
                  <img 
                    src={partner.bannerImage} 
                    alt={partner.businessName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                  
                  {/* Category & Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="bg-navy/90 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-white/20">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> Verified Partner
                    </span>
                  </div>

                  {partner.promoBadge && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-dpc-yellow text-navy px-2.5 py-1 rounded-full text-xs font-bold shadow-xs">
                        {partner.promoBadge}
                      </span>
                    </div>
                  )}

                  {/* Logo overlay & name */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md shrink-0 overflow-hidden border border-neutral-200">
                      <img src={partner.logo} alt="logo" className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <div className="text-white min-w-0">
                      <h3 className="font-display font-bold text-base leading-snug truncate drop-shadow-sm">
                        {partner.businessName}
                      </h3>
                      <span className="text-xs text-gray-300 block truncate">
                        {partner.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <p className="text-xs font-medium text-dpc-blue mb-2 italic">
                    "{partner.tagline}"
                  </p>
                  <p className="text-xs text-text-muted leading-relaxed line-clamp-3 mb-4">
                    {partner.description}
                  </p>

                  {/* Key Highlights */}
                  <div className="space-y-1.5 mb-4 border-t border-neutral-100 pt-3">
                    {partner.keyHighlights.slice(0, 2).map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-navy">
                        <Check className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{h}</span>
                      </div>
                    ))}
                  </div>

                  {/* Exclusive Promo Code Box */}
                  {partner.promoCode && (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <Tag className="w-3.5 h-3.5 text-dpc-yellow" />
                        <span className="font-mono font-bold text-navy">{partner.promoCode}</span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(partner.promoCode!)}
                        className="text-xs text-dpc-blue hover:text-dpc-blue-dark font-semibold flex items-center gap-1 px-2 py-1 rounded hover:bg-white transition-colors"
                      >
                        {copiedCode === partner.promoCode ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-green-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-5 pt-0 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-xs"
                  onClick={() => setActivePartnerModal(partner)}
                >
                  View Details
                </Button>
                <a 
                  href={partner.websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button size="sm" className="w-full text-xs flex items-center justify-center gap-1.5 bg-navy hover:bg-navy-dark">
                    <span>Visit Site</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </a>
              </div>

            </div>
          ))}
        </div>

        {/* Media Kit / Advertise Callout Banner */}
        {showMediaBanner && (
          <div className="mt-16 bg-gradient-to-br from-navy via-navy-dark to-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-dpc-blue/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <span className="text-xs font-bold text-dpc-yellow uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  Business & Advertising Solutions
                </span>
                <h3 className="text-3xl md:text-4xl font-display font-bold leading-tight">
                  Reach 65,000+ Kenyans Living Across the Global Diaspora
                </h3>
                <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl">
                  Are you a Kenyan bank, real estate developer, airline, educational institution, or contractor? Partner with Diaspora Point Connect to place your brand directly in front of high-earning Kenyans in the USA, UK, Canada, Australia, and Europe actively investing back home.
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                  <div className="border-l-2 border-dpc-yellow pl-3">
                    <p className="text-2xl font-bold text-white">65k+</p>
                    <p className="text-xs text-gray-400">Monthly Diaspora Visitors</p>
                  </div>
                  <div className="border-l-2 border-dpc-yellow pl-3">
                    <p className="text-2xl font-bold text-white">$1,850</p>
                    <p className="text-xs text-gray-400">Avg. Basket & Remittance</p>
                  </div>
                  <div className="border-l-2 border-dpc-yellow pl-3">
                    <p className="text-2xl font-bold text-white">92%</p>
                    <p className="text-xs text-gray-400">Verified Cross-Border Intent</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                <Link to="/advertise" className="w-full">
                  <Button size="lg" className="w-full font-bold bg-dpc-yellow text-navy hover:bg-yellow-400">
                    Explore Advertising Packages
                  </Button>
                </Link>
                <Link to="/advertise#inquire" className="w-full">
                  <Button size="lg" variant="outline" className="w-full text-white border-white/30 hover:bg-white/10">
                    Submit Media Kit Inquiry
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* PARTNER DETAILS MODAL */}
      {activePartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-neutral-200 my-auto overflow-hidden">
            
            <div className="relative h-48 bg-navy text-white">
              <img 
                src={activePartnerModal.bannerImage} 
                alt={activePartnerModal.businessName} 
                className="w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent"></div>
              
              <button 
                onClick={() => setActivePartnerModal(null)}
                className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/80 transition-colors"
              >
                ✕
              </button>

              <div className="absolute bottom-4 left-6 right-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white p-1 shadow-lg shrink-0 overflow-hidden border">
                  <img src={activePartnerModal.logo} alt="logo" className="w-full h-full object-cover rounded-lg" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-dpc-yellow tracking-wider">
                    {activePartnerModal.category}
                  </span>
                  <h3 className="text-2xl font-bold font-display">
                    {activePartnerModal.businessName}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              
              <div>
                <h4 className="font-bold text-navy text-base mb-1">Partner Overview</h4>
                <p className="text-sm text-text leading-relaxed">
                  {activePartnerModal.description}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-navy text-base mb-3">Key Diaspora Benefits & Guarantees</h4>
                <div className="space-y-2">
                  {activePartnerModal.keyHighlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-text bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                      <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {activePartnerModal.promoCode && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Exclusive DPC Member Promo</span>
                    <span className="text-sm text-amber-950 font-medium">Use code during checkout or inquiry for special rates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-navy text-base bg-white px-3 py-1 rounded border border-amber-300">
                      {activePartnerModal.promoCode}
                    </span>
                    <button
                      onClick={() => handleCopyCode(activePartnerModal.promoCode!)}
                      className="text-xs bg-navy text-white px-3 py-1.5 rounded font-semibold hover:bg-navy-dark transition-colors"
                    >
                      {copiedCode === activePartnerModal.promoCode ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-neutral-200 pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-text-muted">
                <div className="flex items-center gap-4">
                  {activePartnerModal.contactEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-dpc-blue" /> {activePartnerModal.contactEmail}
                    </span>
                  )}
                  {activePartnerModal.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-dpc-blue" /> {activePartnerModal.phone}
                    </span>
                  )}
                </div>

                <a 
                  href={activePartnerModal.websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button className="flex items-center gap-2">
                    Visit Official Portal <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>

            </div>

          </div>
        </div>
      )}

    </section>
  );
}
