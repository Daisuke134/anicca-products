# OpenClaw スキルは必ず公式インストールコマンドで入れる（絶対ルール）

**日付**: 2026-02-15

## ルール

**ClawHub やコミュニティスキルを追加するときは、必ず `clawhub install <skill-slug>` を使う。git clone や手動で ~/.openclaw/skills/ に配置するのは禁止。**

## 正しい手順

```bash
clawhub install reddit-cli --workdir ~/.openclaw --dir skills
```

- 例: `clawhub install moltbook-interact --workdir ~/.openclaw --dir skills`
- 例: `clawhub install reddit-cli --workdir ~/.openclaw --dir skills`
- スラッグはオーナーなし（`reddit-cli`）。`kelsia14/reddit-cli` だと not found
- VPS 上で入れる: 上記を VPS に SSH して実行（`~/.openclaw` は `/home/anicca/.openclaw`）
- 注: `openclaw skills` には install サブコマンドはない。スキル導入は **clawhub install** で行う。
- VPS 上で入れる場合は、VPS に SSH してから実行

## なぜか

- `openclaw skills install` は OpenClaw の skill loader に正式登録する
- git clone や手動コピーでは skill loader に認識されない可能性がある
- 不具合の原因になる

## 参照

- ClawHub: https://clawhub.ai/kelsia14/reddit-cli
- ドキュメントを検索してから、公式コマンドで入れる
