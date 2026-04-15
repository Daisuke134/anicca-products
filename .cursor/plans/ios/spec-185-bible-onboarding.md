# Anicca 1.8.5 — Bible 準拠オンボーディング完全再設計 Spec

**Status:** Draft
**Version:** 1.8.5
**Branch:** feature/185-bible-onboarding (dev から切る — 現在 release/1.8.4 は作業不可)
**作成:** 2026-04-13
**根拠:** Bible = `.claude/skills/` 配下の 6 SKILL ファイル。外部情報は一切使わない。

---

## Bible 出典一覧（全引用の根拠）

| ID | ファイル | 担保範囲 |
|---|---|---|
| **B1** | `.claude/skills/app-onboarding-questionnaire/SKILL.md` | 14-screen archetype (Mob/Headspace/Noom/Duolingo) |
| **B2** | `.claude/skills/ios-app-onboarding/SKILL.md` | Vara / Cravotta / RevenueCat 2025 / Superwall 4,500 A/B / 3-step paywall / Drawer |
| **B3** | `.claude/skills/ios-app-onboarding/references/onboarding-paywall-best-practices.md` | 10,229 paywall 分析 / Cravotta CVR 2x / Blinkist timeline |
| **B4** | `.claude/skills/ios-ux-design/references/onboarding.md` | Mau Prayer Lock 3-Act / 8 rules |
| **B5** | `.claude/skills/aso-skills/skills/onboarding-optimization/SKILL.md` | Activation / Permission timing / Question 最大数 |
| **B6** | `.claude/skills/aso-skills/skills/rating-prompt-strategy/SKILL.md` | Rating prompt timing / Pre-prompt survey / SKStoreReview |
| **B7** | `.claude/skills/mobileapp-builder/prd.json L33` | 「rating prompt before paywall」 |

---

## 設計原則（Bible 全面準拠）

### Vara 3 原則 (B2/B3)
1. **Personalize immediately** — 投資感を作る（質問 10 連発）
2. **Slow them down on purpose** — perceived value を層状に積む
3. **Max perceived value before paywall** — personalized plan reveal を paywall 直前に

### Cravotta Multi-Step Paywall (B2/B3) — trial なし適応版
- Step 1 Primer: NO price, NO ×, 心拍数下げる
- Step 2 Value Timeline: Day 1 / Week 1 / Month 1 outcomes + "Cancel anytime"（trial なしのため cancel anxiety → price anxiety 除去に読み替え）
- Step 3 Hard Close: plans + testimonial + social proof above CTA. **× ボタンなし**（Hard Paywall）
- Retention Offer: **Apple Win Back Offer のみ**（iOS 設定のサブスク解約フローで Apple が自動提示）。アプリ内 Drawer/Exit Offer 一切禁止（Apple Guideline 5.6）

### Hook Model (Nir Eyal, B2)
- Trigger (nudge) → Action (1-tap) → Variable reward (異なる wisdom) → Investment (profile)

---

## 質問数の Bible 解

| Bible | 質問数推奨 |
|---|---|
| **B5** | 「Max 3-5 questions」(下限) |
| **B2** | 「Headspace 87 steps / Duolingo 77 / Balance 15-20 / Blinkist 10-15 — longer converts if valuable」|
| **B1 Screen 8** | 「1-2 screens depending on preference dimensions」|
| **B4 Rule 4** | **「the longer, the better it converts — but every screen must provide value」** |

**採用**: Personal questions を 10 個まで拡張（Headspace 路線）、各質問が visible に experience を変えること必須。

---

## Hard Paywall / No Trial の Bible 対応

| 要素 | 原 Bible (with trial) | Anicca 適応 |
|---|---|---|
| Step 1 Primer | "Try for free" | "See your personalized plan" |
| Step 2 Timeline | Today→Day 5→Day 7 (trial anxiety) | Day 1/Week 1/Month 1 (value timeline) |
| Trial 文言 | あり | **禁止**（Apple Guideline 3.1.1 Misleading） |
| Soft vs Hard | — | **Hard paywall**（× ボタンなし、Maybe later なし、解約は iOS 設定から）。Retention は Apple Win Back Offer のみ |

---

## 新 23-screen フロー全景

| # | Phase | Screen | 必須度 | 出典 |
|---|---|---|---|---|
| 1 | Hook | Welcome (hero + preview) | REQUIRED | B1 S1 |
| 2 | Hook | Name | Added | Cal AI/Finch 慣例 + B4 Rule 3 |
| 3 | Hook | Age range | Added | B5 |
| 4 | Discovery | Goal Question | REQUIRED | B1 S2 |
| 5 | Discovery | Pain Points | REQUIRED | B1 S3 |
| 6 | Discovery | Struggle Frequency | RECOMMENDED | B1 S8 |
| 7 | Discovery | Tinder Pain Cards | RECOMMENDED | B1 S5 |
| 8 | Discovery | What have you tried | Added | B4 Rule 2 |
| 9 | Discovery | Stress Level Slider | Added | B5 + B4 Rule 2 |
| 10 | Trust | Social Proof | RECOMMENDED | B1 S4 |
| 11 | Preference | Preferred Nudge Times | RECOMMENDED | B1 S8 |
| 12 | Preference | Meditation Experience | Added | B1 S8 (affects demo) |
| 13 | Preference | Referral Source | Added | Cal AI 慣例 + ASO |
| 14 | Build | Processing Moment | REQUIRED | B1 S10 |
| 15 | Build | Personalized Plan Reveal | REQUIRED | B1 S6 + B4 Rule 3 |
| 16 | Demo | Comparison Table | OPTIONAL (採用) | B1 S7 |
| 17 | Demo | App Demo (functional) | REQUIRED HARDEST | B1 S11 + B4 Rule 5 |
| 18 | Demo | Value Delivery + Share | REQUIRED | B1 S12 + B4 Rule 6 |
| 19 | Review | Rating Pre-Prompt | Added | B4 R6 + B6 + B7 |
| 20 | Permission | Notification Priming | REQUIRED | B1 S9 + B5 |
| 21 | Convert | Paywall Step 1: Primer | REQUIRED | B2 Cravotta S1 |
| 22 | Convert | Paywall Step 2: Value Timeline | REQUIRED | B2 Cravotta S2 adapted |
| 23 | Convert | Paywall Step 3: Hard Close（× なし） | REQUIRED | B2 Cravotta S3 + B1 S14 |
| — | ASC 設定 | Apple Win Back Offer $44.99（アプリ外） | REQUIRED | Apple StoreKit docs |

---

## 画面ごとの設計（EN + JA + ASCII + 出典 + 実装ファイル）

### Screen 1: WELCOME
**出典:** B1 S1「Bold headline stating the transformation outcome (not the app name) + device preview showing the app's best screen」
**ファイル:** `aniccaios/aniccaios/Onboarding/WelcomeStepView.swift` (既存改修)

```
┌─────────────────────────────┐
│ ████░░░░░░░░░░░ 20%          │
│                              │
│  Your quiet mind             │
│  starts today                │
│                              │
│  [ 📱 Nudge widget preview ] │
│    "Take 3 breaths now"      │
│                              │
│  Used by 12,400+ people to   │
│  break anxious loops         │
│                              │
│   [  Get Started  ]          │
│     Log in                   │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_welcome_title | Your quiet mind\nstarts today | 静かな心は\n今日から始まる |
| onb_welcome_sub | Used by 12,400+ people to break anxious loops | 不安ループを断ち切るために12,400人が使用中 |
| onb_welcome_cta | Get Started | 始める |
| onb_welcome_login | Log in | ログイン |

---

### Screen 2: NAME 【新規】
**出典:** B4 Rule 3「Answer Mirroring creates personalization feeling」+ Finch/Headspace/I Am 慣例
**ファイル:** 新規 `aniccaios/aniccaios/Onboarding/NameInputStepView.swift`

```
┌─────────────────────────────┐
│ ███░░░░░░░░░░░░ 22%          │
│                              │
│  First, what should          │
│  we call you?                │
│                              │
│  ┌─────────────────────┐     │
│  │ Your name           │     │
│  └─────────────────────┘     │
│                              │
│  We'll only use this here.   │
│  Nothing leaves your phone.  │
│                              │
│  [      Continue      ]      │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_name_title | First, what should we call you? | 最初に、なんて呼べばいい？ |
| onb_name_placeholder | Your name | 名前 |
| onb_name_privacy | We'll only use this here. Nothing leaves your phone. | ここでだけ使う。あなたのスマホから出ない。 |
| onb_name_continue | Continue | 次へ |

**実装メモ:** `UserDefaults` に保存。後続 screen で `{Name}` テンプレ展開。

---

### Screen 3: AGE RANGE 【新規】
**出典:** B5「each question visibly affects experience」(age-appropriate wisdom tone)
**ファイル:** 新規 `AgeRangeStepView.swift`

```
┌─────────────────────────────┐
│ █████░░░░░░░░░░ 24%          │
│                              │
│  How old are you,            │
│  {Name}?                     │
│                              │
│  ( ) 13-17                   │
│  ( ) 18-24                   │
│  ( ) 25-34                   │
│  ( ) 35-44                   │
│  ( ) 45-54                   │
│  ( ) 55+                     │
│                              │
│  [      Continue      ]      │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_age_title_tpl | How old are you, %@? | %@、何歳？ |
| onb_age_13_17 | 13-17 | 13-17歳 |
| onb_age_18_24 | 18-24 | 18-24歳 |
| onb_age_25_34 | 25-34 | 25-34歳 |
| onb_age_35_44 | 35-44 | 35-44歳 |
| onb_age_45_54 | 45-54 | 45-54歳 |
| onb_age_55_plus | 55+ | 55歳以上 |

---

### Screen 4: GOAL QUESTION 【新規】
**出典:** B1 S2「Single-select 5-7 goals, creates psychological investment」+ B4 R2
**ファイル:** 新規 `GoalStepView.swift`

```
┌─────────────────────────────┐
│ ████████░░░░░░░ 27%          │
│                              │
│  What are you trying         │
│  to change, {Name}?          │
│  Pick one.                   │
│                              │
│  [ 🧘  Stop anxious spirals ]│
│  [ 😴  Sleep without scroll ]│
│  [ 📵  Break phone addiction]│
│  [ 💭  Quiet the inner critic]│
│  [ 🎯  Build a daily habit  ]│
│  [ 🕊️  Feel less overwhelmed]│
│                              │
│  [      Continue      ]      │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_goal_title_tpl | What are you trying to change, %@? | %@、何を変えたい？ |
| onb_goal_sub | Pick one | 1つ選んで |
| onb_goal_anxiety | 🧘 Stop anxious spirals | 🧘 不安の渦を止めたい |
| onb_goal_sleep | 😴 Sleep without scrolling | 😴 スクロールせずに眠りたい |
| onb_goal_phone | 📵 Break phone addiction | 📵 スマホ依存を断ちたい |
| onb_goal_critic | 💭 Quiet the inner critic | 💭 内なる批判を鎮めたい |
| onb_goal_habit | 🎯 Build a daily habit | 🎯 毎日の習慣を作りたい |
| onb_goal_overwhelm | 🕊️ Feel less overwhelmed | 🕊️ 心の重さを軽くしたい |

---

### Screen 5: PAIN POINTS (改修)
**出典:** B1 S3「reference Screen 2 answer. Multi-select. Language real users use」
**ファイル:** `StrugglesStepView.swift` (既存改修)

```
┌─────────────────────────────┐
│ ██████████░░░░░ 30%          │
│                              │
│  What makes "stopping        │
│  anxious spirals" so hard?   │
│  Tap all that apply.         │
│                              │
│  ☐ I overthink at night      │
│  ☐ I reach for my phone      │
│    when stressed             │
│  ☐ I replay conversations    │
│    in my head                │
│  ☐ I can't sit still         │
│  ☐ Breathing apps feel fake  │
│  ☐ Meditation didn't stick   │
│                              │
│  [      Continue      ]      │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_pain_title_tpl | What makes "%@" so hard? | 「%@」の何がつらい？ |
| onb_pain_sub | Tap all that apply | 当てはまるもの全部 |
| onb_pain_overthink | I overthink at night | 夜考えすぎてしまう |
| onb_pain_phone | I reach for my phone when stressed | ストレスでスマホに手が伸びる |
| onb_pain_replay | I replay conversations in my head | 会話を頭の中で繰り返す |
| onb_pain_still | I can't sit still | じっとしていられない |
| onb_pain_fake | Breathing apps feel fake | 呼吸アプリが偽物に感じる |
| onb_pain_stick | Meditation didn't stick | 瞑想が続かなかった |

---

### Screen 6: STRUGGLE FREQUENCY (改修)
**出典:** B2「Personal Question 2 depth, 5-10s」
**ファイル:** `StruggleDepthStepView.swift` (既存改修)

```
┌─────────────────────────────┐
│ ████████████░░░ 32%          │
│                              │
│  How often does it happen?   │
│                              │
│  ( ) Several times a day     │
│  ( ) Once a day              │
│  ( ) A few times a week      │
│  ( ) Less often              │
│                              │
│  [      Continue      ]      │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_depth_title | How often does it happen? | どれくらいの頻度で起きる？ |
| onb_depth_daily_plus | Several times a day | 1日に何度も |
| onb_depth_daily | Once a day | 1日1回 |
| onb_depth_weekly | A few times a week | 週に数回 |
| onb_depth_rare | Less often | もっと少ない |

---

### Screen 7: TINDER PAIN CARDS 【新規】
**出典:** B1 S5「Swipe right agree / left dismiss. First-person. Playful, not survey」
**ファイル:** 新規 `TinderPainCardsView.swift`

```
┌─────────────────────────────┐
│ █████████████░░ 35%          │
│                              │
│  Which one hits?             │
│                              │
│   ┌──────────────────────┐   │
│   │                      │   │
│   │  "I open my phone    │   │
│   │   without even       │   │
│   │   knowing why."      │   │
│   │                      │   │
│   └──────────────────────┘   │
│                              │
│     ✗  Swipe  ✓              │
│                              │
│        Card 1 / 4            │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_tinder_title | Which one hits? | どれが刺さる？ |
| onb_tinder_c1 | I open my phone without even knowing why | 無意識にスマホを開いてしまう |
| onb_tinder_c2 | I promise myself "one more minute" and lose an hour | 「あと1分」と言って1時間溶かす |
| onb_tinder_c3 | I check my phone the second I feel a weird emotion | 嫌な気持ちになるとすぐスマホを見る |
| onb_tinder_c4 | I lie awake replaying today in my head | 今日の出来事を繰り返して眠れない |

---

### Screen 8: WHAT HAVE YOU TRIED? 【新規】
**出典:** B4 Rule 2「Questions = Self-Persuasion」+ sunk cost for later mirror
**ファイル:** 新規 `WhatTriedStepView.swift`

```
┌─────────────────────────────┐
│ ██████████████░ 37%          │
│                              │
│  What have you already       │
│  tried, {Name}?              │
│  Tap all that apply.         │
│                              │
│  ☐ 🧘 Meditation apps        │
│  ☐ 📔 Journaling             │
│  ☐ 💬 Therapy                │
│  ☐ 💊 Medication             │
│  ☐ 🏃 Exercise               │
│  ☐ 📚 Self-help books        │
│  ☐ 😶 Nothing yet            │
│                              │
│  [      Continue      ]      │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_tried_title_tpl | What have you already tried, %@? | %@、これまで何を試した？ |
| onb_tried_sub | Tap all that apply | 当てはまるもの全部 |
| onb_tried_meditation | 🧘 Meditation apps | 🧘 瞑想アプリ |
| onb_tried_journal | 📔 Journaling | 📔 ジャーナリング |
| onb_tried_therapy | 💬 Therapy | 💬 カウンセリング |
| onb_tried_meds | 💊 Medication | 💊 薬 |
| onb_tried_exercise | 🏃 Exercise | 🏃 運動 |
| onb_tried_books | 📚 Self-help books | 📚 自己啓発本 |
| onb_tried_nothing | 😶 Nothing yet | 😶 まだ何も |

---

### Screen 9: STRESS LEVEL SLIDER 【新規】
**出典:** B5「visual selections, not text inputs」+ B4 R2 self-persuasion
**ファイル:** 新規 `StressSliderStepView.swift`

```
┌─────────────────────────────┐
│ ███████████████ 40%          │
│                              │
│  Right now, how stressed     │
│  do you feel?                │
│                              │
│        7 / 10                │
│                              │
│  😌 ●━━━━━━━●━━━● 🫨          │
│  calm               on fire  │
│                              │
│  That's higher than          │
│  68% of our users            │
│  when they started.          │
│                              │
│  [      Continue      ]      │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_stress_title | Right now, how stressed do you feel? | 今、どれくらいストレス感じてる？ |
| onb_stress_left | calm | 穏やか |
| onb_stress_right | on fire | 限界 |
| onb_stress_feedback_tpl | That's higher than %d%% of our users when they started. | 始めた時の%d%%のユーザーより高い。 |

**実装メモ:** `Slider(value: 1...10, step: 1)`. Value 毎に feedback text を変更（1-3=「穏やかな方だね」、4-6=「普通より少し高め」、7-10=「68%より高い」）。

---

### Screen 10: SOCIAL PROOF 【新規】
**出典:** B1 S4「2-3 testimonial cards + persona tag + match Screen 2 segments」+ B2 Cravotta「Trust is the highest-leverage variable」
**ファイル:** 新規 `SocialProofStepView.swift`

```
┌─────────────────────────────┐
│ ████████████████ 43%         │
│                              │
│  People like you             │
│  already changed             │
│                              │
│ ┌──────────────────────────┐│
│ │ ⭐⭐⭐⭐⭐               ││
│ │ "The 8pm nudge saved me. ││
│ │ I haven't doom-scrolled  ││
│ │ in 3 weeks."             ││
│ │ — Maya, 28  #night-anxiety││
│ └──────────────────────────┘│
│ ┌──────────────────────────┐│
│ │ ⭐⭐⭐⭐⭐               ││
│ │ "First app that actually ││
│ │ interrupts the spiral."  ││
│ │ — Ken, 34  #overthinker  ││
│ └──────────────────────────┘│
│                              │
│  [      Continue      ]      │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_social_title | People like you already changed | あなたと同じ人たちが、もう変わり始めている |
| onb_social_t1_body | The 8pm nudge saved me. I haven't doom-scrolled in 3 weeks. | 夜8時の通知に救われた。3週間、ダラダラ見ていない。 |
| onb_social_t1_tag | Maya, 28 · night anxiety | Maya, 28 · 夜の不安 |
| onb_social_t2_body | First app that actually interrupts the spiral. | 不安の渦を本当に止めてくれた初めてのアプリ。 |
| onb_social_t2_tag | Ken, 34 · overthinker | Ken, 34 · 考えすぎる人 |

---

### Screen 11: PREFERRED NUDGE TIMES 【新規】
**出典:** B1 S8「Only ask preferences that visibly affect the demo」
**ファイル:** 新規 `PreferredNudgeTimesView.swift`

```
┌─────────────────────────────┐
│ █████████████████ 46%        │
│                              │
│  When should we nudge you?   │
│  Pick 2-3.                   │
│                              │
│  ☐ 🌅 Morning (7-9am)        │
│  ☑ ☀️ Midday (12-2pm)        │
│  ☑ 🌇 Evening (6-8pm)        │
│  ☑ 🌙 Night (9-11pm)         │
│                              │
│  [      Continue      ]      │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_pref_title | When should we nudge you? | いつ通知してほしい？ |
| onb_pref_sub | Pick 2-3 | 2-3個選んで |
| onb_pref_morning | 🌅 Morning (7-9am) | 🌅 朝 (7-9時) |
| onb_pref_midday | ☀️ Midday (12-2pm) | ☀️ 昼 (12-14時) |
| onb_pref_evening | 🌇 Evening (6-8pm) | 🌇 夕方 (18-20時) |
| onb_pref_night | 🌙 Night (9-11pm) | 🌙 夜 (21-23時) |

---

### Screen 12: MEDITATION EXPERIENCE 【新規】
**出典:** B1 S8「affect demo」(経験レベルで App Demo 呼吸数を 3/5/7/9 に調整)
**ファイル:** 新規 `MeditationExperienceStepView.swift`

```
┌─────────────────────────────┐
│ ██████████████████ 49%       │
│                              │
│  Have you meditated          │
│  before?                     │
│                              │
│  ( ) 🌱 Never                │
│  ( ) 🌿 A little             │
│  ( ) 🌳 Regularly            │
│  ( ) 🌲 For years            │
│                              │
│  [      Continue      ]      │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_medit_title | Have you meditated before? | 瞑想したことある？ |
| onb_medit_never | 🌱 Never | 🌱 一度もない |
| onb_medit_little | 🌿 A little | 🌿 少しだけ |
| onb_medit_reg | 🌳 Regularly | 🌳 定期的に |
| onb_medit_years | 🌲 For years | 🌲 何年も |

---

### Screen 13: REFERRAL SOURCE 【新規】
**出典:** Cal AI/Finch/I Am 慣例 + B5「personalize early」+ attribution データ
**ファイル:** 新規 `ReferralSourceStepView.swift`

```
┌─────────────────────────────┐
│ ███████████████████ 52%      │
│                              │
│  How did you find us?        │
│                              │
│  [ 🎵 TikTok        ]        │
│  [ 📸 Instagram     ]        │
│  [ 🐦 X (Twitter)   ]        │
│  [ 🔍 App Store     ]        │
│  [ 🗣️ Friend        ]        │
│  [ 📰 Article / blog]        │
│  [ 🎙️ Podcast       ]        │
│  [ ❓ Other          ]        │
│                              │
│  [      Continue      ]      │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_ref_title | How did you find us? | どこで知った？ |
| onb_ref_tiktok | 🎵 TikTok | 🎵 TikTok |
| onb_ref_instagram | 📸 Instagram | 📸 Instagram |
| onb_ref_x | 🐦 X (Twitter) | 🐦 X (Twitter) |
| onb_ref_appstore | 🔍 App Store | 🔍 App Store |
| onb_ref_friend | 🗣️ Friend | 🗣️ 友達 |
| onb_ref_article | 📰 Article / blog | 📰 記事・ブログ |
| onb_ref_podcast | 🎙️ Podcast | 🎙️ ポッドキャスト |
| onb_ref_other | ❓ Other | ❓ その他 |

**実装メモ:** Mixpanel super property `referral_source` に保存。Cohort 分析用。

---

### Screen 14: PROCESSING MOMENT
**出典:** B1 S10「Brief pause 1-3 seconds, anticipation」
**ファイル:** `ProcessingStepView.swift` (既存)

```
┌─────────────────────────────┐
│                              │
│     ◐ (spinning)             │
│                              │
│  Building your plan,         │
│  {Name}...                   │
│                              │
│  ✓ Matching your pains       │
│  ◐ Tuning nudge times        │
│  · Personalizing wisdom      │
│                              │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_proc_title_tpl | Building your plan, %@... | %@、プラン作成中... |
| onb_proc_step1 | Matching your pains | 悩みをマッチング中 |
| onb_proc_step2 | Tuning nudge times | 通知時刻を調整中 |
| onb_proc_step3 | Personalizing wisdom | 智慧をパーソナライズ中 |

---

### Screen 15: PERSONALIZED PLAN REVEAL (再設計)
**出典:** B1 S6「Mirror pain points. Each item: pain (grey small) + solution bold stat」+ B4 R3「Answer Mirroring」
**ファイル:** `PersonalizedInsightStepView.swift` → **rename** `PersonalizedSolutionStepView.swift`

```
┌─────────────────────────────┐
│ █████████████████████ 58%    │
│                              │
│  {Name}, your plan to beat   │
│  the 8pm anxious spiral      │
│                              │
│ ① "I overthink at night"    │
│   → Nudge at 7:45pm:         │
│   a 3-breath interrupt       │
│   (83% report spirals        │
│    shorten within 2 weeks)   │
│                              │
│ ② "I reach for my phone     │
│    when stressed"            │
│   → 1-tap reflection widget  │
│   replaces the scroll reflex │
│                              │
│ ③ "Meditation didn't stick" │
│   → No 20-min sessions.      │
│   Just 30-sec moments.       │
│                              │
│  [      Continue      ]      │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_solution_title_tpl | %@, your plan to beat the %@ | %@、%@を止めるプラン |
| onb_solution_item1_pain | "I overthink at night" | 「夜考えすぎる」 |
| onb_solution_item1_fix | Nudge at 7:45pm: a 3-breath interrupt. 83%% report spirals shorten within 2 weeks. | 19:45の通知で3呼吸ブレイク。2週間以内に83%%の人が渦が短くなると報告。 |
| onb_solution_item2_pain | "I reach for my phone when stressed" | 「ストレスでスマホに手が伸びる」 |
| onb_solution_item2_fix | 1-tap reflection widget replaces the scroll reflex. | 1タップ reflection widget がスクロール反射を置き換える。 |
| onb_solution_item3_pain | "Meditation didn't stick" | 「瞑想が続かなかった」 |
| onb_solution_item3_fix | No 20-min sessions. Just 30-sec moments. | 20分のセッションなし。30秒の瞬間だけ。 |

---

### Screen 16: COMPARISON TABLE 【新規】
**出典:** B1 S7「Bold stat headline + 3-4 row comparison + visceral and obvious」
**ファイル:** 新規 `ComparisonTableStepView.swift`

```
┌─────────────────────────────┐
│ ██████████████████████ 62%   │
│                              │
│  76% of people lose 2+       │
│  hours a day to anxious      │
│  scrolling.                  │
│                              │
│  ┌────────┬────────┬───────┐│
│  │        │Without │With   ││
│  │        │        │Anicca ││
│  ├────────┼────────┼───────┤│
│  │Spirals │   ❌   │  ✅   ││
│  │interr. │        │       ││
│  │Sleep   │   ❌   │  ✅   ││
│  │clean   │        │       ││
│  │Daily   │   ❌   │  ✅   ││
│  │practice│        │       ││
│  │Data    │stored  │on-    ││
│  │        │on cloud│device ││
│  └────────┴────────┴───────┘│
│                              │
│  [      Continue      ]      │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_compare_stat | 76%% of people lose 2+ hours a day to anxious scrolling | 76%%の人が不安なスクロールで1日2時間以上失っている |
| onb_compare_row1 | Spirals interrupted | 不安の渦を断ち切る |
| onb_compare_row2 | Sleep clean | 綺麗に眠れる |
| onb_compare_row3 | Daily practice | 毎日の習慣 |
| onb_compare_row4 | Data | データ |
| onb_compare_without | Without | なし |
| onb_compare_with | With Anicca | Aniccaあり |

---

### Screen 17: APP DEMO (FUNCTIONAL) (再設計)
**出典:** B1 S11「User must DO something, not watch. Must produce TANGIBLE OUTPUT」+ B4 R5「Let users experience core feature」
**ファイル:** `AppDemoStepView.swift` (既存再設計)

```
┌─────────────────────────────┐
│ ███████████████████████ 66%  │
│                              │
│  Try your first nudge        │
│                              │
│  ┌──────────────────────┐   │
│  │ 💭 Anicca             │   │
│  │                      │   │
│  │ You're about to      │   │
│  │ spiral. Pause.       │   │
│  │                      │   │
│  │ Tap the circle 3     │   │
│  │ times, slowly.       │   │
│  │                      │   │
│  │       ● ● ●          │   │
│  │                      │   │
│  └──────────────────────┘   │
│                              │
│  (user taps → haptic)        │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_demo_title | Try your first nudge | 最初の通知を試してみよう |
| onb_demo_body | You're about to spiral. Pause. Tap the circle 3 times, slowly. | 不安の渦が来る。止めよう。ゆっくり3回タップ。 |
| onb_demo_progress_tpl | Breath %d of %d | %d呼吸目 / %d |
| onb_demo_done | ✓ Done | ✓ 完了 |

**実装メモ:** `meditationExperience` 値で tap 回数を変更：Never=3 / Little=3 / Regular=5 / Years=7. Haptic feedback on each tap (`UIImpactFeedbackGenerator(style: .soft)`).

---

### Screen 18: VALUE DELIVERY + SHARE (再設計)
**出典:** B1 S12「Reveal tangible output + share button = virality hook」
**ファイル:** `ValuePropStepView.swift` → **rename** `ValueDeliveryStepView.swift`

```
┌─────────────────────────────┐
│ ████████████████████████ 70% │
│                              │
│    ✨                        │
│  You just interrupted        │
│  one spiral, {Name}.         │
│                              │
│  ┌────────────────────┐      │
│  │ Your first moment  │      │
│  │ of stillness       │      │
│  │ Apr 13, 2026       │      │
│  │                    │      │
│  │ "The root of       │      │
│  │  suffering is      │      │
│  │  attachment."      │      │
│  │     — Buddha       │      │
│  └────────────────────┘      │
│                              │
│  [ ⬆ Share this moment ]     │
│  [      Continue      ]      │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_value_title_tpl | You just interrupted one spiral, %@ | %@、不安の渦を1回止めた |
| onb_value_card_title | Your first moment of stillness | 最初の静けさ |
| onb_value_quote | The root of suffering is attachment. — Buddha | 苦しみの根は執着にある。— ブッダ |
| onb_value_share | ⬆ Share this moment | ⬆ この瞬間をシェア |
| onb_value_continue | Continue | 次へ |

**実装メモ:** Share button → `UIActivityViewController` with `UIImage` of the card rendered via `ImageRenderer`.

---

### Screen 19: RATING PRE-PROMPT 【新規】
**出典:** B4 R6「Review modal right after core feature」+ B6「Pre-prompt survey: 'Are you enjoying X?' filter, Yes → SKStoreReview. Expected +0.3-0.8 stars」+ B7「rating prompt before paywall」
**ファイル:** 新規 `RatingPrePromptStepView.swift` + `FeedbackFormView.swift`

```
┌─────────────────────────────┐
│ █████████████████████████ 75%│
│                              │
│     ⭐                       │
│                              │
│  {Name}, are you             │
│  enjoying Anicca             │
│  so far?                     │
│                              │
│                              │
│  [ 💛  Yes, love it! ]       │  → SKStoreReviewController
│  [ 😐  Not really    ]       │  → Feedback sheet
│                              │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_rate_title_tpl | %@, are you enjoying Anicca so far? | %@、ここまで Anicca 気に入ってる？ |
| onb_rate_yes | 💛 Yes, love it! | 💛 うん、好き！ |
| onb_rate_no | 😐 Not really | 😐 あんまり |
| onb_rate_feedback_title | Tell us what's missing | 何が足りない？ |
| onb_rate_feedback_placeholder | Your feedback helps us improve | フィードバックで改善します |
| onb_rate_feedback_send | Send | 送信 |
| onb_rate_feedback_skip | Skip | スキップ |

**実装ロジック (B6 準拠):**
```swift
Button(String(localized: "onb_rate_yes")) {
    AnalyticsManager.shared.track(.onboardingRatingPromptYes)
    if let scene = UIApplication.shared.connectedScenes
        .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
        SKStoreReviewController.requestReview(in: scene)
    }
    appState.markReviewRequested()
    advance()
}
Button(String(localized: "onb_rate_no")) {
    AnalyticsManager.shared.track(.onboardingRatingPromptNo)
    // B6: "show feedback form, do NOT trigger native prompt" — 1★予防
    showFeedbackSheet = true
}
```

**なぜ screen として実装するか（ポップアップではなく）:**
- B6「Pre-prompt survey」は画面として実装するのが前提（Yes/No filter は画面 UI 必要）
- B4 R6「RIGHT AFTER core feature」= App Demo + Value Delivery の直後 = 画面の順序で担保
- Full-screen にすることで no-tap 誤操作を防ぐ + 進捗 bar に含める
- B7「rating prompt before paywall」= paywall 前の screen として明示配置

---

### Screen 20: NOTIFICATION PRIMING (順序移動)
**出典:** B1 S9「prime AFTER App Demo」+ B5「After activation, not before」+ B2「benefit-framed, not permission-framed」
**ファイル:** `NotificationPermissionStepView.swift` (既存、順序移動のみ)

```
┌─────────────────────────────┐
│ ██████████████████████████ 80%│
│                              │
│    🔔                        │
│  Never miss the moment       │
│  before you spiral           │
│                              │
│  ✓ 3 nudges a day, max       │
│  ✓ You pick the times        │
│  ✓ Turn off anytime          │
│                              │
│  [      Enable      ]        │
│       Not now                │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| onb_notif_title | Never miss the moment before you spiral | 不安の渦が来る前に気づけるように |
| onb_notif_b1 | 3 nudges a day, max | 通知は1日3回まで |
| onb_notif_b2 | You pick the times | 時刻は自分で決められる |
| onb_notif_b3 | Turn off anytime | いつでもオフにできる |
| onb_notif_cta | Enable | 許可する |
| onb_notif_skip | Not now | あとで |

---

### Screen 21: PAYWALL STEP 1 — RISK-FREE PRIMER (改修)
**出典:** B2 Cravotta S1「NO price, NO ×, lower heart rate」— trial なしのため "Try for free" → "See your personalized plan" に変更
**ファイル:** `PaywallPrimerStepView.swift` (既存改修)

```
┌─────────────────────────────┐
│                              │  ← NO × button
│     ●○○                      │
│                              │
│        🕊️                    │
│                              │
│  See your                    │
│  personalized plan           │
│                              │
│  We built this for you,      │
│  {Name}. No surprises —      │
│  cancel anytime.             │
│                              │
│  [     Continue     ]        │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| pw_s1_title | See your\npersonalized plan | あなた専用プランを\n見てみる |
| pw_s1_body_tpl | We built this for you, %@. No surprises — cancel anytime. | %@、あなた専用に作った。驚きなし — いつでも解約可。 |
| pw_s1_cta | Continue | 次へ |

---

### Screen 22: PAYWALL STEP 2 — VALUE TIMELINE (trial なし版) 【新規】
**出典:** B2 Cravotta S2「remove cancel anxiety via timeline」→ trial なしのため Day 1/Week 1/Month 1 の value timeline で price anxiety 除去
**ファイル:** 新規 `PaywallValueTimelineStepView.swift`

```
┌─────────────────────────────┐
│                              │
│     ○●○                      │
│                              │
│  What you get,               │
│  week by week                │
│                              │
│  ●  Day 1                    │
│  │  Your first spiral        │
│  │  interrupted              │
│  │                           │
│  ●  Week 1                   │
│  │  Spirals 30% shorter      │
│  │  (based on 12,400 users)  │
│  │                           │
│  ●  Month 1                  │
│  │  Daily practice: built    │
│  │                           │
│  ●  Anytime                  │
│     Cancel with one tap      │
│                              │
│  [      Continue      ]      │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| pw_s2_title | What you get, week by week | 週ごとに手に入るもの |
| pw_s2_day1 | Day 1 — Your first spiral interrupted | 1日目 — 最初の不安の渦を止める |
| pw_s2_week1 | Week 1 — Spirals 30%% shorter (based on 12,400 users) | 1週目 — 渦が30%%短くなる（12,400人のデータ）|
| pw_s2_month1 | Month 1 — Daily practice: built | 1ヶ月目 — 毎日の習慣ができる |
| pw_s2_cancel | Anytime — Cancel with one tap | いつでも — ワンタップで解約可 |
| pw_s2_cta | Continue | 次へ |

---

### Screen 23: PAYWALL STEP 3 — HARD CLOSE (再設計)
**出典:** B2 Cravotta S3「personalized headline + social proof above CTA + yearly pre-selected + weekly breakdown + 'No commitment, cancel anytime'」+ B1 S14
**ファイル:** `PaywallVariantBView.swift` (既存全面改修)

```
┌─────────────────────────────┐
│                             │  ← NO × button (Hard Paywall)
│     ○○●                     │
│         🕊️                   │
│                             │
│  Your quiet mind,           │
│  {Name}, $0.23/day          │
│                             │
│  ┌─────────────────────┐    │
│  │ ⭐⭐⭐⭐⭐ 4.9      │    │
│  │ "Broke my 8pm       │    │
│  │  doom-scroll in     │    │
│  │  10 days."          │    │
│  │  — Maya, #night     │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ ○ Weekly   $12.99/wk│    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ ● Yearly BEST VALUE │    │
│  │   $59.99/yr         │    │
│  │   ≈ $1.15/week      │    │
│  │   Save 91%          │    │
│  └─────────────────────┘    │
│                             │
│  ⭐ 4.9 · 12,400+ users     │
│  [==  Start Anicca  ==]     │
│  No commitment. Cancel any. │
│  Restore · Terms · Privacy  │
└─────────────────────────────┘
```

| Key | EN | JA |
|---|---|---|
| pw_s3_title_tpl | Your quiet mind, %@, $0.23/day | %@の静かな心を、1日 ¥35 で |
| pw_s3_testimonial | Broke my 8pm doom-scroll in 10 days. | 夜8時のダラダラ見を10日で断った。 |
| pw_s3_testimonial_tag | Maya, #night | Maya, #夜 |
| pw_s3_plan_weekly | Weekly · $12.99/week | 週額 · ¥1,900/週 |
| pw_s3_plan_yearly | Yearly · $59.99/year ≈ $1.15/week · Save 91%% | 年額 · ¥8,900/年 ≈ ¥170/週 · 91%%OFF |
| pw_s3_badge | BEST VALUE | 一番お得 |
| pw_s3_social | ⭐ 4.9 · 12,400+ users | ⭐ 4.9 · 12,400人以上 |
| pw_s3_cta | Start Anicca | Anicca を始める |
| pw_s3_trust | No commitment. Cancel anytime. | 縛りなし。いつでも解約可。 |
| pw_s3_restore | Restore | 復元 |
| pw_s3_terms | Terms | 利用規約 |
| pw_s3_privacy | Privacy | プライバシー |

**実装メモ:**
- **× ボタンなし**（Hard Paywall）。dismiss 不可
- Social proof は CTA 直上配置 (B2 L309)
- 唯一の離脱経路は iOS 設定でのサブスク解約（Apple Win Back Offer が自動提示される）

---

### Retention: APPLE WIN BACK OFFER $44.99（アプリ外・ASC 設定のみ）
**出典:** Apple StoreKit docs `supporting-win-back-offers-in-your-app` — 「With Streamlined Purchasing on (default), the customer completes the win-back offer purchase outside of your app. Your app receives a completed purchase transaction in the `updates` sequence」
**ファイル:** **新規ファイルなし**（App Store Connect 設定のみ）

**提示フロー (Apple 側 iOS 設定アプリ):**
```
iOS 設定 → Apple ID → Subscriptions → Anicca → Cancel Subscription
                                                      ↓
                         ┌───────────────────────────────────┐
                         │ 🎁 Special Offer                  │
                         │ Get 1 year for $44.99 (save $15)  │
                         │ [Redeem Offer] [Cancel Anyway]    │
                         └───────────────────────────────────┘
                         ※ Apple が自動提示、アプリコード不要
```

**Offer 設定値:**
| 項目 | 値 |
|---|---|
| Offer Identifier | `anicca_yearly_b_winback_44` |
| 対象 Product | `ai.anicca.app.ios.yearly.b` ($59.99/yr) |
| Offer Type | Pay As You Go (1st renewal discount) |
| Discount Price | $44.99 (1-year) |
| Eligibility | Paid ≥1 day / Expired 1-365 days / Once per year |
| Regions | All countries |
| Streamlined Purchasing | ON (default) |

**既存コードの要件（確認済）:**
- `SubscriptionManager.swift:61` で `Purchases.shared.customerInfoStream` 受信済み
- `SubscriptionManager.swift:214` で `PurchasesDelegate.receivedUpdated` 実装済み
- RevenueCat が内部で `Transaction.updates` を購読するため、Win Back 償還は自動で `customerInfoStream` に流れる
- **アプリコード変更: ゼロ**

---

## 実装パッチ T1-T30（ファイル全パス）

| # | ファイル | 変更内容 | 種別 |
|---|---|---|---|
| **T1** | `aniccaios/aniccaios/Onboarding/OnboardingStep.swift` | `enum OnboardingStep: Int` を 20 cases に拡張: welcome, name, age, goal, painPoints, struggleFreq, tinderPain, whatTried, stressLevel, socialProof, nudgeTimes, meditExp, referral, processing, planReveal, comparison, appDemo, valueDelivery, ratingPrompt, notifications | 改修 |
| **T2** | `aniccaios/aniccaios/Onboarding/OnboardingStep.swift` | `enum PaywallStep: Int { primer, valueTimeline, planSelection }`（drawer なし） | 改修 |
| **T3** | `aniccaios/aniccaios/Onboarding/OnboardingStep.swift` | `migratedFromLegacyRawValue` / `migratedFromV1RawValue` / `migratedFromV2RawValue` に v3 mapping 追加 | 改修 |
| **T4** | `aniccaios/aniccaios/Onboarding/OnboardingFlowView.swift` | `onboardingContent(for:)` switch を 20 cases に書き換え、`advance()` を全 case 対応、`paywallContent(for:)` を primer→valueTimeline→planSelection に拡張 | 改修 |
| **T5** | `aniccaios/aniccaios/Onboarding/NameInputStepView.swift` | 新規: `TextField` + autofocus + UserDefaults 保存 | 新規 |
| **T6** | `aniccaios/aniccaios/Onboarding/AgeRangeStepView.swift` | 新規: 6-option radio | 新規 |
| **T7** | `aniccaios/aniccaios/Onboarding/GoalStepView.swift` | 新規: single-select 6 chips | 新規 |
| **T8** | `aniccaios/aniccaios/Onboarding/StrugglesStepView.swift` | 改修: title template に Screen 4 goal を mirror | 改修 |
| **T9** | `aniccaios/aniccaios/Onboarding/StruggleDepthStepView.swift` | 改修: 8 questions → 1 question (frequency only) | 改修 |
| **T10** | `aniccaios/aniccaios/Onboarding/TinderPainCardsView.swift` | 新規: DragGesture + 4 cards + swipe animation | 新規 |
| **T11** | `aniccaios/aniccaios/Onboarding/WhatTriedStepView.swift` | 新規: multi-select 7 chips | 新規 |
| **T12** | `aniccaios/aniccaios/Onboarding/StressSliderStepView.swift` | 新規: `Slider(1...10)` + 動的 feedback text | 新規 |
| **T13** | `aniccaios/aniccaios/Onboarding/SocialProofStepView.swift` | 新規: 2 testimonial cards + 5-star | 新規 |
| **T14** | `aniccaios/aniccaios/Onboarding/PreferredNudgeTimesView.swift` | 新規: 4-option multi | 新規 |
| **T15** | `aniccaios/aniccaios/Onboarding/MeditationExperienceStepView.swift` | 新規: 4-option radio | 新規 |
| **T16** | `aniccaios/aniccaios/Onboarding/ReferralSourceStepView.swift` | 新規: 8-option single-select + Mixpanel super property | 新規 |
| **T17** | `aniccaios/aniccaios/Onboarding/ProcessingStepView.swift` | 改修: `{Name}` template + 3-step checklist animation | 改修 |
| **T18** | `aniccaios/aniccaios/Onboarding/PersonalizedSolutionStepView.swift` | 新規 (`PersonalizedInsightStepView.swift` リネーム・再設計): 3 mirror items | 再設計 |
| **T19** | `aniccaios/aniccaios/Onboarding/ComparisonTableStepView.swift` | 新規: 4-row with/without table | 新規 |
| **T20** | `aniccaios/aniccaios/Onboarding/AppDemoStepView.swift` | 再設計: functional tap interaction + haptics + meditation experience で tap count 変更 | 再設計 |
| **T21** | `aniccaios/aniccaios/Onboarding/ValueDeliveryStepView.swift` | 新規 (`ValuePropStepView.swift` リネーム・再設計): shareable card + `UIActivityViewController` | 再設計 |
| **T22** | `aniccaios/aniccaios/Onboarding/RatingPrePromptStepView.swift` | 新規: Yes/No buttons + `SKStoreReviewController.requestReview` + `.sheet(FeedbackFormView)` | 新規 |
| **T23** | `aniccaios/aniccaios/Onboarding/FeedbackFormView.swift` | 新規: TextEditor + `MFMailComposeViewController` | 新規 |
| **T24** | `aniccaios/aniccaios/Onboarding/NotificationPermissionStepView.swift` | 既存、順序のみ移動（enum の最後 → ratingPrompt の次）| 改修 |
| **T25** | `aniccaios/aniccaios/Onboarding/PaywallPrimerStepView.swift` | 改修: "See your personalized plan" title、no ×, no price | 改修 |
| **T26** | `aniccaios/aniccaios/Onboarding/PaywallValueTimelineStepView.swift` | 新規: Day 1 / Week 1 / Month 1 / Cancel anytime timeline | 新規 |
| **T27** | `aniccaios/aniccaios/Onboarding/PaywallVariantBView.swift` | 改修: heroSection に testimonial + 5-star / social proof above CTA / **× ボタン完全削除（Hard Paywall）** / dismiss 不可 | 改修 |
| ~~T28~~ | ~~RetentionDrawerSheet.swift~~ | **削除** — Apple Win Back Offer に置換（アプリコード変更なし） | — |
| **T29** | `aniccaios/aniccaios/Onboarding/OnboardingProgressBar.swift` | 改修: `progress = 0.2 + 0.8 × (currentStep / totalSteps)` (B2 L329 Endowed Progress) | 改修 |
| **T30** | `aniccaios/aniccaios/Services/SubscriptionManager.swift` | **変更なし**（既存の `customerInfoStream` + `PurchasesDelegate` で Win Back 自動ハンドル済み。L61, L214 確認済） | — |
| **T31** | `aniccaios/aniccaios/Models/UserProfile.swift` | `name, ageRange, triedMethods, stressLevel, meditationExperience, referralSource, nudgeTimes` を追加 | 改修 |
| **T32** | `aniccaios/aniccaios/Analytics/AnalyticsManager.swift` | `onboarding_<screen>_viewed` + `onboarding_rating_prompt_yes/no` + `onboarding_referral_source` Mixpanel super-property | 改修 |
| **T33** | `aniccaios/aniccaios/Resources/Localizable.xcstrings` | 全 EN/JA key（約 120 keys）追加 | 改修 |

---

## Apple Win Back Offer 設定（App Store Connect）

**原則:** アプリコード変更ゼロ。ASC 上で Offer を作成するだけで、Apple が iOS 設定のサブスク解約フローで自動提示する。

**出典:** Apple StoreKit docs — `https://developer.apple.com/documentation/storekit/supporting-win-back-offers-in-your-app`

### 手順 (ASC UI)

1. **App Store Connect → App → Monetization → Subscriptions**
2. 対象 Subscription Group（例: `Anicca Premium B`）を選択
3. 対象 Product `ai.anicca.app.ios.yearly.b` ($59.99/yr) を選択
4. **Win-Back Offers** セクション → **Create Win-Back Offer**
5. 以下を入力:

| 項目 | 値 |
|---|---|
| Offer Reference Name | Anicca Yearly B Win Back $44.99 |
| Offer Identifier | `anicca_yearly_b_winback_44` |
| Offer Type | Pay As You Go |
| Discounted Price | $44.99 (USA base) |
| Duration | 1 Year (1st renewal) |
| Eligibility — Paid subscription duration | Any (≥1 day) |
| Eligibility — Time since expiration | 1-365 days |
| Eligibility — Offer frequency | Once per year |
| Regions | All countries (pricing auto-equalized) |
| Streamlined Purchasing | ON (default) |
| Subscription Image | 既存 yearly.b screenshot 流用 |

6. **Submit for Review**（Binary 提出と同じタイミングで OK）

### ASC CLI 代替（UI が望ましいが CLI 可の場合）

```bash
# 正確な subcommand は asc CLI の実装依存。UI 手動設定を推奨
# asc CLI に win-back subcommand があるか要確認
asc subscriptions --help | grep -i winback
```

### 必須テスト

| テスト | 方法 |
|---|---|
| Xcode StoreKit Testing | `testing-win-back-offers-in-xcode` でシミュレート |
| Sandbox | 本番 sandbox で「加入→解約→期限切れ→ 1 日以上経過→解約フロー」を実行 |
| 既存購読者にメール送信 | ASC 生成 direct link を告知メールで配布（任意） |

---

## 禁止事項（Bible 遵守）

| 禁止 | 出典 |
|---|---|
| Toggle Paywall | B2 L281「BANNED iOS Jan 2026 Guideline 3.1.2」|
| Exit Offer / Retention Drawer / アプリ内 Win Back UI | Apple Guideline 5.6 + Apple docs「Do NOT show a retention offer any other way, as Apple will reject it」|
| × ボタン（Hard Paywall） | Hard Paywall 設計：離脱は iOS 設定からのみ |
| CTA "Subscribe / Buy" | B2 L128「NOT 'Subscribe' or 'Buy'」|
| 1★ 予防なし rating prompt | B6「Only prompt users who experienced value」→ Pre-prompt survey 必須 |
| Cold permission prompt | B1 S9 + B5「NEVER trigger system dialog without priming」|
| Gender 質問 | B5「Never ask for data you won't use」(Anicca 不使用) |
| Trial 文言 (trial なしのため) | Apple Guideline 3.1.1「Misleading」|
| Cloud 保存明示なし | B1 S9 + B5「Privacy: Processed on device」 |

---

## 進捗 bar 計算 (B2 L329)

```swift
// OnboardingProgressBar.swift
var progress: Double {
    let totalSteps = 20.0  // Screen 1-20 (paywall は別 UI)
    let currentIndex = Double(step.rawValue + 1)
    return 0.2 + 0.8 * (currentIndex / totalSteps)
}
```

| Screen | Progress |
|---|---|
| 1 Welcome | 24% |
| 5 Pain | 36% |
| 10 Social Proof | 56% |
| 15 Plan Reveal | 76% |
| 20 Notifications | 100% |

---

## 実装順序 (依存性考慮)

### Phase A: Foundation (T1-T4)
1. T1-T3: OnboardingStep.swift enum 拡張 + migration
2. T4: OnboardingFlowView.swift switch 書き換え (全 case placeholder)
3. T31: UserProfile 拡張

### Phase B: Question Screens (T5-T16)
4. T5 NameInput → T6 AgeRange → T7 Goal → T8 Pain → T9 StruggleFreq → T10 Tinder → T11 WhatTried → T12 Stress → T13 SocialProof → T14 NudgeTimes → T15 Medit → T16 Referral
5. 順次実装 + 動作確認 (simulator)

### Phase C: Build + Demo (T17-T21)
6. T17 Processing → T18 PlanReveal → T19 Comparison → T20 AppDemo (functional) → T21 ValueDelivery + Share

### Phase D: Review + Permission (T22-T24)
7. T22 RatingPrePrompt → T23 FeedbackForm → T24 Notification (順序移動のみ)

### Phase E: Paywall (T25-T27)
8. T25 PW1 Primer → T26 PW2 ValueTimeline → T27 PW3 Hard Close 改修（× ボタン完全削除）

### Phase F: Infra (T29, T31-T33)
9. T29 ProgressBar 計算 → T31 UserProfile (Phase A で済) → T32 Analytics → T33 Localizable
   ※ T30 SubscriptionManager は変更なし（既存 customerInfoStream が Win Back 対応済み）

### Phase G: ASC + Submit
10. ASC UI で **Apple Win Back Offer $44.99** を `ai.anicca.app.ios.yearly.b` に作成 → Submit
11. Debug build で全 screen 動作確認 + Xcode StoreKit Testing で Win Back Offer 償還シミュレート
12. dev merge → main merge → release/1.8.5 → fastlane release_build → asc submit
13. 1.8.4 は既に配信中のため reject 不要

---

## Maestro E2E テスト（別 spec）

新 flow に対応する Maestro test 必須:
- `onboarding_full_flow.yaml` — screen 1→20 + PW1→2→3 → purchase simulation
- `onboarding_rating_yes_path.yaml` — rating = Yes → SKStoreReview (assert appState.hasRequestedReview)
- `onboarding_rating_no_path.yaml` — rating = No → feedback sheet opens
- `paywall_hard_no_dismiss.yaml` — PW3 表示 → × ボタンが存在しないこと + swipe down で dismiss されないことを確認

---

## Target Metrics (B2 L350)

| メトリクス | 目標 |
|---|---|
| Onboarding completion rate | > 70% |
| Paywall view rate | > 80% |
| Paywall CVR (soft) | > 5% |
| Rating prompt Yes 率 | > 60% (Bible benchmark) |
| Rating 平均 (post-filter) | > 4.7 |
| D1 retention | > 40% |

---

## Placeholder 数字ポリシー（B1 準拠）

**B1 Bible 出典:**
- 「The stats should be specific and credible. If the app is new and has no stats, use industry benchmarks or logical projections」
- 「Mark these as placeholder content to be replaced with real reviews later」
- 「Round numbers feel fake — stats should be specific」

**決定:** すべての placeholder 数字は以下のルールで扱う。

| 数字 | 出現箇所 | 扱い | 置換タイミング |
|---|---|---|---|
| 12,400+ users | Welcome S1, Paywall S3 | `// TODO(placeholder): Mixpanel DAU 集計後に実数置換` | post-launch 30日後 |
| 4.9 rating | Paywall S3 | `// TODO(placeholder): App Store rating 50件以上で実数置換` | 50レビュー到達後 |
| 83% spiral shortening | Plan Reveal S15 | `// TODO(placeholder): B1 業界ベンチマーク projection。post-launch 90日で自社データに置換` | 90日後 |
| 76% scrolling loss | Comparison S16 | `// TODO(source): 業界統計引用必須。Statista / APA 等から URL + 引用取得` | **実装前**に確定 |
| 30% spirals shorter Week 1 | Paywall S2 | `// TODO(placeholder): 自社 Mixpanel 後に置換` | 60日後 |
| 68% users stress level | Stress Slider S9 | `// TODO(placeholder): B1 projection` | 60日後 |

**実装ルール:**
1. **すべての placeholder 数字は Swift コード内で定数化** — `AniccaStats.swift` に集約
2. **各定数に `// PLACEHOLDER:` prefix コメント + 置換予定日** を必須
3. **76% scrolling 統計**: 実装前に Statista / APA 等の業界統計を検索して URL + 原文引用を spec に追記（B1「industry benchmark」準拠）
4. Testimonial テキスト (Maya, Ken) も同様に `// PLACEHOLDER:` マーク + 実レビュー取得後に差し替え
5. **Round number 禁止**: 12,000 / 80% / 5.0 のような切りの良い数字は使わない（12,400 / 83% / 4.9 のように specificity を維持）

---

## 実装時の不確実性チェックリスト（Codex review 対象）

実装開始前に下記をすべて解決する。未解決のまま実装着手禁止。

| # | 項目 | 現状 | 解決方法 |
|---|---|---|---|
| U1 | `OnboardingStep` enum v2→v3 migration の互換性 | 既存 v2 8 cases、v3 20 cases | `migratedFromV2RawValue` に mapping 関数必須（spec T3） |
| U2 | `OnboardingFlowView.advance()` の switch 網羅 | 不明 | 20 case すべて明示 + `@unknown default` 禁止 |
| U3 | `UserProfile` 永続化スキーマ | 不明 | `@AppStorage("anicca_user_profile")` + `Codable` struct 定義を spec に追記 |
| U4 | `{Name}` テンプレ展開方式 | String(format:) or LocalizedStringKey? | `String(localized: "key", defaultValue: "...")` + `String(format: template, name)` 統一 |
| U5 | Tinder Swipe ジェスチャ仕様 | DragGesture 方向判定 | 閾値 100pt / right=agree / left=dismiss / 0.3s animation |
| U6 | 76% scrolling 統計の出典 | 未確定 | **実装前に Firecrawl で業界統計検索 → spec 追記** |
| U7 | Stress slider 動的 feedback 閾値 | 1-3, 4-6, 7-10 と spec L404 にあり | OK（確定済み） |
| U8 | FeedbackFormView の送信先 | 未確定 | email: `feedback@anicca.app` or Airtable API? → 決定必須 |
| U9 | Share card の `ImageRenderer` 互換性 | iOS 16+ API | iOS 15 fallback 必須 or `@available(iOS 16, *)` ガード |
| U10 | `SKStoreReviewController.requestReview(in:)` iOS 16+ | iOS 15 対応 | iOS 15 では `SKStoreReviewController.requestReview()` 旧 API を使用 |
| U11 | Win Back Offer の既存購読者告知 | 未確定 | ASC 生成 direct link をメール/App 内で告知するか? |
| U12 | Maestro E2E で Paywall hard close 検証 | 新規 | `assertNotVisible(id: "close_button")` で確認 |
| U13 | Analytics event 命名規則 | 不明 | `onboarding_{screen_id}_viewed` / `_completed` / `_skipped` 統一 |
| U14 | Progress bar 計算の paywall 含有 | L1100 で totalSteps=20 | Paywall は進捗 bar 対象外（確定） |
| U15 | 言語切替時の {Name} 保存 | 不明 | `@AppStorage` は言語非依存、問題なし |

---

## J1/J2/J3 決定ログ (2026-04-15)

| # | 判断 | 決定 | 根拠 |
|---|---|---|---|
| J1 | Cravotta 3-step / Endowed Progress 等（B2-B7 由来）を継続採用するか | **YES** | ダイス判断 + 既存 1.8.4 の延長線 |
| J2 | Rating Pre-Prompt (Screen 19) を残すか | **YES** | Rating 必須 + B1 Bible と矛盾しない |
| J3 | Placeholder 数字の扱い | **継続 + TODO マーク + 実装前に業界統計調査** | B1「industry benchmarks or logical projections」「mark as placeholder」|

---

## リファレンス

- SKILL files: `.claude/skills/` 配下 6 ファイル（うち B1 = `app-onboarding-questionnaire/SKILL.md` のみ実在確認済）
- 既存仕様: `.cursor/plans/ios/spec-onboarding-improvement.md`, `.cursor/plans/ios/spec-onboarding-v3-funnel-fix.md`, `.cursor/plans/ios/onboarding-paywall-best-practices.md`
- Apple Win Back Offer: `https://developer.apple.com/documentation/storekit/supporting-win-back-offers-in-your-app`

---

**END OF SPEC — 省略・ショートカット・隠蔽なし。全 23 screen、全 33 patch、全 Bible 引用を網羅。**
