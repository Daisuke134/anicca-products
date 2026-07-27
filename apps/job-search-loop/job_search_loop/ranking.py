from __future__ import annotations

from dataclasses import dataclass

from .jobs import Job


COMPENSATION_FLOOR_JPY = 7_000_000
AUTO_APPLY_THRESHOLD = 75
AI_TERMS = (
    "ai",
    "artificial intelligence",
    "machine learning",
    "agent",
    "genai",
    "llm",
)
ENTERPRISE_SKILLS = {
    "agents",
    "databricks",
    "salesforce",
    "agentforce",
    "crm",
    "financial_services",
}
CONSUMER_SKILLS = {"consumer", "swift", "ios", "growth", "product"}
PREFERRED_DOMAINS = {"enterprise_ai", "fintech", "crypto", "consumer_ai"}


@dataclass(frozen=True)
class Evaluation:
    eligible: bool
    score: int
    components: dict[str, int]
    reasons: tuple[str, ...]


def evaluate(job: Job) -> Evaluation:
    reasons: list[str] = []
    if not job.japan_eligible:
        reasons.append("not_available_from_japan")
    if job.clearance_required:
        reasons.append("clearance_required")
    if (
        job.compensation_min_jpy is not None
        and job.compensation_min_jpy < COMPENSATION_FLOOR_JPY
    ):
        reasons.append("compensation_below_floor")

    title = job.title.casefold()
    skills = {value.casefold() for value in job.skills}
    domains = {value.casefold() for value in job.domains}
    components = {
        "ai_skill": 30 if any(term in title for term in AI_TERMS) else 0,
        "enterprise": 20 if skills & ENTERPRISE_SKILLS else 0,
        "consumer": 15 if skills & CONSUMER_SKILLS else 0,
        "location": 15 if job.japan_eligible else 0,
        "compensation": (
            5
            if job.compensation_min_jpy is None
            else 10
            if job.compensation_min_jpy >= COMPENSATION_FLOOR_JPY
            else 0
        ),
        "mission": 10 if domains & PREFERRED_DOMAINS else 0,
    }
    score = sum(components.values())
    if score < AUTO_APPLY_THRESHOLD:
        reasons.append("score_below_threshold")
    return Evaluation(
        eligible=not reasons,
        score=score,
        components=components,
        reasons=tuple(reasons),
    )
