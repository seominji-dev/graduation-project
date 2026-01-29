import {
  AGING_INTERVAL_MS,
  AGING_THRESHOLD_MS,
  MAX_AGE_PROMOTIONS,
} from "../config/constants.js";

/**
 * Aging Manager
 *
 * Implements aging mechanism for priority scheduling to prevent starvation.
 * Periodically promotes long-waiting jobs to higher priority levels.
 *
 * REQ-SCHED-401: Aging to prevent starvation
 */

import { RequestPriority } from "../domain/models";
import { createLogger } from "../utils/logger";

const logger = createLogger("AgingManager");

/**
 * Aging configuration
 */

/**
 * Interface for PriorityScheduler to allow AgingManager to update job priorities
 */
export interface IPriorityScheduler {
  updateJobPriority(
    jobId: string,
    newPriority: RequestPriority,
  ): Promise<boolean>;
  getWaitingJobs(): Promise<
    Array<{ jobId: string; priority: RequestPriority; queuedAt: Date }>
  >;
}

export class AgingManager {
  private scheduler: IPriorityScheduler | null;
  private intervalId: NodeJS.Timeout | null = null;
  private agingCount: Map<string, number> = new Map(); // Track promotions per job
  private isStopped: boolean = false;

  constructor(scheduler: IPriorityScheduler) {
    this.scheduler = scheduler;
    this.isStopped = false;
  }

  /**
   * Start the aging process
   */
  start(): void {
    if (this.intervalId) {
      logger.warn("AgingManager already started");
      return;
    }

    logger.info(
      "Starting AgingManager (interval: " + AGING_INTERVAL_MS + "ms)",
    );

    // Run aging immediately on start
    void this.runAging();

    // Schedule periodic aging
    this.intervalId = setInterval(() => {
      void this.runAging();
    }, AGING_INTERVAL_MS);

    // Prevent interval from keeping Node.js alive during tests
    if (this.intervalId.unref) {
      this.intervalId.unref();
    }
  }

  /**
   * Stop the aging process
   */
  stop(): void {
    this.isStopped = true;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.agingCount.clear();
    this.scheduler = null;
    logger.info("AgingManager stopped");
  }

  /**
   * Run aging process - promote long-waiting jobs
   */
  private async runAging(): Promise<void> {
    // Guard: Check if stopped or scheduler is invalid
    if (this.isStopped || !this.scheduler) {
      return;
    }

    try {
      const now = Date.now();
      const waitingJobs = await this.scheduler.getWaitingJobs();

      let promotedCount = 0;

      for (const job of waitingJobs) {
        const waitTime = now - job.queuedAt.getTime();

        // Only age jobs that have waited beyond threshold
        if (waitTime > AGING_THRESHOLD_MS) {
          // Calculate potential new priority
          const currentPromotions = this.agingCount.get(job.jobId) || 0;

          if (
            currentPromotions < MAX_AGE_PROMOTIONS &&
            job.priority < RequestPriority.URGENT
          ) {
            const newPriority = this.promotePriority(
              job.priority,
              currentPromotions,
            );

            if (newPriority !== job.priority) {
              const success = await this.scheduler.updateJobPriority(
                job.jobId,
                newPriority,
              );

              if (success) {
                this.agingCount.set(job.jobId, currentPromotions + 1);
                promotedCount++;
                logger.debug(
                  "Aging: Promoted job " +
                    job.jobId +
                    " from " +
                    RequestPriority[job.priority] +
                    " to " +
                    RequestPriority[newPriority] +
                    " (wait time: " +
                    Math.round(waitTime / 1000) +
                    "s)",
                );
              }
            }
          }
        }
      }

      if (promotedCount > 0) {
        logger.debug(
          "Aging cycle complete: promoted " + promotedCount + " jobs",
        );
      }
    } catch (error) {
      logger.error("Aging cycle failed:", error);
    }
  }

  /**
   * Calculate promoted priority based on current priority and promotion count
   */
  private promotePriority(
    currentPriority: RequestPriority,
    promotionCount: number,
  ): RequestPriority {
    // Each promotion increases priority by one level
    // MAX_AGE_PROMOTIONS limits how many levels a job can be promoted
    const newLevel = Math.min(
      currentPriority + promotionCount + 1,
      RequestPriority.URGENT,
    );
    return newLevel as RequestPriority;
  }

  /**
   * Reset aging count for a job (called when job is processed)
   */
  resetJobAging(jobId: string): void {
    this.agingCount.delete(jobId);
  }
}
