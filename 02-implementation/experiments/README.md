# MLFQ 실험 가이드

## MLFQ (Multi-Level Feedback Queue) 재실험 (2026-02-07)

### 변경 사항

**Boosting Interval 단축**: 30초 → 5초

이 변경은 재실험을 통해 MLFQ의 적응형 특성을 더 잘 관찰하기 위해 수행되었습니다.

```javascript
// src-simple/schedulers/MLFQScheduler.js (Line 22)
const BOOST_INTERVAL_MS = 5000;  // 5초마다 boosting (재실험을 위해 단축, 기존 30초)
```

### MLFQ 동작 원리

MLFQ는 4개의 우선순위 큐(Q0, Q1, Q2, Q3)를 사용하여 작업을 관리합니다:

| 큐 레벨 | 시간 할당량 | 용도 |
|---------|-------------|------|
| Q0 | 1초 | 대화형 작업 (최고 우선순위) |
| Q1 | 3초 | 일반 작업 |
| Q2 | 8초 | 긴 작업 |
| Q3 | 무제한 | 배치 작업 (최저 우선순위) |

### MLFQ 5가지 규칙

1. **우선순위 규칙**: Priority(A) > Priority(B) → A 먼저 실행
2. **동일 우선순위**: Priority(A) = Priority(B) → FCFS
3. **새 작업 배치**: 새 작업은 항상 최상위 큐(Q0)에 배치
4. **시간 할당량 소진**: 시간 할당량 초과 시 하위 큐로 이동
5. **주기적 Boosting**: 주기적으로 모든 작업을 Q0로 이동 (기아 방지)

### 현재 실험 환경에서의 MLFQ 동작

#### 1. 일반 LLM 요청 (10-100ms 처리 시간)

```
요청 → Q0 (1초 할당량) → 10-100ms 내 완료 → 큐 이동 없음
```

**결과**: 모든 요청이 Q0에서 완료되므로 FCFS와 동일한 성능을 보입니다.

#### 2. 긴 LLM 요청 (>1초 처리 시간)

```
요청 → Q0 (1초 할당량) → 할당량 초과 → Q1로 이동
      → Q1 (3초 할당량) → 완료 또는 Q2로 이동
```

**결과**: 긴 작업이 하위 큐로 이동하며, 짧은 작업이 우선 처리됩니다.

#### 3. Boosting 동작 (5초마다)

```
5초 경과 → 모든 대기 작업을 Q0로 이동 → 기아 방지
```

**결과**: 하위 큐에 있는 작업들이 주기적으로 Q0로 승격됩니다.

### 실험 시나리오

#### 시나리오 1: 단순 부하 (현재 실험)

- **요청**: 100개, 각 10-100ms 처리 시간
- **결과**: 모든 요청이 Q0에서 완료
- **MLFQ vs FCFS**: 동일한 성능

#### 시나리오 2: 혼합 작업 (권장)

- **짧은 요청**: 70개 (10-100ms)
- **긴 요청**: 30개 (>1000ms)
- **예상 결과**: MLFQ가 짧은 요청을 우선 처리하여 평균 대기 시간 개선

#### 시나리오 3: 장기 실행 (Boosting 검증)

- **실험 시간**: >10초
- **결과**: 5초마다 Boosting 발생, 모든 작업이 Q0로 재배치됨

### RQ2 재실험 방법

#### 목표

"MLFQ가 다양한 부하 패턴에 대해 FCFS보다 적응형 성능을 보이는가?"

#### 실험 설정

```javascript
// 1. MLFQ 스케줄러 생성 (Boosting 5초)
const mlfq = new MLFQScheduler();
mlfq.startBoosting();

// 2. 짧은 요청과 긴 요청 혼합
const requests = [
  // 짧은 요청 (70%)
  ...Array.from({length: 70}, () => ({ processingTime: 50 + Math.random() * 50 })),
  // 긴 요청 (30%) - 1.5초 이상으로 Q0 할당량 초과
  ...Array.from({length: 30}, () => ({ processingTime: 1500 + Math.random() * 1000 }))
];

// 3. 실험 실행 (10초 이상)
const results = await runExperiment(mlfq, requests, 15000);

// 4. 결과 비교
console.log('MLFQ 평균 대기 시간:', results.avgWaitTime);
console.log('FCFS 평균 대기 시간:', fcfsResults.avgWaitTime);
```

#### 기대 결과

- **짧은 요청**: MLFQ에서 더 낮은 대기 시간 (긴 요청이 하위 큐로 이동)
- **긴 요청**: MLFQ에서 더 높은 대기 시간 (하위 큐에서 대기)
- **전체 처리량**: 유사하거나 MLFQ가 더 우수

### 한계점

현재 구현에서는 LLM 처리 시간을 시뮬레이션하고 있어 실제 환경과 다를 수 있습니다. 실제 LLM API 환경에서는:
- 네트워크 지연
- LLM 추론 시간의 변동성
- 동시 요청 처리
등 요인이 MLFQ 성능에 영향을 미칠 수 있습니다.

### 참고 자료

- Arpaci-Dusseau, R. H., & Arpaci-Dusseau, A. C. (2018). *Operating Systems: Three Easy Pieces*. MLFQ Rules 참조
- OSTEP Chapter: Scheduling: Multi-Level Feedback Queue

---

**작성일**: 2026-02-07
**작성자**: 서민지 (C235180)
