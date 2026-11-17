import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Heart, 
  Globe2, 
  Users, 
  Award, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  PhoneCall,
  Clock,
  Lock
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function About() {
  return (
    <div className="bg-neutral-bg min-h-screen pb-24">
      {/* Hero Header */}
      <section className="bg-navy-dark text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=2000&q=80" 
            alt="Connecting diaspora" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-dark via-navy-dark/95 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-dpc-yellow bg-dpc-yellow/20 px-3 py-1 rounded-full border border-dpc-yellow/30 mb-4 inline-block">
              Connecting Homes • Connecting Lives
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight">
              About <span className="text-dpc-yellow">Diaspora Point Connect</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8">
              We are the premier trusted bridge for the Kenyan diaspora worldwide. Empowering Kenyans abroad to gift, care, and support loved ones back home with total peace of mind.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/how-it-works">
                <Button className="bg-dpc-yellow hover:bg-amber-400 text-navy font-bold py-3 px-6 rounded-xl">
                  See How It Works
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 py-3 px-6 rounded-xl">
                  Contact Our Concierge
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-dpc-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100 mb-3 inline-block">
              Why We Built DPC
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-navy mb-6">
              Born from the Lived Experience of Kenyans in the Diaspora
            </h2>
            <div className="space-y-4 text-text text-base leading-relaxed">
              <p>
                Every Kenyan living abroad knows the recurring heartache: you send funds for your mother’s birthday cake or emergency monthly groceries, only for the money to be diverted or the quality compromised. Or you try to send a thoughtful care package through informal channels, only to deal with delays and unverified sellers.
              </p>
              <p>
                Diaspora Point Connect was founded to eliminate that uncertainty forever. We built a secure, closed-loop ecosystem with independent ground teams in Nairobi, Mombasa, Kisumu, Nakuru, and Eldoret.
              </p>
              <p>
                Every gift parcel is delivered with photo proof by our vetted local dispatch teams.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm text-center">
              <div className="w-12 h-12 bg-blue-50 text-dpc-blue rounded-xl flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-2xl text-navy">100%</h3>
              <p className="text-xs text-text-muted mt-1">Verified Gift Fulfillment</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm text-center">
              <div className="w-12 h-12 bg-yellow-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-2xl text-navy">65,000+</h3>
              <p className="text-xs text-text-muted mt-1">Diaspora Members in US, UK, Canada & EU</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm text-center">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-2xl text-navy">45,000+</h3>
              <p className="text-xs text-text-muted mt-1">Successful Deliveries with Photo Proof</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm text-center">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-2xl text-navy">Zero Scam</h3>
              <p className="text-xs text-text-muted mt-1">Regulated Escrow & PesaPal Protection</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="bg-white py-20 border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-dpc-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100 mb-3 inline-block">
              Our 4 Pillars
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-navy mb-4">
              What Sets Diaspora Point Connect Apart
            </h2>
            <p className="text-text-muted text-base">
              Engineered from the ground up to solve the distance and trust gap between Kenya and the diaspora.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'No Middlemen',
                desc: 'Pay direct prices without inflated commissions or relatives keeping change. Full itemized receipts with real Kenyan market rates.',
                icon: Users
              },
              {
                title: 'Multi-Currency Escrow',
                desc: 'Shop and pay securely in USD, KES, GBP, or EUR via international cards or PesaPal. Funds are held safely until verified fulfillment.',
                icon: Lock
              },
              {
                title: 'Photo Proof Delivery',
                desc: 'Our dispatch officers photograph your gift parcel and the smiling recipient upon delivery, sending high-res confirmation straight to your phone.',
                icon: CheckCircle2
              },
              {
                title: 'Nairobi Ground Concierge',
                desc: 'Real human beings based in Westlands, Nairobi available 24/7 across US, UK, and East Africa time zones to answer your calls and coordinate.',
                icon: PhoneCall
              }
            ].map((p, i) => {
              const IconComp = p.icon;
              return (
                <div key={i} className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200 flex flex-col justify-between">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-xs border border-neutral-200 flex items-center justify-center text-navy mb-4 font-bold">
                    <IconComp className="w-6 h-6 text-dpc-blue" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-navy mb-2">{p.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Leadership & Presence */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-navy to-navy-dark text-white rounded-3xl p-8 md:p-14 text-center max-w-4xl mx-auto space-y-6">
          <Globe2 className="w-12 h-12 text-dpc-yellow mx-auto" />
          <h2 className="text-3xl md:text-4xl font-display font-bold">Serving the Global Kenyan Community</h2>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            Whether you are working in healthcare in Dallas, engineering in London, tech in Toronto, nursing in Melbourne, or hospitality in Dubai — Diaspora Point Connect is your steadfast anchor back home.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link to="/shop">
              <Button className="bg-dpc-yellow hover:bg-amber-400 text-navy font-bold py-3 px-6 rounded-xl">
                Explore The Shop
              </Button>
            </Link>
            <Link to="/gift-builder">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 py-3 px-6 rounded-xl">
                Build a Custom Gift
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
