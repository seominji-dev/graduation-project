import {
  DEFAULT_JOB_ATTEMPTS,
  DEFAULT_BACKOFF_DELAY_MS,
  DEFAULT_JOB_WEIGHT,
} from '../config/constants.js';

/**
 * FCFS (First-Come, First-Served) Scheduler
 * 
 * Simplest scheduling algorithm - requests are processed in order of arrival.
 * This serves as the baseline for comparing other scheduling algorithms.
 * 
 * SPEC-SCHED-001: FCFS implementation
 * REQ-SCHED-201: IF request has priority field, THEN respect it (extended FCFS with priority)
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
import { createLogger } from '../utils/logger';

const logger = createLogger('FCFSScheduler');

export class FCFSScheduler implements IScheduler {
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private llmService: LLMService;
  private config: Required<SchedulerConfig>;
  private jobTimings: Map<string, { queued: Date; started?: Date }> = new Map();

  constructor(config: SchedulerConfig, llmService: LLMService) {
    this.config = {
      name: config.name,
      defaultPriority: config.defaultPriority ?? RequestPriority.NORMAL,
      concurrency: config.concurrency ?? 1,
      agingInterval: config.agingInterval ?? 10000,
      boostInterval: config.boostInterval ?? 30000,
    };
    this.llmService = llmService;
  }

  /**
   * Initialize the FCFS scheduler
   */
  initialize(): Promise<void> {
    // Use BullMQ-specific connection (maxRetriesPerRequest: null)
    const bullmqConnection = redisManager.getBullMQConnection();

    // Create BullMQ queue
    this.queue = new Queue(this.config.name, {
      connection: bullmqConnection,
      defaultJobOptions: {
        attempts: DEFAULT_JOB_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: DEFAULT_BACKOFF_DELAY_MS,
        },
      },
    });

    // Create BullMQ worker with FCFS semantics
    // Note: BullMQ processes jobs in priority order by default,
    // so we set all jobs to same priority for true FCFS
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

    // Worker event handlers
    this.worker.on('completed', (job: Job<QueueJob>) => {
      logger.info('Job ' + job.id + ' completed');
      this.cleanupJobTimings(job.data.requestId);
    });

    this.worker.on('failed', (job: Job<QueueJob> | undefined, error: Error) => {
      logger.error('Job ' + (job?.id || 'unknown') + ' failed:', error);
      if (job) {
        this.cleanupJobTimings(job.data.requestId);
      }
    });

    logger.info('FCFS Scheduler "' + this.config.name + '" initialized');
    return Promise.resolve();
  }

  /**
   * Submit a request to the queue (REQ-SCHED-101)
   */
  async submit(request: LLMRequest): Promise<string> {
    if (!this.queue) {
      throw new Error('Scheduler not initialized');
    }

    const queuedAt = new Date();
    this.jobTimings.set(request.id, { queued: queuedAt });

    // Create queue job data
    const jobData: QueueJob = {
        tenantId: 'default',
        weight: DEFAULT_JOB_WEIGHT,
      requestId: request.id,
      prompt: request.prompt,
      provider: request.provider,
      priority: request.priority,
      attempts: 0,
    };

    // Add to queue with priority support (REQ-SCHED-201)
    // Higher priority number = higher priority (processed first)
    const job = await this.queue.add(
      'llm-request-' + request.id,
      jobData,
      {
        jobId: request.id,
        priority: this.getPriorityValue(request.priority),
      }
    );

    // Log to MongoDB (REQ-SCHED-002: Record processing time)
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

    // Get job state from BullMQ
    const state = await job.getState();
    
    // Map BullMQ job states to RequestStatus
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
   * Shutdown scheduler
   */
  async shutdown(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
    }
    logger.info('FCFS Scheduler "' + this.config.name + '" shut down');
  }

  /**
   * Process a single job (REQ-SCHED-103: Complete and save result)
   */
  private async processJob(job: Job<QueueJob>): Promise<string> {
    const { requestId, prompt, provider } = job.data;
    const startedAt = new Date();

    // Update timing
    const timing = this.jobTimings.get(requestId);
    if (timing) {
      timing.started = startedAt;
    }

    const waitTime = startedAt.getTime() - (timing?.queued.getTime() || startedAt.getTime());

    try {
      // Call LLM service
      const response = await this.llmService.process(prompt, provider);
      const completedAt = new Date();
      const processingTime = completedAt.getTime() - startedAt.getTime();

      // Save result to MongoDB (REQ-SCHED-103)
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

      // Log failure
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
   * Note: BullMQ uses higher number = higher priority
   */
  private getPriorityValue(priority: RequestPriority): number {
    // Map to 0-10 range for BullMQ
    return priority * 2;
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
      logger.error('Failed to log request:', error);
    }
  }

  /**
   * Log response to MongoDB (REQ-SCHED-103)
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
          processingTime, // REQ-SCHED-002: Record processing time
          waitTime,
          completedAt,
          error,
          updatedAt: new Date(),
        }
      );
    } catch (logError) {
      logger.error('Failed to log response:', logError);
    }
  }

  /**
   * Clean up job timings
   */
  private cleanupJobTimings(requestId: string): void {
    this.jobTimings.delete(requestId);
  }
}
