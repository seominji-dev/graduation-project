# Experiment Environment Specification

Comprehensive experiment configuration for the final report.
Created from code analysis of `02-implementation/experiments-simple/` and `src-simple/schedulers/`.

Resolves professor feedback:
- "혼합" request type is undefined → defined below
- Request patterns are vague → specified below
- Basic vs additional experiment distinction unclear → clarified below
- JFI calculation location → answered below

---

## 1. Experiment Types

### Experiment 1: Basic (기본 실험)

| Setting | Value | Source |
|---------|-------|--------|
| Script | run-experiments.js | |
| Request count | 100 | line 25 |
| Tenant count | 4 (Enterprise, Premium, Standard, Free) | lines 33-38 |
| Requests per tenant | 25 (round-robin distribution) | line 86 |
| Processing time | 10~100ms (uniform random) | lines 27-28 |
| Arrival pattern | Sequential, 1~10ms random gaps | line 100 |
| Schedulers tested | FCFS, Priority, MLFQ, WFQ (all 4) | |
| Seed | 12345 (fixed for reproducibility) | line 47 |

### Experiment 2: Multi-Seed Reproducibility (추가 실험)

| Setting | Value | Source |
|---------|-------|--------|
| Script | run-multi-seed.js | |
| Request count | 500 per seed (25 bursts x 20 requests) | lines 33-34 |
| Seeds | 5 (12345, 23456, 34567, 45678, 56789) | line 31 |
| Schedulers tested | FCFS (non-preemptive) vs MLFQ (preemptive) | |
| Arrival pattern | Burst: 20 requests simultaneous, then 2000ms gap | line 93 |
| Processing times | Mixed categories (see below) | lines 43-47 |

### Why Two Experiments?

- **Basic experiment**: All 4 schedulers compared under uniform conditions
- **Additional experiment**: MLFQ preemptive tested because non-preemptive MLFQ produced identical results to FCFS (all requests stay in Q0 when non-preemptive)
- **Multi-seed**: 5 seeds for statistical reproducibility of MLFQ preemptive improvement

---

## 2. Request Categories ("혼합" Definition)

"혼합(mixed)" = mixture of three processing time categories in a fixed distribution:

| Category | Processing Time | Proportion | MLFQ Behavior |
|----------|----------------|------------|---------------|
| Short | 100~800ms | 40% | Completes in Q0 (quantum 1000ms) |
| Medium | 1200~4000ms | 40% | Needs Q1 (quantum 3000ms) |
| Long | 5000~10000ms | 20% | Needs Q2 (quantum 8000ms) |

Distribution: `[short, short, medium, medium, long]` → 40:40:20 ratio

This mix is designed so MLFQ's queue demotion mechanism has visible effect:
- Short requests finish before Q0 time quantum → stay in Q0
- Medium requests exceed Q0 → demote to Q1
- Long requests exceed Q1 → demote to Q2

---

## 3. Arrival Patterns

### Basic Experiment
```
Request 1  → t=0ms
Request 2  → t=3ms   (gap: 1~10ms random)
Request 3  → t=8ms
...
Request 100 → t≈500ms
```
- Sequential arrival with uniform random gaps (1~10ms)
- Average inter-arrival: ~5ms
- NOT concurrent (each request has distinct arrival time)

### Multi-Seed Experiment
```
Burst 1:  20 requests → t=0ms      (simultaneous)
          --- 2000ms gap ---
Burst 2:  20 requests → t=2000ms   (simultaneous)
          --- 2000ms gap ---
...
Burst 25: 20 requests → t=48000ms
```
- 20 requests arrive simultaneously per burst
- 2000ms fixed gap between bursts
- Simulates burst traffic (peak load scenarios)

---

## 4. Scheduler Parameters

### FCFS
- No parameters (pure FIFO)

### Priority Scheduler
- Priority levels: LOW(1), NORMAL(2), HIGH(3), URGENT(4)
- Aging interval: 5000ms
- Aging increment: +1 per cycle (prevents starvation)

### MLFQ
- Queue count: 4 (Q0, Q1, Q2, Q3)
- Time quantum: [1000ms, 3000ms, 8000ms, Infinity]
- Preemption check: every 500ms
- Boosting interval: 5000ms (all requests → Q0)
- Queue demotion: time quantum exceeded → move to next lower queue
- Queue demotion time reset: per-queue (Q0 time does NOT carry to Q1)

### WFQ (Weighted Fair Queuing)
- Weights: Enterprise(100), Premium(50), Standard(10), Free(1)
- Virtual Finish Time cost: 1 per request (fixed)
- Cost = 1 reason: output token count unknown before generation completes

---

## 5. JFI Calculation

### Formula
JFI = (sum(xi))^2 / (n * sum(xi^2))

Where:
- xi = processed_count / weight (normalized throughput per tenant)
- n = number of active tenants

### Calculation Timing: Post-Analysis
- JFI is calculated AFTER all requests are processed
- Located in WFQScheduler.calculateFairnessIndex() (WFQScheduler.js:134-150)
- NOT real-time; it's a summary metric computed at experiment end
- Stored in experiment-results.json

### Interpretation
- 1.0 = perfect fairness (all tenants receive proportional service)
- 0.0 = complete unfairness (one tenant monopolizes)
- 1/n = worst case (single tenant gets all resources)

---

## 6. Simulation vs Real Server

### Current Implementation: Pure Simulation
- Processing time is simulated (random value, not actual LLM inference)
- No actual Ollama API calls in experiments
- Sequential processing (1 request at a time, like real Ollama)

### Real Server Limitations
- Ollama processes 1 request at a time (no concurrency)
- Cannot interrupt ongoing LLM inference → preemption impossible
- MLFQ preemptive mode: simulation-only (not applicable in production)
- Final report should discuss this as a limitation

### What This Means for Each Scheduler
| Scheduler | Simulation | Real Server |
|-----------|-----------|-------------|
| FCFS | Same behavior | Same behavior |
| Priority | Same (request ordering) | Same (ordering before processing) |
| MLFQ | Preemptive possible | Non-preemptive only → same as FCFS |
| WFQ | Same (VFT ordering) | Same (ordering before processing) |

---

Created: 2026-04-10
Source: run-experiments.js, run-multi-seed.js, MLFQScheduler.js, WFQScheduler.js
