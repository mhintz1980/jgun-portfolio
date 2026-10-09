# Fresh review — pre-capture stills packet

Date 2026-10-09. Read-only source/helper review; no browser, build, or GPU;
producer transcript not read. Reviewer: glm-5.3, structural.

## Verdict

**SHIP (pre-capture).**

## Findings

- Preview oracle: scripts/verify-handwriting-reference.mjs:76-80 now
  esbuild-bundles the five local source modules runner-side and stamps the
  oracle digest (:408). No browser-side /src imports or __handwritingSource
  remnants remain; the failed drawing-final receipts (TypeError fetching
  /src/.../handwriting.ts from 5203) record the superseded path only.
- Checks stay independent: validateSnapshot (:320-472) is unchanged in
  substance — live Troika members, AcFastReference readiness/ink-height,
  letter identity vs oracle fontText, packed/note reveal vs
  sheetReveal(phase), vector/shader colors, overlap geometry, reverse and
  monotonic reveal all compare the observed scene against the runner-built
  oracle.
- Provenance agrees with served 5203: HEAD 8db93913 equals the frozen build
  commit; src/scene/drawing and AcFastReference.ttf have no commits or
  working-tree drift since build. public==dist font SHA-256 3bff4320...
  matches both dist manifests. Live dist assets match the audit exactly:
  index-BP95EhKL.js 56e9ca..., SceneCanvas-DZeZz-e1.js 74da22...,
  RingInspection-CjrMJw5w.js 2a2293....
- DOM FOS composites: capture-final-stills.mjs:153-175 keeps the canvas plus
  [data-shaft-fos-model]/[data-shaft-fos-bar] ancestors visible, hides other
  DOM, then page.screenshot; overlay metadata is recorded. Not canvas-only.
- Encoder: encode-final-stills.py:70-71 rehashes each actual source PNG
  against the capture-report digest; :30-40 enforce schema, exact IDs, PNG,
  and source dimensions; 16 named <id>-<layout>.webp outputs at
  960x600/600x600. Guard receipt: clean 16-asset encode and tamper rejection
  before any encode.
- node --check exit 0 for both scripts; encoder ast-parses.

No capture has run; no runtime or visual claim is made.
