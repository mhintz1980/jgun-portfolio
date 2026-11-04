#!/usr/bin/env node
// Capture screenshots of a scroll-driven page at fixed scroll positions, and report console errors.
// Used in workflow step 8 (compare the build with the references) and as a smoke test.
//
// Usage:
//   node capture-scroll-frames.mjs <url> [outDir] [--stops 0,25,50,75,100] [--width 1440 --height 900] [--mobile] [--timeout 30]
//   --timeout: seconds per screenshot (raise it for heavy scenes under software GL)
// Requires Playwright:  npm i -D playwright && npx playwright install chromium
//
// Exit code 1 if the page logs console errors / page errors, or if window.__scrollStory reports ready:false.

import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const url = args[0];
if (!url || url.startsWith('--')) {
  console.error('Usage: node capture-scroll-frames.mjs <url> [outDir] [--stops 0,25,50,75,100] [--width 1440] [--height 900] [--mobile]');
  process.exit(2);
}
const outDir = args[1] && !args[1].startsWith('--') ? args[1] : 'scroll-frames';
const stops = flag('stops', '0,25,50,75,100').split(',').map(Number);
const mobile = args.includes('--mobile');
const width = Number(flag('width', mobile ? 390 : 1440));
const height = Number(flag('height', mobile ? 844 : 900));
// Heavy production scenes under software GL can take many seconds per frame.
const shotTimeout = Number(flag('timeout', 30)) * 1000;

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright not found. Install with: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

await mkdir(outDir, { recursive: true });
// SwiftShader keeps WebGL working in headless/CI environments without a GPU.
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(url, { waitUntil: 'networkidle' });
// Wait for the starter's ready flag if present; otherwise just give the page a moment.
await page.waitForFunction(() => window.__scrollStory?.ready !== undefined, null, { timeout: 20000 }).catch(() => {});
const status = await page.evaluate(() => window.__scrollStory ?? null);
await page.waitForTimeout(800);

const results = [];
for (const pct of stops) {
  await page.evaluate((p) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.round((max * p) / 100));
  }, pct);
  // Wait until the starter's damped progress catches up with scroll; plain pages get a fixed wait.
  const settled = await page
    .waitForFunction(() => {
      const s = window.__scrollStory?.state?.();
      return s && Math.abs(s.p - s.target) < 0.002;
    }, null, { timeout: 8000, polling: 100 })
    .then(() => true)
    .catch(() => false);
  await page.waitForTimeout(settled ? 400 : 1500);
  // Heavy scenes under software GL render slowly, so CSS fades (HUD labels) start late.
  // Wait for running CSS animations/transitions to finish before the screenshot.
  await page
    .waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'), null, { timeout: 8000, polling: 100 })
    .catch(() => {});
  await page.waitForTimeout(150);
  const file = path.join(outDir, `${mobile ? 'mobile' : 'desktop'}-${String(pct).padStart(3, '0')}.png`);
  await page.screenshot({ path: file, timeout: shotTimeout });
  const state = await page.evaluate(() => window.__scrollStory?.state?.() ?? null);
  results.push({ pct, file, state });
}
await browser.close();

console.log(JSON.stringify({ url, viewport: { width, height }, ready: status?.ready ?? null, frames: results, errors }, null, 2));
if (errors.length || status?.ready === false) process.exit(1);
