# JG-033 handoff for Astra — Milestone 2 ruled, geometry corrected, Milestone 3 is yours

Written 2026-09-11 by the session that took Mark's Milestone-2 ruling. Read
[`06-ruling-geometry-fixes.md`](06-ruling-geometry-fixes.md) for the full record; this file is
the short version plus what you need to know before you start Milestone 3.

## Where your work stopped

You finished Milestone 2 and staged it — 21 files, 2,587 insertions — but the branch
`codex/jg033-signature-shot` has **zero commits**. Everything is still in the index, worktree
clean at the point you stopped. Nothing was half-written; `git add` was the last thing that ran.

## What Mark ruled

**Look ACCEPTED** — "I like the look of everything." **Geometry REJECTED**, across four passes
on the same day, naming 24 CAD occurrences. No publication authorized. Milestone 3 is still
gated on his re-review of the corrected build.

## What was wrong, and why it matters to your next milestone

`SECTION_ROOTS` in `prepareModel.ts` listed **5 of the GLB's 7 roots**. `PUMP_HOUSING` (144 mesh
nodes) and `ISOLATION_MOUNTS` (6) never got `clippingPlanes`, so 150 of 548 mesh nodes rendered
whole through the cut — that is every "should be hidden" part Mark listed. The three parts
"missing from the entire animation" had a second cause: they carry `MSP_YELLOW_PAINT` inside a
shell root, so `finishFor` repainted them shell blue and merged them into the shell batch.
Equipment painted the wall's colour and then partly cut away does not read as present.

The lesson worth carrying: **a root is the wrong unit for section decisions.** The GLB's roots
are assembly groupings, not visual roles. The camera side of the machine holds hardware that
belongs to the same root as the equipment you want to show.

## What replaced it

`PART_POLICY` in `src/scene/rl300/prepareModel.ts` — a per-occurrence map, four policies, a
named part always overriding its root:

| Policy | Behaviour | Count |
|---|---|---|
| `keep` | never clipped, never repainted to shell blue; intact equipment inside the open section | 3 |
| `hide` | must not be visible once the section is open; clipped when the finished cut reaches it, dropped outright when it does not | 18 |
| `delete` | never built, at any progress, closed exterior included — for parts ruled out of the assembly | 1 |
| `section` | clipped; the cut face is the point (default for anything unnamed in a shell root) | 2 |

`SECTION_ROOTS` stays the five shell roots. **Do not "fix" this by clipping all seven** — I tried
it first. It satisfies the letter of the ruling and guts the accepted look: the engine and pump
volute get cut away with the clutter, and the section goes hollow. The engine and pump are the
story. Only named occurrences inside those roots are cut.

Name matching runs through `sanitizeName`, mirroring three's `PropertyBinding.sanitizeNodeName`.
GLTFLoader rewrites spaces to underscores and strips `[ ] . : /`, so
`V2EDW-60335 (Fuel Tank Weld On Flange)-1` reaches the scene as
`V2EDW-60335_(Fuel_Tank_Weld_On_Flange)-1`. The CAD names as Mark writes them never appear
verbatim. `policyFor` also matches the `name_1` primitives GLTFLoader splits multi-primitive
mesh defs into — the same defect class as JG-029.

`prepareModel` throws if a ruled occurrence is absent from the source, so a future asset
re-export cannot silently drop one.

## How to add the next ones Mark names

1. Get the exact occurrence name and its **world-x bounds**. The clip keeps `x ≤ plane.constant`,
   sweeping +0.85 → −0.15 across a model spanning x ±0.800. `FINISHED_CUT` is derived from
   `evaluateShot(1, false).plane`, so it tracks the shot if you retime the sweep.
2. Add it to `PART_POLICY` with the right policy. For `hide`, the code decides clip-vs-drop from
   the bounds; you do not classify the side by hand.
3. Add it to the `RULING` block in `scripts/verify-jg033-preview.mjs`. That block deliberately
   **restates Mark's ruling independently of the implementation** — do not import the policy map
   into it, or the gate stops being a check and becomes a tautology.
4. Re-run the gate. It asserts per occurrence, in all four viewport/tier passes.

## State of the gates

24/24 ruled occurrences PASS. `npm run typecheck`, `npm test` (55 tests, 7 RL300),
`npm run build`, `npm run check:station2`: PASS. 1440×900, 768×1024, 390×844 full and 390×844
lite: 0 page errors, 0 console errors. Forward/reverse still pixel-identical; caps still bounded;
closed exterior free of stray caps and unchanged within 0.06% (antialiasing from finer material
batching, no silhouette change).

**Two numbers moved and you should know why.** Batching is keyed on
`root/material/clipped/colour` now, not `root/material`, so the desktop section hold went from
**80 to 94 draw calls** (budget 150) and batches from 21 to 27. That is the cost of per-part
policy. If you need it back, merge buckets that share a material *and* a clip state after the
policy decision rather than before.

One contract was deliberately updated: the verify script asserted only the liner and airway
helper are ever omitted (`108 + 28` triangles). `delete` breaks that by design, so it now reads
`108 + 28 + removedTriangles` with `removedTriangles` pinned at exactly **460** — the ruled
push-on seal, the only removal in the build. An unintended removal still fails the gate.

## What is still yours

Milestone 3 as your plan wrote it: the seven shots, RL300-local progress, documented scroll
extension, chapter/HUD synchronisation, editorial overlay, and the specific JGUN timing
corrections. `shot.ts` is still a three-beat preview camera, not the seven-shot sequence.

Everything `05-milestone2-preview.md` left open is still open: the composer's stencil target and
MSAA resolve, production handoff, the old lite-tier cost anomaly, the 250k-triangle lite geometry
budget (lite still only cuts DPR and shadows), real mobile GPU behaviour, full accessibility
audit, complete context restoration, manufacturing collisions, and the JG-032 contract migration
(`verify-jg032-station2-thermal.mjs:462` is still stale-red at HEAD).

Two open questions for Mark, neither blocking:

- ~~The far-side mirror twins~~ **Ruled 2026-09-11: they stay.** Asked whether the unnamed
  twins on the kept half (`~-2`, `~-4`, `V2SKF-TB-2200-01-3/-4`, `ISO_MOUNT_1/2/3`,
  `V2EDW-60335 -4/-5`) should be hidden too, the owner said "leave everything how it was
  except for one part" — and that one part (`-3`, which he could not distinguish from
  `~-3` in a stale screenshot) is already fixed. Do not hide the twins; they render on the
  kept half by design. See [`06-ruling-geometry-fixes.md`](06-ruling-geometry-fixes.md).
- The machine gates prove the ruled parts are present, cut, or removed as ruled. They do not
  prove the corrected section *reads* well. That is his call, and it has not been made yet.

## New follow-up work: the pump end (owner-driven, pending his export)

The owner found the **pump end missing from the source export itself** — verified in his own
assembly, so it was never in the enclosure GLB (inventory confirms: no pump-end/volute node in
`PUMP_HOUSING`). Not a section regression; the section code cannot clip unnamed
`PUMP_HOUSING` geometry. He is exporting the missing geometry from Onshape. When it lands:
keep **Y-up** (the placement chain has no rotation anywhere — a rotated import breaks the CAD
anchors), name parts by part number before export so `PART_POLICY` can target occurrences,
Draco via gltf-transform, and never `gltfjsx --transform` on this GLB. Decide then between
folding it into the Blender assembly and re-exporting the GLB (established path;
`prepareModel` throws if a ruled occurrence goes absent, which protects all 24) versus
loading the export as a small side asset next to the machine.
