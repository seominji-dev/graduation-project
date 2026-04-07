/**
 * 중간보고서 v5 DOCX 생성 스크립트
 * midterm-v5.md 내용을 기반으로 05-midterm-report/final/midterm-report.docx 생성
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak
} = require('docx');

// ============================================================
// 공통 스타일 상수
// ============================================================
const FONT = '맑은 고딕';
const CODE_FONT = 'Consolas';
const COLOR_BLACK = '000000';
const COLOR_DARK = '333333';
const COLOR_GRAY = '666666';
const COLOR_LIGHT_GRAY = '888888';
const COLOR_HEADER_BG = 'D9E2F3';

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' };
const cellBorders = {
  top: tableBorder,
  bottom: tableBorder,
  left: tableBorder,
  right: tableBorder
};

// ============================================================
// 헬퍼 함수
// ============================================================

/** 일반 텍스트 문단 */
function textParagraph(text, options = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    ...options,
    children: [
      new TextRun({
        text,
        font: FONT,
        size: 22,
        color: COLOR_BLACK,
        ...(options.runOptions || {})
      })
    ]
  });
}

/** 여러 TextRun을 가진 문단 */
function multiRunParagraph(runs, options = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    ...options,
    children: runs.map(r =>
      new TextRun({ font: FONT, size: 22, color: COLOR_BLACK, ...r })
    )
  });
}

/** 표 셀 */
function cell(content, opts = {}) {
  const children = typeof content === 'string'
    ? [new Paragraph({
        spacing: { before: 40, after: 40 },
        alignment: opts.align || AlignmentType.LEFT,
        children: [new TextRun({
          text: content,
          font: FONT,
          size: 20,
          color: COLOR_BLACK,
          bold: opts.bold || false
        })]
      })]
    : content;
  return new TableCell({
    borders: cellBorders,
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.shading
      ? { fill: opts.shading, type: ShadingType.CLEAR }
      : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children
  });
}

/** 빈 줄 */
function emptyLine() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

/** Heading 1 (14pt, bold) */
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({
      text, font: FONT, size: 28, bold: true, color: COLOR_BLACK
    })]
  });
}

/** Heading 2 (12pt, bold) */
function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 160 },
    children: [new TextRun({
      text, font: FONT, size: 24, bold: true, color: COLOR_DARK
    })]
  });
}

/** Heading 3 (11pt, bold) */
function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({
      text, font: FONT, size: 22, bold: true, color: COLOR_DARK
    })]
  });
}

/** 불릿 항목 */
function bulletItem(text) {
  return new Paragraph({
    numbering: { reference: 'bullet-list', level: 0 },
    spacing: { after: 80, line: 340 },
    children: [new TextRun({ text, font: FONT, size: 22, color: COLOR_BLACK })]
  });
}

/** 볼드가 포함된 불릿 항목 */
function bulletItemBold(boldText, normalText) {
  return new Paragraph({
    numbering: { reference: 'bullet-list', level: 0 },
    spacing: { after: 80, line: 340 },
    children: [
      new TextRun({ text: boldText, font: FONT, size: 22, color: COLOR_BLACK, bold: true }),
      new TextRun({ text: normalText, font: FONT, size: 22, color: COLOR_BLACK })
    ]
  });
}

/** 번호 목록 항목 */
function numberedItem(text) {
  return new Paragraph({
    numbering: { reference: 'num-list', level: 0 },
    spacing: { after: 80, line: 340 },
    children: [new TextRun({ text, font: FONT, size: 22, color: COLOR_BLACK })]
  });
}

/** 번호 목록 항목 (볼드+일반 혼합) */
function numberedItemBold(boldText, normalText) {
  return new Paragraph({
    numbering: { reference: 'num-list', level: 0 },
    spacing: { after: 80, line: 340 },
    children: [
      new TextRun({ text: boldText, font: FONT, size: 22, color: COLOR_BLACK, bold: true }),
      new TextRun({ text: normalText, font: FONT, size: 22, color: COLOR_BLACK })
    ]
  });
}

/** 코드 블록 (Consolas, 9pt, 들여쓰기) */
function codeBlock(lines) {
  return lines.map(line => new Paragraph({
    spacing: { after: 0, line: 240 },
    indent: { left: 360 },
    children: [new TextRun({
      text: line,
      font: CODE_FONT,
      size: 18,
      color: COLOR_DARK
    })]
  }));
}

/** 그림 캡션 (중앙, 이탤릭) */
function figureCaption(text) {
  return textParagraph(text, {
    alignment: AlignmentType.CENTER,
    runOptions: { italics: true, color: COLOR_GRAY }
  });
}

/** 표 캡션 (볼드) */
function tableCaption(text) {
  return textParagraph(text, { runOptions: { bold: true } });
}

// ============================================================
// 메인 생성 함수
// ============================================================
async function generateMidtermReport() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22, color: COLOR_BLACK }
        }
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 28, bold: true, color: COLOR_BLACK, font: FONT },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 }
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 24, bold: true, color: COLOR_DARK, font: FONT },
          paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 }
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
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
            level: 0,
            format: LevelFormat.BULLET,
            text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        },
        {
          reference: 'num-list',
          levels: [{
            level: 0,
            format: LevelFormat.DECIMAL,
            text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        }
      ]
    },
    sections: [
      // ================================================================
      // Section 1: 표지 (페이지 번호 없음)
      // ================================================================
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        children: [
          emptyLine(), emptyLine(), emptyLine(), emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({
              text: '2026학년도 졸업프로젝트',
              font: FONT, size: 24, color: COLOR_GRAY
            })]
          }),
          emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({
              text: '중 간 보 고 서',
              font: FONT, size: 44, bold: true, color: COLOR_BLACK
            })]
          }),
          emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({
              text: '스케줄링 알고리즘을 활용한',
              font: FONT, size: 30, bold: true
            })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [new TextRun({
              text: '다중 사용자 LLM API 요청 관리 시스템',
              font: FONT, size: 30, bold: true
            })]
          }),
          emptyLine(), emptyLine(), emptyLine(), emptyLine(),
          new Table({
            columnWidths: [2400, 4800],
            rows: [
              new TableRow({ children: [
                cell('학 과', { bold: true, shading: COLOR_HEADER_BG, width: 2400, align: AlignmentType.CENTER }),
                cell('홍익대학교 컴퓨터공학과', { width: 4800 })
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
                cell('이장호 교수님', { width: 4800 })
              ]})
            ]
          }),
          emptyLine(), emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({
              text: '2026년 4월',
              font: FONT, size: 22, color: COLOR_GRAY
            })]
          }),
          emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: '홍익대학교 컴퓨터공학과',
              font: FONT, size: 24, color: COLOR_GRAY
            })]
          })
        ]
      },

      // ================================================================
      // Section 2: 본문 (페이지 번호 1부터)
      // ================================================================
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            pageNumbers: { start: 1 }
          }
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({
                text: '홍익대학교 컴퓨터공학과 졸업프로젝트',
                font: FONT, size: 16, color: COLOR_LIGHT_GRAY
              })]
            })]
          })
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: '- ', font: FONT, size: 18, color: COLOR_LIGHT_GRAY }),
                new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: COLOR_LIGHT_GRAY }),
                new TextRun({ text: ' -', font: FONT, size: 18, color: COLOR_LIGHT_GRAY })
              ]
            })]
          })
        },
        children: [

          // ====================================================
          // 1. 서론
          // ====================================================
          heading1('1. 서론'),

          // 1.1 연구 배경
          heading2('1.1 연구 배경'),
          textParagraph(
            '최근 ChatGPT, Claude, Gemini 등 대규모 언어 모델(Large Language Model, LLM) API 서비스가 ' +
            '다양한 분야에서 활용되고 있다. 이에 따라 기업이나 연구실에서도 하나의 LLM API 계정을 여러 구성원이 ' +
            '공유하거나, 자체 LLM 서버를 구축하여 여러 사용자에게 서비스하는 사례가 늘어나고 있다.'
          ),
          textParagraph(
            '이러한 다중 사용자 환경에서는 요청을 어떻게 관리할지가 문제가 된다. OpenAI는 조직 단위로 분당 요청 수와 ' +
            '토큰 수에 한도를 두고 있고 [1], Anthropic도 사용 등급별로 호출 한도를 적용하고 있다 [2]. 그러나 이는 ' +
            '계정 단위의 관리이므로, 같은 계정을 공유하는 사용자들 사이에서 누가 얼마나 사용할지를 조율하는 것은 ' +
            '별개의 문제이다.'
          ),
          textParagraph(
            '별도의 관리 기능이 없다 보니, 요청은 도착한 순서대로 처리되거나 호출 빈도 제한 수준에서 관리되는 것이 ' +
            '일반적이다. 이 경우 긴급한 요청도 순서를 기다려야 하고, 사용자별로 자원을 다르게 배분하기 어려우며, ' +
            '자원이 공정하게 나누어지고 있는지 확인하기도 쉽지 않다.'
          ),

          // 1.2 연구 목적
          heading2('1.2 연구 목적'),
          textParagraph(
            '3학년 운영체제 수업에서 프로세스 스케줄링 알고리즘을 배우면서, "이 알고리즘들을 LLM API 요청 관리에 ' +
            '적용하면 어떨까?"라는 궁금증에서 이 프로젝트를 시작하게 되었다. 스케줄링 이론을 LLM API 환경에 적용해보고, ' +
            '알고리즘별 성능과 공정성을 비교해보는 것이 본 프로젝트의 목적이다.'
          ),
          textParagraph('구체적으로 다음 세 가지를 수행하고자 한다.'),
          numberedItemBold(
            '스케줄링 알고리즘 적용: ',
            'FCFS, Priority Scheduling, MLFQ, WFQ의 네 가지 스케줄링 알고리즘을 LLM API 환경에 맞게 구현한다.'
          ),
          numberedItemBold(
            '알고리즘별 성능 비교: ',
            '평균 대기시간, 처리량 등의 지표로 각 알고리즘의 효율성을 비교한다.'
          ),
          numberedItemBold(
            '공정성 분석: ',
            'Jain\'s Fairness Index(JFI)를 활용하여, 각 알고리즘이 사용자 간 자원을 얼마나 공정하게 배분하는지 분석한다.'
          ),

          // 1.3 진행 상황
          heading2('1.3 진행 상황'),
          textParagraph(
            '현재까지 시스템의 핵심 기능을 구현하고, 기본적인 실험을 수행하였다. 네 가지 스케줄링 알고리즘 ' +
            '모두 동작하는 상태이며, 각 알고리즘의 단위 테스트를 통해 정상 동작을 확인하였다. 이후 추가 실험과 ' +
            '분석을 진행하고 있다. 이 보고서에서는 시스템 설계, 구현 현황, 중간 실험 결과를 정리한다.'
          ),

          // ====================================================
          // 2. 관련 연구
          // ====================================================
          new Paragraph({ children: [new PageBreak()] }),
          heading1('2. 관련 연구'),
          textParagraph(
            '이 장에서는 본 프로젝트에서 활용한 스케줄링 알고리즘의 이론적 배경, 기존 LLM 서빙 도구의 현황, ' +
            '그리고 공정성 측정 방법을 살펴본다.'
          ),

          // 2.1 스케줄링 알고리즘
          heading2('2.1 스케줄링 알고리즘'),
          textParagraph(
            '프로세스 스케줄링은 운영체제에서 CPU 자원을 여러 프로세스에 나누어 주기 위한 방법이다. ' +
            '어떤 순서로 처리할지에 따라 다양한 알고리즘이 연구되어 왔다 [3][4].'
          ),
          multiRunParagraph([
            { text: 'FCFS(First-Come, First-Served)', bold: true },
            { text: '는 요청이 도착한 순서대로 처리하는 가장 단순한 방식이다. ' +
              '구현이 간단하지만, 처리 시간이 긴 요청이 앞에 있으면 뒤의 짧은 요청들까지 오래 기다리게 되는 호위 효과' +
              '(Convoy Effect)가 발생할 수 있다 [3].' }
          ]),
          multiRunParagraph([
            { text: 'Priority Scheduling', bold: true },
            { text: '은 각 프로세스에 긴급도(우선순위)를 부여하여 더 급한 것을 먼저 처리하는 방식이다. ' +
              '다만 우선순위가 낮은 프로세스가 계속 밀려서 영원히 처리되지 못하는 기아 현상(Starvation)이 발생할 수 있다. ' +
              '이를 막기 위해 오래 기다린 프로세스의 우선순위를 점차 올려주는 에이징(Aging) 기법이 사용된다 [3].' }
          ]),
          multiRunParagraph([
            { text: 'MLFQ(Multi-Level Feedback Queue)', bold: true },
            { text: '는 여러 개의 대기열을 두고, 작업의 특성에 따라 우선순위를 자동으로 조정하는 알고리즘이다. ' +
              '새 작업은 가장 높은 우선순위 큐에 들어가고, 주어진 시간 안에 끝나지 않으면 한 단계 낮은 큐로 내려간다. ' +
              '여기서 타임 퀀텀(Time Quantum)이란 "한 번에 쓸 수 있는 최대 시간"으로, 이 시간을 넘기면 차례가 다음 ' +
              '사람에게 넘어가는 것이다. 이렇게 하면 짧은 작업은 빠르게 처리되고, 긴 작업은 천천히 처리되는 효과가 ' +
              '있다. 현대 운영체제에서 가장 널리 쓰이는 스케줄링 방식 중 하나이다 [4].' }
          ]),
          multiRunParagraph([
            { text: 'WFQ(Weighted Fair Queuing)', bold: true },
            { text: '는 네트워크 분야에서 사용되는 공정한 자원 배분 알고리즘이다 [5]. 각 사용자(흐름)에 가중치를 ' +
              '부여하고, 가중치가 클수록 더 많은 자원을 받도록 설계되어 있다. 각 요청에 대해 가상 완료 ' +
              '시각(Virtual Finish Time)이라는 값을 계산하여, 이 값이 가장 작은 요청을 먼저 처리한다. ' +
              '가중치가 큰 사용자의 요청은 이 값이 작아져서 더 자주 선택된다. WFQ의 구체적인 계산 방식은 4.3절에서 설명한다.' }
          ]),

          // 2.2 LLM 서빙 시스템
          heading2('2.2 LLM 서빙 시스템'),
          textParagraph(
            'LLM 서빙이란 학습이 완료된 LLM을 사용자에게 제공하는 것을 뜻한다. 이 분야에서 널리 사용되는 ' +
            '오픈소스 도구를 조사해보았다.'
          ),
          multiRunParagraph([
            { text: 'vLLM', bold: true },
            { text: '은 UC Berkeley에서 개발한 LLM 서빙 도구로, PagedAttention이라는 메모리 관리 기법으로 높은 처리 성능을 보여준다 [6]. ' +
              '다만 공식 문서를 조사한 결과, 요청 스케줄링은 ' +
              '선착순 방식에 가까우며, 사용자 간 공정성을 보장하는 별도의 기능은 확인하지 못하였다.' }
          ]),
          multiRunParagraph([
            { text: 'Hugging Face TGI(Text Generation Inference)', bold: true },
            { text: '는 다양한 LLM을 쉽게 배포할 수 있도록 도와주는 오픈소스 도구이다 [7]. 여러 요청을 한꺼번에 ' +
              '묶어서 처리하는 배치 처리(Continuous Batching) 기능을 지원하지만, 다중 사용자 환경에서의 요청 우선순위 ' +
              '관리나 공정성 보장 기능은 공식 문서에서 찾아볼 수 없었다.' }
          ]),
          textParagraph(
            '조사한 도구들은 주로 응답 속도를 높이는 데 집중하고 있었으며, 다중 사용자 환경에서의 요청 스케줄링이나 ' +
            '사용자 간 공정성 문제는 아직 많이 다루어지지 않은 것으로 보인다. 본 프로젝트는 이 부분에 스케줄링 ' +
            '이론을 적용해보려고 한다.'
          ),

          // 2.3 공정성 측정
          heading2('2.3 공정성 측정'),
          textParagraph(
            '여러 사용자가 자원을 공유하는 시스템에서, 자원이 얼마나 고르게 나뉘었는지를 측정하는 지표로 ' +
            'Jain\'s Fairness Index(JFI)가 있다 [5]. JFI는 자원이 얼마나 공정하게 배분되었는지를 0에서 1 사이 ' +
            '점수 하나로 나타내는 지표이다. 1에 가까울수록 공평하게 나뉜 것이고, 특정 사용자만 자원을 많이 받으면 ' +
            '0에 가까워진다.'
          ),
          textParagraph(
            'JFI = (x\u2081 + x\u2082 + ... + x\u2099)\u00B2 / (n \u00D7 (x\u2081\u00B2 + x\u2082\u00B2 + ... + x\u2099\u00B2))', {
            runOptions: { italics: true }
          }),
          textParagraph(
            '여기서 x\u1D62는 사용자 i가 할당받은 자원량, n은 사용자 수이다. 모든 사용자가 동일하게 자원을 받으면 ' +
            'JFI = 1이고, 한 명이 독점하면 JFI = 1/n에 가까워진다. 네트워크 대역폭 배분, CPU 스케줄링 등 ' +
            '다양한 자원 공유 문제에서 사용되며, 본 프로젝트에서도 이 지표를 활용하여 스케줄링 알고리즘의 ' +
            '공정성을 비교하였다.'
          ),

          // ====================================================
          // 3. 시스템 설계
          // ====================================================
          new Paragraph({ children: [new PageBreak()] }),
          heading1('3. 시스템 설계'),
          textParagraph(
            '이 장에서는 제안서에서 설명한 시스템의 구체적인 설계를 정리한다. 전체 아키텍처, 모듈 간 관계, ' +
            '그리고 데이터 처리 흐름을 살펴본다.'
          ),

          // 3.1 설계 개요
          heading2('3.1 설계 개요'),
          textParagraph(
            '본 시스템의 기본 아이디어는, OS에서 프로세스가 CPU를 할당받기 위해 대기하는 것처럼, LLM API 요청도 ' +
            '대기열에서 순서를 기다리는 구조를 만드는 것이다. 표 1은 OS 개념과 LLM 환경 사이의 대응 관계를 ' +
            '정리한 것이다.'
          ),

          // 표 1: OS-LLM 개념 대응
          tableCaption('표 1. OS 개념과 LLM 환경 대응 관계'),
          new Table({
            columnWidths: [2500, 2500, 4000],
            rows: [
              new TableRow({ children: [
                cell('OS 개념', { bold: true, shading: COLOR_HEADER_BG, width: 2500, align: AlignmentType.CENTER }),
                cell('LLM 환경 대응', { bold: true, shading: COLOR_HEADER_BG, width: 2500, align: AlignmentType.CENTER }),
                cell('설명', { bold: true, shading: COLOR_HEADER_BG, width: 4000, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('프로세스 (Process)', { width: 2500 }),
                cell('LLM API 요청', { width: 2500 }),
                cell('스케줄링의 기본 단위', { width: 4000 })
              ]}),
              new TableRow({ children: [
                cell('CPU 시간 (CPU Time)', { width: 2500 }),
                cell('LLM 추론 시간', { width: 2500 }),
                cell('할당되는 자원', { width: 4000 })
              ]}),
              new TableRow({ children: [
                cell('준비 큐 (Ready Queue)', { width: 2500 }),
                cell('요청 대기열', { width: 2500 }),
                cell('처리를 기다리는 작업의 저장소', { width: 4000 })
              ]}),
              new TableRow({ children: [
                cell('우선순위 (Priority)', { width: 2500 }),
                cell('요청 우선순위', { width: 2500 }),
                cell('개별 요청의 긴급도 (Priority Scheduling에서 사용)', { width: 4000 })
              ]}),
              new TableRow({ children: [
                cell('(해당 없음)', { width: 2500 }),
                cell('사용자 등급', { width: 2500 }),
                cell('사용자별 서비스 수준 (WFQ에서 사용)', { width: 4000 })
              ]}),
              new TableRow({ children: [
                cell('시간 할당량 (Time Quantum)', { width: 2500 }),
                cell('큐별 처리 시간 한도', { width: 2500 }),
                cell('MLFQ에서 큐 이동 기준', { width: 4000 })
              ]})
            ]
          }),
          emptyLine(),

          // 3.2 시스템 아키텍처
          heading2('3.2 시스템 아키텍처'),
          textParagraph('시스템은 4개의 계층으로 구성하였다 (그림 1).'),
          emptyLine(),
          figureCaption('[그림 1] 시스템 아키텍처 (별첨: figures/fig-1-system-architecture.pptx)'),
          emptyLine(),
          multiRunParagraph([
            { text: '클라이언트 계층: ', bold: true },
            { text: '사용자가 REST API(HTTP 요청으로 데이터를 주고받는 웹 표준 방식)를 통해 LLM 요청을 보내고, 처리 상태를 조회하는 부분이다.' }
          ]),
          multiRunParagraph([
            { text: 'API 계층: ', bold: true },
            { text: 'Express.js [9] 기반의 HTTP 서버로, 요청 접수, 스케줄러 전환, 통계 조회 등의 기능을 제공한다. ' +
              '사용자의 요청을 받아서 요청 우선순위와 사용자 등급 정보를 포함한 요청 객체를 생성하고, 이를 스케줄러에 전달하는 역할을 한다.' }
          ]),
          multiRunParagraph([
            { text: '스케줄러 계층: ', bold: true },
            { text: '시스템의 핵심 부분으로, 네 가지 스케줄링 알고리즘이 구현되어 있다. 모든 알고리즘은 같은 ' +
              '인터페이스(enqueue, dequeue)를 따르기 때문에, 서버 시작 시 환경변수 하나로 알고리즘을 선택할 수 있다. ' +
              '사용자 등급에 따른 가중치 결정도 스케줄러 계층에서 처리한다.' }
          ]),
          multiRunParagraph([
            { text: '저장소 계층: ', bold: true },
            { text: '메모리 배열로 요청 대기열을 관리하고, JSON 파일로 처리 이력을 기록한다. LLM 호출은 ' +
              'Ollama [8]를 통해 로컬에서 수행한다.' }
          ]),
          emptyLine(),
          figureCaption('[그림 2] 모듈 구조도 (별첨: figures/fig-2-module-structure.pptx)'),
          emptyLine(),

          // 3.3 설계 방침
          heading2('3.3 설계 방침'),
          textParagraph(
            '스케줄링 알고리즘을 LLM 환경에 그대로 적용할 수는 없으므로, 다음과 같은 설계 방침을 정하였다.'
          ),
          textParagraph(
            '첫째, LLM 추론은 한번 시작되면 중간에 멈추기 어렵기 때문에, 실제 서버에서는 비선점형 방식을 사용한다. ' +
            '스케줄러는 대기열에서 다음 요청을 선택하는 시점에만 알고리즘을 적용하고, 이미 처리 중인 요청은 완료될 때까지 기다린다.'
          ),
          textParagraph(
            '다만 MLFQ의 경우, 비선점형으로 운영하면 짧은 요청을 우선 처리하는 핵심 효과가 나타나지 않는다는 것을 ' +
            '기본 실험에서 확인하였다 (5.2절 참조). 비선점형에서는 요청이 중단 없이 끝까지 처리되므로, 큐 간 이동이 ' +
            '의미가 없기 때문이다. 이에 따라 MLFQ의 이론적 효과를 검증하기 위해, 시뮬레이션 환경에서 선점형 모드를 ' +
            '추가 구현하였다. 시뮬레이션에서는 500ms 간격의 타임 슬라이스로 요청 상태를 확인하고, 시간 할당량을 초과한 ' +
            '요청은 처리를 중단하여 하위 큐로 이동시킨 뒤, 상위 큐의 다음 요청을 먼저 처리하는 방식이다. 이 선점형 ' +
            '실험의 결과는 5.3절에서 다룬다.'
          ),

          // 등급 체계 설명 (v5에서 추가된 표 2)
          textParagraph(
            '둘째, 시스템에서 사용하는 등급 체계는 두 가지이며, 각각 다른 스케줄러에서 사용된다 (표 2).'
          ),
          tableCaption('표 2. 등급 체계 비교'),
          new Table({
            columnWidths: [1500, 3500, 4000],
            rows: [
              new TableRow({ children: [
                cell('구분', { bold: true, shading: COLOR_HEADER_BG, width: 1500, align: AlignmentType.CENTER }),
                cell('요청 우선순위', { bold: true, shading: COLOR_HEADER_BG, width: 3500, align: AlignmentType.CENTER }),
                cell('사용자 등급', { bold: true, shading: COLOR_HEADER_BG, width: 4000, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('적용 대상', { width: 1500 }),
                cell('개별 요청', { width: 3500 }),
                cell('사용자(테넌트)', { width: 4000 })
              ]}),
              new TableRow({ children: [
                cell('등급', { width: 1500 }),
                cell('URGENT, HIGH, NORMAL, LOW', { width: 3500 }),
                cell('Enterprise, Premium, Standard, Free', { width: 4000 })
              ]}),
              new TableRow({ children: [
                cell('성격', { width: 1500 }),
                cell('요청마다 다를 수 있음', { width: 3500 }),
                cell('사용자에게 고정', { width: 4000 })
              ]}),
              new TableRow({ children: [
                cell('사용처', { width: 1500 }),
                cell('Priority Scheduling', { width: 3500 }),
                cell('WFQ', { width: 4000 })
              ]})
            ]
          }),
          emptyLine(),
          textParagraph(
            '요청 우선순위는 "이 요청이 얼마나 급한가"를 나타내고, 사용자 등급은 "이 사용자가 얼마만큼의 자원을 받을 ' +
            '자격이 있는가"를 나타낸다. 두 개념은 독립적이므로, Enterprise 등급 사용자가 LOW 우선순위 요청을 보내는 것도 ' +
            '가능하다. FCFS와 MLFQ는 이러한 등급과 무관하게 동작한다.'
          ),
          textParagraph(
            '별도로, 호출 빈도 제한(Rate Limiting)은 스케줄링 알고리즘이 아니라 요청 진입을 관리하는 전처리 단계이다. ' +
            '등급 구분 없이 모든 요청에 동일한 토큰 버킷(일정 시간마다 요청 권한이 생기고, 권한이 없으면 요청이 ' +
            '거부되는 방식)을 적용한다.'
          ),
          multiRunParagraph([
            { text: '셋째, 각 알고리즘의 핵심 원리는 유지하면서 스케줄링 기준은 LLM 환경에 맞게 조정하였다.', bold: true }
          ]),
          bulletItemBold(
            'Priority Scheduling: ',
            '요청 우선순위(URGENT, HIGH, NORMAL, LOW)에 따라 긴급한 요청을 먼저 처리한다. 제안서에서는 사용자 등급을 ' +
            '우선순위로 사용하도록 계획하였으나, 요청별 긴급도를 기준으로 변경하여 우선순위 스케줄링의 본래 목적을 더 ' +
            '명확히 보여줄 수 있도록 하였다. 오래 기다린 요청의 우선순위를 높여주는 에이징(Aging) 기법도 구현하였다. ' +
            '에이징은 5초마다 적용되는데, 기본 실험에서는 요청당 처리 시간이 10~100ms로 짧아 전체 처리가 약 5.5초 안에 ' +
            '끝났다. 이 때문에 에이징이 적용될 수 있는 시점에는 이미 대부분의 요청이 처리된 후여서, 실질적인 에이징 ' +
            '효과는 관측되지 않았다.'
          ),
          bulletItemBold(
            'MLFQ: ',
            '4단계 큐(Q0~Q3)를 두고, 큐별로 다른 시간 할당량을 적용한다. 새 요청은 Q0에 들어가고, 시간 할당량을 ' +
            '초과하면 하위 큐로 내려간다. 제안서에서는 사용자의 최근 평균 추론 시간을 기준으로 큐를 재배정하는 비선점형 ' +
            '방식을 계획하였으나, 구현 과정에서 OSTEP 교과서 [4]의 표준 MLFQ 규칙을 따르는 것이 알고리즘의 특성을 더 ' +
            '명확하게 비교할 수 있다고 판단하여 변경하였다.'
          ),
          bulletItemBold(
            'WFQ: ',
            '사용자 등급(Enterprise, Premium, Standard, Free)에 따라 가중치(100, 50, 10, 1)를 부여하고, 가중치에 비례한 ' +
            '가상 완료 시각을 계산하여 서비스를 차등 제공한다.'
          ),
          emptyLine(),

          // 3.4 데이터 처리 흐름
          heading2('3.4 데이터 처리 흐름'),
          textParagraph('사용자가 요청을 보내면 다음 순서로 처리된다 (그림 3).'),
          emptyLine(),
          figureCaption('[그림 3] 데이터 흐름도 (별첨: figures/fig-3-data-flow.pptx)'),
          emptyLine(),
          numberedItem('사용자가 REST API(POST /api/requests)로 요청을 보낸다.'),
          numberedItem('API 계층에서 입력을 확인한 뒤, 요청 객체를 만들어 스케줄러에 전달한다.'),
          numberedItem('스케줄러는 선택된 알고리즘에 따라 대기열에서 다음 요청을 결정한다.'),
          numberedItem('선택된 요청을 Ollama를 통해 LLM에 전달하고, 응답을 기다린다.'),
          numberedItem('LLM 응답이 돌아오면 결과를 사용자에게 전달하고, 처리 이력을 JSON 파일에 기록한다.'),
          numberedItem('스케줄러는 다음 요청을 꺼내 같은 과정을 반복한다.'),

          // ====================================================
          // 4. 구현 현황
          // ====================================================
          new Paragraph({ children: [new PageBreak()] }),
          heading1('4. 구현 현황'),

          // 4.1 기술 스택
          heading2('4.1 기술 스택'),
          tableCaption('표 3. 기술 스택'),
          new Table({
            columnWidths: [2000, 3000, 4000],
            rows: [
              new TableRow({ children: [
                cell('항목', { bold: true, shading: COLOR_HEADER_BG, width: 2000, align: AlignmentType.CENTER }),
                cell('기술/도구', { bold: true, shading: COLOR_HEADER_BG, width: 3000, align: AlignmentType.CENTER }),
                cell('설명', { bold: true, shading: COLOR_HEADER_BG, width: 4000, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('런타임', { width: 2000 }),
                cell('Node.js 22 LTS [10]', { width: 3000 }),
                cell('JavaScript 실행 환경', { width: 4000 })
              ]}),
              new TableRow({ children: [
                cell('프레임워크', { width: 2000 }),
                cell('Express.js 4.18 [9]', { width: 3000 }),
                cell('REST API 서버', { width: 4000 })
              ]}),
              new TableRow({ children: [
                cell('언어', { width: 2000 }),
                cell('JavaScript (ES2024)', { width: 3000 }),
                cell('서버 및 스케줄러 구현 언어', { width: 4000 })
              ]}),
              new TableRow({ children: [
                cell('LLM', { width: 2000 }),
                cell('Ollama (로컬) [8]', { width: 3000 }),
                cell('로컬에서 REST API로 LLM을 호출할 수 있는 도구', { width: 4000 })
              ]}),
              new TableRow({ children: [
                cell('저장소', { width: 2000 }),
                cell('메모리 배열 + JSON 파일', { width: 3000 }),
                cell('외부 데이터베이스 없이 구현', { width: 4000 })
              ]}),
              new TableRow({ children: [
                cell('의존성', { width: 2000 }),
                cell('1개 (express)', { width: 3000 }),
                cell('최소 의존성 원칙, UUID는 Node.js 내장 모듈 사용', { width: 4000 })
              ]})
            ]
          }),
          emptyLine(),
          textParagraph(
            '외부 라이브러리를 최소한으로 사용하고, 스케줄링 알고리즘을 직접 구현하여 학습 효과를 높이는 것을 ' +
            '목표로 하였다.'
          ),

          // 4.2 코드 구조
          heading2('4.2 코드 구조'),
          textParagraph('의사코드 1. 코드 디렉터리 구조', { runOptions: { bold: true, italics: true } }),
          ...codeBlock([
            'src-simple/                    (주요 파일만 표시)',
            '\u251C\u2500\u2500 api/',
            '\u2502   \u2514\u2500\u2500 routes.js          # REST API \uC5D4\uB4DC\uD3EC\uC778\uD2B8 \uC815\uC758',
            '\u251C\u2500\u2500 schedulers/',
            '\u2502   \u251C\u2500\u2500 BaseScheduler.js   # \uAE30\uBCF8 \uC2A4\uCF00\uC904\uB7EC (\uACF5\uD1B5 \uC778\uD130\uD398\uC774\uC2A4)',
            '\u2502   \u251C\u2500\u2500 FCFSScheduler.js   # \uC120\uCC29\uC21C \uC2A4\uCF00\uC904\uB7EC',
            '\u2502   \u251C\u2500\u2500 PriorityScheduler.js  # \uC6B0\uC120\uC21C\uC704 \uC2A4\uCF00\uC904\uB7EC (\uC5D0\uC774\uC9D5 \uD3EC\uD568)',
            '\u2502   \u251C\u2500\u2500 MLFQScheduler.js   # \uB2E4\uB2E8\uACC4 \uD53C\uB4DC\uBC31 \uD050 \uC2A4\uCF00\uC904\uB7EC',
            '\u2502   \u2514\u2500\u2500 WFQScheduler.js    # \uAC00\uC911\uCE58 \uACF5\uC815 \uD050\uC789 \uC2A4\uCF00\uC904\uB7EC',
            '\u251C\u2500\u2500 queue/',
            '\u2502   \u2514\u2500\u2500 MemoryQueue.js     # \uBA54\uBAA8\uB9AC \uBC30\uC5F4 \uAE30\uBC18 \uD050',
            '\u251C\u2500\u2500 storage/',
            '\u2502   \u2514\u2500\u2500 JSONStore.js       # JSON \uD30C\uC77C \uC800\uC7A5\uC18C',
            '\u251C\u2500\u2500 llm/',
            '\u2502   \u2514\u2500\u2500 OllamaClient.js   # Ollama API \uC5F0\uACB0',
            '\u2514\u2500\u2500 server.js              # Express \uC11C\uBC84 \uC9C4\uC785\uC810'
          ]),
          emptyLine(),
          textParagraph(
            '모든 스케줄러는 BaseScheduler를 상속받아 enqueue()와 dequeue() 메서드를 구현한다. enqueue(request)는 ' +
            '요청 객체를 대기열에 삽입하고, dequeue()는 알고리즘에 따라 다음에 처리할 요청을 선택하여 반환한다. ' +
            '이렇게 같은 인터페이스를 사용하기 때문에, 서버 코드에서 스케줄러를 바꿀 때 다른 부분을 수정할 필요가 없다.'
          ),

          // 4.3 핵심 알고리즘 구현
          heading2('4.3 핵심 알고리즘 구현'),
          textParagraph(
            '4개 알고리즘 중 FCFS와 Priority는 구현이 단순하므로, 여기서는 상대적으로 복잡한 MLFQ와 WFQ의 핵심 동작만 설명한다.'
          ),

          // MLFQ 선점 처리
          heading3('MLFQ 선점 처리'),
          textParagraph(
            'MLFQ의 핵심은 짧은 요청을 빠르게 처리하고, 긴 요청은 낮은 우선순위로 내리는 것이다. ' +
            '아래는 선점 처리의 의사코드이다.'
          ),
          textParagraph('의사코드 2. MLFQ 선점 처리 흐름', { runOptions: { bold: true, italics: true } }),
          ...codeBlock([
            '함수 processNextRequest():',
            '    request = 가장 높은 비어있지 않은 큐에서 꺼냄',
            '    처리 시작(request)',
            '',
            '    매 500ms마다:',
            '        경과시간 = 현재시각 - 시작시각 + 이전 사용시간',
            '        할당량 = TIME_QUANTUM[request의 큐 레벨]',
            '',
            '        만약 경과시간 >= 할당량 이고 할당량이 무한이 아니면:',
            '            request의 큐 레벨을 한 단계 낮춤  // 하위 큐로 이동',
            '            request의 사용시간 = 0            // 새 큐에서 시간 초기화',
            '            해당 큐에 다시 넣음',
            '            processNextRequest()  // 다음 요청 처리',
            '        아니면:',
            '            계속 처리'
          ]),
          emptyLine(),
          textParagraph(
            '위 의사코드에서 보듯이, 선점이 발생하면 해당 요청의 사용 시간은 0으로 리셋된다. 큐별로 독립된 시간 ' +
            '할당량이 적용되어, Q0에서 1,000ms를 쓴 요청이 Q1로 내려가면 Q1의 3,000ms를 새로 받는 방식이다.'
          ),
          textParagraph('MLFQ는 OSTEP 교과서 [4]에서 정리한 5가지 규칙을 따른다.'),
          emptyLine(),

          // 표 4: MLFQ 규칙
          tableCaption('표 4. MLFQ 규칙'),
          new Table({
            columnWidths: [1500, 7500],
            rows: [
              new TableRow({ children: [
                cell('규칙', { bold: true, shading: COLOR_HEADER_BG, width: 1500, align: AlignmentType.CENTER }),
                cell('설명', { bold: true, shading: COLOR_HEADER_BG, width: 7500, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('Rule 1', { width: 1500, align: AlignmentType.CENTER }),
                cell('높은 큐의 요청이 낮은 큐보다 먼저 처리된다', { width: 7500 })
              ]}),
              new TableRow({ children: [
                cell('Rule 2', { width: 1500, align: AlignmentType.CENTER }),
                cell('같은 큐 안에서는 도착 순서대로 처리한다', { width: 7500 })
              ]}),
              new TableRow({ children: [
                cell('Rule 3', { width: 1500, align: AlignmentType.CENTER }),
                cell('새 요청은 항상 최상위 큐(Q0)에 들어간다', { width: 7500 })
              ]}),
              new TableRow({ children: [
                cell('Rule 4', { width: 1500, align: AlignmentType.CENTER }),
                cell('시간 할당량을 다 쓰면 한 단계 아래 큐로 내려간다', { width: 7500 })
              ]}),
              new TableRow({ children: [
                cell('Rule 5', { width: 1500, align: AlignmentType.CENTER }),
                cell('일정 시간마다 모든 요청을 Q0로 올려준다 (기아 방지)', { width: 7500 })
              ]})
            ]
          }),
          emptyLine(),

          // 표 5: MLFQ 큐별 시간 할당량
          tableCaption('표 5. MLFQ 큐별 시간 할당량'),
          new Table({
            columnWidths: [2000, 3500, 3500],
            rows: [
              new TableRow({ children: [
                cell('큐 레벨', { bold: true, shading: COLOR_HEADER_BG, width: 2000, align: AlignmentType.CENTER }),
                cell('시간 할당량', { bold: true, shading: COLOR_HEADER_BG, width: 3500, align: AlignmentType.CENTER }),
                cell('대상', { bold: true, shading: COLOR_HEADER_BG, width: 3500, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('Q0 (최상위)', { width: 2000, align: AlignmentType.CENTER }),
                cell('1,000ms', { width: 3500, align: AlignmentType.CENTER }),
                cell('새로 들어온 요청 (짧은 요청)', { width: 3500 })
              ]}),
              new TableRow({ children: [
                cell('Q1', { width: 2000, align: AlignmentType.CENTER }),
                cell('3,000ms', { width: 3500, align: AlignmentType.CENTER }),
                cell('중간 길이 요청', { width: 3500 })
              ]}),
              new TableRow({ children: [
                cell('Q2', { width: 2000, align: AlignmentType.CENTER }),
                cell('8,000ms', { width: 3500, align: AlignmentType.CENTER }),
                cell('긴 요청', { width: 3500 })
              ]}),
              new TableRow({ children: [
                cell('Q3 (최하위)', { width: 2000, align: AlignmentType.CENTER }),
                cell('무제한', { width: 3500, align: AlignmentType.CENTER }),
                cell('아주 긴 요청', { width: 3500 })
              ]})
            ]
          }),
          emptyLine(),
          textParagraph(
            'Rule 5의 부스팅(Boosting)은 5초마다 모든 요청을 최상위 큐(Q0)로 올려주는 것으로, 하위 큐에 오래 머물러 있는 요청이 영원히 ' +
            '처리되지 못하는 것을 방지한다. 네 가지 알고리즘의 동작 방식을 그림 4에 정리하였다.'
          ),
          emptyLine(),
          figureCaption('[그림 4] 스케줄링 알고리즘 비교 (별첨: figures/fig-4-scheduling-comparison.pptx)'),
          emptyLine(),

          // WFQ 가상 완료 시각 계산
          heading3('WFQ 가상 완료 시각 계산'),
          textParagraph(
            'WFQ에서는 각 요청의 가상 완료 시각(Virtual Finish Time, VFT)을 계산하여 이 값이 가장 작은 요청을 ' +
            '먼저 처리한다. VFT는 다음과 같이 계산된다.'
          ),
          textParagraph(
            'VFT_i = VFT_(i-1) + 1 / 가중치', {
            runOptions: { italics: true }
          }),
          textParagraph(
            '여기서 처리 비용은 요청 1건당 1로 고정하였다. LLM 응답의 출력 토큰 수는 생성이 완료되기 전까지 알 수 없고, ' +
            '입력 토큰만으로는 실제 자원 소모를 정확히 반영하기 어렵다. 또한 공정성 측정(JFI)도 처리 건수 기준이므로, ' +
            '스케줄링과 측정의 기준을 요청 건수로 일치시켰다.'
          ),
          textParagraph(
            '가중치가 큰 사용자는 VFT가 느리게 증가하므로, 더 자주 선택되어 더 많은 자원을 받게 된다. ' +
            '예를 들어, Enterprise(가중치 100)와 Free(가중치 1)가 요청을 동시에 보내면, ' +
            'Enterprise의 VFT 증가분은 1/100 = 0.01이고 Free는 1/1 = 1이 되어, Enterprise의 요청이 먼저 처리된다. ' +
            '이를 통해 가중치에 비례한 서비스가 이루어진다.'
          ),

          // 4.4 구현 결과 요약
          heading2('4.4 구현 결과 요약'),
          textParagraph(
            '현재까지 핵심 기능을 구현하고 테스트를 완료하였다.'
          ),
          bulletItemBold('스케줄러: ', '4개 알고리즘 모두 동작 확인 (FCFS, Priority, MLFQ, WFQ)'),
          bulletItemBold('테스트: ', '각 스케줄러별 단위 테스트를 작성하여 정상 동작을 확인하였다'),
          bulletItemBold('알고리즘 선택: ', '서버 시작 시 환경변수(SCHEDULER_TYPE)로 스케줄링 알고리즘을 선택할 수 있다'),

          // ====================================================
          // 5. 중간 실험 결과
          // ====================================================
          new Paragraph({ children: [new PageBreak()] }),
          heading1('5. 중간 실험 결과'),

          // 5.1 실험 환경
          heading2('5.1 실험 환경'),
          textParagraph(
            '모든 실험은 실제 LLM을 호출하지 않는 시간 기반 시뮬레이션 방식으로 수행하였다. 각 요청에 처리 시간을 ' +
            '미리 지정하고, 스케줄러가 선택한 순서대로 한 건씩 순차 처리하는 방식이다. 이렇게 하면 네트워크 지연이나 ' +
            'LLM 상태에 따른 변동 없이, 알고리즘 자체의 스케줄링 특성만 비교할 수 있다.'
          ),

          // 표 6: 실험 설정 비교
          tableCaption('표 6. 실험 설정 비교'),
          new Table({
            columnWidths: [2000, 3500, 3500],
            rows: [
              new TableRow({ children: [
                cell('항목', { bold: true, shading: COLOR_HEADER_BG, width: 2000, align: AlignmentType.CENTER }),
                cell('기본 실험', { bold: true, shading: COLOR_HEADER_BG, width: 3500, align: AlignmentType.CENTER }),
                cell('추가 실험 (다중 시드)', { bold: true, shading: COLOR_HEADER_BG, width: 3500, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('목적', { width: 2000 }),
                cell('4개 알고리즘 동일 조건 비교', { width: 3500 }),
                cell('MLFQ 선점형 효과 검증', { width: 3500 })
              ]}),
              new TableRow({ children: [
                cell('요청 수', { width: 2000 }),
                cell('100건', { width: 3500, align: AlignmentType.CENTER }),
                cell('500건 \u00D7 5회 반복', { width: 3500, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('사용자 수', { width: 2000 }),
                cell('4명 (등급별 1명)', { width: 3500, align: AlignmentType.CENTER }),
                cell('구분 없음', { width: 3500, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('사용자 등급', { width: 2000 }),
                cell('Enterprise, Premium, Standard, Free', { width: 3500 }),
                cell('해당 없음', { width: 3500, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('요청 할당', { width: 2000 }),
                cell('사용자에게 라운드 로빈', { width: 3500 }),
                cell('해당 없음', { width: 3500, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('우선순위 분포', { width: 2000 }),
                cell('LOW 30%, NORMAL 40%, HIGH 20%, URGENT 10%', { width: 3500 }),
                cell('해당 없음', { width: 3500, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('처리 시간', { width: 2000 }),
                cell('10~100ms (균일 랜덤)', { width: 3500 }),
                cell('Short 100~800ms, Medium 1.2~4초, Long 5~10초', { width: 3500 })
              ]}),
              new TableRow({ children: [
                cell('도착 패턴', { width: 2000 }),
                cell('순차 도착 (고정 5ms 간격)', { width: 3500 }),
                cell('버스트 도착 (20건 동시 \u00D7 25회, 2초 간격)', { width: 3500 })
              ]}),
              new TableRow({ children: [
                cell('처리 방식', { width: 2000 }),
                cell('순차 처리 (한 번에 1건)', { width: 3500, align: AlignmentType.CENTER }),
                cell('순차 처리 (한 번에 1건)', { width: 3500, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('MLFQ 모드', { width: 2000 }),
                cell('비선점형', { width: 3500, align: AlignmentType.CENTER }),
                cell('선점형 (타임 슬라이스 500ms)', { width: 3500, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('재현성', { width: 2000 }),
                cell('고정 시드 1개', { width: 3500, align: AlignmentType.CENTER }),
                cell('5개 랜덤 시드', { width: 3500, align: AlignmentType.CENTER })
              ]})
            ]
          }),
          emptyLine(),
          textParagraph(
            '기본 실험은 네 가지 알고리즘을 동일 조건에서 비교하기 위한 것이고, 추가 실험은 5.2절에서 비선점형 ' +
            'MLFQ가 FCFS와 동일한 결과를 보인 뒤, 선점형 MLFQ의 효과를 검증하기 위해 설계하였다.'
          ),

          // 5.2 기본 실험 결과
          heading2('5.2 기본 실험 결과 (100건)'),
          textParagraph('네 가지 알고리즘을 같은 100건 요청에 대해 실행한 결과는 표 7과 같다.'),

          // 표 7: 알고리즘별 성능 비교
          tableCaption('표 7. 알고리즘별 성능 비교 (100건)'),
          new Table({
            columnWidths: [1500, 2000, 2000, 3500],
            rows: [
              new TableRow({ children: [
                cell('스케줄러', { bold: true, shading: COLOR_HEADER_BG, width: 1500, align: AlignmentType.CENTER }),
                cell('평균 대기시간', { bold: true, shading: COLOR_HEADER_BG, width: 2000, align: AlignmentType.CENTER }),
                cell('처리량(req/s)', { bold: true, shading: COLOR_HEADER_BG, width: 2000, align: AlignmentType.CENTER }),
                cell('핵심 발견', { bold: true, shading: COLOR_HEADER_BG, width: 3500, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('FCFS', { width: 1500, align: AlignmentType.CENTER }),
                cell('2,572ms', { width: 2000, align: AlignmentType.CENTER }),
                cell('18.0', { width: 2000, align: AlignmentType.CENTER }),
                cell('베이스라인 (도착 순서 처리)', { width: 3500 })
              ]}),
              new TableRow({ children: [
                cell('Priority', { width: 1500, align: AlignmentType.CENTER }),
                cell('2,677ms', { width: 2000, align: AlignmentType.CENTER }),
                cell('17.1', { width: 2000, align: AlignmentType.CENTER }),
                cell('URGENT: 약 42ms, LOW: 약 4,579ms', { width: 3500 })
              ]}),
              new TableRow({ children: [
                cell('MLFQ', { width: 1500, align: AlignmentType.CENTER }),
                cell('2,572ms', { width: 2000, align: AlignmentType.CENTER }),
                cell('18.0', { width: 2000, align: AlignmentType.CENTER }),
                cell('비선점형에서는 FCFS와 동일', { width: 3500 })
              ]}),
              new TableRow({ children: [
                cell('WFQ', { width: 1500, align: AlignmentType.CENTER }),
                cell('2,476ms', { width: 2000, align: AlignmentType.CENTER }),
                cell('18.0', { width: 2000, align: AlignmentType.CENTER }),
                cell('Enterprise: 429ms, Free: 4,543ms', { width: 3500 })
              ]})
            ]
          }),
          emptyLine(),

          multiRunParagraph([
            { text: 'Priority Scheduling: ', bold: true },
            { text: '우선순위에 따른 대기시간 차이가 뚜렷하게 나타났다. URGENT 요청은 전체의 10%에 불과하고 가장 먼저 ' +
              '처리되므로 평균 약 42ms로 거의 즉시 처리된 반면, LOW 요청은 약 4,579ms로 FCFS 평균(2,572ms)보다 크게 ' +
              '늘어났다. 전체 평균 대기시간(2,677ms)이 FCFS(2,572ms)보다 약간 높은 것은, 높은 우선순위 요청을 먼저 ' +
              '처리한 만큼 낮은 우선순위 요청의 대기시간이 길어지기 때문이다. 처리량(17.1 req/s)도 FCFS(18.0 req/s)보다 ' +
              '약간 낮은데, 나중에 도착한 높은 우선순위 요청을 먼저 처리하면서 중간에 짧은 유휴 시간이 발생하기 때문이다.' }
          ]),
          multiRunParagraph([
            { text: 'WFQ: ', bold: true },
            { text: 'Enterprise 등급 사용자(가중치 100)의 평균 대기시간은 429ms인 반면, ' +
              'Free 등급(가중치 1)은 4,543ms로 약 10배 차이가 나타났다. 가중치에 비례하여 서비스가 차등 ' +
              '제공되는 것을 확인하였다.' }
          ]),
          textParagraph(
            '2.3절에서 소개한 JFI로 공정성을 측정한 결과, WFQ의 시스템 수준 JFI는 0.32로 나타났다. ' +
            '이 값이 낮은 이유는, 이번 실험에서 4명의 사용자에게 각 25건씩 균등하게 요청을 배정했기 때문이다. ' +
            '가중치가 다른 사용자에게 같은 양의 요청을 배정하면, JFI 계산에서 불균형이 나타날 수밖에 없다. ' +
            '같은 등급 내에서는 대기시간 편차가 작아 등급 내 배분은 고르게 이루어졌다.'
          ),
          multiRunParagraph([
            { text: 'MLFQ: ', bold: true },
            { text: '비선점형 모드에서는 FCFS와 동일한 결과가 나왔다 (평균 대기시간 2,572ms, 처리량 18.0 req/s). ' +
              'MLFQ의 핵심인 "짧은 요청 우선 처리"는 실행 중인 요청을 중단하고 하위 큐로 보내는 선점 동작에 의존하는데, ' +
              '비선점형에서는 모든 요청이 중단 없이 완료되므로 큐 간 이동이 발생하지 않기 때문이다. ' +
              '이 결과는 3.3절에서 언급한 선점형 시뮬레이션을 추가 구현하게 된 직접적인 계기이다.' }
          ]),

          // 5.3 MLFQ 선점형 실험 결과
          heading2('5.3 MLFQ 선점형 실험 결과'),
          textParagraph(
            '5.2절에서 비선점형 MLFQ가 FCFS와 동일한 결과를 보임에 따라, MLFQ의 이론적 효과를 검증하기 위해 ' +
            '5.1절에서 설명한 시뮬레이션 환경에서 선점형 실험을 추가로 수행하였다. 같은 결과가 나오는지 확인하기 위해 ' +
            '조건을 바꿔 여러 번 반복하였다. 추가 실험은 기본 실험보다 요청 수가 많고, 요청당 처리 시간도 최대 10초' +
            '(기본 실험 최대 100ms의 100배)로 크게 늘어났으며, 버스트 도착 구조이므로 전체 대기시간 자체는 크게 길어졌다.'
          ),

          // 표 8: MLFQ 선점형 vs FCFS
          tableCaption('표 8. MLFQ 선점형 vs FCFS 비교 (짧은 요청 기준)'),
          new Table({
            columnWidths: [3500, 2750, 2750],
            rows: [
              new TableRow({ children: [
                cell('항목', { bold: true, shading: COLOR_HEADER_BG, width: 3500, align: AlignmentType.CENTER }),
                cell('FCFS', { bold: true, shading: COLOR_HEADER_BG, width: 2750, align: AlignmentType.CENTER }),
                cell('MLFQ (선점형)', { bold: true, shading: COLOR_HEADER_BG, width: 2750, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('짧은 요청 평균 대기시간', { width: 3500 }),
                cell('약 635초', { width: 2750, align: AlignmentType.CENTER }),
                cell('약 170초', { width: 2750, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('짧은 요청 개선율', { width: 3500 }),
                cell('-', { width: 2750, align: AlignmentType.CENTER }),
                cell('약 73% 감소', { width: 2750, align: AlignmentType.CENTER })
              ]})
            ]
          }),
          emptyLine(),
          figureCaption('[그림 5] 실험 결과 차트 (별첨: figures/fig-5-experiment-results.pptx)'),
          emptyLine(),

          textParagraph(
            '선점형 MLFQ에서 짧은 요청의 대기시간이 FCFS 대비 약 73% 줄어든 것을 확인하였다. 여러 번 반복해도 ' +
            '비슷한 결과가 나와, 한 번만의 결과가 아니라는 것을 확인하였다.'
          ),
          textParagraph(
            '반면, 긴 요청의 대기시간은 MLFQ에서 더 늘어났는데, 이는 짧은 요청을 먼저 처리하기 위해 긴 요청이 ' +
            '하위 큐로 밀려나기 때문이다. 이처럼 MLFQ는 짧은 요청의 응답 시간을 크게 개선하지만, 긴 요청에는 불리한 ' +
            '면이 있다. 다만 Rule 5의 부스팅이 주기적으로 작동하여, 긴 요청이 영원히 처리되지 않는 상황은 방지된다.'
          ),

          // ====================================================
          // 6. 향후 계획
          // ====================================================
          new Paragraph({ children: [new PageBreak()] }),
          heading1('6. 향후 계획'),
          textParagraph(
            '현재까지 네 가지 스케줄링 알고리즘의 기본 구현과 중간 실험을 완료하였다. 남은 학기 동안 다음 작업을 ' +
            '추가로 수행할 계획이다.'
          ),

          // 표 9: 남은 일정
          tableCaption('표 9. 남은 일정'),
          new Table({
            columnWidths: [2500, 4000, 2500],
            rows: [
              new TableRow({ children: [
                cell('기간', { bold: true, shading: COLOR_HEADER_BG, width: 2500, align: AlignmentType.CENTER }),
                cell('주요 활동', { bold: true, shading: COLOR_HEADER_BG, width: 4000, align: AlignmentType.CENTER }),
                cell('산출물', { bold: true, shading: COLOR_HEADER_BG, width: 2500, align: AlignmentType.CENTER })
              ]}),
              new TableRow({ children: [
                cell('4월 중순~4월 말', { width: 2500, align: AlignmentType.CENTER }),
                cell('실서버 실험 (Ollama), 실험 규모 확대', { width: 4000 }),
                cell('추가 실험 코드 및 데이터', { width: 2500 })
              ]}),
              new TableRow({ children: [
                cell('5월 초~5월 중순', { width: 2500, align: AlignmentType.CENTER }),
                cell('공정성 분석, 결과 정리, 최종보고서 작성', { width: 4000 }),
                cell('최종보고서', { width: 2500 })
              ]}),
              new TableRow({ children: [
                cell('5월 말', { width: 2500, align: AlignmentType.CENTER }),
                cell('발표 자료 준비, 시스템 데모 구성', { width: 4000 }),
                cell('발표 PPT, 데모', { width: 2500 })
              ]})
            ]
          }),
          emptyLine(),
          textParagraph('구체적으로는 다음을 계획하고 있다.'),
          numberedItemBold(
            '실서버 실험: ',
            '현재까지의 실험은 처리 시간을 미리 지정한 시뮬레이션으로 수행하였다. Ollama를 활용하여 실제 LLM을 호출하는 ' +
            '환경에서도 실험을 수행하고, 시뮬레이션 결과와 비교한다. 실서버에서는 추론 중단이 불가능하므로, 비선점형 ' +
            '스케줄러의 성능 차이를 중점적으로 분석한다.'
          ),
          numberedItemBold(
            '실험 규모 확대: ',
            '1,000건 이상의 요청으로 실험을 확대하고, 버스트 트래픽 등 다양한 시나리오를 추가한다. 알고리즘 간 차이가 ' +
            '일관되게 나타나는지도 확인한다.'
          ),
          numberedItemBold(
            '공정성 분석: ',
            'WFQ의 이중 JFI(시스템 수준, 등급 내 수준)를 활용한 공정성 분석을 더 자세히 진행하고, 알고리즘 간 공정성과 ' +
            '성능의 장단점을 비교한다.'
          ),
          numberedItemBold(
            '데모 시스템 구성: ',
            '최종 발표를 위한 실시간 데모 환경을 준비하여, 실제로 요청을 보내면서 알고리즘별 차이를 보여줄 수 있도록 한다.'
          ),

          // ====================================================
          // 참고문헌
          // ====================================================
          new Paragraph({ children: [new PageBreak()] }),
          heading1('참고문헌'),
          emptyLine(),
          textParagraph(
            '[1] OpenAI, "Rate limits," OpenAI API Documentation. Available: https://platform.openai.com/docs/guides/rate-limits'
          ),
          textParagraph(
            '[2] Anthropic, "Rate limits," Anthropic API Documentation. Available: https://docs.anthropic.com/en/api/rate-limits'
          ),
          textParagraph(
            '[3] A. Silberschatz, P. B. Galvin, and G. Gagne, "Operating System Concepts," 10th ed., Wiley, 2018. ' +
            'Available: https://www.os-book.com/'
          ),
          textParagraph(
            '[4] R. H. Arpaci-Dusseau and A. C. Arpaci-Dusseau, "Operating Systems: Three Easy Pieces," v1.10, ' +
            'Arpaci-Dusseau Books, 2023. Available: https://pages.cs.wisc.edu/~remzi/OSTEP/'
          ),
          textParagraph(
            '[5] J. F. Kurose and K. W. Ross, "Computer Networking: A Top-Down Approach," 9th ed., Pearson, 2025. ' +
            'Available: https://gaia.cs.umass.edu/kurose_ross/'
          ),
          textParagraph(
            '[6] vLLM Project, "vLLM: Easy, Fast, and Cheap LLM Serving." Available: https://docs.vllm.ai/'
          ),
          textParagraph(
            '[7] Hugging Face, "Text Generation Inference (TGI)." Available: https://huggingface.co/docs/text-generation-inference/'
          ),
          textParagraph(
            '[8] Ollama, "Ollama Documentation." Available: https://ollama.com/'
          ),
          textParagraph(
            '[9] Express.js, "Express - Node.js Web Application Framework." Available: https://expressjs.com/'
          ),
          textParagraph(
            '[10] Node.js Foundation, "Node.js Documentation." Available: https://nodejs.org/docs/latest-v22.x/api/'
          )
        ]
      }
    ]
  });

  // DOCX 생성 및 파일 저장
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, '..', 'final', 'midterm-report.docx');

  // final 디렉터리가 없으면 생성
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outPath, buffer);
  console.log('중간보고서 v5 DOCX 생성 완료:', outPath);
  console.log('파일 크기:', (buffer.length / 1024).toFixed(1) + ' KB');
}

generateMidtermReport().catch(err => {
  console.error('DOCX 생성 실패:', err);
  process.exit(1);
});
