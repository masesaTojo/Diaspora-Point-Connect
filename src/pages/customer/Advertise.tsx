import React, { useState } from 'react';
import { 
  Megaphone, 
  TrendingUp, 
  Globe2, 
  Users, 
  DollarSign, 
  Check, 
  CheckCircle2, 
  ArrowRight, 
  Mail, 
  Phone, 
  Sparkles, 
  Award,
  Building2,
  FileText,
  BarChart3
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { AdPlacementInquiry } from '@/src/types';
import { AdvertisersSection } from '@/src/components/sections/AdvertisersSection';

export default function Advertise() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    packageType: 'HOMEPAGE_BANNER' as AdPlacementInquiry['packageType'],
    targetAudience: 'All Diaspora (US, UK, Canada, Europe)',
    notes: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [inquiryId, setInquiryId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = 'AD-' + Math.floor(100000 + Math.random() * 900000);
    setInquiryId(id);
    setSubmitted(true);
  };

  const adPackages = [
    {
      id: 'HOMEPAGE_BANNER',
      name: 'Category & Catalog Sponsor',
      price: '$350',
      period: '/ month',
      description: 'Promote your brand in targeted shop categories, order tracking pages, and gift receipt confirmation screens.',
      features: [
        'Dedicated sponsor banner in 2 product categories',
        'Inclusion on live delivery milestone tracking pages',
        'Monthly click-through and impression analytics report',
        'Standard promo code placement',
        'Direct link to your landing page or WhatsApp business'
      ],
      isPopular: false
    },
    {
      id: 'FEATURED_PARTNER',
      name: 'Featured Verified Partner',
      price: '$750',
      period: '/ month',
      description: 'Our most popular tier. Prominent placement on the homepage Verified Partner Directory with exclusive promo code distribution.',
      features: [
        'Prime Homepage Verified Diaspora Partner card',
        'Exclusive promo discount code box with 1-click copy',
        'Feature in monthly "Investing in Kenya" email newsletter (45,000+ readers)',
        'Social media spotlight across DPC diaspora community channels',
        'Full brand profile modal with customer direct lead capture'
      ],
      isPopular: true
    },
    {
      id: 'ENTERPRISE_SPONSOR',
      name: 'Full Multi-Channel Sponsorship',
      price: '$1,450',
      period: '/ month',
      description: 'For national banks, major developers, and airlines seeking maximum diaspora awareness and verified client acquisition.',
      features: [
        'Top-tier hero banner rotation across all high-traffic customer views',
        'Dedicated solo email blast to our complete 65,000+ diaspora member list',
        'Physical promotional flyer / voucher inserted into gift parcels delivered in Kenya',
        'Custom co-branded diaspora webinar or live Q&A session',
        'Dedicated Account Manager & weekly lead transmission'
      ],
      isPopular: false
    }
  ];

  return (
    <div className="bg-neutral-bg min-h-screen pb-24">
      
      {/* Hero Header */}
      <section className="bg-navy-dark text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=2000&q=80" 
            alt="Business collaboration"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-dark via-navy-dark/95 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-dpc-yellow/20 text-dpc-yellow px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-dpc-yellow/30">
              <Megaphone className="w-4 h-4" /> Advertise & Partner With Diaspora Point Connect
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              Connect Your Brand to High-Intent <span className="text-dpc-yellow">Kenyans Abroad</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8">
              Diaspora Point Connect is the daily hub where Kenyans in the US, UK, Canada, Australia, and Europe send gifts, purchase groceries, book accommodations, and manage investments back home.
            </p>

            <div className="flex flex-wrap gap-4">
              <a href="#packages">
                <Button size="lg" className="bg-dpc-yellow text-navy font-bold hover:bg-yellow-400">
                  View Advertising Packages
                </Button>
              </a>
              <a href="#inquire">
                <Button size="lg" variant="outline" className="text-white border-white/40 hover:bg-white/10">
                  Request Media Kit & Inquire
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Stats Section */}
      <section className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-neutral-200 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl md:text-4xl font-display font-bold text-navy">65,000+</p>
            <p className="text-xs text-text-muted mt-1 uppercase tracking-wider font-semibold">Active Diaspora Shoppers</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-display font-bold text-dpc-blue">4.8x</p>
            <p className="text-xs text-text-muted mt-1 uppercase tracking-wider font-semibold">Higher Purchasing Power</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-display font-bold text-navy">$1,850</p>
            <p className="text-xs text-text-muted mt-1 uppercase tracking-wider font-semibold">Avg. Remittance Basket</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-display font-bold text-green-600">92%</p>
            <p className="text-xs text-text-muted mt-1 uppercase tracking-wider font-semibold">Repeat Cross-Border Users</p>
          </div>
        </div>
      </section>

      {/* Why Advertise With Us */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold text-navy">Why Brands Choose Diaspora Point Connect</h2>
            <p className="text-text-muted text-sm mt-2">
              Unlike generic social media ads, our users visit Diaspora Point Connect with high financial intent to provide for their families and invest back home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-dpc-blue flex items-center justify-center mb-6">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">100% Verified Diaspora Traffic</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Over 85% of our visitors access from North America, the UK, Europe, Australia, and the Gulf. Zero bot traffic or wasted impressions.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-6">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Active Commercial Mindset</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Our members are actively making financial transactions: paying for gifts, utilities, rentals, and seeking credible avenues for land and mortgage investment in Kenya.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Built-In Trust & Escrow Prestige</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                By being featured as a DPC Verified Partner, your business inherits our vetted credibility, overcoming the deep scam skepticism that diaspora buyers usually carry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Advertising Packages */}
      <section id="packages" className="py-20 bg-white border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-dpc-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Partnership Tiers
            </span>
            <h2 className="text-3xl font-display font-bold text-navy mt-3">Transparent Advertising Packages</h2>
            <p className="text-text-muted text-sm mt-2">
              Choose the package that fits your campaign goals or contact our partnerships team for custom enterprise integrations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {adPackages.map((pkg) => (
              <div 
                key={pkg.id}
                className={`rounded-2xl p-8 flex flex-col justify-between transition-all ${pkg.isPopular ? 'bg-navy text-white shadow-2xl scale-105 border-2 border-dpc-yellow relative' : 'bg-neutral-50 text-navy border border-neutral-200'}`}
              >
                {pkg.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-dpc-yellow text-navy px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="text-2xl font-bold font-display">{pkg.name}</h3>
                  <p className={`text-xs mt-2 mb-6 ${pkg.isPopular ? 'text-gray-300' : 'text-text-muted'}`}>
                    {pkg.description}
                  </p>

                  <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-neutral-200/20">
                    <span className="text-4xl font-bold">{pkg.price}</span>
                    <span className={`text-xs ${pkg.isPopular ? 'text-gray-300' : 'text-text-muted'}`}>{pkg.period}</span>
                  </div>

                  <div className="space-y-3 mb-8">
                    {pkg.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs leading-relaxed">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${pkg.isPopular ? 'text-dpc-yellow' : 'text-green-600'}`} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <a href="#inquire" onClick={() => setFormData({ ...formData, packageType: pkg.id as any })}>
                  <Button 
                    className={`w-full font-bold ${pkg.isPopular ? 'bg-dpc-yellow text-navy hover:bg-yellow-400' : 'bg-navy text-white hover:bg-navy-dark'}`}
                  >
                    Select {pkg.name}
                  </Button>
                </a>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Directory of Current Advertisers */}
      <AdvertisersSection showMediaBanner={false} />

      {/* Media Kit & Inquiry Form */}
      <section id="inquire" className="py-20 max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-neutral-200">
          <div className="text-center max-w-lg mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-dpc-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Direct Media Inquiry
            </span>
            <h2 className="text-3xl font-display font-bold text-navy mt-3">Book Your Advertising Space</h2>
            <p className="text-text-muted text-sm mt-1">
              Fill out the details below and our Global Partnerships Director will send you our complete 2026 Media Kit and rate card within 4 business hours.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-navy">Media Inquiry Received!</h3>
              <p className="text-text-muted text-sm max-w-md mx-auto">
                Thank you <strong>{formData.contactPerson}</strong>. Your inquiry reference is <strong className="text-navy">{inquiryId}</strong>. We have dispatched our full Media Kit PDF and demographic breakdown to <strong>{formData.email}</strong>.
              </p>
              <Button onClick={() => setSubmitted(false)} variant="outline">
                Submit Another Inquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Company / Organization Name</label>
                  <input 
                    type="text" required placeholder="e.g. Equity Diaspora Banking / Property Ltd"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full p-3 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Contact Person Name</label>
                  <input 
                    type="text" required placeholder="e.g. Sarah Mwangi (Marketing Lead)"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full p-3 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Business Email</label>
                  <input 
                    type="email" required placeholder="marketing@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Phone / WhatsApp Number</label>
                  <input 
                    type="tel" required placeholder="+254 700 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Preferred Advertising Package</label>
                  <select 
                    value={formData.packageType}
                    onChange={(e) => setFormData({ ...formData, packageType: e.target.value as any })}
                    className="w-full p-3 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue bg-white"
                  >
                    <option value="HOMEPAGE_BANNER">Category & Catalog Sponsor ($350/mo)</option>
                    <option value="FEATURED_PARTNER">Featured Verified Partner ($750/mo)</option>
                    <option value="ENTERPRISE_SPONSOR">Full Multi-Channel Sponsorship ($1,450/mo)</option>
                    <option value="CUSTOM_CAMPAIGN">Custom Enterprise / Seasonal Campaign</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Target Diaspora Region</label>
                  <select 
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full p-3 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue bg-white"
                  >
                    <option value="All Diaspora (US, UK, Canada, Europe)">All Diaspora Worldwide</option>
                    <option value="North America (USA & Canada)">North America (USA & Canada)</option>
                    <option value="United Kingdom & Europe">United Kingdom & Europe</option>
                    <option value="Australia & Gulf / Middle East">Australia & Gulf / Middle East</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Campaign Goals or Special Requests</label>
                <textarea 
                  rows={3}
                  placeholder="Tell us about the product or service you want to promote to Kenyans abroad, campaign launch dates, or special promo offers."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 text-sm border border-neutral-300 rounded-lg focus:ring-dpc-blue focus:border-dpc-blue"
                />
              </div>

              <Button type="submit" size="lg" className="w-full font-bold bg-dpc-blue hover:bg-dpc-blue-dark">
                Send Media Kit Request & Secure Placement
              </Button>

              <p className="text-center text-xs text-text-muted">
                Need immediate partnership assistance? Email us directly at <span className="font-semibold text-navy">partnerships@diasporapoint.com</span>
              </p>
            </form>
          )}

        </div>
      </section>

    </div>
  );
}
