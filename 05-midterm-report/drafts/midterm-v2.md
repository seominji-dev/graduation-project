# OS 스케줄링 알고리즘을 활용한 다중 사용자 LLM API 요청 관리 시스템

## Multi-User LLM API Request Management System Using OS Scheduling Algorithms

---

**학과:** 홍익대학교 컴퓨터공학과  
**학번:** C235180  
**성명:** 서민지  
**지도교수:** 이장호  
**제출일:** 2026년 4월

---

## 1. 서론

### 1.1 연구 배경

ChatGPT, Claude, Gemini 등 대규모 언어 모델(Large Language Model, LLM) API 서비스가 빠르게 확산되면서, 여러 사용자가 동시에 LLM API를 호출하는 멀티테넌트(Multi-tenant) 환경이 보편화되고 있다. 이러한 환경에서 요청 처리 순서와 자원 분배 정책은 서비스 품질에 직접적인 영향을 미치는 핵심 요소이다.

현재 대부분의 LLM 서비스는 선착순(First-Come, First-Served, FCFS) 처리 방식이나 단순 Rate Limiting에 의존하고 있다. 이러한 방식은 다음과 같은 한계를 가진다:

- **호위 효과(Convoy Effect)**: 긴 요청이 뒤따르는 짧은 요청들의 처리를 지연시킨다.
- **차등 서비스 불가**: 긴급한 요청도 도착 순서를 기다려야 하며, 사용자 등급에 따른 서비스 품질 차등화가 불가능하다.
- **공정성 부재**: 테넌트 간 자원 분배의 공정성을 정량적으로 측정하고 보장하는 메커니즘이 없다.
- **기아(Starvation) 현상**: 우선순위 기반 시스템에서 낮은 등급의 테넌트가 무기한 대기하는 문제가 발생할 수 있다.

### 1.2 연구 목적

3학년 운영체제 수업에서 학습한 프로세스 스케줄링 알고리즘(FCFS, Priority Scheduling, MLFQ, WFQ 등)은 CPU 자원을 프로세스에 효율적으로 배분하기 위해 수십 년간 연구되어 온 이론이다 [1]. 본 연구는 이 검증된 이론을 LLM API 요청 관리라는 새로운 도메인에 적용함으로써, OS 이론의 실제 응용 가능성을 탐구한다.

구체적인 연구 목적은 다음과 같다:

1. **5가지 스케줄링 알고리즘 구현**: FCFS(베이스라인), Priority Scheduling(긴급 요청 우선), MLFQ(적응형 스케줄링), WFQ(공정 배분), Rate Limiter(속도 제한)
2. **알고리즘별 성능 비교 분석**: 대기시간, 처리량, 공정성 지표의 정량적 비교
3. **공정성 정량화**: Jain's Fairness Index(JFI)를 활용한 멀티테넌트 환경의 공정성 측정

### 1.3 연구 질문

본 연구는 다음 세 가지 연구 질문에 답하고자 한다:

- **RQ1 (Priority Scheduling)**: 우선순위 스케줄링에서 긴급(URGENT) 요청이 FCFS 대비 얼마나 빠르게 처리되는가?
- **RQ2 (MLFQ)**: 선점형 MLFQ가 혼합 워크로드에서 짧은 요청의 대기시간을 얼마나 개선하는가?
- **RQ3 (WFQ)**: WFQ가 테넌트 등급별 가중치에 비례하는 차등 서비스를 제공하는가?

---

## 2. 관련 연구

### 2.1 OS 스케줄링 알고리즘

프로세스 스케줄링은 운영체제의 핵심 기능 중 하나로, CPU 자원을 여러 프로세스에 효율적으로 배분하기 위한 다양한 알고리즘이 연구되어 왔다 [1].

**FCFS (First-Come, First-Served)** 는 가장 단순한 스케줄링 알고리즘으로, 요청 도착 순서대로 처리한다. 구현이 간단하나 긴 작업이 짧은 작업을 지연시키는 호위 효과(Convoy Effect)가 발생한다는 단점이 있다.

**Priority Scheduling** 은 각 프로세스에 우선순위를 부여하여 높은 우선순위의 프로세스를 먼저 처리한다. 그러나 낮은 우선순위의 프로세스가 무기한 대기하는 기아(Starvation) 현상이 발생할 수 있으며, 이를 해결하기 위해 Aging(노화) 기법이 사용된다 [1, Ch.5].

**MLFQ (Multi-Level Feedback Queue)** 는 작업의 실행 특성을 관찰하여 우선순위를 동적으로 조정하는 알고리즘이다. 현대 운영체제에서 가장 널리 사용되는 스케줄링 알고리즘 중 하나이며, 5가지 핵심 규칙(Rule 1-5)에 따라 작업을 분류하고 큐 간 이동시킨다 [2, Ch.8].

[그림 1] OS 스케줄링 알고리즘 개념 비교 (참조: figures/midterm-figures.pptx, 슬라이드 1)

**WFQ (Weighted Fair Queuing)** 는 GPS(Generalized Processor Sharing) 이론을 기반으로 한 공정 큐잉 알고리즘이다. 각 흐름(flow)에 가중치를 부여하여 가중치에 비례하는 서비스를 제공하며, Virtual Finish Time 개념을 사용하여 스케줄링 순서를 결정한다 [3, Ch.7].

### 2.2 LLM 서빙 시스템

LLM API 서빙 분야에서는 추론 성능 최적화를 위한 다양한 오픈소스 프로젝트가 활발히 개발되고 있다.

**vLLM** 은 PagedAttention 기법을 도입한 고성능 LLM 추론 엔진이다 [4]. 운영체제의 가상 메모리 페이징 기법에서 착안하여 KV 캐시 메모리를 비연속적 블록으로 관리하며, 기존 대비 메모리 활용률을 크게 향상시키고 처리량을 개선한다.

**Text Generation Inference(TGI)** 는 HuggingFace에서 개발한 LLM 추론 서버로, continuous batching과 토큰 스트리밍 기능을 제공한다 [5]. 프로덕션 환경에서의 LLM 배포를 위한 최적화된 기능을 갖추고 있다.

**Ollama** 는 로컬 환경에서 LLM을 간편하게 실행할 수 있는 도구로, REST API를 통해 다양한 모델을 호출할 수 있다 [6]. 본 연구에서는 Ollama를 실험용 LLM 백엔드로 사용한다.

그러나 이들 시스템은 주로 GPU 메모리 관리, 배치 처리 최적화, 추론 파이프라인 효율화에 집중하고 있다. 다중 사용자 환경에서의 **요청 스케줄링**과 **테넌트 간 공정성** 문제는 상대적으로 다루어지지 않았다. 본 연구는 이 간극을 메우기 위해 OS 스케줄링 이론을 LLM 요청 관리에 적용한다.

### 2.3 공정성 측정

Jain's Fairness Index(JFI)는 공유 컴퓨터 시스템에서 자원 배분의 공정성을 정량적으로 측정하기 위한 지표이다 [3, Ch.9]. JFI는 0(완전 불공정)부터 1(완전 공정) 사이의 값을 가지며, 다음과 같이 계산된다:

$$
JFI = \frac{\left(\sum_{i=1}^{n} x_i\right)^2}{n \cdot \sum_{i=1}^{n} x_i^2}
$$

여기서 $x_i$는 각 사용자가 받는 자원의 양, $n$은 사용자 수이다. 본 연구는 JFI를 멀티테넌트 LLM API 환경에 적용하여, 시스템 수준과 테넌트 수준의 이중 공정성 측정 방법론을 제시한다.

---

## 3. 시스템 설계

### 3.1 OS-LLM 개념 대응 관계

본 연구의 핵심 아이디어는 운영체제의 프로세스 스케줄링 개념을 LLM API 요청 관리에 매핑하는 것이다. 표 1은 이 대응 관계를 정리한 것이다.

**표 1. OS 개념과 LLM 도메인 대응 관계**

| OS 개념 | LLM 도메인 | 설명 |
|---------|-----------|------|
| 프로세스 (Process) | LLM API 요청 | 스케줄링 단위 |
| CPU 시간 (CPU Time) | API 호출 쿼터 | 할당 자원 |
| 우선순위 (Priority) | 테넌트 등급, 요청 긴급도 | 처리 순서 결정 기준 |
| 스케줄링 알고리즘 | 요청 처리 순서 결정 | 자원 배분 정책 |
| 선점 (Preemption) | 요청 중단 및 큐 이동 | 긴 요청 제어 |
| 시간 할당량 (Time Quantum) | 큐별 처리 시간 한도 | 공정한 시간 분배 |
| 기아 방지 (Starvation Prevention) | Aging, Boosting | 낮은 등급 보호 |

[그림 2] OS-LLM 개념 매핑도 (참조: figures/midterm-figures.pptx, 슬라이드 2)

### 3.2 시스템 아키텍처

시스템은 4계층 구조로 설계되었다(그림 3).

[그림 3] 시스템 아키텍처 4계층 구조 (참조: figures/midterm-figures.pptx, 슬라이드 3)

**클라이언트 계층**: REST API를 통해 LLM 요청을 제출하고, 처리 상태를 조회한다.

**API 계층**: Express.js [7] 기반의 HTTP 서버로, 요청 접수, 스케줄러 전환, 통계 조회 등의 엔드포인트를 제공한다.

**스케줄러 엔진**: 핵심 계층으로, 5가지 스케줄링 알고리즘이 공통 인터페이스를 구현한다. 서버 재시작 없이 REST API(`PUT /api/scheduler`)를 통해 알고리즘을 실시간 전환할 수 있다.

**저장소 계층**: 메모리 배열 기반 큐로 요청을 관리하고, JSON 파일로 로그를 기록하며, Ollama [6]를 통해 로컬 LLM을 호출한다.

### 3.3 스케줄링 알고리즘 설계

#### 3.3.1 FCFS (First-Come, First-Served)

선착순 처리 알고리즘으로, 요청의 도착 타임스탬프를 기준으로 처리 순서를 결정한다. 구현이 간단하며 다른 알고리즘의 성능 비교를 위한 **베이스라인**으로 사용한다.

#### 3.3.2 Priority Scheduling with Aging

4단계 우선순위(URGENT > HIGH > NORMAL > LOW)를 지원하며, Aging 메커니즘을 통해 기아 현상을 방지한다. 대기 시간이 임계값을 초과하면 요청의 우선순위가 자동으로 상승한다.

#### 3.3.3 MLFQ (Multi-Level Feedback Queue)

4단계 피드백 큐(Q0-Q3)를 구현하며, 큐별 시간 할당량을 차등 설정한다(표 2).

**표 2. MLFQ 큐 레벨 및 시간 할당량**

| 큐 레벨 | 시간 할당량 (Time Quantum) | 대상 요청 유형 |
|---------|--------------------------|--------------|
| Q0 | 1,000ms | 대화형 Short 요청 (신규 진입) |
| Q1 | 3,000ms | 중간 길이 요청 |
| Q2 | 8,000ms | 긴 요청 |
| Q3 | ∞ (무제한) | 배치/초장문 요청 |

시간 슬라이스(500ms) 기반 **선점형(preemptive)** 모드를 지원하여, 시간 할당량을 초과한 요청은 하위 큐로 이동시킨다. 주기적 Boost 메커니즘(5초 주기)으로 모든 요청을 Q0로 복귀시켜 기아를 방지한다.

[그림 4] MLFQ 큐 구조 및 요청 이동 흐름 (참조: figures/midterm-figures.pptx, 슬라이드 4)

**의사코드 1. MLFQ 선점 처리 흐름**

```
function processNextRequest():
    request = dequeue()           // 최상위 비어있지 않은 큐에서 추출
    startProcessing(request)

    every 500ms:                  // 타임 슬라이스 체크
        elapsed = now - startTime + usedTime
        quantum = TIME_QUANTUM[request.queueLevel]

        if elapsed >= quantum AND quantum != Infinity:
            request.queueLevel = min(queueLevel + 1, 3)  // 하위 큐로 강등
            request.usedTime = 0
            queues[newLevel].push(request)
            processNextRequest()  // 다음 요청 처리
        else:
            continue processing
```

MLFQ는 OSTEP에서 정리된 5가지 규칙(Rule 1-5)을 준수한다 [2, Ch.8]:

| 규칙 | 설명 |
|------|------|
| Rule 1 | Priority(A) > Priority(B) → A 먼저 실행 |
| Rule 2 | Priority(A) = Priority(B) → FCFS 순서 |
| Rule 3 | 새 작업은 항상 최상위 큐(Q0)에 배치 |
| Rule 4 | 시간 할당량 소진 시 하위 큐로 강등 |
| Rule 5 | 주기적 Boosting으로 모든 작업을 Q0로 이동 |

[그림 5] MLFQ 의사코드 시각화 (참조: figures/midterm-figures.pptx, 슬라이드 5)

#### 3.3.4 WFQ (Weighted Fair Queuing)

GPS 이론에 기반한 가중치 공정 큐잉 알고리즘으로, 테넌트 등급별 가중치에 비례하여 자원을 분배한다 [3, Ch.7].

**표 3. 테넌트 등급 및 가중치**

| 등급 | 가중치 | 예상 자원 비율 | 대상 고객 |
|------|--------|---------------|----------|
| Enterprise | 100 | 62.1% | 대기업, 핵심 고객 |
| Premium | 50 | 31.1% | 유료 구독 고객 |
| Standard | 10 | 6.2% | 일반 유료 고객 |
| Free | 1 | 0.6% | 무료 체험 고객 |

Virtual Finish Time을 계산하여 스케줄링 순서를 결정하며, 이중 수준 JFI로 공정성을 정량적으로 모니터링한다:
- **시스템 수준 JFI**: 전체 테넌트 간 가중치 비례 서비스 검증
- **테넌트 수준 JFI**: 동일 등급 내 요청 간 공평한 처리 확인

### 3.4 핵심 기술 특징

**런타임 알고리즘 교체**: 서버 재시작 없이 REST API를 통해 스케줄링 알고리즘을 실시간으로 전환할 수 있다. 이를 통해 동일 환경에서 알고리즘 간 성능 비교 실험을 수행할 수 있다.

**이중 수준 공정성 측정**: WFQ 스케줄러에서 시스템 수준 JFI와 테넌트 수준 JFI를 분리 측정한다. 시스템 수준 JFI는 가중치 비율에 따른 의도적 차등 서비스가 올바르게 동작하는지를 검증하고, 테넌트 수준 JFI는 동일 등급 내 요청 간의 공평한 처리를 모니터링한다.

**기아 방지**: Priority 스케줄러의 Aging과 MLFQ의 Boost를 통해 낮은 우선순위 요청의 무기한 대기를 방지한다.

---

## 4. 구현 현황

### 4.1 기술 스택 및 개발 환경

**표 4. 기술 스택**

| 항목 | 기술/도구 | 설명 |
|------|----------|------|
| 런타임 | Node.js 22 LTS [8] | JavaScript 실행 환경 |
| 프레임워크 | Express.js 4.18 [7] | REST API 서버 |
| 언어 | JavaScript (ES2024) | 학부 수준 유지 |
| 테스트 | Jest 29.x [9] | 단위 테스트 프레임워크 |
| LLM | Ollama (로컬) [6] | LLM 추론 엔진 |
| 의존성 | 2개 (express, uuid) | 최소 의존성 원칙 |

25-2학기 프로토타입 구현 결과:
- **테스트**: 307개 단위 테스트 전체 통과 (12개 테스트 스위트)
- **커버리지**: 99.76% (Lines 기준)
- **코드 복잡도**: 학부생 수준으로 유지, 고급 디자인 패턴 최소화

### 4.2 실험 결과

#### 4.2.1 기본 실험 (100건 요청)

25-2학기에 프로토타입을 구현하고 100건 요청으로 기본 실험을 수행하였다.

**표 5. 알고리즘별 성능 비교 (100건 요청 실험)**

| 스케줄러 | 평균 대기시간 | 핵심 발견 |
|---------|-------------|----------|
| FCFS | 2,572ms | 베이스라인, 도착 순서 처리 |
| Priority | 2,826ms | URGENT 요청: 1,122ms (FCFS 대비 62% 감소) |
| MLFQ | 2,572ms | 짧은 요청: 선점형 모드에서 73.78% 개선 (10 시드 검증) |
| WFQ | 2,819ms | Enterprise: 849ms, Free: 4,894ms (5.8배 차이) |

[그림 6] 알고리즘별 성능 비교 차트 (참조: figures/midterm-figures.pptx, 슬라이드 6)

**RQ1 (Priority Scheduling)**: URGENT 요청은 FCFS 대비 62% 빠르게 처리되었다(Cohen's d = 0.78, p < 0.001). Aging 메커니즘에 의해 기아 현상이 방지됨을 확인하였다.

**RQ2 (MLFQ)**: 시간 슬라이스 기반 선점형 모드에서, 짧은 요청과 긴 요청이 동시에 경쟁하는 환경에서 짧은 요청의 대기시간이 평균 73.78% 개선되었다(10 시드 다중 실험, 95% CI: [72.36, 75.20], p < 0.001, Cohen's d = 15.9).

**RQ3 (WFQ)**: Enterprise 테넌트(가중치 100)는 Free 테넌트(가중치 1) 대비 5.8배 빠른 응답을 받았으며(849ms vs 4,894ms), 시스템 수준 JFI는 0.89, 테넌트 수준 JFI는 0.92-0.98로 높은 내부 공정성을 달성하였다.

#### 4.2.2 다중 시드 실험 (통계적 검증)

26-1학기에 실험의 통계적 신뢰성을 보강하기 위해 다중 시드 실험을 설계하고 수행하였다.

**실험 설계:**
- 10개 랜덤 시드 × 500건 요청 = 총 5,000건 실험 요청
- 요청 구성: Short 40%, Medium 40%, Long 20%
- 선점형 MLFQ 시뮬레이션 (타임 슬라이스 500ms)

**표 6. MLFQ Short 요청 개선율 통계**

| 통계량 | 값 |
|--------|------|
| 평균 개선율 | 73.78% |
| 표준편차 | 1.98% |
| 95% 신뢰구간 | [72.36, 75.20] |
| 변동계수 (CV) | 2.68% |
| p-value | < 0.001 |
| Cohen's d | 15.905 (큰 효과) |

변동계수 2.68%는 시드에 관계없이 안정적인 재현성을 보여준다. Cohen's d = 15.905는 FCFS 대비 MLFQ의 개선 효과가 매우 크다는 것을 의미한다.

[그림 7] 다중 시드 실험 결과 및 신뢰구간 (참조: figures/midterm-figures.pptx, 슬라이드 7)

---

## 5. 향후 계획

### 5.1 추가 연구 방향

25-2학기 예비 구현에서 확인된 결과를 바탕으로, 26-1학기 남은 기간에는 다음을 추가 수행한다:

1. **대규모 실험 확장**: 1,000건 이상의 요청으로 실험 규모를 확대하고, 버스트 트래픽, 비균등 테넌트 분포 등 다양한 워크로드 시나리오를 추가하여 알고리즘의 확장성과 견고성을 검증한다.
2. **공정성 분석 심화**: JFI 외 추가 공정성 지표(Max-Min Fairness 등) 적용 가능성을 검토하고, 알고리즘 간 공정성-성능 트레이드오프를 분석한다.
3. **시스템 설계 문서화 완성**: 아키텍처 상세 설계, 알고리즘 의사코드, API 명세를 체계적으로 정리한다.
4. **데모 시스템 구성**: 최종 발표를 위한 실시간 데모 환경을 구성한다.

### 5.2 일정

**표 7. 26-1학기 남은 일정**

| 기간 | 주요 활동 | 산출물 | 마감일 |
|------|----------|--------|--------|
| 4월 중순-5월 | 추가 실험 수행, 결과 분석, 최종 보고서 집필 | 최종보고서 + 소스코드 | 5/24 |
| 5월 말 | 발표 자료 준비, 시스템 데모 구성 | 발표 PPT, 실시간 데모 | 5/26-29 |

---

## 참고문헌

[1] A. Silberschatz, P. B. Galvin, and G. Gagne, *Operating System Concepts*, 10th ed., Wiley, 2018. (홍릉과학출판사 번역판: *운영체제*)

[2] R. H. Arpaci-Dusseau and A. C. Arpaci-Dusseau, *Operating Systems: Three Easy Pieces*, v1.10, Arpaci-Dusseau Books, 2023. Available: https://pages.cs.wisc.edu/~remzi/OSTEP/

[3] J. F. Kurose and K. W. Ross, *Computer Networking: A Top-Down Approach*, 8th ed., Pearson, 2021. (퍼스트북 번역판: *컴퓨터 네트워킹: 하향식 접근*)

[4] vLLM Project, "vLLM: Easy, Fast, and Cheap LLM Serving," 2024. Available: https://docs.vllm.ai/

[5] HuggingFace, "Text Generation Inference," 2024. Available: https://huggingface.co/docs/text-generation-inference/

[6] Ollama, "Ollama Documentation," 2024. Available: https://ollama.com/

[7] Express.js, "Express - Node.js Web Application Framework," 2024. Available: https://expressjs.com/

[8] Node.js Foundation, "Node.js Documentation," 2024. Available: https://nodejs.org/docs/latest-v22.x/api/

[9] Jest, "Jest - Delightful JavaScript Testing," 2024. Available: https://jestjs.io/
