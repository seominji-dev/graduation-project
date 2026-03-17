/**
 * 제안서 DOCX 생성 스크립트
 * proposal-v22.md 마크다운 기반으로 최종 제출용 DOCX 생성
 *
 * 사용법: node generate-proposal-docx.js
 * 출력: 04-proposal/final/proposal.docx
 */

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, AlignmentType, HeadingLevel, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, LevelFormat,
  ExternalHyperlink, PageBreak
} = require('docx');

// 색상 팔레트 (학술 문서용)
const COLORS = {
  BLACK: '000000',
  DARK_GRAY: '333333',
  GRAY: '666666',
  LIGHT_GRAY: 'CCCCCC',
  TABLE_HEADER: 'D5E8F0',
  TABLE_ALT: 'F5F9FC',
  ACCENT_BLUE: '2B579A',
  WHITE: 'FFFFFF'
};

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: COLORS.LIGHT_GRAY };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

// 테이블 헤더 셀 생성 함수
function headerCell(text, width) {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: COLORS.TABLE_HEADER, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text, bold: true, font: 'Arial', size: 20 })]
    })]
  });
}

// 테이블 데이터 셀 생성 함수
function dataCell(text, width, opts = {}) {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text, font: 'Arial', size: 20, bold: opts.bold || false })]
    })]
  });
}

function createDocument() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 22 }
        }
      },
      paragraphStyles: [
        {
          id: 'Title', name: 'Title', basedOn: 'Normal',
          run: { size: 36, bold: true, color: COLORS.BLACK, font: 'Arial' },
          paragraph: { spacing: { before: 0, after: 120 }, alignment: AlignmentType.CENTER }
        },
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, color: COLORS.DARK_GRAY, font: 'Arial' },
          paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 }
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, bold: true, color: COLORS.DARK_GRAY, font: 'Arial' },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 }
        },
        {
          id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 22, bold: true, color: COLORS.DARK_GRAY, font: 'Arial' },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 }
        }
      ]
    },
    numbering: {
      config: [
        {
          reference: 'research-goals',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        },
        {
          reference: 'future-plans',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        },
        {
          reference: 'architecture-layers',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        },
        {
          reference: 'performance-metrics',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        },
        {
          reference: 'bullet-list',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        }
      ]
    },
    sections: [
      // ===== Section 1: 표지 (페이지 번호 없음) =====
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            size: { width: 12240, height: 15840 }
          }
        },
        children: [
          new Paragraph({ spacing: { before: 1200 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'OS 스케줄링 알고리즘을 활용한', font: 'Arial', size: 36, bold: true })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: '다중 사용자 LLM API 요청 관리 시스템', font: 'Arial', size: 36, bold: true })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            children: [new TextRun({ text: 'Multi-User LLM API Request Management System\nUsing OS Scheduling Algorithms', font: 'Arial', size: 22, italics: true, color: COLORS.GRAY })]
          }),
          new Paragraph({ spacing: { before: 400 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: '홍익대학교 컴퓨터공학과', font: 'Arial', size: 24 })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: 'C235180 서민지', font: 'Arial', size: 24 })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: '지도교수: 이장호 교수님', font: 'Arial', size: 24 })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 0 },
            children: [new TextRun({ text: '2026년 3월', font: 'Arial', size: 22, color: COLORS.GRAY })]
          })
        ]
      },
      // ===== Section 2: 본문 (페이지 번호 1부터 시작) =====
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            size: { width: 12240, height: 15840 },
            pageNumbers: { start: 1 }
          }
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: '홍익대학교 컴퓨터공학과 졸업프로젝트 제안서', font: 'Arial', size: 16, color: COLORS.GRAY })]
            })]
          })
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: '- ', font: 'Arial', size: 18, color: '888888' }),
                new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: '888888' }),
                new TextRun({ text: ' -', font: 'Arial', size: 18, color: '888888' })
              ]
            })]
          })
        },
        children: [
        // ===== 1. 서론 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('1. 서론')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('1.1 연구 배경')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: 'ChatGPT, Claude, Gemini 등 대규모 언어 모델(Large Language Model, LLM) API 서비스가 빠르게 확산되면서, 여러 사용자가 동시에 LLM API를 호출하는 다중 사용자(Multi-tenant) 환경이 보편화되고 있다. 다중 사용자 환경이란, 하나의 서버가 여러 고객(테넌트)의 요청을 동시에 처리하는 구조를 말한다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '현재 대부분의 LLM 서비스는 선착순(First-Come, First-Served, FCFS) 처리 방식이나 단순 속도 제한(Rate Limiting)에 의존하고 있다. 이러한 방식은 다음과 같은 한계를 가진다. 첫째, 긴 요청이 뒤따르는 짧은 요청들의 처리를 지연시키는 호위 효과(Convoy Effect)가 발생한다. 둘째, 긴급한 요청도 도착 순서를 기다려야 하며, 사용자 등급에 따른 차등 서비스 제공이 불가능하다.', font: 'Arial', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('1.2 연구 동기와 목적')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '운영체제의 프로세스 스케줄링 알고리즘은 CPU 자원을 여러 프로세스에 효율적으로 배분하기 위해 수십 년간 연구되어 온 이론이다 [1][9]. 본 연구는 이 이론을 LLM API 요청 관리에 활용할 수 있는지 확인하고자 한다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: '구체적인 연구 목적은 다음과 같다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          numbering: { reference: 'research-goals', level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '4가지 스케줄링 알고리즘 구현', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': FCFS(기준 알고리즘), Priority Scheduling(긴급 요청 우선), MLFQ(적응형 스케줄링), WFQ(공정 배분)를 LLM API 환경에 맞게 구현한다. 추가로, 시스템 과부하를 방지하기 위한 Rate Limiter(속도 제한)를 보조 기능으로 구현한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'research-goals', level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '알고리즘별 성능 비교', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 4가지 스케줄링 알고리즘을 같은 조건에서 대기시간, 처리량, 공정성 기준으로 비교한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'research-goals', level: 0 },
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '공정성 측정', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': Jain\'s Fairness Index(JFI)를 활용하여 다중 사용자 환경의 공정성을 측정한다. JFI는 자원이 얼마나 고르게 나뉘었는지를 0에서 1 사이 점수로 나타내는 지표이다.', font: 'Arial', size: 22 })
          ]
        }),

        // ===== 2. 관련 연구 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('2. 관련 연구')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('2.1 OS 스케줄링 알고리즘')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '프로세스 스케줄링은 운영체제의 핵심 기능 중 하나로, CPU 자원을 여러 프로세스에 효율적으로 배분하기 위한 다양한 알고리즘이 연구되어 왔다 [1][9].', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'FCFS(First-Come, First-Served)', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '는 가장 단순한 스케줄링 알고리즘으로, 요청이 도착한 순서대로 처리한다. 구현이 간단하나 호위 효과가 발생하는 단점이 있다 [1][9].', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Priority Scheduling', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '은 각 프로세스에 우선순위를 부여하여 높은 우선순위의 프로세스를 먼저 처리한다. 그러나 낮은 우선순위의 프로세스가 계속 밀려 처리되지 못하는 기아(Starvation) 현상이 발생할 수 있다. 이를 해결하기 위해, 오래 기다린 프로세스의 우선순위를 점진적으로 높여주는 에이징(Aging) 기법이 사용된다 [1][9].', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'MLFQ(Multi-Level Feedback Queue)', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '는 작업의 실행 특성을 관찰하여 우선순위를 동적으로 조정하는 알고리즘이다. 짧은 작업은 높은 우선순위 큐에서 빠르게 처리되고, 할당된 시간(타임 퀀텀)을 초과한 긴 작업은 점차 하위 큐로 이동한다. 타임 퀀텀(Time Quantum)이란, 각 작업에 주어지는 최대 실행 시간으로, 이 시간이 지나면 다음 작업에게 순서를 양보해야 한다 [2][10].', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'WFQ(Weighted Fair Queuing)', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '는 네트워크 분야에서 제안된 공정 큐잉 알고리즘이다. 각 흐름(flow)에 가중치를 부여하여 가중치에 비례하는 서비스를 제공한다 [3][11]. GPS(Generalized Processor Sharing)는 자원을 무한히 분할하여 완벽히 공평하게 배분하는 이상적인 수학적 모델이며, WFQ는 이를 개별 요청(Discrete request) 단위의 현실 시스템에서 비슷하게 만든 실용적인 스케줄링 기법이다.', font: 'Arial', size: 22 })
          ]
        }),
        // 그림 1 참조
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: '[그림 1] 스케줄링 알고리즘 개념 비교 (별첨: proposal-figures.pptx, 슬라이드 1)', font: 'Arial', size: 20, italics: true, color: COLORS.GRAY })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('2.2 LLM 서빙 시스템과 스케줄링')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: 'LLM 서빙(LLM을 사용자에게 제공하는 것) 분야에서는 LLM 응답 속도를 높이기 위한 다양한 기술이 개발되어 왔다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'vLLM', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '은 UC Berkeley에서 개발한 LLM 서빙 도구이다 [4]. 그러나 요청 스케줄링은 선착순에 한정되어 있으며, 테넌트 간 공정성 보장 기능은 제공하지 않는다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Hugging Face TGI', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '는 오픈소스 LLM 서빙 도구이다 [5]. 다중 사용자 환경에서의 요청 우선순위 관리나 공정성 보장 기능은 포함하지 않는다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '기존 LLM 서빙 시스템들은 주로 LLM의 응답 속도를 높이는 데 집중하고 있으며, 다중 사용자 환경에서의 요청 스케줄링과 테넌트 간 공정성 문제는 아직 많이 다루어지지 않았다. 본 연구는 이 문제를 다루기 위해 OS 스케줄링 이론을 LLM 요청 관리에 적용한다.', font: 'Arial', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('2.3 공정성 측정')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: 'Jain\'s Fairness Index(JFI)는 공유 자원 시스템에서 자원 배분의 공정성을 측정하기 위한 지표이다 [3]. JFI는 0(완전 불공정)부터 1(완전 공정) 사이의 값을 가지며, 1에 가까울수록 자원이 공평하게 배분된 것이다. 반대로, 특정 사용자가 자원을 받지 못하면 0에 가까워진다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: 'JFI = (\u03A3xi)\u00B2 / (n \u00B7 \u03A3xi\u00B2)', font: 'Arial', size: 22, italics: true })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '여기서 xi는 측정 구간 동안 테넌트 i가 할당받은 자원량이며, n은 테넌트 수이다. 본 시스템에서는 스케줄러가 요청 단위로 동작하므로, xi를 처리 완료된 요청 수로 정의한다.', font: 'Arial', size: 22 })]
        }),

        // ===== 3. 제안 시스템 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('3. 제안 시스템')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('3.1 시스템 개요')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '본 연구에서 제안하는 시스템은 OS 스케줄링 알고리즘을 LLM API 요청 관리에 적용한 다중 사용자 요청 관리 시스템이다. 표 1은 OS 개념과 LLM 도메인 간의 대응 관계를 정리한 것이다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '시스템은 4가지 스케줄링 알고리즘(FCFS, Priority, MLFQ, WFQ)을 구현하고, 동일한 요청 환경에서 각 알고리즘의 성능을 비교한다. FCFS는 다른 알고리즘의 성능을 평가하기 위한 기준(베이스라인)으로 사용한다.', font: 'Arial', size: 22 })]
        }),

        // 표 1
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: '표 1. OS 개념과 LLM 도메인 대응 관계', bold: true, font: 'Arial', size: 20 })]
        }),
        new Table({
          columnWidths: [2200, 2400, 4760],
          rows: [
            new TableRow({ tableHeader: true, children: [
              headerCell('OS 개념', 2200), headerCell('LLM 도메인', 2400), headerCell('설명', 4760)
            ]}),
            new TableRow({ children: [
              dataCell('프로세스 (Process)', 2200), dataCell('LLM API 요청', 2400), dataCell('스케줄링의 기본 단위', 4760)
            ]}),
            new TableRow({ children: [
              dataCell('CPU 시간 (CPU Time)', 2200), dataCell('요청 처리 시간', 2400), dataCell('할당되는 자원', 4760)
            ]}),
            new TableRow({ children: [
              dataCell('우선순위 (Priority)', 2200), dataCell('테넌트 등급, 요청 긴급도', 2400), dataCell('처리 순서 결정 기준', 4760)
            ]}),
            new TableRow({ children: [
              dataCell('스케줄링 알고리즘', 2200), dataCell('요청 처리 순서 결정', 2400), dataCell('자원 배분 정책', 4760)
            ]}),
            new TableRow({ children: [
              dataCell('선점 (Preemption)', 2200), dataCell('요청 중단 및 큐 이동', 2400), dataCell('긴 요청 제어 방법', 4760)
            ]})
          ]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('3.2 시스템 아키텍처')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '시스템은 4계층 구조로 구성되며, 외부 LLM 백엔드와 연동한다 (그림 2 참조).', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          numbering: { reference: 'architecture-layers', level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: '클라이언트 계층', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': REST(웹 통신 규약) API를 통해 LLM 요청을 수신한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'architecture-layers', level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: 'API 계층', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': Express.js 기반 컨트롤러가 요청을 분류하고 스케줄러에 전달한다 [7][8]. 요청 분류 시, 테넌트의 구독 등급(Enterprise/Premium/Standard/Free)과 요청 헤더에 포함된 긴급도 정보를 기준으로 우선순위를 부여한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'architecture-layers', level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: '스케줄러 엔진', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 4가지 스케줄링 알고리즘으로 요청 처리 순서를 결정한다. 스케줄링 알고리즘은 실행 중 교체할 수 있으며, 상세 내용은 3.4절에서 설명한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'architecture-layers', level: 0 },
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '저장소 계층', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 메모리 배열과 JSON 파일로 상태 데이터를 관리한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '요청이 스케줄러에 도달하기 전에, Rate Limiter가 전처리 단계에서 과도한 요청을 제한한다.', font: 'Arial', size: 22 })]
        }),
        // 그림 2 참조
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: '[그림 2] 시스템 아키텍처 (4계층 구조) (별첨: proposal-figures.pptx, 슬라이드 2)', font: 'Arial', size: 20, italics: true, color: COLORS.GRAY })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('3.3 스케줄링 알고리즘 설계')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('3.3.1 FCFS (First-Come, First-Served)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '선착순 처리 알고리즘으로, 요청이 도착한 순서대로 처리한다. 구현이 간단하며 다른 알고리즘과 비교할 때 기준(베이스라인)으로 사용한다. 본 시스템에서는 도착 시각 기준으로 정렬된 단일 큐를 사용하여, 앞선 요청이 완료되어야 다음 요청이 처리되는 비선점형 방식으로 동작한다.', font: 'Arial', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('3.3.2 Priority Scheduling with Aging')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '4단계 우선순위(URGENT > HIGH > NORMAL > LOW)를 지원한다 [1]. 요청의 우선순위는 API 계층에서 테넌트 등급을 기준으로 결정하되, 요청 헤더의 긴급도 플래그가 설정된 경우 우선순위를 한 단계 상승시킨다. 기본 매핑은 Enterprise=HIGH, Premium=NORMAL, Standard=LOW, Free=LOW이며, 긴급도 플래그가 켜지면 각각 URGENT, HIGH, NORMAL, LOW로 한 단계씩 올라간다. 에이징(Aging)을 통해, 대기 시간이 일정 시간을 넘으면 요청의 우선순위가 자동으로 한 단계 올라가서 기아 현상을 방지한다.', font: 'Arial', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('3.3.3 MLFQ (Multi-Level Feedback Queue)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '본 알고리즘은 선점형(Preemptive) 방식으로 동작한다. 선점형이란, 처리 중인 요청의 할당 시간(타임 퀀텀)이 지나면 해당 요청을 잠시 멈추고 다른 요청에게 순서를 넘기는 방식을 말한다. MLFQ는 작업의 실행 특성을 관찰하여 우선순위를 동적으로 조정하는 알고리즘이다 [2]. 4단계 피드백 큐(Q0~Q3)를 구현하며, 상위 큐일수록 짧은 타임 퀀텀을, 하위 큐일수록 긴 타임 퀀텀을 설정한다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '타임 퀀텀을 초과한 요청은 하위 큐로 이동시켜, 짧은 요청이 긴 요청에 의해 지연되는 것을 방지한다. 주기적 부스트(Boost)로 모든 요청을 최상위 큐(Q0)로 복귀시켜 기아를 방지한다.', font: 'Arial', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('3.3.4 WFQ (Weighted Fair Queuing)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '테넌트 등급별 가중치에 비례하여 자원을 분배하는 알고리즘이다 [3]. 2.1절에서 설명한 GPS의 이상적 모델을 개별 요청 단위로 구현한 것이 WFQ이며, 본 시스템에서는 네트워크의 흐름(flow) 개념을 테넌트 등급별 가중치로 치환하여 적용한다. 등급이 높은 테넌트에 큰 가중치를, 낮은 등급에 작은 가중치를 부여한다(Enterprise=100, Premium=50, Standard=10, Free=1). 스케줄러는 각 요청의 비용(Cost)을 테넌트의 가중치로 나눈 값(ΔVFT = Cost / Weight)을 누적하여 가상 종료 시각(Virtual Finish Time, VFT)을 산출한다. 본 시스템에서는 요청 간 비용 차이를 별도로 모델링하지 않고, 모든 요청의 비용을 균일하게 1로 설정한다(Cost = 1). 따라서 ΔVFT = 1 / Weight가 되어, 가중치가 높은 테넌트의 요청일수록 VFT의 증가폭이 작게 계산되므로, 가장 작은 VFT를 가진 요청이 우선적으로 스케줄링된다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: 'WFQ는 테넌트 등급별 가중치만을 기준으로 자원을 배분하며, 개별 요청의 긴급도 필드는 사용하지 않는다. 이는 WFQ의 목적이 긴급 요청 우선 처리가 아니라 등급 간 비례적 자원 배분이기 때문이다. WFQ는 가중치 기반으로 자원을 비례 배분하는 구조이므로, Priority의 에이징이나 MLFQ의 부스트와 같은 별도의 기아 방지 장치가 필요하지 않다.', font: 'Arial', size: 22 })]
        }),

        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '정리하면, Priority는 등급과 긴급도를 조합하여 절대적 순서를 매기는 방식(높은 우선순위가 항상 먼저)이고, WFQ는 등급만을 기준으로 비례적 배분을 수행하는 방식(모든 등급이 가중치 비율대로 서비스)이다.', font: 'Arial', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('3.4 핵심 기술 특징')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '공정성 측정: ', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '2.3절에서 정의한 JFI를 4가지 스케줄링 알고리즘 모두에 적용하여, 각 알고리즘이 자원을 얼마나 공정하게 배분하는지 비교한다. 공정성은 두 가지 수준으로 나누어 측정한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '시스템 수준 JFI: 전체 테넌트를 대상으로 xi = 테넌트 i의 처리 완료 요청 수로 측정한다. 모든 테넌트가 동일한 수의 요청을 처리받았는지를 평가한다. FCFS, Priority, MLFQ에서는 1에 가까울수록 공정하다. 반면 WFQ는 등급별 가중치에 비례하여 의도적으로 차등 배분하므로, 시스템 수준 JFI가 1보다 낮게 나오는 것이 정상이다. 이 경우 낮은 JFI는 불공정이 아니라, 가중치 기반 차등 서비스가 설계대로 동작하고 있음을 의미한다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '테넌트 수준 JFI: 같은 등급 내 테넌트만을 대상으로 xi = 해당 등급 내 테넌트 i의 처리 완료 요청 수로 측정한다. 같은 등급의 테넌트끼리 공정하게 서비스를 받았는지를 평가하며, 모든 알고리즘에서 1에 가까워야 한다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '기아 방지: ', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: 'Priority 스케줄러의 에이징과 MLFQ 스케줄러의 부스트를 통해 낮은 우선순위 요청이 끝없이 기다리는 것을 방지한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Rate Limiter (속도 제한): ', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '토큰 버킷(Token Bucket) 알고리즘으로 테넌트별 요청 빈도를 제한한다 [3]. 토큰 버킷이란, 일정 시간마다 버킷 토큰(요청 허가 단위)이 생성되고, 요청 1건마다 버킷 토큰을 하나 소비하여 요청 빈도를 제한하는 방식이다. 여기서 \'버킷 토큰\'은 요청 허가를 나타내는 개념으로, LLM이 처리하는 언어 토큰과는 다른 개념이다. 버킷 토큰이 없으면 요청이 거부된다. 스케줄링 알고리즘과는 별도로, 요청이 스케줄러에 도달하기 전 단계에서 시스템 과부하를 방지하는 보조 기능이다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '실시간 알고리즘 교체: ', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '서버 재시작 없이 REST API를 통해 프로그램 실행 중(런타임)에 스케줄링 알고리즘을 전환하도록 설계한다. 이 기능은 운영 환경에서 작업량이 바뀔 때 최적 알고리즘을 선택하기 위한 서비스용 부가 기능이다. 성능 비교 실험에서는 하나의 알고리즘을 고정하고 전체 실험을 완료한 뒤 다음 알고리즘으로 전환하는 방식으로 진행하며, 실험 도중에는 알고리즘을 교체하지 않는다.', font: 'Arial', size: 22 })
          ]
        }),
        // 그림 3 참조
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: '[그림 3] 요청 처리 흐름도 (별첨: proposal-figures.pptx, 슬라이드 3)', font: 'Arial', size: 20, italics: true, color: COLORS.GRAY })]
        }),

        // ===== 3.5 성능 평가 지표 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('3.5 성능 평가 지표')]
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: '본 연구에서 스케줄링 알고리즘을 비교하기 위해 사용하는 평가 지표는 다음과 같다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          numbering: { reference: 'performance-metrics', level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '대기시간(Wait Time)', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 요청이 큐에 등록된 시점부터 실제 처리가 시작될 때까지 걸리는 시간(ms)이다. 대기시간이 짧을수록 사용자가 더 빠르게 응답을 받을 수 있다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'performance-metrics', level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '처리량(Throughput)', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 단위 시간당 처리 완료되는 요청의 수(req/s)이다. 부가 지표로 단위 시간당 생성된 토큰 수(tokens/s)도 함께 기록한다. 시스템이 얼마나 효율적으로 요청을 소화하는지를 나타낸다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'performance-metrics', level: 0 },
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '공정성(Fairness)', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': JFI를 사용하여 자원이 사용자 간에 얼마나 고르게 배분되었는지를 측정한다. 0에서 1 사이의 값이며, 1에 가까울수록 공정하다.', font: 'Arial', size: 22 })
          ]
        }),

        // ===== 3.6 구현 환경 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('3.6 구현 환경')]
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: '본 시스템은 다음과 같은 환경에서 구현한다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: '서버', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': Node.js 22 LTS, Express.js 4.18 [7][8]', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: 'LLM 백엔드', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': Ollama(로컬 환경에서 LLM을 간편하게 실행할 수 있는 도구) [6]', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '외부 의존성', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 1개 패키지 (express)', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: 'Node.js와 Express.js는 웹 서버를 구축하기 위한 도구이며, Ollama는 로컬 컴퓨터에서 LLM을 실행하여 외부 API 비용 없이 실험할 수 있게 해준다. 4가지 스케줄링 알고리즘과 Rate Limiter를 모두 구현하여 성능 비교 실험에 활용한다.', font: 'Arial', size: 22 })]
        }),

        // ===== 4. 실험 계획 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('4. 실험 계획')]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('4.1 실험 설계')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '3.6절의 구현 환경에서 다음과 같은 조건으로 실험을 수행할 계획이다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: '실험 규모', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 약 5,000~10,000건의 요청으로 반복 실험을 수행한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: '요청 구성', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 짧은 요청(프롬프트 50토큰 이하) 40%, 중간 요청(50~200토큰) 40%, 긴 요청(200토큰 이상) 20%의 비율로 구성한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: '요청 간 지연', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 50~500ms 범위에서 다양하게 설정하여 실제 서비스 환경에 가깝게 구성한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: 'LLM 모델', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': Ollama에서 실행 가능한 경량 모델(llama3, gemma 등)을 사용하여 로컬 환경에서 실험한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '변인 통제', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 4가지 스케줄링 알고리즘 간의 순수 성능 비교가 목적이므로, 전처리 모듈인 Rate Limiter는 비활성화한 상태에서 진행한다. Rate Limiter를 포함한 시스템 과부하 방지 테스트는 별도로 진행할 예정이다.', font: 'Arial', size: 22 })
          ]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('4.2 실험 시나리오')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '다양한 조건에서 알고리즘의 특성을 비교하기 위해, 다음과 같은 시나리오를 설계한다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: '정상 부하', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 일정한 간격으로 요청이 도착하는 기본 상황에서 각 알고리즘의 대기시간과 처리량을 측정한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: '버스트 부하', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 특정 시점에 요청이 급증하는 상황을 재현하여, 각 알고리즘이 과부하에 어떻게 대응하는지 관찰한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '테넌트 비율 변동', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': Enterprise/Premium/Standard/Free 테넌트의 비율을 달리하여 공정성 변화를 관찰한다.', font: 'Arial', size: 22 })
          ]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('4.3 평가 방법')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '3.5절에서 정의한 평가 지표(대기시간, 처리량, 공정성)를 4가지 알고리즘 모두에 동일하게 적용하여 비교한다. 공정성은 시스템 수준(전체 테넌트 간 JFI)과 테넌트 수준(같은 등급 내 JFI)으로 나누어 측정한다. 실험 결과는 알고리즘별로 대기시간 분포, 처리량 추이, JFI 변화를 표와 그래프로 정리하여 비교한다.', font: 'Arial', size: 22 })]
        }),

        // ===== 5. 연구 일정 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('5. 연구 일정')]
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: '26-1학기에는 다음과 같은 활동을 진행한다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          numbering: { reference: 'future-plans', level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '시스템 구현', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 제안 시스템의 4가지 스케줄링 알고리즘과 Rate Limiter를 구현한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'future-plans', level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '성능 비교 실험', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 4.1~4.2절에서 설계한 조건과 시나리오에 따라 알고리즘별 대기시간, 처리량, 공정성을 비교한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'future-plans', level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '관련연구 조사', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': LLM 서빙 분야의 스케줄링 기법을 더 찾아보고, 본 연구와 다른 점을 정리한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'future-plans', level: 0 },
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '결과 정리', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 실험 결과와 아키텍처 설계를 문서로 정리하여 보고서에 포함한다.', font: 'Arial', size: 22 })
          ]
        }),

        // 표 3
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: '표 2. 26-1학기 연구 일정', bold: true, font: 'Arial', size: 20 })]
        }),
        new Table({
          columnWidths: [1800, 3200, 2560, 1800],
          rows: [
            new TableRow({ tableHeader: true, children: [
              headerCell('기간', 1800), headerCell('주요 활동', 3200), headerCell('산출물', 2560), headerCell('마감일', 1800)
            ]}),
            new TableRow({ children: [
              dataCell('3월', 1800, { align: AlignmentType.CENTER }),
              dataCell('관련연구 조사, 제안서 작성', 3200),
              dataCell('제안서 (본 문서)', 2560),
              dataCell('3/22', 1800, { align: AlignmentType.CENTER })
            ]}),
            new TableRow({ children: [
              dataCell('4월', 1800, { align: AlignmentType.CENTER }),
              dataCell('시스템 구현, 본격 실험 수행', 3200),
              dataCell('중간보고서', 2560),
              dataCell('4/12', 1800, { align: AlignmentType.CENTER })
            ]}),
            new TableRow({ children: [
              dataCell('5월 초~중', 1800, { align: AlignmentType.CENTER }),
              dataCell('실험 결과 분석, 최종보고서 작성', 3200),
              dataCell('최종보고서 + 소스코드', 2560),
              dataCell('5/24', 1800, { align: AlignmentType.CENTER })
            ]}),
            new TableRow({ children: [
              dataCell('5월 말', 1800, { align: AlignmentType.CENTER }),
              dataCell('발표 자료 준비, 시스템 데모 구성', 3200),
              dataCell('발표 PPT, 실시간 데모', 2560),
              dataCell('5/26~29', 1800, { align: AlignmentType.CENTER })
            ]})
          ]
        }),

        // ===== 참고문헌 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('참고문헌')]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[1] A. Silberschatz, P. B. Galvin, and G. Gagne, Operating System Concepts, 10th ed., Wiley, 2018. [온라인] Available: https://www.os-book.com/', font: 'Arial', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[2] R. H. Arpaci-Dusseau and A. C. Arpaci-Dusseau, Operating Systems: Three Easy Pieces, Version 1.10, Arpaci-Dusseau Books, 2023. [온라인] Available: https://pages.cs.wisc.edu/~remzi/OSTEP/', font: 'Arial', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[3] J. F. Kurose and K. W. Ross, Computer Networking: A Top-Down Approach, 8th ed., Pearson, 2021. [온라인] Available: https://gaia.cs.umass.edu/kurose_ross/', font: 'Arial', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[4] W. Kwon et al., "Efficient Memory Management for Large Language Model Serving with PagedAttention," arXiv preprint, 2023. [온라인] Available: https://arxiv.org/abs/2309.06180', font: 'Arial', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[5] Hugging Face, "Text Generation Inference (TGI)," 2024. [온라인] Available: https://huggingface.co/docs/text-generation-inference/', font: 'Arial', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[6] Ollama, "Ollama - Get up and running with large language models," 2024. [온라인] Available: https://ollama.com/', font: 'Arial', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[7] Express.js, "Express - Node.js Web Application Framework," 2024. [온라인] Available: https://expressjs.com/', font: 'Arial', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[8] Node.js, "Node.js Documentation," 2024. [온라인] Available: https://nodejs.org/docs/latest/api/', font: 'Arial', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[9] 혀니앤, "[운영체제] 스케줄링 알고리즘," velog, 2022. [온라인] Available: https://velog.io/@jeongopo/운영체제-스케줄링-알고리즘', font: 'Arial', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[10] 폐프의삶, "[OS] MLFQ," tistory, 2025. [온라인] Available: https://waste-programmer.tistory.com/32', font: 'Arial', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[11] JSH 기술 블로그, "라우터의 패킷 지연과 패킷 스케줄링 방법," tistory, 2021. [온라인] Available: https://studyandwrite.tistory.com/442', font: 'Arial', size: 20 })]
        }),
      ]
    }]
  });

  return doc;
}

async function main() {
  console.log('=== 제안서 DOCX 생성 (v22) ===\n');

  const doc = createDocument();
  const buffer = await Packer.toBuffer(doc);

  const outputPath = path.join(__dirname, '..', 'final', 'proposal.docx');
  fs.writeFileSync(outputPath, buffer);

  console.log(`생성 완료: ${outputPath}`);
  console.log(`파일 크기: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
