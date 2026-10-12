# Portfolio Motion Standard — Oryzo-Inspired

**Goal:** Achieve Oryzo-like cinematic continuity, controlled pacing, and precise scroll interaction. Smoothness means fluid movement without perceptible jumps, not simply slow movement.

### 1. Narrative Pacing
- Target approximately 150–250vh per major cinematic beat; adapt to visual complexity.
- Give important compositions sufficient time to settle and be understood.
- Use deliberate reading holds, typically 60–120vh where needed.
- Keep small camera actions and synchronized effects within a single beat.
- Avoid uniform pacing. Alternate movement, anticipation, impact, and rest.

### 2. Scroll Input
- Retain Lenis as the primary input-smoothing system.
- Start from the existing 1.1s duration; tune through comparative tests.
- Do not stack another 1.0s GSAP scrub delay without demonstrating a benefit.
- Use frame-rate-independent smoothing.
- Preserve responsive reverse scrolling, touch input, and reduced-motion behavior.

### 3. Cinematic Camera
- Use continuous camera paths with at least C¹ continuity and target C² continuity for ordinary cinematic transitions.
- Prefer spline-based position and look-target trajectories with controlled acceleration.
- Use stable quaternion interpolation where orientation requires it.
- Avoid abrupt camera target, FOV, zoom, roll, or velocity changes.
- Coordinate camera movement with object animation rather than smoothing each independently.
- Permit intentional rapid moves, but give them designed acceleration and deceleration.

### 4. Scroll Determinism
- Drive synchronized scene effects from one canonical scroll-progress value.
- Pausing must freeze narrative animation.
- Reversing scroll must retrace the sequence without discontinuities.
- Avoid accumulated frame-dependent animation state for scroll-controlled events.
- Keep paper fracture, portal reveal, model emergence, and camera movement synchronized.

### 5. Performance and Verification
- Target stable 60 FPS on capable desktop hardware, with adaptive quality elsewhere.
- Record frame times and visible frame-to-frame camera motion.
- Test slow scrolling, fast scrolling, abrupt stopping, and direction reversal.
- Detect jumps in position, rotation, FOV, and visual composition at keyframe boundaries.
- Check for excessive motion lag or continued movement after input stops.
- Compare full-motion browser recordings against Oryzo, not isolated screenshots.

### Implementation Rule
**Do not optimize smoothness by increasing lag.** First correct discontinuous motion paths, poor scene coordination, and uneven pacing.

Inspect existing Lenis, GSAP, ScrollRig, CameraRig, and scroll-progress mappings before changing their parameters. Preserve verified behavior and measure improvements against a baseline.