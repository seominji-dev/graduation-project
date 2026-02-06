/**
 * 사전 타당성 검증 프로토타입 - 스케줄러
 * OS 수업에서 배운 FCFS와 Priority 스케줄링을 테스트해보기 위해 만든 간단한 코드
 * 작성일: 2026년 2월 초
 */

// 우선순위 값
const PRIORITY = { LOW: 0, NORMAL: 1, HIGH: 2, URGENT: 3 };

// 기본 스케줄러
class BaseScheduler {
  constructor(name) {
    this.name = name;
    this.queue = [];
  }

  enqueue(request) {
    this.queue.push(request);
  }

  dequeue() {
    throw new Error('하위 클래스에서 구현 필요');
  }

  isEmpty() {
    return this.queue.length === 0;
  }
}

// FCFS: 선착순 처리
class FCFSScheduler extends BaseScheduler {
  constructor() {
    super('FCFS');
  }

  dequeue() {
    if (this.isEmpty()) return null;
    return this.queue.shift();
  }
}

// Priority: 우선순위 높은 것 먼저 (Aging 없이 기본만)
class PriorityScheduler extends BaseScheduler {
  constructor() {
    super('Priority');
  }

  enqueue(request) {
    request.priority = request.priority !== undefined ? request.priority : PRIORITY.NORMAL;
    this.queue.push(request);
  }

  dequeue() {
    if (this.isEmpty()) return null;

    // 가장 높은 우선순위 찾기
    let bestIdx = 0;
    for (let i = 1; i < this.queue.length; i++) {
      if (this.queue[i].priority > this.queue[bestIdx].priority) {
        bestIdx = i;
      }
    }
    return this.queue.splice(bestIdx, 1)[0];
  }
}

module.exports = { BaseScheduler, FCFSScheduler, PriorityScheduler, PRIORITY };
