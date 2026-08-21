export type Role =
  | "SUPER_ADMIN"
  | "STORE_MANAGER"
  | "ORDER_MANAGER"
  | "INVENTORY_MANAGER"
  | "FINANCE_MANAGER"
  | "CONTENT_MANAGER"
  | "DELIVERY_MANAGER"
  | "SUPPORT_AGENT"
  | "CUSTOMER";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  county: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
}

export interface Recipient {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  defaultAddressId?: string;
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  phone?: string;
  defaultBillingAddressId?: string;
  recipients: string[]; // Recipient IDs
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  primaryCategoryId: string;
  subcategoryId?: string;
  price: number;
  salePrice?: number;
  inventory: number;
  recipients: string[]; // Tags like "Mum", "Partner"
  occasions: string[]; // Tags like "Birthday"
  collections: string[];
  tags: string[];
  deliveryZones: string[];
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  images: string[];
  rating?: number;
  reviewCount?: number;
  whatsIncluded?: string[];
  availability?: "IN_STOCK" | "OUT_OF_STOCK" | "PREORDER";
  createdAt: string;
  updatedAt: string;
}

export interface InventoryRecord {
  productId: string;
  stock: number;
  reserved: number;
  damaged: number;
  sold: number;
  incoming: number;
  lowStockThreshold: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
  suppliedProductIds: string[];
  leadTimeDays: number;
  paymentTerms: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  estimatedTime: string;
  sameDayAvailable: boolean;
  scheduledAvailable: boolean;
  minimumOrder: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: "AVAILABLE" | "ON_DELIVERY" | "OFF_DUTY";
  currentZoneId?: string;
}

export type OrderStatus = 
  | "NEW"
  | "PAYMENT_PENDING"
  | "PAYMENT_CONFIRMED"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY_FOR_DELIVERY"
  | "DISPATCHED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  // Exception statuses
  | "PAYMENT_FAILED"
  | "STOCK_ISSUE"
  | "ADDRESS_ISSUE"
  | "DELIVERY_FAILED"
  | "RECIPIENT_UNAVAILABLE"
  | "CANCELLED"
  | "REFUNDED";

export interface Promotion {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED" | "PRODUCT" | "CATEGORY" | "BUNDLE" | "OCCASION";
  discountValue: number;
  conditions: {
    minSpend?: number;
    startDate?: string;
    endDate?: string;
    productIds?: string[];
    categoryIds?: string[];
    customerGroups?: string[];
    minQuantity?: number;
  };
  isActive: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountValue: number;
  isPercentage: boolean;
  minSpend?: number;
  usageLimit?: number;
  usedCount: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  heroImage: string;
  productIds: string[];
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface CmsSection {
  id: string;
  type: "HERO" | "QUICK_SHOP" | "RECIPIENTS" | "OCCASIONS" | "BUDGET" | "BESTSELLERS" | "GIFT_BUILDER" | "FAMILY_SUPPORT" | "MADE_IN_KENYA" | "FLOWERS_AND_CAKES" | "TESTIMONIALS" | "TRUST" | "BANNER";
  title?: string;
  isVisible: boolean;
  order: number;
  scheduledStart?: string;
  scheduledEnd?: string;
  data?: any;
}

export interface GiftBuilderConfig {
  eligibleProductIds: string[];
  components: string[]; // e.g. "Main Gift", "Flowers", "Cake", "Card", "Extras"
  minItems: number;
  maxItems: number;
  bundleDiscountPercentage?: number;
  isActive: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  recipient?: string;
  giftMessage?: string;
  includeGreetingCard?: boolean;
}

export interface Order {
  id: string;
  customerId?: string; // Optional for guest checkout in mock
  customerEmail?: string;
  customerName?: string;
  
  recipientName?: string;
  recipientPhone?: string;
  
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryDate?: string;
  
  items: OrderItem[];
  
  status: OrderStatus;
  
  // Fulfillment & Logistics
  driverId?: string;
  deliveryNotes?: string;
  expectedDeliveryTime?: string;
  proofOfDelivery?: string; // Image URL or signature
  
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  
  createdAt: string;
  updatedAt: string;
}
