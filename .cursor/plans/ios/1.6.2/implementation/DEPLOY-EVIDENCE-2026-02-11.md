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
cd apps/api && npx vitest run src/routes/ops src/services/ops src/middleware/__tests__/opsAuth.test.js
```

**結果:**
- 34 ファイル、133 テスト、失敗 0

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

## 7. E2E 疎通チェック（heartbeat）

```bash
ssh ${VPS_USER}@${VPS_HOST} '
source ~/.openclaw/.env 2>/dev/null
curl -sS -X POST "$API_BASE_URL/api/ops/heartbeat" \
  -H "Authorization: Bearer $ANICCA_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}" | head -c 500
'
```

**結果（記入）:**
```
curl: (3) URL rejected: No host part in the URL
```
※ API_BASE_URL が空のため heartbeat 失敗。env 投入後に再確認要。

---

## 8. E2E 実行引き渡し準備完了

- [ ] 上記 1–7 をすべて完了したうえでチェックする。（※ env 投入・heartbeat 200 が未達）
- [ ] Anicca（VPS）が E2E 開始可能である根拠: heartbeat API 200、gateway 稼働、skills/jobs/env 配置済み。

**実施状況:** skills配置・jobs.json(19件)・gateway再起動は完了。env 変数名/値の投入と heartbeat 疎通確認は要対応。

---

**記入者・日時:** 2026-02-11（実データ記入）
