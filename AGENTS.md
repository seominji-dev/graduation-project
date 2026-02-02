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
Jest (777 tests, 98.72% coverage)
Ollama (로컬 LLM) 또는 OpenAI API
```

## 프로젝트 구조

```
졸업프로젝트/
├── 01-plan/                  # 1단계: 계획 & 제안서
│   ├── proposal.md           # 연구 계획서
│   ├── requirements.md       # 요구사항 분석
│   └── application-plan.md   # 지원 계획서
│
├── 02-implementation/        # 2단계: 핵심 구현
│   ├── src/                  # TypeScript 소스 코드
│   │   ├── schedulers/       # 스케줄링 알고리즘
│   │   ├── managers/         # 관리 컴포넌트
│   │   ├── services/         # 비즈니스 로직
│   │   ├── api/              # REST API
│   │   ├── middlewares/      # Express 미들웨어
│   │   ├── infrastructure/   # Redis, MongoDB
│   │   ├── domain/           # 도메인 모델
│   │   ├── metrics/          # Prometheus 메트릭
│   │   └── utils/            # 유틸리티
│   ├── tests/                # Jest 테스트 (777개)
│   └── shared/               # 공유 라이브러리
│
├── 03-report/                # 3단계: 최종 보고서
│   ├── paper/                # 최종 논문
│   ├── presentation/         # 발표자료
│   ├── demo/                 # 데모 영상
│   └── learning-materials/   # 학습자료 (7개 챕터)
│
├── archive/                  # 대체 프로젝트 후보 (참조용)
│
└── .ai/                      # AI 통합 컨텍스트
    ├── PROJECT_CONTEXT.md    # 전체 프로젝트 컨텍스트
    └── rules/                # AI별 상세 규칙
```

## 주요 명령어

```bash
cd 02-implementation
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
| `.ai/rules/gemini.md` | Google Gemini | Gemini 프로젝트 컨텍스트 |
| `.ai/rules/opencode.md` | OpenCode | OpenCode 설정 |
| `.ai/PROJECT_CONTEXT.md` | 전체 AI | 통합 프로젝트 컨텍스트 |

## 품질 기준

| 지표 | 목표 | 현재 |
|------|------|------|
| 테스트 수 | 700+ | 777 |
| 코드 커버리지 | 85%+ | 98.72% |
| 린트 에러 | 0 | 0 |
| 타입 에러 | 0 | 0 |

## 문서 작성 스타일

### 톤앤매너
- 대학생 3학년 수준으로 작성
- 자연스러운 한국어 사용
- 적당히 학술적이되 읽기 편하게

### 언어 설정
- 사용자 소통: 한국어
- 코드 주석: 한국어
- 커밋 메시지: 한국어
- 기술 용어: 영어

---

*마지막 업데이트: 2026-02-02*
