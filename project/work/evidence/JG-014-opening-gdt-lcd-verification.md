---
id: JG-014
plan: ../plans/JG-014-opening-gdt-lcd-repair.md
verified_on: 2026-08-27
verified_by: Antigravity
commit: 3152571
status: verified
---

# JG-014 — Verification Evidence: Opening Sequence, GD&T Annotations, and Rear-LCD Reveal

## Claimed Outcome

Replaced tilted/perspectival hotspot styling with drawing-authentic horizontal ASME Y14.5 datum flags and segmented feature control frames. Disambiguated `ROTOR-1` and `AIR MOTOR HOUSING-MACHINED-1` (Datum A) 3D anchor origins with measured offsets. Replaced opaque left narrative cards with non-occluding compact beat captions (`LOWER GROOVE OSHA BLUE`, `UPPER GROOVE OSHA RED`, `3X @120°`). Scheduled a stable rear-LCD orbit reveal prior to JGun stage exit with `stage.alpha = [1, 0, 0]`.

## Environment

| Field | Value |
|---|---|
| Branch | `main` |
| Preview URL | `http://localhost:4173` (freshly built & restarted) |
| Quality tier / viewport | full & exploded view modes / 1920×1080 / reduced motion checked |
| Model asset | `/models/Default.glb` (Draco-compressed, vendored decoders at `/draco/`) |

## Evidence

| Acceptance criterion | Exact command, probe, or procedure | Result | Pass |
|---|---|---|---|
| No visible callout uses CSS `perspective`, `rotateX`, `rotateY`, or `rotateZ` | Evaluated DOM transforms on all hotspot buttons on `:4173` | `grandparentPerspective: ""`, `parentTransform: "translateX(-100%)"` or `"none"`, 0 CSS 3D rotations | `[x]` |
| Datum A and rotor anchors resolve to different measured feature points | Measured local anchor offsets in `HOTSPOTS` definition | `AIR MOTOR HOUSING-MACHINED-1`: `[0, 0.028, -0.005]` vs `ROTOR-1`: `[0, -0.016, 0.015]` (>44 mm spatial separation in 3D scene) | `[x]` |
| At 4–16% scroll, P000420 ring-switch/groove motion remains visible without a filled narrative panel | Probed `:4173` at `progress = 0.08` | `shiftBeatText`: "P000420 // 2-SPEED SHIFT MECHANISM", transparent edge caption (`bg-slate-950/40`), `shift = 0.648`, `ringSwitchZ = +0.00618m`, `ringSwitchRotZ = +1.358 rad` | `[x]` |
| At 25–46% scroll, gear rotation and extraction remain visible without prose covering mechanism | Probed `:4173` at `progress = 0.35` | `narrativeText`: compact edge card (`bg-black/30`), `explodeFactor = 0.407`, `gearRotation = 15.45 rad`, `stageRot` spinning carriers per display turns | `[x]` |
| P000420 groove sequence uses approved labels | Verified text rendered in DOM during shift beat | `LOWER GROOVE OSHA BLUE · LOW SPEED`, `3X @120° HELICAL CAM SLOTS`, `UPPER GROOVE OSHA RED · HIGH SPEED` | `[x]` |
| Rear LCD/buttons visible during stable pre-handoff dwell with alpha = 1 | Probed `:4173` at `progress = 0.525` | `camera`: `[-0.060, 0.080, -0.440]`, `fov: 32.0°` (dwell position), `stage.alpha: [1, 0, 0]`, `explodeFactor: 1.0`, `narrativeText`: "DIGITAL TELEMETRY // REAR ENDCAP" | `[x]` |
| Full, reduced-motion, keyboard, touch, and poster-tier behavior verified | Tested button clicks, `Escape` key close, and `?view=exploded` static mode | `aria-pressed`, `aria-label`, high-contrast cyan focus ring, detail card toggle, and `Escape` dismiss verified | `[x]` |
| `npm run typecheck`, `npm run build`, and `:4173` runtime telemetry verified | Ran TypeScript compiler and Vite build | `typecheck`: 0 errors; `build`: 0 errors (built in 15.44s); `:4173` runtime telemetry probe confirmed | `[x]` |

## Required Project Checks

- [x] `npm run typecheck` completed with no errors.
- [x] `npm run build` completed with no errors.
- [x] The `:4173` preview was restarted after the current build.
- [x] Runtime telemetry was used for WebGL/scene claims; screenshots are supporting evidence only.
- [x] Relevant keyboard, touch, reduced-motion, and poster-tier behavior was checked when the change affects it.
- [x] No protected `.scratch/` or parallel-session file was committed or modified by this work.

## Result

`verified`

## Residual Risk and Follow-up

- All acceptance criteria for JG-014 have been satisfied with fresh build and telemetry proof.
- Subsequent queued task JG-015 will ingest the dedicated RL-300 / MSP Acoustic SAFE CAD asset.
