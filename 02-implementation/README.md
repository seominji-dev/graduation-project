# Phase 2: 구현 (Implementation)

## 프로젝트명
**LLM 스케줄러: OS 스케줄링 기법을 활용한 LLM API 요청 최적화**

## 이 폴더의 목적
LLM 스케줄러 소스코드, 테스트, 실험 데이터를 관리합니다.

## 요구사항 연결 (Requirements Traceability)

| 요구사항 ID | 설명 | 구현 파일 | 테스트 파일 |
|-------------|------|-----------|-------------|
| FR-1.1 | FCFS 스케줄러 | src/schedulers/FCFSScheduler.ts | tests/schedulers/fcfs.test.ts |
| FR-1.2 | Priority 스케줄러 | src/schedulers/PriorityScheduler.ts | tests/schedulers/priority.test.ts |
| FR-1.3 | MLFQ 스케줄러 | src/schedulers/MLFQScheduler.ts | tests/schedulers/mlfq.test.ts |
| FR-1.4 | WFQ 스케줄러 | src/schedulers/WFQScheduler.ts | tests/schedulers/wfq.test.ts |
| FR-2 | REST API | src/api/ | tests/api/ |
| FR-3 | LLM 통합 | src/services/llmService.ts | tests/services/ |
| FR-4 | 데이터 저장 | src/infrastructure/ | tests/infrastructure/ |
| NFR-6.2 | 85%+ 커버리지 | 전체 | tests/ (777개) |

## 폴더 구조

```
02-implementation/
├── src/                    # 소스코드
│   ├── schedulers/        # 4개 스케줄링 알고리즘
│   │   ├── FCFSScheduler.ts
│   │   ├── PriorityScheduler.ts
│   │   ├── MLFQScheduler.ts
│   │   ├── WFQScheduler.ts
│   │   └── types.ts       # 공통 타입 정의
│   ├── api/               # REST API
│   │   ├── controllers/   # 요청 컨트롤러
│   │   └── routes/        # API 라우트
│   ├── services/          # 비즈니스 로직
│   │   ├── llmService.ts  # LLM 통합
│   │   ├── schedulerFactory.ts
│   │   └── schedulerManager.ts
│   ├── managers/          # 관리자 클래스
│   │   ├── AgingManager.ts        # 기아 방지
│   │   ├── BoostManager.ts        # MLFQ Boost
│   │   ├── TenantRegistry.ts      # WFQ 테넌트
│   │   ├── VirtualTimeTracker.ts  # WFQ 가상 시간
│   │   └── FairnessCalculator.ts  # 공정성 계산
│   ├── infrastructure/    # DB 클라이언트
│   │   ├── redis.ts       # Redis 연결
│   │   ├── mongodb.ts     # MongoDB 연결
│   │   └── models/        # 데이터 모델
│   ├── domain/            # 도메인 모델
│   │   └── models.ts      # LLMRequest, Priority, Status
│   ├── middlewares/       # Express 미들웨어
│   ├── config/            # 설정 파일
│   ├── utils/             # 유틸리티
│   └── index.ts           # 진입점
├── tests/                  # 테스트 코드 (777개, 100% 통과)
├── coverage/               # 테스트 커버리지 리포트
├── experiments/            # 실험 데이터 및 결과
├── docs/                   # API 문서
└── shared/                 # 공유 유틸리티
```

## 빠른 시작

```bash
cd 02-implementation

# 의존성 설치
npm install

# 개발 서버 실행 (포트 3000)
npm run dev

# 테스트 실행
npm test

# 커버리지 리포트
npm run test:coverage

# Lint 검사
npm run lint
```

## 핵심 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| TypeScript | 5.9 | 정적 타이핑 |
| Node.js | 20 LTS | 런타임 |
| Express.js | 4.18 | 웹 프레임워크 |
| BullMQ | 5.1.8 | 작업 큐 |
| Redis | 7.2+ | 큐 상태 저장 |
| MongoDB | 8.0+ | 로그 저장 |
| Jest | 29.7 | 테스트 프레임워크 |
| Zod | - | 런타임 검증 |

## 테스트 결과

| 항목 | 결과 | 목표 |
|------|------|------|
| 테스트 수 | 777개 | 700+ |
| 통과율 | 100% | 100% |
| 코드 커버리지 | 98.72% | 85%+ |
| Branch 커버리지 | 85.77% | 80%+ |

테스트는 Jest 프레임워크를 사용하여 작성했습니다.

## API 문서

- [API 문서 보기](./docs/api-documentation.md)

## 실험 결과

- [성능 분석 보고서](./experiments/performance-analysis.md)

## 알고리즘별 성능 요약

| 알고리즘 | 평균 대기시간 | FCFS 대비 개선 | 공정성 (JFI) |
|----------|-------------|---------------|-------------|
| FCFS | 48.25ms | 기준 | - |
| Priority | 32.18ms | 33% 개선 | - |
| MLFQ | 28.45ms | 40% 개선 | - |
| WFQ | 52.30ms | - | 0.92-0.98 |

**참고**: WFQ는 공정성을 위해 대기시간을 희생하며, 개별 테넌트 수준에서 매우 높은 공정성(0.92-0.98)을 달성합니다.

## 관련 문서
- 계획 단계: ../01-plan/README.md
- 요구사항 명세: ../01-plan/requirements.md
- 보고서 단계: ../03-report/README.md

---

**문서 버전**: 1.1.0
**최종 업데이트**: 2026-02-01
