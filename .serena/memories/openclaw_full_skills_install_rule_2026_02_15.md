# OpenClaw 完全版スキル インストールルール（2026-02-15）

## ルール

trend-hunter, moltbook-monitor, moltbook-poster が動くには、以下のスキルに**実行コード**が必要。SKILL.md だけ（薄い）では不足。

| スキル | 配置先 | インストール方法 |
|--------|--------|------------------|
| x-research | `~/.openclaw/skills/x-research` | `git clone rohunvora/x-research-skill` + `bun install` |
| reddit-cli | `~/.openclaw/skills/reddit-cli` | `clawhub install reddit-cli --workdir ~/.openclaw --dir skills` |
| moltbook-interact | `~/.openclaw/workspace/skills/moltbook-interact` | `clawhub install moltbook-interact --workdir ~/.openclaw/workspace --dir skills` |

## 一括実行

`scripts/openclaw-vps/install-full-skills-on-vps.sh` を VPS で実行する。

## 参照

- `scripts/openclaw-vps/README.md`
- `.cursor/plans/reference/openclaw-workspace-tree-explained.md`
