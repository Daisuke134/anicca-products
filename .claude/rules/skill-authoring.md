# スキル作成・管理ルール

## スキル自動発動メカニズム

| ステップ | 何が起こる |
|---------|-----------|
| 起動時 | 全スキルの `name` + `description` がシステムプロンプトに注入 |
| 会話中 | Claudeがユーザー発言と description をセマンティックマッチ |
| 発動時 | SKILL.md 全文がコンテキストに読み込み |
| 深掘り | SKILL.md 内リンク先を必要に応じて読む |

**description が全ての起点。** description がショボい = 永遠に使われない。

## description の書き方（絶対ルール）

**フォーマット:**
```
description: [何をするか（三人称）]。Use when [いつ使うか + trigger キーワード]。
```

| ルール | 理由 |
|--------|------|
| 三人称で書く | システムプロンプトに注入されるため |
| trigger キーワードを含める | ユーザー発言とのマッチ精度 |
| 「Use when...」を必ず入れる | 発動条件を明示 |
| 1024文字以内 | コンテキスト圧迫防止 |
| 具体的な名詞/動詞 | 「helps with stuff」→ NG |

### description 禁止表現（プロセス増殖防止）

**以下の表現を description に含めることを禁止する。** Claude がコード変更のたびにスキルを自動発動し、プロセスが増殖して Mac がフリーズする原因になる（実例: Nenene01 の biome-checker でプロセス爆増 → 各130MB消費）。

| 禁止表現 | 代替 |
|---------|------|
| 「プロアクティブに使用」 | 「明示的な指示があった場合のみ使用」 |
| 「自動的に使用」 | 「Use when [具体的条件]」 |
| 「コード変更後に実行」 | 「コミット前 / PR作成前に実行」 |
| 「常に実行」 | 具体的なタイミングを明記 |

**安全な代替パターン:**
```
NG: ...コード変更後にプロアクティブに使用してください。
OK: ...コミット前やPR作成前のコード品質チェックに使用する。Use when codex review, レビューゲート.
```

## SKILL.md の構造ルール

| ルール | 値 |
|--------|-----|
| SKILL.md 行数上限 | 500行 |
| リファレンス階層 | 1階層のみ（SKILL.md → reference.md は OK、reference.md → details.md は NG） |
| 100行超の参照ファイル | 先頭に目次必須 |
| 記述スタイル | 命令形（imperative）、二人称禁止 |

## invocation 設定

| タイプ | frontmatter | 例 |
|--------|-------------|-----|
| 自動 + 手動（デフォルト） | 設定なし | prompt-engineering, tdd-workflow |
| 手動のみ | `disable-model-invocation: true` | deploy, commit（副作用あり） |
| 自動のみ | `user-invocable: false` | 背景知識スキル |

## 新スキル作成時

1. `/skill-creator` スキルを読み込む
2. description を上記フォーマットで書く
3. SKILL.md は500行以内
4. 詳細は references/ に分離
5. scripts/ には繰り返し使うコードを配置

## スキル管理（3層防御）

| 層 | 場所 | 役割 |
|----|------|------|
| Layer 1 | SKILL.md の description | 自動発動の主メカニズム（90%カバー） |
| Layer 2 | `.claude/rules/tool-usage.md` のスキル自動適用テーブル | エッジケースのフォールバック |
| Layer 3 | CLAUDE.md の参照先インデックス | 間接的な補強 |
