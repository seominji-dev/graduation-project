---
name: 1-plan-improver-exec
description: >
  EXECUTES improvements to Phase 1 planning documents. Unlike 1-plan-improver which only analyzes,
  this skill actually modifies planning documents to reflect lessons learned and best practices.
  Use after 1-plan-improver has identified improvement opportunities.
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
  tags: "graduation,planning,execution,improvement,action"
  author: "MoAI System"
  context: "Executes planning document improvements"
  argument-hint: "Execute improvements to planning documents"
  related-skills: "1-plan-improver"

# Progressive Disclosure
progressive_disclosure:
  enabled: true
  level1_tokens: 100
  level2_tokens: 4000

# Triggers
triggers:
  keywords: ["plan execute", "planning update", "proposal update", "requirements update"]
  agents: []
  phases: ["plan"]
---

# 1-plan-improver-exec

## Purpose

EXECUTES improvements to Phase 1 planning documents based on analysis results. This is the ACTION companion to `1-plan-improver`.

## Key Difference from 1-plan-improver

| Aspect | 1-plan-improver | 1-plan-improver-exec |
|--------|-----------------|---------------------|
| Action | Analyze & Report | **Modify & Execute** |
| Output | `*-improved.md` files | **Updated original files** |
| Tools | Read, Grep, Glob | Read, Write, **Edit** |

## When to Use

- After running `1-plan-improver` and reviewing the analysis
- When you want to actually apply the recommended improvements
- When preparing planning documents for a similar future project

## How It Works

### Phase 1: Load Analysis Results

Read the gap analysis and improvement recommendations from:
- `01-plan/gap-analysis.md`
- `01-plan/proposal-improved.md`
- `01-plan/requirements-improved.md`

### Phase 2: Execute Improvements

**Actually modify** the original planning documents:

1. **Update proposal.md**
   - Merge improved research questions
   - Update technical stack based on lessons learned
   - Revise timeline estimates
   - Add missing risk factors

2. **Update requirements.md**
   - Add missing requirements discovered during implementation
   - Update acceptance criteria
   - Remove unnecessary requirements
   - Clarify ambiguous specifications

3. **Update plan.md**
   - Adjust milestone timelines
   - Add missing tasks
   - Update dependencies

### Phase 3: Verification

- Verify all changes are consistent
- Check for contradictions between documents
- Ensure terminology consistency

## Execution Checklist

```
[ ] proposal.md updated with improved content
[ ] requirements.md reflects actual implementation needs
[ ] plan.md has realistic timelines
[ ] All documents use consistent terminology
[ ] Gap analysis recommendations applied
```

## Important Notes

- **Backup**: Original files are NOT automatically backed up. Use git before running.
- **Review**: Always review changes before committing.
- **Idempotent**: Running multiple times should not cause issues.

## Integration

**Prerequisites:**
- Run `1-plan-improver` first to generate analysis

**Next Steps:**
- Run `2-implementation-improver-exec` to apply implementation improvements
