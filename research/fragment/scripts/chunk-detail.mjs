// Read small chunk + grep reduced-motion / version hints.
import fs from 'node:fs';
const d = 'research/fragment/data/chunks';
console.log('--- spline_mobile_scroll.mjs (full, 630B minified) ---');
console.log(fs.readFileSync(`${d}/spline_mobile_scroll.mjs`, 'utf8'));
console.log('--- reduced-motion hits ---');
for (const f of ['motion.mjs', 'framer.mjs', 'toplevel.mjs', 'script_main.mjs', 'GbMC1mGnU.mjs', 'portrait_parallax_v1.mjs']) {
  const t = fs.readFileSync(`${d}/${f}`, 'utf8');
  const m = t.match(/prefers-reduced-motion|reducedMotion|useReducedMotion|shouldReduceMotion/gi);
  console.log(f, m ? m.length : 0, m ? [...new Set(m)].slice(0, 5).join('|') : '');
}
console.log('--- motion.mjs version hints ---');
const mo = fs.readFileSync(`${d}/motion.mjs`, 'utf8');
const v = mo.match(/version[:=]+\s*["'][\d.]+["']|11\.\d+\.\d+|motion[ -]one|@motionone|framer-motion/gi);
console.log(v ? [...new Set(v)].slice(0, 12).join(' | ') : 'none');
console.log('--- framer.mjs version-ish ---');
const fm = fs.readFileSync(`${d}/framer.mjs`, 'utf8');
const v2 = fm.match(/version["']?\s*[:=]\s*["'][^"']{2,16}["']/g);
console.log(v2 ? [...new Set(v2)].slice(0, 15).join(' | ') : 'none');
console.log('--- script_main.mjs routes/pages ---');
const sm = fs.readFileSync(`${d}/script_main.mjs`, 'utf8');
const routes = sm.match(/["']\/[a-z0-9-]*["']/gi);
console.log('route-ish strings:', routes ? [...new Set(routes)].slice(0, 25).join(' ') : 'none');
console.log('script_main head 400:', sm.slice(0, 400));
console.log('--- toplevel spline integration ---');
const tp = fs.readFileSync(`${d}/toplevel.mjs`, 'utf8');
const sp = tp.match(/spline-viewer|scene\.splinecode|prod\.spline\.design|load-anim|scroll[\w-]*|events-[a-z-]+/gi);
console.log(sp ? [...new Set(sp)].slice(0, 30).join(' | ') : 'none');
