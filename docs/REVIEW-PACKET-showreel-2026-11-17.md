# Review packet: showreel film, Higgsfield batch 1 (2026-11-17)

Film session → homepage session. Status: **first test batch only. No cut has changed. `public/video/showreel-v3.mp4` is untouched.**

Worktree: `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/jg-041-higgsfield-improvements-d032fb`
Branch: `jg-041/higgsfield-improvements`, created from `jg-041/armament-wiring` @ `70b4a1a2` (still the newest film work; a hook blocks writes into the armament worktree, so the work moved here). Nothing committed, nothing pushed.

All files below are in `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/jg-041-higgsfield-improvements-d032fb/remotion/review/hf-2026-11-17/` (untracked).

## 1. Changed shots, with geometry comparison

No shot in the film has changed yet. Batch 1 was a test of what Higgsfield does to geometry.

| File | What it is |
|---|---|
| `seedA-carbine-f0000.png` | Seed: real line + shade frame f0000 of the representative AR-15-pattern carbine on paper, no text |
| `clipA-carbine-kling-turbo.mp4` | Clip A: image-to-video from that seed, Kling 3.0 Turbo, 5 s, 1080p. Clay render resolves to black anodized metal, slow push |
| `clipA-geom-start.jpg`, `clipA-geom-mid.jpg`, `clipA-geom-end.jpg` | Real render (registered to the generated frame by silhouette) beside the generated frame, edge overlay (cyan real, red generated, white agree), and difference |
| `clipA-edges-{start,mid,end}.png` | Edge overlay only, cropped to the part |
| `clipA-geom-report.json` | Numbers |
| `clipA-end-receiver-crop.png` | Receiver close crop used for the markings check |
| `clipB-plate-kling-turbo.mp4` | Clip B: empty lit granite inspection bench, text-to-video, no part in it. See "Still open" if missing |
| `music-bed-v1.mp3` | 83.0 s instrumental bed, ElevenLabs Music v2.5 |
| `homepage-lens-phone-crop-sheet.jpg` | Current film 14.0–40.4 s with the 9:16 centre crop outlined |

### Clip A: what moved (measured, script `geom_compare.py`, registration by silhouette bounding box)

| Moment | Silhouette overlap (IoU) | Length-to-height change | Real edges matched |
|---|---|---|---|
| start (frame 0) | 0.986 | 0.0 % | 86 % |
| middle | 0.767 | -0.5 % | 9 % |
| end | 0.592 | -6.5 % | 6 % |

The low edge-match figures at middle and end are partly the material change (clay to black metal hides interior lines); the silhouette and proportion figures are the ones to trust.

Seen in the stills at the end frame:
- The camera did not just push in. The view tilted, so the muzzle rises to the right and a cast shadow appears on a wall. The prompt asked for a held side profile.
- Proportions: the barrel and handguard read shorter against the height (-6.5 %).
- Magazine: straighter and more upright than the real curved, raked one.
- Pistol grip: different shape and angle.
- Rear sight: redrawn as a different sight.
- Receiver: details reinterpreted (ejection port cover, forward-assist area, pin positions).
- Handguard: rail slot pattern and screw positions not preserved.
- Markings: none invented. No text, logos or roll marks found in the receiver crop.

**Flagged to Mark as noticeable. Not ruled on.** This carbine is the representative stand-in, not one of his own parts. On one of his real parts this amount of drift would break the geometry rule.

### Clip B: empty bench plate (Kling 3.0 Turbo, text-to-video, 10 credits)

Files: `clipB-plate-kling-turbo.mp4` (1920x1080, 24 fps, 121 frames, 5.04 s, **has an audio track**: ambience at -31.7 dB mean), `clipB-start-mid-end.jpg`, `clipB-{start,mid,end}.png`, `clipB-diff-start-end.png`, `clipB-text-check.png`.

Measured:
- Camera: the room behind does not move (phase correlation 0 px over the clip; frame-to-frame change 0.44 grey levels). The requested slow dolly did not happen.
- Instead the light pool slides across the plate: its centre moves from x 1422 to x 789 (633 px, a third of the frame) while the room stays fixed. The plate's front edge also shifts. A moving light on a still table, or a table moving under a still room, with no parallax to explain it.
- The plate texture changes 5x more per frame than the background (2.46 vs 0.44 grey levels): visible shimmer ("boiling") in the granite.
- Exposure is steady: mean brightness 53.6 to 61.7 of 255, no flicker (largest frame-to-frame jump 0.45).

Seen:
- The "surface plate" has seams: it reads as several tiles, not one granite slab. A machinist would notice.
- The room is not empty: a second bench, equipment on a left-hand counter, shelving, a lamp. Prompt asked for no instruments.
- Two blurred label shapes in the background (a white panel on the back wall, a small label on the right cabinet). Not legible at any size; no readable text or logos found. Still, they are invented markings by the rule and would need a blur or crop.
- No dust motes.

Fit for the film: weak. The armament act is on paper; this dark studio plate is a different world. Behind the spin it would also need the carbine relit to match a low, raking light and a strong perspective, while the carbine frames are a near side-on view lit flat. **Not recommended as is.** Mark chose a real re-render (below) on 2026-11-17, which makes this plate unnecessary for the spin.

## 2. Weapon rotation: can the homepage scrub it?

**No. Keep the existing carbine frames (180 line + 180 shade, 2 degrees apart).**
A generated clip cannot give numbered frames at even angles, one fixed crop, a clean loop, or a line layer that registers with a shaded layer. Clip A drifted in shape and camera angle within 5 s without any rotation being asked for. No generated spin was attempted.
The route that could add realism to the spin and stay scrubbable is a real re-render of the same 180 angles with materials and lighting (Blender Cycles, local $0 or Modal, about $0.05 for the last 180-frame Cycles pass). That keeps registration with the line set by construction.
**Mark's choice, 2026-11-17: real re-render** (over keeping clip A's look). Not run yet: the material and lighting look still has to be set, and the render spend needs his go with the cost stated.

## 3. Passage for the homepage opening lens, and phone crop

- Unchanged for now: 14.0 s to 40.4 s of `showreel-v3.mp4` (69.4 s file). That passage is the torque wrench (hero, exploded view, title) into the Quiet Machine section study.
- Phone crop: **does not work as a plain centre crop.** See `homepage-lens-phone-crop-sheet.jpg`. The film's captions sit at the left edge (x under about 30 % of the width) and are cut off entirely; the wrench is wider than the crop at 14 s and in the exploded view; the enclosure sits right of centre and is cut at about 23 s and 36–40 s. The section-study frames around 27–32 s are the only ones that hold up in the centre crop.
- Options, none built: a separate 9:16 render of that passage from Remotion with captions re-laid for the tall frame (free, local, the film is code), or the homepage hides the film's captions and sets its own.

## 4. Spend, approvals, rulings, open items

- Higgsfield balance: 100 credits before. Spent 32.07 (Kling 3.0 Turbo 2 x 10, ElevenLabs Music v2.5 12.07). Balance after: **67.93** (checked with the balance tool). Clip B (job `0a0a85d6-bd4d-4223-9b3e-bc98ea6c8086`) finished about 20 minutes after submission; reviewed above.
- Modal: $0.
- Mark approved, 2026-11-17, in session: ruling 1 (Higgsfield allowed on the film, including shots of his real parts, geometry kept true); ruling 2 (video only: same-type weapons that are not his protected designs, AR-15-pattern billet receiver sets, MK18, M249 with custom parts); batch 1 at 32 credits. Both rulings are recorded under JG-041 in `TODO.md` in this worktree (uncommitted).
- Astra: **no ruling yet.** Nothing is called done.
- Still open:
  - Mark's ruling on clip A's drift and on the look itself.
  - Clip B plate: reviewed, not recommended (section 1). Mark's ruling on it still open.
  - Music bed: Mark's notes; it is not laid into the film.
  - `remotion/src/rules.test.ts` and `remotion/README.md` still say "no AI-generated imagery" and "no source mentions m249". They must be changed to match the new rulings before any generated asset enters the film source. Not changed yet.
  - Realistic spin by real re-render (section 2).
  - 9:16 passage for the homepage (section 3).

## 5. Prompt for the homepage session

```
Read C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/.claude/worktrees/jg-041-higgsfield-improvements-d032fb/docs/REVIEW-PACKET-showreel-2026-11-17.md first.

Film session status, 2026-11-17: no cut has changed and public/video/showreel-v3.mp4 is untouched. Keep playing it.

What this means for the homepage:
- Armament stage: keep the existing carbine frames (180 line + 180 shade, 2 degrees apart, at .../armament-wiring-clipspin-15a80d/remotion/clips/armament/ar15-pattern-carbine-a/{line,shade}/). A generated spin cannot be scrubbed and none will be supplied. A more realistic shaded set, if Mark approves it, would be a real re-render at the same 180 angles and would drop in over the shade set.
- Opening lens: keep 14.0 s to 40.4 s. Do not centre-crop it for phones; the film's captions and parts of the models are cut off (see homepage-lens-phone-crop-sheet.jpg in remotion/review/hf-2026-11-17/). Either hide the lens film's captions at phone width and set your own, or ask the film session for a 9:16 render of that passage.
- Audio: a candidate 83 s music bed exists (music-bed-v1.mp3). Mark has not accepted it. Do not use it yet.
- Keep the label "AR-15-pattern carbine / (IP-Safe Representative Model)" on the carbine.

Do not touch remotion/. Do not commit frames or models. Ask Mark before any spend.
```
