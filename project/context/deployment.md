# Deployment — studiomark.dev Runbook (JG-019)

> **Current production, verified 2026-11-07:** Mark approved the exact JG-042 WIP
> candidate and authorized deployment. Production **`00413abd-482f-4a8b-8365-6ab2da8fbe5a`**
> serves clean source **`8d8f045b2a87ca42c431c3dcf6b2bac8368edb1a`** from
> `torque-wrench/rebuild`, via direct upload with production branch metadata `main`.
> Isolated typecheck, 1,564 unit tests, 42 Node checks, 9/9 local and 9/9 live
> publication smoke, 126/126 HTTP checks and browser root navigation PASS.
> No speedup/full performance or final visual acceptance claimed; deferred
> experiments and historical failures remain open. Rollback is `e796fe69`.
> [Release evidence](../work/evidence/JG-042-portfolio-performance/release-2026-11-06/README.md).
>
> **Previous production, 2026-11-04:** Mark approved JG-040 Stage 3 and authorized release.
> Deployment **`e796fe69`** serves clean source commit **`f83f4ba`**; root-to-`/home/`, the
> other public pages and private armament remain intact. Isolated typecheck, 1,507 unit
> tests, 36 Node verifier tests, build/asset gate, 68/68 live HUD checks and 9/9 publication
> smoke PASS, zero browser errors. [Release evidence and rollback](../work/evidence/JG-040-hud-d-inline/stage3-2026-11-04/release-2026-11-04.md).
> Prior release records below retain historical results; broader cinematic gates remain deferred.

Durable deployment context for the JGUN portfolio. Task record:
[`../work/evidence/JG-019-deployment-and-hosting-verification.md`](../work/evidence/JG-019-deployment-and-hosting-verification.md).

## Current release policy and state — 2026-11-03

**Published:** [JG-039 homepage release](../work/evidence/JG-039-homepage/release-2026-11-03.md)
records clean commit `876f11fc`, Cloudflare Pages deployment `2b33b2f4`, the
public `/home/` landing route, matching local/live HTML hashes, and 9/9 live
publication smoke cases PASS. The prior `6ea9c78a` two-page deployment is rollback
history. The earlier preflight below is also history.

Read the [owner's evolving-site policy](owner-specs/evolving-portfolio-and-visual-review-2026-10-31.md).
Publish useful unfinished pages with a discreet work-in-progress label, then update
them incrementally. Final HUD/cinematic acceptance is separate from publication.
Use production build/asset/route checks and focused desktop/narrow runtime smoke
checks; do not repeat the full cinematic roster merely to publish a small update.
Keep failed/deferred design assertions and unfinished reviews recorded honestly.

The current script builds `/home/`, `/torque-wrench/` and `/quiet-machine/`; `/`
redirects to `/home/`. It uploads the entire `dist/`, including all public pages, to
Cloudflare Pages project `jgun-portfolio` with production branch `main`, regardless
of the local Git branch. Verify the account/project and intended page versions
before upload. A Git push is distinct from this deployment. Confirmed through
Wrangler on 2026-10-31: the project has no Git provider integration and serves
`jgun-portfolio.pages.dev` plus `www.studiomark.dev`.

Live preflight on 2026-10-31: the apex redirects to `www.studiomark.dev`; both
new page URLs return the branded Cloudflare 404, as does the Pages torque-wrench
URL. `wrangler whoami` reports an expired login that cannot refresh. No deployment
has been made by this preflight. Reauthenticate with `npx wrangler login`, then
verify project/domain bindings. These observations are dated, not permanent state.

## Hosting decision — Cloudflare Pages, direct upload

Selected 2026-08-27 (JG-019). Build locally, upload `dist/` with
`scripts/deploy-studiomark.ps1` (wrangler direct upload).

Why this model, in order of deciding weight:

1. **Locally verified bundle.** The original August decision depended on
   untracked hero GLBs. That premise is historical: the current launch GLBs,
   including `Default.glb`, are tracked. Direct upload remains the repository's
   implemented deployment path. Use `-SkipSync` for a normal release so a stale
   external CAD copy cannot overwrite the intended tracked assets. Asset refresh
   is a separate intentional operation. Do not add a Git integration on the
   assumption that one already exists.
2. **Custom cache/security headers.** GitHub Pages ignores `_headers`;
   Cloudflare Pages applies [`../../public/_headers`](../../public/_headers)
   (immutable `max-age=31536000` for hashed `/assets/*`, 24 h for named
   CAD/decoder/OG assets, `nosniff` + referrer + permissions policy globally).
3. **GitHub Pages was additionally blocked**: the repo is private (Pages on
   private repos requires a paid plan) and the harness PAT cannot enable the
   Pages API (`403 Resource not accessible by personal access token`, tested
   2026-08-27).
4. Free unmetered static bandwidth, per-deploy URLs, instant rollback.

Asset URLs in the app are absolute root paths (`/models/Default.glb`,
`/draco/`, `/models/role-map.json` — audited in JG-019), so the site must be
served at a domain root: `studiomark.dev` (apex) via Cloudflare Pages custom
domain. **Do not deploy to a subpath host** (e.g. `<user>.github.io/<repo>/`)
without rebasing every asset URL.

## Account and domain setup

1. **Cloudflare account** (free): <https://dash.cloudflare.com/sign-up>.
2. **Login the CLI** from the repo root:
   ```powershell
   npx wrangler login
   ```
   (opens a browser flow; the token stays local to the machine).
3. Verify the existing `jgun-portfolio` Pages project and its production branch;
   the documented project URL is `https://jgun-portfolio.pages.dev`. Do not create
   a duplicate project when reconnecting an expired account session.
4. Inspect the existing custom-domain associations and redirects before any DNS
   change. Current official Pages documentation requires Cloudflare nameservers
   for an apex custom domain; an externally managed subdomain can use a CNAME to
   the Pages hostname after associating it with the Pages project. The old August
   Porkbun parking/ALIAS recipe is superseded; do not replay it on the live domain.

Official references checked 2026-10-31:
[Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) ·
[Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).

## Deploy (repeatable)

```powershell
scripts/deploy-studiomark.ps1 -SkipSync
```

The script runs typecheck, unit tests, production build and the launch-dist gate,
then uploads `dist/`. With no `-SkipSync`, it first copies external CAD assets;
do not omit that flag for a normal release of the intended tracked models.
`-DryRun -SkipSync` builds/verifies without uploading. Neither mode runs the full
cinematic proof roster. The gate verifies the public documents, required assets,
and exclusion of M249. Do not upload a missing/broken page or asset bundle.

## Policies

- **404:** `public/404.html` (branded error sheet, `noindex`, auto-return link).
  Cloudflare Pages serves it with a real 404 status on unmatched routes.
  Note: `vite preview` locally SPA-falls-back unknown paths to `index.html`,
  so 404 behavior must be checked on the deployed host, not the local preview.
- **Caching:** see [`../../public/_headers`](../../public/_headers). Hashed
  Vite chunks are immutable; named assets (`/models/*`, `/draco/*`, OG image,
  favicon) get 24 h so content updates land within a day.
- **Analytics:** intentionally none — no third-party scripts, no cookies, no
  tracking. Cloudflare Pages provides anonymous, cookieless request counts in
  the dashboard, which is sufficient. If richer analytics are ever wanted,
  choose a no-cookie tool and record the decision here.
- **Robots:** `public/robots.txt` allows all; the 404 sheet is `noindex`.

## Post-deploy verification checklist

Run against `https://studiomark.dev` (and once against
`https://jgun-portfolio.pages.dev` and the returned per-deployment URL):

1. HTTPS serves with a valid certificate; `http://` redirects to `https://`.
2. `curl -sI https://studiomark.dev/` → 200, `cache-control: no-cache` (or
   CF default HTML policy), canonical `<link>` present in the HTML.
3. `curl -sI https://studiomark.dev/models/Default.glb` → 200 and
   the `_headers` cache policy is applied
   (`curl -sI .../assets/<any-hash>.js` → `max-age=31536000, immutable`).
4. `curl -s -o /dev/null -w "%{http_code}" https://studiomark.dev/og-image.png`
   → 200; paste the URL into a card validator (or a fresh DM) for the social
   preview.
5. Unknown path (e.g. `/nope`) → 404 status with the branded sheet.
6. Open `/torque-wrench/` and `/quiet-machine/` directly at desktop and narrow
   widths; confirm the work-in-progress label, scene readiness, essential controls
   and cross-page navigation, with no fatal browser errors or required-asset 404s.
   Verify the existing reduced-motion poster fallback. Use current route telemetry
   for runtime claims, not the legacy main-page LCD coordinates. Confirm `/`
   reaches the intended torque-wrench page and record the deployment identity.

The reusable focused browser check is:

```powershell
node scripts/smoke-studiomark.mjs --url=https://studiomark.dev --out=output/playwright/studiomark-publication
```

It checks publication usability, not full cinematic/alias acceptance. Torque's
unfinished reduced-motion path currently uses DOM story and labeled poster slots;
do not assume completed offline artwork. If iterating on this smoke harness,
`--case=reduced-torque-wrench` selects just that case without rerunning the others.

## Regenerating the social preview image

Edit `scripts/og-image-source.html` (1200×630, system mono fonts, no network
dependencies), serve it locally, screenshot the viewport at exactly 1200×630
into `public/og-image.png` (png, css scale), rebuild, redeploy. Current card
was rendered 2026-08-27 via the playwright MCP browser (68.5 KB).
