/**
 * Final Report Figure Generation Script
 * Generates 4 figures as individual PPTX files + PNG screenshots
 * Refactored per SPEC-FIGURE-001: academic monochrome style (IEEE/ACM convention)
 *
 * Usage: node generate-final-figures.js
 * Output: fig-1 ~ fig-4 (PPTX + PNG each)
 *
 * Figure numbering matches body references in final-report.md:
 *   그림 1 (3.2 아키텍처): fig-1-system-architecture (createFig1)
 *   그림 2 (3.5 데이터흐름): fig-2-data-flow         (createFig2)
 *   그림 3 (4.2 모듈구조): fig-3-module-structure    (createFig3)
 *   그림 4 (5.4 Ollama):  fig-4-ollama-tier         (createFig5)
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
  slide.addText('그림 1. 시스템 아키텍처 (System Architecture)', {
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
  slide.addText('그림 2. 데이터 흐름도 (Data Flow)', {
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

// ─── Fig 5: 실서버 구독 등급별 평균 대기시간 (Grouped Bar Chart) ───
// Data (gemma4:e4b): FCFS=[432,1480,2522,3561], Priority=[664,1333,2541,3371], WFQ=[410,1458,2496,3542]
// AC-20: 3 grayscale shades: FCFS=BLACK, Priority=MID_GRAY, WFQ=LIGHT_GRAY

function createFig5(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 4. 실서버 구독 등급별 평균 대기시간 (ms)', {
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
      values: [432, 1480, 2522, 3561]
    },
    {
      name: 'Priority',
      labels: ['Enterprise', 'Premium', 'Standard', 'Free'],
      values: [664, 1333, 2541, 3371]
    },
    {
      name: 'WFQ',
      labels: ['Enterprise', 'Premium', 'Standard', 'Free'],
      values: [410, 1458, 2496, 3542]
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

// ─── Fig 3: 모듈 구조도 (Module Structure) ───
// Data preserved: server.js + api/ schedulers/ queue/ storage/ llm/ utils/rateLimiter.js + tests-simple/
// AC-25: grid alignment, AC-04: no radius, AC-07: no transparency

function createFig3(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 3. 모듈 구조도 (Module Structure)', {
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

  // utils/ box - Rate Limiter (AC-25: grid-aligned, same modW)
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.25, y: 3.20, w: modW, h: 0.60,
    fill: { color: COLORS.VERY_LIGHT },
    line: { color: COLORS.BLACK, width: 0.75 }
  });
  slide.addText('utils/\nrateLimiter.js (요청 제한)', {
    x: 0.25, y: 3.20, w: modW, h: 0.60,
    fontSize: SMALL_SIZE, fontFace: FONT, bold: true, color: COLORS.BLACK,
    align: 'center', valign: 'middle'
  });

  // Legend (AC-19: dark_gray text)
  slide.addText('※ 화살표: 의존 관계 (호출 방향)  ·  외부 의존성: Express.js (1개)', {
    x: 0.3, y: 4.10, w: 9.4, h: 0.25,
    fontSize: 8, fontFace: FONT, color: COLORS.DARK_GRAY, align: 'center'
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

// HTML for Fig1 (fig-1-system-architecture)
// 4 layers - Rate Limiter is embedded in API layer as accent sub-box (matches body 3.2)
function htmlFig1() {
  const layers = [
    { name: '클라이언트 계층 (Client)',                subs: ['REST Client', '대시보드 (Dashboard)'] },
    { name: 'API 계층 (Express.js + Rate Limiter)',   subs: ['요청 접수', '스케줄러 전환', '통계 조회', 'Rate Limiter (구독 등급·429 응답)'] },
    { name: '스케줄러 계층 (Scheduler)',               subs: ['FCFS', 'Priority', 'MLFQ', 'WFQ'] },
    { name: '저장소/LLM 계층 (Storage/LLM)',          subs: ['메모리 큐', 'JSON 로그', 'Ollama LLM'] },
  ];
  let html = '<div class="fig-title">그림 1. 시스템 아키텍처 (System Architecture)</div>';
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

// HTML for Fig2 (fig-2-data-flow)
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
  let html = '<div class="fig-title">그림 2. 데이터 흐름도 (Data Flow)</div>';
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

// HTML for Fig5 (fig-5-ollama-tier)
function htmlFig5() {
  const tiers = ['Enterprise', 'Premium', 'Standard', 'Free'];
  const fcfsVals     = [432, 1480, 2522, 3561];
  const priorityVals = [664, 1333, 2541, 3371];
  const wfqVals      = [410, 1458, 2496, 3542];
  const maxVal = 3800;
  const chartH = 390;
  // AC-20: 3-shade grayscale
  const schedulers = [
    { name: 'FCFS',     vals: fcfsVals,     fill: '#000000', tc: '#FFFFFF' },
    { name: 'Priority', vals: priorityVals, fill: '#666666', tc: '#FFFFFF' },
    { name: 'WFQ',      vals: wfqVals,      fill: '#CCCCCC', tc: '#000000' },
  ];

  let html = '<div class="fig-title">그림 4. 실서버 구독 등급별 평균 대기시간 (ms)</div>';
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

// HTML for Fig3 (fig-3-module-structure)
function htmlFig3() {
  // AC-05: no border-radius, AC-09: no rgba, AC-19: black text
  const html = `
    <div class="fig-title">그림 3. 모듈 구조도 (Module Structure)</div>
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
      <!-- utils/rateLimiter.js (AC-25: same width as modules) -->
      <div style="display:flex; gap:10px; justify-content:center;">
        <div style="border:1.5px solid #000000; padding:9px 12px; text-align:center; width:140px; background:#F5F5F5;">
          <div style="font-weight:bold; color:#000000; font-size:11px;">utils/</div>
          <div style="color:#333333; font-size:9px; margin-top:3px;">rateLimiter.js (요청 제한)</div>
        </div>
      </div>
      <div style="color:#333333; font-size:9px; margin-top:2px;">
        외부 의존성: Express.js (1개)
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
    { name: 'fig-1-system-architecture', html: htmlFig1() },
    { name: 'fig-2-data-flow',           html: htmlFig2() },
    { name: 'fig-3-module-structure',    html: htmlFig3() },
    { name: 'fig-4-ollama-tier',         html: htmlFig5() },
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
    { name: 'fig-1-system-architecture', fn: createFig1 },
    { name: 'fig-2-data-flow',           fn: createFig2 },
    { name: 'fig-3-module-structure',    fn: createFig3 },
    { name: 'fig-4-ollama-tier',         fn: createFig5 },
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
