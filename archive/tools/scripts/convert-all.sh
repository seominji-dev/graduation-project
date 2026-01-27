#!/bin/bash

# MD → Typst 일괄 변환 스크립트
# 사용법: ./convert-all.sh

PROJECT_DIR="/Users/truestone/Dropbox/repo/mj/졸업프로젝트"
OUTPUT_DIR="$PROJECT_DIR/typst-output"

# 출력 디렉토리 생성
mkdir -p "$OUTPUT_DIR/research"
mkdir -p "$OUTPUT_DIR/docs"
mkdir -p "$OUTPUT_DIR/candidates"

echo "=== MD → Typst 변환 시작 ==="

# research/ 디렉토리 변환
echo "[1/3] research/ 디렉토리 변환 중..."
for file in "$PROJECT_DIR/research"/*.md; do
  if [ -f "$file" ]; then
    filename=$(basename "$file" .md)
    echo "  변환: $filename.md → $filename.typ"
    pandoc "$file" -o "$OUTPUT_DIR/research/$filename.typ" 2>/dev/null
  fi
done

# docs/ 디렉토리 변환
echo "[2/3] docs/ 디렉토리 변환 중..."
for file in "$PROJECT_DIR/docs"/*.md; do
  if [ -f "$file" ]; then
    filename=$(basename "$file" .md)
    echo "  변환: $filename.md → $filename.typ"
    pandoc "$file" -o "$OUTPUT_DIR/docs/$filename.typ" 2>/dev/null
  fi
done

# candidates/ 디렉토리 변환 (node_modules 제외)
echo "[3/3] candidates/ 디렉토리 변환 중..."
find "$PROJECT_DIR/candidates" -name "*.md" -not -path "*/node_modules/*" | while read file; do
  rel_path="${file#$PROJECT_DIR/candidates/}"
  dir_path=$(dirname "$rel_path")
  filename=$(basename "$file" .md)

  mkdir -p "$OUTPUT_DIR/candidates/$dir_path"
  echo "  변환: $rel_path → $filename.typ"
  pandoc "$file" -o "$OUTPUT_DIR/candidates/$dir_path/$filename.typ" 2>/dev/null
done

echo ""
echo "=== 변환 완료 ==="
echo "출력 위치: $OUTPUT_DIR"

# 변환된 파일 수 카운트
typ_count=$(find "$OUTPUT_DIR" -name "*.typ" | wc -l)
echo "총 변환된 파일: $typ_count개"
