/**
 * MLFQ (Multi-Level Feedback Queue) 스케줄러
 * 다단계 피드백 큐 - 4개의 우선순위 레벨
 *
 * Q0: 1초 (최고 우선순위, 대화형)
 * Q1: 3초
 * Q2: 8초
 * Q3: 무제한 (배치 작업)
 *
 * MLFQ 5가지 규칙:
 * 1. Priority(A) > Priority(B) → A 먼저 실행
 * 2. Priority(A) = Priority(B) → FCFS
 * 3. 새 작업은 최상위 큐(Q0)에 배치
 * 4. 시간 할당량 소진 시 하위 큐로 이동
 * 5. 주기적 Boosting으로 모든 작업을 Q0로
 */
const BaseScheduler = require('./BaseScheduler');

// 큐 레벨별 시간 할당량 (밀리초)
const TIME_QUANTUM = [1000, 3000, 8000, Infinity];
const NUM_QUEUES = 4;
const BOOST_INTERVAL_MS = 5000;  // 5초마다 boosting (재실험을 위해 단축, 기존 30초)

class MLFQScheduler extends BaseScheduler {
  constructor() {
    super('MLFQ');
    // 4개의 큐 배열 (Q0이 최고 우선순위)
    this.queues = [[], [], [], []];
    this.boostInterval = null;
  }

  /**
   * Boosting 시작 - 주기적으로 모든 작업을 Q0로 이동
   */
  startBoosting() {
    this.boostInterval = setInterval(() => {
      this.boost();
    }, BOOST_INTERVAL_MS);
  }

  /**
   * Boosting 중지
   */
  stopBoosting() {
    if (this.boostInterval) {
      clearInterval(this.boostInterval);
      this.boostInterval = null;
    }
  }

  /**
   * 모든 작업을 Q0로 이동 (기아 방지)
   */
  boost() {
    const allRequests = [];
    for (let i = 0; i < NUM_QUEUES; i++) {
      allRequests.push(...this.queues[i]);
      this.queues[i] = [];
    }
    // 모든 요청을 Q0로 이동
    for (const request of allRequests) {
      request.queueLevel = 0;
      request.usedTime = 0;
    }
    this.queues[0] = allRequests;
  }

  /**
   * 요청 추가 (새 작업은 Q0에 배치)
   */
  enqueue(request) {
    request.queueLevel = 0;
    request.usedTime = 0;
    request.createdAt = request.createdAt !== undefined ? request.createdAt : Date.now();
    this.queues[0].push(request);
  }

  /**
   * 다음 요청 선택 (높은 우선순위 큐부터)
   * @returns {Object|null}
   */
  dequeue() {
    for (let i = 0; i < NUM_QUEUES; i++) {
      if (this.queues[i].length > 0) {
        return this.queues[i].shift();
      }
    }
    return null;
  }

  /**
   * 작업 완료 후 피드백 (시간 사용량에 따라 큐 레벨 조정)
   * @param {Object} request - 완료된 요청
   * @param {number} executionTime - 실행 시간 (밀리초)
   */
  feedback(request, executionTime) {
    request.usedTime += executionTime;

    // 시간 할당량 초과 시 하위 큐로 이동
    if (request.usedTime >= TIME_QUANTUM[request.queueLevel]) {
      request.queueLevel = Math.min(request.queueLevel + 1, NUM_QUEUES - 1);
      request.usedTime = 0;
    }
  }

  /**
   * 작업을 다시 큐에 넣기 (재시도 등)
   * @param {Object} request - 재큐잉할 요청
   */
  requeue(request) {
    const level = request.queueLevel || 0;
    this.queues[level].push(request);
  }

  /**
   * 전체 큐 크기 반환
   */
  size() {
    return this.queues.reduce((sum, q) => sum + q.length, 0);
  }

  /**
   * 큐가 비어있는지 확인
   */
  isEmpty() {
    return this.queues.every(q => q.length === 0);
  }
}

module.exports = { MLFQScheduler, TIME_QUANTUM, NUM_QUEUES };
