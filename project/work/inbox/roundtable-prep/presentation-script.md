# Presentation Script — JGun Animation Redo Round-table Prep

**Audience:** Mark Hintz / owner working session  
**Purpose:** Present the agenda, caption drafts, and three backdrop-evolution directions without pre-deciding the owner ruling.  
**Source branch:** [`spike/roundtable-prep`](https://github.com/mhintz1980/jgun-portfolio/tree/spike/roundtable-prep)  
**Suggested length:** 8–10 minutes, followed by discussion and board selection.

## Opening — why we are here

**Say:**

“Today’s material is a decision aid for the animation redo—not an implementation proposal and not a vote that has already been made. The specific question is how the background and layout should choreograph the owner-dictated beats without competing with the machines.

“The redo spec says backgrounds are critical: they move with the model and add to the experience. At the same time, the existing backdrop system is already shipped and verified. It is dark, camera-locked, scroll-scrubbed, reversible, and live across all four chapters. So the goal is not to replace it with a new visual system. The goal is to evolve its palette, texture frequency, and motion grammar in a way that gives each chapter a stronger sense of place while keeping the CAD as the hero.”

## Ground rules — what is already settled

**Say:**

“Before we look at the boards, there are six constraints that are intentionally locked.

“First, the JG-021 Station-2 visual baseline is approved. The earlier lighting and glow problem is closed. Panels stay opaque, the current material look stays, and this session does not reopen that ruling. The dark-blue enclosure paint is a separate owner-dictated C1 recolor; we are deciding what the backdrop does around that recolor, not reconsidering the material baseline.

“Second, the atmosphere remains quiet and dark. The shipped system peaks around 0.032 linear luminance against a 0.6 bloom gate. That margin is part of the design language, not a problem to solve. The light canon is soft enough that nobody needs to squint, but still sharp and legible for engineering information.

“Third, all motion must remain reversible under reverse scroll. The background cannot behave like a world-spanning environment because the current system is camera-locked by design. Fourth, there is no exit button, persistent scrubber, or new HUD chrome. Fifth, measured geometry and part-number identity remain the source of truth. Finally, CH.04 M249 material work is deferred; anything we show at that boundary is only a handoff, not a new CH.04 decision.”

## How the agenda is organized

**Say:**

“The agenda turns those rules into concrete questions at every background-sensitive beat. It covers B1 through B5 in the JGun drawing-to-3D sequence and C1 through C6 in the RL-300 airflow sequence.

“For B1, we need to decide where the large engineering drawing sits and how the atmosphere protects the dimensions and GD&T overlay. For B2, we need to decide whether the background acknowledges the one-time line pulse and aligned rise with only a soft pool, a limited film response, or a quiet seam. For B3 and B4, the key question is when the field should hold still so the mechanism or the selected subassembly can be understood.

“B5 is the largest layout question: how much inspection-table presence should we show on desktop and on the 390-by-844 mobile viewport? In CH.03, we need the backdrop to support the dark-blue paint recolor, isolate the intake, preserve the deliberately constrained cross-section, and leave the C4 S-path particles as the main motion. At C5 and C6, we need a clean lateral follow and a plume exit that leaves room for the deferred chapter.

“The agenda also includes the cross-cutting gates: choose a direction, set the low/medium/fine frequency roles, identify which beats move and which beats hold, protect readability, decide mobile composition, and keep the build fence clear of FBOs, video, sound, world parallax, persistent chrome, and new always-on post effects.

“For the record, the CH.03 sequence is covered beat by beat: **C1** is the dark-blue paint relationship; **C2** is the hexagonal intake highlight; **C3** is the constrained chamber cross-section; **C4** is the full-length S-path flow visualization; **C5** is the lateral follow camera; and **C6** is the rising plume and chapter handoff.”

## Board 01 — Quiet Warm Bench

**Show:** `backdrop-board-a-warm-bench.html`

**Say:**

“Direction A is **Quiet Warm Bench**. This is the most atmospheric and least literal option. It treats the shipped low-frequency wash as the floor, then adds a soft bench-like pool per chapter. The engineering field is sparse and recedes during comprehension beats.

“In CH.01, the warm key supports the drawing-safe opening and gives B2’s rise a small amount of contrast without turning the pulse into a light show. CH.02 cools into a clearer, quieter bench with thin datum marks so the axial explode can read. CH.03 becomes a deep teal hush, with the S-path particles carrying the motion rather than the field. CH.04 receives the plume in near-black negative space and stays intentionally quiet because that chapter is deferred.

“The advantage is restraint. It is the lowest-risk direction for readability and the easiest to keep under the luminance gate. The question for the owner is whether the warm bench metaphor gives B5 enough physical presence, or whether it remains too implied for a session where backgrounds are supposed to matter.”

## Board 02 — Blueprint Film

**Show:** `backdrop-board-b-blueprint-film.html`

**Say:**

“Direction B is **Blueprint Film**. This evolves the existing StaticPoster and JG-023 grid language rather than introducing a new visual metaphor. The field behaves like a technical film under the scene: visible enough to connect the drawing, the explode, and the cross-section, but quiet enough to disappear when the machine needs the frame.

“CH.01 uses warm datum traces around the drawing. CH.02 uses a cyan orthographic film to help the axial ladder register. CH.03 uses chamber registration marks to identify intake and exhaust without pretending to be a thermal simulation. CH.04 receives the outgoing plume on an almost-empty violet film and makes no decision about point-cloud motion.

“The advantage is continuity. This direction has the strongest direct connection to the existing engineering-drawing language and the lowest identity risk. Its risk is flattening the physical scene if the grid becomes wallpaper. The owner question is whether this gives us enough continuity from B1’s drawing to C3’s section without making the CAD feel like it is sitting on a drafting overlay.”

## Board 03 — Chamber Field

**Show:** `backdrop-board-c-chamber-field.html`

**Say:**

“Direction C is **Chamber Field**. This is the most spatial option. It treats the background as a quiet measurement surface with three roles: a low environmental mood, a medium engineering field with only three to six sparse anchors, and an optional fine atmosphere that is nearly absent.

“CH.01 uses a bench coordinate field. CH.02 uses axial registration marks. CH.03 is the strongest expression of the airflow story: intake, turn, and exhaust become sparse anchor zones while the actual C4 particle route remains the only moving explanation of the S-path. CH.04 becomes a receiving field only, so the plume can exit without prematurely designing the M249 chapter.

“The advantage is spatial logic. It can make the camera beats feel authored rather than simply decorated. The risk is that it may read as a measurement overlay instead of atmosphere. The owner question is whether those anchor zones clarify the story or make the background too diagrammatic.”

## Caption draft — narrative voice

**Say:**

“The caption draft applies the existing CH.01 and CH.02 voice to CH.03 and CH.04. The principle is simple: name the engineering problem, state the mechanism, and avoid marketing language or unsupported claims.

“For CH.03, the proposed title is **‘Routing Air Without Feeding the Noise Floor.’** The supporting line names CFM/FPM sizing, the five-layer composite wall, and vibration-decoupled mounting. The beat captions then follow the physical story: `AIR ENTRY // DUCT_INTAKE`, `CUSTOM CHAMBER // S-PATH SECTION`, `CFM/FPM ROUTE // INTAKE → CHAMBER → EXHAUST`, and `EXHAUST PLUME // CHAPTER HANDOFF`.

“For CH.04, the proposed title is **‘From Measured Geometry to Production Code.’** The rewrite keeps scan data, toleranced manufacturable CAD, ASME Y14.5 GD&T, datums, fits, tolerance stacks, and mil-spec interchangeability. It does not add a new capability claim, and it remains copy-only because M249 implementation is deferred.

“The draft also records a boundary that matters: the live LCD caption belongs to the current rear-end reveal in CH.02, not to a separate CH.04 beat. If it is reused later, the tighter wording is `DIGITAL SYSTEM // INSTRUMENT INTERFACE` and `MSP430 CONTROL + LCD MANOMETER`.”

## Decision sequence

**Say:**

“I recommend that we make the decisions in this order, without treating that order as a design recommendation. First, select one board or a deliberate combination. Second, identify the moments where the field must hold still. Third, decide the mobile composition: what stacks, crops, or disappears at 390 by 844. Fourth, confirm that the chosen direction supports the B1 drawing, B5 inspection table, C3 section, and C6 plume without inventing a new effect system.

“After the session, the selected direction would still need implementation-level proof: same-frame desktop and mobile captures, forward-and-reverse checkpoint identity, DOM safe-area checks, luminance and bloom measurements, tier behavior, and a performance/bundle audit. The board does not bypass those gates.”

## Closing prompt

**Say:**

“The owner decision we need today is not ‘which background looks coolest?’ It is: **which quiet visual grammar gives the animation the most useful sense of place while preserving the machine, the engineering information, and the reverse-scroll behavior?**

“Please point to the direction that gets closest, identify what should be borrowed from the others, and call out any beat where the background should deliberately do nothing. The agenda will record those rulings as open decisions; no implementation choice is being smuggled in through the boards.”

## Presenter reference table

| Material | What to show | One-line takeaway |
|---|---|---|
| `AGENDA.md` | Locked-fact section, then the B1–B5/C1–C6 decision table | Every background-sensitive beat has an explicit question, options, cost note, and locked boundary. |
| `backdrop-board-a-warm-bench.html` | Four chapter cards side by side | Atmosphere first: soft bench pools, minimal field, maximum restraint. |
| `backdrop-board-b-blueprint-film.html` | Four chapter cards side by side | Continuity first: evolve the shipped blueprint-grid language into a technical film. |
| `backdrop-board-c-chamber-field.html` | Four chapter cards side by side | Spatial logic first: sparse anchors and section boundaries support the camera beats. |
| `captions-draft.md` | CH.03 table, then CH.04 table and boundary note | Precise engineering copy, no new claims, CH.04 remains deferred. |

## References

[1]: AGENDA.md "Round-table agenda"  
[2]: backdrop-board-a-warm-bench.html "Direction A — Quiet Warm Bench"  
[3]: backdrop-board-b-blueprint-film.html "Direction B — Blueprint Film"  
[4]: backdrop-board-c-chamber-field.html "Direction C — Chamber Field"  
[5]: captions-draft.md "CH.03 and CH.04 caption draft"  
[6]: ../animation-redo.md "Animation redo — consolidated owner spec"  
[7]: ../five-plans-synthesis.md "Five-plans synthesis"

Prepared by **Manus AI** for the owner working session. This script summarizes decision material; it does not decide the design.
