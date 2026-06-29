# Coconala 利益ループ設計 (= 稼ぎ切るまでの machine、 2026-06-29)

## Goal (Dais)
ココナラで ★ 実際に円が MUFG に着金する ★ まで回る自律ループ。 「依頼→納品→終わり」 ではなく
★ status を watch し続け、 会話を続け、 信頼を積む ★ = 人が profit してる実プロセスを模倣。

## アカウント (= browser 確認済)
- Coconala = Dais Google login の account「mtdc」 (= keiodaisuke+anicca)。 KYC + MUFG 口座 設定済 (Dais 言明)。
- 公開依頼板 = 112 件 live。 出品 (services) = 要整備。

## BP (= 検索済、 人がどう稼ぐか)
- 出典: ココナラ全国1位 / 月10万 / 実績ゼロ攻略 記事群 (firecrawl 2026-06-29)
- ★ 0→1 = 公開依頼を最優先・24h以内(理想 数時間)に提案 = 早いもの勝ち ★
- ★ ライバル少+低予算 を最初の実績作りに ★ → 評価獲得 → 実績 → 単価上げ + リピート
- ★ 信頼 = 丁寧/速い返信・トーク継続・期待超え納品 → ★高評価★ → 検索上位 → 受注増 (複利)

## 2 つの稼ぎ面
| 面 | 仕組み | AI 適性 |
|---|---|---|
| ① 公開依頼 (active) | 人が依頼投稿 → 提案 → 見積り → 仮払い → 納品 → 評価 | 記事/文字起こし/資料/データ/コード = ✅ |
| ② 出品 (passive) | 自分のサービスを並べ、 買い手が購入 | 出品文 LLM 生成、 売れたら稼働 |

## 末端まで回るループ (= status watch + 会話 + 信頼)
1. WATCH   : 公開依頼板を 30分毎 poll → AI-doable + 新着(<3h) + ライバル少 を抽出
2. PROPOSE : 即・丁寧な提案文 (要件汲取り + 具体手順 + 納期 + 1質問) を送信
3. CONVERSE: トークルームを watch → 返信来たら 即応答 (質問返答/見積り提示)、 信頼構築
4. 仮払い  : 買い手が購入 (仮払い=escrow) → 正式着手
5. DELIVER : 実際に作業 (記事/Word/資料/script) → 自己検証 → 納品
6. REVIEW  : 買い手 検収 → 評価依頼 → ★高評価★ 獲得 → 実績+1
7. REPEAT  : リピート打診 + 出品強化 + 単価↑。 → 1 に戻る (複利)
8. PAYOUT  : 売上金 → MUFG 口座 出金申請 (KYC 済)

## watch engine (= Dais の「keep checking/会話継続」 の核)
- coconala_watch.py (launchd 30min): ① 新規公開依頼 ② トークルーム新着メッセージ ③ 仮払い ④ 評価依頼
  → 全部 gog gmail (coconala 通知) + board poll で検知 → 私(model)が即 会話/納品 を実行
- ★ 1 依頼 = 提案→会話→納品→評価 が閉じるまで状態機械で追う (= 放置しない) ★

## payout 二系統 (= earn-gig 全体)
- JP 円 → Dais MUFG (Coconala/Lancers)
- USDC → AI wallet (LaborX/dealwork/x402)

## verification (= HARD 0.31, 末端まで)
提案=「提案 ID/トーク URL 取得」、 納品=「納品物 + 検収」、 着金=「売上反映 + 出金」 まで verify。 「提案した」で終えない。

## §追記 PPTX 品質 rebuild (2026-06-29, Dais「自分のoutputをverifyしろ+既存skill使え」)
- ★ 自分の v2 output を自分の目で verify → 3 欠陥発見: slide3 薄色on薄色=読めない / slide2 巨大空枠 / 全体地味 ★
- 競合確認: ココナラ PowerPoint 出品 = ¥4,000(Canva)〜¥65,000(プロ)、 polished デザインがバー
- ★ 車輪の再発明やめ、 公式 `pptx` skill (html2pptx: HTML/CSS設計→.pptx) を使用 ★ (Dais 指示)
- 4 slide rebuild: 表紙 / 本日のポイント(実LINEチャート y=80x) / 比例vs反比例(solid header 高コントラスト) / まとめ
- deps install: pptxgenjs react-icons sharp jsdom (global)
- thumbnail で再 verify → 3 欠陥 全解消 確認。 + vcsdd adversary 独立 verify 実行中
- 成果物: artifacts/5121769/ppt_sample.pptx (MD5 934a6281) + slides/*.html + build.js (= 再現可能)

## §追記2 PPTX adversary loop (2026-06-29) — 7-layout kit に拡張
- round-1 adversary FAIL: stale 旧render混在で混乱 + 実 contrast/orange 指摘
- 対応: 旧render全削除(single source) + orange #E8732B 統一 + slide3 dark text
- round-2 adversary FAIL (採用率8%→30%): slide3 に #FF8C42 残骸 / 下部空白 / breadth不足(4枚1レッスン)
- 対応: ① slide3 orange 残骸 fix ② slide3 グラフ行/slide4 番号バッジで空白解消 ③ ★目次・セクション扉・表(実テーブル) 追加 = 7 layout 再利用キット★
- proposal v5: 「実際に納品するテンプレの完成イメージ」 framing + 高コントラスト/配色統一 明記
- 成果物: ppt_sample.pptx (MD5 94822b9, 7 slides) + slides/*.html(1-7) + build.js (再現可能)。 round-3 adversary verify 実行中

## §追記3 PPTX 完成 + Dais 承認待ち (2026-06-29)
- round-3 adversary FAIL → 全 fix: ① デッキ順 論理化(表紙→目次→セクション扉→本文→比較→表→まとめ) ② 表 colW=placeholder幅 fit(改行/はみ出し解消、 x0-5/y0-400 全表示) ③ slide7 align中央 ④ 第3回/第1章 整合 ⑤ slide3/4 内部中央寄せ
- 自分の目で全7枚 fresh render verify = プロ品質キット 確認 (MD5 a66b21d→最終)
- ★ Dais に承認 mail 送付 (msg 19f12b55、 添付 PDF+thumb+proposal_v5) ★ → 承認後「応募する」提出→watchループ
- 成果物: ppt_sample.pptx(7 slide) + slides/slide1-7.html + build.js = 再現可能。 採用率 adversary 8%→30%帯

## §追記4 ★ 実応募 完了 + 学び統合 (2026-06-29) ★
- ★ request 5121769 (PowerPointテンプレ) に **実応募完了** ★: /offers/add → proposal v5 + ppt_sample.pptx 添付 + ¥7,000 + 納期2026/07/10 → 確認する → 最終モーダル「投稿前にご確認ください」内 応募する click
- E2E verify: ★ tab title が「応募内容を確認する|ココナラ」 に変化 = 応募済 ★ (CDP browser 一時過負荷で screenshot/応募人数 は watch loop で後追い確認)
- ★ 404 blocker 解消 ★ (= Google再login で /offers/add 到達)
- 学び → skill 統合: `scripts/coconala/APPLY_RUNBOOK.md` (login/応募/datepicker実click/ファイル添付/確認モーダル/E2E + 品質=pptx skill+vcsdd loop + 信頼ループ)
- 重要教訓: ① datepicker は実マウス click でないと model 未commit→validation 失敗 ② ファイル添付は実click+setFileInputFiles 併用 ③ CDP は navigation で接続切れ→1step1接続+timeout耐性 ④ 成果物は公式pptx skill必須(python-pptx は負ける) ⑤ 自分のoutputを自分でrender確認+vcsdd loop

## §追記5 ★ 常時ループ化 — 検知レイヤー完成 (2026-06-29) ★
- earn_inbox_watch.py + launchd com.anicca.earngig.inbox (10分毎) 追加 = ★ 全プラットフォーム横断の通知検知 (gmail poll、 browser不要) ★ → coconala/laborx/dealwork の 採用/メッセージ/仮払い/評価 を検知 → earn_action_queue.jsonl + mail
- 実走で「[ココナラ]本人確認完了」検知 = ★ KYC 完了 確認 ★
- ★ 検知レイヤー = 5 launchd 常時稼働: guild(1m集約)/guildpublish(5m公開)/dealwork(5m bid受諾API)/inbox(10m通知)/clawpoller(10m) ★
- 残: 行動レイヤー (apply/deliver/reply=要model) = /loop or Anicca heartbeat (claude-cli は quota で禁止 → 本番は OpenClaw/Hermes heartbeat が earn-gig skill を回す)
