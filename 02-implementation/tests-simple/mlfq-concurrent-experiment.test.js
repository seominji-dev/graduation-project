/**
 * MLFQ Concurrent Request Competition Experiment Tests
 *
 * Tests for the concurrent request competition environment experiment that
 * demonstrates MLFQ's advantages over FCFS in scenarios with:
 * - Concurrent request arrivals (bursts)
 * - Time-sliced processing with preemption
 * - Queue demotion during processing
 */

const {
	generateBursts,
	simulateFCFSConcurrent,
	simulateMLFQPreemptive,
	compareResults,
	CONFIG,
} = require("../experiments-simple/mlfq-concurrent-competition-experiment");

describe("MLFQ Concurrent Request Competition Experiment", () => {
	describe("generateBursts", () => {
		test("지정된 수의 버스트를 생성해야 함", () => {
			const bursts = generateBursts();
			// Each burst has CONFIG.requestsPerBurst requests
			// Total bursts = CONFIG.numBursts
			const expectedTotal = CONFIG.numBursts * CONFIG.requestsPerBurst;
			expect(bursts.length).toBe(expectedTotal);
		});

		test("각 요청에 필요한 속성이 있어야 함", () => {
			const bursts = generateBursts();
			const firstRequest = bursts[0];

			expect(firstRequest).toHaveProperty("id");
			expect(firstRequest).toHaveProperty("category");
			expect(firstRequest).toHaveProperty("processingTime");
			expect(firstRequest).toHaveProperty("arrivalTime");
			expect(firstRequest).toHaveProperty("burstId");
			expect(firstRequest).toHaveProperty("remainingTime");
		});

		test("카테고리가 short, medium, long 중 하나여야 함", () => {
			const bursts = generateBursts();
			const validCategories = ["short", "medium", "long"];

			for (const req of bursts) {
				expect(validCategories).toContain(req.category);
			}
		});

		test("같은 버스트의 요청들은 동일한 arrivalTime을 가져야 함", () => {
			const bursts = generateBursts();

			// Group by burst ID
			const burstGroups = {};
			for (const req of bursts) {
				if (!burstGroups[req.burstId]) {
					burstGroups[req.burstId] = [];
				}
				burstGroups[req.burstId].push(req);
			}

			// Check each burst group
			for (const burstId in burstGroups) {
				const group = burstGroups[burstId];
				const arrivalTime = group[0].arrivalTime;

				for (const req of group) {
					expect(req.arrivalTime).toBe(arrivalTime);
				}
			}
		});

		test("버스트 간에는 arrivalTime 간격이 있어야 함", () => {
			const bursts = generateBursts();

			// Group by burst ID
			const burstGroups = {};
			for (const req of bursts) {
				if (!burstGroups[req.burstId]) {
					burstGroups[req.burstId] = [];
				}
				burstGroups[req.burstId].push(req);
			}

			// Check that bursts have increasing arrival times
			const burstIds = Object.keys(burstGroups).sort();
			for (let i = 1; i < burstIds.length; i++) {
				const prevBurstTime = burstGroups[burstIds[i - 1]][0].arrivalTime;
				const currBurstTime = burstGroups[burstIds[i]][0].arrivalTime;

				expect(currBurstTime).toBeGreaterThan(prevBurstTime);
			}
		});
	});

	describe("simulateFCFSConcurrent", () => {
		test("모든 요청을 처리해야 함", () => {
			const requests = generateBursts();
			const results = simulateFCFSConcurrent(requests);

			expect(results.length).toBe(requests.length);
		});

		test("결과에 waitTime과 responseTime이 포함되어야 함", () => {
			const requests = generateBursts();
			const results = simulateFCFSConcurrent(requests);

			for (const result of results) {
				expect(result).toHaveProperty("waitTime");
				expect(result).toHaveProperty("responseTime");
				expect(result.waitTime).toBeGreaterThanOrEqual(0);
				expect(result.responseTime).toBeGreaterThan(0);
			}
		});

		test("FCFS는 선착순으로 처리해야 함", () => {
			// Create simple test case with known order
			const requests = [
				{
					id: "req-1",
					arrivalTime: 0,
					processingTime: 100,
					category: "short",
				},
				{
					id: "req-2",
					arrivalTime: 0,
					processingTime: 100,
					category: "short",
				},
				{
					id: "req-3",
					arrivalTime: 0,
					processingTime: 100,
					category: "short",
				},
			];

			const results = simulateFCFSConcurrent(requests);

			// Results should be in order of ID (FCFS order)
			expect(results[0].id).toBe("req-1");
			expect(results[1].id).toBe("req-2");
			expect(results[2].id).toBe("req-3");

			// Wait times should increase
			expect(results[0].waitTime).toBe(0);
			expect(results[1].waitTime).toBe(100);
			expect(results[2].waitTime).toBe(200);
		});
	});

	describe("simulateMLFQPreemptive", () => {
		test("모든 요청을 처리해야 함", () => {
			const requests = generateBursts();
			const { results } = simulateMLFQPreemptive(requests);

			expect(results.length).toBe(requests.length);
		});

		test("결과에 waitTime, responseTime, finalQueueLevel이 포함되어야 함", () => {
			const requests = generateBursts();
			const { results } = simulateMLFQPreemptive(requests);

			for (const result of results) {
				expect(result).toHaveProperty("waitTime");
				expect(result).toHaveProperty("responseTime");
				expect(result).toHaveProperty("finalQueueLevel");
				expect(result.waitTime).toBeGreaterThanOrEqual(0);
				expect(result.responseTime).toBeGreaterThan(0);
				expect(result.finalQueueLevel).toBeGreaterThanOrEqual(0);
				expect(result.finalQueueLevel).toBeLessThan(4); // 0-3
			}
		});

		test("큐 이동 기록(queueHistory)이 반환되어야 함", () => {
			const requests = generateBursts();
			const { queueHistory } = simulateMLFQPreemptive(requests);

			expect(Array.isArray(queueHistory)).toBe(true);
		});

		test("선점 이벤트가 기록되어야 함", () => {
			// Create requests that will definitely cause preemption
			const requests = [];
			for (let i = 0; i < 10; i++) {
				requests.push({
					id: `req-${i}`,
					arrivalTime: 0, // All arrive at same time
					processingTime: 2000, // Longer than Q0 quantum (1000ms)
					category: "medium",
					remainingTime: 2000,
				});
			}

			const { queueHistory } = simulateMLFQPreemptive(requests);

			const preemptionEvents = queueHistory.filter(
				(e) => e.event === "preemption",
			);
			expect(preemptionEvents.length).toBeGreaterThan(0);
		});

		test("short 요청은 Q0에서 완료되어야 함", () => {
			const requests = [
				{
					id: "short-req",
					arrivalTime: 0,
					processingTime: 300, // Short: < 500ms
					category: "short",
					remainingTime: 300,
				},
			];

			const { results } = simulateMLFQPreemptive(requests);

			expect(results[0].finalQueueLevel).toBe(0); // Should complete in Q0
		});
	});

	describe("compareResults", () => {
		test("FCFS와 MLFQ 결과를 비교해야 함", () => {
			const fcfsResults = [
				{
					id: "req-1",
					category: "short",
					waitTime: 1000,
					responseTime: 1500,
					arrivalTime: 0,
					completedAt: 1500,
					processingTime: 500,
				},
			];

			const mlfqData = {
				results: [
					{
						id: "req-1",
						category: "short",
						waitTime: 500, // Better wait time
						responseTime: 1000,
						arrivalTime: 0,
						completedAt: 1000,
						processingTime: 500,
						finalQueueLevel: 0,
					},
				],
				queueHistory: [],
			};

			const comparison = compareResults(fcfsResults, mlfqData);

			expect(comparison).toHaveProperty("fcfs");
			expect(comparison).toHaveProperty("mlfq");
			expect(comparison).toHaveProperty("improvements");
			expect(comparison).toHaveProperty("overallImprovement");
		});

		test("개선율을 올바르게 계산해야 함", () => {
			const fcfsResults = [
				{
					id: "req-1",
					category: "short",
					waitTime: 1000,
					responseTime: 1500,
					arrivalTime: 0,
					completedAt: 1500,
					processingTime: 500,
				},
			];

			const mlfqData = {
				results: [
					{
						id: "req-1",
						category: "short",
						waitTime: 250, // 75% improvement
						responseTime: 750,
						arrivalTime: 0,
						completedAt: 750,
						processingTime: 500,
						finalQueueLevel: 0,
					},
				],
				queueHistory: [],
			};

			const comparison = compareResults(fcfsResults, mlfqData);

			const shortImprovement = comparison.improvements.short;
			expect(parseFloat(shortImprovement.improvement)).toBeCloseTo(75, 0);
		});

		test("카테고리별 통계를 제공해야 함", () => {
			const fcfsResults = [
				{
					id: "req-1",
					category: "short",
					waitTime: 1000,
					responseTime: 1500,
					arrivalTime: 0,
					completedAt: 1500,
					processingTime: 500,
				},
				{
					id: "req-2",
					category: "long",
					waitTime: 5000,
					responseTime: 10000,
					arrivalTime: 0,
					completedAt: 10000,
					processingTime: 5000,
				},
			];

			const mlfqData = {
				results: [
					{
						id: "req-1",
						category: "short",
						waitTime: 300,
						responseTime: 800,
						arrivalTime: 0,
						completedAt: 800,
						processingTime: 500,
						finalQueueLevel: 0,
					},
					{
						id: "req-2",
						category: "long",
						waitTime: 7000,
						responseTime: 12000,
						arrivalTime: 0,
						completedAt: 12000,
						processingTime: 5000,
						finalQueueLevel: 2,
					},
				],
				queueHistory: [],
			};

			const comparison = compareResults(fcfsResults, mlfqData);

			expect(comparison.improvements.short).toBeDefined();
			expect(comparison.improvements.long).toBeDefined();
			expect(comparison.fcfs.categoryStats.short).toBeDefined();
			expect(comparison.fcfs.categoryStats.long).toBeDefined();
		});
	});

	describe("CONFIG", () => {
		test("올바른 설정 값을 가져야 함", () => {
			expect(CONFIG).toHaveProperty("numBursts");
			expect(CONFIG).toHaveProperty("requestsPerBurst");
			expect(CONFIG).toHaveProperty("timeSliceMs");
			expect(CONFIG).toHaveProperty("shortRequestRange");
			expect(CONFIG).toHaveProperty("mediumRequestRange");
			expect(CONFIG).toHaveProperty("longRequestRange");

			expect(CONFIG.numBursts).toBeGreaterThan(0);
			expect(CONFIG.requestsPerBurst).toBeGreaterThan(0);
		});
	});

	describe("Integration Tests", () => {
		test("전체 실험 실행이 정상 작동해야 함", () => {
			// Generate small test dataset
			const testRequests = [];
			for (let burstId = 0; burstId < 2; burstId++) {
				for (let i = 0; i < 5; i++) {
					const type = i % 3 === 0 ? "short" : i % 3 === 1 ? "medium" : "long";
					let processingTime;
					switch (type) {
						case "short":
							processingTime = 200 + Math.floor(Math.random() * 200);
							break;
						case "medium":
							processingTime = 1000 + Math.floor(Math.random() * 1000);
							break;
						case "long":
							processingTime = 4000 + Math.floor(Math.random() * 2000);
							break;
					}
					testRequests.push({
						id: `test-${burstId}-${i}`,
						category: type,
						processingTime: processingTime,
						remainingTime: processingTime,
						burstId: burstId,
						arrivalTime: burstId * 2000,
						createdAt: burstId * 2000,
					});
				}
			}

			const fcfsResults = simulateFCFSConcurrent(testRequests);
			const mlfqData = simulateMLFQPreemptive(testRequests);
			const comparison = compareResults(fcfsResults, mlfqData);

			// Verify both schedulers completed all requests
			expect(fcfsResults.length).toBe(testRequests.length);
			expect(mlfqData.results.length).toBe(testRequests.length);

			// Verify comparison structure
			expect(comparison.fcfs.totalRequests).toBe(testRequests.length);
			expect(comparison.mlfq.totalRequests).toBe(testRequests.length);
		});

		test("MLFQ가 short 요청에서 우위를 보여야 함", () => {
			// Create test case with many short requests arriving with long requests
			const testRequests = [];

			// Add long requests first
			for (let i = 0; i < 3; i++) {
				testRequests.push({
					id: `long-${i}`,
					category: "long",
					processingTime: 5000,
					remainingTime: 5000,
					arrivalTime: 0,
					createdAt: 0,
				});
			}

			// Add short requests at same time (concurrent)
			for (let i = 0; i < 5; i++) {
				testRequests.push({
					id: `short-${i}`,
					category: "short",
					processingTime: 300,
					remainingTime: 300,
					arrivalTime: 0,
					createdAt: 0,
				});
			}

			const fcfsResults = simulateFCFSConcurrent(testRequests);
			const mlfqData = simulateMLFQPreemptive(testRequests);

			// Get short request wait times
			const fcfsShortWaits = fcfsResults
				.filter((r) => r.category === "short")
				.map((r) => r.waitTime);
			const mlfqShortWaits = mlfqData.results
				.filter((r) => r.category === "short")
				.map((r) => r.waitTime);

			const fcfsAvgShort =
				fcfsShortWaits.reduce((a, b) => a + b, 0) / fcfsShortWaits.length;
			const mlfqAvgShort =
				mlfqShortWaits.reduce((a, b) => a + b, 0) / mlfqShortWaits.length;

			// MLFQ should be better for short requests
			expect(mlfqAvgShort).toBeLessThan(fcfsAvgShort);
		});
	});
});
