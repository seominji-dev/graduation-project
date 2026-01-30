/**
 * 고급 시나리오 예제 1: MLFQ Boosting 동작
 * 
 * 이 예제는 MLFQ 스케줄러의 Boosting 메커니즘이
 * 기아 현상을 어떻게 방지하는지 보여줍니다.
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// 짧은 요청 생성 (빠르게 완료됨)
async function createShortRequest(id: number) {
  return axios.post(`${API_BASE_URL}/requests`, {
    prompt: `짧은 요청 ${id}`,
    provider: 'ollama',
    metadata: { type: 'short', id }
  });
}

// 긴 요청 생성 (오래 걸림)
async function createLongRequest(id: number) {
  return axios.post(`${API_BASE_URL}/requests`, {
    prompt: `긴 배치 작업 ${id}: 대량의 텍스트를 분석하고 요약해주세요. `.repeat(100),
    provider: 'ollama',
    metadata: { type: 'long', id }
  });
}

// MLFQ 큐 레벨 조회
async function getQueueLevels() {
  const response = await axios.get(`${API_BASE_URL}/schedulers/mlfq/queues`);
  console.log('\n=== 현재 큐 상태 ===');
  console.log('Q0 (1초):', response.data.q0.length, '개');
  console.log('Q1 (3초):', response.data.q1.length, '개');
  console.log('Q2 (8초):', response.data.q2.length, '개');
  console.log('Q3 (무제한):', response.data.q3.length, '개');
  return response.data;
}

// Boosting 시뮬레이션
async function simulateBoostingScenario() {
  console.log('=== MLFQ Boosting 시나리오 ===\n');
  
  // 1. MLFQ 스케줄러 활성화
  console.log('1. MLFQ 스케줄러 활성화...');
  await axios.post(`${API_BASE_URL}/schedulers/switch`, { type: 'mlfq' });
  
  // 2. 긴 요청 먼저 제출 (Q0 -> Q1 -> Q2 -> Q3로 이동 예정)
  console.log('\n2. 긴 배치 작업 2개 제출...');
  const longRequest1 = await createLongRequest(1);
  const longRequest2 = await createLongRequest(2);
  console.log('  - 긴 요청 1:', longRequest1.data.requestId);
  console.log('  - 긴 요청 2:', longRequest2.data.requestId);
  
  // 3. 짧은 요청 계속 제출 (Q0에서 빠르게 처리됨)
  console.log('\n3. 짧은 요청 10개 연속 제출...');
  for (let i = 1; i <= 10; i++) {
    await createShortRequest(i);
    console.log(`  - 짧은 요청 ${i} 제출됨`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 4. 큐 상태 확인 (긴 요청은 Q3로 강등되었을 가능성)
  console.log('\n4. 큐 상태 확인...');
  await getQueueLevels();
  
  // 5. Boosting 대기 (60초 후 모든 작업이 Q0로 이동)
  console.log('\n5. Boosting 대기 중... (실제로는 60초 소요)');
  console.log('   * Boosting이 발생하면 Q3의 긴 요청도 Q0로 이동합니다.');
  console.log('   * 이를 통해 긴 작업도 공정하게 처리 기회를 얻습니다.');
  
  // 6. Boosting 후 상태 시뮬레이션
  console.log('\n=== Boosting 효과 ===');
  console.log('Before Boosting:');
  console.log('  Q0: [짧은 요청들]');
  console.log('  Q1: []');
  console.log('  Q2: []');
  console.log('  Q3: [긴 요청 1, 긴 요청 2] ← 기아 위험!');
  console.log('\nAfter Boosting:');
  console.log('  Q0: [모든 요청] ← 공정한 기회!');
  console.log('  Q1: []');
  console.log('  Q2: []');
  console.log('  Q3: []');
}

simulateBoostingScenario().catch(console.error);
