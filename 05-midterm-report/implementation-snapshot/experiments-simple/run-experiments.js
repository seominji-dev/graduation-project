/**
 * 스케줄러 성능 비교 실험
 *
 * 4개 스케줄러(FCFS, Priority, MLFQ, WFQ)의 성능을 비교 측정
 *
 * 측정 지표:
 * 1. 평균 대기 시간 (Average Wait Time)
 * 2. 평균 처리 시간 (Average Processing Time)
 * 3. 처리량 (Throughput)
 * 4. 공정성 지수 (Jain's Fairness Index) - WFQ만 해당
 */

const {
	FCFSScheduler,
	PriorityScheduler,
	MLFQScheduler,
	WFQScheduler,
	PRIORITY,
} = require("../src-simple/schedulers");

// ============================================
// 실험 설정
// ============================================
const CONFIG = {
	numRequests: 100, // 총 요청 수
	numTenants: 4, // 테넌트 수 (WFQ용)
	processingTimeMin: 10, // 최소 처리 시간 (ms)
	processingTimeMax: 100, // 최대 처리 시간 (ms)
	arrivalInterval: 5, // 요청 도착 간격 (ms)
};

// 테넌트 설정 (WFQ용)
const TENANTS = [
	{ id: "enterprise", tier: "enterprise", weight: 100 },
	{ id: "premium", tier: "premium", weight: 50 },
	{ id: "standard", tier: "standard", weight: 10 },
	{ id: "free", tier: "free", weight: 1 },
];

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 랜덤 정수 생성 (시드 기반)
 */
let seed = 12345;
function seededRandom() {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return seed / 0x7fffffff;
}

function randomInt(min, max) {
	return Math.floor(seededRandom() * (max - min + 1)) + min;
}

/**
 * 랜덤 우선순위 생성
 */
function randomPriority() {
	const priorities = [
		PRIORITY.LOW,
		PRIORITY.NORMAL,
		PRIORITY.HIGH,
		PRIORITY.URGENT,
	];
	const weights = [0.3, 0.4, 0.2, 0.1]; // 확률 가중치
	const rand = seededRandom();
	let sum = 0;
	for (let i = 0; i < weights.length; i++) {
		sum += weights[i];
		if (rand < sum) return priorities[i];
	}
	return PRIORITY.NORMAL;
}

/**
 * 테스트 요청 생성
 */
function generateRequests(count) {
	seed = 12345; // 시드 리셋으로 동일한 요청 세트 생성
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
			estimatedTokens: randomInt(50, 200),
			arrivalTime: arrivalTime, // 상대적 도착 시간
			processingTime: randomInt(
				CONFIG.processingTimeMin,
				CONFIG.processingTimeMax,
			),
		});
		arrivalTime += randomInt(1, CONFIG.arrivalInterval * 2);
	}

	return requests;
}

// ============================================
// 실험 실행 함수
// ============================================

/**
 * FCFS 스케줄러 실험
 */
function runFCFSExperiment(requests) {
	const scheduler = new FCFSScheduler();
	const results = [];
	let currentTime = 0;

	// 모든 요청 추가 (도착 시간 설정)
	for (const req of requests) {
		scheduler.enqueue({ ...req, createdAt: req.arrivalTime });
	}

	// 처리 시뮬레이션
	while (!scheduler.isEmpty()) {
		const req = scheduler.dequeue();
		// 현재 시간이 요청 도착 시간보다 이르면 대기
		currentTime = Math.max(currentTime, req.createdAt);
		const startedAt = currentTime;
		const completedAt = currentTime + req.processingTime;
		const waitTime = startedAt - req.createdAt;

		results.push({
			...req,
			startedAt,
			completedAt,
			waitTime,
		});
		currentTime = completedAt;
	}

	return results;
}

/**
 * Priority 스케줄러 실험
 */
function runPriorityExperiment(requests) {
	const scheduler = new PriorityScheduler();
	const results = [];
	let currentTime = 0;

	// 모든 요청 추가
	for (const req of requests) {
		scheduler.enqueue({ ...req, createdAt: req.arrivalTime });
	}

	// 처리 시뮬레이션
	while (!scheduler.isEmpty()) {
		// aging 시뮬레이션 (실제 PriorityScheduler의 AGING_INTERVAL_MS = 5000ms와 동��)
		for (const qReq of scheduler.queue) {
			const waitTime = currentTime - qReq.createdAt;
			if (waitTime > 5000 && qReq.effectivePriority < PRIORITY.URGENT) {
				qReq.effectivePriority = Math.min(
					qReq.effectivePriority + 1,
					PRIORITY.URGENT,
				);
			}
		}

		const req = scheduler.dequeue();
		currentTime = Math.max(currentTime, req.createdAt);
		const startedAt = currentTime;
		const completedAt = currentTime + req.processingTime;
		const waitTime = startedAt - req.createdAt;

		results.push({
			...req,
			startedAt,
			completedAt,
			waitTime,
		});
		currentTime = completedAt;
	}

	return results;
}

/**
 * MLFQ 스케줄러 실험 (선점형)
 *
 * 타임 퀀텀 기반 선점형 처리:
 * - Q0: 1000ms (1초) - Short 요청
 * - Q1: 3000ms (3초) - Medium 요청
 * - Q2: 8000ms (8초) - Long 요청
 * - Q3: 무제한 - 매우 긴 요청
 *
 * 타임 슬라이스: 500ms 단위로 선점 체크
 */
function runMLFQExperiment(requests) {
	const scheduler = new MLFQScheduler();
	const results = [];
	let currentTime = 0;
	let processCount = 0;
	const TIME_SLICE = 500; // 500ms 단위로 선점 체크

	// 모든 요청 추가
	for (const req of requests) {
		scheduler.enqueue({
			...req,
			createdAt: req.arrivalTime,
			remainingTime: req.processingTime, // 남은 처리 시간 추적
			usedTime: 0,
		});
	}

	// 처리 시뮬레이션 (선점형)
	while (!scheduler.isEmpty()) {
		// 30개마다 boost
		if (processCount > 0 && processCount % 30 === 0) {
			scheduler.boost();
		}

		// 현재 처리 중인 요청이 없으면 다음 요청 선택
		if (!scheduler.currentRequest) {
			const nextReq = scheduler.dequeue();
			if (!nextReq) break;

			currentTime = Math.max(currentTime, nextReq.createdAt);
			nextReq.startedAt = currentTime;
			nextReq.firstStartedAt = nextReq.firstStartedAt || currentTime;
			scheduler.startProcessing(nextReq);
		}

		const currentReq = scheduler.currentRequest;

		// 이번 슬라이스에서 처리할 시간 계산
		const timeSlice = Math.min(TIME_SLICE, currentReq.remainingTime);

		// 시간 진행
		currentTime += timeSlice;
		currentReq.remainingTime -= timeSlice;
		currentReq.usedTime += timeSlice;

		// 선점 체크
		const preemption = scheduler.checkPreemption(timeSlice);

		if (currentReq.remainingTime <= 0) {
			// 요청 완료
			const completed = scheduler.completeCurrentRequest();
			completed.completedAt = currentTime;
			completed.waitTime = completed.firstStartedAt - completed.createdAt;
			completed.totalProcessTime = currentTime - completed.firstStartedAt;

			results.push(completed);
			processCount++;
		} else if (preemption && preemption.shouldPreempt) {
			// 선점 발생 - 하위 큐로 이동
			scheduler.preempt(preemption);
		}
	}

	return results;
}

/**
 * WFQ 스케줄러 실험
 */
function runWFQExperiment(requests) {
	const scheduler = new WFQScheduler();
	const results = [];
	let currentTime = 0;

	// 테넌트 등록
	for (const tenant of TENANTS) {
		scheduler.registerTenant(tenant.id, tenant.tier);
	}

	// 모든 요청 추가
	for (const req of requests) {
		scheduler.enqueue({ ...req, createdAt: req.arrivalTime });
	}

	// 처리 시뮬레이션
	while (!scheduler.isEmpty()) {
		const req = scheduler.dequeue();
		currentTime = Math.max(currentTime, req.createdAt);
		const startedAt = currentTime;
		const completedAt = currentTime + req.processingTime;
		const waitTime = startedAt - req.createdAt;

		results.push({
			...req,
			startedAt,
			completedAt,
			waitTime,
		});
		currentTime = completedAt;
	}

	return {
		results,
		fairnessIndex: scheduler.calculateFairnessIndex(),
		tenantStats: scheduler.getStats(),
	};
}

// ============================================
// 통계 계산
// ============================================

/**
 * 결과 분석
 */
function analyzeResults(results, schedulerName) {
	const waitTimes = results.map((r) => r.waitTime);
	const processingTimes = results.map((r) => r.processingTime);

	const avgWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
	const maxWaitTime = Math.max(...waitTimes);
	const minWaitTime = Math.min(...waitTimes);
	const avgProcessingTime =
		processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;

	// 우선순위별 평균 대기 시간
	const priorityWaitTimes = {};
	for (const p of [
		PRIORITY.LOW,
		PRIORITY.NORMAL,
		PRIORITY.HIGH,
		PRIORITY.URGENT,
	]) {
		const pResults = results.filter((r) => r.priority === p);
		if (pResults.length > 0) {
			priorityWaitTimes[p] =
				pResults.reduce((sum, r) => sum + r.waitTime, 0) / pResults.length;
		}
	}

	// 테넌트별 평균 대기 시간
	const tenantWaitTimes = {};
	for (const tenant of TENANTS) {
		const tResults = results.filter((r) => r.tenantId === tenant.id);
		if (tResults.length > 0) {
			tenantWaitTimes[tenant.id] =
				tResults.reduce((sum, r) => sum + r.waitTime, 0) / tResults.length;
		}
	}

	const totalTime = results[results.length - 1].completedAt;
	const throughput = results.length / (totalTime / 1000); // requests/sec

	return {
		scheduler: schedulerName,
		totalRequests: results.length,
		avgWaitTime: avgWaitTime.toFixed(2),
		maxWaitTime: maxWaitTime.toFixed(2),
		minWaitTime: minWaitTime.toFixed(2),
		avgProcessingTime: avgProcessingTime.toFixed(2),
		throughput: throughput.toFixed(2),
		priorityWaitTimes,
		tenantWaitTimes,
	};
}

// ============================================
// 메인 실행
// ============================================

function main() {
	console.log("═".repeat(60));
	console.log("  LLM 스케줄러 성능 비교 실험");
	console.log("═".repeat(60));
	console.log(`\n실험 설정:`);
	console.log(`  - 총 요청 수: ${CONFIG.numRequests}`);
	console.log(`  - 테넌트 수: ${CONFIG.numTenants}`);
	console.log(
		`  - 처리 시간 범위: ${CONFIG.processingTimeMin}-${CONFIG.processingTimeMax}ms`,
	);
	console.log();

	// 동일한 요청 세트 생성 (공정한 비교를 위해)
	const requests = generateRequests(CONFIG.numRequests);

	// 각 스케줄러 실험 실행
	console.log("실험 진행 중...\n");

	// FCFS
	const fcfsResults = runFCFSExperiment(requests);
	const fcfsStats = analyzeResults(fcfsResults, "FCFS");

	// Priority
	const priorityResults = runPriorityExperiment(requests);
	const priorityStats = analyzeResults(priorityResults, "Priority");

	// MLFQ
	const mlfqResults = runMLFQExperiment(requests);
	const mlfqStats = analyzeResults(mlfqResults, "MLFQ");

	// WFQ
	const wfqData = runWFQExperiment(requests);
	const wfqStats = analyzeResults(wfqData.results, "WFQ");
	wfqStats.fairnessIndex = wfqData.fairnessIndex.toFixed(4);

	// 결과 출력
	console.log("═".repeat(60));
	console.log("  실험 결과 요약");
	console.log("═".repeat(60));

	const allStats = [fcfsStats, priorityStats, mlfqStats, wfqStats];

	console.log("\n[1] 기본 성능 지표\n");
	console.log(
		"스케줄러      | 평균대기(ms) | 최대대기(ms) | 처리량(req/s) | 공정성",
	);
	console.log("-".repeat(70));
	for (const s of allStats) {
		const fairness = s.fairnessIndex || "N/A";
		console.log(
			`${s.scheduler.padEnd(13)} | ${s.avgWaitTime.padStart(11)} | ${s.maxWaitTime.padStart(11)} | ${s.throughput.padStart(13)} | ${fairness}`,
		);
	}

	// FCFS 대비 개선율 계산
	const fcfsWait = parseFloat(fcfsStats.avgWaitTime);
	console.log("\n[2] FCFS 대비 평균 대기 시간 개선율\n");
	for (const s of allStats) {
		if (s.scheduler === "FCFS") continue;
		const wait = parseFloat(s.avgWaitTime);
		const improvement = (((fcfsWait - wait) / fcfsWait) * 100).toFixed(1);
		const sign = improvement >= 0 ? "+" : "";
		console.log(
			`  ${s.scheduler}: ${sign}${improvement}% (${s.avgWaitTime}ms vs ${fcfsStats.avgWaitTime}ms)`,
		);
	}

	// 우선순위별 대기 시간 (Priority 스케줄러)
	console.log("\n[3] Priority 스케줄러 - 우선순위별 평균 대기 시간\n");
	const priorityNames = { 1: "LOW", 2: "NORMAL", 3: "HIGH", 4: "URGENT" };
	for (const [p, wait] of Object.entries(priorityStats.priorityWaitTimes)) {
		console.log(`  ${priorityNames[p].padEnd(8)}: ${wait.toFixed(2)}ms`);
	}

	// FCFS 우선순위별 (비교용)
	console.log("\n[4] FCFS 스케줄러 - 우선순위별 평균 대기 시간 (비교용)\n");
	for (const [p, wait] of Object.entries(fcfsStats.priorityWaitTimes)) {
		console.log(`  ${priorityNames[p].padEnd(8)}: ${wait.toFixed(2)}ms`);
	}

	// 테넌트별 대기 시간 (WFQ 스케줄러)
	console.log("\n[5] WFQ 스케줄러 - 테넌트별 평균 대기 시간\n");
	for (const [tenant, wait] of Object.entries(wfqStats.tenantWaitTimes)) {
		const tenantInfo = TENANTS.find((t) => t.id === tenant);
		console.log(
			`  ${tenant.padEnd(12)} (weight: ${String(tenantInfo.weight).padStart(3)}): ${wait.toFixed(2)}ms`,
		);
	}

	console.log("\n[6] WFQ 공정성 분석\n");
	console.log(`  Jain's Fairness Index: ${wfqStats.fairnessIndex}`);
	console.log(`  (1.0에 가까울수록 공정, 목표: 0.95+)`);

	// JSON 결과 저장
	const experimentResults = {
		config: CONFIG,
		timestamp: new Date().toISOString(),
		results: {
			fcfs: fcfsStats,
			priority: priorityStats,
			mlfq: mlfqStats,
			wfq: { ...wfqStats, tenantDetails: wfqData.tenantStats },
		},
		summary: {
			bestAvgWaitTime: allStats.reduce((best, s) =>
				parseFloat(s.avgWaitTime) < parseFloat(best.avgWaitTime) ? s : best,
			).scheduler,
			bestThroughput: allStats.reduce((best, s) =>
				parseFloat(s.throughput) > parseFloat(best.throughput) ? s : best,
			).scheduler,
		},
	};

	const fs = require("fs");
	const path = require("path");
	const outputPath = path.join(__dirname, "experiment-results.json");
	fs.writeFileSync(outputPath, JSON.stringify(experimentResults, null, 2));
	console.log(`\n결과 파일 저장: ${outputPath}`);

	console.log("\n" + "═".repeat(60));
	console.log("  실험 완료");
	console.log("═".repeat(60));

	return experimentResults;
}

// 실행
if (require.main === module) {
	main();
}

module.exports = { main, generateRequests, analyzeResults, CONFIG };
