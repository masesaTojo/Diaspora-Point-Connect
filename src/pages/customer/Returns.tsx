import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  RotateCcw, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Phone, 
  Mail,
  HeartHandshake
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function Returns() {
  return (
    <div className="bg-neutral-50 min-h-screen py-10 md:py-16">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-3">
            Peace of Mind Guarantee
          </span>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-navy mb-4">
            Returns & Refund Policy
          </h1>
          <p className="text-text-muted text-base md:text-lg">
            We are dedicated to ensuring your gift sends love, warmth, and joy. If anything arrives damaged or not as described, we make it right immediately.
          </p>
        </div>

        {/* 100% Freshness Guarantee Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-navy mb-2">Our Diaspora Satisfaction Promise</h2>
              <p className="text-sm text-text-muted leading-relaxed">
                When you order from thousands of miles away, trust is everything. If fresh flowers wilt prematurely, a bakery item is compromised in transit, or an item does not match your order specifications, we will either replace it free of charge within 24 hours or issue a full refund to your original payment method.
              </p>
            </div>
          </div>
        </div>

        {/* Categorized Policy Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
            <h3 className="font-bold text-navy text-lg mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-pink-500"></span>
              Flowers & Bakery (Perishables)
            </h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Notice must be provided within 24 hours of delivery.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Photo of the damaged or wilted item required from recipient.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Same-day or next-day fresh replacement dispatched.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
            <h3 className="font-bold text-navy text-lg mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Gift Hampers, Groceries & Wine
            </h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Notice within 48 hours if sealed packaging was compromised.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Replacement of individual affected items or full basket.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Items must remain unconsumed for courier inspection.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
            <h3 className="font-bold text-navy text-lg mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              Electronics & Appliances
            </h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>7-day direct replacement window for manufacturing defects.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>1-year to 2-year official manufacturer warranty in Kenya.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Free courier pickup from your recipient's residence.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
            <h3 className="font-bold text-navy text-lg mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              Order Cancellations
            </h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Full refund if cancelled before dispatch/preparation begins.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Custom gift boxes with personalized card can be adjusted before 10 AM EAT.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>100% refund credited back through PesaPal or original payment card.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Refund Processing Timeline */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm mb-12">
          <h3 className="text-xl font-bold text-navy mb-4">Refund Reimbursement Timelines</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-text-muted">
            <div className="p-4 bg-neutral-50 rounded-xl">
              <span className="font-bold text-navy block mb-1">PesaPal Credit / Debit Card Refunds</span>
              <p>Reversed to your card issuing bank within 3 to 7 business days, depending on your bank's international processing policies.</p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl">
              <span className="font-bold text-navy block mb-1">M-Pesa / Mobile Money Refunds</span>
              <p>Reversed directly to the sender's M-Pesa phone number within 24 hours of approval.</p>
            </div>
          </div>
        </div>

        {/* Support Contact */}
        <div className="bg-navy text-white rounded-2xl p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div>
            <h3 className="text-xl font-bold mb-2">Need to request a replacement or return?</h3>
            <p className="text-sm text-gray-300 max-w-md">
              Have your Order ID ready and contact our 24/7 customer care concierge team.
            </p>
          </div>
          <Link to="/support" className="shrink-0">
            <Button variant="secondary" size="lg" className="bg-dpc-yellow text-navy hover:bg-yellow-400 font-bold border-none">
              Open Support Request
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
