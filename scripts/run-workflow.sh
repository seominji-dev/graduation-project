#!/bin/bash
# 졸업프로젝트 워크플로우 자동 실행 스크립트
# 사용법: ./scripts/run-workflow.sh [phase2|phase3|all]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMPL_DIR="$PROJECT_ROOT/02-implementation"
REPORT_DIR="$PROJECT_ROOT/03-report"
PLAN_DIR="$PROJECT_ROOT/01-plan"

echo "═══════════════════════════════════════════════════════════"
echo "  졸업프로젝트 워크플로우 실행"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Phase 2: 구현 및 테스트
run_phase2() {
    echo "[Phase 2] 구현 및 테스트 시작..."
    cd "$IMPL_DIR"

    echo "  → 의존성 설치"
    npm install --silent

    echo "  → 테스트 실행"
    npm test

    echo "  → 실험 실행"
    npm run experiment

    echo "[Phase 2] 완료 ✓"
    echo ""
}

# Phase 3: 보고서 확인
run_phase3() {
    echo "[Phase 3] 보고서 확인..."

    if [ -f "$IMPL_DIR/experiments-simple/experiment-results.json" ]; then
        echo "  → 실험 결과 파일 확인: OK"
    else
        echo "  → 실험 결과 파일 없음. Phase 2를 먼저 실행하세요."
        exit 1
    fi

    if [ -f "$REPORT_DIR/paper/experiment-results.md" ]; then
        echo "  → 실험 보고서 확인: OK"
    else
        echo "  → 실험 보고서 없음"
    fi

    echo "[Phase 3] 완료 ✓"
    echo ""
}

# 피드백 확인
run_feedback() {
    echo "[Feedback] Phase 1 피드백 확인..."

    if [ -f "$PLAN_DIR/phase3-feedback.md" ]; then
        echo "  → 피드백 문서 확인: OK"
    else
        echo "  → 피드백 문서 없음"
    fi

    echo "[Feedback] 완료 ✓"
    echo ""
}

# 메인 실행
case "${1:-all}" in
    phase2)
        run_phase2
        ;;
    phase3)
        run_phase3
        ;;
    feedback)
        run_feedback
        ;;
    all)
        run_phase2
        run_phase3
        run_feedback
        echo "═══════════════════════════════════════════════════════════"
        echo "  전체 워크플로우 완료"
        echo "═══════════════════════════════════════════════════════════"
        ;;
    *)
        echo "사용법: $0 [phase2|phase3|feedback|all]"
        exit 1
        ;;
esac
