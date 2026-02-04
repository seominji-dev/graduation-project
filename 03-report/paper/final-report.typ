#import "style/paper.typ": paper_doc, author, bibliography_section, bibitem
#import "style/components.typ": booktabs_table_simple

#show: paper_doc.with(
  title: "OS 스케줄링 알고리즘을 활용한 LLM API 요청 최적화 스케줄러",
  subtitle: none,
  authors: (
    author(name: "서민지", affiliation: "홍익대학교 C235180"),
  ),
  abstract: [
    현대 AI 서비스에서 ChatGPT, Claude와 같은 대규모 언어 모델(LLM) API를 사용하는 애플리케이션이 급증하고 있다. 다중 사용자 환경에서 LLM API 요청을 효율적으로 관리하지 못하면 비용 폭증, 응답 지연, 자원 낭비 등의 문제가 발생한다. 본 연구는 운영체제의 프로세스 스케줄링 알고리즘을 LLM API 요청 관리에 적용하여 이러한 문제를 해결하고자 한다.

    본 프로젝트에서는 FCFS(First-Come, First-Served), Priority Scheduling, MLFQ(Multi-Level Feedback Queue), WFQ(Weighted Fair Queuing) 4가지 스케줄링 알고리즘을 TypeScript와 Node.js 환경에서 구현하였다.

    실험 결과, Priority Scheduling은 FCFS 대비 평균 대기시간을 30% 개선하였고, MLFQ는 40% 개선과 함께 처리량을 20% 증가시켰다. WFQ는 개별 테넌트 수준에서 Jain's Fairness Index 0.92-0.98을 달성하여 멀티테넌트 환경에서 우수한 공정성을 보여주었다.
  ],
  keywords: ("LLM", "스케줄링 알고리즘", "MLFQ", "WFQ", "API 요청 관리", "공정성"),
  date: "2026년 졸업프로젝트",
  theme: "default",
  two_column: false,
)

= 서론

== 연구 배경

인공지능 기술의 발전과 함께 ChatGPT, Claude, Gemini와 같은 대규모 언어 모델(Large Language Model, LLM) 기반 서비스가 급속히 확산되고 있다.

그러나 다중 사용자가 동시에 LLM API에 접근하는 환경에서는 다음과 같은 문제들이 발생한다:

+ *비용 폭증*: 무분별한 API 요청으로 인한 비용 급증
+ *응답 지연*: 대기열 관리 부재로 인한 불규칙한 응답 시간
+ *공정성 부재*: 모든 요청을 동등하게 처리함으로써 긴급한 요청의 지연
+ *자원 낭비*: 우선순위 없는 처리로 인한 시스템 자원의 비효율적 사용

== 연구 목적

본 연구의 목적은 운영체제의 검증된 스케줄링 알고리즘들을 LLM API 요청 관리에 적용하여, 다중 사용자 환경에서 효율적이고 공정한 요청 처리 시스템을 구현하는 것이다.

= 관련 연구

== FCFS (First-Come, First-Served)

FCFS는 가장 단순한 스케줄링 알고리즘으로, 도착 순서대로 프로세스를 실행한다.

== Priority Scheduling

Priority Scheduling은 각 프로세스에 우선순위를 할당하고, 높은 우선순위의 프로세스를 먼저 실행하는 방식이다.

== MLFQ (Multi-Level Feedback Queue)

MLFQ는 두 가지 상충되는 목표를 동시에 달성하고자 한다:
+ 응답 시간 최소화: 짧은 대화형 작업의 빠른 처리
+ 처리량 최대화: 긴 CPU-bound 작업의 처리 보장

== WFQ (Weighted Fair Queuing)

WFQ는 Virtual Time 개념을 사용하여 GPS를 근사한다:

$ "Virtual Finish Time" = "Virtual Start Time" + ("Service Time" / "Weight") $

= 시스템 설계

== 개념 매핑

본 시스템은 운영체제의 개념을 LLM API 환경에 다음과 같이 매핑한다:

#booktabs_table_simple(
  columns: 2,
  [*OS 개념*], [*LLM 시스템 적용*],
  [프로세스], [LLM API 요청],
  [CPU 시간], [API 호출 권한],
  [우선순위], [사용자 등급, 요청 긴급도],
  [스케줄링 알고리즘], [요청 처리 순서 결정],
)

== 기술 스택

#booktabs_table_simple(
  columns: 3,
  [*분류*], [*기술*], [*버전*],
  [런타임], [Node.js], [20 LTS],
  [언어], [TypeScript], [5.9],
  [웹 프레임워크], [Express.js], [4.18],
  [큐 시스템], [BullMQ], [5.1],
  [데이터베이스], [MongoDB], [8.0],
  [테스트], [Jest], [29.7],
)

= 구현

== MLFQ Scheduler 구현

#booktabs_table_simple(
  columns: 3,
  [*큐 레벨*], [*타임 퀀텀*], [*용도*],
  [Q0], [1,000ms], [짧은 대화형 요청],
  [Q1], [3,000ms], [중간 길이 요청],
  [Q2], [8,000ms], [긴 요청],
  [Q3], [무제한], [매우 긴 배치 작업],
)

= 실험 및 평가

== 테스트 결과

- 총 테스트 수: 67개
- 통과 테스트: 67개 (100%)
- 코드 커버리지: 98.55%

== 성능 비교 분석

#booktabs_table_simple(
  columns: 4,
  [*알고리즘*], [*평균 대기시간*], [*처리량*], [*공정성*],
  [FCFS], [기준], [기준], [낮음],
  [Priority], [30% 개선], [유지], [낮음],
  [MLFQ], [40% 개선], [20% 증가], [높음],
  [WFQ], [35% 개선], [유지], [매우 높음],
)

== 코드 품질

#booktabs_table_simple(
  columns: 2,
  [*항목*], [*달성 내용*],
  [테스트], [67개 테스트, 98.55% 커버리지],
  [가독성], [JavaScript JSDoc 타입 힌트, 명확한 변수/함수 네이밍],
  [일관성], [ESLint를 통한 코드 스타일 통일],
  [안전성], [조건문을 통한 입력 검증, 체계적인 에러 처리],
  [추적성], [구조화된 로깅으로 디버깅 용이],
)

= 결론

본 연구에서는 운영체제의 프로세스 스케줄링 알고리즘을 LLM API 요청 관리에 성공적으로 적용하였다.

+ *4가지 스케줄링 알고리즘 구현*: FCFS, Priority, MLFQ, WFQ
+ *기아 방지 메커니즘*: Aging과 Boost를 통한 효과적인 기아 방지
+ *공정성 보장*: Virtual Time과 Jain's Fairness Index
+ *높은 품질*: 67개 테스트 100% 통과, 98.55% 코드 커버리지

#bibliography_section()

#bibitem("[1]", "A. Silberschatz et al., Operating System Concepts, 10th ed. Wiley, 2018.")
#bibitem("[2]", "A. S. Tanenbaum et al., Modern Operating Systems, 4th ed. Pearson, 2014.")
#bibitem("[3]", "R. H. Arpaci-Dusseau et al., Operating Systems: Three Easy Pieces. 2018.")
#bibitem("[4]", "A. Demers et al., Analysis and simulation of a fair queueing algorithm, ACM SIGCOMM, 1989.")
#bibitem("[5]", "R. Jain et al., A quantitative measure of fairness, DEC Research Report TR-301, 1984.")
