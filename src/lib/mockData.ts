import { Product, Category } from "@/src/types";

export const mockCategories: Category[] = [
  { id: "c1", name: "Gifts & Hampers", slug: "gifts", isActive: true },
  { id: "c2", name: "Flowers & Cakes", slug: "flowers", isActive: true },
  { id: "c3", name: "Shop for Home", slug: "home", isActive: true },
  { id: "c4", name: "Family Support", slug: "family-support", isActive: true },
  { id: "c5", name: "Made in Kenya", slug: "kenya", isActive: true },
  { id: "c6", name: "Electronics & Appliances", slug: "electronics", isActive: true },
  { id: "c7", name: "Eco & Sustainable", slug: "eco", isActive: true },
];

export const mockProducts: Partial<Product>[] = [
  {
    id: "p1",
    name: "Classic Red Roses Bouquet",
    slug: "classic-red-roses",
    description: "A beautiful arrangement of 24 premium red roses, grown in Kenya. Perfectly tied with a ribbon and presented in an elegant wrap.",
    price: 45.00,
    images: [
      "https://images.unsplash.com/photo-1591886960571-74d43a9d4166?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=600&q=80"
    ],
    primaryCategoryId: "flowers",
    isFeatured: true,
    isBestseller: true,
    isNewArrival: false,
    recipients: ["Partner", "Mum"],
    occasions: ["Valentine's Day", "Anniversary", "Birthday"],
    collections: ["Bestsellers"],
    rating: 4.8,
    reviewCount: 124,
    availability: "IN_STOCK",
    deliveryZones: ["Nairobi", "Mombasa", "Nakuru", "Kisumu"],
    whatsIncluded: ["24 Red Roses", "Decorative Ribbon", "Gift Card"],
  },
  {
    id: "p2",
    name: "Family Month Groceries",
    slug: "family-month-groceries",
    description: "Essential monthly groceries including Unga, Rice, Cooking Oil, and Sugar. Take the pressure off your family back home.",
    price: 85.00,
    images: ["https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"],
    primaryCategoryId: "family-support",
    isFeatured: true,
    isBestseller: true,
    isNewArrival: false,
    recipients: ["Family", "Mum", "Dad"],
    occasions: [],
    collections: ["Care Packages"],
    rating: 4.9,
    reviewCount: 342,
    availability: "IN_STOCK",
    deliveryZones: ["Nationwide"],
    whatsIncluded: ["4x 2kg Maize Flour", "5kg Rice", "3L Cooking Oil", "4kg Sugar", "2kg Beans"],
  },
  {
    id: "p3",
    name: "Premium Black Forest Cake (2kg)",
    slug: "black-forest-cake-2kg",
    description: "Freshly baked classic black forest cake, layered with cream and cherries, perfect for celebrations.",
    price: 35.00,
    images: ["https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80"],
    primaryCategoryId: "flowers",
    subcategoryId: "cakes",
    isFeatured: true,
    isBestseller: false,
    isNewArrival: false,
    recipients: ["Family", "Friend", "Child", "Kids"],
    occasions: ["Birthday", "Graduation"],
    collections: [],
    rating: 4.7,
    reviewCount: 89,
    availability: "IN_STOCK",
    deliveryZones: ["Nairobi"],
    whatsIncluded: ["2kg Black Forest Cake", "Cake Box", "Candles (Optional)"],
  },
  {
    id: "p4",
    name: "Maasai Beaded Leather Tote",
    slug: "maasai-beaded-tote",
    description: "Handcrafted genuine leather tote with intricate Maasai beadwork. A beautiful and practical gift made by local artisans.",
    price: 65.00,
    images: ["https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80"],
    primaryCategoryId: "kenya",
    isFeatured: true,
    isBestseller: true,
    isNewArrival: false,
    recipients: ["Her", "Mum", "Friend", "Partner"],
    occasions: ["Birthday", "Mother's Day"],
    collections: ["Eco Friendly"],
    rating: 5.0,
    reviewCount: 45,
    availability: "IN_STOCK",
    deliveryZones: ["Nationwide"],
    whatsIncluded: ["1x Leather Tote Bag", "Dust Bag"],
  },
  {
    id: "p5",
    name: "Student Support Pack",
    slug: "student-support-pack",
    description: "Stationery, backpack, and term essentials for school-going children. Ensure they have everything they need for the new term.",
    price: 50.00,
    images: ["https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80"],
    primaryCategoryId: "family-support",
    isFeatured: false,
    isBestseller: true,
    isNewArrival: false,
    recipients: ["Child", "Family", "Kids"],
    occasions: ["Graduation"],
    collections: ["Care Packages"],
    rating: 4.6,
    reviewCount: 112,
    availability: "IN_STOCK",
    deliveryZones: ["Nationwide"],
    whatsIncluded: ["Backpack", "10x Exercise Books", "Math Set", "Pens & Pencils", "Water Bottle"],
  },
  {
    id: "p6",
    name: "Luxury Spa Hamper",
    slug: "luxury-spa-hamper",
    description: "Relaxing Kenyan-made natural soaps, oils, and bath salts. Treat them to a day of pampering.",
    price: 95.00,
    images: ["https://images.unsplash.com/photo-1583416750470-965b2707b355?auto=format&fit=crop&w=600&q=80"],
    primaryCategoryId: "gifts",
    isFeatured: false,
    isBestseller: false,
    isNewArrival: true,
    recipients: ["Her", "Mum", "Partner"],
    occasions: ["Mother's Day", "Birthday", "Anniversary"],
    collections: ["New Arrivals"],
    rating: 4.9,
    reviewCount: 23,
    availability: "IN_STOCK",
    deliveryZones: ["Nairobi", "Mombasa"],
    whatsIncluded: ["2x Artisan Soaps", "Body Oil", "Bath Salts", "Loofah", "Woven Basket"],
  },
  {
    id: "p7",
    name: "Samsung 32-inch Smart TV",
    slug: "samsung-32-smart-tv",
    description: "Upgrade their living room with this HD Smart TV. Stream movies, sports, and shows easily.",
    price: 250.00,
    images: ["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80"],
    primaryCategoryId: "electronics",
    isFeatured: true,
    isBestseller: false,
    isNewArrival: true,
    recipients: ["Family", "Dad", "Partner"],
    occasions: ["Anniversary", "Birthday"],
    collections: ["New Arrivals"],
    rating: 4.8,
    reviewCount: 15,
    availability: "IN_STOCK",
    deliveryZones: ["Nairobi"],
    whatsIncluded: ["32-inch Smart TV", "Remote Control", "Power Cable", "User Manual"],
  },
  {
    id: "p8",
    name: "Kenyan Coffee & Tea Gift Box",
    slug: "coffee-tea-gift-box",
    description: "Premium selection of AA Kenyan Coffee and pure Kericho tea leaves. The perfect morning brew.",
    price: 40.00,
    images: ["https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=600&q=80"],
    primaryCategoryId: "gifts",
    isFeatured: false,
    isBestseller: true,
    isNewArrival: false,
    recipients: ["Dad", "Mum", "Friend", "Corporate"],
    occasions: ["Birthday", "Condolence"],
    collections: ["Corporate Gifts"],
    rating: 4.7,
    reviewCount: 88,
    availability: "IN_STOCK",
    deliveryZones: ["Nationwide"],
    whatsIncluded: ["500g AA Coffee Beans", "250g Loose Leaf Tea", "2x Ceramic Mugs", "Gift Box"],
  },
];

export const mockRecipients = [
  { name: "Mum", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80" },
  { name: "Dad", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80" },
  { name: "Partner", image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=300&q=80" },
  { name: "Family", image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=300&q=80" },
  { name: "Kids", image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=300&q=80" },
  { name: "Friends", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=300&q=80" },
];

export const mockOccasions = [
  { name: "Birthday", icon: "🎂", color: "bg-pink-100" },
  { name: "Anniversary", icon: "🥂", color: "bg-red-100" },
  { name: "Mother's Day", icon: "🌸", color: "bg-purple-100" },
  { name: "Graduation", icon: "🎓", color: "bg-blue-100" },
  { name: "New Baby", icon: "🍼", color: "bg-yellow-100" },
  { name: "Condolence", icon: "🕊️", color: "bg-gray-100" },
];

export const mockCollections = [
  { name: "New Arrivals", slug: "new-arrivals", image: "https://images.unsplash.com/photo-1574634534894-89d7576c8259?auto=format&fit=crop&w=600&q=80" },
  { name: "Corporate Gifts", slug: "corporate-gifts", image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80" },
  { name: "Eco Friendly", slug: "eco-friendly", image: "https://images.unsplash.com/photo-1610427301072-a42e58e0a30b?auto=format&fit=crop&w=600&q=80" },
  { name: "Care Packages", slug: "care-packages", image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80" },
];

export const mockDeliveryZones = [
  { id: "dz1", name: "Nairobi", fee: 10.0, estimatedTime: "Same Day", sameDayAvailable: true, scheduledAvailable: true, minimumOrder: 20 },
  { id: "dz2", name: "Mombasa", fee: 15.0, estimatedTime: "1-2 Business Days", sameDayAvailable: false, scheduledAvailable: true, minimumOrder: 30 },
  { id: "dz3", name: "Kisumu", fee: 15.0, estimatedTime: "1-2 Business Days", sameDayAvailable: false, scheduledAvailable: true, minimumOrder: 30 },
  { id: "dz4", name: "Nakuru", fee: 12.0, estimatedTime: "Next Day", sameDayAvailable: false, scheduledAvailable: true, minimumOrder: 25 },
  { id: "dz5", name: "Eldoret", fee: 12.0, estimatedTime: "Next Day", sameDayAvailable: false, scheduledAvailable: true, minimumOrder: 25 },
];

export const mockSuppliers = [
  { id: "sup1", name: "Kenya Blooms Ltd", contactEmail: "orders@kenyablooms.com", contactPhone: "+254700000001", location: "Naivasha, Kenya", suppliedProductIds: ["p1"], leadTimeDays: 1, paymentTerms: "Net 30", status: "ACTIVE" },
  { id: "sup2", name: "Tuskys Wholesalers", contactEmail: "b2b@tuskys.co.ke", contactPhone: "+254700000002", location: "Nairobi, Kenya", suppliedProductIds: ["p2", "p5"], leadTimeDays: 2, paymentTerms: "Net 15", status: "ACTIVE" },
  { id: "sup3", name: "Nairobi Bakeries", contactEmail: "orders@nairobibakeries.com", contactPhone: "+254700000003", location: "Nairobi, Kenya", suppliedProductIds: ["p3"], leadTimeDays: 1, paymentTerms: "Due on Receipt", status: "ACTIVE" },
];

export const mockInventoryRecords = [
  { productId: "p1", stock: 150, reserved: 20, damaged: 2, sold: 120, incoming: 50, lowStockThreshold: 30 },
  { productId: "p2", stock: 500, reserved: 50, damaged: 5, sold: 1000, incoming: 200, lowStockThreshold: 100 },
  { productId: "p3", stock: 15, reserved: 5, damaged: 0, sold: 40, incoming: 0, lowStockThreshold: 10 },
  { productId: "p4", stock: 50, reserved: 2, damaged: 1, sold: 30, incoming: 20, lowStockThreshold: 15 },
];

export const mockDrivers = [
  { id: "drv1", name: "John Kamau", phone: "+254711111111", status: "AVAILABLE", currentZoneId: "dz1" },
  { id: "drv2", name: "Peter Omondi", phone: "+254722222222", status: "ON_DELIVERY", currentZoneId: "dz1" },
  { id: "drv3", name: "Alice Wanjiku", phone: "+254733333333", status: "OFF_DUTY", currentZoneId: "dz2" },
];

export const mockPromotions: any[] = [
  {
    id: "promo1",
    name: "Summer Sale 20% Off",
    type: "PERCENTAGE",
    discountValue: 20,
    conditions: { minSpend: 50 },
    isActive: true,
  },
  {
    id: "promo2",
    name: "Free Delivery Over $100",
    type: "FIXED",
    discountValue: 15, // assuming $15 fixed discount applied as free delivery
    conditions: { minSpend: 100 },
    isActive: true,
  }
];

export const mockCoupons: any[] = [
  {
    id: "coup1",
    code: "WELCOME10",
    discountValue: 10,
    isPercentage: true,
    minSpend: 0,
    usageLimit: 1000,
    usedCount: 234,
    isActive: true,
  },
  {
    id: "coup2",
    code: "SAVE20",
    discountValue: 20,
    isPercentage: false,
    minSpend: 100,
    usageLimit: 100,
    usedCount: 15,
    isActive: true,
  }
];

export const mockCampaigns: any[] = [
  {
    id: "camp1",
    name: "Mother's Day Special",
    description: "Show your love with our curated Mother's Day gifts.",
    heroImage: "https://images.unsplash.com/photo-1543888352-78d128df661e?auto=format&fit=crop&w=800&q=80",
    productIds: ["p1", "p3", "p5"],
    isActive: true,
  }
];

export const mockCmsSections: any[] = [
  { id: "cms1", type: "HERO", title: "Hero Section", isVisible: true, order: 1 },
  { id: "cms2", type: "QUICK_SHOP", title: "Quick Shop", isVisible: true, order: 2 },
  { id: "cms3", type: "RECIPIENTS", title: "Shop by Recipient", isVisible: true, order: 3 },
  { id: "cms4", type: "OCCASIONS", title: "Shop by Occasion", isVisible: true, order: 4 },
  { id: "cms5", type: "BUDGET", title: "Shop by Budget", isVisible: true, order: 5 },
  { id: "cms6", type: "BESTSELLERS", title: "Bestsellers", isVisible: true, order: 6 },
  { id: "cms7", type: "GIFT_BUILDER", title: "Gift Builder", isVisible: true, order: 7 },
  { id: "cms8", type: "FAMILY_SUPPORT", title: "Family Support", isVisible: false, order: 8 },
  { id: "cms9", type: "MADE_IN_KENYA", title: "Made in Kenya", isVisible: false, order: 9 },
  { id: "cms10", type: "FLOWERS_AND_CAKES", title: "Flowers & Cakes", isVisible: true, order: 10 },
  { id: "cms11", type: "TESTIMONIALS", title: "Testimonials", isVisible: true, order: 11 },
  { id: "cms12", type: "TRUST", title: "Trust Badges", isVisible: true, order: 12 },
];

export const mockGiftBuilderConfig: any = {
  eligibleProductIds: ["p1", "p2", "p3", "p4", "p5", "p6"],
  components: ["Main Gift", "Flowers", "Cake", "Card", "Extras"],
  minItems: 2,
  maxItems: 5,
  bundleDiscountPercentage: 10,
  isActive: true,
};
