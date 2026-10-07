# Opening triage final followup (2026-10-06, GLM leaf; no GPU run in this followup)

Executed opening-triage-final-followup.md. Owned files: scripts/verify-jgun-opening.mjs
and this report (plus the corrected runtime/opening-triage-glm/report.md). No app,
policy, CAD, threshold, build, browser, staging, commit, or push changes.

## Exact six-case records (both preserved as prior-policy history)

Headed roster - runtime/opening-contact-final (2026-10-06T22:58:39Z-23:03:53Z, exit 1):

- desktop FAIL, 12 failures. First failure class: "expected full tier for browser
  evidence, got lite" at desktop-forward-00-0.000000 (tier lite, declines=1), then
  WEBGL_CANVAS_INACTIVE at desktop-forward-05-0.055872 (declines=2, canvas unmounted),
  then 6 reverse entries with empty deltas (comparisons never executed).
- narrow FAIL, 2 failures. First failure class: WEBGL_CANVAS_INACTIVE at
  narrow-forward-00-0.000000 (canvas inactive before the first probe).
- desktop-lite FAIL: TimeoutError, page.waitForFunction 10000 ms (cold-ready 33850 ms
  recorded before the forced-tier wait; failure snapshot retained).
- narrow-lite FAIL: TimeoutError, page.waitForFunction 10000 ms (cold-ready 11046 ms).
- desktop-reduced PASS, narrow-reduced PASS (0 failures each).

Headless roster - runtime/opening-triage-glm/headless-final-2026-10-06T23-20-17-611Z
(2026-10-06T23:20:18Z-23:34:50Z, exit 1, Chrome 154.0.8037.98, build index-DFY-biXM.js):

- desktop FAIL, 110 failures, every one "expected full tier ... got lite" (86 forward +
  24 pinned). First failure: desktop-forward-00-0.000000. declines=1 across all 86
  checkpoints, tier lite throughout, canvas live at the last checkpoint, reverse 43/43
  exact-zero deltas (fragment transforms compared at 9 points). Measured zeros:
  errors=0, httpErrors=0, contextLosses=0, shaderFailures=0.
- narrow PASS 0; desktop-reduced PASS 0; narrow-reduced PASS 0; desktop-lite PASS 0;
  narrow-lite PASS 0. Same measured zeros per case JSON.

No causal claim bridges the two records: window mode is the only launcher difference
that was varied, and it was not isolated against other factors. The desktop full-tier
gate retained its failure in both; its cause (machine-bound vs app-bound cold-load
frame cost) was not established here.

## Verifier corrections (scripts/verify-jgun-opening.mjs)

1. Launcher comment rewritten: it previously asserted Windows occlusion/presentation
   throttling "trips the ... ratchet ... a harness false cascade, not an app
   regression." Retracted. It now states only that the launch contract matches the
   sibling manufacturing verifiers, that both rosters are preserved, that headless
   launching did not clear the desktop full-tier gate, and that no causal claim is
   made. headless:true, args, viewport, DPR, thresholds, and tier expectations are
   unchanged.
2. Reduced-motion cases rewritten for the owner's explicit posters-throughout decision
   (authorized policy change, not a waiver). They no longer wait for
   drawingProof/sheet stats/canvas. Fresh reduced startup must now satisfy, with
   recorded evidence:
   - DOM poster present: fixed inset-0 z-0 backdrop containing the STATIC RENDER MODE
     and DWG NO. furniture text, aria-hidden, covering the viewport.
   - Layout stability: poster rect and document scrollHeight stable across samples.
   - Native narrative present: main with headings, [data-chapter] sections, and the
     3-button StationNav (nav[aria-label="Station navigation"]).
   - Zero canvas: no canvas element at any sample and every observed WebGL context
     disconnected with zero draws (detectWebGL2's probe, if still present, is detached
     and never draws).
   - Zero CAD/tool requests from navigation through the case: none matching /models/,
     *.glb, /draco/, or /inspection/ (full request census recorded in cadRequests).
   - No motion rig: window.__lenis absent, html lacks the lenis class,
     prefers-reduced-motion true. window.__telemetry presence is recorded but not
     gated (scrollStore attaches it at module load; see corrections below).
   - Native scroll: scrolls to the document midpoint and returns to top.
   - Proof: top and midpoint screenshots plus the full posterProbe JSON checkpoint.
   These assertions intentionally fail against the pre-change build (reduced still
   mounted the canvas there). App.tsx/StaticPoster.tsx/qualityStore.ts are owned by a
   separate worker and were observed mid-edit during this followup (qualityStore
   SHA-256 drifted 3D8F7794... -> 3BAB839E... between two reads); selectors above are
   text/DOM based to stay truthful across that work.
3. The four nonreduced full/lite cases and all their acceptance checks/thresholds are
   untouched; the drawing-proof availability gate now simply skips reduced cases (it
   is meaningless without a canvas).

node --check exit 0. Final verifier SHA-256:
D065390A2F9F0037CD9802499E7615C3D6E6EC452617675DAC9E9A4A7986A068.

## GPU status and handoff

No browser was launched in this followup; nothing to release. The parent owns the next
GPU run: rebuild after the sibling worker's App/StaticPoster/qualityStore changes, then
run the corrected full six-case roster independently. The corrected verifier's reduced
cases implement the new owner policy; the desktop full-tier failure remains the open
limit for owner decision.

## Parent-review corrections (2026-10-06, second followup)

Parent review found two defects in the new reduced poster branch; both fixed in
scripts/verify-jgun-opening.mjs only (no app source, no browser/build/staging):

1. Coverage NaN: posterProbe returned innerHeight but not innerWidth, so the viewport
   coverage assertion compared against undefined - 2 (NaN) and could never pass. The
   probe now returns document.documentElement.clientWidth - the layout viewport width,
   which excludes the native scrollbar that makes window.innerWidth too wide - and the
   coverage assertion uses that measured clientWidth. The failure message now records
   the measured rect versus viewport numbers.
2. Invalid no-telemetry predicate: App.tsx:7 eagerly imports TechnicalHUD, which
   imports scrollStore (TechnicalHUD.tsx:4), and src/state/scrollStore.ts:380 attaches
   window.__telemetry at module load - so __telemetry exists even with no canvas.
   Telemetry presence stays recorded in every posterProbe sample but is no longer an
   acceptance predicate. The real reduced invariants are unchanged: zero canvas
   elements, zero connected/drawing GL contexts, zero CAD/tool requests, no
   Lenis/html.lenis class, native scroll, poster/narrative/nav DOM, stability.

All four nonreduced full/lite cases, thresholds, and other assertions are untouched
(the remaining __telemetry reads all live on nonreduced paths). node --check exit 0.
Corrected verifier SHA-256:
D0BE455E8E193A9C383FC28AB1545D8204FF5E85A9ED722E9F34B77B13D865C9
(supersedes D065390A... above).
