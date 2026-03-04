# OS 스케줄링 알고리즘을 활용한 다중 사용자 LLM API 요청 관리 시스템

## Multi-User LLM API Request Management System Using OS Scheduling Algorithms

---

**학과:** 홍익대학교 컴퓨터공학과  
**학번:** C235180  
**성명:** 서민지  
**지도교수:** [지도교수명]  
**제출일:** 2026년 3월

---

## 1. 서론

### 1.1 연구 배경

ChatGPT, Claude, Gemini 등 대규모 언어 모델(Large Language Model, LLM) API 서비스가 빠르게 확산되면서, 여러 사용자가 동시에 LLM API를 호출하는 환경이 보편화되고 있다. 이러한 환경에서 요청 처리 순서는 서비스 품질에 직접적인 영향을 미치는 핵심 요소이다.

현재 대부분의 LLM 서비스는 선착순(First-Come, First-Served, FCFS) 처리 방식이나 단순 Rate Limiting에 의존하고 있다. 이러한 방식은 다음과 같은 한계를 가진다. 첫째, 긴 요청이 뒤따르는 짧은 요청들의 처리를 지연시키는 호위 효과(Convoy Effect)가 발생한다. 둘째, 긴급한 요청도 도착 순서를 기다려야 하며, 사용자 등급에 따른 차등 서비스 제공이 불가능하다. 셋째, 공정성을 정량적으로 측정하고 보장하는 메커니즘이 부재하다.

### 1.2 연구 동기와 목적

3학년 운영체제 수업에서 학습한 프로세스 스케줄링 알고리즘(FCFS, Priority Scheduling, MLFQ, WFQ 등)은 CPU 자원을 프로세스에 효율적으로 배분하기 위해 수십 년간 연구되어 온 이론이다. 본 연구는 이 검증된 이론을 LLM API 요청 관리라는 새로운 도메인에 적용함으로써, OS 이론의 실제 응용 가능성을 탐구하고자 한다.

구체적인 연구 목적은 다음과 같다.

1. **5가지 스케줄링 알고리즘 구현**: FCFS(베이스라인), Priority Scheduling(긴급 요청 우선), MLFQ(적응형 스케줄링), WFQ(공정 배분), Rate Limiter(속도 제한)
2. **알고리즘별 성능 비교 분석**: 대기시간, 처리량, 공정성 지표의 정량적 비교
3. **공정성 정량화**: Jain's Fairness Index(JFI)를 활용한 멀티테넌트 환경의 공정성 측정 방법론 제시

---

## 2. 관련 연구

### 2.1 OS 스케줄링 알고리즘

프로세스 스케줄링은 운영체제의 핵심 기능 중 하나로, CPU 자원을 여러 프로세스에 효율적으로 배분하기 위한 다양한 알고리즘이 연구되어 왔다 [1].

**FCFS (First-Come, First-Served)**는 가장 단순한 스케줄링 알고리즘으로, 요청 도착 순서대로 처리한다. 구현이 간단하나 긴 작업이 짧은 작업을 지연시키는 호위 효과(Convoy Effect)가 발생한다는 단점이 있다.

**Priority Scheduling**은 각 프로세스에 우선순위를 부여하여 높은 우선순위의 프로세스를 먼저 처리한다. 그러나 낮은 우선순위의 프로세스가 무기한 대기하는 기아(Starvation) 현상이 발생할 수 있으며, 이를 해결하기 위해 Aging(노화) 기법이 사용된다 [1].

**MLFQ (Multi-Level Feedback Queue)**는 Corbato et al.이 CTSS(Compatible Time-Sharing System)에서 최초로 제안한 알고리즘으로 [2], 작업의 실행 특성을 관찰하여 우선순위를 동적으로 조정한다. 짧은 작업은 높은 우선순위 큐에서 빠르게 처리되고, 긴 작업은 점차 하위 큐로 이동한다. Arpaci-Dusseau & Arpaci-Dusseau는 MLFQ의 5가지 핵심 규칙을 정리하며, 현대 운영체제에서 가장 널리 사용되는 스케줄링 알고리즘임을 설명하였다 [3].

**WFQ (Weighted Fair Queuing)**는 Demers, Keshav, & Shenker가 제안한 공정 큐잉 알고리즘으로 [4], GPS(Generalized Processor Sharing) 이론을 기반으로 한다. 각 흐름(flow)에 가중치를 부여하여 가중치에 비례하는 서비스를 제공하며, Virtual Finish Time 개념을 사용하여 스케줄링 순서를 결정한다.

### 2.2 LLM 서빙 최적화 연구

LLM API 서빙 분야에서는 추론 성능 최적화를 위한 다양한 연구가 진행되어 왔다.

Kwon et al.은 vLLM을 통해 PagedAttention 기법을 제안하여 LLM 서빙 시 KV 캐시 메모리를 효율적으로 관리하는 방법을 제시하였다 [5]. Yu et al.은 ORCA 시스템에서 iteration-level 스케줄링을 통해 LLM 추론의 처리량을 향상시켰다 [6]. Agrawal et al.은 Sarathi-Serve에서 chunked prefill 기법으로 prefill과 decode 단계를 효율적으로 분리하여 서빙 성능을 개선하였다 [7].

그러나 이들 연구는 주로 GPU 메모리 관리와 배치 처리 최적화에 집중하고 있으며, 다중 사용자 환경에서의 **요청 스케줄링**과 **테넌트 간 공정성** 문제는 상대적으로 다루어지지 않았다. 본 연구는 이 간극을 메우기 위해 OS 스케줄링 이론을 LLM 요청 관리에 적용한다.

### 2.3 공정성 측정

Jain, Chiu, & Hawe는 공유 컴퓨터 시스템에서 자원 배분의 공정성을 정량적으로 측정하기 위한 **Jain's Fairness Index(JFI)**를 제안하였다 [8]. JFI는 0(완전 불공정)부터 1(완전 공정) 사이의 값을 가지며, 다음과 같이 계산된다.

$$
JFI = \frac{\left(\sum_{i=1}^{n} x_i\right)^2}{n \cdot \sum_{i=1}^{n} x_i^2}
$$

여기서 $x_i$는 각 사용자가 받는 자원의 양, $n$은 사용자 수이다. 본 연구는 JFI를 멀티테넌트 LLM API 환경에 적용하여, 시스템 수준과 테넌트 수준의 이중 공정성 측정 방법론을 제시한다.

---

## 3. 제안 시스템

### 3.1 시스템 개요

본 연구에서 제안하는 시스템은 OS 스케줄링 알고리즘을 LLM API 요청 관리에 적용한 멀티테넌트 시스템이다. 아래 표 1은 OS 개념과 LLM 도메인 간의 대응 관계를 정리한 것이다.

**표 1. OS 개념과 LLM 도메인 대응 관계**

| OS 개념 | LLM 도메인 | 설명 |
|---------|-----------|------|
| 프로세스 (Process) | LLM API 요청 | 스케줄링 단위 |
| CPU 시간 (CPU Time) | API 호출 쿼터 | 할당 자원 |
| 우선순위 (Priority) | 테넌트 등급, 요청 긴급도 | 처리 순서 결정 기준 |
| 스케줄링 알고리즘 | 요청 처리 순서 결정 | 자원 배분 정책 |
| 선점 (Preemption) | 요청 중단 및 큐 이동 | 긴 요청 제어 |

### 3.2 시스템 아키텍처

시스템은 4계층 구조로 설계되었다(그림 1).

**그림 1. 시스템 아키텍처**

```
┌─────────────────────────────────────────────────────────┐
│                  클라이언트 계층                          │
│          REST API 클라이언트, 대시보드                    │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP 요청
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  API 계층 (Express.js)                   │
│   요청 관리 · 스케줄러 관리 · 통계/공정성 · 헬스 체크     │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              스케줄러 엔진 (런타임 교체 가능)              │
│  ┌──────┐ ┌────────┐ ┌──────┐ ┌─────┐ ┌────────────┐  │
│  │ FCFS │ │Priority│ │ MLFQ │ │ WFQ │ │Rate Limiter│  │
│  └──────┘ └────────┘ └──────┘ └─────┘ └────────────┘  │
│     기아 방지(Aging) · 부스팅(Boost) · 공정성 계산(JFI)  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  저장소 계층                              │
│     메모리 배열(큐) · JSON 파일(로그) · Ollama(LLM)      │
└─────────────────────────────────────────────────────────┘
```

### 3.3 스케줄링 알고리즘 설계

#### 3.3.1 FCFS (First-Come, First-Served)

선착순 처리 알고리즘으로, 요청의 도착 타임스탬프를 기준으로 처리 순서를 결정한다. 구현이 간단하며 다른 알고리즘의 성능 비교를 위한 **베이스라인**으로 사용한다.

#### 3.3.2 Priority Scheduling with Aging

4단계 우선순위(URGENT > HIGH > NORMAL > LOW)를 지원하며, Aging 메커니즘을 통해 기아 현상을 방지한다. 대기 시간이 임계값을 초과하면 요청의 우선순위가 자동으로 상승한다.

#### 3.3.3 MLFQ (Multi-Level Feedback Queue)

4단계 피드백 큐(Q0-Q3)를 구현하며, 큐별 타임 퀀텀을 차등 설정한다(Q0: 500ms, Q1: 1,500ms, Q2: 4,000ms, Q3: 무제한). 시간 슬라이스(500ms) 기반 **선점형(preemptive)** 모드를 지원하여, 타임 퀀텀을 초과한 요청은 하위 큐로 이동시킨다. 이를 통해 짧은 요청이 긴 요청에 의해 지연되는 것을 방지한다. 주기적 Boost 메커니즘으로 모든 요청을 Q0로 복귀시켜 기아를 방지한다.

#### 3.3.4 WFQ (Weighted Fair Queuing)

GPS 이론에 기반한 가중치 공정 큐잉 알고리즘으로, 테넌트 등급별 가중치(Enterprise: 100, Premium: 50, Standard: 10, Free: 1)에 비례하여 자원을 분배한다. Virtual Finish Time을 계산하여 스케줄링 순서를 결정하며, 이중 수준 JFI(시스템 수준, 테넌트 수준)로 공정성을 정량적으로 모니터링한다.

#### 3.3.5 Rate Limiter

토큰 버킷(Token Bucket) 알고리즘으로 테넌트별 요청 빈도를 제한한다. 버스트 용량을 제어하여 시스템 과부하를 방지한다.

### 3.4 핵심 기술 특징

**런타임 알고리즘 교체**: 서버 재시작 없이 REST API를 통해 스케줄링 알고리즘을 실시간으로 전환할 수 있다.

**이중 수준 공정성 측정**: WFQ 스케줄러에서 시스템 수준 JFI(전체 테넌트 간 공정성)와 테넌트 수준 JFI(개별 테넌트 내 요청 간 공정성)를 분리 측정하여, "의도된 불공정(가중치 기반 차등)"이 올바르게 동작하는지 모니터링한다.

**기아 방지**: Priority 스케줄러의 Aging 메커니즘과 MLFQ 스케줄러의 Boost 메커니즘을 통해 낮은 우선순위 요청의 무기한 대기를 방지한다.

---

## 4. 예비 실험 결과

25-2학기에 프로토타입을 구현하고 실험을 수행하여 다음과 같은 예비 결과를 확인하였다. 실험은 100건의 요청을 4개 테넌트에 분배하여 각 알고리즘의 성능을 측정하였다.

### 4.1 실험 환경

- **런타임**: Node.js 22 LTS, Express.js 4.18
- **테스트**: Jest 29.x (307개 테스트, 커버리지 99.76%)
- **LLM**: Ollama (로컬 실행)
- **의존성**: 2개 패키지 (express, jest)

### 4.2 주요 성과 요약

**표 2. 알고리즘별 성능 비교 (100건 요청 실험)**

| 스케줄러 | 평균 대기시간 | 핵심 발견 |
|---------|-------------|----------|
| FCFS | 2,572ms | 베이스라인, 도착 순서 처리 |
| Priority | 2,826ms | URGENT 요청: 1,122ms (FCFS 대비 62% 감소) |
| MLFQ | 2,572ms | 짧은 요청: 동시 경쟁 환경에서 81% 개선 |
| WFQ | 2,819ms | Enterprise: 849ms, Free: 4,894ms (5.8배 차이) |

**RQ1 (Priority Scheduling)**: URGENT 요청은 FCFS 대비 62% 빠르게 처리되었다(Cohen's d = 0.78, p < 0.001). Aging 메커니즘에 의해 기아 현상이 방지됨을 확인하였다.

**RQ2 (MLFQ)**: 시간 슬라이스 기반 선점형 모드에서, 짧은 요청과 긴 요청이 동시에 경쟁하는 환경에서 짧은 요청의 대기시간이 81.14% 개선되었다(p < 0.001).

**RQ3 (WFQ)**: Enterprise 테넌트(가중치 100)는 Free 테넌트(가중치 1) 대비 5.8배 빠른 응답을 받았으며(849ms vs 4,894ms), 테넌트 수준 JFI는 0.92-0.98로 높은 내부 공정성을 달성하였다.

---

## 5. 26-1학기 연구 계획

### 5.1 교과서 연계 관련연구 강화

25-2학기 예비 구현에서 확인된 결과를 바탕으로, 26-1학기에는 다음을 추가 수행한다.

1. **관련연구 확충**: LLM 서빙 시스템 최신 논문 조사 및 분석 (vLLM, ORCA, Sarathi-Serve 등)
2. **실험 설계 보강**: 대규모 실험(1,000건 이상), 다양한 워크로드 시나리오 추가
3. **공정성 분석 심화**: JFI 외 추가 공정성 지표(Max-Min Fairness 등) 검토
4. **최종 보고서 작성**: 학술 논문 수준의 최종 보고서 작성

### 5.2 일정

| 기간 | 활동 | 산출물 |
|------|------|--------|
| 3월 | 관련연구 조사, 제안서 작성 | 제안서 (본 문서) |
| 4월 | 시스템 설계 상세화, 실험 확대 | 중간보고서 |
| 5월 | 최종 실험, 보고서 작성 | 최종보고서, 소스코드, 발표 |

---

## 참고문헌

[1] A. Silberschatz, P. B. Galvin, and G. Gagne, *Operating System Concepts*, 10th ed. Wiley, 2018.

[2] F. J. Corbato, M. M. Daggett, and R. C. Daley, "An experimental time-sharing system," in *Proceedings of the AFIPS Spring Joint Computer Conference*, 1962, pp. 335-344.

[3] R. H. Arpaci-Dusseau and A. C. Arpaci-Dusseau, *Operating Systems: Three Easy Pieces*. Arpaci-Dusseau Books, 2018.

[4] A. Demers, S. Keshav, and S. Shenker, "Analysis and simulation of a fair queueing algorithm," in *ACM SIGCOMM '89 Proceedings*, 1989, pp. 1-12.

[5] W. Kwon, Z. Li, S. Zhuang, Y. Sheng, L. Zheng, C. H. Yu, J. Gonzalez, H. Zhang, and I. Stoica, "Efficient memory management for large language model serving with PagedAttention," in *Proceedings of the 29th Symposium on Operating Systems Principles (SOSP '23)*, 2023, pp. 611-626.

[6] G. I. Yu, J. S. Jeong, G. Kim, S. Kim, and B. Chun, "Orca: A distributed serving system for Transformer-Based generative models," in *Proceedings of the 16th USENIX Symposium on Operating Systems Design and Implementation (OSDI '22)*, 2022, pp. 521-538.

[7] A. Agrawal, A. Panwar, J. Mohan, N. Kwatra, B. S. Gulavani, and R. Ramjee, "Sarathi-Serve: CoDe Interleaving for Stall-free LLM Serving," *arXiv:2308.16369*, 2024.

[8] R. Jain, D. M. Chiu, and W. R. Hawe, "A quantitative measure of fairness and discrimination for resource allocation in shared computer systems," *DEC Research Report TR-301*, 1984.
