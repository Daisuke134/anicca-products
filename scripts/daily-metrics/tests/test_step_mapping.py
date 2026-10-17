"""Offline regressions for the emitted step event, not a cohort evaluator."""

import asyncio
import json
from dataclasses import asdict

import pytest

import mixpanel_client
from models import DailyMetrics, MixpanelMetrics
from slack_sender import format_slack_blocks
from tests.test_mixpanel_client import _FakeClient, _FakeResponse


def fetch(monkeypatch, rows, status=200):
    fake = _FakeClient(_FakeResponse("\n".join(json.dumps(row) for row in rows), status))
    monkeypatch.setenv("MIXPANEL_SERVICE_ACCOUNT", "synthetic:synthetic")
    monkeypatch.setattr(mixpanel_client.httpx, "AsyncClient", lambda timeout=30.0: fake)
    return asyncio.run(mixpanel_client.fetch_mixpanel_metrics()), fake


def step_row(step, actor="fictional-a", version="1.9.6", build="391"):
    return {"event": "onboarding_step_advanced", "properties": {
        "step": step, "distinct_id": actor,
        "$app_version_string": version, "$app_build_number": build,
    }}


def test_requests_emitted_step_event_without_dropping_legacy_events(monkeypatch):
    _, fake = fetch(monkeypatch, [])
    requested = json.loads(fake.captured["params"]["event"])
    assert "onboarding_step_advanced" in requested
    assert "onboarding_welcome_completed" in requested
    assert "onboarding_paywall_viewed" in requested
    assert "rc_trial_started_event" in requested


def test_all_nine_source_step_values_remain_separate(monkeypatch):
    names = ["welcome", "goal", "pain_points", "struggle_freq", "nudge_times",
             "processing", "plan_reveal", "comparison", "notifications"]
    result, _ = fetch(monkeypatch, [step_row(name) for name in names])
    counts = {row.step: row for row in result.onboarding_steps}
    assert set(counts) == set(names)
    assert all(row.event_count == row.distinct_id_count == 1 for row in counts.values())
    assert result.onboarding_welcome_completed == 0  # No invented legacy event.
    assert result.onboarding_goals_completed == 0
    assert result.onboarding_completed == 0  # No invented terminal milestone.


def test_counts_raw_rows_and_distinct_ids_per_step_version_and_build(monkeypatch):
    rows = [step_row("welcome"), step_row("welcome"), step_row("welcome", "fictional-b"),
            step_row("goal"), step_row("welcome", build="392"),
            step_row("welcome", version="1.9.4"), step_row("welcome", version=None, build=None)]
    result, _ = fetch(monkeypatch, rows)
    groups = {(r.app_version, r.app_build_number, r.step): r for r in result.onboarding_steps}
    assert len(groups) == 5
    observed = groups[("1.9.6", "391", "welcome")]
    assert observed.event_count == 3
    assert observed.distinct_id_count == 2
    assert observed.missing_identity_events == 0
    assert groups[(None, None, "welcome")].event_count == 1
    assert groups[("1.9.6", "392", "welcome")].distinct_id_count == 1


def test_unknown_steps_stay_raw_and_missing_step_stays_unknown(monkeypatch):
    rows = [step_row("future_step"), step_row("rating_prompt"), step_row(None), step_row([])]
    result, _ = fetch(monkeypatch, rows)
    groups = {r.step: r for r in result.onboarding_steps}
    assert set(groups) == {"future_step", "rating_prompt", None}
    assert groups[None].event_count == 2
    assert groups[None].distinct_id_count == 1
    assert "welcome" not in groups  # Absent step is unobserved, not fabricated zero.


def test_missing_identity_does_not_become_a_unique_user(monkeypatch):
    rows = [step_row("welcome", None), step_row("welcome", []), step_row("welcome", True)]
    result, _ = fetch(monkeypatch, rows)
    assert result.onboarding_steps[0].event_count == 3
    assert result.onboarding_steps[0].distinct_id_count == 0
    assert result.onboarding_steps[0].missing_identity_events == 3


def test_successful_empty_query_differs_from_unfetched_or_failed_query(monkeypatch):
    result, _ = fetch(monkeypatch, [])
    assert result.onboarding_steps == ()
    assert MixpanelMetrics().onboarding_steps is None
    with pytest.raises(RuntimeError, match="HTTP 503"):
        fetch(monkeypatch, [], status=503)


def test_legacy_and_current_named_events_are_not_aliases(monkeypatch):
    rows = [{"event": name, "properties": {"distinct_id": "fictional-a"}}
            for name in ["onboarding_paywall_viewed", "rc_trial_started_event"]]
    result, _ = fetch(monkeypatch, rows)
    assert result.onboarding_paywall_viewed == 1
    assert result.rc_trial_started_event == 1
    assert result.paywall_plan_selection_viewed == 0
    assert result.trial_started == 0


def test_serialized_counts_do_not_persist_actor_ids(monkeypatch):
    result, _ = fetch(monkeypatch, [step_row("welcome")])
    data = json.loads(DailyMetrics(date="2026-10-10", mixpanel=result).to_json())
    assert data["mixpanel"]["onboarding_steps"][0] == asdict(result.onboarding_steps[0])
    assert "fictional-a" not in json.dumps(data)


def test_formatter_reports_observations_without_conversion_claims(monkeypatch):
    result, _ = fetch(monkeypatch, [step_row("welcome"), step_row("welcome")])
    metrics = DailyMetrics(date="2026-10-10", mixpanel=result)
    body = format_slack_blocks(metrics, metrics)["blocks"][1]["text"]["text"]
    assert "welcome" in body and "1.9.6" in body and "391" in body
    assert "events=2" in body and "distinct_ids=1" in body
    assert "cohort conversion: N/A" in body
    assert "変換率" not in body and "オンボ→" not in body and "Paywall→" not in body


def test_formatter_keeps_empty_query_separate_from_unknown(monkeypatch):
    empty, _ = fetch(monkeypatch, [])
    empty_text = format_slack_blocks(DailyMetrics(date="2026-10-10", mixpanel=empty))["blocks"][1]["text"]["text"]
    unknown_text = format_slack_blocks(DailyMetrics(date="2026-10-10"))["blocks"][1]["text"]["text"]
    assert "no observed rows" in empty_text
    assert "step events: N/A" in unknown_text


def test_existing_archive_consumer_accepts_legacy_model(monkeypatch, tmp_path):
    from datetime import date, timedelta
    import main
    monkeypatch.setenv("METRICS_DIR", str(tmp_path))
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    (tmp_path / f"{yesterday}.json").write_text(json.dumps({
        "date": yesterday, "mixpanel": {"onboarding_live_demo_completed": 4,
        "onboarding_paywall_viewed": 3, "rc_trial_started_event": 2},
    }))
    previous = main._load_previous_metrics()
    assert previous is not None
    assert previous.mixpanel.onboarding_live_demo_completed == 4
    assert previous.mixpanel.onboarding_steps is None


def test_output_is_order_invariant_and_unknown_metadata_is_not_a_build(monkeypatch):
    rows = [step_row("welcome", build=391), step_row("goal", build=[]),
            step_row("goal", version=True, build=False)]
    first, _ = fetch(monkeypatch, rows)
    second, _ = fetch(monkeypatch, rows[::-1])
    assert first == second
    assert any(r.app_version == "1.9.6" and r.app_build_number == "391" for r in first.onboarding_steps)
    assert any(r.app_version is None and r.app_build_number is None for r in first.onboarding_steps)


def test_legacy_identity_fallback_and_whitespace_contract_is_preserved(monkeypatch):
    rows = [step_row("welcome", " fictional-a "), step_row("welcome", "fictional-a")]
    rows += [{"event": "onboarding_step_advanced", "properties": {
        "step": "welcome", "$user_id": "fictional-a", "$app_version_string": "1.9.6",
        "$app_build_number": "391"}}]
    result, _ = fetch(monkeypatch, rows)
    assert result.onboarding_steps[0].event_count == 3
    assert result.onboarding_steps[0].distinct_id_count == 1


def test_malformed_query_never_returns_a_successful_partial_count(monkeypatch):
    with pytest.raises((AttributeError, TypeError, ValueError)):
        fetch(monkeypatch, [step_row("welcome"), {"event": "onboarding_started", "properties": None}])


def test_formatter_bounds_step_summary_while_archive_keeps_all_groups(monkeypatch):
    result, _ = fetch(monkeypatch, [step_row("unrecognized-" + "x" * 300, build=str(i)) for i in range(40)])
    text = format_slack_blocks(DailyMetrics(date="2026-10-10", mixpanel=result))["blocks"][1]["text"]["text"]
    assert len(text) < 3000
    assert "full step groups in metrics archive" in text
    assert len(result.onboarding_steps) == 40


def test_current_paywall_and_trial_counts_are_visible_without_legacy_aliases(monkeypatch):
    result, _ = fetch(monkeypatch, [{"event": event, "properties": {"distinct_id": "fictional-a"}}
        for event in ("paywall_plan_selection_viewed", "trial_started", "onboarding_paywall_purchased")])
    text = format_slack_blocks(DailyMetrics(date="2026-10-10", mixpanel=result))["blocks"][1]["text"]["text"]
    assert "paywall_plan_selection_viewed 1" in text
    assert "trial_started 1" in text
    assert "onboarding_paywall_purchased 1" in text
    assert "onboarding_paywall_viewed 0" in text
