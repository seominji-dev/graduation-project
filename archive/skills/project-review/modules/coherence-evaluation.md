# Coherence Evaluation Module

프로젝트 통합성 평가 모듈 - 프로젝트 전체의 일관성과 완성도를 평가합니다.

## 평가 차원: 프로젝트 통합성 (20점)

### 1. 요구사항 추적성 (10점)

**Phase 1 → Phase 2 (Plan → Implementation) 추적:**

- **요구사항 대비 구현 (Requirements vs Implementation):**
  - `01-plan/requirements.md`의 모든 요구사항이 구현되었는가?
  - 구현되지 않은 요구사항에 대한 설명이 있는가?
  - 변경된 요구사항이 문서화되었는가?

- **기술적 접근 대비 구현 (Approach vs Implementation):**
  - 계획된 기술적 접근이 실제로 구현되었는가?
  - 기술 스택 변경에 대한 근거가 있는가?
  - 아키텍처 설계가 준수되었는가?

- **기능 약속 대비 전달 (Feature Promises vs Delivery):**
  - 약속된 모든 기능이 전달되었는가?
  - 미구현 기능에 대한 계획이 있는가?

**Phase 2 → Phase 3 (Implementation → Report) 추적:**

- **결과 일치성 (Result Consistency):**
  - `02-implementation/`의 테스트 결과가 `03-report/paper/`에 정확히 보고되는가?
  - 성능 지표가 일치하는가?
  - 발견한 이슈가 솔직하게 보고되는가?

- **품질 주장 검증 (Quality Claims Verification):**
  - 코드 품질 주장이 실제와 일치하는가?
  - 보안 조치가 문서화된 대로 구현되었는가?

**AI 분석 프롬프트:**
```
다음 3단계 프로젝트의 요구사항 추적성을 분석하세요:

1. 01-plan의 요구사항을 추출하세요.
2. 02-implementation에서 해당 요구사항의 구현을 확인하세요.
3. 03-report에서 결과 보고를 확인하세요.
4. 각 단계 간의 일관성을 평가하세요.

추적성 매트릭스를 생성하고 점수를 부과하세요.
```

### 2. 서사적 일관성 (5점)

**평가 항목:**
- **스토리라인 (Storyline):** 프로젝트의 "스토리"가 3단계에 걸쳐 일관된가?
  - 문제 정의 → 해결책 → 결과의 흐름이 자연스러운가?
  - 각 단계가 다음 단계를 예고하는가?

- **기여도와 한계 (Contributions & Limitations):** 기여도와 한계가 솔직하게 기술되었는가?
  - 연구의 기여도가 명확히 드러나는가?
  - 한계를 솔직하게 인정하는가?
  - 미래 연구 방향이 제시되는가?

- **일관된 톤 (Consistent Tone):** 전체 프로젝트의 톤이 일관된가?
  - 학술적/기술적 톤이 유지되는가?
  - 용어 사용이 일관된가?

**AI 분석 프롬프트:**
```
다음 3단계 프로젝트의 서사적 일관성을 분석하세요:

1. 각 단계의 핵심 메시지를 추출하세요.
2. 메시지 간의 연결성을 확인하세요.
3. 기여도와 한계의 기술을 확인하세요.
4. 전체적인 스토리라인을 평가하세요.
```

### 3. 완성도 (5점)

**평가 항목:**
- **계획 대비 실현률 (Realization Rate):** 계획 대비 실현률은 얼마인가?
  - 계획된 기능의 몇 %가 구현되었는가?
  - 90% 이상인가? 80% 이상인가?

- **버그/이슈 (Bugs/Issues):** 버그/이슈 미해결 수는?
  - 치명적 버그가 없는가?
  - 주요 버그가 모두 해결되었는가?
  - 마이너 이슈만 남았는가?

- **문서 완성 (Documentation):** 문서가 완성되었는가?
  - README, API 문서, 사용자 가이드가 있는가?
  - 코드 주석이 충분한가?
  - 테스트 문서가 있는가?

**AI 분석 프롬프트:**
```
다음 프로젝트의 완성도를 평가하세요:

1. 계획된 기능 대비 구현된 기능을 계산하세요.
2. 열린 이슈/버그를 확인하세요.
3. 문서의 완성도를 평가하세요.

완성도 점수를 부과하고 개선이 필요한 영역을 식별하세요.
```

## 요구사항 추적 매트릭스 템플릿

| ID | 요구사항 | Phase 1 (Plan) | Phase 2 (Implementation) | Phase 3 (Report) | 상태 |
|----|---------|----------------|-------------------------|------------------|------|
| RQ-1 | 사용자 인증 | 명시됨 | JWT로 구현됨 | 보고됨 | 완료 |
| RQ-2 | 실시간 통신 | 명시됨 | WebSocket 구현 | 보고됨 | 완료 |
| RQ-3 | 데이터 분석 | 명시됨 | 부분 구현 | 한계 인정 | 부분 |

## 출력 형식

```yaml
coherence_evaluation:
  requirement_traceability:
    phase1_to_phase2:
      requirements_matched: "X/Y"
      percentage: "XX%"
      score: X/5
    phase2_to_phase3:
      results_consistent: true/false
      claims_verified: "X/Y"
      score: X/5
    total: X/10
    feedback: "[구체적 피드백]"

  narrative_consistency:
    storyline: X/2
    contributions_limitations: X/2
    consistent_tone: X/1
    total: X/5
    feedback: "[구체적 피드백]"

  completion_score:
    realization_rate: X/2
    bugs_issues: X/2
    documentation: X/1
    total: X/5
    feedback: "[구체적 피드백]"

  overall_score: X/20
  grade: "[A-F]"

  traceability_matrix: |
    | ID | 요구사항 | Phase 1 | Phase 2 | Phase 3 | 상태 |
    |----|---------|---------|---------|---------|------|
    | ... | ... | ... | ... | ... | ... |
```
