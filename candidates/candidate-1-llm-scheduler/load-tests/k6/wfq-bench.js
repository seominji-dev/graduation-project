/**
 * K6 Load Test - WFQ Scheduler
 * Tests Weighted Fair Queuing with multiple tenants
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Tenant configuration with weights
const tenants = [
  { id: 'tenant-enterprise', name: 'Enterprise', weight: 100, ratio: 0.20 },
  { id: 'tenant-premium', name: 'Premium', weight: 50, ratio: 0.25 },
  { id: 'tenant-standard', name: 'Standard', weight: 10, ratio: 0.35 },
  { id: 'tenant-free', name: 'Free', weight: 1, ratio: 0.20 },
];

function getRandomTenant() {
  const rand = Math.random();
  let cumulative = 0;

  for (const tenant of tenants) {
    cumulative += tenant.ratio;
    if (rand <= cumulative) {
      return tenant;
    }
  }
  return tenants[2]; // Default to Standard
}

const prompts = [
  'What is cloud computing?',
  'Explain microservices architecture.',
  'How does load balancing work?',
  'What is a REST API?',
  'Describe database sharding.',
];

// Track per-tenant metrics
const tenantMetrics = new Map();

export default function () {
  const tenant = getRandomTenant();
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];

  // Initialize tenant metrics if needed
  if (!tenantMetrics.has(tenant.id)) {
    tenantMetrics.set(tenant.id, {
      requests: 0,
      totalResponseTime: 0,
    });
  }

  const payload = JSON.stringify({
    prompt: prompt,
    provider: {
      name: 'ollama',
      model: 'llama3.2',
    },
    tenantId: tenant.id,
    metadata: {
      test: 'wfq-benchmark',
      tenantName: tenant.name,
      tenantWeight: tenant.weight,
      timestamp: new Date().toISOString(),
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: {
      name: 'WFQ_Benchmark',
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantWeight: tenant.weight,
    },
  };

  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/api/requests`, payload, params);
  const responseTime = Date.now() - startTime;

  // Update tenant metrics
  const metrics = tenantMetrics.get(tenant.id);
  metrics.requests++;
  metrics.totalResponseTime += responseTime;

  check(res, {
    'status is 202': (r) => r.status === 202,
    'has requestId': (r) => r.json('requestId') !== undefined,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Higher tier tenants wait less
  const sleepTime = tenant.weight >= 50 ? 0.5 : tenant.weight >= 10 ? 1 : 1.5;
  sleep(sleepTime);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'wfq-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options || {};
  const cyan = enableColors ? '\x1b[36m' : '';
  const reset = enableColors ? '\x1b[0m' : '';

  let summary = '';
  summary += `${indent}${cyan}WFQ Scheduler Benchmark${reset}\n`;
  summary += `${indent}======================\n`;
  summary += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}Success Rate: ${((1 - data.metrics.http_req_failed.values.rate) * 100).toFixed(2)}%\n`;
  summary += `${indent}Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;

  // Calculate fairness metrics
  const tenantCount = tenantMetrics.size;
  let totalAvgResponseTime = 0;
  const avgResponseTimes = [];

  summary += `${indent}\nPer-Tenant Statistics:\n`;
  for (const [tenantId, metrics] of tenantMetrics.entries()) {
    const avgResponseTime = metrics.totalResponseTime / metrics.requests;
    avgResponseTimes.push(avgResponseTime);
    totalAvgResponseTime += avgResponseTime;

    const tenant = tenants.find((t) => t.id === tenantId);
    summary += `${indent}  ${tenant.name.padEnd(12)} (${tenant.weight.toString().padStart(3)}w): `;
    summary += `${metrics.requests.toString().padStart(4)} req, avg ${avgResponseTime.toFixed(2)}ms\n`;
  }

  // Jain's Fairness Index calculation
  // J = (sum(x))^2 / (n * sum(x^2))
  const mean = totalAvgResponseTime / tenantCount;
  const sumSquares = avgResponseTimes.reduce((sum, x) => sum + x * x, 0);
  const jainIndex = (totalAvgResponseTime * totalAvgResponseTime) / (tenantCount * sumSquares);

  summary += `${indent}\nFairness Metrics:\n`;
  summary += `${indent}  Jain's Fairness Index: ${jainIndex.toFixed(4)}\n`;
  summary += `${indent}  Target: >= 0.85\n`;
  summary += `${indent}  Status: ${jainIndex >= 0.85 ? '✅ PASS' : '❌ FAIL'}\n`;

  return summary;
}
