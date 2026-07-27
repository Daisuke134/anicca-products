import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from job_search_loop.agent_runner import AgentRunner, ContractError, TASK_CLASSES


class AgentRunnerTests(unittest.TestCase):
    def test_task_routes_are_pinned(self):
        self.assertEqual(TASK_CLASSES["tailor"], "composition-agent")
        self.assertEqual(TASK_CLASSES["inbox"], "repeatable-agent")
        self.assertEqual(TASK_CLASSES["submit"], "browser-lane-agent")
        self.assertEqual(TASK_CLASSES["improve"], "high-value-agent")

    def test_prompt_uses_file_argv_and_retains_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            runner = AgentRunner(
                runner_path=Path("/opt/agent_runner.py"),
                evidence_root=root / "evidence",
            )
            completed = type(
                "Completed",
                (),
                {
                    "returncode": 0,
                    "stdout": json.dumps(
                        {
                            "status": "success",
                            "result_path": str(root / "result.json"),
                        }
                    ),
                    "stderr": "",
                },
            )()
            (root / "result.json").write_text('{"answer":"ok"}', encoding="utf-8")
            schema = root / "schema.json"
            schema.write_text(
                '{"type":"object","required":["answer"]}', encoding="utf-8"
            )
            with patch("subprocess.run", return_value=completed) as call:
                result = runner.run(
                    task="tailor",
                    prompt="Grounded task",
                    schema_path=schema,
                    workdir=root,
                    run_id="one",
                )
            argv = call.call_args.args[0]
            self.assertIn("--prompt-file", argv)
            self.assertNotIn("Grounded task", argv)
            self.assertEqual(result["answer"], "ok")

    def test_missing_required_result_field_fails_closed(self):
        with self.assertRaises(ContractError):
            AgentRunner.validate({"other": True}, {"required": ["answer"]})


if __name__ == "__main__":
    unittest.main()

