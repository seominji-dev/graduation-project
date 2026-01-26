#!/bin/bash

# LLM Scheduler Benchmark Runner
# Runs all 4 scheduler benchmarks and generates comparison report

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
RESULTS_DIR="$PROJECT_DIR/benchmark-results/$(date +%Y%m%d-%H%M%S)"
K6_DIR="$PROJECT_DIR/load-tests/k6"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "LLM Scheduler Benchmark Runner"
echo "======================================"
echo ""
echo "Results will be saved to: $RESULTS_DIR"
echo ""

# Create results directory
mkdir -p "$RESULTS_DIR"

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}Error: k6 is not installed${NC}"
    echo "Please install k6: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Check if API server is running
echo "Checking API server..."
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: API server may not be running${NC}"
    echo "Start the server with: npm run dev"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Schedulers to benchmark
SCHEDULERS=("fcfs" "priority" "mlfq" "wfq")

# Run benchmarks
for scheduler in "${SCHEDULERS[@]}"; do
    echo ""
    echo "======================================"
    echo "Benchmarking: ${scheduler^^} Scheduler"
    echo "======================================"

    local test_file="$K6_DIR/${scheduler}-bench.js"
    local output_file="$RESULTS_DIR/${scheduler}-results.json"

    if [ ! -f "$test_file" ]; then
        echo -e "${RED}Error: Test file not found: $test_file${NC}"
        continue
    fi

    # Run k6 with JSON output
    if k6 run --out json="$output_file" "$test_file"; then
        echo -e "${GREEN}✓ ${scheduler^^} benchmark completed${NC}"
    else
        echo -e "${RED}✗ ${scheduler^^} benchmark failed${NC}"
    fi

    # Small pause between benchmarks
    sleep 2
done

# Generate comparison report
echo ""
echo "======================================"
echo "Generating Comparison Report"
echo "======================================"

cd "$PROJECT_DIR"
export RESULTS_DIR="$RESULTS_DIR"
export OUTPUT_DIR="$PROJECT_DIR/analysis"

if node scripts/analyze-results.js; then
    echo -e "${GREEN}✓ Report generated: $OUTPUT_DIR/Performance_Comparison_Report.md${NC}"
else
    echo -e "${RED}✗ Report generation failed${NC}"
    exit 1
fi

# Summary
echo ""
echo "======================================"
echo "Benchmark Complete"
echo "======================================"
echo ""
echo "Results directory: $RESULTS_DIR"
echo "Comparison report: $OUTPUT_DIR/Performance_Comparison_Report.md"
echo ""
