#!/usr/bin/env sh
# JG-044 homepage frame stages: encode one turn set into proto/merged/<out>/.
# Usage: scripts/encode-ch04-frames.sh <out> <line-dir> <shade-dir> [W H] [crop "x y w h"]
#   cage:    scripts/encode-ch04-frames.sh ch4/cage .scratch/ch04/m360/line .scratch/ch04/m360/shade
#   carbine: scripts/encode-ch04-frames.sh arm .scratch/arm360/m360/line .scratch/arm360/m360/shade 1278 426 "60 330 1800 600"
# Inputs: *line-<deg>*.png and *shade-<deg>*.png with zero-padded degrees, one per angle, evenly spaced
# (sorted by name = sorted by angle). Output l000.webp.. / s000.webp.. (3 digits), carbine recipe:
# line q62 RGB (ink on white), shade q72 / alpha_q 85 RGBA. hero-<finish>-*.png -> hero-<finish>.webp.
# Writes manifest.json (frames, deg, size, name patterns, finishes, heroDeg). Needs cwebp 1.6.0.
# File names carry the set name only, never a part number.
set -eu
OUT="proto/merged/$1"; LINE=$2; SHADE=$3; W=${4:-1024}; H=${5:-640}; CROP=${6:-}
rm -f "$OUT"/l*.webp "$OUT"/s*.webp "$OUT"/hero-*.webp; mkdir -p "$OUT"
C=""; [ -n "$CROP" ] && C="-crop $CROP"
i=0
for f in $(ls "$LINE" | grep -- 'line-[0-9]' | sort); do
  cwebp -quiet -q 62 $C -resize "$W" "$H" -noalpha "$LINE/$f" -o "$OUT/l$(printf %03d $i).webp"; i=$((i + 1))
done
n=$i; i=0
for f in $(ls "$SHADE" | grep -- '^[a-z]*-shade-[0-9]\|^f-shade-[0-9]' | grep -v '^hero-' | sort); do
  cwebp -quiet -q 72 -alpha_q 85 $C -resize "$W" "$H" "$SHADE/$f" -o "$OUT/s$(printf %03d $i).webp"; i=$((i + 1))
done
[ "$i" -eq "$n" ] || { echo "line/shade count mismatch: $n vs $i" >&2; exit 1; }
for f in "$SHADE"/hero-*-shade-*.png; do
  [ -e "$f" ] || continue
  fin=$(basename "$f" | sed 's/^hero-\([a-z]*\)-.*/\1/')
  cwebp -quiet -q 80 -alpha_q 90 -resize 1536 960 "$f" -o "$OUT/hero-$fin.webp"
done
FIN=$(ls "$OUT" | grep '^hero-' | sed 's/hero-\([a-z]*\)\.webp/"\1"/' | paste -sd, -)
HERO_DEG=$(ls "$SHADE" | grep '^hero-' | head -1 | sed 's/.*-shade-\([0-9]*\)\..*/\1/')
cat > "$OUT/manifest.json" <<EOF
{ "set": "$1", "frames": $n, "deg": $((360 / n)), "size": [$W, $H], "line": "l%03d.webp", "shade": "s%03d.webp",
  "finishes": [$FIN], "hero": "hero-%s.webp", "heroDeg": $(echo "${HERO_DEG:-0}" | sed 's/^0*\([0-9]\)/\1/') }
EOF
echo "$1: $n frame pairs -> $OUT ($(du -sh "$OUT" | cut -f1))"
