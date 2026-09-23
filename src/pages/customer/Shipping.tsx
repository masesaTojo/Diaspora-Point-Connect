import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Truck, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  PhoneCall, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { useShop } from '@/src/contexts/ShopContext';

export default function Shipping() {
  const { convertPrice, deliveryZones } = useShop();

  const standardZones = [
    { city: 'Nairobi Core (CBD, Westlands, Kilimani, Karen, Langata)', time: 'Same-day (Order before 2 PM EAT)', feeUSD: 10, note: 'Direct courier delivery to doorstep' },
    { city: 'Greater Nairobi & Kiambu (Runda, Ruiru, Thika, Kikuyu)', time: 'Same-day or next-day', feeUSD: 15, note: 'Express metropolitan dispatch' },
    { city: 'Mombasa & Coastal Towns (Nyali, Bamburi, Diani)', time: '24 - 48 Hours', feeUSD: 20, note: 'Air courier & secure ground dispatch' },
    { city: 'Nakuru, Naivasha & Rift Valley', time: '24 Hours', feeUSD: 18, note: 'Daily direct courier connection' },
    { city: 'Kisumu & Western Kenya (Kakamega, Bungoma)', time: '24 - 48 Hours', feeUSD: 22, note: 'Daily regional logistics hubs' },
    { city: 'Eldoret & North Rift Region', time: '24 - 48 Hours', feeUSD: 20, note: 'Vetted regional partner couriers' },
    { city: 'Upcountry & Remote Rural Kenya', time: '48 - 72 Hours', feeUSD: 25, note: 'Nearest postal town or local parcel center pickup' }
  ];

  return (
    <div className="bg-neutral-50 min-h-screen py-10 md:py-16">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-dpc-blue font-bold text-xs uppercase tracking-wider mb-3">
            Nationwide Logistics Across Kenya
          </span>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-navy mb-4">
            Shipping & Delivery Coverage
          </h1>
          <p className="text-text-muted text-base md:text-lg">
            Reliable, timely delivery to all 47 counties in Kenya. We bridge the distance so your loved ones receive gifts in pristine condition.
          </p>
        </div>

        {/* 3 Core Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-dpc-blue flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-navy text-lg mb-2">Same-Day Nairobi Dispatch</h3>
            <p className="text-sm text-text-muted">
              Orders placed before 2:00 PM East Africa Time (EAT) are packaged and delivered the very same day in Nairobi.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-navy text-lg mb-2">Discrete Recipient Coordination</h3>
            <p className="text-sm text-text-muted">
              Our dispatch team contacts your recipient to confirm their availability without giving away the surprise sender or item contents.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-navy text-lg mb-2">Perishable Freshness Guarantee</h3>
            <p className="text-sm text-text-muted">
              Cakes and fresh cut flowers are sourced on delivery day from premium Kenyan bakers and florist farms in insulated packaging.
            </p>
          </div>
        </div>

        {/* Delivery Zones Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden mb-12">
          <div className="p-6 md:p-8 border-b border-neutral-200 bg-neutral-50/50">
            <h2 className="text-2xl font-bold text-navy mb-1">Standard Delivery Fee Schedule</h2>
            <p className="text-sm text-text-muted">
              All delivery fees are converted automatically to your chosen currency.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100/75 border-b border-neutral-200 text-xs font-bold text-navy uppercase tracking-wider">
                  <th className="py-4 px-6">Delivery Destination / Region</th>
                  <th className="py-4 px-6">Estimated Transit Time</th>
                  <th className="py-4 px-6">Delivery Fee</th>
                  <th className="py-4 px-6">Handover Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-sm">
                {standardZones.map((z, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-navy flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-dpc-blue shrink-0" />
                      {z.city}
                    </td>
                    <td className="py-4 px-6 text-text-muted">{z.time}</td>
                    <td className="py-4 px-6 font-bold text-navy whitespace-nowrap">
                      {convertPrice(z.feeUSD)}
                    </td>
                    <td className="py-4 px-6 text-xs text-text-muted">{z.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recipient Verification Policy */}
        <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-6 md:p-8 mb-12">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-dpc-blue shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-navy text-lg mb-2">Customer ≠ Recipient Verification</h3>
              <p className="text-sm text-text-muted leading-relaxed mb-4">
                Because you are purchasing from overseas, you do not need to be in Kenya to sign for the delivery. When entering your order, ensure the recipient's local Kenyan phone number (Safaricom M-Pesa enabled preferred) is accurate. We send an SMS tracking link to you, while our local driver coordinates the exact gate or landmark with your recipient.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-navy">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-600" /> Photo Confirmation Upon Handover</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-600" /> Real-time SMS & Email alerts</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-text-muted text-sm mb-4">Ready to send a special package back home?</p>
          <div className="flex justify-center gap-4">
            <Link to="/shop">
              <Button size="lg">Browse Gift Catalog</Button>
            </Link>
            <Link to="/track">
              <Button variant="outline" size="lg">Track Existing Order</Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
