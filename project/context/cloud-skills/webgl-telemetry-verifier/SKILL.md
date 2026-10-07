---
name: webgl-telemetry-verifier
description: Use when verifying WebGL scenes, 3D transforms, shader states, explosion offsets, gear rotation, or ghost opacity on the portfolio — runtime telemetry probes and programmatic browser evaluations instead of vision models.
---

# WebGL Telemetry & Automated Verification

## Context & Method
LLM vision models hallucinate on dark-mode metallic 3D viewports (they
confirm expectations — see the 2026-08-22 confabulation incident).
**All 3D claims must be verified via programmatic instrumentation.**

Headless status (re-tested 2026-08-23): with Draco decoders vendored locally
(`public/draco/`), **the GLB loads headless via the playwright MCP browser** —
rig fully builds, telemetry populates, zero console errors, canvas even
rasterizes. The old total-stall was the remote decoder fetch. Headless CLI
`--screenshot` captures still need `--use-angle=swiftshader
--enable-unsafe-swiftshader` + absolute paths + real `--timeout`.

### Working probe recipe (playwright MCP)

Harness note (2026-09): the playwright-MCP tool names below
(`browser_navigate` / `browser_evaluate`) don't exist in the ZCode
harness — the chrome-devtools MCP equivalents are `navigate_page` /
`evaluate_script` (same semantics: navigate, wait, evaluate a function,
read its JSON return).
1. `browser_navigate` → `http://localhost:4173/?view=exploded` (vite preview
   binds IPv6 `localhost`, not 127.0.0.1; a stale server on the port serves
   the current `dist/` from disk).
2. Wait ~6 s (boot + GLB stream), check console for 0 errors.
3. `browser_evaluate` a function (NOT a string — strings return `{}`) that
   returns `JSON.stringify(window.__telemetry)`.
4. Scroll-driven states: `window.scrollTo(0, max × N)` then wait ~3 s (Lenis
   1.1 s + scrub 0.6 to settle) before reading. Mid-scroll probes prove
   continuous interpolation; saturated ones prove end values.

## Runtime Telemetry Instrumentation

The application exposes a mutable runtime probe at `window.__telemetry`,
written per frame outside React:

```ts
interface TelemetryState {
  camera: { x: number; y: number; z: number; fov: number };
  rig: {
    handleZ: number; outputZ: number; clutchZ: number; slidingZ: number;
    stageZ: number[];    // stage1..stage5 carrier Z
    stageRot: number[];  // stage1..stage5 carrier rotation.z (rad)
    planetRot: number;   // stage-1 first planet rotation.z
    gearRotation: number; shift: number;
    ghostOpacity: number; ghostCount: number; explodeFactor: number;
    ringSwitchZ: number; ringSwitchRotZ: number;
  };
  // K000004 bearing (pass 3, 2026-08-25) has NO __telemetry.rig field —
  // probe it via window.__rig.bearing.position.z (the rig object is exposed
  // on window by TorqueWrenchHero).
  scroll: { progress: number; chapter: number; chapterProgress: number; materialMode: 'solid' | 'blueprint' | 'exploded' };
  stage: {               // multi-chapter orchestrator (2026-08-24, StageManager)
    active: number;      // dominant stage: 0 wrench, 1 MSP enclosure, 2 M249 cloud, -1 none
    alpha: [number, number, number];  // cross-fade alphas (wrench/enclosure/cloud)
    y: [number, number, number];      // stage-group Y offsets (m)
    flow: number;        // CH.03 airflow intensity 0..1 (ramps 0.575→0.72 progress)
  };
}
```

## Verification Checklist for Agents

1. **Camera Trajectory Check**:
   - CH.01: Pos `[0.32, 0.16, 0.42]`, Target `[0, 0, 0]`, FOV `42`
   - CH.02: Pos `[0.55, 0.04, 0.04]`, Target `[0, 0, 0.03]`, FOV `34`
   - CH.03: Pos `[0.27, 0.27, 0.27]`, Target `[0, 0, -0.02]`, FOV `28`
   - CH.04: Pos `[0.06, 0.03, -0.46]`, Target `[0, 0, -0.11]`, FOV `50`

2. **Rear-Extraction & Kinematics (exploded view / deep CH.02 scroll)**:
   - Stage ladder (driveline order, pass 3 2026-08-25): `stageZ ==
     [-0.255, -0.230, -0.177, -0.142, -0.099] ± 0.001` (s1..s5 — exploded
     line reads s4 → s3 → s5 → K000004 → s2 → s1 behind the housing;
     A000606/P001849 is the THIRD cage)
   - Bearing ring (pass 3): `window.__rig.bearing.position.z == -0.197`
     (K000004 parks between A000606 −0.177 and stage 2 −0.230; verify the
     classified geometry via its merged mesh bbox ≈ 0.058 × 0.058 × 0.007)
   - `outputZ == +0.050`, `handleZ == -0.354`, `clutchZ == -0.291`
   - At `shift == 1` with the explosion open: `slidingZ == -0.306`
     (= clutch − 0.015); shift completes BEFORE any explosion offset moves
     (timeline 0–15% window, where slidingZ == -0.015)
   - Gear kinematics at full sweep (`gearRotation = 8π ≈ 25.133`), JG-031
     display turns (mapped along physical driveline from motor to snout):
     `stageRot == (gearRotation / 8π) × 2π × [stage1: 8, stage2: 5.2, stage3: 2.2, stage4: 1.43, stage5: 3.38]`
     (= [50.265, 32.673, 13.823, 8.985, 21.237] rad).
     Along physical driveline order `[stage1, stage2, stage5, stage3, stage4]`
     turns are `[8.0, 5.2, 3.38, 2.20, 1.43]` with strictly monotonic reduction
     and adjacent stage ratio ≈0.65;
     `planetRot == -3.5 × stageRot[0]`; `gearRotation` reaches 8π exactly as
     `explodeFactor` reaches 1 at global progress ≈0.518 (windows overlap —
     gears spin through the extraction)
   - Static exploded mode keeps the train at rest (`stageRot` all 0)
   - Ghost material count: `ghostCount === 1` (measured 2026-09-02 on BOTH the
     Medium and Fine GLBs — the housing ghost-merges into one consolidated
     material; the 2026-08-25 `ghostCount === 0` regression note and the
     "expected 3" figure predate final consolidation).
     The commanded `ghostOpacity === 0.15` in CH.02 still holds.
   - `slidingZ`/`ringSwitchZ` at 0.52: **−0.291** both (2026-09-02 A/B,
     Medium + Fine identical — the earlier `−0.306` figure is stale).
   - **Liveness check first**: if `document.querySelector('canvas')` is
     absent but telemetry shows non-initial values, the quality ladder
     dropped to poster (canvas unmounted, telemetry FROZEN) — restart the
     preview server after any rebuild, and if the browser's software-GL
     process is wedged (canvas never mounts), restart the whole browser
     process, not just the tab.

3. **Multi-chapter stage windows (StageManager; remeasured 2026-08-24 after
   the scroll ×2 — sections are 440vh, document ≈ 1800vh)**:
   - Explosion completes at ≈0.518 (gears at 8π); wrench HOLDS fully
     exploded until the sink window 0.535–0.575 (probe 0.52: alpha [1,0,0],
     `explodeFactor` 1; probe 0.555: alpha ≈ [0.5, 0.5, 0]).
   - CH.03 enclosure dominant 0.575–0.72 with `flow` ramping 0→1 across it
     (probe 0.64: alpha [0,1,0], flow ≈ 0.5, camera on the CH.03 keyframe).
   - CH.04 cloud enters 0.72–0.76 (CH.02→03 chapter flip ≈0.74) and holds:
     probe 0.90 → alpha [0,0,1], flow 0. Camera keyframes NOT retargeted yet
     (owner gate pending) — placeholders are sized to fit the existing
     keyframes.

4. **Performance Tier Step-Down**:
   - DPR bounds: `[1.0, 2.0]` with thrash guard after 3 flip-flops.
   - Quality tiers downgrade one-way: `full -> lite -> poster`.
   - FPS via `browser_evaluate` rAF counters is blocked (side-effect guard) —
     use tier/DPR/canvas-state checks for perf evidence instead.

5. **Decal / dressing visibility gate (pixel-authoritative — JG-027,
   2026-09-06)**: material-identity telemetry ≠ visibility. JG-025's LCD
   dressing passed material checks while rendering ZERO pixels (the decal
   cluster mounted inside the handle). Verify visibility by counting
   expected pixels inside each decal's PROJECTED screen rect — reference
   implementation: jgun-portfolio `scripts/verify-jg027-lcd-cluster.mjs`.
   Do NOT substitute bounding-sphere occlusion tests: they false-positive
   on sub-millimetre-offset decals. Pixels are the authoritative gate.

6. **Finish/regression evidence — A/B worktree census (JG-028/029,
   2026-09-06/07)**: the strongest like-for-like evidence is a detached
   worktree at the pre-change HEAD (junction `node_modules`, copy the
   gitignored `public/models/Default.glb` into `public/models/` and
   `dist/models/`), served side-by-side with the current build and
   diffed live per-mesh (parent, material signature, vertex count) with
   vertex-conservation accounting. Run a same-build control pair FIRST
   to size capture noise (~1% gear-phase residue); static
   `?view=exploded` is the clean finish A/B. Committed probe:
   jgun `project/work/evidence/jg029-ring-switch-knurl/verify-jg028-regression-census.mjs`.

## Anti-Patterns
- ❌ Taking screenshots and asking a multimodal model "does the explosion look right?".
- ❌ Relying on visual inspection for camera FOV or near/far clipping issues.
- ❌ Presenting vision output as first-hand observation — vision LAST, labeled as machine opinion, never the primary witness.
- ❌ Treating material-identity or bounding-sphere checks as proof a decal is visible — count pixels inside the projected screen rect (§5, JG-027).
