# Corrected stills candidate packet — 2026-10-09

## Result

- Drawing/font proof: desktop and narrow both **verified**. Report: `drawing-final/report.json`.
- Corrected shaft capture: **normal quality** (no quality lock), desktop/narrow both pass, 20/20 source PNGs, every frame passes the non-background gate. Report: `shaft-capture-corrected-normal/capture-report.json`.
- Candidate encoder: **16/16 WEBPs**, desktop 960x600 and narrow 600x600, quality 90. Manifest: `shaft-raster-manifest-corrected.json` (SHA-256 `eab830c784a40ce52c48fff9039dcc0b8269ebdb2422e413e10efc059f3b32fe`).
- Item2 title/tablet: **6/6** quality-lock visual-only frames at .065/.08/.10. Report: `revision-title-tablet/capture-report-opening.json`.
- Item2 shaft artifact neighbors: **9/9** quality-lock visual-only frames around 1.3, 10.9, and 25.4 s. Report: `revision-shaft-artifact-neighbors/capture-report-shaft.json`.
- Reduced fallback: desktop-reduced **PASS**, narrow-reduced **PASS**, 92/92 checks each and zero failures. Reports are under `fallback-desktop-reduced/` and `fallback-narrow-reduced/`.

## Review boundaries

- Candidate WEBPs are evidence-local under `candidate-public-corrected/inspection/shaft/`; no public asset has been changed.
- The earlier normal/quality-lock captures in `shaft-capture-final/` and `shaft-capture-final-quality-lock/` are preserved as compositor failure evidence and are not candidates.
- Item2 captures are visual-only quality-lock evidence. The residual relief geometry remains an owner decision; no geometry was changed.
- Corrected capture served-index provenance: SHA-256 `4f4760339953f14c0368d1f8572fd71ad1e1fdd95f644c7c912b63a77202425b`.

