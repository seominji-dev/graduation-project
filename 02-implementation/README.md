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

# 커버리지 확인
npm run test:coverage

# 실험 실행
npm run experiment
npm run experiment:full     # 종합 실험
npm run experiment:concurrent  # MLFQ 동시 요청 경쟁 실험 (NEW)
npm run experiment:all       # 모든 실험 실행
```

---

## 기술 스택

| 기술 | 버전 | 용도 | 선정 이유 |
|------|------|------|----------|
| JavaScript | ES2024 | 개발 언어 | 학습 곡선 낮음 |
| Node.js | 22+ LTS | 런타임 | 안정성 |
| Express.js | 4.18 | 웹 프레임워크 | 간결한 API |
| JSON 파일 | - | 데이터 저장 | 네이티브 모듈 불필요 |
| Jest | 29.x | 테스트 | 표준 프레임워크 |

**의존성**: express, jest (2개) ✅ 목표 달성

---

## 폴더 구조

```
02-implementation/
├── src-simple/                 # 메인 소스코드 (약 1,500줄)
│   ├── index.js               # 진입점
│   ├── server.js              # Express 서버
│   ├── api/
│   │   └── routes.js          # REST API 라우트
│   ├── schedulers/
│   │   ├── BaseScheduler.js   # 공통 인터페이스
│   │   ├── FCFSScheduler.js   # FCFS 구현
│   │   ├── PriorityScheduler.js  # Priority + Aging
│   │   ├── MLFQScheduler.js   # MLFQ + Boosting
│   │   ├── WFQScheduler.js    # WFQ + Virtual Time
│   │   └── index.js
│   ├── queue/
│   │   └── MemoryQueue.js     # 메모리 기반 큐
│   ├── storage/
│   │   └── JSONStore.js       # JSON 파일 저장소
│   └── llm/
│       └── OllamaClient.js    # Ollama 연동
├── tests-simple/              # 테스트 (307개, 99.76% 커버리지)
│   ├── schedulers.test.js
│   ├── queue.test.js
│   ├── storage.test.js
│   ├── mlfq-preemptive-behavior.test.js  # MLFQ 선점형 기능 테스트
│   ├── mlfq-preemptive-characterization.test.js  # MLFQ 비선점형 특성 테스트
│   └── mlfq-concurrent-experiment.test.js  # 동시 요청 경쟁 실험 테스트 (NEW)
├── experiments-simple/        # 실험 스크립트 및 결과
│   ├── run-experiments.js              # 기본 실험
│   ├── run-comprehensive-experiments.js # 종합 실험
│   ├── mlfq-concurrent-competition-experiment.js # 동시 요청 경쟁 실험 (NEW)
│   ├── experiment-results.json         # 기본 결과
│   ├── comprehensive-results.json    # 종합 결과
│   └── mlfq-concurrent-results.json  # 동시 요청 결과 (NEW)
├── docs/                       # 문서
│   ├── api-documentation.md    # API 문서
│   ├── architecture.md         # 아키텍처 문서
│   └── EXPERIMENTS.md          # 실험 결과 보고서
├── data/                      # 로그 데이터
├── coverage-simple/           # 커버리지 리포트
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
- 4개 큐: Q0(500ms), Q1(1500ms), Q2(4000ms), Q3(무제한)
- 선점형(Preemptive): 타임 슬라이스(500ms) 단위로 처리, 중간에 선점 가능
- Boosting: 주기적으로 모든 요청을 Q0로 이동 (기아 방지)
- 대화형/배치 작업 혼합 환경에 적합
- **동시 요청 경쟁 환경에서 짧은 요청 최대 81% 개선** (신규 실험)

### 4. WFQ (가중치 공정 큐)
- 테넌트 등급별 가중치: Enterprise(100), Premium(50), Standard(10), Free(1)
- Virtual Time으로 공정성 계산
- Jain's Fairness Index로 측정

---

## 테스트 현황

```
Test Suites: 11 passed, 11 total
Tests:       307 passed, 307 total
Coverage:     99.76% statements, 94.11% branches, 98.18% functions, 99.76% lines
```

**품질 목표 달성**: 85%+ 커버리지 ✅ (99.76%)

---

## 실험 결과 요약

### 기본 성능 비교

| 스케줄러 | 평균 대기(ms) | 처리량(req/s) |
|----------|--------------|---------------|
| FCFS | 5,760 | 8.17 |
| Priority | 5,765 | 8.16 |
| MLFQ | 5,760 | 8.17 |
| WFQ | 5,688 | 8.17 |

### 주요 발견

| 연구 질문 | 결과 |
|---------|------|
| **RQ1** Priority: URGENT 요청 우선 처리? | ✅ FCFS 대비 62% 빠름 (1,122ms vs 2,971ms) |
| **RQ2** MLFQ: 혼합 워크로드 적응성? | ✅ 동시 요청 경쟁 환경에서 Short 요청 81% 개선 |
| **RQ3** WFQ: 가중치 기반 차등화? | ✅ Enterprise가 Free 대비 5.8배 빠름 (849ms vs 4,894ms) |

### MLFQ 동시 요청 경쟁 실험 결과

동시 요청이 버스트 단위로 도착하는 경쟁 환경에서 MLFQ의 선점형 특성을 검증:

**100 요청 실험 (기본)**:

| 카테고리 | FCFS 평균 대기(ms) | MLFQ 평균 대기(ms) | 개선율 |
|---------|-------------------|-------------------|--------|
| Short | 79,627 | 15,018 | **81.14%** |
| Medium | 86,319 | 86,711 | -0.45% |
| Long | 78,327 | 156,803 | -100% |
| **전체** | **81,684** | **71,303** | **12.71%** |

- **선점 이벤트**: 294회 (큐 강급 작동)
- **부스팅 이벤트**: 34회
- **큐 분포**: 96개 요청이 Q0에서 완료 (짧은 요청 우선 처리)

**500 요청 실험 (확장)**:

| 카테고리 | FCFS 평균 대기(ms) | MLFQ 평균 대기(ms) | 개선율 |
|---------|-------------------|-------------------|--------|
| Short | 384,049 | 75,734 | **80.28%** |
| Medium | 358,823 | 425,712 | -18.64% |
| Long | 404,069 | 732,786 | -81.35% |
| **전체** | **378,046** | **331,023** | **12.44%** |

- **선점 이벤트**: 1,388회 (큐 강급 작동)
- **부스팅 이벤트**: 164회
- **큐 분포**: 499개 요청이 Q0에서 완료 (짧은 요청 우선 처리)

**확장 실험 실행**: `npm run experiment:concurrent scale`

상세 결과: `docs/EXPERIMENTS.md`, `experiments-simple/comprehensive-results.json`

---

## 재현 방법

### 전체 실험 재현

```bash
# 1. 종합 실험 실행 (모든 실험)
npm run experiment:all

# 2. 결과 확인
cat experiments-simple/comprehensive-results.json
cat experiments-simple/mlfq-concurrent-results.json
```

### 개별 실험 재현

```bash
# 기본 실험만
npm run experiment

# 종합 실험만
npm run experiment:full

# MLFQ 동시 요청 경쟁 실험만
npm run experiment:concurrent
```

---

## 라이선스

MIT License
