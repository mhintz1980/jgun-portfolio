# Dead ROLE_OVERRIDES in the wrench rig (pre-existing)

**Filed:** 2026-09-02, out of JG-024 scope (found during its verification).
**Type:** latent defect / visual-baseline decision needed.

## Finding

`materialRoleFor(unitKey, mesh.name)` (nodeRoles.ts consolidation loop) receives
GLTFLoader's generic mesh-def names (`mesh17_mesh` — the identity invariant documented at
nodeRoles.ts:16). Every `ROLE_OVERRIDES` entry keyed on a part/node name therefore never
matches at runtime. Measured on both the pre- and post-Fine models (A/B, 2026-09-01):
the handle subtree renders only unit-default materials (`anodizedAluminum` +
lcd-screen/buttons/housing defaults); no `pcb` `#10161a`, `rotorSteel` `#7a7e82`,
`chrome`, `polymer`, or `battery` material exists anywhere in the scene.

Overrides that *appear* to work are duplicated by unit defaults (`P000420`/`P000245` →
blackOxideSteel is also the clutch-static/housing unit default; ring switch pins get the
ring-switch unit default).

## Impact

The CH.04 rear electronics stack renders dark-anodized instead of PCB green / battery /
chrome / rotor steel. Nobody has flagged it visually — the approved baseline was closed
(JG-021 §13) with this look.

**Visibility correction (owner-reported + spec-verified 2026-09-02):** the handle assembly
never disassembles — it rides rearward as one rigid unit (`EXPLODE_OFFSETS.handle −0.354`,
animation-spec §5.3) so the gearbox internals can extract. The electronics meshes named by
the override table (PCB/MCU/battery/USB) stay hidden inside the handle shell at all times;
the only handle-rear view is the assembled back face during the LCD orbit dwell
(`LCD_REVEAL_WINDOW`). The dead table's *visible* impact is therefore limited to extracted
gearbox parts (e.g., the air-motor rotor rendering generic steel instead of `rotorSteel`).

**Owner disposition (2026-09-02, same session):** KEEP the table — do not delete. It is the
dormant material vocabulary for the "handle open-up — internals reveal" nice-to-have
([upgrade-roadmap-2026-09.md](upgrade-roadmap-2026-09.md) §4 item 6): when that feature
builds, fix the plumbing (nearest real node name into `materialRoleFor`, candidate fix below)
so PCB/battery/chrome/rotorSteel/polymer finally apply to the exposed parts. Until then the
table stays dead code by design (no runtime cost beyond the no-op match loop); the roadmap's
P0 "resolve" task is removed, and JG-025 continues through unit-default roles only.

## Candidate fix (needs owner ruling first)

Pass the mesh's nearest *node* name into `materialRoleFor` (walk up to the first
non-generic ancestor name), keeping unit defaults as fallback. Restores the 2026-08-24
photoreal intent but CHANGES the approved CH.04 look — Mark should rule on
"restored material variety" vs "keep the approved dark-anodized rear" before anyone
implements it.
