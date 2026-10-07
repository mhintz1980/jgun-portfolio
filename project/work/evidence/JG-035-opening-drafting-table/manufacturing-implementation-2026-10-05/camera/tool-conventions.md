# G0 tool convention registry

Status (updated 2026-10-06): the candidates below remain the original 2026-10-05 illustrative registry, preserved for chronology. C1 is closed and complete swept separation is certified in clearance-v4/report.json (verdict CERTIFIED, 24/24 pairs against the combined error budget; independent DeepSeek re-review SHIP); the certified study hob supersedes the candidate dimensions in the hob section (supersede note below). Source geometry is accepted and read-only. This document still does not establish production tooling, machining history, strength or FEA results.

## Datum and dimension types

`blockout.py` reads the approved `shifted/input-shaft-assembly-parts-v1.blend` directly and hashes all six approved baseline files before rendering. All named source meshes have identity transforms in the shaft-local Blender frame: metres, shaft axis +Y. The saved `shaft_world_matrix.json` relates this local frame to original Blender assembly coordinates; its translation is not added to this local study. There is no GLB import/export conversion in the blockout, and no support displacement is added. Camera coordinates are in local metres. Proposed runtime registration must use the geometry worker's exporter proof; do not treat these Blender coordinates as already registered Three.js world coordinates.

| Quantity | Type and datum | Status |
|---|---|---|
| 6.0 mm | Radius of authored **tooth-space construction arc**, in radial/axial section | Accepted source-report parameter; NOT production hob OD/radius/clearance |
| 6.35 mm | Axial functional face length, y = 3.1748584 to 9.5248584 mm | Source report; actual endpoint/mesh correspondence belongs to assets measurement |
| 4.539089731 mm | Axial projection of construction lead-out | Source report; NOT tool travel allowance |
| 14.063948132 mm | Construction arc endpoint Y | Source report; NOT interchangeable with informal 13.79 mm floor-exit prose |
| 6.083313213 mm | Tooth-tip radial coordinate, not a pitch radius | Source report |
| 4.297858358 mm | Tooth-space root radial coordinate | Source report |
| +2.750 mm | Bearing/ring rigid displacement along shaft-local Y | Re-measured source vertices: bearing +2.750000101, ring +2.749999985 mm, zero X/Z. Max residual 0.0000009165 mm. This residual is numerical evidence, NOT combined export/manufacturing uncertainty. |

The source build restores material and cuts a polygonal tooth-space sweep; it does not simulate an entire rotating hob. Its computed endpoint cannot certify the rotary representation used here. Actual machining stock/progression belongs to G2: these blockout stills show final CAD solely for framing. Do not ship them as evidence of progressive tooth formation.

## Signed shaper convention

Disc/pinion family; tool and work axes both +Y, tool centre on +Z side of shaft. Positive angle is right-hand about each +Y axis. External rolling pitch contact is work +Z and cutter -Z. Accordingly `v_work,X = r_work * omega_work`, `v_cutter,X = -r_cutter * omega_cutter`. Equal tangential velocities require `omega_work = -(z_cutter / z_work) * omega_cutter`.

Candidate: work z = 10 (accepted story; assets owns independent tooth census); cutter z = 20; **illustrative** module 1 mm, work pitch diameter 10 mm and cutter pitch diameter 20 mm. Signed work/cutter ratio **-2**. The source tip radius does not determine module or pitch diameter; actual pressure angle/profile shift remain unresolved. The prop is a deliberately bounded toothed disc silhouette, not an authenticated involute/rake cutter. Body tip diameter 22 mm, root diameter 17.5 mm and axial body thickness 1.2 mm are distinct illustrative dimensions.

Radial infeed toward -Z, cutting stroke +Y toward the legacy relief, relieved return -Y after an illustrative +0.8 mm Z backoff. Proposed leading-edge Y span 2.6748584 to 10.9248584 mm; centre span 2.0748584 to 10.3248584 mm. The pictured exit body trailing edge is at Y 9.7248584 mm, 0.2 mm beyond report face end. That **axial projected** gap does not prove clearance to the journal, groove or return path. Full radial centre range 15 to 18 mm, including entry/infeed/retraction, and conservative full-rotation prop hull are recorded in `blockout.json`.

`compose_and_verify.py` independently evaluates signed pitch velocities, producing residual 0 m/s at a numerical tolerance of 1e-12 m/s for this candidate. This checks sign algebra, not CAD-flank engagement. Negative cutter rotation swaps the work sign accordingly; do not reuse narrative display-turn ratios.

## Signed hob convention

Candidate: **RH one-start**, ten interrupted flutes, illustrative normal module 1 mm, pitch diameter 7 mm, tip diameter 8 mm and body length 16 mm along the hob axis. For an illustrative spur workpiece: `sin(gamma) = starts * normal_module / pitch_diameter`; `gamma = asin(1/7) = 8.2132107 degrees`; axial lead `L = pi * d_pitch * tan(gamma)`, approximately 3.17349 mm. This lead is along the tool axis. It is not the shaft's lead-out length. Setting angle tilts tool axis from +X toward +Y by +gamma: `a = [cos(gamma), sin(gamma), 0]`. Production helix/setting/profile compatibility is unresolved.

Superseded 2026-10-06 for the study: clearance-v4/report.json certifies a single-start module-1 hob of R 5.87 mm, lead angle 5.5587 deg, stop yc 9.5249 mm, centre distance 10.1618 mm, collar radius 6.87 mm, arbor radius 4.37 mm and length 16 mm, reproducing the approved ramp floor to max 0.0048616 mm (rms 0.0036270 mm, 426 stations). The candidate pitch/tip diameters and 8.2132107 deg setting angle above are retained only as the superseded 2026-10-05 candidate.

The rendered RH crest obeys `s = L * phi/(2*pi) + constant` about that axis, with the radial basis `b = [-sin(gamma), cos(gamma), 0]` and second radial basis +Z. At the shaft's +Z contact side the tool contact is its -Z side. For positive right-hand hob rotation, crest motion at contact has X velocity `-r_hob_pitch * sin(gamma) * omega_hob = -normal_module/2 * omega_hob`. Work velocity is `r_work * omega_work`, requiring `omega_work = -(starts / z_work) * omega_hob = -0.1 * omega_hob`. This sign depends on the stated hand, axis direction and contact side; flipping any of them requires re-derivation.

The independent analytic residual is 0 m/s at 1e-12 m/s tolerance. Full axis-tilted rotational outer hull, +Y feed and +Z withdrawal are recorded explicitly. Candidate centre feed Y 3.1748584 to 9.5248584 mm is an illustrative path proposal; the final feed **centre** is not the source construction arc endpoint. No compatible finished-leadout claim follows from it. Holder/arbor geometry, exact gash/rake, real starts/OD, swept minimum separation and combined measurement/export uncertainty remain unresolved. Rotating the silhouette does not prove it generates the accepted profile.

## Manufacturer evidence, read live 2026-10-05

- [Gleason shaping tools](https://www.gleason.com/en/products/tools/cylindrical/shaping/shaping-tools): shaping tool family/access context, not this tool's tooth count or physical dimensions.
- [Liebherr shaping machines](https://www.liebherr.com/en-us/gear-technology-and-automation-systems/lvt/gear-technique/gear-cutting-machines/gear-shaping-machines/vta_gear_shaping_machines-6442289): axial head slide and stroke-driven shaping family. Machine catalogue limits are not assigned to this shaft.
- [Nidec starts and flutes criteria](https://www.nidec.com/en/machine-tool/knowledge/column/cutting-tool/cutting-tool-hob-04/): low tooth-count finishing criteria support a one-start, ten-flute candidate. They do not select its diameter or certify a production setup.
- [Nidec effective hob length](https://www.nidec.com/en/machine-tool/knowledge/column/cutting-tool/cutting-tool-hob-02/): effective length depends on work/tool dimensions, lead, setting and method. An arc radius alone is insufficient.
- [Liebherr LC 180-280 axes](https://www.liebherr.com/en-in/gear-technology-and-automation-systems/gear-technique/gear-cutting-machines/gear-hobbing-machines/pdpe/lc-180-280-4142861): separate tool/work rotation, radial feed, axial travel and swivel.
- [Gleason hobs and milling cutters](https://www.gleason.com/en/products/tools/cylindrical/hobbing-and-milling/hobs-and-milling-cutters): distinct generating hob and milling-tool families.
- Blender installed API `bpy_extras.object_utils.world_to_camera_view` is used for projection. Official API search found the matching documentation, but direct page fetch failed; implementation is verified against the installed Blender 5.2.2 API and successful projections. No claim of successfully reading the remote API page.

Signed conventions and pitch/lead formulas above are explicit analytical inferences under the stated illustrative datum, independently checked by the script. Manufacturer pages substantiate process/tool families and selection constraints; they do not supply these signed axis formulas for this workpiece.

## Choreography blockers and camera contract

The static orthographic cameras are G0 framing anchors, not runtime camera flight. CameraRig remains sole future writer. Geometry stays shaft-local; a rotating-reference camera proposal follows absolute work azimuth during overview, eases its follow weight to zero before cutter exit, and holds machine-frame framing throughout a >=1.2 s exit/return interval including >=0.4 s clear event. Dolly/FOV progress belongs to the master playhead, separately from slowed machining phase. G4 must prove continuous projected axis/edge/chip registration, direct seek/reverse and no independent clock/damping. No such motion proof is claimed here.

At a 30 fps lite floor, provisional observable display limits are stroke repetition <=7.5 Hz and ten-flute hob rotation <=0.75 rev/s (45 rpm display). A candidate 0.5 rev/s yields 5 Hz flute repetition. These are editorial anti-strobing proposals, not production rates or observed frame-rate proof. All physical speeds and readable-motion acceptance remain unresolved.

The complete represented mesh is never accepted through a crop. Conservative swept hull bounds are measured/analytic candidate extents only; minimum separation and combined uncertainty are null and **BLOCK machining choreography acceptance**. Next mechanical check must include actual stock engagement, whole represented body through infeed/cutting/return/withdrawal, and every retained neighbour, then compare positive separation to combined error. Either establish a compatible illustrative profile/path or report collision and revise the illustrative tool, preserving the accepted shaft. Toolholder realism remains separately unresolved.

Update 2026-10-06: the blocker above is resolved by clearance-v4/report.json (verdict CERTIFIED, 24/24 pairs). The meridian check covers actual stock engagement, the whole represented body through infeed/cutting/return/withdrawal and every retained neighbour against the combined error budget: must-clear pairs satisfy d - e_total >= 0.020 mm, and the two generation-exit contact pairs at the approved ramp end (y ~ 13.77-13.78) hold |penetration| <= e_total within 0.1 mm of the measured ramp end 13.750 mm. This certifies the illustrative choreography envelope within sampled limits only; production tooling and toolholder realism remain unresolved as before.
