// Probe 3: timed screenshots (loader->app) + no-WebGL simulation via getContext stub.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/research/gq-extraordinary-lab';
const URL_ = 'https://www.gq.com/sponsored/story/the-extraordinary-lab';
const EXEC = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const write = (n, d) => { fs.writeFileSync(path.join(OUT, n), JSON.stringify(d)); console.log('WROTE', n, fs.statSync(path.join(OUT, n)).size, 'bytes'); };

const browser = await chromium.launch({ channel: 'chrome', headless: true, executablePath: EXEC });

// ---- Phase 1: timed screenshots + precise asset arrival ----
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const net = [];
  const client = await context.newCDPSession(page);
  await client.send('Network.enable');
  const t0 = Date.now();
  const pending = new Map();
  client.on('Network.requestWillBeSent', e => {
    if (e.request.url.startsWith('data:')) return;
    pending.set(e.requestId, Date.now() - t0);
    if (/interactive\.gq\.com/.test(e.request.url) && !/\.(webp|png|jpg)/.test(e.request.url)) {
      net.push({ ev: 'req', wall: Date.now() - t0, url: e.request.url.replace('https://interactive.gq.com', ''), type: e.type });
    }
  });
  client.on('Network.loadingFinished', e => {
    const st = pending.get(e.requestId);
    if (st != null) net.push({ ev: 'done', wall: Date.now() - t0, bytes: e.encodedDataLength, id: e.requestId, startWall: st });
  });
  await page.goto(URL_, { waitUntil: 'commit', timeout: 45000 });
  const shots = [];
  for (const t of [2500, 5000, 8000, 12000]) {
    const wait = t - (Date.now() - t0);
    if (wait > 0) await page.waitForTimeout(wait);
    const f = path.join(OUT, `shot-${t}ms.png`);
    await page.screenshot({ path: f }).catch(() => {});
    shots.push({ t, file: f, bodyLen: await page.evaluate(() => (document.body.innerText || '').length).catch(() => -1) });
  }
  // correlate bytes to urls
  const urlById = new Map();
  client.on('Network.requestWillBeSent', e => urlById.set(e.requestId, e.request.url));
  await page.waitForTimeout(1500);
  const doneRows = net.filter(n => n.ev === 'done').sort((a, b) => a.wall - b.wall);
  write('arrival.json', { t0Iso: new Date(t0).toISOString(), shots, firstInteractiveDone: doneRows.filter(r => (urlById.get(r.id) || '').includes('interactive.gq.com')).slice(0, 30).map(r => ({ wall: r.wall, start: r.startWall, KB: Math.round((r.bytes || 0) / 1024), url: (urlById.get(r.id) || '').replace('https://interactive.gq.com', '').slice(0, 90) })) });
  await context.close();
} catch (e) { console.log('FAIL shots', String(e).slice(0, 300)); }

// ---- Phase 2: simulated no-WebGL (getContext returns null) ----
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await context.addInitScript(() => {
    const oc = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...a) {
      if (/webgl|experimental-webgl/i.test(String(type))) return null;
      return oc.call(this, type, ...a);
    };
    window.__webglBlocked = true;
  });
  await page.goto(URL_, { waitUntil: 'commit', timeout: 45000 });
  const samples = [];
  for (let i = 0; i < 40; i++) {
    const s = await page.evaluate(() => ({
      t: Math.round(performance.now()),
      canvas: document.querySelectorAll('canvas').length,
      bodyText: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 200),
      videos: document.querySelectorAll('video').length,
      imgs: [...document.querySelectorAll('img')].map(im => (im.src || '').slice(0, 90)).filter(s => /interactive/.test(s)).slice(0, 4)
    })).catch(() => null);
    if (s) samples.push(s);
    await page.waitForTimeout(500);
    if (i === 15) { const f = path.join(OUT, 'shot-nowebgl.png'); await page.screenshot({ path: f }).catch(() => {}); }
  }
  write('nowebgl3.json', { samples: samples.slice(0, 40) });
  await context.close();
} catch (e) { console.log('FAIL nowebgl3', String(e).slice(0, 300)); }

await browser.close();
console.log('PHASE3 DONE');
