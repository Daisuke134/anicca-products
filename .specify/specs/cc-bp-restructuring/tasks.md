# Tasks: CC BP Restructuring

## Phase 1: Foundation Setup (BLOCKING)

- [ ] T1.1 Run `/init` and compare output with current CLAUDE.md (`CLAUDE.md`)
- [ ] T1.2 Backup current CLAUDE.md and .claude/CLAUDE.md (`CLAUDE.md`, `.claude/CLAUDE.md`)
- [ ] T1.3 Delete `.claude/CLAUDE.md` duplicate (`git rm .claude/CLAUDE.md`)
- [ ] T1.4 Rewrite `CLAUDE.md` to <= 150 lines with @import syntax (`CLAUDE.md`)
- [ ] T1.5 Create `CLAUDE.local.md` template + add to .gitignore (`CLAUDE.local.md`, `.gitignore`)
- [ ] T1.6 Add `paths` frontmatter to `api-compatibility.md` (`.claude/rules/api-compatibility.md`)
- [ ] T1.7 Compress `git-workflow.md` from 125 to ~50 lines (`.claude/rules/git-workflow.md`)
- [ ] T1.8 Compress `dev-workflow.md` from 78 to ~40 lines (`.claude/rules/dev-workflow.md`)
- [ ] T1.9 Compress `worktree.md` from 141 to ~60 lines (`.claude/rules/worktree.md`)
- [ ] T1.10 Verify CLAUDE.md <= 150 lines and rules/ = 5 files, ~250 lines (`wc -l`)

## Phase 2: Rules to Skills Migration (BLOCKING)

- [ ] T2.1 Create `.claude/skills/testing-strategy/SKILL.md` with frontmatter from `testing-strategy.md`
- [ ] T2.2 Create `.claude/skills/tool-usage/SKILL.md` with frontmatter from `tool-usage.md`
- [ ] T2.3 Create `.claude/skills/deployment/SKILL.md` with frontmatter + `disable-model-invocation: true` from `deployment.md`
- [ ] T2.4 Create `.claude/skills/spec-writing/SKILL.md` with frontmatter from `spec-writing.md`
- [ ] T2.5 Create `.claude/skills/subagent-guide/SKILL.md` with frontmatter from `skill-subagent-usage.md`
- [ ] T2.6 Create `.claude/skills/skill-authoring-guide/SKILL.md` with frontmatter from `skill-authoring.md`
- [ ] T2.7 Create `.claude/skills/persona/SKILL.md` with frontmatter from `persona.md`
- [ ] T2.8 Delete migrated rule files: `testing-strategy.md`, `tool-usage.md`, `deployment.md`, `spec-writing.md`, `skill-subagent-usage.md`, `skill-authoring.md`, `persona.md`
- [ ] T2.9 Delete redundant files: `coding-style.md`, `testing.md`, `session-management.md`, `reference-index.md`, `serena-usage.md`, `mcp-openclaw.md`, `openclaw-vps-absolute.md`
- [ ] T2.10 Verify rules/ = exactly 5 files (`ls .claude/rules/ | wc -l`)

## Phase 3: OpenClaw Separation

- [ ] T3.1 || Update `/Users/anicca/.openclaw/workspace/IDENTITY.md` (remove VPS, fix repo URL)
- [ ] T3.2 || Update `/Users/anicca/.openclaw/workspace/AGENTS.md` (Mac Mini rules, MCP IDs, Cron)
- [ ] T3.3 || Update `/Users/anicca/.openclaw/workspace/SOUL.md` (add IBA protocol, originality ban)
- [ ] T3.4 Verify CLAUDE.md has max 2 lines for OpenClaw reference

## Phase 4: agent_docs/ Creation

- [ ] T4.1 || Create `agent_docs/building_and_testing.md`
- [ ] T4.2 || Create `agent_docs/code_conventions.md`
- [ ] T4.3 || Create `agent_docs/service_architecture.md`
- [ ] T4.4 || Create `agent_docs/openclaw_integration.md`
- [ ] T4.5 || Create `agent_docs/tool_reference.md`

## Phase 5: Hooks Setup

- [ ] T5.1 Create `.claude/hooks/scripts/session-start.sh` (SessionStart, once:true)
- [ ] T5.2 Create `.claude/hooks/scripts/pre-tool-lint.sh` (PreToolUse, Edit|Write matcher)
- [ ] T5.3 Create `.claude/hooks/scripts/post-tool-sound.sh` (PostToolUse, Bash matcher)
- [ ] T5.4 Create `.claude/hooks/scripts/notification-sound.sh` (Notification)
- [ ] T5.5 Create `.claude/hooks/scripts/stop-continue.sh` (Stop, type:prompt)
- [ ] T5.6 Create `.claude/hooks/scripts/pre-compact-backup.sh` (PreCompact)
- [ ] T5.7 Create `.claude/hooks/scripts/subagent-stop-validate.sh` (SubagentStop)
- [ ] T5.8 Create `.claude/hooks/scripts/user-prompt-context.sh` (UserPromptSubmit)
- [ ] T5.9 Create `.claude/context/post-compact-essentials.md` (compact re-injection content)
- [ ] T5.10 Add all hooks config to settings.json (3 types: command, prompt, http)

## Phase 6: CC <-> OpenClaw Integration Protocol

- [ ] T6.1 Define sentinel strings in `agent_docs/openclaw_integration.md`
- [ ] T6.2 Create STATUS.md / PLAN.md templates for worktrees

## Phase 7: Skills, Agents, Commands Audit

- [ ] T7.1 Write audit script for skill frontmatter validation (`.specify/scripts/audit-skills.sh`)
- [ ] T7.2 Run audit on all 176+ skills, fix missing frontmatter
- [ ] T7.3 Add `Agent(type)` restrictions to all 10 agents
- [ ] T7.4 Add `skills:` preloading to relevant agents
- [ ] T7.5 Add full 14-field frontmatter to all 10 agents
- [ ] T7.6 Add 4-field frontmatter + `!`command`` injection to all 20 commands
- [ ] T7.7 Identify and delete unused skills

## Phase 8: .mcp.json Creation

- [ ] T8.1 Create `.mcp.json` with 9 MCP servers (existing 5 + recommended 4)

## Phase 9: settings.json Full Config

- [ ] T9.1 Backup current `.claude/settings.json`
- [ ] T9.2 Write full settings.json (25+ settings, permissions, sandbox, hooks, env, statusLine, spinnerVerbs)
- [ ] T9.3 Create `.claude/settings.local.json` template + add to .gitignore
- [ ] T9.4 Test CC startup with new settings (verify no breakage)

## Phase 10: Boris 12 Customizations

- [ ] T10.1 Terminal setup (shift+enter)
- [ ] T10.2 || Verify effort level = high (in settings.json env)
- [ ] T10.3 || Run `/plugin` to survey marketplace
- [ ] T10.4 || Verify custom agents (Phase 7)
- [ ] T10.5 || Verify permissions pre-approved (Phase 9)
- [ ] T10.6 || Verify sandbox (Phase 9)
- [ ] T10.7 || Verify status line (Phase 9)
- [ ] T10.8 Keybindings customization
- [ ] T10.9 || Verify hooks (Phase 5)
- [ ] T10.10 || Verify spinner verbs (Phase 9)
- [ ] T10.11 Output style configuration
- [ ] T10.12 || Verify settings.json committed to git (Phase 9)

## Phase 11: CLI Flags Documentation

- [ ] T11.1 Document frequently used CLI flags in agent_docs/tool_reference.md
- [ ] T11.2 Verify env vars in settings.json env key

## Phase 12: Plugin System

- [ ] T12.1 Run `/plugin` and document available plugins
- [ ] T12.2 Evaluate and install code intelligence plugin for Swift + TypeScript

## Phase 13: Bundled Skills + context:fork

- [ ] T13.1 Document /simplify, /batch, /debug usage in tool_reference.md
- [ ] T13.2 Add `context: fork` to codex-review, recursive-improver, competitive-ads-extractor, content-research-writer
- [ ] T13.3 || Add `!`command`` dynamic injection to deploy, code-review, tdd commands

## Phase 14: /init Gap Analysis (RUN FIRST)

- [ ] T14.1 Run `/init` in a temp directory, capture output
- [ ] T14.2 Compare /init output structure with our planned CLAUDE.md
- [ ] T14.3 Document gaps and adjust Phase 1 CLAUDE.md plan accordingly

## Phase 15: Git Structure & OSS

- [ ] T15.1 Identify OSS-worthy skills from 176+ CC skills
- [ ] T15.2 Create packages/ directory
- [ ] T15.3 Rename mobileapp-builder -> mobileapp-factory on GitHub
- [ ] T15.4 Set up git submodules in packages/
- [ ] T15.5 Create individual repos for each factory skill

## Completion Checklist

- [ ] CLAUDE.md <= 150 lines
- [ ] rules/ = 5 files, ~250 lines
- [ ] Session load ~400 lines (84% reduction)
- [ ] 7 rule files migrated to skills with frontmatter
- [ ] OpenClaw config only in .openclaw/workspace/
- [ ] settings.json 25+ settings
- [ ] 8+ hook scripts (3 types)
- [ ] All skills have validated frontmatter
- [ ] All agents have 14-field frontmatter
- [ ] All commands have 4-field frontmatter
- [ ] .mcp.json with 9 MCP servers
- [ ] codex-review passes on all changes
