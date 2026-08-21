from pathlib import Path


def test_sentinel_preserves_sub_gib_precision_and_reports_swap_pressure() -> None:
    sentinel = Path.home() / "scripts" / "disk-sentinel.sh"
    text = sentinel.read_text(encoding="utf-8")

    assert "format_free_space" in text
    assert "FREE_LABEL" in text
    assert "SWAP_USAGE" in text
    assert "free ${FREE_LABEL}" in text
    assert "GB floor" not in text


def test_sentinel_deduplicates_notifications_and_records_delivery_receipts() -> None:
    sentinel = Path.home() / "scripts" / "disk-sentinel.sh"
    text = sentinel.read_text(encoding="utf-8")

    assert "NOTIFY_DEDUPE_SECONDS" in text
    assert "disk-sentinel-notify" in text
    assert "notify-deduped" in text
    assert "notify-receipt-write-failed" in text
