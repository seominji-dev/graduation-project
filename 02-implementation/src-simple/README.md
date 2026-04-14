# LLM 스케줄러

스케줄링 알고리즘을 활용한 다중 사용자 LLM API 요청 관리 시스템

## 프로젝트 개요

본 프로젝트는 운영체제에서 사용되는 네 가지 스케줄링 알고리즘(FCFS, Priority, MLFQ, WFQ)을 LLM API 요청 관리에 적용하여, 다중 사용자 환경에서의 대기시간과 공정성을 개선하는 것을 목표로 한다.

## 기술 스택

- **언어**: JavaScript (ES2024)
- **런타임**: Node.js 20 LTS 이상
- **웹 프레임워크**: Express.js 4.x
- **저장소**: JSON 파일 기반
- **LLM 엔진**: Ollama (로컬)

## 폴더 구조

```
src-simple/
├── index.js                  # 진입점
├── server.js                 # Express 서버 설정
├── api/
│   └── routes.js            # REST API 라우트
├── schedulers/
│   ├── BaseScheduler.js     # 공통 인터페이스 (enqueue/dequeue)
│   ├── FCFSScheduler.js     # 선착순 스케줄링
│   ├── PriorityScheduler.js # 우선순위 스케줄링 (에이징 포함)
│   ├── MLFQScheduler.js     # 다단계 피드백 큐
│   ├── WFQScheduler.js      # 가중치 공정 큐 (VFT 기반)
│   └── index.js             # 팩토리
├── queue/
│   └── MemoryQueue.js       # 메모리 배열 기반 대기열
├── storage/
│   └── JSONStore.js         # JSON 파일 저장소
├── llm/
│   └── OllamaClient.js      # Ollama API 클라이언트
└── utils/
    ├── rateLimiter.js       # 구독 등급별 요청 제한 (토큰 버킷)
    └── validation.js        # 입력 검증
```

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정 (선택)

상위 폴더의 `.env.example`을 참고하여 `.env` 파일을 생성하거나 환경 변수로 전달한다.

```bash
PORT=3000
SCHEDULER_TYPE=FCFS
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### 3. 서버 실행

```bash
# 기본 (FCFS)
npm start

# 특정 스케줄러 선택
npm run start:fcfs
npm run start:priority
npm run start:mlfq
npm run start:wfq
```

서버는 기본적으로 `http://localhost:3000`에서 실행된다.

## 주요 API

### 요청 제출

```bash
POST /api/requests
Content-Type: application/json

{
  "tenantId": "enterprise-user-1",
  "prompt": "안녕하세요",
  "priority": "NORMAL"
}
```

### 요청 상태 조회

```bash
GET /api/requests/:id
```

### 스케줄러 상태

```bash
GET /api/scheduler/status
```

### 헬스 체크

```bash
GET /api/health
```

## 스케줄링 알고리즘 요약

| 알고리즘 | 특징 | 적용 환경 |
|---------|------|----------|
| FCFS | 도착 순서대로 처리 | 기본 비교 기준선 |
| Priority | 요청 우선순위 기반, 에이징으로 기아 방지 | 긴급 요청 우선 처리 |
| MLFQ | 4개 큐(Q0~Q3), 큐별 타임 슬라이스, 주기적 부스팅 | 혼합 워크로드 |
| WFQ | VFT 기반 가중치 처리, 등급별 차등 서비스 | 구독 등급 차등 배분 |

## 실험 재현

실험 스크립트는 상위 폴더 `../experiments-simple/`에 위치한다.

```bash
# 기본 실험
node ../experiments-simple/run-experiments.js

# 통계 검증 (paired t-test, Cohen's d)
node ../experiments-simple/compute-stats.js
```

실험 결과는 JSON 형식으로 같은 폴더에 저장된다.

## 주의 사항

- Ollama가 로컬에서 실행 중이어야 실서버 실험이 가능하다.
- Ollama 미설치 시에도 시뮬레이션 모드로 알고리즘 비교는 가능하다.
- MLFQ의 선점형 모드는 시뮬레이션에서만 작동한다 (실제 LLM 추론은 중단 불가).

## 라이선스

MIT License

## 작성자

서민지 (홍익대학교 컴퓨터공학과)
