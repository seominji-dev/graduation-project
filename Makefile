# 졸업프로젝트 통합 빌드·동기화·검증 Makefile
# v1.0.0 (2026-04-28)
#
# 사용법:
#   make finalize  : 전체 7단계 — 그림 + DOCX + PDF + 발표 PPTX + 핸드아웃 PDF + 08 sync + 08 verify
#   make figures   : 그림만 재빌드 (8 PPTX + 8 PNG + 통합 PPTX)
#   make docx      : 최종보고서 DOCX만 재빌드
#   make pdf       : DOCX → PDF만 재변환 (LibreOffice 필요)
#   make pptx      : 발표 슬라이드 PPTX만 재빌드
#   make handout   : 인쇄 핸드아웃 PDF만 재빌드
#   make sync      : 08-final-submission 동기화만
#   make verify    : 08-final-submission 검증만
#   make stale     : 08이 stale인지 점검 (mtime 비교만)
#   make clean     : .DS_Store 등 임시 파일 정리
#   make help      : 이 도움말

# 경로 상수
PROJECT_ROOT := $(shell pwd)
FIG_DIR      := 06-final-report/figures
DRAFTS_DIR   := 06-final-report/drafts
FINAL_DIR    := 06-final-report/final
SLIDES_DIR   := 07-presentation/slides
HANDOUT_DIR  := 07-presentation/handout
SYNC_DIR     := 08-final-submission/.sync

.PHONY: finalize figures docx pdf pptx handout sync verify stale clean help all

# 기본 타겟: 도움말
help:
	@echo "졸업프로젝트 빌드 시스템 사용법:"
	@echo ""
	@echo "  make finalize  : 전체 빌드 + 동기화 + 검증 (권장)"
	@echo "  make figures   : 그림만 재빌드"
	@echo "  make docx      : DOCX만 재빌드"
	@echo "  make pdf       : DOCX → PDF만 변환"
	@echo "  make pptx      : 발표 PPTX만 재빌드"
	@echo "  make handout   : 핸드아웃 PDF만 재빌드"
	@echo "  make sync      : 08 동기화만"
	@echo "  make verify    : 08 검증만"
	@echo "  make stale     : 08 stale 점검 (mtime만 비교)"
	@echo "  make clean     : .DS_Store 등 임시 파일 정리"
	@echo ""

# 'make all'을 'make finalize'의 별칭으로
all: finalize

# 통합 파이프라인: 7단계 순차 실행
finalize: figures docx pdf pptx handout sync verify
	@echo ""
	@echo "===== Finalize 완료 — READY TO SUBMIT ====="

figures:
	@echo "[1/7] 그림 빌드 (8 PPTX + 8 PNG + 통합 PPTX) ..."
	@cd $(FIG_DIR) && NODE_PATH=node_modules node generate-final-figures.js | tail -3

docx:
	@echo "[2/7] DOCX 빌드 (최신 마크다운 → final-report.docx) ..."
	@cd $(DRAFTS_DIR) && node generate-final.js | tail -3

pdf:
	@echo "[3/7] DOCX → PDF 변환 (LibreOffice headless) ..."
	@soffice --headless --convert-to pdf --outdir $(FINAL_DIR) $(FINAL_DIR)/final-report.docx >/dev/null 2>&1
	@echo "       Output: $(FINAL_DIR)/final-report.pdf"

pptx:
	@echo "[4/7] 발표 슬라이드 PPTX 빌드 ..."
	@cd $(SLIDES_DIR) && node generate-presentation.js | tail -3

handout:
	@echo "[5/7] 핸드아웃 PDF 빌드 ..."
	@cd $(HANDOUT_DIR) && node generate-handout.js | tail -3

sync:
	@echo "[6/7] 08-final-submission 동기화 ..."
	@node $(SYNC_DIR)/sync-submission.js | tail -5

verify:
	@echo "[7/7] 08-final-submission 검증 ..."
	@node $(SYNC_DIR)/verify-submission.js | tail -5

stale:
	@bash .claude/hooks/project/check-08-stale.sh </dev/null

clean:
	@echo "임시 파일 정리 (.DS_Store) ..."
	@find . -name ".DS_Store" -not -path "*/node_modules/*" -not -path "*/_archive/*" -delete 2>/dev/null || true
	@echo "정리 완료"
