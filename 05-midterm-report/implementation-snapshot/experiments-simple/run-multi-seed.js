/**
 * 다중 시드 실험 실행기
 *
 * 10개의 서로 다른 시드로 동일 실험을 반복하여
 * 통계적 엄밀성을 확보한다.
 *
 * mlfq-concurrent-competition-experiment.js의 선점형 시뮬레이션을
 * 시드 파라미터화하여 래핑한 스크립트
 *
 * MLFQ 시뮬레이션은 선점형(preemptive) 타임 슬라이싱을 사용하여
 * Short 요청이 Long 요청보다 먼저 완료될 수 있도록 한다.
 *
 * 실행: node run-multi-seed.js
 * 출력: multi-seed-results/seed-{N}.json, multi-seed-results/summary.json
 */

const {
  FCFSScheduler,
  MLFQScheduler,
} = require('../src-simple/schedulers');

const { descriptiveStats, pairedTTest, cohensD } = require('./stats-utils');
const fs = require('fs');
const path = require('path');

// ============================================
// 실험 설정
// ============================================

// 10개 시드 (재현 가능)
const SEEDS = [12345, 23456, 34567, 45678, 56789, 67890, 78901, 89012, 90123, 11111];

const REQUEST_COUNT = 500;
const NUM_BURSTS = 25;           // 25 버스트 × 20 요청 = 500 요청
const REQUESTS_PER_BURST = 20;
const TIME_SLICE_MS = 500;       // 타임 슬라이스 (MLFQScheduler.TIME_SLICE_MS 동일)
const BURST_GAP_MS = 2000;       // 버스트 간 간격

// 워크로드 분포 (concurrent 실험과 동일: 40% short, 40% medium, 20% long)
const CATEGORIES = ['short', 'short', 'medium', 'medium', 'long'];

// 처리 시간 범위 (concurrent 실험과 동일)
const PROCESSING_RANGES = {
  short:  [100,  800],   // Q0 퀀텀(1000ms) 이내 완료
  medium: [1200, 4000],  // Q1 퀀텀(3000ms) 필요
  long:   [5000, 10000], // Q2 퀀텀(8000ms) 필요
};

// 출력 디렉토리
const OUTPUT_DIR = path.join(__dirname, 'multi-seed-results');

// ============================================
// 시드 기반 유틸리티
// ============================================

let currentSeed;

function seededRandom() {
  currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
  return currentSeed / 0x7fffffff;
}

function randomInt(min, max) {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

// ============================================
// 워크로드 생성 (버스트 패턴)
// ============================================

function generateWorkload(seed) {
  currentSeed = seed;
  const requests = [];
  let arrivalTime = 0;

  for (let b = 0; b < NUM_BURSTS; b++) {
    for (let i = 0; i < REQUESTS_PER_BURST; i++) {
      const catIdx = Math.floor(seededRandom() * CATEGORIES.length);
      const category = CATEGORIES[catIdx];
      const range = PROCESSING_RANGES[category];
      const processingTime = randomInt(range[0], range[1]);

      requests.push({
        id: `burst-${b}-req-${i}`,
        prompt: `Seed ${seed} burst ${b} req ${i}`,
        category,
        processingTime,
        remainingTime: processingTime,
        arrivalTime,
        createdAt: arrivalTime,
      });
    }
    arrivalTime += BURST_GAP_MS;
  }

  return requests;
}

// ============================================
// FCFS 시뮬레이션 (비선점)
// ============================================

function simulateFCFS(requests) {
  const scheduler = new FCFSScheduler();
  const results = [];
  let currentTime = 0;

  const sorted = [...requests].sort((a, b) =>
    a.arrivalTime !== b.arrivalTime
      ? a.arrivalTime - b.arrivalTime
      : a.id.localeCompare(b.id)
  );

  for (const req of sorted) {
    scheduler.enqueue({ ...req });
  }

  while (!scheduler.isEmpty()) {
    const req = scheduler.dequeue();
    currentTime = Math.max(currentTime, req.arrivalTime);
    const waitTime = currentTime - req.arrivalTime;
    results.push({ ...req, waitTime, completedAt: currentTime + req.processingTime });
    currentTime += req.processingTime;
  }

  return results;
}

// ============================================
// MLFQ 선점형 시뮬레이션
// ============================================

function simulateMLFQPreemptive(requests) {
  const scheduler = new MLFQScheduler();
  const results = [];
  let currentTime = 0;
  let completedCount = 0;
  const totalRequests = requests.length;

  for (const req of requests) {
    scheduler.enqueue({ ...req, usedTime: 0 });
  }

  while (completedCount < totalRequests) {
    if (!scheduler.getCurrentRequest()) {
      const nextReq = scheduler.dequeue();
      if (nextReq) {
        scheduler.startProcessing(nextReq);
      } else {
        break;
      }
    }

    const currentReq = scheduler.getCurrentRequest();
    const timeSlice = Math.min(TIME_SLICE_MS, currentReq.remainingTime);

    currentTime += timeSlice;
    currentReq.remainingTime -= timeSlice;
    currentReq.usedTime += timeSlice;
    scheduler.currentRequestUsedTime = currentReq.usedTime;

    const preemption = scheduler.checkPreemption(timeSlice);

    if (currentReq.remainingTime <= 0) {
      // 요청 완료
      const completed = scheduler.completeCurrentRequest();
      completed.completedAt = currentTime;
      completed.waitTime = currentTime - completed.arrivalTime;
      results.push(completed);
      completedCount++;
    } else if (preemption && preemption.shouldPreempt) {
      // 선점: 하위 큐로 이동
      scheduler.preempt(preemption);
    }

    // 주기적 부스팅
    if (currentTime > 0 && currentTime % 5000 < TIME_SLICE_MS) {
      scheduler.boost();
    }
  }

  return results;
}

// ============================================
// 결과 분석
// ============================================

function analyzeResults(results, schedulerName) {
  const waitTimes = results.map(r => r.waitTime);
  const avgWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;

  const categoryStats = {};
  for (const cat of ['short', 'medium', 'long']) {
    const catResults = results.filter(r => r.category === cat);
    if (catResults.length > 0) {
      const catWaitTimes = catResults.map(r => r.waitTime);
      const catAvg = catWaitTimes.reduce((a, b) => a + b, 0) / catWaitTimes.length;
      categoryStats[cat] = {
        count: catResults.length,
        avgWaitTime: parseFloat(catAvg.toFixed(2)),
      };
    }
  }

  return {
    scheduler: schedulerName,
    totalRequests: results.length,
    avgWaitTime: parseFloat(avgWaitTime.toFixed(2)),
    categoryStats,
  };
}

// ============================================
// 메인 실행
// ============================================

function runMultiSeedExperiments() {
  console.log('═'.repeat(70));
  console.log('  다중 시드 실험 (Multi-Seed Statistical Validation)');
  console.log('═'.repeat(70));
  console.log(`  시드 수: ${SEEDS.length}, 요청 수: ${REQUEST_COUNT} (${NUM_BURSTS} bursts × ${REQUESTS_PER_BURST})`);
  console.log(`  스케줄러: FCFS (비선점) vs MLFQ (선점형)`);
  console.log(`  타임 슬라이스: ${TIME_SLICE_MS}ms`);
  console.log('═'.repeat(70));

  // 출력 디렉토리 생성
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 시드별 결과 수집
  const seedResults = { fcfs: [], mlfq: [] };
  const categoryResults = {
    fcfs:  { short: [], medium: [], long: [] },
    mlfq:  { short: [], medium: [], long: [] },
  };

  for (let i = 0; i < SEEDS.length; i++) {
    const seed = SEEDS[i];
    console.log(`\n[시드 ${i + 1}/${SEEDS.length}] seed=${seed}`);

    const requests = generateWorkload(seed);

    const fcfsResults = simulateFCFS(requests);
    const mlfqResults = simulateMLFQPreemptive(requests);

    const fcfsStats = analyzeResults(fcfsResults, 'FCFS');
    const mlfqStats = analyzeResults(mlfqResults, 'MLFQ');

    seedResults.fcfs.push(fcfsStats.avgWaitTime);
    seedResults.mlfq.push(mlfqStats.avgWaitTime);

    for (const cat of ['short', 'medium', 'long']) {
      if (fcfsStats.categoryStats[cat]) {
        categoryResults.fcfs[cat].push(fcfsStats.categoryStats[cat].avgWaitTime);
      }
      if (mlfqStats.categoryStats[cat]) {
        categoryResults.mlfq[cat].push(mlfqStats.categoryStats[cat].avgWaitTime);
      }
    }

    // 개별 시드 결과 저장
    const seedData = {
      seed,
      requestCount: REQUEST_COUNT,
      timestamp: new Date().toISOString(),
      simulationType: 'preemptive',
      timeSliceMs: TIME_SLICE_MS,
      schedulers: { fcfs: fcfsStats, mlfq: mlfqStats },
    };

    const seedFile = path.join(OUTPUT_DIR, `seed-${seed}.json`);
    fs.writeFileSync(seedFile, JSON.stringify(seedData, null, 2));

    // Short 개선율
    const fcfsShort = fcfsStats.categoryStats.short?.avgWaitTime || 0;
    const mlfqShort = mlfqStats.categoryStats.short?.avgWaitTime || 0;
    const shortImprove = fcfsShort > 0 ? ((fcfsShort - mlfqShort) / fcfsShort * 100).toFixed(1) : '0';

    console.log(
      `  FCFS: ${fcfsStats.avgWaitTime}ms | MLFQ: ${mlfqStats.avgWaitTime}ms | ` +
      `Short 개선: ${shortImprove}%`
    );
  }

  // ============================================
  // 통계 요약
  // ============================================
  console.log('\n' + '═'.repeat(70));
  console.log('  통계 요약');
  console.log('═'.repeat(70));

  const summary = {
    experimentConfig: {
      seeds: SEEDS,
      seedCount: SEEDS.length,
      requestCount: REQUEST_COUNT,
      numBursts: NUM_BURSTS,
      requestsPerBurst: REQUESTS_PER_BURST,
      timeSliceMs: TIME_SLICE_MS,
      burstGapMs: BURST_GAP_MS,
      processingRanges: PROCESSING_RANGES,
      categoryDistribution: '40% short, 40% medium, 20% long',
      simulationType: 'preemptive (MLFQ) vs non-preemptive (FCFS)',
      timestamp: new Date().toISOString(),
    },
    descriptiveStatistics: {
      fcfs: descriptiveStats(seedResults.fcfs),
      mlfq: descriptiveStats(seedResults.mlfq),
    },
    categoryStatistics: {
      fcfs_short:  descriptiveStats(categoryResults.fcfs.short),
      mlfq_short:  descriptiveStats(categoryResults.mlfq.short),
      fcfs_medium: descriptiveStats(categoryResults.fcfs.medium),
      mlfq_medium: descriptiveStats(categoryResults.mlfq.medium),
      fcfs_long:   descriptiveStats(categoryResults.fcfs.long),
      mlfq_long:   descriptiveStats(categoryResults.mlfq.long),
    },
    statisticalTests: {},
    effectSizes: {},
    mlfqShortImprovement: {},
  };

  // 대응표본 t-검정
  const overallTest = pairedTTest(seedResults.fcfs, seedResults.mlfq);
  const overallEffect = cohensD(seedResults.fcfs, seedResults.mlfq);
  summary.statisticalTests['FCFS_vs_MLFQ_overall'] = overallTest;
  summary.effectSizes['FCFS_vs_MLFQ_overall'] = overallEffect;

  console.log(
    `  전체: t=${overallTest.tValue}, p=${overallTest.pValue}, ` +
    `${overallTest.significant ? '유의 ✓' : '미유의'} | d=${overallEffect.d} (${overallEffect.interpretation})`
  );

  // Short 카테고리 검정
  if (categoryResults.fcfs.short.length > 0 && categoryResults.mlfq.short.length > 0) {
    const shortTest = pairedTTest(categoryResults.fcfs.short, categoryResults.mlfq.short);
    const shortEffect = cohensD(categoryResults.fcfs.short, categoryResults.mlfq.short);
    summary.statisticalTests['FCFS_vs_MLFQ_short'] = shortTest;
    summary.effectSizes['FCFS_vs_MLFQ_short'] = shortEffect;

    // 개선율 계산
    const improvements = categoryResults.fcfs.short.map((fcfsVal, i) => {
      const mlfqVal = categoryResults.mlfq.short[i];
      return ((fcfsVal - mlfqVal) / fcfsVal) * 100;
    });

    summary.mlfqShortImprovement = {
      ...descriptiveStats(improvements),
      unit: '%',
      description: 'MLFQ Short 요청 대기시간 개선율 (FCFS 대비)',
    };

    console.log(
      `  Short: t=${shortTest.tValue}, p=${shortTest.pValue}, ` +
      `${shortTest.significant ? '유의 ✓' : '미유의'} | d=${shortEffect.d} (${shortEffect.interpretation})`
    );
    console.log(
      `\n  MLFQ Short 개선율: ${summary.mlfqShortImprovement.mean}% ` +
      `(95% CI: [${summary.mlfqShortImprovement.ci95.lower}, ${summary.mlfqShortImprovement.ci95.upper}])`
    );
  }

  // Medium, Long 카테고리 검정
  for (const cat of ['medium', 'long']) {
    if (categoryResults.fcfs[cat].length > 0 && categoryResults.mlfq[cat].length > 0) {
      const test = pairedTTest(categoryResults.fcfs[cat], categoryResults.mlfq[cat]);
      const effect = cohensD(categoryResults.fcfs[cat], categoryResults.mlfq[cat]);
      summary.statisticalTests[`FCFS_vs_MLFQ_${cat}`] = test;
      summary.effectSizes[`FCFS_vs_MLFQ_${cat}`] = effect;
    }
  }

  // 요약 저장
  const summaryFile = path.join(OUTPUT_DIR, 'summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

  console.log(`\n결과 저장: ${OUTPUT_DIR}/`);
  console.log(`  - seed-*.json: ${SEEDS.length}개 시드별 결과`);
  console.log(`  - summary.json: 통계 요약`);
  console.log('\n' + '═'.repeat(70));
  console.log('  다중 시드 실험 완료');
  console.log('═'.repeat(70));

  return summary;
}

// 실행
if (require.main === module) {
  runMultiSeedExperiments();
}

module.exports = { runMultiSeedExperiments, SEEDS };
