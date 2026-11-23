# Plan: smooth 360° turns without the 1° decode cost (2026-11-22, rev. 2 after Opus review)

Status: plan only. Live is Pages `0ad6163f` (60-frame build plus the reticle film). Rollback target is `0ad6163f`. Nothing here ships until a spike passes the gates below.

## Goal

Smooth scroll-driven 360° turns of the Chapter 04 parts (cage, pump, receiver) and the Chapter 03 carbine, with no 20–30 fps stutter. The reticle film stays the only autoplay video through Ch00–02. Any scrub source takes the lens from Chapter 03 on, where the film already hands over (`proto/merged/main.js` ~line 827).

## What we know

- Trace of the 1° build (2026-11-22, warm scroll): about 1 s per Ch04 screen of main-thread "Decode Image" plus about 1 s of other JS, in about 2.3 s per screen.
- `loadSet` makes plain `Image()` objects and `setFrame` hands the `HTMLImageElement` straight to `texImage2D` (`main.js` ~249). Opus infers that 720 decoded RGBA frames (about 1.9 GB) exceed what Chrome keeps, so it decodes again on the main thread at upload. Not proven.
- Shade frames are transparent (`texS.premultiplyAlpha = true`, `main.js:243`). H.264 has no alpha.
- The page is one three.js canvas, so any video still goes through a texture unless it is a DOM layer.
- Pages serves no HTTP Range.

## Candidates, in spike order

**A. `createImageBitmap` ring buffer (spike first, about 30 min).** Keep the WebP frames. Decode only a window of about ±12 frames around the scroll angle with `createImageBitmap`, which runs off the main thread, and upload `ImageBitmap`s. Keeps alpha and sharp lines, needs no new encode. This is the cheapest fix and the one the saved doc already named.

**B. Stacked-alpha video, all-intra.** One video per turn: colour on top, alpha below, unpacked in the shader. Encode with `-g 1`, BT.709 tagged, `+faststart`, and measure file size rather than assuming 1.5 MB. Line art needs a high bitrate or 4:4:4; if it smears, keep the line layer on candidate A.

**C. WebCodecs `VideoDecoder` with a decoded-frame window.** Exact frame control, GPU-side upload. Needs mp4box.js (a new dependency; Mark installs packages).

**D. Live 3D turn from the GLBs.** The page is already three.js, so an edge-shader turn gives exact 1° with no frames. Cost: matching the Astra-approved look. Park unless A–C fail.

Skipped: atlases (about 320 MB GPU on phones), KTX2/Basis (download too heavy at 360 frames), crossfading 6° frames (ghosts on line art).

## Gates (same session, same scroll, against `ccf8f156`)

1. `perf2.cjs`: median frame 16.7 ms, page work under 2 ms per frame on every screen.
2. Trace: no "Decode Image" in the main-thread top five on Ch03 and Ch04 screens.
3. **Lag metric (new):** requested angle minus the angle of the frame actually on screen, in both directions, including a fast fling. For video, use `requestVideoFrameCallback` `mediaTime`, and set `currentTime` only when `!vid.seeking`.
4. **Phone (new, same session):** a real phone plus Chrome throttled to Fast 3G. Desktop hardware decode hides phone cost. First interaction under 3 s.
5. Look check: a frame beside the current WebP for colour and line sharpness; Astra reviews the film-to-scrub hand-off at Ch03.

## Load and platform notes

- Keep the download deferred until `pS > 2.6`, as now, so the reticle film and first paint keep the bandwidth.
- No Range: for video, `fetch` then `Blob` then `URL.createObjectURL` guarantees a full buffer. First check whether the live reticle film plays on an iPhone today.
- iOS may not paint a seeked frame until `play()` has run once; use `play().then(pause)` on the first gesture. Low Power Mode blocks this.
- Swapping `src` per beat re-initialises the decoder; hold the last texture until `loadeddata`.
- "Phones decode one video at a time" is unproven. Test it on the phone.

## Cost and order

1. Candidate A spike and gates: about 1–2 h, no render spend.
2. Only if A fails a gate: candidate B on one part.
3. Roll out the passing method to the four parts: about half a day.
4. Deploy on Mark's go; roll back to `0ad6163f` if fps drops.

## Open questions for Mark

1. If A passes, is "WebP frames kept, decoded off-thread" acceptable, given the aim was video?
2. Carbine (Ch03) first or the cage?
3. Is a live 3D turn (D) worth a later look if the look budget allows?

---

## Benchmark Results & Winner (2026-11-23, `spike/60fps-scrub-2026-11-23`)

Mark lifted the method constraint on 2026-11-23 (any representation hitting ~60 fps and looking good; armament strictly 2D frames). Head-to-head benchmarks on 1440×900 headed Chrome (`perf2`-style scroll + CDP trace + lag + 390×844 Fast 3G):

| Candidate | Ch04/Arm frame p50 (ms) | Ch04/Arm js/frame p50 (ms) | Main-thread `Decode Image` | Steady lag p50 / p95 | Mobile 390×844 Fast 3G ready |
|---|---:|---:|---:|---:|---:|
| Live `0ad6163f` (60 frames) | 16.7–16.8 (p95 33.5) | 0.9–3.1 (p95 29.5) | — | 6° step | — |
| Old 1° build (`Image()` WebPs) | 16.7–17.1 (p95 33.6) | 12.1–19.2 | ~1,000 ms/screen | — | — |
| Candidate A (`createImageBitmap` ±12 ring + 3D culling) | 16.7–17.0 (p95 49.9) | 4.8–10.1 (`texSubImage2D` 3.0 ms/tex) | 0.00 ms | 0° / 1° | 3,870 ms (60 fps) |
| Candidate C (3-stack MP4 + WebCodecs `VideoDecoder`) | 16.8–33.3 (p95 50.3) | 4.4–9.0 (`texSubImage2D` 3.6 ms) | 0.00 ms | 0° / 1° | 29,528 ms (58 fps) |
| **Winner: Zero-copy `<video>` + progressive coarse hero** | **16.7 (p95 16.8–17.3)** | **0.7–1.0 (p95 1.0–3.1)** | **0.00 ms** | **3° / 4°** | **920 ms (60 fps)** |

### Winner architecture (`proto/merged/video-scrubber.js` + `proto/merged/main.js`)
- **3D pass culling:** when `uCover > 0.999` (Ch04/Armament), skip the 3D MSAA render/normal passes and skip dead 3D composite shader work.
- **Progressive coarse hero:** immediately fetches the hero WebP + 11 coarse frames (every 30°, ~300 KB total) via `createImageBitmap` for `< 1 s` Fast 3G first paint, then swaps seamlessly and frees all coarse bitmaps once the video paints.
- **Zero-copy 3-stacked `<video>`:** 4 single-file MP4s (`-g 6 -bf 0 -crf 23`, bt709, faststart; `cage` 4.09 MB, `pump` 7.90 MB, `receiver` 2.91 MB, `arm` 3.55 MB = 18.45 MB total vs 49.84 MB in 2,880 WebPs) fetched as Blobs (zero HTTP Range needed), uploaded via `isVideoTexture = true` with manual `update = () => {}` triggered only by `requestVideoFrameCallback` / `seeked`, and coalesced via `!video.seeking` with final-angle settle on `seeked`.
- **Interactive & visual verification:** 2× full benchmark passes + `smoke-flows.cjs` (`reticle-film.mp4` Ch00–Ch02 + Ch03 handover, Ch04 pills, `console.js` dive-in/climb-out, Armament `glbReqs: 0`, light/dark, mobile 390×844) all PASS with 0 errors. Visual captures inspected for `cage`, `pump`, `receiver`, `arm`, dark mode, and mobile.
- **Next:** Owner visual check (+ Astra review) and explicit go before deploying or pushing.
