/**
 * 통계 보고서 생성기
 *
 * multi-seed-results/summary.json을 읽어
 * 마크다운 형식의 통계 보고서를 생성한다.
 *
 * 실행: node generate-stats-report.js
 * 출력: statistical-report.md
 */

const fs = require('fs');
const path = require('path');

const SUMMARY_PATH = path.join(__dirname, 'multi-seed-results', 'summary.json');
const REPORT_PATH = path.join(__dirname, 'statistical-report.md');

function loadSummary() {
  if (!fs.existsSync(SUMMARY_PATH)) {
    console.error('summary.json 없음. 먼저 run-multi-seed.js를 실행하세요.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf-8'));
}

function fmtNum(v, decimals = 2) {
  if (v == null) return '-';
  return typeof v === 'number' ? v.toFixed(decimals) : String(v);
}

function generateReport() {
  const s = loadSummary();
  const cfg = s.experimentConfig;
  const desc = s.descriptiveStatistics;
  const tests = s.statisticalTests;
  const effects = s.effectSizes;
  const catStats = s.categoryStatistics;
  const mlfqShort = s.mlfqShortImprovement;

  const lines = [];
  const ln = (text = '') => lines.push(text);

  // 제목
  ln('# 다중 시드 실험 통계 보고서');
  ln();
  ln(`> 생성일: ${new Date().toISOString().slice(0, 10)}`);
  ln();

  // 실험 설정
  ln('## 1. 실험 설정');
  ln();
  ln(`| 항목 | 값 |`);
  ln(`|------|-----|`);
  ln(`| 시드 수 | ${cfg.seedCount} |`);
  ln(`| 요청 수 (시드당) | ${cfg.requestCount} |`);
  ln(`| 총 실험 요청 수 | ${cfg.seedCount * cfg.requestCount} |`);
  ln(`| 시드 목록 | ${cfg.seeds.join(', ')} |`);
  ln(`| 버스트 구성 | ${cfg.numBursts || '-'} bursts × ${cfg.requestsPerBurst || '-'} requests |`);
  ln(`| 타임 슬라이스 | ${cfg.timeSliceMs || '-'}ms |`);
  ln(`| 카테고리 분포 | ${cfg.categoryDistribution || '-'} |`);
  ln(`| 시뮬레이션 유형 | ${cfg.simulationType || '-'} |`);
  ln();

  // 기술 통계
  ln('## 2. 기술 통계 (Descriptive Statistics)');
  ln();
  ln('### 2.1 전체 평균 대기시간 (ms)');
  ln();
  ln('| 스케줄러 | Mean | SD | 95% CI Lower | 95% CI Upper | Min | Max |');
  ln('|----------|------|-----|-------------|-------------|------|------|');

  for (const [name, label] of [['fcfs', 'FCFS'], ['mlfq', 'MLFQ']]) {
    const d = desc[name];
    ln(`| ${label} | ${fmtNum(d.mean)} | ${fmtNum(d.stddev)} | ${fmtNum(d.ci95.lower)} | ${fmtNum(d.ci95.upper)} | ${fmtNum(d.min)} | ${fmtNum(d.max)} |`);
  }
  ln();

  // 카테고리별
  ln('### 2.2 카테고리별 평균 대기시간 (ms)');
  ln();
  ln('| 카테고리 | 스케줄러 | Mean | SD | 95% CI |');
  ln('|----------|----------|------|-----|--------|');

  for (const cat of ['short', 'medium', 'long']) {
    for (const [sched, label] of [['fcfs', 'FCFS'], ['mlfq', 'MLFQ']]) {
      const key = `${sched}_${cat}`;
      const d = catStats[key];
      if (d && d.n > 0) {
        ln(`| ${cat} | ${label} | ${fmtNum(d.mean)} | ${fmtNum(d.stddev)} | [${fmtNum(d.ci95.lower)}, ${fmtNum(d.ci95.upper)}] |`);
      }
    }
  }
  ln();

  // 통계 검정
  ln('## 3. 통계 검정 (Statistical Tests)');
  ln();
  ln('대응표본 t-검정 (paired t-test, α=0.05, df=9)');
  ln();
  ln('| 비교 | t-value | p-value | 유의성 | Cohen\'s d | 효과 크기 |');
  ln('|------|---------|---------|--------|-----------|----------|');

  for (const [key, label] of [
    ['FCFS_vs_MLFQ_overall', 'FCFS vs MLFQ (전체)'],
    ['FCFS_vs_MLFQ_short', 'FCFS vs MLFQ (short)'],
    ['FCFS_vs_MLFQ_medium', 'FCFS vs MLFQ (medium)'],
    ['FCFS_vs_MLFQ_long', 'FCFS vs MLFQ (long)'],
  ]) {
    const t = tests[key];
    const e = effects[key];
    if (t && e) {
      const sig = t.significant ? '**유의** ✓' : '미유의';
      ln(`| ${label} | ${fmtNum(t.tValue, 4)} | ${t.pValue} | ${sig} | ${fmtNum(e.d, 4)} | ${e.interpretation} |`);
    }
  }
  ln();

  // MLFQ Short 개선율
  if (mlfqShort && mlfqShort.n > 0) {
    ln('## 4. MLFQ Short 요청 개선율');
    ln();
    ln(`MLFQ는 FCFS 대비 Short 요청의 대기시간을 다음과 같이 개선하였다.`);
    ln();
    ln(`| 지표 | 값 |`);
    ln(`|------|-----|`);
    ln(`| 평균 개선율 | **${fmtNum(mlfqShort.mean)}%** |`);
    ln(`| 표준편차 | ${fmtNum(mlfqShort.stddev)}% |`);
    ln(`| 95% 신뢰구간 | [${fmtNum(mlfqShort.ci95.lower)}%, ${fmtNum(mlfqShort.ci95.upper)}%] |`);
    ln(`| 최소 | ${fmtNum(mlfqShort.min)}% |`);
    ln(`| 최대 | ${fmtNum(mlfqShort.max)}% |`);
    ln(`| 시드 수 (n) | ${mlfqShort.n} |`);
    ln();
    ln(`> 기존 단일 시드 결과 참고: concurrent 실험 70.68%, large-scale 실험 76.11% → 다중 시드 평균: ${fmtNum(mlfqShort.mean)}%`);
  }
  ln();

  // 해석
  ln('## 5. 결과 해석');
  ln();
  ln('### 5.1 통계적 유의성');
  ln();

  const fcfsMlfq = tests['FCFS_vs_MLFQ_overall'];
  if (fcfsMlfq) {
    if (fcfsMlfq.significant) {
      ln('- MLFQ는 FCFS 대비 통계적으로 유의하게 다른 성능을 보인다 (p < 0.05).');
    } else {
      ln('- MLFQ와 FCFS의 전체 평균 대기시간 차이는 통계적으로 유의하지 않다.');
    }
  }

  const fcfsMlfqShort = tests['FCFS_vs_MLFQ_short'];
  if (fcfsMlfqShort) {
    if (fcfsMlfqShort.significant) {
      ln('- MLFQ의 Short 요청 처리 개선은 통계적으로 유의하다 (p < 0.05).');
    } else {
      ln('- MLFQ의 Short 요청 처리 개선은 통계적으로 유의하지 않다.');
    }
  }
  ln();

  ln('### 5.2 재현성');
  ln();
  if (mlfqShort && mlfqShort.stddev != null) {
    const cv = (mlfqShort.stddev / Math.abs(mlfqShort.mean) * 100);
    ln(`- MLFQ Short 개선율의 변동계수(CV): ${fmtNum(cv)}%`);
    if (cv < 15) {
      ln('- 변동계수가 15% 미만으로, 시드에 관계없이 안정적인 결과를 보인다.');
    } else {
      ln('- 변동계수가 15% 이상으로, 시드에 따른 변동이 존재한다.');
    }
  }
  ln();

  // 연구 질문 답변
  ln('## 6. 연구 질문 답변 (다중 시드 기준)');
  ln();
  ln('| RQ | 질문 | 다중 시드 결과 |');
  ln('|-----|------|---------------|');

  const mlfqMean = mlfqShort ? fmtNum(mlfqShort.mean) : '-';
  const mlfqCI = mlfqShort ? `[${fmtNum(mlfqShort.ci95.lower)}, ${fmtNum(mlfqShort.ci95.upper)}]` : '-';
  ln(`| RQ2 | MLFQ가 혼합 워크로드에서 Short 요청 대기시간을 얼마나 개선하는가? | 평균 ${mlfqMean}% 개선 (95% CI: ${mlfqCI}) |`);
  ln();

  // 메타데이터
  ln('---');
  ln();
  ln(`*본 보고서는 generate-stats-report.js에 의해 자동 생성됨*`);
  ln(`*실험 실행 시각: ${cfg.timestamp}*`);

  const report = lines.join('\n');
  fs.writeFileSync(REPORT_PATH, report, 'utf-8');
  console.log(`통계 보고서 생성: ${REPORT_PATH}`);
  return report;
}

// 실행
if (require.main === module) {
  generateReport();
}

module.exports = { generateReport };
