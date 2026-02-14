# OpenClaw VPS 用スクリプト

## workspace 19 項目検証（VPS 上で実行）

`.cursor/plans/reference/openclaw-workspace-folder-tree-and-todo.md` の #13–#19 が VPS で満たされているか確認する。

```bash
scp scripts/openclaw-vps/verify-vps-workspace.sh anicca@46.225.70.241:~/
ssh anicca@46.225.70.241 'bash ~/verify-vps-workspace.sh'
```

---

## GPT-5.3 Codex への切替（運用化）

VPS 上の Anicca を `openai-codex/gpt-5.3-codex` で動かすための手順。

### 前提

- Slack に繋ぐ gateway は **VPS 1台のみ**。ローカルでは gateway を止めてあること。
- 詳細 Runbook: `.cursor/plans/reference/openclaw-anicca.md`

### クイック手順

| 順 | 作業 | 実行場所 |
|----|------|----------|
| 0 | ローカルで gateway が動いていないことを確認 | ローカル Mac |
| 1 | VPS で gateway を止める（OAuth 中 OOM 防止） | VPS |
| 2 | **openai-codex OAuth**（ブラウザで許可 → redirect URL を VPS に貼り付け） | ローカルから `ssh -tt` |
| 3 | 本スクリプトを VPS に送って実行（allowlist + primary 設定 + gateway 再起動） | VPS |
| 4 | Slack で 1 メンション = 1 返信・モデル表示を確認 | Slack |

### コマンド例（ローカルから）

```bash
# 0) ローカルで gateway が止まっていること
pgrep -fl openclaw-gateway || echo "OK"

# 1) VPS で gateway 停止
ssh anicca@46.225.70.241 'systemctl --user stop openclaw-gateway.service'

# 2) OAuth（TTY 必須。表示された URL をブラウザで開き、リダイレクト先 URL をターミナルに貼り付ける）
ssh -tt anicca@46.225.70.241 'openclaw models auth login --provider openai-codex'

# 3) スクリプトを送って実行
scp scripts/openclaw-vps/switch-to-gpt53codex.sh anicca@46.225.70.241:~/
ssh anicca@46.225.70.241 'bash ~/switch-to-gpt53codex.sh'
```

### Unknown model が出た場合

- **原因**: OAuth 未完了、または primary を切り替えたが gateway 再起動前／再起動失敗。
- **対応**:
  1. VPS で `openclaw models status --agent anicca` を実行し、`openai-codex/gpt-5.3-codex` が一覧に出るか確認。
  2. 出ない場合は OAuth をやり直し（上記 2）、その後 3 のスクリプトを再実行。
  3. 出るのに Unknown model のときは、gateway を再起動: `systemctl --user restart openclaw-gateway.service` し、ログで `agent model: openai-codex/gpt-5.3-codex` を確認。
