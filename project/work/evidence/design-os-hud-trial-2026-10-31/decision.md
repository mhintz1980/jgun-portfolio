# HUD trial decision — 2026-10-31

> **v2 addendum (2026-11-02):** a refined packet now exists — [07-v2-concepts-2026-11-02.md](07-v2-concepts-2026-11-02.md),
> [comparison-sheet-v2.jpg](comparison-sheet-v2.jpg). Concept **D (A+ museum caption)** implements the critic's
> recommendation and every named fix (named rail + edge scrim, per-state caption anchoring, bounded Inspect,
> inspection tech cue + leader, mobile Chapters bar); concept **E (C+ minimal transport)** is the quietest-chrome
> alternative with the same fixes; the technical-inspection content is shown both as cue+disclosure and inline
> (`?tech=`). A/B/C are unchanged.
>
> **RESOLVED 2026-11-03 — owner chose D + inline** ("Lets go with D and Inline", via the v2 reviewer console).
> Production implementation registered as JG-040; ruling recorded in `docs/torque-wrench-rebuild/00-owner-rulings.md`
> § 2026-11-03. Direction choice only — no implementation acceptance is implied by this trial.

**HUD direction: awaiting Mark.** The independent critic recommends A, Museum caption, as the starting point, with a clearer chapter control and a more visible Free Look / Inspect action. C's mobile Chapters control is a useful alternative; its caption overlaps the shaft in the inspection still. B's named desktop chapter list is clear, but its opaque rail covers part of the model. These are design observations for Mark's choice, not an acceptance or instruction to integrate.

**Tool utility: provisional recommendation — retain selected Design OS references and the isolated checker for further evaluation; do not adopt its routing globally.** The pinned package initialized in isolation and its static checker ran on the prototype. The builder did not use the upstream concept template, so there is no valid before/after evidence that it changed this design. A HUD preference cannot establish toolkit causation. See [tool trial](04-tool-trial.md) for exact setup, package/source differences, warning classification, a read-only npm lookup that was inadvertently run from the repository, and the untested LOOK path.

The concept template and design critique overlap with the existing design/motion roster; they may complement `r3f-cad-cinematography`, `r3f-scroll-performance-guard`, and `gsap-scrolltrigger`, which cover the project's actual scene choreography, deterministic state and scroll behavior. The imported checker does not replace runtime telemetry or owner visual judgment. Setup/design/revision minutes were not instrumented; the measured capture time is in [capture evidence](03-capture-baseline.md). Do not invent timings.

These are standalone simulations, with essential technical inspection content and controls requiring future design and interaction proof. Existing part anchors were inactive in the motion segment: compare global chrome only, not moving attached callouts. Narrow motion, detailed accessibility and production integration are deferred. Existing cinematic failures remain recorded, and this trial grants no deployment or implementation approval.

The packet is reviewable, but the minimum trial remains **partial**: the independent critic inspected sampled frames from all four desktop clips, not continuous representative-rate playback. Continuous playback critique remains open; see [critic.md](critic.md).
