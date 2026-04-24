/**
 * 기본 스케줄러 클래스
 * 모든 스케줄러가 상속받는 베이스 클래스
 *
 * @class BaseScheduler
 */
class BaseScheduler {
  constructor(name) {
    this.name = name;
    this.queue = [];
  }

  /**
   * 요청을 큐에 추가
   * @param {Object} request - LLM 요청 객체
   */
  enqueue(request) {
    this.queue.push(request);
  }

  /**
   * 다음 요청을 선택 (하위 클래스에서 구현)
   * @returns {Object|null} 다음 처리할 요청
   */
  dequeue() {
    throw new Error('dequeue()는 하위 클래스에서 구현해야 합니다');
  }

  /**
   * 큐 크기 반환
   * @returns {number} 큐에 있는 요청 수
   */
  size() {
    return this.queue.length;
  }

  /**
   * 큐가 비어있는지 확인
   * @returns {boolean}
   */
  isEmpty() {
    return this.queue.length === 0;
  }
}

module.exports = BaseScheduler;
