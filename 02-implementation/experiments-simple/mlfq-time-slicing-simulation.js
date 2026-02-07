#!/usr/bin/env node
/**
 * MLFQ (Multi-Level Feedback Queue) 시간 분할 시뮬레이션
 *
 * MLFQ의 핵심 메커니즘을 시각적으로 보여주는 시뮬레이션:
 * 1. 큐 간 이동 (Q0 → Q1 → Q2 → Q3)
 * 2. 타임 퀀텀 사용 및 선점(Preemption)
 * 3. 주기적 부스팅(Boosting)
 *
 * 사용법: node mlfq-time-slicing-simulation.js
 */

const {
	MLFQScheduler,
	TIME_QUANTUM,
	NUM_QUEUES,
} = require("../src-simple/schedulers/MLFQScheduler");

// ANSI 색상 코드
const COLORS = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	white: "\x1b[37m",
	bgRed: "\x1b[41m",
	bgGreen: "\x1b[42m",
	bgYellow: "\x1b[43m",
	bgBlue: "\x1b[44m",
};

// 큐 레벨별 색상
const QUEUE_COLORS = [COLORS.cyan, COLORS.green, COLORS.yellow, COLORS.magenta];

// 시뮬레이션 설정
const SIMULATION_CONFIG = {
	timeSlice: 100, // 시뮬레이션 시간 슬라이스 (ms)
	boostInterval: 5000, // 부스팅 간격 (ms)
	showQueueState: true, // 큐 상태 표시
	showPreemption: true, // 선점 이벤트 표시
};

// 시뮬레이션 결과 저장
const simulationHistory = [];

/**
 * MLFQ 시뮬레이션 클래스
 */
class MLFQSimulation {
	constructor(config = {}) {
		this.config = { ...SIMULATION_CONFIG, ...config };
		this.scheduler = new MLFQScheduler();
		this.currentTime = 0;
		this.completedRequests = [];
		this.requestIdCounter = 1;
	}

	/**
	 * 요청 생성
	 */
	createRequest(processingTime, tenantId = "tenant1", priority = "Normal") {
		return {
			id: `R${String(this.requestIdCounter++).padStart(3, "0")}`,
			tenantId,
			priority,
			processingTime,
			remainingTime: processingTime,
			queueLevel: 0,
			usedTime: 0,
			createdAt: this.currentTime,
			history: [],
		};
	}

	/**
	 * 큐 상태 시각화
	 */
	visualizeQueues() {
		console.log(
			COLORS.bright +
				"\n┌─────────────────────────────────────────────────────────────────┐" +
				COLORS.reset,
		);
		console.log(
			COLORS.bright +
				"│                    MLFQ 큐 상태 (t=" +
				this.currentTime +
				"ms)" +
				" ".repeat(20) +
				"│" +
				COLORS.reset,
		);
		console.log(
			COLORS.bright +
				"├─────────────────────────────────────────────────────────────────┤" +
				COLORS.reset,
		);

		for (let level = 0; level < NUM_QUEUES; level++) {
			const color = QUEUE_COLORS[level];
			const quantum =
				TIME_QUANTUM[level] === Infinity ? "∞" : `${TIME_QUANTUM[level]}ms`;
			const requests = this.scheduler.queues[level];
			const currentReq = this.scheduler.currentRequest;
			const isCurrentRunning = currentReq && currentReq.queueLevel === level;

			let queueStr = `${color}Q${level} (${quantum})${COLORS.reset}: [`;

			if (isCurrentRunning) {
				queueStr += `${COLORS.bright}${COLORS.bgRed}▶${currentReq.id}${COLORS.reset} `;
			}

			for (const req of requests) {
				const usedPercent = req.usedTime / TIME_QUANTUM[level];
				const statusChar =
					usedPercent < 0.3 ? "░" : usedPercent < 0.7 ? "▒" : "▓";
				queueStr += `${color}${req.id}${statusChar}${COLORS.reset} `;
			}

			queueStr += "]";
			console.log(`│ ${queueStr.padEnd(63)}│`);
		}

		console.log(
			COLORS.bright +
				"└─────────────────────────────────────────────────────────────────┘" +
				COLORS.reset,
		);

		// 현재 실행 중인 요청 정보
		const currentReq = this.scheduler.currentRequest;
		if (currentReq) {
			const remaining = currentReq.remainingTime;
			const quantum = TIME_QUANTUM[currentReq.queueLevel];
			const used = currentReq.usedTime;
			console.log(
				`${COLORS.bright}${COLORS.yellow}▶ 실행 중:${COLORS.reset} ${currentReq.id} | 남은 시간: ${remaining}ms | 큐: Q${currentReq.queueLevel} | 사용: ${used}/${quantum}ms`,
			);
		}
	}

	/**
	 * 시간 슬라이스 처리
	 */
	processTimeSlice() {
		const events = [];

		// 현재 실행 중인 요청이 없으면 다음 요청 선택
		if (!this.scheduler.currentRequest) {
			const nextRequest = this.scheduler.dequeue();
			if (nextRequest) {
				this.scheduler.startProcessing(nextRequest);
				events.push({
					type: "START",
					request: nextRequest,
					time: this.currentTime,
				});
			} else {
				return events; // 처리할 요청 없음
			}
		}

		const currentReq = this.scheduler.currentRequest;
		const timeSlice = Math.min(this.config.timeSlice, currentReq.remainingTime);

		// 시간 진행
		this.currentTime += timeSlice;
		currentReq.remainingTime -= timeSlice;
		currentReq.usedTime += timeSlice;

		// 선점 체크
		const preemption = this.scheduler.checkPreemption(timeSlice);

		if (currentReq.remainingTime <= 0) {
			// 요청 완료
			const completed = this.scheduler.completeCurrentRequest();
			completed.completedAt = this.currentTime;
			completed.waitTime = completed.completedAt - completed.createdAt;
			this.completedRequests.push(completed);
			events.push({
				type: "COMPLETE",
				request: completed,
				time: this.currentTime,
			});
		} else if (preemption && preemption.shouldPreempt) {
			// 선점 발생
			currentReq.remainingTime = currentReq.remainingTime; // 상태 유지
			this.scheduler.preempt(preemption);
			events.push({
				type: "PREEMPT",
				request: currentReq,
				fromQueue: preemption.newQueueLevel - 1,
				toQueue: preemption.newQueueLevel,
				reason: `타임 퀀텀(${TIME_QUANTUM[preemption.newQueueLevel - 1]}ms) 초과`,
				time: this.currentTime,
			});
		}

		// 기록 저장
		this.recordState(events);
		return events;
	}

	/**
	 * 상태 기록
	 */
	recordState(events) {
		const state = {
			time: this.currentTime,
			queues: this.scheduler.queues.map((q) =>
				q.map((r) => ({ id: r.id, usedTime: r.usedTime })),
			),
			currentRequest: this.scheduler.currentRequest
				? {
						id: this.scheduler.currentRequest.id,
						queueLevel: this.scheduler.currentRequest.queueLevel,
						usedTime: this.scheduler.currentRequest.usedTime,
						remainingTime: this.scheduler.currentRequest.remainingTime,
					}
				: null,
			events,
		};
		simulationHistory.push(state);
	}

	/**
	 * 부스팅 실행
	 */
	performBoost() {
		const beforeQueues = this.scheduler.queues.map((q) => q.length);
		this.scheduler.boost();
		const afterQueues = this.scheduler.queues.map((q) => q.length);

		console.log(
			COLORS.bright +
				COLORS.bgGreen +
				"\n⬆️  BOOSTING 발생! (t=" +
				this.currentTime +
				"ms)" +
				COLORS.reset,
		);
		console.log(`${COLORS.green}모든 요청이 Q0로 이동했습니다.${COLORS.reset}`);
		console.log(
			`이전: [${beforeQueues.join(", ")}] → 이후: [${afterQueues.join(", ")}]`,
		);
	}

	/**
	 * 시뮬레이션 실행
	 */
	async run(scenario) {
		console.log(COLORS.bright + COLORS.cyan);
		console.log(
			"╔═════════════════════════════════════════════════════════════════════╗",
		);
		console.log(
			"║          MLFQ 시간 분할 시뮬레이션 시작                               ║",
		);
		console.log(
			"╚═════════════════════════════════════════════════════════════════════╝",
		);
		console.log(COLORS.reset);
		console.log(`시나리오: ${scenario.name}`);
		console.log(`설명: ${scenario.description}`);
		console.log();

		// 부스팅 시작
		this.scheduler.startBoosting();
		let lastBoostTime = 0;

		// 초기 요청 추가
		for (const reqConfig of scenario.initialRequests) {
			const req = this.createRequest(
				reqConfig.processingTime,
				reqConfig.tenantId,
				reqConfig.priority,
			);
			this.scheduler.enqueue(req);
			console.log(
				`${COLORS.dim}+ 요청 추가: ${req.id} (처리 시간: ${reqConfig.processingTime}ms)${COLORS.reset}`,
			);
		}
		console.log();

		// 시뮬레이션 루프
		let step = 0;
		while (true) {
			// 부스팅 체크
			if (this.currentTime - lastBoostTime >= this.config.boostInterval) {
				this.performBoost();
				lastBoostTime = this.currentTime;
			}

			// 큐 상태 표시
			if (this.config.showQueueState && step % 5 === 0) {
				this.visualizeQueues();
			}

			// 시간 슬라이스 처리
			const events = this.processTimeSlice();

			// 이벤트 출력
			for (const event of events) {
				if (event.type === "START") {
					console.log(
						`${COLORS.green}▶ ${event.request.id} 시작 (Q${event.request.queueLevel})${COLORS.reset}`,
					);
				} else if (event.type === "COMPLETE") {
					const waitTime = event.request.completedAt - event.request.createdAt;
					console.log(
						`${COLORS.bright}${COLORS.green}✓ ${event.request.id} 완료${COLORS.reset} | 대기 시간: ${waitTime}ms | 총 처리 시간: ${event.request.processingTime}ms`,
					);
				} else if (event.type === "PREEMPT" && this.config.showPreemption) {
					console.log(
						`${COLORS.yellow}⚠ ${event.request.id} 선점: Q${event.fromQueue} → Q${event.toQueue} (${event.reason})${COLORS.reset}`,
					);
				}
			}

			step++;

			// 종료 조건 체크
			if (this.scheduler.isEmpty() && scenario.duration !== undefined) {
				if (this.currentTime >= scenario.duration) {
					break;
				}
			} else if (this.scheduler.isEmpty() && scenario.duration === undefined) {
				break;
			}

			// 추가 요청 처리
			if (scenario.additionalRequests) {
				for (const addReq of scenario.additionalRequests) {
					if (addReq.atTime === this.currentTime) {
						const req = this.createRequest(
							addReq.processingTime,
							addReq.tenantId,
							addReq.priority,
						);
						this.scheduler.enqueue(req);
						console.log(
							`${COLORS.dim}+ 추가 요청: ${req.id} (처리 시간: ${addReq.processingTime}ms)${COLORS.reset}`,
						);
					}
				}
			}

			// 무한 루프 방지
			if (this.currentTime > 60000) {
				console.log(
					COLORS.yellow + "시뮬레이션 시간 초과 (60ms 제한)" + COLORS.reset,
				);
				break;
			}
		}

		// 부스팅 중지
		this.scheduler.stopBoosting();

		// 최종 결과
		this.printSummary();
	}

	/**
	 * 요약 출력
	 */
	printSummary() {
		console.log(
			COLORS.bright +
				"\n╔═════════════════════════════════════════════════════════════════════╗" +
				COLORS.reset,
		);
		console.log(
			COLORS.bright +
				"║                        시뮬레이션 완료                             ║" +
				COLORS.reset,
		);
		console.log(
			COLORS.bright +
				"╚═════════════════════════════════════════════════════════════════════╝" +
				COLORS.reset,
		);
		console.log();

		const totalRequests = this.completedRequests.length;
		const avgWaitTime =
			totalRequests > 0
				? this.completedRequests.reduce((sum, r) => sum + r.waitTime, 0) /
					totalRequests
				: 0;
		const maxWaitTime =
			totalRequests > 0
				? Math.max(...this.completedRequests.map((r) => r.waitTime))
				: 0;
		const minWaitTime =
			totalRequests > 0
				? Math.min(...this.completedRequests.map((r) => r.waitTime))
				: 0;

		console.log(`${COLORS.bright}📊 통계:${COLORS.reset}`);
		console.log(`  총 처리 요청: ${totalRequests}개`);
		console.log(`  총 소요 시간: ${this.currentTime}ms`);
		console.log(`  평균 대기 시간: ${avgWaitTime.toFixed(2)}ms`);
		console.log(`  최대 대기 시간: ${maxWaitTime}ms`);
		console.log(`  최소 대기 시간: ${minWaitTime}ms`);
		console.log();

		// 완료된 요청 목록
		if (totalRequests > 0) {
			console.log(`${COLORS.bright}📋 완료된 요청:${COLORS.reset}`);
			console.log("  ID     | 대기시간 | 처리시간 | 완료시간");
			console.log("  " + "─".repeat(42));
			for (const req of this.completedRequests) {
				console.log(
					`  ${req.id} | ${String(req.waitTime).padStart(7)}ms | ${String(req.processingTime).padStart(7)}ms | t=${String(req.completedAt).padStart(4)}ms`,
				);
			}
		}
	}

	/**
	 * 시뮬레이션 기록을 JSON으로 저장
	 */
	saveHistory(filename) {
		const fs = require("fs");
		const path = require("path");
		const outputPath = path.join(__dirname, filename);

		fs.writeFileSync(
			outputPath,
			JSON.stringify(
				{
					config: this.config,
					history: simulationHistory,
					completedRequests: this.completedRequests,
				},
				null,
				2,
			),
		);
		console.log(
			`${COLORS.dim}시뮬레이션 기록이 저장되었습니다: ${outputPath}${COLORS.reset}`,
		);
	}
}

// ============================================================================
// 시나리오 정의
// ============================================================================

const SCENARIOS = {
	basic: {
		name: "기본 시나리오",
		description: "짧은 작업과 긴 작업의 MLFQ 동작 비교",
		initialRequests: [
			{ processingTime: 300, tenantId: "tenant1", priority: "Normal" }, // Q0에서 완료 (500ms 미만)
			{ processingTime: 2000, tenantId: "tenant2", priority: "Normal" }, // Q0→Q1로 강등 예상
			{ processingTime: 6000, tenantId: "tenant3", priority: "Low" }, // Q0→Q1→Q2로 강등 예상
		],
	},

	preemption: {
		name: "선점(Preemption) 시나리오",
		description: "긴 작업이 짧은 작업에 의해 선점되는 과정",
		initialRequests: [
			{ processingTime: 4000, tenantId: "tenant1", priority: "Normal" }, // 긴 작업
		],
		additionalRequests: [
			{
				atTime: 600,
				processingTime: 200,
				tenantId: "tenant2",
				priority: "High",
			}, // 중간에 짧은 작업
		],
	},

	boosting: {
		name: "부스팅(Boosting) 시나리오",
		description: "주기적 부스팅으로 기아 현상 방지",
		duration: 12000, // 12초 (부스팅 2회 이상)
		initialRequests: [
			{ processingTime: 10000, tenantId: "tenant1", priority: "High" }, // 계속 실행되는 긴 작업
			{ processingTime: 500, tenantId: "tenant2", priority: "Low" }, // 밀릴 수 있는 짧은 작업
		],
		additionalRequests: [
			{
				atTime: 3000,
				processingTime: 300,
				tenantId: "tenant3",
				priority: "Low",
			},
			{
				atTime: 6000,
				processingTime: 400,
				tenantId: "tenant4",
				priority: "Low",
			},
		],
	},

	mixed: {
		name: "혼합 워크로드 시나리오",
		description: "대화형/배치 작업 혼합 환경",
		initialRequests: [
			{ processingTime: 200, tenantId: "interactive1", priority: "High" },
			{ processingTime: 8000, tenantId: "batch1", priority: "Low" },
			{ processingTime: 300, tenantId: "interactive2", priority: "High" },
			{ processingTime: 6000, tenantId: "batch2", priority: "Low" },
		],
		additionalRequests: [
			{
				atTime: 1000,
				processingTime: 150,
				tenantId: "interactive3",
				priority: "High",
			},
			{
				atTime: 2000,
				processingTime: 250,
				tenantId: "interactive4",
				priority: "High",
			},
		],
	},
};

// ============================================================================
// 메인 실행
// ============================================================================

async function main() {
	const args = process.argv.slice(2);
	const scenarioName = args[0] || "basic";
	const saveHistory = args.includes("--save");

	const scenario = SCENARIOS[scenarioName];
	if (!scenario) {
		console.error(`알 수 없는 시나리오: ${scenarioName}`);
		console.error(`사용 가능한 시나리오: ${Object.keys(SCENARIOS).join(", ")}`);
		process.exit(1);
	}

	const simulation = new MLFQSimulation({
		timeSlice: 100, // 시뮬레이션 속도
		boostInterval: 5000,
		showQueueState: true,
		showPreemption: true,
	});

	await simulation.run(scenario);

	if (saveHistory) {
		simulation.saveHistory(`mlfq-simulation-${scenarioName}.json`);
	}
}

if (require.main === module) {
	main().catch(console.error);
}

module.exports = { MLFQSimulation, SCENARIOS };
