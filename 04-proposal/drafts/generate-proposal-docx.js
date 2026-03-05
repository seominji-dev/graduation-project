/**
 * 제안서 DOCX 생성 스크립트
 * proposal-v6.md 마크다운 기반으로 최종 제출용 DOCX 생성
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
          reference: 'bullet-list',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        }
      ]
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          size: { width: 12240, height: 15840 }
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
              new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18 }),
              new TextRun({ text: ' / ', font: 'Arial', size: 18 }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 18 })
            ]
          })]
        })
      },
      children: [
        // ===== 제목 페이지 =====
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
        }),

        // 페이지 나눔
        new Paragraph({ children: [new PageBreak()] }),

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
          children: [new TextRun({ text: 'ChatGPT, Claude, Gemini 등 대규모 언어 모델(Large Language Model, LLM) API 서비스가 빠르게 확산되면서, 여러 사용자가 동시에 LLM API를 호출하는 다중 사용자(Multi-tenant) 환경이 보편화되고 있다. 이러한 환경에서 요청 처리 순서와 자원 배분 방식은 서비스 품질에 직접적인 영향을 미치는 핵심 요소이다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '현재 대부분의 LLM 서비스는 선착순(First-Come, First-Served, FCFS) 처리 방식이나 단순 Rate Limiting에 의존하고 있다. 이러한 방식은 다음과 같은 한계를 가진다. 첫째, 긴 요청이 뒤따르는 짧은 요청들의 처리를 지연시키는 호위 효과(Convoy Effect)가 발생한다. 둘째, 긴급한 요청도 도착 순서를 기다려야 하며, 사용자 등급에 따른 차등 서비스 제공이 불가능하다. 셋째, 테넌트(Tenant) 간 공정성을 정량적으로 측정하고 보장하는 메커니즘이 부재하다.', font: 'Arial', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('1.2 연구 동기와 목적')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '운영체제의 프로세스 스케줄링 알고리즘은 CPU 자원을 여러 프로세스에 효율적으로 배분하기 위해 수십 년간 연구되어 온 이론이다 [1]. 본 연구는 이 검증된 이론을 LLM API 요청 관리라는 새로운 도메인에 적용함으로써, OS 이론의 실제 응용 가능성을 탐구하고자 한다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: '구체적인 연구 목적은 다음과 같다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          numbering: { reference: 'research-goals', level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '5가지 스케줄링 알고리즘 구현', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': FCFS(베이스라인), Priority Scheduling(긴급 요청 우선), MLFQ(적응형 스케줄링), WFQ(공정 배분), Rate Limiter(속도 제한)를 LLM API 환경에 맞게 구현한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'research-goals', level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '알고리즘별 성능 비교 분석', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 동일한 워크로드에서 대기시간, 처리량, 공정성 지표를 정량적으로 비교한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'research-goals', level: 0 },
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '공정성 정량화', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': Jain\'s Fairness Index(JFI)를 활용하여 멀티테넌트 환경의 공정성을 이중 수준(시스템 수준 및 테넌트 수준)으로 측정하는 방법론을 제시한다.', font: 'Arial', size: 22 })
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
          children: [new TextRun({ text: '프로세스 스케줄링은 운영체제의 핵심 기능 중 하나로, CPU 자원을 여러 프로세스에 효율적으로 배분하기 위한 다양한 알고리즘이 연구되어 왔다 [1].', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'FCFS(First-Come, First-Served)', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '는 가장 단순한 스케줄링 알고리즘으로, 요청이 도착한 순서대로 처리한다. 구현이 간단하나, 긴 작업이 짧은 작업을 지연시키는 호위 효과(Convoy Effect)가 발생하는 단점이 있다 [1].', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Priority Scheduling', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '은 각 프로세스에 우선순위를 부여하여 높은 우선순위의 프로세스를 먼저 처리한다. 그러나 낮은 우선순위의 프로세스가 무기한 대기하는 기아(Starvation) 현상이 발생할 수 있으며, 이를 해결하기 위해 대기 시간에 따라 우선순위를 점진적으로 높이는 에이징(Aging) 기법이 사용된다 [1].', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'MLFQ(Multi-Level Feedback Queue)', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '는 작업의 실행 특성을 관찰하여 우선순위를 동적으로 조정하는 알고리즘이다. 짧은 작업은 높은 우선순위 큐에서 빠르게 처리되고, 타임 퀀텀(Time Quantum)을 초과한 긴 작업은 점차 하위 큐로 이동한다. Arpaci-Dusseau & Arpaci-Dusseau는 MLFQ의 5가지 핵심 규칙을 정리하며, 현대 운영체제에서 가장 널리 사용되는 스케줄링 알고리즘 중 하나임을 설명하였다 [2].', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'WFQ(Weighted Fair Queuing)', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '는 네트워크 분야에서 제안된 공정 큐잉 알고리즘으로, GPS(Generalized Processor Sharing) 이론에 기반한다 [3]. 각 흐름(flow)에 가중치를 부여하여 가중치에 비례하는 서비스를 제공하며, 가상 종료 시각(Virtual Finish Time) 개념을 사용하여 스케줄링 순서를 결정한다.', font: 'Arial', size: 22 })
          ]
        }),
        // 그림 1 참조
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: '[그림 1] 스케줄링 알고리즘 개념 비교 (별첨: fig-1-scheduling-comparison.pptx)', font: 'Arial', size: 20, italics: true, color: COLORS.GRAY })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('2.2 LLM 서빙 시스템과 스케줄링')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: 'LLM 서빙 분야에서는 추론 성능 최적화를 위한 다양한 기술이 개발되어 왔다. 이 절에서는 대표적인 LLM 서빙 시스템의 특징과, 본 연구와의 관련성을 살펴본다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'vLLM', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '은 UC Berkeley에서 개발한 고성능 LLM 추론 엔진으로, PagedAttention이라는 핵심 기술을 도입하였다 [4]. 이 기법은 운영체제의 가상 메모리 페이징에서 착안하여, LLM 추론 시 KV(Key-Value) 캐시 메모리를 비연속적 블록으로 관리한다. vLLM은 OS의 메모리 관리 기법을 LLM에 성공적으로 적용한 사례로, 기존 대비 처리량을 2~4배 개선하였다. 그러나 vLLM의 스케줄링은 FCFS 기반의 Continuous Batching에 한정되어 있으며, 테넌트 간 차등 서비스나 공정성 보장 메커니즘은 제공하지 않는다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Hugging Face TGI(Text Generation Inference)', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '는 오픈소스 LLM 배포 도구로, Continuous Batching과 Flash Attention 등의 기술을 활용하여 추론 효율성을 높인다 [5]. Docker 기반으로 간편한 배포를 지원하지만, 다중 사용자 환경에서의 요청 우선순위 관리나 공정성 보장 기능은 포함하지 않는다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Ollama', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '는 로컬 환경에서 LLM을 간편하게 실행할 수 있는 도구로, REST API를 통해 다양한 오픈소스 모델(Llama, Mistral, Gemma 등)을 제공한다 [6]. 본 연구의 프로토타입에서 LLM 백엔드로 활용하였다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '기존 LLM 서빙 시스템들은 주로 GPU 메모리 관리와 추론 파이프라인 효율화에 집중하고 있으며, 다중 사용자 환경에서의 요청 스케줄링과 테넌트 간 공정성 문제는 상대적으로 다루어지지 않았다. 본 연구는 이 간극을 메우기 위해 OS 스케줄링 이론을 LLM 요청 관리에 적용한다. 특히 vLLM이 OS의 메모리 관리 기법을 LLM에 적용한 것처럼, 본 연구는 OS의 프로세스 스케줄링 기법을 LLM 요청 관리에 적용한다는 점에서 유사한 접근 방식을 취한다.', font: 'Arial', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('2.3 공정성 측정')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: 'Jain\'s Fairness Index(JFI)는 공유 자원 시스템에서 자원 배분의 공정성을 정량적으로 측정하기 위한 지표로, 운영체제 및 네트워크 분야에서 범용 공정성 지표로 널리 사용되고 있다 [3]. JFI는 0(완전 불공정)부터 1(완전 공정) 사이의 값을 가지며, 다음과 같이 계산된다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: 'JFI = (Σxi)² / (n · Σxi²)', font: 'Arial', size: 22, italics: true })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '여기서 xi는 각 사용자가 받는 자원의 양, n은 사용자 수이다. 본 연구는 JFI를 멀티테넌트 LLM API 환경에 적용하여, 시스템 수준(전체 테넌트 간)과 테넌트 수준(동일 등급 내 요청 간)의 이중 공정성 측정 방법론을 제시한다.', font: 'Arial', size: 22 })]
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
          children: [new TextRun({ text: '본 연구에서 제안하는 시스템은 OS 스케줄링 알고리즘을 LLM API 요청 관리에 적용한 멀티테넌트 요청 관리 시스템이다. 표 1은 OS 개념과 LLM 도메인 간의 대응 관계를 정리한 것이다.', font: 'Arial', size: 22 })]
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
              dataCell('CPU 시간 (CPU Time)', 2200), dataCell('API 호출 쿼터', 2400), dataCell('할당되는 자원', 4760)
            ]}),
            new TableRow({ children: [
              dataCell('우선순위 (Priority)', 2200), dataCell('테넌트 등급, 요청 긴급도', 2400), dataCell('처리 순서 결정 기준', 4760)
            ]}),
            new TableRow({ children: [
              dataCell('스케줄링 알고리즘', 2200), dataCell('요청 처리 순서 결정', 2400), dataCell('자원 배분 정책', 4760)
            ]}),
            new TableRow({ children: [
              dataCell('선점 (Preemption)', 2200), dataCell('요청 중단 및 큐 이동', 2400), dataCell('긴 요청 제어 메커니즘', 4760)
            ]})
          ]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('3.2 시스템 아키텍처')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '시스템은 4계층 구조로 설계되었다 (그림 2 참조).', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: '클라이언트 계층', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': REST API를 통해 LLM 요청을 수신한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: 'API 계층', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': Express.js 기반 컨트롤러가 요청을 분류하고 스케줄러에 전달한다 [7][8].', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: '스케줄러 엔진', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 런타임에 교체 가능한 5가지 알고리즘으로 요청 처리 순서를 결정한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '저장소 계층', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 메모리 배열과 JSON 파일로 상태 데이터를 관리한다.', font: 'Arial', size: 22 })
          ]
        }),
        // 그림 2 참조
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: '[그림 2] 시스템 아키텍처 (4계층 구조) (별첨: fig-2-system-architecture.pptx)', font: 'Arial', size: 20, italics: true, color: COLORS.GRAY })]
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
          children: [new TextRun({ text: '선착순 처리 알고리즘으로, 요청의 도착 타임스탬프를 기준으로 처리 순서를 결정한다. 구현이 간단하며 다른 알고리즘의 성능 비교를 위한 베이스라인으로 사용한다.', font: 'Arial', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('3.3.2 Priority Scheduling with Aging')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '4단계 우선순위(URGENT > HIGH > NORMAL > LOW)를 지원하며, 에이징(Aging) 메커니즘을 통해 기아 현상을 방지한다 [1]. 대기 시간이 임계값을 초과하면 요청의 우선순위가 자동으로 한 단계 상승한다.', font: 'Arial', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('3.3.3 MLFQ (Multi-Level Feedback Queue)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '4단계 피드백 큐(Q0~Q3)를 구현하며, 큐별 타임 퀀텀을 차등 설정한다(Q0: 500ms, Q1: 1,500ms, Q2: 4,000ms, Q3: 무제한). 시간 슬라이스(500ms) 기반의 선점형(Preemptive) 동작을 지원하여, 타임 퀀텀을 초과한 요청은 하위 큐로 이동시킨다 [2]. 이를 통해 짧은 요청이 긴 요청에 의해 지연되는 것을 방지한다. 주기적 부스트(Boost) 메커니즘으로 모든 요청을 최상위 큐(Q0)로 복귀시켜 기아를 방지한다.', font: 'Arial', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('3.3.4 WFQ (Weighted Fair Queuing)')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: 'GPS 이론에 기반한 가중치 공정 큐잉 알고리즘으로, 테넌트 등급별 가중치(Enterprise: 100, Premium: 50, Standard: 10, Free: 1)에 비례하여 자원을 분배한다 [3]. 가상 종료 시각(Virtual Finish Time)을 계산하여 스케줄링 순서를 결정하며, 이중 수준 JFI로 공정성을 정량적으로 모니터링한다.', font: 'Arial', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun('3.3.5 Rate Limiter')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '토큰 버킷(Token Bucket) 알고리즘으로 테넌트별 요청 빈도를 제한한다 [3]. 버스트 용량을 제어하여 시스템 과부하를 방지하는 보조 메커니즘으로 활용한다.', font: 'Arial', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('3.4 핵심 기술 특징')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '런타임 알고리즘 교체: ', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '서버 재시작 없이 REST API(PUT /api/scheduler)를 통해 스케줄링 알고리즘을 실시간으로 전환할 수 있다. 이를 통해 워크로드 특성 변화에 따라 운영 중 최적 알고리즘을 선택할 수 있으며, 알고리즘 간 성능 비교 실험을 동일 환경에서 수행할 수 있다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '이중 수준 공정성 측정: ', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: 'WFQ 스케줄러에서 시스템 수준 JFI(전체 테넌트 간 공정성)와 테넌트 수준 JFI(개별 테넌트 내 요청 간 공정성)를 분리 측정한다. 시스템 수준 JFI는 가중치 비율에 따른 의도적 차등이 올바르게 동작하는지를 검증하고, 테넌트 수준 JFI는 동일 등급 내 요청 간의 공평한 처리를 확인한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '기아 방지: ', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: 'Priority 스케줄러의 에이징(Aging)과 MLFQ 스케줄러의 부스트(Boost) 메커니즘을 통해 낮은 우선순위 요청의 무기한 대기를 방지한다.', font: 'Arial', size: 22 })
          ]
        }),
        // 그림 3 참조
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: '[그림 3] 요청 처리 흐름도 (별첨: fig-3-request-flow.pptx)', font: 'Arial', size: 20, italics: true, color: COLORS.GRAY })]
        }),

        // ===== 4. 예비 실험 결과 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('4. 예비 실험 결과')]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '25-2학기에 프로토타입을 구현하고 실험을 수행하여 다음과 같은 예비 결과를 확인하였다.', font: 'Arial', size: 22 })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('4.1 실험 환경')]
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
            new TextRun({ text: ': Ollama (로컬 실행) [6]', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: '외부 의존성', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 1개 패키지 (express)', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '통계 검증', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 10개 시드 기반 다중 실험 (시드당 500건 요청, 총 5,000건)', font: 'Arial', size: 22 })
          ]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun('4.2 주요 성과 요약')]
        }),

        // 표 2
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: '표 2. 알고리즘별 성능 비교 요약', bold: true, font: 'Arial', size: 20 })]
        }),
        new Table({
          columnWidths: [2000, 2500, 4860],
          rows: [
            new TableRow({ tableHeader: true, children: [
              headerCell('스케줄러', 2000), headerCell('평균 대기시간', 2500), headerCell('핵심 발견', 4860)
            ]}),
            new TableRow({ children: [
              dataCell('FCFS', 2000, { bold: true }), dataCell('2,572ms', 2500, { align: AlignmentType.CENTER }),
              dataCell('베이스라인. 도착 순서대로 처리', 4860)
            ]}),
            new TableRow({ children: [
              dataCell('Priority', 2000, { bold: true }), dataCell('2,826ms', 2500, { align: AlignmentType.CENTER }),
              dataCell('URGENT 요청 1,122ms (FCFS 대비 62% 감소)', 4860)
            ]}),
            new TableRow({ children: [
              dataCell('MLFQ', 2000, { bold: true }), dataCell('2,572ms', 2500, { align: AlignmentType.CENTER }),
              dataCell('짧은 요청: 선점형 모드에서 73.78% 개선', 4860)
            ]}),
            new TableRow({ children: [
              dataCell('WFQ', 2000, { bold: true }), dataCell('2,819ms', 2500, { align: AlignmentType.CENTER }),
              dataCell('Enterprise 849ms vs Free 4,894ms (5.8배 차이)', 4860)
            ]})
          ]
        }),

        new Paragraph({ spacing: { before: 120 }, children: [] }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'RQ1 (Priority Scheduling): ', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: 'URGENT 요청은 FCFS 대비 62% 빠르게 처리되었다 (효과 크기 Cohen\'s d = 0.78, p < 0.001). 에이징 메커니즘에 의해 기아 현상이 방지됨을 확인하였다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'RQ2 (MLFQ): ', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: '시간 슬라이스 기반 선점형 모드에서, 짧은 요청과 긴 요청이 동시에 경쟁하는 환경에서 짧은 요청의 대기시간이 평균 73.78% 개선되었다 (10개 시드 다중 실험, 95% 신뢰구간: [72.36%, 75.20%], p < 0.001).', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'RQ3 (WFQ): ', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: 'Enterprise 테넌트(가중치 100)는 Free 테넌트(가중치 1) 대비 5.8배 빠른 응답을 받았다. 테넌트 수준 JFI는 0.92~0.98로 높은 내부 공정성을 유지하였다.', font: 'Arial', size: 22 })
          ]
        }),

        // ===== 5. 연구 계획 =====
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('5. 26-1학기 연구 계획')]
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: '25-2학기 예비 구현에서 확인된 결과를 바탕으로, 26-1학기에는 다음을 추가 수행한다.', font: 'Arial', size: 22 })]
        }),
        new Paragraph({
          numbering: { reference: 'future-plans', level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '관련연구 보강', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': LLM 서빙 시스템의 최신 스케줄링 기법과 멀티테넌트 자원 관리에 대한 관련연구를 추가 조사하여, 본 연구의 차별성을 명확히 제시한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'future-plans', level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '실험 설계 확대', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 대규모 실험(1,000건 이상)과 다양한 워크로드 시나리오(버스트 트래픽, 비균등 테넌트 분포 등)를 추가하여 알고리즘의 확장성을 검증한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'future-plans', level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '공정성 분석 심화', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': JFI 외 추가 공정성 지표 적용을 검토하고, 공정성과 성능 간의 트레이드오프를 분석한다.', font: 'Arial', size: 22 })
          ]
        }),
        new Paragraph({
          numbering: { reference: 'future-plans', level: 0 },
          spacing: { after: 120 },
          children: [
            new TextRun({ text: '시스템 설계 문서화', bold: true, font: 'Arial', size: 22 }),
            new TextRun({ text: ': 아키텍처 상세 설계, 알고리즘 의사코드, API 명세를 체계적으로 정리한다.', font: 'Arial', size: 22 })
          ]
        }),

        // 표 3
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: '표 3. 26-1학기 연구 일정', bold: true, font: 'Arial', size: 20 })]
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
              dataCell('시스템 설계 상세화, 대규모 실험', 3200),
              dataCell('중간보고서', 2560),
              dataCell('4/12', 1800, { align: AlignmentType.CENTER })
            ]}),
            new TableRow({ children: [
              dataCell('5월 초~중', 1800, { align: AlignmentType.CENTER }),
              dataCell('추가 실험, 결과 분석, 최종보고서 집필', 3200),
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
          children: [new TextRun({ text: '[4] W. Kwon et al., "Efficient Memory Management for Large Language Model Serving with PagedAttention," in Proc. 29th ACM Symp. on Operating Systems Principles (SOSP \'23), 2023, pp. 611-626. [온라인] Available: https://github.com/vllm-project/vllm', font: 'Arial', size: 20 })]
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
      ]
    }]
  });

  return doc;
}

async function main() {
  console.log('=== 제안서 DOCX 생성 ===\n');

  const doc = createDocument();
  const buffer = await Packer.toBuffer(doc);

  const outputPath = path.join(__dirname, '..', 'final', 'proposal.docx');
  fs.writeFileSync(outputPath, buffer);

  console.log(`생성 완료: ${outputPath}`);
  console.log(`파일 크기: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
