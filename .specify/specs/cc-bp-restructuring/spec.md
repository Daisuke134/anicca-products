# Feature: Claude Code Best Practices Restructuring

**Branch:** `feature/cc-bp-restructuring`
**Status:** Specified
**Master Spec:** `.cursor/plans/claude-code-bp-restructuring-plan.md` (v3)

## Problem Statement

Current Claude Code setup loads 2,485 lines every session (CLAUDE.md 554 lines + rules/ 1,931 lines). Research shows LLM instruction compliance degrades uniformly as instruction count increases, with frontier models stable at 150-200 instructions. Current setup has 500+ instructions = ~50% compliance rate.

## User Scenarios

### P1: Context Load Reduction (Core)

**As** Claude Code, **I want** to load only essential instructions at session start, **so that** instruction compliance stays above 90%.

**Acceptance:**
- Given CLAUDE.md is 277 lines, When restructured, Then it is <= 150 lines
- Given rules/ is 17 files / 2,485 lines, When restructured, Then it is 5 files / ~250 lines
- Given total session load is 2,485 lines, When restructured, Then it is ~400 lines (84% reduction)

### P2: On-Demand Knowledge Loading

**As** Claude Code, **I want** specialized knowledge to load only when relevant, **so that** context window is preserved for actual work.

**Acceptance:**
- Given testing rules exist in rules/, When moved to skills/, Then they load only when test-related prompts appear
- Given deployment rules exist in rules/, When moved to skills/, Then they load only when deploy-related prompts appear
- Given 7 rule files are moved to skills, When each has proper frontmatter, Then semantic matching triggers correct skill

### P3: OpenClaw Separation

**As** the system, **I want** OpenClaw config separated from CC config, **so that** CC doesn't load OpenClaw settings and vice versa.

**Acceptance:**
- Given OpenClaw files exist in anicca-project/ rules/, When separated, Then they exist only in .openclaw/workspace/
- Given CLAUDE.md contains OpenClaw sections, When separated, Then CLAUDE.md has max 2 lines referencing OpenClaw CLI

### P4: Full Feature Utilization

**As** Claude Code, **I want** to use all available CC features, **so that** development is maximally efficient.

**Acceptance:**
- Given settings.json has ~5 settings, When configured, Then it has 25+ settings
- Given 0 hooks exist, When configured, Then 8+ hooks covering 3 types (command/prompt/http)
- Given 0 plugins, When investigated, Then marketplace surveyed and useful plugins installed
- Given bundled skills unused, When documented, Then /simplify, /batch, /debug in workflow

### P5: Quality Infrastructure

**As** Claude Code agents, **I want** full frontmatter on all skills/agents/commands, **so that** semantic matching and permissions work correctly.

**Acceptance:**
- Given 176+ skills, When audited, Then all have name + description + relevant frontmatter
- Given 10 agents, When audited, Then all have 14 frontmatter fields including Agent(type) restrictions
- Given 20 commands, When audited, Then all have 4 frontmatter fields + dynamic injection where useful

### P6: Git Structure & OSS

**As** the project, **I want** reusable skills published as individual OSS repos, **so that** the community can use them.

**Acceptance:**
- Given skills are embedded in anicca-products, When restructured, Then factory skills are individual repos
- Given mobileapp-builder exists, When renamed, Then it is mobileapp-factory
- Given no submodule structure, When configured, Then packages/ directory with git submodules

## Edge Cases

| Case | Handling |
|------|----------|
| Skill semantic matching fails after move | Verify description triggers with test prompts |
| @import syntax not supported in CC version | Fallback: keep referenced content inline in CLAUDE.md |
| Plugin marketplace empty/unavailable | Document findings, skip Phase 12 |
| Existing hooks conflict with new hooks | Audit existing, merge or replace |
| .openclaw/workspace/ files have merge conflicts | Manual resolution, Anicca repo is separate git |

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-001 | CLAUDE.md must be <= 150 lines after restructuring |
| FR-002 | rules/ must have exactly 5 files totaling ~250 lines |
| FR-003 | 7 rule files must become skills with proper frontmatter |
| FR-004 | OpenClaw config must exist only in .openclaw/workspace/ |
| FR-005 | settings.json must have 25+ active settings |
| FR-006 | 8+ hook scripts covering command/prompt/http types |
| FR-007 | All 176+ skills must have validated frontmatter |
| FR-008 | All 10 agents must have 14-field frontmatter |
| FR-009 | All 20 commands must have 4-field frontmatter |
| FR-010 | .mcp.json with 9 MCP servers |
| FR-011 | SessionStart+compact hook for context re-injection |
| FR-012 | context:fork on heavy skills (codex-review, recursive-improver, etc.) |
| FR-013 | Agent(type) restrictions on all agents |
| FR-014 | packages/ directory with git submodules for OSS skills |
| FR-015 | /init gap analysis before CLAUDE.md rewrite |

## Success Criteria

| Metric | Current | Target | Measurable |
|--------|---------|--------|------------|
| CLAUDE.md lines | 277 | <= 150 | `wc -l CLAUDE.md` |
| rules/ file count | 17 | 5 | `ls .claude/rules/ \| wc -l` |
| rules/ total lines | 2,485 | ~250 | `wc -l .claude/rules/*.md` |
| Session load lines | 2,485 | ~400 | Sum of CLAUDE.md + rules/ |
| settings.json settings | ~5 | 25+ | Count keys in JSON |
| Hook scripts | 0 | 8+ | `ls .claude/hooks/scripts/ \| wc -l` |
| Skill frontmatter compliance | Unknown | 100% | Audit script |
| Agent frontmatter fields | ~3 | 14 | Audit per agent |
| MCP servers in .mcp.json | 0 | 9 | Count in JSON |
| OSS skill repos | 1 | TBD | GitHub repo count |

## Boundaries (Out of Scope)

- iOS app code changes
- API server code changes
- OpenClaw skill creation/modification (separate repo)
- Mixpanel/RevenueCat configuration
- App Store submission
- Content creation or marketing
