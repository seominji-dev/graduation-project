/**
 * 제안서 그림 생성 스크립트
 * html2pptx 워크플로우 사용 (IEEE 학술 스타일)
 *
 * 사용법: node generate-proposal-figures.js
 * 출력: proposal-figures.pptx
 */

const path = require('path');
const PptxGenJS = require('pptxgenjs');
const html2pptx = require(path.join(
  require('os').homedir(),
  '.copilot/skills/pptx/scripts/html2pptx.js'
));

const SLIDES_DIR = path.join(__dirname, 'slides');

async function generateProposalFigures() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = '서민지 (C235180)';
  pptx.title = 'Proposal Figures - OS Scheduling for LLM API';

  // 슬라이드 1: OS 스케줄링 알고리즘 비교
  console.log('[1/4] 알고리즘 비교...');
  await html2pptx(path.join(SLIDES_DIR, 'slide1-algo-comparison.html'), pptx);

  // 슬라이드 2: OS-LLM 개념 매핑
  console.log('[2/4] 개념 매핑...');
  await html2pptx(path.join(SLIDES_DIR, 'slide2-concept-mapping.html'), pptx);

  // 슬라이드 3: 시스템 아키텍처
  console.log('[3/4] 시스템 아키텍처...');
  await html2pptx(path.join(SLIDES_DIR, 'slide3-architecture.html'), pptx);

  // 슬라이드 4: 성능 비교 (차트 placeholder 포함)
  console.log('[4/4] 성능 비교...');
  const { slide: slide4, placeholders } = await html2pptx(
    path.join(SLIDES_DIR, 'slide4-performance.html'),
    pptx
  );

  // placeholder[0]: 메인 차트 (Average Wait Time)
  if (placeholders[0]) {
    slide4.addChart(pptx.charts.BAR, [
      {
        name: 'Avg Wait (ms)',
        labels: ['FCFS', 'Priority', 'MLFQ', 'WFQ'],
        values: [2572, 2826, 2572, 2819]
      }
    ], {
      x: placeholders[0].x,
      y: placeholders[0].y,
      w: placeholders[0].w,
      h: placeholders[0].h,
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

  // placeholder[1]: WFQ 테넌트 차트
  if (placeholders[1]) {
    slide4.addChart(pptx.charts.BAR, [
      {
        name: 'Response (ms)',
        labels: ['Enterprise', 'Premium', 'Standard', 'Free'],
        values: [849, 1256, 3278, 4894]
      }
    ], {
      x: placeholders[1].x,
      y: placeholders[1].y,
      w: placeholders[1].w,
      h: placeholders[1].h,
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

  // PPTX 저장
  const outputPath = path.join(__dirname, 'proposal-figures.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log('완료:', outputPath);
}

generateProposalFigures().catch(err => {
  console.error('생성 실패:', err.message);
  process.exit(1);
});
