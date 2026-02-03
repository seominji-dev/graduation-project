/**
 * WFQ (Weighted Fair Queuing) 스케줄러
 * 가중치 기반 공정 스케줄링 - 멀티테넌트 환경용
 *
 * 핵심 개념:
 * - Virtual Time: 공정성을 계산하기 위한 가상 시간
 * - GPS (Generalized Processor Sharing) 근사
 * - Jain's Fairness Index로 공정성 측정
 *
 * 테넌트 등급별 가중치 예시:
 * - Enterprise: 100
 * - Premium: 50
 * - Standard: 10
 * - Free: 1
 */
const BaseScheduler = require('./BaseScheduler');

// 기본 테넌트 가중치
const DEFAULT_WEIGHTS = {
  enterprise: 100,
  premium: 50,
  standard: 10,
  free: 1
};

class WFQScheduler extends BaseScheduler {
  constructor() {
    super('WFQ');
    // 테넌트별 가중치 및 통계
    this.tenants = new Map();  // tenantId -> { weight, virtualTime, processed }
    this.globalVirtualTime = 0;
  }

  /**
   * 테넌트 등록
   * @param {string} tenantId - 테넌트 ID
   * @param {string} tier - 테넌트 등급 (enterprise, premium, standard, free)
   */
  registerTenant(tenantId, tier = 'standard') {
    const weight = DEFAULT_WEIGHTS[tier] || DEFAULT_WEIGHTS.standard;
    this.tenants.set(tenantId, {
      weight,
      virtualTime: this.globalVirtualTime,
      processed: 0,
      tier
    });
  }

  /**
   * 요청 추가 (테넌트 자동 등록)
   */
  enqueue(request) {
    const tenantId = request.tenantId || 'default';

    // 테넌트가 등록되어 있지 않으면 자동 등록
    if (!this.tenants.has(tenantId)) {
      this.registerTenant(tenantId, request.tier || 'standard');
    }

    // Virtual finish time 계산
    const tenant = this.tenants.get(tenantId);
    const startTime = Math.max(tenant.virtualTime, this.globalVirtualTime);
    const serviceTime = request.estimatedTokens || 100;
    request.virtualFinishTime = startTime + (serviceTime / tenant.weight);
    request.tenantId = tenantId;
    request.createdAt = request.createdAt !== undefined ? request.createdAt : Date.now();

    this.queue.push(request);
  }

  /**
   * 가장 작은 Virtual Finish Time을 가진 요청 선택
   * @returns {Object|null}
   */
  dequeue() {
    if (this.isEmpty()) {
      return null;
    }

    // Virtual Finish Time이 가장 작은 요청 찾기
    let minIdx = 0;
    let minVFT = this.queue[0].virtualFinishTime;

    for (let i = 1; i < this.queue.length; i++) {
      if (this.queue[i].virtualFinishTime < minVFT) {
        minVFT = this.queue[i].virtualFinishTime;
        minIdx = i;
      }
    }

    const request = this.queue.splice(minIdx, 1)[0];

    // 테넌트 상태 업데이트
    const tenant = this.tenants.get(request.tenantId);
    if (tenant) {
      tenant.virtualTime = request.virtualFinishTime;
      tenant.processed++;
      this.globalVirtualTime = Math.max(this.globalVirtualTime, tenant.virtualTime);
    }

    return request;
  }

  /**
   * Jain's Fairness Index 계산
   * 값이 1에 가까울수록 공정함 (0.95+ 목표)
   *
   * 공식: (Σxi)² / (n × Σxi²)
   * xi = 테넌트별 처리량 / 가중치 (정규화된 처리량)
   *
   * @returns {number} 0~1 사이의 공정성 지수
   */
  calculateFairnessIndex() {
    const tenantData = Array.from(this.tenants.values());
    if (tenantData.length === 0) return 1;

    // 정규화된 처리량 계산 (처리량 / 가중치)
    const normalizedThroughputs = tenantData
      .filter(t => t.processed > 0)
      .map(t => t.processed / t.weight);

    if (normalizedThroughputs.length === 0) return 1;

    const n = normalizedThroughputs.length;
    const sum = normalizedThroughputs.reduce((a, b) => a + b, 0);
    const sumSquares = normalizedThroughputs.reduce((a, b) => a + b * b, 0);

    // Jain's Fairness Index 공식
    return (sum * sum) / (n * sumSquares);
  }

  /**
   * 테넌트별 통계 반환
   * @returns {Object} 테넌트별 처리량 및 공정성 지수
   */
  getStats() {
    const stats = {};
    for (const [tenantId, data] of this.tenants) {
      stats[tenantId] = {
        tier: data.tier,
        weight: data.weight,
        processed: data.processed,
        normalizedThroughput: data.processed / data.weight
      };
    }
    return {
      tenants: stats,
      fairnessIndex: this.calculateFairnessIndex(),
      globalVirtualTime: this.globalVirtualTime
    };
  }
}

module.exports = { WFQScheduler, DEFAULT_WEIGHTS };
