/**
 * 중간보고서 그림 생성 스크립트
 * html2pptx 워크플로우 사용 (IEEE 학술 스타일)
 *
 * 사용법: NODE_PATH=$(pwd)/node_modules node generate-midterm-figures-new.js
 * 출력: midterm-figures.pptx
 */

const path = require('path');
const PptxGenJS = require('pptxgenjs');
const html2pptx = require(path.join(
  require('os').homedir(),
  '.copilot/skills/pptx/scripts/html2pptx.js'
));

const SLIDES_DIR = path.join(__dirname, 'slides');

async function generateMidtermFigures() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = '\uC11C\uBBFC\uC9C0 (C235180)';
  pptx.title = 'Midterm Report Figures - OS Scheduling for LLM API';

  // Slide 1
  console.log('[1/7] Algorithm Comparison...');
  await html2pptx(path.join(SLIDES_DIR, 'slide1-algo-comparison.html'), pptx);

  // Slide 2
  console.log('[2/7] Concept Mapping...');
  await html2pptx(path.join(SLIDES_DIR, 'slide2-concept-mapping.html'), pptx);

  // Slide 3
  console.log('[3/7] Architecture...');
  await html2pptx(path.join(SLIDES_DIR, 'slide3-architecture.html'), pptx);

  // Slide 4
  console.log('[4/7] MLFQ Structure...');
  await html2pptx(path.join(SLIDES_DIR, 'slide4-mlfq-structure.html'), pptx);

  // Slide 5
  console.log('[5/7] MLFQ Preemption...');
  await html2pptx(path.join(SLIDES_DIR, 'slide5-mlfq-preemption.html'), pptx);

  // Slide 6: Performance (with chart placeholders)
  console.log('[6/7] Performance...');
  const { slide: slide6, placeholders: ph6 } = await html2pptx(
    path.join(SLIDES_DIR, 'slide6-performance.html'),
    pptx
  );

  if (ph6[0]) {
    slide6.addChart(pptx.charts.BAR, [
      {
        name: 'Avg Wait (ms)',
        labels: ['FCFS', 'Priority', 'MLFQ', 'WFQ'],
        values: [2572, 2826, 2572, 2819]
      }
    ], {
      x: ph6[0].x, y: ph6[0].y, w: ph6[0].w, h: ph6[0].h,
      showTitle: false,
      showValue: true,
      valueFontSize: 7,
      catAxisLabelFontSize: 8,
      valAxisLabelFontSize: 7,
      chartColors: ['333333'],
      catGridLine: { style: 'none' },
      valGridLine: { color: 'DDDDDD', style: 'dash', size: 0.5 }
    });
  }

  if (ph6[1]) {
    slide6.addChart(pptx.charts.BAR, [
      {
        name: 'Response (ms)',
        labels: ['Enterprise', 'Premium', 'Standard', 'Free'],
        values: [849, 1520, 3120, 4894]
      }
    ], {
      x: ph6[1].x, y: ph6[1].y, w: ph6[1].w, h: ph6[1].h,
      showTitle: false,
      showValue: true,
      valueFontSize: 6,
      catAxisLabelFontSize: 7,
      valAxisLabelFontSize: 6,
      chartColors: ['555555'],
      catGridLine: { style: 'none' },
      valGridLine: { color: 'DDDDDD', style: 'dash', size: 0.5 }
    });
  }

  // Slide 7: Multi-seed validation (with chart placeholder)
  console.log('[7/7] Multi-Seed Validation...');
  const { slide: slide7, placeholders: ph7 } = await html2pptx(
    path.join(SLIDES_DIR, 'slide7-multiseed.html'),
    pptx
  );

  if (ph7[0]) {
    slide7.addChart(pptx.charts.BAR, [
      {
        name: 'Improvement (%)',
        labels: ['12345', '42', '7777', '99999', '31415', '27182', '65535', '11111', '54321', '88888'],
        values: [76.11, 73.25, 72.84, 74.92, 71.56, 73.10, 75.33, 72.98, 74.15, 73.56]
      }
    ], {
      x: ph7[0].x, y: ph7[0].y, w: ph7[0].w, h: ph7[0].h,
      showTitle: false,
      showValue: true,
      valueFontSize: 6,
      catAxisLabelFontSize: 6,
      valAxisLabelFontSize: 6,
      valAxisMinVal: 68,
      valAxisMaxVal: 78,
      chartColors: ['333333'],
      catGridLine: { style: 'none' },
      valGridLine: { color: 'DDDDDD', style: 'dash', size: 0.5 }
    });
  }

  const outputPath = path.join(__dirname, 'midterm-figures.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log('Done:', outputPath);
}

generateMidtermFigures().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
