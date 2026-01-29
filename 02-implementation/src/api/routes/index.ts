/**
 * API Routes
 * Define all API endpoints
 */

import { Router } from "express";
import { RequestController } from "../controllers/requestController";
import { SchedulerController } from "../controllers/schedulerController";

export function createRoutes(
  requestController: RequestController,
  schedulerController: SchedulerController,
): Router {
  const router = Router();

  // Health check
  router.get("/health", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "LLM Scheduler API is running",
      timestamp: new Date().toISOString(),
    });
  });

  // Request routes - wrap async handlers to avoid no-misused-promises
  router.post("/requests", (req, res, next) => {
    void requestController.createRequest(req, res, next);
  });
  router.get("/requests/:id", (req, res, next) => {
    void requestController.getRequestStatus(req, res, next);
  });
  router.delete("/requests/:id", (req, res, next) => {
    void requestController.cancelRequest(req, res, next);
  });

  // Scheduler management routes
  router.get("/scheduler/current", (req, res, next) => {
    void schedulerController.getCurrentScheduler(req, res, next);
  });
  router.get("/scheduler/available", (req, res, next) => {
    void schedulerController.getAvailableSchedulers(req, res, next);
  });
  router.post("/scheduler/switch", (req, res, next) => {
    void schedulerController.switchScheduler(req, res, next);
  });
  router.get("/scheduler/stats", (req, res, next) => {
    void schedulerController.getSchedulerStats(req, res, next);
  });
  router.get("/scheduler/stats/all", (req, res, next) => {
    void schedulerController.getAllSchedulersStats(req, res, next);
  });

  return router;
}
