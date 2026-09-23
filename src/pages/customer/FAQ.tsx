import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  HelpCircle, 
  CreditCard, 
  Truck, 
  Gift, 
  Home, 
  ShieldCheck, 
  Phone,
  Search,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

interface FAQItem {
  question: string;
  answer: string;
  category: 'payments' | 'delivery' | 'orders' | 'rentals';
}

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchFilter, setSearchFilter] = useState('');

  const faqs: FAQItem[] = [
    {
      category: 'payments',
      question: 'Which payment methods are accepted on Diaspora Point Connect?',
      answer: 'We accept payments through the secure PesaPal payment gateway. You can pay using major international credit and debit cards (Visa, Mastercard, American Express), as well as direct M-Pesa and Airtel Money payments from Kenya or overseas.'
    },
    {
      category: 'payments',
      question: 'Can I view prices and pay in USD, KES, GBP, or EUR?',
      answer: 'Yes! Use the Currency Selector located in the top navigation bar (or mobile menu) to switch between USD ($), KES (KSh), GBP (£), and EUR (€). All prices, shipping rates, and order totals dynamically update to your preferred currency.'
    },
    {
      category: 'payments',
      question: 'Is my credit card payment secure?',
      answer: 'Yes. All payments are encrypted with 256-bit bank-grade SSL via PesaPal, a licensed and regulated payment service provider by the Central Bank of Kenya. Your sensitive card details are never stored on our servers.'
    },
    {
      category: 'delivery',
      question: 'How fast is delivery to loved ones in Kenya?',
      answer: 'For Nairobi County and Kiambu environs, we offer same-day delivery for orders placed before 2:00 PM East Africa Time (EAT). For other major towns like Mombasa, Kisumu, Nakuru, and Eldoret, delivery typically takes 24 to 48 hours.'
    },
    {
      category: 'delivery',
      question: 'How does recipient coordination work? Will you spoil the surprise?',
      answer: 'We take great care with gift surprises! When our Nairobi courier calls your recipient to confirm their location, we state that we have a courier parcel delivery for them without disclosing the sender or the contents, preserving the delight of your surprise.'
    },
    {
      category: 'delivery',
      question: 'What delivery zones and counties in Kenya do you cover?',
      answer: 'We cover all 47 counties in Kenya. Nairobi & suburbs are handled by our dedicated in-house fleet. Regional deliveries across Coastal, Rift Valley, Western, and Central regions are dispatched via our vetted express transport partners.'
    },
    {
      category: 'orders',
      question: 'What is the "Customer ≠ Recipient" principle?',
      answer: 'As a diaspora-first service, we distinguish between the Customer (you, living abroad, paying and receiving tax invoices) and the Recipient (your family member or friend in Kenya receiving the gift). You can save multiple recipient contacts in your Account for quick repeat ordering.'
    },
    {
      category: 'orders',
      question: 'Can I include a personalized greeting card and message?',
      answer: 'Yes! During checkout or in the Custom Gift Box Builder, you can add a premium handwritten greeting card and compose a custom message. We hand-write your words onto premium cardstock for a personal touch.'
    },
    {
      category: 'orders',
      question: 'How can I track my order once placed?',
      answer: 'You will receive an instant confirmation email and order tracking code. You can use our "Track Order" link in the top navigation to view live milestones from confirmation to Nairobi packaging, driver dispatch, and final delivery.'
    },
    {
      category: 'rentals',
      question: 'How do House Rentals work for diaspora returning to Kenya?',
      answer: 'Our House Rentals section lists verified serviced apartments, beach villas, and holiday homes across Nairobi, Mombasa, Diani, and Naivasha. You can filter by backup generators (ensuring no power outage interruptions), high-speed Wi-Fi, and private pools, and submit booking requests directly.'
    },
    {
      category: 'rentals',
      question: 'Can I list my own property in Kenya on the platform?',
      answer: 'Yes! Kenyan property owners and hosts can submit their serviced stays via the "List Your Property" button in the House Rentals page. Our local team conducts a verification inspection before featuring your listing.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = searchFilter.trim() === '' || 
      faq.question.toLowerCase().includes(searchFilter.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-neutral-50 min-h-screen py-10 md:py-16">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-dpc-blue font-bold text-xs uppercase tracking-wider mb-3">
            Knowledge Base & Answers
          </span>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-navy mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-text-muted text-base max-w-xl mx-auto">
            Everything you need to know about gifting your loved ones back home in Kenya, our PesaPal gateway, multi-currency options, and delivery coverage.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search questions (e.g. currency, PesaPal, delivery, tracking, rentals)..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-dpc-blue text-navy placeholder:text-gray-400 font-medium shadow-xs"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'payments', label: 'Payments & Currency' },
            { id: 'delivery', label: 'Delivery in Kenya' },
            { id: 'orders', label: 'Orders & Gifting' },
            { id: 'rentals', label: 'House Rentals' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat.id 
                  ? 'bg-dpc-blue text-white shadow-xs' 
                  : 'bg-white text-navy border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion FAQ list */}
        <div className="space-y-3 mb-12">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 text-center">
              <HelpCircle className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-navy font-bold">No matching questions found</p>
              <p className="text-xs text-text-muted mt-1">Try another search keyword or contact our support team.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs transition-colors"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-navy hover:text-dpc-blue transition-colors"
                  >
                    <span className="text-base">{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-dpc-blue' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-text-muted border-t border-neutral-100 leading-relaxed bg-neutral-50/50 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Help Banner */}
        <div className="bg-gradient-to-r from-navy to-dpc-blue text-white rounded-2xl p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div>
            <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
            <p className="text-sm text-blue-100 max-w-md">
              Our Nairobi concierge and diaspora customer care team are available around the clock.
            </p>
          </div>
          <Link to="/support" className="shrink-0">
            <Button variant="secondary" size="lg" className="bg-dpc-yellow text-navy hover:bg-yellow-400 font-bold border-none">
              Contact Support
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
