import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApiApp } from '../src/server/app.ts';
import {
  OrderService,
  OrderServiceError,
  type OrderStore,
  type TxContext,
} from '../src/server/services/orderService.ts';
import { PesaPalClient, type PesaPalTransactionStatus } from '../src/server/pesapal.ts';
import type {
  Coupon,
  DeliveryZone,
  Order,
  PaymentTransaction,
  Product,
  Role,
} from '../src/types/index.ts';

class InMemoryTransactionalOrderStore implements OrderStore {
  products = new Map<string, Product>();
  deliveryZones: DeliveryZone[] = [];
  coupons = new Map<string, Coupon>();
  orders = new Map<string, Order>();
  paymentTransactions = new Map<string, PaymentTransaction>();
  auditLogs: Array<Record<string, unknown>> = [];

  constructor() {
    this.products.set('prod-cake', {
      id: 'prod-cake',
      name: 'Signature Celebration Cake',
      slug: 'signature-celebration-cake',
      primaryCategoryId: 'cakes',
      description: 'Cake',
      price: 45,
      images: ['/cake.jpg'],
      recipients: [],
      occasions: [],
      collections: [],
      tags: [],
      deliveryZones: ['Nairobi'],
      isFeatured: false,
      isBestseller: false,
      isNewArrival: false,
      rating: 5,
      availability: 'IN_STOCK',
      status: 'ACTIVE',
      inventory: 4,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    this.products.set('prod-roses', {
      id: 'prod-roses',
      name: 'Kenyan Roses Bouquet',
      slug: 'kenyan-roses-bouquet',
      primaryCategoryId: 'flowers',
      description: 'Roses',
      price: 60,
      salePrice: 50,
      images: ['/roses.jpg'],
      recipients: [],
      occasions: [],
      collections: [],
      tags: [],
      deliveryZones: ['Nairobi'],
      isFeatured: false,
      isBestseller: false,
      isNewArrival: false,
      rating: 5,
      availability: 'IN_STOCK',
      status: 'ACTIVE',
      inventory: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    this.deliveryZones = [
      {
        id: 'zone-nbi',
        name: 'Nairobi',
        fee: 5,
        estimatedTime: 'Same Day',
        sameDayAvailable: true,
        scheduledAvailable: true,
        minimumOrder: 0,
      },
      {
        id: 'zone-msa',
        name: 'Mombasa',
        fee: 12,
        estimatedTime: '24 Hours',
        sameDayAvailable: false,
        scheduledAvailable: true,
        minimumOrder: 30,
      },
    ];
    this.coupons.set('coup-1', {
      id: 'coup-1',
      code: 'WELCOME10',
      discountValue: 10,
      isPercentage: true,
      type: 'PERCENTAGE',
      value: 10,
      isActive: true,
      usageLimit: 5,
      usedCount: 0,
      minOrderAmount: 20,
    });
    this.coupons.set('coup-expired', {
      id: 'coup-expired',
      code: 'OLD50',
      discountValue: 50,
      isPercentage: false,
      isActive: true,
      usedCount: 0,
      endDate: '2020-01-01T00:00:00.000Z',
    });
    this.coupons.set('coup-limit', {
      id: 'coup-limit',
      code: 'MAXED',
      discountValue: 10,
      isPercentage: false,
      isActive: true,
      usageLimit: 1,
      usedCount: 1,
    });
  }

  async runTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T> {
    const ctx: TxContext = {
      getProduct: async (id) => {
        const p = this.products.get(id);
        return p ? { ...p } : null;
      },
      setProductStock: async (id, nextInventory, availability) => {
        const p = this.products.get(id);
        if (p) {
          this.products.set(id, { ...p, inventory: nextInventory, availability });
        }
      },
      getDeliveryZones: async () => this.deliveryZones.map((z) => ({ ...z })),
      findCouponByCode: async (code) => {
        const clean = code.trim().toUpperCase();
        for (const c of this.coupons.values()) {
          if (c.code.toUpperCase() === clean) return { ...c };
        }
        return null;
      },
      incrementCouponUsage: async (couponId, nextUsedCount) => {
        const c = this.coupons.get(couponId);
        if (c) {
          this.coupons.set(couponId, { ...c, usedCount: nextUsedCount });
        }
      },
      getOrder: async (orderId) => {
        const o = this.orders.get(orderId);
        return o ? structuredClone(o) : null;
      },
      createOrder: async (order) => {
        this.orders.set(order.id, structuredClone(order));
      },
      updateOrder: async (orderId, patch) => {
        const o = this.orders.get(orderId);
        if (!o) throw new Error(`Missing order ${orderId}`);
        this.orders.set(orderId, { ...o, ...patch });
      },
      getPaymentTransaction: async (trackingId) => {
        const tx = this.paymentTransactions.get(trackingId);
        return tx ? { ...tx } : null;
      },
      setPaymentTransaction: async (paymentTx) => {
        this.paymentTransactions.set(paymentTx.trackingId, { ...paymentTx });
      },
      appendAuditLog: async (entry) => {
        this.auditLogs.push(entry);
      },
    };
    return fn(ctx);
  }

  async listOrdersByCustomer(customerId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter((o) => o.customerId === customerId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  async listAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || '')
    );
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    const o = this.orders.get(orderId);
    return o ? structuredClone(o) : null;
  }
}

const TOKEN_FIXTURES: Record<string, { uid: string; email?: string; email_verified?: boolean }> = {
  'cust-1-tok': { uid: 'cust-1', email: 'buyer1@example.com', email_verified: true },
  'cust-2-tok': { uid: 'cust-2', email: 'buyer2@example.com', email_verified: true },
  'unverified-tok': { uid: 'cust-3', email: 'unverified@example.com', email_verified: false },
  'staff-tok': { uid: 'mgr-1', email: 'manager@example.com', email_verified: true },
};

const ROLE_FIXTURES: Record<string, { roles: Role[]; isAdminDoc: boolean }> = {
  'cust-1': { roles: ['CUSTOMER'], isAdminDoc: false },
  'cust-2': { roles: ['CUSTOMER'], isAdminDoc: false },
  'cust-3': { roles: ['CUSTOMER'], isAdminDoc: false },
  'mgr-1': { roles: ['STORE_MANAGER'], isAdminDoc: true },
};

async function withOrderTestServer(
  options: {
    store?: InMemoryTransactionalOrderStore;
    pesaPalClient?: PesaPalClient;
  },
  run: (baseUrl: string, store: InMemoryTransactionalOrderStore) => Promise<void>
) {
  const store = options.store ?? new InMemoryTransactionalOrderStore();
  const orderService = new OrderService(store, {
    getRates: async () => ({ USD: 1, KES: 129, GBP: 0.8, EUR: 0.9 }),
  });

  const app = createApiApp({
    authDeps: {
      verifyIdToken: async (token) => {
        const rec = TOKEN_FIXTURES[token];
        if (!rec) throw new Error('Invalid token');
        return rec;
      },
      loadUserRoles: async (uid) => ROLE_FIXTURES[uid] ?? { roles: [], isAdminDoc: false },
    },
    orderStore: store,
    orderService,
    pesaPalClient: options.pesaPalClient ?? new PesaPalClient({ config: null }),
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl, store);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
  }
}

function validCheckoutPayload(overrides: Record<string, unknown> = {}) {
  return {
    customer: { name: 'Wanjiku Kamau', email: 'buyer1@example.com', phone: '+14155551212' },
    recipient: { name: 'Grace Kamau', phone: '+254712345678' },
    delivery: {
      address: 'Kilimani Apartments, Argwings Kodhek Rd',
      city: 'Nairobi',
      date: '2026-12-20',
      notes: 'Call at gate',
    },
    items: [
      { productId: 'prod-cake', quantity: 1, includeGreetingCard: true }, // 45 + 5 = 50
      { productId: 'prod-roses', quantity: 1, includeGreetingCard: false }, // salePrice = 50
    ],
    couponCode: 'WELCOME10', // 10% of 100 = 10
    currency: 'KES' as const,
    ...overrides,
  };
}

test('Server checkout computes authoritative totals, FX amounts, and blocks unverified/unauthorized requests', async () => {
  await withOrderTestServer({}, async (baseUrl, store) => {
    const unauth = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validCheckoutPayload()),
    });
    assert.equal(unauth.status, 401);

    const unverified = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer unverified-tok',
      },
      body: JSON.stringify(validCheckoutPayload()),
    });
    assert.equal(unverified.status, 403);

    // Attempt client price tampering alongside valid checkout payload
    const res = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer cust-1-tok',
      },
      body: JSON.stringify(
        validCheckoutPayload({
          subtotal: 0.01,
          total: 0.01,
          discount: 999,
        })
      ),
    });
    assert.equal(res.status, 201);
    const data = (await res.json()) as { orderId: string; order: Order };
    assert.equal(data.order.status, 'PAYMENT_PENDING');
    assert.equal(data.order.paymentStatus, 'PENDING');
    assert.equal(data.order.stockDeducted, false);
    assert.equal(data.order.subtotal, 100);
    assert.equal(data.order.deliveryFee, 5);
    assert.equal(data.order.serviceFee, 5);
    assert.equal(data.order.discount, 10);
    assert.equal(data.order.total, 100); // 100 + 5 + 5 - 10
    assert.equal(data.order.paymentCurrency, 'KES');
    assert.equal(data.order.paymentAmount, 12900); // 100 * 129
    assert.equal(data.order.customerId, 'cust-1');

    // Inventory is NOT deducted before payment verification
    assert.equal(store.products.get('prod-cake')?.inventory, 4);
    assert.equal(store.products.get('prod-roses')?.inventory, 2);
  });
});

test('Server checkout validates coupons and cumulative stock limits strictly', async () => {
  await withOrderTestServer({}, async (baseUrl) => {
    const expiredRes = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer cust-1-tok',
      },
      body: JSON.stringify(validCheckoutPayload({ couponCode: 'OLD50' })),
    });
    assert.equal(expiredRes.status, 400);
    assert.equal(((await expiredRes.json()) as { error: string }).error, 'EXPIRED_COUPON');

    const limitRes = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer cust-1-tok',
      },
      body: JSON.stringify(validCheckoutPayload({ couponCode: 'MAXED' })),
    });
    assert.equal(limitRes.status, 400);
    assert.equal(((await limitRes.json()) as { error: string }).error, 'COUPON_LIMIT_REACHED');

    // Cumulative stock check across duplicate cart lines (2 + 1 = 3 > inventory 2)
    const stockRes = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer cust-1-tok',
      },
      body: JSON.stringify(
        validCheckoutPayload({
          items: [
            { productId: 'prod-roses', quantity: 2 },
            { productId: 'prod-roses', quantity: 1 },
          ],
          couponCode: undefined,
        })
      ),
    });
    assert.equal(stockRes.status, 409);
    assert.equal(((await stockRes.json()) as { error: string }).error, 'INSUFFICIENT_STOCK');
  });
});

test('Payment initiation fails closed with 503 when PesaPal credentials are unconfigured', async () => {
  await withOrderTestServer(
    { pesaPalClient: new PesaPalClient({ config: null }) },
    async (baseUrl, store) => {
      const checkoutRes = await fetch(`${baseUrl}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer cust-1-tok',
        },
        body: JSON.stringify(validCheckoutPayload({ currency: 'USD' })),
      });
      const { orderId } = (await checkoutRes.json()) as { orderId: string };

      const initRes = await fetch(`${baseUrl}/api/payments/pesapal/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer cust-1-tok',
        },
        body: JSON.stringify({ orderId }),
      });
      assert.equal(initRes.status, 503);
      const initBody = (await initRes.json()) as { code: string };
      assert.equal(initBody.code, 'PESAPAL_NOT_CONFIGURED');

      // Order remains strictly PAYMENT_PENDING
      const storedOrder = store.orders.get(orderId)!;
      assert.equal(storedOrder.paymentStatus, 'PENDING');
      assert.equal(storedOrder.status, 'PAYMENT_PENDING');
      assert.equal(storedOrder.stockDeducted, false);
    }
  );
});

test('Full PesaPal initiation, verification, IPN idempotency, atomic inventory & coupon updates, and cross-user isolation', async () => {
  let verifiedStatusOverride: Partial<PesaPalTransactionStatus> = {};
  const mockPesaPal = {
    isConfigured: () => true,
    submitOrderRequest: async (input: { orderId: string }) => ({
      orderTrackingId: 'trk-live-001',
      merchantReference: input.orderId,
      redirectUrl: `https://cybqa.pesapal.com/pesapaliframe/PesapalIframe3/Index?OrderTrackingId=trk-live-001`,
    }),
    getTransactionStatus: async (trackingId: string): Promise<PesaPalTransactionStatus> => ({
      orderTrackingId: trackingId,
      merchantReference: verifiedStatusOverride.merchantReference ?? '',
      statusCode: 1,
      statusDescription: 'Completed',
      normalizedStatus: 'COMPLETED',
      amount: 100,
      currency: 'USD',
      paymentMethod: 'Mpesa',
      confirmationCode: 'QWE12345',
      ...verifiedStatusOverride,
    }),
  } as unknown as PesaPalClient;

  await withOrderTestServer({ pesaPalClient: mockPesaPal }, async (baseUrl, store) => {
    // 1. Customer 1 places pending order in USD (total = 100)
    const checkoutRes = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer cust-1-tok',
      },
      body: JSON.stringify(
        validCheckoutPayload({
          currency: 'USD',
          items: [{ productId: 'prod-roses', quantity: 2 }], // 2 * 50 = 100 subtotal, -10 WELCOME10 +5+5 = 100 total
        })
      ),
    });
    assert.equal(checkoutRes.status, 201);
    const { orderId } = (await checkoutRes.json()) as { orderId: string };
    verifiedStatusOverride.merchantReference = orderId;

    // 2. Customer 2 cannot view Customer 1 order or initiate payment on it
    const crossRead = await fetch(`${baseUrl}/api/orders/${orderId}`, {
      headers: { Authorization: 'Bearer cust-2-tok' },
    });
    assert.equal(crossRead.status, 403);

    const crossInit = await fetch(`${baseUrl}/api/payments/pesapal/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer cust-2-tok',
      },
      body: JSON.stringify({ orderId }),
    });
    assert.equal(crossInit.status, 403);

    // 3. Customer 1 initiates PesaPal payment
    const initRes = await fetch(`${baseUrl}/api/payments/pesapal/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer cust-1-tok',
      },
      body: JSON.stringify({ orderId }),
    });
    assert.equal(initRes.status, 200);
    const initBody = (await initRes.json()) as { trackingId: string; redirectUrl: string };
    assert.equal(initBody.trackingId, 'trk-live-001');
    assert.equal(store.orders.get(orderId)?.pesapalTrackingId, 'trk-live-001');
    assert.equal(store.paymentTransactions.get('trk-live-001')?.status, 'PENDING');

    // 4. Customer 1 verifies payment after PesaPal callback
    const verifyRes = await fetch(`${baseUrl}/api/payments/pesapal/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer cust-1-tok',
      },
      body: JSON.stringify({ orderId, trackingId: 'trk-live-001' }),
    });
    assert.equal(verifyRes.status, 200);
    const verifyBody = (await verifyRes.json()) as {
      confirmed: boolean;
      alreadyConfirmed: boolean;
      paymentStatus: string;
      order: Order;
    };
    assert.equal(verifyBody.confirmed, true);
    assert.equal(verifyBody.alreadyConfirmed, false);
    assert.equal(verifyBody.paymentStatus, 'PAID');
    assert.equal(verifyBody.order.status, 'CONFIRMED');
    assert.equal(verifyBody.order.stockDeducted, true);
    assert.equal(verifyBody.order.pesapalConfirmationCode, 'QWE12345');

    // 5. Inventory hit 0 -> OUT_OF_STOCK; Coupon usage incremented to 1
    assert.equal(store.products.get('prod-roses')?.inventory, 0);
    assert.equal(store.products.get('prod-roses')?.availability, 'OUT_OF_STOCK');
    assert.equal(store.coupons.get('coup-1')?.usedCount, 1);
    assert.equal(store.paymentTransactions.get('trk-live-001')?.status, 'COMPLETED');

    // 6. Duplicate IPN GET webhook is strictly idempotent (no double decrement)
    const ipnRes = await fetch(
      `${baseUrl}/api/payments/pesapal/ipn?OrderTrackingId=trk-live-001&OrderMerchantReference=${orderId}&OrderNotificationType=IPNCHANGE`
    );
    assert.equal(ipnRes.status, 200);
    assert.equal(store.products.get('prod-roses')?.inventory, 0);
    assert.equal(store.coupons.get('coup-1')?.usedCount, 1);

    // 7. Customer cannot access admin orders list; Store Manager can list & update fulfillment status
    const custAdmin = await fetch(`${baseUrl}/api/admin/orders`, {
      headers: { Authorization: 'Bearer cust-1-tok' },
    });
    assert.equal(custAdmin.status, 403);

    const mgrList = await fetch(`${baseUrl}/api/admin/orders`, {
      headers: { Authorization: 'Bearer staff-tok' },
    });
    assert.equal(mgrList.status, 200);
    const mgrData = (await mgrList.json()) as { orders: Order[] };
    assert.equal(mgrData.orders.length, 1);
    assert.equal(mgrData.orders[0].id, orderId);

    const statusUpdate = await fetch(`${baseUrl}/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer staff-tok',
      },
      body: JSON.stringify({ status: 'DISPATCHED', driverId: 'drv-7' }),
    });
    assert.equal(statusUpdate.status, 200);
    const updatedBody = (await statusUpdate.json()) as { order: Order };
    assert.equal(updatedBody.order.status, 'DISPATCHED');
    assert.equal(updatedBody.order.driverId, 'drv-7');
  });
});

test('Payment verification rejects amount mismatch and marks PAYMENT_FAILED without decrementing inventory', async () => {
  const store = new InMemoryTransactionalOrderStore();
  let orderRef = '';
  const mockPesaPal = {
    isConfigured: () => true,
    getTransactionStatus: async (trackingId: string): Promise<PesaPalTransactionStatus> => ({
      orderTrackingId: trackingId,
      merchantReference: orderRef,
      statusCode: 1,
      statusDescription: 'Completed',
      normalizedStatus: 'COMPLETED',
      amount: 1, // Tampered paid amount (expected is $100)
      currency: 'USD',
    }),
  } as unknown as PesaPalClient;

  await withOrderTestServer({ store, pesaPalClient: mockPesaPal }, async (baseUrl) => {
    const checkoutRes = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer cust-1-tok',
      },
      body: JSON.stringify(validCheckoutPayload({ currency: 'USD' })),
    });
    const { orderId } = (await checkoutRes.json()) as { orderId: string };
    orderRef = orderId;

    const verifyRes = await fetch(`${baseUrl}/api/payments/pesapal/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer cust-1-tok',
      },
      body: JSON.stringify({ orderId, trackingId: 'trk-underpay' }),
    });
    assert.equal(verifyRes.status, 400);
    const errBody = (await verifyRes.json()) as { error: string };
    assert.equal(errBody.error, 'AMOUNT_MISMATCH');

    assert.equal(store.orders.get(orderId)?.paymentStatus, 'FAILED');
    assert.equal(store.orders.get(orderId)?.status, 'PAYMENT_FAILED');
    assert.equal(store.products.get('prod-cake')?.inventory, 4);
    assert.equal(store.products.get('prod-roses')?.inventory, 2);
  });
});

test('Concurrent stock depletion before payment completion marks order STOCK_ISSUE with paymentStatus PAID (never negative inventory)', async () => {
  const store = new InMemoryTransactionalOrderStore();
  const orderService = new OrderService(store, {
    getRates: async () => ({ USD: 1, KES: 129, GBP: 0.8, EUR: 0.9 }),
  });

  const pendingOrder = await orderService.createPendingOrder(
    { uid: 'cust-1', email: 'buyer1@example.com' },
    validCheckoutPayload({
      currency: 'USD' as const,
      items: [{ productId: 'prod-roses', quantity: 2 }],
      couponCode: undefined,
    })
  );

  // Another confirmed order depletes roses inventory to 1 while this payment was in flight
  store.products.set('prod-roses', {
    ...store.products.get('prod-roses')!,
    inventory: 1,
  });

  const res = await orderService.confirmOrderFromPesaPalStatus(pendingOrder.id, {
    orderTrackingId: 'trk-race-1',
    merchantReference: pendingOrder.id,
    statusCode: 1,
    statusDescription: 'Completed',
    normalizedStatus: 'COMPLETED',
    amount: pendingOrder.total,
    currency: 'USD',
    confirmationCode: 'RACE999',
  });

  assert.equal(res.paymentStatus, 'PAID');
  assert.equal(res.order.status, 'STOCK_ISSUE');
  assert.equal(res.order.stockDeducted, false);
  assert.equal(store.products.get('prod-roses')?.inventory, 1);
});

test('OrderServiceError keeps status codes cleanly', () => {
  const err = new OrderServiceError('Bad input', 422, 'UNPROCESSABLE');
  assert.equal(err.status, 422);
  assert.equal(err.code, 'UNPROCESSABLE');
});
