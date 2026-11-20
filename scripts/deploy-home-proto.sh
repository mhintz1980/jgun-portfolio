#!/usr/bin/env sh
# Publish proto/merged/ as studiomark.dev/home/ on top of the live production build.
# Every other page stays exactly as built from BASE (the commit live production was built from;
# check with `npx wrangler pages deployment list --project-name=jgun-portfolio --environment production`).
# Usage, from this worktree:  scripts/deploy-home-proto.sh [--deploy]
# Without --deploy it only stages to $STAGE and prints the path. Publishing needs Mark's go.
# First used 2026-11-20 (deployment ccf8f156), BASE d2a820dd.
set -eu
BASE=${BASE:-d2a820dd}
ROOT=$(git rev-parse --show-toplevel)
MAIN=$(git -C "$ROOT" worktree list | head -1 | cut -d' ' -f1)
BW="$MAIN/.claude/worktrees/deploy-home-$BASE"
STAGE=${STAGE:-"$BW/stage"}
[ -d "$BW" ] || git -C "$MAIN" worktree add -q --detach "$BW" "$BASE"
if [ ! -f "$BW/dist/home/index.html" ]; then
  (cd "$BW" && node "$MAIN/node_modules/typescript/bin/tsc" && node "$MAIN/node_modules/vite/bin/vite.js" build)
fi
rm -rf "$STAGE"; cp -r "$BW/dist" "$STAGE"
cp -r "$ROOT/proto/merged/main.js" "$ROOT/proto/merged/lib" "$ROOT/proto/merged/arm" "$ROOT/proto/merged/ch4" "$STAGE/home/"
# the prototype is noindex; as the homepage it takes the live page's robots, canonical and description
sed -e 's#<meta name="robots" content="noindex">#<meta name="robots" content="index, follow">\n<link rel="canonical" href="https://studiomark.dev/home/">#' \
    -e 's#<meta name="description" content="[^"]*">#<meta name="description" content="Mark Hintz, mechanical designer and systems builder: precision tooling, industrial pump packages, and the tools around the CAD.">#' \
    "$ROOT/proto/merged/index.html" > "$STAGE/home/index.html"
echo "staged: $STAGE"
if [ "${1:-}" = "--deploy" ]; then
  HEAD=$(git -C "$ROOT" rev-parse --short HEAD)
  (cd "$MAIN" && env -u HTTPS_PROXY -u HTTP_PROXY CI=1 npx --no-install wrangler pages deploy "$STAGE" --project-name=jgun-portfolio \
    --branch=main --commit-hash="$BASE" --commit-dirty=true --commit-message="Homepage: proto/merged at $HEAD on live $BASE")
fi
