/**
 * WFQ (Weighted Fair Queuing) Scheduler
 *
 * Implements Weighted Fair Queuing for multi-tenant LLM request scheduling.
 * Uses virtual time to approximate GPS (Generalized Processor Sharing).
 *
 * SPEC-SCHED-004: WFQ implementation with per-tenant queues and weights
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
import { TenantRegistry, TenantTier, DEFAULT_WEIGHTS } from '../managers/TenantRegistry';
import { VirtualTimeTracker, VirtualFinishTime } from '../managers/VirtualTimeTracker';
import { FairnessCalculator } from '../managers/FairnessCalculator';

const DEFAULT_ESTIMATED_SERVICE_TIME = 5000;

interface WFQStats extends SchedulerStats {
  tenantCount: number;
  fairnessMetrics: {
    jainsFairnessIndex: number;
    fairnessScore: number;
    activeTenants: number;
  };
}

interface WFQQueueJob extends QueueJob {
  tenantId: string;
  weight: number;
  virtualFinishTime: VirtualFinishTime;
}

export class WFQScheduler implements IScheduler {
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private llmService: LLMService;
  private config: Required<SchedulerConfig>;

  private tenantRegistry: TenantRegistry;
  private virtualTimeTracker: VirtualTimeTracker;
  private fairnessCalculator: FairnessCalculator;

  private jobTimings: Map<string, { queued: Date; started?: Date }> = new Map();
  private jobMetadata: Map<string, WFQQueueJob> = new Map();
  private activeTenantWeights: Map<string, number> = new Map();

  constructor(config: SchedulerConfig, llmService: LLMService) {
    this.config = {
      name: config.name,
      defaultPriority: config.defaultPriority ?? RequestPriority.NORMAL,
      concurrency: config.concurrency ?? 1,
    };
    this.llmService = llmService;

    this.tenantRegistry = new TenantRegistry();
    this.virtualTimeTracker = new VirtualTimeTracker();
    this.fairnessCalculator = new FairnessCalculator();

    this.tenantRegistry.initializeDefaultTenants();
  }

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
      async (job: Job<WFQQueueJob>) => {
        return await this.processJob(job);
      },
      {
        connection: bullmqConnection,
        concurrency: this.config.concurrency,
      }
    );

    this.worker.on('completed', (job: Job<WFQQueueJob>) => {
      console.log('Job ' + job.id + ' completed');
      this.cleanupJobMetadata(job.data.requestId);
    });

    this.worker.on('failed', (job: Job<WFQQueueJob> | undefined, error: Error) => {
      console.error('Job ' + (job?.id || 'unknown') + ' failed:', error);
      if (job) {
        this.cleanupJobMetadata(job.data.requestId);
      }
    });

    console.log('WFQ Scheduler "' + this.config.name + '" initialized with ' +
      this.tenantRegistry.getTenantCount() + ' tenants');
    return Promise.resolve();
  }

  async submit(request: LLMRequest): Promise<string> {
    if (!this.queue) {
      throw new Error('Scheduler not initialized');
    }

    const queuedAt = new Date();
    this.jobTimings.set(request.id, { queued: queuedAt });

    const tenantId = (request.metadata?.tenantId as string) || 'default';
    const tenant = this.tenantRegistry.getTenant(tenantId) ||
                   this.tenantRegistry.getOrCreateDefaultTenant();

    const weight = tenant.weight;

    const estimatedServiceTime = request.metadata?.estimatedServiceTime as number ||
                                  DEFAULT_ESTIMATED_SERVICE_TIME;

    const virtualFinishTime = this.virtualTimeTracker.calculateVirtualFinishTime(
      request.id,
      tenantId,
      estimatedServiceTime,
      weight
    );

    const wfqJobData: WFQQueueJob = {
      requestId: request.id,
      prompt: request.prompt,
      provider: request.provider,
      priority: request.priority,
      attempts: 0,
      tenantId,
      weight,
      virtualFinishTime,
    };

    this.jobMetadata.set(request.id, wfqJobData);

    const job = await this.queue.add(
      'llm-request-' + request.id,
      wfqJobData,
      {
        jobId: request.id,
        priority: Math.floor(virtualFinishTime.virtualFinishTime),
      }
    );

    await this.logRequest(request, RequestStatus.QUEUED, queuedAt, tenantId, weight, virtualFinishTime);

    return job.id ?? request.id;
  }

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

  async cancel(requestId: string): Promise<boolean> {
    if (!this.queue) {
      throw new Error('Scheduler not initialized');
    }

    const job = await this.queue.getJob(requestId);
    if (!job) {
      return false;
    }

    await job.remove();
    this.cleanupJobMetadata(requestId);
    return true;
  }

  async getStats(): Promise<WFQStats> {
    if (!this.queue) {
      throw new Error('Scheduler not initialized');
    }

    const counts = await this.queue.getJobCounts();
    const fairnessMetrics = this.fairnessCalculator.getFairnessMetrics();

    return {
      name: this.config.name,
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
      delayed: counts.delayed ?? 0,
      paused: await this.queue.isPaused(),
      tenantCount: this.tenantRegistry.getTenantCount(),
      fairnessMetrics: {
        jainsFairnessIndex: fairnessMetrics.jainsFairnessIndex,
        fairnessScore: fairnessMetrics.fairnessScore,
        activeTenants: this.fairnessCalculator.getActiveTenantCount(),
      },
    };
  }

  async pause(): Promise<void> {
    if (!this.queue) {
      throw new Error('Scheduler not initialized');
    }
    await this.queue.pause();
  }

  async resume(): Promise<void> {
    if (!this.queue) {
      throw new Error('Scheduler not initialized');
    }
    await this.queue.resume();
  }

  async shutdown(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
    }
    console.log('WFQ Scheduler "' + this.config.name + '" shut down');
    return Promise.resolve();
  }

  private async processJob(job: Job<WFQQueueJob>): Promise<string> {
    const { requestId, prompt, provider, tenantId, weight } = job.data;
    const startedAt = new Date();

    const timing = this.jobTimings.get(requestId);
    if (timing) {
      timing.started = startedAt;
    }

    const waitTime = startedAt.getTime() - (timing?.queued.getTime() || startedAt.getTime());

    this.activeTenantWeights.set(tenantId, weight);
    const activeWeightSum = this.getActiveWeightSum();

    try {
      const response = await this.llmService.process(prompt, provider);
      const completedAt = new Date();
      const processingTime = completedAt.getTime() - startedAt.getTime();

      this.virtualTimeTracker.updateVirtualTime(processingTime, activeWeightSum);
      this.fairnessCalculator.recordRequestCompletion(tenantId, processingTime, waitTime);

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

      this.virtualTimeTracker.updateVirtualTime(processingTime, activeWeightSum);

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
    } finally {
      this.activeTenantWeights.delete(tenantId);
    }
  }

  private getActiveWeightSum(): number {
    let sum = 0;
    for (const weight of this.activeTenantWeights.values()) {
      sum += weight;
    }
    return sum;
  }

  private async logRequest(
    request: LLMRequest,
    status: RequestStatus,
    timestamp: Date,
    tenantId: string,
    weight: number,
    virtualFinishTime: VirtualFinishTime
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
        tenantId,
        weight,
        virtualTime: virtualFinishTime.virtualFinishTime,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    } catch (error) {
      console.error('Failed to log request:', error);
    }
  }

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

  private cleanupJobMetadata(requestId: string): void {
    this.jobTimings.delete(requestId);
    this.jobMetadata.delete(requestId);
    this.virtualTimeTracker.removeVirtualFinishTime(requestId);
  }

  getTenantRegistry(): TenantRegistry {
    return this.tenantRegistry;
  }

  getFairnessCalculator(): FairnessCalculator {
    return this.fairnessCalculator;
  }

  getVirtualTimeTracker(): VirtualTimeTracker {
    return this.virtualTimeTracker;
  }

  getFairnessReport(): string {
    return this.fairnessCalculator.generateFairnessReport();
  }

  addTenant(
    tenantId: string,
    name: string,
    tier: TenantTier,
    customWeight?: number
  ): void {
    const weight = customWeight ?? DEFAULT_WEIGHTS[tier];
    this.tenantRegistry.registerTenant({
      id: tenantId,
      name,
      tier,
      weight,
    });
  }

  updateTenantWeight(tenantId: string, newWeight: number): boolean {
    return this.tenantRegistry.updateTenantWeight(tenantId, newWeight);
  }

  updateTenantTier(tenantId: string, newTier: TenantTier): boolean {
    return this.tenantRegistry.updateTenantTier(tenantId, newTier);
  }

  getAllTenants() {
    return this.tenantRegistry.getAllTenants();
  }

  getTenantStats(tenantId: string) {
    return this.fairnessCalculator.getTenantStats(tenantId);
  }

  getAllTenantStats() {
    return this.fairnessCalculator.getAllTenantStats();
  }

  resetFairnessStats(): void {
    this.fairnessCalculator.reset();
  }
}
