# 08-final-submission — 서민지의 단일 폴더

**이 폴더 하나면 충분합니다.** 제출·발표·학습에 필요한 모든 자료가 여기에 있습니다. 다른 폴더(`02-`, `06-`, `07-`)를 찾아다닐 필요가 없습니다.

---

## 폴더 구성

| 경로 | 용도 |
|------|------|
| `final-report/final-report.docx` | 최종보고서 (클래스넷 업로드용) |
| `final-report/source-code/` | 소스코드 — `npm install && npm start`로 시연 가능 |
| `final-report/experiments/` | 실험 스크립트 + 결과 JSON (재현성 자료) |
| `presentation/presentation.pptx` | 발표 슬라이드 |
| `presentation/handout.pdf` | 인쇄용 핸드아웃 (발표 D-3까지 PowerPoint에서 생성) |
| `demo/demo-scenario.md` | 시연 실행 순서 |
| `demo/script.md`, `script-v2.md` | 발표 스크립트 (원본 + 입말 버전) |
| `demo/study-plan.md` | 발표 학습 계획서 (서민지 체크리스트) |
| `minji/` (12문서) | 리허설·Q&A·비상카드 등 개인 준비 자료 |
| `submission-checklist.md` | 제출 직전 최종 점검표 |
| `manifest.yaml` | 모든 파일의 해시·크기·타임스탬프 |
| `sync/` | 동기화 및 검증 스크립트 |

---

## 사용 순서

### 제출 (클래스넷)

`final-report/` 전체를 압축해 업로드하면 됩니다. 코드·실험·보고서가 모두 포함됩니다.

### 시연 (발표장)

```bash
cd 08-final-submission/final-report/source-code
npm install
npm start
```

브라우저로 `http://localhost:3000` 접속. 상세 순서는 `demo/demo-scenario.md` 참조.

### 발표 준비 (리허설)

`minji/README.md`부터 시작해 12개 문서 차례대로 학습. 날짜별 계획은 `demo/study-plan.md`.

---

## 자료 갱신 방법

이 폴더는 **자동 동기화 폴더**입니다. 직접 편집하면 다음 동기화 때 덮어씌워집니다. 내용을 수정하려면 원본에서 수정 후 아래 명령을 실행하세요.

```bash
cd 08-final-submission/sync
node sync-submission.js    # 원본에서 복사 + manifest 갱신
node verify-submission.js  # 교차 참조 자동 검증
```

원본 위치: `02-implementation/src-simple/`, `02-implementation/experiments-simple/`, `06-final-report/final/`, `07-presentation/`.

---

## 문제 발생 시

| 증상 | 대처 |
|------|-----|
| sync가 "Required source missing"으로 중단 | 6번(`06-final-report`) 또는 7번(`07-presentation`) 스킬을 먼저 실행 |
| verify가 페이지 수 FAIL | 6번 스킬에서 본문 조정 |
| §A 교차 참조 FAIL | 7번 스킬 §A의 5개 문서를 대조하여 수동 정합 |
| `handout.pdf` 누락 | PowerPoint에서 `presentation.pptx` → 파일 → 인쇄 → PDF로 저장 (2-in-1 배치) |
| manifest의 sha256가 모두 동일 | 소스 파일이 0바이트. 원본 상태부터 확인 |

---

## 일정 (26-1학기)

- 보고서 제출: 2026-05-24(일) 자정 이전 (클래스넷)
- 발표: 2026-05-26(화) ~ 5-29(금) 중 지정일 (현장 시연)
- D-2 동결: 제출일 2일 전 git 태그 `submission-freeze-YYYYMMDD`

동결 이후 이 폴더는 **읽기 전용**입니다. sync 재실행 금지.
