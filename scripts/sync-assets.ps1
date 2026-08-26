# Syncs the optimized runtime GLBs (Fizz's gltf-transform pass) into public/models/.
# Source of truth: C:\Projects\CAD\RL300-SAFE\optimized\ — jgun-full.glb is renamed to
# Default.glb so the brief's useGLTF('/models/Default.glb') path resolves.
#
# NOT synced here: public/models/m249-transformed.glb. It is 871 KB, so it is
# committed to the repo directly (force-added past the public/models/*.glb
# ignore) rather than synced. Its source of truth is C:\Projects\CAD\m249.glb
# -> m249-transformed.glb, and it is post-processed after gltfjsx (see
# src/scene/stages/M249Stage.tsx). Do NOT add it to this script: syncing a
# tracked file produces spurious diffs.
$ErrorActionPreference = 'Stop'

$src = 'C:\Projects\CAD\RL300-SAFE\optimized'
$dst = Join-Path $PSScriptRoot '..\public\models'

New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item (Join-Path $src 'jgun-full.glb') (Join-Path $dst 'Default.glb') -Force
Copy-Item (Join-Path $src 'jgun-gearbox.glb') $dst -Force
Copy-Item (Join-Path $src 'jgun-handle.glb') $dst -Force
Copy-Item (Join-Path $src 'role-map.json') $dst -Force

Write-Host "Assets synced: $((Get-ChildItem $dst | Measure-Object).Count) files in $dst"
