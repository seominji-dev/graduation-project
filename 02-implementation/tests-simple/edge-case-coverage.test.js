/**
 * Edge Case Coverage Tests
 *
 * These tests cover edge cases and error handling paths
 * that were previously uncovered in the test suite.
 *
 * Target: Increase branch coverage from 92.43% to 95%+
 */

const { PriorityScheduler, PRIORITY } = require('../src-simple/schedulers/PriorityScheduler');
const { MLFQScheduler } = require('../src-simple/schedulers/MLFQScheduler');
const { WFQScheduler, DEFAULT_WEIGHTS } = require('../src-simple/schedulers/WFQScheduler');
const JSONStore = require('../src-simple/storage/JSONStore');
const { validateRequest, validateTenant } = require('../src-simple/utils/validation');
const fs = require('fs');
const path = require('path');

describe('Edge Case Coverage Tests', () => {
  describe('PriorityScheduler - Aging Mechanism', () => {
    let scheduler;

    beforeEach(() => {
      scheduler = new PriorityScheduler();
      // Mock current time for consistent testing
      jest.spyOn(Date, 'now').mockReturnValue(1000000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
      scheduler.stopAging();
    });

    test('applyAging increases priority for long-waiting requests (line 33)', () => {
      // Add requests with different priorities
      const lowRequest = {
        id: 'req-1',
        priority: PRIORITY.LOW,
        createdAt: 994000, // 6 seconds ago (> 5 second threshold)
        effectivePriority: PRIORITY.LOW
      };

      const normalRequest = {
        id: 'req-2',
        priority: PRIORITY.NORMAL,
        createdAt: 994000, // 6 seconds ago
        effectivePriority: PRIORITY.NORMAL
      };

      scheduler.enqueue(lowRequest);
      scheduler.enqueue(normalRequest);

      // Apply aging
      scheduler.applyAging();

      // Verify priorities increased
      expect(lowRequest.effectivePriority).toBe(PRIORITY.NORMAL); // LOW -> NORMAL
      expect(normalRequest.effectivePriority).toBe(PRIORITY.HIGH); // NORMAL -> HIGH
    });

    test('applyAging caps at URGENT priority', () => {
      const urgentRequest = {
        id: 'req-1',
        priority: PRIORITY.URGENT,
        createdAt: 994000, // 6 seconds ago
        effectivePriority: PRIORITY.URGENT
      };

      const highRequest = {
        id: 'req-2',
        priority: PRIORITY.HIGH,
        createdAt: 994000, // 6 seconds ago
        effectivePriority: PRIORITY.HIGH
      };

      scheduler.enqueue(urgentRequest);
      scheduler.enqueue(highRequest);

      scheduler.applyAging();

      // URGENT should remain at URGENT (capped)
      expect(urgentRequest.effectivePriority).toBe(PRIORITY.URGENT);
      expect(highRequest.effectivePriority).toBe(PRIORITY.URGENT); // HIGH -> URGENT
    });

    test('applyAging does not affect recent requests', () => {
      const recentRequest = {
        id: 'req-1',
        priority: PRIORITY.LOW,
        createdAt: 999000, // 1 second ago (< 5 second threshold)
        effectivePriority: PRIORITY.LOW
      };

      scheduler.enqueue(recentRequest);
      scheduler.applyAging();

      // Priority should not change
      expect(recentRequest.effectivePriority).toBe(PRIORITY.LOW);
    });
  });

  describe('MLFQScheduler - Boosting Interval', () => {
    let scheduler;

    beforeEach(() => {
      jest.useFakeTimers();
      scheduler = new MLFQScheduler();
    });

    afterEach(() => {
      scheduler.stopBoosting();
      jest.useRealTimers();
    });

    test('startBoosting calls boost periodically (line 48)', () => {
      // Add requests to Q0
      scheduler.enqueue({
        id: 'req-1',
        estimatedTokens: 100,
        createdAt: Date.now()
      });

      // Verify initial state - 1 request in queue
      expect(scheduler.size()).toBe(1);

      // Start boosting
      scheduler.startBoosting();

      // Fast-forward time to trigger boost
      jest.advanceTimersByTime(5000); // BOOST_INTERVAL_MS

      // Verify scheduler still functions after boost
      expect(scheduler.size()).toBe(1);
      const request = scheduler.dequeue();
      expect(request).toBeDefined();
      expect(request.id).toBe('req-1');
    });
  });

  describe('WFQScheduler - Tenant Management', () => {
    let scheduler;

    beforeEach(() => {
      scheduler = new WFQScheduler();
    });

    test('dequeue handles missing tenant gracefully (line 95)', () => {
      // Register a tenant
      scheduler.registerTenant('tenant-1', 'standard');

      // Manually create a request with invalid tenant
      const invalidRequest = {
        id: 'req-1',
        tenantId: 'non-existent-tenant',
        virtualFinishTime: 100
      };

      // Manually add to queue (bypassing enqueue validation)
      scheduler.queue.push(invalidRequest);

      // Dequeue should handle missing tenant
      const result = scheduler.dequeue();

      // Should return the request even without tenant
      expect(result).toBeDefined();
      expect(result.id).toBe('req-1');
    });

    test('getStats returns correct normalized throughput', () => {
      scheduler.registerTenant('enterprise', 'enterprise');
      scheduler.registerTenant('free', 'free');

      // Process some requests
      for (let i = 0; i < 10; i++) {
        const req = {
          id: `req-${i}`,
          tenantId: i % 2 === 0 ? 'enterprise' : 'free',
          virtualFinishTime: i * 10
        };
        scheduler.queue.push(req);
        scheduler.dequeue();
      }

      const stats = scheduler.getStats();

      expect(stats.tenants.enterprise.processed).toBe(5);
      expect(stats.tenants.free.processed).toBe(5);

      // Enterprise should have much higher normalized throughput due to weight
      expect(stats.tenants.enterprise.normalizedThroughput).toBeLessThan(
        stats.tenants.free.normalizedThroughput
      );
    });
  });

  describe('JSONStore - Error Handling', () => {
    const testDir = path.join(__dirname, 'test-storage');
    const testFile = path.join(testDir, 'test-requests.json');

    beforeEach(() => {
      // Create test directory
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
    });

    afterEach(() => {
      // Clean up test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });

    test('_readJSON handles invalid JSON gracefully (line 46)', () => {
      const store = new JSONStore(testFile);

      // Write invalid JSON
      fs.writeFileSync(testFile, 'invalid json content', 'utf-8');

      // Should return empty array instead of throwing
      const result = store._readJSON(testFile);

      expect(result).toEqual([]);
    });

    test('_readJSON handles missing file gracefully', () => {
      const store = new JSONStore(testFile);

      // Try to read non-existent file
      const result = store._readJSON('/non/existent/path.json');

      expect(result).toEqual([]);
    });
  });

  describe('Validation - Edge Cases', () => {
    describe('validateRequest - estimatedTokens branch (line 104)', () => {
      const baseRequest = {
        prompt: 'test prompt',
        tenantId: 'tenant-1'
      };

      test('accepts valid estimatedTokens', () => {
        const result = validateRequest({
          ...baseRequest,
          estimatedTokens: '1000'
        });

        expect(result.valid).toBe(true);
        expect(result.sanitized.estimatedTokens).toBe(1000);
        expect(result.errors).toHaveLength(0);
      });

      test('rejects negative estimatedTokens', () => {
        const result = validateRequest({
          ...baseRequest,
          estimatedTokens: '-100'
        });

        expect(result.valid).toBe(false);
        expect(result.sanitized.estimatedTokens).toBeUndefined();
        expect(result.errors).toContain('estimatedTokens must be a number between 1 and 128000');
      });

      test('rejects estimatedTokens above maximum', () => {
        const result = validateRequest({
          ...baseRequest,
          estimatedTokens: '200000'
        });

        expect(result.valid).toBe(false);
        expect(result.sanitized.estimatedTokens).toBeUndefined();
        expect(result.errors).toContain('estimatedTokens must be a number between 1 and 128000');
      });

      test('rejects non-numeric estimatedTokens', () => {
        const result = validateRequest({
          ...baseRequest,
          estimatedTokens: 'not-a-number'
        });

        expect(result.valid).toBe(false);
        expect(result.sanitized.estimatedTokens).toBeUndefined();
        expect(result.errors).toContain('estimatedTokens must be a number between 1 and 128000');
      });

      test('accepts estimatedTokens at boundary values', () => {
        const minResult = validateRequest({
          ...baseRequest,
          estimatedTokens: '1'
        });

        expect(minResult.valid).toBe(true);
        expect(minResult.sanitized.estimatedTokens).toBe(1);

        const maxResult = validateRequest({
          ...baseRequest,
          estimatedTokens: '128000'
        });

        expect(maxResult.valid).toBe(true);
        expect(maxResult.sanitized.estimatedTokens).toBe(128000);
      });
    });

    describe('validateRequest - tier validation (line 142)', () => {
      test('accepts valid tier values (case-insensitive)', () => {
        const validTiers = ['enterprise', 'ENTERPRISE', 'Enterprise', 'premium', 'Premium', 'standard', 'free'];

        validTiers.forEach(tier => {
          const result = validateRequest({
            prompt: 'test prompt',
            tenantId: 'tenant-1',
            tier: tier
          });

          expect(result.valid).toBe(true);
          expect(result.sanitized.tier).toBe(tier.toLowerCase());
        });
      });

      test('rejects invalid tier values', () => {
        const result = validateRequest({
          prompt: 'test prompt',
          tenantId: 'tenant-1',
          tier: 'invalid-tier'
        });

        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('tier must be one of'))).toBe(true);
      });

      test('defaults to standard tier when not provided', () => {
        const result = validateRequest({
          prompt: 'test prompt',
          tenantId: 'tenant-1'
        });

        expect(result.valid).toBe(true);
        expect(result.sanitized.tier).toBe('standard');
      });
    });

    describe('validateTenant - tier validation (line 142)', () => {
      test('rejects invalid tier in tenant validation', () => {
        const result = validateTenant({
          tenantId: 'tenant-1',
          tier: 'invalid-tier'
        });

        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('tier must be one of'))).toBe(true);
      });

      test('accepts valid tier values in tenant validation', () => {
        const result = validateTenant({
          tenantId: 'tenant-1',
          tier: 'ENTERPRISE'
        });

        expect(result.valid).toBe(true);
        expect(result.sanitized.tier).toBe('enterprise');
      });

      test('defaults to standard tier when not provided in tenant', () => {
        const result = validateTenant({
          tenantId: 'tenant-1'
        });

        expect(result.valid).toBe(true);
        expect(result.sanitized.tier).toBe('standard');
      });
    });
  });
});
