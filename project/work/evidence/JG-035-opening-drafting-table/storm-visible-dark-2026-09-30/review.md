# JG-035 storm and visible-dark opening — closeout review packet

> **SUPERSEDED 2026-10-01 by the pacing rebalance.** Every browser result below describes the
> previous phase contract (intro share .40, lit hold .40-.42). The phases moved on 2026-10-01
> (share .50, lit hold .38-.45) for the owner's oryzo.ai pacing reference, so the pixel proof,
> six-case roster and review media in this folder are **stale** and must be re-run. What still
> holds: the independent code-boundary verdict and the method. See the current
> [handoff](handoff-2026-09-30-storm-visible-dark.md) and
> [pacing measurement](oryzo-pacing-reference.json).

Status as of the recorded run: **technical closure complete for the pre-rebalance contract.** Independent review was ship at the code boundary, corrected pixel-complete proof PASSed, the clean full-complete six-case browser roster PASSed exit 0 with 0 failures in every case, and the corrected `.98` review media was full tier at both viewports. Nothing is committed, pushed, or deployed.

Current plan: [execution plan](../../../../../docs/jgun-storm-flicker-visible-dark-plan.md). Next-session handoff: [handoff-2026-09-30-storm-visible-dark](handoff-2026-09-30-storm-visible-dark.md).

## Candidate

Five unequal lamp failures replace the original two-dip treatment. The fourth interruption holds near extinction before a weak recovery, then the lamp goes out. Cool room bounce keeps the vellum, navy geometry, and printed annotations readable. A white geometry-derived electrical trace crosses the fixed registered drawing, warm light returns with profile pressure, metal appears before lift, and the existing contact solve controls extraction.

The opening uses intro .40–.42 for lit recognition, .42–.56 for the five failures, .56–.62 for visible dark, .62–.76 for trace and registration, .76–.84 for lamp return and bulge, .84–1 for rise, .88 for perspective departure, and .96–1 for sheet fade. Raw intro scroll share is .40 while global progress ownership remains .00–.12. Downstream/mechanical constants are unchanged.

Approximate live-scroll readings from full-final: desktop intro ends at scrollY 10871.831, total scrollable travel is 27179.58, and rendered document height is about 28079.58 with a 900 px viewport; flicker spans 1522 px, visible-dark hold 652 px, and trace 1522 px. Narrow-lite intro ends at 10200, total travel is 25500, and rendered height is about 26344 with an 844 px viewport; flicker spans 1428 px, dark hold 612 px, and trace 1428 px. These are live-scroll inferences, not layout constants; the future page split must rederive them.

## Code-boundary evidence

| Gate | Current result |
|---|---|
| Typecheck | PASS |
| Production build | PASS; existing large-chunk advisory remains |
| Unit/integration tests | 159/159 PASS |
| Drawing contract | 26/26 PASS |
| Station contract | PASS |
| Independent fresh-context review | **Ship at the code boundary** |
| Corrected pixel-complete proof | **PASS, exit 0, failed=[]** |
| Requested orchestration advisor | Not obtained: route exhausted retries with 429; fallback review is disclosed |
| Clean six-case browser roster | **PASS, exit 0; all six cases 0 failures** |
| Corrected .98 full-tier review media | **PASS both viewports**; desktop and narrow stills plus videos, zero console errors |
| Owner visual acceptance | Open |

The independent ship verdict applies at the code boundary. Pixel-complete is a separate visual-evidence gate. Every machine gate is now closed; owner review, commit, and deployment remain separate decisions.

## Pixel-complete evidence

[Pixel-complete summary](pixel-complete/visible-dark-summary.json) exited 0 with an empty failed list. Desktop and narrow samples at lit .4, dark .59, and trace .69 both ran as full tier on AMD Radeon 780M through D3D11. Every required check passed, including visible dark stock, ink darker than stock, printed-text contrast, trace brightness, trace/null control, settled camera, clean stills, and required probe APIs.

Desktop surround was explicitly not in frame and is recorded as informational null rather than treated as a failed sample. Narrow dark surround measured 3.35.

| Measurement | Desktop | Narrow |
|---|---:|---:|
| Dark paper median (/255) | 29.65 | 29.65 |
| Local navy-ink contrast over stock (/255) | 26.86 | 24.14 |
| Printed-text contrast over stock (/255) | 25.28 | 22.28 |
| Printed-text sample rectangles | 21 | 21 |
| Trace-minus-null changed bright pixels | 732 | 518 |

The review captures are:

- [Desktop lit](pixel-complete/desktop/still-beat-lit.png)
- [Desktop visible dark](pixel-complete/desktop/still-beat-dark.png)
- [Desktop trace](pixel-complete/desktop/still-beat-trace.png)
- [Narrow lit](pixel-complete/narrow/still-beat-lit.png)
- [Narrow visible dark](pixel-complete/narrow/still-beat-dark.png)
- [Narrow trace](pixel-complete/narrow/still-beat-trace.png)

The earlier [pixel-final](pixel-final/visible-dark-summary.json) and [pixel-proof-rerun](pixel-proof-rerun/visible-dark-summary.json) runs remain preserved as failed/partial measurement history. Their useful readings do not obscure their failed assertions; pixel-complete supersedes them as the current proof record.

## Browser closure

The previous [full-final roster](full-final/summary.json) finished with four passing cases and two infrastructure interruptions; its overall value is false and must not be used as closure evidence.

| Case | Result | Detail |
|---|---|---|
| Desktop full | PASS | 0 failures; applicable forward/reverse and pinned checkpoints pass |
| Narrow full | INTERRUPTED | Playwright Target page/context/browser closed; no application error |
| Desktop reduced | INTERRUPTED | Playwright Target page/context/browser closed; no application error |
| Narrow reduced | PASS | 0 failures |
| Desktop lite | PASS | 0 failures; applicable forward/reverse and pinned checkpoints pass |
| Narrow lite | PASS | 0 failures; applicable forward/reverse and pinned checkpoints pass |

The clean [full-complete roster](full-complete/summary.json) PASSed exit 0. Desktop, narrow, desktop-reduced, narrow-reduced, desktop-lite, and narrow-lite each report 0 failures, including applicable forward/reverse and pinned checks. Preserve [full-final](full-final/summary.json) as the failed infrastructure attempt; do not splice its four passing cases into the clean roster's evidence.

## Parent visual inspection and motion limits

Parent inspection of the dark, trace, and extraction captures finds the stock and ink readable and the white contour strong. At the corrected extraction sample .96, telemetry reports minZ +.0233 and zero flex.

The earlier motion capture's “resolved” still at .94 is mislabeled: it is an extraction frame before separation. The corrected contract identifies .98 as resolved; do not use the old .94 label as separation proof.

Final full-tier review media (corrected `.98`, both viewports):

| Case | Artifact | Tier | Samples | Verdict |
|---|---|---|---:|---|
| Desktop | [.98 resolved still](review-complete-desktop/desktop/stills/still-beat-resolved.png) + [video](review-complete-desktop/desktop/video/desktop.webm) | full | 140 | `pass`, `failures=[]` |
| Narrow | [.98 resolved still](review-complete/narrow/stills/still-beat-resolved.png) + [video](review-complete/narrow/video/narrow.webm) | full | 137 | `pass` for the narrow case |

Both videos report zero console errors, the canvas stayed live for every sample, and both scrubs land on the exact `1.0` endpoint (`finalT 1`). The intermediate [review-complete](review-complete/summary.json) attempt is preserved as partial history: its narrow case was full tier, but its desktop video ratcheted to lite under recording load and it correctly reports `pass: false` under `--require-tier=full`. The desktop-only [review-complete-desktop](review-complete-desktop/summary.json) rerun landed full tier and records `pass: true`. The older [review-motion](review-motion/summary.json) lite-tier videos remain as fallback history.

## Model routing

[Model routing](model-routing.md) proves requested/resolved/served GLM-5.3 and GLM-5.3 Flash attribution with status 200. The requested DeepSeek OpenRouter alias returned 200, but proxy records omit resolved/served fields, so actual DeepSeek service is unproven. Record the requested route and limitation separately.

The requested Claude Fable advisor route exhausted retries with 429. The fresh-context GLM review is a fallback reviewer, not a Fable verdict.

## Known limits

- Owner visual acceptance, commit, push, and deployment remain open. Every technical gate is closed.
- The first review-complete attempt ratcheted the desktop video to lite under recording load; the desktop-only rerun landed full tier. Keep both summaries so the ratchet behaviour stays visible.
- Tier cannot be forced upward: `window.__drawingProof.setTier` only downgrades or forces poster, so a full-tier motion recording depends on the adaptive ratchet choosing full. It did on the desktop rerun and on narrow.
- The .94 “resolved” label in the old capture is wrong; corrected resolved is .98.
- Existing material and wood finish are not independently elevated by this scope.
- No Lusion parity is claimed; the reference informed craft direction only.
- Enclosure/M249 page separation remains a separate task pending owner clarification.

## Owner review instructions

On the fresh local :4173 preview, scroll forward through the five failures, pause in visible dark and during the trace, continue through pressure and extraction, then reverse. Judge the interruption rhythm, anticipation length, trace contrast, warm pressure transition, and whether corrected extraction reads as one connected shot. Technical PASS will not substitute for that visual ruling.
