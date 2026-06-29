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
