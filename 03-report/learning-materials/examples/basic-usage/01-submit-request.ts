/**
 * 기본 사용법 예제 1: 요청 제출
 * 
 * 이 예제는 LLM Scheduler에 요청을 제출하는 방법을 보여줍니다.
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// 1. 기본 요청 제출 (FCFS 스케줄러 사용)
async function submitBasicRequest() {
  const response = await axios.post(`${API_BASE_URL}/requests`, {
    prompt: '안녕하세요, 오늘 날씨는 어떤가요?',
    provider: 'ollama',
    priority: 'NORMAL',
    metadata: {
      userId: 'user-123',
      sessionId: 'session-456'
    }
  });

  console.log('요청 ID:', response.data.requestId);
  console.log('상태:', response.data.status);
  return response.data.requestId;
}

// 2. 우선순위가 다른 요청들 제출
async function submitPriorityRequests() {
  const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
  
  for (const priority of priorities) {
    const response = await axios.post(`${API_BASE_URL}/requests`, {
      prompt: `${priority} 우선순위 테스트 요청`,
      provider: 'ollama',
      priority: priority
    });
    console.log(`${priority} 요청 제출됨: ${response.data.requestId}`);
  }
}

// 3. 요청 상태 조회
async function checkRequestStatus(requestId: string) {
  const response = await axios.get(`${API_BASE_URL}/requests/${requestId}`);
  
  console.log('요청 상태:');
  console.log('  - ID:', response.data.id);
  console.log('  - 상태:', response.data.status);
  console.log('  - 우선순위:', response.data.priority);
  console.log('  - 생성 시간:', response.data.createdAt);
  
  if (response.data.status === 'completed') {
    console.log('  - 결과:', response.data.result);
    console.log('  - 처리 시간:', response.data.processedAt);
  }
  
  return response.data;
}

// 실행 예제
async function main() {
  try {
    console.log('=== LLM Scheduler 기본 사용법 ===\n');
    
    // 기본 요청 제출
    console.log('1. 기본 요청 제출...');
    const requestId = await submitBasicRequest();
    
    // 잠시 대기 후 상태 확인
    console.log('\n2. 상태 확인 (2초 후)...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await checkRequestStatus(requestId);
    
    // 우선순위별 요청 제출
    console.log('\n3. 우선순위별 요청 제출...');
    await submitPriorityRequests();
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

main();
