# 졸업프로젝트 5차원 종합 평가 보고서

**평가일자**: 2026년 2월 7일
**학생**: 서민지 (홍익대학교 컴퓨터공학과 C235180)
**프로젝트**: OS 스케줄링 알고리즘을 활용한 다중 사용자 LLM API 요청 관리 시스템
**평가자**: MoAI Project Review System

---

## Executive Summary

### 종합 평점: 82/100 (B 등급)

| 차원 | 만점 | 획득 | 등급 | 비고 |
|------|------|------|------|------|
| **학술적 가치** | 20 | 15.0 | B | RQ1/RQ3 우수, RQ2 미흡 |
| **기술적 완성도** | 25 | 20.5 | A | 코드 품질 우수, 아키텍처 명확 |
| **산출물 완성도** | 25 | 20.0 | B | 논문/발표 작성 완료, 일관성 이슈 |
| **프로젝트 통합성** | 20 | 15.0 | B | 요구사항 추적 완료, 문서 간 불일치 |
| **졸업 적합성** | 10 | 8.5 | A | 학위 수水平 적합, 기여도 확인 |

### TOP 3 강점

1. **높은 테스트 커버리지 (98.65%)**: 69개 테스트 전체 통과, TRUST 5 기준 준수
2. **명확한 연구 질의 설계**: RQ1 (Priority 62% 개선), RQ3 (WFQ 5.8x 차별화) 결과 검증
3. **모듈형 아키텍처**: 4개 스케줄러, REST API, LLM 연동의 명확한 분리

### TOP 3 개선 필요 사항

1. **발표 자료 데이터 불일치**: 슬라이드 27의 "JFI 0.89", "MLFQ 40% 개선" 주장 실험 데이터 미지원
2. **RQ2 (MLFQ) 실험 결과 부족**: MLFQ와 FCFS 성능이 동일하게 나타나 적응형 특성 미검증
3. **이중 논문 구조로 인한 혼란**: `paper/final-report.md` vs `result-report/final-report.md` 초점 불일치

---

## 1. 학술적 가치 (15/20)

### 1.1 연구 질의 품질 (4/5)

| 평가 항목 | 점수 | 비고 |
|-----------|------|------|
| 명확성 | 5/5 | RQ1, RQ2, RQ3가 명확히 정의됨 |
| 검증 가능성 | 3/5 | RQ2 실험 결과 미흡 (MLFQ = FCFS) |
| 학술적 기여 | 4/5 | LLM 분야에 OS 스케줄링 적용의 참신성 |

**RQ1**: "긴급 요청이 일반 요청보다 평균 대기 시간이 50% 이상 개선되는가?"
- ✅ **검증됨**: URGENT 요청 대기 시간 6ms vs 일반 16ms = **62% 개선**

**RQ2**: "MLFQ가 다양한 부하 패턴에 대해 FCFS보다 적응형 성능을 보이는가?"
- ❌ **미검증**: 실험 결과 MLFQ 대기 시간 = FCFS (모두 16ms), Boosting 효과 미관찰

**RQ3**: "WFQ가 테넌트 가중치에 따라 서비스 차별화를 제공하는가?"
- ✅ **검증됨**: Enterprise(10) 5ms vs Free(1) 29ms = **5.8x 차별화**

### 1.2 문헌 조사 (4/5)

**기본 문헌 포함**:
- Silberschatz OS Textbook (OS 스케줄링 기본 이론)
- OSTEP (Operating Systems: Three Easy Pieces)
- GPS/WFQ 이론 (Parekh & Gallager 1993)

**확장 가능성**:
- 최근 LLM 스케줄링 관련 연구 (2023-2025) 추가 권장
- Multi-tenant fairness 논문 보강 필요

### 1.3 방법론 타당성 (3/5)

**장점**:
- 4개 알고리즘 구현 완료 (FCFS, Priority+Aging, MLFQ+Boosting, WFQ+Virtual Time)
- 100 requests, 4 tenants 실험 설계
- Jain's Fairness Index 활용

**단점**:
- MLFQ Boosting interval(500ms)이 실험 기간보다 길어 Boosting 발생 안 함
- 통계적 유의성 검증(t-test, 3회 반복)이 `result-report`에만 언급
- Baseline과의 비교가 FCFS로만 한정됨

### 1.4 결과 해석 (4/5)

**우수한 해석**:
- Priority Aging 기법으로 Starvation 방지 검증
- WFQ Virtual Time 계산으로 GPS 근사 구현
- JFI 0.32(시스템 수준)를 의도적 불균형으로 정당화

**개선 필요**:
- MLFQ 실험 결과에 대한 추가 분석 필요
- 두 논문 간 JFI 값 불일치(0.32 vs 0.92-0.98) 설명 필요

---

## 2. 기술적 완성도 (20.5/25)

### 2.1 아키텍처 (4.5/5)

```
src-simple/
├── index.js (진입점)
├── server.js (HTTP 서버)
├── api/routes.js (REST API)
├── schedulers/ (4개 스케줄러)
├── queue/MemoryQueue.js (요청 큐)
├── storage/JSONStore.js (영구 저장)
└── llm/OllamaClient.js (LLM 연동)
```

**장점**:
- 계층형 구조, 명확한 분리
- BaseScheduler 추상화로 확장성 확보
- REST API 표준 준수

**개선**:
- 이벤트 기반 아키텍처 미적용 (현재 동기 처리)
- 분산 환경 고려 미흡

### 2.2 코드 품질 - TRUST 5 (9/10)

| TRUST 5 | 점수 | 근거 |
|---------|------|------|
| **Tested** | 10/10 | 98.65% statement, 86.4% branch coverage |
| **Readable** | 9/10 | 한국어 주석, 명확한 명명 |
| **Unified** | 9/10 | ESLint 설정, 일관된 스타일 |
| **Secured** | 8/10 | 입력 검증 있으나 OWASP 완전 준수 아님 |
| **Trackable** | 9/10 | Git 관리, Conventional commits |

**테스트 결과**:
```
Test Suites: 3 passed, 3 total
Tests:       69 passed, 69 total
Statements: 98.65% | Branches: 86.4% | Functions: 95.94% | Lines: 98.55%
Time:        0.218s
```

### 2.3 기술 스택 (4/5)

| 기술 | 버전 | 평가 |
|------|------|------|
| JavaScript | ES2024 | ✅ 최신 문법 활용 |
| Node.js | 22 LTS | ✅ Current 버전 |
| Express.js | 4.18 | ✅ 안정적 |
| Jest | 29.7 | ✅ 테스트 프레임워크 |
| Ollama | - | ✅ 오픈소스 LLM |

**확장 가능성**:
- TypeScript 도입 권장 (타입 안전성)
- SQLite/PostgreSQL DB 고려

### 2.4 성능 및 보안 (3/5)

**성능**:
- 단일 프로세스 동기 처리 (요청당 평균 10-100ms)
- Concurrent 요청 처리 미구현

**보안**:
- 기본 입력 검증 구현
- Rate limiting, 인증 미구현
- OWASP Top 10 완전 대응 필요

---

## 3. 산출물 완성도 (20/25)

### 3.1 논문 (8/10)

**`paper/final-report.md` (539 lines)**:
- 6장 구조: Introduction, Related Work, System Design, Implementation, Experiments, Conclusion
- References [1]-[10] 인용
- LLM 스케줄링 최적화 초점

**`result-report/final-report.md` (811 lines)**:
- Provider 관점, Multi-tenant fairness 초점
- GPS/WFQ 이론 상세 설명
- Tenant-level JFI 0.92-0.98

**이슈**:
- 두 논문의 초점과 데이터 불일치
- 하나의 논문으로 통합 권장

### 3.2 발표 (7/10)

**`presentation/graduation-presentation.md`** (27 slides):
- 15-20분 분량 적절
- 아키텍처 다이어그램 포함
- 코드 스니펫, 성능 비교표 포함

**불일치 이슈**:
- 슬라이드 27: "JFI 0.89" 주장 vs 실험 데이터 0.32
- 슬라이드 27: "MLFQ 대기시간 40% 개선" 주장 vs 데이터 미지원

### 3.3 데모 (5/5)

**`demo/demo-script.md`**:
- 6개 시나리오 완성 (FCFS, Priority, MLFQ, WFQ, Dashboard)
- curl 명령어, 예상 출력, 나레이션 포함
- Troubleshooting 섹션 포함

---

## 4. 프로젝트 통합성 (15/20)

### 4.1 요구사항 추적성 (8/10)

**FR-1.1~1.4 (4개 스케줄러)**: ✅ 완료
- FCFS, Priority, MLFQ, WFQ 모두 구현

**FR-2 (REST API)**: ✅ 완료
- POST /request, GET /stats, GET /queue 엔드포인트

**FR-3 (LLM 연동)**: ✅ 완료
- OllamaClient로 LLM 요청 처리

**FR-4 (저장소)**: ✅ 완료
- JSONStore로 영구 저장

**NFR (85%+ coverage, 100% pass)**: ✅ 완료
- 98.65% coverage, 69/69 tests pass

### 4.2 서사 일관성 (4/10)

**불일치 사항**:

1. **JFI 값**:
   - `paper/final-report.md`: 시스템 JFI 0.32
   - `result-report/final-report.md`: Tenant JFI 0.92-0.98
   - `presentation/graduation-presentation.md`: JFI 0.89

2. **MLFQ 성능**:
   - Presentation: "40% 개선" 주장
   - 실험 데이터: FCFS와 동일 (16ms)

3. **Demo script 불일치**:
   - "SQLite" 언급 vs JSON 파일 저장
   - "Prometheus metrics" 언급 vs 미구현

### 4.3 완성도 (8/10)

- Phase 1, 2, 3 모두 완료
- Phase 3→Phase 1 feedback 문서 존재
- 요구사항 검증 매트릭스 완료

---

## 5. 졸업 적합성 (8.5/10)

### 5.1 학위 수준 적합성 (5/5)

- 컴퓨터공학과 졸업프로젝트로 적합
- OS 이론 실제 구현 및 응용
- 연구-구현-검증 완료

### 5.2 독창성 및 기여도 (3.5/5)

**독창성**:
- OS 스케줄링 알고리즘을 LLM API 요청에 적용
- 실제 오픈소스 LLM(Ollama)과 통합

**기여도**:
- Priority Aging, WFQ Virtual Time 구현
- 실험 데이터 공개

**확장 가능성**:
- 산업체 적용을 위한 Production-ready 코드 필요
- 추가 스케줄링 알고리즘 연구 여지

---

## 6. 정량적 검증 (Quantitative Review)

### 6.1 자동화 일관성 검증

| 검증 항목 | 결과 |
|-----------|------|
| 테스트 통과율 | 69/69 (100%) |
| 커버리지 달성 | 98.65% (목표 85% 초과) |
| 요구사항 추적 | 13/13 FR 완료 |
| 문서 존재 | 모든 Phase 문서 완료 |

### 6.2 TRUST 5 재검증

- ✅ Tested: 98.65% coverage
- ✅ Readable: 한국어 주석, 명확한 명명
- ✅ Unified: 일관된 코드 스타일
- ⚠️ Secured: OWASP 완전 준수 필요
- ✅ Trackable: Git 관리

### 6.3 추적성 매트릭스

| 요구사항 | 설계 | 구현 | 테스트 | 문서 |
|----------|------|------|--------|------|
| FR-1.1 (FCFS) | ✅ | ✅ | ✅ | ✅ |
| FR-1.2 (Priority) | ✅ | ✅ | ✅ | ✅ |
| FR-1.3 (MLFQ) | ✅ | ✅ | ✅ | ✅ |
| FR-1.4 (WFQ) | ✅ | ✅ | ✅ | ✅ |
| FR-2 (API) | ✅ | ✅ | ✅ | ✅ |
| FR-3 (LLM) | ✅ | ✅ | ✅ | ✅ |
| FR-4 (Storage) | ✅ | ✅ | ✅ | ✅ |

---

## 7. 개선行动计划 (Action Plan)

### Critical (긴급, 반드시 수정)

| 우선순위 | 항목 | 조치 |
|----------|------|------|
| 1 | 발표 슬라이드 27 데이터 수정 | JFI 0.89 → 0.32, MLFQ 40% 삭제 또는 실험 추가 |
| 2 | 논문 통합 | 두 논문을 하나로 통합, JFI 측정 레벨 명시 |
| 3 | Demo script 수정 | SQLite → JSON, Prometheus 삭제 |

### Recommended (권장사항)

| 우선순위 | 항목 | 조치 |
|----------|------|------|
| 1 | RQ2 재실험 | MLFQ Boosting interval 조정 (50ms → 20ms) |
| 2 | 최신 문헌 추가 | 2023-2025 LLM 스케줄링 논문 3편 이상 |
| 3 | 통계 검증 보강 | t-test 결과를 모든 논문에 반영 |
| 4 | OWASP 대응 | Rate limiting, 입력 검증 강화 |
| 5 | TypeScript 도입 | 타입 안전성 확보 |

### Optional (선택사항)

| 우선순위 | 항목 | 조치 |
|----------|------|------|
| 1 | 이벤트 기반 아키텍처 | 비동기 요청 처리 |
| 2 | 분산 캐시 도입 | Redis를 활용한 분산 큐 |
| 3 | 추가 스케줄러 | Stride Scheduling, CFS |
| 4 | Production 배포 | Docker, Kubernetes 설정 |
| 5 | 실제 부하 테스트 | 1,000+ requests 대규모 실험 |

---

## 8. 결론

본 프로젝트는 **OS 스케줄링 알고리즘을 LLM API 요청 관리에 적용**이라는 참신한 주제로, 4개 알고리즘 구현, 98.65% 테스트 커버리지, 명확한 연구 질의 설계 등에서 우수한 성과를 보였습니다. 특히 Priority 스케줄러의 긴급 요청 62% 개선과 WFQ의 테넌트별 5.8x 차별화 성능은 실험적으로 잘 검증되었습니다.

다만, MLFQ 실험 결과 부족, 발표 자료 데이터 불일치, 이중 논문 구조로 인한 혼란 등은 졸업 전 반드시 수정해야 할 사항입니다. 이러한 문제들이 해결된다면 **A 등급(90+)** 가능성이 충분합니다.

**종합 평가**: 컴퓨터공학과 졸업프로젝트로서의 목표를 달성했으며, 실제 산업 적용 가능성을 가진 유익한 프로젝트입니다.

---

*본 보고서는 MoAI Project Review System에 의해 자동 생성되었습니다.*
*평가 기준: .claude/skills/project-review/modules/scoring-rubric.md*
