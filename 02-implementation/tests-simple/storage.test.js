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

  describe('initialize', () => {
    test('데이터 디렉토리 생성', () => {
      expect(fs.existsSync(testDataDir)).toBe(true);
    });

    test('로그 파일 생성', () => {
      const logsFile = path.join(testDataDir, 'request-logs.json');
      expect(fs.existsSync(logsFile)).toBe(true);
    });

    test('통계 파일 생성', () => {
      const statsFile = path.join(testDataDir, 'scheduler-stats.json');
      expect(fs.existsSync(statsFile)).toBe(true);
    });
  });

  describe('saveRequestLog', () => {
    test('요청 로그 저장', () => {
      const request = {
        id: 'test-123',
        prompt: 'Hello',
        priority: 2,
        tenantId: 'tenant-a',
        tier: 'premium',
        status: 'completed',
        createdAt: 1000,
        startedAt: 1100,
        completedAt: 1500,
        response: 'World'
      };

      store.saveRequestLog(request, 'FCFS');

      const logs = store.getRecentLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].id).toBe('test-123');
      expect(logs[0].waitTime).toBe(100);
      expect(logs[0].processingTime).toBe(400);
    });
  });

  describe('getRecentLogs', () => {
    test('최신순 정렬', () => {
      store.saveRequestLog({ id: '1', createdAt: 1000, status: 'completed' }, 'FCFS');
      store.saveRequestLog({ id: '2', createdAt: 3000, status: 'completed' }, 'FCFS');
      store.saveRequestLog({ id: '3', createdAt: 2000, status: 'completed' }, 'FCFS');

      const logs = store.getRecentLogs();

      expect(logs[0].id).toBe('2');  // 가장 최신
      expect(logs[1].id).toBe('3');
      expect(logs[2].id).toBe('1');  // 가장 오래됨
    });

    test('limit 적용', () => {
      for (let i = 0; i < 10; i++) {
        store.saveRequestLog({ id: `${i}`, createdAt: i * 1000, status: 'completed' }, 'FCFS');
      }

      const logs = store.getRecentLogs(5);
      expect(logs.length).toBe(5);
    });
  });

  describe('getTenantStats', () => {
    test('테넌트별 통계 계산', () => {
      store.saveRequestLog({
        id: '1', tenantId: 'tenant-a', status: 'completed',
        createdAt: 1000, startedAt: 1100, completedAt: 1500
      }, 'FCFS');
      store.saveRequestLog({
        id: '2', tenantId: 'tenant-a', status: 'completed',
        createdAt: 2000, startedAt: 2200, completedAt: 2800
      }, 'FCFS');
      store.saveRequestLog({
        id: '3', tenantId: 'tenant-b', status: 'completed',
        createdAt: 3000, startedAt: 3100, completedAt: 3300
      }, 'FCFS');

      const statsA = store.getTenantStats('tenant-a');

      expect(statsA.total).toBe(2);
      expect(statsA.completed).toBe(2);
      expect(statsA.avgWaitTime).toBe(150);  // (100 + 200) / 2
    });

    test('존재하지 않는 테넌트', () => {
      const stats = store.getTenantStats('non-existent');

      expect(stats.total).toBe(0);
    });
  });

  describe('getSchedulerComparison', () => {
    test('스케줄러별 통계 비교', () => {
      store.saveRequestLog({
        id: '1', status: 'completed', createdAt: 1000, startedAt: 1100, completedAt: 1300
      }, 'FCFS');
      store.saveRequestLog({
        id: '2', status: 'completed', createdAt: 2000, startedAt: 2050, completedAt: 2150
      }, 'Priority');
      store.saveRequestLog({
        id: '3', status: 'completed', createdAt: 3000, startedAt: 3200, completedAt: 3500
      }, 'FCFS');

      const comparison = store.getSchedulerComparison();

      expect(comparison.length).toBe(2);  // FCFS와 Priority

      const fcfsStats = comparison.find(s => s.schedulerType === 'FCFS');
      expect(fcfsStats.total).toBe(2);
    });
  });

  describe('saveSchedulerStats', () => {
    test('스케줄러 통계 저장', () => {
      store.saveSchedulerStats('WFQ', {
        totalRequests: 100,
        avgWaitTime: 50,
        avgProcessingTime: 200,
        fairnessIndex: 0.95
      });

      // 내부 파일 확인
      const statsFile = path.join(testDataDir, 'scheduler-stats.json');
      const data = JSON.parse(fs.readFileSync(statsFile, 'utf-8'));

      expect(data.length).toBe(1);
      expect(data[0].schedulerType).toBe('WFQ');
      expect(data[0].fairnessIndex).toBe(0.95);
    });
  });

  describe('clear', () => {
    test('모든 데이터 초기화', () => {
      store.saveRequestLog({ id: '1', createdAt: 1000, status: 'completed' }, 'FCFS');
      store.saveSchedulerStats('FCFS', { totalRequests: 10 });

      store.clear();

      expect(store.getRecentLogs().length).toBe(0);
    });
  });
});
