/**
 * Final Report DOCX Generator — Template-Based (byte-accurate baseline fidelity)
 *
 * Strategy: Open `260410 1128 midterm-report.docx` (user-approved baseline),
 *           preserve styles.xml / theme / fontTable / header1 / footer1 / settings verbatim,
 *           rewrite ONLY word/document.xml and word/media/* and word/_rels/document.xml.rels.
 *
 * All body paragraphs use the exact baseline fingerprint:
 *   <w:adjustRightInd w:val="0"/>
 *   <w:spacing w:after="120" w:line="240" w:lineRule="atLeast"/>
 *   <w:ind w:firstLineChars="100" w:firstLine="200"/>
 *   <w:jc w:val="both"/>
 *   runs with <w:sz w:val="20"/><w:szCs w:val="20"/>
 *
 * Headings reference baseline named styles via <w:pStyle w:val="1|2|3|4"/>.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const JSZip = require(path.join(__dirname, 'node_modules', 'jszip'));

// ============================================================
// Paths
// ============================================================
const BASELINE_PATH = path.resolve(
  __dirname, '..', '..', '05-midterm-report', 'final', '260410 1128 midterm-report.docx'
);
const MD_PATH = path.join(__dirname, 'final-report-v47.md');
const OUT_PATH = path.resolve(__dirname, '..', 'final', 'final-report.docx');
const FIGURES_DIR = path.resolve(__dirname, '..', 'figures');

const FIGURE_MAP = {
  1: 'fig-1-system-architecture.png',
  2: 'fig-2-data-flow.png',
  3: 'fig-3-module-structure.png',
  4: 'fig-4-ollama-tier.png',
};

// Keep baseline rId7 = image1.png, rId8 = image2.png. Add rId13-rId14 for image3-image4.
const FIGURE_RID = {
  1: 'rId7', 2: 'rId8', 3: 'rId13', 4: 'rId14',
};

// ============================================================
// Utilities
// ============================================================
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function needsPreserve(text) {
  return /^\s|\s$/.test(text) || text.includes('  ');
}

let _paraIdCounter = 0x20000000;
function paraId() {
  const v = (_paraIdCounter++).toString(16).toUpperCase().padStart(8, '0');
  return v.slice(0, 8);
}

function pngSize(buf) {
  let w = 960, h = 540;
  if (buf.length > 24 && buf.toString('ascii', 1, 4) === 'PNG') {
    w = buf.readUInt32BE(16);
    h = buf.readUInt32BE(20);
  }
  return { w, h };
}

function pxToEmu(px) { return Math.round(px * 9525); }

// ============================================================
// Inline run parser — parses **bold** markers
// ============================================================
function parseRuns(text) {
  const out = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  for (const p of parts) {
    if (!p) continue;
    if (p.startsWith('**') && p.endsWith('**')) {
      out.push({ text: p.slice(2, -2), bold: true });
    } else {
      out.push({ text: p, bold: false });
    }
  }
  return out.length ? out : [{ text: '', bold: false }];
}

function runsToXml(runs, { sz = 20, color = null, italic = false } = {}) {
  return runs.map(r => {
    const bits = [];
    if (r.bold) bits.push('<w:b/><w:bCs/>');
    if (italic) bits.push('<w:i/><w:iCs/>');
    if (color) bits.push(`<w:color w:val="${color}"/>`);
    bits.push(`<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`);
    const rpr = `<w:rPr>${bits.join('')}</w:rPr>`;
    const preserve = needsPreserve(r.text) ? ' xml:space="preserve"' : '';
    return `<w:r w:rsidRPr="00CE60DC">${rpr}<w:t${preserve}>${esc(r.text)}</w:t></w:r>`;
  }).join('');
}

// ============================================================
// Body paragraph — exact baseline fingerprint
// ============================================================
function bodyPara(text, extraOpts = {}) {
  const runs = typeof text === 'string' ? parseRuns(text) : text;
  return bodyParaRaw(runsToXml(runs, { sz: 20 }), extraOpts);
}

function bodyParaRaw(runsXml, { noIndent = false } = {}) {
  const indXml = noIndent
    ? ''
    : '<w:ind w:firstLineChars="100" w:firstLine="200"/>';
  return (
    `<w:p w14:paraId="${paraId()}" w14:textId="77777777" ` +
    `w:rsidR="00B47803" w:rsidRPr="00CE60DC" w:rsidRDefault="00000000" w:rsidP="009B024E">` +
    `<w:pPr>` +
    `<w:adjustRightInd w:val="0"/>` +
    `<w:spacing w:after="120" w:line="240" w:lineRule="atLeast"/>` +
    `${indXml}` +
    `<w:jc w:val="both"/>` +
    `<w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>` +
    `</w:pPr>${runsXml}</w:p>`
  );
}

// ============================================================
// Heading (uses baseline named style: pStyle 1 / 2 / 3 / 4)
// ============================================================
function heading(level, text) {
  // firstLine indent per baseline heading:
  //   H1: 280, H2: 240, H3 ~ H4: 220
  const firstLine = level === 1 ? 280 : level === 2 ? 240 : 220;
  return (
    `<w:p w14:paraId="${paraId()}" w14:textId="77777777" ` +
    `w:rsidR="00B47803" w:rsidRDefault="00000000">` +
    `<w:pPr><w:pStyle w:val="${level}"/><w:ind w:firstLine="${firstLine}"/></w:pPr>` +
    `<w:r><w:t>${esc(text)}</w:t></w:r></w:p>`
  );
}

// ============================================================
// Cover page building blocks
// ============================================================
function coverEmpty() {
  return `<w:p w14:paraId="${paraId()}" w14:textId="77777777" ` +
    `w:rsidR="00B47803" w:rsidRDefault="00B47803"/>`;
}

function coverCenter(text, sz, { bold = false, color = null, after = 80, before = null } = {}) {
  const bits = [];
  if (bold) bits.push('<w:b/><w:bCs/>');
  if (color) bits.push(`<w:color w:val="${color}"/>`);
  bits.push(`<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`);
  const rpr = `<w:rPr>${bits.join('')}</w:rPr>`;
  const spacingParts = [`w:after="${after}"`];
  if (before != null) spacingParts.unshift(`w:before="${before}"`);
  const spacingXml = `<w:spacing ${spacingParts.join(' ')}/>`;
  return (
    `<w:p w14:paraId="${paraId()}" w14:textId="77777777" ` +
    `w:rsidR="00B47803" w:rsidRDefault="00B47803">` +
    `<w:pPr>${spacingXml}<w:jc w:val="center"/></w:pPr>` +
    `<w:r>${rpr}<w:t>${esc(text)}</w:t></w:r></w:p>`
  );
}

// Cover info table — byte-matched to baseline
function coverInfoRow(labelText, valueText) {
  const tcBord =
    '<w:top w:val="single" w:sz="1" w:space="0" w:color="AAAAAA"/>' +
    '<w:left w:val="single" w:sz="1" w:space="0" w:color="AAAAAA"/>' +
    '<w:bottom w:val="single" w:sz="1" w:space="0" w:color="AAAAAA"/>' +
    '<w:right w:val="single" w:sz="1" w:space="0" w:color="AAAAAA"/>';
  const labelP =
    `<w:p w14:paraId="${paraId()}" w14:textId="77777777" ` +
    `w:rsidR="00B47803" w:rsidRDefault="00000000">` +
    `<w:pPr><w:spacing w:before="40" w:after="40"/><w:ind w:firstLine="200"/><w:jc w:val="center"/></w:pPr>` +
    `<w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>` +
    `<w:t>${esc(labelText)}</w:t></w:r></w:p>`;
  const valueP =
    `<w:p w14:paraId="${paraId()}" w14:textId="77777777" ` +
    `w:rsidR="00B47803" w:rsidRDefault="00000000" w:rsidP="00730F2D">` +
    `<w:pPr><w:spacing w:before="40" w:after="40"/><w:ind w:firstLineChars="50" w:firstLine="100"/></w:pPr>` +
    `<w:r><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>` +
    `<w:t>${esc(valueText)}</w:t></w:r></w:p>`;
  return (
    `<w:tr w:rsidR="00B47803" w14:paraId="${paraId()}" w14:textId="77777777">` +
    `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/>` +
    `<w:tcBorders>${tcBord}</w:tcBorders>` +
    `<w:shd w:val="clear" w:color="auto" w:fill="D9E2F3"/>` +
    `<w:vAlign w:val="center"/></w:tcPr>${labelP}</w:tc>` +
    `<w:tc><w:tcPr><w:tcW w:w="4800" w:type="dxa"/>` +
    `<w:tcBorders>${tcBord}</w:tcBorders>` +
    `<w:vAlign w:val="center"/></w:tcPr>${valueP}</w:tc></w:tr>`
  );
}

function coverInfoTable(meta) {
  const tblPr =
    '<w:tblPr><w:tblW w:w="100" w:type="auto"/>' +
    '<w:tblBorders>' +
    '<w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>' +
    '<w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/>' +
    '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/>' +
    '<w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/>' +
    '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/>' +
    '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/>' +
    '</w:tblBorders>' +
    '<w:tblCellMar><w:left w:w="10" w:type="dxa"/><w:right w:w="10" w:type="dxa"/></w:tblCellMar>' +
    '<w:tblLook w:val="0000" w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="0"/>' +
    '</w:tblPr>';
  const grid = '<w:tblGrid><w:gridCol w:w="2400"/><w:gridCol w:w="4800"/></w:tblGrid>';
  const rows = [
    coverInfoRow('학 과', meta.dept || '홍익대학교 컴퓨터공학과'),
    coverInfoRow('학 번', meta.studentId || 'C235180'),
    coverInfoRow('성 명', meta.name || '서민지'),
    coverInfoRow('지도교수', meta.advisor || '이장호 교수님'),
  ].join('');
  return `<w:tbl>${tblPr}${grid}${rows}</w:tbl>`;
}

// Last cover paragraph carries the embedded sectPr (cover section)
function coverEndWithSectPr() {
  return (
    `<w:p w14:paraId="${paraId()}" w14:textId="77777777" ` +
    `w:rsidR="00B47803" w:rsidRDefault="00B47803">` +
    `<w:pPr><w:ind w:firstLine="220"/>` +
    `<w:sectPr w:rsidR="00B47803">` +
    `<w:pgSz w:w="11906" w:h="16838"/>` +
    `<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>` +
    `<w:cols w:space="720"/>` +
    `<w:docGrid w:linePitch="360"/>` +
    `</w:sectPr></w:pPr></w:p>`
  );
}

function buildCover(meta) {
  return [
    coverEmpty(), coverEmpty(), coverEmpty(), coverEmpty(),
    coverCenter('2026학년도 졸업프로젝트', 24, { color: '666666', after: 80 }),
    coverEmpty(),
    coverCenter('최 종 보 고 서', 44, { bold: true, after: 200 }),
    coverEmpty(),
    coverCenter('스케줄링 알고리즘을 활용한', 30, { bold: true, after: 120 }),
    coverCenter('다중 사용자 LLM API 요청 관리 시스템', 30, { bold: true, after: 300 }),
    coverEmpty(), coverEmpty(), coverEmpty(), coverEmpty(),
    coverInfoTable(meta),
    coverEmpty(), coverEmpty(),
    coverCenter('2026년 5월', 22, { color: '666666', after: 80 }),
    coverEmpty(),
    coverCenter('홍익대학교 컴퓨터공학과', 24, { color: '666666', after: 80 }),
    coverEndWithSectPr(),
  ].join('');
}

// ============================================================
// Body section sectPr (standalone, at end of body)
// ============================================================
const BODY_SECTPR =
  '<w:sectPr w:rsidR="00B47803" w:rsidRPr="00BA2CC8">' +
  '<w:headerReference w:type="default" r:id="rId9"/>' +
  '<w:footerReference w:type="default" r:id="rId10"/>' +
  '<w:pgSz w:w="11906" w:h="16838"/>' +
  '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>' +
  '<w:pgNumType w:start="1"/>' +
  '<w:cols w:space="720"/>' +
  '<w:docGrid w:linePitch="360"/>' +
  '</w:sectPr>';

// ============================================================
// Figures (inline drawing wrapped in centered paragraph)
// ============================================================
let _figureCounter = 0;
function figurePara(figNum) {
  const fname = FIGURE_MAP[figNum];
  const rId = FIGURE_RID[figNum];
  if (!fname || !rId) return bodyPara(`[그림 ${figNum}: 매핑 없음]`);
  const imgPath = path.join(FIGURES_DIR, fname);
  if (!fs.existsSync(imgPath)) return bodyPara(`[그림 ${figNum}: 파일 없음]`);
  const buf = fs.readFileSync(imgPath);
  const { w, h } = pngSize(buf);
  const maxPx = 567;
  const scale = Math.min(maxPx / w, 1);
  const wPx = Math.round(w * scale);
  const hPx = Math.round(h * scale);
  const cx = pxToEmu(wPx);
  const cy = pxToEmu(hPx);
  _figureCounter++;
  const idx = _figureCounter;

  const drawing =
    `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/>` +
    `<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="${idx}" name="그림 ${idx}"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="0" name=""/>` +
    `<pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${rId}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`;

  return (
    `<w:p w14:paraId="${paraId()}" w14:textId="77777777" ` +
    `w:rsidR="00B47803" w:rsidRDefault="00000000">` +
    `<w:pPr><w:spacing w:before="100" w:after="100"/><w:jc w:val="center"/></w:pPr>` +
    `<w:r>${drawing}</w:r></w:p>`
  );
}

function figureCaption(text) {
  return (
    `<w:p w14:paraId="${paraId()}" w14:textId="77777777" ` +
    `w:rsidR="00B47803" w:rsidRDefault="00000000">` +
    `<w:pPr><w:spacing w:after="120" w:line="240" w:lineRule="atLeast"/><w:jc w:val="center"/></w:pPr>` +
    `<w:r><w:rPr><w:i/><w:iCs/><w:color w:val="666666"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>` +
    `<w:t>${esc(text)}</w:t></w:r></w:p>`
  );
}

// ============================================================
// Code block — Consolas 9pt
// ============================================================
function codeLinePara(line) {
  return (
    `<w:p w14:paraId="${paraId()}" w14:textId="77777777" ` +
    `w:rsidR="00B47803" w:rsidRDefault="00000000">` +
    `<w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="atLeast"/>` +
    `<w:ind w:left="360"/></w:pPr>` +
    `<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:color w:val="333333"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>` +
    `<w:t xml:space="preserve">${esc(line || ' ')}</w:t></w:r></w:p>`
  );
}

// ============================================================
// List items — baseline fingerprint: pStyle="a4" (List Paragraph) + numPr (numId=4)
// ============================================================
function listParaBase(text, numId) {
  const runs = parseRuns(text);
  const bodyRuns = runsToXml(runs, { sz: 20 });
  return (
    `<w:p w14:paraId="${paraId()}" w14:textId="77777777" ` +
    `w:rsidR="00B47803" w:rsidRPr="00BA2CC8" w:rsidRDefault="00000000" w:rsidP="009B024E">` +
    `<w:pPr><w:pStyle w:val="a4"/>` +
    `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${numId}"/></w:numPr>` +
    `<w:adjustRightInd w:val="0"/>` +
    `<w:spacing w:after="120" w:line="240" w:lineRule="atLeast"/>` +
    `<w:jc w:val="both"/>` +
    `<w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>` +
    `</w:pPr>${bodyRuns}</w:p>`
  );
}

function bulletPara(text) {
  // baseline numbering.xml: numId=3 -> abstractNumId=1 (bullet '•')
  return listParaBase(text, 3);
}

function numberedPara(_n, text) {
  // baseline numbering.xml: numId=4 -> abstractNumId=2 (decimal '%1.')
  return listParaBase(text, 4);
}

// Reference list (bibliography): hanging indent
function referencePara(text) {
  const runs = parseRuns(text);
  const runsXml = runsToXml(runs, { sz: 20 });
  return (
    `<w:p w14:paraId="${paraId()}" w14:textId="77777777" ` +
    `w:rsidR="00B47803" w:rsidRPr="00CE60DC" w:rsidRDefault="00000000">` +
    `<w:pPr><w:adjustRightInd w:val="0"/>` +
    `<w:spacing w:after="100" w:line="240" w:lineRule="atLeast"/>` +
    `<w:ind w:left="480" w:hanging="480"/>` +
    `<w:jc w:val="both"/>` +
    `<w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:pPr>${runsXml}</w:p>`
  );
}

// ============================================================
// Body table (from markdown) — baseline border / cell / shading pattern
// ============================================================
function bodyTable(headers, rows) {
  const totalWidth = 9000; // usable DXA in A4 with 1440 margins
  const colCount = headers.length;
  const colWidth = Math.floor(totalWidth / colCount);
  const grid = Array(colCount).fill(colWidth)
    .map(w => `<w:gridCol w:w="${w}"/>`).join('');

  const tblPr =
    '<w:tblPr><w:tblW w:w="100" w:type="auto"/>' +
    '<w:tblBorders>' +
    '<w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>' +
    '<w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/>' +
    '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/>' +
    '<w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/>' +
    '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/>' +
    '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/>' +
    '</w:tblBorders>' +
    '<w:tblCellMar><w:left w:w="10" w:type="dxa"/><w:right w:w="10" w:type="dxa"/></w:tblCellMar>' +
    '<w:tblLook w:val="0000" w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="0"/>' +
    '</w:tblPr>';

  const tcBord =
    '<w:top w:val="single" w:sz="1" w:space="0" w:color="AAAAAA"/>' +
    '<w:left w:val="single" w:sz="1" w:space="0" w:color="AAAAAA"/>' +
    '<w:bottom w:val="single" w:sz="1" w:space="0" w:color="AAAAAA"/>' +
    '<w:right w:val="single" w:sz="1" w:space="0" w:color="AAAAAA"/>';

  function tc(text, width, { bold = false, shading = null, center = false } = {}) {
    const shdXml = shading
      ? `<w:shd w:val="clear" w:color="auto" w:fill="${shading}"/>`
      : '';
    // Baseline body-table cell pattern:
    //   header (center): <w:ind w:firstLine="200"/> + <w:jc w:val="center"/>
    //   value  (left)  : <w:ind w:firstLineChars="50" w:firstLine="100"/>
    const indXml = center
      ? '<w:ind w:firstLine="200"/>'
      : '<w:ind w:firstLineChars="50" w:firstLine="100"/>';
    const jcXml = center ? '<w:jc w:val="center"/>' : '';
    const runs = parseRuns(text);
    // Baseline body-table cells use sz=18 (9pt), NOT sz=20
    const runsXml = runs.map(r => {
      const bits = [];
      if (r.bold || bold) bits.push('<w:b/><w:bCs/>');
      bits.push('<w:sz w:val="18"/><w:szCs w:val="18"/>');
      const preserve = needsPreserve(r.text) ? ' xml:space="preserve"' : '';
      return `<w:r><w:rPr>${bits.join('')}</w:rPr><w:t${preserve}>${esc(r.text)}</w:t></w:r>`;
    }).join('');
    const p =
      `<w:p w14:paraId="${paraId()}" w14:textId="77777777" ` +
      `w:rsidR="00B47803" w:rsidRDefault="00000000">` +
      `<w:pPr><w:spacing w:before="40" w:after="40"/>${indXml}${jcXml}` +
      `<w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:pPr>` +
      `${runsXml || '<w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t></w:t></w:r>'}` +
      `</w:p>`;
    return (
      `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>` +
      `<w:tcBorders>${tcBord}</w:tcBorders>` +
      `${shdXml}` +
      `<w:vAlign w:val="center"/></w:tcPr>${p}</w:tc>`
    );
  }

  const headerCells = headers.map(h =>
    tc(h, colWidth, { bold: true, shading: 'D9E2F3', center: true })
  ).join('');
  const headerRow =
    `<w:tr w:rsidR="00B47803" w14:paraId="${paraId()}" w14:textId="77777777">${headerCells}</w:tr>`;
  const bodyRows = rows.map(r => {
    const cells = r.map(c => tc(c || '', colWidth)).join('');
    return `<w:tr w:rsidR="00B47803" w14:paraId="${paraId()}" w14:textId="77777777">${cells}</w:tr>`;
  }).join('');
  return `<w:tbl>${tblPr}<w:tblGrid>${grid}</w:tblGrid>${headerRow}${bodyRows}</w:tbl>`;
}

function tableCaptionPara(text) {
  const runs = parseRuns(text);
  const runsXml = runsToXml(runs, { sz: 20 });
  return (
    `<w:p w14:paraId="${paraId()}" w14:textId="77777777" ` +
    `w:rsidR="00B47803" w:rsidRDefault="00000000">` +
    `<w:pPr><w:spacing w:after="80" w:line="240" w:lineRule="atLeast"/></w:pPr>` +
    `<w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>` +
    `<w:t>${esc(text)}</w:t></w:r></w:p>`
  );
}

// Empty line between blocks
function emptyBodyPara() {
  return (
    `<w:p w14:paraId="${paraId()}" w14:textId="77777777" ` +
    `w:rsidR="00B47803" w:rsidRDefault="00000000">` +
    `<w:pPr><w:spacing w:after="80"/></w:pPr></w:p>`
  );
}

// ============================================================
// Markdown parser → XML fragments
// ============================================================
function parseMarkdownTable(lines) {
  const headers = [];
  const rows = [];
  let headerSeen = false;
  for (const line of lines) {
    if (!line.trim().startsWith('|')) continue;
    if (/^\s*\|[\s\-:]+\|/.test(line)) { headerSeen = true; continue; }
    const cols = line.split('|').slice(1, -1).map(c => c.trim());
    if (!headerSeen) headers.push(...cols);
    else rows.push(cols);
  }
  return { headers, rows };
}

function parseMarkdownBody(mdText) {
  const lines = mdText.split('\n');
  const parts = [];
  let i = 0;
  let pendingTableCaption = null;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed === '') { i++; continue; }
    if (trimmed === '---') { i++; continue; }

    // ## Chapter
    if (/^## /.test(raw)) {
      parts.push(heading(1, raw.replace(/^## /, '').trim()));
      i++; continue;
    }
    // ### Section
    if (/^### /.test(raw)) {
      parts.push(heading(2, raw.replace(/^### /, '').trim()));
      i++; continue;
    }
    // #### Subsection
    if (/^#### /.test(raw)) {
      parts.push(heading(3, raw.replace(/^#### /, '').trim()));
      i++; continue;
    }

    // Figure line: > **[그림 N] caption** (path)
    const figMatch = trimmed.match(/^> \*\*\[그림\s*(\d+)\]\s*(.*?)\*\*/);
    if (figMatch) {
      const figNum = parseInt(figMatch[1], 10);
      const capText = `[그림 ${figNum}] ${figMatch[2].trim()}`;
      parts.push(emptyBodyPara());
      parts.push(figurePara(figNum));
      parts.push(figureCaption(capText));
      parts.push(emptyBodyPara());
      i++; continue;
    }

    // Code block
    if (trimmed.startsWith('```')) {
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // closing ```
      for (const cl of codeLines) parts.push(codeLinePara(cl));
      parts.push(emptyBodyPara());
      continue;
    }

    // Markdown table
    if (trimmed.startsWith('|')) {
      const tblLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tblLines.push(lines[i]);
        i++;
      }
      const { headers, rows } = parseMarkdownTable(tblLines);
      if (pendingTableCaption) {
        parts.push(tableCaptionPara(pendingTableCaption));
        pendingTableCaption = null;
      }
      if (headers.length) parts.push(bodyTable(headers, rows));
      parts.push(emptyBodyPara());
      continue;
    }

    // Standalone bold line that starts with 표 → table caption
    if (/^\*\*표\s+\d+/.test(trimmed) && !trimmed.includes('|')) {
      pendingTableCaption = trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '');
      i++; continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s(.*)$/);
    if (numMatch) {
      parts.push(numberedPara(numMatch[1], numMatch[2]));
      i++; continue;
    }

    // Bullet list
    if (/^- /.test(trimmed)) {
      parts.push(bulletPara(trimmed.replace(/^- /, '')));
      i++; continue;
    }

    // Reference entry [N] …
    if (/^\[\d+\]/.test(trimmed)) {
      parts.push(referencePara(trimmed));
      i++; continue;
    }

    // Formula-like line: JFI/VFT/contains x^2
    if (trimmed.startsWith('JFI') || trimmed.startsWith('VFT') ||
        /\^2/.test(trimmed) || trimmed.includes('= ∑')) {
      const runs = parseRuns(trimmed);
      const runsXml = runsToXml(runs, { sz: 20, color: '333333', italic: true });
      parts.push(
        `<w:p w14:paraId="${paraId()}" w14:textId="77777777" ` +
        `w:rsidR="00B47803" w:rsidRDefault="00000000">` +
        `<w:pPr><w:adjustRightInd w:val="0"/>` +
        `<w:spacing w:after="120" w:line="240" w:lineRule="atLeast"/>` +
        `<w:ind w:left="360"/>` +
        `<w:jc w:val="both"/></w:pPr>${runsXml}</w:p>`
      );
      i++; continue;
    }

    // Flush pending table caption if no table followed
    if (pendingTableCaption) {
      parts.push(tableCaptionPara(pendingTableCaption));
      pendingTableCaption = null;
    }

    parts.push(bodyPara(trimmed));
    i++;
  }

  return parts.join('');
}

// ============================================================
// Metadata / body extraction from markdown
// ============================================================
function extractMetadata(md) {
  const meta = {};
  const patterns = {
    dept: /\*\*학과[:：]\*\*\s*(.+)/,
    studentId: /\*\*학번[:：]\*\*\s*(.+)/,
    name: /\*\*성명[:：]\*\*\s*(.+)/,
    advisor: /\*\*지도교수[:：]\*\*\s*(.+)/,
    date: /\*\*제출일[:：]\*\*\s*(.+)/,
  };
  for (const [k, re] of Object.entries(patterns)) {
    const m = md.match(re);
    if (m) meta[k] = m[1].trim();
  }
  return meta;
}

function extractBody(md) {
  const idx = md.indexOf('\n## 1.');
  if (idx === -1) {
    const firstH2 = md.indexOf('\n## ');
    return firstH2 === -1 ? md : md.slice(firstH2 + 1);
  }
  return md.slice(idx + 1);
}

// ============================================================
// Relationships rebuild
// ============================================================
function buildRels() {
  const rels = [
    { id: 'rId1', type: 'numbering', target: 'numbering.xml' },
    { id: 'rId2', type: 'styles', target: 'styles.xml' },
    { id: 'rId3', type: 'settings', target: 'settings.xml' },
    { id: 'rId4', type: 'webSettings', target: 'webSettings.xml' },
    { id: 'rId5', type: 'footnotes', target: 'footnotes.xml' },
    { id: 'rId6', type: 'endnotes', target: 'endnotes.xml' },
    { id: 'rId7', type: 'image', target: 'media/image1.png' },
    { id: 'rId8', type: 'image', target: 'media/image2.png' },
    { id: 'rId9', type: 'header', target: 'header1.xml' },
    { id: 'rId10', type: 'footer', target: 'footer1.xml' },
    { id: 'rId11', type: 'fontTable', target: 'fontTable.xml' },
    { id: 'rId12', type: 'theme', target: 'theme/theme1.xml' },
    { id: 'rId13', type: 'image', target: 'media/image3.png' },
    { id: 'rId14', type: 'image', target: 'media/image4.png' },
    { id: 'rId15', type: 'image', target: 'media/image5.png' },
    { id: 'rId16', type: 'image', target: 'media/image6.png' },
    { id: 'rId17', type: 'image', target: 'media/image7.png' },
    { id: 'rId18', type: 'image', target: 'media/image8.png' },
  ];
  const baseType = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
  const items = rels.map(r =>
    `<Relationship Id="${r.id}" Type="${baseType}${r.type}" Target="${r.target}"/>`
  ).join('');
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${items}</Relationships>`
  );
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log('Loading baseline DOCX...');
  console.log(`  ${BASELINE_PATH}`);
  const baselineBuf = fs.readFileSync(BASELINE_PATH);
  const zip = await JSZip.loadAsync(baselineBuf);

  // Extract preamble from baseline document.xml (2629 chars incl. <w:body>)
  const origDoc = await zip.file('word/document.xml').async('string');
  const preambleMatch = origDoc.match(/^([\s\S]*?<w:body>)/);
  if (!preambleMatch) throw new Error('Cannot extract preamble from baseline document.xml');
  const preamble = preambleMatch[1];
  console.log(`  Preamble: ${preamble.length} chars`);

  // Read markdown
  console.log('Reading markdown...');
  const md = fs.readFileSync(MD_PATH, 'utf8');
  const meta = extractMetadata(md);
  console.log('  Metadata:', meta);

  // Build cover + body
  console.log('Building cover page...');
  const coverXml = buildCover(meta);

  console.log('Parsing body markdown...');
  const bodyText = extractBody(md);
  const bodyXml = parseMarkdownBody(bodyText);

  // Assemble final document.xml
  const newDocXml = preamble + coverXml + bodyXml + BODY_SECTPR + '</w:body></w:document>';
  console.log(`  document.xml: ${newDocXml.length} chars`);

  // Remove old media files
  const mediaFiles = Object.keys(zip.files).filter(f => f.startsWith('word/media/'));
  for (const f of mediaFiles) zip.remove(f);
  console.log(`  Removed ${mediaFiles.length} old media files`);

  // Insert 8 new figures
  for (let n = 1; n <= 8; n++) {
    const fname = FIGURE_MAP[n];
    const src = path.join(FIGURES_DIR, fname);
    if (!fs.existsSync(src)) {
      console.warn(`  [WARN] missing figure file: ${src}`);
      continue;
    }
    const data = fs.readFileSync(src);
    zip.file(`word/media/image${n}.png`, data);
    console.log(`  Inserted word/media/image${n}.png (${data.length} bytes) from ${fname}`);
  }

  // Rewrite document.xml and rels
  zip.file('word/document.xml', newDocXml);
  zip.file('word/_rels/document.xml.rels', buildRels());

  // Ensure output directory
  const outDir = path.dirname(OUT_PATH);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Write output
  console.log('Packing DOCX...');
  const outBuf = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  fs.writeFileSync(OUT_PATH, outBuf);

  const sizeKB = (outBuf.length / 1024).toFixed(1);
  console.log(`\nDone! Output: ${OUT_PATH}`);
  console.log(`File size: ${sizeKB} KB`);
}

main().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
