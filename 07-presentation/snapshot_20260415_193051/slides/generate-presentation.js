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

// ── Color palette (matches final-report figures) ──────────────────────────────
const C = {
  primary:   '2563EB',   // blue
  secondary: '64748B',   // gray
  accent:    '059669',   // green
  warning:   'D97706',   // orange/amber
  light:     'F1F5F9',   // light gray background
  white:     'FFFFFF',
  black:     '1E293B',
  border:    'CBD5E1',
  danger:    'DC2626',   // red
  lightBlue: 'EFF6FF',   // very light blue
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

  // Speaker note
  slide.addNotes('안녕하세요. 저는 홍익대학교 컴퓨터공학과 4학년 서민지입니다. 저의 졸업 프로젝트인 "스케줄링 알고리즘을 활용한 다중 사용자 LLM API 요청 관리 시스템"을 발표하겠습니다.');
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

  slide.addNotes('오늘 발표는 크게 다섯 부분으로 구성되어 있습니다. 연구 배경과 목적을 시작으로, 시스템 설계, 구현 내용, 실험 결과, 그리고 결론 순서로 진행하겠습니다.');
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

  slide.addNotes('LLM API 서비스는 현재 다중 사용자 환경에서 요청 관리 문제가 심각합니다. OS에서 오래전부터 검증된 스케줄링 알고리즘을 이 문제에 적용해보고자 했습니다. 세 가지 핵심 연구 질문을 중심으로 연구를 진행했습니다.');
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 4: 시스템 아키텍처
// ─────────────────────────────────────────────────────────────────────────────
function createSlide4(pptx, totalSlides) {
  const slide = pptx.addSlide();
  addHeader(slide, '시스템 아키텍처');
  addFooter(slide);
  addSlideNumber(slide, 4, totalSlides);

  // Five architecture layers
  const layers = [
    { label: '클라이언트 계층',      sub: 'REST Client  ·  대시보드',         color: C.primary,   y: 1.05 },
    { label: 'API 계층',            sub: 'Express.js  ·  요청 접수  ·  통계', color: C.accent,    y: 1.87 },
    { label: '요청 제한 계층',       sub: 'Rate Limiter  ·  토큰 버킷 알고리즘', color: C.danger,    y: 2.69 },
    { label: '스케줄러 계층',        sub: 'FCFS  ·  Priority  ·  MLFQ  ·  WFQ', color: C.warning,   y: 3.51 },
    { label: '저장소 / LLM 계층',   sub: '메모리 큐  ·  JSON 로그  ·  Ollama', color: C.secondary, y: 4.33 },
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
  const tech = ['Node.js', 'Express.js', 'JavaScript', 'SQLite (로그)', 'Ollama (LLM)'];
  tech.forEach((t, i) => {
    slide.addText('• ' + t, {
      x: 7.95, y: 1.45 + i * 0.66, w: 1.7, h: 0.55,
      fontSize: 12, fontFace: FONT, color: C.black,
    });
  });

  slide.addNotes('시스템은 5개 계층으로 구성됩니다. 클라이언트 요청이 API 계층에 도달하면, Rate Limiter가 구독 등급에 따라 요청 진입 여부를 결정하고, 스케줄러가 처리 순서를 결정하며, 최종적으로 LLM이 처리합니다. Node.js와 Express.js로 구현했습니다.');
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

  slide.addNotes('네 가지 스케줄링 알고리즘을 구현했습니다. FCFS는 가장 단순하며 도착 순서를 보장합니다. Priority는 요청 긴급도에 따라 처리 순서를 결정합니다. MLFQ는 짧은 요청이 빠르게 처리되도록 설계되었습니다. WFQ는 구독 등급에 따라 처리 비중을 차등 적용합니다.');
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
    { label: 'Enterprise', weight: '가중치 8', limit: '분당 120건', color: '7C3AED' },
    { label: 'Premium',    weight: '가중치 4', limit: '분당 60건',  color: C.primary },
    { label: 'Standard',   weight: '가중치 2', limit: '분당 30건',  color: C.accent },
    { label: 'Free',       weight: '가중치 1', limit: '분당 10건',  color: C.secondary },
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

  slide.addNotes('등급 체계는 두 가지 축으로 구성됩니다. 왼쪽은 요청 자체의 긴급도를 나타내는 우선순위로, Priority Scheduler에서 사용합니다. 오른쪽은 사용자의 구독 등급으로, WFQ와 Rate Limiter에서 활용합니다. Enterprise는 Free보다 8배 높은 처리 가중치를 가집니다.');
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

  slide.addNotes('500건의 시뮬레이션 실험 결과입니다. WFQ가 약 11,846ms로 가장 짧은 평균 대기시간을 보였습니다. 흥미로운 점은 MLFQ 비선점형이 FCFS와 동일한 결과를 보였다는 것입니다. 이는 한번 실행을 시작하면 중단되지 않기 때문에 큐 구조가 실질적인 차이를 만들지 못했기 때문입니다.');
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

  slide.addNotes('선점형 MLFQ를 별도로 시뮬레이션한 결과입니다. 짧은 요청의 대기시간이 약 73% 감소했습니다. 그러나 긴 요청은 계속 낮은 큐로 밀려나 오히려 약 89% 증가했습니다. 이는 MLFQ의 특성으로, 짧은 요청 위주의 서비스에서는 매우 효과적이지만 긴 요청이 많은 환경에서는 주의가 필요합니다.');
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
      values: [2046, 8301, 15247, 21790],
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

  slide.addText('Enterprise\n약 2,046ms', {
    x: 7.05, y: 1.65, w: 2.5, h: 0.8,
    fontSize: 14, fontFace: FONT, color: '7C3AED', bold: true,
    lineSpacingMultiple: 1.3,
  });
  slide.addText('vs', {
    x: 7.05, y: 2.5, w: 2.5, h: 0.3,
    fontSize: 13, fontFace: FONT, color: C.secondary, align: 'center',
  });
  slide.addText('Free\n약 21,790ms', {
    x: 7.05, y: 2.85, w: 2.5, h: 0.8,
    fontSize: 14, fontFace: FONT, color: C.secondary, bold: true,
    lineSpacingMultiple: 1.3,
  });

  // Divider
  slide.addShape('line', {
    x: 7.05, y: 3.72, w: 2.5, h: 0,
    line: { color: C.border, width: 1 },
  });

  slide.addText('약 10배 차이', {
    x: 7.05, y: 3.85, w: 2.5, h: 0.55,
    fontSize: 20, fontFace: FONT, bold: true, color: C.danger,
    align: 'center',
  });
  slide.addText('가중치 비율에 비례한\n차등 서비스 확인', {
    x: 7.05, y: 4.45, w: 2.5, h: 0.7,
    fontSize: 13, fontFace: FONT, color: C.black,
    align: 'center', lineSpacingMultiple: 1.3,
  });

  slide.addNotes('WFQ 실험에서 구독 등급별 확연한 차이가 나타났습니다. Enterprise는 약 2,046ms, Free는 약 21,790ms로 약 10배 차이를 보였습니다. 가중치 비율(8:4:2:1)에 비례하여 서비스 품질이 차등 적용된 것을 확인할 수 있습니다.');
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
        '처리시간: 약 116ms (실제 추론)',
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

  slide.addNotes('시뮬레이션을 넘어 실제 Ollama LLM 서버로 검증했습니다. 실서버에서도 스케줄링 순서가 올바르게 동작했으며, 실제 LLM 추론 시간은 약 116ms였습니다. 중요한 발견은 실제 LLM 추론은 중단할 수 없어 선점형 알고리즘 적용에 한계가 있다는 점입니다.');
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
      answer: 'WFQ 평균 대기시간 최소\nMLFQ 선점형은 짧은 요청에 유리 (약 73% 감소)',
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
  slide.addText('• 시뮬레이션 기반 실험 (실제 부하와 차이 가능)   • 선점형은 실제 LLM에서 적용 불가\n• 향후: 분산 환경 적용, 토큰 수 기반 선점형 설계, 실 트래픽 검증', {
    x: 0.5, y: 5.68, w: W - 0.8, h: 0.5,
    fontSize: 13, fontFace: FONT, color: C.black,
    lineSpacingMultiple: 1.3,
  });

  slide.addNotes('세 가지 연구 질문 모두에 답할 수 있었습니다. RQ1: 4개 알고리즘 모두 구현하여 실서버 검증까지 완료했습니다. RQ2: WFQ가 가장 짧은 대기시간을, MLFQ 선점형이 짧은 요청에 유리함을 확인했습니다. RQ3: FCFS계열은 공정하고 WFQ는 의도적으로 차등 서비스를 제공함을 확인했습니다.');
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
  slide.addText('시나리오 1: FCFS vs WFQ 비교 (2분)', {
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

  slide.addNotes('두 가지 시나리오로 데모를 진행합니다. 첫 번째는 FCFS와 WFQ의 처리 순서 차이를 직접 보여드립니다. 두 번째는 Rate Limiter가 Free 등급에 대해 요청을 제한하는 모습을 보여드립니다. 화면에 표시된 명령어로 요청을 전송합니다.');
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
