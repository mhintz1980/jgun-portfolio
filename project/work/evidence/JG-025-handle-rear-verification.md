# JG-025 — Handle-rear realism pass: verification record

**Status:** CLOSED VERIFIED 2026-09-05 — owner visual ruling PASS
**Ruling (verbatim, 2026-09-05, at the `:4174` dwell):** "i approve. check it off."
**Branch:** `zcode/jg-025-handle-rear` (worktree `jgun-portfolio-jg025`, off `main` @ `4158a6c`)
**Plan:** [JG-025-handle-rear-realism.md](../plans/JG-025-handle-rear-realism.md) · **Owner reference:** [handle-rear-owner-reference.png](../context/references/media/handle-rear/handle-rear-owner-reference.png)

## What was built

| Piece | Change | Files |
|---|---|---|
| A — Red/material swap | `lcdScreen` retuned to a dim dark field (emissive `#141a22` @ 0.6, was warm-white @ 5); new `lcdButtonRed` role (dark red base `#2e0606`, emissive `#d81414` @ 1.15); `lcd-housing` unit default → `shellBlack` (glossy black cap); new `lcdBezelRed` role (glossy enamel `#ad0707`, clearcoat 0.8). Reds pixel-sampled from the reference render (12,065 red px: average `#ad0707`, speculars `#f30101`, shadow end `#470000`). | `src/scene/rig/materials.ts` |
| Button de-stack (defect fix) | The three buttons (P002123/24/25) merged into ONE bucket baked in the first button's frame — the CAD's 9.9 mm occurrence offsets cancelled and all three rendered stacked as one blob (measured: merged mesh 15,260 verts spanning a single 11 mm band; confirmed by machine-vision on the before capture). Fixed with per-part units `lcd-button-${i}` (gb-fastener pattern, occurrence wrappers skipped) — each button now bakes into its own node and renders at its own placement. | `src/scene/rig/nodeRoles.ts` |
| B — LCD data readout | 512×256 `CanvasTexture` decal plane over the P002115 face: dark field, white `125.4 Nm` readout, battery bar (3/4), `AUTO`/`PEAK` status, `TRACK` mode + `kgf·m` units — content per the 2026-09-02 owner ruling. `MeshBasicMaterial`, `toneMapped: false`, drawn once (zero per-frame allocation). P002115 has no UVs (22-prims, `NO-UV` — JSON dump), so the plan's decal fallback applies. | `src/scene/rig/lcdCluster.ts` (new) |
| C — Button symbols | Dark ▲ / ⏎ / ▼ decal planes (8.5 mm, transparent canvas textures) on each button cap; symbols assigned by world-Y order (up/enter/down). The CAD carries symbol geometry (112/118/112 prims per button) but fused single-material, so dark-on-red needs decals (plan's fallback path). | `src/scene/rig/lcdCluster.ts` |
| Bezel ring | Glossy red frame (rounded-rect `ShapeGeometry`, outer = panel + 2.1 mm) around the screen, `lcdBezelRed`. | `src/scene/rig/lcdCluster.ts` |
| E — Fill light | `LcdFillLight` warm `#ffe8c0` @ 2.8 → cool-neutral `#e6eef7` @ 2.4 per the reference's cool studio mood (the screen is now the warm element). Same window/easing/position. | `src/scene/SceneCanvas.tsx` |

All decal placements are measured at rig-build time off the consolidated meshes
(world-space, rest pose) and parented to the part nodes — they ride the handle
explosion rigidly, register into `finalMeshes` (material-mode switcher + CH.04
dissolve cover them), and never ghost. `rig.lcdCluster` is the probe surface.

## Phase D — reveal framing

The existing dwell (`LCD_ORBIT_KEYFRAMES.dwell`, [−0.28, 0.08, 0.74] → target
[−0.14, 0, 0.46], fov 31) frames the full cluster: screen center-frame, the
three buttons immediately below it. No `LCD_ORBIT_KEYFRAMES`/`CameraRig`
change → **no ladder-touch, no §5 same-commit sync triggered** (ladder verified
byte-identical below).

## Machine verification (2026-09-05, fresh `:4174` preview, 1920×1080)

**Material identity at the dwell** (`__threeScene`/`__rig`):

- `P002115-1` screen: `MeshStandardMaterial` emissive `#141a22` @ 0.6 ✓
- `P001924-1` housing: `MeshPhysicalMaterial` `#1a1a1e` → now glossy black
  `shellBlack` values ✓ (probe: color `#0a0a0a` family, clearcoat 1)
- Buttons ×3 (own part nodes): `#2e0606` r 0.38 + emissive `#d81414` @ 1.15 ✓
- `lcdCluster`: bezel `#ad0707` clearcoat 0.8, readout decal, 3 symbol decals ✓

**De-stack proven in framebuffer pixels** (after capture, DOM hidden):
three separate red blobs at x≈867 px, centers 61 px apart vertically
(= the 9.9 mm CAD offsets at the dwell framing); before capture showed the
single-blob overlap. Captures: [jg-025-handle-rear/](jg-025-handle-rear/)
(`before-dwell` / `after-dwell` same-frame pair at progress 0.4730, plus
`after-dwell-dom` with page chrome).

**Readout visibility** (machine-vision, corroborated by pixel grid): dark
screen with white `125.4 N·m` + battery/mode glyphs, upright and legible;
red bezel ring reads; three red buttons with dark symbols below; endcap reads
glossy black. Vision used as supporting context only — telemetry + pixel
analysis are the primary witnesses.

**Ladder parity** (full pass, 0.10/0.473/0.52/0.64/0.90): `stageZ`
[−0.255, −0.230, −0.142, −0.099, −0.177], `outputZ` +0.050, `handleZ` −0.354,
`clutchZ` −0.291, `bearingZ` −0.197, `slidingZ`/`ringSwitchZ` −0.291 at dwell,
`ghostCount` 1, `slidingZ` −0.015 during the 0.10 shift window — **all exactly
the documented values** (no ladder/kinematics regression from the per-button
unit change).

**Performance** at the dwell (rAF deltas, 133 frames / 2.2 s): p50 16.7 ms,
**p95 16.8 ms**, max 16.9 ms — locked to the display vsync quantum, zero
PerformanceMonitor declines (canvas alive at every checkpoint through 0.90).

**Tiers:** full ✓ (above); reduced-motion ✓ (emulated `prefers-reduced-motion`:
canvas present, `handleZ` stays 0 across the full scroll, all four chapter
sections in DOM, cluster builds — 3 button meshes); poster ✓ (WebGL context
denied: `STATIC RENDER MODE` fallback renders, all chapters present, no
console errors).

**Build:** `npm run typecheck` clean · `npm run build` clean ·
`scripts/check-station2-contract.mjs` green (2,380,776 bytes, 7 roots, 7
anchors). **Bundle delta:** SceneCanvas chunk 813.31 → 818.66 kB
(**+5.35 kB** raw / **+1.95 kB gzip**, 229.86 → 231.81); media delta **0**
(readout/symbol textures are runtime canvases). Console clean at the dwell
(only the known `THREE.Clock` deprecation warning).

## Findings beyond the plan

1. **Pre-existing button-stack defect (fixed here):** described above — the
   shared `lcd-buttons` merge bucket collapsed all three buttons onto the
   first part's frame. This predates JG-025 (visible in JG-014-era captures
   as the blue "blob").
2. **Reference vs CAD layout:** the reference render shows the buttons in a
   horizontal row below the screen; the CAD places them in a 9.9 mm line that
   appears vertically stacked at the dwell camera. The fix renders them
   CAD-true (three separate buttons); the reference's exact row arrangement
   would require moving CAD parts — not done (part-number identity wins;
   owner rules at the stop point).
3. **Back-plate screws read dark** (black-oxide, JG-024) while the reference
   shows brighter metal bolts around the endcap — out of JG-025 scope, flagged
   for the owner look.

## Stop point — owner ruling pending

Preview `http://localhost:4174` at the LCD reveal dwell (scroll ≈ 47% or
`?chapter=2` deep link), 1920×1080. TODO checkbox stays unchecked until
Mark's visual pass on: red shade vs reference, readout content/legibility,
button symbol visibility, bezel presence, fill-light level (canon: soft,
never squint-inducing, still sharp and legible).

## Addendum — integration with JG-026 and push (2026-09-05, Mark's order)

Merged for push (all on `main`): roundtable-prep intake `06cf011` → JG-026
branch merge `93370ac` (codex/b1-b2-engineering-drawing, 5 commits, clean —
no conflicts) → JG-025 rebased + merged `31c09e4` (rebase clean).

**Integrated-build verification** (fresh `npm ci`, `:4174` restart):

- `npm run typecheck` clean; `npm test` 10/10 (JG-026 introTimeline suite);
  `npm run build` clean; `check-station2-contract` green.
- Dwell re-verified at natural progress 0.4746 (raw offset 18,990 / 32,625 —
  JG-026's intro changed the physical↔logical scroll mapping; the
  `window.__drawingProofProgress` pin drives the camera but not the GSAP rig,
  so the suite probes natural scroll): camera at the exact dwell pose
  [−0.28, 0.08, 0.74] fov 31; explode 1.0; ladder byte-identical
  (`stageZ`/`handleZ`/`clutchZ`/`outputZ`/`bearingZ` exact); `ghostCount` 1;
  buttons ×3 `#2e0606` + emissive `#d81414` @ 1.15 with symbols + bezel +
  readout all live.
- Perf at the dwell, steady state (3×3 s rAF, A/B with the JG-025 decals
  hidden/restored at runtime): p50 16.7 / p95 16.8 / max 16.9 ms with AND
  without the decals — the cluster adds zero measurable frame cost. Initial
  samples showed transient ~33 ms doubles for ~1 s after big scroll jumps
  (post-scroll compositing), gone at rest; recorded for honesty.
- Tiers on the integrated boot path: reduced-motion (canvas present,
  `handleZ` 0 across the full scroll, cluster builds); poster (WebGL denied
  → `STATIC RENDER MODE`, all chapters). Console clean (known Clock warning
  only).

Capture: [integrated-dwell-after-jg026-merge-1920x1080.png](jg-025-handle-rear/integrated-dwell-after-jg026-merge-1920x1080.png).

## Final ruling — CLOSED VERIFIED

**2026-09-05, owner visual pass at the `:4174` dwell (integrated main build):
PASS — "i approve. check it off."** TODO checkbox flipped to `[x]` with this
evidence record in the same commit.
