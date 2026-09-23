import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  Camera, 
  ShieldCheck, 
  KeyRound, 
  HelpCircle, 
  ArrowRight,
  CheckCircle2,
  Lock,
  PhoneCall
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function HowItWorks() {
  return (
    <div className="bg-neutral-bg min-h-screen pb-24">
      {/* Hero Header */}
      <section className="bg-navy-dark text-white py-16 md:py-24 relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-dpc-yellow bg-dpc-yellow/20 px-3 py-1 rounded-full border border-dpc-yellow/30 mb-4 inline-block">
            Seamless & Transparent
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
            How <span className="text-dpc-yellow">Diaspora Point Connect</span> Works
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            From ordering birthday flowers for mum in Nairobi to verifying a new apartment development, here is how our verified ecosystem safeguards your transactions every step of the way.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 mt-12 space-y-16">
        
        {/* 1. Gifting & Essentials Flow */}
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-neutral-100">
            <div>
              <span className="text-xs font-bold text-dpc-blue uppercase tracking-wider">Service Flow 1</span>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-navy">
                Sending Gifts, Cakes & Groceries to Kenya
              </h2>
            </div>
            <Link to="/shop">
              <Button size="sm" className="bg-navy hover:bg-navy-light text-white text-xs">
                Start Shopping <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '1',
                title: 'Select Products or Build Box',
                desc: 'Browse fresh flowers, custom cakes, family groceries, or build your own custom gift hamper.'
              },
              {
                step: '2',
                title: 'Add Message & Delivery Date',
                desc: 'Write a heartfelt custom greeting card message and choose the exact delivery day in Kenya.'
              },
              {
                step: '3',
                title: 'Pay in USD, KES, GBP or EUR',
                desc: 'Secure checkout via International Visa/Mastercard or PesaPal with instant payment authorization.'
              },
              {
                step: '4',
                title: 'Photo Proof Delivery',
                desc: 'Our dispatch team delivers with white-glove care and uploads instant photo proof of handover.'
              }
            ].map((s, idx) => (
              <div key={idx} className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 relative">
                <span className="w-8 h-8 rounded-full bg-dpc-blue text-white flex items-center justify-center font-bold text-sm mb-4">
                  {s.step}
                </span>
                <h3 className="font-bold text-navy text-base mb-2">{s.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Places to Stay Flow */}
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-neutral-100">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Service Flow 2</span>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-navy">
                Booking Verified Places to Stay & Rentals
              </h2>
            </div>
            <Link to="/places-to-stay">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                Explore Rentals <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '1',
                title: 'Pick Location & Dates',
                desc: 'Filter verified homes in Nairobi, Mombasa, Naivasha, or Diani with guaranteed power generator backup.'
              },
              {
                step: '2',
                title: 'Review Verified Amenities',
                desc: 'Confirm 100 Mbps WiFi speed tests, biometric security, and optional private chef or airport pickup.'
              },
              {
                step: '3',
                title: 'Direct Superhost Connection',
                desc: 'Instant booking inquiry with transparent pricing and zero inflated surprise checkout fees.'
              },
              {
                step: '4',
                title: 'Airport Meet & Keyless Check-in',
                desc: 'Arrive at JKIA or Moi International with optional chauffeur and seamless keyless door code entry.'
              }
            ].map((s, idx) => (
              <div key={idx} className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 relative">
                <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                  {s.step}
                </span>
                <h3 className="font-bold text-navy text-base mb-2">{s.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Verified Property for Sale Flow */}
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-neutral-100">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Service Flow 3</span>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-navy">
                Buying Verified Property in Kenya
              </h2>
            </div>
            <Link to="/property-for-sale">
              <Button size="sm" className="bg-navy hover:bg-navy-light text-white text-xs">
                View Properties <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '1',
                title: 'ArdhiSasa Pre-Screened',
                desc: 'Every apartment and development undergoes title search, zoning review, and NCA permit check before listing.'
              },
              {
                step: '2',
                title: 'Proxy Site Inspection',
                desc: 'Book a live video site inspection or send a trusted proxy accompanied by an independent DPC inspector.'
              },
              {
                step: '3',
                title: 'Regulated Escrow Deposit',
                desc: '10% deposit held securely in an independent advocate escrow account with clear release criteria.'
              },
              {
                step: '4',
                title: 'Title Registration & Handover',
                desc: 'Stamp duty execution, sectional title registration, and safe international delivery or tenant placement.'
              }
            ].map((s, idx) => (
              <div key={idx} className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 relative">
                <span className="w-8 h-8 rounded-full bg-amber-500 text-navy font-bold text-sm mb-4 flex items-center justify-center">
                  {s.step}
                </span>
                <h3 className="font-bold text-navy text-base mb-2">{s.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-navy mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-text-muted">
              Everything you need to know about ordering, paying, and delivery in Kenya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: 'How does currency conversion work?',
                a: 'You can toggle between USD, KES, GBP, and EUR at the top of any page. We use transparent, bank-mid rates with zero hidden markups. You are charged in your selected currency via PesaPal.'
              },
              {
                q: 'What if a product or delivery has an issue?',
                a: 'All orders are backed by our 100% Satisfaction Guarantee. If an item arrives damaged or late, our Nairobi concierge resolves it immediately with a free replacement or refund.'
              },
              {
                q: 'Can I send gifts outside Nairobi?',
                a: 'Yes! We deliver across Nairobi, Kiambu, Machakos, Nakuru, Mombasa, Kisumu, Eldoret, and Naivasha. Delivery zone options are selectable at checkout.'
              },
              {
                q: 'How do you verify properties and developers?',
                a: 'Our property legal desk conducts official searches on the Kenyan Ministry of Lands digital portal (ArdhiSasa), inspects physical construction milestones, and requires regulated lawyer escrow accounts.'
              }
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
                <h4 className="font-bold text-navy text-base mb-2">{faq.q}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
