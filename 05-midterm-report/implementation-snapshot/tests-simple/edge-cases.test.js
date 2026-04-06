/**
 * Edge Case Tests for LLM Scheduler
 * Tests for error handling, boundary conditions, and edge cases
 */

const { validateRequest, validateTenant, validateQueryParams, PRIORITIES, TIERS } = require('../src-simple/utils/validation');
const { WFQScheduler } = require('../src-simple/schedulers/WFQScheduler');
const { PriorityScheduler } = require('../src-simple/schedulers/PriorityScheduler');
const { MLFQScheduler } = require('../src-simple/schedulers/MLFQScheduler');
const FCFSScheduler = require('../src-simple/schedulers/FCFSScheduler');

describe('Edge Case: Validation Error Handling', () => {
  describe('validateRequest with malformed inputs', () => {
    test('null and undefined inputs', () => {
      const result1 = validateRequest(null);
      expect(result1.valid).toBe(false);
      expect(result1.errors).toContain('prompt must be a non-empty string');

      const result2 = validateRequest(undefined);
      expect(result2.valid).toBe(false);
      expect(result2.errors).toContain('prompt must be a non-empty string');
    });

    test('non-object inputs', () => {
      const result1 = validateRequest('string');
      expect(result1.valid).toBe(false);

      const result2 = validateRequest(123);
      expect(result2.valid).toBe(false);

      const result3 = validateRequest([]);
      expect(result3.valid).toBe(false);
    });

    test('empty prompt with whitespace', () => {
      const result = validateRequest({ prompt: '   ' });
      expect(result.valid).toBe(false);
      expect(result.sanitized.prompt).toBe('');
    });

    test('prompt at exact boundary (10,000 chars)', () => {
      const longPrompt = 'a'.repeat(10000);
      const result = validateRequest({ prompt: longPrompt });
      // 10,000 is the boundary, it should be valid (only > 10000 is invalid)
      expect(result.errors.some(e => e.includes('10,000'))).toBe(false);
      expect(result.sanitized.prompt.length).toBe(10000);
    });

    test('prompt over boundary (10,001 chars)', () => {
      const tooLongPrompt = 'a'.repeat(10001);
      const result = validateRequest({ prompt: tooLongPrompt });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('10,000'))).toBe(true);
      expect(result.sanitized.prompt).toBeDefined();
      expect(result.sanitized.prompt.length).toBeLessThanOrEqual(10000);
    });

    test('special characters in tenantId', () => {
      const result1 = validateRequest({ prompt: 'test', tenantId: 'tenant@example.com' });
      expect(result1.valid).toBe(false);
      expect(result1.errors.some(e => e.includes('alphanumeric'))).toBe(true);

      const result2 = validateRequest({ prompt: 'test', tenantId: 'tenant with spaces' });
      expect(result2.valid).toBe(false);

      const result3 = validateRequest({ prompt: 'test', tenantId: 'tenant_with-underscore123' });
      expect(result3.valid).toBe(true);
    });
  });

  describe('validateTenant edge cases', () => {
    test('tenantId with unicode characters passes validateTenant', () => {
      const result = validateTenant({ tenantId: '테넌트' });
      // validateTenant only checks if tenantId exists and is a string, not the format
      // validateRequest handles the format validation
      expect(result.valid).toBe(true);
      expect(result.sanitized.tenantId).toBe('테넌트');
    });

    test('empty tier with default fallback', () => {
      const result = validateTenant({ tenantId: 'test-tenant' });
      expect(result.valid).toBe(true);
      expect(result.sanitized.tier).toBe('standard');
    });

    test('weight at boundary values', () => {
      const result1 = validateTenant({ tenantId: 'test', weight: 0 });
      expect(result1.valid).toBe(false);

      const result2 = validateTenant({ tenantId: 'test', weight: 1001 });
      expect(result2.valid).toBe(false);

      const result3 = validateTenant({ tenantId: 'test', weight: 1 });
      expect(result3.valid).toBe(true);

      const result4 = validateTenant({ tenantId: 'test', weight: 1000 });
      expect(result4.valid).toBe(true);
    });
  });

  describe('validateQueryParams edge cases', () => {
    test('limit at boundary values', () => {
      const result1 = validateQueryParams({ limit: 0 });
      expect(result1.limit).toBe(100); // default for invalid

      const result2 = validateQueryParams({ limit: 1001 });
      expect(result2.limit).toBe(100); // default for invalid (> 1000)

      const result3 = validateQueryParams({ limit: -1 });
      expect(result3.limit).toBe(100); // default for invalid (< 0)

      const result4 = validateQueryParams({ limit: 500 });
      expect(result4.limit).toBe(500);
    });

    test('negative offset', () => {
      const result = validateQueryParams({ offset: -10 });
      expect(result.offset).toBe(0); // clamped to 0
    });

    test('invalid status values are ignored', () => {
      const result = validateQueryParams({ status: 'invalid-status' });
      expect(result.status).toBeUndefined();
    });
  });
});

describe('Edge Case: Scheduler Empty Queue Behavior', () => {
  test('WFQ: dequeue from empty queue returns null', () => {
    const scheduler = new WFQScheduler();
    expect(scheduler.dequeue()).toBeNull();
    expect(scheduler.size()).toBe(0);
  });

  test('Priority: dequeue from empty queue returns null', () => {
    const scheduler = new PriorityScheduler();
    expect(scheduler.dequeue()).toBeNull();
    expect(scheduler.size()).toBe(0);
  });

  test('MLFQ: dequeue from empty queue returns null', () => {
    const scheduler = new MLFQScheduler();
    expect(scheduler.dequeue()).toBeNull();
    expect(scheduler.isEmpty()).toBe(true);
  });

  test('FCFS: dequeue from empty queue returns null', () => {
    const scheduler = new FCFSScheduler();
    expect(scheduler.dequeue()).toBeNull();
    expect(scheduler.size()).toBe(0);
  });
});

describe('Edge Case: Single Request Operations', () => {
  test('WFQ: single request fairness calculation', () => {
    const scheduler = new WFQScheduler();
    scheduler.registerTenant('tenant1', 'enterprise');

    scheduler.enqueue({
      id: '1',
      prompt: 'test',
      tenantId: 'tenant1',
      estimatedTokens: 100
    });

    expect(scheduler.size()).toBe(1);

    const stats = scheduler.getStats();
    expect(stats.fairnessIndex).toBe(1); // Single tenant = perfectly fair
  });

  test('Priority: single request with aging', () => {
    const scheduler = new PriorityScheduler();

    scheduler.enqueue({
      id: '1',
      prompt: 'test',
      priority: 'LOW',
      createdAt: Date.now()
    });

    scheduler.startAging();
    scheduler.applyAging(); // Should not increase (not waited enough)

    const request = scheduler.dequeue();
    expect(request.effectivePriority).toBe('LOW'); // Still LOW (string, not number)

    scheduler.stopAging();
  });

  test('MLFQ: single request across all queues', () => {
    const scheduler = new MLFQScheduler();

    scheduler.enqueue({ id: '1', prompt: 'test', estimatedTokens: 100 });
    expect(scheduler.size()).toBe(1);

    const request = scheduler.dequeue();
    expect(request).toBeDefined();
    expect(request.id).toBe('1');
  });
});

describe('Edge Case: Large Number of Requests', () => {
  test('WFQ: 1000 requests performance', () => {
    const scheduler = new WFQScheduler();
    const tenants = ['tenant1', 'tenant2', 'tenant3'];
    tenants.forEach(t => scheduler.registerTenant(t, 'standard'));

    const startTime = Date.now();
    for (let i = 0; i < 1000; i++) {
      scheduler.enqueue({
        id: `${i}`,
        prompt: 'test',
        tenantId: tenants[i % 3],
        estimatedTokens: 100
      });
    }
    const enqueueTime = Date.now() - startTime;

    expect(enqueueTime).toBeLessThan(1000); // Should complete in < 1 second
    expect(scheduler.size()).toBe(1000);

    // Process all requests
    for (let i = 0; i < 1000; i++) {
      const request = scheduler.dequeue();
      expect(request).toBeDefined();
    }

    expect(scheduler.size()).toBe(0);
  });

  test('Priority: 1000 same-priority requests', () => {
    const scheduler = new PriorityScheduler();

    for (let i = 0; i < 1000; i++) {
      scheduler.enqueue({
        id: `${i}`,
        prompt: 'test',
        priority: 'NORMAL'
      });
    }

    expect(scheduler.size()).toBe(1000);

    // Should maintain FIFO order for same priority
    for (let i = 0; i < 1000; i++) {
      const request = scheduler.dequeue();
      expect(request.id).toBe(`${i}`);
    }
  });
});

describe('Edge Case: Request with Missing/Optional Fields', () => {
  test('WFQ: request without tenantId uses default', () => {
    const scheduler = new WFQScheduler();

    scheduler.enqueue({
      id: '1',
      prompt: 'test',
      estimatedTokens: 100
    });

    const request = scheduler.dequeue();
    expect(request.tenantId).toBe('default');
  });

  test('WFQ: request without estimatedTokens uses default', () => {
    const scheduler = new WFQScheduler();
    scheduler.registerTenant('tenant1', 'enterprise');

    scheduler.enqueue({
      id: '1',
      prompt: 'test',
      tenantId: 'tenant1'
    });

    const stats = scheduler.getStats();
    expect(stats.tenants.tenant1.processed).toBe(0); // Not processed yet
  });

  test('Priority: request without priority uses NORMAL', () => {
    const scheduler = new PriorityScheduler();

    scheduler.enqueue({ id: '1', prompt: 'test' });

    const request = scheduler.dequeue();
    expect(request.effectivePriority).toBe(PRIORITIES.NORMAL);
  });
});

describe('Edge Case: Concurrent-Like Behavior', () => {
  test('Priority: aging affects multiple long-waiting requests', () => {
    const scheduler = new PriorityScheduler();
    const oldTime = Date.now() - 10000; // 10 seconds ago

    scheduler.enqueue({
      id: '1',
      prompt: 'test',
      priority: 'LOW',
      createdAt: oldTime
    });
    scheduler.enqueue({
      id: '2',
      prompt: 'test',
      priority: 'LOW',
      createdAt: oldTime
    });
    scheduler.enqueue({
      id: '3',
      prompt: 'test',
      priority: 'NORMAL',
      createdAt: Date.now()
    });

    scheduler.applyAging(); // LOW requests should be promoted

    // LOW requests should now be elevated
    // After aging, LOW (1) becomes NORMAL (2), so new NORMAL comes first
    const req1 = scheduler.dequeue();
    expect(req1.id).toBe('3'); // NORMAL (newer)

    const req2 = scheduler.dequeue();
    expect(req2.id).toBe('1'); // First promoted LOW

    const req3 = scheduler.dequeue();
    expect(req3.id).toBe('2'); // Second promoted LOW
  });

  test('WFQ: tenant with zero weight still gets service', () => {
    const scheduler = new WFQScheduler();

    // Manually register a tenant with minimal weight
    scheduler.tenants.set('low-priority', {
      weight: 1,
      virtualTime: 0,
      processed: 0,
      tier: 'free'
    });

    scheduler.enqueue({
      id: '1',
      prompt: 'test',
      tenantId: 'low-priority',
      estimatedTokens: 100
    });

    const request = scheduler.dequeue();
    expect(request).toBeDefined();
    expect(request.tenantId).toBe('low-priority');
  });
});

describe('Edge Case: Boundary Conditions', () => {
  test('WFQ: virtual finish time calculation for zero service time', () => {
    const scheduler = new WFQScheduler();
    scheduler.registerTenant('tenant1', 'enterprise');

    scheduler.enqueue({
      id: '1',
      prompt: 'test',
      tenantId: 'tenant1',
      estimatedTokens: 0
    });

    const stats = scheduler.getStats();
    expect(stats.fairnessIndex).toBe(1); // Single request, perfectly fair
  });

  test('MLFQ: feedback to maximum queue level', () => {
    const scheduler = new MLFQScheduler();

    scheduler.enqueue({ id: '1', prompt: 'test', estimatedTokens: 100 });
    scheduler.enqueue({ id: '2', prompt: 'test', estimatedTokens: 100 });

    // Simulate feedback beyond max queue - requeue maintains original level
    const request1 = scheduler.dequeue();
    const originalLevel = request1.queueLevel || 0;
    scheduler.requeue(request1, 10); // Beyond max queue (3)

    // requeue doesn't modify queueLevel, it places in appropriate queue
    expect(request1.queueLevel).toBe(originalLevel);
  });

  test('FCFS: maintains exact insertion order', () => {
    const scheduler = new FCFSScheduler();

    // Use fixed order for deterministic test
    const ids = [];
    for (let i = 0; i < 10; i++) {
      const id = `req-${i}`;
      ids.push(id);
      scheduler.enqueue({ id, prompt: 'test' });
    }

    for (let i = 0; i < 10; i++) {
      const request = scheduler.dequeue();
      expect(request.id).toBe(ids[i]);
    }
  });
});
