# Slack Approval — ダイスへの確認

ソース: slack-approval skill / 核心の引用: 「Block Kit ボタンを Slack に投稿し、ユーザーのクリックを待つ」

---

## 投稿コマンド（OpenClaw exec ツール）

```bash
openclaw message send \
  --channel slack \
  --target "C091G3PKHL2" \
  --message "[screenshot-ab] 新候補 ready 🖼️\nヘッドライン: \"HEADLINE_HERE\"\nvisual-qa: SCORE/50 PASS\n→ 確認して OK か NG を Slack で返してください。\n添付: screen1.png / screen2.png / screen3.png"
```

画像も添付する場合（openclaw の file upload ツール利用）:
```bash
openclaw file upload \
  --channel "C091G3PKHL2" \
  --files "docs/screenshots/processed/screen1.png,docs/screenshots/processed/screen2.png,docs/screenshots/processed/screen3.png" \
  --message "[screenshot-ab] 新候補 ready 🖼️\nヘッドライン: \"HEADLINE_HERE\"\nvisual-qa: SCORE/50 PASS\n→ OK か NG を返してください。"
```

---

## 待機・判定

Anicca（OpenClaw）はダイスの返答を待つ。

| ダイスの返答 | アクション |
|------------|-----------|
| `OK` / `ok` / `いいね` / `👍` | → PHASE 7 ASCアップロードへ |
| `NG` / `ng` / `やり直し` | → PHASE 3 ヘッドライン生成に戻る |

---

## メッセージ例

```
[screenshot-ab] 新候補 ready 🖼️
ヘッドライン: "6 Years. 10 Apps. Still Nothing Changed."
visual-qa: 43/50 PASS
→ 確認して OK か NG を返してください。
```
