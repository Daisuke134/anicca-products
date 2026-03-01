# DeepWork.fm — AI-Powered Focus Timer with Ambient Soundscapes

## Problem

**知識労働者は集中力を維持できない。** 平均11分ごとに中断され、集中状態に戻るのに23分かかる。既存のポモドーロタイマーは「25分 → 5分休憩」の画一的なサイクルしか提供せず、個人の集中パターンに適応しない。さらに、TikTokで「study with me」「work with me」フォーマットが爆発的に流行しており、**一人で集中するより「誰かと一緒に」集中したい**という心理的ニーズが顕在化している。

ソース: [UC Irvine研究](https://www.ics.uci.edu/~gmark/chi08-mark.pdf) / 核心の引用: 「It takes an average of 23 minutes and 15 seconds to get back to the task after an interruption.」
ソース: [Indie Hackers - Session AMA](https://www.indiehackers.com/post/i-made-session-a-productivity-timer-that-makes-5k-month-in-net-profit-ama-25b59d75f5) / 核心の引用: 「Session makes $5K/month in net profit」
ソース: [TikTok Trends 2026](https://blog.gainapp.com/tiktok-trends/) / 核心の引用: 「Study with me, work a 9-5 with me formats are pulling huge engagement」

## Market

| 指標 | 値 | ソース |
|------|-----|--------|
| TAM | Productivity Software Market: $102B by 2027 | [Statista](https://www.statista.com/outlook/tmo/software/productivity-software/worldwide) |
| SAM | Focus/Timer App Segment: ~$4.5B | Productivity Software × 4.4% focus segment |
| SOM | Web-based focus timer users（初年度）: $120K ARR | 1,000 paid users × $9.99/mo |

## Target

| 属性 | 定義 |
|------|------|
| **プライマリ** | リモートワーカー / フリーランサー（25-40歳） |
| **セカンダリ** | 学生（大学生〜大学院生）、特に試験期間 |
| **ペイン** | 一人で集中できない、ポモドーロが合わない、カフェの雑音が欲しいけど外出したくない |
| **行動** | Lo-fi beats のYouTubeライブを流しながら作業している |
| **プラットフォーム** | Chrome/Safari（Web優先、アプリ不要） |

## Monetization

| プラン | 価格 | 含まれるもの |
|--------|------|-------------|
| Free | $0 | 基本タイマー + 3種の環境音 + セッション記録（7日分） |
| Pro | $4.99/月 or $39.99/年 | 全環境音 + AI最適タイマー + 無制限セッション記録 + 統計ダッシュボード + Spotify連携 |

ソース: [Superframeworks - Micro SaaS Pricing](https://superframeworks.com/articles/best-micro-saas-ideas-solopreneurs) / 核心の引用: 「Freemium + $5-20/month premium plan」

## Competitors

| 競合 | 強み | 弱み | DeepWork.fm の差別化 |
|------|------|------|---------------------|
| [Session](https://www.stayinsession.com/) | macOS/iOS ネイティブ、$5K/mo 収益 | Web版なし、環境音なし | **Web完結 + 環境音内蔵** |
| [Pomofocus](https://pomofocus.io/) | 無料、シンプル | 環境音なし、AI機能なし、収益化困難 | **AI最適化 + 環境音 + Pro課金** |
| [Forest](https://www.forestapp.cc/) | ゲーミフィケーション（木を植える） | Web版なし、環境音限定的 | **Web完結 + リッチな環境音** |
| [Noisli](https://www.noisli.com/) | 環境音に特化、$2/mo | タイマー機能弱い | **タイマー + 環境音の統合体験** |
| [Brain.fm](https://www.brain.fm/) | 科学ベースの音楽、$6.99/mo | 高価、タイマーなし | **タイマー統合 + 低価格** |

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| Auth | Supabase Auth |
| DB | Supabase (PostgreSQL) |
| 決済 | Stripe Checkout |
| 分析 | PostHog |
| エラー監視 | Sentry |
| デプロイ | Vercel |
| 音声 | Web Audio API + 事前録音MP3 |

## コア機能（MVP）

| 機能 | 詳細 |
|------|------|
| **フォーカスタイマー** | ポモドーロ（25/5）+ カスタム + AI推奨タイマー |
| **環境音ミキサー** | 雨音、カフェ、焚き火、波音、ホワイトノイズ（各音量独立調整） |
| **セッション記録** | 日付、時間、集中分数を記録 |
| **統計ダッシュボード** | 今日/今週/今月の集中時間を可視化 |
| **ダークモードUI** | #0a0a0a ベース、Inter フォント |
