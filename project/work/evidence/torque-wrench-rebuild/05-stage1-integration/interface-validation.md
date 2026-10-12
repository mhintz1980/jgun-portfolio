# Interface checks for integration preparation

Parent assessment, 2026-10-12 (America/New_York). No product edits or browser acceptance.

Installed versions: React 19.2.8, Vite 7.3.6, Playwright 1.56.1, TypeScript 5.9.3. Current repository source/types/tests govern internal behavior. The delivered `vite.config.ts` already derives HTML inputs from registry rows and uses MPA mode; the inactive torque row adds no input. No Vite configuration change is needed.

Official references inspected:

- [Playwright BrowserContext initialization contract](https://raw.githubusercontent.com/microsoft/playwright/main/docs/src/api/class-browsercontext.md): init scripts run after document creation and before page scripts. Install observation before navigation; do not infer never-mounted Canvas from a final snapshot. Current upstream includes newer return/option surfaces; the harness uses the installed 1.56.1 types, whose `addInitScript` returns `Promise<void>`.
- [Playwright 1.56.1 Page route contract](https://raw.githubusercontent.com/microsoft/playwright/v1.56.1/docs/src/api/class-page.md): matching requests stall until continued, fulfilled or aborted. Page routing cannot intercept service-worker-owned requests; browser contexts should block service workers for controlled failure injection. HTTP 404 responses need response-status observation as well as `requestfailed` events.
- [Vite multi-page build reference](https://raw.githubusercontent.com/vitejs/vite/main/docs/guide/build.md): nested HTML entries retain their resolved file topology, and development navigation uses the nested path. Current upstream configuration examples have advanced beyond installed Vite 7; no new option is copied. Existing repository registry-derived inputs are authoritative here.

Installed `node_modules/playwright-core/types/types.d.ts` confirms the function/object init-script interface, route string/RegExp/predicate matchers and optional `times`, and `emulateMedia({reducedMotion:'reduce'|'no-preference'})`. Source inspection of `TorqueWrenchPage.tsx`, `Story.tsx`, `Scene.tsx`, `cadGate.ts`, `tier.ts`, registry and config establishes selectors and the single lazy Scene edge.

Parent defined browser-only failure injection with Session A: intercept the exact lazy Scene module, delay its response until Story/disclosure/focus references are recorded, then abort for import rejection or fulfill a controlled ESM default component that throws for render failure. Count actual matched routes and assert the expected fallback so missing injection cannot yield a pass. Keep the same Story Element references and expanded/focused control through the transition. No production test hook or fake HTML is authorized.

`ctx_fetch_and_index` failed for both HTML and raw Markdown URLs with missing `turndown`; no plugin repair was performed. Bounded official raw Markdown reads via local context-mode computation were used instead. This is an analysis-tool limitation, not a product defect.

Real renderer initialization/context-loss, GPU cleanup, hardware GL, performance and final poster art remain outside this placeholder's observable acceptance. Source fallback plumbing and browser import/render simulations must remain separately labelled.
