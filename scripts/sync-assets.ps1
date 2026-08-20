# Syncs the optimized runtime GLBs (Fizz's gltf-transform pass) into public/models/.
# Source of truth: C:\Projects\CAD\RL300-SAFE\optimized\ — jgun-full.glb is renamed to
# Default.glb so the brief's useGLTF('/models/Default.glb') path resolves.
$ErrorActionPreference = 'Stop'

$src = 'C:\Projects\CAD\RL300-SAFE\optimized'
$dst = Join-Path $PSScriptRoot '..\public\models'

New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item (Join-Path $src 'jgun-full.glb') (Join-Path $dst 'Default.glb') -Force
Copy-Item (Join-Path $src 'jgun-gearbox.glb') $dst -Force
Copy-Item (Join-Path $src 'jgun-handle.glb') $dst -Force
Copy-Item (Join-Path $src 'role-map.json') $dst -Force

Write-Host "Assets synced: $((Get-ChildItem $dst | Measure-Object).Count) files in $dst"
