# Experiment Environment Specification

Comprehensive experiment configuration for the final report.
Created from code analysis of `02-implementation/experiments-simple/` and `src-simple/schedulers/`.

Resolves professor feedback:
- "혼합" request type is undefined → defined below
- Request patterns are vague → specified below
- Basic vs additional experiment distinction unclear → clarified below
- JFI calculation location → answered below

---

## 1. Experiment Types Used in the Report

The final report (v5) is based on THREE experiment scripts. An earlier `run-experiments.js` (100 requests) exists in the repository but is NOT cited in the final report; it is superseded by `run-extended.js` (500 requests).

### Experiment 1: Basic (기본 실험) — reported in §5.2, §5.5

| Setting | Value | Source |
|---------|-------|--------|
| Script | `run-extended.js` | (supersedes `run-experiments.js`) |
| Request count | 500 | line 34 |
| Tenant count | 4 (Enterprise, Premium, Standard, Free) | lines 44-49 |
| Requests per tenant | 125 (round-robin distribution) | line 94 |
| Processing time | 10~100ms (uniform random) | lines 36-37 |
| Arrival pattern | Sequential, 1~10ms random gaps | lines 38-39, 105 |
| Schedulers tested | FCFS, Priority, MLFQ (non-preemptive), WFQ | |
| Seed | 42 (fixed for reproducibility) | line 40 |
| Output file | `extended-results.json` | |

### Experiment 2: MLFQ Preemptive Multi-Seed (부록 B) — reported in §5.3, Appendix B

| Setting | Value | Source |
|---------|-------|--------|
| Script | `run-multi-seed.js` | |
| Request count | 500 per seed (25 bursts × 20 requests) | lines 33-34 |
| Seeds | 5 (12345, 23456, 34567, 45678, 56789) | line 31 |
| Schedulers tested | FCFS (non-preemptive) vs MLFQ (preemptive) | |
| Arrival pattern | Burst: 20 requests simultaneous, then 2000ms gap | line 93 |
| Processing times | Mixed categories (Short/Medium/Long) | lines 43-47 |
| Output directory | `multi-seed-results/` (summary.json + per-seed files) | |

### Experiment 3: Real Server Validation (실서버 실험) — reported in §5.4

| Setting | Value | Source |
|---------|-------|--------|
| Script | `run-ollama-experiment.js` | |
| Request count | 20 (4 tenants × 5 prompts) | lines 31-45 |
| Model | llama3.2 (via Ollama) | line 26 |
| Max output tokens | 20 | line 27 |
| Schedulers tested | FCFS, Priority, WFQ (MLFQ excluded — equals FCFS under non-preemption) | |
| Output file | `ollama-results.json` | |

### Why Three Experiments?

- **Basic experiment (500 requests)**: All 4 schedulers compared under uniform, short-processing-time conditions. Demonstrates baseline behavior.
- **MLFQ preemptive multi-seed**: Because non-preemptive MLFQ produces identical results to FCFS (all short requests complete in Q0), an additional preemption-simulating experiment was run across 5 seeds to verify MLFQ's theoretical benefit for short requests.
- **Real server (Ollama)**: Validates that scheduling order differences observed in simulation carry over to actual LLM inference, and confirms the non-preemption limitation.

---

## 2. Request Categories ("혼합" Definition) — Multi-Seed Experiment Only

"혼합(mixed)" = mixture of three processing time categories in a fixed distribution (used only in `run-multi-seed.js`):

| Category | Processing Time | Proportion | MLFQ Behavior |
|----------|----------------|------------|---------------|
| Short | 100~800ms | 40% | Completes in Q0 (quantum 1000ms) |
| Medium | 1200~4000ms | 40% | Needs Q1 (quantum 3000ms) |
| Long | 5000~10000ms | 20% | Needs Q2 (quantum 8000ms) |

Distribution pattern: `[short, short, medium, medium, long]` → 40:40:20 ratio

This mix makes MLFQ's queue demotion mechanism visible:
- Short requests finish before Q0 time quantum → stay in Q0
- Medium requests exceed Q0 → demote to Q1
- Long requests exceed Q1 → demote to Q2

The basic experiment (§5.2) uses uniform 10~100ms processing times, which fits within Q0 — this is why non-preemptive MLFQ equals FCFS there.

---

## 3. Arrival Patterns

### Basic Experiment (run-extended.js)
```
Request 1   → t=0ms
Request 2   → t=3ms    (gap: 1~10ms random)
Request 3   → t=8ms
...
Request 500 → t≈2500ms
```
- Sequential arrival with uniform random gaps (1~10ms)
- Average inter-arrival: ~5ms
- NOT concurrent — each request has a distinct arrival time

### Multi-Seed Experiment (run-multi-seed.js)
```
Burst 1:  20 requests → t=0ms       (simultaneous)
          --- 2000ms gap ---
Burst 2:  20 requests → t=2000ms    (simultaneous)
          --- 2000ms gap ---
...
Burst 25: 20 requests → t=48000ms
```
- 20 requests arrive simultaneously per burst
- 2000ms fixed gap between bursts
- Simulates burst traffic (peak load scenarios)

### Real Server Experiment (run-ollama-experiment.js)
- All 20 requests enqueued upfront with the same timestamp
- Processed sequentially via the scheduler's dequeue order
- The scheduler under test determines processing order

---

## 4. Scheduler Parameters

### FCFS
- No parameters (pure FIFO)

### Priority Scheduler
- Priority levels: LOW(1), NORMAL(2), HIGH(3), URGENT(4)
- Aging interval: 5000ms (real-time internal; simulation scripts mirror this with simulation-time aging)
- Aging increment: +1 per cycle (prevents starvation)

### MLFQ
- Queue count: 4 (Q0, Q1, Q2, Q3)
- Time quantum: [1000ms, 3000ms, 8000ms, Infinity]
- Preemption check: every 500ms (used in simulation only)
- Boost interval: 5000ms real-time; simulation scripts use equivalent triggers
- Queue demotion: time quantum exceeded → move to next lower queue
- Queue demotion time reset: per-queue (Q0 time does NOT carry to Q1)

### WFQ (Weighted Fair Queuing)
- Weights: Enterprise(100), Premium(50), Standard(10), Free(1)
- Virtual Finish Time cost: 1 per request (fixed)
- Cost = 1 reason: output token count unknown before generation completes

---

## 5. Jain's Fairness Index (JFI) — Two Formulas in Use

### Formula A: Wait-time based (used for FCFS, Priority, MLFQ)

Defined in `run-extended.js:calculateJFI()`:

```
xi = 1 / (avgWaitTime + 1)   ← transformation so "shorter wait = higher xi"
JFI = (Σxi)^2 / (n × Σxi^2)
```

A JFI close to 1.0 means all tenants experienced similar wait times.

### Formula B: Throughput-per-weight based (used for WFQ)

Defined in `WFQScheduler.calculateFairnessIndex()`:

```
xi = processedCount / weight
JFI = (Σxi)^2 / (n × Σxi^2)
```

A JFI close to 1.0 means throughput is proportional to weight. For WFQ, a LOW JFI actually indicates successful differentiation, because the input workload is uniform but WFQ intentionally allocates more throughput to higher-weighted tenants.

### Why Two Formulas?

The two formulas measure different aspects of fairness:
- Formula A answers: "Did every tenant wait the same amount of time?"
- Formula B answers: "Did every tenant receive throughput proportional to its weight?"

For FCFS/Priority/MLFQ (which treat all tenants equally), Formula A naturally gives ~1.0. For WFQ (which applies weighted differentiation), Formula B is more meaningful.

### Calculation Timing: Post-Analysis
- JFI is calculated AFTER all requests are processed
- Stored in `extended-results.json` and `ollama-results.json`
- NOT real-time — it is a summary metric computed at experiment end

### Interpretation Table
- 1.0 = perfect uniformity under the chosen formula
- 1/n = worst case (one tenant monopolizes)
- For WFQ, a low JFI under Formula A is EXPECTED (differentiation success), not a failure

---

## 6. Simulation vs Real Server

### Simulation Implementation Notes

- Processing time is simulated (random value, not actual LLM inference)
- No actual Ollama API calls in `run-extended.js` or `run-multi-seed.js`
- Sequential processing (1 request at a time, matching real Ollama behavior)
- Aging / boosting are implemented using simulation-time triggers rather than wall-clock timers, so that the experiments complete in seconds rather than hours. The thresholds (5000ms aging, 5000ms boost) match the scheduler's real-time defaults.

### Real Server Limitations

- Ollama processes 1 request at a time (no concurrency)
- Cannot interrupt ongoing LLM inference → preemption impossible
- MLFQ preemptive mode: simulation-only (not applicable in production)
- Final report discusses this as a limitation (§6.1)

### What This Means for Each Scheduler

| Scheduler | Simulation | Real Server |
|-----------|-----------|-------------|
| FCFS | Same behavior | Same behavior |
| Priority | Same (request ordering) | Same (ordering before processing) |
| MLFQ (non-preemptive) | Equals FCFS when all requests fit Q0 | Equals FCFS (no preemption) |
| MLFQ (preemptive) | Simulated; ~73% Short-request improvement | Not applicable |
| WFQ | Same (VFT ordering) | Same (ordering before processing) |

---

## 7. Legacy File Note

`run-experiments.js` (100 requests, seed 12345) is an earlier exploratory script. It produces `experiment-results.json`, but the final report does NOT cite its data. It is retained in the repository for reference but superseded by `run-extended.js`.

---

Created: 2026-04-10
Updated: 2026-04-12 (aligned with final-report-v5 reality)
Source: run-extended.js, run-multi-seed.js, run-ollama-experiment.js, MLFQScheduler.js, WFQScheduler.js
