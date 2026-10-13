# Astra reload advisory — attributed 2026-10-12

Independent fixed tier-reviewer Astra/Medium, Aristotle,
01a13064-d249-7900-83dc-f384bc2a24b1. Product read-only; reviewer role prevented
writing the requested advice artifact. This parent records the returned advice,
not independent effects acceptance. Agent completed and was closed.

Advice: approve the page-local initial flushSync correction, conditional on
runtime proof. Native restoration occurred before the concurrent React root
committed, when document maxScroll was zero. Reserving pending/live CSS alone
could not help an empty root. Observed history.scrollRestoration remained auto;
the GSAP manual-policy hypothesis was unsupported by this reproduction.

Recommended scope: wrap only the initial torqueRoot.render in flushSync; keep
stable pending/live track, lazy Scene and one conductor. No scroll persistence,
manual restoration policy or shared HTML modification.

Parent runtime probe against fresh build c confirmed native DOMContentLoaded,
load and pageshow at scrollY19734/max39468/mode pending, then Scene sample0.5,
matching the pre-reload position and exact sample. Build b observed all three
events at scrollY0/max0 before React mount. Script is task scratch
.scratch/probe-jg038-reload.mjs. Full c roster then passed desktop/narrow reload,
forward/reverse/seek/boundary/hold and lifecycle/static cases; total16/17 with
only scrollbar failure. Corrected launch isolated scrollbar check passed.

Advice remaining: back/forward/BFCache and non-BFCache restoration should be
checked separately; investigate pageshow cached-trigger resampling only if
actual restored native scroll and narrative diverge. Those stress checks are
not inferred from the reload pass.

Official React flushSync docs fetched HTTP200 at
https://react.dev/reference/react-dom/flushSync. The documented synchronous DOM
commit is used once at browser-integration entry, not inside a render/effect or
per-frame path. Official Playwright BrowserType docs fetched HTTP200 at
https://playwright.dev/docs/api/class-browsertype; ignoreDefaultArgs filters only
the headless --hide-scrollbars flag confirmed in installed Playwright1.56.1.
Context-mode fetch failed due missing turndown; native HTTP reads were used.
