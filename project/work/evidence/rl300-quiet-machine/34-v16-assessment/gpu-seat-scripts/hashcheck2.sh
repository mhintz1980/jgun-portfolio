#!/bin/bash
# Byte-exact served-vs-dist check (curl -o file + sha256sum; piping strips the final CR).
# DIST env = the dist dir the server should be serving (default: main worktree).
S="/c/Users/Markimus/AppData/Local/Temp/claude/C--Users-Markimus--buzz-REPOS-jgun-quiet-machine/df06f954-a691-4644-b235-2da4781e90da/scratchpad/gpu"
D="${DIST:-/c/Users/Markimus/.buzz/REPOS/jgun-quiet-machine/dist}"
curl -s http://localhost:4173/quiet-machine/ -o "$S/hc2-qm.html"
curl -s http://localhost:4173/ -o "$S/hc2-root.html"
a=$(sha256sum < "$S/hc2-qm.html" | cut -d' ' -f1); b=$(sha256sum < "$D/quiet-machine/index.html" | cut -d' ' -f1)
c=$(sha256sum < "$S/hc2-root.html" | cut -d' ' -f1); d=$(sha256sum < "$D/index.html" | cut -d' ' -f1)
echo "dist dir               $D"
echo "served /quiet-machine/ $a"
echo "dist   quiet-machine   $b"
echo "served /               $c"
echo "dist   index.html      $d"
if [ "$a" = "$b" ] && [ "$c" = "$d" ] && [ -n "$a" ]; then echo "HASHCHECK MATCH"; else echo "HASHCHECK MISMATCH"; exit 1; fi
