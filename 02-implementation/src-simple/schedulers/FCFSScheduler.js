/**
 * FCFS (First-Come, First-Served) 스케줄러
 * 선착순 처리 - 가장 단순한 스케줄링 알고리즘
 *
 * 시간 복잡도: O(1)
 */
const BaseScheduler = require('./BaseScheduler');

// Classification: None (pure FIFO - arrival order)
class FCFSScheduler extends BaseScheduler {
  constructor() {
    super('FCFS');
  }

  /**
   * 가장 먼저 도착한 요청을 반환 (선착순)
   * @returns {Object|null} 다음 처리할 요청
   */
  dequeue() {
    if (this.isEmpty()) {
      return null;
    }
    return this.queue.shift();
  }
}

module.exports = FCFSScheduler;
