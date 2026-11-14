// Summarize cdp.mjs net capture: compact per-asset table + totals.
import { readFileSync } from 'node:fs';
const data = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const p = data.perf;
const res = p.res || [];
const byExt = {};
let total = 0;
for (const r of res) {
  let ext = 'other';
  const m = r.name.split('?')[0].match(/\.([a-z0-9]{1,5})$/i);
  if (m) ext = m[1].toLowerCase();
  else if (r.init === 'link') ext = r.name.includes('typekit') ? 'css-typekit' : 'other';
  byExt[ext] = byExt[ext] || { n: 0, kb: 0 };
  byExt[ext].n++;
  byExt[ext].kb += r.transfer / 1024;
  total += r.transfer;
}
console.log('=== navigation timing (ms from nav start) ===');
console.log('domInteractive:', p.domInteractive, ' domContentLoaded:', p.domContentLoaded, ' loadEnd:', p.loadEnd);
console.log('paints:', JSON.stringify(p.paints));
console.log('lcp:', JSON.stringify(p.lcp));
console.log('canvasEvents:', JSON.stringify(p.canvasEvents));
console.log('canvasCtxTypes:', JSON.stringify(p.canvasCtxTypes));
console.log('\n=== transfer by ext (KB) ===');
for (const [k, v] of Object.entries(byExt)) console.log(`${k}: n=${v.n} kb=${v.kb.toFixed(1)}`);
console.log('TOTAL resource transfer KB:', (total / 1024).toFixed(1));
console.log('\n=== resources (start ms, transfer KB, decoded KB, url) ===');
const sorted = [...res].sort((a, b) => a.start - b.start);
for (const r of sorted) {
  console.log(`${String(r.start).padStart(8)}  +${String(r.end).padStart(8)}  ${String((r.transfer / 1024).toFixed(1)).padStart(8)}  ${String((r.decoded / 1024).toFixed(1)).padStart(8)}  ${r.init.padEnd(10)} ${r.name.replace('https://oryzo.ai', '').slice(0, 100)}`);
}
console.log('\n=== longtasks during load ===');
console.log(JSON.stringify(p.longtasks));
