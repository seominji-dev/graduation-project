# 스케줄링 알고리즘을 활용한 다중 사용자 LLM API 요청 관리 시스템

홍익대학교 컴퓨터공학과 서민지 (C235180)

## 프로젝트 소개

OS 스케줄링 알고리즘(FCFS, Priority, MLFQ, WFQ)을 LLM API 요청 관리에 적용하고, 알고리즘별 성능과 공정성을 비교하는 시스템입니다.

## 실행 환경

- Node.js 20 이상 (22 LTS 권장)
- npm (Node.js 설치 시 포함)

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 서버 실행 (기본: FCFS 스케줄러)
npm start

# 특정 스케줄러로 실행
SCHEDULER_TYPE=FCFS npm start
SCHEDULER_TYPE=Priority npm start
SCHEDULER_TYPE=MLFQ npm start
SCHEDULER_TYPE=WFQ npm start
```

서버가 실행되면 `http://localhost:3000`에서 대시보드를 확인할 수 있습니다.

## 폴더 구조

```
src-simple/                    서버 소스 코드
  api/routes.js                REST API 엔드포인트
  schedulers/
    BaseScheduler.js           공통 인터페이스
    FCFSScheduler.js           선착순 스케줄러
    PriorityScheduler.js       우선순위 스케줄러 (에이징 포함)
    MLFQScheduler.js           다단계 피드백 큐 스케줄러
    WFQScheduler.js            가중치 공정 큐잉 스케줄러
  queue/MemoryQueue.js         메모리 기반 요청 큐
  storage/JSONStore.js         JSON 파일 저장소
  llm/OllamaClient.js         Ollama LLM 연결
  server.js                    Express 서버 진입점

tests-simple/                  단위 테스트
  schedulers.test.js           4개 스케줄러 기본 테스트
  mlfq-preemptive-behavior.test.js  MLFQ 선점형 기능 테스트
  queue.test.js                큐 테스트
  storage.test.js              저장소 테스트
  api-integration.test.js      API 통합 테스트

experiments-simple/            실험 코드 및 결과
  run-experiments.js           기본 실험 (4개 알고리즘 비교, 100건)
  run-multi-seed.js            다중 시드 실험 (MLFQ 선점형, 500건 x 5회)
  stats-utils.js               통계 유틸리티 (평균, 최소, 최대)
  experiment-results.json      기본 실험 결과
  multi-seed-results/          다중 시드 실험 결과
```

## 테스트 실행

```bash
# 전체 테스트
npm test

# 테스트 커버리지
npm run test:coverage
```

## 실험 재현

```bash
# 기본 실험 (4개 알고리즘 비교)
npm run experiment

# 다중 시드 실험 (MLFQ 선점형 효과 검증)
node experiments-simple/run-multi-seed.js
```

실험은 시드(seed) 기반 난수를 사용하므로 동일한 결과가 재현됩니다.

## 기술 스택

| 항목 | 기술 |
|------|------|
| 런타임 | Node.js 22 LTS |
| 프레임워크 | Express.js 4.18 |
| 언어 | JavaScript (ES2024) |
| LLM 연결 | Ollama (로컬) |
| 저장소 | 메모리 배열 + JSON 파일 |
| 테스트 | Jest |
| 외부 의존성 | express (1개) |

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/requests | LLM 요청 제출 |
| GET | /api/requests/:id | 요청 상태 조회 |
| GET | /api/stats | 스케줄러 통계 조회 |
| GET | / | 대시보드 페이지 |
