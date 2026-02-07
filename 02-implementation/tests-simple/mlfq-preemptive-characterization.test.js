/**
 * MLFQ 선점형 기능 추가를 위한 특성 테스트 (Characterization Tests)
 *
 * 목적: 현재 비선점형 동작을 정확히 기록하여, 선점형 기능 추가 시
 * 기존 동작이 의도치 않게 변경되지 않도록 보호
 *
 * DDD PRESERVE 단계: 기존 동작 보존을 위한 안전망 구축
 */
const { MLFQScheduler, TIME_QUANTUM } = require("../src-simple/schedulers");

describe("MLFQScheduler - 현재 비선점형 동작 특성 테스트", () => {
	let scheduler;

	beforeEach(() => {
		scheduler = new MLFQScheduler();
	});

	afterEach(() => {
		scheduler.stopBoosting();
	});

	// ============================================
	// 특성 1: 비선점형 동작 (Non-preemptive)
	// ============================================
	describe("비선점형 처리 동작", () => {
		test("dequeue는 요청을 즉시 제거하고 반환함", () => {
			const req1 = { id: "1", queueLevel: 0 };
			const req2 = { id: "2", queueLevel: 0 };

			scheduler.queues[0].push(req1);
			scheduler.queues[0].push(req2);

			const dequeued = scheduler.dequeue();

			// 요청이 큐에서 제거됨
			expect(scheduler.queues[0].length).toBe(1);
			expect(dequeued).toBe(req1);
		});

		test("dequeue 후 요청은 자동으로 다시 큐에 들어가지 않음", () => {
			const req1 = { id: "1", queueLevel: 0 };

			scheduler.queues[0].push(req1);

			scheduler.dequeue();

			// 요청이 큐에 남아있지 않음
			expect(scheduler.queues[0].length).toBe(0);
			expect(scheduler.isEmpty()).toBe(true);
		});

		test("여러 요청을 순차적으로 dequeue 가능", () => {
			const req1 = { id: "1", queueLevel: 0 };
			const req2 = { id: "2", queueLevel: 0 };
			const req3 = { id: "3", queueLevel: 0 };

			scheduler.queues[0].push(req1, req2, req3);

			expect(scheduler.dequeue()).toBe(req1);
			expect(scheduler.dequeue()).toBe(req2);
			expect(scheduler.dequeue()).toBe(req3);
			expect(scheduler.dequeue()).toBeNull();
		});
	});

	// ============================================
	// 특성 2: 피드백 메커니즘 (완료 후 큐 레벨 조정)
	// ============================================
	describe("피드백 메커니즘 동작", () => {
		test("feedback은 요청의 usedTime을 누적함 (시간 할당량 미만)", () => {
			const req = { id: "1", queueLevel: 0, usedTime: 300 };

			scheduler.feedback(req, 100); // 400ms (TIME_QUANTUM[0] = 500ms 미만)

			expect(req.usedTime).toBe(400);
		});

		test("feedback은 시간 할당량 도달 시 usedTime을 0으로 초기화함", () => {
			const req = { id: "1", queueLevel: 0, usedTime: 300 };

			scheduler.feedback(req, 200); // 500ms (TIME_QUANTUM[0] = 500ms 도달)

			// 시간 할당량에 도달하면 usedTime이 0으로 초기화되고 큐 레벨이 증가함
			expect(req.usedTime).toBe(0);
			expect(req.queueLevel).toBe(1);
		});

		test("feedback은 시간 할당량 초과 시 큐 레벨을 증가시킴", () => {
			const req = { id: "1", queueLevel: 0, usedTime: 800 };

			scheduler.feedback(req, 500); // 총 1300ms (TIME_QUANTUM[0] = 1000ms 초과)

			expect(req.queueLevel).toBe(1);
			expect(req.usedTime).toBe(0); // usedTime 초기화
		});

		test("feedback은 시간 할당량 미만이면 큐 레벨을 유지함", () => {
			const req = { id: "1", queueLevel: 0, usedTime: 300 };

			scheduler.feedback(req, 100); // 총 400ms (TIME_QUANTUM[0] = 500ms 미만)

			expect(req.queueLevel).toBe(0);
			expect(req.usedTime).toBe(400);
		});

		test("feedback은 최대 큐 레벨을 초과하지 않음", () => {
			const req = { id: "1", queueLevel: 3, usedTime: 0 };

			scheduler.feedback(req, 100000);

			expect(req.queueLevel).toBe(3);
		});

		test("feedback은 각 큐 레벨의 시간 할당량을 준수함", () => {
			// Q0: 500ms
			const reqQ0 = { id: "q0", queueLevel: 0, usedTime: 400 };
			scheduler.feedback(reqQ0, 200);
			expect(reqQ0.queueLevel).toBe(1);

			// Q1: 1500ms
			const reqQ1 = { id: "q1", queueLevel: 1, usedTime: 1300 };
			scheduler.feedback(reqQ1, 500);
			expect(reqQ1.queueLevel).toBe(2);

			// Q2: 4000ms
			const reqQ2 = { id: "q2", queueLevel: 2, usedTime: 3500 };
			scheduler.feedback(reqQ2, 1000);
			expect(reqQ2.queueLevel).toBe(3);

			// Q3: Infinity
			const reqQ3 = { id: "q3", queueLevel: 3, usedTime: 0 };
			scheduler.feedback(reqQ3, 100000);
			expect(reqQ3.queueLevel).toBe(3);
		});
	});

	// ============================================
	// 특성 3: 큐 관리 동작
	// ============================================
	describe("큐 관리 동작", () => {
		test("enqueue는 항상 Q0에 요청을 추가함", () => {
			const req = { id: "1" };

			scheduler.enqueue(req);

			expect(req.queueLevel).toBe(0);
			expect(req.usedTime).toBe(0);
			expect(scheduler.queues[0].length).toBe(1);
		});

		test("enqueue는 createdAt을 보존함", () => {
			const customTime = 1234567890;
			const req = { id: "1", createdAt: customTime };

			scheduler.enqueue(req);

			expect(req.createdAt).toBe(customTime);
		});

		test("requeue는 지정된 queueLevel에 요청을 추가함", () => {
			const req = { id: "1", queueLevel: 2 };

			scheduler.requeue(req);

			expect(scheduler.queues[2].length).toBe(1);
		});

		test("requeue는 queueLevel 없으면 Q0에 추가함", () => {
			const req = { id: "1" };

			scheduler.requeue(req);

			expect(scheduler.queues[0].length).toBe(1);
		});

		test("size는 모든 큐의 총 합을 반환함", () => {
			scheduler.queues[0].push({ id: "1" });
			scheduler.queues[1].push({ id: "2" });
			scheduler.queues[2].push({ id: "3" });
			scheduler.queues[3].push({ id: "4" });

			expect(scheduler.size()).toBe(4);
		});

		test("isEmpty는 모든 큐가 비어있으면 true를 반환함", () => {
			expect(scheduler.isEmpty()).toBe(true);

			scheduler.queues[0].push({ id: "1" });

			expect(scheduler.isEmpty()).toBe(false);
		});
	});

	// ============================================
	// 특성 4: 우선순위 큐 선택 동작
	// ============================================
	describe("우선순위 큐 선택 동작", () => {
		test("dequeue는 가장 높은 우선순위 큐(Q0)부터 처리함", () => {
			scheduler.queues[0].push({ id: "q0-1" });
			scheduler.queues[1].push({ id: "q1-1" });
			scheduler.queues[2].push({ id: "q2-1" });

			expect(scheduler.dequeue().id).toBe("q0-1");
		});

		test("dequeue는 상위 큐가 비면 다음 큐를 처리함", () => {
			scheduler.queues[1].push({ id: "q1-1" });
			scheduler.queues[2].push({ id: "q2-1" });

			expect(scheduler.dequeue().id).toBe("q1-1");
		});

		test("dequeue는 FCFS 순서로 같은 큐 내 요청을 처리함", () => {
			scheduler.queues[0].push(
				{ id: "first" },
				{ id: "second" },
				{ id: "third" },
			);

			expect(scheduler.dequeue().id).toBe("first");
			expect(scheduler.dequeue().id).toBe("second");
			expect(scheduler.dequeue().id).toBe("third");
		});
	});

	// ============================================
	// 특성 5: Boosting 동작
	// ============================================
	describe("Boosting 동작", () => {
		test("boost는 모든 큐의 요청을 Q0로 이동시킴", () => {
			const req1 = { id: "1", queueLevel: 1, usedTime: 1000 };
			const req2 = { id: "2", queueLevel: 2, usedTime: 2000 };
			const req3 = { id: "3", queueLevel: 3, usedTime: 3000 };

			scheduler.queues[1].push(req1);
			scheduler.queues[2].push(req2);
			scheduler.queues[3].push(req3);

			scheduler.boost();

			expect(scheduler.queues[0].length).toBe(3);
			expect(scheduler.queues[1].length).toBe(0);
			expect(scheduler.queues[2].length).toBe(0);
			expect(scheduler.queues[3].length).toBe(0);
		});

		test("boost는 모든 요청의 queueLevel을 0으로 설정함", () => {
			const req1 = { id: "1", queueLevel: 2 };
			const req2 = { id: "2", queueLevel: 3 };

			scheduler.queues[2].push(req1);
			scheduler.queues[3].push(req2);

			scheduler.boost();

			expect(req1.queueLevel).toBe(0);
			expect(req2.queueLevel).toBe(0);
		});

		test("boost는 모든 요청의 usedTime을 0으로 초기화함", () => {
			const req1 = { id: "1", queueLevel: 2, usedTime: 1500 };
			const req2 = { id: "2", queueLevel: 3, usedTime: 5000 };

			scheduler.queues[2].push(req1);
			scheduler.queues[3].push(req2);

			scheduler.boost();

			expect(req1.usedTime).toBe(0);
			expect(req2.usedTime).toBe(0);
		});
	});

	// ============================================
	// 특성 6: 타임 퀀텀 상수
	// ============================================
	describe("타임 퀀텀 설정", () => {
		test("TIME_QUANTUM 배열이 올바른 순서로 정의됨", () => {
			expect(TIME_QUANTUM[0]).toBe(500); // Q0: 500ms (선점형 단축)
			expect(TIME_QUANTUM[1]).toBe(1500); // Q1: 1.5초
			expect(TIME_QUANTUM[2]).toBe(4000); // Q2: 4초
			expect(TIME_QUANTUM[3]).toBe(Infinity); // Q3: 무제한
		});

		test("TIME_QUANTUM은 오름차순으로 증가함", () => {
			expect(TIME_QUANTUM[0]).toBeLessThan(TIME_QUANTUM[1]);
			expect(TIME_QUANTUM[1]).toBeLessThan(TIME_QUANTUM[2]);
			expect(TIME_QUANTUM[2]).toBeLessThan(Infinity);
		});
	});
});
