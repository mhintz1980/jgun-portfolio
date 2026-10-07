**Verdict: fix first.** I read `profile_study.py`, `clearance.py`, both logs, `clearance.json`, `geometry/FINDINGS.md` and the accepted plan. I ran nothing, launched no Blender and edited no files. The numbers below come from the artifacts, plus one calculation of mine that you should re-check.

**What the evidence shows**

- `profile-study.log` ends after `PROFILE_SECTIONS`. There is no `MATCHED_SHAPER` line and no `profile-study.json`, so the inverse shaper has no result yet. The loop is about 3×10⁹ NumPy point evaluations per candidate, so it may only be slow.
- The `clearance.json` penetrations do not test the matched tools. `clearance.py` uses a hand-drawn tool (shaper: 20 teeth in a 4-of-8-segment pattern; hob: triangular ridges). Neither is derived from the measured profile, so large penetrations are expected.

**Blocking problems in `clearance.py`**

1. **Wrong shaft for the shaper.** Everything uses `SHAFT_P001835_HOBBED_NEW`. The shaper needs `SHAFT_P001835_ORIG`, whose relief groove (floor r≈4.11–4.22 at y=10.92) is what the cutter runs out into.
2. **Retained-neighbour test is the wrong scene.** Housing, bearing and ring are not present while the shaft is machined. Their hull results (−1.15 and −5.92 mm) say nothing about the machining path. Test only the parts that are in the shot: the shaft's journal and shoulder, the centres or work-holding, and the tool, arbor and holder.
3. **The signed-distance sign is unreliable.**
   - The sign comes from the nearest face normal on open, unwelded, non-manifold shells.
   - Its own check agrees with ray parity on only 97% of points.
   - A ring penetrated by −5.92 mm is geometrically impossible. The hull values of −5.92 and −5.97 sit near the 6 mm search cap, and the fit values of 3.9–3.97 mm look like unsigned distances with a wrong sign.
   - Use a welded derived copy (1 µm weld in numpy, source untouched) with a winding-number or 3-ray inside test. Report unsigned distance, and check containment separately.
4. **The shaft distance grid covers too little.** It spans only x∈±7 and z∈[2, 7.2], and out-of-grid points return `+inf`, which counts as safe. The scan rotates the tool to θ up to about 70° around the shaft, which leaves that region. Penetration is therefore missed exactly where it matters. Make out-of-grid a failure, or use the full annulus. Alternatively, fold angle modulo 36° and use an analytic extruded-profile distance in the toothed zone.
5. **Sampling errors exceed the stated uncertainty.**
   - Work clock steps of 2° move r=6 by about 0.21 mm.
   - Hob steps of 5° move r=4 by about 0.35 mm.
   - The fit uncertainty of 0.109 mm omits both, and also the 0.07 mm tool-point spacing.
   - The correct registry is also far finer than a 2° scan. A 0.04 mm clearance at r_p≈5.2 needs about ±0.4°, so choose the registry analytically.
6. **The hull test is one-sided.** It measures only hull-surface points against the neighbour mesh. A neighbour that sits entirely inside the hull is missed. Evaluate the closed-form distance to the hull at the neighbour's vertices and subdivided triangles, plus a containment test. Subdivide where `d(centroid) < R_tri + margin`, which uses the fact that distance is 1-Lipschitz.
7. **The hob size is inconsistent with the approved runout.**
   - `clearance.py` models a hob with tip radius 4 mm.
   - FINDINGS gives the tooth-space floor reaching 6.074 mm at y=13.78. With end y=9.525 and root 4.292, a circular-arc fit gives R≈5.97 mm. That matches the authored "6 mm". This is my arithmetic and assumes the ramp is an arc, so fit the full floor profile to confirm.
   - The approved ramp is the hob's swept envelope, so there the hob must touch the shaft. Require |penetration| ≤ tolerance and a contact set that stays inside the runout zone. Require positive clearance only on the journal side, which starts at y≈14.18, not at the authored 14.0639.
   - The helix angle is also inconsistent. The code uses `asin(m/d)` while the thread-lead formula needs `atan`.

**Inverse envelope in `profile_study.py`**

The logic of the algorithm is sound:

- The coupling ratio N/10 is correct.
- The counter-rotation sign is consistent in the code.
- Sweeping one tool pitch is enough given tool and work symmetry.
- Taking the minimum over tool teeth is valid.

The problems are in the metric and the sampling:

- **Radial gap is used as clearance.** `gap = |p| − r_w(φ)` is a radial gap, so the 0.04 mm margin shrinks to about 0.04·cos(angle between the flank normal and the radial direction) on flanks. It approaches zero on flanks that are nearly radial. The "residual stock" figure is distorted in the same way. Use Euclidean 2D distance to the section polyline.
- **The star-shaped assumption is unchecked.** A single outermost ray hit per angle fills any undercut. A 10-tooth gear is a likely undercut case. Check that the profile angle stays monotone along the profile (or count all ray hits).
- **The forward check is not an envelope.** It takes the minimum over sampled boundary points per work-angle bin, so it can miss bins (the code counts these). It also only reports radial error.
- **There is no feasibility test.** The pitch radius is free, and `C = r_p(1 + N/10)` is hand-picked. A flank point q with unit tangent t can only be generated if |q·t| ≤ r_p, because that is the distance from the axis to its normal line. Compute this along the profile and choose r_p above its maximum. Points that fail are the unremoved stock.
- **Registry and the 0.04 mm margin.** The tool phase is a free definition, so there is nothing to scan. A 0.04 mm offset means the tool generates the work plus 0.04 mm, so state that, or use a smaller margin such as 0.005 mm.
- **Infeed is not covered.** Only the final centre distance is tested. Check infeed separately.

**Recommended method**

1. Extract the section as an exact polyline: plane–triangle intersection on the welded copy at several y (3.5, 6, 9), 10-fold averaged. Confirm the section is constant across y to about 0.003 mm.
2. Compute the flank by the meshing equation, with no sampling. Contact occurs when the normal line through q passes the pitch point I. That gives the pose θ(s) in closed form, and the tool flank point is M_θ(s)·q(s).
3. Trim self-loops and fill the tip and root with a distance-field envelope, `D_T(x) = min_θ D_W(M_θ x) − ε`. Extract the contour on one tool-tooth sector.
4. For the hob, solve for the rack (graph) envelope under rolling x=r_pθ. A smooth hob thread is invariant under hob rotation, so only θ and the feed y are continuous parameters. The relative motion is a rack translation, so no hob-phase sampling is needed. Model the finite gash scallop separately: about 1 µm for 10 gashes at m≈1.

**Error bound, in mm**

`e_total = e_cad + e_tool + e_pose + e_grid`

- `e_cad`: 0.002 export plus the CAD tessellation chord error. FINDINGS says the chord error is not proven; take it from the export tolerance.
- `e_tool`: polyline sagitta, about h²/(8ρ), for example 6×10⁻⁵ at h=0.01 and ρ=0.2.
- `e_pose`: the distance between tool and work changes by at most L·|Δs|, so sampling at step h loses at most L·h/2. Near the pitch point the speed is `L = (1 + N/10)·R_I` with R_I≈2.5 mm, giving about 7.5 mm/rad for N=20. The current 0.05° tool step gives about 3 µm.
- `e_grid`: grid or sampling error such as 0.087 for the 0.1 mm grid plus 0.0707 for tool-point spacing.

Certify the path with `min_samples d − e_total ≥ margin`, and subdivide where `d_i < L·h/2 + margin`. For hulls under linear translation, the swept hull is the convex hull of the start and end poses, so test it exactly with GJK.

**Full holder test**

- **Shaper:**
  - Parts: the cutter (use the real conjugate teeth, not just a hull), hub, clamp nut, spindle or ram, the ORIG shaft, and the centres or work-holding.
  - Path: infeed, stroke into the groove, radial return relief, withdrawal.
  - Pass criteria: the stroke end clears the journal step, and the tooth tips clear the groove floor.
- **Hob:**
  - Parts: the hob at R≈6 mm, both collars and the arbor on the tilted axis, the head, the shaft (including journal and shoulder) and the work-holding.
  - Path: infeed, feed along y, runout, withdrawal.
  - Pass criteria: positive clearance on the journal side. Contact is allowed only on the generated ramp, within tolerance.
- **Each pair:** report the minimum distance, the pose, the part names, and the margin after subtracting `e_total`. Pair the positive result with an interference check, which is what the plan's gate asks for.
- **Sanity check:** the tool must reproduce the authored ramp.

Final evidence should include the reviewer re-running these on the hashed inputs.