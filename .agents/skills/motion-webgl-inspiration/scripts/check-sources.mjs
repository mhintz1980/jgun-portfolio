#!/usr/bin/env node
// Check every link in references/sources.md and report broken ones.
// Usage: node check-sources.mjs [path/to/sources.md]
// Exit 1 on hard failures (404/410/5xx/network). 401/403/429 are reported as "blocked"
// (bot protection or login walls), not failures.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] ?? path.join(here, '..', 'references', 'sources.md');
const md = await readFile(file, 'utf8');
const urls = [...new Set([...md.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]))];

// Sites known to reject scripted requests (bot walls). Check these by hand in a browser.
const KNOWN_BOT_WALLS = ['typewolf.com', 'shotdeck.com', 'docs.blender.org', 'land-book.com'];
const isKnownWall = (u) => KNOWN_BOT_WALLS.some((d) => new URL(u).hostname.endsWith(d));
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36';
async function check(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': UA } });
    const s = res.status;
    const blocked = [401, 403, 429].includes(s) || (s >= 400 && isKnownWall(url));
    return { url, status: s, result: s < 400 ? 'ok' : blocked ? 'blocked' : 'FAIL' };
  } catch (e) {
    return { url, status: 0, result: isKnownWall(url) ? 'blocked' : 'FAIL', note: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally {
    clearTimeout(t);
  }
}

const results = [];
for (let i = 0; i < urls.length; i += 8) {
  results.push(...(await Promise.all(urls.slice(i, i + 8).map(async (u) => {
    const first = await check(u);
    if (first.result !== 'FAIL') return first;
    await new Promise((r) => setTimeout(r, 3000)); // one retry for transient 5xx/timeouts
    return { ...(await check(u)), note: 'retried' };
  }))));
}
for (const r of results) console.log(`${r.result.padEnd(7)} ${String(r.status).padEnd(4)} ${r.url}${r.note ? `  (${r.note})` : ''}`);
const fails = results.filter((r) => r.result === 'FAIL');
console.log(`\n${results.length} links · ${results.filter((r) => r.result === 'ok').length} ok · ${results.filter((r) => r.result === 'blocked').length} blocked · ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
