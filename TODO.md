# TODO — jgun-portfolio

Canonical task queue. Installed 2026-08-24 from Mark's review pass-3 handoff
(`C:\tmp\handoff-jgun-portfolio-2026-08-24.md` — supplementary deep context; C:\tmp
files go stale, this file is authoritative). State at install: `main` @ `a148ef5`
(local-only, ahead 9). All prior work telemetry-verified.

> ⚠️ RE-DERIVATION REQUIRED (2026-08-24 review pass 3a, commit after 47f47f9):
> the ladder was REORDERED per Mark's live review — A000606 (P001849) is now
> the THIRD cage in line (between P003045 and P001837), offsets are
> s4 −0.099 / s3 −0.142 / s5 −0.177 / s2 −0.208 / s1 −0.233 / clutch −0.269 /
> handle −0.331 (see docs/animation-spec.md §5.3). The K000004 slot math below
> (−0.071 behind a FRONT-slot s5) is STALE — A000606 no longer sits behind the
> housing mouth. "Right behind A000606" now means a slot adjacent to the third
> cage. Re-derive the offset from the current §5.3 table before implementing.

## Pass 3 — Mark's review fixes (both fixes are his spec)

### [ ] Fix 1 — K000004 bearing must extract right behind A000606

Intent: A000606 out first, then K000004 right after it.
Root cause: K000004 is an untagged direct child of the gearbox node → `unitOf` walks
it into the static remainder → it never moves.

Ground truth (JSON-chunk method, 2026-08-24): K000004 = thin ring ⌀0.073 × 7 mm,
spans [−0.058, −0.051], center z −0.0545 — sits at the REAR face of A000606
(spans [−0.056, −0.023], center −0.0394). P000725 spans [−0.1035, −0.0602] (currently
inside clutch-static — OK). Mark wrote "K000001" in the sequencing sentence — typo for
K000004; K000001 is the ⌀0.028 output bushing, already correctly in the output unit.

Steps:
1. `src/scene/rig/nodeRoles.ts`: tag `/K000004/i` as its own unit (`k000004`); build its
   merged group under gearbox (same `makeUnit` pattern); expose on WrenchRig
   (`rig.bearing` or an extras list).
2. `src/data/caseStudies.ts` EXPLODE_OFFSETS: add `k000004: -0.071` (slot math:
   exploded s5 spans [−0.1188, −0.0860], s4 front −0.1308 → 12 mm slot behind s5 puts
   the 7 mm bearing at center ≈ −0.125 → −0.125 − (−0.0545) ≈ −0.071; it started at
   s5's rear face, so the ladder order gives the "first the cage, then the bearing" read).
3. Apply in `src/scene/TorqueWrenchHero.tsx` applyExplosion; keep exploded-mode +
   reduced-motion paths.
4. Same commit: spec §5.1 role table + §5.3 ladder, README ladder, and BOTH skills'
   tables (they hardcode the ladder); optional telemetry probe `k000004Z`.

### [ ] Fix 2 — display rotation turns (wow over kinematic truth)

Mark: "Speed up the last cages. 5th Stage Cage Assembly should spin 0.5 rotations;
4th stage cage 1 rotation. 1st and 2nd stage cages twice as fast as now. Incorrect
ratios are fine — parts that don't look like they're spinning take away from it."

Steps:
1. `src/data/caseStudies.ts`: add `ROTATION_TURNS = { stage1: 8, stage2: 2.24,
   stage3: 1.5, stage4: 1, stage5: 0.5 }` (revolutions over the 0.15→1.0 gearRotation
   window; s1/s2 = 2× current 4 and 1.12; s3 unspecified — 1.5 picked to fit the
   cascade between s4's 1 and s2's 2.24, CONFIRM WITH MARK). Keep `GEAR_RATIOS` as the
   documented mechanical truth; comment the TURNS table as a deliberate display
   override (Mark, 2026-08-24).
2. `TorqueWrenchHero.applyGearRotation`: carrier `rotation.z = normalizedSweep ×
   ROTATION_TURNS[id] × 2π` (normalize gearRotation by GEAR_ROTATION_SWEEP). Planet
   counter-spin −3.5× makes s1 planets 28 turns (blur territory) — watch live; per-stage
   cap or reduced multiplier if needed.
3. Verify: telemetry `stageRot` per stage ≈ turns × 2π at full scroll; spec/skill value
   updates in the same commit.

### [ ] Verification gate (both fixes)

Telemetry-verify explosion + rotation on a freshly restarted :4173 preview — no
vision-only sign-off. Re-update both skills' tables with pass-3 measured values.

## Queued (after pass 3)

- [ ] Design decisions — Mark's call, parked: CH.02 camera framing at full extraction
      (span ≈0.61 m vs ~0.30 m half-view — target-shift or FOV widen); reassembly beat
      (CH.02→CH.03 vs CH.03→CH.04); CH.03 hero object; ending beat.
- [ ] Deploy/hosting — THE ship blocker. Mark owns studiomark.dev DNS (Porkbun).

## Gotchas (all learned 08-23/24)

- Restart the :4173 preview server after EVERY rebuild (stale server + rotated hashes →
  canvas never mounts). Tab-close ≠ browser restart for wedged software-GL.
- Headless tier ladder can degrade to poster mid-probe → telemetry FREEZES; check
  `document.querySelector('canvas')` liveness before trusting values.
- Vision confabulates on the dark scene — telemetry first, vision last.
- `playwright browser_evaluate` needs a real function; ~3 s settle after scrollTo;
  scroll-up can need repeated enforcement.
- Default.glb stage 4 = FIVE planets; counts are dynamic. GLTFLoader mangles node
  names (`[\s_]*` classes); part numbers are mangling-safe.
- Never commit `.scratch/` or the parallel-session WIP files (see AGENTS.md).
