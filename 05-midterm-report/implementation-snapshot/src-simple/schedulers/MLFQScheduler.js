/**
 * MLFQ (Multi-Level Feedback Queue) 스케줄러
 * 다단계 피드백 큐 - 4개의 우선순위 레벨
 *
 * Q0: 1000ms (최고 우선순위, 대화형 Short 요청)
 * Q1: 3000ms
 * Q2: 8000ms
 * Q3: 무제한 (배치 작업)
 *
 * MLFQ 5가지 규칙:
 * 1. Priority(A) > Priority(B) → A 먼저 실행
 * 2. Priority(A) = Priority(B) → FCFS
 * 3. 새 작업은 최상위 큐(Q0)에 배치
 * 4. 시간 할당량 소진 시 하위 큐로 이동
 * 5. 주기적 Boosting으로 모든 작업을 Q0로
 *
 * 선점형(Preemptive) 기능:
 * - 타임 슬라이스 단위 처리 (500ms)
 * - 중간 결과를 보존하고 요청을 하위 큐로 강등
 * - Round-Robin 방식으로 상위 큐 우선 처리
 */
const BaseScheduler = require("./BaseScheduler");

// 큐 레벨별 시간 할당량 (밀리초)
const TIME_QUANTUM = [1000, 3000, 8000, Infinity]; // Q0: 1초, Q1: 3초, Q2: 8초, Q3: 무제한
const NUM_QUEUES = 4;
const BOOST_INTERVAL_MS = 5000; // 5초마다 boosting (재실험을 위해 단축, 기존 30초)
const TIME_SLICE_MS = 500; // 타임 슬라이스: 선점 체크 주기

class MLFQScheduler extends BaseScheduler {
	constructor() {
		super("MLFQ");
		// 4개의 큐 배열 (Q0이 최고 우선순위)
		this.queues = [[], [], [], []];
		this.boostInterval = null;

		// 선점형 처리를 위한 현재 실행 중인 요청 추적
		this.currentRequest = null;
		this.currentRequestStartTime = null;
		this.currentRequestUsedTime = 0;
	}

	/**
	 * Boosting 시작 - 주기적으로 모든 작업을 Q0로 이동
	 */
	startBoosting() {
		this.boostInterval = setInterval(() => {
			this.boost();
		}, BOOST_INTERVAL_MS);
	}

	/**
	 * Boosting 중지
	 */
	stopBoosting() {
		if (this.boostInterval) {
			clearInterval(this.boostInterval);
			this.boostInterval = null;
		}
	}

	/**
	 * 모든 작업을 Q0로 이동 (기아 방지)
	 */
	boost() {
		const allRequests = [];
		for (let i = 0; i < NUM_QUEUES; i++) {
			allRequests.push(...this.queues[i]);
			this.queues[i] = [];
		}

		// 현재 실행 중인 요청이 있으면 처리
		if (this.currentRequest) {
			allRequests.push(this.currentRequest);
			this.currentRequest = null;
			this.currentRequestStartTime = null;
			this.currentRequestUsedTime = 0;
		}

		// 모든 요청을 Q0로 이동
		for (const request of allRequests) {
			request.queueLevel = 0;
			request.usedTime = 0;
		}
		this.queues[0] = allRequests;
	}

	/**
	 * 요청 추가 (새 작업은 Q0에 배치)
	 */
	enqueue(request) {
		request.queueLevel = 0;
		request.usedTime = 0;
		request.createdAt =
			request.createdAt !== undefined ? request.createdAt : Date.now();
		this.queues[0].push(request);
	}

	/**
	 * 다음 요청 선택 (높은 우선순위 큐부터)
	 * @returns {Object|null}
	 */
	dequeue() {
		for (let i = 0; i < NUM_QUEUES; i++) {
			if (this.queues[i].length > 0) {
				return this.queues[i].shift();
			}
		}
		return null;
	}

	/**
	 * 선점형 처리를 시작할 요청 설정
	 * @param {Object} request - 처리할 요청
	 */
	startProcessing(request) {
		this.currentRequest = request;
		this.currentRequestStartTime = Date.now();
		this.currentRequestUsedTime = request.usedTime || 0;
	}

	/**
	 * 타임 슬라이스 체크 (선점 여부 확인)
	 * @param {number} elapsedMs - 경과 시간 (밀리초)
	 * @returns {Object|null} 선점이 필요하면 {shouldPreempt: true, newQueueLevel: number}, 아니면 null
	 */
	checkPreemption(elapsedMs) {
		if (!this.currentRequest) {
			return null;
		}

		const totalUsedTime = this.currentRequestUsedTime + elapsedMs;
		const currentQueueLevel = this.currentRequest.queueLevel || 0;
		const timeQuantum = TIME_QUANTUM[currentQueueLevel];

		// 타임 할당량 초과 시 선점
		if (totalUsedTime >= timeQuantum && timeQuantum !== Infinity) {
			return {
				shouldPreempt: true,
				newQueueLevel: Math.min(currentQueueLevel + 1, NUM_QUEUES - 1),
				usedTime: totalUsedTime,
			};
		}

		return null;
	}

	/**
	 * 요청 선점 및 하위 큐로 이동
	 * @param {Object} preemptionInfo - 선점 정보
	 */
	preempt(preemptionInfo) {
		if (!this.currentRequest) {
			return;
		}

		const request = this.currentRequest;
		const newQueueLevel = preemptionInfo.newQueueLevel;

		// 요청 상태 업데이트
		request.queueLevel = newQueueLevel;
		request.usedTime = 0; // 새 큐에서 시간 초기화

		// 하위 큐에 재삽입
		this.queues[newQueueLevel].push(request);

		// 현재 요청 초기화
		this.currentRequest = null;
		this.currentRequestStartTime = null;
		this.currentRequestUsedTime = 0;
	}

	/**
	 * 현재 처리 중인 요청 완료
	 * @returns {Object|null} 완료된 요청
	 */
	completeCurrentRequest() {
		const request = this.currentRequest;
		this.currentRequest = null;
		this.currentRequestStartTime = null;
		this.currentRequestUsedTime = 0;
		return request;
	}

	/**
	 * 작업 완료 후 피드백 (시간 사용량에 따라 큐 레벨 조정)
	 * @param {Object} request - 완료된 요청
	 * @param {number} executionTime - 실행 시간 (밀리초)
	 */
	feedback(request, executionTime) {
		request.usedTime += executionTime;

		// 시간 할당량 초과 시 하위 큐로 이동
		if (request.usedTime >= TIME_QUANTUM[request.queueLevel]) {
			request.queueLevel = Math.min(request.queueLevel + 1, NUM_QUEUES - 1);
			request.usedTime = 0;
		}
	}

	/**
	 * 작업을 다시 큐에 넣기 (재시도 등)
	 * @param {Object} request - 재큐잉할 요청
	 */
	requeue(request) {
		const level = request.queueLevel || 0;
		this.queues[level].push(request);
	}

	/**
	 * 전체 큐 크기 반환
	 */
	size() {
		let total = this.queues.reduce((sum, q) => sum + q.length, 0);
		if (this.currentRequest) {
			total += 1;
		}
		return total;
	}

	/**
	 * 큐가 비어있는지 확인
	 */
	isEmpty() {
		if (this.currentRequest) {
			return false;
		}
		return this.queues.every((q) => q.length === 0);
	}

	/**
	 * 현재 처리 중인 요청 정보 반환
	 * @returns {Object|null} 현재 요청 정보
	 */
	getCurrentRequest() {
		return this.currentRequest;
	}

	/**
	 * 현재 요청의 남은 시간 할당량 계산
	 * @returns {number} 남은 시간 (밀리초)
	 */
	getRemainingTime() {
		if (!this.currentRequest) {
			return 0;
		}

		const currentQueueLevel = this.currentRequest.queueLevel || 0;
		const timeQuantum = TIME_QUANTUM[currentQueueLevel];
		return timeQuantum - this.currentRequestUsedTime;
	}
}

module.exports = { MLFQScheduler, TIME_QUANTUM, NUM_QUEUES, TIME_SLICE_MS };
