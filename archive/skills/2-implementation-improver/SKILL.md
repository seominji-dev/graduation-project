---
name: 2-implementation-improver
description: >
  Takes improved Phase 1 planning documents and refines Phase 2 implementation results.
  Identifies missing features, suggests code quality improvements, adds test cases,
  and generates enhanced experiment designs based on lessons learned.
license: Apache-2.0
compatibility: Designed for Claude Code
allowed-tools: Read Write Edit Grep Glob Bash
user-invocable: true
metadata:
  version: "1.0.0"
  category: "graduation"
  status: "active"
  updated: "2026-02-10"
  modularized: "false"
  tags: "graduation,implementation,refinement,testing,quality"
  author: "Seo Min-ji"
  context: "Refines implementation based on improved planning documents"
  argument-hint: "Improve implementation based on updated planning"

# Progressive Disclosure
progressive_disclosure:
  enabled: true
  level1_tokens: 100
  level2_tokens: 7000

# Triggers
triggers:
  keywords: ["implementation improve", "code refine", "test enhancement", "quality improvement"]
  agents: []
  phases: ["run"]
---

# 2-implementation-improver

## Purpose

Takes improved Phase 1 planning documents (from `1-plan-improver`) and refines Phase 2 implementation results by identifying gaps, suggesting improvements, and generating enhanced artifacts.

## When to Use

- After `1-plan-improver` has generated improved planning documents
- When implementation needs alignment with improved requirements
- When code quality needs enhancement based on project retrospectives
- When preparing implementation documentation for final delivery

## Prerequisites

Must run after `1-plan-improver` completes, requires:
- `01-plan/proposal-improved.md`
- `01-plan/requirements-improved.md`
- `01-plan/gap-analysis.md`

## How It Works

### Phase 1: Analysis

1. **Compare Improved Plan vs. Actual Implementation**
   ```
   improved-requirements.md → 02-implementation/
   ```
   - Missing features identification
   - Unnecessary implemented features
   - Architecture alignment check

2. **Code Quality Assessment**
   - Test coverage gaps
   - Code complexity issues
   - Documentation completeness
   - TRUST 5 compliance check

3. **Experiment Review**
   - Experiment design validity
   - Missing test scenarios
   - Data collection completeness

### Phase 2: Improvement Generation

Generate improved implementation artifacts:

1. **Implementation Improvement Plan** (`implementation-improvements.md`)
   - Missing features to add
   - Code refactoring recommendations
   - Additional test cases needed
   - Enhanced experiment designs

2. **Enhanced Test Suite** (`tests-additional/`)
   - Test cases for missing requirements
   - Edge case coverage
   - Integration test additions

3. **Improved Experiment Designs** (`experiments-improved/`)
   - Enhanced experimental scenarios
   - Additional data collection points
   - Statistical validation improvements

## Output Structure

```
02-implementation/
├── src-simple/                    # Original implementation (preserved)
├── tests-simple/                  # Original tests (preserved)
├── experiments-simple/            # Original experiments (preserved)
├── implementation-improvements.md # NEW: Improvement plan
├── tests-additional/              # NEW: Additional test cases
└── experiments-improved/          # NEW: Enhanced experiment designs
```

## Key Improvement Areas

### Feature Completeness

| Check | Action |
|-------|--------|
| Requirement implemented? | Mark status |
| Missing requirement | Add to improvement plan |
| Unnecessary feature | Document for removal |

### Code Quality

| Aspect | Target | Action |
|--------|--------|--------|
| Test Coverage | 85%+ | Add tests for gaps |
| Function Length | <50 lines | Refactor long functions |
| Documentation | JSDoc on public APIs | Add missing docs |
| Error Handling | All API inputs | Add validation |

### Experiment Design

| Dimension | Improvement |
|-----------|-------------|
| Workload Variety | Add heterogeneous scenarios |
| Sample Size | Increase for statistical significance |
| Metrics | Add missing performance indicators |
| Validation | Include statistical tests |

## Example Improvement Plan

```markdown
## Implementation Improvements

### Missing Features

#### 1. RateLimiter Integration with Schedulers
- **Requirement**: Improved plan identified need for RateLimiter + Scheduler integration
- **Current**: RateLimiter operates independently from scheduling algorithms
- **Action**: Add RateLimiter as a preprocessing layer before scheduler selection
- **Files**: `src-simple/api/requests.js`, `src-simple/managers/RateLimitManager.js`

#### 2. Time-Slicing Simulation for MLFQ
- **Requirement**: Improved plan identified MLFQ needs time-slicing
- **Current**: MLFQ processes requests sequentially
- **Action**: Implement preemptive time slicing with configurable quantum
- **Files**: `src-simple/schedulers/MLFQScheduler.js`

### Code Quality Improvements

#### 1. Function: `processRequest()`
- **Issue**: 85 lines, exceeds 50-line target
- **Refactor**: Extract validation, queue management, LLM call phases

#### 2. Missing Error Handling
- **Issue**: No validation for negative priority values
- **Action**: Add input validation to all API endpoints

### Additional Test Cases

#### RateLimiter Integration Tests
- Test RateLimiter with FCFS scheduler
- Test RateLimiter with Priority scheduler
- Test token exhaustion behavior across all schedulers

#### MLFQ Preemption Tests
- Test request preemption at quantum boundary
- Test queue boost mechanism
- Test starvation prevention for low-priority queue
```

## TRUST 5 Quality Gates (Simplified for Undergraduate)

| Dimension | Check | Target |
|-----------|-------|--------|
| **Tested** | Test pass rate | 100% |
| **Tested** | Code coverage | 85%+ |
| **Readable** | Function length | <50 lines |
| **Readable** | Comment coverage | 80%+ |
| **Unified** | ESLint errors | 0 |
| **Secured** | Input validation | All APIs |
| **Trackable** | Git commits | Conventional format |

## Integration with Other Skills

**Input from `1-plan-improver`:**
- `proposal-improved.md` → Feature alignment
- `requirements-improved.md` → Completeness check
- `gap-analysis.md` → Context for improvements

**Output to `3-deliverable-generator`:**
- `implementation-improvements.md` → Reflect in final thesis
- Enhanced test results → Include in evaluation
- Improved experiments → Reference in conclusions
