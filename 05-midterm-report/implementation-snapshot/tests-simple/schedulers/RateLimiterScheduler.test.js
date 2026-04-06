/**
 * RateLimiterScheduler 테스트
 * Token Bucket 알고리즘 기반 Rate Limiter 테스트
 */
const {
	RateLimiterScheduler,
	DEFAULT_REFILL_RATE,
	DEFAULT_BUCKET_CAPACITY,
	DEFAULT_REFILL_INTERVAL_MS,
} = require("../../src-simple/schedulers/RateLimiterScheduler");
const FCFSScheduler = require("../../src-simple/schedulers/FCFSScheduler");

describe("RateLimiterScheduler", () => {
	let scheduler;

	beforeEach(() => {
		scheduler = new RateLimiterScheduler();
	});

	afterEach(() => {
		scheduler.stopRefilling();
	});

	// ============================================
	// Test 1: Basic request scheduling
	// ============================================
	describe("Basic request scheduling", () => {
		test("요청 enqueue 후 허용된 요청 dequeue 가능", () => {
			const request = { id: "1", prompt: "test" };
			const result = scheduler.enqueue(request);

			expect(result.allowed).toBe(true);
			expect(result.tokens).toBe(1);
			expect(result.waitTime).toBe(0);

			const dequeued = scheduler.dequeue();
			expect(dequeued).toBe(request);
		});

		test("빈 큐에서 dequeue하면 null 반환", () => {
			expect(scheduler.dequeue()).toBeNull();
		});

		test("여러 요청 순차 처리", () => {
			const req1 = { id: "1", prompt: "first" };
			const req2 = { id: "2", prompt: "second" };
			const req3 = { id: "3", prompt: "third" };

			scheduler.enqueue(req1);
			scheduler.enqueue(req2);
			scheduler.enqueue(req3);

			expect(scheduler.dequeue()).toBe(req1);
			expect(scheduler.dequeue()).toBe(req2);
			expect(scheduler.dequeue()).toBe(req3);
		});
	});

	// ============================================
	// Test 2: Token bucket refill mechanism
	// ============================================
	describe("Token bucket refill mechanism", () => {
		test("초기 토큰은 bucket_capacity로 설정", () => {
			expect(scheduler.getCurrentTokens()).toBeCloseTo(DEFAULT_BUCKET_CAPACITY, 0);
		});

		test("refillRate에 따라 토큰 충전", () => {
			scheduler.setCurrentTokens(0);

			// 수동 충전 실행
			scheduler.manualRefill();

			// 충전 간격이 경과하지 않았으므로 토큰이 거의 증가하지 않음
			// 하지만 refillInterval 동안 대기 후 충전하면 증가
			const tokensBefore = scheduler.getCurrentTokens();

			// 100ms 대기 (refillInterval)
			const startTime = Date.now();
			while (Date.now() - startTime < 150) {
				// busy wait for test
			}

			scheduler.manualRefill();
			const tokensAfter = scheduler.getCurrentTokens();

			// 최소한 같거나 증가해야 함
			expect(tokensAfter).toBeGreaterThanOrEqual(tokensBefore);
		});

		test("bucket_capacity를 초과하여 충전되지 않음", () => {
			scheduler.setCurrentTokens(DEFAULT_BUCKET_CAPACITY - 1);

			// 충전 실행
			scheduler.manualRefill();

			// capacity를 초과하지 않아야 함
			expect(scheduler.getCurrentTokens()).toBeLessThanOrEqual(
				DEFAULT_BUCKET_CAPACITY
			);
		});

		test("수동 refill 메서드 동작", () => {
			scheduler.setCurrentTokens(10);
			scheduler.lastRefillTime = Date.now() - 1000; // 1초 전으로 설정

			scheduler.manualRefill();

			// 1초 * refillRate만큼 증가해야 함
			// 하지만 capacity 제한 있음
			expect(scheduler.getCurrentTokens()).toBeGreaterThan(10);
		});
	});

	// ============================================
	// Test 3: Bucket capacity enforcement
	// ============================================
	describe("Bucket capacity enforcement", () => {
		test("커스텀 bucket_capacity로 생성", () => {
			const customScheduler = new RateLimiterScheduler({
				bucketCapacity: 100,
			});
			customScheduler.stopRefilling();

			expect(customScheduler.getCurrentTokens()).toBeCloseTo(100, 0);
			expect(customScheduler.bucketCapacity).toBe(100);
		});

		test("setCurrentTokens이 capacity를 초과하지 않음", () => {
			scheduler.setCurrentTokens(1000); // capacity(50) 초과

			expect(scheduler.getCurrentTokens()).toBeCloseTo(DEFAULT_BUCKET_CAPACITY, 0);
		});

		test("setCurrentTokens이 음수를 0으로 clamping", () => {
			scheduler.setCurrentTokens(-10);

			expect(scheduler.getCurrentTokens()).toBeCloseTo(0, 0);
		});

		test("커스텀 refillRate로 생성", () => {
			const customScheduler = new RateLimiterScheduler({
				refillRate: 20,
			});
			customScheduler.stopRefilling();

			expect(customScheduler.refillRate).toBe(20);
		});
	});

	// ============================================
	// Test 4: Token exhaustion handling
	// ============================================
	describe("Token exhaustion handling", () => {
		test("토큰 고갈 시 요청 거부", () => {
			scheduler.setCurrentTokens(0);

			const request = { id: "1", prompt: "test" };
			const result = scheduler.enqueue(request);

			expect(result.allowed).toBe(false);
			expect(result.tokens).toBe(0);
			expect(result.waitTime).toBeGreaterThan(0);
		});

		test("거부된 요청은 큐에 저장되지만 dequeue되지 않음", () => {
			scheduler.setCurrentTokens(0);

			const request = { id: "1", prompt: "test" };
			scheduler.enqueue(request);

			// 큐에는 있음
			expect(scheduler.size()).toBe(1);

			// 하지만 dequeue는 null (거부되었으므로)
			expect(scheduler.dequeue()).toBeNull();
		});

		test("토큰이 있을 때 다시 허용", () => {
			scheduler.setCurrentTokens(0);

			const req1 = { id: "1", prompt: "test" };
			const result1 = scheduler.enqueue(req1);
			expect(result1.allowed).toBe(false);

			// 토큰 충전
			scheduler.setCurrentTokens(1);

			const req2 = { id: "2", prompt: "test" };
			const result2 = scheduler.enqueue(req2);
			expect(result2.allowed).toBe(true);

			// req2만 dequeue 가능
			expect(scheduler.dequeue()).toBe(req2);
		});

		test("waitTime 계산 정확성", () => {
			scheduler.setCurrentTokens(0);

			const request = { id: "1", prompt: "test" };
			const result = scheduler.enqueue(request);

			// waitTime = (1 / refillRate) * 1000 ms
			// default refillRate = 10
			const expectedWaitTime = (1 / DEFAULT_REFILL_RATE) * 1000;
			expect(result.waitTime).toBeCloseTo(expectedWaitTime, 0);
		});
	});

	// ============================================
	// Test 5: Concurrent requests
	// ============================================
	describe("Concurrent requests", () => {
		test("버스트 요청 처리 (capacity 내)", () => {
			const requests = [];
			for (let i = 0; i < DEFAULT_BUCKET_CAPACITY; i++) {
				const req = { id: `${i}`, prompt: "test" };
				const result = scheduler.enqueue(req);
				expect(result.allowed).toBe(true);
				requests.push(req);
			}

			// 모두 허용되어야 함
			expect(scheduler.allowedSize()).toBe(DEFAULT_BUCKET_CAPACITY);
			expect(scheduler.deniedSize()).toBe(0);
		});

		test("버스트 요청 초과 시 초과분 거부", () => {
			// capacity + 1 개 요청
			for (let i = 0; i < DEFAULT_BUCKET_CAPACITY + 1; i++) {
				scheduler.enqueue({ id: `${i}`, prompt: "test" });
			}

			// 첫 capacity개는 허용
			expect(scheduler.allowedSize()).toBe(DEFAULT_BUCKET_CAPACITY);

			// 마지막 1개는 거부
			expect(scheduler.deniedSize()).toBe(1);
		});

		test("허용된 요청만 dequeue 가능", () => {
			scheduler.setCurrentTokens(2);

			scheduler.enqueue({ id: "1", prompt: "test" });
			scheduler.enqueue({ id: "2", prompt: "test" });
			scheduler.enqueue({ id: "3", prompt: "test" });

			// 첫 2개만 허용
			expect(scheduler.allowedSize()).toBe(2);
			expect(scheduler.deniedSize()).toBe(1);

			// dequeue는 허용된 요청만
			const req1 = scheduler.dequeue();
			expect(req1).toBeDefined();
			expect(req1.rateLimitResult.allowed).toBe(true);
		});
	});

	// ============================================
	// Test 6: Fairness metrics calculation
	// ============================================
	describe("Fairness metrics calculation", () => {
		test("getStats가 통계 반환", () => {
			scheduler.setCurrentTokens(5);

			for (let i = 0; i < 3; i++) {
				scheduler.enqueue({ id: `${i}`, prompt: "test" });
			}

			scheduler.setCurrentTokens(0);
			scheduler.enqueue({ id: "3", prompt: "test" }); // 거부

			const stats = scheduler.getStats();

			expect(stats).toHaveProperty("refillRate");
			expect(stats).toHaveProperty("bucketCapacity");
			expect(stats).toHaveProperty("currentTokens");
			expect(stats).toHaveProperty("allowed");
			expect(stats).toHaveProperty("denied");
			expect(stats).toHaveProperty("totalRequests");
			expect(stats).toHaveProperty("allowRate");
		});

		test("allowRate 계산 정확성", () => {
			scheduler.setCurrentTokens(3);

			// 3개 허용
			for (let i = 0; i < 3; i++) {
				scheduler.enqueue({ id: `${i}`, prompt: "test" });
			}

			scheduler.setCurrentTokens(0);

			// 1개 거부
			scheduler.enqueue({ id: "3", prompt: "test" });

			const stats = scheduler.getStats();

			expect(stats.totalRequests).toBe(4);
			expect(stats.allowed).toBe(3);
			expect(stats.denied).toBe(1);
			expect(stats.allowRate).toBe("75.00%");
		});

		test("resetStats로 통계 초기화", () => {
			scheduler.enqueue({ id: "1", prompt: "test" });
			scheduler.enqueue({ id: "2", prompt: "test" });

			scheduler.resetStats();

			const stats = scheduler.getStats();
			expect(stats.allowed).toBe(0);
			expect(stats.denied).toBe(0);
			expect(stats.totalRequests).toBe(0);
			expect(stats.allowRate).toBe("0%");
		});
	});

	// ============================================
	// Test 7: Comparison with FCFS baseline
	// ============================================
	describe("Comparison with FCFS baseline", () => {
		test("FCFS와 유사한 enqueue/dequeue 동작 (토큰 충분 시)", () => {
			const fcfs = new FCFSScheduler();
			const rateLimiter = new RateLimiterScheduler();

			const req1 = { id: "1", prompt: "test" };
			const req2 = { id: "2", prompt: "test" };
			const req3 = { id: "3", prompt: "test" };

			fcfs.enqueue(req1);
			fcfs.enqueue(req2);
			fcfs.enqueue(req3);

			rateLimiter.enqueue(req1);
			rateLimiter.enqueue(req2);
			rateLimiter.enqueue(req3);

			// 순서 동일하게 유지
			expect(rateLimiter.dequeue().id).toBe(fcfs.dequeue().id);
			expect(rateLimiter.dequeue().id).toBe(fcfs.dequeue().id);
			expect(rateLimiter.dequeue().id).toBe(fcfs.dequeue().id);

			rateLimiter.stopRefilling();
		});

		test("RateLimiter는 FCFS와 달리 요청 거부 가능", () => {
			const fcfs = new FCFSScheduler();
			const rateLimiter = new RateLimiterScheduler();

			// FCFS는 모든 요청 수락
			const reqFcfs = { id: "1", prompt: "test" };
			fcfs.enqueue(reqFcfs);
			expect(fcfs.size()).toBe(1);

			// RateLimiter는 토큰 부족 시 거부
			rateLimiter.setCurrentTokens(0);
			const reqRateLimiter = { id: "1", prompt: "test" };
			const result = rateLimiter.enqueue(reqRateLimiter);
			expect(result.allowed).toBe(false);

			rateLimiter.stopRefilling();
		});

		test("size() 메서드 동일하게 동작", () => {
			const fcfs = new FCFSScheduler();
			const rateLimiter = new RateLimiterScheduler();

			expect(fcfs.size()).toBe(0);
			expect(rateLimiter.size()).toBe(0);

			const req1 = { id: "1", prompt: "test" };
			fcfs.enqueue(req1);
			rateLimiter.enqueue(req1);

			expect(fcfs.size()).toBe(1);
			expect(rateLimiter.size()).toBe(1);

			rateLimiter.stopRefilling();
		});
	});

	// ============================================
	// Test 8: Edge cases (empty queue, single request)
	// ============================================
	describe("Edge cases", () => {
		test("빈 큐에서 getCurrentTokens", () => {
			const tokens = scheduler.getCurrentTokens();
			expect(tokens).toBe(DEFAULT_BUCKET_CAPACITY);
		});

		test("단일 요청 처리", () => {
			const request = { id: "1", prompt: "test" };
			scheduler.enqueue(request);

			expect(scheduler.size()).toBe(1);
			expect(scheduler.allowedSize()).toBe(1);

			const dequeued = scheduler.dequeue();
			expect(dequeued.id).toBe("1");
			expect(scheduler.size()).toBe(0);
		});

		test("단일 요청 토큰 고갈 시 거부", () => {
			scheduler.setCurrentTokens(0);

			const request = { id: "1", prompt: "test" };
			const result = scheduler.enqueue(request);

			expect(result.allowed).toBe(false);
			expect(scheduler.deniedSize()).toBe(1);
		});

		test("clearDeniedRequests로 거부된 요청 정리", () => {
			scheduler.setCurrentTokens(1);

			scheduler.enqueue({ id: "1", prompt: "test" }); // 허용

			scheduler.setCurrentTokens(0);
			scheduler.enqueue({ id: "2", prompt: "test" }); // 거부

			expect(scheduler.size()).toBe(2);
			expect(scheduler.deniedSize()).toBe(1);

			scheduler.clearDeniedRequests();

			expect(scheduler.size()).toBe(1);
			expect(scheduler.deniedSize()).toBe(0);
		});

		test("removeRequest로 특정 요청 제거", () => {
			scheduler.enqueue({ id: "1", prompt: "test" });
			scheduler.enqueue({ id: "2", prompt: "test" });

			expect(scheduler.size()).toBe(2);

			const removed = scheduler.removeRequest("1");
			expect(removed).toBe(true);
			expect(scheduler.size()).toBe(1);

			// 존재하지 않는 ID
			const removedAgain = scheduler.removeRequest("999");
			expect(removedAgain).toBe(false);
		});

		test("isEmpty 기본 구현 사용", () => {
			expect(scheduler.isEmpty()).toBe(true);

			scheduler.enqueue({ id: "1", prompt: "test" });
			expect(scheduler.isEmpty()).toBe(false);
		});
	});

	// ============================================
	// Test 9: Rate limit enforcement
	// ============================================
	describe("Rate limit enforcement", () => {
		test("refillRate에 따른 속도 제한", () => {
			scheduler.setCurrentTokens(0);

			// 즉시 3개 요청 - 모두 거부되어야 함
			const results = [];
			for (let i = 0; i < 3; i++) {
				const req = { id: `${i}`, prompt: "test" };
				const result = scheduler.enqueue(req);
				results.push(result);
			}

			expect(results.every((r) => r.allowed === false)).toBe(true);
			expect(scheduler.deniedSize()).toBe(3);
		});

		test("request.rateLimitResult에 정보 저장", () => {
			scheduler.setCurrentTokens(5);

			const req1 = { id: "1", prompt: "test" };
			scheduler.enqueue(req1);

			expect(req1.rateLimitResult).toBeDefined();
			expect(req1.rateLimitResult.allowed).toBe(true);
			expect(req1.rateLimitResult.remainingTokens).toBe(4);

			scheduler.setCurrentTokens(0);

			const req2 = { id: "2", prompt: "test" };
			scheduler.enqueue(req2);

			expect(req2.rateLimitResult).toBeDefined();
			expect(req2.rateLimitResult.allowed).toBe(false);
			expect(req2.rateLimitResult.waitTime).toBeGreaterThan(0);
		});

		test("remainingTokens 정확히 계산", () => {
			scheduler.setCurrentTokens(10);

			scheduler.enqueue({ id: "1", prompt: "test" });
			scheduler.enqueue({ id: "2", prompt: "test" });

			const stats = scheduler.getStats();
					expect(stats.currentTokens).toBeCloseTo(8, 0);
		});
	});

	// ============================================
	// Test 10: Integration with existing queue system
	// ============================================
	describe("Integration with existing queue system", () => {
		test("BaseScheduler 상속 확인", () => {
			expect(scheduler.name).toBe("RateLimiter");
			expect(scheduler.enqueue).toBeDefined();
			expect(scheduler.dequeue).toBeDefined();
			expect(scheduler.size).toBeDefined();
			expect(scheduler.isEmpty).toBeDefined();
		});

		test("허용된 요청만 dequeue로 반환", () => {
			scheduler.setCurrentTokens(2);

			scheduler.enqueue({ id: "1", prompt: "test" });
			scheduler.enqueue({ id: "2", prompt: "test" });

			scheduler.setCurrentTokens(0);
			scheduler.enqueue({ id: "3", prompt: "test" }); // 거부

			// 허용된 요청만 처리
			const req1 = scheduler.dequeue();
			expect(req1.id).toBe("1");

			const req2 = scheduler.dequeue();
			expect(req2.id).toBe("2");

			// 거부된 요청은 dequeue 안 됨
			const req3 = scheduler.dequeue();
			expect(req3).toBeNull();
		});

		test("startRefilling과 stopRefilling 동작", () => {
			const testScheduler = new RateLimiterScheduler();

			expect(testScheduler.refillTimer).not.toBeNull();

			testScheduler.stopRefilling();
			expect(testScheduler.refillTimer).toBeNull();

			testScheduler.startRefilling();
			expect(testScheduler.refillTimer).not.toBeNull();

			testScheduler.stopRefilling();
		});

		test("이미 실행 중인 타이머에 startRefilling 호출 시 중복 생성 방지", () => {
			const originalTimer = scheduler.refillTimer;

			scheduler.startRefilling();

			expect(scheduler.refillTimer).toBe(originalTimer);
		});

		test("요청 객체에 다른 속성 보존", () => {
			const request = {
				id: "1",
				prompt: "test prompt",
				priority: "HIGH",
				tenantId: "tenant-a",
				customData: { key: "value" },
			};

			scheduler.enqueue(request);

			const dequeued = scheduler.dequeue();
			expect(dequeued.prompt).toBe("test prompt");
			expect(dequeued.priority).toBe("HIGH");
			expect(dequeued.tenantId).toBe("tenant-a");
			expect(dequeued.customData).toEqual({ key: "value" });
		});
	});

	// ============================================
	// Additional: 크기 메서드들
	// ============================================
	describe("Size methods", () => {
		test("allowedSize가 허용된 요청만 반환", () => {
			scheduler.setCurrentTokens(3);

			for (let i = 0; i < 5; i++) {
				scheduler.enqueue({ id: `${i}`, prompt: "test" });
			}

			expect(scheduler.allowedSize()).toBe(3);
		});

		test("deniedSize가 거부된 요청만 반환", () => {
			scheduler.setCurrentTokens(2);

			for (let i = 0; i < 5; i++) {
				scheduler.enqueue({ id: `${i}`, prompt: "test" });
			}

			expect(scheduler.deniedSize()).toBe(3);
		});

		test("size가 전체 요청 수 반환", () => {
			scheduler.setCurrentTokens(2);

			for (let i = 0; i < 5; i++) {
				scheduler.enqueue({ id: `${i}`, prompt: "test" });
			}

			expect(scheduler.size()).toBe(5);
		});
	});
});
