---
name: 3-deliverable-generator-exec
description: >
  EXECUTES deliverable generation and updates. Actually creates or updates thesis, presentation,
  demo materials based on the latest project state. Use when you want to regenerate or update
  Phase 3 deliverables after making changes to implementation.
license: Apache-2.0
compatibility: Designed for Claude Code
allowed-tools: Read Write Edit Grep Glob Bash
user-invocable: true
metadata:
  version: "1.0.0"
  category: "graduation"
  status: "active"
  updated: "2026-02-15"
  modularized: "false"
  tags: "graduation,deliverables,thesis,presentation,demo,execution,action"
  author: "MoAI System"
  context: "Executes deliverable generation and updates"
  argument-hint: "Execute deliverable generation"
  related-skills: "3-deliverable-generator"

# Progressive Disclosure
progressive_disclosure:
  enabled: true
  level1_tokens: 100
  level2_tokens: 6000

# Triggers
triggers:
  keywords: ["deliverable execute", "thesis update", "presentation update", "demo update"]
  agents: []
  phases: ["sync"]
---

# 3-deliverable-generator-exec

## Purpose

EXECUTES deliverable generation and updates. This is the ACTION companion to `3-deliverable-generator`.

## Key Difference from 3-deliverable-generator

| Aspect | 3-deliverable-generator | 3-deliverable-generator-exec |
|--------|-------------------------|------------------------------|
| Action | Analyze & Verify | **Create & Update** |
| Output | Verification report | **Updated deliverable files** |
| Tools | Read, Grep, Glob | Read, Write, **Edit**, Bash |

## When to Use

- After running `2-implementation-improver-exec` to reflect code changes in deliverables
- When deliverables need to be updated with new data/metrics
- When creating fresh deliverables for a similar project

## How It Works

### Phase 1: Gather Latest Data

Collect current project state:
- Test results and coverage from `02-implementation/`
- Experiment results from `experiments-simple/`
- Updated requirements from `01-plan/`

### Phase 2: Execute Updates

**Actually modify** deliverable files:

1. **Update Thesis** (`03-report/paper/final-thesis.md`)
   - Sync experimental data with latest results
   - Update statistics and metrics
   - Add new findings if any

2. **Update Presentation** (`03-report/presentation/final-presentation.md`)
   - Sync slide content with thesis
   - Update data visualizations
   - Ensure Q&A reflects current state

3. **Update Demo** (`03-report/demo/`)
   - Update demo scenario if API changed
   - Refresh screenshots guide
   - Update video script

4. **Update Evaluation** (`03-report/evaluation-final.md`)
   - Recalculate scores if needed
   - Update metrics and statistics

### Phase 3: Consistency Check

Verify all documents are consistent:
- Same test counts everywhere
- Same coverage percentages
- Same algorithm names and descriptions

## Execution Actions

| Action | Files Affected | When to Use |
|--------|---------------|-------------|
| **Sync Metrics** | thesis, presentation, README | After test changes |
| **Add Findings** | thesis, evaluation | After new experiments |
| **Update Slides** | presentation | After thesis updates |
| **Refresh Demo** | demo/* | After API changes |

## Execution Checklist

```
[ ] Latest data gathered from implementation
[ ] Thesis updated with current metrics
[ ] Presentation synced with thesis
[ ] Demo scenario reflects current API
[ ] Evaluation report updated
[ ] Consistency verified across all documents
```

## Safety Measures

1. **Preserve Originals**: Original files are modified, but git history preserves previous versions
2. **Incremental**: Update one deliverable at a time
3. **Review**: User reviews changes before commit

## Important Notes

- This skill MODIFIES existing deliverable files
- Always commit changes before running if you want to preserve current state
- Run after implementation changes to keep deliverables in sync

## Integration

**Prerequisites:**
- Run `2-implementation-improver-exec` first if code was modified

**Workflow:**
```
1-plan-improver → 1-plan-improver-exec
       ↓                    ↓
2-implementation-improver → 2-implementation-improver-exec
       ↓                    ↓
3-deliverable-generator → 3-deliverable-generator-exec
```
