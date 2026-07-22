#!/usr/bin/env python3
"""Sequentially publish and verify the Orca Zenn JA/EN articles.

This is a narrow operational finalizer. It never writes article prose. It waits
for Zenn's rolling window, retriggers exactly one missing slug, and records live
HTTP/API/render evidence. Repeated invocations are idempotent.
"""

from __future__ import annotations

import fcntl
import json
import os
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


JA_SLUG = "orca-iphone-ai-development-ja"
EN_SLUG = "orca-iphone-ai-development-en"
SLUGS = (JA_SLUG, EN_SLUG)
USERNAME = "anicca"
API_URL = f"https://zenn.dev/api/articles?username={USERNAME}&order=latest"
REPO_URL = "git@github.com:Daisuke134/zenn-articles.git"
STATE_DIR = Path.home() / ".local/share/anicca/orca-zenn-finalizer"
STATE_PATH = STATE_DIR / "state.json"
LOG_PATH = STATE_DIR / "finalizer.log"
SUCCESS_PATH = STATE_DIR / "success.marker"
BLOCKER_PATH = STATE_DIR / "blocker.json"
LOCK_PATH = STATE_DIR / "run.lock"
SCREENSHOT_DIR = Path.home() / ".cloak/note-work"
WINDOW_BUFFER = timedelta(seconds=10)
RETRY_BACKOFF_SECONDS = 20 * 60
MAX_PUSH_ATTEMPTS = 3


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def log(message: str) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(f"{iso_now()} {message}\n")


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(tmp, path)


def load_state() -> dict[str, Any]:
    if not STATE_PATH.exists():
        return {"attempts": {}, "next_attempt_epoch": {}}
    value = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    return value if isinstance(value, dict) else {"attempts": {}, "next_attempt_epoch": {}}


def parse_time(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def live_slugs(api: dict[str, Any]) -> set[str]:
    return {
        row["slug"]
        for row in api.get("articles", [])
        if isinstance(row, dict) and row.get("slug") in SLUGS
    }


def plan(api: dict[str, Any], now: datetime) -> dict[str, Any]:
    live = live_slugs(api)
    if JA_SLUG not in live:
        target = JA_SLUG
    elif EN_SLUG not in live:
        target = EN_SLUG
    else:
        return {"action": "done"}

    published = [
        parse_time(row["published_at"])
        for row in api.get("articles", [])
        if isinstance(row, dict) and isinstance(row.get("published_at"), str)
    ]
    if not published:
        return {"action": "retry", "slug": target}
    retry_at = max(published) + timedelta(hours=24) + WINDOW_BUFFER
    if now < retry_at:
        return {"action": "wait", "slug": target, "retry_at": retry_at.isoformat()}
    return {"action": "retry", "slug": target}


def fetch_api() -> dict[str, Any]:
    request = urllib.request.Request(API_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        value = json.load(response)
    if not isinstance(value, dict):
        raise RuntimeError("Zenn API did not return an object")
    return value


def http_code(url: str) -> int:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return int(response.status)
    except urllib.error.HTTPError as error:
        return int(error.code)


def git_retry(slug: str) -> str:
    temp_root = Path(tempfile.mkdtemp(prefix="orca-zenn-finalizer-"))
    try:
        repo = temp_root / "repo"
        env = os.environ.copy()
        env["GIT_SSH_COMMAND"] = (
            f"ssh -i {Path.home() / '.ssh/id_ed25519'} -o IdentitiesOnly=yes"
        )
        subprocess.run(
            ["git", "clone", "--depth", "1", REPO_URL, str(repo)],
            check=True,
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )
        source = repo / "articles" / f"{slug}.md"
        body = source.read_text(encoding="utf-8")
        if "published: false" in body:
            source.write_text(body.replace("published: false", "published: true", 1), encoding="utf-8")
            changed = True
        elif "published: true" in body:
            changed = False
        else:
            raise RuntimeError(f"missing published frontmatter for {slug}")

        subprocess.run(["git", "-C", str(repo), "config", "user.name", "anicca"], check=True)
        subprocess.run(
            ["git", "-C", str(repo), "config", "user.email", "anicca@aniccaai.com"], check=True
        )
        if changed:
            subprocess.run(["git", "-C", str(repo), "add", f"articles/{slug}.md"], check=True)
            message = f"article(publish): {slug} LIVE"
            subprocess.run(["git", "-C", str(repo), "commit", "-m", message], check=True)
        else:
            message = f"article(retry): {slug} after Zenn rate window"
            subprocess.run(["git", "-C", str(repo), "commit", "--allow-empty", "-m", message], check=True)
        commit = subprocess.run(
            ["git", "-C", str(repo), "rev-parse", "HEAD"],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
        subprocess.run(
            ["git", "-C", str(repo), "push", "origin", "HEAD:main"],
            check=True,
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )
        return commit
    finally:
        shutil.rmtree(temp_root, ignore_errors=True)


def screenshot(slug: str) -> dict[str, Any]:
    from playwright.sync_api import sync_playwright

    url = f"https://zenn.dev/{USERNAME}/articles/{slug}"
    out = SCREENSHOT_DIR / f"verify-{slug}.png"
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.new_page()
        try:
            page.goto(url, wait_until="networkidle", timeout=60_000)
            page.wait_for_timeout(3_000)
            evidence = {
                "url": page.url,
                "title": page.locator("h1").first.inner_text(),
                "h2_count": page.locator("h2").count(),
                "table_count": page.locator("table").count(),
                "mermaid_iframe_count": page.locator('iframe[src*="mermaid"]').count(),
                "broken_image_count": page.locator("img").evaluate_all(
                    "els => els.filter(x => !x.complete || x.naturalWidth === 0).length"
                ),
                "screenshot": str(out),
            }
            page.screenshot(path=str(out), full_page=True)
        finally:
            page.close()
    if evidence["h2_count"] < 1 or evidence["table_count"] < 1:
        raise RuntimeError(f"render structure missing for {slug}: {evidence}")
    if evidence["mermaid_iframe_count"] < 1 or evidence["broken_image_count"] != 0:
        raise RuntimeError(f"render assets failed for {slug}: {evidence}")
    return evidence


def verify_all(api: dict[str, Any]) -> dict[str, Any]:
    evidence: dict[str, Any] = {}
    for slug in SLUGS:
        url = f"https://zenn.dev/{USERNAME}/articles/{slug}"
        code = http_code(url)
        if code != 200 or slug not in live_slugs(api):
            raise RuntimeError(f"not live: slug={slug} http={code}")
        evidence[slug] = {"http": code, "render": screenshot(slug)}
    return evidence


def main() -> int:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    with LOCK_PATH.open("a+") as lock:
        try:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            log("SKIP another finalizer owns lock")
            return 0

        if SUCCESS_PATH.exists():
            log("SKIP success marker exists")
            return 0
        if BLOCKER_PATH.exists():
            log("BLOCKED marker exists")
            return 0

        try:
            api = fetch_api()
            decision = plan(api, datetime.now(timezone.utc))
        except Exception as error:
            log(f"TRANSIENT api_or_plan {type(error).__name__}: {error}")
            return 0

        if decision["action"] == "done":
            try:
                evidence = verify_all(api)
            except Exception as error:
                log(f"WAIT verification {type(error).__name__}: {error}")
                return 0
            atomic_json(STATE_DIR / "live-evidence.json", evidence)
            SUCCESS_PATH.write_text(f"completed_at={iso_now()}\n", encoding="utf-8")
            log("SUCCESS both Zenn languages live and render-verified")
            return 0

        if decision["action"] == "wait":
            log(f"WAIT slug={decision['slug']} retry_at={decision['retry_at']}")
            return 0

        slug = str(decision["slug"])
        state = load_state()
        attempts = int(state.setdefault("attempts", {}).get(slug, 0))
        next_attempt = int(state.setdefault("next_attempt_epoch", {}).get(slug, 0))
        now_epoch = int(time.time())
        if now_epoch < next_attempt:
            log(f"BACKOFF slug={slug} retry_after_epoch={next_attempt}")
            return 0
        if attempts >= MAX_PUSH_ATTEMPTS:
            blocker = {"slug": slug, "attempts": attempts, "blocked_at": iso_now()}
            atomic_json(BLOCKER_PATH, blocker)
            log(f"BLOCKED slug={slug} attempts={attempts}")
            return 0

        try:
            commit = git_retry(slug)
        except Exception as error:
            state["next_attempt_epoch"][slug] = now_epoch + RETRY_BACKOFF_SECONDS
            atomic_json(STATE_PATH, state)
            log(f"TRANSIENT push slug={slug} {type(error).__name__}: {error}")
            return 0

        state["attempts"][slug] = attempts + 1
        state["next_attempt_epoch"][slug] = now_epoch + RETRY_BACKOFF_SECONDS
        state["last_push"] = {"slug": slug, "commit": commit, "at": iso_now()}
        atomic_json(STATE_PATH, state)
        log(f"PUSH slug={slug} attempt={attempts + 1} commit={commit}")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
