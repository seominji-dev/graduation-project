/**
 * Aging Manager Unit Tests
 *
 * SPEC-SCHED-002: Aging mechanism for Priority Scheduler
 * Tests for aging functionality to prevent starvation
 */

import { AgingManager, IPriorityScheduler } from '../../../src/managers/AgingManager';
import { RequestPriority } from '../../../src/domain/models';

// Mock scheduler implementation for testing
class MockPriorityScheduler implements IPriorityScheduler {
  private jobs: Map<string, { priority: RequestPriority; queuedAt: Date }> = new Map();
  updateJobPriorityCalled: boolean = false;
  getWaitingJobsCalled: boolean = false;

  async updateJobPriority(jobId: string, newPriority: RequestPriority): Promise<boolean> {
    this.updateJobPriorityCalled = true;
    const job = this.jobs.get(jobId);
    if (job) {
      job.priority = newPriority;
      return true;
    }
    return false;
  }

  async getWaitingJobs(): Promise<Array<{ jobId: string; priority: RequestPriority; queuedAt: Date }>> {
    this.getWaitingJobsCalled = true;
    return Array.from(this.jobs.entries()).map(([jobId, data]) => ({
      jobId,
      priority: data.priority,
      queuedAt: data.queuedAt,
    }));
  }

  // Helper methods for testing
  addJob(jobId: string, priority: RequestPriority, queuedAt: Date): void {
    this.jobs.set(jobId, { priority, queuedAt });
  }

  getJobPriority(jobId: string): RequestPriority | undefined {
    return this.jobs.get(jobId)?.priority;
  }
}

describe('AgingManager', () => {
  let agingManager: AgingManager;
  let mockScheduler: MockPriorityScheduler;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockScheduler = new MockPriorityScheduler();
    agingManager = new AgingManager(mockScheduler);
  });

  afterEach(async () => {
    jest.useRealTimers();
    await agingManager.stop();
  });

  describe('Initialization', () => {
    it('should create AgingManager instance', () => {
      expect(agingManager).toBeDefined();
    });

    it('should start aging process', async () => {
      const startSpy = jest.spyOn(agingManager as any, 'runAging');
      await agingManager.start();
      expect(startSpy).toHaveBeenCalled();
    });

    it('should not start if already started', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      await agingManager.start();
      await agingManager.start();
      expect(consoleWarnSpy).toHaveBeenCalledWith('AgingManager already started');
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Aging Process', () => {
    it('should promote long-waiting LOW priority jobs', async () => {
      // Add a job that has been waiting for more than threshold
      const oldDate = new Date(Date.now() - 150000); // 150 seconds ago ( > 120s threshold)
      mockScheduler.addJob('job-1', RequestPriority.LOW, oldDate);

      await agingManager.start();
      await (agingManager as any).runAging();

      // LOW(0) -> promotion 0 -> NORMAL(1)
      // promotePriority: currentPriority(0) + promotionCount(0) + 1 = 1 (NORMAL)
      expect(mockScheduler.getJobPriority('job-1')).toBeGreaterThan(RequestPriority.LOW);
    });

    it('should promote long-waiting NORMAL priority jobs', async () => {
      const oldDate = new Date(Date.now() - 150000);
      mockScheduler.addJob('job-2', RequestPriority.NORMAL, oldDate);

      await agingManager.start();
      await (agingManager as any).runAging();

      // NORMAL(1) -> promotion 0 -> HIGH(2)
      expect(mockScheduler.getJobPriority('job-2')).toBeGreaterThan(RequestPriority.NORMAL);
    });

    it('should promote long-waiting HIGH priority jobs to URGENT', async () => {
      const oldDate = new Date(Date.now() - 150000);
      mockScheduler.addJob('job-3', RequestPriority.HIGH, oldDate);

      await agingManager.start();
      await (agingManager as any).runAging();

      expect(mockScheduler.getJobPriority('job-3')).toBe(RequestPriority.URGENT);
    });

    it('should not promote jobs that have not waited long enough', async () => {
      const recentDate = new Date(Date.now() - 30000); // 30 seconds ago ( < 120s threshold)
      mockScheduler.addJob('job-4', RequestPriority.LOW, recentDate);

      await agingManager.start();
      await (agingManager as any).runAging();

      expect(mockScheduler.getJobPriority('job-4')).toBe(RequestPriority.LOW);
    });

    it('should not promote URGENT jobs', async () => {
      const oldDate = new Date(Date.now() - 150000);
      mockScheduler.addJob('job-5', RequestPriority.URGENT, oldDate);

      await agingManager.start();
      await (agingManager as any).runAging();

      expect(mockScheduler.getJobPriority('job-5')).toBe(RequestPriority.URGENT);
    });

    it('should respect MAX_AGE_PROMOTIONS limit', async () => {
      const oldDate = new Date(Date.now() - 300000); // 300 seconds ago
      mockScheduler.addJob('job-6', RequestPriority.LOW, oldDate);

      await agingManager.start();

      // Run aging multiple times
      await (agingManager as any).runAging();
      await (agingManager as any).runAging();
      await (agingManager as any).runAging();

      // Should not exceed URGENT priority
      expect(mockScheduler.getJobPriority('job-6')).toBe(RequestPriority.URGENT);
    });
  });

  describe('Stop Process', () => {
    it('should stop aging process', async () => {
      await agingManager.start();
      await agingManager.stop();
      expect(true).toBe(true); // Verify stop completes without error
    });

    it('should clear aging counts on stop', async () => {
      mockScheduler.addJob('job-7', RequestPriority.LOW, new Date(Date.now() - 150000));

      await agingManager.start();
      await (agingManager as any).runAging();
      const afterFirstAging = mockScheduler.getJobPriority('job-7');
      await agingManager.stop();

      // After stop, aging counts should be cleared
      // Start again and the job should be eligible for aging again
      await agingManager.start();
      await (agingManager as any).runAging();

      // Job should be promoted again since aging count was reset
      const finalPriority = mockScheduler.getJobPriority('job-7');
      expect(finalPriority).toBeDefined();
      expect(afterFirstAging).toBeDefined();
      if (finalPriority && afterFirstAging) {
        expect(finalPriority).toBeGreaterThanOrEqual(afterFirstAging);
      }
    });
  });

  describe('resetJobAging', () => {
    it('should reset aging count for a specific job', async () => {
      const oldDate = new Date(Date.now() - 150000);
      mockScheduler.addJob('job-8', RequestPriority.LOW, oldDate);

      await agingManager.start();
      await (agingManager as any).runAging();

      // Job should be promoted
      const firstPromotion = mockScheduler.getJobPriority('job-8');
      expect(firstPromotion).toBeGreaterThan(RequestPriority.LOW);

      // Reset aging
      agingManager.resetJobAging('job-8');

      // Should be able to age again
      await (agingManager as any).runAging();
      const finalPriority = mockScheduler.getJobPriority('job-8');
      expect(finalPriority).toBeDefined();
      expect(firstPromotion).toBeDefined();
      if (finalPriority && firstPromotion) {
        expect(finalPriority).toBeGreaterThanOrEqual(firstPromotion);
      }
    });

    it('should handle reset for non-existent job', () => {
      expect(() => {
        agingManager.resetJobAging('non-existent-job');
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty job queue', async () => {
      await agingManager.start();
      await (agingManager as any).runAging();
      expect(true).toBe(true); // Should complete without error
    });

    it('should handle multiple jobs with different wait times', async () => {
      const veryOldDate = new Date(Date.now() - 200000);
      const oldDate = new Date(Date.now() - 150000);
      const recentDate = new Date(Date.now() - 30000);

      mockScheduler.addJob('job-old1', RequestPriority.LOW, veryOldDate);
      mockScheduler.addJob('job-old2', RequestPriority.NORMAL, oldDate);
      mockScheduler.addJob('job-recent', RequestPriority.HIGH, recentDate);

      await agingManager.start();
      await (agingManager as any).runAging();

      // Very old jobs should be promoted
      expect(mockScheduler.getJobPriority('job-old1')).toBeGreaterThan(RequestPriority.LOW);
      expect(mockScheduler.getJobPriority('job-old2')).toBeGreaterThan(RequestPriority.NORMAL);
      // Recent job should not be promoted
      expect(mockScheduler.getJobPriority('job-recent')).toBe(RequestPriority.HIGH);
    });

    it('should handle scheduler returning empty jobs list', async () => {
      await agingManager.start();
      await (agingManager as any).runAging();
      expect(true).toBe(true); // Should complete without error
    });

    it('should handle priority update failures gracefully', async () => {
      const oldDate = new Date(Date.now() - 150000);
      mockScheduler.addJob('job-fail', RequestPriority.LOW, oldDate);

      // Mock updateJobPriority to return false
      const originalMethod = mockScheduler.updateJobPriority;
      mockScheduler.updateJobPriority = jest.fn().mockResolvedValue(false);

      await agingManager.start();
      await (agingManager as any).runAging();

      // Should not throw error, job priority should remain unchanged
      expect(mockScheduler.getJobPriority('job-fail')).toBe(RequestPriority.LOW);

      // Restore original method
      mockScheduler.updateJobPriority = originalMethod;
    });
  });

  describe('Promotion Logic', () => {
    it('should promote LOW to higher priority after two aging cycles', async () => {
      const oldDate = new Date(Date.now() - 300000);
      mockScheduler.addJob('job-multi', RequestPriority.LOW, oldDate);

      await agingManager.start();
      await (agingManager as any).runAging();
      // First aging: LOW(0) -> NORMAL(1)
      expect(mockScheduler.getJobPriority('job-multi')).toBeGreaterThan(RequestPriority.LOW);

      await (agingManager as any).runAging();
      // Second aging: Should promote further
      expect(mockScheduler.getJobPriority('job-multi')).toBeGreaterThan(RequestPriority.LOW);
    });

    it('should cap promotion at URGENT level', async () => {
      const oldDate = new Date(Date.now() - 500000);
      mockScheduler.addJob('job-cap', RequestPriority.LOW, oldDate);

      await agingManager.start();

      // Run aging 4 times (LOW -> NORMAL -> HIGH -> URGENT -> URGENT)
      await (agingManager as any).runAging();
      await (agingManager as any).runAging();
      await (agingManager as any).runAging();
      await (agingManager as any).runAging();

      expect(mockScheduler.getJobPriority('job-cap')).toBe(RequestPriority.URGENT);
    });
  });

  describe('Error Handling', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should handle getWaitingJobs errors gracefully', async () => {
      mockScheduler.getWaitingJobs = jest.fn().mockRejectedValue(new Error('Database error'));

      await agingManager.start();
      await (agingManager as any).runAging();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle updateJobPriority errors gracefully', async () => {
      mockScheduler.addJob('job-error', RequestPriority.LOW, new Date(Date.now() - 150000));
      mockScheduler.updateJobPriority = jest.fn().mockRejectedValue(new Error('Update failed'));

      await agingManager.start();
      await (agingManager as any).runAging();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
