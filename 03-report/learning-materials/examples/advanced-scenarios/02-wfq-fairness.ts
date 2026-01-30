/**
 * 고급 시나리오 예제 2: WFQ 공정성 분석
 * 
 * 이 예제는 WFQ 스케줄러가 멀티테넌트 환경에서
 * 어떻게 공정한 자원 분배를 달성하는지 보여줍니다.
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// 테넌트 정의
const tenants = [
  { id: 'enterprise-1', tier: 'enterprise', weight: 100 },
  { id: 'premium-1', tier: 'premium', weight: 50 },
  { id: 'standard-1', tier: 'standard', weight: 10 },
  { id: 'free-1', tier: 'free', weight: 1 }
];

// 테넌트별 요청 제출
async function submitTenantRequest(tenantId: string, requestNum: number) {
  return axios.post(`${API_BASE_URL}/requests`, {
    prompt: `테넌트 ${tenantId} 요청 ${requestNum}`,
    provider: 'ollama',
    metadata: { tenantId, requestNum }
  });
}

// 공정성 지수 조회
async function getFairnessMetrics() {
  const response = await axios.get(`${API_BASE_URL}/schedulers/wfq/fairness`);
  return response.data;
}

// Jain's Fairness Index 계산 설명
function explainJainsFairnessIndex() {
  console.log('\n=== Jain\'s Fairness Index 이해하기 ===\n');
  
  console.log('공식: J = (Σxi)² / (n × Σxi²)');
  console.log('');
  console.log('여기서:');
  console.log('  xi = 각 사용자의 자원 할당량');
  console.log('  n  = 사용자 수');
  console.log('');
  console.log('해석:');
  console.log('  J = 1.0  : 완벽한 공정성 (모두 동일한 비율)');
  console.log('  J = 0.5  : 중간 공정성');
  console.log('  J = 1/n  : 최악의 공정성 (한 명이 독점)');
  console.log('');
  console.log('목표: J >= 0.95');
}

// WFQ 공정성 시뮬레이션
async function simulateWFQFairness() {
  console.log('=== WFQ 공정성 시나리오 ===\n');
  
  // 1. WFQ 스케줄러 활성화
  console.log('1. WFQ 스케줄러 활성화...');
  await axios.post(`${API_BASE_URL}/schedulers/switch`, { type: 'wfq' });
  
  // 2. 테넌트 등록 (실제로는 자동 등록될 수 있음)
  console.log('\n2. 테넌트 가중치 설정:');
  for (const tenant of tenants) {
    console.log(`  - ${tenant.id}: Weight ${tenant.weight} (${tenant.tier})`);
  }
  
  // 3. 각 테넌트에서 동일한 수의 요청 제출
  console.log('\n3. 각 테넌트에서 5개씩 요청 제출...');
  for (const tenant of tenants) {
    for (let i = 1; i <= 5; i++) {
      await submitTenantRequest(tenant.id, i);
    }
    console.log(`  - ${tenant.id}: 5개 요청 제출 완료`);
  }
  
  // 4. Virtual Time 계산 예시
  console.log('\n4. Virtual Time 계산 예시:');
  console.log('   모든 요청의 Service Time = 10ms라고 가정');
  console.log('');
  console.log('   Enterprise (Weight 100):');
  console.log('     VFT = 0 + (10 / 100) = 0.1 ← 가장 먼저 처리');
  console.log('');
  console.log('   Premium (Weight 50):');
  console.log('     VFT = 0 + (10 / 50) = 0.2');
  console.log('');
  console.log('   Standard (Weight 10):');
  console.log('     VFT = 0 + (10 / 10) = 1.0');
  console.log('');
  console.log('   Free (Weight 1):');
  console.log('     VFT = 0 + (10 / 1) = 10.0 ← 가장 나중에 처리');
  
  // 5. 공정성 지수 설명
  explainJainsFairnessIndex();
  
  // 6. 예상 결과
  console.log('\n=== 예상 결과 ===');
  console.log('');
  console.log('테넌트별 처리량 (100 요청 기준):');
  console.log('  Enterprise: ~62개 (62%)  - Weight 100');
  console.log('  Premium:    ~31개 (31%)  - Weight 50');
  console.log('  Standard:    ~6개 (6%)   - Weight 10');
  console.log('  Free:        ~1개 (1%)   - Weight 1');
  console.log('');
  console.log('Jain\'s Fairness Index: 0.92-0.98');
  console.log('→ 가중치에 비례한 공정한 분배 달성!');
}

simulateWFQFairness().catch(console.error);
