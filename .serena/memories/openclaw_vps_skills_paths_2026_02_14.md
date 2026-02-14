# OpenClaw VPS スキルパス・同期ルール（2026-02-14）

## スキルが置いてある場所（2つだけ）

1. **メイン（ここを更新する）**  
   `/home/anicca/.openclaw/skills/`  
   - trend-hunter, x-poster, tiktok-poster, x-research など 50+ スキルがここ。
   - repo の `openclaw-skills/*` を反映するときは **必ずこのパスに scp する。**

2. **ワークスペース**  
   `/home/anicca/.openclaw/workspace/skills/`  
   - 中身は daily-metrics-reporter と reddit-cli のみ。
   - x-research は **メイン側** にしかない。workspace に SKILL を送ってもメインの x-research は更新されない。

## Hooks の保存先

`/home/anicca/.openclaw/workspace/hooks/YYYY-MM-DD.json`

## 参照

- 一覧・同期ルール: `.cursor/plans/reference/openclaw-anicca.md` の「8) VPS スキル配置」「8.5) Railway API を叩くスキル」「8.6) 12h サイクル」。
