# Report Generator Module

종합 평가 보고서 생성 모듈 - 평가 결과를 종합하여 보고서를 생성합니다.

## 보고서 구조

### 1. 실행 요약 (Executive Summary)

```markdown
# 프로젝트 종합 평가 보고서

## 평가 개요
- 프로젝트명: [프로젝트 이름]
- 평가일: YYYY-MM-DD
- 평가 범위: 5차원 종합 평가

## 종합 평점
- **총점:** XX/100
- **등급:** [A/B/C/D/F]
- **졸업 적합성:** [Ready/Conditional/Review Needed/Not Ready]

## 차원별 점수
| 차원 | 점수 | 비율 |
|------|------|------|
| 학술적 가치 | XX/20 | XX% |
| 기술적 완성도 | XX/25 | XX% |
| 산출물 완성도 | XX/25 | XX% |
| 프로젝트 통합성 | XX/20 | XX% |
| 졸업 적합성 | XX/10 | XX% |

## TOP 3 강점
1. [강점 1]: [구체적 설명]
2. [강점 2]: [구체적 설명]
3. [강점 3]: [구체적 설명]

## TOP 3 개선 필요 항목
1. [개선 항목 1]: [구체적 설명] - [우선순위: 높음]
2. [개선 항목 2]: [구체적 설명] - [우선순위: 중간]
3. [개선 항목 3]: [구체적 설명] - [우선순위: 낮음]
```

### 2. 정량적 검토 결과 (Quantitative Review Results)

```markdown
## 정량적 검토 결과

### 문서 일관성 검증
#### 수치 데이터 교차 검증
- 검증 항목 수: XX
- 불일치 발견: XX
- 자동 수정: XX
- 수동 수정 필요: XX

#### 용어 일관성
- 검증 용어 수: XX
- 불일치: XX
- 표준화: XX

#### 문법 및 오탈자
- 발견된 오류: XX
- 수정됨: XX

### TRUST 5 품질 재검증
| 항목 | 상태 | 점수 | 비고 |
|------|------|------|------|
| Tested | PASS/FAIL | X/X | [세부 내용] |
| Readable | PASS/FAIL | X/X | [세부 내용] |
| Unified | PASS/FAIL | X/X | [세부 내용] |
| Secured | PASS/FAIL | X/X | [세부 내용] |
| Trackable | PASS/FAIL | X/X | [세부 내용] |

### 요구사항 추적성 매트릭스
#### Phase 1 → Phase 2
- 요구사항 일치: XX/YY
- 구현 완료: XX/YY
- 변경 문서화: XX/YY

#### Phase 2 → Phase 3
- 결과 일치: 예/아니오
- 주장 검증: XX/YY

### 완성도 지표
- 구현 완료율: XX%
- 테스트 커버리지: XX%
- 문서화 완료율: XX%
- 미해결 버그: XX
- LSP 에러: XX
- LSP 경고: XX
```

### 3. 정성적 평가 결과 (Qualitative Assessment Results)

```markdown
## 정성적 평가 결과

### 1. 학술적 가치 (XX/20)

#### 연구 질의의 질 (XX/5)
- **명확성:** X/5 - [근거 및 피드백]
- **실질성:** X/5 - [근거 및 피드백]
- **실현 가능성:** X/5 - [근거 및 피드백]

#### 문헌 조사의 충실성 (XX/5)
- **최신성:** X/5 - [근거 및 피드백]
- **포괄성:** X/5 - [근거 및 피드백]
- **비교 분석:** X/5 - [근거 및 피드백]
- **간극 식별:** X/5 - [근거 및 피드백]

#### 방법론의 타당성 (XX/5)
- **근거 명시:** X/5 - [근거 및 피드백]
- **대안 고려:** X/5 - [근거 및 피드백]
- **한계 인식:** X/5 - [근거 및 피드백]
- **적절성:** X/5 - [근거 및 피드백]

#### 결과 해석 능력 (XX/5)
- **인사이트 도출:** X/5 - [근거 및 피드백]
- **예상치못한 결과 분석:** X/5 - [근거 및 피드백]
- **RQ와의 연결:** X/5 - [근거 및 피드백]

### 2. 기술적 완성도 (XX/25)
[위와 유사한 형식]

### 3. 산출물 완성도 (XX/25)
[위와 유사한 형식]

### 4. 프로젝트 통합성 (XX/20)
[위와 유사한 형식]

### 5. 졸업 적합성 (XX/10)
[위와 유사한 형식]
```

### 4. 행동 계획 (Action Plan)

```markdown
## 행동 계획

### 즉시 수정 필요 (Critical - 즉시 조치)
| 항목 | 문제 | 제안 해결책 | 우선순위 |
|------|------|-----------|----------|
| [항목] | [문제 설명] | [해결책] | 높음 |

### 개선 권장 (Recommended - 제출 전 개선)
| 항목 | 문제 | 제안 해결책 | 우선순위 |
|------|------|-----------|----------|
| [항목] | [문제 설명] | [해결책] | 중간 |

### 선택적 개선 (Optional - 시간 허용 시)
| 항목 | 문제 | 제안 해결책 | 우선순위 |
|------|------|-----------|----------|
| [항목] | [문제 설명] | [해결책] | 낮음 |
```

### 5. 부록 (Appendix)

```markdown
## 부록

### 상세 점수표
[전체 점수 테이블]

### 검토자 코멘트
[차원별 상세 코멘트]

### 참고 자료
- 검토된 문서 목록
- 사용된 평가 기준
- 참고 문헌
```

## 보고서 생성 명령

```bash
# 보고서 생성
/project-review --comprehensive

# 보고서 미리보기
/project-review --preview

# 보고서 내보내기 (PDF)
/project-review --export pdf

# 보고서 내보내기 (HTML)
/project-review --export html
```

## 출력 형식

### 파일 위치

```
.project-review/
├── reports/
│   └── YYYY-MM-DD-HHMMSS-comprehensive-assessment.md
└── backups/
    └── YYYY-MM-DD-HHMMSS/
```

### 파일 명명 규칙

- 기본: `YYYY-MM-DD-HHMMSS-comprehensive-assessment.md`
- 정량 검토만: `YYYY-MM-DD-HHMMSS-quantitative-only.md`
- 정성 평가만: `YYYY-MM-DD-HHMMSS-qualitative-only.md`
- 학술 중심: `YYYY-MM-DD-HHMMSS-academic-focus.md`
- 데모 중심: `YYYY-MM-DD-HHMMSS-demo-focus.md`
- 졸업 체크: `YYYY-MM-DD-HHMMSS-graduation-check.md`

## 보고서 템플릿

```markdown
---
title: "프로젝트 종합 평가 보고서"
date: {{DATE}}
project: {{PROJECT_NAME}}
version: "2.0"
assessor: "MoAI Project Review Agent"
---

# {{PROJECT_NAME}} 종합 평가 보고서

평가일: {{DATE}}
평가자: MoAI Project Review Agent v2.0
평가 방법: 5차원 종합 평가 (정량적 검토 + 정성적 평가)

## 실행 요약

### 종합 평점
- **총점:** {{TOTAL_SCORE}}/100
- **등급:** {{GRADE}}
- **졸업 적합성:** {{READINESS}}

### 차원별 점수

{{DIMENSION_SCORE_TABLE}}

### TOP 3 강점

{{TOP_3_STRENGTHS}}

### TOP 3 개선 필요 항목

{{TOP_3_IMPROVEMENTS}}

---

## 상세 분석

{{DETAILED_ANALYSIS}}

---

## 행동 계획

{{ACTION_PLAN}}

---
*본 보고서는 MoAI Project Review Agent v2.0에 의해 자동 생성되었습니다.*
```
