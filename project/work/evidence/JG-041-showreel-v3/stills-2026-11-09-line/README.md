# JG-041 iteration 2, slice 1 — "The Line" stills (2026-11-09)

2D slice of the owner's "full plotter" pick: the thread is replaced by a ruled drafting line
(thin ink construction pass → orange inked line, crosshair pen head, registration marks).
Timings unchanged. Rendered from a fresh bundle with `npx remotion still`.

| File | Frame | What it shows |
|---|---|---|
| f0000 | 0 | Blank paper (marks now fade in, so no loop pop) |
| f0020 | 20 | Construction line being ruled, marks fading in |
| f0040 | 40 | Construction line done, inking starts |
| f0066 | 66 | Orange ink passing the marks; name drawing |
| f0120 | 120 | Fully inked line under the name block |
| f0172 | 172 | Line sliding up like a T-square |
| f0194 | 194 | Line on the drive axis (hands over to the wrench) |
| f0225 | 225 | Wrench plotted with the crosshair pen head |
| f1747 | 1747 | Close: line ruled, ink starting |
| f1807 | 1807 | Close: labels rise as the ink reaches each mark |
| f1882 | 1882 | Close: line sliding down |
| f1967 | 1967 | Close: line underlines studiomark.dev, "Follow the line" |
| f2070–f2222 | — | Ident and loop end |

Checks: f2133 and f2205 are pixel-identical to the approved ident stills. f2070 differs only
where the Close (left of the wipe) changed. Loop seam f2222 vs f0000: SSIM 0.9999, no pixel off
by more than 8/255 (the eyelet pop is gone). Film typecheck clean, rules test 33/33.
