/**
 * LLM Scheduler - 메인 엔트리포인트
 *
 * OS 스케줄링 기법을 활용한 LLM API 요청 최적화 시스템
 *
 * 사용법:
 *   npm start                    # FCFS 스케줄러로 시작
 *   SCHEDULER_TYPE=MLFQ npm start  # MLFQ 스케줄러로 시작
 *
 * 스케줄러 타입:
 *   - FCFS: 선착순 (기본값)
 *   - Priority: 우선순위 기반 + Aging
 *   - MLFQ: 다단계 피드백 큐 + Boosting
 *   - WFQ: 가중치 공정 큐 (멀티테넌트)
 */

// 서버 모듈 임포트 및 시작
const { createServer } = require('./server');

// 스케줄러 및 유틸리티 익스포트 (라이브러리로 사용 시)
const schedulers = require('./schedulers');
const { MemoryQueue, REQUEST_STATUS } = require('./queue/MemoryQueue');
const JSONStore = require('./storage/JSONStore');
const OllamaClient = require('./llm/OllamaClient');

module.exports = {
  // 서버
  createServer,

  // 스케줄러
  ...schedulers,

  // 큐 및 저장소
  MemoryQueue,
  REQUEST_STATUS,
  JSONStore,
  OllamaClient
};

// 직접 실행 시 서버 시작
if (require.main === module) {
  createServer();
}
