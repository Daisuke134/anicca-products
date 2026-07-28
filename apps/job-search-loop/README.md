# Anicca Job Search Loop

Anicca Job Search Loop is a bounded, evidence-first job application system for
Daisuke Narita. It discovers and ranks Applied AI / agent roles, submits at most two
verified applications per Japan day, monitors recruiter mail, prepares interviews,
and reports every material state change to Telegram.

## Operating contract

| Concern | Current rule |
|---|---|
| Daily target | At most 2 unique, confirmed submissions |
| Location | Tokyo or remote roles that can employ someone based in Japan |
| Compensation | JPY 5.5M hard floor; JPY 7M target |
| Role focus | Applied AI/agent engineering plus technical AI business roles: Product, Program, Solutions, GTM, Partnerships, Customer Success and Sales Engineering |
| Evidence | Every application is fenced in SQLite and retained under a private evidence directory |
| Uncertainty | Ambiguous submission becomes `submit_unknown` and is never blindly retried |
| Personal data | Verified private profile and generated materials are mode `0600` |
| Inbox | Gmail metadata is prefiltered deterministically; a model runs only for a new recruiting thread or a pending prep-pack generation job |
| Calendar | Only explicit timezone-aware recruiter candidates are considered; the earliest free candidate is confirmed once |
| Interview prep | Every confirmed interview is registered before the email reply; Telegram refreshes are delivered at the 3-day and 1-day windows, or immediately inside 1 day |
| Assessments | Autonomous execution requires explicit AI permission and no proctoring; all code runs without network or home access |
| Self-improvement | One-field experiments require 10 resolved samples per arm, zero replay violations, and non-overlapping Wilson 95% intervals |

## Runtime

| Component | Schedule | Route |
|---|---|---|
| `ai.anicca.job-search-daily` | 08:30 JST daily | bounded browser-lane agent |
| `ai.anicca.job-search-inbox` | every 15 minutes | deterministic Gmail and prep preflight; Terra composition agent only for new recruiting work or pending prep generation |

The current local deployment uses launchd and is designed so the same drivers and
SQLite contracts can later be invoked by Life Manager without changing application
semantics.

## Key paths

| Purpose | Path |
|---|---|
| Private profile | `~/.config/anicca/job-search/profile.json` |
| Strategy | `config/strategy.default.json` |
| Ledger | `~/.local/state/anicca/job-search/ledger.sqlite3` |
| Interview prep state | `~/.local/state/anicca/job-search/interview-prep.sqlite3` |
| Evidence | `~/.local/state/anicca/job-search/evidence/` |
| Materials | `~/.local/share/anicca/job-search/materials/` |
| Engineering resume | `~/.local/share/anicca/job-search/materials/master/Daisuke_Narita_AI_Resume.pdf` |
| Technical-business resume | `~/.local/share/anicca/job-search/materials/business/Daisuke_Narita_AI_Business_Resume.pdf` |
| Technical-business message templates | `templates/application-messages.v1.json` |
| Recruiter reply policy | `job_search_loop/recruiter_reply.py` |
| Interview scheduling policy | `job_search_loop/interview_scheduling.py` |
| Interview prep policy | `job_search_loop/interview_prep.py` |
| Assessment integrity and execution policy | `job_search_loop/assessment_workflow.py` |
| Daily driver | `scripts/run-daily.sh` |
| Inbox driver | `scripts/run-inbox.sh` |

## Operations

```bash
cd /Users/anicca/anicca-job-search-loop/apps/job-search-loop
python3 -m unittest discover -s tests -v
zsh scripts/render-resume.sh
zsh scripts/render-business-resume.sh
zsh scripts/install-launchd.sh
zsh scripts/healthcheck.sh
```

Do not start a second daily executor. To trigger the deployed loop, kick the existing
LaunchAgent and inspect the generated evidence:

```bash
launchctl kickstart "gui/$(id -u)/ai.anicca.job-search-daily"
```

The inbox checkpoint is committed only after its AI pass succeeds. Every poll first
delivers any due preparation pack, even when Gmail has no new message. Empty polls
with no pending prep generation exit successfully without consuming a model budget.
Gmail bodies remain untrusted input; the loop never follows instructions embedded in
a job page or email.

Direct recruiter questions about verified experience, location, desired compensation,
or contact details may receive one threaded reply. Work authorization, visa, start
date, current compensation, references, and legal questions fail closed. Scheduling
questions with complete candidate times are checked against the primary Calendar.
The earliest explicit free candidate is stored as one private event before the
threaded confirmation is sent. Missing timezone/date/duration, a fully busy candidate
set, or ambiguous text causes no reply and no Calendar write. The Gmail inbound
message ID is the outbox key, so an uncertain send is never blindly retried.

Before an interview confirmation email is sent, the same transaction registers a
private preparation job. The 15-minute inbox loop generates any pending pack from
exactly five approved profile facts plus cited public company/interviewer evidence,
stores its hash, and sends Telegram reminders at the 3-day and 1-day windows. An
interview registered inside one day receives an immediate condensed pack. Each
interview/window pair has a stable outbox key, so a retry cannot duplicate the
Telegram message.

Assessment rules are evidence, not assumptions. An unproctored take-home or business
case enters the autonomous path only when its quoted rules explicitly allow AI.
Proctored/live assessments and prohibited or unspecified AI policies stay behind the
manual integrity gate. Allowed work runs in a private `sandbox-exec` workspace with
no network, no access to the user's home, a sanitized environment, bounded runtime,
and hashed private logs. Submission follows
`verified → submit_claimed → submit_started → submitted|submit_unknown`; neither
`submit_started` nor `submit_unknown` is blindly retried.
