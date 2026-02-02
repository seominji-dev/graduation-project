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
|  |    Redis    |  |   MongoDB   |  |     LLM     |               |
|  |  (BullMQ)   |  |   (Logs)    |  |   Service   |               |
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
| Redis | 작업 큐, 상태 저장 | BullMQ 5.1 |
| MongoDB | 요청 로그, 메트릭 | MongoDB 8.0 |
| LLM Service | LLM API 호출 | Ollama / OpenAI |

---

## 데이터 흐름

### 요청 처리 흐름

```
1. 클라이언트 요청
   POST /api/requests
   { prompt: "...", priority: "HIGH", ... }

2. RequestController
   - Zod 스키마 검증
   - LLMRequest 객체 생성

3. SchedulerFactory
   - 현재 활성 스케줄러 선택

4. Scheduler.submit()
   - BullMQ 큐에 작업 추가
   - 상태: PENDING -> QUEUED

5. Worker 처리
   - 큐에서 작업 추출
   - 상태: QUEUED -> PROCESSING

6. LLMService.process()
   - LLM API 호출
   - 응답 수신

7. 완료
   - 상태: PROCESSING -> COMPLETED
   - MongoDB에 로그 저장

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

### 2. BullMQ 선택

**결정**: Redis 기반 BullMQ를 작업 큐로 사용

**이유**:
- 우선순위 큐 네이티브 지원
- 분산 환경 확장 용이
- 작업 재시도, 지연 실행 지원

**대안**: 인메모리 큐 (Array)
- 문제점: 서버 재시작 시 데이터 손실

### 3. 관리자 컴포넌트 분리

**결정**: AgingManager, BoostManager 등 별도 컴포넌트로 분리

**이유**:
- 단일 책임 원칙(SRP) 준수
- 재사용성 향상
- 테스트 용이성

**대안**: 스케줄러 내부 구현
- 문제점: 스케줄러 클래스 복잡도 증가

---

## 확장성 분석 (Theoretical Scalability)

### 이론적 수평 확장 가능성

본 설계는 다음과 같은 이론적 확장이 가능하도록 구성됨 (향후 연구 주제):

```
연구 주제 1: 분산 큐 환경
- Redis Cluster 환경에서의 스케줄링 알고리즘 특성 변화 분석
- BullMQ 분산 기능과의 통합 연구

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
| 입력 검증 | Zod 스키마 |
| 헤더 보안 | Helmet.js |
| CORS | 허용 Origin 제한 |
| Rate Limiting | (향후 구현 예정) |
| API 인증 | X-API-Key 헤더 |

### 참고 사항 (보안 모범 사례)

본 연구는 학술 목적이며, 실제 서비스 환경에서는 다음 사항 고려 필요:
- HTTPS 사용
- API 키 환경 변수 관리
- Redis/MongoDB 인증 활성화

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
├── src/
│   ├── api/                    # API 계층
│   │   ├── controllers/        # HTTP 컨트롤러
│   │   ├── middlewares/        # 미들웨어
│   │   └── routes/             # 라우트 정의
│   ├── config/                 # 설정
│   │   ├── environment.ts      # 환경 변수
│   │   └── scheduler.ts        # 스케줄러 설정
│   ├── domain/                 # 도메인 모델
│   │   ├── LLMRequest.ts       # 요청 엔티티
│   │   └── types.ts            # 타입 정의
│   ├── managers/               # 관리자 컴포넌트
│   │   ├── AgingManager.ts     # Aging 관리
│   │   ├── BoostManager.ts     # Boost 관리
│   │   ├── FairnessCalculator.ts # 공정성 계산
│   │   └── TenantRegistry.ts   # 테넌트 관리
│   ├── schedulers/             # 스케줄러 엔진
│   │   ├── IScheduler.ts       # 인터페이스
│   │   ├── FCFSScheduler.ts    # FCFS 구현
│   │   ├── PriorityScheduler.ts # Priority 구현
│   │   ├── MLFQScheduler.ts    # MLFQ 구현
│   │   ├── WFQScheduler.ts     # WFQ 구현
│   │   └── SchedulerFactory.ts # 팩토리
│   ├── services/               # 서비스
│   │   └── LLMService.ts       # LLM API 연동
│   └── utils/                  # 유틸리티
├── docs/                       # 문서
│   ├── api-documentation.md    # API 문서
│   └── architecture.md         # 아키텍처 문서 (이 파일)
├── docker-compose.yml          # Docker 구성
├── package.json                # 의존성
└── tsconfig.json               # TypeScript 설정
```

---

**최종 업데이트**: 2026-02-01
**버전**: 1.0.0
