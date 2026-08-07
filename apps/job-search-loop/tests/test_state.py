import unittest

from job_search_loop.state import (
    InvalidTransition,
    canonical_job_id,
    canonical_url,
    validate_transition,
)


class StateTests(unittest.TestCase):
    def test_ashby_application_route_is_the_same_posting_identity(self):
        posting = "https://jobs.ashbyhq.com/openai/57cfe1d3-27b6-4761-909c-fec7829e9227"
        self.assertEqual(canonical_url(f"{posting}/application"), posting)

    def test_canonical_identity_ignores_tracking_and_case(self):
        first = canonical_job_id(
            " Example, Inc. ",
            " AI Engineer ",
            "https://jobs.example.com/roles/42/?utm_source=x#apply",
        )
        second = canonical_job_id(
            "example inc",
            "ai engineer",
            "https://jobs.example.com/roles/42",
        )
        self.assertEqual(first, second)

    def test_allowed_transition(self):
        validate_transition("discovered", "qualified")

    def test_canonical_url_preserves_identity_query_parameters(self):
        from job_search_loop.state import canonical_url

        self.assertNotEqual(
            canonical_url("https://boards.greenhouse.io/acme/jobs/1?gh_jid=1"),
            canonical_url("https://boards.greenhouse.io/acme/jobs/1?gh_jid=2"),
        )

    def test_forbidden_transition(self):
        with self.assertRaises(InvalidTransition):
            validate_transition("discovered", "submitted")


if __name__ == "__main__":
    unittest.main()
