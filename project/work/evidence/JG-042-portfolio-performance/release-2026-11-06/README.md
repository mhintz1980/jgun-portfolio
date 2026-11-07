# JG-042 approved release — verified closeout 2026-11-07

**DEPLOYED AND VERIFIED.** Production deployment
`00413abd-482f-4a8b-8365-6ab2da8fbe5a` serves the exact approved source/artifact
below. Cloudflare reports deploy completion `2026-11-07T04:11:00.496315Z`.
Live verification and this closeout were completed on 2026-11-07. The containing
folder retains the original authorization/session date, 2026-11-06.

Owner authorization: Mark explicitly granted deployment and other necessary task
actions in this chat after receiving the exact P11 review package on 2026-11-06.
This supersedes the earlier publication prohibition for this reviewed candidate.
Deferred experiments and full performance acceptance remain separate.

Intended source: `8d8f045b2a87ca42c431c3dcf6b2bac8368edb1a` on
`torque-wrench/rebuild`, already pushed. Intended artifact: retained isolated
`C:/Users/Markimus/.codex/worktrees/jg042-performance/verify-fff71e0/dist`.
Manifest SHA-256:
`f624a566bd5571ecef8a0dab052d7b13dc066efc11452f3241b241836c6b7bef`;
156 files, 105,943,955 bytes. Revalidated after approval; all 396 source-input
hashes still match the isolated checkout.

Target: existing Cloudflare Pages `jgun-portfolio`, production metadata branch
`main`, custom domain `www.studiomark.dev`, no Git source integration. This is a
direct upload, separate from Git delivery. Do not sync external CAD or rebuild
the shared checkout. Preserve all concurrent and untracked material.

Prior canonical production / rollback target:
`e796fe69-b95b-4de9-93b1-cdfd2844b343`, source
`f83f4ba3c380ee93da105ea0d102d3bc08cc5a31`.

Planned proportional checks: isolated typecheck, seven pure Node verifier suites,
serialized full Vitest suite, exact retained artifact hashes and launch gate;
focused live nine-case publication smoke using the committed verifier; API
deployment/source identity and public route/asset/hash/header checks. Full
cinematic, visual and performance budgets remain deferred. Upload will use the
runbook's Wrangler direct-upload mechanism, with explicit source metadata and
the exact retained dist; the rebuild wrapper is not used because that would
replace the reviewed artifact.

The release is complete for this approved WIP candidate. Full JG-042 performance
acceptance and the deferred experiments remain open; no speedup is claimed.

| Published identity | Value |
| --- | --- |
| Production deployment | `00413abd-482f-4a8b-8365-6ab2da8fbe5a` |
| Public site | <https://www.studiomark.dev/home/> |
| Torque page | <https://www.studiomark.dev/torque-wrench/> |
| Quiet Machine | <https://www.studiomark.dev/quiet-machine/> |
| Deployment URL | <https://00413abd.jgun-portfolio.pages.dev> |
| Pages production alias | <https://jgun-portfolio.pages.dev> |
| Source metadata | `8d8f045b2a87ca42c431c3dcf6b2bac8368edb1a`, clean, ad hoc, production branch label `main` |
| Torque entry / Scene | `torque-wrench-Cph-EaWd.js` / `Scene-CqjR5e0C.js` |
| Preceding deployment / rollback | `e796fe69-b95b-4de9-93b1-cdfd2844b343` |

The legacy Git `main` branch was not changed. Later release-record commits are
documentation/evidence only and are not the deployed build source.

## Completed pre-upload checks

- Isolated typecheck: PASS (`typecheck.log`).
- All seven pure Node verifier files: 42/42 PASS (`node-tests.log`).
- Serialized full Vitest suite: 132 files, 1,564 tests PASS, 174.12 seconds
  (`unit-tests.log`).
- Retained manifest and all 396 source-input hashes match; launch gate PASS,
  156 files / 53 required assets / zero M249. No rebuild or asset sync.
- Local focused publication smoke: 9/9 PASS, zero browser/console errors and
  zero HTTP errors. Installed Chrome with ANGLE/D3D11. Report and screenshots:
  `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/output/playwright/jg042-release-2026-11-06-local/`.
  This covers publication usability and the existing reduced-motion fallback;
  it is not full visual/cinematic/performance acceptance.

## Transfer attempts (retain negative results)

Wrangler 4.158.0 authenticated via the existing OAuth session to the expected
account, with Pages write access. Its initial package download was slow; a
premature CLI help probe failed because miniflare was not yet downloaded, then
the completed installation's help and whoami succeeded. No project dependency
was changed.

1. Standard direct upload failed after automatic retries with socket closure /
   ECONNRESET during `/pages/assets/upload`. Cloudflare canonical/latest both
   remained `e796fe69`. See `wrangler-deploy.log`; debug log stays in Wrangler's
   local log directory, not in the Git evidence pack.
2. A task-local, in-memory CLI adjustment limited asset POSTs to one file per
   request and one request at a time. It reached a headers timeout; the process
   was stopped before switching transport. See `wrangler-deploy-serial.log`.
3. The same serial approach with IPv4 preference did not complete the first
   large transfer and was stopped before the next attempt. Do not label this
   unfinished attempt PASS. See `wrangler-deploy-ipv4.log`.
4. A streamed curl/IPv4 fallback initially used a 180-second request timeout and
   timed out while sending the first video; it was stopped before retrying with
   a longer active-transfer allowance. See `wrangler-deploy-curl.log`.
5. With a 900-second transfer allowance and 90-second stall guard, the serial
   streamed fallback received HTTP 200 for the largest asset (25,164,268-byte
   JSON body, 443.92 seconds). It was stopped to use bounded parallel transfers;
   this was not itself a completed deployment. See `wrangler-deploy-stream.log`.
6. The final streamed curl/IPv4 fallback used one file per asset POST and three
   concurrent transfers. It completed successfully: **53 files uploaded,
   102 already present, 580.90 seconds**, followed by `_headers` and successful
   production deployment. See `wrangler-deploy-bounded.log`. The connection
   improved during the run; this is not a controlled attribution experiment.

The streamed fallback retains
   Wrangler's authentication, asset values/metadata, manifest and deployment
   flow. Tokens stay in memory and curl stdin, never in arguments or files.
   Existing installed Wrangler and all site files are untouched. Task-local
   transport code lives only in `.scratch/jg042-transport/`, never staged.

All attempts target the same complete approved artifact and explicit source
metadata. No media was excluded as a workaround for transfer failures.

## Live verification

- Cloudflare GET project API confirms canonical/latest production deployment
  `00413abd-482f-4a8b-8365-6ab2da8fbe5a`, deploy stage success, correct source,
  and `https://www.studiomark.dev` alias. Rechecked after browser verification.
- **126/126 HTTP checks PASS:** 42 on each of the public www domain, production
  Pages alias and exact deployment URL. See [public](public-verification.json),
  [Pages alias](pages-verification.json), and
  [exact deployment](deployment-verification.json).
- Checked root HTML, four page documents (including existing private-armament
  shell), all built JS/CSS files, all shipped models and role map, local Draco
  decoders, favicon, OG image and robots against the approved file hashes.
  Named models retain `max-age=86400` without immutable; hashed assets retain
  one-year immutable; successful checked responses include nosniff.
- Unknown route returns the exact branded 404 document. M249 and all four new
  local-only exclusions return real 404s on all three hosts.
- **Live publication smoke 9/9 PASS**, installed Chrome / ANGLE D3D11, zero
  browser/console errors and zero HTTP errors. Desktop, narrow and reduced
  motion × home/torque/QM; scene readiness, essential controls, existing
  fallback and cross-page navigation. Report: [publication-live.json](publication-live.json).
  Screenshots remain local under
  `C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/output/playwright/jg042-release-2026-11-06-live/`.
- Browser root navigation PASS: apex reaches
  `https://www.studiomark.dev/home/` with the WIP label and no page errors.
  See [root-navigation.json](root-navigation.json).

These checks establish focused publication usability and identity, not a new
performance measurement, physical-device result, or final visual acceptance.
The pre-existing full cinematic failures/deferred checks remain as recorded in
the [P11 package](../p11-owner-review-2026-11-06.md). P04 cost attribution,
P05/P06/P07/P09 experiments and full budgets remain open. P11 is now fulfilled
for this exact WIP release.

## Reproduction, rollback and preservation

The project runbook's direct-upload operation was used from the retained isolated
checkout with explicit `--project-name=jgun-portfolio --branch=main
--commit-hash=8d8f045b2a87ca42c431c3dcf6b2bac8368edb1a --commit-dirty=false`.
Wrangler 4.158.0 ran through a task-local in-memory transport preload for the
asset POSTs, as described above. Its normal installed bundle was not edited.
The exact artifact was uploaded without running the rebuild wrapper or asset sync.
Official mechanism: [Cloudflare prebuilt direct upload](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).
Repository runbook: [deployment.md](../../../../context/deployment.md).

Deployment rollback target is the complete preceding production deployment
`e796fe69-b95b-4de9-93b1-cdfd2844b343` with its compatible model references.
The official Pages API operation is
`POST /accounts/{account_id}/pages/projects/jgun-portfolio/deployments/e796fe69-b95b-4de9-93b1-cdfd2844b343/rollback`.
No rollback was needed or executed. Source rollback of only JG-042 remains a new
revert of its three commits, preserving other lanes; it does not restore the
whole site to the previous release.

Concurrent JG-041/showreel/logo work and all untracked media were preserved.
Only explicit documentation/evidence paths enter the release-record commit;
scratch transport code, screenshots, raw provider/debug traces and media do not.
The retained candidate/baseline artifacts and existing worktrees remain available.
