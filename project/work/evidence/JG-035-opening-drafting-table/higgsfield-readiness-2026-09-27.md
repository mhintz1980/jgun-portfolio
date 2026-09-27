# Higgsfield readiness — 2026-09-27

Bounded research/prep for the expiring Higgsfield credits (JG-035 context). No generation
requests were submitted, no assets uploaded, no money spent, no OpenMontage files modified,
no credential values read or printed (names only).

Sources: `C:/Projects/OpenMontage` (AGENT_GUIDE.md, PROJECT_CONTEXT.md,
`tools/video/higgsfield_video.py`, `docs/PROVIDERS.md`, `docs/ARCHITECTURE.md`) and the
live official docs at `https://docs.higgsfield.ai` (fetched 2026-09-27, including
`/docs/llms.txt`, `/docs/openapi.json` v2.0.0, quickstart, authentication, file-uploads,
polling, billing-and-retention, rate-limits pages).

## 1. Bottom line

The OpenMontage wrapper is **not usable as-is** against the live API: its auth scheme,
domain, endpoints, and model IDs do not match the current documented contract. The live API
itself is simple (one auth header, per-model POST endpoints, poll `/requests/{id}/status`,
a presigned-upload flow, an `/estimate/` mirror documented for model paths). The only hard
blocker found is that **no Higgsfield credentials were found under any checked name or
location** (§4; machine-wide absence is not claimable) — keys must be created/fetched from
`console.higgsfield.ai` before anything fires.

## 2. Live API contract (OBSERVED from official docs, 2026-09-27)

- Base URL: `https://api.higgsfield.ai`
- Auth: single header — `Authorization: Key {api_key_id}:{api_key_secret}`.
  (No Bearer token, no X-API-Secret header — both of those appear only in the OpenMontage
  wrapper.)
- Docs: `https://docs.higgsfield.ai`; console (model discovery + keys + limits):
  `https://console.higgsfield.ai`.
- Docs' own priority rule: **the console is the authoritative model catalog**;
  `openapi.json` is "supplementary reference… a model's absence from that file does not
  establish that it is unavailable."

### Endpoints in openapi.json v2.0.0 (observed; exact request schemas)

| Endpoint (POST unless noted) | Type | Key params (observed schema) |
|---|---|---|
| `/higgsfield-ai/soul/standard` | image | `prompt`*; `num_images` (def 1); `resolution` enum `2K`/`4K` (def `2K`); `aspect_ratio` enum `1:1,4:3,3:4,3:2,2:3,5:4,4:5,16:9,9:16,21:9` (def `4:3`) |
| `/higgsfield-ai/soul/v2/standard` | image | used by the official quickstart; same family |
| `/kling-video/v2.5-turbo/pro/text-to-video` | video T2V | `prompt`*; `duration` enum **5 or 10 s** (def 5); `cfg_scale` (def 0.5); `negative_prompt` (def "") |
| `/kling-video/v2.5-turbo/pro/image-to-video` | video I2V | same + `image_url`* (public HTTPS URL — see §4) |
| `/kling-video/v2.5-turbo/standard/image-to-video` | video I2V | same as pro I2V |
| `/minimax/hailuo-2.3/standard/text-to-video` | video T2V | `prompt`*; `duration` enum **6 or 10 s** (def 6); `prompt_optimizer` (def true) |
| `/minimax/hailuo-2.3/standard/image-to-video` | video I2V | same + `image_url` |
| `GET /requests/{request_id}/status` | poll | — |
| `POST /requests/{request_id}/cancel` | cancel | — |

Statuses (observed enum): `queued`, `in_progress`, `nsfw`, `failed`, `completed`,
`canceled`. Status response carries `request_id`, `status_url`, `cancel_url`, and outputs
(`images[].url` on the image example; treat video outputs the same until confirmed).

Practical limits (observed absence): the Kling/Hailuo video schemas expose **no
resolution or aspect-ratio parameter** — output geometry is whatever the endpoint
defaults to. Durations are exactly 5/10 s (Kling) or 6/10 s (Hailuo). More video models
(e.g. Sora/Veo/Seedance generations) may exist in the console catalog — **unverified**,
needs console login (§6).

### Uploads (image-to-video input)

`image_to_video` takes `image_url` — a **public HTTPS URL**, same limitation the handoff
flagged. Official alternative (observed): presigned upload —

1. `POST /files/generate-upload-url` with `{"content_type":"image/jpeg"}` →
   `{public_url, upload_url, upload_headers{Content-Type, x-amz-tagging}}`
2. `PUT` the raw file to `upload_url` with **every** returned header.
3. Use the returned `public_url` as `image_url`.

Accepted content types (observed): `image/jpeg|jpg|png|webp|gif`, `audio/wav|x-wav`,
`video/mp4`.

### Polling / webhooks

Poll `status_url` from 2 s intervals growing to 10 s, with jitter; stop on the four
terminal states; webhooks exist (`/docs/how-to/webhooks`) for long-running work.

## 3. OpenMontage wrapper vs live API (OBSERVED mismatches)

`tools/video/higgsfield_video.py` (EXPERIMENTAL, v0.1.0):

| Wrapper does | Live docs say |
|---|---|
| `Authorization: Bearer {key}` + `X-API-Secret: {secret}` | `Authorization: Key {id}:{secret}` only |
| `POST https://platform.higgsfield.ai/v1/generations` (single endpoint) | `POST https://api.higgsfield.ai/{model-path}` (per-model paths) |
| model IDs `seedance_2.0`, `seedance_2.0_fast`, `kling_3.0`, `veo_3.1`, `sora_2`, `wan_2.5`, `soul_cinema` | none of these strings appear in the live openapi.json; documented video IDs are `kling-video/v2.5-turbo/*` and `minimax/hailuo-2.3/*` path-form (console may expose more — unverified) |
| `task: text-to-video` field, `duration` 5/10/15, `aspect_ratio` | no `task` field; durations 5/10 (Kling) or 6/10 (Hailuo); no aspect_ratio param on video endpoints |
| polls `status_url`, looks for `Completed`/`COMPLETED` | statuses are lowercase (`completed`) — wrapper happens to also match lowercase, so polling logic would survive, but the URL it derives (`platform.higgsfield.ai/v1/generations/{id}`) is the wrong host/path |
| no upload flow (URL only) | presigned upload flow exists |

`docs/PROVIDERS.md` itself flags Higgsfield as **not refreshed** ("public API documentation
did not expose a current, stable contract… at the time of this update"). Conclusion: the
wrapper is **incompatible with the documented live contract** — auth header format, host
and request paths differ, and its model IDs appear in none of the documented openapi paths
(the console catalog is the authority and was not checked). No live call was made, so
actual endpoint responses are unproven; this is a contract mismatch, not a demonstrated
failure.

The wrapper's `estimate_cost()` numbers ($0.50–$1.20 per 5 s Seedance clip, etc.) are
in-code approximations tied to model IDs not present in the documented contract —
**not authoritative**.

## 4. Credentials (checked names/locations — none found; machine-wide absence not claimable)

- Process env: `HIGGSFIELD_API_KEY`, `HIGGSFIELD_API_SECRET`, `HIGGSFIELD_KEY`,
  `HIGGSFIELD_BASE_URL` — all unset; no env var containing "higgs" at all.
- `HKCU\Environment` registry (persistent user env): no Higgsfield entries.
- `.env` / `.env.local` in OpenMontage, jgun-portfolio, `~` — files absent.
- `~/.bashrc`, `~/.bash_profile`, PowerShell profiles — no Higgsfield variables.

Locations not checked: other credential stores (e.g. Windows Credential Manager, vaults,
browser-stored console sessions), so absence everywhere on the machine is not established —
only absence in the enumerated places.

Official credential source (observed in docs): create at `console.higgsfield.ai`
(PROVIDERS.md points at `cloud.higgsfield.ai/api-keys`, which the current docs supersede
with the console). Docs' curl examples name the pair `HF_API_KEY_ID` /
`HF_API_KEY_SECRET` — example names, not API requirements. Suggested local names when
setting up: `HF_API_KEY_ID` / `HF_API_KEY_SECRET` (docs-native) — the OpenMontage names
only matter if the wrapper is ever fixed.

**Blocker 1: credentials must be obtained from the console by Mark before any call,
including the free `/estimate/` ones.**

## 5. Credits / cost querying (as documented)

- Charges: successful requests only, in account credits. `failed`/`nsfw` requests are not
  charged; reserved credits are refunded automatically (observed in billing docs).
- Cost preview: **`POST https://api.higgsfield.ai/estimate/{model-path}`** with the same
  body as the generation call, same auth — e.g.
  `POST /estimate/kling-video/v2.5-turbo/pro/text-to-video` (an observed path). (Docs
  example shows the Soul image path; the pattern is documented as applying per model.)
- Remaining balance: **no public balance API endpoint observed** (not in openapi.json, not
  in billing docs). Balance and per-account rate limits live in the console UI.
- Expiry: credits expire **one year after being added** (observed). The "~2 days"
  deadline is from handoff 2026-09-26c (ASSUMED — treat as owner-stated, not verified
  against the account).

## 6. Ready invocation path (once credentials exist)

Do NOT go through `tools/video/higgsfield_video.py` (broken contract, §3) and do not
modify OpenMontage (out of scope by task rule). A ~40-line standalone script in this
repo's evidence dir (or `project/work/scratch/`) is enough:

1. In `console.higgsfield.ai`: confirm the video models actually on the account (catalog
   is console-authoritative), grab key id + secret, note remaining credits.
2. `export HF_API_KEY_ID=… HF_API_KEY_SECRET=…` in the firing shell only.
3. Dry cost: `POST /estimate/kling-video/v2.5-turbo/pro/text-to-video` with the
   prompt + duration; sanity-check against console balance. (Pro T2V is an observed path;
   a `standard/text-to-video` variant may exist — confirm in the console before use.)
4. Fire: `POST /kling-video/v2.5-turbo/pro/text-to-video`
   `{"prompt": "...", "duration": 10}` → capture `request_id` + `status_url`.
5. Poll `status_url` at 2→10 s with jitter until terminal; on `completed`, download the
   output URL **immediately** (outputs retained ≥ 7 days only — observed).
6. Stash raw outputs outside `public/` (e.g.
   `project/work/evidence/JG-035-opening-drafting-table/higgsfield-assets-2026-09-XX/`),
   with prompts + request IDs recorded next to the files; Astra ruling before any use.

## 7. Blockers (all observed unless marked)

1. **No credentials found** under any checked name/location (§4; machine-wide absence
   not established).
2. **OpenMontage wrapper incompatible** with live auth/domain/paths/model IDs (§3).
3. **No balance API** — remaining credit can only be read in the console (or inferred:
   run `/estimate/` per planned request and subtract manually).
4. **Console catalog unverifiable without login** — whether Sora/Veo/Seedance-class video
   models are exposed beyond the Kling 2.5 Turbo / Hailuo 2.3 / Soul paths in openapi.json
   is unknown (docs explicitly say openapi absence ≠ unavailability).
5. Video endpoints expose **no aspect-ratio/resolution params** — if 16:9-ish framing
   matters for the backdrop rig, it must be prompted for and/or cropped in post
   (`tools/video/video_trimmer.py` / FFmpeg in OpenMontage can be used read-only as a
   local utility without touching its repo state).

## 8. Proposed atmosphere-only assets (no generated product geometry)

All text-to-video (simplest contract; no seed renders exist yet, and I2V would add the
upload hop). Model: `kling-video/v2.5-turbo/pro/text-to-video` (observed path), duration
10 s (longest documented; loop/trim in post). Negative prompt (where supported): any
weapon, any tool, any brand. Every clip still requires an Astra ruling before use; raw
files stashed outside `public/` per handoff guardrails. Full prompts live in
`higgsfield-asset-manifest-2026-09-27.json` next to this report.

1. **RL300 acoustic lab (Station 2 backdrop)** — large anechoic test chamber interior,
   foam wedges receding into soft haze, a single overhead diffused light slowly breathing,
   no equipment in frame, locked-off wide shot, slow ambient dust drift, muted
   blue-grey palette, 16:9 framing. Loop-friendly (near-static motion).
2. **Precision workshop (post-opening backdrop, p > 0.12)** — empty machine-shop bench
   island in raking lamp light, fine dust motes drifting through a light shaft, shallow
   depth, no tools or parts recognizable, warm-neutral palette, very slow lateral drift.
   Low-contrast by design so exploded-view stations stay legible over it.
3. **M249 neutral engineering lab (Station 3 establishing plate)** — clean metrology /
   engineering test laboratory: granite surface plate, instrument racks out of focus,
   cool even lighting, slow push-in down the aisle, explicitly no weapons, no machinery
   parts, no logos; neutral institutional palette. Carries the section while the 3D build
   catches up without depicting the product.

Each: record prompt, model path, duration, `request_id`, and file hash in a sidecar next
to the stash. Poster/reduced-motion stills can be lifted as frames (upscale via
`tools/enhancement/upscale.py` as a local utility if desired).

## 9. Observed vs assumed

- **Observed:** live base URL, auth header format, all endpoints/params/durations/status
  enums in §2; upload flow; estimate-endpoint pattern; 1-year credit expiry; 7-day output
  retention; refund-on-failure; polling guidance; absence of balance API; wrapper-vs-docs
  contract mismatches in §3; credential absence in the checked env/registry/dotfile
  locations only (§4).
- **Assumed / unverified:** the "~2 days" credit deadline (owner statement in handoff
  2026-09-26c); the existence of additional video models beyond the openapi paths
  (console-gated); whether a `standard/text-to-video` Kling variant exists (only pro T2V
  and standard I2V are in the observed table); actual per-request credit costs (needs
  `/estimate/` + credentials); video output URL field name (image example shows
  `images[].url`; video analogue expected but not executed); actual endpoint responses to
  the OpenMontage wrapper (no live call was made).
