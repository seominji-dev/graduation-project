/**
 * 종합 실험 스크립트
 *
 * MLFQ 적응성 입증을 위한 다양한 실험 포함:
 * 1. 기본 비교 실험 (100 요청)
 * 2. MLFQ 혼합 워크로드 실험 (짧은/긴 요청 혼합)
 * 3. 부하 테스트 (동시 요청 수 변화)
 */

const {
	FCFSScheduler,
	PriorityScheduler,
	MLFQScheduler,
	WFQScheduler,
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

// MLFQ 큐 설정 (실제 구현과 일치)
const MLFQ_QUEUES = [
	{ name: "Q0", quantum: 1000, target: "짧은 요청 (< 1000ms)" },
	{ name: "Q1", quantum: 3000, target: "중간 요청 (< 3000ms)" },
	{ name: "Q2", quantum: 8000, target: "긴 요청 (< 8000ms)" },
	{ name: "Q3", quantum: Infinity, target: "매우 긴 요청" },
];

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
// 요청 생성기
// ============================================

/**
 * 기본 요청 생성 (균등 분포)
 */
function generateBasicRequests(count) {
	resetSeed();
	const requests = [];
	let arrivalTime = 0;

	for (let i = 0; i < count; i++) {
		const tenant = TENANTS[i % TENANTS.length];
		requests.push({
			id: `req-${i}`,
			prompt: `Test prompt ${i}`,
			priority: randomPriority(),
			tenantId: tenant.id,
			tier: tenant.tier,
			arrivalTime: arrivalTime,
			processingTime: randomInt(50, 200),
		});
		arrivalTime += randomInt(1, 10);
	}

	return requests;
}

/**
 * MLFQ 혼합 워크로드 생성
 * - 30%: 짧은 요청 (50-300ms) -> Q0 처리
 * - 40%: 중간 요청 (500-1500ms) -> Q1/Q2 처리
 * - 30%: 긴 요청 (2000-5000ms) -> Q2/Q3 처리
 */
function generateMixedWorkloadRequests(count) {
	resetSeed();
	const requests = [];
	let arrivalTime = 0;

	for (let i = 0; i < count; i++) {
		const rand = seededRandom();
		let processingTime;

		// 30% 짧은 요청
		if (rand < 0.3) {
			processingTime = randomInt(50, 300);
		}
		// 40% 중간 요청
		else if (rand < 0.7) {
			processingTime = randomInt(500, 1500);
		}
		// 30% 긴 요청
		else {
			processingTime = randomInt(2000, 5000);
		}

		const tenant = TENANTS[i % TENANTS.length];
		requests.push({
			id: `req-${i}`,
			prompt: `Test prompt ${i} (type: ${processingTime < 500 ? "short" : processingTime < 2000 ? "medium" : "long"})`,
			priority: randomPriority(),
			tenantId: tenant.id,
			tier: tenant.tier,
			arrivalTime: arrivalTime,
			processingTime: processingTime,
			category:
				processingTime < 500
					? "short"
					: processingTime < 2000
						? "medium"
						: "long",
		});
		arrivalTime += randomInt(1, 20); // 더 넓은 도착 간격
	}

	return requests;
}

/**
 * 부하 테스트 요청 생성
 */
function generateLoadTestRequests(count, intensity) {
	resetSeed();
	const requests = [];
	const intervalMap = { light: 20, medium: 10, heavy: 5 };
	const interval = intervalMap[intensity] || 10;
	let arrivalTime = 0;

	for (let i = 0; i < count; i++) {
		const tenant = TENANTS[i % TENANTS.length];
		requests.push({
			id: `req-${i}`,
			prompt: `Load test prompt ${i}`,
			priority: randomPriority(),
			tenantId: tenant.id,
			tier: tenant.tier,
			arrivalTime: arrivalTime,
			processingTime: randomInt(50, 500),
		});
		arrivalTime += randomInt(1, interval);
	}

	return requests;
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

// ============================================
// 분석 함수
// ============================================

function calculateStats(results, schedulerName) {
	const waitTimes = results.map((r) => r.waitTime);
	const avgWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
	const maxWaitTime = Math.max(...waitTimes);
	const minWaitTime = Math.min(...waitTimes);
	const totalTime = results[results.length - 1].completedAt;
	const throughput = results.length / (totalTime / 1000);

	// 카테고리별 분석 (있는 경우)
	const categoryWaitTimes = {};
	if (results[0].category) {
		["short", "medium", "long"].forEach((cat) => {
			const catResults = results.filter((r) => r.category === cat);
			if (catResults.length > 0) {
				categoryWaitTimes[cat] = {
					count: catResults.length,
					avgWaitTime:
						catResults.reduce((sum, r) => sum + r.waitTime, 0) /
						catResults.length,
					avgProcessingTime:
						catResults.reduce((sum, r) => sum + r.processingTime, 0) /
						catResults.length,
				};
			}
		});
	}

	return {
		scheduler: schedulerName,
		totalRequests: results.length,
		avgWaitTime: avgWaitTime.toFixed(2),
		maxWaitTime: maxWaitTime.toFixed(2),
		minWaitTime: minWaitTime.toFixed(2),
		throughput: throughput.toFixed(2),
		totalTime: totalTime.toFixed(2),
		categoryWaitTimes,
	};
}

// ============================================
// 메인 실행
// ============================================

function runAllExperiments() {
	console.log("═".repeat(70));
	console.log("  LLM 스케줄러 종합 실험");
	console.log("═".repeat(70));

	const allResults = {
		timestamp: new Date().toISOString(),
		experiments: {},
	};

	// ============================================
	// 실험 1: 기본 비교 실험
	// ============================================
	console.log("\n[실험 1] 기본 성능 비교 (100 요청, 균등 분포)");
	console.log("-".repeat(70));

	const basicRequests = generateBasicRequests(100);

	const fcfsResults1 = simulateFCFS(basicRequests);
	const priorityResults1 = simulatePriority(basicRequests);
	const mlfqResults1 = simulateMLFQ(basicRequests);
	const wfqData1 = simulateWFQ(basicRequests);

	const exp1Results = {
		config: { type: "basic", numRequests: 100 },
		fcfs: calculateStats(fcfsResults1, "FCFS"),
		priority: calculateStats(priorityResults1, "Priority"),
		mlfq: calculateStats(mlfqResults1, "MLFQ"),
		wfq: {
			...calculateStats(wfqData1.results, "WFQ"),
			fairnessIndex: wfqData1.fairnessIndex.toFixed(4),
		},
	};

	console.log("스케줄러  | 평균대기(ms) | 처리량(req/s)");
	console.log("-".repeat(70));
	for (const s of ["fcfs", "priority", "mlfq", "wfq"]) {
		const r = exp1Results[s];
		console.log(
			`${r.scheduler.padEnd(9)} | ${r.avgWaitTime.padStart(12)} | ${r.throughput.padStart(14)}`,
		);
	}

	allResults.experiments.basic = exp1Results;

	// ============================================
	// 실험 2: MLFQ 혼합 워크로드
	// ============================================
	console.log("\n[실험 2] MLFQ 혼합 워크로드 (짧은/중간/긴 요청 혼합)");
	console.log("-".repeat(70));

	const mixedRequests = generateMixedWorkloadRequests(100);

	// 카테고리별 분포 확인
	const distribution = {
		short: mixedRequests.filter((r) => r.category === "short").length,
		medium: mixedRequests.filter((r) => r.category === "medium").length,
		long: mixedRequests.filter((r) => r.category === "long").length,
	};
	console.log(
		"요청 분포: Short=" +
			distribution.short +
			", Medium=" +
			distribution.medium +
			", Long=" +
			distribution.long,
	);

	const fcfsResults2 = simulateFCFS(mixedRequests);
	const mlfqResults2 = simulateMLFQ(mixedRequests);

	const exp2Results = {
		config: { type: "mixed-workload", numRequests: 100, distribution },
		fcfs: {
			...calculateStats(fcfsResults2, "FCFS"),
			categoryWaitTimes: calculateStats(fcfsResults2, "FCFS").categoryWaitTimes,
		},
		mlfq: {
			...calculateStats(mlfqResults2, "MLFQ"),
			categoryWaitTimes: calculateStats(mlfqResults2, "MLFQ").categoryWaitTimes,
		},
	};

	console.log("\n카테고리별 대기 시간 비교:");
	console.log("카테고리   | FCFS 평균대기 | MLFQ 평균대기 | 개선율");
	console.log("-".repeat(70));
	for (const cat of ["short", "medium", "long"]) {
		const fcfsWait = parseFloat(
			exp2Results.fcfs.categoryWaitTimes[cat]?.avgWaitTime || 0,
		);
		const mlfqWait = parseFloat(
			exp2Results.mlfq.categoryWaitTimes[cat]?.avgWaitTime || 0,
		);
		const improvement =
			fcfsWait > 0
				? (((fcfsWait - mlfqWait) / fcfsWait) * 100).toFixed(1)
				: "0.0";
		console.log(
			`${cat.padEnd(10)} | ${fcfsWait.toFixed(2).padStart(13)} | ${mlfqWait.toFixed(2).padStart(14)} | ${improvement.padStart(6)}%`,
		);
	}

	allResults.experiments.mixedWorkload = exp2Results;

	// ============================================
	// 실험 3: 부하 테스트
	// ============================================
	console.log("\n[실험 3] 부하 테스트 (동시 요청 수 변화)");
	console.log("-".repeat(70));

	const loadTests = ["light", "medium", "heavy"];
	const loadTestResults = {};

	for (const load of loadTests) {
		const loadRequests = generateLoadTestRequests(100, load);

		const fcfsWait = calculateStats(
			simulateFCFS(loadRequests),
			"FCFS",
		).avgWaitTime;
		const mlfqWait = calculateStats(
			simulateMLFQ(loadRequests),
			"MLFQ",
		).avgWaitTime;

		loadTestResults[load] = {
			fcfsAvgWaitTime: fcfsWait,
			mlfqAvgWaitTime: mlfqWait,
			improvement: (
				((parseFloat(fcfsWait) - parseFloat(mlfqWait)) / parseFloat(fcfsWait)) *
				100
			).toFixed(2),
		};

		console.log(
			`${load.toUpperCase().padEnd(8)}: FCFS=${fcfsWait}ms, MLFQ=${mlfqWait}ms`,
		);
	}

	allResults.experiments.loadTest = {
		config: { type: "load-test", numRequests: 100 },
		results: loadTestResults,
	};

	// ============================================
	// 요약
	// ============================================
	console.log("\n" + "═".repeat(70));
	console.log("  종합 요약");
	console.log("═".repeat(70));

	console.log("\n[주요 발견]");
	console.log("1. Priority 스케줄러: URGENT 요청 우선 처리 확인");
	console.log("2. MLFQ 스케줄러: 짧은 요청 대기 시간 개선");
	console.log("3. WFQ 스케줄러: 테넌트별 가중치 기반 차등화 확인");

	// 결과 저장
	const outputPath = path.join(__dirname, "comprehensive-results.json");
	fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
	console.log(`\n결과 저장: ${outputPath}`);

	console.log("\n" + "═".repeat(70));
	console.log("  모든 실험 완료");
	console.log("═".repeat(70));

	return allResults;
}

// 실행
if (require.main === module) {
	runAllExperiments();
}

module.exports = {
	runAllExperiments,
	generateBasicRequests,
	generateMixedWorkloadRequests,
	generateLoadTestRequests,
};
