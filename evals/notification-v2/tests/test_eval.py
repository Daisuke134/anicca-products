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
