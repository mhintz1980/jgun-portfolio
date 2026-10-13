# JG-035 opening load-flash — shadowed wrench before paper/desk (2026-10-13)

Owner report: a shadowed torque wrench is visible as the page loads, before the paper
and desk appear. Diagnosis verified in code and measured live on 2026-10-13.

## Verdict

Two conditions stack:

1. **The sheet world renders nothing until the bake completes.**
   `src/scene/drawing/DrawingLinework.tsx:273` starts `baked` as null and
   `DrawingLinework.tsx:334` returns `null` until the cache decode / live bake
   finishes — no paper, no desk, no vellum.
2. **The wrench's concealment only arms once the drawing runtime is ready.**
   The under-paper registered pose branch (`src/scene/TorqueWrenchHero.tsx:300`) is
   gated on `drawingRuntime.ready`; before that, execution falls through to the
   extraction-end branch (`TorqueWrenchHero.tsx:353-356`), which sets
   `modelRoot.visible = true` at the identity pose (origin). With every opening
   lighting state off at scroll 0, the camera frames a dark wrench silhouette
   against `#05070a`.

`BootSequence` still mounts but does not occlude the canvas, so nothing masks the
window.

## Measured window (2026-10-13, dev :5199, clean load, live-bake path)

Timed captures in this folder (`marks.json` has telemetry per mark; installed
Chrome, ANGLE/D3D11 hardware, 1600×900):

| mark | frame | what |
|------|-------|------|
| t+0.5 s | ~6 KB PNG | near-empty |
| t+1.5 s | ~241 KB | dark wrench established, no sheet |
| t+3 s / t+5 s | ~235–241 KB | unchanged (wrench window) |
| t+8 s | ~747 KB | sheet/desk world present; `warmReady: true` at the same mark |

So the window is roughly **1.5–8 s** on the live bake; a precompute cache hit shrinks
it but does not close it (decode still trails canvas mount). The same run reproduced
the G6 tier flip (full→lite by t+8 s, 1 decline) — see
`../g6-diagnosis-2026-10-13/`.

## Same root class as G6

Both symptoms are "canvas-alive ≠ opening-ready" with no gate between them:
the scene renders live content immediately while the quality monitor runs and the
sheet bakes. Reference pattern: **oryzo.ai ships its opening behind an explicit
preloader** — `<div id="preloader"><canvas id="preloader-canvas"></canvas></div>` is
present in the initial HTML (checked 2026-10-13). Nothing of their 3D world is
exposed until ready.

## Candidate remedies (owner decision — none applied)

- Keep the model invisible until `drawingRuntime.ready` (or gate the whole scene
  behind a brief curtain/preloader until warm) — removes the flash.
- Combined with warmup-gating the PerformanceMonitor (G6 packet), one gate closes
  both symptoms.
