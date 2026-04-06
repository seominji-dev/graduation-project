/**
 * MLFQ 선점형(Preemptive) 기능 동작 테스트
 *
 * 목적: 새로운 선점형 기능이 올바르게 작동하는지 검증
 */
const {
	MLFQScheduler,
} = require("../src-simple/schedulers");

describe("MLFQScheduler - 선점형 기능 테스트", () => {
	let scheduler;

	beforeEach(() => {
		scheduler = new MLFQScheduler();
	});

	afterEach(() => {
		scheduler.stopBoosting();
	});

	test("startProcessing이 현재 요청을 설정함", () => {
		const req = { id: "1", queueLevel: 0, usedTime: 0 };

		scheduler.startProcessing(req);

		expect(scheduler.currentRequest).toBe(req);
		expect(scheduler.currentRequestStartTime).not.toBeNull();
	});

	test("시간 할당량 미만이면 선점하지 않음", () => {
		const req = { id: "1", queueLevel: 0, usedTime: 700 };
		scheduler.startProcessing(req);

		const result = scheduler.checkPreemption(200); // 총 900ms (1000ms 미만)

		expect(result).toBeNull();
	});

	test("시간 할당량 초과 시 선점 필요", () => {
		const req = { id: "1", queueLevel: 0, usedTime: 700 };
		scheduler.startProcessing(req);

		const result = scheduler.checkPreemption(400); // 총 1100ms (1000ms 초과)

		expect(result).not.toBeNull();
		expect(result.shouldPreempt).toBe(true);
		expect(result.newQueueLevel).toBe(1);
	});

	test("선점 시 요청이 하위 큐로 이동", () => {
		const req = { id: "1", queueLevel: 0, usedTime: 300 };
		scheduler.startProcessing(req);

		scheduler.preempt({ shouldPreempt: true, newQueueLevel: 1 });

		expect(scheduler.currentRequest).toBeNull();
		expect(scheduler.queues[1].length).toBe(1);
		expect(scheduler.queues[1][0]).toBe(req);
	});

	test("Q0 -> Q1 -> Q2 큐 레벨 강등 진행", () => {
		const req = { id: "1", queueLevel: 0, usedTime: 0 };

		// Q0에서 Q1로 강등
		scheduler.startProcessing(req);
		let preemption = scheduler.checkPreemption(1100);
		scheduler.preempt(preemption);
		expect(scheduler.queues[1].length).toBe(1);

		// Q1에서 Q2로 강등
		const reqFromQ1 = scheduler.dequeue();
		scheduler.startProcessing(reqFromQ1);
		preemption = scheduler.checkPreemption(3100);
		scheduler.preempt(preemption);
		expect(scheduler.queues[2].length).toBe(1);
	});

	test("최대 큐 레벨(Q3)에서는 선점하지 않음", () => {
		const req = { id: "1", queueLevel: 3, usedTime: 0 };
		scheduler.startProcessing(req);

		const result = scheduler.checkPreemption(100000);

		expect(result).toBeNull();
	});

	test("boost는 현재 처리 중인 요청도 Q0로 이동시킴", () => {
		const req = { id: "1", queueLevel: 2, usedTime: 1000 };
		scheduler.startProcessing(req);

		scheduler.boost();

		expect(scheduler.currentRequest).toBeNull();
		expect(scheduler.queues[0].length).toBe(1);
		expect(scheduler.queues[0][0].queueLevel).toBe(0);
	});

	test("completeCurrentRequest가 현재 요청 완료 후 반환", () => {
		const req = { id: "1", queueLevel: 0, usedTime: 300 };
		scheduler.startProcessing(req);

		const completed = scheduler.completeCurrentRequest();

		expect(completed).toBe(req);
		expect(scheduler.currentRequest).toBeNull();
	});
});
