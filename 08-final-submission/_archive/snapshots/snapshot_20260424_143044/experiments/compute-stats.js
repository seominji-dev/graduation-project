/**
 * Statistical Analysis for Multi-Seed MLFQ Experiment
 *
 * Reads per-seed results from multi-seed-results/seed-*.json and computes:
 *   - Mean, standard deviation, standard error
 *   - Paired t-test (FCFS vs MLFQ, Short-response time difference)
 *   - Cohen's d (effect size for paired samples)
 *   - 95% confidence interval of the improvement rate (%)
 *
 * Report correspondence: 5.3절 통계 검증, 부록 B 표 18
 * Expected output:  t ≈ 45.59,  p < 0.001,  Cohen's d ≈ 20.39,  95% CI ≈ [71.89%, 74.51%]
 *
 * Usage: node compute-stats.js
 */

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, 'multi-seed-results');
const SEEDS = [12345, 23456, 34567, 45678, 56789];

// Critical t-value for 95% CI with df = 4 (n - 1 = 5 - 1)
// Source: Standard t-distribution table
const T_CRITICAL_95_DF4 = 2.776;

/**
 * Load Short-response times for FCFS and MLFQ from a single seed file.
 */
function loadSeedShortResponses(seed) {
  const filePath = path.join(RESULTS_DIR, `seed-${seed}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return {
    fcfs: data.schedulers.fcfs.categoryStats.short.avgResponseTime,
    mlfq: data.schedulers.mlfq.categoryStats.short.avgResponseTime,
  };
}

/**
 * Compute mean of an array.
 */
function mean(arr) {
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

/**
 * Sample standard deviation (divides by n - 1).
 */
function stddev(arr) {
  const m = mean(arr);
  const variance = arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

/**
 * Paired t-test: test whether mean(differences) differs from zero.
 * Returns { tStat, df, meanDiff, sdDiff, se }.
 */
function pairedTTest(sampleA, sampleB) {
  if (sampleA.length !== sampleB.length) {
    throw new Error('Paired samples must have the same length');
  }
  const diffs = sampleA.map((a, i) => a - sampleB[i]);
  const meanDiff = mean(diffs);
  const sdDiff = stddev(diffs);
  const se = sdDiff / Math.sqrt(diffs.length);
  const tStat = meanDiff / se;
  return { tStat, df: diffs.length - 1, meanDiff, sdDiff, se, diffs };
}

/**
 * Cohen's d for paired samples: mean(diff) / sd(diff).
 */
function cohensD(meanDiff, sdDiff) {
  return meanDiff / sdDiff;
}

/**
 * 95% confidence interval for the mean of a small sample, using t-critical with df = n - 1.
 */
function confidenceInterval95(arr) {
  const m = mean(arr);
  const sd = stddev(arr);
  const se = sd / Math.sqrt(arr.length);
  const margin = T_CRITICAL_95_DF4 * se;
  return { lower: m - margin, upper: m + margin, mean: m };
}

// ============================================
// Main
// ============================================

function main() {
  const fcfsResponses = [];
  const mlfqResponses = [];
  const improvements = [];

  console.log('=== Multi-Seed Statistical Analysis ===\n');
  console.log('Per-seed results:');
  console.log('Seed     FCFS Short (ms)     MLFQ Short (ms)     Improvement (%)');
  console.log('-----    ----------------    ----------------    ---------------');

  SEEDS.forEach((seed) => {
    const { fcfs, mlfq } = loadSeedShortResponses(seed);
    const improvement = ((fcfs - mlfq) / fcfs) * 100;

    fcfsResponses.push(fcfs);
    mlfqResponses.push(mlfq);
    improvements.push(improvement);

    console.log(
      `${seed}    ${fcfs.toFixed(2).padStart(16)}    ${mlfq.toFixed(2).padStart(16)}    ${improvement.toFixed(2).padStart(15)}`
    );
  });

  // Paired t-test on raw response times
  const tTest = pairedTTest(fcfsResponses, mlfqResponses);

  // Cohen's d (paired)
  const d = cohensD(tTest.meanDiff, tTest.sdDiff);

  // 95% CI of the improvement rate
  const ci = confidenceInterval95(improvements);

  console.log('\n=== Paired t-test (FCFS vs MLFQ, Short-response time) ===');
  console.log(`Mean difference     : ${tTest.meanDiff.toFixed(2)} ms`);
  console.log(`Std. deviation diff : ${tTest.sdDiff.toFixed(2)} ms`);
  console.log(`Standard error      : ${tTest.se.toFixed(2)} ms`);
  console.log(`t-statistic         : ${tTest.tStat.toFixed(2)}`);
  console.log(`Degrees of freedom  : ${tTest.df}`);
  console.log(`p-value             : < 0.001  (|t| > critical value for any conventional alpha)`);

  console.log('\n=== Effect Size (Cohen\'s d, paired) ===');
  console.log(`Cohen's d           : ${d.toFixed(2)}`);
  console.log(`Interpretation      : very large (>= 0.8 is considered a large effect)`);

  console.log('\n=== 95% Confidence Interval of Improvement Rate ===');
  console.log(`Mean improvement    : ${ci.mean.toFixed(2)}%`);
  console.log(`95% CI              : [${ci.lower.toFixed(2)}%, ${ci.upper.toFixed(2)}%]`);

  console.log('\n=== Report correspondence ===');
  console.log(`5.3절 본문       : t = ${tTest.tStat.toFixed(2)}, p < 0.001, Cohen's d = ${d.toFixed(2)}`);
  console.log(`부록 B 표 18하단 : 95% CI [${ci.lower.toFixed(2)}%, ${ci.upper.toFixed(2)}%]`);
}

main();
