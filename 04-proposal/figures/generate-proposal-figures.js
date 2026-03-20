/**
 * 제안서 그림 생성 스크립트
 * html2pptx 워크플로우 사용 (IEEE 학술 스타일)
 *
 * 슬라이드 구성 (2장, v27):
 *   1. 스케줄링 알고리즘 비교 다이어그램 (FCFS, Priority, MLFQ, WFQ)
 *   2. OS 스케줄링과 LLM 요청 관리의 개념적 대응
 *
 * v27 변경사항:
 *   - Slide 1: Rate Limiter 보조 기능 섹션 제거 (제안서 경량화)
 *   - Slide 2: 하단 노트를 탐구적 어조로 변경
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
  console.log('[1/2] 알고리즘 비교...');
  await html2pptx(path.join(SLIDES_DIR, 'slide1-algo-comparison.html'), pptx);

  // 슬라이드 2: OS 스케줄링과 LLM 요청 관리의 개념적 대응
  console.log('[2/2] 개념적 대응...');
  await html2pptx(path.join(SLIDES_DIR, 'slide2-architecture.html'), pptx);

  // PPTX 저장
  const outputPath = path.join(__dirname, 'proposal-figures.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log('완료:', outputPath);
}

generateProposalFigures().catch(err => {
  console.error('생성 실패:', err.message);
  process.exit(1);
});
