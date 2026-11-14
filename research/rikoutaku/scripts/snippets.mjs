// Print short context snippets around key identifiers (identifying lines only).
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../scripts-export');
const jobs = [
  ['www.rikoutaku.work__assets__main-N7NH1HMx.js', [/REVISION|three\.js/g, /Scatter/g, /Tyndall/g, /Guestbook/g, /arrangement/gi, /registerPlugin\([^)]*\)/g, /ScrollTrigger/g, /prefers-reduced-motion[^"'`]{0,80}/g, /layouts\.json/g, /data-composition[^"'`]{0,60}/g, /data-motion-system[^"'`]{0,60}/g, /scrollY|pageYOffset/g]],
  ['www.rikoutaku.work__assets__DRACOLoader-BhgqjXwv.js', [/REVISION="?\d+/g, /OrbitControls/g, /pinch[^a-z]{0,40}/gi]],
  ['www.rikoutaku.work__assets__index-CAWK1xnZ.js', [/Guestbook.{0,80}/g, /data-motion.{0,60}/g]],
  ['www.rikoutaku.work__assets__brand-BgRgrlm6.js', [/prefers-reduced-motion.{0,80}/g, /wheel.{0,60}/g]],
  ['www.rikoutaku.work__assets__curtain-lliHWBBA.js', [/prefers-reduced-motion.{0,80}/g, /curtain.{0,50}/gi]],
  ['www.rikoutaku.work__assets__works-D3lljqMx.js', [/works.{0,60}/gi]],
  ['www.rikoutaku.work__assets__helix-flow-BYmbMB4o.js', [/helix.{0,60}/gi]],
  ['www.rikoutaku.work__theme-boot.js', [/Tyndall.{0,80}/g, /theme.{0,60}/gi]],
  ['www.rikoutaku.work__', [/data-engine|three\.js|import|boot.{0,60}/g]]
];
for (const [f, patterns] of jobs) {
  let t; try { t = readFileSync(resolve(dir, f), 'utf8'); } catch { console.log('MISS', f); continue; }
  console.log('==== ' + f);
  for (const re of patterns) {
    const seen = new Set(); let count = 0;
    let m;
    while ((m = re.exec(t)) && count < 3) {
      const ctx = t.slice(Math.max(0, m.index - 60), m.index + m[0].length + 90).replace(/\s+/g, ' ');
      if (!seen.has(ctx)) { seen.add(ctx); console.log('  @' + m.index + '  …' + ctx + '…'); count++; }
    }
    if (count === 0) console.log('  (no hit for ' + re + ')');
  }
}
