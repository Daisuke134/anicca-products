# Life Manager Repository Rename Design

## Status and authority

The user approves this design in full. The final product and its single public monorepo are **Life Manager** at `Daisuke134/life-manager`. `Anicca` remains the agent and mission name where that meaning is intentional; it is not the final repository slug. This decision is closed and does not require another choice or review gate.

The repository-settings operation is not part of this documentation change. Execution follows `docs/superpowers/plans/2026-07-23-life-manager-repository-rename.md` in a later scoped run.

## Scope

This design covers only the collision-safe rename of two public GitHub repositories, their local remotes, GitHub redirects, GitHub Pages, and live repository URL references.

It does not rename, archive, delete, merge, deploy, or otherwise change `Daisuke134/anicca-products` (repository ID `1245528469`), Railway, product code, secrets, or any Life Manager §10 product/runtime work. The content/history import from `life-manager-v0` is a later migration and must finish with equivalence proof before that repository can be archived.

## Approved repository identities

Repository identity is tracked by immutable numeric ID during the operation; a slug is only the current name.

| Repository ID | Current name | Final name | Required state |
|---:|---|---|---|
| `1273052304` | `Daisuke134/life-manager` | `Daisuke134/life-manager-v0` | public, unarchived, undeleted until history/content import and equivalence verification finish |
| `1248111245` | `Daisuke134/anicca` | `Daisuke134/life-manager` | public, unarchived, canonical product monorepo |

The intermediate slug `Daisuke134/life-manager-v0` returns `404` before execution. The final slug is currently occupied by repository ID `1273052304`, so a direct rename cannot be collision-safe.

## Collision-safe sequence

1. Capture ID-keyed metadata and complete branch/tag refs, issue identities, stargazer identities, Pages state, Action manifests, webhooks, rulesets, and local remotes for both repositories.
2. Immediately re-read target ID `1273052304`, then rename `Daisuke134/life-manager` to `Daisuke134/life-manager-v0` with explicit `--repo` and `--yes` arguments.
3. Immediately update `/Users/anicca/Projects/life-manager` so `origin` is `https://github.com/Daisuke134/life-manager-v0.git`; fetch and verify the remote before continuing.
4. Immediately re-read target ID `1248111245`, then rename `Daisuke134/anicca` to `Daisuke134/life-manager`.
5. Immediately update the shared remote of `/Users/anicca/anicca` so `origin` is `https://github.com/Daisuke134/life-manager.git`; verify the base clone and every linked worktree resolve the same remote.
6. Compare the ID-keyed before/after evidence, validate redirects and takeover behavior, update live URLs in a separate TDD-scoped commit, and redeploy/verify Pages at its new project URL.

No step deletes a repository, force-pushes a ref, rewrites history, archives either repository, or creates a replacement repository.

## Redirect semantics and the old names

GitHub redirects repository web traffic and Git operations after a rename, but project-site URLs are an explicit exception. Therefore:

- `https://github.com/Daisuke134/anicca` and `https://github.com/Daisuke134/anicca.git` must resolve to repository ID `1248111245` after the final rename.
- The old `anicca` repository name must never be recreated. Reuse would disable the redirect GitHub establishes for existing links and clones.
- The first rename temporarily makes old `Daisuke134/life-manager` links redirect to ID `1273052304`. The second rename deliberately takes over that slug with ID `1248111245`; afterward, `Daisuke134/life-manager` must identify the final monorepo and the former repository is reachable only as `Daisuke134/life-manager-v0`.
- Redirects are compatibility behavior, not the desired local configuration. Both local remotes are updated immediately after their respective rename.

## Pages, Actions, webhooks, and rulesets

The current `Daisuke134/anicca` repository has a workflow-built project site:

| Surface | Measured state before rename | Required post-rename state |
|---|---|---|
| GitHub Pages | `https://daisuke134.github.io/anicca/`, `build_type=workflow`, source `gh-pages:/`, `cname=null` | Pages API reports `https://daisuke134.github.io/life-manager/`; workflow ID `307239134` succeeds on `gh-pages`; logged-out HTTP read succeeds |
| Action manifests | all fetched remote heads/tags have `0` files named `action.yml` or `action.yaml` | still `0`; the hosted-action redirect exception is inapplicable |
| Repository webhooks | `0` | still `0`; no endpoint migration is required |
| Repository rulesets | `0` | still `0`; no ruleset target rewrite is required |

Pages is not covered by the normal repository redirect. The new Pages URL and deployment workflow are mandatory verification items, and every live `github.com/Daisuke134/anicca`, `raw.githubusercontent.com/Daisuke134/anicca`, and `daisuke134.github.io/anicca` reference is updated in a later TDD-scoped commit. Truthful historical evidence remains unchanged and is explicitly excluded from the live-reference guard.

## Local clone and worktree mapping

| Local shared Git directory | Final `origin` | Notes |
|---|---|---|
| `/Users/anicca/Projects/life-manager` | `https://github.com/Daisuke134/life-manager-v0.git` | preserves access to repository ID `1273052304` for later import/equivalence work |
| `/Users/anicca/anicca` and its linked worktrees | `https://github.com/Daisuke134/life-manager.git` | shared Git config means one remote update applies to all linked worktrees; each worktree is read-verified |

This documentation worktree belongs to `Daisuke134/anicca-products`; its remote is not changed by the rename run.

## Fail-closed and rollback rules

- Immediately before each `gh repo rename`, both the slug lookup and numeric-ID lookup must agree on the exact target. Any mismatch, lost admin access, non-public/archive drift, unexpected new webhook/ruleset/Action manifest, or occupied intermediate slug stops before mutation.
- If the first rename fails, change nothing else.
- If the first rename succeeds and the second fails before ID `1248111245` moves, stop. If the `life-manager` lookup still redirects to ID `1273052304` and no different repository owns that slug, the only permitted rollback is renaming ID `1273052304` back to `life-manager` and restoring its local remote. Otherwise preserve both repositories and escalate; never delete or overwrite a colliding repository.
- Once ID `1248111245` successfully becomes `Daisuke134/life-manager`, do not recreate `anicca` and do not rename backward as an improvised rollback. Repair remotes, references, redirects, or Pages forward while preserving both IDs and all refs.
- A failed comparison, Pages deployment, or live-reference test is a failed migration. It does not authorize deletion, archive, force-push, history replacement, repository creation, Railway changes, or changes to `anicca-products`.

## Exact done conditions

The rename is done only when one evidence bundle proves all of the following:

- ID `1273052304` is exactly `Daisuke134/life-manager-v0`, public and unarchived; ID `1248111245` is exactly `Daisuke134/life-manager`, public and unarchived.
- Before/after normalized refs, issue IDs/numbers/states, and stargazer IDs are byte-identical for each repository ID; default branches and their head SHAs match. This proves no lost history, branches, tags, issues, or stars.
- `/Users/anicca/Projects/life-manager` and `/Users/anicca/anicca` use their approved final remotes, all linked worktrees agree, and fetch/`ls-remote` succeed.
- Old `anicca` web and Git URLs resolve to ID `1248111245`; final `life-manager` resolves to ID `1248111245`; explicit `life-manager-v0` resolves to ID `1273052304`.
- Pages API and successful workflow evidence identify `https://daisuke134.github.io/life-manager/`, and a logged-out request succeeds. No custom domain appears unexpectedly.
- Action manifest, webhook, and ruleset counts remain zero.
- The live-reference RED→GREEN test passes, the scoped URL-change commit is reviewed, pushed, merged, and its remote SHA is recorded. Historical evidence remains unchanged.
- `Daisuke134/anicca-products` remains ID `1245528469` with the same name, and no Railway or §10 product/runtime side effect occurs.
- The evidence contains every command exit result and no secret. Both repositories still exist; neither history is deleted.

## Sources and direct evidence

Each material operational decision above is grounded in the following source or live GitHub response:

- Final product name: [Life Manager README](https://github.com/Daisuke134/life-manager#readme) / direct quote: “Life Manager”.
- Repository ID `1273052304`: [GitHub REST live repository response](https://api.github.com/repositories/1273052304) / direct quote: `"id": 1273052304` and `"full_name": "Daisuke134/life-manager"`.
- Repository ID `1248111245`: [GitHub REST live repository response](https://api.github.com/repositories/1248111245) / direct quote: `"id": 1248111245` and `"full_name": "Daisuke134/anicca"`.
- Redirect and Pages exception: [Renaming a repository — GitHub Docs](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository) / direct quote: “with the exception of project site URLs, is automatically redirected”.
- Never recreate old `anicca` and hosted-Action caveat: [リポジトリの名前を変更する — GitHub Docs](https://docs.github.com/ja/repositories/creating-and-managing-repositories/renaming-a-repository) / direct quote: 「元の名前を再利用しないでください」「アクションに呼び出しがリダイレクトされることはありません」。
- Local remote update: [Managing remote repositories — GitHub Docs](https://docs.github.com/en/get-started/git-basics/managing-remote-repositories) / direct quote: `git remote set-url origin REMOTE-URL`.
- Exact CLI mutation: [gh repo rename — GitHub CLI manual](https://cli.github.com/manual/gh_repo_rename) / direct quote: “the repository specified with --repo is renamed” and “Skip the confirmation prompt”.
- Pages state: [GitHub Pages live API response](https://api.github.com/repos/Daisuke134/anicca/pages) / direct quote: `"html_url":"https://daisuke134.github.io/anicca/"` and `"cname":null`.
- Webhook absence: [GitHub repository hooks live API](https://api.github.com/repos/Daisuke134/anicca/hooks) / authenticated live response: `[]`.
- Ruleset absence: [GitHub repository rulesets live API](https://api.github.com/repos/Daisuke134/anicca/rulesets) / authenticated live response: `[]`.
