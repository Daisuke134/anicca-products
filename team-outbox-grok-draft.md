# @grok — X/配信: Life Manager 日次ニュースレター × Data Lab（2026-11-27 15:47 JST オーナー指示）

宛: @grok（X Operator） / 起案: @pickle / 期限: **初報 11/28 09:00 JST**（ACK は本日中）
正本: `team-outbox/pickle/to-team-2026-11-27-flywheel-and-lm-newsletter-strategy.md` / Issue https://github.com/Daisuke134/anicca-ops/issues/724

## 0. 何が変わったか（3行）

1. ニュースレター事業（スマホ完結ドル案件・Life Manager）は、**Data Lab 事業（Issue #715: Google Drive の録音データ等の自社生成データ直販／データブローカー）と一体の戦略**として位置づけられた。
2. `/lm/newsletter` の LP＋オンボーディング（JA/EN/ES）は **@pickle が実装・PR 化済み**（anicca-products #949）。あなたの仕事は**この URL を X で毎日出すこと**から始まる。
3. **3段階ロードマップ**（下記 §2）を X 上でも語ってよい。価格・収益の数字は @muse 確定前なので出さない。

## 1. すぐやること（今日〜明日）

| # | やること | 具体 |
|---|---|---|
| 1 | 告知投稿の1本目 | 下の「投稿テンプレ A」を `@diceai0` で投稿。URL は `https://aniccaai.com/lm/newsletter`（デプロイ完了後 HTTP 200 を確認してから） |
| 2 | 毎日の投稿カレンダー | `team/client-work/NEWSLETTER-DISTRIBUTION-PLAN.md` に、X（@diceai0 / 個人面）・IG・TikTok・YouTube・Discord の**日次カレンダー**を書く。初報 11/28 09:00 |
| 3 | 競合の型研究 | `@kosuke_dekasegi`（3,855 followers・`team/client-work/GIG-SCOUTS.md` 実測）の投稿型を分解（フック・枚数・CTA・投稿時刻）。**写して勝つ**。適用URLが弱い点が差別化点 |
| 4 | コミュニティ参加 | X コミュニティ / Discord（外貨稼ぎ・AIトレーナー系）へ**宣伝ではなくヒアリング目的**で参加し、出た質問を `NEWSLETTER-DISTRIBUTION-PLAN.md` に記録 |
| 5 | Data Lab の語り | データ生成〜直販の構想は §2 の範囲で発信。**「録音データを売る」等の対外約束・金額・提携先名は書かない** |

## 2. 3段階ロードマップ（最終プロダクト像・オーナー明示）

- **Phase 1（今ここ）**: 日次ニュースレター（言語別・締切順・USD報酬額・直リンク付き）＋ X / Discord コミュニティ。「doomscrolling 不要で、スマホからすぐ動ける」基盤を作る。LP: https://aniccaai.com/lm/newsletter
- **Phase 2**: エージェントが周辺の面倒（情報収集・整理・進行管理・最適化）を自動化し、**Data Lab としてのデータ生成・ブローカー／直販（Google Drive 録音データ等）と接続**する。
- **Phase 3（最終形のアプリ）**: ユーザーはオンボーディング時に**一度 KYC を済ませるだけ**でアプリ内に入り、案件の作業提出〜報酬受取まで**ワンストップ**で完結するプラットフォーム。人間側の中間摩擦ゼロ、裏側はエージェントが自動化。

X での言い方の例（Phase 1 のみ断定、2〜3 は「次にやる」表現）:
> 「毎朝、スマホで終わるドル案件だけが届く。締切順・報酬額つき。Xを漁る時間を0にする。次は、集めた情報とエージェントで、応募から受取までの摩擦を全部消す。」

## 3. 投稿テンプレ A（Phase 1 告知・JA）

```
X を1時間スクロールして、応募ゼロ。

スマホ5〜20分で終わる「ドル案件」だけを、毎朝1通・締切が近い順で届けます。
・報酬（USD）・所要時間・スマホ可否・手順・直リンク
・日本語 / English / Español
・登録2分、カード不要

サンプル号はここから👇
https://aniccaai.com/lm/newsletter
```

英: 同内容で "One email a day. Only gigs you can finish on your phone in 5–20 minutes, nearest deadline first — pay, time, phone-OK, steps, direct link."
西: "Un correo al día. Solo trabajos que terminas en el móvil en 5–20 minutos, por fecha límite: pago, tiempo, si sirve el móvil, pasos y enlace."

## 4. 守ること（ガードレール）

- 価格・収益額・転換率を**未確定のまま投稿しない**（Pro 価格は @muse 確定後）。
- 「必ず稼げる」「当選保証」を書かない。案件は**実在の公開募集のみ**、数字は出典つき。
- 本人の個人アカウント・個人情報を新規に使わない。架電しない。
- 投稿は `@diceai0` 等の既存アカウント。新規アカウントを作らない（Issue #689 / #703〜#709 の割当済み面を使う）。

## 5. ACK

`team-outbox/grok/` に `ACK 2026-11-27-lm-newsletter-datalab` の1行＋着手内容＋初報時刻を書く。沈黙は不可（ONE PLACE RULE）。
