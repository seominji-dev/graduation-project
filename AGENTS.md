# LLM Request Scheduler - AI Agent Guide

## 프로젝트 개요

OS 스케줄링 알고리즘을 LLM API 요청 관리에 적용한 홍익대학교 컴퓨터공학과 졸업 프로젝트입니다.

### 핵심 아이디어

| OS 개념 | LLM에 적용 |
|---------|-----------|
| 프로세스 | LLM API 요청 |
| CPU 시간 | API 호출 권한 |
| 우선순위 | 테넌트 등급, 요청 긴급도 |
| 스케줄링 알고리즘 | 요청 처리 순서 결정 |

### 구현된 알고리즘

1. **FCFS (First-Come-First-Served)**: 기본 베이스라인
2. **Priority Queue**: 우선순위 기반 + Aging
3. **MLFQ (Multi-Level Feedback Queue)**: 공정성 + 응답성 균형
4. **WFQ (Weighted Fair Queuing)**: 멀티테넌트 공정성

## 기술 스택

```
TypeScript, Node.js 20+, Express.js
BullMQ (Redis), MongoDB, Socket.io
Jest (97%+ coverage)
Ollama (로컬 LLM) 또는 OpenAI API
```

## 프로젝트 구조

```
src/
├── schedulers/           # 스케줄링 알고리즘
│   ├── types.ts          # 인터페이스 정의
│   ├── FCFSScheduler.ts  # FCFS 구현
│   ├── PriorityScheduler.ts # 우선순위 스케줄러
│   ├── MLFQScheduler.ts  # MLFQ 구현
│   └── WFQScheduler.ts   # WFQ 구현
├── managers/             # 관리 컴포넌트
│   ├── TenantRegistry.ts # 테넌트 관리
│   ├── FairnessCalculator.ts # 공정성 계산
│   ├── BoostManager.ts   # 동적 우선순위 조정
│   ├── AgingManager.ts   # 기아 방지
│   └── VirtualTimeTracker.ts # WFQ 가상 시간
├── services/             # 비즈니스 로직
│   ├── schedulerFactory.ts # 스케줄러 팩토리
│   └── llmService.ts     # LLM 연동
├── api/                  # REST API
│   ├── routes/           # 라우트 정의
│   └── controllers/      # 컨트롤러
├── middlewares/          # Express 미들웨어
├── infrastructure/       # Redis, MongoDB
├── config/               # 환경 설정
├── domain/               # 도메인 모델
├── metrics/              # Prometheus 메트릭
└── utils/                # 유틸리티

tests/                    # Jest 테스트
```

## 주요 명령어

```bash
npm install          # 의존성 설치
npm run dev          # 개발 서버 실행
npm run build        # TypeScript 빌드
npm test             # 테스트 실행
npm run lint         # ESLint 검사
npm run format       # Prettier 포맷팅
```

## 코딩 규칙

### 네이밍 컨벤션
- 함수/변수: `camelCase`
- 클래스: `PascalCase`
- 상수: `UPPER_SNAKE_CASE`
- 파일: `PascalCase.ts`
- 테스트: `*.spec.ts`

### TypeScript
- strict mode 필수
- async/await 일관성
- JSDoc 주석 (공개 API)
- 커스텀 에러 클래스 사용

## API 엔드포인트

```
POST   /api/requests          # LLM 요청 제출
GET    /api/queue/status      # 큐 상태 조회
GET    /api/metrics           # 성능 메트릭스
POST   /api/scheduler/algorithm # 스케줄러 변경
GET    /api/tenants/:id       # 테넌트 정보
```

## 문서 작성 스타일

### 톤앤매너

- 대학생 3학년 수준으로 작성
- 자연스러운 한국어 사용
- 적당히 학술적이되 읽기 편하게
- 과도한 수식어 남발 금지

### 체크리스트

- [ ] 대학생이 쓴 것처럼 자연스러운가?
- [ ] 기술 용어를 적절히 설명했는가?
- [ ] 코드 변경 시 테스트를 업데이트했는가?
- [ ] 97%+ 커버리지를 유지하는가?

## 참고 자료

| 문서 | 설명 |
|------|------|
| `README.md` | 프로젝트 소개 및 시작 가이드 |
| `TODO.md` | 다음 단계 액션 아이템 |
| `CHANGELOG.md` | 변경 내역 |
| `docs/` | 양식, 이미지 등 |

## 대상 독자

- 졸업 프로젝트 준비하는 학생들
- 지도교수님 (운영체제 전공)
- 취업 준비용 포트폴리오

---

*마지막 업데이트: 2026-01-27*
