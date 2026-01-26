= 졸업프로젝트 후보 비교 분석 문서
<졸업프로젝트-후보-비교-분석-문서>
#strong[작성일]: 2026-01-26 #strong[목적]: 4개의 OS 개념 기반 AI 시스템
졸업프로젝트 후보에 대한 객관적 비교 분석 #strong[대학]: 홍익대학교
컴퓨터공학과

#line(length: 100%)

== 1. 프로젝트 개요
<프로젝트-개요>
#figure(
  align(center)[#table(
    columns: (10.34%, 22.41%, 22.41%, 22.41%, 22.41%),
    align: (auto,auto,auto,auto,auto,),
    table.header([항목], [Candidate 1], [Candidate 2], [Candidate
      3], [Candidate 4],),
    table.hline(),
    [#strong[프로젝트명]], [LLM Scheduler], [Memory Manager], [Deadlock
    Detector], [Checkpointing],
    [#strong[OS 개념]], [프로세스
    스케줄링], [페이징/가상메모리], [데드락 감지/회피], [프로세스
    체크포인팅],
    [#strong[적용 대상]], [LLM API 요청 관리], [AI 에이전트
    컨텍스트], [멀티에이전트 자원 관리], [AI 에이전트 상태 복구],
    [#strong[TRUST 5]], [88/100], [93/100], [91/100], [91/100],
    [#strong[테스트 수]], [707개], [57개], [145개], [46개],
    [#strong[커버리지]], [98.29%], [94.44%], [66.64%], [85.44%],
  )]
  , kind: table
  )

#line(length: 100%)

== 2. 정량적 지표 분석
<정량적-지표-분석>
=== 2.1 코드 품질 점수 (TRUST 5)
<코드-품질-점수-trust-5>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([순위], [프로젝트], [점수],),
    table.hline(),
    [1], [Memory Manager], [93/100],
    [2], [Deadlock Detector], [91/100],
    [2], [Checkpointing], [91/100],
    [4], [LLM Scheduler], [88/100],
  )]
  , kind: table
  )

=== 2.2 테스트 커버리지
<테스트-커버리지>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([순위], [프로젝트], [커버리지],),
    table.hline(),
    [1], [LLM Scheduler], [98.29%],
    [2], [Memory Manager], [94.44%],
    [3], [Checkpointing], [85.44%],
    [4], [Deadlock Detector], [66.64%],
  )]
  , kind: table
  )

=== 2.3 코드 규모 (Lines of Code)
<코드-규모-lines-of-code>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([프로젝트], [소스 코드 (LOC)], [테스트 파일
      수], [복잡도 평가],),
    table.hline(),
    [LLM Scheduler], [4,575], [14], [높음],
    [Memory Manager], [2,455], [7], [중간],
    [Deadlock Detector], [2,689], [10], [중간],
    [Checkpointing], [2,686], [7], [중간],
  )]
  , kind: table
  )

#line(length: 100%)

== 3. 학술적 가치 분석
<학술적-가치-분석>
=== 3.1 논문 작성 가능성
<논문-작성-가능성>
#figure(
  align(center)[#table(
    columns: (21.43%, 33.33%, 26.19%, 19.05%),
    align: (auto,auto,auto,auto,),
    table.header([프로젝트], [논문 제목 예시], [연구 기여도], [독창성],),
    table.hline(),
    [#strong[LLM Scheduler]], ["LLM 추론 요청을 위한 적응형 다단계
    피드백 큐 스케줄링"], [높음], [높음],
    [Memory Manager], ["AI 에이전트 컨텍스트 관리를 위한 계층적 메모리
    시스템"], [중상], [중상],
    [Deadlock Detector], ["멀티에이전트 시스템의 데드락 감지 및 회복
    메커니즘"], [중], [중],
    [Checkpointing], ["장기 실행 AI 에이전트를 위한 체크포인팅 기반 장애
    복구"], [중], [중],
  )]
  , kind: table
  )

=== 3.2 기존 연구와의 차별성
<기존-연구와의-차별성>
#strong[Candidate 1: LLM Scheduler] - 기존 CPU 스케줄링 알고리즘을 LLM
API 요청에 최초 적용 - 4가지 알고리즘 비교 실험 가능 - #strong[Research
Gap]: LLM API 레벨의 요청 스케줄링 연구는 부재

#strong[Candidate 2: Memory Manager] - OS 페이징 개념을 AI 에이전트
컨텍스트 관리에 적용 - 3계층 메모리 구조 + 시맨틱 검색 융합

#strong[Candidate 3: Deadlock Detector] - 데드락 이론을 멀티에이전트
시스템에 적용 - Wait-For Graph + Banker's Algorithm 구현

#strong[Candidate 4: Checkpointing] - OS 프로세스 체크포인팅을 AI
에이전트에 적용 - 전체/증분 체크포인트 전략

#line(length: 100%)

== 4. 종합 점수 및 순위
<종합-점수-및-순위>
=== 4.1 평가 기준별 점수 (100점 만점)
<평가-기준별-점수-100점-만점>
#figure(
  align(center)[#table(
    columns: (7.81%, 10.94%, 20.31%, 20.31%, 20.31%, 20.31%),
    align: (auto,auto,auto,auto,auto,auto,),
    table.header([기준], [가중치], [Candidate 1], [Candidate
      2], [Candidate 3], [Candidate 4],),
    table.hline(),
    [코드 품질 (TRUST 5)], [15%], [88], [93], [91], [91],
    [테스트 커버리지], [15%], [98], [94], [67], [85],
    [학술적 가치], [25%], [95], [85], [80], [75],
    [기술적 완성도], [20%], [95], [92], [85], [88],
    [실무 적용성], [15%], [95], [85], [70], [80],
    [확장 가능성], [10%], [90], [85], [80], [80],
  )]
  , kind: table
  )

=== 4.2 가중 점수 계산
<가중-점수-계산>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([프로젝트], [가중 점수], [순위],),
    table.hline(),
    [#strong[Candidate 1: LLM
    Scheduler]], [#strong[93.35]], [#strong[1위]],
    [Candidate 2: Memory Manager], [89.05], [2위],
    [Candidate 4: Checkpointing], [82.40], [3위],
    [Candidate 3: Deadlock Detector], [79.65], [4위],
  )]
  , kind: table
  )

#line(length: 100%)

== 5. 최종 추천
<최종-추천>
=== 1순위: LLM Scheduler
<순위-llm-scheduler>
#strong[추천 근거]: 1. #strong[학술적 기여도 최고]: OS 스케줄링
알고리즘을 LLM API에 적용한 최초의 체계적 연구 2. #strong[정량적 실험
용이]: 4개 알고리즘 비교, 공정성 지표 측정 가능 3. #strong[실무 적용성
높음]: LLM API 게이트웨이로 즉시 활용 가능 4. #strong[테스트 완성도
최고]: 707개 테스트, 98.29% 커버리지 5. #strong[시장 수요 부합]: LLM
서비스 급증으로 스케줄링 수요 증가

#line(length: 100%)

#emph[본 문서는 각 프로젝트의 소스 코드, README, 테스트 결과를 기반으로
객관적으로 작성되었습니다.]
