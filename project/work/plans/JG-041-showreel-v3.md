# JG-041 — Showreel v3 "The Thread": iteration plan

Opened 2026-11-08. Scope: video only (`remotion/`). No deploys, no edits to site pages,
site choreography or the `../src` files the film imports.

## Which ruling governs

- Owner choice in chat, 2026-11-08: do the **logo slot** first, using the **Storm Ignition**
  bumper (`public/video/studiomark-bumper-storm-ignition.mp4`, committed in `b466843e`), placed
  **after the Close**, played muted, loop still landing on frame 0. Puddle Crane was not picked.
- Owner ruling in chat, 2026-11-09: logo ident, stills and ending clip **approved**.
- Owner ruling in chat, 2026-11-09: the motif changes from **"follow the thread" to "follow the
  line"**. The details are being discussed; nothing is built or rendered yet. (The TODO.md entry
  in `306b2880` that called this swap "withdrawn" was agent-written, not an owner ruling.)

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

Out of scope for this iteration: the thread → line change (iteration 2, details under
discussion), identity act, rendering-tool act, armament 3D. Each waits on owner material and
go-ahead.

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
