# Brainstorm prompt — using the portfolio's load window (2026-10-13)

Hand this to a fresh agent session as-is.

---

**Mission: brainstorm how to use the portfolio's load window to tell visitors what they're about to see.**

**Context.** jgun-portfolio (Vite + React + R3F) is Mark Hintz's engineering portfolio site. The hero feature is an interactive JGun Torque Wrench: the page opens on a cream-vellum drafting-table scene — an oversized engineering drawing sheet (navy ink, GD&T lettering, walnut desk) that a 3D torque wrench eventually breaks through and lifts out of — then scroll-driven chapters tell the design, manufacturing and inspection story. Start by reading `AGENTS.md`, `TODO.md`, and `project/context/architecture/animation-spec.md` §5.

**The fact to design around.** The opening scene is not ready the moment the canvas mounts. The drawing sheet is baked on load (precomputed-cache decode ~1–2 s warm; live bake up to ~8–10 s on the reference iGPU, AMD Radeon 780M), and quality-tier warmup completes around the same time. Measured 2026-10-13: the 3D canvas is live at ~1 s; the sheet/desk world appears at ~8 s on the live-bake path. Today that window shows a defect (a dark wrench silhouette — a gate is being designed). Diagnosis packets: `project/work/evidence/JG-035-opening-drafting-table/load-flash-diagnosis-2026-10-13/README.md` and `project/work/evidence/JG-035-opening-drafting-table/g6-diagnosis-2026-10-13/README.md`. Reference pattern: oryzo.ai gates its opening behind a `#preloader-canvas` element in the initial HTML.

**What to brainstorm.** Concepts for a loading/opening treatment that sets visitor expectations: "you are about to see work I have done," framed by the fact that this is an engineer's portfolio, not a product site. The wait is real (bake + warmup) — it must not be artificially lengthened, and it should not be dead air either.

**Constraints.**
- Fit the drafting-table identity (vellum, navy ink, title block, GD&T language). Treatments should feel like the drawing office, not a generic spinner.
- Variable duration: must read correctly at ~1 s (cache hit) and stretch gracefully to ~8–10 s (live bake). No fake progress bars tied to nothing.
- Reduced-motion and poster tiers need a static equivalent; those paths must keep zero CAD download and zero WebGL mount.
- Owner motion standard: `docs/torque-wrench-rebuild/smooth-scrolling.md` — no lag-as-smoothness, no janky reveals.
- Brainstorm only: no implementation, no code changes, no commits, no edits to the live page.

**Deliverable.** 5–8 concepts, each with: (a) one-line idea; (b) what it communicates about "work is about to be shown / this is a portfolio"; (c) behavior at 1 s vs 8 s; (d) reduced-motion/poster variant; (e) implementation surface (DOM overlay / canvas / both) and rough complexity; (f) risks. Close with your top recommendation, why, and the list of owner rulings it would need.
