# Torque wrench rebuild — read first

Decision needed: accept the structure artifact after reviewing [10-structure.md](10-structure.md). Design is accepted; structure is drafted and independently reviewed. Planning requires the next owner approval after structure acceptance.

## Required motion standard

**Read [Portfolio Motion Standard — Oryzo-Inspired](smooth-scrolling.md) before every scrolling or cinematic-motion edit.** This owner-authored file is canonical here and has been preserved unchanged. Include its path in every delegated scroll/motion brief, design, plan and review. Inspect the existing scroll/motion pipeline before changing parameters; preserve verified behavior and measure improvements against a baseline.

**Primary reference for "perfectly smooth scrolling": [Oryzo](https://oryzo.ai/).** Bounded browser recordings now exist; their coverage and failures are disclosed in the research report. No exact internal settings or motion acceptance is inferred.

Evaluate three properties separately and together:

1. Narrative pacing: scroll distance between events and time for compositions/readings to settle.
2. Input smoothness: wheel/touch input becoming responsive scroll movement.
3. Cinematic motion: coordinated camera, model, lighting and scene response to canonical progress.

No single lerp or beat-distance value defines smoothness. **Do not optimize smoothness by increasing lag.** The standard remains open to owner discussion and revision at any time. Approximate beat/hold distances, the Lenis starting duration and the 2× initial scroll budget are tuning starting points, not locked results or verified current measurements. Assess recordings for motion; retain PNGs for owner review of visual effects.

## Decisions and phase outputs

- [Owner rulings](00-owner-rulings.md): authoritative constraints, Codex model translation, accepted answers and the motion correction.
- [Questions phase](01-questions.md): accepted scope and provisional defaults; approval/resource status.
- [Research report](05-research-report.md), [evidence index](06-evidence-index.md), and [tunnel Astra review](04-tunnel-research-review.md): bounded findings and remaining verification gaps.
- [Final independent Astra review](07-research-review.md): PASS for bounded research; design approval remains with the owner.
- [Design artifact](09-design.md): recovered-opening and private-page design, ready for owner review.
- [Design review](09-design-review.md): independent Astra approval for the design document only.
- [Structure artifact](10-structure.md): page-local runtime, beat data, reuse, poster, and verification boundaries, ready for owner review.
- [Structure review](10-structure-review.md): independent Astra approval for the structure document only.
- [Enclosure agent brief](11-enclosure-agent-brief.md): cross-agent context sharing for the Oryzo/REA findings.
- [Next-session handoff](12-next-session-handoff.md): current phase, exact next action, boundaries, and receiving-session prompt.
- [Next-session handoff](08-next-session-handoff.md): continuation brief location and required skill guidance.
- [Original kickoff](00-kickoff-prompt.md): historical prompt; interpret model references as Haiku = Luna, Sonnet = Sol, Opus = Astra and apply later owner rulings.

Use `codex-tiers` and its actual role/model/effort pins: Luna for mechanics, Sol for implementation, Astra for plan authorship/approval and critical review. Visual effects require Codex Astra approval as well as the owner's PNG-based acceptance. A role name is not proof of the model served.

Phases: questions → research → design → structure → plan → implement. Stop after each for explicit owner approval. First research item remains the full-quality hardware-GL tunnel diagnostic at t≈.84–.98 after JG-035 releases GPU/build/preview resources. Do not change tunnel code before that capture. Captures go under `project/work/evidence/torque-wrench-rebuild/`. No push, PR, deploy or publish.
