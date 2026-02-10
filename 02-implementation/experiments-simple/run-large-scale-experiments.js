/**
 * 대규모 실험 스크립트
 *
 * 1,000+ 요청을 사용한 스케줄러 성능 비교 분석
 *
 * 핵심 기능:
 * - 대규모 워크로드 생성 (1,000+ 요청)
 * - 혼합 워크로드: 짧은(33%), 중간(44%), 긴(23%) 요청
 * - 통계 분석: t-test를 사용한 유의성 검증
 * - 기준선(100 요청)과 비교
 * - JSON 결과 출력 및 비교 보고서 생성
 */

const {
	FCFSScheduler,
	PriorityScheduler,
	MLFQScheduler,
	WFQScheduler,
	RateLimiterScheduler,
	PRIORITY,
} = require("../src-simple/schedulers");

const fs = require("fs");
const path = require("path");

// ============================================
// 실험 설정
// ============================================

const TENANTS = [
	{ id: "enterprise", tier: "enterprise", weight: 100 },
	{ id: "premium", tier: "premium", weight: 50 },
	{ id: "standard", tier: "standard", weight: 10 },
	{ id: "free", tier: "free", weight: 1 },
];

// 혼합 워크로드 설정
const WORKLOAD_DISTRIBUTION = {
	SHORT: { percentage: 0.33, minTime: 50, maxTime: 300, name: "short" },
	MEDIUM: { percentage: 0.44, minTime: 500, maxTime: 1500, name: "medium" },
	LONG: { percentage: 0.23, minTime: 2000, maxTime: 5000, name: "long" },
};

const LARGE_SCALE_REQUEST_COUNT = 1000;
const BASELINE_REQUEST_COUNT = 100;

// ============================================
// 유틸리티 함수
// ============================================

let seed = 12345;
function seededRandom() {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return seed / 0x7fffffff;
}

function randomInt(min, max) {
	return Math.floor(seededRandom() * (max - min + 1)) + min;
}

function resetSeed() {
	seed = 12345;
}

function randomPriority() {
	const priorities = [
		PRIORITY.LOW,
		PRIORITY.NORMAL,
		PRIORITY.HIGH,
		PRIORITY.URGENT,
	];
	const weights = [0.3, 0.4, 0.2, 0.1];
	const rand = seededRandom();
	let sum = 0;
	for (let i = 0; i < weights.length; i++) {
		sum += weights[i];
		if (rand < sum) return priorities[i];
	}
	return PRIORITY.NORMAL;
}

// ============================================
// 통계 함수 (t-test)
// ============================================

/**
 * 평균 계산
 */
function mean(values) {
	if (values.length === 0) return 0;
	return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * 표준편차 계산
 */
function standardDeviation(values, avg) {
	if (values.length <= 1) return 0;
	const variance =
		values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
		(values.length - 1);
	return Math.sqrt(variance);
}

/**
 * 독립 표본 t-test (두 그룹 간 평균 차이 검증)
 * H0: 두 그룹의 평균은 같다
 * H1: 두 그룹의 평균은 다르다
 *
 * @param {Array<number>} sample1 - 첫 번째 샘플 데이터
 * @param {Array<number>} sample2 - 두 번째 샘플 데이터
 * @returns {Object} { tValue, pValue, significant: boolean }
 */
function tTest(sample1, sample2) {
	const n1 = sample1.length;
	const n2 = sample2.length;

	if (n1 <= 1 || n2 <= 1) {
		return { tValue: 0, pValue: 1, significant: false };
	}

	const mean1 = mean(sample1);
	const mean2 = mean(sample2);

	const var1 = Math.pow(standardDeviation(sample1, mean1), 2);
	const var2 = Math.pow(standardDeviation(sample2, mean2), 2);

	// Pooled 표준편차 (동일 분산 가정)
	const pooledStdDev = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2));

	// t-값 계산
	const tValue = (mean1 - mean2) / (pooledStdDev * Math.sqrt(1 / n1 + 1 / n2));

	// 자유도
	const degreesOfFreedom = n1 + n2 - 2;

	// p-value 근사 (단측 검정, 정규분포 근사)
	// 간단한 근사: t > 2이면 p < 0.05 (유의수준 5%)
	const absT = Math.abs(tValue);
	let pValue;

	// t-분포에서의 p-value 근사 계산
	// 단순화를 위해 정규분포 근사 사용
	if (absT < 1.96) {
		pValue = 0.1; // 유의하지 않음
	} else if (absT < 2.58) {
		pValue = 0.05; // 유의수준 5%
	} else if (absT < 3.29) {
		pValue = 0.01; // 유의수준 1%
	} else {
		pValue = 0.001; // 매우 유의함
	}

	// 유의성 판정 (p < 0.05)
	const significant = pValue < 0.05;

	return {
		tValue: parseFloat(tValue.toFixed(4)),
		pValue: parseFloat(pValue.toFixed(4)),
		significant,
		degreesOfFreedom,
		mean1: parseFloat(mean1.toFixed(2)),
		mean2: parseFloat(mean2.toFixed(2)),
		diff: parseFloat((mean1 - mean2).toFixed(2)),
		diffPercent: parseFloat((((mean1 - mean2) / mean2) * 100).toFixed(2)),
	};
}

/**
 * Welch's t-test (이분산 가정)
 * 두 샘플의 분산이 다른 경우 사용
 */
function welchTTest(sample1, sample2) {
	const n1 = sample1.length;
	const n2 = sample2.length;

	if (n1 <= 1 || n2 <= 1) {
		return { tValue: 0, pValue: 1, significant: false };
	}

	const mean1 = mean(sample1);
	const mean2 = mean(sample2);

	const var1 = Math.pow(standardDeviation(sample1, mean1), 2);
	const var2 = Math.pow(standardDeviation(sample2, mean2), 2);

	// Welch's t-값
	const tValue = (mean1 - mean2) / Math.sqrt(var1 / n1 + var2 / n2);

	// 자유도 (Welch-Satterthwaite equation)
	const dofNum = Math.pow(var1 / n1 + var2 / n2, 2);
	const dofDenom =
		Math.pow(var1 / n1, 2) / (n1 - 1) +
		Math.pow(var2 / n2, 2) / (n2 - 1);
	const degreesOfFreedom = dofNum / dofDenom;

	// p-value 근사
	const absT = Math.abs(tValue);
	let pValue;

	if (absT < 1.96) {
		pValue = 0.1;
	} else if (absT < 2.58) {
		pValue = 0.05;
	} else if (absT < 3.29) {
		pValue = 0.01;
	} else {
		pValue = 0.001;
	}

	const significant = pValue < 0.05;

	return {
		tValue: parseFloat(tValue.toFixed(4)),
		pValue: parseFloat(pValue.toFixed(4)),
		significant,
		degreesOfFreedom: parseFloat(degreesOfFreedom.toFixed(2)),
		mean1: parseFloat(mean1.toFixed(2)),
		mean2: parseFloat(mean2.toFixed(2)),
		diff: parseFloat((mean1 - mean2).toFixed(2)),
		diffPercent: parseFloat((((mean1 - mean2) / mean2) * 100).toFixed(2)),
	};
}

// ============================================
// 요청 생성기
// ============================================

/**
 * 대규모 혼합 워크로드 생성
 * - 33%: 짧은 요청 (50-300ms)
 * - 44%: 중간 요청 (500-1500ms)
 * - 23%: 긴 요청 (2000-5000ms)
 */
function generateLargeScaleWorkload(count) {
	resetSeed();
	const requests = [];
	let arrivalTime = 0;

	const shortCount = Math.floor(count * WORKLOAD_DISTRIBUTION.SHORT.percentage);
	const mediumCount = Math.floor(count * WORKLOAD_DISTRIBUTION.MEDIUM.percentage);
	const longCount = count - shortCount - mediumCount;

	let shortCreated = 0;
	let mediumCreated = 0;
	let longCreated = 0;

	for (let i = 0; i < count; i++) {
		let processingTime;
		let category;

		// 카테고리별 할당
		if (shortCreated < shortCount) {
			processingTime = randomInt(
				WORKLOAD_DISTRIBUTION.SHORT.minTime,
				WORKLOAD_DISTRIBUTION.SHORT.maxTime,
			);
			category = "short";
			shortCreated++;
		} else if (mediumCreated < mediumCount) {
			processingTime = randomInt(
				WORKLOAD_DISTRIBUTION.MEDIUM.minTime,
				WORKLOAD_DISTRIBUTION.MEDIUM.maxTime,
			);
			category = "medium";
			mediumCreated++;
		} else {
			processingTime = randomInt(
				WORKLOAD_DISTRIBUTION.LONG.minTime,
				WORKLOAD_DISTRIBUTION.LONG.maxTime,
			);
			category = "long";
			longCreated++;
		}

		const tenant = TENANTS[i % TENANTS.length];
		requests.push({
			id: `req-${i}`,
			prompt: `Large scale test prompt ${i} (${category})`,
			priority: randomPriority(),
			tenantId: tenant.id,
			tier: tenant.tier,
			arrivalTime: arrivalTime,
			processingTime: processingTime,
			category: category,
		});

		// 도착 간격: 더 다양한 분포
		arrivalTime += randomInt(1, 15);
	}

	return requests;
}

/**
 * 기준선 워크로드 생성 (100 요청)
 */
function generateBaselineWorkload() {
	return generateLargeScaleWorkload(BASELINE_REQUEST_COUNT);
}

// ============================================
// 시뮬레이터
// ============================================

/**
 * FCFS 시뮬레이션
 */
function simulateFCFS(requests) {
	const scheduler = new FCFSScheduler();
	const results = [];
	let currentTime = 0;

	for (const req of requests) {
		scheduler.enqueue({ ...req, createdAt: req.arrivalTime });
	}

	while (!scheduler.isEmpty()) {
		const req = scheduler.dequeue();
		currentTime = Math.max(currentTime, req.createdAt);
		const waitTime = currentTime - req.createdAt;
		results.push({
			...req,
			waitTime,
			completedAt: currentTime + req.processingTime,
		});
		currentTime += req.processingTime;
	}

	return results;
}

/**
 * Priority 시뮬레이션
 */
function simulatePriority(requests) {
	const scheduler = new PriorityScheduler();
	const results = [];
	let currentTime = 0;

	for (const req of requests) {
		scheduler.enqueue({ ...req, createdAt: req.arrivalTime });
	}

	while (!scheduler.isEmpty()) {
		// Aging 시뮬레이션
		for (const qReq of scheduler.queue) {
			const waitTime = currentTime - qReq.createdAt;
			if (waitTime > 500 && qReq.effectivePriority < PRIORITY.URGENT) {
				qReq.effectivePriority = Math.min(
					qReq.effectivePriority + 1,
					PRIORITY.URGENT,
				);
			}
		}

		const req = scheduler.dequeue();
		currentTime = Math.max(currentTime, req.createdAt);
		const waitTime = currentTime - req.createdAt;
		results.push({
			...req,
			waitTime,
			completedAt: currentTime + req.processingTime,
		});
		currentTime += req.processingTime;
	}

	return results;
}

/**
 * MLFQ 시뮬레이션
 */
function simulateMLFQ(requests) {
	const scheduler = new MLFQScheduler();
	const results = [];
	let currentTime = 0;
	let processCount = 0;

	for (const req of requests) {
		scheduler.enqueue({ ...req, createdAt: req.arrivalTime });
	}

	while (!scheduler.isEmpty()) {
		// 주기적 부스팅 (30개마다)
		if (processCount > 0 && processCount % 30 === 0) {
			scheduler.boost();
		}

		const req = scheduler.dequeue();
		currentTime = Math.max(currentTime, req.createdAt);
		const waitTime = currentTime - req.createdAt;
		results.push({
			...req,
			waitTime,
			completedAt: currentTime + req.processingTime,
		});

		// 피드백 적용
		scheduler.feedback(req, req.processingTime);
		currentTime += req.processingTime;
		processCount++;
	}

	return results;
}

/**
 * WFQ 시뮬레이션
 */
function simulateWFQ(requests) {
	const scheduler = new WFQScheduler();
	const results = [];
	let currentTime = 0;

	for (const tenant of TENANTS) {
		scheduler.registerTenant(tenant.id, tenant.tier);
	}

	for (const req of requests) {
		scheduler.enqueue({ ...req, createdAt: req.arrivalTime });
	}

	while (!scheduler.isEmpty()) {
		const req = scheduler.dequeue();
		currentTime = Math.max(currentTime, req.createdAt);
		const waitTime = currentTime - req.createdAt;
		results.push({
			...req,
			waitTime,
			completedAt: currentTime + req.processingTime,
		});
		currentTime += req.processingTime;
	}

	return {
		results,
		fairnessIndex: scheduler.calculateFairnessIndex(),
		tenantStats: scheduler.getStats(),
	};
}

/**
 * RateLimiter 시뮬레이션
 * Token Bucket 알고리즘 기반 속도 제어
 */
function simulateRateLimiter(requests, config = { refillRate: 100, bucketCapacity: 200 }) {
	const scheduler = new RateLimiterScheduler(config);
	const results = [];
	let currentTime = 0;
	let deniedCount = 0;

	// 모든 요청을 큐에 추가
	for (const req of requests) {
		const result = scheduler.enqueue({ ...req, createdAt: req.arrivalTime });
		if (!result.allowed) {
			deniedCount++;
		}
	}

	// 허용된 요청만 처리
	while (!scheduler.isEmpty()) {
		const req = scheduler.dequeue();
		if (!req) break;

		currentTime = Math.max(currentTime, req.createdAt);
		const waitTime = currentTime - req.createdAt;
		results.push({
			...req,
			waitTime,
			completedAt: currentTime + req.processingTime,
		});
		currentTime += req.processingTime;
	}

	scheduler.stopRefilling();

	return {
		results,
		stats: scheduler.getStats(),
		deniedCount,
	};
}

// ============================================
// 분석 함수
// ============================================

/**
 * 기본 통계 계산
 */
function calculateStats(results, schedulerName) {
	const waitTimes = results.map((r) => r.waitTime);
	const avgWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
	const maxWaitTime = Math.max(...waitTimes);
	const minWaitTime = Math.min(...waitTimes);
	const totalTime = results[results.length - 1].completedAt;
	const throughput = results.length / (totalTime / 1000);

	// 표준편차
	const stdDev = standardDeviation(waitTimes, avgWaitTime);

	// 백분위수
	const sortedWaitTimes = [...waitTimes].sort((a, b) => a - b);
	const p50 = sortedWaitTimes[Math.floor(sortedWaitTimes.length * 0.5)];
	const p95 = sortedWaitTimes[Math.floor(sortedWaitTimes.length * 0.95)];
	const p99 = sortedWaitTimes[Math.floor(sortedWaitTimes.length * 0.99)];

	// 카테고리별 분석
	const categoryStats = {};
	for (const cat of ["short", "medium", "long"]) {
		const catResults = results.filter((r) => r.category === cat);
		if (catResults.length > 0) {
			const catWaitTimes = catResults.map((r) => r.waitTime);
			categoryStats[cat] = {
				count: catResults.length,
				avgWaitTime: mean(catWaitTimes),
				minWaitTime: Math.min(...catWaitTimes),
				maxWaitTime: Math.max(...catWaitTimes),
				stdDev: standardDeviation(catWaitTimes, mean(catWaitTimes)),
			};
		}
	}

	return {
		scheduler: schedulerName,
		totalRequests: results.length,
		avgWaitTime: parseFloat(avgWaitTime.toFixed(2)),
		maxWaitTime: parseFloat(maxWaitTime.toFixed(2)),
		minWaitTime: parseFloat(minWaitTime.toFixed(2)),
		stdDev: parseFloat(stdDev.toFixed(2)),
		p50: parseFloat(p50.toFixed(2)),
		p95: parseFloat(p95.toFixed(2)),
		p99: parseFloat(p99.toFixed(2)),
		throughput: parseFloat(throughput.toFixed(2)),
		totalTime: parseFloat(totalTime.toFixed(2)),
		categoryStats,
	};
}

/**
 * t-test 분석 수행
 */
function performTTestAnalysis(baselineResults, largeScaleResults, schedulerName) {
	const baselineWaitTimes = baselineResults.map((r) => r.waitTime);
	const largeScaleWaitTimes = largeScaleResults.map((r) => r.waitTime);

	// Welch's t-test (이분산 가정)
	const tTestResult = welchTTest(baselineWaitTimes, largeScaleWaitTimes);

	return {
		scheduler: schedulerName,
		baseline: {
			count: baselineWaitTimes.length,
			avgWaitTime: parseFloat(mean(baselineWaitTimes).toFixed(2)),
			stdDev: parseFloat(
				standardDeviation(baselineWaitTimes, mean(baselineWaitTimes)).toFixed(2),
			),
		},
		largeScale: {
			count: largeScaleWaitTimes.length,
			avgWaitTime: parseFloat(mean(largeScaleWaitTimes).toFixed(2)),
			stdDev: parseFloat(
				standardDeviation(largeScaleWaitTimes, mean(largeScaleWaitTimes)).toFixed(
					2,
				),
			),
		},
		tTest: tTestResult,
	};
}

// ============================================
// 메인 실행
// ============================================

function runLargeScaleExperiments() {
	console.log("═".repeat(70));
	console.log("  대규모 LLM 스케줄러 실험 (1,000+ 요청)");
	console.log("═".repeat(70));

	const timestamp = new Date().toISOString();
	const allResults = {
		timestamp,
		experiments: {},
	};

	// ============================================
	// 실험 1: 기준선 실험 (100 요청)
	// ============================================
	console.log("\n[실험 1] 기준선 성능 측정 (100 요청)");
	console.log("-".repeat(70));

	const baselineRequests = generateBaselineWorkload();

	// 워크로드 분포 확인
	const baselineDistribution = {
		short: baselineRequests.filter((r) => r.category === "short").length,
		medium: baselineRequests.filter((r) => r.category === "medium").length,
		long: baselineRequests.filter((r) => r.category === "long").length,
	};
	console.log(
		`요청 분포: Short=${baselineDistribution.short}, ` +
			`Medium=${baselineDistribution.medium}, Long=${baselineDistribution.long}`,
	);

	const fcfsBaseline = simulateFCFS(baselineRequests);
	const priorityBaseline = simulatePriority(baselineRequests);
	const mlfqBaseline = simulateMLFQ(baselineRequests);
	const wfqBaselineData = simulateWFQ(baselineRequests);
	const rateLimiterBaselineData = simulateRateLimiter(baselineRequests);

	console.log("스케줄러     | 평균대기(ms) | 처리량(req/s) | 허용률");
	console.log("-".repeat(70));

	const baselineStats = {
		fcfs: calculateStats(fcfsBaseline, "FCFS"),
		priority: calculateStats(priorityBaseline, "Priority"),
		mlfq: calculateStats(mlfqBaseline, "MLFQ"),
		wfq: calculateStats(wfqBaselineData.results, "WFQ"),
		rateLimiter: {
			...calculateStats(rateLimiterBaselineData.results, "RateLimiter"),
			denied: rateLimiterBaselineData.deniedCount,
			allowRate: rateLimiterBaselineData.stats.allowRate,
		},
	};

	for (const s of ["fcfs", "priority", "mlfq", "wfq", "rateLimiter"]) {
		const r = baselineStats[s];
		const allowRate = r.allowRate || "100%";
		console.log(
			`${r.scheduler.padEnd(11)} | ${String(r.avgWaitTime).padStart(12)} | ${String(r.throughput).padStart(14)} | ${allowRate.padStart(7)}`,
		);
	}

	// ============================================
	// 실험 2: 대규모 실험 (1,000 요청)
	// ============================================
	console.log("\n[실험 2] 대규모 성능 측정 (1,000 요청)");
	console.log("-".repeat(70));

	const largeScaleRequests = generateLargeScaleWorkload(LARGE_SCALE_REQUEST_COUNT);

	// 워크로드 분포 확인
	const largeScaleDistribution = {
		short: largeScaleRequests.filter((r) => r.category === "short").length,
		medium: largeScaleRequests.filter((r) => r.category === "medium").length,
		long: largeScaleRequests.filter((r) => r.category === "long").length,
	};
	console.log(
		`요청 분포: Short=${largeScaleDistribution.short}, ` +
			`Medium=${largeScaleDistribution.medium}, Long=${largeScaleDistribution.long}`,
	);

	const fcfsLarge = simulateFCFS(largeScaleRequests);
	const priorityLarge = simulatePriority(largeScaleRequests);
	const mlfqLarge = simulateMLFQ(largeScaleRequests);
	const wfqLargeData = simulateWFQ(largeScaleRequests);
	const rateLimiterLargeData = simulateRateLimiter(largeScaleRequests);

	console.log("스케줄러     | 평균대기(ms) | 처리량(req/s) | 허용률");
	console.log("-".repeat(70));

	const largeScaleStats = {
		fcfs: calculateStats(fcfsLarge, "FCFS"),
		priority: calculateStats(priorityLarge, "Priority"),
		mlfq: calculateStats(mlfqLarge, "MLFQ"),
		wfq: calculateStats(wfqLargeData.results, "WFQ"),
		rateLimiter: {
			...calculateStats(rateLimiterLargeData.results, "RateLimiter"),
			denied: rateLimiterLargeData.deniedCount,
			allowRate: rateLimiterLargeData.stats.allowRate,
		},
	};

	for (const s of ["fcfs", "priority", "mlfq", "wfq", "rateLimiter"]) {
		const r = largeScaleStats[s];
		const allowRate = r.allowRate || "100%";
		console.log(
			`${r.scheduler.padEnd(11)} | ${String(r.avgWaitTime).padStart(12)} | ${String(r.throughput).padStart(14)} | ${allowRate.padStart(7)}`,
		);
	}

	// ============================================
	// 실험 3: t-test 통계 분석
	// ============================================
	console.log("\n[실험 3] 통계적 유의성 검증 (t-test)");
	console.log("-".repeat(70));

	const tTestResults = {
		fcfs: performTTestAnalysis(fcfsBaseline, fcfsLarge, "FCFS"),
		priority: performTTestAnalysis(priorityBaseline, priorityLarge, "Priority"),
		mlfq: performTTestAnalysis(mlfqBaseline, mlfqLarge, "MLFQ"),
		wfq: performTTestAnalysis(
			wfqBaselineData.results,
			wfqLargeData.results,
			"WFQ",
		),
	};

	console.log("스케줄러  | 기준선평균 | 대규모평균 | t-값  | p-값 | 유의함");
	console.log("-".repeat(70));

	for (const s of ["fcfs", "priority", "mlfq", "wfq"]) {
		const r = tTestResults[s];
		const significant = r.tTest.significant ? "*" : " ";
		console.log(
			`${r.scheduler.padEnd(9)} | ` +
				`${r.tTest.mean1.toString().padStart(10)} | ` +
				`${r.tTest.mean2.toString().padStart(10)} | ` +
				`${r.tTest.tValue.toString().padStart(6)} | ` +
				`${r.tTest.pValue.toString().padStart(4)} | ` +
				`${significant}`,
		);
	}
	console.log("*: p < 0.05 (유의수준 5%에서 통계적으로 유의함)");

	// ============================================
	// 실험 4: 카테고리별 분석
	// ============================================
	console.log("\n[실험 4] 카테고리별 성능 분석 (대규모)");
	console.log("-".repeat(70));

	console.log("\nFCFS 카테고리별 대기 시간:");
	console.log("카테고리 | 개수  | 평균대기(ms) | 최소 | 최대 | 표준편차");
	console.log("-".repeat(70));
	for (const cat of ["short", "medium", "long"]) {
		const catStats = largeScaleStats.fcfs.categoryStats[cat];
		if (catStats) {
			console.log(
				`${cat.padEnd(9)} | ` +
					`${catStats.count.toString().padStart(5)} | ` +
					`${catStats.avgWaitTime.toFixed(2).padStart(12)} | ` +
					`${catStats.minWaitTime.toFixed(2).padStart(4)} | ` +
					`${catStats.maxWaitTime.toFixed(2).padStart(4)} | ` +
					`${catStats.stdDev.toFixed(2).padStart(8)}`,
			);
		}
	}

	console.log("\nMLFQ 카테고리별 대기 시간:");
	console.log("카테고리 | 개수  | 평균대기(ms) | 최소 | 최대 | 표준편차");
	console.log("-".repeat(70));
	for (const cat of ["short", "medium", "long"]) {
		const catStats = largeScaleStats.mlfq.categoryStats[cat];
		if (catStats) {
			console.log(
				`${cat.padEnd(9)} | ` +
					`${catStats.count.toString().padStart(5)} | ` +
					`${catStats.avgWaitTime.toFixed(2).padStart(12)} | ` +
					`${catStats.minWaitTime.toFixed(2).padStart(4)} | ` +
					`${catStats.maxWaitTime.toFixed(2).padStart(4)} | ` +
					`${catStats.stdDev.toFixed(2).padStart(8)}`,
			);
		}
	}

	// 카테고리별 개선율 계산
	console.log("\n카테고리별 개선율 (MLFQ vs FCFS):");
	console.log("카테고리 | FCFS평균 | MLFQ평균 | 개선율");
	console.log("-".repeat(70));
	for (const cat of ["short", "medium", "long"]) {
		const fcfsCat = largeScaleStats.fcfs.categoryStats[cat];
		const mlfqCat = largeScaleStats.mlfq.categoryStats[cat];
		if (fcfsCat && mlfqCat) {
			const improvement =
				((fcfsCat.avgWaitTime - mlfqCat.avgWaitTime) / fcfsCat.avgWaitTime) *
				100;
			console.log(
				`${cat.padEnd(9)} | ` +
					`${fcfsCat.avgWaitTime.toFixed(2).padStart(10)} | ` +
					`${mlfqCat.avgWaitTime.toFixed(2).padStart(10)} | ` +
					`${improvement.toFixed(1).padStart(6)}%`,
			);
		}
	}

	// ============================================
	// 결과 저장
	// ============================================

	allResults.experiments = {
		baseline: {
			config: {
				type: "baseline",
				numRequests: BASELINE_REQUEST_COUNT,
				distribution: baselineDistribution,
			},
			stats: baselineStats,
		},
		largeScale: {
			config: {
				type: "large-scale",
				numRequests: LARGE_SCALE_REQUEST_COUNT,
				distribution: largeScaleDistribution,
			},
			stats: largeScaleStats,
		},
		tTest: tTestResults,
		summary: {
			workload: WORKLOAD_DISTRIBUTION,
			conclusions: generateConclusions(tTestResults, largeScaleStats),
		},
	};

	const outputPath = path.join(__dirname, "large-scale-results.json");
	fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
	console.log(`\n결과 저장: ${outputPath}`);

	// ============================================
	// 요약 보고서
	// ============================================
	console.log("\n" + "═".repeat(70));
	console.log("  실험 요약");
	console.log("═".repeat(70));

	console.log("\n[주요 발견]");
	console.log("1. 대규모 워크로드에서의 성능 특성 확인");
	console.log("2. 기준선과 대규모 간 통계적 유의성 검증");
	console.log("3. 카테고리별 성능 분석 완료");

	console.log("\n[통계적 유의성]");
	for (const s of ["fcfs", "priority", "mlfq", "wfq"]) {
		const r = tTestResults[s];
		const sigText = r.tTest.significant
			? "유의함 (p < 0.05)"
			: "유의하지 않음";
		console.log(
			`- ${r.scheduler}: ${sigText} (t=${r.tTest.tValue}, p=${r.tTest.pValue})`,
		);
	}

	console.log("\n" + "═".repeat(70));
	console.log("  대규모 실험 완료");
	console.log("═".repeat(70));

	return allResults;
}

/**
 * 실험 결론 생성
 */
function generateConclusions(tTestResults, largeScaleStats) {
	const conclusions = [];

	// 스케일ability 분석
	for (const s of ["fcfs", "priority", "mlfq", "wfq"]) {
		const r = tTestResults[s];
		if (r.tTest.significant) {
			const direction = r.tTest.diff > 0 ? "증가" : "감소";
			conclusions.push(
				`${r.scheduler}: 대규모에서 평균 대기 시간 ${direction} ` +
					`(${r.tTest.diffPercent.toFixed(1)}%, 통계적으로 유의함)`,
			);
		} else {
			conclusions.push(
				`${r.scheduler}: 기준선과 대규모 간 통계적으로 유의한 차이 없음`,
			);
		}
	}

	// MLFQ 카테고리별 장점
	if (largeScaleStats.mlfq.categoryStats.short) {
		const shortImprovement =
			((largeScaleStats.fcfs.categoryStats.short.avgWaitTime -
				largeScaleStats.mlfq.categoryStats.short.avgWaitTime) /
				largeScaleStats.fcfs.categoryStats.short.avgWaitTime) *
			100;
		conclusions.push(
			`MLFQ는 짧은 요청에서 ${shortImprovement.toFixed(1)}% 개선 효과`,
		);
	}

	return conclusions;
}

// 실행
if (require.main === module) {
	runLargeScaleExperiments();
}

module.exports = {
	runLargeScaleExperiments,
	generateLargeScaleWorkload,
	generateBaselineWorkload,
	tTest,
	welchTTest,
};
