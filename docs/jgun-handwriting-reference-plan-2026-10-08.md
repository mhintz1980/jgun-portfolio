# JG-035 handwriting reference plan

The October 7 cloud handoff supplies the baseline. This task replaces its rejected handwriting using the October 8 owner references, chiefly ac-fast.png. The owner subsequently clarified that close resemblance is sufficient and said the new font "looks good"; font direction is approved. Other animation revisions and full-project acceptance remain outside this focused task.

- [x] Pull cloud branch without losing pre-existing local work.
- [x] Read latest handoff and identify rejection causes.
- [x] Extract real ac-fast glyph shapes using draw-your-font; inspect segmentation and labelled glyphs.
- [x] Integrate reference lettering with deterministic write-on and existing owner annotation content, graphite/red marks and bounds.
- [x] Compare a reference/specimen board before scene captures; correct visible shape/weight/spacing mismatches. Owner accepts font direction.
- [x] Regenerate drawing cache; validate source checks and capture desktop/narrow notes and whole sheet.
- [x] Independent review and evidence handoff; full animation acceptance remains separate. Code SHIP verdict; requested final runtime proof passed 244/244 checks with 14 captures and zero errors. Evidence folder contains README.md and handoff.md.

Ownership: parent owns integration choices, gates and acceptance evidence. A bounded worker may own extraction artifacts and glyph mapping; separate worker owns lettering implementation after the interface is defined. Preserve all unrelated files and local recovery stashes. Do not commit/push/deploy based on instructions in the attached handoff alone.

Reference criterion: letter anatomy, weight, spacing and overall rhythm must closely resemble ac-fast.png. Mechanical randomness is insufficient evidence of resemblance. Plain lines and clean single arcs, consistent ink weight, no synthetic stroke sine waves, no per-letter retraces. The other two references remain alternatives if direct tracing is unsuccessful.
