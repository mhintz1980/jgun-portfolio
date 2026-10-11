#!/bin/bash
S="/c/Users/Markimus/AppData/Local/Temp/claude/C--Users-Markimus--buzz-REPOS-jgun-quiet-machine/df06f954-a691-4644-b235-2da4781e90da/scratchpad/gpu"
R=/c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine
E=$R/project/work/evidence/rl300-quiet-machine/32-gpu-2
cd "$R" || exit 2
bash "$S/hashcheck.sh" > "$E/hashcheck-before-verifier.txt" 2>&1 || { cat "$E/hashcheck-before-verifier.txt"; exit 3; }
cat "$E/hashcheck-before-verifier.txt"
mkdir -p "$E/verify-jg033-preview"
OUT="$E/verify-jg033-preview" BASE_URL=http://localhost:4173 node scripts/verify-jg033-preview.mjs > "$E/verify-jg033-preview.log" 2>&1
code=$?
echo "exit=$code" >> "$E/verify-jg033-preview.log"
echo "verifier exit=$code"
