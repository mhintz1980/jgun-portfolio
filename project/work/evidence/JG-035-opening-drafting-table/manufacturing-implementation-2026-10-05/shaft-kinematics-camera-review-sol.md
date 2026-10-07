**FIX-FIRST**

- **P1 — Machining time is not C1 at startup.** [kinematics.ts:86](/C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/kinematics.ts:86) switches directly from rate 0 to rate 1 at **2.0 s**. Independent one-sided derivatives are **0 and 1**, producing an abrupt motion onset. [kinematics.test.ts:54](/C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/kinematics.test.ts:54) misses the kink because its sampling intervals align with the boundary. An interval straddling 2.0 s exceeds its error tolerance by over 10×. Ease the startup rate and test boundary derivatives explicitly.

- **P2 — Material camera settles after the first card becomes readable.** [camera.ts:61](/C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/camera.ts:61) continues transitioning until **16.2 s**, although the 4140 card reaches full opacity at **15.14 s**. During that readable interval, camera position moves **79.39 mm**, FOV changes **16.05° → 7.2°**, and up rotates **90°**. This violates the steady material view. [camera.test.ts:139](/C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/camera.test.ts:139) starts checking at 16 s and omits the initial transition.

- **P2 — Final material card overlaps the reserved shaft framing.** [camera.ts:69](/C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/camera.ts:69) projects the existing shaft-axis probe `(0,19.2,0)` mm to desktop **x=981.4 px**, inside the reserved **806.4–1324.8 px** card band. This persists while the final 4340 card is fully visible, including **33.34–34 s**. The slot test omits that card.

**Verified:** all **63 tests passed**. Independent checks confirm continuity and monotonicity, −2 generating ratio with pitch-velocity residual below **8×10⁻¹⁵**, cutting-only depth increments, all ten spaces complete by **12.925 s**, a **2.4 s** slow window with approximately **0.84 s** full relieved return, recap compression/`softened`, certified hob path and clearance by 32 s, cutting-only chips, C1 camera handoff and safe exit framing, deterministic seeks, and allocation-free sampler paths.

No files edited; TODO and queue docs were not read.

