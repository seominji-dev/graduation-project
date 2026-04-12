/**
 * Final Report Figure Generation Script
 * Generates 9 figures as individual PPTX files + PNG screenshots
 *
 * Usage: node generate-final-figures.js
 * Output: fig-1 ~ fig-8 (PPTX + PNG each)
 */

const PptxGenJS = require('pptxgenjs');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = __dirname;

// Common style constants - must match midterm style
const COLORS = {
  primary:   '2563EB',   // blue
  secondary: '64748B',   // gray
  accent:    '059669',   // green
  warning:   'D97706',   // orange
  light:     'F1F5F9',   // light gray
  white:     'FFFFFF',
  black:     '1E293B',
  border:    'CBD5E1',
  danger:    'DC2626',   // red
  q0:        '2563EB',   // MLFQ queue colors
  q1:        '3B82F6',
  q2:        '60A5FA',
  q3:        '93C5FD',
};

const FONT       = '맑은 고딕';
const TITLE_SIZE = 18;
const BODY_SIZE  = 11;
const SMALL_SIZE = 9;

// ─── Fig 1: 시스템 아키텍처 (System Architecture) ───
// Added Rate Limiter between API and Scheduler layers

function createFig1(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 1. 시스템 아키텍처 (System Architecture)', {
    x: 0.3, y: 0.1, w: 9.4, h: 0.5,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });

  const layers = [
    {
      name: '클라이언트 계층 (Client)',
      color: COLORS.primary,
      y: 0.75,
      subs: ['REST Client', '대시보드 (Dashboard)']
    },
    {
      name: 'API 계층 (Express.js)',
      color: COLORS.accent,
      y: 1.75,
      subs: ['요청 접수', '스케줄러 전환', '통계 조회']
    },
    {
      // NEW: Rate Limiter between API and Scheduler
      name: '요청 제한 계층 (Rate Limiter)',
      color: COLORS.danger,
      y: 2.75,
      subs: ['구독 등급 확인', '토큰 버킷 제어', '429 응답']
    },
    {
      name: '스케줄러 계층 (Scheduler)',
      color: COLORS.warning,
      y: 3.75,
      subs: ['FCFS', 'Priority', 'MLFQ', 'WFQ']
    },
    {
      name: '저장소/LLM 계층 (Storage/LLM)',
      color: COLORS.secondary,
      y: 4.75,
      subs: ['메모리 큐', 'JSON 로그', 'Ollama LLM']
    },
  ];

  const layerH = 0.82;
  layers.forEach(layer => {
    // Layer box
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.6, y: layer.y, w: 8.8, h: layerH,
      fill: { color: layer.color, transparency: 88 },
      line: { color: layer.color, width: 2 },
      rectRadius: 0.1
    });
    // Layer name label
    slide.addText(layer.name, {
      x: 0.8, y: layer.y + 0.05, w: 3.0, h: 0.3,
      fontSize: 10, fontFace: FONT, bold: true, color: layer.color
    });

    // Sub-component boxes
    const subCount = layer.subs.length;
    const subW = subCount === 4 ? 1.7 : (subCount === 3 ? 2.2 : 2.8);
    const totalSubW = subCount * subW + (subCount - 1) * 0.2;
    const startX = 0.8 + (8.3 - totalSubW) / 2;

    layer.subs.forEach((sub, i) => {
      const sx = startX + i * (subW + 0.2);
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: sx, y: layer.y + 0.36, w: subW, h: 0.38,
        fill: { color: COLORS.white },
        line: { color: layer.color, width: 1.2 },
        rectRadius: 0.05
      });
      slide.addText(sub, {
        x: sx, y: layer.y + 0.36, w: subW, h: 0.38,
        fontSize: SMALL_SIZE, fontFace: FONT, color: layer.color,
        align: 'center', valign: 'middle', bold: true
      });
    });
  });

  // Arrows between layers
  for (let i = 0; i < layers.length - 1; i++) {
    const arrowY = layers[i].y + layerH;
    // Down arrow (request)
    slide.addShape(pptx.shapes.DOWN_ARROW, {
      x: 4.25, y: arrowY, w: 0.4, h: 0.2,
      fill: { color: layers[i].color }
    });
    slide.addText('요청', {
      x: 3.65, y: arrowY - 0.02, w: 0.55, h: 0.22,
      fontSize: 7, fontFace: FONT, color: layers[i].color, align: 'center', valign: 'middle'
    });
    // Up arrow (response)
    slide.addShape(pptx.shapes.UP_ARROW, {
      x: 5.35, y: arrowY, w: 0.4, h: 0.2,
      fill: { color: layers[i + 1].color }
    });
    slide.addText('응답', {
      x: 5.8, y: arrowY - 0.02, w: 0.55, h: 0.22,
      fontSize: 7, fontFace: FONT, color: layers[i + 1].color, align: 'center', valign: 'middle'
    });
  }
}

// ─── Fig 2: 데이터 흐름도 (Data Flow) ───
// Includes Rate Limiter step (new vs midterm)

function createFig2(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 2. 데이터 흐름도 (Data Flow)', {
    x: 0.3, y: 0.1, w: 9.4, h: 0.5,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });

  // Steps: numbered with arrows - 7 steps total
  const steps = [
    { label: '1. 요청 전송', detail: 'POST /api/requests', color: COLORS.primary },
    { label: '2. 입력 검증', detail: 'API 계층 처리', color: COLORS.accent },
    { label: '3. Rate Limiter\n(구독 등급 확인)', detail: '429 or PASS', color: COLORS.danger },
    { label: '4. 큐 등록', detail: 'enqueue()', color: COLORS.warning },
    { label: '5. 스케줄링', detail: 'dequeue()', color: COLORS.warning },
    { label: '6. LLM 처리', detail: 'Ollama API', color: COLORS.primary },
    { label: '7. 결과 반환\n+ JSON 기록', detail: 'COMPLETED', color: COLORS.accent },
  ];

  // Two rows: steps 1-4 on top, steps 5-7 on bottom-right
  const boxW = 2.0;
  const boxH = 1.1;
  const row1Y = 0.75;
  const row2Y = 2.5;

  // Row 1: steps 1-4
  const row1Steps = steps.slice(0, 4);
  const row1StartX = 0.35;
  const row1Gap = 0.25;

  row1Steps.forEach((step, i) => {
    const x = row1StartX + i * (boxW + row1Gap);
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: row1Y, w: boxW, h: boxH,
      fill: { color: step.color, transparency: 85 },
      line: { color: step.color, width: 1.5 },
      rectRadius: 0.1
    });
    slide.addText(step.label, {
      x, y: row1Y + 0.1, w: boxW, h: 0.5,
      fontSize: 10, fontFace: FONT, bold: true, color: step.color, align: 'center'
    });
    slide.addText(step.detail, {
      x, y: row1Y + 0.65, w: boxW, h: 0.35,
      fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.secondary, align: 'center'
    });
    // Arrow to next (not after last in row)
    if (i < 3) {
      slide.addShape(pptx.shapes.RIGHT_ARROW, {
        x: x + boxW, y: row1Y + 0.35, w: row1Gap, h: 0.28,
        fill: { color: COLORS.border }
      });
    }
  });

  // Down arrow: step4 → row2
  const step4X = row1StartX + 3 * (boxW + row1Gap);
  slide.addShape(pptx.shapes.DOWN_ARROW, {
    x: step4X + boxW / 2 - 0.2, y: row1Y + boxH, w: 0.4, h: row2Y - (row1Y + boxH),
    fill: { color: COLORS.border }
  });

  // Row 2: steps 5-7 (right to left conceptually, left to right visually from step 4's column)
  // Arrange: step5 at rightmost column (aligned with step4), step6, step7 going left
  const row2Steps = steps.slice(4);
  row2Steps.forEach((step, i) => {
    // reversed: step7 is leftmost, step5 is rightmost
    const revI = 2 - i;
    const x = row1StartX + (3 - revI) * (boxW + row1Gap);
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: row2Y, w: boxW, h: boxH,
      fill: { color: step.color, transparency: 85 },
      line: { color: step.color, width: 1.5 },
      rectRadius: 0.1
    });
    slide.addText(step.label, {
      x, y: row2Y + 0.1, w: boxW, h: 0.5,
      fontSize: 10, fontFace: FONT, bold: true, color: step.color, align: 'center'
    });
    slide.addText(step.detail, {
      x, y: row2Y + 0.65, w: boxW, h: 0.35,
      fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.secondary, align: 'center'
    });
  });

  // Arrows row2: step5 ← step6 ← step7 (left arrows going left)
  // step5 is at col 3, step6 at col 2, step7 at col 1
  for (let i = 0; i < 2; i++) {
    const fromX = row1StartX + (3 - i) * (boxW + row1Gap) - row1Gap;
    slide.addShape(pptx.shapes.LEFT_ARROW, {
      x: fromX, y: row2Y + 0.35, w: row1Gap, h: 0.28,
      fill: { color: COLORS.border }
    });
  }

  // Rate Limiter rejection label
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.35, y: row2Y, w: 2.2, h: 1.1,
    fill: { color: COLORS.light },
    line: { color: COLORS.border, width: 1, dashType: 'dash' },
    rectRadius: 0.1
  });
  slide.addText([
    { text: '요청 수명 주기\n', options: { fontSize: 10, bold: true, color: COLORS.black } },
    { text: 'PENDING', options: { fontSize: 9, bold: true, color: COLORS.primary } },
    { text: ' → ', options: { fontSize: 9, color: COLORS.secondary } },
    { text: 'QUEUED\n', options: { fontSize: 9, bold: true, color: COLORS.warning } },
    { text: 'PROCESSING', options: { fontSize: 9, bold: true, color: COLORS.warning } },
    { text: ' → ', options: { fontSize: 9, color: COLORS.secondary } },
    { text: 'COMPLETED', options: { fontSize: 9, bold: true, color: COLORS.accent } },
  ], {
    x: 0.5, y: row2Y + 0.1, w: 2.0, h: 0.95,
    fontFace: FONT, valign: 'middle'
  });

  // Rate Limiter rejection branch (downward dashed line from step 3)
  const rateLimitX = row1StartX + 2 * (boxW + row1Gap);
  slide.addShape(pptx.shapes.DOWN_ARROW, {
    x: rateLimitX + 0.6, y: row1Y + boxH, w: 0.4, h: 0.6,
    fill: { color: COLORS.danger, transparency: 60 }
  });
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: rateLimitX + 0.1, y: row1Y + boxH + 0.65, w: 1.8, h: 0.5,
    fill: { color: COLORS.danger, transparency: 85 },
    line: { color: COLORS.danger, width: 1, dashType: 'dash' },
    rectRadius: 0.07
  });
  slide.addText('429 Too Many\nRequests', {
    x: rateLimitX + 0.1, y: row1Y + boxH + 0.65, w: 1.8, h: 0.5,
    fontSize: 8, fontFace: FONT, color: COLORS.danger, align: 'center', valign: 'middle', bold: true
  });

  // Title for rejection branch
  slide.addText('초과 시 즉시 반환', {
    x: rateLimitX + 1.95, y: row1Y + boxH + 0.8, w: 1.5, h: 0.3,
    fontSize: 7, fontFace: FONT, color: COLORS.danger, italic: true
  });
}

// ─── Fig 3: 알고리즘별 평균 대기시간 비교 (Bar Chart) ───
// Data from extended-results.json (500 requests)

function createFig3(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 3. 알고리즘별 평균 대기시간 비교 (ms)', {
    x: 0.3, y: 0.1, w: 9.4, h: 0.5,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });

  slide.addText('기본 실험 500건 | 4개 테넌트 | 순차 도착', {
    x: 0.3, y: 0.55, w: 9.4, h: 0.28,
    fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.secondary, italic: true
  });

  slide.addChart(pptx.charts.BAR, [
    {
      name: '평균 대기시간 (ms)',
      labels: ['FCFS', 'Priority', 'MLFQ', 'WFQ'],
      values: [12203, 12419, 12203, 11846]
    }
  ], {
    x: 0.5, y: 0.9, w: 9.0, h: 4.2,
    showTitle: false,
    showValue: true,
    dataLabelFontSize: 11,
    catAxisLabelFontSize: 13,
    valAxisLabelFontSize: 10,
    chartColors: [COLORS.primary, COLORS.warning, COLORS.q1, COLORS.accent],
    catGridLine: { style: 'none' },
    valGridLine: { color: 'EEEEEE', style: 'dash', size: 0.5 },
    showLegend: false,
  });

  // Annotation: WFQ is lowest
  slide.addText('WFQ 최소\n11,846ms', {
    x: 7.8, y: 3.5, w: 1.5, h: 0.55,
    fontSize: 9, fontFace: FONT, color: COLORS.accent, bold: true, align: 'center'
  });

  // Data source note
  slide.addText('출처: extended-results.json (시뮬레이션 500건)', {
    x: 0.3, y: 5.3, w: 9.4, h: 0.25,
    fontSize: 8, fontFace: FONT, color: COLORS.secondary, italic: true
  });
}

// ─── Fig 4: MLFQ 선점형 vs FCFS (Grouped Bar Chart) ───
// Grouped bars by request type (Short/Medium/Long)

function createFig4(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 4. MLFQ 선점형 vs FCFS — 요청 유형별 대기시간', {
    x: 0.3, y: 0.1, w: 9.4, h: 0.5,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });
  slide.addText('5회 반복 (다중 시드) | 버스트 패턴 | 단위: 초(s)', {
    x: 0.3, y: 0.55, w: 9.4, h: 0.28,
    fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.secondary, italic: true
  });

  slide.addChart(pptx.charts.BAR, [
    {
      name: 'FCFS',
      labels: ['짧은 요청 (Short)', '중간 요청 (Medium)', '긴 요청 (Long)'],
      values: [635, 645, 650]
    },
    {
      name: 'MLFQ (선점형)',
      labels: ['짧은 요청 (Short)', '중간 요청 (Medium)', '긴 요청 (Long)'],
      values: [170, 729, 1226]
    }
  ], {
    x: 0.5, y: 0.9, w: 8.5, h: 4.0,
    showTitle: false,
    showValue: true,
    dataLabelFontSize: 10,
    catAxisLabelFontSize: 12,
    valAxisLabelFontSize: 10,
    chartColors: ['B0BEC5', COLORS.primary],  // gray for FCFS, blue for MLFQ
    catGridLine: { style: 'none' },
    valGridLine: { color: 'EEEEEE', style: 'dash', size: 0.5 },
    showLegend: true,
    legendPos: 'b',
    legendFontSize: 11,
    barGrouping: 'clustered',
  });

  // Annotation: -73% for short requests
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 7.3, y: 1.2, w: 2.1, h: 0.65,
    fill: { color: COLORS.danger, transparency: 85 },
    line: { color: COLORS.danger, width: 1.5 },
    rectRadius: 0.08
  });
  slide.addText('짧은 요청\n약 73% 감소', {
    x: 7.3, y: 1.2, w: 2.1, h: 0.65,
    fontSize: 10, fontFace: FONT, bold: true, color: COLORS.danger, align: 'center', valign: 'middle'
  });
}

// ─── Fig 5: 실서버 구독 등급별 평균 대기시간 (Grouped Bar Chart) ───
// Data from ollama-results.json

function createFig5(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 5. 실서버 구독 등급별 평균 대기시간 (ms)', {
    x: 0.3, y: 0.1, w: 9.4, h: 0.5,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });
  slide.addText('Ollama 실서버 실험 20건 | 단위: ms', {
    x: 0.3, y: 0.55, w: 9.4, h: 0.28,
    fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.secondary, italic: true
  });

  slide.addChart(pptx.charts.BAR, [
    {
      name: 'FCFS',
      labels: ['Enterprise', 'Premium', 'Standard', 'Free'],
      values: [232, 810, 1414, 2024]
    },
    {
      name: 'Priority',
      labels: ['Enterprise', 'Premium', 'Standard', 'Free'],
      values: [379, 755, 1427, 1887]
    },
    {
      name: 'WFQ',
      labels: ['Enterprise', 'Premium', 'Standard', 'Free'],
      values: [241, 821, 1392, 1985]
    }
  ], {
    x: 0.5, y: 0.9, w: 9.0, h: 4.0,
    showTitle: false,
    showValue: true,
    dataLabelFontSize: 9,
    catAxisLabelFontSize: 12,
    valAxisLabelFontSize: 10,
    chartColors: [COLORS.secondary, COLORS.warning, COLORS.accent],
    catGridLine: { style: 'none' },
    valGridLine: { color: 'EEEEEE', style: 'dash', size: 0.5 },
    showLegend: true,
    legendPos: 'b',
    legendFontSize: 11,
    barGrouping: 'clustered',
  });

  // Note: Enterprise gets best treatment
  slide.addText('Enterprise 등급: 모든 스케줄러에서 최소 대기시간 확인', {
    x: 0.3, y: 5.2, w: 9.4, h: 0.25,
    fontSize: 9, fontFace: FONT, color: COLORS.secondary, italic: true
  });
}

// ─── Fig 6: 알고리즘별 JFI 비교 (Bar Chart) ───
// JFI scale 0-1, WFQ distinct color

function createFig6(pptx) {
  const slide = pptx.addSlide();
  slide.addText("그림 6. 알고리즘별 Jain's Fairness Index (JFI) 비교", {
    x: 0.3, y: 0.1, w: 9.4, h: 0.5,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });
  slide.addText('JFI = 1.0이 완전 공정, 낮을수록 불공평', {
    x: 0.3, y: 0.55, w: 9.4, h: 0.28,
    fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.secondary, italic: true
  });

  slide.addChart(pptx.charts.BAR, [
    {
      name: "JFI (Jain's Fairness Index)",
      labels: ['FCFS', 'Priority', 'MLFQ', 'WFQ'],
      values: [1.000, 1.000, 1.000, 0.316]
    }
  ], {
    x: 0.5, y: 0.9, w: 9.0, h: 4.2,
    showTitle: false,
    showValue: true,
    dataLabelFontSize: 12,
    catAxisLabelFontSize: 13,
    valAxisLabelFontSize: 10,
    valAxisMinVal: 0,
    valAxisMaxVal: 1.2,
    chartColors: [COLORS.accent, COLORS.accent, COLORS.accent, COLORS.danger],
    catGridLine: { style: 'none' },
    valGridLine: { color: 'EEEEEE', style: 'dash', size: 0.5 },
    showLegend: false,
  });

  // WFQ annotation
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.8, y: 3.4, w: 2.6, h: 0.8,
    fill: { color: COLORS.danger, transparency: 85 },
    line: { color: COLORS.danger, width: 1.5 },
    rectRadius: 0.1
  });
  slide.addText('WFQ: JFI = 0.316\n차등 서비스로 공정성 낮음', {
    x: 6.8, y: 3.4, w: 2.6, h: 0.8,
    fontSize: 9, fontFace: FONT, color: COLORS.danger, align: 'center', valign: 'middle', bold: true
  });

  // Reference line label for "완전 공정"
  slide.addText('━━ 완전 공정 (JFI = 1.0)', {
    x: 0.5, y: 5.25, w: 3.0, h: 0.25,
    fontSize: 9, fontFace: FONT, color: COLORS.accent, bold: false
  });
}

// ─── Fig 7: 알고리즘 특성 비교 요약 (Table/Matrix) ───

function createFig7(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 7. 알고리즘 특성 비교 요약', {
    x: 0.3, y: 0.1, w: 9.4, h: 0.5,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });

  // Table data
  const headers = ['알고리즘', '차등 서비스', '공정성 (JFI)', '적합 상황'];
  const rows = [
    ['FCFS',     'X',              '1.000',    '단순 환경'],
    ['Priority', '우선순위 기반',  '1.000',    '긴급 요청 처리'],
    ['MLFQ',     '실행시간 기반',  '1.000',    '짧은 요청 우선'],
    ['WFQ',      '구독 등급 기반', '0.316',    '등급별 차등 서비스'],
  ];

  const rowColors = [COLORS.primary, COLORS.warning, COLORS.q1, COLORS.accent];
  const colWidths = [1.6, 2.4, 1.8, 3.0];
  const tableX = 0.5;
  const headerY = 0.8;
  const rowH = 0.9;
  const colGap = 0.05;

  // Header row
  headers.forEach((h, ci) => {
    const cx = tableX + colWidths.slice(0, ci).reduce((a, b) => a + b + colGap, 0);
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: cx, y: headerY, w: colWidths[ci], h: 0.45,
      fill: { color: COLORS.black },
      line: { style: 'none' }
    });
    slide.addText(h, {
      x: cx, y: headerY, w: colWidths[ci], h: 0.45,
      fontSize: 11, fontFace: FONT, bold: true, color: COLORS.white,
      align: 'center', valign: 'middle'
    });
  });

  // Data rows
  rows.forEach((row, ri) => {
    const ry = headerY + 0.45 + ri * (rowH + 0.06);
    const rowColor = rowColors[ri];

    row.forEach((cell, ci) => {
      const cx = tableX + colWidths.slice(0, ci).reduce((a, b) => a + b + colGap, 0);
      const isAlgo = ci === 0;
      const isJFI  = ci === 2;

      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: cx, y: ry, w: colWidths[ci], h: rowH,
        fill: { color: isAlgo ? rowColor : COLORS.light, transparency: isAlgo ? 88 : 0 },
        line: { color: isAlgo ? rowColor : COLORS.border, width: isAlgo ? 2 : 1 },
        rectRadius: 0.05
      });

      // Special styling for JFI column
      const jfiBad = isJFI && cell === '0.316';
      slide.addText(cell, {
        x: cx, y: ry, w: colWidths[ci], h: rowH,
        fontSize: isAlgo ? 13 : 11,
        fontFace: FONT,
        bold: isAlgo || jfiBad,
        color: isAlgo ? rowColor : (jfiBad ? COLORS.danger : COLORS.black),
        align: 'center', valign: 'middle'
      });
    });
  });

  // Legend
  slide.addText('JFI: 1.000 = 완전 공정 (모든 요청 동등 처리) | 0.316 = 차등 서비스 적용', {
    x: 0.5, y: 5.3, w: 9.0, h: 0.25,
    fontSize: 8, fontFace: FONT, color: COLORS.secondary, italic: true
  });
}

// ─── Fig 8: 스케줄링 알고리즘 개념 비교 (Concept Diagram) ───
// 4 mini-diagrams: FCFS, Priority, MLFQ, WFQ

function createFig8(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 8. 스케줄링 알고리즘 개념 비교', {
    x: 0.3, y: 0.1, w: 9.4, h: 0.5,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });

  // 2x2 grid layout
  const cells = [
    { algo: 'FCFS', color: COLORS.primary,   x: 0.3,  y: 0.75, desc: '도착 순서대로 처리\n선착순 단순 대기열' },
    { algo: 'Priority', color: COLORS.warning, x: 5.1, y: 0.75, desc: '우선순위 높은 요청 선처리\n(urgent → high → normal → low)' },
    { algo: 'MLFQ', color: COLORS.q0,          x: 0.3,  y: 3.2,  desc: '짧은 요청은 상위 큐 유지\n긴 요청은 하위 큐로 강등' },
    { algo: 'WFQ',  color: COLORS.accent,       x: 5.1,  y: 3.2,  desc: '가중치 비율로 시간 할당\nEnterprise가 Free보다 100배 우선' },
  ];

  cells.forEach(cell => {
    const cw = 4.6;
    const ch = 2.3;

    // Cell background
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: cell.x, y: cell.y, w: cw, h: ch,
      fill: { color: cell.color, transparency: 93 },
      line: { color: cell.color, width: 2 },
      rectRadius: 0.12
    });

    // Algorithm name
    slide.addText(cell.algo, {
      x: cell.x + 0.15, y: cell.y + 0.1, w: cw - 0.3, h: 0.38,
      fontSize: 14, fontFace: FONT, bold: true, color: cell.color
    });

    // Description
    slide.addText(cell.desc, {
      x: cell.x + 0.15, y: cell.y + 0.45, w: cw - 0.3, h: 0.5,
      fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.secondary, italic: true
    });

    // Visual representation per algorithm
    if (cell.algo === 'FCFS') {
      // Simple queue: R1→R2→R3→ process
      ['R1','R2','R3','R4'].forEach((r, i) => {
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: cell.x + 0.2 + i * 0.85, y: cell.y + 1.05, w: 0.7, h: 0.55,
          fill: { color: cell.color, transparency: 75 },
          line: { color: cell.color, width: 1 }
        });
        slide.addText(r, {
          x: cell.x + 0.2 + i * 0.85, y: cell.y + 1.05, w: 0.7, h: 0.55,
          fontSize: SMALL_SIZE, fontFace: FONT, color: cell.color, align: 'center', valign: 'middle', bold: true
        });
      });
      slide.addShape(pptx.shapes.RIGHT_ARROW, {
        x: cell.x + 3.6, y: cell.y + 1.15, w: 0.5, h: 0.35,
        fill: { color: cell.color }
      });
      slide.addText('처리', {
        x: cell.x + 3.6, y: cell.y + 1.55, w: 0.5, h: 0.25,
        fontSize: 8, fontFace: FONT, color: COLORS.secondary, align: 'center'
      });

    } else if (cell.algo === 'Priority') {
      // Priority queue
      const plevels = [
        { label: 'URG', color: COLORS.danger },
        { label: 'HIGH', color: COLORS.warning },
        { label: 'NORM', color: COLORS.accent },
        { label: 'LOW', color: COLORS.secondary },
      ];
      plevels.forEach((p, i) => {
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: cell.x + 0.2 + i * 1.0, y: cell.y + 1.05, w: 0.85, h: 0.55,
          fill: { color: p.color, transparency: 75 },
          line: { color: p.color, width: 1 }
        });
        slide.addText(p.label, {
          x: cell.x + 0.2 + i * 1.0, y: cell.y + 1.05, w: 0.85, h: 0.55,
          fontSize: SMALL_SIZE, fontFace: FONT, color: p.color, align: 'center', valign: 'middle', bold: true
        });
        // Priority number
        slide.addText(`P${i+1}`, {
          x: cell.x + 0.2 + i * 1.0, y: cell.y + 1.65, w: 0.85, h: 0.2,
          fontSize: 8, fontFace: FONT, color: COLORS.secondary, align: 'center'
        });
      });

    } else if (cell.algo === 'MLFQ') {
      // Multi-level queues with demotion
      const qs = [
        { name: 'Q0 (1초 할당)', color: COLORS.q0, w: 3.8 },
        { name: 'Q1 (3초 할당)', color: COLORS.q1, w: 3.2 },
        { name: 'Q2 (무제한)',   color: COLORS.q2, w: 2.6 },
      ];
      qs.forEach((q, i) => {
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: cell.x + 0.2, y: cell.y + 1.0 + i * 0.4, w: q.w, h: 0.32,
          fill: { color: q.color, transparency: 80 },
          line: { color: q.color, width: 1 }
        });
        slide.addText(q.name, {
          x: cell.x + 0.3, y: cell.y + 1.0 + i * 0.4, w: q.w, h: 0.32,
          fontSize: 8, fontFace: FONT, color: q.color, valign: 'middle'
        });
      });
      // Demotion arrow
      slide.addShape(pptx.shapes.DOWN_ARROW, {
        x: cell.x + 3.9, y: cell.y + 1.1, w: 0.35, h: 0.9,
        fill: { color: COLORS.border }
      });
      slide.addText('강등', {
        x: cell.x + 3.7, y: cell.y + 2.0, w: 0.7, h: 0.22,
        fontSize: 8, fontFace: FONT, color: COLORS.secondary, align: 'center'
      });

    } else if (cell.algo === 'WFQ') {
      // Weighted queues with varying widths
      const wqs = [
        { label: 'Enterprise (w=100)', pct: 1.00 },
        { label: 'Premium (w=50)',     pct: 0.68 },
        { label: 'Standard (w=10)',    pct: 0.40 },
        { label: 'Free (w=1)',         pct: 0.22 },
      ];
      const maxBarW = 3.8;
      wqs.forEach((wq, i) => {
        const bw = wq.pct * maxBarW;
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: cell.x + 0.2, y: cell.y + 1.0 + i * 0.33, w: bw, h: 0.27,
          fill: { color: cell.color, transparency: 72 + i * 5 },
          line: { color: cell.color, width: 1 }
        });
        slide.addText(wq.label, {
          x: cell.x + 0.25, y: cell.y + 1.0 + i * 0.33, w: bw, h: 0.27,
          fontSize: 8, fontFace: FONT, color: cell.color, valign: 'middle'
        });
      });
    }
  });

  // Dividers
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.3, y: 3.08, w: 9.4, h: 0.025,
    fill: { color: COLORS.border }, line: { style: 'none' }
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 4.85, y: 0.75, w: 0.025, h: 4.75,
    fill: { color: COLORS.border }, line: { style: 'none' }
  });
}

// ─── Fig 9: 실험 환경 구성도 (Experiment Setup) ───

function createFig9(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 9. 실험 환경 구성도', {
    x: 0.3, y: 0.1, w: 9.4, h: 0.5,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });

  // Three experiment types side by side
  const experiments = [
    {
      title: '기본 실험',
      detail: '500건, 4테넌트\n순차 도착',
      color: COLORS.primary,
      x: 0.3,
      engine: '시뮬레이션'
    },
    {
      title: 'MLFQ 선점형 실험',
      detail: '500건×5시드\n버스트 패턴',
      color: COLORS.q1,
      x: 3.45,
      engine: '시뮬레이션'
    },
    {
      title: '실서버 실험',
      detail: '20건\nOllama llama3.2',
      color: COLORS.accent,
      x: 6.6,
      engine: 'Ollama LLM'
    },
  ];

  const expW = 3.0;
  const expY = 0.75;

  // Shared "요청 생성" box at top center
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 3.5, y: expY, w: 2.9, h: 0.6,
    fill: { color: COLORS.black },
    line: { style: 'none' },
    rectRadius: 0.1
  });
  slide.addText('요청 생성 (Request Generator)', {
    x: 3.5, y: expY, w: 2.9, h: 0.6,
    fontSize: 10, fontFace: FONT, bold: true, color: COLORS.white,
    align: 'center', valign: 'middle'
  });

  // Arrows from generator to each experiment
  experiments.forEach(exp => {
    const expCenterX = exp.x + expW / 2;
    const genBottom = expY + 0.6;
    const expTop = expY + 1.1;

    // Vertical line + arrow
    slide.addShape(pptx.shapes.DOWN_ARROW, {
      x: expCenterX - 0.18, y: genBottom, w: 0.36, h: expTop - genBottom,
      fill: { color: exp.color, transparency: 40 }
    });
  });

  // Experiment boxes
  experiments.forEach(exp => {
    const ey = expY + 1.1;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: exp.x, y: ey, w: expW, h: 0.95,
      fill: { color: exp.color, transparency: 88 },
      line: { color: exp.color, width: 2 },
      rectRadius: 0.1
    });
    slide.addText(exp.title, {
      x: exp.x, y: ey + 0.05, w: expW, h: 0.38,
      fontSize: 11, fontFace: FONT, bold: true, color: exp.color, align: 'center'
    });
    slide.addText(exp.detail, {
      x: exp.x, y: ey + 0.42, w: expW, h: 0.45,
      fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.secondary, align: 'center', valign: 'middle'
    });
  });

  // Shared "스케줄러" box
  const schedY = expY + 2.35;
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.3, y: schedY, w: 9.4, h: 0.75,
    fill: { color: COLORS.warning, transparency: 88 },
    line: { color: COLORS.warning, width: 2 },
    rectRadius: 0.1
  });
  slide.addText('스케줄러 계층 (Scheduler Layer)', {
    x: 0.5, y: schedY + 0.05, w: 4.0, h: 0.3,
    fontSize: 11, fontFace: FONT, bold: true, color: COLORS.warning
  });
  const algos = ['FCFS', 'Priority', 'MLFQ', 'WFQ'];
  algos.forEach((a, i) => {
    const ax = 2.0 + i * 1.8;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: ax, y: schedY + 0.35, w: 1.5, h: 0.3,
      fill: { color: COLORS.white },
      line: { color: COLORS.warning, width: 1 },
      rectRadius: 0.04
    });
    slide.addText(a, {
      x: ax, y: schedY + 0.35, w: 1.5, h: 0.3,
      fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.warning, align: 'center', valign: 'middle', bold: true
    });
  });

  // Down arrows from experiment boxes to scheduler
  experiments.forEach(exp => {
    const expCenterX = exp.x + expW / 2;
    const expBottom = expY + 1.1 + 0.95;
    slide.addShape(pptx.shapes.DOWN_ARROW, {
      x: expCenterX - 0.18, y: expBottom, w: 0.36, h: schedY - expBottom,
      fill: { color: exp.color, transparency: 40 }
    });
  });

  // Measurement & results section
  const measY = schedY + 0.75;
  slide.addShape(pptx.shapes.DOWN_ARROW, {
    x: 4.85, y: measY, w: 0.3, h: 0.35,
    fill: { color: COLORS.border }
  });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.3, y: measY + 0.38, w: 9.4, h: 0.75,
    fill: { color: COLORS.accent, transparency: 88 },
    line: { color: COLORS.accent, width: 2 },
    rectRadius: 0.1
  });
  slide.addText('결과 측정: 평균 대기시간 · JFI · 요청 유형별 응답시간 · JSON 로그 기록', {
    x: 0.5, y: measY + 0.38, w: 9.0, h: 0.75,
    fontSize: 10, fontFace: FONT, color: COLORS.accent, align: 'center', valign: 'middle'
  });
}

// ══════════════════════════════════════════════════════════
// HTML rendering functions for PNG generation via Playwright
// ══════════════════════════════════════════════════════════

function wrapHtml(body) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1280px; height:720px; background:#FFFFFF; font-family:'Malgun Gothic','맑은 고딕',Arial,sans-serif; overflow:hidden; }
  .title { font-size:20px; font-weight:bold; color:#1E293B; padding:12px 32px 6px; }
  .subtitle { font-size:11px; color:#64748B; font-style:italic; padding:0 32px 8px; }
</style></head><body>${body}</body></html>`;
}

// HTML for Fig1: System Architecture
function htmlFig1() {
  const layers = [
    { name: '클라이언트 계층 (Client)',           color: '#2563EB', subs: ['REST Client', '대시보드 (Dashboard)'] },
    { name: 'API 계층 (Express.js)',              color: '#059669', subs: ['요청 접수', '스케줄러 전환', '통계 조회'] },
    { name: '요청 제한 계층 (Rate Limiter)',       color: '#DC2626', subs: ['구독 등급 확인', '토큰 버킷 제어', '429 응답'] },
    { name: '스케줄러 계층 (Scheduler)',           color: '#D97706', subs: ['FCFS', 'Priority', 'MLFQ', 'WFQ'] },
    { name: '저장소/LLM 계층 (Storage/LLM)',      color: '#64748B', subs: ['메모리 큐', 'JSON 로그', 'Ollama LLM'] },
  ];
  let html = '<div class="title">그림 1. 시스템 아키텍처 (System Architecture)</div>';
  html += '<div style="padding:0 56px; display:flex; flex-direction:column; height:640px; justify-content:center; gap:0;">';
  layers.forEach((layer, idx) => {
    html += `<div style="border:2px solid ${layer.color}; border-radius:10px; padding:10px 18px 12px; background:${layer.color}0D; flex-shrink:0;">`;
    html += `<div style="font-size:13px; font-weight:bold; color:${layer.color}; margin-bottom:8px;">${layer.name}</div>`;
    html += '<div style="display:flex; gap:16px; justify-content:center;">';
    layer.subs.forEach(sub => {
      html += `<div style="border:1.5px solid ${layer.color}; border-radius:6px; padding:8px 22px; background:#fff; font-size:11px; font-weight:bold; color:${layer.color};">${sub}</div>`;
    });
    html += '</div></div>';
    if (idx < layers.length - 1) {
      const nextColor = layers[idx+1].color;
      html += `<div style="display:flex; justify-content:center; align-items:center; gap:28px; padding:4px 0; flex-shrink:0;">`;
      html += `<span style="font-size:9px; color:${layer.color};">요청</span>`;
      html += `<span style="font-size:16px; color:${layer.color};">&#9660;</span>`;
      html += `<span style="font-size:16px; color:${nextColor};">&#9650;</span>`;
      html += `<span style="font-size:9px; color:${nextColor};">응답</span>`;
      html += '</div>';
    }
  });
  html += '</div>';
  return wrapHtml(html);
}

// HTML for Fig2: Data Flow
function htmlFig2() {
  const steps = [
    { label: '1. 요청 전송',                   detail: 'POST /api/requests',  color: '#2563EB' },
    { label: '2. 입력 검증',                   detail: 'API 계층 처리',        color: '#059669' },
    { label: '3. Rate Limiter<br>(구독 등급 확인)', detail: '429 or PASS',     color: '#DC2626' },
    { label: '4. 큐 등록',                     detail: 'enqueue()',           color: '#D97706' },
    { label: '5. 스케줄링',                    detail: 'dequeue()',           color: '#D97706' },
    { label: '6. LLM 처리',                    detail: 'Ollama API',          color: '#2563EB' },
    { label: '7. 결과 반환<br>+ JSON 기록',    detail: 'COMPLETED',          color: '#059669' },
  ];
  let html = '<div class="title">그림 2. 데이터 흐름도 (Data Flow)</div>';
  // Row 1: steps 1-4
  html += '<div style="display:flex; align-items:center; padding:4px 20px; gap:0;">';
  steps.slice(0, 4).forEach((step, i) => {
    html += `<div style="border:1.5px solid ${step.color}; border-radius:8px; padding:8px 6px; background:${step.color}0D; width:175px; text-align:center; flex-shrink:0;">`;
    html += `<div style="font-size:10px; font-weight:bold; color:${step.color};">${step.label}</div>`;
    html += `<div style="font-size:9px; color:#64748B; margin:3px 0;">${step.detail}</div>`;
    html += '</div>';
    if (i < 3) html += '<div style="font-size:18px; color:#CBD5E1; padding:0 2px; flex-shrink:0;">&#9654;</div>';
  });
  html += '</div>';
  // Rate Limiter rejection branch
  html += '<div style="display:flex; padding:0 20px; gap:0;">';
  // spacers for step 1,2
  html += '<div style="width:175px; flex-shrink:0;"></div>';
  html += '<div style="font-size:18px; color:#CBD5E1; padding:0 2px; flex-shrink:0; visibility:hidden;">&#9654;</div>';
  html += '<div style="width:175px; flex-shrink:0;"></div>';
  html += '<div style="font-size:18px; color:#CBD5E1; padding:0 2px; flex-shrink:0; visibility:hidden;">&#9654;</div>';
  // rate limiter rejection
  html += '<div style="display:flex; flex-direction:column; align-items:center; flex-shrink:0;">';
  html += '<div style="font-size:16px; color:#DC2626;">&#9660;</div>';
  html += '<div style="border:1px dashed #DC2626; border-radius:6px; padding:4px 10px; background:#DC26260D; font-size:9px; color:#DC2626; font-weight:bold; white-space:nowrap;">429 Too Many Requests</div>';
  html += '<div style="font-size:8px; color:#64748B; font-style:italic;">초과 시 즉시 반환</div>';
  html += '</div>';
  html += '</div>';
  // Connector: step4 goes down to row2
  html += '<div style="display:flex; justify-content:flex-end; padding-right:298px;">';
  html += '<div style="font-size:18px; color:#CBD5E1;">&#9660;</div>';
  html += '</div>';
  // Row 2: steps 5,6,7 going right to left from step4's column
  html += '<div style="display:flex; align-items:center; padding:0 20px; gap:0; justify-content:flex-end;">';
  steps.slice(4).reverse().forEach((step, i) => {
    if (i > 0) html += '<div style="font-size:18px; color:#CBD5E1; padding:0 2px; flex-shrink:0;">&#9664;</div>';
    html += `<div style="border:1.5px solid ${step.color}; border-radius:8px; padding:8px 6px; background:${step.color}0D; width:175px; text-align:center; flex-shrink:0;">`;
    html += `<div style="font-size:10px; font-weight:bold; color:${step.color};">${step.label}</div>`;
    html += `<div style="font-size:9px; color:#64748B; margin:3px 0;">${step.detail}</div>`;
    html += '</div>';
  });
  html += '</div>';
  // Lifecycle summary
  html += '<div style="margin:6px 20px; border:1px dashed #CBD5E1; border-radius:8px; padding:8px 14px; background:#F1F5F9;">';
  html += '<div style="font-size:11px; font-weight:bold; color:#1E293B; margin-bottom:4px;">요청 수명 주기 (Request Lifecycle)</div>';
  html += '<div style="font-size:10px;">';
  html += '<span style="font-weight:bold; color:#2563EB;">PENDING</span> <span style="color:#64748B;">→</span> ';
  html += '<span style="font-weight:bold; color:#D97706;">QUEUED</span> <span style="color:#64748B;">→</span> ';
  html += '<span style="font-weight:bold; color:#D97706;">PROCESSING</span> <span style="color:#64748B;">→</span> ';
  html += '<span style="font-weight:bold; color:#059669;">COMPLETED</span>';
  html += '</div></div>';
  return wrapHtml(html);
}

// HTML for Fig3: Bar chart - average wait time per algorithm
function htmlFig3() {
  const data = [
    { label: 'FCFS',     value: 12203, color: '#2563EB' },
    { label: 'Priority', value: 12419, color: '#D97706' },
    { label: 'MLFQ',     value: 12203, color: '#3B82F6' },
    { label: 'WFQ',      value: 11846, color: '#059669' },
  ];
  const maxVal = 13000;
  const chartH = 480;

  let html = '<div class="title">그림 3. 알고리즘별 평균 대기시간 비교 (ms)</div>';
  html += '<div class="subtitle">기본 실험 500건 | 4개 테넌트 | 순차 도착 | 출처: extended-results.json</div>';
  html += `<div style="display:flex; align-items:flex-end; gap:48px; padding:0 80px; height:${chartH}px; border-bottom:2px solid #E2E8F0; position:relative;">`;
  // reference line at avg
  const avgMs = Math.round(data.reduce((a,b)=>a+b.value,0)/data.length);
  const refPct = (avgMs / maxVal) * 100;
  html += `<div style="position:absolute; left:80px; right:80px; bottom:${refPct}%; border-top:2px dashed #DC2626; pointer-events:none;"></div>`;
  html += `<div style="position:absolute; right:80px; bottom:${refPct+0.5}%; font-size:11px; color:#DC2626; font-weight:bold;">avg: ${avgMs.toLocaleString()}ms</div>`;
  data.forEach(d => {
    const barH = Math.round((d.value / maxVal) * chartH);
    html += `<div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;">`;
    html += `<div style="font-size:14px; color:${d.color}; font-weight:bold; margin-bottom:6px;">${d.value.toLocaleString()}</div>`;
    html += `<div style="width:80%; height:${barH}px; background:${d.color}; border-radius:6px 6px 0 0;"></div>`;
    html += `</div>`;
  });
  html += '</div>';
  html += '<div style="display:flex; gap:48px; padding:8px 80px;">';
  data.forEach(d => { html += `<div style="flex:1; text-align:center; font-size:14px; font-weight:bold; color:${d.color};">${d.label}</div>`; });
  html += '</div>';
  html += '<div style="padding:6px 80px; font-size:11px; color:#059669; font-weight:bold;">WFQ 최소: 11,846ms</div>';
  return wrapHtml(html);
}

// HTML for Fig4: Grouped bar chart - MLFQ vs FCFS
function htmlFig4() {
  const categories = ['짧은 요청 (Short)', '중간 요청 (Medium)', '긴 요청 (Long)'];
  const fcfs  = [635, 645, 650];
  const mlfq  = [170, 729, 1226];
  const maxVal = 1400;
  const chartH = 420;

  let html = '<div class="title">그림 4. MLFQ 선점형 vs FCFS — 요청 유형별 대기시간</div>';
  html += '<div class="subtitle">5회 반복 (다중 시드) | 버스트 패턴 | 단위: 초(s)</div>';

  html += `<div style="display:flex; align-items:flex-end; gap:48px; padding:0 60px; height:${chartH}px; border-bottom:2px solid #E2E8F0;">`;
  categories.forEach((cat, i) => {
    const fH = Math.round((fcfs[i] / maxVal) * chartH);
    const mH = Math.round((mlfq[i] / maxVal) * chartH);
    html += `<div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; gap:0;">`;
    html += `<div style="display:flex; align-items:flex-end; gap:8px; height:100%; width:100%; justify-content:center;">`;
    // FCFS bar
    html += `<div style="display:flex; flex-direction:column; align-items:center; justify-content:flex-end; flex:1; height:100%;">`;
    html += `<div style="font-size:12px; color:#B0BEC5; font-weight:bold; margin-bottom:3px;">${fcfs[i]}</div>`;
    html += `<div style="width:90%; height:${fH}px; background:#B0BEC5; border-radius:4px 4px 0 0;"></div>`;
    html += `</div>`;
    // MLFQ bar
    html += `<div style="display:flex; flex-direction:column; align-items:center; justify-content:flex-end; flex:1; height:100%;">`;
    html += `<div style="font-size:12px; color:#2563EB; font-weight:bold; margin-bottom:3px;">${mlfq[i]}</div>`;
    html += `<div style="width:90%; height:${mH}px; background:#2563EB; border-radius:4px 4px 0 0;"></div>`;
    html += `</div>`;
    html += `</div></div>`;
  });
  html += '</div>';

  // Category labels
  html += '<div style="display:flex; gap:48px; padding:6px 60px;">';
  categories.forEach((cat, i) => {
    html += `<div style="flex:1; text-align:center; font-size:12px; color:#1E293B;">${cat}</div>`;
  });
  html += '</div>';

  // Legend
  html += '<div style="display:flex; justify-content:center; gap:32px; padding:8px 0;">';
  html += '<div style="display:flex; align-items:center; gap:8px;"><div style="width:20px; height:14px; background:#B0BEC5; border-radius:2px;"></div><span style="font-size:12px; color:#1E293B;">FCFS</span></div>';
  html += '<div style="display:flex; align-items:center; gap:8px;"><div style="width:20px; height:14px; background:#2563EB; border-radius:2px;"></div><span style="font-size:12px; color:#1E293B;">MLFQ (선점형)</span></div>';
  html += '</div>';

  // Annotation
  html += '<div style="text-align:center; font-size:15px; font-weight:bold; color:#DC2626;">짧은 요청: 약 73% 감소 (635s → 170s)</div>';
  return wrapHtml(html);
}

// HTML for Fig5: Grouped bar chart - ollama results by tier
function htmlFig5() {
  const tiers = ['Enterprise', 'Premium', 'Standard', 'Free'];
  const fcfsVals     = [232, 810, 1414, 2024];
  const priorityVals = [379, 755, 1427, 1887];
  const wfqVals      = [241, 821, 1392, 1985];
  const maxVal = 2200;
  const chartH = 400;
  const schedulers = [
    { name: 'FCFS',     vals: fcfsVals,     color: '#64748B' },
    { name: 'Priority', vals: priorityVals, color: '#D97706' },
    { name: 'WFQ',      vals: wfqVals,      color: '#059669' },
  ];

  let html = '<div class="title">그림 5. 실서버 구독 등급별 평균 대기시간 (ms)</div>';
  html += '<div class="subtitle">Ollama 실서버 실험 20건 | 단위: ms</div>';
  html += `<div style="display:flex; align-items:flex-end; gap:36px; padding:0 40px; height:${chartH}px; border-bottom:2px solid #E2E8F0;">`;
  tiers.forEach((tier, ti) => {
    html += `<div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;">`;
    html += `<div style="display:flex; align-items:flex-end; gap:5px; height:100%; width:100%; justify-content:center;">`;
    schedulers.forEach(sch => {
      const bH = Math.round((sch.vals[ti] / maxVal) * chartH);
      html += `<div style="display:flex; flex-direction:column; align-items:center; justify-content:flex-end; flex:1; height:100%;">`;
      html += `<div style="font-size:9px; color:${sch.color}; font-weight:bold; margin-bottom:2px;">${sch.vals[ti]}</div>`;
      html += `<div style="width:80%; height:${bH}px; background:${sch.color}; border-radius:3px 3px 0 0;"></div>`;
      html += `</div>`;
    });
    html += `</div></div>`;
  });
  html += '</div>';
  html += '<div style="display:flex; gap:36px; padding:6px 40px;">';
  tiers.forEach(t => { html += `<div style="flex:1; text-align:center; font-size:12px; font-weight:bold; color:#1E293B;">${t}</div>`; });
  html += '</div>';
  // Legend
  html += '<div style="display:flex; justify-content:center; gap:24px; padding:6px 0;">';
  schedulers.forEach(s => {
    html += `<div style="display:flex; align-items:center; gap:6px;"><div style="width:18px;height:12px;background:${s.color};border-radius:2px;"></div><span style="font-size:11px;color:#1E293B;">${s.name}</span></div>`;
  });
  html += '</div>';
  html += '<div style="padding:4px 40px; font-size:10px; color:#64748B; font-style:italic;">Enterprise 등급: 모든 스케줄러에서 최소 대기시간 확인</div>';
  return wrapHtml(html);
}

// HTML for Fig6: JFI bar chart
function htmlFig6() {
  const data = [
    { label: 'FCFS',     value: 1.000, color: '#059669' },
    { label: 'Priority', value: 1.000, color: '#059669' },
    { label: 'MLFQ',     value: 1.000, color: '#059669' },
    { label: 'WFQ',      value: 0.316, color: '#DC2626' },
  ];
  const maxVal = 1.1;
  const chartH = 450;

  let html = '<div class="title">그림 6. 알고리즘별 Jain\'s Fairness Index (JFI) 비교</div>';
  html += '<div class="subtitle">JFI = 1.0이 완전 공정, 낮을수록 불공평</div>';
  html += `<div style="display:flex; align-items:flex-end; gap:64px; padding:0 100px; height:${chartH}px; border-bottom:2px solid #E2E8F0; position:relative;">`;
  // reference line at 1.0
  const refPct = (1.0 / maxVal) * 100;
  html += `<div style="position:absolute; left:80px; right:80px; bottom:${refPct}%; border-top:2px dashed #059669; pointer-events:none;"></div>`;
  html += `<div style="position:absolute; right:80px; bottom:${refPct+0.5}%; font-size:11px; color:#059669; font-weight:bold;">완전 공정 (JFI = 1.0)</div>`;
  data.forEach(d => {
    const barH = Math.round((d.value / maxVal) * chartH);
    html += `<div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;">`;
    html += `<div style="font-size:16px; color:${d.color}; font-weight:bold; margin-bottom:6px;">${d.value.toFixed(3)}</div>`;
    html += `<div style="width:75%; height:${barH}px; background:${d.color}; border-radius:6px 6px 0 0;"></div>`;
    html += `</div>`;
  });
  html += '</div>';
  html += '<div style="display:flex; gap:64px; padding:8px 100px;">';
  data.forEach(d => { html += `<div style="flex:1; text-align:center; font-size:14px; font-weight:bold; color:${d.color};">${d.label}</div>`; });
  html += '</div>';
  html += '<div style="padding:4px 40px; font-size:12px; font-weight:bold; color:#DC2626;">WFQ: JFI = 0.316 — 차등 서비스로 공정성 낮음 (의도된 설계)</div>';
  return wrapHtml(html);
}

// HTML for Fig7: Algorithm comparison table
function htmlFig7() {
  const rows = [
    { algo: 'FCFS',     color: '#2563EB', diff: 'X',              jfi: '1.000', fit: '단순 환경' },
    { algo: 'Priority', color: '#D97706', diff: '우선순위 기반',  jfi: '1.000', fit: '긴급 요청 처리' },
    { algo: 'MLFQ',     color: '#3B82F6', diff: '실행시간 기반',  jfi: '1.000', fit: '짧은 요청 우선' },
    { algo: 'WFQ',      color: '#059669', diff: '구독 등급 기반', jfi: '0.316', fit: '등급별 차등 서비스' },
  ];

  let html = '<div class="title">그림 7. 알고리즘 특성 비교 요약</div>';
  html += '<div style="padding:8px 40px;">';
  // Header
  html += '<div style="display:flex; background:#1E293B; border-radius:8px 8px 0 0; overflow:hidden;">';
  ['알고리즘', '차등 서비스', '공정성 (JFI)', '적합 상황'].forEach((h, i) => {
    const flexVal = [1.5, 2, 1.5, 2.5][i];
    html += `<div style="flex:${flexVal}; padding:12px 16px; font-size:13px; font-weight:bold; color:#fff; text-align:center;">${h}</div>`;
  });
  html += '</div>';
  // Data rows
  rows.forEach((row, ri) => {
    const bg = ri % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
    html += `<div style="display:flex; background:${bg}; border:1px solid #E2E8F0; border-top:none;">`;
    // Algo col
    html += `<div style="flex:1.5; padding:16px; font-size:15px; font-weight:bold; color:${row.color}; text-align:center; border-right:1px solid #E2E8F0;">${row.algo}</div>`;
    // Diff col
    const diffColor = row.diff === 'X' ? '#94A3B8' : '#1E293B';
    html += `<div style="flex:2; padding:16px; font-size:13px; color:${diffColor}; text-align:center; border-right:1px solid #E2E8F0;">${row.diff}</div>`;
    // JFI col
    const jfiColor = row.jfi === '0.316' ? '#DC2626' : '#059669';
    html += `<div style="flex:1.5; padding:16px; font-size:14px; font-weight:bold; color:${jfiColor}; text-align:center; border-right:1px solid #E2E8F0;">${row.jfi}</div>`;
    // Fit col
    html += `<div style="flex:2.5; padding:16px; font-size:13px; color:#1E293B; text-align:center;">${row.fit}</div>`;
    html += '</div>';
  });
  html += '</div>';
  html += '<div style="padding:8px 40px; font-size:10px; color:#64748B; font-style:italic;">JFI: 1.000 = 완전 공정 (모든 요청 동등 처리) | 0.316 = 차등 서비스 적용</div>';
  return wrapHtml(html);
}

// HTML for Fig8: Algorithm concept diagram
function htmlFig8() {
  let html = '<div class="title">그림 8. 스케줄링 알고리즘 개념 비교</div>';
  html += '<div style="display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:8px; padding:0 20px; height:640px;">';

  // FCFS
  html += '<div style="border:2px solid #2563EB; border-radius:10px; padding:14px; background:#2563EB08;">';
  html += '<div style="font-size:14px; font-weight:bold; color:#2563EB;">FCFS (선착순)</div>';
  html += '<div style="font-size:10px; color:#64748B; font-style:italic; margin:4px 0 10px;">도착 순서대로 처리 — 선착순 단순 대기열</div>';
  html += '<div style="display:flex; align-items:center; gap:0;">';
  ['R1','R2','R3','R4'].forEach(r => {
    html += `<div style="border:1.5px solid #2563EB; background:#2563EB1A; padding:12px 16px; font-size:12px; color:#2563EB; font-weight:bold;">${r}</div>`;
  });
  html += '<div style="font-size:22px; color:#2563EB; margin-left:10px;">&#9654;</div>';
  html += '<div style="font-size:11px; color:#64748B; margin-left:6px;">처리</div>';
  html += '</div></div>';

  // Priority
  html += '<div style="border:2px solid #D97706; border-radius:10px; padding:14px; background:#D977060A;">';
  html += '<div style="font-size:14px; font-weight:bold; color:#D97706;">Priority (우선순위)</div>';
  html += '<div style="font-size:10px; color:#64748B; font-style:italic; margin:4px 0 10px;">우선순위 높은 요청 선처리</div>';
  html += '<div style="display:flex; gap:10px;">';
  [{ n:'URG', c:'#DC2626' }, { n:'HIGH', c:'#EA580C' }, { n:'NORM', c:'#CA8A04' }, { n:'LOW', c:'#65A30D' }].forEach(r => {
    html += `<div style="border:1.5px solid ${r.c}; background:${r.c}1A; padding:12px 16px; font-size:12px; font-weight:bold; color:${r.c};">${r.n}</div>`;
  });
  html += '</div></div>';

  // MLFQ
  html += '<div style="border:2px solid #2563EB; border-radius:10px; padding:14px; background:#2563EB08;">';
  html += '<div style="font-size:14px; font-weight:bold; color:#2563EB;">MLFQ (다단계 피드백 큐)</div>';
  html += '<div style="font-size:10px; color:#64748B; font-style:italic; margin:4px 0 10px;">짧은 요청 우선 + 시간 초과 시 강등</div>';
  html += '<div style="display:flex; gap:16px;">';
  html += '<div style="flex:1;">';
  [{ n:'Q0 (1초 할당)', c:'#2563EB', w:'100%' }, { n:'Q1 (3초 할당)', c:'#3B82F6', w:'80%' }, { n:'Q2 (무제한)', c:'#60A5FA', w:'60%' }].forEach(q => {
    html += `<div style="border:1px solid ${q.c}; background:${q.c}14; padding:8px 12px; margin-bottom:6px; font-size:11px; color:${q.c}; width:${q.w};">${q.n}</div>`;
  });
  html += '</div>';
  html += '<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;">';
  html += '<div style="font-size:22px; color:#CBD5E1;">&#9660;</div>';
  html += '<div style="font-size:10px; color:#64748B; text-align:center;">시간 초과 시<br>강등</div>';
  html += '<div style="font-size:22px; color:#2563EB80;">&#9650;</div>';
  html += '<div style="font-size:10px; font-weight:bold; color:#2563EB;">Boost</div>';
  html += '</div></div></div>';

  // WFQ
  html += '<div style="border:2px solid #059669; border-radius:10px; padding:14px; background:#0596690A;">';
  html += '<div style="font-size:14px; font-weight:bold; color:#059669;">WFQ (가중치 공정 큐잉)</div>';
  html += '<div style="font-size:10px; color:#64748B; font-style:italic; margin:4px 0 10px;">가중치 비율로 시간 할당</div>';
  [
    { n:'Enterprise (w=100)', w:'95%' },
    { n:'Premium (w=50)',     w:'65%' },
    { n:'Standard (w=10)',    w:'38%' },
    { n:'Free (w=1)',         w:'20%' },
  ].forEach((t, i) => {
    const alpha = ['14','19','1E','23'][i];
    html += `<div style="border:1px solid #059669; background:#059669${alpha}; padding:8px 12px; margin-bottom:6px; width:${t.w}; font-size:11px; color:#059669;">${t.n}</div>`;
  });
  html += '</div>';

  html += '</div>';
  return wrapHtml(html);
}

// HTML for Fig9: Experiment setup diagram
function htmlFig9() {
  let html = '<div class="title">그림 9. 실험 환경 구성도</div>';
  html += '<div style="padding:4px 30px; display:flex; flex-direction:column; gap:8px; height:650px;">';

  // Generator box
  html += '<div style="background:#1E293B; color:#fff; padding:12px; border-radius:8px; text-align:center; font-size:13px; font-weight:bold;">요청 생성 (Request Generator)</div>';

  // Down arrows + 3 experiment boxes
  html += '<div style="display:flex; gap:16px;">';
  const exps = [
    { title: '기본 실험', detail: '500건, 4테넌트\n순차 도착', color: '#2563EB', engine: '시뮬레이션' },
    { title: 'MLFQ 선점형 실험', detail: '500건 × 5시드\n버스트 패턴', color: '#3B82F6', engine: '시뮬레이션' },
    { title: '실서버 실험', detail: '20건\nOllama llama3.2', color: '#059669', engine: 'Ollama LLM' },
  ];
  exps.forEach(exp => {
    html += `<div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;">`;
    html += `<div style="font-size:20px; color:${exp.color};">&#9660;</div>`;
    html += `<div style="border:2px solid ${exp.color}; border-radius:8px; padding:12px; background:${exp.color}0D; width:100%; text-align:center;">`;
    html += `<div style="font-size:12px; font-weight:bold; color:${exp.color}; margin-bottom:4px;">${exp.title}</div>`;
    html += `<div style="font-size:11px; color:#64748B; white-space:pre-line;">${exp.detail}</div>`;
    html += `<div style="margin-top:6px; font-size:10px; color:${exp.color}; font-style:italic;">엔진: ${exp.engine}</div>`;
    html += `</div>`;
    html += `<div style="font-size:20px; color:${exp.color};">&#9660;</div>`;
    html += `</div>`;
  });
  html += '</div>';

  // Scheduler box
  html += '<div style="border:2px solid #D97706; border-radius:8px; padding:12px; background:#D977060D;">';
  html += '<div style="font-size:12px; font-weight:bold; color:#D97706; margin-bottom:8px;">스케줄러 계층 (Scheduler Layer)</div>';
  html += '<div style="display:flex; gap:12px;">';
  ['FCFS', 'Priority', 'MLFQ', 'WFQ'].forEach(a => {
    html += `<div style="flex:1; border:1px solid #D97706; border-radius:4px; padding:8px; background:#fff; text-align:center; font-size:12px; font-weight:bold; color:#D97706;">${a}</div>`;
  });
  html += '</div></div>';

  // Arrow down
  html += '<div style="text-align:center; font-size:20px; color:#CBD5E1;">&#9660;</div>';

  // Results box
  html += '<div style="border:2px solid #059669; border-radius:8px; padding:12px; background:#0596690D; text-align:center;">';
  html += '<div style="font-size:12px; color:#059669; font-weight:bold;">결과 측정</div>';
  html += '<div style="font-size:11px; color:#64748B; margin-top:4px;">평균 대기시간 · JFI · 요청 유형별 응답시간 · JSON 로그 기록</div>';
  html += '</div>';

  html += '</div>';
  return wrapHtml(html);
}

// ─── HTML Fig 10: 모듈 구조도 ───
function htmlFig10ModuleStructure() {
  const html = `
    <h2 style="text-align:center; color:#1E293B; font-size:18px; margin-bottom:20px;">
      그림 3. 모듈 구조도 (Module Structure)
    </h2>
    <div style="display:flex; flex-direction:column; align-items:center; gap:18px; padding:10px;">
      <!-- server.js -->
      <div style="background:#EFF6FF; border:2px solid #2563EB; border-radius:8px; padding:10px 30px; font-weight:bold; color:#2563EB; font-size:14px; text-align:center;">
        server.js (진입점)
      </div>
      <div style="color:#CBD5E1; font-size:20px;">▼</div>
      <!-- Modules row -->
      <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
        <div style="background:#ECFDF5; border:2px solid #059669; border-radius:8px; padding:10px 14px; text-align:center; min-width:120px;">
          <div style="font-weight:bold; color:#059669; font-size:12px;">api/</div>
          <div style="color:#059669; font-size:10px; margin-top:4px;">라우터</div>
        </div>
        <div style="background:#FFF7ED; border:2px solid #D97706; border-radius:8px; padding:10px 14px; text-align:center; min-width:120px;">
          <div style="font-weight:bold; color:#D97706; font-size:12px;">schedulers/</div>
          <div style="color:#D97706; font-size:10px; margin-top:4px;">FCFS, Priority,<br>MLFQ, WFQ</div>
        </div>
        <div style="background:#F1F5F9; border:2px solid #64748B; border-radius:8px; padding:10px 14px; text-align:center; min-width:120px;">
          <div style="font-weight:bold; color:#64748B; font-size:12px;">queue/</div>
          <div style="color:#64748B; font-size:10px; margin-top:4px;">메모리 큐</div>
        </div>
        <div style="background:#F1F5F9; border:2px solid #64748B; border-radius:8px; padding:10px 14px; text-align:center; min-width:120px;">
          <div style="font-weight:bold; color:#64748B; font-size:12px;">storage/</div>
          <div style="color:#64748B; font-size:10px; margin-top:4px;">JSON 저장</div>
        </div>
        <div style="background:#FEF2F2; border:2px solid #DC2626; border-radius:8px; padding:10px 14px; text-align:center; min-width:120px;">
          <div style="font-weight:bold; color:#DC2626; font-size:12px;">llm/</div>
          <div style="color:#DC2626; font-size:10px; margin-top:4px;">Ollama 연동</div>
        </div>
      </div>
      <!-- rate-limiter -->
      <div style="display:flex; gap:12px; justify-content:center;">
        <div style="background:#FEF2F2; border:2px solid #DC2626; border-radius:8px; padding:10px 20px; text-align:center;">
          <div style="font-weight:bold; color:#DC2626; font-size:12px;">rate-limiter/</div>
          <div style="color:#DC2626; font-size:10px; margin-top:4px;">요청 제한</div>
        </div>
      </div>
      <!-- tests -->
      <div style="border:2px dashed #CBD5E1; border-radius:8px; padding:8px 30px; text-align:center; color:#64748B; font-size:11px;">
        tests-simple/ (Jest 단위 테스트)
      </div>
      <div style="color:#888; font-size:10px; margin-top:4px;">
        ※ 외부 라이브러리 의존성: Express.js 1개
      </div>
    </div>`;
  return wrapHtml(html);
}

// ─── HTML Fig 10: 모듈 구조도 ───
function htmlFig10ModuleStructure() {
  const html = `
    <h2 style="text-align:center; color:#1E293B; font-size:18px; margin-bottom:20px;">
      그림 3. 모듈 구조도 (Module Structure)
    </h2>
    <div style="display:flex; flex-direction:column; align-items:center; gap:18px; padding:10px;">
      <!-- server.js -->
      <div style="background:#EFF6FF; border:2px solid #2563EB; border-radius:8px; padding:10px 30px; font-weight:bold; color:#2563EB; font-size:14px; text-align:center;">
        server.js (진입점)
      </div>
      <div style="color:#CBD5E1; font-size:20px;">▼</div>
      <!-- Modules row -->
      <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
        <div style="background:#ECFDF5; border:2px solid #059669; border-radius:8px; padding:10px 14px; text-align:center; min-width:120px;">
          <div style="font-weight:bold; color:#059669; font-size:12px;">api/</div>
          <div style="color:#059669; font-size:10px; margin-top:4px;">라우터</div>
        </div>
        <div style="background:#FFF7ED; border:2px solid #D97706; border-radius:8px; padding:10px 14px; text-align:center; min-width:120px;">
          <div style="font-weight:bold; color:#D97706; font-size:12px;">schedulers/</div>
          <div style="color:#D97706; font-size:10px; margin-top:4px;">FCFS, Priority,<br>MLFQ, WFQ</div>
        </div>
        <div style="background:#F1F5F9; border:2px solid #64748B; border-radius:8px; padding:10px 14px; text-align:center; min-width:120px;">
          <div style="font-weight:bold; color:#64748B; font-size:12px;">queue/</div>
          <div style="color:#64748B; font-size:10px; margin-top:4px;">메모리 큐</div>
        </div>
        <div style="background:#F1F5F9; border:2px solid #64748B; border-radius:8px; padding:10px 14px; text-align:center; min-width:120px;">
          <div style="font-weight:bold; color:#64748B; font-size:12px;">storage/</div>
          <div style="color:#64748B; font-size:10px; margin-top:4px;">JSON 저장</div>
        </div>
        <div style="background:#FEF2F2; border:2px solid #DC2626; border-radius:8px; padding:10px 14px; text-align:center; min-width:120px;">
          <div style="font-weight:bold; color:#DC2626; font-size:12px;">llm/</div>
          <div style="color:#DC2626; font-size:10px; margin-top:4px;">Ollama 연동</div>
        </div>
      </div>
      <!-- rate-limiter -->
      <div style="display:flex; gap:12px; justify-content:center;">
        <div style="background:#FEF2F2; border:2px solid #DC2626; border-radius:8px; padding:10px 20px; text-align:center;">
          <div style="font-weight:bold; color:#DC2626; font-size:12px;">rate-limiter/</div>
          <div style="color:#DC2626; font-size:10px; margin-top:4px;">요청 제한</div>
        </div>
      </div>
      <!-- tests -->
      <div style="border:2px dashed #CBD5E1; border-radius:8px; padding:8px 30px; text-align:center; color:#64748B; font-size:11px;">
        tests-simple/ (Jest 단위 테스트)
      </div>
      <div style="color:#888; font-size:10px; margin-top:4px;">
        ※ 외부 라이브러리 의존성: Express.js 1개
      </div>
    </div>`;
  return wrapHtml(html);
}

// ─── PNG generation via Playwright ───

async function generatePNGs() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });

  const figures = [
    { name: 'fig-1-system-architecture', html: htmlFig1() },
    { name: 'fig-2-data-flow',           html: htmlFig2() },
    { name: 'fig-3-avg-wait-time',       html: htmlFig3() },
    { name: 'fig-4-mlfq-vs-fcfs',        html: htmlFig4() },
    { name: 'fig-5-ollama-tier',         html: htmlFig5() },
    { name: 'fig-6-jfi-comparison',      html: htmlFig6() },
    { name: 'fig-7-algo-concepts',       html: htmlFig8() },
    { name: 'fig-8-experiment-setup',    html: htmlFig9() },
    { name: 'fig-9-module-structure',    html: htmlFig10ModuleStructure() },
  ];

  for (const fig of figures) {
    const page = await context.newPage();
    await page.setContent(fig.html, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `${fig.name}.png`),
      type: 'png'
    });
    await page.close();
    console.log(`  PNG: ${fig.name}.png`);
  }

  await browser.close();
}

// ─── Fig 10: 모듈 구조도 (Module Structure) ───

function createFig10ModuleStructure(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 3. 모듈 구조도 (Module Structure)', {
    x: 0.3, y: 0.1, w: 9.4, h: 0.5,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });

  // server.js (top center)
  const serverX = 3.8, serverY = 0.75, boxW = 2.4, boxH = 0.55;
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: serverX, y: serverY, w: boxW, h: boxH,
    fill: { color: COLORS.primary, transparency: 85 },
    line: { color: COLORS.primary, width: 2 }, rectRadius: 0.08
  });
  slide.addText('server.js\n(진입점)', {
    x: serverX, y: serverY, w: boxW, h: boxH,
    fontSize: BODY_SIZE, fontFace: FONT, bold: true, color: COLORS.primary,
    align: 'center', valign: 'middle'
  });

  // Module boxes
  const modules = [
    { name: 'api/\n(라우터)', color: COLORS.accent, x: 0.3, y: 2.0 },
    { name: 'schedulers/\n(FCFS, Priority,\nMLFQ, WFQ)', color: COLORS.warning, x: 2.2, y: 2.0 },
    { name: 'queue/\n(메모리 큐)', color: COLORS.secondary, x: 4.1, y: 2.0 },
    { name: 'storage/\n(JSON 저장)', color: COLORS.secondary, x: 6.0, y: 2.0 },
    { name: 'llm/\n(Ollama 연동)', color: COLORS.danger, x: 7.9, y: 2.0 },
  ];

  const modW = 1.7, modH = 0.9;
  modules.forEach(m => {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: m.x, y: m.y, w: modW, h: modH,
      fill: { color: m.color, transparency: 88 },
      line: { color: m.color, width: 1.5 }, rectRadius: 0.08
    });
    slide.addText(m.name, {
      x: m.x, y: m.y, w: modW, h: modH,
      fontSize: SMALL_SIZE, fontFace: FONT, bold: true, color: m.color,
      align: 'center', valign: 'middle'
    });
  });

  // Arrows from server.js down to each module
  modules.forEach(m => {
    const cx = m.x + modW / 2;
    slide.addShape(pptx.shapes.LINE, {
      x: serverX + boxW / 2, y: serverY + boxH,
      w: cx - (serverX + boxW / 2), h: m.y - serverY - boxH,
      line: { color: COLORS.border, width: 1.5, dashType: 'solid' }
    });
  });

  // Dependency arrow: schedulers → queue
  slide.addText('사용 →', {
    x: 3.55, y: 3.0, w: 0.7, h: 0.25,
    fontSize: 7, fontFace: FONT, color: COLORS.border, align: 'center'
  });

  // Dependency arrow: api → schedulers
  slide.addText('호출 →', {
    x: 1.65, y: 3.0, w: 0.7, h: 0.25,
    fontSize: 7, fontFace: FONT, color: COLORS.border, align: 'center'
  });

  // rate-limiter box (below api)
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.3, y: 3.5, w: modW, h: 0.65,
    fill: { color: COLORS.danger, transparency: 88 },
    line: { color: COLORS.danger, width: 1.5 }, rectRadius: 0.08
  });
  slide.addText('rate-limiter/\n(요청 제한)', {
    x: 0.3, y: 3.5, w: modW, h: 0.65,
    fontSize: SMALL_SIZE, fontFace: FONT, bold: true, color: COLORS.danger,
    align: 'center', valign: 'middle'
  });

  // tests box (below all)
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 2.8, y: 4.3, w: 4.4, h: 0.5,
    fill: { color: COLORS.light },
    line: { color: COLORS.border, width: 1, dashType: 'dash' }, rectRadius: 0.08
  });
  slide.addText('tests-simple/ (Jest 단위 테스트)', {
    x: 2.8, y: 4.3, w: 4.4, h: 0.5,
    fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.secondary,
    align: 'center', valign: 'middle'
  });

  // Legend
  slide.addText('※ 화살표: 의존 관계 (호출 방향)', {
    x: 0.3, y: 5.0, w: 4.0, h: 0.3,
    fontSize: 8, fontFace: FONT, color: COLORS.secondary
  });
}

// ─── Main ───

async function main() {
  console.log('최종보고서 그림 생성 시작...\n');

  const figures = [
    { name: 'fig-1-system-architecture', fn: createFig1 },
    { name: 'fig-2-data-flow',           fn: createFig2 },
    { name: 'fig-3-avg-wait-time',       fn: createFig3 },
    { name: 'fig-4-mlfq-vs-fcfs',        fn: createFig4 },
    { name: 'fig-5-ollama-tier',         fn: createFig5 },
    { name: 'fig-6-jfi-comparison',      fn: createFig6 },
    { name: 'fig-7-algo-concepts',       fn: createFig8 },
    { name: 'fig-8-experiment-setup',    fn: createFig9 },
    { name: 'fig-9-module-structure',    fn: createFig10ModuleStructure },
  ];

  // Generate individual PPTX files
  console.log('PPTX 파일 생성 중...');
  for (const fig of figures) {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';   // 10" x 5.63" landscape
    pptx.author = '서민지 (C235180)';
    pptx.title = fig.name;

    fig.fn(pptx);

    const outputPath = path.join(OUTPUT_DIR, `${fig.name}.pptx`);
    await pptx.writeFile({ fileName: outputPath });
    console.log(`  PPTX: ${fig.name}.pptx`);
  }

  // Combined PPTX (all slides in one file)
  console.log('\n통합 PPTX 생성 중...');
  const allPptx = new PptxGenJS();
  allPptx.layout = 'LAYOUT_WIDE';
  allPptx.author = '서민지 (C235180)';
  allPptx.title = '최종보고서 그림';
  for (const fig of figures) {
    fig.fn(allPptx);
  }
  const allPath = path.join(OUTPUT_DIR, 'final-figures.pptx');
  await allPptx.writeFile({ fileName: allPath });
  console.log(`  통합 PPTX: final-figures.pptx (${figures.length}장)`);

  // PNG screenshots via Playwright
  console.log('\nPNG 스크린샷 생성 중...');
  await generatePNGs();

  console.log(`\n완료! ${figures.length}개 PPTX + ${figures.length}개 PNG + 통합 PPTX 생성됨.`);
}

main().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
