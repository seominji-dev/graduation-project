/**
 * 제안서 그림 생성 스크립트
 * html2pptx 워크플로우 사용 (IEEE 학술 스타일)
 *
 * 슬라이드 구성 (3장):
 *   1. 스케줄링 알고리즘 비교 다이어그램
 *   2. 시스템 아키텍처 (4계층 구조)
 *   3. 요청 처리 흐름도
 *
 * 제거된 슬라이드:
 *   - OS-LLM 개념 매핑 (표1과 정보 중복)
 *   - 성능 비교 차트 (제안서에는 표2로 충분, 중간/최종보고서에서 추가)
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
  console.log('[1/3] 알고리즘 비교...');
  await html2pptx(path.join(SLIDES_DIR, 'slide1-algo-comparison.html'), pptx);

  // 슬라이드 2: 시스템 아키텍처
  console.log('[2/3] 시스템 아키텍처...');
  await html2pptx(path.join(SLIDES_DIR, 'slide2-architecture.html'), pptx);

  // 슬라이드 3: 요청 처리 흐름도
  console.log('[3/3] 요청 처리 흐름도...');
  await html2pptx(path.join(SLIDES_DIR, 'slide3-request-flow.html'), pptx);

  // PPTX 저장
  const outputPath = path.join(__dirname, 'proposal-figures.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log('완료:', outputPath);
}

generateProposalFigures().catch(err => {
  console.error('생성 실패:', err.message);
  process.exit(1);
});
