# G0 tool clearance v4 (meridian method): CERTIFIED, 24/24 pairs

Command (repo root; read-only on CAD, writes only this folder):
& "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" -b --factory-startup --python-exit-code 1 --python scripts/manufacturing/tool_clearance_meridian.py

Final line: G0_CLEARANCE_V4 CERTIFIED pairs=24 fail=0. Determinism: report-run1.json vs report.json identical except generated_utc. Blend SHA-256 88d1ce4a... checked before and after.

Supersedes clearance-v3 (invalid: cutter polar profile collapsed to radius 0 so e_tool = 2.749 mm; hob fed from the journal side; contact pairs passed on that tolerance).

## Method
Both shafts rotate while machined, so every non-generated feature is a surface of revolution for clearance purposes. Exact plane sections every 0.01 mm (offset 0.23 um off vertices) give r_outer(y) (max section radius; conservative neighbour max) and r_min(y) (tooth-space floor). Clearance is the 2D distance in the meridian half-plane. One empty legacy station at a seam (y 11.43) was filled from neighbours and is counted in facts.

Zones are derived from geometry. Generated band: tooth spaces deeper than 0.03 mm (3x the measured 0.0101 mm chord sag). Turned stock: material above the 6.074 mm filler OD between ramp end and journal; the legacy shaft has the same cone 2.75 mm earlier, so it is turned, not hob-generated. Junction: vanishing tooth spaces between measured ramp end and the turned cone, where the hob is generating floor. Every zone is asserted non-empty and the measured ramp end must lie within 0.1 mm of 13.78.

Shaper on the legacy grooved blank: N=20 disc cutter, signed ratio -2, centre distance 15.5 mm, tip radius 11.2032 mm (near edge at root + 5 um), thickness 1.2 mm; hub r8, clamp nut r9, arbor r7 trailing. Cutting stroke +Y toward the groove, leading face 0.5 mm past the last tooth material (y 9.875), 0.565 mm short of the groove wall (y 10.94). Return stroke backed off 2.0 mm. Generating fit is from camera/profile-study (MATCHED_SHAPER).

Hob on the revised smooth blank: single start, normal module 1, tilted to its lead angle asin(m/d) = 5.559 deg; R = 5.87 mm and stop yc = 9.5249 fitted so its swept envelope reproduces the approved ramp floor within 0.0049 mm (426 stations; overcut only). Path: radial infeed at yc -4.195, feed +Y at full depth, retract 2.5 mm radially, withdraw -Y.

## Error budget
e_cad = 0.002 decode + 0.0043 measured constancy on nominally constant features (journal, tips, root). e_profile = 0.005 (half station). Hob sampling half-diagonal 0.0112; path step 0.025. Junction-vs-floor pairs add the 0.0101 mm chord sag because r_min samples chord midpoints.

## Key results (d = min distance; e = error budget; must-clear requires d - e >= 0.02)
- Hob final vs approved journal side (y >= 14.18): d 0.1187, e 0.0225. Turned cone: 0.0950, e 0.0225. Path vs journal side and cone: 0.0950, e 0.0657.
- Hob vs approved floor at the ramp-end junction: -0.0031 (generation contact), e 0.0327, located within 0.1 mm of the measured ramp end. Through retract: -0.0012, e 0.0758.
- Shaper cutting vs groove floor/wall: 0.130; return vs blank OD: 0.213; infeed: 1.908; holders >= 0.416 (e 0.0163).
- Shaper at the groove lip (root boundary): 0.022, e 0.0163, criterion d - e >= 0.

## Response to the DeepSeek FIX-FIRST review (independent-review-deepseek.md)
- HIGH groove-edge skim: now a must-not-interfere pair, "generated root boundary", with criterion d - e >= 0 (no extra 0.02 margin). Justification: the cutter tip runs at root + 5 um stock along the generated root cylinder; the lip is where that cylinder ends. Result 0.022 - 0.0163 = +0.0057.
- HIGH transition penetration: zones re-derived from geometry (above). The turned cone is must-clear and passes with 0.095; the residual contact is in the junction where the hob generates floor, measured against the approved floor with chord sag added.
- MED e_cad: measured constancy added (0.0043).
- MED backoff: the 2.0 mm relief remains a deliberate legibility exaggeration of the relieved return. A realistic relief stays meshed in the cut tooth space and clears by backlash, which this revolution-envelope method cannot certify; the animation therefore depicts the exaggerated relief that is certified.
- LOW lead angle: changed to asin(m_n/d) (5.559 deg); refit R 5.87.

## Response to the DeepSeek re-review (independent-rereview-deepseek.md, SHIP with residual items)
- Empty-mask vacuous PASS (LOW): fixed. rect_clearance asserts that not every station is excluded, meridian_clearance asserts a non-empty keep mask, and the shaper generation/edge bands are asserted non-empty. Rerun: CERTIFIED 24/24, report identical to report-run1.json except generated_utc.
- Lead angle (LOW): kept. A hob's lead angle is defined on its pitch cylinder: sin(g) = z0 * m_n / d_pitch with d_pitch = 2 * (R_outside - addendum). The addendum used here equals the work dedendum (5.0 - 4.2918 = 0.708 mm), so d_pitch = 10.32 mm and g = 5.559 deg. The reviewer's sin(g) = m_n / (2R) uses the outside diameter.
- "~31 um land overlap" below the measured ramp end (MED): this is cutting, not interference. At y 13.76 the stations still contain tooth spaces, so r_outer there is the filler tip OD that the hob passes between; the governing surface is the tooth-space floor r_min, against which the junction pair is measured (-0.0031, within e 0.0327). The turned cone above the filler OD (y >= 13.94) is must-clear against r_outer and passes with 0.095 mm.

## Not claimed
No production tooling specification exists; these are illustrative tools compatible with the accepted geometry. The shaper flank conjugacy is a feasibility fit (profile-study), not a Euclidean certification. CAD chord error beyond the measured constancy and sag terms is unknown.
