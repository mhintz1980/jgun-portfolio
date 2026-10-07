# Static shaft 16-WEBP final-source provenance audit — 2026-10-06 (GLM-5.3 leaf)

**Verdict: CPU render-state equivalence HOLDS for all 16 stills after the contact-linked
kinematics correction. No pixel refresh is mandated. The existing WEBPs may be retained on
CPU evidence. This is CPU equivalence only (same shader/camera/geometry inputs + exactly
equal input state), not a rendered-execution or runtime acceptance claim.**

## Independent verification performed (this leaf, CPU-only)

1. Old source bytes recovered hash-verified:
   C:/Users/Markimus/Documents/Codex/recovery/jgun-portfolio-20261006-030424/worktree/src/scene/inspection/shaft/kinematics.ts
   SHA256 4509f6b247efc40b428c37ad4a8925add3a944c1e4d16fd978f62101d6cd874a (21,959 bytes) —
   equals the recorded previous kinematics hash. The hash-recovery rule therefore does NOT
   force a recapture.
2. Current kinematics.ts SHA256 2f78847da8cc70b350c7f22eed2c899d6289100f94011dc87533f1dd337bd893
   — equals the correction README's final hash (mtime 2026-10-06 18:35 local).
3. Independent old/new resample (equivalence-resample.mjs, in-memory TS transpile, both
   kinematics modules resolved against the SAME current progression.ts/toolSpec.ts):
   every runtime-consumed field of sampleShaftKinematics + writeShaftProgression is exactly
   equal at 8.4, 17, 25, 32.4, 34.2, 35.8, 38.2, 42.5 s — Object.is deep compare (-0
   sensitive), fresh-state AND sequential-state regimes, both pass; zero exported-constant
   differences. Full data: equivalence-resample.json.
4. Dense 0.01 s grid over 0..43 s: 186/4301 samples differ old-vs-new (the correction's
   removed premature stock gains plus ~0.01 s event-boundary shifts); windows span
   2.52-14.47 s and none contain a capture time. Fine 1e-4 s scan: nearest divergence to
   any capture time is 8.3999 (1e-4 s below the 8.4 still); the other seven times have no
   divergence within +/-0.05 s. Equality at the exact captured instants is exact.
5. Cross-check against the source worker's static-source-equivalence.json: every field
   matches at all 8 times except hobWorkPhi -0 vs 0 — a JSON sign-of-zero serialization
   limitation, not a value difference (both sides serialize to 0 in JSON).
6. Other render sources unchanged since capture (capture ran 2026-10-06T17:59:11Z to
   17:59:38Z on dev5199):
   - Filesystem: only kinematics.ts (18:35) and kinematics.test.ts (18:32) modified under
     src/ after capture start; camera.ts last modified 13:50:35 (before capture);
     public/ shows only the 16 WEBP writes at 14:00-14:01 local (the publish step).
   - Hash ledger: shaft-stock-contact-correction-2026-10-06/causal-sweep.json (post-
     correction) records camera.ts 0b5952f3f31bffbdf626965204e3a2b0a0c2c7443b593de728616e0b5af6203a,
     progression.ts f4d9268867556485425f39c4dcf2cd4a9a3522470a64e9da3f5040615d31a3e1,
     toolSpec.ts 1ef5e143d05af11b00a687950695fe0ef33f82df897423159647e852d7b001b3,
     kinematics.ts 2f78847d..., kinematics.test.ts dc5b5ee2... — all match the current files.
     gates/camera.md (14:22 local, post-capture) records the same camera hash.
7. Independent hash audit (audit-hashes.mjs): all 16 WEBPs and all 16 source PNGs match
   raster-manifest.json (0 mismatches); 2x8 target grid confirmed (desktop + narrow x the
   eight times) from BOTH the manifest and completed-render-capture/capture-report.json
   (camera drift 0 per shot; supportPair cameraDelta 0, projectionDelta 0).

## Disclosures carried forward (unchanged by this audit)

- Support pair 35.8/38.2 s: identical cameras, but 35.8 is already 2.8% into the authored
  move (2.673 mm of the 2.75 mm nominal displacement visible). Product copy already says so.
- Blank (25 s) and hobbed (32.4 s) cameras differ because they use their authored process
  views; no same-camera geometry proof is inferred.
- No tooth counts or vision checks were used to infer equality; equality is exact field
  comparison of the sampled kinematics/progression state.

## Skip queue (self-contained)

1. No GPU/browser/server/build execution (CPU-only constraint). Consequence: no rendered-
   execution proof against the final source; pixel retention rests on exact CPU state
   equality plus unchanged render sources. Not a gap for the equivalence claim, only for
   anyone demanding a rendered-execution claim.
2. The four CAD GLBs each capture requested (m249-transformed.glb, Default.glb,
   msp-enclosure.glb, manufacturing-core-lite/full.glb) have no capture-time hash ledger in
   the packet; this audit relies on filesystem evidence only (no public/models file modified
   after capture start). If byte-exact CAD provenance is later required, a ledger must be
   created first.
3. hobWorkPhi +/-0 JSON-sign limitation in the worker cross-check (item 5) — recorded, no
   render impact, and the load-bearing old-vs-new comparison distinguishes -0 and passed.
4. WEBP re-encode byte-identity under a future recapture was not tested (needs GPU); the
   encoder helper is deterministic in method/quality but output bytes were not re-derived.

## Prepared refresh helpers (this directory)

    capture-refresh.mjs   fe5a3180977f650f6b7aefcd22df9b869d6d89acb115d4fd6425aed932f66bb1
    encode-refresh.py     660b46d588296c0d6316e7a46d1d6d4cf12540fd29a805741cd96497674316f8
    audit-hashes.mjs      58c58f66b38274cc11a7d41583ffb6227aa2ca4d584e78126617d0ffaf69e1af
    equivalence-resample.mjs  a860e4f676624b8999ad2789bb03c07976788862db953d3a04f5f3edeaf4fa3f
    equivalence-resample.json e3c69700c6e8665bbf560f195acb05f9fe996bbd008e711c35278bb29cf4665f
    crosscheck-probe.cjs  74c030ab40669b980e2540f17d3d9939343f1240c32ab7aa3ed91c28a9251c8a
    build-helpers.mjs     9aa95192e608477712081c14c2ab840ce6c2ef7bc6e83cb0e6c7a39b3fb79ff5
    inspect-json.cjs / inspect-equivalence.cjs / inspect-capture.cjs / inspect-requests.cjs
                          cf6286f0... / a7003dbf... / ec1c4c8f... / cac6b4db...

capture-refresh.mjs is a verbatim copy of ../capture-completed-renders.mjs except explicit
--url/--out (diff: header, argument block, report.out field; all settle logic, the exact
Vite live-store URL import + telemetry-identity guard, native-setter #inspection-seek with
step='any', DOM-hidden screenshot, drift and support-pair checks preserved byte-identical).
encode-refresh.py is a verbatim copy of ../encode-stills.py except explicit
--capture/--dest/--manifest. Target times are unchanged and all sit on the 0.01 grid.

Commands (only if the parent authorizes GPU + public asset ownership):

    node .../final-provenance/capture-refresh.mjs --url http://localhost:<port> --out .../final-provenance/<new-capture-dir>
    python .../final-provenance/encode-refresh.py --capture .../<new-capture-dir> --dest public/inspection/shaft --manifest .../<new-manifest>.json

Nothing was recaptured, published, staged or committed by this leaf.

## Minimal-refresh proposal (<250 words)

No pixel refresh is required by the contact-linked kinematics correction. The old
kinematics bytes were recovered hash-verified (4509f6b...), and an independent CPU resample —
old and new modules loaded against identical current progression/toolSpec dependencies —
shows every runtime-consumed sampleShaftKinematics and writeShaftProgression field exactly
equal (-0-sensitive Object.is) at all eight capture times in fresh and sequential regimes;
exported constants are identical; every other render source is unchanged since the
17:59:11Z capture (only kinematics.ts and its test changed after). All 16 WEBPs and 16
source PNGs hash-match the manifest; the 2x8 target grid is confirmed. The nearest old/new
divergence to any still is 1e-4 s below the 8.4 capture, with exact equality at the
captured instants. The existing WEBPs may be retained as exact render-state equivalents —
CPU equivalence only, not a rendered-execution claim. If the parent wants rendered-
execution proof against the final source, or any further kinematics change lands, run the
prepared capture-refresh.mjs/encode-refresh.py against a parent-started dev server
(commands above). Publishing into public/ requires the parent's GPU and public-asset-
ownership authorization; nothing has been recaptured or written yet.
