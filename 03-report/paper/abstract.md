# 초록 (Abstract)

## 한국어 초록 (Korean Abstract)

최근 ChatGPT, Claude 등 대규모 언어 모델(Large Language Model, LLM) API 사용이 급격히 증가하면서, 여러 사용자가 동시에 LLM API를 호출하는 환경에서 요청을 어떤 순서로 처리할지가 중요한 문제로 대두되고 있다. 기존 많은 LLM 서비스는 선착순(First-Come, First-Served, FCFS) 처리나 단순 Rate Limiting에 의존하고 있어, 긴 요청이 짧은 요청을 지연시키는 호위 효과(Convoy Effect)나 긴급한 요청도 순서를 기다려야 하는 문제가 발생한다.

본 연구는 운영체제의 검증된 프로세스 스케줄링 알고리즘을 다중 사용자 LLM API 요청 관리 시스템에 적용하여, 효율적인 요청 처리와 공정한 자원 분배를 달성하는 시스템을 구현하였다. 구체적으로 FCFS, Priority Scheduling, MLFQ(Multi-Level Feedback Queue), WFQ(Weighted Fair Queuing), Rate Limiter 5가지 스케줄링 알고리즘을 구현하고, 알고리즘별 성능을 정량적으로 비교 분석하였다.

본 연구의 주요 성과는 다음과 같다. 첫째, MLFQ 스케줄러에 시간 슬라이스(500ms) 기반 선점형(preemptive) 모드를 구현하여, 동시 요청 경쟁 환경에서 짧은 요청의 대기시간을 81.14% 개선하였다(p < 0.001). 둘째, WFQ 스케줄러에 가중치 비율(Enterprise:Premium:Standard:Free = 100:50:10:1)에 비례한 자원 분배를 구현하여, Enterprise 테넌트가 Free 테넌트 대비 5.8배 빠른 응답(849ms vs 4,894ms)을 받도록 하였다. 셋째, 공정성을 정량적으로 측정하기 위해 Jain's Fairness Index(JFI)를 도입하였으며, 시스템 수준(0.89)과 테넌트 수준(0.92-0.98)의 이중 측정 방법론을 제시하였다.

본 시스템은 Node.js 22 LTS와 Express.js 4.18로 구현되었으며, 의존성 패키지를 2개(express, jest)로 최소화하여 학부생 수준에서 접근 가능하도록 설계되었다. 품질 검증 결과 307개 테스트 100% 통과, 코드 커버리지 99.76%(Statements)를 달성하였다. 실험 결과 Priority 스케줄러에서 URGENT 요청은 FCFS 대비 62% 빠르게 처리되었으며(Cohen's d=0.78, p<0.001), WFQ 스케줄러는 의도한 가중치 비율에 따른 공정한 자원 분배를 입증하였다.

**주제어:** LLM API, OS 스케줄링, MLFQ, WFQ, 공정성, Jain's Fairness Index, 기아 방지, 선점형 스케줄링

---

## English Abstract

With the rapid growth of Large Language Model (LLM) API services such as ChatGPT and Claude, the order of request processing in multi-user LLM API environments has become a critical issue. Many existing LLM services rely on simple First-Come, First-Served (FCFS) processing or basic rate limiting, which leads to the Convoy Effect where long requests delay short requests, and urgent requests must wait in queue.

This study implements a multi-user LLM API request management system by applying verified operating system process scheduling algorithms to achieve efficient request processing and fair resource allocation. Specifically, five scheduling algorithms were implemented: FCFS, Priority Scheduling, Multi-Level Feedback Queue (MLFQ), Weighted Fair Queuing (WFQ), and Rate Limiter, with quantitative performance comparison analysis for each algorithm.

The key achievements of this study are as follows. First, a time slice (500ms) based preemptive mode was implemented in the MLFQ scheduler, improving short request wait times by 81.14% in concurrent request competition environments (p < 0.001). Second, the WFQ scheduler was implemented with resource allocation proportional to weight ratios (Enterprise:Premium:Standard:Free = 100:50:10:1), enabling Enterprise tenants to receive 5.8x faster responses than Free tenants (849ms vs 4,894ms). Third, Jain's Fairness Index (JFI) was introduced for quantitative fairness measurement, presenting a dual-level measurement methodology for system-level (0.89) and tenant-level (0.92-0.98) fairness.

The system is implemented with Node.js 22 LTS and Express.js 4.18, designed to be accessible at undergraduate level by minimizing dependency packages to two (express, jest). Quality validation achieved 100% pass rate for 307 tests and 99.76% code coverage (Statements). Experimental results show that Priority scheduler processes URGENT requests 62% faster than FCFS (Cohen's d=0.78, p<0.001), and WFQ scheduler demonstrated fair resource allocation according to intended weight ratios.

**Keywords:** LLM API, OS Scheduling, MLFQ, WFQ, Fairness, Jain's Fairness Index, Starvation Prevention, Preemptive Scheduling

---

**초록 작성일:** 2026년 2월 11일
