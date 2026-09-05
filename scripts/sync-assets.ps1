# Syncs the optimized runtime GLBs (Fizz's gltf-transform pass) into public/models/.
# Source of truth: C:\Projects\CAD\RL300-SAFE\optimized\ — jgun-full.glb is renamed to
# Default.glb so the brief's useGLTF('/models/Default.glb') path resolves.
#
# NOMENCLATURE (Mark, 2026-09-05): `jgun` is an in-house designation and must not
# appear on any public surface — shipped filenames included, since they are visible
# in the network tab. The CAD-side names stay as they are; every copy step renames
# on the way into public/models/ (jgun-full -> Default, jgun-gearbox -> ptg-gearbox,
# jgun-handle -> ptg-handle). The public designation is PTG-HP-1000; see
# ASSEMBLY_IDENTITY in src/data/caseStudies.ts.
#
# ptg-gearbox.glb / ptg-handle.glb have NO runtime consumers — they are staged
# derivatives kept for JG-024. Nothing loads them; only Default.glb,
# m249-transformed.glb and msp-enclosure.glb are fetched.
#
# NOT synced here: public/models/m249-transformed.glb. It is 871 KB, so it is
# committed to the repo directly (force-added past the public/models/*.glb
# ignore) rather than synced. Its source of truth is C:\Projects\CAD\m249.glb
# -> m249-transformed.glb, and it is post-processed after gltfjsx (see
# src/scene/stages/M249Stage.tsx). Do NOT add it to this script: syncing a
# tracked file produces spurious diffs.
#
# NOT synced here: public/models/msp-enclosure.glb (JG-015 Stage 2 asset). It is
# 2.38 MB and hierarchy-critical (7 named roots must survive verbatim), so it is
# committed directly, force-added past the ignore, like m249. Source of truth is
# C:\Projects\CAD\RL300-SAFE\msp-enclosure-draco.glb (Blender glTF I/O v5.1.19 +
# Draco; NEVER re-run gltfjsx --transform on it). A node-rename re-export
# (DUCT_INTAKE -> DUCT_LABYRINTH, DUCT_EXHAUST -> EXHAUST_PORT) is in progress on
# C:\Projects\CAD\RL300-SAFE\RL300-SAFE-webexport-v4-node-rename.blend; until it
# lands, the shipped node names are the 7 below. Do NOT add it to this script.
$ErrorActionPreference = 'Stop'

$src = 'C:\Projects\CAD\RL300-SAFE\optimized'
$dst = Join-Path $PSScriptRoot '..\public\models'

New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item (Join-Path $src 'jgun-full.glb') (Join-Path $dst 'Default.glb') -Force
Copy-Item (Join-Path $src 'jgun-gearbox.glb') (Join-Path $dst 'ptg-gearbox.glb') -Force
Copy-Item (Join-Path $src 'jgun-handle.glb') (Join-Path $dst 'ptg-handle.glb') -Force
Copy-Item (Join-Path $src 'role-map.json') $dst -Force

Write-Host "Assets synced: $((Get-ChildItem $dst | Measure-Object).Count) files in $dst"
