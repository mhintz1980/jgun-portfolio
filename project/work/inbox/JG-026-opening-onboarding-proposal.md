# Proposal — opening text and onboarding (JG-026 Item 6)

**Raised by:** Mark, 2026-09-05, during the JG-026 B1/B2 review.
**Status:** design only. **The scroll window it will occupy is already reserved and built.**
**Related:** [JG-026 verification §2, §13](../evidence/JG-026-b1-b2-verification.md),
`INTRO_PHASES.onboardStart/onboardEnd` in `src/scene/drawing/introTimeline.ts`.

## The problem, in Mark's framing

A first-time visitor dropped onto this page sees a blurred sheet, no animated text and no cue.
There is a real chance they read it as frozen or broken. They need to learn, without a tutorial,
that scrolling drives the experience — **forwards and backwards** — and they need to feel they
are inside something rather than looking at a stalled image.

A discreet pointer is acceptable. A lesson is not. No modal, no "scroll to continue" badge that
outstays its welcome, nothing that feels like work.

## The reserved window — already in the build

| | Value |
|---|---|
| Normalized intro range | **0.14 → 0.30** |
| Paced progress range | 0.0168 → 0.0360 |
| Absolute scroll | **145.0vh** |
| Raw document scroll | 0.042 → 0.090 |

**What currently happens in it:** nothing but a hold. The focus rack has completed
(`focus = 1.000` at 0.14) and the print is sitting fully sharp and fully opaque. The excitation
does not start until 0.30, the PBR activation and the lift do not start until 0.56, and the
camera orbit does not start until 0.46. On desktop the camera is static at the fitted sheet
pose; on mobile this window carries the tail of the push-in and the pan to the view block.

The reservation is asserted in the test suite and in the pure-math contract check
(`reserved.focus === 1`, `pulse === 0`, `pbr === 0`, `poseT < 0.4`, `drawingOpacity === 1`), so
nothing can quietly colonise it before the text is built.

**This is why adding the text later cannot force a second pacing pass.** Its 145.0vh already
exists in the 3120vh document; the phase map, the pose reparameterization and every downstream
window are already sized around it.

## Proposed design

Mark offered two placements — over the blurred sheet, or after the focus rack as an orbit
before the pulse. **Recommendation: after the focus rack**, i.e. exactly the reserved window.
Over the blurred sheet the text competes with the one thing the opening beat is doing (the
print resolving); after it, the print is sharp and legible and the text has a stage.

Three beats inside 0.14 → 0.30, all scroll-scrubbed, none time-driven:

| Beat | Window | Content |
|---|---|---|
| A. Identify | 0.14 → 0.19 | The drawing's own title-block line lifts off the sheet in DOM type and settles — `JGUN / D1-AP · PNEUMATIC TORQUE MULTIPLIER`. It reads as the print introducing itself, not as a website headline. |
| B. Frame | 0.19 → 0.26 | One line, ~7 words, stating the site's thesis — concept to reality. Placement in the left card lane the chapter cards already use, so the visitor learns where copy lives. |
| C. Teach, without teaching | 0.26 → 0.30 | The discreet pointer. |

### The pointer (beat C) — the part that carries the onboarding job

A small vertical rule in the bottom-left margin, in the HUD's monospace register so it reads as
instrumentation rather than as a call to action. It is **driven by the visitor's own scroll**,
not by a timer:

* it draws itself downward as they scroll forward and **retracts upward as they scroll back**;
* a caret sits at its head and flips direction with the sign of the scroll velocity;
* it fades out permanently once the visitor has scrolled backward at least once, or by
  normalized 0.30 regardless.

The reversibility lesson is taught by the thing itself responding to reverse scroll, which
is the only way to teach it without saying it. Nothing to dismiss, nothing to read.

Under reduced motion: beats A and B render as static DOM copy at the top of the card stack;
beat C does not render at all — a motion-driven pointer is exactly what that tier opts out of.

### The "is it broken?" case, specifically

The reserved window does not solve it on its own, because a visitor who has not scrolled at all
sits at normalized 0.00, in the focus rack, before any of this. Two additions outside the
reserved window, both cheap and both proposed rather than built:

1. **The focus rack should not start fully blurred.** It currently starts at blur radius 2.5 and
   resolves by 0.14. Starting at ~1.6 keeps the "unresolved" read while leaving enough structure
   that the first frame is legibly *a drawing*, not a smear.
2. **First-frame motion without scroll.** A single slow breath on the sheet — the print's ink
   luminance drifting a few percent over ~4 s — proves the page is live before the visitor has
   touched anything. It is the only wall-clock motion I would propose anywhere in the intro, and
   it must stop the moment scroll begins.

Both need Mark's ruling: (1) trades a little of the reveal for legibility, and (2) puts one
non-scroll-driven animation into a sequence that is otherwise entirely deterministic.

## Open questions for Mark

1. Placement confirmed as the reserved window (after the focus rack), or over the blurred sheet?
2. Exact copy for beat B — that is his line to write, not mine.
3. The pointer: accept the retracting-rule form, or does he want something else discreet?
4. Rulings on the two "is it broken?" additions above.
