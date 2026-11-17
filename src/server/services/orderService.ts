import crypto from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';
import type { Coupon, DeliveryZone, Order, OrderItem, OrderStatus, PaymentTransaction, Product } from '../../types/index.ts';
import { mockCoupons, mockDeliveryZones, mockProducts } from '../../lib/mockData.ts';
import type { PesaPalTransactionStatus } from '../pesapal.ts';

export type SupportedCurrency = 'USD' | 'KES' | 'GBP' | 'EUR';

const FALLBACK_FX_RATES: Record<SupportedCurrency, number> = {
  USD: 1,
  KES: 129,
  GBP: 0.79,
  EUR: 0.92,
};

let cachedUsdRates: { rates: Record<SupportedCurrency, number>; fetchedAt: number } | null = null;

export async function getServerExchangeRates(): Promise<Record<SupportedCurrency, number>> {
  const now = Date.now();
  if (cachedUsdRates && now - cachedUsdRates.fetchedAt < 6 * 60 * 60 * 1000) {
    return cachedUsdRates.rates;
  }
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = (await res.json()) as { rates?: Record<string, number> };
      if (data?.rates?.KES && data?.rates?.GBP && data?.rates?.EUR) {
        const rates: Record<SupportedCurrency, number> = {
          USD: 1,
          KES: Number(data.rates.KES),
          GBP: Number(data.rates.GBP),
          EUR: Number(data.rates.EUR),
        };
        cachedUsdRates = { rates, fetchedAt: now };
        return rates;
      }
    }
  } catch {
    // Fallback cleanly to deterministic rates when external FX API is unreachable
  }
  return FALLBACK_FX_RATES;
}

export class OrderServiceError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 400, code = 'ORDER_ERROR') {
    super(message);
    this.name = 'OrderServiceError';
    this.status = status;
    this.code = code;
  }
}

export interface CheckoutItemInput {
  productId: string;
  quantity: number;
  recipient?: string;
  giftMessage?: string;
  includeGreetingCard?: boolean;
}

export interface CheckoutRequestInput {
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  recipient: {
    name: string;
    phone: string;
  };
  delivery: {
    address: string;
    city: string;
    date: string;
    notes?: string;
  };
  items: CheckoutItemInput[];
  couponCode?: string;
  currency?: SupportedCurrency;
}

export interface OrderActor {
  uid: string;
  email: string | null;
  isStaff?: boolean;
}

export interface TxContext {
  getProduct(id: string): Promise<Product | null>;
  setProductStock(id: string, nextInventory: number, availability: 'IN_STOCK' | 'OUT_OF_STOCK'): Promise<void>;
  getDeliveryZones(): Promise<DeliveryZone[]>;
  findCouponByCode(code: string): Promise<Coupon | null>;
  incrementCouponUsage(couponId: string, nextUsedCount: number): Promise<void>;
  getOrder(orderId: string): Promise<Order | null>;
  createOrder(order: Order): Promise<void>;
  updateOrder(orderId: string, patch: Partial<Order>): Promise<void>;
  getPaymentTransaction(trackingId: string): Promise<PaymentTransaction | null>;
  setPaymentTransaction(tx: PaymentTransaction): Promise<void>;
  getInventoryRecord?: (productId: string) => Promise<Record<string, unknown> | null>;
  setInventoryRecord?: (productId: string, data: Record<string, unknown>) => Promise<void>;
  appendStockMovement?: (movement: {
    id: string;
    productId: string;
    productName: string;
    change: number;
    type: 'SALE';
    notes: string;
    timestamp: string;
  }) => Promise<void>;
  appendAuditLog(entry: {
    id: string;
    userId: string;
    userEmail: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValue?: string;
    newValue?: string;
    timestamp: string;
  }): Promise<void>;
}

export interface OrderStore {
  runTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T>;
  listOrdersByCustomer(customerId: string): Promise<Order[]>;
  listAllOrders(): Promise<Order[]>;
  getOrderById(orderId: string): Promise<Order | null>;
}

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

export class FirestoreOrderStore implements OrderStore {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async runTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T> {
    return this.db.runTransaction(async (transaction) => {
      const ctx: TxContext = {
        getProduct: async (id: string) => {
          const snap = await transaction.get(this.db.collection('products').doc(id));
          return snap.exists ? ({ id: snap.id, ...snap.data() } as Product) : null;
        },
        setProductStock: async (id: string, nextInventory: number, availability: 'IN_STOCK' | 'OUT_OF_STOCK') => {
          transaction.update(this.db.collection('products').doc(id), {
            inventory: nextInventory,
            availability,
            updatedAt: new Date().toISOString(),
          });
        },
        getDeliveryZones: async () => {
          const snap = await transaction.get(this.db.collection('deliveryZones'));
          return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryZone));
        },
        findCouponByCode: async (code: string) => {
          const normalized = code.trim().toUpperCase();
          const snap = await transaction.get(this.db.collection('coupons'));
          for (const d of snap.docs) {
            const c = { id: d.id, ...d.data() } as Coupon;
            if (typeof c.code === 'string' && c.code.trim().toUpperCase() === normalized) {
              return c;
            }
          }
          return null;
        },
        incrementCouponUsage: async (couponId: string, nextUsedCount: number) => {
          transaction.update(this.db.collection('coupons').doc(couponId), {
            usedCount: nextUsedCount,
          });
        },
        getOrder: async (orderId: string) => {
          const snap = await transaction.get(this.db.collection('orders').doc(orderId));
          return snap.exists ? ({ id: snap.id, ...snap.data() } as Order) : null;
        },
        createOrder: async (order: Order) => {
          transaction.set(this.db.collection('orders').doc(order.id), stripUndefined(order as unknown as Record<string, unknown>));
        },
        updateOrder: async (orderId: string, patch: Partial<Order>) => {
          transaction.update(this.db.collection('orders').doc(orderId), stripUndefined(patch as Record<string, unknown>));
        },
        getPaymentTransaction: async (trackingId: string) => {
          const snap = await transaction.get(this.db.collection('paymentTransactions').doc(trackingId));
          return snap.exists ? (snap.data() as PaymentTransaction) : null;
        },
        setPaymentTransaction: async (paymentTx: PaymentTransaction) => {
          transaction.set(
            this.db.collection('paymentTransactions').doc(paymentTx.trackingId),
            stripUndefined(paymentTx as unknown as Record<string, unknown>),
            { merge: true }
          );
        },
        getInventoryRecord: async (productId: string) => {
          const snap = await transaction.get(this.db.collection('inventoryRecords').doc(productId));
          return snap.exists ? (snap.data() as Record<string, unknown>) : null;
        },
        setInventoryRecord: async (productId: string, data: Record<string, unknown>) => {
          transaction.set(
            this.db.collection('inventoryRecords').doc(productId),
            stripUndefined(data),
            { merge: true }
          );
        },
        appendStockMovement: async (movement) => {
          transaction.set(
            this.db.collection('stockMovements').doc(movement.id),
            stripUndefined(movement as unknown as Record<string, unknown>)
          );
        },
        appendAuditLog: async (entry) => {
          transaction.set(
            this.db.collection('auditLogs').doc(entry.id),
            stripUndefined(entry as Record<string, unknown>)
          );
        },
      };
      return fn(ctx);
    });
  }

  async listOrdersByCustomer(customerId: string): Promise<Order[]> {
    const snap = await this.db
      .collection('orders')
      .where('customerId', '==', customerId)
      .get();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Order))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  async listAllOrders(): Promise<Order[]> {
    const snap = await this.db.collection('orders').get();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Order))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    const snap = await this.db.collection('orders').doc(orderId).get();
    return snap.exists ? ({ id: snap.id, ...snap.data() } as Order) : null;
  }
}

function validateCheckoutInput(input: CheckoutRequestInput): void {
  if (!input || typeof input !== 'object') {
    throw new OrderServiceError('Invalid checkout request payload.', 400, 'INVALID_PAYLOAD');
  }
  const customerName = input.customer?.name?.trim() || '';
  const customerEmail = input.customer?.email?.trim() || '';
  if (customerName.length < 2 || customerName.length > 120) {
    throw new OrderServiceError('Customer full name must be between 2 and 120 characters.', 400, 'INVALID_CUSTOMER');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) || customerEmail.length > 254) {
    throw new OrderServiceError('Valid customer email is required.', 400, 'INVALID_CUSTOMER');
  }

  const recipientName = input.recipient?.name?.trim() || '';
  const recipientPhoneClean = (input.recipient?.phone || '').replace(/[\s\-()]/g, '');
  if (recipientName.length < 2 || recipientName.length > 120) {
    throw new OrderServiceError('Recipient name must be between 2 and 120 characters.', 400, 'INVALID_RECIPIENT');
  }
  if (!/^(?:(?:\+?254)|0)?([17]\d{8})$/.test(recipientPhoneClean)) {
    throw new OrderServiceError('Valid Kenyan recipient phone number is required.', 400, 'INVALID_RECIPIENT');
  }

  const address = input.delivery?.address?.trim() || '';
  const city = input.delivery?.city?.trim() || '';
  const date = input.delivery?.date?.trim() || '';
  if (!city || city.length > 100) {
    throw new OrderServiceError('Delivery city/zone is required.', 400, 'INVALID_DELIVERY');
  }
  if (address.length < 5 || address.length > 500) {
    throw new OrderServiceError('Detailed delivery address (min 5 characters) is required.', 400, 'INVALID_DELIVERY');
  }
  if (!date || date.length > 64) {
    throw new OrderServiceError('Requested delivery date is required.', 400, 'INVALID_DELIVERY');
  }

  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 50) {
    throw new OrderServiceError('Checkout must contain between 1 and 50 items.', 400, 'INVALID_ITEMS');
  }
  for (const item of input.items) {
    if (!item || typeof item.productId !== 'string' || !item.productId.trim()) {
      throw new OrderServiceError('Each order item must specify a valid productId.', 400, 'INVALID_ITEMS');
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
      throw new OrderServiceError('Item quantity must be an integer between 1 and 100.', 400, 'INVALID_ITEMS');
    }
  }
}

export class OrderService {
  private readonly store: OrderStore;
  private readonly getRates: () => Promise<Record<SupportedCurrency, number>>;

  constructor(
    store: OrderStore,
    options?: { getRates?: () => Promise<Record<SupportedCurrency, number>> }
  ) {
    this.store = store;
    this.getRates = options?.getRates ?? getServerExchangeRates;
  }

  async createPendingOrder(actor: OrderActor, input: CheckoutRequestInput): Promise<Order> {
    validateCheckoutInput(input);

    const requestedCurrency: SupportedCurrency =
      input.currency && ['USD', 'KES', 'GBP', 'EUR'].includes(input.currency)
        ? input.currency
        : 'USD';
    const rates = await this.getRates();

    return this.store.runTransaction(async (tx) => {
      // Deduplicate product lookups and check cumulative quantity against inventory
      const cumulativeQty = new Map<string, number>();
      for (const item of input.items) {
        cumulativeQty.set(item.productId, (cumulativeQty.get(item.productId) || 0) + item.quantity);
      }

      const resolvedProducts = new Map<string, Product>();
      for (const [productId, totalQty] of cumulativeQty.entries()) {
        let product = await tx.getProduct(productId);
        if (!product) {
          const fallback = mockProducts.find((p) => p.id === productId);
          if (fallback) {
            product = fallback as Product;
          }
        }
        if (!product) {
          throw new OrderServiceError(`Product "${productId}" was not found in catalog.`, 404, 'PRODUCT_NOT_FOUND');
        }
        if (product.status && product.status !== 'ACTIVE') {
          throw new OrderServiceError(`Product "${product.name}" is not available for purchase.`, 400, 'PRODUCT_UNAVAILABLE');
        }
        if (product.availability === 'OUT_OF_STOCK') {
          throw new OrderServiceError(`Product "${product.name}" is currently out of stock.`, 409, 'OUT_OF_STOCK');
        }
        if (typeof product.inventory === 'number' && product.inventory < totalQty) {
          throw new OrderServiceError(
            `Insufficient stock for "${product.name}". Requested ${totalQty}, available ${product.inventory}.`,
            409,
            'INSUFFICIENT_STOCK'
          );
        }
        resolvedProducts.set(productId, product);
      }

      const orderItems: OrderItem[] = [];
      let subtotal = 0;
      for (let i = 0; i < input.items.length; i++) {
        const reqItem = input.items[i];
        const product = resolvedProducts.get(reqItem.productId)!;
        const unitPrice = Number(product.salePrice ?? product.price ?? 0);
        if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
          throw new OrderServiceError(`Invalid catalog price for product "${product.name}".`, 500, 'INVALID_PRICE');
        }
        const greetingCardFee = reqItem.includeGreetingCard ? 5 * reqItem.quantity : 0;
        const totalPrice = round2(unitPrice * reqItem.quantity + greetingCardFee);
        subtotal = round2(subtotal + totalPrice);

        orderItems.push(
          stripUndefined({
            id: `item-${i + 1}-${reqItem.productId}`,
            productId: reqItem.productId,
            productName: product.name,
            quantity: reqItem.quantity,
            unitPrice,
            totalPrice,
            recipient: reqItem.recipient?.trim() || undefined,
            giftMessage: reqItem.giftMessage?.trim() || undefined,
            includeGreetingCard: Boolean(reqItem.includeGreetingCard),
          })
        );
      }

      // Resolve delivery fee from live Firestore zones (or baseline if unseeded)
      let zones = await tx.getDeliveryZones();
      if (zones.length === 0) {
        zones = mockDeliveryZones;
      }
      const selectedZone = zones.find(
        (z) => z.name.trim().toLowerCase() === input.delivery.city.trim().toLowerCase()
      );
      if (selectedZone && selectedZone.minimumOrder > 0 && subtotal < selectedZone.minimumOrder) {
        throw new OrderServiceError(
          `Minimum order amount for ${selectedZone.name} is $${selectedZone.minimumOrder}.`,
          400,
          'MIN_ORDER_NOT_MET'
        );
      }
      const deliveryFee = subtotal > 0 ? round2(selectedZone?.fee ?? 10) : 0;
      const serviceFee = subtotal > 0 ? 5 : 0;

      // Resolve optional coupon server-side
      let discount = 0;
      let normalizedCouponCode: string | undefined;
      if (input.couponCode && input.couponCode.trim()) {
        const cleanCode = input.couponCode.trim().toUpperCase();
        let coupon = await tx.findCouponByCode(cleanCode);
        if (!coupon) {
          coupon = mockCoupons.find((c) => c.code.toUpperCase() === cleanCode) || null;
        }
        if (!coupon) {
          throw new OrderServiceError(`Coupon code "${cleanCode}" is invalid.`, 400, 'INVALID_COUPON');
        }
        if (!coupon.isActive) {
          throw new OrderServiceError(`Coupon code "${cleanCode}" is no longer active.`, 400, 'INACTIVE_COUPON');
        }
        const expiryDate = coupon.validUntil || coupon.endDate;
        if (expiryDate && new Date(expiryDate) < new Date()) {
          throw new OrderServiceError(`Coupon code "${cleanCode}" has expired.`, 400, 'EXPIRED_COUPON');
        }
        if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
          throw new OrderServiceError(`Coupon code "${cleanCode}" has reached its usage limit.`, 400, 'COUPON_LIMIT_REACHED');
        }
        const minSpend = coupon.minOrderAmount ?? coupon.minSpend ?? 0;
        if (minSpend > 0 && subtotal < minSpend) {
          throw new OrderServiceError(
            `Minimum order amount of $${minSpend} is required for coupon "${cleanCode}".`,
            400,
            'COUPON_MIN_SPEND'
          );
        }

        const isPercentage = coupon.type === 'PERCENTAGE' || coupon.isPercentage;
        const couponVal = coupon.value ?? coupon.discountValue ?? 0;
        discount = isPercentage
          ? round2((subtotal * couponVal) / 100)
          : round2(Math.min(subtotal, couponVal));
        discount = Math.min(subtotal, Math.max(0, discount));
        normalizedCouponCode = coupon.code.toUpperCase();
      }

      const total = round2(Math.max(0.01, subtotal + deliveryFee + serviceFee - discount));
      const fxRate = rates[requestedCurrency] || 1;
      const paymentAmount = round2(total * fxRate);

      let orderId = `DPC-${crypto.randomInt(100000, 999999)}`;
      while (await tx.getOrder(orderId)) {
        orderId = `DPC-${crypto.randomInt(100000, 999999)}`;
      }

      const nowIso = new Date().toISOString();
      const rawOrder: Order = {
        id: orderId,
        customerId: actor.uid,
        customerEmail: input.customer.email.trim(),
        customerName: input.customer.name.trim(),
        customerPhone: input.customer.phone?.trim() || undefined,
        paymentStatus: 'PENDING',
        paymentMethod: 'PESAPAL',
        paymentCurrency: requestedCurrency,
        paymentAmount,
        couponCode: normalizedCouponCode,
        pesapalMerchantReference: orderId,
        stockDeducted: false,
        recipientName: input.recipient.name.trim(),
        recipientPhone: input.recipient.phone.trim(),
        deliveryAddress: input.delivery.address.trim(),
        deliveryCity: selectedZone?.name || input.delivery.city.trim(),
        deliveryDate: input.delivery.date.trim(),
        deliveryNotes: input.delivery.notes?.trim() || undefined,
        status: 'PAYMENT_PENDING',
        items: orderItems,
        subtotal,
        deliveryFee,
        serviceFee,
        discount,
        total,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      const newOrder = stripUndefined(rawOrder as unknown as Record<string, unknown>) as unknown as Order;

      await tx.createOrder(newOrder);
      await tx.appendAuditLog({
        id: `log-order-create-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        userId: actor.uid,
        userEmail: actor.email || input.customer.email.trim(),
        action: 'CREATE_ORDER_PENDING',
        entity: 'Order',
        entityId: orderId,
        newValue: JSON.stringify({ total, paymentCurrency: requestedCurrency, paymentAmount }),
        timestamp: nowIso,
      });

      return newOrder;
    });
  }

  async attachPesaPalInitiation(
    orderId: string,
    customerId: string,
    trackingId: string,
    merchantReference: string
  ): Promise<void> {
    await this.store.runTransaction(async (tx) => {
      const order = await tx.getOrder(orderId);
      if (!order) {
        throw new OrderServiceError(`Order "${orderId}" not found.`, 404, 'ORDER_NOT_FOUND');
      }
      if (order.customerId !== customerId) {
        throw new OrderServiceError('Not authorized to initiate payment for this order.', 403, 'FORBIDDEN');
      }
      if (order.paymentStatus === 'PAID') {
        throw new OrderServiceError('Order is already paid.', 409, 'ALREADY_PAID');
      }
      const nowIso = new Date().toISOString();
      await tx.updateOrder(orderId, {
        pesapalTrackingId: trackingId,
        pesapalMerchantReference: merchantReference,
        paymentMethod: 'PESAPAL',
        updatedAt: nowIso,
      });
      await tx.setPaymentTransaction({
        trackingId,
        orderId,
        customerId,
        provider: 'PESAPAL',
        status: 'PENDING',
        amount: order.paymentAmount ?? order.total,
        currency: order.paymentCurrency ?? 'USD',
        merchantReference,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    });
  }

  async confirmOrderFromPesaPalStatus(
    orderId: string,
    status: PesaPalTransactionStatus,
    actorUid?: string
  ): Promise<{
    confirmed: boolean;
    alreadyConfirmed: boolean;
    paymentStatus: Order['paymentStatus'];
    order: Order;
  }> {
    return this.store.runTransaction(async (tx) => {
      const order = await tx.getOrder(orderId);
      if (!order) {
        throw new OrderServiceError(`Order "${orderId}" not found.`, 404, 'ORDER_NOT_FOUND');
      }

      if (
        status.merchantReference &&
        status.merchantReference !== order.id &&
        status.merchantReference !== order.pesapalMerchantReference
      ) {
        throw new OrderServiceError(
          'PesaPal merchant reference does not match the target order.',
          400,
          'MERCHANT_REF_MISMATCH'
        );
      }

      // Idempotency guard: already verified and processed
      if (order.paymentStatus === 'PAID' && order.stockDeducted === true) {
        return {
          confirmed: true,
          alreadyConfirmed: true,
          paymentStatus: 'PAID',
          order,
        };
      }

      const nowIso = new Date().toISOString();
      const txBase: PaymentTransaction = {
        trackingId: status.orderTrackingId,
        orderId: order.id,
        customerId: order.customerId || actorUid || 'unknown',
        provider: 'PESAPAL',
        status: status.normalizedStatus,
        amount: status.amount,
        currency: status.currency,
        paymentMethod: status.paymentMethod,
        confirmationCode: status.confirmationCode,
        merchantReference: status.merchantReference || order.id,
        verifiedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      if (status.normalizedStatus === 'PENDING') {
        await tx.setPaymentTransaction(txBase);
        return {
          confirmed: false,
          alreadyConfirmed: false,
          paymentStatus: 'PENDING',
          order,
        };
      }

      if (status.normalizedStatus !== 'COMPLETED') {
        const failedPaymentStatus: Order['paymentStatus'] =
          status.normalizedStatus === 'REVERSED' ? 'REFUNDED' : 'FAILED';
        const nextStatus: OrderStatus =
          status.normalizedStatus === 'REVERSED' ? 'REFUNDED' : 'PAYMENT_FAILED';
        await tx.updateOrder(order.id, {
          paymentStatus: failedPaymentStatus,
          status: nextStatus,
          pesapalTrackingId: status.orderTrackingId,
          updatedAt: nowIso,
        });
        await tx.setPaymentTransaction(txBase);
        await tx.appendAuditLog({
          id: `log-pay-fail-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          userId: actorUid || order.customerId || 'system',
          userEmail: order.customerEmail || 'system',
          action: 'PAYMENT_VERIFICATION_FAILED',
          entity: 'Order',
          entityId: order.id,
          newValue: JSON.stringify({ trackingId: status.orderTrackingId, status: status.normalizedStatus }),
          timestamp: nowIso,
        });
        const updatedOrder = (await tx.getOrder(order.id)) || {
          ...order,
          paymentStatus: failedPaymentStatus,
          status: nextStatus,
        };
        return {
          confirmed: false,
          alreadyConfirmed: false,
          paymentStatus: failedPaymentStatus,
          order: updatedOrder,
        };
      }

      // Verify exact paid currency & amount match expected server-computed total
      const expectedCurrency = (order.paymentCurrency || 'USD').toUpperCase();
      const expectedAmount = order.paymentAmount ?? order.total;
      const paidCurrency = (status.currency || 'USD').toUpperCase();
      const paidAmount = Number(status.amount || 0);

      if (paidCurrency !== expectedCurrency || Math.abs(paidAmount - expectedAmount) > 0.05) {
        await tx.updateOrder(order.id, {
          paymentStatus: 'FAILED',
          status: 'PAYMENT_FAILED',
          pesapalTrackingId: status.orderTrackingId,
          updatedAt: nowIso,
        });
        await tx.setPaymentTransaction({ ...txBase, status: 'FAILED' });
        await tx.appendAuditLog({
          id: `log-pay-mismatch-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          userId: actorUid || order.customerId || 'system',
          userEmail: order.customerEmail || 'system',
          action: 'PAYMENT_AMOUNT_MISMATCH',
          entity: 'Order',
          entityId: order.id,
          oldValue: JSON.stringify({ expectedAmount, expectedCurrency }),
          newValue: JSON.stringify({ paidAmount, paidCurrency, trackingId: status.orderTrackingId }),
          timestamp: nowIso,
        });
        throw new OrderServiceError(
          `Payment amount/currency mismatch: expected ${expectedCurrency} ${expectedAmount.toFixed(2)}, got ${paidCurrency} ${paidAmount.toFixed(2)}.`,
          400,
          'AMOUNT_MISMATCH'
        );
      }

      // Accumulate quantities per productId inside the transaction
      const qtyByProduct = new Map<string, number>();
      for (const item of order.items) {
        qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) || 0) + item.quantity);
      }

      const firestoreStockUpdates: Array<{
        id: string;
        name: string;
        qty: number;
        nextInventory: number;
        availability: 'IN_STOCK' | 'OUT_OF_STOCK';
        invRec: Record<string, unknown> | null;
      }> = [];
      let stockIssueReason: string | null = null;

      for (const [productId, qty] of qtyByProduct.entries()) {
        const prod = await tx.getProduct(productId);
        const invRec = tx.getInventoryRecord ? await tx.getInventoryRecord(productId) : null;
        if (prod) {
          const currentInv = typeof prod.inventory === 'number' ? prod.inventory : 0;
          if (currentInv < qty) {
            stockIssueReason = `${prod.name} remaining=${currentInv}, needed=${qty}`;
            break;
          }
          const nextInventory = currentInv - qty;
          firestoreStockUpdates.push({
            id: productId,
            name: prod.name,
            qty,
            nextInventory,
            availability: nextInventory <= 0 ? 'OUT_OF_STOCK' : 'IN_STOCK',
            invRec,
          });
        }
      }

      if (stockIssueReason) {
        await tx.updateOrder(order.id, {
          paymentStatus: 'PAID',
          status: 'STOCK_ISSUE',
          stockDeducted: false,
          pesapalTrackingId: status.orderTrackingId,
          pesapalConfirmationCode: status.confirmationCode,
          paymentMethod: status.paymentMethod || order.paymentMethod || 'PESAPAL',
          paidAt: nowIso,
          updatedAt: nowIso,
        });
        await tx.setPaymentTransaction(txBase);
        await tx.appendAuditLog({
          id: `log-stock-issue-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          userId: actorUid || order.customerId || 'system',
          userEmail: order.customerEmail || 'system',
          action: 'ORDER_STOCK_ISSUE_AFTER_PAYMENT',
          entity: 'Order',
          entityId: order.id,
          newValue: stockIssueReason,
          timestamp: nowIso,
        });
        const issueOrder = (await tx.getOrder(order.id))!;
        return {
          confirmed: true,
          alreadyConfirmed: false,
          paymentStatus: 'PAID',
          order: issueOrder,
        };
      }

      // Apply atomic inventory decrements & stock movements
      for (const upd of firestoreStockUpdates) {
        await tx.setProductStock(upd.id, upd.nextInventory, upd.availability);
        if (tx.setInventoryRecord) {
          const prevSold = typeof upd.invRec?.sold === 'number' ? upd.invRec.sold : 0;
          await tx.setInventoryRecord(upd.id, {
            productId: upd.id,
            stock: upd.nextInventory,
            reserved: typeof upd.invRec?.reserved === 'number' ? upd.invRec.reserved : 0,
            damaged: typeof upd.invRec?.damaged === 'number' ? upd.invRec.damaged : 0,
            sold: prevSold + upd.qty,
            incoming: typeof upd.invRec?.incoming === 'number' ? upd.invRec.incoming : 0,
            lowStockThreshold: typeof upd.invRec?.lowStockThreshold === 'number' ? upd.invRec.lowStockThreshold : 8,
            updatedAt: nowIso,
          });
        }
        if (tx.appendStockMovement) {
          await tx.appendStockMovement({
            id: `mov-sale-${Date.now()}-${upd.id}-${crypto.randomBytes(2).toString('hex')}`,
            productId: upd.id,
            productName: upd.name,
            change: -upd.qty,
            type: 'SALE',
            notes: `Order #${order.id} confirmed for ${order.deliveryCity || 'Kenya'} (${upd.qty} units)`,
            timestamp: nowIso,
          });
        }
      }

      // Increment coupon usage atomically if stored in Firestore
      if (order.couponCode) {
        const coupon = await tx.findCouponByCode(order.couponCode);
        if (coupon) {
          const nextUsed = (coupon.usedCount || 0) + 1;
          await tx.incrementCouponUsage(coupon.id, nextUsed);
        }
      }

      // Confirm order atomically
      await tx.updateOrder(order.id, {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        stockDeducted: true,
        pesapalTrackingId: status.orderTrackingId,
        pesapalConfirmationCode: status.confirmationCode,
        paymentMethod: status.paymentMethod || order.paymentMethod || 'PESAPAL',
        paidAt: nowIso,
        updatedAt: nowIso,
      });
      await tx.setPaymentTransaction(txBase);
      await tx.appendAuditLog({
        id: `log-pay-confirm-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        userId: actorUid || order.customerId || 'system',
        userEmail: order.customerEmail || 'system',
        action: 'ORDER_PAYMENT_CONFIRMED',
        entity: 'Order',
        entityId: order.id,
        newValue: JSON.stringify({
          trackingId: status.orderTrackingId,
          confirmationCode: status.confirmationCode,
          amount: paidAmount,
          currency: paidCurrency,
        }),
        timestamp: nowIso,
      });

      const confirmedOrder = (await tx.getOrder(order.id)) || {
        ...order,
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        stockDeducted: true,
        paidAt: nowIso,
      };
      return {
        confirmed: true,
        alreadyConfirmed: false,
        paymentStatus: 'PAID',
        order: confirmedOrder,
      };
    });
  }

  async listCustomerOrders(customerId: string): Promise<Order[]> {
    return this.store.listOrdersByCustomer(customerId);
  }

  async listAllOrders(): Promise<Order[]> {
    return this.store.listAllOrders();
  }

  async getOrderForActor(orderId: string, actor: OrderActor): Promise<Order> {
    const order = await this.store.getOrderById(orderId);
    if (!order) {
      throw new OrderServiceError(`Order "${orderId}" not found.`, 404, 'ORDER_NOT_FOUND');
    }
    if (!actor.isStaff && order.customerId !== actor.uid) {
      throw new OrderServiceError('Not authorized to view this order.', 403, 'FORBIDDEN');
    }
    return order;
  }

  async updateOrderFulfillment(
    orderId: string,
    actor: OrderActor,
    patch: {
      status?: OrderStatus;
      driverId?: string;
      deliveryNotes?: string;
      expectedDeliveryTime?: string;
      proofOfDelivery?: string;
    }
  ): Promise<Order> {
    return this.store.runTransaction(async (tx) => {
      const existing = await tx.getOrder(orderId);
      if (!existing) {
        throw new OrderServiceError(`Order "${orderId}" not found.`, 404, 'ORDER_NOT_FOUND');
      }
      const nowIso = new Date().toISOString();
      const updatePatch: Partial<Order> = stripUndefined({
        status: patch.status ?? existing.status,
        driverId: patch.driverId !== undefined ? patch.driverId : existing.driverId,
        deliveryNotes: patch.deliveryNotes !== undefined ? patch.deliveryNotes : existing.deliveryNotes,
        expectedDeliveryTime:
          patch.expectedDeliveryTime !== undefined ? patch.expectedDeliveryTime : existing.expectedDeliveryTime,
        proofOfDelivery:
          patch.proofOfDelivery !== undefined ? patch.proofOfDelivery : existing.proofOfDelivery,
        updatedAt: nowIso,
      });

      await tx.updateOrder(orderId, updatePatch);
      await tx.appendAuditLog({
        id: `log-order-upd-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        userId: actor.uid,
        userEmail: actor.email || 'staff',
        action: 'UPDATE_ORDER_STATUS',
        entity: 'Order',
        entityId: orderId,
        oldValue: existing.status,
        newValue: updatePatch.status || existing.status,
        timestamp: nowIso,
      });

      return (await tx.getOrder(orderId)) || { ...existing, ...updatePatch };
    });
  }
}
