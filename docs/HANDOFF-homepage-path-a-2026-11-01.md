# HANDOFF — Homepage, Path A "Print Vault + Loupe" (2026-11-01)

> **Historical brief; corrected homepage owner-approved 2026-11-03.** Read the
> [current homepage status](homepage-header-scroll-2026-11-03.md) first. The scroll
> gate, WCS hover navigation and full-bleed torque-wrench images are implemented and
> verified; the owner then requested public release. Branch/PR/verification and
> "next" statements below describe their original dates;
> do not use them to override the current dirty checkout or newer owner directions.

Owner: Mark Hintz. Written by a Claude Code cloud thread at Mark's request ("reach a pause point
and write a handoff ... distribute this work across several agents and have one agent be
orchestrator"). Nothing here is approved beyond what is stated in "Approval state".

## Where we left off (2026-11-02, read this first)

- Built on branch `claude/project-thread-tlq9j4`, draft PR #5 (into `torque-wrench/rebuild`). Private
  `/home/` and `/armament/` pages. Not merged, not deployed, root `/` unchanged.
- Single-file preview for Mark: https://claude.ai/artifact/XU9XG3A6B1PTQ7YBRYexvW (project links
  don't navigate there). Rebuild: esbuild bundle of `src/home-main.tsx` (do NOT mark `/home/*` as
  external, it matches the absolute repo path), then inline `/home/**` images and `/fonts/home/*`
  as data URIs.
- Done 2026-11-02 at Mark's request ("things I like about my old one"): v2 fonts (Michroma, Archivo,
  Space Grotesk, JetBrains Mono; `src/home/FONTS.md`), rolling hero sentence in his wording, parallax
  drift halved, peel-through image stacks per project (`ProjectStack.tsx`, `stackMath.ts`) with
  links to the 3D pages, a "Renderings & Visualizations" gallery row.
- Done 2026-11-02, Mark: "ITAR is fine but we should be blurring some dimensions and company names.
  Definitely remove the torque gun anywhere it appears as well as the company names."
  - Dimension and note text blurred on all 5 dimensioned vault drawings and 6 stack drawings with
    `scripts/blur-dimensions.py` (blurs callout-height words; view labels like SECTION A-A stay
    sharp). Originals are in git history before this commit. pump-assembly has only balloons.
  - Removed the pistol-grip Torque Gun images (finished-tool photo, exploded handle, red pistol-grip
    render). The torque-wrench stack is now gearbox drawings only.
  - "Torque Gun" / "JGUN" removed from displayed copy: homepage, `/torque-wrench/` title, meta and
    hero, story text, drawing-sheet title block, station name, intro titles, root link. This
    replaces the 2026-09-05 rule that made "High-Precision Industrial Torque Gun" the public name;
    it is now "High-Precision Industrial Torque Wrench" (`src/data/caseStudies.ts`).
    `content.test.ts` bans both names in homepage copy.
  - Not checked: textures inside the GLB models and the old poster/video frames may still show the
    brand. Check before go-live.
- Done 2026-11-02 (preview comment): header name is `DrawnName.tsx` + `name.css`, Archivo 900,
  exactly 50vw wide, outline traced in Revision Orange then filled; gap 10vw (about two letters) to
  the nav; nav is v2 style (Space Grotesk 15px, underline on hover); theme toggle is the v2 pill
  (80x40, sliding knob, sun/moon). Hero eyebrow is now just "Jacksonville, FL".
- Next options Mark raised: a new video reel below the hero (old Remotion reel is not reusable as
  is: unverified claims and logos). Not started.

## Where things are

| What | Where |
| --- | --- |
| Work branch | `claude/homepage-print-vault` on `github.com/mhintz1980/jgun-portfolio`, based on `origin/torque-wrench/rebuild` @ `ccb215b2` |
| This handoff | `docs/HANDOFF-homepage-path-a-2026-11-01.md` on that branch; copy at `/mnt/project-files/homepage/HANDOFF-homepage-path-a-2026-11-01.md` (project files, cloud threads) |
| Mark's local worktree | `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench` (a worktree of `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio`) |
| Agent feedback comparison (why Path A) | Claude Doc https://claude.ai/artifact/4Ez6Kjcz58vVsqBG17UCMD |
| Earlier interactive mockup (particle concepts, now superseded) | https://claude.ai/artifact/CbB6mGcx9DuMhZG4x3isMG |
| Raw agent answers | `C:\Users\Markimus\.buzz\REPOS\jgun-torque-wrench\multi-agent prompt.txt` |

Repo state facts (checked 2026-11-01):
- GitHub `main` is stale (2026-10-04). The live work is on `torque-wrench/rebuild`.
- Mark's local worktree = `torque-wrench/rebuild` + 17 modified + 8 new uncommitted files
  (scripts/verify-*, src/scene/torque-wrench/*, contactWitnesses*). None of them touch the files
  this homepage needs, so the branch should merge cleanly. Do not touch his worktree or the
  sibling `jgun-portfolio` checkout (owner spec 2026-10-31).
- The repo is public. Read `AGENTS.md`, `TODO.md`, `project/README.md` before code changes.
  Task Intake rule: register the work (next stable JG ID) via `project/work/inbox/` → `plans/`
  → `TODO.md` in the same change.

## Approval state

- Approved by Mark (decision card, 2026-11-01): build **Path A, "Print Vault + Loupe"**.
- Approved by Mark (2026-11-01): add the **thread concept** from https://dakshgajjar.com/
  ("scroll to follow the thread", "pull to untangle"), and use his reference sites for font/look
  choices: dakshgajjar.com, zeggo.com.sg, fabiantjoeaon.com, 21st.dev "Liquid Sculpture Hero"
  (gughigug). The cloud sandbox and Mark's device VM both block those hosts; only their text was
  read. Fonts on them are NOT known. Ask Mark for screenshots or an allowed-domains environment.
- Default support line chosen by me, Mark has not objected: "20+ years designing precision
  tooling and industrial pump packages."
- NOT approved yet: replacing the live root `/` (it still forwards to `/torque-wrench/`),
  deploying, merging. Publishing/deploy uses `project/context/deployment.md` and runs on Mark's PC.

## What to build (spec)

Register the homepage as a **private page at `/home/`** first (noindex, not in nav), so Mark can
review it on studiomark.dev/home/ before the root flips. The flip later is one line: the root
shell's default redirect target `/torque-wrench/` → `/home/` (+ pinned tests).

Page, top to bottom:
1. **Header**: "MARK HINTZ" (mono), anchors Work · + Plus · Contact, light/dark toggle (aria-pressed).
2. **Hero**: eyebrow "Mark Hintz · Jacksonville, FL"; H1 "Mechanical Designer" / "**+** Systems
   Builder" (the + in accent, where the thread starts); lede (support line above); cue "Follow
   the thread ↓"; hint "Move the cursor to inspect the drawings" (touch: "Scroll to ...").
3. **Work**: three numbered rows (01–03), stacked full width (Daksh-style list), each with title,
   one line, tags, status, arrow. 01 JGUN → `/torque-wrench/`, 02 The Quiet Machine →
   `/quiet-machine/`, 03 Armament = "Under construction", not a link yet (Mark wants it reachable
   as an under-construction page: follow-up, needs a page + ITAR check).
4. **+ Systems Builder**: sub "Tools for the work around the CAD."; 2×2 cards with status labels:
   PumpTracker (Used in production), StudioMark (Working pipeline), CAD/PDM tools (Prototype),
   This site (Live).
5. **Testimonial**: Darrin Phipps quote (in `src/home/content.ts`).
6. **Contact**: "Have a tangled design problem?"; rope canvas "Pull the thread"; email, LinkedIn,
   GitHub always visible as plain links (never gated on the rope).
7. **Footer**: "studiomark.dev · Work in progress · © year Mark Hintz".

All copy is already written in `src/home/content.ts` (committed). Change copy there only.

### Effects

- **Ghost vault** (fixed, behind content, `aria-hidden`): 6 drawing layers on desktop, 3 on
  phones (the `primary` ones), 3 static with reduced motion. Each layer is a `div` with
  `mask-image: url(<webp>)` and `background-color: var(--ghost-ink)`, so the theme recolours
  them for free. Animate `transform` (translate3d + scale) and `opacity` only; no CSS blur or
  blend modes. Layer config (centre, width, drift px per 1000 px scroll, scale rate) is in
  `DRAWING_LAYERS`. Resting opacity ≈ 0.10–0.14 (≤ 0.18 by rule). Subtle drafting grid on the
  vault background.
- **Loupe**: one second plane holding full-ink copies of the same layers with the same transforms,
  masked by ONE `radial-gradient` at the pointer (`--lx/--ly/--lr` on the plane). Only that mask
  changes per frame. Thin accent ring + crosshair ticks follow it. Touch: slow sweep tied to scroll
  position. Reduced motion: off.
- **Hover preview**: hover/focus on a work row → that project's layers come forward (opacity up,
  scale ×1.06, ease toward centre), others dim; `prefetchPage(document, [href])` from
  `src/shared/pageFade.ts`. Phones: the row crossing the viewport's centre band takes focus
  (IntersectionObserver); a tap always navigates. Links use `data-fade` (site fade convention,
  `installPageFade`).
- **Thread** (the Daksh concept, in Revision Orange): one SVG path in page coordinates from the
  "+" in the H1, lacing through the work rows (enter/exit eyelets on alternating edges, hidden
  behind the opaque cards between them), zig-zagging through the 4 Plus cards, ending at the
  contact rope's anchor. Built as a Catmull-Rom spline through anchor points read from
  `[data-thread]` elements; rebuilt on resize/font load. It draws itself with scroll: sample the
  path once, keep a running max-y, binary-search the length whose y passes
  `scrollY + 0.62 × viewport height`, set `stroke-dashoffset`. Eyelets light when the tip passes.
  Reduced motion: fully drawn, static. Only moves on scroll; no ambient motion.
- **Pull to untangle**: Verlet rope (~60 points), left end pinned where the thread arrives,
  starting as a looped trochoid; drag the free end (needle eye handle) and it straightens; solved
  when end-to-end ≥ 0.9 × rope length → caption "Straightened out. Let’s talk." A keyboard
  button runs the same pull as an animation. Loop runs only while in view and not settled.
  Reduced motion: straight, static.
- **Theme**: `html[data-theme=light|dark]`, set by a tiny inline head script before paint
  (stored choice in `localStorage['sm:theme']` inside try/catch, else `prefers-color-scheme`).
  Tokens: light vellum `#F4F1EA`, ink `#14181D`, ghost ink Datum Blue `#1D4E89`, accent Revision
  Orange `#C2410C`; dark blueprint `#0B1622`, text `#E8E4DA`, ghost ink `#CFE0F2`, accent
  ≈ `#F0703A`. Text must pass WCAG AA in both.
- **Fonts**: display = Barlow Condensed SemiBold (already in `public/fonts`, used by the J-GUN
  sheet), body = system UI stack, labels = `ui-monospace`. No new font downloads until Mark's
  reference fonts are known.
- **Parked**: particle preview / Liquid Sculpture Hero style effect as a later swap-in renderer
  behind the same hover hook; test against the drawings with 3 first-time visitors (one on a phone).

### Files (planned ownership)

| File | Status | Owner (suggested) |
| --- | --- | --- |
| `public/home/drawings/*.webp` (6 masks, 29–68 KB each, title blocks/BOMs cropped) | committed | done |
| `src/home/content.ts` (copy + `DRAWING_LAYERS`) | committed | orchestrator |
| `home/index.html` (fade block byte-identical to `quiet-machine/index.html`, robots noindex, theme head script, module `/src/home-main.tsx`) | todo | W1 |
| `src/shared/pages.ts` (+ `home` row: index 4, path `/home/`, `fadeIn: true`, `private: true`) + `pages.test.ts`, `pageTopology.test.ts` entry lists | todo | W1 |
| `scripts/verify-launch-dist.mjs` REQUIRED += `home/index.html` + 6 drawings | todo | W1 |
| `src/home-main.tsx`, `src/home/HomePage.tsx` (composes `<Vault/> <Thread/> <ContactRope/>`), `src/home/layout.css` | todo | W1 skeleton → W5 |
| `src/home/vaultMath.ts` (pure transforms) + `Vault.tsx` + `vault.css` + `theme.ts` | todo | W2 |
| `src/home/threadPath.ts` (pure path + length search) + `Thread.tsx` + `thread.css` | todo | W3 |
| `src/home/rope.ts` (pure Verlet) + `ContactRope.tsx` + `rope.css` | todo | W4 |
| `src/home/*.test.ts` (pure modules; `content.test.ts` pins copy rules below) | todo | each owner |

Separate CSS files per module keep workers out of each other's files. `HomePage.tsx` is the only
shared file: W1 lands the skeleton with stub components first; workers only edit their own.

## Accuracy rules (must hold; put them in `content.test.ts`)

- Never: "Systems Architect", "CATIA", "Creo", "Fusion 360", "PE", "M249" (also banned by
  `verify-launch-dist.mjs`), employer names "Myers", "Seth", "MSP", product name "RL300" in new
  homepage copy, "Built from the shop floor up" (unverified), v2 numbers (22% cost cut, 30+ hrs/
  week, 47 components, ±0.0005", 15 years, 7-axis mill-turn).
- Never mention how or why the CAD migration tool was made. It is "a prototype", nothing more.
- PDM checker: one rule enabled, prototype. Never "automated PDM compliance".
- PumpTracker: replaced whiteboard + spreadsheets, first KPIs, every lead and manager, phones.
  No hours-saved numbers.
- Loupe/callouts: show only text that is on the real drawings. Verified on Mark's drawings:
  "ISO 1328 Grade A6" (J-GUN content), "7075-T6" and "MIL-A-8625 Type III" (AR-15 lower drawing
  notes). Agent 3's "RUNOUT < .001" is unverified.

## Open items for Mark (do not resolve on his behalf)

1. ~~Confirm the Darrin Phipps quote~~ — Mark OK'd keeping it (2026-11-01).
2. Employer names: Mark asked (2026-11-01) to remove any employer names from drawings/models. The
   pump-assembly post decals and the armament revision-table strip were blanked; the CAT engine logo
   (supplier, not employer) remains.
3. ~~ITAR/EAR check~~ — Mark: "ITAR is fine" (2026-11-02); dimensions blurred instead.
4. Send the redacted drawing set (2 per project) to replace the stand-ins.
5. Reference-site fonts: screenshots, or a cloud environment with those domains allowed.
6. Approve flipping the root `/` to the homepage, and deploying.
7. Keep or drop the CAT engine logo on the pump drawing.
8. The blue hydraulic square-drive wrench render (renderings/02) is a Hytorc-style product: confirm
   it is OK to show.
9. GLB textures / poster frames on `/torque-wrench/`: confirm no Torque Gun branding shows.

## Acceptance checks (focused, per owner spec 2026-10-31)

- `npm run typecheck`, `npx vitest run src/home src/shared`, `npm run build`,
  `node scripts/verify-launch-dist.mjs`.
- Playwright smoke on `vite preview` (restart :4173 after each rebuild): desktop 1440×900 and
  phone 390×844 in both themes and with reduced motion. No console errors, no horizontal scroll,
  links reach `/torque-wrench/` and `/quiet-machine/`, keyboard tab order reaches every link and
  the toggle with visible focus, rope solvable by keyboard.
- Contrast: every text token pair ≥ 4.5:1 (compute it, do not eyeball).
- Performance: on a 4× CPU-throttled phone profile, scroll stays smooth; layers animate only
  transform/opacity (check with a Performance trace, not screenshots).
- Screenshots of hero, work hover, thread mid-scroll, contact (both themes) attached to the PR.

## Orchestration plan

1. **Orchestrator**: Task Intake (JG ID), then W1 (registry, entry, skeleton with stubs, tests
   green), push. Then dispatch W2–W4 in parallel on sub-branches off `claude/homepage-print-vault`
   (`.../vault`, `.../thread`, `.../rope`), each owning only its files. Then W5 (layout, cards,
   hover preview, a11y) and W6 (QA checks above). Merge sub-branches, open ONE PR into
   `torque-wrench/rebuild` (or the branch Mark names), screenshots attached, Open items listed.
2. Workers report back: files changed, tests run with results, screenshots, anything unverified.

### Ready-to-paste prompt — orchestrator

```
You are the orchestrator for Mark Hintz's portfolio homepage (Path A, "Print Vault + Loupe").
Workspace: github.com/mhintz1980/jgun-portfolio, branch claude/homepage-print-vault (based on
torque-wrench/rebuild @ ccb215b2). Read, in order: AGENTS.md, TODO.md, project/README.md, then
docs/HANDOFF-homepage-path-a-2026-11-01.md on that branch (the spec, accuracy rules, file
ownership, acceptance checks and open items). Approval: Mark approved building Path A and the
thread concept; he has NOT approved replacing the live root, deploying or merging.
Exact next action: do Task Intake for the homepage (next JG ID), then workstream W1 from the
handoff (register the private /home/ page, home/index.html with the byte-identical fade block,
skeleton HomePage with stub Vault/Thread/ContactRope, updated pinned tests and
verify-launch-dist list), run typecheck + vitest + build, push. Then dispatch W2 (vault, loupe,
theme), W3 (thread), W4 (rope) to separate agents on sub-branches, each owning only its files,
then W5 (layout/cards/hover preview/a11y) and W6 (QA). Merge, open one PR with screenshots and
the handoff's Open items. Never touch Mark's local worktree. Keep every claim inside the
handoff's accuracy rules.
```

### Ready-to-paste prompt — worker (fill in W#)

```
You are worker W# on Mark Hintz's portfolio homepage. Repo github.com/mhintz1980/jgun-portfolio.
Branch from claude/homepage-print-vault into claude/homepage-print-vault-<topic>. Read AGENTS.md
and docs/HANDOFF-homepage-path-a-2026-11-01.md. Build only workstream W# and edit only the files
the handoff assigns to it. Pure logic goes in a .ts module with vitest tests; animate only
transform and opacity; respect prefers-reduced-motion. Run npm run typecheck, npx vitest run
src/home src/shared and npm run build before pushing. Report: files changed, test results,
screenshots (desktop 1440x900 and phone 390x844, both themes), and anything left unverified.
```
