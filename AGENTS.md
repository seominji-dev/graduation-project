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
llm-scheduler/
├── src/                      # 소스 코드
│   ├── schedulers/           # 스케줄링 알고리즘
│   ├── managers/             # 관리 컴포넌트
│   ├── services/             # 비즈니스 로직
│   ├── api/                  # REST API
│   ├── middlewares/          # Express 미들웨어
│   ├── infrastructure/       # Redis, MongoDB
│   ├── config/               # 환경 설정
│   ├── domain/               # 도메인 모델
│   ├── metrics/              # Prometheus 메트릭
│   └── utils/                # 유틸리티
├── tests/                    # Jest 테스트
├── shared/                   # 공유 라이브러리
├── docs/                     # 프로젝트 문서
├── archive/                  # 아카이브 (참조용)
│   ├── graduation-docs/      # 졸업 프로젝트 문서
│   ├── candidate-*/          # 다른 후보 프로젝트
│   └── tools/                # 유틸리티 스크립트
├── AGENTS.md                 # AI 에이전트 가이드 (이 파일)
├── CLAUDE.md                 # Claude Code 설정
├── README.md                 # 프로젝트 소개
├── .cursorrules              # Cursor AI 규칙
├── .clinerules               # Cline AI 규칙
└── .windsurfrules            # Windsurf AI 규칙
```

## 주요 명령어

```bash
npm install          # 의존성 설치
npm run dev          # 개발 서버 실행
npm run build        # TypeScript 빌드
npm test             # 테스트 실행 (777개, 100% 통과)
npm run lint         # ESLint 검사
npm run format       # Prettier 포맷팅
```

## 코딩 규칙

### 네이밍 컨벤션
- 함수/변수: `camelCase`
- 클래스: `PascalCase`
- 상수: `UPPER_SNAKE_CASE`
- 파일: `PascalCase.ts`
- 테스트: `*.spec.ts` 또는 `*.test.ts`

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

## AI 에이전트 설정 파일

| 파일 | 대상 AI | 설명 |
|------|---------|------|
| `CLAUDE.md` | Claude Code | MoAI-ADK 기반 상세 설정 |
| `.cursorrules` | Cursor AI | 프로젝트 규칙 및 컨텍스트 |
| `.clinerules` | Cline | VS Code 확장 설정 |
| `.windsurfrules` | Windsurf | Windsurf AI 설정 |
| `.github/copilot-instructions.md` | GitHub Copilot | Copilot 가이드라인 |

## 문서 작성 스타일

### 톤앤매너
- 대학생 3학년 수준으로 작성
- 자연스러운 한국어 사용
- 적당히 학술적이되 읽기 편하게

### 품질 기준
- 테스트 커버리지 97%+ 유지
- 린트 에러 0개
- 코드 변경 시 테스트 업데이트

---

*마지막 업데이트: 2026-01-27*
