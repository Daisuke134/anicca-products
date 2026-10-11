"""Mixpanel reader for independent 7-day event observations, not cohorts."""

from __future__ import annotations

import json
import os
from typing import Optional

import httpx

from models import MixpanelMetrics, OnboardingStepMetrics
from window import ReportingWindow, default_reporting_window

MIXPANEL_EXPORT_URL = "https://data.mixpanel.com/api/2.0/export"

_EVENTS: tuple[str, ...] = (
    "onboarding_started",
    "onboarding_welcome_completed",
    "onboarding_struggles_completed",
    "onboarding_struggle_depth_completed",
    "onboarding_goals_completed",
    "onboarding_insight_completed",
    "onboarding_valueprop_completed",
    "onboarding_notifications_completed",
    "onboarding_completed",
    "paywall_primer_viewed",
    "paywall_plan_selection_viewed",
    "onboarding_paywall_purchased",
    "trial_started",
    "onboarding_paywall_dismissed_free",
    "onboarding_paywall_viewed",
    "rc_trial_started_event",
    "onboarding_live_demo_completed",
    "onboarding_step_advanced",
)


def _basic_auth() -> tuple[str, str]:
    """Resolve Mixpanel Basic Auth credentials from env."""
    service_account = os.environ.get("MIXPANEL_SERVICE_ACCOUNT", "")
    if ":" in service_account:
        username, secret = service_account.split(":", 1)
        return username.strip(), secret.strip()
    raise KeyError("MIXPANEL_SERVICE_ACCOUNT")


async def fetch_mixpanel_metrics(window: Optional[ReportingWindow] = None) -> MixpanelMetrics:
    """Fetch event distinct IDs and raw step counts without inferring conversion.

    OnboardingFlowView emits the step being LEFT in the raw `step` property.
    Keep that value and version/build separate; never alias it to legacy named
    completion events or assume the current source describes older binaries.
    """
    if window is None:
        window = default_reporting_window()

    username, password = _basic_auth()

    params = {
        "from_date": window.start_date.isoformat(),
        "to_date": window.end_date.isoformat(),
        "event": json.dumps(list(_EVENTS), ensure_ascii=False),
    }

    unique_users: dict[str, set[str]] = {event: set() for event in _EVENTS}
    step_counts: dict[tuple, int] = {}
    step_users: dict[tuple, set[str]] = {}
    step_missing_identity: dict[tuple, int] = {}

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            MIXPANEL_EXPORT_URL,
            params=params,
            auth=(username, password),
        )
        response.raise_for_status()

    for line in response.text.splitlines():
        if not line.strip():
            continue
        item = json.loads(line)
        event_name = item.get("event")
        if event_name not in unique_users:
            continue
        properties = item.get("properties", {})
        distinct_id = _coalesce_distinct_id(properties)
        if distinct_id:
            unique_users[event_name].add(distinct_id)
        if event_name == "onboarding_step_advanced":
            # SDK default metadata; absent/invalid values remain unknown (None).
            # Raw step strings, including older/unknown names, are not remapped.
            key = (
                _property_text(properties.get("$app_version_string")),
                _property_text(properties.get("$app_build_number")),
                _property_text(properties.get("step"), allow_integer=False),
            )
            step_counts[key] = step_counts.get(key, 0) + 1
            step_users.setdefault(key, set())
            step_missing_identity.setdefault(key, 0)
            if distinct_id:
                step_users[key].add(distinct_id)
            else:
                step_missing_identity[key] += 1

    return MixpanelMetrics(
        onboarding_started=len(unique_users["onboarding_started"]),
        onboarding_welcome_completed=len(unique_users["onboarding_welcome_completed"]),
        onboarding_struggles_completed=len(unique_users["onboarding_struggles_completed"]),
        onboarding_struggle_depth_completed=len(unique_users["onboarding_struggle_depth_completed"]),
        onboarding_goals_completed=len(unique_users["onboarding_goals_completed"]),
        onboarding_insight_completed=len(unique_users["onboarding_insight_completed"]),
        onboarding_valueprop_completed=len(unique_users["onboarding_valueprop_completed"]),
        onboarding_notifications_completed=len(unique_users["onboarding_notifications_completed"]),
        onboarding_completed=len(unique_users["onboarding_completed"]),
        paywall_primer_viewed=len(unique_users["paywall_primer_viewed"]),
        paywall_plan_selection_viewed=len(unique_users["paywall_plan_selection_viewed"]),
        onboarding_paywall_purchased=len(unique_users["onboarding_paywall_purchased"]),
        trial_started=len(unique_users["trial_started"]),
        onboarding_paywall_dismissed_free=len(unique_users["onboarding_paywall_dismissed_free"]),
        onboarding_paywall_viewed=len(unique_users["onboarding_paywall_viewed"]),
        rc_trial_started_event=len(unique_users["rc_trial_started_event"]),
        onboarding_live_demo_completed=len(unique_users["onboarding_live_demo_completed"]),
        onboarding_steps=tuple(
            OnboardingStepMetrics(
                app_version=key[0], app_build_number=key[1], step=key[2],
                event_count=step_counts[key], distinct_id_count=len(step_users[key]),
                missing_identity_events=step_missing_identity[key],
            )
            for key in sorted(step_counts, key=lambda values: tuple(
                (value is not None, value or "") for value in values
            ))
        ),
    )


def _coalesce_distinct_id(properties: dict) -> Optional[str]:
    """Resolve distinct user id from common Mixpanel keys."""
    candidates = (
        properties.get("distinct_id"),
        properties.get("$user_id"),
        properties.get("user_id"),
    )
    for value in candidates:
        text = _property_text(value)
        if text:
            return text.strip()
    return None


def _property_text(value, *, allow_integer: bool = True) -> Optional[str]:
    """Preserve scalar identities; malformed containers/bools are not actors."""
    if isinstance(value, str):
        return value if value.strip() else None
    if allow_integer and type(value) is int:
        return str(value)
    return None
