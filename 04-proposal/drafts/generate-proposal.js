/**
 * 제안서 DOCX 생성 스크립트
 * 04-proposal/final/proposal.docx 생성
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak, Math, MathRun
} = require('docx');

// 공통 스타일 변수
const FONT = '맑은 고딕';
const FONT_EN = 'Times New Roman';
const COLOR_BLACK = '000000';
const COLOR_DARK = '333333';
const COLOR_HEADER_BG = 'D9E2F3';
const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

// 헬퍼: 일반 텍스트 단락
function textParagraph(text, options = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    ...options,
    children: [
      new TextRun({
        text,
        font: FONT,
        size: 22, // 11pt
        color: COLOR_BLACK,
        ...(options.runOptions || {})
      })
    ]
  });
}

// 헬퍼: 여러 TextRun으로 구성된 단락
function multiRunParagraph(runs, options = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    ...options,
    children: runs.map(r => new TextRun({
      font: FONT,
      size: 22,
      color: COLOR_BLACK,
      ...r
    }))
  });
}

// 헬퍼: 표 셀
function cell(content, opts = {}) {
  const children = typeof content === 'string'
    ? [new Paragraph({
        spacing: { before: 40, after: 40 },
        alignment: opts.align || AlignmentType.LEFT,
        children: [new TextRun({
          text: content,
          font: FONT,
          size: 20, // 10pt
          color: COLOR_BLACK,
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

// 헬퍼: 빈 줄
function emptyLine() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

// 문서 생성
async function generateProposal() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22, color: COLOR_BLACK }
        }
      },
      paragraphStyles: [
        {
          id: 'Title', name: 'Title', basedOn: 'Normal',
          run: { size: 36, bold: true, color: COLOR_BLACK, font: FONT },
          paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER }
        },
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
          reference: 'num-objectives',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        },
        {
          reference: 'num-plan',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        }
      ]
    },
    sections: [
      // ===== 표지 =====
      {
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
          emptyLine(), emptyLine(), emptyLine(), emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: '2026학년도 졸업프로젝트', font: FONT, size: 24, color: '666666' })]
          }),
          emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: '제 안 서', font: FONT, size: 44, bold: true, color: COLOR_BLACK })]
          }),
          emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({
              text: 'OS 스케줄링 알고리즘을 활용한',
              font: FONT, size: 30, bold: true, color: COLOR_BLACK
            })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [new TextRun({
              text: '다중 사용자 LLM API 요청 관리 시스템',
              font: FONT, size: 30, bold: true, color: COLOR_BLACK
            })]
          }),
          emptyLine(), emptyLine(), emptyLine(), emptyLine(),
          // 학생 정보 표
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
              ]})
            ]
          }),
          emptyLine(), emptyLine(), emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '2026년 3월', font: FONT, size: 24, color: '666666' })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120 },
            children: [new TextRun({ text: '홍익대학교 공과대학', font: FONT, size: 24, color: '666666' })]
          }),
          // 페이지 브레이크
          new Paragraph({ children: [new PageBreak()] }),

          // ===== 1. 서론 =====
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: '1. 서론', font: FONT })]
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '1.1 연구 배경', font: FONT })]
          }),
          textParagraph(
            'ChatGPT, Claude, Gemini 등 대규모 언어 모델(Large Language Model, LLM) API 서비스가 빠르게 확산되면서, ' +
            '여러 사용자가 동시에 LLM API를 호출하는 환경이 보편화되고 있다. 이러한 환경에서 요청 처리 순서는 ' +
            '서비스 품질에 직접적인 영향을 미치는 핵심 요소이다.'
          ),
          textParagraph(
            '현재 대부분의 LLM 서비스는 선착순(First-Come, First-Served, FCFS) 처리 방식이나 단순 Rate Limiting에 ' +
            '의존하고 있다. 이러한 방식은 다음과 같은 한계를 가진다. 첫째, 긴 요청이 뒤따르는 짧은 요청들의 처리를 ' +
            '지연시키는 호위 효과(Convoy Effect)가 발생한다. 둘째, 긴급한 요청도 도착 순서를 기다려야 하며, ' +
            '사용자 등급에 따른 차등 서비스 제공이 불가능하다. 셋째, 공정성을 정량적으로 측정하고 보장하는 메커니즘이 부재하다.'
          ),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '1.2 연구 동기와 목적', font: FONT })]
          }),
          textParagraph(
            '3학년 운영체제 수업에서 학습한 프로세스 스케줄링 알고리즘(FCFS, Priority Scheduling, MLFQ, WFQ 등)은 ' +
            'CPU 자원을 프로세스에 효율적으로 배분하기 위해 수십 년간 연구되어 온 이론이다. 본 연구는 이 검증된 이론을 ' +
            'LLM API 요청 관리라는 새로운 도메인에 적용함으로써, OS 이론의 실제 응용 가능성을 탐구하고자 한다.'
          ),
          textParagraph('구체적인 연구 목적은 다음과 같다.'),
          new Paragraph({
            numbering: { reference: 'num-objectives', level: 0 },
            spacing: { after: 80, line: 360 },
            children: [new TextRun({
              text: '5가지 스케줄링 알고리즘 구현: FCFS(베이스라인), Priority Scheduling(긴급 요청 우선), ' +
                    'MLFQ(적응형 스케줄링), WFQ(공정 배분), Rate Limiter(속도 제한)',
              font: FONT, size: 22
            })]
          }),
          new Paragraph({
            numbering: { reference: 'num-objectives', level: 0 },
            spacing: { after: 80, line: 360 },
            children: [new TextRun({
              text: '알고리즘별 성능 비교 분석: 대기시간, 처리량, 공정성 지표의 정량적 비교',
              font: FONT, size: 22
            })]
          }),
          new Paragraph({
            numbering: { reference: 'num-objectives', level: 0 },
            spacing: { after: 120, line: 360 },
            children: [new TextRun({
              text: '공정성 정량화: Jain\'s Fairness Index(JFI)를 활용한 멀티테넌트 환경의 공정성 측정 방법론 제시',
              font: FONT, size: 22
            })]
          }),

          // ===== 2. 관련 연구 =====
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: '2. 관련 연구', font: FONT })]
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '2.1 OS 스케줄링 알고리즘', font: FONT })]
          }),
          textParagraph(
            '프로세스 스케줄링은 운영체제의 핵심 기능 중 하나로, CPU 자원을 여러 프로세스에 효율적으로 배분하기 위한 ' +
            '다양한 알고리즘이 연구되어 왔다 [1].'
          ),
          multiRunParagraph([
            { text: 'FCFS (First-Come, First-Served)', bold: true },
            { text: '는 가장 단순한 스케줄링 알고리즘으로, 요청 도착 순서대로 처리한다. ' +
              '구현이 간단하나 긴 작업이 짧은 작업을 지연시키는 호위 효과(Convoy Effect)가 발생한다는 단점이 있다.' }
          ]),
          multiRunParagraph([
            { text: 'Priority Scheduling', bold: true },
            { text: '은 각 프로세스에 우선순위를 부여하여 높은 우선순위의 프로세스를 먼저 처리한다. ' +
              '그러나 낮은 우선순위의 프로세스가 무기한 대기하는 기아(Starvation) 현상이 발생할 수 있으며, ' +
              '이를 해결하기 위해 Aging(노화) 기법이 사용된다 [1].' }
          ]),
          multiRunParagraph([
            { text: 'MLFQ (Multi-Level Feedback Queue)', bold: true },
            { text: '는 Corbato et al.이 CTSS(Compatible Time-Sharing System)에서 최초로 제안한 알고리즘으로 [2], ' +
              '작업의 실행 특성을 관찰하여 우선순위를 동적으로 조정한다. 짧은 작업은 높은 우선순위 큐에서 빠르게 ' +
              '처리되고, 긴 작업은 점차 하위 큐로 이동한다. Arpaci-Dusseau & Arpaci-Dusseau는 MLFQ의 5가지 핵심 ' +
              '규칙을 정리하며, 현대 운영체제에서 가장 널리 사용되는 스케줄링 알고리즘임을 설명하였다 [3].' }
          ]),
          multiRunParagraph([
            { text: 'WFQ (Weighted Fair Queuing)', bold: true },
            { text: '는 Demers, Keshav, & Shenker가 제안한 공정 큐잉 알고리즘으로 [4], ' +
              'GPS(Generalized Processor Sharing) 이론을 기반으로 한다. 각 흐름(flow)에 가중치를 부여하여 ' +
              '가중치에 비례하는 서비스를 제공하며, Virtual Finish Time 개념을 사용하여 스케줄링 순서를 결정한다.' }
          ]),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '2.2 LLM 서빙 최적화 연구', font: FONT })]
          }),
          textParagraph(
            'LLM API 서빙 분야에서는 추론 성능 최적화를 위한 다양한 연구가 진행되어 왔다.'
          ),
          textParagraph(
            'Kwon et al.은 vLLM을 통해 PagedAttention 기법을 제안하여 LLM 서빙 시 KV 캐시 메모리를 효율적으로 ' +
            '관리하는 방법을 제시하였다 [5]. Yu et al.은 ORCA 시스템에서 iteration-level 스케줄링을 통해 ' +
            'LLM 추론의 처리량을 향상시켰다 [6]. Agrawal et al.은 Sarathi-Serve에서 chunked prefill 기법으로 ' +
            'prefill과 decode 단계를 효율적으로 분리하여 서빙 성능을 개선하였다 [7].'
          ),
          textParagraph(
            '그러나 이들 연구는 주로 GPU 메모리 관리와 배치 처리 최적화에 집중하고 있으며, ' +
            '다중 사용자 환경에서의 요청 스케줄링과 테넌트 간 공정성 문제는 상대적으로 다루어지지 않았다. ' +
            '본 연구는 이 간극을 메우기 위해 OS 스케줄링 이론을 LLM 요청 관리에 적용한다.'
          ),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '2.3 공정성 측정', font: FONT })]
          }),
          textParagraph(
            'Jain, Chiu, & Hawe는 공유 컴퓨터 시스템에서 자원 배분의 공정성을 정량적으로 측정하기 위한 ' +
            'Jain\'s Fairness Index(JFI)를 제안하였다 [8]. JFI는 0(완전 불공정)부터 1(완전 공정) 사이의 ' +
            '값을 가지며, 본 연구는 JFI를 멀티테넌트 LLM API 환경에 적용하여, 시스템 수준과 테넌트 수준의 ' +
            '이중 공정성 측정 방법론을 제시한다.'
          ),

          // ===== 3. 제안 시스템 =====
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: '3. 제안 시스템', font: FONT })]
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '3.1 시스템 개요', font: FONT })]
          }),
          textParagraph(
            '본 연구에서 제안하는 시스템은 OS 스케줄링 알고리즘을 LLM API 요청 관리에 적용한 멀티테넌트 시스템이다. ' +
            '표 1은 OS 개념과 LLM 도메인 간의 대응 관계를 정리한 것이다.'
          ),
          // 표 1: OS - LLM 대응
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 80 },
            children: [new TextRun({
              text: '표 1. OS 개념과 LLM 도메인 대응 관계',
              font: FONT, size: 20, bold: true, color: COLOR_DARK
            })]
          }),
          new Table({
            columnWidths: [2200, 2600, 4200],
            rows: [
              new TableRow({ tableHeader: true, children: [
                cell('OS 개념', { bold: true, shading: COLOR_HEADER_BG, width: 2200, align: AlignmentType.CENTER }),
                cell('LLM 도메인', { bold: true, shading: COLOR_HEADER_BG, width: 2600, align: AlignmentType.CENTER }),
                cell('설명', { bold: true, shading: COLOR_HEADER_BG, width: 4200, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('프로세스', { width: 2200 }),
                cell('LLM API 요청', { width: 2600 }),
                cell('스케줄링 단위', { width: 4200 })
              ]}),
              new TableRow({ children: [
                cell('CPU 시간', { width: 2200 }),
                cell('API 호출 쿼터', { width: 2600 }),
                cell('할당 자원', { width: 4200 })
              ]}),
              new TableRow({ children: [
                cell('우선순위', { width: 2200 }),
                cell('테넌트 등급, 요청 긴급도', { width: 2600 }),
                cell('처리 순서 결정 기준', { width: 4200 })
              ]}),
              new TableRow({ children: [
                cell('스케줄링 알고리즘', { width: 2200 }),
                cell('요청 처리 순서 결정', { width: 2600 }),
                cell('자원 배분 정책', { width: 4200 })
              ]}),
              new TableRow({ children: [
                cell('선점 (Preemption)', { width: 2200 }),
                cell('요청 중단 및 큐 이동', { width: 2600 }),
                cell('긴 요청 제어', { width: 4200 })
              ]})
            ]
          }),
          emptyLine(),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '3.2 시스템 아키텍처', font: FONT })]
          }),
          textParagraph(
            '시스템은 4계층 구조로 설계되었다. 클라이언트 계층, API 계층(Express.js), ' +
            '스케줄러 엔진(5가지 알고리즘, 런타임 교체 가능), 저장소 계층(메모리 배열, JSON 파일, Ollama LLM)으로 ' +
            '구성된다.'
          ),
          // 아키텍처 다이어그램을 텍스트로 표현
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 80 },
            children: [new TextRun({
              text: '그림 1. 시스템 아키텍처 (4계층 구조)',
              font: FONT, size: 20, bold: true, color: COLOR_DARK
            })]
          }),
          new Table({
            columnWidths: [9000],
            rows: [
              new TableRow({ children: [
                cell('', { width: 9000, shading: 'F5F5F5' }),
              ]}),
              new TableRow({ children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 9000, type: WidthType.DXA },
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 40 },
                      children: [new TextRun({ text: '[ 클라이언트 계층 ]', font: FONT, size: 20, bold: true })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
                      children: [new TextRun({ text: 'REST API 클라이언트  ·  대시보드', font: FONT, size: 18 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
                      children: [new TextRun({ text: '▼', font: FONT, size: 20 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
                      children: [new TextRun({ text: '[ API 계층 - Express.js ]', font: FONT, size: 20, bold: true })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
                      children: [new TextRun({ text: '요청 관리  ·  스케줄러 관리  ·  통계/공정성  ·  헬스 체크', font: FONT, size: 18 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
                      children: [new TextRun({ text: '▼', font: FONT, size: 20 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
                      children: [new TextRun({ text: '[ 스케줄러 엔진 - 런타임 교체 가능 ]', font: FONT, size: 20, bold: true })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
                      children: [new TextRun({ text: 'FCFS  |  Priority  |  MLFQ  |  WFQ  |  Rate Limiter', font: FONT, size: 18 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
                      children: [new TextRun({ text: 'Aging(기아 방지)  ·  Boost(부스팅)  ·  JFI(공정성 계산)', font: FONT, size: 18 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
                      children: [new TextRun({ text: '▼', font: FONT, size: 20 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
                      children: [new TextRun({ text: '[ 저장소 계층 ]', font: FONT, size: 20, bold: true })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
                      children: [new TextRun({ text: '메모리 배열(큐)  ·  JSON 파일(로그)  ·  Ollama(LLM)', font: FONT, size: 18 })] })
                  ]
                })
              ]})
            ]
          }),
          emptyLine(),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '3.3 스케줄링 알고리즘 설계', font: FONT })]
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [new TextRun({ text: '3.3.1 FCFS (First-Come, First-Served)', font: FONT })]
          }),
          textParagraph(
            '선착순 처리 알고리즘으로, 요청의 도착 타임스탬프를 기준으로 처리 순서를 결정한다. ' +
            '구현이 간단하며 다른 알고리즘의 성능 비교를 위한 베이스라인으로 사용한다.'
          ),

          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [new TextRun({ text: '3.3.2 Priority Scheduling with Aging', font: FONT })]
          }),
          textParagraph(
            '4단계 우선순위(URGENT > HIGH > NORMAL > LOW)를 지원하며, Aging 메커니즘을 통해 기아 현상을 방지한다. ' +
            '대기 시간이 임계값을 초과하면 요청의 우선순위가 자동으로 상승한다.'
          ),

          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [new TextRun({ text: '3.3.3 MLFQ (Multi-Level Feedback Queue)', font: FONT })]
          }),
          textParagraph(
            '4단계 피드백 큐(Q0-Q3)를 구현하며, 큐별 타임 퀀텀을 차등 설정한다(Q0: 500ms, Q1: 1,500ms, Q2: 4,000ms, Q3: 무제한). ' +
            '시간 슬라이스(500ms) 기반 선점형(preemptive) 모드를 지원하여, 타임 퀀텀을 초과한 요청은 하위 큐로 이동시킨다. ' +
            '이를 통해 짧은 요청이 긴 요청에 의해 지연되는 것을 방지한다. 주기적 Boost 메커니즘으로 모든 요청을 Q0로 복귀시켜 ' +
            '기아를 방지한다.'
          ),

          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [new TextRun({ text: '3.3.4 WFQ (Weighted Fair Queuing)', font: FONT })]
          }),
          textParagraph(
            'GPS 이론에 기반한 가중치 공정 큐잉 알고리즘으로, 테넌트 등급별 가중치(Enterprise: 100, Premium: 50, ' +
            'Standard: 10, Free: 1)에 비례하여 자원을 분배한다. Virtual Finish Time을 계산하여 스케줄링 순서를 결정하며, ' +
            '이중 수준 JFI(시스템 수준, 테넌트 수준)로 공정성을 정량적으로 모니터링한다.'
          ),

          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [new TextRun({ text: '3.3.5 Rate Limiter', font: FONT })]
          }),
          textParagraph(
            '토큰 버킷(Token Bucket) 알고리즘으로 테넌트별 요청 빈도를 제한한다. 버스트 용량을 제어하여 시스템 과부하를 방지한다.'
          ),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '3.4 핵심 기술 특징', font: FONT })]
          }),
          multiRunParagraph([
            { text: '런타임 알고리즘 교체. ', bold: true },
            { text: '서버 재시작 없이 REST API를 통해 스케줄링 알고리즘을 실시간으로 전환할 수 있다.' }
          ]),
          multiRunParagraph([
            { text: '이중 수준 공정성 측정. ', bold: true },
            { text: 'WFQ 스케줄러에서 시스템 수준 JFI(전체 테넌트 간 공정성)와 테넌트 수준 JFI(개별 테넌트 내 요청 간 ' +
              '공정성)를 분리 측정하여, "의도된 불공정(가중치 기반 차등)"이 올바르게 동작하는지 모니터링한다.' }
          ]),
          multiRunParagraph([
            { text: '기아 방지. ', bold: true },
            { text: 'Priority 스케줄러의 Aging 메커니즘과 MLFQ 스케줄러의 Boost 메커니즘을 통해 ' +
              '낮은 우선순위 요청의 무기한 대기를 방지한다.' }
          ]),

          // ===== 4. 예비 실험 결과 =====
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: '4. 예비 실험 결과', font: FONT })]
          }),
          textParagraph(
            '25-2학기에 프로토타입을 구현하고 실험을 수행하여 다음과 같은 예비 결과를 확인하였다. ' +
            '실험은 100건의 요청을 4개 테넌트에 분배하여 각 알고리즘의 성능을 측정하였다.'
          ),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '4.1 실험 환경', font: FONT })]
          }),
          new Paragraph({
            numbering: { reference: 'bullet-list', level: 0 },
            spacing: { after: 60, line: 360 },
            children: [new TextRun({ text: '런타임: Node.js 22 LTS, Express.js 4.18', font: FONT, size: 22 })]
          }),
          new Paragraph({
            numbering: { reference: 'bullet-list', level: 0 },
            spacing: { after: 60, line: 360 },
            children: [new TextRun({ text: '테스트: Jest 29.x (307개 테스트, 커버리지 99.76%)', font: FONT, size: 22 })]
          }),
          new Paragraph({
            numbering: { reference: 'bullet-list', level: 0 },
            spacing: { after: 60, line: 360 },
            children: [new TextRun({ text: 'LLM: Ollama (로컬 실행)', font: FONT, size: 22 })]
          }),
          new Paragraph({
            numbering: { reference: 'bullet-list', level: 0 },
            spacing: { after: 120, line: 360 },
            children: [new TextRun({ text: '의존성: 2개 패키지 (express, jest)', font: FONT, size: 22 })]
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '4.2 주요 성과 요약', font: FONT })]
          }),
          // 표 2: 알고리즘별 성능
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 80 },
            children: [new TextRun({
              text: '표 2. 알고리즘별 성능 비교 (100건 요청 실험)',
              font: FONT, size: 20, bold: true, color: COLOR_DARK
            })]
          }),
          new Table({
            columnWidths: [2000, 2500, 4500],
            rows: [
              new TableRow({ tableHeader: true, children: [
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
                cell('짧은 요청: 동시 경쟁 환경에서 81% 개선', { width: 4500 })
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
            { text: 'URGENT 요청은 FCFS 대비 62% 빠르게 처리되었다(Cohen\'s d = 0.78, p < 0.001). ' +
              'Aging 메커니즘에 의해 기아 현상이 방지됨을 확인하였다.' }
          ]),
          multiRunParagraph([
            { text: 'RQ2 (MLFQ): ', bold: true },
            { text: '시간 슬라이스 기반 선점형 모드에서, 짧은 요청과 긴 요청이 동시에 경쟁하는 환경에서 ' +
              '짧은 요청의 대기시간이 81.14% 개선되었다(p < 0.001).' }
          ]),
          multiRunParagraph([
            { text: 'RQ3 (WFQ): ', bold: true },
            { text: 'Enterprise 테넌트(가중치 100)는 Free 테넌트(가중치 1) 대비 5.8배 빠른 응답을 받았으며' +
              '(849ms vs 4,894ms), 테넌트 수준 JFI는 0.92-0.98로 높은 내부 공정성을 달성하였다.' }
          ]),

          // ===== 5. 연구 계획 =====
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: '5. 26-1학기 연구 계획', font: FONT })]
          }),
          textParagraph(
            '25-2학기 예비 구현에서 확인된 결과를 바탕으로, 26-1학기에는 다음을 추가 수행한다.'
          ),
          new Paragraph({
            numbering: { reference: 'num-plan', level: 0 },
            spacing: { after: 80, line: 360 },
            children: [new TextRun({
              text: '관련연구 확충: LLM 서빙 시스템 최신 논문 조사 및 분석 (vLLM, ORCA, Sarathi-Serve 등)',
              font: FONT, size: 22
            })]
          }),
          new Paragraph({
            numbering: { reference: 'num-plan', level: 0 },
            spacing: { after: 80, line: 360 },
            children: [new TextRun({
              text: '실험 설계 보강: 대규모 실험(1,000건 이상), 다양한 워크로드 시나리오 추가',
              font: FONT, size: 22
            })]
          }),
          new Paragraph({
            numbering: { reference: 'num-plan', level: 0 },
            spacing: { after: 80, line: 360 },
            children: [new TextRun({
              text: '공정성 분석 심화: JFI 외 추가 공정성 지표(Max-Min Fairness 등) 검토',
              font: FONT, size: 22
            })]
          }),
          new Paragraph({
            numbering: { reference: 'num-plan', level: 0 },
            spacing: { after: 120, line: 360 },
            children: [new TextRun({
              text: '최종 보고서 작성: 학술 논문 수준의 최종 보고서 작성',
              font: FONT, size: 22
            })]
          }),
          // 일정 표
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 80 },
            children: [new TextRun({
              text: '표 3. 26-1학기 연구 일정',
              font: FONT, size: 20, bold: true, color: COLOR_DARK
            })]
          }),
          new Table({
            columnWidths: [1800, 4200, 3000],
            rows: [
              new TableRow({ tableHeader: true, children: [
                cell('기간', { bold: true, shading: COLOR_HEADER_BG, width: 1800, align: AlignmentType.CENTER }),
                cell('활동', { bold: true, shading: COLOR_HEADER_BG, width: 4200, align: AlignmentType.CENTER }),
                cell('산출물', { bold: true, shading: COLOR_HEADER_BG, width: 3000, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('3월', { width: 1800, align: AlignmentType.CENTER }),
                cell('관련연구 조사, 제안서 작성', { width: 4200 }),
                cell('제안서 (본 문서)', { width: 3000 })
              ]}),
              new TableRow({ children: [
                cell('4월', { width: 1800, align: AlignmentType.CENTER }),
                cell('시스템 설계 상세화, 실험 확대', { width: 4200 }),
                cell('중간보고서', { width: 3000 })
              ]}),
              new TableRow({ children: [
                cell('5월', { width: 1800, align: AlignmentType.CENTER }),
                cell('최종 실험, 보고서 작성, 발표 준비', { width: 4200 }),
                cell('최종보고서, 발표', { width: 3000 })
              ]})
            ]
          }),
          emptyLine(),

          // ===== 참고문헌 =====
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: '참고문헌', font: FONT })]
          }),
          textParagraph(
            '[1] A. Silberschatz, P. B. Galvin, and G. Gagne, Operating System Concepts, 10th ed. Wiley, 2018.'
          ),
          textParagraph(
            '[2] F. J. Corbato, M. M. Daggett, and R. C. Daley, "An experimental time-sharing system," ' +
            'in Proceedings of the AFIPS Spring Joint Computer Conference, 1962, pp. 335-344.'
          ),
          textParagraph(
            '[3] R. H. Arpaci-Dusseau and A. C. Arpaci-Dusseau, Operating Systems: Three Easy Pieces. ' +
            'Arpaci-Dusseau Books, 2018.'
          ),
          textParagraph(
            '[4] A. Demers, S. Keshav, and S. Shenker, "Analysis and simulation of a fair queueing algorithm," ' +
            'in ACM SIGCOMM \'89 Proceedings, 1989, pp. 1-12.'
          ),
          textParagraph(
            '[5] W. Kwon et al., "Efficient memory management for large language model serving with PagedAttention," ' +
            'in Proceedings of SOSP \'23, 2023, pp. 611-626.'
          ),
          textParagraph(
            '[6] G. I. Yu et al., "Orca: A distributed serving system for Transformer-Based generative models," ' +
            'in Proceedings of OSDI \'22, 2022, pp. 521-538.'
          ),
          textParagraph(
            '[7] A. Agrawal et al., "Sarathi-Serve: CoDe Interleaving for Stall-free LLM Serving," ' +
            'arXiv:2308.16369, 2024.'
          ),
          textParagraph(
            '[8] R. Jain, D. M. Chiu, and W. R. Hawe, "A quantitative measure of fairness and discrimination ' +
            'for resource allocation in shared computer systems," DEC Research Report TR-301, 1984.'
          )
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, '..', 'final', 'proposal.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`제안서 DOCX 생성 완료: ${outputPath}`);
}

generateProposal().catch(console.error);
