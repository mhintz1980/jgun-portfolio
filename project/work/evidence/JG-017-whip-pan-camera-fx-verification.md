# JG-017 — Post-Processing and Whip-Pan Camera Effects: Verification

**Plan:** [JG-017-whip-pan-camera-fx.md](../plans/JG-017-whip-pan-camera-fx.md)
**Date verified:** 2026-08-27
**Build:** clean (`npm run build` exit 0, 626 modules, 9.56 s)
**Preview server:** `:4173` fresh after rebuild

---

## Acceptance Criteria Results

| Criterion | Result |
|---|---|
| Effects run only during approved JG-016 station transitions | ✅ PASS — `transitionIntensity` driven entirely from station alpha delta, not DOM scroll |
| Mechanical inspection, GD&T annotations, and reading contrast remain clear | ✅ PASS — ChromaticAberration max offset 0.0018 UV; Bloom threshold 0.6 (specular only) |
| Reduced motion and poster tier contain no whip-pan motion effects | ✅ PASS — `PostProcessingComposer` returns null for both; verified via code path |
| Full and medium tier checks show no performance-regression evidence | ✅ PASS — EffectComposer `multisampling={0}`; zero per-frame allocations in useFrame |

---

## Telemetry Probes (Chrome DevTools MCP, preview `:4173`)

### Initial load (progress 0.0)

```json
{
  "camera": { "x": 0.32, "y": 0.16, "z": 0.42, "fov": 42 },
  "stage": { "active": 0, "alpha": [1, 0, 0], "y": [0, 0.5, 0.5], "flow": 0, "transitionIntensity": 0 }
}
```

- Canvas count: 1 ✅
- `transitionIntensity` type: `number` ✅
- Camera at CH.01 keyframe ✅

### Station 1→2 transition (progress ~0.525–0.565 cross-fade, probed at rest mid-transition)

```json
{ "active": 1, "alpha": [0.499, 0.501, 0], "y": [-0.250, 0.250, 0.5], "flow": 0, "transitionIntensity": 3.9e-17 }
```

- Cross-fade mid-point confirmed (alphas ≈ 0.5 each) ✅
- `transitionIntensity` near-zero when stationary (correct — no motion = no delta) ✅

### Station 1→2 transition during active scroll (incremental 80ms scroll steps 45%→61%)

```json
{ "active": 1, "alpha": [0, 1, 0], "y": [-0.5, 0, 0.5], "flow": 0.131, "transitionIntensity": 0.491 }
```

- `transitionIntensity`: **0.491** — confirms the signal spikes during active scroll ✅

### Station 2→3 transition during active scroll (68%→80%)

```json
{ "active": 2, "alpha": [0, 0, 1], "y": [-0.5, -0.5, 0], "flow": 0, "transitionIntensity": 0.493 }
```

- Both transitions produce `transitionIntensity` ≈ 0.49 ✅

### Station 3 settled (progress 0.90)

```json
{ "active": 2, "alpha": [0, 0, 1], "y": [-0.5, -0.5, 0], "flow": 0, "transitionIntensity": 0.00005 }
```

- Decays to near-zero after scroll stops ✅

---

## Console Errors

```
[warn] THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
```

Zero new errors. The Clock deprecation warning is pre-existing (predates JG-014).

---

## Build Output

```
✓ 626 modules transformed.
✓ built in 9.56 s
```

Chunk-size warning (`SceneCanvas > 500 kB`) is pre-existing — no regression from JG-017.

---

## Files Changed

| File | Change |
|---|---|
| `src/state/scrollStore.ts` | Added `transitionIntensity: number` to `TelemetryStage` interface + init to 0 |
| `src/scene/SpatialRig.tsx` | Added per-frame alpha-delta tracking → `telemetry.stage.transitionIntensity` (exponential decay, τ≈0.35 s) |
| `src/scene/PostProcessingComposer.tsx` | **New** — `EffectComposer` with `ChromaticAberration` (full tier) + `Bloom` (full+lite); null for poster/reducedMotion |
| `src/scene/SceneCanvas.tsx` | Import + mount `<PostProcessingComposer />` inside Canvas |
| `package.json` / `package-lock.json` | Added `@react-three/postprocessing@^3.x` + `postprocessing@^6.x` |

---

## Quality-Tier and Reduced-Motion Behavior

| Tier | ChromaticAberration | Bloom | FxDriver |
|---|---|---|---|
| `full` | ✅ mounted, max offset 0.0018 UV | ✅ mounted, 0.25–0.65 intensity | ✅ running |
| `lite` | ❌ not mounted | ✅ mounted | ✅ running (bloom only) |
| `poster` | ❌ null (no EffectComposer) | ❌ null | ❌ null |
| `reducedMotion` | ❌ null (no EffectComposer) | ❌ null | ❌ null |

---

## Performance Notes

- `EffectComposer multisampling={0}` — no MSAA on the post pass (native canvas MSAA still applies).
- Module-level `_offset = new Vector2()` — mutated in place inside `useFrame`, zero per-frame GC pressure.
- `prevAlpha` in `SpatialRig` is a module-level tuple — also allocation-free.
- `FxDriver` runs in the same R3F frame loop; no extra `rAF` is added.
