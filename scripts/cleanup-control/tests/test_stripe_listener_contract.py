from pathlib import Path


def test_stripe_event_ledger_rotation_is_atomic_and_preserves_archives() -> None:
    listener = Path.home() / ".openclaw/skills/stripe-revenue-listener/scripts/listen.sh"
    text = listener.read_text(encoding="utf-8")

    assert "MAX_EVENTS_BYTES" in text
    assert "rotate_events_if_needed" in text
    assert "recover_rotating" in text
    assert "events-*.jsonl.rotating" in text
    assert "gzip -c" in text
    assert 'mv "$EVENTS" "$rotating"' in text
    assert 'rm -f "$rotating"' in text
    assert "EVENTS_LOCK" in text
    assert "acquire_events_lock" in text
    assert "append_event" in text
    assert "rotate_events_if_needed" in text
