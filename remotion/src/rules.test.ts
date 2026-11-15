import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as copy from './copy'
import { FILM_ARMAMENT, showcase } from './armament'
import { FILM_CLIPS } from './clips'
import { FILM_LOGO } from './logo'

// The showreel's hard rules (owner rulings), checked in the root `npm test` gate.
// Copy rules mirror src/home/content.test.ts and add the showreel brief's walls.

const HERE = path.dirname(fileURLToPath(import.meta.url))

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) for (const item of value) strings(item, out)
  else if (value && typeof value === 'object') for (const item of Object.values(value)) strings(item, out)
  return out
}

function sources(dir = HERE): { file: string; text: string }[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return sources(full)
    if (!/\.(ts|tsx)$/.test(name) || name.endsWith('.test.ts')) return []
    return [{ file: path.relative(HERE, full), text: readFileSync(full, 'utf8') }]
  })
}

const COPY = strings(Object.values(copy))
const SRC = sources()

const BANNED: readonly [string, RegExp][] = [
  // Homepage accuracy rules (src/home/content.test.ts)
  ['Systems Architect', /systems architect/i],
  ['CATIA', /catia/i],
  ['Creo', /\bcreo\b/i],
  ['Fusion 360', /fusion\s*360/i],
  ['PE stamp', /\bP\.?E\.?\b/],
  ['M249', /m249/i],
  ['employer Myers', /myers/i],
  ['employer Seth', /\bseth\b/i],
  ['employer MSP', /\bmsp\b/i],
  ['product RL300', /rl\s*-?300/i],
  ['brand Torque Gun', /torque\s*gun/i],
  ['product JGUN', /j-?gun/i],
  ['unverified headline', /built from the shop floor up/i],
  ['v2 22% claim', /22\s*%/],
  ['v2 hours claim', /\d+\+?\s*(hrs|hours)/i],
  ['v2 47 components', /\b47\b/],
  ['v2 tolerance', /0005/],
  ['v2 15 years', /\b15\s*(yrs|years)/i],
  ['v2 7-axis', /7-axis/i],
  // Showreel brief: no dimensions, GD&T or part numbers anywhere on screen
  ['GD&T', /gd\s*&\s*t/i],
  ['part number', /\b[PKA]\d{6}\b/],
  ['dimension', /\d+(\.\d+)?\s*(mm|cm|in\b|inch|"|°|deg)/i],
  ['tolerance', /±/],
  // No third-party firearm brands or designations (copy says "AR-15-pattern")
  ['firearm brand', /\b(colt|fn\b|fnh|daniel defense|bravo company|bcm|aero precision|magpul|knight'?s|lmt|sig\s*sauer|heckler|h&k|ruger|smith\s*&\s*wesson|armalite|springfield|palmetto|psa\b|geissele|noveske|larue|mk\s*-?18)\b/i],
  ['designation Mk 18', /mk\s*-?18/i],
]
const BRAND = BANNED.find(([label]) => label === 'firearm brand')![1]
const DESIGNATION = /mk\s*-?18/i
const ABSOLUTE_PATH = /[A-Za-z]:[\\/]|\/Users\//

describe('showreel on-screen copy', () => {
  it('has copy to scan', () => {
    expect(COPY.join(' ').length).toBeGreaterThan(400)
  })
  it.each(BANNED)('never says: %s', (_label, pattern) => {
    expect(COPY.find((text) => pattern.test(text)) ?? null).toBeNull()
  })
  it('names the platform the owner way', () => {
    expect(copy.ARMAMENT.line).toMatch(/AR-15-pattern/)
  })
})

describe('showreel armament imagery', () => {
  it('uses only images from public/home/armament-showcase/', () => {
    for (const file of FILM_ARMAMENT) expect(() => showcase(file)).not.toThrow()
    for (const { file, text } of SRC) {
      for (const m of text.matchAll(/ar-\d\d\.webp/g)) expect(FILM_ARMAMENT, `${file}: ${m[0]}`).toContain(m[0])
    }
  })
  it('draws representative images only through the labelled card', () => {
    // showcase(...).src is the only way to an <Img> outside ShowcaseCard; it may only be used on "mine".
    for (const { file, text } of SRC) {
      if (file === path.join('ui', 'ShowcaseCard.tsx')) continue
      for (const m of text.matchAll(/showcase\(\s*['"](ar-\d\d\.webp)['"]\s*\)/g)) {
        expect(showcase(m[1]).label, `${file} uses ${m[1]} without its label`).toBe('mine')
      }
    }
    expect(copy.ARMAMENT.representativeLabel).toMatch(/^Representative model/)
    const card = SRC.find((s) => s.file === path.join('ui', 'ShowcaseCard.tsx'))!.text
    expect(card).toMatch(/label === 'representative'/)
    expect(card).toMatch(/ARMAMENT\.representativeLabel/)
  })
  it('includes at least one representative image, so the label path is exercised', () => {
    expect(FILM_ARMAMENT.some((f) => showcase(f).label === 'representative')).toBe(true)
  })
})

describe('armament clips (manifest-driven)', () => {
  // Owner rulings 2026-11-13: stand-in assemblies are labelled; names and paths stay off screen and
  // out of committed files. Frames are gitignored until the film review, so this passes with none.
  const CLIPS_DIR = path.join(HERE, '..', 'clips', 'armament')
  const manifestText = readFileSync(path.join(CLIPS_DIR, 'manifest.json'), 'utf8')
  const manifest = JSON.parse(manifestText) as {
    models: Record<string, { provenance: string; label_required: boolean }>
    clips: Record<string, unknown>
  }
  const spin = SRC.find((s) => s.file === path.join('ui', 'ClipSpin.tsx'))!.text

  it('labels every representative model, and only those', () => {
    for (const [key, m] of Object.entries(manifest.models)) {
      expect(['mine', 'representative'], key).toContain(m.provenance)
      expect(m.label_required, key).toBe(m.provenance === 'representative')
    }
  })
  it('wires only manifest models, through the labelled ClipSpin', () => {
    for (const clip of Object.values(FILM_CLIPS)) {
      expect(manifest.models[clip.model], clip.model).toBeDefined()
      if (manifest.models[clip.model].label_required) {
        expect(spin).toMatch(/clipLabelRequired\(clip\)/)
        expect(spin).toMatch(/ARMAMENT\.representativeAssembly/)
      }
    }
    expect(copy.ARMAMENT.representativeAssembly).toMatch(/^Representative model/)
  })
  it('lets frames reach the screen only through ui/ClipSpin.tsx', () => {
    const allowed = ['clips.ts', 'clipFrames.ts', path.join('ui', 'ClipSpin.tsx')]
    for (const { file, text } of SRC) {
      if (!allowed.includes(file)) expect(text, file).not.toMatch(/clips\/armament/)
      if (file !== path.join('ui', 'ClipSpin.tsx')) expect(text, file).not.toMatch(/from ['"][./]*clipFrames['"]/)
    }
  })
  it('keeps designations, brands and absolute paths out of the clip lane', () => {
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const full = path.join(dir, name)
        return statSync(full).isDirectory() ? [full, ...files(full)] : [full]
      })
    // local-paths.json holds the real source filename and exists only on Mark's machine.
    const lane = files(path.join(HERE, '..', 'clips')).filter((f) => path.basename(f) !== 'local-paths.json')
    const texts = [manifestText, ...lane.filter((f) => path.basename(f) === 'clip.json').map((f) => readFileSync(f, 'utf8'))]
    for (const name of lane.map((f) => path.relative(HERE, f))) {
      expect(name).not.toMatch(DESIGNATION)
      expect(name).not.toMatch(BRAND)
    }
    for (const text of texts) {
      expect(text).not.toMatch(DESIGNATION)
      expect(text).not.toMatch(BRAND)
      expect(text).not.toMatch(ABSOLUTE_PATH)
    }
  })
  it('never names the designation in film sources', () => {
    for (const { file, text } of SRC) expect(text, file).not.toMatch(DESIGNATION)
  })
  it('matches committed clips to their frames (after the frames commit)', () => {
    for (const id of Object.keys(manifest.clips)) {
      const dir = path.join(CLIPS_DIR, id)
      const meta = JSON.parse(readFileSync(path.join(dir, 'clip.json'), 'utf8')) as { frames: number }
      const film = Object.values(FILM_CLIPS).find((c) => c.id === id)
      expect(film, id).toBeDefined()
      expect(meta.frames, id).toBe(film!.frames)
      for (const pass of ['line', 'shade']) {
        const names = readdirSync(path.join(dir, pass)).sort()
        expect(names, `${id}/${pass}`).toHaveLength(film!.frames)
        for (const n of names) expect(n).toMatch(/^f\d{4}\.webp$/)
      }
    }
  })
})

describe('showreel logo lane', () => {
  // Owner 2026-11-08: the Storm Ignition bumper is the approved logo; the film stays silent;
  // the rejected "Precision Revealed" showcase never appears.
  it('plays only the approved bumper, always muted, with no audio track', () => {
    expect(statSync(path.join(HERE, '..', '..', 'public', FILM_LOGO.src)).isFile()).toBe(true)
    for (const { file, text } of SRC) {
      for (const m of text.matchAll(/['"`]\/?(video\/[^'"`]+)['"`]/g)) expect(m[1], file).toBe(FILM_LOGO.src)
      expect(text, file).not.toMatch(/precision-revealed/i)
      expect(text, file).not.toMatch(/<(Audio|Html5Audio)\b/)
      for (const m of text.matchAll(/<(OffthreadVideo|Video|Html5Video)\b[^>]*>/g)) expect(m[0], file).toMatch(/\bmuted\b/)
    }
  })
  it('records the text baked into the bumper so the copy scan covers it', () => {
    expect(copy.LOGO.burnedIn.length).toBeGreaterThan(0)
  })
})

describe('showreel sources', () => {
  it('never loads the third-party M249 models', () => {
    for (const { file, text } of SRC) expect(text, file).not.toMatch(/m249/i)
  })
  it('never puts engineering drawings on screen', () => {
    for (const { file, text } of SRC) expect(text, file).not.toMatch(/home\/drawings\/|home\/stacks\/|['"`/]drawing\//)
  })
})
