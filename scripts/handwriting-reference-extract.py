"""Recompute TTF outline coordinate bounds, matching Troika's glyph extents."""
import json
import logging
import sys

from fontTools.ttLib import TTFont

logging.getLogger("fontTools").setLevel(logging.ERROR)
font = TTFont(sys.argv[1])
glyf = font["glyf"]
bounds = {}
for codepoint, name in font.getBestCmap().items():
    glyph = glyf[name]
    if not glyph.numberOfContours:
        continue
    # The CLI's stored header extrema include zero origins. Recompute from
    # actual outline points in memory; never save or change the TTF itself.
    # Troika likewise takes extrema over path coordinates including controls.
    glyph.recalcBounds(glyf)
    bounds[chr(codepoint)] = {
        "fontMinX": glyph.xMin,
        "fontMinY": glyph.yMin,
        "fontHeight": glyph.yMax - glyph.yMin,
    }
print(json.dumps(bounds, separators=(",", ":")))
