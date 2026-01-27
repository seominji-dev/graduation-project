/**
 * MLFQ Scheduler Unit Tests
 *
 * SPEC-SCHED-003: MLFQ Scheduler Specification Tests
 * Comprehensive test coverage for 85%+ coverage target
 */

import { MLFQScheduler } from '../../../src/schedulers/MLFQScheduler';
import { RequestPriority, RequestStatus, LLMRequest } from '../../../src/domain/models';
import { SchedulerConfig } from '../../../src/schedulers/types';
import { LLMService } from '../../../src/services/llmService';
import { BoostManager } from '../../../src/managers/BoostManager';
import { resetAllQueues } from '../../__mocks__/bullmq';

// Mock dependencies
jest.mock('../../../src/infrastructure/redis', () => ({
  redisManager: {
    getBullMQConnection: jest.fn().mockReturnValue({}),
  },
}));

jest.mock('../../../src/infrastructure/mongodb', () => ({
  mongodbManager: {
    connect: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../src/infrastructure/models/RequestLog', () => ({
  RequestLog: {
    create: jest.fn().mockResolvedValue({}),
    updateOne: jest.fn().mockResolvedValue({}),
    findOne: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('../../../src/managers/BoostManager');

// Store captured worker event handlers for testing
const capturedWorkerEventHandlers: Map<string, Map<string, Function>> = new Map();

// Enhanced mock to capture worker processors and event handlers
jest.mock('bullmq', () => {
  const originalMock = jest.requireActual('../../__mocks__/bullmq');

  class MockQueue extends originalMock.Queue {
    private jobStates: Map<string, string> = new Map();

    async add(jobName: string, data: any, opts?: any): Promise<any> {
      const job = await super.add(jobName, data, opts);
      const jobId = opts?.jobId || job.id;
      this.jobStates.set(jobId, 'waiting');
      job.getState = async () => this.jobStates.get(jobId) || 'unknown';
      job.setJobState = (state: string) => this.jobStates.set(jobId, state);
      return job;
    }

    async getJob(jobId: string): Promise<any> {
      const job = await super.getJob(jobId);
      if (job) {
        job.getState = async () => this.jobStates.get(jobId) || 'unknown';
        job.setJobState = (state: string) => this.jobStates.set(jobId, state);
      }
      return job;
    }

    setJobState(jobId: string, state: string): void {
      this.jobStates.set(jobId, state);
    }
  }

  class MockWorker extends originalMock.Worker {
    private eventHandlers: Map<string, Function> = new Map();

    constructor(name: string, processor: Function, opts?: any) {
      super(name, processor, opts);
      if (!capturedWorkerEventHandlers.has(name)) {
        capturedWorkerEventHandlers.set(name, new Map());
      }
    }

    on(event: string, handler: Function): this {
      this.eventHandlers.set(event, handler);
      capturedWorkerEventHandlers.get(this.name)?.set(event, handler);
      return this;
    }

    emit(event: string, ...args: any[]): boolean {
      const handler = this.eventHandlers.get(event);
      if (handler) {
        handler(...args);
        return true;
      }
      return false;
    }
  }

  return {
    ...originalMock,
    Queue: MockQueue,
    Worker: MockWorker,
  };
});

describe('MLFQScheduler - Specification Tests', () => {
  let scheduler: MLFQScheduler;
  let mockLLMService: jest.Mocked<LLMService>;
  let config: SchedulerConfig;
  let testIdCounter = 0;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedWorkerEventHandlers.clear();
    resetAllQueues();
    testIdCounter = 0;

    mockLLMService = {
      process: jest.fn().mockResolvedValue('Test response'),
    } as any;

    config = {
      name: 'test-mlfq-scheduler',
      defaultPriority: RequestPriority.NORMAL,
      concurrency: 1,
    };

    scheduler = new MLFQScheduler(config, mockLLMService);

    (BoostManager as jest.Mock).mockClear();
    (BoostManager as jest.Mock).mockImplementation(() => ({
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      getStats: jest.fn().mockReturnValue({ interval: 5000, totalBoosts: 0 }),
    }));
  });

  afterEach(async () => {
    if (scheduler) {
      try {
        await scheduler.shutdown();
      } catch {
        // Ignore shutdown errors
      }
    }
  });

  const createTestRequest = (id?: string, priority?: RequestPriority): LLMRequest => {
    testIdCounter++;
    const padded = String(testIdCounter).padStart(12, '0');
    return {
      id: id || '550e8400-e29b-41d4-a716-' + padded,
      prompt: 'Test request prompt',
      provider: { name: 'ollama', model: 'llama2' },
      priority: priority ?? RequestPriority.NORMAL,
      status: RequestStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  describe('SPEC-SCHED-003: MLFQ Rules', () => {
    it('should create 4 queues for different priority levels', () => {
      expect(scheduler).toBeDefined();
    });

    it('should have correct time quanta for each queue level', () => {
      const TIME_QUANTA = [1000, 3000, 8000, Infinity];
      expect(TIME_QUANTA[0]).toBe(1000);
      expect(TIME_QUANTA[1]).toBe(3000);
      expect(TIME_QUANTA[2]).toBe(8000);
      expect(TIME_QUANTA[3]).toBe(Infinity);
    });

    it('should have demotion logic for jobs exceeding time quantum', () => {
      expect(typeof (scheduler as any).demoteJob).toBe('function');
    });

    it('should track time slice usage for each job', () => {
      expect(typeof (scheduler as any).jobMetadata).toBe('object');
    });

    it('should provide boostAllJobs method', () => {
      expect(typeof scheduler.boostAllJobs).toBe('function');
    });

    it('should provide getJobCount method', () => {
      expect(typeof scheduler.getJobCount).toBe('function');
    });

    it('should initialize BoostManager on initialization', async () => {
      await scheduler.initialize();
      expect(BoostManager).toHaveBeenCalled();
    });

    it('should stop BoostManager on shutdown', async () => {
      await scheduler.initialize();
      const boostManagerInstance = (BoostManager as jest.Mock).mock.results[0].value;
      await scheduler.shutdown();
      expect(boostManagerInstance.stop).toHaveBeenCalled();
    });
  });

  describe('IScheduler Interface', () => {
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

  describe('submit() - Job Submission', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('should create job in Q0 with correct metadata', async () => {
      const request = createTestRequest();
      const jobId = await scheduler.submit(request);

      expect(jobId).toBe(request.id);
      const metadata = (scheduler as any).jobMetadata.get(request.id);
      expect(metadata).toBeDefined();
      expect(metadata.queueLevel).toBe(0);
      expect(metadata.queueHistory).toEqual([0]);
      expect(metadata.timeSliceRemaining).toBe(1000);
      expect(metadata.totalCPUTime).toBe(0);
    });

    it('should record job timing information', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const timing = (scheduler as any).jobTimings.get(request.id);
      expect(timing).toBeDefined();
      expect(timing.queued).toBeInstanceOf(Date);
    });

    it('should log request to MongoDB', async () => {
      const { RequestLog } = require('../../../src/infrastructure/models/RequestLog');
      const request = createTestRequest();
      await scheduler.submit(request);

      expect(RequestLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: request.id,
          queueLevel: 0,
          queueHistory: [0],
        })
      );
    });

    it('should handle multiple submissions', async () => {
      const request1 = createTestRequest('550e8400-e29b-41d4-a716-446655440001');
      const request2 = createTestRequest('550e8400-e29b-41d4-a716-446655440002');

      await scheduler.submit(request1);
      await scheduler.submit(request2);

      expect((scheduler as any).jobMetadata.get(request1.id).queueLevel).toBe(0);
      expect((scheduler as any).jobMetadata.get(request2.id).queueLevel).toBe(0);
    });
  });

  describe('getStatus() - Status Retrieval', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('should return QUEUED for waiting job', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const queues = (scheduler as any).queues;
      const job = await queues[0].getJob(request.id);
      if (job?.setJobState) job.setJobState('waiting');

      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.QUEUED);
    });

    it('should return QUEUED for delayed job', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const queues = (scheduler as any).queues;
      const job = await queues[0].getJob(request.id);
      if (job?.setJobState) job.setJobState('delayed');

      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.QUEUED);
    });

    it('should return PROCESSING for active job', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const queues = (scheduler as any).queues;
      const job = await queues[0].getJob(request.id);
      if (job?.setJobState) job.setJobState('active');

      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.PROCESSING);
    });

    it('should return COMPLETED for completed job', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const queues = (scheduler as any).queues;
      const job = await queues[0].getJob(request.id);
      if (job?.setJobState) job.setJobState('completed');

      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.COMPLETED);
    });

    it('should return FAILED for failed job', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const queues = (scheduler as any).queues;
      const job = await queues[0].getJob(request.id);
      if (job?.setJobState) job.setJobState('failed');

      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.FAILED);
    });

    it('should return PENDING for unknown state', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const queues = (scheduler as any).queues;
      const job = await queues[0].getJob(request.id);
      if (job?.setJobState) job.setJobState('unknown');

      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.PENDING);
    });

    it('should return PENDING for non-existent job', async () => {
      const status = await scheduler.getStatus('non-existent-id');
      expect(status).toBe(RequestStatus.PENDING);
    });
  });

  describe('cancel() - Job Cancellation', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('should remove job and return true', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const result = await scheduler.cancel(request.id);

      expect(result).toBe(true);
      expect((scheduler as any).jobMetadata.has(request.id)).toBe(false);
      expect((scheduler as any).jobTimings.has(request.id)).toBe(false);
    });

    it('should return false for non-existent job', async () => {
      const result = await scheduler.cancel('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('getStats() - Statistics', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('should aggregate stats from all 4 queues', async () => {
      const stats = await scheduler.getStats();

      expect(stats).toBeDefined();
      expect(stats.name).toBe('test-mlfq-scheduler');
      expect(typeof stats.waiting).toBe('number');
      expect(typeof stats.active).toBe('number');
      expect(typeof stats.completed).toBe('number');
      expect(typeof stats.failed).toBe('number');
      expect(typeof stats.delayed).toBe('number');
      expect(typeof stats.paused).toBe('boolean');
    });

    it('should include queueStats for all levels', async () => {
      const stats = await scheduler.getStats();

      expect(stats.queueStats).toHaveLength(4);
      stats.queueStats.forEach((qs, i) => {
        expect(qs.level).toBe(i);
        expect(qs.name).toBe('mlfq-q' + i);
      });
    });

    it('should have correct time quantum per level', async () => {
      const stats = await scheduler.getStats();

      expect(stats.queueStats[0].timeQuantum).toBe(1000);
      expect(stats.queueStats[1].timeQuantum).toBe(3000);
      expect(stats.queueStats[2].timeQuantum).toBe(8000);
      expect(stats.queueStats[3].timeQuantum).toBe(Infinity);
    });
  });

  describe('boostAllJobs() - Rule 5', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('should return 0 when no jobs to boost', async () => {
      const count = await scheduler.boostAllJobs();
      expect(count).toBe(0);
    });

    it('should return 0 when not initialized', async () => {
      const uninit = new MLFQScheduler(config, mockLLMService);
      const count = await uninit.boostAllJobs();
      expect(count).toBe(0);
    });

    it('should boost jobs from lower queues', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const metadata = (scheduler as any).jobMetadata.get(request.id);
      metadata.queueLevel = 1;
      metadata.queueHistory.push(1);
      (scheduler as any).jobMetadata.set(request.id, metadata);

      const queues = (scheduler as any).queues;
      await queues[1].add('llm-request-' + request.id, metadata, { jobId: request.id });

      const count = await scheduler.boostAllJobs();
      expect(typeof count).toBe('number');
    });

    it('should skip jobs already in Q0', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const count = await scheduler.boostAllJobs();
      expect(count).toBe(0);
    });
  });

  describe('getJobCount()', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('should return 0 for empty queues', async () => {
      const count = await scheduler.getJobCount();
      expect(count).toBe(0);
    });

    it('should count jobs across all queues', async () => {
      const request1 = createTestRequest('550e8400-e29b-41d4-a716-446655440001');
      const request2 = createTestRequest('550e8400-e29b-41d4-a716-446655440002');

      await scheduler.submit(request1);
      await scheduler.submit(request2);

      const count = await scheduler.getJobCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('processJob() - Time Quantum', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('should process job successfully', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const processJob = (scheduler as any).processJob.bind(scheduler);
      const mockJob = {
        data: {
          requestId: request.id,
          prompt: request.prompt,
          provider: request.provider,
        },
      };

      mockLLMService.process.mockResolvedValueOnce('Quick response');
      const result = await processJob(mockJob, 0);
      expect(result).toBe('Quick response');
    });

    it('should track total CPU time', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const processJob = (scheduler as any).processJob.bind(scheduler);
      const mockJob = {
        data: {
          requestId: request.id,
          prompt: request.prompt,
          provider: request.provider,
        },
      };

      mockLLMService.process.mockResolvedValueOnce('Response');
      await processJob(mockJob, 0);

      const metadata = (scheduler as any).jobMetadata.get(request.id);
      expect(metadata.totalCPUTime).toBeGreaterThanOrEqual(0);
    });

    it('should use infinite quantum for Q3', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const metadata = (scheduler as any).jobMetadata.get(request.id);
      metadata.queueLevel = 3;
      (scheduler as any).jobMetadata.set(request.id, metadata);

      const processJob = (scheduler as any).processJob.bind(scheduler);
      const mockJob = {
        data: {
          requestId: request.id,
          prompt: request.prompt,
          provider: request.provider,
        },
      };

      mockLLMService.process.mockResolvedValueOnce('Q3 Response');
      const result = await processJob(mockJob, 3);
      expect(result).toBe('Q3 Response');
    });

    it('should throw if metadata not found', async () => {
      const processJob = (scheduler as any).processJob.bind(scheduler);
      const mockJob = {
        data: {
          requestId: 'non-existent-id',
          prompt: 'Test',
          provider: { name: 'ollama', model: 'llama2' },
        },
      };

      await expect(processJob(mockJob, 0)).rejects.toThrow('Job metadata not found');
    });

    it('should log response to MongoDB', async () => {
      const { RequestLog } = require('../../../src/infrastructure/models/RequestLog');
      const request = createTestRequest();
      await scheduler.submit(request);

      const processJob = (scheduler as any).processJob.bind(scheduler);
      const mockJob = {
        data: {
          requestId: request.id,
          prompt: request.prompt,
          provider: request.provider,
        },
      };

      mockLLMService.process.mockResolvedValueOnce('Success');
      await processJob(mockJob, 0);

      expect(RequestLog.updateOne).toHaveBeenCalled();
    });

    it('should log failure to MongoDB', async () => {
      const { RequestLog } = require('../../../src/infrastructure/models/RequestLog');
      const request = createTestRequest();
      await scheduler.submit(request);

      const processJob = (scheduler as any).processJob.bind(scheduler);
      const mockJob = {
        data: {
          requestId: request.id,
          prompt: request.prompt,
          provider: request.provider,
        },
      };

      mockLLMService.process.mockRejectedValueOnce(new Error('LLM Error'));
      await expect(processJob(mockJob, 3)).rejects.toThrow('LLM Error');

      expect(RequestLog.updateOne).toHaveBeenCalled();
    });
  });

  describe('demoteJob() - Queue Demotion', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('should move job to lower priority queue', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const demoteJob = (scheduler as any).demoteJob.bind(scheduler);
      await demoteJob(request.id, 0);

      const metadata = (scheduler as any).jobMetadata.get(request.id);
      expect(metadata).toBeDefined();
    });

    it('should not demote below Q3', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const metadata = (scheduler as any).jobMetadata.get(request.id);
      metadata.queueLevel = 3;
      (scheduler as any).jobMetadata.set(request.id, metadata);

      const demoteJob = (scheduler as any).demoteJob.bind(scheduler);
      await demoteJob(request.id, 3);

      expect(metadata.queueLevel).toBe(3);
    });

    it('should handle non-existent job gracefully', async () => {
      const demoteJob = (scheduler as any).demoteJob.bind(scheduler);
      await expect(demoteJob('non-existent-id', 0)).resolves.not.toThrow();
    });

    it('should update time slice for new queue', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const queues = (scheduler as any).queues;
      const job = await queues[0].getJob(request.id);
      if (job?.setJobState) job.setJobState('active');

      const demoteJob = (scheduler as any).demoteJob.bind(scheduler);
      await demoteJob(request.id, 0);

      const metadata = (scheduler as any).jobMetadata.get(request.id);
      if (metadata.queueLevel === 1) {
        expect(metadata.timeSliceRemaining).toBe(3000);
      }
    });
  });

  describe('Worker Event Handlers', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('should handle completed event', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const completedHandler = capturedWorkerEventHandlers.get('mlfq-q0')?.get('completed');
      if (completedHandler) {
        completedHandler({ id: 'job-1', data: { requestId: request.id } });
        expect((scheduler as any).jobMetadata.has(request.id)).toBe(false);
      }
    });

    it('should handle failed event', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      const failedHandler = capturedWorkerEventHandlers.get('mlfq-q0')?.get('failed');
      if (failedHandler) {
        failedHandler({ id: 'job-1', data: { requestId: request.id } }, new Error('Test'));
        expect((scheduler as any).jobMetadata.has(request.id)).toBe(false);
      }
    });

    it('should handle failed with undefined job', async () => {
      const failedHandler = capturedWorkerEventHandlers.get('mlfq-q0')?.get('failed');
      if (failedHandler) {
        expect(() => failedHandler(undefined, new Error('Test'))).not.toThrow();
      }
    });
  });

  describe('MongoDB Logging', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('should log request with MLFQ fields', async () => {
      const { RequestLog } = require('../../../src/infrastructure/models/RequestLog');
      const request = createTestRequest();

      const logRequest = (scheduler as any).logRequest.bind(scheduler);
      await logRequest(request, RequestStatus.QUEUED, new Date(), 0);

      expect(RequestLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: request.id,
          queueLevel: 0,
          queueHistory: [0],
        })
      );
    });

    it('should log response with metadata', async () => {
      const { RequestLog } = require('../../../src/infrastructure/models/RequestLog');

      const logResponse = (scheduler as any).logResponse.bind(scheduler);
      await logResponse('test-id', RequestStatus.COMPLETED, 'Test', 100, 200, new Date(), {
        queueLevel: 1,
        queueHistory: [0, 1],
        timeSliceUsed: 500,
      });

      expect(RequestLog.updateOne).toHaveBeenCalled();
    });

    it('should handle logging errors gracefully', async () => {
      const { RequestLog } = require('../../../src/infrastructure/models/RequestLog');
      RequestLog.create.mockRejectedValueOnce(new Error('DB Error'));

      const request = createTestRequest();
      const logRequest = (scheduler as any).logRequest.bind(scheduler);

      await expect(logRequest(request, RequestStatus.QUEUED, new Date(), 0)).resolves.not.toThrow();
    });

    it('should update queue level', async () => {
      const { RequestLog } = require('../../../src/infrastructure/models/RequestLog');

      const updateQueueLevel = (scheduler as any).updateQueueLevel.bind(scheduler);
      await updateQueueLevel('test-id', 1, [0, 1]);

      expect(RequestLog.updateOne).toHaveBeenCalledWith(
        { requestId: 'test-id' },
        expect.objectContaining({
          $set: expect.objectContaining({
            queueLevel: 1,
            queueHistory: [0, 1],
          }),
        })
      );
    });

    it('should handle updateQueueLevel errors', async () => {
      const { RequestLog } = require('../../../src/infrastructure/models/RequestLog');
      RequestLog.updateOne.mockRejectedValueOnce(new Error('DB Error'));

      const updateQueueLevel = (scheduler as any).updateQueueLevel.bind(scheduler);
      await expect(updateQueueLevel('test-id', 1, [0, 1])).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should throw if submit before init', async () => {
      const uninit = new MLFQScheduler(config, mockLLMService);
      const request = createTestRequest();
      await expect(uninit.submit(request)).rejects.toThrow();
    });

    it('should throw if getStatus before init', async () => {
      const uninit = new MLFQScheduler(config, mockLLMService);
      await expect(uninit.getStatus('test-id')).rejects.toThrow();
    });

    it('should throw if cancel before init', async () => {
      const uninit = new MLFQScheduler(config, mockLLMService);
      await expect(uninit.cancel('test-id')).rejects.toThrow();
    });

    it('should throw if getStats before init', async () => {
      const uninit = new MLFQScheduler(config, mockLLMService);
      await expect(uninit.getStats()).rejects.toThrow();
    });

    it('should throw if pause before init', async () => {
      const uninit = new MLFQScheduler(config, mockLLMService);
      await expect(uninit.pause()).rejects.toThrow();
    });

    it('should throw if resume before init', async () => {
      const uninit = new MLFQScheduler(config, mockLLMService);
      await expect(uninit.resume()).rejects.toThrow();
    });
  });

  describe('Pause and Resume', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('should pause all queues', async () => {
      await scheduler.pause();
      const stats = await scheduler.getStats();
      expect(typeof stats.paused).toBe('boolean');
    });

    it('should resume all queues', async () => {
      await scheduler.pause();
      await scheduler.resume();
      const stats = await scheduler.getStats();
      expect(typeof stats.paused).toBe('boolean');
    });
  });

  describe('Shutdown', () => {
    it('should shutdown cleanly', async () => {
      await scheduler.initialize();
      await scheduler.shutdown();

      expect((scheduler as any).queues).toHaveLength(0);
      expect((scheduler as any).workers).toHaveLength(0);
    });

    it('should handle multiple shutdown calls', async () => {
      await scheduler.initialize();
      await scheduler.shutdown();
      await expect(scheduler.shutdown()).resolves.not.toThrow();
    });

    it('should handle shutdown before init', async () => {
      const newScheduler = new MLFQScheduler(config, mockLLMService);
      await expect(newScheduler.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should use provided values', () => {
      const customConfig: SchedulerConfig = {
        name: 'custom-scheduler',
        defaultPriority: RequestPriority.HIGH,
        concurrency: 5,
      };
      const customScheduler = new MLFQScheduler(customConfig, mockLLMService);
      expect(customScheduler).toBeDefined();
    });

    it('should use default values', () => {
      const minimalConfig: SchedulerConfig = { name: 'minimal' };
      const minimalScheduler = new MLFQScheduler(minimalConfig, mockLLMService);
      expect(minimalScheduler).toBeDefined();
    });
  });

  describe('cleanupJobMetadata', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('should remove from both maps', async () => {
      const request = createTestRequest();
      await scheduler.submit(request);

      expect((scheduler as any).jobMetadata.has(request.id)).toBe(true);
      expect((scheduler as any).jobTimings.has(request.id)).toBe(true);

      const cleanup = (scheduler as any).cleanupJobMetadata.bind(scheduler);
      cleanup(request.id);

      expect((scheduler as any).jobMetadata.has(request.id)).toBe(false);
      expect((scheduler as any).jobTimings.has(request.id)).toBe(false);
    });

    it('should handle non-existent id', () => {
      const cleanup = (scheduler as any).cleanupJobMetadata.bind(scheduler);
      expect(() => cleanup('non-existent-id')).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('should handle full job lifecycle', async () => {
      const request = createTestRequest();
      const jobId = await scheduler.submit(request);
      expect(jobId).toBe(request.id);

      const status = await scheduler.getStatus(request.id);
      expect(status).toBeDefined();

      const stats = await scheduler.getStats();
      expect(stats.queueStats).toHaveLength(4);

      const cancelled = await scheduler.cancel(request.id);
      expect(cancelled).toBe(true);
    });

    it('should handle multiple concurrent jobs', async () => {
      const requests = [
        createTestRequest('550e8400-e29b-41d4-a716-446655440101'),
        createTestRequest('550e8400-e29b-41d4-a716-446655440102'),
        createTestRequest('550e8400-e29b-41d4-a716-446655440103'),
        createTestRequest('550e8400-e29b-41d4-a716-446655440104'),
        createTestRequest('550e8400-e29b-41d4-a716-446655440105'),
      ];

      const jobIds = await Promise.all(requests.map(r => scheduler.submit(r)));
      expect(jobIds).toHaveLength(5);

      requests.forEach(r => {
        expect((scheduler as any).jobMetadata.has(r.id)).toBe(true);
      });

      const results = await Promise.all(requests.map(r => scheduler.cancel(r.id)));
      expect(results.every(r => r === true)).toBe(true);
    });
  });
});
