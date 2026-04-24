# 제출 최종 점검표 (Submission Checklist)

클래스넷 업로드 및 현장 발표 직전에 이 체크리스트를 끝까지 돌린다. 하나라도 체크되지 않으면 제출을 보류한다.

---

## 1. 자동 검증 (`verify-submission.js`로 확인)

```bash
cd 08-final-submission/sync && node verify-submission.js
```

위 명령의 exit code가 0이면 아래 항목은 전부 자동 통과한 것이다.

- [ ] 필수 파일 존재: `README.md`, `QUICKSTART.md`, `final-report.docx`, `presentation.pptx`, `demo-scenario.md`, `script.md`, `study-plan.md`, `minji/README.md`, `submission-checklist.md`, `manifest.yaml`
- [ ] 시연 자립성 파일: `source-code/package.json`, `source-code/package-lock.json`, `source-code/.env.example`, `source-code/README.md` 모두 존재
- [ ] 핸드아웃 PDF: `presentation/handout.pdf` 존재 (미존재 시 WARN — 발표 D-3까지 PowerPoint에서 생성)
- [ ] DOCX 페이지 수 18~22p
- [ ] PPTX 슬라이드 수 12~20장
- [ ] §A 교차 참조 일치 (LLM 모델명·서버 포트·Ollama 포트·대시보드 URL)
- [ ] `minji/` md 파일 12개 이상
- [ ] `source-code/` (08 최상위)에 schedulers·llm·utils·public·queue·api·storage 디렉토리 모두 존재
- [ ] `experiments/` (08 최상위)에 run-experiments.js·experiment-results.json·compute-stats.js 모두 존재
- [ ] `demo/demo-scenario.md`에 `02-implementation/src-simple` 원본 경로 미참조 (WARN 수준, 자립성 권장)

## 2. 수동 확인 (사람이 직접 열어봐야 하는 항목)

### 2-1. 최종보고서 (`final-report/final-report.docx`)

- [ ] 표지의 과목명·지도교수·제출자 정보가 최신인지
- [ ] 목차의 페이지 번호가 본문과 일치하는지
- [ ] 모든 그림(fig-1 ~ fig-9)이 삽입되어 있고 흐려지지 않았는지
- [ ] 참고문헌 URL이 클릭 가능한 상태로 유지되는지
- [ ] 머리말·꼬리말(페이지 번호 `- N -`) 정상 렌더링

### 2-2. 소스코드 (`source-code/`, 08 최상위)

- [ ] `.env` 파일이 포함되지 않았는지 (비밀키·개인 정보 유출 방지) — `.env.example`만 있으면 OK
- [ ] `node_modules/`, `coverage*/`, `data/db.sqlite` 등 대용량 아티팩트가 빠졌는지
- [ ] `package-lock.json`이 포함되어 있는지 (재현성 필수)
- [ ] `README.md`에 실행 방법(install → start)이 단순한 명령으로 기술되어 있는지
- [ ] 주석이 학부생 수준으로 유지되는지 (지나친 설명·AI 생성 흔적 없음)

### 2-2b. 실험 자료 (`experiments/`, 08 최상위)

- [ ] `run-experiments.js`, `compute-stats.js` 스크립트 실행 가능 상태
- [ ] `experiment-results.json`, `ollama-results.json` 등 결과 파일 포함
- [ ] `multi-seed-results/` 하위 JSON 파일 다수 포함

### 2-3. 발표 슬라이드 (`presentation/presentation.pptx`)

- [ ] 1페이지 표지가 최신 정보
- [ ] 마지막 페이지 감사 멘트/Q&A 배치
- [ ] 홍익대 컬러(#C41230, #003478) 일관 적용
- [ ] 발표자 노트에 `---AI-PROMPT---` 블록이 남아있지 않은지 (후처리본 사용 시)
- [ ] 슬라이드 내 수치가 최종보고서 표 7~12와 동일한지 (수동 확인 권장: 7, 8, 9, 10, 11 슬라이드)

### 2-4. 인쇄 핸드아웃 (`presentation/handout.pdf`)

- [ ] 실제 프린터로 1장 출력하여 글자 가독성 확인
- [ ] 6-up 또는 N-up으로 축소 시 라벨·수치가 읽히는지
- [ ] 컬러/흑백 인쇄 양쪽 모두 시각 요소가 구분되는지

### 2-5. 데모 (`demo/` + 실제 시스템)

- [ ] `npm start` 후 `http://localhost:3000` 정상 응답
- [ ] `ollama run gemma4:e4b "hi"` warmup 정상
- [ ] demo-scenario.md 순서대로 시나리오 1·2를 끊김 없이 실행 가능
- [ ] 발표 시간 측정: 총 발표 시간이 공지 기준 ±5% 이내

### 2-6. 서민지 전달 자료 (`minji/`)

- [ ] README 최상단의 "자동 생성" 경고 문구가 남아있는지
- [ ] 12문서(rehearsal-playbook, glossary, numbers-cheatsheet, slide-cards-12, qa-student-voice, emergency-card, unexpected-questions, projector-checklist, backup-demo-shooting-kit, self-recording-evaluation-form, supervisor-checklist, README)가 모두 존재하는지
- [ ] 각 문서 내 숫자가 최종보고서 및 슬라이드와 일치하는지 (samples: 11,846ms, 22,029ms, 73%, 116~119ms, JFI 0.316)

## 3. 제출 수단 준비

### 3-1. 클래스넷 업로드 (보고서 + 소스코드 + 실험)

- [ ] `08-final-submission/` 전체를 압축. `snapshot_*/`, `sync/`, 개인 메모성 파일은 제외.

```bash
# 프로젝트 루트에서 실행 (예시)
cd /path/to/졸업프로젝트
zip -r 최종제출_홍익대_서민지_20201234.zip 08-final-submission \
    -x "08-final-submission/snapshot_*/*" \
    -x "08-final-submission/sync/*"
```

- [ ] 압축 파일명에 제출자 이름·학번 포함
- [ ] 업로드 후 다운로드 받아 압축 해제 테스트 1회
- [ ] 테스트: 해제된 폴더에서 `QUICKSTART.md` 순서대로 1회 시연 성공 확인
- [ ] 제출일: 2026-05-24(일) 자정 이전

### 3-2. 현장 발표 지참물

- [ ] 발표용 노트북 (충전 완료, 전원 어댑터 포함)
- [ ] HDMI / DP / USB-C 어댑터 (현장 프로젝터 대응)
- [ ] USB 또는 백업 저장소에 `presentation.pptx` + `handout.pdf` 복사본
- [ ] 인쇄된 `handout.pdf` (평가위원 수 + 여유분)
- [ ] 시계 또는 스톱워치 (발표 시간 체크)
- [ ] 발표 D-3 git 태그 `submission-freeze-YYYYMMDD` 체크아웃

### 3-3. 백업

- [ ] 데모 백업 녹화본(`minji/backup-demo-shooting-kit.md` 참조)이 노트북에 저장됨
- [ ] 최종보고서 PDF 변환본이 노트북에 저장됨 (DOCX 열람 불가 시 대비)
- [ ] Google Drive 또는 외장 드라이브에 전체 패키지 추가 복사

---

## 4. 검증 기록

가장 최근 `verify-submission.js` 실행 결과를 아래에 메모한다.

| 실행 시각 | 결과 | PASS 수 | FAIL 수 | 메모 |
|----------|------|--------|--------|------|
|          |      |        |        |      |

## 5. 제출 최종 승인

| 확인 주체 | 확인 일자 | 서명 |
|----------|----------|------|
| 작성자 (서민지) |          |      |
| 지도교수 (서진석) |          |      |

모든 체크박스가 채워지고 승인 서명이 완료되면 제출을 진행한다.
