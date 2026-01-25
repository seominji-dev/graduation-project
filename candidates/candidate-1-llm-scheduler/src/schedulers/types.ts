/**
 * Scheduler Interface and Types
 * Defines the contract for all scheduling algorithms
 */

import { Queue } from 'bullmq';
import { LLMRequest, QueueJob } from '../domain/models';

// Scheduler Configuration
export interface SchedulerConfig {
  name: string;
  defaultPriority?: number;
  concurrency?: number;
}

// Scheduler Metrics
export interface SchedulerStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

// Base Scheduler Interface
export interface IScheduler {
  /**
   * Initialize the scheduler
   */
  initialize(): Promise<void>;

  /**
   * Submit a request to the queue (REQ-SCHED-101: Queue and return ID)
   */
  submit(request: LLMRequest): Promise<string>;

  /**
   * Get request status
   */
  getStatus(requestId: string): Promise<string>;

  /**
   * Cancel a request
   */
  cancel(requestId: string): Promise<boolean>;

  /**
   * Get scheduler statistics
   */
  getStats(): Promise<SchedulerStats>;

  /**
   * Pause processing
   */
  pause(): Promise<void>;

  /**
   * Resume processing
   */
  resume(): Promise<void>;

  /**
   * Shutdown scheduler
   */
  shutdown(): Promise<void>;
}

// LLM Processor Function Type
export type LLMProcessor = (job: QueueJob) => Promise<string>;
