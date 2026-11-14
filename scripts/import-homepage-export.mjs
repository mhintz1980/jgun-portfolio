// Import Mark's portable Claude Design export without executing its packed scripts.
// Usage: node scripts/import-homepage-export.mjs [path-to-export.html]
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.resolve(root, process.argv[2] || 'design/homepage-export/source.html')
const exported = fs.readFileSync(source, 'utf8')
const unpack = (name) => {
  const match = exported.match(new RegExp(`<script type="__bundler/${name}">([\\s\\S]*?)<\\/script>`))
  if (!match) throw new Error(`Missing export ${name}`)
  return JSON.parse(match[1])
}
const digest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')
const manifest = unpack('manifest')
let template = unpack('template')
const retiredFrame = template.match(/<img src="([^"]+)" alt="Showreel frame, planetary stages title"/)?.[1]
const assetDir = path.join(root, 'public/home/design')
fs.mkdirSync(assetDir, { recursive: true })
const existing = new Map()
for (const parent of ['public/home', 'public/fonts/home']) {
  const walk = (dir) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name)
      if (item.isDirectory()) walk(file)
      else if (/\.(webp|woff2)$/.test(file))
        existing.set(
          digest(fs.readFileSync(file)),
          `/${path.relative(path.join(root, 'public'), file).replaceAll('\\', '/')}`,
        )
    }
  }
  walk(path.join(root, parent))
}
const assets = {}
for (const [id, item] of Object.entries(manifest)) {
  if (!['image/webp', 'font/woff2'].includes(item.mime)) continue
  let bytes = Buffer.from(item.data, 'base64')
  if (item.compressed) bytes = gunzipSync(bytes)
  const sha256 = digest(bytes)
  // The export predates the owner's rejection of this one showcase still.
  // Preserve the archived source, but keep the already-approved replacement public.
  if (id === retiredFrame) {
    const url = '/home/stacks/renderings/06.webp'
    const approved = fs.readFileSync(path.join(root, 'public', url))
    assets[id] = {
      url,
      sha256: digest(approved),
      originalSha256: sha256,
      bytes: approved.length,
      mime: item.mime,
      substitution: 'Owner-rejected showcase still replaced by approved industrial torque-wrench frame.',
    }
    continue
  }
  const extension = item.mime === 'image/webp' ? 'webp' : 'woff2'
  const url = existing.get(sha256) || `/home/design/${sha256.slice(0, 20)}.${extension}`
  if (!existing.has(sha256)) fs.writeFileSync(path.join(root, 'public', url), bytes)
  assets[id] = { url, sha256, bytes: bytes.length, mime: item.mime }
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
// DOMParser only parses inert markup. No export script is evaluated.
const imported = await page.evaluate(
  ({ template, assets }) => {
    const original = new DOMParser().parseFromString(template, 'text/html')
    const logic = original.querySelector('script[data-dc-script]')
    const props = JSON.parse(logic?.getAttribute('data-props') || '{}')
    const value = (name) => props[name].default
    const width = value('cardWidth'),
      height = Math.round(width / value('cardAspect'))
    const radius = value('wheelRadius'),
      step = value('cardSpacing'),
      equator = value('wheelX')
    const arc = { w: width, h: height, corner: value('cardCorner') }
    for (let k = -4; k <= 3; k++) {
      const rot = -k * step,
        angle = (rot * Math.PI) / 180
      arc[k < 0 ? `km${-k}` : `k${k}`] = {
        left: Math.round(equator - radius + radius * Math.cos(angle) - width / 2),
        top: Math.round(427.5 + radius * Math.sin(angle) - height / 2),
        rot,
      }
    }
    let text = template.replace(/<img\b[^>]+>/g, (tag) => {
      const match = tag.match(/arc\.k(m?)(\d)\.left/)
      return match ? tag.replace('<img ', `<img data-wheel-offset="${Number(match[2]) * (match[1] ? -1 : 1)}" `) : tag
    })
    text = text.replace(/\{\{arc\.([\w.]+)\}\}/g, (_, key) => {
      const resolved = key.split('.').reduce((object, part) => object?.[part], arc)
      if (typeof resolved !== 'number') throw new Error(`Unknown geometry ${key}`)
      return String(resolved)
    })
    for (const [id, asset] of Object.entries(assets)) text = text.replaceAll(id, asset.url)
    const doc = new DOMParser().parseFromString(text, 'text/html')
    const fonts = [...doc.querySelectorAll('style')]
      .flatMap((style) => [...style.textContent.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) => m[0]))
      .filter((face) => face.includes('/fonts/home/') || face.includes('/home/design/'))
    const maskStyle = [...doc.querySelectorAll('style')]
      .map((style) => style.textContent)
      .find((style) => style.includes('.vault-gearbox-housing'))
    if (!maskStyle) throw new Error('Missing drawing mask styles')
    const layout = doc.querySelector('x-dc > div')
    if (!layout) throw new Error('Missing exported page')
    layout.id = 'root'
    layout.classList.add('design-home')
    layout.dataset.homeDesign = 'claude-export-20261114'
    const header = layout.querySelector('header')
    header.classList.add('design-header')
    header.querySelector('a').classList.add('design-name')
    layout.querySelector('#top').classList.add('design-hero')
    layout.querySelector('#work').classList.add('design-work')
    const routes = ['/torque-wrench/', '/quiet-machine/', '/armament/', null]
    const galleries = [...layout.querySelectorAll('[role="region"]')]
    galleries.forEach((gallery, index) => {
      gallery.classList.add('design-gallery')
      gallery.dataset.gallery = String(index)
      gallery.querySelector('h3').closest('div[style]').classList.add('design-caption')
      const row = gallery.previousElementSibling
      row.classList.add('design-row-wrap')
      row.firstElementChild.classList.add('design-row')
      for (const link of [...row.querySelectorAll('a'), ...gallery.querySelectorAll('a')]) {
        if (routes[index]) {
          link.setAttribute('href', routes[index])
          link.setAttribute('data-fade', '')
        }
      }
      for (const img of gallery.querySelectorAll('img')) {
        img.setAttribute('decoding', 'async')
        img.setAttribute('draggable', 'false')
      }
    })
    layout.querySelector('#plus').classList.add('design-plus')
    layout.querySelector('#contact').classList.add('design-contact')
    layout.querySelector('footer').classList.add('design-footer')
    const drawings = layout.lastElementChild
    drawings.classList.add('design-drawings')
    for (const svg of layout.querySelectorAll('[sc-camel-view-box]')) {
      svg.setAttribute('viewBox', svg.getAttribute('sc-camel-view-box'))
      svg.removeAttribute('sc-camel-view-box')
    }
    for (const node of layout.querySelectorAll('script,helmet,link')) node.remove()
    return {
      body: layout.outerHTML,
      fonts: fonts.join('\n'),
      maskStyle,
      geometry: { width, height, radius, step, equator, corner: arc.corner },
    }
  },
  { template, assets },
)
await browser.close()

const oldEntry = fs.readFileSync(path.join(root, 'home/index.html'), 'utf8')
const shell = oldEntry.match(/<!-- shell:begin -->[\s\S]*?<!-- shell:end -->/)?.[0]
if (!shell) throw new Error('Missing shared page-fade shell')
const colors = new Map([
  ['#0b1622', 'var(--design-bg)'],
  ['#102133', 'var(--design-surface)'],
  ['#e8e4da', 'var(--design-ink)'],
  ['#a9b4c2', 'var(--design-muted)'],
  ['#f0703a', 'var(--design-accent)'],
  ['#cfe0f2', 'var(--design-ghost)'],
  ['rgba(232, 228, 218, 0.16)', 'var(--design-rule)'],
  ['rgb(232, 228, 218)', 'var(--design-ink)'],
  ['rgb(169, 180, 194)', 'var(--design-muted)'],
  ['rgb(240, 112, 58)', 'var(--design-accent)'],
])
let body = imported.body
body = body.replaceAll('Showreel frame, planetary stages title', 'Showreel frame, industrial torque wrench')
for (const [color, token] of colors) body = body.replaceAll(color, token)
if (body.includes('{{arc.') || /["(][\w-]{36}["')]/.test(body)) throw new Error('Unresolved template asset or geometry')
const licenses = exported.match(/<!--[\s\S]*?-->/)?.[0]
fs.writeFileSync(path.join(assetDir, 'FONT-LICENSES.txt'), licenses || 'See original export font license notices.')
fs.writeFileSync(path.join(root, 'src/home/export-fonts.css'), imported.fonts + '\n' + imported.maskStyle + '\n')
const html = `<!doctype html>
<html lang="en" data-theme="dark"><head><meta charset="UTF-8">
${shell}
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="index, follow">
<meta name="description" content="Mark Hintz, mechanical designer and systems builder: precision tooling, industrial pump packages, and the tools around the CAD.">
<link rel="canonical" href="https://studiomark.dev/home/"><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<title>Mark Hintz · Mechanical Designer + Systems Builder</title>
<script>try{var t=localStorage.getItem('sm:theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}</script>
</head><body>${body}<script type="module" src="/src/home-export-main.ts"></script></body></html>\n`
fs.writeFileSync(path.join(root, 'home/index.html'), html)
fs.writeFileSync(
  path.join(root, 'design/homepage-export/import-record.json'),
  JSON.stringify(
    {
      source: 'source.html',
      sha256: digest(exported),
      page: 'https://claude.ai/artifact/XtVxa2BvgrCRsfq2y8H6mE#page-dcb81aee8d83',
      geometry: imported.geometry,
      assets,
    },
    null,
    2,
  ) + '\n',
)
console.log(
  `Imported ${Object.keys(assets).length} local image/font assets; source ${digest(exported)}; no packed scripts shipped.`,
)
