from __future__ import annotations

import html
import json
import subprocess
from pathlib import Path
from typing import Any


class MaterialError(ValueError):
    pass


def validate_claims(profile: dict[str, Any], items: list[dict[str, Any]]) -> None:
    approved = {fact["id"] for fact in profile.get("facts", [])}
    for item in items:
        fact_ids = item.get("fact_ids")
        if not isinstance(fact_ids, list) or not fact_ids or not set(fact_ids) <= approved:
            raise MaterialError("every claim must reference approved fact IDs")
        text = str(item.get("text", ""))
        if "mufg" in {value.casefold() for value in fact_ids}:
            lowered = text.casefold()
            if "led the entire" in lowered or "single-handed" in lowered:
                raise MaterialError("MUFG ownership wording is not approved")


def render_resume_html(
    profile: dict[str, Any],
    sections: list[dict[str, Any]],
    *,
    links: list[tuple[str, str]],
    include_date_of_birth: bool = False,
) -> str:
    all_items = [item for section in sections for item in section.get("items", [])]
    validate_claims(profile, all_items)
    name = html.escape(profile["candidate"]["name"])
    body: list[str] = []
    for section in sections:
        body.append(f"<section><h2>{html.escape(section['heading'])}</h2><ul>")
        for item in section.get("items", []):
            body.append(f"<li>{html.escape(item['text'])}</li>")
        body.append("</ul></section>")
    link_html = " · ".join(
        f'<a href="{html.escape(url, quote=True)}">{html.escape(label)}</a>'
        for label, url in links
    )
    candidate = profile["candidate"]
    contact_values = [
        candidate.get("application_email"),
        candidate.get("phone"),
        candidate.get("base"),
    ]
    if include_date_of_birth and candidate.get("date_of_birth"):
        contact_values.append(f"Date of birth: {candidate['date_of_birth']}")
    contact_html = " · ".join(
        html.escape(str(value)) for value in contact_values if value
    )
    return f"""<!doctype html>
<html><head><meta charset="utf-8"><style>
@page {{ size: A4; margin: 12mm 14mm; }}
body {{ font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
       color: #111827; font-size: 9.2pt; line-height: 1.28; }}
main {{ display: grid; grid-template-columns: 1fr; gap: 3px; }}
h1 {{ font-size: 22pt; margin: 0; }} h2 {{ font-size: 11pt; text-transform: uppercase;
letter-spacing: .08em; border-bottom: 1px solid #9ca3af; margin: 7px 0 3px; }}
p, ul {{ margin: 2px 0; }} ul {{ padding-left: 17px; }} li {{ margin: 1.5px 0; }}
a {{ color: #1d4ed8; text-decoration: none; }}
</style></head><body><main>
<header><h1>{name}</h1><p><strong>Applied AI & Agent Engineer</strong> — regulated
enterprise deployment, research, and consumer AI products</p>
<p>{contact_html}</p><p>{link_html}</p></header>
{''.join(body)}
</main></body></html>"""


def master_sections(profile: dict[str, Any]) -> list[dict[str, Any]]:
    facts = {fact["id"]: fact["claim"] for fact in profile["facts"]}
    groups = [
        (
            "Enterprise AI — MUIT / MUFG (2025–Present)",
            ["muit_agent_crm", "muit_genie_logs", "muit_rm_summary", "mufg"],
        ),
        (
            "Consumer AI Products",
            ["anicca_consumer", "life_manager"],
        ),
        (
            "Research & Leadership — NAIST / ATR (2024–2026)",
            ["naist", "atr_research", "agent_club", "iclr"],
        ),
        ("Earlier Growth Experience", ["a10_marketing"]),
        ("Education & Languages", ["education", "languages"]),
    ]
    return [
        {
            "heading": heading,
            "items": [
                {"text": facts[fact_id], "fact_ids": [fact_id]}
                for fact_id in fact_ids
                if fact_id in facts
            ],
        }
        for heading, fact_ids in groups
    ]


def render_master(profile_path: Path, output_dir: Path) -> tuple[Path, Path]:
    profile = json.loads(profile_path.read_text(encoding="utf-8"))
    links = [
        ("Portfolio", "https://aniccaai.com/dais"),
        ("ICLR 2026 report", "https://www.youtube.com/watch?v=biHAQ6aSQuc"),
        ("Life Manager", "https://aniccaai.com/life-manager"),
    ]
    rendered = render_resume_html(profile, master_sections(profile), links=links)
    output_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    html_path = output_dir / "Daisuke_Narita_AI_Resume.html"
    pdf_path = output_dir / "Daisuke_Narita_AI_Resume.pdf"
    html_path.write_text(rendered, encoding="utf-8")
    subprocess.run(["weasyprint", str(html_path), str(pdf_path)], check=True)
    extracted = subprocess.run(
        ["pdftotext", str(pdf_path), "-"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    for required in ("Daisuke Narita", "MUIT", "NAIST", "Applied AI"):
        if required not in extracted:
            raise MaterialError(f"PDF missing required ATS text: {required}")
    return html_path, pdf_path
