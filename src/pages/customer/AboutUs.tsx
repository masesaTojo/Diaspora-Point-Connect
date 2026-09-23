import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  Globe2, 
  Building2, 
  Home, 
  Send, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function AboutUs() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'United States',
    subject: 'General Inquiry',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="bg-neutral-50 min-h-screen pb-16">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-navy via-navy-light to-dpc-blue text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-400/30">
            Diaspora Point Connect
          </span>
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Connecting Homes, Connecting Lives.
          </h1>
          <p className="text-blue-100 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Bridging the miles between the Kenyan diaspora and loved ones back home through verified gifting, vetted places to stay, and transparent property investments.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8">
        
        {/* Mission Card */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-md border border-neutral-200 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-bold text-dpc-blue uppercase tracking-wider block mb-2">Our Mission & Purpose</span>
              <h2 className="text-3xl font-display font-bold text-navy mb-4">
                Built by Diaspora, for Diaspora
              </h2>
              <p className="text-text-muted text-sm md:text-base leading-relaxed mb-4">
                Millions of Kenyans living in the United States, United Kingdom, Canada, Europe, Australia, and the Gulf send love and support back home every single day. Yet, for too long, this came with anxiety: items arriving late, wilted flowers, middlemen markup, or property deals that lacked verified title deeds.
              </p>
              <p className="text-text-muted text-sm md:text-base leading-relaxed mb-6">
                Diaspora Point Connect was created to eliminate this gap. We combine localized on-the-ground Kenyan logistics with bank-grade international payment gateways (PesaPal) and verified local partnerships to give you absolute peace of mind.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-navy">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All 47 Counties Covered</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>PesaPal Bank-Grade SSL</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Same-Day Nairobi Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Title-Verified Property</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80" 
                alt="Kenyan delivery and care packages" 
                className="rounded-2xl shadow-lg object-cover w-full h-[360px]"
              />
              <div className="absolute -bottom-4 -left-4 bg-navy text-white p-4 rounded-xl shadow-lg border border-white/20 max-w-xs">
                <span className="text-2xl font-bold text-dpc-yellow block">45,000+</span>
                <span className="text-xs text-blue-100">Care packages & gifts successfully delivered across Kenya.</span>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-dpc-blue bg-blue-50 px-3 py-1 rounded-full">
              Platform Architecture
            </span>
            <h2 className="text-3xl font-display font-bold text-navy mt-3 mb-2">
              How Diaspora Point Connect Works
            </h2>
            <p className="text-text-muted text-sm md:text-base">
              A comprehensive ecosystem designed specifically around the "Customer ≠ Recipient" principle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pillar 1 */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-dpc-blue flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-dpc-blue uppercase tracking-wider">01. Gifting & Hampers</span>
                <h3 className="font-bold text-navy text-xl mt-1 mb-2">Surprise Loved Ones in Kenya</h3>
                <p className="text-xs text-text-muted leading-relaxed mb-4">
                  Choose fresh flowers, freshly baked cakes, monthly groceries, or build a custom gift box with personalized handwritten greeting cards.
                </p>
                <ul className="text-xs text-text-muted space-y-1.5 mb-6">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pay in USD, KES, GBP, or EUR via PesaPal</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Same-day Nairobi dispatch before 2 PM EAT</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Discreet recipient gate coordination</li>
                </ul>
              </div>
              <Link to="/shop">
                <Button variant="outline" size="sm" className="w-full text-xs font-bold">
                  Explore Gifts & Shop
                </Button>
              </Link>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <Home className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">02. Places to Stay</span>
                <h3 className="font-bold text-navy text-xl mt-1 mb-2">Verified Homecoming Stays</h3>
                <p className="text-xs text-text-muted leading-relaxed mb-4">
                  Heading home for holidays or family reunions? Book verified serviced apartments, beachfront villas, and holiday cottages with zero blackout risk.
                </p>
                <ul className="text-xs text-text-muted space-y-1.5 mb-6">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Automatic generator power backup guaranteed</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> High-speed Safaricom fiber Wi-Fi</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Handpicked in Nairobi, Mombasa, Naivasha & Diani</li>
                </ul>
              </div>
              <Link to="/rentals">
                <Button variant="outline" size="sm" className="w-full text-xs font-bold">
                  View Places to Stay
                </Button>
              </Link>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">03. Property & Business</span>
                <h3 className="font-bold text-navy text-xl mt-1 mb-2">Invest in Kenya Safely</h3>
                <p className="text-xs text-text-muted leading-relaxed mb-4">
                  Access title-deed verified developments and connect with licensed diaspora mortgage banks, construction suppliers, and legal advocates.
                </p>
                <ul className="text-xs text-text-muted space-y-1.5 mb-6">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Schedule family / representative site visits</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Clean Lands Registry due diligence certificates</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Milestone-based escrow payment security</li>
                </ul>
              </div>
              <Link to="/property-for-sale">
                <Button variant="outline" size="sm" className="w-full text-xs font-bold">
                  Browse Properties for Sale
                </Button>
              </Link>
            </div>

          </div>
        </div>

        {/* Contact Us Section */}
        <div id="contact" className="bg-white rounded-3xl p-8 md:p-12 border border-neutral-200 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Contact Details */}
            <div className="lg:col-span-5">
              <span className="text-xs font-bold text-dpc-blue uppercase tracking-wider block mb-2">Direct Concierge Assistance</span>
              <h2 className="text-3xl font-display font-bold text-navy mb-4">Contact Us</h2>
              <p className="text-sm text-text-muted mb-6 leading-relaxed">
                Whether you have an inquiry about a custom hamper order, need to coordinate a property site inspection, or want to list a rental stay, our Nairobi team is ready to assist.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-dpc-blue flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <strong className="text-navy block text-sm mb-0.5">Nairobi Dispatch & Operations Hub</strong>
                    <span className="text-text-muted">Rhapta Road, Westlands, Nairobi, Kenya</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <strong className="text-navy block text-sm mb-0.5">24/7 WhatsApp & Direct Call</strong>
                    <a href="https://wa.me/254700123456" target="_blank" rel="noopener noreferrer" className="text-dpc-blue font-bold hover:underline">
                      +254 700 123 456
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <strong className="text-navy block text-sm mb-0.5">Customer Support Email</strong>
                    <a href="mailto:support@diasporapointconnect.com" className="text-dpc-blue font-bold hover:underline">
                      support@diasporapointconnect.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <strong className="text-navy block text-sm mb-0.5">Operational Hours</strong>
                    <span className="text-text-muted">Monday – Sunday: 7:00 AM – 10:00 PM East Africa Time (EAT)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Inquiry Form */}
            <div className="lg:col-span-7 bg-neutral-50 p-6 md:p-8 rounded-2xl border border-neutral-200">
              {formSubmitted ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-2">Message Received!</h3>
                  <p className="text-xs text-text-muted max-w-md mx-auto mb-6">
                    Thank you for reaching out to Diaspora Point Connect. A dedicated concierge officer will reply to your email or WhatsApp message within 2 hours.
                  </p>
                  <Button onClick={() => setFormSubmitted(false)} variant="outline" size="sm">
                    Send Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="font-bold text-navy text-lg mb-2">Send Us a Direct Message</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-navy block mb-1">Your Full Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Wilson Masesa"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-navy block mb-1">Country of Residence</label>
                      <select 
                        value={formData.country}
                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs"
                      >
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                        <option value="UAE / Gulf">UAE / Gulf</option>
                        <option value="Kenya">Kenya</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-navy block mb-1">Email Address</label>
                      <input 
                        type="email" 
                        required
                        placeholder="wilson@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-navy block mb-1">WhatsApp / Phone Number</label>
                      <input 
                        type="text" 
                        required
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-navy block mb-1">Inquiry Type</label>
                    <select 
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs"
                    >
                      <option value="Gift Order & Tracking">Gift Order & Tracking Inquiry</option>
                      <option value="Places to Stay / Rentals">Places to Stay / Booking Inquiry</option>
                      <option value="Property for Sale & Site Visit">Property for Sale & Site Visit Inquiry</option>
                      <option value="Business Directory & Advertising">Business Directory & Advertising</option>
                      <option value="PesaPal Payments & Invoices">PesaPal Payments & Invoices</option>
                      <option value="General Inquiry">General Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-navy block mb-1">Message</label>
                    <textarea 
                      rows={4}
                      required
                      placeholder="How can our diaspora concierge team assist you today?"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-navy hover:bg-navy-light font-bold text-xs py-2.5">
                    <Send className="w-3.5 h-3.5 mr-1.5" /> Submit Inquiry
                  </Button>
                </form>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
