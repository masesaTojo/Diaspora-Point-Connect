import { Order, Product, InventoryRecord, DeliveryZone, Driver, Coupon, Promotion, CmsSection, GiftBuilderConfig, Supplier, Category } from '../types';
import { 
  mockProducts, 
  mockInventoryRecords, 
  mockDeliveryZones, 
  mockDrivers, 
  mockCoupons, 
  mockPromotions, 
  mockCmsSections, 
  mockGiftBuilderConfig,
  mockSuppliers,
  mockCategories
} from './mockData';

export const STORAGE_UPDATE_EVENT = 'dpc-storage-update';

export function emitStorageUpdate(key: string) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(STORAGE_UPDATE_EVENT, { detail: { key } }));
    } catch (e) {
      console.error('Failed to emit storage update', e);
    }
  }
}

export function subscribeToStorage(keys: string[], callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  
  const handleCustom = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (!detail || !detail.key || keys.includes(detail.key)) {
      callback();
    }
  };
  const handleStorage = (e: StorageEvent) => {
    if (!e.key || keys.includes(e.key)) {
      callback();
    }
  };
  window.addEventListener(STORAGE_UPDATE_EVENT, handleCustom);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(STORAGE_UPDATE_EVENT, handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}

// Initial realistic Diaspora Orders for Kenya deliveries
export const initialMockOrders: Order[] = [
  {
    id: "DPC-849201",
    customerId: "c1",
    customerName: "David Ochieng",
    customerEmail: "david.ochieng@gmail.com",
    customerPhone: "+44 7700 900123", // London, UK
    paymentStatus: "PAID",
    recipientName: "Grace Anyango (Mum)",
    recipientPhone: "+254 712 345 678",
    deliveryAddress: "House 14, Riverside Drive, Westlands",
    deliveryCity: "Nairobi",
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    deliveryNotes: "Please call mum before arrival. Gate code is 4492.",
    status: "READY_FOR_DELIVERY",
    items: [
      {
        id: "item-1",
        productId: "p1",
        productName: "Kenyan Safari Tea & Coffee Luxury Hamper",
        quantity: 1,
        unitPrice: 65.00,
        totalPrice: 65.00,
        recipient: "Grace Anyango (Mum)",
        giftMessage: "Happy Birthday Mum! Wishing you health and blessings from London. Love, David.",
        includeGreetingCard: true
      },
      {
        id: "item-2",
        productId: "p2",
        productName: "Highland Red Rose Elegance Bouquet",
        quantity: 1,
        unitPrice: 42.00,
        totalPrice: 42.00,
        recipient: "Grace Anyango (Mum)",
        giftMessage: "Fresh red roses for you!",
        includeGreetingCard: false
      }
    ],
    subtotal: 107.00,
    deliveryFee: 15.00,
    serviceFee: 3.50,
    discount: 0,
    total: 125.50,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "DPC-739104",
    customerId: "c2",
    customerName: "Sarah Wanjiku",
    customerEmail: "sarah.wanjiku@yahoo.com",
    customerPhone: "+1 214 555 0192", // Dallas, TX
    paymentStatus: "PAID",
    recipientName: "Peter Mwangi (Brother)",
    recipientPhone: "+254 722 987 654",
    deliveryAddress: "Apartment 4B, Nyali Beach Road",
    deliveryCity: "Mombasa",
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryNotes: "Ring doorbell at entrance.",
    status: "PROCESSING",
    items: [
      {
        id: "item-3",
        productId: "p4",
        productName: "Artisanal Maasai Beaded Keepsake Box",
        quantity: 1,
        unitPrice: 48.00,
        totalPrice: 48.00,
        recipient: "Peter Mwangi",
        giftMessage: "Congratulations on the new home bro! From Sarah in Texas.",
        includeGreetingCard: true
      }
    ],
    subtotal: 48.00,
    deliveryFee: 20.00,
    serviceFee: 2.50,
    discount: 0,
    total: 70.50,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: "DPC-629481",
    customerId: "c3",
    customerName: "Kevin Kiprono",
    customerEmail: "kevin.kip@techcorp.io",
    customerPhone: "+1 416 555 8321", // Toronto, Canada
    paymentStatus: "PAID",
    recipientName: "Mercy Chebet (Sister)",
    recipientPhone: "+254 733 112 233",
    deliveryAddress: "Plot 22, Milimani Estate",
    deliveryCity: "Nakuru",
    deliveryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    status: "DELIVERED",
    driverId: "drv2",
    proofOfDelivery: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=400",
    items: [
      {
        id: "item-4",
        productId: "p5",
        productName: "Organic Macadamia & Savanna Honey Collection",
        quantity: 2,
        unitPrice: 38.00,
        totalPrice: 76.00,
        recipient: "Mercy Chebet",
        giftMessage: "Proud of your graduation! Enjoy the honey treats.",
        includeGreetingCard: true
      }
    ],
    subtotal: 76.00,
    deliveryFee: 18.00,
    serviceFee: 3.00,
    discount: 5.00,
    total: 92.00,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "DPC-518293",
    customerId: "c4",
    customerName: "Brenda Muthoni",
    customerEmail: "bmuthoni@health.gov.au",
    customerPhone: "+61 412 345 678", // Sydney, Australia
    paymentStatus: "PAID",
    recipientName: "James Kariuki (Dad)",
    recipientPhone: "+254 720 554 433",
    deliveryAddress: "Kariuki Farm, Old Kijabe Road",
    deliveryCity: "Naivasha",
    deliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    status: "CONFIRMED",
    items: [
      {
        id: "item-5",
        productId: "p3",
        productName: "Velvet Decadence Belgian Chocolate Cake (1kg)",
        quantity: 1,
        unitPrice: 45.00,
        totalPrice: 45.00,
        recipient: "James Kariuki",
        giftMessage: "Happy 60th Birthday Dad! Miss you tons from Sydney.",
        includeGreetingCard: true
      },
      {
        id: "item-6",
        productId: "p1",
        productName: "Kenyan Safari Tea & Coffee Luxury Hamper",
        quantity: 1,
        unitPrice: 65.00,
        totalPrice: 65.00,
        recipient: "James Kariuki",
        includeGreetingCard: false
      }
    ],
    subtotal: 110.00,
    deliveryFee: 22.00,
    serviceFee: 4.00,
    discount: 10.00,
    total: 126.00,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: "DPC-409182",
    customerId: "c1",
    customerName: "David Ochieng",
    customerEmail: "david.ochieng@gmail.com",
    customerPhone: "+44 7700 900123",
    paymentStatus: "PAID",
    recipientName: "Faith Akinyi (Niece)",
    recipientPhone: "+254 711 889 900",
    deliveryAddress: "Tom Mboya Street, Mega City Mall area",
    deliveryCity: "Kisumu",
    status: "DISPATCHED",
    driverId: "drv3",
    items: [
      {
        id: "item-7",
        productId: "p6",
        productName: "Handwoven Sisal & Leather Everyday Kiondo Basket",
        quantity: 1,
        unitPrice: 52.00,
        totalPrice: 52.00,
        recipient: "Faith Akinyi"
      }
    ],
    subtotal: 52.00,
    deliveryFee: 18.00,
    serviceFee: 2.00,
    discount: 0,
    total: 72.00,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString()
  }
];

// Helper functions for durable client persistence
export function getStoredOrders(): Order[] {
  try {
    const data = localStorage.getItem('dpc_orders');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading dpc_orders from storage', e);
  }
  // Auto-seed with initial orders if none exist
  saveStoredOrders(initialMockOrders);
  return initialMockOrders;
}

export function saveStoredOrders(orders: Order[]): void {
  try {
    localStorage.setItem('dpc_orders', JSON.stringify(orders));
    emitStorageUpdate('dpc_orders');
  } catch (e) {
    console.error('Error saving dpc_orders to storage', e);
  }
}

export function getStoredProducts(): Product[] {
  try {
    const data = localStorage.getItem('dpc_catalog_products');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge any newly introduced mock products (e.g. fresh groceries)
        let modified = false;
        (mockProducts as Product[]).forEach(mp => {
          if (!parsed.some(p => p.id === mp.id)) {
            parsed.push(mp);
            modified = true;
          }
        });
        if (modified) {
          saveStoredProducts(parsed);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading dpc_catalog_products', e);
  }
  saveStoredProducts(mockProducts as Product[]);
  return mockProducts as Product[];
}

export function saveStoredProducts(products: Product[]): void {
  try {
    localStorage.setItem('dpc_catalog_products', JSON.stringify(products));
    emitStorageUpdate('dpc_catalog_products');
  } catch (e) {
    console.error('Error saving dpc_catalog_products', e);
  }
}

export function getStoredCategories(): Category[] {
  try {
    const data = localStorage.getItem('dpc_categories');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let modified = false;
        mockCategories.forEach(mc => {
          if (!parsed.some((c: Category) => c.slug === mc.slug)) {
            parsed.push(mc);
            modified = true;
          }
        });
        if (modified) {
          saveStoredCategories(parsed);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading dpc_categories', e);
  }
  saveStoredCategories(mockCategories);
  return mockCategories;
}

export function saveStoredCategories(categories: Category[]): void {
  try {
    localStorage.setItem('dpc_categories', JSON.stringify(categories));
    emitStorageUpdate('dpc_categories');
  } catch (e) {
    console.error('Error saving dpc_categories', e);
  }
}

export function getStoredInventory(): InventoryRecord[] {
  try {
    const data = localStorage.getItem('dpc_inventory_records');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading dpc_inventory_records', e);
  }
  saveStoredInventory(mockInventoryRecords);
  return mockInventoryRecords;
}

export function saveStoredInventory(records: InventoryRecord[]): void {
  try {
    localStorage.setItem('dpc_inventory_records', JSON.stringify(records));
    emitStorageUpdate('dpc_inventory_records');
  } catch (e) {
    console.error('Error saving dpc_inventory_records', e);
  }
}

export function getStoredDeliveryZones(): DeliveryZone[] {
  try {
    const data = localStorage.getItem('dpc_delivery_zones');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading dpc_delivery_zones', e);
  }
  saveStoredDeliveryZones(mockDeliveryZones);
  return mockDeliveryZones;
}

export function saveStoredDeliveryZones(zones: DeliveryZone[]): void {
  try {
    localStorage.setItem('dpc_delivery_zones', JSON.stringify(zones));
    emitStorageUpdate('dpc_delivery_zones');
  } catch (e) {
    console.error('Error saving dpc_delivery_zones', e);
  }
}

export function getStoredDrivers(): Driver[] {
  try {
    const data = localStorage.getItem('dpc_drivers');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading dpc_drivers', e);
  }
  saveStoredDrivers(mockDrivers as Driver[]);
  return mockDrivers as Driver[];
}

export function saveStoredDrivers(drivers: Driver[]): void {
  try {
    localStorage.setItem('dpc_drivers', JSON.stringify(drivers));
    emitStorageUpdate('dpc_drivers');
  } catch (e) {
    console.error('Error saving dpc_drivers', e);
  }
}

export function getStoredCoupons(): Coupon[] {
  try {
    const data = localStorage.getItem('dpc_coupons');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading dpc_coupons', e);
  }
  saveStoredCoupons(mockCoupons);
  return mockCoupons;
}

export function saveStoredCoupons(coupons: Coupon[]): void {
  try {
    localStorage.setItem('dpc_coupons', JSON.stringify(coupons));
    emitStorageUpdate('dpc_coupons');
  } catch (e) {
    console.error('Error saving dpc_coupons', e);
  }
}

export function getStoredPromotions(): Promotion[] {
  try {
    const data = localStorage.getItem('dpc_promotions');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading dpc_promotions', e);
  }
  saveStoredPromotions(mockPromotions);
  return mockPromotions;
}

export function saveStoredPromotions(promotions: Promotion[]): void {
  try {
    localStorage.setItem('dpc_promotions', JSON.stringify(promotions));
    emitStorageUpdate('dpc_promotions');
  } catch (e) {
    console.error('Error saving dpc_promotions', e);
  }
}

export function getStoredCmsSections(): CmsSection[] {
  try {
    const data = localStorage.getItem('dpc_cms_sections');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading dpc_cms_sections', e);
  }
  saveStoredCmsSections(mockCmsSections);
  return mockCmsSections;
}

export function saveStoredCmsSections(sections: CmsSection[]): void {
  try {
    localStorage.setItem('dpc_cms_sections', JSON.stringify(sections));
    emitStorageUpdate('dpc_cms_sections');
  } catch (e) {
    console.error('Error saving dpc_cms_sections', e);
  }
}

export function getStoredGiftConfig(): GiftBuilderConfig {
  try {
    const data = localStorage.getItem('dpc_gift_builder_config');
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading dpc_gift_builder_config', e);
  }
  saveStoredGiftConfig(mockGiftBuilderConfig);
  return mockGiftBuilderConfig;
}

export function saveStoredGiftConfig(config: GiftBuilderConfig): void {
  try {
    localStorage.setItem('dpc_gift_builder_config', JSON.stringify(config));
    emitStorageUpdate('dpc_gift_builder_config');
  } catch (e) {
    console.error('Error saving dpc_gift_builder_config', e);
  }
}

export function getStoredSuppliers(): Supplier[] {
  try {
    const data = localStorage.getItem('dpc_suppliers');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading dpc_suppliers', e);
  }
  saveStoredSuppliers(mockSuppliers as Supplier[]);
  return mockSuppliers as Supplier[];
}

export function saveStoredSuppliers(suppliers: Supplier[]): void {
  try {
    localStorage.setItem('dpc_suppliers', JSON.stringify(suppliers));
    emitStorageUpdate('dpc_suppliers');
  } catch (e) {
    console.error('Error saving dpc_suppliers', e);
  }
}

export function validateCoupon(code: string, subtotal: number): { valid: boolean; discountAmount: number; message: string; coupon?: Coupon } {
  if (!code || !code.trim()) {
    return { valid: false, discountAmount: 0, message: 'Please enter a coupon code.' };
  }
  const coupons = getStoredCoupons();
  const found = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
  if (!found) {
    return { valid: false, discountAmount: 0, message: 'Invalid coupon code.' };
  }
  if (!found.isActive) {
    return { valid: false, discountAmount: 0, message: 'This coupon code is no longer active.' };
  }
  const expiryDate = found.validUntil || found.endDate;
  if (expiryDate && new Date(expiryDate) < new Date()) {
    return { valid: false, discountAmount: 0, message: 'This coupon code has expired.' };
  }
  if (found.usageLimit && (found.usedCount || 0) >= found.usageLimit) {
    return { valid: false, discountAmount: 0, message: 'This coupon has reached its maximum usage limit.' };
  }
  const minSpend = found.minOrderAmount ?? found.minSpend ?? 0;
  if (minSpend > 0 && subtotal < minSpend) {
    return { valid: false, discountAmount: 0, message: `Minimum order amount of $${minSpend} required for this coupon.` };
  }

  const isPercentage = found.type === 'PERCENTAGE' || found.isPercentage;
  const couponVal = found.value ?? found.discountValue ?? 0;

  let discountAmount = 0;
  if (isPercentage) {
    discountAmount = Math.round(((subtotal * couponVal) / 100) * 100) / 100;
  } else {
    discountAmount = Math.min(subtotal, couponVal);
  }

  return {
    valid: true,
    discountAmount,
    message: `Coupon "${found.code}" applied! Save $${discountAmount.toFixed(2)}`,
    coupon: found
  };
}

export function recordOrderSale(order: Order, couponCode?: string): void {
  // 1. Add order to stored orders
  const existingOrders = getStoredOrders();
  saveStoredOrders([order, ...existingOrders]);

  // 2. Decrement product inventories and log inventory movements
  const products = getStoredProducts();
  const records = getStoredInventory();
  
  try {
    const raw = localStorage.getItem('dpc_stock_movements');
    const movements = raw ? JSON.parse(raw) : [];
    const newMovements = [...movements];

    order.items.forEach(item => {
      const pIdx = products.findIndex(p => p.id === item.productId);
      if (pIdx >= 0) {
        const currentInv = products[pIdx].inventory || 0;
        const nextInv = Math.max(0, currentInv - item.quantity);
        products[pIdx] = {
          ...products[pIdx],
          inventory: nextInv,
          availability: nextInv <= 0 ? 'OUT_OF_STOCK' : 'IN_STOCK'
        };

        const rIdx = records.findIndex(r => r.productId === item.productId);
        if (rIdx >= 0) {
          records[rIdx] = {
            ...records[rIdx],
            stock: Math.max(0, (records[rIdx].stock || 0) - item.quantity),
            sold: (records[rIdx].sold || 0) + item.quantity
          };
        }

        newMovements.unshift({
          id: `mov-sale-${Date.now()}-${item.productId}`,
          productId: item.productId,
          productName: item.productName || products[pIdx].name,
          change: -item.quantity,
          type: 'SALE',
          notes: `Customer Order #${order.id.slice(-6).toUpperCase()} to ${order.deliveryCity || 'Kenya'} (${item.quantity} units)`,
          timestamp: new Date().toISOString()
        });
      }
    });

    saveStoredProducts(products);
    saveStoredInventory(records);
    localStorage.setItem('dpc_stock_movements', JSON.stringify(newMovements));
  } catch (e) {
    console.error('Error updating stock on order sale', e);
  }

  // 3. Increment coupon usage if used
  if (couponCode) {
    const coupons = getStoredCoupons();
    const updatedCoupons = coupons.map(c => {
      if (c.code.toUpperCase() === couponCode.trim().toUpperCase()) {
        return {
          ...c,
          usedCount: (c.usedCount || 0) + 1
        };
      }
      return c;
    });
    saveStoredCoupons(updatedCoupons);
  }

  emitStorageUpdate('dpc_orders');
  emitStorageUpdate('dpc_catalog_products');
  emitStorageUpdate('dpc_inventory_records');
  emitStorageUpdate('dpc_stock_movements');
  emitStorageUpdate('dpc_coupons');
}

export function recordStockReceipt(
  productId: string,
  quantity: number,
  supplierName: string,
  batchRef: string,
  unitCost: number,
  notes: string
): void {
  // 1. Update product inventory
  const products = getStoredProducts();
  const updatedProducts = products.map(p => {
    if (p.id === productId) {
      return { ...p, inventory: (p.inventory || 0) + quantity };
    }
    return p;
  });
  saveStoredProducts(updatedProducts);

  // 2. Update inventory records
  const records = getStoredInventory();
  const updatedRecords = records.map(r => {
    if (r.productId === productId) {
      return { ...r, stock: (r.stock || 0) + quantity };
    }
    return r;
  });
  saveStoredInventory(updatedRecords);

  // 3. Log stock movement
  try {
    const raw = localStorage.getItem('dpc_stock_movements');
    const movements = raw ? JSON.parse(raw) : [];
    const prod = products.find(p => p.id === productId);
    const newMovement = {
      id: `mov-${Date.now()}`,
      productId,
      productName: prod ? prod.name : 'Catalog Item',
      change: quantity,
      type: 'RECEIVED',
      notes: `PO from ${supplierName} (${batchRef}) - ${notes}`,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('dpc_stock_movements', JSON.stringify([newMovement, ...movements]));
  } catch (e) {
    console.error('Error logging stock movement', e);
  }
}


