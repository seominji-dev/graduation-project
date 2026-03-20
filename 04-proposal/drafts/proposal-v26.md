# OS 스케줄링 알고리즘을 활용한 다중 사용자 LLM API 요청 관리 시스템

## Multi-User LLM API Request Management System Using OS Scheduling Algorithms

---

**학과:** 홍익대학교 컴퓨터공학과
**학번:** C235180
**성명:** 서민지
**지도교수:** 이장호 교수님
**제출일:** 2026년 3월

---

## 1. 서론

### 1.1 연구 배경

ChatGPT, Claude, Gemini 등 대규모 언어 모델(Large Language Model, LLM) API 서비스가 빠르게 확산되면서, 여러 사용자가 동시에 LLM API를 호출하는 다중 사용자(Multi-tenant) 환경이 보편화되고 있다. 다중 사용자 환경이란, 하나의 서버가 여러 고객(테넌트)의 요청을 동시에 처리하는 구조를 말한다.

현재 대부분의 LLM 서비스는 선착순(First-Come, First-Served, FCFS) 처리 방식이나 단순 속도 제한(Rate Limiting)에 의존하고 있다. 이러한 방식은 다음과 같은 한계를 가진다. 첫째, 긴급한 요청도 도착 순서를 기다려야 하므로 시간에 민감한 요청의 빠른 처리가 불가능하다. 둘째, 사용자 등급에 따른 차등 서비스를 제공할 수 없어, 높은 등급의 테넌트와 무료 사용자가 동일한 대기 조건을 갖게 된다. 셋째, 자원이 테넌트 간에 공정하게 배분되고 있는지 측정하거나 보장할 수단이 없다.

### 1.2 연구 동기와 목적

운영체제의 프로세스 스케줄링 알고리즘은 CPU 자원을 여러 프로세스에 효율적으로 배분하기 위해 수십 년간 연구되어 온 이론이다 [1][9]. 본 연구는 이 이론을 LLM API 요청 관리에 활용할 수 있는지 탐구하고자 한다.

구체적인 연구 목적은 다음과 같다.

1. **OS 스케줄링 알고리즘의 LLM 환경 적용**: 대표적인 OS 스케줄링 알고리즘들을 LLM API 환경에 맞게 적용하는 방안을 탐구하고자 한다.
2. **알고리즘 간 성능 비교**: 여러 스케줄링 알고리즘을 동일한 조건에서 대기시간, 처리량, 공정성 등의 기준으로 비교하고자 한다.
3. **공정성 측정 방법 탐구**: Jain's Fairness Index(JFI) 등의 공정성 지표를 활용하여 다중 사용자 환경에서 자원 배분의 공정성을 측정하는 방법을 탐구하고자 한다.

---

## 2. 관련 연구

### 2.1 OS 스케줄링 알고리즘

프로세스 스케줄링은 운영체제의 핵심 기능 중 하나로, CPU 자원을 여러 프로세스에 효율적으로 배분하기 위한 다양한 알고리즘이 연구되어 왔다 [1][9].

**FCFS(First-Come, First-Served)**는 가장 단순한 스케줄링 알고리즘으로, 요청이 도착한 순서대로 처리한다. 구현이 간단하나 호위 효과(Convoy Effect, 처리 시간이 긴 요청이 뒤따르는 짧은 요청들의 처리를 지연시키는 현상)가 발생하는 단점이 있다 [1][9].

**Priority Scheduling**은 각 프로세스에 우선순위를 부여하여 높은 우선순위의 프로세스를 먼저 처리한다. 그러나 낮은 우선순위의 프로세스가 계속 밀려 처리되지 못하는 기아(Starvation) 현상이 발생할 수 있다. 이를 해결하기 위해, 오래 기다린 프로세스의 우선순위를 점진적으로 높여주는 에이징(Aging) 기법이 사용된다 [1][9].

**MLFQ(Multi-Level Feedback Queue)**는 작업의 실행 특성을 관찰하여 우선순위를 동적으로 조정하는 알고리즘이다 [2][10]. 짧은 작업은 높은 우선순위 큐에서 빠르게 처리되고, 타임 퀀텀(Time Quantum, 한 번에 할당되는 최대 실행 시간)을 초과한 긴 작업은 점차 하위 큐로 이동한다. OS에서 MLFQ는 선점형(Preemptive, 실행 중인 작업을 중단할 수 있는 방식)으로 동작하여, 타임 퀀텀을 초과한 프로세스를 중단하고 하위 큐로 강등시킨다 [2][10].

**WFQ(Weighted Fair Queuing)**는 네트워크 분야에서 제안된 공정 큐잉 알고리즘이다 [3][11]. 각 흐름(flow)에 가중치를 부여하여 가중치에 비례하는 서비스를 제공한다. GPS(Generalized Processor Sharing)는 자원을 가중치에 비례하여 동시에 배분하는 이상적인 수학적 모델이며, WFQ는 이를 개별 요청(Discrete request) 단위의 현실 시스템에서 비슷하게 구현한 실용적인 스케줄링 기법이다.

> **[그림 1] 스케줄링 알고리즘 개념 비교** (별첨: proposal-figures.pptx, 슬라이드 1)

### 2.2 LLM 서빙 시스템과 스케줄링

LLM 서빙(LLM을 사용자에게 제공하는 것) 분야에서는 LLM 응답 속도를 높이기 위한 다양한 기술이 개발되어 왔다.

**vLLM**은 UC Berkeley에서 개발한 LLM 서빙 도구이다 [4]. 그러나 요청 스케줄링은 선착순에 한정되어 있으며, 테넌트 간 공정성 보장 기능은 제공하지 않는다.

**Hugging Face TGI**는 오픈소스 LLM 서빙 도구이다 [5]. 다중 사용자 환경에서의 요청 우선순위 관리나 공정성 보장 기능은 포함하지 않는다.

기존 LLM 서빙 시스템들은 주로 LLM의 응답 속도를 높이는 데 집중하고 있으며, 다중 사용자 환경에서의 **요청 스케줄링**과 **테넌트 간 공정성** 문제는 아직 많이 다루어지지 않았다. 본 연구는 이 문제를 다루기 위해 OS 스케줄링 이론을 LLM 요청 관리에 적용하고자 한다.

### 2.3 공정성 측정

Jain's Fairness Index(JFI)는 공유 자원 시스템에서 자원 배분의 공정성을 측정하기 위한 지표이다 [3]. JFI는 0(완전 불공정)부터 1(완전 공정) 사이의 값을 가지며, 1에 가까울수록 자원이 공평하게 배분된 것이다. 반대로, 특정 사용자가 자원을 받지 못하면 0에 가까워진다.

$$JFI = \frac{(\sum_{i=1}^{n} x_i)^2}{n \cdot \sum_{i=1}^{n} x_i^2}$$

여기서 $x_i$는 테넌트 $i$가 할당받은 자원량이며, $n$은 테넌트 수이다.

---

## 3. 제안 시스템

### 3.1 시스템 개요

본 연구에서 제안하는 시스템은 OS 스케줄링 알고리즘을 LLM API 요청 관리에 적용한 다중 사용자 요청 관리 시스템이다. 표 1은 OS 개념과 LLM 도메인 간의 대응 관계를 정리한 것이다.

**표 1. OS 개념과 LLM 도메인 대응 관계**

| OS 개념 | LLM 도메인 | 설명 |
|---------|-----------|------|
| 프로세스 (Process) | LLM API 요청 | 스케줄링의 기본 단위 |
| CPU 시간 (CPU Time) | LLM 추론 시간 | 할당되는 자원 |
| 우선순위 (Priority) | 테넌트 등급, 요청 긴급도 | 처리 순서 결정 기준 |
| 스케줄링 알고리즘 | 요청 처리 순서 결정 | 자원 배분 정책 |

시스템은 복수의 스케줄링 알고리즘을 구현하여, 동일한 요청 환경에서 각 알고리즘의 성능을 비교하는 것을 목표로 한다. FCFS를 기준(베이스라인) 알고리즘으로 삼고, Priority Scheduling, MLFQ, WFQ 등의 알고리즘을 적용하여 비교할 계획이다.

### 3.2 핵심 연구 과제

본 연구에서 탐구해야 할 핵심 과제는 OS 스케줄링 이론을 LLM 환경에 맞게 적응시키는 것이다.

OS에서 프로세스 스케줄링은 CPU 시간을 짧은 단위(타임 퀀텀)로 나누어 여러 프로세스에 번갈아 할당하는 **선점형(Preemptive)** 방식이 일반적이다. 그러나 LLM 추론은 한번 시작되면 중간에 중단할 수 없으므로, **비선점형(Non-preemptive)** 환경에서 동작해야 한다. 이러한 차이로 인해, 2.1절에서 소개한 알고리즘들을 그대로 적용할 수 없으며, LLM 도메인의 특성에 맞는 적응 방안을 연구해야 한다.

예를 들어, MLFQ의 경우 OS에서는 타임 퀀텀을 초과한 프로세스를 즉시 중단하고 하위 큐로 강등시키지만, LLM 환경에서는 요청 완료 후의 결과를 바탕으로 피드백을 적용하는 방식으로 변환해야 할 것이다. 이처럼 각 알고리즘의 핵심 원리를 유지하면서 LLM 환경에 맞게 변환하는 것이 본 연구의 주요 과제이다.

또한, 알고리즘 비교를 위한 적절한 평가 지표를 선정하고, 대기시간, 처리량, 공정성(JFI) 등의 관점에서 각 알고리즘의 특성을 분석하고자 한다.

> **[그림 2] OS 스케줄링과 LLM 요청 관리의 개념적 대응** (별첨: proposal-figures.pptx, 슬라이드 2)

### 3.3 기대 효과

본 시스템이 구현될 경우, 다음과 같은 효과를 기대할 수 있다.

- **차등적 서비스 제공**: 테넌트 등급이나 요청 긴급도에 따라 처리 순서를 조정하여, 중요한 요청을 우선적으로 처리할 수 있다.
- **공정성 보장**: 공정성 지표를 통해 자원 배분의 균형을 정량적으로 측정하고, 특정 테넌트가 자원을 독점하는 것을 방지할 수 있다.
- **알고리즘 비교 데이터 확보**: 여러 스케줄링 전략을 동일한 환경에서 비교함으로써, LLM 서빙 환경에 적합한 스케줄링 방식에 대한 실험적 근거를 제공할 수 있다.

---

## 4. 연구 일정

26-1학기에는 시스템 설계 및 구현, 성능 비교 실험, 결과 분석을 진행할 계획이다.

**표 2. 26-1학기 연구 일정**

| 기간 | 주요 활동 | 산출물 | 마감일 |
|------|----------|--------|--------|
| 3월 | 관련연구 조사, 제안서 작성 | 제안서 (본 문서) | 3/22 |
| 4월 | 시스템 설계 및 구현 | 중간보고서 | 4/12 |
| 5월 초~중 | 실험 수행 및 결과 분석 | 최종보고서 + 소스코드 | 5/24 |
| 5월 말 | 발표 자료 준비, 시스템 데모 구성 | 발표 PPT, 데모 | 5/26~29 |

---

## 참고문헌

[1] A. Silberschatz, P. B. Galvin, and G. Gagne, *Operating System Concepts*, 10th ed., Wiley, 2018. [온라인] Available: https://www.os-book.com/

[2] R. H. Arpaci-Dusseau and A. C. Arpaci-Dusseau, *Operating Systems: Three Easy Pieces*, Version 1.10, Arpaci-Dusseau Books, 2023. [온라인] Available: https://pages.cs.wisc.edu/~remzi/OSTEP/

[3] J. F. Kurose and K. W. Ross, *Computer Networking: A Top-Down Approach*, 8th ed., Pearson, 2021. [온라인] Available: https://gaia.cs.umass.edu/kurose_ross/

[4] W. Kwon et al., "Efficient Memory Management for Large Language Model Serving with PagedAttention," *arXiv preprint*, 2023. [온라인] Available: https://arxiv.org/abs/2309.06180

[5] Hugging Face, "Text Generation Inference (TGI)," 2024. [온라인] Available: https://huggingface.co/docs/text-generation-inference/

[6] Ollama, "Ollama - Get up and running with large language models," 2024. [온라인] Available: https://ollama.com/

[7] Express.js, "Express - Node.js Web Application Framework," 2024. [온라인] Available: https://expressjs.com/

[8] Node.js, "Node.js Documentation," 2024. [온라인] Available: https://nodejs.org/docs/latest/api/

[9] 혀니앤, "[운영체제] 스케줄링 알고리즘," velog, 2022. [온라인] Available: https://velog.io/@jeongopo/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C-%EC%8A%A4%EC%BC%80%EC%A4%84%EB%A7%81-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98

[10] 폐프의삶, "[OS] MLFQ," tistory, 2025. [온라인] Available: https://waste-programmer.tistory.com/32

[11] JSH 기술 블로그, "라우터의 패킷 지연과 패킷 스케줄링 방법," tistory, 2021. [온라인] Available: https://studyandwrite.tistory.com/442
