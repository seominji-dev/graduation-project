# Checkpointing System 사용자 가이드

## 시작하기

이 가이드는 Checkpointing System을 설치, 구성, 사용하는 방법을 안내합니다. Checkpointing System은 운영체제의 프로세스 체크포인팅 기법을 AI 에이전트의 장애 복구에 적용한 시스템입니다.

---

## 1. 설치 (Installation)

### 1.1 사전 요구사항

| 소프트웨어 | 최소 버전 | 권장 버전 |
|-----------|----------|----------|
| Node.js | 20.0.0 | 20 LTS |
| npm | 9.0.0 | 최신 LTS |
| MongoDB | 7.0+ | 최신 |

### 1.2 MongoDB 설치

```bash
# Docker 사용 (권장)
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# 또는 로컬 설치
# macOS
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### 1.3 애플리케이션 설치

```bash
# 프로젝트 디렉토리로 이동
cd candidates/candidate-4-checkpointing

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# .env 파일 편집
nano .env
```

### 1.4 환경 변수 설정

```bash
# .env 파일
MONGODB_URI=mongodb://localhost:27017/checkpointing
PORT=3002
NODE_ENV=development

# 체크포인팅 설정
MAX_CHECKPOINTS_PER_AGENT=10
CHECKPOINT_INTERVAL_MS=30000
MAX_STATE_SIZE_BYTES=52428800
```

---

## 2. 실행 (Running)

### 2.1 개발 모드

```bash
npm run dev
```

서버가 `http://localhost:3002`에서 시작됩니다.

### 2.2 프로덕션 모드

```bash
npm run build
npm start

# 또는 PM2 사용
npm install -g pm2
pm2 start dist/index.js --name checkpointing
pm2 save
```

---

## 3. 기본 사용법 (Basic Usage)

### 3.1 체크포인트 생성

```bash
curl -X POST http://localhost:3002/api/checkpoints \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "123e4567-e89b-12d3-a456-426614174000",
    "state": {
      "messages": [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"}
      ],
      "variables": {
        "counter": 5,
        "userName": "Alice"
      },
      "status": "running"
    },
    "options": {
      "type": "full",
      "description": "Initial checkpoint"
    }
  }'
```

### 3.2 복구 실행

```bash
curl -X POST http://localhost:3002/api/checkpoints/recover \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "123e4567-e89b-12d3-a456-426614174000",
    "verifyIntegrity": true
  }'
```

### 3.3 체크포인트 목록 조회

```bash
curl http://localhost:3002/api/checkpoints/123e4567-e89b-12d3-a456-426614174000
```

---

## 4. 주기적 체크포인트 (Periodic Checkpointing)

### 4.1 자동 저장 시작

```bash
curl -X POST http://localhost:3002/api/checkpoints/periodic/start \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "123e4567-e89b-12d3-a456-426614174000",
    "intervalMs": 30000,
    "idleCheckpointsEnabled": true,
    "adaptiveInterval": true
  }'
```

### 4.2 상태 조회

```bash
curl http://localhost:3002/api/checkpoints/periodic/status/123e4567-e89b-12d3-a456-426614174000
```

### 4.3 자동 저장 중지

```bash
curl -X POST http://localhost:3002/api/checkpoints/periodic/stop \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

---

## 5. 증분 체크포인트 (Incremental Checkpointing)

### 5.1 증분 저장

이전 체크포인트와의 차이만 저장하여 공간 절약:

```bash
curl -X POST http://localhost:3002/api/checkpoints/incremental \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "123e4567-e89b-12d3-a456-426614174000",
    "state": {
      "messages": [
        {"role": "user", "content": "New message"}
      ],
      "variables": {
        "counter": 6
      }
    },
    "baseCheckpointId": "ckpt-abc123"
  }'
```

---

## 6. 사용 시나리오 (Use Cases)

### 6.1 장기 실행 작업

```javascript
// 장기 실행 작업 중 주기적 체크포인트
async function longRunningTask(agentId) {
  // 시작 체크포인트
  await createCheckpoint(agentId, getState(), { description: 'Task started' });

  // 주기적 체크포인트 시작
  await startPeriodic(agentId, 60000); // 1분마다

  try {
    // 작업 실행
    for (const step of steps) {
      await executeStep(step);

      // 중요 단계 후 체크포인트
      await createCheckpoint(agentId, getState(), {
        description: `Completed ${step.name}`
      });
    }
  } catch (error) {
    // 오류 발생 시 복구
    const restored = await recover(agentId);
    console.log('Recovered from:', restored);
  } finally {
    await stopPeriodic(agentId);
  }
}
```

### 6.2 상태 최적화

```javascript
// 큰 상태는 참조로 저장
const badState = {
  entireConversation: [...], // 수천 개의 메시지
  largeBinaryData: buffer     // 큰 바이너리
};

// 좋은 상태는 최적화하여 저장
const goodState = {
  recentMessages: messages.slice(-10),  // 최근 10개만
  dataReference: s3Url,                  // 큰 데이터는 참조
  checkpointDate: new Date()
};
```

---

## 7. 모범 사례 (Best Practices)

### 7.1 체크포인트 타이밍

- **좋은 타이밍**:
  - 중요한 작업 완료 후
  - 사용자 입력 처리 후
  - 장기 계산 시작 전

- **나쁜 타이밍**:
  - 너무 잦은 체크포인트 (성능 저하)
  - 너무 드문 체크포인트 (데이터 손실 위험)

### 7.2 상태 크기 관리

```javascript
// 상태 크기 확인
const stateSize = JSON.stringify(state).length;
if (stateSize > 5 * 1024 * 1024) { // 5MB 초과
  console.warn('State size too large, consider optimization');
}

// 최적화 방법:
// 1. 배열 슬라이싱
// 2. 불필요한 필드 제거
// 3. 큰 데이터는 외부 저장소 참조
```

### 7.3 에러 처리

```javascript
try {
  const restored = await recover(agentId);
} catch (error) {
  if (error.code === 'CHECKPOINT_CORRUPTED') {
    // 백업 체크포인트 시도
    const backup = await recover(agentId, null);
  } else if (error.code === 'CHECKPOINT_NOT_FOUND') {
    // 초기 상태 사용
    console.log('No checkpoint, using initial state');
  } else {
    throw error;
  }
}
```

---

## 8. 문제 해결 (Troubleshooting)

### 8.1 복구 실패

**문제**: 체크포인트가 손상됨

**해결**:
```bash
# 최신 체크포인트로 복구
curl -X POST http://localhost:3002/api/checkpoints/recover \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "...",
    "checkpointId": null,
    "fallbackToLatest": true
  }'
```

### 8.2 상태 크기 초과

**문제**: 상태가 너무 커서 저장 안 됨

**해결**:
```javascript
// 상태 최적화
const optimizedState = {
  messages: state.messages.slice(-20),  // 최근 20개만
  variables: pick(state.variables, ['counter', 'userId']) // 필요한 변수만
};

await createCheckpoint(agentId, optimizedState);
```

---

**문서 버전**: 1.0.0
**최종 업데이트**: 2025-01-25
