/**
 * MLFQ 선점형(Preemptive) 기능 동작 테스트
 *
 * 목적: 새로운 선점형 기능이 올바르게 작동하는지 검증
 *
 * DDD IMPROVE 단계: 새로운 기능 검증
 */
const {
	MLFQScheduler,
	TIME_QUANTUM,
	TIME_SLICE_MS,
} = require("../src-simple/schedulers");

describe("MLFQScheduler - 선점형 기능 동작 테스트", () => {
	let scheduler;

	beforeEach(() => {
		scheduler = new MLFQScheduler();
	});

	afterEach(() => {
		scheduler.stopBoosting();
	});

	// ============================================
	// 선점형 처리 메서드 테스트
	// ============================================
	describe("startProcessing", () => {
		test("현재 처리 중인 요청을 설정함", () => {
			const req = { id: "1", queueLevel: 0, usedTime: 0 };

			scheduler.startProcessing(req);

			expect(scheduler.currentRequest).toBe(req);
			expect(scheduler.currentRequestStartTime).not.toBeNull();
			expect(scheduler.currentRequestUsedTime).toBe(0);
		});

		test("기존 usedTime을 보존함", () => {
			const req = { id: "1", queueLevel: 0, usedTime: 200 };

			scheduler.startProcessing(req);

			expect(scheduler.currentRequestUsedTime).toBe(200);
		});
	});

	describe("checkPreemption", () => {
		test("시간 할당량 미만이면 선점하지 않음", () => {
			const req = { id: "1", queueLevel: 0, usedTime: 700 };
			scheduler.startProcessing(req);

			const result = scheduler.checkPreemption(200); // 총 900ms (1000ms 미만)

			expect(result).toBeNull();
		});

		test("시간 할당량 도달 시 선점 필요", () => {
			const req = { id: "1", queueLevel: 0, usedTime: 700 };
			scheduler.startProcessing(req);

			const result = scheduler.checkPreemption(300); // 총 1000ms (1000ms 도달)

			expect(result).not.toBeNull();
			expect(result.shouldPreempt).toBe(true);
			expect(result.newQueueLevel).toBe(1);
		});

		test("시간 할당량 초과 시 선점 필요", () => {
			const req = { id: "1", queueLevel: 0, usedTime: 700 };
			scheduler.startProcessing(req);

			const result = scheduler.checkPreemption(400); // 총 1100ms (1000ms 초과)

			expect(result).not.toBeNull();
			expect(result.shouldPreempt).toBe(true);
			expect(result.newQueueLevel).toBe(1);
		});

		test("현재 요청 없으면 null 반환", () => {
			const result = scheduler.checkPreemption(1000);

			expect(result).toBeNull();
		});

		test("하위 큐에서도 선점 동작함", () => {
			// Q1: 3000ms
			const req = { id: "1", queueLevel: 1, usedTime: 2500 };
			scheduler.startProcessing(req);

			const result = scheduler.checkPreemption(600); // 총 3100ms (3000ms 초과)

			expect(result).not.toBeNull();
			expect(result.newQueueLevel).toBe(2);
		});

		test("최대 큐 레벨에서는 선점하지 않음 (Q3는 무제한)", () => {
			const req = { id: "1", queueLevel: 3, usedTime: 0 };
			scheduler.startProcessing(req);

			const result = scheduler.checkPreemption(100000);

			expect(result).toBeNull();
		});
	});

	describe("preempt", () => {
		test("요청을 하위 큐로 이동시킴", () => {
			const req = { id: "1", queueLevel: 0, usedTime: 300 };
			scheduler.startProcessing(req);

			scheduler.preempt({ shouldPreempt: true, newQueueLevel: 1 });

			// 현재 요청 초기화
			expect(scheduler.currentRequest).toBeNull();

			// 하위 큐에 요청 추가
			expect(scheduler.queues[1].length).toBe(1);
			expect(scheduler.queues[1][0]).toBe(req);
		});

		test("요청의 큐 레벨을 업데이트함", () => {
			const req = { id: "1", queueLevel: 0, usedTime: 300 };
			scheduler.startProcessing(req);

			scheduler.preempt({ shouldPreempt: true, newQueueLevel: 2 });

			expect(req.queueLevel).toBe(2);
			expect(req.usedTime).toBe(0); // 새 큐에서 시간 초기화
		});

		test("현재 요청 없으면 아무 일도 일어나지 않음", () => {
			const initialLength = scheduler.queues[1].length;

			scheduler.preempt({ shouldPreempt: true, newQueueLevel: 1 });

			expect(scheduler.queues[1].length).toBe(initialLength);
		});
	});

	describe("completeCurrentRequest", () => {
		test("현재 요청을 완료하고 반환함", () => {
			const req = { id: "1", queueLevel: 0, usedTime: 300 };
			scheduler.startProcessing(req);

			const completed = scheduler.completeCurrentRequest();

			expect(completed).toBe(req);
			expect(scheduler.currentRequest).toBeNull();
		});

		test("현재 요청 없으면 null 반환", () => {
			const completed = scheduler.completeCurrentRequest();

			expect(completed).toBeNull();
		});
	});

	describe("getCurrentRequest", () => {
		test("현재 처리 중인 요청을 반환함", () => {
			const req = { id: "1", queueLevel: 0 };
			scheduler.startProcessing(req);

			const current = scheduler.getCurrentRequest();

			expect(current).toBe(req);
		});

		test("처리 중인 요청 없으면 null 반환", () => {
			const current = scheduler.getCurrentRequest();

			expect(current).toBeNull();
		});
	});

	describe("getRemainingTime", () => {
		test("남은 시간 할당량을 계산함", () => {
			const req = { id: "1", queueLevel: 0, usedTime: 300 };
			scheduler.startProcessing(req);

			const remaining = scheduler.getRemainingTime();

			expect(remaining).toBe(700); // 1000 - 300 = 700
		});

		test("처리 중인 요청 없으면 0 반환", () => {
			const remaining = scheduler.getRemainingTime();

			expect(remaining).toBe(0);
		});

		test("각 큐 레벨별 할당량을 준수함", () => {
			// Q0: 1000ms
			const reqQ0 = { id: "q0", queueLevel: 0, usedTime: 200 };
			scheduler.startProcessing(reqQ0);
			expect(scheduler.getRemainingTime()).toBe(800);

			// Q1: 3000ms
			const reqQ1 = { id: "q1", queueLevel: 1, usedTime: 500 };
			scheduler.startProcessing(reqQ1);
			expect(scheduler.getRemainingTime()).toBe(2500);

			// Q2: 8000ms
			const reqQ2 = { id: "q2", queueLevel: 2, usedTime: 1000 };
			scheduler.startProcessing(reqQ2);
			expect(scheduler.getRemainingTime()).toBe(7000);

			// Q3: Infinity
			const reqQ3 = { id: "q3", queueLevel: 3, usedTime: 0 };
			scheduler.startProcessing(reqQ3);
			expect(scheduler.getRemainingTime()).toBe(Infinity);
		});
	});

	// ============================================
	// 통합 시나리오 테스트
	// ============================================
	describe("선점형 시나리오", () => {
		test("Short 요청이 Q0에서 완료됨", () => {
			const shortReq = {
				id: "short",
				prompt: "quick",
				queueLevel: 0,
				usedTime: 0,
			};

			scheduler.startProcessing(shortReq);

			// 900ms 경과 (1000ms 미만)
			const preemption = scheduler.checkPreemption(900);
			expect(preemption).toBeNull();

			// 요청 완료
			const completed = scheduler.completeCurrentRequest();
			expect(completed).toBe(shortReq);
			expect(completed.queueLevel).toBe(0); // 여전히 Q0
		});

		test("Long 요청이 Q0에서 Q1로 강등됨", () => {
			const longReq = {
				id: "long",
				prompt: "lengthy",
				queueLevel: 0,
				usedTime: 0,
			};

			scheduler.startProcessing(longReq);

			// 1100ms 경과 (1000ms 초과)
			const preemption = scheduler.checkPreemption(1100);
			expect(preemption).not.toBeNull();
			expect(preemption.newQueueLevel).toBe(1);

			// 선점 실행
			scheduler.preempt(preemption);

			// 요청이 Q1로 이동
			expect(scheduler.queues[1].length).toBe(1);
			expect(scheduler.queues[1][0].queueLevel).toBe(1);
			expect(scheduler.currentRequest).toBeNull();
		});

		test("여러 큐를 거치는 매우 긴 요청", () => {
			const veryLongReq = {
				id: "very-long",
				prompt: "complex",
				queueLevel: 0,
				usedTime: 0,
			};

			// Q0에서 Q1로 강등 (1000ms 초과)
			scheduler.startProcessing(veryLongReq);
			let preemption = scheduler.checkPreemption(1100); // 1100ms > 1000ms
			scheduler.preempt(preemption);

			expect(scheduler.queues[1].length).toBe(1);

			// Q1에서 다시 처리 시작
			const reqFromQ1 = scheduler.dequeue();
			scheduler.startProcessing(reqFromQ1);
			preemption = scheduler.checkPreemption(3100); // 3100ms > 3000ms
			scheduler.preempt(preemption);

			expect(scheduler.queues[2].length).toBe(1);

			// Q2에서 다시 처리 시작
			const reqFromQ2 = scheduler.dequeue();
			scheduler.startProcessing(reqFromQ2);
			preemption = scheduler.checkPreemption(8100); // 8100ms > 8000ms
			scheduler.preempt(preemption);

			expect(scheduler.queues[3].length).toBe(1);
			expect(reqFromQ2.queueLevel).toBe(3);
		});

		test("Round-Robin: 상위 큐의 요청이 우선 처리됨", () => {
			// Q0에 요청 추가
			const q0Req = { id: "q0", queueLevel: 0 };
			scheduler.enqueue(q0Req);

			// Q1에 요청 추가
			const q1Req = { id: "q1", queueLevel: 1 };
			scheduler.queues[1].push(q1Req);

			// Q0 요청이 먼저 처리됨
			const first = scheduler.dequeue();
			expect(first.id).toBe("q0");
		});
	});

	// ============================================
	// size 및 isEmpty 동작 (현재 요청 포함)
	// ============================================
	describe("size 및 isEmpty (선점형)", () => {
		test("size는 현재 처리 중인 요청을 포함함", () => {
			const req = { id: "1", queueLevel: 0 };
			scheduler.startProcessing(req);

			expect(scheduler.size()).toBe(1);
		});

		test("isEmpty는 현재 처리 중인 요청이 있으면 false 반환", () => {
			const req = { id: "1", queueLevel: 0 };
			scheduler.startProcessing(req);

			expect(scheduler.isEmpty()).toBe(false);
		});

		test("isEmpty는 큐와 현재 요청이 모두 없으면 true 반환", () => {
			expect(scheduler.isEmpty()).toBe(true);
		});
	});

	// ============================================
	// boost와 현재 요청
	// ============================================
	describe("boost와 현재 요청", () => {
		test("boost는 현재 처리 중인 요청도 Q0로 이동시킴", () => {
			const req = { id: "1", queueLevel: 2, usedTime: 1000 };
			scheduler.startProcessing(req);

			scheduler.boost();

			// 현재 요청 초기화
			expect(scheduler.currentRequest).toBeNull();

			// 모든 요청이 Q0로 이동
			expect(scheduler.queues[0].length).toBe(1);
			expect(scheduler.queues[0][0].queueLevel).toBe(0);
		});
	});
});
