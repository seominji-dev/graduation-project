# LLM Scheduler API Documentation

**Version**: 1.0.0
**Base URL**: `http://localhost:3000`
**Content Type**: `application/json`

---

## Table of Contents

1. [Health Check](#1-health-check)
2. [Request Management](#2-request-management)
3. [Scheduler Management](#3-scheduler-management)
4. [Error Responses](#4-error-responses)
5. [Data Models](#5-data-models)

---

## 1. Health Check

### GET /health

Check if the API server is running.

**Response**: `200 OK`

```json
{
  "success": true,
  "message": "LLM Scheduler API is running",
  "timestamp": "2026-01-29T12:00:00.000Z"
}
```

---

## 2. Request Management

### 2.1 Create Request

Submit a new LLM request to the scheduler queue.

**Endpoint**: `POST /api/requests`

**Request Body**:

```json
{
  "prompt": "What is machine learning?",
  "provider": {
    "name": "ollama",
    "model": "llama2",
    "baseUrl": "http://localhost:11434",
    "apiKey": "optional-api-key"
  },
  "priority": 1,
  "metadata": {
    "userId": "user-123",
    "sessionId": "session-456"
  }
}
```

**Request Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| prompt | string | Yes | The prompt/question to send to the LLM |
| provider.name | string | Yes | Provider name: "ollama" or "openai" |
| provider.model | string | No | Model name (e.g., "llama2", "gpt-4") |
| provider.baseUrl | string | No | Custom base URL for the LLM API |
| provider.apiKey | string | No | API key for authentication |
| priority | integer | No | Request priority: 0 (LOW) to 3 (URGENT). Default: 1 (NORMAL) |
| metadata | object | No | Additional metadata (key-value pairs) |

**Priority Levels**:

| Value | Name | Description |
|-------|------|-------------|
| 0 | LOW | Non-urgent background tasks |
| 1 | NORMAL | Default priority for regular requests |
| 2 | HIGH | Important requests that should be processed soon |
| 3 | URGENT | Critical requests requiring immediate processing |

**Response**: `202 Accepted`

```json
{
  "success": true,
  "data": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "jobId": "bull:job:123456789",
    "status": "queued",
    "priority": 1,
    "createdAt": "2026-01-29T12:00:00.000Z"
  },
  "message": "Request queued successfully"
}
```

**Error Response**: `400 Bad Request`

```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["prompt"],
      "message": "Expected string, received number"
    }
  ]
}
```

**cURL Example**:

```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is machine learning?",
    "provider": {
      "name": "ollama",
      "model": "llama2"
    },
    "priority": 2
  }'
```

---

### 2.2 Get Request Status

Retrieve the current status of a request.

**Endpoint**: `GET /api/requests/:id`

**URL Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The UUID of the request |

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "status": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "prompt": "What is machine learning?",
      "priority": 2,
      "status": "completed",
      "response": "Machine learning is a subset of artificial intelligence...",
      "tokensUsed": 150,
      "processingTime": 2500,
      "waitTime": 1200,
      "completedAt": "2026-01-29T12:00:05.000Z",
      "queueLevel": 0,
      "tenantId": "default",
      "weight": 10
    }
  }
}
```

**Status Values**:

| Value | Description |
|-------|-------------|
| pending | Request is being prepared |
| queued | Request is in the queue waiting to be processed |
| processing | Request is currently being processed |
| completed | Request completed successfully |
| failed | Request failed with an error |
| cancelled | Request was cancelled |

**cURL Example**:

```bash
curl -X GET http://localhost:3000/api/requests/550e8400-e29b-41d4-a716-446655440000
```

---

### 2.3 Cancel Request

Cancel a pending or queued request.

**Endpoint**: `DELETE /api/requests/:id`

**URL Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The UUID of the request to cancel |

**Response**: `200 OK`

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

**Error Response**: `404 Not Found`

```json
{
  "success": false,
  "error": "Request not found or cannot be cancelled"
}
```

**cURL Example**:

```bash
curl -X DELETE http://localhost:3000/api/requests/550e8400-e29b-41d4-a716-446655440000
```

---

## 3. Scheduler Management

### 3.1 Get Current Scheduler

Get information about the currently active scheduler.

**Endpoint**: `GET /api/scheduler/current`

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "type": "MLFQ",
    "stats": {
      "totalRequests": 150,
      "completedRequests": 120,
      "failedRequests": 5,
      "averageProcessingTime": 2340,
      "averageWaitTime": 1150,
      "queueLength": 25
    }
  }
}
```

**Scheduler Types**:

| Type | Name | Description |
|------|------|-------------|
| FCFS | First-Come-First-Served | Processes requests in arrival order |
| PRIORITY | Priority | Priority-based scheduling with aging |
| MLFQ | Multi-Level Feedback Queue | Dynamic priority adjustment with 4 queues |
| WFQ | Weighted Fair Queuing | Fair scheduling for multi-tenant environments |

**cURL Example**:

```bash
curl -X GET http://localhost:3000/api/scheduler/current
```

---

### 3.2 Get Available Schedulers

Get a list of all available schedulers and their descriptions.

**Endpoint**: `GET /api/scheduler/available`

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "available": ["FCFS", "PRIORITY", "MLFQ", "WFQ"],
    "current": "MLFQ",
    "descriptions": {
      "FCFS": "First-Come-First-Served: Process requests in arrival order",
      "PRIORITY": "Priority-based scheduling with aging mechanism",
      "MLFQ": "Multi-Level Feedback Queue with dynamic priority adjustment",
      "WFQ": "Weighted Fair Queuing for multi-tenant environments"
    }
  }
}
```

**cURL Example**:

```bash
curl -X GET http://localhost:3000/api/scheduler/available
```

---

### 3.3 Switch Scheduler

Switch to a different scheduling algorithm.

**Endpoint**: `POST /api/scheduler/switch`

**Request Body**:

```json
{
  "type": "WFQ"
}
```

**Request Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Scheduler type: "FCFS", "PRIORITY", "MLFQ", or "WFQ" |

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "previousType": "MLFQ",
    "currentType": "WFQ",
    "stats": {
      "totalRequests": 150,
      "completedRequests": 120,
      "failedRequests": 5,
      "averageProcessingTime": 2340,
      "averageWaitTime": 1150,
      "queueLength": 25
    }
  },
  "message": "Successfully switched to WFQ scheduler"
}
```

**Error Response**: `400 Bad Request`

```json
{
  "success": false,
  "error": "Failed to switch scheduler",
  "message": "Could not switch to WFQ scheduler"
}
```

**cURL Example**:

```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -d '{"type": "WFQ"}'
```

---

### 3.4 Get Scheduler Statistics

Get statistics for the current scheduler.

**Endpoint**: `GET /api/scheduler/stats`

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "type": "MLFQ",
    "stats": {
      "totalRequests": 150,
      "completedRequests": 120,
      "failedRequests": 5,
      "averageProcessingTime": 2340,
      "averageWaitTime": 1150,
      "queueLength": 25
    }
  }
}
```

**Statistics Fields**:

| Field | Type | Description |
|-------|------|-------------|
| totalRequests | integer | Total number of requests submitted |
| completedRequests | integer | Number of successfully completed requests |
| failedRequests | integer | Number of failed requests |
| averageProcessingTime | integer | Average processing time in milliseconds |
| averageWaitTime | integer | Average wait time in milliseconds |
| queueLength | integer | Current number of requests in the queue |

**cURL Example**:

```bash
curl -X GET http://localhost:3000/api/scheduler/stats
```

---

### 3.5 Get All Schedulers Statistics

Get statistics for all available schedulers.

**Endpoint**: `GET /api/scheduler/stats/all`

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "FCFS": {
      "totalRequests": 50,
      "completedRequests": 45,
      "failedRequests": 2,
      "averageProcessingTime": 2800,
      "averageWaitTime": 1500,
      "queueLength": 5
    },
    "PRIORITY": {
      "totalRequests": 40,
      "completedRequests": 38,
      "failedRequests": 1,
      "averageProcessingTime": 2400,
      "averageWaitTime": 900,
      "queueLength": 3
    },
    "MLFQ": {
      "totalRequests": 150,
      "completedRequests": 120,
      "failedRequests": 5,
      "averageProcessingTime": 2340,
      "averageWaitTime": 1150,
      "queueLength": 25
    },
    "WFQ": {
      "totalRequests": 100,
      "completedRequests": 95,
      "failedRequests": 3,
      "averageProcessingTime": 2600,
      "averageWaitTime": 1300,
      "queueLength": 10
    }
  }
}
```

**cURL Example**:

```bash
curl -X GET http://localhost:3000/api/scheduler/stats/all
```

---

## 4. Error Responses

### 4.1 Validation Error (400)

Invalid request data.

```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["prompt"],
      "message": "Expected string, received number"
    }
  ]
}
```

### 4.2 Not Found (404)

Resource not found.

```json
{
  "success": false,
  "error": "Request not found or cannot be cancelled"
}
```

### 4.3 Server Error (500)

Internal server error.

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 5. Data Models

### 5.1 LLMRequest

```typescript
interface LLMRequest {
  id: string;                    // UUID
  prompt: string;                // User's prompt/question
  provider: LLMProvider;         // LLM provider configuration
  priority: RequestPriority;     // 0 (LOW) to 3 (URGENT)
  status: RequestStatus;         // Current status
  metadata?: Record<string, unknown>;  // Additional metadata
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

### 5.2 LLMProvider

```typescript
interface LLMProvider {
  name: "ollama" | "openai";     // Provider name
  model?: string;                // Model name
  baseUrl?: string;              // Custom base URL
  apiKey?: string;               // API key
}
```

### 5.3 RequestStatus

```typescript
type RequestStatus =
  | "pending"     // Initial state
  | "queued"      // Added to queue
  | "processing"  // Being processed
  | "completed"   // Completed successfully
  | "failed"      // Failed with error
  | "cancelled";  // Cancelled by user
```

### 5.4 RequestPriority

```typescript
enum RequestPriority {
  LOW = 0,        // Non-urgent background tasks
  NORMAL = 1,     // Default priority
  HIGH = 2,       // Important requests
  URGENT = 3      // Critical requests
}
```

### 5.5 SchedulerStats

```typescript
interface SchedulerStats {
  totalRequests: number;         // Total requests submitted
  completedRequests: number;     // Successfully completed
  failedRequests: number;        // Failed requests
  averageProcessingTime: number; // Avg processing time (ms)
  averageWaitTime: number;       // Avg wait time (ms)
  queueLength: number;           // Current queue size
}
```

### 5.6 MLFQ-Specific Fields

```typescript
interface MLFQRequestData {
  queueLevel: number;            // Current queue level (0-3)
  queueHistory: number[];        // History of queue levels
  timeSliceUsed: number;         // Time slice used (ms)
  totalCPUTime: number;          // Total processing time (ms)
}
```

### 5.7 WFQ-Specific Fields

```typescript
interface WFQRequestData {
  tenantId: string;              // Tenant identifier
  weight: number;                // Tenant weight
  virtualStartTime: number;      // Virtual start time
  virtualFinishTime: number;     // Virtual finish time
}
```

---

## 6. Usage Examples

### 6.1 Complete Workflow

```javascript
// 1. Submit a request
const response = await fetch('http://localhost:3000/api/requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Explain machine learning',
    provider: { name: 'ollama', model: 'llama2' },
    priority: 2
  })
});

const { data } = await response.json();
const requestId = data.requestId;

// 2. Poll for status
while (true) {
  const statusResponse = await fetch(`http://localhost:3000/api/requests/${requestId}`);
  const { data: statusData } = await statusResponse.json();

  if (statusData.status.status === 'completed') {
    console.log('Response:', statusData.status.response);
    break;
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
}

// 3. Get statistics
const statsResponse = await fetch('http://localhost:3000/api/scheduler/stats');
const { data: stats } = await statsResponse.json();
console.log('Statistics:', stats);
```

### 6.2 Python Example

```python
import requests
import time

BASE_URL = "http://localhost:3000"

# Submit a request
response = requests.post(f"{BASE_URL}/api/requests", json={
    "prompt": "What is machine learning?",
    "provider": {
        "name": "ollama",
        "model": "llama2"
    },
    "priority": 2
})

request_id = response.json()["data"]["requestId"]

# Poll for completion
while True:
    status_response = requests.get(f"{BASE_URL}/api/requests/{request_id}")
    status_data = status_response.json()["data"]["status"]

    if status_data["status"] == "completed":
        print("Response:", status_data["response"])
        break

    time.sleep(1)
```

### 6.3 Switching Schedulers

```bash
# Switch to MLFQ scheduler
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -d '{"type": "MLFQ"}'

# Verify the switch
curl http://localhost:3000/api/scheduler/current

# Get MLFQ-specific statistics
curl http://localhost:3000/api/scheduler/stats
```

---

## 7. Rate Limiting

The API implements rate limiting to prevent abuse.

**Default Limits**:
- Window: 15 minutes (900 seconds)
- Max Requests: 100 per window per IP

**Rate Limit Headers**:

```http
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1706534400
```

**Rate Limit Exceeded Response**: `429 Too Many Requests`

```json
{
  "error": "TooManyRequests",
  "message": "Too many requests from this IP, please try again after 15 minutes",
  "retryAfter": 900
}
```

---

## 8. Authentication

Currently, the API does not require authentication. This is suitable for development and testing.

For production use, implement authentication middleware with:

- API Key authentication
- OAuth 2.0 / JWT tokens
- Rate limiting per user/tenant

---

## 9. WebSockets (Optional)

For real-time updates, the API supports WebSocket connections.

**WebSocket Endpoint**: `ws://localhost:3000`

**Events**:

| Event | Description |
|-------|-------------|
| request.queued | New request added to queue |
| request.processing | Request started processing |
| request.completed | Request completed successfully |
| request.failed | Request failed |
| request.cancelled | Request was cancelled |
| scheduler.switched | Scheduler algorithm changed |

**WebSocket Example**:

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'request.completed':
      console.log('Request completed:', data.requestId);
      break;
    case 'scheduler.switched':
      console.log('Scheduler switched to:', data.newType);
      break;
  }
};
```

---

## 10. Support

For issues, questions, or contributions:

- **GitHub**: [Repository URL]
- **Documentation**: [Docs URL]
- **Email**: [Support Email]

---

**Last Updated**: 2026-01-29
**API Version**: 1.0.0
**Maintainer**: 서민지 (C235180)
