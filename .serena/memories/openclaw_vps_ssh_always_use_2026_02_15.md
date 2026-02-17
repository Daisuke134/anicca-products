# OpenClaw VPS: 必ず SSH で確認する

- **VPS 接続は常に SSH で行う。**「VPS に接続できません」と断定しない。SSH で接続できる。
- **SSH コマンド:** `ssh anicca@46.225.70.241`
- **確認例（workspace 一覧）:** `ssh anicca@46.225.70.241 "find /home/anicca/.openclaw -type f -o -type d 2>/dev/null | sort | head -200"`
- **確認例（ops の中身）:** `ssh anicca@46.225.70.241 "cat /home/anicca/.openclaw/workspace/ops/steps.json 2>/dev/null; cat /home/anicca/.openclaw/workspace/ops/heartbeat_state.json 2>/dev/null"`
- **cron ジョブ一覧:** `ssh anicca@46.225.70.241 "grep -E '\"id\"|\"jobId\"' /home/anicca/.openclaw/cron/jobs.json | head -80"`

判断・確認は VPS 上で行う。ローカルだけの変更で終わらせない。
