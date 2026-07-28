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
| Inbox | Gmail metadata is prefiltered deterministically; a model runs only for a new recruiting thread |
| Calendar | An event is created only when the email supplies a definite interview time |
| Self-improvement | One-field experiments require 10 resolved samples per arm, zero replay violations, and non-overlapping Wilson 95% intervals |

## Runtime

| Component | Schedule | Route |
|---|---|---|
| `ai.anicca.job-search-daily` | 08:30 JST daily | bounded browser-lane agent |
| `ai.anicca.job-search-inbox` | every 15 minutes | deterministic Gmail prefilter; Terra composition agent only on a new recruiting thread |

The current local deployment uses launchd and is designed so the same drivers and
SQLite contracts can later be invoked by Life Manager without changing application
semantics.

## Key paths

| Purpose | Path |
|---|---|
| Private profile | `~/.config/anicca/job-search/profile.json` |
| Strategy | `config/strategy.default.json` |
| Ledger | `~/.local/state/anicca/job-search/ledger.sqlite3` |
| Evidence | `~/.local/state/anicca/job-search/evidence/` |
| Materials | `~/.local/share/anicca/job-search/materials/` |
| Engineering resume | `~/.local/share/anicca/job-search/materials/master/Daisuke_Narita_AI_Resume.pdf` |
| Technical-business resume | `~/.local/share/anicca/job-search/materials/business/Daisuke_Narita_AI_Business_Resume.pdf` |
| Technical-business message templates | `templates/application-messages.v1.json` |
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

The inbox checkpoint is committed only after its AI pass succeeds. Empty polls exit
successfully without consuming a model budget. Gmail bodies remain untrusted input;
the loop never follows instructions embedded in a job page or email.
