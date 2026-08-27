# JGUN GD&T Annotation Style

This is the durable design and implementation reference for print-authentic datum and feature-control annotations in the JGUN animation. It is based on the supplied gearbox drawings: P000420, P000429, P000473, P001132, and P001812.

## Approved Visual Language

A datum annotation uses a boxed capital letter attached at a right angle to an extension line or leader. A feature-control frame uses individual bordered cells for the geometric characteristic, tolerance, verified material modifier when applicable, and ordered datum references. Keep the datum flag and feature-control frame orthographic and horizontal; only the leader itself may be diagonal.

The existing generic dark “DATUM” chip, decorative radar reticle, and CSS perspective/rotation do not represent this drawing language and must not be introduced in new work.

## Drawing-Derived Conventions

| Source | Verified convention | Permitted use in the animation |
|---|---|---|
| P000420 — Intermediate Air Housing | `LOWER GROOVE OSHA BLUE`; `UPPER GROOVE OSHA RED`; `3X @120°`; geometric controls that terminate in datum `A`; after-operation controls adjusted for nickel plating. | P000420 ring-switch/groove sequence and related process notes. |
| P000429 — Big Housing | Boxed datum `A`, compact datum-referenced frames, timing-hole note, and functional spline language. | Housing/spline and timing-feature callouts. |
| P000473 — Output Shaft | Boxed datum `A` associated with the output spline; functional-spline and local feature-control treatment. | Output-spindle inspection callouts. |
| P001132 — Impact Housing | Distinct datum `A` and `B` flags; stacked control-frame structure near a pattern feature; timed spline language. | Multi-datum or true-position-style examples after exact feature matching. |
| P001812 — Input Shaft | Datum-A-centered controls across local shaft features; functional gear-length and center-of-cam notes. | Input-side/gear-system annotations. |

## Literal Transcription Rule

Use a feature-control glyph, tolerance value, material modifier, or datum sequence verbatim only after verifying the exact feature and frame in the corresponding drawing at readable scale. Do not infer a symbol from a low-resolution overview. The user-approved example of a true-position frame may be used only for the matched controlled feature.

## Animation Rule

One active feature-control frame or datum callout may accompany a mechanical beat. Annotation may identify the visible part but may not cover the feature. Narrative content belongs in a narrow edge caption or on-demand case-study surface outside the key reveal window.
