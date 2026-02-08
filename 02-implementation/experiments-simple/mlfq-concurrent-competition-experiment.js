#!/usr/bin/env node
/**
 * MLFQ Concurrent Request Competition Experiment
 *
 * This experiment creates a true concurrent request competition environment
 * where multiple requests arrive at similar times, allowing MLFQ's adaptive
 * queue management to demonstrate its advantages over FCFS.
 *
 * Key Differences from Basic Experiment:
 * 1. Requests arrive in bursts (concurrently) rather than sequentially
 * 2. Time-sliced processing with preemption
 * 3. Queue demotion during processing (Q0 → Q1 → Q2)
 * 4. Short requests can jump ahead of long requests
 *
 * Expected Results:
 * - Short requests (Interactive): Significant improvement in MLFQ
 * - Medium requests: Moderate improvement
 * - Long requests (Batch): May be slightly worse in MLFQ (fair trade-off)
 */

const {
	MLFQScheduler,
	TIME_QUANTUM,
	NUM_QUEUES,
	TIME_SLICE_MS,
} = require("../src-simple/schedulers/MLFQScheduler");
const { FCFSScheduler } = require("../src-simple/schedulers");

const fs = require("fs");
const path = require("path");

// ============================================
// Experiment Configuration
// ============================================

const CONFIG = {
	numBursts: 5, // Number of request bursts
	requestsPerBurst: 20, // Requests per burst (기본: 100 requests = 5 × 20)
	timeSliceMs: 500, // Time slice for processing (same as MLFQ TIME_SLICE_MS)
	// Request processing time ranges (ms)
	shortRequestRange: [100, 800], // Completes in Q0 quantum (1000ms)
	mediumRequestRange: [1200, 4000], // Needs Q1 quantum (3000ms)
	longRequestRange: [5000, 10000], // Needs Q2 quantum (8000ms)
	// Scale mode: command line argument to scale up requests
	scaleMode: process.argv[2] === "scale" ? 500 : 100, // 100 or 500 requests
};

// Adjust configuration based on scale mode
if (CONFIG.scaleMode === 500) {
	CONFIG.numBursts = 25; // 25 bursts × 20 requests = 500 requests
}

// ============================================
// Utility Functions
// ============================================

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a burst of concurrent requests
 * All requests in a burst have arrivalTime = burstTime
 */
function generateBurst(burstId, burstTime) {
	const requests = [];
	const distribution = ["short", "short", "medium", "medium", "long"]; // 40% short, 40% medium, 20% long

	for (let i = 0; i < CONFIG.requestsPerBurst; i++) {
		const type = distribution[Math.floor(Math.random() * distribution.length)];
		let processingTime;
		let category;

		switch (type) {
			case "short":
				processingTime = randomInt(...CONFIG.shortRequestRange);
				category = "short";
				break;
			case "medium":
				processingTime = randomInt(...CONFIG.mediumRequestRange);
				category = "medium";
				break;
			case "long":
				processingTime = randomInt(...CONFIG.longRequestRange);
				category = "long";
				break;
		}

		requests.push({
			id: `burst-${burstId}-req-${i}`,
			prompt: `${type.toUpperCase()} request ${i}`,
			category: category,
			processingTime: processingTime,
			remainingTime: processingTime,
			burstId: burstId,
			arrivalTime: burstTime,
			createdAt: burstTime,
		});
	}

	return requests;
}

/**
 * Generate all request bursts
 */
function generateBursts() {
	const allRequests = [];
	let currentTime = 0;

	for (let i = 0; i < CONFIG.numBursts; i++) {
		const burst = generateBurst(i, currentTime);
		allRequests.push(...burst);
		// Gap between bursts (allows some processing to happen)
		currentTime += 2000; // 2 second gap
	}

	return allRequests;
}

// ============================================
// FCFS Simulation (Baseline)
// ============================================

/**
 * Simulate FCFS with concurrent requests
 * Note: FCFS cannot take advantage of concurrent arrival
 */
function simulateFCFSConcurrent(requests) {
	const scheduler = new FCFSScheduler();
	const results = [];
	let currentTime = 0;

	// Sort by arrival time, then by ID for deterministic order
	const sortedRequests = [...requests].sort((a, b) => {
		if (a.arrivalTime !== b.arrivalTime) {
			return a.arrivalTime - b.arrivalTime;
		}
		return a.id.localeCompare(b.id);
	});

	// Add all requests to queue
	for (const req of sortedRequests) {
		scheduler.enqueue({ ...req });
	}

	// Process all requests
	while (!scheduler.isEmpty()) {
		const req = scheduler.dequeue();
		// Wait until request arrives
		currentTime = Math.max(currentTime, req.arrivalTime);
		const startedAt = currentTime;
		const completedAt = currentTime + req.processingTime;
		const waitTime = startedAt - req.arrivalTime;

		results.push({
			...req,
			startedAt,
			completedAt,
			waitTime,
			responseTime: completedAt - req.arrivalTime,
		});

		currentTime = completedAt;
	}

	return results;
}

// ============================================
// MLFQ Preemptive Simulation
// ============================================

/**
 * Simulate MLFQ with time-sliced preemptive processing
 * This is where MLFQ's advantages should be demonstrated
 */
function simulateMLFQPreemptive(requests) {
	const scheduler = new MLFQScheduler();
	const results = [];
	let currentTime = 0;
	let completedCount = 0;
	const totalRequests = requests.length;

	// Track queue history for analysis
	const queueHistory = [];

	// Add all requests to MLFQ (all start at Q0)
	for (const req of requests) {
		scheduler.enqueue({
			...req,
			usedTime: 0, // Initialize usedTime
		});
	}

	// Process with time slicing
	while (completedCount < totalRequests) {
		// Check if we need to get next request
		if (!scheduler.getCurrentRequest()) {
			const nextReq = scheduler.dequeue();
			if (nextReq) {
				scheduler.startProcessing(nextReq);
			} else if (!scheduler.isEmpty()) {
				// Shouldn't happen, but safety check
				break;
			} else {
				// No more requests
				break;
			}
		}

		const currentReq = scheduler.getCurrentRequest();

		// Calculate time slice
		const timeSlice = Math.min(CONFIG.timeSliceMs, currentReq.remainingTime);

		// Advance time
		currentTime += timeSlice;
		currentReq.remainingTime -= timeSlice;
		currentReq.usedTime += timeSlice; // Update usedTime for preemption check

		// Also update scheduler's internal usedTime for checkPreemption
		scheduler.currentRequestUsedTime = currentReq.usedTime;

		// Check for preemption
		const preemption = scheduler.checkPreemption(timeSlice);

		if (currentReq.remainingTime <= 0) {
			// Request completed
			const completed = scheduler.completeCurrentRequest();
			completed.completedAt = currentTime;
			completed.waitTime = currentTime - completed.arrivalTime;
			completed.responseTime = completed.completedAt - completed.arrivalTime;
			results.push(completed);
			completedCount++;

			// Record final queue level for analysis
			completed.finalQueueLevel = completed.queueLevel || 0;
		} else if (preemption && preemption.shouldPreempt) {
			// Request preempted - move to lower queue
			currentReq.remainingTime = currentReq.remainingTime; // Preserve remaining time
			scheduler.preempt(preemption);

			// Record preemption event
			queueHistory.push({
				time: currentTime,
				event: "preemption",
				requestId: currentReq.id,
				fromQueue: preemption.newQueueLevel - 1,
				toQueue: preemption.newQueueLevel,
			});
		}

		// Periodically boost (every 5 seconds of simulation time)
		if (currentTime > 0 && currentTime % 5000 < CONFIG.timeSliceMs) {
			const beforeBoost = scheduler.queues.map((q) => q.length);
			scheduler.boost();
			const afterBoost = scheduler.queues.map((q) => q.length);

			if (beforeBoost.some((len, i) => len !== afterBoost[i])) {
				queueHistory.push({
					time: currentTime,
					event: "boost",
					before: beforeBoost,
					after: afterBoost,
				});
			}
		}
	}

	return {
		results,
		queueHistory,
	};
}

// ============================================
// Analysis Functions
// ============================================

/**
 * Calculate statistics from results
 */
function calculateStats(results, schedulerName) {
	if (results.length === 0) {
		return {
			scheduler: schedulerName,
			totalRequests: 0,
			avgWaitTime: 0,
			avgResponseTime: 0,
			maxWaitTime: 0,
			minWaitTime: 0,
			throughput: 0,
			categoryStats: {},
		};
	}

	const waitTimes = results.map((r) => r.waitTime);
	const responseTimes = results.map((r) => r.responseTime);
	const avgWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
	const avgResponseTime =
		responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
	const maxWaitTime = Math.max(...waitTimes);
	const minWaitTime = Math.min(...waitTimes);
	const totalTime = Math.max(...results.map((r) => r.completedAt));
	const throughput = results.length / (totalTime / 1000);

	// Category-specific statistics
	const categoryStats = {};
	for (const category of ["short", "medium", "long"]) {
		const catResults = results.filter((r) => r.category === category);
		if (catResults.length > 0) {
			const catWaitTimes = catResults.map((r) => r.waitTime);
			categoryStats[category] = {
				count: catResults.length,
				avgWaitTime:
					catWaitTimes.reduce((a, b) => a + b, 0) / catWaitTimes.length,
				maxWaitTime: Math.max(...catWaitTimes),
				minWaitTime: Math.min(...catWaitTimes),
				avgProcessingTime:
					catResults.reduce((sum, r) => sum + r.processingTime, 0) /
					catResults.length,
			};
		}
	}

	return {
		scheduler: schedulerName,
		totalRequests: results.length,
		avgWaitTime: avgWaitTime.toFixed(2),
		avgResponseTime: avgResponseTime.toFixed(2),
		maxWaitTime: maxWaitTime.toFixed(2),
		minWaitTime: minWaitTime.toFixed(2),
		throughput: throughput.toFixed(2),
		totalTime: totalTime.toFixed(2),
		categoryStats,
	};
}

/**
 * Compare FCFS vs MLFQ results
 */
function compareResults(fcfsResults, mlfqData) {
	const mlfqResults = mlfqData.results;
	const fcfsStats = calculateStats(fcfsResults, "FCFS");
	const mlfqStats = calculateStats(mlfqResults, "MLFQ");

	const comparison = {
		fcfs: fcfsStats,
		mlfq: mlfqStats,
		improvements: {},
		queueHistory: mlfqData.queueHistory,
	};

	// Calculate improvements for each category
	for (const category of ["short", "medium", "long"]) {
		if (
			fcfsStats.categoryStats[category] &&
			mlfqStats.categoryStats[category]
		) {
			const fcfsWait = fcfsStats.categoryStats[category].avgWaitTime;
			const mlfqWait = mlfqStats.categoryStats[category].avgWaitTime;
			const improvement = ((fcfsWait - mlfqWait) / fcfsWait) * 100;

			comparison.improvements[category] = {
				fcfsAvgWait: fcfsWait.toFixed(2),
				mlfqAvgWait: mlfqWait.toFixed(2),
				improvement: improvement.toFixed(2),
				count: fcfsStats.categoryStats[category].count,
			};
		}
	}

	// Overall improvement
	const overallFcfsWait = parseFloat(fcfsStats.avgWaitTime);
	const overallMlfqWait = parseFloat(mlfqStats.avgWaitTime);
	const overallImprovement =
		((overallFcfsWait - overallMlfqWait) / overallFcfsWait) * 100;

	comparison.overallImprovement = overallImprovement.toFixed(2);

	return comparison;
}

// ============================================
// Main Execution
// ============================================

function main() {
	console.log("═".repeat(80));
	console.log("  MLFQ Concurrent Request Competition Experiment");
	console.log("  MLFQ 동시 요청 경쟁 환경 실험");
	console.log("═".repeat(80));
	console.log(`\n실험 설정:`);
	console.log(`  - 버스트 수: ${CONFIG.numBursts}`);
	console.log(`  - 버스트당 요청 수: ${CONFIG.requestsPerBurst}`);
	console.log(`  - 총 요청 수: ${CONFIG.numBursts * CONFIG.requestsPerBurst}`);
	console.log(`  - 타임 슬라이스: ${CONFIG.timeSliceMs}ms`);
	console.log();

	// Generate concurrent request bursts
	const allRequests = generateBursts();

	// Show distribution
	const distribution = {
		short: allRequests.filter((r) => r.category === "short").length,
		medium: allRequests.filter((r) => r.category === "medium").length,
		long: allRequests.filter((r) => r.category === "long").length,
	};
	console.log(
		`요청 분포: Short=${distribution.short}, Medium=${distribution.medium}, Long=${distribution.long}`,
	);
	console.log();

	// Run FCFS simulation
	console.log("FCFS 시뮬레이션 실행 중...");
	const fcfsResults = simulateFCFSConcurrent(allRequests);
	console.log("FCFS 완료.\n");

	// Run MLFQ simulation
	console.log("MLFQ 선점형 시뮬레이션 실행 중...");
	const mlfqData = simulateMLFQPreemptive(allRequests);
	console.log("MLFQ 완료.\n");

	// Compare results
	const comparison = compareResults(fcfsResults, mlfqData);

	// Print results
	console.log("═".repeat(80));
	console.log("  실험 결과");
	console.log("═".repeat(80));

	console.log("\n[전체 평균 대기 시간]");
	console.log("스케줄러  | 평균 대기 시간 (ms) | 개선율");
	console.log("-".repeat(80));
	console.log(`FCFS       | ${comparison.fcfs.avgWaitTime.padStart(18)} | -`);
	console.log(
		`MLFQ       | ${comparison.mlfq.avgWaitTime.padStart(18)} | ${comparison.overallImprovement.padStart(6)}%`,
	);

	console.log("\n[카테고리별 비교]");
	console.log("카테고리 | FCFS 평균 대기 | MLFQ 평균 대기 | 개선율 | 개수");
	console.log("-".repeat(80));
	for (const category of ["short", "medium", "long"]) {
		const imp = comparison.improvements[category];
		if (imp) {
			console.log(
				`${category.padEnd(10)} | ${imp.fcfsAvgWait.padStart(14)} | ${imp.mlfqAvgWait.padStart(14)} | ${imp.improvement.padStart(6)}% | ${imp.count}`,
			);
		}
	}

	console.log("\n[MLFQ 큐 이동 기록]");
	console.log(
		`선점(Preemption) 이벤트: ${comparison.queueHistory.filter((e) => e.event === "preemption").length}회`,
	);
	console.log(
		`부스팅(Boosting) 이벤트: ${comparison.queueHistory.filter((e) => e.event === "boost").length}회`,
	);

	// Show some queue history details
	const preemptions = comparison.queueHistory.filter(
		(e) => e.event === "preemption",
	);
	if (preemptions.length > 0) {
		console.log("\n선점 이벤트 예시:");
		preemptions.slice(0, 5).forEach((p) => {
			console.log(
				`  t=${p.time}ms: ${p.requestId} Q${p.fromQueue} → Q${p.toQueue}`,
			);
		});
		if (preemptions.length > 5) {
			console.log(`  ... 외 ${preemptions.length - 5}개 이벤트`);
		}
	}

	// MLFQ final queue distribution
	const finalQueueDistribution = { 0: 0, 1: 0, 2: 0, 3: 0 };
	for (const r of mlfqData.results) {
		const finalLevel = r.finalQueueLevel || 0;
		finalQueueDistribution[finalLevel]++;
	}

	console.log("\n[MLFQ 최종 큐 분포]");
	console.log("큐 레벨 | 완료된 요청 수");
	console.log("-".repeat(80));
	for (let level = 0; level < NUM_QUEUES; level++) {
		const quantum =
			TIME_QUANTUM[level] === Infinity ? "∞" : `${TIME_QUANTUM[level]}ms`;
		console.log(
			`Q${level} (${quantum.padStart(6)}) | ${finalQueueDistribution[level].toString().padStart(12)}`,
		);
	}

	// Save results
	const outputPath = path.join(__dirname, "mlfq-concurrent-results.json");
	fs.writeFileSync(
		outputPath,
		JSON.stringify(
			{
				timestamp: new Date().toISOString(),
				config: CONFIG,
				requests: {
					total: allRequests.length,
					distribution,
				},
				results: comparison,
			},
			null,
			2,
		),
	);
	console.log(`\n결과 저장: ${outputPath}`);

	console.log("\n" + "═".repeat(80));
	console.log("  실험 완료");
	console.log("═".repeat(80));

	return comparison;
}

// Execute
if (require.main === module) {
	main();
}

module.exports = {
	main,
	generateBursts,
	simulateFCFSConcurrent,
	simulateMLFQPreemptive,
	compareResults,
	CONFIG,
};
