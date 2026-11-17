import { Router, type Request, type Response } from 'express';
import { createAuthMiddleware, type AuthMiddlewareDeps } from '../middleware/auth.ts';
import { requireRole, requireVerifiedEmail } from '../middleware/requireRole.ts';
import { ADMIN_ROUTE_ROLES } from '../../lib/rbac.ts';
import {
  OrderService,
  OrderServiceError,
  type CheckoutRequestInput,
} from '../services/orderService.ts';
import type { OrderStatus } from '../../types/index.ts';

const VALID_ORDER_ID = /^[a-zA-Z0-9_-]{3,128}$/;

const VALID_ORDER_STATUSES = new Set<OrderStatus>([
  'NEW',
  'PAYMENT_PENDING',
  'PAYMENT_CONFIRMED',
  'CONFIRMED',
  'PROCESSING',
  'READY_FOR_DELIVERY',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'PAYMENT_FAILED',
  'STOCK_ISSUE',
  'ADDRESS_ISSUE',
  'DELIVERY_FAILED',
  'RECIPIENT_UNAVAILABLE',
  'CANCELLED',
  'REFUNDED',
]);

export interface OrdersRouterDeps {
  authDeps?: AuthMiddlewareDeps;
  getOrderService: () => OrderService | null;
}

function handleRouteError(res: Response, err: unknown) {
  if (err instanceof OrderServiceError) {
    res.status(err.status).json({
      error: err.code,
      message: err.message,
    });
    return;
  }
  console.error('Order route error:', (err as Error)?.message || err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Failed to process order request.',
  });
}

export function createOrdersRouter(deps: OrdersRouterDeps) {
  const router = Router();
  const authenticate = createAuthMiddleware(deps.authDeps);

  const ensureService = (res: Response): OrderService | null => {
    const svc = deps.getOrderService();
    if (!svc) {
      res.status(503).json({
        error: 'Database Unavailable',
        message: 'Firestore Admin service is not configured on the backend.',
      });
      return null;
    }
    return svc;
  };

  // Customer checkout -> creates authoritative PAYMENT_PENDING order in Firestore
  router.post(
    '/orders/checkout',
    authenticate,
    requireVerifiedEmail,
    async (req: Request, res: Response) => {
      const svc = ensureService(res);
      if (!svc) return;

      try {
        const order = await svc.createPendingOrder(
          {
            uid: req.auth!.uid,
            email: req.auth!.email,
            isStaff: req.auth!.isStaff,
          },
          req.body as CheckoutRequestInput
        );
        res.status(201).json({
          ok: true,
          orderId: order.id,
          order,
        });
      } catch (err) {
        handleRouteError(res, err);
      }
    }
  );

  // Authenticated customer order history
  router.get(
    '/orders/my',
    authenticate,
    requireVerifiedEmail,
    async (req: Request, res: Response) => {
      const svc = ensureService(res);
      if (!svc) return;

      try {
        const orders = await svc.listCustomerOrders(req.auth!.uid);
        res.status(200).json({ ok: true, orders });
      } catch (err) {
        handleRouteError(res, err);
      }
    }
  );

  // Fetch single order (owner or sales/order staff only)
  router.get(
    '/orders/:orderId',
    authenticate,
    requireVerifiedEmail,
    async (req: Request, res: Response) => {
      const svc = ensureService(res);
      if (!svc) return;

      const { orderId } = req.params;
      if (!VALID_ORDER_ID.test(orderId)) {
        res.status(400).json({ error: 'INVALID_ORDER_ID', message: 'Invalid orderId format.' });
        return;
      }

      try {
        const order = await svc.getOrderForActor(orderId, {
          uid: req.auth!.uid,
          email: req.auth!.email,
          isStaff: req.auth!.isStaff,
        });
        res.status(200).json({ ok: true, order });
      } catch (err) {
        handleRouteError(res, err);
      }
    }
  );

  // Admin: list all Firestore orders
  router.get(
    '/admin/orders',
    authenticate,
    requireRole(ADMIN_ROUTE_ROLES.sales),
    async (_req: Request, res: Response) => {
      const svc = ensureService(res);
      if (!svc) return;

      try {
        const orders = await svc.listAllOrders();
        res.status(200).json({ ok: true, orders });
      } catch (err) {
        handleRouteError(res, err);
      }
    }
  );

  // Admin: update fulfillment status & delivery metadata
  router.patch(
    '/admin/orders/:orderId/status',
    authenticate,
    requireRole(ADMIN_ROUTE_ROLES.sales),
    async (req: Request, res: Response) => {
      const svc = ensureService(res);
      if (!svc) return;

      const { orderId } = req.params;
      if (!VALID_ORDER_ID.test(orderId)) {
        res.status(400).json({ error: 'INVALID_ORDER_ID', message: 'Invalid orderId format.' });
        return;
      }

      const body = (req.body || {}) as {
        status?: OrderStatus;
        driverId?: string;
        deliveryNotes?: string;
        expectedDeliveryTime?: string;
        proofOfDelivery?: string;
      };

      if (body.status && !VALID_ORDER_STATUSES.has(body.status)) {
        res.status(400).json({ error: 'INVALID_STATUS', message: 'Invalid order status value.' });
        return;
      }

      try {
        const order = await svc.updateOrderFulfillment(
          orderId,
          {
            uid: req.auth!.uid,
            email: req.auth!.email,
            isStaff: true,
          },
          body
        );
        res.status(200).json({ ok: true, order });
      } catch (err) {
        handleRouteError(res, err);
      }
    }
  );

  return router;
}
