# Design OS review for JGun and related projects

Date: 2026-10-31  
Status: Research and proposed trial; no adoption or implementation approved by this document.  
Repository: [jangtrinh/design-os](https://github.com/jangtrinh/design-os)  
Reviewed revision: [`369b041`](https://github.com/jangtrinh/design-os/tree/369b04155c7e1b8503b8a0ef676ce168d81e5a2e), current main at inspection. Source package: `ease-design` 0.6.2.

## Recommendation

**Worth a selective trial for visual concept development and consistency across projects. Its strongest contribution here is helping us choose and communicate a visual direction before implementing more HUD work.** Keep the existing CAD, R3F, camera, animation and telemetry skills authoritative in their domains.

Start with one small comparison: three quieter HUD directions over the same real JGun scene frames, with desktop and narrow variants. Use Mark's choice to define a small set of reusable visual rules. Evaluate whether Design OS improves that result enough to justify another tool and instruction layer.

This is a toolkit for AI agents: Markdown knowledge, routing instructions, a Node CLI, design-system artifacts, and checks. It does not itself supply a mechanical scene engine or automatically solve design taste. Some workflows have the host agent author the result and provide the browser or Figma environment.

## What would help us

| Capability | Application in this project | Value and limits |
| --- | --- | --- |
| Concept definition and direction selection | Clarify the viewer, primary action, composition, responsive behavior and states before building HUD alternatives | **High.** The routing guide calls for 3–5 rendered directions when appearance is uncertain. This closely matches the owner's current request for understandable concepts. |
| Design tokens and component conventions | Share typography, spacing, colors, focus states, buttons, project navigation and discreet WIP labels across studiomark.dev pages | **High after a direction is chosen.** Freeze only the useful shared vocabulary; allow each project's model and story to lead its composition. |
| Separate builder and critic; rendered review | Compare alternatives at actual viewing sizes and ask a separate reviewer to explain hierarchy, obstruction and visual coherence | **High.** Better evidence for a taste decision than an implementation description or an automated score. Mark still chooses the direction. |
| Content, layout and accessibility checks | Catch placeholder claims, basic overflow, missing labels, inconsistent styling and some motion/focus mistakes | **Medium.** Several commands analyze HTML and linked CSS. They do not establish behavior inside a live React/WebGL application. |
| SVG, diagram and technical illustration workflows | Produce supporting system diagrams, case-study explanations and technical editorial artwork | **Medium.** Useful adjacent material; exact CAD geometry and part identity still come from our assets and measurements. |
| Motion and cinematic reference material | Help storyboard a new landing page or assess whether an effect communicates anything | **Limited additional value for this rig.** We already have more specific camera, dual-clock, GSAP and R3F guidance. |
| Cross-runtime adapters | Make a chosen workflow available to agents in different coding environments | **Potentially useful across projects.** Another broad router also increases overlap with the installed skill library. |

The concept template is particularly practical: surface/purpose, one primary action, named macrostructure, existing-system versus exploratory mode, data provenance, states and widths. Its designer workflow then separates building, machine checks, visual inspection and independent criticism. Those habits are useful even before adopting the CLI.

Sources: [need routing](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/knowledge/need-routing.md#L20), [concept template](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/skills/design-os-designer/concepts.md#L1), [designer workflow](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/skills/design-os-designer/SKILL.md#L14).

## Fit with our current direction

The current owner policy already asks for quieter, model-first concepts, with the older sibling HUD serving as reference rather than the target. It calls for visual examples and normal-speed perceptual review, incremental WIP publication, and proportional verification. Design OS could make those concept comparisons more disciplined; it should feed this workflow rather than create a competing acceptance system.

For example, a useful comparison could explore:

1. **Museum caption:** one restrained chapter title and short caption near an edge; detail appears on request.
2. **Technical margin:** a narrow editorial rail with the current assembly or part context; the model retains the center.
3. **Minimal transport:** a compact progress/navigation control with brief contextual text at meaningful story beats.

These are suggested comparison directions, not selected designs. Judge them over identical scene frames, including a busy exploded state and a fast transition. Begin with stills for composition, then test the preferred candidate over motion so the HUD and model can be assessed together.

Current project sources: [owner policy](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/context/owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md:30), [readability policy](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/context/owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md:51), [task intake protocol](C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/project/README.md:39).

## Findings that affect adoption

### 1. The documented installation command is currently inconsistent with the package

The README recommends `npx @easestart/design-os init`. A direct lookup of that package's public npm registry endpoint returned **404** during this review. The repository's package is named **`ease-design`**, version **0.6.2**, exposes the **`ui`** executable, and requires **Node >=20**. The public registry for `ease-design` returned 0.6.2 and points back to this repository.

The implementation documents an explicit runtime selection, such as `ui init --runtime codex`. A candidate command for a later disposable trial is `npx --package=ease-design@0.6.2 ui init --runtime codex`, after checking its help in that environment. This command was **not executed** here.

Sources: [README](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/README.md), [package.json](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/package.json), [init command](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/src/commands/init.ts#L70), [published package](https://www.npmjs.com/package/ease-design).

### 2. Initialization changes persistent agent instructions

For Codex, initialization writes `AGENTS.ease-design.json` and inserts or updates a managed block in `AGENTS.md`. Other adapters create workflow and skill files. `--force` can overwrite managed filenames, including edits to those files.

Our repository already has substantial routing and owner policy. Try the tool in a disposable project first and inspect the generated instructions before deciding what belongs here. The upstream docs explicitly retain precedence for project tokens and platform specialists, which gives us a sensible integration boundary.

Sources: [adapter behavior and precedence](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/docs/design-entry.md#L18), [installation write behavior](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/docs/design-entry.md#L43), [Codex adapter](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/src/adapters/codex.ts#L25).

### 3. Automated taste checks have a narrower scope than the headline suggests

`taste-lint` reads an HTML file and applies rules such as tiny text, off-grid spacing, missing reduced-motion handling and stylistic preferences. `validate-layout` describes its checks as static heuristics that may produce false positives. A Vite SPA's initial HTML does not contain most of its rendered component tree, so applying these commands directly to `dist/index.html` would leave much of this site unexamined.

The separate browser-based `look` workflow is more useful for prototypes: it captures 375, 768 and 1440 px, measures overflow and other failures, and explicitly says a zero exit does not mean the design looks good. Its documented input is an evidence folder with an entry page. Adapting it to the existing app requires checking that contract; live scene states still need our focused browser and telemetry checks.

Use these tools to surface issues in suitable artifacts. Preserve our distinction between visual preference, runtime correctness and owner acceptance. Also avoid importing their strict shipping gates as new prerequisites for every WIP release.

Sources: [taste-lint implementation](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/src/commands/taste-lint.ts#L26), [layout linter](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/src/commands/validate-layout.ts#L20), [rendered look contract](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/skills/design-os-designer/look.md#L1).

### 4. Its style and cinema defaults need selection

The top-level marketing emphasizes 2:1 axonometric black-and-white art direction. That could suit an explanatory illustration, but it should not determine our live camera angles or overall brand. Deeper documentation permits project-specific tokens and different design families; the package is less stylistically narrow than its README suggests.

Its scroll-cinema guide primarily covers **pre-rendered video scrubbed by scroll**. Its `scrub-lint` checks MP4 container facts such as fast-start layout, audio tracks and keyframe density. Those are useful for future video-led pages, not evidence about our R3F bullet-time system. Likewise, `scroll-story` reports frame changes as ACTIVE or FLAT and explicitly treats that as information for a critic, not a quality gate.

Sources: [project context precedence](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/skills/design-os-designer/concepts.md#L38), [scroll cinema](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/knowledge/scroll-cinema-direction.md#L7), [scrub-lint scope](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/src/commands/scrub-lint.ts#L29), [scroll-story scope](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/src/commands/scroll-story.ts#L1).

### 5. It has substantial implementation, but needs a real pilot

The reviewed tree contains 375 files with conventional `.test` or `.spec` JavaScript/TypeScript names. Package scripts include type checking, lint, tests and build checks. This is more than a prompt collection, but file counts do not establish passing tests or visual quality. No upstream suite, Windows installation or Figma integration was run in this review.

The license is **PolyForm Shield 1.0.0**, including a noncompete restriction and redistribution notices. It is not an MIT-style unrestricted dependency. That matters particularly if we later redistribute bundled tooling or build a competing design-agent product; ordinary portfolio work is a different use case. Preserve the license and notices for any copied material.

Sources: [package checks](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/package.json), [license](https://github.com/jangtrinh/design-os/blob/369b04155c7e1b8503b8a0ef676ce168d81e5a2e/LICENSE).

## Proposed trial

1. Use a disposable workspace and the reviewed version; inspect generated files before any repository integration.
2. Give it our owner policy and representative real scene captures. Request three distinct, quiet HUD directions at desktop and narrow widths, keeping the model central and explaining the viewer's primary action.
3. Compare the same scene states side by side. Have a separate critic assess hierarchy, model obstruction, legibility and responsive changes. Mark selects or revises the direction.
4. Record the chosen typography, spacing, color and control rules in the existing project context. Implement a bounded slice through the normal approved work queue.
5. Compare the effort and result against our existing skills. Keep only capabilities that improve the work. Validate implementation with build, asset/route and focused runtime checks, including reduced motion; retain actual failures and deferred work.

Success means a clearer owner decision, a calmer HUD and reusable visual rules with less repeated explanation. A higher automated taste score alone would not justify adoption.

## Where it would help similar projects

- **CAD/product portfolios:** strong potential for shared navigation, project introductions, case-study layouts and model overlays. Specialist geometry and motion work stays with the existing toolchain.
- **New marketing sites:** potentially stronger end-to-end value, because visual direction, tokens, content hierarchy and responsive page construction all begin together.
- **Dashboards and internal tools:** useful for component consistency, information density, empty/error/loading states and review conventions. Pilot with the target framework before adopting HTML-oriented checks.
- **Technical documentation and presentations:** SVG/diagram workflows could make engineering explanations consistent with the site. Those domains were not independently tested here.
- **Video-led cinematic pages:** scrub encoding and seam guidance become relevant when the deliverable actually uses pre-rendered scroll video.

## Review scope and repository impact

Read current upstream documentation and selected implementation at the pinned revision; checked live GitHub and npm metadata; compared against current TODO, project map, measured animation specification and owner policy. A parallel read-only reviewer gathered local project context. Earlier memory was used only to orient the review toward current authority; current files supplied the project conclusions.

No Design OS installation, initialization, package execution, source change, deployment, commit or task-queue update was performed. This inbox review is the only authored file. Existing dirty work was preserved. The trial remains a recommendation.
