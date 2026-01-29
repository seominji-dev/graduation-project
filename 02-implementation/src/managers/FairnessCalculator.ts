/**
 * Fairness Calculator
 *
 * Calculates fairness metrics for WFQ scheduler.
 * Uses Jain's Fairness Index to measure fairness of bandwidth allocation.
 *
 * SPEC-SCHED-004: Fairness monitoring and metrics
 */

export interface FairnessMetrics {
  jainsFairnessIndex: number;
  fairnessScore: number;
  tenantThroughput: Map<string, number>;
  tenantWaitTime: Map<string, number>;
  mostFavoredTenant: string;
  leastFavoredTenant: string;
  disparityRatio: number;
}

export interface TenantServiceStats {
  tenantId: string;
  requestsProcessed: number;
  totalProcessingTime: number;
  totalWaitTime: number;
  avgProcessingTime: number;
  avgWaitTime: number;
  throughput: number;
}

export class FairnessCalculator {
  private tenantStats: Map<
    string,
    {
      requestsProcessed: number;
      totalProcessingTime: number;
      totalWaitTime: number;
      firstRequestTime: number;
      lastRequestTime: number;
    }
  > = new Map();

  private totalRequestsProcessed: number = 0;
  private startTime: number = Date.now();

  recordRequestCompletion(
    tenantId: string,
    processingTime: number,
    waitTime: number,
  ): void {
    const stats = this.tenantStats.get(tenantId) || {
      requestsProcessed: 0,
      totalProcessingTime: 0,
      totalWaitTime: 0,
      firstRequestTime: Date.now(),
      lastRequestTime: Date.now(),
    };

    stats.requestsProcessed++;
    stats.totalProcessingTime += processingTime;
    stats.totalWaitTime += waitTime;
    stats.lastRequestTime = Date.now();

    this.tenantStats.set(tenantId, stats);
    this.totalRequestsProcessed++;
  }

  calculateJainsFairnessIndex(throughputs: number[]): number {
    if (throughputs.length === 0) {
      return 1.0;
    }

    const n = throughputs.length;
    const sum = throughputs.reduce((acc, val) => acc + val, 0);
    const sumOfSquares = throughputs.reduce((acc, val) => acc + val * val, 0);

    if (sumOfSquares === 0) {
      return 1.0;
    }

    const jfi = (sum * sum) / (n * sumOfSquares);
    return Math.min(1.0, jfi);
  }

  getFairnessMetrics(): FairnessMetrics {
    const tenantIds = Array.from(this.tenantStats.keys());
    const throughputs: number[] = [];
    const tenantThroughput = new Map<string, number>();
    const tenantWaitTime = new Map<string, number>();

    for (const tenantId of tenantIds) {
      const stats = this.tenantStats.get(tenantId)!;
      const elapsedSeconds = Math.max(1, (Date.now() - this.startTime) / 1000);
      const throughput = stats.requestsProcessed / elapsedSeconds;
      const avgWaitTime =
        stats.requestsProcessed > 0
          ? stats.totalWaitTime / stats.requestsProcessed
          : 0;

      throughputs.push(throughput);
      tenantThroughput.set(tenantId, throughput);
      tenantWaitTime.set(tenantId, avgWaitTime);
    }

    const jainsFairnessIndex = this.calculateJainsFairnessIndex(throughputs);
    const fairnessScore = jainsFairnessIndex * 100;

    let mostFavoredTenant = "";
    let leastFavoredTenant = "";
    let maxThroughput = -1;
    let minThroughput = Infinity;

    for (const [tenantId, throughput] of tenantThroughput) {
      if (throughput > maxThroughput) {
        maxThroughput = throughput;
        mostFavoredTenant = tenantId;
      }
      if (throughput < minThroughput) {
        minThroughput = throughput;
        leastFavoredTenant = tenantId;
      }
    }

    const disparityRatio =
      minThroughput > 0 ? maxThroughput / minThroughput : 0;

    return {
      jainsFairnessIndex,
      fairnessScore,
      tenantThroughput,
      tenantWaitTime,
      mostFavoredTenant,
      leastFavoredTenant,
      disparityRatio,
    };
  }

  getTenantStats(tenantId: string): TenantServiceStats | null {
    const stats = this.tenantStats.get(tenantId);
    if (!stats) {
      return null;
    }

    const elapsedSeconds = Math.max(
      1,
      (Date.now() - stats.firstRequestTime) / 1000,
    );
    const throughput = stats.requestsProcessed / elapsedSeconds;
    const avgProcessingTime =
      stats.requestsProcessed > 0
        ? stats.totalProcessingTime / stats.requestsProcessed
        : 0;
    const avgWaitTime =
      stats.requestsProcessed > 0
        ? stats.totalWaitTime / stats.requestsProcessed
        : 0;

    return {
      tenantId,
      requestsProcessed: stats.requestsProcessed,
      totalProcessingTime: stats.totalProcessingTime,
      totalWaitTime: stats.totalWaitTime,
      avgProcessingTime,
      avgWaitTime,
      throughput,
    };
  }

  getAllTenantStats(): TenantServiceStats[] {
    const result: TenantServiceStats[] = [];

    for (const tenantId of this.tenantStats.keys()) {
      const stats = this.getTenantStats(tenantId);
      if (stats) {
        result.push(stats);
      }
    }

    return result;
  }

  reset(): void {
    this.tenantStats.clear();
    this.totalRequestsProcessed = 0;
    this.startTime = Date.now();
  }

  getTotalRequestsProcessed(): number {
    return this.totalRequestsProcessed;
  }

  getActiveTenantCount(): number {
    return this.tenantStats.size;
  }

  calculateWeightedFairness(tenantWeights: Map<string, number>): number {
    const tenantIds = Array.from(this.tenantStats.keys());
    if (tenantIds.length === 0) {
      return 1.0;
    }

    const normalizedThroughputs: number[] = [];

    for (const tenantId of tenantIds) {
      const stats = this.tenantStats.get(tenantId)!;
      const elapsedSeconds = Math.max(1, (Date.now() - this.startTime) / 1000);
      const throughput = stats.requestsProcessed / elapsedSeconds;
      const weight = tenantWeights.get(tenantId) || 1;

      normalizedThroughputs.push(throughput / weight);
    }

    return this.calculateJainsFairnessIndex(normalizedThroughputs);
  }

  generateFairnessReport(): string {
    const metrics = this.getFairnessMetrics();
    const lines: string[] = [];

    lines.push("=== Fairness Report ===");
    lines.push("");
    lines.push("Overall Metrics:");
    lines.push(
      "  Jain's Fairness Index: " + metrics.jainsFairnessIndex.toFixed(4),
    );
    lines.push(
      "  Fairness Score: " + metrics.fairnessScore.toFixed(2) + "/100",
    );
    lines.push("  Active Tenants: " + this.getActiveTenantCount());
    lines.push(
      "  Total Requests Processed: " + this.getTotalRequestsProcessed(),
    );
    lines.push("");
    lines.push("Tenant Performance:");

    for (const [tenantId, throughput] of metrics.tenantThroughput) {
      const avgWait = metrics.tenantWaitTime.get(tenantId) || 0;
      lines.push("  " + tenantId + ":");
      lines.push("    Throughput: " + throughput.toFixed(4) + " req/s");
      lines.push("    Avg Wait Time: " + avgWait.toFixed(2) + "ms");
    }

    lines.push("");
    lines.push("Fairness Analysis:");
    lines.push("  Most Favored: " + metrics.mostFavoredTenant);
    lines.push("  Least Favored: " + metrics.leastFavoredTenant);
    lines.push("  Disparity Ratio: " + metrics.disparityRatio.toFixed(2) + "x");

    return lines.join("\n");
  }
}
