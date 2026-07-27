from __future__ import annotations

import json
import subprocess
from pathlib import Path

from .outbox import Outbox


def send_once(
    *,
    database: Path,
    event_key: str,
    message: str,
    target: str = "8547730585",
    executable: str = "/opt/homebrew/bin/openclaw",
) -> dict[str, str | None]:
    outbox = Outbox(database)
    try:
        outbox.enqueue(event_key, message)
        existing = outbox.status(event_key)
        if existing["status"] == "sent":
            return existing
        fence = outbox.claim(event_key)
        outbox.mark_send_started(event_key, fence)
        completed = subprocess.run(
            [
                executable,
                "message",
                "send",
                "--channel",
                "telegram",
                "--target",
                target,
                "--message",
                outbox.payload(event_key),
                "--json",
            ],
            check=False,
            capture_output=True,
            text=True,
            timeout=60,
        )
        if completed.returncode != 0:
            raise RuntimeError(f"Telegram transport failed rc={completed.returncode}")
        result = json.loads(completed.stdout)
        payload = result.get("payload", {}) if isinstance(result, dict) else {}
        message_id = result.get("messageId") or payload.get("messageId")
        if not message_id:
            raise RuntimeError("Telegram ACK has no message ID")
        outbox.mark_sent(event_key, fence, str(message_id))
        return outbox.status(event_key)
    finally:
        outbox.close()
