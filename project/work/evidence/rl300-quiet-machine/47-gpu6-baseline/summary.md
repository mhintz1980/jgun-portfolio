# GPU-6 desktop baseline, S4 frame-time baseline, and what lite extras would cost (2026-10-12)

Owner: "QM8/GPU-6 triangle acceptance, V16 frame shifts, and the lite tier's missing extras all approved" (2026-10-12, given before these numbers were read to him).

## Method (read this before quoting a number)
Scratch script `gpu6.mjs` (not a repo gate). Chrome (channel chrome, headless), ANGLE D3D11, `--disable-gpu-vsync --disable-frame-rate-limit`. For u = 0..1 in 600 steps: `__quietMachine.seek(u)`, wait for the next rendered frame, record the interval between rendered frames; first 5 dropped. This is frame interval under an uncapped sweep, **not GPU timestamp queries**; it includes the page's own per-frame JS. Build = repo `dist` at HEAD `4d1ee94a`. Device: **ANGLE (AMD, AMD Radeon 780M Graphics, D3D11)**, an integrated GPU.

## Result (`gpu6-baseline.json`)
| row | p50 ms | p95 ms | p99 ms | max ms | max triangles | max draw calls |
|---|---:|---:|---:|---:|---:|---:|
| desktop 1440x900 full | 8.8 | **11.6** | 14.6 | 73.3 | 1,210,452 | 142 |
| desktop 1440x900 lite | 6.6 | 9.0 | 10.6 | 71.6 | 556,908 | 84 |
| 390x844 DPR 2 full (phone-SIZED, desktop GPU) | 7.1 | 8.9 | 10.8 | 29.2 | 1,205,268 | 142 |
| 390x844 DPR 2 lite (phone-SIZED, desktop GPU) | 3.9 | 4.9 | 6.9 | 26.7 | 551,724 | 84 |

- **Desktop, device-named:** full-tier p95 11.6 ms against a 16.7 ms (60 fps) frame: holds with 5.1 ms headroom; p99 14.6 ms. The ~500k triangle figure is not met (1.21M full, 557k lite); the plan allows "the measured number with device-named p95 holding 60 fps desktop". **That is the evidence for the acceptance the owner approved.**
- **Phone: not demonstrated.** The 390x844 rows run on this desktop iGPU and are a size proxy, not a phone. The 30 fps phone criterion needs a named phone via `vite preview --host` (exposes the build on the LAN) or an owner ruling that desktop-only is enough for now.
- Max-frame spikes (73 ms, 29 ms) are single frames at first use of a shader/geometry in the sweep; not characterised.

## S4 frame-time baseline
Same device, same method: **desktop full p95 11.6 ms, lite p95 9.0 ms**. The approved S4 rule (p95 within +1.0 ms of the same-device pre-S4 baseline, no fps loss) now has a number to compare against, with this method.

## Lite tier with extras (scratch build only; repo unchanged; `gpu6-lite-with-extras-scratch.json`)
Lite loading `rl300-extra-parts.glb` (gauge dials, V16 MAN assembly, exhaust connector):
| | lite today | lite + extras | delta |
|---|---:|---:|---:|
| max draw calls | 84 | **91** | +7 |
| max triangles (desktop viewport) | 556,908 | 569,519 | +12,611 (+2.3%) |
| p95 (desktop-lite / 390x844) | 9.0 / 4.9 ms | 9.1 / 6.4 ms | +0.1 / +1.5 ms (noisy) |
| extra download | | 387,588 bytes | |
It **breaches the `< 90` lite draw-call pin (91)** and consumes the approved S4 lite background budget (<= +2, <= 87). The extras cannot be added to lite as they stand without a ruling.

## V16 frame shifts
Not applied. The audit data behind `35-v16-round-1/asset2/audit.md` (per-part V16 bboxes) came from an earlier session's scratch directory that no longer exists; applying shifts needs a fresh read-only Blender bbox dump of the V16 master plus a data table applied in `prepareModel.ts` (the shipped `msp-enclosure.glb` stays untouched). See the handoff.
