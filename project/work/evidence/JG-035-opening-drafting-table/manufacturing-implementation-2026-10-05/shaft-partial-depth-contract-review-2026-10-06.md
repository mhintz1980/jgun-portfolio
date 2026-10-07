# Retained partial stock versus active removal — October 6

The original dedicated shaft spec required `teethPartial` to be zero while returning. Preview run 1 observed two partially machined spaces at 3.00 seconds on a return stroke. Its original failures remain historical evidence.

The current telemetry (`shaftRuntime.ts:414-421`) counts spaces whose stored depth lies strictly between zero and one. The approved four-pass machining depiction retains previous-pass depths. A partially cut space therefore remains partial when the tool returns; the count does not describe active cutting.

Independent Z.ai GLM semantic review received the actual current source snippets from `shaftRuntime.ts`, `kinematics.ts` and `progression.ts` plus the accepted progression requirement. HTTP 200, response model `zai/glm-5.3`, request ID `chatcmpl-19239f8e910f4a52a456ddee`, finish `stop`. This is endpoint-response attribution; backend effort was not established. The first 4096-token request exhausted its output allowance without a visible verdict and is not counted as review.

Verdict: **FIX-CONTRACT**, not a request to alter or zero the source telemetry. The review explains that zeroing the count would either misreport retained partial stock or complete material without engagement. `kinematics.ts:489` requires a cutting stroke for active stock engagement; `progression.ts:133` preserves previous-pass depth ahead of the leading face.

Stronger replacement checks:

- At every shaping checkpoint the telemetry count must equal the actual retained material depth count.
- Within every complete return window, retained per-space depths must not advance and active engagement must be absent. A boundary straddling a cutting interval must not be falsely treated as wholly returning.
- New depth must correspond to counted cutting engagement; the current shader mask preserves previous-pass material ahead of the cutter face.
- Chip/contact checks remain separate and strict. This review does not waive any real stock-removal, mask, contact, timing or rendering defect.

The verifier producer must implement these causal checks and show they reject new depth/active removal on return. Parent rerun and final different-provider review remain required. No source change was made for this semantic correction.
