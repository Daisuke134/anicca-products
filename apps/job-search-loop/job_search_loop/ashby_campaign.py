from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path
from typing import Any

from .dedup import company_key, role_key
from .ledger import Ledger
from .state import canonical_url


JAPAN_RE = re.compile(r"japan|tokyo|日本|東京", re.IGNORECASE)
TARGET_RE = re.compile(
    r"deployment|forward deployed|solutions? architect|solutions? engineer|"
    r"field engineering|account (?:executive|director|associate)|partnerships?|"
    r"channel|customer success|success engineer|growth lead|marketing lead|gtm operations",
    re.IGNORECASE,
)
EXCLUDE_RE = re.compile(
    r"legal|counsel|recruit(?:er|ing)|office manager|compliance", re.IGNORECASE
)


def _priority(title: str) -> tuple[int, str]:
    folded = title.casefold()
    if any(value in folded for value in ("deployment", "forward deployed", "solutions", "field engineering")):
        return (0, folded)
    if any(value in folded for value in ("customer success", "success engineer", "partnership")):
        return (1, folded)
    return (2, folded)


def _bucket(title: str) -> str:
    folded = title.casefold()
    if any(value in folded for value in ("deployment", "forward deployed", "solutions", "field engineering")):
        return "strong_fit"
    if "manager" in folded or "director" in folded:
        return "dream"
    return "adjacent"


def build_campaign(
    *, cache_path: Path, ledger_path: Path, output_path: Path, limit: int,
    authorization_reason: str,
) -> dict[str, Any]:
    cache = json.loads(Path(cache_path).read_text(encoding="utf-8"))
    jobs = cache.get("jobs") if isinstance(cache, dict) else None
    if not isinstance(jobs, list):
        raise ValueError("official ATS cache has no jobs")

    ledger = Ledger(ledger_path)
    try:
        owned_rows = ledger.connection.execute(
            "SELECT company, title, canonical_url FROM applications"
        ).fetchall()
        owned_urls = {canonical_url(str(row["canonical_url"])) for row in owned_rows}
        owned_roles = {
            (company_key(row["company"]), role_key(row["title"])) for row in owned_rows
        }
        resume_reports = ledger.submitted_resume_reports()
    finally:
        ledger.close()
    if not resume_reports:
        raise ValueError("no verified submitted resume is available")
    resume_path = Path(resume_reports[-1]["resume_path"]).expanduser().resolve()
    if not resume_path.is_file():
        raise ValueError("verified submitted resume is missing")

    selected: list[dict[str, Any]] = []
    for job in jobs:
        if not isinstance(job, dict) or job.get("ats") != "ashby":
            continue
        company = str(job.get("company") or "").strip()
        title = str(job.get("title") or "").strip()
        location = str(job.get("location") or "").strip()
        url = canonical_url(str(job.get("url") or "").strip())
        if not company or not title or not url or not JAPAN_RE.search(f"{location} {title}"):
            continue
        if EXCLUDE_RE.search(title) or not TARGET_RE.search(title):
            continue
        if url in owned_urls or (company_key(company), role_key(title)) in owned_roles:
            continue
        selected.append(
            {
                "version": 1,
                "mode": "submit",
                "company": company,
                "title": title,
                "official_url": url,
                "resume_path": str(resume_path),
                "portfolio_bucket": _bucket(title),
                "user_authorized_overflow": True,
                "overflow_reason": authorization_reason,
            }
        )
    selected.sort(key=lambda item: (_priority(item["title"]), item["company"].casefold()))
    campaign = {
        "version": 1,
        "mode": "submit",
        "status": "ready" if selected else "exhausted",
        "candidates": selected[:limit],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    output_path.write_text(
        json.dumps(campaign, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    os.chmod(output_path, 0o600)
    return campaign


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, required=True)
    parser.add_argument("--ledger", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--limit", type=int, default=12)
    parser.add_argument("--authorization-reason", required=True)
    args = parser.parse_args(argv)
    result = build_campaign(
        cache_path=args.cache,
        ledger_path=args.ledger,
        output_path=args.output,
        limit=args.limit,
        authorization_reason=args.authorization_reason,
    )
    print(json.dumps({"status": result["status"], "candidate_count": len(result["candidates"])}))
    return 0 if result["candidates"] else 75


if __name__ == "__main__":
    raise SystemExit(main())
