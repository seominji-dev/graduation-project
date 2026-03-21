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

### 1.1 배경

ChatGPT, Claude, Gemini 등 대규모 언어 모델(Large Language Model, LLM) API 서비스의 사용이 빠르게 늘고 있다. 이에 따라 여러 사용자가 동시에 LLM API를 호출하는 상황도 잦아지면서, 요청을 어떤 순서로 처리할지가 서비스 품질에 큰 영향을 미치게 되었다. 현재 대부분의 LLM 서비스는 도착 순서대로 처리하는 선착순(First-Come, First-Served, FCFS) 방식에 의존하고 있어, 처리 시간이 긴 요청으로 인해 짧은 요청까지 지연되거나, 긴급한 요청도 순서를 기다려야 하는 한계가 있다.

### 1.2 동기 및 목적

3학년 운영체제 수업에서 프로세스 스케줄링 알고리즘을 배우면서, "이 알고리즘들을 LLM API 요청 관리에 적용해보면 어떨까?"라는 궁금증에서 이 프로젝트를 시작하게 되었다. 운영체제에서 CPU 자원을 여러 프로세스에 효율적으로 배분하기 위해 개발된 스케줄링 이론을 LLM API 환경에 적용해보고, 알고리즘별 성능 차이를 비교해보는 것이 본 프로젝트의 목적이다.

이 프로젝트에서는 구체적으로 다음 세 가지를 해보려고 한다.

1. **OS 스케줄링 알고리즘 적용**: FCFS, Priority Scheduling, MLFQ 등 대표적인 스케줄링 알고리즘을 LLM API 환경에 맞게 구현해본다.
2. **알고리즘별 성능 비교**: 대기시간, 처리량 등의 지표로 각 알고리즘의 성능을 비교해본다.
3. **공정성 측정**: 여러 사용자가 자원을 공정하게 배분받고 있는지 측정하는 방법을 알아본다.

---

## 2. 관련 연구

### 2.1 OS 스케줄링 알고리즘

프로세스 스케줄링은 운영체제의 핵심 기능 중 하나로, CPU 자원을 여러 프로세스에 배분하기 위한 다양한 알고리즘이 있다 [1][2].

**FCFS(First-Come, First-Served)**는 요청이 도착한 순서대로 처리하는 가장 단순한 방식이다. 구현이 간단하지만, 처리 시간이 긴 요청 때문에 짧은 요청들까지 지연되는 호위 효과(Convoy Effect)가 발생할 수 있다 [1].

**Priority Scheduling**은 각 프로세스에 우선순위를 부여하여 우선순위가 높은 프로세스를 먼저 처리한다. 다만 우선순위가 낮은 프로세스가 계속 밀려 처리되지 못하는 기아(Starvation) 현상이 발생할 수 있으며, 이를 방지하기 위해 에이징(Aging) 기법이 사용된다 [1].

**MLFQ(Multi-Level Feedback Queue)**는 여러 개의 큐를 두고, 작업의 실행 특성에 따라 우선순위를 동적으로 조정하는 알고리즘이다. 짧은 작업은 높은 우선순위 큐에서 빠르게 처리되고, 할당된 시간(타임 퀀텀)을 초과한 긴 작업은 하위 큐로 이동한다 [2].

이 외에도 네트워크 분야에서 사용되는 **WFQ(Weighted Fair Queuing)** 등 가중치 기반으로 자원을 공정하게 배분하는 방식도 있다 [3].

> **[그림 1] 스케줄링 알고리즘 개념 비교** (별첨: proposal-figures.pptx, 슬라이드 1)

### 2.2 LLM 서빙과 스케줄링

현재 LLM 서빙(LLM을 사용자에게 제공하는 것) 분야에서는 응답 속도를 높이기 위한 다양한 기술이 개발되고 있지만, 다중 사용자 환경에서의 요청 스케줄링이나 사용자 간 공정성 문제는 아직 많이 다루어지지 않은 영역이다 [4][5]. 본 프로젝트는 이 부분에 OS 스케줄링 이론을 적용해보려고 한다.

### 2.3 공정성 측정

여러 사용자가 자원을 공유하는 시스템에서, 자원 배분의 공정성을 측정하는 지표로 Jain's Fairness Index(JFI)가 있다 [3]. JFI는 0에서 1 사이의 값을 가지며, 1에 가까울수록 자원이 공정하게 배분되었음을 뜻한다. 본 프로젝트에서도 이 지표를 활용하여 스케줄링 알고리즘의 공정성을 측정해볼 계획이다.

---

## 3. 제안 시스템

### 3.1 시스템 개요

본 프로젝트에서는 OS 스케줄링 알고리즘을 LLM API 요청 관리에 적용한 시스템을 구현해보려고 한다. 기본 아이디어는, OS에서 프로세스가 CPU를 할당받기 위해 대기하는 것처럼, LLM API 요청도 대기열에서 순서를 기다리는 구조를 만드는 것이다.

| OS 개념 | LLM 환경 대응 (예상) |
|---------|---------------------|
| 프로세스 | LLM API 요청 |
| CPU 시간 | LLM 추론 시간 |
| 우선순위 | 사용자 등급, 요청 긴급도 |

FCFS를 기준(베이스라인)으로 삼고, Priority Scheduling, MLFQ, WFQ 등의 알고리즘을 적용하여 성능을 비교해볼 계획이다.

### 3.2 예상되는 과제

OS 프로세스 스케줄링에서는 실행 중인 작업을 중단하고 다른 작업에 CPU를 넘겨줄 수 있는 선점형(Preemptive) 방식이 일반적이다. 그러나 LLM 추론은 한번 시작되면 중간에 중단하기 어려운 특성이 있다. 이처럼 OS 이론을 그대로 적용할 수 없는 부분이 있을 것으로 예상되며, LLM 환경에 맞게 어떻게 변형할지가 주요 과제가 될 것이다.

> **[그림 2] OS 스케줄링과 LLM 요청 관리의 개념적 대응** (별첨: proposal-figures.pptx, 슬라이드 2)

### 3.3 기대 효과

- **OS 이론의 실제 적용 경험**: 수업에서 이론으로만 배웠던 스케줄링 알고리즘을 직접 구현하고 실험해봄으로써, 이론과 실제의 차이를 체감할 수 있을 것으로 기대한다.
- **알고리즘별 성능 비교**: 여러 스케줄링 전략을 동일 환경에서 비교하여, 각 알고리즘의 장단점을 확인해볼 수 있다.
- **백엔드 개발 경험**: Node.js/Express 기반 REST API 서버를 직접 구축하는 경험을 쌓을 수 있다.

---

## 4. 연구 일정

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

[5] Ollama, "Ollama - Get up and running with large language models," 2024. [온라인] Available: https://ollama.com/
