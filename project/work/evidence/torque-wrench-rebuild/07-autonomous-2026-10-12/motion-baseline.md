# Stage 2 motion/progress baseline audit

2026-10-12. Baseline dc44fb79, refreshed source in this workspace; no protected checkout used. This is a source refresh plus attributed earlier measurements, not fresh private-page motion/performance acceptance.

## Source observations retained before conductor edits

- src/scene/ScrollRig.tsx:22–33 constructs Lenis with duration1.1/smoothWheel, GSAP ticker seconds→milliseconds, lagSmoothing(0), scroll→ScrollTrigger.update. Lines40–67 have one paced global trigger plus separate chapter triggers. Private page retains the clock integration and duration, but replaces all legacy chapter writers with one canonical writer.
- src/scene/drawing/introTimeline.ts:32 and pacedProgress/rawScrollFor implement raw→paced with intro raw share .5 and paced release .12; owner close-reading remap is another axis. Source is retained, not repurposed as the new page's global canonical map.
- Hero timeline insertion positions .12/.27/.47/.54 and total1.02 are GSAP timeline units, not private beat coordinates; numeric scrub .6 adds catch-up. Private director mapping must normalize these explicitly at Stage3 and adds no numeric scrub by default.
- CameraRig's damped pose, rest orbit, old multi-page camera path and root inspection/quality/scroll stores are not imported. Settling transients cannot be silently treated as canonical narrative; fixed canonical progress freezes authored pose/channels.
- Ring source law is positive rotation shift*2π/3, travel+.009525m and fork−.015m. Measured part-keyed ladder, display turns8/5.2/3.38/2.2/1.43 in physical order1→2→5→3→4, planets−3.5 are preserved.
- Shaft subject rate .22 in7.2–9.6s and fixed camera anchors7.2/9.7s are the current incomplete bullet-time baseline. Stage3 must map subject time independently of camera translation/orientation.

## Historical measured lineage

Research report05 and 02-motion-baseline/runtime-snapshot.json attribute1440×900, document28080px/range27180px, inverse paced.525→raw.7301136364, about19844px/2205vh. Twice that is approximately4410vh. This is an attributed earlier camera-boundary proxy, with false warm/annotation readiness and quality-lock limitations. It is not current private-page distance/performance proof. Private starting track is44.1 viewport heights; final pacing/distance stays revisable and independent of canonical beat semantics.

## Stage2 decisions

Canonical private progress is one finite normalized0..1 value derived from private document scroll. No legacy raw/paced/chapter axis follows the private store. Single Lenis/GSAP ticker and global ScrollTrigger, no numeric scrub, no autonomous commit assist or rest orbit. Initial Lenis duration1.1 retained. Pure samples derive endpoints/phase/state key from canonical progress. Pixel track length is separate data. Static/reduced/failure paths mount no conductor, GPU world or extra input smoothing.

Required Stage2 checks: pure forward/reverse/seek/reload/hold equality; unknown directors/invalid windows; added-beat fixture; single-writer runtime cleanup/remount; no progress emissions to the lifecycle React snapshot; independent source review. Camera/render/cutter/hardware and full-motion acceptance remain future actual-world checks.

## Official API refresh

Parent fetched current official GSAP ScrollTrigger documentation and the tagged Lenis v1.3.26 README, both HTTP200, before runtime integration. They confirm Lenis autoRaf:false/manual raf(milliseconds), GSAP ticker seconds conversion, scroll→ScrollTrigger.update, lagSmoothing(0), destroy lifecycle, global max-range/refresh behavior and numeric scrub catch-up. Installed source remains the effective-option authority where README's lerp/duration wording differs. URLs: https://gsap.com/docs/v3/Plugins/ScrollTrigger/ and https://raw.githubusercontent.com/darkroomengineering/lenis/v1.3.26/README.md. No dependency upgrade or global configuration change.
