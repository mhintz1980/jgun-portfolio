# Static verification — 2026-10-01

Parent reran these commands from `C:/Users/Markimus/.buzz/REPOS/jgun-portfolio` against the existing pacing rebalance:

| Command | Result |
| --- | --- |
| `npm run typecheck` | Exit 0 |
| `npm test` | Exit 0; 159 tests / 15 files passed |
| `node scripts/check-b1b2-contract.mjs` | Exit 0; 26 passed / 0 failed |
| `npm run check:station2` | Exit 0; 2,671,600 bytes, 7 roots, 7 CAD anchors |
| `npm run build` | Exit 0; existing >500 kB chunk advisory |

After the DOM track alignment repair, the parent reran typecheck, all **169 tests / 16 files**, drawing contract **26/26**, and production build: every command exited 0. The station contract also passed in the worker's repair checks; its underlying asset and code were unchanged.

Production preview was restarted after each build on `http://localhost:4173` before browser verification. These static results do not establish browser, pixel, motion or owner acceptance.

Graph coverage metadata was older than the changed source; relied-on files were read directly. Graph discovery was treated as provisional.
