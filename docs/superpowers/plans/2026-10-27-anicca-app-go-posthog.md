# Anicca App Store redirect and PostHog event

1. Write and run the failing unit test for `GET /go/anicca?ct=X`.
2. Add anonymous PostHog capture and preserve Apple campaign parameters on the redirect.
3. Run focused telemetry tests and diff checks; push a dedicated PR.
4. Wait for exact-head CI, merge through GitHub, then verify the live 302 and PostHog event readback.

Current cursor: step 1.
