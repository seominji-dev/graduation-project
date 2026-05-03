/**
 * Ollama Real Server Experiment
 *
 * Measures actual LLM inference scheduling behavior using a local Ollama instance.
 * Tests FCFS, Priority, and WFQ schedulers with 20 real requests across 4 tenant tiers.
 *
 * Key insight: Preemption is impossible during LLM inference.
 * All schedulers run non-preemptively — the difference is only in request ORDER.
 *
 * Usage: node run-ollama-experiment.js
 *        OLLAMA_MODEL=<model-tag> node run-ollama-experiment.js  (override default model)
 * Prerequisite: Ollama running at http://localhost:11434 with the target model pulled
 */

const path = require('path');
const fs = require('fs');

const FCFSScheduler = require('../src-simple/schedulers/FCFSScheduler');
const { PriorityScheduler, PRIORITY } = require('../src-simple/schedulers/PriorityScheduler');
const { WFQScheduler } = require('../src-simple/schedulers/WFQScheduler');

// ============================================
// Experiment Configuration
// ============================================

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = process.env.OLLAMA_MODEL || 'gemma4:e4b';
const MAX_TOKENS = 20;
const OUTPUT_PATH = path.join(__dirname, 'ollama-results.json');

// 4 tenant tiers, 5 requests each = 20 total
const TENANTS = [
  { id: 'enterprise', tier: 'enterprise', weight: 100 },
  { id: 'premium',    tier: 'premium',    weight: 50  },
  { id: 'standard',   tier: 'standard',   weight: 10  },
  { id: 'free',       tier: 'free',       weight: 1   },
];

// Short prompts — designed for minimal token output (10-20 tokens)
const PROMPTS = [
  'What is 2+2? Reply in one word.',
  'Name one primary color. One word only.',
  'Say hello in one word.',
  'What is the capital of France? One word.',
  'Name a fruit. One word only.',
];

// Priority assignments per request index (0-4) for Priority scheduler
// Each tenant gets varied priorities to make the scheduler meaningful
const PRIORITY_ASSIGNMENTS = {
  enterprise: ['URGENT', 'HIGH',   'URGENT', 'HIGH',   'NORMAL'],
  premium:    ['HIGH',   'NORMAL', 'HIGH',   'URGENT', 'NORMAL'],
  standard:   ['NORMAL', 'LOW',    'NORMAL', 'HIGH',   'LOW'   ],
  free:       ['LOW',    'NORMAL', 'LOW',    'LOW',    'NORMAL'],
};

// Numeric priority values for the Priority scheduler
const PRIORITY_VALUES = {
  URGENT: 4,
  HIGH:   3,
  NORMAL: 2,
  LOW:    1,
};

// ============================================
// Request Factory
// ============================================

/**
 * Build the 20 base request objects (before scheduler-specific fields).
 * All requests are created upfront with the same createdAt timestamp group
 * to simulate a burst scenario.
 *
 * @returns {Array<Object>} 20 request descriptors
 */
function buildRequests() {
  const requests = [];
  const batchCreatedAt = Date.now();

  TENANTS.forEach((tenant) => {
    PROMPTS.forEach((prompt, idx) => {
      const priorityLabel = PRIORITY_ASSIGNMENTS[tenant.id][idx];
      requests.push({
        id:            `${tenant.id}-req-${idx + 1}`,
        tenantId:      tenant.id,
        tier:          tenant.tier,
        prompt,
        priority:      PRIORITY_VALUES[priorityLabel],
        priorityLabel,
        createdAt:     batchCreatedAt,
      });
    });
  });

  return requests;
}

// ============================================
// Ollama API Call
// ============================================

/**
 * Send a single prompt to Ollama and return timing information.
 *
 * @param {string} prompt - The prompt text
 * @returns {Promise<Object>} { processingTimeMs, ollamaDurationNs, response }
 */
async function callOllama(prompt) {
  const wallStart = Date.now();

  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: {
        num_predict: MAX_TOKENS,
        temperature: 0,       // Reproducibility
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const wallEnd = Date.now();

  return {
    processingTimeMs:  wallEnd - wallStart,
    ollamaDurationNs:  data.total_duration || 0,   // nanoseconds from Ollama
    generatedTokens:   data.eval_count     || 0,
    responseText:      data.response       || '',
  };
}

// ============================================
// Scheduler Runner
// ============================================

/**
 * Run one scheduler pass over 20 requests:
 *   1. Enqueue all requests upfront
 *   2. Dequeue in scheduler order
 *   3. Send each to Ollama sequentially (no concurrency — mirrors real inference)
 *   4. Record wait time and processing time per request
 *
 * @param {string} schedulerName - 'fcfs' | 'priority' | 'wfq'
 * @param {Array<Object>} requests - 20 request descriptors
 * @returns {Promise<Object>} scheduler result object
 */
async function runScheduler(schedulerName, requests) {
  console.log(`\n--- ${schedulerName.toUpperCase()} ---`);

  // Build fresh scheduler instance
  let scheduler;
  if (schedulerName === 'fcfs') {
    scheduler = new FCFSScheduler();
  } else if (schedulerName === 'priority') {
    const ps = new PriorityScheduler();
    scheduler = ps;
  } else if (schedulerName === 'wfq') {
    const wfq = new WFQScheduler();
    // Pre-register tenants with their weights
    TENANTS.forEach(({ id, tier, weight }) => wfq.registerTenant(id, tier, weight));
    scheduler = wfq;
  } else {
    throw new Error(`Unknown scheduler: ${schedulerName}`);
  }

  // Clone requests so each scheduler run is independent
  const clonedRequests = requests.map((r) => ({ ...r }));

  // Enqueue all requests upfront (burst arrival)
  const enqueueTime = Date.now();
  clonedRequests.forEach((req) => {
    req.createdAt = enqueueTime;   // all arrive at the same moment
    scheduler.enqueue(req);
  });

  // Process requests one-by-one in scheduler order
  const resultRequests = [];
  let requestIndex = 0;
  const schedulerStartTime = Date.now();

  while (!scheduler.isEmpty()) {
    const req = scheduler.dequeue();
    if (!req) break;

    requestIndex++;
    const processStartTime = Date.now();
    const waitTimeMs = processStartTime - req.createdAt;

    // Actual Ollama inference
    const ollamaResult = await callOllama(req.prompt);

    const processingTimeMs = ollamaResult.processingTimeMs;

    // Console progress
    const secProcessing = (processingTimeMs / 1000).toFixed(2);
    console.log(
      `[${String(requestIndex).padStart(2, '0')}/20] ${req.tenantId.padEnd(10)} ` +
      `(${req.priorityLabel.padEnd(6)}) "${req.prompt.substring(0, 30)}..." -> ${secProcessing}s`
    );

    resultRequests.push({
      id:              req.id,
      tenantId:        req.tenantId,
      tier:            req.tier,
      priority:        req.priority,
      priorityLabel:   req.priorityLabel,
      prompt:          req.prompt,
      waitTimeMs,
      processingTimeMs,
      ollamaDurationNs: ollamaResult.ollamaDurationNs,
      generatedTokens:  ollamaResult.generatedTokens,
    });
  }

  const totalTimeMs = Date.now() - schedulerStartTime;

  // Aggregate stats
  const avgWaitMs       = resultRequests.reduce((s, r) => s + r.waitTimeMs,       0) / resultRequests.length;
  const avgProcessingMs = resultRequests.reduce((s, r) => s + r.processingTimeMs, 0) / resultRequests.length;

  // Per-tenant average wait times
  const tenantWaitTimes = {};
  TENANTS.forEach(({ id }) => {
    const tenantReqs = resultRequests.filter((r) => r.tenantId === id);
    tenantWaitTimes[id] = tenantReqs.length
      ? tenantReqs.reduce((s, r) => s + r.waitTimeMs, 0) / tenantReqs.length
      : 0;
  });

  console.log(
    `${schedulerName.toUpperCase()} complete: avg wait ${(avgWaitMs / 1000).toFixed(2)}s, ` +
    `avg processing ${(avgProcessingMs / 1000).toFixed(2)}s`
  );

  return {
    avgWaitTime:       avgWaitMs,
    avgProcessingTime: avgProcessingMs,
    totalTime:         totalTimeMs,
    tenantWaitTimes,
    requests:          resultRequests,
  };
}

// ============================================
// Main Entry Point
// ============================================

async function main() {
  console.log('=== Ollama Real Server Experiment ===');
  console.log(`Model: ${MODEL}, Requests: 20`);
  console.log(`Output: ${OUTPUT_PATH}\n`);

  // Verify Ollama is reachable before starting
  try {
    const health = await fetch('http://localhost:11434/api/tags');
    if (!health.ok) throw new Error('Ollama health check failed');
    console.log('Ollama connection: OK');
  } catch (err) {
    console.error(`ERROR: Cannot reach Ollama at localhost:11434`);
    console.error(`Make sure Ollama is running: ollama serve`);
    console.error(`And the model is available: ollama pull gemma4:e4b`);
    process.exit(1);
  }

  // Warm up Ollama to avoid cold start bias on first scheduler
  console.log('\nWarming up Ollama (loading model into memory)...');
  const warmupStart = Date.now();
  await callOllama('Say OK.');
  console.log(`Warm-up complete (${((Date.now() - warmupStart) / 1000).toFixed(1)}s)\n`);

  // Build 20 request descriptors
  const requests = buildRequests();

  // Run each scheduler sequentially (they share the same Ollama instance)
  const fcfsResult     = await runScheduler('fcfs',     requests);
  const priorityResult = await runScheduler('priority', requests);
  const wfqResult      = await runScheduler('wfq',      requests);

  // Build output JSON
  const output = {
    config: {
      model:              MODEL,
      totalRequests:      20,
      tenantsPerTier:     1,
      requestsPerTenant:  5,
      maxTokens:          MAX_TOKENS,
      timestamp:          new Date().toISOString(),
      ollamaUrl:          OLLAMA_URL,
    },
    results: {
      fcfs:     fcfsResult,
      priority: priorityResult,
      wfq:      wfqResult,
    },
    comparison: {
      avgProcessingTime: 'Real LLM inference time (milliseconds)',
      note:              'Preemption impossible - all schedulers run non-preemptive',
      interpretation:    'Scheduler difference is in request ORDER, not processing speed',
      tenantWeights:     { enterprise: 100, premium: 50, standard: 10, free: 1 },
    },
  };

  // Save results
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\nResults saved to ${OUTPUT_PATH}`);

  // Print comparison summary
  console.log('\n=== Summary ===');
  ['fcfs', 'priority', 'wfq'].forEach((name) => {
    const r = output.results[name];
    console.log(
      `${name.toUpperCase().padEnd(8)} | ` +
      `avg wait: ${(r.avgWaitTime / 1000).toFixed(2)}s | ` +
      `avg processing: ${(r.avgProcessingTime / 1000).toFixed(2)}s | ` +
      `total: ${(r.totalTime / 1000).toFixed(2)}s`
    );
  });
}

main().catch((err) => {
  console.error('Experiment failed:', err);
  process.exit(1);
});
