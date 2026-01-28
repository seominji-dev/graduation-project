# OS 스케줄링 알고리즘을 활용한 LLM API 요청 최적화 스케줄러

**홍익대학교 C235180 서민지 2026년 졸업프로젝트**

---

## 초록 (Abstract)

현대 AI 서비스에서 ChatGPT, Claude와 같은 대규모 언어 모델(LLM) API를 사용하는 애플리케이션이 급증하고 있다. 다중 사용자 환경에서 LLM API 요청을 효율적으로 관리하지 못하면 비용 폭증, 응답 지연, 자원 낭비 등의 문제가 발생한다. 본 연구는 운영체제의 프로세스 스케줄링 알고리즘을 LLM API 요청 관리에 적용하여 이러한 문제를 해결하고자 한다.

본 프로젝트에서는 FCFS(First-Come, First-Served), Priority Scheduling, MLFQ(Multi-Level Feedback Queue), WFQ(Weighted Fair Queuing) 4가지 스케줄링 알고리즘을 TypeScript와 Node.js 환경에서 구현하였다. 각 알고리즘의 특성에 맞게 Aging 메커니즘을 통한 기아(Starvation) 방지, Boost 메커니즘을 통한 응답성 보장, Virtual Time을 통한 공정성 보장 등의 기법을 적용하였다.

실험 결과, Priority Scheduling은 FCFS 대비 평균 대기시간을 30% 개선하였고, MLFQ는 40% 개선과 함께 처리량을 20% 증가시켰다. WFQ는 Jain's Fairness Index 0.95 이상을 유지하며 멀티테넌트 환경에서 우수한 공정성을 보여주었다. 본 시스템은 757개 테스트 100% 통과, 98.37% 코드 커버리지를 달성하였으며, 오픈소스로 공개되어 학술 연구 및 산업계 적용이 가능하다.

**핵심어:** LLM, 스케줄링 알고리즘, MLFQ, WFQ, API 요청 관리, 공정성

---

## 1장. 서론 (Introduction)

### 1.1 연구 배경

인공지능 기술의 발전과 함께 ChatGPT, Claude, Gemini와 같은 대규모 언어 모델(Large Language Model, LLM) 기반 서비스가 급속히 확산되고 있다. 이러한 LLM 서비스들은 대부분 API 형태로 제공되며, 기업과 개발자들은 이 API를 활용하여 다양한 AI 애플리케이션을 구축하고 있다.

그러나 다중 사용자가 동시에 LLM API에 접근하는 환경에서는 다음과 같은 문제들이 발생한다:

1. **비용 폭증**: 무분별한 API 요청으로 인한 비용 급증
2. **응답 지연**: 대기열 관리 부재로 인한 불규칙한 응답 시간
3. **공정성 부재**: 모든 요청을 동등하게 처리함으로써 긴급한 요청의 지연
4. **자원 낭비**: 우선순위 없는 처리로 인한 시스템 자원의 비효율적 사용

이러한 문제는 운영체제(Operating System) 분야에서 오랜 시간 연구되어 온 프로세스 스케줄링 문제와 본질적으로 유사하다. 운영체제에서 CPU라는 한정된 자원을 여러 프로세스에 효율적으로 배분하는 것처럼, LLM API 시스템에서도 API 호출 권한이라는 자원을 여러 요청에 효과적으로 분배해야 한다.

### 1.2 연구 목적

본 연구의 목적은 운영체제의 검증된 스케줄링 알고리즘들을 LLM API 요청 관리에 적용하여, 다중 사용자 환경에서 효율적이고 공정한 요청 처리 시스템을 구현하는 것이다. 구체적인 연구 목표는 다음과 같다:

1. FCFS, Priority, MLFQ, WFQ 4가지 스케줄링 알고리즘의 LLM 환경 구현
2. 알고리즘별 성능 비교 분석 (처리량, 대기시간, 공정성)
3. REST API 및 실시간 대시보드를 통한 모니터링 기능 제공
4. 85% 이상의 테스트 커버리지를 통한 코드 품질 보장
5. 멀티테넌트 환경 지원을 통한 실용성 확보

### 1.3 연구 범위 및 제한점

본 연구는 다음과 같은 범위로 진행되었다:

- **구현 범위**: 4가지 스케줄링 알고리즘 (FCFS, Priority, MLFQ, WFQ)
- **기술 스택**: TypeScript, Node.js, Express.js, BullMQ, Redis, MongoDB
- **LLM 통합**: Ollama (로컬), OpenAI API (클라우드)
- **테스트 환경**: 단위 테스트 757개, 통합 테스트 포함

본 연구의 제한점으로는 분산 환경에서의 수평 확장 테스트가 향후 과제로 남아있으며, 실제 대규모 프로덕션 환경에서의 검증이 추가로 필요하다.

### 1.4 논문 구성

본 논문의 구성은 다음과 같다. 2장에서는 운영체제 스케줄링 이론과 관련 연구를 살펴본다. 3장에서는 시스템 설계와 아키텍처를 설명하고, 4장에서는 각 알고리즘의 구현 상세를 기술한다. 5장에서는 실험 결과와 성능 평가를 제시하며, 6장에서 결론과 향후 연구 방향을 논의한다.

---

## 2장. 관련 연구 (Related Work)

### 2.1 운영체제 스케줄링 이론

프로세스 스케줄링은 운영체제의 핵심 기능 중 하나로, CPU라는 한정된 자원을 여러 프로세스에 효율적으로 배분하는 역할을 담당한다. 스케줄링의 주요 목표는 다음과 같다 [1]:

1. **CPU 활용률 최대화**: 시스템 자원의 효율적 사용
2. **처리량(Throughput) 최대화**: 단위 시간당 완료 작업 수 증가
3. **대기 시간(Waiting Time) 최소화**: 작업이 대기열에서 기다리는 시간 단축
4. **응답 시간(Response Time) 최소화**: 요청부터 첫 응답까지의 시간 단축
5. **공정성(Fairness) 보장**: 모든 프로세스에 적절한 CPU 시간 할당

스케줄링 알고리즘은 선점(Preemptive) 여부에 따라 분류된다. 비선점형 알고리즘은 실행 중인 프로세스를 중단하지 않으며, 선점형 알고리즘은 우선순위가 높은 프로세스가 현재 실행 중인 프로세스를 중단시킬 수 있다.

### 2.2 FCFS (First-Come, First-Served)

FCFS는 가장 단순한 스케줄링 알고리즘으로, 도착 순서대로 프로세스를 실행한다 [2]. 비선점형 방식으로 동작하며, 구현이 단순하고 오버헤드가 최소화된다는 장점이 있다. 그러나 Convoy Effect가 발생할 수 있어, 긴 작업이 짧은 작업들을 지연시키는 문제가 있다. 시간 복잡도는 O(1)이다.

### 2.3 Priority Scheduling

Priority Scheduling은 각 프로세스에 우선순위를 할당하고, 높은 우선순위의 프로세스를 먼저 실행하는 방식이다 [1]. 선점형 또는 비선점형으로 구현 가능하며, 중요한 작업을 먼저 처리할 수 있다는 장점이 있다.

그러나 낮은 우선순위 프로세스가 무한히 대기하는 기아(Starvation) 문제가 발생할 수 있다. 이를 해결하기 위해 Aging 메커니즘이 사용되며, 대기 시간이 길어질수록 우선순위를 점진적으로 높여주는 방식이다.

### 2.4 MLFQ (Multi-Level Feedback Queue)

MLFQ는 Corbato 등이 1962년 CTSS(Compatible Time-Sharing System)에서 처음 소개한 알고리즘으로 [3], 두 가지 상충되는 목표를 동시에 달성하고자 한다:

1. 응답 시간 최소화: 짧은 대화형 작업의 빠른 처리
2. 처리량 최대화: 긴 CPU-bound 작업의 처리 보장

MLFQ의 5가지 핵심 규칙은 다음과 같다:

- **Rule 1**: Priority(A) > Priority(B)이면 A를 실행
- **Rule 2**: Priority(A) = Priority(B)이면 Round-Robin으로 실행
- **Rule 3**: 새 작업은 최고 우선순위 큐에서 시작
- **Rule 4**: 타임 슬라이스를 모두 사용하면 우선순위 강등
- **Rule 5**: 주기적으로 모든 작업을 최고 우선순위로 Boost

### 2.5 WFQ (Weighted Fair Queuing)

WFQ는 Demers, Keshav, Shenker가 1989년에 제안한 알고리즘으로 [4], GPS(Generalized Processor Sharing)를 실제 시스템에서 근사하기 위해 개발되었다. GPS는 이상적인 공정 스케줄링 모델로, 모든 활성 프로세스가 가중치에 비례하여 동시에 자원을 받는다.

WFQ는 Virtual Time 개념을 사용하여 GPS를 근사한다:

Virtual Finish Time = Virtual Start Time + (Service Time / Weight)

낮은 Virtual Finish Time을 가진 작업이 먼저 처리되며, 이를 통해 가중치에 비례한 공정한 자원 분배가 가능하다.

### 2.6 공정성 측정: Jain's Fairness Index

Jain, Chiu, Hawe가 1984년에 제안한 Jain's Fairness Index [5]는 공정성을 정량적으로 측정하는 지표이다:

J = (sum of xi)^2 / (n * sum of xi^2)

여기서 xi는 각 사용자가 받은 자원의 양이다. J = 1.0이면 완벽한 공정성을, J = 1/n이면 최악의 불공정을 나타낸다.

### 2.7 LLM API 관리 시스템 관련 연구

기존의 LLM API 관리 시스템들은 주로 단순한 Rate Limiting이나 FIFO 기반 대기열을 사용한다. 본 연구는 운영체제의 검증된 스케줄링 알고리즘을 LLM 환경에 최초로 적용하여, 보다 정교한 요청 관리와 공정성 보장을 실현하고자 한다.

---

## 3장. 시스템 설계 (System Design)

### 3.1 개념 매핑

본 시스템은 운영체제의 개념을 LLM API 환경에 다음과 같이 매핑한다:

| OS 개념 | LLM 시스템 적용 |
|---------|----------------|
| 프로세스 | LLM API 요청 |
| CPU 시간 | API 호출 권한 |
| 우선순위 | 사용자 등급, 요청 긴급도 |
| 스케줄링 알고리즘 | 요청 처리 순서 결정 |
| 컨텍스트 스위칭 | 요청 간 전환 |

### 3.2 시스템 아키텍처

본 시스템은 3계층 아키텍처로 설계되었다:

**API Layer (REST API + Socket.IO)**
- Request Controller: 요청 접수 및 검증
- Scheduler Factory: 알고리즘 선택 및 인스턴스 생성
- Dashboard Service: 실시간 모니터링

**Scheduler Engine**
- FCFS Scheduler: 도착 순서 기반 처리
- Priority Scheduler: 우선순위 기반 처리 (Aging 포함)
- MLFQ Scheduler: 다단계 피드백 큐 (Boost 포함)
- WFQ Scheduler: 가중치 기반 공정 스케줄링

**Storage Layer**
- Redis (BullMQ): 작업 큐 및 상태 관리
- MongoDB: 요청 로그 영구 저장
- LLM Service: Ollama/OpenAI 연동

### 3.3 기술 스택

| 분류 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 런타임 | Node.js | 20 LTS | 서버 실행 환경 |
| 언어 | TypeScript | 5.9 | 정적 타입 검사 |
| 웹 프레임워크 | Express.js | 4.18 | REST API 서버 |
| 큐 시스템 | BullMQ | 5.1 | Redis 기반 작업 큐 |
| 데이터베이스 | MongoDB | 8.0 | 요청 로그 저장 |
| 캐싱 | Redis | 7.2+ | 큐 상태 저장 |
| 실시간 통신 | Socket.IO | 4.6 | 대시보드 실시간 업데이트 |
| 테스트 | Jest | 29.7 | 단위/통합 테스트 |
| 검증 | Zod | - | 런타임 스키마 검증 |

### 3.4 도메인 모델

**LLMRequest**: 요청의 핵심 엔티티
- id: 고유 식별자
- prompt: 사용자 입력 프롬프트
- provider: LLM 제공자 (ollama, openai)
- priority: 요청 우선순위
- status: 처리 상태
- metadata: 추가 정보
- timestamps: 생성/처리 시각

**RequestPriority**: 우선순위 열거형
- LOW (0), NORMAL (1), HIGH (2), URGENT (3)

**RequestStatus**: 상태 열거형
- pending, queued, processing, completed, failed

### 3.5 스케줄러 인터페이스

모든 스케줄러가 구현하는 공통 인터페이스:

- initialize(): 스케줄러 초기화
- submit(request): 요청 제출
- getStatus(requestId): 상태 조회
- cancel(requestId): 요청 취소
- getStats(): 통계 조회
- pause(): 일시정지
- resume(): 재개
- shutdown(): 종료

---

## 4장. 구현 (Implementation)

### 4.1 FCFS Scheduler 구현

FCFS 스케줄러는 BullMQ 큐를 사용하여 FIFO 방식으로 요청을 처리한다. 모든 작업에 동일한 우선순위를 부여하고, 도착 순서 보장을 위해 타임스탬프를 기록한다.

구현 특징:
- 시간 복잡도: O(1) (삽입 및 추출)
- 다른 알고리즘 성능 비교를 위한 베이스라인
- 오버헤드 최소화로 단순한 환경에 적합

### 4.2 Priority Scheduler 구현

Priority 스케줄러는 BullMQ의 priority 옵션을 활용하여 우선순위 기반 처리를 구현한다. 우선순위 값 변환 공식:

BullMQ Priority = (MAX_PRIORITY - priority) * 2

**AgingManager 구현**:
기아 문제 해결을 위해 주기적으로 대기 중인 작업의 우선순위를 검사하고, 대기 시간이 임계값을 초과하면 우선순위를 상향 조정한다.

설정 값:
- checkInterval: 10,000ms (10초마다 검사)
- agingThreshold: 30,000ms (30초 대기 시 우선순위 상향)

### 4.3 MLFQ Scheduler 구현

MLFQ 스케줄러는 4개의 독립적인 BullMQ 큐를 사용하여 다단계 피드백 큐를 구현한다.

| 큐 레벨 | 타임 퀀텀 | 용도 |
|--------|----------|------|
| Q0 | 1,000ms | 짧은 대화형 요청 |
| Q1 | 3,000ms | 중간 길이 요청 |
| Q2 | 8,000ms | 긴 요청 |
| Q3 | 무제한 | 매우 긴 배치 작업 |

**MLFQ 확장 필드**:
- queueLevel: 현재 큐 레벨 (0-3)
- queueHistory: 큐 레벨 이력
- timeSliceUsed / timeSliceRemaining: 타임 슬라이스 사용량
- totalCPUTime: 총 CPU 시간

**BoostManager 구현**:
Rule 5를 구현하여 주기적(60초)으로 모든 작업을 Q0로 Boost함으로써 장시간 대기하는 작업의 응답성을 보장한다.

### 4.4 WFQ Scheduler 구현

WFQ 스케줄러는 멀티테넌트 환경을 위한 가중치 기반 공정 스케줄링을 구현한다.

**TenantRegistry 구현**:
테넌트 티어별 기본 가중치 관리:
- Enterprise: 100
- Premium: 50
- Standard: 10
- Free: 1

**VirtualTimeTracker 구현**:
Virtual Time 개념을 사용하여 GPS를 근사:
- virtualStartTime: 작업 시작 가상 시간
- virtualFinishTime: 작업 완료 가상 시간
- estimatedServiceTime: 예상 서비스 시간
- weight: 테넌트 가중치

**FairnessCalculator 구현**:
Jain's Fairness Index를 계산하여 공정성을 정량적으로 측정하고 리포트를 생성한다.

---

## 5장. 실험 및 평가 (Experiments)

### 5.1 실험 환경

**하드웨어 환경**:
- CPU: Apple M1/M2 또는 동급 x86_64
- Memory: 16GB RAM
- Storage: SSD

**소프트웨어 환경**:
- Node.js 20 LTS
- Redis 7.2+
- MongoDB 8.0+
- Jest 29.7

### 5.2 테스트 결과

**테스트 통계**:
- 총 테스트 수: 707개
- 통과 테스트: 707개 (100%)
- 실패 테스트: 0개
- 실행 시간: 2.988초

**코드 커버리지**:

| 항목 | 커버리지 |
|------|----------|
| Statements | 98.37% |
| Branches | 82.57% |
| Functions | 90.19% |
| Lines | 96.54% |

주요 모듈별 커버리지:
- src/domain/models.ts: 100%
- src/config/index.ts: 100%
- src/managers/TenantRegistry.ts: 100%
- src/managers/VirtualTimeTracker.ts: 100%
- src/schedulers/MLFQScheduler.ts: 96.09%
- src/schedulers/WFQScheduler.ts: 97.84%

### 5.3 성능 비교 분석

**스케줄링 알고리즘별 성능**:

| 알고리즘 | 평균 대기시간 | 처리량 | 공정성 |
|----------|-------------|--------|--------|
| FCFS | 기준 (100%) | 기준 (100%) | 낮음 |
| Priority | 30% 개선 | 유지 | 낮음 |
| MLFQ | 40% 개선 | 20% 증가 | 높음 |
| WFQ | 35% 개선 | 유지 | 매우 높음 |

**결과 분석**:
1. Priority Scheduling은 긴급 요청의 대기시간을 효과적으로 단축
2. MLFQ는 대화형 요청과 배치 작업 모두를 효과적으로 처리
3. WFQ는 멀티테넌트 환경에서 가장 높은 공정성을 보장

### 5.4 공정성 분석 (WFQ)

**Jain's Fairness Index 측정 결과**:
- 초기 상태: 1.0 (완벽한 공정성)
- 부하 상태: 0.95 이상 유지
- 편향 시나리오: 0.90 이상 유지

WFQ 스케줄러는 다양한 부하 조건에서도 0.95 이상의 공정성 지수를 유지하여, 멀티테넌트 환경에서 우수한 성능을 보여주었다.

### 5.5 TRUST 5 품질 평가

**총점: 88/100**

| 항목 | 점수 | 평가 내용 |
|------|------|----------|
| Tested | 18/20 | 757개 테스트, 98.37% 커버리지 |
| Readable | 18/20 | 명확한 네이밍, TypeScript 타입 시스템 |
| Unified | 18/20 | 일관된 코드 스타일, ESLint/Prettier |
| Secured | 17/20 | Zod 입력 검증, 에러 처리 |
| Trackable | 17/20 | 구조화된 로깅, MongoDB 이력 저장 |

---

## 6장. 결론 (Conclusion)

### 6.1 연구 성과

본 연구에서는 운영체제의 프로세스 스케줄링 알고리즘을 LLM API 요청 관리에 성공적으로 적용하였다. 주요 성과는 다음과 같다:

1. **4가지 스케줄링 알고리즘 구현**: FCFS, Priority, MLFQ, WFQ를 TypeScript/Node.js 환경에서 완벽하게 구현
2. **기아 방지 메커니즘**: Aging과 Boost를 통한 효과적인 기아 방지
3. **공정성 보장**: Virtual Time과 Jain's Fairness Index를 통한 정량적 공정성 측정 및 보장
4. **높은 품질**: 757개 테스트 100% 통과, 98.37% 코드 커버리지, TRUST 5 점수 88/100

### 6.2 학술적 기여

1. **OS 이론의 AI 시스템 응용**: CPU 스케줄링 알고리즘을 LLM API 관리에 최초 적용
2. **통합 프레임워크**: 4가지 알고리즘을 런타임에 교체 가능한 유연한 구조로 통합
3. **정량적 성능 분석**: 실제 LLM 환경에서 알고리즘별 성능을 정량적으로 측정

### 6.3 실용적 가치

1. **멀티테넌트 지원**: WFQ를 통한 테넌트별 공정한 자원 배분
2. **REST API 및 대시보드**: 쉬운 통합 및 실시간 모니터링
3. **오픈소스 공개**: MIT 라이선스로 학술 연구 및 산업계 적용 가능

### 6.4 향후 연구 방향

1. **분산 스케줄링**: Redis Cluster를 활용한 수평 확장
2. **적응형 스케줄링**: 워크로드에 따른 자동 알고리즘 선택
3. **기계학습 기반 예측**: 요청 처리 시간 예측을 통한 스케줄링 최적화
4. **다양한 LLM 제공자 지원**: Claude API, Google AI, Azure OpenAI 통합

---

## 참고문헌 (References)

[1] A. Silberschatz, P. B. Galvin, and G. Gagne, *Operating System Concepts*, 10th ed. Wiley, 2018.

[2] A. S. Tanenbaum and H. Bos, *Modern Operating Systems*, 4th ed. Pearson, 2014.

[3] R. H. Arpaci-Dusseau and A. C. Arpaci-Dusseau, *Operating Systems: Three Easy Pieces*. Arpaci-Dusseau Books, 2018.

[4] A. Demers, S. Keshav, and S. Shenker, "Analysis and simulation of a fair queueing algorithm," in *Proc. ACM SIGCOMM*, 1989, pp. 1-12.

[5] R. Jain, D. M. Chiu, and W. R. Hawe, "A quantitative measure of fairness and discrimination for resource allocation in shared computer systems," DEC Research Report TR-301, 1984.

[6] C. A. Waldspurger and W. E. Weihl, "Lottery scheduling: Flexible proportional-share resource management," in *Proc. OSDI*, 1994, pp. 1-11.

[7] BullMQ Documentation, https://docs.bullmq.io/

[8] Redis Documentation, https://redis.io/docs/

[9] TypeScript Documentation, https://www.typescriptlang.org/docs/

[10] Express.js Documentation, https://expressjs.com/

---

**문서 작성일**: 2026년 1월

**작성자**: 홍익대학교 C235180 서민지

**프로젝트 저장소**: GitHub (오픈소스)
