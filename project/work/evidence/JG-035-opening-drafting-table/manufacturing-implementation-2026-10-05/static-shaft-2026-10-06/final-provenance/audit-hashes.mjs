// Independent hash audit: 16 WEBP assets + 16 source PNGs vs raster-manifest.json.
// CPU-only, read-only. Part of the final-provenance packet.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const manifestPath = path.join(
  root,
  'project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05',
  'static-shaft-2026-10-06/raster-manifest.json',
);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const results = [];
let mismatches = 0;
for (const asset of manifest.assets) {
  const webpPath = path.join(root, asset.file);
  const srcPath = path.join(root, asset.source);
  let webpHash = 'MISSING';
  let srcHash = 'MISSING';
  try { webpHash = sha256(webpPath); } catch {}
  try { srcHash = sha256(srcPath); } catch {}
  const webpOk = webpHash === asset.sha256;
  const srcOk = srcHash === asset.sourceSha256;
  if (!webpOk || !srcOk) mismatches += 1;
  results.push({
    file: path.basename(asset.file),
    sampleTime: asset.sampleTime,
    session: asset.session,
    webpOk,
    srcOk,
    webpHash,
    srcHash,
  });
}

const times = [...new Set(manifest.assets.map((a) => a.sampleTime))].sort((a, b) => a - b);
const perViewport = {};
for (const a of manifest.assets) {
  const vp = a.file.includes('-desktop') ? 'desktop' : 'narrow';
  perViewport[vp] = perViewport[vp] || new Set();
  perViewport[vp].add(a.sampleTime);
}

const viewports = Object.keys(perViewport);
const gridOk =
  viewports.length === 2 &&
  viewports.every((v) => perViewport[v].size === 8) &&
  viewports.every((v) => [...perViewport[v]].every((t) => times.includes(t)));

console.log(JSON.stringify({
  assetCount: manifest.assets.length,
  mismatches,
  times,
  perViewportCounts: Object.fromEntries(viewports.map((v) => [v, perViewport[v].size])),
  gridOk,
  results,
}, null, 2));
