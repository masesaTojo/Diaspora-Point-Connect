import { Router, type Request, type Response } from 'express';
import { getFirebaseAdminContext } from '../firebaseAdmin.ts';
import { getServerExchangeRates } from '../services/orderService.ts';

export function createHealthRouter() {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    const adminCtx = getFirebaseAdminContext();
    res.status(200).json({
      ok: true,
      service: 'dpc-api',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      firebaseProjectId: adminCtx.projectId,
      firestoreDatabaseId: adminCtx.firestoreDatabaseId,
      adminCredentialMode: adminCtx.credentialMode,
    });
  });

  router.get('/fx-rates', async (_req: Request, res: Response) => {
    const rates = await getServerExchangeRates();
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).json({
      ok: true,
      base: 'USD',
      rates,
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
