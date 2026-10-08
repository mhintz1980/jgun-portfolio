# JG-036 diagnosis — hotspots have never worked (2026-10-08)

Method: live DOM probes driven through the ZCode in-app browser against two dev servers — the ccr-era build (`origin/ccr-50494e4f-n9kq7i` @ `4970ded`, served from the disposable worktree `C:/Users/Markimus/.buzz/REPOS/jgun-ccr-review` on :5198) and current HEAD (`codex/jg033-signature-shot` @ `6cca1b0`, served from the main checkout on :5200/:5201). Evidence gathering changed no repository state. Probes used `getBoundingClientRect` + `document.elementFromPoint`, real actionability-checked Playwright clicks, `aria-pressed` state reads, and the HUD's own `CAM […]` telemetry line — per the repo rule, no visual-only claims on the dark scene.

## Findings on the ccr-era build (4970ded)

- At CH.04 (~80 % scroll), four M249 hotspot badges render in the DOM (`DATUM A — RECEIVER MONOBLOC`, `DATUM B — BARREL TRUNNION BORE`, `DATUM C — MIL-STD-1913 TOP RAIL`, `FEED TRAY & BOLT CARRIER GUIDE`).
- **Pointer-dead:** the DATUM A button's rect (354×35 px, in-viewport, `opacity 1`, `pointer-events: auto`) is hit-tested to `MAIN > DIV.relative.z-0` — the chapter text column paints above the badge layer. Playwright's click times out on actionability (it refuses to click a covered element). Every user click lands on the wrapper.
- **Camera-dead even when selected:** a programmatic `btn.click()` (bypasses hit-testing) flips `aria-pressed` to `"true"` — i.e. the React handler runs and `hotspotId` is set — but `CAM [ 56.447 0.675 -9.525 ] · FOV 35.3°` stays byte-identical for 4+ seconds. `HOTSPOT_INSPECT_FRAMES` on that branch defines frames for all 18 ids including `m249-receiver`; the consumption path never applies them. Gate untraced (superseded code; JG-036 fixes forward on HEAD).
- Wrench-chapter badges never rendered at the probed positions (18 %, 40 % — both still CH.01): no badge DOM at all. Root cause (culling vs. filter) untraced for the same reason.
- Control checks on the same build: station navigation buttons are real and clickable; material-mode toggles work with real clicks.

## Findings on HEAD (6cca1b0)

- **Zero hotspot badges in the DOM at every probed scroll position: 14 %, 35 %, 47.5 %, 50 %, 54 %** (fresh load, CH.01 active at 14/50 %, role-map fetched, station-1 navigation verified working).
- Code-level causes (environment-independent):
  - `src/scene/Hotspots.tsx`: `STATION_REPLACED = new Set(['rotor', 'motor-housing', 'flange', gearbox-housing'])` removes the wrench four — JG-035 replaced them with the tolerance stations S1–S6, which are passive (no click handlers in `ToleranceStations.tsx`).
  - The anchor filter requires `h.chapters.includes(0) || h.chapters.includes(1) || h.window`. Of the 14 surviving defs only `lcd` has a `window` (`caseStudies.ts:618`, `[0.44, 0.51]`); the other 13 (7 enclosure + 3 electronics + 4 M249) can never build anchors on any environment.
  - The `lcd` window is stale: at 47.5–50 % (inside the window, CH.01 active) the badge still does not appear — the scroll track has lengthened under it since the window was authored.
- Control checks on HEAD: material toggles and station navigation work with real, actionability-checked clicks (states flip; camera jumps). The owner's clickable list (station nav, material toggles, the early case-study card) matches exactly — the case-study card is DOM narrative, not a 3D hotspot.
- Caveat, stated honestly: the HEAD probes ran in the ZCode in-app webview, not real Chrome. Badge absence there could in principle be tier-related, but the code-level unrenderability of 13/14 defs holds regardless; JG-036's required proof re-verifies in the trusted verifier environment.

## Why this survived every gate

No verifier roster (`verify-jgun-opening.mjs` et al.) has ever included a hotspot click — they assert scroll/telemetry only. Vision-based review confabulates on the dark scene (repo rule). And after JG-035 the wrench chapter displays the passive tolerance stations, so reviews saw "annotations present." Net: `caseStudies.ts` still lists 18 hotspots and `CameraRig.tsx` still carries 18 inspect frames — a museum of wiring for badges that cannot appear.

## Measurement lesson (recorded for future probes)

`elementFromPoint` probes taken immediately after a programmatic scroll/HUD transition produced a false "covered" reading on HEAD's material toggles; re-probing at rest returned the button itself, and a real click worked. Always re-probe at rest and confirm with a real actionability-checked click before declaring UI dead. (First negative observation is not evidence; the repo's telemetry-not-vision rule generalizes.)

## Owner statements (2026-10-08, in session)

- "i have never seen a hotspot work. i had asked for them and thought they just kept getting overlooked. and i had more work to get done so i kept building."
- "make it a proper task in the queue. I want it to be addressed next session along with whatever else they had planned."
