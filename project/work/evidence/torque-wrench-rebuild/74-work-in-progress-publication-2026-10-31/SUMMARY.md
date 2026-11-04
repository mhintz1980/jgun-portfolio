# Work-in-progress publication — 2026-10-31

## Published result

Published the current `torque-wrench/rebuild` working tree to Cloudflare Pages
project `jgun-portfolio`, production branch `main`, using Wrangler 4.156.0.

- Deployment: <https://6ea9c78a.jgun-portfolio.pages.dev>.
- Public pages: <https://studiomark.dev/torque-wrench/> and
  <https://studiomark.dev/quiet-machine/>.
- The apex redirects to `www.studiomark.dev`; `/` serves the existing shell that
  routes visitors to `/torque-wrench/`.
- Both pages carry a discreet "Work in progress" label in existing text positions.
- No DNS change, Git commit, Git push, mechanical/camera change, or asset sync was
  performed for this publication. Source is `ccb215b2` plus the intentional dirty
  continuation and this session's labels; this is not a clean-commit build.
- Previous production deployment, for rollback reference:
  `a120c06d-7525-41b1-a06e-985631c0bbce` (source `e125f03`).

Upload command, after verifying the exact local bundle:

```powershell
npx --yes wrangler pages deploy dist --project-name=jgun-portfolio --branch=main --commit-dirty=true --commit-message="Work in progress portfolio: torque wrench and quiet machine"
```

## Verification

- `npm run build`: PASS (TypeScript and Vite; 757 modules). Existing large-chunk
  warning remains; no chunk/performance optimization was attempted for this update.
- `node scripts/verify-launch-dist.mjs`: PASS — 73 files, 25.63 MB, all 45 required
  assets present, no M249. No external CAD files were copied over tracked assets.
- Four affected page/navigation unit files: 86/86 tests PASS with one worker.
- Deploy PowerShell syntax: PASS. `git diff --check`: PASS.
- Production smoke: 6/6 PASS on installed Chrome with ANGLE/D3D11. Desktop
  1440x900 and narrow 390x844 load both animated pages; narrow reduced motion
  checks both static paths. Each case verifies the work-in-progress text and
  cross-page navigation. Torque runtime is sampled at native progress 0, .62 and
  .94; quiet-machine's Section/Exterior controls are exercised.
- Public documents return 200 and match local HTML SHA-256 exactly; unknown
  path returns the branded 404 with `no-store`.

Reports and captures remain under ignored output:

- `output/playwright/studiomark-wip-2026-10-31/production/report.json` — full
  publication smoke PASS; screenshots beside the report.
- `output/playwright/studiomark-wip-2026-10-31/local/report.json` — initial local
  run: five passes and one harness failure. The reduced torque check incorrectly
  required an image, whereas its authored unfinished fallback is DOM text and
  labeled poster slots. No CAD requests or browser errors occurred in that case.
- `output/playwright/studiomark-wip-2026-10-31/local-reduced-recovery/report.json`
  — affected case PASS after checking the real fallback. The original failed
  report is preserved. Production reran all six cases with the corrected check.

Bundle identity: SHA-256 of sorted `relative-path SHA256(file)` rows joined with
newlines (no trailing newline):

`3585205b145f73daff2354bb2ce9fbc19efb47c875c1ceed9c77e997027d3a6b`

| Document | SHA-256, verified locally and over the public domain |
|---|---|
| `/index.html` | `6db7cbd20841cc710893ae95a9946dc697f33019ace490bc1d389c974702a07a` |
| `/torque-wrench/index.html` | `7ad52f39af6bbe7f6e07c56b185d6b55476b39d9d9068c91b139c4f0a6b09fd4` |
| `/quiet-machine/index.html` | `109757d82f7e13ba5a1811d2de9d7fead44c286772af82240c2259cfb3ba2c43` |

## Durable owner direction and remaining work

The [owner policy](../../../../context/owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md)
is linked from AGENTS, TODO, README, project knowledge/registry, deployment
runbook, registered JG-038 plan, owner rulings, implementation plan, and evidence
73. It supersedes the assumption that unfinished work cannot be published.

Publication smoke is separate from full cinematic/alias/final visual acceptance.
Evidence 73's strict FAIL results remain unchanged. Current HUD/design-framing
polish and dense alias closure are deferred. Next creative priority: Mark gives
HUD direction, agents present visual concepts that keep the models central.
Show high-speed readability issues before more diagnosis; defer an imperceptible
issue after Mark's review, and consider a slight camera-angle refinement first
for a visible issue. Opening semantic completion and independent final review
remain follow-ups. Torque's reduced-motion offline artwork is still unfinished;
this release retains the existing static story and labeled placeholders.

## Cloudflare setup requested by Mark

Read <https://developers.cloudflare.com/agent-setup/prompt.md> and followed its
Codex setup: 19 Cloudflare skills installed/updated globally (6 new, 13 existing),
Cloudflare MCP registered at `https://mcp.cloudflare.com/mcp`, and MCP OAuth login
completed. Wrangler login was independently verified and used for this deployment.
No optional beta `cf` CLI was installed. Restart Codex to load the newly registered
MCP server; no restart was needed for Wrangler publication. The installer emitted
an unsupported-global-install warning for PromptScript, while Codex skill setup
succeeded. No repository or memory files were changed by the setup subagent.
