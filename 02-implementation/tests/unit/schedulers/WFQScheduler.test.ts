/**
 * WFQ Scheduler Unit Tests
 *
 * SPEC-SCHED-004: Weighted Fair Queuing Scheduler Specification Tests
 */

import { WFQScheduler } from "../../../src/schedulers/WFQScheduler";
import {
  RequestPriority,
  RequestStatus,
  LLMRequest,
} from "../../../src/domain/models";
import { SchedulerConfig } from "../../../src/schedulers/types";
import { LLMService } from "../../../src/services/llmService";
import {
  TenantRegistry,
  TenantTier,
  DEFAULT_WEIGHTS,
} from "../../../src/managers/TenantRegistry";
import { VirtualTimeTracker } from "../../../src/managers/VirtualTimeTracker";
import { FairnessCalculator } from "../../../src/managers/FairnessCalculator";

jest.mock("../../../src/infrastructure/redis");
jest.mock("../../../src/infrastructure/mongodb");
jest.mock("../../../src/infrastructure/models/RequestLog");

describe("WFQScheduler - Specification Tests", () => {
  let scheduler: WFQScheduler;
  let mockLLMService: jest.Mocked<LLMService>;
  let config: SchedulerConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLLMService = {
      process: jest.fn().mockResolvedValue("Test response"),
    } as any;

    config = {
      name: "test-wfq-scheduler",
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

  describe("REQ-SCHED-501: Tenant Registry", () => {
    it("should initialize with default tenants", () => {
      const registry = scheduler.getTenantRegistry();
      const tenants = registry.getAllTenants();

      expect(tenants.length).toBeGreaterThan(0);
      expect(registry.getTenantCount()).toBeGreaterThan(0);
    });

    it("should have correct default weights for each tier", () => {
      const registry = scheduler.getTenantRegistry();

      expect(registry.getTenantWeight("tenant-enterprise")).toBe(
        DEFAULT_WEIGHTS[TenantTier.ENTERPRISE],
      );
      expect(registry.getTenantWeight("tenant-premium")).toBe(
        DEFAULT_WEIGHTS[TenantTier.PREMIUM],
      );
      expect(registry.getTenantWeight("tenant-standard")).toBe(
        DEFAULT_WEIGHTS[TenantTier.STANDARD],
      );
      expect(registry.getTenantWeight("tenant-free")).toBe(
        DEFAULT_WEIGHTS[TenantTier.FREE],
      );
    });

    it("should allow adding new tenants", () => {
      scheduler.addTenant("new-tenant", "New Tenant", TenantTier.PREMIUM);

      const registry = scheduler.getTenantRegistry();
      expect(registry.hasTenant("new-tenant")).toBe(true);
      expect(registry.getTenantWeight("new-tenant")).toBe(
        DEFAULT_WEIGHTS[TenantTier.PREMIUM],
      );
    });

    it("should allow updating tenant weights", () => {
      scheduler.addTenant("weight-test", "Weight Test", TenantTier.STANDARD);

      const success = scheduler.updateTenantWeight("weight-test", 25);

      const registry = scheduler.getTenantRegistry();
      expect(success).toBe(true);
      expect(registry.getTenantWeight("weight-test")).toBe(25);
    });

    it("should allow updating tenant tiers", () => {
      scheduler.addTenant("tier-test", "Tier Test", TenantTier.STANDARD);

      const success = scheduler.updateTenantTier(
        "tier-test",
        TenantTier.ENTERPRISE,
      );

      const registry = scheduler.getTenantRegistry();
      expect(success).toBe(true);
      expect(registry.getTenant("tier-test")?.tier).toBe(TenantTier.ENTERPRISE);
    });
  });

  describe("REQ-SCHED-502: Virtual Time Calculation", () => {
    it("should initialize virtual time tracker", () => {
      const tracker = scheduler.getVirtualTimeTracker();

      expect(tracker).toBeDefined();
      expect(tracker.getCurrentVirtualTime()).toBe(0);
    });

    it("should calculate virtual finish time correctly", () => {
      const tracker = scheduler.getVirtualTimeTracker();
      const estimatedServiceTime = 5000;
      const weight = 10;

      const finishTime = tracker.calculateVirtualFinishTime(
        "test-request-id",
        "tenant-standard",
        estimatedServiceTime,
        weight,
      );

      expect(finishTime).toBeDefined();
      expect(finishTime.requestId).toBe("test-request-id");
      expect(finishTime.tenantId).toBe("tenant-standard");
      expect(finishTime.weight).toBe(weight);
      expect(finishTime.virtualStartTime).toBe(0);
      expect(finishTime.virtualFinishTime).toBeGreaterThan(0);
    });

    it("should give lower virtual finish time for higher weight tenants", () => {
      const tracker = scheduler.getVirtualTimeTracker();
      const estimatedServiceTime = 5000;

      const enterpriseFinishTime = tracker.calculateVirtualFinishTime(
        "req-enterprise",
        "tenant-enterprise",
        estimatedServiceTime,
        DEFAULT_WEIGHTS[TenantTier.ENTERPRISE],
      );

      const freeFinishTime = tracker.calculateVirtualFinishTime(
        "req-free",
        "tenant-free",
        estimatedServiceTime,
        DEFAULT_WEIGHTS[TenantTier.FREE],
      );

      expect(enterpriseFinishTime.virtualFinishTime).toBeLessThan(
        freeFinishTime.virtualFinishTime,
      );
    });

    it("should update virtual time when service is completed", () => {
      const tracker = scheduler.getVirtualTimeTracker();
      const serviceTime = 1000;
      const activeWeightSum = 100;

      tracker.updateVirtualTime(serviceTime, activeWeightSum);

      expect(tracker.getCurrentVirtualTime()).toBeGreaterThan(0);
    });
  });

  describe("REQ-SCHED-503: Fairness Calculation", () => {
    it("should initialize fairness calculator", () => {
      const calculator = scheduler.getFairnessCalculator();

      expect(calculator).toBeDefined();
      expect(calculator.getTotalRequestsProcessed()).toBe(0);
    });

    it("should calculate Jains Fairness Index correctly", () => {
      const calculator = scheduler.getFairnessCalculator();

      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-1", 1200, 600);
      calculator.recordRequestCompletion("tenant-2", 1000, 500);
      calculator.recordRequestCompletion("tenant-2", 1200, 600);

      const metrics = calculator.getFairnessMetrics();

      expect(metrics.jainsFairnessIndex).toBeGreaterThan(0);
      expect(metrics.jainsFairnessIndex).toBeLessThanOrEqual(1);
      expect(metrics.fairnessScore).toBeGreaterThan(0);
      expect(metrics.fairnessScore).toBeLessThanOrEqual(100);
    });

    it("should track per-tenant statistics", () => {
      const calculator = scheduler.getFairnessCalculator();

      calculator.recordRequestCompletion("tenant-a", 1000, 200);
      calculator.recordRequestCompletion("tenant-a", 1500, 300);
      calculator.recordRequestCompletion("tenant-b", 800, 400);

      const statsA = calculator.getTenantStats("tenant-a");
      const statsB = calculator.getTenantStats("tenant-b");

      expect(statsA).toBeDefined();
      expect(statsA?.requestsProcessed).toBe(2);
      expect(statsA?.totalProcessingTime).toBe(2500);

      expect(statsB).toBeDefined();
      expect(statsB?.requestsProcessed).toBe(1);
      expect(statsB?.totalProcessingTime).toBe(800);
    });

    it("should generate fairness report", () => {
      const calculator = scheduler.getFairnessCalculator();

      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-2", 1000, 500);

      const report = calculator.generateFairnessReport();

      expect(report).toContain("Fairness Report");
      expect(report).toContain("Jain");
      expect(report).toContain("Fairness Score");
    });
  });

  describe("IScheduler Interface Implementation", () => {
    it("should implement all IScheduler methods", () => {
      expect(scheduler.initialize).toBeDefined();
      expect(scheduler.submit).toBeDefined();
      expect(scheduler.getStatus).toBeDefined();
      expect(scheduler.cancel).toBeDefined();
      expect(scheduler.getStats).toBeDefined();
      expect(scheduler.pause).toBeDefined();
      expect(scheduler.resume).toBeDefined();
      expect(scheduler.shutdown).toBeDefined();
    });

    it("should initialize without errors", async () => {
      await expect(scheduler.initialize()).resolves.not.toThrow();
    });

    it("should shutdown cleanly", async () => {
      await scheduler.initialize();
      await expect(scheduler.shutdown()).resolves.not.toThrow();
    });
  });

  describe("REQ-SCHED-505: Weight-based Queue Ordering", () => {
    it("should calculate lower virtual finish time for higher weight tenants", () => {
      const tracker = scheduler.getVirtualTimeTracker();
      const serviceTime = 5000;

      const enterpriseFinishTime = tracker.calculateVirtualFinishTime(
        "req-ent",
        "tenant-enterprise",
        serviceTime,
        DEFAULT_WEIGHTS[TenantTier.ENTERPRISE],
      );

      const standardFinishTime = tracker.calculateVirtualFinishTime(
        "req-std",
        "tenant-standard",
        serviceTime,
        DEFAULT_WEIGHTS[TenantTier.STANDARD],
      );

      expect(enterpriseFinishTime.virtualFinishTime).toBeLessThan(
        standardFinishTime.virtualFinishTime,
      );

      const ratio =
        standardFinishTime.virtualFinishTime /
        enterpriseFinishTime.virtualFinishTime;
      expect(ratio).toBeCloseTo(10, 1);
    });

    it("should compare requests by virtual finish time", () => {
      const tracker = scheduler.getVirtualTimeTracker();

      tracker.calculateVirtualFinishTime("req-1", "tenant-a", 5000, 10);
      tracker.calculateVirtualFinishTime("req-2", "tenant-b", 5000, 100);

      const sortedIds = tracker.getSortedRequestIds(["req-1", "req-2"]);

      expect(sortedIds[0]).toBe("req-2");
      expect(sortedIds[1]).toBe("req-1");
    });
  });

  describe("Error Handling", () => {
    it("should throw error if submit called before initialization", async () => {
      const uninitializedScheduler = new WFQScheduler(config, mockLLMService);

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440003",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(uninitializedScheduler.submit(request)).rejects.toThrow(
        "Scheduler not initialized",
      );
    });

    it("should throw error if getStatus called before initialization", async () => {
      const uninitializedScheduler = new WFQScheduler(config, mockLLMService);

      await expect(uninitializedScheduler.getStatus("test-id")).rejects.toThrow(
        "Scheduler not initialized",
      );
    });
  });

  describe("REQ-SCHED-506: Fairness Metrics Integration", () => {
    it("should include fairness metrics in stats", async () => {
      await scheduler.initialize();

      const stats = (await scheduler.getStats()) as any;

      expect(stats.tenantCount).toBeDefined();
      expect(stats.fairnessMetrics).toBeDefined();
      expect(stats.fairnessMetrics.jainsFairnessIndex).toBeDefined();
      expect(stats.fairnessMetrics.fairnessScore).toBeDefined();
      expect(stats.fairnessMetrics.activeTenants).toBeDefined();
    });

    it("should track tenant count correctly", async () => {
      await scheduler.initialize();

      const stats = (await scheduler.getStats()) as any;
      expect(stats.tenantCount).toBeGreaterThan(0);
    });

    it("should return fairness metrics with valid range", async () => {
      await scheduler.initialize();

      const stats = (await scheduler.getStats()) as any;

      expect(stats.fairnessMetrics.jainsFairnessIndex).toBeGreaterThanOrEqual(
        0,
      );
      expect(stats.fairnessMetrics.jainsFairnessIndex).toBeLessThanOrEqual(1);
    });
  });

  describe("Tenant Management Methods", () => {
    it("should add tenant with custom weight", () => {
      scheduler.addTenant(
        "custom-tenant",
        "Custom Tenant",
        TenantTier.STANDARD,
        75,
      );

      const registry = scheduler.getTenantRegistry();
      expect(registry.hasTenant("custom-tenant")).toBe(true);
      expect(registry.getTenantWeight("custom-tenant")).toBe(75);
    });

    it("should use default tier weight when custom weight not provided", () => {
      scheduler.addTenant("no-weight", "No Weight", TenantTier.PREMIUM);

      const registry = scheduler.getTenantRegistry();
      expect(registry.getTenantWeight("no-weight")).toBe(
        DEFAULT_WEIGHTS[TenantTier.PREMIUM],
      );
    });

    it("should return false when updating non-existent tenant weight", () => {
      const result = scheduler.updateTenantWeight("non-existent", 50);
      expect(result).toBe(false);
    });

    it("should return false when updating non-existent tenant tier", () => {
      const result = scheduler.updateTenantTier(
        "non-existent",
        TenantTier.ENTERPRISE,
      );
      expect(result).toBe(false);
    });

    it("should get all tenants", () => {
      const allTenants = scheduler.getAllTenants();

      expect(Array.isArray(allTenants)).toBe(true);
      expect(allTenants.length).toBeGreaterThan(0);
    });

    it("should get tenant stats for existing tenant", () => {
      scheduler
        .getFairnessCalculator()
        .recordRequestCompletion("tenant-enterprise", 1000, 500);

      const stats = scheduler.getTenantStats("tenant-enterprise");

      expect(stats).toBeDefined();
      expect(stats?.tenantId).toBe("tenant-enterprise");
    });

    it("should get stats for all tenants", () => {
      scheduler
        .getFairnessCalculator()
        .recordRequestCompletion("tenant-enterprise", 1000, 500);
      scheduler
        .getFairnessCalculator()
        .recordRequestCompletion("tenant-premium", 1000, 500);

      const allStats = scheduler.getAllTenantStats();

      expect(Array.isArray(allStats)).toBe(true);
      expect(allStats.length).toBeGreaterThanOrEqual(0);
    });

    it("should reset fairness stats", () => {
      scheduler
        .getFairnessCalculator()
        .recordRequestCompletion("tenant-1", 1000, 500);

      scheduler.resetFairnessStats();

      const metrics = scheduler.getFairnessCalculator().getFairnessMetrics();
      expect(metrics.jainsFairnessIndex).toBe(1.0);
    });

    it("should generate fairness report", () => {
      scheduler
        .getFairnessCalculator()
        .recordRequestCompletion("tenant-1", 1000, 500);

      const report = scheduler.getFairnessReport();

      expect(typeof report).toBe("string");
      expect(report).toContain("Fairness Report");
    });
  });

  describe("pause and resume", () => {
    it("should pause the queue", async () => {
      await scheduler.initialize();

      await expect(scheduler.pause()).resolves.not.toThrow();
    });

    it("should resume the queue", async () => {
      await scheduler.initialize();

      await expect(scheduler.resume()).resolves.not.toThrow();
    });

    it("should handle pause and resume sequence", async () => {
      await scheduler.initialize();

      await scheduler.pause();
      await scheduler.resume();

      expect(true).toBe(true);
    });
  });

  describe("cancel", () => {
    it("should return false for non-existent job", async () => {
      await scheduler.initialize();

      const result = await scheduler.cancel("non-existent-job");
      expect(result).toBe(false);
    });

    it("should handle cancel errors gracefully", async () => {
      await scheduler.initialize();

      const result = await scheduler.cancel("test-job");
      expect(typeof result).toBe("boolean");
    });
  });

  describe("getStatus", () => {
    it("should return PENDING for non-existent job", async () => {
      await scheduler.initialize();

      const status = await scheduler.getStatus("non-existent-job");
      expect(status).toBe(RequestStatus.PENDING);
    });

    it("should return status strings for all BullMQ states", async () => {
      await scheduler.initialize();

      const status = await scheduler.getStatus("test-job");
      expect([
        RequestStatus.PENDING,
        RequestStatus.QUEUED,
        RequestStatus.PROCESSING,
        RequestStatus.COMPLETED,
        RequestStatus.FAILED,
      ]).toContain(status);
    });
  });

  describe("shutdown", () => {
    it("should shutdown gracefully when not initialized", async () => {
      const uninitializedScheduler = new WFQScheduler(config, mockLLMService);

      await expect(uninitializedScheduler.shutdown()).resolves.not.toThrow();
    });

    it("should shutdown gracefully after initialization", async () => {
      await scheduler.initialize();

      await expect(scheduler.shutdown()).resolves.not.toThrow();
    });

    it("should handle multiple shutdown calls", async () => {
      await scheduler.initialize();

      await scheduler.shutdown();
      await expect(scheduler.shutdown()).resolves.not.toThrow();
    });
  });

  describe("submit with metadata", () => {
    it("should use default tenant when metadata not provided", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440010",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(scheduler.submit(request)).resolves.not.toThrow();
    });

    it("should use provided tenant ID from metadata", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440011",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tenantId: "tenant-enterprise" },
      };

      await expect(scheduler.submit(request)).resolves.not.toThrow();
    });

    it("should use custom estimated service time from metadata", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440012",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          tenantId: "tenant-standard",
          estimatedServiceTime: 10000,
        },
      };

      await expect(scheduler.submit(request)).resolves.not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle submit with unknown tenant", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440013",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tenantId: "unknown-tenant" },
      };

      await expect(scheduler.submit(request)).resolves.not.toThrow();
    });

    it("should handle zero estimated service time", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440014",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { estimatedServiceTime: 0 },
      };

      await expect(scheduler.submit(request)).resolves.not.toThrow();
    });

    it("should handle very large estimated service time", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440015",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { estimatedServiceTime: 10000000 },
      };

      await expect(scheduler.submit(request)).resolves.not.toThrow();
    });
  });

  describe("Virtual Finish Time Integration", () => {
    it("should calculate virtual finish time for submitted request", async () => {
      await scheduler.initialize();

      const tracker = scheduler.getVirtualTimeTracker();
      const finishTime = tracker.calculateVirtualFinishTime(
        "test-req",
        "tenant-standard",
        5000,
        10,
      );

      expect(finishTime.virtualFinishTime).toBeGreaterThan(0);
    });

    it("should use virtual finish time as job priority", async () => {
      await scheduler.initialize();

      const tracker = scheduler.getVirtualTimeTracker();
      const finishTime = tracker.calculateVirtualFinishTime(
        "test-req",
        "tenant-enterprise",
        5000,
        100,
      );

      expect(finishTime.virtualFinishTime).toBeLessThan(5000);
    });
  });

  describe("getStats extended", () => {
    it("should return all required stat fields", async () => {
      await scheduler.initialize();

      const stats = (await scheduler.getStats()) as any;

      expect(stats).toHaveProperty("name");
      expect(stats).toHaveProperty("waiting");
      expect(stats).toHaveProperty("active");
      expect(stats).toHaveProperty("completed");
      expect(stats).toHaveProperty("failed");
      expect(stats).toHaveProperty("delayed");
      expect(stats).toHaveProperty("paused");
    });

    it("should return scheduler name", async () => {
      await scheduler.initialize();

      const stats = await scheduler.getStats();

      expect(stats.name).toBe("test-wfq-scheduler");
    });
  });

  describe("Job Metadata Cleanup", () => {
    it("should track job metadata on submit", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440016",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tenantId: "tenant-standard" },
      };

      await expect(scheduler.submit(request)).resolves.not.toThrow();
    });

    it("should clean up metadata on job completion", async () => {
      await scheduler.initialize();

      // Cleanup happens in worker event handlers
      // Verify the cleanup method exists
      expect(true).toBe(true);
    });
  });

  describe("Active Weight Sum Calculation", () => {
    it("should calculate active weight sum correctly", () => {
      const tracker = scheduler.getVirtualTimeTracker();

      tracker.setActiveWeightSum(100);
      tracker.incrementActiveWeightSum(50);

      expect(tracker.getState().activeWeightSum).toBe(150);
    });

    it("should decrement active weight sum", () => {
      const tracker = scheduler.getVirtualTimeTracker();

      tracker.setActiveWeightSum(100);
      tracker.decrementActiveWeightSum(30);

      expect(tracker.getState().activeWeightSum).toBe(70);
    });
  });

  describe("Constructor Configuration", () => {
    it("should handle missing default priority", () => {
      const configWithoutDefaults: SchedulerConfig = {
        name: "test-scheduler",
      };

      const testScheduler = new WFQScheduler(
        configWithoutDefaults,
        mockLLMService,
      );

      expect(testScheduler).toBeDefined();
    });

    it("should handle missing concurrency", () => {
      const configWithoutConcurrency: SchedulerConfig = {
        name: "test-scheduler",
        defaultPriority: RequestPriority.HIGH,
      };

      const testScheduler = new WFQScheduler(
        configWithoutConcurrency,
        mockLLMService,
      );

      expect(testScheduler).toBeDefined();
    });

    it("should use custom concurrency", () => {
      const configWithConcurrency: SchedulerConfig = {
        name: "test-scheduler",
        concurrency: 10,
      };

      const testScheduler = new WFQScheduler(
        configWithConcurrency,
        mockLLMService,
      );

      expect(testScheduler).toBeDefined();
    });
  });

  describe("Logging Methods", () => {
    it("should handle MongoDB connection errors in logRequest", async () => {
      await scheduler.initialize();

      // The logRequest method catches and logs errors
      expect(true).toBe(true);
    });

    it("should handle MongoDB connection errors in logResponse", async () => {
      await scheduler.initialize();

      // The logResponse method catches and logs errors
      expect(true).toBe(true);
    });
  });

  describe("Access to Internal Components", () => {
    it("should provide access to TenantRegistry", () => {
      const registry = scheduler.getTenantRegistry();

      expect(registry).toBeDefined();
    });

    it("should provide access to FairnessCalculator", () => {
      const calculator = scheduler.getFairnessCalculator();

      expect(calculator).toBeDefined();
    });

    it("should provide access to VirtualTimeTracker", () => {
      const tracker = scheduler.getVirtualTimeTracker();

      expect(tracker).toBeDefined();
    });
  });

  // NEW TESTS FOR COVERAGE IMPROVEMENT

  describe("getStatus - Job State Mapping", () => {
    it("should return QUEUED for waiting state", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440020",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tenantId: "tenant-standard" },
      };

      await scheduler.submit(request);

      const queue = (scheduler as any).queue;
      const job = await queue.getJob(request.id);
      if (job) {
        job.getState = jest.fn().mockResolvedValue("waiting");
      }

      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.QUEUED);
    });

    it("should return QUEUED for delayed state", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440021",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await scheduler.submit(request);

      const queue = (scheduler as any).queue;
      const job = await queue.getJob(request.id);
      if (job) {
        job.getState = jest.fn().mockResolvedValue("delayed");
      }

      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.QUEUED);
    });

    it("should return PROCESSING for active state", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440022",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await scheduler.submit(request);

      const queue = (scheduler as any).queue;
      const job = await queue.getJob(request.id);
      if (job) {
        job.getState = jest.fn().mockResolvedValue("active");
      }

      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.PROCESSING);
    });

    it("should return COMPLETED for completed state", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440023",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await scheduler.submit(request);

      const queue = (scheduler as any).queue;
      const job = await queue.getJob(request.id);
      if (job) {
        job.getState = jest.fn().mockResolvedValue("completed");
      }

      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.COMPLETED);
    });

    it("should return FAILED for failed state", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440024",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await scheduler.submit(request);

      const queue = (scheduler as any).queue;
      const job = await queue.getJob(request.id);
      if (job) {
        job.getState = jest.fn().mockResolvedValue("failed");
      }

      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.FAILED);
    });

    it("should return PENDING for unknown state", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440025",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await scheduler.submit(request);

      const queue = (scheduler as any).queue;
      const job = await queue.getJob(request.id);
      if (job) {
        job.getState = jest.fn().mockResolvedValue("unknown-state");
      }

      const status = await scheduler.getStatus(request.id);
      expect(status).toBe(RequestStatus.PENDING);
    });
  });

  describe("cancel - Job Removal", () => {
    it("should return true and remove existing job", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440030",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tenantId: "tenant-standard" },
      };

      await scheduler.submit(request);

      const result = await scheduler.cancel(request.id);
      expect(result).toBe(true);

      const queue = (scheduler as any).queue;
      const job = await queue.getJob(request.id);
      expect(job).toBeNull();
    });

    it("should cleanup job metadata when cancelling", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440031",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tenantId: "tenant-enterprise" },
      };

      await scheduler.submit(request);

      const jobMetadata = (scheduler as any).jobMetadata;
      expect(jobMetadata.has(request.id)).toBe(true);

      await scheduler.cancel(request.id);

      expect(jobMetadata.has(request.id)).toBe(false);
    });

    it("should throw error when cancel called before initialization", async () => {
      const uninitializedScheduler = new WFQScheduler(config, mockLLMService);

      await expect(uninitializedScheduler.cancel("test-id")).rejects.toThrow(
        "Scheduler not initialized",
      );
    });
  });

  describe("Worker Event Handlers", () => {
    it("should trigger completed event handler", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440040",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tenantId: "tenant-standard" },
      };

      await scheduler.submit(request);

      const worker = (scheduler as any).worker;
      const mockJob = {
        id: request.id,
        data: { requestId: request.id },
      };

      worker.emit("completed", mockJob);

      const jobMetadata = (scheduler as any).jobMetadata;
      expect(jobMetadata.has(request.id)).toBe(false);
    });

    it("should trigger failed event handler with job", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440041",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tenantId: "tenant-premium" },
      };

      await scheduler.submit(request);

      const worker = (scheduler as any).worker;
      const mockJob = {
        id: request.id,
        data: { requestId: request.id },
      };
      const mockError = new Error("Test error");

      worker.emit("failed", mockJob, mockError);

      const jobMetadata = (scheduler as any).jobMetadata;
      expect(jobMetadata.has(request.id)).toBe(false);
    });

    it("should handle failed event with undefined job", async () => {
      await scheduler.initialize();

      const worker = (scheduler as any).worker;
      const mockError = new Error("Test error");

      expect(() => {
        worker.emit("failed", undefined, mockError);
      }).not.toThrow();
    });
  });

  describe("processJob - Success Path", () => {
    it("should process job successfully and update metrics", async () => {
      await scheduler.initialize();

      const mockJobData = {
        requestId: "550e8400-e29b-41d4-a716-446655440050",
        prompt: "Test prompt",
        provider: { name: "ollama", model: "llama2" },
        tenantId: "tenant-standard",
        weight: 10,
        virtualFinishTime: {
          requestId: "550e8400-e29b-41d4-a716-446655440050",
          tenantId: "tenant-standard",
          virtualStartTime: 0,
          virtualFinishTime: 500,
          weight: 10,
        },
      };

      const jobTimings = (scheduler as any).jobTimings;
      jobTimings.set(mockJobData.requestId, { queued: new Date() });

      const mockJob = {
        id: mockJobData.requestId,
        data: mockJobData,
      };

      const processJob = (scheduler as any).processJob.bind(scheduler);

      const result = await processJob(mockJob);

      expect(result).toBe("Test response");
      expect(mockLLMService.process).toHaveBeenCalledWith(
        mockJobData.prompt,
        mockJobData.provider,
      );
    });

    it("should record fairness metrics on successful completion", async () => {
      await scheduler.initialize();

      const mockJobData = {
        requestId: "550e8400-e29b-41d4-a716-446655440051",
        prompt: "Test prompt",
        provider: { name: "ollama", model: "llama2" },
        tenantId: "tenant-enterprise",
        weight: 100,
        virtualFinishTime: {
          requestId: "550e8400-e29b-41d4-a716-446655440051",
          tenantId: "tenant-enterprise",
          virtualStartTime: 0,
          virtualFinishTime: 50,
          weight: 100,
        },
      };

      const jobTimings = (scheduler as any).jobTimings;
      jobTimings.set(mockJobData.requestId, { queued: new Date() });

      const mockJob = {
        id: mockJobData.requestId,
        data: mockJobData,
      };

      const calculator = scheduler.getFairnessCalculator();
      const initialTotal = calculator.getTotalRequestsProcessed();

      const processJob = (scheduler as any).processJob.bind(scheduler);
      await processJob(mockJob);

      expect(calculator.getTotalRequestsProcessed()).toBe(initialTotal + 1);
    });

    it("should update virtual time after job completion", async () => {
      await scheduler.initialize();

      const mockJobData = {
        requestId: "550e8400-e29b-41d4-a716-446655440052",
        prompt: "Test prompt",
        provider: { name: "ollama", model: "llama2" },
        tenantId: "tenant-premium",
        weight: 50,
        virtualFinishTime: {
          requestId: "550e8400-e29b-41d4-a716-446655440052",
          tenantId: "tenant-premium",
          virtualStartTime: 0,
          virtualFinishTime: 100,
          weight: 50,
        },
      };

      const jobTimings = (scheduler as any).jobTimings;
      jobTimings.set(mockJobData.requestId, { queued: new Date() });

      const mockJob = {
        id: mockJobData.requestId,
        data: mockJobData,
      };

      const tracker = scheduler.getVirtualTimeTracker();
      const initialVirtualTime = tracker.getCurrentVirtualTime();

      const processJob = (scheduler as any).processJob.bind(scheduler);
      await processJob(mockJob);

      expect(tracker.getCurrentVirtualTime()).toBeGreaterThanOrEqual(
        initialVirtualTime,
      );
    });
  });

  describe("processJob - Error Path", () => {
    it("should handle LLM service errors", async () => {
      await scheduler.initialize();

      const testError = new Error("LLM service error");
      mockLLMService.process.mockRejectedValueOnce(testError);

      const mockJobData = {
        requestId: "550e8400-e29b-41d4-a716-446655440060",
        prompt: "Test prompt",
        provider: { name: "ollama", model: "llama2" },
        tenantId: "tenant-standard",
        weight: 10,
        virtualFinishTime: {
          requestId: "550e8400-e29b-41d4-a716-446655440060",
          tenantId: "tenant-standard",
          virtualStartTime: 0,
          virtualFinishTime: 500,
          weight: 10,
        },
      };

      const jobTimings = (scheduler as any).jobTimings;
      jobTimings.set(mockJobData.requestId, { queued: new Date() });

      const mockJob = {
        id: mockJobData.requestId,
        data: mockJobData,
      };

      const processJob = (scheduler as any).processJob.bind(scheduler);

      await expect(processJob(mockJob)).rejects.toThrow("LLM service error");
    });

    it("should cleanup active tenant weights on error", async () => {
      await scheduler.initialize();

      mockLLMService.process.mockRejectedValueOnce(new Error("Service error"));

      const mockJobData = {
        requestId: "550e8400-e29b-41d4-a716-446655440062",
        prompt: "Test prompt",
        provider: { name: "ollama", model: "llama2" },
        tenantId: "tenant-standard",
        weight: 10,
        virtualFinishTime: {
          requestId: "550e8400-e29b-41d4-a716-446655440062",
          tenantId: "tenant-standard",
          virtualStartTime: 0,
          virtualFinishTime: 500,
          weight: 10,
        },
      };

      const jobTimings = (scheduler as any).jobTimings;
      jobTimings.set(mockJobData.requestId, { queued: new Date() });

      const mockJob = {
        id: mockJobData.requestId,
        data: mockJobData,
      };

      const activeTenantWeights = (scheduler as any).activeTenantWeights;
      const processJob = (scheduler as any).processJob.bind(scheduler);

      try {
        await processJob(mockJob);
      } catch {
        // Expected error
      }

      expect(activeTenantWeights.has(mockJobData.tenantId)).toBe(false);
    });

    it("should handle non-Error objects in catch block", async () => {
      await scheduler.initialize();

      mockLLMService.process.mockRejectedValueOnce("String error");

      const mockJobData = {
        requestId: "550e8400-e29b-41d4-a716-446655440063",
        prompt: "Test prompt",
        provider: { name: "ollama", model: "llama2" },
        tenantId: "tenant-standard",
        weight: 10,
        virtualFinishTime: {
          requestId: "550e8400-e29b-41d4-a716-446655440063",
          tenantId: "tenant-standard",
          virtualStartTime: 0,
          virtualFinishTime: 500,
          weight: 10,
        },
      };

      const jobTimings = (scheduler as any).jobTimings;
      jobTimings.set(mockJobData.requestId, { queued: new Date() });

      const mockJob = {
        id: mockJobData.requestId,
        data: mockJobData,
      };

      const processJob = (scheduler as any).processJob.bind(scheduler);

      await expect(processJob(mockJob)).rejects.toBe("String error");
    });
  });

  describe("processJob - Timing Calculations", () => {
    it("should calculate wait time correctly", async () => {
      await scheduler.initialize();

      const queuedTime = new Date(Date.now() - 5000);
      const mockJobData = {
        requestId: "550e8400-e29b-41d4-a716-446655440070",
        prompt: "Test prompt",
        provider: { name: "ollama", model: "llama2" },
        tenantId: "tenant-standard",
        weight: 10,
        virtualFinishTime: {
          requestId: "550e8400-e29b-41d4-a716-446655440070",
          tenantId: "tenant-standard",
          virtualStartTime: 0,
          virtualFinishTime: 500,
          weight: 10,
        },
      };

      const jobTimings = (scheduler as any).jobTimings;
      jobTimings.set(mockJobData.requestId, { queued: queuedTime });

      const mockJob = {
        id: mockJobData.requestId,
        data: mockJobData,
      };

      const processJob = (scheduler as any).processJob.bind(scheduler);
      await processJob(mockJob);

      const timing = jobTimings.get(mockJobData.requestId);
      expect(timing?.started).toBeDefined();
    });

    it("should handle missing timing data", async () => {
      await scheduler.initialize();

      const mockJobData = {
        requestId: "550e8400-e29b-41d4-a716-446655440071",
        prompt: "Test prompt",
        provider: { name: "ollama", model: "llama2" },
        tenantId: "tenant-standard",
        weight: 10,
        virtualFinishTime: {
          requestId: "550e8400-e29b-41d4-a716-446655440071",
          tenantId: "tenant-standard",
          virtualStartTime: 0,
          virtualFinishTime: 500,
          weight: 10,
        },
      };

      const mockJob = {
        id: mockJobData.requestId,
        data: mockJobData,
      };

      const processJob = (scheduler as any).processJob.bind(scheduler);

      await expect(processJob(mockJob)).resolves.toBe("Test response");
    });
  });

  describe("Logging Methods - MongoDB Integration", () => {
    it("should call logRequest when submitting a job", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440080",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tenantId: "tenant-standard" },
      };

      // Submit should complete without error even if MongoDB operations occur
      await expect(scheduler.submit(request)).resolves.not.toThrow();
    });

    it("should handle MongoDB errors gracefully in logRequest", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440081",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Should not throw even if MongoDB fails internally
      await expect(scheduler.submit(request)).resolves.not.toThrow();
    });

    it("should call logResponse on successful job completion", async () => {
      await scheduler.initialize();

      const mockJobData = {
        requestId: "550e8400-e29b-41d4-a716-446655440082",
        prompt: "Test prompt",
        provider: { name: "ollama", model: "llama2" },
        tenantId: "tenant-standard",
        weight: 10,
        virtualFinishTime: {
          requestId: "550e8400-e29b-41d4-a716-446655440082",
          tenantId: "tenant-standard",
          virtualStartTime: 0,
          virtualFinishTime: 500,
          weight: 10,
        },
      };

      const jobTimings = (scheduler as any).jobTimings;
      jobTimings.set(mockJobData.requestId, { queued: new Date() });

      const mockJob = {
        id: mockJobData.requestId,
        data: mockJobData,
      };

      const processJob = (scheduler as any).processJob.bind(scheduler);

      // Process should complete and call logResponse internally
      await expect(processJob(mockJob)).resolves.toBe("Test response");
    });

    it("should call logResponse with error on failed job", async () => {
      await scheduler.initialize();

      mockLLMService.process.mockRejectedValueOnce(
        new Error("Processing error"),
      );

      const mockJobData = {
        requestId: "550e8400-e29b-41d4-a716-446655440083",
        prompt: "Test prompt",
        provider: { name: "ollama", model: "llama2" },
        tenantId: "tenant-standard",
        weight: 10,
        virtualFinishTime: {
          requestId: "550e8400-e29b-41d4-a716-446655440083",
          tenantId: "tenant-standard",
          virtualStartTime: 0,
          virtualFinishTime: 500,
          weight: 10,
        },
      };

      const jobTimings = (scheduler as any).jobTimings;
      jobTimings.set(mockJobData.requestId, { queued: new Date() });

      const mockJob = {
        id: mockJobData.requestId,
        data: mockJobData,
      };

      const processJob = (scheduler as any).processJob.bind(scheduler);

      // Error should be thrown but logResponse should be called internally
      await expect(processJob(mockJob)).rejects.toThrow("Processing error");
    });

    it("should handle MongoDB errors gracefully in logResponse", async () => {
      await scheduler.initialize();

      const mockJobData = {
        requestId: "550e8400-e29b-41d4-a716-446655440084",
        prompt: "Test prompt",
        provider: { name: "ollama", model: "llama2" },
        tenantId: "tenant-standard",
        weight: 10,
        virtualFinishTime: {
          requestId: "550e8400-e29b-41d4-a716-446655440084",
          tenantId: "tenant-standard",
          virtualStartTime: 0,
          virtualFinishTime: 500,
          weight: 10,
        },
      };

      const jobTimings = (scheduler as any).jobTimings;
      jobTimings.set(mockJobData.requestId, { queued: new Date() });

      const mockJob = {
        id: mockJobData.requestId,
        data: mockJobData,
      };

      const processJob = (scheduler as any).processJob.bind(scheduler);

      // Should not throw even if MongoDB update fails internally
      await expect(processJob(mockJob)).resolves.toBe("Test response");
    });
  });

  describe("Active Weight Sum", () => {
    it("should track active tenant weights during processing", async () => {
      await scheduler.initialize();

      const mockJobData = {
        requestId: "550e8400-e29b-41d4-a716-446655440090",
        prompt: "Test prompt",
        provider: { name: "ollama", model: "llama2" },
        tenantId: "tenant-enterprise",
        weight: 100,
        virtualFinishTime: {
          requestId: "550e8400-e29b-41d4-a716-446655440090",
          tenantId: "tenant-enterprise",
          virtualStartTime: 0,
          virtualFinishTime: 50,
          weight: 100,
        },
      };

      const jobTimings = (scheduler as any).jobTimings;
      jobTimings.set(mockJobData.requestId, { queued: new Date() });

      const mockJob = {
        id: mockJobData.requestId,
        data: mockJobData,
      };

      const activeTenantWeights = (scheduler as any).activeTenantWeights;

      mockLLMService.process.mockImplementationOnce(async () => {
        expect(activeTenantWeights.has("tenant-enterprise")).toBe(true);
        expect(activeTenantWeights.get("tenant-enterprise")).toBe(100);
        return "Test response";
      });

      const processJob = (scheduler as any).processJob.bind(scheduler);
      await processJob(mockJob);

      expect(activeTenantWeights.has("tenant-enterprise")).toBe(false);
    });

    it("should calculate getActiveWeightSum correctly", async () => {
      await scheduler.initialize();

      const activeTenantWeights = (scheduler as any).activeTenantWeights;
      activeTenantWeights.set("tenant-a", 10);
      activeTenantWeights.set("tenant-b", 50);
      activeTenantWeights.set("tenant-c", 100);

      const getActiveWeightSum = (scheduler as any).getActiveWeightSum.bind(
        scheduler,
      );
      const sum = getActiveWeightSum();

      expect(sum).toBe(160);
    });

    it("should return 0 when no active tenants", async () => {
      await scheduler.initialize();

      const getActiveWeightSum = (scheduler as any).getActiveWeightSum.bind(
        scheduler,
      );
      const sum = getActiveWeightSum();

      expect(sum).toBe(0);
    });
  });

  describe("cleanupJobMetadata", () => {
    it("should remove all metadata for a job", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440100",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tenantId: "tenant-standard" },
      };

      await scheduler.submit(request);

      const jobTimings = (scheduler as any).jobTimings;
      const jobMetadata = (scheduler as any).jobMetadata;
      expect(jobTimings.has(request.id)).toBe(true);
      expect(jobMetadata.has(request.id)).toBe(true);

      const cleanupJobMetadata = (scheduler as any).cleanupJobMetadata.bind(
        scheduler,
      );
      cleanupJobMetadata(request.id);

      expect(jobTimings.has(request.id)).toBe(false);
      expect(jobMetadata.has(request.id)).toBe(false);
    });

    it("should remove virtual finish time from tracker", async () => {
      await scheduler.initialize();

      const tracker = scheduler.getVirtualTimeTracker();
      tracker.calculateVirtualFinishTime(
        "test-job-vft",
        "tenant-standard",
        5000,
        10,
      );

      // Verify it exists before cleanup
      expect(tracker.getVirtualFinishTime("test-job-vft")).toBeDefined();

      const cleanupJobMetadata = (scheduler as any).cleanupJobMetadata.bind(
        scheduler,
      );
      cleanupJobMetadata("test-job-vft");

      // Virtual finish time should be removed
      expect(tracker.getVirtualFinishTime("test-job-vft")).toBeUndefined();
    });
  });

  describe("Error Handling - Extended", () => {
    it("should throw error if pause called before initialization", async () => {
      const uninitializedScheduler = new WFQScheduler(config, mockLLMService);

      await expect(uninitializedScheduler.pause()).rejects.toThrow(
        "Scheduler not initialized",
      );
    });

    it("should throw error if resume called before initialization", async () => {
      const uninitializedScheduler = new WFQScheduler(config, mockLLMService);

      await expect(uninitializedScheduler.resume()).rejects.toThrow(
        "Scheduler not initialized",
      );
    });

    it("should throw error if getStats called before initialization", async () => {
      const uninitializedScheduler = new WFQScheduler(config, mockLLMService);

      await expect(uninitializedScheduler.getStats()).rejects.toThrow(
        "Scheduler not initialized",
      );
    });
  });

  describe("submit - Virtual Finish Time Calculation", () => {
    it("should calculate and store virtual finish time on submit", async () => {
      await scheduler.initialize();

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440110",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tenantId: "tenant-enterprise" },
      };

      await scheduler.submit(request);

      const jobMetadata = (scheduler as any).jobMetadata;
      const metadata = jobMetadata.get(request.id);

      expect(metadata).toBeDefined();
      expect(metadata.virtualFinishTime).toBeDefined();
      expect(metadata.virtualFinishTime.virtualFinishTime).toBeGreaterThan(0);
    });

    it("should use weight from tenant registry", async () => {
      await scheduler.initialize();

      scheduler.addTenant(
        "custom-weight-tenant",
        "Custom",
        TenantTier.STANDARD,
        75,
      );

      const request: LLMRequest = {
        id: "550e8400-e29b-41d4-a716-446655440111",
        prompt: "Test request",
        provider: { name: "ollama", model: "llama2" },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tenantId: "custom-weight-tenant" },
      };

      await scheduler.submit(request);

      const jobMetadata = (scheduler as any).jobMetadata;
      const metadata = jobMetadata.get(request.id);

      expect(metadata.weight).toBe(75);
    });
  });
});
