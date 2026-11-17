# Homepage correction from the owner's HTML export — 2026-11-14

The owner rejected the earlier homepage interpretation. The authoritative page is
https://claude.ai/artifact/XtVxa2BvgrCRsfq2y8H6mE#page-dcb81aee8d83 and the supplied
`Studiomark Homepage.html`, archived byte-for-byte in `design/homepage-export/source.html`.
SHA-256: `11c2b9e77778fa947ad7a7af411c889d4fd1deb1802830926fe3ef63dc4c3a08`.
Prior technical passes did not establish visual acceptance and remain historical.

## Intended correction and publication boundary

- Generate the actual homepage DOM from the exported template, rather than apply
  selected styles to the older React layout. Preserve its 65px text header, 600px
  hero, 5000px work section, four 900px galleries, exact headings/copy/spacing,
  Plus, testimonial, contact illustration, and absolute drawing backdrop.
- Keep the supplied six font families and mask alpha. The portable export's
  `helmet` styles do not apply correctly when opened directly: hoist the bundled
  font/mask rules into ordinary CSS and serve the captured assets locally.
- Parse the manifest/template as JSON; never execute its three packed scripts.
  Retain the full font-license notices. The shipped page has no canvas editor,
  remote fonts, React 18 export runtime, WCS, showreel section or animated name.
- Wire actual project routes, theme, gallery controls/keyboard/drag, live image
  status, contact action, native page scrolling and reduced motion. Add readable
  narrow layout rules while retaining the authored desktop geometry.
- The export predates rejection of the "Precision Revealed" still. Replace that
  manifest ID at import time with the already-approved industrial wrench frame;
  retain original hash/provenance in `import-record.json`. The retired image must
  not appear in public assets, static HTML or runtime requests.
- Commit/push the correction to main. Build the deployment from the currently
  published source `4113aac` plus this homepage correction, preserving the live
  torque-wrench and quiet-machine page sources. Do not deploy unrelated changes
  that have since landed on main. Cloudflare upload and Git push are distinct.

## Verification

Initial TypeScript, lint, build and launch gate pass. The homepage and topology
roster passed 145 tests. Initial browser pass: phone, 320px reduced-motion phone
and tablet pass; the desktop armament caption wrapper exceeded the viewport.
A bound was added without changing the exported title's authored width. The
independent reviewer also caught the retired frame in static output; substitution
was moved into the import boundary and the generated retired file was archived
outside public output. Final browser, review and publication results follow.

Final local browser: **4/4 viewport cases PASS** (1440x900, 390x844, 320x700
reduced motion, 820x900), exercising all four galleries, arrow/Home/End keys,
roving focus, counters, theme and contact action. Zero browser/HTTP errors,
external font/CDN requests, narrative CAD requests, or horizontal page overflow.
Captured desktop geometry is 65px header text / 600px hero / 5000px work section.
Evidence: `output/playwright/home-export-final/report.json` and sibling screenshots.
Final independent GLM-5.3 high-effort review: **ACCEPT** after the retired-frame
static-output fix. TypeScript, lint, focused source/topology checks, all **42 pure
Node tests**, production build and launch gate PASS (176 files, 53 required assets,
zero M249).

## Published result

- Main correction **`3e014a7f615df8eafea84e69dade5847c47a0ff0`** is pushed to
  `origin/main`. The enforced QA hook passed lint, TypeScript, **133 files / 1,567
  tests**, and the Station 2 contract with `VITEST_MAX_WORKERS=2`.
- Production source **`d2a820dd81666e231488ac053601fbc8e5d9f97b`** is on
  `origin/codex/homepage-export-production-20261114`: published baseline `4113aac`
  plus the same correction. Git comparison confirms no differences in the scene,
  components, shared shell, torque-wrench, quiet-machine or model source paths.
  The clean committed production checkout separately passed TypeScript, 145 focused
  tests, all 42 Node checks, build, launch gate and the four browser viewport cases.
- Cloudflare production **`31e75c81-5175-46ed-ae64-75e38b7a1b6d`** succeeded,
  with `commit_hash=d2a820dd...` and `commit_dirty=false` verified in canonical
  deployment metadata. The CLI refreshed its existing OAuth session before upload;
  the earlier expired-token lookup did not perform a deployment.
- **175/175 HTTP/file identity checks PASS** on the custom domain, Pages project
  domain and immutable deployment URL: routes, homepage entry assets, imported
  fonts/images/licenses, retired-frame/M249/missing-route 404s, and apex redirect.
  Evidence: `output/playwright/home-export-live/identity.json`.
- **4/4 live browser viewport cases PASS**, including all galleries, theme,
  keyboard focus, reduced motion, contact action, and navigation from the homepage
  to the torque-wrench page. No browser or HTTP errors. Evidence:
  `output/playwright/home-export-live/report.json` and sibling captures.
- Public: https://www.studiomark.dev/home/ ; immutable deployment:
  https://31e75c81.jgun-portfolio.pages.dev/home/ . Previous deployment was
  `98c50e06-40c6-48ab-8fde-c100d3c81a80` (the rejected interpretation).

The native exported-page verifier replaces the old WCS/pinned-header verifier for
this homepage. That previous verifier still describes the former implementation;
its earlier passes are not used to claim this correction complete.

This correction does not close JG-043's owner visual-acceptance requirement.
