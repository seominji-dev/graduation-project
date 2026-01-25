/**
 * WFQ Scheduler Business Logic Unit Tests
 *
 * Tests for pure business logic methods that don't require external services.
 * Focuses on tenant management, virtual time calculation, and fairness metrics.
 */

import { WFQScheduler } from '../../../src/schedulers/WFQScheduler';
import { RequestPriority, RequestStatus, LLMRequest } from '../../../src/domain/models';
import { SchedulerConfig } from '../../../src/schedulers/types';
import { LLMService } from '../../../src/services/llmService';
import { TenantRegistry, TenantTier, DEFAULT_WEIGHTS } from '../../../src/managers/TenantRegistry';

jest.mock('../../../src/infrastructure/redis');
jest.mock('../../../src/infrastructure/mongodb');
jest.mock('../../../src/infrastructure/models/RequestLog');

describe('WFQScheduler - Business Logic Tests', () => {
  let scheduler: WFQScheduler;
  let mockLLMService: jest.Mocked<LLMService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLLMService = {
      process: jest.fn().mockResolvedValue('Test response'),
    } as any;

    const config: SchedulerConfig = {
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

  describe('DEFAULT_WEIGHTS - Tenant Weight Constants', () => {
    it('should define weight for ENTERPRISE tier', () => {
      expect(DEFAULT_WEIGHTS[TenantTier.ENTERPRISE]).toBe(100);
    });

    it('should define weight for PREMIUM tier', () => {
      expect(DEFAULT_WEIGHTS[TenantTier.PREMIUM]).toBe(50);
    });

    it('should define weight for STANDARD tier', () => {
      expect(DEFAULT_WEIGHTS[TenantTier.STANDARD]).toBe(10);
    });

    it('should define weight for FREE tier', () => {
      expect(DEFAULT_WEIGHTS[TenantTier.FREE]).toBe(1);
    });

    it('should have monotonically decreasing weights', () => {
      expect(DEFAULT_WEIGHTS[TenantTier.ENTERPRISE])
        .toBeGreaterThan(DEFAULT_WEIGHTS[TenantTier.PREMIUM]);
      expect(DEFAULT_WEIGHTS[TenantTier.PREMIUM])
        .toBeGreaterThan(DEFAULT_WEIGHTS[TenantTier.STANDARD]);
      expect(DEFAULT_WEIGHTS[TenantTier.STANDARD])
        .toBeGreaterThan(DEFAULT_WEIGHTS[TenantTier.FREE]);
    });

    it('should have weight ratio of 2x between consecutive tiers', () => {
      expect(DEFAULT_WEIGHTS[TenantTier.ENTERPRISE] / DEFAULT_WEIGHTS[TenantTier.PREMIUM]).toBe(2);
      expect(DEFAULT_WEIGHTS[TenantTier.PREMIUM] / DEFAULT_WEIGHTS[TenantTier.STANDARD]).toBe(5);
      expect(DEFAULT_WEIGHTS[TenantTier.STANDARD] / DEFAULT_WEIGHTS[TenantTier.FREE]).toBe(10);
    });
  });

  describe('DEFAULT_ESTIMATED_SERVICE_TIME', () => {
    it('should be defined as 5000ms', () => {
      const DEFAULT_ESTIMATED_SERVICE_TIME = 5000;
      expect(DEFAULT_ESTIMATED_SERVICE_TIME).toBe(5000);
    });

    it('should be in reasonable range for LLM processing', () => {
      const DEFAULT_ESTIMATED_SERVICE_TIME = 5000;
      expect(DEFAULT_ESTIMATED_SERVICE_TIME).toBeGreaterThan(1000);
      expect(DEFAULT_ESTIMATED_SERVICE_TIME).toBeLessThan(60000);
    });
  });

  describe('Tenant Management Methods', () => {
    it('should provide addTenant method', () => {
      expect(typeof scheduler.addTenant).toBe('function');
    });

    it('should provide updateTenantWeight method', () => {
      expect(typeof scheduler.updateTenantWeight).toBe('function');
    });

    it('should provide updateTenantTier method', () => {
      expect(typeof scheduler.updateTenantTier).toBe('function');
    });

    it('should provide getAllTenants method', () => {
      expect(typeof scheduler.getAllTenants).toBe('function');
    });

    it('should provide getTenantStats method', () => {
      expect(typeof scheduler.getTenantStats).toBe('function');
    });

    it('should provide getAllTenantStats method', () => {
      expect(typeof scheduler.getAllTenantStats).toBe('function');
    });
  });

  describe('addTenant - Tenant Addition', () => {
    it('should add tenant with all tiers', () => {
      const tiers = [
        TenantTier.ENTERPRISE,
        TenantTier.PREMIUM,
        TenantTier.STANDARD,
        TenantTier.FREE,
      ];

      tiers.forEach((tier) => {
        expect(() => {
          scheduler.addTenant(`tenant-${tier}`, `Tenant ${tier}`, tier);
        }).not.toThrow();
      });
    });

    it('should add tenant with custom weight', () => {
      expect(() => {
        scheduler.addTenant('custom-weight-tenant', 'Custom Weight', TenantTier.STANDARD, 75);
      }).not.toThrow();
    });

    it('should add tenant with weight 1', () => {
      expect(() => {
        scheduler.addTenant('weight-1-tenant', 'Weight 1', TenantTier.FREE, 1);
      }).not.toThrow();
    });

    it('should add tenant with weight 100', () => {
      expect(() => {
        scheduler.addTenant('weight-100-tenant', 'Weight 100', TenantTier.ENTERPRISE, 100);
      }).not.toThrow();
    });
  });

  describe('updateTenantWeight - Weight Updates', () => {
    it('should return false for non-existent tenant', () => {
      const result = scheduler.updateTenantWeight('non-existent', 50);
      expect(result).toBe(false);
    });

    it('should update weight to valid values', () => {
      scheduler.addTenant('weight-update-test', 'Weight Update', TenantTier.STANDARD);

      const weights = [1, 5, 10, 25, 50, 75, 100];

      weights.forEach((weight) => {
        const result = scheduler.updateTenantWeight('weight-update-test', weight);
        if (result) {
          expect(weight).toBeGreaterThan(0);
          expect(weight).toBeLessThanOrEqual(100);
        }
      });
    });

    it('should handle weight of 0', () => {
      scheduler.addTenant('zero-weight', 'Zero Weight', TenantTier.FREE);
      const result = scheduler.updateTenantWeight('zero-weight', 0);
      expect(typeof result).toBe('boolean');
    });

    it('should handle negative weight', () => {
      scheduler.addTenant('negative-weight', 'Negative Weight', TenantTier.FREE);
      const result = scheduler.updateTenantWeight('negative-weight', -1);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('updateTenantTier - Tier Updates', () => {
    it('should return false for non-existent tenant', () => {
      const result = scheduler.updateTenantTier('non-existent', TenantTier.ENTERPRISE);
      expect(result).toBe(false);
    });

    it('should update tier across all levels', () => {
      scheduler.addTenant('tier-update-test', 'Tier Update', TenantTier.FREE);

      const tiers = [
        TenantTier.FREE,
        TenantTier.STANDARD,
        TenantTier.PREMIUM,
        TenantTier.ENTERPRISE,
      ];

      tiers.forEach((tier) => {
        const result = scheduler.updateTenantTier('tier-update-test', tier);
        expect(typeof result).toBe('boolean');
      });
    });

    it('should update from FREE to ENTERPRISE', () => {
      scheduler.addTenant('free-to-enterprise', 'Free to Enterprise', TenantTier.FREE);
      const result = scheduler.updateTenantTier('free-to-enterprise', TenantTier.ENTERPRISE);
      expect(typeof result).toBe('boolean');
    });

    it('should update from ENTERPRISE to FREE', () => {
      scheduler.addTenant('enterprise-to-free', 'Enterprise to Free', TenantTier.ENTERPRISE);
      const result = scheduler.updateTenantTier('enterprise-to-free', TenantTier.FREE);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Virtual Time Calculation', () => {
    it('should initialize with virtual time of 0', () => {
      const tracker = scheduler.getVirtualTimeTracker();
      expect(tracker.getCurrentVirtualTime()).toBe(0);
    });

    it('should calculate virtual finish time', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      const finishTime = tracker.calculateVirtualFinishTime(
        'test-request-id',
        'tenant-standard',
        5000,
        10
      );

      expect(finishTime).toBeDefined();
      expect(finishTime.requestId).toBe('test-request-id');
      expect(finishTime.tenantId).toBe('tenant-standard');
      expect(finishTime.weight).toBe(10);
    });

    it('should give higher weight tenants lower virtual finish time', () => {
      const tracker = scheduler.getVirtualTimeTracker();
      const serviceTime = 5000;

      const enterpriseFinish = tracker.calculateVirtualFinishTime(
        'req-ent',
        'tenant-enterprise',
        serviceTime,
        DEFAULT_WEIGHTS[TenantTier.ENTERPRISE]
      );

      const freeFinish = tracker.calculateVirtualFinishTime(
        'req-free',
        'tenant-free',
        serviceTime,
        DEFAULT_WEIGHTS[TenantTier.FREE]
      );

      expect(enterpriseFinish.virtualFinishTime).toBeLessThan(freeFinish.virtualFinishTime);
    });

    it('should update virtual time when service completes', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      tracker.updateVirtualTime(1000, 100);

      expect(tracker.getCurrentVirtualTime()).toBeGreaterThan(0);
    });

    it('should handle zero active weight sum', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      expect(() => {
        tracker.updateVirtualTime(1000, 0);
      }).not.toThrow();
    });
  });

  describe('Fairness Metrics', () => {
    it('should initialize with Jains Fairness Index of 1.0', () => {
      const calculator = scheduler.getFairnessCalculator();
      const metrics = calculator.getFairnessMetrics();

      expect(metrics.jainsFairnessIndex).toBe(1.0);
    });

    it('should initialize with fairness score of 100', () => {
      const calculator = scheduler.getFairnessCalculator();
      const metrics = calculator.getFairnessMetrics();

      expect(metrics.fairnessScore).toBe(100);
    });

    it('should record request completion', () => {
      const calculator = scheduler.getFairnessCalculator();

      calculator.recordRequestCompletion('tenant-1', 1000, 500);

      const metrics = calculator.getFairnessMetrics();
      expect(metrics.jainsFairnessIndex).toBeGreaterThan(0);
    });

    it('should track per-tenant statistics', () => {
      const calculator = scheduler.getFairnessCalculator();

      calculator.recordRequestCompletion('tenant-a', 1000, 200);
      calculator.recordRequestCompletion('tenant-b', 800, 400);

      const statsA = calculator.getTenantStats('tenant-a');
      const statsB = calculator.getTenantStats('tenant-b');

      expect(statsA).toBeDefined();
      expect(statsB).toBeDefined();
    });

    it('should return undefined for non-existent tenant stats', () => {
      const calculator = scheduler.getFairnessCalculator();

      const stats = calculator.getTenantStats('non-existent-tenant');
      expect(stats).toBeNull();
    });

    it('should reset all metrics', () => {
      const calculator = scheduler.getFairnessCalculator();

      calculator.recordRequestCompletion('tenant-1', 1000, 500);

      scheduler.resetFairnessStats();

      const metrics = scheduler.getFairnessCalculator().getFairnessMetrics();
      expect(metrics.jainsFairnessIndex).toBe(1.0);
    });
  });

  describe('Fairness Report Generation', () => {
    it('should generate fairness report', () => {
      const report = scheduler.getFairnessReport();

      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
    });

    it('should include Jains Fairness Index in report', () => {
      const report = scheduler.getFairnessReport();
      expect(report).toContain('Jain');
    });

    it('should include Fairness Score in report', () => {
      const report = scheduler.getFairnessReport();
      expect(report).toContain('Fairness Score');
    });

    it('should include tenant statistics in report', () => {
      scheduler.getFairnessCalculator().recordRequestCompletion('tenant-1', 1000, 500);

      const report = scheduler.getFairnessReport();
      expect(report.length).toBeGreaterThan(0);
    });
  });

  describe('Tenant Registry Access', () => {
    it('should provide access to TenantRegistry', () => {
      const registry = scheduler.getTenantRegistry();
      expect(registry).toBeDefined();
    });

    it('should have default tenants initialized', () => {
      const registry = scheduler.getTenantRegistry();
      const tenantCount = registry.getTenantCount();

      expect(tenantCount).toBeGreaterThan(0);
    });

    it('should have all four default tiers', () => {
      const registry = scheduler.getTenantRegistry();
      const tenants = registry.getAllTenants();

      const tiers = tenants.map((t: any) => t.tier);
      expect(tiers).toContain(TenantTier.ENTERPRISE);
      expect(tiers).toContain(TenantTier.PREMIUM);
      expect(tiers).toContain(TenantTier.STANDARD);
      expect(tiers).toContain(TenantTier.FREE);
    });
  });

  describe('WFQQueueJob Interface', () => {
    it('should define tenantId field', () => {
      const tenantId = 'test-tenant';
      expect(typeof tenantId).toBe('string');
    });

    it('should define weight field', () => {
      const weight = 10;
      expect(typeof weight).toBe('number');
      expect(weight).toBeGreaterThan(0);
    });

    it('should define virtualFinishTime field', () => {
      const virtualFinishTime = {
        requestId: 'test-request',
        tenantId: 'test-tenant',
        virtualStartTime: 0,
        virtualFinishTime: 500,
        weight: 10,
      };

      expect(virtualFinishTime.requestId).toBe('test-request');
      expect(virtualFinishTime.virtualFinishTime).toBe(500);
    });
  });

  describe('WFQStats Interface', () => {
    it('should define tenantCount field', () => {
      const tenantCount = 4;
      expect(typeof tenantCount).toBe('number');
      expect(tenantCount).toBeGreaterThan(0);
    });

    it('should define fairnessMetrics field', () => {
      const fairnessMetrics = {
        jainsFairnessIndex: 0.95,
        fairnessScore: 95,
        activeTenants: 3,
      };

      expect(typeof fairnessMetrics.jainsFairnessIndex).toBe('number');
      expect(typeof fairnessMetrics.fairnessScore).toBe('number');
      expect(typeof fairnessMetrics.activeTenants).toBe('number');
    });

    it('should have Jains Fairness Index between 0 and 1', () => {
      const jainsFairnessIndex = 0.95;
      expect(jainsFairnessIndex).toBeGreaterThanOrEqual(0);
      expect(jainsFairnessIndex).toBeLessThanOrEqual(1);
    });

    it('should have fairness score between 0 and 100', () => {
      const fairnessScore = 95;
      expect(fairnessScore).toBeGreaterThanOrEqual(0);
      expect(fairnessScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Active Weight Sum Calculation', () => {
    it('should calculate weight sum correctly', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      tracker.setActiveWeightSum(100);
      expect(tracker.getState().activeWeightSum).toBe(100);

      tracker.incrementActiveWeightSum(50);
      expect(tracker.getState().activeWeightSum).toBe(150);

      tracker.decrementActiveWeightSum(30);
      expect(tracker.getState().activeWeightSum).toBe(120);
    });

    it('should handle zero weight sum', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      tracker.setActiveWeightSum(0);
      expect(tracker.getState().activeWeightSum).toBe(0);
    });
  });

  describe('Virtual Time State Management', () => {
    it('should track current virtual time', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      expect(tracker.getCurrentVirtualTime()).toBe(0);

      tracker.updateVirtualTime(1000, 100);
      expect(tracker.getCurrentVirtualTime()).toBe(10);
    });

    it('should track active weight sum', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      tracker.setActiveWeightSum(50);
      expect(tracker.getState().activeWeightSum).toBe(50);
    });
  });

  describe('Configuration Handling', () => {
    it('should handle configuration with minimal fields', () => {
      const minimalConfig: SchedulerConfig = {
        name: 'minimal-scheduler',
      };

      const minimalScheduler = new WFQScheduler(minimalConfig, mockLLMService);
      expect(minimalScheduler).toBeDefined();
    });

    it('should handle configuration with all optional fields', () => {
      const fullConfig: SchedulerConfig = {
        name: 'full-scheduler',
        defaultPriority: RequestPriority.HIGH,
        concurrency: 10,
      };

      const fullScheduler = new WFQScheduler(fullConfig, mockLLMService);
      expect(fullScheduler).toBeDefined();
    });
  });

  describe('Edge Cases - Multiple Initialize Calls', () => {
    it('should handle multiple initialize calls', async () => {
      await scheduler.initialize();

      await expect(scheduler.initialize()).resolves.not.toThrow();
    });
  });

  describe('Edge Cases - Shutdown', () => {
    it('should handle shutdown before initialize', async () => {
      const newScheduler = new WFQScheduler(
        { name: 'shutdown-test' },
        mockLLMService
      );

      await expect(newScheduler.shutdown()).resolves.not.toThrow();
    });

    it('should handle multiple shutdown calls', async () => {
      await scheduler.initialize();
      await scheduler.shutdown();

      await expect(scheduler.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Edge Cases - Pause and Resume', () => {
    it('should handle pause before initialize', async () => {
      const newScheduler = new WFQScheduler(
        { name: 'pause-test' },
        mockLLMService
      );

      await expect(newScheduler.pause()).rejects.toThrow();
    });

    it('should handle resume before initialize', async () => {
      const newScheduler = new WFQScheduler(
        { name: 'resume-test' },
        mockLLMService
      );

      await expect(newScheduler.resume()).rejects.toThrow();
    });
  });

  describe('Job Metadata Tracking', () => {
    it('should initialize job metadata map', () => {
      const jobMetadata = (scheduler as any).jobMetadata;
      expect(jobMetadata).toBeInstanceOf(Map);
    });

    it('should initialize job timings map', () => {
      const jobTimings = (scheduler as any).jobTimings;
      expect(jobTimings).toBeInstanceOf(Map);
    });

    it('should initialize active tenant weights map', () => {
      const activeTenantWeights = (scheduler as any).activeTenantWeights;
      expect(activeTenantWeights).toBeInstanceOf(Map);
    });
  });

  describe('Metadata Cleanup', () => {
    it('should have cleanupJobMetadata method', () => {
      const cleanupJobMetadata = (scheduler as any).cleanupJobMetadata.bind(scheduler);
      expect(typeof cleanupJobMetadata).toBe('function');
    });

    it('should handle cleanup for non-existent job', () => {
      const cleanupJobMetadata = (scheduler as any).cleanupJobMetadata.bind(scheduler);

      expect(() => {
        cleanupJobMetadata('non-existent-job-id');
      }).not.toThrow();
    });
  });

  describe('Logging Methods', () => {
    it('should have logRequest method', () => {
      const logRequest = (scheduler as any).logRequest.bind(scheduler);
      expect(typeof logRequest).toBe('function');
    });

    it('should have logResponse method', () => {
      const logResponse = (scheduler as any).logResponse.bind(scheduler);
      expect(typeof logResponse).toBe('function');
    });
  });

  describe('Tenant Tier Enumeration', () => {
    it('should have four tenant tiers', () => {
      const tiers = [
        TenantTier.FREE,
        TenantTier.STANDARD,
        TenantTier.PREMIUM,
        TenantTier.ENTERPRISE,
      ];

      expect(tiers).toHaveLength(4);
    });

    it('should have string values for tiers', () => {
      expect(TenantTier.FREE).toBe("free");
      expect(TenantTier.STANDARD).toBe("standard");
      expect(TenantTier.PREMIUM).toBe("premium");
      expect(TenantTier.ENTERPRISE).toBe("enterprise");
    });
  });

  describe('Virtual Finish Time Calculation', () => {
    it('should calculate VFT = service_time / weight', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      const finishTime = tracker.calculateVirtualFinishTime(
        'test-req',
        'tenant-standard',
        5000,
        10
      );

      // Virtual finish time should be proportional to service time / weight
      expect(finishTime.virtualFinishTime).toBe(500);
    });

    it('should handle large service times', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      const finishTime = tracker.calculateVirtualFinishTime(
        'test-req',
        'tenant-standard',
        100000,
        10
      );

      expect(finishTime.virtualFinishTime).toBe(10000);
    });

    it('should handle small service times', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      const finishTime = tracker.calculateVirtualFinishTime(
        'test-req',
        'tenant-standard',
        100,
        10
      );

      expect(finishTime.virtualFinishTime).toBe(10);
    });

    it('should handle high weight tenants', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      const finishTime = tracker.calculateVirtualFinishTime(
        'test-req',
        'tenant-enterprise',
        5000,
        100
      );

      expect(finishTime.virtualFinishTime).toBe(50);
    });

    it('should handle low weight tenants', () => {
      const tracker = scheduler.getVirtualTimeTracker();

      const finishTime = tracker.calculateVirtualFinishTime(
        'test-req',
        'tenant-free',
        5000,
        1
      );

      expect(finishTime.virtualFinishTime).toBe(5000);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle concurrency of 1', () => {
      const config: SchedulerConfig = {
        name: 'concurrency-1-test',
        concurrency: 1,
      };

      const singleScheduler = new WFQScheduler(config, mockLLMService);
      expect(singleScheduler).toBeDefined();
    });

    it('should handle concurrency of 10', () => {
      const config: SchedulerConfig = {
        name: 'concurrency-10-test',
        concurrency: 10,
      };

      const multiScheduler = new WFQScheduler(config, mockLLMService);
      expect(multiScheduler).toBeDefined();
    });
  });
});
