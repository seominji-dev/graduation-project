/**
 * BullMQ Mock for Testing
 */

import { EventEmitter } from 'events';

const jobStore = new Map<string, Map<string, any>>();

export class Queue extends EventEmitter {
  name: string;
  private jobs: Map<string, any>;

  constructor(name: string, opts?: any) {
    super();
    this.name = name;
    if (!jobStore.has(name)) {
      jobStore.set(name, new Map());
    }
    this.jobs = jobStore.get(name)!;
  }

  async add(jobName: string, data: any, opts?: any): Promise<any> {
    const jobId = opts?.jobId || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const job: any = {
      id: jobId,
      name: jobName,
      data,
      opts,
      progress: 0,
      returnvalue: null as string | null,
      failedReason: null as string | null,
      attemptsMade: 0,
      timestamp: Date.now(),
    };
    job.remove = async () => { this.jobs.delete(jobId); };
    job.moveToCompleted = async (returnValue: any) => { job.returnvalue = returnValue; };
    job.moveToFailed = async (err: Error) => { job.failedReason = err.message; };
    this.jobs.set(jobId, job);
    return job;
  }

  async getJob(jobId: string): Promise<any> {
    return this.jobs.get(jobId) || null;
  }

  async getJobs(types?: string[], start?: number, end?: number): Promise<any[]> {
    return Array.from(this.jobs.values()).slice(start || 0, end || 100);
  }

  async getJobCounts(): Promise<any> {
    return { waiting: this.jobs.size, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 };
  }

  async pause(): Promise<void> {}
  async resume(): Promise<void> {}
  async isPaused(): Promise<boolean> { return false; }
  async close(): Promise<void> { this.jobs.clear(); }
  async obliterate(): Promise<void> { this.jobs.clear(); }
}

export class Worker extends EventEmitter {
  name: string;
  private running: boolean = false;

  constructor(name: string, processor: Function, opts?: any) {
    super();
    this.name = name;
    this.running = true;
  }

  async close(): Promise<void> { this.running = false; this.removeAllListeners(); }
  async pause(): Promise<void> { this.running = false; }
  async resume(): Promise<void> { this.running = true; }
  isRunning(): boolean { return this.running; }
}

export class QueueEvents extends EventEmitter {
  constructor(name: string, opts?: any) { super(); }
  async close(): Promise<void> { this.removeAllListeners(); }
}

export function resetAllQueues(): void { jobStore.clear(); }
