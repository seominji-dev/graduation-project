# 스크린샷 가이드 (Screenshots Guide)
## 발표용 스크린샷 캡처 가이드

---

## 스크린샷 목록 (Screenshots List)

발표용으로 필요한 스크린샷 10장을 캡처하세요.

---

## 1. 시스템 개요 (System Overview)

### 스크린샷 1: 프로젝트 구조

**캡처 대상:** VS Code 프로젝트 익스플로러

**내용:**
```
02-implementation/
├── src-simple/
│   ├── schedulers/
│   │   ├── FCFSScheduler.js
│   │   ├── PriorityScheduler.js
│   │   ├── MLFQScheduler.js
│   │   └── WFQScheduler.js
│   ├── api/
│   └── queue/
├── tests-simple/
└── coverage-simple/
```

**용도:** 시스템 구조 소개

---

## 2. 서버 실행 (Server Running)

### 스크린샷 2: 서버 시작 화면

**캡처 대상:** 터미널

**명령어:**
```bash
cd 02-implementation
npm start
```

**예상 출력:**
```
LLM API Scheduler running on http://localhost:3000
Current scheduler: FCFS
Ollama client: connected (model: llama3.2)
```

**용도:** 시스템 초기 상태

---

### 스크린샷 3: 헬스 체크

**캡처 대상:** 터미널 (curl 명령 실행)

**명령어:**
```bash
curl http://localhost:3000/api/health
```

**예상 출력:**
```json
{
  "status": "healthy",
  "scheduler": "FCFS",
  "uptime": 12345,
  "timestamp": "2026-02-11T10:30:00.000Z"
}
```

**용도:** API 동작 확인

---

## 3. FCFS 스케줄러 (FCFS Scheduler)

### 스크린샷 4: FCFS 요청 처리

**캡처 대상:** 터미널 또는 Postman

**명령어:**
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test request","priority":"NORMAL"}'
```

**예상 출력:**
```json
{
  "id": "req-001",
  "prompt": "Test request",
  "priority": "NORMAL",
  "status": "queued",
  "position": 1,
  "timestamp": "2026-02-11T10:30:01.000Z"
}
```

**용도:** FCFS 기본 동작

---

### 스크린샷 5: FCFS 처리 결과

**캡처 대상:** 터미널

**명령어:**
```bash
curl http://localhost:3000/api/requests
```

**예상 출력:**
```json
{
  "total": 10,
  "requests": [
    {"id": "req-001", "status": "completed", "waitTimeMs": 100},
    {"id": "req-002", "status": "completed", "waitTimeMs": 250},
    ...
  ]
}
```

**용도:** FCFS 순차 처리 확인

---

## 4. Priority 스케줄러 (Priority Scheduler)

### 스크린샷 6: Priority 우선순위 처리

**캡처 대상:** 터미널

**명령어:**
```bash
# 스케줄러 변경
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -d '{"scheduler":"priority"}'

# LOW 요청
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"LOW request","priority":"LOW"}'

# URGENT 요청
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"URGENT request","priority":"URGENT"}'
```

**예상 출력:**
```json
{
  "id": "req-urgent",
  "prompt": "URGENT request",
  "priority": "URGENT",
  "status": "processing",
  "waitTimeMs": 50
}
```

**용도:** Priority 우선순위 동작

---

## 5. MLFQ 스케줄러 (MLFQ Scheduler)

### 스크린샷 7: MLFQ 큐 상태

**캡처 대상:** 터미널

**명령어:**
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -d '{"scheduler":"mlfq"}'

curl http://localhost:3000/api/scheduler/status
```

**예상 출력:**
```json
{
  "scheduler": "MLFQ",
  "queues": {
    "Q0": 2,
    "Q1": 1,
    "Q2": 0,
    "Q3": 0
  },
  "preemptiveMode": true,
  "timeSliceMs": 500
}
```

**용도:** MLFQ 다단계 큐 구조

---

## 6. WFQ 스케줄러 (WFQ Scheduler)

### 스크린샷 8: WFQ 공정성 지표

**캡처 대상:** 터미널 또는 브라우저

**명령어:**
```bash
curl http://localhost:3000/api/fairness
```

**예상 출력:**
```json
{
  "scheduler": "WFQ",
  "fairnessIndex": 0.89,
  "systemLevel": 0.89,
  "tenantLevel": {
    "enterprise-1": 0.98,
    "premium-1": 0.96,
    "standard-1": 0.94,
    "free-1": 0.92
  },
  "timestamp": "2026-02-11T10:35:00.000Z"
}
```

**용도:** WFQ 공정성 측정

---

### 스크린샷 9: WFQ 테넌트별 통계

**캡처 대상:** 터미널

**명령어:**
```bash
curl http://localhost:3000/api/stats/tenant/enterprise-1
```

**예상 출력:**
```json
{
  "tenantId": "enterprise-1",
  "tier": "enterprise",
  "weight": 100,
  "totalRequests": 25,
  "completedRequests": 20,
  "avgWaitTimeMs": 849,
  "fairnessIndex": 0.98
}
```

**용도:** 테넌트별 성능 차등

---

## 7. 테스트 결과 (Test Results)

### 스크린샷 10: Jest 테스트 결과

**캡처 대상:** 터미널

**명령어:**
```bash
cd 02-implementation
npm test
```

**예상 출력:**
```
PASS tests-simple/schedulers/FCFSScheduler.test.js
PASS tests-simple/schedulers/PriorityScheduler.test.js
PASS tests-simple/schedulers/MLFQScheduler.test.js
PASS tests-simple/schedulers/WFQScheduler.test.js
PASS tests-simple/api-integration.test.js

Test Suites: 12 passed, 12 total
Tests:       307 passed, 307 total
Snapshots:   0 total
Time:        0.716s
```

**용도:** 품질 검증 결과

---

## 8. 커버리지 리포트 (Coverage Report)

### 스크린샷 11: 코드 커버리지

**캡처 대상:** 브라우저

**URL:**
```
file:///path/to/02-implementation/coverage-simple/lcov-report/index.html
```

**내용:**
- Statements: 99.76%
- Branches: 94.11%
- Functions: 98.18%
- Lines: 99.75%

**용도:** 코드 품질 지표

---

## 스크린샷 캡처 팁 (Tips)

### 1. 일관된 크기 유지
- 해상도: 1920x1080 권장
- 배경: 깨끗한 바탕화면

### 2. 중요 정보 강조
- 터미널: 밝은 배경, 어두운 글씨
- 브라우저: 즐겨찾기 바 숨기기

### 3. 파일명 규칙
```
01-project-structure.png
02-server-start.png
03-health-check.png
04-fcfs-request.png
05-fcfs-result.png
06-priority-urgent.png
07-mlfq-queues.png
08-wfq-fairness.png
09-wfq-tenant-stats.png
10-test-results.png
11-coverage-report.png
```

### 4. 캡처 도구
- macOS: Cmd + Shift + 4 (영역 선택)
- Windows: Win + Shift + S (스니핑 도구)
- 도구: CleanShot X, Snagit

---

**스크린샷 가이드 작성일:** 2026년 2월 11일
