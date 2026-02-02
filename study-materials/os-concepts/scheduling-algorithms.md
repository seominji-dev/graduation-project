# OS 스케줄링 알고리즘 정리

## 이 프로젝트에서 구현한 4가지 알고리즘

### 1. FCFS (First-Come, First-Served)

**개념:** 먼저 도착한 프로세스를 먼저 처리

**장점:**
- 구현이 단순함
- 공정성 (도착 순서대로)

**단점:**
- Convoy Effect (긴 작업이 짧은 작업을 막음)
- 평균 대기 시간이 길어질 수 있음

**LLM 적용:**
```
요청 큐: [요청1, 요청2, 요청3]
처리 순서: 요청1 -> 요청2 -> 요청3 (도착 순서)
```

---

### 2. Priority Scheduling

**개념:** 우선순위가 높은 프로세스를 먼저 처리

**장점:**
- 중요한 작업 우선 처리
- 유연한 정책 적용 가능

**단점:**
- Starvation (낮은 우선순위 작업이 무한 대기)
- 해결책: Aging (대기 시간에 따라 우선순위 증가)

**LLM 적용:**
```
요청 큐: [일반요청(P=1), 긴급요청(P=10), VIP요청(P=5)]
처리 순서: 긴급요청 -> VIP요청 -> 일반요청 (우선순위 순)
```

---

### 3. MLFQ (Multi-Level Feedback Queue)

**개념:** 여러 큐를 사용하여 작업 특성에 따라 동적으로 우선순위 조정

**동작 원리:**
1. 새 작업은 최상위 큐에서 시작
2. CPU를 많이 사용하면 하위 큐로 이동
3. 오래 대기하면 상위 큐로 승격 (Aging)

**장점:**
- 짧은 작업에 빠른 응답
- 긴 작업도 결국 처리됨
- 작업 특성을 학습

**LLM 적용:**
```
Queue 0 (최고 우선순위): 짧은 요청 (예: 간단한 질문)
Queue 1 (중간 우선순위): 중간 요청 (예: 코드 생성)
Queue 2 (낮은 우선순위): 긴 요청 (예: 문서 분석)
```

---

### 4. WFQ (Weighted Fair Queuing)

**개념:** 각 사용자/테넌트에게 가중치에 따라 공정하게 자원 분배

**핵심 개념:**
- Virtual Time: 실제 시간이 아닌 가상의 시간 개념
- 가중치가 높을수록 더 많은 자원 할당

**장점:**
- 멀티테넌트 환경에서 공정한 분배
- 가중치로 SLA 보장 가능

**LLM 적용:**
```
테넌트 A (가중치 3): 60% 자원
테넌트 B (가중치 2): 40% 자원
-> 전체 5, A가 3/5, B가 2/5
```

---

## 알고리즘 비교표

| 알고리즘 | 시간복잡도 | 공정성 | 응답시간 | 적합한 상황 |
|---------|----------|--------|---------|------------|
| FCFS | O(1) | 높음 | 보통 | 단순한 시스템 |
| Priority | O(n) | 낮음 | 가변적 | 중요도 구분 필요 |
| MLFQ | O(1) | 보통 | 좋음 | 다양한 작업 혼합 |
| WFQ | O(log n) | 매우 높음 | 보통 | 멀티테넌트 |

## 면접 대비 핵심 질문

**Q: FCFS의 Convoy Effect란?**
A: 긴 작업이 먼저 도착하면 뒤의 짧은 작업들이 오래 기다려야 하는 현상

**Q: MLFQ에서 Aging이 필요한 이유는?**
A: 하위 큐에 있는 작업이 영원히 실행되지 않는 Starvation을 방지

**Q: WFQ의 Virtual Time 개념은?**
A: 실제 시간과 독립적으로, 각 큐의 가중치를 고려한 공정한 시간 진행을 계산

---

## 심화 개념

### Convoy Effect 상세 분석

**정의**: 긴 CPU-burst 프로세스가 먼저 실행되어 짧은 프로세스들이 불필요하게 대기하는 현상

**예시**:
```
시간: 0 ----1----2----3----4----5----6----7----8----9----10
P1:   [####################] (10초 작업)
P2:                        [##] (2초 작업, 8초 대기)
P3:                            [##] (2초 작업, 10초 대기)

평균 대기 시간: (0 + 8 + 10) / 3 = 6초
```

**LLM 적용에서의 Convoy Effect**:
- 대용량 문서 분석 요청이 먼저 도착
- 간단한 채팅 질문들이 뒤에서 대기
- 사용자 경험 저하

**해결책**: Priority, MLFQ 스케줄링 적용

---

### Starvation (기아 현상) 상세 분석

**정의**: 낮은 우선순위 프로세스가 무한히 대기하는 현상

**발생 조건**:
- Priority 스케줄링에서 높은 우선순위 작업이 계속 도착
- 낮은 우선순위 작업은 영원히 실행 기회를 얻지 못함

**해결책 - Aging**:
```
초기 Priority = LOW (0)
├─ 대기 30초 → Priority = NORMAL (1)
├─ 대기 60초 → Priority = HIGH (2)
└─ 대기 90초 → Priority = URGENT (3)
```

**프로젝트 적용**: AgingManager 컴포넌트에서 10초마다 대기 시간 확인

---

### MLFQ의 5가지 규칙 (OSTEP)

OSTEP(Operating Systems: Three Easy Pieces)에서 정의한 MLFQ 규칙:

| 규칙 | 설명 | 목적 |
|------|------|------|
| **Rule 1** | Priority(A) > Priority(B)이면 A 실행 | 높은 우선순위 우선 |
| **Rule 2** | Priority(A) = Priority(B)이면 Round-Robin | 동일 우선순위 공정성 |
| **Rule 3** | 새 작업 -> 최고 우선순위 큐(Q0) 배치 | 짧은 작업에 빠른 응답 |
| **Rule 4** | 타임 슬라이스 초과 -> 우선순위 강등 | CPU-bound 작업 식별 |
| **Rule 5** | 주기적 Boosting (모든 작업 -> Q0) | 기아 방지 |

**Rule 4 상세**:
- 각 큐마다 다른 타임 퀀텀 할당
- Q0: 1초, Q1: 3초, Q2: 8초, Q3: 무제한
- 타임 퀀텀 초과 시 다음 레벨로 강등

**Rule 5 상세**:
- 60초마다 모든 작업을 Q0로 이동
- 장기 대기 작업에게 다시 기회 부여
- Starvation 완전 방지

---

### WFQ와 GPS (Generalized Processor Sharing)

**GPS 이상적 모델**:
- 모든 활성 프로세스가 동시에 CPU 시간을 받음
- 가중치에 비례하여 자원 분배
- 현실에서는 구현 불가능 (CPU는 한 번에 하나의 작업만 실행)

**WFQ는 GPS의 근사 구현**:
- Virtual Time 개념으로 공정성 추적
- Virtual Finish Time이 가장 작은 작업 먼저 실행
- 실제로는 순차 실행이지만, 장기적으로 GPS와 동일한 자원 분배

**Virtual Time 계산**:
```
Virtual Finish Time = Virtual Start Time + (Service Time / Weight)
```

**예시**:
```
테넌트 A (가중치 100): VFT = 0 + (100ms / 100) = 1
테넌트 B (가중치 1):   VFT = 0 + (100ms / 1) = 100

-> A가 먼저 실행 (VFT가 더 작음)
```

---

### Jain's Fairness Index

**정의**: 시스템의 공정성을 0과 1 사이의 값으로 측정

**수식**:
```
J = (Sum of xi)^2 / (n * Sum of xi^2)

여기서:
- xi: 각 사용자가 받은 자원량
- n: 사용자 수
```

**해석**:
- J = 1.0: 완벽한 공정성 (모든 사용자가 동일한 자원)
- J = 1/n: 최악의 불공정성 (한 사용자만 모든 자원)

**프로젝트 결과**:
- 개별 테넌트 수준: 0.92-0.98 (매우 높은 공정성)
- 전체 시스템 수준: 0.89 (티어 간 가중치 차이 반영)

---

### 선점형 vs 비선점형 스케줄링

| 구분 | 선점형 (Preemptive) | 비선점형 (Non-Preemptive) |
|------|---------------------|--------------------------|
| 정의 | 실행 중인 프로세스 중단 가능 | 완료까지 실행 보장 |
| 응답 시간 | 짧음 | 김 |
| 오버헤드 | 큼 (컨텍스트 스위칭) | 작음 |
| 예시 | Priority, MLFQ | FCFS |

**프로젝트 적용**:
- FCFS: 비선점형 (요청 완료까지 대기)
- Priority: 비선점형 (큐 내 우선순위만 적용)
- MLFQ: 준선점형 (타임 슬라이스 초과 시 강등)
- WFQ: 비선점형 (Virtual Time 기반 순서 결정)

---

## 교과서 연결

### Silberschatz "Operating System Concepts"
- Chapter 5: CPU Scheduling
- FCFS, SJF, Priority, Round-Robin 알고리즘 설명
- 평가 기준: CPU 활용률, 처리량, 대기 시간, 응답 시간

### OSTEP "Operating Systems: Three Easy Pieces"
- Chapter 8: Multi-Level Feedback Queue
- MLFQ의 5가지 규칙 상세 설명
- 역사적 배경과 설계 철학

### Tanenbaum "Modern Operating Systems"
- Chapter 2: Processes and Threads
- WFQ와 네트워크 스케줄링
- 공정성 개념과 측정 방법

---

## 프로젝트 성능 데이터 요약

| 알고리즘 | 평균 대기시간 | 처리량 | P95 지연 | 공정성 |
|---------|-------------|--------|---------|-------|
| FCFS | 48.25ms | 6.3 RPS | 185.3ms | 기준 |
| Priority | 32.18ms (33%) | 6.2 RPS | 175.8ms | 낮음 |
| MLFQ | 28.45ms (41%) | 6.4 RPS | 168.2ms | 높음 |
| WFQ | 52.30ms | 6.1 RPS | 192.5ms | 0.89 |

**핵심 인사이트**:
1. **MLFQ**: 최고의 대기시간(28.45ms)과 처리량(6.4 RPS)
2. **Priority**: URGENT 요청 74.1% 대기시간 개선
3. **WFQ**: 개별 테넌트 0.92-0.98 공정성 달성

---

## 참고 자료
- Operating System Concepts (Silberschatz, Galvin, Gagne)
- Modern Operating Systems (Tanenbaum, Bos)
- Operating Systems: Three Easy Pieces (Arpaci-Dusseau) - OSTEP
- Computer Networks (Kurose, Ross) - WFQ, GPS 개념

---

**최종 업데이트**: 2026-02-01
**버전**: 2.0.0 (심화 개념, 교과서 연결, 성능 데이터 추가)
