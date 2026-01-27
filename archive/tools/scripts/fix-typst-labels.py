#!/usr/bin/env python3
"""
Typst 라벨 수정 스크립트

문제:
1. TOC 링크의 라벨과 헤딩 라벨 불일치 (예: <1-프로젝트-개요> vs <프로젝트-개요>)
2. 외부 URL 이미지 (Typst는 URL에서 직접 이미지 로드 불가)

수정:
1. 헤딩에 번호가 포함된 라벨 추가
2. 외부 이미지 URL을 텍스트 링크로 변환
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple, Dict


def fix_image_urls(content: str) -> str:
    """외부 이미지 URL을 텍스트 배지로 변환"""
    
    # shields.io 배지를 텍스트로 변환
    # 패턴: #link("URL")[#box(image("badge_url"))]
    
    # MIT License 배지
    content = re.sub(
        r'#link\("https://opensource\.org/licenses/MIT"\)\[#box\(image\("[^"]+"\)\)\]',
        r'#strong[MIT License]',
        content
    )
    
    # Node.js 배지
    content = re.sub(
        r'#link\("https://nodejs\.org"\)\[#box\(image\("[^"]+"\)\)\]',
        r'#strong[Node.js >= 20.0.0]',
        content
    )
    
    # TypeScript 배지
    content = re.sub(
        r'#link\("https://www\.typescriptlang\.org/"\)\[#box\(image\("[^"]+"\)\)\]',
        r'#strong[TypeScript 5.9]',
        content
    )
    
    # Coverage 배지
    content = re.sub(
        r'#link\("https://github\.com/[^"]+"\)\[#box\(image\("https://img\.shields\.io/badge/coverage[^"]+"\)\)\]',
        r'#strong[Coverage: 97.08%]',
        content
    )
    
    # Star on GitHub 배지
    content = re.sub(
        r'#link\("https://github\.com/[^"]+"\)\[#box\(image\("https://img\.shields\.io/badge/[^"]*Star[^"]*"\)\)\]',
        r'#link("https://github.com")[Star on GitHub]',
        content
    )
    
    # 일반 shields.io 배지
    content = re.sub(
        r'#box\(image\("https://img\.shields\.io/badge/([^"]+)"\)\)',
        r'[Badge: \1]',
        content
    )
    
    # 기타 외부 이미지 URL
    content = re.sub(
        r'#box\(image\("(https?://[^"]+)"\)\)',
        r'[External Image]',
        content
    )
    
    return content


def fix_toc_labels(content: str) -> str:
    """TOC 라벨과 헤딩 라벨을 일치시킴"""
    
    # TOC 라벨 추출
    toc_pattern = r'#link\(<([^>]+)>\)\[([^\]]+)\]'
    toc_matches = re.findall(toc_pattern, content)
    
    if not toc_matches:
        return content
    
    lines = content.split('\n')
    result_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # 레벨 2 헤딩: == 번호. 텍스트
        heading_match = re.match(r'^(==\s+)(\d+)\.\s+(.+)$', line)
        if heading_match:
            prefix = heading_match.group(1)
            section_num = heading_match.group(2)
            title = heading_match.group(3).strip()
            
            # TOC에서 해당 번호로 시작하는 라벨 찾기
            expected_label = None
            for toc_label, toc_text in toc_matches:
                if toc_label.startswith(f"{section_num}-"):
                    expected_label = toc_label
                    break
            
            result_lines.append(line)
            
            # 다음 줄이 라벨인지 확인
            if i + 1 < len(lines) and re.match(r'^<[^>]+>$', lines[i + 1].strip()):
                # 기존 라벨이 있으면 새 라벨로 교체
                if expected_label:
                    result_lines.append(f"<{expected_label}>")
                    i += 2
                    continue
                else:
                    # 라벨 유지
                    result_lines.append(lines[i + 1])
                    i += 2
                    continue
            else:
                # 라벨이 없으면 추가
                if expected_label:
                    result_lines.append(f"<{expected_label}>")
            
            i += 1
            continue
        
        result_lines.append(line)
        i += 1
    
    return '\n'.join(result_lines)


def process_typst_file(file_path: Path) -> Tuple[bool, int]:
    """단일 Typst 파일 처리"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
    except Exception as e:
        print(f"  오류: {file_path} 읽기 실패 - {e}")
        return False, 0
    
    content = original_content
    
    # 1. 이미지 URL 수정
    content = fix_image_urls(content)
    
    # 2. TOC 라벨 수정
    content = fix_toc_labels(content)
    
    if content != original_content:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            orig_lines = set(original_content.split('\n'))
            new_lines = set(content.split('\n'))
            changes = len(orig_lines.symmetric_difference(new_lines))
            
            return True, changes
        except Exception as e:
            print(f"  오류: {file_path} 쓰기 실패 - {e}")
            return False, 0
    
    return False, 0


def main():
    """메인 함수"""
    project_dir = Path("/Users/truestone/Dropbox/repo/mj/졸업프로젝트")
    typst_dir = project_dir / "typst-output"
    
    if not typst_dir.exists():
        print(f"오류: typst-output 디렉토리가 없습니다: {typst_dir}")
        sys.exit(1)
    
    print("=== Typst 라벨 수정 스크립트 ===")
    print(f"대상 디렉토리: {typst_dir}")
    print()
    
    typ_files = list(typst_dir.rglob("*.typ"))
    print(f"발견된 Typst 파일: {len(typ_files)}개")
    print()
    
    modified_files = []
    total_changes = 0
    
    for typ_file in typ_files:
        rel_path = typ_file.relative_to(typst_dir)
        modified, changes = process_typst_file(typ_file)
        
        if modified:
            modified_files.append(str(rel_path))
            total_changes += changes
            print(f"  수정됨: {rel_path} ({changes}줄 변경)")
    
    print()
    print("=== 수정 완료 ===")
    print(f"수정된 파일: {len(modified_files)}개")
    print(f"총 변경: {total_changes}개")
    
    if modified_files:
        print()
        print("수정된 파일 목록:")
        for f in modified_files:
            print(f"  - {f}")


if __name__ == "__main__":
    main()
