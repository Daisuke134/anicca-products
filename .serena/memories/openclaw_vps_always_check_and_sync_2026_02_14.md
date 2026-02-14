# OpenClaw/Anicca: VPS を忘れず確認・同期する（絶対）

日付: 2026-02-14

## ルール
SKILL.md や openclaw-anicca.md を変更したら、**必ず VPS 側もやる**。忘れない。

1. **VPS に SSH して確認する**  
   - `workspace/ops/` が存在するか。無ければ `mkdir -p ~/.openclaw/workspace/ops` と `steps.json` / `heartbeat_state.json` / `proposals.json` の初期化。
   - `~/.openclaw/.env` に API_BASE_URL 等が入っているか。

2. **repo の SKILL.md を VPS に反映する**  
   - 例: `scp openclaw-skills/x-poster/SKILL.md anicca@VPS:/home/anicca/.openclaw/skills/x-poster/SKILL.md`  
   - mission-worker, ops-heartbeat, trend-hunter, x-poster, tiktok-poster を変更したら、その分だけ VPS の `~/.openclaw/skills/<name>/SKILL.md` にコピーする。

3. **「こっちでは VPS に SSH してないので確認してない」で終わらせない**  
   - 設計だけ書いて VPS に何もしていない場合は、TODO に「VPS で workspace/ops 作成」「VPS に SKILL 同期」を明示し、後で誰か（または同じエージェント）が実行するか、可能なら自分で SSH して実行する。

## 参照
- パス一覧: `.cursor/plans/reference/openclaw-anicca.md` 8.5.5, 8.5.6
- VPS スキル配置: 同 8.4, 8.5
