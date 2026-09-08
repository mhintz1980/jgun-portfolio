# JG-031 — Internal cage rotation tuning (65% stage progression)

## Owner request (2026-09-07)

The visual rotation of the internal planetary cages is retuned to follow a consistent progression:
1. Each stage should spin at a slower rate than the previous stage (strictly monotonic reduction).
2. Fix visual ambiguity where adjacent / alternate stages appeared to turn at the same speed during scroll.
3. Make each cage turn at approximately **65% of the previous cage's speed** while maintaining sufficient animation to remain clearly noticeable during fast scroll scrub.

## Baseline vs. Retuned Values (Physical Driveline Order from Motor to Snout)

Anchor: `stage1 = 8.0` (base input drive):

| Pos | Stage ID | Unit / Part | Old Turns | New Turns (JG-031) | Ratio vs Previous | Full Sweep Rot (`8π`) |
|---|---|---|---:|---:|---:|---:|
| **Pos 1** | `stage1` | `A000591` / `P001836` | 8.00 | **8.00** | 1.000 (base) | 50.265 rad |
| **Pos 2** | `stage2` | `A000592` / `P001837` | 2.24 | **5.20** | **0.650** (65.0%) | 32.673 rad |
| **Pos 3** | `stage5` | `A000606` / `P001849` | 0.50 | **3.38** | **0.650** (65.0%) | 21.237 rad |
| **Pos 4** | `stage3` | `A000860` / `P003045` | 1.50 | **2.20** | **0.651** (65.1%) | 13.823 rad |
| **Pos 5** | `stage4` | `A000861` / `P003047` | 1.00 | **1.43** | **0.650** (65.0%) | 8.985 rad |

*Note: In CAD modeling, A000606 was tagged "stage 5", but in physical driveline and exploded order it sits as the 3rd physical cage between Stage 2 and Stage 3. Mapping 65% strictly along the physical driveline (`stage1 → stage2 → stage5 → stage3 → stage4`) ensures every physical cage in view slows down smoothly without mid-stack reversals.*

## Code Changes

1. `src/data/caseStudies.ts`: Update `ROTATION_TURNS` to `{ stage1: 8, stage2: 5.2, stage5: 3.38, stage3: 2.2, stage4: 1.43 }`, export `DRIVELINE_STAGE_IDS`, and update documentation.
2. `src/scene/TorqueWrenchHero.tsx`: Update comments in header and `applyGearRotation` docstring.
3. `src/scene/rig/gearRotation.test.ts`: Unit test suite verifying monotonicity, ratio bounds [0.64, 0.66], and planet counter-rotation multiplier 3.5.
4. `scripts/verify-jg031-gear-rotation.mjs`: Playwright runtime probe asserting telemetry at scroll stops 0.35, 0.50, and static exploded rest, capturing proof screenshots.

## Synchronized Tables (AGENTS.md Rule)

- `project/context/architecture/animation-spec.md` (§5.4 and Section 13 history).
- `project/README.md` and `README.md` display turns lines.
- `cad-scene-graph-rigging` and `webgl-telemetry-verifier` shared skills.

## Required Proof

- Unit tests: `npm test` (all 15 tests pass).
- TypeScript: `npm run typecheck` clean.
- Station 2 contract: `npm run check:station2` PASS.
- Production build: `npm run build` clean.
- Runtime probe: `node scripts/verify-jg031-gear-rotation.mjs` PASS (all 5 stages monotonic, consecutive ratios in [0.63, 0.67], planetRot = -3.5 * stageRot[0], exploded view at rest, 0 errors).
- Owner visual ruling at `:4173` CH.02 lateral view.
