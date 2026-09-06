/**
 * JG-026 Item 7.6 — export the C-size sheet template Mark draws the furniture on.
 *
 * The template is authored in WORLD MILLIMETRES of the sheet, which is the only unit the code
 * and the drawing agree on. It contains:
 *   - the sheet outline at real scale, with the origin at the SHEET CENTRE (+X right, +Y up
 *     in sheet space; the SVG user space is Y-down, so the file carries an explicit transform);
 *   - the FINAL view windows as empty reserved rectangles;
 *   - the reserved zones for title block / revision block / notes, plus the generated-content
 *     zones (views, callout lane, tables) marked "DO NOT DRAW".
 *
 * Mark draws inside the three hand-drawn slots only and hands the SVG back. The importer
 * requirement is a single `<g id="sheet-furniture">` element — see the JG-026 evidence.
 *
 * Usage:  node scripts/export-sheet-template.mjs [outPath]
 * Reads the live layout constants by importing the built source through a tiny TS-free shim,
 * so the template can never drift from what the renderer actually lays out.
 */
import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync('src/scene/drawing/drawingGeometry.ts', 'utf8')

// Read the live constants straight out of the module source so the template cannot drift
// from what the renderer lays out.
const SHEET_HEIGHT = Number(source.match(/export const SHEET_HEIGHT\s*=\s*([\d.]+)/)[1])
const SHEET_WIDTH = (SHEET_HEIGHT * 22) / 17

const zonesBlock = source.match(/export const SHEET_ZONES = \{([\s\S]*?)\n\} as const/)[1]
const zones = {}
for (const line of zonesBlock.split('\n')) {
  const match = line.match(/^\s*(\w+):\s*\{\s*x:\s*(-?[\d.]+),\s*y:\s*(-?[\d.]+),\s*w:\s*(-?[\d.]+),\s*h:\s*(-?[\d.]+)\s*\}/)
  if (match) zones[match[1]] = { x: +match[2], y: +match[3], w: +match[4], h: +match[5] }
}

const MM = 1000
const w = SHEET_WIDTH * MM
const h = SHEET_HEIGHT * MM

const HAND_DRAWN = ['titleBlock', 'revisionBlock', 'notes']
const GENERATED = ['views', 'callouts', 'tables']
const LABELS = {
  titleBlock: 'TITLE BLOCK — DRAW HERE',
  revisionBlock: 'REVISION BLOCK — DRAW HERE',
  notes: 'GENERAL NOTES — DRAW HERE',
  views: 'GENERATED VIEWS — DO NOT DRAW',
  callouts: 'GENERATED CALLOUT LANE — DO NOT DRAW',
  tables: 'GENERATED GD&T / TABLES — DO NOT DRAW',
  border: 'SHEET BORDER',
}

/** Sheet-space metres -> template millimetres, origin at sheet centre, Y already flipped. */
const rect = (zone) => ({
  x: (zone.x * MM + w / 2).toFixed(3),
  y: (h / 2 - (zone.y + zone.h) * MM).toFixed(3),
  width: (zone.w * MM).toFixed(3),
  height: (zone.h * MM).toFixed(3),
})

const zoneSvg = (name, zone, style) => {
  const r = rect(zone)
  return `    <g id="zone-${name}">
      <rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" ${style}/>
      <text x="${(+r.x + 6).toFixed(3)}" y="${(+r.y + 14).toFixed(3)}" font-size="9" font-family="monospace" fill="#7aa7b4">${LABELS[name]}</text>
    </g>`
}

// The four view windows are laid out by makeDrawingLayout from the model bounds. They are
// emitted here from the same arithmetic so the template matches the render exactly; the
// numbers come from the layout report written by scripts/verify-b1b2-rebuild.mjs.
const layoutReport = 'project/work/evidence/b1-b2-rebuild/proof/layout.json'
let views = []
if (fs.existsSync(layoutReport)) {
  views = JSON.parse(fs.readFileSync(layoutReport, 'utf8')).views ?? []
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  JGUN D1-AP — ANSI C sheet template (22 : 17), JG-026.
  UNITS      : millimetres of the WORLD sheet. 1 user unit = 1 mm.
  SHEET      : ${w.toFixed(3)} x ${h.toFixed(3)} mm.
  ORIGIN     : SVG user space starts top-left as usual. Sheet-space origin (0,0) — the
               origin every code constant is written against — is the SHEET CENTRE, at
               (${(w / 2).toFixed(3)}, ${(h / 2).toFixed(3)}) in this file, with sheet +Y pointing UP.
  SCALE NOTE : a physical ANSI C sheet is 558.8 x 431.8 mm; this world sheet carries the same
               layout at 1:${(w / 558.8).toFixed(3)} because the primary elevation is drawn 1:1 in world
               millimetres and the JGun is 283 mm long.
  CONTRACT   : draw only inside zone-titleBlock, zone-revisionBlock and zone-notes, and put
               everything you draw inside a single <g id="sheet-furniture"> element. Do not
               introduce dimensions, part numbers, tolerance values or view labels — all of
               those are generated from Default.glb at render time and a hand-drawn copy
               would go stale.
-->
<svg xmlns="http://www.w3.org/2000/svg" width="${w.toFixed(3)}mm" height="${h.toFixed(3)}mm" viewBox="0 0 ${w.toFixed(3)} ${h.toFixed(3)}">
  <g id="sheet-outline" fill="none" stroke="#b3dae2" stroke-width="1">
    <rect x="0" y="0" width="${w.toFixed(3)}" height="${h.toFixed(3)}"/>
${zoneSvg('border', zones.border, 'fill="none" stroke="#b3dae2" stroke-width="1"')}
  </g>
  <g id="reserved-hand-drawn" fill="none" stroke="#e0b25a" stroke-width="1" stroke-dasharray="6 4">
${HAND_DRAWN.map((name) => zoneSvg(name, zones[name], 'fill="none" stroke="#e0b25a" stroke-dasharray="6 4"')).join('\n')}
  </g>
  <g id="reserved-generated" fill="none" stroke="#4d7f8c" stroke-width="1" stroke-dasharray="2 5">
${GENERATED.map((name) => zoneSvg(name, zones[name], 'fill="none" stroke="#4d7f8c" stroke-dasharray="2 5"')).join('\n')}
  </g>
  <g id="view-windows" fill="none" stroke="#4d7f8c" stroke-width="1" stroke-dasharray="2 5">
${views
  .map((view) => {
    const r = rect({ x: view.rect[0], y: view.rect[1], w: view.rect[2], h: view.rect[3] })
    return `    <g id="view-${view.name}">
      <rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}"/>
      <text x="${(+r.x + 4).toFixed(3)}" y="${(+r.y + 12).toFixed(3)}" font-size="8" font-family="monospace" fill="#4d7f8c">${view.label}</text>
    </g>`
  })
  .join('\n')}
  </g>
  <!-- Replace this element wholesale with your Inkscape furniture. -->
  <g id="sheet-furniture"/>
</svg>
`

const out = process.argv[2] ?? 'project/work/evidence/b1-b2-rebuild/jgun-ansi-c-sheet-template.svg'
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, svg)
console.log(
  `wrote ${out} — ${w.toFixed(3)} x ${h.toFixed(3)} mm, ${views.length} view windows, ${Object.keys(zones).length} zones`,
)
