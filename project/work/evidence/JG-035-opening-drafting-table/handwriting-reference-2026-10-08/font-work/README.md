# Ac Fast Reference

36 real screenshot-derived glyphs, traced and assembled by draw-your-font 0.1.0.

- **ac-fast.png:** A–Z and 1, 4, 6, 7.
- **std-natural.png supplemental:** 0, 2, 3, 5, 8.
- **ac-neat.png supplemental:** ? from `HRP?`.
- **Missing:** 9, !, lowercase, and other punctuation. No fabricated replacements.

Outputs: `public/fonts/AcFastReference.ttf` and
`src/scene/drawing/sheet/referenceHandGlyphs.ts` in the repository.
The generated TypeScript exports `REFERENCE_GLYPHS` with only `w` and
`contours`, plus `REFERENCE_PROVENANCE`. Triangles are omitted as requested.
Contours include outer and hole boundaries from the CLI's actual SVG outlines.
Coordinates have x min 0, baseline 0, and cap height 7.5. Width is actual ink
extent; TTF advance includes the CLI's side bearings.

## Reproduce

From the repository root:

```powershell
node scripts/handwriting-reference-extract.cjs
```

The script uses the resolved local vendor CLI at
`C:/Projects/skills-master/vendor/danilo-znamerovszkij-draw-your-font/src/cli.js`
and its installed sharp, svgpath, and opentype.js dependencies. It reads the
stored `crop-labels.json` and frozen screenshots in `sources/`. Original
screenshot paths are retained in provenance; changing those external files
does not change subsequent builds from the frozen copies.

Raster operations only: rectangular crops, explicit neighbor masks,
6× resampling, grayscale threshold 100, and connected-component cleanup.
No SVG outlines are manually authored. CLI segmentation creates the trace
crops; multiple components within one known glyph cell are combined by
cropping their existing pixels. CLI build uses default smoothing and weight -1.
Font timestamps and checksums are normalized after the CLI build for
byte-identical regeneration. Outline geometry is unchanged by that step.

## Inspection and verification

- `alphabet-build/glyphs.png`: labeled complete glyph roster.
- `alphabet-build/specimen.png`: CLI uppercase/digit/question-mark waterfall.
- `alphabet-build/ttf-specimen.png`: pangram rendered from the parsed TTF itself.
- `cap-height-comparison.png`: source crop ink above CLI trace, both at 56 px cap.
- `detail-tech.png`, `detail-talk.png`, `detail-ive.png`, `detail-quick.png`: enlarged
  source inspection for H, K, V, Q. K was replaced with the clearer `TALK`
  instance; H has two original stems; V has no descender; Q's upper arch is
  an original stroke. R uses `ALRIGHT`, E uses `I'VE` for taller, thinner anatomy.
- `crop-labels.json`, `provenance.json`: exact source boxes, masks, word labels.
- `polygon-validation.json`: contour counts, hole counts, filled area per glyph.
- `build-report.json`: verified TTF outline coverage and output SHA-256 hashes.

Some glyphs deliberately retain the reference's unusual forms, including the
curved J, rounded N, lowercase-like K, and long-tailed Y. The source is a
479 × 425 screenshot; crop isolation cannot recover ink occluded by touching
neighbors. Each letter is normalized to the CLI's shared cap band, so natural
variation in stroke weight remains. No scene or owner visual acceptance is
claimed by this extraction.
