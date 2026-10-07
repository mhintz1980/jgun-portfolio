---
name: asset-and-bundle-hygiene
description: Audit Vite chunk splitting, Draco decoder paths, missing static assets (favicon), stale git worktrees, and hosting readiness.
---

# Asset, Bundle & Worktree Hygiene

## Pre-Flight Audit Checklist

Before concluding any refactor or feature branch, execute the following audit:

### 1. Code-Splitting Verification
- Ensure the initial HTML/DOM bundle contains only the fast entry point (`App.tsx`, `Chapters.tsx`, HUD CSS, `StaticPoster`).
- Heavy dependencies (`three`, `@react-three/fiber`, `@react-three/drei`, `gsap`, `lenis`) must be isolated in the lazy-loaded canvas chunk.
- Verify that `StaticPoster` does **not** import Three.js.

### 2. Static Asset Integrity
- **Favicon**: Verify `favicon.svg` exists in `/public` to prevent 404 console errors.
- **Draco Decoders**: Ensure Draco WASM decoders (`draco_decoder.wasm`, `draco_wasm_wrapper.js`) are served locally from `/public/draco/` and configured via `useGLTF.setDecoderPath('/draco/')` rather than fetching from unpinned remote CDNs.
- **GLB Pathing**: Verify GLB URL handles base-path routing correctly for deployment (e.g. GitHub Pages `/repo-name/` base path).

### 3. Worktree & Git Hygiene
- Scan for spent worktrees (e.g., `jgun-portfolio-perf`) and prune them:
  ```bash
  git worktree list
  git worktree remove <path> --force
  git worktree prune
  ```

### 4. Build Smoke Test
- Run `npm run build` or `vite build` and verify:
  1. No circular dependency warnings.
  2. No missing CSS assets or broken font URLs.
  3. Initial entry chunk ≤ ~75 kB **gzipped** — raw-byte ceilings are
     React-blind (react-dom alone floors the entry at ~208 kB raw /
     ~67 kB gz). Judge gzip figures, and confirm no heavy-lib leakage
     per check 1 (no `three`/`@react-three/*`/`gsap`/`lenis` in the
     entry chunk; no `modulepreload` link for the canvas chunk in
     `dist/index.html`).