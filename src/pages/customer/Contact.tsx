import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  MessageSquare,
  ShieldCheck,
  Globe2
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { auth, db } from '@/src/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { buildFirestoreErrorInfo, OperationType, stripUndefined } from '@/src/lib/firestoreErrors';
import { SupportTicket } from '@/src/types';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'United States',
    subject: 'General Customer Support',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (formData.message.trim().length < 5) {
      setSubmitError('Please enter a message of at least 5 characters.');
      return;
    }

    setSubmitting(true);
    const id = `DPC-TK-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const nowIso = new Date().toISOString();
    const verifiedUid = auth.currentUser?.emailVerified ? auth.currentUser.uid : undefined;

    const payload: SupportTicket = stripUndefined({
      id,
      customerId: verifiedUid,
      name: formData.name.trim().slice(0, 120),
      email: formData.email.trim().slice(0, 254),
      phone: formData.phone.trim() ? formData.phone.trim().slice(0, 32) : undefined,
      country: formData.country.trim().slice(0, 80),
      subject: formData.subject.trim().slice(0, 160),
      message: formData.message.trim().slice(0, 3000),
      source: 'CONTACT_PAGE',
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
        'Contact inquiry submission failed:',
        JSON.stringify(buildFirestoreErrorInfo(err, OperationType.CREATE, `supportTickets/${id}`))
      );
      setSubmitError('Unable to submit message right now. Please try again or reach us via WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-neutral-bg min-h-screen pb-24">
      {/* Hero Header */}
      <section className="bg-navy-dark text-white py-16 md:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-dpc-yellow bg-dpc-yellow/20 px-3 py-1 rounded-full border border-dpc-yellow/30 mb-4 inline-block">
            24/7 Global Diaspora Support
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Contact <span className="text-dpc-yellow">Diaspora Point Connect</span>
          </h1>
          <p className="text-gray-300 text-base max-w-xl mx-auto leading-relaxed">
            Have questions about an existing gift delivery or family support groceries? We are here for you.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Details Card */}
          <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
            <h3 className="font-display font-bold text-xl text-navy">Direct Contact Channels</h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-dpc-blue flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-navy text-xs uppercase">Kenya Direct & WhatsApp</span>
                  <a href="tel:+254700372536" className="text-text hover:text-dpc-blue font-medium">
                    +254 700 372 536
                  </a>
                  <span className="block text-[11px] text-text-muted">Instant WhatsApp concierge available</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 text-amber-700 flex items-center justify-center shrink-0">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-navy text-xs uppercase">US & UK Helpline Numbers</span>
                  <p className="text-text font-medium text-xs">US: +1 (800) 412-DPC-KE</p>
                  <p className="text-text font-medium text-xs">UK: +44 20 7946 0991</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-navy text-xs uppercase">Email Inquiries</span>
                  <a href="mailto:support@diasporapointconnect.com" className="text-text hover:text-dpc-blue font-medium">
                    support@diasporapointconnect.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-navy text-xs uppercase">Nairobi Headquarters</span>
                  <p className="text-text text-xs leading-relaxed">
                    The Mirage Towers, 7th Floor<br />
                    Chiromo Road, Westlands<br />
                    Nairobi, Kenya
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-navy flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-navy text-xs uppercase">Hours of Operation</span>
                  <p className="text-text text-xs">
                    Dispatch Team: 7:00 AM - 9:00 PM EAT<br />
                    Diaspora Online Concierge: 24/7 Coverage
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-dpc-blue flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Trusted Guarantee
              </span>
              <p className="text-text-muted leading-relaxed">
                All messages and inquiries receive human responses within 2 to 4 hours maximum.
              </p>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-3xl border border-neutral-200 shadow-sm">
            <h3 className="font-display font-bold text-2xl text-navy mb-2">Send Us a Direct Message</h3>
            <p className="text-text-muted text-sm mb-6">
              Fill out the form below and our dedicated customer concierge will assist you promptly.
            </p>

            {submitted ? (
              <div className="p-8 bg-green-50 border border-green-200 rounded-2xl text-center space-y-4">
                <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto" />
                <h4 className="text-xl font-bold text-navy">Message Received!</h4>
                <p className="text-sm text-green-800">
                  Your tracking ticket ID is <span className="font-mono font-bold">{ticketId}</span>. A member of our concierge team will reach out to you via your preferred channel shortly.
                </p>
                <Button onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
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
                    <label className="block text-xs font-bold text-navy uppercase mb-1">Your Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. John Kamau"
                      className="w-full p-3 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-dpc-blue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy uppercase mb-1">Your Email</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="e.g. john@example.com"
                      className="w-full p-3 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-dpc-blue outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy uppercase mb-1">Phone / WhatsApp</label>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+1 (555) 000-0000"
                      className="w-full p-3 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-dpc-blue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy uppercase mb-1">Where are you based?</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="w-full p-3 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-dpc-blue outline-none bg-white"
                    >
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany / Europe">Germany / Europe</option>
                      <option value="UAE / Gulf">UAE / Gulf</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Inquiry Category</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full p-3 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-dpc-blue outline-none bg-white"
                  >
                    <option value="Gifts & Groceries Delivery">Gifts & Groceries Delivery</option>
                    <option value="Payment / Currency Question">Payment / Currency Question</option>
                    <option value="General Customer Support">General Customer Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy uppercase mb-1">Your Message</label>
                  <textarea 
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="How can our team assist you today?"
                    className="w-full p-3 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-dpc-blue outline-none"
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full py-3.5 bg-navy hover:bg-navy-light text-white font-bold rounded-xl flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> {submitting ? 'Submitting Inquiry...' : 'Submit Inquiry'}
                </Button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
