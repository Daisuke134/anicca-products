"""Append-only analytics writer for ~/.smtm/analytics/<slug>.jsonl (REQ-002/003).

Deterministic tool: writes exactly what it's given, never fabricates a value,
never rewrites/truncates a prior line. The show-me-the-money REPLACE item
(design spec 2026-07-03-portfolio-self-improve-loop-design.md): deterministic
tools write today's numbers here BEFORE the agent reasons; the agent judges,
this module only fetches/persists.
"""
import json
import time


def append_metric(path: str, *, slug: str, source: str, metrics: dict) -> None:
    """Append one JSON line. Raises ValueError on missing required fields (REQ-002)."""
    if not slug:
        raise ValueError("slug is required")
    if not source:
        raise ValueError("source is required")
    if metrics is None:
        raise ValueError("metrics is required (may be an empty dict, not None)")

    record = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "slug": slug,
        "source": source,
        "metrics": metrics,
    }
    # append-only, one line, flush immediately — no partial-write window
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
        f.flush()
