# LLM Scheduler - 아키텍처 문서

## 개요

LLM Scheduler는 OS 스케줄링 알고리즘을 LLM API 요청 관리에 적용한 시스템입니다.
4가지 스케줄링 알고리즘(FCFS, Priority, MLFQ, WFQ)을 지원하며, 런타임에 알고리즘을 교체할 수 있습니다.

---

## 시스템 아키텍처

### 4계층 구조

```
+------------------------------------------------------------------+
|                        클라이언트 계층                              |
|  +-----------------+            +-----------------+               |
|  |   REST API      |            |   대시보드       |               |
|  | (요청 제출/조회) |            | (실시간 모니터링) |               |
|  +-----------------+            +-----------------+               |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                      API 계층 (Express.js)                        |
|  +-------------+  +-------------+  +-------------+  +----------+ |
|  | Request     |  | Scheduler   |  | Dashboard   |  | Health   | |
|  | Controller  |  | Controller  |  | Service     |  | Check    | |
|  +-------------+  +-------------+  +-------------+  +----------+ |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    스케줄러 엔진 (4개 알고리즘)                      |
|  +----------+  +----------+  +----------+  +----------+          |
|  |   FCFS   |  | Priority |  |   MLFQ   |  |   WFQ    |          |
|  | 선착순   |  | 우선순위 |  | 다단계    |  | 가중치   |          |
|  +----------+  +----------+  +----------+  +----------+          |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                       관리자 계층                                  |
|  +-----------+  +-----------+  +-----------+  +---------------+  |
|  |  Aging    |  |  Boost    |  |  Tenant   |  |   Fairness    |  |
|  | Manager   |  | Manager   |  | Registry  |  |  Calculator   |  |
|  | (기아방지) |  | (부스팅)  |  | (테넌트)  |  |   (공정성)    |  |
|  +-----------+  +-----------+  +-----------+  +---------------+  |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                       저장소 계층                                  |
|  +-------------+  +-------------+  +-------------+               |
|  |Memory Array |  |  JSON File  |  |     LLM     |               |
|  |  (Queue)    |  |   (Logs)    |  |   Service   |               |
|  +-------------+  +-------------+  +-------------+               |
+------------------------------------------------------------------+
```

---

## 핵심 컴포넌트

### 1. API 계층

#### RequestController
- **역할**: HTTP 요청 처리, 유효성 검증, 응답 반환
- **엔드포인트**:
  - `POST /api/requests`: 요청 제출
  - `GET /api/requests/:id`: 상태 조회
  - `DELETE /api/requests/:id`: 요청 취소

#### SchedulerController
- **역할**: 스케줄러 관리, 알고리즘 전환, 통계 조회
- **엔드포인트**:
  - `GET /api/scheduler/current`: 현재 스케줄러 정보
  - `POST /api/scheduler/switch`: 스케줄러 전환
  - `GET /api/scheduler/stats`: 통계 조회

### 2. 스케줄러 엔진

#### IScheduler 인터페이스
```typescript
interface IScheduler {
  initialize(): Promise<void>;
  submit(request: LLMRequest): Promise<string>;
  getStatus(requestId: string): Promise<string>;
  cancel(requestId: string): Promise<boolean>;
  getStats(): Promise<SchedulerStats>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  shutdown(): Promise<void>;
}
```

#### SchedulerFactory
- **역할**: Strategy 패턴으로 스케줄러 인스턴스 생성
- **지원 알고리즘**: FCFS, Priority, MLFQ, WFQ

### 3. 관리자 계층

| 컴포넌트 | 대상 스케줄러 | 역할 |
|---------|-------------|------|
| AgingManager | Priority | 기아 방지를 위한 우선순위 상향 |
| BoostManager | MLFQ | 주기적 모든 작업 Q0 이동 |
| TenantRegistry | WFQ | 테넌트별 가중치 관리 |
| FairnessCalculator | WFQ | Jain's Fairness Index 계산 |

### 4. 저장소 계층

| 저장소 | 용도 | 기술 |
|--------|------|------|
| Memory Array | 작업 큐, 상태 저장 | JavaScript Array |
| JSON File | 요청 로그, 메트릭 | Node.js fs 모듈 |
| LLM Service | LLM API 호출 | Ollama / OpenAI |

---

## 데이터 흐름

### 요청 처리 흐름

```
1. 클라이언트 요청
   POST /api/requests
   { prompt: "...", priority: "HIGH", ... }

2. RequestController
   - 조건문 입력 검증
   - LLMRequest 객체 생성

3. SchedulerFactory
   - 현재 활성 스케줄러 선택

4. Scheduler.enqueue()
   - 메모리 배열 큐에 작업 추가
   - 상태: PENDING -> QUEUED

5. Worker 처리
   - 큐에서 작업 추출 (dequeue)
   - 상태: QUEUED -> PROCESSING

6. LLMService.process()
   - LLM API 호출
   - 응답 수신

7. 완료
   - 상태: PROCESSING -> COMPLETED
   - JSON 파일에 로그 저장

8. 응답 반환
   { requestId, status: "completed", result: "..." }
```

### 스케줄러 전환 흐름

```
1. POST /api/scheduler/switch { type: "MLFQ" }

2. SchedulerController
   - 현재 스케줄러 상태 저장

3. 기존 스케줄러 shutdown()
   - 진행 중인 작업 완료 대기
   - 큐 정리

4. 새 스케줄러 initialize()
   - 큐 생성
   - 워커 시작

5. 대기 중인 작업 마이그레이션
   - 기존 큐 -> 새 큐

6. 응답
   { previousType: "FCFS", currentType: "MLFQ" }
```

---

## 설계 결정

### 1. Strategy 패턴 적용

**결정**: 모든 스케줄러가 IScheduler 인터페이스 구현

**이유**:
- 런타임 알고리즘 교체 지원
- 개방-폐쇄 원칙(OCP) 준수
- 테스트 용이성 향상

**대안**: 단일 스케줄러 클래스 + 조건문
- 문제점: 확장 시 기존 코드 수정 필요

### 2. 메모리 배열 큐 선택

**결정**: JavaScript 메모리 배열을 작업 큐로 사용

**이유**:
- 학부생 수준의 이해 용이성
- 외부 의존성 없음 (Redis 불필요)
- 스케줄링 알고리즘 직접 구현으로 학습 효과 향상

**대안**: Redis 기반 BullMQ
- 문제점: 학부생에게 복잡, 외부 서비스 의존성

### 3. 관리자 컴포넌트 분리

**결정**: AgingManager, BoostManager 등 별도 컴포넌트로 분리

**이유**:
- 단일 책임 원칙(SRP) 준수
- 재사용성 향상
- 테스트 용이성

**대안**: 스케줄러 내부 구현
- 문제점: 스케줄러 클래스 복잡도 증가

### 4. Priority Aging 비활성화 (ADR-004)

**결정**: Priority Scheduler의 Aging 메커니즘을 기본 비활성화

**코드 위치**: `PriorityScheduler.js` - `applyAging()`, `startAging()`

**이유**:
- 본 프로젝트의 연구 목표는 **정적 우선순위**에 의한 스케줄링 특성 분석
- Aging을 활성화하면 모든 요청이 URGENT로 수렴하여 우선순위 실험의 변별력이 저하됨
- MLFQ의 Boosting이 이미 기아 방지 기능을 제공하므로, Priority에서는 순수 우선순위 효과를 관찰
- 실험 결과: URGENT 요청이 FCFS 대비 62% 빠른 처리 — 정적 우선순위만으로 유의미한 차이 확인

**현재 상태**:
- `applyAging()`, `startAging()` 코드는 구현 완료 (재활용 가능)
- `server.js`의 `createScheduler('PRIORITY')`에서 `startAging()` 호출 중이나,
  외부에서 주기적으로 `applyAging()`을 호출하지 않으면 실질적 비활성 상태
- 향후 Aging 효과 분석이 필요한 경우, 외부 interval에서 `applyAging()` 호출로 활성화 가능

---

## MLFQ 선점형 스케줄링 (Preemptive Scheduling)

### 개요

MLFQ 스케줄러는 4단계 피드백 큐(Q0~Q3)와 선점형(Preemptive) 메커니즘을 결합하여,
짧은 요청의 응답 시간을 극적으로 개선합니다 (10 시드 다중 실험 평균 73.78% 향상, 95% CI: [72.36, 75.20]).

### 타임 슬라이스 및 큐 레벨

| 큐 레벨 | 시간 할당량 (Time Quantum) | 대상 요청 유형 |
|---------|--------------------------|--------------|
| Q0 | 1,000ms | 대화형 Short 요청 (신규 진입) |
| Q1 | 3,000ms | 중간 길이 요청 |
| Q2 | 8,000ms | 긴 요청 |
| Q3 | ∞ (무제한) | 배치/초장문 요청 |

- **타임 슬라이스 주기**: 500ms 간격으로 선점 여부 확인
- **부스팅 주기**: 5초마다 모든 요청을 Q0로 이동 (기아 방지)

### 선점 흐름 (Pseudocode)

```
function processNextRequest():
    request = dequeue()           // 최상위 비어있지 않은 큐에서 추출
    startProcessing(request)      // 현재 요청으로 등록, 시작 시간 기록

    every 500ms:                  // 타임 슬라이스 체크
        elapsed = now - startTime + usedTime
        quantum = TIME_QUANTUM[request.queueLevel]

        if elapsed >= quantum AND quantum != Infinity:
            // 선점 발생: 하위 큐로 강등
            request.queueLevel = min(queueLevel + 1, 3)
            request.usedTime = 0
            queues[newLevel].push(request)
            processNextRequest()  // 다음 요청 처리
        else:
            continue processing   // 계속 처리
```

### 선점 트리거 조건

선점이 발생하는 조건:

1. 현재 요청의 **누적 사용 시간**이 해당 큐의 **시간 할당량**을 초과
2. 해당 큐가 **Q3(무제한 큐)가 아닌** 경우
3. `checkPreemption(elapsedMs)`가 `{ shouldPreempt: true }` 반환

### MLFQ 5가지 규칙

| 규칙 | 설명 |
|------|------|
| Rule 1 | Priority(A) > Priority(B) → A 먼저 실행 |
| Rule 2 | Priority(A) = Priority(B) → FCFS 순서 |
| Rule 3 | 새 작업은 항상 최상위 큐(Q0)에 배치 |
| Rule 4 | 시간 할당량 소진 시 하위 큐로 강등 |
| Rule 5 | 주기적 Boosting으로 모든 작업을 Q0로 이동 (기아 방지) |

### 실험 결과

동시 경쟁(Concurrent Competition) 환경에서의 측정 결과:

- **Short 요청 대기시간**: FCFS 대비 **73.78% 감소** (10 시드 다중 실험 평균, p < 0.001)
- **원인**: Short 요청이 Q0에서 빠르게 처리되고, Long 요청은 하위 큐로 강등
- **공정성**: Boosting이 Long 요청의 기아(Starvation)를 방지

---

## 확장성 분석 (Theoretical Scalability)

### 이론적 수평 확장 가능성

본 설계는 다음과 같은 이론적 확장이 가능하도록 구성됨 (향후 연구 주제):

```
연구 주제 1: 분산 큐 환경
- Redis Cluster 환경에서의 스케줄링 알고리즘 특성 변화 분석
- 분산 큐 시스템과의 통합 연구

연구 주제 2: 분산 스케줄링
- Consistent Hashing 기반 분산 전략 비교
- 분산 환경에서의 공정성 보장 연구

연구 주제 3: 합의 알고리즘 연계
- Raft/Paxos와 스케줄러 상태 동기화
- CAP 정리와의 관계 분석
```

### 알고리즘 확장성

인터페이스 기반 설계로 새 알고리즘 추가 용이:

1. `IScheduler` 인터페이스 구현
2. `SchedulerFactory`에 등록
3. 필요시 관리자 컴포넌트 추가

이는 후속 연구에서 새로운 스케줄링 알고리즘을 쉽게 추가하여 비교 분석할 수 있게 함.

---

## 보안 고려사항

### 구현된 보안 기능

| 기능 | 구현 방식 |
|------|----------|
| 입력 검증 | 조건문 기반 검증 |
| 헤더 보안 | Helmet.js |
| CORS | 허용 Origin 제한 |
| Rate Limiting | (향후 구현 예정) |
| API 인증 | X-API-Key 헤더 |

### 참고 사항 (보안 모범 사례)

본 연구는 학술 목적이며, 실제 서비스 환경에서는 다음 사항 고려 필요:
- HTTPS 사용
- API 키 환경 변수 관리
- 데이터 암호화

---

## 모니터링

### 지원 메트릭

- **처리량**: 초당 처리 요청 수 (RPS)
- **대기 시간**: 평균 대기 시간 (ms)
- **큐 상태**: 큐별 대기 작업 수
- **공정성**: Jain's Fairness Index (WFQ)

### Prometheus 엔드포인트

```
GET /metrics

# 예시 메트릭
llm_scheduler_requests_total{status="completed"} 150
llm_scheduler_requests_total{status="failed"} 5
llm_scheduler_wait_time_seconds{quantile="0.95"} 0.168
llm_scheduler_queue_size{queue="mlfq-q0"} 3
```

---

## 디렉토리 구조

```
02-implementation/
├── src-simple/                 # JavaScript 소스 코드
│   ├── queue/                  # 큐 시스템
│   │   └── MemoryQueue.js      # 메모리 기반 큐
│   ├── schedulers/             # 스케줄러 엔진
│   │   ├── BaseScheduler.js    # 기본 스케줄러
│   │   ├── FCFSScheduler.js    # FCFS 구현
│   │   ├── PriorityScheduler.js # Priority 구현
│   │   ├── MLFQScheduler.js    # MLFQ 구현
│   │   ├── WFQScheduler.js     # WFQ 구현
│   │   └── index.js            # 내보내기
│   └── storage/                # 저장소
│       └── JSONStore.js        # JSON 파일 저장소
├── tests-simple/               # Jest 테스트 (69개)
│   ├── schedulers.test.js      # 스케줄러 테스트
│   ├── queue.test.js           # 큐 테스트
│   └── storage.test.js         # 저장소 테스트
├── docs/                       # 문서
│   ├── api-documentation.md    # API 문서
│   └── architecture.md         # 아키텍처 문서 (이 파일)
└── package.json                # 의존성
```

---

**최종 업데이트**: 2026-02-04
**버전**: 2.0.0 (JavaScript 단순 구현)
