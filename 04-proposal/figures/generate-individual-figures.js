/**
 * 통합 PPTX 그림 파일 생성 스크립트
 * 모든 그림을 하나의 PPTX 파일에 슬라이드별로 생성
 *
 * 사용법: node generate-individual-figures.js
 * 출력: proposal-figures.pptx (슬라이드 3장)
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
    title: '그림 1. 스케줄링 알고리즘 개념 비교',
    html: 'slide1-algo-comparison.html'
  },
  {
    title: '그림 2. 시스템 아키텍처 (4계층 구조)',
    html: 'slide3-architecture.html'
  },
  {
    title: '그림 3. 요청 처리 흐름도',
    html: 'slide2-concept-mapping.html'
  }
];

async function main() {
  console.log('=== 통합 PPTX 그림 파일 생성 ===\n');

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = '서민지 (C235180)';
  pptx.title = '제안서 그림 모음';

  for (const fig of FIGURES) {
    const idx = FIGURES.indexOf(fig) + 1;
    console.log(`[${idx}/${FIGURES.length}] ${fig.title}`);
    try {
      await html2pptx(path.join(SLIDES_DIR, fig.html), pptx);
    } catch (err) {
      console.error(`  오류: ${err.message}`);
    }
  }

  const outputPath = path.join(OUTPUT_DIR, 'proposal-figures.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\n-> proposal-figures.pptx (${FIGURES.length}개 슬라이드)`);
  console.log('완료.');
}

main().catch(console.error);
