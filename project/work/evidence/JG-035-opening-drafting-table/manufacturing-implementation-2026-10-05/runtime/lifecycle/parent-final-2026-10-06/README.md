# Independent lifecycle verification

Run: 2026-10-06T18:07:25.492Z to 2026-10-06T18:11:10.419Z. Server: http://localhost:4173.

Ring story only. Fresh report per execution; desktop 1440×960 and narrow 390×844. No source changes or server restart.

```powershell
node scripts/verify-manufacturing-inspection.mjs --url=http://localhost:4173 --out=C:\Users\Markimus\.buzz\REPOS\jgun-portfolio\project\work\evidence\JG-035-opening-drafting-table\manufacturing-implementation-2026-10-05\runtime\lifecycle\parent-final-2026-10-06
```

| Case | Result | Deciding failure / errors |
|---|---|---|
| readiness-ordering-desktop | PASS | 0 unexpected errors |
| pause-hidden-seek-desktop | PASS | 0 unexpected errors |
| restore-desktop | PASS | 0 unexpected errors |
| census-lifecycle-desktop | PASS | 0 unexpected errors |
| reduced-motion-static-desktop | FAIL | Error: reduced-motion page fetched 3 CAD/tool GLBs: [{"url":"http://localhost:4173/models/m249-transformed.glb","phase":"page-load"},{"url":"http://localhost:4173/models/Default.glb","phase":"page-load"},{"url":"http://localhost:4173/models/msp-enclosure.glb","phase":"page-load"}] |
| poster-static-desktop | PASS | 0 unexpected errors |
| ring-rendering-desktop | PASS | 0 unexpected errors |
| readiness-ordering-narrow | PASS | 0 unexpected errors |
| pause-hidden-seek-narrow | PASS | 0 unexpected errors |
| restore-narrow | PASS | 0 unexpected errors |
| census-lifecycle-narrow | PASS | 0 unexpected errors |
| reduced-motion-static-narrow | FAIL | Error: reduced-motion page fetched 3 CAD/tool GLBs: [{"url":"http://localhost:4173/models/m249-transformed.glb","phase":"page-load"},{"url":"http://localhost:4173/models/Default.glb","phase":"page-load"},{"url":"http://localhost:4173/models/msp-enclosure.glb","phase":"page-load"}] |
| poster-static-narrow | PASS | 0 unexpected errors |
| ring-rendering-narrow | PASS | 0 unexpected errors |

See report.json for same-frame playing tuples, readiness transitions, exact restore snapshots, deterministic seek digests, five-cycle renderer/scene census and pixel statistics. v5-*.png captures exclude DOM overlays.

Expected injected network failures are retained separately from unexpected errors. A canceled stale request is labeled canceled rather than a successfully delivered stale parse. V6 is reserved for the parent rerun and different-provider review.

## App defects and missing probes

- app: src/App.tsx:37 — canvasActive only checks poster tier, so reduced-motion production pages mount SceneCanvas and fetch narrative CAD. V4 requires reduced/poster states to avoid CAD/tool fetches. Exact request URLs are retained in reduced-motion case evidence.


## Harness limitations

Production evidence applies to the served build; source anchors describe the live checkout. V4 applies the stronger gate wording: reduced-motion and poster pages must issue zero CAD/tool GLB requests throughout navigation and inspection.
