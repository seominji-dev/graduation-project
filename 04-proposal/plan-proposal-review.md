# Plan: 제안서 최종본 검토 및 수정

## Context

제안서 최종본(`04-proposal/final/proposal.docx`)의 스타일/포맷 및 분량을 검토하여 수정한다.
소스 파일: `04-proposal/drafts/generate-proposal-docx.js` (DOCX 생성 스크립트가 실제 콘텐츠 소스)
목표 분량: ~7페이지 (project-constraints.md 기준)

---

## 검토 결과 요약

### A. 스타일 및 포맷 이슈 (5건)

#### A1. [중요] 한국어 폰트 미지정
- **현재**: `font: 'Arial'`만 사용 (전체 문서)
- **문제**: Arial은 한국어 글리프를 포함하지 않아, 시스템 기본 폰트로 폴백됨. 학술 문서에서 폰트가 일관되지 않을 수 있음.
- **수정**: 한국어 기본 폰트(예: '맑은 고딕') 지정, Arial은 영문/수식용으로 유지
- **파일**: `04-proposal/drafts/generate-proposal-docx.js` 전체

#### A2. [중요] 줄 간격(Line Spacing) 미설정
- **현재**: paragraph spacing(before/after)만 설정, 줄 간격은 기본값(1.0x)
- **문제**: 학술 문서는 최소 1.15x~1.5x 줄 간격이 일반적. 단일 줄 간격은 가독성 저하.
- **수정**: `line: 276` (1.15x) 추가
- **파일**: `generate-proposal-docx.js` - styles.default.document.paragraph 또는 각 Paragraph spacing

#### A3. [중요] 표지 부제목 줄바꿈 오류
- **현재**: `'Multi-User LLM API Request Management System\nUsing OS Scheduling Algorithms'` (line 138)
- **문제**: docx.js의 TextRun에서 `\n`은 줄바꿈으로 렌더링되지 않음. 한 줄로 이어져 출력됨.
- **수정**: 별도의 Paragraph 2개로 분리하거나, TextRun 사이에 `break` 속성 사용
- **파일**: `generate-proposal-docx.js:136-139`

#### A4. [경미] 스크립트 버전 주석 불일치
- **현재**: 주석에 "proposal-v26.md 마크다운 기반" (line 3), main()에 "v26" (line 556)
- **문제**: 최신 마크다운은 v27이며, 실제로 DOCX 내용은 마크다운과 상당히 다름
- **수정**: 주석 업데이트

#### A5. [참고] 블로그 참고문헌
- **현재**: [9] velog, [10] tistory, [11] tistory 블로그 포스트
- **문제**: 학술 문서에서 블로그 출처는 권위성이 낮음. 단, 한국어 보충 자료로 사용 가능.
- **판단**: 사용자 확인 필요 - 유지 또는 교체

### B. 분량 검토

#### 현재 예상 분량 (1인치 여백, 11pt, 단일 줄 간격 기준)
| 섹션 | 예상 페이지 |
|------|------------|
| 표지 | 1 |
| 1. 서론 | 1~1.5 |
| 2. 관련 연구 | 2~2.5 |
| 3. 제안 시스템 | 1.5~2 |
| 4. 연구 일정 | 0.5 |
| 참고문헌 | 0.5~1 |
| **합계** | **~7~8** |

- 현재 단일 줄 간격 기준으로 ~7페이지 내외로 적정 범위
- 줄 간격을 1.5x로 변경하면 ~9~10페이지로 초과 가능
- **권장**: 줄 간격 1.15x (276 twips) 적용 시 ~7~8페이지 유지 예상

---

## 수정 계획

### Step 1: 폰트 수정 (A1)
- `generate-proposal-docx.js`에서 `font: 'Arial'`을 `font: '맑은 고딕'`으로 변경
- 참고문헌 등 영문 위주 텍스트는 Arial 유지 고려

### Step 2: 줄 간격 추가 (A2)
- document default style에 `paragraph.spacing.line: 276` (1.15x) 추가

### Step 3: 표지 부제목 수정 (A3)
- line 136-139의 TextRun을 2개의 별도 Paragraph로 분리

### Step 4: 버전 주석 업데이트 (A4)
- 주석의 "v26"을 "v27"로 변경

### Step 5: DOCX 재생성 및 분량 확인
- `node generate-proposal-docx.js` 실행
- 생성된 DOCX 파일 크기 및 페이지 수 확인

---

## 검증 방법
1. `node 04-proposal/drafts/generate-proposal-docx.js` 실행하여 DOCX 재생성
2. 생성된 `04-proposal/final/proposal.docx` 확인

## 수정 대상 파일
- `04-proposal/drafts/generate-proposal-docx.js` (유일한 수정 파일)
