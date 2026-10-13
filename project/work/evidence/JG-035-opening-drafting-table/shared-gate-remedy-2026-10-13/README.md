# JG-035 shared gate remedy — implemented and verified (2026-10-13, later session)

Owner authorized the shared remedy from the two same-day diagnosis packets
([G6](../g6-diagnosis-2026-10-13/README.md) ·
[load-flash](../load-flash-diagnosis-2026-10-13/README.md)): **one gate pair
closes both symptoms.** This packet records the implementation and its runtime
verification. No push, deploy or publication; committed to
`codex/jg033-signature-shot` only.

## Code changes (2 files)

1. **Warmup-gated PerformanceMonitor — G6 half.**
   `src/scene/SceneCanvas.tsx`: the monitor is no longer always-mounted around the
   scene. It is now a children-less sibling that mounts exactly once when
   `WarmStationPrograms` reports `warmfinish` (new `onWarmReady` prop sets
   `qualityMonitoring` state). Mount-gating was chosen over bounds/callback
   guarding because a fresh mount never admits warm-up frames into the monitor's
   rolling averages (drei `PerformanceMonitor.js`: samples begin at mount,
   averages evaluate at `iterations`=10; a bounds-gated always-on monitor would
   carry contaminated averages past warmfinish). Nothing in `src/` consumes the
   monitor's context (`usePerformanceMonitor` grep: zero hits), so un-nesting the
   children has no effect on the scene tree, and children are optional in drei's
   implementation. The DPR staircase, tier meanings and all handlers are
   unchanged.
2. **Drawing-ready model visibility gate — load-flash half.**
   `src/scene/TorqueWrenchHero.tsx`: the extraction-end fall-through (the branch
   reached before `drawingRuntime.ready` arms the registered concealment pose)
   now writes `modelRoot.visible = drawingRuntime.ready` instead of `true`. The
   identity-pose wrench can no longer render during the 1.5–8 s window where
   `DrawingLinework` still returns null; three.js prunes invisible subtrees at
   render time, so this is a hard cull, not an opacity effect.

## Verification (all on dev :5199, installed Chrome 154, ANGLE/D3D11 hardware, DPR 1, clean loads)

### G6 — tier now holds full through warm-up

`g6-probe-after-fix.json` (25 s sample run, `?qualityDiagnostics`): final tier
**full**, **0 declines** (pre-fix same probe 2026-10-13: `lite`, 1 decline),
`warmReady: true`, 0 page errors. Event chronology has the designed shape and
nothing else: `warmstart → cullrenderstart/end ×5 → warmfinish`, with **zero**
`ondecline`/`onincline`/`onfallback`/`degradequality` events. Observed tier was
`full` for every sample.

### Load flash — model provably never renders before the paper exists

`load-window-rows.json` + `load-window/` (250 ms-resolution live scene-state
timeline, 1600×900):

| t | scene state |
|---|---|
| ~0.7 s | model group not yet mounted; frame = BootSequence area only |
| **3.96 s** | model group mounts **already invisible** (`modelRoot.visible=false`, 59 meshes) |
| 9.18 s | sheet bake completes (`__sheetStats` present); model still hidden |
| **13.22 s** | `drawingRuntime.ready` arms → `modelRoot.visible=true` (registered, under-paper pose) |
| 19.15 s | `warmfinish` |

Pixel stats (`pixel-stats.txt`, corner-reference analyzer): the ~52 %-of-frame
dark region seen between canvas-alive and sheet-bake (bbox [152,104,1446,898],
mean luminance ≈18) is **identical pre- and post-fix** — it is the backdrop/fog
gradient, not the wrench. Honest correction to the load-flash packet's byte-size
proxy: the pre-fix 241 KB "dark wrench" PNG signature conflated the backdrop
with the wrench; the wrench's own absence post-fix is established by the live
scene-state timeline above, which is the authoritative evidence (repo rule:
telemetry over vision).

### Quick opening verifier A/B — 90 → 1 failures per viewport

`node scripts/verify-jgun-opening.mjs --url=http://localhost:5199 --quick` (raw
iteration baselines were ~49 MB JSON each; both were distilled into
`quick-ab-summary.json` after reading and deleted — full-roster evidence remains
the "done" bar):

- **With the fix** (`quick-ab-summary.json` → `withFix`): desktop FAIL (1),
  narrow FAIL (1) — only `*-forward-20-0.080400: lightning pixel proof failed`
  (changedBrightPixels 0 with mesh visible, fixed camera, shader valid;
  telemetry-level lightning assertions pass; checkpoint tier `full`).
- **Without the fix** (2-file stash A/B, `quick-ab-summary.json` → `abStashed`):
  desktop FAIL (90), narrow FAIL (90) — 89 × "expected full tier for browser
  evidence, got lite" per viewport (the verifier's own G6 reproduction; the
  lightning checkpoint itself ran at tier `lite`) plus the same lightning
  failure.

The lightning pixel proof failure is **pre-existing on this branch** (identical
with and without this change) and belongs to the already-open debt from the
2026-10-07/08 owner revisions: the trace was restaged as a non-advancing spark
at .66–.765 while the pixel-proof contract still expects the old advancing
trace at phase .67. It is the one remaining `--quick` failure and is **not**
introduced or worsened by this remedy.

### Static gates

`tsc --noEmit` clean · vitest **435/435** (41 files) · verifier static contract
92 checks / 0 failures in both runs.

## Not in scope (recorded, not done here)

- The secondary hardening options from the G6 packet (sustained-decline
  requirement, re-promotion path) and the verifier-side DPR/tier-lock fix for
  the full roster's desktop-full case.
- The lightning pixel-proof contract update (needs the new-roster expectations
  from the owner revisions).
- Any preloader/curtain presentation of the load window (owner brainstorm
  pending: `docs/PROMPT-load-window-brainstorm-2026-10-13.md`) — this gate is
  the substrate such a presentation would sit on.

## Reproduction

Probes are scratch (`.scratch/`, intentionally uncommitted):
`g6-tier-probe.mjs <url> <out.json>` (add `?qualityDiagnostics`),
`load-window-analyze.mjs <url> <outdir>`, `analyze-png.mjs <pngs...>`. This
packet holds their outputs.
