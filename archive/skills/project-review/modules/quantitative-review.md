# Quantitative Review Module

정량적 검토 모듈 - 자동화된 검증과 일관성 체크를 수행합니다.

## 검토 항목

### 1. 문서 일관성 검증 (Document Consistency)

**수치 데이터 교차 검증:**
- 성능 지표 (accuracy, precision, recall, F1-score)
- 테스트 결과 (pass rates, coverage percentages)
- 통계 (sample sizes, p-values, confidence intervals)
- 리소스 사용량 (memory, CPU, storage)

**검증 대상 문서:**
- `paper/` - 논문 PDF 또는 Markdown
- `presentation/` - 발표 자료 (PPT, PDF, Markdown)
- `demo/` - 데모 설명, 스크린샷, 결과
- `02-implementation/` - 테스트 리포트, 벤치마크 결과

**용어 일관성 검사:**
- 기술 용어 사용의 일관성
- 약어 정의 제공 여부
- 도메인 특화 용어 표준 준수
- 한국어/영어 번역 일관성

### 2. TRUST 5 품질 재검증

**Tested (테스트 완료):**
- 테스트 커버리지 실제값 vs 문서 기재값 비교
- 테스트 결과와 문서화된 결과 일치 여부
- 리팩토링된 코드의 characterization tests 존재 여부

**Readable (가독성):**
- 코드 주석 존재 및 유용성
- 명명 규칙 준수
- 문서화 완결도
- 코드 복잡도 지표

**Unified (통일성):**
- 언어별 포매터 실행 (ruff/black, ESLint/Prettier)
- 포맷 일관성 검증
- 스타일 가이드 준수 (ESLint, Ruff, Black 등)

**Secured (보안):**
- OWASP Top 10 취약점 스캔
- 입력 검증 검증
- 코드 내 secrets 검출
- 인증/인가 검토

**Trackable (추적 가능성):**
- Conventional commit 형식 준수
- commit의 issue/spec 참조 여부
- branch naming 규칙 준수

### 3. 요구사항 추적성 매트릭스

**Phase 1 → Phase 2 (Plan → Implementation):**
- `01-plan/requirements.md`의 요구사항 → `02-implementation/`의 구현
- 계획된 기술적 접근 → 실제 구현된 아키텍처
- 약속된 기능 → 전달된 기능
- 명시된 기술 스택 → 사용된 기술 스택
- 예상 일정 → 실제 완료 시점

**Phase 2 → Phase 3 (Implementation → Report):**
- `02-implementation/`의 테스트 결과 → `03-report/paper/`의 주장
- 성능 지표 → 보고된 결과
- 코드 품질 지표 → 품질 주장
- 보안 조치 → 보안 설명
- 배포 상태 → 배포 문서

### 4. 완성도 지표

**구현 완료율:**
- 계획된 기능 대비 구현된 기능 비율
- 테스트 작성 및 통과 비율
- 문서화 완료 비율

**품질 지표:**
- 버그/이슈 미해결 수
- LSP 에러 수
- LSP 경고 수
- 코드 커버리지 비율

## 자동화된 검토 방법

### Grep 패턴 기반 검증

```yaml
# 수치 추출 패턴
metric_patterns:
  - "(accuracy|precision|recall|f1[_-]?score):\\s*(\\d+\\.?\\d*)"
  - "(coverage|pass[_-]?rate):\\s*(\\d+\\.?\\d*)%?"
  - "(n=|sample[_-]?size):\\s*(\\d+)"

# 용어 일관성 패턴
terminology_patterns:
  - "API|api|Api"  # 대소문자 일관성
  - "frontend|front[_-]?end"  # 표기 일관성
```

### Bash 명령 기반 검증

```bash
# TRUST 5 검증
# - 테스트 커버리지 확인
# - 포매터 실행
# - Linter 실행
# - 보안 스캔

# Git 검증
# - conventional commit 확인
# - branch naming 확인
```

## 출력 형식

```yaml
quantitative_review:
  document_consistency:
    numerical_data:
      total_checks: X
      inconsistencies_found: Y
      fixed: Z
      remaining: W
    terminology:
      total_terms: X
      inconsistencies: Y
      standardized: Z
    grammar_typos:
      errors_found: X
      fixed: Y

  trust5_quality:
    tested:
      coverage_claimed: "XX%"
      coverage_actual: "YY%"
      status: "PASS|FAIL"
    readable:
      status: "PASS|FAIL"
      issues: []
    unified:
      status: "PASS|FAIL"
      issues: []
    secured:
      status: "PASS|FAIL"
      issues: []
    trackable:
      status: "PASS|FAIL"
      issues: []

  requirement_traceability:
    phase1_to_phase2:
      requirements_matched: "X/Y"
      deliverables_complete: true|false
    phase2_to_phase3:
      results_consistent: true|false
      claims_verified: "X/Y"

  completion_metrics:
    implementation_rate: "XX%"
    documentation_rate: "XX%"
    test_coverage: "XX%"
    bugs_remaining: X
    lsp_errors: X
    lsp_warnings: X
```
