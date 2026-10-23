# The Art of AI Monks 日本語整形版

## 目的と範囲

確定済みの日本語全文を変更せず、既存のpandoc / WeasyPrintビルダーから日本語PDF・EPUB・HTMLと機械可読metadataを生成する。原著英語版の既定コマンド・出力契約を保持する。表紙は既存素材を再利用し、新規API・依存・認証・SNS・Stripe操作は行わない。

所有ファイルは `apps/landing/scripts/build-ai-monk-book.py`、`apps/landing/data/books/the-art-of-ai-monks-ja.json`、`apps/landing/private/ebooks/the-art-of-ai-monks-ja.{pdf,epub,html}`、`docs/books/the-art-of-ai-monks-ja-format-evidence.json`、本計画に限定する。本文2本、翻訳証拠、source manifest、既存field-guide spec、他者のUI branchは編集しない。

## 実行基点

- worktree: `/Users/anicca/Projects/anicca-products-worktrees/art-of-ai-monks-ja-20261023`
- branch: `feat/art-of-ai-monks-ja-20261023`
- remote: `https://github.com/Daisuke134/anicca-products.git`
- 最新 `origin/main` を取り込んだ基点: `1f7ebb542`。競合なし。
- 日本語原稿SHA256: `7c127015dc3e9ee2f8c4230010909b6beadc1940da5d46e0eade019e3ea3a5e7`
- 英語原稿SHA256: `4858b58ea835500ce3be38d55d91469d8207461cfe73e6d9042b1787afdb5d79`
- source manifest SHA256: `277276cd14db9bc36ab31a3809d18492ac80ad52a7f1157eabdd4f3656284725`
- 使用する既存環境: pandoc、WeasyPrint、Poppler、Noto Sans JP Regular/Bold、Python pypdf/fontTools。新規導入なし。

## 最小の実装と検証

1. 隔離fixtureで `--language ja` を要求し、日本語HTML・EPUB・PDFが未生成である失敗を確認する。
2. 既定を英語のまま `--language en|ja` を加える。日本語は確定した翻訳証拠のSHA・10章・4sheet・32参照を照合する。日本語の改ページとフォント指定を追加し、EPUBへ既存Notoフォントを含める。
3. 日本語を生成し、HTMLの引用label→URL、EPUBのmimetype/container/manifest/spine・metadata・内部リンクを確認する。原著と同じ95本文引用を照合する。
4. 隔離fixtureで引数なしの英語再生成を行い、59頁・10章・10,874語・95本文引用と既存販売契約を保持していることを確認する。検証で共有primary checkoutへ触れない。
5. 日本語PDFの表紙・中盤・worksheet・参考文献をPNGへrenderして実画像を確認する。日本語欠落、overflow、表の分割、引用の切れを確認し、PDF内の日本語フォント埋込・抽出文字・リンクも照合する。
6. 原稿・HTML・PDF・EPUBのsize/hash、実行したcheck、目視対象ページと結果、未達範囲を証拠JSONへ残し、`git diff --check` を実行する。

## 完了条件と境界

日本語3形式とmetadataの生成、10章・4sheet・32参照、原稿固定、EPUB構造、PDF実画像の検証、英語版の再生成契約を確認する。販売ページ、日本語SKUのprovider登録、注文、決済済み納品、売上、main反映はこの担当の完了範囲に含めない。commit/pushは共有indexの競合を避けるためrootが取りまとめる。

## TODO / 現在cursor

- [x] branch・remote・clean状態、原稿SHA、latest main merge、既存builder・metadata・呼出元を確認。
- [x] 永続計画を作成。
- [x] RED: 日本語出力を要求する隔離fixtureの失敗を確認。
- [x] 日本語対応とmetadataを実装し、日本語3形式を生成。
- [x] 引用・EPUB・PDFフォント・英語再生成のfocused check。
- [x] 紙面を画像として確認し、証拠JSONと計画を更新。
- [x] rootへ成果物size/hash・変更・検証・残問題を報告し、書込停止。

## 検証結果

日本語PDFは60頁、10章・37,083文字・4sheet・32参照・95本文引用を保持する。HTML/EPUBの全131リンクと33外部targetを原稿ASTの多重集合と照合し、EPUB内部34リンク・resource path・17spineを確認する。既存Noto Sans JP Regular/Boldは原稿の全非空白文字を収録し、PDFはUnicode対応の埋込font、EPUBは2fontの実体とCSS pathを確認する。改行を1つ加えた隔離原稿はSHA guardで拒否される。

最終PDFの1・2・24・28・40・49〜52・56・57・60頁をPNGで実際に確認する。表紙・巻頭・中盤・長い章題・4worksheet・参考文献に文字欠落、overflow、引用文字の切れは見られない。日本語だけ18pt見出し・行高1.65へ調整し、末尾1文字だけの章題折返しと本文末尾だけの余分な頁を解消する。

引数なしの最終builderは隔離fixtureで英語59頁・10,874語・10章・95引用・17spineを維持し、英語HTML・metadata・共通CSSは既存とbyte一致する。既存書籍契約の7testsは全PASS、Python構文・`git diff --check`・新規textの末尾空白検査もPASS。詳細・全hash・目視page/image hashは `docs/books/the-art-of-ai-monks-ja-format-evidence.json`。

現在cursor: 担当範囲の生成・検証を終え、rootによるcommit/push・統合を待つ。販売公開・provider SKU登録・注文・売上は未達。EPUBの実機reader表示は未実測。共有primary checkoutや他者のbranchは変更しない。
