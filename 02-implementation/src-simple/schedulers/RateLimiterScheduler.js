/**
 * RateLimiterScheduler - Token Bucket Algorithm
 *
 * Token Bucket 알고리즘 기반 Rate Limiter
 * LLM API 요청 속도 제어를 위한 스케줄러
 *
 * 핵심 개념:
 * - Bucket: 토큰을 저장하는 가상의 버킷
 * - Tokens: 요청 처리 권한 (1토큰 = 1요청)
 * - Refill Rate: 초당 토큰 충전 속도
 * - Capacity: 버킷 최대 용량
 *
 * 알고리즘:
 * 1. 요청 도착 시 버킷에서 토큰 소비
 * 2. 토큰이 있으면 요청 허용 (allow)
 * 3. 토큰이 없으면 요청 거부 (deny)
 * 4. 주기적으로 토큰 충전 (refill)
 *
 * 사용 예시:
 * - refill_rate: 10 tokens/sec (초당 10요청)
 * - bucket_capacity: 50 tokens (최대 50토큰 저장)
 * - Burst: 50개 요청 즉시 처리 후 10req/s로 제한
 *
 * 기존 OS 스케줄러와 비교:
 * - FCFS/Priority/MLFQ: 큐작 및 순서 결정
 * - RateLimiter: 속도 제어 (폭탄 방지, API 과부하 방지)
 * - 함께 사용: RateLimiter -> OS Scheduler 순서로 체이닝 가능
 */
const BaseScheduler = require('./BaseScheduler');

// 기본 설정값
const DEFAULT_REFILL_RATE = 10; // tokens per second
const DEFAULT_BUCKET_CAPACITY = 50; // maximum tokens
const DEFAULT_REFILL_INTERVAL_MS = 100; // refill check interval (100ms)

class RateLimiterScheduler extends BaseScheduler {
  /**
   * RateLimiterScheduler 생성자
   * @param {Object} options - 설정 옵션
   * @param {number} options.refillRate - 초당 토큰 충전량 (default: 10)
   * @param {number} options.bucketCapacity - 버킷 최대 용량 (default: 50)
   * @param {number} options.refillInterval - 충전 체크 간격 ms (default: 100)
   */
  constructor(options = {}) {
    super('RateLimiter');

    this.refillRate = options.refillRate || DEFAULT_REFILL_RATE;
    this.bucketCapacity = options.bucketCapacity || DEFAULT_BUCKET_CAPACITY;
    this.refillInterval = options.refillInterval || DEFAULT_REFILL_INTERVAL_MS;

    // 현재 토큰 수용량 (버킷에 있는 토큰 수)
    this.currentTokens = this.bucketCapacity;

    // 마지막으로 토큰을 충전한 시간
    this.lastRefillTime = Date.now();

    // 충전 타이머
    this.refillTimer = null;

    // 통계
    this.stats = {
      allowed: 0,
      denied: 0,
      totalRequests: 0
    };

    // 자동 충전 시작
    this.startRefilling();
  }

  /**
   * 토큰 충전 시작
   */
  startRefilling() {
    if (this.refillTimer) {
      return; // 이미 실행 중
    }

    this.refillTimer = setInterval(() => {
      this.refill();
    }, this.refillInterval);
  }

  /**
   * 토큰 충전 중지
   */
  stopRefilling() {
    if (this.refillTimer) {
      clearInterval(this.refillTimer);
      this.refillTimer = null;
    }
  }

  /**
   * 토큰 충전 (Refill)
   * 경과 시간에 비례하여 토큰 추가
   */
  refill() {
    const now = Date.now();
    const elapsedMs = now - this.lastRefillTime;
    const elapsedSec = elapsedMs / 1000;

    // 경과 시간만큼 토큰 충전
    const tokensToAdd = elapsedSec * this.refillRate;

    this.currentTokens = Math.min(
      this.bucketCapacity,
      this.currentTokens + tokensToAdd
    );

    this.lastRefillTime = now;
  }

  /**
   * 수동으로 토큰 충전 실행 (테스트용)
   */
  manualRefill() {
    this.refill();
  }

  /**
   * 요청 추가 (토큰 확인 및 소비)
   * @param {Object} request - LLM 요청 객체
   * @returns {Object} { allowed: boolean, tokens: number, waitTime: number }
   */
  enqueue(request) {
    this.stats.totalRequests++;

    // 토큰 충전 확인
    this.refill();

    // 토큰이 부족하면 거부
    if (this.currentTokens < 1) {
      this.stats.denied++;

      // 대기 예상 시간 계산 (1토큰 충전所需 시간)
      const waitTime = (1 / this.refillRate) * 1000; // ms

      // 요청에 거부 정보 표시
      request.rateLimitResult = {
        allowed: false,
        tokens: 0,
        waitTime: waitTime
      };

      // 거부된 요청도 큐에 저장 (재시도를 위해)
      this.queue.push(request);

      return request.rateLimitResult;
    }

    // 토큰이 있으면 허용
    this.currentTokens -= 1;
    this.stats.allowed++;

    request.rateLimitResult = {
      allowed: true,
      tokens: 1,
      waitTime: 0,
      remainingTokens: this.currentTokens
    };

    // 허용된 요청을 큐에 추가
    this.queue.push(request);

    return request.rateLimitResult;
  }

  /**
   * 다음 요청 선택 (허용된 요청만 처리)
   * @returns {Object|null} 다음 처리할 요청
   */
  dequeue() {
    // 허용된 요청 찾기
    for (let i = 0; i < this.queue.length; i++) {
      const req = this.queue[i];
      if (req.rateLimitResult && req.rateLimitResult.allowed) {
        // 큐에서 제거하고 반환
        this.queue.splice(i, 1);
        return req;
      }
    }

    return null;
  }

  /**
   * 특정 요청을 큐에서 제거 (재시도 완료 등)
   * @param {string} requestId - 제거할 요청 ID
   * @returns {boolean} 제거 성공 여부
   */
  removeRequest(requestId) {
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].id === requestId) {
        this.queue.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * 거부된 요청을 모두 제거
   */
  clearDeniedRequests() {
    this.queue = this.queue.filter(req => {
      return req.rateLimitResult && req.rateLimitResult.allowed;
    });
  }

  /**
   * 현재 토큰 수 반환
   * @returns {number} 현재 토큰 수
   */
  getCurrentTokens() {
    this.refill(); // 최신 상태로 업데이트
    return this.currentTokens;
  }

  /**
   * 토큰 수 직접 설정 (테스트용)
   * @param {number} tokens - 설정할 토큰 수
   */
  setCurrentTokens(tokens) {
    this.currentTokens = Math.min(this.bucketCapacity, Math.max(0, tokens));
  }

  /**
   * 통계 정보 반환
   * @returns {Object} 통계 객체
   */
  getStats() {
    this.refill(); // 최신 상태로 업데이트

    return {
      refillRate: this.refillRate,
      bucketCapacity: this.bucketCapacity,
      currentTokens: this.currentTokens,
      allowed: this.stats.allowed,
      denied: this.stats.denied,
      totalRequests: this.stats.totalRequests,
      allowRate: this.stats.totalRequests > 0
        ? (this.stats.allowed / this.stats.totalRequests * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * 통계 초기화
   */
  resetStats() {
    this.stats = {
      allowed: 0,
      denied: 0,
      totalRequests: 0
    };
  }

  /**
   * 큐 크기 반환 (거부된 요청 포함)
   * @returns {number} 큐에 있는 요청 수
   */
  size() {
    return this.queue.length;
  }

  /**
   * 허용된 요청만 큐 크기 반환
   * @returns {number} 허용된 요청 수
   */
  allowedSize() {
    return this.queue.filter(req =>
      req.rateLimitResult && req.rateLimitResult.allowed
    ).length;
  }

  /**
   * 거부된 요청 수 반환
   * @returns {number} 거부된 요청 수
   */
  deniedSize() {
    return this.queue.filter(req =>
      req.rateLimitResult && !req.rateLimitResult.allowed
    ).length;
  }
}

module.exports = {
  RateLimiterScheduler,
  DEFAULT_REFILL_RATE,
  DEFAULT_BUCKET_CAPACITY,
  DEFAULT_REFILL_INTERVAL_MS
};
