# Autonomous Job Search Loop Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use Superpowers `executing-plans`,
> `test-driven-development`, and `verification-before-completion` while executing
> every task in order.

**Goal:** Ship a launchd-managed loop that applies to at most two high-fit jobs per
Japan day, reconciles recruiter email, schedules interview events and prep, reports to
Telegram, and improves only when outcome evidence supports promotion.

**Architecture:** Python standard-library deterministic core with SQLite event/state
storage; bounded existing agent-runner calls for language and browser work; `gog` for
Gmail/Calendar; isolated CloakBrowser ownership; immutable intents and fenced outboxes
for every external side effect.

**Tech Stack:** Python 3.12+, SQLite, `unittest`, JSON Schema files, shell/launchd,
existing `gog`, `gh`, `firecrawl`, CloakBrowser, and
`profitable-claude/skills/agent-runner`.

**Design:** `docs/superpowers/specs/2026-07-28-job-search-loop-design.md`

---

## Task 1: Scaffold and configuration contract

**Files:**

- Create: `apps/job-search-loop/pyproject.toml`
- Create: `apps/job-search-loop/job_search_loop/__init__.py`
- Create: `apps/job-search-loop/job_search_loop/config.py`
- Create: `apps/job-search-loop/schemas/profile.v1.schema.json`
- Create: `apps/job-search-loop/config/strategy.default.json`
- Create: `apps/job-search-loop/tests/test_config.py`
- Modify: `.gitignore`

**Step 1: Write the failing tests**

Test that:

- missing private profile fails closed;
- directories are 0700 and files are 0600;
- committed defaults contain no email, phone, address, token, or cookie;
- the default strategy has daily target 2, threshold 75, compensation floor JPY 7M;
- malformed or incomplete facts are rejected.

**Step 2: Run RED**

```bash
cd apps/job-search-loop
python3 -m unittest tests.test_config -v
```

Expected: import/module failures.

**Step 3: Implement the minimum contract**

Use:

```python
@dataclass(frozen=True)
class Settings:
    state_dir: Path
    materials_dir: Path
    profile_path: Path
    daily_target: int
    auto_apply_threshold: int
    compensation_floor_jpy: int
```

Validate JSON with deterministic code and explicit required fields. Do not add a
runtime schema dependency.

**Step 4: Run GREEN and full local suite**

```bash
python3 -m unittest tests.test_config -v
python3 -m unittest discover -s tests -v
```

**Step 5: Commit and push**

```bash
git fetch origin
git add -A
git commit -m "feat(job-loop): add private configuration contract"
git push
```

## Task 2: Durable application ledger and fenced quota

**Files:**

- Create: `apps/job-search-loop/job_search_loop/ledger.py`
- Create: `apps/job-search-loop/job_search_loop/state.py`
- Create: `apps/job-search-loop/tests/test_ledger.py`
- Create: `apps/job-search-loop/tests/test_state.py`

**Step 1: Write failing tests**

Cover:

- canonical job identity normalization;
- allowed and forbidden transitions;
- append-only event reconstruction;
- duplicate URL/title/company rejection;
- two confirmed or unknown submissions consume the daily quota;
- stale claim cannot commit after a newer fencing token;
- `submit_unknown` cannot be retried;
- concurrent claims cannot produce a third slot.

**Step 2: Run RED**

```bash
python3 -m unittest tests.test_ledger tests.test_state -v
```

**Step 3: Implement the SQLite transaction boundary**

Use WAL mode, foreign keys, `BEGIN IMMEDIATE`, unique constraints, and these core
tables:

```sql
applications(id PRIMARY KEY, company, title, canonical_url, current_state, created_at);
events(event_id PRIMARY KEY, application_id, from_state, to_state, payload_json, created_at);
submit_intents(intent_id PRIMARY KEY, application_id UNIQUE, fence, payload_hash, status);
daily_slots(japan_day, slot, application_id UNIQUE, status, PRIMARY KEY(japan_day, slot));
```

Persist the immutable submit payload before browser execution. The completion method
must compare both `intent_id` and `fence`.

**Step 4: Run GREEN, crash-reopen test, and full suite**

```bash
python3 -m unittest tests.test_ledger tests.test_state -v
python3 -m unittest discover -s tests -v
```

**Step 5: Commit and push**

```bash
git fetch origin
git add -A
git commit -m "feat(job-loop): add fenced application ledger"
git push
```

## Task 3: Hard filters and deterministic ranking

**Files:**

- Create: `apps/job-search-loop/job_search_loop/jobs.py`
- Create: `apps/job-search-loop/job_search_loop/ranking.py`
- Create: `apps/job-search-loop/tests/fixtures/jobs.json`
- Create: `apps/job-search-loop/tests/test_ranking.py`

**Step 1: Write failing table-driven tests**

Include:

- Tokyo hybrid AI engineer at JPY 9M;
- global remote that explicitly accepts Japan;
- US-only remote;
- citizenship/clearance role;
- known JPY 6M role;
- unknown compensation but high-fit role;
- duplicate agency repost;
- crypto/fintech agent role;
- generic non-AI software role.

Assert hard rejection reasons and exact score components.

**Step 2: Run RED**

```bash
python3 -m unittest tests.test_ranking -v
```

**Step 3: Implement pure normalization/filter/scoring**

The model may provide extracted fields but not the verdict. Reject fields with no
source span. Keep compensation unknown distinct from zero.

**Step 4: Run GREEN and full suite**

```bash
python3 -m unittest tests.test_ranking -v
python3 -m unittest discover -s tests -v
```

**Step 5: Commit and push**

```bash
git fetch origin
git add -A
git commit -m "feat(job-loop): rank eligible AI roles"
git push
```

## Task 4: Pin the upstream framework and agent contracts

**Files:**

- Create: `apps/job-search-loop/scripts/bootstrap-framework.sh`
- Create: `apps/job-search-loop/job_search_loop/agent_runner.py`
- Create: `apps/job-search-loop/prompts/extract-job.md`
- Create: `apps/job-search-loop/prompts/tailor-materials.md`
- Create: `apps/job-search-loop/prompts/browser-submit.md`
- Create: `apps/job-search-loop/schemas/job-extraction.v1.schema.json`
- Create: `apps/job-search-loop/schemas/materials.v1.schema.json`
- Create: `apps/job-search-loop/schemas/browser-result.v1.schema.json`
- Create: `apps/job-search-loop/tests/test_agent_runner.py`
- Create: `apps/job-search-loop/tests/test_prompt_injection.py`

**Step 1: Fork and pin**

Attempt the requested GitHub identity only if already configured. Otherwise use the
authenticated project owner without exposing credentials:

```bash
gh auth status
gh repo fork MadsLorentzen/ai-job-search --clone=false
gh api repos/Daisuke134/ai-job-search/commits/main --jq .sha
```

Record the upstream owner/repository/SHA in the bootstrap script. Clone/update only
the framework directory under `~/.local/share/anicca/job-search`.

**Step 2: Write failing tests**

Assert:

- exact task-class mapping;
- prompt passed by file/stdin, not shell interpolation;
- result must validate before use;
- job/email text inside `<untrusted_data>` cannot override instructions;
- prompts forbid secrets, invented facts, and automatic retry of unknown submissions;
- raw result and runner summary paths are retained.

**Step 3: Run RED**

```bash
python3 -m unittest tests.test_agent_runner tests.test_prompt_injection -v
```

**Step 4: Implement adapter**

Invoke the existing agent runner as an argv list. Use `composition-agent`,
`repeatable-agent`, `browser-lane-agent`, and `high-value-agent` exactly as specified
by the design. The adapter returns validated JSON plus evidence paths.

**Step 5: Run GREEN and contract smoke test**

```bash
python3 -m unittest tests.test_agent_runner tests.test_prompt_injection -v
python3 -m unittest discover -s tests -v
```

**Step 6: Commit and push**

```bash
git fetch origin
git add -A
git commit -m "feat(job-loop): add pinned framework and model contracts"
git push
```

## Task 5: Master resume and tailored material verification

**Files:**

- Create: `apps/job-search-loop/job_search_loop/materials.py`
- Create: `apps/job-search-loop/templates/resume.html`
- Create: `apps/job-search-loop/templates/cover-letter.md`
- Create: `apps/job-search-loop/scripts/render-resume.sh`
- Create: `apps/job-search-loop/tests/test_materials.py`
- Create locally, never commit:
  `~/.config/anicca/job-search/profile.json`
- Create locally, never commit:
  `~/.local/share/anicca/job-search/materials/master/Daisuke_Narita_AI_Resume.pdf`

**Step 1: Write failing tests**

Test:

- every claim contains an approved `fact_id`;
- tailored output cannot introduce numbers, employers, skills, or dates absent from
  the truth ledger;
- MUFG wording contains “contributed” and never sole ownership;
- public links are preserved;
- HTML is single-column and contains no image-only text;
- extracted PDF text contains every required heading and URL.

**Step 2: Run RED**

```bash
python3 -m unittest tests.test_materials -v
```

**Step 3: Implement material compiler**

Render HTML from the truth ledger, print to PDF with the installed Chromium toolchain,
then run `pdftotext`. Reject the PDF if extracted content is missing or clipped.

**Step 4: Build private profile from existing resumes and user-approved facts**

Use the existing local Japanese and English resumes as evidence inputs. Keep stale
address and phone fields marked `needs_runtime_confirmation` and do not include them
unless an ATS requires them.

**Step 5: Run GREEN and visual verification**

```bash
python3 -m unittest tests.test_materials -v
apps/job-search-loop/scripts/render-resume.sh
pdftotext "$HOME/.local/share/anicca/job-search/materials/master/Daisuke_Narita_AI_Resume.pdf" -
```

Render the PDF to PNG and inspect every page before accepting.

**Step 6: Commit code and push**

```bash
git fetch origin
git add -A
git commit -m "feat(job-loop): generate fact-grounded ATS resumes"
git push
```

## Task 6: Discovery, daily orchestration, and browser side effect

**Files:**

- Create: `apps/job-search-loop/job_search_loop/discovery.py`
- Create: `apps/job-search-loop/job_search_loop/browser.py`
- Create: `apps/job-search-loop/job_search_loop/daily.py`
- Create: `apps/job-search-loop/job_search_loop/cli.py`
- Create: `apps/job-search-loop/tests/test_discovery.py`
- Create: `apps/job-search-loop/tests/test_daily.py`
- Create: `apps/job-search-loop/tests/test_browser_fence.py`

**Step 1: Write failing tests**

Cover canonicalization from Greenhouse/Lever/Ashby/direct pages, source dedupe,
two-slot catch-up, browser busy exit 75, intent persistence before invocation,
completion fencing, CAPTCHA block, `submit_unknown`, and no blind retry.

**Step 2: Run RED**

```bash
python3 -m unittest tests.test_discovery tests.test_daily tests.test_browser_fence -v
```

**Step 3: Implement bounded daily flow**

```text
discover → extract → hard-filter → rank → reserve slot → tailor → persist intent
→ invoke isolated browser lane → validate/reread → transition
```

Discovery uses public ATS endpoints and Firecrawl search. The browser owns one
dedicated profile/port/lock. No pass may take over the gig-work browser.

**Step 4: Run GREEN and fixture integration**

```bash
python3 -m unittest tests.test_discovery tests.test_daily tests.test_browser_fence -v
python3 -m unittest discover -s tests -v
```

**Step 5: Commit and push**

```bash
git fetch origin
git add -A
git commit -m "feat(job-loop): orchestrate fenced daily applications"
git push
```

## Task 7: Gmail reconciliation and Calendar interview preparation

**Files:**

- Create: `apps/job-search-loop/job_search_loop/gog.py`
- Create: `apps/job-search-loop/job_search_loop/inbox.py`
- Create: `apps/job-search-loop/job_search_loop/calendar.py`
- Create: `apps/job-search-loop/job_search_loop/prep.py`
- Create: `apps/job-search-loop/prompts/interview-prep.md`
- Create: `apps/job-search-loop/schemas/inbox-result.v1.schema.json`
- Create: `apps/job-search-loop/tests/test_inbox.py`
- Create: `apps/job-search-loop/tests/test_calendar.py`
- Create: `apps/job-search-loop/tests/test_prep.py`

**Step 1: Write failing tests**

Test Gmail thread dedupe, confirmation resolution of `submit_unknown`, classification
states, timezone parsing, calendar event key stability, event update instead of
duplicate, 3-day/1-day/immediate prep thresholds, and fact-grounded STAR stories.

**Step 2: Run RED**

```bash
python3 -m unittest tests.test_inbox tests.test_calendar tests.test_prep -v
```

**Step 3: Implement `gog` argv adapter and reconciliation**

Never parse human-formatted CLI output when JSON is available. Calendar retries first
reread by private event key. Prep packs cite public evidence and candidate `fact_id`s.

**Step 4: Run GREEN and authenticated sandbox verification**

```bash
python3 -m unittest tests.test_inbox tests.test_calendar tests.test_prep -v
gog gmail search 'newer_than:1d' --account keiodaisuke@gmail.com --json
```

Create, reread, update, and delete one clearly labelled test event in the primary
calendar; retain redacted command evidence.

**Step 5: Commit and push**

```bash
git fetch origin
git add -A
git commit -m "feat(job-loop): reconcile recruiter mail and interviews"
git push
```

## Task 8: At-most-once Telegram outbox and reports

**Files:**

- Create: `apps/job-search-loop/job_search_loop/outbox.py`
- Create: `apps/job-search-loop/job_search_loop/telegram.py`
- Create: `apps/job-search-loop/job_search_loop/report.py`
- Create: `apps/job-search-loop/tests/test_outbox.py`
- Create: `apps/job-search-loop/tests/test_report.py`

**Step 1: Write failing tests**

Copy the proven gig-loop cases: unique event key, claim lease, fencing token, payload
hash, crash after `send_started`, `delivery_unknown`, no duplicate retry, and daily
report count reconciliation.

**Step 2: Run RED**

```bash
python3 -m unittest tests.test_outbox tests.test_report -v
```

**Step 3: Implement transport**

Reuse the existing Telegram credentials by reference, never copying them. Reports must
link submitted jobs and show honest state counts and model route.

**Step 4: Run GREEN and real one-message verification**

```bash
python3 -m unittest tests.test_outbox tests.test_report -v
python3 -m job_search_loop.cli telegram-self-test
```

Reread the outbox row and verify exactly one `sent` event.

**Step 5: Commit and push**

```bash
git fetch origin
git add -A
git commit -m "feat(job-loop): report applications at most once"
git push
```

## Task 9: Evidence-backed self-improvement

**Files:**

- Create: `apps/job-search-loop/job_search_loop/experiments.py`
- Create: `apps/job-search-loop/job_search_loop/verify_improvement.py`
- Create: `apps/job-search-loop/prompts/weekly-experiment.md`
- Create: `apps/job-search-loop/schemas/experiment.v1.schema.json`
- Create: `apps/job-search-loop/tests/test_experiments.py`
- Create: `apps/job-search-loop/tests/test_improvement_verifier.py`

**Step 1: Write failing tests**

Cover one-variable-only experiments, held-out replay, truth/hard-filter regression,
minimum 10 resolved applications, response-rate lower bound, inconclusive retention,
promotion/revert, evidence hash mismatch, and durable remediation.

**Step 2: Run RED**

```bash
python3 -m unittest tests.test_experiments tests.test_improvement_verifier -v
```

**Step 3: Implement generation protocol**

The model proposes; deterministic code verifies and promotes. Preserve the baseline
until the minimum sample and outcome checks pass.

**Step 4: Run GREEN and full suite**

```bash
python3 -m unittest tests.test_experiments tests.test_improvement_verifier -v
python3 -m unittest discover -s tests -v
```

**Step 5: Commit and push**

```bash
git fetch origin
git add -A
git commit -m "feat(job-loop): add verified strategy evolution"
git push
```

## Task 10: launchd, health checks, and Life Manager summary contract

**Files:**

- Create: `apps/job-search-loop/launchd/ai.anicca.job-search-daily.plist`
- Create: `apps/job-search-loop/launchd/ai.anicca.job-search-inbox.plist`
- Create: `apps/job-search-loop/scripts/install-launchd.sh`
- Create: `apps/job-search-loop/scripts/run-daily.sh`
- Create: `apps/job-search-loop/scripts/run-inbox.sh`
- Create: `apps/job-search-loop/scripts/healthcheck.sh`
- Create: `apps/job-search-loop/job_search_loop/summary.py`
- Create: `apps/job-search-loop/schemas/summary.v1.schema.json`
- Create: `apps/job-search-loop/tests/test_launchd.py`
- Create: `apps/job-search-loop/tests/test_summary.py`
- Create: `apps/job-search-loop/README.md`

**Step 1: Write failing tests**

Assert absolute program paths, catch-up-on-wake, non-overlapping locks, separate browser
port/profile, bounded log paths, daily/inbox intervals, health freshness, and
PII-free summary output.

**Step 2: Run RED**

```bash
python3 -m unittest tests.test_launchd tests.test_summary -v
```

**Step 3: Implement and install**

Daily launch: 08:30 JST with `RunAtLoad`. Inbox launch: every 900 seconds. Both scripts
use explicit PATH and fail closed when profile/auth/runtime dependencies are absent.

**Step 4: Run GREEN and plist validation**

```bash
python3 -m unittest tests.test_launchd tests.test_summary -v
plutil -lint apps/job-search-loop/launchd/*.plist
apps/job-search-loop/scripts/healthcheck.sh
```

**Step 5: Commit and push**

```bash
git fetch origin
git add -A
git commit -m "feat(job-loop): install autonomous launchd passes"
git push
```

## Task 11: Production E2E and first pass

**Files:**

- Update: `docs/superpowers/specs/2026-07-28-job-search-loop-design.md`
- Create: `docs/superpowers/evidence/job-search-loop/verification.md`

**Step 1: Run every deterministic check fresh**

```bash
cd apps/job-search-loop
python3 -m unittest discover -s tests -v
python3 -m compileall job_search_loop
plutil -lint launchd/*.plist
```

**Step 2: Install and trigger the real loop**

```bash
scripts/bootstrap-framework.sh
scripts/install-launchd.sh
launchctl kickstart -k "gui/$(id -u)/ai.anicca.job-search-daily"
launchctl kickstart -k "gui/$(id -u)/ai.anicca.job-search-inbox"
```

Watch the real launchd owners; do not spawn a parallel executor.

**Step 3: Verify external truth**

Reread:

- ledger state and immutable intent hashes;
- ATS confirmation page or confirmation email;
- Gmail cursor and classified thread;
- Calendar event if an interview exists;
- Telegram outbox `sent` record;
- model runner summary and selected Terra/Luna/fallback route;
- launchd process status and fresh logs.

At least one real eligible ATS application must be `submitted` to claim E2E success.
If an ATS blocks on CAPTCHA or a required unknown private field, retain the exact
`blocked` evidence and continue to the next eligible role without fabricating data.

**Step 4: Record results without secrets**

The evidence document contains commands, timestamps, counts, hashes, URLs, and
redacted results. It never contains tokens, cookies, phone, street address, or form
free text.

**Step 5: Final commit and push**

```bash
git fetch origin
git add -A
git commit -m "docs(job-loop): record production verification"
git push
git status --short
```
