# J-GUN Experience Improvement Recommendation

## Objective

Make the J-GUN section feel like a **high-end mechanical engineering film**.

Keep:

- CAD accuracy
- real GD&T data
- correct mechanical motion
- real part relationships
- strong technical credibility

Reduce:

- visual noise
- competing HUD elements
- unnecessary camera motion
- effects that do not support the engineering story

Each scene should explain **one mechanical idea at a time**.

---

## 1. Drafting-Sheet Opening

Fix the opening before adding more effects.

### Drawing Corrections

- Fix the side-profile pulse registration.
- Keep the pulse aligned with the drawing.
- Keep title-block text inside its boundaries.
- Precompute stable drawing geometry when possible.
- Reduce cold-load drawing time.
- Keep the warm vellum, navy drawing style, and drafting-table setting.

### Camera

Use fewer, stronger camera moves.

Recommended sequence:

1. Open close to one drawing detail.
2. Move across the drawing.
3. Reveal the complete sheet.
4. Settle square to the main side view.
5. Start the J-GUN extraction.

Avoid many small camera changes.

---

## 2. Paper Flex Before Extraction

Before the J-GUN becomes physical, make the drafting sheet react to it.

The paper should feel like **thin vellum under pressure**, not rubber.

Recommended sequence:

1. Keep the drawing flat.
2. Build pressure beneath the J-GUN profile.
3. Bow the paper slightly upward in the direction of extraction.
4. Let the drawing linework bend with the sheet.
5. Add a soft shadow around the raised area.
6. Begin revealing the physical J-GUN.
7. Let the paper settle back toward flat as the tool separates.

### Implementation

Use a subdivided sheet mesh with controlled vertex displacement.

Drive the deformation from:

- J-GUN profile mask
- distance from the model centerline
- extraction progress
- lift direction

Do not use cloth simulation unless testing proves it is necessary.

Keep the deformation restrained. The effect should communicate **pressure and release**, not stretching.

---

## 3. Drawing-to-Metal Signature Shot

Make this the main visual event of the J-GUN section.

Recommended sequence:

1. Hold exact drawing-to-model registration.
2. Excite the J-GUN profile line.
3. Flex the paper upward.
4. Let physical metal appear through the drawing.
5. Add controlled contact-shadow separation.
6. Lift the J-GUN away from the paper.
7. Allow the paper to settle.
8. Add one restrained light sweep across the metal.
9. Pull the camera back.
10. Reveal the complete physical J-GUN.

During this sequence:

- hide most HUD elements,
- remove unrelated text,
- keep the J-GUN as the strongest object on screen.

The paper deformation should give the extraction a **physical cause** instead of making the model simply appear.

---

## 4. Tolerance Stations

Keep the current one-at-a-time station system.

Each station should follow the same pattern:

1. Move toward the real feature.
2. Make the feature visible.
3. Highlight the required part.
4. Reveal the leader.
5. Build the feature control frame.
6. Show the short process note.
7. Hold long enough to read.
8. Retract the station.
9. Move to the next feature.

### Rules

- Keep GD&T overlays in screen space.
- Keep line weights stable during camera motion.
- Hide leaders while their referenced feature is blocked.
- Remove unrelated HUD information during inspection.
- Do not show several technical stories at the same time.

### General Rule

> **No leader should identify a hidden feature without first giving the user a way to see it.**

Apply this to:

- shifter fork
- air motor
- buried gears
- clutch components
- other hidden inspection features

---

## 5. Shifter Fork Localized X-Ray Reveal

The shifter fork should not receive a leader while the housing hides it.

Recommended sequence:

1. Move toward the clutch area.
2. Apply a localized transparency, Fresnel, or cutaway effect to `P000245`.
3. Reveal `P000724`.
4. Reveal `P000297`.
5. Highlight the milled fork profile.
6. Anchor the `.004 A E` tolerance callout.
7. Hold the inspection.
8. Restore the housing.

The user should see the feature before the leader identifies it.

---

## 6. Air Motor Localized Reveal

Give the air motor the same visibility logic as the shifter fork.

Recommended sequence:

1. Move the camera toward the rear handle and motor zone.
2. Keep the rotor leader hidden.
3. Begin a localized reveal through the rear housing.
4. Show the rotor and air-motor housing clearly.
5. Highlight the active motor feature.
6. Anchor the leader directly to the visible motor.
7. Show the technical callout.
8. Restore the housing after the inspection.

### Preferred Visual Treatment

Start with a **localized ghost or X-ray reveal**.

Use a sectional cut window only if the internal motor remains difficult to read.

Avoid turning the entire handle transparent.

The reveal should remain focused on the inspection area.

---

## 7. Planetary Gear Inspection

Add one detailed mechanical inspection beat.

Recommended sequence:

1. Pause the main drivetrain rotation.
2. Select one planet pinion.
3. Move it outward along Datum D.
4. Show the `.001 D` runout callout.
5. Show `ISO 1328 GRADE A6`.
6. Rotate the planet on its pin.
7. Reseat the planet into the carrier.
8. Resume normal planetary motion.

Keep the correct driveline order and rotation relationships.

This should become one of the strongest mechanical moments in the site.

---

## 8. Air Motor and Other Callout Fixes

### Air Motor Anchor

- Re-anchor the rotor callout to the real motor assembly.
- Keep the anchor attached during handle movement.
- Transition smoothly from the gearbox toward the air motor.

### Leader Lines

Standardize all leaders.

Use:

- clean doglegs,
- consistent shelves,
- ASME datum symbols,
- real feature anchors.

Do not use decorative leaders that point at general areas.

### LCD

Use the label:

**DIGITAL MANOMETER**

Supporting note:

**BACKLIT DIGITAL MANOMETER**

---

## 9. Background and HUD

Remove the large moving background words.

Replace them with a restrained CAD environment.

Use:

- dark orthographic grid,
- `1.000"` major divisions,
- `0.100"` minor divisions,
- faint Datum A centerline,
- subtle depth or parallax response,
- very small background motion.

Optional effects:

- one slow scan wave,
- one datum pulse,
- one reticle pulse.

Do not run several background effects at once.

The J-GUN must remain the strongest object on screen.

---

## 10. Materials and Lighting

Create clearer differences between:

- black anodized housings,
- machined steel,
- hardened gears,
- black-oxide hardware,
- stainless parts.

### Planetary Components

Tune cages and gears toward a hardened 4340 steel appearance.

### Ring Switch

- Keep the raised diamond knurl visible.
- Keep the planar end faces smooth.

### Hardware

Use black-oxide finishes for:

- pins,
- plungers,
- selected screws and hardware.

### Lighting

Use bloom only when it adds meaning.

Increase it during:

- active inspection,
- selected highlights,
- controlled transition moments.

Keep normal viewing states crisp.

Use contact shadow or restrained AO only where it improves mechanical depth.

---

## 11. Exploded Assembly

Keep the correct rear-extraction order.

Improve the presentation:

- separate stages in mechanical order,
- pause at important assemblies,
- rotate parts only when motion explains function,
- keep camera framing clean,
- show fewer annotations at once,
- use a short section or clipping-plane shot when it explains internal relationships better than ghost transparency.

The exploded sequence should explain the drivetrain.

It should not only show parts moving apart.

---

## 12. Final Hero Shot

End the J-GUN section with the complete assembled tool.

Use:

- dark studio lighting,
- minimal HUD,
- slow camera movement,
- strong but controlled metal reflections,
- clean silhouette,
- no engineering callouts.

Let the finished J-GUN remain on screen before moving to the next project.

After the guided sequence, allow optional user inspection.

Possible controls:

- rotate,
- explode,
- select major assemblies,
- inspect selected parts.

Do not give free camera control during the cinematic sequence.

---

## 13. Performance

Do not rebuild the current React/R3F architecture.

Optimize the expensive work first.

### Priority

- reduce drawing bake time,
- precompute stable drawing geometry,
- reduce first useful frame delay,
- avoid unnecessary runtime geometry processing.

Use LOD only when measurements show detailed geometry creates a real performance problem.

Good LOD candidates include:

- fasteners,
- internal splines,
- hidden internals,
- fine chamfers.

Do not prioritize KTX2/Basis conversion unless new texture-heavy assets create a real VRAM problem.

---

## 14. Mobile

Do not only scale the desktop version down.

Create a mobile composition.

Use:

- fewer overlays,
- shorter camera paths,
- tighter feature framing,
- larger readable callouts,
- fewer simultaneous technical elements.

Keep the same engineering story.

Change the presentation to fit the screen.

---

# Recommended Build Order

1. Fix drawing registration and title-block defects.
2. Add controlled paper flex before extraction.
3. Improve the drawing-to-metal lift-out.
4. Build the localized shifter-fork reveal.
5. Build the localized air-motor reveal.
6. Build the isolated planet-gear inspection.
7. Remove the large background typography.
8. Simplify the HUD during tolerance stations.
9. Fix remaining callout anchors and leader behavior.
10. Refine materials and lighting.
11. Improve exploded drivetrain choreography.
12. Add the final hero beauty shot.
13. Reduce drawing startup time.
14. Tune mobile and measured performance.