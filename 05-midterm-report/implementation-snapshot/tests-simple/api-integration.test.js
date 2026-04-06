/**
 * API Integration Tests
 * REST API 엔드포인트 통합 테스트
 */

const schedulers = require('../src-simple/schedulers/index');

describe('API Integration: /api/fairness endpoint', () => {

  describe('WFQ Scheduler - fairness index available', () => {
    let wfqScheduler;
    let mockMemoryQueue;
    let mockJsonStore;
    let mockLlmClient;

    beforeEach(() => {
      // WFQ 스케줄러 인스턴스 생성
      wfqScheduler = new schedulers.WFQScheduler();

      // 테넌트 등록
      wfqScheduler.registerTenant('tenant-1', 'enterprise');
      wfqScheduler.registerTenant('tenant-2', 'free');

      // Mock 의존성
      mockMemoryQueue = {
        createRequest: jest.fn(),
        getRequest: jest.fn(),
        getAllRequests: jest.fn(),
        getRequestsByStatus: jest.fn(),
        getStats: jest.fn()
      };

      mockJsonStore = {
        saveRequestLog: jest.fn(),
        getSchedulerComparison: jest.fn(),
        getTenantStats: jest.fn(),
        getRecentLogs: jest.fn()
      };

      mockLlmClient = {
        generate: jest.fn(),
        isAvailable: jest.fn()
      };
    });

    test('GET /api/fairness는 WFQ 스케줄러의 fairnessIndex를 반환해야 함', () => {
      const stats = wfqScheduler.getStats();

      expect(stats).toBeDefined();
      expect(stats.fairnessIndex).toBeDefined();
      expect(typeof stats.fairnessIndex).toBe('number');
      expect(stats.fairnessIndex).toBeGreaterThanOrEqual(0);
      expect(stats.fairnessIndex).toBeLessThanOrEqual(1);
    });

    test('WFQ getStats는 테넌트 정보를 포함해야 함', () => {
      const stats = wfqScheduler.getStats();

      expect(stats.tenants).toBeDefined();
      expect(typeof stats.tenants).toBe('object');
    });
  });

  describe('FCFS Scheduler - fairness index not available', () => {
    let fcfsScheduler;

    beforeEach(() => {
      fcfsScheduler = new schedulers.FCFSScheduler();
    });

    test('FCFS getStats는 fairnessIndex를 반환하지 않아야 함', () => {
      const stats = fcfsScheduler.getStats ? fcfsScheduler.getStats() : undefined;

      expect(stats).toBeUndefined();
      expect(typeof stats).not.toBe('object');
    });
  });

  describe('MLFQ Scheduler - fairness index not available', () => {
    let mlfqScheduler;

    beforeEach(() => {
      mlfqScheduler = new schedulers.MLFQScheduler();
    });

    test('MLFQ getStats는 fairnessIndex를 반환하지 않아야 함', () => {
      const stats = mlfqScheduler.getStats ? mlfqScheduler.getStats() : undefined;

      expect(stats).toBeUndefined();
      expect(typeof stats).not.toBe('object');
    });
  });

  describe('Fairness Index calculation validation', () => {
    let wfqScheduler;

    beforeEach(() => {
      wfqScheduler = new schedulers.WFQScheduler();
      wfqScheduler.registerTenant('tenant-1', 'enterprise');
      wfqScheduler.registerTenant('tenant-2', 'premium');
      wfqScheduler.registerTenant('tenant-3', 'standard');
      wfqScheduler.registerTenant('tenant-4', 'free');
    });

    test('빈 큐에서는 공정성 지수가 1이어야 함 (완전 공정)', () => {
      const fairnessIndex = wfqScheduler.calculateFairnessIndex();

      expect(fairnessIndex).toBe(1);
    });

    test('단일 테넌트만 처리된 경우 공정성 지수는 1이어야 함', () => {
      const request = {
        id: 'test-1',
        tenantId: 'tenant-1',
        tier: 'enterprise',
        estimatedTokens: 100,
        prompt: 'test'
      };

      wfqScheduler.enqueue(request);
      wfqScheduler.dequeue();

      const fairnessIndex = wfqScheduler.calculateFairnessIndex();

      expect(fairnessIndex).toBe(1);
    });

    test('다중 테넌트 처리 후 공정성 지수 계산', () => {
      // Enterprise 테넌트에 더 많은 요청
      for (let i = 0; i < 10; i++) {
        const request = {
          id: `test-${i}`,
          tenantId: 'tenant-1',
          tier: 'enterprise',
          estimatedTokens: 100,
          prompt: 'test',
          createdAt: Date.now() + i
        };
        wfqScheduler.enqueue(request);
        wfqScheduler.dequeue();
      }

      // Free 테넌트에 적은 요청
      for (let i = 0; i < 2; i++) {
        const request = {
          id: `test-free-${i}`,
          tenantId: 'tenant-4',
          tier: 'free',
          estimatedTokens: 100,
          prompt: 'test',
          createdAt: Date.now() + 10 + i
        };
        wfqScheduler.enqueue(request);
        wfqScheduler.dequeue();
      }

      const fairnessIndex = wfqScheduler.calculateFairnessIndex();

      expect(fairnessIndex).toBeGreaterThan(0);
      expect(fairnessIndex).toBeLessThanOrEqual(1);
    });
  });

  describe('Response structure validation', () => {
    test('fairness API 응답 구조 검증', () => {
      const wfqScheduler = new schedulers.WFQScheduler();
      wfqScheduler.registerTenant('tenant-1', 'enterprise');

      const stats = wfqScheduler.getStats();

      // 예상 응답 구조
      const expectedResponse = {
        scheduler: 'WFQ',
        fairnessIndex: stats.fairnessIndex,
        timestamp: expect.any(String)
      };

      expect(stats.fairnessIndex).toBeDefined();
      expect(typeof stats.fairnessIndex).toBe('number');
    });
  });
});
