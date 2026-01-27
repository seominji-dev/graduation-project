/**
 * API Routes
 * Define all API endpoints
 */

import { Router } from 'express';
import { RequestController } from '../controllers/requestController';

export function createRoutes(requestController: RequestController): Router {
  const router = Router();

  // Health check
  router.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'LLM Scheduler API is running',
      timestamp: new Date().toISOString(),
    });
  });

  // Request routes - wrap async handlers to avoid no-misused-promises
  router.post('/requests', (req, res, next) => {
    void requestController.createRequest(req, res, next);
  });
  router.get('/requests/:id', (req, res, next) => {
    void requestController.getRequestStatus(req, res, next);
  });
  router.delete('/requests/:id', (req, res, next) => {
    void requestController.cancelRequest(req, res, next);
  });

  // Scheduler routes
  router.get('/scheduler/stats', (req, res, next) => {
    void requestController.getSchedulerStats(req, res, next);
  });

  return router;
}
