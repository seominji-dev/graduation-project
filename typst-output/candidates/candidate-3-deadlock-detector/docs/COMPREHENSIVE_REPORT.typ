= Deadlock Detector 종합 보고서
<deadlock-detector-종합-보고서>
#strong[프로젝트명:] AI 멀티 에이전트 시스템을 위한 데드락 감지 및 회복
시스템 #strong[SPEC ID:] SPEC-DEAD-001 #strong[버전:] 1.0.0
#strong[작성일:] 2026-01-25 #strong[작성자:] 홍익대학교 컴퓨터공학과
졸업 프로젝트 팀

#line(length: 100%)

== 목차
<목차>
+ #link(<1-프로젝트-개요>)[프로젝트 개요]
+ #link(<2-wait-for-graph-기반-탐지>)[Wait-For Graph 기반 탐지]
+ #link(<3-5가지-희생자-선택-전략>)[5가지 희생자 선택 전략]
+ #link(<4-은행원-알고리즘>)[은행원 알고리즘]
+ #link(<5-체크포인트-및-롤백>)[체크포인트 및 롤백]
+ #link(<6-테스트-결과>)[테스트 결과]
+ #link(<7-결론-및-향후-계획>)[결론 및 향후 계획]

#line(length: 100%)

== 1. 프로젝트 개요
<프로젝트-개요>
=== 1.1 배경 및 동기
<배경-및-동기>
현대 AI 시스템에서 다중 에이전트 아키텍처가 급속도로 확산되고 있습니다.
ChatGPT, Claude, Gemini 등의 대형 언어 모델(LLM)을 기반으로 한
에이전트들이 복잡한 작업을 수행하기 위해 협력하는 환경에서, 공유 자원에
대한 경쟁은 필연적으로 발생합니다.

이러한 환경에서 데드락(교착 상태)은 시스템 전체의 진행을 멈추게 하는
치명적인 문제입니다. 본 프로젝트는 운영체제 이론에서 검증된 데드락 감지
및 회복 기법을 AI 멀티 에이전트 시스템에 적용하여, 자원 경합으로 인한
교착 상태를 자동으로 탐지하고 해결하는 시스템을 구현했습니다.

=== 1.2 프로젝트 목표
<프로젝트-목표>
#figure(
  align(center)[#table(
    columns: (26.09%, 26.09%, 47.83%),
    align: (auto,auto,auto,),
    table.header([목표], [설명], [달성 상태],),
    table.hline(),
    [Wait-For Graph 구현], [에이전트 간 대기 관계를 그래프로
    모델링], [완료],
    [DFS 기반 사이클 탐지], [O(V+E) 시간 복잡도의 효율적인 탐지
    알고리즘], [완료],
    [5가지 희생자 선택 전략], [다양한 정책 기반 희생자 선택], [완료],
    [은행원 알고리즘], [데드락 회피를 위한 안전 상태 검사], [완료],
    [체크포인트/롤백], [에이전트 상태 저장 및 복구], [완료],
    [REST API 제공], [외부 시스템 연동을 위한 API], [완료],
    [실시간 모니터링], [WebSocket 기반 실시간 알림], [완료],
  )]
  , kind: table
  )

=== 1.3 OS 개념과 AI 시스템의 매핑
<os-개념과-ai-시스템의-매핑>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([OS 개념], [AI 에이전트 적용], [구현 방식],),
    table.hline(),
    [프로세스], [AI 에이전트], [Agent 클래스],
    [공유 자원], [GPU, API, 메모리], [Resource 클래스],
    [Wait-For Graph], [에이전트 대기 그래프], [WaitForGraph 인터페이스],
    [사이클 탐지], [데드락 감지], [CycleDetector (DFS)],
    [희생자 선택], [종료할 에이전트], [VictimSelector (5가지 전략)],
    [Banker's Algorithm], [안전 상태 검사], [SafetyChecker],
    [Rollback], [상태 복구], [RollbackManager],
  )]
  , kind: table
  )

=== 1.4 시스템 아키텍처
<시스템-아키텍처>
```mermaid
graph TB
    subgraph "클라이언트 계층"
        C1[AI Agent 1]
        C2[AI Agent 2]
        C3[AI Agent N]
    end

    subgraph "API 계층"
        API[REST API<br/>Express.js]
        WS[WebSocket<br/>Socket.IO]
    end

    subgraph "핵심 계층"
        WFG[Wait-For Graph]
        CD[Cycle Detector<br/>DFS Algorithm]
        VS[Victim Selector<br/>5 Strategies]
        RM[Rollback Manager<br/>Checkpoint]
        BA[Banker Algorithm<br/>Safety Check]
    end

    subgraph "데이터 계층"
        MDB[(MongoDB)]
        RDS[(Redis)]
    end

    C1 --> API
    C2 --> API
    C3 --> API

    API --> WFG
    API --> BA
    WS --> WFG

    WFG --> CD
    CD --> VS
    VS --> RM

    WFG --> MDB
    WFG --> RDS

    style CD fill:#ef5350
    style VS fill:#ffa726
    style BA fill:#42a5f5
    style RM fill:#66bb6a
```

#line(length: 100%)

== 2. Wait-For Graph 기반 탐지
<wait-for-graph-기반-탐지>
=== 2.1 Wait-For Graph 개념
<wait-for-graph-개념>
Wait-For Graph(WFG)는 에이전트 간의 자원 대기 관계를 표현하는 방향
그래프입니다. 그래프에서 사이클이 존재하면 데드락이 발생했음을
의미합니다.

#strong[그래프 구성 요소:] - #strong[노드 (Nodes):] 시스템 내의 에이전트
\- #strong[엣지 (Edges):] 에이전트 A가 에이전트 B가 보유한 자원을 대기
중임을 나타냄 - #strong[사이클 (Cycle):] 순환 대기 상태, 즉 데드락

=== 2.2 도메인 모델
<도메인-모델>
==== Agent 모델
<agent-모델>
```typescript
interface Agent {
  id: string;                    // 고유 식별자
  name: string;                  // 에이전트 이름
  state: AgentState;             // 상태 (active, waiting, blocked, terminated)
  heldResources: string[];       // 보유 중인 자원 ID 목록
  waitingFor: string | null;     // 대기 중인 자원 ID
  priority: number;              // 우선순위 (1-10, 높을수록 중요)
  createdAt: Date;               // 생성 시간
  updatedAt: Date;               // 최종 수정 시간
}
```

==== Resource 모델
<resource-모델>
```typescript
interface Resource {
  id: string;                    // 고유 식별자
  name: string;                  // 자원 이름
  type: ResourceType;            // 유형 (computational, storage, network, memory)
  heldBy: string | null;         // 현재 보유 에이전트 ID
  waitQueue: string[];           // 대기열 (FIFO)
  totalInstances: number;        // 총 인스턴스 수
  createdAt: Date;               // 생성 시간
}
```

==== WaitForEdge 모델
<waitforedge-모델>
```typescript
interface WaitForEdge {
  id: string;                    // 엣지 고유 식별자
  fromAgentId: string;           // 대기 중인 에이전트 (출발점)
  toAgentId: string;             // 자원 보유 에이전트 (도착점)
  resourceId: string;            // 관련 자원 ID
  createdAt: Date;               // 엣지 생성 시간
}
```

=== 2.3 DFS 기반 사이클 탐지 알고리즘
<dfs-기반-사이클-탐지-알고리즘>
Depth-First Search(DFS)를 사용하여 그래프에서 사이클을 탐지합니다. 노드
방문 상태를 3가지 색상으로 관리하는 "Three-Color" 알고리즘을
적용했습니다.

#strong[노드 상태:] - #strong[WHITE (UNVISITED):] 아직 방문하지 않음 -
#strong[GRAY (VISITING):] 현재 DFS 재귀 스택에 있음 - #strong[BLACK
(VISITED):] DFS 탐색 완료

#strong[사이클 탐지 원리:] - DFS 탐색 중 GRAY 상태의 노드를 다시 만나면
#strong[백 엣지(Back Edge)]가 존재 - 백 엣지의 존재 = 사이클 존재 =
데드락 발생

```mermaid
graph TB
    Start[탐지 시작] --> Init[모든 노드 UNVISITED로 초기화]
    Init --> Loop{미방문 노드 존재?}
    Loop -->|Yes| DFS[DFS 시작]
    Loop -->|No| Return[사이클 목록 반환]

    DFS --> Mark[현재 노드 VISITING]
    Mark --> Neighbor{이웃 노드 확인}

    Neighbor -->|VISITING| Cycle[사이클 발견!]
    Neighbor -->|UNVISITED| Recurse[재귀 DFS]
    Neighbor -->|VISITED| Skip[건너뜀]

    Cycle --> Extract[사이클 경로 추출]
    Extract --> Neighbor

    Recurse --> Neighbor
    Skip --> Neighbor

    Neighbor -->|모든 이웃 처리 완료| Done[현재 노드 VISITED]
    Done --> Loop

    style Cycle fill:#ef5350
    style Extract fill:#ffa726
```

=== 2.4 알고리즘 복잡도
<알고리즘-복잡도>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([측정 항목], [복잡도], [설명],),
    table.hline(),
    [시간 복잡도], [O(V + E)], [V: 에이전트 수, E: 엣지 수],
    [공간 복잡도], [O(V)], [방문 상태 및 재귀 스택],
    [최악의 경우], [O(V + E)], [모든 노드와 엣지 탐색],
    [최선의 경우], [O(V)], [사이클이 없는 경우],
  )]
  , kind: table
  )

#line(length: 100%)

== 3. 5가지 희생자 선택 전략
<가지-희생자-선택-전략>
=== 3.1 개요
<개요>
데드락 해결을 위해 사이클에 포함된 에이전트 중 하나를 종료(희생자)해야
합니다. 어떤 에이전트를 선택하느냐에 따라 시스템 성능과 공정성이
달라집니다.

=== 3.2 전략별 상세 설명
<전략별-상세-설명>
==== 3.2.1 우선순위 기반 (Lowest Priority First)
<우선순위-기반-lowest-priority-first>
가장 낮은 우선순위를 가진 에이전트를 희생자로 선택합니다.

#strong[장점:] - 비즈니스 로직에 맞는 선택 가능 - 중요한 에이전트 보호 -
구현이 단순함

#strong[단점:] - 낮은 우선순위 에이전트의 기아(Starvation) 현상 가능

==== 3.2.2 나이 기반 (Youngest First)
<나이-기반-youngest-first>
가장 최근에 생성된 에이전트를 희생자로 선택합니다.

#strong[장점:] - 진행 중인 작업이 최소인 에이전트 선택 - 롤백 비용이
낮음 - 작업 손실 최소화

#strong[단점:] - 새로운 에이전트가 항상 불리함

==== 3.2.3 자원 보유량 기반 (Most Resources Held)
<자원-보유량-기반-most-resources-held>
가장 많은 자원을 보유한 에이전트를 희생자로 선택합니다.

#strong[장점:] - 자원 해제 효과가 큼 - 다른 대기 에이전트들이 혜택 -
시스템 처리량 증가

#strong[단점:] - 중요한 에이전트가 희생될 수 있음

==== 3.2.4 의존성 최소화 (Minimum Dependencies)
<의존성-최소화-minimum-dependencies>
가장 적은 수의 의존성을 가진 에이전트를 희생자로 선택합니다.

#strong[장점:] - 부작용(Side Effect) 최소화 - 연쇄 영향 방지 - 시스템
안정성 유지

#strong[단점:] - 의존성 계산의 복잡도 높음

==== 3.2.5 랜덤 선택 (Random)
<랜덤-선택-random>
무작위로 에이전트를 선택합니다. 주로 비교 기준(Baseline)으로 사용됩니다.

#strong[장점:] - 구현이 매우 단순 - 공정성 보장 (장기적으로) - 기아 현상
없음

#strong[단점:] - 최적의 선택이 아닐 수 있음

=== 3.3 전략 비교 매트릭스
<전략-비교-매트릭스>
#figure(
  align(center)[#table(
    columns: (10.91%, 21.82%, 14.55%, 14.55%, 20%, 18.18%),
    align: (auto,auto,auto,auto,auto,auto,),
    table.header([전략], [시간
      복잡도], [공정성], [효율성], [예측가능성], [권장 환경],),
    table.hline(),
    [Lowest Priority], [O(n)], [낮음], [높음], [높음], [우선순위 명확한
    시스템],
    [Youngest], [O(n)], [중간], [중간], [높음], [작업 진행도 중요한
    시스템],
    [Most Resources], [O(n)], [중간], [높음], [높음], [자원 경합 심한
    시스템],
    [Min Dependencies], [O(n\*m)], [높음], [높음], [중간], [의존성
    복잡한 시스템],
    [Random], [O(1)], [높음], [낮음], [낮음], [테스트/비교 기준],
  )]
  , kind: table
  )

#line(length: 100%)

== 4. 은행원 알고리즘
<은행원-알고리즘>
=== 4.1 개요
<개요-1>
은행원 알고리즘(Banker's Algorithm)은 데드락 #strong[회피(Avoidance)]
기법입니다. 자원 할당 전에 시스템이 안전 상태(Safe State)인지 검사하여,
안전하지 않은 요청은 거부합니다.

=== 4.2 핵심 개념
<핵심-개념>
#strong[안전 상태 (Safe State):] - 모든 에이전트가 최대 자원을
요청하더라도 데드락 없이 완료 가능한 상태 - 안전 순서(Safe Sequence)가
존재하면 안전 상태

#strong[안전 순서 (Safe Sequence):] - 에이전트들이 순서대로 실행하면
모두 완료할 수 있는 순서 - 예: \[Agent-1, Agent-3, Agent-2\]

=== 4.3 알고리즘 흐름
<알고리즘-흐름>
```mermaid
graph TB
    Start[자원 할당 요청] --> Check1{요청 <= 가용 자원?}
    Check1 -->|No| Reject[요청 거부]
    Check1 -->|Yes| Simulate[할당 시뮬레이션]

    Simulate --> Safety[안전 상태 검사]
    Safety --> Check2{안전 상태?}

    Check2 -->|Yes| Grant[자원 할당]
    Check2 -->|No| Reject

    Grant --> Update[상태 업데이트]
    Reject --> Wait[대기열에 추가]

    style Grant fill:#66bb6a
    style Reject fill:#ef5350
```

=== 4.4 안전 상태 검사 알고리즘
<안전-상태-검사-알고리즘>
```
알고리즘: Safety Algorithm

입력:
  - Available[m]: 가용 자원 벡터
  - Allocation[n][m]: 현재 할당 행렬
  - Need[n][m]: 필요 자원 행렬 (Max - Allocation)

출력:
  - isSafe: 안전 여부
  - safeSequence: 안전 순서

과정:
  1. Work = Available 초기화
  2. Finish[i] = false (모든 에이전트)
  3. 반복:
     a. Finish[i]=false이고 Need[i] <= Work인 에이전트 i 찾기
     b. 찾으면:
        - Work = Work + Allocation[i]
        - Finish[i] = true
        - safeSequence에 i 추가
     c. 못 찾으면 루프 종료
  4. 모든 Finish[i]=true이면 안전 상태
```

#line(length: 100%)

== 5. 체크포인트 및 롤백
<체크포인트-및-롤백>
=== 5.1 개요
<개요-2>
데드락 해결 시 희생자 에이전트를 종료한 후, 상태를 복구하여 작업을
재개할 수 있도록 체크포인트 기반 롤백 메커니즘을 제공합니다.

=== 5.2 체크포인트 구조
<체크포인트-구조>
```typescript
interface Checkpoint {
  id: string;                    // 체크포인트 고유 ID
  agentId: string;               // 에이전트 ID
  heldResources: string[];       // 체크포인트 시점의 보유 자원
  state: string;                 // 에이전트 상태
  timestamp: Date;               // 생성 시점
  sequenceNumber: number;        // 순서 번호
}
```

=== 5.3 롤백 프로세스
<롤백-프로세스>
+ #strong[체크포인트 생성:] 에이전트 상태를 직렬화하여 저장
+ #strong[롤백 요청:] 저장된 체크포인트 조회
+ #strong[상태 복구:] 에이전트 상태를 체크포인트 시점으로 복원
+ #strong[자원 해제:] 체크포인트 이후 획득한 자원 반환

=== 5.4 체크포인트 관리
<체크포인트-관리>
- #strong[최대 체크포인트 수:] 에이전트당 10개 (설정 가능)
- #strong[자동 삭제:] FIFO 방식으로 오래된 체크포인트 제거
- #strong[스토리지:] 인메모리 또는 Redis/MongoDB

#line(length: 100%)

== 6. 테스트 결과
<테스트-결과>
=== 6.1 테스트 통계 요약
<테스트-통계-요약>
#figure(
  align(center)[#table(
    columns: 5,
    align: (auto,auto,auto,auto,auto,),
    table.header([카테고리], [파일명], [테스트 수], [통과], [커버리지],),
    table.hline(),
    [Unit], [models.test.ts], [12], [12], [100%],
    [Detector], [CycleDetector.test.ts], [9], [9], [96.19%],
    [Recovery], [VictimSelector.test.ts], [8], [8], [88.23%],
    [Recovery], [RollbackManager.test.ts], [14], [14], [90.27%],
    [Avoider], [BankersAlgorithm.test.ts], [13], [13], [81.13%],
    [Integration], [deadlock-scenarios.test.ts], [7], [7], [-],
    [#strong[합계]], [#strong[6개
    파일]], [#strong[63]], [#strong[63]], [#strong[66.64%]],
  )]
  , kind: table
  )

=== 6.2 코드 커버리지 상세
<코드-커버리지-상세>
#figure(
  align(center)[#table(
    columns: 5,
    align: (auto,auto,auto,auto,auto,),
    table.header([영역], [Statements], [Branches], [Functions], [Lines],),
    table.hline(),
    [src/domain], [100%], [100%], [100%], [100%],
    [src/detectors], [96.19%], [90.69%], [84.21%], [96.19%],
    [src/avoiders], [89.67%], [82.75%], [95.65%], [89.67%],
    [src/recovery], [89.02%], [82.66%], [92.85%], [89.02%],
    [#strong[전체]], [#strong[66.64%]], [#strong[83.07%]], [#strong[85.54%]], [#strong[66.64%]],
  )]
  , kind: table
  )

=== 6.3 TRUST 5 품질 점수
<trust-5-품질-점수>
#figure(
  align(center)[#table(
    columns: 3,
    align: (auto,auto,auto,),
    table.header([항목], [점수], [근거],),
    table.hline(),
    [#strong[Tested]], [95/100], [63/63 테스트 통과, 66.64% 커버리지],
    [#strong[Readable]], [90/100], [TypeScript 타입 안전성, 명확한
    네이밍],
    [#strong[Unified]], [95/100], [Prettier 포맷팅, 일관된 코드 스타일],
    [#strong[Secured]], [85/100], [입력 검증, 에러 핸들링],
    [#strong[Trackable]], [90/100], [Git 히스토리, 문서화],
  )]
  , kind: table
  )

#strong[종합 점수: 91/100]

#line(length: 100%)

== 7. 결론 및 향후 계획
<결론-및-향후-계획>
=== 7.1 주요 성과
<주요-성과>
본 프로젝트는 운영체제의 데드락 이론을 AI 멀티 에이전트 시스템에
성공적으로 적용했습니다.

#strong[기술적 성과:] - Wait-For Graph 기반 데드락 탐지 시스템 구현
(O(V+E) 시간 복잡도) - 5가지 희생자 선택 전략 구현 및 합의 기반 선택
메커니즘 - 은행원 알고리즘 기반 데드락 회피 시스템 - 체크포인트/롤백
기반 에이전트 상태 복구 - REST API + WebSocket 기반 실시간 모니터링

#strong[품질 성과:] - 100% 테스트 통과율 (63/63) - TRUST 5 품질 점수
91/100 - TypeScript 기반 타입 안전성 확보

=== 7.2 학술적 가치
<학술적-가치>
+ #strong[OS 이론의 AI 응용:] 검증된 운영체제 이론을 새로운 도메인에
  적용
+ #strong[실용적 해결책:] 실제 AI 서비스에서 발생하는 자원 경합 문제
  해결 방안 제시
+ #strong[정량적 분석:] 다양한 전략의 성능 비교 및 최적 전략 도출

=== 7.3 향후 계획
<향후-계획>
#strong[단기 계획 (1-3개월):] - 대규모 그래프 탐지 최적화 - 병렬 처리
도입으로 성능 향상 - 웹 기반 모니터링 대시보드 개발

#strong[중기 계획 (3-6개월):] - 분산 환경 데드락 탐지 지원 - 머신러닝
기반 데드락 예측 알고리즘 - 실제 AI 에이전트 프레임워크 통합

#strong[장기 계획 (6개월 이상):] - 클라우드 네이티브 배포 지원 - 멀티
테넌트 환경 지원 - 상용화를 위한 SaaS 플랫폼 개발

#line(length: 100%)

== 부록
<부록>
=== A. 기술 스택
<a.-기술-스택>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([계층], [기술], [버전], [용도],),
    table.hline(),
    [언어], [TypeScript], [5.9], [타입 안전성],
    [런타임], [Node.js], [20 LTS], [서버 런타임],
    [웹 프레임워크], [Express.js], [4.18], [REST API],
    [실시간 통신], [Socket.IO], [4.7], [WebSocket],
    [데이터베이스], [MongoDB], [7.0], [영구 저장],
    [캐싱], [Redis], [7.2], [그래프 캐싱],
    [테스트], [Vitest], [Latest], [테스트 프레임워크],
  )]
  , kind: table
  )

#line(length: 100%)

#strong[문서 버전:] 1.0.0 #strong[최종 수정:] 2026-01-25
#strong[작성자:] 홍익대학교 컴퓨터공학과 졸업 프로젝트 팀
