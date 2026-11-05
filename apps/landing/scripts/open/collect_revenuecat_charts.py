#!/usr/bin/env python3
"""Read RevenueCat's project-scoped chart API and emit a public-safe snapshot.

The API key is supplied by the caller and is never printed or written to output.
All returned chart series and incomplete-period markers are retained.
"""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request


API = "https://api.revenuecat.com/v2/projects"
DOCS = "https://www.revenuecat.com/docs/api-v2/charts-and-metrics"
MIN_REQUEST_INTERVAL_SECONDS = 2.5
CHARTS = (
    "actives", "actives_movement", "actives_new", "arr", "churn",
    "cohort_explorer", "conversion_to_paying", "customers_new",
    "initial_conversion", "ltv_per_customer", "ltv_per_paying_customer",
    "mrr", "mrr_movement", "prediction_explorer", "refund_rate",
    "refund_request", "refunds", "revenue", "subscription_retention",
    "subscription_status", "trials", "trials_movement", "trials_new",
    "customers_active", "trial_conversion", "trial_conversion_rate",
    "trial_cancellation", "non-subscription_purchases", "ad_revenue",
    "ad_impressions", "ad_clicks", "ad_monetized_customers",
    "paywall_abandonment", "app_store_save_outcomes",
)
PROJECTS = (
    {"name": "Anicca", "project_id": "projbb7b9d1b", "env_key": "REVENUECAT_ANICCA_API_KEY"},
    {"name": "Honne", "project_id": "projcfa60dd8", "env_key": "REVENUECAT_HONNE_API_KEY"},
    {"name": "Daily Dhamma", "project_id": "86624956", "env_key": "REVENUECAT_DHAMMA_API_KEY"},
    {"name": "Thankful", "project_id": "7aaf9429", "env_key": "REVENUECAT_THANKFUL_API_KEY"},
    {"name": "Sleep Reset", "project_id": "77301666", "env_key": "REVENUECAT_SLEEP_RESET_API_KEY"},
)
UTC = dt.timezone.utc


class ProviderError(Exception):
    def __init__(self, status, error_type):
        super().__init__(error_type)
        self.status = status
        self.error_type = error_type


def normalize_chart(chart_id, payload):
    raw_values = payload.get("values") or []
    cohort_matrix = bool(raw_values and isinstance(raw_values[0], list))
    values = (
        [
            {
                "cohort": row[0] if row else None,
                "cells": [{"segment": index, "value": value} for index, value in enumerate(row[1:])],
                "incomplete": None,
            }
            for row in raw_values
        ]
        if cohort_matrix
        else raw_values
    )
    points = [point for point in values if isinstance(point, dict)]
    incomplete_flags = [point["incomplete"] for point in points if isinstance(point.get("incomplete"), bool)]
    incomplete = any(incomplete_flags) if incomplete_flags else None
    result = {
        "id": chart_id,
        "status": "observed",
        "value_format": "cohort_matrix" if cohort_matrix else "points",
        "display_name": payload.get("display_name") or chart_id,
        "category": payload.get("category"),
        "description": payload.get("description"),
        "start_date": payload.get("start_date"),
        "end_date": payload.get("end_date"),
        "last_computed_at": payload.get("last_computed_at"),
        "resolution": payload.get("resolution"),
        "user_selectors": payload.get("user_selectors") or {},
        "measures": payload.get("measures") or [],
        "segments": payload.get("segments") or [],
        "periods": payload.get("periods") or [],
        "summary": payload.get("summary") or {},
        "values": values,
        "incomplete": incomplete,
        "unsupported_params": payload.get("unsupported_params") or {},
    }
    if cohort_matrix:
        result["values_raw"] = raw_values
    return result


def request_json(url, api_key, timeout=30):
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        error_type = "provider_error"
        try:
            error_type = json.loads(error.read().decode("utf-8")).get("type") or error_type
        except (UnicodeDecodeError, json.JSONDecodeError, AttributeError):
            pass
        raise ProviderError(error.code, error_type) from None
    except urllib.error.URLError as error:
        reason = getattr(error, "reason", None)
        raise ProviderError(0, "timeout" if isinstance(reason, TimeoutError) else "network_error") from None
    except TimeoutError:
        raise ProviderError(0, "timeout") from None
    except json.JSONDecodeError:
        raise ProviderError(0, "invalid_json") from None


def collect_project(project, api_key, start_date, end_date, request=request_json, sleep_fn=time.sleep):
    result = {
        "name": project["name"],
        "project_id": project["project_id"],
        "status": "observed",
        "charts": {},
    }
    if not api_key:
        result["status"] = "credential_missing"
        result["reason"] = "project_scoped_key_unavailable"
        return result

    failures = 0
    last_request_at = None
    for chart_id in CHARTS:
        selectors = {"revenue_type": "proceeds"} if chart_id == "revenue" else None
        query = {
            "start_date": start_date,
            "end_date": end_date,
            "resolution": "day",
            "segment": "app_id",
        }
        if selectors:
            query["selectors"] = json.dumps(selectors, separators=(",", ":"))

        def fetch(params):
            nonlocal last_request_at
            if last_request_at is not None:
                wait = MIN_REQUEST_INTERVAL_SECONDS - (time.monotonic() - last_request_at)
                if wait > 0:
                    sleep_fn(wait)
            last_request_at = time.monotonic()
            url = f"{API}/{project['project_id']}/charts/{chart_id}?{urllib.parse.urlencode(params)}"
            try:
                return request(url, api_key)
            except ProviderError:
                raise
            except urllib.error.URLError as error:
                reason = getattr(error, "reason", None)
                raise ProviderError(0, "timeout" if isinstance(reason, TimeoutError) else "network_error") from None
            except TimeoutError:
                raise ProviderError(0, "timeout") from None

        failure = None
        try:
            payload = fetch(query)
            segmentation = "app_id"
        except ProviderError as first_error:
            failure = first_error
            if first_error.status == 400 and first_error.error_type == "parameter_error":
                query.pop("segment", None)
                try:
                    payload = fetch(query)
                    segmentation = "project"
                except ProviderError as retry_error:
                    payload = None
                    failure = retry_error
            else:
                payload = None

        if payload is None:
            failures += 1
            result["charts"][chart_id] = {
                "id": chart_id,
                "status": "unavailable",
                "http_status": failure.status,
                "error_type": failure.error_type,
                "start_date": start_date,
                "end_date": end_date,
                "resolution": "day",
            }
            continue

        chart = normalize_chart(chart_id, payload)
        chart["segmentation"] = segmentation
        chart["observed_at"] = dt.datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z")
        result["charts"][chart_id] = chart

    if failures == len(CHARTS):
        result["status"] = "unavailable"
    elif failures:
        result["status"] = "partial"
    result["unavailable_charts"] = failures
    return result


def collect_snapshot(environ=None, now=None, request=request_json, sleep_fn=time.sleep):
    environ = os.environ if environ is None else environ
    now = now or dt.datetime.now(UTC)
    end_date = now.date()
    start_date = end_date - dt.timedelta(days=29)
    projects = [
        collect_project(
            project,
            environ.get(project["env_key"], "").strip(),
            start_date.isoformat(),
            end_date.isoformat(),
            request=request,
            sleep_fn=sleep_fn,
        )
        for project in PROJECTS
    ]
    return {
        "source": "RevenueCat Charts API v2",
        "source_docs": DOCS,
        "observed_at": dt.datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "window": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat(), "resolution": "day"},
        "chart_catalog": list(CHARTS),
        "projects": projects,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", help="JSON destination; defaults to TEAM_DIR/metrics/revenuecat-charts/latest.json")
    args = parser.parse_args()
    team = Path(os.environ.get("TEAM_DIR", "/workspace/team"))
    latest = Path(args.output) if args.output else team / "metrics/revenuecat-charts/latest.json"
    snapshot = collect_snapshot()
    latest.parent.mkdir(parents=True, exist_ok=True)
    latest.write_text(json.dumps(snapshot, ensure_ascii=False, indent=1) + "\n")
    if not args.output:
        dated = latest.parent / f"{snapshot['window']['end_date']}.json"
        dated.write_text(json.dumps(snapshot, ensure_ascii=False, indent=1) + "\n")
    print(json.dumps({
        "observed_at": snapshot["observed_at"],
        "projects": {p["name"]: {"status": p["status"], "charts_observed": sum(c.get("status") == "observed" for c in p["charts"].values())} for p in snapshot["projects"]},
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
