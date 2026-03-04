---
name: project-review
description: >
  5차원 종합 평가 시스템 + 반복 개선 루프. 학술적 가치(연구 질의, 문헌 조사, 방법론, 결과 해석),
  기술적 완성도(아키텍처, 코드 품질, TRUST 5, 성능, 보안),
  산출물 완성도(논문, 발표, 데모),
  프로젝트 통합성(요구사항 추적성, 서사 일관성, 완성도),
  졸업 적합성(학위 수준, 독창성, 기여도)을 평가하고 자동으로 개선합니다.
  정량적 검토(문서 일관성, 자동화된 검증)와 정성적 평가(AI 기반 분석)를 결합하여
  종합 평가 보고서(점수 0-100, 등급 A-F, 강점/약점 분석, 개선 계획)를 생성하고,
  project-continuous-improver와 연동하여 반복 개선 루프를 실행합니다.
  옵션 없이 호출하면 전체 종합 검토 + 개선 제안을 실행합니다.
license: Apache-2.0
compatibility: Designed for Claude Code with MoAI-ADK
allowed-tools: Read Write Edit Grep Glob Bash TaskCreate TaskUpdate TaskList TaskGet AskUserQuestion
user-invocable: true
metadata:
  version: "3.0.0"
  category: "assessment"
  status: "active"
  updated: "2026-02-08"
  modularized: "true"
  tags: "review, assessment, evaluation, comprehensive, qualitative, quantitative, graduation-project, 3-phase, academic, technical, deliverable, coherence, readiness, iterative, continuous-improvement, auto-fix"
  author: "MoAI-ADK"
  related-skills: "moai-foundation-quality, manager-quality, moai-workflow-project, project-continuous-improver"
  argument-hint: "[--comprehensive|--quantitative-only|--qualitative-only|--academic-focus|--demo-focus|--graduation-check] [--auto-fix] [--continuous] [--max-iterations N]"
  context: "For comprehensive 5-dimensional assessment with iterative improvement loop"
  agent: "project-review-agent"

# MoAI Extension: Progressive Disclosure
progressive_disclosure:
  enabled: true
  level1_tokens: 250
  level2_tokens: 18000

# MoAI Extension: Triggers
triggers:
  keywords:
    - "review"
    - "assessment"
    - "evaluation"
    - "검토"
    - "평가"
    - "comprehensive"
    - "종합"
    - "quality check"
    - "품질 검사"
    - "validation"
    - "검증"
    - "improvement"
    - "개선"
    - "phase review"
    - "단계 검토"
    - "graduation project"
    - "졸업 프로젝트"
    - "final review"
    - "최종 검토"
    - "academic evaluation"
    - "학술 평가"
    - "technical assessment"
    - "기술 평가"
    - "deliverable quality"
    - "산출물 품질"
    - "project coherence"
    - "프로젝트 통합성"
    - "graduation readiness"
    - "졸업 적합성"
    - "qualitative assessment"
    - "정성적 평가"
    - "quantitative review"
    - "정량적 검토"
    - "continuous improvement"
    - "지속적 개선"
    - "iterative review"
    - "반복적 평가"
    - "progress tracking"
    - "진전 추적"
  agents:
    - "project-review-agent"
    - "manager-quality"
    - "project-continuous-improver"
    - "expert-docs"
    - "manager-ddd"
    - "expert-frontend"
    - "expert-backend"
  phases:
    - "sync"
    - "run"
    - "plan"
  languages:
    - "korean"
    - "english"
---

# Project Review - Comprehensive Assessment System with Iterative Improvement

## 5차원 종합 평가 시스템 + 반복 개선 루프

졸업 프로젝트의 전체적인 완성도를 평가하고 **자동으로 개선하는 정성적+정량적 통합 시스템**입니다. 단순한 평가를 넘어 평가 → 개선 → 재평가의 반복 루프를 통해 프로젝트를 지속적으로 향상시킵니다.

## 평가 차원 (5 Dimensions)

| 차원 | 배점 | 평가 내용 |
|------|------|----------|
| **학술적 가치** (Academic Value) | 20점 | 연구 질의의 질, 문헌 조사 충실성, 방법론 타당성, 결과 해석 능력 |
| **기술적 완성도** (Technical Excellence) | 25점 | 아키텍처 설계, 코드 품질(TRUST 5), 기술 스택, 성능/보안 |
| **산출물 완성도** (Deliverable Quality) | 25점 | 논문 서지, 발표 스토리텔링, 데모 효과성 |
| **프로젝트 통합성** (Project Coherence) | 20점 | 요구사항 추적성, 서사적 일관성, 완성도 |
| **졸업 적합성** (Graduation Readiness) | 10점 | 학위 수준 적합성, 독창성, 기여도 |

**총점: 100점** | **등급: A(90-100), B(80-89), C(70-79), D(60-69), F(0-59)**

## 핵심 기능

### 1. 정량적 검토 (Quantitative Review)
- 문서 간 수치 데이터 교차 검증
- 용어 일관성 검사
- TRUST 5 품질 재검증
- 요구사항 추적성 매트릭스 생성

### 2. 정성적 평가 (Qualitative Assessment)
- 연구 질의(RQ)의 명확성과 실질성 평가
- 문헌 조사의 깊이와 최신성 분석
- 방법론 선택의 근거와 타당성 평가
- 결과 해석의 인사이트 도출 능력 평가

### 3. 자동 수정 기능 (Auto-Fix) **[NEW]**
`--auto-fix` 플래그로 활성화:
- 문서 간 수치 불일치 자동 수정
- 용어 일관성 자동 수정
- 소수점 표기 통일
- 오타 및 문법 오류 수정

### 4. 반복 개선 루프 (Iterative Improvement) **[NEW]**
`--continuous` 플래그로 활성화:
- 평가 → 개선 → 재평가 루프 실행
- project-continuous-improver 에이전트와 연동
- 진전 추적 및 점수 비교
- 최대 반복 횟수 설정 가능 (`--max-iterations N`)

### 5. 다음 단계 가이드 (Next Steps Guide) **[NEW]**
진전이 없을 때 제안:
- 논문 투고 준비
- 학술 대회 발표 제안
- 오픈소스 공유
- 포트폴리오 등록
- 추가 실험 아이디어

### 6. 종합 평가 보고서
- 5차원 점수 및 등급
- 강점 3가지, 개선 필요 항목 3가지
- 졸업 작품 적합성 판정 (Ready/Conditional/Not Ready)
- 진전 추적 그래프 (반복 모드)
- 행동 계획 (즉시 수정, 개선 권장, 선택적 개선)

## 사용법

**기본 사용 (전체 종합 검토 + 개선 제안):**
```bash
/project-review
```

**자동 수정 모드:**
```bash
/project-review --auto-fix
```
수치 불일치, 용어, 오타 등을 자동으로 수정합니다.

**반복 개선 모드:**
```bash
/project-review --continuous --max-iterations 5
```
평가 → 개선 → 재평가 루프를 최대 5회 실행합니다.

**선택적 옵션:**
```bash
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

# 모든 기능 활성화
/project-review --auto-fix --continuous --max-iterations 3
```

## 평가 및 개선 프로세스

### Phase 0: 준비
- 프로젝트 구조 분석
- 문서 발견 및 매핑
- 이전 평가 기록 확인 (반복 모드)

### Phase 1: 정량적 검토
- 자동화된 일관성 검증
- TRUST 5 재검증
- **자동 수정 실행 (--auto-fix 시)**

### Phase 2: 정성적 분석
- AI 기반 5차원 분석
- 학술/기술/산출물/통합성 평가

### Phase 3: 종합 평가
- 5차원 점수 산정
- 강점/약점 식별
- 이전 점수와 비교 (반복 모드)

### Phase 4: 개선 계획
- 행동 계획 수립
- 우선순위 설정
- **다음 단계 가이드 제안**

### Phase 5: 개선 실행 (--continuous 시)
- project-continuous-improver 에이전트 호출
- 개선 항목 실행
- 파일 수정 및 검증

### Phase 6: 재평가 (--continuous 시)
- 변경 사항 재평가
- 점수 비교
- 진전 확인

### Phase 7: 완료 여부 판단
- 완료 조건: 모든 P0 해결, 점수 향상 5% 이상, 사용자 만족
- 미완료 시 Phase 5로 복귀 (최대 반복 횟수까지)
- 완료 시 최종 보고서 생성

## 진전 추적 (Progress Tracking)

반복 모드에서 다음을 추적합니다:

| 항목 | 추적 방식 |
|------|----------|
| 총점 | 이전 점수 vs 현재 점수 |
| 차원별 점수 | 향상/유지/저하 표시 |
| 해결된 이슈 | P0/P1/P2/P3 해결 수 |
| 수정된 파일 | 파일 경로 및 수정 내역 |
| 실행 시간 | 전체 소요 시간 |

## 다음 단계 가이드 (Next Steps)

평가 결과가 A+ (95점 이상)이거나 진전이 없을 때 제안:

### 학술적 성과 단계
- [ ] 논문 투고 가능 학회지 선정
- [ ] 초안 작성 및 피드백 요청
- [ ] 저널 투고

### 발표 및 공유 단계
- [ ] 학술 대회 발표 제안서 작성
- [ ] GitHub 오픈소스 공유
- [ ] 기술 블로그 포스팅

### 커리어 단계
- [ ] 포트폴리오 등록
- [ ] LinkedIn 프로젝트 추가
- [ ] 취업/대학원 지원 서류 작성

### 추가 실험 아이디어
- [ ] 장기 작업 포함 MLFQ 실험
- [ ] 대규모 부하 테스트
- [ ] 실제 웹 서비스 통합

## 출력물

```
.project-review/
├── reports/
│   ├── YYYY-MM-DD-HHMMSS-initial-assessment.md
│   ├── YYYY-MM-DD-HHMMSS-iteration-1.md
│   ├── YYYY-MM-DD-HHMMSS-iteration-2.md
│   └── YYYY-MM-DD-HHMMSS-final-summary.md
├── backups/
│   └── YYYY-MM-DD-HHMMSS/
├── progress/
│   └── progress-tracker.json
└── next-steps/
    └── next-steps-checklist.md
```

## 완료 마커

- `<project-review>DONE</project-review>` - 단일 평가 완료
- `<project-review>IMPROVED</project-review>` - 개선 완료 (점수 향상)
- `<project-review>COMPLETE</project-review>` - 전체 루프 완료
- `<project-review>NEXT_STEPS</project-review>` - 다음 단계 가이드 생성됨

## Works Well With

- **project-continuous-improver**: 3단계 프로젝트의 지속적 개선 (핵심 연동)
- **moai-foundation-quality**: 핵심 품질 프레임워크 및 TRUST 5 구현
- **manager-quality**: 품질 게이트 강제 및 TRUST 5 검증
- **expert-docs**: 문서 생성 및 수정
- **manager-ddd**: 코드 개선을 위한 동작 보존 리팩토링

## 통합 패턴

### 패턴 1: 평가 후 자동 개선
```
/project-review --auto-fix
→ 일관성 문제 자동 수정
→ 보고서 생성
```

### 패턴 2: 반복 개선 루프
```
/project-review --continuous --max-iterations 3
→ 평가
→ 개선 (project-continuous-improver)
→ 재평가
→ (반복)
→ 최종 보고서
```

### 패턴 3: 다음 단계 안내
```
/project-review (A+ 프로젝트)
→ 평가 완료
→ "축하합니다! A+ 등급입니다."
→ 다음 단계 체크리스트 제공
```

---

Version: 3.0.0
Last Updated: 2026-02-08
Category: Assessment with Continuous Improvement
Status: Active
