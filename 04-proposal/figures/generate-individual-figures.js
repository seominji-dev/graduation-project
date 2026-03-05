/**
 * 개별 PPTX 그림 파일 생성 스크립트
 * 제안서 정책에 따라 그림별 개별 PPTX 파일 생성
 *
 * 사용법: node generate-individual-figures.js
 * 출력:
 *   - fig-1-scheduling-comparison.pptx
 *   - fig-2-system-architecture.pptx
 *   - fig-3-request-flow.pptx
 */

const path = require('path');
const PptxGenJS = require('pptxgenjs');
const html2pptx = require(path.join(
  require('os').homedir(),
  '.copilot/skills/pptx/scripts/html2pptx.js'
));

const SLIDES_DIR = path.join(__dirname, 'slides');
const OUTPUT_DIR = __dirname;

const FIGURES = [
  {
    name: 'fig-1-scheduling-comparison',
    title: '그림 1. 스케줄링 알고리즘 개념 비교',
    html: 'slide1-algo-comparison.html'
  },
  {
    name: 'fig-2-system-architecture',
    title: '그림 2. 시스템 아키텍처 (4계층 구조)',
    html: 'slide3-architecture.html'
  },
  {
    name: 'fig-3-request-flow',
    title: '그림 3. 요청 처리 흐름도',
    html: 'slide2-concept-mapping.html'
  }
];

async function generateFigure(fig) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = '서민지 (C235180)';
  pptx.title = fig.title;

  await html2pptx(path.join(SLIDES_DIR, fig.html), pptx);

  const outputPath = path.join(OUTPUT_DIR, `${fig.name}.pptx`);
  await pptx.writeFile({ fileName: outputPath });
  console.log(`  -> ${fig.name}.pptx`);
}

async function main() {
  console.log('=== 개별 PPTX 그림 파일 생성 ===\n');

  for (const fig of FIGURES) {
    console.log(`[${FIGURES.indexOf(fig) + 1}/${FIGURES.length}] ${fig.title}`);
    try {
      await generateFigure(fig);
    } catch (err) {
      console.error(`  오류: ${err.message}`);
    }
  }

  console.log('\n완료.');
}

main().catch(console.error);
