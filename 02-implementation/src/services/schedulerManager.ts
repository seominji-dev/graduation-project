/**
 * Scheduler Manager
 * Manages multiple schedulers and allows runtime switching
 */

import { IScheduler, SchedulerType } from '../schedulers/types';
import { FCFSScheduler } from '../schedulers/FCFSScheduler';
import { PriorityScheduler } from '../schedulers/PriorityScheduler';
import { MLFQScheduler } from '../schedulers/MLFQScheduler';
import { WFQScheduler } from '../schedulers/WFQScheduler';
import { LLMService } from './llmService';
import { createLogger } from '../utils/logger';

const logger = createLogger('SchedulerManager');

export interface SchedulerConfig {
  name: string;
  concurrency?: number;
  agingInterval?: number;
  boostInterval?: number;
}

/**
 * SchedulerManager class
 * Manages scheduler instances and provides runtime switching capability
 */
export class SchedulerManager {
  private schedulers: Map<SchedulerType, IScheduler>;
  private currentScheduler: IScheduler;
  private currentType: SchedulerType;
  private llmService: LLMService;
  private config: SchedulerConfig;

  constructor(
    llmService: LLMService,
    initialType: SchedulerType = SchedulerType.FCFS,
    config?: SchedulerConfig
  ) {
    this.llmService = llmService;
    this.schedulers = new Map();
    this.config = config || { name: 'default-queue', concurrency: 2 };

    // Initialize all schedulers
    this.initializeSchedulers();

    // Set initial scheduler
    const initial = this.schedulers.get(initialType);
    if (!initial) {
      throw new Error(`Failed to initialize scheduler: ${initialType}`);
    }
    this.currentScheduler = initial;
    this.currentType = initialType;

    logger.info(`SchedulerManager initialized with ${initialType} scheduler`);
  }

  /**
   * Initialize all available schedulers
   */
  private initializeSchedulers(): void {
    const baseConfig = {
      defaultPriority: 1,
      concurrency: this.config.concurrency || 2,
      agingInterval: this.config.agingInterval || 10000,
      boostInterval: this.config.boostInterval || 30000,
    };

    // FCFS Scheduler
    this.schedulers.set(
      SchedulerType.FCFS,
      new FCFSScheduler(
        {
          name: `${this.config.name}-fcfs`,
          ...baseConfig,
        },
        this.llmService
      )
    );

    // Priority Scheduler
    this.schedulers.set(
      SchedulerType.PRIORITY,
      new PriorityScheduler(
        {
          name: `${this.config.name}-priority`,
          ...baseConfig,
        },
        this.llmService
      )
    );

    // MLFQ Scheduler
    this.schedulers.set(
      SchedulerType.MLFQ,
      new MLFQScheduler(
        {
          name: `${this.config.name}-mlfq`,
          ...baseConfig,
        },
        this.llmService
      )
    );

    // WFQ Scheduler
    this.schedulers.set(
      SchedulerType.WFQ,
      new WFQScheduler(
        {
          name: `${this.config.name}-wfq`,
          ...baseConfig,
        },
        this.llmService
      )
    );

    logger.info(`Initialized ${this.schedulers.size} schedulers`);
  }

  /**
   * Initialize all schedulers
   */
  async initialize(): Promise<void> {
    logger.info('Initializing all schedulers...');
    const promises = Array.from(this.schedulers.values()).map((scheduler) =>
      scheduler.initialize()
    );
    await Promise.all(promises);
    logger.info('All schedulers initialized');
  }

  /**
   * Get current scheduler
   */
  getCurrentScheduler(): IScheduler {
    return this.currentScheduler;
  }

  /**
   * Get current scheduler type
   */
  getCurrentType(): SchedulerType {
    return this.currentType;
  }

  /**
   * Get scheduler by type
   */
  getScheduler(type: SchedulerType): IScheduler | undefined {
    return this.schedulers.get(type);
  }

  /**
   * Switch to a different scheduler
   * Returns true if switch was successful, false otherwise
   */
  switchScheduler(newType: SchedulerType): boolean {
    if (this.currentType === newType) {
      logger.info(`Already using ${newType} scheduler`);
      return true;
    }

    const newScheduler = this.schedulers.get(newType);
    if (!newScheduler) {
      logger.error(`Scheduler ${newType} not found`);
      return false;
    }

    logger.info(`Switching from ${this.currentType} to ${newType}...`);

    try {
      // Note: In production, you might want to:
      // 1. Wait for pending requests to complete
      // 2. Migrate pending requests to new scheduler
      // 3. Gracefully shutdown old scheduler
      //
      // For this graduation project, we do a simple switch
      this.currentScheduler = newScheduler;
      this.currentType = newType;

      logger.info(`Successfully switched to ${newType} scheduler`);
      return true;
    } catch (error) {
      logger.error(`Failed to switch scheduler: ${String(error)}`);
      return false;
    }
  }

  /**
   * Get statistics for all schedulers
   */
  async getAllStats(): Promise<Record<string, unknown>> {
    const stats: Record<string, unknown> = {
      currentType: this.currentType,
      schedulers: {},
    };

    for (const [type, scheduler] of this.schedulers.entries()) {
      try {
        const schedulerStats = await scheduler.getStats();
        (stats.schedulers as Record<string, unknown>)[type] = schedulerStats;
      } catch (error) {
        logger.error(`Failed to get stats for ${type}: ${String(error)}`);
        (stats.schedulers as Record<string, unknown>)[type] = { error: String(error) };
      }
    }

    return stats;
  }

  /**
   * Shutdown all schedulers
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down all schedulers...');
    const promises = Array.from(this.schedulers.values()).map((scheduler) =>
      scheduler.shutdown()
    );
    await Promise.all(promises);
    logger.info('All schedulers shut down');
  }

  /**
   * Get available scheduler types
   */
  getAvailableTypes(): SchedulerType[] {
    return Array.from(this.schedulers.keys());
  }
}
