# naist-mail-reader スキル仕様書

最終更新: 2026-02-21

---

## 概要

NAISTメールの受信箱を AI が自動で読み、最新10件を Slack に通知するスキル。
SAML + Google Authenticator (TOTP) の2段階認証を自動突破する。
Mac Mini (OpenClaw) で毎朝 9:00 JST に自動実行する。

---

## できること / できないこと

| 機能 | 状態 |
|------|------|
| 受信箱の最新 N 件を読む | ✅ |
| 未読のみフィルタ | ✅ |
| Slack に自動通知 | ✅ |
| OpenClaw cron で毎朝自動実行 | ✅ |
| メールの返信・送信 | ❌ v2 で対応予定 |

---

## 技術仕様

| 項目 | 値 |
|------|-----|
| リポジトリ | https://github.com/Daisuke134/roundcube-webmail-skill |
| ランタイム | Node.js + Playwright + otplib |
| 認証方式 | SAML SSO (TOTP Step1) + Roundcube native login (Step2) |
| メール URL | https://mailbox.naist.jp/roundcube/（固定） |
| セッション保存 | `.session.json` に保存して再利用 |
| Mac Mini スキルパス | `/Users/anicca/.openclaw/skills/roundcube-webmail-skill/` |
| Slack通知チャンネル | C091G3PKHL2 (cron自動通知先) |

---

## ログイン2ステップの仕組み

```
https://mailbox.naist.jp/roundcube/
  → SAML リダイレクト
    → idp.naist.jp/pub/otplogin.cgi
      → Step1: #username_input / #password_input に TOTP コード入力
        → SAML アサーション → Roundcube に戻る
          → Step2: #rcmloginuser / #rcmloginpwd に username / password 入力
            → ログイン完了 (task=mail)
```

---

## OpenClaw Cron 設定（Mac Mini）

| 項目 | 値 |
|------|-----|
| Cron ID | naist-mail-reader |
| schedule | `0 9 * * *`（毎朝 9:00 JST） |
| Slack 通知先 | C091G3PKHL2 |
| delivery.mode | none |

---

## 実装済みファイル

| ファイル | 役割 |
|---------|------|
| `scripts/read-mail.js` | メイン実行スクリプト（ログイン + 受信箱読み取り + Slack通知） |
| `scripts/decode_totp_qr.py` | Google Authenticator QR → TOTP Secret 抽出ツール |
| `package.json` | 依存: playwright, otplib |
| `.gitignore` | node_modules, .session.json を除外 |
| `SKILL.md` | Claude Code / OpenClaw 用スキル説明 |

---

## README.md（GitHub公開用）

```markdown
# roundcube-webmail-skill

NAISTメールを AI エージェントから自動で読むスキル。
SAML + Google Authenticator 認証を自動突破して、受信箱の最新件数を Slack に通知します。

## Roundcube とは

Roundcube はオープンソースの Webメールクライアントで、NAIST をはじめ多くの大学・企業が
メールシステムとして採用しています。このスキルは NAIST 専用ではなく、
Roundcube を使っている機関ならどこでも動作します。

## できること / できないこと

| 機能 | 状態 |
|------|------|
| 受信箱の最新 N 件を読む | ✅ |
| 未読のみフィルタ | ✅ |
| Slack に自動通知 | ✅ |
| OpenClaw cron で毎朝自動実行 | ✅ |
| メールの返信・送信 | ❌ v2 で対応予定 |

---

## セットアップ

### Step 1: 手元で用意する（あなたがやること）

**① 認証コードのスクリーンショット**

1. iPhone で Google Authenticator を開く
2. 左上の ☰ をタップ →「アカウントのエクスポート」をタップ
3. NAISTメールのアカウントにチェック →「次へ」をタップ
4. QRコードが表示されたらスクリーンショットを撮る（電源 + 音量↑ 同時押し）
5. 写真アプリでスクリーンショットを長押し → 共有 → AirDrop → このMac
6. `~/Downloads/` に PNG が届いたことを確認してファイル名を控える

**② NAISTメールに入る際のユーザーネームとパスワード**

---

### Step 2: 以下を Claude Code または Cursor に貼り付ける

`[ ]` の中を自分の情報に書き換えてからペーストしてください。

```
roundcube-webmail-skill をセットアップしてください。

以下を用意しました:
- QRコードのPNG: ~/Downloads/[ファイル名].PNG
- ユーザーネーム: [例: daisuke-na]
- パスワード: [NAISTメールのパスワード]

以下を順番に実行してください:
1. npx skills add Daisuke134/roundcube-webmail-skill
2. brew install zbar（未インストールの場合）
3. zbarimg --raw ~/Downloads/[ファイル名].PNG でQRを読み取る
4. python3 scripts/decode_totp_qr.py で認証シークレットを抽出する
5. .env に認証情報を設定する
6. node scripts/read-mail.js を実行して最新5件をこのチャットに表示する

最後に最新5件がチャットに表示されれば完了です。
```
```

---

## Slack 投稿文（C08RZ98SBUL / AIチャンネル）

```
naist mailのメールを取得してくれるSkill作りました！
私はよく確認を忘れてしまうので、Openclawに毎日9時にメールをとってきてもらってます。
もしよければ使ってみてください。Cursorからも使えますのでぜひ！

https://github.com/Daisuke134/roundcube-webmail-skill

━━━━━━━━━━━━━━━━━━
セットアップ手順
━━━━━━━━━━━━━━━━━━

まず手元でこれを用意してください（2分）:

① 認証コードのスクリーンショット
　1. iPhoneでGoogle Authenticatorを開く
　2. 左上 ☰ →「アカウントのエクスポート」→ NAISTメールのアカウントを選択 →「次へ」
　3. QRコードが出たらスクリーンショット（電源 + 音量↑ 同時押し）
　4. 写真を長押し → 共有 → AirDrop → このMac（~/Downloads/ に届く）

② NAISTメールに入る際のユーザーネームとパスワード

━━━━━━━━━━━━━━━━━━
準備できたら以下を Claude Code または Cursor に貼り付けてください。
[ ] の中だけ自分の情報に書き換えてからペーストしてください。
━━━━━━━━━━━━━━━━━━

roundcube-webmail-skill をセットアップしてください。

以下を用意しました:
- QRコードのPNG: ~/Downloads/[ファイル名].PNG
- ユーザーネーム: [例: daisuke-na]
- パスワード: [NAISTメールのパスワード]

以下を順番に実行してください:
1. npx skills add Daisuke134/roundcube-webmail-skill
2. brew install zbar（未インストールの場合）
3. zbarimg --raw ~/Downloads/[ファイル名].PNG でQRを読み取る
4. python3 scripts/decode_totp_qr.py で認証シークレットを抽出する
5. .env に認証情報を設定する
6. node scripts/read-mail.js を実行して最新5件をこのチャットに表示する

最後に最新5件がチャットに表示されれば完了です。
━━━━━━━━━━━━━━━━━━
```

---

## 完了チェックリスト

| # | タスク | 状態 |
|---|--------|------|
| 1 | スクリプト動作確認（最新10件取得） | ✅ 完了 |
| 2 | GitHub push | ✅ 完了 |
| 3 | README 更新 | 実行中 |
| 4 | 仕様書作成（このファイル） | ✅ 完了 |
| 5 | Slack 投稿（C08RZ98SBUL） | 実行中 |
| 6 | Mac Mini cron 設定 | 実行中 |
