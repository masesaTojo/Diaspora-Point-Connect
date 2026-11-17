import express, { type Request, type Response, type NextFunction } from 'express';
import { createHealthRouter } from './routes/health.ts';
import { createAuthRouter } from './routes/auth.ts';
import { createOrdersRouter } from './routes/orders.ts';
import { createPaymentsRouter } from './routes/payments.ts';
import type { AuthMiddlewareDeps } from './middleware/auth.ts';
import { getFirebaseAdminContext } from './firebaseAdmin.ts';
import { FirestoreOrderStore, OrderService, type OrderStore } from './services/orderService.ts';
import { PesaPalClient } from './pesapal.ts';

export interface CreateAppOptions {
  authDeps?: AuthMiddlewareDeps;
  orderStore?: OrderStore;
  orderService?: OrderService;
  pesaPalClient?: PesaPalClient;
}

export function createApiApp(options: CreateAppOptions = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(express.json({ limit: '1mb' }));

  let defaultOrderService: OrderService | null = options.orderService ?? null;
  const getOrderService = (): OrderService | null => {
    if (defaultOrderService) return defaultOrderService;
    if (options.orderStore) {
      defaultOrderService = new OrderService(options.orderStore);
      return defaultOrderService;
    }
    const { db } = getFirebaseAdminContext();
    if (!db) return null;
    defaultOrderService = new OrderService(new FirestoreOrderStore(db));
    return defaultOrderService;
  };

  const pesaPalClient = options.pesaPalClient ?? new PesaPalClient();

  const apiRouter = express.Router();
  apiRouter.use(createHealthRouter());
  apiRouter.use(createAuthRouter(options.authDeps));
  apiRouter.use(createOrdersRouter({ authDeps: options.authDeps, getOrderService }));
  apiRouter.use(
    createPaymentsRouter({
      authDeps: options.authDeps,
      getOrderService,
      pesaPalClient,
    })
  );

  apiRouter.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    });
  });

  apiRouter.use(
    (err: Error & { status?: number; type?: string }, _req: Request, res: Response, _next: NextFunction) => {
      if (err.type === 'entity.parse.failed') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Malformed JSON request payload.',
        });
        return;
      }

      console.error('Unhandled API error:', err?.message || err);
      res.status(err.status && err.status >= 400 ? err.status : 500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred processing the API request.',
      });
    }
  );

  app.use('/api', apiRouter);

  return app;
}
