# 02 — Global scroll-progress consumer census

## Provenance

- **Date:** 2026-09-10
- **Git rev:** `3e3e49f` (`git rev-parse --short HEAD`)
- **Working tree:** `scripts/capture-rl300-baseline.mjs` is untracked but present and included in this census.
- **Grep commands run (all from repo root):**

```sh
# 1. Broad sweep — every progress/scroll-geometry reference in source and probes
grep -rn --include=*.ts --include=*.tsx --include=*.mjs --include=*.js \
  -E "progress|scrollY|scrollHeight|innerHeight|getScrollState|STAGE_TRANSITIONS|LCD_REVEAL|PATH_SEGMENTS|INTRO_|DRAWING_INTRO|pacedProgress|rawScrollFor|dwell|data-chapter|vh\b" \
  src scripts

# 2. Exact-string re-grep of EVERY distinct threshold value found in pass 1
for v in 0.525 0.565 0.72 0.76 0.755 0.420 0.42 0.458 0.488 0.473 0.12 0.22 0.24 \
         0.46 0.50 0.60 0.18 0.44 0.51 0.04 0.35 0.47 0.49 0.545 0.61 0.610 0.70 \
         0.700 0.585 0.645 0.715 0.65 0.02; do
  grep -rn --include=*.ts --include=*.tsx --include=*.mjs -F "$v" src scripts
done

# 3. Import-site closure — every file that can see the progress axis at all
grep -rln --include=*.ts --include=*.tsx \
  "getScrollState\|useScrollValue\|STAGE_TRANSITIONS\|LCD_REVEAL_WINDOW\|DRAWING_INTRO_WINDOW\|pacedProgress\|PATH_SEGMENTS\|INTRO_SCROLL_SHARE" src

# 4. Unit tests
grep -rn -E "0\.[0-9]+|progress|WINDOW|Gate|gate" --include=*.test.ts src/

# 5. Headless probes
grep -rn -E "progress|dwell|scrollTo|scrollY|__drawing|PROGRESS|pacedProgress|rawScrollFor|station=|chapter=|\?view=" scripts/*.mjs scripts/*.tsx
grep -nF "}, 0." scripts/verify-jg028-handle-realism.mjs scripts/verify-jg031-gear-rotation.mjs scripts/verify-jg032-station2-thermal.mjs
grep -nF "await capture(" scripts/capture-b1b2-baseline.mjs
grep -nF "sample(page" scripts/verify-b1b2-supplemental.mjs
```

## How to read this

**normalized-global** means the value is a fraction of the whole-document progress axis — either the raw axis (`scrollY / (scrollHeight − innerHeight)`) or the *paced* axis that `pacedProgress()` derives from it — so the physical scroll offset it lands on is a function of total page height. **physical/local** means the value is anchored to a DOM element's viewport transit, a GSAP timeline's own 0..1 fraction, a DOM chapter index, a local stage/pose parameter, or a vh-denominated track height, and therefore does not move (or moves on a different rule) when page height changes. **derived** means the value is computed from another constant in this table — the source is named in Notes, and it inherits that source's keying.

> Axis note used throughout: `ScrollRig.tsx:44` publishes **paced** progress, not raw. `pacedProgress()` (`introTimeline.ts:54`) is a two-piece linear map — raw `[0, 0.3]` → paced `[0, 0.12]`, raw `[0.3, 1]` → paced `[0.12, 1]` — so a paced constant's physical position is `rawScrollFor(p) × (scrollHeight − innerHeight)`. Both factors move when the document grows.

---

## Census

**159 rows** across 25 source files — 71 normalized-global, 62 derived, 19 physical/local, 7 documentation/non-keyed. (Plus 27 highest-risk cross-references and 68 probe/test rows in the sections below; 254 table rows total, 405 line citations, all range-verified against the working tree at `3e3e49f`.)

### src/scene/drawing/introTimeline.ts — the pacing map

| File:line | Symbol / constant | Current value | Keying | Moves if page height grows? | Notes |
|---|---|---|---|---|---|
| `introTimeline.ts:26` | `INTRO_SCROLL_SHARE` | `0.3` | normalized-global (RAW axis) | **YES** — intro absolute length = `0.3 × scrollDistance` | Only constant in the repo authored on the raw axis. Any added page height stretches the B1/B2 intro proportionally. |
| `introTimeline.ts:32` | `DRAWING_INTRO_WINDOW.releaseEnd` | `0.12` | normalized-global (paced) | **YES** | Pinned to raw `0.3` by construction; its physical offset is `0.3 × scrollDistance`. |
| `introTimeline.ts:32` | `DRAWING_INTRO_WINDOW.heroEnd` | `0.525` | normalized-global (paced) | **YES** | Asserted in `check-b1b2-contract.mjs:178`. |
| `introTimeline.ts:39` | `HANDOFF_BLEND` | `0.025` | normalized-global (RAW) | **YES** — absolute blend width scales with the document | C1 blend half-width where intro slope meets main slope. |
| `introTimeline.ts:47` | `INTRO_SLOPE` | derived `releaseEnd / INTRO_SCROLL_SHARE` | derived | via sources | = 0.4 at current values. |
| `introTimeline.ts:48` | `MAIN_SLOPE` | derived `(1 − releaseEnd) / (1 − INTRO_SCROLL_SHARE)` | derived | via sources | ≈ 1.2571 at current values. |
| `introTimeline.ts:54-60` | `pacedProgress(rawScroll)` | function | normalized-global | **YES** | The single raw↔narrative bridge in the codebase. |
| `introTimeline.ts:68-78` | `rawScrollFor(progress)` | 40-iteration bisection | derived | via `pacedProgress` | Used by deep links, `scrollCommit`, and the proof API. |
| `introTimeline.ts:89` | `INTRO_PHASES.focusEnd` | `0.14` | derived (intro-local `t = p / 0.12`) | **YES** via parent band | |
| `introTimeline.ts:91-92` | `INTRO_PHASES.onboardStart` / `onboardEnd` | `0.14` / `0.3` | derived (intro-local) | **YES** via parent band | Reserved window; nothing authored inside. |
| `introTimeline.ts:94-95` | `INTRO_PHASES.pulseStart` / `pulseEnd` | `0.3` / `0.56` | derived (intro-local) | **YES** via parent band | |
| `introTimeline.ts:97` | `INTRO_PHASES.orbitStart` | `0.46` | derived (intro-local) | **YES** via parent band | |
| `introTimeline.ts:99` | `INTRO_PHASES.riseStart` | `0.56` | derived (intro-local) | **YES** via parent band | |
| `introTimeline.ts:101` | `INTRO_PHASES.detachStart` | `0.86` | derived (intro-local) | **YES** via parent band | Consumed by `scrollCommit.ts:42`. |
| `introTimeline.ts:103` | `INTRO_PHASES.waveEnd` | `0.96` | derived (intro-local) | **YES** via parent band | |
| `introTimeline.ts:118` | `RISE_EASE_EXPONENT` | `0.55` | physical/local (pose axis) | NO | Reparameterizes pose time, not scroll. |
| `introTimeline.ts:122,124,130-132` | pose split `0.4` / `0.6` | `0.4` / `0.6` | physical/local (pose axis) | NO | Matches the `extractionPose.ts` solver axis; deliberately untouched by pacing. |
| `introTimeline.ts:165` | `t = clamp01(progress / releaseEnd)` | derived | derived | **YES** via `releaseEnd` | |
| `introTimeline.ts:178` | `pbr` ramp span | `0.1` (intro-local t) | derived (intro-local) | **YES** via parent band | |
| `introTimeline.ts:180` | `contrast` ramp span | `0.34` (intro-local t) | derived (intro-local) | **YES** via parent band | |
| `introTimeline.ts:181` | `drawingOpacity` ramp | `(t − waveEnd) / (1 − waveEnd)` | derived (intro-local) | **YES** via parent band | |
| `introTimeline.ts:192` | `remapHeroProgress()` output band | `[0.12, 0.18]` (`releaseEnd + clamp01(prev/0.18) × 0.06`) | normalized-global (paced) | **YES** | Compresses the retained CH.01 opening cues. |

### src/scene/ScrollRig.tsx — the producer

| File:line | Symbol / constant | Current value | Keying | Moves if page height grows? | Notes |
|---|---|---|---|---|---|
| `ScrollRig.tsx:39-41` | global `ScrollTrigger.create({ start: 0, end: 'max' })` | whole document | normalized-global (RAW) | **YES** | `self.progress` = `scrollY / (scrollHeight − innerHeight)`. |
| `ScrollRig.tsx:43-44` | `const paced = pacedProgress(raw)` | — | normalized-global (paced) | **YES** | The only write of `ScrollState.progress`. |
| `ScrollRig.tsx:45-47` | velocity slope, ±`1e-4` raw finite difference | `1e-4` | derived | via `pacedProgress` | Velocity is reported on the paced axis (chain rule). |
| `ScrollRig.tsx:52-65` | per-chapter `ScrollTrigger` `start: 'top 60%'`, `end: 'bottom 40%'` | element transit | **physical/local** (DOM `[data-chapter]`) | NO | Writes `chapter` + `chapterProgress`. Diverges from `progress` under any height change. |
| `ScrollRig.tsx:71-74` | deep-link seek `max × rawScrollFor(initialProgress)` | derived | derived | **YES** | Correctly inverts the pacing map. |

### src/state/scrollStore.ts

| File:line | Symbol / constant | Current value | Keying | Moves if page height grows? | Notes |
|---|---|---|---|---|---|
| `scrollStore.ts:12-13` | `ScrollState.progress` | runtime | normalized-global (paced) | **YES** | The value every consumer below reads. |
| `scrollStore.ts:16-17` | `ScrollState.chapterProgress` | runtime | physical/local | NO | From the DOM chapter triggers. |
| `scrollStore.ts:35` | `SPATIAL_STATIONS[0].scrollProgress` (jgun) | `0.0` | normalized-global | **YES** (degenerate at 0) | |
| `scrollStore.ts:36` | `SPATIAL_STATIONS[1].scrollProgress` (enclosure) | `0.60` | normalized-global | **YES** | HUD station jump target for RL300. |
| `scrollStore.ts:37` | `SPATIAL_STATIONS[2].scrollProgress` (m249) | `0.85` | normalized-global | **YES** | |
| `scrollStore.ts:47-50` | `navigateToStation()` → `maxScroll × target.scrollProgress` | runtime | normalized-global (**RAW**) | **YES** | Applies a paced-axis constant directly to raw scroll — no `rawScrollFor()`. Pre-existing mismatch. |
| `scrollStore.ts:69-71` | `?station=` deep links | `0.0` / `0.60` / `0.85` | normalized-global (paced) | **YES** | |
| `scrollStore.ts:73-76` | `?chapter=` deep links | `0.0` / `0.35` / `0.60` / `0.85` | normalized-global (paced) | **YES** | `?chapter=0` is the probe entry point for every headless script. |
| `scrollStore.ts:81` | `?dwell=lcd` | `(dwellStart + dwellEnd) / 2` = `0.473` | derived from `LCD_REVEAL_WINDOW` | **YES** | Only dwell key. |
| `scrollStore.ts:107-114` | `DOMContentLoaded` seek `max × initProg` | runtime | normalized-global (**RAW**) | **YES** | Same paced-value-on-raw-axis mismatch as line 50. |
| `scrollStore.ts:126-130` | `__drawingProofProgress` pin override | runtime | n/a | n/a | Probe-only; forces `progress` and zeroes velocity. |

### src/scene/scrollCommit.ts

| File:line | Symbol / constant | Current value | Keying | Moves if page height grows? | Notes |
|---|---|---|---|---|---|
| `scrollCommit.ts:37` | `REST_VELOCITY` | `0.02` (abs raw scroll per second) | normalized-global (RAW rate) | **YES** — same physical speed maps to a smaller raw delta on a taller page | Governs when the committed-pace assist engages. |
| `scrollCommit.ts:42` | `start = rawScrollFor(releaseEnd × INTRO_PHASES.detachStart)` | derived | derived | **YES** | |
| `scrollCommit.ts:43` | `end = rawScrollFor(releaseEnd)` | derived | derived | **YES** | |
| `scrollCommit.ts:52` | `maxScroll()` = `scrollHeight − innerHeight` | runtime | — | — | Raw-page statistic, recomputed per tick. |
| `scrollCommit.ts:75,81,87` | `raw = scrollY / maxScroll()`, window test, `scrollTo(target × maxScroll())` | derived | normalized-global (RAW) | **YES** | |

### src/data/caseStudies.ts

| File:line | Symbol / constant | Current value | Keying | Moves if page height grows? | Notes |
|---|---|---|---|---|---|
| `caseStudies.ts:293` | `PATH_SEGMENTS[0]` | `0.000 → 0.525` | normalized-global | **YES** | All JGun camera beats. |
| `caseStudies.ts:294` | `PATH_SEGMENTS[1]` | `0.525 → 0.600` | normalized-global | **YES** | Whip-pan to Station 2. |
| `caseStudies.ts:295` | `PATH_SEGMENTS[2]` | `0.600 → 0.720` | normalized-global | **YES** | RL300 hold / orbit arc. |
| `caseStudies.ts:296` | `PATH_SEGMENTS[3]` | `0.720 → 0.760` | normalized-global | **YES** | Flight to Station 3. |
| `caseStudies.ts:332,334` | `baseAt` segment 0 test + `u = p / 0.525` | `0.525` | normalized-global | **YES** | Hardcoded, not read from `PATH_SEGMENTS`. |
| `caseStudies.ts:353,359` | `baseAt` segment 1 test + `u = (p − 0.525) / (0.600 − 0.525)` | `0.525`, `0.600` | normalized-global | **YES** | Hardcoded duplicates of row above. |
| `caseStudies.ts:379,381` | `baseAt` segment 2 test + `u = (p − 0.600) / (0.720 − 0.600)` | `0.600`, `0.720` | normalized-global | **YES** | Hardcoded duplicates. |
| `caseStudies.ts:395,399` | `baseAt` segment 3 test + `u = (p − 0.720) / (0.760 − 0.720)` | `0.720`, `0.760` | normalized-global | **YES** | Hardcoded duplicates. |
| `caseStudies.ts:311-320` | `S2_ARC_END_POSE` "derived for exact C0 handoff into Segment 3" | computed at module load | derived | **YES** via segment table | Pose is geometric; its *scroll anchor* (p = 0.720) is normalized-global. |
| `caseStudies.ts:418-420` | `baseAt` segment 4 fallback | `[0.760, 1.000]` | normalized-global | **YES** | |
| `caseStudies.ts:445` | `framingBiasVec` `ramp` | `0.035` | normalized-global (width) | **YES** | |
| `caseStudies.ts:446` | `w0` CH.01 bias window | `progress < 0.22` | normalized-global | **YES** | |
| `caseStudies.ts:447` | `w1` CH.02 bias window | `0.24 → 0.46` | normalized-global | **YES** | |
| `caseStudies.ts:448` | `w2` CH.03 bias window | `0.50 → 0.72` | normalized-global | **YES** | |
| `caseStudies.ts:451` | `w3` CH.04 bias window | `progress > 0.76`, ramp `0.02` | normalized-global | **YES** | |
| `caseStudies.ts:501` | `LCD_REVEAL_WINDOW.start` | `0.420` | normalized-global | **YES** | **Protected JGUN.** |
| `caseStudies.ts:503` | `LCD_REVEAL_WINDOW.dwellStart` | `0.458` | normalized-global | **YES** | **Protected JGUN.** |
| `caseStudies.ts:504` | `LCD_REVEAL_WINDOW.dwellEnd` | `0.488` | normalized-global | **YES** | **Protected JGUN.** |
| `caseStudies.ts:506` | `LCD_REVEAL_WINDOW.end` | `0.525` | normalized-global | **YES** | **Protected JGUN.** |
| `caseStudies.ts:617` | `HOTSPOTS['lcd'].window` | `[0.44, 0.51]` | normalized-global | **YES** | **Protected JGUN.** Hand-tuned; not derived from `LCD_REVEAL_WINDOW`. |
| `caseStudies.ts:486-497` | `LCD_REVEAL_WINDOW` derivation comment | cites "2020vh document", hero transit "≈0.177 → 0.458", explode done "≈0.416" | documentation | **STALE** | Document is now 3120vh (`Chapters.tsx:18`). |

### src/scene/stages/stageWindows.ts

| File:line | Symbol / constant | Current value | Keying | Moves if page height grows? | Notes |
|---|---|---|---|---|---|
| `stageWindows.ts:21` | `STAGE_TRANSITIONS.wrenchOut` | `[0.525, 0.565]` | normalized-global | **YES** | **Protected JGUN** — the wrench sink-out. |
| `stageWindows.ts:23` | `STAGE_TRANSITIONS.enclosureIn` | `[0.525, 0.565]` | normalized-global | **YES** | RL300 entry. |
| `stageWindows.ts:25` | `STAGE_TRANSITIONS.enclosureOut` | `[0.72, 0.76]` | normalized-global | **YES** | RL300 exit. |
| `stageWindows.ts:27` | `STAGE_TRANSITIONS.pointCloudIn` | `[0.72, 0.76]` | normalized-global | **YES** | |
| `stageWindows.ts:65-66` | `segment(progress, [start, end])` | normalization helper | derived | **YES** via callers | |
| `stageWindows.ts:73-85` | `stageEnvelope(progress, fadeIn, fadeOut)` | envelope | derived | **YES** via `STAGE_TRANSITIONS` | Five call sites (SpatialRig, SpatialWorld, AirflowField, AcousticBaffleField). |
| `stageWindows.ts:91-94` | `airflowIntensity(progress)` | `(p − 0.565) / (0.72 − 0.565)` | derived | **YES** | Hold-window ramp for CH.03. |
| `stageWindows.ts:6-15` | 2020vh derivation comment | "3 × 440vh + 660vh CH.04 + 40vh footer = 2020vh"; hero transit ≈0.177→0.458 | documentation | **STALE** | Contradicted by `Chapters.tsx:20` (`intro 906 / 237 / 576 / 541 / 811 / footer 49` = 3120vh). |

### src/scene/jgunVisualGates.ts

| File:line | Symbol / constant | Current value | Keying | Moves if page height grows? | Notes |
|---|---|---|---|---|---|
| `jgunVisualGates.ts:23` | `explodeHoldGate()` ramp-in | `(progress − 0.47) / 0.02` | normalized-global | **YES** | **Protected JGUN.** |
| `jgunVisualGates.ts:23` | `explodeHoldGate()` fade-out | `(progress − 0.525) / 0.04` | normalized-global | **YES** | **Protected JGUN.** Clamped to `wrenchOut`. |
| `jgunVisualGates.ts:45-46` | `lcdMicroRimIntensity()` eases | `0.02` in / `0.02` out, window passed in | derived from `LCD_REVEAL_WINDOW` | **YES** | **Protected JGUN.** |
| `jgunVisualGates.ts:6-13` | CH.04-inert doc block | "zero contribution at CH.04 progress values (≥ 0.72)" | documentation | **YES** | The inertness claim is a statement about the progress axis, not physical scroll. |

### src/scene/CameraRig.tsx

| File:line | Symbol / constant | Current value | Keying | Moves if page height grows? | Notes |
|---|---|---|---|---|---|
| `CameraRig.tsx:201-203` | reduced-motion pin | `releaseEnd × 0.2` | derived | **YES** | |
| `CameraRig.tsx:206` | `baseAt(progress)` | — | derived | **YES** via `PATH_SEGMENTS` | |
| `CameraRig.tsx:212` | CR-3 shift bell weight | `remapHeroProgress(0.035 / 0.055 / 0.115)`, hard `0.18` | normalized-global | **YES** | **Protected JGUN** — CH.01 groove reveal. |
| `CameraRig.tsx:214` | shift orbit `orbitT` | `(p − remap(0.05)) / (remap(0.10) − remap(0.05))` | normalized-global | **YES** | **Protected JGUN.** |
| `CameraRig.tsx:235` | explode-centroid tracking gate | `progress <= 0.525` | normalized-global | **YES** | **Protected JGUN.** Hardcoded, not `heroEnd`. |
| `CameraRig.tsx:237` | explodeFactor suppression | `progress <= releaseEnd` | derived | **YES** | |
| `CameraRig.tsx:239-240` | `spinProgress` → hero yaw | `(progress − 0.18) / 0.17`, yaw `= spinProgress × π × 0.85` | normalized-global | **YES** | **Protected JGUN** — the hero yaw the LCD dwell pose depends on. |
| `CameraRig.tsx:253-286` | rear-LCD orbit blend | `start / dwellStart / dwellEnd / end` from `LCD_REVEAL_WINDOW` | derived | **YES** | **Protected JGUN.** |
| `CameraRig.tsx:258` | `midArc` | `start + (dwellStart − start) / 2` | derived | **YES** | |
| `CameraRig.tsx:294-295` | CH.04 zoom-out | `progress >= 0.76`, `t4 = (p − 0.76) / 0.18` | normalized-global | **YES** | |
| `CameraRig.tsx:309-310` | `inLcdWindow` inspect suppression | `LCD_REVEAL_WINDOW.start` … `.end` | derived | **YES** | |
| `CameraRig.tsx:352` | portrait dolly ramp | `(progress − 0.5) / 0.06` | normalized-global | **YES** | |
| `CameraRig.tsx:353` | portrait CH.04 deepening | `(progress − 0.76) / 0.24` | normalized-global | **YES** | |
| `CameraRig.tsx:371` | `framingBiasVec(progress)` | — | derived | **YES** | |
| `CameraRig.tsx:375-377` | flight attenuation | `att()` half-width `0.015`; windows `(0.53, 0.598)` and `(0.722, 0.758)` | normalized-global | **YES** | |
| `CameraRig.tsx:381` | `afterIntro` | `smooth01((p − releaseEnd) / 0.03)` | derived + `0.03` width | **YES** | |
| `CameraRig.tsx:424` | `introActive` | `progress <= releaseEnd && layout !== null` | derived | **YES** | |
| `CameraRig.tsx:466-468` | rest-orbit garnish gate | `abs(velocity) < 0.001` && `p > releaseEnd` && `p < 0.545` | normalized-global | **YES** | **Protected JGUN.** `0.001` is a paced-axis velocity threshold. |

### src/scene/TorqueWrenchHero.tsx

| File:line | Symbol / constant | Current value | Keying | Moves if page height grows? | Notes |
|---|---|---|---|---|---|
| `TorqueWrenchHero.tsx:112-120` | hero GSAP `scrollTrigger` | `trigger: '[data-chapter="1"]'`, `start: 'top bottom'`, `end: 'bottom top'`, `scrub: 0.6` | **physical/local** (DOM element viewport transit) | **NO** | **Protected JGUN.** This is the divergence source: the tween runs at a fixed *physical* scroll band while every gate above runs on the normalized axis. |
| `TorqueWrenchHero.tsx:123` | `spin` tween | timeline pos `0.12`, dur `0.35` | physical/local (timeline fraction) | NO | |
| `TorqueWrenchHero.tsx:125` | `gearRotation` tween | timeline pos `0.12`, dur `0.9`, target `GEAR_ROTATION_SWEEP` (8π) | physical/local (timeline fraction) | NO | **Protected JGUN** — gear rotation. |
| `TorqueWrenchHero.tsx:127` | `ghost` in | timeline pos `0.27`, dur `0.20` | physical/local | NO | |
| `TorqueWrenchHero.tsx:129` | `explode` tween | timeline pos `0.47`, dur `0.50` | physical/local | NO | **Protected JGUN** — the explode ladder. Completion lands at timeline 0.97. |
| `TorqueWrenchHero.tsx:132` | `ghost` out | timeline pos `0.54`, dur `0.25` | physical/local | NO | |
| `TorqueWrenchHero.tsx:265-266` | reduced-motion pin | `releaseEnd × 0.2` | derived | **YES** | |
| `TorqueWrenchHero.tsx:274` | drawing-owns-frame hold | `progress <= releaseEnd` | derived | **YES** | Zeroes every mechanism channel below the handoff. |
| `TorqueWrenchHero.tsx:357` | gear-idle activation | `chapter === 1 && progress >= 0.22 && progress <= 0.55` | normalized-global (+ DOM chapter) | **YES** | **Protected JGUN** — continuous kinematic idling. Mixed keying in one predicate. |
| `TorqueWrenchHero.tsx:370-373` | clutch shift window | `remapHeroProgress(0.05 / 0.10 / 0.12 / 0.17)` → `[0.1367, 0.1533, 0.16, 0.1767]` | normalized-global | **YES** | **Protected JGUN.** |
| `TorqueWrenchHero.tsx:399-400` | `wantCad` / `wantLiteFade` | `chapter === 3 && progress >= 0.755` | normalized-global (+ DOM chapter) | **YES** | AND-gate added specifically because `chapter` lags `progress`. |
| `TorqueWrenchHero.tsx:409,422` | blueprint opacity / `uProgress` | `chapterProgress` | physical/local | NO | |

### src/scene/SceneCanvas.tsx

| File:line | Symbol / constant | Current value | Keying | Moves if page height grows? | Notes |
|---|---|---|---|---|---|
| `SceneCanvas.tsx:80-81` | `LcdFillLight` fade | `(p − LCD start) / 0.02`, `(LCD end − p) / 0.02` | derived | **YES** | **Protected JGUN.** |
| `SceneCanvas.tsx:140` | StudioRig `down` | from `STAGE_TRANSITIONS.wrenchOut` | derived | **YES** | |
| `SceneCanvas.tsx:141` | StudioRig `up` | from `STAGE_TRANSITIONS.enclosureOut` | derived | **YES** | |
| `SceneCanvas.tsx:142` | studio `activation` | `drawingIntroState(progress).pbr` | derived | **YES** | |
| `SceneCanvas.tsx:151` | spot nudge | `studioSpotNudge(progress)` | derived | **YES** | **Protected JGUN.** |
| `SceneCanvas.tsx:229-231` | LCD micro-rim | `lcdMicroRimIntensity(progress, [LCD start, LCD end])` | derived | **YES** | **Protected JGUN.** |
| `SceneCanvas.tsx:277-278` | explode shadow plane | `explodeShadowOpacity(progress, telemetry.rig.explodeFactor)` | derived | **YES** | **Protected JGUN.** Note the mixed inputs: the gate is normalized-global, `explodeFactor` is DOM-element-keyed. |

### src/scene/SpatialRig.tsx · SpatialWorld.tsx · PostProcessingComposer.tsx

| File:line | Symbol / constant | Current value | Keying | Moves if page height grows? | Notes |
|---|---|---|---|---|---|
| `SpatialRig.tsx:39-41` | three `stageEnvelope()` calls | from `STAGE_TRANSITIONS` | derived | **YES** | |
| `SpatialRig.tsx:45` | dominant-stage test | `alpha > 0.25` | physical/local (alpha, not progress) | NO | |
| `SpatialRig.tsx:64` | transition-intensity denominator | `maxDelta / 0.085` | derived, **scroll-rate sensitive** | **YES (indirectly)** | Tuned against "dα/dp = 37.5 mid-window across the 0.04-unit transition" at 60 fps. A taller page means less Δprogress per frame for the same physical scroll, so the peak intensity falls. |
| `SpatialRig.tsx:65` | decay τ | `0.35` s | physical/local (wall clock) | NO | |
| `SpatialWorld.tsx:55-63` | three `stageEnvelope()` calls | from `STAGE_TRANSITIONS` | derived | **YES** | Drives `group.visible` per station. |
| `SpatialWorld.tsx:77` | dominant-stage test | `alpha > 0.25` | physical/local (alpha) | NO | |
| `PostProcessingComposer.tsx:94` | `introOwnsFrame` | `progress <= releaseEnd` | derived | **YES** | |
| `PostProcessingComposer.tsx:107-109` | bloom `down` | from `STAGE_TRANSITIONS.wrenchOut` | derived | **YES** | |
| `PostProcessingComposer.tsx:111-113` | bloom `up` | from `STAGE_TRANSITIONS.enclosureOut` | derived | **YES** | |

### src/scene/backgrounds/

| File:line | Symbol / constant | Current value | Keying | Moves if page height grows? | Notes |
|---|---|---|---|---|---|
| `backdropConfig.ts:36` | `CHAPTER_BLEND_12` | `[0.22, 0.24]` | normalized-global | **YES** | Hand-synced to `Chapters.tsx` `CHAPTER_RANGES`, not imported. |
| `backdropConfig.ts:37` | `CHAPTER_BLEND_23` | `= STAGE_TRANSITIONS.wrenchOut` | derived | **YES** | |
| `backdropConfig.ts:38` | `CHAPTER_BLEND_34` | `= STAGE_TRANSITIONS.enclosureOut` | derived | **YES** | |
| `BackdropRig.tsx:90-98` | `t12` / `t23` / `t34` | from `CHAPTER_BLEND_*` | derived | **YES** | |
| `BackdropRig.tsx:121-125` | `introFactor` | `releaseEnd − 0.012` over width `0.012` | derived + `0.012` width | **YES** | Tuned so every JG-023 checkpoint from 0.120 up is bit-identical. |

### src/scene/Hotspots.tsx

| File:line | Symbol / constant | Current value | Keying | Moves if page height grows? | Notes |
|---|---|---|---|---|---|
| `Hotspots.tsx:490` | `progress = useScrollValue('progress')` | runtime | normalized-global | **YES** | Only DOM-side React subscriber to `progress` outside Chapters/HUD. |
| `Hotspots.tsx:544` | global hotspot suppression | `progress > 0.12` | normalized-global | **YES** | **Hardcoded duplicate of `DRAWING_INTRO_WINDOW.releaseEnd`** — not imported. |
| `Hotspots.tsx:545` | per-hotspot window test | `def.window[0] … def.window[1]` | derived from `HOTSPOTS` | **YES** | Only `lcd` sets a window today. |

### src/scene/stages/

| File:line | Symbol / constant | Current value | Keying | Moves if page height grows? | Notes |
|---|---|---|---|---|---|
| `AirflowField.tsx:330` | `INTERNALS_WINDOW` | `[0.61, 0.7]` | normalized-global | **YES** | Pump-pulse visibility during the RL300 cross-section hold. |
| `AirflowField.tsx:446-450` | `stageEnvelope(enclosureIn, enclosureOut)` | derived | derived | **YES** | Whole-field freeze gate. |
| `AirflowField.tsx:455-459` | pump-pulse window test | `INTERNALS_WINDOW` | derived | **YES** | |
| `AirflowField.tsx:477` | `targetFlow = airflowIntensity(progress)` | derived | derived | **YES** | |
| `AcousticBaffleField.tsx:114-118` | `stageEnvelope(enclosureIn, enclosureOut)` | derived | derived | **YES** | |
| `AcousticBaffleField.tsx:134` | `targetIntensity = airflowIntensity(progress)` | derived | derived | **YES** | |
| `Station2_AcousticEnclosure.tsx:118` | internal-hotspot visibility | `0.610 … 0.700` | normalized-global | **YES** | Hardcoded; not `INTERNALS_WINDOW`. |
| `Station2_AcousticEnclosure.tsx:119` | external-hotspot visibility | `0.565 … 0.720` | normalized-global | **YES** | Hardcoded duplicates of `enclosureIn[1]` / `enclosureOut[0]`. |
| `Station2_AcousticEnclosure.tsx:360-362` | cross-section cut opens | `0.585 → 0.645` | normalized-global | **YES** | JG-032 rev2 choreography. |
| `Station2_AcousticEnclosure.tsx:363-364` | cut hold open | `0.645 … 0.700` | normalized-global | **YES** | |
| `Station2_AcousticEnclosure.tsx:365-367` | cut closes | `0.700 → 0.715` | normalized-global | **YES** | |
| `M249Stage.tsx:101-103,111` | CAD dissolve | `chapter === 3`, `uProgress = chapterProgress` | physical/local (DOM chapter) | NO | |

### src/components/

| File:line | Symbol / constant | Current value | Keying | Moves if page height grows? | Notes |
|---|---|---|---|---|---|
| `Chapters.tsx:20` | `SCROLL_TRACK_VH` | `{ intro: 906, chapters: [237, 576, 541, 811], footer: 49 }` = **3120vh** | **physical (vh)** — the page-height source | this IS the thing that changes | RL300 = `chapters[2]` = **541vh**. |
| `Chapters.tsx:26-31` | `CHAPTER_RANGES` | `0:[0.00,0.22]` `1:[0.24,0.46]` `2:[0.50,0.72]` `3:[0.76,1.00]` | normalized-global | **YES** | Card visibility windows. |
| `Chapters.tsx:43` | `isShiftBeatOn` | `0.04 … 0.18` | normalized-global | **YES** | **Protected JGUN** caption. |
| `Chapters.tsx:44` | `isExplodeBeatOn` | `0.18 … 0.42` | normalized-global | **YES** | **Protected JGUN** caption. |
| `Chapters.tsx:45` | `isLcdBeatOn` | `0.44 … 0.51` | normalized-global | **YES** | **Protected JGUN** caption. |
| `Chapters.tsx:123-126` | reduced-motion chapter derivation | `pacedProgress(scrollY / max)` | derived | **YES** | Correctly re-applies the pacing map. |
| `Chapters.tsx:145` | `shiftBeat` extra gate | `progress > releaseEnd` | derived | **YES** | |
| `Chapters.tsx:158-159` | card fade in/out | `± 0.035` around `CHAPTER_RANGES` | normalized-global (width) | **YES** | |
| `Chapters.tsx:164` | CH.01 `afterIntro` | `(progress − releaseEnd) / 0.02` | derived | **YES** | |
| `Chapters.tsx:335` | intro track `minHeight` | `906vh` | physical (vh) | height source | Carries no `data-chapter`. |
| `Chapters.tsx:342` | chapter track `minHeight` | `SCROLL_TRACK_VH.chapters[i] ?? 576` | physical (vh) | height source | `[data-chapter="1"]` = 576vh — the hero trigger's element. |
| `Chapters.tsx:348` | footer height | `49vh` | physical (vh) | height source | |
| `Chapters.tsx:14-18` | pacing doc block | "opens at paced 0.17703 and closes at 0.45843"; "Document height 3120vh (scroll distance 3020vh)" | documentation | **YES** | The measured hero-transit window the retained CH.02 timeline is verified against. |
| `TechnicalHUD.tsx:115-116` | mode-switcher visibility | `progress <= .12` | normalized-global | **YES** | **Hardcoded duplicate of `releaseEnd`** — not imported. |
| `TechnicalHUD.tsx:117-118` | `SCROLL // NNN%` readout | `round(progress × 100)` | derived display | **YES** | Shows paced, not raw. |
| `EngineeringDrawingOverlay.tsx` | — | **no scroll-progress consumption** | n/a | NO | Confirmed: its only `vh` (lines 206-207) is a destructured SVG view-rect height. |

### src/types/portfolio.ts

| File:line | Symbol / constant | Current value | Keying | Moves if page height grows? | Notes |
|---|---|---|---|---|---|
| `portfolio.ts:80-83` | `HotspotDef.window` | `[start, end]`, documented as "global-scroll-progress visibility window" | normalized-global (type surface) | **YES** | Only `HOTSPOTS['lcd']` populates it today. |

---

## Highest-risk consumers

Rows where **Keying = normalized-global** *and* the constant governs protected JGUN behavior. These move to a later physical scroll position when the RL300 chapter grows, while the explode/gear/ghost ladder — driven by the `[data-chapter="1"]` element transit — does not.

| File:line | Constant | Value | JGUN behavior governed |
|---|---|---|---|
| `caseStudies.ts:501` | `LCD_REVEAL_WINDOW.start` | `0.420` | LCD orbit entry — authored to land *after* explode completion |
| `caseStudies.ts:503` | `LCD_REVEAL_WINDOW.dwellStart` | `0.458` | LCD dwell begin |
| `caseStudies.ts:504` | `LCD_REVEAL_WINDOW.dwellEnd` | `0.488` | LCD dwell end |
| `caseStudies.ts:506` | `LCD_REVEAL_WINDOW.end` | `0.525` | LCD orbit return |
| `caseStudies.ts:617` | `HOTSPOTS['lcd'].window` | `[0.44, 0.51]` | LCD hotspot label visibility during dwell |
| `caseStudies.ts:293,332,335` | `PATH_SEGMENTS[0]` / `baseAt` segment 0 | `0.000 → 0.525` | Entire JGun camera trajectory |
| `stageWindows.ts:21` | `STAGE_TRANSITIONS.wrenchOut` | `[0.525, 0.565]` | Wrench sink-out (must stay after the LCD return) |
| `jgunVisualGates.ts:23` | `explodeHoldGate` ramp | `0.47 / 0.02` in, `0.525 / 0.04` out | Explode-hold shadow + StudioRig spot nudge |
| `jgunVisualGates.ts:45-46` | `lcdMicroRimIntensity` eases | `0.02` / `0.02` | LCD micro-rim light |
| `SceneCanvas.tsx:80-81` | `LcdFillLight` window | from `LCD_REVEAL_WINDOW` ± `0.02` | LCD dwell fill light |
| `SceneCanvas.tsx:151` | `studioSpotNudge(progress)` | derived | Explode-hold key-light nudge |
| `SceneCanvas.tsx:229-231` | `lcdMicroRimIntensity(progress, …)` | derived | LCD micro-rim light |
| `SceneCanvas.tsx:277-278` | `explodeShadowOpacity(progress, explodeFactor)` | derived | Explode shadow plane — gate and amplitude keyed differently |
| `CameraRig.tsx:212,214` | CR-3 shift bell / orbit | `remapHeroProgress(0.035…0.115)`, `0.18` | CH.01 groove-reveal camera move |
| `CameraRig.tsx:235` | explode-centroid tracking gate | `progress <= 0.525` | Camera lookAt follows the exploded train |
| `CameraRig.tsx:239-240` | `spinProgress` → hero yaw | `(p − 0.18) / 0.17` | Hero yaw the LCD dwell pose is framed against |
| `CameraRig.tsx:253-286` | rear-LCD orbit blend | from `LCD_REVEAL_WINDOW` | The whole LCD dwell camera |
| `CameraRig.tsx:466-468` | rest-orbit garnish | `releaseEnd < p < 0.545` | Settled-JGun idle orbit |
| `TorqueWrenchHero.tsx:357` | gear-idle activation | `chapter === 1 && 0.22 ≤ p ≤ 0.55` | Continuous kinematic gear idling |
| `TorqueWrenchHero.tsx:370-373` | clutch shift window | `remapHeroProgress(0.05/0.10/0.12/0.17)` | Ring-switch / clutch shift |
| `introTimeline.ts:26` | `INTRO_SCROLL_SHARE` | `0.3` | Whole B1/B2 drawing intro — stretches proportionally |
| `introTimeline.ts:32` | `DRAWING_INTRO_WINDOW.releaseEnd` | `0.12` | Drawing → model handoff, and ~14 downstream gates |
| `introTimeline.ts:101` | `INTRO_PHASES.detachStart` | `0.86` (intro-local) | Committed-pace assist window start |
| `introTimeline.ts:192` | `remapHeroProgress()` band | `[0.12, 0.18]` | All retained CH.01 opening cues |
| `Chapters.tsx:43,44,45` | beat captions | `0.04–0.18`, `0.18–0.42`, `0.44–0.51` | Shift / explode / LCD captions |
| `Hotspots.tsx:544` | global hotspot gate | `progress > 0.12` | All JGUN hotspot markers |
| `scrollStore.ts:81` | `?dwell=lcd` | `0.473` | LCD dwell deep link |

**The structural asymmetry:** `TorqueWrenchHero.tsx:112-120` (explode ladder, gear sweep, ghost fade) is keyed to `[data-chapter="1"]`'s **physical viewport transit** and will not move. `Chapters.tsx:14-18` records that this element currently opens at paced `0.17703` and closes at `0.45843` — those two numbers are measured outputs of the current 3120vh layout, not authored constants, and they are what every protected window above was tuned against.

---

## Probe/test assertions at fixed progress values

These break the same way: they pin a paced-progress value, then assert on a channel whose physical timing is set by an element transit.

### Node unit tests (`vitest`)

| File:line | Pinned value(s) | Asserts |
|---|---|---|
| `src/scene/jgunVisualGates.test.ts:15` | `CH04_PROGRESS = [0.72, 0.76, 0.8, 0.9, 0.97, 1.0]` | Every JGUN gate returns exactly 0 |
| `src/scene/jgunVisualGates.test.ts:25-29` | `0.5`, `0.49`, `0.46`, `0`, `0.565` | `explodeHoldGate` = 1 / 1 / 0 / 0 / 0 |
| `src/scene/jgunVisualGates.test.ts:31-34` | `0.48`, `0.545` | Ramp edges strictly between 0 and 1 |
| `src/scene/jgunVisualGates.test.ts:40-42` | `0.5` | `explodeShadowOpacity` peaks at 0.12 × explodeFactor |
| `src/scene/jgunVisualGates.test.ts:46-48` | `CH04_PROGRESS` | Shadow zero even at explodeFactor = 1 |
| `src/scene/jgunVisualGates.test.ts:54-56` | `0.5` | Spot nudge +0.3 intensity / +0.1 Y |
| `src/scene/jgunVisualGates.test.ts:60-63` | `CH04_PROGRESS` | Spot nudge exactly 0 |
| `src/scene/jgunVisualGates.test.ts:69-70` | `0.42`, `0.525` | `LCD_REVEAL_WINDOW.start` / `.end` literal values |
| `src/scene/jgunVisualGates.test.ts:71-76` | `0.47`, `0.419`, `0.526`, `0.43` | Micro-rim 0.8 / 0 / 0 / eased |
| `src/scene/jgunVisualGates.test.ts:81` | `CH04_PROGRESS` | Micro-rim zero |
| `src/scene/drawing/introTimeline.test.ts:16-18` | `0`, `1`, `INTRO_SCROLL_SHARE` | Pacing endpoints; `pacedProgress(0.3) == 0.12` |
| `src/scene/drawing/introTimeline.test.ts:23-27` | `0.6/0.7`, `0.8/0.9` | Equal raw spans cover equal progress; slope == `(1−0.12)/(1−0.3)` |
| `src/scene/drawing/introTimeline.test.ts:32-36` | 2001 raw samples | Strict monotonicity across the handoff blend |
| `src/scene/drawing/introTimeline.test.ts:40-41` | `[0, 0.02, 0.12, 0.13, 0.4, 0.525, 0.76, 1]` | `pacedProgress(rawScrollFor(p)) == p` |
| `src/scene/drawing/introTimeline.test.ts:48-51` | `focusEnd × 0.12`, mid-pulse × `0.12` | Focus completes before pulse |
| `src/scene/drawing/introTimeline.test.ts:57` | mid-onboard × `0.12` | Reserved window carries nothing |
| `src/scene/drawing/introTimeline.test.ts:66-70` | `crossing = 0.8993818764962211`, `waveEnd × 0.12` | Print opaque until the wave crosses |
| `src/scene/drawing/introTimeline.test.ts:74-78` | `(start ∓ 0.01) × 0.12` | Shockwave fires exactly once |
| `src/scene/drawing/introTimeline.test.ts:83-86` | `riseStart`, `[0.1, 0.4, 0.7, 0.8993…, 1]` | Pose reparam round-trip |
| `src/scene/drawing/introTimeline.test.ts:94-104` | `0`, `0.05`, `0.12`, `0.17`, `0.18`, `0.85` | `remapHeroProgress` order + `.18` saturation |

### Headless probes (`scripts/*.mjs`)

| File:line | Pinned value(s) | Asserts / captures |
|---|---|---|
| `scripts/check-b1b2-contract.mjs:97-102` | `0`, `1`, `INTRO_SCROLL_SHARE`, `0.6/0.7/0.8/0.9`, `[0, 0.02, 0.12, 0.13, 0.4, 0.525, 0.76, 1]` | Pacing map endpoints, linearity, invertibility |
| `scripts/check-b1b2-contract.mjs:104-107` | 4001 raw samples | Strict monotonicity |
| `scripts/check-b1b2-contract.mjs:93,168` | `[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.65, 0.8, 0.85, 0.95, 1]` (intro-local t) | Finite phase states; forward/reverse exactness |
| `scripts/check-b1b2-contract.mjs:143-151` | `crossing = 0.8888459503339448` | Shockwave single-pass |
| `scripts/check-b1b2-contract.mjs:174-178` | `0`, `0.17`, `0.18`; `heroEnd == 0.525` | `remapHeroProgress` endpoints |
| `scripts/check-b1b2-contract.mjs:284` | `[0, 0.1, 0.3, 0.4, 0.5, 0.65, 0.8, 0.85, 0.95, 1]` | Second checkpoint sweep |
| `scripts/verify-b1b2-rebuild.mjs:28` | `RELEASE_END = 0.12` | **Hardcoded duplicate** of `DRAWING_INTRO_WINDOW.releaseEnd` |
| `scripts/verify-b1b2-rebuild.mjs:328` | `blend = 0.025` | **Hardcoded duplicate** of `HANDOFF_BLEND` |
| `scripts/verify-b1b2-rebuild.mjs:338-346` | measured | `documentHeightVh`, `scrollDistanceVh`, `heroTriggerRawStart/End`, `heroTriggerPacedStart/End`, `introAbsoluteVh`, `downstreamAbsoluteVh` — the DOM-vs-paced reconciliation |
| `scripts/verify-b1b2-rebuild.mjs:369` | `[0.02, 0.2, 0.42, 0.62, 0.8, 0.9, 0.96, 1] × RELEASE_END` | Intro checkpoints |
| `scripts/verify-b1b2-rebuild.mjs:370` | `[0.18, 0.3, 0.45, 0.53, 0.65, 0.78, 0.9, 0.99]` | Main-timeline checkpoints |
| `scripts/verify-b1b2-rebuild.mjs:386` | `p > 0.12 && p < 0.545` | Wall-clock-channel exemption (rest orbit + gear idle) |
| `scripts/verify-b1b2-rebuild.mjs:405` | `[0.3, 0.36, 0.42, 0.48, 0.54] × RELEASE_END` | Pulse traversal |
| `scripts/verify-b1b2-rebuild.mjs:434` | `[0.88, 0.9, 0.92, 0.94, 0.96, 0.99] × RELEASE_END` | Shockwave front reach |
| `scripts/verify-b1b2-rebuild.mjs:456` | `[0, 0.08, 0.2, 0.42, 0.7, 0.88, 1] × RELEASE_END` | Extraction pose sweep |
| `scripts/verify-b1b2-rebuild.mjs:549` | `[0.02, 0.1, 0.115, 0.12, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]` | JG-023 `backdropAlpha` checkpoints |
| `scripts/verify-b1b2-rebuild.mjs:554` | `run.forward['0.0240']` | Leader-crossing count keyed by a stringified progress value |
| `scripts/verify-b1b2-rebuild.mjs:570` | `[0.2, 0.42, 0.88] × RELEASE_END` | Lite-tier captures |
| `scripts/verify-b1b2-rebuild.mjs:595-596` | `[0.02, 0.35, 0.6, 0.92]` applied as **RAW** scroll | Mobile card layout sweep |
| `scripts/verify-b1b2-supplemental.mjs:42,47,51` | `0`, `.12`, `.12 ± 1e-8` | Handoff C0 continuity against `baseAt(.12)` |
| `scripts/verify-b1b2-supplemental.mjs:55,67` | `crossing × .12`, `(crossing + .015) × .12` | Contact / post-detach frames |
| `scripts/verify-b1b2-supplemental.mjs:70-71` | `[.34, .39, .44, .49, .54] × .12` | Ordered pulse traversal |
| `scripts/verify-b1b2-supplemental.mjs:85` | `[.2, .3, .65, .95] × .12` | Lite-tier displacement disabled |
| `scripts/verify-jg027-lcd-cluster.mjs:42` | `DWELL = 0.473` | Paced midpoint of the LCD dwell |
| `scripts/verify-jg027-lcd-cluster.mjs:245-246` | `abs(settled.progress − 0.473) ≤ 0.005`; `explodeFactor ≥ 0.999` | **The single sharpest assertion in the repo**: it requires the explode ladder to be complete at paced 0.473 |
| `scripts/verify-jg027-lcd-cluster.mjs:306,309` | `?dwell=lcd` must land in `0.458 … 0.488` (±0.01) | Deep-link lands inside the dwell |
| `scripts/verify-jg028-handle-realism.mjs:70` | `scrollToProgress(0.10)` | CH.01 drawing view |
| `scripts/verify-jg028-handle-realism.mjs:98` | `scrollToProgress(0.22)` | CH.01 lift-off view |
| `scripts/verify-jg028-handle-realism.mjs:127` | `scrollToProgress(0.35)` | CH.01 hero view |
| `scripts/verify-jg028-handle-realism.mjs:281` | `scrollToProgress(0.50)` | Explosion ladder asserted at `explode = 1` |
| `scripts/verify-jg031-gear-rotation.mjs:70` | `scrollToProgress(0.35)` | 5-stage `stageRot`, driveline monotonicity |
| `scripts/verify-jg031-gear-rotation.mjs:145` | `scrollToProgress(0.50)` | Near-full gear sweep, monotonicity |
| `scripts/verify-jg031-gear-rotation.mjs:198` | `?view=exploded` | Static exploded mode holds `stageRot` at 0 |
| `scripts/verify-jg032-station2-thermal.mjs:54` | `STOPS = [0.05, 0.35, 0.47, 0.5, 0.575, 0.65, 0.74, 0.85, 0.9]` | Full telemetry + gate probe at each stop |
| `scripts/verify-jg032-station2-thermal.mjs:55` | `SHOT_STOPS = {0.05, 0.47, 0.5, 0.575, 0.65, 0.74}` | Screenshot subset |
| `scripts/verify-jg032-station2-thermal.mjs:232` | `scrollToProgress(0.65)` | Frame-time percentiles at the RL300 hold |
| `scripts/verify-jg032-station2-thermal.mjs:456-463` | `p0.575`, `p0.65` | Panel opacity 0.35 assembled → 0.18 hold |
| `scripts/verify-jg032-station2-thermal.mjs:468-481` | `p0.5`, `p0.47`, `p0.85` | JGUN gates: spot 1.4 @ y1.3 and shadow visible at 0.50; micro-rim ≥ 0.7 at 0.47; **fully inert at 0.85** |
| `scripts/capture-b1b2-baseline.mjs:49-54` | `y = (scrollHeight − innerHeight) × p` | Treats its `progress` argument as **RAW**, then logs it against `telemetry.scroll.progress` (paced) |
| `scripts/capture-b1b2-baseline.mjs:61` | `[0, 0.2, 0.4, 0.85, 1] × 0.12` | Intro captures |
| `scripts/capture-b1b2-baseline.mjs:62-63` | `[0.10, 0.30, 0.50, 0.65, 0.80, 0.95]` forward and reverse | Main-timeline captures |
| `scripts/capture-b1b2-baseline.mjs:64-65` | `0.1199`, `0.1201` | Handoff-boundary pair |
| `scripts/capture-rl300-baseline.mjs:39` | `SWEEP` = 21 stops at `0.05` increments | Uniform sweep |
| `scripts/capture-rl300-baseline.mjs:41-53` | `NAMED` = `0.0, 0.177, 0.416, 0.458, 0.47, 0.525, 0.565, 0.575, 0.65, 0.72, 0.76, 0.85, 1.0` | Named beats; `0.177` / `0.416` / `0.458` are the measured hero-transit and explode-complete values |
| `scripts/capture-rl300-baseline.mjs:59-62` | `stationAt()`: `< 0.525` JGUN, `< 0.72` RL300, `< 0.9` M249 | Station attribution per stop |
| `scripts/capture-rl300-baseline.mjs:255` | holds `[0.416, 0.575, 0.65, 0.85]` | Frame-time percentiles |
| `scripts/capture-rl300-baseline.mjs:287` | `scrollToProgress(0.65)` | RL300 hold capture |
| `scripts/check-fallback.tsx:31,52` | `progress: 42` | **Not scroll** — `useProgress()` asset-loading percentage |

---

## Unresolved / needs source inspection

1. **`SpatialRig.tsx:64` (`maxDelta / 0.085`) — classified "derived, scroll-rate sensitive" with low confidence.** The denominator is documented as empirically fitted to "dα/dp = 37.5 at mid-window across the 0.04-unit transition" for continuous 60 fps scrub. dα/dp is invariant, but dp/dt for a given input gesture is not: on a taller document the same wheel delta covers less progress, so the measured peak intensity (spec'd at 0.70–0.74) will drop. I could not determine from source alone how far it drops or whether the JG-017 spec has a lower bound that would fail.

2. **`scrollStore.ts:47-50` and `scrollStore.ts:107-114` apply paced-axis constants directly to raw scroll** (`maxScroll × target.scrollProgress`, `max × initProg`) without `rawScrollFor()`, unlike `ScrollRig.tsx:74` and `DrawingLinework.tsx:313/327` which do invert. This looks like a pre-existing bug rather than an intentional keying choice, but I found no comment or test that settles it. `verify-jg027-lcd-cluster.mjs:306` asserts `?dwell=lcd` lands inside `0.458–0.488`, and it passes today — which means either the mismatch is currently small enough to hide, or `ScrollRig`'s own deep-link seek at line 74 overwrites the store's seek. I could not determine which from source.

3. **`capture-b1b2-baseline.mjs:49-54` treats its `progress` parameter as raw scroll** while every other probe uses `scrollToProgress()` (paced). Its `intro-*` captures multiply by `0.12` — a paced band edge — before applying it raw. Whether this is deliberate (a raw-axis baseline) or a stale pre-pacing harness is not recoverable from the file.

4. **`verify-jg032-station2-thermal.mjs:462` asserts `g65.panelY ≈ 0.55`**, but the JG-032 rev2 choreography at `Station2_AcousticEnclosure.tsx:351-356` states "the vertical panel lift is retired." I did not trace whether `panelY` is still produced by the gate probe; if it is not, this assertion's current status is unknown to me.

5. **The two derivation comments at `stageWindows.ts:6-15` and `caseStudies.ts:486-497` describe a 2020vh document** (3 × 440vh + 660vh + 40vh) that no longer exists — `Chapters.tsx:20` is now 3120vh with a dedicated 906vh intro track. The paced values they cite (hero transit ≈0.177 → 0.458, explode complete ≈0.416) *do* still match `Chapters.tsx:14-18` and `capture-rl300-baseline.mjs:41-53`, so the numbers survived the relayout — but I cannot tell from source whether that was engineered (the JG-026 track heights were chosen to preserve them) or coincidental. This matters directly to the extension question and should be confirmed against `project/work/evidence/JG-026-b1-b2-verification.md`, which I did not read.

6. **`INTRO_PHASES` classification.** I recorded these as *derived (intro-local)* because they live on `t = p / 0.12`. An argument exists for calling them normalized-global, since the intro band itself is a fixed fraction of the raw document. I chose "derived" because they do not move *relative to each other or to the intro band* — only the band's absolute length changes. Flagging rather than asserting.

7. **Files scanned and confirmed to contain no scroll-progress keying** (recorded so they are not re-litigated): `src/scene/stages/airflowRoute.ts` (its 0..1 values are route arc-length `t`, color-ramp stops, and shell radii in metres), `src/scene/drawing/extractionPose.ts` (pose axis), `src/scene/rig/*` (`gearRotation.test.ts`, `lcdCluster.ts`, `materials.ts`, `nodeRoles.ts`), `src/shaders/CadTransitionShader.ts` (`uProgress` is fed `chapterProgress`), `src/components/EngineeringDrawingOverlay.tsx`, `src/components/BootSequence.tsx` (drei `useProgress()` asset loading), `scripts/check-station2-contract.mjs`, `scripts/export-sheet-template.mjs`.
