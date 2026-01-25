/**
 * K6 Load Test - MLFQ Scheduler
 * Tests Multi-Level Feedback Queue with varying request durations
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

// Request duration distribution: 40% short, 35% medium, 25% long
const requestTypes = [
  {
    type: 'short',
    weight: 0.40,
    prompts: [
      'What is 2+2?',
      'Hello!',
      'Yes or no?',
      'Quick help.',
    ],
    expectedQueue: 0,
  },
  {
    type: 'medium',
    weight: 0.35,
    prompts: [
      'Explain recursion in programming.',
      'What is the difference between TCP and UDP?',
      'Write a function to reverse a string.',
    ],
    expectedQueue: 1,
  },
  {
    type: 'long',
    weight: 0.25,
    prompts: [
      'Explain the architecture of modern operating systems.',
      'Compare different machine learning algorithms in detail.',
      'Describe the history of artificial intelligence.',
    ],
    expectedQueue: 2,
  },
];

function getRandomRequest() {
  const rand = Math.random();
  let cumulative = 0;

  for (const reqType of requestTypes) {
    cumulative += reqType.weight;
    if (rand <= cumulative) {
      const prompt = reqType.prompts[Math.floor(Math.random() * reqType.prompts.length)];
      return { prompt, type: reqType.type, expectedQueue: reqType.expectedQueue };
    }
  }
  return {
    prompt: requestTypes[0].prompts[0],
    type: 'short',
    expectedQueue: 0,
  };
}

export default function () {
  const request = getRandomRequest();

  const payload = JSON.stringify({
    prompt: request.prompt,
    provider: {
      name: 'ollama',
      model: 'llama3.2',
    },
    metadata: {
      test: 'mlfq-benchmark',
      requestType: request.type,
      expectedQueue: request.expectedQueue,
      timestamp: new Date().toISOString(),
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: {
      name: 'MLFQ_Benchmark',
      requestType: request.type,
    },
  };

  const res = http.post(`${BASE_URL}/api/requests`, payload, params);

  check(res, {
    'status is 202': (r) => r.status === 202,
    'has requestId': (r) => r.json('requestId') !== undefined,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Short requests wait less (simulating interactive users)
  const sleepTime = request.type === 'short' ? 0.5 : request.type === 'medium' ? 1 : 2;
  sleep(sleepTime);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'mlfq-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options || {};
  const cyan = enableColors ? '\x1b[36m' : '';
  const reset = enableColors ? '\x1b[0m' : '';

  let summary = '';
  summary += `${indent}${cyan}MLFQ Scheduler Benchmark${reset}\n`;
  summary += `${indent}=========================\n`;
  summary += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}Success Rate: ${((1 - data.metrics.http_req_failed.values.rate) * 100).toFixed(2)}%\n`;
  summary += `${indent}Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}Min Response Time: ${data.metrics.http_req_duration.values.min.toFixed(2)}ms\n`;
  summary += `${indent}Max Response Time: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n`;

  summary += `${indent}\nExpected Queue Distribution:\n`;
  summary += `${indent}  Q0 (short): ~40% of requests\n`;
  summary += `${indent}  Q1 (medium): ~35% of requests\n`;
  summary += `${indent}  Q2 (long): ~25% of requests\n`;

  return summary;
}
