/**
 * Graduation Project Presentation Generator
 * Title: 스케줄링 알고리즘을 활용한 다중 사용자 LLM API 요청 관리 시스템
 * Author: 서민지, 홍익대학교 컴퓨터공학과 4학년
 *
 * Usage: node generate-presentation.js
 * Output: presentation.pptx
 */

const PptxGenJS = require('pptxgenjs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'presentation.pptx');

// ── Color palette (Hongik University brand: navy #003478 primary, red #C41230 accent) ──
const C = {
  primary:   '003478',   // Hongik navy
  secondary: '64748B',   // gray
  accent:    '059669',   // green
  warning:   'D97706',   // orange/amber
  light:     'F1F5F9',   // light gray background
  white:     'FFFFFF',
  black:     '1E293B',
  border:    'CBD5E1',
  danger:    'C41230',   // Hongik red
  lightBlue: 'EAF1FB',   // very light navy tint
  lightGray: 'F8FAFC',
};

const FONT = '맑은 고딕';

// ── Slide size: standard 10" x 7.5" ──────────────────────────────────────────
const W = 10;   // slide width inches
const H = 7.5;  // slide height inches

// ── Helper: add header bar with title ────────────────────────────────────────
function addHeader(slide, title) {
  // Blue top bar
  slide.addShape('rect', {
    x: 0, y: 0, w: W, h: 0.9,
    fill: { color: C.primary },
    line: { color: C.primary },
  });
  // Slide title text
  slide.addText(title, {
    x: 0.3, y: 0.08, w: W - 0.6, h: 0.74,
    fontSize: 26, fontFace: FONT, bold: true, color: C.white,
    valign: 'middle',
  });
}

// ── Helper: add slide number (bottom right) ───────────────────────────────────
function addSlideNumber(slide, num, total) {
  slide.addText(`${num} / ${total}`, {
    x: W - 1.2, y: H - 0.4, w: 1.0, h: 0.3,
    fontSize: 11, fontFace: FONT, color: C.secondary, align: 'right',
  });
}

// ── Helper: add footer line ───────────────────────────────────────────────────
function addFooter(slide) {
  slide.addShape('line', {
    x: 0.3, y: H - 0.5, w: W - 0.6, h: 0,
    line: { color: C.border, width: 1 },
  });
  slide.addText('홍익대학교 컴퓨터공학과 | 서민지', {
    x: 0.3, y: H - 0.42, w: 5, h: 0.3,
    fontSize: 11, fontFace: FONT, color: C.secondary,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 1: Title
// ─────────────────────────────────────────────────────────────────────────────
function createSlide1(pptx) {
  const slide = pptx.addSlide();

  // Full blue background header area
  slide.addShape('rect', {
    x: 0, y: 0, w: W, h: 3.5,
    fill: { color: C.primary },
    line: { color: C.primary },
  });

  // Korean title
  slide.addText('스케줄링 알고리즘을 활용한\n다중 사용자 LLM API 요청 관리 시스템', {
    x: 0.5, y: 0.5, w: W - 1, h: 2.2,
    fontSize: 28, fontFace: FONT, bold: true, color: C.white,
    align: 'center', valign: 'middle',
  });

  // English subtitle
  slide.addText('Multi-User LLM API Request Management System\nUsing Scheduling Algorithms', {
    x: 0.5, y: 2.55, w: W - 1, h: 0.8,
    fontSize: 15, fontFace: FONT, color: 'BFD7FF',
    align: 'center', valign: 'middle', italic: true,
  });

  // Info box background
  slide.addShape('rect', {
    x: 2.0, y: 3.9, w: 6.0, h: 2.8,
    fill: { color: C.lightBlue },
    line: { color: C.border, width: 1 },
    rectRadius: 0.1,
  });

  // Author / affiliation / professor / date
  const infoLines = [
    { label: '발표자', value: '서민지' },
    { label: '소속',   value: '홍익대학교 컴퓨터공학과 4학년' },
    { label: '지도교수', value: '이장호 교수님' },
    { label: '발표일',  value: '2026년 5월' },
  ];
  infoLines.forEach((item, i) => {
    const y = 4.1 + i * 0.56;
    slide.addText(item.label, {
      x: 2.4, y, w: 1.4, h: 0.46,
      fontSize: 15, fontFace: FONT, bold: true, color: C.primary,
    });
    slide.addText(item.value, {
      x: 3.9, y, w: 3.8, h: 0.46,
      fontSize: 15, fontFace: FONT, color: C.black,
    });
  });

  // Speaker note (dual-channel: presentation script + AI post-processing prompt)
  slide.addNotes(`안녕하세요. 저는 홍익대학교 컴퓨터공학과 4학년 서민지입니다. 오늘은 저의 졸업 프로젝트인 "스케줄링 알고리즘을 활용한 다중 사용자 LLM API 요청 관리 시스템"을 발표드리겠습니다. 발표는 약 12분, 실시간 데모가 약 3분으로 구성되어 있습니다.

(발표 시간: 약 30초)

---AI-PROMPT---
[글로벌 디자인 가이드 — 전체 발표에 적용]
- 테마 컬러: 홍익대 남색 #003478 (primary), 홍익대 빨강 #C41230 (강조/danger)
- 서브 컬러: 녹색 #059669 (positive), 주황 #D97706 (warning), 회색 #64748B (secondary)
- 폰트: 맑은 고딕 또는 나눔고딕 (제목 26pt, 본문 14~16pt, 캡션 11pt)
- 배경: 본문 슬라이드는 화이트 기반, 상단 남색 헤더 바(높이 0.9인치)
- 모든 박스는 rectRadius 0.08~0.1 (라운드 코너), 테두리 1~1.5pt
- 아이콘/화살표는 유니코드(→, ↓, ✓, ↑, ↓) 또는 PowerPoint 기본 도형 사용

[이 슬라이드 개선 지시]
- 표지는 상단 3.5인치 남색 배경 + 하단 정보 박스(연한 남색 배경)
- 제목 폰트 크기 28pt, 영문 부제 15pt italic
- 발표자/소속/지도교수/발표일 4행 정보 테이블 유지
- 추가 고려: 좌측 하단에 작은 홍익대 로고 플레이스홀더 (PowerPoint에서 수동 삽입 가능)
---END-PROMPT---`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 2: 목차
// ─────────────────────────────────────────────────────────────────────────────
function createSlide2(pptx, totalSlides) {
  const slide = pptx.addSlide();
  addHeader(slide, '목차');
  addFooter(slide);
  addSlideNumber(slide, 2, totalSlides);

  const items = [
    { num: '1', title: '연구 배경 및 목적', desc: '문제 정의 · 연구 질문' },
    { num: '2', title: '시스템 설계',       desc: '아키텍처 · 4계층 구조' },
    { num: '3', title: '구현',             desc: '4가지 스케줄링 알고리즘 · 등급 체계' },
    { num: '4', title: '실험 결과',         desc: '성능 비교 · MLFQ 선점형 · WFQ 차등 서비스' },
    { num: '5', title: '결론',             desc: '연구 요약 · 한계 · 향후 과제' },
  ];

  items.forEach((item, i) => {
    const y = 1.15 + i * 1.0;

    // Number circle
    slide.addShape('ellipse', {
      x: 0.6, y: y + 0.07, w: 0.52, h: 0.52,
      fill: { color: C.primary },
      line: { color: C.primary },
    });
    slide.addText(item.num, {
      x: 0.6, y: y + 0.07, w: 0.52, h: 0.52,
      fontSize: 18, fontFace: FONT, bold: true, color: C.white,
      align: 'center', valign: 'middle',
    });

    // Title
    slide.addText(item.title, {
      x: 1.35, y: y + 0.02, w: 5.5, h: 0.35,
      fontSize: 19, fontFace: FONT, bold: true, color: C.black,
    });
    // Description
    slide.addText(item.desc, {
      x: 1.38, y: y + 0.35, w: 5.5, h: 0.28,
      fontSize: 13, fontFace: FONT, color: C.secondary,
    });

    // Horizontal rule (except last)
    if (i < items.length - 1) {
      slide.addShape('line', {
        x: 0.6, y: y + 0.76, w: 8.8, h: 0,
        line: { color: C.border, width: 0.5 },
      });
    }
  });

  slide.addNotes(`오늘 발표는 크게 다섯 부분으로 구성됩니다. 먼저 연구 배경과 목적을 소개하고, 시스템 설계와 4가지 스케줄링 알고리즘 구현을 설명드립니다. 이어서 500건 규모의 시뮬레이션과 Ollama 실서버 실험 결과를 보여드리고, 마지막으로 결론과 한계를 정리하겠습니다. 실시간 데모는 결론 직전에 배치했습니다.

(발표 시간: 약 30초)

---AI-PROMPT---
[이 슬라이드 개선 지시]
- 5단계 번호 원(circle)의 색상을 일관되게 홍익 남색(#003478)으로 통일
- 각 항목의 제목(title)은 19pt bold, 부제(desc)는 13pt regular
- 항목 간 구분선을 연한 회색(#CBD5E1)으로 유지
- 번호 원에 부드러운 그림자(subtle shadow) 추가 고려
- 5번 항목은 결론이므로 빨강(#C41230) 강조 또는 테두리 처리 고려
---END-PROMPT---`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 3: 연구 배경
// ─────────────────────────────────────────────────────────────────────────────
function createSlide3(pptx, totalSlides) {
  const slide = pptx.addSlide();
  addHeader(slide, '연구 배경 및 목적');
  addFooter(slide);
  addSlideNumber(slide, 3, totalSlides);

  // Problem box (left)
  slide.addShape('rect', {
    x: 0.3, y: 1.1, w: 4.5, h: 2.5,
    fill: { color: C.lightBlue },
    line: { color: C.primary, width: 1.5 },
    rectRadius: 0.08,
  });
  slide.addText('문제 상황', {
    x: 0.5, y: 1.2, w: 4.1, h: 0.38,
    fontSize: 17, fontFace: FONT, bold: true, color: C.primary,
  });
  const problems = [
    '• LLM API 서비스 다중 사용자 동시 접속 급증',
    '• 요청 처리 순서·우선순위 기준 없음',
    '• 특정 사용자 독점 시 다른 사용자 대기 지연',
    '• 구독 등급별 차등 서비스 불가',
  ];
  slide.addText(problems.join('\n'), {
    x: 0.5, y: 1.62, w: 4.1, h: 1.9,
    fontSize: 14, fontFace: FONT, color: C.black,
    lineSpacingMultiple: 1.4,
  });

  // Arrow
  slide.addShape('line', {
    x: 4.95, y: 2.25, w: 0.6, h: 0,
    line: { color: C.primary, width: 2 },
  });
  slide.addText('→', {
    x: 4.9, y: 2.1, w: 0.7, h: 0.35,
    fontSize: 22, fontFace: FONT, color: C.primary, align: 'center',
  });

  // Solution box (right)
  slide.addShape('rect', {
    x: 5.6, y: 1.1, w: 4.1, h: 2.5,
    fill: { color: 'F0FDF4' },
    line: { color: C.accent, width: 1.5 },
    rectRadius: 0.08,
  });
  slide.addText('제안 접근법', {
    x: 5.8, y: 1.2, w: 3.7, h: 0.38,
    fontSize: 17, fontFace: FONT, bold: true, color: C.accent,
  });
  slide.addText('OS 스케줄링 알고리즘을\nLLM API 요청 관리에 적용', {
    x: 5.8, y: 1.62, w: 3.7, h: 0.8,
    fontSize: 14, fontFace: FONT, bold: true, color: C.black,
    lineSpacingMultiple: 1.4,
  });
  slide.addText('FCFS · Priority · MLFQ · WFQ\n4가지 알고리즘 구현 및 비교', {
    x: 5.8, y: 2.5, w: 3.7, h: 0.9,
    fontSize: 14, fontFace: FONT, color: C.black,
    lineSpacingMultiple: 1.4,
  });

  // Research questions
  slide.addText('연구 질문 (Research Questions)', {
    x: 0.3, y: 3.85, w: W - 0.6, h: 0.35,
    fontSize: 16, fontFace: FONT, bold: true, color: C.black,
  });

  const rqs = [
    { label: 'RQ1', text: 'OS 스케줄링 알고리즘을 LLM API 환경에 구현할 수 있는가?' },
    { label: 'RQ2', text: '알고리즘별 성능(대기시간)은 어떻게 다른가?' },
    { label: 'RQ3', text: '사용자 공정성(JFI)은 알고리즘별로 어떻게 차이나는가?' },
  ];
  rqs.forEach((rq, i) => {
    const y = 4.28 + i * 0.58;
    slide.addShape('rect', {
      x: 0.3, y: y, w: 1.1, h: 0.4,
      fill: { color: C.primary },
      line: { color: C.primary },
      rectRadius: 0.05,
    });
    slide.addText(rq.label, {
      x: 0.3, y: y, w: 1.1, h: 0.4,
      fontSize: 14, fontFace: FONT, bold: true, color: C.white, align: 'center', valign: 'middle',
    });
    slide.addText(rq.text, {
      x: 1.55, y: y + 0.02, w: W - 1.85, h: 0.38,
      fontSize: 14, fontFace: FONT, color: C.black,
    });
  });

  slide.addNotes(`ChatGPT와 같은 LLM API는 다중 사용자 동시 접속이 폭발적으로 늘어나고 있습니다. 그러나 요청 처리 순서 기준이 없어 구독 등급이 반영되지 않고, 특정 사용자 독점으로 대기 지연이 생기기 쉽습니다. 이 문제를 운영체제에서 오래 검증된 스케줄링 알고리즘으로 해결할 수 있는지 확인하고자 했습니다. 세 가지 연구 질문으로 정리했는데요, RQ1은 구현 가능성, RQ2는 성능 비교, RQ3은 공정성 측정입니다.

(발표 시간: 약 1분 30초)

---AI-PROMPT---
[이 슬라이드 개선 지시]
- 좌측 "문제 상황" 박스와 우측 "제안 접근법" 박스를 대조적으로 배치 유지
- 가운데 화살표(→)를 남색 굵은 화살표로 강조 (폭 2pt 이상)
- RQ 배지 3개의 색상을 차별화: RQ1 남색(#003478), RQ2 녹색(#059669), RQ3 빨강(#C41230)
- 하단 RQ 섹션 제목 "연구 질문" 위에 얇은 구분선(horizontal rule) 추가
- 우측 제안 접근법 박스의 "4가지 알고리즘" 문구는 굵게 처리하여 핵심 강조
---END-PROMPT---`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 4: 시스템 아키텍처
// ─────────────────────────────────────────────────────────────────────────────
function createSlide4(pptx, totalSlides) {
  const slide = pptx.addSlide();
  addHeader(slide, '시스템 아키텍처');
  addFooter(slide);
  addSlideNumber(slide, 4, totalSlides);

  // Four architecture layers (Rate Limiter is preprocessing step inside API layer)
  const layers = [
    { label: '클라이언트 계층',      sub: 'REST Client  ·  대시보드',                       color: C.primary,   y: 1.15 },
    { label: 'API 계층',            sub: 'Express.js  ·  Rate Limiter(전처리)  ·  요청 접수', color: C.accent,    y: 2.22 },
    { label: '스케줄러 계층',        sub: 'FCFS  ·  Priority  ·  MLFQ  ·  WFQ',            color: C.warning,   y: 3.29 },
    { label: '저장소 / LLM 계층',   sub: '메모리 큐  ·  JSON 파일 로그  ·  Ollama',          color: C.secondary, y: 4.36 },
  ];

  layers.forEach((layer, i) => {
    // Box
    slide.addShape('rect', {
      x: 1.2, y: layer.y, w: 6.4, h: 0.7,
      fill: { color: layer.color },
      line: { color: layer.color },
      rectRadius: 0.06,
    });
    // Label
    slide.addText(layer.label, {
      x: 1.4, y: layer.y + 0.03, w: 2.8, h: 0.35,
      fontSize: 15, fontFace: FONT, bold: true, color: C.white, valign: 'middle',
    });
    // Sub
    slide.addText(layer.sub, {
      x: 4.2, y: layer.y + 0.03, w: 3.2, h: 0.64,
      fontSize: 12, fontFace: FONT, color: C.white, valign: 'middle',
    });

    // Down arrow between layers
    if (i < layers.length - 1) {
      slide.addText('↓', {
        x: 4.5, y: layer.y + 0.7, w: 1.0, h: 0.18,
        fontSize: 14, fontFace: FONT, color: C.secondary, align: 'center',
      });
    }
  });

  // Side note
  slide.addShape('rect', {
    x: 7.85, y: 1.05, w: 1.9, h: 3.98,
    fill: { color: C.lightGray },
    line: { color: C.border, width: 1 },
    rectRadius: 0.06,
  });
  slide.addText('기술 스택', {
    x: 7.95, y: 1.12, w: 1.7, h: 0.3,
    fontSize: 12, fontFace: FONT, bold: true, color: C.primary,
  });
  const tech = ['Node.js 22', 'Express.js', 'JavaScript', '메모리 큐 + JSON 로그', 'Ollama (LLM)'];
  tech.forEach((t, i) => {
    slide.addText('• ' + t, {
      x: 7.95, y: 1.45 + i * 0.66, w: 1.7, h: 0.55,
      fontSize: 12, fontFace: FONT, color: C.black,
    });
  });

  slide.addNotes(`시스템은 4개 계층으로 구성됩니다. 클라이언트가 REST 요청을 보내면 API 계층이 받고, 이 계층 안에서 Rate Limiter가 전처리 단계로 등급별 한도를 확인합니다. 한도 초과면 HTTP 429로 거부되고, 통과하면 스케줄러 계층의 대기열에 들어갑니다. 스케줄러가 알고리즘에 따라 처리 순서를 결정하면 최종적으로 Ollama LLM이 응답을 생성합니다. 환경변수 하나로 4개 스케줄러를 즉시 전환할 수 있습니다.

(발표 시간: 약 1분 30초)

---AI-PROMPT---
[이 슬라이드 개선 지시]
- 4계층 구조를 수직 스택으로 표현 (클라이언트 → API → 스케줄러 → 저장소/LLM)
- 각 계층 박스는 서로 다른 색상: 클라이언트 남색, API 녹색, 스케줄러 주황, 저장소 회색
- 계층 간 화살표(↓)는 중앙에 14pt 이상 크기로 명확히
- 우측 "기술 스택" 박스는 세로 컬럼 형태 유지, 불릿 리스트
- 중요: Rate Limiter가 "별도 계층"이 아니라 "API 계층 내 전처리"임을 부제(sub)에 명시
- 전체 구조가 한 눈에 파악되도록 여백 균형 유지
---END-PROMPT---`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 5: 스케줄링 알고리즘 비교
// ─────────────────────────────────────────────────────────────────────────────
function createSlide5(pptx, totalSlides) {
  const slide = pptx.addSlide();
  addHeader(slide, '스케줄링 알고리즘 비교');
  addFooter(slide);
  addSlideNumber(slide, 5, totalSlides);

  const algos = [
    {
      name: 'FCFS',
      fullName: 'First-Come, First-Served',
      desc: '도착 순서대로 처리',
      key: '단순, 공평, 순서 보장',
      color: C.primary,
      x: 0.3, y: 1.1,
    },
    {
      name: 'Priority',
      fullName: 'Priority Scheduling',
      desc: '긴급한 요청 먼저 처리',
      key: 'URGENT > HIGH > NORMAL > LOW',
      color: C.accent,
      x: 5.2, y: 1.1,
    },
    {
      name: 'MLFQ',
      fullName: 'Multi-Level Feedback Queue',
      desc: '짧은 요청 우선 처리',
      key: '큐 수준에 따른 시간 할당량',
      color: C.warning,
      x: 0.3, y: 3.8,
    },
    {
      name: 'WFQ',
      fullName: 'Weighted Fair Queuing',
      desc: '등급별 차등 서비스',
      key: 'Enterprise > Premium > Standard > Free',
      color: C.danger,
      x: 5.2, y: 3.8,
    },
  ];

  algos.forEach((algo) => {
    // Box background
    slide.addShape('rect', {
      x: algo.x, y: algo.y, w: 4.5, h: 2.5,
      fill: { color: C.lightBlue },
      line: { color: algo.color, width: 2 },
      rectRadius: 0.1,
    });
    // Color bar at top
    slide.addShape('rect', {
      x: algo.x, y: algo.y, w: 4.5, h: 0.48,
      fill: { color: algo.color },
      line: { color: algo.color },
      rectRadius: 0.1,
    });
    // Cover bottom-rounded of top bar
    slide.addShape('rect', {
      x: algo.x, y: algo.y + 0.28, w: 4.5, h: 0.2,
      fill: { color: algo.color },
      line: { color: algo.color },
    });
    // Algorithm name
    slide.addText(algo.name, {
      x: algo.x + 0.15, y: algo.y + 0.04, w: 2.0, h: 0.4,
      fontSize: 20, fontFace: FONT, bold: true, color: C.white,
    });
    // Full name
    slide.addText(algo.fullName, {
      x: algo.x + 0.15, y: algo.y + 0.6, w: 4.2, h: 0.35,
      fontSize: 12, fontFace: FONT, color: algo.color, bold: true,
    });
    // Description
    slide.addText(algo.desc, {
      x: algo.x + 0.15, y: algo.y + 0.97, w: 4.2, h: 0.55,
      fontSize: 16, fontFace: FONT, bold: true, color: C.black,
    });
    // Key property
    slide.addText('핵심: ' + algo.key, {
      x: algo.x + 0.15, y: algo.y + 1.58, w: 4.2, h: 0.75,
      fontSize: 13, fontFace: FONT, color: C.secondary,
      lineSpacingMultiple: 1.3,
    });
  });

  slide.addNotes(`네 가지 스케줄링 알고리즘을 LLM API에 맞게 구현했습니다. FCFS는 도착 순서대로 처리하는 가장 단순한 방식입니다. Priority는 URGENT, HIGH, NORMAL, LOW 네 단계로 긴급도에 따라 처리합니다. MLFQ는 여러 큐를 두고 짧은 요청을 상위 큐에 배치해 우선 처리합니다. WFQ는 네트워크 QoS에서 사용하는 방식으로, 가중치가 큰 사용자가 더 자주 선택되도록 합니다. 우리 프로젝트에서는 Enterprise 100, Free 1의 가중치를 적용했습니다.

(발표 시간: 약 1분 30초)

---AI-PROMPT---
[이 슬라이드 개선 지시]
- 2x2 격자 배치 유지, 각 알고리즘 박스 동일 크기(4.5x2.5 inch)
- 상단 색상 바(color bar) + 하단 설명 영역의 2단 구성 유지
- 4개 박스 색상: FCFS 남색, Priority 녹색, MLFQ 주황, WFQ 빨강
- 각 박스 상단에 영문 약자(FCFS/Priority/MLFQ/WFQ) 20pt bold white
- 그 아래 풀 네임(First-Come, First-Served 등) 12pt
- "핵심:" 라벨은 14pt 회색, 이어지는 키워드는 13pt
- 아이콘 추가 고려: FCFS 시계, Priority 별, MLFQ 계단, WFQ 저울 (PowerPoint 아이콘 라이브러리)
---END-PROMPT---`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 6: 등급 체계
// ─────────────────────────────────────────────────────────────────────────────
function createSlide6(pptx, totalSlides) {
  const slide = pptx.addSlide();
  addHeader(slide, '등급 체계 설계');
  addFooter(slide);
  addSlideNumber(slide, 6, totalSlides);

  // Left box: Request Priority
  slide.addShape('rect', {
    x: 0.3, y: 1.1, w: 4.4, h: 5.3,
    fill: { color: C.lightBlue },
    line: { color: C.primary, width: 1.5 },
    rectRadius: 0.1,
  });
  slide.addShape('rect', {
    x: 0.3, y: 1.1, w: 4.4, h: 0.55,
    fill: { color: C.primary },
    line: { color: C.primary },
    rectRadius: 0.1,
  });
  slide.addShape('rect', {
    x: 0.3, y: 1.38, w: 4.4, h: 0.27,
    fill: { color: C.primary },
    line: { color: C.primary },
  });
  slide.addText('요청 우선순위 (Request Priority)', {
    x: 0.45, y: 1.13, w: 4.1, h: 0.45,
    fontSize: 15, fontFace: FONT, bold: true, color: C.white,
  });
  slide.addText('Priority Scheduler 사용', {
    x: 0.45, y: 1.7, w: 4.1, h: 0.3,
    fontSize: 12, fontFace: FONT, color: C.secondary, italic: true,
  });

  const priorities = [
    { label: 'URGENT', desc: '즉시 처리 필요', color: C.danger },
    { label: 'HIGH',   desc: '우선 처리',      color: C.warning },
    { label: 'NORMAL', desc: '일반 처리',      color: C.primary },
    { label: 'LOW',    desc: '여유 처리',      color: C.secondary },
  ];
  priorities.forEach((p, i) => {
    const y = 2.12 + i * 0.95;
    slide.addShape('rect', {
      x: 0.55, y, w: 1.3, h: 0.62,
      fill: { color: p.color },
      line: { color: p.color },
      rectRadius: 0.06,
    });
    slide.addText(p.label, {
      x: 0.55, y, w: 1.3, h: 0.62,
      fontSize: 13, fontFace: FONT, bold: true, color: C.white,
      align: 'center', valign: 'middle',
    });
    slide.addText(p.desc, {
      x: 2.05, y: y + 0.12, w: 2.4, h: 0.4,
      fontSize: 14, fontFace: FONT, color: C.black,
    });
  });

  // Right box: Subscription Tier
  slide.addShape('rect', {
    x: 5.2, y: 1.1, w: 4.5, h: 5.3,
    fill: { color: 'FFF7ED' },
    line: { color: C.warning, width: 1.5 },
    rectRadius: 0.1,
  });
  slide.addShape('rect', {
    x: 5.2, y: 1.1, w: 4.5, h: 0.55,
    fill: { color: C.warning },
    line: { color: C.warning },
    rectRadius: 0.1,
  });
  slide.addShape('rect', {
    x: 5.2, y: 1.38, w: 4.5, h: 0.27,
    fill: { color: C.warning },
    line: { color: C.warning },
  });
  slide.addText('구독 등급 (Subscription Tier)', {
    x: 5.35, y: 1.13, w: 4.2, h: 0.45,
    fontSize: 15, fontFace: FONT, bold: true, color: C.white,
  });
  slide.addText('WFQ Scheduler · Rate Limiter 사용', {
    x: 5.35, y: 1.7, w: 4.2, h: 0.3,
    fontSize: 12, fontFace: FONT, color: C.secondary, italic: true,
  });

  const tiers = [
    { label: 'Enterprise', weight: '가중치 100', limit: '분당 100건', color: '7C3AED' },
    { label: 'Premium',    weight: '가중치 50',  limit: '분당 50건',  color: C.primary },
    { label: 'Standard',   weight: '가중치 10',  limit: '분당 10건',  color: C.accent },
    { label: 'Free',       weight: '가중치 1',   limit: '분당 5건',   color: C.secondary },
  ];
  tiers.forEach((t, i) => {
    const y = 2.12 + i * 0.95;
    slide.addShape('rect', {
      x: 5.4, y, w: 1.55, h: 0.62,
      fill: { color: t.color },
      line: { color: t.color },
      rectRadius: 0.06,
    });
    slide.addText(t.label, {
      x: 5.4, y, w: 1.55, h: 0.62,
      fontSize: 13, fontFace: FONT, bold: true, color: C.white,
      align: 'center', valign: 'middle',
    });
    slide.addText(t.weight + '\n' + t.limit, {
      x: 7.1, y: y + 0.04, w: 2.4, h: 0.58,
      fontSize: 13, fontFace: FONT, color: C.black,
      lineSpacingMultiple: 1.3,
    });
  });

  slide.addNotes(`등급 체계는 두 가지 축으로 구성됩니다. 왼쪽은 요청 자체의 긴급도를 나타내는 우선순위로, Priority Scheduler에서 사용합니다. 오른쪽은 사용자의 구독 등급으로, WFQ 가중치와 Rate Limiter에서 활용합니다. Enterprise는 Free보다 100배 높은 처리 가중치를 가지며, 분당 요청 한도도 100건 대 5건으로 20배 차이가 납니다. 이 설계가 실제 실험에서 약 12배의 대기시간 차이로 나타납니다.

(발표 시간: 약 1분)

---AI-PROMPT---
[디자인 개선 지시]
- 좌/우 2열 배치 유지. 요청 우선순위(URGENT/HIGH/NORMAL/LOW)와 구독 등급(Enterprise/Premium/Standard/Free)이 서로 다른 개념임을 명확히 구분
- Enterprise 박스는 보라색(#7C3AED) 유지, 강조를 위해 약간의 그림자 효과 추가
- 가중치와 분당 허용 건수 숫자를 굵게(bold) 표시하여 시각적 대비 강화
- 우측 박스 하단에 "가중치 100:50:10:1 → WFQ에서 Enterprise 우선 처리" 라는 한 줄 요약 추가 고려
---END-PROMPT---`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 7: 기본 실험 결과 (500건 시뮬레이션)
// ─────────────────────────────────────────────────────────────────────────────
function createSlide7(pptx, totalSlides) {
  const slide = pptx.addSlide();
  addHeader(slide, '실험 결과 1: 알고리즘별 평균 대기시간');
  addFooter(slide);
  addSlideNumber(slide, 7, totalSlides);

  // Chart: average wait time per algorithm
  const chartData = [
    {
      name: '평균 대기시간 (ms)',
      labels: ['FCFS', 'Priority', 'MLFQ\n(비선점형)', 'WFQ'],
      values: [12203, 12419, 12203, 11846],
    },
  ];

  slide.addChart('bar', chartData, {
    x: 0.5, y: 1.1, w: 6.0, h: 4.5,
    barDir: 'col',
    catAxisLabelFontFace: FONT,
    catAxisLabelFontSize: 14,
    valAxisLabelFontFace: FONT,
    valAxisLabelFontSize: 11,
    dataLabelFontFace: FONT,
    dataLabelFontSize: 12,
    dataLabelColor: C.black,
    showValue: true,
    valAxisMinVal: 11000,
    valAxisMaxVal: 13000,
    chartColors: [C.primary, C.accent, C.warning, C.danger],
    plotAreaFill: { color: C.lightGray },
    plotAreaBorder: { color: C.border, pt: 1 },
    legendFontFace: FONT,
    legendFontSize: 12,
    showLegend: false,
  });

  // Y-axis label
  slide.addText('평균 대기시간 (ms)', {
    x: 0.0, y: 2.5, w: 0.5, h: 2,
    fontSize: 11, fontFace: FONT, color: C.secondary,
    rotate: 90, align: 'center',
  });

  // Callout box
  slide.addShape('rect', {
    x: 6.8, y: 1.1, w: 2.9, h: 4.5,
    fill: { color: C.lightBlue },
    line: { color: C.primary, width: 1.5 },
    rectRadius: 0.1,
  });
  slide.addText('핵심 발견', {
    x: 6.95, y: 1.2, w: 2.6, h: 0.38,
    fontSize: 16, fontFace: FONT, bold: true, color: C.primary,
  });

  const findings = [
    { icon: '!', text: 'MLFQ(비선점형)\n= FCFS 동일 결과', color: C.warning },
    { icon: '✓', text: 'WFQ가 가장 짧은\n평균 대기시간', color: C.accent },
    { icon: '→', text: '선점 없이는\n큐 순서와 무관', color: C.secondary },
  ];
  findings.forEach((f, i) => {
    const y = 1.72 + i * 1.25;
    slide.addShape('rect', {
      x: 6.95, y, w: 2.55, h: 1.05,
      fill: { color: C.white },
      line: { color: C.border, width: 1 },
      rectRadius: 0.08,
    });
    slide.addText(f.icon, {
      x: 7.02, y: y + 0.24, w: 0.38, h: 0.5,
      fontSize: 18, fontFace: FONT, color: f.color, align: 'center',
    });
    slide.addText(f.text, {
      x: 7.44, y: y + 0.1, w: 1.95, h: 0.85,
      fontSize: 13, fontFace: FONT, color: C.black,
      lineSpacingMultiple: 1.3,
    });
  });

  // Caption
  slide.addText('* 시뮬레이션 500건, 처리시간 10~100ms 균등 분포', {
    x: 0.5, y: 5.75, w: 6.0, h: 0.3,
    fontSize: 11, fontFace: FONT, color: C.secondary, italic: true,
  });

  slide.addNotes(`첫 번째 실험 결과입니다. 500건을 동일 조건에서 4개 알고리즘으로 돌린 결과, WFQ가 약 11,846ms로 가장 짧은 평균 대기시간을 보였습니다. 주목할 부분은 MLFQ 비선점형이 FCFS와 정확히 같은 12,203ms라는 점입니다. 이는 모든 요청이 최상위 큐 Q0의 시간 할당량 1,000ms 안에 끝나 강등이 일어나지 않았고, 비선점형이라 큐에서 꺼내는 순서가 도착 순서와 같아졌기 때문입니다. MLFQ의 이론적 효과는 다음 실험에서 선점형으로 별도 검증했습니다.

(발표 시간: 약 1분 30초)

---AI-PROMPT---
[이 슬라이드 개선 지시]
- 좌측 세로 막대 차트의 Y축 범위 11,000~13,000ms (차이를 시각적으로 강조)
- 4개 막대 색상 차별화: FCFS 남색, Priority 녹색, MLFQ 주황, WFQ 빨강
- WFQ 막대 상단에 "최단" 또는 별표(★) 표시 강조 고려
- 우측 "핵심 발견" 박스의 3개 카드: 아이콘(!/✓/→)을 더 큰 크기(20pt) 또는 적절한 SVG로 교체 고려
- 차트 하단 캡션 "* 시뮬레이션 500건, 10~100ms 균등 분포" 11pt italic 유지
- 막대 데이터 레이블(값 표시)은 상단 외부에 배치
---END-PROMPT---`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 8: MLFQ 선점형 실험
// ─────────────────────────────────────────────────────────────────────────────
function createSlide8(pptx, totalSlides) {
  const slide = pptx.addSlide();
  addHeader(slide, '실험 결과 2: MLFQ 선점형 vs FCFS');
  addFooter(slide);
  addSlideNumber(slide, 8, totalSlides);

  // Grouped bar chart
  const chartData = [
    {
      name: 'FCFS',
      labels: ['짧은 요청\n(Short)', '중간 요청\n(Medium)', '긴 요청\n(Long)'],
      values: [635, 645, 650],
    },
    {
      name: 'MLFQ 선점형',
      labels: ['짧은 요청\n(Short)', '중간 요청\n(Medium)', '긴 요청\n(Long)'],
      values: [170, 729, 1226],
    },
  ];

  slide.addChart('bar', chartData, {
    x: 0.3, y: 1.1, w: 6.5, h: 4.6,
    barDir: 'col',
    barGrouping: 'clustered',
    catAxisLabelFontFace: FONT,
    catAxisLabelFontSize: 13,
    valAxisLabelFontFace: FONT,
    valAxisLabelFontSize: 11,
    dataLabelFontFace: FONT,
    dataLabelFontSize: 11,
    dataLabelColor: C.black,
    showValue: true,
    chartColors: [C.primary, C.warning],
    plotAreaFill: { color: C.lightGray },
    plotAreaBorder: { color: C.border, pt: 1 },
    showLegend: true,
    legendFontFace: FONT,
    legendFontSize: 13,
    legendPos: 'b',
  });

  slide.addText('평균 대기시간 (초)', {
    x: 0.0, y: 2.5, w: 0.5, h: 2,
    fontSize: 11, fontFace: FONT, color: C.secondary,
    rotate: 90, align: 'center',
  });

  // Highlight callout for Short reduction
  slide.addShape('rect', {
    x: 7.0, y: 1.1, w: 2.7, h: 1.8,
    fill: { color: 'FFF7ED' },
    line: { color: C.warning, width: 2 },
    rectRadius: 0.1,
  });
  slide.addText('짧은 요청 대기시간', {
    x: 7.15, y: 1.2, w: 2.4, h: 0.38,
    fontSize: 14, fontFace: FONT, bold: true, color: C.warning,
  });
  slide.addText('약 73% 감소', {
    x: 7.15, y: 1.58, w: 2.4, h: 0.55,
    fontSize: 22, fontFace: FONT, bold: true, color: C.danger,
  });
  slide.addText('635초 → 170초', {
    x: 7.15, y: 2.15, w: 2.4, h: 0.35,
    fontSize: 13, fontFace: FONT, color: C.black,
  });

  // Tradeoff box
  slide.addShape('rect', {
    x: 7.0, y: 3.1, w: 2.7, h: 2.6,
    fill: { color: C.lightBlue },
    line: { color: C.primary, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText('트레이드오프', {
    x: 7.15, y: 3.2, w: 2.4, h: 0.38,
    fontSize: 14, fontFace: FONT, bold: true, color: C.primary,
  });
  const tradeoffs = [
    { label: 'Short  ↓73%', color: C.accent },
    { label: 'Medium ↑13%', color: C.warning },
    { label: 'Long   ↑89%', color: C.danger },
  ];
  tradeoffs.forEach((t, i) => {
    slide.addShape('rect', {
      x: 7.15, y: 3.67 + i * 0.6, w: 2.4, h: 0.46,
      fill: { color: C.white },
      line: { color: C.border, width: 1 },
      rectRadius: 0.05,
    });
    slide.addText(t.label, {
      x: 7.2, y: 3.71 + i * 0.6, w: 2.3, h: 0.38,
      fontSize: 14, fontFace: FONT, bold: true, color: t.color,
    });
  });

  slide.addNotes(`MLFQ의 이론적 효과를 확인하기 위해 선점형을 추가 구현했습니다. 요청 500건, 처리 시간 최대 10초, 버스트 도착 구조로 5개 시드를 반복했습니다. 결과는 극적이었습니다. 짧은 요청은 상위 큐 Q0 안에서 끝나 대기시간이 약 73% 감소한 반면, 긴 요청은 계속 하위 큐로 밀려나 약 89% 증가했고 중간 요청도 약 13% 증가했습니다. 이는 MLFQ가 짧은 요청 중심 서비스에 매우 효과적이지만 긴 요청이 많은 환경에서는 주의가 필요함을 보여줍니다. 다만 LLM 추론은 도중 중단이 불가능하므로 실서버에서는 선점형을 적용할 수 없다는 실용적 한계도 확인했습니다.

(발표 시간: 약 1분 30초)

---AI-PROMPT---
[이 슬라이드 개선 지시]
- 좌측 클러스터 막대 차트: FCFS(남색) vs MLFQ 선점형(주황) 대조
- X축 카테고리: Short / Medium / Long (요청 처리 시간별)
- Y축 단위 "초" 명시, 막대 상단 데이터 레이블 표시
- 우측 상단 "짧은 요청 대기시간 약 73% 감소" 강조 박스를 가장 크게 강조 (빨강 22pt bold)
- 우측 하단 "트레이드오프" 박스에 3행: Short ↓73% 녹색, Medium ↑13% 주황, Long ↑89% 빨강
- 추가 고려: 범례를 하단 중앙에 배치, "FCFS" "MLFQ 선점형" 라벨 명확히
---END-PROMPT---`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 9: WFQ 차등 서비스
// ─────────────────────────────────────────────────────────────────────────────
function createSlide9(pptx, totalSlides) {
  const slide = pptx.addSlide();
  addHeader(slide, '실험 결과 3: WFQ 구독 등급별 대기시간');
  addFooter(slide);
  addSlideNumber(slide, 9, totalSlides);

  const chartData = [
    {
      name: '평균 대기시간 (ms)',
      labels: ['Enterprise', 'Premium', 'Standard', 'Free'],
      values: [1862, 8384, 15109, 22029],
    },
  ];

  slide.addChart('bar', chartData, {
    x: 0.3, y: 1.1, w: 6.4, h: 4.6,
    barDir: 'col',
    catAxisLabelFontFace: FONT,
    catAxisLabelFontSize: 14,
    valAxisLabelFontFace: FONT,
    valAxisLabelFontSize: 11,
    dataLabelFontFace: FONT,
    dataLabelFontSize: 12,
    dataLabelColor: C.black,
    showValue: true,
    chartColors: ['7C3AED', C.primary, C.accent, C.secondary],
    plotAreaFill: { color: C.lightGray },
    plotAreaBorder: { color: C.border, pt: 1 },
    showLegend: false,
  });

  slide.addText('평균 대기시간 (ms)', {
    x: 0.0, y: 2.5, w: 0.5, h: 2,
    fontSize: 11, fontFace: FONT, color: C.secondary,
    rotate: 90, align: 'center',
  });

  // Key finding
  slide.addShape('rect', {
    x: 6.9, y: 1.1, w: 2.8, h: 4.6,
    fill: { color: C.lightBlue },
    line: { color: C.primary, width: 1.5 },
    rectRadius: 0.1,
  });
  slide.addText('핵심 결과', {
    x: 7.05, y: 1.2, w: 2.5, h: 0.38,
    fontSize: 16, fontFace: FONT, bold: true, color: C.primary,
  });

  slide.addText('Enterprise\n약 1,862ms', {
    x: 7.05, y: 1.65, w: 2.5, h: 0.8,
    fontSize: 14, fontFace: FONT, color: '7C3AED', bold: true,
    lineSpacingMultiple: 1.3,
  });
  slide.addText('vs', {
    x: 7.05, y: 2.5, w: 2.5, h: 0.3,
    fontSize: 13, fontFace: FONT, color: C.secondary, align: 'center',
  });
  slide.addText('Free\n약 22,029ms', {
    x: 7.05, y: 2.85, w: 2.5, h: 0.8,
    fontSize: 14, fontFace: FONT, color: C.secondary, bold: true,
    lineSpacingMultiple: 1.3,
  });

  // Divider
  slide.addShape('line', {
    x: 7.05, y: 3.72, w: 2.5, h: 0,
    line: { color: C.border, width: 1 },
  });

  slide.addText('약 12배 차이', {
    x: 7.05, y: 3.85, w: 2.5, h: 0.55,
    fontSize: 20, fontFace: FONT, bold: true, color: C.danger,
    align: 'center',
  });
  slide.addText('가중치 비율에 비례한\n차등 서비스 확인', {
    x: 7.05, y: 4.45, w: 2.5, h: 0.7,
    fontSize: 13, fontFace: FONT, color: C.black,
    align: 'center', lineSpacingMultiple: 1.3,
  });

  slide.addNotes(`WFQ 실험을 구독 등급별로 분해해보니 확연한 차이가 나타났습니다. Enterprise는 약 1,862ms, Premium 8,384ms, Standard 15,109ms, Free는 약 22,029ms였습니다. Enterprise가 Free 대비 약 12배 짧은 대기시간을 보였고, 이는 가중치 100:50:10:1에 대응되는 결과입니다. 가중치 비율이 100:1이지만 실제 차이가 12배에 그친 것은 요청이 순차적으로 큐에 도착하는 실험 설계의 영향입니다. 앞 슬라이드에서 FCFS 계열이 모두 공정했던 것과 대조적으로, WFQ는 의도적으로 차등 서비스를 제공함을 수치로 확인할 수 있습니다.

(발표 시간: 약 1분 30초)

---AI-PROMPT---
[이 슬라이드 개선 지시]
- 세로 막대 4개 (Enterprise/Premium/Standard/Free), 색상 그라데이션
  - Enterprise: 보라(#7C3AED) 가장 짧은 막대
  - Premium: 남색(#003478)
  - Standard: 녹색(#059669)
  - Free: 회색(#64748B) 가장 긴 막대
- Y축 범위 0~25000ms, 막대 상단에 값 표시 (1862, 8384, 15109, 22029)
- 우측 "핵심 결과" 박스:
  - 상단 "Enterprise 약 1,862ms" 보라색 14pt bold
  - 중앙 "vs" 구분자
  - 하단 "Free 약 22,029ms" 회색 14pt bold
  - 그 아래 "약 12배 차이" 20pt 빨강 bold (큰 강조)
  - 최하단 "가중치 비율(100:50:10:1)에 비례한 차등 서비스 확인" 13pt
- 수치 정확성이 핵심이므로 데이터 레이블 반드시 표시
---END-PROMPT---`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 10: 실서버 실험 (Ollama)
// ─────────────────────────────────────────────────────────────────────────────
function createSlide10(pptx, totalSlides) {
  const slide = pptx.addSlide();
  addHeader(slide, '실험 결과 4: 실서버(Ollama) 검증');
  addFooter(slide);
  addSlideNumber(slide, 10, totalSlides);

  // Comparison: Simulation vs Real Server
  const configs = [
    {
      title: '시뮬레이션',
      color: C.primary,
      x: 0.4,
      items: [
        '처리시간: 10~100ms (미리 설정)',
        '스케줄러: 처리 순서 결정',
        '결과: 즉시 반환',
        '선점형: 구현 가능',
        '장점: 빠른 반복 실험',
      ],
    },
    {
      title: '실서버 (Ollama LLM)',
      color: C.accent,
      x: 5.35,
      items: [
        '처리시간: 약 208ms (실제 추론)',
        '스케줄러: 처리 순서 결정',
        '결과: 실제 LLM 응답 생성',
        '선점형: 불가 (추론 중단 불가)',
        '장점: 실제 환경 검증',
      ],
    },
  ];

  configs.forEach((cfg) => {
    slide.addShape('rect', {
      x: cfg.x, y: 1.1, w: 4.6, h: 4.6,
      fill: { color: C.lightBlue },
      line: { color: cfg.color, width: 2 },
      rectRadius: 0.1,
    });
    slide.addShape('rect', {
      x: cfg.x, y: 1.1, w: 4.6, h: 0.55,
      fill: { color: cfg.color },
      line: { color: cfg.color },
      rectRadius: 0.1,
    });
    slide.addShape('rect', {
      x: cfg.x, y: 1.38, w: 4.6, h: 0.27,
      fill: { color: cfg.color },
      line: { color: cfg.color },
    });
    slide.addText(cfg.title, {
      x: cfg.x + 0.15, y: 1.13, w: 4.3, h: 0.45,
      fontSize: 16, fontFace: FONT, bold: true, color: C.white,
    });
    cfg.items.forEach((item, i) => {
      slide.addText('• ' + item, {
        x: cfg.x + 0.2, y: 1.78 + i * 0.68, w: 4.2, h: 0.6,
        fontSize: 14, fontFace: FONT, color: C.black,
        lineSpacingMultiple: 1.2,
      });
    });
  });

  // Key insight banner
  slide.addShape('rect', {
    x: 0.4, y: 5.85, w: 9.2, h: 1.1,
    fill: { color: 'FEF9C3' },
    line: { color: C.warning, width: 1.5 },
    rectRadius: 0.08,
  });
  slide.addText('핵심 발견: 스케줄러는 처리 순서만 결정하며, 실제 LLM 추론 속도에는 영향을 주지 않습니다.\n실서버 환경에서도 스케줄링 알고리즘이 정상 동작하였고, 선점형 구현은 실제 LLM에서 제약이 있습니다.', {
    x: 0.6, y: 5.92, w: 8.8, h: 0.95,
    fontSize: 13, fontFace: FONT, color: C.black,
    lineSpacingMultiple: 1.4,
  });

  slide.addNotes(`시뮬레이션 결과가 실제 LLM 환경에서도 재현되는지 확인하기 위해 Ollama 로컬 서버로 검증했습니다. Google Gemma 4 계열의 gemma4:e4b 모델, 등급별 5건씩 총 20건을 동시에 큐에 투입한 뒤 FCFS, Priority, WFQ 세 알고리즘을 비교했습니다. 세 알고리즘 모두 평균 처리 시간이 비슷하게 측정되었습니다. 이는 스케줄러가 "누구를 먼저 처리할지"만 결정할 뿐 LLM 추론 속도는 바꾸지 않는다는 점을 보여줍니다. 등급별로는 시뮬레이션과 동일한 패턴이 나타났고, FCFS는 도착 순서, Priority는 우선순위, WFQ는 가중치에 따라 처리되었습니다. 이 실험에서 선점형 MLFQ가 실서버에서 적용 불가능하다는 사실도 함께 확인되었습니다.

(발표 시간: 약 1분 30초)

---AI-PROMPT---
[이 슬라이드 개선 지시]
- 좌/우 2열 비교 구조 유지: 왼쪽 "시뮬레이션", 오른쪽 "실서버 (Ollama)"
- 각 박스 상단 제목 색상: 시뮬레이션 남색(#003478), 실서버 녹색(#059669)
- 5개 불릿 항목 14pt, 줄간격 1.2배
- 박스 내 테두리 2pt로 시각적 구분 강화
- 하단 "핵심 발견" 배너 (연한 노란 배경 #FEF9C3):
  - "스케줄러는 처리 순서만 결정하며, 실제 LLM 추론 속도에는 영향을 주지 않습니다"
  - "선점형 구현은 실제 LLM에서 제약이 있습니다"
  - 13pt, 줄간격 1.4배로 읽기 편하게
- 추가 고려: 박스 상단에 작은 아이콘 (시뮬레이션=그래프, 실서버=서버)
---END-PROMPT---`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 11: 결론
// ─────────────────────────────────────────────────────────────────────────────
function createSlide11(pptx, totalSlides) {
  const slide = pptx.addSlide();
  addHeader(slide, '결론');
  addFooter(slide);
  addSlideNumber(slide, 11, totalSlides);

  // RQ answers
  const rqAnswers = [
    {
      rq: 'RQ1',
      question: '구현 가능성',
      answer: '4개 알고리즘 모두 구현 완료\nOllama 실서버 연동까지 검증',
      icon: '✓',
      color: C.accent,
    },
    {
      rq: 'RQ2',
      question: '성능 비교',
      answer: '비선점형 환경에서 알고리즘 간 처리량은 유사\nWFQ 평균 대기시간 최소, MLFQ 선점형은 짧은 요청 약 73% 감소',
      icon: '◎',
      color: C.primary,
    },
    {
      rq: 'RQ3',
      question: '공정성 분석',
      answer: 'FCFS·Priority·MLFQ: JFI = 1.0 (완전 공평)\nWFQ: JFI = 0.32 (의도적 차등)',
      icon: '≈',
      color: C.warning,
    },
  ];

  rqAnswers.forEach((rq, i) => {
    const y = 1.1 + i * 1.38;
    slide.addShape('rect', {
      x: 0.3, y, w: W - 0.6, h: 1.25,
      fill: { color: C.lightBlue },
      line: { color: rq.color, width: 1.5 },
      rectRadius: 0.08,
    });
    // RQ badge
    slide.addShape('rect', {
      x: 0.4, y: y + 0.12, w: 0.85, h: 0.85,
      fill: { color: rq.color },
      line: { color: rq.color },
      rectRadius: 0.06,
    });
    slide.addText(rq.rq, {
      x: 0.4, y: y + 0.12, w: 0.85, h: 0.85,
      fontSize: 16, fontFace: FONT, bold: true, color: C.white,
      align: 'center', valign: 'middle',
    });
    // Question
    slide.addText(rq.question, {
      x: 1.4, y: y + 0.1, w: 2.2, h: 0.38,
      fontSize: 15, fontFace: FONT, bold: true, color: rq.color,
    });
    // Answer
    slide.addText(rq.answer, {
      x: 1.4, y: y + 0.48, w: W - 1.9, h: 0.68,
      fontSize: 14, fontFace: FONT, color: C.black,
      lineSpacingMultiple: 1.3,
    });
  });

  // Limitations
  slide.addShape('rect', {
    x: 0.3, y: 5.28, w: W - 0.6, h: 0.95,
    fill: { color: 'FFF7ED' },
    line: { color: C.warning, width: 1 },
    rectRadius: 0.08,
  });
  slide.addText('한계 및 향후 과제', {
    x: 0.5, y: 5.36, w: 2.2, h: 0.3,
    fontSize: 14, fontFace: FONT, bold: true, color: C.warning,
  });
  slide.addText('• 시뮬레이션 기반 실험 (실제 부하와 차이 가능)   • 선점형은 실제 LLM에서 적용 불가\n• 향후: 토큰 기반 비용 모델 · 대시보드 고도화 · 등급 내 공정성 검증 · 대규모 실험', {
    x: 0.5, y: 5.68, w: W - 0.8, h: 0.5,
    fontSize: 13, fontFace: FONT, color: C.black,
    lineSpacingMultiple: 1.3,
  });

  slide.addNotes(`세 가지 연구 질문 모두에 답할 수 있었습니다. RQ1은 구현 가능성이었는데, FCFS, Priority, MLFQ, WFQ 네 알고리즘을 모두 구현하고 실서버에서까지 검증을 마쳤습니다. RQ2 성능에서는 비선점형 환경에서 알고리즘 간 처리량이 유사한 가운데 WFQ가 평균 대기시간이 가장 짧았고, MLFQ 선점형이 짧은 요청에 특히 유리함을 확인했습니다. RQ3 공정성에서는 FCFS 계열의 JFI가 1.000으로 균등 배분을 달성했고, WFQ는 0.316이지만 이는 가중치 기반 의도적 차등의 결과로 Enterprise가 Free 대비 약 12배 빨리 처리되었습니다. 한계로는 시뮬레이션 기반이라는 점과 선점형의 실서버 적용 불가를 꼽을 수 있고, 향후 과제로는 토큰 기반 비용 모델, 대시보드 고도화(WebSocket 기반 실시간 갱신), 동일 등급 내 공정성 검증, 대규모 실험을 남깁니다.

(발표 시간: 약 1분)

---AI-PROMPT---
[이 슬라이드 개선 지시]
- 상단에 RQ1/RQ2/RQ3 답변 카드 3개를 수직 스택으로 배치
- 각 카드:
  - 좌측 RQ 배지(정사각형, 0.85x0.85 inch) 색상 차별화
    - RQ1 남색(#003478): 구현 가능
    - RQ2 녹색(#059669): 성능 우수
    - RQ3 빨강(#C41230): 의도적 차등
  - 배지 우측에 질문(15pt bold) + 답변(14pt 본문)
  - 카드 배경 연한 남색(#EAF1FB), 테두리는 해당 RQ 색상으로 1.5pt
- 하단 "한계 및 향후 과제" 박스(연한 주황 배경 #FFF7ED):
  - "한계 및 향후 과제" 제목 14pt bold 주황(#D97706)
  - 내용 13pt, 불릿 2행 레이아웃
- RQ 카드 간 여백 균일하게 유지 (세로 간격 약 0.13 inch)
---END-PROMPT---`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 12: 데모
// ─────────────────────────────────────────────────────────────────────────────
function createSlide12(pptx, totalSlides) {
  const slide = pptx.addSlide();
  addHeader(slide, '실시간 데모');
  addFooter(slide);
  addSlideNumber(slide, 12, totalSlides);

  // Demo URL box
  slide.addShape('rect', {
    x: 0.3, y: 1.1, w: 9.4, h: 0.75,
    fill: { color: C.primary },
    line: { color: C.primary },
    rectRadius: 0.08,
  });
  slide.addText('http://localhost:3000', {
    x: 0.5, y: 1.1, w: 9.0, h: 0.75,
    fontSize: 22, fontFace: 'Courier New', bold: true, color: C.white,
    align: 'center', valign: 'middle',
  });

  // Scenario 1
  slide.addShape('rect', {
    x: 0.3, y: 2.05, w: 4.5, h: 3.4,
    fill: { color: C.lightBlue },
    line: { color: C.primary, width: 1.5 },
    rectRadius: 0.1,
  });
  slide.addShape('rect', {
    x: 0.3, y: 2.05, w: 4.5, h: 0.5,
    fill: { color: C.primary },
    line: { color: C.primary },
    rectRadius: 0.1,
  });
  slide.addShape('rect', {
    x: 0.3, y: 2.32, w: 4.5, h: 0.23,
    fill: { color: C.primary },
    line: { color: C.primary },
  });
  slide.addText('시나리오 1: FCFS vs WFQ 비교 (2분 30초)', {
    x: 0.45, y: 2.08, w: 4.2, h: 0.44,
    fontSize: 13, fontFace: FONT, bold: true, color: C.white,
  });

  const s1Steps = [
    '① FCFS 서버 시작',
    '② 4개 등급 요청 전송',
    '③ 처리 순서 확인 (도착 순서)',
    '④ WFQ로 전환 후 재전송',
    '⑤ Enterprise 우선 처리 확인',
  ];
  s1Steps.forEach((step, i) => {
    slide.addText(step, {
      x: 0.5, y: 2.65 + i * 0.55, w: 4.1, h: 0.45,
      fontSize: 14, fontFace: FONT, color: C.black,
    });
  });

  // Scenario 2
  slide.addShape('rect', {
    x: 5.1, y: 2.05, w: 4.6, h: 3.4,
    fill: { color: 'FFF7ED' },
    line: { color: C.warning, width: 1.5 },
    rectRadius: 0.1,
  });
  slide.addShape('rect', {
    x: 5.1, y: 2.05, w: 4.6, h: 0.5,
    fill: { color: C.warning },
    line: { color: C.warning },
    rectRadius: 0.1,
  });
  slide.addShape('rect', {
    x: 5.1, y: 2.32, w: 4.6, h: 0.23,
    fill: { color: C.warning },
    line: { color: C.warning },
  });
  slide.addText('시나리오 2: Rate Limiter 시연 (1분)', {
    x: 5.25, y: 2.08, w: 4.3, h: 0.44,
    fontSize: 13, fontFace: FONT, bold: true, color: C.white,
  });

  const s2Steps = [
    '① Rate Limiter 활성화',
    '② Free 등급 6개 요청 전송',
    '③ 429 응답 확인 (한도 초과)',
    '④ Enterprise는 정상 처리 확인',
  ];
  s2Steps.forEach((step, i) => {
    slide.addText(step, {
      x: 5.3, y: 2.65 + i * 0.55, w: 4.2, h: 0.45,
      fontSize: 14, fontFace: FONT, color: C.black,
    });
  });

  // Command box
  slide.addShape('rect', {
    x: 0.3, y: 5.58, w: 9.4, h: 1.35,
    fill: { color: C.black },
    line: { color: C.black },
    rectRadius: 0.08,
  });
  slide.addText(
    'SCHEDULER_TYPE=WFQ node src-simple/server.js\n' +
    'curl -X POST http://localhost:3000/api/requests -H "Content-Type: application/json" \\\n' +
    '  -d \'{"prompt":"Hello","tenantId":"enterprise","tier":"enterprise","priority":"HIGH"}\'',
    {
      x: 0.5, y: 5.65, w: 9.1, h: 1.22,
      fontSize: 11, fontFace: 'Courier New', color: '86EFAC',
      lineSpacingMultiple: 1.4,
    }
  );

  slide.addNotes(`이제 실시간 데모를 시연하겠습니다. 두 가지 시나리오를 준비했습니다. 시나리오 1은 FCFS와 WFQ의 처리 순서 차이를 직접 비교합니다. 동일한 4개 등급 요청을 FCFS로 처리하면 도착 순서대로 나가지만, WFQ로 전환하면 Enterprise가 가장 먼저 처리됨을 확인할 수 있습니다. 시나리오 2는 Rate Limiter가 Free 등급의 분당 5건 한도를 초과한 6번째 요청을 HTTP 429로 거부하는 모습을 보여드립니다. 데모는 약 3분간 진행되며, 터미널과 브라우저 대시보드를 번갈아 보여드리겠습니다.

(발표 시간: 약 30초 + 데모 약 3분)

---AI-PROMPT---
[이 슬라이드 개선 지시]
- 상단에 서버 URL 배너 (남색 배경, 모노스페이스 폰트 Courier New 22pt white)
  "http://localhost:3000"
- 하단 좌/우 2열 박스:
  - 좌측 "시나리오 1: FCFS vs WFQ 비교 (2분 30초)" 남색 테마
    - 5단계 (① FCFS 서버 시작 → ② 4개 등급 요청 → ③ 순서 확인 → ④ WFQ 전환 → ⑤ Enterprise 우선 확인)
  - 우측 "시나리오 2: Rate Limiter 시연 (1분)" 주황 테마
    - 4단계 (① 활성화 → ② Free 6건 전송 → ③ 429 확인 → ④ Enterprise 정상 처리)
- 최하단 검은 배경 명령어 박스 (11pt Courier New, 녹색 #86EFAC):
  - SCHEDULER_TYPE=WFQ node src-simple/server.js
  - curl -X POST ... 명령어 예시
- 박스 둥근 모서리, 색상 대비 선명하게
- 데모 중 터미널 전환 시점을 시각적으로 암시하는 아이콘(▶) 추가 고려
---END-PROMPT---`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: Build the presentation
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const pptx = new PptxGenJS();

  // Slide size: Standard (10" x 7.5")
  pptx.layout = 'LAYOUT_WIDE';
  // Use custom 10" x 7.5" (close to 4:3 which prints well on A4)
  pptx.defineLayout({ name: 'STD', width: W, height: H });
  pptx.layout = 'STD';

  const TOTAL = 12;

  console.log('Building slides...');
  createSlide1(pptx);
  createSlide2(pptx, TOTAL);
  createSlide3(pptx, TOTAL);
  createSlide4(pptx, TOTAL);
  createSlide5(pptx, TOTAL);
  createSlide6(pptx, TOTAL);
  createSlide7(pptx, TOTAL);
  createSlide8(pptx, TOTAL);
  createSlide9(pptx, TOTAL);
  createSlide10(pptx, TOTAL);
  createSlide11(pptx, TOTAL);
  createSlide12(pptx, TOTAL);

  await pptx.writeFile({ fileName: OUTPUT_FILE });
  console.log(`Generated: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
