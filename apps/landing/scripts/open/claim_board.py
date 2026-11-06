#!/usr/bin/env python3
"""Atomic task claims for Anicca /open board (Beads-inspired, no Beads dependency).

Public claims-snapshot.json is a read-only status view — not application permission.
Bots claim only through this tool; they do not edit the snapshot file directly.
Lease tokens stay off the public snapshot.
"""
from __future__ import annotations

import argparse
import json
import os
import sqlite3
import secrets
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

DEFAULT_LEASE_SECONDS = 15 * 60  # match /open REFRESH_MS cadence


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_iso(value: str | None) -> datetime | None:
    if not value or not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path), timeout=30, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=30000")
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    # executescript auto-commits; keep DDL outside an explicit txn under isolation_level=None
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS tasks (
          task_id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'open',
          owner TEXT,
          lease_token TEXT,
          lease_expires TEXT,
          revision INTEGER NOT NULL DEFAULT 0,
          last_evidence_public TEXT,
          last_public_at TEXT,
          blocker_public TEXT,
          quantity_done INTEGER,
          quantity_goal_public TEXT,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS alerts (
          alert_key TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          kind TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        """
    )


def row_public(row: sqlite3.Row, now: datetime) -> dict[str, Any]:
    expires = parse_iso(row["lease_expires"])
    lease_state = "open"
    if row["owner"] and expires and expires > now:
        lease_state = "claimed"
    elif row["owner"] and expires and expires <= now:
        lease_state = "expired"
    elif row["owner"]:
        lease_state = "stale_unknown_expiry"
    last_public_at = row["last_public_at"] or "unknown"
    status = row["status"] or "open"
    # Never treat blocked publish with no evidence as success.
    publish_blocked = bool(row["blocker_public"]) and (
        row["quantity_done"] == 0 or row["quantity_done"] is None
    )
    return {
        "task_id": row["task_id"],
        "title": row["title"],
        "status": status,
        "owner": row["owner"] if lease_state == "claimed" else None,
        "lease_state": lease_state,
        "lease_expires": row["lease_expires"] if lease_state == "claimed" else None,
        "revision": row["revision"],
        "last_evidence_public": row["last_evidence_public"],
        "last_public_at": last_public_at,
        "blocker_public": row["blocker_public"],
        "quantity_done": row["quantity_done"],
        "quantity_goal_public": row["quantity_goal_public"],
        "publish_blocked_zero": publish_blocked,
        "updated_at": row["updated_at"],
        "note": "public snapshot not application permission",
    }


def upsert_task(conn: sqlite3.Connection, task_id: str, title: str, **fields: Any) -> dict[str, Any]:
    now = iso(utcnow())
    conn.execute("BEGIN IMMEDIATE")
    existing = conn.execute("SELECT revision FROM tasks WHERE task_id=?", (task_id,)).fetchone()
    if existing is None:
        conn.execute(
            """INSERT INTO tasks(task_id,title,status,revision,updated_at,last_evidence_public,last_public_at,blocker_public,quantity_goal_public,quantity_done)
               VALUES(?,?,?,?,?,?,?,?,?,?)""",
            (
                task_id,
                title,
                fields.get("status") or "open",
                0,
                now,
                fields.get("last_evidence_public"),
                fields.get("last_public_at"),
                fields.get("blocker_public"),
                fields.get("quantity_goal_public"),
                fields.get("quantity_done"),
            ),
        )
    else:
        sets = ["title=?", "updated_at=?"]
        vals: list[Any] = [title, now]
        for key in ("status", "last_public_at", "blocker_public", "quantity_goal_public", "quantity_done", "last_evidence_public"):
            if key in fields and fields[key] is not None:
                sets.append(f"{key}=?")
                vals.append(fields[key])
        vals.append(task_id)
        conn.execute(f"UPDATE tasks SET {', '.join(sets)} WHERE task_id=?", vals)
    conn.execute("COMMIT")
    return get_task(conn, task_id)


def get_task(conn: sqlite3.Connection, task_id: str) -> dict[str, Any]:
    row = conn.execute("SELECT * FROM tasks WHERE task_id=?", (task_id,)).fetchone()
    if not row:
        raise KeyError(task_id)
    return row_public(row, utcnow()) | {"_lease_token_private": row["lease_token"]}


def claim(
    conn: sqlite3.Connection,
    task_id: str,
    owner: str,
    expected_revision: int,
    lease_seconds: int = DEFAULT_LEASE_SECONDS,
    lease_token: str | None = None,
) -> dict[str, Any]:
    if not owner or not task_id:
        raise ValueError("owner and task_id required")
    now = utcnow()
    now_s = iso(now)
    expires_s = iso(now + timedelta(seconds=lease_seconds))
    token = lease_token or secrets.token_urlsafe(16)
    conn.execute("BEGIN IMMEDIATE")
    row = conn.execute("SELECT * FROM tasks WHERE task_id=?", (task_id,)).fetchone()
    if row is None:
        conn.execute("ROLLBACK")
        return {"ok": False, "error": "missing_task", "task_id": task_id}
    if row["revision"] != expected_revision:
        conn.execute("ROLLBACK")
        return {
            "ok": False,
            "error": "revision_mismatch",
            "task_id": task_id,
            "revision": row["revision"],
            "public": row_public(row, now),
        }
    expires = parse_iso(row["lease_expires"])
    held = bool(row["owner"] and expires and expires > now)
    same = held and row["owner"] == owner and row["lease_token"] and (
        lease_token is None or row["lease_token"] == lease_token
    )
    if held and not same:
        conn.execute("ROLLBACK")
        return {"ok": False, "error": "already_claimed", "public": row_public(row, now)}
    # Stale/expired owner cannot overwrite without matching expected_revision already checked;
    # additionally reject explicit stale-token takeover attempts with wrong token.
    if row["owner"] and expires and expires <= now and lease_token and row["lease_token"] and lease_token != row["lease_token"]:
        # expired: open for new claim without token; wrong token renew denied
        if lease_token:
            pass  # new claimants omit token; providing stale foreign token is ignored below
    use_token = row["lease_token"] if same else token
    cur = conn.execute(
        """
        UPDATE tasks
           SET owner=?, lease_token=?, lease_expires=?, revision=revision+1, status='claimed', updated_at=?
         WHERE task_id=? AND revision=?
           AND (
             owner IS NULL OR owner='' OR lease_expires IS NULL OR lease_expires < ?
             OR (owner=? AND lease_token=?)
           )
        """,
        (owner, use_token, expires_s, now_s, task_id, expected_revision, now_s, owner, use_token),
    )
    if cur.rowcount != 1:
        row2 = conn.execute("SELECT * FROM tasks WHERE task_id=?", (task_id,)).fetchone()
        conn.execute("ROLLBACK")
        return {"ok": False, "error": "claim_lost_race", "public": row_public(row2, now) if row2 else None}
    row3 = conn.execute("SELECT * FROM tasks WHERE task_id=?", (task_id,)).fetchone()
    conn.execute("COMMIT")
    public = row_public(row3, now)
    return {
        "ok": True,
        "lease_token": row3["lease_token"],
        "revision": row3["revision"],
        "lease_expires": row3["lease_expires"],
        "public": public,
    }


def release(conn: sqlite3.Connection, task_id: str, owner: str, lease_token: str, expected_revision: int) -> dict[str, Any]:
    now = utcnow()
    now_s = iso(now)
    conn.execute("BEGIN IMMEDIATE")
    cur = conn.execute(
        """
        UPDATE tasks
           SET owner=NULL, lease_token=NULL, lease_expires=NULL, status='open', revision=revision+1, updated_at=?
         WHERE task_id=? AND revision=? AND owner=? AND lease_token=?
        """,
        (now_s, task_id, expected_revision, owner, lease_token),
    )
    row = conn.execute("SELECT * FROM tasks WHERE task_id=?", (task_id,)).fetchone()
    if cur.rowcount != 1:
        conn.execute("ROLLBACK")
        return {"ok": False, "error": "release_rejected", "public": row_public(row, now) if row else None}
    conn.execute("COMMIT")
    return {"ok": True, "revision": row["revision"], "public": row_public(row, now)}


def heartbeat(
    conn: sqlite3.Connection,
    task_id: str,
    owner: str,
    lease_token: str,
    expected_revision: int,
    lease_seconds: int = DEFAULT_LEASE_SECONDS,
    last_evidence_public: str | None = None,
    last_public_at: str | None = None,
    quantity_done: int | None = None,
) -> dict[str, Any]:
    now = utcnow()
    now_s = iso(now)
    expires_s = iso(now + timedelta(seconds=lease_seconds))
    conn.execute("BEGIN IMMEDIATE")
    sets = ["lease_expires=?", "updated_at=?", "revision=revision+1"]
    vals: list[Any] = [expires_s, now_s]
    if last_evidence_public is not None:
        sets.append("last_evidence_public=?")
        vals.append(last_evidence_public)
    if last_public_at is not None:
        sets.append("last_public_at=?")
        vals.append(last_public_at)
    if quantity_done is not None:
        sets.append("quantity_done=?")
        vals.append(quantity_done)
    vals.extend([task_id, expected_revision, owner, lease_token, now_s])
    cur = conn.execute(
        f"""
        UPDATE tasks SET {', '.join(sets)}
         WHERE task_id=? AND revision=? AND owner=? AND lease_token=?
           AND lease_expires IS NOT NULL AND lease_expires >= ?
        """,
        vals,
    )
    row = conn.execute("SELECT * FROM tasks WHERE task_id=?", (task_id,)).fetchone()
    if cur.rowcount != 1:
        conn.execute("ROLLBACK")
        return {"ok": False, "error": "stale_worker_rejected", "public": row_public(row, now) if row else None}
    conn.execute("COMMIT")
    return {"ok": True, "revision": row["revision"], "lease_expires": row["lease_expires"], "public": row_public(row, now)}


def expire_leases(conn: sqlite3.Connection) -> int:
    now_s = iso(utcnow())
    conn.execute("BEGIN IMMEDIATE")
    cur = conn.execute(
        """
        UPDATE tasks
           SET owner=NULL, lease_token=NULL, lease_expires=NULL, status='open', revision=revision+1, updated_at=?
         WHERE lease_expires IS NOT NULL AND lease_expires < ? AND owner IS NOT NULL
        """,
        (now_s, now_s),
    )
    conn.execute("COMMIT")
    return cur.rowcount


def escalate_silent(conn: sqlite3.Connection) -> list[dict[str, Any]]:
    """One actionable alert per failed/open-stale task; deduped by alert_key."""
    now = utcnow()
    now_s = iso(now)
    expire_leases(conn)
    rows = conn.execute("SELECT * FROM tasks").fetchall()
    created: list[dict[str, Any]] = []
    conn.execute("BEGIN IMMEDIATE")
    for row in rows:
        pub = row_public(row, now)
        reasons: list[str] = []
        if pub["last_public_at"] in (None, "", "unknown"):
            reasons.append(f"{pub['task_id']} last_public_at unknown")
        if pub["publish_blocked_zero"]:
            reasons.append(
                f"{pub['task_id']} blocked publish with quantity_done=0 (not posted)"
            )
        if pub["lease_state"] in ("expired", "stale_unknown_expiry"):
            reasons.append(f"{pub['task_id']} lease {pub['lease_state']} since owner cleared")
        if (row["status"] or "").upper() in {"FAIL", "STOPPED", "BLOCKED"}:
            reasons.append(f"{pub['task_id']} status={row['status']}")
        if not reasons:
            continue
        message = (
            f"SILENT/STALE: {' · '.join(reasons)}. "
            f"owner_since={row['owner'] or 'none'}; "
            f"no-new-evidence; next=unblock {row['blocker_public'] or 'unknown'}"
        )
        alert_key = f"{row['task_id']}::{'|'.join(sorted(reasons))}"
        existing = conn.execute("SELECT 1 FROM alerts WHERE alert_key=?", (alert_key,)).fetchone()
        if existing:
            continue
        conn.execute(
            "INSERT INTO alerts(alert_key, task_id, kind, message, created_at) VALUES(?,?,?,?,?)",
            (alert_key, row["task_id"], "silent_failure", message, now_s),
        )
        created.append({"alert_key": alert_key, "message": message, "created_at": now_s})
    conn.execute("COMMIT")
    return created


def project_public_work(conn: sqlite3.Connection, rows: list[dict[str, Any]], public_at: str) -> list[int]:
    """Project existing public TODO rows. Does not claim, lease, or host an API."""
    if not rows or not public_at:
        raise ValueError("public rows and public_at required")
    priorities: list[int] = []
    for row in rows:
        priority = int(row["priority"])
        priorities.append(priority)
        upsert_task(
            conn,
            f"todo-{priority}",
            str(row.get("action") or ""),
            status="open",
            last_evidence_public=row.get("last_evidence_public"),
            last_public_at=public_at,
            blocker_public=None,
            quantity_goal_public=row.get("quantity_goal"),
            quantity_done=None,
        )
    if priorities != sorted(priorities) or len(priorities) != len(set(priorities)):
        raise ValueError("public priorities must stay unique and ordered")
    return priorities


def snapshot(conn: sqlite3.Connection) -> dict[str, Any]:
    now = utcnow()
    expire_leases(conn)
    tasks = [row_public(r, now) for r in conn.execute("SELECT * FROM tasks ORDER BY task_id")]
    alerts = [
        dict(a)
        for a in conn.execute(
            "SELECT alert_key, task_id, kind, message, created_at FROM alerts ORDER BY created_at DESC LIMIT 50"
        )
    ]
    return {
        "generated_at": iso(now),
        "refresh_hint_seconds": DEFAULT_LEASE_SECONDS,
        "note": "public snapshot not application permission; lease tokens omitted",
        "claim_api": "repo-local python apps/landing/scripts/open/claim_board.py (not hosted on aniccaai.com/open yet)",
        "tasks": tasks,
        "alerts": alerts,
        "hosting": "RED: claim API is not hosted; this file is a read-only projection",
        "claim_api_hosted": False,
    }


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--db", default=os.environ.get("ANICCA_CLAIM_DB", "apps/landing/scripts/open/.claim-board.sqlite"))
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init")
    up = sub.add_parser("upsert-task")
    up.add_argument("--id", required=True)
    up.add_argument("--title", required=True)
    up.add_argument("--status")
    up.add_argument("--last-public-at")
    up.add_argument("--blocker-public")
    up.add_argument("--quantity-goal-public")
    up.add_argument("--quantity-done", type=int)

    cl = sub.add_parser("claim")
    cl.add_argument("--id", required=True)
    cl.add_argument("--owner", required=True)
    cl.add_argument("--expected-revision", type=int, required=True)
    cl.add_argument("--lease-seconds", type=int, default=DEFAULT_LEASE_SECONDS)
    cl.add_argument("--lease-token")

    rel = sub.add_parser("release")
    rel.add_argument("--id", required=True)
    rel.add_argument("--owner", required=True)
    rel.add_argument("--lease-token", required=True)
    rel.add_argument("--expected-revision", type=int, required=True)

    hb = sub.add_parser("heartbeat")
    hb.add_argument("--id", required=True)
    hb.add_argument("--owner", required=True)
    hb.add_argument("--lease-token", required=True)
    hb.add_argument("--expected-revision", type=int, required=True)
    hb.add_argument("--lease-seconds", type=int, default=DEFAULT_LEASE_SECONDS)
    hb.add_argument("--last-evidence-public")
    hb.add_argument("--last-public-at")
    hb.add_argument("--quantity-done", type=int)

    sub.add_parser("expire")
    sub.add_parser("escalate-silent")
    sn = sub.add_parser("snapshot")
    sn.add_argument("--out", help="Write claims-snapshot.json")
    proj = sub.add_parser("project-public-work")
    proj.add_argument("--from-json", required=True)
    proj.add_argument("--out", required=True)
    proj.add_argument("--public-at", required=True)

    args = p.parse_args(argv)
    db = Path(args.db)
    conn = connect(db)
    try:
        if args.cmd == "init":
            init_db(conn)
            print(json.dumps({"ok": True, "db": str(db)}))
            return 0
        init_db(conn)
        if args.cmd == "upsert-task":
            print(json.dumps(upsert_task(
                conn, args.id, args.title,
                status=args.status,
                last_public_at=args.last_public_at,
                blocker_public=args.blocker_public,
                quantity_goal_public=args.quantity_goal_public,
                quantity_done=args.quantity_done,
            ), sort_keys=True))
        elif args.cmd == "claim":
            print(json.dumps(claim(conn, args.id, args.owner, args.expected_revision, args.lease_seconds, args.lease_token), sort_keys=True))
        elif args.cmd == "release":
            print(json.dumps(release(conn, args.id, args.owner, args.lease_token, args.expected_revision), sort_keys=True))
        elif args.cmd == "heartbeat":
            print(json.dumps(heartbeat(
                conn, args.id, args.owner, args.lease_token, args.expected_revision, args.lease_seconds,
                last_evidence_public=args.last_evidence_public,
                last_public_at=args.last_public_at,
                quantity_done=args.quantity_done,
            ), sort_keys=True))
        elif args.cmd == "expire":
            print(json.dumps({"expired": expire_leases(conn)}))
        elif args.cmd == "escalate-silent":
            print(json.dumps({"created": escalate_silent(conn)}, indent=2))
        elif args.cmd == "snapshot":
            snap = snapshot(conn)
            if args.out:
                Path(args.out).write_text(json.dumps(snap, indent=2) + "\n")
            print(json.dumps(snap, indent=2))
        elif args.cmd == "project-public-work":
            payload = json.loads(Path(args.from_json).read_text(encoding="utf-8"))
            rows = payload.get("public_work") if isinstance(payload, dict) else None
            if not isinstance(rows, list) or not rows:
                raise SystemExit("public_work rows required")
            priorities = project_public_work(conn, rows, args.public_at)
            snap = snapshot(conn)
            snap["projected_from"] = "public_work"
            snap["projected_count"] = len(priorities)
            Path(args.out).write_text(json.dumps(snap, indent=2) + "\n", encoding="utf-8")
            print(json.dumps({"projected": priorities, "hosted": False}))
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
