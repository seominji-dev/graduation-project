# 02. 완전한 코드 워크스루 (Complete Code Walkthrough)

> **학습 목표:** 이 문서를 읽고 나면 프로젝트의 모든 파일과 코드 실행 흐름을 완벽하게 이해할 수 있습니다.

---

## 1. 파일 구조 분석

### 1.1 전체 디렉토리 트리

```
02-implementation/
├── src-simple/
│   ├── api/                    # API 계층
│   │   ├── controllers/        # 요청 처리 컨트롤러
│   │   │   ├── requestController.js
│   │   │   └── schedulerController.js
│   │   └── routes/             # 라우트 정의
│   │       └── index.js
│   │
│   ├── config/                 # 설정 관리
│   │   ├── constants.js        # 상수 정의
│   │   └── index.js            # 설정 내보내기
│   │
│   ├── domain/                 # 도메인 모델
│   │   └── models.js           # 핵심 도메인 모델
│   │
│   ├── managers/               # 관리자 컴포넌트
│   │   ├── AgingManager.js     # Priority용 기아 방지
│   │   ├── BoostManager.js     # MLFQ용 주기적 부스팅
│   │   ├── TenantRegistry.js   # WFQ용 테넌트 관리
│   │   ├── VirtualTimeTracker.js # WFQ용 가상 시간
│   │   └── FairnessCalculator.js # WFQ용 공정성 계산
│   │
│   ├── middlewares/            # Express 미들웨어
│   │   ├── errorHandler.js
│   │   └── validation.js
│   │
│   ├── schedulers/             # 스케줄러 구현
│   │   ├── FCFSScheduler.js    # FCFS 구현
│   │   ├── PriorityScheduler.js # Priority 구현
│   │   ├── MLFQScheduler.js    # MLFQ 구현
│   │   └── WFQScheduler.js     # WFQ 구현
│   │
│   ├── services/               # 서비스 계층
│   │   ├── llmService.js       # LLM API 호출
│   │   └── schedulerFactory.js # 스케줄러 팩토리
│   │
│   ├── utils/                  # 유틸리티
│   │   └── logger.js           # 로거
│   │
│   └── index.js                # 애플리케이션 진입점
│
├── tests-simple/               # 테스트 파일 (67개)
│   ├── unit/                   # 단위 테스트
│   ├── integration/            # 통합 테스트
│   └── setup.js                # 테스트 설정
│
├── package.json                # 프로젝트 설정
├── jest.config.js              # Jest 설정
└── README.md                   # 프로젝트 문서
```

---

## 2. 핵심 파일 상세 분석

### 2.1 도메인 모델 (src/domain/models.ts)

**목적:** 시스템의 핵심 도메인 개념을 정의

**핵심 내용:**

```typescript
// 우선순위 열거형
export enum RequestPriority {
  LOW = 0,      // 낮음
  NORMAL = 1,   // 보통
  HIGH = 2,     // 높음
  URGENT = 3,   // 긴급
}

// 요청 상태 열거형
export enum RequestStatus {
  PENDING = "pending",       // 대기 중
  QUEUED = "queued",         // 큐에 대기열
  PROCESSING = "processing", // 처리 중
  COMPLETED = "completed",   // 완료
  FAILED = "failed",         // 실패
  CANCELLED = "cancelled",   // 취소
}

// LLM 요청 스키마
export const LLMRequestSchema = z.object({
  id: z.string().uuid(),                    // 고유 ID
  prompt: z.string().min(1),                // 요청 프롬프트
  provider: LLMProviderSchema,              // LLM 제공자
  priority: z.nativeEnum(RequestPriority),  // 우선순위
  status: z.nativeEnum(RequestStatus),      // 상태
  metadata: z.record(z.unknown()).optional(), // 메타데이터
  createdAt: z.date(),                      // 생성 시간
  updatedAt: z.date(),                      // 수정 시간
});
```

**왜 이렇게 설계했나?**
- **Enum 사용:** 타입 안전성 보장 (잘못된 값 할당 방지)
- **Zod 스키마:** 런타임 타입 검증 (API 요청 등)
- **명확한 필드명:** 의도를 명확하게 전달

---

### 2.2 스케줄러 인터페이스 (src/schedulers/types.ts)

**목적:** 모든 스케줄러가 따라야 할 공통 인터페이스 정의

**핵심 내용:**

```typescript
export interface IScheduler {
  // 초기화
  initialize(): Promise<void>;
  
  // 요청 제출
  submit(request: LLMRequest): Promise<string>;
  
  // 상태 조회
  getStatus(requestId: string): Promise<string>;
  
  // 요청 취소
  cancel(requestId: string): Promise<boolean>;
  
  // 통계 조회
  getStats(): Promise<SchedulerStats>;
  
  // 일시정지/재개
  pause(): Promise<void>;
  resume(): Promise<void>;
  
  // 종료
  shutdown(): Promise<void>;
}
```

**왜 인터페이스를 사용했나?**
- **다형성:** 4개 스케줄러를 동일한 방식으로 사용 가능
- **교체 가능성:** 런타임에 스케줄러 교체 용이
- **테스트 용이성:** Mock 구현으로 테스트 단순화

---

### 2.3 FCFS 스케줄러 (src/schedulers/FCFSScheduler.ts)

**목적:** 가장 단순한 선착순 스케줄링 구현

**핵심 로직:**

```typescript
export class FCFSScheduler implements IScheduler {
  private queue: Queue | null = null;      // 메모리 큐 큐
  private worker: Worker | null = null;    // 메모리 큐 워커
  private llmService: LLMService;          // LLM 서비스
  private jobTimings: Map<string, {...}>;  // 작업 시간 추적

  // 초기화: 큐와 워커 생성
  initialize(): Promise<void> {
    // 메모리 연결 가져오기
    const bullmqConnection = redisManager.get메모리 큐Connection();
    
    // 큐 생성
    this.queue = new Queue(this.config.name, {
      connection: bullmqConnection,
      defaultJobOptions: {
        attempts: 3,              // 최대 3번 재시도
        backoff: {
          type: "exponential",     // 지수 백오프
          delay: 1000,            // 1초 대기
        },
      },
    });
    
    // 워커 생성
    this.worker = new Worker(
      this.config.name,
      async (job: Job<QueueJob>) => {
        return await this.processJob(job);
      },
      {
        connection: bullmqConnection,
        concurrency: 1,  // 동시에 1개 작업만 처리
      }
    );
  }

  // 요청 제출
  async submit(request: LLMRequest): Promise<string> {
    const queuedAt = new Date();
    
    // 큐에 작업 추가
    const job = await this.queue.add(
      "llm-request-" + request.id,
      jobData,
      {
        jobId: request.id,              // 작업 ID
        priority: this.getPriorityValue(request.priority),
      }
    );
    
    // SQLite에 로그 기록
    await this.logRequest(request, RequestStatus.QUEUED, queuedAt);
    
    return job.id ?? request.id;
  }

  // 작업 처리
  private async processJob(job: Job<QueueJob>): Promise<string> {
    const startedAt = new Date();
    
    // 대기 시간 계산
    const waitTime = startedAt.getTime() - timing.queued.getTime();
    
    try {
      // LLM 처리
      const response = await this.llmService.process(prompt, provider);
      const completedAt = new Date();
      const processingTime = completedAt.getTime() - startedAt.getTime();
      
      // SQLite에 결과 저장
      await this.logResponse(
        requestId,
        RequestStatus.COMPLETED,
        response,
        waitTime,
        processingTime,
        completedAt
      );
      
      return response;
    } catch (error) {
      // 실패 로그 기록
      await this.logResponse(..., RequestStatus.FAILED, ...);
      throw error;
    }
  }
}
```

**핵심 설계 결정:**
1. **메모리 큐 사용:** 메모리 기반의 신뢰할 수 있는 큐 시스템
2. **Job Timing Map:** 각 작업의 대기/처리 시간 추적
3. **SQLite 로그:** 모든 요청/응답 영구 저장
4. **에러 처리:** 실패 시 로그 기록 후 재Throw

---

### 2.4 Priority 스케줄러 (src/schedulers/PriorityScheduler.ts)

**목적:** 우선순위 기반 스케줄링 + Aging으로 기아 방지

**FCFS와의 차이점:**

```typescript
export class PriorityScheduler implements IScheduler {
  private agingManager: AgingManager | null = null;  // ★ 추가됨

  initialize(): Promise<void> {
    // FCFS와 동일하게 큐/워커 생성
    
    // ★ Aging Manager 시작
    this.agingManager = new AgingManager(this);
    this.agingManager.start();
  }

  // ★ 우선순위 변환 (중요!)
  private getPriorityValue(priority: RequestPriority): number {
    // 메모리 큐: 낮은 숫자 = 높은 우선순위
    // RequestPriority: 높은 숫자 = 높은 우선순위
    // 따라서 변환 필요: (MAX - priority) * 2
    return (MAX_PRIORITY - priority) * 2;
    
    // 예시:
    // URGENT(3) -> (3-3)*2 = 0   (가장 높음)
    // HIGH(2)   -> (3-2)*2 = 2
    // NORMAL(1) -> (3-1)*2 = 4
    // LOW(0)    -> (3-0)*2 = 6   (가장 낮음)
  }

  // ★ Aging Manager용 메서드
  async updateJobPriority(
    jobId: string,
    newPriority: RequestPriority
  ): Promise<boolean> {
    // 1. 기존 작업 가져오기
    const job = await this.queue.getJob(jobId);
    
    // 2. 상태 확인 (waiting/delayed만 가능)
    const state = await job.getState();
    if (state !== "waiting" && state !== "delayed") {
      return false;
    }
    
    // 3. 작업 제거
    await job.remove();
    
    // 4. 새 우선순위로 재추가
    await this.queue.add(
      job.name,
      { ...job.data, priority: newPriority },
      { ...job.opts, priority: this.getPriorityValue(newPriority) }
    );
    
    return true;
  }
}
```

**왜 제거 후 재추가인가?**
- 메모리 큐는 실행 중인 작업의 우선순위 업데이트를 지원하지 않음
- 따라서 제거 후 새 우선순위로 다시 추가해야 함

---

### 2.5 MLFQ 스케줄러 (src/schedulers/MLFQScheduler.ts)

**목적:** 4단계 큐와 5가지 규칙으로 동적 우선순위 구현

**핵심 구조:**

```typescript
export class MLFQScheduler implements IScheduler {
  // ★ 4개의 독립 큐
  private queues: Queue[] = [];      // [Q0, Q1, Q2, Q3]
  private workers: Worker[] = [];    // [W0, W1, W2, W3]
  
  // ★ MLFQ 메타데이터
  private jobMetadata: Map<string, {
    queueLevel: number;          // 현재 큐 레벨 (0-3)
    queueHistory: number[];      // 큐 이동이력
    timeSliceUsed?: number;      // 사용한 시간 퀀텀
    timeSliceRemaining: number;  // 남은 시간 퀀텀
    totalCPUTime: number;        // 총 CPU 시간
  }>;

  // 큐 설정
  private readonly QUEUE_LEVELS = 4;
  private readonly TIME_QUANTA = [1000, 3000, 8000, Infinity];
  private readonly QUEUE_NAMES = ["mlfq-q0", "mlfq-q1", "mlfq-q2", "mlfq-q3"];

  initialize(): Promise<void> {
    // 4개 큐와 워커 생성
    for (let level = 0; level < QUEUE_LEVELS; level++) {
      const queue = new Queue(QUEUE_NAMES[level], {...});
      const worker = new Worker(QUEUE_NAMES[level], async (job) => {
        return await this.processJob(job, level);
      }, {...});
      
      this.queues.push(queue);
      this.workers.push(worker);
    }
    
    // ★ Boost Manager 시작 (Rule 5)
    this.boostManager = new BoostManager(this);
    this.boostManager.start();
  }

  // ★ Rule 3: 새 작업은 항상 Q0에서 시작
  async submit(request: LLMRequest): Promise<string> {
    const mlfqJobData: MLFQQueueJob = {
      ...jobData,
      queueLevel: 0,              // Q0에서 시작
      queueHistory: [0],          // 이력 기록
      timeSliceRemaining: TIME_QUANTA[0],  // Q0의 시간 퀀텀
      totalCPUTime: 0,
    };
    
    // Q0에 추가
    await this.queues[0].add(job.name, mlfqJobData, {
      priority: 0,  // 같은 큐 내에서는 Round-Robin
    });
  }

  // ★ Rule 4: 시간 퀀텀 초과 시 강등
  private async processJob(job: Job<MLFQQueueJob>, queueLevel: number) {
    const timeQuantum = TIME_QUANTA[queueLevel];
    
    if (timeQuantum === Infinity) {
      // Q3: 무제한 (FCFS 동작)
      response = await this.llmService.process(prompt, provider);
    } else {
      // Q0-Q2: 시간 퀀텀 강제
      try {
        // 타임아웃과 경쟁
        response = await Promise.race([
          this.llmService.process(prompt, provider),
          timeoutPromise(timeQuantum),
        ]);
      } catch (error) {
        if (error === "Time quantum exceeded") {
          // ★ 강등: 다음 낮은 큐로 이동
          await this.demoteJob(requestId, queueLevel);
        }
      }
    }
  }

  // ★ 작업 강등 (Rule 4)
  private async demoteJob(requestId: string, currentLevel: number) {
    const newLevel = currentLevel + 1;
    
    // 메타데이터 업데이트
    metadata.queueLevel = newLevel;
    metadata.queueHistory.push(newLevel);
    metadata.timeSliceRemaining = TIME_QUANTA[newLevel];
    
    // 새 큐에 재추가
    await this.queues[newLevel].add(job.name, metadata, {
      jobId: requestId,
      priority: newLevel,
    });
  }

  // ★ Rule 5: 주기적 Boost (Boost Manager 호출)
  async boostAllJobs(): Promise<number> {
    let boostedCount = 0;
    
    // Q1, Q2, Q3의 작업을 Q0로 이동
    for (let sourceLevel = 1; sourceLevel < QUEUE_LEVELS; sourceLevel++) {
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
}
```

**5가지 MLFQ 규칙 구현:**
1. **Rule 1:** 높은 우선순위 큐 먼저 처리 (메모리 큐 기본 동작)
2. **Rule 2:** 같은 우선순위는 Round-Robin (priority: 0)
3. **Rule 3:** 새 작업은 Q0에서 시작 (queueLevel: 0)
4. **Rule 4:** 시간 퀀텀 초과 시 강등 (demoteJob)
5. **Rule 5:** 주기적 Boost (boostAllJobs)

---

### 2.6 WFQ 스케줄러 (src/schedulers/WFQScheduler.ts)

**목적:** 멀티테넌트 환경에서 가중치 기반 공정 분배

**핵심 구조:**

```typescript
export class WFQScheduler implements IScheduler {
  private tenantRegistry: TenantRegistry;       // 테넌트 관리
  private virtualTimeTracker: VirtualTimeTracker; // 가상 시간 추적
  private fairnessCalculator: FairnessCalculator; // 공정성 계산

  async submit(request: LLMRequest): Promise<string> {
    // 1. 테넌트 확인
    const tenantId = request.metadata?.tenantId || "default";
    const tenant = this.tenantRegistry.getTenant(tenantId);
    const weight = tenant.weight;  // 예: enterprise=100, free=1
    
    // 2. 가상 완료 시간 계산
    const virtualFinishTime = 
      this.virtualTimeTracker.calculateVirtualFinishTime(
        requestId,
        tenantId,
        estimatedServiceTime,  // 예: 5000ms
        weight                 // 예: 100
      );
    
    // 3. 큐에 추가 (우선순위 = 가상 완료 시간)
    await this.queue.add(job.name, jobData, {
      priority: Math.floor(virtualFinishTime.virtualFinishTime),
    });
  }

  private async processJob(job: Job<WFQQueueJob>) {
    // 1. 활성 가중치 합 계산
    const activeWeightSum = this.getActiveWeightSum();
    
    // 2. LLM 처리
    const response = await this.llmService.process(prompt, provider);
    
    // 3. 가상 시간 업데이트
    this.virtualTimeTracker.updateVirtualTime(
      processingTime,  // 실제 처리 시간
      activeWeightSum  // 활성 테넌트 가중치 합
    );
    
    // 4. 공정성 기록
    this.fairnessCalculator.recordRequestCompletion(
      tenantId,
      processingTime,
      waitTime
    );
  }
}
```

**Virtual Time 계산 (VirtualTimeTracker):**

```typescript
export class VirtualTimeTracker {
  private virtualTime: number = 0;  // 전역 가상 시간

  calculateVirtualFinishTime(
    requestId: string,
    tenantId: string,
    serviceTime: number,
    weight: number
  ): VirtualFinishTime {
    // 가상 시작 시간 = 현재 가상 시간
    const virtualStartTime = this.virtualTime;
    
    // 가상 완료 시간 = 가상 시작 시간 + (서비스 시간 / 가중치)
    const virtualFinishTime = virtualStartTime + (serviceTime / weight);
    
    return { virtualStartTime, virtualFinishTime };
  }

  updateVirtualTime(actualTime: number, totalWeight: number) {
    // 가상 시간 증가 = 실제 시간 / 총 가중치
    this.virtualTime += actualTime / totalWeight;
  }
}
```

**공정성 계산 (FairnessCalculator):**

```typescript
export class FairnessCalculator {
  private tenantStats: Map<string, {
    completedRequests: number;
    totalProcessingTime: number;
    totalWaitTime: number;
  }> = new Map();

  recordRequestCompletion(
    tenantId: string,
    processingTime: number,
    waitTime: number
  ) {
    const stats = this.tenantStats.get(tenantId) || {
      completedRequests: 0,
      totalProcessingTime: 0,
      totalWaitTime: 0,
    };
    
    stats.completedRequests++;
    stats.totalProcessingTime += processingTime;
    stats.totalWaitTime += waitTime;
    
    this.tenantStats.set(tenantId, stats);
  }

  // Jain's Fairness Index 계산
  getFairnessMetrics() {
    const serviceTimes: number[] = [];
    
    for (const stats of this.tenantStats.values()) {
      if (stats.completedRequests > 0) {
        const avgServiceTime = stats.totalProcessingTime / stats.completedRequests;
        serviceTimes.push(avgServiceTime);
      }
    }
    
    // J = (Σxi)² / (n × Σxi²)
    const sum = serviceTimes.reduce((a, b) => a + b, 0);
    const sumSquared = serviceTimes.reduce((a, b) => a + b*b, 0);
    const n = serviceTimes.length;
    
    const jainsIndex = (sum * sum) / (n * sumSquared);
    
    return {
      jainsFairnessIndex: jainsIndex,  // 1.0 = 완벽한 공정
      fairnessScore: jainsIndex * 100,
      activeTenants: n,
    };
  }
}
```

---

## 3. 코드 실행 흐름

### 3.1 요청 제출 흐름

```
1. 클라이언트가 POST /api/requests 호출
   ↓
2. RequestController.submitRequest()
   - 요청 데이터 검증 (Zod)
   - LLMRequest 객체 생성
   ↓
3. SchedulerManager.submit()
   - configured scheduler 가져오기
   ↓
4. Specific Scheduler.submit() (FCFS/Priority/MLFQ/WFQ)
   - 메모리 큐 Queue에 작업 추가
   - SQLite에 요청 로그 저장
   ↓
5. 메모리 큐 Worker가 작업 감지
   ↓
6. Scheduler.processJob()
   - LLMService.process() 호출
   - SQLite에 결과 저장
   ↓
7. 클라이언트가 GET /api/requests/:id로 결과 조회
```

### 3.2 Priority Scheduler의 Aging 흐름

```
1. PriorityScheduler.initialize()
   - AgingManager 시작
   ↓
2. AgingManager.start()
   - setInterval로 주기적 실행 (10초마다)
   ↓
3. AgingManager.runAging()
   - 모든 대기 작업 가져오기
   ↓
4. 각 작업에 대해:
   - 대기 시간 확인 (> 30초?)
   - 우선순위 상향 (예: LOW → NORMAL)
   - PriorityScheduler.updateJobPriority() 호출
   ↓
5. PriorityScheduler.updateJobPriority()
   - 기존 작업 제거
   - 새 우선순위로 재추가
```

### 3.3 MLFQ Boost 흐름

```
1. MLFQScheduler.initialize()
   - BoostManager 시작
   ↓
2. BoostManager.start()
   - setInterval로 주기적 실행 (60초마다)
   ↓
3. BoostManager.runBoost()
   - MLFQScheduler.boostAllJobs() 호출
   ↓
4. MLFQScheduler.boostAllJobs()
   - Q1, Q2, Q3의 모든 작업 가져오기
   ↓
5. 각 작업에 대해:
   - 기존 큐에서 제거
   - Q0에 재추가
   - SQLite에 큐 레벨 업데이트
```

---

## 4. 핵심 메서드 실행 순서

### 4.1 FCFS 요청부터 완료까지

```typescript
// 1. 클라이언트 요청
POST /api/requests
Body: {
  "prompt": "Hello, world!",
  "provider": {"name": "ollama", "model": "llama2"},
  "priority": 1  // NORMAL
}

// 2. RequestController.submitRequest()
async submitRequest(req, res) {
  const request = LLMRequestSchema.parse(req.body);  // Zod 검증
  
  const scheduler = this.schedulerManager.getScheduler("fcfs");
  const requestId = await scheduler.submit(request);
  
  res.status(201).json({ requestId });
}

// 3. FCFSScheduler.submit()
async submit(request: LLMRequest) {
  const job = await this.queue.add(
    "llm-request-" + request.id,
    {
      requestId: request.id,
      prompt: request.prompt,
      provider: request.provider,
      priority: request.priority,
      attempts: 0,
    },
    {
      jobId: request.id,
      priority: 2,  // NORMAL * 2
    }
  );
  
  await this.logRequest(request, RequestStatus.QUEUED, new Date());
  
  return job.id;
}

// 4. 메모리 큐 Worker.processJob()
async processJob(job) {
  const response = await this.llmService.process(
    job.data.prompt,
    job.data.provider
  );
  
  await this.logResponse(
    job.data.requestId,
    RequestStatus.COMPLETED,
    response,
    waitTime,
    processingTime,
    new Date()
  );
  
  return response;
}

// 5. 클라이언트 결과 조회
GET /api/requests/{requestId}
Response: {
  "requestId": "...",
  "status": "completed",
  "response": "Hello! How can I help you today?",
  "processingTime": 1234,
  "waitTime": 56
}
```

---

## 5. 데이터 구조 상세

### 5.1 LLMRequest 객체

```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",  // UUID
  prompt: "Explain quantum computing",
  provider: {
    name: "ollama",        // "ollama" | "openai"
    model: "llama2",       // 모델명
    baseUrl: "http://localhost:11434",
    apiKey: undefined
  },
  priority: 2,             // 0=LOW, 1=NORMAL, 2=HIGH, 3=URGENT
  status: "pending",       // RequestStatus enum
  metadata: {
    tenantId: "enterprise-client-a",
    userId: "user-123",
    category: "technical"
  },
  createdAt: new Date("2026-01-30T10:00:00Z"),
  updatedAt: new Date("2026-01-30T10:00:00Z")
}
```

### 5.2 QueueJob 객체 (메모리 큐)

```typescript
{
  requestId: "550e8400-e29b-41d4-a716-446655440000",
  prompt: "Explain quantum computing",
  provider: {...},
  priority: 2,
  attempts: 0,
  queuedAt: new Date("2026-01-30T10:00:00Z"),
  
  // WFQ 전용 필드
  tenantId: "enterprise-client-a",
  weight: 100,
  
  // MLFQ 전용 필드
  queueLevel: 0,
  queueHistory: [0],
  timeSliceUsed: 500,
  timeSliceRemaining: 500,
  totalCPUTime: 500
}
```

### 5.3 SQLite RequestLog 문서

```typescript
{
  _id: ObjectId("..."),
  requestId: "550e8400-e29b-41d4-a716-446655440000",
  prompt: "Explain quantum computing",
  provider: "ollama",
  modelName: "llama2",
  priority: 2,
  status: "completed",
  response: "Quantum computing is...",
  processingTime: 1234,      // ms
  waitTime: 56,              // ms
  completedAt: new Date("2026-01-30T10:00:01.234Z"),
  
  // MLFQ 필드
  queueLevel: 1,
  queueHistory: [0, 1],
  timeSliceUsed: 1000,
  
  // WFQ 필드
  tenantId: "enterprise-client-a",
  weight: 100,
  virtualTime: 12.34,
  
  createdAt: new Date("2026-01-30T10:00:00Z"),
  updatedAt: new Date("2026-01-30T10:00:01.234Z")
}
```

---

## 6. 요약

이 문서에서 다룬 내용:

1. **파일 구조:** 전체 디렉토리 트리와 각 파일의 역할
2. **핵심 파일:** 도메인 모델, 인터페이스, 4개 스케줄러 상세
3. **실행 흐름:** 요청 제입부터 완료까지의 전체 흐름
4. **데이터 구조:** 주요 객체의 필드와 용도

**다음 단계:**
- 알고리즘 상세 → **[03-algorithms-deep-dive.md](./03-algorithms-deep-dive.md)**
- 컴포넌트 상호작용 → **[04-component-interactions.md](./04-component-interactions.md)**

---

**작성일:** 2026-02-04
**버전:** 2.0.0
**작성자:** 서민지
