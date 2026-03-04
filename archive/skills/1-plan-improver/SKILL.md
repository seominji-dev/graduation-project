---
name: 1-plan-improver
description: >
  Analyzes completed graduation project results (Phase 3 deliverables) and improves Phase 1 planning documents.
  Identifies gaps between original plan and actual implementation, then generates improved planning documents
  with corrected assumptions, realistic timelines, and enhanced requirement specifications.
license: Apache-2.0
compatibility: Designed for Claude Code
allowed-tools: Read Grep Glob Bash
user-invocable: true
metadata:
  version: "1.0.0"
  category: "graduation"
  status: "active"
  updated: "2026-02-10"
  modularized: "false"
  tags: "graduation,planning,retrospective,improvement,analysis"
  author: "Seo Min-ji"
  context: "Analyzes completed project to improve initial planning phase"
  argument-hint: "Analyze project results and improve planning documents"

# Progressive Disclosure
progressive_disclosure:
  enabled: true
  level1_tokens: 100
  level2_tokens: 6000

# Triggers
triggers:
  keywords: ["plan improve", "planning analysis", "gap analysis", "retrospective plan"]
  agents: []
  phases: ["plan"]
---

# 1-plan-improver

## Purpose

Analyzes completed graduation project Phase 3 results (thesis, experiments, presentation) to identify gaps between the original plan and actual implementation, then generates improved Phase 1 planning documents.

## When to Use

- After completing a graduation project and wanting to improve initial planning
- When preparing project documentation for future reference
- When creating a template for similar projects
- When analyzing why certain decisions changed during implementation

## How It Works

### Phase 1: Analysis (Read-Only)

1. **Read Original Planning Documents** (`01-plan/`)
   - `proposal.md` - Original research proposal
   - `requirements.md` - Initial requirements
   - `plan.md` - Execution plan

2. **Read Completed Results** (`03-report/`)
   - Thesis/Paper - Final research outcomes
   - Experiments - Actual experimental data
   - Presentation - Final presentation materials

3. **Gap Analysis**
   - Identify assumptions that changed
   - Find missed requirements
   - Note timeline deviations
   - Document technical decisions that shifted

### Phase 2: Improvement Generation

Generate improved planning documents:

1. **Improved Proposal** (`proposal-improved.md`)
   - Corrected research questions based on actual results
   - Realistic technical stack recommendations
   - Achievable timelines based on actual velocity
   - Enhanced risk management

2. **Improved Requirements** (`requirements-improved.md`)
   - Requirements actually implemented
   - Missing requirements identified post-hoc
   - Clarified acceptance criteria
   - Aligned with actual technical constraints

3. **Gap Analysis Report** (`gap-analysis.md`)
   - What was planned vs. what was delivered
   - Reasons for deviations
   - Lessons learned
   - Recommendations for future projects

## Output Structure

```
01-plan/
├── proposal.md                    # Original (preserved)
├── requirements.md                # Original (preserved)
├── plan.md                        # Original (preserved)
├── proposal-improved.md           # NEW: Improved version
├── requirements-improved.md       # NEW: Improved version
└── gap-analysis.md                # NEW: Analysis report (in 01-plan/)
```

## Key Analysis Dimensions

| Dimension | What to Check |
|-----------|---------------|
| **Research Questions** | Were RQs answerable? Did results address them? |
| **Technical Stack** | Was chosen stack appropriate? Any constraints discovered? |
| **Timeline** | Were milestones realistic? What caused delays? |
| **Scope** | Did scope creep occur? Were requirements complete? |
| **Risks** | Which risks materialized? Which were missed? |

## Quality Criteria

Improved planning documents must:
- Reflect actual technical constraints discovered
- Have realistic timelines based on actual velocity
- Include all requirements that emerged during implementation
- Document why original decisions changed
- Be actionable for similar future projects

## Example Gap Analysis

```markdown
## Gap Analysis: MLFQ Implementation

### Original Plan
- MLFQ would show adaptive performance for mixed workloads
- Expected: 20-30% improvement over FCFS

### Actual Result
- MLFQ performed identically to FCFS for short-only workloads
- Single-workload experiment showed no differentiation
- Required time-slicing simulation to demonstrate value

### Root Cause
- Initial experiment design didn't vary request lengths sufficiently
- MLFQ benefits only visible with heterogeneous workloads

### Improved Planning Recommendation
- Define workload heterogeneity metrics upfront
- Include time-slicing simulation from planning phase
- Specify mixed-workload test scenarios explicitly
```

## Integration with Other Skills

This skill outputs to `2-implementation-improver`:
- `proposal-improved.md` → Used to refine implementation
- `requirements-improved.md` → Used to identify missing features
- `gap-analysis.md` → Context for implementation improvements
