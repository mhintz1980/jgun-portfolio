# JG-035 G6 diagnosis — desktop-full tier drop, cause established (2026-10-13)

Closes the "cause unestablished, no waiver" note in the 2026-10-06 final documentation
closeout (TODO.md): why the desktop-full opening roster case fails 110 expectations after
the effective tier becomes lite on the reference iGPU.

## Verdict

On a DPR-1 context the DPR staircase is a single step, so the **first** PerformanceMonitor
decline skips it entirely and calls `degradeQuality()`: full → lite, permanently. The
decline fires during the ~10 s sheet warm-up, when sub-45 fps frames on the Radeon 780M
are guaranteed. The desktop-full roster case demotes itself during load; the 110
expectation failures are the verifier reading a tier the page cannot hold at DPR 1 while
warming up. At DPR ≥ 1.25 the staircase absorbs 2–3 declines first, which is why the
narrow (DPR 3) case passes.

## Evidence

- **Recorded 2026-10-08** — `../orchestrated-continuation-2026-10-08/verification/diagnosis/renderer-quality/report.json`
  (preview `:4173`, headless Chrome 154, ANGLE/D3D11, AMD Radeon 780M): tier flips
  full → lite between t+4 s and t+8 s, `declines` 0 → 1, `warmReady` still **false** at
  the flip, warm complete only at t+12 s.
- **Live reproduction 2026-10-13** — `live-repro.json` in this folder (dev `:5199`,
  HEAD `eb550958`, clean load **without** quality lock, installed Chrome 154,
  ANGLE/D3D11 hardware): final tier `lite`, exactly 1 decline, `warmReady: true`,
  0 page errors. Same signature as the recorded evidence.
- 110-expectation figure: JG-035 final documentation closeout (TODO.md, 2026-10-06 entry).

## Mechanism (code refs at `eb550958`)

1. `src/scene/SceneCanvas.tsx:28` — `MAX_DPR = Math.min(2, window.devicePixelRatio)`;
   headless Chrome defaults to DPR 1, so MAX_DPR = 1.
2. `src/scene/SceneCanvas.tsx:35-37` — `DPR_STEPS = [MAX_DPR, 1.5, 1.25, 1]` filtered to
   ≤ MAX_DPR → **`[1]`**: the staircase has zero slack.
3. `src/scene/SceneCanvas.tsx:432` — `<PerformanceMonitor bounds={[45, 60]} flipflops={3}>`:
   any sustained frame slower than ~22 ms counts as a decline.
4. `src/scene/SceneCanvas.tsx:438` — first `onDecline`: `stepRef (0) < DPR_STEPS.length − 1 (0)`
   is false → `degradeQuality()` immediately.
5. `src/state/qualityStore.ts:77-83` — full → lite with no re-promotion path
   (`onIncline` only walks DPR back up). One decline is irreversible.
6. No warm-up guard: the decline lands during the sheet warm-up (`warmReady` false at the
   flip in both runs) — the window where shader compilation + live bake make slow frames
   certain on this device class.

## Candidate remedies (owner decision — none applied; JG-035 scope)

- Gate the PerformanceMonitor until `warmReady` (declines during warm-up are diagnostic,
  not tier signals).
- Require sustained declines before `degradeQuality()`, and/or add a re-promotion path on
  sustained incline.
- Verifier side: run the desktop-full case at DPR ≥ 1.25 or with an explicit full-tier
  lock when asserting full-tier expectations — at DPR 1 the demotion is deterministic,
  not a regression.

## Sibling artifacts (same day)

- Hardware-GL owner-ruling stills: `../stills-hardware-gl-2026-10-13/` (37 captures,
  0 errors, per-capture renderer + tier provenance, HEAD `eb550958`, quality-locked).
- Probe source: `.scratch/g6-tier-probe.mjs` (scratch, intentionally uncommitted; the JSON
  above records launch config, browser version and per-sample telemetry).
