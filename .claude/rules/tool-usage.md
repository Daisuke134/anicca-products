# ツール・MCP 使用ルール

## MCP優先（内蔵ツールより優先）

| タスク | 使うべきMCP | 使わない |
|--------|------------|----------|
| Web検索 | `mcp__exa__web_search_exa` | WebSearch |
| ドキュメント検索 | `mcp__context7__query-docs` | WebFetch |
| Apple公式ドキュメント | `mcp__apple-docs__*` | WebFetch |
| コード検索・編集 | `mcp__serena__*` | Grep, Read |
| iOS E2Eテスト | `mcp__maestro__*` | `maestro test`（CLI） |
| RevenueCat操作 | `mcp__revenuecat__*` | - |
| App Store Connect | `mcp__app-store-connect__*` | - |

## Firecrawl CLI（Webページ取得 — 絶対ルール）

**WebFetch は禁止。Webページの内容を取得する場合は Firecrawl CLI を使う。**

```bash
/opt/homebrew/bin/firecrawl scrape <url> markdown
```

| 場面 | 使うもの | 禁止 |
|------|---------|------|
| URLの内容を読む | Firecrawl CLI | WebFetch |
| リサーチ・調査 | Firecrawl CLI | WebFetch |
| ドキュメント参照 | Firecrawl CLI（MCP未対応の場合） | WebFetch |

**理由:** WebFetchは内容が不完全・要約される。Firecrawlはフルマークダウンで返す。

## Maestro MCP（絶対ルール）

**エージェントは Maestro CLI を直接叩くな。必ず MCP を使え。**

| シーン | 使うもの | CLI使用 |
|--------|---------|---------|
| テスト作成・デバッグ | MCP (`mcp__maestro__*`) | 禁止 |
| View Hierarchy確認 | `mcp__maestro__inspect_view_hierarchy` | 禁止 |
| コマンド実行 | `mcp__maestro__run_flow` | 禁止 |
| CI/CD（GitHub Actions） | CLI (`maestro test`) | CI/CDのみ許可 |

**違反した場合**: やり直し。MCP経由で通すまで完了とは認めない。

### エージェント作業時の必須フロー

1. **MCP を絶対に使う（CLI禁止）**
   ```
   mcp__maestro__list_devices       → デバイス一覧
   mcp__maestro__inspect_view_hierarchy → 要素確認（セレクタ決定）
   mcp__maestro__run_flow           → コマンド1つずつ実行
   mcp__maestro__take_screenshot    → 結果確認
   mcp__maestro__run_flow_files     → 既存YAMLファイル実行
   ```

2. **CLI は CI/CD でのみ使う**
   ```bash
   # GitHub Actions や fastlane から実行
   maestro test maestro/
   maestro test maestro/01-onboarding.yaml --include-tags=smokeTest
   ```

3. **新しいテスト作成時のフロー**
   ```
   inspect_view_hierarchy → セレクタ確認
        ↓
   run_flow でコマンドを1つずつ試す
        ↓
   take_screenshot で確認
        ↓
   動作確認後、YAML ファイルに保存
        ↓
   run_flow_files で最終確認
   ```

## Serena MCP（コード作業時必須）

| タスク | Serenaツール |
|--------|-------------|
| ファイル検索 | `mcp__serena__find_file` |
| パターン検索 | `mcp__serena__search_for_pattern` |
| シンボル検索 | `mcp__serena__find_symbol` |
| シンボル編集 | `mcp__serena__replace_symbol_body` |
| メモリ読み書き | `mcp__serena__read_memory` / `write_memory` |

## スキル自動適用（Layer 2 フォールバック）

**Layer 1（description）で90%カバー。以下は補強用マッピング。**

| カテゴリ | スキル | いつ使う |
|---------|--------|---------|
| **開発** | `tdd-workflow` | テストを書くとき（TDD方法論） |
| **開発** | `codex-review` | Spec更新後、major step完了後（>=5files/公開API/infra変更）、コミット/PR/リリース前 |
| **開発** | `codex` | 設計相談、バグ調査、セカンドオピニオン、文章校閲（Codex read-only、1回実行） |
| **開発** | `decisive-agent` | 技術判断・選択肢がある場面で自動的に1つに決定 |
| **開発** | `ralph-autonomous-dev` | 「終わるまでやれ」「keep going」と言われた時 |
| **開発** | `maestro-ui-testing` | Maestro E2Eテスト作成・修正時 |
| **開発** | `webapp-testing` | LP（Playwright）テスト時 |
| **開発** | `mcp-builder` | MCPサーバー作成時 |
| **開発** | `skill-creator` | 新スキル作成・更新時 |
| **開発** | `supabase-postgres-best-practices` | PostgreSQLクエリ・スキーマ設計時 |
| **UI/UX** | `ui-skills` | SwiftUI/Web UIの実装・レビュー時 |
| **UI/UX** | `canvas-design` | ポスター、ビジュアルアセット、App Storeスクリーンショット作成時 |
| **UI/UX** | `theme-factory` | スライド・LP・ドキュメントのテーマ適用時 |
| **UI/UX** | `image-enhancer` | 画像の高画質化、スクリーンショット改善時 |
| **マーケ** | `aso-growth` | ASO/ASA作業、キーワード最適化、Product Page改善 |
| **マーケ** | `competitive-ads-extractor` | 競合広告分析、Facebook/LinkedIn広告ライブラリ調査時 |
| **マーケ** | `tiktok-ads` | TikTok広告の運用・分析・クリエイティブ作成時 |
| **マーケ** | `tiktok-ads-optimization` | TikTok広告キャンペーンの構造・予算・KPI最適化時 |
| **マーケ** | `lead-research-assistant` | インフルエンサー発掘、パートナー候補調査時 |
| **マーケ** | `domain-name-brainstormer` | ドメイン名のアイデア出し・空き確認時 |
| **コンテンツ** | `content-creator` | 日報作成、SNS投稿作成時 |
| **コンテンツ** | `content-research-writer` | リサーチ記事・ブログ作成時 |
| **コンテンツ** | `build-in-public` | X（Twitter）でBuild in Public投稿時 |
| **コンテンツ** | `auto-article-poster` | note.com記事の自動生成時 |
| **コンテンツ** | `changelog-generator` | リリースノート作成時 |
| **ドキュメント** | `xlsx` | Excelスプレッドシート作成・分析・数式操作時 |
| **ドキュメント** | `pdf` | PDF抽出・作成・マージ・フォーム記入時 |
| **ドキュメント** | `pptx` | PowerPointプレゼン作成・編集時 |
| **ドキュメント** | `docx` | Word文書作成・編集・tracked changes時 |
| **メモリ** | `agent-memory` | 「記憶して」「思い出して」、または重要な発見時 |
| **動画** | `remotion` | Remotion動画作成・アニメーション時 |
| **動画** | `video-downloader` | YouTube動画ダウンロード時 |
| **分析** | `meeting-insights-analyzer` | ミーティング議事録の分析・パターン検出時 |
| **分析** | `developer-growth-analysis` | 開発パターン分析・成長レポート時 |
| **整理** | `file-organizer` | ファイル整理・重複検出・構造改善時 |
| **整理** | `invoice-organizer` | 請求書・レシートの整理・確定申告準備時 |
| **自動化** | `mixpanel-automation` | Mixpanelイベント・セグメント・ファネル自動操作時 |
| **自動化** | `slack-automation` | Slackメッセージ・チャンネル・スレッド自動操作時 |
| **自動化** | `github-automation` | GitHub Issue・PR・Release自動操作時 |
| **自動化** | `sentry-automation` | Sentryエラー監視・アラート設定時 |
| **自動化** | `tiktok-automation` | TikTok動画投稿・コンテンツ管理自動化時 |
| **自動化** | `twitter-automation` | X（Twitter）投稿・検索・メディア自動操作時 |
| **自動化** | `google-drive-automation` | Google Driveファイル操作・共有・検索時 |
| **自動化** | `google-calendar-automation` | Googleカレンダーのイベント・スケジュール管理時 |
| **SNS最適化** | `twitter-algorithm-optimizer` | ツイートのリーチ最大化・アルゴリズム最適化時 |
| **設計** | `prompt-engineering` | LLMプロンプト作成・最適化・Nudgeテキスト改善時 |
| **設計** | `software-architecture` | アーキテクチャ設計・Clean Architecture・SOLID原則適用時 |

## 開発コマンド（/xxx で呼び出し）

| コマンド | 用途 |
|---------|------|
| `/plan` | 機能実装前に計画を立てる |
| `/tdd` | テスト駆動開発で実装する |
| `/code-review` | コミット前にレビューする |
| `/build-fix` | ビルドエラーを修正する |
| `/refactor-clean` | 不要コードを削除する |
| `/test-coverage` | テストカバレッジを確認・改善する |
| `/codex-review` | Codexでスペック/コードを自動レビュー |

## Fastlane（ビルド・テスト・提出）

**絶対ルール: Fastlane 以外は使うな。xcodebuild 直接実行は禁止。**

| 操作 | 正しいコマンド | 禁止 |
|------|---------------|------|
| テスト | `fastlane test` | `xcodebuild test` |
| ビルド | `fastlane build` | `xcodebuild build` |
| 実機 | `fastlane build_for_device` | 手動ビルド |

**xcodebuild を直接使った場合、即座にやり直せ。Fastlane で通るまで完了とは認めない。**

### 利用可能な Lane 一覧

| Lane | 用途 | コマンド |
|------|------|---------|
| `set_version` | MARKETING_VERSION 一括更新 | `fastlane set_version version:X.Y.Z` |
| `build_for_device` | 実機にインストール | `fastlane build_for_device` |
| `build_for_simulator` | シミュレータで起動 | `fastlane build_for_simulator` |
| `test` | Unit/Integration テスト | `fastlane test` |
| `build` | App Store 用 IPA 作成 | `fastlane build` |
| `upload` | App Store Connect にアップロード | `fastlane upload` |
| `release` | build + upload | `fastlane release` |
| `full_release` | build + upload + 審査提出 | `fastlane full_release` |
| `submit_review` | 審査に提出 | `fastlane submit_review` |

### 非インタラクティブモード対応（重要）

Fastlane を Claude Code から実行する場合、環境変数が必須:

```bash
# 正しい実行方法
cd aniccaios && FASTLANE_SKIP_UPDATE_CHECK=1 FASTLANE_OPT_OUT_CRASH_REPORTING=1 fastlane build_for_device
```

| 環境変数 | 理由 |
|---------|------|
| `FASTLANE_SKIP_UPDATE_CHECK=1` | アップデート確認をスキップ |
| `FASTLANE_OPT_OUT_CRASH_REPORTING=1` | クラッシュレポート送信をスキップ |

**これらがないと「non-interactive mode」エラーで失敗する。**

### 実機ビルド前の事前チェック

```bash
# 1. 実機が接続されているか確認
ios-deploy --detect

# 2. 接続されていれば build_for_device
cd aniccaios && FASTLANE_SKIP_UPDATE_CHECK=1 fastlane build_for_device

# 3. 未接続ならシミュレータにフォールバック
cd aniccaios && FASTLANE_SKIP_UPDATE_CHECK=1 fastlane build_for_simulator
```

**Fastfile**: `aniccaios/fastlane/Fastfile`
