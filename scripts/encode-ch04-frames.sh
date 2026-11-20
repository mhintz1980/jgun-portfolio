#!/usr/bin/env sh
# JG-044 Chapter 04: encode one assembly's turn frames for proto/merged/ch4/<set>/.
# Usage: scripts/encode-ch04-frames.sh <set> <line-dir> <shade-dir>
#   e.g. scripts/encode-ch04-frames.sh cage .scratch/ch04/run-p1-line .scratch/ch04/run-p1-cage
# Carbine recipe: 1024x640, line q62 (RGB, ink on white), shade q72 / alpha_q 85 (RGBA).
# Frames are taken in azimuth order (turn-*-000.0 .. 354.0) and numbered 00..59.
# Hero stills (hero-<finish>-shade-*.png in the shade dir) become hero-<finish>.webp.
# Needs cwebp 1.6.0. File names carry the set name only, never a part number.
set -eu
SET=$1; LINE=$2; SHADE=$3
OUT="proto/merged/ch4/$SET"
mkdir -p "$OUT"
i=0
for f in $(ls "$LINE"/turn-line-*.png | sort); do
  cwebp -quiet -q 62 -resize 1024 640 -noalpha "$f" -o "$OUT/l$(printf %02d $i).webp"; i=$((i + 1))
done
n=$i; i=0
for f in $(ls "$SHADE"/turn-shade-*.png | sort); do
  cwebp -quiet -q 72 -alpha_q 85 -resize 1024 640 "$f" -o "$OUT/s$(printf %02d $i).webp"; i=$((i + 1))
done
[ "$i" -eq "$n" ] || { echo "line/shade count mismatch: $n vs $i" >&2; exit 1; }
for f in "$SHADE"/hero-*-shade-*.png; do
  [ -e "$f" ] || continue
  fin=$(basename "$f" | sed 's/^hero-\([a-z]*\)-.*/\1/')
  cwebp -quiet -q 80 -alpha_q 90 -resize 1536 960 "$f" -o "$OUT/hero-$fin.webp"
done
FIN=$(ls "$OUT"/hero-*.webp 2>/dev/null | sed 's/.*hero-\([a-z]*\)\.webp/"\1"/' | paste -sd, -)
HERO_DEG=$(ls "$SHADE"/hero-*-shade-*.png 2>/dev/null | head -1 | sed 's/.*-shade-\([0-9]*\)\..*/\1/')
cat > "$OUT/manifest.json" <<EOF
{ "set": "$SET", "frames": $n, "deg": $((360 / n)), "size": [1024, 640], "line": "l%02d.webp", "shade": "s%02d.webp",
  "finishes": [$FIN], "hero": "hero-%s.webp", "heroDeg": ${HERO_DEG:-0} }
EOF
echo "$SET: $n frame pairs -> $OUT ($(du -sh "$OUT" | cut -f1))"
