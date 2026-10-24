# JG-019 — build & deploy studiomark.dev via Cloudflare Pages direct upload.
#
# Launch topology (2026-10-23): /torque-wrench/ and /quiet-machine/ are the two public pages;
# / is a redirect-only shell. M249 stays in git but never ships: the build drops
# public/models/m249-transformed.glb (build/excludePublicAssets.ts) and the launch gate below
# fails closed if any M249 file or reference reaches dist/. Full runbook, one-time setup, and DNS
# records: project/context/deployment.md.
#
# One-time:  npx wrangler login   (browser flow, Mark's Cloudflare account)
# Custom domain (one-time, Porkbun): see project/context/deployment.md §DNS.
#
# Flags:
#   -SkipSync    skip npm run sync-assets (the launch GLBs are tracked in git)
#   -DryRun      build and verify only; do not upload
param(
  [switch]$SkipSync,
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'

# Native commands do not throw on a non-zero exit under 'Stop', so check every one.
function Invoke-Step([string]$Label, [scriptblock]$Command) {
  Write-Host "==> $Label"
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "$Label failed (exit $LASTEXITCODE)" }
}

$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
  if (-not $SkipSync) { Invoke-Step 'sync-assets' { npm run sync-assets } }

  $dist = Join-Path $root 'dist'
  if (Test-Path $dist) { Remove-Item -Recurse -Force $dist }

  Invoke-Step 'typecheck' { npm run typecheck }
  Invoke-Step 'tests' { npx vitest run --testTimeout=60000 }
  Invoke-Step 'build' { npm run build }

  # Belt and braces on top of the node gate: these two must hold even if the gate script changes.
  foreach ($page in @('index.html', 'torque-wrench\index.html', 'quiet-machine\index.html')) {
    if (-not (Test-Path (Join-Path $dist $page))) { throw "build did not produce dist/$page" }
  }
  if (Test-Path (Join-Path $dist 'models\m249-transformed.glb')) {
    throw 'dist/models/m249-transformed.glb exists — M249 must not ship. Refusing to deploy.'
  }

  Invoke-Step 'launch gate' { node scripts/verify-launch-dist.mjs }

  if ($DryRun) {
    Write-Host 'Dry run: dist/ verified, nothing uploaded.'
    return
  }

  Invoke-Step 'wrangler deploy' { npx --yes wrangler pages deploy dist --project-name=jgun-portfolio --branch=main }
  Write-Host 'Deployed. Verify: https://jgun-portfolio.pages.dev/torque-wrench/ + https://studiomark.dev (after DNS)'
}
finally {
  Pop-Location
}
