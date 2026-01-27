# LLM 스케줄러 데모 가이드

**프로젝트명**: OS 스케줄링 알고리즘을 활용한 LLM API 요청 최적화 스케줄러

**버전**: 1.0.0

**최종 업데이트**: 2025년 1월

---

## 1. 사전 준비 (Prerequisites)

### 1.1 필수 소프트웨어

데모를 실행하기 위해 다음 소프트웨어가 설치되어 있어야 합니다:

| 소프트웨어 | 최소 버전 | 권장 버전 | 확인 명령어 |
|------------|----------|----------|-------------|
| Node.js | 18.x | 20 LTS | `node --version` |
| npm | 9.x | 10.x | `npm --version` |
| Redis | 7.0+ | 7.2+ | `redis-cli ping` |
| MongoDB | 6.0+ | 8.0+ | `mongosh --version` |

### 1.2 선택 소프트웨어 (LLM 통합용)

실제 LLM 통합을 테스트하려면:

| 소프트웨어 | 용도 | 설치 방법 |
|------------|------|----------|
| Ollama | 로컬 LLM 실행 | https://ollama.ai |
| OpenAI API Key | 클라우드 LLM | https://platform.openai.com |

### 1.3 시스템 요구사항

- **운영체제**: macOS, Linux, Windows (WSL2 권장)
- **메모리**: 최소 4GB RAM (Ollama 사용 시 8GB+ 권장)
- **디스크**: 최소 1GB 여유 공간

---

## 2. 환경 설정 (Setup Instructions)

### 2.1 프로젝트 클론 및 의존성 설치

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/졸업프로젝트/02-implementation

# 의존성 설치
npm install
```

### 2.2 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성합니다:

```bash
cp .env.example .env
```

`.env` 파일 설정:

```env
# 서버 설정
PORT=3000
NODE_ENV=development

# Redis 설정
REDIS_HOST=localhost
REDIS_PORT=6379

# MongoDB 설정
MONGODB_URI=mongodb://localhost:27017/llm-scheduler

# LLM 설정 (선택)
OLLAMA_HOST=http://localhost:11434
OPENAI_API_KEY=sk-your-api-key-here
```

### 2.3 Redis 시작

**macOS (Homebrew)**:
```bash
brew services start redis
```

**Linux**:
```bash
sudo systemctl start redis
```

**Docker**:
```bash
docker run -d --name redis -p 6379:6379 redis:7.2
```

### 2.4 MongoDB 시작

**macOS (Homebrew)**:
```bash
brew services start mongodb-community
```

**Linux**:
```bash
sudo systemctl start mongod
```

**Docker**:
```bash
docker run -d --name mongodb -p 27017:27017 mongo:8.0
```

### 2.5 Ollama 설정 (선택)

로컬 LLM 테스트를 위해 Ollama를 설치하고 모델을 다운로드합니다:

```bash
# Ollama 설치 (macOS)
brew install ollama

# Ollama 서비스 시작
ollama serve

# 모델 다운로드 (새 터미널에서)
ollama pull llama2
# 또는 더 가벼운 모델
ollama pull phi
```

---

## 3. 서버 시작 (Server Start)

### 3.1 개발 모드로 시작

```bash
cd /path/to/졸업프로젝트/02-implementation

# 개발 서버 시작 (핫 리로드 지원)
npm run dev
```

### 3.2 프로덕션 모드로 시작

```bash
# 빌드
npm run build

# 프로덕션 서버 시작
npm start
```

### 3.3 시작 확인

서버가 정상적으로 시작되면 다음 메시지가 표시됩니다:

```
[INFO] LLM Scheduler Server started on port 3000
[INFO] Redis connection established
[INFO] MongoDB connection established
[INFO] API endpoints available at http://localhost:3000
```

---

## 4. 데모 시나리오 (Demo Scenarios)

### 4.1 시나리오 1: FCFS 스케줄러

**목적**: 도착 순서대로 요청이 처리되는 것을 확인

**단계**:

1. FCFS 스케줄러 활성화:
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "fcfs"}'
```

2. 여러 요청 순차 제출:
```bash
# 요청 1 (LOW 우선순위)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "첫 번째 요청입니다",
    "priority": "LOW",
    "provider": "ollama"
  }'

# 요청 2 (URGENT 우선순위)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "두 번째 긴급 요청입니다",
    "priority": "URGENT",
    "provider": "ollama"
  }'

# 요청 3 (NORMAL 우선순위)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "세 번째 일반 요청입니다",
    "priority": "NORMAL",
    "provider": "ollama"
  }'
```

3. 처리 순서 확인:
```bash
curl http://localhost:3000/api/scheduler/stats
```

**예상 결과**: 우선순위와 관계없이 요청 1 -> 요청 2 -> 요청 3 순서로 처리

---

### 4.2 시나리오 2: Priority 스케줄러

**목적**: 우선순위에 따라 요청이 처리되는 것을 확인

**단계**:

1. Priority 스케줄러 활성화:
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "priority"}'
```

2. 다양한 우선순위로 요청 제출:
```bash
# LOW 우선순위 요청 (먼저 제출)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "낮은 우선순위 작업입니다",
    "priority": "LOW",
    "provider": "ollama"
  }'

# URGENT 우선순위 요청 (나중에 제출)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "긴급 작업입니다!",
    "priority": "URGENT",
    "provider": "ollama"
  }'

# HIGH 우선순위 요청
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "높은 우선순위 작업입니다",
    "priority": "HIGH",
    "provider": "ollama"
  }'
```

3. 처리 순서 확인:
```bash
curl http://localhost:3000/api/scheduler/stats
```

**예상 결과**: URGENT -> HIGH -> LOW 순서로 처리 (도착 순서와 무관)

---

### 4.3 시나리오 3: MLFQ 스케줄러

**목적**: 다단계 피드백 큐의 동작과 Boost 메커니즘 확인

**단계**:

1. MLFQ 스케줄러 활성화:
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "mlfq"}'
```

2. 짧은 요청 제출 (Q0에서 빠르게 처리 예상):
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "짧은 질문입니다",
    "priority": "NORMAL",
    "provider": "ollama"
  }'
```

3. 긴 요청 제출 (Q0 -> Q1 -> Q2 강등 예상):
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "이것은 매우 긴 프롬프트입니다. 복잡한 분석과 상세한 설명을 요청합니다...",
    "priority": "NORMAL",
    "provider": "ollama",
    "metadata": {
      "expectedDuration": "long"
    }
  }'
```

4. 큐 상태 모니터링:
```bash
# 반복적으로 실행하여 큐 레벨 변화 관찰
watch -n 1 'curl -s http://localhost:3000/api/scheduler/mlfq/queues'
```

5. Boost 발생 확인 (60초 후):
```bash
curl http://localhost:3000/api/scheduler/mlfq/boost-status
```

**예상 결과**:
- 짧은 요청: Q0에서 빠르게 완료
- 긴 요청: 시간이 지남에 따라 Q0 -> Q1 -> Q2로 강등
- 60초 후: 모든 대기 작업이 Q0로 Boost

---

### 4.4 시나리오 4: WFQ 스케줄러

**목적**: 가중치 기반 공정 스케줄링과 Jain's Fairness Index 확인

**단계**:

1. WFQ 스케줄러 활성화:
```bash
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "wfq"}'
```

2. 테넌트 등록:
```bash
# Enterprise 테넌트 (가중치 100)
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "enterprise-corp",
    "tier": "enterprise",
    "weight": 100
  }'

# Free 테넌트 (가중치 1)
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "free-user",
    "tier": "free",
    "weight": 1
  }'
```

3. 각 테넌트에서 요청 제출:
```bash
# Enterprise 테넌트 요청 10개
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/requests \
    -H "Content-Type: application/json" \
    -d "{
      \"prompt\": \"Enterprise 요청 $i\",
      \"priority\": \"NORMAL\",
      \"provider\": \"ollama\",
      \"tenantId\": \"enterprise-corp\"
    }"
done

# Free 테넌트 요청 10개
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/requests \
    -H "Content-Type: application/json" \
    -d "{
      \"prompt\": \"Free 요청 $i\",
      \"priority\": \"NORMAL\",
      \"provider\": \"ollama\",
      \"tenantId\": \"free-user\"
    }"
done
```

4. 공정성 지표 확인:
```bash
curl http://localhost:3000/api/scheduler/wfq/fairness
```

**예상 결과**:
- Enterprise 테넌트: Free 테넌트 대비 100배 더 많은 처리량
- Jain's Fairness Index: 0.95 이상 (가중치 비율에 맞는 공정한 분배)

---

## 5. API 엔드포인트 참조 (API Reference)

### 5.1 요청 관리

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/api/requests` | 새 요청 제출 |
| GET | `/api/requests/:id` | 요청 상태 조회 |
| DELETE | `/api/requests/:id` | 요청 취소 |
| GET | `/api/requests` | 전체 요청 목록 |

### 5.2 스케줄러 관리

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/api/scheduler/switch` | 스케줄러 알고리즘 변경 |
| GET | `/api/scheduler/stats` | 스케줄러 통계 조회 |
| POST | `/api/scheduler/pause` | 스케줄러 일시정지 |
| POST | `/api/scheduler/resume` | 스케줄러 재개 |

### 5.3 MLFQ 전용

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/scheduler/mlfq/queues` | 큐별 상태 조회 |
| GET | `/api/scheduler/mlfq/boost-status` | Boost 상태 조회 |
| POST | `/api/scheduler/mlfq/boost` | 수동 Boost 실행 |

### 5.4 WFQ 전용

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/scheduler/wfq/fairness` | 공정성 지표 조회 |
| GET | `/api/scheduler/wfq/virtual-time` | Virtual Time 조회 |
| POST | `/api/tenants` | 테넌트 등록 |
| PUT | `/api/tenants/:id` | 테넌트 가중치 수정 |

---

## 6. 예상 결과 (Expected Outputs)

### 6.1 스케줄러 통계 응답 예시

```json
{
  "algorithm": "mlfq",
  "stats": {
    "totalRequests": 150,
    "completedRequests": 145,
    "failedRequests": 2,
    "pendingRequests": 3,
    "averageWaitTime": 1250,
    "averageProcessingTime": 3500,
    "throughput": 12.5
  },
  "queueStatus": {
    "q0": { "waiting": 2, "active": 1 },
    "q1": { "waiting": 1, "active": 0 },
    "q2": { "waiting": 0, "active": 0 },
    "q3": { "waiting": 0, "active": 0 }
  }
}
```

### 6.2 WFQ 공정성 리포트 예시

```json
{
  "fairnessIndex": 0.97,
  "tenantStats": [
    {
      "tenantId": "enterprise-corp",
      "weight": 100,
      "processedRequests": 95,
      "expectedShare": 0.99,
      "actualShare": 0.95
    },
    {
      "tenantId": "free-user",
      "weight": 1,
      "processedRequests": 5,
      "expectedShare": 0.01,
      "actualShare": 0.05
    }
  ],
  "assessment": "FAIR"
}
```

---

## 7. 스크린샷 플레이스홀더 (Screenshots)

### 7.1 대시보드 메인 화면

```
[스크린샷: 대시보드 메인 화면]
- 실시간 큐 상태 표시
- 처리량 그래프
- 알고리즘 선택 드롭다운
```

### 7.2 MLFQ 큐 시각화

```
[스크린샷: MLFQ 4단계 큐 시각화]
- Q0 ~ Q3 각 큐의 대기 작업 수
- 작업 이동 애니메이션
- Boost 카운트다운
```

### 7.3 WFQ 공정성 대시보드

```
[스크린샷: WFQ 공정성 대시보드]
- 테넌트별 처리량 파이 차트
- Jain's Fairness Index 게이지
- Virtual Time 그래프
```

---

## 8. 문제 해결 (Troubleshooting)

### 8.1 Redis 연결 실패

**증상**: `Error: Redis connection refused`

**해결**:
```bash
# Redis 실행 상태 확인
redis-cli ping
# PONG이 아닌 경우 Redis 시작
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

### 8.2 MongoDB 연결 실패

**증상**: `Error: MongoNetworkError`

**해결**:
```bash
# MongoDB 실행 상태 확인
mongosh --eval "db.runCommand({ping: 1})"
# 연결 실패 시 MongoDB 시작
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Linux
```

### 8.3 Ollama 연결 실패

**증상**: `Error: Ollama connection failed`

**해결**:
```bash
# Ollama 실행 상태 확인
curl http://localhost:11434/api/version
# 실행 중이 아닌 경우
ollama serve
```

### 8.4 포트 충돌

**증상**: `Error: Port 3000 already in use`

**해결**:
```bash
# 포트 사용 프로세스 확인
lsof -i :3000
# 프로세스 종료 또는 다른 포트 사용
PORT=3001 npm run dev
```

---

## 9. 테스트 실행 (Running Tests)

### 9.1 전체 테스트 실행

```bash
npm test
```

### 9.2 커버리지 리포트 생성

```bash
npm run test:coverage
```

### 9.3 특정 테스트만 실행

```bash
# MLFQ 스케줄러 테스트만
npm test -- --testPathPattern=MLFQ

# WFQ 스케줄러 테스트만
npm test -- --testPathPattern=WFQ
```

---

## 10. 데모 체크리스트

데모 전 확인사항:

- [ ] Redis 서버 실행 중
- [ ] MongoDB 서버 실행 중
- [ ] (선택) Ollama 서버 실행 중
- [ ] 환경 변수 설정 완료 (.env 파일)
- [ ] 의존성 설치 완료 (npm install)
- [ ] 개발 서버 시작 (npm run dev)
- [ ] 브라우저에서 http://localhost:3000 접속 확인
- [ ] 터미널에서 curl 명령어 동작 확인
- [ ] 테스트 스크립트 준비 완료

---

**문서 작성일**: 2025년 1월

**문서 버전**: 1.0.0
