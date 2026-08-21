import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';
import { ArrowRight, Package, Heart, Globe, CreditCard } from 'lucide-react';
import { ProductCard } from '@/src/components/ui/ProductCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { mockProducts, mockRecipients, mockOccasions, mockCollections } from '@/src/lib/mockData';

export default function Home() {
  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      {/* 1. Hero Section */}
      <section className="relative bg-navy-dark text-white min-h-[600px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=2000&q=80" 
            alt="Happy Kenyan Family" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-dark via-navy-dark/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              Send Love <span className="text-dpc-yellow">Home.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-10 leading-relaxed">
              Thoughtful gifts, essential groceries, and Kenyan products delivered directly to the people you love.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/shop/category/gifts">
                <Button size="lg" variant="secondary" className="text-lg font-bold">
                  SHOP GIFTS
                </Button>
              </Link>
              <Link to="/shop/category/family-support">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 hover:text-white text-lg">
                  SUPPORT HOME
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Shop Categories */}
      <section className="py-12 bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { name: "Send a Gift", icon: "🎁", color: "bg-pink-50", link: "/shop/category/gifts" },
              { name: "Flowers & Cakes", icon: "💐", color: "bg-purple-50", link: "/shop/category/flowers" },
              { name: "Support Home", icon: "🛒", color: "bg-blue-50", link: "/shop/category/family-support" },
              { name: "Made in Kenya", icon: "🌍", color: "bg-yellow-50", link: "/shop/category/kenya" },
            ].map((cat, i) => (
              <Link to={cat.link} key={i} className={`flex flex-col items-center justify-center p-6 rounded-2xl cursor-pointer hover:-translate-y-1 transition-transform ${cat.color}`}>
                <span className="text-4xl mb-3">{cat.icon}</span>
                <span className="font-semibold text-navy text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Shop By Recipient */}
      <section className="py-20 bg-neutral-bg">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeading 
            title="Who are you shopping for?" 
            subtitle="Find the perfect items tailored for your loved ones."
            align="center"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {mockRecipients.map((rec, i) => (
              <Link to={`/shop?recipient=${encodeURIComponent(rec.name)}`} key={i} className="group cursor-pointer flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-white shadow-md group-hover:border-dpc-yellow transition-colors">
                  <img src={rec.image} alt={rec.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="font-semibold text-navy text-lg group-hover:text-dpc-blue transition-colors">{rec.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Bestsellers */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <SectionHeading title="Bestsellers" className="mb-0" />
            <Link to="/shop/collection/bestsellers">
              <Button variant="ghost" className="hidden sm:flex group">
                View All <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {mockProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 4.5 Collections */}
      <section className="py-20 bg-neutral-bg">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeading 
            title="Featured Collections" 
            subtitle="Curated picks to make gifting easy."
            align="center"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockCollections.map((collection, i) => (
              <Link to={`/shop/collection/${collection.slug}`} key={i} className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-shadow aspect-[4/5] block">
                <img 
                  src={collection.image} 
                  alt={collection.name} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/90 via-navy-dark/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 w-full flex items-end justify-between">
                  <h3 className="font-display text-white text-2xl font-bold">{collection.name}</h3>
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white group-hover:bg-dpc-yellow group-hover:text-navy transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Build a Gift Promo */}
      <section className="py-20 bg-dpc-blue text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-dpc-yellow font-bold tracking-wider uppercase text-sm mb-4 block">Personalized Experience</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 leading-tight">Build the Perfect Custom Hamper</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-lg">
                Select a beautiful basket, add their favorite treats, and include a personalized video message. We'll beautifully wrap and deliver it.
              </p>
              <Link to="/shop/collection/build-a-gift">
                <Button variant="secondary" size="lg" className="font-bold text-lg">
                  Start Building
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <img src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80" alt="Gift Hamper" className="object-cover w-full h-full" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-dpc-blue-light/30 rounded-full blur-3xl z-0"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Shop by Occasion & Budget */}
      <section className="py-20 bg-neutral-bg">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Occasions */}
          <div>
            <SectionHeading title="Shop by Occasion" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {mockOccasions.map((occ, i) => (
                <Link to={`/shop?occasion=${encodeURIComponent(occ.name)}`} key={i} className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex items-center space-x-4 cursor-pointer hover:border-dpc-blue hover:shadow-md transition-all">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${occ.color}`}>
                    {occ.icon}
                  </div>
                  <span className="font-semibold text-navy">{occ.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Budgets */}
          <div>
            <SectionHeading title="Shop by Budget" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Gifts under $25", min: 0, max: 25 },
                { label: "Gifts $25 - $50", min: 25, max: 50 },
                { label: "Gifts $50 - $100", min: 50, max: 100 },
                { label: "Premium Gifts $100+", min: 100, max: 9999 }
              ].map((budget, i) => (
                <Link to={`/shop?minPrice=${budget.min}&maxPrice=${budget.max}`} key={i} className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 flex justify-between items-center cursor-pointer hover:border-dpc-blue hover:shadow-md transition-all group block">
                  <span className="font-semibold text-navy text-lg">{budget.label}</span>
                  <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center group-hover:bg-dpc-blue group-hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 7. Specific Categories Highlight */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 space-y-24">
          
          {/* Family Support */}
          <div>
            <div className="flex justify-between items-end mb-10">
              <SectionHeading 
                title="Family Support & Essentials" 
                subtitle="High-quality groceries, stationery, and household necessities delivered to their door."
                className="mb-0" 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {mockProducts.filter(p => p.primaryCategoryId === 'family-support').map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>

          {/* Made In Kenya */}
          <div>
            <div className="flex justify-between items-end mb-10">
              <SectionHeading 
                title="Authentic Made In Kenya" 
                subtitle="Support local artisans and businesses with our curated selection of Kenyan products."
                className="mb-0" 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {mockProducts.filter(p => p.primaryCategoryId === 'kenya').map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {/* Fallbacks if not enough mock data */}
              {mockProducts.slice(0, 3).map((product) => (
                 <ProductCard key={`fallback-${product.id}`} product={product} />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 8. How It Works */}
      <section className="py-20 bg-navy text-white text-center">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeading title="How Diaspora Point Connect Works" align="center" className="text-white [&>h2]:text-white [&>p]:text-gray-300" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-dpc-blue rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-dpc-blue/20">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4 text-dpc-yellow">1. Choose & Personalize</h3>
              <p className="text-gray-300">Select the perfect gift or essentials package. Add a personalized card or video message.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-dpc-blue rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-dpc-blue/20">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4 text-dpc-yellow">2. Secure Checkout</h3>
              <p className="text-gray-300">Pay securely in your local currency. We handle the exchange rates transparently.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-dpc-blue rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-dpc-blue/20">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4 text-dpc-yellow">3. We Deliver Smiles</h3>
              <p className="text-gray-300">Our local team carefully prepares and delivers your order across Kenya, right on time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Trust & Testimonials */}
      <section className="py-24 bg-neutral-bg">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeading 
            title="Trusted by the Diaspora" 
            subtitle="Don't just take our word for it. Here is what our customers have to say."
            align="center"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              { text: "DPC made my mother's birthday so special. The flowers were fresh and the cake was exactly what I ordered. Delivery to Nakuru was flawless.", author: "Jane W.", location: "London, UK" },
              { text: "I use their monthly family support package to ensure my parents have their groceries sorted. It takes away all the stress of sending money.", author: "David K.", location: "Dallas, TX" },
              { text: "The quality of the Kenyan-made products is phenomenal. I bought a Maasai blanket and it arrived beautifully packaged.", author: "Sarah M.", location: "Sydney, AU" },
            ].map((review, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 relative">
                <div className="text-dpc-yellow mb-4 flex space-x-1">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                <p className="text-navy text-lg italic mb-6">"{review.text}"</p>
                <div>
                  <p className="font-bold text-navy">{review.author}</p>
                  <p className="text-text-muted text-sm">{review.location}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 pt-10 border-t border-neutral-200 flex flex-wrap justify-center gap-8 md:gap-16 opacity-60">
             <div className="flex items-center space-x-2 text-navy font-bold text-xl"><CreditCard /> <span>Secure Payments</span></div>
             <div className="flex items-center space-x-2 text-navy font-bold text-xl"><Globe /> <span>Worldwide Ordering</span></div>
             <div className="flex items-center space-x-2 text-navy font-bold text-xl"><Package /> <span>Nationwide Delivery</span></div>
          </div>
        </div>
      </section>

    </div>
  );
}
