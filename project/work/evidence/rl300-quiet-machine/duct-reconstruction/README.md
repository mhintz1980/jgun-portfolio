# DUCT_INTAKE_AIRWAY reconstruction — owner's annotated CAD screenshots

Re-sent by the owner 2026-09-22 (screenshots taken 2026-09-16 in Blender) and saved to disk
here, closing the gap flagged in [`../13-handoff-2026-09-16.md`](../13-handoff-2026-09-16.md)
§3 (the originals lived only in a lost session transcript).

## What each image says

- `green-target-vs-orange-current-angle-a.png` / `-b.png` (19:14 / 19:15) — two near-identical
  angles, text overlay: **"edit the duct object to occupy this area highlighted in green."**
  - **Green outline** = required duct volume: hugs the slanted intake face
    (`GRRL200-SAF-1172-1`), runs aft across under the ceiling, then turns **down** at the aft
    end following the actual sheet metal, ending above the pump region.
  - **Orange outline** = the current `DUCT_INTAKE_AIRWAY` volume: overshoots **downward**
    (its translucent box hangs past the green region's lower-aft edge, over the pump area)
    and carries the **wrong aft edge**. The handoff's "remove the aft edge" instruction reads
    directly as the green-minus-orange difference; no separate red-marked image was re-sent.
- `flow-route-arrows-V2RL300-SAF-1171-1.png` (14:40, Blender header names
  `V2RL300-SAF-1171-1`) — blue arrows = the authoritative flow route: in through the hex
  intake openings → up the slanted face → aft along the ceiling corridor → **down** the
  vertical face of the orange-highlighted `V2RL300-SAF-1171-1` → U-turn back toward +z under
  its bottom angled lip → aft and down to the engine. Matches the measured route in handoff
  §2 (canopy seal forces the turn-down).

## Intent

The airway volume should become the *real* corridor between the intake screen and the point
where the `V2RL300-SAF-1171-1` canopy forces the flow down, so `SPINES.main` in
`src/scene/rl300/flow.ts` can be snapped to the volume instead of hand-authored. Known
deltas to apply at snap time: the turn-down moves from z 0.62 to the canopy leading edge
**z 0.564**; entry waypoint stays outboard of the panel; tail to the engine stays below the
volume.
