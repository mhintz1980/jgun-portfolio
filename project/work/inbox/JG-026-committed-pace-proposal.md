# Proposal — committed-pace moments ("scroll-jacking")

**Raised by:** Mark, 2026-09-05, during the JG-026 B1/B2 review.
**Status:** one candidate implemented (inside the B1/B2 intro window); the rest await his ruling.
**Related:** [JG-026 verification §5](../evidence/JG-026-b1-b2-verification.md), `src/scene/scrollCommit.ts`.

> "There are times we will want to move the user along at a pace we dictate to ensure the
> experience happens as we intend, especially when navigation can be unclear or when rapid
> movement is necessary."

## Constraints that do not bend

These govern every candidate below and are not negotiable per moment:

1. **No exit button, ever.** The exit is the gesture the visitor was already making.
2. **Escape is accessibility parity only** — it cancels and disables the assist for the session.
   It is not a second UI and is never advertised.
3. **Reverse scroll stays fully reversible and deterministic.** An assist may only change where
   the visitor lands; every scroll position must remain reachable, and the rendered frame must
   remain a pure function of scroll position.
4. **Nothing may trap a visitor who scrolls against the committed direction.** Any input —
   wheel, touch, key, pointer — cancels immediately and for the rest of that pass.
5. **Reduced motion is never scroll-jacked at all.** In that tier `ScrollRig` does not mount, so
   this is structural rather than a runtime check.
6. Inert whenever a proof probe has pinned progress (`__drawingProofProgress`) or set
   `__scrollCommitDisabled`, so the verification harness is never fought.

## The shape used

Not a pin, not a lock, not a hijacked wheel event. A **rest-triggered commit**: while the
visitor is inside a committed window and has stopped scrolling for 260 ms with velocity below
0.02 raw/s, the page eases toward whichever end of the window they were last travelling
toward. It changes where you come to rest, not whether you can go anywhere.

---

## Candidate 1 — the detachment commit · **IMPLEMENTED**

* **Where:** B1/B2 intro, normalized 0.86 → 1.00 (paced progress 0.1032 → 0.1200, 72.5vh + 36.2vh
  of absolute scroll).
* **What is committed:** the run from the model beginning to leave the sheet, through the single
  shockwave pass, to the print's fade and the handoff to CH.01.
* **Why:** this is the one place in the sequence where stopping produces a frame that reads as
  *broken* rather than as a pause — the JGun frozen mid-separation with a half-crossed wave.
  Everywhere else, a still frame is a legible drawing or a legible machine.
* **How the visitor gets out:** any input cancels and the assist does not re-arm during that
  pass. Escape cancels and disables it for the session.
* **Under reverse scroll:** symmetric. Stop while travelling upward inside the window and it
  completes *upward*, back to 0.86, not forward.
* **Ease:** 1.15 s, Lenis `scrollTo`, cancelled on `onComplete` or on input.

## Candidate 2 — the mobile sheet pan · **IMPLEMENTED as camera choreography, not as an assist**

* **Where:** B1/B2 intro on narrow viewports, normalized 0.00 → 0.30.
* **What happens:** the camera pushes in and pans across the C sheet (whole sheet → title block
  → view block → settle on the primary elevation). This is authored camera motion driven by
  scroll; the visitor's scroll rate is untouched.
* **Why it is on this list:** it is the strongest *candidate* for a committed pace, because a
  visitor who scrubs through it sees a blur of sheet fragments rather than a tour. If Mark wants
  it committed, the same rest-trigger shape applies with the window 0.00 → 0.30.
* **Recommendation:** leave it as pure choreography for now and judge it in the visual pass. The
  intro is already 3.9× longer in absolute scroll; committing the opening may read as the page
  taking control before the visitor has decided to be there.

---

## Candidates OUTSIDE the B1/B2 window — proposal only, not built

Listed in descending order of how much I think they would help.

### 3. The station-2 whip-pan · progress 0.525 → 0.600

* **Committed:** the flight from the JGun to the RL-300 enclosure.
* **Why:** this is the "rapid movement" case Mark named. Mid-flight the camera is 3–4 m from
  anything, pointed at empty world; there is no subject and no chapter card. A visitor who stops
  here is looking at nothing and has no cue about which direction resumes the experience.
* **Out:** any input. **Reverse:** stopping while travelling back completes back to 0.525.
* **Risk:** low. The window is short (75.5vh after pacing) and carries no readable content.
* **My recommendation: yes.**

### 4. The station-3 transition · progress 0.720 → 0.760

* Same argument as candidate 3, shorter window (30.2vh after pacing).
* **My recommendation: yes, if 3 is approved — they should behave identically or not at all.**

### 5. The rear-LCD dwell · progress 0.420 → 0.525

* **Committed:** the orbit to the rear endcap, the dwell, and the return.
* **Why:** the dwell is the payoff of a camera move that costs ~250vh; stopping on the way in
  parks the viewer on the back of a housing.
* **Against:** this window contains real content the visitor may legitimately want to sit with —
  the LCD is the point of JG-025. Committing it removes the ability to stop and look.
* **My recommendation: no.** This one wants the *opposite* — it is a candidate for a rest hold,
  not a commit.

### 6. Chapter-card entry alignment · every `CHAPTER_RANGES` boundary

* **Committed:** snapping to the point where a chapter card is fully faded in.
* **Why:** cards fade over 0.035 progress; stopping inside that window leaves copy at half
  opacity.
* **Against:** four snap points across the page is where a committed pace stops being invisible
  and starts feeling like the page arguing with the scroll wheel.
* **My recommendation: no.**

---

## Open questions for Mark

1. Approve candidates 3 and 4 (the two flights)?
2. Commit the mobile intro pan (candidate 2), or leave it as choreography?
3. Candidate 5 — should the LCD dwell instead get a *hold* (resist leaving) rather than a commit?
