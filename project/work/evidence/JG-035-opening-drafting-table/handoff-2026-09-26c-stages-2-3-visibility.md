# JG-035 stages 2–3 handoff — 2026-09-26c (visibility pass)

Mission unchanged: sections 1–3 of `docs/jgun-animation-improvements.md`, tracked in
`docs/jgun-stages-1-3-implementation-plan.md`. Read `handoff-2026-09-26b-stages-1-3.md`
for environment and earlier changes. **Nothing from this session is committed.**

## What happened

Plan items 2.3, 3.1 and 3.2 had been left unchecked. They were implemented, ticked, and
passed the quick harness — then Mark looked at the frames and on :5199 and **none of it was
visible**. Telemetry was correct; the effects were physically unseeable. Root causes and fixes:

| Effect | Why it was invisible | Fix |
|---|---|---|
| Metal before lift | Model sits 4–8 cm *behind* the sheet (`localZ −0.04`, `minZ −0.08` at t=.55). Opaque paper **and** the walnut desk plane (z −0.0016, transparent pass, drawn over the opaque model) hid it until crossing. | `uVellum` (= `intro.pbr`): paper alpha drops up to 88% inside the profile mask; desk alpha cut fully there. |
| Paper flex | ≤1.25 mm Z displacement filmed square-on (elev 90°, ortho 1) → zero parallax. Shading capped at 3.5–7.5%. | Raking-lamp emboss from the displacement gradient toward `uKey` (±22–28%), plus 14% pressure ring. |
| Contact shadow | 3 mm radius, centred under a black model that covers it. | Offset away from the lamp; `CONTACT_SHADOW_MAX` 0.34, radius 6 mm → 36 mm, fades linearly over separation. |
| Metal timing | pbr started at `riseStart` (same moment as lift). | `INTRO_PHASES.metalStart = 0.54`; pbr > .5 by riseStart .6. |

Visible now: `stages-1-3-2026-09-26/visibility-pass-2026-09-26/contact.png` (+ per-frame PNGs; capture script copy `frames.mjs`) (0.060 → 0.108, desktop 1600×900). Still owed:
**Astra ruling** on all four effects, and the **full 6-case harness** (only quick 2/2 ran,
and that was before the visibility fixes).

## Files changed (uncommitted)

- `src/scene/drawing/introTimeline.ts` — `metalStart`, pbr window.
- `src/scene/drawing/sheet/paperFlex.ts` — `paperContactShadow`, `CONTACT_SHADOW_MAX`.
- `src/scene/drawing/sheet/ink.ts` — `uContact`, `uVellum` uniforms.
- `src/scene/drawing/DrawingLinework.tsx` — paper emboss/shadow/vellum, desk cutout, per-frame
  uniforms, `sheetStats.contactShadow/contactRadius/vellum`.
- Tests: `introTimeline.test.ts`, `sheet/paperFlex.test.ts` (123/123 pass, tsc clean).
- `docs/jgun-stages-1-3-implementation-plan.md` — 2.3/3.1/3.2 ticked (tick was premature;
  treat as "implemented, pending Astra").
- Harness gates for `.066` (metal before lift), `.084`/`.12` (contact shadow) are already
  committed in `7d7d2a0`.

## Gotchas learned

- Harness URL must be `--url=http://localhost:5199`; vite refuses `127.0.0.1` on this box.
  Quick protocol is in `TODO.md:13` (not AGENTS.md): `node scripts/verify-jgun-opening.mjs --quick`.
- Fast visual iteration: `.scratch/frames.mjs` — copy into `scripts/` to resolve playwright,
  run `node scripts/_frames_tmp.mjs 0.066,0.072,0.084`, delete. One fresh page per frame;
  reusing one page for several `setProgress` calls intermittently loses the WebGL context and
  every later reading freezes at the poster frame (phase .5, pbr 0).
- `scrollToProgress` in a hidden/headless page may not advance; `setProgress` (pinned) does.
- The frame loop rewrites `mesh.visible` every frame — to hide something while probing, set
  `material.visible = false`.
- The browser pane's `resize_window` rendered a broken 1600×900 frame; use playwright.

## Owner direction for next session

### 1. Camera: tilt down toward the desk so the bulge reads before breakthrough

Mark wants the camera to **shift its angle downward toward the desk** — keep roughly the same
focal point, but move the camera lower so the viewer sees the paper **bulge in profile**
before the model breaks through it. Square-on (elev 90°) is why the flex had to be faked with
shading; a raking view shows real displacement.

Where: `src/scene/drawing/sheetCamera.ts` `shots()` — the hold after `pulseStart` is
`elev: 90, ortho: 1`. Add a shot between `pulseStart` (.4) and `riseStart` (.6) that lowers
`elev` (try 55–65°) and drops `ortho` toward 0, target on the profile centroid (`sx, sy`).

Conflicts to resolve, not ignore:
- **Registration gates** at .06/.072 (≤0.1 px) assume the square-on ortho hold. With the
  model 4–8 cm below the sheet, an oblique camera gives real parallax between print and
  metal. Either keep the square-on hold through the pulse (t .4–.5) and tilt only during
  pressure (t .5–.6), or re-scope the gate to the pulse window. Ask Mark/Astra which.
- `PAPER_FLEX_MAX` is 3 mm (test-gated `(0, 3e-3]`); side-on it may need more to read.
  Raising it changes a documented gate — get approval.
- Downstream: the `perspective` blend starts at `orbitStart` .72 and the harness checks
  camera settle. Keep the tilt inside the intro, and make sure it hands off into the existing
  orbit without a snap.
- Vellum cutout + desk cutout were tuned for square-on; recheck at an angle (the desk
  cutout may show the model through the desk edge).

### 2. Higgsfield API credits — expire in ~2 days, spend them now

Mark has Higgsfield API credits that must be used in the next couple of days. Recommend how
they help this project, generate assets **now**, integrate later (they don't need to ship
this week). Suggestions to evaluate:

- **Station 2 (RL-300 acoustic enclosure) backdrop** — slow, looping environment plate
  (acoustic test lab, anechoic wedges, soft haze). Sits behind the R3F scene via the
  backdrop layer system (`src/scene/backgrounds/`, `BackdropRig.tsx`), replacing or
  blending over the gradient layer at station 2.
- **Station 3 (M249) — only ~10% built**, so the highest-leverage target. Options: a
  cinematic establishing plate (range / armory / machine-shop mood) to carry the section
  while the 3D build catches up; or scroll-scrubbed image-to-video from existing M249
  renders (`public/models/m249-transformed.glb` stills) as a stopgap hero.
- **Post-opening backgrounds** — after the drafting-table intro hands off (`p > 0.12`), a
  low-contrast atmospheric loop (workshop, dust in lamp light) behind the exploded-view
  stations.
- **Transitions between stations** — short plates for the station-to-station flights.
- **Poster / reduced-motion fallbacks** — high-quality stills for the `poster` tier and
  reduced motion, which currently show a flat static card.

Guardrails:
- Don't let generated video depict the J-GUN, RL-300 or M249 product itself as the source
  of truth — CAD accuracy is the portfolio's point. Use it for environments/atmosphere, or
  image-to-video seeded from our own renders only.
- Every visual effect still needs an Astra ruling before it is done.
- Budget: video weight on mobile, poster frame per clip, lazy-load per station,
  `prefers-reduced-motion` → still frame. Measure against `npm run preview`.
- Check current Higgsfield API docs before scripting (model names, image-to-video limits,
  output resolution/length) — don't assume.
- Stash raw outputs outside `public/` until chosen; record prompts + seeds next to them.

## Next steps (in order)

1. If short on time, generate Higgsfield assets first — the credits expire.
2. Astra ruling on `stages-1-3-2026-09-26/visibility-pass-2026-09-26/contact.png` (+ per-frame PNGs; capture script copy `frames.mjs`) (vellum strength, emboss, shadow).
3. Camera tilt (above), then re-capture with `.scratch/frames.mjs`.
4. Quick harness → full 6-case harness → commit.
