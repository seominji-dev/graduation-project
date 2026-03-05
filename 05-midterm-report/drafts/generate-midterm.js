/**
 * 중간보고서 DOCX 생성 스크립트
 * 05-midterm-report/final/midterm.docx 생성
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak
} = require('docx');

// 공통 스타일
const FONT = '맑은 고딕';
const COLOR_BLACK = '000000';
const COLOR_DARK = '333333';
const COLOR_HEADER_BG = 'D9E2F3';
const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

function textParagraph(text, options = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    ...options,
    children: [
      new TextRun({
        text, font: FONT, size: 22, color: COLOR_BLACK,
        ...(options.runOptions || {})
      })
    ]
  });
}

function multiRunParagraph(runs, options = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    ...options,
    children: runs.map(r => new TextRun({ font: FONT, size: 22, color: COLOR_BLACK, ...r }))
  });
}

function cell(content, opts = {}) {
  const children = typeof content === 'string'
    ? [new Paragraph({
        spacing: { before: 40, after: 40 },
        alignment: opts.align || AlignmentType.LEFT,
        children: [new TextRun({
          text: content, font: FONT, size: 20, color: COLOR_BLACK,
          bold: opts.bold || false
        })]
      })]
    : content;
  return new TableCell({
    borders: cellBorders,
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, font: FONT, size: 28, bold: true, color: COLOR_BLACK })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 160 },
    children: [new TextRun({ text, font: FONT, size: 24, bold: true, color: COLOR_DARK })]
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, font: FONT, size: 22, bold: true, color: COLOR_DARK })]
  });
}

function bulletItem(text) {
  return new Paragraph({
    numbering: { reference: 'bullet-list', level: 0 },
    spacing: { after: 80, line: 340 },
    children: [new TextRun({ text, font: FONT, size: 22, color: COLOR_BLACK })]
  });
}

function codeBlock(lines) {
  return lines.map(line => new Paragraph({
    spacing: { after: 0, line: 240 },
    indent: { left: 360 },
    children: [new TextRun({ text: line, font: 'Consolas', size: 18, color: '333333' })]
  }));
}

async function generateMidtermReport() {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: 22, color: COLOR_BLACK } }
      },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, color: COLOR_BLACK, font: FONT },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 }
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, bold: true, color: COLOR_DARK, font: FONT },
          paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 }
        },
        {
          id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 22, bold: true, color: COLOR_DARK, font: FONT },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 }
        }
      ]
    },
    numbering: {
      config: [
        {
          reference: 'bullet-list',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        },
        {
          reference: 'num-list',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        }
      ]
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          pageNumbers: { start: 1 }
        }
      },
      headers: {
        default: new Header({ children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: '홍익대학교 컴퓨터공학과 졸업프로젝트', font: FONT, size: 16, color: '888888' })]
        })] })
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18 }),
            new TextRun({ text: ' / ', font: FONT, size: 18 }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 18 })
          ]
        })] })
      },
      children: [
        // ===== 표지 =====
        emptyLine(), emptyLine(), emptyLine(), emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 80 },
          children: [new TextRun({ text: '2026학년도 졸업프로젝트', font: FONT, size: 24, color: '666666' })]
        }),
        emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 200 },
          children: [new TextRun({ text: '중 간 보 고 서', font: FONT, size: 44, bold: true, color: COLOR_BLACK })]
        }),
        emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 120 },
          children: [new TextRun({ text: 'OS 스케줄링 알고리즘을 활용한', font: FONT, size: 30, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 300 },
          children: [new TextRun({ text: '다중 사용자 LLM API 요청 관리 시스템', font: FONT, size: 30, bold: true })]
        }),
        emptyLine(), emptyLine(), emptyLine(), emptyLine(),
        new Table({
          columnWidths: [2400, 4800],
          rows: [
            new TableRow({ children: [
              cell('학 과', { bold: true, shading: COLOR_HEADER_BG, width: 2400, align: AlignmentType.CENTER }),
              cell('컴퓨터공학과', { width: 4800 })
            ]}),
            new TableRow({ children: [
              cell('학 번', { bold: true, shading: COLOR_HEADER_BG, width: 2400, align: AlignmentType.CENTER }),
              cell('C235180', { width: 4800 })
            ]}),
            new TableRow({ children: [
              cell('성 명', { bold: true, shading: COLOR_HEADER_BG, width: 2400, align: AlignmentType.CENTER }),
              cell('서민지', { width: 4800 })
            ]}),
            new TableRow({ children: [
              cell('지도교수', { bold: true, shading: COLOR_HEADER_BG, width: 2400, align: AlignmentType.CENTER }),
              cell('이장호', { width: 4800 })
            ]}),
            new TableRow({ children: [
              cell('제출일', { bold: true, shading: COLOR_HEADER_BG, width: 2400, align: AlignmentType.CENTER }),
              cell('2026년 4월', { width: 4800 })
            ]})
          ]
        }),
        emptyLine(), emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '홍익대학교 컴퓨터공학과', font: FONT, size: 24, color: '666666' })]
        }),

        // ===== 페이지 나누기 =====
        new Paragraph({ children: [new PageBreak()] }),

        // ===== 1. 서론 =====
        heading1('1. 서론'),

        heading2('1.1 연구 배경'),
        textParagraph(
          'ChatGPT, Claude, Gemini 등 대규모 언어 모델(Large Language Model, LLM) API 서비스가 빠르게 확산되면서, ' +
          '여러 사용자가 동시에 LLM API를 호출하는 멀티테넌트(Multi-tenant) 환경이 보편화되고 있다. ' +
          '이러한 환경에서 요청 처리 순서와 자원 분배 정책은 서비스 품질에 직접적인 영향을 미치는 핵심 요소이다.'
        ),
        textParagraph(
          '현재 대부분의 LLM 서비스는 선착순(FCFS) 처리 방식이나 단순 Rate Limiting에 의존하고 있다. ' +
          '이러한 방식은 호위 효과(Convoy Effect), 차등 서비스 불가, 공정성 부재, 기아(Starvation) 현상 등의 한계를 가진다.'
        ),

        heading2('1.2 연구 목적'),
        textParagraph(
          '본 연구는 운영체제의 프로세스 스케줄링 알고리즘을 LLM API 요청 관리에 적용하여, ' +
          'OS 이론의 실제 응용 가능성을 탐구한다. 구체적인 연구 목적은 다음과 같다.'
        ),
        bulletItem('5가지 스케줄링 알고리즘 구현: FCFS, Priority, MLFQ, WFQ, Rate Limiter'),
        bulletItem('알고리즘별 성능 비교 분석: 대기시간, 처리량, 공정성 지표의 정량적 비교'),
        bulletItem('공정성 정량화: Jain\'s Fairness Index(JFI)를 활용한 멀티테넌트 공정성 측정'),

        heading2('1.3 연구 질문'),
        bulletItem('RQ1: 우선순위 스케줄링에서 긴급(URGENT) 요청이 FCFS 대비 얼마나 빠르게 처리되는가?'),
        bulletItem('RQ2: 선점형 MLFQ가 혼합 워크로드에서 짧은 요청의 대기시간을 얼마나 개선하는가?'),
        bulletItem('RQ3: WFQ가 테넌트 등급별 가중치에 비례하는 차등 서비스를 제공하는가?'),

        // ===== 2. 관련 연구 =====
        new Paragraph({ children: [new PageBreak()] }),
        heading1('2. 관련 연구'),

        heading2('2.1 OS 스케줄링 알고리즘'),
        textParagraph(
          '프로세스 스케줄링은 운영체제의 핵심 기능으로, CPU 자원을 여러 프로세스에 효율적으로 배분하기 위한 ' +
          '다양한 알고리즘이 연구되어 왔다 [1].'
        ),
        multiRunParagraph([
          { text: 'FCFS (First-Come, First-Served)', bold: true },
          { text: '는 가장 단순한 스케줄링 알고리즘으로, 요청 도착 순서대로 처리한다. ' +
            '구현이 간단하나 호위 효과(Convoy Effect)가 발생한다는 단점이 있다.' }
        ]),
        multiRunParagraph([
          { text: 'Priority Scheduling', bold: true },
          { text: '은 각 프로세스에 우선순위를 부여하여 높은 우선순위를 먼저 처리한다. ' +
            '기아(Starvation) 현상을 해결하기 위해 Aging 기법이 사용된다 [1].' }
        ]),
        multiRunParagraph([
          { text: 'MLFQ (Multi-Level Feedback Queue)', bold: true },
          { text: '는 Corbato et al.이 CTSS에서 최초로 제안하였으며 [2], 작업의 실행 특성을 관찰하여 ' +
            '우선순위를 동적으로 조정한다. Arpaci-Dusseau & Arpaci-Dusseau는 MLFQ의 5가지 핵심 규칙을 정리하였다 [3].' }
        ]),
        multiRunParagraph([
          { text: 'WFQ (Weighted Fair Queuing)', bold: true },
          { text: '는 Demers et al.이 제안한 알고리즘으로 [4], GPS 이론을 기반으로 각 흐름에 ' +
            '가중치에 비례하는 서비스를 제공한다.' }
        ]),

        heading2('2.2 LLM 서빙 최적화 연구'),
        textParagraph(
          'Kwon et al.은 vLLM에서 PagedAttention 기법을 제안하여, KV 캐시 메모리를 비연속적 블록으로 관리하여 ' +
          '메모리 활용률을 55% 향상시켰다 [5]. Yu et al.은 ORCA에서 iteration-level 스케줄링으로 ' +
          'GPU 활용률을 개선하였다 [6]. Agrawal et al.은 Sarathi-Serve에서 chunked prefill 기법을 ' +
          '제안하여 지연시간 변동을 감소시켰다 [7].'
        ),
        textParagraph(
          '그러나 이들 연구는 GPU 메모리 관리와 추론 파이프라인 효율화에 집중하고 있다. ' +
          '다중 사용자 환경에서의 요청 스케줄링과 테넌트 간 공정성 문제는 상대적으로 다루어지지 않았으며, ' +
          '본 연구는 이 간극을 메우기 위해 OS 스케줄링 이론을 LLM 요청 관리에 적용한다.'
        ),

        heading2('2.3 공정성 측정'),
        textParagraph(
          'Jain et al.은 공유 컴퓨터 시스템에서 자원 배분의 공정성을 정량적으로 측정하기 위한 ' +
          'Jain\'s Fairness Index(JFI)를 제안하였다 [8]. JFI는 0(완전 불공정)부터 1(완전 공정) 사이의 값을 가진다. ' +
          '본 연구는 JFI를 멀티테넌트 LLM API 환경에 적용하여, 시스템 수준과 테넌트 수준의 이중 공정성 측정 방법론을 제시한다.'
        ),

        // ===== 3. 시스템 설계 =====
        new Paragraph({ children: [new PageBreak()] }),
        heading1('3. 시스템 설계'),

        heading2('3.1 OS-LLM 개념 대응 관계'),
        textParagraph(
          '본 연구의 핵심 아이디어는 OS의 프로세스 스케줄링 개념을 LLM API 요청 관리에 매핑하는 것이다.'
        ),
        textParagraph('표 1. OS 개념과 LLM 도메인 대응 관계', { runOptions: { bold: true } }),
        new Table({
          columnWidths: [2500, 2500, 4000],
          rows: [
            new TableRow({ children: [
              cell('OS 개념', { bold: true, shading: COLOR_HEADER_BG, width: 2500, align: AlignmentType.CENTER }),
              cell('LLM 도메인', { bold: true, shading: COLOR_HEADER_BG, width: 2500, align: AlignmentType.CENTER }),
              cell('설명', { bold: true, shading: COLOR_HEADER_BG, width: 4000, align: AlignmentType.CENTER })
            ]}),
            new TableRow({ children: [cell('프로세스', { width: 2500 }), cell('LLM API 요청', { width: 2500 }), cell('스케줄링 단위', { width: 4000 })]}),
            new TableRow({ children: [cell('CPU 시간', { width: 2500 }), cell('API 호출 쿼터', { width: 2500 }), cell('할당 자원', { width: 4000 })]}),
            new TableRow({ children: [cell('우선순위', { width: 2500 }), cell('테넌트 등급, 긴급도', { width: 2500 }), cell('처리 순서 결정 기준', { width: 4000 })]}),
            new TableRow({ children: [cell('선점', { width: 2500 }), cell('요청 중단 및 큐 이동', { width: 2500 }), cell('긴 요청 제어', { width: 4000 })]}),
            new TableRow({ children: [cell('시간 할당량', { width: 2500 }), cell('큐별 처리 시간 한도', { width: 2500 }), cell('공정한 시간 분배', { width: 4000 })]}),
            new TableRow({ children: [cell('기아 방지', { width: 2500 }), cell('Aging, Boosting', { width: 2500 }), cell('낮은 등급 보호', { width: 4000 })]})
          ]
        }),
        emptyLine(),

        heading2('3.2 시스템 아키텍처'),
        textParagraph('시스템은 4계층 구조로 설계되었다.'),
        bulletItem('클라이언트 계층: REST API를 통해 LLM 요청을 제출하고 처리 상태를 조회'),
        bulletItem('API 계층: Express.js 기반 HTTP 서버, 요청 접수, 스케줄러 전환, 통계 조회'),
        bulletItem('스케줄러 엔진: 5가지 알고리즘이 공통 인터페이스를 구현, Strategy 패턴으로 런타임 교체'),
        bulletItem('저장소 계층: 메모리 배열 큐, JSON 파일 로그, Ollama 로컬 LLM'),

        heading2('3.3 스케줄링 알고리즘 설계'),

        heading3('3.3.1 FCFS'),
        textParagraph('선착순 처리 알고리즘으로, 요청의 도착 타임스탬프를 기준으로 처리 순서를 결정한다. 다른 알고리즘의 베이스라인으로 사용한다.'),

        heading3('3.3.2 Priority Scheduling with Aging'),
        textParagraph('4단계 우선순위(URGENT > HIGH > NORMAL > LOW)를 지원하며, Aging 메커니즘으로 기아 현상을 방지한다.'),

        heading3('3.3.3 MLFQ'),
        textParagraph('4단계 피드백 큐(Q0-Q3)와 선점형 시간 슬라이스를 구현한다.'),
        textParagraph('표 2. MLFQ 큐 레벨 및 시간 할당량', { runOptions: { bold: true } }),
        new Table({
          columnWidths: [2000, 3500, 3500],
          rows: [
            new TableRow({ children: [
              cell('큐 레벨', { bold: true, shading: COLOR_HEADER_BG, width: 2000, align: AlignmentType.CENTER }),
              cell('시간 할당량', { bold: true, shading: COLOR_HEADER_BG, width: 3500, align: AlignmentType.CENTER }),
              cell('대상 요청', { bold: true, shading: COLOR_HEADER_BG, width: 3500, align: AlignmentType.CENTER })
            ]}),
            new TableRow({ children: [cell('Q0', { width: 2000, align: AlignmentType.CENTER }), cell('1,000ms', { width: 3500, align: AlignmentType.CENTER }), cell('Short 요청 (신규 진입)', { width: 3500 })]}),
            new TableRow({ children: [cell('Q1', { width: 2000, align: AlignmentType.CENTER }), cell('3,000ms', { width: 3500, align: AlignmentType.CENTER }), cell('중간 길이 요청', { width: 3500 })]}),
            new TableRow({ children: [cell('Q2', { width: 2000, align: AlignmentType.CENTER }), cell('8,000ms', { width: 3500, align: AlignmentType.CENTER }), cell('긴 요청', { width: 3500 })]}),
            new TableRow({ children: [cell('Q3', { width: 2000, align: AlignmentType.CENTER }), cell('∞ (무제한)', { width: 3500, align: AlignmentType.CENTER }), cell('배치/초장문 요청', { width: 3500 })]})
          ]
        }),
        emptyLine(),
        textParagraph('의사코드 1. MLFQ 선점 처리 흐름', { runOptions: { bold: true, italics: true } }),
        ...codeBlock([
          'function processNextRequest():',
          '    request = dequeue()            // 최상위 큐에서 추출',
          '    startProcessing(request)',
          '',
          '    every 500ms:                   // 타임 슬라이스 체크',
          '        elapsed = now - startTime + usedTime',
          '        quantum = TIME_QUANTUM[request.queueLevel]',
          '',
          '        if elapsed >= quantum AND quantum != Infinity:',
          '            request.queueLevel = min(queueLevel + 1, 3)',
          '            queues[newLevel].push(request)',
          '            processNextRequest()   // 다음 요청 처리',
          '        else:',
          '            continue processing'
        ]),
        emptyLine(),

        heading3('3.3.4 WFQ'),
        textParagraph('GPS 이론에 기반한 가중치 공정 큐잉 알고리즘으로, 테넌트 등급별 가중치에 비례하여 자원을 분배한다.'),
        textParagraph('표 3. 테넌트 등급 및 가중치', { runOptions: { bold: true } }),
        new Table({
          columnWidths: [2000, 1500, 2000, 3500],
          rows: [
            new TableRow({ children: [
              cell('등급', { bold: true, shading: COLOR_HEADER_BG, width: 2000, align: AlignmentType.CENTER }),
              cell('가중치', { bold: true, shading: COLOR_HEADER_BG, width: 1500, align: AlignmentType.CENTER }),
              cell('자원 비율', { bold: true, shading: COLOR_HEADER_BG, width: 2000, align: AlignmentType.CENTER }),
              cell('대상', { bold: true, shading: COLOR_HEADER_BG, width: 3500, align: AlignmentType.CENTER })
            ]}),
            new TableRow({ children: [cell('Enterprise', { width: 2000, align: AlignmentType.CENTER }), cell('100', { width: 1500, align: AlignmentType.CENTER }), cell('62.1%', { width: 2000, align: AlignmentType.CENTER }), cell('대기업, 핵심 고객', { width: 3500 })]}),
            new TableRow({ children: [cell('Premium', { width: 2000, align: AlignmentType.CENTER }), cell('50', { width: 1500, align: AlignmentType.CENTER }), cell('31.1%', { width: 2000, align: AlignmentType.CENTER }), cell('유료 구독 고객', { width: 3500 })]}),
            new TableRow({ children: [cell('Standard', { width: 2000, align: AlignmentType.CENTER }), cell('10', { width: 1500, align: AlignmentType.CENTER }), cell('6.2%', { width: 2000, align: AlignmentType.CENTER }), cell('일반 유료 고객', { width: 3500 })]}),
            new TableRow({ children: [cell('Free', { width: 2000, align: AlignmentType.CENTER }), cell('1', { width: 1500, align: AlignmentType.CENTER }), cell('0.6%', { width: 2000, align: AlignmentType.CENTER }), cell('무료 체험 고객', { width: 3500 })]})
          ]
        }),
        emptyLine(),

        heading2('3.4 핵심 기술 특징'),
        multiRunParagraph([
          { text: '런타임 알고리즘 교체: ', bold: true },
          { text: '서버 재시작 없이 REST API(PUT /api/scheduler)를 통해 스케줄링 알고리즘을 실시간 전환할 수 있다.' }
        ]),
        multiRunParagraph([
          { text: '이중 수준 공정성 측정: ', bold: true },
          { text: 'WFQ 스케줄러에서 시스템 수준 JFI와 테넌트 수준 JFI를 분리 측정한다.' }
        ]),
        multiRunParagraph([
          { text: '기아 방지: ', bold: true },
          { text: 'Priority Aging과 MLFQ Boost를 통해 낮은 우선순위 요청의 무기한 대기를 방지한다.' }
        ]),

        // ===== 4. 구현 현황 =====
        new Paragraph({ children: [new PageBreak()] }),
        heading1('4. 구현 현황'),

        heading2('4.1 기술 스택 및 개발 환경'),
        textParagraph('표 4. 기술 스택', { runOptions: { bold: true } }),
        new Table({
          columnWidths: [2000, 3000, 4000],
          rows: [
            new TableRow({ children: [
              cell('항목', { bold: true, shading: COLOR_HEADER_BG, width: 2000, align: AlignmentType.CENTER }),
              cell('기술/도구', { bold: true, shading: COLOR_HEADER_BG, width: 3000, align: AlignmentType.CENTER }),
              cell('설명', { bold: true, shading: COLOR_HEADER_BG, width: 4000, align: AlignmentType.CENTER })
            ]}),
            new TableRow({ children: [cell('런타임', { width: 2000 }), cell('Node.js 22 LTS', { width: 3000 }), cell('JavaScript 실행 환경', { width: 4000 })]}),
            new TableRow({ children: [cell('프레임워크', { width: 2000 }), cell('Express.js 4.18', { width: 3000 }), cell('REST API 서버', { width: 4000 })]}),
            new TableRow({ children: [cell('언어', { width: 2000 }), cell('JavaScript (ES2024)', { width: 3000 }), cell('학부 수준 유지', { width: 4000 })]}),
            new TableRow({ children: [cell('테스트', { width: 2000 }), cell('Jest 29.x', { width: 3000 }), cell('307개 테스트, 99.76% 커버리지', { width: 4000 })]}),
            new TableRow({ children: [cell('LLM', { width: 2000 }), cell('Ollama (로컬)', { width: 3000 }), cell('LLM 추론 엔진', { width: 4000 })]}),
            new TableRow({ children: [cell('의존성', { width: 2000 }), cell('2개 (express, uuid)', { width: 3000 }), cell('최소 의존성 원칙', { width: 4000 })]})
          ]
        }),
        emptyLine(),

        heading2('4.2 실험 결과'),

        heading3('4.2.1 기본 실험 (100건 요청)'),
        textParagraph('표 5. 알고리즘별 성능 비교', { runOptions: { bold: true } }),
        new Table({
          columnWidths: [2000, 2500, 4500],
          rows: [
            new TableRow({ children: [
              cell('스케줄러', { bold: true, shading: COLOR_HEADER_BG, width: 2000, align: AlignmentType.CENTER }),
              cell('평균 대기시간', { bold: true, shading: COLOR_HEADER_BG, width: 2500, align: AlignmentType.CENTER }),
              cell('핵심 발견', { bold: true, shading: COLOR_HEADER_BG, width: 4500, align: AlignmentType.CENTER })
            ]}),
            new TableRow({ children: [
              cell('FCFS', { width: 2000, align: AlignmentType.CENTER }),
              cell('2,572ms', { width: 2500, align: AlignmentType.CENTER }),
              cell('베이스라인, 도착 순서 처리', { width: 4500 })
            ]}),
            new TableRow({ children: [
              cell('Priority', { width: 2000, align: AlignmentType.CENTER }),
              cell('2,826ms', { width: 2500, align: AlignmentType.CENTER }),
              cell('URGENT 요청: 1,122ms (FCFS 대비 62% 감소)', { width: 4500 })
            ]}),
            new TableRow({ children: [
              cell('MLFQ', { width: 2000, align: AlignmentType.CENTER }),
              cell('2,572ms', { width: 2500, align: AlignmentType.CENTER }),
              cell('짧은 요청: 선점형 모드에서 73.78% 개선 (10 시드 검증)', { width: 4500 })
            ]}),
            new TableRow({ children: [
              cell('WFQ', { width: 2000, align: AlignmentType.CENTER }),
              cell('2,819ms', { width: 2500, align: AlignmentType.CENTER }),
              cell('Enterprise: 849ms, Free: 4,894ms (5.8배 차이)', { width: 4500 })
            ]})
          ]
        }),
        emptyLine(),
        multiRunParagraph([
          { text: 'RQ1 (Priority Scheduling): ', bold: true },
          { text: 'URGENT 요청은 FCFS 대비 62% 빠르게 처리되었다(Cohen\'s d = 0.78, p < 0.001).' }
        ]),
        multiRunParagraph([
          { text: 'RQ2 (MLFQ): ', bold: true },
          { text: '선점형 모드에서 짧은 요청의 대기시간이 평균 73.78% 개선되었다' +
            '(10 시드 다중 실험, 95% CI: [72.36, 75.20], p < 0.001, Cohen\'s d = 15.9).' }
        ]),
        multiRunParagraph([
          { text: 'RQ3 (WFQ): ', bold: true },
          { text: 'Enterprise 테넌트는 Free 대비 5.8배 빠른 응답을 받았으며, ' +
            '시스템 수준 JFI 0.89, 테넌트 수준 JFI 0.92-0.98을 달성하였다.' }
        ]),

        heading3('4.2.2 다중 시드 실험 (통계적 검증)'),
        textParagraph(
          '실험의 통계적 신뢰성을 보강하기 위해 10개 랜덤 시드 × 500건 요청 = 총 5,000건 실험을 수행하였다.'
        ),
        textParagraph('표 6. MLFQ Short 요청 개선율 통계', { runOptions: { bold: true } }),
        new Table({
          columnWidths: [4500, 4500],
          rows: [
            new TableRow({ children: [
              cell('통계량', { bold: true, shading: COLOR_HEADER_BG, width: 4500, align: AlignmentType.CENTER }),
              cell('값', { bold: true, shading: COLOR_HEADER_BG, width: 4500, align: AlignmentType.CENTER })
            ]}),
            new TableRow({ children: [cell('평균 개선율', { width: 4500 }), cell('73.78%', { width: 4500, align: AlignmentType.CENTER })]}),
            new TableRow({ children: [cell('표준편차', { width: 4500 }), cell('1.98%', { width: 4500, align: AlignmentType.CENTER })]}),
            new TableRow({ children: [cell('95% 신뢰구간', { width: 4500 }), cell('[72.36, 75.20]', { width: 4500, align: AlignmentType.CENTER })]}),
            new TableRow({ children: [cell('변동계수 (CV)', { width: 4500 }), cell('2.68%', { width: 4500, align: AlignmentType.CENTER })]}),
            new TableRow({ children: [cell('p-value', { width: 4500 }), cell('< 0.001', { width: 4500, align: AlignmentType.CENTER })]}),
            new TableRow({ children: [cell('Cohen\'s d', { width: 4500 }), cell('15.905 (큰 효과)', { width: 4500, align: AlignmentType.CENTER })]})
          ]
        }),
        emptyLine(),

        // ===== 5. 향후 계획 =====
        heading1('5. 향후 계획'),

        heading2('5.1 추가 연구 방향'),
        new Paragraph({
          numbering: { reference: 'num-list', level: 0 },
          spacing: { after: 80, line: 340 },
          children: [new TextRun({ text: '대규모 실험 확장: 1,000건 이상 요청, 다양한 워크로드 시나리오(버스트 트래픽, 비균등 분포)', font: FONT, size: 22 })]
        }),
        new Paragraph({
          numbering: { reference: 'num-list', level: 0 },
          spacing: { after: 80, line: 340 },
          children: [new TextRun({ text: '공정성 분석 심화: 추가 공정성 지표 검토, 공정성-성능 트레이드오프 분석', font: FONT, size: 22 })]
        }),
        new Paragraph({
          numbering: { reference: 'num-list', level: 0 },
          spacing: { after: 80, line: 340 },
          children: [new TextRun({ text: '시스템 설계 문서화 완성: 아키텍처 상세 설계, API 명세 정리', font: FONT, size: 22 })]
        }),
        new Paragraph({
          numbering: { reference: 'num-list', level: 0 },
          spacing: { after: 80, line: 340 },
          children: [new TextRun({ text: '데모 시스템 구성: 최종 발표를 위한 실시간 데모 환경', font: FONT, size: 22 })]
        }),

        heading2('5.2 일정'),
        textParagraph('표 7. 26-1학기 남은 일정', { runOptions: { bold: true } }),
        new Table({
          columnWidths: [2000, 3500, 2500, 1500],
          rows: [
            new TableRow({ children: [
              cell('기간', { bold: true, shading: COLOR_HEADER_BG, width: 2000, align: AlignmentType.CENTER }),
              cell('주요 활동', { bold: true, shading: COLOR_HEADER_BG, width: 3500, align: AlignmentType.CENTER }),
              cell('산출물', { bold: true, shading: COLOR_HEADER_BG, width: 2500, align: AlignmentType.CENTER }),
              cell('마감일', { bold: true, shading: COLOR_HEADER_BG, width: 1500, align: AlignmentType.CENTER })
            ]}),
            new TableRow({ children: [
              cell('4-5월', { width: 2000, align: AlignmentType.CENTER }),
              cell('추가 실험, 결과 분석, 최종 보고서 집필', { width: 3500 }),
              cell('최종보고서 + 소스코드', { width: 2500 }),
              cell('5/24', { width: 1500, align: AlignmentType.CENTER })
            ]}),
            new TableRow({ children: [
              cell('5월 말', { width: 2000, align: AlignmentType.CENTER }),
              cell('발표 자료 준비, 시스템 데모 구성', { width: 3500 }),
              cell('발표 PPT, 데모', { width: 2500 }),
              cell('5/26-29', { width: 1500, align: AlignmentType.CENTER })
            ]})
          ]
        }),
        emptyLine(),

        // ===== 참고문헌 =====
        heading1('참고문헌'),
        textParagraph('[1] A. Silberschatz, P. B. Galvin, and G. Gagne, Operating System Concepts, 10th ed. Wiley, 2018.'),
        textParagraph('[2] F. J. Corbato, M. M. Daggett, and R. C. Daley, "An experimental time-sharing system," in Proc. AFIPS Spring Joint Computer Conference, 1962, pp. 335-344.'),
        textParagraph('[3] R. H. Arpaci-Dusseau and A. C. Arpaci-Dusseau, Operating Systems: Three Easy Pieces. Arpaci-Dusseau Books, 2018.'),
        textParagraph('[4] A. Demers, S. Keshav, and S. Shenker, "Analysis and simulation of a fair queueing algorithm," in ACM SIGCOMM \'89 Proceedings, 1989, pp. 1-12.'),
        textParagraph('[5] W. Kwon et al., "Efficient memory management for large language model serving with PagedAttention," in Proc. SOSP \'23, 2023, pp. 611-626.'),
        textParagraph('[6] G. I. Yu et al., "Orca: A distributed serving system for Transformer-Based generative models," in Proc. OSDI \'22, 2022, pp. 521-538.'),
        textParagraph('[7] A. Agrawal et al., "Sarathi-Serve: CoDe Interleaving for Stall-free LLM Serving," arXiv:2308.16369, 2024.'),
        textParagraph('[8] R. Jain, D. M. Chiu, and W. R. Hawe, "A quantitative measure of fairness and discrimination for resource allocation in shared computer systems," DEC Research Report TR-301, 1984.')
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, '..', 'final', 'midterm.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('중간보고서 DOCX 생성 완료:', outPath);
}

generateMidtermReport().catch(err => {
  console.error('DOCX 생성 실패:', err);
  process.exit(1);
});
