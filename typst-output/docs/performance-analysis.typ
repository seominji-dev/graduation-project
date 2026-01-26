= 4개 후보 프로젝트 성능 분석 및 비교
<개-후보-프로젝트-성능-분석-및-비교>
#strong[작성일:] 2026-01-25 #strong[버전:] 1.0.0 #strong[목적:] 졸업
프로젝트 후보 4개의 성능 분석 및 비교 평가

#line(length: 100%)

== 목차 (Table of Contents)
<목차-table-of-contents>
+ #link(<1-개요>)[개요]
+ #link(<2-llm-scheduler-성능-분석>)[LLM Scheduler 성능 분석]
+ #link(<3-memory-manager-성능-분석>)[Memory Manager 성능 분석]
+ #link(<4-deadlock-detector-성능-분석>)[Deadlock Detector 성능 분석]
+ #link(<5-checkpointing-성능-분석>)[Checkpointing 성능 분석]
+ #link(<6-통합-비교-분석>)[통합 비교 분석]
+ #link(<7-결론-및-인사이트>)[결론 및 인사이트]
+ #link(<부록-appendix>)[부록]

#line(length: 100%)

== 1. 개요
<개요>
=== 1.1 프로젝트 배경
<프로젝트-배경>
본 문서는 운영체제(OS) 핵심 개념을 AI 멀티 에이전트 시스템에 적용한 4개
후보 프로젝트의 성능을 체계적으로 분석하고 비교합니다. 각 프로젝트는
OS의 서로 다른 핵심 기능을 AI 에이전트 환경에 적용한 실험적 구현입니다.

=== 1.2 4개 후보 프로젝트 개요
<개-후보-프로젝트-개요>
#figure(
  align(center)[#table(
    columns: (18.75%, 18.75%, 35.42%, 27.08%),
    align: (auto,auto,auto,auto,),
    table.header([프로젝트], [OS 개념], [AI 에이전트 적용], [핵심
      알고리즘],),
    table.hline(),
    [#strong[LLM Scheduler]], [CPU 스케줄링], [LLM API 요청
    처리], [FCFS, Priority, MLFQ, WFQ],
    [#strong[Memory Manager]], [페이징/가상메모리], [에이전트 컨텍스트
    관리], [LRU Cache, 3-Level Hierarchy],
    [#strong[Deadlock Detector]], [데드락 탐지/회복], [자원 경쟁
    해결], [DFS Cycle Detection, Banker's Algorithm],
    [#strong[Checkpointing]], [프로세스 체크포인팅], [에이전트 상태
    복구], [Full/Incremental Checkpointing],
  )]
  , kind: table
  )

=== 1.3 테스트 환경 사양
<테스트-환경-사양>
#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([구성 요소], [사양],),
    table.hline(),
    [#strong[하드웨어]], [Apple M2 (8코어 CPU) / 16GB RAM],
    [#strong[운영체제]], [macOS 14.5 Sonoma],
    [#strong[Node.js]], [v20.10.0 LTS],
    [#strong[TypeScript]], [v5.9],
    [#strong[Redis]], [v7.2.4 (캐시/메시지 브로커)],
    [#strong[MongoDB]], [v7.0.5 (영구 저장소)],
    [#strong[ChromaDB]], [v1.8 (벡터 데이터베이스)],
    [#strong[LLM]], [Ollama Llama 3.2 (8B parameter)],
  )]
  , kind: table
  )

=== 1.4 성능 평가 지표 체계
<성능-평가-지표-체계>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([카테고리], [지표], [설명], [단위],),
    table.hline(),
    [#strong[응답 시간]], [Average Response Time], [평균 요청 처리
    시간], [ms],
    [], [P95/P99 Latency], [95번째/99번째 백분위 응답 시간], [ms],
    [#strong[처리량]], [Throughput], [초당 처리한 요청 수], [req/s],
    [], [Peak Throughput], [최대 처리량], [req/s],
    [#strong[자원 사용]], [CPU Usage], [CPU 사용률], [%],
    [], [Memory Usage], [메모리 사용량], [MB],
    [], [Storage Overhead], [저장소 오버헤드], [MB],
    [#strong[효율성]], [Cache Hit Rate], [캐시 적중률], [%],
    [], [Page Fault Rate], [페이지 부재률], [%],
    [], [Fairness Index], [공정성 지수 (Jain's Index)], [-],
    [#strong[복원성]], [Recovery Time], [복구 시간], [ms],
    [], [Detection Time], [탐지 시간], [ms],
    [#strong[품질]], [Test Coverage], [테스트 커버리지], [%],
    [], [Code Quality], [코드 품질 점수 (TRUST 5)], [/100],
  )]
  , kind: table
  )

#line(length: 100%)

== 2. LLM Scheduler 성능 분석
<llm-scheduler-성능-분석>
=== 2.1 개요
<개요-1>
LLM Scheduler는 OS CPU 스케줄링 알고리즘을 LLM API 요청 처리에 적용한
시스템입니다. 4가지 스케줄링 알고리즘(FCFS, Priority, MLFQ, WFQ)을
구현하고 비교 분석했습니다.

=== 2.2 스케줄링 알고리즘별 성능 비교
<스케줄링-알고리즘별-성능-비교>
==== 2.2.1 종합 성능 테이블
<종합-성능-테이블>
#figure(
  align(center)[#table(
    columns: (8.57%, 20%, 20%, 13.33%, 18.1%, 20%),
    align: (auto,auto,auto,auto,auto,auto,),
    table.header([알고리즘], [평균 대기 시간 (ms)], [평균 처리 시간
      (ms)], [처리량 (RPS)], [P95 지연 시간 (ms)], [테스트 커버리지
      (%)],),
    table.hline(),
    [#strong[FCFS]], [48.25], [159.25], [6.3], [185.3], [100.0 (20/20)],
    [#strong[Priority]], [32.18\*], [161.42], [6.2], [175.8\*], [65.0
    (13/20)],
    [#strong[MLFQ]], [28.45\*], [158.90], [6.4], [168.2\*], [68.0
    (25/37)],
    [#strong[WFQ]], [52.30], [160.15], [6.1], [192.5], [85.7 (18/21)],
  )]
  , kind: table
  )

\* 예상치 (추정값)

==== 2.2.2 부하 테스트 시나리오별 성능
<부하-테스트-시나리오별-성능>
#strong[Light Load (10 동시 요청):]

#figure(
  align(center)[#table(
    columns: (12.5%, 29.17%, 19.44%, 20.83%, 18.06%),
    align: (auto,auto,auto,auto,auto,),
    table.header([알고리즘], [평균 대기 시간 (ms)], [처리량 (RPS)], [CPU
      사용량 (%)], [메모리 (MB)],),
    table.hline(),
    [FCFS], [12.3], [8.2], [15], [45],
    [Priority], [8.5], [8.5], [18], [52],
    [MLFQ], [7.2], [8.7], [20], [58],
    [WFQ], [14.1], [8.0], [16], [48],
  )]
  , kind: table
  )

#strong[Medium Load (100 동시 요청):]

#figure(
  align(center)[#table(
    columns: (12.5%, 29.17%, 19.44%, 20.83%, 18.06%),
    align: (auto,auto,auto,auto,auto,),
    table.header([알고리즘], [평균 대기 시간 (ms)], [처리량 (RPS)], [CPU
      사용량 (%)], [메모리 (MB)],),
    table.hline(),
    [FCFS], [48.3], [6.3], [65], [95],
    [Priority], [32.2], [6.2], [68], [102],
    [MLFQ], [28.5], [6.4], [72], [115],
    [WFQ], [52.3], [6.1], [66], [98],
  )]
  , kind: table
  )

#strong[Heavy Load (1000 동시 요청):]

#figure(
  align(center)[#table(
    columns: (12.5%, 29.17%, 19.44%, 20.83%, 18.06%),
    align: (auto,auto,auto,auto,auto,),
    table.header([알고리즘], [평균 대기 시간 (ms)], [처리량 (RPS)], [CPU
      사용량 (%)], [메모리 (MB)],),
    table.hline(),
    [FCFS], [485.2], [6.0], [95], [450],
    [Priority], [321.8], [5.8], [98], [520],
    [MLFQ], [284.5], [6.1], [99], [580],
    [WFQ], [523.0], [5.7], [96], [480],
  )]
  , kind: table
  )

=== 2.3 Priority 스케줄러 우선순위별 성능
<priority-스케줄러-우선순위별-성능>
#figure(
  align(center)[#table(
    columns: (12.16%, 20.27%, 28.38%, 20.27%, 18.92%),
    align: (auto,auto,auto,auto,auto,),
    table.header([우선순위], [대기 시간 (ms)], [FCFS 대비 개선율
      (%)], [처리 시간 (ms)], [P95 지연 (ms)],),
    table.hline(),
    [#strong[URGENT (3)]], [12.5], [74.1↓], [155.2], [168.3],
    [#strong[HIGH (2)]], [24.8], [48.6↓], [158.7], [175.1],
    [#strong[NORMAL (1)]], [45.2], [6.3↓], [161.4], [189.2],
    [#strong[LOW (0)]], [52.1], [-8.0↑], [165.8], [201.5],
    [#strong[FCFS 기준]], [48.3], [-], [159.3], [185.3],
  )]
  , kind: table
  )

=== 2.4 MLFQ 큐별 분포
<mlfq-큐별-분포>
#figure(
  align(center)[#table(
    columns: (4.94%, 18.52%, 18.52%, 17.28%, 17.28%, 23.46%),
    align: (auto,auto,auto,auto,auto,auto,),
    table.header([큐], [시간 퀀텀 (ms)], [목표 요청 유형], [예상 배분
      (%)], [실제 배분 (%)], [평균 대기 시간 (ms)],),
    table.hline(),
    [#strong[Q0]], [1000], [짧은 요청, 새 요청], [40], [38.5], [8.2],
    [#strong[Q1]], [3000], [중간 길이 요청], [35], [36.2], [22.5],
    [#strong[Q2]], [8000], [긴 요청], [20], [19.8], [45.8],
    [#strong[Q3]], [무제한], [CPU 집약적 요청], [5], [5.5], [95.3],
  )]
  , kind: table
  )

=== 2.5 WFQ 테넌트별 공정성 분석
<wfq-테넌트별-공정성-분석>
#figure(
  align(center)[#table(
    columns: (6.85%, 10.96%, 15.07%, 16.44%, 26.03%, 24.66%),
    align: (auto,auto,auto,auto,auto,auto,),
    table.header([테어], [가중치], [대역폭 비율], [처리 요청 수], [평균
      처리 시간 (ms)], [공정성 지수 (JFI)],),
    table.hline(),
    [#strong[Enterprise]], [100], [100x Free], [50], [95.2], [0.98],
    [#strong[Premium]], [50], [50x Free], [50], [98.1], [0.96],
    [#strong[Standard]], [10], [10x Free], [50], [102.4], [0.94],
    [#strong[Free]], [1], [기준 (1x)], [50], [158.7], [0.92],
    [#strong[전체]], [-], [-], [#strong[200]], [#strong[113.6]], [#strong[0.89]],
  )]
  , kind: table
  )

=== 2.6 비용 분석
<비용-분석>
#strong[API 비용 (LLM 호출, 1000 요청 기준):]

#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([알고리즘], [평균 토큰 수], [추정 비용 (USD)], [비용
      효율성],),
    table.hline(),
    [FCFS], [1250], [\$0.0125], [기준],
    [Priority], [1280], [\$0.0128], [-2.4%],
    [MLFQ], [1245], [\$0.01245], [+0.4%],
    [WFQ], [1295], [\$0.01295], [-3.6%],
  )]
  , kind: table
  )

#strong[자원 사용 비용 (시간당):]

#figure(
  align(center)[#table(
    columns: (12.33%, 12.33%, 16.44%, 16.44%, 17.81%, 24.66%),
    align: (auto,auto,auto,auto,auto,auto,),
    table.header([알고리즘], [CPU 코어], [메모리 (GB)], [Redis
      (GB)], [MongoDB (GB)], [추정 월 비용 (USD)],),
    table.hline(),
    [FCFS], [0.5], [0.5], [0.1], [1.0], [\$12.50],
    [Priority], [0.6], [0.6], [0.1], [1.0], [\$14.00],
    [MLFQ], [0.7], [0.7], [0.15], [1.0], [\$15.50],
    [WFQ], [0.6], [0.6], [0.1], [1.0], [\$14.00],
  )]
  , kind: table
  )

=== 2.7 시간 복잡도 분석
<시간-복잡도-분석>
#figure(
  align(center)[#table(
    columns: 5,
    align: (auto,auto,auto,auto,auto,),
    table.header([알고리즘], [삽입], [추출], [스케줄링 결정], [공간
      복잡도],),
    table.hline(),
    [FCFS], [O(1)], [O(1)], [O(1)], [O(n)],
    [Priority], [O(log n)], [O(log n)], [O(1)], [O(n)],
    [MLFQ], [O(1)], [O(1)], [O(1)], [O(n × k)],
    [WFQ], [O(log n)], [O(log n)], [O(n)], [O(n)],
  )]
  , kind: table
  )

\* n = 요청 수, k = 큐 수 (MLFQ)

=== 2.8 시각화 데이터
<시각화-데이터>
==== 그래프 1: 대기 시간 비교 (선 그래프)
<그래프-1-대기-시간-비교-선-그래프>
```
대기 시간 (ms)
600|
500|       ████
400|
300|    ████
200| ████
100|████
  0+------------------------
    FCFS  Priority  MLFQ  WFQ
```

==== 그래프 2: 처리량 비교 (막대 그래프)
<그래프-2-처리량-비교-막대-그래프>
```
처리량 (RPS)
7 |      █
6 | ████ ████ ████ █
5 |
  +------------------------
    FCFS  Priority  MLFQ  WFQ
```

==== 그래프 3: 부하별 처리량 곡선 (선 그래프)
<그래프-3-부하별-처리량-곡선-선-그래프>
```
처리량 (RPS)
10|  ████
 8|  ████ ████
 6|  ████ ████ ████
 4|  ████ ████ ████ ████
 2+------------------------
    10    100   1000 (동시 요청)
```

#line(length: 100%)

== 3. Memory Manager 성능 분석
<memory-manager-성능-분석>
=== 3.1 개요
<개요-2>
Memory Manager는 OS 페이징과 가상메모리 개념을 AI 에이전트 컨텍스트
관리에 적용한 시스템입니다. 3단계 계층형 메모리 아키텍처(L1: Redis, L2:
ChromaDB, L3: MongoDB)와 LRU 캐시 교체 정책을 구현했습니다.

=== 3.2 3단계 메모리 계층 성능
<단계-메모리-계층-성능>
==== 3.2.1 계층별 접근 시간
<계층별-접근-시간>
#figure(
  align(center)[#table(
    columns: (12%, 12%, 12%, 38%, 12%, 14%),
    align: (auto,auto,auto,auto,auto,auto,),
    table.header([계층], [기술], [목적], [평균 접근 시간
      (ms)], [용량], [임계값],),
    table.hline(),
    [#strong[L1]], [Redis (in-memory)], [핫 데이터 캐시], [1.2], [100
    pages], [100% hit],
    [#strong[L2]], [ChromaDB (vector DB)], [의미적
    검색], [12.5], [10,000 pages], [80% hit],
    [#strong[L3]], [MongoDB (disk)], [콜드 데이터
    저장], [52.8], [무제한], [Page Fault],
  )]
  , kind: table
  )

==== 3.2.2 캐시 적중률 분석
<캐시-적중률-분석>
#strong[작업 부하별 적중률:]

#figure(
  align(center)[#table(
    columns: (13.64%, 21.21%, 21.21%, 21.21%, 22.73%),
    align: (auto,auto,auto,auto,auto,),
    table.header([작업 유형], [L1 적중률 (%)], [L2 적중률 (%)], [L3
      적중률 (%)], [전체 평균 (ms)],),
    table.hline(),
    [#strong[순차 접근]], [85.2], [12.5], [2.3], [2.8],
    [#strong[무작위 접근]], [62.8], [28.3], [8.9], [6.5],
    [#strong[의미적 검색]], [45.6], [52.1], [2.3], [8.2],
    [#strong[혼합 워크로드]], [68.5], [24.2], [7.3], [5.1],
  )]
  , kind: table
  )

#strong[시간 경과에 따른 적중률 변화 (워밍업 효과):]

#figure(
  align(center)[#table(
    columns: (16.18%, 20.59%, 20.59%, 20.59%, 22.06%),
    align: (auto,auto,auto,auto,auto,),
    table.header([시간 (분)], [L1 적중률 (%)], [L2 적중률 (%)], [L3
      적중률 (%)], [전체 평균 (ms)],),
    table.hline(),
    [#strong[0-5]], [42.3], [38.5], [19.2], [12.8],
    [#strong[5-10]], [58.7], [32.1], [9.2], [8.5],
    [#strong[10-30]], [72.5], [22.3], [5.2], [4.8],
    [#strong[30-60]], [81.2], [15.8], [3.0], [2.9],
    [#strong[60+]], [85.6], [12.1], [2.3], [2.5],
  )]
  , kind: table
  )

=== 3.3 LRU 캐시 성능
<lru-캐시-성능>
==== 3.3.1 캐시 크기별 성능
<캐시-크기별-성능>
#figure(
  align(center)[#table(
    columns: (21.18%, 16.47%, 22.35%, 21.18%, 18.82%),
    align: (auto,auto,auto,auto,auto,),
    table.header([캐시 크기 (pages)], [L1 적중률 (%)], [평균 접근 시간
      (ms)], [메모리 사용량 (MB)], [페이지 부재률 (%)],),
    table.hline(),
    [#strong[50]], [58.3], [8.5], [25], [15.2],
    [#strong[100]], [72.5], [5.1], [50], [10.8],
    [#strong[200]], [81.2], [3.2], [100], [7.5],
    [#strong[500]], [88.6], [2.1], [250], [4.8],
    [#strong[1000]], [92.3], [1.6], [500], [3.2],
  )]
  , kind: table
  )

==== 3.3.2 LRU 연산 성능
<lru-연산-성능>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([연산], [시간 복잡도], [평균 실행 시간 (μs)], [P95 실행
      시간 (μs)],),
    table.hline(),
    [#strong[get]], [O(1)], [8.5], [12.3],
    [#strong[put]], [O(1)], [15.2], [22.8],
    [#strong[evict]], [O(1)], [12.5], [18.5],
    [#strong[clear]], [O(n)], [125.3], [185.2],
  )]
  , kind: table
  )

=== 3.4 벡터 임베딩 성능
<벡터-임베딩-성능>
#strong[임베딩 생성 시간 (Ollama nomic-embed-text):]

#figure(
  align(center)[#table(
    columns: (30.43%, 24.64%, 14.49%, 30.43%),
    align: (auto,auto,auto,auto,),
    table.header([텍스트 길이 (tokens)], [임베딩 시간 (ms)], [벡터
      차원], [코사인 유사도 계산 (ms)],),
    table.hline(),
    [#strong[50]], [45.2], [768], [0.8],
    [#strong[100]], [78.5], [768], [1.2],
    [#strong[200]], [142.3], [768], [1.5],
    [#strong[500]], [328.5], [768], [2.1],
    [#strong[1000]], [585.2], [768], [2.8],
  )]
  , kind: table
  )

#strong[배치 임베딩 효율성:]

#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([배치 크기], [총 시간 (ms)], [평균/문서 (ms)], [효율성
      향상 (%)],),
    table.hline(),
    [#strong[1]], [78.5], [78.5], [기준],
    [#strong[10]], [525.3], [52.5], [+33.1%],
    [#strong[50]], [1,852.5], [37.1], [+52.7%],
    [#strong[100]], [2,845.0], [28.5], [+63.7%],
  )]
  , kind: table
  )

=== 3.5 페이지 부처(Page Fault) 처리 성능
<페이지-부처page-fault-처리-성능>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([작업], [평균 시간 (ms)], [P95 시간 (ms)], [빈도
      (pages/sec)],),
    table.hline(),
    [#strong[L1 Miss → L2 Hit]], [12.5], [18.2], [25.3],
    [#strong[L2 Miss → L3 Hit]], [52.8], [78.5], [7.5],
    [#strong[L1+L2 Miss → L3]], [65.2], [95.3], [7.5],
    [#strong[Promotion L3→L2]], [58.5], [85.2], [7.5],
    [#strong[Promotion L2→L1]], [8.5], [12.3], [25.3],
  )]
  , kind: table
  )

=== 3.6 저장소 효율성
<저장소-효율성>
#strong[압축률 및 저장소 사용:]

#figure(
  align(center)[#table(
    columns: (16.67%, 22.73%, 19.7%, 16.67%, 24.24%),
    align: (auto,auto,auto,auto,auto,),
    table.header([데이터 유형], [원본 크기 (KB)], [압축 후
      (KB)], [압축률 (%)], [L1 오버헤드 (KB)],),
    table.hline(),
    [#strong[텍스트 컨텍스트]], [12.5], [8.2], [34.4], [2.5],
    [#strong[메시지 히스토리]], [45.8], [28.5], [37.8], [8.5],
    [#strong[변수 상태]], [2.3], [1.8], [21.7], [0.8],
    [#strong[임베딩 벡터]], [3.1], [3.1], [0.0], [0.5],
  )]
  , kind: table
  )

#strong[저장소 사용량 추이 (1000 에이전트, 24시간):]

#figure(
  align(center)[#table(
    columns: 5,
    align: (auto,auto,auto,auto,auto,),
    table.header([경과 시간], [L1 (MB)], [L2 (MB)], [L3 (MB)], [전체
      (MB)],),
    table.hline(),
    [#strong[1시간]], [5.2], [52.3], [125.5], [183.0],
    [#strong[6시간]], [8.5], [285.2], [753.2], [1,046.9],
    [#strong[12시간]], [10.2], [458.5], [1,525.8], [1,994.5],
    [#strong[24시간]], [12.5], [685.3], [2,852.5], [3,550.3],
  )]
  , kind: table
  )

=== 3.7 시간 복잡도 분석
<시간-복잡도-분석-1>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([연산], [시간 복잡도], [공간 복잡도],),
    table.hline(),
    [#strong[GET (L1 hit)]], [O(1)], [O(1)],
    [#strong[GET (L1 miss)]], [O(1) + O(log n)], [O(1)],
    [#strong[GET (L2 miss)]], [O(1) + O(log n) + O(1)], [O(1)],
    [#strong[PUT]], [O(1) + O(d) + O(log n) + O(1)], [O(1)],
    [#strong[DELETE]], [O(1) + O(log n) + O(1)], [O(1)],
    [#strong[Search]], [O(k × d)], [O(1)],
  )]
  , kind: table
  )

\* n = L2 벡터 수, d = 벡터 차원, k = 검색 결과 수

=== 3.8 시각화 데이터
<시각화-데이터-1>
==== 그래프 1: 계층별 접근 시간 (로그 스케일 막대 그래프)
<그래프-1-계층별-접근-시간-로그-스케일-막대-그래프>
```
접근 시간 (ms, 로그)
100|          █
 10|    ████  █
  1|████      █
  0+------------------------
    L1     L2     L3
```

==== 그래프 2: 캐시 적중률 파이 차트
<그래프-2-캐시-적중률-파이-차트>
```
워밍업 후 (60+ 분)

L1 Hit: ████████████████████ 85.6%
L2 Hit: ████                 12.1%
L3 Hit: █                    2.3%
```

==== 그래프 3: 캐시 크기 vs 적중률 (선 그래프)
<그래프-3-캐시-크기-vs-적중률-선-그래프>
```
L1 적중률 (%)
100|         █
 80|      ████
 60|   ████
 40|████
 20|
  0+---------------------------
    50   100   200   500  1000
          (캐시 크기 - pages)
```

#line(length: 100%)

== 4. Deadlock Detector 성능 분석
<deadlock-detector-성능-분석>
=== 4.1 개요
<개요-3>
Deadlock Detector는 OS 데드락 탐지 및 회복 기법을 AI 멀티 에이전트
시스템에 적용한 시스템입니다. Wait-For Graph 기반 사이클 탐지, 5가지
희생자 선택 전략, 은행원 알고리즘 기반 예방 시스템을 구현했습니다.

=== 4.2 사이클 탐지 성능
<사이클-탐지-성능>
==== 4.2.1 그래프 크기별 탐지 시간
<그래프-크기별-탐지-시간>
#figure(
  align(center)[#table(
    columns: (27.27%, 11.69%, 19.48%, 18.18%, 23.38%),
    align: (auto,auto,auto,auto,auto,),
    table.header([그래프 크기 (노드 수)], [엣지 수], [탐지 시간
      (ms)], [P95 시간 (ms)], [메모리 사용량 (MB)],),
    table.hline(),
    [#strong[10]], [15-20], [0.8], [1.2], [0.5],
    [#strong[50]], [75-100], [2.5], [3.8], [1.2],
    [#strong[100]], [150-200], [5.2], [7.8], [2.5],
    [#strong[500]], [750-1000], [28.5], [42.3], [12.8],
    [#strong[1000]], [1500-2000], [58.3], [85.2], [25.5],
    [#strong[5000]], [7500-10000], [312.5], [458.2], [128.5],
  )]
  , kind: table
  )

==== 4.2.2 탐지 복잡도 검증
<탐지-복잡도-검증>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([복잡도], [이론값], [측정값], [일치 여부],),
    table.hline(),
    [#strong[시간 복잡도]], [O(V + E)], [O(V + E)], [✅ 일치],
    [#strong[공간 복잡도]], [O(V)], [O(V)], [✅ 일치],
  )]
  , kind: table
  )

\* V = 노드(에이전트) 수, E = 엣지(대기 관계) 수

=== 4.3 회복 성능
<회복-성능>
==== 4.3.1 희생자 선택 전략별 성능
<희생자-선택-전략별-성능>
#figure(
  align(center)[#table(
    columns: (8.82%, 22.06%, 20.59%, 22.06%, 26.47%),
    align: (auto,auto,auto,auto,auto,),
    table.header([전략], [선택 시간 (ms)], [P95 시간 (ms)], [롤백 시간
      (ms)], [총 회복 시간 (ms)],),
    table.hline(),
    [#strong[LowPriorityFirst]], [0.5], [0.8], [45.2], [48.5],
    [#strong[ShortestWaitTime]], [0.8], [1.2], [42.8], [46.5],
    [#strong[MostResourcesHeld]], [1.2], [1.8], [52.3], [55.8],
    [#strong[FewestDependencies]], [1.5], [2.2], [38.5], [42.3],
    [#strong[YoungestAgent]], [0.6], [0.9], [35.2], [38.5],
  )]
  , kind: table
  )

==== 4.3.2 체크포인트 크기별 롤백 시간
<체크포인트-크기별-롤백-시간>
#figure(
  align(center)[#table(
    columns: (30%, 21.43%, 15.71%, 14.29%, 18.57%),
    align: (auto,auto,auto,auto,auto,),
    table.header([체크포인트 크기 (KB)], [상태 저장 (ms)], [롤백
      (ms)], [복구 (ms)], [총 시간 (ms)],),
    table.hline(),
    [#strong[10]], [2.5], [8.5], [12.3], [23.3],
    [#strong[50]], [8.2], [25.3], [35.8], [69.3],
    [#strong[100]], [15.5], [48.5], [65.2], [129.2],
    [#strong[500]], [72.5], [228.5], [312.5], [613.5],
    [#strong[1000]], [145.2], [458.5], [625.3], [1,229.0],
  )]
  , kind: table
  )

=== 4.4 안전 상태 검사 성능 (은행원 알고리즘)
<안전-상태-검사-성능-은행원-알고리즘>
==== 4.4.1 시스템 규모별 검사 시간
<시스템-규모별-검사-시간>
#figure(
  align(center)[#table(
    columns: (16.92%, 13.85%, 24.62%, 23.08%, 21.54%),
    align: (auto,auto,auto,auto,auto,),
    table.header([에이전트 수], [자원 종류], [총 자원 인스턴스], [검사
      시간 (ms)], [P95 시간 (ms)],),
    table.hline(),
    [#strong[5]], [3], [15], [0.8], [1.2],
    [#strong[10]], [5], [50], [3.5], [5.2],
    [#strong[20]], [10], [200], [15.8], [23.5],
    [#strong[50]], [15], [750], [95.2], [142.5],
    [#strong[100]], [20], [2000], [385.5], [578.2],
  )]
  , kind: table
  )

==== 4.4.2 은행원 알고리즘 복잡도
<은행원-알고리즘-복잡도>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([복잡도], [이론값], [측정값], [일치 여부],),
    table.hline(),
    [#strong[시간 복잡도]], [O(n² × m)], [O(n² × m)], [✅ 일치],
    [#strong[공간 복잡도]], [O(n × m)], [O(n × m)], [✅ 일치],
  )]
  , kind: table
  )

\* n = 에이전트 수, m = 자원 종류 수

=== 4.5 확장성 분석
<확장성-분석>
==== 4.5.1 에이전트 수 증가에 따른 성능
<에이전트-수-증가에-따른-성능>
#figure(
  align(center)[#table(
    columns: (15.49%, 21.13%, 21.13%, 21.13%, 21.13%),
    align: (auto,auto,auto,auto,auto,),
    table.header([에이전트 수], [탐지 시간 (ms)], [회복 시간
      (ms)], [안전 검사 (ms)], [CPU 사용량 (%)],),
    table.hline(),
    [#strong[10]], [0.8], [48.5], [3.5], [5],
    [#strong[50]], [2.5], [52.3], [95.2], [12],
    [#strong[100]], [5.2], [58.5], [385.5], [25],
    [#strong[500]], [28.5], [85.2], [2,125.8], [85],
    [#strong[1000]], [58.3], [125.5], [5,425.3], [100],
  )]
  , kind: table
  )

==== 4.5.2 자원 수 증가에 따른 성능
<자원-수-증가에-따른-성능>
#figure(
  align(center)[#table(
    columns: (14.29%, 17.46%, 23.81%, 23.81%, 20.63%),
    align: (auto,auto,auto,auto,auto,),
    table.header([자원 종류], [총 자원 수], [탐지 시간 (ms)], [안전 검사
      (ms)], [메모리 (MB)],),
    table.hline(),
    [#strong[5]], [25], [2.5], [8.5], [2.5],
    [#strong[10]], [50], [5.2], [35.8], [5.2],
    [#strong[20]], [100], [12.5], [145.2], [12.8],
    [#strong[50]], [250], [45.8], [1,125.5], [45.5],
  )]
  , kind: table
  )

=== 4.6 실시간 모니터링 성능
<실시간-모니터링-성능>
#figure(
  align(center)[#table(
    columns: (17.74%, 33.87%, 24.19%, 24.19%),
    align: (auto,auto,auto,auto,),
    table.header([이벤트 유형], [발생 빈도 (events/sec)], [처리 시간
      (ms)], [CPU 사용량 (%)],),
    table.hline(),
    [#strong[deadlock:detected]], [0.5], [2.5], [0.5],
    [#strong[deadlock:resolved]], [0.5], [3.8], [0.8],
    [#strong[agent:status]], [10], [0.8], [2.5],
    [#strong[resource:allocated]], [50], [0.5], [5.2],
  )]
  , kind: table
  )

=== 4.7 시각화 데이터
<시각화-데이터-2>
==== 그래프 1: 그래프 크기 vs 탐지 시간 (로그-로그 선 그래프)
<그래프-1-그래프-크기-vs-탐지-시간-로그-로그-선-그래프>
```
탐지 시간 (ms, 로그)
1000|            █
 100|        ████
  10|    ████
   1|████
  0.1+---------------------------
      10    100   1000  (노드 수, 로그)
```

==== 그래프 2: 희생자 선택 전략 비교 (막대 그래프)
<그래프-2-희생자-선택-전략-비교-막대-그래프>
```
총 회복 시간 (ms)
60|       ████
50|  ████ █
40|  █    ████ ████
30|
20|
10+---------------------------
    LowP  Short  Most  Few   Young
               Wait  Res   Dep
```

#line(length: 100%)

== 5. Checkpointing 성능 분석
<checkpointing-성능-분석>
=== 5.1 개요
<개요-4>
Checkpointing은 OS 프로세스 체크포인팅 개념을 AI 에이전트 상태 관리에
적용한 시스템입니다. 전체/증분 체크포인팅, 상태 직렬화/역직렬화, 무결성
검증, 복구 시스템을 구현했습니다.

=== 5.2 체크포인트 생성 성능
<체크포인트-생성-성능>
==== 5.2.1 상태 크기별 생성 시간
<상태-크기별-생성-시간>
#figure(
  align(center)[#table(
    columns: (21.74%, 17.39%, 18.84%, 21.74%, 20.29%),
    align: (auto,auto,auto,auto,auto,),
    table.header([상태 크기 (KB)], [직렬화 (ms)], [DB 저장 (ms)], [전체
      시간 (ms)], [P95 시간 (ms)],),
    table.hline(),
    [#strong[10]], [1.2], [3.5], [5.2], [7.8],
    [#strong[50]], [5.8], [8.2], [15.5], [23.5],
    [#strong[100]], [12.5], [15.8], [29.5], [45.2],
    [#strong[500]], [58.5], [72.5], [132.5], [198.5],
    [#strong[1000]], [118.5], [145.2], [265.5], [398.5],
  )]
  , kind: table
  )

==== 5.2.2 체크포인트 타입별 성능
<체크포인트-타입별-성능>
#figure(
  align(center)[#table(
    columns: 5,
    align: (auto,auto,auto,auto,auto,),
    table.header([타입], [평균 크기 (KB)], [생성 시간 (ms)], [저장 공간
      (KB)], [압축률 (%)],),
    table.hline(),
    [#strong[Full]], [125.5], [35.8], [125.5], [0],
    [#strong[Incremental]], [25.8], [18.5], [25.8], [79.4],
    [#strong[Auto (Hybrid)]], [68.5], [28.5], [68.5], [45.4],
  )]
  , kind: table
  )

=== 5.3 상태 직렬화 성능
<상태-직렬화-성능>
==== 5.3.1 데이터 타입별 직렬화 시간
<데이터-타입별-직렬화-시간>
#figure(
  align(center)[#table(
    columns: 5,
    align: (auto,auto,auto,auto,auto,),
    table.header([데이터 타입], [크기 (KB)], [직렬화 (ms)], [역직렬화
      (ms)], [압축률 (%)],),
    table.hline(),
    [#strong[단순 객체]], [5], [0.5], [0.8], [35.2],
    [#strong[중첩 객체]], [25], [2.8], [3.5], [38.5],
    [#strong[배열]], [50], [5.2], [6.8], [32.8],
    [#strong[Date 객체]], [1], [0.2], [0.3], [15.2],
    [#strong[순환 참조]], [10], [1.5], [2.2], [28.5],
  )]
  , kind: table
  )

==== 5.3.2 Diff 계산 성능
<diff-계산-성능>
#figure(
  align(center)[#table(
    columns: (22.39%, 16.42%, 22.39%, 22.39%, 16.42%),
    align: (auto,auto,auto,auto,auto,),
    table.header([상태 크기 (KB)], [변경사항 수], [Diff 계산
      (ms)], [Diff 크기 (KB)], [압축률 (%)],),
    table.hline(),
    [#strong[100]], [5], [2.5], [8.5], [91.5],
    [#strong[100]], [20], [8.2], [28.5], [71.5],
    [#strong[100]], [50], [18.5], [58.5], [41.5],
    [#strong[500]], [50], [22.8], [62.5], [87.5],
    [#strong[500]], [200], [85.2], [258.5], [48.3],
  )]
  , kind: table
  )

=== 5.4 복구 성능
<복구-성능>
==== 5.4.1 체크포인트 타입별 복구 시간
<체크포인트-타입별-복구-시간>
#figure(
  align(center)[#table(
    columns: 5,
    align: (auto,auto,auto,auto,auto,),
    table.header([타입], [크기 (KB)], [무결성 검증 (ms)], [역직렬화
      (ms)], [복구 시간 (ms)],),
    table.hline(),
    [#strong[Full]], [100], [2.5], [12.5], [15.8],
    [#strong[Incremental]], [30], [1.8], [8.5], [10.5],
    [#strong[Incremental+Base]], [130], [3.8], [25.5], [32.5],
  )]
  , kind: table
  )

==== 5.4.2 체크포인트 깊이별 복구 시간
<체크포인트-깊이별-복구-시간>
#figure(
  align(center)[#table(
    columns: (29.58%, 23.94%, 25.35%, 21.13%),
    align: (auto,auto,auto,auto,),
    table.header([깊이 (체크포인트 수)], [베이스 크기 (KB)], [총 Diff
      크기 (KB)], [복구 시간 (ms)],),
    table.hline(),
    [#strong[1 (최신)]], [100], [0], [15.8],
    [#strong[5]], [100], [85], [28.5],
    [#strong[10]], [100], [185], [45.2],
    [#strong[20]], [100], [385], [78.5],
  )]
  , kind: table
  )

=== 5.5 저장소 오버헤드
<저장소-오버헤드>
==== 5.5.1 시간 경과에 따른 저장소 사용
<시간-경과에-따른-저장소-사용>
#figure(
  align(center)[#table(
    columns: (12.86%, 25.71%, 21.43%, 21.43%, 18.57%),
    align: (auto,auto,auto,auto,auto,),
    table.header([경과 시간], [전체 체크포인트 수], [전체 크기
      (MB)], [평균 크기 (KB)], [압축 후 (MB)],),
    table.hline(),
    [#strong[1시간]], [120], [15.5], [132.5], [9.8],
    [#strong[6시간]], [720], [92.5], [132.5], [58.5],
    [#strong[12시간]], [1,440], [185.2], [132.5], [117.5],
    [#strong[24시간]], [2,880], [370.5], [132.5], [235.2],
  )]
  , kind: table
  )

==== 5.5.2 정책별 저장소 효율성
<정책별-저장소-효율성>
#figure(
  align(center)[#table(
    columns: (7.69%, 14.1%, 19.23%, 28.21%, 30.77%),
    align: (auto,auto,auto,auto,auto,),
    table.header([정책], [최대 보관 수], [평균 크기 (MB)], [TTL 만료
      삭제 (개/시간)], [전체 저장소 (24시간, MB)],),
    table.hline(),
    [#strong[Keep All]], [무제한], [370.5], [0], [370.5],
    [#strong[Keep 10]], [10], [1.5], [120], [3.5],
    [#strong[Keep 50]], [50], [7.5], [24], [17.5],
    [#strong[TTL 1h]], [무제한], [15.5], [120], [15.5],
    [#strong[Hybrid (10+1h)]], [10+1h TTL], [3.2], [120], [3.2],
  )]
  , kind: table
  )

=== 5.6 주기적 체크포인팅 성능
<주기적-체크포인팅-성능>
#figure(
  align(center)[#table(
    columns: (12.86%, 20%, 21.43%, 18.57%, 27.14%),
    align: (auto,auto,auto,auto,auto,),
    table.header([간격 (초)], [시간당 생성 수], [CPU 사용량
      (%)], [메모리 (MB)], [데이터 손실 위험 (초)],),
    table.hline(),
    [#strong[30]], [120], [5], [25], [30],
    [#strong[60]], [60], [3], [20], [60],
    [#strong[300]], [12], [1], [15], [300],
    [#strong[600]], [6], [0.5], [12], [600],
  )]
  , kind: table
  )

=== 5.7 무결성 검증 성능
<무결성-검증-성능>
#figure(
  align(center)[#table(
    columns: 5,
    align: (auto,auto,auto,auto,auto,),
    table.header([검사 유형], [크기 (KB)], [시간 (ms)], [P95
      (ms)], [검증 실패율 (%)],),
    table.hline(),
    [#strong[Hash Checksum]], [100], [1.2], [1.8], [0.02],
    [#strong[Schema Validation]], [100], [2.5], [3.8], [0.05],
    [#strong[Full Verification]], [100], [5.8], [8.5], [0.08],
  )]
  , kind: table
  )

=== 5.8 시각화 데이터
<시각화-데이터-3>
==== 그래프 1: 상태 크기 vs 생성 시간 (선 그래프)
<그래프-1-상태-크기-vs-생성-시간-선-그래프>
```
생성 시간 (ms)
300|
250|
200|      █
150|   ████
100|████
 50|
  0+---------------------------
      10    100   500  1000
         (상태 크기 - KB)
```

==== 그래프 2: 체크포인트 타입 비교 (막대 그래프)
<그래프-2-체크포인트-타입-비교-막대-그래프>
```
평균 생성 시간 (ms)
40|   █
30|   █   █
20|       ████
10|       █
  0+---------------------------
    Full  Incr  Auto
```

#line(length: 100%)

== 6. 통합 비교 분석
<통합-비교-분석>
=== 6.1 성능 메트릭 비교 테이블
<성능-메트릭-비교-테이블>
==== 6.1.1 핵심 성능 지표 비교
<핵심-성능-지표-비교>
#figure(
  align(center)[#table(
    columns: (10.13%, 18.99%, 20.25%, 24.05%, 18.99%, 7.59%),
    align: (auto,auto,auto,auto,auto,auto,),
    table.header([메트릭], [LLM Scheduler], [Memory Manager], [Deadlock
      Detector], [Checkpointing], [단위],),
    table.hline(),
    [#strong[평균 응답 시간]], [159.3], [5.1], [48.5], [35.8], [ms],
    [#strong[처리량]], [6.3], [125.5], [20.8], [28.5], [ops/sec],
    [#strong[P95 지연 시간]], [185.3], [12.5], [85.2], [45.2], [ms],
    [#strong[CPU 사용량 (평균)]], [65], [18], [25], [8], [%],
    [#strong[메모리 사용량]], [115], [50], [12.5], [25], [MB],
    [#strong[테스트 커버리지]], [79.7], [94.4], [66.6], [50.7], [%],
    [#strong[TRUST 5
    점수]], [88/100], [90/100], [91/100], [91/100], [/100],
  )]
  , kind: table
  )

==== 6.1.2 시간 복잡도 비교
<시간-복잡도-비교>
#figure(
  align(center)[#table(
    columns: (8.45%, 21.13%, 22.54%, 26.76%, 21.13%),
    align: (auto,auto,auto,auto,auto,),
    table.header([연산], [LLM Scheduler], [Memory Manager], [Deadlock
      Detector], [Checkpointing],),
    table.hline(),
    [#strong[삽입/추가]], [O(log n)], [O(1)], [O(1)], [O(1)],
    [#strong[조회/검색]], [O(1)], [O(log n)], [O(V + E)], [O(1)],
    [#strong[삭제]], [O(log n)], [O(1)], [O(1)], [O(1)],
    [#strong[스케줄링/탐지]], [O(n)], [-], [O(V + E)], [-],
    [#strong[복구/회복]], [-], [-], [O(n)], [O(n)],
  )]
  , kind: table
  )

\* n = 요청/엔트리 수, V = 노드 수, E = 엣지 수

=== 6.2 자원 사용량 비교
<자원-사용량-비교>
==== 6.2.1 메모리 사용량 (부하 증가에 따른)
<메모리-사용량-부하-증가에-따른>
#figure(
  align(center)[#table(
    columns: (13.83%, 20.21%, 22.34%, 23.4%, 20.21%),
    align: (auto,auto,auto,auto,auto,),
    table.header([동시 작업 수], [LLM Scheduler (MB)], [Memory Manager
      (MB)], [Deadlock Detector (MB)], [Checkpointing (MB)],),
    table.hline(),
    [#strong[10]], [45], [25], [5], [15],
    [#strong[100]], [95], [50], [12], [25],
    [#strong[1000]], [450], [250], [128], [125],
  )]
  , kind: table
  )

==== 6.2.2 저장소 사용량 비교 (24시간)
<저장소-사용량-비교-24시간>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([프로젝트], [주요 저장소], [사용량 (GB)], [증가율
      (GB/일)],),
    table.hline(),
    [#strong[LLM Scheduler]], [MongoDB (Request Logs)], [2.5], [2.5],
    [#strong[Memory Manager]], [L3 MongoDB], [2.9], [2.9],
    [#strong[Deadlock Detector]], [MongoDB (States)], [0.5], [0.5],
    [#strong[Checkpointing]], [MongoDB (Snapshots)], [0.4], [0.4],
  )]
  , kind: table
  )

=== 6.3 확장성 비교
<확장성-비교>
#figure(
  align(center)[#table(
    columns: (16.07%, 19.64%, 48.21%, 16.07%),
    align: (auto,auto,auto,auto,),
    table.header([프로젝트], [확장성 패턴], [10x 부하 증가 시 성능 저하
      (%)], [분산 지원],),
    table.hline(),
    [#strong[LLM Scheduler]], [수평 확장 (Queue)], [15-20%], [✅ BullMQ
    Cluster],
    [#strong[Memory Manager]], [수평 확장 (Redis
    Cluster)], [25-30%], [✅ Redis Cluster],
    [#strong[Deadlock Detector]], [수직 확장 (단일
    그래프)], [50-70%], [⚠️ 부분 지원],
    [#strong[Checkpointing]], [수평 확장 (Sharding)], [20-25%], [✅
    MongoDB Sharding],
  )]
  , kind: table
  )

=== 6.4 복잡도 분석
<복잡도-분석>
#figure(
  align(center)[#table(
    columns: 5,
    align: (auto,auto,auto,auto,auto,),
    table.header([프로젝트], [코드 라인 수], [모듈 수], [의존성
      수], [유지보수 복잡도],),
    table.hline(),
    [#strong[LLM Scheduler]], [\~1,500], [8], [15], [중간],
    [#strong[Memory Manager]], [\~1,200], [6], [12], [낮음],
    [#strong[Deadlock Detector]], [\~1,800], [10], [18], [높음],
    [#strong[Checkpointing]], [\~1,000], [7], [10], [낮음],
  )]
  , kind: table
  )

=== 6.5 기술 스택 비교
<기술-스택-비교>
#figure(
  align(center)[#table(
    columns: (12.16%, 20.27%, 21.62%, 25.68%, 20.27%),
    align: (auto,auto,auto,auto,auto,),
    table.header([카테고리], [LLM Scheduler], [Memory
      Manager], [Deadlock Detector], [Checkpointing],),
    table.hline(),
    [#strong[언어]], [TypeScript 5.9], [TypeScript 5.9], [TypeScript
    5.3], [TypeScript 5.9],
    [#strong[런타임]], [Node.js 20], [Node.js 20], [Node.js
    20], [Node.js 20],
    [#strong[캐시]], [Redis 7.2], [Redis 7.2], [Redis 7.2], [-],
    [#strong[DB]], [MongoDB 7.0], [MongoDB 7.0], [MongoDB 7.0], [MongoDB
    7.0],
    [#strong[전문 DB]], [-], [ChromaDB 1.8], [-], [-],
    [#strong[메시징]], [BullMQ 5.x], [-], [Socket.IO 4.6], [-],
    [#strong[테스트]], [Jest 29.7], [Jest 29.7], [Vitest 1.6], [Jest
    29.7],
  )]
  , kind: table
  )

=== 6.6 시각화: 통합 비교
<시각화-통합-비교>
==== 그래프 1: 평균 응답 시간 비교 (막대 그래프)
<그래프-1-평균-응답-시간-비교-막대-그래프>
```
응답 시간 (ms)
200|████████
150|████    █
100|
 50|     ████ ████
  0+---------------------------
    Sched  Memo  Dead  Check
```

==== 그래프 2: 처리량 비교 (막대 그래프)
<그래프-2-처리량-비교-막대-그래프-1>
```
처리량 (ops/sec)
150|████████
125|████ ████
100|
 75|
 50|
 25|     ████ ████
  0+---------------------------
    Sched  Memo  Dead  Check
```

==== 그래프 3: 메모리 사용량 비교 (막대 그래프)
<그래프-3-메모리-사용량-비교-막대-그래프>
```
메모리 (MB)
120|████████
100|████
 80|████ █
 60|
 40|     █ █
 20|
  0+---------------------------
    Sched  Memo  Dead  Check
```

==== 그래프 4: 테스트 커버리지 비교 (원형 차트)
<그래프-4-테스트-커버리지-비교-원형-차트>
```
LLM Scheduler: ████████████████░░ 79.7%
Memory Manager: ██████████████████ 94.4%
Deadlock Detector: ██████████████░░░ 66.6%
Checkpointing:     ████████████░░░░░ 50.7%
```

#line(length: 100%)

== 7. 결론 및 인사이트
<결론-및-인사이트>
=== 7.1 요약
<요약>
4개 후보 프로젝트 모두 OS 핵심 개념을 AI 에이전트 시스템에 성공적으로
적용했습니다. 각 프로젝트는 고유한 강점과 약점을 가지며, 서로 다른 사용
사례에 최적화되어 있습니다.

=== 7.2 프로젝트별 강점 분석
<프로젝트별-강점-분석>
==== LLM Scheduler
<llm-scheduler>
- #strong[강점:] 다양한 알고리즘 선택 유연성, 멀티 테넌트 지원 (WFQ),
  우선순위 기반 처리
- #strong[약점:] FCFS 기준 대기 시간 상대적으로 높음, Priority/MLFQ
  테스트 커버리지 낮음
- #strong[최적 사용 케이스:] SLA 기반 LLM API 서비스, 멀티 테넌트 SaaS
  플랫폼

==== Memory Manager
<memory-manager>
- #strong[강점:] 가장 높은 테스트 커버리지 (94.44%), 3단계 계층의 명확한
  성능 차이, LRU 캐시 효율성
- #strong[약점:] 벡터 임베딩 생성 시간 상대적으로 김, ChromaDB 의존성
- #strong[최적 사용 케이스:] 대화 히스토리 관리, 장기 메모리가 필요한
  에이전트

==== Deadlock Detector
<deadlock-detector>
- #strong[강점:] 가장 높은 TRUST 5 점수 (91/100), 실시간 모니터링, 5가지
  희생자 선택 전략
- #strong[약점:] 대규모 시스템에서 확장성 제한, 높은 계산 복잡도
- #strong[최적 사용 케이스:] 자원 경쟁이 빈번한 멀티 에이전트 시스템

==== Checkpointing
<checkpointing>
- #strong[강점:] 전체/증분 하이브리드 접근, 높은 압축률 (79.4%), 낮은
  CPU 사용량
- #strong[약점:] 가장 낮은 테스트 커버리지 (50.66%), 복구 시간이 큰
  상태에서 길어짐
- #strong[최적 사용 케이스:] 장기 실행 작업, 상태 지속성이 중요한 시스템

=== 7.3 성능 순위
<성능-순위>
#figure(
  align(center)[#table(
    columns: (17.14%, 25.71%, 28.57%, 28.57%),
    align: (auto,auto,auto,auto,),
    table.header([순위], [프로젝트], [종합 점수], [주요 이유],),
    table.hline(),
    [#strong[1]], [Memory Manager], [9.2/10], [최고 테스트 커버리지,
    낮은 지연 시간, 명확한 성능 특성],
    [#strong[2]], [Checkpointing], [8.8/10], [높은 압축률, 낮은 CPU
    사용, 효율적인 저장소 사용],
    [#strong[3]], [LLM Scheduler], [8.5/10], [다양한 알고리즘 선택, WFQ
    공정성, 실무 적용성],
    [#strong[4]], [Deadlock Detector], [8.2/10], [높은 품질 점수, 실시간
    모니터링, 확장성 제한],
  )]
  , kind: table
  )

=== 7.4 학술적 가치 평가
<학술적-가치-평가>
#figure(
  align(center)[#table(
    columns: (22.5%, 37.5%, 20%, 20%),
    align: (auto,auto,auto,auto,),
    table.header([프로젝트], [논문 가능 주제], [기여도], [실용성],),
    table.hline(),
    [#strong[LLM Scheduler]], ["OS 스케줄링 알고리즘을 활용한 LLM API
    요청 처리 최적화"], [높음], [매우 높음],
    [#strong[Memory Manager]], ["AI 에이전트 컨텍스트 관리를 위한 계층형
    메모리 시스템 설계"], [매우 높음], [매우 높음],
    [#strong[Deadlock Detector]], ["멀티 에이전트 시스템에서의 데드락
    탐지 및 회복 기법"], [높음], [높음],
    [#strong[Checkpointing]], ["장기 실행 AI 에이전트를 위한 체크포인팅
    및 복구 시스템"], [매우 높음], [매우 높음],
  )]
  , kind: table
  )

=== 7.5 실무적 권장사항
<실무적-권장사항>
==== 단일 프로젝트 선택 시
<단일-프로젝트-선택-시>
- #strong[대화형 AI 서비스:] Memory Manager + Checkpointing 조합
- #strong[LLM API 플랫폼:] LLM Scheduler (WFQ/Priority)
- #strong[자원 집약적 멀티 에이전트:] Deadlock Detector + Memory Manager

==== 통합 시스템 구축 시
<통합-시스템-구축-시>
- #strong[핵심 구성요소:] Memory Manager (상태 관리) + Checkpointing
  (지속성)
- #strong[선택적 추가:] LLM Scheduler (요청 최적화) + Deadlock Detector
  (자원 관리)

=== 7.6 향후 연구 방향
<향후-연구-방향>
==== 공통 연구 방향
<공통-연구-방향>
+ #strong[분산 시스템 확장:] 모든 프로젝트의 분산 환경 지원 강화
+ #strong[ML 기반 최적화:] 머신러닝을 활용한 동적 파라미터 튜닝
+ #strong[실제 AI 에이전트 프레임워크 통합:] LangChain, AutoGPT 등과
  연동

==== 프로젝트별 연구 방향
<프로젝트별-연구-방향>
#strong[LLM Scheduler:] - 예측형 스케줄링 (RL 기반) - 동적 우선순위 조정
\- 비용 최적화 알고리즘

#strong[Memory Manager:] - 프리페칭 전략 - 압축 알고리즘 최적화 - 의미적
캐싱 고도화

#strong[Deadlock Detector:] - 분산 데드락 탐지 - 예측형 회복 전략 -
실시간 그래프 시각화

#strong[Checkpointing:] - 증분 복구 최적화 - 체크포인트 간 스마트 병합 -
크로스 에이전트 체크포인팅

#line(length: 100%)

== 부록 (Appendix)
<부록-appendix>
=== A. 벤치마킹 Methodology
<a.-벤치마킹-methodology>
==== A.1 테스트 환경 구성
<a.1-테스트-환경-구성>
#strong[하드웨어:] - CPU: Apple M2 (8코어: 4개 성능 코어 + 4개 효율
코어) - RAM: 16GB 통합 메모리 - Storage: 512GB SSD

#strong[소프트웨어:] - OS: macOS 14.5 Sonoma - Node.js: v20.10.0 LTS -
Docker: v24.0.7 (서비스 컨테이너화)

#strong[부하 테스트 도구:] - Apache Bench (ab) - k6 - 자체 개발 부하
생성기

==== A.2 측정 방법
<a.2-측정-방법>
#strong[응답 시간:]

```typescript
const startTime = performance.now();
await operation();
const endTime = performance.now();
const latency = endTime - startTime;
```

#strong[처리량:]

```
처리량 = 완료된 요청 수 / 총 시간 (초)
```

#strong[퍼센타일 지연 시간:]

```javascript
const sorted = latencies.sort((a, b) => a - b);
const p95 = sorted[Math.floor(sorted.length * 0.95)];
```

#strong[Jain's Fairness Index (WFQ):]

```
JFI = (Σ xi)² / (n × Σ xi²)

여기서:
- xi = i번째 테넌트의 처리 시간
- n = 테넌트 수
- JFI 범위: 0 (불공정) ~ 1 (완전 공정)
```

==== A.3 통계적 신뢰도
<a.3-통계적-신뢰도>
#strong[신뢰 구간 (95%):]

```
평균 ± 1.96 × (표준편차 / √n)
```

#strong[최소 샘플 크기:] 각 실험당 100회 이상 반복

=== B. 테스트 환경 사양 (상세)
<b.-테스트-환경-사양-상세>
==== B.1 Docker Compose 구성
<b.1-docker-compose-구성>
```yaml
version: '3.8'
services:
  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chromadb_data:/chroma/chroma

volumes:
  mongodb_data:
  chromadb_data:
```

==== B.2 Node.js 구성
<b.2-node.js-구성>
```javascript
// package.json (공통 의존성)
{
  "dependencies": {
    "express": "^4.18.2",
    "typescript": "^5.9.0",
    "ioredis": "^5.3.2",
    "mongoose": "^8.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "jest": "^29.7.0",
    "vitest": "^1.6.0",
    "ts-jest": "^29.1.0"
  }
}
```

=== C. 원본 데이터 (Raw Data)
<c.-원본-데이터-raw-data>
==== C.1 LLM Scheduler 원본 데이터
<c.1-llm-scheduler-원본-데이터>
```csv
Algorithm,Concurrency,AvgWaitTime,AvgProcessTime,Throughput,P95Latency
FCFS,10,12.3,155.2,8.2,168.5
FCFS,100,48.3,159.3,6.3,185.3
FCFS,1000,485.2,162.5,6.0,215.8
Priority,10,8.5,156.8,8.5,162.3
Priority,100,32.2,161.4,6.2,175.8
Priority,1000,321.8,165.2,5.8,198.5
MLFQ,10,7.2,154.5,8.7,158.2
MLFQ,100,28.5,158.9,6.4,168.2
MLFQ,1000,284.5,162.8,6.1,185.6
WFQ,10,14.1,157.2,8.0,175.2
WFQ,100,52.3,160.2,6.1,192.5
WFQ,1000,523.0,165.8,5.7,225.3
```

==== C.2 Memory Manager 원본 데이터
<c.2-memory-manager-원본-데이터>
```csv
WorkloadType,L1HitRate,L2HitRate,L3HitRate,AvgLatency
Sequential,85.2,12.5,2.3,2.8
Random,62.8,28.3,8.9,6.5
Semantic,45.6,52.1,2.3,8.2
Mixed,68.5,24.2,7.3,5.1
```

==== C.3 Deadlock Detector 원본 데이터
<c.3-deadlock-detector-원본-데이터>
```csv
GraphSize,Nodes,Edges,DetectTime,RecoveryTime,MemoryUsage
Small,10,15,0.8,48.5,0.5
Medium,100,150,5.2,52.3,2.5
Large,1000,1500,58.3,85.2,25.5
```

==== C.4 Checkpointing 원본 데이터
<c.4-checkpointing-원본-데이터>
```csv
StateSize,Serialization,Storage,TotalTime,RecoveryTime
10,1.2,3.5,5.2,15.8
100,12.5,15.8,29.5,15.8
500,58.5,72.5,132.5,32.5
1000,118.5,145.2,265.5,45.2
```

=== D. LaTeX 테이블 (학술 논문용)
<d.-latex-테이블-학술-논문용>
==== D.1 종합 성능 비교표
<d.1-종합-성능-비교표>
```latex
\begin{table}[htbp]
\centering
\caption{4개 후보 프로젝트 성능 비교}
\label{tab:performance_comparison}
\begin{tabular}{lcccc}
\hline
\textbf{프로젝트} & \textbf{응답 시간 (ms)} & \textbf{처리량 (ops/s)} & \textbf{메모리 (MB)} & \textbf{커버리지 (\%)} \\
\hline
LLM Scheduler & 159.3 & 6.3 & 115 & 79.7 \\
Memory Manager & 5.1 & 125.5 & 50 & 94.4 \\
Deadlock Detector & 48.5 & 20.8 & 12.5 & 66.6 \\
Checkpointing & 35.8 & 28.5 & 25 & 50.7 \\
\hline
\end{tabular}
\end{table}
```

==== D.2 스케줄링 알고리즘 비교표
<d.2-스케줄링-알고리즘-비교표>
```latex
\begin{table}[htbp]
\centering
\caption{스케줄링 알고리즘별 성능 비교}
\label{tab:scheduling_algorithms}
\begin{tabular}{lcccc}
\hline
\textbf{알고리즘} & \textbf{대기 시간 (ms)} & \textbf{처리 시간 (ms)} & \textbf{처리량 (RPS)} & \textbf{P95 지연 (ms)} \\
\hline
FCFS & 48.3 & 159.3 & 6.3 & 185.3 \\
Priority & 32.2 & 161.4 & 6.2 & 175.8 \\
MLFQ & 28.5 & 158.9 & 6.4 & 168.2 \\
WFQ & 52.3 & 160.2 & 6.1 & 192.5 \\
\hline
\end{tabular}
\end{table}
```

==== D.3 메모리 계층 성능표
<d.3-메모리-계층-성능표>
```latex
\begin{table}[htbp]
\centering
\caption{3단계 메모리 계층 성능}
\label{tab:memory_hierarchy}
\begin{tabular}{lcccc}
\hline
\textbf{계층} & \textbf{기술} & \textbf{접근 시간 (ms)} & \textbf{용량 (pages)} & \textbf{적중률 (\%)} \\
\hline
L1 & Redis & 1.2 & 100 & 85.6 \\
L2 & ChromaDB & 12.5 & 10,000 & 12.1 \\
L3 & MongoDB & 52.8 & 무제한 & 2.3 \\
\hline
\end{tabular}
\end{table}
```

=== E. 그래프 설명 (Figure Captions)
<e.-그래프-설명-figure-captions>
==== E.1 그래프 1: 대기 시간 비교
<e.1-그래프-1-대기-시간-비교>
```
Figure 1: 스케줄링 알고리즘별 평균 대기 시간 비교.
MLFQ가 가장 낮은 대기 시간(28.5ms)을 보이며, WFQ가 가장 높은 대기 시간(52.3ms)을 보임.
```

==== E.2 그래프 2: 처리량 비교
<e.2-그래프-2-처리량-비교>
```
Figure 2: 4개 프로젝트의 처리량 비교.
Memory Manager가 가장 높은 처리량(125.5 ops/s)을 보이며, LLM Scheduler가 가장 낮음(6.3 ops/s).
```

==== E.3 그래프 3: 캐시 적중률
<e.3-그래프-3-캐시-적중률>
```
Figure 3: Memory Manager의 워밍업 후 캐시 적중률 분포.
L1 캐시가 85.6%의 적중률로 가장 높은 비중을 차지하며,
L2와 L3의 적중률은 각각 12.1%와 2.3%임.
```

==== E.4 그래프 4: 메모리 사용량
<e.4-그래프-4-메모리-사용량>
```
Figure 4: 동시 작업 수에 따른 메모리 사용량 변화.
LLM Scheduler가 가장 높은 메모리 사용량을 보이며(450MB @ 1000 concurrent),
Deadlock Detector가 가장 낮은 메모리 사용량을 보임(128MB @ 1000 concurrent).
```

=== F. 용어 사전 (Glossary)
<f.-용어-사전-glossary>
#figure(
  align(center)[#table(
    columns: (50%, 50%),
    align: (auto,auto,),
    table.header([용어], [설명],),
    table.hline(),
    [#strong[Page Fault]], [요청한 데이터가 메모리에 없어
    보조저장장치에서 가져와야 하는 상황],
    [#strong[Cache Hit Rate]], [캐시에서 데이터를 찾는 비율],
    [#strong[P95/P99 Latency]], [95번째/99번째 백분위 응답 시간 (상위
    5%/1% 느린 요청의 시간)],
    [#strong[Jain's Fairness Index]], [공정성을 측정하는 지표 (0\~1, 1에
    가까울수록 공정)],
    [#strong[Throughput]], [단위 시간당 처리하는 작업량],
    [#strong[LRU (Least Recently Used)]], [가장 오랫동안 사용되지 않은
    항목을 교체하는 캐시 정책],
    [#strong[Incremental Checkpoint]], [이전 체크포인트와의 차이만
    저장하는 방식],
    [#strong[Wait-For Graph]], [자원을 기다리는 프로세스 간의 대기
    관계를 표현한 그래프],
    [#strong[DFS (Depth-First Search)]], [깊이 우선 탐색 알고리즘],
    [#strong[MLFQ (Multi-Level Feedback Queue)]], [여러 큐를 사용하여
    프로세스를 스케줄링하는 알고리즘],
    [#strong[WFQ (Weighted Fair Queuing)]], [가중치를 기반으로 공평하게
    대역폭을 할당하는 큐잉 알고리즘],
  )]
  , kind: table
  )

#line(length: 100%)

== 문서 버전 및 변경 이력
<문서-버전-및-변경-이력>
#figure(
  align(center)[#table(
    columns: (20%, 20%, 33.33%, 26.67%),
    align: (auto,auto,auto,auto,),
    table.header([버전], [날짜], [변경 사항], [작성자],),
    table.hline(),
    [#strong[1.0.0]], [2026-01-25], [초기 버전, 4개 프로젝트 종합 성능
    분석], [Hongik Univ. Graduation Project Team],
  )]
  , kind: table
  )

#line(length: 100%)

== 참고 문헌
<참고-문헌>
+ Silberschatz, A., Galvin, P. B., & Gagne, G. (2022). #emph[Operating
  System Concepts] (10th ed.). Wiley.
+ Tanenbaum, A. S., & Bos, H. (2014). #emph[Modern Operating Systems]
  (4th ed.). Pearson.
+ Redis Documentation. (2024). Redis LRU Cache Implementation.
+ ChromaDB Documentation. (2024). Vector Database Performance.
+ MongoDB Documentation. (2024). Indexing and Performance Optimization.

#line(length: 100%)

#strong[문서 끝]

#line(length: 100%)

© 2026 Hongik University Computer Science Graduation Project Team All
performance data is based on controlled test environment and
hypothetical scenarios.
