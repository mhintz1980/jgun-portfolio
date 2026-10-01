# Independent technical review — 2026-10-01

Native fresh-context read-only reviewer: Gibbs (`01a0f65d-67bb-7680-92c3-4f5c436e1a34`). Model and effort were inherited; served model/effort and usage are not exposed by the native agent tools and are unobservable.

Initial verdict: **fix-first**. Fixed DOM heights designed for intro share .30 left the hero timeline approximately 69% consumed at the .50 intro release; the first post-intro frame could show explosion .469 and gear sweep .649. The old browser roster stopped at .12 and could not catch it.

After repair: **ship at the code boundary**. `scrollTracks.ts` re-derives track heights to restore hero transit paced .177029328288–.458429517502, preserves total document height, and puts transit start beyond the intro release. Added runtime checkpoints .1199/.1201/.13 assert assembled mechanism state and verify live DOM transit anchors. The reviewer independently checked both derivations and the assertion paths.

Residual gates at review time: strengthened six-case browser run, clean full-tier pixel proof and full-tier review motion. Static gates were 169 tests, typecheck, 26 drawing checks and build. Browser completion must be established by the final report, not inferred from this verdict.

Follow-up tooling caveat: historical `scripts/verify-b1b2-rebuild.mjs` still has a .30 pacing mirror and feeds `scripts/export-sheet-template.mjs`; it is not used for this continuation and must not be treated as current pacing proof. Current runtime gate is `scripts/verify-jgun-opening.mjs`. The spec's overbroad claim about unaffected chapter activation edges is being corrected; downstream paced constants are retained while some DOM activation edges shift slightly.
