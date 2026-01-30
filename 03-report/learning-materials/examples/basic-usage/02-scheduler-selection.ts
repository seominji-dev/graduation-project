/**
 * 기본 사용법 예제 2: 스케줄러 선택
 * 
 * 이 예제는 4가지 스케줄링 알고리즘을 선택하고 사용하는 방법을 보여줍니다.
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// 스케줄러 유형 정의
type SchedulerType = 'fcfs' | 'priority' | 'mlfq' | 'wfq';

// 현재 활성 스케줄러 조회
async function getCurrentScheduler() {
  const response = await axios.get(`${API_BASE_URL}/schedulers/current`);
  console.log('현재 스케줄러:', response.data.type);
  console.log('통계:', response.data.stats);
  return response.data;
}

// 스케줄러 변경
async function switchScheduler(type: SchedulerType) {
  const response = await axios.post(`${API_BASE_URL}/schedulers/switch`, {
    type: type
  });
  console.log(`스케줄러 변경됨: ${type}`);
  return response.data;
}

// 각 스케줄러별 특성 설명
function explainScheduler(type: SchedulerType) {
  const explanations = {
    fcfs: {
      name: 'FCFS (First-Come, First-Served)',
      description: '가장 단순한 스케줄링. 도착 순서대로 처리.',
      useCase: '개발/테스트 환경, 성능 비교 기준',
      timeComplexity: 'O(1)'
    },
    priority: {
      name: 'Priority Scheduling',
      description: '우선순위 기반 처리. Aging으로 기아 방지.',
      useCase: '고객 지원 시스템, 긴급 요청 우선 처리',
      timeComplexity: 'O(log n)'
    },
    mlfq: {
      name: 'MLFQ (Multi-Level Feedback Queue)',
      description: '4단계 큐로 동적 우선순위 조정. Boosting 지원.',
      useCase: '대화형 + 배치 혼합 환경',
      timeComplexity: 'O(log n)'
    },
    wfq: {
      name: 'WFQ (Weighted Fair Queuing)',
      description: 'Virtual Time 기반 공정 분배. 멀티테넌트 지원.',
      useCase: 'SaaS 멀티테넌트 서비스',
      timeComplexity: 'O(log n)'
    }
  };

  const info = explanations[type];
  console.log(`\n=== ${info.name} ===`);
  console.log(`설명: ${info.description}`);
  console.log(`적합한 사용 케이스: ${info.useCase}`);
  console.log(`시간 복잡도: ${info.timeComplexity}`);
}

// 실행 예제
async function main() {
  console.log('=== 스케줄러 선택 가이드 ===\n');

  // 각 스케줄러 설명
  const schedulerTypes: SchedulerType[] = ['fcfs', 'priority', 'mlfq', 'wfq'];
  
  for (const type of schedulerTypes) {
    explainScheduler(type);
  }

  console.log('\n=== 스케줄러 선택 권장 사항 ===');
  console.log('- 소규모 서비스: Priority (Aging 포함)');
  console.log('- 대규모 SaaS: WFQ');
  console.log('- 혼합 워크로드: MLFQ');
  console.log('- 개발/테스트: FCFS');
}

main();
