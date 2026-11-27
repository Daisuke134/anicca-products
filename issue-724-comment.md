## `/lm/newsletter` — Phase 1 LP＋オンボーディング 実装完了（@pickle, 2026-11-27 17:05 JST）

10:32以降、担当からの応答が5時間なかったため、**オーナー指示（15:21 JST）により @pickle が `/lm/newsletter` の実装を直接実行**しました。あわせて 15:38 / 15:47 の追加指示（Data Lab 統合・3段階ロードマップ・@grok への X 発信指示）を本 Issue とチーム共有へ反映済みです。

### 成果物
- **PR**: https://github.com/Daisuke134/anicca-products/pull/949 （branch `feat/lm-newsletter`, commit `f11df3c8`）
- 対象: `Daisuke134/anicca-products` の `apps/landing/app/lm/newsletter/`（既存 `/lm` は 1 つのリンク帯を足しただけで維持）
- 公開URL（マージ→Netlify デプロイ後）: **https://aniccaai.com/lm/newsletter**

### 実装内容（Phase 1）
| 項目 | 状態 |
|---|---|
| 3〜5問オンボーディング | ✅ 言語（JA/EN/ES・UI全体が切替）／興味5種（複数選択）／利用環境（スマホのみ・スマホ＋PC）／メール＋登録ボタン |
| 実在サンプルプレビュー | ✅ 5件、締切順。Alignerr（AI Training Specialist `$40–120/hr`・Finance Analyst ES `$25–80/hr`）、UserTesting（`$10`/15–20分、`$4`/5–7分、`$30`/30分）、QuestionPro UX 旧Trymata（`$5–30`/テスト）、dscout（`$25–150`/スタディ）。**各カードに出典リンクと確認日 2026-11-27 を明記**。締切が公開されていない案件は「常時募集」と表示（虚偽の締切を作らない） |
| 無料 / Pro 表示 | ✅ 無料＝週1ダイジェスト／Pro＝毎日全件・締切アラート・言語最適化。**価格は未確定と明記**（@muse 確定後に登録者へ先行案内） |
| 登録バックエンド | ✅ `netlify/functions/lm-newsletter-signup.js`: 入力検証 → Supabase `lm_newsletter_subscribers`（マイグレーション同梱）＋ Netlify Blobs の二重保存 → Resend で言語別ウェルカムメール。`GET /api/newsletter?action=count` で件数のみ確認可 |
| 決済導線 | ⏸ 未接続（Pro 価格が @muse 未確定のため、決済リンクを作らない判断。Stripe 既存導線には接続可能な形で残置） |
| テスト | ✅ `node --test netlify/functions/__tests__/lm-newsletter-signup.test.js` → **10/10 pass**（ローカル実行） |

### 検証と未検証（正直な境界）
- ✅ `node:test` 10件パス、新規 TSX/TS は esbuild でパース通過。
- ⏳ `landing-pr-build`（CI）で `npm run build` を確認中。ローカル sandbox では npm install が NFS 上で完了せず、フル `next build` は未実行。
- ⏳ Netlify 本番デプロイと `https://aniccaai.com/lm/newsletter` の HTTP 200、実フォーム送信の実測は**マージ後に実施**し、この Issue に追記する。

## 追加指示の反映（2026-11-27 15:38 / 15:47 JST）

### 1. Data Lab としての統合位置づけ
本ニュースレター事業（フォロワー獲得・配信基盤）は、**Data Lab 事業（Issue #715: Google Drive 録音データ等の自社生成データ直販／データブローカー）と一体の戦略**として位置づけます。「データを生成・販売・ブローカーする側」と「日次ニュースレターでユーザー／供給基盤を獲る側」は分離せず、チーム全員で一体として進めます。

### 2. 3段階ロードマップ（最終プロダクト像）
- **Phase 1（今）**: 日次ニュースレター（言語別・締切順・USD報酬額・直リンク付き）＋コミュニティ（X / Discord）で「doomscrolling 不要・スマホからすぐ動ける」基盤。
- **Phase 2**: エージェントが周辺の面倒（情報収集・整理・進行管理・最適化）を自動化し、Data Lab としてのデータ生成・ブローカー／直販（Google Drive 録音データ等）と接続。
- **Phase 3（最終形のアプリ）**: オンボーディングで**一度 KYC を済ませるだけ**でアプリ内に入り、案件の作業提出〜報酬受取まで**ワンストップ**で完結（人間側の中間摩擦ゼロ、裏側はエージェントが自動化）。

### 3. @grok への明確な指示（X 発信）
- 本ニュースレターと Data Lab の取り組みを **X（`@diceai0` 等の既存アカウント）で発信・投稿**する。
- 指示全文・投稿テンプレ（JA/EN/ES）: `team-outbox/grok/to-grok-2026-11-27-lm-newsletter-datalab-x.md` ／ `team/inbox/grok.md`
- 成果物: `team/client-work/NEWSLETTER-DISTRIBUTION-PLAN.md`（日次投稿カレンダー、初報 11/28 09:00）
- 禁止: 未確定の価格・収益額・転換率の投稿／「必ず稼げる」表現／新規アカウント作成。

### 4. 正本の更新
`team-outbox/pickle/to-team-2026-11-27-flywheel-and-lm-newsletter-strategy.md` に **§10「追記 2026-11-27 15:38 / 15:47」**（Data Lab 統合・3段階ロードマップ・@grok 指示・Phase 1 実装状況）を追記済み（commit `0918a668`）。

## 残工程の引き継ぎ

| 担当 | 残工程 | 期限 |
|---|---|---|
| **@muse** | Pro 価格・プラン確定（`team/playbooks/PAYWALL-PRICING.md` 準拠）→ 確定後に LP の Pro カードの価格と Stripe 決済リンクを差し替え。KPI 定義（無料→有料 ≥2% / 7日継続 ≥40% / クリック率 ≥15%）と計測実装。`NEWSLETTER-BUSINESS-SPEC.md` | 11/28 09:00 |
| **@grok** | X 告知1本目 → 日次投稿カレンダー → `@kosuke_dekasegi` 型研究 → X/Discord コミュニティ参加。`NEWSLETTER-DISTRIBUTION-PLAN.md` | ACK 本日 / 初報 11/28 09:00 |
| **@instinct** | 稼働URL `/lm/newsletter` の確認、Mac mini 常駐 Chrome 側の収集実行、購読1件のテスト受信ログ | 11/27 23:59 |
| **@devin** | 収集→整形（締切・報酬・スマホ可否の抽出）→配信パイプライン。**10件以上・リンク切れ0**を機械検証するテスト込み。Blobs/Supabase の購読者テーブルを配信リストとして読む | 11/28 12:00 |

> 注: 決済（Pro）は @muse の価格確定なしに作らない方針で実装しています。価格が決まれば LP の該当カードと `/api/checkout` 系の既存パターンで 1 コミットで接続できます。
