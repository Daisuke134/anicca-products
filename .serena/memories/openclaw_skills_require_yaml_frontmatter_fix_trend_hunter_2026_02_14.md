## Summary (2026-02-14)
OpenClaw skill discovery requires AgentSkills-compatible `SKILL.md` **with YAML frontmatter** (at minimum `name` and `description`). Without frontmatter, the directory can exist under `~/.openclaw/skills/<name>/` but OpenClaw will not index it, so the model will not receive skill instructions and may improvise (e.g., try `./run_trend_hunter.sh` from the wrong cwd, causing "No such file or directory").

## Root Cause Observed
- VPS had `~/.openclaw/skills/trend-hunter/run_trend_hunter.sh` present, but gateway logs showed exec attempts like `./run_trend_hunter.sh` failing (cwd mismatch).
- `openclaw skills list` initially did not include `trend-hunter`, `mission-worker`, etc. because their `SKILL.md` lacked YAML frontmatter.

## Fix Applied
- Added YAML frontmatter (`name`, `description`, `metadata` as single-line JSON) to these repo files:
  - `openclaw-skills/trend-hunter/SKILL.md`
  - `openclaw-skills/mission-worker/SKILL.md`
  - `openclaw-skills/ops-heartbeat/SKILL.md`
  - `openclaw-skills/suffering-detector/SKILL.md`
  - `openclaw-skills/x-poster/SKILL.md`
  - `openclaw-skills/tiktok-poster/SKILL.md`
  - `openclaw-skills/app-nudge-sender/SKILL.md`
  - `openclaw-skills/x-research/SKILL.md`
  - `openclaw-skills/autonomy-check/SKILL.md`
  - `openclaw-skills/hookpost-ttl-cleaner/SKILL.md`
  - `openclaw-skills/moltbook-monitor/SKILL.md`
  - `openclaw-skills/moltbook-poster/SKILL.md`
  - `openclaw-skills/roundtable-standup/SKILL.md`
  - `openclaw-skills/roundtable-memory-extract/SKILL.md`
  - `openclaw-skills/roundtable-initiative-generate/SKILL.md`
  - `openclaw-skills/sto-weekly-refresh/SKILL.md`
- Added a defensive note in `trend-hunter/SKILL.md` to use `workdir: "{baseDir}"` (or `cd {baseDir}`) if executing relative paths.
- Synced skills to VPS with `scripts/openclaw-vps/sync-workspace-and-skills-to-vps.sh` and restarted gateway.

## Verification
On VPS:
- `openclaw skills info trend-hunter --json` now resolves to `filePath: /home/anicca/.openclaw/skills/trend-hunter/SKILL.md` and shows `eligible: true`.
- Same for `mission-worker` and `ops-heartbeat`.

## Reference
OpenClaw docs: Skills require YAML frontmatter; metadata must be single-line JSON; `{baseDir}` can be used in instructions.