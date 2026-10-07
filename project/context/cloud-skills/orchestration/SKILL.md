---
name: orchestration
description: Routing doctrine for the architect-as-orchestrator pattern across harnesses — how a parent session (Claude Code, Codex, or Z-Code) delegates implementation through the opencodex local proxy (ocx, pinned 2.55.0) to any provider (DeepSeek deepseek-flash, z.ai GLM-5.3/GLM-5.3-Flash, OpenAI GPT-5.6 Luna/Sol, GPT-6 Astra), picks a stack and a reasoning effort per task, proves which model actually served each seat, and gets every deliverable reviewed before reporting done. USE WHEN delegating implementation work, choosing between routed models or a stack, writing a spec for a subagent, deciding whether to consult fable-advisor, managing session cost or token spend, or running any multi-task build where the session is the architect.
---

# Orchestration — the architect's routing doctrine

> **Canonical home: `~/.agents/skills/orchestration/`**; `~/.claude`, `~/.zcode` and `~/.codex`
> carry plain copies, synced by `scripts/sync-orchestration-skill.sh` (`--check` reports drift).
> Forked from the `fable-advisor@fable-advisor` plugin (v5.0.0) on 2026-09-13. Lane-fleet era
> 2026-09-13..15 (see history pointers). **2026-09-17: opencodex (`ocx`) adopted as the canonical
> cross-provider layer** (owner ruling, supersedes the 2026-09-15 subscription-purity "no proxy"
> ruling — decision log has the entry). The homegrown lane scripts are quarantined; every number
> below tagged [09-15] is a historical lane-fleet measurement that does NOT transfer to ocx-routed
> requests — re-measure before trusting it.

The session is the architect: it owns requirements, architecture, decomposition, specs, routing, and
verification. It should almost never type implementation code. Every implementation task goes to the
cheapest adequate model at the lowest adequate reasoning effort — escalation is deliberate, per
task, never a standing binding — and every finished deliverable gets a fresh-context review before
the architect reports done.

## Cost discipline — the prime directive

**Emit judgment, not volume.** The architect's output is decomposition, specs, routing decisions,
verdicts on diffs, and short reports. A code block longer than an interface signature is a spec that
hasn't been delegated yet. Fixing a seat's bug by hand is the same failure in disguise — send a
corrected spec back instead.

**Keep the context lean.** Everything in the architect's context is re-read at architect prices every
turn. Delegate exploration and log-grepping to a cheap read-only agent and keep the conclusions only.

**Reason once, then hand off.** Do the hard thinking in one pass, capture it in the spec, let the seat
carry it. Re-deriving decisions across turns burns the premium twice.

What stays with the architect regardless of cost: decomposition, interface design, hypothesis
selection when debugging, spec writing, routing, and judging verification evidence.

## The ocx layer — what it is, how to drive it

`ocx` (opencodex 2.55.0, npm `@bitkyc08/opencodex`, binary `~/.hermes/node/ocx`) is a local
API-translation proxy on `127.0.0.1:10100` speaking OpenAI-Responses and Anthropic-Messages.
Config: `~/.opencodex/config.json`. Providers configured 2026-09-17: `deepseek`
(default `deepseek-flash` = **DeepSeek v4.1-Flash**, never route `deepseek-v4-pro`) and `zai`
(default `glm-5.3`; also serves `glm-5.3-flash`), both with **env-reference keys**
(`${DEEPSEEK_API_KEY}`, `${ZAI_API_KEY}` — no key value on disk in ocx config) plus `openai`
(Codex ChatGPT OAuth forwarded read-only from `~/.codex/auth.json`).

**Startup contract (the one operational rule that bites):** env references resolve from the
*daemon's* environment. Start the proxy from a shell that has both keys set:

```bash
set -a; . "$HOME/.config/deepastra/key/.deepseek.key"; set +a
ZAI_API_KEY=$(node -e "const c=require(process.env.USERPROFILE+'/.zcode/v2/config.json'); console.log((((c.provider||{})['builtin:zai-coding-plan']||{}).options||{}).apiKey||'')")
export ZAI_API_KEY
ocx start   # or: ocx stop / ocx status / ocx health
```

A daemon started without them serves auth errors on those providers until restarted properly.

**Wired surfaces (verified 2026-09-17):**

| Surface | Mechanism | Dispatch example | Proof |
|---|---|---|---|
| Any client (curl) | loopback OpenAI-chat/Responses | `curl http://127.0.0.1:10100/v1/chat/completions -d '{"model":"deepseek/deepseek-flash",...}'` | **receipt**: response body echoes served model |
| `codex exec` / Codex App | ocx marker-injects root `openai_base_url` into `~/.codex/config.toml` | `codex exec --skip-git-repo-check -m "deepseek/deepseek-flash" "<spec>"` | structural + `ocx logs` |
| Claude Code CLI/App | `ocx claude` (child env only; keychain OAuth untouched; genuine claude-* passes through natively) | `ocx claude -p "<spec>"` | proxy-log (`ocx logs`) |
| ZCode desktop | `ocx zcode enable` wrote a managed `opencodex` provider into `~/.zcode/v2/config.json` — pick `OpenCodex` provider, then `deepseek/deepseek-flash` etc. in the model picker | (UI selection; needs ZCode restart to appear) | structural + `ocx logs` |
| ZCode headless (`zcode.cjs`) | **no model flag exists** — keep native GLM parent; dispatch cross-provider by shelling out to `ocx claude -p` / `codex exec` from Bash | see row above | the shell-out's own proof |
| Claude tier mapping | `~/.opencodex/config.json` `claudeCode.tierModels` — currently sonnet→`deepseek/deepseek-flash`, haiku→`zai/glm-5.3-flash`; opus/fable unset = native passthrough | `ocx claude -p "..."` (no --model; sonnet default routes) | proxy-log |
| Claude Desktop (Electron) | `ocx claude desktop apply` wrote the third-party profile to `%LOCALAPPDATA%\Claude-3p\configLibrary\3fb81f83-…json` (wired 2026-09-17; owner dropped the auto-update pin `HKLM\SOFTWARE\Policies\Claude\disableAutoUpdates` to unblock it — backup `C:\tmp\claude-policy-backup.reg`) | pick an ocx family alias in Desktop's model picker (needs full quit + reopen) | status fingerprints match; picker routing post-restart = **pending** |

Claude Desktop wiring detail (2026-09-17): Desktop ignores local third-party profiles while *any*
machine-managed policy exists, and ocx never bypasses one — the pin key had to go first (owner
decision). Profile store is `%LOCALAPPDATA%\Claude-3p\configLibrary` (Claude-3p), **not** the
`%APPDATA%\Claude\configLibrary` path older ocx docs name. `ocx claude desktop status` shows
applied/fingerprint/drift; `ocx claude desktop [apply|show|move|default]` manages routes. Rollback:
`ocx claude desktop` remove/none + re-import `C:\tmp\claude-policy-backup.reg` to restore the pin.

**ocx gotchas verified 2026-09-17:**
- **Any ocx command that "ensures the proxy is running" (incl. `ocx claude desktop apply`) can
  respawn the daemon from the *invoking* shell** — if that shell lacks the provider keys, the new
  daemon serves 401s (observed: deepseek discovery 401 until restart). Run ocx commands from a
  key-carrying shell, or re-run the startup contract after any apply.
- `[claude-code:unrecognized_model] {"model":"...[1m]"}` on stderr is cosmetic when the turn still
  routes — claude appends an `[1m]` context-variant suffix (`claudeCode.autoContext=false` reduces
  it); the proof is `ocx logs`, never the CLI's `modelUsage` (that is an echo — see Verification).
- `deepseek-flash` is a reasoning model: small `max_tokens` gets eaten by `reasoning_content`
  before any visible content. Don't mistake an empty `content` for failure — check `finish_reason`.
- zai model discovery 404s (its Responses path has no list endpoint), so catalog visibility stays
  "pending"; **routing works regardless**. The two GLM rows were registered manually
  (`ocx models add zai glm-5.3 …`). `ocx provider test <name>` errors "unknown provider" on 2.55.0 —
  probe with a real request instead.
- `ocx stop` removes its markers from `config.toml` cleanly (verified: 0 markers after stop, native
  `codex exec` auth fine). It refuses to clobber a user-owned root `openai_base_url`; a journal at
  `~/.codex/opencodex-journal.json` guards restore against drift.
- ocx injects up to 5 `ocx-*.md` roster agents into `~/.claude/agents/` (marker-gated; user files
  never touched). It never writes `~/.zcode/agents/`.
- Windows: persistent env injection is macOS-only in ocx source — the 2026-08
  orphaned-`ANTHROPIC_BASE_URL` outage class cannot recur via ocx here. Still: never export
  `ANTHROPIC_*` into a shared shell.
- **The daemon is mortal — check `ocx status` before dispatching.** Found down 2026-09-18 with
  no reboot since 09-13: the 09-17 launch shell's console had closed (console-close kills every
  process attached to it; parent-process kill alone does NOT — tested 09-18, daemon survived).
  When down, restart per the startup contract above. Durable fix = `ocx service install`
  (deliberately absent 2026-09-17 — owner decision).
- Loopback only (`127.0.0.1:10100`). No LAN/Tailscale exposure without an explicit owner decision.

**Safety/ToS posture (decision-log 2026-09-17):** ocx impersonates official client ids to carry
subscription OAuth through the proxy — ToS-gray, accepted deliberately by the owner when the
lane-fleet implementation proved problematic. Metered providers (deepseek, zai key) carry no such
exposure. Snapshot before first `ocx start` lives at `C:\tmp\ocx-t4b\pre-ocx-snapshot-20260917\`
(sha256 manifest inside). Rollback: `ocx stop`, `ocx zcode disable`, restore snapshot.

## Stacks — pick one per session, not per task

A **stack** binds the five seats (orchestrator, planner, implement, workhorse, review) to concrete
models and surfaces. Catalog with YAML: `C:/vaults/markimus-SecondBrain/04-Projects/cross-harness-orchestration/stacks/`
(rebound to ocx selectors 2026-09-17).

| Stack | Orchestrator | Planner | Implement | Workhorse | Review |
|---|---|---|---|---|---|
| **`s1`** (default) | GLM-5.3 — Z-Code session (native) | `deepseek/deepseek-flash` (metered, low volume) | `zai/glm-5.3-flash` via ocx | `zai/glm-5.3-flash` → promote `zai/glm-5.3` | `gpt-5.6-luna` high (codex via ocx or native) |
| **`s2`** | `deepseek/deepseek-flash` — `ocx claude` seat | `zai/glm-5.3` | `deepseek/deepseek-flash`, fresh context per spec | same | `zai/glm-5.3-flash` |
| **Claude-led** | this session | — | `ocx claude` / `codex exec -m` / curl | sol/astra rungs | `fable-advisor` + a cross-family seat |

Overlays (on top, never default): **`o-adversarial`** — independent reviewer from a *different
vendor family* than the producer + the Fable gate (security paths, migrations, API shapes; flash
reviewing flash is barely review). Review material to assign with it lives in the skills index:
`multi-axis-code-review` (597 lines, Standards/Spec/Evidence axes), `thermo-nuclear-code-quality-review`
(255), `code-review`, and `doubt-driven-development` for decision-level doubt rather than diffs.
**`o-heavy`** — workhorse → `gpt-5.6-sol` or `gpt-6-astra`, planner → stronger seat, after two
failed attempts.

Deciding rule: how much does the outcome depend on judgment the spec can't capture? Little → the
routine seat; you verify anyway. A lot, and mistakes are costly → escalate. A routine task that
fails its spec once gets a corrected spec; twice, it escalates — repetition is evidence the task
was misclassified. If a seat returns `unavailable`/`timeout`, say so and decide: re-route or keep.
Never quietly absorb a substitution or a cost change.

## Reasoning effort

Pick the lowest rung that is adequate. Effort is cost and wall-clock, not a quality dial.

| Rung | Luna | Sol | Use for |
|---|---|---|---|
| `low` / `medium` | ✓ | ✓ | Mechanical edits, renames, wiring, boilerplate, config, tests mirroring a pattern |
| `high` | ✓ | ✓ | Ordinary features with a couple of decisions left to the seat |
| `xhigh` | ✓ | ✓ | Tricky logic, multi-file changes with interactions, the second attempt |
| `max` | ✓ | ✓ | Concurrency, security-sensitive paths, gnarly debugging |
| `ultra` | — | ✓ | Sol only — wide-blast-radius refactors, problems that resisted two attempts |

Luna refuses `ultra` rather than rounding; a task that seems to need it is a task for Sol.
**Astra** takes the same knob (`low` default; `high`, `xhigh` verified [09-15]); it sits above Sol —
reach it through `o-heavy`, never for routine lanes or probes. DeepSeek effort is fixed High by the
API; GLM effort via ocx is unverified — pass through only what the provider documents. The ZCode
parent (yolo mode) runs at `variant: max` [09-15]. **Keep the parent's model *and* effort fixed per
task** — changing either busts the prompt cache.

Context floors measured [09-15, lane-fleet era — codex floors may differ through ocx now that
`--profile lane` is retired; native unprofiled codex measured 18,185 and 22,509 on 2026-09-17]:
Luna ~15.2k profiled / ~18k native, Sol ~21.4k (reasoning floor — stripping context cannot touch
it), Astra ~19k, ZCode parent ~31.5k per request, ZCode subagent ~5.5–7k. Never spend a frontier
seat on a probe or a question a cheaper seat can answer; batch genuine escalations into one call.

## The spec contract

Implementers share none of your conversation context. Every delegation prompt carries all six parts:

1. **Objective** — what to build or change, one paragraph
2. **Files** — exact paths to create or modify
3. **Interfaces** — signatures, types, or API shapes the code must match
4. **Constraints** — conventions, things not to touch
5. **Verification** — the command(s) that prove it works, and what output counts as passing
6. **Reasoning** — one line, `REASONING: <effort>`

**Keep the seat's own context small too.** A seat pays for everything its CLI loads before it reads
your spec (e.g. jgun-portfolio `AGENTS.md:8` orders every agent to read a 31 KB `TODO.md` ≈ 8k
tokens — when the spec is self-contained, say so in **Constraints**: *"Do not read TODO.md or other
queue docs — this spec is complete."*)

**Grant knowledge by path, not by enablement.** Seats run with all skills and plugins deactivated.
If a seat needs house knowledge, put the exact `SKILL.md` path in the spec — with a line range or
section name, forward slashes. A full path costs ~20 tokens once; a whole SKILL.md body costs
1–10k. Never send an alias or a manifest to resolve: alias→path resolution lives orchestrator-side.

**Resolve that path from the master skills index, not from memory.** `C:\Projects\skills-master` is
a reference-only shelf of 106 curated skills (two vendor clones, every entry carrying `when`, `tags`
and a `lines` cost) behind a 68 KB generated `skills-index.yaml`. Nothing in it auto-loads, so
consulting it costs the architect one query and costs every other session nothing.

```bash
IDX=C:/Projects/skills-master/_skills-index/skills-index.mjs
node $IDX --match "<topic>" --sort lines    # cheapest candidate skills first
node $IDX --tag audit --max-lines 130       # filter by tag and context cost
node $IDX --id <slug> --json                # full entry, including the resolved path
```

Four rules keep this cheap and honest:

- **The architect queries; the seat never sees the index.** Handing a seat the index path invites it
  to load twenty skills to find one. Quote the single resolved `SKILL.md` path instead.
- **One to three queries per delegation, and only for skill-shaped work** — a real method the seat
  needs, not ceremony.
- **Prefer the installed copy when a name exists in both.** `find-skills`, `handoff`,
  `read-the-damn-docs` and `skill-audit` are live in the harness homes *and* in the index; a seat
  gets the installed one unless you pass a path, so pass the live one.
- **An indexed skill is reference material, not a proven procedure.** It has never been exercised in
  the target repo, so the verification rules below still apply to whatever the seat does with it.

A spec you can't finish writing is a signal the decision isn't made yet — that's architect work,
not a reason to hand the ambiguity to a cheaper model.

## Parallelism

Independent specs (no shared files, no ordering dependency) launch in parallel. Sequential chains
and single-file surgery stay serial. **Every shared file is owned by exactly one seat** for the
duration of a task. For high-stakes work, run two capability tiers on the same spec and pick the
stronger diff.

## Commitment boundaries and the final review

Consult `fable-advisor` (`~/.claude/agents/fable-advisor.md`, read-only, verdict under 300 words):

- Before committing to an architecture, data migration, API shape, or refactor strategy
- Whenever the same problem has resisted two distinct attempts
- **Always, once, at the end of a deliverable** — it reads the accumulated changes with fresh eyes,
  against the stated goal, and returns ship / fix-first / rethink. The architect does not report
  done before this review.

One honest caveat: the advisor and a Claude architect are the same family — fresh-eyes check, not
independent-model check. Cross-vendor independence comes from the producing seats and
`o-adversarial`.

## Verification — the non-negotiable part

Reports are claims, not evidence. Before accepting any seat's work: read the diff, re-run the
verification command yourself. "Should work" or a report with no command output means not done.
**An empty diff with a clean exit is a refusal, not a success.** A seat that reports a spec gap
gets a corrected spec, not a "use your judgment".

**Prove the served model.** `~/.claude/bin/prove-served-model.sh` implements the rules. Exit
**0** = proven, **3** = mismatch (loudest failure), **4** = unprovable, **5** = no evidence,
**2** = bad arguments:

```bash
# any ocx-routed turn (proxy-log attribution: requestedModel/resolvedModel/provider)
prove-served-model.sh --lane ocx --since <epoch-ms> --expect "deepseek/deepseek-flash"

# a Z-Code subagent seat — real receipt; --agent is REQUIRED or you prove the parent's model
prove-served-model.sh --lane zcode --agent <seat> --expect glm-5.3-flash

# a Z-Code parent turn — real receipt
prove-served-model.sh --lane zcode --expect glm-5.3
```

The distinction it enforces:

- **Receipt** — produced *after* the request **by something that saw the server's answer**: ZCode's
  `model_usage` table, or a directly captured endpoint response body (the loopback chat API's body
  echoes the served model — verified 2026-09-17).
- **Proxy-log** — `ocx logs` `resolvedModel`/`provider`, written by the process that carried the
  request upstream. Strongest ocx-side attribution, but it is the proxy's accounting, not a server
  echo — label it as such (the `ocx` lane does).
- **Echo** — the model as *requested*: config, CLI flag, `turn_context`, `session_meta`, a usage
  object keyed by the requested model (claude's `modelUsage`!). Never proof, however authoritative
  it looks. The trap nearly shipped once [09-15]: `claude -p --output-format json` reported
  `claude-sonnet-4-5-20250929` while pointed at DeepSeek, whose own body returned `deepseek-flash`.

**A seat is not done until you have proven which model served it, from a per-request record.**
Codex-side seats stay structural (unknown slugs → HTTP 400, no silent substitution); ZCode returns
exit 0 for bogus ids, so never trust it as a validator. The adversarial reviewer gets a **fresh
context**: the diff and the spec, never the implementer's transcript.

### seatwrap — recording what the verification actually said

`seatwrap` (`C:/Projects/Misc/seatwrap/`, stdlib Python, no deps) wraps a shell-out dispatch and
does the re-running for you: it captures the seat's claim, observes the worktree before and after,
**re-executes the declared verify command itself**, and appends one JSONL row per return. It is
**log-only** — the seat's bytes stream through unchanged and `seatwrap run` exits with the seat's
own exit code, always, so wrapping a dispatch cannot change its outcome.

```bash
seatwrap run --seat implement-a --model deepseek/deepseek-flash \
  --spec-file specs/spec-A.txt --cwd <workdir> \
  -- codex exec --skip-git-repo-check --cd <workdir> -m deepseek/deepseek-flash "$(cat specs/spec-A.txt)"
```

`seatwrap` is on PATH (installed 2026-09-22 as an **editable** `uv` tool alongside `graphify` and
`notebooklm`), so that command runs from the project you are dispatching into — not from the
seatwrap repo. Do not install it non-editable: the default ledger path resolves relative to the
package, so a normal install would scatter rows inside the tool's venv instead of the one fleet
ledger at `C:/Projects/Misc/seatwrap/ledger/returns.jsonl`.

With `--spec-file`, the declared files and the `VERIFICATION` command are read straight out of the
six-part spec you already wrote, so a well-formed spec needs no extra flags. Use it on
implementation dispatches; skip it for read-only reviews, which have nothing to verify.

Why it belongs in this doctrine: the verification rule above is the one an architect is most tempted
to skip when a seat's report reads convincingly, and a skipped check leaves no trace. seatwrap makes
the check cheap and its absence visible — `verify_cmd_absent` is itself a recorded class.
`seatwrap report --since <date>` then prints how often each failure class actually fired. Until that
base rate exists, nothing here should be gated on it: read the rows, do not enforce them. **S3 — the
measurement — opened 2026-09-22 with the production path proven end to end, so rows from real
dispatches now accumulate; the more dispatches go through it, the sooner the base rate replaces
"0 in 6, upper bound 0.459".** Background: `C:/Projects/Misc/jev-research/09-wrapper-build-plan.md`.

## Z-Code subagents — the cheap in-session seats

Mechanism (verified [09-15], unchanged): `~/.zcode/agents/*.md` frontmatter
`model: <providerId>/<modelId>[$<reasoningLevel>]` (e.g. `builtin:zai-coding-plan/GLM-5.3-Flash$high`
— an explicit `$level` is REQUIRED for flash models). No `~/.claude/agents/` fallback. Subagent
turns cost ~5.5–7k input vs the parent's ~31.5k. ZCode normalizes the `model:` line to
`account:…` on disk — both forms accepted; don't "fix" it back.

The lane-fleet seats (`lane-flash`, `lane-workhorse`, `lane-codex`) were retired 2026-09-17 with the
fleet. Re-author seats on demand; whether a `model: opencodex/<routed-id>` line works through the
managed provider is **unverified** — test with `prove-served-model.sh --lane zcode --agent <seat>`
before relying on it.

## Cross-harness wiring (ocx era)

| From | Cross-provider via | Notes |
|---|---|---|
| Claude Code (CLI/App) | `ocx claude` (env-scoped) or injected `ocx-*.md` roster agents | keychain OAuth preserved; native claude-* passthrough |
| Codex App / `codex exec` | ocx-injected routing; `-m "<provider>/<model>"` | App picker may need app-server restart after `ocx sync` |
| Z-Code desktop | `OpenCodex` provider in the model picker | needs ZCode restart after enable |
| Z-Code headless | shell out to `ocx claude -p` / `codex exec` from Bash | no model flag exists in zcode.cjs |
| Anything else | `ANTHROPIC_BASE_URL=http://127.0.0.1:10100` (per-process) or `http://127.0.0.1:10100/v1` openai-style | prefer launchers over shared-shell env exports |

## Pointers

- Master skills index — 106 curated skills, reference-only, `when`/`tags`/cost per entry:
  `C:/Projects/skills-master/` (contract, inventory, and rationale in
  `C:/vaults/markimus-SecondBrain/06-AI-Agents/skills-master-index.md`)
- Install/verification record + per-surface evidence: `C:/vaults/markimus-SecondBrain/04-Projects/cross-harness-orchestration/` (plan.md §1 ocx audit; phase-0-verification.md appendices)
- Adoption decision + superseded rulings: `C:/vaults/markimus-SecondBrain/09-Decisions/decision-log.md` (2026-09-17 entry)
- Canonical fleet note (tombstoned, lessons kept): `C:/vaults/markimus-SecondBrain/06-AI-Agents/lane-fleet.md`
- Fleet history and the Flash lesson in full: `06-AI-Agents/lane-fleet-handoff-2026-09-14.md` (historical)
- ZCode CLI mechanics: `06-AI-Agents/zcode-cli-headless.md`
- Quarantined lane-fleet files (7-day soak, then purge): `C:\tmp\ocx-t4a\quarantine\20260917-ocx-migration\`
- opencodex audited source clone: `C:\tmp\opencodex-research` (1cc89cf = 2.55.0; do NOT `ocx update` past the pin)
