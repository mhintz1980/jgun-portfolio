**Verdict: genuine harness fault repaired; one retained failure is a machine limitation, not an app regression.**

The opening verifier was the only production verifier launching headed Chrome. Windows presentation throttling of that headed window tripped the app's one-way quality ratchet (full→lite→poster, canvas unmount) with zero errors, shader failures, or context losses. I changed only the launcher to `headless: true`, matching the passing shaft/manufacturing/ring contract (same `channel:'chrome'`, `--use-angle=d3d11`, background flags, DPR 1, viewports, thresholds, ladder untouched). Syntax check exit 0; app sources and dist chunks hash-identical before/after.

Full six-case roster on the same `:4173` build (exit 1, 5/6 PASS): narrow, desktop-reduced, narrow-reduced, desktop-lite, narrow-lite all pass with 0 failures — the headed run's canvas deaths, forced-lite timeouts, and "reverse mismatches" are gone; reverse now truly compares (43/43 exact-zero deltas, fragments compared at 9 points).

Desktop retains 110 failures, every one "expected full tier, got lite": at DPR 1 the staircase is a single step, so the ~21–25 s cold-load bake forces one decline to lite (declines=1 stable, never poster, canvas live throughout). Narrow holds full. This matches the parent's own "desktop effective lite" production observation — a machine-capability limit vs the full-tier gate, preserved unweakened for owner decision.

Evidence packet: `project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/runtime/opening-triage-glm/` (report.md, pre-edit snapshot, quick trial + full-roster dirs, hashes, commands/exits).

**GPU released:** both runs closed via `browser.close()`; no Playwright/headless chrome processes remain (17 chrome.exe are the user's pre-existing desktop Chrome, untouched). No stage/commit/push.

