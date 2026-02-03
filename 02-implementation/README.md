# Phase 2: 구현 (Implementation)

## 프로젝트명
**LLM 스케줄러: OS 스케줄링 기법을 활용한 LLM API 요청 최적화**

## 이 폴더의 목적
LLM 스케줄러 소스코드, 테스트, 실험 데이터를 관리합니다.

---

## 단순화된 기술 스택

| 기술 | 버전 | 용도 | 선정 이유 |
|------|------|------|----------|
| JavaScript | ES2024 | 개발 언어 | 학습 곡선 낮음 |
| Node.js | 20 LTS | 런타임 | 안정성 |
| Express.js | 4.18 | 웹 프레임워크 | 간결한 API |
| SQLite | 3.x | 데이터 저장 | 설치 불필요 |
| Jest | 29.x | 테스트 | 표준 프레임워크 |

**제거된 기술**: TypeScript, Redis, MongoDB, BullMQ, Socket.io, Docker

---

## 폴더 구조

```
02-implementation/
├── src/
│   ├── index.js              # 진입점
│   ├── server.js             # Express 서버
│   ├── api/
│   │   └── routes.js         # REST API 라우트
│   ├── schedulers/
│   │   ├── BaseScheduler.js  # 공통 인터페이스
│   │   ├── FCFSScheduler.js  # FCFS 구현
│   │   ├── PriorityScheduler.js  # Priority 구현
│   │   ├── MLFQScheduler.js  # MLFQ 구현
│   │   └── WFQScheduler.js   # WFQ 구현
│   ├── queue/
│   │   └── MemoryQueue.js    # 메모리 기반 큐
│   ├── storage/
│   │   └── SQLiteStore.js    # 요청 이력 저장
│   └── llm/
│       └── OllamaClient.js   # Ollama 연동
├── tests/
│   ├── fcfs.test.js
│   ├── priority.test.js
│   ├── mlfq.test.js
│   └── wfq.test.js
├── data/
│   └── requests.db           # SQLite 데이터베이스
├── package.json
├── jest.config.js
└── README.md
```

---

## 빠른 시작

```bash
cd 02-implementation

# 의존성 설치
npm install

# 개발 서버 실행 (포트 3000)
npm start

# 테스트 실행
npm test
```

---

## 스케줄러 구현 가이드

### 1. BaseScheduler (공통 인터페이스)

모든 스케줄러가 구현해야 하는 기본 인터페이스입니다.

```javascript
// src/schedulers/BaseScheduler.js
const { v4: uuidv4 } = require('uuid');

class BaseScheduler {
  constructor(name) {
    this.name = name;
    this.queue = [];
  }

  // 요청을 스케줄링 (자식 클래스에서 오버라이드)
  schedule(request) {
    throw new Error('schedule() must be implemented');
  }

  // 다음 처리할 요청 반환 (자식 클래스에서 오버라이드)
  getNext() {
    throw new Error('getNext() must be implemented');
  }

  // 요청 상태 조회
  getStatus(requestId) {
    const request = this.queue.find(r => r.id === requestId);
    if (!request) return null;

    const position = this.queue.indexOf(request);
    return {
      id: request.id,
      status: request.status || 'waiting',
      position: position,
      enqueuedAt: request.enqueuedAt
    };
  }

  // 큐 통계
  getStats() {
    return {
      name: this.name,
      queueLength: this.queue.length,
      waiting: this.queue.filter(r => r.status === 'waiting').length,
      processing: this.queue.filter(r => r.status === 'processing').length
    };
  }

  // 요청 ID 생성
  generateId() {
    return uuidv4();
  }
}

module.exports = BaseScheduler;
```

### 2. FCFSScheduler (First-Come, First-Served)

가장 단순한 스케줄러로, 먼저 온 요청을 먼저 처리합니다.

```javascript
// src/schedulers/FCFSScheduler.js
const BaseScheduler = require('./BaseScheduler');

class FCFSScheduler extends BaseScheduler {
  constructor() {
    super('FCFS');
  }

  // 요청을 큐 끝에 추가
  schedule(request) {
    const id = this.generateId();
    const job = {
      id,
      ...request,
      status: 'waiting',
      enqueuedAt: Date.now()
    };

    this.queue.push(job);
    return id;
  }

  // 큐 앞에서 요청 꺼내기
  getNext() {
    if (this.queue.length === 0) return null;

    const job = this.queue.shift();
    job.status = 'processing';
    job.startedAt = Date.now();
    return job;
  }
}

module.exports = FCFSScheduler;
```

### 3. PriorityScheduler (우선순위 스케줄링)

우선순위가 높은 요청을 먼저 처리하고, Aging으로 기아를 방지합니다.

```javascript
// src/schedulers/PriorityScheduler.js
const BaseScheduler = require('./BaseScheduler');

// 우선순위 레벨
const Priority = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  URGENT: 3
};

class PriorityScheduler extends BaseScheduler {
  constructor() {
    super('Priority');
    this.agingThreshold = 120000; // 2분
    this.agingInterval = null;
  }

  schedule(request) {
    const id = this.generateId();
    const job = {
      id,
      ...request,
      priority: request.priority || Priority.NORMAL,
      originalPriority: request.priority || Priority.NORMAL,
      status: 'waiting',
      enqueuedAt: Date.now()
    };

    this.queue.push(job);
    this._sortQueue();
    return id;
  }

  getNext() {
    if (this.queue.length === 0) return null;

    // Aging 적용
    this._applyAging();
    this._sortQueue();

    const job = this.queue.shift();
    job.status = 'processing';
    job.startedAt = Date.now();
    return job;
  }

  // 우선순위 순으로 정렬 (높은 우선순위가 앞)
  _sortQueue() {
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  // Aging: 오래 대기한 요청의 우선순위 상승
  _applyAging() {
    const now = Date.now();

    for (const job of this.queue) {
      const waitTime = now - job.enqueuedAt;

      // 2분 이상 대기하면 우선순위 1단계 상승 (최대 URGENT)
      if (waitTime > this.agingThreshold && job.priority < Priority.URGENT) {
        job.priority = Math.min(job.priority + 1, Priority.URGENT);
      }
    }
  }
}

module.exports = { PriorityScheduler, Priority };
```

### 4. MLFQScheduler (다단계 피드백 큐)

여러 우선순위 큐를 사용하고, 요청의 행동에 따라 큐 이동합니다.

```javascript
// src/schedulers/MLFQScheduler.js
const BaseScheduler = require('./BaseScheduler');

// 각 큐의 Time Quantum (밀리초)
const TIME_QUANTUMS = {
  0: 1000,   // Q0: 1초
  1: 3000,   // Q1: 3초
  2: 8000,   // Q2: 8초
  3: Infinity // Q3: 무제한
};

class MLFQScheduler extends BaseScheduler {
  constructor() {
    super('MLFQ');
    this.queues = [[], [], [], []]; // Q0, Q1, Q2, Q3
    this.boostInterval = 5000; // 5초마다 Boost
    this.lastBoost = Date.now();
  }

  schedule(request) {
    const id = this.generateId();
    const job = {
      id,
      ...request,
      queueLevel: 0, // 새 요청은 Q0에서 시작
      status: 'waiting',
      enqueuedAt: Date.now(),
      timeUsed: 0
    };

    this.queues[0].push(job);
    return id;
  }

  getNext() {
    // 주기적 Boost 확인
    this._checkBoost();

    // 높은 우선순위 큐부터 확인 (Q0 > Q1 > Q2 > Q3)
    for (let level = 0; level < 4; level++) {
      if (this.queues[level].length > 0) {
        const job = this.queues[level].shift();
        job.status = 'processing';
        job.startedAt = Date.now();
        job.currentQuantum = TIME_QUANTUMS[level];
        return job;
      }
    }

    return null;
  }

  // 요청 완료 후 호출 - 강등 또는 완료 처리
  complete(jobId, processingTime) {
    // 처리 시간이 Time Quantum을 초과하면 강등
    const job = this._findJob(jobId);
    if (!job) return;

    job.timeUsed += processingTime;

    if (processingTime > job.currentQuantum && job.queueLevel < 3) {
      // 하위 큐로 강등
      job.queueLevel += 1;
      job.status = 'waiting';
      this.queues[job.queueLevel].push(job);
    }
    // 완료된 요청은 큐에서 제거됨 (이미 shift로 제거됨)
  }

  // 모든 요청을 Q0로 이동 (Boost)
  _checkBoost() {
    const now = Date.now();
    if (now - this.lastBoost >= this.boostInterval) {
      this._boostAll();
      this.lastBoost = now;
    }
  }

  _boostAll() {
    for (let level = 1; level < 4; level++) {
      while (this.queues[level].length > 0) {
        const job = this.queues[level].shift();
        job.queueLevel = 0;
        this.queues[0].push(job);
      }
    }
  }

  _findJob(jobId) {
    for (const queue of this.queues) {
      const job = queue.find(j => j.id === jobId);
      if (job) return job;
    }
    return null;
  }

  getStats() {
    return {
      name: this.name,
      q0: this.queues[0].length,
      q1: this.queues[1].length,
      q2: this.queues[2].length,
      q3: this.queues[3].length,
      total: this.queues.reduce((sum, q) => sum + q.length, 0)
    };
  }
}

module.exports = MLFQScheduler;
```

### 5. WFQScheduler (가중치 기반 공정 큐)

테넌트별 가중치에 따라 공정하게 자원을 배분합니다.

```javascript
// src/schedulers/WFQScheduler.js
const BaseScheduler = require('./BaseScheduler');

// 테넌트 티어별 가중치
const TIER_WEIGHTS = {
  enterprise: 100,
  premium: 10,
  standard: 10,
  free: 1
};

class WFQScheduler extends BaseScheduler {
  constructor() {
    super('WFQ');
    this.tenants = new Map(); // tenantId -> { tier, lastFinishTime }
    this.virtualTime = 0;
  }

  // 테넌트 등록
  registerTenant(tenantId, tier = 'free') {
    this.tenants.set(tenantId, {
      tier,
      weight: TIER_WEIGHTS[tier] || 1,
      lastFinishTime: 0
    });
  }

  schedule(request) {
    const id = this.generateId();
    const tenantId = request.tenantId || 'default';

    // 테넌트가 없으면 자동 등록
    if (!this.tenants.has(tenantId)) {
      this.registerTenant(tenantId, request.tier || 'free');
    }

    const tenant = this.tenants.get(tenantId);
    const estimatedTime = request.estimatedTime || 1000; // 기본 1초

    // 가상 완료 시간 계산
    const virtualFinishTime = Math.max(this.virtualTime, tenant.lastFinishTime)
                              + (estimatedTime / tenant.weight);

    const job = {
      id,
      ...request,
      tenantId,
      weight: tenant.weight,
      virtualFinishTime,
      status: 'waiting',
      enqueuedAt: Date.now()
    };

    this.queue.push(job);
    return id;
  }

  getNext() {
    if (this.queue.length === 0) return null;

    // 가상 완료 시간이 가장 작은 요청 선택
    this.queue.sort((a, b) => a.virtualFinishTime - b.virtualFinishTime);

    const job = this.queue.shift();
    job.status = 'processing';
    job.startedAt = Date.now();

    // 가상 시간 업데이트
    this.virtualTime = job.virtualFinishTime;

    // 테넌트의 마지막 완료 시간 업데이트
    const tenant = this.tenants.get(job.tenantId);
    if (tenant) {
      tenant.lastFinishTime = job.virtualFinishTime;
    }

    return job;
  }

  // 공정성 지표 계산 (Jain's Fairness Index)
  calculateFairness() {
    if (this.tenants.size === 0) return 1;

    const shares = [];
    for (const [, tenant] of this.tenants) {
      shares.push(tenant.weight);
    }

    const sum = shares.reduce((a, b) => a + b, 0);
    const sumSquares = shares.reduce((a, b) => a + b * b, 0);
    const n = shares.length;

    // JFI = (sum)^2 / (n * sum of squares)
    return (sum * sum) / (n * sumSquares);
  }

  getStats() {
    return {
      name: this.name,
      queueLength: this.queue.length,
      virtualTime: this.virtualTime,
      tenantCount: this.tenants.size,
      fairnessIndex: this.calculateFairness().toFixed(3)
    };
  }
}

module.exports = { WFQScheduler, TIER_WEIGHTS };
```

---

## API 엔드포인트

### POST /api/requests
새 LLM 요청 등록

```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, world!", "priority": 2}'
```

### GET /api/requests/:id
요청 상태 조회

```bash
curl http://localhost:3000/api/requests/abc123
```

### GET /api/stats
스케줄러 통계 조회

```bash
curl http://localhost:3000/api/stats
```

### POST /api/scheduler/switch
스케줄러 변경

```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -d '{"scheduler": "mlfq"}'
```

---

## 테스트 실행

```bash
# 전체 테스트
npm test

# 특정 스케줄러 테스트
npm test -- fcfs.test.js

# 커버리지 리포트
npm test -- --coverage
```

---

## 관련 문서

- 계획 단계: ../01-plan/plan.md
- 보고서 단계: ../03-report/README.md

---

**문서 버전**: 2.0.0 (단순화)
**최종 업데이트**: 2026-02-03
