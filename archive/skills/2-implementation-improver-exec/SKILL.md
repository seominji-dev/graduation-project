---
name: 2-implementation-improver-exec
description: >
  EXECUTES code improvements identified by analysis. Actually modifies source code, adds tests,
  refactors functions, and enhances documentation. Use after 2-implementation-improver
  has identified improvement opportunities.
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
  tags: "graduation,implementation,execution,refactor,test,action"
  author: "MoAI System"
  context: "Executes code and implementation improvements"
  argument-hint: "Execute implementation improvements"
  related-skills: "2-implementation-improver"

# Progressive Disclosure
progressive_disclosure:
  enabled: true
  level1_tokens: 100
  level2_tokens: 5000

# Triggers
triggers:
  keywords: ["implementation execute", "code improve", "refactor execute", "test add"]
  agents: []
  phases: ["run"]
---

# 2-implementation-improver-exec

## Purpose

EXECUTES code improvements identified by analysis. This is the ACTION companion to `2-implementation-improver`.

## Key Difference from 2-implementation-improver

| Aspect | 2-implementation-improver | 2-implementation-improver-exec |
|--------|---------------------------|-------------------------------|
| Action | Analyze & Plan | **Modify Code** |
| Output | `implementation-improvements.md` | **Updated source files** |
| Tools | Read, Grep, Glob | Read, Write, **Edit**, Bash |

## When to Use

- After running `2-implementation-improver` and reviewing recommendations
- When you want to actually implement the suggested improvements
- When adding missing features, tests, or documentation

## How It Works

### Phase 1: Load Improvement Plan

Read recommendations from:
- `02-implementation/implementation-improvements.md`
- `01-plan/requirements-improved.md`

### Phase 2: Execute Improvements

**Actually modify** source code:

1. **Add Missing Features**
   ```javascript
   // Example: Add RateLimiter integration
   // File: src-simple/api/routes.js
   // Action: Add RateLimiter middleware before scheduler
   ```

2. **Improve Code Quality**
   - Refactor long functions (>50 lines)
   - Add missing error handling
   - Improve input validation

3. **Add Missing Tests**
   - Create tests for uncovered code paths
   - Add edge case tests
   - Add integration tests

4. **Enhance Documentation**
   - Add JSDoc comments
   - Update README
   - Add inline explanations

### Phase 3: Verification

```bash
# Run tests to verify changes
npm test

# Check coverage
npm run test:coverage

# Verify linting
npm run lint
```

## Execution Categories

| Category | Actions | Risk Level |
|----------|---------|------------|
| **Tests** | Add new test files, extend existing tests | Low |
| **Docs** | Add comments, update README | Low |
| **Refactor** | Split functions, rename variables | Medium |
| **Features** | Add new functionality | Medium |
| **Breaking** | Change API signatures | High |

## Safety Measures

1. **Backup**: Git commit before running
2. **Incremental**: Make one change at a time
3. **Test**: Run tests after each change
4. **Review**: User reviews changes before commit

## Execution Checklist

```
[ ] Backup created (git commit)
[ ] Improvement plan loaded
[ ] Code changes made
[ ] Tests passing
[ ] Coverage maintained/improved
[ ] Documentation updated
[ ] User reviewed changes
```

## Important Notes

- **Always backup**: This skill modifies source code
- **Run tests**: Verify nothing breaks after changes
- **Incremental**: Make small, focused changes

## Integration

**Prerequisites:**
- Run `2-implementation-improver` first to identify improvements
- Ensure tests are passing before running

**Next Steps:**
- Run `3-deliverable-generator-exec` to update deliverables
- Commit changes with descriptive message
