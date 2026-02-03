/**
 * MemoryQueue 단위 테스트
 */
const { MemoryQueue, REQUEST_STATUS } = require('../src-simple/queue/MemoryQueue');

describe('MemoryQueue', () => {
  let queue;

  beforeEach(() => {
    queue = new MemoryQueue();
  });

  describe('createRequest', () => {
    test('요청 생성 시 UUID 부여', () => {
      const request = queue.createRequest({ prompt: 'test' });

      expect(request.id).toBeDefined();
      expect(request.id).toMatch(/^[0-9a-f-]{36}$/);
    });

    test('기본값이 올바르게 설정됨', () => {
      const request = queue.createRequest({ prompt: 'test' });

      expect(request.status).toBe(REQUEST_STATUS.PENDING);
      expect(request.priority).toBe(2);  // NORMAL
      expect(request.tenantId).toBe('default');
      expect(request.createdAt).toBeDefined();
    });

    test('사용자 지정 값이 적용됨', () => {
      const request = queue.createRequest({
        prompt: 'test',
        priority: 4,
        tenantId: 'my-tenant',
        tier: 'enterprise'
      });

      expect(request.priority).toBe(4);
      expect(request.tenantId).toBe('my-tenant');
      expect(request.tier).toBe('enterprise');
    });
  });

  describe('getRequest', () => {
    test('존재하는 요청 조회', () => {
      const created = queue.createRequest({ prompt: 'test' });
      const found = queue.getRequest(created.id);

      expect(found).toBe(created);
    });

    test('존재하지 않는 요청은 null 반환', () => {
      const found = queue.getRequest('non-existent');

      expect(found).toBeNull();
    });
  });

  describe('상태 업데이트', () => {
    test('startProcessing이 상태와 시간 업데이트', () => {
      const request = queue.createRequest({ prompt: 'test' });

      queue.startProcessing(request.id);

      expect(request.status).toBe(REQUEST_STATUS.PROCESSING);
      expect(request.startedAt).toBeDefined();
    });

    test('completeRequest가 응답과 상태 업데이트', () => {
      const request = queue.createRequest({ prompt: 'test' });
      queue.startProcessing(request.id);

      queue.completeRequest(request.id, 'LLM 응답');

      expect(request.status).toBe(REQUEST_STATUS.COMPLETED);
      expect(request.response).toBe('LLM 응답');
      expect(request.completedAt).toBeDefined();
    });

    test('failRequest가 에러와 상태 업데이트', () => {
      const request = queue.createRequest({ prompt: 'test' });
      queue.startProcessing(request.id);

      queue.failRequest(request.id, '에러 발생');

      expect(request.status).toBe(REQUEST_STATUS.FAILED);
      expect(request.error).toBe('에러 발생');
    });
  });

  describe('조회 기능', () => {
    beforeEach(() => {
      // 테스트 데이터 준비
      const req1 = queue.createRequest({ prompt: 'req1' });
      const req2 = queue.createRequest({ prompt: 'req2' });
      const req3 = queue.createRequest({ prompt: 'req3' });

      queue.startProcessing(req1.id);
      queue.completeRequest(req2.id, 'done');
    });

    test('getRequestsByStatus가 상태별 필터링', () => {
      const pending = queue.getRequestsByStatus(REQUEST_STATUS.PENDING);
      const processing = queue.getRequestsByStatus(REQUEST_STATUS.PROCESSING);
      const completed = queue.getRequestsByStatus(REQUEST_STATUS.COMPLETED);

      expect(pending.length).toBe(1);
      expect(processing.length).toBe(1);
      expect(completed.length).toBe(1);
    });

    test('getAllRequests가 모든 요청 반환', () => {
      const all = queue.getAllRequests();

      expect(all.length).toBe(3);
    });

    test('getStats가 통계 반환', () => {
      const stats = queue.getStats();

      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.processing).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(0);
    });
  });

  describe('clear', () => {
    test('큐 초기화', () => {
      queue.createRequest({ prompt: 'test1' });
      queue.createRequest({ prompt: 'test2' });

      queue.clear();

      expect(queue.getAllRequests().length).toBe(0);
    });
  });
});
