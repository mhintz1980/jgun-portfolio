# Enclosure agent brief — Oryzo/REA context sharing

## Purpose

Share the torque-wrench session’s transferable motion, background, shell, and verification findings with the agent working on the enclosure section. This is context sharing, not an authorization to expand that section’s scope or to implement the torque-wrench page.

## Read first

1. Oryzo/Lusion teardown: `C:/vaults/markimus-SecondBrain/04-Projects/Portfolio-Site/oryzo-lusion-teardown.md`
2. Torque-wrench design: [09-design.md](09-design.md)
3. Torque-wrench structure: [10-structure.md](10-structure.md)
4. Owner rulings: [00-owner-rulings.md](00-owner-rulings.md)
5. Motion standard: [smooth-scrolling.md](smooth-scrolling.md)

## What to carry forward

- Treat Oryzo’s smoothness as an architecture, not a single easing number: native scroll plus virtual smoothing, per-section state, `fit()`-style choreography, continuous post-profile blending, and pointer response that stays separate from deterministic narrative state.
- Treat the subtle layered background as its own authored system. Depth layers, parallax, dither, and continuous grade blending should be designed explicitly; they are not side effects of post-processing or pointer motion.
- Keep each page’s runtime local. One persistent canvas per document, hard navigation through dark, no cross-document canvas or scroll state.
- Keep beat data scroll-length independent and extensible; adding a later mini-animation should not require editing the scroll spine.
- Use high-quality offline renders for reduced-motion and poster paths. Those paths must not download narrative CAD or mount narrative WebGL.
- Treat the Oryzo-derived tuning values as candidates to validate in your section, not universal constants to copy.

## REA

The Oryzo teardown was produced with REA from the cloned repo referenced in that document. Review REA’s available tools and use cases, then assess whether any additional capabilities apply to the enclosure section or to the project generally. Record any proposal with specific evidence and keep it inside your section’s approved scope; do not treat REA availability alone as authorization to expand scope.

## Ready-to-paste prompt

```text
Read C:/vaults/markimus-SecondBrain/04-Projects/Portfolio-Site/oryzo-lusion-teardown.md, then read docs/torque-wrench-rebuild/09-design.md, 10-structure.md, 00-owner-rulings.md, and smooth-scrolling.md in C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench. Use the torque-wrench session’s transferable findings for the enclosure section: architecture-level Oryzo motion patterns, explicit layered-background design, page-local runtime boundaries, scroll-length-independent beat data, high-quality offline poster/reduced-motion rendering, and separate pacing/input/camera-continuity verification. Also inspect the REA tooling in the cloned repo used to produce the teardown; review its available tools and use cases and report whether any additional REA capabilities would improve the enclosure section or the project generally. Treat this as context sharing and analysis only, not authorization to expand scope or implement outside your section.
```
