# Port deviation: 5203 → 5205 (2026-10-09 execution)

The RUN-PACKET specifies a fresh Vite dev server at `http://localhost:5203`.
That port is currently held by an orphaned preview server that this session
cannot safely terminate, so the final-native run uses `http://localhost:5205`
instead. Everything else in the packet is unchanged.

## Evidence that 5203 is an orphaned stills preview, not usable for this run

- `GET http://localhost:5203/` (IPv6 `::1` only; `127.0.0.1` refuses) returns
  the SPA index and serves `assets/index-BP95EhKL.js` (1,147,162 bytes) — the
  exact stills functional build recorded in the 2026-10-08 handoff.
- `/src/main.tsx` and every other module path returns the 2116-byte SPA index
  fallback, not a dev transform — same failure mode as the quarantined
  `invalid-preview-capture-2026-10-08T23-16Z/` hashes.
- `npx vite --port 5203 --strictPort` fails with `Error: Port 5203 is already
  in use` (log retained in session records).
- No owning process is visible: `netstat -ano` shows only TIME_WAIT rows,
  `Get-NetTCPConnection -LocalPort 5203` returns nothing, `netsh interface
  portproxy show all` is empty, WSL is fully stopped, no docker/podman.
  **Correction (same day, post-run):** a full `Win32_Process` command-line
  census later identified the holder as PID 301500 — a plain
  `vite preview --host localhost --port 5203 --strictPort` orphan from the
  2026-10-08 session (binds IPv6 `::1` only via `--host localhost`), not a
  sandbox forward; the netstat/Get-NetTCPConnection misses were a local
  tooling artifact. The disposition is unchanged: yesterday's orphaned
  servers/worktrees await the owner's cleanup word, so the port moves rather
  than the process dying. Other orphans mapped in the same census: 5199 dev
  (82396), 5198 ccr-review (252172), 5200/5201 (312252/146780), 5202
  hotspot-demo (310016), 5204 diagnostic preview (171428/139364), idle 4174
  leftover (69456).

Killing Codex runtime daemons would touch shared cross-agent infrastructure
for a port number, so the run moves to 5205 rather than freeing 5203.
The stills work that preview served is complete (16 WEBP candidates +
92/92 fallbacks per layout recorded 2026-10-08); nothing depends on it live.

## Run parameters actually used

- Dev server: `npx vite --port 5205 --strictPort` from the repo root
  (`C:\Projects\jgun-portfolio` = junction to
  `C:\Users\Markimus\.buzz\REPOS\jgun-portfolio`), started 2026-10-09.
- Hash-capture base: `http://localhost:5205`; target list, output filenames,
  and `served-hashes.txt` format identical to RUN-PACKET §1.
- Verifier: `node scripts/verify-jg036-hotspot-layering.mjs
  --url=http://localhost:5205 --label=final-native --out=<this directory>`.
- Verifier SHA-256 precondition re-checked before the run:
  `95A73C1418158D9AE530A98FA8B88382D042FE3D3F255BAE763FFEF0F234B314` — match.
