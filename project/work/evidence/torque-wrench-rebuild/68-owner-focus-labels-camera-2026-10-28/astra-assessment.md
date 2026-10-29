# Astra arbitration of NotebookLM camera recommendation

Configured role tier-reviewer, fixed GPT-6 Astra / medium; agent 01a184b6-9218-74f2-bbb8-b7a40f29e1f8. This is the owner-requested creative/technical arbitration, not an adversarial implementation review. Opus-5.5/high attempt 01a184b5-a243-7bf3-a274-eaa385acd9c8 failed before delivery with 401 OAuth authentication failure; Astra is an already owner-authorized alternative. No silent model substitution outside the accepted lineup.

## Decision

Approve the **concept only**: a straight parallel rail with a fixed oblique view. Camera and target translate together, C(t)=T(t)+fixedOffset, with stable FOV during the rail. Animated yaw is unnecessary for the primary concept. No drivetrain camera implementation or owner visual acceptance follows from this verdict.

Current source already has 60.6 mm radial offset but 211.5 mm axial lead at desktop, yielding only ~16 degrees off the gearbox axis. The look angle, rather than merely rail offset, needs to change.

Revise NotebookLM's 45-degree example to a **55–65-degree candidate**. The repository's explicit |viewDir dot axis|<.6 guard requires >53.13 degrees; its accompanying 30-degree prose is inconsistent with that inequality. A coherent initial candidate is **100 mm total radial offset, 57.7 mm axial lead**, preserving the current output-side sign: **60 degrees off-axis, 115.5 mm standoff**.

## Limits and next authoring proof

- The exact fit is unproven. At unchanged 22-degree vertical FOV, target-plane vertical coverage would shrink from ~85.5 mm at 220 mm standoff to ~44.9 mm at 115.5 mm. Installed active CAD extents, occlusion and desktop/narrow HUD clearance must determine final distance/lens. Do not promise a full-assembly fit or arbitrarily shrink the subject.
- Continuity is not automatic. Track a continuous target and match entry/exit position, target, orientation/up, FOV and first derivatives in existing timing windows. Do not snap between carrier anchors or copy NotebookLM's claim that a fixed rail alone guarantees C1 joins.
- Preserve owner-accepted pacing, reveals, ratios, rotation, source phase, materials and lighting. No DoF/history damping or camera-driven mechanical changes.
- Notebook citations support general perspective/sparse-path/progress principles, not these numerical dimensions. The corrective answer supplied no verified reference objects.

Astra inspected the scoped source/research but changed no files and ran no tests/build/browser. Present the revised concept to the owner before drivetrain-camera implementation; prepare 3–4 real reveal milestone stills and a short scroll preview only after that direction is selected.
