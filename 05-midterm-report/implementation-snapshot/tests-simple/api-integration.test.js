/**
 * API 통합 테스트
 * 스케줄러별 공정성 지수 동작 확인
 */
const schedulers = require('../src-simple/schedulers/index');

describe('WFQ 스케줄러 - 공정성 지수', () => {
  let wfqScheduler;

  beforeEach(() => {
    wfqScheduler = new schedulers.WFQScheduler();
    wfqScheduler.registerTenant('tenant-1', 'enterprise');
    wfqScheduler.registerTenant('tenant-2', 'free');
  });

  test('getStats가 fairnessIndex를 반환함', () => {
    const stats = wfqScheduler.getStats();

    expect(stats).toBeDefined();
    expect(stats.fairnessIndex).toBeDefined();
    expect(typeof stats.fairnessIndex).toBe('number');
  });

  test('빈 큐에서는 공정성 지수가 1 (완전 공정)', () => {
    const fairnessIndex = wfqScheduler.calculateFairnessIndex();

    expect(fairnessIndex).toBe(1);
  });

  test('다중 테넌트 처리 후 공정성 지수가 0~1 범위', () => {
    for (let i = 0; i < 5; i++) {
      wfqScheduler.enqueue({
        id: `ent-${i}`,
        tenantId: 'tenant-1',
        tier: 'enterprise',
        estimatedTokens: 100,
        prompt: 'test',
        createdAt: Date.now() + i
      });
      wfqScheduler.dequeue();
    }

    const fairnessIndex = wfqScheduler.calculateFairnessIndex();

    expect(fairnessIndex).toBeGreaterThan(0);
    expect(fairnessIndex).toBeLessThanOrEqual(1);
  });
});

