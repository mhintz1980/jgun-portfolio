import fs from 'node:fs';
import path from 'node:path';

const base = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

const retry = JSON.parse(fs.readFileSync(path.join(base, 'frames-retry', 'frames.json'), 'utf8'));
const orig = JSON.parse(fs.readFileSync(path.join(base, 'frames', 'frames.json'), 'utf8'));

const rows = [retry.results[0], ...orig.results.filter(r => r.progress > 0.06)];

for (const r of rows) {
  const c = r.camera, d = r.drawing, s = r.stats, p = r.performance;
  console.log(JSON.stringify({
    p: r.progress,
    ok: r.ok,
    phase: d.phase,
    camX: +c.x.toFixed(4), camY: +c.y.toFixed(4), camZ: +c.z.toFixed(4),
    fov: +c.fov.toFixed(2),
    upX: +c.up[0].toFixed(4), upY: +c.up[1].toFixed(4),
    pbr: +d.pbr.toFixed(4),
    pulseLuminance: +d.pulseLuminance.toFixed(2),
    vellum: s.vellum,
    regPx: r.maxRegistrationPx ? +r.maxRegistrationPx.toFixed(6) : null,
    tier: p.tier,
    declines: p.declines,
    precomputed: s.precomputed,
    contactShadow: s.contactShadow,
    flexEnabled: s.flexEnabled
  }));
}
