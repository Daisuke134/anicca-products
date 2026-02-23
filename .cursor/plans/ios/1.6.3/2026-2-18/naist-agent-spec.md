# NAIST Agent — 完全仕様書

**作成日**: 2026-02-22
**最終更新**: 2026-02-22（ClawHub調査完了・UX詳細追加）
**ステータス**: 計画中（実装未着手）
**目的**: NAISTの全学生が、Slackチャットだけで大学関連の全タスク（履修・課題・メール・研究・ファンド申請）を完全自動化できるシステム。OpenClawスキルとしてOSS公開。

---

## 概要（What & Why）

| 項目 | 内容 |
|------|------|
| What | NAIST学生向けAIエージェント。`#ai` チャンネルに話しかけるだけで全て完了 |
| Why | 大学院生の雑務（メール確認・履修登録・課題提出・科研費申請）は全て自動化可能。研究に集中させる |
| 誰が動かすか | **Anicca（Mac Mini上のOpenClaw）** が全ユーザーを一括管理 |
| OSS公開先 | `Daisuke134/anicca-products` + ClawHub |
| 技術スタック | OpenClaw + Playwright + gog CLI + arxiv + notion-cli-agent + Slack API |

---

## ClawHub調査結果（2026-02-22）

`clawhub search` で調査済み。以下が最終採用決定。

| 検索キーワード | 採用スキル | 判定理由 |
|--------------|-----------|---------|
| email | なし（既存流用） | `roundcube-webmail-skill` が SAML+TOTP 対応で上位互換 |
| calendar | なし（既存流用） | `gcal-digest`（Mac Mini既存）が gog CLI ベースで完成済み |
| approval | **`request-approval` v1.0.0** | Slack承認wait-stateのベスト実装。Preloop製 |
| research paper | **`arxiv` v1.0.4** | arXiv APIベースで精度高。x-researchより論文に特化 |
| notion wiki | **`notion-cli-agent` v1.0.0** | Notion CLI経由でゼミWiki更新に最適 |
| reminder | **`quick-reminders` v1.1.4** | macOS Reminders統合。締切トラッカーのベース |
| university portal | なし | NAIST固有のSAML認証。自作必須 |
| scraping | なし（既存流用） | `roundcube-webmail-skill` の Playwright パターンをコピー |

**変更点（旧仕様との差分）**:

| 項目 | 旧 | 新 |
|------|----|----|
| 論文検索 | `latest-papers`（x-researchベース） | **`arxiv` v1.0.4**（ClawHub）+ x-research の2段構え |
| ゼミWiki | 未定 | **`notion-cli-agent`**（ClawHub） |
| 締切リマインダー | カスタム実装 | **`quick-reminders`**（ClawHub）ベース |

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│              NAIST AGENT (Anicca / Mac Mini)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cron Jobs（任意・ユーザーが明示的に有効化）│  On-Demand (Slack Chat)        │
│  ──────────────────────────────────────  │  ─────────────────────         │
│  デフォルト: 全て無効                      │  User → #ai-<name>             │
│  「毎朝メールを通知して」で有効化           │   └ Anicca 応答                 │
│  09:00 naist-mail    ← ユーザーが有効化   │                                 │
│  09:05 naist-calendar ← ユーザーが有効化  │  Approval Flow:                │
│  09:10 naist-papers  ← ユーザーが有効化   │  Anicca提案                    │
│  09:25 naist-metrics      │   → [送信する][キャンセル]       │
│  23:00 deadline-check     │   → 承認 → 実行                  │
│  Weekly: naist-wiki       │                                 │
│                           │                                 │
├─────────────────────────────────────────────────────────────┤
│  Skills                                                     │
│  ├── naist-mail          (roundcube-webmail-skill コピー)   │
│  ├── naist-calendar      (gcal-digest コピー)               │
│  ├── naist-papers        (arxiv ClawHub 新規)               │
│  ├── naist-deadline      (quick-reminders ClawHub ベース)   │
│  ├── naist-portal        (Playwright 新規)                  │
│  ├── naist-funds         (firecrawl + arxiv 新規)           │
│  ├── naist-wiki          (notion-cli-agent ClawHub 新規)    │
│  ├── naist-events        (firecrawl + gcal 新規)            │
│  ├── naist-qa            (OpenClaw LLM 新規)                │
│  ├── naist-thesis        (arxiv + LLM 新規)                 │
│  ├── naist-metrics       (tiktok-scraper 既存)              │
│  └── naist-onboarding    (Slack API 新規)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## ユーザー体験（UX）— 全スキル詳細

### Skill 1: naist-mail（毎朝09:00 自動 + オンデマンド）

**ベース**: `roundcube-webmail-skill`（Mac Mini既存・完全流用）

**24/7 自動体験（ダイスは何もしない）**:
```
[09:00 JST] Aniccaが #ai-dais に自動投稿

📬 NAISTメール 本日の未読（3件）

[1] Re: 研究室輪講スケジュール変更
    from: yamada-sensei@is.naist.jp  /  2時間前

[2] 【締切3日】JST研究費申請書提出のお願い
    from: soumu@naist.jp  /  昨日 17:30

[3] DC1採択通知について（重要）
    from: gakusei@naist.jp  /  昨日 14:05

全文を読むには「メール1を読んで」と言ってください。
```

**オンデマンド（チャット操作）**:
```
ダイス: 「メール2を読んで」
→ Anicca: 本文全文を展開

ダイス: 「山田先生にメール2を返信して。来週月曜が都合いいです、と」
→ Anicca: 返信内容を確認してください:
          宛先: yamada@is.naist.jp
          本文: お世話になっております。来週月曜日が
                都合よろしい状況でございます...

          [送信する] [編集する] [キャンセル]

→ ダイス: [送信する]
→ Anicca: ✅ 返信を送信しました
```

| 項目 | 値 |
|------|-----|
| ツール | `roundcube-webmail-skill`（Playwright + SAML + TOTP + otplib） |
| 承認 | `request-approval`（ClawHub）+ Block Kit buttons |
| cron | `0 9 * * *`（毎朝09:00 JST） |

---

### Skill 2: naist-calendar（毎朝09:05 自動 + オンデマンド）

**ベース**: `gcal-digest`（Mac Mini既存・完全流用）

**24/7 自動体験**:
```
[09:05 JST] Aniccaが #ai-narita に自動投稿

📅 本日 2/22（土）のスケジュール

09:30  輪講（D207）
13:00  指導教員ミーティング（Zoom: meet.google.com/xxx）
17:00  〆切: プログレスレポート提出

📅 明日 2/23（日）
→ 予定なし
```

**オンデマンド**:
```
成田さん: 「来週月曜10時に論文ゼミを追加して、場所はD207」
→ Anicca: ✅ Googleカレンダーに追加しました
          2/24（月）10:00 論文ゼミ @ D207
```

| 項目 | 値 |
|------|-----|
| ツール | `gcal-digest`（gog CLI経由） |
| cron | `5 9 * * *`（毎朝09:05 JST） |

---

### Skill 3: naist-papers（毎朝09:10 自動 + オンデマンド）

**ベース**: `arxiv` v1.0.4（ClawHub）— 旧: latest-papers（x-researchのみ）から変更

**24/7 自動体験**:
```
[09:10 JST] Aniccaが #ai-dais に自動投稿

📄 昨日の新着論文（arXiv cs.AI + cs.LG）

[1] "Efficient Attention Mechanisms for Long-Context NLP"
    著者: Chen et al.  |  arXiv: 2402.xxxxx
    要約: Transformerの注意機構を改善し、10Kトークン以上の
          長文処理でFlash Attentionより20%高速化を達成...
    💡 ダイスの研究テーマ「長文理解」と関連度: 高

[2] "Self-Supervised Learning without Data Augmentation"
    著者: Kim et al.  |  arXiv: 2402.xxxxx
    要約: データ拡張なしでSSLを実現する手法を提案...
    💡 輪講で取り上げ候補

「論文1を要約して」「論文1のbibtexをコピーして」で追加操作可能。
```

**オンデマンド**:
```
ダイス: 「マインドワンダリングの最新論文を5本まとめて」
→ Anicca: arXivとX(Twitter)を横断検索...
           [5本の要約リスト]
```

| 項目 | 値 |
|------|-----|
| ツール | `arxiv` v1.0.4（ClawHub、新規採用）+ x-research（X/Twitter補完） |
| cron | `10 9 * * *`（毎朝09:10 JST） |

---

### Skill 4: naist-deadline（締切トラッカー、オンデマンド登録 + cron通知）

**ベース**: `quick-reminders` v1.1.4（ClawHub）

**登録体験**:
```
成田さん: 「3月15日締切でDC1の申請書を追加して」
→ Anicca: ✅ 登録しました
           リマインダー設定:
           - 3/8  (7日前)  → 最初のリマインド
           - 3/12 (3日前)  → 2回目
           - 3/14 (前日)   → 最終警告
           - 3/15 09:00    → 締切当日通知
```

**cron通知体験（成田さんは何もしない）**:
```
[3/8 09:00] Aniccaが #ai-narita に自動投稿

🔔 締切アラート（7日前）

📋 DC1申請書 — 残り7日
締切: 2026年3月15日

「進捗報告」で今の状態を記録できます。
「申請書の作成を手伝って」でnaist-researcherが起動します。
```

| 項目 | 値 |
|------|-----|
| ツール | `quick-reminders`（ClawHub、新規採用）+ cron |
| cron | `0 9 * * *` 全締切を毎日チェック |

---

### Skill 5: naist-portal（新規、オンデマンド）

**技術**: Playwright + SAML + TOTP（`roundcube-webmail-skill` と同じ認証パターン）

**体験**:
```
ダイス: 「今学期の時間割を見せて」
→ Anicca: 🔐 NAISTポータルにログイン中...
           ✅ ログイン完了

           📖 2026年春学期 時間割

           月  09:30  機械学習特論（A201）
           火  13:00  分散システム論（D302）
           木  10:00  研究ゼミ（指導教員室）
           金  14:00  輪講（D207）

ダイス: 「情報倫理学を履修登録して」
→ Anicca: 確認します:
           科目: 情報倫理学（2単位）
           担当: 鈴木教授
           曜日: 水曜 15:00-16:30

           [登録する] [キャンセル]

→ ダイス: [登録する]
→ Anicca: ✅ 履修登録が完了しました
```

| 項目 | 値 |
|------|-----|
| ツール | Playwright + otplib + macOS Keychain |
| 承認 | 全操作で `request-approval` または Block Kit buttons |

---

### Skill 6: naist-funds（毎週月曜・木曜09:15 自動 + オンデマンド）

**ベース**: Firecrawl CLI + `arxiv`（新規）

**24/7 自動体験**:
```
[月曜 09:15 JST] Aniccaが #ai-dais に自動投稿

💰 今週の奨学金・研究費情報

[1] 情報処理学会 研究奨励賞  ← NEW
    締切: 3月31日  |  対象: 学生会員
    申請: ipsj.or.jp/...

[2] JST ACT-X（若手研究者支援）
    締切: 4月15日  |  金額: 300万円/2年
    分野: 情報科学

「これを申請手順リストにして」で詳細を展開。
「DC1申請書を書いて」でnaist-researcherが起動。
```

| 項目 | 値 |
|------|-----|
| ツール | Firecrawl CLI（JSPS / JST / jfund.or.jp）+ x-research（X検索） |
| cron | `15 9 * * 1,4`（月・木09:15 JST） |

---

### Skill 7: naist-wiki（毎週月曜 + オンデマンド）

**ベース**: `notion-cli-agent` v1.0.0（ClawHub、新規採用）

**オンデマンド体験**:
```
成田さん: 「今日の輪講まとめをwikiに追加して。
           発表者:成田。論文:Efficient Attention。
           要点:Flash Attentionより20%高速、メモリ半減。
           次回担当:田中」

→ Anicca: Notionの「輪講記録」ページに以下を追加しますか？

           日付: 2026-02-22
           発表者: 成田
           論文: Efficient Attention Mechanisms...
           要点: Flash Attentionより20%高速, メモリ半減
           次回担当: 田中

           [追加する] [編集する]

→ 成田さん: [追加する]
→ Anicca: ✅ Notionの輪講記録に追加しました
           👉 https://notion.so/...
```

| 項目 | 値 |
|------|-----|
| ツール | `notion-cli-agent`（ClawHub、新規採用） |

---

### Skill 8: naist-events（毎週月曜09:20 自動）

**ベース**: Firecrawl CLI + `gog-calendar`（新規）

**24/7 自動体験**:
```
[月曜 09:20 JST] Aniccaが #ai-narita に自動投稿

📢 今週のNAISTイベント

[1] 招待講演: 東大 山本教授「LLMの可能性と限界」
    日時: 2/25（火）15:00-17:00  |  場所: 大講義室
    参加: 自由（事前申込不要）

[2] 学生研究発表会
    日時: 2/28（金）13:00-17:00  |  場所: D棟

「イベント1をカレンダーに追加して」で即座に登録可能。
```

| 項目 | 値 |
|------|-----|
| ツール | Firecrawl CLI（naist.jp/events/）+ `gog-calendar` |
| cron | `20 9 * * 1`（毎週月曜09:20 JST） |

---

### Skill 9: naist-qa（オンデマンド）

**ベース**: OpenClaw LLM（Anthropic Claude）+ Firecrawl CLI

**体験**:
```
成田さん: 「DC1の申請って日本語で書くべき？英語？」

→ Anicca: DC1申請書について:

           ✅ 日本語が標準です。

           根拠:
           • 審査員は日本語ネイティブの研究者が多数
           • 英語も可能だが、日本語の方が評価のブレが少ない
           • JSPSガイドラインでも日本語を推奨

           「採択された申請書の書き方のコツを教えて」で
           追加情報を取得できます。
```

| 項目 | 値 |
|------|-----|
| ツール | OpenClaw LLM + Firecrawl CLI（NAIST公式・JSPS等） |

---

### Skill 10: naist-thesis（オンデマンド）

**ベース**: OpenClaw LLM + `arxiv`（新規）

**体験**:
```
ダイス: 「thesis.texの第3章を校正して」

→ Anicca: 第3章「提案手法」を校正しました（23箇所）

           重要な指摘:
           [1] p.47 "we propose" → "This thesis proposes"
               （一人称禁止）
           [2] p.52 参考文献 [Chen2023] が本文中で引用されていない
           [3] p.55 図3.4のキャプションが不完全

           📊 可読性スコア: 73/100（前回比 +5）
           文字数: 12,847語（目標20,000語まで: 7,153語不足）

           「[1]を全自動修正して」で一括修正可能。
```

| 項目 | 値 |
|------|-----|
| ツール | OpenClaw LLM + `arxiv`（参考文献検索）+ Firecrawl CLI |

---

### Skill 11: naist-metrics（毎朝09:25 自動）

**ベース**: `tiktok-scraper`（Mac Mini既存）

**24/7 自動体験（ダイス専用）**:
```
[09:25 JST] Aniccaが #ai-dais に自動投稿

📊 TikTok昨日のパフォーマンス

再生数: 12,847 (+23% vs 前日)
フォロワー増: +48
コメント: 23件（ポジ: 89%）
最高動画: 「AIエージェントの使い方」(45k再生)

X(Twitter):
インプレッション: 8,420 / いいね: 127

💡 Anicca考察: 「AIエージェント系」コンテンツが今週好調。
   明日の投稿テーマ提案: 「OpenClawの活用法」
```

| 項目 | 値 |
|------|-----|
| ツール | `tiktok-scraper`（既存）+ `twitter-automation` |
| cron | `25 9 * * *`（毎朝09:25 JST） |

---

### Skill 12: naist-onboarding（新規、オンデマンド）

**新規ユーザーが参加したときの体験**:

**設計原則**: 構造化されたセットアップウィザードは起動しない。Aniccaは普通に話しかける。credentialsは必要になった瞬間に初めて聞く。cronはデフォルト無効。ユーザーが「毎朝通知して」と言って初めて有効化する。

```
[#anicca チャンネル]

成田さん: @Anicca make my channel

→ Anicca: ✅ #ai-narita 作ったよ！そっちで話しかけて。

[#ai-narita チャンネルに移動]

Anicca: yo 👋

成田さん: 「何ができるの？」

Anicca: メール読んだり、カレンダー確認したり、
        最新論文まとめたり、Notionに議事録書いたり、
        締切リマインドしたり。

        まず何か試してみる？

─────（NAISTアカウントが必要な機能を初めて使うとき）─────

成田さん: 「未読メール見せて」

Anicca: NAISTのアカウント情報が必要。
        IDとパスワードをDMで送ってくれたら繋ぐ。
        （送ったらすぐ消すね）

成田さん: [DM: s2410023 / p@ssword123]

→ Anicca: ✅ 受信しました。安全に保存しています...
           メッセージを削除しました。

成田さん: [QRコードスクショ送信]

→ Anicca: ✅ TOTPシークレットを抽出・保存しました。
           メッセージを削除しました。

成田さん: 「マインドワンダリング、EEG、注意制御」

→ Anicca: ✅ 完了。じゃあメール見てくるね…

           📬 未読メール（3件）
           …
```

| 項目 | 値 |
|------|-----|
| ツール | Slack API（conversations.create / invite / delete）+ macOS Keychain |

---

## Cron（任意）— ユーザーが明示的に有効化するまで無効

**デフォルトは全cron無効。ユーザーがチャットで「毎朝〜して」と言ったときに初めて有効化する。**

```
成田さん: 「毎朝メール通知して」
→ Anicca: ✅ 毎朝09:00に通知するようにした。

成田さん: 「毎日論文も送って」
→ Anicca: ✅ 毎朝09:10にarXiv新着を送るようにした。

成田さん: 「やっぱり論文はいらない」
→ Anicca: ✅ 止めた。
```

**有効化できるcron一覧（ユーザーが選ぶ）**:

| 有効化の言い方（例） | スキル | 時刻 |
|--------------------|--------|------|
| 「毎朝メールを通知して」 | naist-mail | 09:00 JST |
| 「毎日スケジュールを送って」 | naist-calendar | 09:05 JST |
| 「毎日論文を送って」 | naist-papers | 09:10 JST |
| 「毎週奨学金情報を送って」 | naist-funds | 月・木 09:15 JST |
| 「毎週イベント情報を送って」 | naist-events | 月 09:20 JST |
| 「毎朝メトリクスを送って」 | naist-metrics | 09:25 JST |

---

## 承認フロー（Approval）

### 採用する承認パターン（優先順位順）

| # | パターン | いつ使う | 実装 |
|---|---------|---------|------|
| 1 | **チャット直接実行** | ユーザーが明示的に指示した場合 | 設定不要。デフォルト |
| 2 | **request-approval（ClawHub）** | 承認wait-stateが必要な場合 | `clawhub install request-approval` |
| 3 | **Block Kit Buttons** | メール返信・履修登録等の重要操作 | `openclaw.json` + Slack API |
| 4 | **Emoji Reaction（👍/👎）** | 軽量な確認が必要な場合 | Slack reactions.get でポーリング |

Source: https://github.com/openclaw/openclaw/pull/2124 + https://lobehub.com/skills/openclaw-skills-request-approval

### Block Kit 実装テンプレート

```javascript
const blocks = [
  {
    type: "section",
    text: { type: "mrkdwn", text: "*📧 メール返信*\n宛先: 山田教授\n本文:\n```" + replyText + "```" }
  },
  {
    type: "actions",
    block_id: "naist_approval",
    elements: [
      { type: "button", action_id: "allow_once", text: { type: "plain_text", text: "✅ 送信する" }, style: "primary" },
      { type: "button", action_id: "deny", text: { type: "plain_text", text: "❌ キャンセル" }, style: "danger" }
    ]
  }
];
// allow_once → 実行 → chat.update で「✅ 送信しました」
// deny → chat.update で「❌ キャンセルしました」
```

---

## スキル一覧（フェーズ別）

### Phase 1: 即実装（既存スキルのコピー/改変）

| # | スキル名 | ベース | 変更点 |
|---|---------|--------|--------|
| 1 | `naist-mail` | `roundcube-webmail-skill` | ユーザーごとのcredentials対応 |
| 2 | `naist-calendar` | `gcal-digest` | ユーザー別gogアカウント対応 |
| 3 | `naist-papers` | `arxiv`（ClawHub） | 研究テーマをユーザー別に設定 |
| 4 | `naist-onboarding` | Slack API（新規） | チャンネル作成 + 初期設定フロー |

### Phase 2: NAIST固有（新規作成）

| # | スキル名 | 技術 | 内容 |
|---|---------|------|------|
| 5 | `naist-portal` | Playwright + SAML | 履修・成績・未提出物取得 |
| 6 | `naist-deadline` | `quick-reminders`（ClawHub） | 締切7日前・3日前・前日・当日通知 |

### Phase 3: 研究支援（ClawHub or 新規）

| # | スキル名 | ベース | 内容 |
|---|---------|--------|------|
| 7 | `naist-funds` | Firecrawl CLI + x-research（新規） | 科研費・外部ファンド週次通知 |
| 8 | `naist-wiki` | `notion-cli-agent`（ClawHub） | 研究Notion/ゼミWiki更新 |
| 9 | `naist-events` | Firecrawl CLI + gog-calendar（新規） | NAISTイベント週次通知 + カレンダー登録 |
| 10 | `naist-qa` | OpenClaw LLM（新規） | 大学事務・研究相談 |
| 11 | `naist-thesis` | arxiv + LLM（新規） | 論文校正・参考文献整理 |

### Phase 4: 分析・拡張

| # | スキル名 | ベース | 内容 |
|---|---------|--------|------|
| 12 | `naist-metrics` | `tiktok-scraper`（既存） | TikTok/Xパフォーマンス（ダイス専用） |

---

## 多ユーザー管理

### credentialsストレージ構造

```
/Users/anicca/.openclaw/workspace/naist-agent/users/
├── narita/
│   ├── config.json         ← Slack channel ID、研究テーマ等
│   └── gog-account.json    ← Gmail/Calendar アカウント
├── tanaka/
│   ├── config.json
│   └── gog-account.json
└── ...
```

### config.json 形式

```json
{
  "naist_id": "s2310001",
  "slack_channel_id": "C123ABC456",
  "slack_user_id": "U987DEF012",
  "naist_mail_url": "https://mailbox.naist.jp/roundcube/",
  "totp_secret": "KEYCHAIN:naist-narita-totp",
  "password": "KEYCHAIN:naist-narita-password",
  "research_topics": ["mind wandering", "EEG neurofeedback", "attention control"],
  "research_topics_ja": ["マインドワンダリング", "脳波ニューロフィードバック"]
}
```

**TOTP・パスワードは macOS Keychain に保存（平文禁止）**:
```bash
security add-generic-password -a "naist-narita" -s "WEBMAIL_PASSWORD" -w "パスワード"
security add-generic-password -a "naist-narita" -s "WEBMAIL_TOTP_SECRET" -w "base32シークレット"
```

---

## セキュリティリスク一覧

| # | リスク | 深刻度 | 対策 |
|---|--------|--------|------|
| 1 | NAISTパスワード・TOTPシークレットの平文保存 | CRITICAL | macOS Keychain必須（`security add-generic-password`）。config.jsonに平文禁止 |
| 2 | `.session.json`（Playwright認証セッション）が実行後も残存 | HIGH | `finally { fs.unlinkSync(SESSION_FILE) }` で自動削除 |
| 3 | OpenClaw `.env` をgitにコミットするリスク | CRITICAL | `.gitignore`確認。`.env.example`のみgit管理 |
| 4 | Slack DMで受け取ったcredentialsが残る | HIGH | `chat.delete` APIで受信後即削除 |
| 5 | `notion-cli-agent`（ClawHub製）の信頼性不明 | MEDIUM | SKILL.mdを読んでから使用。Notion APIキーをKeychainで管理 |
| 6 | `arxiv`スキルが想定外の通信を行う可能性 | LOW | arXiv APIはpublic。SKILL.mdを確認してから採用 |
| 7 | 複数ユーザーのKeychain情報が同一Mac Miniに混在 | HIGH | per-userのKeychainアカウント名で分離（`naist-<username>`） |
| 8 | Playwright認証情報がメモリに残る | MEDIUM | ブラウザを非持続モードで起動。実行後 `browser.close()` 必須 |
| 9 | あるユーザーが他ユーザーのチャンネルにアクセス | HIGH | Anicca は自分の `#ai-<name>` チャンネルのみアクセス。bindings設定で分離 |

**最優先対策**: NAISTパスワードとTOTPをKeychain移行。`setup-keychain.sh`（`roundcube-webmail-skill` v2に存在）をテンプレートとして使用。

---

## 実装順序（MUST）

| # | タスク | 依存 | 状態 |
|---|--------|------|------|
| 1 | naist-onboarding スキル作成（Slack API） | なし | ⏳ |
| 2 | naist-mail スキル作成（roundcube-webmail-skill コピー） | 1 | ⏳ |
| 3 | naist-calendar スキル作成（gcal-digest コピー） | 1 | ⏳ |
| 4 | `clawhub install arxiv` → naist-papers スキル作成 | 1 | ⏳ |
| 5 | Phase 1 テスト（ダイス自身で全スキルをテスト） | 1-4 | ⏳ |
| 6 | NAIST #ai チャンネルで告知 | 5 | ⏳ |
| 7 | `clawhub install quick-reminders` → naist-deadline 作成 | 5 | ⏳ |
| 8 | naist-portal スキル作成（Playwright新規） | 5 | ⏳ |
| 9 | naist-funds スキル作成（Firecrawl新規） | 5 | ⏳ |
| 10 | `clawhub install notion-cli-agent` → naist-wiki 作成 | 5 | ⏳ |
| 11 | naist-events スキル作成 | 5 | ⏳ |
| 12 | naist-qa / naist-thesis スキル作成 | 5 | ⏳ |
| 13 | ClawHub に公開（`clawhub publish naist-agent`） | 全 | ⏳ |

---

## 境界（やらないこと）

| やらないこと | 理由 |
|------------|------|
| 論文投稿・学会発表の自動化 | 研究成果は人間が判断するべき |
| VPN/内部ネットワーク対応 | Tailscaleで回避可能（Mac Mini使用） |
| 複数大学対応（v1） | まずNAISTのみ。汎用化は後 |
| バックエンドAPIサーバー | Mac Mini + OpenClaw のみ。Railwayは不要 |
| モバイルアプリ | Slackがインターフェース |
| 勝手な課題提出・メール返信 | 全操作でユーザー承認必須 |
| Slack以外の通知（SMS/メール等） | Slackに集約 |

---

## OSS公開戦略

| チャネル | 対象 | 方法 |
|---------|------|------|
| GitHub OSS | NAISTのエンジニア学生 | `Daisuke134/anicca-products/skills/naist-agent/` |
| ClawHub | OpenClawユーザー全般 | `clawhub publish naist-agent` |
| NAIST Slack #ai | NAIST Slack全員 | 完成後に告知投稿 |

### インストール方法

```bash
# OpenClawユーザー
clawhub install naist-agent

# Claude Codeユーザー
git clone https://github.com/Daisuke134/anicca-products
cp -r anicca-products/skills/naist-agent ~/.openclaw/skills/
```

### NAIST Slack告知文（完成後）

```
🤖 NAIST AIエージェント、ベータ公開！

Slackだけで大学の雑務を全部やってくれます。

できること:
• 毎朝09:00 未読メールを要約してSlack通知
• メール返信を承認するだけで自動送信
• 授業スケジュールをGoogleカレンダーに自動登録
• 締切7日前・3日前・前日に自動リマインド
• 研究分野の最新arXiv論文を毎日要約
• 科研費・奨学金の申請情報を毎週お届け
• NAISTイベント・セミナーを毎週月曜に告知
• ゼミWiki（Notion）を音声メモ感覚で更新

使い方: #ai チャンネルに「こんにちは！[名前]です」と投稿するだけ。
セットアップは5分。パスワードはMac Miniのローカルに保存。外部送信なし。

Source: https://github.com/Daisuke134/anicca-products
```

---

## 参照スキル（Mac Mini既存）

| スキル名 | パス | 参照目的 |
|---------|------|---------|
| `roundcube-webmail-skill` | `/Users/anicca/.openclaw/skills/roundcube-webmail-skill/` | SAML認証・メール操作・Keychainパターン |
| `gmail-digest` | `/Users/anicca/.openclaw/skills/gmail-digest/` | gog CLI パターン |
| `gcal-digest` | `/Users/anicca/.openclaw/skills/gcal-digest/` | Google Calendar パターン |
| `tiktok-scraper` | `/Users/anicca/.openclaw/skills/tiktok-scraper/` | SNSメトリクスパターン |

## ClawHubからインストールするスキル（実装時）

| スキル | コマンド | 用途 |
|--------|---------|------|
| arxiv | `clawhub install arxiv` | 論文検索 |
| request-approval | `clawhub install request-approval` | Slack承認フロー |
| notion-cli-agent | `clawhub install notion-cli-agent` | ゼミWiki更新 |
| quick-reminders | `clawhub install quick-reminders` | 締切リマインダー |
