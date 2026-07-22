# execution-notes — Orca 記事

goal: Orca 記事を日本語・英語で note / X Articles / Zenn に公開し、実表示・課金状態・通知まで検証する。

## 公開済み

### note

- 日本語: https://note.com/anicca123/n/nfeca7663e750
  - HTTP 200。
  - API: `price=1000`, `is_limited=false`, `can_read=false`, `eyecatch=true`, `status=published`。
  - 匿名実表示 screenshot: `/Users/anicca/.cloak/note-work/verify-nfeca7663e750.png`。
  - 本文画像3/3とeyecatch、目次、表、縦図、ペイウォール開始位置をDOMと目視で確認。
- English: https://note.com/anicca123/n/nb90003c0baef
  - HTTP 200。
  - API: `price=1000`, `is_limited=false`, `can_read=false`, `eyecatch=true`, `status=published`。
  - 匿名実表示 screenshot: `/Users/anicca/.cloak/note-work/verify-nb90003c0baef.png`、全無料範囲: `/Users/anicca/.cloak/note-work/verify-public-full-nb90003c0baef.png`。
  - 本文画像3/3とeyecatch、目次、表、縦図、ペイウォール開始位置をDOMと目視で確認。
  - 旧 key `nae7d557ad6ff` は2026-07-22にHTTP/APIとも404を実測。新draft `nb90003c0baef` を本文画像3/3、H2=8、H3=0、目次=1、broken image=0で再検証し、`--after-chars 3400`で無料側がセットアップ最終文、購入側が `First-day notes` から始まることをguard-stopで確認後に再公開。

### X Articles

- 日本語: https://x.com/diceai0/article/2079585582758646185
  - status: https://x.com/diceai0/status/2079585582758646185
  - HTTP 200。本文画像 4、最大表示高 545px、650px 超過 0、全8章を live DOM と screenshot で確認。
- English: https://x.com/diceai0/article/2079586493526675550
  - status: https://x.com/diceai0/status/2079586493526675550
  - HTTP 200。本文画像 4、最大表示高 545px、650px 超過 0、全8章を live DOM と screenshot で確認。
  - 英語note旧URLの404検出後、元記事だけを下書きへ戻してリンク本文・hrefを新URL `nb90003c0baef` へ置換し再公開。元live URLは維持され、HTTP 200、旧key=0、新key=1、broken image=0をlive DOMで再確認。

## 品質・事実検証

- 未検証5項目は Orca / Anthropic / OpenAI / GitHub / Microsoft / Tailscale の公式文書と GitHub 一次情報で確認。引用と URL は `2026-07-20-orca-phone-coding-research.md` に保存。
- lane A の一人称 récit。verdict box、アニッチャ CTA、Fable/Sol、曖昧な「ターミナルはこちらが」の一文は不使用。
- 日本語の独立レビュー 41/50、英語 42/50。全角ダッシュ、命題型 H2、`###`、言語混入の各 gate は PASS。
- 無料版 gate stamp:
  - JP: `939abac7e52f50e9017b97233a9fc186`
  - EN: `363d77d13a9390cb2af56b699b15d7a7`
- Zenn ローカル render は日英とも、表1、Mermaid SVG1、broken image 0。全章 screenshot を目視確認済み。

## Zenn の現在地と再開条件

- 下書き同期 commit は remote `main` へ push 済み。日英とも draft API は `public=false` を確認。
- 日本語稿を `published:true` で push し、no-lie gate は PASS。ただし live 検証は `HTTP 403 | NOT-LIVE`。
- Zenn API の直近公開は `2026-07-21T17:10:21.742+09:00`。24時間枠の次回試行可能時刻は `2026-07-22T17:10:21.742+09:00` 以降。
- 専用 LaunchAgent `ai.anicca.orca-zenn-finalizer` を登録済み。60秒ごとにAPIを確認し、10秒の安全バッファ後となる `2026-07-22T17:10:31.742+09:00` 以降に日本語稿を再トリガーする。
- finalizer実行コピー: `/Users/anicca/.local/share/anicca/orca-zenn-finalizer/finalizer.py`。追跡する正本とテスト、LaunchAgent定義は `scripts/orca-zenn-finalizer/`。planner unit test 4件 PASS、plist lint PASS。2026-07-22 11:17 JST時点でLaunchAgentは325回起動、`last exit code=0`、stderr空、直近ログは `WAIT slug=orca-iphone-ai-development-ja retry_at=2026-07-22T17:10:31.742000+09:00`。
- 日本語 live 後は同じ finalizer が英語の次回24時間枠を計算し、英語稿だけを順番に公開する。各言語3 pushまで、同一失敗3回で blocker marker を残して停止する。
- 日本語の再トリガーと live 検証後、英語はさらに次の24時間枠で公開する。英語稿は現在 `published:false`。
- 予定 URL:
  - 日本語: https://zenn.dev/anicca/articles/orca-iphone-ai-development-ja
  - English: https://zenn.dev/anicca/articles/orca-iphone-ai-development-en
- Zenn 日英 live、カードの done 移動、最終 commit/push、AgentMail 送信/read-back は未完了。完了報告・完了メールはまだ送らない。

## 生成物

- 日本語原稿: `docs/articles/2026-07-20-orca-phone-coding-jp.md`
- 英語原稿: `docs/articles/2026-07-20-orca-phone-coding-en.md`
- 無料版: `docs/articles/2026-07-20-orca-phone-coding-{jp,en}-free.md`
- research: `docs/articles/2026-07-20-orca-phone-coding-research.md`
- eyecatch: `docs/articles/assets/orca/eyecatch-{jp,en}-v2.png`
- Zenn canonical source: `~/.openclaw/workspace/zenn-articles/articles/orca-iphone-ai-development-{ja,en}.md`
