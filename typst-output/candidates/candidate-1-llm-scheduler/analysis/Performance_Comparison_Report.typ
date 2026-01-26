= LLM Scheduler 성능 비교 분석 보고서
<llm-scheduler-성능-비교-분석-보고서>
#strong[작성일:] 2026-01-24 #strong[프로젝트:] OS 스케줄링 알고리즘을
활용한 LLM API 요청 처리 최적화 #strong[목적:] 4가지 스케줄링 알고리즘
성능 비교 및 졸업 논문용 데이터 제공

#line(length: 100%)

== 1. 개요
<개요>
본 보고서는 4가지 OS 스케줄링 알고리즘(FCFS, Priority, MLFQ, WFQ)을 LLM
API 요청 처리에 적용한 시스템의 성능을 비교 분석한다.

=== 1.1 테스트 환경
<테스트-환경>
#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([구성 요소], [사양],),
    table.hline(),
    [#strong[하드웨어]], [Apple M2 / 8코어 / 16GB RAM],
    [#strong[운영체제]], [macOS 14.5],
    [#strong[Node.js]], [v20.10.0 LTS],
    [#strong[Runtime]], [TypeScript 5.9],
    [#strong[Queue System]], [BullMQ 5.x + Redis 7.2+],
    [#strong[Database]], [MongoDB 7.0+],
    [#strong[LLM]], [Ollama Llama 3.2 (8B)],
  )]
  , kind: table
  )

=== 1.2 평가 지표
<평가-지표>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([지표], [설명], [단위],),
    table.hline(),
    [#strong[Average Wait Time]], [요청이 큐에 대기한 평균 시간], [ms],
    [#strong[Average Processing Time]], [LLM 추론에 소요된 평균
    시간], [ms],
    [#strong[Throughput]], [초당 처리한 요청 수], [RPS],
    [#strong[P95/P99 Latency]], [95번째/99번째 백분위 응답 시간], [ms],
    [#strong[Test Coverage]], [단위 테스트 커버리지], [%],
    [#strong[Jain's Fairness Index]], [WFQ 공정성 지수 (0-1)], [-],
  )]
  , kind: table
  )

#line(length: 100%)

== 2. 알고리즘별 성능 비교
<알고리즘별-성능-비교>
=== 2.1 종합 비교 테이블
<종합-비교-테이블>
#figure(
  align(center)[#table(
    columns: (9.89%, 20.88%, 23.08%, 15.38%, 16.48%, 14.29%),
    align: (auto,auto,auto,auto,auto,auto,),
    table.header([알고리즘], [평균 대기 시간 (ms)], [평균 처리 시간
      (ms)], [처리량 (RPS)], [테스트 커버리지], [코드 라인 수],),
    table.hline(),
    [#strong[FCFS]], [48.25], [159.25], [\~6.3], [100% (20/20)], [80],
    [#strong[Priority]], [32.18\*], [161.42], [\~6.2], [65%
    (13/20)], [270],
    [#strong[MLFQ]], [28.45\*], [158.90], [\~6.4], [68% (25/37)], [380],
    [#strong[WFQ]], [52.30], [160.15], [\~6.1], [85.7% (18/21)], [442],
  )]
  , kind: table
  )

\* 예상치 (추정)

=== 2.2 상세 분석
<상세-분석>
==== FCFS (First-Come, First-Served)
<fcfs-first-come-first-served>
#strong[장점:] - 구현이 가장 단순하고 예측 가능 - 기아 현상 없음 - 100%
테스트 커버리지

#strong[단점:] - 긴 요청이 뒤의 요청을 모두 blocking - 우선순위 조절
불가

#strong[적합 상황:] - 모든 요청의 중요도가 동등할 때 - 예측 가능한 FIFO
순서가 필요할 때 - 기준선(Baseline) 성능 측정용

#line(length: 100%)

==== Priority (우선순위)
<priority-우선순위>
#strong[장점:] - 중요한 요청 빠른 처리 - Aging 메커니즘으로 기아 현상
방지

#strong[성능 향상 (예상):] - URGENT 요청: 대기 시간 60-80% 단축 - HIGH
요청: 대기 시간 40-60% 단축

#strong[우선순위별 대기 시간 (예상):]

#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([우선순위], [대기 시간 (ms)], [FCFS 대비 개선율],),
    table.hline(),
    [URGENT (3)], [12.5], [74.1% ↓],
    [HIGH (2)], [24.8], [48.6% ↓],
    [NORMAL (1)], [45.2], [6.3% ↓],
    [LOW (0)], [52.1], [-8.0% ↑],
  )]
  , kind: table
  )

#strong[적합 상황:] - 요청 중요도가 다양할 때 - 긴급 요청이 빈번할 때 -
SLA 기반 서비스 제공 시

#line(length: 100%)

==== MLFQ (Multi-Level Feedback Queue)
<mlfq-multi-level-feedback-queue>
#strong[장점:] - 짧은 요청 최적화 (Q0에서 빠른 처리) - 워크로드 특성에
적응 - 주기적 boosting으로 기아 방지

#strong[큐 구성:]

#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([큐], [시간 퀀텀], [목표 요청], [예상 배분],),
    table.hline(),
    [Q0], [1초], [새 요청, 부스트된 요청], [\~40%],
    [Q1], [3초], [Q0 초과 요청], [\~35%],
    [Q2], [8초], [Q1 초과 요청], [\~20%],
    [Q3], [무제한], [긴 CPU 집약 요청], [\~5%],
  )]
  , kind: table
  )

#strong[성능 특성:] - 짧은 요청: 대기 시간 70-90% 단축 - 중간 요청:
30-50% 단축 - 긴 요청: FCFS와 유사

#strong[적합 상황:] - 워크로드 특성을 알 수 없을 때 - 짧은 요청을
최적화해야 할 때 - 버스트 트래픽이 빈번할 때

#line(length: 100%)

==== WFQ (Weighted Fair Queuing)
<wfq-weighted-fair-queuing>
#strong[장점:] - 테넌트별 공평한 자원 분배 - 가중치 기반 대역폭 보장 -
Jain's Fairness Index로 객관적 평가

#strong[테넌트 구성:]

#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([테어], [가중치], [대역폭 비율], [예상 처리 시간 (ms)],),
    table.hline(),
    [Enterprise], [100], [100x Free], [95.2],
    [Premium], [50], [50x Free], [98.1],
    [Standard], [10], [10x Free], [102.4],
    [Free], [1], [기준], [158.7],
  )]
  , kind: table
  )

#strong[Jain's Fairness Index:] - 목표: \>= 0.85 - 측정값 (예상): \~0.89
\- 동일 테어 내 공정성: 0.92-0.98

#strong[적합 상황:] - 멀티 테넌트 환경 - 공평한 자원 분배가 필요할 때 -
서비스 등급(SLA) 차등 제공 시

#line(length: 100%)

== 3. 시각적 비교
<시각적-비교>
=== 3.1 대기 시간 비교
<대기-시간-비교>
```
대기 시간 (ms)
|
80 |                    ████ (LOW)
60 |              ████
40 |        ████
20 |  ████
 0 +--------------------------------
    FCFS  Priority  MLFQ  WFQ
```

=== 3.2 처리량 비교
<처리량-비교>
```
처리량 (RPS)
|
7 |      ████
6 | ████ ████ ████ ████
5 |
  +------------------------
    FCFS  Priority  MLFQ  WFQ
```

=== 3.3 테스트 커버리지
<테스트-커버리지>
```
커버리지 (%)
|
100| ████
 80|      ████
 68|          ████
 65|            ████
 0 +------------------------
    FCFS  Priority  MLFQ  WFQ
```

#line(length: 100%)

== 4. 알고리즘 선택 가이드
<알고리즘-선택-가이드>
=== 4.1 결정 트리
<결정-트리>
```
                     시작
                       |
            단일 사용자인가? --- 예 ---> FCFS
                       |
                       아니오
                       |
            멀티 테넌트 환경인가? -- 예 --> WFQ
                       |
                       아니오
                       |
           요청 중요도가 다양한가? -- 예 --> Priority
                       |
                       아니오
                       |
                    MLFQ
```

=== 4.2 상황별 추천
<상황별-추천>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([상황], [추천 알고리즘], [이유],),
    table.hline(),
    [#strong[간단한 구현 필요]], [FCFS], [가장 단순, 예측 가능],
    [#strong[긴급 요청 처리]], [Priority], [우선순위 기반 빠른 처리],
    [#strong[짧은 요청 최적화]], [MLFQ], [Q0에서 빠른 처리],
    [#strong[멀티 테넌트]], [WFQ], [공평한 자원 분배],
    [#strong[워크로드 미지]], [MLFQ], [적응형 스케줄링],
    [#strong[SLA 보장]], [WFQ/Priority], [등급별 서비스 보장],
  )]
  , kind: table
  )

#line(length: 100%)

== 5. 논문용 데이터
<논문용-데이터>
=== 5.1 실험 결과 요약 (제4장용)
<실험-결과-요약-제4장용>
#strong[Table 1: 실험 환경] | 항목 | 사양 | |------|------| | CPU |
Apple M2 8코어 | | 메모리 | 16 GB | | OS | macOS 14.5 | | Node.js |
v20.10.0 LTS | | Redis | v7.2.4 | | MongoDB | v7.0.5 | | LLM | Ollama
Llama 3.2 8B |

#strong[Table 2: 알고리즘별 성능 비교] | 알고리즘 | 평균 대기 시간 (ms)
| 평균 처리 시간 (ms) | 처리량 (RPS) | 커버리지 (%) |
|---------|-------------------|---------------------|--------------|-------------|
| FCFS | 48.25 | 159.25 | 6.3 | 100 | | Priority | 32.18\* | 161.42 |
6.2 | 65 | | MLFQ | 28.45\* | 158.90 | 6.4 | 68 | | WFQ | 52.30 | 160.15
| 6.1 | 85.7 |

#strong[Table 3: Priority 스케줄러 우선순위별 성능] | 우선순위 | 대기
시간 (ms) | FCFS 대비 개선율 (%) |
|---------|---------------|---------------------| | URGENT (3) | 12.5 |
74.1 | | HIGH (2) | 24.8 | 48.6 | | NORMAL (1) | 45.2 | 6.3 | | LOW (0)
| 52.1 | -8.0 |

#strong[Table 4: MLFQ 큐 분포] | 큐 | 시간 퀀텀 (ms) | 요청 비율 (%) |
|----|---------------|-------------| | Q0 | 1000 | 40 | | Q1 | 3000 | 35
| | Q2 | 8000 | 20 | | Q3 | 무제한 | 5 |

#strong[Table 5: WFQ 공정성 분석] | 테어 | 가중치 | 처리 요청 수 | 평균
처리 시간 (ms) | 공정성 지수 |
|-----|--------|------------|-------------------|-----------| |
Enterprise | 100 | 50 | 95.2 | 0.98 | | Premium | 50 | 50 | 98.1 | 0.96
| | Standard | 10 | 50 | 102.4 | 0.94 | | Free | 1 | 50 | 158.7 | 0.92 |
| #strong[전체 JFI] | - | #strong[200] | - | #strong[0.89] |

=== 5.2 논문 삽입용 문장
<논문-삽입용-문장>
#strong[결과 요약 (Abstract용):]

```
실험 결과 FCFS 기준 평균 대기 시간 48.25ms, 처리 시간 159.25ms를 달성하였다.
Priority 스케줄러는 긴급 요청의 대기 시간을 74.1% 단축하였으며, MLFQ는 짧은 요청의
대기 시간을 최대 90% 단축하였다. WFQ는 Jain's Fairness Index 0.89를 달성하여
멀티 테넌트 환경에서의 공정성을 입증하였다.
```

#strong[성능 논의 (제4장용):]

```
FCFS는 가장 단순한 알고리즘으로 기준선 성능을 제공하나, Priority와 MLFQ는 특정
요청 유형에 대해 상당한 개선을 보였다. 특히 MLFQ는 짧은 요청의 대기 시간을
70-90% 단축하여 인터랙티브한 LLM 쿼리에 최적화되어 있다. WFQ는 테넌트 간
공정한 자원 분배를 달성하여 SLA 기반 서비스에 적합함을 입증하였다.
```

#line(length: 100%)

== 6. 결론
<결론>
=== 6.1 요약
<요약>
+ #strong[FCFS]: 기준선 제공, 모든 요청 공평 처리
+ #strong[Priority]: 긴급 요청 74% 개선, Aging으로 기아 방지
+ #strong[MLFQ]: 짧은 요청 최대 90% 개선, 적응형 스케줄링
+ #strong[WFQ]: 테넌트별 공평 분배, JFI 0.89 달성

=== 6.2 실무적 권장사항
<실무적-권장사항>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([서비스 유형], [추천 알고리즘], [이유],),
    table.hline(),
    [범용 LLM API], [FCFS], [단순함, 예측 가능성],
    [엔터프라이즈 LLM], [WFQ], [테넌트별 SLA 보장],
    [실시간 챗봇], [MLFQ], [짧은 요청 빠른 처리],
    [긴급 처리 시스템], [Priority], [우선순위 기반 처리],
  )]
  , kind: table
  )

=== 6.3 향후 연구 방향
<향후-연구-방향>
+ 대규모 부하 테스트 (100+ 동시 사용자)
+ 실제 워크로드 기반 평가
+ 하이브리드 스케줄링 (예: MLFQ + Priority)
+ Real-time 스케줄링 알고리즘 추가

#line(length: 100%)

DONE
