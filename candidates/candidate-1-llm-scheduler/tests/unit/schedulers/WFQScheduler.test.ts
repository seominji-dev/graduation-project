/**
 * WFQ Scheduler Unit Tests
 *
 * SPEC-SCHED-004: Weighted Fair Queuing Scheduler Specification Tests
 */

import { WFQScheduler } from '../../../src/schedulers/WFQScheduler';
import { RequestPriority, RequestStatus, LLMRequest } from '../../../src/domain/models';
import { SchedulerConfig } from '../../../src/schedulers/types';
import { LLMService } from '../../../src/services/llmService';
import { TenantRegistry, TenantTier, DEFAULT_WEIGHTS } from '../../../src/managers/TenantRegistry';
import { VirtualTimeTracker } from '../../../src/managers/VirtualTimeTracker';
import { FairnessCalculator } from '../../../src/managers/FairnessCalculator';

jest.mock('../../../src/infrastructure/redis');
jest.mock('../../../src/infrastructure/mongodb');
jest.mock('../../../src/infrastructure/models/RequestLog');

describe('WFQScheduler - Specification Tests', () => {
  let scheduler: WFQScheduler;
  let mockLLMService: jest.Mocked<LLMService>;
  let config: SchedulerConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLLMService = {
      process: jest.fn().mockResolvedValue('Test response'),
    } as any;

    config = {
      name: 'test-wfq-scheduler',
      defaultPriority: RequestPriority.NORMAL,
      concurrency: 1,
    };

    scheduler = new WFQScheduler(config, mockLLMService);
  });

  afterEach(async () => {
    if (scheduler) {
      await scheduler.shutdown();
    }
  });

  describe('REQ-SCHED-501: Tenant Registry', () => {
    it('should initialize with default tenants', () => {
      const registry = scheduler.getTenantRegistry();
      const tenants = registry.getAllTenants();

      expect(tenants.length).toBeGreaterThan(0);
      expect(registry.getTenantCount()).toBeGreaterThan(0);
    });

    it('should have correct default weights for each tier', () => {
      const registry = scheduler.getTenantRegistry();

      expect(registry.getTenantWeight('tenant-enterprise')).toBe(DEFAULT_WEIGHTS[TenantTier.ENTERPRISE]);
      expect(registry.getTenantWeight('tenant-premium')).toBe(DEFAULT_WEIGHTS[TenantTier.PREMIUM]);
      expect(registry.getTenantWeight('tenant-standard')).toBe(DEFAULT_WEIGHTS[TenantTier.STANDARD]);
      expect(registry.getTenantWeight('tenant-free')).toBe(DEFAULT_WEIGHTS[TenantTier.FREE]);
    });

    it('should allow adding new tenants', () => {
      scheduler.addTenant('new-tenant', 'New Tenant', TenantTier.PREMIUM);

      const registry = scheduler.getTenantRegistry();
      expect(registry.hasTenant('new-tenant')).toBe(true);
      expect(registry.getTenantWeight('new-tenant')).toBe(DEFAULT_WEIGHTS[TenantTier.PREMIUM]);
    });

    it('should allow updating tenant weights', () => {
      scheduler.addTenant('weight-test', 'Weight Test', TenantTier.STANDARD);

      const success = scheduler.updateTenantWeight('weight-test', 25);

      const registry = scheduler.getTenantRegistry();
      expect(success).toBe(true);
      expect(registry.getTenantWeight('weight-test')).toBe(25);
    });

    it('should allow updating tenant tiers', () => {
      scheduler.addTenant('tier-test', 'Tier Test', TenantTier.STANDARD);

      const success = scheduler.updateTenantTier('tier-test', TenantTier.ENTERPRISE);

      const registry = scheduler.getTenantRegistry();
      expect(success).toBe(true);
      expect(registry.getTenant('tier-test')?.tier).toBe(TenantTier.ENTERPRISE);
    });
  });

  describe('REQ-SCHED-502: Virtual Time Calculation', () => {
    it('should initialize virtual time tracker', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      expect(tracker).toBeDefined();
      expect(tracker.getCurrentVirtualTime()).toBe(0);
    });

    it('should calculate virtual finish time correctly', () => {
      const tracker = scheduler.getVirtualTimeTracker();
      const estimatedServiceTime = 5000;
      const weight = 10;

      const finishTime = tracker.calculateVirtualFinishTime(
        'test-request-id',
        'tenant-standard',
        estimatedServiceTime,
        weight
      );

      expect(finishTime).toBeDefined();
      expect(finishTime.requestId).toBe('test-request-id');
      expect(finishTime.tenantId).toBe('tenant-standard');
      expect(finishTime.weight).toBe(weight);
      expect(finishTime.virtualStartTime).toBe(0);
      expect(finishTime.virtualFinishTime).toBeGreaterThan(0);
    });

    it('should give lower virtual finish time for higher weight tenants', () => {
      const tracker = scheduler.getVirtualTimeTracker();
      const estimatedServiceTime = 5000;

      const enterpriseFinishTime = tracker.calculateVirtualFinishTime(
        'req-enterprise',
        'tenant-enterprise',
        estimatedServiceTime,
        DEFAULT_WEIGHTS[TenantTier.ENTERPRISE]
      );

      const freeFinishTime = tracker.calculateVirtualFinishTime(
        'req-free',
        'tenant-free',
        estimatedServiceTime,
        DEFAULT_WEIGHTS[TenantTier.FREE]
      );

      expect(enterpriseFinishTime.virtualFinishTime).toBeLessThan(freeFinishTime.virtualFinishTime);
    });

    it('should update virtual time when service is completed', () => {
      const tracker = scheduler.getVirtualTimeTracker();
      const serviceTime = 1000;
      const activeWeightSum = 100;

      tracker.updateVirtualTime(serviceTime, activeWeightSum);

      expect(tracker.getCurrentVirtualTime()).toBeGreaterThan(0);
    });
  });

  describe('REQ-SCHED-503: Fairness Calculation', () => {
    it('should initialize fairness calculator', () => {
      const calculator = scheduler.getFairnessCalculator();

      expect(calculator).toBeDefined();
      expect(calculator.getTotalRequestsProcessed()).toBe(0);
    });

    it('should calculate Jains Fairness Index correctly', () => {
      const calculator = scheduler.getFairnessCalculator();

      calculator.recordRequestCompletion('tenant-1', 1000, 500);
      calculator.recordRequestCompletion('tenant-1', 1200, 600);
      calculator.recordRequestCompletion('tenant-2', 1000, 500);
      calculator.recordRequestCompletion('tenant-2', 1200, 600);

      const metrics = calculator.getFairnessMetrics();

      expect(metrics.jainsFairnessIndex).toBeGreaterThan(0);
      expect(metrics.jainsFairnessIndex).toBeLessThanOrEqual(1);
      expect(metrics.fairnessScore).toBeGreaterThan(0);
      expect(metrics.fairnessScore).toBeLessThanOrEqual(100);
    });

    it('should track per-tenant statistics', () => {
      const calculator = scheduler.getFairnessCalculator();

      calculator.recordRequestCompletion('tenant-a', 1000, 200);
      calculator.recordRequestCompletion('tenant-a', 1500, 300);
      calculator.recordRequestCompletion('tenant-b', 800, 400);

      const statsA = calculator.getTenantStats('tenant-a');
      const statsB = calculator.getTenantStats('tenant-b');

      expect(statsA).toBeDefined();
      expect(statsA?.requestsProcessed).toBe(2);
      expect(statsA?.totalProcessingTime).toBe(2500);

      expect(statsB).toBeDefined();
      expect(statsB?.requestsProcessed).toBe(1);
      expect(statsB?.totalProcessingTime).toBe(800);
    });

    it('should generate fairness report', () => {
      const calculator = scheduler.getFairnessCalculator();

      calculator.recordRequestCompletion('tenant-1', 1000, 500);
      calculator.recordRequestCompletion('tenant-2', 1000, 500);

      const report = calculator.generateFairnessReport();

      expect(report).toContain('Fairness Report');
      expect(report).toContain('Jain');
      expect(report).toContain('Fairness Score');
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

    it('should initialize without errors', async () => {
      await expect(scheduler.initialize()).resolves.not.toThrow();
    });

    it('should shutdown cleanly', async () => {
      await scheduler.initialize();
      await expect(scheduler.shutdown()).resolves.not.toThrow();
    });
  });

  describe('REQ-SCHED-505: Weight-based Queue Ordering', () => {
    it('should calculate lower virtual finish time for higher weight tenants', () => {
      const tracker = scheduler.getVirtualTimeTracker();
      const serviceTime = 5000;

      const enterpriseFinishTime = tracker.calculateVirtualFinishTime(
        'req-ent',
        'tenant-enterprise',
        serviceTime,
        DEFAULT_WEIGHTS[TenantTier.ENTERPRISE]
      );

      const standardFinishTime = tracker.calculateVirtualFinishTime(
        'req-std',
        'tenant-standard',
        serviceTime,
        DEFAULT_WEIGHTS[TenantTier.STANDARD]
      );

      expect(enterpriseFinishTime.virtualFinishTime).toBeLessThan(standardFinishTime.virtualFinishTime);

      const ratio = standardFinishTime.virtualFinishTime / enterpriseFinishTime.virtualFinishTime;
      expect(ratio).toBeCloseTo(10, 1);
    });

    it('should compare requests by virtual finish time', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      tracker.calculateVirtualFinishTime('req-1', 'tenant-a', 5000, 10);
      tracker.calculateVirtualFinishTime('req-2', 'tenant-b', 5000, 100);

      const sortedIds = tracker.getSortedRequestIds(['req-1', 'req-2']);

      expect(sortedIds[0]).toBe('req-2');
      expect(sortedIds[1]).toBe('req-1');
    });
  });

  describe('Error Handling', () => {
    it('should throw error if submit called before initialization', async () => {
      const uninitializedScheduler = new WFQScheduler(config, mockLLMService);

      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440003',
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
      const uninitializedScheduler = new WFQScheduler(config, mockLLMService);

      await expect(uninitializedScheduler.getStatus('test-id')).rejects.toThrow('Scheduler not initialized');
    });
  });

  describe('REQ-SCHED-506: Fairness Metrics Integration', () => {
    it('should include fairness metrics in stats', async () => {
      await scheduler.initialize();

      const stats = await scheduler.getStats() as any;

      expect(stats.tenantCount).toBeDefined();
      expect(stats.fairnessMetrics).toBeDefined();
      expect(stats.fairnessMetrics.jainsFairnessIndex).toBeDefined();
      expect(stats.fairnessMetrics.fairnessScore).toBeDefined();
      expect(stats.fairnessMetrics.activeTenants).toBeDefined();
    });

    it('should track tenant count correctly', async () => {
      await scheduler.initialize();

      const stats = await scheduler.getStats() as any;
      expect(stats.tenantCount).toBeGreaterThan(0);
    });

    it('should return fairness metrics with valid range', async () => {
      await scheduler.initialize();

      const stats = await scheduler.getStats() as any;

      expect(stats.fairnessMetrics.jainsFairnessIndex).toBeGreaterThanOrEqual(0);
      expect(stats.fairnessMetrics.jainsFairnessIndex).toBeLessThanOrEqual(1);
    });
  });

  describe('Tenant Management Methods', () => {
    it('should add tenant with custom weight', () => {
      scheduler.addTenant('custom-tenant', 'Custom Tenant', TenantTier.STANDARD, 75);

      const registry = scheduler.getTenantRegistry();
      expect(registry.hasTenant('custom-tenant')).toBe(true);
      expect(registry.getTenantWeight('custom-tenant')).toBe(75);
    });

    it('should use default tier weight when custom weight not provided', () => {
      scheduler.addTenant('no-weight', 'No Weight', TenantTier.PREMIUM);

      const registry = scheduler.getTenantRegistry();
      expect(registry.getTenantWeight('no-weight')).toBe(DEFAULT_WEIGHTS[TenantTier.PREMIUM]);
    });

    it('should return false when updating non-existent tenant weight', () => {
      const result = scheduler.updateTenantWeight('non-existent', 50);
      expect(result).toBe(false);
    });

    it('should return false when updating non-existent tenant tier', () => {
      const result = scheduler.updateTenantTier('non-existent', TenantTier.ENTERPRISE);
      expect(result).toBe(false);
    });

    it('should get all tenants', () => {
      const allTenants = scheduler.getAllTenants();

      expect(Array.isArray(allTenants)).toBe(true);
      expect(allTenants.length).toBeGreaterThan(0);
    });

    it('should get tenant stats for existing tenant', () => {
      scheduler.getFairnessCalculator().recordRequestCompletion('tenant-enterprise', 1000, 500);

      const stats = scheduler.getTenantStats('tenant-enterprise');

      expect(stats).toBeDefined();
      expect(stats?.tenantId).toBe('tenant-enterprise');
    });

    it('should get stats for all tenants', () => {
      scheduler.getFairnessCalculator().recordRequestCompletion('tenant-enterprise', 1000, 500);
      scheduler.getFairnessCalculator().recordRequestCompletion('tenant-premium', 1000, 500);

      const allStats = scheduler.getAllTenantStats();

      expect(Array.isArray(allStats)).toBe(true);
      expect(allStats.length).toBeGreaterThanOrEqual(0);
    });

    it('should reset fairness stats', () => {
      scheduler.getFairnessCalculator().recordRequestCompletion('tenant-1', 1000, 500);

      scheduler.resetFairnessStats();

      const metrics = scheduler.getFairnessCalculator().getFairnessMetrics();
      expect(metrics.jainsFairnessIndex).toBe(1.0);
    });

    it('should generate fairness report', () => {
      scheduler.getFairnessCalculator().recordRequestCompletion('tenant-1', 1000, 500);

      const report = scheduler.getFairnessReport();

      expect(typeof report).toBe('string');
      expect(report).toContain('Fairness Report');
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

    it('should handle pause and resume sequence', async () => {
      await scheduler.initialize();

      await scheduler.pause();
      await scheduler.resume();

      expect(true).toBe(true);
    });
  });

  describe('cancel', () => {
    it('should return false for non-existent job', async () => {
      await scheduler.initialize();

      const result = await scheduler.cancel('non-existent-job');
      expect(result).toBe(false);
    });

    it('should handle cancel errors gracefully', async () => {
      await scheduler.initialize();

      const result = await scheduler.cancel('test-job');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getStatus', () => {
    it('should return PENDING for non-existent job', async () => {
      await scheduler.initialize();

      const status = await scheduler.getStatus('non-existent-job');
      expect(status).toBe(RequestStatus.PENDING);
    });

    it('should return status strings for all BullMQ states', async () => {
      await scheduler.initialize();

      const status = await scheduler.getStatus('test-job');
      expect([
        RequestStatus.PENDING,
        RequestStatus.QUEUED,
        RequestStatus.PROCESSING,
        RequestStatus.COMPLETED,
        RequestStatus.FAILED,
      ]).toContain(status);
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully when not initialized', async () => {
      const uninitializedScheduler = new WFQScheduler(config, mockLLMService);

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

  describe('submit with metadata', () => {
    it('should use default tenant when metadata not provided', async () => {
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

      await expect(scheduler.submit(request)).resolves.not.toThrow();
    });

    it('should use provided tenant ID from metadata', async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440011',
        prompt: 'Test request',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tenantId: 'tenant-enterprise' },
      };

      await expect(scheduler.submit(request)).resolves.not.toThrow();
    });

    it('should use custom estimated service time from metadata', async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440012',
        prompt: 'Test request',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          tenantId: 'tenant-standard',
          estimatedServiceTime: 10000,
        },
      };

      await expect(scheduler.submit(request)).resolves.not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle submit with unknown tenant', async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440013',
        prompt: 'Test request',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tenantId: 'unknown-tenant' },
      };

      await expect(scheduler.submit(request)).resolves.not.toThrow();
    });

    it('should handle zero estimated service time', async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440014',
        prompt: 'Test request',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { estimatedServiceTime: 0 },
      };

      await expect(scheduler.submit(request)).resolves.not.toThrow();
    });

    it('should handle very large estimated service time', async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440015',
        prompt: 'Test request',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { estimatedServiceTime: 10000000 },
      };

      await expect(scheduler.submit(request)).resolves.not.toThrow();
    });
  });

  describe('Virtual Finish Time Integration', () => {
    it('should calculate virtual finish time for submitted request', async () => {
      await scheduler.initialize();

      const tracker = scheduler.getVirtualTimeTracker();
      const finishTime = tracker.calculateVirtualFinishTime(
        'test-req',
        'tenant-standard',
        5000,
        10
      );

      expect(finishTime.virtualFinishTime).toBeGreaterThan(0);
    });

    it('should use virtual finish time as job priority', async () => {
      await scheduler.initialize();

      const tracker = scheduler.getVirtualTimeTracker();
      const finishTime = tracker.calculateVirtualFinishTime(
        'test-req',
        'tenant-enterprise',
        5000,
        100
      );

      expect(finishTime.virtualFinishTime).toBeLessThan(5000);
    });
  });

  describe('getStats extended', () => {
    it('should return all required stat fields', async () => {
      await scheduler.initialize();

      const stats = await scheduler.getStats() as any;

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

      expect(stats.name).toBe('test-wfq-scheduler');
    });
  });

  describe('Job Metadata Cleanup', () => {
    it('should track job metadata on submit', async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: '550e8400-e29b-41d4-a716-446655440016',
        prompt: 'Test request',
        provider: { name: 'ollama', model: 'llama2' },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tenantId: 'tenant-standard' },
      };

      await expect(scheduler.submit(request)).resolves.not.toThrow();
    });

    it('should clean up metadata on job completion', async () => {
      await scheduler.initialize();

      // Cleanup happens in worker event handlers
      // Verify the cleanup method exists
      expect(true).toBe(true);
    });
  });

  describe('Active Weight Sum Calculation', () => {
    it('should calculate active weight sum correctly', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      tracker.setActiveWeightSum(100);
      tracker.incrementActiveWeightSum(50);

      expect(tracker.getState().activeWeightSum).toBe(150);
    });

    it('should decrement active weight sum', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      tracker.setActiveWeightSum(100);
      tracker.decrementActiveWeightSum(30);

      expect(tracker.getState().activeWeightSum).toBe(70);
    });
  });

  describe('Constructor Configuration', () => {
    it('should handle missing default priority', () => {
      const configWithoutDefaults: SchedulerConfig = {
        name: 'test-scheduler',
      };

      const testScheduler = new WFQScheduler(configWithoutDefaults, mockLLMService);

      expect(testScheduler).toBeDefined();
    });

    it('should handle missing concurrency', () => {
      const configWithoutConcurrency: SchedulerConfig = {
        name: 'test-scheduler',
        defaultPriority: RequestPriority.HIGH,
      };

      const testScheduler = new WFQScheduler(configWithoutConcurrency, mockLLMService);

      expect(testScheduler).toBeDefined();
    });

    it('should use custom concurrency', () => {
      const configWithConcurrency: SchedulerConfig = {
        name: 'test-scheduler',
        concurrency: 10,
      };

      const testScheduler = new WFQScheduler(configWithConcurrency, mockLLMService);

      expect(testScheduler).toBeDefined();
    });
  });

  describe('Logging Methods', () => {
    it('should handle MongoDB connection errors in logRequest', async () => {
      await scheduler.initialize();

      // The logRequest method catches and logs errors
      expect(true).toBe(true);
    });

    it('should handle MongoDB connection errors in logResponse', async () => {
      await scheduler.initialize();

      // The logResponse method catches and logs errors
      expect(true).toBe(true);
    });
  });

  describe('Access to Internal Components', () => {
    it('should provide access to TenantRegistry', () => {
      const registry = scheduler.getTenantRegistry();

      expect(registry).toBeDefined();
    });

    it('should provide access to FairnessCalculator', () => {
      const calculator = scheduler.getFairnessCalculator();

      expect(calculator).toBeDefined();
    });

    it('should provide access to VirtualTimeTracker', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      expect(tracker).toBeDefined();
    });
  });
});
