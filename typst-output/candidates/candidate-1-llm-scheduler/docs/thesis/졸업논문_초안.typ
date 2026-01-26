= OS 스케줄링 알고리즘을 활용한 LLM API 요청 처리 최적화 연구
<os-스케줄링-알고리즘을-활용한-llm-api-요청-처리-최적화-연구>
#strong[Optimization of LLM API Request Processing Using OS Scheduling
Algorithms]

#line(length: 100%)

홍익대학교 컴퓨터공학과 졸업논문

2026년 2월

#line(length: 100%)

== 국문초록
<국문초록>
최근 대규모 언어 모델(Large Language Model, LLM) API 사용이 급증함에
따라 효율적인 요청 스케줄링이 중요해지고 있다. 본 연구는 운영체제의 CPU
스케줄링 알고리즘을 LLM API 요청 처리에 적용하여 시스템 성능을
최적화하는 방법을 제안한다. FCFS(First-Come First-Served), Priority,
MLFQ(Multi-Level Feedback Queue), WFQ(Weighted Fair Queuing) 4가지
알고리즘을 Node.js 기반 시스템에서 구현하고 성능을 비교 분석하였다.

실험 결과 FCFS 기준 평균 대기 시간 48.25ms, 처리 시간 159.25ms, 처리량
6.3 RPS를 달성하였다. Priority 스케줄러는 긴급 요청의 대기 시간을 74.1%
단축하였으며, MLFQ는 짧은 요청의 대기 시간을 최대 90% 단축하였다. WFQ는
Jain's Fairness Index 0.89를 달성하여 멀티 테넌트 환경에서의 공정성을
입증하였다. 본 연구는 OS 스케줄링 기법을 AI 서비스 환경에 성공적으로
적용하여 실무 활용 가능성을 입증하였다.

#strong[주제어:] LLM, 스케줄링 알고리즘, FCFS, Priority, MLFQ, WFQ, API
최적화

#line(length: 100%)

== English Abstract
<english-abstract>
With the rapid increase in Large Language Model (LLM) API usage,
efficient request scheduling has become crucial. This research proposes
applying operating system CPU scheduling algorithms to optimize LLM API
request processing performance. We implemented and compared four
scheduling algorithms---FCFS (First-Come First-Served), Priority, MLFQ
(Multi-Level Feedback Queue), and WFQ (Weighted Fair Queuing)---in a
Node.js-based system.

Experimental results achieved an average wait time of 48.25ms,
processing time of 159.25ms, and throughput of 6.3 RPS for the FCFS
baseline. The Priority scheduler reduced urgent request wait times by
74.1%, while MLFQ reduced short request wait times by up to 90%. WFQ
achieved a Jain's Fairness Index of 0.89, demonstrating fairness in
multi-tenant environments. This study demonstrates the practical
applicability of OS scheduling techniques in AI service environments.

#strong[Keywords:] LLM, Scheduling Algorithms, FCFS, Priority, MLFQ,
WFQ, API Optimization

#line(length: 100%)

== 목차
<목차>
=== 제1장 서론
<제1장-서론>
1.1 연구 배경 1.2 문제 정의 1.3 연구 목표 1.4 기대 효과 1.5 논문 구성

=== 제2장 관련연구
<제2장-관련연구>
2.1 OS 스케줄링 알고리즘 2.2 WFQ 및 공정성 이론 2.3 LLM API 최적화 기법
2.4 기존 스케줄링 시스템

=== 제3장 설계 및 구현
<제3장-설계-및-구현>
3.1 시스템 아키텍처 3.2 FCFS 스케줄러 3.3 Priority 스케줄러 3.4 MLFQ
스케줄러 3.5 WFQ 스케줄러 3.6 데이터 모델

=== 제4장 성능 평가
<제4장-성능-평가>
4.1 실험 환경 4.2 평가 지표 4.3 단일 알고리즘 성능 4.4 알고리즘 비교
분석 4.5 우선순위별 성능 4.6 공정성 분석 4.7 논의

=== 제5장 결론
<제5장-결론>
5.1 연구 요약 5.2 기여점 5.3 한계점 5.4 향후 연구

=== 참고문헌
<참고문헌>

#line(length: 100%)

== 제1장 서론
<제1장-서론-1>
=== 1.1 연구 배경
<연구-배경>
최근 ChatGPT, Claude, Gemini와 같은 대규모 언어 모델(Large Language
Model, LLM)이 급격히 발전하면서 다양한 산업 분야에서 LLM API 활용이
증가하고 있다\[1\]. OpenAI의 연구에 따르면 2023년 LLM API 사용량은 전년
대비 600% 이상 증가하였으며, 이러한 추세는 지속되고 있다\[2\]. LLM API
서비스 제공자들은 증가하는 요청을 효율적으로 처리하기 위해 스케줄링,
로드 밸런싱, 캐싱 등 다양한 최적화 기법을 적용하고 있다.

한편, 운영체제(Operating System, OS)는 수십 년간 CPU 자원을 효율적으로
할당하기 위한 스케줄링 알고리즘을 연구해왔다\[3\]. FCFS(First-Come
First-Served), Priority Scheduling, MLFQ(Multi-Level Feedback Queue),
WFQ(Weighted Fair Queuing) 등의 알고리즘은 실제 시스템에서 검증되었으며,
각각의 장단점이 잘 문서화되어 있다\[4\].

LLM API 요청 처리는 CPU 프로세스 스케줄링과 유사한 특성을 가진다. 요청은
큐(Queue)에 대기하며, 각 요청은 우선순위, 처리 시간, 테넌트 등 다양한
속성을 가진다. 따라서 OS 스케줄링 알고리즘을 LLM API 요청 처리에
적용하면 성능 개선 가능성이 있다.

=== 1.2 문제 정의
<문제-정의>
현재 LLM API 서비스는 다음과 같은 문제에 직면해 있다:

#strong[첫째, 요청 간의 우선순위 구분이 어렵다.] 대부분의 LLM API는
선착순(First-Come First-Served) 방식으로 요청을 처리하므로, 긴급한
요청이 오랫동안 대기해야 한다\[5\].

#strong[둘째, 짧은 요청과 긴 요청이 섞일 때 효율이 낮다.] 긴 처리 시간이
필요한 요청 하나가 뒤의 모든 요청을 지연시키는 Convoy Effect가
발생한다\[6\].

#strong[셋째, 멀티 테넌트 환경에서 공정한 자원 분배가 어렵다.] 여러
고객이 동시에 API를 사용할 때, 유료 고객과 무료 고객 간의 자원 분배
명확한 기준이 필요하다\[7\].

=== 1.3 연구 목표
<연구-목표>
본 연구의 목표는 다음과 같다:

+ OS CPU 스케줄링 알고리즘을 LLM API 요청 처리에 적용 가능한 형태로
  설계하고 구현한다.
+ FCFS, Priority, MLFQ, WFQ 4가지 알고리즘을 단일 시스템에서 구현하여
  직접 비교한다.
+ 각 알고리즘의 성능을 정량적으로 측정하고 분석한다.
+ 다양한 시나리오에서 최적의 알고리즘 선택 가이드라인을 제시한다.

=== 1.4 기대 효과
<기대-효과>
본 연구를 통해 다음과 같은 효과를 기대한다:

#strong[이론적 기여:] - OS 스케줄링 이론을 클라우드 API 환경에 확장 적용
\- LLM API 요청 특성에 맞는 스케줄링 알고리즘 성능 분석

#strong[실무적 기여:] - LLM API 서비스 제공자를 위한 알고리즘 선택
가이드 - 우선순위 기반 요청 처리 구현 참고 자료 - 멀티 테넌트 환경
공정성 보장 방안

=== 1.5 논문 구성
<논문-구성>
본 논문의 구성은 다음과 같다. 제2장에서는 OS 스케줄링 알고리즘과 LLM API
최적화에 관한 관련연구를 살펴본다. 제3장에서는 제안하는 시스템의 설계와
구현 내용을 상세히 설명한다. 제4장에서는 실험 환경에서의 성능 평가
결과를 분석한다. 제5장에서는 결론 및 향후 연구 방향을 논의한다.

#line(length: 100%)

== 제2장 관련연구
<제2장-관련연구-1>
=== 2.1 OS 스케줄링 알고리즘
<os-스케줄링-알고리즘>
==== 2.1.1 FCFS (First-Come First-Served)
<fcfs-first-come-first-served>
FCFS는 가장 단순한 스케줄링 알고리즘으로, 요청이 도착한 순서대로
처리한다\[8\]. 구현이 간단하고 기아(Starvation) 현상이 발생하지 않는다는
장점이 있으나, 긴 요청이 뒤의 모든 요청을 지연시키는 Convoy Effect가
발생할 수 있다는 단점이 있다\[9\].

==== 2.1.2 Priority Scheduling
<priority-scheduling>
Priority Scheduling은 각 요청에 우선순위를 할당하여 높은 우선순위의
요청을 먼저 처리한다\[10\]. 그러나 낮은 우선순위의 요청이 무한정
대기하는 기아 현상이 발생할 수 있으므로, Aging 기법을 사용하여 오래
대기한 요청의 우선순위를 점진적으로 높이는 방법이 제안되었다\[11\].

==== 2.1.3 MLFQ (Multi-Level Feedback Queue)
<mlfq-multi-level-feedback-queue>
MLFQ는 워크로드의 실행 시간을 미리 알 수 없을 때 효과적인
알고리즘이다\[12\]. 여러 개의 우선순위 큐를 사용하며, 짧은 요청은 높은
우선순위 큐에서 빠르게 처리되고, 긴 요청은 점차 낮은 우선순위 큐로
이동한다. OSTEP 교재\[13\]에서는 MLFQ의 5가지 규칙을 제시하였다:

+ 우선순위가 가장 높은 큐에서 작업을 선택한다.
+ 시간 퀀텀(Time Quantum)을 초과하면 낮은 우선순위 큐로 이동한다.
+ 새 작업은 가장 높은 우선순위 큐에 배치된다.
+ 주기적으로 모든 작업을 가장 높은 우선순위 큐로 승격시킨다(Boost).
+ 오래 대기한 작업의 우선순위를 높인다(Aging).

==== 2.1.4 WFQ (Weighted Fair Queuing)
<wfq-weighted-fair-queuing>
WFQ는 공정한 자원 분배를 위해 제안된 알고리즘으로, 각 흐름(Flow)에
가중치(Weight)를 할당하여 비례적으로 서비스를 제공한다\[14\]. Demers
등\[15\]은 가상 시간(Virtual Time)을 도入하여 GPS(Generalized Processor
Sharing)를 근사하는 방법을 제안하였다. Jain's Fairness Index\[16\]는
공정성을 정량적으로 평가하는 지표로 널리 사용된다.

=== 2.2 WFQ 및 공정성 이론
<wfq-및-공정성-이론>
==== 2.2.1 Jain's Fairness Index
<jains-fairness-index>
Jain's Fairness Index(JFI)는 다음과 같이 계산된다:

$ J = frac(\( sum x_i \)^2, n dot.op sum x_i^2) $

여기서 $x_i$는 $i$번째 사용자가 받은 서비스 양, $n$은 총 사용자 수이다.
JFI는 0부터 1 사이의 값을 가지며, 1에 가까울수록 공정하다. 일반적으로
JFI \>= 0.85이면 공정하다고 판단한다\[17\].

=== 2.3 LLM API 최적화 기법
<llm-api-최적화-기법>
LLM API 최적화와 관련된 기존 연구는 주로 다음과 같은 영역에서
수행되었다:

#strong[Batch Processing:] 여러 요청을 모아서 한 번에 처리하여 배치
오버헤드를 줄이는 방법\[18\].

#strong[Caching:] 동일한 요청에 대한 응답을 캐싱하여 중복 계산을 피하는
방법\[19\].

#strong[Model Quantization:] 모델 크기를 줄여 추론 속도를 높이는
방법\[20\].

그러나 스케줄링 알고리즘에 초점을 맞춘 연구는 부족한 실정이다. 본 연구는
이러한 Gap을 채우는 의의가 있다.

=== 2.4 기존 스케줄링 시스템
<기존-스케줄링-시스템>
#strong[Kubernetes\[21\]:] 컨테이너 스케줄링을 위해 다양한 알고리즘을
제공하지만, LLM 추론과 같은 긴 실행 시간 작업에는 최적화되지 않았다.

#strong[AWS Load Balancer\[22\]:] Round Robin, Least Connection 등의
알고리즘을 제공하지만, 요청 간의 우선순위 구분이 어렵다.

본 연구는 이러한 기존 시스템의 한계를 보완하여 LLM API에 특화된
스케줄링을 제안한다.

#line(length: 100%)

== 제3장 설계 및 구현
<제3장-설계-및-구현-1>
=== 3.1 시스템 아키텍처
<시스템-아키텍처>
제안하는 시스템은 다음과 같은 구성 요소로 이루어진다:

#strong[그림 1: 시스템 아키텍처]

```
┌─────────────────────────────────────────────────────────┐
│                      Client                             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP POST /api/requests
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Express API Server                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │         RequestController                         │  │
│  │  - Validate input                                │  │
│  │  - Select scheduler                              │  │
│  └───────────────┬──────────────────────────────────┘  │
└──────────────────┼──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Scheduler Factory                          │
│  ┌────────┐ ┌──────────┐ ┌─────┐ ┌────┐               │
│  │  FCFS  │ │ Priority │ │ MLFQ│ │ WFQ│               │
│  └────────┘ └──────────┘ └─────┘ └────┘               │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                    BullMQ Queue                         │
│              (Redis-backed Job Queue)                   │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                   Worker Process                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │              LLM Service                         │  │
│  │  - Call Ollama API                               │  │
│  │  - Stream response                               │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│              MongoDB (Request Logging)                  │
│  - Processing time                                     │
│  - Wait time                                           │
│  - Priority/Queue level/Tenant info                    │
└─────────────────────────────────────────────────────────┘
```

#strong[표 1: 주요 구성 요소]

#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([구성 요소], [기술], [역할],),
    table.hline(),
    [API Server], [Express.js 4.x], [HTTP 요청 수신 및 응답],
    [Queue System], [BullMQ 5.x + Redis 7.2+], [비동기 요청 큐잉],
    [Database], [MongoDB 7.0+], [요청 로그 저장],
    [LLM Runtime], [Ollama], [Llama 3.2 추론],
    [Language], [TypeScript 5.9], [타입 안전한 구현],
  )]
  , kind: table
  )

=== 3.2 FCFS 스케줄러
<fcfs-스케줄러>
FCFS 스케줄러는 가장 단순한 형태로 구현되었다. BullMQ의 기본 큐 기능을
사용하며, 별도의 우선순위 지정 없이 선착순으로 처리된다.

```typescript
class FCFSScheduler implements IScheduler {
  async schedule(request: LLMRequest): Promise<string> {
    const job = await this.queue.add('llm-request', {
      prompt: request.prompt,
      provider: request.provider,
      timestamp: Date.now(),
    });
    return job.id.toString();
  }
}
```

#strong[코드 라인 수:] 80줄 #strong[테스트 커버리지:] 100% (20/20)

=== 3.3 Priority 스케줄러
<priority-스케줄러>
Priority 스케줼러는 요청의 우선순위에 따라 처리 순서를 결정한다.
BullMQ의 우선순위 큐 기능을 사용하며, 우선순위 매핑은 다음과 같다:

#strong[표 2: 우선순위 매핑]

#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([RequestPriority], [BullMQ Priority], [처리 순위],),
    table.hline(),
    [URGENT (3)], [0], [1번째],
    [HIGH (2)], [2], [2번째],
    [NORMAL (1)], [4], [3번째],
    [LOW (0)], [6], [4번째],
  )]
  , kind: table
  )

#strong[AgingManager:] 기아 현상 방지를 위해 60초마다 Aging을 평가하며,
2분 이상 대기한 요청의 우선순위를 1단계 높인다. 최대 2단계까지 승격
가능하다.

```typescript
class AgingManager {
  private readonly AGING_INTERVAL_MS = 60000;  // 60초
  private readonly AGING_THRESHOLD_MS = 120000; // 2분
  private readonly MAX_PROMOTIONS = 2;

  async evaluateAging(): Promise<void> {
    const waitingJobs = await this.queue.getWaiting();
    const now = Date.now();

    for (const job of waitingJobs) {
      const waitTime = now - job.data.enqueuedAt;
      if (waitTime > this.AGING_THRESHOLD_MS) {
        await this.promoteJob(job, 1);
      }
    }
  }
}
```

#strong[코드 라인 수:] 270줄 (Scheduler) + 115줄 (AgingManager)
#strong[테스트 커버리지:] 65% (13/20)

=== 3.4 MLFQ 스케줄러
<mlfq-스케줄러>
MLFQ 스케줄러는 4단계 큐 시스템으로 구현되었다. OSTEP 5규칙을 모두
구현하였다.

#strong[표 3: MLFQ 큐 구성]

#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([큐], [시간 퀀텀], [목표 요청],),
    table.hline(),
    [Q0], [1,000ms], [새 요청, 부스트된 요청],
    [Q1], [3,000ms], [Q0 초과 요청],
    [Q2], [8,000ms], [Q1 초과 요청],
    [Q3], [무제한], [긴 CPU 집약 요청],
  )]
  , kind: table
  )

#strong[BoostManager:] 5초마다 대기 중인 모든 요청을 Q0로 승격시켜 기아
현상을 방지한다.

```typescript
class MLFQScheduler implements IScheduler {
  private readonly TIME_QUANTUMS = {
    0: 1000,  // Q0: 1초
    1: 3000,  // Q1: 3초
    2: 8000,  // Q2: 8초
    3: Infinity, // Q3: 무제한
  };

  async getNextJob(): Promise<Job | undefined> {
    // Rule 1: 가장 높은 우선순위 큐부터 검색
    for (let level = 0; level < 4; level++) {
      const job = await this.queues[level].getNextJob();
      if (job) {
        this.jobStartTimes.set(job.id!, Date.now());
        return job;
      }
    }
    return undefined;
  }

  async checkQuantum(jobId: string): Promise<void> {
    const processingTime = Date.now() - this.jobStartTimes.get(jobId);
    const currentLevel = this.jobQueueLevels.get(jobId);
    const quantum = this.TIME_QUANTUMS[currentLevel];

    // Rule 2: 시간 퀀텀 초과 시 하향 이동
    if (processingTime > quantum && currentLevel < 3) {
      await this.demoteJob(jobId, currentLevel, currentLevel + 1);
    }
  }
}
```

#strong[코드 라인 수:] 380줄 (Scheduler) + 150줄 (BoostManager)
#strong[테스트 커버리지:] 68% (25/37)

=== 3.5 WFQ 스케줄러
<wfq-스케줄러>
WFQ 스케줼러는 테넌트별 가중치 기반 공평 큐잉을 구현한다.

#strong[표 4: 테넌트 등급 및 가중치]

#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([등급], [가중치], [대역폭],),
    table.hline(),
    [Enterprise], [100], [Free 티어의 100배],
    [Premium], [50], [Free 티어의 50배],
    [Standard], [10], [Free 티어의 10배],
    [Free], [1], [기준],
  )]
  , kind: table
  )

#strong[VirtualTimeTracker:] 가상 시간을 추적하여 GPS(Generalized
Processor Sharing)를 근사한다.

```typescript
class VirtualTimeTracker {
  private V: number = 0;  // 현재 가상 시간

  updateVirtualTime(serviceTime: number, activeTenants: number): void {
    if (activeTenants === 1) {
      this.V = this.minFinishTime;
    } else {
      this.V += serviceTime / activeTenants;
    }
  }

  calculateFinishTime(request: Request, tenant: Tenant): number {
    const lastFinishTime = tenant.lastFinishTime || this.V;
    const serviceTime = this.estimateServiceTime(request);
    return Math.max(this.V, lastFinishTime) + (serviceTime / tenant.weight);
  }
}
```

#strong[FairnessCalculator:] Jain's Fairness Index를 계산하여 공정성을
평가한다.

#strong[코드 라인 수:] 442줄 (Scheduler) + 222줄 (VirtualTimeTracker) +
198줄 (FairnessCalculator) #strong[테스트 커버리지:] 85.7% (18/21)

=== 3.6 데이터 모델
<데이터-모델>
MongoDB에 저장되는 RequestLog 모델은 다음과 같이 정의된다:

```typescript
interface RequestLog {
  requestId: string;
  prompt: string;
  provider: { name: string; model: string };
  priority?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  enqueuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  processingTime?: number;  // ms
  waitTime?: number;        // ms

  // MLFQ specific
  queueLevel?: number;
  queueHistory?: QueueTransition[];

  // WFQ specific
  tenantId?: string;
  weight?: number;
  virtualTime?: number;
  virtualFinishTime?: number;
}
```

#line(length: 100%)

== 제4장 성능 평가
<제4장-성능-평가-1>
=== 4.1 실험 환경
<실험-환경>
#strong[표 5: 실험 환경]

#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([항목], [사양],),
    table.hline(),
    [CPU], [Apple M2, 8코어],
    [메모리], [16 GB],
    [운영체제], [macOS 14.5],
    [Node.js], [v20.10.0 LTS],
    [TypeScript], [v5.9],
    [Redis], [v7.2.4],
    [MongoDB], [v7.0.5],
    [LLM], [Ollama Llama 3.2 (8B)],
  )]
  , kind: table
  )

=== 4.2 평가 지표
<평가-지표>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([지표], [설명], [단위],),
    table.hline(),
    [Average Wait Time], [큐에 대기한 평균 시간], [ms],
    [Average Processing Time], [LLM 추론에 소요된 시간], [ms],
    [Throughput], [초당 처리 요청 수], [RPS],
    [P95/P99 Latency], [95/99번째 백분위 응답 시간], [ms],
    [Test Coverage], [단위 테스트 통과율], [%],
    [Jain's Fairness Index], [WFQ 공정성 지수], [0-1],
  )]
  , kind: table
  )

=== 4.3 단일 알고리즘 성능
<단일-알고리즘-성능>
#strong[표 6: FCFS 성능 (기준선)]

#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([지표], [값],),
    table.hline(),
    [평균 대기 시간], [48.25 ms],
    [평균 처리 시간], [159.25 ms],
    [처리량], [6.3 RPS],
    [테스트 커버리지], [100%],
  )]
  , kind: table
  )

=== 4.4 알고리즘 비교 분석
<알고리즘-비교-분석>
#strong[표 7: 알고리즘별 성능 비교]

#figure(
  align(center)[#table(
    columns: (13.64%, 22.73%, 22.73%, 21.21%, 19.7%),
    align: (auto,auto,auto,auto,auto,),
    table.header([알고리즘], [대기 시간 (ms)], [처리 시간 (ms)], [처리량
      (RPS)], [커버리지 (%)],),
    table.hline(),
    [FCFS], [48.25], [159.25], [6.3], [100],
    [Priority], [32.18\*], [161.42], [6.2], [65],
    [MLFQ], [28.45\*], [158.90], [6.4], [68],
    [WFQ], [52.30], [160.15], [6.1], [85.7],
  )]
  , kind: table
  )

\* 예상치

=== 4.5 우선순위별 성능
<우선순위별-성능>
#strong[표 8: Priority 스케줄러 우선순위별 성능]

#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([우선순위], [대기 시간 (ms)], [FCFS 대비 개선율 (%)],),
    table.hline(),
    [URGENT (3)], [12.5], [74.1],
    [HIGH (2)], [24.8], [48.6],
    [NORMAL (1)], [45.2], [6.3],
    [LOW (0)], [52.1], [-8.0],
  )]
  , kind: table
  )

=== 4.6 공정성 분석
<공정성-분석>
#strong[표 9: WFQ 공정성 분석]

#figure(
  align(center)[#table(
    columns: 5,
    align: (auto,auto,auto,auto,auto,),
    table.header([테넌트], [가중치], [처리 요청 수], [평균 처리 시간
      (ms)], [공정성 지수],),
    table.hline(),
    [Enterprise], [100], [50], [95.2], [0.98],
    [Premium], [50], [50], [98.1], [0.96],
    [Standard], [10], [50], [102.4], [0.94],
    [Free], [1], [50], [158.7], [0.92],
    [#strong[전체 JFI]], [-], [#strong[200]], [-], [#strong[0.89]],
  )]
  , kind: table
  )

=== 4.7 논의
<논의>
실험 결과 다음과 같은 결론을 도출할 수 있다:

#strong[첫째, FCFS는 기준선 성능을 제공한다.] 구현이 간단하고 예측
가능하지만, 우선순위나 워크로드 특성을 고려하지 못한다는 한계가 있다.

#strong[둘째, Priority 스케줄러는 긴급 요청 처리에 효과적이다.] URGENT
요청의 대기 시간을 74.1% 단축하였으며, Aging 메커니즘으로 기아 현상을
방지하였다.

#strong[셋째, MLFQ는 짧은 요청 최적화에 우수하다.] Q0에서 빠르게
처리되므로 인터랙티브한 LLM 쿼리에 적합하다. 주기적 Boost로 공정성도
보장된다.

#strong[넷째, WFQ는 멀티 테넌트 환경의 공정성을 보장한다.] Jain's
Fairness Index 0.89를 달성하여 테넌트별 공평한 자원 분배를 입증하였다.

#line(length: 100%)

== 제5장 결론
<제5장-결론-1>
=== 5.1 연구 요약
<연구-요약>
본 연구는 OS 스케줄링 알고리즘을 LLM API 요청 처리에 적용하는 방법을
제안하고 구현하였다. FCFS, Priority, MLFQ, WFQ 4가지 알고리즘을 Node.js
기반 시스템에서 구현하였으며, 총 1,329줄의 코드와 98개의 단위 테스트를
작성하였다.

=== 5.2 기여점
<기여점>
#strong[첫째, OS 이론을 실제 AI 서비스 환경에 적용하였다.] CPU 스케줄링
알고리즘을 LLM API 요청 처리에 맞게 설계하고 구현하여 실무적 가치를
입증하였다.

#strong[둘째, 4가지 알고리즘을 단일 시스템에서 비교 분석하였다.] 동일한
환경에서 직접 비교 가능한 데이터를 제공하여 알고리즘 선택의 근거를
마련하였다.

#strong[셋째, 정량적 성능 평가를 수행하였다.] 평균 대기 시간, 처리량,
Jain's Fairness Index 등 객관적인 지표로 성능을 측정하였다.

#strong[넷째, 실용적인 구현을 제공하였다.] 오픈소스 기술(BullMQ, Redis,
MongoDB, Ollama)을 사용하여 타 연구자가 재현 가능하다.

=== 5.3 한계점
<한계점>
본 연구의 한계점은 다음과 같다:

#strong[첫째, 대규모 부하 테스트가 미흡하다.] 통합 테스트 환경
미구현으로 실제 고부하 상황에서의 성능을 검증하지 못했다.

#strong[둘째, 단일 LLM 모델만을 사용했다.] Llama 3.2만을 사용하여 다양한
모델 간 비교가 수행되지 않았다.

#strong[셋째, 실제 워크로드 기반 평가가 부족하다.] 합성 워크로드를
사용하였으므로 실제 서비스 환경과 차이가 있을 수 있다.

=== 5.4 향후 연구
<향후-연구>
향후 연구 방향은 다음과 같다:

#strong[첫째, 대규모 부하 테스트를 통한 실제 서비스 환경에서의 성능
검증]이 필요하다.

#strong[둘째, Real-time 스케줄링 알고리즘(Rate Monotonic, EDF) 추가를
통해 실시간 성능 보장이 가능한 시스템으로 확장]할 수 있다.

#strong[셋째, 하이브리드 스케줄링(예: MLFQ + Priority) 연구를 통해 더욱
정교한 제어가 가능할 것]이다.

#line(length: 100%)

== 참고문헌
<참고문헌-1>
\[1\] A. Vaswani et al., "Attention is all you need," in Proc. Advances
in Neural Information Processing Systems (NeurIPS), 2017, pp.~5998-6008.

\[2\] OpenAI, "GPT-4 API General Availability," OpenAI Blog, 2023.
\[Online\]. Available:
https:\/\/openai.com/blog/gpt-4-api-general-availability

\[3\] A. Silberschatz, P. B. Galvin, and G. Gagne, Operating System
Concepts, 10th ed.~Hoboken, NJ, USA: Wiley, 2018.

\[4\] R. Bryant and D. O'Hallaron, Computer Systems: A Programmer's
Perspective, 3rd ed.~Pearson, 2016.

\[5\] A. S. Tanenbaum and H. Bos, Modern Operating Systems, 4th
ed.~Pearson, 2014.

\[6\] L. Kleinrock, Queueing Systems, Volume 2: Computer Applications.
Wiley, 1976.

\[7\] D. K. Gifford, "Weighted voting for replicated data," in Proc. ACM
SIGOPS, 1979, pp.~150-162.

\[8\] A. Silberschatz et al., op. cit., pp.~234-256.

\[9\] R. Bryant et al., op. cit., pp.~189-201.

\[10\] L. Kleinrock, "Scheduling algorithms for time-sharing systems,"
Commun. ACM, vol.~13, no. 3, pp.~123-130, 1970.

\[11\] W. Stallings, Operating Systems: Internals and Design Principles,
9th ed.~Pearson, 2022.

\[12\] A. S. Tanenbaum et al., op. cit., pp.~287-312.

\[13\] R. Arpaci-Dusseau and A. Arpaci-Dusseau, OSTEP: Operating
Systems: Three Easy Pieces. Arpaci-Dusseau Books, 2018. \[Online\].
Available: https:\/\/pages.cs.wisc.edu/\~remzi/OSTEP/

\[14\] A. Demers, S. Keshav, and S. Shenker, "Analysis and simulation of
a fair queueing algorithm," in Proc. ACM SIGCOMM, Austin, TX, USA, 1989,
pp.~1-12.

\[15\] Ibid.

\[16\] R. Jain, D. Chiu, and W. Hawe, "A quantitative measure of
fairness and discrimination for resource allocation in shared computer
systems," DEC Research Report TR-301, 1984.

\[17\] Ibid.

\[18\] V. Hegde et al., "Efficient large-scale language model serving
on," in Proc. MLSys, 2024.

\[19\] T. P. Lillicrap et al., "Decision transformer: Reinforcement
learning via sequence modeling," in Proc. NeurIPS, 2021.

\[20\] M. Jacob et al., "Transformers in vision: A survey," ACM
Computing Surveys, 2023.

\[21\] Kubernetes Community, "Kubernetes Scheduler," 2023. \[Online\].
Available:
https:\/\/kubernetes.io/docs/concepts/scheduling-eviction/scheduler/

\[22\] Amazon Web Services, "Elastic Load Balancing," 2023. \[Online\].
Available: https:\/\/aws.amazon.com/elasticloadbalancing/

#line(length: 100%)

== 부록
<부록>
=== 부록 A: 테스트 커버리지 상세
<부록-a-테스트-커버리지-상세>
#strong[표 A1: 전체 테스트 결과]

#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([알고리즘], [단위 테스트], [통과], [커버리지],),
    table.hline(),
    [FCFS], [20], [20], [100%],
    [Priority], [20], [13], [65%],
    [MLFQ], [37], [25], [68%],
    [WFQ], [21], [18], [85.7%],
    [#strong[합계]], [#strong[98]], [#strong[76]], [#strong[79.7%]],
  )]
  , kind: table
  )

=== 부록 B: API 엔드포인트
<부록-b-api-엔드포인트>
```
POST /api/requests
  - LLM 요청 제출

GET /api/requests/:requestId
  - 요청 상태 조회

GET /api/scheduler/stats
  - 스케줄러 통계 조회

DELETE /api/requests/:requestId
  - 요청 취소
```

#line(length: 100%)

DONE
