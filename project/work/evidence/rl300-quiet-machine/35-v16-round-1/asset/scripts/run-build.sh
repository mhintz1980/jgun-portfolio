#!/usr/bin/env bash
# Usage: run-build.sh <tag> [cfg-json]   (writes <scratch>/asset/<tag>.glb|json|log)
S="C:/Users/Markimus/AppData/Local/Temp/claude/C--Users-Markimus--buzz-REPOS-jgun-quiet-machine/7a0ea69b-a024-4739-ae73-5eab43caed88/scratchpad"
R="C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine/project/work/evidence/rl300-quiet-machine/35-v16-round-1/asset"
TAG="$1"
export OUT_GLB="$S/asset/$TAG.glb" OUT_JSON="$S/asset/$TAG.json"
if [ -n "$2" ]; then export CFG="$2"; fi
"C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" --background --factory-startup "$S/v16/V16-copy.blend" --python "$R/scripts/build_extras.py" > "$S/asset/$TAG.log" 2>&1
grep -E "BUILD_OK|^ROW|Error|Traceback|line [0-9]+" "$S/asset/$TAG.log" | head -40
ls -la "$S/asset/$TAG.glb" 2>&1 | tail -1
