"""Per-product routing config reader (REQ-004).

The mapping of "which product uses which billing rail" is a FACT about the
product, recorded once in products.json — not re-derived by inline per-script
judgment each run (that would be the hardcoded-classifier anti-pattern
building-effective-ai-agents.md warns against for judgment; this is plain
static-fact lookup, not judgment).
"""
import json


def resolve_source(config_path: str, slug: str) -> str:
    """Return the declared `source` for slug. Raises KeyError for an undeclared slug,
    or for a declared slug missing its `source` field — both are "don't guess"
    failures (REQ-004's own text), with a message that distinguishes the two cases
    rather than a bare crash (adversary finding, Phase 3 review)."""
    with open(config_path, encoding="utf-8") as f:
        config = json.load(f)
    if slug not in config:
        raise KeyError(f"product slug '{slug}' is not declared in {config_path}")
    entry = config[slug]
    if "source" not in entry:
        raise KeyError(f"product slug '{slug}' is declared in {config_path} but has no 'source' field")
    return entry["source"]
