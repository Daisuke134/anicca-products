import tempfile
import unittest
from pathlib import Path

from job_search_loop.materials import (
    MaterialError,
    render_resume_html,
    secure_material_paths,
    validate_claims,
)


class MaterialTests(unittest.TestCase):
    def setUp(self):
        self.profile = {
            "candidate": {"name": "Daisuke Narita"},
            "facts": [
                {"id": "mufg", "claim": "Contributed to MUFG deployment", "evidence": "public"},
                {"id": "iclr", "claim": "Presented an ICLR 2026 report", "evidence": "video"},
            ],
        }

    def test_unknown_fact_id_is_rejected(self):
        with self.assertRaises(MaterialError):
            validate_claims(self.profile, [{"text": "Invented", "fact_ids": ["missing"]}])

    def test_mufg_sole_ownership_wording_is_rejected(self):
        with self.assertRaisesRegex(MaterialError, "ownership"):
            validate_claims(
                self.profile,
                [{"text": "Led the entire MUFG deployment", "fact_ids": ["mufg"]}],
            )

    def test_resume_is_single_column_and_keeps_public_link(self):
        html = render_resume_html(
            self.profile,
            [
                {
                    "heading": "Experience",
                    "items": [
                        {
                            "text": "Contributed to MUFG deployment",
                            "fact_ids": ["mufg"],
                        }
                    ],
                }
            ],
            links=[("ICLR 2026 report", "https://www.youtube.com/watch?v=biHAQ6aSQuc")],
        )
        self.assertIn("grid-template-columns: 1fr", html)
        self.assertIn("https://www.youtube.com/watch?v=biHAQ6aSQuc", html)
        self.assertIn("Daisuke Narita", html)

    def test_japan_targeted_resume_includes_verified_contact_and_birth_date(self):
        profile = {
            **self.profile,
            "candidate": {
                "name": "Daisuke Narita",
                "application_email": "candidate@example.com",
                "phone": "09000000000",
                "base": "Tokyo, Japan",
                "date_of_birth": "2002-01-30",
            },
        }
        html = render_resume_html(
            profile,
            [],
            links=[],
            include_date_of_birth=True,
        )
        self.assertIn("candidate@example.com", html)
        self.assertIn("09000000000", html)
        self.assertIn("Tokyo, Japan", html)
        self.assertIn("Date of birth: 2002-01-30", html)

    def test_generated_materials_are_private(self):
        with tempfile.TemporaryDirectory() as directory:
            first = Path(directory) / "resume.html"
            second = Path(directory) / "resume.pdf"
            first.write_text("html", encoding="utf-8")
            second.write_text("pdf", encoding="utf-8")
            secure_material_paths(first, second)
            self.assertEqual(first.stat().st_mode & 0o777, 0o600)
            self.assertEqual(second.stat().st_mode & 0o777, 0o600)


if __name__ == "__main__":
    unittest.main()
