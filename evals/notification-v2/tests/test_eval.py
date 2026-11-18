import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("run_eval", Path(__file__).parents[1] / "run_eval.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

def test_report_conditions_are_exactly_eight_profiles_four_slots():
    rows = m.conditions()
    assert len(rows) == 32
    assert len({name for name, context in rows}) == 8
    assert {context["push_state"]["slot"] for name, context in rows} == {"07:30", "12:30", "18:30", "22:30"}
    assert all(context["push_state"]["recent_reactions"] == [] for name, context in rows)

def test_cost_keeps_completion_receipt_when_generation_lookup_is_404(tmp_path, monkeypatch):
    import json
    import urllib.error
    from decimal import Decimal
    output = tmp_path / "output"
    output.mkdir()
    (output / "run.json").write_text(json.dumps({"records": [{"attempts": [{"id": "gen-test", "usage": {"cost": 0.00123}}]}]}))
    monkeypatch.setattr(m, "ROOT", tmp_path)
    monkeypatch.setattr(m, "credentials", lambda: "test-only")
    def missing(*args, **kwargs):
        raise urllib.error.HTTPError("https://openrouter.ai/api/v1/generation", 404, "Not Found", {}, None)
    monkeypatch.setattr(m.urllib.request, "urlopen", missing)
    m.collect_cost()
    result = json.loads((output / "cost.json").read_text())
    assert Decimal(result["total_cost_usd"]) == Decimal("0.00123")
    assert result["generation_lookup_errors"] == [{"id": "gen-test", "status": 404}]
