from pathlib import Path


def test_sentinel_preserves_sub_gib_precision_and_reports_swap_pressure() -> None:
    sentinel = Path.home() / "scripts" / "disk-sentinel.sh"
    text = sentinel.read_text(encoding="utf-8")

    assert "format_free_space" in text
    assert "FREE_LABEL" in text
    assert "SWAP_USAGE" in text
    assert "free ${FREE_LABEL}" in text
