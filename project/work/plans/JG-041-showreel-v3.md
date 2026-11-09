# JG-041 — Showreel v3 "The Line": iteration plan

Opened 2026-11-08. Scope: video only (`remotion/`). No deploys, no edits to site pages,
site choreography or the `../src` files the film imports.

## Which ruling governs

- Owner choice in chat, 2026-11-08: do the **logo slot** first, using the **Storm Ignition**
  bumper (`public/video/studiomark-bumper-storm-ignition.mp4`, committed in `b466843e`), placed
  **after the Close**, played muted, loop still landing on frame 0. Puddle Crane was not picked.
- Owner ruling in chat, 2026-11-09: logo ident, stills and ending clip **approved**.
- Owner ruling in chat, 2026-11-09: the motif changes from **"follow the thread" to "follow the
  line"**. (The TODO.md entry in `306b2880` that called this swap "withdrawn" was agent-written,
  not an owner ruling.)
- Owner ruling in chat, 2026-11-09: **option B, "full plotter"** (the line also sketches each
  product before its 3D or image appears), and the film is renamed **"The Line"**.

## Iteration 2 — "The Line" (full plotter)

Built in two slices so the owner sees stills before the costly 3D work.

**Slice 1 (2D, timings unchanged so the approved ident keeps its frames):**

| Item | Change |
|---|---|
| `src/ui/Line.tsx` (replaces `Thread.tsx`) | Ruled polyline: thin ink construction pass, then the orange object line inked over it; crosshair pen head (`PenHead`); crosshair registration marks that light as the ink reaches them. |
| `src/scenes/Opening.tsx` | Line ruled at y=820 through three marks (fading in from frame 0, which fixes the loop-seam pop), inked while the name draws, then slid parallel onto the drive axis (y=540). |
| `src/scenes/Close.tsx` | Same line through three marks at y=730; each project label rises with a short leader as the ink reaches its mark; the line slides down to underline the address. CTA "Follow the line". |
| `src/scenes/WrenchAct.tsx` | Plotter head is the same `PenHead`. |
| `src/ui/LineWipe.tsx` (was `ThreadWipe.tsx`), Sequence names, comments, still names, README | Renamed thread → line. Composition id `Showreel` and `showreel-v3.mp4` unchanged. |

**Slice 2 (waits on the owner's go after slice-1 stills):** a linework pre-roll for the Quiet
machine (feature edges plotted before the solid enclosure, done in `remotion/src/three/` only,
appending a fill plane to the section plane rather than replacing it) and a plotted outline of
the armament x-ray before the scan (derived at render time from the existing image, no new asset).

## Iteration 1 — logo ident after the Close

| Item | Change |
|---|---|
| `src/logo.ts` | `FILM_LOGO`: the one approved bumper file and its length. |
| `src/scenes/LogoIdent.tsx` | New act. Plays the bumper muted (the film stays silent), holds the lockup, then fades to the blank drafting sheet so the last frame matches frame 0 and the loop still works. |
| `src/scenes/Close.tsx` | Drop its own fade-to-paper. The loop now closes at the end of the ident. |
| `src/Showreel.tsx` | Add the ident after the Close, entering behind the same orange cut-line wipe the acts use. |
| `src/Root.tsx` | Register `LogoIdent` under `Acts/`. |
| `src/copy.ts` | `LOGO.burnedIn`: the text baked into the bumper's pixels, so the copy scan covers it. |
| `src/rules.test.ts` | One new block for the logo lane: video only from the approved file, played muted, no audio elements, text recorded. |
| `scripts/review-stills.mjs`, `README.md` | Stills and act table updated for the new ending. |

Out of scope for this iteration: the thread → line change (now iteration 2), identity act,
rendering-tool act, armament 3D. Each waits on owner material and go-ahead.

### Review path (2026-11-08 iteration rule)

1. Stills only from a fresh bundle: Close hold, mid-wipe, lightning, lockup, mid-fade, last frame,
   plus a pixel comparison of the last frame against frame 0.
2. Owner looks at the stills.
3. Only after that: a separately named review MP4 (for example
   `public/video/showreel-v3-review-logo.mp4`, about 2 h on 4 cores, or just the last ~10 s as a
   partial render). `public/video/showreel-v3.mp4` is replaced only after the owner accepts the cut.

### Gates

`npm run typecheck`, `npm test`, `npm run build` at the root, and `cd remotion && npm run typecheck`.

## Backlog (confirm with the owner before building)

- Armament act with the real 3D models (priority, local Blender prep lane on the owner machine).
- Identity act ("more about Mark").
- Rendering-tool act (source: `C:/Projects/msp-render-pipeline`).

Evidence: [`project/work/evidence/JG-041-showreel-v3/stills-2026-11-09/`](../evidence/JG-041-showreel-v3/stills-2026-11-09/README.md)
(README and contact sheet tracked; the PNGs stay local per `.gitignore`). The approved ending clip
is local only: `remotion/out/showreel-v3-logo-review.mp4` (frames 2000–2222, muted).
