#!/bin/bash
# usage: run-pt.sh <viewport 1440x900|390x844> <out-name>   (cwd = main worktree; DIST env optional)
S="/c/Users/Markimus/AppData/Local/Temp/claude/C--Users-Markimus--buzz-REPOS-jgun-quiet-machine/df06f954-a691-4644-b235-2da4781e90da/scratchpad/gpu"
R=/c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine
E3=$R/project/work/evidence/rl300-quiet-machine/33-gpu-3
vp="$1"; name="$2"
mkdir -p "$E3"
cd "$R" || exit 2
bash "$S/hashcheck2.sh" > "$E3/$name.hashcheck.txt" 2>&1 || { cat "$E3/$name.hashcheck.txt"; exit 3; }
node scripts/verify-page-transition.mjs --url=http://localhost:4173 --viewport="$vp" --out="$E3/$name" > "$E3/$name.log" 2>&1
code=$?
echo "exit=$code" >> "$E3/$name.log"
echo "run $name vp=$vp exit=$code"
tail -n 14 "$E3/$name.log" | cut -c1-260
