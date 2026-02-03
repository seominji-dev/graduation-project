/**
 * JSON 파일 기반 저장소
 * 요청 로그 및 통계를 JSON 파일로 영구 저장
 *
 * 학부생 수준 - 네이티브 모듈 없이 순수 Node.js로 구현
 */
const fs = require('fs');
const path = require('path');

class JSONStore {
  constructor(dataDir = null) {
    // 기본 경로: 프로젝트 루트의 data/
    this.dataDir = dataDir || path.join(__dirname, '../../data');
    this.logsFile = path.join(this.dataDir, 'request-logs.json');
    this.statsFile = path.join(this.dataDir, 'scheduler-stats.json');
  }

  /**
   * 저장소 초기화 - 디렉토리 및 파일 생성
   */
  initialize() {
    // 디렉토리 생성
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // 로그 파일 초기화
    if (!fs.existsSync(this.logsFile)) {
      this._writeJSON(this.logsFile, []);
    }

    // 통계 파일 초기화
    if (!fs.existsSync(this.statsFile)) {
      this._writeJSON(this.statsFile, []);
    }
  }

  /**
   * JSON 파일 읽기
   */
  _readJSON(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  /**
   * JSON 파일 쓰기
   */
  _writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 요청 로그 저장
   * @param {Object} request - 완료된 요청 객체
   * @param {string} schedulerType - 사용된 스케줄러 타입
   */
  saveRequestLog(request, schedulerType) {
    const logs = this._readJSON(this.logsFile);

    const waitTime = request.startedAt ? request.startedAt - request.createdAt : null;
    const processingTime = request.completedAt && request.startedAt
      ? request.completedAt - request.startedAt
      : null;

    logs.push({
      id: request.id,
      prompt: request.prompt,
      priority: request.priority,
      tenantId: request.tenantId,
      tier: request.tier,
      status: request.status,
      schedulerType: schedulerType,
      createdAt: request.createdAt,
      startedAt: request.startedAt,
      completedAt: request.completedAt,
      waitTime: waitTime,
      processingTime: processingTime,
      response: request.response,
      error: request.error
    });

    this._writeJSON(this.logsFile, logs);
  }

  /**
   * 스케줄러 통계 저장
   * @param {string} schedulerType
   * @param {Object} stats
   */
  saveSchedulerStats(schedulerType, stats) {
    const allStats = this._readJSON(this.statsFile);

    allStats.push({
      schedulerType: schedulerType,
      totalRequests: stats.totalRequests || 0,
      avgWaitTime: stats.avgWaitTime || 0,
      avgProcessingTime: stats.avgProcessingTime || 0,
      fairnessIndex: stats.fairnessIndex || null,
      recordedAt: Date.now()
    });

    this._writeJSON(this.statsFile, allStats);
  }

  /**
   * 최근 요청 로그 조회
   * @param {number} limit
   * @returns {Array}
   */
  getRecentLogs(limit = 100) {
    const logs = this._readJSON(this.logsFile);
    // 최신순 정렬 후 limit 적용
    return logs
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * 테넌트별 통계 조회
   * @param {string} tenantId
   * @returns {Object}
   */
  getTenantStats(tenantId) {
    const logs = this._readJSON(this.logsFile);
    const tenantLogs = logs.filter(log => log.tenantId === tenantId);

    if (tenantLogs.length === 0) {
      return { total: 0, avgWaitTime: 0, avgProcessingTime: 0, completed: 0, failed: 0 };
    }

    const completed = tenantLogs.filter(l => l.status === 'completed');
    const failed = tenantLogs.filter(l => l.status === 'failed');

    const avgWaitTime = completed.length > 0
      ? completed.reduce((sum, l) => sum + (l.waitTime || 0), 0) / completed.length
      : 0;

    const avgProcessingTime = completed.length > 0
      ? completed.reduce((sum, l) => sum + (l.processingTime || 0), 0) / completed.length
      : 0;

    return {
      total: tenantLogs.length,
      avgWaitTime: avgWaitTime,
      avgProcessingTime: avgProcessingTime,
      completed: completed.length,
      failed: failed.length
    };
  }

  /**
   * 스케줄러별 성능 비교
   * @returns {Array}
   */
  getSchedulerComparison() {
    const logs = this._readJSON(this.logsFile);
    const completedLogs = logs.filter(l => l.status === 'completed');

    // 스케줄러 타입별로 그룹화
    const grouped = {};
    for (const log of completedLogs) {
      const type = log.schedulerType || 'unknown';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(log);
    }

    // 각 스케줄러의 통계 계산
    return Object.entries(grouped).map(([type, typeLogs]) => ({
      schedulerType: type,
      total: typeLogs.length,
      avgWaitTime: typeLogs.reduce((sum, l) => sum + (l.waitTime || 0), 0) / typeLogs.length,
      avgProcessingTime: typeLogs.reduce((sum, l) => sum + (l.processingTime || 0), 0) / typeLogs.length
    }));
  }

  /**
   * 저장소 종료 (호환성용 - 실제 동작 없음)
   */
  close() {
    // JSON 파일 기반이므로 별도 종료 작업 불필요
  }

  /**
   * 모든 데이터 초기화 (테스트용)
   */
  clear() {
    this._writeJSON(this.logsFile, []);
    this._writeJSON(this.statsFile, []);
  }
}

module.exports = JSONStore;
