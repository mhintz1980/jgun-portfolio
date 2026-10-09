# Fresh independent review — corrected reruns packet + capture helper (2026-10-09)

Reviewer: fresh-context seat via the owner-authorized direct DeepSeek router
(`codex exec -m deepseek/deepseek-flash` through the ocx loopback proxy;
GLM 5-hour quota was exhausted at dispatch time — reroute per plan §Owner
decisions, requested/served attribution recorded separately). Read-only.

## Verdicts

**A — corrected verifier reruns packet: SHIP.** Every README claim checked
against the artifacts holds: ring `report.json` 7/7 cases pass with 10 frames
per active CAD case, top-level failures empty; lifecycle `report.json` 14/14
cases pass, gates V1–V5 true, V6 pending-null by design, defects/failures
empty, embedded `verifierSha256 1a7786f4…` matches the README; both preflights
equal the expected frozen aggregate `9eb4b490…bded` (62 files, HTTP 200,
`frozenDistUnchanged: true`); attempt-1 census-mismatch artifacts present and
consistent; scope notes leave G6 / natural-tier opening / owner visual open.

**B — capture-helper readiness edit: SHIP.** The 60s bounded
`waitForFunction` (armed probe + param) between `goto(load)` and the guard is
minimal and non-masking — the explicit-fail guard still re-evaluates both
conditions and throws after the wait. Both successful captures are
structurally sound: full build identity (index SHA + 9 hashed loaded
scripts), non-empty `finalEvents` (desktop 16, narrow 19), zero
page/console errors. Narrow timeline contents: warmstart 1, cullrenderstart
5, cullrenderend 5, ondecline 1, degradequality 1, warmfinish 1, onincline
3, onfallback 1, dprstep 1 — the narrow run also degraded (full→lite), hit
the flipflop fallback once, and took one DPR staircase step. The two pre-fix
EXPLICIT_FAIL captures are preserved.

## Minor note (A, non-blocking)

The ring verifier's report JSON has no embedded `verifierSha256` field
(unlike the lifecycle report), so the README's ring verifier hashes
(`FA8A0ADA…` attempt 1, `13BC5401…` the passing run) are attested by the
orchestrating session's `sha256sum` receipts and the correction records, not
by the packet's own JSON.
