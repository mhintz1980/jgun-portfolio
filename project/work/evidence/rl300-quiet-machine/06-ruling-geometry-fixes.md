# JG-033 — Milestone-2 owner ruling and the geometry corrections it required

**Ruling 2026-09-11 (Mark), on the Milestone-2 review build:** direction and look accepted
("I like the look of everything"); **geometry rejected** on three counts, with parts named.
No publication authorized. Milestone 3 still gated on a re-review of this corrected build.

## What the owner reported

1. **Missing from the entire animation:** `V2RL300-SAF-RES-1020-SAFE-1`, `RL300-PEM-1001-1`,
   `RL300-EMG-1001-P-1`.
2. **Shown after the cross-section animation, should be hidden:** `MirrorRL200-AFS-2001-2`,
   `RL300-AFS-2003-5`, `V23028T25_Weld-on Tie-Down Ring-1`, `V23028T25_Weld-on Tie-Down Ring-2`,
   `V2RL300-WO-NP-SAFE-1`, `V2EDW-60335 (Fuel Tank Weld On Flange)-1`, `V2SKF-TB-2200-01-1`.
3. **Should be sectioned, was not:** both `V2SKF-TB-5500-03`.

## Root cause

`SECTION_ROOTS` in `src/scene/rl300/prepareModel.ts` listed 5 of the GLB's 7 roots, so
`PUMP_HOUSING` (144 mesh nodes) and `ISOLATION_MOUNTS` (6) were never assigned
`clippingPlanes` — 150 of 548 mesh nodes rendered whole through the cut. Measured world-x
bounds (clip keeps `x ≤ plane.constant`, sweeping +0.85 → −0.15 across a model spanning
x ±0.800) confirm every reported part:

| Part | Root | world x | Reported as |
|---|---|---|---|
| MirrorRL200-AFS-2001-2 | PUMP_HOUSING | 0.602 … 0.677 | shown, should hide |
| RL300-AFS-2003-5 | PUMP_HOUSING | 0.579 … 0.677 | shown, should hide |
| V23028T25_Weld-on Tie-Down Ring-1 / -2 | PUMP_HOUSING | 0.683 … 0.800 | shown, should hide |
| V2RL300-WO-NP-SAFE-1 | PUMP_HOUSING | 0.686 … 0.689 | shown, should hide |
| V2EDW-60335 (Fuel Tank Weld On Flange)-1 | PUMP_HOUSING | 0.545 … 0.623 | shown, should hide |
| V2SKF-TB-2200-01-1 | PUMP_HOUSING | 0.686 … 0.698 | shown, should hide |
| V2SKF-TB-5500-03-1 / -2 | PUMP_HOUSING | −0.673 … 0.673 | should be sectioned |
| V2RL300-SAF-RES-1020-SAFE-1 | COMPOSITE_PANELS | 0.293 … 0.512 | missing |
| RL300-PEM-1001-1 | ENCLOSURE_CHASSIS | −0.508 … 0.508 | missing |
| RL300-EMG-1001-P-1 | ENCLOSURE_CHASSIS | −0.507 … 0.509 | missing |

The three missing parts had a second cause: all three carry `MSP_YELLOW_PAINT` inside a shell
root, so `finishFor` repainted them shell blue and merged them into the shell batch. Equipment
that is painted the wall's colour and then partly cut away does not read as present.

## Correction (owner-ruled approach: per-part policy map)

`PART_POLICY` in `prepareModel.ts` now names each ruled CAD occurrence with one of three
policies, and a named part overrides its root:

- **`keep`** — never clipped, and never repainted to shell blue; renders as intact equipment
  inside the open section. Applied to the three missing parts.
- **`hide`** — must not be visible once the section is open. Parts the finished cut already
  reaches are clipped, so they still dress the closed exterior; any part on the near side of the
  finished plane is dropped from the model outright, because clipping can never remove it.
- **`section`** — clipped; the cut face is the point. Applied to both `V2SKF-TB-5500-03`.

### Second ruling pass, same day

Reviewing the corrected build, the owner named eight more occurrences still visible in the open
section: `V2MSP-MID-5406HHP24 ~-1`, `V2MSP-MID-5406HHP24 ~-3`, `V2SKF-TB-2200-01-2`,
`V2SKF-TB-2250-01-1`, `V2SKF-TB-2250-01-2`, `ISO_MOUNT_4`, `ISO_MOUNT_5`, `ISO_MOUNT_6`. All
eight are `PUMP_HOUSING`/`ISOLATION_MOUNTS` occurrences at x ≥ −0.006, so the finished cut
reaches every one and clipping removes them; none needed dropping. Their unnamed mirror twins on
the far side (`~-2`, `~-4`, `V2SKF-TB-2200-01-3/-4`, `ISO_MOUNT_1/2/3`) were not ruled and are
left alone. `hide` is now 15 occurrences; the ruled set is 20.

### Third ruling pass, same day

`V2EDW-60335 (Fuel Tank Weld On Flange)-2` (x 0.498 … 0.568) and the fuel neck beside it,
`V2WISC-4770-7-1` (x 0.479 … 0.587), ruled `hide`; the cut reaches both.

`12335A81_Oil-Resistant Push-on Seal with Bulb-1` was ruled out of the assembly entirely —
owner: *"not supposed to be there technically"* — which no clipping policy can express, so a
fourth policy **`delete`** was added: the geometry is never built, at any progress, closed
exterior included. It is reserved for parts that do not belong in the machine, not for dressing
we merely do not want on screen. 460 triangles, the only removal in the build.

Ruled set is now 23: 3 `keep`, 17 `hide`, 1 `delete`, 2 `section`. The standing
`sourceTriangles − keptTriangles` contract in the verify script was deliberately updated from
`108 + 28` to `108 + 28 + removedTriangles`, with `removedTriangles` pinned at exactly 460 so an
unintended removal still fails the gate.

### Fourth ruling pass — the stale screenshot

The owner reported `V2EDW-60335 (Fuel Tank Weld On Flange)-2`, `-3` and `V2WISC-4770-7-1`
still visible after the cross-section — from a **screenshot captured before the third pass
had been built** (the live `:4173` port, hash-matched to `dist`, already hid `-2` and the
fuel neck). Only `-3` (x 0.550 … 0.619, co-located with `-1`) was genuinely unruled, and as a
`PUMP_HOUSING` occurrence it rendered whole through the cut; it joined `PART_POLICY` as
`hide`. Ruled set is now **24: 3 `keep`, 18 `hide`, 1 `delete`, 2 `section`**. Gates re-run
with posters regenerated: 24/24 PASS, removals still exactly the 460-triangle seal.
Same-frame evidence: `output/review/jg033-fuel-flange/region-1-before-after.png`
(staged pre-pass-3 poster vs the current build, identical u=0.52 desktop hold).

**Far-side twins ruled to stay (owner, same day):** asked whether the unnamed mirror twins on
the kept half (`V2EDW-60335 -4/-5`, `V2SKF-TB-2200-01-3/-4`, `ISO_MOUNT_1/2/3`,
`V2MSP-MID-5406HHP24 ~-2/~-4`) should also go, the owner ruled "leave everything how it was
except for one part" — the straggler he could still see, narrowed to `-3` or `~-3`. Both
verify hidden at the finished cut in the corrected build (`-3` fixed above; `~-3` hidden since
the second pass, x 0.560 … 0.608), so the sighting traced to the same stale screenshot. The
twins render on the kept half by design and are not to be hidden.

### Owner verification and the pump-end discovery (same day, evening)

The owner confirmed on the live corrected build that the straggler flange is gone. His earlier
"refreshed and still there" trace is consistent with browser-held stale content: the served
HTML hash matched `dist` before he refreshed, and the un-hashed poster PNGs
(`/images/rl300-*-preview.png`) are the other cache trap — a context-lost fallback shows the
old machine no matter how often the page reloads.

Separately he found the **pump end is missing from the source itself** — absent from his
exported assembly too, so it was never in the enclosure export. The GLB inventory agrees:
`PUMP_HOUSING` holds 117 unique base names and nothing resembling a pump end/volute beyond the
`RLP-DC-2200-A … Coupling Cover, Face Plate` pair. Not a section-policy defect: unnamed
`PUMP_HOUSING` geometry is `keep` by default and never clipped, so no ruled or default policy
could have cut it. He will export the pump end from Onshape; placing it in the scene is
follow-up work outside the ruling set.

`SECTION_ROOTS` stays the five shell roots. `PUMP_HOUSING` and `ISOLATION_MOUNTS` are
deliberately **not** cut wholesale: a first attempt that clipped all seven roots satisfied the
letter of the ruling but cut the engine and pump volute away with it, gutting the accepted look.
Only the named occurrences inside those roots are cut.

Name matching runs through `sanitizeName`, mirroring `PropertyBinding.sanitizeNodeName`:
GLTFLoader rewrites `V2EDW-60335 (Fuel Tank Weld On Flange)-1` to
`V2EDW-60335_(Fuel_Tank_Weld_On_Flange)-1`, so the CAD names as the owner wrote them never
appear in the scene verbatim. `prepareModel` throws if any ruled occurrence is absent from the
source, so a future asset re-export cannot silently drop one.

## Verification

`scripts/verify-jg033-preview.mjs` restates the ruling independently of the implementation and
asserts, per named occurrence, in all four viewport/tier passes: present with non-zero geometry,
correct policy, `keep` unclipped **and** unrepainted, `hide` gone at the finished cut (either `xMin > −0.15`
or dropped outright), `section` straddling `−0.15`. Results in
`output/playwright/quiet-machine/report.json` → `checks.ruledParts`.

- 24/24 ruled occurrences PASS (re-run after the fourth pass, posters regenerated). `npm run typecheck`, `npm test` (55 tests, 7 RL300), `npm run build`, `npm run check:station2`: PASS.
- 1440×900, 768×1024, 390×844 full and 390×844 lite: 0 page errors, 0 console errors.
- Forward/reverse still pixel-identical; caps still bounded; closed exterior still free of stray caps.
- Closed exterior vs the pre-ruling build: 465 px changed (0.06%, mean channel delta 0.054) —
  antialiasing from the finer material batching, no silhouette change. Section view: 3.4% changed,
  all inside the cut region.
- Batching is now keyed on `root/material/clipped/colour`, so the section hold costs
  **94 draw calls full / 57 lite** (27 batches), up from 80 / 47 (21 batches). Both stay inside
  the 150 / 90 budgets. That is the price of per-part policy; buckets sharing a material *and* a
  clip state could be merged after the policy decision if it needs winning back.

## What this does not settle

Machine gates prove the ruled parts are present, cut, or removed as ruled. They do not prove the
corrected section *reads* well — that is the owner's call on the re-review. Everything listed as
outstanding in `05-milestone2-preview.md` (composer stencil target, lite geometry budget, real
mobile GPU, JG-032 contract migration, full seven-shot sequence) remains outstanding.
