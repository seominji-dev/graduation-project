/**
 * Priority Scheduler (Non-Preemptive)
 *
 * Processes requests based on priority levels (URGENT > HIGH > NORMAL > LOW).
 * Higher priority requests are processed first, but running requests are not interrupted.
 *
 * SPEC-SCHED-002: Priority scheduling implementation
 * REQ-SCHED-201: Priority-based request ordering
 * REQ-SCHED-401: Aging mechanism to prevent starvation
 */

import { Queue, Job, Worker } from 'bullmq';
import { redisManager } from '../infrastructure/redis';
import { RequestLog } from '../infrastructure/models/RequestLog';
import { mongodbManager } from '../infrastructure/mongodb';
import {
  LLMRequest,
  QueueJob,
  RequestStatus,
  RequestPriority,
} from '../domain/models';
import {
  IScheduler,
  SchedulerConfig,
  SchedulerStats,
} from './types';
import { LLMService } from '../services/llmService';
import { AgingManager } from '../managers/AgingManager';

/**
 * Maximum priority value for calculating BullMQ priority
 * Used for priority mapping: (MAX_PRIORITY - priority) * 2
 */
const MAX_PRIORITY = RequestPriority.URGENT;

export class PriorityScheduler implements IScheduler {
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private llmService: LLMService;
  private config: Required<SchedulerConfig>;
  private agingManager: AgingManager | null = null;
  private jobTimings: Map<string, { queued: Date; started?: Date }> = new Map();

  constructor(config: SchedulerConfig, llmService: LLMService) {
    this.config = {
      name: config.name,
      defaultPriority: config.defaultPriority ?? RequestPriority.NORMAL,
      concurrency: config.concurrency ?? 1,
    };
    this.llmService = llmService;
  }

  /**
   * Initialize the Priority scheduler with aging support
   */
  initialize(): Promise<void> {
    const bullmqConnection = redisManager.getBullMQConnection();

    this.queue = new Queue(this.config.name, {
      connection: bullmqConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });

    this.worker = new Worker(
      this.config.name,
      async (job: Job<QueueJob>) => {
        return await this.processJob(job);
      },
      {
        connection: bullmqConnection,
        concurrency: this.config.concurrency,
      }
    );

    this.worker.on('completed', (job: Job<QueueJob>) => {
      console.log('Job ' + job.id + ' completed');
      this.cleanupJobTimings(job.data.requestId);
      if (this.agingManager) {
        this.agingManager.resetJobAging(job.data.requestId);
      }
    });

    this.worker.on('failed', (job: Job<QueueJob> | undefined, error: Error) => {
      console.error('Job ' + (job?.id || 'unknown') + ' failed:', error);
      if (job) {
        this.cleanupJobTimings(job.data.requestId);
        if (this.agingManager) {
          this.agingManager.resetJobAging(job.data.requestId);
        }
      }
    });

    this.agingManager = new AgingManager(this);
    this.agingManager.start();

    console.log('Priority Scheduler "' + this.config.name + '" initialized');
    return Promise.resolve();
  }

  /**
   * Submit a request to the queue with priority
   */
  async submit(request: LLMRequest): Promise<string> {
    if (!this.queue) {
      throw new Error('Scheduler not initialized');
    }

    const queuedAt = new Date();
    this.jobTimings.set(request.id, { queued: queuedAt });

    const jobData: QueueJob = {
        tenantId: 'default',
        weight: 10,
      requestId: request.id,
      prompt: request.prompt,
      provider: request.provider,
      priority: request.priority,
      attempts: 0,
      queuedAt: queuedAt,
    };

    const job = await this.queue.add(
      'llm-request-' + request.id,
      jobData,
      {
        jobId: request.id,
        priority: this.getPriorityValue(request.priority),
      }
    );

    await this.logRequest(request, RequestStatus.QUEUED, queuedAt);

    return job.id ?? request.id;
  }

  /**
   * Get request status
   */
  async getStatus(requestId: string): Promise<string> {
    if (!this.queue) {
      throw new Error('Scheduler not initialized');
    }

    const job = await this.queue.getJob(requestId);
    if (!job) {
      return RequestStatus.PENDING;
    }

    const state = await job.getState();

    switch (state) {
      case 'waiting':
      case 'delayed':
        return RequestStatus.QUEUED;
      case 'active':
        return RequestStatus.PROCESSING;
      case 'completed':
        return RequestStatus.COMPLETED;
      case 'failed':
        return RequestStatus.FAILED;
      default:
        return RequestStatus.PENDING;
    }
  }

  /**
   * Cancel a request
   */
  async cancel(requestId: string): Promise<boolean> {
    if (!this.queue) {
      throw new Error('Scheduler not initialized');
    }

    const job = await this.queue.getJob(requestId);
    if (!job) {
      return false;
    }

    await job.remove();
    this.cleanupJobTimings(requestId);
    return true;
  }

  /**
   * Get scheduler statistics
   */
  async getStats(): Promise<SchedulerStats> {
    if (!this.queue) {
      throw new Error('Scheduler not initialized');
    }

    const counts = await this.queue.getJobCounts();

    return {
      name: this.config.name,
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
      delayed: counts.delayed ?? 0,
      paused: await this.queue.isPaused(),
    };
  }

  /**
   * Pause processing
   */
  async pause(): Promise<void> {
    if (!this.queue) {
      throw new Error('Scheduler not initialized');
    }
    await this.queue.pause();
  }

  /**
   * Resume processing
   */
  async resume(): Promise<void> {
    if (!this.queue) {
      throw new Error('Scheduler not initialized');
    }
    await this.queue.resume();
  }

  /**
   * Shutdown scheduler and aging manager
   */
  async shutdown(): Promise<void> {
    if (this.agingManager) {
      this.agingManager.stop();
      this.agingManager = null;
    }
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
    }
    console.log('Priority Scheduler "' + this.config.name + '" shut down');
  }

  /**
   * Update job priority (used by AgingManager)
   * Note: BullMQ doesn't support direct priority updates, so we remove and re-add
   */
  async updateJobPriority(jobId: string, newPriority: RequestPriority): Promise<boolean> {
    if (!this.queue) {
      return false;
    }

    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        return false;
      }

      const state = await job.getState();
      if (state !== 'waiting' && state !== 'delayed') {
        return false;
      }

      // Store original job data
      const originalData = job.data as QueueJob;
      const originalName = job.name;
      const originalOpts = job.opts;

      // Remove the job with old priority
      await job.remove();

      // Re-add job with new priority
      await this.queue.add(
        originalName,
        {
          ...originalData,
          priority: newPriority,
        },
        {
          ...originalOpts,
          jobId: jobId,
          priority: this.getPriorityValue(newPriority),
        }
      );

      return true;
    } catch (error) {
      console.error('Failed to update job priority:', error);
      return false;
    }
  }

  /**
   * Get all waiting jobs (used by AgingManager)
   */
  async getWaitingJobs(): Promise<Array<{ jobId: string; priority: RequestPriority; queuedAt: Date }>> {
    if (!this.queue) {
      return [];
    }

    try {
      const jobs = await this.queue.getJobs(['waiting', 'delayed'], 0, 100);
      return jobs.map((job) => {
        const jobData = job.data as QueueJob;
        return {
          jobId: job.id!,
          priority: jobData.priority || RequestPriority.NORMAL,
          queuedAt: jobData.queuedAt || new Date(),
        };
      });
    } catch (error) {
      console.error('Failed to get waiting jobs:', error);
      return [];
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job<QueueJob>): Promise<string> {
    const { requestId, prompt, provider } = job.data;
    const startedAt = new Date();

    const timing = this.jobTimings.get(requestId);
    if (timing) {
      timing.started = startedAt;
    }

    const waitTime = startedAt.getTime() - (timing?.queued.getTime() || startedAt.getTime());

    try {
      const response = await this.llmService.process(prompt, provider);
      const completedAt = new Date();
      const processingTime = completedAt.getTime() - startedAt.getTime();

      await this.logResponse(
        requestId,
        RequestStatus.COMPLETED,
        response,
        waitTime,
        processingTime,
        completedAt
      );

      return response;
    } catch (error) {
      const completedAt = new Date();
      const processingTime = completedAt.getTime() - startedAt.getTime();
      const errorMsg = error instanceof Error ? error.message : String(error);

      await this.logResponse(
        requestId,
        RequestStatus.FAILED,
        undefined,
        waitTime,
        processingTime,
        completedAt,
        errorMsg
      );

      throw error;
    }
  }

  /**
   * Convert RequestPriority to BullMQ priority value
   * Formula: (MAX_PRIORITY - priority) * 2
   * URGENT(3) -> 0, HIGH(2) -> 2, NORMAL(1) -> 4, LOW(0) -> 6
   */
  private getPriorityValue(priority: RequestPriority): number {
    return (MAX_PRIORITY - priority) * 2;
  }

  /**
   * Log request to MongoDB
   */
  private async logRequest(
    request: LLMRequest,
    status: RequestStatus,
    timestamp: Date
  ): Promise<void> {
    try {
      await mongodbManager.connect();

      await RequestLog.create({
        requestId: request.id,
        prompt: request.prompt,
        provider: request.provider.name,
        modelName: request.provider.model || 'default',
        priority: request.priority,
        status,
        processingTime: 0,
        waitTime: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    } catch (error) {
      console.error('Failed to log request:', error);
    }
  }

  /**
   * Log response to MongoDB
   */
  private async logResponse(
    requestId: string,
    status: RequestStatus,
    response?: string,
    waitTime: number = 0,
    processingTime: number = 0,
    completedAt?: Date,
    error?: string
  ): Promise<void> {
    try {
      await mongodbManager.connect();

      await RequestLog.updateOne(
        { requestId },
        {
          status,
          response,
          processingTime,
          waitTime,
          completedAt,
          error,
          updatedAt: new Date(),
        }
      );
    } catch (logError) {
      console.error('Failed to log response:', logError);
    }
  }

  /**
   * Clean up job timings
   */
  private cleanupJobTimings(requestId: string): void {
    this.jobTimings.delete(requestId);
  }
}
