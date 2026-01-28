import {
  DEFAULT_JOB_ATTEMPTS,
  DEFAULT_BACKOFF_DELAY_MS,
} from '../config/constants.js';

/**
 * MLFQ (Multi-Level Feedback Queue) Scheduler
 * 
 * Implements OS-style multi-level feedback queue scheduling for LLM requests.
 * 
 * SPEC-SCHED-003: MLFQ implementation with 5 rules:
 * Rule 1: If Priority(A) > Priority(B), A runs (B doesn't)
 * Rule 2: If Priority(A) = Priority(B), A & B run in round-robin
 * Rule 3: When job enters system, placed at highest priority (Q0)
 * Rule 4: If job uses full time slice, lower priority; if gives up CPU, stay same
 * Rule 5: After time S, boost all jobs to highest priority
 * 
 * Queue Configuration:
 * - Q0: 1000ms time quantum (highest priority, shortest quantum)
 * - Q1: 3000ms time quantum
 * - Q2: 8000ms time quantum
 * - Q3: Infinity (lowest priority, FCFS behavior)
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
import { BoostManager } from '../managers/BoostManager';
import { createLogger } from '../utils/logger';

const logger = createLogger('MLFQScheduler');

/**
 * MLFQ Configuration
 */
const QUEUE_LEVELS = 4;
const TIME_QUANTA = [1000, 3000, 8000, Infinity] as const; // milliseconds
const QUEUE_NAMES = ['mlfq-q0', 'mlfq-q1', 'mlfq-q2', 'mlfq-q3'] as const;

/**
 * Extended QueueJob with MLFQ metadata
 */
interface MLFQQueueJob extends QueueJob {
  queueLevel: number; // Current queue level (0-3)
  queueHistory: number[]; // History of queue levels visited
  timeSliceUsed?: number; // Time slice used in current quantum (ms)
  timeSliceRemaining: number; // Remaining time in current quantum (ms)
  totalCPUTime: number; // Total CPU time used (ms)
  lastQueueChange?: Date; // When job last changed queues
}

/**
 * Combined stats across all MLFQ queues
 */
interface MLFQStats extends SchedulerStats {
  queueStats: Array<{
    level: number;
    name: string;
    timeQuantum: number;
    waiting: number;
    active: number;
  }>;
}

export class MLFQScheduler implements IScheduler {
  // Multiple queues for MLFQ (one per priority level)
  private queues: Queue[] = [];
  private workers: Worker[] = [];
  private llmService: LLMService;
  private config: Required<SchedulerConfig>;
  private boostManager: BoostManager | null = null;
  
  // Track job timings and metadata
  private jobTimings: Map<string, { queued: Date; started?: Date }> = new Map();
  private jobMetadata: Map<string, MLFQQueueJob> = new Map();
  
  // Track current queue being serviced (for round-robin within same level)
  private currentQueueIndex: number = 0;
  
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
   * Initialize the MLFQ scheduler with 4 queues
   */
  initialize(): Promise<void> {
    const bullmqConnection = redisManager.getBullMQConnection();

    // Create 4 priority queues (Q0, Q1, Q2, Q3)
    for (let level = 0; level < QUEUE_LEVELS; level++) {
      const queue = new Queue(QUEUE_NAMES[level], {
        connection: bullmqConnection,
        defaultJobOptions: {
          attempts: DEFAULT_JOB_ATTEMPTS,
          backoff: {
            type: 'exponential',
            delay: DEFAULT_BACKOFF_DELAY_MS,
          },
        },
      });
      this.queues.push(queue);

      // Create worker for this queue
      const worker = new Worker(
        QUEUE_NAMES[level],
        async (job: Job<MLFQQueueJob>) => {
          return await this.processJob(job, level);
        },
        {
          connection: bullmqConnection,
          concurrency: this.config.concurrency,
        }
      );
      this.workers.push(worker);

      // Worker event handlers
      worker.on('completed', (job: Job<MLFQQueueJob>) => {
        logger.info('Job ' + job.id + ' completed from Q' + level);
        this.cleanupJobMetadata(job.data.requestId);
      });

      worker.on('failed', (job: Job<MLFQQueueJob> | undefined, error: Error) => {
        logger.error('Job ' + (job?.id || 'unknown') + ' failed from Q' + level + ':', error);
        if (job) {
          this.cleanupJobMetadata(job.data.requestId);
        }
      });
    }

    // Start boost manager (Rule 5: Periodic boosting)
    this.boostManager = new BoostManager(this);
    this.boostManager.start();

    logger.info('MLFQ Scheduler "' + this.config.name + '" initialized with ' + 
      QUEUE_LEVELS + ' queues (Q0: ' + TIME_QUANTA[0] + 'ms, Q1: ' + 
      TIME_QUANTA[1] + 'ms, Q2: ' + TIME_QUANTA[2] + 'ms, Q3: Infinity)');
    return Promise.resolve();
  }

  /**
   * Submit a request to the highest priority queue (Q0) - Rule 3
   */
  async submit(request: LLMRequest): Promise<string> {
    const queuedAt = new Date();
    this.jobTimings.set(request.id, { queued: queuedAt });

    // Create MLFQ job metadata (Rule 3: New jobs start at Q0)
    const mlfqJobData: MLFQQueueJob = {
      requestId: request.id,
      prompt: request.prompt,
      provider: request.provider,
      priority: request.priority,
      attempts: 0,
      tenantId: 'default',
      weight: 10,
      queueLevel: 0, // Start at Q0 (highest priority)
      queueHistory: [0],
      timeSliceRemaining: TIME_QUANTA[0],
      totalCPUTime: 0,
      lastQueueChange: queuedAt,
    };
    this.jobMetadata.set(request.id, mlfqJobData);

    // Add to Q0 (highest priority queue)
    const job = await this.queues[0].add(
      'llm-request-' + request.id,
      mlfqJobData,
      {
        jobId: request.id,
        priority: 0, // All jobs in Q0 have same priority for round-robin
      }
    );

    // Log to MongoDB with queue level
    await this.logRequest(request, RequestStatus.QUEUED, queuedAt, 0);

    return job.id ?? request.id;
  }

  /**
   * Get request status
   */
  async getStatus(requestId: string): Promise<string> {
    // Search through all queues to find the job
    for (let level = 0; level < QUEUE_LEVELS; level++) {
      const job = await this.queues[level].getJob(requestId);
      if (job) {
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
    }
    return RequestStatus.PENDING;
  }

  /**
   * Cancel a request
   */
  async cancel(requestId: string): Promise<boolean> {
    // Search through all queues
    for (let level = 0; level < QUEUE_LEVELS; level++) {
      const job = await this.queues[level].getJob(requestId);
      if (job) {
        await job.remove();
        this.cleanupJobMetadata(requestId);
        return true;
      }
    }
    return false;
  }

  /**
   * Get scheduler statistics for all queues
   */
  async getStats(): Promise<MLFQStats> {
    let totalWaiting = 0;
    let totalActive = 0;
    let totalCompleted = 0;
    let totalFailed = 0;
    let totalDelayed = 0;

    const queueStats = await Promise.all(
      this.queues.map(async (queue, level) => {
        const counts = await queue.getJobCounts();
        const waiting = counts.waiting ?? 0;
        const active = counts.active ?? 0;
        const completed = counts.completed ?? 0;
        const failed = counts.failed ?? 0;
        const delayed = counts.delayed ?? 0;

        totalWaiting += waiting;
        totalActive += active;
        totalCompleted += completed;
        totalFailed += failed;
        totalDelayed += delayed;

        return {
          level,
          name: QUEUE_NAMES[level],
          timeQuantum: TIME_QUANTA[level],
          waiting,
          active,
        };
      })
    );

    return {
      name: this.config.name,
      waiting: totalWaiting,
      active: totalActive,
      completed: totalCompleted,
      failed: totalFailed,
      delayed: totalDelayed,
      paused: await this.queues[0].isPaused(),
      queueStats,
    };
  }

  /**
   * Pause all queues
   */
  async pause(): Promise<void> {
    if (this.queues.length === 0) {
      throw new Error('Scheduler not initialized');
    }
    for (const queue of this.queues) {
      await queue.pause();
    }
  }

  /**
   * Resume all queues
   */
  async resume(): Promise<void> {
    if (this.queues.length === 0) {
      throw new Error('Scheduler not initialized');
    }
    for (const queue of this.queues) {
      await queue.resume();
    }
  }

  /**
   * Shutdown scheduler and boost manager
   */
  async shutdown(): Promise<void> {
    if (this.boostManager) {
      this.boostManager.stop();
      this.boostManager = null;
    }

    for (const worker of this.workers) {
      await worker.close();
    }
    this.workers = [];

    for (const queue of this.queues) {
      await queue.close();
    }
    this.queues = [];

    logger.info('MLFQ Scheduler "' + this.config.name + '" shut down');
  }

  /**
   * Boost all jobs to Q0 (Rule 5) - called by BoostManager
   */
  async boostAllJobs(): Promise<number> {
    // Guard: Check if queues are still valid (may be called after shutdown)
    if (!this.queues || this.queues.length === 0 || !this.queues[0]) {
      return 0;
    }

    let boostedCount = 0;

    // Move jobs from Q1, Q2, Q3 to Q0
    for (let sourceLevel = 1; sourceLevel < QUEUE_LEVELS; sourceLevel++) {
      if (!this.queues[sourceLevel]) continue;
      const jobs = await this.queues[sourceLevel].getJobs(['waiting', 'delayed'], 0, 1000);

      for (const job of jobs) {
        try {
          const jobData = job.data as MLFQQueueJob;
          const metadata = this.jobMetadata.get(jobData.requestId);
          if (!metadata) continue;

          // Only boost if not already in Q0
          if (metadata.queueLevel > 0) {
            // Remove from current queue
            await job.remove();

            // Update metadata
            metadata.queueLevel = 0;
            metadata.queueHistory.push(0);
            metadata.timeSliceRemaining = TIME_QUANTA[0];
            metadata.lastQueueChange = new Date();
            this.jobMetadata.set(jobData.requestId, metadata);

            // Add to Q0
            await this.queues[0].add(
              job.name,
              metadata,
              {
                jobId: job.id,
                priority: 0,
              }
            );

            // Update MongoDB log
            await this.updateQueueLevel(jobData.requestId, 0, metadata.queueHistory);

            boostedCount++;
          }
        } catch (error) {
          logger.error('Failed to boost job ' + job.id + ':', error);
        }
      }
    }

    return boostedCount;
  }

  /**
   * Get total job count across all queues (for BoostManager)
   */
  async getJobCount(): Promise<number> {
    let total = 0;
    for (const queue of this.queues) {
      const counts = await queue.getJobCounts();
      total += (counts.waiting ?? 0) + (counts.active ?? 0) + (counts.delayed ?? 0);
    }
    return total;
  }

  /**
   * Process a job with time quantum enforcement
   * Implements Rule 4: Adjust priority based on time slice usage
   */
  private async processJob(job: Job<MLFQQueueJob>, queueLevel: number): Promise<string> {
    const { requestId, prompt, provider } = job.data;
    const startedAt = new Date();

    // Update timing
    const timing = this.jobTimings.get(requestId);
    if (timing) {
      timing.started = startedAt;
    }

    const waitTime = startedAt.getTime() - (timing?.queued.getTime() || startedAt.getTime());

    // Get job metadata
    const metadata = this.jobMetadata.get(requestId);
    if (!metadata) {
      throw new Error('Job metadata not found: ' + requestId);
    }

    const timeQuantum = TIME_QUANTA[queueLevel];

    try {
      let response: string;

      if (timeQuantum === Infinity) {
        // Q3: No time limit (FCFS behavior)
        response = await this.llmService.process(prompt, provider);
        metadata.totalCPUTime += Infinity; // Mark as using full time
      } else {
        // Q0-Q2: Enforce time quantum
        const startTime = Date.now();
        
        // Create timeout promise for time quantum
        const timeoutPromise = new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error('Time quantum exceeded')), timeQuantum);
        });

        // Race between LLM processing and timeout
        response = await Promise.race([
          this.llmService.process(prompt, provider),
          timeoutPromise,
        ]);

        const actualTimeUsed = Date.now() - startTime;
        metadata.totalCPUTime += actualTimeUsed;
        metadata.timeSliceUsed = actualTimeUsed;
      }

      const completedAt = new Date();
      const processingTime = completedAt.getTime() - startedAt.getTime();

      // Save result to MongoDB
      await this.logResponse(
        requestId,
        RequestStatus.COMPLETED,
        response,
        waitTime,
        processingTime,
        completedAt,
        metadata
      );

      return response;
    } catch (error) {
      const completedAt = new Date();
      const processingTime = completedAt.getTime() - startedAt.getTime();
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Check if job should be demoted (used full time slice)
      const shouldDemote = errorMsg === 'Time quantum exceeded' && queueLevel < QUEUE_LEVELS - 1;

      if (shouldDemote) {
        // Rule 4: Job used full time slice, demote to lower priority queue
        await this.demoteJob(requestId, queueLevel);
        throw new Error('Job demoted to Q' + (queueLevel + 1) + ' after exceeding time quantum');
      }

      // Log failure
      await this.logResponse(
        requestId,
        RequestStatus.FAILED,
        undefined,
        waitTime,
        processingTime,
        completedAt,
        metadata,
        errorMsg
      );

      throw error;
    }
  }

  /**
   * Demote a job to the next lower priority queue (Rule 4)
   */
  private async demoteJob(requestId: string, currentLevel: number): Promise<void> {
    const newLevel = currentLevel + 1;
    if (newLevel >= QUEUE_LEVELS) {
      return; // Already at lowest priority
    }

    const metadata = this.jobMetadata.get(requestId);
    if (!metadata) {
      return;
    }

    // Get job from current queue
    const job = await this.queues[currentLevel].getJob(requestId);
    if (!job || (await job.getState()) !== 'active') {
      return;
    }

    // Update metadata
    metadata.queueLevel = newLevel;
    metadata.queueHistory.push(newLevel);
    metadata.timeSliceRemaining = TIME_QUANTA[newLevel];
    metadata.lastQueueChange = new Date();
    
    this.jobMetadata.set(requestId, metadata);

    // Re-add job to lower priority queue
    await this.queues[newLevel].add(
      job.name,
      metadata,
      {
        jobId: requestId,
        priority: newLevel,
      }
    );

    // Update MongoDB log
    await this.updateQueueLevel(requestId, newLevel, metadata.queueHistory);

    logger.debug('Job ' + requestId + ' demoted from Q' + currentLevel + ' to Q' + newLevel);
  }

  /**
   * Log request to MongoDB with MLFQ fields
   */
  private async logRequest(
    request: LLMRequest,
    status: RequestStatus,
    timestamp: Date,
    queueLevel: number
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
        queueLevel,
        queueHistory: [queueLevel],
        timeSliceUsed: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    } catch (error) {
      logger.error('Failed to log request:', error);
    }
  }

  /**
   * Log response to MongoDB with MLFQ fields
   */
  private async logResponse(
    requestId: string,
    status: RequestStatus,
    response?: string,
    waitTime: number = 0,
    processingTime: number = 0,
    completedAt?: Date,
    metadata?: MLFQQueueJob,
    error?: string
  ): Promise<void> {
    try {
      await mongodbManager.connect();

      const updateData: {
        status: RequestStatus;
        response?: string;
        processingTime: number;
        waitTime: number;
        completedAt?: Date;
        error?: string;
        updatedAt: Date;
        queueLevel?: number;
        queueHistory?: number[];
        timeSliceUsed?: number;
      } = {
        status,
        response,
        processingTime,
        waitTime,
        completedAt,
        error,
        updatedAt: new Date(),
      };

      if (metadata) {
        updateData.queueLevel = metadata.queueLevel;
        updateData.queueHistory = metadata.queueHistory;
        updateData.timeSliceUsed = metadata.timeSliceUsed;
      }

      await RequestLog.updateOne(
        { requestId },
        { $set: updateData }
      );
    } catch (logError) {
      logger.error('Failed to log response:', logError);
    }
  }

  /**
   * Update queue level in MongoDB
   */
  private async updateQueueLevel(requestId: string, newLevel: number, queueHistory: number[]): Promise<void> {
    try {
      await mongodbManager.connect();

      await RequestLog.updateOne(
        { requestId },
        {
          $set: {
            queueLevel: newLevel,
            queueHistory: queueHistory,
            updatedAt: new Date(),
          },
        }
      );
    } catch (error) {
      logger.error('Failed to update queue level:', error);
    }
  }

  /**
   * Clean up job metadata
   */
  private cleanupJobMetadata(requestId: string): void {
    this.jobTimings.delete(requestId);
    this.jobMetadata.delete(requestId);
  }
}
