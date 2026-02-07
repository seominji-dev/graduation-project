# 멀티테넌트 LLM 게이트웨이 - 공정성 데모 가이드

> **목적:** 5-10분 분량의 시연을 통해 멀티테넌트 LLM 게이트웨이에서 테넌트 간 공정한 자원 분배를 시연합니다.
>
> **핵심 메시지:** OS 스케줄링 알고리즘(특히 WFQ)을 활용하여 여러 테넌트가 공유하는 LLM 게이트웨이에서 공정성을 보장합니다.
>
> **대상:** 교수님, 심사위원님, 동료 학생들
>
> **준비 시간:** 약 15분 (서버 시작 및 환경 설정)

---

## 사전 준비 (Prerequisites)

### 1. 하드웨어/소프트웨어 요구사항

| 항목 | 요구사항 |
|------|----------|
| **Node.js** | v22.0.0 LTS 이상 |
| **Ollama** | Llama 3.2 모델 다운로드 (포트 11434) |
| **Terminal** | 2개 창 (API, Ollama) |
| **Browser** | Chrome/Firefox (API 테스트용) |

### 2. 설치 확인

```bash
# Node.js 버전 확인
node --version  # v22.0.0 이상

# Ollama 실행 확인
ollama list  # llama3.2 모델 확인
```

### 3. 프로젝트 설정

```bash
# 의존성 설치
cd 02-implementation
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에서 필요한 값 수정 (API_KEY 등)
```

---

## 시나리오별 가이드

### 시나리오 1: 시스템 시작 (System Startup)

**목표:** 모든 컴포넌트가 정상적으로 시작되는지 확인합니다.

**단계별 진행:**

#### 1.1 Ollama 서버 시작

```bash
# 별도 터미널에서 Ollama 시작
ollama serve

# 모델이 없는 경우 다운로드
ollama pull llama3.2
```

#### 1.2 API 서버 시작

```bash
# 메인 터미널에서 API 서버 시작
cd 02-implementation
npm run dev

# 또는 직접 실행
node src/app.js
```

#### 1.3 시작 확인

**기대되는 로그 출력:**
```
==================================================
LLM Scheduler Server Started
==================================================
Environment: development
Server running on: http://localhost:3000
Scheduler type: FCFS (default)
Available schedulers: FCFS, Priority, MLFQ, WFQ
Health check: http://localhost:3000/api/health
Switch scheduler: POST http://localhost:3000/api/scheduler/switch
Security: Helmet.js enabled with CSP
CORS: Restricted to allowed origins
Distributed Tracing: Correlation ID enabled
==================================================
```

**Health Check API 테스트:**
```bash
curl http://localhost:3000/api/health
```

**기대되는 응답:**
```json
{
  "success": true,
  "message": "LLM Scheduler API is running",
  "timestamp": "2026-01-30T12:00:00.000Z"
}
```

**시연 포인트:**
- 서버가 정상적으로 시작되는지 확인
- 모든 컴포넌트가 연결되는지 로그로 보여줌
- Health Check API로 시스템 상태 확인

---

### 시나리오 2: FCFS 스케줄러 - 기본 요청 처리

**목표:** FCFS(선착순) 스케줄러가 요청을 도착 순서대로 처리하는 것을 보여줍니다.

**2.1 FCFS로 전환**
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345" \
  -d '{"type": "FCFS"}'
```

**2.2 요청 제출**

```bash
# 요청 1
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345" \
  -d '{
    "prompt": "What is CPU scheduling?",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "priority": "NORMAL"
  }'
```

**시연 포인트:**
- FCFS는 요청이 도착한 순서대로 처리됨
- 선착순이므로 우선순위 무시

---

### 시나리오 3: Priority 스케줄러 - 긴급 요청 우선 처리

**3.1 Priority 스케줄러로 전환**
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345" \
  -d '{"type": "PRIORITY"}'
```

**3.2 URGENT 요청 제출**
```bash
# LOW 요청 먼저 제출
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345" \
  -d '{
    "prompt": "Generate a detailed report.",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "priority": "LOW"
  }'

# URGENT 요청 나중에 제출하지만 먼저 처리됨
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345" \
  -d '{
    "prompt": "URGENT: Security issue!",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "priority": "URGENT"
  }'
```

**시연 포인트:**
- URGENT 요청이 LOW 요청보다 먼저 처리됨
- 우선순위: URGENT > HIGH > NORMAL > LOW

---

### 시나리오 4: MLFQ 스케줄러 - 4단계 큐 작업 이동

**4.1 MLFQ 스케줄러로 전환**
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345" \
  -d '{"type": "MLFQ"}'
```

**4.2 다양한 길이의 요청 제출**
```bash
# 짧은 요청 (Q0 예상)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345" \
  -d '{
    "prompt": "What is MLFQ?",
    "provider": {"name": "ollama", "model": "llama3.2"}
  }'
```

**시연 포인트:**
- 짧은 요청은 Q0에서 빠르게 처리
- 긴 요청은 하위 큐로 강됨
- 주기적 Boosting (60초마다)

---

### 시나리오 5: WFQ 스케줄러 - 멀티테넌트 공정 분배 (핵심 시나리오)

> **이 시나리오가 프로젝트의 핵심입니다.** 여러 테넌트가 LLM 게이트웨이를 공유할 때 발생하는 자원 독점, 기아 현상을 WFQ로 해결합니다.

**테넌트 등급별 가중치:**
| 등급 | 가중치 | 설명 |
|------|--------|------|
| Enterprise | 100 | 대기업 고객, 최우선 처리 |
| Premium | 50 | 유료 구독자 |
| Standard | 10 | 기본 유료 사용자 |
| Free | 1 | 무료 사용자 |

**5.1 WFQ 스케줄러로 전환**
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345" \
  -d '{"type": "WFQ"}'
```

**5.2 테넌트별 요청 제출 (공정성 테스트)**

```bash
# Enterprise 테넌트 (가중치 100) - 대량 요청 시뮬레이션
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/requests \
    -H "Content-Type: application/json" \
    -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345" \
    -d "{
      \"prompt\": \"Enterprise batch query $i\",
      \"provider\": {\"name\": \"ollama\", \"model\": \"llama3.2\"},
      \"metadata\": {\"tenantId\": \"enterprise-001\", \"tier\": \"ENTERPRISE\"}
    }" &
done

# Premium 테넌트 (가중치 50)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345" \
  -d '{
    "prompt": "Premium user real-time customer service query",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "metadata": {"tenantId": "premium-001", "tier": "PREMIUM"}
  }'

# Standard 테넌트 (가중치 10)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345" \
  -d '{
    "prompt": "Standard user general query",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "metadata": {"tenantId": "standard-001", "tier": "STANDARD"}
  }'

# Free 테넌트 (가중치 1)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345" \
  -d '{
    "prompt": "Free tier learning query",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "metadata": {"tenantId": "free-001", "tier": "FREE"}
  }'
```

**5.3 공정성 지표 확인 (Jain's Fairness Index)**
```bash
# 공정성 메트릭 조회
curl http://localhost:3000/api/scheduler/stats \
  -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345" | jq '.data.stats.fairnessMetrics'
```

**기대 결과:**
```json
{
  "jainsFairnessIndex": 0.92,
  "tenantDistribution": {
    "enterprise-001": { "processed": 5, "weight": 100, "normalizedShare": 0.62 },
    "premium-001": { "processed": 1, "weight": 50, "normalizedShare": 0.31 },
    "standard-001": { "processed": 1, "weight": 10, "normalizedShare": 0.06 },
    "free-001": { "processed": 1, "weight": 1, "normalizedShare": 0.01 }
  }
}
```

**시연 포인트:**
- **자원 독점 방지:** Enterprise가 대량 요청해도 다른 테넌트 차단 안 함
- **기아 현상 방지:** Free 테넌트도 무기한 대기 없이 처리됨
- **가중치 비례 분배:** 테넌트 등급에 따른 공정한 자원 할당
- **Jain's Fairness Index 0.92+:** 정량적 공정성 입증

---

### 시나리오 6: 대시보드 - 실시간 모니터링

**6.1 통계 확인**
```bash
curl http://localhost:3000/api/scheduler/stats \
  -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345"
```

**6.2 Prometheus 메트릭**
```bash
curl http://localhost:3000/metrics
```

**시연 포인트:**
- 실시간 성능 메트릭
- 큐별 작업 분포

---

## 문제 해결

### Ollama 연결 실패
```bash
ollama serve
ollama pull llama3.2
```

### SQLite 오류
```bash
# better-sqlite3 재설치
npm rebuild better-sqlite3
```

---

**작성일:** 2026-01-30
**버전:** 1.0.0
