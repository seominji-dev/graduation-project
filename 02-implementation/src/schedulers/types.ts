/**
 * Scheduler Interface and Types
 * Defines the contract for all scheduling algorithms
 */

import type { Queue as _Queue } from 'bullmq';
import { LLMRequest, QueueJob } from '../domain/models';

// Scheduler Type Enum
export enum SchedulerType {
  FCFS = 'FCFS',
  PRIORITY = 'PRIORITY',
  MLFQ = 'MLFQ',
  WFQ = 'WFQ',
}

// Scheduler Configuration
export interface SchedulerConfig {
  name: string;
  defaultPriority?: number;
  concurrency?: number;
  agingInterval?: number; // For Priority scheduler
  boostInterval?: number; // For MLFQ scheduler
}

// Extended config types for specific schedulers
export type FCFSSchedulerConfig = Required<Pick<SchedulerConfig, 'name' | 'defaultPriority' | 'concurrency'>> &
  Partial<Pick<SchedulerConfig, 'agingInterval' | 'boostInterval'>>;

export type PrioritySchedulerConfig = Required<Pick<SchedulerConfig, 'name' | 'defaultPriority' | 'concurrency' | 'agingInterval'>> &
  Partial<Pick<SchedulerConfig, 'boostInterval'>>;

export type MLFQSchedulerConfig = Required<Pick<SchedulerConfig, 'name' | 'defaultPriority' | 'concurrency' | 'boostInterval'>> &
  Partial<Pick<SchedulerConfig, 'agingInterval'>>;

export type WFQSchedulerConfig = Required<Pick<SchedulerConfig, 'name' | 'defaultPriority' | 'concurrency'>> &
  Partial<Pick<SchedulerConfig, 'agingInterval' | 'boostInterval'>>;

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
