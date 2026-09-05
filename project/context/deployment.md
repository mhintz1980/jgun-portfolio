# Deployment — studiomark.dev Runbook (JG-019)

Durable deployment context for the JGUN portfolio. Task record:
[`../work/evidence/JG-019-deployment-and-hosting-verification.md`](../work/evidence/JG-019-deployment-and-hosting-verification.md).

## Hosting decision — Cloudflare Pages, direct upload

Selected 2026-08-27 (JG-019). Build locally, upload `dist/` with
`scripts/deploy-studiomark.ps1` (wrangler direct upload).

Why this model, in order of deciding weight:

1. **The hero GLBs are not in git.** `Default.glb` (8.43 MB), `ptg-gearbox.glb`,
   and `ptg-handle.glb` are gitignored and synced from
   `C:\Projects\CAD\RL300-SAFE\optimized\` by `npm run sync-assets`. Any
   git-checkout build (GitHub Actions → Pages, Netlify git integration) produces
   a bundle whose hero asset 404s. Only a machine with the CAD source can build
   a working bundle, so the deploy step must run from that machine.
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

## One-time setup (Mark, ~10 minutes, needs browser logins)

1. **Cloudflare account** (free): <https://dash.cloudflare.com/sign-up>.
2. **Login the CLI** from the repo root:
   ```powershell
   npx wrangler login
   ```
   (opens a browser flow; the token stays local to the machine).
3. **First deploy creates the project** — just run the deploy script below once;
   wrangler prompts to create `jgun-portfolio` if it does not exist. The
   production URL before DNS is `https://jgun-portfolio.pages.dev`.
4. **Custom domain (Porkbun DNS for studiomark.dev — currently parked on
   `pixie.porkbun.com`, verified 2026-08-27).** In the Porkbun dashboard for
   `studiomark.dev`, replace the parking records with:
   - Apex `studiomark.dev`: **ALIAS/ANAME** record → `jgun-portfolio.pages.dev`
     (Porkbun supports ALIAS on the apex; a bare CNAME is not legal at apex).
   - `www.studiomark.dev`: **CNAME** → `jgun-portfolio.pages.dev`.
   - In Cloudflare Pages → project → *Custom domains*, add `studiomark.dev`
     and `www.studiomark.dev`; HTTPS certificates issue automatically once the
     DNS records resolve (may take minutes to an hour).
   - Leave Porkbun DNS **unproxied** (gray cloud is not applicable here —
     Porkbun is only DNS; Cloudflare serves the site).

## Deploy (repeatable)

```powershell
scripts/deploy-studiomark.ps1
```

The script runs `sync-assets` → `npm run build` → uploads `dist/`, and refuses
to upload a bundle missing `index.html` or `models/Default.glb`.

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
`https://jgun-portfolio.pages.dev` before DNS lands):

1. HTTPS serves with a valid certificate; `http://` redirects to `https://`.
2. `curl -sI https://studiomark.dev/` → 200, `cache-control: no-cache` (or
   CF default HTML policy), canonical `<link>` present in the HTML.
3. `curl -sI https://studiomark.dev/models/Default.glb` → 200 (~8.43 MB) and
   the `_headers` cache policy is applied
   (`curl -sI .../assets/<any-hash>.js` → `max-age=31536000, immutable`).
4. `curl -s -o /dev/null -w "%{http_code}" https://studiomark.dev/og-image.png`
   → 200; paste the URL into a card validator (or a fresh DM) for the social
   preview.
5. Unknown path (e.g. `/nope`) → 404 status with the branded sheet.
6. Runtime telemetry spot-check per the `webgl-telemetry-verifier` skill:
   load `/`, `window.__telemetry` populates, canvas mounts, 0 console errors;
   scroll to ≈0.473 → LCD dwell camera `[−0.28, 0.08, 0.74]` fov 31.

## Regenerating the social preview image

Edit `scripts/og-image-source.html` (1200×630, system mono fonts, no network
dependencies), serve it locally, screenshot the viewport at exactly 1200×630
into `public/og-image.png` (png, css scale), rebuild, redeploy. Current card
was rendered 2026-08-27 via the playwright MCP browser (68.5 KB).
