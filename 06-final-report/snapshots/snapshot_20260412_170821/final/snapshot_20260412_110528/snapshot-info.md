# Snapshot: 20260412_110528 (KST)

## Context

Phase A/B/C 완료 후, final-report-v5.md 개정판을 DOCX로 재생성하기 직전 상태를 보관한다.

## Changes Applied Before This Regeneration

### Phase A (Critical): 숫자 불일치 수정
- Section 5.5(2): WFQ 테넌트 대기시간 교체 (2,046/8,301/15,247/21,790 → 1,862/8,384/15,109/22,029)
- "약 10배" → "약 12배" (실제 비율: 1:11.83)
- Appendix B: 선점 한계 단락 추가 (시뮬레이션 전용 결과 고지)

### Phase B (High): 지표/해석 명확화
- Section 5.5: JFI 두 공식(대기시간 기반 / 처리량·가중치 기반) 설명 블록 추가
- 표 15: "계산 방식" 열 추가
- Section 5.2: MLFQ=FCFS 상세 해설 2가지 이유 확장
- 표 10/12/18: 사용 지표(대기시간/응답시간) 부제 및 지표 차이 설명 추가

### Phase C (Medium): 실험 코드 문서화
- run-experiments.js: Legacy 헤더 + 시뮬레이션 시간 vs 실시간 설명 주석 추가
- run-extended.js: 헤더 확장 (JFI 이중 공식, 시뮬레이션 한계, 보고서 매핑 명시)
- experiment-environment.md: 3개 실험 (run-extended.js / run-multi-seed.js / run-ollama-experiment.js) 중심으로 전면 재작성

## Snapshot Contents

- `final/final-report.docx`: 재생성 직전 DOCX (342,812 bytes, 2026-04-12 10:10 기준)
- `figures/*.png`, `figures/*.pptx`: 그림 파일 일체 (9개 그림)

## Restore Procedure

이 스냅샷으로 되돌리려면:
```
cp snapshot_20260412_110528/final/final-report.docx ../final-report.docx
cp snapshot_20260412_110528/figures/*.png ../../figures/
cp snapshot_20260412_110528/figures/*.pptx ../../figures/
```

## Next Step

`06-final-report/drafts/generate-final.js` 실행 → 새 DOCX 생성
