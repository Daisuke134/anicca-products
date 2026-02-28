# Thankful Gratitude App — Guideline 2.1 Fix + Recipe Hardening Spec

**作成日:** 2026-03-01
**ステータス:** 計画フェーズ（実装禁止）
**Submission ID:** `0f15d81c-fe60-47c2-b7e4-eead0513c9b2`

---

## 1. 概要（What & Why）

### What

2つのことを同時に解決する。

| 目標 | 内容 |
|------|------|
| **PART A: FIX** | Thankful Gratitude App の Guideline 2.1 リジェクトを修正して再提出する |
| **PART B: HARDEN** | mobileapp-builder レシピを強化して、同じ失敗が二度と起きない仕組みを作る |

---

## 2. 根本原因（CLI で確認した事実）

### CLI 確認結果（2026-03-01）

| 項目 | 実際の値 |
|------|---------|
| アプリバージョン状態 | `REJECTED` |
| 提出状態 | `UNRESOLVED_ISSUES` |
| Monthly サブスク（ID: 6759519935） | `READY_TO_SUBMIT` ✅ |
| Annual サブスク（ID: 6759519847） | `READY_TO_SUBMIT` ✅ |
| validate blocking | `0` |
| validate warnings | `2`（「Submit this subscription for review」） |

### なぜリジェクトされたか

```
前回の提出コマンド:
  asc submit create --app 6759514159 \
    --version-id <VERSION_ID> --build <BUILD_ID> --confirm
        ↓
  アプリバイナリのみ提出
  サブスクは READY_TO_SUBMIT だったが提出に含まれていなかった
        ↓
  Apple が審査: 「アプリに課金機能があるのに課金商品が提出されていない」
        ↓
  Guideline 2.1: "products have not been submitted for review"
```

### 間違っていた先の分析（訂正）

| 誤った分析 | 実際 |
|-----------|------|
| 「IAP Review Screenshot が未添付」 | ❌ 両サブスクは READY_TO_SUBMIT = スクリーンショット含め全メタデータ完備 |
| 「MISSING_METADATA が原因」 | ❌ MISSING_METADATA ではなく READY_TO_SUBMIT |
| 「手動アップロードが必要」 | ❌ 問題はスクリーンショットではない |

**本当の問題:** サブスクは準備完了だったが、提出時にサブスクが「審査対象として含まれていなかった」。

### なぜ間違えたか（システムの問題）

```
Investigate Before Acting プロトコル違反:
  1. CLI で確認する前に既存の spec ファイル（古い情報）を読んだ
  2. 古い spec に「TASK 3: IAP Review Screenshot（手動必須）」と書いてあった
  3. その spec 自体が前セッションの別エージェントが書いた誤情報
  4. 事実確認なしに「それが原因」と結論を出した

教訓 → SKILL.md に追記すべきルール:
  「提出失敗後の診断は必ず CLI から始める。spec ファイルの記述を信用しない」
```

---

## 3. 受け入れ条件

### PART A: Thankful Gratitude App 再提出

| # | 条件 | 確認コマンド |
|---|------|------------|
| A1 | 現提出がキャンセル済み | `asc review submissions-list --app 6759514159` → `UNRESOLVED_ISSUES` が消えている |
| A2 | 新ビルド（build 5）が VALID | `asc builds list --app 6759514159 --sort -uploadedDate --limit 1` → `processingState: VALID` |
| A3 | 再提出後 `WAITING_FOR_REVIEW` | `asc review submissions-list --app 6759514159` → `state: WAITING_FOR_REVIEW` |

### PART B: レシピ強化（SKILL.md 更新）

| # | 条件 | 確認方法 |
|---|------|---------|
| B1 | SKILL.md PHASE 12 の提出コマンドが `asc publish appstore --submit` に変更済み | `grep "publish appstore" SKILL.md` |
| B2 | SKILL.md PHASE 8 ゲートが「warnings も 0」チェックを含む | `grep "warning" SKILL.md` |
| B3 | SKILL.md に「REJECTED 後の回復フロー」が追加済み | 目視確認 |
| B4 | SKILL.md が git push 済み | `git log --oneline -1 -- .claude/skills/mobileapp-builder/SKILL.md` |

---

## 4. As-Is / To-Be

### PART A: Thankful Gratitude App

**As-Is（現在）:**

```
Version 1.0.0: REJECTED
Submission:    UNRESOLVED_ISSUES
Monthly sub:   READY_TO_SUBMIT（審査未提出）
Annual sub:    READY_TO_SUBMIT（審査未提出）
```

**To-Be（修正後）:**

```
Version 1.0.0: WAITING_FOR_REVIEW
Submission:    WAITING_FOR_REVIEW
Monthly sub:   IN_REVIEW（審査に含まれている）
Annual sub:    IN_REVIEW（審査に含まれている）
```

**修正手順:**

```
STEP 1: 全既存提出をキャンセル
  asc review submissions-cancel --id <submission-id> --confirm
  ✅ 完了済み（COMPLETE/CANCELING 確認）

STEP 2: Rork アプリ用 Fastfile を作成（build 5 を出すため）
  rork-thankful-gratitude-app/fastlane/Fastfile を作成
  lane :build を定義（gym で xcarchive → ipa 生成）
  lane :upload は不要（asc publish appstore が担う）

  理由: Rork アプリに Fastfile が存在しない。
        ただし xcodeproj があるので gym で普通にビルドできる。
        xcodebuild 直接実行は禁止（tool-usage.md CRITICAL）なので
        Fastlane gym が唯一の正解。

  確認コマンド（Fastfile 作成後）:
    cd rork-thankful-gratitude-app && \
    FASTLANE_SKIP_UPDATE_CHECK=1 FASTLANE_OPT_OUT_CRASH_REPORTING=1 \
    fastlane build

STEP 3: asc publish appstore --ipa でサブスクを含めて再提出
  asc publish appstore \
    --app 6759514159 \
    --ipa build/ThankfulGratitudeApp.ipa \
    --submit \
    --confirm

  ↑ --ipa が必須。新 IPA をアップロードすることで:
    (a) バージョン state: REJECTED → PROCESSING → VALID に回復
    (b) READY_TO_SUBMIT な subscription が自動で審査に含まれる
    (c) 一コマンドで upload + attach + submit が完結

STEP 4: 確認
  asc review submissions-list --app 6759514159
  → state = WAITING_FOR_REVIEW ✅
```

**なぜ新 IPA が必要か:**

```
Apple ルール:
  REJECTED state のバージョンへの新 submission は認められない
  → item state が即 REJECTED になる（実機確認 2026-03-01）

  asc subscriptions submit → FIRST_SUBSCRIPTION_MUST_BE_SUBMITTED_ON_VERSION
  → 初回 IAP は必ず version と同時提出（Apple の不変ルール）

  唯一の解決策:
  新 IPA → 新 build → バージョン state が REJECTED → VALID にリセット
  → asc publish appstore --ipa --submit が IAP を自動含有して提出
```

---

### PART B: レシピ強化

**As-Is（現在の SKILL.md の問題）:**

```
問題①: PHASE 12 の提出コマンドが asc submit create のまま
  asc submit create --app ... --version-id ... --build ... --confirm
  → サブスクが自動的に含まれない

問題②: PHASE 8 ゲートが blocking=0 のみチェック
  asc validate subscriptions → blocking=0 でゲートを通過
  → warning（「Submit this subscription for review」）を無視していた

問題③: REJECTED 後の回復フローがレシピにない
  → 次回同じ状況になったときに対処法がわからない

問題④: IAP Bible と実装が乖離
  IAP Bible CRITICAL RULE 29b:
    「asc publish appstore --submit でサブスクが自動で含まれる」
  PHASE 12 の実装:
    asc submit create（サブスクが含まれない古いコマンド）
  → Bible に答えが書いてあったのに実装が追いついていなかった
```

**To-Be（修正後の SKILL.md）:**

```
修正①: PHASE 12 の提出コマンドを変更
  Before: asc submit create --app ... --version-id ... --build ... --confirm
  After:  asc publish appstore --app ... --submit --confirm
  理由: publish appstore がサブスクを自動的に審査に含める

修正②: PHASE 8 ゲートに warnings チェックを追加
  Before: asc validate subscriptions → blocking=0 でゲート通過
  After:  blocking=0 かつ warnings=0 でゲート通過
          warnings が残っている場合 = サブスクが未提出 → STOP

修正③: REJECTED 後の回復フローを追加（新セクション）
  REJECTED → キャンセル → 新ビルド → publish appstore

修正④: 診断ルールを CRITICAL RULES に追加
  「提出失敗後の診断は必ず CLI から始める。spec ファイルを信用しない」
```

---

## 5. テストマトリックス

| # | To-Be | 確認方法 | カバー |
|---|-------|---------|--------|
| 1 | 現提出キャンセル済み | `asc review submissions-list` で UNRESOLVED_ISSUES が消えている | A1 |
| 2 | 新ビルド VALID | `asc builds list` で processingState = VALID | A2 |
| 3 | 再提出後 WAITING_FOR_REVIEW | `asc review submissions-list` で state 確認 | A3 |
| 4 | PHASE 12 コマンドが publish appstore | `grep "publish appstore" SKILL.md` | B1 |
| 5 | PHASE 8 が warnings チェックを含む | `grep "warning" SKILL.md` | B2 |
| 6 | REJECTED 回復フローが存在 | 目視確認 | B3 |

---

## 6. 境界（やらないこと）

| 禁止 | 理由 |
|------|------|
| アプリの機能変更 | バグ修正対象外 |
| RevenueCat Offerings の変更 | 提出とは無関係 |
| スクリーンショットの再作成 | 問題ではなかった |
| IAP Review Screenshot の変更 | 問題ではなかった。両サブスクは READY_TO_SUBMIT |
| App Privacy の変更 | 提出ブロッカーではない |

---

## 7. E2E 判定

| 項目 | 値 |
|------|-----|
| UI 変更 | なし |
| 新画面 | なし |
| 結論 | Maestro E2E 不要（ASC CLI 操作のみ） |

---

## 8. 実装 TODO リスト（順序厳守）

### PHASE A: Thankful Fix

| # | タスク | 完了条件 |
|---|--------|---------|
| A-1 | 現提出をキャンセル | `asc review submissions-list` で UNRESOLVED_ISSUES が消える |
| A-2 | `fastlane build` で新ビルド（build 5）作成 | ビルド成功 |
| A-3 | `fastlane upload` で ASC にアップロード | processingState = VALID |
| A-4 | `asc publish appstore --submit --confirm` で再提出 | コマンド成功 |
| A-5 | 状態確認 | `asc review submissions-list` → state = WAITING_FOR_REVIEW |

### PHASE B: 誤情報の削除・修正

| # | タスク | 対象ファイル | 完了条件 |
|---|--------|------------|---------|
| B-1 | 古い誤情報 spec を削除 | `.cursor/plans/ios/1.6.3/2026-2-18/thankful-gratitude-app-fix-spec.md` | ファイルが存在しない |
| B-2 | SKILL.md PHASE 12 のコマンドを `publish appstore` に変更 | `.claude/skills/mobileapp-builder/SKILL.md` | `grep "publish appstore" SKILL.md` |
| B-3 | SKILL.md PHASE 8 に warnings=0 チェックを追加 | `.claude/skills/mobileapp-builder/SKILL.md` | 目視確認 |
| B-4 | SKILL.md に REJECTED 回復フローを追加 | `.claude/skills/mobileapp-builder/SKILL.md` | 目視確認 |
| B-5 | SKILL.md CRITICAL RULES にルール40〜43を追加 | `.claude/skills/mobileapp-builder/SKILL.md` | 目視確認 |
| B-6 | git add -A && git commit && git push | — | push 完了 |

---

## 9. 使用コマンド一覧

```bash
# 現提出キャンセル
asc review submissions-cancel \
  --id 0f15d81c-fe60-47c2-b7e4-eead0513c9b2 --confirm

# ビルド＆アップロード
cd rork-thankful-gratitude-app
FASTLANE_SKIP_UPDATE_CHECK=1 FASTLANE_OPT_OUT_CRASH_REPORTING=1 fastlane build
FASTLANE_SKIP_UPDATE_CHECK=1 FASTLANE_OPT_OUT_CRASH_REPORTING=1 fastlane upload

# ビルド VALID 確認
asc builds list --app 6759514159 --sort -uploadedDate --limit 1 --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['attributes']['processingState'])"

# サブスクを含めて再提出
asc publish appstore --app 6759514159 --submit --confirm

# 確認
asc review submissions-list --app 6759514159
```

---

## 10. SKILL.md に追加するルール（CRITICAL RULES）

```
| 40 | **提出は `asc publish appstore --submit` のみ。`asc submit create` 禁止**。
       submit create はサブスクを自動的に含めない。publish appstore のみがサブスクを
       審査に含める。IAP Bible CRITICAL RULE 29b 参照。2026-03-01 CLI 確認済み |

| 41 | **PHASE 8 ゲート: blocking=0 かつ warnings=0 が必須**。
       warnings が残っている場合（例: "Submit this subscription for review"）は
       STOP。warnings=0 になるまで提出禁止 |

| 42 | **提出失敗後の診断は CLI から始める。spec ファイルを信用しない**。
       spec ファイルは古いセッションの情報を含む可能性がある。
       `asc review submissions-list`, `asc validate subscriptions`,
       `asc subscriptions get` で現在の実際の状態を確認してから判断する |

| 43 | **REJECTED 後の回復フロー**:
       (1) asc review submissions-cancel → キャンセル
       (2) fastlane build && fastlane upload → 新ビルド VALID
       (3) asc publish appstore --submit --confirm → サブスク含めて再提出
       (4) asc review submissions-list → WAITING_FOR_REVIEW 確認 |
```
