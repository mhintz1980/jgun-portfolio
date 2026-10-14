# JG-035 verifier roster — lightning pixel-proof contract corrected for the O1 trace restaging (2026-10-14)

Owner-directed follow-up to the shared gate remedy
([../shared-gate-remedy-2026-10-13/](../shared-gate-remedy-2026-10-13/README.md)):
the one remaining `--quick` failure was a stale verifier oracle, not a product
defect. This packet records the correction and its evidence.

## Why the old check could never pass honestly

The pixel proof toggled the named `lightning` ribbon at intro t = .67 and
required changed bright pixels. The O1 owner revision (2026-10-07,
`electricalScore.ts`) restaged that region as a **non-advancing spark building
by `smooth01` from t .66 (`sparkStartT`) to the first burst at t .765**. At
t = .67 the authored spark intensity is

    smooth01((0.67 − 0.66) / (0.765 − 0.66)) = smooth01(0.0952) ≈ 0.0253

— measured telemetry at the checkpoint: `sparkAnticipation 0.02555` at phase
`0.67001` (`quick-corrected-contract-runs.json` → `sparkCheckpoint067`). A
2.5 %-intensity spark is sub-visual by design: the old placement measured
`changedBrightPixels 0, contourPixels 6`. The pre-O1 advancing trace it was
written for no longer exists. (The telemetry-level oracle was already O1-aware:
`checkElectrical` pins `sparkAnticipation` against `expectedElectrical(phase)`
at every intro checkpoint, with `spark-mid t=.7125` and `spark-last-frame
t=.76499` pinned samples.)

## The correction (scripts/verify-jgun-opening.mjs)

- t = .67 keeps the armed-window telemetry assertions (lamp off, pulse active,
  `lightningLuminance > 0`; `sparkAnticipation` recorded) and gains a comment
  documenting the oracle correction. No pixel proof there.
- The pixel proof (unchanged evaluation and thresholds) moved to the existing
  t = .78 burst/hold checkpoint, where `pulseHead` is asserted mid-burst —
  the trace head is at full glow on the same ribbon.

## Evidence

`quick-corrected-contract-runs.json` distils three `--quick` runs
(2026-10-14 ~02:19–02:35 local, dev :5199, page code = commit `e1b47188`
unchanged):

- **Run 1 narrow: PASS, 0 failures** — including the relocated proof:
  at phase 0.78003, `pulseHead 0.3039`, proof `changedBrightPixels 629,
  contourPixels 708` (vs 0/6 at the old placement).
- Every failure in every run is a tier demotion
  (`expected full tier…got lite` then `WEBGL_CANVAS_INACTIVE` = poster);
  **zero lightning failures anywhere**.
- The tier demotions are environmental, not regressions: the owner was
  actively using the machine (CPU 40–93 %; Manus/Chrome/ChatGPT the top
  consumers), warm-up stretched from ~12 s to 28.8 s, and each demoted
  checkpoint shows `declines: 1, warmReady: true` — i.e. a post-warm decline
  on genuinely slow frames, exactly the designed behavior the warmup gate
  permits. An unscrolled clean load under the same load held `full` with
  0 declines (`g6-probe-night-load.json`, 14 events, warmfinish-only
  chronology). The calm-machine natural-full green run on identical page
  code is [`../shared-gate-remedy-2026-10-13/quick-ab-summary.json`](../shared-gate-remedy-2026-10-13/quick-ab-summary.json).

## Spec check

`project/context/architecture/animation-spec.md` §5 was already updated during
the O1 revision (line 331: non-advancing `sparkAnticipation` .66–.765, "the
outline head does not move"; line 332: burst/hold .765–.79) — no spec change
needed; only the verifier proof placement was stale.

## Remaining open

- Full 6-case roster "done" evidence on a **calm machine** (this session's
  machine was busy; natural full-tier evidence requires idle CPU). Expected
  green given: calm-machine quick green at `e1b47188` + tonight's narrow green
  with the corrected contract.
- The G6 packet's secondary hardening options remain unapplied by scope
  decision (sustained-decline requirement, re-promotion path, verifier-side
  DPR/tier-lock for full-tier assertions under load).
