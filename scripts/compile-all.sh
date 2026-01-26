#!/bin/bash

# Typst → PDF 일괄 컴파일 스크립트
# 사용법: ./compile-all.sh

PROJECT_DIR="/Users/truestone/Dropbox/repo/mj/졸업프로젝트"
TYPST_DIR="$PROJECT_DIR/typst-output"
PDF_DIR="$PROJECT_DIR/pdf-output"
ERROR_LOG="$PROJECT_DIR/compile-errors.log"

# 출력 디렉토리 생성
mkdir -p "$PDF_DIR/research"
mkdir -p "$PDF_DIR/docs"
mkdir -p "$PDF_DIR/candidates"

# 에러 로그 초기화
echo "=== Typst 컴파일 오류 로그 ===" > "$ERROR_LOG"
echo "생성 시간: $(date)" >> "$ERROR_LOG"
echo "" >> "$ERROR_LOG"

echo "=== Typst → PDF 컴파일 시작 ==="

success_count=0
error_count=0

# 모든 .typ 파일 컴파일
find "$TYPST_DIR" -name "*.typ" | while read file; do
  rel_path="${file#$TYPST_DIR/}"
  dir_path=$(dirname "$rel_path")
  filename=$(basename "$file" .typ)

  mkdir -p "$PDF_DIR/$dir_path"
  output_pdf="$PDF_DIR/$dir_path/$filename.pdf"

  echo -n "  컴파일: $rel_path... "

  # 컴파일 실행 (에러 캡처)
  error_output=$(typst compile "$file" "$output_pdf" 2>&1)

  if [ $? -eq 0 ]; then
    echo "OK"
    ((success_count++))
  else
    echo "FAIL"
    ((error_count++))
    echo "--- $rel_path ---" >> "$ERROR_LOG"
    echo "$error_output" >> "$ERROR_LOG"
    echo "" >> "$ERROR_LOG"
  fi
done

echo ""
echo "=== 컴파일 완료 ==="
echo "PDF 출력 위치: $PDF_DIR"

# 결과 확인
pdf_count=$(find "$PDF_DIR" -name "*.pdf" 2>/dev/null | wc -l)
echo "생성된 PDF: $pdf_count개"

if [ -s "$ERROR_LOG" ]; then
  error_files=$(grep -c "^---" "$ERROR_LOG" 2>/dev/null || echo "0")
  if [ "$error_files" != "0" ]; then
    echo ""
    echo "오류 발생 파일: $error_files개"
    echo "오류 로그: $ERROR_LOG"
  fi
fi
