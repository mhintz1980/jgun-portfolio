# JG-026 — B1/B2 engineering drawing → 3D extraction · verification

**Status:** machine gates complete · **Mark's `?chapter=0` visual ruling is OPEN.**
**Branch:** `codex/b1-b2-engineering-drawing` · **Plan:** [JG-026](../plans/JG-026-b1-b2-engineering-drawing.md)
**Run:** 2026-09-05, `http://localhost:4173/?chapter=0`, ANGLE (AMD Radeon 780M, D3D11), Chrome headless,
1920×1080 and 390×844, `deviceScaleFactor: 1`.

This record **supersedes the 2026-09-03 draft in this file**, which described a superseded run
(IoU 0.9966, edge XOR 55.5% FAILED, crossing 0.850, travel 0.620) and marked determinism,
performance and tier fallbacks NOT RUN. Every number below comes from the current run and is
reproducible with the four commands in [§0](#0-how-to-reproduce). Raw output:
[`b1-b2-rebuild/proof/report.json`](b1-b2-rebuild/proof/report.json),
[`b1-b2-rebuild/proof/supplemental.json`](b1-b2-rebuild/proof/supplemental.json).

---

## 0. How to reproduce

```
npm run typecheck && npm run build
npx vite preview --port 4173 --strictPort        # restart after EVERY rebuild
npm run test                                     # pure timeline/pacing unit contracts
node scripts/check-b1b2-contract.mjs             # pure-math geometry contracts
node scripts/verify-b1b2-rebuild.mjs             # runtime: pacing, registration, determinism, perf, tiers
node scripts/verify-b1b2-supplemental.mjs        # runtime: release continuity, contact, pulse, lite/poster/reduced
node scripts/export-sheet-template.mjs           # Mark's C-size SVG template
```

| Gate | Result |
|---|---|
| `npm run typecheck` | GREEN |
| `npm run build` | GREEN |
| `npm run test` (vitest, 10 tests) | GREEN |
| `scripts/check-b1b2-contract.mjs` | 24 PASS / 0 FAIL |
| `scripts/verify-b1b2-rebuild.mjs` | 0 page errors, 0 console errors, both viewports |
| `scripts/verify-b1b2-supplemental.mjs` | `supplemental-gates-passed-owner-pending` |
| `npm run check:station2` | PASS (2 380 776 bytes, 7 named roots, 7 CAD anchors) |

---

## 1. Restoration of the two motion-smoothing layers (Part 1, items 1–3)

The previous attempt deleted both of the site's motion-smoothing layers so its own determinism
gate would pass. Both are restored, and determinism is now proved **against them**.

| Layer | Previous attempt | Now |
|---|---|---|
| Camera damping | `currentPos.copy(goalPos)`, `camera.fov = goalFov` | `1 - exp(-6 · min(delta, 0.1))` on position, target and FOV |
| Pointer parallax | removed | `goalPos.x += pointer.x · 0.03`, `y · 0.02` (suppressed while the sheet is being read — a drifting camera over a flat print reads as a wobble) |
| Pulse camera shake | removed | six frame-counted sub-pixel frames, restored |
| Scroll-rest orbit | removed | 0.3°/s at scroll rest, `0.12 < progress < 0.545`, restored |
| Hero timeline | `retainedHeroState()` sampler keyed off `getBoundingClientRect()` | GSAP `ScrollTrigger` timeline, `scrub: 0.6`, `trigger: '[data-chapter="1"]'`, proxy object — the pattern `animation-redo.md` lists under REUSE |
| Gear idle | removed | wall-clock `idleAngle` accumulation, restored |
| CAD dissolve clock | `uTime = progress * 20` | `uTime += delta`, restored |

Also restored, because they were the same class of out-of-scope deletion:
`vitest` + the `npm run test` script + `src/scene/drawing/introTimeline.test.ts` (rewritten
against the new API, 10 tests), and `project/context/agent-skills.md` (reverted to its
`main` rows — the `.agents/` in-repo skill duplicates it pointed at are removed).

### Determinism on the damped, GSAP-scrubbed system

The harness settle-gates instead: after every scroll move it waits for the scroll-derived
channels (camera pose and goal, FOV, explode, ghost, shift, drawing phase, pose time, minZ) to
change by ≤ 1e-7 for 10 consecutive rendered frames, up to 9 s, and only then reads the
checkpoint. Sixteen checkpoints are read forward and then in reverse.

| Metric | Desktop | Mobile |
|---|---:|---:|
| Checkpoints that failed to settle | **0 / 16** | **0 / 16** |
| Worst camera-goal residual (fwd vs rev) | 0.00e+0 | 0.00e+0 |
| Worst drawing-state residual | 0.00e+0 | 0.00e+0 |
| Worst rig residual (explode/ghost/shift/stageZ) | 0.00e+0 | 0.00e+0 |
| Worst **rendered** (damped) camera residual | **7.76e-7** | **7.76e-7** |

Per-checkpoint worst residual, desktop (progress : max abs diff):

```
0.0024:3.28e-7  0.0240:5.01e-8  0.0504:1.98e-7  0.0744:7.05e-7  0.0960:6.55e-7
0.1080:7.60e-7  0.1152:7.19e-7  0.1200:7.36e-7  0.1800:7.24e-7  0.3000:7.24e-7
0.4500:7.31e-8  0.5300:5.03e-7  0.6500:7.76e-7  0.7800:3.77e-7  0.9000:7.38e-7
0.9900:2.34e-7
```

**Residual disclosed, not hidden:** the ~7.8e-7 floor is the exponential damp's asymptote —
`1 - exp(-6Δ)` converges but never arrives, so a settled read is within a few parts in 10⁷ of
its goal, not bit-identical to it. The undamped goals, the drawing state and the rig ARE
bit-identical forward and reverse (0.00e+0). Two channels are excluded from the gate by
construction and named here rather than removed: the **scroll-rest orbit** (bounded ±0.003 m,
active only at rest for `0.12 < progress < 0.545`) and the **gear idle**, both of which advance
on wall clock deliberately.

Reduced motion is also damped rather than deleted: two reads at different scroll positions
agree to a residual of ≤ 1e-6 (`supplemental.json → reduced.staticResidual`), with
`focus = 1`, `pulse = 0`, `waveEnabled = 0`.

---

## 2. Pacing (Part 2, items 1 + 2)

Mark: *"I want each percentage of the total scroll to be MORE animation time"*, and the orbit
into the rise specifically was too quick.

Both levers are used. **Lever B** widens the intro's share of the document from 0.12 to
**w = 0.30**; **Lever A** raises the document height on top of that so no downstream chapter
merely holds station — every one of them gains distance.

The mechanism is a single function, `pacedProgress()` (`introTimeline.ts`), applied once in
`ScrollRig`. It maps raw document scroll onto the progress axis the whole site is authored
against: the intro's `0.000–0.120` of progress is stretched over 0.30 of the document, the
remaining `0.120–1.000` over the other 0.70, joined by a C1 blend of half-width 0.025 raw.
**Not one downstream constant moved** — `PATH_SEGMENTS`, `CHAPTER_RANGES`,
`STAGE_TRANSITIONS`, `LCD_REVEAL_WINDOW` and the CameraRig literals are all untouched.

### Before / after

| | Before | Pure Lever B (w=0.30) | **Shipped (A + B)** |
|---|---:|---:|---:|
| Document height | 2020vh | 2513.7vh | **3120vh** |
| Scroll distance (`scrollHeight − innerHeight`) | 1920vh | 2413.7vh | **3020vh** (measured 30.2 vh) |
| Intro share of document | 0.12 | 0.30 | **0.30** |
| Intro absolute scroll | 230.4vh | 724.1vh | **906.0vh** (measured 9.06 vh) |
| Intro multiple | 1.00× | 3.14× | **3.93×** |
| Downstream absolute scroll | 1689.6vh | 1689.6vh | **2114.0vh** (measured 21.14 vh) |
| Downstream multiple | 1.00× | 1.000× | **1.251×** |

### Per-chapter absolute scroll — nothing downstream lost distance

Progress spans are unchanged, so each chapter's absolute distance is
`Δprogress / 0.88 × downstream absolute`.

| Region | Progress span (unchanged) | Before (vh) | **After (vh)** | Ratio |
|---|---:|---:|---:|---:|
| CH.01 beats `0.120 → 0.229` | 0.10917 | 209.6 | **262.2** | 1.251× |
| CH.02 `0.229 → 0.458` | 0.22917 | 440.0 | **550.5** | 1.251× |
| CH.03 `0.458 → 0.688` | 0.22917 | 440.0 | **550.5** | 1.251× |
| CH.04 `0.688 → 1.000` | 0.31250 | 600.0 | **750.7** | 1.251× |
| **Downstream total** | 0.88 | **1689.6** | **2114.0** | **1.251×** |

Measured section track heights (`SCROLL_TRACK_VH`): intro 906, chapter-0 237, chapter-1 576,
chapter-2 541, chapter-3 811, footer 49 → 3120vh; runtime measurement agrees to 1e-4 vh.

**The retained CH.02 timeline still sees the window it was verified against.** The hero GSAP
ScrollTrigger measures `[data-chapter="1"]` in raw DOM space, so the track heights are chosen
to land it back on the same paced progress:

| | Target (pre-JG-026) | Measured now | Error |
|---|---:|---:|---:|
| Trigger open (`top bottom`) | 0.177083 | 0.177029 | 5.4e-5 |
| Trigger close (`bottom top`) | 0.458333 | 0.458429 | 9.6e-5 |

### Redistribution inside the intro

Owner direction: the focus rack needs the least extra room, the orbit/rise and the shockwave
need the most. Scroll time and pose time are now separate axes (`introPoseTime()`), so the pose
geometry and the 44-step solver are untouched by any pacing change.

| Phase | Old normalized | **New normalized** | Old absolute | **New absolute** | Multiple |
|---|---:|---:|---:|---:|---:|
| Focus rack | 0.00–0.20 | **0.00–0.14** | 46.1vh | **126.8vh** | 2.8× |
| RESERVED — opening text (Item 6) | — | **0.14–0.30** | — | **145.0vh** | new |
| Ordered excitation | 0.20–0.40 | **0.30–0.56** | 46.1vh | **235.6vh** | 5.1× |
| Rise, with the camera orbit inside it | 0.40–0.85 | **0.56–0.88** | 103.7vh | **289.9vh** | 2.8× |
| Camera orbit window | 0.40–0.95 | **0.46–1.00** | 126.7vh | **489.2vh** | **3.9×** |
| Detachment → shockwave | 0.85–1.00 | **0.88–0.96** | 34.6vh | **72.5vh** | 2.1× |
| Print fade | 0.94–1.00 | **0.96–1.00** | 13.8vh | **36.2vh** | 2.6× |

---

## 3. The excitation — Mark's two questions, answered on screen (Item 3)

Frames: `proof/desktop-pulse-0.30.png` … `-0.54.png`, `proof/mobile-pulse-*.png`.

**Q1 — is it happening while the view is still blurred? NO.** `focus` reaches exactly 1.000
at normalized 0.14; the excitation does not start until 0.30. Measured at every pulse frame:

| Normalized t | 0.30 | 0.36 | 0.42 | 0.48 | 0.54 |
|---|---:|---:|---:|---:|---:|
| `focus` | 1 | 1 | 1 | 1 | 1 |
| `pulse` | 0 | 1 | 1 | 1 | 1 |
| `pulseHead` (normalized arc) | 0.000 | 0.231 | 0.462 | 0.692 | 0.923 |
| peak linear luminance | 0 | 7.672 | 7.672 | 7.672 | 7.672 |

**Q2 — is it on the linework the JGUN lifts out of? YES.** The traced contour comes from the
mask render, and that pass renders **only** `layout.views[0]` — the primary side elevation —
which is the same view `relativePose()` registers the model to and the same one it rises out
of. 2449 traced points, 1.2600 m perimeter. Visible in `desktop-pulse-0.42.png`: the trace runs
the outline of view 01 and nothing else on the sheet is lit.

Both were already true, so this was an intensity/legibility problem — and the largest single
cause was found: **bloom was being forced to zero for the whole intro.**
`PostProcessingComposer` zeroed `bloomRef.current.intensity` whenever `progress <= 0.12`, so
the brightest thing on the sheet was rendered with the glow deliberately switched off.

Changes:

| | Before | Now |
|---|---|---|
| Geometry | 1 px `Line` (`linewidth` is ignored on every WebGL platform) | 5 mm two-sided ribbon built along the same contour (`buildProfileRibbon`) |
| Head | `exp(-(d/0.022)²)` | `exp(-(d/0.045)²)` |
| Tail | `·0.22`, 0.06 arc | `·0.55`, 0.055 arc **exponential decay length** |
| Traversed arc | nothing | stays energised at 0.22 behind the head — the circuit visibly completes |
| Flicker | kept | kept (`0.9 + 0.1·sin(head·1700)`) |
| Bloom during intro | **forced to 0** | follows the excitation, `+0.30` on top of rest |

**Restraint / JG-021 light canon.** Peak linear luminance **7.672** against the
`luminanceThreshold` 0.6 bloom gate — 12.8× the gate, i.e. squarely bloom-eligible. The
previous build's head was already 7.05, so this is a 1.09× rise in peak radiance, not a new
lighting regime; the visibility comes from the ribbon width, the real tail and the bloom being
switched on. The added bloom intensity (0.30) stays below `BLOOM_PEAK` (0.65), so the intro
cannot outshine a station transition.

---

## 4. The shockwave (Item 4)

Frames: `proof/desktop-wave-0.88.png` … `-0.99.png` (and mobile).

**Caused by separation, not by a phase boundary.** Trigger is the solved crossing from the
44-step bisection on the lowest transformed vertex — unchanged mechanism, re-solved after the
180° in-plane reorientation of §6.1:

| | Value |
|---|---|
| Solved crossing (pose time) | **0.8888459503339448** (desktop and mobile identical) |
| Contact point (sheet-local) | `[0.010016959952793378, 0.10634234769398712, −8.30e-15]` |
| Contact within the plane | **8.3e-15 m** |
| Travel | 0.22 m |

**Reaches the edge of the page.** Far sheet corner from the contact point: **0.650 m**. Front
reach at wave time 1: **0.780 m** — the front clears the far corner with 20% margin.

| Normalized t | 0.88 | 0.90 | 0.92 | 0.94 | **0.96** | 0.99 |
|---|---:|---:|---:|---:|---:|---:|
| wave time | 0.174 | 0.380 | 0.587 | 0.794 | **1.000** | 1.000 |
| front radius (m) | 0.185 | 0.334 | 0.482 | 0.631 | **0.780** | 0.780 |
| wave active | 1 | 1 | 1 | 1 | **0** | 0 |
| print opacity | 1.0000 | 1.0000 | 1.0000 | 1.0000 | **1.0000** | 0.1575 |
| model minZ (m) | 0.0144 | 0.0326 | 0.0522 | 0.0730 | 0.0944 | 0.1282 |

**One pass, no lingering, no repeat.** The front is a single travelling Gaussian, so every point
on the sheet is crossed exactly once; `waveActive` is 1 through the pass and 0 afterwards.

**The sheet no longer fades out from under it.** The print is held at opacity 1.000000 at every
frame with wave time < 1 and only fades over `0.96 → 1.00`.

| Parameter | Before | Now | Why |
|---|---|---|---|
| Radial attenuation | `exp(-8r)` | `exp(-1.1r)` | `exp(-8r)` was 0.0034 at 0.71 m — dead long before the border |
| Temporal decay | `exp(-5t)` | `exp(-1.4t)` | resolves in one pass without dying mid-sheet |
| Front speed / offset | `0.65t` | `0.06 + 0.72t` | starts as a ring clear of the contact, ends past the far corner |
| Front width | 0.055 | 0.075 | ~1.3 wavelengths inside the front |
| Carrier | `sin(180r − 42t)` | `sin(110r − 34t)` | one crest and one trough per crossing |
| Amplitude | 0.005 m | **0.022 m** | 0.005 m on a 0.906 m sheet at an oblique angle was invisible |
| Light | none | the front also lights the paper it passes over | geometric displacement alone does not read at that viewing angle |

---

## 5. Scroll-jacking — proposal, one implementation (Item 5)

Full proposal: [`work/inbox/JG-026-committed-pace-proposal.md`](../inbox/JG-026-committed-pace-proposal.md).

Implemented **only** the one inside the B1/B2 intro window: the detachment commit
(`src/scene/scrollCommit.ts`), covering normalized 0.86 → 1.00. Everything downstream is left
as a written proposal for Mark to rule on.

It is a **rest-triggered commit**, not a pin and not a hijacked wheel event: after 260 ms of
quiet with velocity below 0.02 raw/s inside the window, the page eases (1.15 s) toward whichever
end the visitor was last travelling toward. It changes where you come to rest, never whether you
can go anywhere.

Measured on the running build, 1920×1080, 0 page errors:

| Case | Action | Result | Verdict |
|---|---|---|---|
| Forward commit | land at raw 0.2720 (normalized t 0.954) and stop | eases to raw 0.30001, **t = 1.000** | the detachment run completes |
| Scroll against it | land at raw 0.2720, then one wheel-up | eases to raw 0.25800, **t = 0.860** — the window's *start* | symmetric; the visitor is carried out in **their** direction, never trapped |
| Escape | land at raw 0.2720, press Escape | held at raw 0.27201, t = 0.9067, and disabled for the session | accessibility parity |

Hard constraints held: no exit button; any input cancels immediately and for the rest of that
pass; Escape cancels and disables for the session (parity, not a second UI); fully symmetric
under reverse scroll; every position in the window remains reachable and the rendered frame is
still a pure function of scroll (determinism table in §1 is unaffected); never mounted in the
reduced-motion tier (`ScrollRig` does not mount there at all); and inert whenever a proof probe
has pinned progress or set `__scrollCommitDisabled`.

---

## 6. Drawing realism (Item 7)

### 6.1 The sheet is read right-way-up throughout (7.1)

Root cause: `SHEET_ROTATION` is forced to be the primary view rotation's inverse — that
identity is what lands the extracted model on world identity at the handoff — so the primary
view's in-plane orientation decides which way the print faces once it is lying in the world XZ
plane. The old orientation put printed-up on world **+X**; the CH.01 hero camera sits at
(0.32, 0.16, 0.42), and +X projects to screen-**down** from there, so the sheet was read from
its far edge with every annotation inverted.

Fix: rotate the primary view 180° in-plane. `SIDE_ROTATION` becomes `(-z, -x, y)`. The view
direction along the model's +Y is unchanged, and it fixes two things at once:

* printed-up moves to world **−X**, which has a **positive** screen-up component from the hero
  camera — the print reads right-way-up from the moment it appears until the model has left it;
* the tool now sits **grip-down** on its own elevation, which is how it is held. The previous
  print had the pistol grip pointing up.

Measured `camera.up` through the intro (desktop): `[-1, 0, 0]` at t = 0.00, 0.08, 0.20 and 0.42;
`[-0.813, 0.582, 0]` at 0.70; `[-0.143, 0.990, 0]` at 0.88; `[0, 1, 0]` at 1.00. The contract
check asserts `SHEET_UP_WORLD · heroOffset < 0`, so the failure mode cannot silently return.

Compare `proof/desktop-phase-0.85.png` from the superseded run (title block inverted at the far
edge) with `proof/desktop-phase-0.88.png` from this one.

### 6.2 Callout leaders — 6 crossings → 0 (7.2, 7.4)

The anchors were always right (`projectFeature()` puts each arrow on the true projected CAD
feature). The labels were on a hardcoded rail — `tx = 100 + i·295, ty = 185 + (i%2)·45` for the
primary callouts and `tx = left + 12 + i·(right−left)/3` for the section ones — regardless of
where their anchors landed.

Replaced with real placement:

* one callout lane **outboard of the view block on the left**, chosen because every anchor is on
  the primary elevation or the section directly below it and both have open sheet to their left,
  so no leader has to cross another view to reach its label;
* labels separated with an order-preserving 1-D pass inside the lane's usable band;
* **the slot assignment is searched exactly.** Sorting by anchor Y is the obvious answer and it
  is wrong — two straight leaders ending on a common vertical line can still cross when their
  anchors differ in X. With ≤ 8 callouts the assignment space is small enough to enumerate, so
  the result is the provable minimum over all orderings, with total leader length as the
  tie-break;
* datum flags get the same treatment in the clear gap between the elevation and the end view.

| | Before | After |
|---|---:|---:|
| Leader crossings (proper segment intersections, all pairs) | **6** | **0** |

Counted at runtime and published as `telemetry.drawing.leaderCrossings`, so a regression shows
up in the harness rather than in a screenshot.

### 6.3 True third-angle projection (7.3)

The title block printed "ORTHOGRAPHIC · THIRD ANGLE" over four unrelated hardcoded rectangles
with no shared alignment axes. Rebuilt: the primary elevation is 1:1, and every secondary view
is derived from the primary frame by an unfold about a shared axis, so alignment is structural
rather than eyeballed.

| View | Rotation (model → sheet) | Placement | Shared axis |
|---|---|---|---|
| 01 side elevation, 1:1 | `(-z, -x, y)` | reference | — |
| 02 plan | `(-z, -y, -x)` | **above** | vertical centreline of 01 |
| 03 end | `(-y, -x, -z)` | **right** | horizontal centreline of 01 |
| 04 section A–A | `(-z, y, x)` | **below** | vertical centreline of 01 |

Measured alignment deviation, both viewports:

| | Desktop | Mobile |
|---|---:|---:|
| Plan ↔ elevation shared vertical axis | **0.000000** | **0.000000** |
| Section ↔ elevation shared vertical axis | **0.000000** | **0.000000** |
| End ↔ elevation shared horizontal axis | **0.000000** | **0.000000** |
| Plan above / section below / end right | true | true |

View rectangles (sheet metres, origin at sheet centre):

```
front   [-0.251900, -0.087255, 0.293069, 0.248509]
top     [-0.251900,  0.183255, 0.293069, 0.089865]
right   [ 0.063169, -0.087255, 0.089865, 0.248509]
section [-0.251900, -0.199119, 0.293069, 0.089865]
```

**Section A–A, per Mark's note.** It is now a bottom half-section on a horizontal cutting plane
through model X = 0, viewed from the underside, which in third angle places it **below the
primary elevation** — the same region the JGun rises out of. The cutting-plane line **and its
arrows** are drawn on the parent elevation (there were none before), on the elevation's exact
horizontal centreline (`sectionLineY` deviation 0.000000), with the arrows pointing down toward
the observer of the section view. Half-section clipping keeps model X < 0, which removes the
grip and shows the planetary train.

Annotated capture: `proof/desktop-phase-0.20.png` (the projection centrelines and the faint
third-angle alignment rails are drawn on the sheet, so the relationship is visible on the print
itself, not only in this table).

### 6.4 ANSI C sheet format (7.5)

Owner ruling: ANSI C, 22 × 17 in, aspect 1.294 : 1.

| | Value |
|---|---|
| Sheet aspect | **1.2941176470588234** (target 22/17 = 1.2941176470588236) |
| World size | 0.905882 × 0.700000 m, landscape on **every** viewport |
| Desktop fit | 92% of viewport height |
| Desktop width occupancy on 16:9 | **66.97%** — dark margin left and right, intended, and the backdrop wash lives there (§7) |
| Cropping | none; the border and title block are never cropped |

The previous build hardcoded 0.96 × 0.54 (1.778:1) landscape and swapped to a separate
0.36 × 0.76 **portrait** arrangement on mobile. Both are gone; the layout is now identical on
every viewport (asserted in the contract check).

**Mobile 390 × 844 — provisional, pending Mark's ruling.** The sheet stays landscape and
right-way-up, and the intro becomes a scroll-driven camera push-in and pan across it. Measured
camera height above the sheet:

| Normalized t | 0.00 | 0.08 | 0.20 | 0.42 → 0.88 |
|---|---:|---:|---:|---:|
| Desktop (m) | 0.9911 | 0.9911 | 0.9911 | 0.9911 (fixed fit) |
| Mobile (m) | **2.7067** | **1.7053** | **1.0041** | **0.8757** |

Stations: whole sheet → title block → view block → settle on the primary elevation before the
pulse starts. The look-at point is clamped so the visible rectangle never leaves the paper.
This is also the clearest Item-5 scroll-jacking candidate and is called out as such in the
proposal. Frames: `proof/mobile-phase-*.png`.

### 6.5 The C-size template Mark draws on (7.6)

`node scripts/export-sheet-template.mjs` →
[`b1-b2-rebuild/jgun-ansi-c-sheet-template.svg`](b1-b2-rebuild/jgun-ansi-c-sheet-template.svg)
(905.882 × 700.000 mm, 4 view windows, 7 zones). It reads the layout constants out of
`drawingGeometry.ts` and the view windows out of `proof/layout.json`, so it cannot drift from
what the renderer lays out.

* **Units:** millimetres of the world sheet. 1 SVG user unit = 1 mm.
* **Origin:** SVG user space is top-left as usual; the sheet-space origin every code constant is
  written against is the **sheet centre**, at (452.941, 350.000) in the file, with sheet +Y up.
* **Scale note:** a physical ANSI C sheet is 558.8 × 431.8 mm; this world sheet carries the same
  layout at 1:1.621, because the primary elevation is drawn 1:1 in world millimetres and the
  JGun is 283 mm long. That is stated in the file header.
* **Contents:** the sheet outline at real scale, the four **final** view windows as empty
  reserved rectangles, and the reserved zones — hand-drawn (title block, revision block, notes)
  in amber, generated (views, callout lane, tables) in blue marked DO NOT DRAW.

**What Mark's returned SVG must satisfy:**

1. Everything he draws is inside a single element `<g id="sheet-furniture">`. The renderer
   swaps that one element; nothing else in the file is read.
2. It stays inside `zone-titleBlock`, `zone-revisionBlock` and `zone-notes`. Nothing hand-drawn
   enters `zone-views`, `zone-callouts` or `zone-tables`.
3. It introduces **no** dimension, part number, tolerance value, view label or scale statement.
   Every one of those is generated from `Default.glb` at render time — this is the rule that
   caught the fabricated `412.0` dimension in the first attempt, and a hand-drawn copy would go
   stale the moment the CAD changes.
4. Same viewBox and units; no transform on the root.

The annotation layer is already structured as that swap-in slot: `EngineeringDrawingOverlay`
renders a single `<g id="sheet-furniture">` containing only placeholder furniture, and every
generated element (views, dimensions, callouts, GD&T frames, datum flags, tables) is outside it.

Every CAD-derived value stays generated: overall length and height REF are measured from the
transformed vertex set each render, and the three part-length REF values live in a generated
"CAD REFERENCE DIMENSIONS" table (a table rather than three more dimension stacks, because a
four-view block on a C sheet leaves no honest room for five of them).

---

## 7. Declared change to JG-023 (Part 1, item 4)

**Declared, not silent.** The previous attempt multiplied `backdropAlpha` by
`smoothstep01((progress − 0.108) / 0.012)`, forcing it to **0** below progress 0.108 — inside
the range JG-023 X2 verified as "alpha 1.00000 at all 9 checkpoints, envelope err 0.000000".
That was an undeclared regression to a verified gate.

It is also not what Mark asked for: item 7.5 says the dark margin either side of the C sheet is
where the backdrop wash lives. Killing it entirely leaves those margins dead black.

Current behaviour: a single named multiplier, `INTRO_BACKDROP_LEVEL = 0.55`, holds the wash at
55% while the sheet owns the frame and reaches exactly 1.0 at the handoff. **The chapter-weight
envelope itself is untouched.**

Re-measured, both viewports:

| progress | 0.02 | 0.10 | 0.115 | **0.12** | 0.20 | 0.30 | 0.40 | 0.50 | 0.60 | 0.70 | 0.80 | 0.90 | 1.00 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| backdropAlpha | 0.550000 | 0.550000 | 0.830940 | **1.000000** | 1.000000 | 1.000000 | 1.000000 | 1.000000 | 1.000000 | 1.000000 | 1.000000 | 1.000000 | 1.000000 |

Every JG-023 checkpoint from 0.120 upward is **bit-identical to its verified value**. The 0.10
checkpoint is now inside the band JG-026 owns and reads 0.550000 by design. Addendum written to
[JG-023 evidence](JG-023-scrubbed-backgrounds-verification.md).

---

## 8. JG-022 re-proof (Part 1, item 5)

The previous attempt added `paddingTop: '100vh'` to the reduced-motion card stack, pushing all
chapter copy a full viewport below the fold — which is the exact defect JG-022 exists to
prevent. **Approach changed rather than re-proved:** the padding is removed. The card's own
translucent panel (`bg-slate-950/85`) already reads over the static drawing frame behind it, so
no offset was needed in the first place.

The reduced-motion chapter listener also had to be corrected: `CHAPTER_RANGES` are authored on
the paced progress axis, so raw scroll is now mapped through `pacedProgress()` exactly as
`ScrollRig` does in the full-motion tier.

Re-measured under emulated `prefers-reduced-motion: reduce`:

| raw scroll | 0.02 | 0.35 | 0.60 | 0.92 |
|---|---|---|---|---|
| rendered card labels | `["CH.01 ASSEMBLY"]` | `["CH.01 ASSEMBLY"]` | `["CH.03 THERMAL / ACOUSTIC"]` | `["CH.04 DIGITAL SYSTEMS"]` |
| first card top | 0.044 vh | 0.044 vh | 0.044 vh | 0.044 vh |

JG-022's verified behaviour holds: **exactly one card at a time, advancing in order, none
stranded below the fold** (0.044 vh, versus 1.044 vh under the previous attempt). The raw-scroll
positions at which chapters change differ from JG-022's 2026-08-31 record because the intro now
owns 30% of the document — that is the intended pacing change, and the progress values the
gates are actually written against are unchanged.

**Observation for Mark, not changed here:** in the reduced-motion tier the card sits in normal
document flow at the top of a 3120vh page, so it scrolls off after ~1vh. That is pre-existing
`main` behaviour, not something JG-026 introduced, and fixing it would change JG-022's verified
shape — flagged rather than done.

---

## 9. Registration

The model half of every comparison is rendered from the **live scene meshes** through the
**live camera** (`DrawingProofRenderer`), never from the saved drawing geometry.

**Projected-feature agreement** — 21 named CAD features (P000245, P003068, P000095, A000606,
K000004, A000591, HANDLE, plus their min/max Z extremes). Both sides are projected through the
same live camera: the expected point is the feature's position on the printed view, lifted into
the world by the sheet matrix; the actual point is the live model's own vertex.

| | Desktop | Mobile |
|---|---:|---:|
| Max error | **2.37e-5 px** | **2.25e-6 px** |
| Mean error | 1.03e-5 px | 9.82e-7 px |

*(The superseded run reported 0.000 px because it compared two orthographic cameras that had
identical extents by construction. They no longer do — the sheet fills 92% of the frame, not
100% — so that comparison would have been meaningless; the metric was rebuilt.)*

**Pixel agreement at rest**, threshold "each RGB channel ≥ 200, channel spread ≤ 25, no
dilation or alignment correction":

| | Desktop | Mobile |
|---|---:|---:|
| Silhouette IoU | **0.991866** | **0.994484** |
| Silhouette XOR | 0.81% | 0.55% |
| Silhouette bounds (drawing vs model) | `[609,324,1009,662]` vs `[608,324,1009,662]` | identical |
| Silhouette: drawing→model nearest-neighbour | **max 1 px, 100% within 1 px** | max 1 px, 100% within 1 px |
| Silhouette: model→drawing nearest-neighbour | max 1 px, 100% within 1 px | max 1 px, 100% within 1 px |
| Edge IoU | 0.445931 | 0.357237 |
| Edge XOR | 55.41% | 64.28% |
| Edge: drawing→model nearest-neighbour | **max 1 px, 100% within 1 px** | max 1 px, 100% within 1 px |
| Edge: model→drawing nearest-neighbour | median 1 px, p95 3 px, max 19 px, 83.1% within 1 px | median 1 px, p95 9 px, max 28 px, 75.6% within 1 px |

**The 55% edge XOR is not misregistration, and it is not claimed as a pass.** Raw IoU is the
right metric for a filled silhouette and the wrong one for a hairline: two 1 px lines one pixel
apart score zero overlap while being the same line. The directional numbers say what is
actually happening — **every** drawing edge pixel is within 1 px of a model edge pixel, so the
print's linework is exactly placed; the model render simply produces more edge pixels (7380 vs
3424) because it is drawn natively at screen resolution while the print is a 1760 × 1360 raster
resampled down onto the sheet, and the fine internal creases the model resolves are below the
sheet's own resolution. The previous evidence's "edge XOR 55.5% FAILED" was the same artifact.

Also verified (`supplemental.json`): release continuity to `baseAt(0.12)` — position delta
**5.55e-17 m**, target 0, FOV 0; exact mesh crossing sign change (negative at crossing − 1e-6,
|z| < 1e-9 at crossing, positive at crossing + 1e-6); contact/ripple-origin projection agreement
to < 1e-8 px; identity residual at release **5.5e-17**.

---

## 10. Performance

Measured on the restored system (damped camera, parallax, shake, rest orbit, gear idle, GSAP at
scrub 0.6). A warm-up sweep runs first and is **discarded** — the first pass through each
station compiles its programs and uploads its buffers, and measuring that reports compiler
latency rather than frame cost. The measured pass is a second, continuous scroll over the same
range.

| | Desktop | Mobile | Gate |
|---|---:|---:|---|
| Samples | ~675 | ~675 | — |
| Median | 16.70 ms | 16.70 ms | — |
| p95 | **17.10 – 17.20 ms** | **17.20 – 17.30 ms** | 16.7 ms |
| p99 | 17.60 ms | 17.50 – 17.60 ms | — |
| Max | **17.90 – 18.30 ms** | **33.4 – 50.1 ms** (one frame) | 50 ms |
| Frames > 20 ms | **0** | 0 – 1 | — |
| Frames > 33 ms | **0** | 0 – 1 | — |
| Frames > 50 ms | **0** | 0 – 1 | — |
| DPR declines | 0 | 0 | — |
| Tier | full | full | — |

Ranges are across three consecutive runs of the harness, reported rather than cherry-picked.
Desktop is stable: median at vsync, max within one quantum, **zero** frames over 20 ms in every
run. Mobile is stable except for a single outlier frame out of ~675 (0.15%) whose duration
varied 33.4 – 50.1 ms across runs — one deferred present, at the 50 ms gate boundary in the
worst run. It is a lone sample, not a sustained cost, and it is disclosed here rather than
averaged away.

**p95 17.10/17.20 ms against the literal 16.7 ms gate is disclosed, not treated as a pass.**
The display vsync quantum is 16.667 ms; a p95 one quantum above the median is a single deferred
present in the top 5% of frames, which is the same disclosure JG-023 made. The distribution is
the honest reading: median exactly at vsync, **zero** frames over 20 ms on desktop.

**On the 33.4 ms figure the previous evidence reported against a "17.3 ms prior baseline":** the
earlier max was measured across the scroll sweep *including* first-touch shader compilation and
buffer upload, so it was reporting warm-up, not steady-state frame cost. With the warm-up sweep
separated, desktop max is 17.9 – 18.3 ms — inside one vsync quantum of the median.

`WarmStationPrograms` (added in the first attempt, kept) compiles and 1-px-renders all five
station visibility combinations at startup, which is what makes that separation possible.

---

## 11. Tier fallbacks

| Tier | Behaviour | Evidence |
|---|---|---|
| **full** | focus rack, excitation with bloom, lift, plane displacement shockwave | `desktop-phase-*.png`, `desktop-wave-*.png` |
| **lite** | focus rack, excitation and lift retained; **plane displacement omitted** (`waveEnabled = 0` at every sampled point) | `desktop-lite-*.png`, `report.json → lite` |
| **poster** | canvas unmounted (0 canvas elements), original DOM engineering poster, text length > 100 | `desktop-poster.png`, `mobile-poster.png` |
| **reduced motion** | holds the fully focused registered phase-.20 frame; `phase = 0.2`, `focus = 1`, `pulse = 0`, `waveEnabled = 0`, `cameraUp = [-1, 0, 0]` (print readable), `backdropAlpha = 0.55`; two reads agree to ≤ 1e-6 | `desktop-reduced-motion.png`, `mobile-reduced-motion.png` |

**Correction (2026-09-05, post-commit):** an earlier draft of this section stated the direction
of the `StaticPoster` copy change backwards. The history is:

| Commit | Poster reads |
|---|---|
| `6af1530` … `main` | "Industrial Pneumatic Torque Wrench / DWG NO. RL-300 · REV C · SCALE 1:1" |
| `5dfd0aa` (first B1/B2 attempt) | "JGun Torque Multiplier / DWG NO. JG-D1-AP-001 · REV 01" |
| this branch | reverted to `main`'s RL-300 wording — `git diff main -- src/components/StaticPoster.tsx` is empty |

So the RL-300 wording is `main`'s, not a rewrite, and the tree currently matches `main`. Nothing
is pending here mechanically. What remains is a genuine copy question for Mark: the poster is the
only surface in the app carrying a drawing number at all (`#sheet-furniture` in
`EngineeringDrawingOverlay` is still an empty hand-drawn slot), and `ASSEMBLY_IDENTITY.machine` in
`src/data/caseStudies.ts` also reads "Industrial Pneumatic Torque Wrench". If he wants the poster
to carry JGun branding, both surfaces should move together.

---

## 12. Repository hygiene (Part 1, items 8–9)

* Removed the empty file `204` at the repository root.
* Removed `.agents/` (duplicated `cad-scene-graph-rigging` and `webgl-telemetry-verifier`, which
  are already registered in `agent-skills.md`), and reverted `agent-skills.md` and the three
  documents that had been re-pointed at those duplicates.
* Restored `package.json` / `package-lock.json` (vitest + `npm run test`).
* Deleted `scripts/verify-b1b2-handoff.py` stays deleted — superseded by
  `verify-b1b2-rebuild.mjs`; `src/scene/PondRipplePass.tsx` stays deleted — the ripple is now the
  plane-local shockwave.
* **Per-frame allocation (repo rule: zero per-frame allocation).** `DrawingLinework` was
  rebuilding `telemetry.drawing` as a new object with three `.toArray()` calls every frame, and
  `CameraRig` was assigning a fresh `telemetry.camera.goal = { … }` object every frame. Both now
  mutate preallocated targets: `TelemetryDrawing` is a fully typed, preallocated record
  (`contact` as `number[3]`, `planeMatrix`/`modelMatrix` as `number[16]`, written with
  `Matrix4.toArray(target)`), and `telemetry.camera.goal` / `telemetry.camera.up` are
  preallocated arrays written element-wise. The `[key: string]: unknown` escape hatch that had
  been added to `TelemetryDrawing` is gone.
* **Code style normalised** in every new drawing file (`drawingGeometry.ts`,
  `extractionPose.ts`, `introTimeline.ts`, `sheetCamera.ts`, `DrawingLinework.tsx`,
  `DrawingProofRenderer.tsx`, `EngineeringDrawingOverlay.tsx`, `scrollCommit.ts`) — ordinary
  spacing, one statement per line, explanatory comments in this repository's register instead of
  the dense comma-chained no-whitespace style.

---

## 13. What is still open

1. **Mark's `?chapter=0` visual ruling.** Not self-certified. Preview is running at
   `http://localhost:4173/?chapter=0`.
2. **Mobile arrangement (7.5)** is provisional pending his ruling.
3. **Item 6 opening/onboarding** is a design proposal with its scroll window reserved
   (normalized 0.14 → 0.30 of the intro, 145.0vh of absolute scroll, currently carrying nothing
   but the held focused print) — see
   [`work/inbox/JG-026-opening-onboarding-proposal.md`](../inbox/JG-026-opening-onboarding-proposal.md).
   Adding it later cannot re-window anything.
4. **Downstream scroll-jacking candidates** (Item 5) are proposals only.
5. **`StaticPoster` copy** — flagged in §11, his call.
6. ~~Nothing is committed on this branch.~~ **Closed 2026-09-05** — committed as `44cbbed`
   (76 files). PNG captures under `b1-b2-rebuild/` are gitignored; the machine-readable
   JSON/SVG evidence this document cites is committed.
