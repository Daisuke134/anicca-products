"""ebook_article_daily.py -- free aniccaai.com articles that sell The Anicca Reset (GitHub Actions port).

Moved off the Mac mini (ai.anicca.ebook-articles, 2026-11-02). Same slots (01/02/04/05 JST),
same products, prompts, slug (<product>-<YYYY-MM-DD>-<HH>) and output file
(apps/landing/data/research/<slug>.json). The once-per-slot guard is the slug file itself:
if it already exists in the repo, the run is a no-op. The model writes title/body via
OpenRouter free models; code owns the slug, the single checkout link and the PII check.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

JST = ZoneInfo("Asia/Tokyo")
RESEARCH = Path("apps/landing/data/research")
SLOT_PRODUCTS = {1: "ebook-en", 2: "ebook-ja", 4: "ebook-en", 5: "ebook-ja"}
PRODUCTS = {
    "ebook-en": {
        "language": "en", "destination_url": "https://aniccaai.com/monk", "cta": "Read The Anicca Reset",
        "approved_claims": ["English-language guided reflection ebook",
                            "Digital access is sold through the owned checkout page"],
        "audiences": ["English readers seeking practical reflection exercises"],
    },
    "ebook-ja": {
        "language": "ja", "destination_url": "https://aniccaai.com/achan", "cta": "『アニッチャ・リセット』を読む",
        "approved_claims": ["Japanese-language guided reflection ebook",
                            "Digital access is sold through the owned checkout page"],
        "audiences": ["実践的な内省の問いを求める日本語読者"],
    },
}
MODELS = [m for m in os.environ.get("OPENROUTER_MODELS", "").split(",") if m] or [
    "nvidia/nemotron-3.5-super-vl:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
]
RECENT_TITLES = 20


def prompt_for(product: dict, recent_titles: list[str]) -> str:
    claims = "; ".join(product["approved_claims"])
    avoid = "\n".join(f"- {t}" for t in recent_titles) or "- (none yet)"
    fmt = '\nReturn ONLY a JSON object {"title": "...", "body": "..."} with no code fence.'
    if product["language"] == "ja":
        return (
            "日本語で無料のブログ記事を1本書く。読者は「" + "、".join(product["audiences"]) + "」。"
            "売れている個人作家と同じ形にする: 本のテーマ（無常・内省・心を整える日々の問い）から、読者が今日"
            "そのまま試せる具体的な内省の方法や問いを1つ選び、手順と例で役に立つ記事にする。"
            "800〜1200文字、見出しは「## 」で2〜4個、絵文字なし、誇張や効果の約束はしない。"
            "URLは書かない（リンクはコード側で付ける）。AIであることや運営者名は書かない。"
            f"本について書いてよい事実はこれだけ: {claims}。\n"
            f"次のタイトルと同じテーマは避ける:\n{avoid}\n"
            "title は記事タイトル（32文字以内）、body は本文のMarkdown（H1なし）。" + fmt
        )
    return (
        "Write one free blog article in English for: " + "; ".join(product["audiences"]) + ". "
        "Copy what selling indie authors do: pick one concrete reflection practice or question from "
        "the book's theme (impermanence, everyday self-reflection, calming the mind) that the reader "
        "can try today, and make the article useful on its own with steps and an example. "
        "700-1100 words, 2-4 headings with '## ', no emoji, no hype or promised outcomes. "
        "Write no URL (code adds the link). Never mention AI or the operator. "
        f"The only facts you may state about the book: {claims}.\n"
        f"Avoid the topics of these earlier titles:\n{avoid}\n"
        "title is the article title (max 70 characters); body is the Markdown body (no H1)." + fmt
    )


def _parse(content: str) -> dict:
    content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip())
    start, end = content.find("{"), content.rfind("}")
    return json.loads(content[start:end + 1])


def compose(prompt: str) -> dict:
    key = os.environ["OPENROUTER_API_KEY"]
    errors = []
    for _round in range(3):
        for model in MODELS:
            body = json.dumps({"model": model, "messages": [{"role": "user", "content": prompt}],
                               "response_format": {"type": "json_object"}}).encode()
            req = urllib.request.Request(
                "https://openrouter.ai/api/v1/chat/completions", data=body,
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json",
                         "HTTP-Referer": "https://aniccaai.com", "X-Title": "aniccaai ebook-articles"})
            try:
                data = json.load(urllib.request.urlopen(req, timeout=240))
                result = _parse(data["choices"][0]["message"]["content"])
                if result.get("title", "").strip() and len(result.get("body", "")) >= 400:
                    print(f"composed with {model}", file=sys.stderr)
                    return result
                errors.append(f"{model}: contract_invalid")
            except urllib.error.HTTPError as e:
                errors.append(f"{model}: HTTP {e.code}")
            except Exception as e:  # noqa: BLE001
                errors.append(f"{model}: {type(e).__name__}")
        time.sleep(30)
    raise RuntimeError("compose_failed: " + "; ".join(errors[-8:]))


PII = [re.compile(p) for p in (r"[\w.+-]+@[\w-]+\.[\w.]+", r"\b0\d{1,4}-\d{1,4}-\d{3,4}\b",
                                r"\+\d{1,3}[\s-]?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}", r"https?://")]


def pii_ok(text: str) -> bool:
    return not any(p.search(text) for p in PII)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--hour", type=int, default=None, help="JST slot hour (default: now)")
    ap.add_argument("--product", default=None)
    ap.add_argument("--repo-root", default=".")
    args = ap.parse_args(argv)
    now = dt.datetime.now(JST)
    hour = now.hour if args.hour is None else args.hour
    product_id = args.product or SLOT_PRODUCTS.get(hour)
    if product_id is None:
        print(json.dumps({"ebook_article_daily": {"state": "not_due", "hour": hour}}))
        return 0
    product = PRODUCTS[product_id]
    slug = f"{product_id}-{now.date().isoformat()}-{hour:02d}"
    root = Path(args.repo_root)
    target = root / RESEARCH / f"{slug}.json"
    out = os.environ.get("GITHUB_OUTPUT")
    if target.exists():  # once-per-slot guard
        print(json.dumps({"ebook_article_daily": {"state": "already_published", "slug": slug}}))
        return 0
    recent = []
    for f in sorted((root / RESEARCH).glob(f"{product_id}-*.json")):
        try:
            recent.append(json.loads(f.read_text(encoding="utf-8"))["title"])
        except Exception:  # noqa: BLE001
            pass
    article = compose(prompt_for(product, recent[-RECENT_TITLES:]))
    title, body = article["title"].strip(), article["body"].strip()
    body = re.sub(r"^#\s+.*\n+", "", body)
    if not pii_ok(title + "\n" + body):
        raise SystemExit("pii_gate_blocked")
    markdown = f"# {title}\n\n{body}\n\n[{product['cta']}]({product['destination_url']})\n"
    record = {"slug": slug, "title": title, "date": now.date().isoformat(), "project": "capafy-distribute",
              "n_papers_cited": 0, "word_count": len(markdown.split()), "markdown": markdown}
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    url = f"https://aniccaai.com/blog/{slug}"
    if out:
        with open(out, "a", encoding="utf-8") as fh:
            fh.write(f"slug={slug}\nurl={url}\npath={target.relative_to(root)}\n")
    print(json.dumps({"ebook_article_daily": {"status": "staged", "slug": slug, "url": url, "title": title}},
                     ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
