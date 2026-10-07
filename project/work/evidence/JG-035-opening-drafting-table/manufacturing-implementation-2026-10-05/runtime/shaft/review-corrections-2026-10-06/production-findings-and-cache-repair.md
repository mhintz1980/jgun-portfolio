# Production findings and program-cache repair

**GPU released. Ready for source correction, rebuilt/restarted preview and fresh paired runs. No acceptance is granted.**

## Preserved production attempts

- `final-run-1/report.json`: stopped setup failure using `e916bcd0…db943`; the impossible rest-camera stability precondition is explained in `atomic-restoration-repair.md`.
- `final-corrected-run-1/report.json`: complete run with verifier `9f68f4502271281be1a059bef53a3bd5565d155d2e6f174125c0b53a54023e84`, against parent-released production build `index-Cj9-XFjO.js / SceneCanvas-Nan1n_iK.js`. S1/S3–S8/N1–N4 pass; S2 fails with 36 causal assertions on desktop and the same 36 on narrow; zero harness exceptions. Desktop/narrow each captured all 13 required frames. All four mode/exit camera matrix deltas are exactly zero on each viewport. Poster allCAD=0; reduced inspection=0 and narrative=3 on each viewport, leaving lifecycle V4 unresolved.
- `final-corrected-run-2/report.json`: second pass stopped after desktop S1/S2 when the parent requested diagnosis before spending more GPU on the known source defect. Partial evidence is preserved; it is not an agreeing complete second run.

The later independent cache-identity finding below means these passes do not establish final render acceptance. They remain diagnostic evidence. No failed report was rewritten and no browser gate was checked.

## Actual source defect: stock removes before contact

The current source probe (`probe-return-causality.mjs` / `.json`) subdivides each examined interval into 10,000 steps (~5 microseconds), samples kinematics and evaluates the progression vertex-law CPU mirror. It is independent of browser/material-cache behavior.

At space 3's first gain, between 2.512270 and 2.512275 seconds:

| Quantity | Before | After |
|---|---:|---:|
| Machining time | .0999979033 | .1000004954 |
| Cutting half-stroke | true | true |
| Active engaged space | -1 | -1 |
| Cutter leading edge (mm) | 2.7718743 | 2.7718767 |
| Face start (mm) | 3.1749 | 3.1749 |
| Space depth | 0 | .25 |
| Stock radius at y=4 mm | 6.0835074 | 5.6355877 |

No active engagement occurs anywhere in 2.50..2.55, 6.75..6.80 or 12.05..12.10. The later intervals likewise remove .4479197 mm of radial stock before face entry. This is not missed interior engagement, timing-boundary noise or preserved partial stock. It is a gain while disengaged. The older JSON's `return interval` label is imprecise: that scan tests absence of **active stock engagement**, including a cutting half-stroke before stock contact.

Root cause: `kinematics.ts:224–228` counts angular crossings by half-stroke phase; `kinematics.ts:485–489` publishes the resulting depth before checking the axial stock-contact bound. With engagedSpace=-1, the previous-depth mask at `progression.ts:286` does not protect stock ahead of the cutter; the depth applies to the tooth space immediately. Parent independently reproduced this and assigned `kinematics.ts`/test correction to the source worker. This agent made no source edit. Keep no-engagement/no-removal invariants strict and preserve retained prior-pass stock.

## Independent cache review correction

Independent review found that the old uniform instrumentation assigned the same verifier program-cache key to every study material, including tools/supports. This erased the authored distinction established by `applyProgression` (`progression.ts:384`) and affected the render witness.

The corrected instrumentation now:

- Selects only materials whose existing authored cache key begins `jgun-shaft-progression-`, the explicit marker set by `applyProgression`.
- Preserves the original cache-key function and appends the stable suffix `|shaft-verifier-uniform-witness-v1`.
- Leaves default tool/support/housing material callback/cache identities untouched and does not set their needsUpdate flag.
- Recompiles only selected progression materials to capture their actual live uniform objects; records original/witness keys and the untouched-material count in each run.
- Renames report labels from `return interval` to `wholly disengaged interval`, without changing scan semantics, failure conditions or tolerances.

`node --check scripts/verify-shaft-inspection.mjs` exits 0. New verifier SHA256: `d26d491acbb8bac0e0803a48e60b01592e6c57eeb0ebc76d15275e213bc87c4a`.

No GPU/browser execution occurred after this cache repair. The atomic entry/exact restore-frame repair remains in place and had zero matrix deltas in the completed diagnostic pass. Both fresh production runs and parent independent proof must use this final verifier hash (or a subsequently reviewed correction) after the source fix/build/restart. All historical output directories remain separate; do not overwrite them.
