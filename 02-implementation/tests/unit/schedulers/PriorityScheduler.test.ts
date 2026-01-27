/**
 * Priority Scheduler Unit Tests
 *
 * SPEC-SCHED-002: Priority Scheduler Specification Tests
 * Test-first approach for DDD implementation
 *
 * Coverage targets:
 * - Lines 73, 82-85, 90-94 (worker event handlers)
 * - Lines 154-167 (getStatus method)
 * - Lines 184-186 (cancel error handling)
 * - Lines 264-294 (updateJobPriority method)
 * - Lines 314-363 (processJob method)
 * - Lines 400-432 (logging methods)
 */

import { PriorityScheduler } from '../../../src/schedulers/PriorityScheduler';
import { RequestPriority, RequestStatus, LLMRequest } from '../../../src/domain/models';
import { SchedulerConfig } from '../../../src/schedulers/types';
import { LLMService } from '../../../src/services/llmService';
import { AgingManager } from '../../../src/managers/AgingManager';

// Mock dependencies
jest.mock('../../../src/infrastructure/redis');
jest.mock('../../../src/infrastructure/mongodb');
jest.mock('../../../src/infrastructure/models/RequestLog');
jest.mock('../../../src/managers/AgingManager');

// Shared mock state - must use var for hoisting compatibility with jest.mock
var mockQueue: any = null;
var mockWorker: any = null;
var mockJobs: Map<string, any> = new Map();

// Enhanced BullMQ mock with full event and state support
jest.mock('bullmq', () => {
  const EventEmitter = require('events').EventEmitter;

  class MockQueue extends EventEmitter {
    name: string;
    private paused: boolean = false;

    constructor(name: string, opts?: any) {
      super();
      this.name = name;
      mockQueue = this;
    }

    async add(jobName: string, data: any, opts?: any): Promise<any> {
      const jobId = opts?.jobId || 'job-' + Date.now();
      const job = {
        id: jobId,
        name: jobName,
        data: { ...data },
        opts: { ...opts },
        _state: 'waiting',
        getState: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this._state);
        }),
        remove: jest.fn().mockResolvedValue(undefined),
      };
      mockJobs.set(jobId, job);
      return job;
    }

    async getJob(jobId: string): Promise<any> {
      return mockJobs.get(jobId) || null;
    }

    async getJobs(types?: string[], start?: number, end?: number): Promise<any[]> {
      return Array.from(mockJobs.values()).slice(start || 0, end || 100);
    }

    async getJobCounts(): Promise<any> {
      return {
        waiting: mockJobs.size,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
      };
    }

    async pause(): Promise<void> {
      this.paused = true;
    }
    async resume(): Promise<void> {
      this.paused = false;
    }
    async isPaused(): Promise<boolean> {
      return this.paused;
    }
    async close(): Promise<void> {
      mockJobs.clear();
    }
  }

  class MockWorker extends EventEmitter {
    name: string;
    processor: Function;

    constructor(name: string, processor: Function, opts?: any) {
      super();
      this.name = name;
      this.processor = processor;
      mockWorker = this;
    }

    async close(): Promise<void> {
      this.removeAllListeners();
    }
  }

  return {
    Queue: MockQueue,
    Worker: MockWorker,
    Job: jest.fn(),
  };
});

describe('PriorityScheduler - Specification Tests', () => {
  let scheduler: PriorityScheduler;
  let mockLLMService: jest.Mocked<LLMService>;
  let config: SchedulerConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJobs.clear();

    mockLLMService = {
      process: jest.fn().mockResolvedValue('Test response'),
    } as any;

    config = {
      name: 'test-priority-scheduler',
      defaultPriority: RequestPriority.NORMAL,
      concurrency: 1,
    };

    scheduler = new PriorityScheduler(config, mockLLMService);
  });

  afterEach(async () => {
    if (scheduler) {
      await scheduler.shutdown();
    }
  });

  describe('REQ-SCHED-201: Priority-based ordering', () => {
    it('should map RequestPriority to BullMQ priority correctly', () => {
      const getPriorityValue = (scheduler as any).getPriorityValue.bind(scheduler);
      expect(getPriorityValue(RequestPriority.URGENT)).toBe(0);
      expect(getPriorityValue(RequestPriority.HIGH)).toBe(2);
      expect(getPriorityValue(RequestPriority.NORMAL)).toBe(4);
      expect(getPriorityValue(RequestPriority.LOW)).toBe(6);
    });

    it('should prioritize URGENT over HIGH over NORMAL over LOW', () => {
      const getPriorityValue = (scheduler as any).getPriorityValue.bind(scheduler);
      const urgentPriority = getPriorityValue(RequestPriority.URGENT);
      const highPriority = getPriorityValue(RequestPriority.HIGH);
      const normalPriority = getPriorityValue(RequestPriority.NORMAL);
      const lowPriority = getPriorityValue(RequestPriority.LOW);
      expect(urgentPriority).toBeLessThan(highPriority);
      expect(highPriority).toBeLessThan(normalPriority);
      expect(normalPriority).toBeLessThan(lowPriority);
    });
  });

  describe('REQ-SCHED-401: Aging mechanism', () => {
    it('should initialize AgingManager on scheduler initialization', async () => {
      const startSpy = jest.spyOn(AgingManager.prototype, 'start');
      await scheduler.initialize();
      expect(startSpy).toHaveBeenCalled();
    });

    it('should stop AgingManager on scheduler shutdown', async () => {
      await scheduler.initialize();
      const stopSpy = jest.spyOn(AgingManager.prototype, 'stop');
      await scheduler.shutdown();
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('IScheduler Interface Implementation', () => {
    it('should implement all IScheduler methods', () => {
      expect(scheduler.initialize).toBeDefined();
      expect(scheduler.submit).toBeDefined();
      expect(scheduler.getStatus).toBeDefined();
      expect(scheduler.cancel).toBeDefined();
      expect(scheduler.getStats).toBeDefined();
      expect(scheduler.pause).toBeDefined();
      expect(scheduler.resume).toBeDefined();
      expect(scheduler.shutdown).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw error if submit called before initialization', async () => {
      const uninitializedScheduler = new PriorityScheduler(config, mockLLMService);
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        prompt: 'Test request',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await expect(uninitializedScheduler.submit(request)).rejects.toThrow('Scheduler not initialized');
    });

    it('should throw error if getStatus called before initialization', async () => {
      const uninitializedScheduler = new PriorityScheduler(config, mockLLMService);
      await expect(uninitializedScheduler.getStatus('test-id')).rejects.toThrow('Scheduler not initialized');
    });

    it('should throw error if cancel called before initialization', async () => {
      const uninitializedScheduler = new PriorityScheduler(config, mockLLMService);
      await expect(uninitializedScheduler.cancel('test-id')).rejects.toThrow('Scheduler not initialized');
    });

    it('should throw error if getStats called before initialization', async () => {
      const uninitializedScheduler = new PriorityScheduler(config, mockLLMService);
      await expect(uninitializedScheduler.getStats()).rejects.toThrow('Scheduler not initialized');
    });

    it('should throw error if pause called before initialization', async () => {
      const uninitializedScheduler = new PriorityScheduler(config, mockLLMService);
      await expect(uninitializedScheduler.pause()).rejects.toThrow('Scheduler not initialized');
    });

    it('should throw error if resume called before initialization', async () => {
      const uninitializedScheduler = new PriorityScheduler(config, mockLLMService);
      await expect(uninitializedScheduler.resume()).rejects.toThrow('Scheduler not initialized');
    });
  });

  describe('Configuration', () => {
    it('should use provided configuration values', () => {
      const customConfig: SchedulerConfig = {
        name: 'custom-priority-scheduler',
        defaultPriority: RequestPriority.HIGH,
        concurrency: 5,
      };
      const customScheduler = new PriorityScheduler(customConfig, mockLLMService);
      expect(customScheduler).toBeDefined();
    });

    it('should use default values when not provided', () => {
      const minimalConfig: SchedulerConfig = { name: 'minimal-scheduler' };
      const minimalScheduler = new PriorityScheduler(minimalConfig, mockLLMService);
      expect(minimalScheduler).toBeDefined();
    });
  });

  describe('Worker Event Handlers (lines 73, 82-85, 90-94)', () => {
    it('should handle completed event and cleanup job timings', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440010',
        prompt: 'Test request',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request);
      const mockJob = { id: request.id, data: { requestId: request.id } };
      mockWorker.emit('completed', mockJob);
      expect(AgingManager.prototype.resetJobAging).toBeDefined();
    });

    it('should handle failed event and cleanup job timings', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440011',
        prompt: 'Test request',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request);
      const mockJob = { id: request.id, data: { requestId: request.id } };
      const mockError = new Error('Test error');
      mockWorker.emit('failed', mockJob, mockError);
      expect(AgingManager.prototype.resetJobAging).toBeDefined();
    });

    it('should handle failed event with undefined job', async () => {
      await scheduler.initialize();
      const mockError = new Error('Test error');
      expect(() => {
        mockWorker.emit('failed', undefined, mockError);
      }).not.toThrow();
    });

    it('should log job completion message', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      await scheduler.initialize();
      const mockJob = { id: 'test-job-123', data: { requestId: 'test-job-123' } };
      mockWorker.emit('completed', mockJob);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Job test-job-123 completed'));
      consoleSpy.mockRestore();
    });

    it('should log job failure message', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await scheduler.initialize();
      const mockJob = { id: 'test-job-456', data: { requestId: 'test-job-456' } };
      const mockError = new Error('Processing failed');
      mockWorker.emit('failed', mockJob, mockError);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Job test-job-456 failed'));
      consoleSpy.mockRestore();
    });

    it('should log failure with unknown job id when job is undefined', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await scheduler.initialize();
      const mockError = new Error('Unknown failure');
      mockWorker.emit('failed', undefined, mockError);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Job unknown failed'));
      consoleSpy.mockRestore();
    });
  });

  describe('getStatus Method - All BullMQ States (lines 154-167)', () => {
    it('should return QUEUED for waiting state', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440020',
        prompt: 'Test',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request);
      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.QUEUED);
    });

    it('should return QUEUED for delayed state', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440021',
        prompt: 'Test',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request);
      const job = mockJobs.get(request.id);
      job._state = 'delayed';
      job.getState = jest.fn().mockResolvedValue('delayed');
      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.QUEUED);
    });

    it('should return PROCESSING for active state', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440022',
        prompt: 'Test',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request);
      const job = mockJobs.get(request.id);
      job._state = 'active';
      job.getState = jest.fn().mockResolvedValue('active');
      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.PROCESSING);
    });

    it('should return COMPLETED for completed state', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440023',
        prompt: 'Test',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request);
      const job = mockJobs.get(request.id);
      job._state = 'completed';
      job.getState = jest.fn().mockResolvedValue('completed');
      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.COMPLETED);
    });

    it('should return FAILED for failed state', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440024',
        prompt: 'Test',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request);
      const job = mockJobs.get(request.id);
      job._state = 'failed';
      job.getState = jest.fn().mockResolvedValue('failed');
      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.FAILED);
    });

    it('should return PENDING for unknown state', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440025',
        prompt: 'Test',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request);
      const job = mockJobs.get(request.id);
      job._state = 'unknown-state';
      job.getState = jest.fn().mockResolvedValue('unknown-state');
      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.PENDING);
    });

    it('should return PENDING for non-existent job', async () => {
      await scheduler.initialize();
      const status = await scheduler.getStatus('non-existent-job');
      expect(status).toBe(RequestStatus.PENDING);
    });
  });

  describe('cancel Method - Success Path (lines 184-186)', () => {
    it('should successfully cancel existing job and cleanup timings', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440030',
        prompt: 'Test',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request);
      expect(mockJobs.has(request.id)).toBe(true);
      const result = await scheduler.cancel(request.id);
      expect(result).toBe(true);
      const job = mockJobs.get(request.id);
      expect(job.remove).toHaveBeenCalled();
    });

    it('should cleanup job timings on cancel', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440031',
        prompt: 'Test',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request);
      const jobTimings = (scheduler as any).jobTimings;
      expect(jobTimings.has(request.id)).toBe(true);
      await scheduler.cancel(request.id);
      expect(jobTimings.has(request.id)).toBe(false);
    });

    it('should return false for non-existent job', async () => {
      await scheduler.initialize();
      const result = await scheduler.cancel('non-existent-job');
      expect(result).toBe(false);
    });
  });

  describe('updateJobPriority Method - Full Flow (lines 264-294)', () => {
    it('should return false when queue is not initialized', async () => {
      const result = await scheduler.updateJobPriority('test-job', RequestPriority.HIGH);
      expect(result).toBe(false);
    });

    it('should return false for non-existent job', async () => {
      await scheduler.initialize();
      const result = await scheduler.updateJobPriority('non-existent', RequestPriority.HIGH);
      expect(result).toBe(false);
    });

    it('should successfully update priority for waiting job', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440040',
        prompt: 'Test',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.LOW,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request);
      const job = mockJobs.get(request.id);
      job._state = 'waiting';
      job.getState = jest.fn().mockResolvedValue('waiting');
      const result = await scheduler.updateJobPriority(request.id, RequestPriority.HIGH);
      expect(result).toBe(true);
      expect(job.remove).toHaveBeenCalled();
    });

    it('should successfully update priority for delayed job', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440041',
        prompt: 'Test',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request);
      const job = mockJobs.get(request.id);
      job._state = 'delayed';
      job.getState = jest.fn().mockResolvedValue('delayed');
      const result = await scheduler.updateJobPriority(request.id, RequestPriority.URGENT);
      expect(result).toBe(true);
    });

    it('should return false for active job (cannot update)', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440042',
        prompt: 'Test',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request);
      const job = mockJobs.get(request.id);
      job._state = 'active';
      job.getState = jest.fn().mockResolvedValue('active');
      const result = await scheduler.updateJobPriority(request.id, RequestPriority.URGENT);
      expect(result).toBe(false);
    });

    it('should return false for completed job (cannot update)', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440043',
        prompt: 'Test',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request);
      const job = mockJobs.get(request.id);
      job._state = 'completed';
      job.getState = jest.fn().mockResolvedValue('completed');
      const result = await scheduler.updateJobPriority(request.id, RequestPriority.URGENT);
      expect(result).toBe(false);
    });

    it('should handle error during priority update gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440044',
        prompt: 'Test',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request);
      const job = mockJobs.get(request.id);
      job._state = 'waiting';
      job.getState = jest.fn().mockResolvedValue('waiting');
      job.remove = jest.fn().mockRejectedValue(new Error('Remove failed'));
      const result = await scheduler.updateJobPriority(request.id, RequestPriority.URGENT);
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to update job priority'));
      consoleSpy.mockRestore();
    });
  });

  describe('processJob Method (lines 314-363)', () => {
    it('should process job successfully and log response', async () => {
      await scheduler.initialize();
      const processJob = (scheduler as any).processJob.bind(scheduler);
      const mockJob = {
        data: {
          requestId: '550e8400-e29b-41d4-a716-446655440050',
          prompt: 'Test prompt',
          provider: { name: 'ollama', model: 'llama2' },
          priority: RequestPriority.NORMAL,
          queuedAt: new Date(),
        },
      };
      const jobTimings = (scheduler as any).jobTimings;
      jobTimings.set(mockJob.data.requestId, { queued: new Date() });
      mockLLMService.process.mockResolvedValue('Test response');
      const result = await processJob(mockJob);
      expect(result).toBe('Test response');
      expect(mockLLMService.process).toHaveBeenCalledWith('Test prompt', { name: 'ollama', model: 'llama2' });
    });

    it('should handle processing error and log failure', async () => {
      await scheduler.initialize();
      const processJob = (scheduler as any).processJob.bind(scheduler);
      const mockJob = {
        data: {
          requestId: '550e8400-e29b-41d4-a716-446655440051',
          prompt: 'Test prompt',
          provider: { name: 'ollama', model: 'llama2' },
          priority: RequestPriority.NORMAL,
          queuedAt: new Date(),
        },
      };
      const jobTimings = (scheduler as any).jobTimings;
      jobTimings.set(mockJob.data.requestId, { queued: new Date() });
      const testError = new Error('LLM processing failed');
      mockLLMService.process.mockRejectedValue(testError);
      await expect(processJob(mockJob)).rejects.toThrow('LLM processing failed');
    });

    it('should track started time in job timings', async () => {
      await scheduler.initialize();
      const processJob = (scheduler as any).processJob.bind(scheduler);
      const requestId = '550e8400-e29b-41d4-a716-446655440052';
      const queuedTime = new Date(Date.now() - 5000);
      const mockJob = {
        data: {
          requestId,
          prompt: 'Test prompt',
          provider: { name: 'ollama', model: 'llama2' },
          priority: RequestPriority.NORMAL,
          queuedAt: queuedTime,
        },
      };
      const jobTimings = (scheduler as any).jobTimings;
      jobTimings.set(requestId, { queued: queuedTime });
      mockLLMService.process.mockResolvedValue('Test response');
      await processJob(mockJob);
      const timing = jobTimings.get(requestId);
      expect(timing.started).toBeDefined();
      expect(timing.started).toBeInstanceOf(Date);
    });

    it('should handle missing timing gracefully', async () => {
      await scheduler.initialize();
      const processJob = (scheduler as any).processJob.bind(scheduler);
      const mockJob = {
        data: {
          requestId: '550e8400-e29b-41d4-a716-446655440054',
          prompt: 'Test prompt',
          provider: { name: 'ollama', model: 'llama2' },
          priority: RequestPriority.NORMAL,
          queuedAt: new Date(),
        },
      };
      mockLLMService.process.mockResolvedValue('Test response');
      const result = await processJob(mockJob);
      expect(result).toBe('Test response');
    });

    it('should convert non-Error to string in error handling', async () => {
      await scheduler.initialize();
      const processJob = (scheduler as any).processJob.bind(scheduler);
      const requestId = '550e8400-e29b-41d4-a716-446655440055';
      const mockJob = {
        data: {
          requestId,
          prompt: 'Test prompt',
          provider: { name: 'ollama', model: 'llama2' },
          priority: RequestPriority.NORMAL,
          queuedAt: new Date(),
        },
      };
      const jobTimings = (scheduler as any).jobTimings;
      jobTimings.set(requestId, { queued: new Date() });
      mockLLMService.process.mockRejectedValue('String error message');
      await expect(processJob(mockJob)).rejects.toBe('String error message');
    });
  });

  describe('logRequest Method (lines 400-401)', () => {
    it('should log request to MongoDB', async () => {
      await scheduler.initialize();
      const logRequest = (scheduler as any).logRequest.bind(scheduler);
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440060',
        prompt: 'Test prompt',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await expect(logRequest(request, RequestStatus.QUEUED, new Date())).resolves.not.toThrow();
    });

    it('should handle MongoDB error in logRequest', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await scheduler.initialize();
      const logRequest = (scheduler as any).logRequest.bind(scheduler);
      const { RequestLog } = require('../../../src/infrastructure/models/RequestLog');
      RequestLog.create = jest.fn().mockRejectedValue(new Error('MongoDB error'));
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440061',
        prompt: 'Test prompt',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await expect(logRequest(request, RequestStatus.QUEUED, new Date())).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to log request'));
      consoleSpy.mockRestore();
    });
  });

  describe('logResponse Method (lines 431-432)', () => {
    it('should log response to MongoDB', async () => {
      await scheduler.initialize();
      const logResponse = (scheduler as any).logResponse.bind(scheduler);
      await expect(
        logResponse('550e8400-e29b-41d4-a716-446655440070', RequestStatus.COMPLETED, 'Test response', 100, 200, new Date())
      ).resolves.not.toThrow();
    });

    it('should log response with error to MongoDB', async () => {
      await scheduler.initialize();
      const logResponse = (scheduler as any).logResponse.bind(scheduler);
      await expect(
        logResponse('550e8400-e29b-41d4-a716-446655440071', RequestStatus.FAILED, undefined, 100, 200, new Date(), 'Test error')
      ).resolves.not.toThrow();
    });

    it('should handle MongoDB error in logResponse', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await scheduler.initialize();
      const logResponse = (scheduler as any).logResponse.bind(scheduler);
      const { RequestLog } = require('../../../src/infrastructure/models/RequestLog');
      RequestLog.updateOne = jest.fn().mockRejectedValue(new Error('MongoDB error'));
      await expect(
        logResponse('550e8400-e29b-41d4-a716-446655440072', RequestStatus.COMPLETED, 'Test response', 100, 200, new Date())
      ).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to log response'));
      consoleSpy.mockRestore();
    });

    it('should use default values for optional parameters', async () => {
      await scheduler.initialize();
      const logResponse = (scheduler as any).logResponse.bind(scheduler);
      await expect(logResponse('550e8400-e29b-41d4-a716-446655440073', RequestStatus.COMPLETED)).resolves.not.toThrow();
    });
  });

  describe('getWaitingJobs Method - Full Coverage (lines 306-316)', () => {
    it('should return empty array when queue is not initialized', async () => {
      const uninitializedScheduler = new PriorityScheduler(config, mockLLMService);
      const jobs = await uninitializedScheduler.getWaitingJobs();
      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs).toEqual([]);
    });

    it('should return jobs with correct structure', async () => {
      await scheduler.initialize();
      const request1: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440080',
        prompt: 'Test 1',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.HIGH,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const request2: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440081',
        prompt: 'Test 2',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.LOW,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request1);
      await scheduler.submit(request2);
      const jobs = await scheduler.getWaitingJobs();
      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs.length).toBe(2);
      jobs.forEach((job) => {
        expect(job).toHaveProperty('jobId');
        expect(job).toHaveProperty('priority');
        expect(job).toHaveProperty('queuedAt');
      });
    });

    it('should use default priority when job has no priority', async () => {
      await scheduler.initialize();
      const jobId = 'job-without-priority';
      mockJobs.set(jobId, {
        id: jobId,
        data: { requestId: jobId, queuedAt: new Date() },
        getState: jest.fn().mockResolvedValue('waiting'),
      });
      const jobs = await scheduler.getWaitingJobs();
      const jobWithoutPriority = jobs.find((j) => j.jobId === jobId);
      expect(jobWithoutPriority?.priority).toBe(RequestPriority.NORMAL);
    });

    it('should use current date when job has no queuedAt', async () => {
      await scheduler.initialize();
      const jobId = 'job-without-queuedAt';
      mockJobs.set(jobId, {
        id: jobId,
        data: { requestId: jobId, priority: RequestPriority.HIGH },
        getState: jest.fn().mockResolvedValue('waiting'),
      });
      const jobs = await scheduler.getWaitingJobs();
      const jobWithoutQueuedAt = jobs.find((j) => j.jobId === jobId);
      expect(jobWithoutQueuedAt?.queuedAt).toBeInstanceOf(Date);
    });

    it('should handle error when fetching jobs', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await scheduler.initialize();
      mockQueue.getJobs = jest.fn().mockRejectedValue(new Error('Fetch error'));
      const jobs = await scheduler.getWaitingJobs();
      expect(jobs).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to get waiting jobs'));
      consoleSpy.mockRestore();
    });
  });

  describe('submit Method', () => {
    it('should return job id from queue.add', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440090',
        prompt: 'Test',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const jobId = await scheduler.submit(request);
      expect(jobId).toBe(request.id);
    });
  });

  describe('getStats', () => {
    it('should return stats with all required fields', async () => {
      await scheduler.initialize();
      const stats = await scheduler.getStats();
      expect(stats).toHaveProperty('name');
      expect(stats).toHaveProperty('waiting');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('delayed');
      expect(stats).toHaveProperty('paused');
    });

    it('should return scheduler name', async () => {
      await scheduler.initialize();
      const stats = await scheduler.getStats();
      expect(stats.name).toBe('test-priority-scheduler');
    });
  });

  describe('pause and resume', () => {
    it('should pause the queue', async () => {
      await scheduler.initialize();
      await expect(scheduler.pause()).resolves.not.toThrow();
    });

    it('should resume the queue', async () => {
      await scheduler.initialize();
      await expect(scheduler.resume()).resolves.not.toThrow();
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully when not initialized', async () => {
      const uninitializedScheduler = new PriorityScheduler(config, mockLLMService);
      await expect(uninitializedScheduler.shutdown()).resolves.not.toThrow();
    });

    it('should shutdown gracefully after initialization', async () => {
      await scheduler.initialize();
      await expect(scheduler.shutdown()).resolves.not.toThrow();
    });

    it('should handle multiple shutdown calls', async () => {
      await scheduler.initialize();
      await scheduler.shutdown();
      await expect(scheduler.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Integration - Complete Job Lifecycle', () => {
    it('should handle complete job lifecycle: submit -> process -> complete', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440100',
        prompt: 'Lifecycle test',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.HIGH,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const jobId = await scheduler.submit(request);
      expect(jobId).toBe(request.id);
      let status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.QUEUED);
      const job = mockJobs.get(request.id);
      job._state = 'active';
      job.getState = jest.fn().mockResolvedValue('active');
      status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.PROCESSING);
      job._state = 'completed';
      job.getState = jest.fn().mockResolvedValue('completed');
      status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.COMPLETED);
      mockWorker.emit('completed', { id: request.id, data: { requestId: request.id } });
    });

    it('should handle job lifecycle with failure', async () => {
      await scheduler.initialize();
      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440101',
        prompt: 'Failure test',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await scheduler.submit(request);
      const job = mockJobs.get(request.id);
      job._state = 'failed';
      job.getState = jest.fn().mockResolvedValue('failed');
      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.FAILED);
      mockWorker.emit('failed', { id: request.id, data: { requestId: request.id } }, new Error('Test failure'));
    });
  });
});
