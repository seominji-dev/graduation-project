/**
 * Virtual Time Tracker Unit Tests
 *
 * SPEC-SCHED-004: Virtual time calculation for WFQ scheduling
 * Tests for virtual time tracking and finish time calculation
 */

import {
  VirtualTimeTracker,
  VirtualTimeState,
  VirtualFinishTime,
} from '../../../src/managers/VirtualTimeTracker';

describe('VirtualTimeTracker', () => {
  let tracker: VirtualTimeTracker;

  beforeEach(() => {
    tracker = new VirtualTimeTracker();
  });

  describe('Initialization', () => {
    it('should initialize with zero virtual time', () => {
      expect(tracker.getCurrentVirtualTime()).toBe(0);
    });

    it('should initialize with valid state', () => {
      const state = tracker.getState();
      expect(state.currentTime).toBe(0);
      expect(state.lastUpdateTime).toBeGreaterThan(0);
      expect(state.activeWeightSum).toBe(0);
    });

    it('should start with empty finish times', () => {
      const stats = tracker.getStatistics();
      expect(stats.count).toBe(0);
    });
  });

  describe('updateVirtualTime', () => {
    it('should update virtual time with positive service time and weight', () => {
      tracker.updateVirtualTime(1000, 10);
      expect(tracker.getCurrentVirtualTime()).toBe(100);
    });

    it('should update virtual time correctly with multiple updates', () => {
      tracker.updateVirtualTime(1000, 10); // +100
      tracker.updateVirtualTime(500, 5);   // +100
      tracker.updateVirtualTime(2000, 20); // +100

      expect(tracker.getCurrentVirtualTime()).toBe(300);
    });

    it('should not update virtual time when active weight sum is zero', () => {
      tracker.updateVirtualTime(1000, 0);
      expect(tracker.getCurrentVirtualTime()).toBe(0);
    });

    it('should update active weight sum in state', () => {
      tracker.updateVirtualTime(1000, 15);
      const state = tracker.getState();
      expect(state.activeWeightSum).toBe(15);
    });

    it('should update last update time', () => {
      const beforeUpdate = tracker.getState().lastUpdateTime;

      // Wait a bit to ensure time difference
      const startTime = Date.now();
      while (Date.now() - startTime < 10) {
        // Busy wait to ensure time passes
      }

      tracker.updateVirtualTime(1000, 10);
      const afterUpdate = tracker.getState().lastUpdateTime;

      expect(afterUpdate).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('should handle very small service times', () => {
      tracker.updateVirtualTime(1, 10);
      expect(tracker.getCurrentVirtualTime()).toBe(0.1);
    });

    it('should handle very large service times', () => {
      tracker.updateVirtualTime(1000000, 10);
      expect(tracker.getCurrentVirtualTime()).toBe(100000);
    });
  });

  describe('calculateVirtualFinishTime', () => {
    it('should calculate virtual finish time correctly', () => {
      const finishTime = tracker.calculateVirtualFinishTime(
        'req-1',
        'tenant-1',
        5000,
        10
      );

      expect(finishTime.requestId).toBe('req-1');
      expect(finishTime.tenantId).toBe('tenant-1');
      expect(finishTime.weight).toBe(10);
      expect(finishTime.estimatedServiceTime).toBe(5000);
      expect(finishTime.virtualStartTime).toBe(0);
      expect(finishTime.virtualFinishTime).toBe(500); // 5000 / 10
    });

    it('should store finish time for later retrieval', () => {
      tracker.calculateVirtualFinishTime('req-2', 'tenant-2', 3000, 15);
      const retrieved = tracker.getVirtualFinishTime('req-2');

      expect(retrieved).toBeDefined();
      expect(retrieved?.requestId).toBe('req-2');
      expect(retrieved?.virtualFinishTime).toBe(200); // 3000 / 15
    });

    it('should use current virtual time as start time', () => {
      tracker.updateVirtualTime(1000, 10); // V(t) = 100

      const finishTime = tracker.calculateVirtualFinishTime(
        'req-3',
        'tenant-3',
        5000,
        10
      );

      expect(finishTime.virtualStartTime).toBe(100);
      expect(finishTime.virtualFinishTime).toBe(600); // 100 + 5000/10
    });

    it('should calculate different finish times for different weights', () => {
      const finishTimeHigh = tracker.calculateVirtualFinishTime(
        'req-high',
        'tenant-high',
        5000,
        100
      );

      const finishTimeLow = tracker.calculateVirtualFinishTime(
        'req-low',
        'tenant-low',
        5000,
        10
      );

      expect(finishTimeHigh.virtualFinishTime).toBe(50); // 5000/100
      expect(finishTimeLow.virtualFinishTime).toBe(500); // 5000/10
      expect(finishTimeHigh.virtualFinishTime).toBeLessThan(finishTimeLow.virtualFinishTime);
    });
  });

  describe('getVirtualFinishTime', () => {
    it('should return undefined for non-existent request', () => {
      const result = tracker.getVirtualFinishTime('non-existent');
      expect(result).toBeUndefined();
    });

    it('should return stored finish time', () => {
      const original = tracker.calculateVirtualFinishTime('req-4', 'tenant-4', 4000, 20);
      const retrieved = tracker.getVirtualFinishTime('req-4');

      expect(retrieved).toEqual(original);
    });
  });

  describe('removeVirtualFinishTime', () => {
    it('should remove stored finish time', () => {
      tracker.calculateVirtualFinishTime('req-5', 'tenant-5', 3000, 15);
      tracker.removeVirtualFinishTime('req-5');

      const result = tracker.getVirtualFinishTime('req-5');
      expect(result).toBeUndefined();
    });

    it('should handle removing non-existent finish time', () => {
      expect(() => {
        tracker.removeVirtualFinishTime('non-existent');
      }).not.toThrow();
    });
  });

  describe('setActiveWeightSum', () => {
    it('should set active weight sum', () => {
      tracker.setActiveWeightSum(50);
      const state = tracker.getState();
      expect(state.activeWeightSum).toBe(50);
    });

    it('should override previous active weight sum', () => {
      tracker.setActiveWeightSum(30);
      tracker.setActiveWeightSum(70);
      const state = tracker.getState();
      expect(state.activeWeightSum).toBe(70);
    });
  });

  describe('incrementActiveWeightSum', () => {
    it('should increment active weight sum', () => {
      tracker.setActiveWeightSum(10);
      tracker.incrementActiveWeightSum(5);
      const state = tracker.getState();
      expect(state.activeWeightSum).toBe(15);
    });

    it('should start from zero if not set', () => {
      tracker.incrementActiveWeightSum(25);
      const state = tracker.getState();
      expect(state.activeWeightSum).toBe(25);
    });
  });

  describe('decrementActiveWeightSum', () => {
    it('should decrement active weight sum', () => {
      tracker.setActiveWeightSum(20);
      tracker.decrementActiveWeightSum(5);
      const state = tracker.getState();
      expect(state.activeWeightSum).toBe(15);
    });

    it('should not go below zero', () => {
      tracker.setActiveWeightSum(10);
      tracker.decrementActiveWeightSum(15);
      const state = tracker.getState();
      expect(state.activeWeightSum).toBe(0);
    });

    it('should handle decrementing zero', () => {
      tracker.decrementActiveWeightSum(10);
      const state = tracker.getState();
      expect(state.activeWeightSum).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset virtual time to zero', () => {
      tracker.updateVirtualTime(1000, 10);
      tracker.updateVirtualTime(500, 5);
      tracker.reset();

      expect(tracker.getCurrentVirtualTime()).toBe(0);
    });

    it('should reset active weight sum', () => {
      tracker.setActiveWeightSum(50);
      tracker.reset();

      const state = tracker.getState();
      expect(state.activeWeightSum).toBe(0);
    });

    it('should clear all finish times', () => {
      tracker.calculateVirtualFinishTime('req-1', 'tenant-1', 1000, 10);
      tracker.calculateVirtualFinishTime('req-2', 'tenant-2', 2000, 20);
      tracker.reset();

      const stats = tracker.getStatistics();
      expect(stats.count).toBe(0);
    });

    it('should update last update time on reset', () => {
      const beforeReset = tracker.getState().lastUpdateTime;
      tracker.reset();
      const afterReset = tracker.getState().lastUpdateTime;

      expect(afterReset).toBeGreaterThanOrEqual(beforeReset);
    });
  });

  describe('compareByVirtualFinishTime', () => {
    it('should return 0 for equal finish times', () => {
      tracker.calculateVirtualFinishTime('req-1', 'tenant-1', 1000, 10);
      tracker.calculateVirtualFinishTime('req-2', 'tenant-2', 1000, 10);

      const result = tracker.compareByVirtualFinishTime('req-1', 'req-2');
      expect(result).toBe(0); // Both have the same finish time since virtual time hasn't advanced
    });

    it('should return negative when first request finishes earlier', () => {
      tracker.calculateVirtualFinishTime('req-1', 'tenant-1', 1000, 100); // Finish: 10
      tracker.calculateVirtualFinishTime('req-2', 'tenant-2', 1000, 10);  // Finish: 100

      const result = tracker.compareByVirtualFinishTime('req-1', 'req-2');
      expect(result).toBeLessThan(0);
    });

    it('should return positive when second request finishes earlier', () => {
      tracker.calculateVirtualFinishTime('req-1', 'tenant-1', 1000, 10);  // Finish: 100
      tracker.calculateVirtualFinishTime('req-2', 'tenant-2', 1000, 100); // Finish: 10

      const result = tracker.compareByVirtualFinishTime('req-1', 'req-2');
      expect(result).toBeGreaterThan(0);
    });

    it('should return 0 when both requests do not exist', () => {
      const result = tracker.compareByVirtualFinishTime('non-existent-1', 'non-existent-2');
      expect(result).toBe(0);
    });

    it('should return positive when first request does not exist', () => {
      tracker.calculateVirtualFinishTime('req-2', 'tenant-2', 1000, 10);

      const result = tracker.compareByVirtualFinishTime('non-existent', 'req-2');
      expect(result).toBeGreaterThan(0);
    });

    it('should return negative when second request does not exist', () => {
      tracker.calculateVirtualFinishTime('req-1', 'tenant-1', 1000, 10);

      const result = tracker.compareByVirtualFinishTime('req-1', 'non-existent');
      expect(result).toBeLessThan(0);
    });
  });

  describe('getSortedRequestIds', () => {
    it('should return empty array for empty input', () => {
      const sorted = tracker.getSortedRequestIds([]);
      expect(sorted).toEqual([]);
    });

    it('should sort requests by virtual finish time', () => {
      tracker.calculateVirtualFinishTime('req-1', 'tenant-1', 1000, 10);  // Finish: 100
      tracker.calculateVirtualFinishTime('req-2', 'tenant-2', 1000, 100); // Finish: 10
      tracker.calculateVirtualFinishTime('req-3', 'tenant-3', 1000, 20);  // Finish: 50

      const sorted = tracker.getSortedRequestIds(['req-1', 'req-2', 'req-3']);
      expect(sorted).toEqual(['req-2', 'req-3', 'req-1']);
    });

    it('should handle requests with non-existent finish times', () => {
      tracker.calculateVirtualFinishTime('req-1', 'tenant-1', 1000, 10);

      const sorted = tracker.getSortedRequestIds(['req-1', 'non-existent']);
      expect(sorted).toEqual(['req-1', 'non-existent']);
    });

    it('should not modify original array', () => {
      tracker.calculateVirtualFinishTime('req-1', 'tenant-1', 1000, 10);
      tracker.calculateVirtualFinishTime('req-2', 'tenant-2', 1000, 100);

      const input = ['req-1', 'req-2'];
      const sorted = tracker.getSortedRequestIds(input);

      expect(input).toEqual(['req-1', 'req-2']);
      expect(sorted).not.toBe(input);
    });
  });

  describe('getStatistics', () => {
    it('should return zero statistics when no finish times', () => {
      const stats = tracker.getStatistics();

      expect(stats.count).toBe(0);
      expect(stats.minVirtualFinishTime).toBe(0);
      expect(stats.maxVirtualFinishTime).toBe(0);
      expect(stats.avgVirtualFinishTime).toBe(0);
    });

    it('should calculate correct statistics for single finish time', () => {
      tracker.calculateVirtualFinishTime('req-1', 'tenant-1', 5000, 10);

      const stats = tracker.getStatistics();

      expect(stats.count).toBe(1);
      expect(stats.minVirtualFinishTime).toBe(500);
      expect(stats.maxVirtualFinishTime).toBe(500);
      expect(stats.avgVirtualFinishTime).toBe(500);
    });

    it('should calculate correct statistics for multiple finish times', () => {
      tracker.calculateVirtualFinishTime('req-1', 'tenant-1', 1000, 10); // 100
      tracker.calculateVirtualFinishTime('req-2', 'tenant-2', 2000, 10); // 200
      tracker.calculateVirtualFinishTime('req-3', 'tenant-3', 3000, 10); // 300

      const stats = tracker.getStatistics();

      expect(stats.count).toBe(3);
      expect(stats.minVirtualFinishTime).toBe(100);
      expect(stats.maxVirtualFinishTime).toBe(300);
      expect(stats.avgVirtualFinishTime).toBe(200);
    });

    it('should update statistics after finish times are removed', () => {
      tracker.calculateVirtualFinishTime('req-1', 'tenant-1', 1000, 10); // 100
      tracker.calculateVirtualFinishTime('req-2', 'tenant-2', 2000, 10); // 200
      tracker.calculateVirtualFinishTime('req-3', 'tenant-3', 3000, 10); // 300

      tracker.removeVirtualFinishTime('req-2');

      const stats = tracker.getStatistics();

      expect(stats.count).toBe(2);
      expect(stats.minVirtualFinishTime).toBe(100);
      expect(stats.maxVirtualFinishTime).toBe(300);
      expect(stats.avgVirtualFinishTime).toBe(200);
    });

    it('should handle finish times with different virtual start times', () => {
      tracker.updateVirtualTime(100, 10);
      tracker.calculateVirtualFinishTime('req-1', 'tenant-1', 1000, 10); // Start: 10, Finish: 110

      tracker.updateVirtualTime(50, 10);
      tracker.calculateVirtualFinishTime('req-2', 'tenant-2', 1000, 10); // Start: 15, Finish: 115

      const stats = tracker.getStatistics();

      expect(stats.count).toBe(2);
      expect(stats.minVirtualFinishTime).toBe(110);
      expect(stats.maxVirtualFinishTime).toBe(115);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very high weights', () => {
      const finishTime = tracker.calculateVirtualFinishTime('req-1', 'tenant-1', 10000, 1000);
      expect(finishTime.virtualFinishTime).toBe(10);
    });

    it('should handle weight of 1', () => {
      const finishTime = tracker.calculateVirtualFinishTime('req-1', 'tenant-1', 1000, 1);
      expect(finishTime.virtualFinishTime).toBe(1000);
    });

    it('should handle zero service time', () => {
      const finishTime = tracker.calculateVirtualFinishTime('req-1', 'tenant-1', 0, 10);
      expect(finishTime.virtualFinishTime).toBe(0);
    });

    it('should handle multiple requests with same finish time', () => {
      tracker.calculateVirtualFinishTime('req-1', 'tenant-1', 1000, 10);
      tracker.updateVirtualTime(0, 10); // Don't advance time
      tracker.calculateVirtualFinishTime('req-2', 'tenant-2', 1000, 10);

      const ft1 = tracker.getVirtualFinishTime('req-1');
      const ft2 = tracker.getVirtualFinishTime('req-2');

      expect(ft1?.virtualFinishTime).toBe(ft2?.virtualFinishTime);
    });
  });

  describe('State Management', () => {
    it('should return immutable state copy', () => {
      const state1 = tracker.getState();
      state1.currentTime = 999;

      const state2 = tracker.getState();
      expect(state2.currentTime).not.toBe(999);
    });

    it('should persist state across operations', () => {
      tracker.updateVirtualTime(1000, 10);
      tracker.setActiveWeightSum(50);

      const state = tracker.getState();
      expect(state.currentTime).toBe(100);
      expect(state.activeWeightSum).toBe(50);
    });
  });
});
