# Snapshot Info

- **Created**: 2026-04-12 17:22:28 KST
- **Skill**: 6-final-report
- **Status**: v8 완료 스냅샷 (그림 번호-파일명 정렬 + 난이도 조정 + 해석 보강)
- **Baseline version**: final-report-v8.md → final/final-report.docx
- **Files**:
  - final/final-report.docx (v8 기반 DOCX, 338.8 KB, 9개 그림 포함)
  - figures/ (fig-1 ~ fig-9 PNG/PPTX + final-figures.pptx 통합본)
- **Changes from v7**:
  1. 그림 번호-파일명 1:1 정렬 (그림 1 = fig-1-*, …, 그림 9 = fig-9-*)
     - fig-1-algo-concepts (스케줄링 개념)
     - fig-2-system-architecture (시스템 아키텍처)
     - fig-3-data-flow (데이터 흐름)
     - fig-4-module-structure (모듈 구조)
     - fig-5-experiment-setup (실험 환경)
     - fig-6-avg-wait-time (알고리즘별 대기시간)
     - fig-7-mlfq-vs-fcfs (MLFQ 선점형 비교)
     - fig-8-ollama-tier (실서버 등급별)
     - fig-9-jfi-comparison (JFI 비교)
  2. 난이도 조정: "자기회귀적(autoregressive)" → "바로 앞에서 자신이 만든 토큰을 참고하여 다음 토큰을 한 개씩 정하는 방식"
  3. Cohen's d=20.39 해설 보강: 통상 기준(0.2/0.5/0.8) 맥락 + 왜 이렇게 높은지 + 실험 한계 명시
  4. WFQ dual JFI에 놀이터 비유 추가 (의도한 차등 vs 공정성 실패 명확화)
  5. 6.1 한계 확장: "넷째, 실서버 실험 규모가 제한적" 항목 추가 + 기존 3개 항목 실무 함의 보강
- **Generator updates**:
  - generate-final.js: final-report-v7.md → final-report-v8.md
  - generate-final.js: FIGURE_MAP 순차 1:1 매핑
  - generate-final-figures.js: 9개 슬라이드 타이틀 + 9개 HTML 타이틀 갱신 + figures 배열 재정렬
- **Archive**: final-report-v7.md → drafts/archive/
