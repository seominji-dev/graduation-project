# 08-final-submission — 서민지의 단일 폴더

**이 폴더 하나면 충분합니다.** 제출·시연·학습에 필요한 모든 자료가 여기에 있습니다. 다른 폴더(`02-`, `06-`, `07-`)를 찾아다닐 필요가 없습니다.

**지금 바로 시연을 시작하려면** → [`QUICKSTART.md`](QUICKSTART.md) 참조 (15분 가이드)

---

## 폴더 구성 (v2.0.0)

| 경로 | 용도 |
|------|------|
| `QUICKSTART.md` | 시연 환경 15분 구축 가이드 (Ollama 설치·모델 pull·npm install·서버 실행) |
| `source-code/` | 실행 가능한 소스코드. `package-lock.json` 포함 — 재현성 확보 |
| `experiments/` | 실험 스크립트 + 결과 JSON (재현성 자료, `run-experiments.js`·`compute-stats.js` 등) |
| `final-report/final-report.docx` | 최종보고서 (클래스넷 업로드용 단일 파일) |
| `presentation/presentation.pptx` | 발표 슬라이드 |
| `presentation/handout.pdf` | 인쇄용 핸드아웃 (발표 D-3까지 PowerPoint에서 생성) |
| `demo/demo-scenario.md` | 시연 상세 시나리오 (QUICKSTART 이후 참조) |
| `demo/script.md`, `script-v2.md` | 발표 스크립트 (원본 + 입말 버전) |
| `demo/study-plan.md` | 발표 학습 계획서 (서민지 개인 체크리스트) |
| `minji/` (12문서) | 리허설·Q&A·비상카드 등 개인 준비 자료 |
| `submission-checklist.md` | 제출 직전 최종 점검표 |
| `manifest.yaml` | 모든 파일의 해시·크기·타임스탬프 |
| `sync/` | 동기화 및 검증 스크립트 (서민지가 직접 실행하지 않음) |

---

## 사용 순서

### 제출 (클래스넷)

최종보고서 DOCX와 소스코드·실험 자료를 함께 제출합니다. 08 폴더 전체를 zip으로 압축하여 업로드하면 됩니다.

```bash
# 프로젝트 루트에서 실행
cd /path/to/졸업프로젝트
zip -r 08-final-submission.zip 08-final-submission \
    -x "08-final-submission/snapshot_*/*" \
    -x "08-final-submission/sync/*"
```

`snapshot_*/`와 `sync/`는 서민지가 제출할 때 제외해도 됩니다 (개인 작업 히스토리·동기화 도구).

### 시연 (발표장)

[`QUICKSTART.md`](QUICKSTART.md)를 처음부터 끝까지 따라하면 시연이 준비됩니다. 상세 시연 순서는 [`demo/demo-scenario.md`](demo/demo-scenario.md) 참조.

### 발표 준비 (리허설)

[`minji/README.md`](minji/README.md)부터 시작해 12개 문서를 차례대로 학습합니다. 날짜별 계획은 [`demo/study-plan.md`](demo/study-plan.md)에 있습니다.

---

## 자료 갱신 방법

이 폴더는 **자동 동기화 폴더**입니다. 직접 편집하면 다음 동기화 때 덮어씌워집니다. 내용을 수정하려면 원본에서 수정 후 아래 명령을 실행하세요.

```bash
cd 08-final-submission/sync
node sync-submission.js    # 원본에서 복사 + manifest 갱신
node verify-submission.js  # 교차 참조 자동 검증
```

원본 위치: `02-implementation/src-simple/`, `02-implementation/experiments-simple/`, `06-final-report/final/`, `07-presentation/`.

**예외** — 이 폴더에서 직접 유지되는 파일(sync 대상 아님):
- `README.md` (이 파일)
- `QUICKSTART.md`
- `submission-checklist.md`

---

## 문제 발생 시

| 증상 | 대처 |
|------|-----|
| sync가 "Required source missing"으로 중단 | 6번(`06-final-report`) 또는 7번(`07-presentation`) 스킬을 먼저 실행 |
| verify가 페이지 수 FAIL | 6번 스킬에서 본문 조정 |
| §A 교차 참조 FAIL | 7번 스킬 §A의 5개 문서를 대조하여 수동 정합 |
| `handout.pdf` 누락 | PowerPoint에서 `presentation.pptx` → 파일 → 인쇄 → PDF로 저장 (2-in-1 배치) |
| `manifest`의 sha256이 모두 동일 | 소스 파일이 0바이트. 원본 상태부터 확인 |
| 시연 시 서버가 뜨지 않음 | [`QUICKSTART.md`](QUICKSTART.md) 마지막 "문제 해결" 섹션 참조 |

---

## 일정 (26-1학기)

- 보고서 제출: 2026-05-24(일) 자정 이전 (클래스넷)
- 발표: 2026-05-26(화) ~ 5-29(금) 중 지정일 (현장 시연)
- D-2 동결: 제출일 2일 전 git 태그 `submission-freeze-YYYYMMDD`

동결 이후 이 폴더는 **읽기 전용**입니다. sync 재실행 금지.

---

## 구조 변경 이력 (v2.0.0)

v2.0.0(2026-04-23)에서 `source-code/`와 `experiments/`가 `final-report/` 하위에서 **08 최상위**로 이동했습니다. 이전 구조에서는 "최종보고서의 첨부물"이라는 의미가 강해 시연 자립성을 저해했습니다. 이제 서민지는 폴더를 열자마자 `source-code/`를 바로 볼 수 있습니다.

v1.x 스냅샷(`snapshot_20260421_*/`)은 보존되어 있어 롤백이 가능합니다.
