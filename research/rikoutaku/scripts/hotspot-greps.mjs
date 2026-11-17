// Final hotspot greps: preloader, data-fx processor, works chunk identity.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../scripts-export');
const jobs = [
  ['www.rikoutaku.work__assets__main-N7NH1HMx.js', [/PAGE PRELOADER/g, /SEQ 001/g, /LOADING/g, /data-fx/g, /SCROLL TO EXPLORE/g, /fx-live/g, /wheel/g, /scrollTo\(/g]],
  ['www.rikoutaku.work__assets__brand-BgRgrlm6.js', [/data-fx/g, /fx-live/g, /ri-smooth/g, /lerp/g]],
  ['www.rikoutaku.work__assets__curtain-lliHWBBA.js', [/data-fx/g, /ri-covered/g, /visibilitychange/g]],
  ['www.rikoutaku.work__assets__works-D3lljqMx.js', [/.{0,120}/g]]
];
for (const [f, patterns] of jobs) {
  let t; try { t = readFileSync(resolve(dir, f), 'utf8'); } catch { console.log('MISS', f); continue; }
  console.log('==== ' + f + ' (len ' + t.length + ')');
  for (const re of patterns) {
    const seen = new Set(); let count = 0; let m;
    while ((m = re.exec(t)) && count < 2) {
      const ctx = t.slice(Math.max(0, m.index - 70), m.index + m[0].length + 90).replace(/\s+/g, ' ');
      if (!seen.has(ctx)) { seen.add(ctx); console.log('  @' + m.index + '  …' + ctx + '…'); count++; }
    }
    re.lastIndex = 0;
    const all = t.match(new RegExp(re.source, re.flags.replace('g', '') + 'g'));
    console.log('  [total hits: ' + (all ? all.length : 0) + ']');
  }
}
