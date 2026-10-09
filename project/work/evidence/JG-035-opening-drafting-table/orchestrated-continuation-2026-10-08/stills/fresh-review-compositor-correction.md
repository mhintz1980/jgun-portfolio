# Fresh review — compositor correction

Date 2026-10-09. CPU source review plus emitted smoke receipts; reviewer ran no
browser. Helper edit + GPU smoke: Chandrasekhar. This supersedes the mistaken
compositing acceptance in fresh-review-pre-capture.md.

## Verdict

**SHIP (source + smoke).** The full 16-capture run may proceed.

## Findings

- Keep-set (stills/capture-final-stills.mjs:212-218): canvas plus every
  ancestor (:213); each FOS overlay plus ancestors (:214) and all descendants
  (:215-218). Since CSS visibility inherits, no kept node can inherit hidden
  from an unkept ancestor, and overlay descendants keep FOS text rendering.
  The hide loop touches only HTMLElements outside the keep-set (:220-223) and
  the finally block restores prior inline visibility (:239).
- Genuine gate (:113-165): full PNG decode (IHDR/IDAT, filters 0-4 including
  Paeth), luminance > 22 matching the encoder mask; zero non-background
  pixels throws. Each shot records nonBackgroundPass plus bounds, pixel
  count, and fraction (:236-243).
- Corrected smoke (shaft-smoke-corrected, normal quality, failures=0):
  desktop pass with 2/2 shots — cutter-exit 8.4 s: 519,527 non-background
  pixels (40.1%); material-attempts 17 s: 344,245 (26.6%) with 2 FOS overlays
  whose text ("Model Name: Input Shaft ... Min FOS = 0.55") is recorded.
  node --check exit 0.

Boundary: the prior empty capture sets remain encoder-refused and are not
relabeled as quality collapse; smoke proves non-empty compositing mechanics
only — no product or visual acceptance from pixels alone.
