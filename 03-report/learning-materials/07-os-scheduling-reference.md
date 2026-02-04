# 07. OS 스케줄링 참고 자료 (OS Scheduling Reference)

> **학습 목표:** 이 문서를 읽고 나면 교과서 개념과 실제 구현의 연결을 완벽하게 이해할 수 있습니다.

---

## Part 1: 교과서 vs 실제 구현

### 1.1 이론적 배경

**OS 교과서 3대 저서:**

1. **Operating System Concepts (Silberschatz)**
   - "OS 바이블"로 불림
   - Part 4: Process Scheduling

2. **Modern Operating Systems (Tanenbaum)**
   - 실용적인 예제 중심
   - Chapter 2: Process and Threads

3. **Operating Systems: Three Easy Pieces (Arpaci-Dusseau)**
   - 최고의 입문서
   - Part 2: Concurrency

### 1.2 이 프로젝트와의 연결

| 교과서 개념 | 본 프로젝트 구현 | 차이점 |
|-------------|-----------------|--------|
| 프로세스 (Process) | LLM API 요청 (Request) | CPU 작업 vs API 호출 |
| CPU 스케줄러 | 요청 스케줄러 (Scheduler) | 선점/비선점 차이 |
| 문맥 교환 (Context Switch) | 요청 상태 전이 (Status) | 오버헤드 차이 |
| CPU 버스트 시간 | LLM 처리 시간 | 예측 가능성 차이 |

---

## Part 2: FCFS 이론 및 구현

### 2.1 교과서 이론

**Convoy Effect (호위 효과):**

```
CPU 버스트 시간:
- P1: 10 (매우 김)
- P2: 1  (짧음)
- P3: 1  (짧음)

FCFS 스케줄링:
P1(10) → P2(1) → P3(1)

평균 대기 시간:
P1: 0
P2: 10
P3: 11
평균: 7

비교: SJF(Shortest Job First)
P2(1) → P3(1) → P1(10)
평균: (0 + 1 + 2) / 3 = 1

결과: FCFS는 평균 대기 시간이 길어질 수 있음
```

### 2.2 본 프로젝트 구현

```typescript
// FCFS는 기본적으로 메모리 큐의 FIFO 동작
this.queue = new Queue("fcfs", {
  connection: redisConnection,
  defaultJobOptions: {
    priority: 0,  // 모든 작업 동일 우선순위
  },
});

this.worker = new Worker("fcfs", processor, {
  concurrency: 1,  // 동시에 1개만 처리
});
```

**교과서와의 차이:**
- **CPU 프로세스:** 선점형 OS에서 강제로 CPU 회수
- **LLM API 요청:** 비선점형 (중간에 중단 불가)

---

## Part 3: Priority Scheduling

### 3.1 교과서 이론

**기아 현상 (Starvation):**

```
Priority:
- P1 (LOW):     긴 작업
- P2 (URGENT):  짧은 작업
- P3 (URGENT):  짧은 작업
- ...

P1은 영원히 기다림
```

**해결책 1: Aging:**
```
대기 시간이 길어질수록 우선순위 증가

Priority = Initial_Priority + (Wait_Time / Threshold)

예시:
- 초기 Priority = 0
- 대기 30초 → Priority = 1
- 대기 60초 → Priority = 2
- 대기 90초 → Priority = 3
```

### 3.2 본 프로젝트 구현

```typescript
export class AgingManager {
  private agingThreshold = 30000;  // 30초

  private async runAging() {
    const waitingJobs = await this.scheduler.getWaitingJobs();
    const now = Date.now();

    for (const job of waitingJobs) {
      const waitTime = now - job.queuedAt.getTime();

      if (waitTime > this.agingThreshold) {
        // 우선순위 1단계 상향
        const newPriority = this.promotePriority(job.priority);
        await this.scheduler.updateJobPriority(job.jobId, newPriority);
      }
    }
  }
}
```

**교과서와의 차이:**
- **이론적 Aging:** 연속적인 우선순위 증가
- **구현:** 이산적인 단계별 상향 (LOW → NORMAL → HIGH)

---

## Part 4: MLFQ 이론 및 구현

### 4.1 교과서 이론

**5가지 MLFQ 규칙 (OSTEP):**

```
Rule 1: Priority(A) > Priority(B) → A 실행 (B는 실행 안 함)
Rule 2: Priority(A) = Priority(B) → Round-Robin
Rule 3: 작업이 시스템에 들어오면 최고 우선순 큐에 배치
Rule 4: 작업이 타임 슬라이스를 모두 사용하면 우선순위 강등
       (CPU를 포기하면 같은 우선순위 유지)
Rule 5: 일정 시간(S) 후, 시스템의 모든 작업을 최고 우선순 큐로 이동
```

**왜 이 규칙들인가?**

**Rule 3 (새 작업은 최고 우선순):**
- 시스템은 작업의 CPU 사용량을 모름
- 짧은 대화형 작업일 것이라고 가정
- 기회를 주어서 확인

**Rule 4 (타임 슬라이스 초과 시 강등):**
- 긴 CPU-bound 작업을 식별
- 점점 낮은 우선순위로 이동
- 짧은 작업들은 높은 우선순위 유지

**Rule 5 (주기적 Boosting):**
- 기아 현상 방지
- 새로운 대화형 작업을 위한 자원 확보
- 시스템의 반응성 유지

### 4.2 본 프로젝트 구현

**큐 설정:**
```typescript
const TIME_QUANTA = [1000, 3000, 8000, Infinity];

// Q0: 1초 (대화형)
// Q1: 3초 (중간)
// Q2: 8초 (긴 작업)
// Q3: 무제한 (배치)
```

**Rule 4 구현 (시간 퀀텀 강제):**
```typescript
if (timeQuantum === Infinity) {
  // Q3: 무제한
  response = await this.llmService.process(prompt, provider);
} else {
  // Q0-Q2: 타임아웃 강제
  try {
    response = await Promise.race([
      this.llmService.process(prompt, provider),
      timeoutPromise(timeQuantum),
    ]);
  } catch (error) {
    if (error === "Time quantum exceeded") {
      // 강등
      await this.demoteJob(requestId, queueLevel);
    }
  }
}
```

**Rule 5 구현 (주기적 Boosting):**
```typescript
async boostAllJobs(): Promise<number> {
  let boostedCount = 0;

  for (let sourceLevel = 1; sourceLevel < 4; sourceLevel++) {
    const jobs = await this.queues[sourceLevel].getJobs(["waiting"], 0, 1000);

    for (const job of jobs) {
      await job.remove();  // 기존 큐에서 제거
      
      metadata.queueLevel = 0;
      metadata.queueHistory.push(0);
      
      await this.queues[0].add(job.name, metadata, {priority: 0});
      boostedCount++;
    }
  }

  return boostedCount;
}
```

**교과서와의 차이:**
- **이론적 MLFQ:** CPU 시간을 정확히 측정
- **구현:** LLM API 호출은 중단 불가 → Promise.race로 타임아웃 시뮬레이션

---

## Part 5: WFQ 이론 및 구현

### 5.1 교과서 이론

**GPS (Generalized Processor Sharing):**

```
이상적인 시스템:
- 모든 활성 프로세스가 동시에 CPU를 받음
- 가중치에 비례하여 CPU 시간 분배

예시:
- 3개 프로세스 (가중치: 100, 10, 1)
- 10초 동안:
  * P1: 10 × (100/111) = 9.01초
  * P2: 10 × (10/111) = 0.90초
  * P3: 10 × (1/111) = 0.09초
```

**WFQ (GPS 근사):**

```
CPU는 한 번에 하나만 실행 가능하므로:
- Virtual Time으로 "언제 처리되어야 공정한가" 계산
- Virtual Finish Time이 가장 작은 작업 먼저 처리

Virtual Finish Time = Virtual Start Time + (Service Time / Weight)
```

**Jain's Fairness Index:**

```
공정성 지표:
J = (Σxi)² / (n × Σxi²)

여기서:
- xi: i번째 프로세스의 평균 서비스 시간
- n: 활성 프로세스 수

해석:
- J = 1.0: 완벽한 공정
- J → 1/n: 최악의 불공정
```

### 5.2 본 프로젝트 구현

**Virtual Time Tracker:**
```typescript
export class VirtualTimeTracker {
  private virtualTime: number = 0;

  calculateVirtualFinishTime(
    requestId: string,
    tenantId: string,
    serviceTime: number,
    weight: number
  ): VirtualFinishTime {
    const virtualStartTime = this.virtualTime;
    const virtualFinishTime = virtualStartTime + (serviceTime / weight);

    return { virtualStartTime, virtualFinishTime };
  }

  updateVirtualTime(actualTime: number, totalWeight: number) {
    this.virtualTime += actualTime / totalWeight;
  }
}
```

**Fairness Calculator:**
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

    // Jain's Fairness Index
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

**교과서와의 차이:**
- **이론적 WFQ:** 패킷 단위 스케줄링
- **구현:** 요청 단위 스케줄링 (더 큰 단위)

---

## Part 6: 실제 OS에서의 구현

### 6.1 Linux Completely Fair Scheduler (CFS)

**개요:**
- Linux 2.6.23 (2007) 도입
- Red-Black Tree로 실행 가능한 프로세스 관리
- Virtual Runtime (vruntime) 기반

**핵심 개념:**
```c
// Linux Kernel (단순화)
struct task_struct {
    u64 vruntime;  // 가상 실행 시간
    u64 weight;   // Nice 값에 따른 가중치
};

// 스케줄링 결정
if (p->vruntime < min_vruntime) {
    // 가장 작은 vruntime을 가진 프로세스 선택
    next = p;
}
```

### 6.2 Windows 스케줄러

**개요:**
- **Multilevel Feedback Queue** 사용
- 32개 우선순위 레벨 (0-31)
- 16-31: 실시간 (Real-time)
- 0-15: 동적 (Dynamic)

**특징:**
- 우선순위 부스트 (Foreground 창)
- CPU 시간 할당 (Quantum)
- Starvation 방지 (Priority Boost)

### 6.3 본 프로젝트와의 비교

| 특징 | Linux CFS | Windows MLFQ | 본 프로젝트 MLFQ |
|------|-----------|-------------|----------------|
| 큐 수 | 1 (Red-Black Tree) | 32 | 4 |
| 우선순위 | 0-139 (Nice) | 0-31 | 4개 큐 |
| 시간 퀀텀 | 동적 | 고정 | 고정 |
| Boosting | 주기적 (Sync) | 주기적 | 주기적 (Async) |
| 공정성 | 완전 공정 (GPS) | 우선순위 기반 | 큐 내 공정 |

---

## Part 7: 추가 학습 리소스

### 7.1 교과서

**입문:**
1. **"Operating Systems: Three Easy Pieces"** (무료!)
   - https://ostep.org/
   - Part 2: Concurrency
   - Chapter: Scheduling

**중급:**
2. **"Modern Operating Systems"** (Tanenbaum)
   - Chapter 2: Processes and Threads
   - Section 2.4: Scheduling

**고급:**
3. **"Operating System Concepts"** (Silberschatz)
   - Part 4: Process Management
   - Chapter 5: CPU Scheduling

### 7.2 논문

**WFQ 원본 논문:**
1. Demers, A., Keshav, S., & Shenker, S. (1989)
   "Analysis and simulation of a fair queueing algorithm"
   ACM SIGCOMM '89

**Jain's Fairness Index:**
2. Jain, R., Chiu, D. M., & Hawe, W. R. (1984)
   "A quantitative measure of fairness"
   DEC Research Report TR-301

### 7.3 온라인 자료

**OSTEP (Operating Systems: Three Easy Pieces):**
- 공식 사이트: https://ostep.org/
- 무료 PDF 제공
- 연습 문제 포함

**MIT 6.S081: Operating System Engineering:**
- https://pdos.csail.mit.edu/6.828/2022/schedule.html
- xv6 OS 구현 실습
- JOS (Jos's Own Operating System)

**CS 162 (UC Berkeley):**
- https://cs162.eecs.berkeley.edu/
- Operating Systems 강의
- 프로젝트: Pintos OS 구현

### 7.4 비디오 강의

**Crash Course Computer Science (#21):**
- OS 스케줄링 개요
- YouTube: https://www.youtube.com/watch?v=sJFItlBfSXk

**MIT 6.S081 Lectures:**
- xv6 OS 스케줄러 분석
- https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi

---

## Part 8: 프로젝트와 교과서의 연결

### 8.1 이해 체크리스트

**FCFS:**
- [ ] Convoy Effect를 이해하는가?
- [ ] 왜 가장 단순한 알고리즘인가?
- [ ] 장단점을 설명할 수 있는가?

**Priority:**
- [ ] 기아 현상이 무엇인가?
- [ ] Aging이 왜 필요한가?
- [ ] 어떻게 구현하는가?

**MLFQ:**
- [ ] 5가지 규칙을 모두 설명할 수 있는가?
- [ ] 왜 4단계 큐인가?
- [ ] Boosting이 왜 필요한가?

**WFQ:**
- [ ] GPS가 무엇인가?
- [ ] Virtual Time을 계산할 수 있는가?
- [ ] Jain's Fairness Index를 계산할 수 있는가?

### 8.2 실제 적용 연결

**교과서 배운 것 → 실제 프로젝트:**

```
1. OS 프로세스 스케줄링 이론
   ↓
2. LLM API 요청 관리로 매핑
   ↓
3. JavaScript로 구현
   ↓
4. 메모리 큐로 큐 시스템 구축
   ↓
5. 67개 테스트로 검증
```

**핵심 통찰:**
- OS 이론은 여전히 유효함
- 적용 분야에 따라 적응 필요
- 기본 원칙은 동일함

---

## Part 9: 요약

### 9.1 학습 경로

```
1. 이론적 배경 이해
   - OSTEP 또는 Tanenbaum 교과서
   - CS162 강의 시청

2. 알고리즘 심화
   - Silberschatz 상세
   - 논문 읽기 (WFQ)

3. 실제 구현 경험
   - xv6 OS 코드 분석
   - Linux Kernel 분석

4. 본 프로젝트 코드
   - 02-implementation/src/schedulers/
   - 02-implementation/tests/

5. 이 문서로 복습
   - 교과서 ↔ 프로젝트 연결 확인
   - 이해도 체크리스트 점검
```

### 9.2 핵심 메시지

**OS 스케줄링은:**
1. **수십 년간 검증된 이론**
2. **다양한 응용 분야에 적용 가능**
3. **본질적인 문제는 동일함** (자원 분배, 공정성)

**본 프로젝트는:**
1. OS 이론의 LLM 시스템 응용
2. 4가지 알고리즘 실제 구현
3. 정량적 비교 분석 제공

**학습의 가치:**
- OS 이론과 실제의 간극 이해
- 시스템 설계 능력 향상
- 졸업 프로젝트로서의 완성도

---

**작성일:** 2026-01-30
**버전:** 1.0.0
**작성자:** 서민지
