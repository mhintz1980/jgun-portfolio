# JG-035 pre-pulse paper/ink baseline — 2026-09-30

## Verdict

Two separable effects are present.

1. **The trailing reading-lamp pool materially lifts the pre-pulse paper and anti-aliased ink blend.** In same-frame normal/no-pool pairs, removing only the paper-shader pool lowers blank-paper luminance by **6.23–6.89 / 255** from t=.30 to .40. Across the same pairs it lowers the average darkest ink sample by **27.25–28.30 / 255**. The larger ink effect is consistent with thin navy strokes blending with brighter paper: the pool changes both channels, but damages stroke contrast much more than blank-paper luminance alone suggests.

2. **A pulse-correlated brightness step occurs after pulse onset, independently of the pool.** From t=.40 to .42, uPulse goes 0→1 and pulseHead 0→.10 while the lamp is already settled near (-.120, -.042, z=.320). Paper rises **+5.95** with the pool and still rises **+4.00** with the pool disabled. This is not trailing-pool settling. The current composer maps bloom intensity to a pulse-dependent value (rest .25 plus .30 × pulse), so bloom is the leading suspect for the non-pool step, but it was **not isolated by a bloom-null capture** and is not proven causation.

## Measured driver table

| Window | Evidence | Ruling |
|---|---|---|
| t=.30–.40, paired normal vs no-pool | Paper: pool adds 6.23–6.89 luminance. Darkest ink samples: pool adds 27.25–28.30. uContrast=1, uOpacity=1, uVellum=0, flex=0, contact strength=0, pbr=0. | **Pool is causal for the brightened paper / lighter ink blend.** |
| t=.40→.42 | Lamp position/reach are stable; uPulse 0→1; paper +5.95 normal and +4.00 no-pool. Ink samples also brighten substantially in both modes. | **A second pulse-correlated effect is real.** Bloom is the leading suspect, not an isolated cause. |
| Hidden live model | drawing.pbr=0 at every measured time through .42; uVellum=0; paper opacity remains 1. | **No measured PBR/vellum emergence in this window.** A per-material hero-opacity pathway was not dumped, so this does not exclude every material overlay path. |
| Pressure/contact | uFlexAmplitude=0, uContact=[0,.006], flexPeakDisplacement=0 throughout. | **Ruled out for t=.30–.42.** |
| Print contrast/opacity | uContrast=1 and uOpacity=1 throughout. | **Ruled out for t=.30–.42.** |

## Paired values

Values are mean 7×7 patch luminance /255. Ink-low is the mean of the low 5 of 49 pixels at each of 27 fixed side-elevation stroke patches, so it is a conservative darkness probe rather than a pure stroke-core measurement.

| t | Tier | Paper normal | Paper no-pool | Pool Δ | Ink-low normal | Ink-low no-pool | Pool Δ |
|---:|---|---:|---:|---:|---:|---:|---:|
| .30 | full | 220.36 | 213.47 | +6.89 | 211.68 | 184.43 | +27.25 |
| .34 | full | 220.18 | 213.37 | +6.81 | 116.41 | 89.22 | +27.19 |
| .38 | lite | 219.51 | 213.12 | +6.40 | 114.55 | 86.53 | +28.01 |
| .40 | lite | 219.21 | 212.98 | +6.23 | 113.04 | 84.74 | +28.30 |
| .42 | lite | 225.16 | 216.99 | +8.18 | 156.29 | 119.88 | +36.41 |

The t=.30 ink value is less comparable because side-elevation reveal is still in progress; t=.34–.40 is the stable pre-pulse comparison. The t=.42 jump is after pulse activation (t > pulseStart=.40).

## Temporal separation

- Pre-pulse fixed blank paper changes only **-1.15** luminance from t=.30 to .40 in normal mode, while the pool contribution remains roughly **+6–7**. The pool explains a brightened baseline and lighter thin-ink blend, not a sudden late step.
- From .40 to .42, with uLamp essentially unchanged, paper still increases **+4.00** after pool removal. That surviving step requires a non-pool driver.
- Pulse-dependent bloom intensity is temporally consistent with the surviving step, but bloom/post-processing was not nulled. A bloom-null A/B is required before attributing the +4 exactly.

## Evidence and uncertainty

- Primary paired null captures: valid-baseline/samples.json (full-tier t=.30/.34) and registered-baseline/samples.json (lite-tier t=.38/.40/.42). All patches valid and no recorded page errors.
- The no-pool override changed the live paper shader pool for the captured frame and restored the uniform after render. Uniform dumps still report the real saved lamp value, which is why uLamp remains populated in no-pool rows.
- Tier differs between the early full-tier pairs and later lite-tier pairs. Every causal pool comparison is same-frame and same-tier, so pair deltas remain valid; absolute values should not be compared across the tier boundary without that caveat.
- Ink patches are 7×7 neighborhoods around fixed sheet-space side-elevation segments. Sub-pixel stroke coverage and anti-aliasing are included; that is why the pool effect on stroke samples is larger than on blank paper.
- pbr/vellum/contact/pressure rule out those extraction channels through .42, but per-material hero opacity was not dumped. The owner-visible gray profile overlay after pulse onset needs a profile-interior mask plus pulse/bloom null before further attribution.

## Implication for source changes

For the owner defect before outline animation, gate or damp the reading pool first and verify that fixed ink-low values recover by roughly the measured 27-unit pool contribution. Separately, hold pulse-correlated post-processing intensity flat until the outline treatment is deliberately presented; gating the pool alone should not be expected to remove the .40→.42 brightness step.
