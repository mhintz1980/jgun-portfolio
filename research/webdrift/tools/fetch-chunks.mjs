// Downloads every .js resource recorded in data/desktop-inventory.json into
// exports/chunks/ (exact URLs from the live capture, no hand-typed names).
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const invPath = fileURLToPath(new URL('../data/desktop-inventory.json', import.meta.url));
const inv = JSON.parse(readFileSync(invPath, 'utf8'));
const outDir = fileURLToPath(new URL('../exports/chunks/', import.meta.url));
mkdirSync(outDir, { recursive: true });

const jsUrls = [...new Set(inv.resources.map((r) => r.name).filter((n) => n.endsWith('.js')))];
for (const url of jsUrls) {
  const out = join(outDir, basename(url));
  try {
    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!r.ok) { console.log(basename(url), 'HTTP', r.status); continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    writeFileSync(out, buf);
    console.log(basename(url), buf.length, 'bytes');
  } catch (e) { console.log(basename(url), 'ERR', e.message); }
}
