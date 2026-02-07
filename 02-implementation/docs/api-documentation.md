# LLM Scheduler API Documentation

## Base URL

```
http://localhost:3000/api
```

## Overview

LLM Scheduler API는 OS 스케줄링 알고리즘을 활용한 LLM API 요청 관리 시스템입니다. FCFS, Priority, MLFQ, WFQ 4가지 스케줄링 알고리즘을 지원하며, REST API를 통해 요청 제출, 상태 조회, 통계 기능을 제공합니다.

---

## Authentication

현재 버전에서는 인증이 구현되어 있지 않습니다. 모든 엔드포인트는 인증 없이 접근 가능합니다.

---

## API Endpoints

### 1. Health Check

#### GET /health

서버 상태를 확인합니다.

**Request:**
```http
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "scheduler": "FCFS",
  "llm": "connected",
  "timestamp": "2026-02-07T10:00:00.000Z"
}
```

---

### 2. Request Management

#### POST /requests

새로운 LLM 요청을 제출하고 큐에 등록합니다.

**Request:**
```http
POST /api/requests
Content-Type: application/json
```

**Request Body:**
```json
{
  "prompt": "Explain quantum computing",
  "priority": 1,
  "tenantId": "enterprise-client-a",
  "tier": "enterprise",
  "estimatedTokens": 100
}
```

**Request Fields:**

| 필드 | 타입 | 필수 | 설명 |
|-----|------|-----|------|
| prompt | string | Y | LLM 전송 프롬프트 |
| priority | number | N | 우선순위 (0=LOW, 1=NORMAL, 2=HIGH, 3=URGENT) |
| tenantId | string | N | 테넌트 ID (WFQ용) |
| tier | string | N | 테넌트 등급 (enterprise, premium, standard, free) |
| estimatedTokens | number | N | 예상 토큰 수 |

**Response (201 Created):**
```json
{
  "message": "요청이 제출되었습니다",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "prompt는 필수입니다"
}
```

---

#### GET /requests/:id

요청 상태를 조회합니다.

**Request:**
```http
GET /api/requests/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "prompt": "Explain quantum computing",
  "status": "completed",
  "priority": 1,
  "createdAt": "2026-02-07T10:00:00.000Z",
  "completedAt": "2026-02-07T10:00:05.000Z",
  "response": "Quantum computing is..."
}
```

**Status Values:**
- `pending`: 초기 상태
- `queued`: 큐에 대기 중
- `processing`: 처리 중
- `completed`: 완료
- `failed`: 실패

---

#### GET /requests

전체 요청 목록을 조회합니다.

**Request:**
```http
GET /api/requests?status=queued
```

**Query Parameters:**
- `status` (optional): 상태별 필터링 (pending, queued, processing, completed, failed)

**Response (200 OK):**
```json
{
  "count": 5,
  "requests": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "prompt": "Explain quantum computing",
      "status": "queued",
      "priority": 1
    }
  ]
}
```

---

### 3. Scheduler Management

#### GET /scheduler/status

현재 활성화된 스케줄러 정보를 조회합니다.

**Request:**
```http
GET /api/scheduler/status
```

**Response (200 OK):**
```json
{
  "schedulerType": "FCFS",
  "queueSize": 5,
  "totalRequests": 150,
  "completedRequests": 120,
  "failedRequests": 5,
  "pendingRequests": 25
}
```

---

#### POST /scheduler/process

대기 중인 요청을 하나 처리합니다 (수동 트리거).

**Request:**
```http
POST /api/scheduler/process
```

**Response (200 OK):**
```json
{
  "message": "요청이 처리되었습니다",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "response": "Quantum computing is..."
}
```

**Response (200 OK) - No requests:**
```json
{
  "message": "처리할 요청이 없습니다"
}
```

---

### 4. Statistics

#### GET /stats

전체 통계를 조회합니다.

**Request:**
```http
GET /api/stats
```

**Response (200 OK):**
```json
{
  "current": {
    "scheduler": "FCFS",
    "queueSize": 5,
    "totalRequests": 150,
    "completedRequests": 120,
    "failedRequests": 5,
    "pendingRequests": 25
  },
  "historical": {
    "FCFS": {
      "avgWaitTime": 2571.75,
      "throughput": 17.99
    },
    "Priority": {
      "avgWaitTime": 2826.41,
      "throughput": 17.09
    }
  }
}
```

---

#### GET /stats/tenant/:tenantId

테넌트별 통계를 조회합니다.

**Request:**
```http
GET /api/stats/tenant/enterprise-client-a
```

**Response (200 OK):**
```json
{
  "tenantId": "enterprise-client-a",
  "totalRequests": 50,
  "avgWaitTime": 849.32,
  "completedRequests": 48
}
```

---

#### GET /logs

최근 요청 로그를 조회합니다.

**Request:**
```http
GET /api/logs?limit=50
```

**Query Parameters:**
- `limit` (optional): 반환할 로그 수 (기본값: 100)

**Response (200 OK):**
```json
{
  "count": 50,
  "logs": [
    {
      "requestId": "550e8400-e29b-41d4-a716-446655440000",
      "scheduler": "FCFS",
      "status": "completed",
      "waitTime": 1234,
      "processingTime": 5678,
      "timestamp": "2026-02-07T10:00:00.000Z"
    }
  ]
}
```

---

## Common Error Responses

### 400 Bad Request

```json
{
  "error": "prompt는 필수입니다"
}
```

### 404 Not Found

```json
{
  "error": "요청을 찾을 수 없습니다"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Scheduler Types

| 타입 | 설명 | 특징 |
|-----|------|------|
| FCFS | First-Come-First-Served | 선착순 처리 (기본값) |
| Priority | 우선순위 기반 | URGENT 요청 우선 + Aging 메커니즘 |
| MLFQ | 다단계 피드백 큐 | 4단계 큐 + Boost 메커니즘 |
| WFQ | 가중치 공정 큐 | 테넌트별 가중치 기반 공정 배분 |

---

## Examples

### Example 1: Submit a Request

```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing",
    "priority": 3,
    "tenantId": "enterprise-client-a",
    "tier": "enterprise"
  }'
```

### Example 2: Check Request Status

```bash
curl http://localhost:3000/api/requests/550e8400-e29b-41d4-a716-446655440000
```

### Example 3: Process Next Request

```bash
curl -X POST http://localhost:3000/api/scheduler/process
```

### Example 4: Get Statistics

```bash
curl http://localhost:3000/api/stats
```

---

## Running with Different Schedulers

```bash
# FCFS (default)
npm start

# Priority
SCHEDULER_TYPE=Priority npm start

# MLFQ
SCHEDULER_TYPE=MLFQ npm start

# WFQ
SCHEDULER_TYPE=WFQ npm start
```

---

## Version History

| 버전 | 날짜 | 변경사항 |
|-----|------|---------|
| 1.0.0 | 2026-02-07 | 초기 릴리스 (Simple 버전) |

---

## Support

For issues and questions, please visit the project repository.
