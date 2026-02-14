# trend-hunter

## 目的
バズっている話題を **X / TikTok / Reddit の 3 スキルだけ**から収集し、トレンドを `trends/YYYY-MM-DD.json` に書き、投稿用 1 本を `hooks/YYYY-MM-DD.json` に書く。**web_search は使わない。** 保存は VPS ローカル（Anicca 内）のみ。Railway DB には書かない。

## 保存先（Anicca 内・フルパス）

| 種類 | フルパス |
|------|----------|
| トレンド狩り結果のみ | `/home/anicca/.openclaw/workspace/trends/YYYY-MM-DD.json` |
| 投稿用 1 本 | `/home/anicca/.openclaw/workspace/hooks/YYYY-MM-DD.json` |

VPS 相対: `~/.openclaw/workspace/trends/`, `~/.openclaw/workspace/hooks/`。サブフォルダは使わない。1 日 1 ファイルで `slot`（9am \| 9pm）で区別。

---

## フロー（trend-hunter → x-poster / tiktok-poster）

1. **trend-hunter（朝 5 時頃）**  
   - 昨夜 21:00 投稿のメトリクス確認・学習 → トレンド検索（x-research, tiktok-scraper, reddit-cli）→ **trends/YYYY-MM-DD.json** に発見したトレンドのみ保存（投稿文はまだ作らない）→ 候補から 9am 用 1 本を選び **hooks/YYYY-MM-DD.json** に **生成した投稿文** を保存（slot 9am）。
2. **x-poster-morning**  
   **今日の hooks/YYYY-MM-DD.json** を読んで **slot "9am"** の X 用 `postText` だけ使って X に投稿する。
3. **tiktok-poster-morning**  
   同様に **slot "9am"** の `caption` と `imageUrl` を使って TikTok に投稿する。
4. **evening 用**  
   5pm 頃に trend-hunter が 9pm 用を 1 本選んで hooks の **slot "9pm"** を更新。x-poster-evening / tiktok-poster-evening は **slot "9pm"** のみ使用。

---

## 必須 env（すべて VPS の `~/.openclaw/.env` に置く）

| キー | 説明 |
|------|------|
| `X_BEARER_TOKEN` | X 検索（x-research スキル） |
| `APIFY_API_TOKEN` | TikTok（tiktok-scraper スキル・Apify） |
| `REDDAPI_API_KEY` | Reddit（reddit-cli スキル。形式 `rdi_xxxx`） |
| `API_BASE_URL` / `ANICCA_AGENT_TOKEN` | ops 用（必要時のみ） |

## 実行順序（必ずこの順）

1. **昨夜 21:00 投稿のメトリクス確認・学習**（先にやる）
2. トレンド検索（x-research, tiktok-scraper, reddit-cli の 3 スキル）
3. トレンドを **trends/YYYY-MM-DD.json** に保存（出力形式その 1）
4. 候補から 9am 用（または 9pm 用）1 本を選び、**hooks/YYYY-MM-DD.json** に保存（出力形式その 2）

## 必須スキル（web_search は使わない）

| ソース | スキル | コマンド例 |
|--------|--------|-----------|
| X | x-research | `cd ~/.openclaw/skills/x-research && bun run x-search.ts search "meditation viral" --limit 20` |
| TikTok | tiktok-scraper | Apify API `POST https://api.apify.com/v2/acts/clockworks~tiktok-scraper/runs` |
| Reddit | reddit-cli | `curl -s "https://api.reddapi.com/v1/search?q=meditation&limit=25" -H "Authorization: Bearer $REDDAPI_API_KEY"` |

---

## 出力形式その 1：trends/YYYY-MM-DD.json（トレンドのみ・投稿しない）

他アカウントのバズった「そのままの hook」と、source・trendContext・pattern・**analysis**（なぜバズったか）を書く。**platform 配列は不要**（source で十分）。

```json
{
  "date": "2026-02-14",
  "source": "trend-hunter",
  "trends": [
    {
      "id": "tr-001",
      "hook": "I tried meditating for 30 days and here's what happened to my anxiety",
      "source": "tiktok",
      "trendContext": "TikTok で「30日チャレンジ＋不安の変化」系が伸びている。睡眠・瞑想ジャンルで再生数高い。",
      "pattern": "[習慣] + [30日] → 試した → 結果が変わった",
      "category": "meditation",
      "analysis": "30日という具体数字と「不安が変わった」という before/after が明確で、クリックされやすい。TikTok の短尺と相性が良い。"
    },
    {
      "id": "tr-002",
      "hook": "10 minute guided meditation for beginners",
      "source": "reddit",
      "trendContext": "r/meditation で初心者向け短尺ガイドがトレンド。10分という長さが「手軽」として受けている。",
      "pattern": "[時間] + [初心者向け] → 手軽さが売り",
      "category": "meditation",
      "analysis": "10分という具体的な時間と「初心者向け」が検索・シェアされやすい。Reddit では実用性が評価されやすい。"
    }
  ]
}
```

- **source（各要素）:** `"x"` \| `"tiktok"` \| `"reddit"`
- **trendContext:** そのトレンドがどこで・なぜ起きているかの要約（1〜2文）。
- **pattern:** 再現用の短い型。例: `"[彼氏] + [疑い] → 一緒に試した → 反応が変わった"`
- **analysis:** なぜバズったかの簡潔な理由（構成・数字・感情フック・プラットフォーム特性など）。

---

## 出力形式その 2：hooks/YYYY-MM-DD.json（Blotato に schedule する 1 本）

トレンドを元に **投稿 1 本** を書く。X 用 **postText** は **実際に X に載せる 1 ツイート**（**280 文字以内**）。TikTok 用 **caption** は長くてよい（最大 2200 文字）。**reasons** は具体的に（どの tr-xxx、どの pattern を参考にしたか）。**listStyle** を使う場合は「〇〇する４つの方法」「〇〇を減らす４つの工夫」のようなリスト型タイトルを入れる。

```json
{
  "date": "2026-02-14",
  "slot": "9am",
  "scheduledTime": "2026-02-14T09:00:00+09:00",
  "entries": [
    {
      "id": "hook-001",
      "platform": "x",
      "postText": "30日瞑想してみた。不安に実際に起きたこと。",
      "reasons": ["tr-001 の pattern「[習慣]+[30日]→結果が変わった」を採用", "anxiety は 13 ProblemType と直結しターゲットが明確"]
    },
    {
      "id": "hook-001",
      "platform": "tiktok",
      "caption": "30日瞑想で不安が変わった。何が起きたか。 #meditation #mindfulness",
      "imageUrl": "https://example.com/gen/2026-02-14-9am.png",
      "reasons": ["tr-001 の trendContext を踏まえ短くフック", "TikTok は caption 長め可のためハッシュタグ追加"]
    }
  ],
  "listStyle": "完璧主義の苦しみを減らす４つの工夫"
}
```

- **postText:** **実際に X に投稿する 1 ツイート**。280 文字以内。スレッド番号（1/3 等）や URL は含めず、その 1 本だけで完結する・そのまま投稿できる文にする。アカウント言語に合わせて日本語または英語で書く。
- **caption:** TikTok 用。最大 2200 文字まで可。ハッシュタグ・改行可。
- **reasons:** どの `tr-xxx` のどの pattern / trendContext を参考にしたか、具体的に書く。
- **listStyle（任意）:** リスト型タイトルの例。「完璧主義の苦しみを減らす４つの工夫」「スマホ依存から抜け出す４つの方法」など。プロンプトでこのスタイルを指定したときにここに書く。

**postText の実例（そのまま X に載せる想定）:**  
- 英語: "I meditated for 30 days. Here’s what actually changed for my anxiety."  
- 日本語: "30日瞑想してみた。不安に、実際に起きたこと。"

---

## SKILL.md 用プロンプト全文（trends と hooks・日本語・例付き）

以下を LLM に渡して trends と hooks を生成させる。

---

### トレンド出力（trends/YYYY-MM-DD.json）用プロンプト

「あなたが、X / TikTok / Reddit から取得した生のトレンド候補を、次のルールで **trends/YYYY-MM-DD.json** 用の JSON にまとめよ。

- 各要素に必ず含める: id（tr-001 形式）, hook（そのままの文言）, source（x|tiktok|reddit）, trendContext（そのトレンドがどこで・なぜ起きているか 1〜2 文）, pattern（再現用の短い型）, category, **analysis**（なぜバズったか。構成・数字・感情フック・プラットフォーム特性を簡潔に）。
- **platform 配列は使わない。** source で十分。
- 投稿はまだ生成しない。発見したトレンドの記録のみ。」

**例（1 件）:**  
hook: "I tried meditating for 30 days and here's what happened to my anxiety"  
source: "tiktok"  
trendContext: "TikTok で「30日チャレンジ＋不安の変化」系が伸びている。"  
pattern: "[習慣] + [30日] → 試した → 結果が変わった"  
analysis: "30日という具体数字と before/after が明確でクリックされやすい。"

---

### 投稿 1 本生成（hooks/YYYY-MM-DD.json）用プロンプト

「上記 trends のうち 1 本を選び、**hooks/YYYY-MM-DD.json** 用の投稿を 1 本生成せよ。

- **X 用 postText:** 実際に X に載せる **1 ツイート**。**280 文字以内**。スレッドの 1 本目としても単体としても成立する文にする。例: 「30日瞑想してみた。不安に実際に起きたこと。」
- **TikTok 用 caption:** 長くてよい（最大 2200 文字）。ハッシュタグ・改行可。例: 「30日瞑想で不安が変わった。何が起きたか。 #meditation #mindfulness」
- **reasons:** どの tr-xxx のどの pattern / trendContext を参考にしたか、具体的に書く。例: 「tr-001 の pattern を採用」「anxiety は 13 ProblemType と直結」
- **listStyle（使う場合）:** リスト型タイトルの例を 1 つ書く。例: 「完璧主義の苦しみを減らす４つの工夫」「スマホ依存から抜け出す４つの方法」。本文がリスト形式でない場合は省略可。」

**リスト型タイトル例（プロンプトに含めること）:**  
- 完璧主義の苦しみを減らす４つの工夫  
- スマホ依存から抜け出す４つの方法  
- 不安を和らげる４つの習慣  

---

## 入力
- cron 起動時: ops（proposals / steps）経由で proposal が自動作成される。
- 手動: `workspace/ops/proposals.json` に `skillName: "trend-hunter"`, `steps: [{ kind: "run_trend_scan" }]` を追加。

## 失敗時処理
- 429/5xx: リトライ（最大3回）または DLQ。
- クレジット枯渇: ops event + Slack（24h 重複抑止）。

## 禁止事項
- 送信（投稿）しない。収集と 2 種類の JSON 保存のみ。
- Railway に hook/trend を保存しない。

## Cron
`0 */4 * * *` (4時間ごと)。Blotato への schedule は **別 cron**（例: 8:55 / 20:55 に当日 hooks を読んで 9:00 / 21:00 に 1 本ずつ登録）。
