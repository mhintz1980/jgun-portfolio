---
id: JG-019
title: Deployment readiness and studiomark.dev hosting
status: queued
created: 2026-08-26
owner: unassigned
todo: TODO.md#queued
depends_on:
  - JG-014
source:
  - ../../context/constraints.md
  - ../../context/agent-skills.md
skills:
  - asset-and-bundle-hygiene
  - webgl-telemetry-verifier
implementation_scope:
  - deployment configuration
  - DNS / hosting configuration
  - index.html
  - public assets
acceptance:
  - Production build, domain, metadata, fallback, and telemetry parity are verified.
  - No credentials are committed.
  - Production behavior is tested on full, medium, poster, and reduced-motion paths.
verification: null
commits: []
---

# JG-019 — Deployment Readiness and studiomark.dev Hosting

## Outcome

Publish a verified JGUN portfolio on `studiomark.dev` only after the live project has an intentional full, medium, poster, and reduced-motion experience.

## Implementation Steps

1. Select a hosting approach compatible with the Vite static build and the target domain.
2. Configure domain DNS, HTTPS, canonical URL, cache policy, 404 behavior, social metadata, and a privacy-appropriate analytics policy.
3. Audit GLB, Draco decoder, texture, and static-asset paths against the production base URL.
4. Confirm a production deployment reproduces the intended runtime telemetry behavior and does not rely on a stale local preview.

## Acceptance Criteria

- [ ] `npm run build` succeeds from a clean dependency installation.
- [ ] Full, medium, poster, reduced-motion, WebGL-failure, and mobile paths are intentionally handled.
- [ ] Draco, GLB, image, and route requests resolve from the production domain.
- [ ] Domain HTTPS, canonical metadata, social preview, and not-found handling are verified.
- [ ] No secret, credential, `.scratch/`, or protected parallel-session material is committed.

## Verification Record

Create `../evidence/JG-019-deployment-and-hosting-verification.md` before checking off the TODO entry.
