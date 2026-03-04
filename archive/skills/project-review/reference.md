# Project Review - Advanced Reference

5차원 종합 평가 시스템의 상세 구현 가이드, 설정 옵션, 사용 예제입니다.

## 5차원 평가 상세 가이드

### 학술적 가치 평가 (Academic Value)

**연구 질의(RQ) 평가 기준:**

| 등급 | 기준 |
|------|------|
| 5점 (우수) | RQ가 명확, 구체적, 실질적, 실현 가능함 |
| 4점 (양호) | 대부분의 기준 충족, 약간의 개선 가능 |
| 3점 (보통) | 기본 기준 충족, 명확성/구체성 개선 필요 |
| 2점 (미흡) | 일부 기준만 충족, RQ 재정의 필요 |
| 1점 (부적합) | RQ가 불명확하거나 부적절 |

**AI 프롬프트 예시:**
```
다음 논문의 연구 질의를 평가하세요:
1. 명시적/암시적 RQ 추출
2. 명확성, 실질성, 실현 가능성 평가 (각 1-5점)
3. 종합 평가 및 구체적 피드백 제시
```

### 기술적 완성도 평가 (Technical Excellence)

**아키텍처 평가 체크리스트:**
- [ ] 모듈 간 결합도가 낮은가?
- [ ] 모듈 내 응집도가 높은가?
- [ ] 계층 구조가 명확한가?
- [ ] 디자인 패턴이 적절히 사용되었는가?
- [ ] 변경에 유연한가?

### 산출물 완성도 평가 (Deliverable Quality)

**발표 자료 평가 체크리스트:**
- [ ] 슬라이드당 핵심 메시지가 하나인가?
- [ ] 시각적 우선순위가 명확한가?
- [ ] 스토리텔링 흐름이 자연스러운가?
- [ ] 기술적 내용이 명확하게 전달되는가?
- [ ] 다이어그램/차트가 적절한가?

### 프로젝트 통합성 평가 (Project Coherence)

**요구사항 추적 매트릭스:**

| ID | 요구사항 | Phase 1 | Phase 2 | Phase 3 | 상태 |
|----|---------|---------|---------|---------|------|
| RQ-1 | 사용자 인증 | 명시됨 | JWT로 구현됨 | 보고됨 | 완료 |
| RQ-2 | 실시간 통신 | 명시됨 | WebSocket 구현 | 보고됨 | 완료 |
| RQ-3 | 데이터 분석 | 명시됨 | 부분 구현 | 한계 인정 | 부분 |

## 설정 옵션

### 커맨드 라인 옵션

```bash
# 전체 종합 검토 (기본)
/project-review

# 정량적 검토만
/project-review --quantitative-only

# 정성적 평가만
/project-review --qualitative-only

# 학술적 가치 중심
/project-review --academic-focus

# 데모 및 발표 중심
/project-review --demo-focus

# 졸업 요건 검토만
/project-review --graduation-check

# 미리보기 모드
/project-review --preview

# 내보내기
/project-review --export pdf
/project-review --export html
```

### 설정 파일

`.project-review/config.yaml`:

```yaml
review:
  project_root: "."
  phases:
    - "01-plan"
    - "02-implementation"
    - "03-report"

  document_paths:
    thesis: "03-report/paper"
    presentation: "03-report/presentation"
    demo: "03-report/demo"

  dimensions:
    academic_value:
      enabled: true
      weight: 20
    technical_excellence:
      enabled: true
      weight: 25
    deliverable_quality:
      enabled: true
      weight: 25
    project_coherence:
      enabled: true
      weight: 20
    graduation_readiness:
      enabled: true
      weight: 10

  validation:
    quantitative:
      enabled: true
      checks:
        - document_consistency
        - trust5_quality
        - requirement_traceability
    qualitative:
      enabled: true
      ai_analysis: true
      user_feedback: true

  auto_fix:
    enabled: true
    backup_before_fix: true
    confirm_unsafe_fixes: true

  language:
    primary: "korean"
    secondary: "english"
    check_spacing: true
    check_grammar: true

  output:
    format: "markdown"
    include_details: true
    include_recommendations: true
```

## 사용 예제

### 예제 1: 전체 종합 검토

```bash
# 전체 종합 검토 실행
/project-review

# 출력:
# Phase 0: 준비 중...
# - 프로젝트 구조 분석 완료
# - 15개 문서 발견
#
# Phase 1: 정량적 검토 중...
# - 문서 일관성 검증: 23개 불일치 발견
# - TRUST 5 검증: 전체 통과
#
# Phase 2: 정성적 분석 중...
# - 학술적 가치: 18/20
# - 기술적 완성도: 22/25
# - 산출물 완성도: 21/25
# - 프로젝트 통합성: 17/20
# - 졸업 적합성: 8/10
#
# 종합 평점: 86/100 (등급 B)
# 졸업 적합성: Ready
#
# 보고서: .project-review/reports/2026-02-07-143000-comprehensive-assessment.md
```

### 예제 2: 학술적 가치 중심 검토

```bash
/project-review --academic-focus

# 출력:
# 학술적 가치 평가 결과:
# - 연구 질의의 질: 5/5
# - 문헌 조사 충실성: 4/5
# - 방법론 타당성: 5/5
# - 결과 해석 능력: 4/5
#
# 총점: 18/20
#
# 강점:
# 1. 연구 질의가 매우 명확하고 구체적임
# 2. 방법론 선택의 근거가 탁월함
#
# 개선 필요:
# 1. 문헌 조사에 최신 연구(2023-2024) 추가 권장
```

### 예제 3: 졸업 요건 검토

```bash
/project-review --graduation-check

# 출력:
# 졸업 요건 검토 결과:
#
# 필수 항목:
# [✓] 명확한 연구 질의
# [✓] 문헌 조사 섹션
# [✓] 방법론 섹션
# [✓] 결과 및 결론 섹션
# [✓] 작동하는 코드/시스템
# [✓] 논문
# [✓] 발표 자료
# [✓] 데모
#
# 권장 항목:
# [✓] 한계 및 future work
# [✓] 성능 평가
# [✓] 사용자 매뉴얼
# [✗] API 문서
# [✓] 테스트 스위트
#
# 졸업 적합성: Ready
```

## 통합 패턴

### MoAI 워크플로우와 통합

```bash
# /moai sync 완료 후 종합 검토
/moai sync SPEC-XXX
/project-review --comprehensive
```

### 지속적 개선 루프

```bash
# 1. 초기 검토
/project-review

# 2. 개선 작업 수행

# 3. 재검토
/project-review

# 반복 until 등급 A 달성
```

### Git 훅과 통합

`.git/hooks/pre-commit`:

```bash
#!/bin/bash
# 커밋 전 project-review 실행
project-review --quantitative-only
if [ $? -ne 0 ]; then
    echo "검토 실패. 문제를 해결한 후 다시 시도하세요."
    exit 1
fi
```

## 템플릿

### 종합 평가 보고서 템플릿

`modules/report-generator.md` 참조

### 평가 체크리스트

```markdown
## 프로젝트 평가 체크리스트

### 학술적 가치 (20점)
- [ ] 연구 질의가 명확한가? (1-5)
- [ ] 연구 질의가 실질적인가? (1-5)
- [ ] 연구 질의가 실현 가능한가? (1-5)
- [ ] 문헌 조사가 최신인가? (1-5)
- [ ] 문헌 조사가 포괄적인가? (1-5)
- [ ] 비교 분석이 있는가? (1-5)
- [ ] 연구 간극을 식별하는가? (1-5)
- [ ] 방법론의 근거가 명확한가? (1-5)
- [ ] 대안 방법을 고려하는가? (1-5)
- [ ] 방법론의 한계를 인지하는가? (1-5)
- [ ] 결과에서 인사이트를 도출하는가? (1-5)
- [ ] 예상치못한 결과를 분석하는가? (1-5)

### 기술적 완성도 (25점)
- [ ] 아키텍처가 모듈화되어 있는가? (1-5)
- [ ] 계층 구조가 명확한가? (1-5)
- [ ] 확장이 가능한가? (1-5)
- [ ] 테스트 커버리지가 85% 이상인가? (1-3)
- [ ] 코드 주석이 충분한가? (1-2)
- [ ] 포맷이 일관된가? (1-2)
- [ ] 보안 취약점이 없는가? (1-2)
- [ ] git 기록이 정리되어 있는가? (1-1)

### 산출물 완성도 (25점)
- [ ] 논문의 논리 구조가 타당한가? (1-5)
- [ ] 인용이 적절한가? (1-5)
- [ ] 표/그래프가 적절한가? (1-3)
- [ ] 발표의 시각적 계층이 명확한가? (1-4)
- [ ] 발표의 스토리텔링이 좋은가? (1-4)
- [ ] 데모의 핵심 기능이 시연되는가? (1-2)
- [ ] 데모의 UI/UX가 좋은가? (1-2)

### 프로젝트 통합성 (20점)
- [ ] 요구사항이 100% 추적 가능한가? (1-10)
- [ ] 스토리라인이 일관된가? (1-2)
- [ ] 기여도와 한계가 솔직한가? (1-2)
- [ ] 구현 완료율이 90% 이상인가? (1-2)
- [ ] 치명적 버그가 없는가? (1-2)

### 졸업 적합성 (10점)
- [ ] 학위 수준에 부합하는가? (1-5)
- [ ] 독창성이 있는가? (1-3)
- [ ] 기여도가 있는가? (1-2)
```

## 관련 스킬

- **moai-foundation-quality**: 핵심 품질 프레임워크
- **manager-quality**: 품질 게이트 강제
- **expert-docs**: 문서 생성 및 수정
- **manager-ddd**: 동작 보존 리팩토링
- **project-continuous-improver**: 지속적 개선

---

Version: 2.0.0
Last Updated: 2026-02-07
