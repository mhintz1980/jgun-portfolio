# 16 — Astra re-review packet (2026-09-22; updated 2026-09-23; ROUTED 2026-09-24)

**Standing verdict to clear:** `fix-first` (evidence 11). It blocks further visual-effects
work on JG-033.

**ROUTED 2026-09-24** against commit `a4f1fdd` (pushed; owner had approved both route
rulings by looking on 2026-09-23/24). Routing doctrine this time — maximize Astra quota:
**one call, single decision point, pre-computed evidence, no agency required.** All
runtime telemetry is in the packet; images attached to the prompt
(`.scratch/astra-packet/prompt.md`); read-only sandbox; effort high. If the verdict names
missing essential evidence, that is a packet defect to fix in a second, better call — not
a drip of follow-ups.

---

## What changed since the last Astra review

### 1. The airflow/heat/sound ribbon beat (commit `d09ef93`)
Built 2026-09-16, committed 2026-09-22 at the owner's direction. `flow.ts` SPINES evaluator
+ `AirRibbons.tsx` renderer + a null-test clipping gate. Full record:
[`13-handoff-2026-09-16.md`](13-handoff-2026-09-16.md) §4.

Measured at the time: strand width at shot 05 **6.6–10.3 CSS px** (was 2.1–4.8); authored
heat reaches **1.0** at the merged end and never decreases downstream; `ribbonSplit(18)` =
6/6/6; main→merged junction distance **0.0361**.

The clipping gate exists because the *first* clipping implementation changed **zero pixels
while looking correct in source** — `gpt-6-astra` caught that; nothing automated did. The
gate now asserts 17,222 px changed under override / 0 on restore / 0 for the unclipped
bundle.

### 2. Duct reconstruction + spine re-snap (commit `fe8ca64`)
Owner-instructed geometry from his three annotated screenshots. Full record:
[`15-duct-reconstruction.md`](15-duct-reconstruction.md).

- Airway volume: 8-sided/28 tris → **7-sided/24 tris**; web AABB min y 1.200 → **1.348**,
  z 0.431 → **0.434**. The downward overshoot over the pump is gone (**+0.148 m**).
- Turn-down moved z 0.62 → **z 0.564**, the measured canopy leading edge.
- `SPINES.main` waypoints 2–8 re-snapped. **Waypoints 7–8 had been outside the volume
  entirely** under the old geometry.
- Ribbon-fan clearance at the U-turn went **11.0 mm → 81.0 mm** against a 48 mm fan.

### 3. Owner entry + mid-path rulings executed (commit `a4f1fdd`, 2026-09-23/24)
Both rulings decoded, implemented via pair-dispatch, adversarially reviewed SHIP ×3, owner
approved by looking. Full record: [`20-mid-path-execution.md`](20-mid-path-execution.md).

- `SPINES.main` → **19 waypoints**: approved entry (wp 0–4), hairpin under the canopy
  leading edge, ~17° aft descent, tail **on** the merged spine (≤ 5 mm, pinned; was
  36–189 mm). Design metrics: ≤ 28 mm off his red curve, min radius 58 mm, ≤ 11° per
  rendered segment, ≥ 30 mm wall clearance incl. fan.
- `AIR_SAMPLES` 72 → **144** (72 sampled the hairpin at 21°/segment).
- Ribbon frames: world-up → **parallel transport** — kills the up-to-61 mm sideways flip
  at every |tangent.y| ≥ .92 switch (each hairpin z-reversal forced it). Approved-entry
  fan offsets preserved to 1.4e-16.
- Tests: corridor re-pinned; +2 (ruling geometry/smoothness; ribbon continuity — legacy
  fails at 61 mm = teeth); +4 non-vacuity guards.
- Her four deciding items: connected merging **fixed** (main→merged); heat carry-through
  **addressed in d09ef93, not yet re-reviewed**; louver traversal (lower bundle)
  **unchanged**; acoustic interaction **unchanged**.

---

## What we want ruled on

1. **Is `fix-first` cleared?** If not, what specifically remains, ranked.
2. **Does the air now read as going where the machine makes it go?** In through the hex
   openings → up the slanted face → aft under the ceiling → hairpin under the canopy
   leading edge → out the pocket mouth → long aft descent → merged discharge.
3. **Does the hairpin + descent read as smooth travel** (the owner's explicit rule)? Did
   parallel transport measurably improve the ribbon read at the reversals?
4. **Does the beat still read at the low-motion stops** (u .05 and .95) as well as mid-run?
5. **The two owner-approved segments: execution quality only** (route fidelity is
   test-pinned ±35 mm both ways; Mark accepted the look).

**Open section (creative latitude):** rank remaining visual deficiencies by perceptual
payoff per implementation cost (the two UNCHANGED items included if they still matter);
if a question above is the wrong question, say what the right one is. Owner route rulings
are immutable; execution risks on them may be flagged.

**Fences stated in the prompt:** owner rulings fixed; measured geometry beats prose;
JG-034 pre-existing; judge the study not the main page; telemetry numbers are ground
truth (dark-scene house rule).

## Evidence in this packet

| What | Where |
|---|---|
| Owner mid-path ruling \| before \| after at u .425 | `.scratch/entry-fix/midpath/compare-u0_425.png` (attached) |
| Owner entry ruling (blue lines + red no-go) | [`entry-fix/owner-entry-path-ruling-2026-09-23.png`](entry-fix/owner-entry-path-ruling-2026-09-23.png) (attached) |
| Six canonical stops, a4f1fdd build, captured 2026-09-24 | [`astra-rereview/captures/`](astra-rereview/captures/) (attached) |
| Per-stop telemetry (u, frame, draw calls, triangles) | [`astra-rereview/captures/captures.json`](astra-rereview/captures/captures.json) |
| Before/after + pixel-diff stats (0% at u .05/.95) | `.scratch/entry-fix/midpath/{before,after}/`, `pixdiff.json` |
| Mid-path execution + review record | [`20-mid-path-execution.md`](20-mid-path-execution.md) |
| Duct record: measurements, scripts, gates | [`15-duct-reconstruction.md`](15-duct-reconstruction.md) |
| Airflow beat record | [`13-handoff-2026-09-16.md`](13-handoff-2026-09-16.md) |

Diff to read: `git diff fe8ca64..a4f1fdd -- src` (GLB unchanged this range; binary history
covered by §2 renders).

## Machine state at this packet (a4f1fdd, captured 2026-09-24 from the served dist)

    typecheck 0 · vitest 10 files / 97 tests / 0 failed (8 src files / 91 tests)
    draw calls 99–103 across six stops (budget 150) · triangles ~1.173 M (+5k, sampling)
    console errors 0 at all stops · verify-jg033-ribbon-clipping 17,222 / 0 / 0 px
    before/after pixel-diff: 0.000% at u .05/.95; 0.56–1.9% mid stops, duct-corridor only

## Caveats the reviewer should know

- **`verify-jg032-station2-thermal.mjs` cannot run to completion** on any build including
  clean HEAD (pre-existing **JG-034** opening-scene bug). Its airway-uniform assertion
  passes; the stale panel RED at `:462` is deliberately untouched.
- **The legacy main-page Station 2 changed shape** (shared airway volume,
  `AirflowField.tsx` derives its particle route from the same asset).
- **JG-033 is still not integrated into the main page** — judge `?study=rl300`, not the
  main page.
- Verify by runtime telemetry, never vision alone — the scene is dark and vision
  confabulates on it (house rule).
