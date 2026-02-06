# LLM 스케줄러 요구사항 명세서

**프로젝트명**: OS 스케줄링 알고리즘을 활용한 LLM API 요청 최적화 스케줄러

**버전**: 1.0.0

**작성일**: 2026년 1월 28일

---

## 1. 기능 요구사항 (Functional Requirements)

### FR-1: 스케줄링 알고리즘 구현

#### FR-1.1: FCFS (First-Come, First-Served) 스케줄러
- **우선순위**: 필수 (P0)
- **설명**: 도착 순서대로 요청을 처리하는 스케줄러
- **상세 요구사항**:
  - FR-1.1.1: 요청 도착 순서를 타임스탬프 기반으로 보장
  - FR-1.1.2: FIFO 큐 구조 사용
  - FR-1.1.3: 비선점형 스케줄링 구현
  - FR-1.1.4: O(1) 시간 복잡도 달성
- **검증 기준**: 10개 요청 제출 시 타임스탬프 순서대로 처리 완료

#### FR-1.2: Priority Scheduling 스케줄러
- **우선순위**: 필수 (P0)
- **설명**: 우선순위 기반으로 요청을 처리하는 스케줄러
- **상세 요구사항**:
  - FR-1.2.1: 4단계 우선순위 지원 (URGENT=3, HIGH=2, NORMAL=1, LOW=0)
  - FR-1.2.2: 우선순위 큐 구조 사용
  - FR-1.2.3: 선점형 스케줄링 구현
  - FR-1.2.4: Aging 메커니즘으로 기아 방지
    - 5초 주기로 대기 중인 요청의 우선순위 1단계 상승
    - 구체적인 파라미터는 실험적으로 조정 가능
- **검증 기준**: URGENT 요청이 LOW 요청보다 먼저 처리됨 (도착 순서 무관)

#### FR-1.3: MLFQ (Multi-Level Feedback Queue) 스케줄러
- **우선순위**: 필수 (P0)
- **설명**: 다단계 피드백 큐 기반 스케줄러
- **상세 요구사항**:
  - FR-1.3.1: 4단계 큐 구현 (Q0, Q1, Q2, Q3)
  - FR-1.3.2: 큐별 타임 퀀텀 설정
    - Q0: 1000ms
    - Q1: 3000ms
    - Q2: 8000ms
    - Q3: Infinity
  - FR-1.3.3: MLFQ 5가지 규칙 구현
    - Rule 1: Priority(A) > Priority(B) → A 실행
    - Rule 2: Priority(A) = Priority(B) → Round-Robin
    - Rule 3: 새 작업은 Q0에서 시작
    - Rule 4: 타임 슬라이스 초과 시 강등
    - Rule 5: 주기적 Boost (30초마다 모든 작업을 Q0로)
  - FR-1.3.4: BoostManager 구현
- **검증 기준**: 짧은 작업은 Q0에서 완료, 긴 작업은 Q3로 강등

#### FR-1.4: WFQ (Weighted Fair Queuing) 스케줄러
- **우선순위**: 필수 (P0)
- **설명**: 가중치 기반 공정 스케줄링
- **상세 요구사항**:
  - FR-1.4.1: 테넌트별 가중치 관리 (TenantRegistry)
  - FR-1.4.2: Virtual Time 계산 (VirtualTimeTracker)
    - Virtual Finish Time = Virtual Start Time + (Service Time / Weight)
  - FR-1.4.3: GPS (Generalized Processor Sharing) 근사
  - FR-1.4.4: Jain's Fairness Index 계산 (FairnessCalculator)
    - 가중치에 비례하는 서비스 차등화 검증
    - 참고: WFQ의 낮은 Jain's Index는 의도된 불균형이며, 차등 서비스 성공을 의미함
  - FR-1.4.5: 테넌트 티어별 기본 가중치
    - enterprise: 100
    - premium: 50
    - standard: 10
    - free: 1
- **검증 기준**: 가중치 비율에 비례하는 대기시간 차등화 (예: Enterprise가 Free보다 의미있게 빠른 응답)

### FR-2: REST API

#### FR-2.1: 요청 관리 API
- **우선순위**: 필수 (P0)
- **엔드포인트**:
  - `POST /api/requests` - 새 요청 제출
  - `GET /api/requests/:id` - 요청 상태 조회
  - `DELETE /api/requests/:id` - 요청 취소
  - `GET /api/requests` - 전체 요청 목록
- **입력 검증**:
  - prompt: 필수, 문자열, 1-10000자
  - priority: 선택, enum (LOW, NORMAL, HIGH, URGENT)
  - provider: 필수, enum (ollama, openai)
  - tenantId: 선택 (WFQ 사용 시 필수)

#### FR-2.2: 스케줄러 관리 API
- **우선순위**: 필수 (P0)
- **엔드포인트**:
  - `POST /api/scheduler/switch` - 알고리즘 변경
  - `GET /api/scheduler/stats` - 통계 조회
  - `POST /api/scheduler/pause` - 일시정지
  - `POST /api/scheduler/resume` - 재개
- **지원 알고리즘**: fcfs, priority, mlfq, wfq

#### FR-2.3: MLFQ 전용 API
- **우선순위**: 필수 (P0)
- **엔드포인트**:
  - `GET /api/scheduler/mlfq/queues` - 큐별 상태
  - `GET /api/scheduler/mlfq/boost-status` - Boost 상태
  - `POST /api/scheduler/mlfq/boost` - 수동 Boost

#### FR-2.4: WFQ 전용 API
- **우선순위**: 필수 (P0)
- **엔드포인트**:
  - `GET /api/scheduler/wfq/fairness` - 공정성 지표
  - `GET /api/scheduler/wfq/virtual-time` - Virtual Time 조회
  - `POST /api/tenants` - 테넌트 등록
  - `PUT /api/tenants/:id` - 테넌트 가중치 수정

### FR-3: LLM 통합

#### FR-3.1: Ollama 통합
- **우선순위**: 필수 (P0)
- **설명**: 로컬 LLM 실행 환경 지원
- **요구사항**:
  - FR-3.1.1: Ollama HTTP API 연동
  - FR-3.1.2: 프롬프트 전송 및 응답 수신
  - FR-3.1.3: 연결 실패 시 재시도 (최대 3회)
  - FR-3.1.4: 타임아웃 설정 (30초)

#### FR-3.2: OpenAI API 통합
- **우선순위**: 선택 (P1)
- **설명**: 클라우드 LLM 서비스 지원
- **요구사항**:
  - FR-3.2.1: OpenAI API 키 관리
  - FR-3.2.2: gpt-3.5-turbo, gpt-4 모델 지원
  - FR-3.2.3: Rate Limiting 준수
  - FR-3.2.4: 비용 추적

### FR-4: 데이터 저장

#### FR-4.1: 메모리 큐 관리
- **우선순위**: 필수 (P0)
- **설명**: 메모리 배열 기반 작업 큐
- **요구사항**:
  - FR-4.1.1: 큐 생성 및 관리
  - FR-4.1.2: Job 추가, 조회, 삭제
  - FR-4.1.3: Worker 관리
  - FR-4.1.4: 큐 상태 관리

#### FR-4.2: JSON 파일 로그 저장
- **우선순위**: 필수 (P0)
- **설명**: 요청 처리 이력 영구 저장 (JSON 파일 기반)
- **요구사항**:
  - FR-4.2.1: JSON 파일 기반 요청 로그 구조 정의
  - FR-4.2.2: 요청 생성 시 로그 저장
  - FR-4.2.3: 처리 완료 시 로그 업데이트
  - FR-4.2.4: 파일 단위 저장 및 조회

### FR-5: 실시간 모니터링

#### FR-5.1: REST API 모니터링
- **우선순위**: 선택 (P1)
- **설명**: REST API 기반 스케줄러 상태 모니터링
- **요구사항**:
  - FR-5.1.1: 큐 상태 조회 API
  - FR-5.1.2: 처리량 통계 API
  - FR-5.1.3: 알고리즘 선택 API
  - FR-5.1.4: 폴링 방식 상태 조회

---

## 2. 비기능 요구사항 (Non-Functional Requirements)

### NFR-1: 성능 (Performance)

#### NFR-1.1: 응답 시간
- **요구사항**: API 엔드포인트 평균 응답 시간 < 100ms
- **측정 방법**: Apache Bench 또는 Artillery를 사용한 부하 테스트
- **검증 기준**: 동시 사용자 100명, 1000 요청 기준

#### NFR-1.2: 처리량 (Throughput)
- **요구사항**: 초당 50개 이상 요청 처리
- **측정 방법**: 메모리 큐 통계
- **검증 기준**: 5분간 평균 처리량 측정

#### NFR-1.3: 대기시간 분석
- **요구사항**: FCFS 대비 각 알고리즘의 대기시간 차이를 측정하고 분석 (\ud0d0\uad6c\uc801 \uc5f0\uad6c)
- **측정 방법**: 요청 제출 시각 ~ 처리 시작 시각
- **검증 기준**: 100개 요청 평균 측정, 연구 질문(RQ)을 통해 결과 해석

### NFR-2: 확장성 (Scalability)

#### NFR-2.1: 수직 확장
- **요구사항**: CPU 코어 수에 비례한 처리량 증가
- **측정 방법**: concurrency 설정 변경 실험
- **검증 기준**: concurrency=1 대비 concurrency=4에서 3배 이상 처리량

#### NFR-2.2: 수평 확장 (향후 계획)
- **요구사항**: 여러 워커 노드로 부하 분산
- **측정 방법**: 로드 밸런서 구성
- **검증 기준**: 노드 수에 비례한 처리량

### NFR-3: 가용성 (Availability)

#### NFR-3.1: 서비스 가동률
- **요구사항**: 99% 이상 가동률
- **측정 방법**: 업타임 모니터링
- **검증 기준**: 30일 평균

#### NFR-3.2: 장애 복구
- **요구사항**: JSON 파일 I/O 실패 시 적절한 에러 처리
- **측정 방법**: 파일 접근 실패 시뮬레이션
- **검증 기준**: 에러 메시지 반환 및 로그 기록

### NFR-4: 신뢰성 (Reliability)

#### NFR-4.1: 데이터 무결성
- **요구사항**: 모든 요청이 정확히 1회 처리 (Exactly-Once Semantics)
- **측정 방법**: 로그 분석
- **검증 기준**: 중복 처리 0건

#### NFR-4.2: 에러 처리
- **요구사항**: 모든 에러에 대한 명확한 에러 메시지
- **측정 방법**: 코드 리뷰
- **검증 기준**: 에러 핸들러 100% 커버

### NFR-5: 보안 (Security)

#### NFR-5.1: 입력 검증
- **요구사항**: Express 미들웨어를 사용한 런타임 검증
- **측정 방법**: 유효하지 않은 입력 테스트
- **검증 기준**: 잘못된 입력 시 400 Bad Request 반환

#### NFR-5.2: API 키 관리
- **요구사항**: 환경 변수로 API 키 관리, 로그에 노출 금지
- **측정 방법**: 코드 리뷰
- **검증 기준**: 하드코딩 API 키 0건

#### NFR-5.3: Rate Limiting
- **요구사항**: IP 기반 Rate Limiting (분당 100 요청)
- **측정 방법**: 부하 테스트
- **검증 기준**: 임계값 초과 시 429 Too Many Requests

### NFR-6: 유지보수성 (Maintainability)

#### NFR-6.1: 코드 품질
- **요구사항**: 가독성 있고 유지보수 가능한 코드
- **측정 방법**: 코드 리뷰 및 린터 검사
- **항목**:
  - 테스트: 85% 이상 테스트 커버리지
  - 가독성: 명확한 네이밍, 적절한 주석
  - 일관성: ESLint/Prettier 스타일 준수
  - 코드 검증: JSDoc 타입 주석

#### NFR-6.2: 테스트 커버리지
- **요구사항**:
  - Lines: 85% 이상 (주 지표)
  - Statements: 85% 이상
  - Branches: 85% 이상
  - Functions: 90% 이상
- **측정 방법**: Jest 커버리지 리포트 (`npm test -- --coverage`)
- **검증 기준**: npm test 실행 결과, 모든 지표 목표 달성

#### NFR-6.3: 문서화
- **요구사항**: 모든 공개 API에 JSDoc 주석
- **측정 방법**: 코드 리뷰
- **검증 기준**: JSDoc 커버리지 90% 이상

### NFR-7: 이식성 (Portability)

#### NFR-7.1: 플랫폼 독립성
- **요구사항**: macOS, Linux, Windows (WSL2) 지원
- **측정 방법**: 각 OS에서 테스트 실행
- **검증 기준**: 테스트 100% 통과

#### NFR-7.2: Docker 지원
- **요구사항**: Docker Compose로 전체 환경 구성
- **측정 방법**: docker-compose up 실행
- **검증 기준**: 모든 서비스 정상 시작

---

## 3. 제약사항 (Constraints)

### C-1: 기술 제약사항
- Node.js 버전: 20 LTS 이상
- JavaScript: ES2024
- Express.js 버전: 4.18 이상
- 데이터 저장: JSON 파일 (별도 DB 패키지 불필요)

### C-2: 비용 제약사항
- OpenAI API 사용 비용: 월 $50 이하
- 인프라 비용: 무료 티어 사용 (로컬 개발)

### C-3: 시간 제약사항
- 개발 기간: 12주
- 테스트 기간: 2주
- 문서화 기간: 2주

---

## 4. 검증 매트릭스 (Verification Matrix)

| 요구사항 ID | 검증 방법 | 담당자 | 상태 |
|------------|----------|--------|------|
| FR-1.1 | 단위 테스트 | 개발팀 | ✅ 완료 |
| FR-1.2 | 단위 테스트 | 개발팀 | ✅ 완료 |
| FR-1.3 | 단위 테스트 | 개발팀 | ✅ 완료 |
| FR-1.4 | 단위 테스트 | 개발팀 | ✅ 완료 |
| FR-2 | 통합 테스트 | 개발팀 | ✅ 완료 |
| FR-3 | 통합 테스트 | 개발팀 | ✅ 완료 |
| FR-4 | 통합 테스트 | 개발팀 | ✅ 완료 |
| NFR-1 | 부하 테스트 | QA팀 | ✅ 완료 |
| NFR-2 | 성능 테스트 | QA팀 | ✅ 완료 |
| NFR-6.2 | Jest 커버리지 | 개발팀 | ✅ 완료 (Lines: 98.55%, Branches: 85.43%, Functions: 95.94%) |

---

## 5. 우선순위 정의 (Priority Levels)

- **P0 (필수)**: 프로젝트 성공에 필수적인 요구사항
- **P1 (선택)**: 구현하면 좋지만 필수는 아닌 요구사항
- **P2 (향후)**: 향후 버전에서 구현 예정

---

---

## 6. 달성 결과 (Achievement Summary)

모든 요구사항이 성공적으로 구현 및 검증되었습니다:

| 요구사항 분류 | 목표 | 달성 | 상태 |
|--------------|------|------|------|
| 기능 요구사항 (FR) | 4개 스케줄러 | 4개 구현 완료 | 100% |
| 테스트 커버리지 - Lines (NFR-6.2) | 85%+ | 98.55% | 116% 초과 달성 |
| 테스트 커버리지 - Statements (NFR-6.2) | 85%+ | 98.65% | 116% 초과 달성 |
| 테스트 커버리지 - Branches (NFR-6.2) | 85%+ | 86.40% | 102% 초과 달성 |
| 테스트 커버리지 - Functions (NFR-6.2) | 90%+ | 95.94% | 107% 초과 달성 |
| 테스트 통과율 | 100% | 69/69 | 100% |
| 성능 분석 (NFR-1.3) | 탐구적 연구 | URGENT 62% 개선 (Priority) | 달성 |
| WFQ 차등 서비스 | 가중치 비례 | Enterprise 67% 개선 | 달성 |

---

**문서 버전**: 1.2.0

**최종 승인**: 2026년 1월 28일

**최종 업데이트**: 2026년 2월 4일 (최종 달성 결과 갱신)

**승인자**: 홍익대학교 컴퓨터공학과 졸업프로젝트 위원회
