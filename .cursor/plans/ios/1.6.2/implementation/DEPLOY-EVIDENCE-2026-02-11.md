# 1.6.2 デプロイ証跡（2026-02-11）

**目的:** Anicca が E2E 実行可能な状態までの引き渡し証跡。

---

## 1. skills 配置結果

```bash
ssh ${VPS_USER}@${VPS_HOST} 'find /home/anicca/.openclaw/skills -name "SKILL.md" | sort'
```

**結果（記入）:**
```
/home/anicca/.openclaw/skills/anicca-auto-development/SKILL.md
/home/anicca/.openclaw/skills/app-nudge-sender/SKILL.md
/home/anicca/.openclaw/skills/autonomy-check/SKILL.md
/home/anicca/.openclaw/skills/codex-review/SKILL.md
/home/anicca/.openclaw/skills/grok-context-research/skills/article-agent-context-research/SKILL.md
/home/anicca/.openclaw/skills/hookpost-ttl-cleaner/SKILL.md
/home/anicca/.openclaw/skills/mission-worker/SKILL.md
/home/anicca/.openclaw/skills/moltbook-monitor/SKILL.md
/home/anicca/.openclaw/skills/moltbook-poster/SKILL.md
/home/anicca/.openclaw/skills/moltbook/SKILL.md
/home/anicca/.openclaw/skills/ops-heartbeat/SKILL.md
/home/anicca/.openclaw/skills/roundtable-initiative-generate/SKILL.md
/home/anicca/.openclaw/skills/roundtable-memory-extract/SKILL.md
/home/anicca/.openclaw/skills/roundtable-standup/SKILL.md
/home/anicca/.openclaw/skills/slack-mention-handler/SKILL.md
/home/anicca/.openclaw/skills/sto-weekly-refresh/SKILL.md
/home/anicca/.openclaw/skills/suffering-detector/SKILL.md
/home/anicca/.openclaw/skills/tiktok-poster/SKILL.md
/home/anicca/.openclaw/skills/trend-hunter/SKILL.md
/home/anicca/.openclaw/skills/x-poster/SKILL.md
/home/anicca/.openclaw/skills/x-research/SKILL.md
```

---

## 2. jobs.json 確認結果

**パス:** `/home/anicca/.openclaw/cron/jobs.json`  
**SSOT:** `TODO-NEXT-2026-02-09.md` セクション3（19ジョブ）

```bash
ssh ${VPS_USER}@${VPS_HOST} 'cat /home/anicca/.openclaw/cron/jobs.json | head -c 2000'
```

**結果（記入）:**
```
$ ssh anicca@46.225.70.241 'cat /home/anicca/.openclaw/cron/jobs.json | jq ".jobs | length"'
19

jobId一覧: ops-heartbeat, mission-worker, trend-hunter, suffering-detector, x-poster-morning, x-poster-evening, tiktok-poster-morning, tiktok-poster-evening, app-nudge-morning, app-nudge-afternoon, app-nudge-evening, moltbook-monitor, moltbook-poster, roundtable-standup, roundtable-memory-extract, roundtable-initiative-generate, hookpost-ttl-cleaner, sto-weekly-refresh, autonomy-check（計19件）
```

---

## 3. env 存在確認結果

必須キー: `API_BASE_URL`, `ANICCA_AGENT_TOKEN`, `APIFY_API_TOKEN`, `TWITTERAPI_KEY`, `REDDAPI_API_KEY`, `MOLTBOOK_BASE_URL`, `MOLTBOOK_ACCESS_TOKEN`

```bash
ssh ${VPS_USER}@${VPS_HOST} '
source ~/.openclaw/.env 2>/dev/null || true
for k in API_BASE_URL ANICCA_AGENT_TOKEN APIFY_API_TOKEN TWITTERAPI_KEY REDDAPI_API_KEY MOLTBOOK_BASE_URL MOLTBOOK_ACCESS_TOKEN; do
  [ -n "${!k}" ] && echo "OK:$k" || echo "MISSING:$k"
done
'
```

**結果（記入）:**
```
MISSING:API_BASE_URL
MISSING:ANICCA_AGENT_TOKEN
MISSING:APIFY_API_TOKEN
MISSING:TWITTERAPI_KEY
MISSING:REDDAPI_API_KEY
MISSING:MOLTBOOK_BASE_URL
MISSING:MOLTBOOK_ACCESS_TOKEN
```
※ VPS ~/.openclaw/.env は存在するが、上記キー名と一致する変数が未設定。.envの変数名を合わせるか、該当値を投入する必要あり。

---

## 4. gateway 再起動結果

```bash
ssh ${VPS_USER}@${VPS_HOST} '
systemctl --user restart openclaw-gateway.service || systemctl restart openclaw-gateway || pm2 restart openclaw-gateway || true
sleep 3
systemctl --user status openclaw-gateway.service 2>/dev/null || pgrep -f openclaw || echo "check manually"
'
```

**結果（記入）:**
```
● openclaw-gateway.service - OpenClaw Gateway (v2026.2.3-1)
     Loaded: loaded (.../openclaw-gateway.service; enabled)
     Active: active (running) since Wed 2026-02-11 12:15:30 UTC
   Main PID: 190685 (openclaw-gatewa)
      Tasks: 24, Memory: 674.5M
```

---

## 5. vitest 結果

```bash
cd apps/api && npx vitest run src/routes/ops src/routes/admin src/services/ops src/middleware/__tests__/opsAuth.test.js
```

**結果（2026-02-11 RUNBOOK 実行）:**
- 41 ファイル、158 テスト、失敗 0
- 証跡: `npx vitest run src/routes/ops src/routes/admin src/services/ops src/middleware/__tests__/opsAuth.test.js` → Test Files 41 passed, Tests 158 passed

**結果（2026-02-11 同日・moltbook-poster dry_run 対応後）:**
- 上記同一コマンドで 41 files, 159 tests passed（moltbook-poster に dry_run body 対応追加＋jobs.test.js に dry_run テスト 1 件追加で 6 tests in jobs.test.js）

---

## 6. schedule 無効化差分（GHA 4ファイル）

対象:
- `.github/workflows/anicca-x-post.yml`
- `.github/workflows/anicca-daily-post.yml`
- `.github/workflows/tiktok-card-post.yml`
- `.github/workflows/cross-post-tiktok-to-ig.yml`

**確認:**
```bash
rg -n "schedule:" .github/workflows/anicca-x-post.yml .github/workflows/anicca-daily-post.yml .github/workflows/tiktok-card-post.yml .github/workflows/cross-post-tiktok-to-ig.yml
```
→ 出力が空であること（schedule 削除済み）

---

## 7. E2E 疎通チェック（3エンドポイント・AGENT-RUNBOOK 5）

ローカルから実行（API_BASE_URL=Staging, ANICCA_AGENT_TOKEN / INTERNAL_API_TOKEN 使用）:
```bash
# heartbeat
curl -sS -o /tmp/hb.json -w '%{http_code}' -X POST "${API_BASE_URL}/api/ops/heartbeat" \
  -H "Authorization: Bearer ${ANICCA_AGENT_TOKEN}" -H "Content-Type: application/json" -d '{}'
# autonomy-check (dry_run)
curl -sS -o /tmp/auto.json -w '%{http_code}' -X POST "${API_BASE_URL}/api/admin/jobs/autonomy-check" \
  -H "Authorization: Bearer ${INTERNAL_API_TOKEN}" -H "Content-Type: application/json" -d '{"dry_run":true}'
# moltbook-poster (dry_run) ※ body.dry_run 対応済み
curl -sS -o /tmp/mb.json -w '%{http_code}' -X POST "${API_BASE_URL}/api/admin/jobs/moltbook-poster" \
  -H "Authorization: Bearer ${INTERNAL_API_TOKEN}" -H "Content-Type: application/json" -d '{"dry_run":true}'
```

**結果（2026-02-11 RUNBOOK 実行）:**
| エンドポイント | HTTPコード | 備考 |
|----------------|------------|------|
| POST /api/ops/heartbeat | 401 | Unauthorized。ローカルANICCA_AGENT_TOKEN が Railway Staging の値と不一致の可能性 |
| POST /api/admin/jobs/autonomy-check | (未実施) | INTERNAL_API_TOKEN がローカル .env に未設定のためスキップ |
| POST /api/admin/jobs/moltbook-poster | (未実施) | 同上 |

**コード対応（2026-02-11）:** `POST /api/admin/jobs/moltbook-poster` に `body.dry_run` 対応を追加。`req.body.dry_run === true` のとき `runMoltbookPosterJob({ dryRun: true })` を呼び、Moltbook API は呼ばず 200 で `{ ok: true, dryRun: true, ... }` を返す。RUNBOOK の「moltbook-poster (dry_run) = 200」ゲート用。

**解消手順:** Railway Dashboard で Staging の `ANICCA_AGENT_TOKEN` を確認し、ローカル .env と一致させる。`INTERNAL_API_TOKEN` を .env に追加（Railway の INTERNAL_API_TOKEN と同じ値）。

---

## 8. AGENT-RUNBOOK 実行サマリ（2026-02-11）

| ステップ | 結果 | 証跡 |
|---------|------|------|
| 0) git checkout dev, pull | OK | branch=dev, head=fe692316 |
| 1) 必須env | 一部不足 | INTERNAL_API_TOKEN MISSING。API_BASE_URL, ANICCA_AGENT_TOKEN は OK |
| 2) VPS sync + restart | スキップ | SSH timeout。手動実行要 |
| 3) vitest | PASS | 41 files, 158 tests |
| 4) Railway deploy | デプロイ済み | 最新 SUCCESS: fe692316（heartbeat POST 含む） |
| 5) 3エンドポイント疎通 | 未達成 | heartbeat 401（token不一致）、admin 2件は INTERNAL_API_TOKEN 未設定で未実施 |
| 6) VPS skills/jobs | スキップ | SSH timeout |

## 9. E2E 実行引き渡し準備完了

- [ ] 上記 1–8 をすべて完了したうえでチェックする。（※ token 一致・heartbeat 200 が未達）
- [ ] Anicca（VPS）が E2E 開始可能である根拠: heartbeat API 200、gateway 稼働、skills/jobs/env 配置済み。

**実施状況:** vitest PASS、Railway デプロイ SUCCESS。token 一致確認と 3エンドポイント 200 が残課題。

---

**記入者・日時:** 2026-02-11（AGENT-RUNBOOK 実行結果記入）
