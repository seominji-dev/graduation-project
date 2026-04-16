# Snapshot Info

- **Created**: 2026-04-16 20:32:42 KST
- **Skill**: 6-final-report
- **Status**: v24 (2nd polishing pass complete, candidate for final submission)
- **Source draft**: `drafts/final-report-v24.md` (534 lines)
- **Baseline DOCX formatting**: A4 11906×16838 twips, margins 1440, 맑은 고딕 11pt, line 360

## Revision History

- v22 → v23 (1st polishing, 4 edits): sentence tone, 그림 9 removed (duplicated 표 12)
- v23 → v24 (2nd polishing, 5 edits, 7 locations):
  - A-1 "영구 기아" → "기아 상태" (term consistency)
  - A-2 "알려져 있다" → "달성한다" (hearsay tone removal)
  - A-3 WFQ weights rationale added
  - A-4 "총 3,020건 규모" → "총 3,020건" (x2 locations)
  - A-5 "x" → "×" multiplication sign (x2 locations)

## Files

### final/
- final-report.docx (211,437 bytes)

### figures/
- fig-1-algo-concepts.pptx / .png
- fig-2-system-architecture.pptx / .png
- fig-3-data-flow.pptx / .png
- fig-4-module-structure.pptx / .png
- fig-5-experiment-setup.pptx / .png
- fig-6-avg-wait-time.pptx / .png
- fig-7-mlfq-vs-fcfs.pptx / .png
- fig-8-ollama-tier.pptx / .png
- final-figures.pptx (unified)
- generate-final-figures.js

## Known Divergence from Instructions Guideline

- Instructions.md lists 9 required figures; this snapshot has 8 figures (그림 9 removed).
- Reason: 그림 9 (JFI 막대 그래프) was information-duplicate of 표 12 which already includes 계산 방식·해석 columns.
- Authority: project-constraints.md HARD rules do not specify minimum figure count; authenticity/overspec prevention rules prioritize non-redundant deliverables.

## Status Note

This snapshot is a **read-only archive**. Do not modify files inside this folder. The version captured here is the candidate for classroom-net submission as of 2026-04-16 KST.
