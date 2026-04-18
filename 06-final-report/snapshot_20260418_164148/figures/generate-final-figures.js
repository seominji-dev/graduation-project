/**
 * Final Report Figure Generation Script
 * Generates 9 figures as individual PPTX files + PNG screenshots
 * Refactored per SPEC-FIGURE-001: academic monochrome style (IEEE/ACM convention)
 *
 * Usage: node generate-final-figures.js
 * Output: fig-1 ~ fig-9 (PPTX + PNG each)
 *
 * Figure numbering matches body references in final-report.md:
 *   그림 1 (2.1 관련연구): fig-1-algo-concepts       (createFig8)
 *   그림 2 (3.2 아키텍처): fig-2-system-architecture (createFig1)
 *   그림 3 (3.5 데이터흐름): fig-3-data-flow        (createFig2)
 *   그림 4 (4.2 모듈구조): fig-4-module-structure   (createFig10ModuleStructure)
 *   그림 5 (5.1 실험환경): fig-5-experiment-setup   (createFig9)
 *   그림 6 (5.2 대기시간): fig-6-avg-wait-time      (createFig3)
 *   그림 7 (5.3 MLFQ):    fig-7-mlfq-vs-fcfs       (createFig4)
 *   그림 8 (5.4 Ollama):  fig-8-ollama-tier        (createFig5)
 *   그림 9 (5.5 JFI):     fig-9-jfi-comparison     (createFig6)
 */

const PptxGenJS = require('pptxgenjs');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = __dirname;

// AC-01: Monochrome + 1 accent palette. No other color constants.
const COLORS = {
  BLACK:      '000000',  // primary strokes, text
  DARK_GRAY:  '333333',  // secondary text, bars
  MID_GRAY:   '666666',  // de-emphasized strokes, series 2
  LIGHT_GRAY: 'CCCCCC',  // grid, series 3, subtle fills
  VERY_LIGHT: 'F5F5F5',  // optional opaque very-light background
  WHITE:      'FFFFFF',
  ACCENT:     '1F3A5F',  // single dark navy accent - used sparingly
};

const FONT       = '맑은 고딕';
const TITLE_SIZE = 14;   // AC-18: 14pt for figure title
const SUB_SIZE   = 11;   // AC-18: 11pt for subtitle/section headers
const BODY_SIZE  = 10;   // AC-18: 9-10pt for body/label
const SMALL_SIZE = 9;    // AC-18: 9pt for small labels

// ─── Fig 1: 시스템 아키텍처 (System Architecture) ───
// Data preserved: 4 layers - Client/API(+Rate Limiter)/Scheduler/Storage+LLM
// Rate Limiter is embedded inside API layer as an accent sub-box (matches body 3.2)
// AC-04: rectRadius 0, AC-07: no transparency, AC-08: white fill + black outline,
// AC-11: black/dark-gray lines, AC-13: no unicode arrows, AC-19: black text

function createFig1(pptx) {
  const slide = pptx.addSlide();
  // AC-27: centered bold 14pt title
  slide.addText('그림 2. 시스템 아키텍처 (System Architecture)', {
    x: 0.3, y: 0.1, w: 9.4, h: 0.45,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK,
    align: 'center'
  });

  // 4 layers (Rate Limiter is a sub-component of API layer, visually accented)
  const layers = [
    { name: '클라이언트 계층 (Client)',                y: 0.75,  subs: ['REST Client', '대시보드 (Dashboard)'] },
    { name: 'API 계층 (Express.js + Rate Limiter)',   y: 1.95,  subs: ['요청 접수', '스케줄러 전환', '통계 조회', 'Rate Limiter (구독 등급·429 응답)'] },
    { name: '스케줄러 계층 (Scheduler)',               y: 3.15,  subs: ['FCFS', 'Priority', 'MLFQ', 'WFQ'] },
    { name: '저장소/LLM 계층 (Storage/LLM)',          y: 4.35,  subs: ['메모리 큐', 'JSON 로그', 'Ollama LLM'] },
  ];

  const layerH = 0.80;

  layers.forEach((layer, idx) => {
    // AC-04: RECTANGLE (no radius), AC-07: no transparency, AC-08: white fill
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.5, y: layer.y, w: 9.0, h: layerH,
      fill: { color: COLORS.WHITE },
      line: { color: COLORS.BLACK, width: 0.75 }
    });
    // AC-19: black text, AC-17: no italic
    slide.addText(layer.name, {
      x: 0.7, y: layer.y + 0.06, w: 2.8, h: 0.3,
      fontSize: BODY_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK
    });

    // Sub-component boxes: light-gray fill + black outline (AC-08)
    const subCount = layer.subs.length;
    const subW = subCount === 4 ? 1.55 : (subCount === 3 ? 2.0 : 2.6);
    const totalSubW = subCount * subW + (subCount - 1) * 0.12;
    const startX = 3.25 + (6.0 - totalSubW) / 2;

    layer.subs.forEach((sub, i) => {
      const sx = startX + i * (subW + 0.12);
      const isRateLimiter = sub.includes('Rate Limiter');
      // AC-04: RECTANGLE, AC-07: no transparency, AC-08: very-light fill
      // Rate Limiter accent: ACCENT border + slightly thicker stroke
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: sx, y: layer.y + 0.28, w: subW, h: 0.42,
        fill: { color: COLORS.VERY_LIGHT },
        line: { color: isRateLimiter ? COLORS.ACCENT : COLORS.BLACK, width: isRateLimiter ? 1.0 : 0.5 }
      });
      // AC-19: black text (no emotional color)
      slide.addText(sub, {
        x: sx, y: layer.y + 0.28, w: subW, h: 0.42,
        fontSize: isRateLimiter ? 8 : SMALL_SIZE, fontFace: FONT, color: COLORS.BLACK,
        align: 'center', valign: 'middle', bold: isRateLimiter
      });
    });
  });

  // AC-14: Vector arrows - line + triangle arrowhead between layers
  // AC-15: arrow weight matches base line weight 0.75pt
  for (let i = 0; i < layers.length - 1; i++) {
    const arrowY = layers[i].y + layerH;
    const arrowH = layers[i + 1].y - layers[i].y - layerH;
    const midH = arrowH / 2;

    // Request arrow (down): thin rectangle as vertical line
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 4.495, y: arrowY, w: 0.01, h: midH,
      fill: { color: COLORS.DARK_GRAY }, line: { style: 'none' }
    });
    // Triangle arrowhead down
    slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
      x: 4.42, y: arrowY + midH - 0.08, w: 0.16, h: 0.1,
      fill: { color: COLORS.DARK_GRAY },
      line: { color: COLORS.DARK_GRAY, width: 0.5 },
      rotate: 180
    });
    slide.addText('요청', {
      x: 3.85, y: arrowY, w: 0.55, h: 0.22,
      fontSize: 7, fontFace: FONT, color: COLORS.DARK_GRAY, align: 'center', valign: 'middle'
    });

    // Response arrow (up): thin rectangle as vertical line
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 5.095, y: arrowY + midH, w: 0.01, h: midH,
      fill: { color: COLORS.MID_GRAY }, line: { style: 'none' }
    });
    // Triangle arrowhead up
    slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
      x: 5.02, y: arrowY, w: 0.16, h: 0.1,
      fill: { color: COLORS.MID_GRAY },
      line: { color: COLORS.MID_GRAY, width: 0.5 }
    });
    slide.addText('응답', {
      x: 5.65, y: arrowY, w: 0.55, h: 0.22,
      fontSize: 7, fontFace: FONT, color: COLORS.MID_GRAY, align: 'center', valign: 'middle'
    });
  }
}

// ─── Fig 2: 데이터 흐름도 (Data Flow) ───
// Data preserved: 7 steps + state lifecycle (PENDING/QUEUED/PROCESSING/COMPLETED)
// AC-07: no transparency, AC-04: no radius, AC-13: no unicode arrows, AC-19: black text

function createFig2(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 3. 데이터 흐름도 (Data Flow)', {
    x: 0.3, y: 0.1, w: 9.4, h: 0.45,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK,
    align: 'center'
  });

  // Steps data preserved verbatim
  const steps = [
    { label: '1. 요청 전송',            detail: 'POST /api/requests' },
    { label: '2. 요청 객체 생성',       detail: 'API 계층 처리' },
    { label: '3. Rate Limiter\n(구독 등급 확인)', detail: '429 or PASS' },
    { label: '4. 큐 등록',              detail: 'enqueue()' },
    { label: '5. 스케줄링',             detail: 'dequeue()' },
    { label: '6. LLM 처리',             detail: 'Ollama API' },
    { label: '7. 결과 반환\n+ JSON 기록', detail: 'COMPLETED' },
  ];

  const boxW = 2.0;
  const boxH = 1.0;
  const row1Y = 0.7;
  const row2Y = 2.45;
  const row1Gap = 0.2;
  const row1StartX = 0.3;

  // Row 1: steps 1-4 (AC-04: RECTANGLE, AC-07: white fill, AC-19: black text)
  const row1Steps = steps.slice(0, 4);
  row1Steps.forEach((step, i) => {
    const x = row1StartX + i * (boxW + row1Gap);
    slide.addShape(pptx.shapes.RECTANGLE, {
      x, y: row1Y, w: boxW, h: boxH,
      fill: { color: COLORS.WHITE },
      line: { color: COLORS.BLACK, width: 0.75 }
    });
    // Step number - bold
    slide.addText(step.label, {
      x, y: row1Y + 0.1, w: boxW, h: 0.5,
      fontSize: BODY_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK, align: 'center'
    });
    slide.addText(step.detail, {
      x, y: row1Y + 0.62, w: boxW, h: 0.3,
      fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.DARK_GRAY, align: 'center'
    });

    // AC-14: Vector arrow between steps (right): thin rect + triangle
    if (i < 3) {
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: x + boxW, y: row1Y + boxH / 2 - 0.005, w: row1Gap - 0.05, h: 0.01,
        fill: { color: COLORS.DARK_GRAY }, line: { style: 'none' }
      });
      slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
        x: x + boxW + row1Gap - 0.1, y: row1Y + boxH / 2 - 0.06, w: 0.1, h: 0.12,
        fill: { color: COLORS.DARK_GRAY },
        line: { color: COLORS.DARK_GRAY, width: 0.5 },
        rotate: 90
      });
    }
  });

  // Down arrow: step 4 to row 2 (AC-14: thin rect + triangle)
  const step4X = row1StartX + 3 * (boxW + row1Gap);
  const downStart = row1Y + boxH;
  const downEnd = row2Y;
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: step4X + boxW / 2 - 0.005, y: downStart, w: 0.01, h: downEnd - downStart - 0.1,
    fill: { color: COLORS.DARK_GRAY }, line: { style: 'none' }
  });
  slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
    x: step4X + boxW / 2 - 0.07, y: downEnd - 0.12, w: 0.14, h: 0.12,
    fill: { color: COLORS.DARK_GRAY },
    line: { color: COLORS.DARK_GRAY, width: 0.5 },
    rotate: 180
  });

  // Row 2: steps 5-7 right to left from step4 column (data positions preserved)
  const row2Steps = steps.slice(4);
  row2Steps.forEach((step, i) => {
    const revI = 2 - i;
    const x = row1StartX + (3 - revI) * (boxW + row1Gap);
    slide.addShape(pptx.shapes.RECTANGLE, {
      x, y: row2Y, w: boxW, h: boxH,
      fill: { color: COLORS.WHITE },
      line: { color: COLORS.BLACK, width: 0.75 }
    });
    slide.addText(step.label, {
      x, y: row2Y + 0.1, w: boxW, h: 0.5,
      fontSize: BODY_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK, align: 'center'
    });
    slide.addText(step.detail, {
      x, y: row2Y + 0.62, w: boxW, h: 0.3,
      fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.DARK_GRAY, align: 'center'
    });
  });

  // AC-14: Left arrows for row2 (step5 col <- step6 col <- step7 col)
  for (let i = 0; i < 2; i++) {
    const toX = row1StartX + (1 + i) * (boxW + row1Gap) + boxW;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: toX, y: row2Y + boxH / 2 - 0.005, w: row1Gap - 0.05, h: 0.01,
      fill: { color: COLORS.DARK_GRAY }, line: { style: 'none' }
    });
    slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
      x: toX, y: row2Y + boxH / 2 - 0.06, w: 0.1, h: 0.12,
      fill: { color: COLORS.DARK_GRAY },
      line: { color: COLORS.DARK_GRAY, width: 0.5 },
      rotate: 270
    });
  }

  // Rate Limiter rejection (thin rect as vertical line, dashed not supported for rect - use solid thin)
  const rateLimitX = row1StartX + 2 * (boxW + row1Gap);
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: rateLimitX + boxW / 2 - 0.005, y: row1Y + boxH, w: 0.01, h: 0.45,
    fill: { color: COLORS.DARK_GRAY }, line: { style: 'none' }
  });
  // AC-04: RECTANGLE, AC-07: very-light fill
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: rateLimitX + 0.1, y: row1Y + boxH + 0.48, w: 1.8, h: 0.42,
    fill: { color: COLORS.VERY_LIGHT },
    line: { color: COLORS.DARK_GRAY, width: 0.5, dashType: 'dash' }
  });
  slide.addText('429 Too Many\nRequests', {
    x: rateLimitX + 0.1, y: row1Y + boxH + 0.48, w: 1.8, h: 0.42,
    fontSize: 8, fontFace: FONT, color: COLORS.BLACK, align: 'center', valign: 'middle', bold: false
  });

  // State lifecycle (AC-08: light-gray fill box, AC-12: dashed outline for reference)
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.3, y: row2Y, w: 1.85, h: boxH,
    fill: { color: COLORS.VERY_LIGHT },
    line: { color: COLORS.DARK_GRAY, width: 0.5 }
  });
  slide.addText('요청 수명 주기', {
    x: 0.35, y: row2Y + 0.05, w: 1.75, h: 0.25,
    fontSize: SMALL_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK, align: 'center'
  });
  // State names in black (AC-19: no colored text)
  const states = ['PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED'];
  states.forEach((s, i) => {
    if (i < states.length - 1) {
      slide.addText(s + ' \u2192', {
        x: 0.38, y: row2Y + 0.3 + i * 0.17, w: 1.7, h: 0.18,
        fontSize: 8, fontFace: FONT, bold: (i === states.length - 1), color: COLORS.DARK_GRAY, align: 'center'
      });
    } else {
      slide.addText(s, {
        x: 0.38, y: row2Y + 0.3 + i * 0.17, w: 1.7, h: 0.18,
        fontSize: 8, fontFace: FONT, bold: false, color: COLORS.DARK_GRAY, align: 'center'
      });
    }
  });
}

// ─── Fig 3: 알고리즘별 평균 대기시간 비교 (Bar Chart) ───
// Data preserved: FCFS=12203, Priority=12419, MLFQ=12203, WFQ=11846 (ms)
// AC-20: single-color bars, AC-21: horizontal gridlines only, AC-23: no annotation text

function createFig3(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 6. 알고리즘별 평균 대기시간 비교 (ms)', {
    x: 0.3, y: 0.1, w: 9.4, h: 0.45,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK,
    align: 'center'
  });

  // AC-21: subtitle in dark_gray, no italic (AC-17)
  slide.addText('기본 실험 500건 | 4개 테넌트 | 순차 도착', {
    x: 0.3, y: 0.52, w: 9.4, h: 0.25,
    fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.DARK_GRAY
  });

  // AC-20: all bars same dark_gray color - no multi-hue
  slide.addChart(pptx.charts.BAR, [
    {
      name: '평균 대기시간 (ms)',
      labels: ['FCFS', 'Priority', 'MLFQ', 'WFQ'],
      values: [12203, 12419, 12203, 11846]
    }
  ], {
    x: 0.5, y: 0.85, w: 9.0, h: 4.35,
    showTitle: false,
    showValue: true,
    dataLabelFontSize: 10,
    dataLabelColor: COLORS.BLACK,
    catAxisLabelFontSize: 11,
    catAxisLabelColor: COLORS.BLACK,
    valAxisLabelFontSize: 9,
    valAxisLabelColor: COLORS.BLACK,
    // AC-20: single DARK_GRAY color for all bars
    chartColors: [COLORS.DARK_GRAY, COLORS.DARK_GRAY, COLORS.DARK_GRAY, COLORS.DARK_GRAY],
    // AC-21: no vertical gridlines, horizontal only
    catGridLine: { style: 'none' },
    valGridLine: { color: 'DDDDDD', style: 'dot', size: 0.5 },
    showLegend: false,
    // AC-22: tick marks outside
    catAxisLineShow: true,
    valAxisLineShow: true,
  });
  // AC-23: "WFQ 최소" annotation removed. No interpretive text in figure.
}

// ─── Fig 4: MLFQ 선점형 vs FCFS (Grouped Bar Chart) ───
// Data preserved: FCFS=[635,645,650], MLFQ=[170,729,1226] (s)
// AC-20: grayscale series (FCFS=LIGHT_GRAY, MLFQ=DARK_GRAY), AC-03: no emotional color

function createFig4(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 7. MLFQ 선점형 vs FCFS — 요청 유형별 응답시간', {
    x: 0.3, y: 0.1, w: 9.4, h: 0.45,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK,
    align: 'center'
  });
  slide.addText('5시드 평균 | 버스트 패턴 | 단위: 초(s)', {
    x: 0.3, y: 0.52, w: 9.4, h: 0.25,
    fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.DARK_GRAY
  });

  // AC-20: FCFS=LIGHT_GRAY, MLFQ=DARK_GRAY (grayscale series distinction)
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
    x: 0.5, y: 0.85, w: 8.5, h: 4.35,
    showTitle: false,
    showValue: true,
    dataLabelFontSize: 10,
    dataLabelColor: COLORS.BLACK,
    catAxisLabelFontSize: 11,
    catAxisLabelColor: COLORS.BLACK,
    valAxisLabelFontSize: 9,
    valAxisLabelColor: COLORS.BLACK,
    // AC-20: grayscale - FCFS light, MLFQ dark
    chartColors: [COLORS.LIGHT_GRAY, COLORS.DARK_GRAY],
    catGridLine: { style: 'none' },
    valGridLine: { color: 'DDDDDD', style: 'dot', size: 0.5 },
    showLegend: true,
    legendPos: 'b',
    legendFontSize: 10,
    legendFontColor: COLORS.BLACK,
    barGrouping: 'clustered',
  });
  // AC-23: "73% 감소" annotation removed
}

// ─── Fig 5: 실서버 구독 등급별 평균 대기시간 (Grouped Bar Chart) ───
// Data preserved: FCFS=[232,810,1414,2024], Priority=[379,755,1427,1887], WFQ=[241,821,1392,1985]
// AC-20: 3 grayscale shades: FCFS=BLACK, Priority=MID_GRAY, WFQ=LIGHT_GRAY

function createFig5(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 8. 실서버 구독 등급별 평균 대기시간 (ms)', {
    x: 0.3, y: 0.1, w: 9.4, h: 0.45,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK,
    align: 'center'
  });
  slide.addText('Ollama 실서버 실험 20건 | 단위: ms', {
    x: 0.3, y: 0.52, w: 9.4, h: 0.25,
    fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.DARK_GRAY
  });

  // AC-20: FCFS=BLACK, Priority=MID_GRAY, WFQ=LIGHT_GRAY (3-shade grayscale)
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
    x: 0.5, y: 0.85, w: 9.0, h: 4.2,
    showTitle: false,
    showValue: true,
    dataLabelFontSize: 8,
    dataLabelColor: COLORS.BLACK,
    catAxisLabelFontSize: 11,
    catAxisLabelColor: COLORS.BLACK,
    valAxisLabelFontSize: 9,
    valAxisLabelColor: COLORS.BLACK,
    chartColors: [COLORS.BLACK, COLORS.MID_GRAY, COLORS.LIGHT_GRAY],
    catGridLine: { style: 'none' },
    valGridLine: { color: 'DDDDDD', style: 'dot', size: 0.5 },
    showLegend: true,
    legendPos: 'b',
    legendFontSize: 10,
    legendFontColor: COLORS.BLACK,
    barGrouping: 'clustered',
  });
  // AC-23: "Enterprise 등급: ..." annotation removed
}

// ─── Fig 6: 알고리즘별 JFI 비교 (Bar Chart) ───
// Data preserved: FCFS=1.000, Priority=1.000, MLFQ=1.000, WFQ=0.316
// AC-03: no emotional color, AC-20: all bars DARK_GRAY, AC-24: dashed reference at 1.0

function createFig6(pptx) {
  const slide = pptx.addSlide();
  slide.addText("그림 9. 알고리즘별 Jain's Fairness Index (JFI) 비교", {
    x: 0.3, y: 0.1, w: 9.4, h: 0.45,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK,
    align: 'center'
  });
  slide.addText('JFI = 1.0이 완전 공정, 낮을수록 불공평', {
    x: 0.3, y: 0.52, w: 9.4, h: 0.25,
    fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.DARK_GRAY
  });

  // AC-03: no emotional green/red, AC-20: all bars dark_gray
  slide.addChart(pptx.charts.BAR, [
    {
      name: "JFI (Jain's Fairness Index)",
      labels: ['FCFS', 'Priority', 'MLFQ', 'WFQ'],
      values: [1.000, 1.000, 1.000, 0.316]
    }
  ], {
    x: 0.5, y: 0.85, w: 9.0, h: 4.35,
    showTitle: false,
    showValue: true,
    dataLabelFontSize: 11,
    dataLabelColor: COLORS.BLACK,
    catAxisLabelFontSize: 12,
    catAxisLabelColor: COLORS.BLACK,
    valAxisLabelFontSize: 9,
    valAxisLabelColor: COLORS.BLACK,
    valAxisMinVal: 0,
    valAxisMaxVal: 1.2,
    // AC-03: all same DARK_GRAY (no emotional green/red)
    chartColors: [COLORS.DARK_GRAY, COLORS.DARK_GRAY, COLORS.DARK_GRAY, COLORS.DARK_GRAY],
    catGridLine: { style: 'none' },
    valGridLine: { color: 'DDDDDD', style: 'dot', size: 0.5 },
    showLegend: false,
  });

  // AC-24: reference line label "1.0" only, no descriptive text
  // (dashed line visual added in HTML version; PPTX note only)
  slide.addText('── 1.0 (이상적 공정성)', {
    x: 0.5, y: 5.28, w: 3.5, h: 0.22,
    fontSize: 8, fontFace: FONT, color: COLORS.BLACK
  });
  // AC-23: WFQ annotation box removed
}

// ─── Fig 7 (internal): 알고리즘 특성 비교 요약 (Table) ───
// (This figure is not output as fig-7; kept as createFig7 but not in the output list)
// Data preserved: same table rows FCFS/Priority/MLFQ/WFQ with JFI values

function createFig7(pptx) {
  const slide = pptx.addSlide();
  slide.addText('알고리즘 특성 비교 요약', {
    x: 0.3, y: 0.1, w: 9.4, h: 0.45,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK,
    align: 'center'
  });

  const headers = ['알고리즘', '차등 서비스', '공정성 (JFI)', '적합 상황'];
  const rows = [
    ['FCFS',     'X',              '1.000',    '단순 환경'],
    ['Priority', '우선순위 기반',  '1.000',    '긴급 요청 처리'],
    ['MLFQ',     '실행시간 기반',  '1.000',    '짧은 요청 우선'],
    ['WFQ',      '구독 등급 기반', '0.316',    '등급별 차등 서비스'],
  ];

  const colWidths = [1.6, 2.4, 1.8, 3.0];
  const tableX = 0.5;
  const headerY = 0.8;
  const rowH = 0.85;
  const colGap = 0.05;

  // Header row: ACCENT fill + white text (AC-01 allows single accent)
  headers.forEach((h, ci) => {
    const cx = tableX + colWidths.slice(0, ci).reduce((a, b) => a + b + colGap, 0);
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: cx, y: headerY, w: colWidths[ci], h: 0.42,
      fill: { color: COLORS.DARK_GRAY },
      line: { color: COLORS.BLACK, width: 0.5 }
    });
    slide.addText(h, {
      x: cx, y: headerY, w: colWidths[ci], h: 0.42,
      fontSize: BODY_SIZE, fontFace: FONT, bold: true, color: COLORS.WHITE,
      align: 'center', valign: 'middle'
    });
  });

  // Data rows: alternating VERY_LIGHT / WHITE fills
  rows.forEach((row, ri) => {
    const ry = headerY + 0.42 + ri * (rowH + 0.05);
    const bg = ri % 2 === 0 ? COLORS.VERY_LIGHT : COLORS.WHITE;

    row.forEach((cell, ci) => {
      const cx = tableX + colWidths.slice(0, ci).reduce((a, b) => a + b + colGap, 0);
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: cx, y: ry, w: colWidths[ci], h: rowH,
        fill: { color: bg },
        line: { color: COLORS.LIGHT_GRAY, width: 0.5 }
      });
      // AC-19: all black text, AC-17: no italic
      slide.addText(cell, {
        x: cx, y: ry, w: colWidths[ci], h: rowH,
        fontSize: ci === 0 ? SUB_SIZE : BODY_SIZE,
        fontFace: FONT,
        bold: ci === 0,
        color: COLORS.BLACK,
        align: 'center', valign: 'middle'
      });
    });
  });

  slide.addText('JFI: 1.000 = 완전 공정 (모든 요청 동등 처리) | 0.316 = 차등 서비스 적용', {
    x: 0.5, y: 5.3, w: 9.0, h: 0.22,
    fontSize: 8, fontFace: FONT, color: COLORS.DARK_GRAY
  });
}

// ─── Fig 8: 스케줄링 알고리즘 개념 비교 (Concept Diagram, 2x2 grid) ───
// Data preserved: FCFS/Priority/MLFQ/WFQ with same bullet descriptions
// AC-28: identical internal template per panel, AC-04: no radius, AC-07: no transparency

function createFig8(pptx) {
  const slide = pptx.addSlide();
  // AC-27: centered bold title
  slide.addText('그림 1. 스케줄링 알고리즘 개념 비교', {
    x: 0.3, y: 0.05, w: 9.4, h: 0.42,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK,
    align: 'center'
  });

  // AC-28: identical cell template for all 4 panels
  // Cell positions (2x2 grid, AC-25: grid-aligned on 0.05 inch)
  const cellW = 4.55;
  const cellH = 2.45;
  const cells = [
    { algo: 'FCFS',     x: 0.25, y: 0.55, desc: ['도착 순서대로 처리', '선착순 단순 대기열'] },
    { algo: 'Priority', x: 5.20, y: 0.55, desc: ['우선순위 높은 요청 선처리', '(URGENT > HIGH > NORMAL > LOW)'] },
    { algo: 'MLFQ',     x: 0.25, y: 3.10, desc: ['짧은 요청은 상위 큐 유지', '긴 요청은 하위 큐로 강등'] },
    { algo: 'WFQ',      x: 5.20, y: 3.10, desc: ['가중치 비율로 시간 할당', 'Enterprise가 Free보다 100배 우선'] },
  ];

  cells.forEach(cell => {
    // AC-04: RECTANGLE, AC-07: no transparency, AC-08: WHITE fill + BLACK outline
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: cell.x, y: cell.y, w: cellW, h: cellH,
      fill: { color: COLORS.WHITE },
      line: { color: COLORS.BLACK, width: 0.75 }
    });

    // AC-28 identical template: bold 11pt title at top, 9pt bullets below, diagram in center
    // Algorithm name - bold, black (AC-19)
    slide.addText(cell.algo, {
      x: cell.x + 0.15, y: cell.y + 0.08, w: cellW - 0.3, h: 0.35,
      fontSize: SUB_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK
    });

    // Description lines (AC-17: no italic, AC-19: dark_gray text)
    cell.desc.forEach((d, di) => {
      slide.addText(d, {
        x: cell.x + 0.15, y: cell.y + 0.42 + di * 0.2, w: cellW - 0.3, h: 0.2,
        fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.DARK_GRAY
      });
    });

    // Visual diagram section: identical height reserved per panel (AC-28)
    const diagY = cell.y + 0.85;
    const diagH = 1.5;

    if (cell.algo === 'FCFS') {
      // Simple queue: R1, R2, R3, R4 boxes + vector arrow (AC-14)
      ['R1','R2','R3','R4'].forEach((r, i) => {
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: cell.x + 0.15 + i * 0.85, y: diagY + 0.45, w: 0.7, h: 0.5,
          fill: { color: COLORS.VERY_LIGHT },
          line: { color: COLORS.BLACK, width: 0.5 }
        });
        slide.addText(r, {
          x: cell.x + 0.15 + i * 0.85, y: diagY + 0.45, w: 0.7, h: 0.5,
          fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.BLACK, align: 'center', valign: 'middle', bold: true
        });
      });
      // AC-14: thin rect as horizontal line + triangle (no unicode arrow)
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: cell.x + 3.55, y: diagY + 0.695, w: 0.55, h: 0.01,
        fill: { color: COLORS.BLACK }, line: { style: 'none' }
      });
      slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
        x: cell.x + 4.05, y: diagY + 0.62, w: 0.1, h: 0.16,
        fill: { color: COLORS.BLACK },
        line: { color: COLORS.BLACK, width: 0.5 },
        rotate: 90
      });
      slide.addText('처리', {
        x: cell.x + 4.15, y: diagY + 0.62, w: 0.35, h: 0.22,
        fontSize: 8, fontFace: FONT, color: COLORS.DARK_GRAY, align: 'center'
      });

    } else if (cell.algo === 'Priority') {
      // 4 priority levels as identical gray boxes with border weight difference
      const plevels = [
        { label: 'URGENT', lw: 1.5 },
        { label: 'HIGH',   lw: 1.0 },
        { label: 'NORMAL', lw: 0.75 },
        { label: 'LOW',    lw: 0.5 },
      ];
      plevels.forEach((p, i) => {
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: cell.x + 0.15 + i * 1.0, y: diagY + 0.45, w: 0.85, h: 0.5,
          fill: { color: COLORS.VERY_LIGHT },
          line: { color: COLORS.BLACK, width: p.lw }
        });
        slide.addText(p.label, {
          x: cell.x + 0.15 + i * 1.0, y: diagY + 0.45, w: 0.85, h: 0.5,
          fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.BLACK, align: 'center', valign: 'middle', bold: true
        });
        // Priority number below
        slide.addText(`P${i+1}`, {
          x: cell.x + 0.15 + i * 1.0, y: diagY + 1.0, w: 0.85, h: 0.18,
          fontSize: 8, fontFace: FONT, color: COLORS.DARK_GRAY, align: 'center'
        });
      });

    } else if (cell.algo === 'MLFQ') {
      // 4 queues (Q0-Q3), grayscale shading Q0(dark) -> Q3(light), same as AC-20
      const qs = [
        { name: 'Q0 (1초 할당)', fill: COLORS.DARK_GRAY,  tw: 3.8, tc: COLORS.WHITE },
        { name: 'Q1 (3초 할당)', fill: COLORS.MID_GRAY,   tw: 3.2, tc: COLORS.WHITE },
        { name: 'Q2 (8초 할당)', fill: '999999',           tw: 2.6, tc: COLORS.BLACK },
        { name: 'Q3 (무제한)',   fill: COLORS.LIGHT_GRAY,  tw: 2.0, tc: COLORS.BLACK },
      ];
      qs.forEach((q, i) => {
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: cell.x + 0.15, y: diagY + 0.3 + i * 0.33, w: q.tw, h: 0.28,
          fill: { color: q.fill },
          line: { color: COLORS.BLACK, width: 0.5 }
        });
        slide.addText(q.name, {
          x: cell.x + 0.25, y: diagY + 0.3 + i * 0.33, w: q.tw - 0.1, h: 0.28,
          fontSize: 8, fontFace: FONT, color: q.tc, valign: 'middle'
        });
      });
      // AC-14: Demotion arrow (thin rect as vertical line + triangle), no unicode
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: cell.x + 4.195, y: diagY + 0.3, w: 0.01, h: 0.9,
        fill: { color: COLORS.DARK_GRAY }, line: { style: 'none' }
      });
      slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
        x: cell.x + 4.12, y: diagY + 1.15, w: 0.16, h: 0.12,
        fill: { color: COLORS.DARK_GRAY },
        line: { color: COLORS.DARK_GRAY, width: 0.5 },
        rotate: 180
      });
      slide.addText('강등', {
        x: cell.x + 4.05, y: diagY + 1.28, w: 0.4, h: 0.2,
        fontSize: 8, fontFace: FONT, color: COLORS.DARK_GRAY, align: 'center'
      });

    } else if (cell.algo === 'WFQ') {
      // Weighted bars, grayscale shading (AC-20: grayscale distinction by shade)
      const wqs = [
        { label: 'Enterprise (w=100)', pct: 1.00,  fill: COLORS.DARK_GRAY, tc: COLORS.WHITE },
        { label: 'Premium (w=50)',     pct: 0.68,  fill: COLORS.MID_GRAY,  tc: COLORS.WHITE },
        { label: 'Standard (w=10)',    pct: 0.40,  fill: COLORS.LIGHT_GRAY, tc: COLORS.BLACK },
        { label: 'Free (w=1)',         pct: 0.22,  fill: COLORS.VERY_LIGHT, tc: COLORS.BLACK },
      ];
      const maxBarW = 3.9;
      wqs.forEach((wq, i) => {
        const bw = wq.pct * maxBarW;
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: cell.x + 0.15, y: diagY + 0.25 + i * 0.35, w: bw, h: 0.28,
          fill: { color: wq.fill },
          line: { color: COLORS.BLACK, width: 0.5 }
        });
        slide.addText(wq.label, {
          x: cell.x + 0.2, y: diagY + 0.25 + i * 0.35, w: bw, h: 0.28,
          fontSize: 8, fontFace: FONT, color: wq.tc, valign: 'middle'
        });
      });
    }
  });

  // Grid dividers: horizontal and vertical (BLACK stroke, thin)
  // AC-10: 0.5pt lines
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.25, y: 3.02, w: 9.5, h: 0.025,
    fill: { color: COLORS.LIGHT_GRAY }, line: { style: 'none' }
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 4.87, y: 0.55, w: 0.025, h: 4.95,
    fill: { color: COLORS.LIGHT_GRAY }, line: { style: 'none' }
  });
}

// ─── Fig 9: 실험 환경 구성도 (Experiment Setup) ───
// Data preserved: 3 branches + 4-algo Scheduler Layer + 결과측정 metrics
// AC-02: max 2 colors, AC-05: no border-radius, AC-17: no italic

function createFig9(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 5. 실험 환경 구성도', {
    x: 0.3, y: 0.05, w: 9.4, h: 0.42,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK,
    align: 'center'
  });

  // Data preserved verbatim
  const experiments = [
    { title: '기본 실험',       detail: '500건, 4테넌트\n순차 도착',    x: 0.25,  engine: '시뮬레이션' },
    { title: 'MLFQ 선점형 실험', detail: '500건 × 5시드\n버스트 패턴', x: 3.40,  engine: '시뮬레이션' },
    { title: '실서버 실험',     detail: '20건\nOllama llama3.2',        x: 6.55,  engine: 'Ollama LLM' },
  ];

  const expW = 3.0;
  const expY = 0.55;

  // Top: Request Generator box (AC-04: RECTANGLE, AC-08: dark fill acceptable for header)
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 3.45, y: expY, w: 2.9, h: 0.55,
    fill: { color: COLORS.DARK_GRAY },
    line: { color: COLORS.BLACK, width: 0.75 }
  });
  slide.addText('요청 생성 (Request Generator)', {
    x: 3.45, y: expY, w: 2.9, h: 0.55,
    fontSize: BODY_SIZE, fontFace: FONT, bold: true, color: COLORS.WHITE,
    align: 'center', valign: 'middle'
  });

  // AC-14: Arrows from generator to each experiment (thin rect + triangle)
  experiments.forEach(exp => {
    const expCenterX = exp.x + expW / 2;
    const genBottom = expY + 0.55;
    const expTop = expY + 1.05;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: expCenterX - 0.005, y: genBottom, w: 0.01, h: expTop - genBottom - 0.1,
      fill: { color: COLORS.DARK_GRAY }, line: { style: 'none' }
    });
    slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
      x: expCenterX - 0.07, y: expTop - 0.12, w: 0.14, h: 0.12,
      fill: { color: COLORS.DARK_GRAY },
      line: { color: COLORS.DARK_GRAY, width: 0.5 },
      rotate: 180
    });
  });

  // Experiment boxes (AC-04: RECTANGLE, AC-07: no transparency, AC-08: white fill)
  experiments.forEach(exp => {
    const ey = expY + 1.05;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: exp.x, y: ey, w: expW, h: 0.95,
      fill: { color: COLORS.WHITE },
      line: { color: COLORS.BLACK, width: 0.75 }
    });
    // AC-17: no italic, AC-19: black text
    slide.addText(exp.title, {
      x: exp.x + 0.05, y: ey + 0.05, w: expW - 0.1, h: 0.3,
      fontSize: BODY_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK, align: 'center'
    });
    slide.addText(exp.detail, {
      x: exp.x + 0.05, y: ey + 0.35, w: expW - 0.1, h: 0.38,
      fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.DARK_GRAY, align: 'center', valign: 'middle'
    });
    slide.addText('엔진: ' + exp.engine, {
      x: exp.x + 0.05, y: ey + 0.72, w: expW - 0.1, h: 0.18,
      fontSize: 8, fontFace: FONT, color: COLORS.DARK_GRAY, align: 'center'
    });
  });

  // AC-14: Down arrows from experiments to Scheduler Layer
  const schedY = expY + 2.25;
  experiments.forEach(exp => {
    const expCenterX = exp.x + expW / 2;
    const expBottom = expY + 1.05 + 0.95;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: expCenterX - 0.005, y: expBottom, w: 0.01, h: schedY - expBottom - 0.1,
      fill: { color: COLORS.DARK_GRAY }, line: { style: 'none' }
    });
    slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
      x: expCenterX - 0.07, y: schedY - 0.12, w: 0.14, h: 0.12,
      fill: { color: COLORS.DARK_GRAY },
      line: { color: COLORS.DARK_GRAY, width: 0.5 },
      rotate: 180
    });
  });

  // Scheduler Layer box (AC-04: RECTANGLE, AC-08: white fill + black outline)
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.25, y: schedY, w: 9.5, h: 0.72,
    fill: { color: COLORS.VERY_LIGHT },
    line: { color: COLORS.BLACK, width: 0.75 }
  });
  slide.addText('스케줄러 계층 (Scheduler Layer)', {
    x: 0.4, y: schedY + 0.04, w: 3.5, h: 0.28,
    fontSize: BODY_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK
  });

  // 4 algorithm boxes inside Scheduler Layer (AC-04: RECTANGLE)
  const algos = ['FCFS', 'Priority', 'MLFQ', 'WFQ'];
  algos.forEach((a, i) => {
    const ax = 1.8 + i * 1.8;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: ax, y: schedY + 0.33, w: 1.5, h: 0.28,
      fill: { color: COLORS.WHITE },
      line: { color: COLORS.BLACK, width: 0.5 }
    });
    slide.addText(a, {
      x: ax, y: schedY + 0.33, w: 1.5, h: 0.28,
      fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.BLACK, align: 'center', valign: 'middle', bold: false
    });
  });

  // AC-14: Down arrow to results (thin rect + triangle)
  const measY = schedY + 0.72;
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 4.845, y: measY, w: 0.01, h: 0.3,
    fill: { color: COLORS.DARK_GRAY }, line: { style: 'none' }
  });
  slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
    x: 4.78, y: measY + 0.22, w: 0.14, h: 0.12,
    fill: { color: COLORS.DARK_GRAY },
    line: { color: COLORS.DARK_GRAY, width: 0.5 },
    rotate: 180
  });

  // Results box (AC-08: VERY_LIGHT fill, data labels preserved)
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.25, y: measY + 0.33, w: 9.5, h: 0.62,
    fill: { color: COLORS.VERY_LIGHT },
    line: { color: COLORS.BLACK, width: 0.75 }
  });
  slide.addText('결과 측정: 평균 대기시간 · JFI · 요청 유형별 응답시간 · JSON 로그 기록', {
    x: 0.4, y: measY + 0.33, w: 9.2, h: 0.62,
    fontSize: BODY_SIZE, fontFace: FONT, color: COLORS.BLACK, align: 'center', valign: 'middle'
  });
}

// ─── Fig 10: 모듈 구조도 (Module Structure) ───
// Data preserved: server.js + api/ schedulers/ queue/ storage/ llm/ rate-limiter/ tests-simple/
// AC-25: grid alignment, AC-04: no radius, AC-07: no transparency

function createFig10ModuleStructure(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 4. 모듈 구조도 (Module Structure)', {
    x: 0.3, y: 0.1, w: 9.4, h: 0.42,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK,
    align: 'center'
  });

  // Entry point boxes top (AC-25: 0.05 inch grid)
  // index.js (left) - main entry; server.js (right) - Express composition module
  const indexX = 1.95, indexY = 0.65, indexW = 2.15, indexH = 0.50;
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: indexX, y: indexY, w: indexW, h: indexH,
    fill: { color: COLORS.DARK_GRAY },
    line: { color: COLORS.BLACK, width: 0.75 }
  });
  slide.addText('index.js (진입점)', {
    x: indexX, y: indexY, w: indexW, h: indexH,
    fontSize: BODY_SIZE, fontFace: FONT, bold: true, color: COLORS.WHITE,
    align: 'center', valign: 'middle'
  });
  // Arrow index.js → server.js
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: indexX + indexW + 0.05, y: indexY + indexH / 2 - 0.015,
    w: 0.60, h: 0.03,
    fill: { color: COLORS.DARK_GRAY }, line: { style: 'none' }
  });
  slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
    x: indexX + indexW + 0.62, y: indexY + indexH / 2 - 0.08,
    w: 0.13, h: 0.16,
    fill: { color: COLORS.DARK_GRAY }, line: { style: 'none' }, rotate: 90
  });
  slide.addText('호출', {
    x: indexX + indexW + 0.05, y: indexY + indexH + 0.02,
    w: 0.70, h: 0.16,
    fontSize: 8, fontFace: FONT, color: COLORS.DARK_GRAY, align: 'center'
  });
  const serverX = 4.85, serverY = 0.65, boxW = 2.60, boxH = 0.50;
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: serverX, y: serverY, w: boxW, h: boxH,
    fill: { color: COLORS.DARK_GRAY },
    line: { color: COLORS.BLACK, width: 0.75 }
  });
  slide.addText('server.js (서버 구성)', {
    x: serverX, y: serverY, w: boxW, h: boxH,
    fontSize: BODY_SIZE, fontFace: FONT, bold: true, color: COLORS.WHITE,
    align: 'center', valign: 'middle'
  });

  // Module boxes: same width/height grid-aligned (AC-25)
  const modules = [
    { name: 'api/\n(라우터)',                          x: 0.25, y: 1.85 },
    { name: 'schedulers/\n(FCFS, Priority, MLFQ, WFQ)', x: 2.15, y: 1.85 },
    { name: 'queue/\n(메모리 큐)',                     x: 4.25, y: 1.85 },
    { name: 'storage/\n(JSON 저장)',                   x: 6.15, y: 1.85 },
    { name: 'llm/\n(Ollama 연동)',                     x: 8.05, y: 1.85 },
  ];

  const modW = 1.70, modH = 0.85;
  modules.forEach(m => {
    // AC-04: RECTANGLE, AC-07: no transparency, AC-08: VERY_LIGHT fill
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: m.x, y: m.y, w: modW, h: modH,
      fill: { color: COLORS.VERY_LIGHT },
      line: { color: COLORS.BLACK, width: 0.75 }
    });
    slide.addText(m.name, {
      x: m.x, y: m.y, w: modW, h: modH,
      fontSize: SMALL_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK,
      align: 'center', valign: 'middle'
    });
  });

  // AC-14: Indicate server.js depends on all modules via single vertical thin rect + note
  // (Diagonal pptxgenjs lines can have negative w when module is to the left of center)
  // Simple approach: draw a single vertical stem from server.js to horizontal rail
  const railY = (serverY + boxH + modules[0].y) / 2;
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: serverX + boxW / 2 - 0.005, y: serverY + boxH, w: 0.01, h: railY - (serverY + boxH),
    fill: { color: COLORS.DARK_GRAY }, line: { style: 'none' }
  });
  // Horizontal rail connecting all module centers
  const leftX = modules[0].x + modW / 2;
  const rightX = modules[modules.length - 1].x + modW / 2;
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: leftX, y: railY - 0.005, w: rightX - leftX, h: 0.01,
    fill: { color: COLORS.DARK_GRAY }, line: { style: 'none' }
  });
  // Vertical drops from rail to each module
  modules.forEach(m => {
    const cx = m.x + modW / 2;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: cx - 0.005, y: railY, w: 0.01, h: m.y - railY - 0.1,
      fill: { color: COLORS.DARK_GRAY }, line: { style: 'none' }
    });
    slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
      x: cx - 0.07, y: m.y - 0.12, w: 0.14, h: 0.12,
      fill: { color: COLORS.DARK_GRAY }, line: { style: 'none' }, rotate: 180
    });
  });

  // Dependency labels (AC-19: black/dark text, no color labels)
  slide.addText('호출', {
    x: 1.65, y: 2.80, w: 0.55, h: 0.2,
    fontSize: 7, fontFace: FONT, color: COLORS.DARK_GRAY, align: 'center'
  });
  slide.addText('사용', {
    x: 3.65, y: 2.80, w: 0.55, h: 0.2,
    fontSize: 7, fontFace: FONT, color: COLORS.DARK_GRAY, align: 'center'
  });

  // rate-limiter box (AC-25: grid-aligned, same modW)
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.25, y: 3.20, w: modW, h: 0.60,
    fill: { color: COLORS.VERY_LIGHT },
    line: { color: COLORS.BLACK, width: 0.75 }
  });
  slide.addText('rate-limiter/\n(요청 제한)', {
    x: 0.25, y: 3.20, w: modW, h: 0.60,
    fontSize: SMALL_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK,
    align: 'center', valign: 'middle'
  });

  // tests box (AC-12: dashed for reference purpose only, not decorative)
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 2.80, y: 4.05, w: 4.40, h: 0.45,
    fill: { color: COLORS.WHITE },
    line: { color: COLORS.DARK_GRAY, width: 0.5, dashType: 'dash' }
  });
  slide.addText('tests-simple/ (Jest 단위 테스트)', {
    x: 2.80, y: 4.05, w: 4.40, h: 0.45,
    fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.DARK_GRAY,
    align: 'center', valign: 'middle'
  });

  // Legend (AC-19: dark_gray text)
  slide.addText('※ 화살표: 의존 관계 (호출 방향) | 점선: 테스트 전용', {
    x: 0.3, y: 4.6, w: 5.0, h: 0.25,
    fontSize: 8, fontFace: FONT, color: COLORS.DARK_GRAY
  });
}


// ══════════════════════════════════════════════════════════
// HTML rendering functions for PNG generation via Playwright
// Academic monochrome style per SPEC-FIGURE-001
// AC-05: border-radius:0, AC-09: no rgba/gradient, AC-19: black text
// ══════════════════════════════════════════════════════════

function wrapHtml(body, height) {
  // AC-32: content-sized body — PNG clips to actual content height, no whitespace
  // height arg kept for backward compatibility but no longer sets body height
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { background:#FFFFFF; }
  body { width:1280px; font-family:'Malgun Gothic','맑은 고딕',Arial,sans-serif; padding:16px 0; }
  .fig-title { font-size:18px; font-weight:bold; color:#000000; padding:10px 32px 5px; text-align:center; }
  .fig-subtitle { font-size:11px; color:#333333; padding:0 32px 8px; text-align:center; }
</style></head><body>${body}</body></html>`;
}

// HTML for Fig2 (fig-2-system-architecture)
// 4 layers - Rate Limiter is embedded in API layer as accent sub-box (matches body 3.2)
function htmlFig1() {
  const layers = [
    { name: '클라이언트 계층 (Client)',                subs: ['REST Client', '대시보드 (Dashboard)'] },
    { name: 'API 계층 (Express.js + Rate Limiter)',   subs: ['요청 접수', '스케줄러 전환', '통계 조회', 'Rate Limiter (구독 등급·429 응답)'] },
    { name: '스케줄러 계층 (Scheduler)',               subs: ['FCFS', 'Priority', 'MLFQ', 'WFQ'] },
    { name: '저장소/LLM 계층 (Storage/LLM)',          subs: ['메모리 큐', 'JSON 로그', 'Ollama LLM'] },
  ];
  let html = '<div class="fig-title">그림 2. 시스템 아키텍처 (System Architecture)</div>';
  html += '<div style="padding:0 48px; display:flex; flex-direction:column; gap:0;">';
  layers.forEach((layer, idx) => {
    // AC-05: border-radius:0, AC-09: no rgba, AC-08: white fill + black stroke
    html += `<div style="border:1.5px solid #000000; padding:8px 16px 10px; background:#FFFFFF; flex-shrink:0;">`;
    html += `<div style="font-size:12px; font-weight:bold; color:#000000; margin-bottom:7px;">${layer.name}</div>`;
    html += '<div style="display:flex; gap:10px; justify-content:center;">';
    layer.subs.forEach(sub => {
      // AC-05: no border-radius, AC-09: no rgba, AC-08: very-light fill
      // Rate Limiter gets accent border + bold text to mark it as a special sub-component
      const isRL = sub.includes('Rate Limiter');
      const border = isRL ? '1.5px solid #1F3A5F' : '1px solid #000000';
      const weight = isRL ? 'bold' : 'normal';
      html += `<div style="border:${border}; padding:6px 14px; background:#F5F5F5; font-size:10px; color:#000000; font-weight:${weight};">${sub}</div>`;
    });
    html += '</div></div>';
    if (idx < layers.length - 1) {
      // AC-13: No unicode glyphs. Use CSS triangle trick for arrows
      html += '<div style="display:flex; justify-content:center; align-items:center; gap:32px; padding:3px 0; flex-shrink:0;">';
      html += '<div style="display:flex; align-items:center; gap:4px;">';
      html += '<span style="font-size:8px; color:#333333;">요청</span>';
      // CSS down-triangle
      html += '<div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:8px solid #333333;"></div>';
      html += '</div>';
      html += '<div style="display:flex; align-items:center; gap:4px;">';
      // CSS up-triangle
      html += '<div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:8px solid #666666;"></div>';
      html += '<span style="font-size:8px; color:#666666;">응답</span>';
      html += '</div>';
      html += '</div>';
    }
  });
  html += '</div>';
  return wrapHtml(html);
}

// HTML for Fig3 (fig-3-data-flow)
function htmlFig2() {
  const steps = [
    { label: '1. 요청 전송',                       detail: 'POST /api/requests' },
    { label: '2. 요청 객체 생성',                   detail: 'API 계층 처리' },
    { label: '3. Rate Limiter<br>(구독 등급 확인)', detail: '429 or PASS' },
    { label: '4. 큐 등록',                          detail: 'enqueue()' },
    { label: '5. 스케줄링',                         detail: 'dequeue()' },
    { label: '6. LLM 처리',                         detail: 'Ollama API' },
    { label: '7. 결과 반환<br>+ JSON 기록',          detail: 'COMPLETED' },
  ];
  let html = '<div class="fig-title">그림 3. 데이터 흐름도 (Data Flow)</div>';
  // Row 1: steps 1-4
  html += '<div style="display:flex; align-items:center; padding:4px 20px; gap:0;">';
  steps.slice(0, 4).forEach((step, i) => {
    // AC-05: border-radius:0, AC-09: no rgba, AC-08: white fill
    html += `<div style="border:1.5px solid #000000; padding:8px 4px; background:#FFFFFF; width:175px; text-align:center; flex-shrink:0;">`;
    html += `<div style="font-size:10px; font-weight:bold; color:#000000;">${step.label}</div>`;
    html += `<div style="font-size:9px; color:#333333; margin:3px 0;">${step.detail}</div>`;
    html += '</div>';
    if (i < 3) {
      // AC-13: CSS right-triangle instead of unicode
      html += '<div style="display:flex; align-items:center; padding:0 3px; flex-shrink:0;">';
      html += '<div style="width:0;height:0;border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:9px solid #333333;"></div>';
      html += '</div>';
    }
  });
  html += '</div>';
  // Rate Limiter rejection branch
  html += '<div style="display:flex; padding:0 20px; gap:0;">';
  html += '<div style="width:175px; flex-shrink:0;"></div>';
  html += '<div style="width:12px; flex-shrink:0;"></div>';
  html += '<div style="width:175px; flex-shrink:0;"></div>';
  html += '<div style="width:12px; flex-shrink:0;"></div>';
  html += '<div style="display:flex; flex-direction:column; align-items:center; flex-shrink:0;">';
  // CSS down-triangle for rejection arrow
  html += '<div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:8px solid #333333;"></div>';
  // AC-05: no border-radius, AC-09: no rgba
  html += '<div style="border:1px solid #333333; border-style:dashed; padding:4px 10px; background:#F5F5F5; font-size:9px; color:#000000; white-space:nowrap;">429 Too Many Requests</div>';
  html += '</div>';
  html += '</div>';
  // Step4 down connector
  html += '<div style="display:flex; justify-content:flex-end; padding-right:298px;">';
  html += '<div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:8px solid #333333;"></div>';
  html += '</div>';
  // Row 2: steps 5,6,7 right-to-left
  html += '<div style="display:flex; align-items:center; padding:0 20px; gap:0; justify-content:flex-end;">';
  steps.slice(4).reverse().forEach((step, i) => {
    if (i > 0) {
      // AC-13: CSS left-triangle
      html += '<div style="display:flex; align-items:center; padding:0 3px; flex-shrink:0;">';
      html += '<div style="width:0;height:0;border-top:6px solid transparent;border-bottom:6px solid transparent;border-right:9px solid #333333;"></div>';
      html += '</div>';
    }
    html += `<div style="border:1.5px solid #000000; padding:8px 4px; background:#FFFFFF; width:175px; text-align:center; flex-shrink:0;">`;
    html += `<div style="font-size:10px; font-weight:bold; color:#000000;">${step.label}</div>`;
    html += `<div style="font-size:9px; color:#333333; margin:3px 0;">${step.detail}</div>`;
    html += '</div>';
  });
  html += '</div>';
  // Lifecycle summary box (AC-09: no rgba)
  html += '<div style="margin:6px 20px; border:1px solid #CCCCCC; padding:8px 14px; background:#F5F5F5;">';
  html += '<div style="font-size:10px; font-weight:bold; color:#000000; margin-bottom:4px;">요청 수명 주기 (Request Lifecycle)</div>';
  html += '<div style="font-size:10px; color:#333333;">PENDING &nbsp;&rarr;&nbsp; QUEUED &nbsp;&rarr;&nbsp; PROCESSING &nbsp;&rarr;&nbsp; COMPLETED</div>';
  html += '</div>';
  return wrapHtml(html);
}

// HTML for Fig6 (fig-6-avg-wait-time)
function htmlFig3() {
  const data = [
    { label: 'FCFS',     value: 12203 },
    { label: 'Priority', value: 12419 },
    { label: 'MLFQ',     value: 12203 },
    { label: 'WFQ',      value: 11846 },
  ];
  const maxVal = 13000;
  const chartH = 460;

  let html = '<div class="fig-title">그림 6. 알고리즘별 평균 대기시간 비교 (ms)</div>';
  html += '<div class="fig-subtitle">기본 실험 500건 | 4개 테넌트 | 순차 도착</div>';
  // AC-21: horizontal only gridlines (drawn as CSS divs)
  html += `<div style="display:flex; align-items:flex-end; gap:48px; padding:0 80px; height:${chartH}px; border-bottom:1.5px solid #000000; position:relative;">`;
  // AC-21: horizontal gridlines only, light-gray
  [0.25, 0.50, 0.75, 1.0].forEach(pct => {
    const botPct = pct * 100;
    html += `<div style="position:absolute; left:0; right:0; bottom:${botPct}%; border-top:0.5px solid #DDDDDD; pointer-events:none;"></div>`;
  });
  // AC-24: reference line (dashed), labeled "avg: NNNNms" (numeric only)
  const avgMs = Math.round(data.reduce((a,b)=>a+b.value,0)/data.length);
  const refPct = (avgMs / maxVal) * 100;
  html += `<div style="position:absolute; left:0; right:0; bottom:${refPct}%; border-top:1px dashed #666666; pointer-events:none; z-index:2;"></div>`;
  html += `<div style="position:absolute; right:4px; bottom:${refPct+0.5}%; font-size:10px; color:#333333; z-index:2;">평균 ${avgMs.toLocaleString()} ms</div>`;
  data.forEach(d => {
    const barH = Math.round((d.value / maxVal) * chartH);
    html += `<div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; position:relative; z-index:1;">`;
    // AC-20: single dark_gray color, AC-22: numeric label above bar only
    html += `<div style="font-size:13px; color:#333333; font-weight:bold; margin-bottom:4px;">${d.value.toLocaleString()}</div>`;
    // AC-06: rectangular top (no border-radius), AC-05: no border-radius
    html += `<div style="width:80%; height:${barH}px; background:#333333;"></div>`;
    html += `</div>`;
  });
  html += '</div>';
  html += '<div style="display:flex; gap:48px; padding:6px 80px;">';
  data.forEach(d => {
    // AC-22: x-axis labels black
    html += `<div style="flex:1; text-align:center; font-size:13px; font-weight:bold; color:#000000;">${d.label}</div>`;
  });
  html += '</div>';
  // AC-21: y-axis label
  html += '<div style="padding:0 80px; font-size:10px; color:#333333;">단위: ms</div>';
  // AC-23: no "WFQ 최소" annotation
  return wrapHtml(html);
}

// HTML for Fig7 (fig-7-mlfq-vs-fcfs)
function htmlFig4() {
  const categories = ['짧은 요청 (Short)', '중간 요청 (Medium)', '긴 요청 (Long)'];
  const fcfs  = [635, 645, 650];
  const mlfq  = [170, 729, 1226];
  const maxVal = 1400;
  const chartH = 420;

  let html = '<div class="fig-title">그림 7. MLFQ 선점형 vs FCFS — 요청 유형별 응답시간</div>';
  html += '<div class="fig-subtitle">5시드 평균 | 버스트 패턴 | 단위: 초(s)</div>';

  html += `<div style="display:flex; align-items:flex-end; gap:48px; padding:0 60px; height:${chartH}px; border-bottom:1.5px solid #000000; position:relative;">`;
  // AC-21: horizontal gridlines
  [0.25, 0.50, 0.75, 1.0].forEach(pct => {
    html += `<div style="position:absolute; left:0; right:0; bottom:${pct*100}%; border-top:0.5px solid #DDDDDD;"></div>`;
  });
  categories.forEach((cat, i) => {
    const fH = Math.round((fcfs[i] / maxVal) * chartH);
    const mH = Math.round((mlfq[i] / maxVal) * chartH);
    html += `<div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; position:relative; z-index:1;">`;
    html += `<div style="display:flex; align-items:flex-end; gap:6px; height:100%; width:100%; justify-content:center;">`;
    // AC-20: FCFS=LIGHT_GRAY, MLFQ=DARK_GRAY, AC-06: no border-radius
    html += `<div style="display:flex; flex-direction:column; align-items:center; justify-content:flex-end; flex:1; height:100%;">`;
    html += `<div style="font-size:11px; color:#333333; font-weight:bold; margin-bottom:3px;">${fcfs[i]}</div>`;
    html += `<div style="width:90%; height:${fH}px; background:#CCCCCC;"></div>`;
    html += `</div>`;
    // AC-20: MLFQ darker
    html += `<div style="display:flex; flex-direction:column; align-items:center; justify-content:flex-end; flex:1; height:100%;">`;
    html += `<div style="font-size:11px; color:#000000; font-weight:bold; margin-bottom:3px;">${mlfq[i]}</div>`;
    html += `<div style="width:90%; height:${mH}px; background:#333333;"></div>`;
    html += `</div>`;
    html += `</div></div>`;
  });
  html += '</div>';

  // Category labels
  html += '<div style="display:flex; gap:48px; padding:6px 60px;">';
  categories.forEach(cat => {
    html += `<div style="flex:1; text-align:center; font-size:11px; color:#000000;">${cat}</div>`;
  });
  html += '</div>';

  // Legend (AC-20: grayscale swatches, AC-19: black text)
  html += '<div style="display:flex; justify-content:center; gap:32px; padding:6px 0;">';
  // AC-05: no border-radius on legend swatches
  html += '<div style="display:flex; align-items:center; gap:8px;"><div style="width:20px; height:12px; background:#CCCCCC;"></div><span style="font-size:11px; color:#000000;">FCFS</span></div>';
  html += '<div style="display:flex; align-items:center; gap:8px;"><div style="width:20px; height:12px; background:#333333;"></div><span style="font-size:11px; color:#000000;">MLFQ (선점형)</span></div>';
  html += '</div>';
  // AC-23: no "N배 개선" annotation
  return wrapHtml(html);
}

// HTML for Fig8 (fig-8-ollama-tier)
function htmlFig5() {
  const tiers = ['Enterprise', 'Premium', 'Standard', 'Free'];
  const fcfsVals     = [232, 810, 1414, 2024];
  const priorityVals = [379, 755, 1427, 1887];
  const wfqVals      = [241, 821, 1392, 1985];
  const maxVal = 2200;
  const chartH = 390;
  // AC-20: 3-shade grayscale
  const schedulers = [
    { name: 'FCFS',     vals: fcfsVals,     fill: '#000000', tc: '#FFFFFF' },
    { name: 'Priority', vals: priorityVals, fill: '#666666', tc: '#FFFFFF' },
    { name: 'WFQ',      vals: wfqVals,      fill: '#CCCCCC', tc: '#000000' },
  ];

  let html = '<div class="fig-title">그림 8. 실서버 구독 등급별 평균 대기시간 (ms)</div>';
  html += '<div class="fig-subtitle">Ollama 실서버 실험 20건 | 단위: ms</div>';
  html += `<div style="display:flex; align-items:flex-end; gap:32px; padding:0 40px; height:${chartH}px; border-bottom:1.5px solid #000000; position:relative;">`;
  // AC-21: horizontal gridlines
  [0.25, 0.50, 0.75, 1.0].forEach(pct => {
    html += `<div style="position:absolute; left:0; right:0; bottom:${pct*100}%; border-top:0.5px solid #DDDDDD;"></div>`;
  });
  tiers.forEach((tier, ti) => {
    html += `<div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; position:relative; z-index:1;">`;
    html += `<div style="display:flex; align-items:flex-end; gap:3px; height:100%; width:100%; justify-content:center;">`;
    schedulers.forEach(sch => {
      const bH = Math.round((sch.vals[ti] / maxVal) * chartH);
      html += `<div style="display:flex; flex-direction:column; align-items:center; justify-content:flex-end; flex:1; height:100%;">`;
      // AC-22: numeric label above bar
      html += `<div style="font-size:8px; color:#333333; font-weight:bold; margin-bottom:2px;">${sch.vals[ti]}</div>`;
      // AC-06: no border-radius, AC-05: no border-radius
      html += `<div style="width:80%; height:${bH}px; background:${sch.fill};"></div>`;
      html += `</div>`;
    });
    html += `</div></div>`;
  });
  html += '</div>';
  html += '<div style="display:flex; gap:32px; padding:5px 40px;">';
  tiers.forEach(t => {
    html += `<div style="flex:1; text-align:center; font-size:11px; font-weight:bold; color:#000000;">${t}</div>`;
  });
  html += '</div>';
  // Legend (AC-20: grayscale, AC-19: black text)
  html += '<div style="display:flex; justify-content:center; gap:20px; padding:5px 0;">';
  schedulers.forEach(s => {
    html += `<div style="display:flex; align-items:center; gap:6px;"><div style="width:16px;height:10px;background:${s.fill};border:0.5px solid #000000;"></div><span style="font-size:10px;color:#000000;">${s.name}</span></div>`;
  });
  html += '</div>';
  // AC-23: "Enterprise 등급: ..." annotation removed
  return wrapHtml(html);
}

// HTML for Fig9 (fig-9-jfi-comparison)
function htmlFig6() {
  const data = [
    { label: 'FCFS',     value: 1.000 },
    { label: 'Priority', value: 1.000 },
    { label: 'MLFQ',     value: 1.000 },
    { label: 'WFQ',      value: 0.316 },
  ];
  const maxVal = 1.1;
  const chartH = 440;

  let html = '<div class="fig-title">그림 9. 알고리즘별 Jain\'s Fairness Index (JFI) 비교</div>';
  html += '<div class="fig-subtitle">JFI = 1.0이 완전 공정, 낮을수록 불공평</div>';
  html += `<div style="display:flex; align-items:flex-end; gap:64px; padding:0 100px; height:${chartH}px; border-bottom:1.5px solid #000000; position:relative;">`;
  // AC-21: horizontal gridlines
  [0.25, 0.50, 0.75, 1.0].forEach(pct => {
    html += `<div style="position:absolute; left:0; right:0; bottom:${pct*100}%; border-top:0.5px solid #DDDDDD;"></div>`;
  });
  // AC-24: reference line at 1.0, dashed, labeled "1.0" only
  const refPct = (1.0 / maxVal) * 100;
  html += `<div style="position:absolute; left:0; right:0; bottom:${refPct}%; border-top:1px dashed #333333; pointer-events:none; z-index:2;"></div>`;
  html += `<div style="position:absolute; right:4px; bottom:${refPct+0.5}%; font-size:10px; color:#333333; z-index:2;">이상적 공정값 = 1.0</div>`;
  data.forEach(d => {
    const barH = Math.round((d.value / maxVal) * chartH);
    html += `<div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; position:relative; z-index:1;">`;
    // AC-22: numeric label above bar, AC-19: black/dark text
    html += `<div style="font-size:14px; color:#333333; font-weight:bold; margin-bottom:5px;">${d.value.toFixed(3)}</div>`;
    // AC-03: no emotional green/red, AC-20: all dark_gray, AC-06: no border-radius
    html += `<div style="width:75%; height:${barH}px; background:#333333;"></div>`;
    html += `</div>`;
  });
  html += '</div>';
  html += '<div style="display:flex; gap:64px; padding:7px 100px;">';
  data.forEach(d => {
    html += `<div style="flex:1; text-align:center; font-size:13px; font-weight:bold; color:#000000;">${d.label}</div>`;
  });
  html += '</div>';
  // AC-23: no "WFQ: JFI = 0.316 — 차등 서비스..." annotation
  return wrapHtml(html);
}

// HTML for Fig7 (internal table - unused in fig output but kept for consistency)
function htmlFig7() {
  const rows = [
    { algo: 'FCFS',     diff: 'X',              jfi: '1.000', fit: '단순 환경' },
    { algo: 'Priority', diff: '우선순위 기반',  jfi: '1.000', fit: '긴급 요청 처리' },
    { algo: 'MLFQ',     diff: '실행시간 기반',  jfi: '1.000', fit: '짧은 요청 우선' },
    { algo: 'WFQ',      diff: '구독 등급 기반', jfi: '0.316', fit: '등급별 차등 서비스' },
  ];

  let html = '<div class="fig-title">알고리즘 특성 비교 요약</div>';
  html += '<div style="padding:8px 40px;">';
  // AC-05: no border-radius on header
  html += '<div style="display:flex; background:#333333; overflow:hidden;">';
  ['알고리즘', '차등 서비스', '공정성 (JFI)', '적합 상황'].forEach((h, i) => {
    const flexVal = [1.5, 2, 1.5, 2.5][i];
    html += `<div style="flex:${flexVal}; padding:10px 14px; font-size:12px; font-weight:bold; color:#FFFFFF; text-align:center;">${h}</div>`;
  });
  html += '</div>';
  rows.forEach((row, ri) => {
    // AC-09: no rgba - use solid alternating colors
    const bg = ri % 2 === 0 ? '#F5F5F5' : '#FFFFFF';
    html += `<div style="display:flex; background:${bg}; border:1px solid #CCCCCC; border-top:none;">`;
    html += `<div style="flex:1.5; padding:14px; font-size:14px; font-weight:bold; color:#000000; text-align:center; border-right:1px solid #CCCCCC;">${row.algo}</div>`;
    html += `<div style="flex:2; padding:14px; font-size:12px; color:#333333; text-align:center; border-right:1px solid #CCCCCC;">${row.diff}</div>`;
    // AC-19: no colored text - all black
    html += `<div style="flex:1.5; padding:14px; font-size:13px; font-weight:bold; color:#000000; text-align:center; border-right:1px solid #CCCCCC;">${row.jfi}</div>`;
    html += `<div style="flex:2.5; padding:14px; font-size:12px; color:#000000; text-align:center;">${row.fit}</div>`;
    html += '</div>';
  });
  html += '</div>';
  html += '<div style="padding:6px 40px; font-size:10px; color:#333333;">JFI: 1.000 = 완전 공정 (모든 요청 동등 처리) | 0.316 = 차등 서비스 적용</div>';
  return wrapHtml(html);
}

// HTML for Fig1 (fig-1-algo-concepts, 2x2 grid)
function htmlFig8() {
  let html = '<div class="fig-title">그림 1. 스케줄링 알고리즘 개념 비교</div>';
  // AC-28: identical internal template per panel
  // AC-05: border-radius:0 throughout
  html += '<div style="display:grid; grid-template-columns:1fr 1fr; grid-auto-rows:min-content; gap:6px; padding:0 14px 6px;">';

  // FCFS panel
  html += '<div style="border:1.5px solid #000000; padding:12px; background:#FFFFFF;">';
  html += '<div style="font-size:13px; font-weight:bold; color:#000000;">FCFS (선착순)</div>';
  html += '<div style="font-size:9px; color:#333333; margin:3px 0 8px;">도착 순서대로 처리 — 선착순 단순 대기열</div>';
  html += '<div style="display:flex; align-items:center; gap:0; margin-top:8px;">';
  ['R1','R2','R3','R4'].forEach(r => {
    // AC-05: no border-radius, AC-09: no rgba
    html += `<div style="border:1px solid #000000; background:#F5F5F5; padding:10px 14px; font-size:11px; color:#000000; font-weight:bold;">${r}</div>`;
  });
  // AC-13: CSS right-triangle
  html += '<div style="display:flex; align-items:center; margin-left:8px;">';
  html += '<div style="width:0;height:0;border-top:7px solid transparent;border-bottom:7px solid transparent;border-left:11px solid #333333;"></div>';
  html += '</div>';
  html += '<div style="font-size:10px; color:#333333; margin-left:6px;">처리</div>';
  html += '</div></div>';

  // Priority panel
  html += '<div style="border:1.5px solid #000000; padding:12px; background:#FFFFFF;">';
  html += '<div style="font-size:13px; font-weight:bold; color:#000000;">Priority (우선순위)</div>';
  html += '<div style="font-size:9px; color:#333333; margin:3px 0 8px;">우선순위 높은 요청 선처리</div>';
  html += '<div style="display:flex; gap:8px; margin-top:8px;">';
  // AC-20: grayscale with border-weight distinction (same as PPTX version)
  [{ n:'URGENT', lw:'2px' }, { n:'HIGH', lw:'1.5px' }, { n:'NORMAL', lw:'1px' }, { n:'LOW', lw:'0.5px' }].forEach(r => {
    html += `<div style="border:${r.lw} solid #000000; background:#F5F5F5; padding:10px 14px; font-size:11px; font-weight:bold; color:#000000;">${r.n}</div>`;
  });
  html += '</div></div>';

  // MLFQ panel
  html += '<div style="border:1.5px solid #000000; padding:12px; background:#FFFFFF;">';
  html += '<div style="font-size:13px; font-weight:bold; color:#000000;">MLFQ (다단계 피드백 큐)</div>';
  html += '<div style="font-size:9px; color:#333333; margin:3px 0 8px;">짧은 요청 우선 + 시간 초과 시 강등</div>';
  html += '<div style="display:flex; gap:12px; margin-top:8px;">';
  html += '<div style="flex:1;">';
  // AC-20: Q0 dark -> Q3 light grayscale (4 queues matching 본문 표 3)
  [
    { n:'Q0 (1초 할당)', fill:'#333333', tc:'#FFFFFF', w:'100%' },
    { n:'Q1 (3초 할당)', fill:'#666666', tc:'#FFFFFF', w:'85%' },
    { n:'Q2 (8초 할당)', fill:'#999999', tc:'#000000', w:'70%' },
    { n:'Q3 (무제한)',   fill:'#CCCCCC', tc:'#000000', w:'55%' },
  ].forEach(q => {
    html += `<div style="border:1px solid #000000; background:${q.fill}; padding:6px 10px; margin-bottom:5px; font-size:10px; color:${q.tc}; width:${q.w};">${q.n}</div>`;
  });
  html += '</div>';
  // AC-13: CSS down-triangle for demotion
  html += '<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;">';
  html += '<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid #333333;"></div>';
  html += '<div style="font-size:9px; color:#333333; text-align:center;">강등</div>';
  html += '</div></div></div>';

  // WFQ panel
  html += '<div style="border:1.5px solid #000000; padding:12px; background:#FFFFFF;">';
  html += '<div style="font-size:13px; font-weight:bold; color:#000000;">WFQ (가중치 공정 큐잉)</div>';
  html += '<div style="font-size:9px; color:#333333; margin:3px 0 8px;">가중치 비율로 시간 할당</div>';
  // AC-20: proportional grayscale bars
  [
    { n:'Enterprise (w=100)', w:'95%',  fill:'#333333', tc:'#FFFFFF' },
    { n:'Premium (w=50)',     w:'65%',  fill:'#666666', tc:'#FFFFFF' },
    { n:'Standard (w=10)',    w:'38%',  fill:'#CCCCCC', tc:'#000000' },
    { n:'Free (w=1)',         w:'20%',  fill:'#F5F5F5', tc:'#000000' },
  ].forEach(t => {
    html += `<div style="border:1px solid #000000; background:${t.fill}; padding:6px 10px; margin-bottom:5px; width:${t.w}; font-size:10px; color:${t.tc};">${t.n}</div>`;
  });
  html += '</div>';

  html += '</div>';
  return wrapHtml(html);
}

// HTML for Fig5 (fig-5-experiment-setup)
function htmlFig9() {
  let html = '<div class="fig-title">그림 5. 실험 환경 구성도</div>';
  html += '<div style="padding:4px 28px; display:flex; flex-direction:column; gap:7px;">';

  // Request Generator (AC-05: no border-radius, AC-09: no rgba)
  html += '<div style="background:#333333; color:#FFFFFF; padding:10px; text-align:center; font-size:12px; font-weight:bold;">요청 생성 (Request Generator)</div>';

  // Down arrows + 3 experiment boxes
  html += '<div style="display:flex; gap:14px;">';
  const exps = [
    { title: '기본 실험',       detail: '500건, 4테넌트\n순차 도착',    engine: '시뮬레이션' },
    { title: 'MLFQ 선점형 실험', detail: '500건 × 5시드\n버스트 패턴', engine: '시뮬레이션' },
    { title: '실서버 실험',     detail: '20건\nOllama llama3.2',        engine: 'Ollama LLM' },
  ];
  exps.forEach(exp => {
    html += `<div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:3px;">`;
    // AC-13: CSS down-triangle
    html += '<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid #333333;"></div>';
    // AC-05: no border-radius, AC-09: no rgba
    html += `<div style="border:1.5px solid #000000; padding:10px; background:#FFFFFF; width:100%; text-align:center;">`;
    html += `<div style="font-size:11px; font-weight:bold; color:#000000; margin-bottom:3px;">${exp.title}</div>`;
    html += `<div style="font-size:10px; color:#333333; white-space:pre-line;">${exp.detail}</div>`;
    // AC-17: no italic for engine label
    html += `<div style="margin-top:5px; font-size:9px; color:#333333;">엔진: ${exp.engine}</div>`;
    html += `</div>`;
    // Down arrow to scheduler
    html += '<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid #333333;"></div>';
    html += `</div>`;
  });
  html += '</div>';

  // Scheduler box (AC-09: no rgba, AC-05: no border-radius)
  html += '<div style="border:1.5px solid #000000; padding:10px; background:#F5F5F5;">';
  html += '<div style="font-size:11px; font-weight:bold; color:#000000; margin-bottom:7px;">스케줄러 계층 (Scheduler Layer)</div>';
  html += '<div style="display:flex; gap:10px;">';
  ['FCFS', 'Priority', 'MLFQ', 'WFQ'].forEach(a => {
    // AC-05: no border-radius
    html += `<div style="flex:1; border:1px solid #000000; padding:7px; background:#FFFFFF; text-align:center; font-size:11px; font-weight:bold; color:#000000;">${a}</div>`;
  });
  html += '</div></div>';

  // AC-13: CSS down-triangle
  html += '<div style="text-align:center;">';
  html += '<div style="display:inline-block; width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid #333333;"></div>';
  html += '</div>';

  // Results box (AC-09: no rgba)
  html += '<div style="border:1.5px solid #000000; padding:10px; background:#F5F5F5; text-align:center;">';
  html += '<div style="font-size:11px; font-weight:bold; color:#000000;">결과 측정</div>';
  html += '<div style="font-size:10px; color:#333333; margin-top:3px;">평균 대기시간 · JFI · 요청 유형별 응답시간 · JSON 로그 기록</div>';
  html += '</div>';

  html += '</div>';
  return wrapHtml(html);
}

// HTML for Fig4 (fig-4-module-structure)
function htmlFig10ModuleStructure() {
  // AC-05: no border-radius, AC-09: no rgba, AC-19: black text
  const html = `
    <div class="fig-title">그림 4. 모듈 구조도 (Module Structure)</div>
    <div style="display:flex; flex-direction:column; align-items:center; gap:14px; padding:8px 40px;">
      <!-- Entry points: index.js (main) -> server.js (Express composition) -->
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="background:#333333; border:1.5px solid #000000; padding:8px 20px; font-weight:bold; color:#FFFFFF; font-size:13px; text-align:center;">
          index.js (진입점)
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
          <div style="font-size:9px; color:#333333;">호출</div>
          <div style="width:0;height:0;border-top:7px solid transparent;border-bottom:7px solid transparent;border-left:11px solid #333333;"></div>
        </div>
        <div style="background:#333333; border:1.5px solid #000000; padding:8px 20px; font-weight:bold; color:#FFFFFF; font-size:13px; text-align:center;">
          server.js (서버 구성)
        </div>
      </div>
      <!-- CSS down-triangle (AC-13: no unicode) -->
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid #333333;"></div>
      <!-- Modules row: identical width boxes (AC-25: grid-aligned) -->
      <div style="display:flex; gap:10px; flex-wrap:nowrap; justify-content:center; width:100%;">
        <div style="border:1.5px solid #000000; padding:9px 12px; text-align:center; width:140px; background:#F5F5F5;">
          <div style="font-weight:bold; color:#000000; font-size:11px;">api/</div>
          <div style="color:#333333; font-size:9px; margin-top:3px;">라우터</div>
        </div>
        <div style="border:1.5px solid #000000; padding:9px 12px; text-align:center; width:140px; background:#F5F5F5;">
          <div style="font-weight:bold; color:#000000; font-size:11px;">schedulers/</div>
          <div style="color:#333333; font-size:9px; margin-top:3px;">FCFS, Priority,<br>MLFQ, WFQ</div>
        </div>
        <div style="border:1.5px solid #000000; padding:9px 12px; text-align:center; width:140px; background:#F5F5F5;">
          <div style="font-weight:bold; color:#000000; font-size:11px;">queue/</div>
          <div style="color:#333333; font-size:9px; margin-top:3px;">메모리 큐</div>
        </div>
        <div style="border:1.5px solid #000000; padding:9px 12px; text-align:center; width:140px; background:#F5F5F5;">
          <div style="font-weight:bold; color:#000000; font-size:11px;">storage/</div>
          <div style="color:#333333; font-size:9px; margin-top:3px;">JSON 저장</div>
        </div>
        <div style="border:1.5px solid #000000; padding:9px 12px; text-align:center; width:140px; background:#F5F5F5;">
          <div style="font-weight:bold; color:#000000; font-size:11px;">llm/</div>
          <div style="color:#333333; font-size:9px; margin-top:3px;">Ollama 연동</div>
        </div>
      </div>
      <!-- rate-limiter (AC-25: same width as modules) -->
      <div style="display:flex; gap:10px; justify-content:center;">
        <div style="border:1.5px solid #000000; padding:9px 12px; text-align:center; width:140px; background:#F5F5F5;">
          <div style="font-weight:bold; color:#000000; font-size:11px;">rate-limiter/</div>
          <div style="color:#333333; font-size:9px; margin-top:3px;">요청 제한</div>
        </div>
      </div>
      <!-- tests: dashed (AC-12: dashed for reference/test-only scope) -->
      <div style="border:1.5px dashed #666666; padding:7px 28px; text-align:center; color:#333333; font-size:10px; background:#FFFFFF;">
        tests-simple/ (Jest 단위 테스트)
      </div>
      <div style="color:#333333; font-size:9px; margin-top:2px;">
        ※ 생산 의존성: Express.js 1개
      </div>
    </div>`;
  return wrapHtml(html);
}

// ─── PNG generation via Playwright ───

async function generatePNGs() {
  const browser = await chromium.launch();
  // AC-32: wide viewport (1280) with tall default; fullPage screenshot auto-clips to content height
  const context = await browser.newContext({ viewport: { width: 1280, height: 1200 } });

  const figures = [
    { name: 'fig-1-algo-concepts',       html: htmlFig8() },
    { name: 'fig-2-system-architecture', html: htmlFig1() },
    { name: 'fig-3-data-flow',           html: htmlFig2() },
    { name: 'fig-4-module-structure',    html: htmlFig10ModuleStructure() },
    { name: 'fig-5-experiment-setup',    html: htmlFig9() },
    { name: 'fig-6-avg-wait-time',       html: htmlFig3() },
    { name: 'fig-7-mlfq-vs-fcfs',        html: htmlFig4() },
    { name: 'fig-8-ollama-tier',         html: htmlFig5() },
    { name: 'fig-9-jfi-comparison',      html: htmlFig6() },
  ];

  for (const fig of figures) {
    const page = await context.newPage();
    await page.setContent(fig.html, { waitUntil: 'networkidle' });
    // Measure actual content bottom to clip precisely — eliminates canvas whitespace
    const contentHeight = await page.evaluate(() => {
      let maxBottom = 0;
      const walk = (el) => {
        if (el.nodeType !== 1) return;
        const rect = el.getBoundingClientRect();
        if (rect.bottom > maxBottom) maxBottom = rect.bottom;
        for (const child of el.children) walk(child);
      };
      walk(document.body);
      return Math.ceil(maxBottom) + 12; // small bottom padding
    });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `${fig.name}.png`),
      type: 'png',
      clip: { x: 0, y: 0, width: 1280, height: contentHeight }
    });
    await page.close();
    console.log(`  PNG: ${fig.name}.png (${contentHeight}px)`);
  }

  await browser.close();
}

// ─── Main ───

async function main() {
  console.log('최종보고서 그림 생성 시작 (SPEC-FIGURE-001 학술 스타일)...\n');

  const figures = [
    { name: 'fig-1-algo-concepts',       fn: createFig8 },
    { name: 'fig-2-system-architecture', fn: createFig1 },
    { name: 'fig-3-data-flow',           fn: createFig2 },
    { name: 'fig-4-module-structure',    fn: createFig10ModuleStructure },
    { name: 'fig-5-experiment-setup',    fn: createFig9 },
    { name: 'fig-6-avg-wait-time',       fn: createFig3 },
    { name: 'fig-7-mlfq-vs-fcfs',        fn: createFig4 },
    { name: 'fig-8-ollama-tier',         fn: createFig5 },
    { name: 'fig-9-jfi-comparison',      fn: createFig6 },
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
