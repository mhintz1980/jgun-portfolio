# Owner corrections: 100:1 cascade, measured speed cap, solid housing

Revision 2 handoff, 2026-10-26. Supersedes the all-stage orbit gate in 54/55.

- [x] Read revision 2 handoff, 54/55, startup queue and dirty state.
- [x] Preserve baseline dirty paths, source assets, HEAD and empty index; record fingerprints.
- [x] Measure native cascade pacing and repeating-feature angular steps at a stated nominal scroll speed; bracket the input RPM limit and confirm with real-time headed playback.
- [x] Introduce one adjustable cascade input:output ratio (100), separate from exploded-view ROTATION_TURNS; preserve Stage 1 5.2:1:-3.5 geometry and analytic reversible sampling.
- [x] Keep progressive acceleration through four reveals within measured INPUT_RPM_CAP. Keep one orbit only for Stage 2; extend its window if the measured cap requires it. Report later orbit fractions and resulting output rotation without half-turn goals.
- [x] Keep main housing opacity 1 through explosion; add source and browser gates.
- [x] Update tests, verifier, README/spec ladder descriptions and current queue together.
- [x] Run focused tests/build, restart owned preview on localhost:5292, and run current-build desktop/narrow full/lite Playwright verification.
- [x] Independent Gemini-4-Argon review (no Astra), resolve findings, record evidence and leave preview running. Review SHIP preceded the final 2 RPM calibration reduction; fresh source, headed and four-case browser proof cover the 158 RPM setting. Evidence 57 preserves that boundary.

Parent owns shaft timing/runtime, verifier, integration and docs. A bounded worker may own MechanismDirector.ts and its tests only. One writer per file. All pre-existing dirty work and .scratch remain intact. No staging, commit, push, deployment, protected-asset regeneration or broader acceptance. Owner visual acceptance stays OPEN.
