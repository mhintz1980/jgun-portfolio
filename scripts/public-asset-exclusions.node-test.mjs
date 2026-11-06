import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { tmpdir } from 'node:os'
import ts from 'typescript'

const source = readFileSync(new URL('../build/excludePublicAssets.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { excludePublicAssets, EXCLUDED_PUBLIC_ASSETS } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'))

test('public exclusion plugin removes only exact paths from build output', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'jg042-exclusions-'))
  const files = ['models/m249-transformed.glb', 'models/Default.glb', 'models/manufacturing-core-lite.glb',
    'video/showreel-v3.mp4', 'video/studiomark-bumper-storm-ignition.mp4',
    'video/studiomark-showcase-precision-revealed.mp4', 'video/studiomark-showcase-precision-revealed.webm',
    'video/studiomark-showcase-precision-revealed-poster.jpg', 'fonts/gentilis_bold.typeface.json',
    'fonts/helvetiker_bold.typeface.json', 'textures/studiomark-road/aerial_asphalt_01_diff_2k.jpg']
  try {
    for (const base of ['public', 'dist']) for (const file of files) {
      const target = path.join(root, base, file)
      mkdirSync(path.dirname(target), { recursive: true })
      writeFileSync(target, file)
    }
    const plugin = excludePublicAssets()
    plugin.configResolved({ root, build: { outDir: 'dist' } })
    plugin.closeBundle()
    for (const file of files) {
      assert.equal(existsSync(path.join(root, 'public', file)), true, `source preserved: ${file}`)
      assert.equal(existsSync(path.join(root, 'dist', file)), !EXCLUDED_PUBLIC_ASSETS.includes(file), file)
    }
    assert.ok(EXCLUDED_PUBLIC_ASSETS.includes('video/studiomark-showcase-precision-revealed.mp4'))
    assert.ok(EXCLUDED_PUBLIC_ASSETS.includes('fonts/gentilis_bold.typeface.json'))
    assert.equal(EXCLUDED_PUBLIC_ASSETS.some(p => /showreel-v3|studiomark-bumper|studiomark-road/.test(p)), false)
    plugin.closeBundle() // absent exclusions must remain safe on a clean checkout
  } finally { rmSync(root, { recursive: true, force: true }) }
})
