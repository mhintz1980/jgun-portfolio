# Independent lifecycle verification

Run: 2026-10-09T05:55:05.544Z to 2026-10-09T05:59:27.763Z. Server: http://127.0.0.1:4174.

Ring story only. Fresh report per execution; desktop 1440×960 and narrow 390×844. No source changes or server restart.

```powershell
node scripts/verify-manufacturing-inspection.mjs --url=http://127.0.0.1:4174 --out=C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\project\work\evidence\JG-035-opening-drafting-table\orchestrated-continuation-2026-10-08\verification\hardware-acceptance-corrected-reruns\manufacturing-lifecycle-full-corrected
```

| Case | Result | Deciding failure / errors |
|---|---|---|
| readiness-ordering-desktop | PASS | 0 unexpected errors |
| pause-hidden-seek-desktop | PASS | 0 unexpected errors |
| restore-desktop | PASS | 0 unexpected errors |
| census-lifecycle-desktop | PASS | 0 unexpected errors |
| reduced-motion-static-desktop | PASS | 0 unexpected errors |
| poster-static-desktop | PASS | 0 unexpected errors |
| ring-rendering-desktop | PASS | 0 unexpected errors |
| readiness-ordering-narrow | PASS | 0 unexpected errors |
| pause-hidden-seek-narrow | PASS | 0 unexpected errors |
| restore-narrow | PASS | 0 unexpected errors |
| census-lifecycle-narrow | PASS | 0 unexpected errors |
| reduced-motion-static-narrow | PASS | 0 unexpected errors |
| poster-static-narrow | PASS | 0 unexpected errors |
| ring-rendering-narrow | PASS | 0 unexpected errors |

See report.json for same-frame playing tuples, readiness transitions, exact restore snapshots, deterministic seek digests, five-cycle renderer/scene census and pixel statistics. v5-*.png captures exclude DOM overlays.

Expected injected network failures are retained separately from unexpected errors. A canceled stale request is labeled canceled rather than a successfully delivered stale parse. V6 is reserved for the parent rerun and different-provider review.

## App defects and missing probes

None established by this run.

## Harness limitations

Production evidence applies to the served build; source anchors describe the live checkout. V4 applies the stronger gate wording: reduced-motion and poster pages must issue zero CAD/tool GLB requests throughout navigation and inspection.
