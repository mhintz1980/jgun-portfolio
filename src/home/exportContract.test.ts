import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(path.resolve(file))
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')
const record = JSON.parse(read('design/homepage-export/import-record.json').toString())
const html = read('home/index.html').toString()

describe('owner-exported homepage contract', () => {
  it('records the exact owner-supplied export, rather than the rejected reinterpretation', () => {
    expect(sha(read('design/homepage-export/source.html'))).toBe(
      '11c2b9e77778fa947ad7a7af411c889d4fd1deb1802830926fe3ef63dc4c3a08',
    )
    expect(record.sha256).toBe('11c2b9e77778fa947ad7a7af411c889d4fd1deb1802830926fe3ef63dc4c3a08')
    expect(record.page).toContain('#page-dcb81aee8d83')
  })
  it('ships the exported document structure and desktop geometry', () => {
    expect(html).toContain('data-home-design="claude-export-20261114"')
    expect(html.match(/class="design-gallery"/g)).toHaveLength(4)
    expect(html).toContain('height: 600px')
    expect(html).toContain('height: 5000px')
    expect(record.geometry).toEqual({ width: 360, height: 277, radius: 1140, step: 15, equator: 300, corner: 11 })
    expect(html).not.toMatch(/home-main\.tsx|ShowreelSection|home-nav-toggle|\{\{arc\./)
  })
  it('retains the bundled image/font bytes and makes every reference local', () => {
    const assets = Object.values(record.assets) as { url: string; sha256: string; mime: string }[]
    expect(assets.filter((a) => a.mime === 'image/webp')).toHaveLength(36)
    expect(assets.filter((a) => a.mime === 'font/woff2')).toHaveLength(8)
    for (const asset of assets) expect(sha(read('public' + asset.url)), asset.url).toBe(asset.sha256)
    expect(read('src/home/export-fonts.css').toString()).not.toMatch(/https?:\/\//)
    expect(html).not.toMatch(/<helmet|__bundler|data-dc-script|text\/x-dc/)
    expect(html).not.toContain('564f23fa3056f19cbf9c.webp')
    expect(html).not.toContain('Showreel frame, planetary stages title')
    expect(read('public/home/design/FONT-LICENSES.txt').toString()).toContain('SIL OPEN FONT LICENSE')
  })
})
