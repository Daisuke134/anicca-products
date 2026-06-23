# Larry / Reelclaw 配信 — TODO + 全パッチ (SSOT)

**最終更新: 2026-06-23** / runtime: `~/.openclaw` (anicca-dais, trunk `main-internal`)

---

## 🔍 検索で判明した根本原因(deepseek は金欠でも遅くもない)

| 検証 | 結果 |
|---|---|
| deepseek 残高 | **$1.98 あり**(金欠ではない) |
| deepseek-v4-flash 速度 | 単発×10 = 0.6〜1.0s / フルlarry context(96KB+tools+thinking)= 2.3s。**全く遅くない** |
| エラー `LLM idle timeout(120s) no response` | deepseek API が**時々** OpenClaw の複雑リクエストに 120s 応答しない間欠ハング。過去ログで `deepseek-v4-flash` も `deepseek-chat` も**同時** timeout(同じ api.deepseek.com)|
| OpenClaw ソース | 「model idle timeout は `models.providers.<id>.timeoutSeconds`(default 120s)に従う」|

### 「直しても消える」真の機構(★最重要★)
- 私の `openclaw models set` / `plugins install` は **working-tree を編集するだけで未コミット** → ブランチ切替 or `doctor --fix` で **HEAD(古い設定)にリセット** → 設定が戻る。
- 過去の model コミットは全部 6/04〜6/12 の Anicca Agent(私の作業より古い)。今は Anicca が変えてるのでなく **未コミットのリセット**が犯人。
- **fix = main-internal トランクにコミットすれば消えない。**

---

## ✅ 完了(検証済み)
| 項目 | 証拠 |
|---|---|
| 日本語テキストはみ出し恒久修正 | add-text-overlay.js CJK折返し+禁則+shrink-to-fit。3背景メール送信済 |
| Apple ID パスワード→Epoc1234! | .env:217,219 |
| larry-ja-5=anicca_buddha 7/13/20 | tiktok.com/@anicca_buddha 公開検証 |
| IG配線(英語→encards/日本語→アニッチャ/他TikTokのみ) | en-1-am/noon を anicca.jp.videos→anicca.encards 修正 |
| post-to-tiktok.js trunk復元 | 95f64f004(1080/JPEG/auto-pair/verify 318行版) |
| **model設定を trunk にコミット** | **58babc624 deepseek+gpt-5.4-mini pin → 消えない** |
| 背景アセット復元 + commit | maleface/femaleface/sunset.jpg |

### 背景タイプ→投稿先(確定形)
```
夕焼け  → @anicca.jp          [TikTokのみ]   ← anicca.jp が夕焼け
女性    → @aniccaaffirmation  [TikTokのみ]
男性EN  → @aniccaen2          [TikTok + IG @anicca.encards(Anicca iOS)]
男性JP  → @anicca.jpx         [TikTok + IG @アニッチャ]
男性JP  → @anicca.he / @anicca.jp4 / @anicca_buddha  [TikTokのみ]
```

---

## ⏳ 残りTODO + 各パッチ(exact)

### #0b codex が消える → gpt-5.4-mini fallback 死ぬ(再発防止)
**症状**: codex プラグイン(gpt-5.4-mini の harness)が消える → `MissingAgentHarnessError` → deepseek ハング時に救えず全滅。npm dir は 1.3GB(git コミット不可)。
**パッチ**(gateway起動 guard cron):
```
openclaw cron add --cron "*/30 * * * *" --name codex-health-guard \
 --message "openclaw cron list 2>&1 | grep -q 'codex.*not installed' && \
   ( rm -rf ~/.openclaw/npm/projects/openclaw-codex-* ; openclaw plugins install @openclaw/codex ; openclaw gateway restart ) || true"
```
+ `.gitignore` に `npm/projects/` 追加(ブランチ切替で消えない & git肥大化防止)。要 `git rm --cached -r npm/projects`(1.3GB untrack)。

### #0c deepseek 間欠ハング軽減(任意・fallbackが主役)
**パッチ**(openclaw.json):
```
models.providers.deepseek.timeoutSeconds: 180   (120→180、一瞬の遅延で失敗しない)
deepseek-v4-flash の reasoning を無効化(「5格言生成」に推論不要、応答速くtimeout減)
```

### #9 背景の実投稿確認(私の作業, go不要)
aniccaaffirmation=女性 / anicca.jp=夕焼け を fire して実公開確認。

### #11a canvas 自動修復(`workspace/skills/larry/scripts/build-from-fixed-strings.sh` 冒頭)
```diff
+ node -e "require('canvas')" 2>/dev/null || ( cd ~/.openclaw/workspace && npm rebuild canvas )
  python3 << PY
```

### #11b disk/session janitor(新cron)
```
openclaw cron add --cron "30 4 * * *" --name session-disk-janitor \
 --message "find ~/.openclaw/agents/anicca/sessions -name '*.jsonl' -mtime +2 -delete; \
   find ~/.openclaw/workspace/tiktok-marketing -maxdepth 1 -name 'run-*' -mtime +2 -exec rm -rf {} +"
```

### #11c worktree厳守 + trunkコミット(運用ルール)
全 runtime 修正は worktree→main-internal merge→commit。**未コミットは消える**。state ファイルは直接編集(gateway常時書込で merge不可)。

### ja-v4 cron の --tt が IG id 誤 ★要Dais★
`larry-anicca-ja-v4` の --tt=cmq3sq7m(Instagram の id)。どの TikTok 用か不明 → 停止 or 正しい TikTok id。

### #12 reelclaw 英語 card/widget の TikTok 無し ★要Dais★
TikTok アカウントが存在しない。→ 下記 factory で作成。

### telegram OutboundDeliveryError(3 cron)
reelclaw-anicca-en-widget-1 / honne-en-1 / honne-ja-1 が完了通知 telegram 配信失敗。投稿自体は出てる可能性。要調査。

### TikTok アカウント自動作成 factory(#12 + 将来) ★要Dais★
`~/.openclaw/skills/tiktok-account-factory/`(smspool-buy/signup/otp-relay)= SCAFFOLDED、今はハード要の semi-auto。
→ CapSolver+camofox(memory TIER A: SMSPool登録 human-loop ゼロ実証済)で**完全自動化に書き換え可能**。電話番号購入済。

---

## モデル設定(固定・Dais指定)
`deepseek/deepseek-v4-flash` default + `openai/gpt-5.4-mini` fallback のみ。codex 必須。**trunk にコミット済(58babc624)で消えない**。
