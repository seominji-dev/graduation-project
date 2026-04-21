# 08-final-submission — 최종 제출 통합 패키지

> **이 폴더는 자동 생성됩니다.** 내용 수정은 원본(`06-final-report/`, `07-presentation/`, `02-implementation/`)에서만 진행하고, `node sync/sync-submission.js`를 다시 실행해 이 폴더를 갱신하세요.

---

## 이 폴더의 역할

졸업프로젝트 최종 제출에 필요한 **모든 산출물 하나로 묶기**. 서민지는 이 폴더 하나만 들고 다니면 된다.

- 보고서 제출(클래스넷 업로드): `final-report/`
- 발표(현장 시연): `presentation/`, `demo/`, `minji/`
- 제출 전 최종 점검: `submission-checklist.md`, `manifest.yaml`

새로운 본문이나 슬라이드 내용은 이 폴더에서 만들지 않는다. 6번 스킬과 7번 스킬이 만든 결과를 8번 스킬이 **복사·검증·포장**해서 여기에 둔다.

---

## 폴더 구성

| 경로 | 원본 위치 | 용도 |
|------|----------|------|
| `final-report/final-report.docx` | `06-final-report/final/` | 최종보고서 (클래스넷 업로드용) |
| `final-report/source-code/` | `02-implementation/src-simple/` | 소스코드 (보고서와 함께 제출) |
| `presentation/presentation.pptx` | `07-presentation/slides/` | 발표 슬라이드 원본 |
| `presentation/presentation-final.pptx` | `07-presentation/slides/` (선택) | Claude in PowerPoint 후처리본 |
| `presentation/handout.pdf` | `07-presentation/handout/` | 현장 제출용 인쇄물 |
| `demo/demo-scenario.md` | `07-presentation/demo/` | 데모 실행 순서 |
| `demo/script.md` | `07-presentation/demo/` | 발표 스크립트 원본 |
| `demo/script-v2.md` | `07-presentation/demo/` (선택) | 서민지 입말 버전 |
| `demo/study-plan.md` | `07-presentation/demo/` | 발표 학습 계획서 (서민지 체크리스트) |
| `minji/` (12문서) | `07-presentation/minji/` | 발표 준비 개인 자료 |
| `submission-checklist.md` | — | 제출 직전 최종 점검표 |
| `manifest.yaml` | — | 모든 파일의 해시·크기·타임스탬프 |
| `sync/sync-submission.js` | — | 동기화 실행 스크립트 |
| `sync/verify-submission.js` | — | 교차 참조 자동 검증 |

---

## 사용 순서

### 1. 최초 열람

1. 이 `README.md` 끝까지 읽기
2. `minji/README.md`로 이동해 발표 준비 자료 구조 파악
3. `submission-checklist.md`로 제출 전 확인 항목 파악

### 2. 산출물을 업데이트했을 때

6번·7번 스킬이 최종보고서나 슬라이드를 갱신한 직후 반드시 동기화를 실행한다.

```bash
cd 08-final-submission/sync
node sync-submission.js
node verify-submission.js
```

- `sync-submission.js`: 최신 파일을 수집하고 `manifest.yaml`을 갱신한다. 직전 상태는 `snapshot_YYYYMMDD_HHmmss/`로 자동 보존된다.
- `verify-submission.js`: 페이지 수·슬라이드 수·§A 교차 참조를 점검한다. exit code 0이면 통과.

### 3. 제출 직전

1. `node sync-submission.js` 최신 동기화
2. `node verify-submission.js` 통과 확인 (FAIL 0개)
3. `submission-checklist.md`를 열어 수동 점검 항목 체크
4. 클래스넷에는 `final-report/` 전체를 압축해 업로드
5. 발표장에는 `presentation/` + `minji/` 파일을 지참

---

## 다른 폴더와의 관계

```
02-implementation/        <- 소스코드 원본 (sync가 읽어감)
06-final-report/          <- 최종보고서 원본 (sync가 읽어감)
07-presentation/          <- 발표·데모·서민지 자료 원본 (sync가 읽어감)
         │
         │  node sync-submission.js
         ▼
08-final-submission/      <- 이 폴더 (자동 생성)
```

- 세 원본 중 어느 하나가 바뀌면 8번 스킬을 다시 실행한다.
- 8번은 원본을 **읽기만** 한다. 원본 파일은 절대 건드리지 않는다.

---

## 문제가 생겼을 때

| 증상 | 원인/대처 |
|------|---------|
| `sync-submission.js`가 "Required source missing" 오류로 멈춤 | 6번 또는 7번 스킬의 해당 산출물이 아직 생성되지 않음. 해당 스킬을 먼저 실행. |
| `verify-submission.js`가 페이지 수 FAIL | 최종보고서 본문을 조정해 20±2 페이지로 맞추거나, LibreOffice(soffice) 설치 확인. |
| §A 교차 참조 FAIL | 모델명·포트·환경변수·URL이 문서들 간에 불일치. 7-presentation 스킬 §A의 5개 문서 체크표로 수동 정합. |
| `manifest.yaml`의 sha256이 모두 같은 해시 | 파일이 0바이트이거나 잘못 복사됨. 원본 파일 상태부터 확인. |

---

## 제출 일정 (26-1학기 기준)

| 일정 | 날짜 | 작업 |
|------|-----|------|
| D-2 (보고서) | 2026-05-22(목) | 보고서 freeze · git 태그 `submission-freeze-20260522` |
| 보고서 제출 | 2026-05-24(토) | 클래스넷 업로드 (`final-report/` 전체) |
| D-2 (발표) | 2026-05-24(토) | 발표 freeze · git 태그 `submission-freeze-20260524` |
| 발표 | 2026-05-26(화) ~ 2026-05-29(금) | 현장 발표 및 시연 |

동결 태그 생성 이후에는 이 폴더를 읽기 전용으로 취급하고 `sync-submission.js` 재실행을 금지한다.

---

## 자료 버전 정보

- **스킬 버전**: 8-final-submission v1.0.0
- **생성 도구**: `sync/sync-submission.js`
- **최근 동기화 시각**: `manifest.yaml`의 `generated_at` 참조
- **관련 스킬**: `6-final-report`, `7-presentation`
