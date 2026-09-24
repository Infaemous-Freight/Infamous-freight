import { Router, Request, Response } from 'express';
import { askGenesisWithGemini } from './genesis-gemini';
import { DataStore } from './data-store';

function getTenantId(req: Request): string {
  if (!req.tenantId) {
    throw new Error('tenant_id_required');
  }
  return req.tenantId;
}

export function createGenesisGeminiRouter(dataStore: DataStore) {
  const router = Router();

  router.post('/chat', async (req: Request, res: Response, next) => {
    try {
      const input = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
      if (!input) {
        return res.status(400).json({
          error: 'genesis_message_required',
          message: 'message is required.',
          requestId: req.requestId,
        });
      }

      const tenantId = getTenantId(req);
      const [loads, shipments, drivers] = await Promise.all([
        dataStore.listLoads(tenantId),
        dataStore.listShipments(tenantId),
        dataStore.listDrivers(tenantId),
      ]);

      const result = await askGenesisWithGemini(input, {
        tenantId,
        role: req.userRole,
        loads,
        shipments,
        drivers,
      });

      return res.status(200).json({ data: result, requestId: req.requestId });
    } catch (error) {
      if (error instanceof Error && error.name === 'GeminiConfigurationError') {
        return res.status(503).json({
          error: 'gemini_not_configured',
          message: 'Genesis Gemini is not configured on the API runtime.',
          requestId: req.requestId,
        });
      }
      next(error);
    }
  });

  return router;
}
