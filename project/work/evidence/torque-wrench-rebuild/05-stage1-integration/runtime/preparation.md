# JG-038 Stage 1 - runtime harness preparation (Session A)

Date: 2026-10-12 (America/New_York). Workspace: C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench;
branch torque-wrench/rebuild; HEAD 8945fa95cc70b74bdcc9da27cc0573c3d1157da4. Session A owns only
scripts/verify-torque-static.mjs and this runtime/ directory. No foundation/shared edits, no
production changes, no browser/server/build/test runs performed. Status: PREPARED, NOT RUN.
No checks of any kind were executed by Session A (no syntax check, --help, --preflight,
argument probes, or browser); the parent's final CLI/mock checks were run by the parent and
are saved in the parent's evidence, not here.

## What was prepared

- scripts/verify-torque-static.mjs - standalone Node/Playwright 1.56.1 harness (installed
  package plus the repo-shared scripts/lib/browser-launch.mjs launch contract). Modes:
  --help, --preflight, and runtime (--url plus optional --out/--only/--viewport).
- runtime/preparation.md - this file.

## Commands (parent-scheduled; none executed here)

    node scripts/verify-torque-static.mjs --help
    node scripts/verify-torque-static.mjs --preflight
    node scripts/verify-torque-static.mjs --url=http://localhost:<port>/torque-wrench/ --out=project/work/evidence/torque-wrench-rebuild/05-stage1-integration/runtime/report-<run>.json

Optional filters: --viewport=D or N; --only=<comma-separated case ids>. Default report path is
inside the owned runtime dir; explicit --out paths outside that dir are refused (usage error).

Exit codes: 0 PASS; 1 case FAIL (report still written); 2 usage; 10 preflight blocked
(activation absent - the expected state until the shell owner applies the activation packet);
11 environment blocked (playwright, browser, or server unavailable); 12 internal report-write
error. Failure vs blocked is distinguished: assertion failures are FAIL with a full report;
missing preconditions are blocked with nothing concluded.

## Fail-closed preflight (no Chromium launch)

runPreflight() reads only repo files and the installed playwright package metadata:

1. torque-wrench/index.html exists; exactly one shell block; fade sub-block present and its
   CRLF-normalized sha256 equals the pinned FADE_BLOCK_SHA256 from pageTopology.test.ts.
2. A real head robots noindex meta (comments stripped first, mirroring the topology test).
3. The module script is exactly /src/torque-wrench-main.tsx and that file exists.
4. No legacy redirect block (root index.html only).
5. The registry row torque-wrench is active (href /torque-wrench/, htmlEntry, reserved false)
   while keeping private true and fadeIn true.
6. The two protected test pins match the activation packet's post-activation state
   (pages.test.ts active pin text; pageTopology.test.ts three-entry list).

Runtime mode reruns the preflight and additionally fetches the served URL (playwright.request,
no browser) and requires: HTTP 200, fade marker, module src, a real noindex meta, and a final
URL path ending in /torque-wrench. Any mismatch exits BLOCKED; another page or scratch HTML can
never be verified by this harness.

## Case roster (fresh context per case; serviceWorkers blocked; init-script probes first)

Per viewport D (1440x900, DPR1, desktop) and N (390x844, DPR3, touch/mobile emulation), seven
cases each - fourteen total: the five cases listed here plus lite and scene-mql-downgrade,
whose full descriptions are in the Round 1 addendum below.

- static-full: chapter order drafting/breakthrough/mechanism/inspection/close; skip link is
  the first Tab stop and Enter moves focus to #torque-story (real keyboard only, no helper
  focus evaluation); inspection disclosure Enter/Space open-close-open and Escape close with
  focus restore to the trigger; footer reachable (in flow, enters viewport on scroll, endcard
  anchors, colophon); public nav excludes torque anchors and keeps m249 as reserved text; live
  tier resolves to the ready zero-canvas placeholder scene; the lazy Scene module is requested
  exactly once; no poster layer; zero narrative CAD/decoder requests from initialization; zero
  document canvas mounts or removals; zero OffscreenCanvas constructions; zero HTTP >=400
  responses; zero console and uncaught page errors.
- poster-explicit (?quality=poster without reduced-motion emulation): data-torque-stage=poster;
  five explicit data-torque-poster slots in chapter order, each marked
  data-torque-poster-pending=stage-6 (the intentionally empty poster map is the Stage 1
  contract); the lazy Scene module is never requested; same silence/nav/footer/skip/disclosure
  assertions as static-full.
- reduced-motion (emulated prefers-reduced-motion, no URL parameter): same poster assertions;
  the observed poster state is shared by both inputs, so the report distinguishes the cases by
  URL and emulation, not by different DOM.
- scene-import-abort: context.route intercepts ONLY the exact lazy Scene module identity - dev
  /src/scene/torque-wrench/Scene.tsx, or the manifest-derived chunk file when --build-dir is
  given (dynamicImports graph identity, never a filename guess) - and HOLDS the response.
  After the chapters render, the toggle
  is reached by keyboard, the disclosure is opened, and retained in-page Element references
  (story, chapters, toggle, panel, stage, footer) plus aria-expanded state plus the focused
  control are captured. Only then is the held response released as route.abort(). Asserts:
  exactly one Scene request, requestfailed with a net:: error and no response (HTTP-error
  statuses would be responses, hence the abort form for pure import rejection), terminal
  data-torque-stage=poster fallback with the five explicit poster slots, DOM identity preserved
  by comparing the SAME retained Element refs against the live DOM, disclosure still open,
  focus still on the toggle, zero canvas/CAD requests, exactly one Scene request after a
  bounded 750ms post-failure window, and no uncaught page error.
- scene-render-throw: same held-interception and pre-failure capture flow, released as
  route.fulfill with HTTP 200, text/javascript, and a controlled ESM whose default export
  throws TORQUE_STATIC_RENDER_FAILURE_INJECTION. Asserts the observed response status and
  content type and that the served body contains the marker (non-vacuous), the
  SceneBoundary-to-poster fallback, and the same identity/state/focus preservation. Uncaught
  page errors fail in EVERY case (SceneBoundary must catch the render throw); failure-console
  errors must correlate exactly to the Scene failure (injection-marker text, the Scene URL in
  the message, or a console location on the Scene URL) and unrelated console noise fails;
  clean cases require zero console errors.

Finite timeouts only: navigation 30s; stage/aria waits 20s/5s event-driven via
page.waitForFunction; per-case watchdog 120s that records FAIL rather than hanging; one bounded
750ms post-failure observation window for the cadGate seal signal. There are no arbitrary
readiness sleeps: "Story ready" means the observed data-torque-stage and aria markers, never a
timer.

## Deferred cases (reported, not built)

- Actual WebGL initialization failure and runtime context-loss acceptance: these need the real
  narrative renderer. The Stage 1 placeholder Scene has zero Canvas, so this harness accepts
  nothing WebGL-related and asserts zero canvases instead. The typed props.onFailure async
  route is source/unit-tested and will need this harness plus a real renderer later.
- Superseded: the lite-tier case is now in the roster (D-lite / N-lite), as is
  scene-mql-downgrade; both were added in Round 1 with parent approval (see addendum below).
- H (2560x1440) / L (844x390) supplemental viewports, physical mobile devices, final poster art
  (Stage 6), and conductor/scroll behaviors (Stage 2) are out of scope for this harness.

## Limits and interface notes

- Document canvases are observed via an init-script MutationObserver from document start,
  including removed canvases. OffscreenCanvas constructions are counted in the window;
  worker-internal OffscreenCanvas use is not page-observable - recorded as a limit, never
  counted as a pass.
- No production test hooks: every failure is induced through route interception per the parent
  contract; no production or shared source was modified for this harness.
- scripts/lib/browser-launch.mjs is used read-only for the launch contract (installed Chrome,
  ANGLE/D3D11 on Windows; the SwiftShader software-GL path elsewhere is labeled in reports and
  is never treated as hardware evidence).
- The parent's interface-validation.md is the authority for the viewports, DPR,
  serviceWorkers:'block', init-before-page-script, and route/status-audit specifics adopted
  here (Playwright 1.56.1).

## Round 1 revision (2026-10-12, parent-check fixes applied)

- Lite tier is now a real case (D-lite, N-lite) with the full clean-scene assertion set; the
  scene-mql-downgrade case starts full-motion, opens the disclosure, captures retained Element
  refs plus expanded state plus focused control, then flips prefers-reduced-motion mid-session
  and asserts the one-way poster step-down with identity, disclosure, and focus preserved and
  no additional Scene request. Roster is now 7 cases per viewport, 14 total.
- Scene module identity is exact, never a filename guess. Dev: /src/scene/torque-wrench/
  Scene.tsx. Built (--build-dir): the harness reads <buildDir>/.vite/manifest.json, requires
  the torque-wrench/index.html entry chunk, requires its dynamicImports to contain the
  src/scene/torque-wrench/Scene.* key, and uses that chunk file as the served identity; the
  served module src must equal the manifest entry asset in built mode. Requests that are
  Scene-shaped but do not match the derived identity are recorded and fail the case (no
  generic-asset acceptance). --build-dir must resolve inside this worktree .scratch (realpath
  checked; symlink escape refused) and is read-only; the harness never runs a build subprocess.
- Preflight playwright version resolution uses require.resolve('playwright/package.json').
  Absent-activation preflight is labeled BLOCKED (exit 10 preserved), not a product FAIL.
- Usage validation precedes preflight: unknown flags are refused (known: help, preflight,
  url, out, only, viewport, build-dir); --url must be a loopback host with exactly
  /torque-wrench and no query/hash (case quality params are added via the URL API); --out
  requires an existing parent, a realpath inside the owned runtime dir, and a file target.
- The per-case watchdog now owns the context: timeout closes the case context (canceling
  pending Playwright waits), the timer is cleared before the next case, and the abandoned
  inner promise is drained. Navigation uses domcontentloaded plus explicit story/stage
  markers, so a held Scene response cannot stall DOM-flow expectations.
- Failure-signal policy: injected cases allowlist only expected import/injection console noise
  and require zero unrelated HTTP errors and zero uncaught page errors in every case
  (SceneBoundary must catch the render throw). The full request/response/failure logs with
  complete URLs and statuses are saved per case.
- Accessibility assertions are non-vacuous: the skip link first-Tab test runs before any
  scroll or blur helper; the Escape restoration test first Tabs focus to a different naturally
  reachable element, proves focus moved, then requires focus back on the trigger with
  aria-expanded=false and panel hidden=true.
- Canvas probe observes document (documentElement-independent), counts same-delivery subtree
  removals, and observations are flushed (bounded two-rAF) before counts are asserted.
- Reports carry the configured launch options (channel/args) and mark GL renderer unmeasured;
  no hardware- or software-rendering performance claim is made from launch configuration.

## Round 2 revision (2026-10-12, final; parent + B Round-1 fixes)

- Module entry parsing is attribute-order/quote tolerant (collectModuleSrcs + entrySrcVerdict)
  and excludes the Vite dev client (/@vite/client, /@react-refresh); the served document must
  carry exactly one non-client external module tag equal to the expected identity. Preflight,
  the served check, and every case use the same parser.
- Built mode (--build-dir) byte-verifies identity before any browser: the manifest entry and
  Scene asset files are sha256'd locally (realpath-confined to the build dir) and compared
  against the served documents; mismatch or non-200 is BLOCKED. Byte claims exist only in
  report.assetIdentity when this verification ran; dev mode reports source-graph identity with
  an explicit no-byte-claim note.
- Guarded cases are exception-safe: case errors become FAIL entries (never environment
  BLOCKED), the injected hold is released and the context closed on every path, the watchdog
  sets a cancelled flag that also covers a context created after the timeout (closed before
  case work), the timer is cleared on all paths, and the abandoned promise is drained (bounded)
  before the next case.
- Injected steps are race-free: a pre-goto waitForRequest observes the exact Scene URL, the
  pending stage is asserted while held, counts are asserted only after observation, and the
  render-throw body is awaited (bounded) before the marker assertion. Failure-console errors
  must correlate to the exact Scene failure (marker text, Scene URL in text, or console
  location on the Scene URL); unrelated console noise, unrelated HTTP errors, and ALL uncaught
  page errors fail.
- CAD/decoder classification is an independent full-URL predicate (no longer chained after
  Scene matching), and complete request/response/failure logs with URLs and statuses are saved
  per case.
- Usage validation is fully typed before preflight: required flags need non-empty string
  values, --help/--preflight reject values, an empty --viewport/--only roster exits 2 before
  preflight or launch, and --out rejects directories, non-files, and symlink targets resolving
  outside the owned runtime dir (existing parent required; no directories are created for
  explicit --out).
- The MQL case also restores no-preference after the downgrade and asserts the poster floor
  holds (one-way tier policy) before final silence assertions.
