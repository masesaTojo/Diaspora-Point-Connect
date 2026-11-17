import { Router, type Request, type Response } from 'express';
import { createAuthMiddleware, type AuthMiddlewareDeps } from '../middleware/auth.ts';
import { requireVerifiedEmail } from '../middleware/requireRole.ts';
import {
  PesaPalApiError,
  PesaPalClient,
  PesaPalNotConfiguredError,
} from '../pesapal.ts';
import { OrderService, OrderServiceError } from '../services/orderService.ts';

export interface PaymentsRouterDeps {
  authDeps?: AuthMiddlewareDeps;
  getOrderService: () => OrderService | null;
  pesaPalClient: PesaPalClient;
}

function resolveAppOrigin(req: Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, '');
  }
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto =
    typeof forwardedProto === 'string' && forwardedProto.length > 0
      ? forwardedProto.split(',')[0].trim()
      : req.protocol || 'http';
  const host = req.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

function handlePaymentError(res: Response, err: unknown) {
  if (err instanceof PesaPalNotConfiguredError) {
    res.status(503).json({
      error: 'Payment Gateway Not Configured',
      code: err.code,
      message: err.message,
    });
    return;
  }
  if (err instanceof PesaPalApiError) {
    res.status(err.status).json({
      error: 'Payment Gateway Error',
      message: err.message,
    });
    return;
  }
  if (err instanceof OrderServiceError) {
    res.status(err.status).json({
      error: err.code,
      message: err.message,
    });
    return;
  }
  console.error('Payment route error:', (err as Error)?.message || err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Unexpected error processing payment request.',
  });
}

export function createPaymentsRouter(deps: PaymentsRouterDeps) {
  const router = Router();
  const authenticate = createAuthMiddleware(deps.authDeps);

  const ensureOrderService = (res: Response): OrderService | null => {
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

  // Initiate PesaPal hosted checkout session using server-computed amount
  router.post(
    '/payments/pesapal/initiate',
    authenticate,
    requireVerifiedEmail,
    async (req: Request, res: Response) => {
      const svc = ensureOrderService(res);
      if (!svc) return;

      const body = (req.body || {}) as { orderId?: string };
      const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
      if (!orderId) {
        res.status(400).json({ error: 'INVALID_ORDER_ID', message: 'orderId is required.' });
        return;
      }

      try {
        const order = await svc.getOrderForActor(orderId, {
          uid: req.auth!.uid,
          email: req.auth!.email,
          isStaff: false, // Strictly require order ownership to initiate customer payment
        });

        if (order.paymentStatus === 'PAID') {
          res.status(409).json({
            error: 'ALREADY_PAID',
            message: 'This order has already been paid and confirmed.',
          });
          return;
        }

        const origin = resolveAppOrigin(req);
        const callbackUrl = `${origin}/checkout?orderId=${encodeURIComponent(order.id)}&pesapalCallback=1`;
        const ipnUrl = `${origin}/api/payments/pesapal/ipn`;

        const fullName = (order.customerName || 'Diaspora Customer').trim();
        const [firstName, ...rest] = fullName.split(/\s+/);
        const lastName = rest.join(' ');

        const result = await deps.pesaPalClient.submitOrderRequest({
          orderId: order.id,
          currency: (order.paymentCurrency || 'USD').toUpperCase(),
          amount: order.paymentAmount ?? order.total,
          description: `Diaspora Point Connect Gift Order ${order.id}`,
          callbackUrl,
          ipnUrl,
          billingAddress: {
            emailAddress: order.customerEmail || req.auth!.email || '',
            phoneNumber: order.customerPhone || '',
            firstName: firstName || 'Customer',
            lastName: lastName || undefined,
            line1: order.deliveryAddress || '',
            city: order.deliveryCity || 'Nairobi',
            countryCode: 'KE',
          },
        });

        await svc.attachPesaPalInitiation(
          order.id,
          req.auth!.uid,
          result.orderTrackingId,
          result.merchantReference
        );

        res.status(200).json({
          ok: true,
          orderId: order.id,
          trackingId: result.orderTrackingId,
          merchantReference: result.merchantReference,
          redirectUrl: result.redirectUrl,
        });
      } catch (err) {
        handlePaymentError(res, err);
      }
    }
  );

  // Explicit client-triggered verification after PesaPal callback redirect
  router.post(
    '/payments/pesapal/verify',
    authenticate,
    requireVerifiedEmail,
    async (req: Request, res: Response) => {
      const svc = ensureOrderService(res);
      if (!svc) return;

      const body = (req.body || {}) as { orderId?: string; trackingId?: string };
      const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
      if (!orderId) {
        res.status(400).json({ error: 'INVALID_ORDER_ID', message: 'orderId is required.' });
        return;
      }

      try {
        const order = await svc.getOrderForActor(orderId, {
          uid: req.auth!.uid,
          email: req.auth!.email,
          isStaff: req.auth!.isStaff,
        });

        // If already paid & stock deducted, return idempotently even if PesaPal polling is skipped
        if (order.paymentStatus === 'PAID' && order.stockDeducted === true) {
          res.status(200).json({
            ok: true,
            confirmed: true,
            alreadyConfirmed: true,
            paymentStatus: 'PAID',
            order,
          });
          return;
        }

        const trackingId =
          (typeof body.trackingId === 'string' ? body.trackingId.trim() : '') ||
          order.pesapalTrackingId ||
          '';

        if (!trackingId) {
          res.status(400).json({
            error: 'MISSING_TRACKING_ID',
            message: 'No PesaPal OrderTrackingId is associated with this order yet.',
          });
          return;
        }

        const txStatus = await deps.pesaPalClient.getTransactionStatus(trackingId);
        const result = await svc.confirmOrderFromPesaPalStatus(
          order.id,
          txStatus,
          req.auth!.uid
        );

        res.status(200).json({
          ok: result.confirmed,
          confirmed: result.confirmed,
          alreadyConfirmed: result.alreadyConfirmed,
          paymentStatus: result.paymentStatus,
          statusDescription: txStatus.statusDescription,
          order: result.order,
        });
      } catch (err) {
        handlePaymentError(res, err);
      }
    }
  );

  // PesaPal IPN Webhook (supports GET query params & POST JSON notifications)
  const handleIpn = async (req: Request, res: Response) => {
    const svc = ensureOrderService(res);
    if (!svc) return;

    const trackingId = String(
      req.query.OrderTrackingId ||
        req.query.orderTrackingId ||
        (req.body as Record<string, unknown>)?.OrderTrackingId ||
        (req.body as Record<string, unknown>)?.orderTrackingId ||
        ''
    ).trim();

    const merchantReference = String(
      req.query.OrderMerchantReference ||
        req.query.orderMerchantReference ||
        (req.body as Record<string, unknown>)?.OrderMerchantReference ||
        (req.body as Record<string, unknown>)?.orderMerchantReference ||
        ''
    ).trim();

    const notificationType = String(
      req.query.OrderNotificationType ||
        (req.body as Record<string, unknown>)?.OrderNotificationType ||
        'IPNCHANGE'
    ).trim();

    if (!trackingId) {
      res.status(400).json({
        error: 'INVALID_IPN',
        message: 'OrderTrackingId is required.',
      });
      return;
    }

    try {
      // Zero-trust verification: query PesaPal directly instead of trusting webhook body
      const txStatus = await deps.pesaPalClient.getTransactionStatus(trackingId);
      const targetOrderId = merchantReference || txStatus.merchantReference;

      if (!targetOrderId) {
        res.status(400).json({
          error: 'MISSING_MERCHANT_REFERENCE',
          message: 'Unable to determine order reference for IPN notification.',
        });
        return;
      }

      await svc.confirmOrderFromPesaPalStatus(targetOrderId, txStatus, 'pesapal-ipn');

      res.status(200).json({
        orderNotificationType: notificationType,
        orderTrackingId: trackingId,
        orderMerchantReference: targetOrderId,
        status: 200,
      });
    } catch (err) {
      handlePaymentError(res, err);
    }
  };

  router.get('/payments/pesapal/ipn', handleIpn);
  router.post('/payments/pesapal/ipn', handleIpn);

  return router;
}
