# JG-035 handoff — 2026-09-28 (reconciliation: continuation evidence committed, rulings next)

This is the current handoff. It supersedes the "Next session" list of
`handoff-2026-09-27b-higgsfield-mcp-live.md` (most of which is now done — see
below); 09-27b's Higgsfield protocol/cost-lane detail and
`handoff-2026-09-27-camera-rake.md` remain valid reference. The full 09-28
session record is
[`../continuation-2026-09-27/report-2026-09-28.md`](../continuation-2026-09-27/report-2026-09-28.md).

## Repo state (verified at write time)

- Branch `codex/jg033-signature-shot`, **working tree clean**, pushed to
  `origin` (GitHub). Only branches in existence: this one + `main` (all others
  deleted 2026-09-28; every deleted branch had zero unique commits).
- The `buzz` remote was **removed** 2026-09-29 by owner instruction. The site
  deploys GitHub → Cloudflare Pages (`jgun-portfolio` project) →
  `www.studiomark.dev`; pushing to `origin` is what updates the site. If the
  buzz tool ever re-adds the remote, that's expected and harmless.
- `.env.local` (Higgsfield key) and `.claude/skills/` (machine-local symlinks)
  are gitignored. Never commit or log the key or the MCP Bearer token.

## What happened since handoff 09-27b

The 09-27/28 continuation session (worker "Darwin" + parent + read-only
reviewer "Raman") executed most of 09-27b's list:

1. **Step 2 done — opening re-captured** after the vellum/illumination fixes
   (`.06/.066/.072/.078/.084`), then ruled on by telemetry + pixel stats:
   camera rake, vellum close, illumination all behave as authored; cyan/hologram
   concern measures ≤ 2.1% of the model band. **Owner/Astra visual ruling still
   open** — these are programmatic measures, not an aesthetic ruling.
2. **Two real app bugs found and fixed** (commit `168d0aa`, 3 new tests,
   145/145 pass): the poster/reduced-motion one-card scrolled out of view (now a
   fixed `pointer-events-none` overlay with an internally scrollable card,
   `Chapters.tsx`), and paced→raw scroll conversion was missing in
   `navigateToStation` and the reduced-motion deep-link listener
   (`scrollStore.ts`, now via `rawScrollFor()` with rAF retry until tracks
   commit). Affected every tier, not just poster.
3. **Step 4 done — full verification on a fresh build:** typecheck clean,
   145/145 tests, full 6-case opening roster, poster e2e 3/3 viewports,
   deep-link probe PASS in poster AND reduced-motion tiers.
4. **Step 5 done — production precompute measured:** warm precomputed loads
   ~4.9 s vs ~9.0 s live (cold loads noisy). Decision recorded: **keep the v2
   asset.**
5. **Step 1 blocked — Higgsfield:** generation via the hosted MCP returns
   `403 only_mcp_usage_on_trial_is_available`; the REST/SDK lane is also
   trial-gated. **No credits spent — 100 remain.** Support request
   `58b9e9a2-5ff4-4fc4-8f45-1ed4cc74642c` is on file. Do NOT retry generation
   until the account/server restriction is resolved. (This corrects 09-27b's
   belief that the MCP server could spend trial credits.)
6. **Reconciliation commits (this session):** `168d0aa` fixes+tests,
   `b830b57` Higgsfield tooling (`@higgsfield/client` dep,
   `scripts/higgsfield-mcp-call.ps1` bridge, `.agents/skills/higgsfield-*` +
   `skills-lock.json`), `b18f9eb` all continuation/baseline evidence + TODO
   update, plus this handoff. The verifier harness scripts used by the
   continuation (verify-poster / verify-deep-links / analyze-frame-pixels /
   debug-deep-link) live **inside the evidence folder**, not `scripts/`.

## Next session, in order

1. **Owner + Astra visual ruling** — the only gate left before "done". Inputs:
   stills in `continuation-2026-09-27/frames/` (+ `frames-retry/`), ruling
   tables in `report-2026-09-28.md`. One Astra call, images attached, covering
   the 4 visibility effects + camera rake + vellum close.
2. **Higgsfield account check:** `higgsfield` CLI auth/balance + the support
   ticket. If unblocked, spend per 09-27b's cost lanes (2× Seedance ≈ 70
   credits, prompts in `higgsfield-asset-manifest-2026-09-27.json`; 1-credit
   `nano_banana_2_lite` image probes first if useful). If still 403, it's an
   owner billing decision — don't burn retries.
3. **After the ruling:** fix-or-ship per `TODO.md` JG-035 entry. Iterate with
   `node scripts/verify-jgun-opening.mjs --quick --url=http://localhost:<port>`
   (dev-server port floats — use whichever is running; :5211 was live
   2026-09-28 evening); restart the :4173 preview server after EVERY rebuild;
   full 6-case roster only as done-evidence.
4. **Push** once evidence + checks are complete (origin = the site's pipeline).

## Cautions carried forward

- Verify with runtime telemetry, never vision alone; part numbers, not stage
  names, are the stable key.
- `.env.local` values and the MCP Bearer token never enter logs, commits, or
  notes. `cancel_trial_auto_renewal` stays uncalled unless Mark asks.
- GPU captures and the in-app browser pane contend — use playwright with
  `--use-angle=d3d11` for evidence captures.
- `~/.buzz/REPOS/jgun-portfolio` is a linked worktree of this repo; a shell may
  start there — `pwd` before path-sensitive work.
