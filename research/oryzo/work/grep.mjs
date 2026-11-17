// Context grep for minified bundles. Usage: node grep.mjs <file> <pattern> <maxHits> <ctx>
import { readFileSync } from 'node:fs';
const [, , file, pat, maxHitsArg, ctxArg] = process.argv;
const src = readFileSync(file, 'utf8');
const re = new RegExp(pat, 'g');
const maxHits = Number(maxHitsArg || 5);
const ctx = Number(ctxArg || 110);
let n = 0;
let m;
while ((m = re.exec(src)) && n < maxHits) {
  const i = m.index;
  console.log(`--- hit ${++n} @${i}: ...${src.slice(Math.max(0, i - ctx), i + m[0].length + ctx).replace(/\s+/g, ' ')}...`);
}
if (!n) console.log('no hits');
