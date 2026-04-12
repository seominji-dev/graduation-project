/**
 * Final Report DOCX Generator
 * Reads final-report-v3.md and generates 06-final-report/final/final-report.docx
 * Uses markdown-to-DOCX conversion approach for scalability
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  ImageRun
} = require('docx');

// ============================================================
// Style constants
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

// Figure number to actual filename mapping
const FIGURE_MAP = {
  1: 'fig-1-system-architecture.png',
  2: 'fig-2-data-flow.png',
  3: 'fig-3-avg-wait-time.png',
  4: 'fig-4-mlfq-vs-fcfs.png',
  5: 'fig-5-ollama-tier.png',
  6: 'fig-6-jfi-comparison.png',
  7: 'fig-7-algo-table.png',
  8: 'fig-8-algo-concepts.png',
  9: 'fig-9-experiment-setup.png',
};

// Figures directory path
const FIGURES_DIR = path.resolve(__dirname, '..', 'figures');

// ============================================================
// Helper functions
// ============================================================

/** Create TextRun objects by parsing **bold** markers in a string */
function parseInlineRuns(text, baseOpts = {}) {
  const runs = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({
        text: part.slice(2, -2),
        font: FONT,
        size: 22,
        color: COLOR_BLACK,
        bold: true,
        ...baseOpts
      }));
    } else if (part.length > 0) {
      runs.push(new TextRun({
        text: part,
        font: FONT,
        size: 22,
        color: COLOR_BLACK,
        ...baseOpts
      }));
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text: '', font: FONT, size: 22 })];
}

/** Plain text paragraph with optional options */
function textParagraph(text, options = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    ...options,
    children: parseInlineRuns(text, options.runOptions || {})
  });
}

/** Table cell helper */
function cell(content, opts = {}) {
  const children = typeof content === 'string'
    ? [new Paragraph({
        spacing: { before: 40, after: 40 },
        alignment: opts.align || AlignmentType.LEFT,
        children: parseInlineRuns(content, { bold: opts.bold || false, size: 20 })
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

/** Empty line */
function emptyLine() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

/** Heading 1 (14pt bold) */
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, font: FONT, size: 28, bold: true, color: COLOR_BLACK })]
  });
}

/** Heading 2 (12pt bold) */
function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 160 },
    children: [new TextRun({ text, font: FONT, size: 24, bold: true, color: COLOR_DARK })]
  });
}

/** Heading 3 (11pt bold) */
function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, font: FONT, size: 22, bold: true, color: COLOR_DARK })]
  });
}

/** Heading 4 */
function heading4(text) {
  return new Paragraph({
    spacing: { before: 160, after: 100 },
    children: [new TextRun({ text, font: FONT, size: 22, bold: true, color: COLOR_DARK })]
  });
}

/** Bullet list item */
function bulletItem(runs) {
  const children = typeof runs === 'string'
    ? parseInlineRuns(runs)
    : runs;
  return new Paragraph({
    numbering: { reference: 'bullet-list', level: 0 },
    spacing: { after: 80, line: 340 },
    children
  });
}

/** Numbered list item */
function numberedItem(runs) {
  const children = typeof runs === 'string'
    ? parseInlineRuns(runs)
    : runs;
  return new Paragraph({
    numbering: { reference: 'num-list', level: 0 },
    spacing: { after: 80, line: 340 },
    children
  });
}

/** Code block paragraph */
function codeParagraph(line) {
  return new Paragraph({
    spacing: { after: 0, line: 240 },
    indent: { left: 360 },
    children: [new TextRun({ text: line, font: CODE_FONT, size: 18, color: COLOR_DARK })]
  });
}

/** Figure caption */
function figureCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120, line: 360 },
    children: [new TextRun({ text, font: FONT, size: 20, italics: true, color: COLOR_GRAY })]
  });
}

/** Figure image insertion */
function figureImage(figNum) {
  const filename = FIGURE_MAP[figNum];
  if (!filename) {
    console.warn(`  [WARN] No mapping for figure ${figNum}`);
    return figureCaption(`[그림 ${figNum}: 파일 없음]`);
  }
  const filePath = path.join(FIGURES_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  [WARN] Figure file missing: ${filePath}`);
    return figureCaption(`[그림 ${figNum}: ${filename} 없음]`);
  }

  const imgData = fs.readFileSync(filePath);
  let imgW = 960, imgH = 540;
  if (imgData.length > 24 && imgData.toString('ascii', 1, 4) === 'PNG') {
    imgW = imgData.readUInt32BE(16);
    imgH = imgData.readUInt32BE(20);
  }

  // Max width ~15cm at 96DPI = 567px
  const maxW = 567;
  const scale = Math.min(maxW / imgW, 1);
  const widthPx = Math.round(imgW * scale);
  const heightPx = Math.round(imgH * scale);

  console.log(`  Inserting figure ${figNum}: ${filename} (${widthPx}x${heightPx})`);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 100 },
    children: [new ImageRun({ data: imgData, transformation: { width: widthPx, height: heightPx }, type: 'png' })]
  });
}

/** Table caption */
function tableCaption(text) {
  return new Paragraph({
    spacing: { after: 80, line: 360 },
    children: [new TextRun({ text, font: FONT, size: 22, bold: true, color: COLOR_BLACK })]
  });
}

/** Reference paragraph with hanging indent */
function referenceParagraph(text) {
  return new Paragraph({
    spacing: { after: 100, line: 360 },
    indent: { left: 480, hanging: 480 },
    children: parseInlineRuns(text)
  });
}

// ============================================================
// Markdown table parser
// ============================================================

/**
 * Parse markdown table lines into header and data rows
 * @param {string[]} lines - Array of | col | col | lines
 * @returns {{ headers: string[], rows: string[][] }}
 */
function parseMarkdownTable(lines) {
  const headers = [];
  const rows = [];
  let headerParsed = false;

  for (const line of lines) {
    if (!line.trim().startsWith('|')) continue;
    // Separator row (|---|---|)
    if (/^\s*\|[\s\-:]+\|/.test(line)) {
      headerParsed = true;
      continue;
    }
    const cols = line.split('|').slice(1, -1).map(c => c.trim());
    if (!headerParsed) {
      headers.push(...cols);
    } else {
      rows.push(cols);
    }
  }
  return { headers, rows };
}

/**
 * Build a docx Table from parsed markdown table
 * Equal-width columns distributed across page width (~7934 DXA = ~14cm usable)
 */
function buildTable(headers, rows) {
  const totalWidth = 7934;
  const colCount = headers.length;
  const colWidth = Math.floor(totalWidth / colCount);
  const widths = Array(colCount).fill(colWidth);

  const headerRow = new TableRow({
    children: headers.map((h, i) =>
      cell(h, { bold: true, shading: COLOR_HEADER_BG, width: widths[i], align: AlignmentType.CENTER })
    )
  });

  const dataRows = rows.map(cols =>
    new TableRow({
      children: cols.map((c, i) => cell(c || '', { width: widths[i] }))
    })
  );

  return new Table({ columnWidths: widths, rows: [headerRow, ...dataRows] });
}

// ============================================================
// Markdown parser → DOCX elements
// ============================================================

/**
 * Parse the markdown body (everything after the cover metadata)
 * and return an array of docx elements (Paragraph, Table, etc.)
 */
function parseMarkdownBody(mdText) {
  const lines = mdText.split('\n');
  const elements = [];
  let i = 0;

  // Pending table caption text
  let pendingTableCaption = null;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines (add spacing)
    if (trimmed === '') {
      i++;
      continue;
    }

    // Page break (---)
    if (trimmed === '---') {
      // Skip horizontal rules (section breaks handled by page breaks at headings)
      i++;
      continue;
    }

    // Heading 1: ## N. Chapter or ## 참고문헌
    if (/^## /.test(line)) {
      const text = line.replace(/^## /, '').trim();
      // Add page break before major sections (except very first)
      if (elements.length > 0) {
        elements.push(new Paragraph({ children: [new PageBreak()] }));
      }
      elements.push(heading1(text));
      i++;
      continue;
    }

    // Heading 2: ### N.N Section
    if (/^### /.test(line)) {
      const text = line.replace(/^### /, '').trim();
      elements.push(heading2(text));
      i++;
      continue;
    }

    // Heading 3: #### Subsection
    if (/^#### /.test(line)) {
      const text = line.replace(/^#### /, '').trim();
      elements.push(heading3(text));
      i++;
      continue;
    }

    // Figure reference: > **[그림 N] caption** (path)
    if (/^> \*\*\[그림\s*(\d+)\]/.test(trimmed)) {
      const match = trimmed.match(/^> \*\*\[그림\s*(\d+)\]\s*(.*?)\*\*/);
      const figNum = match ? parseInt(match[1]) : null;
      const caption = match ? `[그림 ${figNum}] ${match[2].trim()}` : trimmed;

      if (figNum) {
        console.log(`  Inserting figure ${figNum}...`);
        elements.push(emptyLine());
        elements.push(figureImage(figNum));
        elements.push(figureCaption(caption));
        elements.push(emptyLine());
      }
      i++;
      continue;
    }

    // Code block: ```
    if (trimmed.startsWith('```')) {
      i++; // skip opening ```
      const codeLines = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      for (const cl of codeLines) {
        elements.push(codeParagraph(cl));
      }
      elements.push(emptyLine());
      continue;
    }

    // Markdown table: line starting with |
    if (trimmed.startsWith('|')) {
      // Collect all consecutive table lines
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const { headers, rows } = parseMarkdownTable(tableLines);

      if (pendingTableCaption) {
        elements.push(tableCaption(pendingTableCaption));
        pendingTableCaption = null;
      }

      if (headers.length > 0) {
        elements.push(buildTable(headers, rows));
        elements.push(emptyLine());
      }
      continue;
    }

    // Table caption pattern: **표 N. title** (standalone bold line)
    // Must be on its own line and contain 표
    if (/^\*\*표\s+\d+/.test(trimmed) && !trimmed.includes('|')) {
      const caption = trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '');
      pendingTableCaption = caption;
      i++;
      continue;
    }

    // Numbered list: 1. item, 2. item, etc.
    if (/^\d+\.\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s/, '');
      elements.push(numberedItem(text));
      i++;
      continue;
    }

    // Bullet list: - item
    if (/^- /.test(trimmed)) {
      const text = trimmed.replace(/^- /, '');
      elements.push(bulletItem(text));
      i++;
      continue;
    }

    // Reference line: [N] text
    if (/^\[\d+\]/.test(trimmed)) {
      elements.push(referenceParagraph(trimmed));
      i++;
      continue;
    }

    // Formula line (contains ^ pattern for math-like text)
    if (trimmed.includes('^2') || trimmed.startsWith('JFI') || trimmed.startsWith('VFT')) {
      elements.push(new Paragraph({
        spacing: { after: 120, line: 360 },
        indent: { left: 360 },
        children: [new TextRun({ text: trimmed, font: FONT, size: 22, italics: true, color: COLOR_DARK })]
      }));
      i++;
      continue;
    }

    // Regular paragraph (may contain **bold** inline)
    // Flush pending table caption if no table follows
    if (pendingTableCaption) {
      elements.push(tableCaption(pendingTableCaption));
      pendingTableCaption = null;
    }
    elements.push(textParagraph(trimmed));
    i++;
  }

  return elements;
}

// ============================================================
// Cover page builder
// ============================================================

function buildCoverPage(meta) {
  return [
    emptyLine(), emptyLine(), emptyLine(), emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: '2026학년도 졸업프로젝트', font: FONT, size: 24, color: COLOR_GRAY })]
    }),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: '최 종 보 고 서', font: FONT, size: 44, bold: true, color: COLOR_BLACK })]
    }),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: '스케줄링 알고리즘을 활용한', font: FONT, size: 30, bold: true })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [new TextRun({ text: '다중 사용자 LLM API 요청 관리 시스템', font: FONT, size: 30, bold: true })]
    }),
    emptyLine(), emptyLine(), emptyLine(), emptyLine(),
    new Table({
      columnWidths: [2400, 4800],
      rows: [
        new TableRow({ children: [
          cell('학 과', { bold: true, shading: COLOR_HEADER_BG, width: 2400, align: AlignmentType.CENTER }),
          cell(meta.dept || '홍익대학교 컴퓨터공학과', { width: 4800 })
        ]}),
        new TableRow({ children: [
          cell('학 번', { bold: true, shading: COLOR_HEADER_BG, width: 2400, align: AlignmentType.CENTER }),
          cell(meta.studentId || 'C235180', { width: 4800 })
        ]}),
        new TableRow({ children: [
          cell('성 명', { bold: true, shading: COLOR_HEADER_BG, width: 2400, align: AlignmentType.CENTER }),
          cell(meta.name || '서민지', { width: 4800 })
        ]}),
        new TableRow({ children: [
          cell('지도교수', { bold: true, shading: COLOR_HEADER_BG, width: 2400, align: AlignmentType.CENTER }),
          cell(meta.advisor || '이장호 교수님', { width: 4800 })
        ]}),
        new TableRow({ children: [
          cell('제출일', { bold: true, shading: COLOR_HEADER_BG, width: 2400, align: AlignmentType.CENTER }),
          cell(meta.date || '2026년 5월 24일', { width: 4800 })
        ]})
      ]
    }),
    emptyLine(), emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: '2026년 5월', font: FONT, size: 22, color: COLOR_GRAY })]
    }),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '홍익대학교 컴퓨터공학과', font: FONT, size: 24, color: COLOR_GRAY })]
    })
  ];
}

// ============================================================
// Extract cover metadata from markdown
// ============================================================

function extractMetadata(mdText) {
  const meta = {};
  const deptMatch = mdText.match(/\*\*학과:\*\*\s*(.+)/);
  const idMatch = mdText.match(/\*\*학번:\*\*\s*(.+)/);
  const nameMatch = mdText.match(/\*\*성명:\*\*\s*(.+)/);
  const advisorMatch = mdText.match(/\*\*지도교수:\*\*\s*(.+)/);
  const dateMatch = mdText.match(/\*\*제출일:\*\*\s*(.+)/);

  if (deptMatch) meta.dept = deptMatch[1].trim();
  if (idMatch) meta.studentId = idMatch[1].trim();
  if (nameMatch) meta.name = nameMatch[1].trim();
  if (advisorMatch) meta.advisor = advisorMatch[1].trim();
  if (dateMatch) meta.date = dateMatch[1].trim();
  return meta;
}

// ============================================================
// Extract body: everything from ## 1. 서론 onward
// ============================================================

function extractBody(mdText) {
  // Find the first ## 1. heading
  const bodyStart = mdText.indexOf('\n## 1.');
  if (bodyStart === -1) {
    // Fall back to first ## heading after the cover
    const firstH2 = mdText.indexOf('\n## ');
    return firstH2 === -1 ? mdText : mdText.slice(firstH2 + 1);
  }
  return mdText.slice(bodyStart + 1);
}

// ============================================================
// Main document builder
// ============================================================

async function generateFinalReport() {
  const mdPath = path.resolve(__dirname, 'final-report-v3.md');
  const outDir = path.resolve(__dirname, '..', 'final');
  const outPath = path.join(outDir, 'final-report.docx');

  console.log('Reading markdown file...');
  const mdText = fs.readFileSync(mdPath, 'utf8');

  console.log('Extracting metadata...');
  const meta = extractMetadata(mdText);

  console.log('Parsing document body...');
  const bodyText = extractBody(mdText);
  const bodyElements = parseMarkdownBody(bodyText);
  console.log(`  Parsed ${bodyElements.length} elements`);

  console.log('Creating cover page...');
  const coverChildren = buildCoverPage(meta);

  console.log('Building DOCX document...');
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
      // Section 1: Cover page — no page numbers
      // ================================================================
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1728 } // left 3cm
          }
        },
        children: coverChildren
      },

      // ================================================================
      // Section 2: Body — page numbers starting at 1
      // ================================================================
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1728 },
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
        children: bodyElements
      }
    ]
  });

  // Create output directory if needed
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Packing DOCX...');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);

  const sizeKB = (buffer.length / 1024).toFixed(1);
  console.log(`\nDone! Output: ${outPath}`);
  console.log(`File size: ${sizeKB} KB`);

  if (buffer.length < 100 * 1024) {
    console.warn('[WARN] File size is below 100KB — check if all content was included');
  } else {
    console.log('[OK] File size looks reasonable for a 20-page report');
  }
}

generateFinalReport().catch(err => {
  console.error('DOCX generation failed:', err);
  process.exit(1);
});
