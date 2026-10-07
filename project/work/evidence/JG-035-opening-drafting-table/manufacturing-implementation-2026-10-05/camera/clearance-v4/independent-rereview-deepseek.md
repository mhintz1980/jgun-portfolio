## Verdict: SHIP (3 residual MED/LOW items, none flips a pair)

**Prior findings**

1. **HIGH groove-edge relabel — RESOLVED.** New pair `shaper_cutter_cut_vs_groove_lip_root_boundary` ([tool_clearance_meridian.py:251-252](/C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/scripts/manufacturing/tool_clearance_meridian.py:251)); report pair 2 d=0.0220, e=0.0163, criterion d−e≥0 (py:449-450). Genuine positive clearance, no longer a vacuous contact. Margin 0.0057 is below MARGIN 0.02, disclosed.
2. **HIGH transition penetration — RESOLVED.** Zones re-derived from geometry with per-zone non-empty asserts (py:357-372); turned cone 13.94-14.17 is must-clear against `app_rd`, d=0.095, e=0.0225. The turned claim is independently true: legacy cone base 11.19 mm vs approved 13.94 mm = the 2.75 mm shift (verified from `profiles.npz`). Residual −0.0031 sits in the ramp-end junction, contact within e.
3. **MED e_cad — RESOLVED.** E_CONSTANCY (py:200-208)=0.0043; e_cad=0.0063 (report `error_budget_mm`).
4. **MED backoff — RESOLVED (documented).** 2.0 mm stays a disclosed legibility relief (README response).
5. **LOW lead angle — NOT RESOLVED.** py:295 computes asin(1/(2(R−(5.0−ROOT_R))))=5.5587°. The standard single-start relation sin γ = m_n/(2R) gives 4.886° for R=5.87, and README's "asin(m/d)" implies d=10.32 ≠ 2R=11.74. Formula remains nonstandard (0.67° off), absorbed only because R is a free fit.

**New defects**

- **MED (junction floor comparison, py:411-412/378).** The pair compares the hob to `app_floor`=r_min only. I reproduced the envelope: at y=13.76 it is 6.0434, i.e. **30.6 µm inside `r_outer` 6.0740**, exceeding e_hob 22.5 µm (report shows only −0.0031 vs the floor). It is excused because 13.76 ≤ nominal ramp end 13.78 and the turned cone (13.94+) *is* checked against r_outer and passes — so no turned-stock interference is hidden. But up to ~31 µm of land interference is waived under the generation label on a boundary set by the arbitrary `app_ro > FILLER_R+0.01` (py:361); if the ramp truly ends at the measured 13.75, this pair fails.
- **LOW (empty/wrong mask).** `meridian_clearance` returns `rho−win` (~+6 mm, false PASS) when `keep` is all-False (py:332-334); `edge_band` (py:228) is unasserted, unlike zones (py:370-372), and `rect_clearance` with `exclude=~edge_band` returns inf on an empty band (py:213-224) → vacuous PASS. Latent only; edge_band is non-empty (9.88-9.95) here.

All 24 pairs PASS; `report.json`==`report-run1.json` (ignoring UTC); blend SHA stable.