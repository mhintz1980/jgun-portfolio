# Kickoff prompt — torque wrench (JGUN) page rebuild

Paste everything below the line into a fresh Claude Code session started in `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench`.

---

/claude-tiers

You are starting the **torque wrench (JGUN) page rebuild** for jgun-portfolio. Working directory: `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench` (git worktree, branch `torque-wrench/rebuild`). Do not edit or switch `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio` — another session owns it.

**Read first, in order, then summarise back in 10 lines before doing anything:**
1. `AGENTS.md`
2. `docs/HANDOFF-quiet-machine-2026-10-10.md` (the decisions in its §2 are FINAL; do not reopen them)
3. `docs/owner-notes-marksList-2026-10-10.md`
4. `docs/quiet-machine-integration-design-2026-10-09.md` §10 (amendment) and §9
5. memory file `torque-wrench-scroll-length-not-locked.md`

**Process.** Run questions > research > design > structure > plan > implement. **Stop after each phase and wait for my approval.** Write each phase output to `docs/torque-wrench-rebuild/` (captures under `project/work/evidence/torque-wrench-rebuild/`). Use the claude-tiers skill: Opus authors and approves every plan, Sonnet implements, Haiku does mechanical work, Opus reviews critical work. Write every ruling I give into the repo immediately.

**Decisions already made — do not re-ask or relitigate:**
1. The torque wrench gets its own page and its own scroll length. The scroll length is NOT final and nothing is tied to it. I want a much longer scroll-to-storyline ratio and a smoother flow. Users currently fly past beats and have to "tiny scroll" back. The old "JGUN timings unchanged" rule is withdrawn.
2. Extensibility is first-class. Beats are authored as data on a scroll-length-independent timeline; adding a sequence must not mean editing the scroll spine. I want to add more bullet-time sequences later without pain.
3. I am open to a fresh page built from the current page as a parts source. The current page stays live and untouched until the replacement is accepted, then it is archived. Treat this as a proposed default and confirm it in questions.
4. Pages are separate documents joined by hard navigation with a fade through dark. The Quiet Machine lives at `/quiet-machine/` and M249 gets its own page later (JG-037, reserved only). A parallel session builds the page-shell primitives (HTML entry, fade overlay, nav, poster path); you consume them and design only until they land.
5. Bullet time means: subjects stopped or extremely slowed while the camera moves at normal speed and orbits or arcs around the frozen assets. The Input Shaft cutter slow-mo inside a scroll-driven timeline is good but NOT complete; it needs camera swings and slow-motion timing tweaks, and becomes the reference only once completed. "Planet gear inspection" and "machined after heat treat for class H7/g6 fit" are not in the camera sequence yet and should be easy to add afterwards.
6. Opening scene: crack rhythm is fast-pause-farther-fewer-pauses (already in `src/scene/drawing/electricalScore.ts`); colour is light blue electricity; the tunnel under the paper must be rocky and cavernous, near-vertical walls, no visible floor or bottom, circular hole and splined collar removed. Target image: `project/work/evidence/JG-035-opening-drafting-table/blue-trace-tunnel-2026-10-03/concept-media/03-deep-tunnel-feedback.png`. The current look (`.../owner-revisions-2026-10-07/after-o1b/opening-desktop-t0p9.png`) lost it.
7. The three ideas in `marksList.md` (AI HDRI, depth-map shard debris, GLSL mask scan) are candidates, not commitments.
8. Visual effects need Astra (`gpt-6-astra`, codex surface) approval before they count as done. I rule on visuals by looking: send PNGs. No push, PR, deploy or publish.

**Your FIRST research item (before any design):** a diagnostic capture of the opening tunnel at t≈.84–.98 on real hardware GL, full quality tier, compared to the target image, to decide whether the lost rock look is a tier/render problem or a geometry/shader problem (the code still defines rock colours and a shaft depth; the 2026-10-08 captures were SwiftShader). **The JG-035 session reserves the GPU, builds and preview ports — ask me to get it released before running anything on the GPU.** Do not change tunnel code before the capture.

**Questions phase:** ask only what is genuinely undecided (candidates: cutover and URL of the new page; how long the new scroll should be as a starting point; which existing beats are in scope for the first release; what "smooth" means in numbers, e.g. maximum story beats per viewport height; whether the fresh page reuses the current drawing/CAD pipeline or only the assets). Give each question a recommended default so I can answer in one click.

**Reporting style:** I skim. Line one of every report = the decision I need or the cost (a number, with the model named). Estimate tokens before any expensive run and offer the cheapest variant.
