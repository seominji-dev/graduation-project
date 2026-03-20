/**
 * 제안서 DOCX 생성 스크립트
 * proposal-v27.md 마크다운 기반으로 최종 제출용 DOCX 생성
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
      children: [new TextRun({ text, bold: true, font: '맑은 고딕', size: 20 })]
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
      children: [new TextRun({ text, font: '맑은 고딕', size: 20, bold: opts.bold || false })]
    })]
  });
}

function createDocument() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: '맑은 고딕', size: 22 },
          paragraph: { spacing: { line: 276 } }
        }
      },
      paragraphStyles: [
        {
          id: 'Title', name: 'Title', basedOn: 'Normal',
          run: { size: 36, bold: true, color: COLORS.BLACK, font: '맑은 고딕' },
          paragraph: { spacing: { before: 0, after: 120 }, alignment: AlignmentType.CENTER }
        },
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, color: COLORS.DARK_GRAY, font: '맑은 고딕' },
          paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 }
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, bold: true, color: COLORS.DARK_GRAY, font: '맑은 고딕' },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 }
        },
        {
          id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 22, bold: true, color: COLORS.DARK_GRAY, font: '맑은 고딕' },
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
            children: [new TextRun({ text: 'OS 스케줄링 알고리즘을 활용한', font: '맑은 고딕', size: 36, bold: true })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: '다중 사용자 LLM API 요청 관리 시스템', font: '맑은 고딕', size: 36, bold: true })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
            children: [new TextRun({ text: 'Multi-User LLM API Request Management System', font: '맑은 고딕', size: 22, italics: true, color: COLORS.GRAY })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            children: [new TextRun({ text: 'Using OS Scheduling Algorithms', font: '맑은 고딕', size: 22, italics: true, color: COLORS.GRAY })]
          }),
          new Paragraph({ spacing: { before: 400 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: '홍익대학교 컴퓨터공학과', font: '맑은 고딕', size: 24 })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: 'C235180 서민지', font: '맑은 고딕', size: 24 })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: '지도교수: 이장호 교수님', font: '맑은 고딕', size: 24 })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 0 },
            children: [new TextRun({ text: '2026년 3월', font: '맑은 고딕', size: 22, color: COLORS.GRAY })]
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
              children: [new TextRun({ text: '홍익대학교 컴퓨터공학과 졸업프로젝트 제안서', font: '맑은 고딕', size: 16, color: COLORS.GRAY })]
            })]
          })
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: '- ', font: '맑은 고딕', size: 18, color: '888888' }),
                new TextRun({ children: [PageNumber.CURRENT], font: '맑은 고딕', size: 18, color: '888888' }),
                new TextRun({ text: ' -', font: '맑은 고딕', size: 18, color: '888888' })
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
          children: [new TextRun({ text: 'ChatGPT, Claude, Gemini 등 대규모 언어 모델(Large Language Model, LLM) API 서비스가 빠르게 확산되면서, 여러 사용자가 동시에 LLM API를 호출하는 다중 사용자(Multi-tenant) 환경이 보편화되고 있다. 다중 사용자 환경이란, 하나의 서버가 여러 고객(테넌트)의 요청을 동시에 처리하는 구조를 말한다.', font: '맑은 고딕', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '현재 대부분의 LLM 서비스는 선착순(First-Come, First-Served, FCFS) 처리 방식이나 단순 속도 제한(Rate Limiting)에 의존하고 있다. 이러한 방식은 다음과 같은 한계를 가진다. 첫째, 긴급한 요청도 도착 순서를 기다려야 하므로 시간에 민감한 요청의 빠른 처리가 불가능하다. 둘째, 사용자 등급에 따른 차등 서비스를 제공할 수 없어, 높은 등급의 테넌트와 무료 사용자가 동일한 대기 조건을 갖게 된다. 셋째, 자원이 테넌트 간에 공정하게 배분되고 있는지 측정하거나 보장할 수단이 없다.', font: '맑은 고딕', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('1.2 연구 동기와 목적')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '운영체제의 프로세스 스케줄링 알고리즘은 CPU 자원을 여러 프로세스에 효율적으로 배분하기 위해 수십 년간 연구되어 온 이론이다 [1][9]. 본 연구는 이 이론을 LLM API 요청 관리에 활용할 수 있는지 탐구하고자 한다.', font: '맑은 고딕', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: '구체적인 연구 목적은 다음과 같다.', font: '맑은 고딕', size: 22 })]
        }),
        new Paragraph({
          numbering: { reference: 'research-goals', level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: 'OS 스케줄링 알고리즘의 LLM 환경 적용', bold: true, font: '맑은 고딕', size: 22 }),
            new TextRun({ text: ': 대표적인 OS 스케줄링 알고리즘들을 LLM API 환경에 맞게 적용하는 방안을 탐구하고자 한다.', font: '맑은 고딕', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'research-goals', level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '알고리즘 간 성능 비교', bold: true, font: '맑은 고딕', size: 22 }),
            new TextRun({ text: ': 여러 스케줄링 알고리즘을 동일한 조건에서 대기시간, 처리량, 공정성 등의 기준으로 비교하고자 한다.', font: '맑은 고딕', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'research-goals', level: 0 },
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '공정성 측정 방법 탐구', bold: true, font: '맑은 고딕', size: 22 }),
            new TextRun({ text: ': Jain\'s Fairness Index(JFI) 등의 공정성 지표를 활용하여 다중 사용자 환경에서 자원 배분의 공정성을 측정하는 방법을 탐구하고자 한다.', font: '맑은 고딕', size: 22 })
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
          children: [new TextRun({ text: '프로세스 스케줄링은 운영체제의 핵심 기능 중 하나로, CPU 자원을 여러 프로세스에 효율적으로 배분하기 위한 다양한 알고리즘이 연구되어 왔다 [1][9].', font: '맑은 고딕', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'FCFS(First-Come, First-Served)', bold: true, font: '맑은 고딕', size: 22 }),
            new TextRun({ text: '는 가장 단순한 스케줄링 알고리즘으로, 요청이 도착한 순서대로 처리한다. 구현이 간단하나 호위 효과(Convoy Effect, 처리 시간이 긴 요청이 뒤따르는 짧은 요청들의 처리를 지연시키는 현상)가 발생하는 단점이 있다 [1][9].', font: '맑은 고딕', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Priority Scheduling', bold: true, font: '맑은 고딕', size: 22 }),
            new TextRun({ text: '은 각 프로세스에 우선순위를 부여하여 높은 우선순위의 프로세스를 먼저 처리한다. 그러나 낮은 우선순위의 프로세스가 계속 밀려 처리되지 못하는 기아(Starvation) 현상이 발생할 수 있다. 이를 해결하기 위해, 오래 기다린 프로세스의 우선순위를 점진적으로 높여주는 에이징(Aging) 기법이 사용된다 [1][9].', font: '맑은 고딕', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'MLFQ(Multi-Level Feedback Queue)', bold: true, font: '맑은 고딕', size: 22 }),
            new TextRun({ text: '는 작업의 실행 특성을 관찰하여 우선순위를 동적으로 조정하는 알고리즘이다 [2][10]. 짧은 작업은 높은 우선순위 큐에서 빠르게 처리되고, 타임 퀀텀(Time Quantum, 한 번에 할당되는 최대 실행 시간)을 초과한 긴 작업은 점차 하위 큐로 이동한다. OS에서 MLFQ는 선점형(Preemptive, 실행 중인 작업을 중단할 수 있는 방식)으로 동작하여, 타임 퀀텀을 초과한 프로세스를 중단하고 하위 큐로 강등시킨다 [2][10].', font: '맑은 고딕', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'WFQ(Weighted Fair Queuing)', bold: true, font: '맑은 고딕', size: 22 }),
            new TextRun({ text: '는 네트워크 분야에서 제안된 공정 큐잉 알고리즘이다 [3][11]. 각 흐름(flow)에 가중치를 부여하여 가중치에 비례하는 서비스를 제공한다. GPS(Generalized Processor Sharing)는 자원을 가중치에 비례하여 동시에 배분하는 이상적인 수학적 모델이며, WFQ는 이를 개별 요청(Discrete request) 단위의 현실 시스템에서 비슷하게 구현한 실용적인 스케줄링 기법이다.', font: '맑은 고딕', size: 22 })
          ]
        }),
        // 그림 1 참조
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: '[그림 1] 스케줄링 알고리즘 개념 비교 (별첨: proposal-figures.pptx, 슬라이드 1)', font: '맑은 고딕', size: 20, italics: true, color: COLORS.GRAY })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('2.2 LLM 서빙 시스템과 스케줄링')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: 'LLM 서빙(LLM을 사용자에게 제공하는 것) 분야에서는 LLM 응답 속도를 높이기 위한 다양한 기술이 개발되어 왔다.', font: '맑은 고딕', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'vLLM', bold: true, font: '맑은 고딕', size: 22 }),
            new TextRun({ text: '은 UC Berkeley에서 개발한 LLM 서빙 도구이다 [4]. 그러나 요청 스케줄링은 선착순에 한정되어 있으며, 테넌트 간 공정성 보장 기능은 제공하지 않는다.', font: '맑은 고딕', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Hugging Face TGI', bold: true, font: '맑은 고딕', size: 22 }),
            new TextRun({ text: '는 오픈소스 LLM 서빙 도구이다 [5]. 다중 사용자 환경에서의 요청 우선순위 관리나 공정성 보장 기능은 포함하지 않는다.', font: '맑은 고딕', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '기존 LLM 서빙 시스템들은 주로 LLM의 응답 속도를 높이는 데 집중하고 있으며, 다중 사용자 환경에서의 요청 스케줄링과 테넌트 간 공정성 문제는 아직 많이 다루어지지 않았다. 본 연구는 이 문제를 다루기 위해 OS 스케줄링 이론을 LLM 요청 관리에 적용하고자 한다.', font: '맑은 고딕', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('2.3 공정성 측정')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: 'Jain\'s Fairness Index(JFI)는 공유 자원 시스템에서 자원 배분의 공정성을 측정하기 위한 지표이다 [3]. JFI는 0(완전 불공정)부터 1(완전 공정) 사이의 값을 가지며, 1에 가까울수록 자원이 공평하게 배분된 것이다. 반대로, 특정 사용자가 자원을 받지 못하면 0에 가까워진다.', font: '맑은 고딕', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: 'JFI = (\u03A3xi)\u00B2 / (n \u00B7 \u03A3xi\u00B2)', font: '맑은 고딕', size: 22, italics: true })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '여기서 xi는 테넌트 i가 할당받은 자원량이며, n은 테넌트 수이다.', font: '맑은 고딕', size: 22 })]
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
          children: [new TextRun({ text: '본 연구에서 제안하는 시스템은 OS 스케줄링 알고리즘을 LLM API 요청 관리에 적용한 다중 사용자 요청 관리 시스템이다. 표 1은 OS 개념과 LLM 도메인 간의 대응 관계를 정리한 것이다.', font: '맑은 고딕', size: 22 })]
        }),

        // 표 1
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: '표 1. OS 개념과 LLM 도메인 대응 관계', bold: true, font: '맑은 고딕', size: 20 })]
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
              dataCell('CPU 시간 (CPU Time)', 2200), dataCell('LLM 추론 시간', 2400), dataCell('할당되는 자원', 4760)
            ]}),
            new TableRow({ children: [
              dataCell('우선순위 (Priority)', 2200), dataCell('테넌트 등급, 요청 긴급도', 2400), dataCell('처리 순서 결정 기준', 4760)
            ]}),
            new TableRow({ children: [
              dataCell('스케줄링 알고리즘', 2200), dataCell('요청 처리 순서 결정', 2400), dataCell('자원 배분 정책', 4760)
            ]})
          ]
        }),

        new Paragraph({
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: '시스템은 복수의 스케줄링 알고리즘을 구현하여, 동일한 요청 환경에서 각 알고리즘의 성능을 비교하는 것을 목표로 한다. FCFS를 기준(베이스라인) 알고리즘으로 삼고, Priority Scheduling, MLFQ, WFQ 등의 알고리즘을 적용하여 비교할 계획이다.', font: '맑은 고딕', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('3.2 핵심 연구 과제')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '본 연구에서 탐구해야 할 핵심 과제는 OS 스케줄링 이론을 LLM 환경에 맞게 적응시키는 것이다.', font: '맑은 고딕', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: 'OS에서 프로세스 스케줄링은 CPU 시간을 짧은 단위(타임 퀀텀)로 나누어 여러 프로세스에 번갈아 할당하는 선점형(Preemptive) 방식이 일반적이다. 그러나 LLM 추론은 한번 시작되면 중간에 중단할 수 없으므로, 비선점형(Non-preemptive) 환경에서 동작해야 한다. 이러한 차이로 인해, 2.1절에서 소개한 알고리즘들을 그대로 적용할 수 없으며, LLM 도메인의 특성에 맞는 적응 방안을 연구해야 한다.', font: '맑은 고딕', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '예를 들어, MLFQ의 경우 OS에서는 타임 퀀텀을 초과한 프로세스를 즉시 중단하고 하위 큐로 강등시키지만, LLM 환경에서는 요청 완료 후의 결과를 바탕으로 피드백을 적용하는 방식으로 변환해야 할 것이다. 이처럼 각 알고리즘의 핵심 원리를 유지하면서 LLM 환경에 맞게 변환하는 것이 본 연구의 주요 과제이다.', font: '맑은 고딕', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '또한, 알고리즘 비교를 위한 적절한 평가 지표를 선정하고, 대기시간, 처리량, 공정성(JFI) 등의 관점에서 각 알고리즘의 특성을 분석하고자 한다.', font: '맑은 고딕', size: 22 })]
        }),
        // 그림 2 참조
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: '[그림 2] OS 스케줄링과 LLM 요청 관리의 개념적 대응 (별첨: proposal-figures.pptx, 슬라이드 2)', font: '맑은 고딕', size: 20, italics: true, color: COLORS.GRAY })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('3.3 기대 효과')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '본 시스템이 구현될 경우, 다음과 같은 효과를 기대할 수 있다.', font: '맑은 고딕', size: 22 })]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '차등적 서비스 제공', bold: true, font: '맑은 고딕', size: 22 }),
            new TextRun({ text: ': 테넌트 등급이나 요청 긴급도에 따라 처리 순서를 조정하여, 중요한 요청을 우선적으로 처리할 수 있다.', font: '맑은 고딕', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '공정성 보장', bold: true, font: '맑은 고딕', size: 22 }),
            new TextRun({ text: ': 공정성 지표를 통해 자원 배분의 균형을 정량적으로 측정하고, 특정 테넌트가 자원을 독점하는 것을 방지할 수 있다.', font: '맑은 고딕', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '알고리즘 비교 데이터 확보', bold: true, font: '맑은 고딕', size: 22 }),
            new TextRun({ text: ': 여러 스케줄링 전략을 동일한 환경에서 비교함으로써, LLM 서빙 환경에 적합한 스케줄링 방식에 대한 실험적 근거를 제공할 수 있다.', font: '맑은 고딕', size: 22 })
          ]
        }),

        // ===== 4. 연구 일정 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('4. 연구 일정')]
        }),

        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: '26-1학기에는 시스템 설계 및 구현, 성능 비교 실험, 결과 분석을 진행할 계획이다.', font: '맑은 고딕', size: 22 })]
        }),
        // 표 2
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: '표 2. 26-1학기 연구 일정', bold: true, font: '맑은 고딕', size: 20 })]
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
              dataCell('시스템 설계 및 구현', 3200),
              dataCell('중간보고서', 2560),
              dataCell('4/12', 1800, { align: AlignmentType.CENTER })
            ]}),
            new TableRow({ children: [
              dataCell('5월 초~중', 1800, { align: AlignmentType.CENTER }),
              dataCell('실험 수행 및 결과 분석', 3200),
              dataCell('최종보고서 + 소스코드', 2560),
              dataCell('5/24', 1800, { align: AlignmentType.CENTER })
            ]}),
            new TableRow({ children: [
              dataCell('5월 말', 1800, { align: AlignmentType.CENTER }),
              dataCell('발표 자료 준비, 시스템 데모 구성', 3200),
              dataCell('발표 PPT, 데모', 2560),
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
          children: [new TextRun({ text: '[1] A. Silberschatz, P. B. Galvin, and G. Gagne, Operating System Concepts, 10th ed., Wiley, 2018. [온라인] Available: https://www.os-book.com/', font: '맑은 고딕', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[2] R. H. Arpaci-Dusseau and A. C. Arpaci-Dusseau, Operating Systems: Three Easy Pieces, Version 1.10, Arpaci-Dusseau Books, 2023. [온라인] Available: https://pages.cs.wisc.edu/~remzi/OSTEP/', font: '맑은 고딕', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[3] J. F. Kurose and K. W. Ross, Computer Networking: A Top-Down Approach, 8th ed., Pearson, 2021. [온라인] Available: https://gaia.cs.umass.edu/kurose_ross/', font: '맑은 고딕', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[4] W. Kwon et al., "Efficient Memory Management for Large Language Model Serving with PagedAttention," arXiv preprint, 2023. [온라인] Available: https://arxiv.org/abs/2309.06180', font: '맑은 고딕', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[5] Hugging Face, "Text Generation Inference (TGI)," 2024. [온라인] Available: https://huggingface.co/docs/text-generation-inference/', font: '맑은 고딕', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[6] Ollama, "Ollama - Get up and running with large language models," 2024. [온라인] Available: https://ollama.com/', font: '맑은 고딕', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[7] Express.js, "Express - Node.js Web Application Framework," 2024. [온라인] Available: https://expressjs.com/', font: '맑은 고딕', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[8] Node.js, "Node.js Documentation," 2024. [온라인] Available: https://nodejs.org/docs/latest/api/', font: '맑은 고딕', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[9] 혀니앤, "[운영체제] 스케줄링 알고리즘," velog, 2022. [온라인] Available: https://velog.io/@jeongopo/운영체제-스케줄링-알고리즘', font: '맑은 고딕', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[10] 폐프의삶, "[OS] MLFQ," tistory, 2025. [온라인] Available: https://waste-programmer.tistory.com/32', font: '맑은 고딕', size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '[11] JSH 기술 블로그, "라우터의 패킷 지연과 패킷 스케줄링 방법," tistory, 2021. [온라인] Available: https://studyandwrite.tistory.com/442', font: '맑은 고딕', size: 20 })]
        }),
      ]
    }]
  });

  return doc;
}

async function main() {
  console.log('=== 제안서 DOCX 생성 (v27) ===\n');

  const doc = createDocument();
  const buffer = await Packer.toBuffer(doc);

  const outputPath = path.join(__dirname, '..', 'final', 'proposal.docx');
  fs.writeFileSync(outputPath, buffer);

  console.log(`생성 완료: ${outputPath}`);
  console.log(`파일 크기: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
