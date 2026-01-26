/**
 * K6 Load Test - FCFS Scheduler
 * Baseline performance test for First-Come First-Served scheduling
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Sustained load at 50 users
    { duration: '30s', target: 100 },  // Peak load at 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.05'],     // Error rate under 5%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Test prompts (varying complexity)
const prompts = [
  'What is 2+2?',
  'Hello, how are you?',
  'Explain quantum computing in one sentence.',
  'Write a haiku about programming.',
  'What is the capital of France?',
];

export default function () {
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];

  const payload = JSON.stringify({
    prompt: prompt,
    provider: {
      name: 'ollama',
      model: 'llama3.2',
    },
    metadata: {
      test: 'fcfs-benchmark',
      timestamp: new Date().toISOString(),
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: {
      name: 'FCFS_Benchmark',
    },
  };

  const res = http.post(`${BASE_URL}/api/requests`, payload, params);

  // Validate response
  check(res, {
    'status is 202': (r) => r.status === 202,
    'has requestId': (r) => r.json('requestId') !== undefined,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // 1 second between requests per user
}

// Teardown: Collect results
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'fcfs-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options || {};
  const cyan = enableColors ? '\x1b[36m' : '';
  const reset = enableColors ? '\x1b[0m' : '';

  let summary = '';
  summary += `${indent}${cyan}FCFS Scheduler Benchmark${reset}\n`;
  summary += `${indent}========================\n`;
  summary += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}Success Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  summary += `${indent}Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}Throughput: ${data.metrics.http_reqs.values.count.toFixed(2)} req/s\n`;

  return summary;
}
