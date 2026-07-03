"""RED (VSDD): analytics_writer does not exist yet — these tests must fail first."""
import json
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def test_append_writes_one_valid_line():
    from lib.analytics_writer import append_metric  # REQ-002

    with tempfile.TemporaryDirectory() as d:
        path = Path(d) / "test-slug.jsonl"
        append_metric(str(path), slug="test-slug", source="stripe", metrics={"foo": 1})
        lines = path.read_text().strip().split("\n")
        assert len(lines) == 1
        rec = json.loads(lines[0])
        assert rec["slug"] == "test-slug"
        assert rec["source"] == "stripe"
        assert rec["metrics"] == {"foo": 1}
        assert "ts" in rec and rec["ts"].endswith("Z")


def test_append_is_append_only_not_overwrite():  # REQ-002/003
    from lib.analytics_writer import append_metric

    with tempfile.TemporaryDirectory() as d:
        path = Path(d) / "test-slug.jsonl"
        append_metric(str(path), slug="test-slug", source="stripe", metrics={"n": 1})
        first_bytes = path.read_bytes()
        append_metric(str(path), slug="test-slug", source="stripe", metrics={"n": 2})
        lines = path.read_text().strip().split("\n")
        assert len(lines) == 2
        # old line byte-identical (never rewritten)
        assert path.read_bytes().startswith(first_bytes)


def test_append_rejects_missing_required_fields():  # REQ-002 schema
    from lib.analytics_writer import append_metric

    with tempfile.TemporaryDirectory() as d:
        path = Path(d) / "test-slug.jsonl"
        try:
            append_metric(str(path), slug="", source="stripe", metrics={})
            assert False, "should have raised on empty slug"
        except ValueError:
            pass
        assert not path.exists() or path.read_text() == ""


def test_route_product_reads_config_not_inline_judgment():  # REQ-004
    from lib.product_router import resolve_source

    with tempfile.TemporaryDirectory() as d:
        cfg_path = Path(d) / "products.json"
        cfg_path.write_text(json.dumps({"acme": {"source": "stripe"}}))
        assert resolve_source(str(cfg_path), "acme") == "stripe"
        try:
            resolve_source(str(cfg_path), "undeclared-slug")
            assert False, "should raise for an undeclared slug rather than guessing"
        except KeyError:
            pass
