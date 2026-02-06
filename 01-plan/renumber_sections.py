
import os

file_path = '/Users/truestone/Dropbox/repo/mj/졸업프로젝트/01-plan/수강신청서-내용.md'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "## 1. 기본 정보": "## 기본 정보",
    "## 2. 프로젝트 제목": "## 1. 프로젝트 제목",
    "## 3. 프로젝트 개요": "## 2. 프로젝트 개요",
    "### 3.1": "### 2.1",
    "### 3.2": "### 2.2",
    "### 3.3": "### 2.3",
    "## 4. 목표 및 기대효과": "## 3. 목표 및 기대효과",
    "### 4.1": "### 3.1",
    "### 4.2": "### 3.2",
    "## 5. 기술 스택": "## 4. 기술 스택",
    "## 6. 개발 일정": "## 5. 개발 일정",
    "## 7. 시스템 구조": "## 6. 시스템 구조",
    "## 8. 연구 질문 및 예상 성과": "## 7. 연구 질문 및 예상 성과",
    "## 9. 위험 요소 및 대응": "## 8. 위험 요소 및 대응",
    "## 10. AI 활용 및 연구 윤리 준수": "## 9. AI 활용 및 연구 윤리 준수"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully renumbered sections.")
