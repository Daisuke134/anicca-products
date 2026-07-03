"""REAL, no-mock verification of pull_revenuecat.py and pull_stripe.py
(PROP-001, PROP-002, PROP-003, PROP-005). Requires real credentials in the
environment (set -a; source ~/.openclaw/.env; set +a) -- this test makes REAL
network calls, per HARD RULE 0.24 (no dry runs).
"""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent.parent


def _run(script: str, env: dict) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPT_DIR / script)],
        capture_output=True,
        text=True,
        env=env,
        timeout=30,
    )


def test_revenuecat_success_path_writes_real_schema_valid_line():
    if not os.environ.get("REVENUECAT_V2_SECRET_KEY"):
        import pytest
        pytest.skip("REVENUECAT_V2_SECRET_KEY not set in this shell — run with set -a; source ~/.openclaw/.env; set +a")
    with tempfile.TemporaryDirectory() as d:
        env = {**os.environ, "SMTM_ANALYTICS_DIR": d}
        result = _run("pull_revenuecat.py", env)
        assert result.returncode == 0, result.stderr
        path = Path(d) / "anicca-ios.jsonl"
        assert path.exists()
        rec = json.loads(path.read_text().strip().split("\n")[0])
        assert rec["slug"] == "anicca-ios"
        assert rec["source"] == "revenuecat"
        assert isinstance(rec["metrics"], dict) and len(rec["metrics"]) > 0


def test_revenuecat_auth_failure_fails_closed_writes_nothing():
    with tempfile.TemporaryDirectory() as d:
        env = {**os.environ, "SMTM_ANALYTICS_DIR": d, "REVENUECAT_V2_SECRET_KEY": "sk_definitely_invalid_key_xyz"}
        result = _run("pull_revenuecat.py", env)
        assert result.returncode != 0
        path = Path(d) / "anicca-ios.jsonl"
        assert not path.exists()


def test_revenuecat_network_error_fails_closed_writes_nothing():
    if not os.environ.get("REVENUECAT_V2_SECRET_KEY"):
        import pytest
        pytest.skip("REVENUECAT_V2_SECRET_KEY not set")
    with tempfile.TemporaryDirectory() as d:
        # point at an unreachable host to force a real network error, not an auth error
        script = (SCRIPT_DIR / "pull_revenuecat.py").read_text()
        broken = script.replace(
            'RC_BASE_URL = "https://api.revenuecat.com/v2"',
            'RC_BASE_URL = "https://api.revenuecat.invalid-tld-xyz-unreachable/v2"',
        )
        broken_path = Path(d) / "pull_revenuecat_broken.py"
        broken_path.write_text(broken)
        (Path(d) / "lib").symlink_to(SCRIPT_DIR / "lib")
        env = {**os.environ, "SMTM_ANALYTICS_DIR": d}
        result = subprocess.run(
            [sys.executable, str(broken_path)], capture_output=True, text=True, env=env, timeout=30, cwd=d
        )
        assert result.returncode != 0
        assert "network error" in result.stderr.lower() or "network" in result.stderr.lower()
        assert not (Path(d) / "anicca-ios.jsonl").exists()


def test_revenuecat_idempotent_rerun_appends_two_lines_no_overwrite():
    if not os.environ.get("REVENUECAT_V2_SECRET_KEY"):
        import pytest
        pytest.skip("REVENUECAT_V2_SECRET_KEY not set")
    with tempfile.TemporaryDirectory() as d:
        env = {**os.environ, "SMTM_ANALYTICS_DIR": d}
        _run("pull_revenuecat.py", env)
        path = Path(d) / "anicca-ios.jsonl"
        first_bytes = path.read_bytes()
        _run("pull_revenuecat.py", env)
        assert path.read_bytes().startswith(first_bytes)
        lines = path.read_text().strip().split("\n")
        assert len(lines) == 2


def test_stripe_success_path_writes_real_schema_valid_line():
    if not os.environ.get("STRIPE_SECRET_KEY"):
        import pytest
        pytest.skip("STRIPE_SECRET_KEY not set")
    with tempfile.TemporaryDirectory() as d:
        env = {**os.environ, "SMTM_ANALYTICS_DIR": d}
        result = _run("pull_stripe.py", env)
        assert result.returncode == 0, result.stderr
        path = Path(d) / "lm-stripe-5usd.jsonl"
        rec = json.loads(path.read_text().strip().split("\n")[0])
        assert rec["slug"] == "lm-stripe-5usd"
        assert rec["source"] == "stripe"
        assert "total_checkout_sessions" in rec["metrics"]


def test_stripe_non2xx_response_fails_closed():
    # a malformed request to the real, valid endpoint (bad payment_link value shaped
    # to trigger Stripe's own validation error) exercises the non-2xx path distinct
    # from an auth failure -- PROP-001's third failure mode.
    if not os.environ.get("STRIPE_SECRET_KEY"):
        import pytest
        pytest.skip("STRIPE_SECRET_KEY not set")
    with tempfile.TemporaryDirectory() as d:
        script = (SCRIPT_DIR / "pull_stripe.py").read_text()
        broken = script.replace(
            'LM_5USD_PAYMENT_LINK_ID = "plink_1TgOluEeDsUAcaLSqXWXjUz7"',
            'LM_5USD_PAYMENT_LINK_ID = "plink_this_is_not_a_real_id_shape_xyz"',
        )
        broken_path = Path(d) / "pull_stripe_broken.py"
        broken_path.write_text(broken)
        (Path(d) / "lib").symlink_to(SCRIPT_DIR / "lib")
        env = {**os.environ, "SMTM_ANALYTICS_DIR": d}
        result = subprocess.run(
            [sys.executable, str(broken_path)], capture_output=True, text=True, env=env, timeout=30, cwd=d
        )
        assert result.returncode != 0
        assert not (Path(d) / "lm-stripe-5usd.jsonl").exists()
