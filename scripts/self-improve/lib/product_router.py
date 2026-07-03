"""Per-product routing config reader (REQ-004).

The mapping of "which product uses which billing rail" is a FACT about the
product, recorded once in products.json — not re-derived by inline per-script
judgment each run (that would be the hardcoded-classifier anti-pattern
building-effective-ai-agents.md warns against for judgment; this is plain
static-fact lookup, not judgment).
"""
import json


def resolve_source(config_path: str, slug: str) -> str:
    """Return the declared `source` for slug. Raises KeyError for an undeclared slug
    rather than guessing (REQ-004's own text)."""
    with open(config_path, encoding="utf-8") as f:
        config = json.load(f)
    if slug not in config:
        raise KeyError(f"product slug '{slug}' is not declared in {config_path}")
    return config[slug]["source"]
