# 고급 시나리오 예제 (Advanced Scenarios)

이 디렉토리에는 LLM Scheduler의 고급 기능과 시나리오를 다루는 예제가 포함되어 있습니다.

## 예제 목록

### 01-mlfq-boosting.ts
**MLFQ Boosting 메커니즘**

MLFQ 스케줄러의 Boosting 기능이 기아 현상을 어떻게 방지하는지 시뮬레이션합니다.

**핵심 개념:**
- 4단계 큐 구조 (Q0, Q1, Q2, Q3)
- 타임 퀀텀 (1초, 3초, 8초, 무제한)
- 우선순위 강등 메커니즘
- 60초마다 Boosting (모든 작업을 Q0로)

```bash
npx ts-node 01-mlfq-boosting.ts
```

### 02-wfq-fairness.ts
**WFQ 공정성 분석**

WFQ 스케줄러가 멀티테넌트 환경에서 가중치 기반 공정 분배를 어떻게 달성하는지 분석합니다.

**핵심 개념:**
- Virtual Time 계산
- Jain's Fairness Index
- 테넌트 가중치 (Enterprise: 100, Premium: 50, Standard: 10, Free: 1)
- GPS (Generalized Processor Sharing) 근사

```bash
npx ts-node 02-wfq-fairness.ts
```

## 학습 포인트

### MLFQ의 5가지 규칙
1. **Rule 1:** Priority(A) > Priority(B) → A 먼저 실행
2. **Rule 2:** 같은 우선순위 → Round-Robin
3. **Rule 3:** 새 작업 → 최고 우선순위(Q0)에서 시작
4. **Rule 4:** 타임슬라이스 소진 → 우선순위 강등
5. **Rule 5:** 주기적 Boost → 모든 작업을 Q0로

### WFQ Virtual Time 공식
```
Virtual Finish Time = Virtual Start Time + (Service Time / Weight)
```

- 낮은 VFT = 높은 우선순위 (먼저 처리)
- 가중치가 높을수록 VFT가 낮아짐

### Jain's Fairness Index
```
J = (Σxi)² / (n × Σxi²)
```

- J = 1.0: 완벽한 공정성
- J ≥ 0.95: 매우 높은 공정성 (목표)
- J = 1/n: 최악의 공정성 (한 명이 독점)
