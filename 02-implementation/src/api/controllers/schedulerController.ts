/**
 * Scheduler Controller
 * Handles scheduler management and switching
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SchedulerManager } from '../../services/schedulerManager';
import { SchedulerType } from '../../schedulers/types';
import { createLogger } from '../../utils/logger';

const logger = createLogger('SchedulerController');

// Validation schema for scheduler switching
const SwitchSchedulerSchema = z.object({
  type: z.nativeEnum(SchedulerType),
});

export class SchedulerController {
  private schedulerManager: SchedulerManager;

  constructor(schedulerManager: SchedulerManager) {
    this.schedulerManager = schedulerManager;
  }

  /**
   * GET /api/scheduler/current
   * Get current scheduler information
   */
  getCurrentScheduler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentType = this.schedulerManager.getCurrentType();
      const currentScheduler = this.schedulerManager.getCurrentScheduler();
      const stats = await currentScheduler.getStats();

      res.status(200).json({
        success: true,
        data: {
          type: currentType,
          stats,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/scheduler/available
   * Get list of available schedulers
   */
  getAvailableSchedulers = (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const availableTypes = this.schedulerManager.getAvailableTypes();
      const currentType = this.schedulerManager.getCurrentType();

      res.status(200).json({
        success: true,
        data: {
          available: availableTypes,
          current: currentType,
          descriptions: {
            [SchedulerType.FCFS]: 'First-Come-First-Served: Process requests in arrival order',
            [SchedulerType.PRIORITY]: 'Priority-based scheduling with aging mechanism',
            [SchedulerType.MLFQ]: 'Multi-Level Feedback Queue with dynamic priority adjustment',
            [SchedulerType.WFQ]: 'Weighted Fair Queuing for multi-tenant environments',
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/scheduler/switch
   * Switch to a different scheduler
   */
  switchScheduler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate request body
      const validatedData = SwitchSchedulerSchema.parse(req.body);
      const newType = validatedData.type;

      logger.info(`Switching scheduler to: ${newType}`);

      // Perform the switch
      const success = this.schedulerManager.switchScheduler(newType);

      if (!success) {
        res.status(400).json({
          success: false,
          error: 'Failed to switch scheduler',
          message: `Could not switch to ${newType} scheduler`,
        });
        return;
      }

      // Get new scheduler stats
      const newScheduler = this.schedulerManager.getCurrentScheduler();
      const stats = await newScheduler.getStats();

      res.status(200).json({
        success: true,
        data: {
          previousType: this.schedulerManager.getCurrentType(),
          currentType: newType,
          stats,
        },
        message: `Successfully switched to ${newType} scheduler`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  };

  /**
   * GET /api/scheduler/stats
   * Get statistics for the current scheduler
   */
  getSchedulerStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentScheduler = this.schedulerManager.getCurrentScheduler();
      const stats = await currentScheduler.getStats();

      res.status(200).json({
        success: true,
        data: {
          type: this.schedulerManager.getCurrentType(),
          stats,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/scheduler/stats/all
   * Get statistics for all schedulers
   */
  getAllSchedulersStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const allStats = await this.schedulerManager.getAllStats();

      res.status(200).json({
        success: true,
        data: allStats,
      });
    } catch (error) {
      next(error);
    }
  };
}
