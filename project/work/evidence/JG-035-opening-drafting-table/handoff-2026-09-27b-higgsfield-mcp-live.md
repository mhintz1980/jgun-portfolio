# JG-035 handoff — 2026-09-27b (Higgsfield MCP live)

Supersedes the Higgsfield section of `handoff-2026-09-27-camera-rake.md`; everything
else there (camera rake, vellum close, illumination, payload v2, poster fallback,
next steps 2–7) still stands and is still unpushed at `bdf414f` (branch ahead 6).

## What happened since the 09-27 handoff

The credits situation resolved completely differently than researched:

1. **The raw API is trial-gated.** The pasted key (stored in `.env.local`,
   `HF_CREDENTIALS=key:secret`, gitignored) authenticates fine — the `/estimate/`
   endpoint returns 200 with real pricing — but generation returns
   `403 not_enough_credits`, and the `higgsfield` CLI returns
   `only_mcp_usage_on_trial_is_available`. The readiness report's REST/SDK lane is
   correct documentation but **cannot spend the trial's 100 credits**.
2. **Only the hosted MCP server can spend them.** `https://mcp.higgsfield.ai/mcp`,
   registered user-scope in `~/.claude.json` as server `higgsfield`, auth via
   `Authorization: Bearer <token>` where the token comes from `higgsfield auth token`
   (OAuth `oat_…` tokens — they can expire; if `claude mcp list` ever shows
   "Needs authentication", re-run `higgsfield auth login`, `claude mcp remove
   higgsfield --scope user`, re-add with the fresh token header).
3. **Installed and live**: `@higgsfield/cli` 1.1.26 (auth login done, workspace
   `9e8fcd59-a2d6-49c1-813e-bd2f4accf1f2` "Private" selected), `@higgsfield/client`
   SDK 0.2.6 (project dep), all 8 companion skills in `.agents/skills/higgsfield-*`
   (symlinked for Claude Code), MCP server **connected and verified live**: the
   `mcp__higgsfield__*` toolset loaded this session and `balance` returns
   **100 credits, plus plan** — nothing spent yet.
4. The MCP toolset is large (`generate_video`, `generate_image`, `generate_video_batch`,
   `jobs_wait`, `show_generation_by_ids`, `models_explore`, `media_upload`, plus
   marketing/website/3D-scene-builder surfaces — see the server instructions in this
   session's system context). Generation protocol per server: use `generate_*` tools,
   batch + `jobs_wait` + one `show_generation_by_ids` for multiples,
   `get_workflow_instructions` before multi-step videos, `models_explore(action:
   'recommend')` when unsure of the model.

## Cost reality (measured via CLI `generate cost`, same billing)

- `seedance_2_5` 5 s / 720p / 16:9 ≈ **35 credits** → 100 credits = **2 clips** (30
  left) or 2 clips + a 1-credit image test. The manifest's 3 clips do NOT all fit at
  Seedance quality.
- Cheaper lanes exist (`nano_banana_2_lite` image = 1 credit; video models vary —
  check `generate cost`/estimate per model before firing).
- **Recommendation**: spend deliberately — e.g. RL300 acoustic lab (Seedance 35) +
  workshop haze (Seedance 35) via MCP `generate_video`, keep 30 in reserve for one
  retry or an M249 plate at a cheaper model. Get an Astra ruling direction first if
  cheap-image drafts would help choose (1-credit images can mock all three moods
  before committing to video).

## Uncommitted working tree (intentional)

`.gitignore` (env entries), `package.json`/lock (`@higgsfield/client` dep),
`.agents/skills/higgsfield-*` + `.claude/skills` (skills install — decide whether the
repo should carry these or they stay machine-local; they are symlinked, so committing
`.agents/skills/` real files is fine but check the symlinks resolve for other clones),
`.env.local` (NEVER commit). `scripts/higgsfield-example.ts` (REST example; kept for
when the account upgrades off trial).

## Next session, in order

1. **Spend the credits via MCP** — draft cheap image probes first (1 cr each) if
   useful, then the two Seedance clips from
   `higgsfield-asset-manifest-2026-09-27.json` (prompts are restraint-ruled:
   locked camera, no humans/products/text, empty staging area). Stash outputs
   outside `public/` with prompt/request-id sidecars.
2. Re-capture the opening after the vellum/illumination fixes
   (`node scripts/capture-jgun-opening.mjs --points=0.06,0.066,0.072,0.078,0.084`)
   — the committed `first-rake` frames predate those fixes.
3. Astra ruling packet (one call, images attached) for the 4 visibility effects +
   camera rake + vellum close.
4. `node scripts/verify-jgun-opening.mjs --quick --url=http://localhost:5211` →
   full 6-case roster for done-evidence.
5. Prod-preview precompute measurement; poster-tier visual pass; then push.

## Cautions

- The MCP server instructions say local/attached media needs `media_upload_widget`
  as the only tool in that turn — read the server instructions in context before
  the first upload.
- Trial auto-renewal: there is an MCP tool `cancel_trial_auto_renewal` — do NOT call
  it unless Mark asks; billing decisions are his.
- Never log/commit the `.env.local` values or the Bearer token.
- GPU captures and the in-app browser pane still contend (poster-tier drops) — use
  playwright with `--use-angle=d3d11` for evidence.
