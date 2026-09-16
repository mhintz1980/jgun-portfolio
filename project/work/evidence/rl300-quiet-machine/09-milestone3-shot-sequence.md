# JG-033 Milestone 3, step 1 — the seven-shot camera sequence

Date 2026-09-15. Branch `codex/jg033-signature-shot`. Machine gates green; **owner visual
ruling pending** — passing gates cannot override a visual rejection.

This closes the gap [`08-handoff-2026-09-14.md`](08-handoff-2026-09-14.md) named as the
single biggest one: `src/scene/rl300/shot.ts` was still the Milestone-2 three-beat preview
camera. It is now the seven shots from the plan's shot table. The rest of Milestone 3
(unrestricted documented scroll extension, chapter/HUD synchronisation, the JGUN timing
corrections) is **not** in this change.

## What the camera does now

`SHOTS` in `shot.ts` is the single source of truth for both the sequence and the editorial
overlay, so the copy cannot drift from the camera that illustrates it.

| # | Shot | RL300-local `u` | Camera |
|---|---|---|---|
| 01 | The object | 0 – .12 | Low long-lens three-quarter exterior, fov 30, dollying in |
| 02 | The incision | .12 – .27 | Rises toward the section-facing side as the cut opens, fov 34 |
| 03 | The main intake | .27 – .41 | Tracks the `DUCT_INTAKE` side (z .43…1.36), fov 32 |
| 04 | A second breath | .41 – .61 | Descends beside the skid to the mounts (y 0….05), then arcs back to the engine, fov 33→34 |
| 05 | Two feeds, one exit | .61 – .76 | Widest of the sequence, carrying both supplies to `DUCT_EXHAUST` (z −1.68…−.30), fov 38 |
| 06 | Control the noise | .76 – .89 | Elevated over `ACOUSTIC_BAFFLES` (y 1.32…1.86) and the mounts, fov 31 |
| 07 | Resolve | .89 – 1 | Pulls back to an exterior close as the section shuts, fov 34 |

Lens language stays inside the plan's 28–45°; a unit test enforces that bound.

**Endpoints are authored against measured bounds, not eyeballed.** `public/models/msp-enclosure.glb`
was measured through its node transforms from the POSITION accessor extrema:
overall **x ±0.800, y 0 → 2.107, z ±1.683**, recorded as `MODEL_BOUNDS` in `shot.ts`.
Per-root: `DUCT_INTAKE` z .431…1.355; `DUCT_EXHAUST` z −1.683…−.303; `ACOUSTIC_BAFFLES`
y 1.319…1.862, z .385…1.352; `ISOLATION_MOUNTS` y 0….050.

## The one semantic change outside the camera

Shot 07 **closes the section again**, so `evaluateShot(1).plane` is now the closed exterior
(+0.85), not the deepest cut. `prepareModel.FINISHED_CUT` — which decides at prepare time
which ruled `hide` parts are deleted outright — read that value, and would have silently
started deleting far more geometry.

It now reads the explicit `DEEPEST_CUT` constant (−0.15, unchanged), and a test asserts
both that the sequence minimum equals it and that the sequence actually reaches it. Without
the second half of that assertion a shallower cut would leave ruled `hide` parts visible for
the whole sequence, which is precisely the Milestone-2 defect.

`scripts/verify-jg033-preview.mjs` carried the same stale comment on `FULL_CUT`; corrected.

## Machine gates

| Gate | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm test` | **80 passed** (was 76 — four new tests) |
| `npm run build` | PASS |
| `npm run check:station2` | PASS — 2,380,776 bytes, 7 roots, 7 CAD anchors |
| `node scripts/verify-jg033-preview.mjs` | **exit 0, 0 console/page errors**, 28 captures across 4 viewports |

Verifier detail, all four of 1440×900 / 390×844 / 768×1024 / 390×844-lite:

- **Reverse determinism pixel-identical** — 0 changed pixels at all three reversed anchors
  (`exterior`, `section`, `intake`), every viewport.
- **Cut choreography** — `exterior` +0.850, `section` +0.481, `intake` −0.150, `resolve`
  +0.850. Asserted: the cut deepens 01→04, never passes `FULL_CUT`, and `resolve` returns
  to exactly the `exterior` plane.
- **Framing gate (new)** — the projected model AABB at the two closed-shell anchors must lie
  entirely inside the frame (`|ndc| ≤ 1`); worst margin 0.93. Every anchor must stay within
  `|ndc| ≤ 2`; worst 1.75 (04, the underside pass). This is the gate that caught the first
  draft, where shots 03–06 ran to `|ndc|` 3.78 and the machine overflowed the frame.
- **Draw calls** 93–94 full (budget 150), 56–57 lite (budget 90).
- **Frame response** p50 16.6–16.7 ms, p95 17.2–17.8 ms — the display vsync quantum.
- Caps visible at the section and absent on the closed exterior (1.4e-5 … 1.7e-5 fraction);
  poster, reduced-motion, context-loss and both asset-failure fallbacks pass unchanged.

Device: the session workstation, Chrome via Playwright 1.56.1, ANGLE, `--enable-gpu`.

### Mutation checks

A suite that does not bite is not evidence. Two independent mutations, each reverted:

1. `KEYS[.76].position[0]` 3.66 → 0.66 (eye inside the shell): the envelope test fails, 10 pass / 1 fail.
2. `cutAt` closing term × 0.5 (07 never fully closes): the deepest/closed-cut test fails, 10 pass / 1 fail.

## Consumers updated

- `QuietMachinePreview.tsx` — editorial overlay reads `SHOTS` (title/caption/note), counter
  is `0n / 07`, the three scrubber anchors retarget to 0 / .20 / .51 and derive their pressed
  state from the shot index rather than assuming button index = beat.
- Poster fallback maps the seven beats onto the three captured poster frames
  (`exterior, section, section, intake, section, section, exterior`), so no shot can request
  an image that was never captured. `CAPTURE_POSTERS` skips `resolve` for the same reason.
- `prepareModel.ts` — `FINISHED_CUT` as above.

## Not done, deliberately

- Scroll extension, chapter/HUD synchronisation, the editorial overlay beyond the copy
  binding, and the JGUN timing corrections — the rest of Milestone 3.
- A seven-chip shot navigator. The footer keeps three anchors; seven chips risk the 390 px
  layout and the capture gates, and the scrubber already reaches every shot.
- New poster frames for shots 03/05/06.

## Reproduce

    npm run build
    npx vite preview --port 4173 --strictPort
    npm run typecheck && npm test && npm run check:station2
    node scripts/verify-jg033-preview.mjs

`scripts/verify-jg033-preview.mjs` hardcodes a Playwright path in an `npx` cache that no
longer exists on this machine; it was run with
`PLAYWRIGHT_MODULE=file:///C:/Users/Markimus/AppData/Local/npm-cache/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs`
after `npx --yes playwright@1.56.1 --version` repopulated the cache. That hardcoded default
is fragile and should become a resolved dependency — filed as a follow-up, not fixed here.
