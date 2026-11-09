# JG-041 showreel v3 — logo ident review stills (2026-11-09)

Stills of the StudioMark logo ident (Storm Ignition bumper, muted, after the Close).
Rendered from `remotion/out/bundle` (bundled 2026-11-08 18:34, newer than every edited source file) with
`npx remotion still out/bundle Showreel <file> --frame=<n>`. 1920×1080 PNG, 6–9 s each.

| File | Frame | Time | What it shows |
|---|---|---|---|
| f0000.png | 0 | 0.0 s | Loop start: blank paper + three unlit eyelets |
| f2040.png | 2040 | 68.0 s | The Close holding (no fade-out any more) |
| f2070.png | 2070 | 69.0 s | Orange cut-line wipe from the Close into the bumper |
| f2103.png | 2103 | 70.1 s | Bumper, early |
| f2133.png | 2133 | 71.1 s | Bumper, mid |
| f2184.png | 2184 | 72.8 s | Bumper, end card (STUDIOMARK.DEV line) |
| f2205.png | 2205 | 73.5 s | Bumper frozen, wipe back to paper |
| f2222.png | 2222 | 74.1 s | Last frame: settled blank paper |
| contact-sheet.jpg | — | — | All eight at 640 px, in order |

## Loop seam (f2222 vs f0000)

- SSIM 0.9992, PSNR 48.2 dB. 0.07 % of pixels differ by more than 8/255.
- The only visible difference is the three eyelet rings at (620,900), (960,820), (1300,900). The
  Opening draws them unlit at 45 % opacity from frame 0 (`src/scenes/Opening.tsx`, `Thread`
  eyelets). So three faint rings appear on the wrap. The Opening is unchanged from the accepted
  cut, so it had the same pop. Not changed here; the owner can decide whether to fade them in.

## Why the earlier still renders "crashed"

They did not reach rendering. This worktree had no Remotion headless Chrome yet. The first
`remotion still` downloads it (131 MB), and the earlier runs printed only `Node.js v22.19.0`
because `--log=error | tail -2` hid the download and its failure. Run with full output, the
download finished and every still rendered. No code change was needed.

Owner ruling 2026-11-09: stills and ending clip approved.
