from __future__ import annotations

import importlib.util
import json
from pathlib import Path


ROOT = Path(__file__).parents[3]
CONTROL = Path(__file__).parents[1] / "cleanup_control.py"
MANIFEST = Path(__file__).parents[1] / "artifact-lifecycle.json"


def load_control():
    spec = importlib.util.spec_from_file_location("cleanup_control_wiring", CONTROL)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_production_guard_has_one_cleanup_authority() -> None:
    guard = (ROOT / "scripts" / "emergency-disk-guard.sh").read_text(encoding="utf-8")
    assert "LIFE_MANAGER_DISK_GOVERNOR" in guard
    assert 'python3 "$LIFE_MANAGER_DISK_GOVERNOR"' in guard
    assert "LEDGER_MAX_BYTES=$((32 * 1024 * 1024))" in guard
    assert "rotate_cleanup_ledger" in guard
    assert 'if [ "$TEST_MODE" -eq 0 ]; then' in guard
    assert 'python3 "$CLEANUP_CONTROL" sweep' in guard
    assert '--pressure-override' in guard
    assert '--reclaim-target-bytes "$RECLAIM_TARGET_BYTES"' in guard
    assert '--chromium-code-sign-proof' in guard
    assert '.cloakbrowser/chromium-*/Chromium.app/Contents/MacOS/Chromium' in guard
    assert (
        'if [ "$TEST_MODE" -eq 1 ] && [ "${EMERGENCY_GUARD_TEST_ENABLE_RECLAIM:-0}" = 1 ]; then'
        in guard
    )
    assert 'if [ "$TEST_MODE" -eq 0 ] ||' not in guard


def test_recovery_health_is_observational_for_disk() -> None:
    health_sources = [
        ROOT / "scripts" / "recovery" / "health-check.sh",
        ROOT / "scripts" / "runtime" / "recovery-health-check.sh",
    ]
    for source in health_sources:
        health = source.read_text(encoding="utf-8")
        assert "Life Manager emergency-disk-guard owns reclaim and alerting" in health
        assert "rm -rf /Users/anicca/Library/Caches" not in health
        assert "rm -rf /Users/anicca/.cache" not in health
        assert "自動回収では足りません" not in health


def test_production_manifest_is_valid_and_protects_known_incident_roots() -> None:
    _, _, entries = load_control().load_manifest(MANIFEST)
    by_id = {entry["id"]: entry for entry in entries}
    assert by_id["gig-evidence-lifecycle"] == {
        "id": "gig-evidence-lifecycle",
        "path": str(Path.home() / "gig/evidence"),
        "owner": "gig-revenue-loop",
        "class": "managed_regenerable",
        "ttl_seconds": None,
        "quota_bytes": 0,
        "lease": None,
        "finalizer": {
            "kind": "managed_reclaimer",
            "reclaimer": "gig_evidence_gc",
        },
    }
    assert by_id["work-clones"]["class"] == "source"
    assert by_id["reelclaw-assets"]["class"] == "deliverable"
    assert by_id["xcode-derived-data"] == {
        "id": "xcode-derived-data",
        "path": str(Path.home() / "Library/Developer/Xcode/DerivedData"),
        "owner": "xcode-build",
        "class": "runtime",
        "ttl_seconds": None,
        "quota_bytes": 0,
        "lease": {
            "path": str(Path.home() / ".openclaw/state/xcode-build.lease"),
            "max_age_seconds": 300,
        },
        "finalizer": {"kind": "preserve"},
    }
    assert by_id["xcode-archives"] == {
        "id": "xcode-archives",
        "path": str(Path.home() / "Library/Developer/Xcode/Archives"),
        "owner": "xcode-build",
        "class": "deliverable",
        "ttl_seconds": None,
        "quota_bytes": 0,
        "lease": None,
        "finalizer": {"kind": "preserve"},
    }
    assert by_id["reelclaw-run-root"] == {
        "id": "reelclaw-run-root",
        "path": str(Path.home() / ".openclaw/workspace/runs"),
        "owner": "reelclaw-media",
        "class": "deliverable",
        "ttl_seconds": None,
        "quota_bytes": 0,
        "lease": None,
        "finalizer": {"kind": "preserve"},
    }
    assert by_id["reelclaw-assets"]["finalizer"] == {"kind": "preserve"}
    assert {
        entry["id"]
        for entry in entries
        if entry["owner"] in {"xcode-build", "reelclaw-media"}
    } == {"xcode-derived-data", "xcode-archives", "reelclaw-run-root"}
    assert by_id["anicca-source"]["class"] == "source"
    assert by_id["anicca-project-source"]["class"] == "source"
    assert by_id["anicca-project-worktrees"]["class"] == "git_worktree_collection"
    assert by_id["anicca-project-worktrees"]["finalizer"]["kind"] == "remote_recoverable_remove"
    for artifact_id, relative_path in {
        "projects-anicca-products-worktrees": "Projects/anicca-products/.worktrees",
        "ugig-nightcell7-worktrees": "Projects/ugig-nightcell7/.worktrees",
        "anicha-worktrees": "Projects/anicha/.worktrees",
        "anicca-rtdash-worktrees": "anicca-rtdash/.worktrees",
    }.items():
        assert by_id[artifact_id] == {
            "id": artifact_id,
            "path": str(Path.home() / relative_path),
            "owner": "git-worktrees",
            "class": "git_worktree_collection",
            "ttl_seconds": None,
            "quota_bytes": 0,
            "lease": None,
            "finalizer": {"kind": "remote_recoverable_remove"},
        }
    vm_package_contract = {
        "claude-vm-bundle": ("Library/Application Support/Claude/vm_bundles/claudevm.bundle", "claude-desktop-vm", "claude-vm"),
        "colima-runtime": (".colima", "colima-vm", "colima-vm"),
        "docker-desktop-runtime": ("Library/Containers/com.docker.docker", "docker-desktop-vm", "docker-desktop-vm"),
        "colima-cache": ("Library/Caches/colima", "colima-vm", "colima-vm"),
        "uv-cache": (".cache/uv", "python-package-store", "python-package"),
        "pip-cache": ("Library/Caches/pip", "python-package-store", "python-package"),
        "npm-cache": (".npm", "npm-package-store", "npm-package"),
        "cargo-registry": (".cargo/registry", "cargo-package-store", "cargo-package"),
        "kickama-cargo-target": (".openclaw/workspace/kickama-manifest-wizard/backend/target", "cargo-build", "cargo-build"),
        "go-module-cache": ("go/pkg/mod", "go-package-store", "go-package"),
        "ruby-gem-home": (".gem", "ruby-package-store", "ruby-package"),
        "bun-package-cache": (".bun/install/cache", "bun-package-store", "bun-package"),
        "homebrew-cache": ("Library/Caches/Homebrew", "homebrew-package-store", "homebrew-package"),
        "pipx-home": (".local/pipx", "python-pipx-runtime", "python-pipx"),
        "cocoapods-home": (".cocoapods", "cocoapods-package-store", "cocoapods-package"),
        "swiftpm-home": (".swiftpm", "swift-package-store", "swift-package"),
    }
    assert set(vm_package_contract) <= set(by_id)
    for artifact_id, (relative_path, owner, lease_name) in vm_package_contract.items():
        assert by_id[artifact_id] == {
            "id": artifact_id,
            "path": str(Path.home() / relative_path),
            "owner": owner,
            "class": "runtime",
            "ttl_seconds": None,
            "quota_bytes": 0,
            "lease": {
                "path": str(Path.home() / f".openclaw/state/{lease_name}.lease"),
                "max_age_seconds": 300,
            },
            "finalizer": {"kind": "preserve"},
        }
    assert by_id["playwright-browser-cache"]["class"] == "regenerable_output"
    assert (
        by_id["playwright-browser-cache"]["finalizer"]["proof_path"]
        == str(Path.home() / ".openclaw/skills/roundcube-webmail-skill/package.json")
    )
    assert by_id["playwright-browser-cache"]["lease"] == {
        "path": str(Path.home() / ".openclaw/state/playwright.lease"),
        "max_age_seconds": 300,
    }
    assert by_id["life-manager-main-worktrees"]["class"] == "git_worktree_collection"
    assert by_id["life-manager-main-worktrees"]["finalizer"] == {
        "kind": "remote_recoverable_remove"
    }
    assert by_id["life-manager-external-worktrees"]["finalizer"] == {
        "kind": "remote_recoverable_remove",
        "repository_path": str(Path.home() / "Projects/life-manager-main"),
    }
    assert by_id["life-manager-main-node-modules"]["class"] == "regenerable_output"
    assert by_id["life-manager-main-node-modules"]["finalizer"] == {
        "kind": "verified_regenerable_remove",
        "proof_path": str(Path.home() / "Projects/life-manager-main/package-lock.json"),
    }
    assert by_id["camoufox-browser-cache"]["class"] == "regenerable_output"
    assert by_id["camoufox-browser-cache"]["finalizer"] == {
        "kind": "verified_regenerable_remove",
        "proof_path": str(Path.home() / ".local/pipx/venvs/camoufox/bin/camoufox"),
    }
    assert by_id["chrome-on-device-model-cache"] == {
        "id": "chrome-on-device-model-cache",
        "path": str(
            Path.home()
            / "Library/Application Support/Google/Chrome/OptGuideOnDeviceModel"
        ),
        "owner": "browser-fleet",
        "class": "regenerable_output",
        "ttl_seconds": None,
        "quota_bytes": 0,
        "lease": None,
        "finalizer": {
            "kind": "verified_regenerable_remove",
            "proof_path": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        },
    }
    assert by_id["google-updater-download-cache"] == {
        "id": "google-updater-download-cache",
        "path": str(
            Path.home()
            / "Library/Application Support/Google/GoogleUpdater/crx_cache"
        ),
        "owner": "browser-fleet",
        "class": "regenerable_output",
        "ttl_seconds": None,
        "quota_bytes": 0,
        "lease": None,
        "finalizer": {
            "kind": "verified_regenerable_remove",
            "proof_path": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        },
    }
    assert by_id["actions-runner-diagnostics"] == {
        "id": "actions-runner-diagnostics",
        "path": str(Path.home() / "actions-runner/_diag"),
        "owner": "github-actions-runner",
        "class": "regenerable_output",
        "ttl_seconds": None,
        "quota_bytes": 0,
        "lease": None,
        "finalizer": {
            "kind": "verified_regenerable_remove",
            "proof_path": str(Path.home() / "actions-runner/bin/Runner.Listener"),
        },
    }
    assert by_id["orca-codex-marketplace-staging"] == {
        "id": "orca-codex-marketplace-staging",
        "path": str(
            Path.home()
            / "Library/Application Support/orca/codex-runtime-home/home/.tmp/marketplaces/.staging"
        ),
        "owner": "codex-marketplace-runtime",
        "class": "regenerable_output",
        "ttl_seconds": None,
        "quota_bytes": 0,
        "lease": None,
        "finalizer": {
            "kind": "verified_regenerable_remove",
            "proof_path": "/Applications/Codex.app/Contents/Resources/codex",
        },
    }
    camoufox_proof = Path(by_id["camoufox-browser-cache"]["finalizer"]["proof_path"])
    assert camoufox_proof.is_file()
    assert not camoufox_proof.is_symlink()
    assert by_id["tmp-anicca-clones"] == {
        "id": "tmp-anicca-clones",
        "path": "/tmp",
        "owner": "agent-temp-clones",
        "class": "git_clone_collection",
        "ttl_seconds": None,
        "quota_bytes": 0,
        "lease": None,
        "finalizer": {
            "kind": "remote_recoverable_remove",
            "child_name_prefix": "anicca-",
        },
    }
    assert all(set(entry) >= {"owner", "class", "ttl_seconds", "quota_bytes", "lease", "finalizer"} for entry in entries)


def test_browser_producer_lifecycle_is_registered() -> None:
    _, _, entries = load_control().load_manifest(MANIFEST)
    browser = {entry["id"]: entry for entry in entries if entry["owner"] == "browser-fleet"}

    assert set(browser) == {
        "browser-identity",
        "browser-runtime-dependency",
        "playwright-browser-cache",
        "camoufox-browser-cache",
        "chrome-on-device-model-cache",
        "google-updater-download-cache",
    }
    identity = browser.pop("browser-identity")
    assert identity["path"] == str(Path.home() / ".cloak")
    assert identity["class"] == "identity"
    assert identity["finalizer"] == {"kind": "preserve"}
    runtime = browser.pop("browser-runtime-dependency")
    assert runtime == {
        "id": "browser-runtime-dependency",
        "path": str(Path.home() / ".cloakbrowser"),
        "owner": "browser-fleet",
        "class": "runtime",
        "ttl_seconds": None,
        "quota_bytes": 0,
        "lease": None,
        "finalizer": {"kind": "preserve"},
    }
    for artifact in browser.values():
        assert artifact["class"] == "regenerable_output"
        assert artifact["quota_bytes"] == 0
        if artifact["id"] == "playwright-browser-cache":
            assert artifact["lease"] == {
                "path": str(Path.home() / ".openclaw/state/playwright.lease"),
                "max_age_seconds": 300,
            }
        else:
            assert artifact["lease"] is None
        assert artifact["finalizer"]["kind"] == "verified_regenerable_remove"
        assert Path(artifact["finalizer"]["proof_path"]).is_absolute()


def test_production_parent_child_manifest_preserves_all_media_targets(tmp_path: Path) -> None:
    control = load_control()
    replacements = {
        "xcode-derived-data": tmp_path / "DerivedData",
        "xcode-archives": tmp_path / "Archives",
        "reelclaw-run-root": tmp_path / "runs",
        "reelclaw-assets": tmp_path / "reelclaw-assets",
    }
    raw = json.loads(MANIFEST.read_text(encoding="utf-8"))
    raw["artifacts"] = [
        {**artifact, "path": str(replacements[artifact["id"]])}
        for artifact in raw["artifacts"]
        if artifact["id"] in replacements
    ]
    for path in replacements.values():
        path.mkdir(parents=True)
    run_dir = replacements["reelclaw-run-root"] / "published"
    run_dir.mkdir()
    (run_dir / "reel-final.mp4").write_bytes(b"video")
    (run_dir / "reel-meta.json").write_text(json.dumps({"postId": "p", "postedAt": "t", "integration": "i", "method": "m"}), encoding="utf-8")
    (run_dir / "source.mov").write_bytes(b"source")
    manifest = tmp_path / "manifest.json"
    manifest.write_text(json.dumps(raw), encoding="utf-8")
    runtime = tmp_path / "runtime.json"
    control.build_runtime_manifest(
        manifest_path=manifest,
        output_path=runtime,
        roots=[],
        cache_roots=[],
        minimum_cache_bytes=1,
        published_run_roots=[replacements["reelclaw-run-root"]],
    )
    artifacts = json.loads(runtime.read_text(encoding="utf-8"))["artifacts"]
    target_ids = set(replacements)
    targets = [
        Path(artifact["path"])
        for artifact in artifacts
        if artifact["id"] in target_ids or artifact["owner"] == "reelclaw-media"
    ]
    result = control.sweep(
        manifest_path=runtime,
        quarantine_root=tmp_path / "quarantine",
        ledger_path=tmp_path / "ledger.jsonl",
        candidates=targets,
    )

    assert result["quarantined"] == 0
    assert result["preserved"] == len(targets)
    assert (run_dir / "reel-final.mp4").is_file()
    assert (run_dir / "reel-meta.json").is_file()
    assert (run_dir / "source.mov").is_file()
