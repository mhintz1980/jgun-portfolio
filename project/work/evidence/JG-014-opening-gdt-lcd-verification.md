---
id: JG-014
plan: ../plans/JG-014-opening-gdt-lcd-repair.md
verified_on: 2026-08-27
verified_by: ZCode (repair pass; initial pass by Antigravity)
commit: c73018b (initial — defective) + repair commit on top (this change)
status: verified
---

# JG-014 — Verification Evidence: Opening Sequence, GD&T Annotations, and Rear-LCD Reveal

## Phase 1 — Initial verification (superseded)

The initial pass (commit c73018b) verified styling, labels, and build health,
but its rear-LCD dwell evidence was defective: it probed the camera POSITION
(`[-0.060, 0.080, -0.440]`) and stage alpha without proving the LCD was in
frame. Live measurement showed the exploded LCD cluster sits at world
`[−0.14, 0.00, 0.46]` (hero yaw exactly 0.85π, handleZ −0.354) — the dwell
camera pointed at empty space 0.68 m away on the opposite side of the model.
The pass also cited a nonexistent commit (3152571) and a window schedule
(0.519–0.534) derived from stale 1800vh-era measurements.

## Phase 2 — Audit findings (defects repaired in this pass)

1. **LCD dwell framed empty space** — orbit keyframes were never re-measured; only the window moved.
2. **Structural camera snap** — the orbit interpolated start→arc across the whole entry phase, then jumped to `dwell` at `dwellStart`.
3. **Stale explosion tracking** — hotspot/inspect offsets −0.331/−0.269 predate the pass-3 ladder (−0.354 handle): anchors drifted 23 mm off their parts at full explode.
4. **Wrong FLANGE-1 occurrence** — role-map has two rows (mount face z −0.1396, rear cap z −0.1895); last-wins resolution picked the rear cap for a "mount face" label.
5. **FCF glyph violations** — invented symbols (`↗`, `⏢`, `⌀.002 Ⓜ`) violated the literal-transcription rule (no drawing crop verification available in-repo).
6. **Panel occlusion persisted** — beat captions used `bg-slate-950/40 backdrop-blur-sm` filled panels; the gearbox case study became unreachable (suppressed across CH.02's whole content window).
7. **Hotspot visibility misalignment** — the LCD hotspot's chapters ([1,3]) never included the dwell's actual chapter (2); LcdFillLight ramped over 0.004 of scroll (~3 frames) from the wrong position.

## Environment

| Field | Value |
|---|---|
| Branch | `main` @ `0ddf096` + this repair (verified in an isolated `git worktree` to avoid a concurrently active JG-015 session's in-flight edits) |
| Preview URL | `http://localhost:4174` (freshly built & restarted after every rebuild; port 4173 avoided — the shared tree is mid-edit by the parallel session) |
| Model asset | `/models/Default.glb` (Draco, vendored decoders) |
| Probes | playwright MCP, `window.__telemetry` + live DOM geometry; screenshots not used as evidence |

## Phase 3 — Re-verification (fresh, 2026-08-27)

| Acceptance criterion | Probe | Result | Pass |
|---|---|---|---|
| No visible callout uses CSS `perspective`/`rotateX`/`rotateY`/`rotateZ` | Computed styles on all 5 `button[aria-pressed]` + 4 ancestor levels each | `perspective: none`, no rotate transforms — 0 violations | `[x]` |
| Datum A and rotor anchors resolve to different measured feature points | role-map spans + anchor offsets: rotor rear face `[0, 0, −0.196]` (center −0.1645 − 0.0315) vs Datum A rear bore face `[0.0001, 0, −0.1835]` (center −0.1645 − 0.019) | **12.5 mm apart** (raw centers were 0.1 mm apart); dev guard rejects any pair < 8 mm; all pairs ≥ 12.5 mm | `[x]` |
| 4–16%: groove motion visible without a filled panel | `:4174` at progress 0.0801 | Beat caption `bg rgba(0,0,0,0)`, `backdrop-filter none`, `pointer-events none`, groove labels present; `shift 0.65`, `ringSwitchZ +6.19 mm`, `ringSwitchRotZ 1.361 rad` (live motion); stageAlpha [1,0,0] | `[x]` |
| 25–46%: extraction visible without prose covering | `:4174` at 0.35 | CH.02 renders as transparent top-left caption (no fill/blur); `explodeFactor 0.407`, `gearRotation 15.45 rad` (spinning); case study behind `[ + CASE STUDY ]` toggle, `aria-expanded="false"` | `[x]` |
| Approved groove labels | DOM text during shift beat | `LOWER GROOVE OSHA BLUE · LOW SPEED`, `3X @120° HELICAL CAM SLOTS`, `UPPER GROOVE OSHA RED · HIGH SPEED` — verbatim | `[x]` |
| Rear LCD/buttons visible during stable pre-handoff dwell; JGun alpha ≈ 1 | `:4174` at 0.473 | Camera exactly `[−0.28, 0.08, 0.74]` fov 31 (the keyframe derived from the measured LCD world position `[−0.1407, −0.0005, 0.4624]`; live rig at dwell: `heroRotY 2.6704` = 0.85π, `handleZ −0.354`, `explodeFactor 1`); **LCD hotspot anchor projects at (526, 318) — dead center of the 1042×617 viewport**; badge in frame (721→1031 px); `stageAlpha [1, 0, 0]`; dwell caption + LCD hotspot both live (window-scoped visibility); clicking the badge holds the dwell framing (inspect dolly suppressed in-window) | `[x]` |
| Full / reduced-motion / keyboard / touch / poster | (a) `page.emulateMedia({reducedMotion:'reduce'})` + scroll 0.473: camera pinned `[0.32, 0.16, 0.42]` fov 42, `explodeFactor 0`, Lenis absent, static chapter card path. (b) Keyboard: LCD button `.focus()` ✓, `.click()` toggles `aria-pressed` false→true (async read), Escape dispatch clears selection. (c) Poster: forced `WEBGL_lose_context` → canvas unmounts, DOM narrative persists (4 chapter headings) | All tier paths behave; zero console errors across every probe | `[x]` |
| `npm run typecheck`, `npm run build`, fresh telemetry | Isolated worktree (`0ddf096` + repair diff only) | `tsc --noEmit` 0 errors; `vite build` ✓; all telemetry above captured on a freshly restarted preview | `[x]` |

### Schedule verification (stage windows)

- 0.473 → `stageAlpha [1, 0, 0]` (dwell; wrench holds exploded since ≈0.416)
- 0.545 → `[0.498, 0.502, 0]` — cross-fade midpoint exactly at the center of the 0.525–0.565 handoff window
- 0.60 → `[0, 1, 0]` enclosure dominant; camera easing onto the CH.03 keyframe

### Measurement provenance (LCD orbit)

- Document: 3×440vh + 660vh (CH.04) + 40vh footer = 2020vh; hero timeline window ≈ 0.177→0.458; explode completes ≈0.416 (probe: `gearRotation 25.133` = 8π at 0.47).
- LCD world = role-map anchor `[−0.007, −0.0005, −0.2125]` + handle offset −0.354 − `rig.center [0.07754, 0, −0.09063]`, rotated 0.85π → `[−0.1407, −0.0005, 0.4624]`; dwell camera = target + 0.32 m along the rear normal `[−0.44, 0.24, 0.86]`.
- start/return keyframes equal the base CAMERA_PATH blend at the window edges (smoothstep(0.26)/smoothstep(0.575) between CH.02/CH.03) — probe-confirmed continuous.

## Required Project Checks

- [x] `npm run typecheck` — 0 errors.
- [x] `npm run build` — 0 errors.
- [x] Preview restarted after every rebuild (worktree :4174; the shared :4173 tree was mid-edit by the concurrent JG-015 session and not built).
- [x] Runtime telemetry used for all 3D claims; no screenshot-derived claims.
- [x] Keyboard, touch, reduced-motion, and poster-tier behavior checked.
- [x] No protected `.scratch/` or parallel-session file committed or modified (JG-015 WIP left untouched in the shared tree; this pass committed only the seven files it owned).

## Residual Risk and Follow-up

- The click-to-inspect camera frames are rest-pose values; under CH.02's 153° hero yaw they still aim at un-rotated coordinates (pre-existing gap, most visible when clicking rotor/motor-housing mid-CH.02). The LCD dwell no longer triggers it (suppressed in-window), but the general fix — rotating inspect offsets by the live hero yaw — remains open for a future pass.
- At the tight CR-3 groove zoom the rotor/datum-A badges scale past the viewport edge (drei `distanceFactor` at ~0.19 m distance) — leaders still terminate correctly; the anchors are simply off-frame at that FOV by design (the groove zoom frames the grooves, not the motor stack).
- `ghostCount 0` regression (spec §5.2) remains open, untouched by this pass.
- Next queued: JG-015 (asset delivered at `0ddf096`, in progress by the parallel session), then JG-019 deployment.
