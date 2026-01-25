/**
 * API Routes
 * Define all API endpoints
 */

import { Router } from 'express';
import { RequestController } from '../controllers/requestController';

export function createRoutes(requestController: RequestController): Router {
  const router = Router();

  // Health check
  router.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'LLM Scheduler API is running',
      timestamp: new Date().toISOString(),
    });
  });

  // Request routes
  router.post('/requests', requestController.createRequest);
  router.get('/requests/:id', requestController.getRequestStatus);
  router.delete('/requests/:id', requestController.cancelRequest);

  // Scheduler routes
  router.get('/scheduler/stats', requestController.getSchedulerStats);

  return router;
}
