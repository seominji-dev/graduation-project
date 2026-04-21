/**
 * 메모리 기반 요청 큐
 * 간단한 배열 기반 큐 - 학부생 수준의 구현
 *
 * 특징:
 * - 인메모리 저장 (서버 재시작 시 초기화)
 * - UUID 기반 요청 ID 생성
 * - 상태별 요청 조회 지원
 */
const { randomUUID } = require('crypto');

// 요청 상태 상수
const REQUEST_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

class MemoryQueue {
  constructor() {
    this.requests = new Map();  // requestId -> request
  }

  /**
   * 새 요청 생성
   * @param {Object} data - 요청 데이터
   * @returns {Object} 생성된 요청 객체
   */
  createRequest(data) {
    const request = {
      id: randomUUID(),
      prompt: data.prompt,
      priority: data.priority || 2,  // NORMAL
      tenantId: data.tenantId || 'default',
      tier: data.tier || 'standard',
      estimatedTokens: data.estimatedTokens || 100,
      status: REQUEST_STATUS.PENDING,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      response: null,
      error: null
    };

    this.requests.set(request.id, request);
    return request;
  }

  /**
   * 요청 조회
   * @param {string} requestId
   * @returns {Object|null}
   */
  getRequest(requestId) {
    return this.requests.get(requestId) || null;
  }

  /**
   * 요청 상태 업데이트
   * @param {string} requestId
   * @param {Object} updates
   */
  updateRequest(requestId, updates) {
    const request = this.requests.get(requestId);
    if (request) {
      Object.assign(request, updates);
    }
  }

  /**
   * 요청 처리 시작
   * @param {string} requestId
   */
  startProcessing(requestId) {
    this.updateRequest(requestId, {
      status: REQUEST_STATUS.PROCESSING,
      startedAt: Date.now()
    });
  }

  /**
   * 요청 완료 처리
   * @param {string} requestId
   * @param {string} response - LLM 응답
   */
  completeRequest(requestId, response) {
    this.updateRequest(requestId, {
      status: REQUEST_STATUS.COMPLETED,
      completedAt: Date.now(),
      response
    });
  }

  /**
   * 요청 실패 처리
   * @param {string} requestId
   * @param {string} error - 에러 메시지
   */
  failRequest(requestId, error) {
    this.updateRequest(requestId, {
      status: REQUEST_STATUS.FAILED,
      completedAt: Date.now(),
      error
    });
  }

  /**
   * 상태별 요청 목록 조회
   * @param {string} status
   * @returns {Array}
   */
  getRequestsByStatus(status) {
    return Array.from(this.requests.values())
      .filter(r => r.status === status);
  }

  /**
   * 모든 요청 조회
   * @returns {Array}
   */
  getAllRequests() {
    return Array.from(this.requests.values());
  }

  /**
   * 통계 조회
   * @returns {Object}
   */
  getStats() {
    const all = this.getAllRequests();
    return {
      total: all.length,
      pending: all.filter(r => r.status === REQUEST_STATUS.PENDING).length,
      processing: all.filter(r => r.status === REQUEST_STATUS.PROCESSING).length,
      completed: all.filter(r => r.status === REQUEST_STATUS.COMPLETED).length,
      failed: all.filter(r => r.status === REQUEST_STATUS.FAILED).length
    };
  }

  /**
   * 큐 초기화 (테스트용)
   */
  clear() {
    this.requests.clear();
  }

  /**
   * 완료/실패된 오래된 요청 정리 (메모리 누수 방지)
   * @param {number} maxAgeMs - 정리 기준 시간 (기본 5분)
   * @returns {number} 정리된 요청 수
   */
  cleanup(maxAgeMs = 5 * 60 * 1000) {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, request] of this.requests) {
      const isFinished = request.status === REQUEST_STATUS.COMPLETED
        || request.status === REQUEST_STATUS.FAILED;
      const age = now - (request.completedAt || request.createdAt);

      if (isFinished && age > maxAgeMs) {
        this.requests.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}
module.exports = { MemoryQueue, REQUEST_STATUS };
