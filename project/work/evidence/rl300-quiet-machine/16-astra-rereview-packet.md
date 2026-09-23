# 16 — Astra re-review packet (2026-09-22; updated 2026-09-23)

**Standing verdict to clear:** `fix-first`. It blocks further visual-effects work on
JG-033. This packet covers **both** items it was waiting on — the airflow/heat/sound ribbon
beat *and* the duct reconstruction + spine re-snap — so a single review can rule on
the combined state.

**Reviewing at:** branch `codex/jg033-signature-shot` == `main` == `fe8ca64` (pushed).
**Look at:** `http://localhost:4173/?study=rl300` after `npm run build` + a **fresh**
preview restart (stale server + rotated hashes = the canvas never mounts).

> **UPDATE 2026-09-23 — do NOT route this packet yet.** The owner ruled on the entry
> segment of the air flow (three blue lines from screen-left around the air passage; red
> cross-out = forbidden region — annotated screenshot saved at
> [`entry-fix/owner-entry-path-ruling-2026-09-23.png`](entry-fix/owner-entry-path-ruling-2026-09-23.png)).
> The fix is queued as the FIRST task of the next session:
> [`18-handoff-2026-09-23-entry-path-fix.md`](18-handoff-2026-09-23-entry-path-fix.md).
> **Sequence: entry fix lands → re-capture the six stops → then route this packet**, with
> the fresh captures replacing/augmenting the ones below. Routing before the fix would
> put her verdict on the exact segment being retuned.

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

### 2. Duct reconstruction + spine re-snap (commit `fe8ca64`, this session)
Owner-instructed geometry from his three annotated screenshots. Full record:
[`15-duct-reconstruction.md`](15-duct-reconstruction.md).

- Airway volume: 8-sided/28 tris → **7-sided/24 tris**; web AABB min y 1.200 → **1.348**,
  z 0.431 → **0.434**. The downward overshoot over the pump is gone (**+0.148 m**).
- Turn-down moved z 0.62 → **z 0.564**, the measured canopy leading edge.
- `SPINES.main` waypoints 2–8 re-snapped. **Waypoints 7–8 had been outside the volume
  entirely** under the old geometry.
- Ribbon-fan clearance at the U-turn went **11.0 mm → 81.0 mm** against a 48 mm fan.

---

## What we want ruled on

1. **Does the air now read as going where the machine makes it go?** The route is
   in through the hex openings → up the slanted face → aft under the ceiling → **down at
   the canopy leading edge** → U-turn under the bottom lip → aft to the engine.
2. **Is the ribbon treatment right at the turn-down and the U-turn?** These are the two
   waypoints that moved most; the hairpin is tight and the fan is wide.
3. **Does the beat still read at the low-motion stops** (u .05 and .95) as well as mid-run?
4. **Does the entry segment read correctly after the 2026-09-23 owner ruling?** (Blue-line
   band from screen-left around the air passage, red-crossed region forbidden — see the
   update banner; judge this against the POST-fix captures.)
5. **Is `fix-first` cleared**, or what specifically remains?

## Evidence in this packet

| What | Where |
|---|---|
| Owner's spec screenshots (green/orange/flow arrows) | [`duct-reconstruction/`](duct-reconstruction/) |
| BEFORE/AFTER ortho section on the owner's own plane | [`duct-reconstruction/renders/`](duct-reconstruction/renders/) |
| Study captures at u = .05 .34 .51 .70 .82 .95, 1440×900 | [`duct-reconstruction/captures/`](duct-reconstruction/captures/) |
| Per-stop telemetry (u, frame, draw calls, triangles) | [`duct-reconstruction/captures/captures.json`](duct-reconstruction/captures/captures.json) |
| Duct record: measurements, scripts, gates | [`15-duct-reconstruction.md`](15-duct-reconstruction.md) |
| Airflow beat record | [`13-handoff-2026-09-16.md`](13-handoff-2026-09-16.md) |

Diff to read: `git diff f46d6bf..fe8ca64 -- src scripts` (the GLB is binary; the renders
above show what changed in it).

## Machine state at this packet

    typecheck 0 · vitest 88/88 · build ✓ · check:station2 ✓
    verify-jg033-lite-asset ✓ (555 occurrences, max transform delta 4.1e-7)
    verify-jg033-ribbon-clipping ✓ (17,222 / 0 / 0)
    verify-jg033-preview exit 0, 0 errors, all viewports
    study captures: 0 console errors, draw calls 99–103 (budget 150)

## Caveats the reviewer should know

- **`verify-jg032-station2-thermal.mjs` cannot be run to completion.** A clean `HEAD`
  worktree built from unmodified assets also times out at `__drawingProof.ready`, so it is
  blocked by the open **JG-034** opening-scene bug, not by this change. Its airway-uniform
  assertion *does* pass with the new AABB. Its pre-existing stale panel RED at `:462` is
  still open and deliberately untouched.
- **The legacy main-page Station 2 changed shape**, because `AirflowField.tsx:353` derives
  its particle route from this same shared airway volume. Code edits to those files were
  comment-only. This is the disclosed cost of a single shared asset.
- **JG-033 is still not integrated into the main page.** The blue enclosure and this
  animation live at `?study=rl300`; the main page still shows the pre-JG-033 Station 2.
  Judge the study, not the main page.
- Verify by runtime telemetry, never vision alone — the scene is dark and vision
  confabulates on it (house rule).
