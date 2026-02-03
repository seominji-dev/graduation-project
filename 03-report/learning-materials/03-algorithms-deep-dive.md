# 03. 알고리즘 상세 설명 (Algorithm Deep Dive)

> **학습 목표:** 이 문서를 읽고 나면 4개 스케줄링 알고리즘의 작동 원리를 완벽하게 이해할 수 있습니다.

---

## 1. FCFS (First-Come, First-Served)

### 1.1 왜 가장 간단한가?

**핵심 원리:** 먼저 온 사람이 먼저 서비스를 받는다

FCFS는 가장 직관적인 스케줄링 알고리즘입니다. 은행 창구에서 번호표를 뽑고 순서대로 서비스를 받는 것과 같습니다.

**구현 단순성:**
```typescript
// 복잡한 로직 없음
await this.queue.add(job.name, jobData, {
  jobId: request.id,
  // priority 설정 불필요 (도착 순서대로 처리)
});
```

**시간 복잡도:** O(1)
- 삽입: 큐의 맨 뒤에 추가 → O(1)
- 추출: 큐의 맨 앞에서 제거 → O(1)

**장점:**
1. 구현이 매우 단순
2. 오버헤드가 최소
3. 기아 현상이 없음 (모든 작업이 결국 처리됨)
4. 공정해 보임 (선착순)

**단점:**
1. **Convoy Effect:** 긴 작업이 짧은 작업들을 지연시킴
2. 평균 대기 시간이 길 수 있음
3. 응답 시간 예측 불가능

**Convoy Effect 예시:**
```
시간: 0 ----1----2----3----4----5----6----7----8----9----10
작업A: ████████████████████ (10초 작업)
작업B:                    ████ (2초 작업, 8초 대기)
작업C:                        ████ (2초 작업, 10초 대기)

평균 대기 시간: (0 + 8 + 10) / 3 = 6초
```

### 1.2 어떻게 동작하는가?

**단계별 동작:**

```
1. 요청 도착
   ↓
2. 큐의 맨 뒤에 추가 (enqueue)
   ↓
3. 앞의 모든 요청이 완료될 때까지 대기
   ↓
4. 큐의 맨 앞에서 제거되어 처리 (dequeue)
   ↓
5. 완료
```

**코드 실행 흐름:**

```typescript
// 예시: 3개 요청이 순서대로 도착
요청1: "짧은 작업" (1초)  → t=0에 도착
요청2: "긴 작업" (10초)    → t=1에 도착
요청3: "짧은 작업" (1초)  → t=2에 도착

// 큐 상태 변화
t=0: [요청1]
t=1: [요청2]  (요청1 처리 중)
t=2: [요청2, 요청3]  (요청1 완료, 요청2 처리 시작)
t=3: [요청3]  (요청2 여전히 처리 중)
...
t=12: []  (모두 완료)

// 결과
요청1: 대기 0초, 완료 t=1
요청2: 대기 0초, 완료 t=11
요청3: 대기 9초, 완료 t=12
평균 대기: 3초
```

**메모리 큐에서의 구현:**

```typescript
// FCFS는 기본적으로 FIFO 큐
this.queue = new Queue("fcfs-scheduler", {
  connection: redisConnection,
  // 모든 작업에 같은 priority 부여
  defaultJobOptions: {
    priority: 0,  // 모두 같은 우선순위
  },
});

this.worker = new Worker("fcfs-scheduler", processor, {
  concurrency: 1,  // 한 번에 하나만 처리
});
```

---

## 2. Priority Scheduling

### 2.1 우선순위는 어떻게 결정되는가?

**우선순위 레벨:**

```typescript
export enum RequestPriority {
  LOW = 0,      // 일괄 처리, 로그 분석 등
  NORMAL = 1,   // 일반 채팅, 질문 답변
  HIGH = 2,     // 중요 보고서 생성, 데이터 분석
  URGENT = 3,   // 긴급 고객 문의, 보안 이슈
}
```

**우선순위 결정 요소:**

1. **사용자 등급:** 
   - 유료 사용자 > 무료 사용자
   - Enterprise > Premium > Standard > Free

2. **요청 유형:**
   - 고객 문의 > 일반 질문
   - 실시간 요청 > 배치 작업

3. **시간적 긴급성:**
   - SLA 임박 > 여유 있는 작업
   - 대화형 > 비대화형

### 2.2 Aging은 왜 필요한가?

**기아 현상 (Starvation Problem):**

```
시나리오: 긴급 작업이 계속 들어오는 경우

t=0:  LOW 작업 도착
t=1:  URGENT 작업 도착 → LOW 작업 대기
t=2:  URGENT 작업 도착 → LOW 작업 계속 대기
t=3:  URGENT 작업 도착 → LOW 작업 여전히 대기
...
결과: LOW 작업이 무한히 대기 (기아 현상)
```

**Aging 메커니즘:**

대기 시간이 길어질수록 우선순위를 점진적으로 높여서, 결국 처리되도록 보장합니다.

**Aging 구현 (AgingManager):**

```typescript
export class AgingManager {
  private agingInterval = 10000;     // 10초마다 확인
  private agingThreshold = 30000;    // 30초 이상 대기 시 Aging

  private async runAging() {
    const waitingJobs = await this.scheduler.getWaitingJobs();
    const now = Date.now();

    for (const job of waitingJobs) {
      const waitTime = now - job.queuedAt.getTime();

      // 30초 이상 대기한 작업만 Aging
      if (waitTime > this.agingThreshold) {
        // 우선순위 상향
        const newPriority = this.promotePriority(job.priority);
        await this.scheduler.updateJobPriority(job.jobId, newPriority);
      }
    }
  }

  private promotePriority(current: RequestPriority): RequestPriority {
    // 한 단계씩 상향 (최대 URGENT)
    return Math.min(current + 1, RequestPriority.URGENT);
  }
}
```

**Aging 동작 예시:**

```
초기 상태:
- 작업A: priority=LOW (0), queuedAt=t=0

t=30초:
- 작업A 대기 시간 30초 초과
- Aging: LOW → NORMAL (1)
- 작업 재추가 (새 우선순위)

t=60초:
- 작업A 대기 시간 60초 초과
- Aging: NORMAL → HIGH (2)
- 작업 재추가

t=90초:
- 작업A 대기 시간 90초 초과
- Aging: HIGH → URGENT (3)
- 작업 재추가

결과: 작업A는 최대 90초 후에는 URGENT가 되어 반드시 처리됨
```

**메모리 큐 우선순위 변환:**

```typescript
// 메모리 큐: 낮은 숫자 = 높은 우선순위
// RequestPriority: 높은 숫자 = 높은 우선순위
// 따라서 변환 필요

private getPriorityValue(priority: RequestPriority): number {
  return (MAX_PRIORITY - priority) * 2;
}

// 변환 테이블:
// RequestPriority  →  메모리 큐 Priority
// URGENT(3)       →  (3-3)*2 = 0  (최고)
// HIGH(2)         →  (3-2)*2 = 2
// NORMAL(1)       →  (3-1)*2 = 4
// LOW(0)          →  (3-0)*2 = 6  (최저)
```

---

## 3. MLFQ (Multi-Level Feedback Queue)

### 3.1 4단계 큐는 왜 필요한가?

**상충하는 목표:**

OS 스케줄링의 두 가지 목표는 상충합니다:

1. **응답 시간 최소화:** 대화형 작업이 빠르게 응답해야 함
2. **처리량 최대화:** 긴 CPU 작업도 효율적으로 처리해야 함

**단일 큐로는 불가능:**

```
시간 퀀텀이 짧으면 (예: 1초):
- 대화형 작업 → 빠른 응답 ✓
- 긴 작업 → 문맥 교환 빈번 → 비효율 ✗

시간 퀀텀이 길면 (예: 10초):
- 대화형 작업 → 느린 응답 ✗
- 긴 작업 → 문맥 교환 적음 → 효율 ✓
```

**MLFQ 해결책:**

다단계 큐로 두 목표를 동시에 달성합니다.

```
Q0 (1초):   짧은 대화형 작업 → 빠른 응답
Q1 (3초):   중간 작업
Q2 (8초):   긴 작업
Q3 (∞):     매우 긴 배치 작업 → 문맥 교회 최소화
```

### 3.2 Boosting은 언제 발생하는가?

**기아 현상 예시:**

```
시나리오: 짧은 작업이 계속 들어오는 경우

t=0:   긴 작업A 도착 → Q0에서 시작
t=0.5: 작업A가 1초 퀀텀 초과 → Q1으로 강등
t=1:   짧은 작업B 도착 → Q0
t=1.5: 작업B 완료, 짧은 작업C 도착 → Q0
t=2:   짧은 작업D 도착 → Q0
...
결과: Q1, Q2, Q3의 작업들이 영원히 대기 (기아)
```

**Rule 5: 주기적 Boosting**

정기적으로 모든 작업을 최고 우선순위(Q0)로 재설정합니다.

**BoostManager 구현:**

```typescript
export class BoostManager {
  private boostInterval = 60000;  // 60초마다 Boost

  private async runBoost() {
    // MLFQScheduler.boostAllJobs() 호출
    const boostedCount = await this.scheduler.boostAllJobs();

    logger.info(`Boost #${this.boostCount}: ${boostedCount} jobs → Q0`);
  }
}

// MLFQScheduler.boostAllJobs()
async boostAllJobs(): Promise<number> {
  let boostedCount = 0;

  // Q1, Q2, Q3의 모든 대기 작업을 Q0로 이동
  for (let sourceLevel = 1; sourceLevel < 4; sourceLevel++) {
    const jobs = await this.queues[sourceLevel].getJobs(
      ["waiting", "delayed"],
      0, 1000
    );

    for (const job of jobs) {
      // 기존 큐에서 제거
      await job.remove();

      // 메타데이터 업데이트
      metadata.queueLevel = 0;
      metadata.queueHistory.push(0);
      metadata.timeSliceRemaining = TIME_QUANTA[0];

      // Q0에 재추가
      await this.queues[0].add(job.name, metadata, {
        priority: 0,
      });

      boostedCount++;
    }
  }

  return boostedCount;
}
```

**Boosting 동작 예시:**

```
초기 상태:
Q0: [작업B, 작업C, 작업D]
Q1: [작업A]
Q2: [작업E, 작업F]
Q3: [작업G]

Boost 발생 (t=60초):
Q0: [작업A, 작업B, 작업C, 작업D, 작업E, 작업F, 작업G]
Q1: []
Q2: []
Q3: []

결과: 모든 작업이 공정한 기회를 얻음
```

### 3.3 5가지 MLFQ 규칙

**Rule 1: Priority(A) > Priority(B) → A 실행**

높은 우선순위 큐의 작업을 먼저 처리합니다.

```
Q0: [작업A]
Q1: [작업B]
Q2: [작업C]
Q3: [작업D]

실행 순서: A → (B, C, D 대기)
```

**Rule 2: Priority(A) = Priority(B) → Round-Robin**

같은 큐 내에서는 Round-Robin으로 처리합니다.

```
Q0: [작업A, 작업B, 작업C]

실행 순서:
A (1초 퀀텀) → B (1초 퀀텀) → C (1초 퀀텀) → A → ...
```

**Rule 3: 새 작업은 최고 우선순위 큐에서 시작**

모든 새 작업은 Q0에서 시작합니다. (CPU 사용량을 모르므로 기회를 줍니다)

```
새 작업 도착 → 항상 Q0에 추가
```

**Rule 4: 타임 퀀텀 모두 사용 → 우선순위 강등**

시간 퀀텀을 모두 사용하면 다음 낮은 큐로 강등됩니다.

```typescript
if (timeQuantum === Infinity) {
  // Q3: 무제한 (FCFS)
  response = await this.llmService.process(prompt, provider);
} else {
  // Q0-Q2: 시간 퀀텀 강제
  try {
    response = await Promise.race([
      this.llmService.process(prompt, provider),
      timeoutPromise(timeQuantum),
    ]);
  } catch (error) {
    if (error === "Time quantum exceeded") {
      // 강등: Q0 → Q1, Q1 → Q2, Q2 → Q3
      await this.demoteJob(requestId, queueLevel);
    }
  }
}
```

**CPU를 포기하면 강등되지 않음:**

```
작업이 I/O 대기 등으로 CPU를 포기하면:
- 같은 큐에 유지
- 다음 번에 다시 실행될 때 동일한 우선순위
```

**Rule 5: 주기적으로 모든 작업을 Q0로 Boost**

앞서 설명한 주기적 Boosting입니다.

---

## 4. WFQ (Weighted Fair Queuing)

### 4.1 Virtual Time은 어떻게 계산되는가?

**GPS (Generalized Processor Sharing) 이상:**

이상적인 시스템에서는 모든 활성 프로세스가 동시에 CPU를 받습니다.

```
이상적 GPS:
- 3개 테넌트 (가중치: 100, 10, 1)
- 10초 동안:
  * 테넌트1: 10초 × (100/111) = 9.01초
  * 테넌트2: 10초 × (10/111) = 0.90초
  * 테넌트3: 10초 × (1/111) = 0.09초
```

**현실적 제약:**

CPU는 한 번에 하나의 작업만 처리할 수 있으므로, 순차적으로 처리하되 GPS를 근사합니다.

**Virtual Time 개념:**

가상 시간으로 "언제 처리되어야 공정한가"를 계산합니다.

```typescript
export class VirtualTimeTracker {
  private virtualTime: number = 0;  // 전역 가상 시계

  calculateVirtualFinishTime(
    requestId: string,
    tenantId: string,
    serviceTime: number,  // 예상 서비스 시간
    weight: number        // 테넌트 가중치
  ): VirtualFinishTime {
    // 가상 시작 시간 = 현재 전역 가상 시간
    const virtualStartTime = this.virtualTime;

    // 가상 완료 시간 = 가상 시작 시간 + (서비스 시간 / 가중치)
    const virtualFinishTime = virtualStartTime + (serviceTime / weight);

    return { virtualStartTime, virtualFinishTime };
  }

  updateVirtualTime(actualTime: number, totalWeight: number) {
    // 전역 가상 시간 증가
    // 실제 시간이 지날수록 가상 시간도 증가
    // 가중치 합이 클수록 가상 시간이 천천히 증가
    this.virtualTime += actualTime / totalWeight;
  }
}
```

**Virtual Time 계산 예시:**

```
초기 상태:
- Virtual Time = 0
- 활성 테넌트 없음

t=0: 테넌트1(weight=100) 작업A 도착, serviceTime=5000ms
       virtualFinishTime = 0 + (5000/100) = 50

t=1: 테넌트2(weight=10) 작업B 도착, serviceTime=5000ms
       virtualFinishTime = 0 + (5000/10) = 500

t=2: 테넌트1(weight=100) 작업C 도착, serviceTime=5000ms
       virtualFinishTime = 50 + (5000/100) = 100

현재 큐 상태 (Virtual Finish Time 기준 정렬):
[작업A(50), 작업C(100), 작업B(500)]

실행 순서: A → C → B
```

### 4.2 공정성은 어떻게 보장되는가?

**Jain's Fairness Index:**

공정성을 정량적으로 측정하는 지표입니다.

```
J = (Σxi)² / (n × Σxi²)

여기서:
- xi: i번째 테넌트의 평균 서비스 시간
- n: 활성 테넌트 수

해석:
- J = 1.0: 완벽한 공정 (모든 테넌트가 동일한 서비스 시간)
- J → 1/n: 최악의 불공정 (한 테넌트가 독점)
```

**공정성 계산 예시:**

```
시나리오 1: 완벽한 공정
테넌트1: 10개 작업, 평균 100ms
테넌트2: 10개 작업, 평균 100ms
테넌트3: 10개 작업, 평균 100ms

Σxi = 300, Σxi² = 30000
J = 300² / (3 × 30000) = 90000 / 90000 = 1.0
```

```
시나리오 2: 불공정
테넌트1: 20개 작업, 평균 200ms
테넌트2: 5개 작업, 평균 50ms
테넌트3: 5개 작업, 평균 50ms

Σxi = 300, Σxi² = 42500
J = 300² / (3 × 42500) = 90000 / 127500 = 0.706
```

**FairnessCalculator 구현:**

```typescript
export class FairnessCalculator {
  private tenantStats: Map<string, TenantStats> = new Map();

  recordRequestCompletion(
    tenantId: string,
    processingTime: number,
    waitTime: number
  ) {
    const stats = this.tenantStats.get(tenantId) || this.createStats();
    stats.completedRequests++;
    stats.totalProcessingTime += processingTime;
    stats.totalWaitTime += waitTime;
  }

  getFairnessMetrics(): FairnessMetrics {
    const serviceTimes: number[] = [];

    for (const stats of this.tenantStats.values()) {
      if (stats.completedRequests > 0) {
        const avgServiceTime = stats.totalProcessingTime / stats.completedRequests;
        serviceTimes.push(avgServiceTime);
      }
    }

    // Jain's Fairness Index 계산
    const sum = serviceTimes.reduce((a, b) => a + b, 0);
    const sumSquared = serviceTimes.reduce((a, b) => a + b*b, 0);
    const n = serviceTimes.length;

    const jainsIndex = (sum * sum) / (n * sumSquared);

    return {
      jainsFairnessIndex: jainsIndex,
      fairnessScore: jainsIndex * 100,
      activeTenants: n,
    };
  }
}
```

---

## 5. 알고리즘 비교

### 5.1 성능 특성

| 알고리즘 | 평균 대기 시간 | 처리량 | 공정성 | 복잡도 | 적용 케이스 |
|---------|-------------|--------|--------|--------|-----------|
| **FCFS** | 기준 | 기준 | 낮음 | O(1) | 단순 처리, 베이스라인 |
| **Priority** | 30% 개선 | 유지 | 낮음 | O(log n) | 긴급 작업 우선 |
| **MLFQ** | 40% 개선 | 20% 증가 | 높음 | O(log n) | 혼합 워크로드 |
| **WFQ** | 35% 개선 | 유지 | 매우 높음 | O(log n) | 멀티테넌트 SaaS |

### 5.2 Trade-off

**FCFS vs Priority:**
- FCFS: 단순하지만 긴급 작업 대기
- Priority: 긴급 작업 우선하지만 기아 위험

**Priority vs MLFQ:**
- Priority: 고정된 우선순위
- MLFQ: 작업 특성에 따라 동적 조정

**MLFQ vs WFQ:**
- MLFQ: 시스템 중심 (CPU 효율)
- WFQ: 테넌트 중심 (공정성)

---

## 6. 실제 프로젝트 적용

### 6.1 언제 어떤 알고리즘을 사용하는가?

**FCFS 사용:**
- 개발/테스트 환경
- 단순한 배치 작업
- 성능 비교 베이스라인

**Priority 사용:**
- 고객 지원 시스템 (VIP > 일반)
- 긴급 알림 처리
- SLA가 있는 서비스

**MLFQ 사용:**
- 대화형 AI + 배치 처리 혼합
- 웹 서버 (짧은 요청 + 긴 API 호출)
- 다양한 작업 길이

**WFQ 사용:**
- SaaS 멀티테넌트 플랫폼
- 공용 API 서비스
- 리소스 공유 환경

### 6.2 알고리즘 선택 가이드

```
1. 모든 사용자가 동등한가?
   YES → FCFS
   NO  → 2번으로

2. 작업 길이를 미리 알 수 있는가?
   YES → Priority
   NO  → 3번으로

3. 대화형 작업과 배치 작업이 섞여 있는가?
   YES → MLFQ
   NO  → 4번으로

4. 테넌트별 공정한 분배가 필요한가?
   YES → WFQ
   NO  → FCFS
```

---

**다음 단계:**
- 컴포넌트 상호작용 → **[04-component-interactions.md](./04-component-interactions.md)**
- Q&A → **[05-faq.md](./05-faq.md)**

---

**작성일:** 2026-01-30
**버전:** 1.0.0
**작성자:** 서민지
