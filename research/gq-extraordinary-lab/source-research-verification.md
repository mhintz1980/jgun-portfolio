# Step 2 source research verification

- [seen] Codex status: **done**, 2026-11-14. Edited `capture.md` sections 4, 4c, 5 and 6 only; new supporting files remain inside this slug. No git operations, app changes, shared browser/REA mutations or other-slug writes were performed.
- [seen] Original GLM content is preserved in `capture.step1-original.md`. Concatenating the retained portions of the completed capture (before section 4, section 4b, section 8 onward) reproduces that original file byte-for-byte. Original SHA-256: `6f1d7b24dfa29801c017f34fa401f32426c00de43efd531248ca8d35411549af`.
- [seen] Required section headings exist once and appear in numeric order. Section 5 contains **97 data rows**, each with eight nonempty columns: trigger, what moves, property, from/to, duration or scroll span, easing/interpolation, stagger, source evidence. Every row has an evidence marker. Section 6 contains **49 shader/pass-family rows**, with verbal descriptions rather than copied shader source.
- [seen] Checked **188 explicitly prefixed source-offset references** against the saved files' JavaScript string lengths; all are in range. These are zero-based character offsets, not byte offsets. Read source bodies/methods and AST literal Theatre tracks; did not execute downloaded code. Original minified copies are retained to keep references reproducible.
- [seen] Orchestrator follow-up inspected entry source `BIhX5qj-.js` @1441966–1442360 and refined the Sensorial CTA explanation: supplied duration and inherited easing select the duration branch before the lerp branch. The endpoint and 3 s duration were unchanged; the capture now cites this additional source range.
- [seen] Key source files actually read: `scripts/BIhX5qj-.js` (entry, Lenis/library implementation, Theatre core/state/store); `scripts/BGl2_TTZ.js` (main UI/controllers); `scripts/CROz8He7.js` (scene/cameras/materials/shaders/composer); `scripts/By59hpON.js` (Bézier helper/analyser); `scripts/C4irFK9B.js` (Theatre implementation/handle convention); `scripts/HomePage.Dqy6SVbs.css` and `scripts/default.ps2yTGsN.css`. Tiny `D-3hq5pL.js` was inspected as route/import glue.
- [seen] Public source recovery succeeded for all eight retained JS/CSS files. A separate attempt to refresh the recorded embed-root HTML URL returned AccessDenied and produced no saved HTML. This does not block the assigned JS/CSS source analysis.
- [seen] Exact GLB camera trajectories, clip duration/marker-frame contents and interpolation, binary model authoring and original video animation internals remain unknown from this source-only inspection. Optional DOF settings lack a connected render pass in the recovered scene chunk; the fisheye pulse method has no caller there. Conditional branches are identified as such instead of asserted visible effects. No live browser re-verification was performed.

## Retained-source fingerprints

[seen] SHA-256 prefixes, byte and character lengths of the recovered sources:

| File | Bytes | JS-string characters | SHA-256 prefix |
|---|---:|---:|---|
| `scripts/BIhX5qj-.js` | 1667219 | 1665452 | `69e8be67d43038b9` |
| `scripts/BGl2_TTZ.js` | 123386 | 123385 | `613da6c61b0a14d2` |
| `scripts/CROz8He7.js` | 1043107 | 1043107 | `6cd2821b2c8e7cae` |
| `scripts/By59hpON.js` | 4750 | 4750 | `04ad5a12431befd4` |
| `scripts/C4irFK9B.js` | 763056 | 763026 | `abcb7531aad5d3dd` |
| `scripts/D-3hq5pL.js` | 384 | 384 | `e269c99053ccf610` |
| `scripts/HomePage.Dqy6SVbs.css` | 48778 | 48778 | `f665997ef125c42c` |
| `scripts/default.ps2yTGsN.css` | 724 | 724 | `b2766c90f8598509` |
