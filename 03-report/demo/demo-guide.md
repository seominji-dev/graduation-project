# LLM Scheduler - Demo Video Guide

> **목적:** 5-10분 분량의 시연을 통해 LLM 스케줄러 시스템의 핵심 기능을 시연합니다.
>
> **대상:** 교수님, 심사위원님, 동료 학생들
>
> **준비 시간:** 약 15분 (서버 시작 및 환경 설정)

---

## 사전 준비 (Prerequisites)

### 1. 하드웨어/소프트웨어 요구사항

| 항목 | 요구사항 |
|------|----------|
| **Node.js** | v20.10.0 LTS 이상 |
| **Redis** | v7.2+ (포트 6379) |
| **MongoDB** | v8.0+ (포트 27017) |
| **Ollama** | Llama 3.2 모델 다운로드 (포트 11434) |
| **Terminal** | 3개 창 (API, Redis/MongoDB, Ollama) |
| **Browser** | Chrome/Firefox (대시보드용) |

### 2. 설치 확인

```bash
# Node.js 버전 확인
node --version  # v20.10.0 이상

# Redis 실행 확인
redis-cli ping  # PONG 응답

# MongoDB 실행 확인
mongosh --eval "db.version()"  # 버전 정보 출력

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

#### 1.1 Docker Compose로 인프라 시작 (권장)

```bash
# Redis + MongoDB 한 번에 시작
cd 02-implementation
docker-compose up -d

# 컨테이너 상태 확인
docker-compose ps
```

#### 1.2 Ollama 서버 시작

```bash
# 별도 터미널에서 Ollama 시작
ollama serve

# 모델이 없는 경우 다운로드
ollama pull llama3.2
```

#### 1.3 API 서버 시작

```bash
# 메인 터미널에서 API 서버 시작
cd 02-implementation
npm run dev

# 또는 빌드 후 실행
npm run build
npm start
```

#### 1.4 시작 확인

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

### 시나리오 5: WFQ 스케줄러 - 멀티테넌트 공정 분배

**5.1 WFQ 스케줄러로 전환**
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345" \
  -d '{"type": "WFQ"}'
```

**5.2 테넌트별 요청 제출**
```bash
# Enterprise (가중치 100)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345" \
  -d '{
    "prompt": "Enterprise query",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "metadata": {"tenantId": "enterprise-001", "tier": "ENTERPRISE"}
  }'

# Free (가중치 1)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-min-32-characters-long-example-key-12345" \
  -d '{
    "prompt": "Free tier query",
    "provider": {"name": "ollama", "model": "llama3.2"},
    "metadata": {"tenantId": "free-001", "tier": "FREE"}
  }'
```

**시연 포인트:**
- 가중치에 따른 공정한 분배
- Jain's Fairness Index로 공정성 측정

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

### Redis 연결 실패
```bash
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

### MongoDB 연결 실패
```bash
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Linux
```

### Ollama 연결 실패
```bash
ollama serve
ollama pull llama3.2
```

---

**작성일:** 2026-01-30
**버전:** 1.0.0
