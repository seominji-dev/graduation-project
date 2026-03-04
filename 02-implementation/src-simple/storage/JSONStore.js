/**
 * JSON 파일 기반 저장소
 * 요청 로그 및 통계를 JSON 파일로 영구 저장
 *
 * 학부생 수준 - 네이티브 모듈 없이 순수 Node.js로 구현
 * 비동기 I/O 사용으로 Node.js 이벤트 루프 차단 방지
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
   * 서버 시작 시 1회 호출되므로 동기 I/O 사용 (mkdirSync 허용)
   */
  initialize() {
    // 디렉토리 생성 (서버 초기화 시점 — 동기 허용)
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // 로그 파일 초기화 (서버 초기화 시점 — 동기 허용)
    if (!fs.existsSync(this.logsFile)) {
      fs.writeFileSync(this.logsFile, JSON.stringify([], null, 2), 'utf-8');
    }

    // 통계 파일 초기화 (서버 초기화 시점 — 동기 허용)
    if (!fs.existsSync(this.statsFile)) {
      fs.writeFileSync(this.statsFile, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  /**
   * JSON 파일 읽기 (비동기)
   * @param {string} filePath - 읽을 파일 경로
   * @returns {Promise<Array>} 파싱된 JSON 배열
   */
  async _readJSON(filePath) {
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // JSON 파싱 실패 시 빈 배열로 복구 + 경고 로그 (FR-1.2.3)
      console.warn(`JSON 파일 읽기 실패 (${filePath}): ${error.message}, 빈 배열로 복구합니다.`);
      return [];
    }
  }

  /**
   * JSON 파일 쓰기 (비동기)
   * @param {string} filePath - 쓸 파일 경로
   * @param {*} data - 저장할 데이터
   * @returns {Promise<void>}
   */
  async _writeJSON(filePath, data) {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 요청 로그 저장
   * @param {Object} request - 완료된 요청 객체
   * @param {string} schedulerType - 사용된 스케줄러 타입
   * @returns {Promise<void>}
   */
  async saveRequestLog(request, schedulerType) {
    const logs = await this._readJSON(this.logsFile);

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

    await this._writeJSON(this.logsFile, logs);
  }

  /**
   * 스케줄러 통계 저장
   * @param {string} schedulerType
   * @param {Object} stats
   * @returns {Promise<void>}
   */
  async saveSchedulerStats(schedulerType, stats) {
    const allStats = await this._readJSON(this.statsFile);

    allStats.push({
      schedulerType: schedulerType,
      totalRequests: stats.totalRequests || 0,
      avgWaitTime: stats.avgWaitTime || 0,
      avgProcessingTime: stats.avgProcessingTime || 0,
      fairnessIndex: stats.fairnessIndex || null,
      recordedAt: Date.now()
    });

    await this._writeJSON(this.statsFile, allStats);
  }

  /**
   * 최근 요청 로그 조회
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getRecentLogs(limit = 100) {
    const logs = await this._readJSON(this.logsFile);
    // 최신순 정렬 후 limit 적용
    return logs
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * 테넌트별 통계 조회
   * @param {string} tenantId
   * @returns {Promise<Object>}
   */
  async getTenantStats(tenantId) {
    const logs = await this._readJSON(this.logsFile);
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
   * @returns {Promise<Array>}
   */
  async getSchedulerComparison() {
    const logs = await this._readJSON(this.logsFile);
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
   * @returns {Promise<void>}
   */
  async clear() {
    await this._writeJSON(this.logsFile, []);
    await this._writeJSON(this.statsFile, []);
  }
}

module.exports = JSONStore;
