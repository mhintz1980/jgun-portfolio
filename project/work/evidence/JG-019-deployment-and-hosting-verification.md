---
id: JG-019
plan: ../plans/JG-019-deployment-and-hosting.md
verified_on: 2026-08-27
verified_by: ZCode (deployment-readiness pass)
commit: 60875c2 base + this change (branch jg-019-deploy, merged to main 2026-08-27)
status: verified
publish_state: ready — awaiting owner one-time wrangler login + Porkbun DNS (runbook §One-time setup)
---

# JG-019 — Verification Evidence: Deployment Readiness and studiomark.dev Hosting

## Scope reality (what this pass could and could not execute)

Everything machine-executable is verified below. Two publish-gated steps are
**owner-only by credential** and are documented as exact atomic instructions in
[`../../context/deployment.md`](../../context/deployment.md) rather than
executed: the one-time Cloudflare `wrangler login` (browser auth) and the
Porkbun DNS record changes for `studiomark.dev` (registrar login). Tested
2026-08-27: the domain is registered at Porkbun and parked
(`www` → `pixie.porkbun.com`, apex A → 207.207.210.107/.229) — no live site
exists yet, so domain-HTTPS verification necessarily happens after Mark runs
the DNS step. No credentials were committed or handled.

## Environment

| Field | Value |
|---|---|
| Build tree | isolated worktree `C:\Users\Markimus\.buzz\.scratch\jg019\wt`, branch `jg-019-deploy` off `60875c2` (= verified JG-014 state, without the concurrent JG-015 session's uncommitted edits) |
| Clean install | `npm ci` from scratch in the worktree — 0 vulnerabilities |
| Production server | `vite preview` on **:4175** (4173 and 4174 were both occupied by the active parallel JG-015 session) |
| Probes | playwright MCP, `window.__telemetry`; screenshots not used as evidence |
| Skills applied | `asset-and-bundle-hygiene`, `webgl-telemetry-verifier`, `codebase-memory` (structural audit) |

## Acceptance criteria

- [x] **`npm run build` succeeds from a clean dependency installation.**
  `npm ci` (fresh `node_modules`, 0 vulnerabilities) → `npm run build`:
  `tsc` 0 errors; `vite build` ✓ 616 modules in 14.41 s. Entry path ships
  2.12 kB HTML + 216.6 kB (69.0 kB gzip) entry JS + 37.1 kB (6.8 kB gzip) CSS;
  three/GSAP/drei isolated in lazy chunks (`SceneCanvas` 648.3 kB,
  `vanilla` 380.1 kB, `ScrollTrigger` 114.0 kB) — `StaticPoster` imports
  nothing (pure DOM), poster tier never fetches the heavy chunks (App.tsx
  lazy gates). Only warning: the known >500 kB lazy-chunk notice (SceneCanvas)
  plus a `THREE.Clock` deprecation warning from drei at runtime.
- [x] **Full, medium, poster, reduced-motion, WebGL-failure, and mobile paths
  are intentionally handled.** Fresh production-build telemetry on :4175:
  - *Full tier boot (`/?view=exploded`)*: canvas mounted, camera exactly
    `[0.32, 0.16, 0.42]` fov 42 (CH.01 keyframe), `materialMode "exploded"`,
    `explodeFactor 1` with the train at rest (`stageRot` all 0), rear-extraction
    ladder EXACT per spec §5.3: `stageZ [-0.255, -0.230, -0.142, -0.099,
    -0.177]`, `handleZ -0.354`, `outputZ +0.050`, `clutchZ -0.291`.
  - *Scroll windows (production bundle reproduces the JG-014 baselines)*:
    0.473 → camera `[-0.28, 0.08, 0.74]` fov 31 (LCD dwell keyframe),
    `gearRotation 25.132741` (= 8π), `alpha [1,0,0]`; 0.545 → `alpha
    [0.5002, 0.4998, 0]` (cross-fade midpoint); 0.60 → `alpha [0,1,0]`,
    `active 1`, `flow 0.226` ramping; 0.90 → `alpha [0,0,1]`, `active 2`,
    `flow 0`. Zero console errors at every probe.
  - *Reduced motion* (`page.emulateMedia({reducedMotion:'reduce'})` + fresh
    load): camera pinned `[0.32, 0.16, 0.42]` fov 42, `explodeFactor 0`,
    `gearRotation 0`, Lenis never mounts (no `lenis` class), canvas present in
    static-pose mode per the qualityStore contract.
  - *WebGL failure / poster*: forced `WEBGL_lose_context` on the live canvas →
    canvas unmounts, `StaticPoster` mounts, all 4 chapter headings persist in
    DOM, telemetry freezes as documented, 0 console errors.
  - *Mobile (390×844)*: canvas mounts, camera on the CH.01 keyframe, no
    horizontal overflow, chapter card mounts in-window on scroll (h2
    `The Full-Stack Physical & Digital Systems Architect` at progress 0.05;
    at exactly progress 0 no card is mounted by design — chapter cards
    unmount outside their opacity windows, `Chapters.tsx` `opacity <= 0.001
    → null`), 0 console errors.
  - *Lite tier*: no runtime override exists (the ladder is FPS-driven in
    `qualityStore.degradeQuality`); verified by code audit: full→lite swaps
    the Module-3 dissolve shader for an opacity crossfade and lite keeps a
    visible asset representation; one-way ratchet; DPR floor 1.0.
- [x] **Draco, GLB, image, and route requests resolve from the production
  bundle.** Browser network audit on :4175: every request 200 — entry + all
  lazy chunks, `favicon.svg`, `/models/Default.glb` (8,430,884 B),
  `/models/m249-transformed.glb`, `/models/role-map.json`,
  `/draco/draco_wasm_wrapper.js`, `/draco/draco_decoder.wasm` (decoders are
  vendored locally, not CDN). `curl` checks on :4175: `/` 200 (2,116 B),
  `/models/Default.glb` 200, `/draco/draco_decoder.wasm` 200, `/og-image.png`
  200, `/models/role-map.json` 200, `/404.html` 200. `dist/` contains all
  five GLBs + role-map + draco trio + `404.html` + `_headers` + `robots.txt`
  + `og-image.png`. Asset URLs are absolute root paths (audited via
  codebase-memory + grep: `MODEL_URL = '/models/Default.glb'`,
  `'/models/m249-transformed.glb'`, `fetch('/models/role-map.json')`,
  `setDecoderPath('/draco/')`) — correct for root-domain hosting, and the
  runbook forbids subpath deploys without rebasing.
- [x] **Domain HTTPS, canonical metadata, social preview, and not-found
  handling are verified** — *to the maximum extent possible pre-publish*:
  `index.html` now carries `<link rel="canonical" href="https://studiomark.dev/">`,
  full OG set (`og:type/url/site_name/title/description/image` 1200×630 +
  alt) and Twitter `summary_large_image` card (7 tag matches grepped in the
  built `dist/index.html`); `theme-color #05070a` added; title/description
  copy preserved verbatim. `public/og-image.png` (68.5 KB, rendered from
  `scripts/og-image-source.html` at exactly 1200×630, machine-QA'd: all text
  legible, nothing clipped) resolves 200 from the bundle. 404 handling is
  `public/404.html` (branded sheet, `noindex`, auto-return link) served with
  a real 404 by Cloudflare Pages on unmatched routes; **vite preview
  SPA-falls-back to `index.html` locally, so 404 status must be re-checked on
  the deployed host** (documented in the runbook checklist). Domain HTTPS on
  `studiomark.dev` verifies after Mark's Porkbun DNS step (see Scope reality).
- [x] **No secret, credential, `.scratch/`, or protected parallel-session
  material is committed.** The worktree branch contains only JG-019 files;
  the JG-015 session's uncommitted work in the shared tree was never read for
  modification, built upon, or staged. The gh PAT seen during investigation
  was never written anywhere.

## Hosting approach (selected and configured)

Cloudflare Pages direct upload — decided because the hero GLBs are gitignored
and CAD-synced, so git-checkout builds cannot produce a working bundle;
GitHub Pages was additionally blocked (private repo + PAT scope 403 on the
Pages API, tested). Deliverables: `scripts/deploy-studiomark.ps1` (sync →
build → `wrangler pages deploy`, with guards refusing a bundle missing
`index.html` or `Default.glb`), `public/_headers` (immutable `/assets/*`,
24 h named assets, security headers), `public/404.html`, `public/robots.txt`,
and the full runbook at `project/context/deployment.md` including the exact
Porkbun records (apex ALIAS + www CNAME → `jgun-portfolio.pages.dev`).

## Residual risk / follow-up

- Publishing requires Mark's one-time `npx wrangler login` + Porkbun DNS edits
  (~10 min, exact steps in the runbook). Until then nothing is public.
- The deployed `dist/models/` also carries `msp-enclosure.glb` (committed
  2.38 MB Stage-2 asset, not yet fetched at runtime by the `60875c2` StageManager);
  it becomes load-bearing when the parallel JG-015 session lands — no action
  needed, noted so the size isn't a surprise.
- `_headers` is a Cloudflare Pages convention; if hosting ever changes, the
  cache policy must be re-expressed for the new host (runbook notes this).
- Post-publish: run the runbook's 6-point checklist on the live domain and
  append the results here.
