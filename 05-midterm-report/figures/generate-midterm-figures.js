/**
 * 중간보고서용 PPTX 그림 생성기
 * 7개 슬라이드: IEEE 학술 스타일
 */
const PptxGenJS = require('pptxgenjs');
const pptx = new PptxGenJS();

// IEEE 학술 색상 팔레트
const C = {
  titleBg: '1B2A4A',    // 제목 배경 (짙은 네이비)
  primary: '2E5090',     // 주요 강조
  secondary: '4472C4',   // 보조 강조
  accent1: '548235',     // 녹색 계열
  accent2: 'BF8F00',     // 황금 계열
  accent3: 'C00000',     // 빨강 계열
  light: 'D9E2F3',       // 연한 배경
  white: 'FFFFFF',
  dark: '333333',
  gray: '808080',
  lightGray: 'F2F2F2',
};

// 슬라이드 공통 설정
pptx.layout = 'LAYOUT_WIDE';
pptx.author = '서민지 (C235180)';
pptx.title = '중간보고서 그림 자료';

function addTitle(slide, title, subtitle) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: '100%', h: 0.8, fill: { color: C.titleBg }
  });
  slide.addText(title, {
    x: 0.5, y: 0.1, w: 12, h: 0.35, fontSize: 18, bold: true,
    color: C.white, fontFace: 'Arial'
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 0.45, w: 12, h: 0.25, fontSize: 11,
      color: 'AAAAAA', fontFace: 'Arial'
    });
  }
}

// ===== 슬라이드 1: OS 스케줄링 알고리즘 개념 비교 =====
function slide1_algorithmComparison() {
  const slide = pptx.addSlide();
  addTitle(slide, '그림 1. OS 스케줄링 알고리즘 개념 비교', '4가지 알고리즘의 특성 및 장단점');

  const algos = [
    { name: 'FCFS', color: C.secondary, desc: 'First-Come\nFirst-Served',
      pro: '구현 간단\n베이스라인', con: '호위 효과\n차등 서비스 불가' },
    { name: 'Priority', color: C.accent1, desc: '우선순위 기반\n+ Aging',
      pro: '긴급 요청 우선\n4단계 등급', con: '기아 가능성\n(Aging으로 해결)' },
    { name: 'MLFQ', color: C.accent2, desc: 'Multi-Level\nFeedback Queue',
      pro: '적응형 분류\n선점 지원', con: '매개변수 조정\n복잡도 높음' },
    { name: 'WFQ', color: C.primary, desc: 'Weighted Fair\nQueuing',
      pro: '가중치 비례 배분\nJFI 공정성 측정', con: 'Virtual Time\n계산 오버헤드' },
  ];

  algos.forEach((a, i) => {
    const x = 0.4 + i * 3.15;
    // 카드 배경
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.1, w: 2.9, h: 5.8, fill: { color: C.lightGray },
      rectRadius: 0.1, line: { color: a.color, width: 2 }
    });
    // 알고리즘 이름
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.15, y: 1.25, w: 2.6, h: 0.5, fill: { color: a.color }, rectRadius: 0.05
    });
    slide.addText(a.name, {
      x: x + 0.15, y: 1.25, w: 2.6, h: 0.5, fontSize: 16, bold: true,
      color: C.white, align: 'center', valign: 'middle', fontFace: 'Arial'
    });
    // 설명
    slide.addText(a.desc, {
      x: x + 0.15, y: 1.9, w: 2.6, h: 0.7, fontSize: 11,
      color: C.dark, align: 'center', valign: 'middle', fontFace: 'Arial'
    });
    // 장점
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: x + 0.15, y: 2.75, w: 2.6, h: 0.3, fill: { color: C.accent1 }
    });
    slide.addText('장점', {
      x: x + 0.15, y: 2.75, w: 2.6, h: 0.3, fontSize: 10, bold: true,
      color: C.white, align: 'center', valign: 'middle', fontFace: 'Arial'
    });
    slide.addText(a.pro, {
      x: x + 0.2, y: 3.15, w: 2.5, h: 0.7, fontSize: 10,
      color: C.dark, align: 'center', fontFace: 'Arial'
    });
    // 단점
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: x + 0.15, y: 4.0, w: 2.6, h: 0.3, fill: { color: C.accent3 }
    });
    slide.addText('단점', {
      x: x + 0.15, y: 4.0, w: 2.6, h: 0.3, fontSize: 10, bold: true,
      color: C.white, align: 'center', valign: 'middle', fontFace: 'Arial'
    });
    slide.addText(a.con, {
      x: x + 0.2, y: 4.4, w: 2.5, h: 0.7, fontSize: 10,
      color: C.dark, align: 'center', fontFace: 'Arial'
    });
  });

  // 화살표 진행 방향
  slide.addText('단순 ───────────────────────────────────▶ 지능적', {
    x: 0.4, y: 6.7, w: 12.5, h: 0.3, fontSize: 11, bold: true,
    color: C.primary, align: 'center', fontFace: 'Arial'
  });
}

// ===== 슬라이드 2: OS-LLM 개념 매핑도 =====
function slide2_conceptMapping() {
  const slide = pptx.addSlide();
  addTitle(slide, '그림 2. OS-LLM 개념 매핑도', '운영체제 스케줄링 개념의 LLM 도메인 적용');

  const mappings = [
    { os: '프로세스', llm: 'LLM API 요청', desc: '스케줄링 단위' },
    { os: 'CPU 시간', llm: 'API 호출 쿼터', desc: '할당 자원' },
    { os: '우선순위', llm: '테넌트 등급', desc: '처리 순서 기준' },
    { os: '스케줄링 알고리즘', llm: '요청 처리 순서', desc: '자원 배분 정책' },
    { os: '선점 (Preemption)', llm: '요청 중단/큐 이동', desc: '긴 요청 제어' },
  ];

  // 헤더: OS 영역
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 1.1, w: 4, h: 0.5, fill: { color: C.primary }, rectRadius: 0.05
  });
  slide.addText('OS 스케줄링 개념', {
    x: 0.5, y: 1.1, w: 4, h: 0.5, fontSize: 14, bold: true,
    color: C.white, align: 'center', valign: 'middle', fontFace: 'Arial'
  });

  // 헤더: LLM 영역
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 8.5, y: 1.1, w: 4, h: 0.5, fill: { color: C.accent1 }, rectRadius: 0.05
  });
  slide.addText('LLM API 도메인', {
    x: 8.5, y: 1.1, w: 4, h: 0.5, fontSize: 14, bold: true,
    color: C.white, align: 'center', valign: 'middle', fontFace: 'Arial'
  });

  mappings.forEach((m, i) => {
    const y = 1.9 + i * 0.95;
    // OS 박스
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.5, y, w: 4, h: 0.7, fill: { color: C.light }, rectRadius: 0.05,
      line: { color: C.primary, width: 1.5 }
    });
    slide.addText(m.os, {
      x: 0.5, y, w: 4, h: 0.7, fontSize: 13, bold: true,
      color: C.primary, align: 'center', valign: 'middle', fontFace: 'Arial'
    });
    // 화살표 + 설명
    slide.addText('──▶', {
      x: 4.7, y, w: 1.2, h: 0.35, fontSize: 14, bold: true,
      color: C.accent2, align: 'center', valign: 'middle', fontFace: 'Arial'
    });
    slide.addText(m.desc, {
      x: 4.5, y: y + 0.35, w: 1.6, h: 0.35, fontSize: 9, italic: true,
      color: C.gray, align: 'center', valign: 'middle', fontFace: 'Arial'
    });
    // LLM 박스
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 8.5, y, w: 4, h: 0.7, fill: { color: 'E8F5E9' }, rectRadius: 0.05,
      line: { color: C.accent1, width: 1.5 }
    });
    slide.addText(m.llm, {
      x: 8.5, y, w: 4, h: 0.7, fontSize: 13, bold: true,
      color: C.accent1, align: 'center', valign: 'middle', fontFace: 'Arial'
    });
  });

  // 하단 설명
  slide.addText('핵심 아이디어: OS의 검증된 스케줄링 이론을 LLM API 요청 관리에 적용', {
    x: 0.5, y: 6.6, w: 12, h: 0.4, fontSize: 12, bold: true,
    color: C.titleBg, align: 'center', fontFace: 'Arial'
  });
}

// ===== 슬라이드 3: 시스템 아키텍처 4계층 =====
function slide3_architecture() {
  const slide = pptx.addSlide();
  addTitle(slide, '그림 3. 시스템 아키텍처 (4계층 구조)', 'LLM API 요청 관리 시스템 전체 구조');

  const layers = [
    { name: '클라이언트 계층', detail: 'REST API 클라이언트 · 대시보드', color: '4472C4', y: 1.2 },
    { name: 'API 계층 (Express.js)', detail: '요청 관리 · 스케줄러 관리 · 통계/공정성 · 헬스 체크', color: '548235', y: 2.6 },
    { name: '스케줄러 엔진 (런타임 교체)', detail: 'FCFS | Priority | MLFQ | WFQ | Rate Limiter', color: 'BF8F00', y: 4.0 },
    { name: '저장소 계층', detail: '메모리 배열(큐) · JSON 파일(로그) · Ollama(LLM)', color: '7F6000', y: 5.4 },
  ];

  layers.forEach((l, i) => {
    // 메인 박스
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 1.5, y: l.y, w: 10, h: 1.15, fill: { color: l.color }, rectRadius: 0.1,
      shadow: { type: 'outer', blur: 4, offset: 2, color: '00000040' }
    });
    slide.addText(l.name, {
      x: 1.5, y: l.y + 0.1, w: 10, h: 0.45, fontSize: 16, bold: true,
      color: C.white, align: 'center', valign: 'middle', fontFace: 'Arial'
    });
    slide.addText(l.detail, {
      x: 1.5, y: l.y + 0.55, w: 10, h: 0.45, fontSize: 12,
      color: 'E8E8E8', align: 'center', valign: 'middle', fontFace: 'Arial'
    });

    // 화살표
    if (i < layers.length - 1) {
      slide.addText('▼', {
        x: 6, y: l.y + 1.15, w: 1, h: 0.35, fontSize: 20, bold: true,
        color: C.gray, align: 'center', valign: 'middle', fontFace: 'Arial'
      });
    }
  });

  // 스케줄러 엔진 상세 - 개별 알고리즘 박스
  const scheds = ['FCFS', 'Priority', 'MLFQ', 'WFQ', 'Rate\nLimiter'];
  scheds.forEach((s, i) => {
    const x = 2.0 + i * 1.85;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 4.65, w: 1.6, h: 0.4, fill: { color: 'FFF8E1' }, rectRadius: 0.05,
      line: { color: C.accent2, width: 1 }
    });
    slide.addText(s, {
      x, y: 4.65, w: 1.6, h: 0.4, fontSize: 9, bold: true,
      color: C.accent2, align: 'center', valign: 'middle', fontFace: 'Arial'
    });
  });

  // 핵심 기능 라벨 (우측)
  slide.addText('핵심 기능:\n• 런타임 알고리즘 교체\n• 이중 수준 JFI 측정\n• Aging/Boost 기아 방지', {
    x: 10.2, y: 1.2, w: 2.5, h: 1.5, fontSize: 9,
    color: C.dark, fontFace: 'Arial', line: { color: C.primary, width: 1 },
    fill: { color: 'F5F5F5' }
  });
}

// ===== 슬라이드 4: MLFQ 큐 구조 및 요청 이동 흐름 =====
function slide4_mlfqStructure() {
  const slide = pptx.addSlide();
  addTitle(slide, '그림 4. MLFQ 큐 구조 및 요청 이동 흐름', '4단계 피드백 큐와 선점형 스케줄링');

  const queues = [
    { name: 'Q0 (최고 우선순위)', quantum: '1,000ms', type: 'Short 요청 (신규)', color: '2E7D32' },
    { name: 'Q1', quantum: '3,000ms', type: '중간 길이 요청', color: '558B2F' },
    { name: 'Q2', quantum: '8,000ms', type: '긴 요청', color: 'BF8F00' },
    { name: 'Q3 (최저 우선순위)', quantum: '∞', type: '배치/초장문 요청', color: 'C00000' },
  ];

  // 신규 요청 진입 화살표
  slide.addText('신규 요청 ──▶', {
    x: 0.2, y: 1.3, w: 2, h: 0.4, fontSize: 11, bold: true,
    color: C.accent1, align: 'right', fontFace: 'Arial'
  });

  queues.forEach((q, i) => {
    const y = 1.2 + i * 1.2;
    // 큐 박스
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 2.5, y, w: 6, h: 0.9, fill: { color: C.lightGray }, rectRadius: 0.05,
      line: { color: q.color, width: 2 }
    });
    // 큐 이름 라벨
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 2.5, y, w: 2.2, h: 0.9, fill: { color: q.color }
    });
    slide.addText(q.name, {
      x: 2.5, y, w: 2.2, h: 0.45, fontSize: 11, bold: true,
      color: C.white, align: 'center', valign: 'middle', fontFace: 'Arial'
    });
    slide.addText('TQ: ' + q.quantum, {
      x: 2.5, y: y + 0.45, w: 2.2, h: 0.45, fontSize: 10,
      color: 'E0E0E0', align: 'center', valign: 'middle', fontFace: 'Arial'
    });
    // 요청 유형
    slide.addText(q.type, {
      x: 4.9, y, w: 3.4, h: 0.9, fontSize: 12,
      color: C.dark, align: 'center', valign: 'middle', fontFace: 'Arial'
    });
    // 강등 화살표 (Q0-Q2)
    if (i < 3) {
      slide.addText('▼ 타임 퀀텀 초과 시 강등', {
        x: 8.7, y: y + 0.45, w: 3, h: 0.4, fontSize: 9, italic: true,
        color: C.accent3, align: 'left', fontFace: 'Arial'
      });
    }
  });

  // Boost 메커니즘
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 9.5, y: 1.2, w: 3, h: 1.0, fill: { color: 'E3F2FD' }, rectRadius: 0.1,
    line: { color: C.primary, width: 2, dashType: 'dash' }
  });
  slide.addText('⟳ Boost (5초 주기)\n모든 요청 → Q0 복귀\n기아 방지', {
    x: 9.5, y: 1.2, w: 3, h: 1.0, fontSize: 10, bold: true,
    color: C.primary, align: 'center', valign: 'middle', fontFace: 'Arial'
  });

  // 시간 슬라이스 박스
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 9.5, y: 2.5, w: 3, h: 0.8, fill: { color: 'FFF3E0' }, rectRadius: 0.1,
    line: { color: C.accent2, width: 2 }
  });
  slide.addText('타임 슬라이스: 500ms\n선점형 모드 지원', {
    x: 9.5, y: 2.5, w: 3, h: 0.8, fontSize: 10, bold: true,
    color: C.accent2, align: 'center', valign: 'middle', fontFace: 'Arial'
  });

  // 하단 설명
  slide.addText('OSTEP [2] Rule 1-5 준수: 새 작업→Q0 진입 | 타임 퀀텀 초과→강등 | 주기적 Boost→기아 방지', {
    x: 0.5, y: 6.3, w: 12, h: 0.4, fontSize: 11, italic: true,
    color: C.gray, align: 'center', fontFace: 'Arial'
  });
}

// ===== 슬라이드 5: MLFQ 의사코드 시각화 =====
function slide5_mlfqPseudocode() {
  const slide = pptx.addSlide();
  addTitle(slide, '그림 5. MLFQ 선점 처리 흐름 시각화', '의사코드 1에 대응하는 상태 전이 다이어그램');

  // 상태 박스들
  const states = [
    { name: '① Dequeue', desc: '최상위 비어있지\n않은 큐에서 추출', x: 1, y: 1.5, color: C.primary },
    { name: '② Processing', desc: '요청 처리 시작', x: 4.5, y: 1.5, color: C.accent1 },
    { name: '③ Time Check', desc: '500ms마다\n경과 시간 확인', x: 8, y: 1.5, color: C.accent2 },
    { name: '④ 타임 퀀텀\n   초과?', desc: 'elapsed >= quantum', x: 8, y: 3.5, color: C.accent3 },
    { name: '⑤ 강등', desc: 'queueLevel + 1\n하위 큐로 이동', x: 4.5, y: 3.5, color: C.accent3 },
    { name: '⑥ 완료', desc: '응답 반환', x: 4.5, y: 5.5, color: '2E7D32' },
  ];

  states.forEach(s => {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: s.x, y: s.y, w: 2.8, h: 1.3, fill: { color: C.lightGray }, rectRadius: 0.1,
      line: { color: s.color, width: 2 }
    });
    slide.addText(s.name, {
      x: s.x, y: s.y + 0.05, w: 2.8, h: 0.55, fontSize: 12, bold: true,
      color: s.color, align: 'center', valign: 'middle', fontFace: 'Arial'
    });
    slide.addText(s.desc, {
      x: s.x, y: s.y + 0.6, w: 2.8, h: 0.6, fontSize: 9,
      color: C.dark, align: 'center', valign: 'middle', fontFace: 'Arial'
    });
  });

  // 화살표 텍스트
  slide.addText('→', { x: 3.4, y: 1.8, w: 0.8, h: 0.5, fontSize: 24, bold: true,
    color: C.gray, align: 'center', fontFace: 'Arial' });
  slide.addText('→', { x: 6.9, y: 1.8, w: 0.8, h: 0.5, fontSize: 24, bold: true,
    color: C.gray, align: 'center', fontFace: 'Arial' });
  slide.addText('▼', { x: 8.8, y: 2.85, w: 0.8, h: 0.5, fontSize: 20, bold: true,
    color: C.gray, align: 'center', fontFace: 'Arial' });

  // Yes/No 분기
  slide.addText('Yes ←', { x: 7.0, y: 3.85, w: 1, h: 0.3, fontSize: 10, bold: true,
    color: C.accent3, align: 'center', fontFace: 'Arial' });
  slide.addText('No (계속 처리)', { x: 10.5, y: 3.7, w: 2.5, h: 0.3, fontSize: 10, bold: true,
    color: C.accent1, align: 'center', fontFace: 'Arial' });

  // ⑤ → ① 복귀 화살표 설명
  slide.addText('← 다음 요청 처리 (①로 복귀)', {
    x: 1, y: 3.85, w: 3.3, h: 0.3, fontSize: 10, italic: true,
    color: C.primary, align: 'center', fontFace: 'Arial'
  });

  // ② → ⑥ 완료 화살표
  slide.addText('▼ 처리 완료', { x: 5.1, y: 4.95, w: 1.5, h: 0.4, fontSize: 10,
    color: '2E7D32', align: 'center', fontFace: 'Arial' });
}

// ===== 슬라이드 6: 알고리즘별 성능 비교 차트 =====
function slide6_performanceChart() {
  const slide = pptx.addSlide();
  addTitle(slide, '그림 6. 알고리즘별 성능 비교', '100건 요청 실험 결과 (25-2학기)');

  // 바 차트 시각화 (텍스트 기반)
  const data = [
    { name: 'FCFS', value: 2572, color: C.secondary, pct: 100 },
    { name: 'Priority', value: 2826, color: C.accent1, pct: 100 },
    { name: 'MLFQ', value: 2572, color: C.accent2, pct: 100 },
    { name: 'WFQ', value: 2819, color: C.primary, pct: 100 },
  ];

  // 좌측: 전체 평균 대기시간 비교
  slide.addText('평균 대기시간 (ms)', {
    x: 0.3, y: 1.1, w: 6, h: 0.4, fontSize: 14, bold: true,
    color: C.dark, fontFace: 'Arial'
  });

  const maxVal = 3000;
  data.forEach((d, i) => {
    const y = 1.8 + i * 0.85;
    const barW = (d.value / maxVal) * 5.5;
    slide.addText(d.name, {
      x: 0.3, y, w: 1.3, h: 0.55, fontSize: 12, bold: true,
      color: C.dark, align: 'right', valign: 'middle', fontFace: 'Arial'
    });
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 1.8, y: y + 0.05, w: barW, h: 0.45, fill: { color: d.color }, rectRadius: 0.05
    });
    slide.addText(d.value + 'ms', {
      x: 1.8 + barW + 0.1, y, w: 1.5, h: 0.55, fontSize: 11,
      color: C.dark, valign: 'middle', fontFace: 'Arial'
    });
  });

  // 우측: 핵심 발견 카드
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 7.5, y: 1.1, w: 5, h: 5.0, fill: { color: C.lightGray }, rectRadius: 0.1,
    line: { color: C.primary, width: 1.5 }
  });
  slide.addText('핵심 발견 (Key Findings)', {
    x: 7.5, y: 1.15, w: 5, h: 0.4, fontSize: 13, bold: true,
    color: C.primary, align: 'center', fontFace: 'Arial'
  });

  const findings = [
    { label: 'RQ1', text: 'URGENT 요청\nFCFS 대비 62% 감소\n(1,122ms, d=0.78)', color: C.accent1 },
    { label: 'RQ2', text: 'Short 요청\n73.78% 개선\n(10 시드, CI:[72.36,75.20])', color: C.accent2 },
    { label: 'RQ3', text: 'Ent:849ms vs Free:4,894ms\n5.8배 차이, JFI=0.89', color: C.primary },
  ];

  findings.forEach((f, i) => {
    const y = 1.75 + i * 1.5;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 7.7, y, w: 1.2, h: 1.1, fill: { color: f.color }, rectRadius: 0.05
    });
    slide.addText(f.label, {
      x: 7.7, y, w: 1.2, h: 1.1, fontSize: 14, bold: true,
      color: C.white, align: 'center', valign: 'middle', fontFace: 'Arial'
    });
    slide.addText(f.text, {
      x: 9.1, y, w: 3.2, h: 1.1, fontSize: 10,
      color: C.dark, valign: 'middle', fontFace: 'Arial'
    });
  });

  // WFQ 테넌트별 비교 (하단)
  slide.addText('WFQ 테넌트별 평균 대기시간', {
    x: 0.3, y: 5.0, w: 6, h: 0.35, fontSize: 12, bold: true,
    color: C.dark, fontFace: 'Arial'
  });

  const tenants = [
    { name: 'Enterprise(100)', value: 849, color: '1B5E20' },
    { name: 'Premium(50)', value: 1520, color: '558B2F' },
    { name: 'Standard(10)', value: 3120, color: C.accent2 },
    { name: 'Free(1)', value: 4894, color: C.accent3 },
  ];

  tenants.forEach((t, i) => {
    const y = 5.5 + i * 0.45;
    const barW = (t.value / 5000) * 4.5;
    slide.addText(t.name, {
      x: 0.3, y, w: 2, h: 0.35, fontSize: 9,
      color: C.dark, align: 'right', valign: 'middle', fontFace: 'Arial'
    });
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 2.5, y: y + 0.04, w: barW, h: 0.27, fill: { color: t.color }
    });
    slide.addText(t.value + 'ms', {
      x: 2.5 + barW + 0.1, y, w: 1.2, h: 0.35, fontSize: 9,
      color: C.dark, valign: 'middle', fontFace: 'Arial'
    });
  });
}

// ===== 슬라이드 7: 다중 시드 실험 결과 =====
function slide7_multiSeedResults() {
  const slide = pptx.addSlide();
  addTitle(slide, '그림 7. 다중 시드 실험 결과 및 신뢰구간', 'MLFQ Short 요청 개선율 통계적 검증 (10 seeds × 500 requests)');

  // 통계 요약 박스 (좌측)
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 1.2, w: 5, h: 3.5, fill: { color: C.lightGray }, rectRadius: 0.1,
    line: { color: C.primary, width: 2 }
  });
  slide.addText('MLFQ Short 요청 개선율 통계', {
    x: 0.5, y: 1.25, w: 5, h: 0.4, fontSize: 14, bold: true,
    color: C.primary, align: 'center', fontFace: 'Arial'
  });

  const stats = [
    ['평균 개선율', '73.78%', C.accent1],
    ['표준편차', '1.98%', C.dark],
    ['95% 신뢰구간', '[72.36, 75.20]', C.primary],
    ['변동계수 (CV)', '2.68%', C.dark],
    ['p-value', '< 0.001', C.accent3],
    ["Cohen's d", '15.905', C.accent2],
  ];

  stats.forEach((s, i) => {
    const y = 1.85 + i * 0.45;
    slide.addText(s[0], {
      x: 0.8, y, w: 2.4, h: 0.35, fontSize: 11,
      color: C.gray, align: 'left', valign: 'middle', fontFace: 'Arial'
    });
    slide.addText(s[1], {
      x: 3.3, y, w: 2, h: 0.35, fontSize: 13, bold: true,
      color: s[2], align: 'center', valign: 'middle', fontFace: 'Arial'
    });
  });

  // 시드별 개선율 바 차트 (우측)
  slide.addText('시드별 개선율 분포', {
    x: 6.5, y: 1.1, w: 6, h: 0.4, fontSize: 14, bold: true,
    color: C.dark, fontFace: 'Arial'
  });

  const seeds = [
    { seed: '12345', pct: 76.11 },
    { seed: '42', pct: 73.25 },
    { seed: '7777', pct: 72.84 },
    { seed: '99999', pct: 74.92 },
    { seed: '31415', pct: 71.56 },
    { seed: '27182', pct: 73.10 },
    { seed: '65535', pct: 75.33 },
    { seed: '11111', pct: 72.98 },
    { seed: '54321', pct: 74.15 },
    { seed: '88888', pct: 73.56 },
  ];

  seeds.forEach((s, i) => {
    const y = 1.7 + i * 0.44;
    const barW = ((s.pct - 70) / 10) * 4.5;
    slide.addText('Seed ' + s.seed, {
      x: 6.0, y, w: 1.8, h: 0.35, fontSize: 8,
      color: C.dark, align: 'right', valign: 'middle', fontFace: 'Arial'
    });
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 8.0, y: y + 0.05, w: barW, h: 0.25, fill: { color: C.accent1 }
    });
    slide.addText(s.pct.toFixed(2) + '%', {
      x: 8.0 + barW + 0.05, y, w: 1.2, h: 0.35, fontSize: 8,
      color: C.dark, valign: 'middle', fontFace: 'Arial'
    });
  });

  // 평균선 표시
  const avgBarW = ((73.78 - 70) / 10) * 4.5;
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 8.0 + avgBarW, y: 1.65, w: 0.03, h: 4.55, fill: { color: C.accent3 }
  });
  slide.addText('평균 73.78%', {
    x: 8.0 + avgBarW - 0.5, y: 6.2, w: 1.5, h: 0.3, fontSize: 9, bold: true,
    color: C.accent3, align: 'center', fontFace: 'Arial'
  });

  // 해석 (하단)
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 5.4, w: 5, h: 1.4, fill: { color: 'E8F5E9' }, rectRadius: 0.1,
    line: { color: C.accent1, width: 1.5 }
  });
  slide.addText('해석:\n• CV 2.68% → 시드 무관 안정적 재현성\n• Cohen\'s d = 15.905 → 매우 큰 효과 크기\n• 모든 시드에서 70% 이상 개선 달성', {
    x: 0.7, y: 5.5, w: 4.6, h: 1.2, fontSize: 10,
    color: C.dark, fontFace: 'Arial'
  });
}

// ===== 생성 실행 =====
slide1_algorithmComparison();
slide2_conceptMapping();
slide3_architecture();
slide4_mlfqStructure();
slide5_mlfqPseudocode();
slide6_performanceChart();
slide7_multiSeedResults();

pptx.writeFile({ fileName: 'midterm-figures.pptx' })
  .then(() => console.log('Created: midterm-figures.pptx'))
  .catch(err => console.error('Error:', err));
