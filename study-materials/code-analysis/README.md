# 코드 분석 자료 (Code Analysis)

## 이 폴더의 목적

LLM 스케줄러 프로젝트의 핵심 코드를 분석하고 이해하기 위한 자료입니다.
졸업발표 및 면접에서 코드 수준의 질문에 대비할 수 있습니다.

## 핵심 코드 파일 분석

### 1. 스케줄러 인터페이스 (IScheduler)

**파일 위치**: `02-implementation/src/schedulers/IScheduler.ts`

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

**설계 의도**:
- Strategy 패턴 적용: 런타임에 스케줄링 알고리즘 교체 가능
- 모든 스케줄러가 동일한 인터페이스 구현
- 클라이언트 코드 변경 없이 알고리즘 전환

**면접 대비**: "왜 인터페이스를 사용했나요?"
- 개방-폐쇄 원칙(OCP) 준수: 새 알고리즘 추가 시 기존 코드 수정 불필요
- 의존성 역전 원칙(DIP): 고수준 모듈이 저수준 모듈에 의존하지 않음
- 테스트 용이성: Mock 스케줄러로 단위 테스트 가능

---

### 2. FCFS 스케줄러

**파일 위치**: `02-implementation/src/schedulers/FCFSScheduler.ts`

**핵심 로직**:
```typescript
async submit(request: LLMRequest): Promise<string> {
  const job = await this.queue.add('process', request, {
    jobId: requestId,
    priority: 0  // 모든 작업 동일 우선순위
  });
  return requestId;
}
```

**시간 복잡도**: O(1) - 삽입, 추출 모두 상수 시간

**특징**:
- BullMQ 큐의 기본 FIFO 동작 활용
- 모든 작업에 동일한 우선순위(0) 부여
- 비선점형(Non-preemptive) 처리

**한계점**: Convoy Effect - 긴 작업이 짧은 작업들을 지연

---

### 3. Priority 스케줄러

**파일 위치**: `02-implementation/src/schedulers/PriorityScheduler.ts`

**핵심 로직 - 우선순위 변환**:
```typescript
private getPriorityValue(priority: RequestPriority): number {
  const MAX_PRIORITY = 3;
  return (MAX_PRIORITY - priority) * 2;
}
// URGENT(3) -> 0, HIGH(2) -> 2, NORMAL(1) -> 4, LOW(0) -> 6
```

**변환 이유**: BullMQ는 숫자가 작을수록 높은 우선순위

**Aging 메커니즘**:
```typescript
// AgingManager에서 10초마다 실행
if (waitTime > 30000) {  // 30초 이상 대기
  currentPriority = Math.min(currentPriority + 1, MAX_PRIORITY);
}
```

**면접 대비**: "Aging이 왜 필요한가요?"
- Starvation 방지: 낮은 우선순위 작업도 결국 처리됨
- 공정성 향상: 장기 대기 시 우선순위 상승

---

### 4. MLFQ 스케줄러

**파일 위치**: `02-implementation/src/schedulers/MLFQScheduler.ts`

**큐 구성**:
```typescript
const queues = [
  { level: 0, quantum: 1000 },   // Q0: 짧은 대화형 요청
  { level: 1, quantum: 3000 },   // Q1: 중간 길이 요청
  { level: 2, quantum: 8000 },   // Q2: 긴 요청
  { level: 3, quantum: Infinity } // Q3: 배치 작업
];
```

**5가지 규칙 구현**:

| 규칙 | 설명 | 구현 방식 |
|------|------|----------|
| Rule 1 | Priority(A) > Priority(B)이면 A 실행 | BullMQ priority 옵션 |
| Rule 2 | 같은 우선순위는 Round-Robin | BullMQ 기본 동작 |
| Rule 3 | 새 작업 -> Q0 시작 | submit()에서 level=0 설정 |
| Rule 4 | 타임 슬라이스 초과 -> 강등 | Promise.race()로 타임아웃 |
| Rule 5 | 주기적 Boosting | BoostManager 60초 주기 |

**Rule 4 구현 (타임 슬라이스 강제)**:
```typescript
const timeoutPromise = new Promise<string>((_, reject) => {
  setTimeout(() => reject(new Error("Time quantum exceeded")), timeQuantum);
});

response = await Promise.race([
  this.llmService.process(prompt, provider),
  timeoutPromise
]);
```

**면접 대비**: "MLFQ가 Priority보다 좋은 이유는?"
- 동적 우선순위: 작업 특성을 자동으로 학습
- 응답성 + 처리량: 짧은 작업은 빠르게, 긴 작업도 결국 처리
- 기아 방지: Boosting으로 모든 작업 주기적 상승

---

### 5. WFQ 스케줄러

**파일 위치**: `02-implementation/src/schedulers/WFQScheduler.ts`

**Virtual Time 계산**:
```typescript
virtualFinishTime = virtualStartTime + (serviceTime / weight)
```

**테넌트 가중치**:
```typescript
const DEFAULT_WEIGHTS = {
  ENTERPRISE: 100,  // 가중치 100
  PREMIUM: 50,      // 가중치 50
  STANDARD: 10,     // 가중치 10
  FREE: 1           // 가중치 1
};
```

**Jain's Fairness Index 계산**:
```typescript
// FairnessCalculator에서 계산
const jainsIndex = (sum * sum) / (n * sumSquared);
// J = 1.0: 완벽한 공정성
// J -> 1/n: 최악의 불공정성
```

**면접 대비**: "Virtual Time이 왜 필요한가요?"
- 가중치 기반 공정성: 가중치에 비례하여 자원 분배
- 수학적 보장: GPS(Generalized Processor Sharing) 근사
- 실시간 조정: 작업 완료 시마다 Virtual Time 업데이트

---

### 6. 관리자 컴포넌트

#### AgingManager
**파일 위치**: `02-implementation/src/managers/AgingManager.ts`

```typescript
// 10초마다 확인
agingInterval: 10000
// 30초 이상 대기 시 Aging
agingThreshold: 30000
```

**역할**: Priority Scheduler의 기아 방지

#### BoostManager
**파일 위치**: `02-implementation/src/managers/BoostManager.ts`

```typescript
// 60초마다 Boost
boostInterval: 60000
```

**역할**: MLFQ의 Rule 5 구현 - 모든 작업을 Q0로 이동

#### FairnessCalculator
**파일 위치**: `02-implementation/src/managers/FairnessCalculator.ts`

**역할**: WFQ의 공정성 지표 계산

**계산 방식**:
```
Jain's Fairness Index = (Sum of xi)^2 / (n * Sum of xi^2)
```

---

### 7. 도메인 모델

**파일 위치**: `02-implementation/src/domain/LLMRequest.ts`

**핵심 필드**:
```typescript
interface LLMRequest {
  id: string;
  prompt: string;
  provider: LLMProvider;
  priority: RequestPriority;  // LOW(0) ~ URGENT(3)
  status: RequestStatus;      // PENDING -> QUEUED -> PROCESSING -> COMPLETED
  createdAt: Date;
  updatedAt: Date;

  // MLFQ 확장
  queueLevel?: number;
  timeSliceUsed?: number;
  totalCPUTime?: number;

  // WFQ 확장
  virtualStartTime?: number;
  virtualFinishTime?: number;
  weight?: number;
  tenantId?: string;
}
```

**OS 개념 매핑**:

| OS 개념 | LLMRequest 필드 |
|---------|----------------|
| Process ID | id |
| Process State | status |
| Priority | priority |
| CPU Burst Time | totalCPUTime |
| Queue Level | queueLevel |
| Virtual Time | virtualStartTime, virtualFinishTime |

---

## 아키텍처 다이어그램

```
+------------------+     +------------------+     +------------------+
|  API Controller  | --> | Scheduler Factory| --> |    IScheduler    |
+------------------+     +------------------+     +------------------+
                                                           |
                         +----------------+----------------+----------------+
                         |                |                |                |
                   +-----+-----+    +-----+-----+    +-----+-----+    +-----+-----+
                   |   FCFS    |    | Priority  |    |   MLFQ    |    |    WFQ    |
                   | Scheduler |    | Scheduler |    | Scheduler |    | Scheduler |
                   +-----------+    +-----------+    +-----------+    +-----------+
                         |                |                |                |
                   +-----+-----+    +-----+-----+    +-----+-----+    +-----+-----+
                   |  BullMQ   |    |  BullMQ   |    |  BullMQ   |    |  BullMQ   |
                   |   Queue   |    |   Queue   |    | Queues x4 |    |   Queue   |
                   +-----------+    +-----------+    +-----------+    +-----------+
                                          |                |                |
                                    +-----+-----+    +-----+-----+    +-----+-----+
                                    |   Aging   |    |   Boost   |    | Fairness  |
                                    |  Manager  |    |  Manager  |    | Calculator|
                                    +-----------+    +-----------+    +-----------+
```

---

## 테스트 전략

### 단위 테스트 (Unit Tests)
**파일 위치**: `02-implementation/src/**/__tests__/*.test.ts`

**테스트 예시**:
```typescript
describe('FCFSScheduler', () => {
  it('should process requests in FIFO order', async () => {
    await scheduler.submit(request1);
    await scheduler.submit(request2);
    // request1이 먼저 처리되어야 함
  });
});
```

### 통합 테스트 (Integration Tests)
**파일 위치**: `02-implementation/src/**/__tests__/*.integration.test.ts`

**테스트 예시**:
```typescript
describe('API Integration', () => {
  it('should submit request via REST API', async () => {
    const response = await request(app)
      .post('/api/requests')
      .send({ prompt: 'test', provider: { name: 'ollama' } });
    expect(response.status).toBe(202);
  });
});
```

### 커버리지 현황 (2026-02-01 기준)
| 항목 | 수치 |
|------|------|
| Statements | 98.72% (849/860) |
| Branches | 85.77% (217/253) |
| Functions | 94.77% (145/153) |
| Lines | 98.93% (834/843) |

---

## 면접 대비 코드 질문

### Q1: 동시성 처리는 어떻게 했나요?
**A:** BullMQ가 Redis 기반으로 동시성을 처리합니다. 각 작업은 원자적으로 큐에 추가되고, 워커가 순차적으로 처리합니다.

### Q2: 타임아웃 처리는 어떻게 했나요?
**A:** Promise.race()를 사용하여 LLM 응답과 타임아웃을 경쟁시킵니다. 타임아웃 발생 시 작업을 하위 큐로 강등합니다.

### Q3: 에러 처리는 어떻게 했나요?
**A:** Zod 스키마 검증으로 입력 유효성을 확인하고, try-catch로 예외를 처리합니다. 실패한 작업은 FAILED 상태로 전환됩니다.

### Q4: 확장성은 어떻게 보장하나요?
**A:** 인터페이스 기반 설계로 새 알고리즘 추가가 용이하고, BullMQ Cluster로 수평 확장이 가능합니다.

---

**최종 업데이트**: 2026-02-01
**버전**: 1.0.0
