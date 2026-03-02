# US-004: Specification Generation

Source: rshankras implementation-spec (orchestrator)
URL: https://github.com/rshankras/claude-code-apple-skills/blob/main/skills/product/implementation-spec/SKILL.md

## Skills to Read
1. `.claude/skills/implementation-spec/SKILL.md` — rshankras orchestrator (reads sub-skills automatically)

## Process
Input: spec/01-trend.md + product-plan.md + competitive-analysis.md + market-research.md

6 sub-phases (implementation-spec orchestrates all):
1. prd-generator → docs/PRD.md (app_name, bundle_id, prices, metadata, screens)
2. architecture-spec → docs/ARCHITECTURE.md
3. ux-spec → docs/UX_SPEC.md + docs/DESIGN_SYSTEM.md
4. implementation-guide → docs/IMPLEMENTATION_GUIDE.md (task list)
5. test-spec → docs/TEST_SPEC.md
6. release-spec → docs/RELEASE_SPEC.md

## Output
`docs/` に 7 ファイル

## CRITICAL
- docs/PRD.md MUST contain: app_name, bundle_id, subscription prices (monthly + annual)
- docs/IMPLEMENTATION_GUIDE.md MUST reference RevenueCat SDK (not Mock)
- docs/PRD.md の prices は US-005 で IAP 作成に使われる

## Acceptance Criteria
- docs/PRD.md exists and contains app_name, bundle_id, subscription prices
- docs/ARCHITECTURE.md exists
- docs/UX_SPEC.md exists
- docs/DESIGN_SYSTEM.md exists
- docs/IMPLEMENTATION_GUIDE.md exists and references RevenueCat SDK (not Mock)
- docs/TEST_SPEC.md exists
- docs/RELEASE_SPEC.md exists
