# Caption Draft — CH.03 and CH.04

**Purpose:** Bring the deferred chapter narrative closer to the concise, engineering-first voice already established in CH.01/CH.02. These are drafts for owner review, not new feature claims. Existing lines are quoted from `src/data/caseStudies.ts` and the live mechanical beat captions from `src/components/Chapters.tsx`.

## Voice target

The current CH.01/CH.02 voice names the engineering problem, states the mechanism, and lets the material carry the drama. The rewrites below remove broad positioning language and keep the claims measurable: airflow, acoustic attenuation, mounting isolation, scan reconstruction, datums, fits, and tolerance stacks.

## CH.03 — Airflow Against the Noise Floor

| Current source line | Draft rewrite |
|---|---|
| `CH.03 THERMAL / ACOUSTIC` | `CH.03 AIRFLOW / ACOUSTIC` |
| `Airflow Against the Noise Floor` | `Routing Air Without Feeding the Noise Floor` |
| `CFM/FPM airflow math, composite acoustic walls, and vibration-decoupled mounting — silence as an engineering deliverable.` | `CFM/FPM sizing, a 5-layer composite wall, and vibration-decoupled mounts keep the airflow path open while the enclosure controls structure-borne noise.` |
| `Engineered Silence: The Acoustic SAFE Enclosure` | `An Acoustic SAFE Enclosure Built Around the Air Path` |
| `A 5-layer composite acoustic enclosure engineered around real CFM/FPM airflow math and vibration-isolated mounting.` | `A 5-layer composite enclosure sized for the required CFM/FPM flow and isolated from the equipment with vibration-decoupled mounting.` |
| `Designed a 5-layer composite acoustic wall system to attenuate noise without choking airflow through the enclosure.` | `Designed the 5-layer wall system to attenuate noise while preserving the enclosure’s required airflow path.` |
| `Calculated CFM/FPM airflow requirements to size vents and ducting for adequate cooling under the acoustic constraint.` | `Calculated CFM/FPM requirements first, then sized the vents and ducting for cooling inside the acoustic constraint.` |
| `Isolated the enclosed equipment from the housing structure with vibration-decoupled mounting, preventing structure-borne noise transfer.` | `Decoupled the equipment from the housing structure so vibration does not become structure-borne noise.` |

### Beat-caption drafts for CH.03

| Beat | Draft caption |
|---|---|
| C1 / recolor | `DARK-BLUE PAINT // ENCLOSURE ROOTS`  
`Paint changes at the material choke point; panel opacity and the approved Station-2 look remain unchanged.` |
| C2 / intake | `AIR ENTRY // DUCT_INTAKE`  
`Hexagonal intake cutouts set the first boundary condition for the airflow path.` |
| C3 / cross-section | `CUSTOM CHAMBER // S-PATH SECTION`  
`The section exposes the chamber geometry that turns the flow; engine and pump internals remain silhouettes.` |
| C4 / flow | `CFM/FPM ROUTE // INTAKE → CHAMBER → EXHAUST`  
`Particles trace the measured path across the full skid length.` |
| C5 / follow cam | `FOLLOW CAM // AIR PATH`  
`Track the stream from the intake face, through the chamber, past the radiator, and out the hood.` |
| C6 / exit | `EXHAUST PLUME // CHAPTER HANDOFF`  
`The path leaves the enclosure as the camera releases toward the next system.` |

## CH.04 — From Point Cloud to Production Code

CH.04 is deferred in the owner spec. These drafts are therefore **copy-only direction**, not a reopening of the M249 chapter or its backdrop/material design.

| Current source line | Draft rewrite |
|---|---|
| `CH.04 DIGITAL SYSTEMS` | `CH.04 DIGITAL SYSTEMS` |
| `From Point Cloud to Production Code` | `From Measured Geometry to Production Code` |
| `The same tool carries an MSP430, USB, LiPo and LCD manometer — physical systems dissolving into digital ones.` | `The same instrument carries an MSP430, USB, LiPo cell, and LCD manometer — measured hardware carried through into firmware and interface.` |
| `From Point Cloud to Parametric: Reverse-Engineering Mission-Critical Hardware` | `From Scan Data to Parametric Hardware` |
| `3D scan data reconstructed into fully toleranced, manufacturable CAD for the M249/MK46 platform.` | `3D scan data reconstructed into toleranced, manufacturable CAD for the M249/MK46 platform.` |
| `Converted raw 3D scan point clouds of legacy mil-spec hardware into clean, parametric CAD models.` | `Converted raw point-cloud data from legacy mil-spec hardware into clean, parametric CAD.` |
| `Rebuilt ASME Y14.5 GD&T drawings from physical parts with no original technical data package — reverse-engineered datums, fits, and tolerance stacks from scratch.` | `Rebuilt ASME Y14.5 GD&T drawings from physical parts without an original technical data package, recovering datums, fits, and tolerance stacks from the hardware.` |
| `Delivered production-ready drawings meeting mil-spec interchangeability requirements for the M249/MK46 platform.` | `Delivered production-ready drawings for the M249/MK46 platform with the required mil-spec interchangeability.` |

### Beat-caption alignment notes for CH.04

The current source has a CH.02 LCD beat caption, not a separate CH.04 beat-caption block. The existing line is quoted here so the narrative boundary remains explicit:

> `DIGITAL TELEMETRY // REAR ENDCAP`  
> `Smart-Tool Instrument Interface`  
> `MANOMETER LCD (BK11356) · MSP430 MCU · 3.7V LiPo CELL`

If this caption is reused during a later CH.04 pass, the tighter draft is:

> `DIGITAL SYSTEM // INSTRUMENT INTERFACE`  
> `MSP430 CONTROL + LCD MANOMETER`  
> `USB · 3.7V LiPo CELL · MEASURED HARDWARE`

## Deliberate boundaries

No draft adds a product claim, performance number, customer claim, or new capability. The CH.04 language remains a copy proposal only because the owner explicitly deferred M249 work. Tags such as `CFM/FPM`, `5-LAYER COMPOSITE`, `VIBRATION DECOUPLING`, `SCAN-TO-CAD`, `NO TDP`, and `MIL-SPEC INTERCHANGEABILITY` remain unchanged unless the owner requests a separate content review.

## References

[1]: ../../../src/data/caseStudies.ts "Live chapter and case-study copy"  
[2]: ../../../src/components/Chapters.tsx "Live mechanical beat captions"  
[3]: ../animation-redo.md "Animation redo — consolidated owner spec"  
[4]: ../five-plans-synthesis.md "Five-plans synthesis"

Prepared by **Manus AI** for owner discussion.

