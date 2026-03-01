# DeepWork.fm — Full Application Spec

## Phase 0: Intent Normalization

| 項目 | 値 |
|------|-----|
| **アプリ名** | DeepWork.fm |
| **一行ピッチ** | AI-powered focus timer with ambient soundscapes for deep work |
| **ターゲットユーザー** | リモートワーカー、フリーランサー、学生（25-40歳） |
| **ジョブ** | 集中状態に入り、それを維持する |
| **解決するペイン** | 一人では集中できない、既存タイマーが画一的、環境音がバラバラのアプリに分散 |
| **ビジネスモデル** | Freemium SaaS（Free + Pro $4.99/mo） |
| **プラットフォーム** | Web（Next.js, Vercel） |
| **競合優位** | タイマー + 環境音ミキサー + セッション記録を1つのWebアプリに統合 |

---

## Phase 1: Dream Spec（12セクション）

### 1. Vision
「一人で集中する全ての人に、カフェの雰囲気と構造化された時間を届ける。」 タイマーアプリでも環境音アプリでもない。**集中体験そのもの**を提供するプロダクト。

### 2. Target User
| セグメント | ペルソナ | ペイン |
|-----------|---------|--------|
| リモートワーカー | 28歳、自宅で一人作業 | 集中できない、孤独感 |
| フリーランサー | 32歳、カフェで作業したいが毎日は行けない | 環境音が欲しい |
| 学生 | 22歳、試験期間 | YouTubeのlo-fi配信を流すと気が散る |

### 3. Core Features
| 機能 | 優先度 | MVP |
|------|--------|-----|
| ポモドーロタイマー（25/5, 50/10, カスタム） | P0 | ✅ |
| 環境音ミキサー（雨, カフェ, 焚き火, 波, ホワイトノイズ） | P0 | ✅ |
| セッション記録（ローカルStorage） | P0 | ✅ |
| 統計ダッシュボード（日/週表示） | P1 | ✅ |
| Pro課金（Stripe Checkout） | P1 | ✅ |
| 認証（Supabase Auth） | P2 | ❌ MVP後 |

### 4. User Flows
```
Landing Page → Start Timer → 選択: ポモドーロ or カスタム
    ↓
Timer Running + 環境音 Playing
    ↓
Timer Complete → セッション記録保存
    ↓
Stats Dashboard で累計確認
```

### 5. Pages & Routes
| ルート | ページ | 説明 |
|--------|--------|------|
| `/` | Landing + Timer | メインページ（ヒーロー + タイマー一体型） |
| `/stats` | Statistics | セッション履歴と集計 |
| `/pricing` | Pricing | Free vs Pro 比較 |
| `/success` | Checkout Success | Stripe決済完了後 |

### 6. Data Model
```
Session (localStorage):
  id: string (UUID)
  startedAt: ISO string
  duration: number (minutes)
  completed: boolean
  soundscape: string[]
  createdAt: ISO string

UserPreferences (localStorage):
  timerMode: 'pomodoro25' | 'pomodoro50' | 'custom'
  customMinutes: number
  soundPreset: string
  volume: Record<string, number>
```

### 7. API Routes
| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/checkout` | POST | Stripe Checkout Session作成 |

### 8. Design Principles
| 原則 | 詳細 |
|------|------|
| **ダークモード専用** | #0a0a0a 背景、目の疲れ軽減 |
| **情報密度 > 装飾** | Bloomberg terminal 的な密度 |
| **ワンクリック開始** | Landing → 1クリックでタイマー開始 |
| **没入感** | フルスクリーンタイマーモード |

### 9. Monetization
| プラン | 価格 | 制限 |
|--------|------|------|
| Free | $0 | 3環境音、7日間セッション記録、ポモドーロ25分のみ |
| Pro | $4.99/mo or $39.99/yr | 全環境音、無制限記録、カスタムタイマー、統計 |

### 10. Tech Stack
| レイヤー | 技術 |
|---------|------|
| Framework | Next.js 16 + TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Supabase（MVP後） |
| Payments | Stripe Checkout |
| Analytics | PostHog |
| Error Monitoring | Sentry |
| Audio | Web Audio API + HTML5 Audio |
| Storage | localStorage（MVP）→ Supabase（後期） |
| Deploy | Vercel |

### 11. Success Metrics
| メトリクス | 目標（初月） |
|-----------|-------------|
| MAU | 500 |
| セッション完了率 | 70%+ |
| Free→Pro 転換率 | 3% |
| 平均セッション時間 | 25分 |

### 12. Risks & Mitigations
| リスク | 軽減策 |
|--------|--------|
| 音声ファイルの帯域 | CDN経由で配信、ループ再生で小ファイル |
| ブラウザのautoplay制限 | ユーザーインタラクション後に再生開始 |
| localStorage容量制限 | 古いセッションを自動削除（90日） |

---

## Phase 2: Research & Positioning

### ポジショニングマップ
```
            High Complexity
                |
   Brain.fm ●   |   ● Noisli
                |
  ──────────────┼───────────── Price
                |
   Pomofocus ●  |   ● DeepWork.fm ← HERE
                |     (Simple + Ambient)
            Low Complexity
```

### 差別化ステートメント
「DeepWork.fm は、タイマーと環境音を**ひとつの没入体験**に統合した唯一のWebアプリ。Brain.fm ほど高くなく、Pomofocus ほど味気なくない。」

### キーワード戦略
| キーワード | 検索ボリューム（推定） | 難易度 |
|-----------|---------------------|--------|
| pomodoro timer online | 110K/mo | 高 |
| focus timer | 74K/mo | 中 |
| ambient sounds for work | 33K/mo | 低 |
| deep work timer | 8K/mo | 低 |
| study with me timer | 22K/mo | 中 |

---

## Phase 3: Information Architecture

### サイトマップ
```
/                     ← Landing（ヒーロー + タイマー + 環境音ミキサー）
├── /stats            ← セッション統計
├── /pricing          ← 料金プラン
└── /success          ← Stripe決済成功
```

### コンポーネントツリー
```
Layout
├── Header (Logo + Nav: Timer | Stats | Pricing)
├── Main
│   ├── [/] HeroSection + TimerWidget + SoundMixer
│   ├── [/stats] SessionHistory + WeeklyChart
│   ├── [/pricing] PricingCards
│   └── [/success] SuccessMessage
└── Footer (Links + Copyright)

TimerWidget
├── TimerDisplay (MM:SS)
├── TimerControls (Start/Pause/Reset)
├── ModeSelector (Pomodoro 25 | 50 | Custom)
└── ProgressRing (SVG circle)

SoundMixer
├── SoundCard × 5 (Rain, Cafe, Fire, Waves, WhiteNoise)
│   ├── Icon
│   ├── Label
│   └── VolumeSlider
└── MasterVolume
```

---

## Phase 4: Axiom Design System

### カラーパレット
| 用途 | HEX | 変数名 |
|------|-----|--------|
| Background | `#0a0a0a` | `--bg` |
| Card | `#111111` | `--card` |
| Border | `#1a1a1a` | `--border` |
| Text | `#e5e5e5` | `--text` |
| Muted | `#737373` | `--muted` |
| Accent | `#3b82f6` | `--accent` (blue-500) |
| Accent Hover | `#2563eb` | `--accent-hover` |
| Success | `#22c55e` | `--success` |
| Warning | `#f59e0b` | `--warning` |

### タイポグラフィ
| 用途 | フォント | サイズ |
|------|---------|--------|
| Body | Inter | 16px |
| Heading H1 | Inter | 48px / bold |
| Heading H2 | Inter | 32px / semibold |
| Timer Display | JetBrains Mono | 96px / bold |
| Data/Stats | JetBrains Mono | 14px |
| Muted/Caption | Inter | 14px |

### スペーシング
| サイズ | 値 |
|--------|-----|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |

### コンポーネントスタイル
| コンポーネント | スタイル |
|---------------|---------|
| Card | bg-[#111111] border border-[#1a1a1a] rounded-lg p-6 |
| Button Primary | bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 py-3 |
| Button Ghost | bg-transparent hover:bg-[#1a1a1a] text-[#e5e5e5] rounded-lg |
| Input/Slider | bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg |
| Progress Ring | stroke-blue-500, strokeWidth: 4 |

### レイアウト原則
| 原則 | 実装 |
|------|------|
| ダークモード専用 | 全ページ bg-[#0a0a0a] |
| 最大幅 | max-w-5xl mx-auto |
| グリッド | CSS Grid 2-3列（デスクトップ）→ 1列（モバイル） |
| アニメーション | transition-all duration-200（控えめ） |
| グラデーション禁止 | ソリッドカラーのみ |
| ネオン/グロー禁止 | シャドウは使わない |
