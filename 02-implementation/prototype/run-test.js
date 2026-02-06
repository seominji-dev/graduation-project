/**
 * 프로토타입 시뮬레이션 - FCFS vs Priority 간단 비교
 * OS 스케줄링 알고리즘이 LLM 요청 관리에 적용 가능한지 확인하기 위한 테스트
 * 작성일: 2026년 2월 초
 */

const { FCFSScheduler, PriorityScheduler, PRIORITY } = require('./scheduler-prototype');

// 테스트용 요청 15개 생성 (다양한 우선순위 섞기)
function createTestRequests() {
  const requests = [
    { id: 1,  prompt: '간단한 인사',      priority: PRIORITY.LOW,    estimatedTime: 100 },
    { id: 2,  prompt: '코드 리뷰',        priority: PRIORITY.NORMAL, estimatedTime: 300 },
    { id: 3,  prompt: '긴급 버그 분석',    priority: PRIORITY.URGENT, estimatedTime: 200 },
    { id: 4,  prompt: '문서 요약',         priority: PRIORITY.NORMAL, estimatedTime: 150 },
    { id: 5,  prompt: '보안 취약점 점검',   priority: PRIORITY.HIGH,   estimatedTime: 250 },
    { id: 6,  prompt: '일반 질문',         priority: PRIORITY.LOW,    estimatedTime: 100 },
    { id: 7,  prompt: '장애 대응',         priority: PRIORITY.URGENT, estimatedTime: 180 },
    { id: 8,  prompt: '데이터 분석',       priority: PRIORITY.NORMAL, estimatedTime: 350 },
    { id: 9,  prompt: '성능 최적화',       priority: PRIORITY.HIGH,   estimatedTime: 280 },
    { id: 10, prompt: '간단한 번역',       priority: PRIORITY.LOW,    estimatedTime: 80  },
    { id: 11, prompt: '긴급 보고서',       priority: PRIORITY.URGENT, estimatedTime: 220 },
    { id: 12, prompt: '코드 생성',         priority: PRIORITY.NORMAL, estimatedTime: 300 },
    { id: 13, prompt: '시스템 점검',       priority: PRIORITY.HIGH,   estimatedTime: 200 },
    { id: 14, prompt: '메모 작성',         priority: PRIORITY.LOW,    estimatedTime: 90  },
    { id: 15, prompt: '긴급 디버깅',       priority: PRIORITY.URGENT, estimatedTime: 170 },
  ];
  return requests;
}

// 스케줄러 시뮬레이션 실행
function simulate(scheduler, requests) {
  // 모든 요청 삽입
  for (const req of requests) {
    scheduler.enqueue({ ...req });
  }

  const results = [];
  let currentTime = 0;

  // 하나씩 꺼내면서 처리 (순서대로)
  while (!scheduler.isEmpty()) {
    const req = scheduler.dequeue();
    const waitTime = currentTime;
    currentTime += req.estimatedTime;

    results.push({
      id: req.id,
      prompt: req.prompt,
      priority: req.priority,
      waitTime,
      completedAt: currentTime,
    });
  }

  return results;
}

// 우선순위 이름 변환
const priorityName = { 0: 'LOW', 1: 'NORMAL', 2: 'HIGH', 3: 'URGENT' };

// 메인 실행
console.log('='.repeat(60));
console.log('  OS 스케줄링 프로토타입 - FCFS vs Priority 비교');
console.log('='.repeat(60));
console.log();

const requests = createTestRequests();

// FCFS 시뮬레이션
const fcfs = new FCFSScheduler();
const fcfsResults = simulate(fcfs, requests);

console.log('[ FCFS 결과 - 선착순 처리 ]');
console.log('-'.repeat(55));
for (const r of fcfsResults) {
  console.log(`  요청 #${String(r.id).padStart(2)}  ${priorityName[r.priority].padEnd(6)}  대기: ${String(r.waitTime).padStart(5)}ms  완료: ${String(r.completedAt).padStart(5)}ms`);
}

// Priority 시뮬레이션
const priority = new PriorityScheduler();
const priorityResults = simulate(priority, requests);

console.log();
console.log('[ Priority 결과 - 우선순위 기반 처리 ]');
console.log('-'.repeat(55));
for (const r of priorityResults) {
  console.log(`  요청 #${String(r.id).padStart(2)}  ${priorityName[r.priority].padEnd(6)}  대기: ${String(r.waitTime).padStart(5)}ms  완료: ${String(r.completedAt).padStart(5)}ms`);
}

// 우선순위별 평균 대기시간 비교
console.log();
console.log('='.repeat(60));
console.log('  우선순위별 평균 대기시간 비교');
console.log('='.repeat(60));

for (const p of [PRIORITY.URGENT, PRIORITY.HIGH, PRIORITY.NORMAL, PRIORITY.LOW]) {
  const fcfsAvg = fcfsResults.filter(r => r.priority === p).reduce((sum, r) => sum + r.waitTime, 0) / fcfsResults.filter(r => r.priority === p).length;
  const priAvg = priorityResults.filter(r => r.priority === p).reduce((sum, r) => sum + r.waitTime, 0) / priorityResults.filter(r => r.priority === p).length;
  const diff = fcfsAvg - priAvg;
  const pct = fcfsAvg > 0 ? ((diff / fcfsAvg) * 100).toFixed(1) : '0.0';

  console.log(`  ${priorityName[p].padEnd(6)}  FCFS: ${String(Math.round(fcfsAvg)).padStart(5)}ms  Priority: ${String(Math.round(priAvg)).padStart(5)}ms  차이: ${diff > 0 ? '+' : ''}${Math.round(diff)}ms (${pct}%)`);
}

console.log();
console.log('결론: Priority 스케줄링에서 URGENT 요청이 더 빠르게 처리됨을 확인');
console.log('→ OS 스케줄링 알고리즘을 LLM 요청 관리에 적용하는 것이 타당함');
