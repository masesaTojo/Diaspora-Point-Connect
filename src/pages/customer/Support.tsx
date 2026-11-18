import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  Truck, 
  CreditCard, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/contexts/AuthContext';
import { auth, db } from '@/src/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { buildFirestoreErrorInfo, OperationType, stripUndefined } from '@/src/lib/firestoreErrors';
import { SupportTicket } from '@/src/types';

export default function Support() {
  const { currentUser } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState('');
  const [form, setForm] = useState({
    name: currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : '',
    email: currentUser?.email || '',
    phone: '',
    country: 'United States',
    orderId: '',
    subject: 'Order Tracking & Delivery Status',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (form.message.trim().length < 5) {
      setSubmitError('Please provide a brief message (at least 5 characters) so our concierge can assist you.');
      return;
    }

    setSubmitting(true);
    const id = `TICK-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const nowIso = new Date().toISOString();
    const verifiedUid = auth.currentUser?.emailVerified ? auth.currentUser.uid : undefined;

    const payload: SupportTicket = stripUndefined({
      id,
      customerId: verifiedUid,
      name: form.name.trim().slice(0, 120),
      email: form.email.trim().slice(0, 254),
      phone: form.phone.trim() ? form.phone.trim().slice(0, 32) : undefined,
      country: form.country.trim() ? form.country.trim().slice(0, 80) : undefined,
      orderId: form.orderId.trim() ? form.orderId.trim().slice(0, 128) : undefined,
      subject: form.subject.trim().slice(0, 160),
      message: form.message.trim().slice(0, 3000),
      source: 'SUPPORT_PAGE',
      status: 'OPEN',
      createdAt: nowIso,
      updatedAt: nowIso,
    }) as SupportTicket;

    try {
      await setDoc(doc(db, 'supportTickets', id), payload);
      setTicketId(id);
      setSubmitted(true);
    } catch (err) {
      console.error(
        'Support ticket submission failed:',
        JSON.stringify(buildFirestoreErrorInfo(err, OperationType.CREATE, `supportTickets/${id}`))
      );
      setSubmitError('Unable to submit your support request right now. Please try WhatsApp support or check again shortly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-neutral-50 min-h-screen py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-dpc-blue font-bold text-xs uppercase tracking-wider mb-3">
            24/7 Diaspora Help & Care
          </span>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-navy mb-4">
            How can we help you today?
          </h1>
          <p className="text-text-muted text-base md:text-lg">
            Whether you need to adjust a delivery date in Kenya, track a gift, or ask about PesaPal payments, our cross-border concierge team is ready to assist.
          </p>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Link to="/track" className="bg-white p-5 rounded-2xl border border-neutral-200 hover:border-dpc-blue shadow-xs hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-dpc-blue flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-navy text-base mb-1">Track Delivery</h3>
            <p className="text-xs text-text-muted mb-2">Check live dispatch milestone status in Kenya.</p>
            <span className="text-xs text-dpc-blue font-semibold flex items-center gap-1">Track now <ArrowRight className="w-3.5 h-3.5" /></span>
          </Link>

          <Link to="/faq" className="bg-white p-5 rounded-2xl border border-neutral-200 hover:border-dpc-blue shadow-xs hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-navy text-base mb-1">FAQs & Policies</h3>
            <p className="text-xs text-text-muted mb-2">Answers regarding payments, delivery zones & gifting.</p>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">Read FAQs <ArrowRight className="w-3.5 h-3.5" /></span>
          </Link>

          <Link to="/shipping" className="bg-white p-5 rounded-2xl border border-neutral-200 hover:border-dpc-blue shadow-xs hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-navy text-base mb-1">Kenya Delivery Zones</h3>
            <p className="text-xs text-text-muted mb-2">Rates & coverage for Nairobi, Mombasa, Kisumu, etc.</p>
            <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">View zones <ArrowRight className="w-3.5 h-3.5" /></span>
          </Link>

          <a href="https://wa.me/254700000000?text=Hello%20Diaspora%20Point%20Connect,%20I%20need%20assistance%20with%20an%20order" target="_blank" rel="noopener noreferrer" className="bg-white p-5 rounded-2xl border border-neutral-200 hover:border-green-500 shadow-xs hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-navy text-base mb-1">Live WhatsApp</h3>
            <p className="text-xs text-text-muted mb-2">Instant messaging with our Nairobi concierge desk.</p>
            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">Chat on WhatsApp <ArrowRight className="w-3.5 h-3.5" /></span>
          </a>
        </div>

        {/* Main Grid: Contact Form + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Inquiry Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-navy mb-2">Send Us a Direct Message</h2>
            <p className="text-sm text-text-muted mb-6">
              Fill out the form below and a representative will reply within 30 minutes during business hours.
            </p>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-navy mb-2">Support Ticket Created!</h3>
                <p className="text-sm text-text-muted max-w-md mx-auto mb-4">
                  Thank you, <strong>{form.name}</strong>. Your persisted ticket reference is <span className="font-mono font-bold text-navy">{ticketId}</span>. A concierge agent will follow up at <strong>{form.email}</strong>.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {currentUser && (
                    <Link to="/account?tab=tickets">
                      <Button>View My Support Tickets</Button>
                    </Link>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false);
                      setForm({
                        name: currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : '',
                        email: currentUser?.email || '',
                        phone: '',
                        country: 'United States',
                        orderId: '',
                        subject: 'Order Tracking & Delivery Status',
                        message: ''
                      });
                    }}
                  >
                    Send Another Inquiry
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs">
                    {submitError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy uppercase mb-1">Your Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Sarah Mwangi"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-dpc-blue text-sm"
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy uppercase mb-1">Your Email Address *</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="sarah@example.com"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-dpc-blue text-sm"
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy uppercase mb-1">Phone Number (with Country Code)</label>
                    <input 
                      type="tel" 
                      placeholder="+1 (555) 234-5678"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-dpc-blue text-sm"
                      value={form.phone}
                      onChange={e => setForm({...form, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy uppercase mb-1">Diaspora Resident Country</label>
                    <select 
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-dpc-blue text-sm bg-white"
                      value={form.country}
                      onChange={e => setForm({...form, country: e.target.value})}
                    >
                      <option value="United States">United States (USA)</option>
                      <option value="United Kingdom">United Kingdom (UK)</option>
                      <option value="Canada">Canada</option>
                      <option value="Germany">Germany / EU</option>
                      <option value="Australia">Australia</option>
                      <option value="United Arab Emirates">UAE / Middle East</option>
                      <option value="Kenya">Kenya (Local)</option>
                      <option value="Other">Other Country</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy uppercase mb-1">Order ID (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. ORD-1001"
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-dpc-blue text-sm font-mono"
                      value={form.orderId}
                      onChange={e => setForm({...form, orderId: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy uppercase mb-1">Inquiry Topic *</label>
                    <select 
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-dpc-blue text-sm bg-white"
                      value={form.subject}
                      onChange={e => setForm({...form, subject: e.target.value})}
                    >
                      <option value="Order Tracking & Delivery Status">Order Tracking & Delivery Status</option>
                      <option value="Reschedule / Change Recipient Details">Reschedule / Change Recipient Details</option>
                      <option value="PesaPal / Card / Payment Support">PesaPal / Card / Payment Support</option>
                      <option value="Custom Gift Box Request">Custom Gift Box Request</option>
                      <option value="Corporate / Diaspora Group Order">Corporate / Diaspora Group Order</option>
                      <option value="Other">Other Question</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Your Message *</label>
                  <textarea 
                    required 
                    rows={4} 
                    placeholder="Provide details about your query or instructions for our Kenya delivery couriers..."
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-dpc-blue text-sm"
                    value={form.message}
                    onChange={e => setForm({...form, message: e.target.value})}
                  />
                </div>

                <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> {submitting ? 'Submitting Ticket...' : 'Submit Inquiry'}
                </Button>
              </form>
            )}
          </div>

          {/* Contact Details & Operating Hours */}
          <div className="space-y-6">
            <div className="bg-navy text-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-4">Direct Contact Lines</h3>
              <div className="space-y-4 text-sm text-gray-200">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-dpc-yellow shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Nairobi Delivery Desk:</p>
                    <p className="font-mono text-gray-300">+254 (0) 700 123 456</p>
                    <p className="text-xs text-gray-400">Available 7:00 AM – 9:00 PM EAT</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-dpc-yellow shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">North America Toll-Free:</p>
                    <p className="font-mono text-gray-300">+1 (800) 555-DPC254</p>
                    <p className="text-xs text-gray-400">EST & PST business hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-dpc-yellow shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Customer Email:</p>
                    <p className="text-gray-300">support@diasporapointconnect.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-dpc-yellow shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Kenya Dispatch Center:</p>
                    <p className="text-gray-300">Westlands Commercial Hub, Nairobi, Kenya</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
              <h4 className="font-bold text-navy mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                PesaPal Payment Assurance
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                All card, M-Pesa, and mobile money payments are processed with 256-bit SSL encryption via PesaPal. You will receive an instant payment receipt and digital tracking code immediately upon checkout.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
