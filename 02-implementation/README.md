# Phase 2: 구현 (Implementation)

## 프로젝트명
**LLM 스케줄러: OS 스케줄링 기법을 활용한 LLM API 요청 최적화**

## 이 폴더의 목적
LLM 스케줄러 소스코드, 테스트, 실험 데이터를 관리합니다.

## 폴더 구조

```
02-implementation/
├── src/                    # 소스코드
│   ├── schedulers/        # 4개 스케줄링 알고리즘
│   │   ├── FCFSScheduler.ts
│   │   ├── PriorityScheduler.ts
│   │   ├── MLFQScheduler.ts
│   │   └── WFQScheduler.ts
│   ├── api/               # REST API
│   ├── services/          # 비즈니스 로직
│   ├── managers/          # 관리자 클래스
│   ├── infrastructure/    # DB 클라이언트
│   └── index.ts           # 진입점
├── tests/                  # 테스트 코드 (707개)
├── coverage/               # 테스트 커버리지 리포트
├── experiments/            # 실험 데이터 및 결과
└── shared/                 # 공유 유틸리티
```

## 빠른 시작

```bash
cd 02-implementation
npm install
npm run dev      # 개발 서버 (포트 3000)
npm test         # 테스트 실행
```

## 핵심 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| TypeScript | 5.3+ | 주요 언어 |
| Express.js | 4.18 | 웹 프레임워크 |
| BullMQ | 5.1.8 | 작업 큐 |
| Redis | 7.2+ | 큐 상태 저장 |
| MongoDB | 8.0+ | 로그 저장 |

## 테스트 결과

- 테스트 수: 707개
- 통과율: 100%
- 커버리지: 98.29%

## 관련 문서
- 계획 단계: ../01-plan/README.md
- 보고서 단계: ../03-report/README.md
