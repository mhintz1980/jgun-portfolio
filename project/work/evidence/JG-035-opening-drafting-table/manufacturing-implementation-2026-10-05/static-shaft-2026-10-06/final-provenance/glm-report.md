Audit complete. Verdict, evidence, and the prepared refresh follow.

**Verdict: the 16 WEBPs remain exact render-state equivalents on CPU evidence — no pixel refresh is mandated by the contact-linked kinematics correction.** This is CPU equivalence (same shader/camera/geometry inputs, exactly equal sampled state), not a rendered-execution or runtime acceptance claim.

**Independent results**

- Old kinematics bytes recovered hash-verified: recovery worktree file = `4509f6b2…cd874a` (21,959 B), matching the recorded capture-era hash; current `kinematics.ts` = `2f78847d…bd893` (equals the correction's final hash). The hash-recovery recapture rule is therefore not triggered.
- My own resample (old and new modules each loaded against the *same* current `progression.ts`/`toolSpec.ts`): every runtime-consumed `sampleShaftKinematics` + `writeShaftProgression` field exactly equal (−0-sensitive `Object.is`) at 8.4/17/25/32.4/34.2/35.8/38.2/42.5 s, fresh and sequential regimes; zero exported-constant diffs. Dense 0.01 s grid: 186/4301 samples differ (windows 2.52–14.47 s), none at capture times; nearest divergence to any still is 8.3999 (1e-4 s below the 8.4 shot). Cross-check vs the source worker's JSON matches except `hobWorkPhi` −0/0 JSON-sign, not a value difference.
- Other render sources unchanged since the 17:59:11Z capture: only `kinematics.ts`/`kinematics.test.ts` modified under `src/` after capture; camera.ts (`0b5952f3…`) changed 13:50, before capture, and matches post-capture ledger hashes (`progression.ts f4d92688…`, `toolSpec.ts 1ef5e143…`).
- All 16 WEBPs and 16 source PNGs independently hash-match `raster-manifest.json` (0 mismatches); 2×8 target grid confirmed from manifest and capture report (drift 0, supportPair deltas 0). Disclosures carried: 35.8 is 2.8% into the move (2.673/2.75 mm); blank/hobbed cameras differ by design.

**Minimal-refresh proposal** (also in the report): retain the existing WEBPs; recapture only for a rendered-execution claim or any further kinematics change.

**Prepared helpers** (verbatim copies except explicit args; live-store identity guard, native-setter seek, settle logic preserved):

```text
node   …/static-shaft-2026-10-06/final-provenance/capture-refresh.mjs --url http://localhost:<port> --out …/final-provenance/<new-capture-dir>
python …/static-shaft-2026-10-06/final-provenance/encode-refresh.py --capture …/<new-capture-dir> --dest public/inspection/shaft --manifest …/<new-manifest>.json
```

Full evidence and skip queue: [static-shaft-final-provenance-audit.md](C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/static-shaft-2026-10-06/final-provenance/static-shaft-final-provenance-audit.md), with `equivalence-resample.json`, `audit-hashes.mjs`, `capture-refresh.mjs` (`fe5a3180…`), `encode-refresh.py` (`660b46d5…`). Nothing recaptured, published, staged, or committed. One skipped item worth noting: the four CAD GLBs the captures requested have no capture-time hash ledger; my unchanged-sources evidence for them is filesystem-level only.

