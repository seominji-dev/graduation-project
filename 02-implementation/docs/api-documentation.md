# LLM Scheduler API Documentation

## Base URL

```
http://localhost:3000/api
```

## Overview

LLM Scheduler API는 OS 스케줄링 알고리즘을 활용한 LLM API 요청 관리 시스템입니다. FCFS, Priority, MLFQ, WFQ 4가지 스케줄링 알고리즘을 지원하며, REST API를 통해 요청 제출, 상태 조회, 스케줄러 전환 기능을 제공합니다.

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
  "success": true,
  "message": "LLM Scheduler API is running",
  "timestamp": "2026-01-30T10:00:00.000Z"
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
  "provider": {
    "name": "ollama",
    "model": "llama2",
    "baseUrl": "http://localhost:11434"
  },
  "priority": 1,
  "metadata": {
    "userId": "user-123",
    "tenantId": "enterprise-client-a"
  }
}
```

**Request Fields:**

| 필드 | 타입 | 필수 | 설명 |
|-----|------|-----|------|
| prompt | string | Y | LLM 전송 프롬프트 |
| provider | object | Y | LLM 제공자 설정 |
| provider.name | string | Y | "ollama" 또는 "openai" |
| provider.model | string | N | 모델 이름 |
| provider.baseUrl | string | N | API 기본 URL |
| provider.apiKey | string | N | API 키 (OpenAI용) |
| priority | number | N | 우선순위 (0=LOW, 1=NORMAL, 2=HIGH, 3=URGENT) |
| metadata | object | N | 추가 메타데이터 |

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "queued",
    "priority": 1,
    "createdAt": "2026-01-30T10:00:00.000Z"
  },
  "message": "Request queued successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_type",
      "message": "Prompt is required"
    }
  ]
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
  "success": true,
  "data": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed"
  }
}
```

**Status Values:**
- `pending`: 초기 상태
- `queued`: 큐에 대기 중
- `processing`: 처리 중
- `completed`: 완료
- `failed`: 실패
- `cancelled`: 취소됨

---

#### DELETE /requests/:id

대기 중인 요청을 취소합니다.

**Request:**
```http
DELETE /api/requests/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "cancelled"
  },
  "message": "Request cancelled successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Request not found or cannot be cancelled"
}
```

---

### 3. Scheduler Management

#### GET /scheduler/current

현재 활성화된 스케줄러 정보를 조회합니다.

**Request:**
```http
GET /api/scheduler/current
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "type": "fcfs",
    "stats": {
      "totalRequests": 150,
      "completedRequests": 120,
      "failedRequests": 5,
      "pendingRequests": 25,
      "averageWaitTime": 1234,
      "averageProcessingTime": 5678
    }
  }
}
```

---

#### GET /scheduler/available

사용 가능한 스케줄러 목록을 조회합니다.

**Request:**
```http
GET /api/scheduler/available
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "available": ["fcfs", "priority", "mlfq", "wfq"],
    "current": "fcfs",
    "descriptions": {
      "fcfs": "First-Come-First-Served: Process requests in arrival order",
      "priority": "Priority-based scheduling with aging mechanism",
      "mlfq": "Multi-Level Feedback Queue with dynamic priority adjustment",
      "wfq": "Weighted Fair Queuing for multi-tenant environments"
    }
  }
}
```

**Scheduler Types:**
- `fcfs`: 선착순 처리
- `priority`: 우선순위 기반 + Aging 메커니즘
- `mlfq`: 4단계 MLFQ + Boost 메커니즘
- `wfq`: 테넌트별 가중치 기반 공정 스케줄링

---

#### POST /scheduler/switch

스케줄러를 전환합니다.

**Request:**
```http
POST /api/scheduler/switch
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "priority"
}
```

**Request Fields:**

| 필드 | 타입 | 필수 | 설명 |
|-----|------|-----|------|
| type | string | Y | 스케줄러 타입 (fcfs, priority, mlfq, wfq) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "previousType": "fcfs",
    "currentType": "priority",
    "stats": {
      "totalRequests": 0,
      "completedRequests": 0,
      "failedRequests": 0,
      "pendingRequests": 0,
      "averageWaitTime": 0,
      "averageProcessingTime": 0
    }
  },
  "message": "Successfully switched to priority scheduler"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Failed to switch scheduler",
  "message": "Could not switch to invalid scheduler"
}
```

---

#### GET /scheduler/stats

현재 스케줄러 통계를 조회합니다.

**Request:**
```http
GET /api/scheduler/stats
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "type": "mlfq",
    "stats": {
      "totalRequests": 200,
      "completedRequests": 180,
      "failedRequests": 8,
      "pendingRequests": 12,
      "averageWaitTime": 856,
      "averageProcessingTime": 4521,
      "queueLevels": {
        "q0": 5,
        "q1": 4,
        "q2": 2,
        "q3": 1
      }
    }
  }
}
```

---

#### GET /scheduler/stats/all

모든 스케줄러 통계를 조회합니다.

**Request:**
```http
GET /api/scheduler/stats/all
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "fcfs": {
      "totalRequests": 150,
      "completedRequests": 120,
      "failedRequests": 5,
      "pendingRequests": 25,
      "averageWaitTime": 1234,
      "averageProcessingTime": 5678
    },
    "priority": {
      "totalRequests": 180,
      "completedRequests": 165,
      "failedRequests": 6,
      "pendingRequests": 9,
      "averageWaitTime": 856,
      "averageProcessingTime": 5123
    },
    "mlfq": {
      "totalRequests": 200,
      "completedRequests": 180,
      "failedRequests": 8,
      "pendingRequests": 12,
      "averageWaitTime": 742,
      "averageProcessingTime": 4521,
      "queueLevels": {
        "q0": 5,
        "q1": 4,
        "q2": 2,
        "q3": 1
      }
    },
    "wfq": {
      "totalRequests": 120,
      "completedRequests": 110,
      "failedRequests": 3,
      "pendingRequests": 7,
      "averageWaitTime": 921,
      "averageProcessingTime": 4876,
      "fairnessMetrics": {
        "jainsFairnessIndex": 0.92,
        "fairnessScore": 92,
        "activeTenants": 4
      }
    }
  }
}
```

---

## Common Error Responses

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Resource not found"
}
```

---

## Rate Limiting

현재 버전에서는 속도 제한이 구현되어 있지 않습니다.

---

## CORS

CORS는 모든 Origin에 대해 허용되도록 구현되어 있습니다.

---

## WebSocket Support

현재 버전에서는 WebSocket이 지원되지 않습니다. 대신 실시간 업데이트를 위해서는 폴링(Polling) 방식을 사용해야 합니다.

---

## Examples

### Example 1: Submit a Request

```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing",
    "provider": {
      "name": "ollama",
      "model": "llama2"
    },
    "priority": 1
  }'
```

### Example 2: Check Request Status

```bash
curl http://localhost:3000/api/requests/550e8400-e29b-41d4-a716-446655440000
```

### Example 3: Switch Scheduler

```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -d '{
    "type": "mlfq"
  }'
```

---

## Version History

| 버전 | 날짜 | 변경사항 |
|-----|------|---------|
| 1.0.0 | 2026-01-30 | 초기 릴리스 |

---

## Support

For issues and questions, please visit the project repository.
