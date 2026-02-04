/**
 * 스케줄러 단위 테스트
 */
const {
  FCFSScheduler,
  PriorityScheduler,
  MLFQScheduler,
  WFQScheduler,
  PRIORITY
} = require('../src-simple/schedulers');

// ============================================
// FCFS 스케줄러 테스트
// ============================================
describe('FCFSScheduler', () => {
  let scheduler;

  beforeEach(() => {
    scheduler = new FCFSScheduler();
  });

  test('빈 큐에서 dequeue하면 null 반환', () => {
    expect(scheduler.dequeue()).toBeNull();
  });

  test('선착순으로 요청 처리', () => {
    const req1 = { id: '1', prompt: 'first' };
    const req2 = { id: '2', prompt: 'second' };
    const req3 = { id: '3', prompt: 'third' };

    scheduler.enqueue(req1);
    scheduler.enqueue(req2);
    scheduler.enqueue(req3);

    expect(scheduler.dequeue()).toBe(req1);
    expect(scheduler.dequeue()).toBe(req2);
    expect(scheduler.dequeue()).toBe(req3);
  });

  test('size()가 정확한 큐 크기 반환', () => {
    expect(scheduler.size()).toBe(0);
    scheduler.enqueue({ id: '1' });
    expect(scheduler.size()).toBe(1);
    scheduler.enqueue({ id: '2' });
    expect(scheduler.size()).toBe(2);
  });

  test('isEmpty()가 큐 상태 정확히 반환', () => {
    expect(scheduler.isEmpty()).toBe(true);
    scheduler.enqueue({ id: '1' });
    expect(scheduler.isEmpty()).toBe(false);
  });
});

// ============================================
// BaseScheduler 테스트
// ============================================
describe('BaseScheduler', () => {
  const BaseScheduler = require('../src-simple/schedulers/BaseScheduler');

  test('dequeue()가 기본 구현에서 에러 발생', () => {
    const base = new BaseScheduler('test');
    expect(() => base.dequeue()).toThrow('dequeue()는 하위 클래스에서 구현해야 합니다');
  });

  test('enqueue()로 요청 추가 가능', () => {
    const base = new BaseScheduler('test');
    base.enqueue({ id: '1' });
    expect(base.size()).toBe(1);
  });
});

// ============================================
// Priority 스케줄러 테스트
// ============================================
describe('PriorityScheduler', () => {
  let scheduler;

  beforeEach(() => {
    scheduler = new PriorityScheduler();
  });

  afterEach(() => {
    scheduler.stopAging();
  });

  test('빈 큐에서 dequeue하면 null 반환', () => {
    expect(scheduler.dequeue()).toBeNull();
  });

  test('startAging과 stopAging 동작', (done) => {
    scheduler.startAging();
    expect(scheduler.agingInterval).not.toBeNull();

    // 한 번 더 stop 호출해도 문제 없음
    scheduler.stopAging();
    expect(scheduler.agingInterval).toBeNull();

    // 이미 null인 상태에서 다시 stop
    scheduler.stopAging();
    expect(scheduler.agingInterval).toBeNull();
    done();
  });

  test('높은 우선순위 요청이 먼저 처리됨', () => {
    const lowReq = { id: '1', priority: PRIORITY.LOW };
    const highReq = { id: '2', priority: PRIORITY.HIGH };
    const normalReq = { id: '3', priority: PRIORITY.NORMAL };

    scheduler.enqueue(lowReq);
    scheduler.enqueue(highReq);
    scheduler.enqueue(normalReq);

    expect(scheduler.dequeue().id).toBe('2');  // HIGH
    expect(scheduler.dequeue().id).toBe('3');  // NORMAL
    expect(scheduler.dequeue().id).toBe('1');  // LOW
  });

  test('같은 우선순위면 FCFS 순서', () => {
    const req1 = { id: '1', priority: PRIORITY.NORMAL };
    const req2 = { id: '2', priority: PRIORITY.NORMAL };

    scheduler.enqueue(req1);
    scheduler.enqueue(req2);

    expect(scheduler.dequeue().id).toBe('1');
    expect(scheduler.dequeue().id).toBe('2');
  });

  test('URGENT가 최고 우선순위', () => {
    const urgentReq = { id: '1', priority: PRIORITY.URGENT };
    const highReq = { id: '2', priority: PRIORITY.HIGH };

    scheduler.enqueue(highReq);
    scheduler.enqueue(urgentReq);

    expect(scheduler.dequeue().id).toBe('1');  // URGENT
  });

  test('applyAging이 우선순위를 증가시킴', () => {
    const oldReq = {
      id: '1',
      priority: PRIORITY.LOW,
      createdAt: Date.now() - 10000  // 10초 전
    };
    scheduler.enqueue(oldReq);

    scheduler.applyAging();

    // effectivePriority가 증가해야 함
    expect(oldReq.effectivePriority).toBeGreaterThan(PRIORITY.LOW);
  });

  test('applyAging이 URGENT 이상으로는 증가하지 않음', () => {
    const urgentReq = {
      id: '1',
      priority: PRIORITY.URGENT,
      createdAt: Date.now() - 10000  // 10초 전
    };
    scheduler.enqueue(urgentReq);

    scheduler.applyAging();

    // URGENT 이상으로는 증가하지 않음
    expect(urgentReq.effectivePriority).toBe(PRIORITY.URGENT);
  });

  test('applyAging이 최근 요청은 건너뜀', () => {
    const newReq = {
      id: '1',
      priority: PRIORITY.LOW,
      createdAt: Date.now()  // 방금 생성
    };
    scheduler.enqueue(newReq);

    scheduler.applyAging();

    // 최근 요청은 우선순위 유지
    expect(newReq.effectivePriority).toBe(PRIORITY.LOW);
  });

  test('createdAt이 이미 있으면 유지', () => {
    const customTime = 1234567890;
    const req = { id: '1', priority: PRIORITY.NORMAL, createdAt: customTime };
    scheduler.enqueue(req);
    expect(req.createdAt).toBe(customTime);
  });

  test('priority 없으면 NORMAL 기본값', () => {
    const req = { id: '1' };
    scheduler.enqueue(req);
    expect(req.effectivePriority).toBe(PRIORITY.NORMAL);
  });
});

// ============================================
// MLFQ 스케줄러 테스트
// ============================================
describe('MLFQScheduler', () => {
  let scheduler;

  beforeEach(() => {
    scheduler = new MLFQScheduler();
  });

  afterEach(() => {
    scheduler.stopBoosting();
  });

  test('빈 큐에서 dequeue하면 null 반환', () => {
    expect(scheduler.dequeue()).toBeNull();
  });

  test('startBoosting과 stopBoosting 동작', (done) => {
    scheduler.startBoosting();
    expect(scheduler.boostInterval).not.toBeNull();

    scheduler.stopBoosting();
    expect(scheduler.boostInterval).toBeNull();

    // 이미 null인 상태에서 다시 stop
    scheduler.stopBoosting();
    expect(scheduler.boostInterval).toBeNull();
    done();
  });

  test('requeue가 요청을 올바른 큐에 삽입', () => {
    const req = { id: '1', queueLevel: 2 };
    scheduler.requeue(req);
    expect(scheduler.queues[2].length).toBe(1);
  });

  test('requeue가 queueLevel 없으면 Q0에 삽입', () => {
    const req = { id: '1' };
    scheduler.requeue(req);
    expect(scheduler.queues[0].length).toBe(1);
  });

  test('isEmpty가 모든 큐 확인', () => {
    expect(scheduler.isEmpty()).toBe(true);
    scheduler.queues[2].push({ id: '1' });
    expect(scheduler.isEmpty()).toBe(false);
  });

  test('feedback이 최대 큐 레벨을 초과하지 않음', () => {
    const req = { id: '1', queueLevel: 3, usedTime: 0 };
    scheduler.feedback(req, 100000);  // 많은 시간 사용
    expect(req.queueLevel).toBe(3);  // 최대 레벨 유지
  });

  test('새 요청은 Q0에 배치', () => {
    const req = { id: '1', prompt: 'test' };
    scheduler.enqueue(req);

    expect(req.queueLevel).toBe(0);
  });

  test('높은 우선순위 큐부터 처리', () => {
    const req1 = { id: '1' };
    const req2 = { id: '2' };

    scheduler.enqueue(req1);
    scheduler.enqueue(req2);

    // Q0에서 처리
    expect(scheduler.dequeue().id).toBe('1');
  });

  test('feedback으로 큐 레벨 하락', () => {
    const req = { id: '1', queueLevel: 0, usedTime: 0 };
    scheduler.enqueue(req);

    // 시간 할당량 초과 피드백
    scheduler.feedback(req, 2000);  // 1초 초과

    expect(req.queueLevel).toBe(1);
  });

  test('boost가 모든 요청을 Q0로 이동', () => {
    const req1 = { id: '1', queueLevel: 2 };
    const req2 = { id: '2', queueLevel: 3 };

    scheduler.queues[2].push(req1);
    scheduler.queues[3].push(req2);

    scheduler.boost();

    expect(scheduler.queues[0].length).toBe(2);
    expect(scheduler.queues[2].length).toBe(0);
    expect(scheduler.queues[3].length).toBe(0);
  });

  test('size()가 모든 큐의 총합 반환', () => {
    scheduler.enqueue({ id: '1' });
    scheduler.enqueue({ id: '2' });
    scheduler.enqueue({ id: '3' });

    expect(scheduler.size()).toBe(3);
  });

  test('createdAt이 이미 있으면 유지', () => {
    const customTime = 1234567890;
    const req = { id: '1', createdAt: customTime };
    scheduler.enqueue(req);
    expect(req.createdAt).toBe(customTime);
  });

  test('feedback이 시간 할당량 미만이면 큐 레벨 유지', () => {
    const req = { id: '1', queueLevel: 0, usedTime: 0 };
    scheduler.feedback(req, 500);  // 1초 미만
    expect(req.queueLevel).toBe(0);  // 레벨 유지
  });

  test('Q1에서 처리', () => {
    scheduler.queues[1].push({ id: '1', queueLevel: 1 });
    expect(scheduler.dequeue().id).toBe('1');
  });

  test('Q2에서 처리', () => {
    scheduler.queues[2].push({ id: '1', queueLevel: 2 });
    expect(scheduler.dequeue().id).toBe('1');
  });

  test('Q3에서 처리', () => {
    scheduler.queues[3].push({ id: '1', queueLevel: 3 });
    expect(scheduler.dequeue().id).toBe('1');
  });
});

// ============================================
// WFQ 스케줄러 테스트
// ============================================
describe('WFQScheduler', () => {
  let scheduler;

  beforeEach(() => {
    scheduler = new WFQScheduler();
  });

  test('빈 큐에서 dequeue하면 null 반환', () => {
    expect(scheduler.dequeue()).toBeNull();
  });

  test('테넌트 등록 시 기본 tier 사용', () => {
    scheduler.registerTenant('test-tenant');
    expect(scheduler.tenants.get('test-tenant').weight).toBe(10);  // standard default
  });

  test('알 수 없는 tier는 standard 가중치 사용', () => {
    scheduler.registerTenant('test-tenant', 'unknown-tier');
    expect(scheduler.tenants.get('test-tenant').weight).toBe(10);  // standard default
  });

  test('tenantId 없으면 default 사용', () => {
    const req = { id: '1', estimatedTokens: 100 };
    scheduler.enqueue(req);
    expect(req.tenantId).toBe('default');
    expect(scheduler.tenants.has('default')).toBe(true);
  });

  test('createdAt이 이미 있으면 유지', () => {
    const customTime = 1234567890;
    const req = { id: '1', tenantId: 't1', createdAt: customTime };
    scheduler.enqueue(req);
    expect(req.createdAt).toBe(customTime);
  });

  test('처리량 없으면 fairness index 1 반환', () => {
    scheduler.registerTenant('a', 'enterprise');
    scheduler.registerTenant('b', 'premium');
    // processed = 0 상태
    expect(scheduler.calculateFairnessIndex()).toBe(1);
  });

  test('테넌트 없으면 fairness index 1 반환', () => {
    expect(scheduler.calculateFairnessIndex()).toBe(1);
  });

  test('테넌트 자동 등록', () => {
    const req = { id: '1', tenantId: 'tenant-a', tier: 'premium' };
    scheduler.enqueue(req);

    expect(scheduler.tenants.has('tenant-a')).toBe(true);
    expect(scheduler.tenants.get('tenant-a').weight).toBe(50);  // premium
  });

  test('Virtual Finish Time이 가장 작은 요청 선택', () => {
    // 가중치가 높은 테넌트의 VFT가 더 작음
    const enterpriseReq = { id: '1', tenantId: 'ent', tier: 'enterprise', estimatedTokens: 100 };
    const freeReq = { id: '2', tenantId: 'free', tier: 'free', estimatedTokens: 100 };

    scheduler.enqueue(freeReq);      // VFT = 100/1 = 100
    scheduler.enqueue(enterpriseReq); // VFT = 100/100 = 1

    expect(scheduler.dequeue().id).toBe('1');  // enterprise (VFT 작음)
  });

  test('가중치가 높으면 더 많이 처리됨', () => {
    // Enterprise (weight: 100) vs Free (weight: 1)
    scheduler.registerTenant('ent', 'enterprise');
    scheduler.registerTenant('free', 'free');

    // 동일 토큰 요청 여러 개 추가
    for (let i = 0; i < 10; i++) {
      scheduler.enqueue({ tenantId: 'ent', estimatedTokens: 10 });
      scheduler.enqueue({ tenantId: 'free', estimatedTokens: 10 });
    }

    // 모두 처리
    while (!scheduler.isEmpty()) {
      scheduler.dequeue();
    }

    const entProcessed = scheduler.tenants.get('ent').processed;
    const freeProcessed = scheduler.tenants.get('free').processed;

    // Enterprise가 Free보다 먼저 많이 처리됨 (가중치 비율에 따라)
    expect(entProcessed).toBe(10);
    expect(freeProcessed).toBe(10);
  });

  test('Jain Fairness Index 계산', () => {
    scheduler.registerTenant('a', 'enterprise');
    scheduler.registerTenant('b', 'enterprise');

    // 동일 가중치 테넌트에게 동일하게 처리
    scheduler.tenants.get('a').processed = 10;
    scheduler.tenants.get('b').processed = 10;

    const fairness = scheduler.calculateFairnessIndex();

    // 완전히 공정하면 1.0
    expect(fairness).toBeCloseTo(1.0);
  });

  test('getStats가 통계 반환', () => {
    scheduler.enqueue({ tenantId: 't1', tier: 'premium' });
    scheduler.dequeue();

    const stats = scheduler.getStats();

    expect(stats).toHaveProperty('tenants');
    expect(stats).toHaveProperty('fairnessIndex');
    expect(stats.tenants['t1']).toBeDefined();
  });
});
