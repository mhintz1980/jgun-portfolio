# Shaft runtime browser verification

node scripts/verify-shaft-inspection.mjs --url=http://localhost:4173 --out=C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\project\work\evidence\JG-035-opening-drafting-table\manufacturing-implementation-2026-10-05\runtime\shaft\preview-run-1

Run 2026-10-06T16:55:05.395Z to 2026-10-06T17:00:28.760Z. Chrome, desktop 1440×900 and narrow 390×844.

| Gate | Result |
|---|---|
| S1 | PASS |
| S2 | FAIL |
| S3 | FAIL |
| S4 | PASS |
| S5 | PASS |
| S6 | FAIL |
| S7 | FAIL |
| S8 | FAIL |
| N1 | PASS |
| N2 | FAIL |
| N3 | FAIL |
| N4 | PASS |

report.json preserves <=0.05 s shaping samples, exact cards, deterministic play/seek digests, restore snapshots, warmed renderer census, report-only desktop rAF percentiles and same-session screenshot tuples. Canvas captures hide DOM overlays. Static S8 counts only manufacturing-core requests, independently of whole-page reduced-motion policy.

App assertions and harness exceptions are retained separately. Authored-source SHA256 and verifier SHA256 identify this execution; source changes during a dev run can invalidate its acceptance provenance.
