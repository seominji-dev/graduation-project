# 데모 시나리오 (Demo Scenario)
## LLM API 스케줄러 시스템 데모 가이드

---

## 데모 개요 (Demo Overview)

**데모 목표:** 5가지 스케줄링 알고리즘의 실제 동작을 시연하고, 각 알고리즘의 특징을 시각적으로 보여줍니다.

**데모 시간:** 3분

**사용 도구:**
- Terminal (터미널)
- curl 또는 Postman
- 브라우저 (선택)

---

## 사전 준비 (Prerequisites)

### 1. 서버 시작

```bash
cd 02-implementation
npm start
```

예상 출력:
```
LLM API Scheduler running on http://localhost:3000
Current scheduler: FCFS
```

### 2. 헬스 체크

```bash
curl http://localhost:3000/api/health
```

예상 응답:
```json
{
  "status": "healthy",
  "scheduler": "FCFS",
  "timestamp": "2026-02-11T00:00:00.000Z"
}
```

---

## 데모 시나리오 (Demo Scenario)

### 시나리오 1: FCFS 기본 동작 (30초)

**목표:** FCFS가 요청 도착 순서대로 처리함을 보여줍니다.

**순서:**

1. **10개 요청 제출 (랜덤 우선순위)**
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/requests \
    -H "Content-Type: application/json" \
    -d "{\"prompt\":\"Test request $i\",\"priority\":\"$([RANDOM]%4)\"}"
done
```

2. **요청 처리**
```bash
curl -X POST http://localhost:3000/api/scheduler/process
```

3. **결과 확인**
```bash
curl http://localhost:3000/api/requests
```

**설명 포인트:**
- "요청이 도착한 순서대로 처리됨을 확인할 수 있습니다"
- "우선순위와 무관하게 FCFS 동작을 보여줍니다"

---

### 시나리오 2: Priority 우선순위 (30초)

**목표:** Priority 스케줄러가 URGENT 요청을 먼저 처리함을 보여줍니다.

**순서:**

1. **스케줄러 변경**
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -d '{"scheduler":"priority"}'
```

2. **혼합 우선순위 요청 제출**
```bash
# LOW 요청 3개
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"LOW request 1","priority":"LOW"}'
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"LOW request 2","priority":"LOW"}'
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"LOW request 3","priority":"LOW"}'

# URGENT 요청 1개
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"URGENT request","priority":"URGENT"}'
```

3. **요청 처리 및 결과 확인**
```bash
curl -X POST http://localhost:3000/api/scheduler/process
curl http://localhost:3000/api/requests
```

**설명 포인트:**
- "URGENT 요청이 먼저 도착했음에도 불구하고 가장 먼저 처리됩니다"
- "Priority 스케줄러는 우선순위에 따라 처리 순서를 결정합니다"

---

### 시나리오 3: MLFQ 선점형 동작 (45초)

**목표:** MLFQ가 짧은 요청을 빠르게 처리함을 보여줍니다.

**순서:**

1. **스케줄러 변경**
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -d '{"scheduler":"mlfq"}'
```

2. **혼합 작업 길이 요청 제출**
```bash
# Long 요청 먼저 제출
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Explain quantum computing in detail","priority":"NORMAL"}'

# Short 요청 제출 (Long 요청 뒤에)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is 2+2?","priority":"NORMAL"}'
```

3. **요청 처리**
```bash
curl -X POST http://localhost:3000/api/scheduler/process
```

**설명 포인트:**
- "Short 요청이 Long 요청 뒤에 도착했지만, MLFQ의 Q0에서 빠르게 처리됩니다"
- "시간 슬라이스 500ms 기반 선점형 동작을 보여줍니다"

---

### 시나리오 4: WFQ 공정성 (45초)

**목표:** WFQ가 테넌트 등급별 가중치에 비례하여 처리함을 보여줍니다.

**순서:**

1. **스케줄러 변경**
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -d '{"scheduler":"wfq"}'
```

2. **다중 테넌트 요청 제출**
```bash
# Free 테넌트 요청 3개
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Free tenant request 1","tenantId":"free-1","priority":"NORMAL"}'
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Free tenant request 2","tenantId":"free-1","priority":"NORMAL"}'
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Free tenant request 3","tenantId":"free-1","priority":"NORMAL"}'

# Enterprise 테넌트 요청 1개
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Enterprise tenant request","tenantId":"enterprise-1","priority":"NORMAL"}'
```

3. **공정성 지표 확인**
```bash
curl http://localhost:3000/api/fairness
```

예상 응답:
```json
{
  "scheduler": "WFQ",
  "fairnessIndex": 0.89,
  "systemLevel": 0.89,
  "tenantLevel": {
    "enterprise-1": 0.98,
    "free-1": 0.95
  },
  "timestamp": "2026-02-11T00:00:00.000Z"
}
```

**설명 포인트:**
- "시스템 JFI 0.89는 의도한 가중치 기반 불공정을 나타냅니다"
- "테넌트 JFI 0.95-0.98은 동일 등급 내 공정성을 나타냅니다"
- "Enterprise 테넌트가 Free 테넌트 대비 5.8배 빠른 응답을 받습니다"

---

### 시나리오 5: 통계 확인 (30초)

**목표:** 시스템 통계와 공정성 지표를 확인합니다.

**순서:**

1. **전체 통계 확인**
```bash
curl http://localhost:3000/api/stats
```

2. **테넌트별 통계 확인**
```bash
curl http://localhost:3000/api/stats/tenant/enterprise-1
```

**설명 포인트:**
- "실시간 통계와 공정성 지표를 API로 확인할 수 있습니다"
- "Provider가 시스템 상태를 모니터링할 수 있습니다"

---

## 스크린샷 체크리스트 (Screenshot Checklist)

데모 중 다음 스크린샷을 캡처하세요:

| 번호 | 스크린샷 내용 | 용도 |
|------|-------------|------|
| 1 | 서버 시작 화면 | 시스템 초기 상태 |
| 2 | FCFS 요청 처리 결과 | 기본 동작 |
| 3 | Priority URGENT 우선 처리 | 우선순위 동작 |
| 4 | MLFQ Short 요청 빠른 처리 | 선점형 동작 |
| 5 | WFQ 공정성 지표 | JFI 측정 |
| 6 | 통계 대시보드 | 시스템 모니터링 |

---

## 비상 계획 (Contingency Plan)

### 문제 1: Ollama 연결 실패

**대처:** Mock 모드 사용
```bash
export USE_MOCK_LLM=true
npm start
```

### 문제 2: 포트 충돌

**대처:** 포트 변경
```bash
export PORT=3001
npm start
```

### 문제 3: 요청 타임아웃

**대처:** 타임아웃 값 증가
```bash
curl --max-time 30 http://localhost:3000/api/scheduler/process
```

---

## 발표자 스크립트 (Demo Script)

### 오프닝
"이제 실제 시스템 데모를 보여드리겠습니다. 터미널을 열고 서버를 시작하겠습니다."

### FCFS 데모
"먼저 FCFS 스케줄러를 보여드리겠습니다. 10개 요청을 제출하고, 처리 순서를 확인해 보겠습니다. 요청이 도착한 순서대로 처리되는 것을 볼 수 있습니다."

### Priority 데모
"이제 Priority 스케줄러로 변경하겠습니다. LOW 요청 3개를 먼저 제출하고, 그 다음 URGENT 요청을 제출하겠습니다. 처리해 보니 URGENT 요청이 먼저 처리되는 것을 볼 수 있습니다. 이는 Priority 스케줄러가 우선순위에 따라 처리 순서를 결정하기 때문입니다."

### MLFQ 데모
"MLFQ 스케줄러로 변경하겠습니다. Long 요청을 먼저 제출하고, Short 요청을 제출하겠습니다. 처리해 보니 Short 요청이 먼저 완료되는 것을 볼 수 있습니다. MLFQ는 짧은 요청을 상위 큐에서 빠르게 처리합니다."

### WFQ 데모
"마지막으로 WFQ 스케줄러를 보여드리겠습니다. Free 테넌트 요청 3개를 먼저 제출하고, Enterprise 요청을 제출하겠습니다. `/api/fairness` 엔드포인트를 확인해 보니 시스템 JFI가 0.89, 테넌트 JFI가 0.95 이상입니다. 이는 가중치 기반 차등화가 제대로 작동하고 있음을 보여줍니다."

### 클로징
"데모를 통해 각 스케줄러의 특징을 확인했습니다. FCFS는 순서대로, Priority는 긴급한 요청을, MLFQ는 짧은 요청을, WFQ는 가중치에 비례하여 처리합니다. 감사합니다."

---

**데모 시나리오 작성일:** 2026년 2월 11일
**최종 수정일:** 2026년 2월 11일
