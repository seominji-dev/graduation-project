# Claude 사용 가능한 스킬 상세 가이드

이 문서는 Claude가 사용할 수 있는 모든 스킬에 대한 상세 기능 및 사용법을 정리한 가이드입니다.

---

## 목차

- [Claude 사용 가능한 스킬 상세 가이드](#claude-사용-가능한-스킬-상세-가이드)
  - [목차](#목차)
  - [1. 문서 작업 스킬](#1-문서-작업-스킬)
    - [1.1 docx - Word 문서](#11-docx---word-문서)
      - [주요 기능](#주요-기능)
      - [워크플로우](#워크플로우)
    - [1.2 pdf - PDF 문서](#12-pdf---pdf-문서)
      - [주요 기능](#주요-기능-1)
      - [코드 예시](#코드-예시)
    - [1.3 pptx - PowerPoint 프레젠테이션](#13-pptx---powerpoint-프레젠테이션)
      - [주요 기능](#주요-기능-2)
      - [워크플로우](#워크플로우-1)
      - [디자인 원칙](#디자인-원칙)
    - [1.4 xlsx - Excel 스프레드시트](#14-xlsx---excel-스프레드시트)
      - [주요 기능](#주요-기능-3)
      - [중요 원칙](#중요-원칙)
      - [금융 모델 표준](#금융-모델-표준)
      - [워크플로우](#워크플로우-2)
  - [2. 디자인 \& 비주얼 스킬](#2-디자인--비주얼-스킬)
    - [2.1 canvas-design - 시각 디자인](#21-canvas-design---시각-디자인)
      - [주요 기능](#주요-기능-4)
      - [워크플로우](#워크플로우-3)
      - [철학 예시](#철학-예시)
    - [2.2 algorithmic-art - 알고리즘 아트](#22-algorithmic-art---알고리즘-아트)
      - [주요 기능](#주요-기능-5)
      - [워크플로우](#워크플로우-4)
    - [2.3 frontend-design - 프론트엔드 디자인](#23-frontend-design---프론트엔드-디자인)
      - [디자인 사고](#디자인-사고)
      - [핵심 가이드라인](#핵심-가이드라인)
      - [절대 피해야 할 것](#절대-피해야-할-것)
    - [2.4 brand-guidelines - 브랜드 가이드라인](#24-brand-guidelines---브랜드-가이드라인)
      - [색상 팔레트](#색상-팔레트)
      - [타이포그래피](#타이포그래피)
    - [2.5 theme-factory - 테마 팩토리](#25-theme-factory---테마-팩토리)
      - [사용 가능한 테마 (10개)](#사용-가능한-테마-10개)
      - [워크플로우](#워크플로우-5)
    - [2.6 slack-gif-creator - Slack GIF 생성기](#26-slack-gif-creator---slack-gif-생성기)
      - [Slack 요구사항](#slack-요구사항)
      - [코어 워크플로우](#코어-워크플로우)
      - [애니메이션 개념](#애니메이션-개념)
  - [3. 개발 \& 빌드 스킬](#3-개발--빌드-스킬)
    - [3.1 mcp-builder - MCP 서버 빌더](#31-mcp-builder---mcp-서버-빌더)
      - [MCP 서버 개발 프로세스](#mcp-서버-개발-프로세스)
      - [권장 스택](#권장-스택)
      - [도구 구현](#도구-구현)
    - [3.2 web-artifacts-builder - 웹 아티팩트 빌더](#32-web-artifacts-builder---웹-아티팩트-빌더)
      - [기술 스택](#기술-스택)
      - [워크플로우](#워크플로우-6)
      - [디자인 주의사항](#디자인-주의사항)
    - [3.3 webapp-testing - 웹앱 테스팅](#33-webapp-testing---웹앱-테스팅)
      - [접근 방식 결정 트리](#접근-방식-결정-트리)
      - [예시](#예시)
    - [3.4 skill-creator - 스킬 생성기](#34-skill-creator---스킬-생성기)
      - [스킬이란?](#스킬이란)
      - [스킬 구조](#스킬-구조)
      - [핵심 원칙](#핵심-원칙)
      - [생성 프로세스](#생성-프로세스)
  - [4. 문서화 \& 협업 스킬](#4-문서화--협업-스킬)
    - [4.1 doc-coauthoring - 문서 공동작성](#41-doc-coauthoring---문서-공동작성)
      - [3단계 워크플로우](#3단계-워크플로우)
      - [트리거 조건](#트리거-조건)
    - [4.2 internal-comms - 내부 커뮤니케이션](#42-internal-comms---내부-커뮤니케이션)
      - [지원 유형](#지원-유형)
      - [워크플로우](#워크플로우-7)
  - [5. Notion 연동 스킬](#5-notion-연동-스킬)
    - [5.1 notion-research-documentation - 리서치 문서화](#51-notion-research-documentation---리서치-문서화)
      - [워크플로우](#워크플로우-8)
      - [출력 형식](#출력-형식)
      - [모범 사례](#모범-사례)
    - [5.2 notion-knowledge-capture - 지식 캡처](#52-notion-knowledge-capture---지식-캡처)
      - [캡처할 콘텐츠 유형](#캡처할-콘텐츠-유형)
      - [콘텐츠 유형별 구조](#콘텐츠-유형별-구조)
      - [워크플로우](#워크플로우-9)
    - [5.3 notion-spec-to-implementation - 스펙 구현](#53-notion-spec-to-implementation---스펙-구현)
      - [워크플로우](#워크플로우-10)
      - [스펙 분석 패턴](#스펙-분석-패턴)
      - [구현 계획 구조](#구현-계획-구조)
      - [진행 상황 로깅](#진행-상황-로깅)
  - [부록: 스킬 요약 테이블](#부록-스킬-요약-테이블)

---

## 1. 문서 작업 스킬

### 1.1 docx - Word 문서

**설명**: Word 문서(.docx) 생성, 편집, 분석을 위한 종합 툴킷

#### 주요 기능

| 기능 | 설명 |
|------|------|
| 텍스트 추출 | pandoc을 사용한 마크다운 변환 |
| 새 문서 생성 | docx-js (JavaScript/TypeScript) 사용 |
| 기존 문서 편집 | Python Document 라이브러리 사용 |
| 변경 추적 (Redlining) | 전문적인 문서 검토 기능 |
| 이미지 변환 | 문서를 PDF → JPEG/PNG로 변환 |

#### 워크플로우

**1. 텍스트 읽기/분석**
```bash
# 마크다운으로 변환 (변경 추적 포함)
pandoc --track-changes=all path-to-file.docx -o output.md
```

**2. 새 문서 생성**
- docx-js.md 파일의 전체 내용 읽기 (필수)
- JavaScript/TypeScript 파일 생성
- Packer.toBuffer()로 .docx 내보내기

**3. 기존 문서 편집**
```bash
# 문서 언팩
python ooxml/scripts/unpack.py <office_file> <output_directory>

# Python 스크립트로 편집 후 재팩
python ooxml/scripts/pack.py <input_directory> <office_file>
```

**4. Redlining 워크플로우**
- 마크다운 표현 획득
- 변경사항 식별 및 그룹화 (배치당 3-10개)
- 문서 언팩 후 수정
- 최종 검증

---

### 1.2 pdf - PDF 문서

**설명**: PDF 추출, 생성, 병합/분할, 폼 처리를 위한 종합 툴킷

#### 주요 기능

| 기능 | 라이브러리 | 명령/코드 |
|------|-----------|----------|
| PDF 병합 | pypdf | `writer.add_page(page)` |
| PDF 분할 | pypdf | 페이지별 파일 생성 |
| 텍스트 추출 | pdfplumber | `page.extract_text()` |
| 테이블 추출 | pdfplumber | `page.extract_tables()` |
| PDF 생성 | reportlab | Canvas 또는 Platypus |
| 명령줄 병합 | qpdf | `qpdf --empty --pages ...` |
| 스캔 PDF OCR | pytesseract | 이미지 변환 후 처리 |

#### 코드 예시

**PDF 읽기 및 텍스트 추출**
```python
from pypdf import PdfReader

reader = PdfReader("document.pdf")
print(f"Pages: {len(reader.pages)}")

text = ""
for page in reader.pages:
    text += page.extract_text()
```

**PDF 병합**
```python
from pypdf import PdfWriter, PdfReader

writer = PdfWriter()
for pdf_file in ["doc1.pdf", "doc2.pdf", "doc3.pdf"]:
    reader = PdfReader(pdf_file)
    for page in reader.pages:
        writer.add_page(page)

with open("merged.pdf", "wb") as output:
    writer.write(output)
```

**테이블 추출**
```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            print(table)
```

---

### 1.3 pptx - PowerPoint 프레젠테이션

**설명**: PowerPoint 프레젠테이션(.pptx) 생성, 편집, 분석을 위한 종합 툴킷

#### 주요 기능

| 기능 | 설명 |
|------|------|
| 텍스트 추출 | markitdown으로 마크다운 변환 |
| 새 프레젠테이션 생성 | html2pptx 워크플로우 |
| 기존 프레젠테이션 편집 | OOXML 직접 편집 |
| 템플릿 기반 생성 | 템플릿 슬라이드 복제 및 재배열 |
| 썸네일 생성 | 슬라이드 시각적 분석용 |

#### 워크플로우

**1. 새 프레젠테이션 생성 (템플릿 없이)**
```bash
# 1. html2pptx.md 파일 전체 읽기 (필수)
# 2. 각 슬라이드용 HTML 파일 생성 (720pt × 405pt for 16:9)
# 3. html2pptx.js 라이브러리로 변환
# 4. 썸네일로 시각적 검증
python scripts/thumbnail.py output.pptx workspace/thumbnails --cols 4
```

**2. 기존 프레젠테이션 편집**
```bash
# 언팩
python ooxml/scripts/unpack.py <office_file> <output_dir>

# XML 파일 편집 (ppt/slides/slide{N}.xml)

# 검증
python ooxml/scripts/validate.py <dir> --original <file>

# 재팩
python ooxml/scripts/pack.py <input_directory> <office_file>
```

**3. 템플릿 사용**
```bash
# 텍스트 추출 및 썸네일 생성
python -m markitdown template.pptx > template-content.md
python scripts/thumbnail.py template.pptx

# 슬라이드 재배열
python scripts/rearrange.py template.pptx working.pptx 0,34,34,50,52

# 텍스트 인벤토리 추출
python scripts/inventory.py working.pptx text-inventory.json

# 텍스트 교체
python scripts/replace.py working.pptx replacement-text.json output.pptx
```

#### 디자인 원칙

- 콘텐츠에 맞는 색상 팔레트 선택
- 웹 안전 폰트 사용 (Arial, Helvetica, Georgia 등)
- 명확한 시각적 계층 구조
- 가독성 확보 (강한 대비, 적절한 크기)

---

### 1.4 xlsx - Excel 스프레드시트

**설명**: 스프레드시트(.xlsx, .csv 등) 생성, 편집, 분석을 위한 종합 툴킷

#### 주요 기능

| 기능 | 라이브러리 | 용도 |
|------|-----------|------|
| 데이터 분석 | pandas | 대량 데이터 처리, 시각화 |
| 수식/서식 | openpyxl | 복잡한 포맷팅, Excel 기능 |
| 수식 재계산 | recalc.py | LibreOffice 기반 재계산 |

#### 중요 원칙

**수식 사용 (Python 계산값 하드코딩 금지)**
```python
# ❌ 잘못된 방법 - 하드코딩
total = df['Sales'].sum()
sheet['B10'] = total  # 5000으로 하드코딩됨

# ✅ 올바른 방법 - Excel 수식 사용
sheet['B10'] = '=SUM(B2:B9)'
```

#### 금융 모델 표준

| 텍스트 색상 | 의미 |
|------------|------|
| 파란색 (0,0,255) | 하드코딩된 입력값 |
| 검은색 (0,0,0) | 모든 수식 및 계산 |
| 초록색 (0,128,0) | 다른 워크시트 참조 |
| 빨간색 (255,0,0) | 외부 파일 링크 |
| 노란색 배경 | 주요 가정/업데이트 필요 셀 |

#### 워크플로우

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill

wb = Workbook()
sheet = wb.active

# 데이터 추가
sheet['A1'] = 'Revenue'
sheet['B1'] = 1000000

# 수식 추가
sheet['B2'] = '=SUM(A1:A10)'

# 서식 적용
sheet['A1'].font = Font(bold=True, color='0000FF')

wb.save('output.xlsx')
```

```bash
# 수식 재계산 (필수)
python recalc.py output.xlsx
```

---

## 2. 디자인 & 비주얼 스킬

### 2.1 canvas-design - 시각 디자인

**설명**: .png 및 .pdf 형식의 시각적 아트 생성

#### 주요 기능

- 디자인 철학 생성 (.md 파일)
- 캔버스에 표현 (.pdf 또는 .png 파일)
- 멀티 페이지 옵션

#### 워크플로우

**1단계: 디자인 철학 생성**
- 무브먼트 이름 지정 (1-2 단어): "Brutalist Joy", "Chromatic Silence"
- 철학 명시 (4-6 단락)
  - 공간과 형태
  - 색상과 재질
  - 스케일과 리듬
  - 구성과 균형
  - 시각적 계층

**2단계: 캔버스 생성**
- 디자인 철학을 기반으로 한 페이지 고품질 디자인 생성
- 반복 패턴과 완벽한 형태 사용
- 텍스트는 최소화하고 시각적 요소로 활용
- 장인 정신 강조: 수없이 많은 시간을 들인 것처럼 보이는 작품

#### 철학 예시

**"Concrete Poetry"**
- 기념비적 형태와 대담한 기하학을 통한 커뮤니케이션
- 거대한 색상 블록, 조각적 타이포그래피
- 브루탈리스트 공간 분할

---

### 2.2 algorithmic-art - 알고리즘 아트

**설명**: p5.js를 사용한 제너러티브 아트 생성

#### 주요 기능

- 알고리즘 철학 생성
- p5.js 기반 인터랙티브 HTML 아티팩트 생성
- 시드 기반 랜덤성으로 재현 가능한 변형

#### 워크플로우

**1단계: 알고리즘 철학 생성**
```markdown
**"Organic Turbulence"**
철학: 자연 법칙에 의해 제약된 혼돈, 무질서에서 나타나는 질서
알고리즘 표현: 레이어드 펄린 노이즈에 의해 구동되는 플로우 필드...
```

**2단계: p5.js 구현**
```javascript
// 시드 기반 랜덤성 (Art Blocks 패턴)
let seed = 12345;
randomSeed(seed);
noiseSeed(seed);

let params = {
  seed: 12345,
  // 알고리즘에 필요한 파라미터
};
```

**3단계: 인터랙티브 아티팩트 생성**
- 템플릿 `templates/viewer.html` 기반
- 시드 네비게이션 (이전/다음/랜덤)
- 파라미터 컨트롤 (슬라이더/입력)
- 단일 HTML 파일로 완전 자체 포함

---

### 2.3 frontend-design - 프론트엔드 디자인

**설명**: 고품질 프론트엔드 인터페이스 생성

#### 디자인 사고

- **목적**: 이 인터페이스가 해결하는 문제는?
- **톤**: 극단적 선택 - 미니멀, 맥시멀리스트, 레트로-퓨처리스틱, 유기적/자연적 등
- **차별화**: 무엇이 이것을 잊을 수 없게 만드는가?

#### 핵심 가이드라인

| 요소 | 가이드라인 |
|------|-----------|
| 타이포그래피 | Arial, Inter 같은 일반적인 폰트 피하기, 독특한 선택 |
| 색상 | CSS 변수 사용, 강한 액센트 컬러 |
| 모션 | CSS 애니메이션, animation-delay로 시차 효과 |
| 공간 구성 | 비대칭, 오버랩, 대각선 흐름 |
| 배경 | 그라디언트 메시, 노이즈 텍스처, 기하학적 패턴 |

#### 절대 피해야 할 것

- 과도하게 사용된 폰트 (Inter, Roboto, Arial)
- 클리셰 색상 (특히 흰색 배경 위 보라색 그라디언트)
- 예측 가능한 레이아웃과 컴포넌트 패턴

---

### 2.4 brand-guidelines - 브랜드 가이드라인

**설명**: Anthropic 공식 브랜드 색상 및 타이포그래피 적용

#### 색상 팔레트

**메인 색상**
| 색상 | 헥스 코드 | 용도 |
|------|----------|------|
| Dark | #141413 | 기본 텍스트, 어두운 배경 |
| Light | #faf9f5 | 밝은 배경, 어두운 배경 위 텍스트 |
| Mid Gray | #b0aea5 | 보조 요소 |
| Light Gray | #e8e6dc | 미묘한 배경 |

**액센트 색상**
| 색상 | 헥스 코드 | 용도 |
|------|----------|------|
| Orange | #d97757 | 기본 액센트 |
| Blue | #6a9bcc | 보조 액센트 |
| Green | #788c5d | 3차 액센트 |

#### 타이포그래피

- **헤딩**: Poppins (Arial 폴백)
- **본문**: Lora (Georgia 폴백)

---

### 2.5 theme-factory - 테마 팩토리

**설명**: 아티팩트에 테마 스타일 적용

#### 사용 가능한 테마 (10개)

1. **Ocean Depths** - 전문적이고 차분한 해양 테마
2. **Sunset Boulevard** - 따뜻하고 생기있는 일몰 색상
3. **Forest Canopy** - 자연스럽고 안정된 어스 톤
4. **Modern Minimalist** - 깔끔하고 현대적인 그레이스케일
5. **Golden Hour** - 풍부하고 따뜻한 가을 팔레트
6. **Arctic Frost** - 시원하고 선명한 겨울 테마
7. **Desert Rose** - 부드럽고 세련된 더스티 톤
8. **Tech Innovation** - 대담하고 현대적인 테크 미학
9. **Botanical Garden** - 신선하고 유기적인 정원 색상
10. **Midnight Galaxy** - 극적이고 우주적인 깊은 톤

#### 워크플로우

1. `theme-showcase.pdf` 보여주기
2. 테마 선택 요청
3. 선택 확인 대기
4. 선택된 테마 적용

---

### 2.6 slack-gif-creator - Slack GIF 생성기

**설명**: Slack 최적화 애니메이션 GIF 생성

#### Slack 요구사항

| 유형 | 크기 | 설정 |
|------|------|------|
| 이모지 GIF | 128x128 (권장) | FPS: 10-30, 색상: 48-128, 지속: 3초 미만 |
| 메시지 GIF | 480x480 | - |

#### 코어 워크플로우

```python
from core.gif_builder import GIFBuilder
from PIL import Image, ImageDraw

# 1. 빌더 생성
builder = GIFBuilder(width=128, height=128, fps=10)

# 2. 프레임 생성
for i in range(12):
    frame = Image.new('RGB', (128, 128), (240, 248, 255))
    draw = ImageDraw.Draw(frame)
    # PIL 프리미티브로 애니메이션 그리기
    builder.add_frame(frame)

# 3. 최적화하여 저장
builder.save('output.gif', num_colors=48, optimize_for_emoji=True)
```

#### 애니메이션 개념

| 효과 | 구현 방법 |
|------|----------|
| 흔들기/진동 | `math.sin()` 또는 `math.cos()`로 위치 오프셋 |
| 펄스/심장박동 | 사인파로 크기 리드미컬하게 조절 |
| 바운스 | `interpolate()`에 `easing='bounce_out'` 사용 |
| 스핀/회전 | `image.rotate(angle)` 사용 |
| 페이드 인/아웃 | RGBA 이미지 생성, 알파 채널 조절 |
| 슬라이드 | 화면 밖에서 목표 위치로 이동 |

---

## 3. 개발 & 빌드 스킬

### 3.1 mcp-builder - MCP 서버 빌더

**설명**: LLM과 외부 서비스 연동을 위한 MCP 서버 생성 가이드

#### MCP 서버 개발 프로세스

**Phase 1: 리서치 및 계획**
- MCP 프로토콜 문서 학습
- 프레임워크 문서 로드 (TypeScript 권장)
- API 이해 및 도구 선택

**Phase 2: 구현**
- 프로젝트 구조 설정
- 공유 유틸리티 생성 (API 클라이언트, 에러 핸들링)
- 도구 구현

**Phase 3: 리뷰 및 테스트**
- 코드 품질 검토
- 빌드 및 테스트

**Phase 4: 평가 생성**
- 10개의 평가 질문 생성

#### 권장 스택

| 항목 | 권장 |
|------|------|
| 언어 | TypeScript |
| 전송 | 원격 서버: Streamable HTTP, 로컬 서버: stdio |

#### 도구 구현

```typescript
// 입력 스키마: Zod 사용
// 출력 스키마: 가능한 경우 정의
// 도구 설명: 기능 요약, 파라미터 설명, 반환 타입

// 어노테이션
{
  readOnlyHint: true/false,
  destructiveHint: true/false,
  idempotentHint: true/false,
  openWorldHint: true/false
}
```

---

### 3.2 web-artifacts-builder - 웹 아티팩트 빌더

**설명**: React + Tailwind + shadcn/ui를 사용한 복잡한 HTML 아티팩트 생성

#### 기술 스택

- React 18 + TypeScript
- Vite + Parcel (번들링)
- Tailwind CSS
- shadcn/ui (40+ 컴포넌트)

#### 워크플로우

**1단계: 프로젝트 초기화**
```bash
bash scripts/init-artifact.sh <project-name>
cd <project-name>
```

**2단계: 개발**
- 생성된 파일 편집

**3단계: 단일 HTML로 번들**
```bash
bash scripts/bundle-artifact.sh
# bundle.html 생성 - 모든 JS, CSS, 의존성 인라인화
```

**4단계: 사용자에게 공유**

#### 디자인 주의사항

"AI slop" 피하기:
- 과도한 중앙 정렬 레이아웃 ❌
- 보라색 그라디언트 ❌
- 균일한 둥근 모서리 ❌
- Inter 폰트 ❌

---

### 3.3 webapp-testing - 웹앱 테스팅

**설명**: Playwright를 사용한 로컬 웹 앱 테스트

#### 접근 방식 결정 트리

```
사용자 작업 → 정적 HTML인가?
    ├─ 예 → HTML 파일 직접 읽어 셀렉터 식별
    │        → Playwright 스크립트 작성
    │
    └─ 아니오 (동적 웹앱) → 서버가 이미 실행 중인가?
        ├─ 아니오 → python scripts/with_server.py --help 실행
        │           → 헬퍼 + Playwright 스크립트 사용
        │
        └─ 예 → 정찰 후 액션:
            1. 네비게이트 및 networkidle 대기
            2. 스크린샷 또는 DOM 검사
            3. 렌더링된 상태에서 셀렉터 식별
            4. 발견된 셀렉터로 액션 실행
```

#### 예시

```bash
# 서버 시작 및 자동화 스크립트 실행
python scripts/with_server.py --server "npm run dev" --port 5173 -- python your_automation.py
```

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')  # 필수: JS 실행 대기
    # ... 자동화 로직
    browser.close()
```

---

### 3.4 skill-creator - 스킬 생성기

**설명**: Claude 기능 확장을 위한 새로운 스킬 생성 가이드

#### 스킬이란?

Claude의 기능을 확장하는 모듈식, 자체 포함 패키지:
- 전문화된 워크플로우
- 도구 통합
- 도메인 전문성
- 번들 리소스

#### 스킬 구조

```
skill-name/
├── SKILL.md (필수)
│   ├── YAML frontmatter (name, description)
│   └── Markdown 지침
└── 번들 리소스 (선택)
    ├── scripts/          - 실행 가능한 코드
    ├── references/       - 문서
    └── assets/           - 출력에 사용되는 파일
```

#### 핵심 원칙

1. **간결함이 핵심**: Claude가 이미 알고 있는 것은 추가하지 않기
2. **적절한 자유도 설정**: 작업의 취약성과 가변성에 맞추기
3. **점진적 공개**: 메타데이터 → SKILL.md → 번들 리소스

#### 생성 프로세스

1. 구체적 예시로 스킬 이해
2. 재사용 가능한 콘텐츠 계획 (scripts, references, assets)
3. 스킬 초기화: `scripts/init_skill.py <skill-name> --path <output-directory>`
4. 스킬 편집
5. 스킬 패키징: `scripts/package_skill.py <path/to/skill-folder>`
6. 실제 사용 기반 반복

---

## 4. 문서화 & 협업 스킬

### 4.1 doc-coauthoring - 문서 공동작성

**설명**: 문서 공동 작성을 위한 구조화된 워크플로우 가이드

#### 3단계 워크플로우

**Stage 1: 컨텍스트 수집**
- 문서 유형, 대상 독자, 원하는 영향 파악
- 모든 관련 컨텍스트 덤프 요청
- 명확화 질문 (5-10개)

**Stage 2: 구조화 및 개선**
1. 각 섹션에 대해:
   - 포함할 내용 명확화 질문
   - 5-20개 옵션 브레인스토밍
   - 사용자가 유지/제거/결합 표시
   - 섹션 초안 작성
   - 반복적 개선

**Stage 3: 독자 테스트**
- 예상 독자 질문 생성 (5-10개)
- 새로운 Claude 인스턴스로 테스트
- 문제점 수정

#### 트리거 조건

- "문서 작성", "제안서 초안", "스펙 작성"
- "PRD", "설계 문서", "결정 문서", "RFC"

---

### 4.2 internal-comms - 내부 커뮤니케이션

**설명**: 다양한 내부 커뮤니케이션 작성 가이드

#### 지원 유형

| 유형 | 가이드라인 파일 |
|------|----------------|
| 3P 업데이트 (Progress, Plans, Problems) | `examples/3p-updates.md` |
| 회사 뉴스레터 | `examples/company-newsletter.md` |
| FAQ 응답 | `examples/faq-answers.md` |
| 일반 커뮤니케이션 | `examples/general-comms.md` |

#### 워크플로우

1. 커뮤니케이션 유형 식별
2. 적절한 가이드라인 파일 로드
3. 해당 파일의 지침 따르기

---

## 5. Notion 연동 스킬

### 5.1 notion-research-documentation - 리서치 문서화

**설명**: Notion 워크스페이스 검색, 분석, 문서화

#### 워크플로우

1. **관련 콘텐츠 검색**: `Notion:notion-search`
2. **상세 정보 가져오기**: `Notion:notion-fetch`
3. **결과 종합**: 여러 소스에서 정보 분석 및 결합
4. **구조화된 출력 생성**: `Notion:notion-create-pages`

#### 출력 형식

- **리서치 요약**: `reference/research-summary-format.md`
- **종합 보고서**: `reference/comprehensive-report-format.md`
- **간단한 브리프**: `reference/quick-brief-format.md`

#### 모범 사례

1. 먼저 넓은 범위로 검색, 그 다음 좁히기
2. 출처 인용 (멘션으로 소스 페이지 링크)
3. 최신성 확인 (페이지 마지막 편집 날짜)
4. 교차 참조 (여러 소스에서 결과 검증)
5. 명확한 구조 (헤딩, 불릿, 포맷팅)

---

### 5.2 notion-knowledge-capture - 지식 캡처

**설명**: 대화와 논의를 Notion의 구조화된 문서로 변환

#### 캡처할 콘텐츠 유형

- 핵심 개념 및 정의
- 결정 사항 및 근거
- 방법/절차 정보
- 중요한 인사이트 또는 학습
- Q&A 쌍
- 예시 및 사용 사례

#### 콘텐츠 유형별 구조

| 유형 | 구조 |
|------|------|
| 개념 | 개요 → 정의 → 특성 → 예시 → 사용 사례 → 관련 |
| 방법 | 개요 → 전제조건 → 단계 → 검증 → 문제해결 → 관련 |
| 결정 | 컨텍스트 → 결정 → 근거 → 고려된 옵션 → 결과 → 구현 |
| FAQ | 짧은 답변 → 상세 설명 → 예시 → 사용 시기 → 관련 질문 |
| 학습 | 발생한 일 → 잘된 점 → 안된 점 → 근본 원인 → 학습 → 조치 |

#### 워크플로우

1. 대화 컨텍스트에서 콘텐츠 추출
2. 콘텐츠 유형 결정
3. 적절한 구조로 포맷팅
4. 저장 위치 결정 (위키, 프로젝트 페이지, 데이터베이스 등)
5. 페이지 생성: `Notion:notion-create-pages`
6. 콘텐츠 발견 가능하게 만들기 (허브/인덱스 페이지 업데이트)

---

### 5.3 notion-spec-to-implementation - 스펙 구현

**설명**: 스펙을 구체적인 구현 태스크로 변환

#### 워크플로우

1. **스펙 찾기**: `Notion:notion-search`
2. **스펙 가져오기**: `Notion:notion-fetch`로 요구사항 추출
3. **구현 계획 생성**: `Notion:notion-create-pages`
4. **태스크 데이터베이스 찾기**: `Notion:notion-search`
5. **태스크 생성**: `Notion:notion-create-pages`
6. **진행 상황 추적**: `Notion:notion-update-page`

#### 스펙 분석 패턴

| 유형 | 항목 |
|------|------|
| 기능 요구사항 | 사용자 스토리, 기능 설명, 워크플로우, 데이터 요구사항, 통합 포인트 |
| 비기능 요구사항 | 성능 목표, 보안 요구사항, 확장성, 가용성, 규정 준수 |
| 수용 기준 | 테스트 가능한 조건, 성능 벤치마크, 완료 정의 |

#### 구현 계획 구조

- 개요
- 연결된 스펙
- 요구사항 요약
- 기술 접근 방식
- 구현 단계 (목표, 태스크 체크리스트, 예상 노력)
- 의존성
- 위험 및 완화
- 타임라인
- 성공 기준

#### 진행 상황 로깅

| 유형 | 빈도 | 내용 |
|------|------|------|
| 일일 업데이트 | 활발한 작업 시 | 완료 항목, 현재 포커스, 차단 요소 |
| 마일스톤 업데이트 | 주요 진행 시 | 계획 체크박스 업데이트, 마일스톤 요약, 타임라인 조정 |
| 상태 변경 | 태스크 전환 시 | 속성 업데이트, 완료 노트, 산출물 링크 |

---

## 부록: 스킬 요약 테이블

| 카테고리 | 스킬 | 주요 용도 |
|----------|------|----------|
| 문서 작업 | docx | Word 문서 생성/편집/분석 |
| 문서 작업 | pdf | PDF 추출/생성/병합/분할/폼 |
| 문서 작업 | pptx | PowerPoint 생성/편집 |
| 문서 작업 | xlsx | Excel 생성/편집/수식/분석 |
| 디자인 | canvas-design | 시각적 아트 (.png, .pdf) |
| 디자인 | algorithmic-art | p5.js 제너러티브 아트 |
| 디자인 | frontend-design | 고품질 웹 UI |
| 디자인 | brand-guidelines | Anthropic 브랜드 스타일 |
| 디자인 | theme-factory | 아티팩트 테마 적용 |
| 디자인 | slack-gif-creator | Slack용 GIF |
| 개발 | mcp-builder | MCP 서버 생성 |
| 개발 | web-artifacts-builder | React+Tailwind+shadcn/ui 아티팩트 |
| 개발 | webapp-testing | Playwright 웹앱 테스트 |
| 개발 | skill-creator | 새 스킬 생성 |
| 문서화 | doc-coauthoring | 문서 공동 작성 워크플로우 |
| 문서화 | internal-comms | 내부 커뮤니케이션 |
| Notion | notion-research-documentation | Notion 리서치 문서화 |
| Notion | notion-knowledge-capture | 대화를 Notion 문서로 |
| Notion | notion-spec-to-implementation | 스펙을 태스크로 변환 |

---

*이 문서는 2026년 1월 8일 기준으로 작성되었습니다.*
