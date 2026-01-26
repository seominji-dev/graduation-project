/**
 * K6 Load Test - Priority Scheduler
 * Tests priority-based scheduling with mixed priority levels
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

// Priority distribution: 30% URGENT, 25% HIGH, 30% NORMAL, 15% LOW
const priorityLevels = [
  { value: 3, weight: 0.30, name: 'URGENT' },
  { value: 2, weight: 0.25, name: 'HIGH' },
  { value: 1, weight: 0.30, name: 'NORMAL' },
  { value: 0, weight: 0.15, name: 'LOW' },
];

function getRandomPriority() {
  const rand = Math.random();
  let cumulative = 0;

  for (const level of priorityLevels) {
    cumulative += level.weight;
    if (rand <= cumulative) {
      return level;
    }
  }
  return priorityLevels[2]; // Default to NORMAL
}

const prompts = [
  'Quick question: What is AI?',
  'Urgent: Calculate 123 * 456',
  'Help needed with debugging',
  'System error: need assistance',
  'General inquiry about APIs',
];

export default function () {
  const priority = getRandomPriority();
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];

  const payload = JSON.stringify({
    prompt: prompt,
    provider: {
      name: 'ollama',
      model: 'llama3.2',
    },
    priority: priority.value,
    metadata: {
      test: 'priority-benchmark',
      priorityLevel: priority.name,
      timestamp: new Date().toISOString(),
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: {
      name: 'Priority_Benchmark',
      priority: priority.name,
    },
  };

  const res = http.post(`${BASE_URL}/api/requests`, payload, params);

  check(res, {
    'status is 202': (r) => r.status === 202,
    'has requestId': (r) => r.json('requestId') !== undefined,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Urgent requests should wait less between them
  const sleepTime = priority.value === 3 ? 0.5 : 1;
  sleep(sleepTime);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'priority-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options || {};
  const cyan = enableColors ? '\x1b[36m' : '';
  const reset = enableColors ? '\x1b[0m' : '';

  let summary = '';
  summary += `${indent}${cyan}Priority Scheduler Benchmark${reset}\n`;
  summary += `${indent}=============================\n`;
  summary += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}Success Rate: ${((1 - data.metrics.http_req_failed.values.rate) * 100).toFixed(2)}%\n`;
  summary += `${indent}Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}P99 Response Time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;

  // Priority breakdown (from tags)
  const priorityStats = {};
  for (const metric of Object.values(data.metrics)) {
    if (metric.type === 'trend' && metric.tags?.priority) {
      const p = metric.tags.priority;
      if (!priorityStats[p]) {
        priorityStats[p] = { count: 0, avgTime: 0 };
      }
      priorityStats[p].count += metric.values.count || 0;
      priorityStats[p].avgTime = metric.values.avg || 0;
    }
  }

  summary += `${indent}\nPriority Breakdown:\n`;
  for (const [p, stats] of Object.entries(priorityStats)) {
    summary += `${indent}  ${p}: ${stats.count} requests, avg ${stats.avgTime.toFixed(2)}ms\n`;
  }

  return summary;
}
