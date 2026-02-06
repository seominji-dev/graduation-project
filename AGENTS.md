# LLM Request Scheduler - AI Agent Guide

## CRITICAL: Project Constraints

**이 프로젝트는 학부생 졸업프로젝트입니다. 다음 기술은 절대 사용하지 마세요:**

| 금지 기술 | 대신 사용할 기술 |
|-----------|-----------------|
| TypeScript | JavaScript (ES2024) |
| Redis, BullMQ | 메모리 배열 기반 큐 |
| MongoDB | JSON 파일 |
| Socket.IO | HTTP 폴링 |
| Docker, GraphQL | 단순 REST API |
| 복잡한 디자인 패턴 | 단순한 MVC 구조 |

**코드 복잡도를 학부생 수준으로 유지하세요.**

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
2. **Priority Queue**: 우선순위 기반 + Aging (기아 방지)
3. **MLFQ (Multi-Level Feedback Queue)**: 4단계 큐 + Boost
4. **WFQ (Weighted Fair Queuing)**: 가중치 기반 공정 스케줄링

## 기술 스택

```
JavaScript (ES2024), Node.js 20+, Express.js
JSON 파일 (저장소), 메모리 배열 (큐)
Jest (69개 테스트, 98.65% 커버리지)
Ollama (로컬 LLM)
의존성: 최대 4개 패키지
```

## 프로젝트 구조

```
졸업프로젝트/
├── 01-plan/                  # 1단계: 계획 & 제안서
│   ├── proposal.md           # 연구 계획서 (연구 질문 기반)
│   ├── requirements.md       # 요구사항 분석
│   └── phase3-feedback.md    # 실험 결과 피드백
│
├── 02-implementation/        # 2단계: 핵심 구현
│   ├── prototype/            # 사전 타당성 검증 프로토타입 (FCFS, Priority)
│   ├── src/                  # JavaScript 소스 코드
│   │   ├── schedulers/       # 스케줄링 알고리즘 (4개)
│   │   ├── managers/         # 관리 컴포넌트
│   │   └── api/              # REST API
│   └── tests/                # Jest 테스트 (69개)
│
├── 03-report/                # 3단계: 최종 보고서
│   ├── paper/                # 최종 논문
│   └── learning-materials/   # 학습자료 (7개 챕터)
│
└── archive/                  # 대체 프로젝트 후보 (참조용)
```

## 주요 명령어

```bash
cd 02-implementation
npm install          # 의존성 설치
npm start            # 서버 실행
npm test             # 테스트 실행 (69개, 100% 통과)
npm run prototype    # 사전 프로토타입 실행 (FCFS vs Priority)
```

## 연구 질문 (정량적 목표가 아님!)

### RQ1: Priority Scheduling의 효과
- 긴급(URGENT) 요청은 낮은 우선순위 요청보다 얼마나 빠르게 처리되는가?
- **결과**: URGENT 요청이 FCFS 대비 62% 빠르게 처리됨

### RQ2: MLFQ의 적응성
- MLFQ는 다양한 길이의 작업이 혼재된 환경에서 어떤 성능을 보이는가?
- **결과**: 단기 작업만 있는 환경에서는 FCFS와 동일한 성능

### RQ3: WFQ의 차등 서비스
- WFQ는 가중치에 비례하는 서비스 차등화를 달성하는가?
- **결과**: Enterprise(849ms)가 Free(4,894ms)보다 5.8배 빠른 응답

## 실험 결과 (2026-02-04)

| 스케줄러 | 평균 대기시간 | 핵심 발견 |
|----------|---------------|-----------|
| FCFS | 2,572ms | 베이스라인 |
| Priority | 2,826ms | URGENT: 1,122ms (-62%) |
| MLFQ | 2,572ms | FCFS와 동일 (단기 작업) |
| WFQ | 2,819ms | Enterprise 5.8배 빠름 |

## 코딩 규칙

### 네이밍 컨벤션
- 함수/변수: `camelCase`
- 클래스: `PascalCase`
- 상수: `UPPER_SNAKE_CASE`
- 파일: `camelCase.js`
- 테스트: `*.test.js`

### JavaScript (TypeScript 아님!)
- ES2024 기능 사용
- JSDoc으로 타입 힌트
- async/await 일관성
- 함수 30줄 이하 유지

## 품질 기준

| 지표 | 목표 | 현재 |
|------|------|------|
| 테스트 수 | 50+ | 69 |
| 코드 커버리지 (Statements) | 85%+ | 98.65% |
| 의존성 수 | 4개 이하 | 3개 |

## AI 에이전트 설정 파일

| 파일 | 대상 AI | 설명 |
|------|---------|------|
| `CLAUDE.md` | Claude Code | MoAI-ADK 기반 상세 설정 |
| `.cursorrules` | Cursor AI | 프로젝트 규칙 및 컨텍스트 |
| `.clinerules` | Cline | VS Code 확장 설정 |
| `.windsurfrules` | Windsurf | Windsurf AI 설정 |
| `.github/copilot-instructions.md` | GitHub Copilot | Copilot 가이드라인 |
| `.claude/rules/project-constraints.md` | Claude Code | 기술 스택 제약 조건 |
| `.moai/config/sections/project.yaml` | MoAI | 프로젝트 설정 |

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

*마지막 업데이트: 2026-02-04*
