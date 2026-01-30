# LLM Scheduler - Demo Script

> **시연 시간:** 5-10분
> **대상:** 졸업 심사위원
> **목적:** OS 스케줄링 알고리즘 기반 LLM API 요청 최적화 시스템 시연

---

## 시연 준비 체크리스트

시연 시작 전 확인 사항:
- [ ] Redis 서버 실행 중 (포트 6379)
- [ ] MongoDB 서버 실행 중 (포트 27017)
- [ ] Ollama 서버 실행 중 (포트 11434)
- [ ] API 서버 실행 중 (포트 3000)
- [ ] 터미널 3개 준비 (서버 로그, curl 요청,监控系统)
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
저는 운영체제의 검증된 스케줄링 알고리즘을 
LLM API 요청 관리 시스템에 적용하는 프로젝트를 진행했습니다.

지금부터 4가지 스케줄링 알고리즘의 실제 동작을 
직접 보여드리겠습니다.
```

---

## 시나리오 1: 시스템 시작 (0:30 - 1:30)

### [화면] 터미널 - 서버 시작 로그

**실행할 명령어:**
```bash
cd 02-implementation
npm run dev
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

## 시나리오 5: WFQ 스케줄러 (7:00 - 8:30)

### [화면] WFQ로 전환

**실행할 명령어:**
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{"type": "WFQ"}' | jq
```

**나레이션:**
```
마지막으로 WFQ, 가중치 공정 큐 스케줄러를 보여드리겠습니다.

WFQ는 멀티테넌트 환경에서 
공정한 자원 분배를 보장합니다.

SaaS 서비스서 유료/무료 사용자 간의 
공정한 분배가 필요할 때 유용합니다.
```

### [화면] Enterprise 테넌트 요청

**실행할 명령어:**
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{
    "prompt": "Enterprise: Analyze system performance.",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "metadata": {"tenantId": "enterprise-001", "tier": "ENTERPRISE"}
  }' | jq
```

**나레이션:**
```
Enterprise 테넌트(가중치 100) 요청을 제출했습니다.
```

### [화면] Free 테넌트 요청

**실행할 명령어:**
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" \
  -d '{
    "prompt": "Free: Basic question.",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "metadata": {"tenantId": "free-001", "tier": "FREE"}
  }' | jq
```

**나레이션:**
```
Free 테넌트(가중치 1) 요청도 제출했습니다.

가중치 차이가 크지만, 
Free 테넌트도 완전히 차단되지는 않습니다.

이것이 WFQ의 공정성 보장 메커니즘입니다.
```

### [화면] 공정성 지표 확인

**실행할 명령어:**
```bash
curl http://localhost:3000/api/scheduler/stats \
  -H "X-API-Key: demo-api-key-32-characters-long-for-testing" | jq '.data.stats.fairnessMetrics'
```

**기대되는 응답:**
```json
{
  "jainsFairnessIndex": 0.89,
  "fairnessScore": 89
}
```

**나레이션:**
```
Jain's Fairness Index를 보면 
0.89로 매우 높은 공정성을 달성했습니다.

1.0이 완벽한 공정이고, 
0.89는 거의 완벽에 가까운 수준입니다.
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

WFQ는 0.89의 공정성 지수를 달성했습니다.

```

### [화면] Prometheus 메트릭

**실행할 명령어:**
```bash
curl http://localhost:3000/metrics | head -20
```

**나레이션:**
```
Prometheus 메트릭도 지원하여 
실시간 모니터링이 가능합니다.
```

---

## 종료 멘트 (9:30 - 10:00)

**나레이션:**
```
지금까지 LLM 스케줄러 시스템의 4가지 알고리즘을 
시연해 보았습니다.

**핵심 성과 요약:**

1. 777개 테스트 100% 통과
2. 98.72% 코드 커버리지
3. TRUST 5 품질 점수 88/100
4. MLFQ 대기 시간 40% 개선
5. WFQ 공정성 지수 0.89 달성

**학술적 기여:**
- OS 이론과 AI 시스템 융합 연구
- MLFQ 5가지 규칙의 LLM 환경 재해석
- WFQ Virtual Time의 멀티테넌트 적용

**실무적 기여:**
- 런타임 알고리즘 교체 가능 구조
- Aging, Boosting 기아 방지 메커니즘
- SaaS 멀티테넌트 서비스 바로 적용 가능

시연해 주셔서 감사합니다.
질문이 있으시면 편하게 물어봐 주세요.
```

---

## 예상 질문 및 답변

### Q1: 실제 OpenAI API를 사용하지 않은 한계는?

**답변:**
```
Ollama Llama 3.2를 사용하여 로컬 환경서 실험했습니다.
로컬 LLM으로도 스케줄링 알고리즘의 유효성을 입증했습니다.
실제 OpenAI API와의 통합은 향후 연구 과제입니다.
```

### Q2: 분산 환경에서의 확장성은?

**답변:**
```
현재 단일 서버 환경서 구현되었습니다.
BullMQ Cluster 기능으로 Redis Cluster 지원 가능합니다.
향후 연구서 분산 환경 검증 계획입니다.
```

### Q3: 동적 알고리즘 선택은?

**답변:**
```
현재는 런타임에 수동으로 선택합니다.
향후 머신러닝 기반 자동 선택 메커니즘을 계획 중입니다.
```

---

## 시연 팁

### 성공적인 시연을 위한 팁

1. **사전 테스트:** 모든 curl 명령어를 미리 실행해보기
2. **예비 계획:** LLM 응답이 느린 경우 짧은 프롬프트 준비
3. **로그 활용:** 서버 로그를 화면에 표시하여 처리 과정 시각화
4. **시간 관리:** 각 시나리오에 1-2분 할당
5. **스크립트 준비:** curl 명령어를 미리 작성하여 복사+붙여넣기

### 문제 발생 시 대처

**문제: LLM 응답이 너무 느림**
- 해결: "Hello" 같은 간단한 프롬프트로 대처
- 대안: 처리 중인 상태로 설명 완료

**문제: 서버가 응답하지 않음**
- 해결: 서버 재시작 및 로그 확인
- 대안: 미리 녹화된 동영상 재생

**문제: Redis/MongoDB 연결 실패**
- 해결: docker-compose로 재시작
- 대안: 인메모리 모드로 시연 (설명으로 대체)

---

**작성일:** 2026-01-30
**버전:** 1.0.0
**작성자:** 서민지 (LLM Scheduler 팀)
