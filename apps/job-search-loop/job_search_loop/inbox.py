from __future__ import annotations


def classify_message(subject: str, body: str) -> str:
    text = f"{subject}\n{body}".casefold()
    rules = (
        ("offer", ("offer letter", "pleased to offer")),
        ("interview", ("interview", "choose a time", "schedule a call")),
        ("assessment", ("assessment", "coding challenge", "take-home")),
        ("rejection", ("not be moving forward", "other candidates", "unfortunately")),
        ("confirmation", ("application received", "thank you for applying")),
        ("recruiter", ("recruiter", "talent acquisition", "your background")),
    )
    for label, phrases in rules:
        if any(phrase in text for phrase in phrases):
            return label
    return "irrelevant"

