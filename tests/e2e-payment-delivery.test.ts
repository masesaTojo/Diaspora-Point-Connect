import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApiApp } from '../src/server/app.ts';
import { OrderService, type OrderStore, type TxContext } from '../src/server/services/orderService.ts';
import { PesaPalClient } from '../src/server/pesapal.ts';
import type { Coupon, DeliveryZone, Order, PaymentTransaction, Product, Role } from '../src/types/index.ts';

class E2EOrderStore implements OrderStore {
  products = new Map<string, Product>();
  deliveryZones: DeliveryZone[] = [
    {
      id: 'zone-nbi',
      name: 'Nairobi',
      fee: 5,
      estimatedTime: 'Same Day',
      sameDayAvailable: true,
      scheduledAvailable: true,
      minimumOrder: 0,
    },
  ];
  coupons = new Map<string, Coupon>();
  orders = new Map<string, Order>();
  transactions = new Map<string, PaymentTransaction>();
  stockMovements: Array<Record<string, unknown>> = [];
  auditLogs: Array<Record<string, unknown>> = [];

  constructor() {
    this.products.set('prod-gift-1', {
      id: 'prod-gift-1',
      name: 'Diaspora Family Celebration Hamper',
      slug: 'diaspora-family-celebration-hamper',
      primaryCategoryId: 'gifts',
      description: 'Premium hamper',
      price: 100,
      images: ['/hamper.jpg'],
      recipients: [],
      occasions: [],
      collections: [],
      tags: [],
      deliveryZones: ['Nairobi'],
      isFeatured: true,
      isBestseller: true,
      isNewArrival: false,
      rating: 5,
      availability: 'IN_STOCK',
      status: 'ACTIVE',
      inventory: 3,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    this.coupons.set('coup-launch', {
      id: 'coup-launch',
      code: 'LAUNCH10',
      discountValue: 10,
      isPercentage: true,
      type: 'PERCENTAGE',
      value: 10,
      isActive: true,
      usedCount: 0,
      usageLimit: 100,
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
        if (p) this.products.set(id, { ...p, inventory: nextInventory, availability });
      },
      getDeliveryZones: async () => this.deliveryZones.map((z) => ({ ...z })),
      findCouponByCode: async (code) => {
        const clean = code.trim().toUpperCase();
        for (const c of this.coupons.values()) {
          if (c.code.toUpperCase() === clean) return { ...c };
        }
        return null;
      },
      incrementCouponUsage: async (id, nextUsed) => {
        const c = this.coupons.get(id);
        if (c) this.coupons.set(id, { ...c, usedCount: nextUsed });
      },
      getOrder: async (id) => {
        const o = this.orders.get(id);
        return o ? structuredClone(o) : null;
      },
      createOrder: async (order) => {
        this.orders.set(order.id, structuredClone(order));
      },
      updateOrder: async (id, patch) => {
        const existing = this.orders.get(id);
        if (existing) this.orders.set(id, { ...existing, ...patch });
      },
      getPaymentTransaction: async (tid) => {
        const tx = this.transactions.get(tid);
        return tx ? structuredClone(tx) : null;
      },
      setPaymentTransaction: async (txRec) => {
        this.transactions.set(txRec.trackingId, structuredClone(txRec));
      },
      appendStockMovement: async (mov) => {
        this.stockMovements.push(mov);
      },
      appendAuditLog: async (entry) => {
        this.auditLogs.push(entry);
      },
    };
    return fn(ctx);
  }

  async listOrdersByCustomer(uid: string) {
    return Array.from(this.orders.values()).filter((o) => o.customerId === uid);
  }
  async listAllOrders() {
    return Array.from(this.orders.values());
  }
  async getOrderById(id: string) {
    return this.orders.get(id) || null;
  }
}

test('End-to-End: Checkout -> PesaPal Payment -> IPN Confirmation -> Kenya Dispatch & Proof of Delivery', async () => {
  const store = new E2EOrderStore();
  let expectedPaymentAmount = 0;

  const mockPesaPalFetch = async (url: string, init?: RequestInit): Promise<Response> => {
    if (url.includes('/api/Auth/RequestToken')) {
      return new Response(JSON.stringify({ token: 'pp-jwt-e2e', status: '200' }), { status: 200 });
    }
    if (url.includes('/api/Transactions/SubmitOrderRequest')) {
      const payload = JSON.parse(String(init?.body || '{}')) as { amount: number; currency: string };
      expectedPaymentAmount = payload.amount;
      return new Response(
        JSON.stringify({
          order_tracking_id: 'TRK-E2E-9001',
          merchant_reference: 'E2E',
          redirect_url: 'https://pay.pesapal.com/e2e/checkout',
          status: '200',
        }),
        { status: 200 }
      );
    }
    if (url.includes('/api/Transactions/GetTransactionStatus')) {
      return new Response(
        JSON.stringify({
          payment_method: 'M-Pesa',
          amount: expectedPaymentAmount,
          currency: 'USD',
          payment_status_description: 'Completed',
          status_code: 1,
          confirmation_code: 'MPESA-CONF-8821',
        }),
        { status: 200 }
      );
    }
    return new Response('{}', { status: 404 });
  };

  const app = createApiApp({
    orderService: new OrderService(store),
    pesaPalClient: new PesaPalClient({
      config: {
        consumerKey: 'k-e2e',
        consumerSecret: 's-e2e',
        env: 'sandbox',
        ipnId: 'ipn-e2e',
      },
      fetchFn: mockPesaPalFetch as typeof fetch,
    }),
    authDeps: {
      verifyIdToken: async (token) => {
        if (token === 'sender-jwt') {
          return { uid: 'diaspora-sender-1', email: 'sender@london.co.uk', email_verified: true };
        }
        if (token === 'dispatcher-jwt') {
          return { uid: 'dispatcher-nbo-1', email: 'dispatch@diasporapoint.co.ke', email_verified: true };
        }
        throw new Error('Unauthorized');
      },
      loadUserRoles: async (uid) => {
        const map: Record<string, { roles: Role[]; isAdminDoc: boolean }> = {
          'diaspora-sender-1': { roles: ['CUSTOMER'], isAdminDoc: false },
          'dispatcher-nbo-1': { roles: ['DELIVERY_MANAGER'], isAdminDoc: false },
        };
        return map[uid] || { roles: [], isAdminDoc: false };
      },
    },
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  try {
    // Step 1: Verified customer submits checkout
    const checkoutRes = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer sender-jwt',
      },
      body: JSON.stringify({
        customer: { name: 'Grace Wanjiru', email: 'sender@london.co.uk', phone: '+447911123456' },
        recipient: { name: 'Mama Wanjiru', phone: '+254712345678' },
        delivery: { address: 'Karen Gardens, Nairobi', city: 'Nairobi', date: '2026-12-10' },
        items: [{ productId: 'prod-gift-1', quantity: 2, includeGreetingCard: true, giftMessage: 'Happy Birthday Mum!' }],
        couponCode: 'LAUNCH10',
        currency: 'USD',
      }),
    });
    assert.equal(checkoutRes.status, 201);
    const { order: pendingOrder } = (await checkoutRes.json()) as { order: Order };
    // Subtotal: 2 * 100 + 2 * 5 (greeting cards) = 210; 10% coupon = 21; +5 delivery +5 service = 199
    assert.equal(pendingOrder.subtotal, 210);
    assert.equal(pendingOrder.discount, 21);
    assert.equal(pendingOrder.total, 199);
    assert.equal(pendingOrder.status, 'PAYMENT_PENDING');
    assert.equal(pendingOrder.paymentStatus, 'PENDING');

    // Step 2: Initiate PesaPal payment
    const initRes = await fetch(`${baseUrl}/api/payments/pesapal/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer sender-jwt',
      },
      body: JSON.stringify({ orderId: pendingOrder.id }),
    });
    assert.equal(initRes.status, 200);
    const initBody = (await initRes.json()) as { trackingId: string; redirectUrl: string };
    assert.equal(initBody.trackingId, 'TRK-E2E-9001');
    assert.ok(initBody.redirectUrl.startsWith('https://'));

    // Step 3: PesaPal IPN confirms payment & decrements inventory atomically
    const ipnRes = await fetch(`${baseUrl}/api/payments/pesapal/ipn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        OrderTrackingId: 'TRK-E2E-9001',
        OrderMerchantReference: pendingOrder.id,
        OrderNotificationType: 'IPNCHANGE',
      }),
    });
    assert.equal(ipnRes.status, 200);
    assert.equal(store.products.get('prod-gift-1')?.inventory, 1);
    assert.equal(store.coupons.get('coup-launch')?.usedCount, 1);
    assert.equal(store.transactions.get('TRK-E2E-9001')?.status, 'COMPLETED');
    assert.equal(store.orders.get(pendingOrder.id)?.paymentStatus, 'PAID');
    assert.equal(store.stockMovements.length, 1);

    // Step 4: Customer callback verification is strictly idempotent (inventory stays 1, not -1!)
    const verifyRes = await fetch(`${baseUrl}/api/payments/pesapal/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer sender-jwt',
      },
      body: JSON.stringify({ orderId: pendingOrder.id, trackingId: 'TRK-E2E-9001' }),
    });
    assert.equal(verifyRes.status, 200);
    const verifyBody = (await verifyRes.json()) as { confirmed: boolean; alreadyConfirmed: boolean; order: Order };
    assert.equal(verifyBody.confirmed, true);
    assert.equal(verifyBody.alreadyConfirmed, true);
    assert.equal(store.products.get('prod-gift-1')?.inventory, 1);

    // Step 5: Logistics dispatches & delivers with real ETA and proof of delivery
    const dispatchRes = await fetch(`${baseUrl}/api/admin/orders/${pendingOrder.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dispatcher-jwt',
      },
      body: JSON.stringify({
        status: 'OUT_FOR_DELIVERY',
        driverId: 'drv-samuel',
        expectedDeliveryTime: 'Today 3:30 PM EAT',
      }),
    });
    assert.equal(dispatchRes.status, 200);

    const deliverRes = await fetch(`${baseUrl}/api/admin/orders/${pendingOrder.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dispatcher-jwt',
      },
      body: JSON.stringify({
        status: 'DELIVERED',
        proofOfDelivery: 'Signed by Mama Wanjiru at Karen Gatehouse',
      }),
    });
    assert.equal(deliverRes.status, 200);

    // Step 6: Sender queries customer order view & receives full confirmed delivery record
    const trackRes = await fetch(`${baseUrl}/api/orders/${pendingOrder.id}`, {
      headers: { Authorization: 'Bearer sender-jwt' },
    });
    assert.equal(trackRes.status, 200);
    const trackBody = (await trackRes.json()) as { order: Order };
    assert.equal(trackBody.order.status, 'DELIVERED');
    assert.equal(trackBody.order.paymentStatus, 'PAID');
    assert.equal(trackBody.order.driverId, 'drv-samuel');
    assert.equal(trackBody.order.expectedDeliveryTime, 'Today 3:30 PM EAT');
    assert.equal(trackBody.order.proofOfDelivery, 'Signed by Mama Wanjiru at Karen Gatehouse');
    assert.ok(store.auditLogs.length >= 3);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  }
});
