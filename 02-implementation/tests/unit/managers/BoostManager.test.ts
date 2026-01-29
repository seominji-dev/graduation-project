/**
 * Boost Manager Unit Tests
 *
 * SPEC-SCHED-003: Boost Manager for MLFQ Scheduler
 * Tests for periodic boosting (Rule 5) to prevent starvation
 */

import {
  BoostManager,
  IMLFQScheduler,
} from "../../../src/managers/BoostManager";

// Mock MLFQ scheduler implementation for testing
class MockMLFQScheduler implements IMLFQScheduler {
  private jobsAtEachLevel: number[] = [0, 0, 0, 0];
  boostAllJobsCalled: boolean = false;
  getJobCountCalled: boolean = false;

  async boostAllJobs(): Promise<number> {
    this.boostAllJobsCalled = true;
    const boosted =
      this.jobsAtEachLevel[1] +
      this.jobsAtEachLevel[2] +
      this.jobsAtEachLevel[3];
    // Move all jobs from Q1, Q2, Q3 to Q0
    this.jobsAtEachLevel[0] +=
      this.jobsAtEachLevel[1] +
      this.jobsAtEachLevel[2] +
      this.jobsAtEachLevel[3];
    this.jobsAtEachLevel[1] = 0;
    this.jobsAtEachLevel[2] = 0;
    this.jobsAtEachLevel[3] = 0;
    return boosted;
  }

  async getJobCount(): Promise<number> {
    this.getJobCountCalled = true;
    return this.jobsAtEachLevel.reduce((sum, count) => sum + count, 0);
  }

  // Helper methods for testing
  setJobsAtLevel(level: number, count: number): void {
    this.jobsAtEachLevel[level] = count;
  }

  getJobsAtLevel(level: number): number {
    return this.jobsAtEachLevel[level];
  }

  reset(): void {
    this.jobsAtEachLevel = [0, 0, 0, 0];
    this.boostAllJobsCalled = false;
    this.getJobCountCalled = false;
  }
}

describe("BoostManager", () => {
  let boostManager: BoostManager;
  let mockScheduler: MockMLFQScheduler;

  beforeEach(() => {
    jest.clearAllMocks();
    mockScheduler = new MockMLFQScheduler();
    boostManager = new BoostManager(mockScheduler);
  });

  afterEach(async () => {
    await boostManager.stop();
  });

  describe("Initialization", () => {
    it("should create BoostManager instance", () => {
      expect(boostManager).toBeDefined();
    });

    it("should start boost process", async () => {
      await boostManager.start();
      expect(boostManager).toBeDefined();
    });

    it("should not start if already started", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      await boostManager.start();
      await boostManager.start();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("BoostManager already started"),
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe("Boost Process", () => {
    it("should boost jobs from lower queues to Q0", async () => {
      mockScheduler.setJobsAtLevel(0, 0);
      mockScheduler.setJobsAtLevel(1, 5);
      mockScheduler.setJobsAtLevel(2, 3);
      mockScheduler.setJobsAtLevel(3, 2);

      await boostManager.start();
      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();

      expect(mockScheduler.getJobsAtLevel(0)).toBe(10);
      expect(mockScheduler.getJobsAtLevel(1)).toBe(0);
      expect(mockScheduler.getJobsAtLevel(2)).toBe(0);
      expect(mockScheduler.getJobsAtLevel(3)).toBe(0);
    });

    it("should track boost count", async () => {
      await boostManager.start();
      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();

      const stats = boostManager.getStats();
      expect(stats.totalBoosts).toBeGreaterThan(0);
    });

    it("should log boost cycle with job count", async () => {
      const consoleInfoSpy = jest.spyOn(console, "info").mockImplementation();
      mockScheduler.setJobsAtLevel(0, 0);
      mockScheduler.setJobsAtLevel(1, 5);
      mockScheduler.setJobsAtLevel(2, 3);

      await boostManager.start();
      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining("Moved"),
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining("jobs to Q0"),
      );
      consoleInfoSpy.mockRestore();
    });
  });

  describe("Stop Process", () => {
    it("should stop boost process", async () => {
      await boostManager.start();
      await boostManager.stop();
      expect(true).toBe(true); // Verify stop completes without error
    });

    it("should log total boosts on stop", async () => {
      const consoleInfoSpy = jest.spyOn(console, "info").mockImplementation();

      await boostManager.start();
      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();
      await boostManager.stop();

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining("BoostManager stopped"),
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining("total boosts"),
      );
      consoleInfoSpy.mockRestore();
    });

    it("should not run boost after stop is called", async () => {
      await boostManager.start();
      await boostManager.stop();

      // runBoost should return early when stopped
      mockScheduler.reset();
      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();

      // boostAllJobs should not be called because manager is stopped
      expect(mockScheduler.boostAllJobsCalled).toBe(false);
    });
  });

  describe("getStats", () => {
    it("should return boost interval", () => {
      const stats = boostManager.getStats();
      expect(stats.interval).toBe(5000);
    });

    it("should return total boosts", () => {
      const stats = boostManager.getStats();
      expect(stats.totalBoosts).toBe(0);
    });

    it("should update total boosts after each boost", async () => {
      await boostManager.start();
      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();

      const stats = boostManager.getStats();
      expect(stats.totalBoosts).toBe(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty job queue", async () => {
      mockScheduler.setJobsAtLevel(0, 0);
      mockScheduler.setJobsAtLevel(1, 0);
      mockScheduler.setJobsAtLevel(2, 0);
      mockScheduler.setJobsAtLevel(3, 0);

      await boostManager.start();
      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();

      expect(mockScheduler.getJobsAtLevel(0)).toBe(0);
    });

    it("should handle all jobs already in Q0", async () => {
      mockScheduler.setJobsAtLevel(0, 20);
      mockScheduler.setJobsAtLevel(1, 0);
      mockScheduler.setJobsAtLevel(2, 0);
      mockScheduler.setJobsAtLevel(3, 0);

      await boostManager.start();
      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();

      expect(mockScheduler.getJobsAtLevel(0)).toBe(20);
    });

    it("should handle only Q3 jobs", async () => {
      mockScheduler.setJobsAtLevel(0, 0);
      mockScheduler.setJobsAtLevel(1, 0);
      mockScheduler.setJobsAtLevel(2, 0);
      mockScheduler.setJobsAtLevel(3, 15);

      await boostManager.start();
      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();

      expect(mockScheduler.getJobsAtLevel(0)).toBe(15);
      expect(mockScheduler.getJobsAtLevel(3)).toBe(0);
    });

    it("should handle jobs at all levels", async () => {
      mockScheduler.setJobsAtLevel(0, 5);
      mockScheduler.setJobsAtLevel(1, 3);
      mockScheduler.setJobsAtLevel(2, 7);
      mockScheduler.setJobsAtLevel(3, 2);

      await boostManager.start();
      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();

      expect(mockScheduler.getJobsAtLevel(0)).toBe(17);
      expect(mockScheduler.getJobsAtLevel(1)).toBe(0);
      expect(mockScheduler.getJobsAtLevel(2)).toBe(0);
      expect(mockScheduler.getJobsAtLevel(3)).toBe(0);
    });

    it("should return early when stopped before runBoost", async () => {
      await boostManager.start();

      // Stop the manager first
      await boostManager.stop();

      // Reset the mock to track new calls
      mockScheduler.reset();

      // Call runBoost after stop - should return early without calling scheduler
      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();

      // Scheduler method should not be called because isStopped is true
      expect(mockScheduler.boostAllJobsCalled).toBe(false);
    });

    it("should handle scheduler being null after stop", async () => {
      await boostManager.start();
      await boostManager.stop();

      // After stop, scheduler is set to null
      // runBoost should handle this gracefully
      await expect(
        (
          boostManager as unknown as { runBoost: () => Promise<void> }
        ).runBoost(),
      ).resolves.toBeUndefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle boostAllJobs errors gracefully", async () => {
      mockScheduler.boostAllJobs = jest
        .fn()
        .mockRejectedValue(new Error("Boost failed"));

      await boostManager.start();
      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();

      expect(true).toBe(true); // Should complete without throwing
    });

    it("should log error when boost fails", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      mockScheduler.boostAllJobs = jest
        .fn()
        .mockRejectedValue(new Error("Boost failed"));

      await boostManager.start();
      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Boost cycle failed"),
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe("Multiple Boost Cycles", () => {
    it("should handle consecutive boost cycles", async () => {
      mockScheduler.setJobsAtLevel(0, 0);
      mockScheduler.setJobsAtLevel(1, 5);
      mockScheduler.setJobsAtLevel(2, 3);
      mockScheduler.setJobsAtLevel(3, 2);

      await boostManager.start();

      // First boost
      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();
      expect(mockScheduler.getJobsAtLevel(0)).toBe(10);

      // Add more jobs to lower levels
      mockScheduler.setJobsAtLevel(1, 4);
      mockScheduler.setJobsAtLevel(2, 2);

      // Second boost
      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();
      expect(mockScheduler.getJobsAtLevel(0)).toBe(16);
    });

    it("should track boost count across multiple cycles", async () => {
      await boostManager.start();

      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();
      expect(boostManager.getStats().totalBoosts).toBe(1);

      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();
      expect(boostManager.getStats().totalBoosts).toBe(2);

      await (
        boostManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();
      expect(boostManager.getStats().totalBoosts).toBe(3);
    });
  });

  describe("Interface Compliance", () => {
    it("should implement start method", () => {
      expect(typeof boostManager.start).toBe("function");
    });

    it("should implement stop method", () => {
      expect(typeof boostManager.stop).toBe("function");
    });

    it("should implement getStats method", () => {
      expect(typeof boostManager.getStats).toBe("function");
    });
  });

  describe("Stopped State Behavior", () => {
    it("should not boost when manager is in stopped state", async () => {
      await boostManager.start();
      mockScheduler.setJobsAtLevel(1, 10);

      // Stop immediately
      await boostManager.stop();

      // Create fresh mock to track calls
      const freshMockScheduler = new MockMLFQScheduler();
      freshMockScheduler.setJobsAtLevel(1, 10);

      const stoppedManager = new BoostManager(freshMockScheduler);
      await stoppedManager.start();
      await stoppedManager.stop();

      // Try to run boost on stopped manager
      await (
        stoppedManager as unknown as { runBoost: () => Promise<void> }
      ).runBoost();

      // Should not have called boost because manager is stopped
      expect(freshMockScheduler.boostAllJobsCalled).toBe(false);
    });
  });
});
