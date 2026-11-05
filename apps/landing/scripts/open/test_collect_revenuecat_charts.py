import importlib.util
import json
from pathlib import Path
import unittest
import urllib.error


COLLECTOR = Path(__file__).with_name("collect_revenuecat_charts.py")


class RevenueCatChartNormalizationTests(unittest.TestCase):
    def _collector(self):
        if not COLLECTOR.is_file():
            self.fail("RevenueCat chart collector is missing")
        spec = importlib.util.spec_from_file_location("collect_revenuecat_charts", COLLECTOR)
        collector = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(collector)
        return collector

    def test_preserves_chart_series_and_partial_period_marker(self):
        collector = self._collector()

        raw = {
            "display_name": "MRR",
            "category": "Revenue",
            "start_date": "2026-10-07",
            "end_date": "2026-11-05",
            "last_computed_at": "2026-11-06T00:00:00Z",
            "resolution": "day",
            "measures": [{"display_name": "MRR", "unit": "$"}],
            "segments": [{"display_name": "Anicca", "is_total": False}],
            "summary": {"average": {"Anicca": {"MRR": 20.34}}},
            "values": [
                {"cohort": 1793836800, "measure": 0, "segment": 0, "value": 20.34, "incomplete": True}
            ],
        }

        result = collector.normalize_chart("mrr", raw)

        self.assertEqual(result["id"], "mrr")
        self.assertEqual(result["values"], raw["values"])
        self.assertEqual(result["segments"], raw["segments"])
        self.assertTrue(result["incomplete"])

    def test_preserves_and_labels_prediction_chart_matrix_columns(self):
        collector = self._collector()
        raw = {
            "display_name": "Prediction Explorer",
            "start_date": "2026-10-07",
            "end_date": "2026-11-05",
            "segments": [
                {"display_name": "New customers", "unit": "#"},
                {"display_name": "Month 0", "unit": "$"},
            ],
            "values": [[1791331200, 3, 0.0]],
        }

        result = collector.normalize_chart("prediction_explorer", raw)

        self.assertEqual(result["value_format"], "cohort_matrix")
        self.assertEqual(result["values_raw"], raw["values"])
        self.assertEqual(result["values"][0]["cells"], [{"segment": 0, "value": 3}, {"segment": 1, "value": 0.0}])
        self.assertIsNone(result["incomplete"])

    def test_missing_project_key_stays_unknown_without_an_api_request(self):
        collector = self._collector()

        def unexpected_request(*_args, **_kwargs):
            self.fail("collector must not call RevenueCat when a project key is missing")

        result = collector.collect_project(
            {"name": "Honne", "project_id": "projcfa60dd8", "env_key": "REVENUECAT_HONNE_API_KEY"},
            "",
            "2026-10-07",
            "2026-11-05",
            request=unexpected_request,
            sleep_fn=lambda _seconds: None,
        )

        self.assertEqual(result["status"], "credential_missing")
        self.assertEqual(result["charts"], {})

    def test_provider_permission_error_is_recorded_without_exposing_the_key(self):
        collector = self._collector()
        original_charts = collector.CHARTS
        collector.CHARTS = ("mrr",)

        def denied_request(_url, _key):
            raise collector.ProviderError(403, "authorization_error")

        try:
            result = collector.collect_project(
                {"name": "Honne", "project_id": "projcfa60dd8", "env_key": "REVENUECAT_HONNE_API_KEY"},
                "test-secret-value",
                "2026-10-07",
                "2026-11-05",
                request=denied_request,
                sleep_fn=lambda _seconds: None,
            )
        finally:
            collector.CHARTS = original_charts

        self.assertEqual(result["status"], "unavailable")
        self.assertEqual(result["charts"]["mrr"]["error_type"], "authorization_error")
        self.assertNotIn("test-secret-value", json.dumps(result))

    def test_network_failure_is_a_chart_gap_instead_of_aborting_the_snapshot(self):
        collector = self._collector()
        original_charts = collector.CHARTS
        collector.CHARTS = ("mrr",)

        def offline_request(_url, _key):
            raise urllib.error.URLError("offline")

        try:
            result = collector.collect_project(
                {"name": "Anicca", "project_id": "projbb7b9d1b", "env_key": "REVENUECAT_ANICCA_API_KEY"},
                "read-only-key",
                "2026-10-07",
                "2026-11-05",
                request=offline_request,
                sleep_fn=lambda _seconds: None,
            )
        finally:
            collector.CHARTS = original_charts

        self.assertEqual(result["status"], "unavailable")
        self.assertEqual(result["charts"]["mrr"]["error_type"], "network_error")


if __name__ == "__main__":
    unittest.main()
