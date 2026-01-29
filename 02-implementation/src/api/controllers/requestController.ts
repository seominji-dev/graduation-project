/**
 * Request Controller
 * Handles HTTP requests for LLM scheduling
 */

import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { IScheduler } from "../../schedulers/types";
import {
  LLMRequest,
  RequestPriority,
  RequestStatus,
} from "../../domain/models";

// Request validation schema
const CreateRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  provider: z.object({
    name: z.enum(["ollama", "openai"]),
    model: z.string().optional(),
    baseUrl: z.string().optional(),
    apiKey: z.string().optional(),
  }),
  priority: z.nativeEnum(RequestPriority).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export class RequestController {
  private scheduler: IScheduler;

  constructor(scheduler: IScheduler) {
    this.scheduler = scheduler;
  }

  /**
   * POST /api/requests
   * Submit a new LLM request (REQ-SCHED-101: Queue and return ID)
   */
  createRequest = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Validate request body
      const validatedData = CreateRequestSchema.parse(req.body);

      // Create LLM request entity
      const request: LLMRequest = {
        id: uuidv4(),
        prompt: validatedData.prompt,
        provider: validatedData.provider,
        priority: validatedData.priority ?? RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        metadata: validatedData.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Submit to scheduler (REQ-SCHED-001: All requests must be queued)
      const jobId = await this.scheduler.submit(request);

      // Return request ID immediately (REQ-SCHED-101)
      res.status(202).json({
        success: true,
        data: {
          requestId: request.id,
          jobId: jobId,
          status: RequestStatus.QUEUED,
          priority: request.priority,
          createdAt: request.createdAt,
        },
        message: "Request queued successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation error",
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  };

  /**
   * GET /api/requests/:id
   * Get request status
   */
  getRequestStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const status = await this.scheduler.getStatus(id);

      res.status(200).json({
        success: true,
        data: {
          requestId: id,
          status: status,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/requests/:id
   * Cancel a request
   */
  cancelRequest = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const cancelled = await this.scheduler.cancel(id);

      if (!cancelled) {
        res.status(404).json({
          success: false,
          error: "Request not found or cannot be cancelled",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          requestId: id,
          status: RequestStatus.CANCELLED,
        },
        message: "Request cancelled successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/scheduler/stats
   * Get scheduler statistics
   */
  getSchedulerStats = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const stats = await this.scheduler.getStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
