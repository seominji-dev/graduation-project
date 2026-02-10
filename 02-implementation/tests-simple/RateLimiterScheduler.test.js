/**
 * RateLimiterScheduler 단위 테스트
 * Token Bucket 알고리즘 테스트
 */
const {
	RateLimiterScheduler,
	DEFAULT_REFILL_RATE,
	DEFAULT_BUCKET_CAPACITY,
} = require("../src-simple/schedulers/RateLimiterScheduler");

// ============================================
// 기본 동작 테스트
// ============================================
describe("RateLimiterScheduler - Basic Operations", () => {
	let scheduler;

	beforeEach(() => {
		scheduler = new RateLimiterScheduler();
	});

	afterEach(() => {
		scheduler.stopRefilling();
	});

	test("스케줄러 이름이 RateLimiter여야 함", () => {
		expect(scheduler.name).toBe("RateLimiter");
	});

	test("기본 설정값 확인", () => {
		expect(scheduler.refillRate).toBe(DEFAULT_REFILL_RATE); // 10
		expect(scheduler.bucketCapacity).toBe(DEFAULT_BUCKET_CAPACITY); // 50
	});

	test("초기 토큰 수가 버킷 용량과 같음", () => {
		expect(scheduler.getCurrentTokens()).toBe(DEFAULT_BUCKET_CAPACITY);
	});

	test("커스텀 설정으로 생성 가능", () => {
		const customScheduler = new RateLimiterScheduler({
			refillRate: 100,
			bucketCapacity: 200,
		});
		expect(customScheduler.refillRate).toBe(100);
		expect(customScheduler.bucketCapacity).toBe(200);
		customScheduler.stopRefilling();
	});
});

// ============================================
// 토큰 충전 (Refill) 테스트
// ============================================
describe("RateLimiterScheduler - Token Refill", () => {
	let scheduler;

	beforeEach(() => {
		// Fake timers 사용
		jest.useFakeTimers();
		scheduler = new RateLimiterScheduler({
			refillRate: 10, // 10 tokens/sec
			bucketCapacity: 50,
		});
	});

	afterEach(() => {
		scheduler.stopRefilling();
		jest.useRealTimers();
	});

	test("수동 충전으로 토큰 증가", () => {
		// 먼저 타이머를 진행시켜 생성 시점에서의 시간 경과를 방지
		jest.advanceTimersByTime(0);

		// 모든 토큰 사용
		for (let i = 0; i < 50; i++) {
			scheduler.enqueue({ id: `req-${i}` });
		}

		// 토큰이 0이어야 함
		expect(scheduler.getCurrentTokens()).toBeLessThan(1);

		// 100ms 경과 후 수동 충전 = 1 token (10 * 0.1)
		jest.advanceTimersByTime(100);
		scheduler.manualRefill();

		expect(scheduler.getCurrentTokens()).toBeGreaterThanOrEqual(0.9);
	});

	test("버킷 용량 초과 시 토큰이 용량으로 제한됨", () => {
		jest.advanceTimersByTime(0);

		// 45개 토큰 사용
		for (let i = 0; i < 5; i++) {
			scheduler.enqueue({ id: `req-${i}` });
		}

		// 1초 경과 = 10 tokens 추가 (45 + 10 = 55 > 50)
		jest.advanceTimersByTime(1000);
		scheduler.manualRefill();

		expect(scheduler.getCurrentTokens()).toBeLessThanOrEqual(50); // 용량 제한
	});

	test("토큰이 0 미만으로 내려가지 않음", () => {
		// 모든 토큰 사용
		for (let i = 0; i < 50; i++) {
			scheduler.enqueue({ id: `req-${i}` });
		}
		// 한 번 더 사용 시도 (토큰 없음)
		scheduler.enqueue({ id: "req-50" });

		expect(scheduler.getCurrentTokens()).toBeLessThan(1); // 0 근처
	});
});

// ============================================
// 요청 허용/거부 테스트
// ============================================
describe("RateLimiterScheduler - Request Allow/Deny", () => {
	let scheduler;

	beforeEach(() => {
		scheduler = new RateLimiterScheduler({
			refillRate: 10,
			bucketCapacity: 5, // 작은 용량으로 테스트
		});
	});

	afterEach(() => {
		scheduler.stopRefilling();
	});

	test("토큰이 있으면 요청 허용", () => {
		const req = { id: "req-1", prompt: "test" };
		const result = scheduler.enqueue(req);

		expect(result.allowed).toBe(true);
		expect(result.tokens).toBe(1);
		expect(result.waitTime).toBe(0);
	});

	test("토큰이 없으면 요청 거부", () => {
		scheduler.setCurrentTokens(0);

		const req = { id: "req-1", prompt: "test" };
		const result = scheduler.enqueue(req);

		expect(result.allowed).toBe(false);
		expect(result.tokens).toBe(0);
		expect(result.waitTime).toBeGreaterThan(0); // 대기 시간 계산됨
	});

	test("대기 시간이 정확히 계산됨", () => {
		scheduler.setCurrentTokens(0);
		scheduler.refillRate = 10; // 1 token = 100ms

		const req = { id: "req-1", prompt: "test" };
		const result = scheduler.enqueue(req);

		// 1 token / 10 tokens/sec = 0.1 sec = 100ms
		expect(result.waitTime).toBeCloseTo(100, 0);
	});

	test("허용된 요청에 남은 토큰 수 포함", () => {
		const req = { id: "req-1", prompt: "test" };
		const result = scheduler.enqueue(req);

		expect(result.allowed).toBe(true);
		expect(result.remainingTokens).toBe(4); // 5 - 1
	});
});

// ============================================
// 토큰 고갈 (Token Exhaustion) 테스트
// ============================================
describe("RateLimiterScheduler - Token Exhaustion", () => {
	let scheduler;

	beforeEach(() => {
		scheduler = new RateLimiterScheduler({
			refillRate: 10,
			bucketCapacity: 3,
		});
	});

	afterEach(() => {
		scheduler.stopRefilling();
	});

	test("모든 토큰 사용 시 요청 거부", () => {
		// 3개 요청 허용
		for (let i = 0; i < 3; i++) {
			const result = scheduler.enqueue({ id: `req-${i}` });
			expect(result.allowed).toBe(true);
		}

		// 4번째 요청 거부
		const result = scheduler.enqueue({ id: "req-3" });
		expect(result.allowed).toBe(false);
	});

	test("토큰 소비 후 현재 토큰 수 감소", () => {
		expect(scheduler.getCurrentTokens()).toBe(3);

		scheduler.enqueue({ id: "req-1" });
		expect(scheduler.getCurrentTokens()).toBe(2);

		scheduler.enqueue({ id: "req-2" });
		expect(scheduler.getCurrentTokens()).toBe(1);
	});
});

// ============================================
// 통계 (Statistics) 테스트
// ============================================
describe("RateLimiterScheduler - Statistics", () => {
	let scheduler;

	beforeEach(() => {
		scheduler = new RateLimiterScheduler({
			refillRate: 10,
			bucketCapacity: 5,
		});
	});

	afterEach(() => {
		scheduler.stopRefilling();
	});

	test("getStats가 현재 상태 반환", () => {
		scheduler.enqueue({ id: "req-1" });
		scheduler.enqueue({ id: "req-2" });

		scheduler.setCurrentTokens(0);
		scheduler.enqueue({ id: "req-3" }); // 거부

		const stats = scheduler.getStats();

		expect(stats.refillRate).toBe(10);
		expect(stats.bucketCapacity).toBe(5);
		expect(stats.allowed).toBe(2);
		expect(stats.denied).toBe(1);
		expect(stats.totalRequests).toBe(3);
	});

	test("허용률이 정확히 계산됨", () => {
		scheduler.enqueue({ id: "req-1" }); // 허용
		scheduler.enqueue({ id: "req-2" }); // 허용
		scheduler.setCurrentTokens(0);
		scheduler.enqueue({ id: "req-3" }); // 거부

		const stats = scheduler.getStats();
		expect(stats.allowRate).toBe("66.67%");
	});

	test("resetStats가 통계 초기화", () => {
		scheduler.enqueue({ id: "req-1" });
		scheduler.resetStats();

		const stats = scheduler.getStats();
		expect(stats.allowed).toBe(0);
		expect(stats.denied).toBe(0);
		expect(stats.totalRequests).toBe(0);
	});

	test("요청 없으면 허용률 0%", () => {
		const stats = scheduler.getStats();
		expect(stats.allowRate).toBe("0%");
	});
});

// ============================================
// 큐 관리 테스트
// ============================================
describe("RateLimiterScheduler - Queue Management", () => {
	let scheduler;

	beforeEach(() => {
		scheduler = new RateLimiterScheduler({
			refillRate: 10,
			bucketCapacity: 3,
		});
	});

	afterEach(() => {
		scheduler.stopRefilling();
	});

	test("dequeue가 허용된 요청만 반환", () => {
		scheduler.enqueue({ id: "req-1" }); // 허용
		scheduler.enqueue({ id: "req-2" }); // 허용
		scheduler.setCurrentTokens(0);
		scheduler.enqueue({ id: "req-3" }); // 거부

		expect(scheduler.dequeue().id).toBe("req-1");
		expect(scheduler.dequeue().id).toBe("req-2");
		expect(scheduler.dequeue()).toBeNull(); // 허용된 요청 없음
	});

	test("size가 전체 큐 크기 반환", () => {
		scheduler.enqueue({ id: "req-1" });
		scheduler.enqueue({ id: "req-2" });
		scheduler.setCurrentTokens(0);
		scheduler.enqueue({ id: "req-3" }); // 거부되지만 큐에는 있음

		expect(scheduler.size()).toBe(3);
	});

	test("allowedSize가 허용된 요청만 반환", () => {
		scheduler.enqueue({ id: "req-1" });
		scheduler.enqueue({ id: "req-2" });
		scheduler.setCurrentTokens(0);
		scheduler.enqueue({ id: "req-3" }); // 거부

		expect(scheduler.allowedSize()).toBe(2);
	});

	test("deniedSize가 거부된 요청만 반환", () => {
		scheduler.enqueue({ id: "req-1" });
		scheduler.setCurrentTokens(0);
		scheduler.enqueue({ id: "req-2" }); // 거부
		scheduler.enqueue({ id: "req-3" }); // 거부

		expect(scheduler.deniedSize()).toBe(2);
	});

	test("clearDeniedRequests가 거부된 요청만 제거", () => {
		scheduler.enqueue({ id: "req-1" });
		scheduler.setCurrentTokens(0);
		scheduler.enqueue({ id: "req-2" }); // 거부
		scheduler.enqueue({ id: "req-3" }); // 거부

		scheduler.clearDeniedRequests();

		expect(scheduler.size()).toBe(1);
		expect(scheduler.deniedSize()).toBe(0);
	});

	test("removeRequest가 특정 요청 제거", () => {
		scheduler.enqueue({ id: "req-1" });
		scheduler.enqueue({ id: "req-2" });
		scheduler.enqueue({ id: "req-3" });

		expect(scheduler.removeRequest("req-2")).toBe(true);
		expect(scheduler.size()).toBe(2);

		expect(scheduler.removeRequest("req-999")).toBe(false);
		expect(scheduler.size()).toBe(2);
	});
});

// ============================================
// 동시 요청 (Concurrent Requests) 테스트
// ============================================
describe("RateLimiterScheduler - Concurrent Requests", () => {
	let scheduler;

	beforeEach(() => {
		scheduler = new RateLimiterScheduler({
			refillRate: 100, // 높은 충전율
			bucketCapacity: 10,
		});
	});

	afterEach(() => {
		scheduler.stopRefilling();
	});

	test("동시 요청 시 순차적 토큰 소비", () => {
		const results = [];

		for (let i = 0; i < 15; i++) {
			const result = scheduler.enqueue({ id: `req-${i}` });
			results.push(result);
		}

		// 처음 10개는 허용
		const allowedCount = results.filter((r) => r.allowed).length;
		const deniedCount = results.filter((r) => !r.allowed).length;

		expect(allowedCount).toBe(10);
		expect(deniedCount).toBe(5);
	});

	test("버스트 요청 처리 (용량만큼 즉시 허용)", () => {
		// 50개 요청 동시 도착
		const burstScheduler = new RateLimiterScheduler({
			refillRate: 10,
			bucketCapacity: 50,
		});

		let allowedCount = 0;
		for (let i = 0; i < 50; i++) {
			const result = burstScheduler.enqueue({ id: `req-${i}` });
			if (result.allowed) allowedCount++;
		}

		expect(allowedCount).toBe(50); // 모두 허용

		burstScheduler.stopRefilling();
	});
});

// ============================================
// 타이머 테스트
// ============================================
describe("RateLimiterScheduler - Timer", () => {
	test("startRefilling 후 stopRefilling으로 중지", (done) => {
		const scheduler = new RateLimiterScheduler({
			refillRate: 10,
			bucketCapacity: 50,
		});

		expect(scheduler.refillTimer).not.toBeNull();

		scheduler.stopRefilling();
		expect(scheduler.refillTimer).toBeNull();

		// 여러 번 호출해도 문제 없음
		scheduler.stopRefilling();
		expect(scheduler.refillTimer).toBeNull();

		done();
	});
});

// ============================================
// 경계값 (Edge Cases) 테스트
// ============================================
describe("RateLimiterScheduler - Edge Cases", () => {
	test("0 충전율 설정", () => {
		const scheduler = new RateLimiterScheduler({
			refillRate: 0,
			bucketCapacity: 10,
		});

		// 모든 토큰 사용
		for (let i = 0; i < 10; i++) {
			scheduler.enqueue({ id: `req-${i}` });
		}

		// 더 이상 허용 안 됨
		const result = scheduler.enqueue({ id: "req-10" });
		expect(result.allowed).toBe(false);

		scheduler.stopRefilling();
	});

	test("용량 1 설정", () => {
		const scheduler = new RateLimiterScheduler({
			refillRate: 10,
			bucketCapacity: 1,
		});

		const result1 = scheduler.enqueue({ id: "req-1" });
		expect(result1.allowed).toBe(true);

		// 모든 토큰 사용 (1개만 있었으므로)
		const result2 = scheduler.enqueue({ id: "req-2" });
		expect(result2.allowed).toBe(false);

		scheduler.stopRefilling();
	});

	test("매우 낮은 충전율 (소수점 처리)", () => {
		jest.useFakeTimers();
		const scheduler = new RateLimiterScheduler({
			refillRate: 0.1, // 6분에 1 토큰
			bucketCapacity: 10,
		});

		// 모든 토큰 사용
		for (let i = 0; i < 10; i++) {
			scheduler.enqueue({ id: `req-${i}` });
		}

		// 5초 경과 = 0.5 토큰
		jest.advanceTimersByTime(5000);
		scheduler.manualRefill();

		expect(scheduler.getCurrentTokens()).toBeCloseTo(0.5, 0);

		scheduler.stopRefilling();
		jest.useRealTimers();
	});
});

// ============================================
// rateLimitResult 속성 테스트
// ============================================
describe("RateLimiterScheduler - rateLimitResult Property", () => {
	let scheduler;

	beforeEach(() => {
		scheduler = new RateLimiterScheduler({
			refillRate: 10,
			bucketCapacity: 5,
		});
	});

	afterEach(() => {
		scheduler.stopRefilling();
	});

	test("허용된 요청에 rateLimitResult 포함", () => {
		const req = { id: "req-1", prompt: "test" };
		scheduler.enqueue(req);

		expect(req.rateLimitResult).toBeDefined();
		expect(req.rateLimitResult.allowed).toBe(true);
	});

	test("거부된 요청에 rateLimitResult 포함", () => {
		scheduler.setCurrentTokens(0);
		const req = { id: "req-1", prompt: "test" };
		scheduler.enqueue(req);

		expect(req.rateLimitResult).toBeDefined();
		expect(req.rateLimitResult.allowed).toBe(false);
	});
});
