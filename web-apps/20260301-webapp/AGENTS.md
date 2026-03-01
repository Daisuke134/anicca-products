# AGENTS.md — webapp-factory 学習記録

## Critical Mistakes（3回以上繰り返したエラー）

<!-- Evolution: 2026-03-01 | source: v1-test-run | skill: webapp-factory -->
- **alert() プレースホルダー使用**: Stripe Checkout を `alert("coming soon")` で代替した。全ての機能を実装するか、実装しないなら含めない。初出: 2026-03-01, 回数: 1

## Evolution Log

<!-- Evolution: 2026-03-01 | source: v1-test-run | skill: webapp-factory -->
- prompt.md が存在しないと Claude Code は自己判断で動く → prompt.md は起動前に必ず作成する
- system event 報告がないと Anicca は進捗を把握できない → 全 US に START/DONE/ERROR を必須化
- git push なしだと成果物が消失する → 各 US 完了時に git push 強制
- `alert()` を使うと L0 Gate で検出不可能だった → L0 Gate に `alert(` を追加
- Stripe Product/Price を API で作成しないと Checkout が動かない → US-002 で curl で作成必須

<!-- Evolution: 2026-03-01 | source: v1-test-run | skill: webapp-factory -->
- Server Action が 2026 Next.js 標準 → `/api/checkout` route handler ではなく Server Action を使う

## Correction Log

<!-- Correction: 2026-03-01 | was: "alert() でプレースホルダー" | reason: 本番コードに alert() は絶対禁止 -->
- alert() → Server Action で Stripe Checkout Session を作成してリダイレクト

<!-- Correction: 2026-03-01 | was: "/api/checkout route handler" | reason: Server Action が 2026 Next.js 標準 -->
- Route Handler → Server Action（`"use server"` + `stripe.checkout.sessions.create`）
