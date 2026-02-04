# 프로젝트 개요: Provider 관점

> 멀티테넌트 LLM 게이트웨이에서 OS 스케줄링 알고리즘을 활용한 공정한 자원 분배

---

## 핵심 질문

**"여러 테넌트가 LLM 게이트웨이를 공유할 때, 어떻게 공정하게 자원을 분배할 것인가?"**

---

## 1. 문제 정의: 멀티테넌트 LLM 게이트웨이의 공정성 문제

### 1.1 시나리오

```
┌─────────────────────────────────────────────────────────────────┐
│                  멀티테넌트 LLM 게이트웨이                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  테넌트 A (Enterprise)  ─────┐                                  │
│  - 대량 분석 100건           │    ┌─────────────────────────┐   │
│  - 가중치: 100              │    │                         │   │
│                             ├──▶ │      LLM API Pool       │   │
│  테넌트 B (Premium)    ─────┤    │  (제한된 동시 처리량)   │   │
│  - 실시간 고객 응대 10건     │    │                         │   │
│  - 가중치: 50               │    └─────────────────────────┘   │
│                             │                                   │
│  테넌트 C (Free)       ─────┘                                   │
│  - 개인 학습 5건                                                │
│  - 가중치: 1                                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 발생하는 4가지 핵심 문제

| 문제 | 설명 | 영향 |
|------|------|------|
| **자원 독점** | Enterprise가 100건 요청으로 자원 독점 | Premium/Free 서비스 품질 저하 |
| **기아 현상** | Free 테넌트가 무기한 대기 | SLA 위반, 테넌트 이탈 |
| **차등 서비스 부재** | 모든 요청을 동등하게 처리 | 비즈니스 모델 지원 불가 |
| **공정성 측정 불가** | 정량적 측정 방법 부재 | 서비스 품질 보장 입증 불가 |

### 1.3 기존 방식의 한계

**FCFS (선착순):**
- Enterprise가 먼저 도착하면 100건 모두 처리될 때까지 대기
- Free 테넌트는 100건 × 평균 처리 시간만큼 대기

**단순 Rate Limiting:**
- 테넌트별 요청 수 제한만 적용
- 공정성 보장 안 됨
- 빈 슬롯 낭비

---

## 2. 해결 방안: OS 스케줄링 알고리즘 적용

### 2.1 핵심 아이디어

운영체제의 CPU 스케줄링과 LLM 요청 관리의 본질적 유사성:

| OS 개념 | LLM 시스템 적용 |
|---------|----------------|
| 프로세스 | LLM API 요청 |
| CPU 시간 | API 호출 권한 |
| 우선순위 | 테넌트 등급 |
| 스케줄러 | 요청 처리 순서 결정 |

### 2.2 WFQ (Weighted Fair Queuing) 선택 이유

**GPS (Generalized Processor Sharing)의 이상적 특성:**
- 모든 플로우에 가중치 비례 대역폭 할당
- 완벽한 공정성 보장

**현실적 구현 → WFQ:**
- GPS를 패킷 단위로 근사
- Virtual Time 개념으로 공정성 계산
- 실시간 시스템에서 구현 가능

### 2.3 테넌트 등급별 가중치 설계

| 등급 | 가중치 | 비율 | 설계 근거 |
|------|--------|------|----------|
| Enterprise | 10 | 55.6% | 대기업 고객, 최우선 처리 |
| Premium | 5 | 27.8% | 유료 구독자 |
| Standard | 2 | 11.1% | 기본 유료 사용자 |
| Free | 1 | 5.5% | 무료 사용자, 최소 서비스 보장 |

---

## 3. 핵심 구현

### 3.1 WFQ 스케줄러 핵심 로직

```javascript
// WFQ의 핵심: Virtual Time 기반 공정 분배
class WFQScheduler extends BaseScheduler {
  constructor() {
    super('WFQ');
    this.globalVirtualTime = 0;
    this.tenants = {};
  }

  // Virtual Finish Time 계산
  calculateVFT(request) {
    const weight = this.tenants[request.tenantId]?.weight || 1;
    const serviceTime = this.estimateServiceTime(request);
    // 가중치가 클수록 작은 증가량
    return this.globalVirtualTime + (serviceTime / weight);
  }

  // 가장 작은 Virtual Finish Time을 가진 요청 선택
  dequeue() {
    if (this.isEmpty()) return null;
    let minIdx = 0;
    for (let i = 1; i < this.queue.length; i++) {
      if (this.queue[i].virtualFinishTime < this.queue[minIdx].virtualFinishTime) {
        minIdx = i;
      }
    }
    return this.queue.splice(minIdx, 1)[0];
  }
}
```

### 3.2 공정성 측정: Jain's Fairness Index

```javascript
// Jain's Fairness Index 계산
// J = (Σxi)² / (n × Σxi²)
// 범위: 1/n ~ 1.0 (1.0 = 완벽한 공정)

function calculateJainsIndex(tenantShares) {
  const shares = Object.values(tenantShares);
  const n = shares.length;
  if (n === 0) return 1;

  const sum = shares.reduce((a, b) => a + b, 0);
  const sumSquared = shares.reduce((a, b) => a + b * b, 0);

  return (sum * sum) / (n * sumSquared);
}
```

---

## 4. 실험 결과

### 4.1 공정성 지표 달성

| 지표 | 목표 | 달성 | 비고 |
|------|------|------|------|
| Jain's Fairness Index | 0.90+ | 0.92-0.98 | 목표 초과 달성 |
| 기아 발생 | 0건 | 0건 | 완전 방지 |
| 테스트 커버리지 (Statements) | 85%+ | 98.65% | 목표 초과 |

### 4.2 멀티테넌트 시나리오 결과

```
시나리오: Enterprise 100건, Premium 10건, Free 5건 동시 제출

FCFS (기존):
- Enterprise: 100건 처리 후 Premium/Free 처리
- Free 대기 시간: 평균 45초 (SLA 위반)

WFQ (본 시스템):
- 가중치 비례 인터리빙 처리
- Free 대기 시간: 평균 8초 (SLA 준수)
- Jain's Fairness Index: 0.94
```

---

## 5. 학술적/실무적 기여

### 5.1 학술적 기여

1. **OS 이론의 LLM 시스템 적용**
   - CPU 스케줄링 → LLM API 스케줄링
   - 기존 연구 없는 새로운 응용 분야

2. **정량적 공정성 분석**
   - Jain's Fairness Index 기반 측정
   - 재현 가능한 실험 설계

3. **오픈소스 기여**
   - MIT 라이선스 공개
   - 67개 테스트로 품질 검증

### 5.2 실무적 가치

1. **SaaS 멀티테넌트 서비스 적용 가능**
   - 즉시 통합 가능한 REST API
   - 런타임 알고리즘 교체 지원

2. **클라우드 환경 확장성**
   - 메모리 기반 분산 큐
   - 수평 확장 가능 설계

---

## 6. 핵심 용어 정리

| 용어 | 정의 |
|------|------|
| **멀티테넌트** | 여러 고객(테넌트)이 동일 인프라를 공유하는 아키텍처 |
| **GPS** | Generalized Processor Sharing, 이상적 공정 분배 모델 |
| **WFQ** | Weighted Fair Queuing, GPS의 실용적 근사 구현 |
| **Virtual Time** | 가중치를 반영한 가상 시간, 공정 분배 계산에 사용 |
| **Jain's Fairness Index** | 자원 분배 공정성의 정량적 측정 지표 (0~1) |
| **기아 현상** | 낮은 우선순위 요청이 무기한 대기하는 현상 |
| **Aging** | 대기 시간에 따라 우선순위를 점진적으로 높이는 메커니즘 |

---

**작성일:** 2026-02-03
**버전:** 1.0.0
**관련 문서:** 결과보고서, 발표자료, 데모 가이드
