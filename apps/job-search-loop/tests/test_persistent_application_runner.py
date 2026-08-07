import json
import tempfile
import unittest
from pathlib import Path

from job_search_loop.persistent_application_runner import run_application_turn
from job_search_loop.thread_registry import ThreadRegistry


class FakeClient:
    def __init__(self, *, thread_id="thread-1"):
        self.thread_id = thread_id
        self.calls = []

    def initialize(self, **kwargs):
        self.calls.append(("initialize", kwargs))

    def thread_start(self, **kwargs):
        self.calls.append(("thread_start", kwargs))
        return {"thread": {"id": self.thread_id}}

    def thread_resume(self, thread_id):
        self.calls.append(("thread_resume", thread_id))
        return {"thread": {"id": thread_id}}

    def turn_start(self, thread_id, text, *, output_schema=None):
        self.calls.append(("turn_start", thread_id, text, output_schema))
        return {"turn": {"id": "turn-1"}}

    def wait_for_event(self, method):
        self.calls.append(("wait_for_event", method))
        return {"method": method, "params": {"turn": {"status": "completed"}}}

    def thread_read(self, thread_id):
        self.calls.append(("thread_read", thread_id))
        return {
            "thread": {
                "id": thread_id,
                "turns": [{"items": [{"type": "agentMessage", "text": json.dumps({"status": "ok"})}]}],
            }
        }


class PersistentApplicationRunnerTests(unittest.TestCase):
    def test_starts_and_binds_one_application_thread_then_writes_result(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            registry = ThreadRegistry(root / "threads.sqlite3")
            client = FakeClient()
            result = run_application_turn(
                client=client,
                registry=registry,
                work_id="application-1",
                prompt="apply now",
                schema={"type": "object", "required": ["status"]},
                result_path=root / "result.json",
                cwd=root,
                model="gpt-5.6-terra",
                runtime_release_sha="release-1",
                run_id="run-1",
            )

            self.assertEqual(result["value"], {"status": "ok"})
            self.assertEqual(registry.active("job_application", "application-1")["thread_id"], "thread-1")
            self.assertIn("thread_start", [call[0] for call in client.calls])
            self.assertEqual((root / "result.json").stat().st_mode & 0o777, 0o600)
            registry.close()

    def test_resumes_existing_application_thread(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            registry = ThreadRegistry(root / "threads.sqlite3")
            registry.bind(
                work_type="job_application", work_id="application-1", thread_id="thread-old",
                runtime_release_sha="release-0", run_id="run-0",
            )
            client = FakeClient()
            run_application_turn(
                client=client, registry=registry, work_id="application-1", prompt="continue",
                schema={"type": "object", "required": ["status"]}, result_path=root / "result.json",
                cwd=root, model="gpt-5.6-terra", runtime_release_sha="release-1", run_id="run-1",
            )

            self.assertIn(("thread_resume", "thread-old"), client.calls)
            self.assertNotIn("thread_start", [call[0] for call in client.calls])
            self.assertEqual(registry.active("job_application", "application-1")["last_run_id"], "run-1")
            registry.close()


if __name__ == "__main__":
    unittest.main()
