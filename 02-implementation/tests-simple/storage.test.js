/**
 * JSONStore 단위 테스트
 */
const fs = require('fs');
const path = require('path');
const JSONStore = require('../src-simple/storage/JSONStore');

describe('JSONStore', () => {
  let store;
  const testDataDir = path.join(__dirname, '../data-test');

  beforeEach(() => {
    store = new JSONStore(testDataDir);
    store.initialize();
  });

  afterEach(() => {
    // 테스트 데이터 정리
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true });
    }
  });

  test('데이터 디렉토리와 파일 생성', () => {
    expect(fs.existsSync(testDataDir)).toBe(true);

    const logsFile = path.join(testDataDir, 'request-logs.json');
    expect(fs.existsSync(logsFile)).toBe(true);
  });

  test('요청 로그 저장', async () => {
    const request = {
      id: 'test-123',
      prompt: 'Hello',
      status: 'completed',
      createdAt: 1000,
      startedAt: 1100,
      completedAt: 1500,
      response: 'World'
    };

    await store.saveRequestLog(request, 'FCFS');

    const logs = await store.getRecentLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].id).toBe('test-123');
  });

  test('최신순 정렬', async () => {
    await store.saveRequestLog({ id: '1', createdAt: 1000, status: 'completed' }, 'FCFS');
    await store.saveRequestLog({ id: '2', createdAt: 3000, status: 'completed' }, 'FCFS');
    await store.saveRequestLog({ id: '3', createdAt: 2000, status: 'completed' }, 'FCFS');

    const logs = await store.getRecentLogs();

    expect(logs[0].id).toBe('2');  // 가장 최신
    expect(logs[2].id).toBe('1');  // 가장 오래됨
  });

  test('스케줄러 통계 저장', async () => {
    await store.saveSchedulerStats('WFQ', {
      totalRequests: 100,
      avgWaitTime: 50,
      fairnessIndex: 0.95
    });

    const statsFile = path.join(testDataDir, 'scheduler-stats.json');
    const data = JSON.parse(fs.readFileSync(statsFile, 'utf-8'));

    expect(data.length).toBe(1);
    expect(data[0].schedulerType).toBe('WFQ');
  });

  test('모든 데이터 초기화', async () => {
    await store.saveRequestLog({ id: '1', createdAt: 1000, status: 'completed' }, 'FCFS');

    await store.clear();

    const logs = await store.getRecentLogs();
    expect(logs.length).toBe(0);
  });
});
