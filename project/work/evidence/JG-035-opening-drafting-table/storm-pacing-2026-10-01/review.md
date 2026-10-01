# JG-035 rebalanced storm opening — review packet

Date: 2026-10-01. Status: code, six-case browser and pixel verification passed; narrow full-tier motion recording remains unmet. Owner visual acceptance open.

The .50 intro share and longer lit/dark/trace beats from the September 30 handoff are retained. This continuation corrected stale pixel/media timing mirrors and repaired the DOM track alignment: the old .30-share section heights advanced the mechanical timeline before the drawing released, so the wrench could emerge partly exploded. Derived track heights restore the retained hero trigger interval and leave total document height at 3120vh. Raw downstream distance is compressed; its paced constants are retained.

| Gate | Current evidence |
| --- | --- |
| Typecheck / production build | PASS; existing large-chunk advisory |
| Unit tests | 169/169 across 16 files |
| Drawing / station contracts | 26/26 drawing; station PASS |
| Initial quick / six-case roster | PASS; predates track repair, historical only |
| Full-tier pixel proof | [19/19 PASS](pixel-aligned-retry/visible-dark-summary.json) |
| Repaired six-case browser roster | [6/6 PASS, zero failures, exit 0](full-aligned/summary.json); includes new handoff and DOM transit gates |
| Full-tier review motion | Desktop PASS; narrow full-tier recording UNMET after three attempts (all video scrubs ran lite); both viewports' six stills are full tier |
| Independent technical review | [Ship at code boundary after repair](independent-review.md) |
| Owner approval | Open |

Pixel proof uses current phase boundaries and full-tier D3D11 Chrome at 1600×900 and 390×844. Dark stock median is 29.65/255 on both viewports. Ink contrast against adjacent stock is 26.86 desktop / 24.14 narrow; text contrast is 25.28 / 22.28 across 21 sampled boxes each. The registered dark hold observes zero trace contour pixels. At the trace beat, normal-minus-null control observes 792 desktop / 563 narrow contour pixels and 546 / 410 changed bright pixels. The resolved .98 checkpoint has pose time .951227 beyond measured crossing .888846 on both viewports.

The first pixel attempt in `pixel-aligned/` failed when one desktop checkpoint exhausted full-tier retries. Readability/trace checks passed, but the run is not accepted as full-tier proof. The complete retry is saved separately; failed evidence is preserved.

Review media: [initial media summary](media-aligned/summary.json) captured six full-tier stills on both viewports and a full-tier desktop video (108 live samples, endpoint 1.0, zero console errors). Its narrow video ran lite, so the combined run correctly records `pass: false`. [First narrow retry](media-narrow-retry/summary.json) and [final narrow attempt](media-narrow-final/summary.json) also ran lite and failed the required-tier gate. All clips retained a live canvas and reached 1.0 without console errors. Full-tier narrow motion evidence remains unmet; no tier was forced upward and no gate was weakened.

Review clips: [desktop — full tier](media-aligned/desktop/video/desktop.webm) · [narrow — lite tier](media-narrow-final/narrow/video/narrow.webm). Full-tier stills: [desktop resolved](media-aligned/desktop/stills/still-beat-resolved.png) · [narrow resolved](media-aligned/narrow/stills/still-beat-resolved.png).

Repaired browser closure: every case in `full-aligned/` passed with zero failures and zero console errors. Standard and lite viewports each record six forward/reverse release checks with explodeFactor 0, gearRotation 0 and ghostOpacity 1. Desktop live DOM trigger raw endpoints are .532402846/.692289113; narrow readings fit the same expected anchors within the stated layout tolerance.

Preview: [http://localhost:4173/](http://localhost:4173/). Review the detail/traverse, registered lit hold, five lamp failures, readable dark hold, electrical trace, pressure/lamp return, lift, and the assembled post-intro handoff. Pause and reverse through the failures and emergence. The X-ray proposal is still unimplemented and requires an owner decision.

Parent still inspection: the dark frame keeps printed geometry and lettering present with low room bounce; the resolved frame shows the wrench above the sheet in the warm return light. These observations supplement pixel/pose measurements and do not establish motion taste or material approval. Existing wood/material appearance was not retuned in this continuation.

Known limits: no owner taste approval or Lusion parity claim; downstream chapter activation edges have small shifts despite the retained mechanical transit anchors; the historical `verify-b1b2-rebuild.mjs` pacing mirror is stale and was not used. Full graph reindex failed its pipeline, so new/changed source was read directly. No stage, commit, push or deploy occurred.

Plan: [verification continuation](../../../../../docs/jgun-storm-pacing-verification-2026-10-01.md). Checks: [static record](static-checks.md).
