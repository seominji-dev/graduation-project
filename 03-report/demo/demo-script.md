# 멀티테넌트 LLM 게이트웨이 - 공정성 데모 스크립트

> **시연 시간:** 5-10분
> **대상:** 졸업 심사위원
> **목적:** 멀티테넌트 LLM 게이트웨이에서 OS 스케줄링 알고리즘을 활용한 테넌트 간 공정한 자원 분배 시연
> **핵심 메시지:** Enterprise 테넌트가 대량 요청해도 Free 테넌트가 기아 상태에 빠지지 않음

---

## 시연 준비 체크리스트

시연 시작 전 확인 사항:
- [ ] Ollama 서버 실행 중 (포트 11434)
- [ ] API 서버 실행 중 (포트 3000)
- [ ] 터미널 2개 준비 (서버 로그, curl 요청)
- [ ] 브라우저에 localhost:3000 열기 (선택 사항)

---

## 시작 (0:00 - 0:30)

### 화면 구성
```
┌────────────────────────────────────────────────────────────┐
│  왼쪽: 터미널 (서버 로그)    │  오른쪽: 프레젠테이션 슬라이드  │
│  중간: curl 명령 실행        │                              │
└────────────────────────────────────────────────────────────┘
```

### 시작 멘트
```
안녕하세요, 컴퓨터공학과 서민지입니다.
저는 "멀티테넌트 LLM 게이트웨이에서의 공정한 요청 관리"
프로젝트를 진행했습니다.

여러 테넌트가 LLM 게이트웨이를 공유할 때 발생하는
자원 독점과 기아 현상을 OS 스케줄링 알고리즘으로 해결했습니다.

특히 WFQ(Weighted Fair Queuing)를 적용하여
테넌트 등급에 따른 공정한 자원 분배를 구현했고,
테넌트 수준에서 Jain's Fairness Index 0.92-0.98를 달성했습니다.

지금부터 멀티테넌트 공정성 시연을 보여드리겠습니다.
```

---

## 시나리오 1: 시스템 시작 (0:30 - 1:30)

### [화면] 터미널 - 서버 시작 로그

**실행할 명령어:**
```bash
cd 02-implementation
npm start
```

**기대되는 화면 출력:**
```
==================================================
LLM Scheduler Server Started
==================================================
Environment: development
Server running on: http://localhost:3000
Scheduler type: FCFS (default)
Available schedulers: FCFS, Priority, MLFQ, WFQ
Health check: http://localhost:3000/api/health
==================================================
```

### [화면] Health Check API

**실행할 명령어:**
```bash
curl http://localhost:3000/api/health
```

**나레이션:**
```
먼저 시스템이 정상적으로 시작되었는지 확인하겠습니다.

보시는 것처럼 서버가 3000번 포트에서 실행 중이고,
4가지 스케줄러를 모두 사용할 수 있는 상태입니다.

Health Check API를 호출해보니 시스템이 정상 상태임을 확인했습니다.
```

**소요 시간:** 1분

---

## 시나리오 2: FCFS 스케줄러 (1:30 - 3:00)

### [화면] FCFS로 전환

**실행할 명령어:**
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{"type": "FCFS"}' | jq
```

**나레이션:**
```
먼저 가장 기본적인 FCFS, 선착순 스케줄러를 보여드리겠습니다.

FCFS는 가장 단순한 알고리즘으로, 
요청이 도착한 순서대로 처리합니다.

FCFS 스케줄러로 전환하겠습니다.
```

### [화면] 첫 번째 요청 제출

**실행할 명령어:**
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{
    "prompt": "What is CPU scheduling in operating systems?",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "priority": "NORMAL"
  }' | jq
```

**기대되는 응답:**
```json
{
  "success": true,
  "data": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "QUEUED",
    "priority": "NORMAL"
  }
}
```

### [화면] 서버 로그 확인

**나레이션:**
```
요청이 제출되었습니다. 서버 로그를 보면 
요청이 큐에 추가되고 순차적으로 처리되는 것을 볼 수 있습니다.

첫 번째 요청은 "What is CPU scheduling..."이라는 
간단한 질문입니다.

FCFS이므로 선착순으로 처리됩니다.
```

### [화면] 두 번째, 세 번째 요청 제출

**실행할 명령어:**
```bash
# 두 번째 요청
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{
    "prompt": "Explain preemptive vs non-preemptive scheduling.",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "priority": "NORMAL"
  }' &

# 세 번째 요청
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{
    "prompt": "Hello, this is a quick test.",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "priority": "NORMAL"
  }' &
```

**나레이션:**
```
두 번째와 세 번째 요청을 제출했습니다.

FCFS이므로 요청 1, 2, 3 순서대로 처리됩니다.

세 번째 요청이 가장 짧지만, 
세 번째로 제출되었으므로 세 번째로 처리됩니다.

이것이 FCFS의 특징인 Convoy Effect입니다. 
긴 작업이 짧은 작업들을 지연시키는 현상을 볼 수 있습니다.
```

**소요 시간:** 1분 30초

---

## 시나리오 3: Priority 스케줄러 (3:00 - 5:00)

### [화면] Priority로 전환

**실행할 명령어:**
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{"type": "PRIORITY"}' | jq
```

**나레이션:**
```
이제 우선순위 스케줄러로 전환해보겠습니다.

우선순위 스케줄러는 긴급한 요청을 먼저 처리합니다.
```

### [화면] LOW 우선순위 요청 먼저 제출

**실행할 명령어:**
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{
    "prompt": "Generate a comprehensive report on OS history.",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "priority": "LOW"
  }' | jq
```

**나레이션:**
```
먼저 LOW 우선순위 요청을 제출했습니다.
이 요청은 긴 보고서 생성 작업입니다.
```

### [화면] URGENT 우선순위 요청 제출

**실행할 명령어:**
```bash
sleep 2
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{
    "prompt": "URGENT: Security vulnerability detected! Analyze immediately.",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "priority": "URGENT"
  }' | jq
```

**서버 로그 기대 출력:**
```
[INFO] Processing URGENT request before LOW requests
[INFO] Request priority: URGENT (3)
```

**나레이션:**
```
그 후 URGENT 우선순위 요청을 제출했습니다.

서버 로그를 보시면, URGENT 요청이 
LOW 요청보다 먼저 처리되는 것을 볼 수 있습니다.

실제 환경에서는 긴급 보안 이슈나 
VIP 고객의 요청을 즉시 처리할 때 유용합니다.
```

### [화면] Aging 메커니즘 설명 (스크린)

**나레이션:**
```
우선순위 스케줄러의 문제점은 기아 현상(Starvation)입니다.

LOW 우선순위 요청이 계속 URGENT 요청에 밀려 
무한히 대기할 수 있습니다.

이를 해결하기 위해 Aging 메커니즘을 구현했습니다.

30초 이상 대기하면 우선순위가 한 단계 상승하고,
최대 90초 후에는 URGENT가 되어 반드시 처리됩니다.

이제 Priority 스케줄러 통계를 확인해보겠습니다.
```

### [화면] 통계 확인

**실행할 명령어:**
```bash
curl http://localhost:3000/api/scheduler/stats \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" | jq
```

**소요 시간:** 2분

---

## 시나리오 4: MLFQ 스케줄러 (5:00 - 7:00)

### [화면] MLFQ로 전환

**실행할 명령어:**
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{"type": "MLFQ"}' | jq
```

**나레이션:**
```
이제 MLFQ, 다단계 피드백 큐 스케줄러를 보여드리겠습니다.

MLFQ는 4개의 큐를 사용합니다:
- Q0: 1초 퀀텀 (짧은 대화형 요청)
- Q1: 3초 퀀텀 (중간 길이 요청)
- Q2: 8초 퀀텀 (긴 요청)
- Q3: 무제한 (배치 작업)

OSTEP 교재서 제시한 5가지 MLFQ 규칙을 모두 구현했습니다.
```

### [화면] 슬라이드 - MLFQ 5가지 규칙

```
MLFQ의 5가지 규칙 (OSTEP):

Rule 1: Priority(A) > Priority(B)이면 A 실행
Rule 2: Priority(A) = Priority(B)이면 Round-Robin
Rule 3: 새 작업 → 최고 우선순위 큐(Q0) 배치
Rule 4: 타임 슬라이스 초과 → 우선순위 강등
Rule 5: 주기적 Boosting (모든 작업 → Q0)
```

### [화면] 짧은 요청 제출 (Q0 예상)

**실행할 명령어:**
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{
    "prompt": "What is MLFQ?",
    "provider": {"name": "ollama", "model": "llama3.2"}
  }' | jq
```

**서버 로그 기대 출력:**
```
[INFO] [MLFQ] Job added to Q0 (quantum: 1000ms)
[INFO] [MLFQ] Processing job from Q0
```

### [화면] 긴 요청 제출 (Q2 또는 Q3 예상)

**실행할 명령어:**
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{
    "prompt": "Compare 10 different CPU scheduling algorithms with detailed examples.",
    "provider": {"name": "ollama", "model": "llama3.2"}
  }' | jq
```

**나레이션:**
```
짧은 요청은 Q0에서 빠르게 처리됩니다.

긴 요청은 시간 퀀텀을 초과하면 
하위 큐로 강등됩니다.

서버 로그를 보시면 "Time quantum exceeded" 메시지와 
함께 작업이 하위 큐로 이동하는 것을 볼 수 있습니다.
```

### [화면] Boosting 메커니즘

**나레이션:**
```
MLFQ의 핵심 기능 중 하나는 Boosting입니다.

60초마다 모든 작업을 최고 우선순위 큐(Q0)로 
재배치하여 기아 현상을 방지합니다.

이것은 OSTEP의 Rule 5에 해당합니다.
```

### [화면] MLFQ 통계 확인

**실행할 명령어:**
```bash
curl http://localhost:3000/api/scheduler/stats \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" | jq
```

**기대되는 응답:**
```json
{
  "queueDistribution": {
    "Q0": 6,
    "Q1": 5,
    "Q2": 3,
    "Q3": 1
  }
}
```

**나레이션:**
```
통계를 보면 각 큐별로 처리된 작업 수를 볼 수 있습니다.

대부분의 작업이 Q0과 Q1에서 처리되어 
빠른 응답 시간을 달성했습니다.

MLFQ는 실험 결과 가장 좋은 성능을 보였습니다.
```

**소요 시간:** 2분

---

## 시나리오 5: WFQ 스케줄러 - 핵심 공정성 시연 (7:00 - 8:30)

> **이 시나리오가 프로젝트의 핵심입니다.**

### [화면] 슬라이드 - 멀티테넌트 문제 상황

```
┌─────────────────────────────────────────────────────────┐
│              멀티테넌트 LLM 게이트웨이 문제             │
├─────────────────────────────────────────────────────────┤
│  Enterprise (대량 요청)  ────▶  [    LLM 게이트웨이    ]│
│  Premium (실시간 응대)   ────▶  [                      ]│
│  Standard (일반 사용)    ────▶  [    자원 독점 발생!   ]│
│  Free (개인 학습)        ────▶  [    기아 현상 발생!   ]│
└─────────────────────────────────────────────────────────┘
```

**나레이션:**
```
이제 프로젝트의 핵심인 WFQ 스케줄러를 보여드리겠습니다.

멀티테넌트 LLM 게이트웨이에서 Enterprise 고객이
대량 분석 작업을 요청하면 다른 테넌트가 피해를 봅니다.

Premium 고객의 실시간 고객 응대가 지연되고,
Free 사용자는 무기한 대기하는 기아 현상이 발생합니다.

WFQ는 이 문제를 해결합니다.
```

### [화면] WFQ로 전환

**실행할 명령어:**
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{"type": "WFQ"}' | jq
```

### [화면] 슬라이드 - 테넌트 등급별 가중치

```
┌─────────────────────────────────────────────────────────┐
│                  테넌트 등급별 가중치                    │
├─────────────────────────────────────────────────────────┤
│  Enterprise  │ 가중치 100 │ 대기업 고객, 최우선 처리    │
│  Premium     │ 가중치 50  │ 유료 구독자                 │
│  Standard    │ 가중치 10  │ 기본 유료 사용자            │
│  Free        │ 가중치 1   │ 무료 사용자                 │
└─────────────────────────────────────────────────────────┘
```

**나레이션:**
```
WFQ는 테넌트 등급별로 가중치를 부여합니다.

Enterprise는 가중치 100, Free는 가중치 1입니다.
100배 차이가 나지만, Free도 완전히 차단되지 않습니다.

이것이 WFQ의 핵심 원리인 "공정한 분배"입니다.
```

### [화면] Enterprise 대량 요청 시뮬레이션

**실행할 명령어:**
```bash
# Enterprise가 대량 배치 작업 5건 제출
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/requests \
    -H "Content-Type: application/json" \
    -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
    -d "{
      \"prompt\": \"Enterprise batch analytics query $i\",
      \"provider\": {\"name\": \"ollama\", \"model\": \"llama3.2\"},
      \"metadata\": {\"tenantId\": \"enterprise-001\", \"tier\": \"ENTERPRISE\"}
    }" &
done
```

**나레이션:**
```
Enterprise 테넌트가 대량 분석 작업 5건을 제출했습니다.

기존 FCFS 방식이면 다른 테넌트가 모두 대기해야 합니다.
WFQ에서는 어떻게 될까요?
```

### [화면] 다른 테넌트 요청 제출

**실행할 명령어:**
```bash
# Premium 테넌트 (실시간 고객 응대)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{
    "prompt": "Premium: Customer needs immediate help with order",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "metadata": {"tenantId": "premium-001", "tier": "PREMIUM"}
  }' | jq &

# Free 테넌트 (개인 학습)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{
    "prompt": "Free: Help me understand machine learning basics",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "metadata": {"tenantId": "free-001", "tier": "FREE"}
  }' | jq
```

**나레이션:**
```
Premium과 Free 테넌트도 요청을 제출했습니다.

서버 로그를 보면 Enterprise 요청만 처리되는 것이 아니라,
다른 테넌트의 요청도 가중치에 따라 분배되어 처리됩니다.

Free 테넌트도 기아 상태에 빠지지 않고 처리됩니다!
```

### [화면] 공정성 지표 확인 (Jain's Fairness Index)

**실행할 명령어:**
```bash
curl http://localhost:3000/api/scheduler/stats \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" | jq '.data.stats.fairnessMetrics'
```

**기대되는 응답:**
```json
{
  "jainsFairnessIndex": 0.92,
  "tenantDistribution": {
    "enterprise-001": { "processed": 5, "weight": 100, "share": 0.62 },
    "premium-001": { "processed": 1, "weight": 50, "share": 0.31 },
    "free-001": { "processed": 1, "weight": 1, "share": 0.01 }
  }
}
```

**나레이션:**
```
Jain's Fairness Index를 확인해보겠습니다.

테넌트 수준 JFI는 0.92로 매우 높은 공정성을 달성했습니다.
(참고: 시스템 수준 JFI는 0.32로, 테넌트 등급별 의도적 가중치 차등을 반영)
1.0이 완벽한 공정이고, 0.92는 거의 이상적인 수준입니다.

테넌트별 분포를 보면:
- Enterprise: 가중치 100 → 62% 자원 할당
- Premium: 가중치 50 → 31% 자원 할당
- Free: 가중치 1 → 1% 자원 할당

가중치에 비례한 공정한 분배가 이루어졌습니다!
```

**소요 시간:** 1분 30초

---

## 시나리오 6: 대시보드 및 마무리 (8:30 - 10:00)

### [화면] 전체 스케줄러 통계 비교

**실행할 명령어:**
```bash
curl http://localhost:3000/api/scheduler/stats/all \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" | jq
```

**나레이션:**
```
마지막으로 모든 스케줄러의 성능을 비교해보겠습니다.

```

### [화면] 슬라이드 - 성능 비교표

| 알고리즘 | 평균 대기 시간(ms) | 처리량(RPS) |
|---------|------------------|------------|
| FCFS | 48.25 | 6.3 |
| Priority | 32.18 | 6.2 |
| MLFQ | 28.45 | 6.4 |
| WFQ | 52.30 | 6.1 |

**나레이션:**
```
실험 결과 MLFQ가 가장 낮은 대기 시간(28.45ms)과 
가장 높은 처리량(6.4 RPS)을 기록했습니다.

Priority는 URGENT 요청의 대기 시간을 
74.1% 개선했습니다.

WFQ는 테넌트 수준에서 0.92-0.98의 높은 공정성 지수를 달성했습니다.
(시스템 수준 JFI 0.32는 테넌트 등급별 가중치 차등을 의도적으로 반영)

```

