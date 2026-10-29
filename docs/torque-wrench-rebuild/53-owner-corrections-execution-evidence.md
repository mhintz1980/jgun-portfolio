# Owner corrections — execution and evidence

Authority: owner brief 50 and the saved 2026-10-25 temporary handoff. Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`, branch `torque-wrench/rebuild`, starting HEAD `57e903d6f9f4578916b1271cfb818cc19aef0a9e`.

Status: **implemented; strict production verification passed; independent final technical review SHIP**. Owner visual acceptance remains open. No commit, push, deployment, protected model regeneration, unrelated cleanup or broader JG-038 acceptance.

## Changes

- **R1:** 58-second study; preserve machining, input engagement and first cage spin through 40.2 s. Continue the close counterclockwise orbit; reveal rotating Stage 2 planets at 41–42.4 s before its spinning cage at 43–44.4 s. From 45 s, a straight, slightly off-axis camera/target translation follows the physical stage order 1 → 2 → 5 → K000004 → 3 → 4 → output. Source exterior/handle return at 57–58 s, after output rotation. The actual native scroll map adds a multiplier-16 continuation span over page .815–.825, adding .15 of base travel (6.615 baseline viewports).
- **F1/F3:** effective translucent materials no longer switch depth-writing at 50% opacity. Source internal and exterior materials have separate clone pools, preventing exterior alpha writes from exposing hidden supports. All clones have scoped disposal. Source exterior stays in the transparent pass through private ownership, returning to its normal depth policy at .845.
- **F2:** read the animated die after updating current descendant/world matrices. Bound its camera influence to a 12 mm ring-local region, release focus before withdrawal, and recover whole-ring framing before the tool exit. Pixel probes measure both source and private ring during their intentional transition.
- **F4:** replace the .590–.600 camera hold and .275 opacity plateau with a continuous registered camera path and fade completion at .600. Remove the outgoing .825–.830 hold too.
- **Source/private handoff:** authenticate K000210/K000211 through consolidation without changing source vertices, role/material counts, drawing bytes, mechanics or rig cache. Keep them and source carriers/planets/K000004/output hidden until .845. Retain private context, align phase and measured support pose over .825–.845, then switch internal ownership once. No second exterior fade.
- Update live/reduced-motion transcript and cascade still description. Static still capture is gated on the complete passing production roster.

## Verification completed

- Source/static tests: **60 files / 526 tests passed**. Latest camera-focused rerun: **28 tests passed**. Typecheck and production build pass. Existing Vite >500 kB chunk-size advice remains.
- Actual source GLB support test: K000210 has 26 raw primitives merged to one identity-preserving mesh (1,896 vertices); K000211 has six primitives merged to one (424 vertices). Maximum transformed vertex differences are approximately 3.73e-9 m and 2.30e-9 m. Exact drawing-position hash, material counts, mechanics and cached-rig reuse match the pre-split control.
- Short current rendered control check: 46 named source occurrences (five carriers, 21 planets, two handle shells and 18 handle interior/decal meshes). No source-owned opacity leak at .824 or .8449. Actual private/source support centroid difference is approximately 3.6e-9 m at .8449. Back-facing LCD/button decals are adjudicated with original-side white masks alongside double-sided identity masks.
- Protected SHA-256 baselines remain unchanged: `Default.glb` `8b07246cf857aca29d1832815d8d183e0a1fd8ef06da5a7a089019706a57a257`; `m249-transformed.glb` `1c251f45b05b736a08858e47c53c8fa779870b636bb1a174d1422d8003305423`; `msp-enclosure.glb` `c1c919ab8f747e9e2bd9eeb51b5ac31ee66dc39145cac44ad7c8fddfa056428e`.

## Runtime evidence and limitations

`scripts/verify-owner-corrections.mjs` drives native scrolling against a fresh production preview on `http://localhost:5292/torque-wrench/`. It checks desktop/narrow full/lite plus reduced motion, actual applied state, named fade controls, output-specific rendered contribution, useful-frame occupancy, measured DOM clearance, current ring bounds/pixels, source/private ownership, support registration, forward/reverse/shuffled seeks and continuous recorded sequences. It fingerprints served and local production chunks and protected assets. No model-image opinion substitutes for telemetry and pixels.

Earlier records remain diagnostic: the completed `2026-10-26T00-49-19-092Z` run failed source material ownership, narrow-lite occupancy and reduced-image evidence. The `2026-10-26T01-39-08-865Z` run is partial and was stopped before final narrow lens refinement. They are not acceptance evidence. UTC directory dates can differ from the owner's local date.

Final strict aggregate: `output/playwright/owner-corrections/2026-10-26T03-01-31-617Z/report.json` — **PASS**. Four live cases each pass 30/30 checks with 488 settled forward/reverse samples and ten continuous sequences; desktop/narrow reduced motion each pass 3/3. Total: **126 checks, 1,952 settled live samples, 40 sequences, zero browser/HTTP/WebGL errors**. Two separate UI-hidden, subject-cropped cascade stills were captured (desktop 8:5, narrow 1:1).

Evidence provenance: all four completed live cases originate in `2026-10-26T01-55-10-410Z/report.json`. Its reduced-motion gate incorrectly required image files even though the private route's `posterMap.ts` deliberately declares five pending Stage-6 placeholders. The final verifier revalidates entry/Scene served and local bytes, inspection clock bundle and protected assets before reusing those four complete live cases; their original report SHA and absolute `evidenceBase` are recorded. Both reduced cases were rerun against the actual five-labelled-placeholder contract, with the corrected shaft disclosure transcript checked. No product-source change was made to bypass the failed image assertion.

First independent Astra review held the result for stronger occurrence/output evidence; see document 52. The second/final review, completed by the already-authorized Gemini-4-Argon / medium alternate after Astra's usage limit, returned **SHIP** with no blocking technical findings. All three earlier findings were resolved. The raw verdict is `gemini-final-review.md` beside the final aggregate; `gemini-routing-receipt.json` records successful Google-provider routing. Numerical gear-phase/conjugacy checks do not establish triangle-level collision freedom. Owner comparison with the eight original screenshots remains an explicit visual-acceptance step. Pending general poster art remains outside this correction scope.

## Configured roles

Sol/high implementation workers; Luna/high context reader; GLM-5.3/high critical source review; Astra/medium independent first review. Astra's final round hit its usage limit; the already-authorized Gemini-4-Argon/medium alternate completed that round through a verified enabled opencodex route and ephemeral read-only CLI. Role/model settings were authorized in the handoff. The support worker encountered a provider 502 after leaving its patch; the parent inspected and verified that work locally. The selected Google routing receipt separately confirms the served Gemini model.

The final serving proof is `final-serving.json` beside the passing aggregate. Final source/build/typecheck/diagnostic logs are filed under its `source-checks/` directory. After copying the new stills into dist and restarting the preview, entry and Scene bytes match the passing live evidence, both served WebP hashes match public/dist/report, and all three protected source-model hashes remain unchanged.

All preexisting staged/unstaged/untracked work was retained. `.scratch/` remains outside Git delivery; no staging or Git delivery was performed.
