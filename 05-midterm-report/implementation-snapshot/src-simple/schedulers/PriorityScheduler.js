/**
 * Priority 스케줄러 (Aging 포함)
 * 우선순위 기반 처리 + 기아 방지를 위한 Aging 메커니즘
 *
 * 우선순위: URGENT(4) > HIGH(3) > NORMAL(2) > LOW(1)
 * Aging: 대기 시간이 길어지면 우선순위 증가
 */
const BaseScheduler = require('./BaseScheduler');

// 우선순위 상수
const PRIORITY = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  URGENT: 4
};

// Aging 설정
const AGING_INTERVAL_MS = 5000;  // 5초마다 aging 적용
const AGING_INCREMENT = 1;       // aging 시 증가할 우선순위

class PriorityScheduler extends BaseScheduler {
  constructor() {
    super('Priority');
    this.agingInterval = null;
  }

  /**
   * Aging 시작 - 주기적으로 대기 중인 요청의 우선순위 증가
   */
  startAging() {
    this.agingInterval = setInterval(() => {
      this.applyAging();
    }, AGING_INTERVAL_MS);
  }

  /**
   * Aging 중지
   */
  stopAging() {
    if (this.agingInterval) {
      clearInterval(this.agingInterval);
      this.agingInterval = null;
    }
  }

  /**
   * 모든 대기 요청에 Aging 적용
   * 오래 기다린 요청의 우선순위를 높여주는 메커니즘
   */
  applyAging() {
    const now = Date.now();
    for (const request of this.queue) {
      const waitTime = now - request.createdAt;
      // 5초 이상 대기한 요청의 우선순위 증가 (최대 URGENT까지)
      if (waitTime >= AGING_INTERVAL_MS && request.effectivePriority < PRIORITY.URGENT) {
        request.effectivePriority = Math.min(
          request.effectivePriority + AGING_INCREMENT,
          PRIORITY.URGENT
        );
      }
    }
  }

  /**
   * 요청 추가 (effectivePriority 초기화)
   */
  enqueue(request) {
    request.effectivePriority = request.priority || PRIORITY.NORMAL;
    request.createdAt = request.createdAt !== undefined ? request.createdAt : Date.now();
    this.queue.push(request);
  }

  /**
   * 가장 높은 우선순위의 요청을 반환
   * @returns {Object|null} 다음 처리할 요청
   */
  dequeue() {
    if (this.isEmpty()) {
      return null;
    }

    // 가장 높은 우선순위 찾기
    let highestIdx = 0;
    let highestPriority = this.queue[0].effectivePriority;

    for (let i = 1; i < this.queue.length; i++) {
      if (this.queue[i].effectivePriority > highestPriority) {
        highestPriority = this.queue[i].effectivePriority;
        highestIdx = i;
      }
    }

    // 선택된 요청 제거 및 반환
    return this.queue.splice(highestIdx, 1)[0];
  }
}

module.exports = { PriorityScheduler, PRIORITY };
