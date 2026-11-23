# Saved: JG-044 frame-scrub work (2026-11-21), paused 2026-11-22

Branch `save/jg044-frame-scrub-2026-11-21` (this branch's head). Mark paused it on 2026-11-22:
the homepage went back to the 60 fps build (`ccf8f156`, branch `home/60fps-2026-11-22`). See
`docs/PLAN-back-to-60fps-2026-11-22.md`.

## What is here

| Work | Commits | State when paused |
|---|---|---|
| 1-degree turns (360 line + 360 shade) for the Chapter 04 cage and the Chapter 03 carbine, plus the coarse-first loader | `d9f8400a` | was live 2026-11-20 to 11-22 (`70ac5b5c` … `ea262c8a`) |
| Chapter 04 as three beats (cage / pump / receiver), one screen each | `ab02e7bc`, `bb607954` | Astra approved with fixes; fixes done |
| Thin console: assembly tabs, angle scrub, line-vs-shade wipe, backgrounds, finish chips | `12ab0d8e`, `6c9eacd6`, `0d9be83b`, `54889f99` | reviewed, 0 page errors |
| P3 pump + receiver 360 turns (Modal $0.30 measured, line local) | `00d6d667` | Astra SHIP; was live as `ea262c8a` |
| Gear readouts hidden on beats 2-3, carbine, Chapter 03 row | `b4fc536d`, `00d6d667` | Mark's ruling |
| Phone lens below the header | `6cd6e171` | also carried to the 60 fps branch |

Render sources (gitignored here): `C:/Projects/work-assets/portfolio/jg044-frame-scrub-2026-11-21/`
(`ch04/` and `arm360/`, 4,493 files, 3.5 GB). That covers the pump and receiver line and shade PNGs, the
cage and carbine 360 sets, the pilots, Astra packets, perf probes (`ch04/perf/perf2.cjs`) and the launchers.
The pump GLB `dd4se-nomarks.glb` is in `ch04/`. The receiver GLB is at
`C:/Users/Markimus/Downloads/CAD/Armament/armament/M249/M249 Receiver Plus.glb`.

## Why it was paused (measured 2026-11-22, Chrome on Mark's machine, `perf2.cjs`)

- With this work live, Chapter 04 ran at a median of 33-50 ms per frame (20-30 fps) across 4 screens, with about 20 ms of main-thread work per frame.
- The 60-frame build (`ccf8f156`) ran at 16.7 ms per frame (60 fps), with about 1 ms of work per frame.
- Likely cause: at 1° per frame almost every scroll step uploads two new 1024×640 WebP frames, and Chrome decodes about 2,000 frame images on the main thread at upload time. Not proven; a performance trace would settle it.

## Before any of it returns to the homepage

1. A perf probe (`perf2.cjs`, same scroll) at a median of 16.7 ms and page work under 2 ms on every screen, compared against `ccf8f156`.
2. A fix for the frame cost. Candidates: decode ahead with `createImageBitmap` in a sliding window (memory budget on phones), fewer frames per turn, or a scrubbed video per turn.
3. Mark's go. These frames and renders can also feed chapter videos (OpenMotion or Remotion) without a scroll-scrub stage.
