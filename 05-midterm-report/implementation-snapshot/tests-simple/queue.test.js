/**
 * MemoryQueue 단위 테스트
 */
const { MemoryQueue, REQUEST_STATUS } = require('../src-simple/queue/MemoryQueue');

describe('MemoryQueue', () => {
  let queue;

  beforeEach(() => {
    queue = new MemoryQueue();
  });

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
  });

  test('존재하는 요청 조회', () => {
    const created = queue.createRequest({ prompt: 'test' });
    const found = queue.getRequest(created.id);

    expect(found).toBe(created);
  });

  test('startProcessing이 상태 업데이트', () => {
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
  });

  test('getStats가 통계 반환', () => {
    queue.createRequest({ prompt: 'req1' });
    queue.createRequest({ prompt: 'req2' });
    const req3 = queue.createRequest({ prompt: 'req3' });
    queue.completeRequest(req3.id, 'done');

    const stats = queue.getStats();

    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(1);
  });

  test('큐 초기화', () => {
    queue.createRequest({ prompt: 'test1' });
    queue.createRequest({ prompt: 'test2' });

    queue.clear();

    expect(queue.getAllRequests().length).toBe(0);
  });
});
