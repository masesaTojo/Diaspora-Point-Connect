import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApiApp } from '../src/server/app.ts';
import { OrderService, type OrderStore, type TxContext } from '../src/server/services/orderService.ts';
import { PesaPalClient } from '../src/server/pesapal.ts';
import type { Order, PaymentTransaction, Product, Role } from '../src/types/index.ts';

class PenTestOrderStore implements OrderStore {
  orders = new Map<string, Order>();
  products = new Map<string, Product>();
  transactions = new Map<string, PaymentTransaction>();

  constructor() {
    this.products.set('p-1', {
      id: 'p-1',
      name: 'Nairobi Luxury Gift Box',
      slug: 'nairobi-luxury-gift-box',
      primaryCategoryId: 'gifts',
      description: 'Gift hamper',
      price: 80,
      images: ['/box.png'],
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
      inventory: 10,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    this.orders.set('ORD-VICTIM-1', {
      id: 'ORD-VICTIM-1',
      customerId: 'victim-uid',
      customerName: 'Victim User',
      customerEmail: 'victim@example.com',
      recipientName: 'Grace',
      recipientPhone: '0712000111',
      deliveryAddress: 'Westlands, Nairobi',
      deliveryCity: 'Nairobi',
      deliveryDate: '2026-12-01',
      items: [
        {
          id: 'item-1',
          productId: 'p-1',
          productName: 'Nairobi Luxury Gift Box',
          quantity: 1,
          unitPrice: 80,
          totalPrice: 80,
        },
      ],
      subtotal: 80,
      deliveryFee: 5,
      serviceFee: 5,
      discount: 0,
      total: 90,
      paymentCurrency: 'USD',
      paymentMethod: 'PESAPAL',
      paymentStatus: 'PENDING',
      status: 'PAYMENT_PENDING',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
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
      getDeliveryZones: async () => [
        {
          id: 'z1',
          name: 'Nairobi',
          fee: 5,
          estimatedTime: 'Same Day',
          sameDayAvailable: true,
          scheduledAvailable: true,
          minimumOrder: 0,
        },
      ],
      findCouponByCode: async () => null,
      incrementCouponUsage: async () => {},
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
      getPaymentTransaction: async (tid) => this.transactions.get(tid) || null,
      setPaymentTransaction: async (txRec) => {
        this.transactions.set(txRec.trackingId, structuredClone(txRec));
      },
      appendAuditLog: async () => {},
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

async function withPenTestServer(run: (baseUrl: string, store: PenTestOrderStore) => Promise<void>) {
  const store = new PenTestOrderStore();
  const app = createApiApp({
    orderService: new OrderService(store),
    pesaPalClient: new PesaPalClient({
      config: {
        consumerKey: 'k',
        consumerSecret: 's',
        env: 'sandbox',
        ipnId: 'ipn-1',
      },
    }),
    authDeps: {
      verifyIdToken: async (token: string) => {
        if (token === 'attacker-token') {
          return { uid: 'attacker-uid', email: 'attacker@example.com', email_verified: true };
        }
        if (token === 'support-token') {
          return { uid: 'support-uid', email: 'support@example.com', email_verified: true };
        }
        if (token === 'spoof-unverified') {
          return { uid: 'spoof-uid', email: 'masesawilson3@gmail.com', email_verified: false };
        }
        throw new Error('Invalid token');
      },
      loadUserRoles: async (uid: string) => {
        const map: Record<string, { roles: Role[]; isAdminDoc: boolean }> = {
          'attacker-uid': { roles: ['CUSTOMER'], isAdminDoc: false },
          'support-uid': { roles: ['SUPPORT_AGENT'], isAdminDoc: false },
          'spoof-uid': { roles: ['CUSTOMER'], isAdminDoc: false },
        };
        return map[uid] || { roles: [], isAdminDoc: false };
      },
    },
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${addr.port}`, store);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  }
}

test('PenTest: Zero client-exposed VITE_PESAPAL secrets in .env.example or src/', () => {
  const envExample = fs.readFileSync(path.resolve(process.cwd(), '.env.example'), 'utf8');
  assert.doesNotMatch(envExample, /VITE_PESAPAL_CONSUMER_/);

  const srcFiles = fs.readdirSync(path.resolve(process.cwd(), 'src'), { recursive: true }) as string[];
  for (const rel of srcFiles) {
    if (!/\.(ts|tsx)$/.test(rel)) continue;
    const content = fs.readFileSync(path.resolve(process.cwd(), 'src', rel), 'utf8');
    assert.doesNotMatch(content, /VITE_PESAPAL_CONSUMER_SECRET/);
  }
});

test('PenTest: Server ignores client-tampered total/status/paymentStatus on checkout', async () => {
  await withPenTestServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer attacker-token',
      },
      body: JSON.stringify({
        customer: { name: 'Attacker', email: 'attacker@example.com' },
        recipient: { name: 'Recipient', phone: '0712345678' },
        delivery: { address: 'Kilimani', city: 'Nairobi', date: '2026-12-01' },
        items: [{ productId: 'p-1', quantity: 1 }],
        // Tampered privileged fields sent by attacker:
        total: 0.01,
        subtotal: 0.01,
        discount: 999,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
      }),
    });

    assert.equal(res.status, 201);
    const body = (await res.json()) as { order: Order };
    assert.equal(body.order.status, 'PAYMENT_PENDING');
    assert.equal(body.order.paymentStatus, 'PENDING');
    assert.equal(body.order.subtotal, 80);
    assert.equal(body.order.total, 90);
    assert.equal(body.order.customerId, 'attacker-uid');
  });
});

test('PenTest: Cross-user IDOR and vertical privilege escalation attempts are blocked with 403', async () => {
  await withPenTestServer(async (baseUrl) => {
    // 1. Customer attacker tries to view victim order
    const idorRead = await fetch(`${baseUrl}/api/orders/ORD-VICTIM-1`, {
      headers: { Authorization: 'Bearer attacker-token' },
    });
    assert.equal(idorRead.status, 403);

    // 2. Customer attacker tries to initiate payment for victim order
    const idorPay = await fetch(`${baseUrl}/api/payments/pesapal/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer attacker-token',
      },
      body: JSON.stringify({ orderId: 'ORD-VICTIM-1' }),
    });
    assert.equal(idorPay.status, 403);

    // 3. Support agent tries to update order fulfillment status (not ORDER_MANAGER/DELIVERY_MANAGER/STORE_MANAGER)
    const privEscOrder = await fetch(`${baseUrl}/api/admin/orders/ORD-VICTIM-1/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer support-token',
      },
      body: JSON.stringify({ status: 'DELIVERED', proofOfDelivery: 'forged' }),
    });
    assert.equal(privEscOrder.status, 403);

    // 4. Unverified account spoofing bootstrap admin email is rejected
    const spoofAdmin = await fetch(`${baseUrl}/api/admin/orders`, {
      headers: { Authorization: 'Bearer spoof-unverified' },
    });
    assert.equal(spoofAdmin.status, 403);
  });
});

test('PenTest: Invalid orderId path injection and malformed JSON fail safely without stack leakage', async () => {
  await withPenTestServer(async (baseUrl) => {
    const badId = await fetch(`${baseUrl}/api/orders/..%2F..%2Fadmin`, {
      headers: { Authorization: 'Bearer attacker-token' },
    });
    assert.equal(badId.status, 400);

    const malformed = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer attacker-token',
      },
      body: '{bad json',
    });
    assert.equal(malformed.status, 400);
    const text = await malformed.text();
    assert.doesNotMatch(text, /at\s+\//, 'Error response must never leak server file paths or stack traces');
  });
});
