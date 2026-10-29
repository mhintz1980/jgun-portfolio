# Preview video worker — 2026-10-28

Status: capture-code change and offline checks delivered; ownership released to parent. Final integrated production capture and actual browser playback remain OPEN. No browser, build, global tests, staging, commit, push, deployment, source/geometry, protected GLB or `.scratch` work was performed.

## Diagnosis of the existing recording

Input: `output/playwright/owner-visual-preview-2026-10-28/integrated-preview/video/6afdc4a23de931cecfe25bc9f7097f47.webm`.

Actual ffprobe output:

```json
{"codec_name":"vp8","width":1440,"height":900,"pix_fmt":"yuv420p","r_frame_rate":"25/1","duration":"31.720000","size":"2657557"}
```

ffmpeg decoded all **793 frames**, with no decode error. An in-memory montage of actual decoded frames at 0, 5, 12, 18, 24 and 31 seconds was visually inspected: white startup, two extremely dark distant mechanical views, then bright closeups and the assembled tool. No decoded-image artifact was written.

The recording is not an entirely black ANGLE capture. Whole-frame YAVG (ffmpeg signalstats) is about 17.77 through much of seconds 4–16; central RGB luma at seconds 5, 12 and 16 averages **1.314, 1.323 and 1.326 / 255**. At seconds 17, 18 and 24 it averages **70.705, 70.350 and 63.295**. These measurements substantiate the dark early content; they do not diagnose the in-app file-browser's codec/playback behavior.

The old recorder starts on context creation, so startup/navigation/loading and seek time enter the clip. It has neither a poster nor decoded-frame acceptance. Metadata and zero console errors did not establish playback. The user's black in-app player at 1025×613 remains a separate unverified symptom: no browser was launched to reproduce it.

## Changed files and behavior

- `scripts/preview-owner-visual-corrections.mjs`: replaces Playwright `recordVideo` with settled `page.screenshot` PNGs. Retains `--mode=all|tool|pacing|camera`, default `all`, and `--video=0|1`; adds `--mode=video` to skip stills and capture video alone. Video tools are checked before browser launch.
- `scripts/lib/preview-video.mjs`: new offline encoding, per-frame RGB inspection and gallery rendering helper. Uses installed ffmpeg/ffprobe, configurable via `FFMPEG_PATH` and `FFPROBE_PATH`.
- This evidence document.

Each capture uses a unique video subdirectory, preserving existing recordings. The gallery prefers H264 MP4 (`yuv420p`, `+faststart`) and supplies VP9 WebM fallback, a real first-scene PNG poster, controls, inline playback and direct media links. Video retains the captured aspect ratio as the gallery scales to the in-app viewport. No narrative clocks, materials, camera or browser-launch configuration changed.

Capture semantics: three sweeps, `.665 → .717` (tool), `.815 → .825` (carrier reveal), `.855 → .995` (camera); 51 frames each, including endpoints. Native scroll uses the existing narrative scroll-fraction mapping and progress reachability tolerance of `.00005`. Each frame waits at least 80 ms and two animation frames before telemetry/screenshot. Initial readiness, 1600 ms settled seeks and cuts are excluded from the video. No direct narrative/subject/camera clock writes are used.

153 expected frames at 12.5 fps produce a **12.24-second sampled preview**. Screenshot and telemetry overhead make capture wall time longer than encoded time. This is not an assertion of real-time narrative pacing. Per-frame native position, progress, camera/subject times, renderer data, encoded timestamp and elapsed capture time remain in `report.json`. Served asset URLs record the actual hashed JS resources loaded by the capture.

Before publishing media links, the helper checks the first source screenshot, decodes every frame from both outputs, checks expected frame count and central luma variation/bright pixels, checks H264/yuv420p, and checks that MP4 `moov` precedes `mdat`. Empty/blank media raises an error, leaving source PNGs for diagnosis. These modest pixel gates do not certify composition or mechanical subject visibility. Detailed RGB frame statistics are retained in the capture report. Completion becomes `DECODE_CHECKED`; browser playback remains explicitly `NOT_CHECKED`.

## Actual offline checks

`node --check scripts/preview-owner-visual-corrections.mjs` and `node --check scripts/lib/preview-video.mjs`: both exit **0**, no output.

Tools found:

```text
ffmpeg version 8.1.1-full_build-www.gyan.dev Copyright (c) 2000-2026 the FFmpeg developers
ffprobe version 8.1.1-full_build-www.gyan.dev Copyright (c) 2007-2026 the FFmpeg developers
```

Full old-file inspection output summary:

```text
decodedFrames: 793
rejectedFrames: 4
firstRejected: [0,1,2,3]
```

Those four startup frames are uniform white (central mean/max 253, deviation 0). The later extremely dark views contain enough real detail to pass the deliberately modest blank-frame gate; this is why visual inspection remains necessary.

Existing captured stills were decoded with the new helper:

| PNG | Central mean | Max | Deviation | Fraction above luma 24 | Pixel gate |
|---|---:|---:|---:|---:|---|
| `tool-0.66500.png` | 41.636 | 255 | 65.513 | .33227 | true |
| `pacing-0.81736.png` | 35.318 | 252.787 | 74.154 | .20469 | true |
| `camera-0.86500.png` | 38.856 | 174 | 20.192 | .82054 | true |

HTML assertions checked MP4-first source order, poster, inline playback, escaping, explicit playback-not-checked status, failed-media omission and legacy WebM rendering. Actual output:

```text
Gallery assertions: 7 passed. No browser launched.
```

Real existing tool PNG → three encoded frames → raw RGB decode was exercised entirely in memory for both codecs. Actual output:

```json
{"format":"mp4","encodedBytes":48288,"decodedFrames":3,"codec_name":"h264","width":1440,"height":900,"pix_fmt":"yuv420p"}
{"format":"webm","encodedBytes":55868,"decodedFrames":3,"codec_name":"vp9","width":1440,"height":900,"pix_fmt":"yuv420p"}
```

```text
In-memory codec encode/decode: PASS. MP4 pipe uses fragmentation; final seekable +faststart file encoding remains pending. No artifacts or browsers created.
```

The final sequence encoder, MP4 box-order gate and live gallery have not been exercised together. The Node REPL could not import this helper because its sandbox omits global `process`; offline helper checks were rerun successfully using normal Node. Offline inspection used `C:/Projects/skills-master/vendor/openmontage-skills/video-understand/SKILL.md`.

## Parent next action and remaining boundaries

Workspace: `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench`.

After the parent's thickness/arbor integration, production rebuild and required :4173 restart, and after the parent releases the browser resource, run:

```powershell
node scripts/preview-owner-visual-corrections.mjs --url=http://localhost:4173/torque-wrench/?quality=full --out=output/playwright/owner-visual-preview-2026-10-28/integrated-preview --mode=all --video=1
```

`--mode=video` provides the shorter video-only capture when a separate output directory is desired. Avoid replacing a gallery containing desired stills with a video-only report. The existing gallery/recording was not regenerated or overwritten by this worker.

Inspect actual decoded first/middle/last frames, then actually play the MP4 in the in-app browser at 1025×613 (and check the poster/fallback paths). Record visible moving scene frames/currentTime advance and any media errors before changing `browserPlayback` evidence. A decoded media file alone is not browser playback proof. Keep this a small preview; no full verifier roster or owner acceptance is claimed. Parent retains all source, geometry, build and browser ownership; worker source ownership is now released.
