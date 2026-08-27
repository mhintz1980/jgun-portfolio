# JG-019 — build & deploy studiomark.dev via Cloudflare Pages direct upload.
#
# Why direct upload (not GitHub Pages / Actions): the hero GLBs are gitignored
# and synced from C:\Projects\CAD at build time, so only a machine with the CAD
# source can produce a working bundle. Full runbook, one-time setup, and DNS
# records: project/context/deployment.md.
#
# One-time:  npx wrangler login   (browser flow, Mark's Cloudflare account)
# Custom domain (one-time, Porkbun): see project/context/deployment.md §DNS.
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
  npm run sync-assets
  npm run build

  if (-not (Test-Path (Join-Path $root 'dist\index.html'))) {
    throw 'build did not produce dist/index.html'
  }
  if (-not (Test-Path (Join-Path $root 'dist\models\Default.glb'))) {
    throw 'dist/models/Default.glb missing — the deploy bundle would 404 its hero asset'
  }

  npx --yes wrangler pages deploy dist --project-name=jgun-portfolio --branch=main
  Write-Host 'Deployed. Verify: https://jgun-portfolio.pages.dev + https://studiomark.dev (after DNS)'
}
finally {
  Pop-Location
}
