# fillfix bbox check (2026-10-12)
`v16-bboxes.json` (this dir) was dumped on 2026-10-11 from the V16 saved 2026-10-10 20:44 (sha256 `788ae2a2a2f784c5...`). The V16 master was re-saved 2026-10-12 10:01 as the fillfix (sha256 `acce2897bf331cc6...`).

`scripts/dump_bboxes.py` was re-run read-only (Blender 5.1.1, `-b`, on a scratch copy) against the fillfix: 614 mesh objects both times, same names, **0 mm max bbox delta, 0 triangle-count differences**. The stored bboxes and `audit.md` are valid for the fillfix master.

Reproduce the audit: `node scripts/audit.mjs <out.md>` (inputs now in the repo: `v16-bboxes.json`, `scripts/load.mjs`, `../../34-v16-assessment/data/v16-objs.json`, `public/models/msp-enclosure.glb`).
