/**
 * 중간보고서 v3 그림 생성 스크립트
 * pptxgenjs로 개별 PPTX 생성 + Playwright로 PNG 스크린샷
 *
 * 사용법: node generate-figures-v3.js
 * 출력: fig-1 ~ fig-5 (PPTX + PNG)
 */

const PptxGenJS = require('pptxgenjs');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = __dirname;

// 공통 스타일
const COLORS = {
  primary: '2563EB',    // 파란색
  secondary: '64748B',  // 회색
  accent: '059669',     // 녹색
  warning: 'D97706',    // 주황
  light: 'F1F5F9',      // 밝은 회색
  white: 'FFFFFF',
  black: '1E293B',
  border: 'CBD5E1',
  q0: '2563EB',
  q1: '3B82F6',
  q2: '60A5FA',
  q3: '93C5FD',
};

const FONT = '맑은 고딕';
const TITLE_SIZE = 18;
const BODY_SIZE = 11;
const SMALL_SIZE = 9;

// ─── 그림 1: 시스템 아키텍처 4계층 ───

function createFig1(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 1. 시스템 아키텍처', {
    x: 0.5, y: 0.2, w: 9, h: 0.5,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });

  const layers = [
    {
      name: '클라이언트 계층', color: COLORS.primary, y: 0.9,
      subs: ['REST Client', '대시보드']
    },
    {
      name: 'API 계층 (Express.js)', color: COLORS.accent, y: 2.15,
      subs: ['요청 접수', '스케줄러 전환', '통계 조회']
    },
    {
      name: '스케줄러 계층', color: COLORS.warning, y: 3.4,
      subs: ['FCFS', 'Priority', 'MLFQ', 'WFQ']
    },
    {
      name: '저장소 계층', color: COLORS.secondary, y: 4.65,
      subs: ['메모리 큐', 'JSON 로그', 'Ollama']
    },
  ];

  layers.forEach(layer => {
    // 계층 박스
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 1.0, y: layer.y, w: 8.0, h: 1.0,
      fill: { color: layer.color, transparency: 90 },
      line: { color: layer.color, width: 2 },
      rectRadius: 0.1
    });
    // 계층 이름
    slide.addText(layer.name, {
      x: 1.2, y: layer.y + 0.02, w: 3.5, h: 0.35,
      fontSize: 12, fontFace: FONT, bold: true, color: layer.color
    });
    // 서브 컴포넌트 박스들
    const subCount = layer.subs.length;
    const subW = subCount === 4 ? 1.6 : (subCount === 2 ? 2.5 : 2.0);
    const totalSubW = subCount * subW + (subCount - 1) * 0.25;
    const startX = 1.2 + (7.5 - totalSubW) / 2;

    layer.subs.forEach((sub, i) => {
      const sx = startX + i * (subW + 0.25);
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: sx, y: layer.y + 0.4, w: subW, h: 0.45,
        fill: { color: COLORS.white },
        line: { color: layer.color, width: 1.2, dashType: 'solid' },
        rectRadius: 0.05
      });
      slide.addText(sub, {
        x: sx, y: layer.y + 0.4, w: subW, h: 0.45,
        fontSize: SMALL_SIZE, fontFace: FONT, color: layer.color,
        align: 'center', valign: 'middle', bold: true
      });
    });
  });

  // 양방향 화살표 (계층 간) + 라벨
  for (let i = 0; i < 3; i++) {
    const arrowY = layers[i].y + 1.0;
    // 하향 화살표 (요청)
    slide.addShape(pptx.shapes.DOWN_ARROW, {
      x: 4.4, y: arrowY, w: 0.5, h: 0.25,
      fill: { color: layers[i].color }
    });
    slide.addText('요청', {
      x: 3.7, y: arrowY - 0.02, w: 0.65, h: 0.25,
      fontSize: 7, fontFace: FONT, color: layers[i].color, align: 'center', valign: 'middle'
    });
    // 상향 화살표 (응답)
    slide.addShape(pptx.shapes.UP_ARROW, {
      x: 5.1, y: arrowY, w: 0.5, h: 0.25,
      fill: { color: layers[i + 1].color }
    });
    slide.addText('응답', {
      x: 5.65, y: arrowY - 0.02, w: 0.65, h: 0.25,
      fontSize: 7, fontFace: FONT, color: layers[i + 1].color, align: 'center', valign: 'middle'
    });
  }
}

// ─── 그림 2: 모듈 구조도 ───

function createFig2(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 2. 모듈 구조도', {
    x: 0.5, y: 0.2, w: 9, h: 0.5,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });

  // server.js (중앙 상단)
  const serverX = 3.5, serverY = 0.9, serverW = 3.0, serverH = 0.7;
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: serverX, y: serverY, w: serverW, h: serverH,
    fill: { color: COLORS.primary }, line: { color: COLORS.primary, width: 1 }, rectRadius: 0.1
  });
  slide.addText('server.js\n(진입점)', {
    x: serverX, y: serverY, w: serverW, h: serverH,
    fontSize: BODY_SIZE, fontFace: FONT, color: COLORS.white, align: 'center', valign: 'middle'
  });

  // 하위 모듈들
  const modules = [
    { name: 'api/\nroutes.js', x: 0.5, y: 2.3, color: COLORS.accent },
    { name: 'schedulers/\n(4개 알고리즘)', x: 2.7, y: 2.3, color: COLORS.warning },
    { name: 'queue/\nMemoryQueue.js', x: 4.9, y: 2.3, color: COLORS.secondary },
    { name: 'storage/\nJSONStore.js', x: 7.1, y: 2.3, color: COLORS.secondary },
  ];

  // server.js -> 각 모듈 연결선 (대시 스타일의 얇은 사각형)
  const serverCenterX = serverX + serverW / 2;
  const serverBottom = serverY + serverH;
  modules.forEach(mod => {
    const modCenterX = mod.x + 1.0;
    // 수직선: server.js 아래에서 중간 높이까지
    const midY = serverBottom + 0.3;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: serverCenterX - 0.01, y: serverBottom, w: 0.02, h: midY - serverBottom,
      fill: { color: COLORS.border }, line: { style: 'none' }
    });
    // 수평선: server 중앙에서 모듈 중앙까지
    const leftX = Math.min(serverCenterX, modCenterX);
    const rightX = Math.max(serverCenterX, modCenterX);
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: leftX, y: midY - 0.01, w: rightX - leftX, h: 0.02,
      fill: { color: COLORS.border }, line: { style: 'none' }
    });
    // 수직선: 중간 높이에서 모듈 박스 상단까지
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: modCenterX - 0.01, y: midY, w: 0.02, h: mod.y - midY,
      fill: { color: COLORS.border }, line: { style: 'none' }
    });
  });

  modules.forEach(mod => {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: mod.x, y: mod.y, w: 2.0, h: 0.9,
      fill: { color: mod.color, transparency: 85 },
      line: { color: mod.color, width: 1.5 }, rectRadius: 0.1
    });
    slide.addText(mod.name, {
      x: mod.x, y: mod.y, w: 2.0, h: 0.9,
      fontSize: 10, fontFace: FONT, color: mod.color, align: 'center', valign: 'middle'
    });
  });

  // "공통 인터페이스" 라벨 박스
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 1.0, y: 3.6, w: 1.5, h: 0.5,
    fill: { color: COLORS.light },
    line: { color: COLORS.border, width: 1, dashType: 'dash' }, rectRadius: 0.05
  });
  slide.addText('공통 인터페이스', {
    x: 1.0, y: 3.6, w: 1.5, h: 0.5,
    fontSize: 8, fontFace: FONT, color: COLORS.secondary, align: 'center', valign: 'middle', italic: true
  });

  // BaseScheduler
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 2.7, y: 3.55, w: 4.6, h: 0.6,
    fill: { color: COLORS.light }, line: { color: COLORS.border, width: 1 }, rectRadius: 0.05
  });
  slide.addText('BaseScheduler (enqueue / dequeue)', {
    x: 2.7, y: 3.55, w: 4.6, h: 0.6,
    fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.secondary, align: 'center', valign: 'middle'
  });

  // 스케줄러 상세 (하단)
  const schedulers = [
    { name: 'FCFS', x: 1.5 },
    { name: 'Priority', x: 3.2 },
    { name: 'MLFQ', x: 4.9 },
    { name: 'WFQ', x: 6.6 },
  ];

  // BaseScheduler -> 각 스케줄러 연결선 + "상속" 라벨
  const baseCenterY = 3.55 + 0.6;
  const schedY = 4.5;
  schedulers.forEach((s, i) => {
    const sCenterX = s.x + 0.75;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: sCenterX - 0.01, y: baseCenterY, w: 0.02, h: schedY - baseCenterY,
      fill: { color: COLORS.warning, transparency: 50 }, line: { style: 'none' }
    });
  });
  // "상속" 라벨 (중앙 연결선 옆)
  slide.addText('상속', {
    x: 4.2, y: 4.15, w: 0.6, h: 0.25,
    fontSize: 7, fontFace: FONT, color: COLORS.warning, align: 'center', valign: 'middle',
    italic: true
  });

  schedulers.forEach(s => {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: s.x, y: schedY, w: 1.5, h: 0.55,
      fill: { color: COLORS.warning, transparency: 85 },
      line: { color: COLORS.warning, width: 1 }, rectRadius: 0.05
    });
    slide.addText(s.name, {
      x: s.x, y: schedY, w: 1.5, h: 0.55,
      fontSize: 10, fontFace: FONT, color: COLORS.warning, align: 'center', valign: 'middle', bold: true
    });
  });

  // llm/ 모듈 (storage 옆)
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 7.1, y: 3.55, w: 2.0, h: 0.6,
    fill: { color: COLORS.primary, transparency: 85 },
    line: { color: COLORS.primary, width: 1 }, rectRadius: 0.05
  });
  slide.addText('llm/\nOllamaClient.js', {
    x: 7.1, y: 3.55, w: 2.0, h: 0.6,
    fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.primary, align: 'center', valign: 'middle'
  });
  // storage -> llm 연결선 (수직)
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 8.1 - 0.01, y: 2.3 + 0.9, w: 0.02, h: 3.55 - (2.3 + 0.9),
    fill: { color: COLORS.border }, line: { style: 'none' }
  });
}

// ─── 그림 3: 데이터 흐름도 ───

function createFig3(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 3. 데이터 흐름도', {
    x: 0.5, y: 0.2, w: 9, h: 0.5,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });

  // 상단 행: 1~5단계 (좌에서 우로)
  const topSteps = [
    { label: '1. 요청 전송', detail: 'POST /api/requests', status: 'PENDING', x: 0.3, color: COLORS.primary },
    { label: '2. 입력 검증', detail: 'API 계층', status: 'PENDING', x: 2.15, color: COLORS.accent },
    { label: '3. 큐 등록', detail: 'enqueue()', status: 'QUEUED', x: 4.0, color: COLORS.warning },
    { label: '4. 스케줄링', detail: 'dequeue()', status: 'PROCESSING', x: 5.85, color: COLORS.warning },
    { label: '5. LLM 호출', detail: 'Ollama API', status: 'PROCESSING', x: 7.7, color: COLORS.primary },
  ];

  const topY = 1.0;
  const boxW = 1.65;
  const boxH = 1.3;

  topSteps.forEach(step => {
    // 스텝 박스
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: step.x, y: topY, w: boxW, h: boxH,
      fill: { color: step.color, transparency: 85 },
      line: { color: step.color, width: 1.5 }, rectRadius: 0.1
    });
    slide.addText(step.label, {
      x: step.x, y: topY + 0.1, w: boxW, h: 0.4,
      fontSize: 10, fontFace: FONT, bold: true, color: step.color, align: 'center'
    });
    slide.addText(step.detail, {
      x: step.x, y: topY + 0.5, w: boxW, h: 0.35,
      fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.secondary, align: 'center'
    });
    // 상태 라벨 (박스 아래)
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: step.x + 0.2, y: topY + boxH + 0.08, w: boxW - 0.4, h: 0.3,
      fill: { color: step.color, transparency: 70 },
      line: { style: 'none' }, rectRadius: 0.05
    });
    slide.addText(step.status, {
      x: step.x + 0.2, y: topY + boxH + 0.08, w: boxW - 0.4, h: 0.3,
      fontSize: 7, fontFace: FONT, color: step.color, align: 'center', valign: 'middle', bold: true
    });
  });

  // 상단 행 화살표 (1->2->3->4->5)
  for (let i = 0; i < 4; i++) {
    slide.addShape(pptx.shapes.RIGHT_ARROW, {
      x: topSteps[i].x + boxW, y: topY + 0.4, w: topSteps[i + 1].x - (topSteps[i].x + boxW), h: 0.3,
      fill: { color: COLORS.border }
    });
  }

  // 하단 행: 6단계 (우측 아래에서 좌측으로 돌아옴)
  const bottomY = 3.2;

  // 5 -> 6 수직 연결 (하향)
  slide.addShape(pptx.shapes.DOWN_ARROW, {
    x: topSteps[4].x + 0.5, y: topY + boxH + 0.4, w: 0.5, h: bottomY - (topY + boxH + 0.4),
    fill: { color: COLORS.border }
  });

  // 6단계 박스
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 5.85, y: bottomY, w: 3.5, h: 1.1,
    fill: { color: COLORS.accent, transparency: 85 },
    line: { color: COLORS.accent, width: 1.5 }, rectRadius: 0.1
  });
  slide.addText('6. 응답 반환 + 이력 저장', {
    x: 5.85, y: bottomY + 0.1, w: 3.5, h: 0.4,
    fontSize: 11, fontFace: FONT, bold: true, color: COLORS.accent, align: 'center'
  });
  slide.addText('JSON 로그 기록 / 클라이언트 응답', {
    x: 5.85, y: bottomY + 0.5, w: 3.5, h: 0.35,
    fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.secondary, align: 'center'
  });
  // COMPLETED 상태 라벨
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.85, y: bottomY + 1.15, w: 1.5, h: 0.3,
    fill: { color: COLORS.accent, transparency: 70 },
    line: { style: 'none' }, rectRadius: 0.05
  });
  slide.addText('COMPLETED', {
    x: 6.85, y: bottomY + 1.15, w: 1.5, h: 0.3,
    fontSize: 7, fontFace: FONT, color: COLORS.accent, align: 'center', valign: 'middle', bold: true
  });

  // "반복" 화살표: 6단계에서 3단계로 돌아가는 경로
  // 6 좌측 -> 수평 좌로 -> 수직 위로 -> 3단계 하단
  const returnY = bottomY + 0.5;
  // 수평선 (6 좌측 -> 3 아래)
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 4.0 + boxW / 2 - 0.01, y: returnY, w: 5.85 - (4.0 + boxW / 2), h: 0.025,
    fill: { color: COLORS.border }, line: { style: 'none' }
  });
  // 좌측 화살표
  slide.addShape(pptx.shapes.LEFT_ARROW, {
    x: 4.0 + boxW / 2 - 0.5, y: returnY - 0.15, w: 0.5, h: 0.35,
    fill: { color: COLORS.warning, transparency: 40 }
  });
  // "반복" 라벨
  slide.addText('반복 (다음 요청 처리)', {
    x: 4.5, y: returnY + 0.1, w: 2.5, h: 0.3,
    fontSize: 8, fontFace: FONT, color: COLORS.secondary, align: 'center', italic: true
  });

  // 전체 요청 수명 주기 요약
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.3, y: bottomY, w: 5.2, h: 1.1,
    fill: { color: COLORS.light },
    line: { color: COLORS.border, width: 1, dashType: 'dash' }, rectRadius: 0.1
  });
  slide.addText([
    { text: '요청 수명 주기 (Request Lifecycle)\n', options: { fontSize: 10, bold: true, color: COLORS.black } },
    { text: 'PENDING', options: { fontSize: 9, bold: true, color: COLORS.primary } },
    { text: '  →  ', options: { fontSize: 9, color: COLORS.secondary } },
    { text: 'QUEUED', options: { fontSize: 9, bold: true, color: COLORS.warning } },
    { text: '  →  ', options: { fontSize: 9, color: COLORS.secondary } },
    { text: 'PROCESSING', options: { fontSize: 9, bold: true, color: COLORS.warning } },
    { text: '  →  ', options: { fontSize: 9, color: COLORS.secondary } },
    { text: 'COMPLETED', options: { fontSize: 9, bold: true, color: COLORS.accent } },
    { text: '\n각 단계에서 상태가 JSON 로그에 기록됨', options: { fontSize: 8, color: COLORS.secondary, italic: true } },
  ], {
    x: 0.5, y: bottomY + 0.1, w: 4.8, h: 0.9,
    fontFace: FONT, valign: 'middle'
  });
}

// ─── 그림 4: 스케줄링 알고리즘 비교 ───

function createFig4(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 4. 스케줄링 알고리즘 비교', {
    x: 0.5, y: 0.2, w: 9, h: 0.5,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });

  // 구분선: 수평 (y=2.15)
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.3, y: 2.15, w: 9.4, h: 0.015,
    fill: { color: COLORS.border }, line: { style: 'none' }
  });
  // 구분선: 수직 (x=5.0)
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 5.0, y: 0.75, w: 0.015, h: 4.55,
    fill: { color: COLORS.border }, line: { style: 'none' }
  });

  // === FCFS (좌상) ===
  slide.addText('FCFS (선착순)', {
    x: 0.3, y: 0.8, w: 4.5, h: 0.3,
    fontSize: 12, fontFace: FONT, bold: true, color: COLORS.primary
  });
  slide.addText('먼저 온 순서대로', {
    x: 0.3, y: 1.08, w: 4.5, h: 0.25,
    fontSize: 9, fontFace: FONT, color: COLORS.secondary, italic: true
  });
  const fcfsReqs = ['R1', 'R2', 'R3', 'R4', 'R5'];
  fcfsReqs.forEach((r, i) => {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.5 + i * 0.8, y: 1.4, w: 0.7, h: 0.5,
      fill: { color: COLORS.primary, transparency: 70 },
      line: { color: COLORS.primary, width: 1 }
    });
    slide.addText(r, {
      x: 0.5 + i * 0.8, y: 1.4, w: 0.7, h: 0.5,
      fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.primary, align: 'center', valign: 'middle'
    });
  });
  slide.addShape(pptx.shapes.RIGHT_ARROW, {
    x: 4.5, y: 1.5, w: 0.4, h: 0.3, fill: { color: COLORS.primary }
  });
  slide.addText('처리', { x: 4.4, y: 1.85, w: 0.5, h: 0.2, fontSize: 8, fontFace: FONT, color: COLORS.secondary, align: 'center' });

  // === Priority (우상) ===
  slide.addText('Priority (우선순위)', {
    x: 5.3, y: 0.8, w: 4.5, h: 0.3,
    fontSize: 12, fontFace: FONT, bold: true, color: COLORS.warning
  });
  slide.addText('급한 것 먼저', {
    x: 5.3, y: 1.08, w: 4.5, h: 0.25,
    fontSize: 9, fontFace: FONT, color: COLORS.secondary, italic: true
  });
  const priReqs = [
    { name: 'URG', color: 'DC2626' },
    { name: 'HIGH', color: 'EA580C' },
    { name: 'NORM', color: 'CA8A04' },
    { name: 'LOW', color: '65A30D' },
  ];
  priReqs.forEach((r, i) => {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 5.5 + i * 1.0, y: 1.4, w: 0.9, h: 0.5,
      fill: { color: r.color, transparency: 70 },
      line: { color: r.color, width: 1 }
    });
    slide.addText(r.name, {
      x: 5.5 + i * 1.0, y: 1.4, w: 0.9, h: 0.5,
      fontSize: 8, fontFace: FONT, color: r.color, align: 'center', valign: 'middle', bold: true
    });
  });

  // === MLFQ (좌하) ===
  slide.addText('MLFQ (다단계 피드백 큐)', {
    x: 0.3, y: 2.3, w: 4.5, h: 0.3,
    fontSize: 12, fontFace: FONT, bold: true, color: COLORS.q0
  });
  slide.addText('짧은 요청 우선 + 자동 조정', {
    x: 0.3, y: 2.58, w: 4.5, h: 0.25,
    fontSize: 9, fontFace: FONT, color: COLORS.secondary, italic: true
  });
  const queues = [
    { name: 'Q0 (1초)', y: 2.9, color: COLORS.q0 },
    { name: 'Q1 (3초)', y: 3.35, color: COLORS.q1 },
    { name: 'Q2 (8초)', y: 3.8, color: COLORS.q2 },
    { name: 'Q3 (무제한)', y: 4.25, color: COLORS.q3 },
  ];
  queues.forEach(q => {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.5, y: q.y, w: 3.5, h: 0.38,
      fill: { color: q.color, transparency: 80 },
      line: { color: q.color, width: 1 }
    });
    slide.addText(q.name, {
      x: 0.6, y: q.y, w: 2.0, h: 0.38,
      fontSize: SMALL_SIZE, fontFace: FONT, color: q.color, valign: 'middle'
    });
  });
  // 강등 화살표
  slide.addShape(pptx.shapes.DOWN_ARROW, {
    x: 2.7, y: 3.28, w: 0.35, h: 1.15,
    fill: { color: COLORS.border }
  });
  slide.addText('시간 초과 시\n강등', {
    x: 3.1, y: 3.5, w: 1.0, h: 0.5,
    fontSize: 8, fontFace: FONT, color: COLORS.secondary, align: 'center'
  });
  // Boost 라벨
  slide.addShape(pptx.shapes.UP_ARROW, {
    x: 4.1, y: 3.9, w: 0.3, h: 0.6,
    fill: { color: COLORS.q0, transparency: 50 }
  });
  slide.addText('Boost', {
    x: 4.05, y: 4.55, w: 0.5, h: 0.2,
    fontSize: 7, fontFace: FONT, color: COLORS.q0, align: 'center', bold: true
  });

  // === WFQ (우하) ===
  slide.addText('WFQ (가중치 공정 큐잉)', {
    x: 5.3, y: 2.3, w: 4.5, h: 0.3,
    fontSize: 12, fontFace: FONT, bold: true, color: COLORS.accent
  });
  slide.addText('가중치만큼 공정하게', {
    x: 5.3, y: 2.58, w: 4.5, h: 0.25,
    fontSize: 9, fontFace: FONT, color: COLORS.secondary, italic: true
  });
  const tenants = [
    { name: 'Enterprise (w=100)', w: 3.5, color: COLORS.accent },
    { name: 'Premium (w=50)', w: 2.5, color: COLORS.accent },
    { name: 'Standard (w=10)', w: 1.5, color: COLORS.accent },
    { name: 'Free (w=1)', w: 0.8, color: COLORS.accent },
  ];
  tenants.forEach((t, i) => {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 5.5, y: 2.9 + i * 0.45, w: t.w, h: 0.35,
      fill: { color: t.color, transparency: 70 + i * 5 },
      line: { color: t.color, width: 1 }
    });
    slide.addText(t.name, {
      x: 5.6, y: 2.9 + i * 0.45, w: 3.5, h: 0.35,
      fontSize: 8, fontFace: FONT, color: COLORS.accent, valign: 'middle'
    });
  });
  slide.addText('가중치에 비례하여\n자원 배분', {
    x: 5.5, y: 4.6, w: 3.5, h: 0.4,
    fontSize: SMALL_SIZE, fontFace: FONT, color: COLORS.secondary, align: 'center', italic: true
  });
}

// ─── 그림 5: 실험 결과 차트 ───

function createFig5(pptx) {
  const slide = pptx.addSlide();
  slide.addText('그림 5. 중간 실험 결과', {
    x: 0.5, y: 0.2, w: 9, h: 0.5,
    fontSize: TITLE_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });

  // 차트 1: 알고리즘별 평균 대기시간 (100건)
  slide.addText('(a) 알고리즘별 평균 대기시간 (100건 실험)', {
    x: 0.3, y: 0.8, w: 5.0, h: 0.3,
    fontSize: BODY_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });

  slide.addChart(pptx.charts.BAR, [
    {
      name: '평균 대기시간 (ms)',
      labels: ['FCFS', 'Priority', 'MLFQ', 'WFQ'],
      values: [2572, 2826, 2572, 2819]
    }
  ], {
    x: 0.3, y: 1.1, w: 4.5, h: 2.5,
    showTitle: false,
    showValue: true,
    valueFontSize: 8,
    catAxisLabelFontSize: 9,
    valAxisLabelFontSize: 8,
    chartColors: [COLORS.primary],
    catGridLine: { style: 'none' },
    valGridLine: { color: 'EEEEEE', style: 'dash', size: 0.5 }
  });

  // 차트 (a) 평균 참조선 시뮬레이션 (수평 대시 사각형)
  // 평균 = (2572+2826+2572+2819)/4 = 2697.25, 차트 높이 비율로 위치 추정
  // 차트 영역: y=1.1 ~ y=3.6 (높이 2.5), valAxis 최대값 약 3000으로 추정
  const avgVal = 2697;
  const chartTop = 1.1;
  const chartH = 2.5;
  const chartInnerTop = chartTop + 0.15;    // 차트 내부 상단 여백
  const chartInnerBottom = chartTop + chartH - 0.35;  // 차트 내부 하단 여백
  const innerH = chartInnerBottom - chartInnerTop;
  const maxVal = 3200;
  const refLineY = chartInnerBottom - (avgVal / maxVal) * innerH;
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.9, y: refLineY, w: 3.5, h: 0.015,
    fill: { color: 'DC2626' }, line: { style: 'none' }
  });
  slide.addText('avg: 2,697ms', {
    x: 3.2, y: refLineY - 0.22, w: 1.3, h: 0.2,
    fontSize: 7, fontFace: FONT, color: 'DC2626', align: 'center', bold: true
  });

  // 차트 2: WFQ 등급별 대기시간
  slide.addText('(b) WFQ 등급별 대기시간', {
    x: 5.3, y: 0.8, w: 4.5, h: 0.3,
    fontSize: BODY_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });

  slide.addChart(pptx.charts.BAR, [
    {
      name: '대기시간 (ms)',
      labels: ['Enterprise\n(w=100)', 'Premium\n(w=50)', 'Standard\n(w=10)', 'Free\n(w=1)'],
      values: [849, 2103, 3431, 4894]
    }
  ], {
    x: 5.3, y: 1.1, w: 4.2, h: 2.5,
    showTitle: false,
    showValue: true,
    valueFontSize: 8,
    catAxisLabelFontSize: 8,
    valAxisLabelFontSize: 8,
    chartColors: [COLORS.accent],
    catGridLine: { style: 'none' },
    valGridLine: { color: 'EEEEEE', style: 'dash', size: 0.5 }
  });

  // 차트 3: MLFQ 선점형 효과 (짧은 요청)
  slide.addText('(c) MLFQ 선점형 효과 — 짧은 요청 대기시간 (10회 반복)', {
    x: 0.3, y: 3.8, w: 9.0, h: 0.3,
    fontSize: BODY_SIZE, fontFace: FONT, bold: true, color: COLORS.black
  });

  slide.addChart(pptx.charts.BAR, [
    {
      name: 'FCFS',
      labels: ['짧은 요청 평균 대기시간'],
      values: [651]
    },
    {
      name: 'MLFQ (선점형)',
      labels: ['짧은 요청 평균 대기시간'],
      values: [170]
    }
  ], {
    x: 0.3, y: 4.1, w: 4.5, h: 1.5,
    showTitle: false,
    showValue: true,
    valueFontSize: 9,
    catAxisLabelFontSize: 9,
    valAxisLabelFontSize: 8,
    chartColors: ['B0BEC5', COLORS.primary],
    catGridLine: { style: 'none' },
    valGridLine: { color: 'EEEEEE', style: 'dash', size: 0.5 },
    showLegend: true,
    legendPos: 'b',
    legendFontSize: 8,
    valAxisTitle: 'ms',
    valAxisTitleFontSize: 8
  });

  // "약 74% 감소" 볼드 주석 (두 막대 사이)
  slide.addText('약 74% 감소', {
    x: 1.5, y: 4.3, w: 1.5, h: 0.35,
    fontSize: 11, fontFace: FONT, bold: true, color: 'DC2626', align: 'center', valign: 'middle'
  });

  // 핵심 수치 요약 박스
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 5.3, y: 4.1, w: 4.2, h: 1.5,
    fill: { color: COLORS.light },
    line: { color: COLORS.border, width: 1 }, rectRadius: 0.1
  });
  slide.addText([
    { text: '핵심 결과 요약\n', options: { fontSize: 12, bold: true, color: COLORS.black } },
    { text: '\n', options: { fontSize: 4 } },
    { text: 'Priority: ', options: { fontSize: 10, bold: true, color: COLORS.warning } },
    { text: 'URGENT 요청 56% 빠름\n', options: { fontSize: 10, color: COLORS.black } },
    { text: 'WFQ: ', options: { fontSize: 10, bold: true, color: COLORS.accent } },
    { text: 'Enterprise vs Free 5.8배 차이\n', options: { fontSize: 10, color: COLORS.black } },
    { text: '         JFI = 0.32\n', options: { fontSize: 9, color: COLORS.accent, italic: true } },
    { text: 'MLFQ: ', options: { fontSize: 10, bold: true, color: COLORS.primary } },
    { text: '짧은 요청 약 74% 개선', options: { fontSize: 10, color: COLORS.black } },
  ], {
    x: 5.5, y: 4.15, w: 3.8, h: 1.4,
    fontFace: FONT, valign: 'middle'
  });
}

// ─── PNG 생성 (Playwright) ───

async function generatePNGs() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });

  const figures = [
    { name: 'fig-1-system-architecture', title: '시스템 아키텍처' },
    { name: 'fig-2-module-structure', title: '모듈 구조도' },
    { name: 'fig-3-data-flow', title: '데이터 흐름도' },
    { name: 'fig-4-scheduling-comparison', title: '스케줄링 알고리즘 비교' },
    { name: 'fig-5-experiment-results', title: '실험 결과' },
  ];

  for (const fig of figures) {
    const pptxPath = path.join(OUTPUT_DIR, `${fig.name}.pptx`);
    if (!fs.existsSync(pptxPath)) continue;

    // PPTX가 존재하면 간단한 플레이스홀더 PNG 생성
    const page = await context.newPage();
    await page.setContent(`
      <html>
      <body style="margin:0;display:flex;align-items:center;justify-content:center;
        width:1280px;height:720px;background:#f8fafc;font-family:'Malgun Gothic',sans-serif;">
        <div style="text-align:center;color:#64748b;">
          <div style="font-size:24px;font-weight:bold;color:#1e293b;margin-bottom:12px;">
            ${fig.title}
          </div>
          <div style="font-size:14px;">
            편집 가능한 원본: ${fig.name}.pptx
          </div>
        </div>
      </body>
      </html>
    `);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `${fig.name}.png`),
      type: 'png'
    });
    await page.close();
    console.log(`  PNG: ${fig.name}.png`);
  }

  await browser.close();
}

// ─── 메인 실행 ───

async function main() {
  console.log('중간보고서 v3 그림 생성 시작...\n');

  // 개별 PPTX 생성
  const figures = [
    { name: 'fig-1-system-architecture', fn: createFig1 },
    { name: 'fig-2-module-structure', fn: createFig2 },
    { name: 'fig-3-data-flow', fn: createFig3 },
    { name: 'fig-4-scheduling-comparison', fn: createFig4 },
    { name: 'fig-5-experiment-results', fn: createFig5 },
  ];

  for (const fig of figures) {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = '서민지 (C235180)';
    pptx.title = fig.name;

    fig.fn(pptx);

    const outputPath = path.join(OUTPUT_DIR, `${fig.name}.pptx`);
    await pptx.writeFile({ fileName: outputPath });
    console.log(`  PPTX: ${fig.name}.pptx`);
  }

  // PNG 스크린샷 생성
  console.log('\nPNG 플레이스홀더 생성 중...');
  await generatePNGs();

  console.log('\n완료! 5개 PPTX + 5개 PNG 생성됨.');
  console.log('참고: PNG는 플레이스홀더입니다. 최종 PNG는 PowerPoint에서 PPTX를 열고 내보내기하세요.');
}

main().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
