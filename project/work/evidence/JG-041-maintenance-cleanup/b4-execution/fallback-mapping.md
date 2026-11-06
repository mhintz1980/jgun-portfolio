# JG-041 B4: check-fallback.tsx legacy App -> current page mapping

Script: scripts/check-fallback.tsx. Fixture: `renderToString(TorqueWrenchPage, store=createTorqueWrenchStore({tier:'poster'}))` replaces `renderToString(App)`.
Run: esbuild bundle (--platform=node --format=esm --packages=external --loader:.css=empty, output in ignored .scratch/) then node. Result: 19 checks, 19 PASS, 0 FAIL, exit 0.

| # | Legacy check (App) | Current check (TorqueWrenchPage, poster) |
|---|---|---|
| 1 | html has 'Industrial Pneumatic Torque Wrench' | h1 with 'Industrial Torque Wrench' (current title) |
| 2 | 'STATIC RENDER MODE' notice | data-torque-mode="static" plus 'Work in progress' label (no literal notice string exists now) |
| 3 | data-chapter="0" (gearbox) | data-torque-chapter="drafting" (first chapter) |
| 4 | data-chapter="3" (AI matrix) | data-torque-chapter="inspection" (4th chapter, same index) plus inspection control aria-controls="torque-inspection-detail". Legacy AI-matrix content no longer exists; mapping is positional. |
| 5 | no <canvas> | no <canvas> and no data-torque-scene= |
| 6 | no 'pointer-events-none flex min-h-[220vh]' class | #torque-story article has no inert / aria-hidden (poster tier is not live, so text is reachable) |
| 7 | no 'SYSTEM BOOT' | no 'torque-preloader', data-torque-stage="poster", and 5 poster slots (data-torque-poster-pending="stage-6") |
| 8-19 | BootPanel / HotspotButton / TechnicalHUD assertions | Unchanged, same imports |

Caveats: check 6 is a semantic substitute (old class gone). Static notice, chapter 3/4 content are equivalent by role, not text. Poster slots are still pending Stage 6 placeholders (no <img>).
