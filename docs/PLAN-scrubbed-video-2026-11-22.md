# Plan: scrubbed video on the page, alongside the reticle film (2026-11-22)

Status: plan only. Nothing here ships until the spike passes the 60 fps gate. Live stays on the 60-frame build with the reticle film.

## Goal

Smooth 360° turns of the Chapter 04 parts (cage, pump, receiver) and the Chapter 03 carbine, scrubbed by scroll, with no 20–30 fps stutter. Replace thousands of WebP frames with a few small videos whose `currentTime` follows the scroll.

The reticle film (`reticle-film.mp4`, 2.0 MB, Ch00–02) stays the only autoplay video. A scrub video takes the lens only from Chapter 03 on, where the film already hands over (`proto/merged/main.js` around line 827). The two never play at once.

## Why this should work (to be proven, not assumed)

The 2026-11-22 trace of the 1° build showed about 1 s per Ch04 screen in main-thread "Decode Image" plus about 1 s of upload and draw JS. Per-frame images are the cost. A video decodes off the main thread in the browser's media pipeline, and a `VideoTexture` upload is mostly GPU-side. That is a hypothesis; step 1 tests it.

## Constraints

- Pages serves no HTTP Range, so each video downloads whole. Budget: 1.5 MB per turn video, 6 MB for all of Ch03 and Ch04.
- Seeking backward needs a nearby keyframe. Encode with a keyframe every 4–8 frames.
- Phones decode one video at a time and cap memory. Keep one active scrub video and swap `src` per beat.
- Line and shade are two layers today (line on the sheet, shade under the lens). Two videos per part doubles the load. Option: shade as video, line staying as the current 60 WebP frames.

## Steps

1. **Spike, one part (about 1 h, no Modal spend).** Encode the cage's 360 shade PNGs from `C:/Projects/work-assets/portfolio/jg044-frame-scrub-2026-11-21/ch04/` to a 1024×640 H.264 file at keyframe interval 4, crf 28. Wire it into one Ch04 screen on a scratch branch. Scrub with `vid.currentTime = p * duration` on rAF, through the same `VideoTexture` path the reticle film uses.
2. **Measure (same hour).** Run `perf2.cjs` and the trace script against `ccf8f156`, same scroll. Gate: median frame 16.7 ms, page work under 2 ms per frame on every screen, no "Decode Image" in the main-thread top five, both scroll directions.
3. **Decide.** If it passes, encode the other parts. If seeking stutters, try in order: keyframe every 2 frames, 720×450, WebCodecs `VideoDecoder` with a small decoded-frame window, or 120-frame (3°) WebP sets.
4. **Phone and slow-network check.** One real phone, then Chrome throttled to Fast 3G. Gate: first interaction under 3 s, no stall on the first beat.
5. **Astra review** of the look (line versus shade wipe, hand-off from film to scrub video at Ch03). Then deploy on Mark's go, rolling back to `0ad6163f` if fps drops.

## Cost and effort

- Spike and measure: about 1–2 h of one session, no render spend. The frames already exist.
- Full roll-out of four parts: about half a day if the spike passes, mostly encoding and wiring.
- No Modal spend planned. A new render is needed only if the 3° fallback wants different angles.

## Open questions for Mark

1. Shade only as video, with line kept as WebP, or both as video?
2. Is 1.5 MB per turn acceptable, or fewer frames at lower resolution?
3. Carbine (Ch03) first, as the most visible turn, or the cage?
