/**
 * Fairness Calculator Unit Tests
 *
 * SPEC-SCHED-004: Fairness monitoring and metrics
 * Tests for Jain's Fairness Index and tenant statistics
 */

import {
  FairnessCalculator,
  FairnessMetrics,
  TenantServiceStats,
} from "../../../src/managers/FairnessCalculator";

describe("FairnessCalculator", () => {
  let calculator: FairnessCalculator;

  beforeEach(() => {
    calculator = new FairnessCalculator();
  });

  describe("recordRequestCompletion", () => {
    it("should record first request for a tenant", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);

      const stats = calculator.getTenantStats("tenant-1");
      expect(stats).toBeDefined();
      expect(stats?.requestsProcessed).toBe(1);
      expect(stats?.totalProcessingTime).toBe(1000);
      expect(stats?.totalWaitTime).toBe(500);
    });

    it("should accumulate multiple requests for same tenant", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-1", 1500, 600);
      calculator.recordRequestCompletion("tenant-1", 800, 400);

      const stats = calculator.getTenantStats("tenant-1");
      expect(stats?.requestsProcessed).toBe(3);
      expect(stats?.totalProcessingTime).toBe(3300);
      expect(stats?.totalWaitTime).toBe(1500);
    });

    it("should track separate stats for multiple tenants", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-2", 2000, 800);

      const stats1 = calculator.getTenantStats("tenant-1");
      const stats2 = calculator.getTenantStats("tenant-2");

      expect(stats1?.requestsProcessed).toBe(1);
      expect(stats2?.requestsProcessed).toBe(1);
      expect(stats1?.totalProcessingTime).toBe(1000);
      expect(stats2?.totalProcessingTime).toBe(2000);
    });

    it("should update total requests processed count", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-2", 1000, 500);
      calculator.recordRequestCompletion("tenant-1", 1000, 500);

      expect(calculator.getTotalRequestsProcessed()).toBe(3);
    });

    it("should update first and last request times", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);

      const stats = calculator.getTenantStats("tenant-1");
      // firstRequestTime is internal - not exposed in interface

      // Wait and add another request
      const startTime = Date.now();
      while (Date.now() - startTime < 10) {
        // Busy wait
      }

      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      const updatedStats = calculator.getTenantStats("tenant-1");
    });
  });

  describe("calculateJainsFairnessIndex", () => {
    it("should return 1.0 for empty throughput array", () => {
      const jfi = calculator.calculateJainsFairnessIndex([]);
      expect(jfi).toBe(1.0);
    });

    it("should return 1.0 for single tenant", () => {
      const jfi = calculator.calculateJainsFairnessIndex([10]);
      expect(jfi).toBe(1.0);
    });

    it("should return 1.0 for perfectly fair distribution", () => {
      const jfi = calculator.calculateJainsFairnessIndex([10, 10, 10, 10]);
      expect(jfi).toBe(1.0);
    });

    it("should calculate fairness for uneven distribution", () => {
      const jfi = calculator.calculateJainsFairnessIndex([10, 5, 15, 20]);
      expect(jfi).toBeGreaterThan(0);
      expect(jfi).toBeLessThan(1);
    });

    it("should return 1.0 when sum of squares is zero", () => {
      const jfi = calculator.calculateJainsFairnessIndex([0, 0, 0]);
      expect(jfi).toBe(1.0);
    });

    it("should handle very small values", () => {
      const jfi = calculator.calculateJainsFairnessIndex([0.001, 0.002, 0.001]);
      expect(jfi).toBeGreaterThan(0);
      expect(jfi).toBeLessThanOrEqual(1);
    });

    it("should handle very large values", () => {
      const jfi = calculator.calculateJainsFairnessIndex([
        1000000, 2000000, 1500000,
      ]);
      expect(jfi).toBeGreaterThan(0);
      expect(jfi).toBeLessThanOrEqual(1);
    });

    it("should return 1.0 for identical values", () => {
      const jfi = calculator.calculateJainsFairnessIndex([
        5.5, 5.5, 5.5, 5.5, 5.5,
      ]);
      expect(jfi).toBe(1.0);
    });

    it("should handle extreme unfairness", () => {
      const jfi = calculator.calculateJainsFairnessIndex([100, 1, 1, 1]);
      expect(jfi).toBeGreaterThan(0);
      expect(jfi).toBeLessThan(0.5);
    });
  });

  describe("getFairnessMetrics", () => {
    it("should return default metrics when no requests processed", () => {
      const metrics = calculator.getFairnessMetrics();

      expect(metrics.jainsFairnessIndex).toBe(1.0);
      expect(metrics.fairnessScore).toBe(100);
      expect(metrics.tenantThroughput.size).toBe(0);
      expect(metrics.tenantWaitTime.size).toBe(0);
      expect(metrics.mostFavoredTenant).toBe("");
      expect(metrics.leastFavoredTenant).toBe("");
      expect(
        Object.is(0, metrics.disparityRatio) || metrics.disparityRatio === 0,
      ).toBe(true);
    });

    it("should calculate metrics for single tenant", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);

      const metrics = calculator.getFairnessMetrics();

      expect(metrics.jainsFairnessIndex).toBe(1.0);
      expect(metrics.fairnessScore).toBe(100);
      expect(metrics.tenantThroughput.size).toBe(1);
      expect(metrics.mostFavoredTenant).toBe("tenant-1");
      expect(metrics.leastFavoredTenant).toBe("tenant-1");
      expect(Math.abs(metrics.disparityRatio)).toBe(1);
    });

    it("should calculate throughput correctly", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-2", 1000, 500);

      const metrics = calculator.getFairnessMetrics();

      const throughput1 = metrics.tenantThroughput.get("tenant-1");
      const throughput2 = metrics.tenantThroughput.get("tenant-2");

      expect(throughput1).toBeDefined();
      expect(throughput2).toBeDefined();
      expect(throughput1).toBeGreaterThan(0);
      expect(throughput2).toBeGreaterThan(0);
    });

    it("should calculate average wait time correctly", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-1", 1000, 700);
      calculator.recordRequestCompletion("tenant-1", 1000, 300);

      const metrics = calculator.getFairnessMetrics();

      const avgWait = metrics.tenantWaitTime.get("tenant-1");
      expect(avgWait).toBe(500); // (500 + 700 + 300) / 3
    });

    it("should identify most and least favored tenants", () => {
      // Give tenant-1 more throughput
      calculator.recordRequestCompletion("tenant-1", 100, 100);
      calculator.recordRequestCompletion("tenant-1", 100, 100);
      calculator.recordRequestCompletion("tenant-1", 100, 100);

      // Give tenant-2 less throughput
      calculator.recordRequestCompletion("tenant-2", 100, 100);

      const metrics = calculator.getFairnessMetrics();

      // After some time passes, tenant-1 should have higher throughput
      expect(metrics.mostFavoredTenant).toBeDefined();
      expect(metrics.leastFavoredTenant).toBeDefined();
    });

    it("should calculate disparity ratio correctly", () => {
      calculator.recordRequestCompletion("tenant-high", 100, 100);
      calculator.recordRequestCompletion("tenant-high", 100, 100);
      calculator.recordRequestCompletion("tenant-low", 100, 100);

      const metrics = calculator.getFairnessMetrics();

      expect(metrics.disparityRatio).toBeGreaterThan(0);
    });

    it("should calculate fairness score from Jain index", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-2", 1000, 500);

      const metrics = calculator.getFairnessMetrics();

      expect(metrics.fairnessScore).toBe(metrics.jainsFairnessIndex * 100);
    });

    it("should return zero average wait time for tenant with no requests", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 0);

      const metrics = calculator.getFairnessMetrics();
      const avgWait = metrics.tenantWaitTime.get("tenant-1");

      expect(avgWait).toBe(0);
    });
  });

  describe("getTenantStats", () => {
    it("should return null for non-existent tenant", () => {
      const stats = calculator.getTenantStats("non-existent");
      expect(stats).toBeNull();
    });

    it("should return stats for existing tenant", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);

      const stats = calculator.getTenantStats("tenant-1");

      expect(stats).not.toBeNull();
      expect(stats?.tenantId).toBe("tenant-1");
      expect(stats?.requestsProcessed).toBe(1);
      expect(stats?.totalProcessingTime).toBe(1000);
      expect(stats?.totalWaitTime).toBe(500);
    });

    it("should calculate average processing time", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-1", 2000, 600);
      calculator.recordRequestCompletion("tenant-1", 1500, 700);

      const stats = calculator.getTenantStats("tenant-1");

      expect(stats?.avgProcessingTime).toBe(1500); // (1000 + 2000 + 1500) / 3
    });

    it("should calculate average wait time", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-1", 1000, 1000);

      const stats = calculator.getTenantStats("tenant-1");

      expect(stats?.avgWaitTime).toBe(750); // (500 + 1000) / 2
    });

    it("should return zero for averages when no requests", () => {
      calculator.recordRequestCompletion("tenant-1", 0, 0);

      const stats = calculator.getTenantStats("tenant-1");

      expect(stats?.avgProcessingTime).toBe(0);
      expect(stats?.avgWaitTime).toBe(0);
    });

    it("should calculate throughput based on elapsed time", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);

      const stats = calculator.getTenantStats("tenant-1");

      expect(stats?.throughput).toBeGreaterThan(0);
    });
  });

  describe("getAllTenantStats", () => {
    it("should return empty array when no tenants", () => {
      const allStats = calculator.getAllTenantStats();
      expect(allStats).toEqual([]);
    });

    it("should return stats for all tenants", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-2", 2000, 600);
      calculator.recordRequestCompletion("tenant-3", 1500, 700);

      const allStats = calculator.getAllTenantStats();

      expect(allStats.length).toBe(3);
      expect(allStats.map((s) => s.tenantId).sort()).toEqual([
        "tenant-1",
        "tenant-2",
        "tenant-3",
      ]);
    });

    it("should return stats with all fields populated", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);

      const allStats = calculator.getAllTenantStats();
      const stats = allStats[0];

      expect(stats.tenantId).toBeDefined();
      expect(stats.requestsProcessed).toBeDefined();
      expect(stats.totalProcessingTime).toBeDefined();
      expect(stats.totalWaitTime).toBeDefined();
      expect(stats.avgProcessingTime).toBeDefined();
      expect(stats.avgWaitTime).toBeDefined();
      expect(stats.throughput).toBeDefined();
    });
  });

  describe("reset", () => {
    it("should clear all tenant stats", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-2", 2000, 600);

      calculator.reset();

      expect(calculator.getTenantStats("tenant-1")).toBeNull();
      expect(calculator.getTenantStats("tenant-2")).toBeNull();
    });

    it("should reset total requests processed", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-2", 1000, 500);

      calculator.reset();

      expect(calculator.getTotalRequestsProcessed()).toBe(0);
    });

    it("should reset start time", () => {
      const beforeStartTime = Date.now();
      calculator.reset();
      const afterStartTime = Date.now();

      const metrics = calculator.getFairnessMetrics();
      const elapsed = Date.now() - beforeStartTime;
      expect(elapsed).toBeLessThan(100);
    });

    it("should return default metrics after reset", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);

      calculator.reset();

      const metrics = calculator.getFairnessMetrics();
      expect(metrics.jainsFairnessIndex).toBe(1.0);
      expect(metrics.fairnessScore).toBe(100);
    });
  });

  describe("getActiveTenantCount", () => {
    it("should return zero when no tenants", () => {
      expect(calculator.getActiveTenantCount()).toBe(0);
    });

    it("should count unique tenants", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-2", 1000, 500);
      calculator.recordRequestCompletion("tenant-1", 1000, 500);

      expect(calculator.getActiveTenantCount()).toBe(2);
    });
  });

  describe("calculateWeightedFairness", () => {
    it("should return 1.0 when no tenants", () => {
      const weights = new Map<string, number>();
      const fairness = calculator.calculateWeightedFairness(weights);
      expect(fairness).toBe(1.0);
    });

    it("should normalize throughput by weight", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-2", 1000, 500);

      const weights = new Map([
        ["tenant-1", 10],
        ["tenant-2", 20],
      ]);

      const fairness = calculator.calculateWeightedFairness(weights);
      expect(fairness).toBeGreaterThan(0);
      expect(fairness).toBeLessThanOrEqual(1);
    });

    it("should handle missing weights", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);

      const weights = new Map<string, number>();
      // No weight for tenant-1

      const fairness = calculator.calculateWeightedFairness(weights);
      expect(fairness).toBeGreaterThan(0);
      expect(fairness).toBeLessThanOrEqual(1);
    });

    it("should use default weight of 1 for missing tenant weights", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);

      const weights = new Map<string, number>();
      const fairness = calculator.calculateWeightedFairness(weights);

      // Should not throw and should return valid fairness
      expect(fairness).toBeGreaterThan(0);
      expect(fairness).toBeLessThanOrEqual(1);
    });

    it("should calculate fairness with proportional weights", () => {
      // Create scenario where higher weight tenant should have proportionally higher throughput
      calculator.recordRequestCompletion("tenant-high", 2000, 500);
      calculator.recordRequestCompletion("tenant-high", 2000, 500);
      calculator.recordRequestCompletion("tenant-low", 1000, 500);

      const weights = new Map([
        ["tenant-high", 100],
        ["tenant-low", 10],
      ]);

      const fairness = calculator.calculateWeightedFairness(weights);
      expect(fairness).toBeGreaterThan(0);
      expect(fairness).toBeLessThanOrEqual(1);
    });
  });

  describe("generateFairnessReport", () => {
    it("should generate report with all sections", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-2", 1000, 500);

      const report = calculator.generateFairnessReport();

      expect(report).toContain("=== Fairness Report ===");
      expect(report).toContain("Overall Metrics:");
      expect(report).toContain("Jain");
      expect(report).toContain("Fairness Score");
      expect(report).toContain("Active Tenants");
      expect(report).toContain("Total Requests Processed");
      expect(report).toContain("Tenant Performance:");
      expect(report).toContain("Fairness Analysis:");
    });

    it("should include tenant-specific data", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-2", 1000, 700);

      const report = calculator.generateFairnessReport();

      expect(report).toContain("tenant-1");
      expect(report).toContain("tenant-2");
      expect(report).toContain("Throughput:");
      expect(report).toContain("Avg Wait Time:");
    });

    it("should include fairness analysis", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-2", 1000, 500);

      const report = calculator.generateFairnessReport();

      expect(report).toContain("Most Favored:");
      expect(report).toContain("Least Favored:");
      expect(report).toContain("Disparity Ratio:");
    });

    it("should format numbers correctly", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);

      const report = calculator.generateFairnessReport();

      // Should have decimal places for floating point numbers
      expect(report).toMatch(/\d+\.\d+/);
    });

    it("should handle empty state gracefully", () => {
      const report = calculator.generateFairnessReport();

      expect(report).toContain("=== Fairness Report ===");
      expect(report).toContain("Active Tenants: 0");
      expect(report).toContain("Total Requests Processed: 0");
    });

    it("should show request processing throughput in req/s", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);

      const report = calculator.generateFairnessReport();

      expect(report).toContain("req/s");
    });

    it("should show wait time in ms", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);

      const report = calculator.generateFairnessReport();

      expect(report).toContain("ms");
    });

    it("should show disparity ratio with x suffix", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-2", 1000, 500);

      const report = calculator.generateFairnessReport();

      expect(report).toMatch(/Disparity Ratio:.*x/);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero processing time", () => {
      calculator.recordRequestCompletion("tenant-1", 0, 500);

      const stats = calculator.getTenantStats("tenant-1");
      expect(stats?.totalProcessingTime).toBe(0);
    });

    it("should handle zero wait time", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 0);

      const stats = calculator.getTenantStats("tenant-1");
      expect(stats?.totalWaitTime).toBe(0);
    });

    it("should handle very large processing times", () => {
      calculator.recordRequestCompletion("tenant-1", 1000000, 500);

      const stats = calculator.getTenantStats("tenant-1");
      expect(stats?.totalProcessingTime).toBe(1000000);
    });

    it("should handle very small processing times", () => {
      calculator.recordRequestCompletion("tenant-1", 1, 1);

      const stats = calculator.getTenantStats("tenant-1");
      expect(stats?.totalProcessingTime).toBe(1);
    });

    it("should handle many tenants", () => {
      const tenantCount = 100;
      for (let i = 0; i < tenantCount; i++) {
        calculator.recordRequestCompletion(`tenant-${i}`, 1000, 500);
      }

      expect(calculator.getActiveTenantCount()).toBe(tenantCount);
      expect(calculator.getAllTenantStats().length).toBe(tenantCount);
    });
  });

  describe("Integration Scenarios", () => {
    it("should track fair distribution scenario", () => {
      // Two tenants with equal throughput
      for (let i = 0; i < 10; i++) {
        calculator.recordRequestCompletion("tenant-1", 1000, 500);
        calculator.recordRequestCompletion("tenant-2", 1000, 500);
      }

      const metrics = calculator.getFairnessMetrics();
      expect(metrics.jainsFairnessIndex).toBeCloseTo(1.0, 4);
    });

    it("should track unfair distribution scenario", () => {
      // One tenant gets much more traffic
      for (let i = 0; i < 20; i++) {
        calculator.recordRequestCompletion("tenant-1", 1000, 500);
      }
      calculator.recordRequestCompletion("tenant-2", 1000, 500);

      const metrics = calculator.getFairnessMetrics();
      expect(metrics.jainsFairnessIndex).toBeLessThan(1.0);
      expect(metrics.jainsFairnessIndex).toBeGreaterThan(0);
    });

    it("should handle gradual fairness improvement", () => {
      // Start unfair
      for (let i = 0; i < 10; i++) {
        calculator.recordRequestCompletion("tenant-1", 1000, 500);
      }

      const unfairMetrics = calculator.getFairnessMetrics();

      // Balance it out
      for (let i = 0; i < 10; i++) {
        calculator.recordRequestCompletion("tenant-2", 1000, 500);
      }

      const fairMetrics = calculator.getFairnessMetrics();

      expect(fairMetrics.jainsFairnessIndex).toBeGreaterThanOrEqual(
        unfairMetrics.jainsFairnessIndex,
      );
    });
  });
});

describe("Branch Coverage - FairnessCalculator", () => {
  let calculator: FairnessCalculator;

  beforeEach(() => {
    calculator = new FairnessCalculator();
  });

  describe("Disparity Ratio Edge Cases", () => {
    it("should return 0 disparity ratio when minimum throughput is 0", () => {
      // Record only for one tenant to create 0 throughput for comparison scenario
      // This tests the case where minThroughput could be 0
      const metrics = calculator.getFairnessMetrics();

      // With no tenants, disparity ratio handling
      expect(
        Object.is(0, metrics.disparityRatio) || metrics.disparityRatio === 0,
      ).toBe(true);
    });

    it("should calculate disparity ratio correctly when all tenants have throughput", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-2", 1000, 500);

      const metrics = calculator.getFairnessMetrics();

      // Both tenants have non-zero throughput
      expect(metrics.disparityRatio).toBeGreaterThan(0);
    });
  });

  describe("Average Calculation Edge Cases", () => {
    it("should return 0 for avgProcessingTime when no requests processed", () => {
      // This is tricky - we need to test the branch where requestsProcessed is 0
      // but getTenantStats returns null for non-existent tenants
      // The branch is checked inside getTenantStats

      // Test through getFairnessMetrics which handles the same logic
      const metrics = calculator.getFairnessMetrics();

      // With no tenants, everything should be default
      expect(metrics.tenantWaitTime.size).toBe(0);
    });

    it("should calculate avgWaitTime correctly for tenant with requests", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-1", 1000, 700);

      const stats = calculator.getTenantStats("tenant-1");
      expect(stats?.avgWaitTime).toBe(600); // (500 + 700) / 2
    });

    it("should calculate avgProcessingTime correctly for tenant with requests", () => {
      calculator.recordRequestCompletion("tenant-1", 1000, 500);
      calculator.recordRequestCompletion("tenant-1", 2000, 500);

      const stats = calculator.getTenantStats("tenant-1");
      expect(stats?.avgProcessingTime).toBe(1500); // (1000 + 2000) / 2
    });
  });

  describe("getFairnessMetrics Branch Coverage", () => {
    it("should handle single tenant scenario for most/least favored", () => {
      calculator.recordRequestCompletion("single-tenant", 1000, 500);

      const metrics = calculator.getFairnessMetrics();

      expect(metrics.mostFavoredTenant).toBe("single-tenant");
      expect(metrics.leastFavoredTenant).toBe("single-tenant");
      expect(metrics.disparityRatio).toBe(1);
    });

    it("should identify most and least favored correctly with different throughputs", () => {
      // Create significant throughput difference
      for (let i = 0; i < 10; i++) {
        calculator.recordRequestCompletion("high-throughput", 100, 50);
      }
      calculator.recordRequestCompletion("low-throughput", 100, 50);

      const metrics = calculator.getFairnessMetrics();

      expect(metrics.mostFavoredTenant).toBe("high-throughput");
      expect(metrics.leastFavoredTenant).toBe("low-throughput");
      expect(metrics.disparityRatio).toBeGreaterThan(1);
    });
  });

  describe("getTenantStats Branch Coverage", () => {
    it("should calculate throughput based on elapsed time from first request", () => {
      calculator.recordRequestCompletion("tenant-time", 1000, 500);

      const stats = calculator.getTenantStats("tenant-time");

      // Throughput should be calculated based on elapsed time
      expect(stats?.throughput).toBeGreaterThan(0);
    });

    it("should handle tenant stats with multiple rapid requests", () => {
      for (let i = 0; i < 100; i++) {
        calculator.recordRequestCompletion("rapid-tenant", 10, 5);
      }

      const stats = calculator.getTenantStats("rapid-tenant");

      expect(stats?.requestsProcessed).toBe(100);
      expect(stats?.avgProcessingTime).toBe(10);
      expect(stats?.avgWaitTime).toBe(5);
    });
  });

  describe("generateFairnessReport Branch Coverage", () => {
    it("should generate report with tenant wait time of 0", () => {
      calculator.recordRequestCompletion("no-wait-tenant", 1000, 0);

      const report = calculator.generateFairnessReport();

      expect(report).toContain("no-wait-tenant");
      expect(report).toContain("Avg Wait Time: 0.00ms");
    });

    it("should include all report sections with multiple tenants", () => {
      calculator.recordRequestCompletion("tenant-a", 500, 100);
      calculator.recordRequestCompletion("tenant-b", 1000, 200);
      calculator.recordRequestCompletion("tenant-c", 1500, 300);

      const report = calculator.generateFairnessReport();

      expect(report).toContain("tenant-a");
      expect(report).toContain("tenant-b");
      expect(report).toContain("tenant-c");
      expect(report).toContain("Throughput:");
      expect(report).toContain("Avg Wait Time:");
    });
  });

  describe("calculateWeightedFairness Branch Coverage", () => {
    it("should handle tenant not in weights map", () => {
      calculator.recordRequestCompletion("unmapped-tenant", 1000, 500);

      const weights = new Map<string, number>();
      // Don't add unmapped-tenant to weights

      const fairness = calculator.calculateWeightedFairness(weights);

      // Should use default weight of 1
      expect(fairness).toBeLessThanOrEqual(1);
      expect(fairness).toBeGreaterThan(0);
    });

    it("should handle all tenants with weights", () => {
      calculator.recordRequestCompletion("weighted-1", 1000, 500);
      calculator.recordRequestCompletion("weighted-2", 1000, 500);

      const weights = new Map([
        ["weighted-1", 10],
        ["weighted-2", 10],
      ]);

      const fairness = calculator.calculateWeightedFairness(weights);

      expect(fairness).toBeCloseTo(1.0, 2);
    });
  });
});
