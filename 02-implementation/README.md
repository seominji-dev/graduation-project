# Phase 2: 구현 (Implementation)

## 프로젝트명
**LLM 스케줄러: OS 스케줄링 기법을 활용한 LLM API 요청 최적화**

## 이 폴더의 목적
LLM 스케줄러 소스코드, 테스트, 실험 데이터를 관리합니다.

---

## 빠른 시작

```bash
# 의존성 설치
npm install

# 서버 실행 (기본: FCFS 스케줄러)
npm start

# 특정 스케줄러로 실행
SCHEDULER_TYPE=Priority npm start
SCHEDULER_TYPE=MLFQ npm start
SCHEDULER_TYPE=WFQ npm start

# 테스트 실행
npm test

# 실험 실행
npm run experiment
```

---

## 기술 스택

| 기술 | 버전 | 용도 | 선정 이유 |
|------|------|------|----------|
| JavaScript | ES2024 | 개발 언어 | 학습 곡선 낮음 |
| Node.js | 20 LTS | 런타임 | 안정성 |
| Express.js | 4.18 | 웹 프레임워크 | 간결한 API |
| JSON 파일 | - | 데이터 저장 | 네이티브 모듈 불필요 |
| Jest | 29.x | 테스트 | 표준 프레임워크 |

**의존성**: express, uuid, jest (3개만 사용)

**제거된 기술**: TypeScript, Redis, MongoDB, BullMQ, Socket.io, Docker, better-sqlite3

---

## 폴더 구조

```
02-implementation/
├── src-simple/                 # 메인 소스코드
│   ├── index.js               # 진입점
│   ├── server.js              # Express 서버
│   ├── api/
│   │   └── routes.js          # REST API 라우트
│   ├── schedulers/
│   │   ├── BaseScheduler.js   # 공통 인터페이스
│   │   ├── FCFSScheduler.js   # FCFS 구현
│   │   ├── PriorityScheduler.js  # Priority + Aging
│   │   ├── MLFQScheduler.js   # MLFQ + Boosting
│   │   └── WFQScheduler.js    # WFQ + Virtual Time
│   ├── queue/
│   │   └── MemoryQueue.js     # 메모리 기반 큐
│   ├── storage/
│   │   └── JSONStore.js       # JSON 파일 저장소
│   └── llm/
│       └── OllamaClient.js    # Ollama 연동
├── tests-simple/              # 테스트 (67개)
│   ├── schedulers.test.js
│   ├── queue.test.js
│   └── storage.test.js
├── experiments-simple/        # 실험 스크립트
│   ├── run-experiments.js
│   └── experiment-results.json
├── data/                      # 로그 데이터
├── package.json
└── jest-simple.config.js
```

---

## API 엔드포인트

### 요청 관리

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/requests` | 새 요청 제출 |
| GET | `/api/requests/:id` | 요청 상태 조회 |
| GET | `/api/requests` | 전체 요청 목록 |

### 스케줄러

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/scheduler/status` | 스케줄러 상태 |
| POST | `/api/scheduler/process` | 다음 요청 처리 |

### 통계

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/stats` | 전체 통계 |
| GET | `/api/stats/tenant/:id` | 테넌트별 통계 |
| GET | `/api/logs` | 요청 로그 |
| GET | `/api/health` | 헬스 체크 |

---

## 스케줄러 알고리즘

### 1. FCFS (선착순)
- 가장 단순한 알고리즘
- 도착 순서대로 처리
- 시간 복잡도: O(1)

### 2. Priority (우선순위)
- URGENT(4) > HIGH(3) > NORMAL(2) > LOW(1)
- Aging: 대기 시간이 길면 우선순위 증가
- 기아(Starvation) 방지

### 3. MLFQ (다단계 피드백 큐)
- 4개 큐: Q0(1초), Q1(3초), Q2(8초), Q3(무제한)
- Boosting: 주기적으로 모든 요청을 Q0로 이동
- 대화형/배치 작업 혼합 환경에 적합

### 4. WFQ (가중치 공정 큐)
- 테넌트 등급별 가중치: Enterprise(100), Premium(50), Standard(10), Free(1)
- Virtual Time으로 공정성 계산
- Jain's Fairness Index로 측정

---

## 테스트 현황

```
Test Suites: 3 passed, 3 total
Tests:       67 passed, 67 total
```

---

## 실험 결과 요약

| 스케줄러 | 평균 대기(ms) | 특징 |
|----------|--------------|------|
| FCFS | 2,571 | 베이스라인 |
| Priority | 2,826 | URGENT 요청 62% 개선 |
| MLFQ | 2,571 | FCFS와 동일 |
| WFQ | 2,819 | Enterprise 67% 개선 |

상세 결과: `experiments-simple/experiment-results.json`

---

## 라이선스

MIT License
