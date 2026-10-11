import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FADE_FALLBACK_MS,
  FADE_IN_MS,
  FADE_KEY,
  FADE_MAX_AGE_MS,
  FADE_OUT_ANIMATION,
  FADE_OUT_MS,
  HOLD_CAP_MS,
  STATUS_DELAY_MS,
  fadeNavigate,
  installPageFade,
  isFreshFlag,
  prefetchPage,
  releaseFade,
  releaseFadeWhen,
  shouldIntercept,
  type FadeEnv,
} from './pageFade'

// Node environment only: fake env, fake document, fake elements. No jsdom.

type FakeEvent = Record<string, unknown>
type Listener = (event: FakeEvent) => void

function makeTarget() {
  const listeners = new Map<string, Set<Listener>>()
  return {
    listeners,
    addEventListener(type: string, fn: Listener) {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type)?.add(fn)
    },
    removeEventListener(type: string, fn: Listener) {
      listeners.get(type)?.delete(fn)
    },
    dispatch(type: string, event: FakeEvent = {}) {
      for (const fn of [...(listeners.get(type) ?? [])]) fn({ type, ...event })
    },
    listenerCount(type: string) {
      return listeners.get(type)?.size ?? 0
    },
  }
}

interface FakeElement extends ReturnType<typeof makeTarget> {
  tag: string
  parent: FakeElement | null
  setAttribute(name: string, value: string): void
  getAttribute(name: string): string | null
  hasAttribute(name: string): boolean
  removeAttribute(name: string): void
  matches(selector: string): boolean
  closest(selector: string): FakeElement | null
}

function makeElement(tag: string, attrs: Record<string, string> = {}, parent: FakeElement | null = null): FakeElement {
  const map = new Map(Object.entries(attrs))
  const el: FakeElement = {
    ...makeTarget(),
    tag,
    parent,
    setAttribute: (name, value) => void map.set(name, value),
    getAttribute: (name) => map.get(name) ?? null,
    hasAttribute: (name) => map.has(name),
    removeAttribute: (name) => void map.delete(name),
    // The only selector the code under test uses.
    matches: (selector) => selector === 'a[data-fade]' && tag === 'a' && map.has('data-fade'),
    closest: (selector) => {
      for (let node: FakeElement | null = el; node; node = node.parent) if (node.matches(selector)) return node
      return null
    },
  }
  return el
}

/** A fake FadeEnv with a manual clock, manual frames and a recorded assign log. */
function makeEnv(options: { reduced?: boolean; start?: number } = {}) {
  let clock = options.start ?? 100_000
  const store = new Map<string, string>()
  const setItem = vi.fn((key: string, value: string) => void store.set(key, value))
  const removeItem = vi.fn((key: string) => void store.delete(key))
  let timers: { at: number; fn: () => void }[] = []
  let frames: (() => void)[] = []
  const assigns: string[] = []
  const flagAtAssign: (string | null)[] = []
  const env: FadeEnv = {
    now: () => clock,
    storage: { getItem: (key) => store.get(key) ?? null, setItem, removeItem },
    reducedMotion: () => options.reduced ?? false,
    assign: (href) => {
      assigns.push(href)
      flagAtAssign.push(store.get(FADE_KEY) ?? null)
    },
    schedule: (fn, ms) => {
      timers.push({ at: clock + ms, fn })
      return timers.length
    },
    frame: (fn) => {
      frames.push(fn)
      return frames.length
    },
  }
  return {
    env,
    store,
    setItem,
    removeItem,
    assigns,
    flagAtAssign,
    get pendingFrames() {
      return frames.length
    },
    get pendingTimers() {
      return timers.length
    },
    advance(ms: number) {
      const target = clock + ms
      for (;;) {
        const due = timers.filter((timer) => timer.at <= target).sort((a, b) => a.at - b.at)[0]
        if (!due) break
        timers = timers.filter((timer) => timer !== due)
        clock = Math.max(clock, due.at)
        due.fn()
      }
      clock = target
    },
    runFrame(ms = 16) {
      clock += ms
      const batch = frames
      frames = []
      for (const fn of batch) fn()
    },
  }
}

function stubDocumentWithRoot() {
  const root = makeElement('html')
  vi.stubGlobal('document', { documentElement: root })
  return root
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  vi.resetModules()
})

describe('module load', () => {
  it('exposes the contract constants', () => {
    expect(FADE_KEY).toBe('jg:fade')
    expect(FADE_MAX_AGE_MS).toBe(5000)
    expect(FADE_OUT_MS).toBe(400)
    expect(FADE_FALLBACK_MS).toBe(450)
    expect(FADE_OUT_ANIMATION).toBe('shell-fade-out')
    expect(FADE_IN_MS).toBe(600)
    expect(STATUS_DELAY_MS).toBe(800)
    expect(HOLD_CAP_MS).toBe(2500)
  })

  it('importing the module touches no browser global, so defaultEnv never runs at import', async () => {
    // Getter traps on globalThis, not value proxies: a value proxy never sees `typeof window` or a
    // bare `window` read, which is exactly what a module-level defaultEnv() call would do.
    const touched: string[] = []
    const names = ['window', 'document', 'sessionStorage', 'matchMedia', 'location', 'requestAnimationFrame']
    const global = globalThis as Record<string, unknown>
    const saved = names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const)
    try {
      for (const name of names) {
        Object.defineProperty(globalThis, name, {
          configurable: true,
          get() {
            touched.push(name)
            return undefined
          },
        })
      }
      // Control: the traps do see a typeof probe and a bare read.
      expect(typeof global.window).toBe('undefined')
      expect(touched).toEqual(['window'])
      touched.length = 0
      vi.resetModules()
      const fresh = await import('./pageFade')
      expect(fresh.FADE_KEY).toBe('jg:fade')
      expect(touched).toEqual([])
    } finally {
      for (const [name, descriptor] of saved) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor)
        else delete global[name]
      }
    }
  })
})

describe('shouldIntercept', () => {
  const primary = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, defaultPrevented: false }

  it('lets a plain primary click through to the fade', () => {
    expect(shouldIntercept(primary)).toBe(true)
  })

  it.each([
    ['ctrl', { ctrlKey: true }],
    ['meta', { metaKey: true }],
    ['shift', { shiftKey: true }],
    ['alt', { altKey: true }],
    ['middle button', { button: 1 }],
    ['secondary button', { button: 2 }],
    ['an already-prevented event', { defaultPrevented: true }],
  ])('leaves %s alone', (_name, override) => {
    expect(shouldIntercept({ ...primary, ...override })).toBe(false)
  })
})

describe('isFreshFlag', () => {
  const now = 1_000_000

  it('accepts a flag younger than FADE_MAX_AGE_MS', () => {
    expect(isFreshFlag(String(now), now)).toBe(true)
    expect(isFreshFlag(String(now - 1), now)).toBe(true)
    expect(isFreshFlag(String(now - (FADE_MAX_AGE_MS - 1)), now)).toBe(true)
  })

  it('rejects a stale flag, including exactly FADE_MAX_AGE_MS old', () => {
    expect(isFreshFlag(String(now - FADE_MAX_AGE_MS), now)).toBe(false)
    expect(isFreshFlag(String(now - 60_000), now)).toBe(false)
  })

  it('rejects a flag from the future', () => {
    expect(isFreshFlag(String(now + 1), now)).toBe(false)
  })

  it('rejects null, empty and garbage', () => {
    expect(isFreshFlag(null, now)).toBe(false)
    expect(isFreshFlag('', now)).toBe(false)
    expect(isFreshFlag('   ', now)).toBe(false)
    expect(isFreshFlag('soon', now)).toBe(false)
    expect(isFreshFlag('NaN', now)).toBe(false)
    expect(isFreshFlag('Infinity', now)).toBe(false)
  })
})

describe('fadeNavigate', () => {
  it('reduced motion: assigns now, sets no flag and no attribute', () => {
    const root = stubDocumentWithRoot()
    const t = makeEnv({ reduced: true })
    fadeNavigate('/quiet-machine/', t.env)
    expect(t.assigns).toEqual(['/quiet-machine/'])
    expect(t.setItem).not.toHaveBeenCalled()
    expect(root.getAttribute('data-fade')).toBeNull()
    expect(t.pendingTimers).toBe(0)
  })

  it('normal motion: marks out, sets the flag, and assigns only when the fallback fires', () => {
    const root = stubDocumentWithRoot()
    const t = makeEnv({ start: 123_456 })
    fadeNavigate('/quiet-machine/', t.env)
    expect(root.getAttribute('data-fade')).toBe('out')
    expect(t.setItem).toHaveBeenCalledWith(FADE_KEY, '123456')
    expect(t.assigns).toEqual([])
    t.advance(FADE_FALLBACK_MS - 1)
    expect(t.assigns).toEqual([])
    t.advance(1)
    expect(t.assigns).toEqual(['/quiet-machine/'])
  })

  it('has the flag in place at the moment of assign', () => {
    stubDocumentWithRoot()
    const t = makeEnv({ start: 5000 })
    fadeNavigate('/x', t.env)
    t.advance(FADE_FALLBACK_MS)
    expect(t.flagAtAssign).toEqual(['5000'])
  })

  it('animationend first: assigns at once, and the later fallback does not assign again', () => {
    const root = stubDocumentWithRoot()
    const t = makeEnv()
    fadeNavigate('/x', t.env)
    expect(root.listenerCount('animationend')).toBe(1)
    expect(root.listenerCount('transitionend')).toBe(0)
    root.dispatch('animationend', { target: root, animationName: FADE_OUT_ANIMATION, pseudoElement: '::after' })
    expect(t.assigns).toEqual(['/x'])
    expect(root.listenerCount('animationend')).toBe(0)
    t.advance(FADE_FALLBACK_MS * 2)
    expect(t.assigns).toEqual(['/x'])
  })

  it('fallback first: a late animationend does not assign again', () => {
    const root = stubDocumentWithRoot()
    const t = makeEnv()
    fadeNavigate('/x', t.env)
    t.advance(FADE_FALLBACK_MS)
    const end = { target: root, animationName: FADE_OUT_ANIMATION, pseudoElement: '::after' }
    root.dispatch('animationend', end)
    root.dispatch('animationend', end)
    expect(t.assigns).toEqual(['/x'])
    expect(root.listenerCount('animationend')).toBe(0)
  })

  it('ignores an animationend that bubbles up from a child element, even with the cover name', () => {
    const root = stubDocumentWithRoot()
    const child = makeElement('div', {}, root)
    const t = makeEnv()
    fadeNavigate('/x', t.env)
    root.dispatch('animationend', { target: child, animationName: FADE_OUT_ANIMATION, pseudoElement: '' })
    expect(t.assigns).toEqual([])
    t.advance(FADE_FALLBACK_MS)
    expect(t.assigns).toEqual(['/x'])
  })

  it('ignores an animationend of another keyframe on the root (the release keyframe)', () => {
    const root = stubDocumentWithRoot()
    const t = makeEnv()
    fadeNavigate('/x', t.env)
    root.dispatch('animationend', { target: root, animationName: 'shell-fade-release', pseudoElement: '::after' })
    root.dispatch('animationend', { target: root, animationName: '', pseudoElement: '::after' })
    expect(t.assigns).toEqual([])
    t.advance(FADE_FALLBACK_MS)
    expect(t.assigns).toEqual(['/x'])
  })

  it('does not listen for transitionend: a transitionend never navigates', () => {
    const root = stubDocumentWithRoot()
    const t = makeEnv()
    fadeNavigate('/x', t.env)
    // A hostile shape: root target, the cover's keyframe name and pseudo-element. If the onEnd
    // handler were also bound to transitionend this would navigate; the name filter alone does not
    // save it. The dispatch is judged first, then the registration itself.
    root.dispatch('transitionend', {
      target: root,
      animationName: FADE_OUT_ANIMATION,
      pseudoElement: '::after',
      propertyName: 'opacity',
    })
    expect(t.assigns).toEqual([])
    expect(root.listenerCount('transitionend')).toBe(0)
    t.advance(FADE_FALLBACK_MS)
    expect(t.assigns).toEqual(['/x'])
  })

  it('works without a document: flag and assign still happen', () => {
    const t = makeEnv()
    expect(() => fadeNavigate('/x', t.env)).not.toThrow()
    t.advance(FADE_FALLBACK_MS)
    expect(t.setItem).toHaveBeenCalledTimes(1)
    expect(t.assigns).toEqual(['/x'])
  })

  it('still navigates when storage refuses the write', () => {
    stubDocumentWithRoot()
    const t = makeEnv()
    t.setItem.mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => fadeNavigate('/x', t.env)).not.toThrow()
    t.advance(FADE_FALLBACK_MS)
    expect(t.assigns).toEqual(['/x'])
  })
})

describe('releaseFade', () => {
  it('data-fade=in goes to release, then the attribute is removed after FADE_IN_MS', () => {
    const root = stubDocumentWithRoot()
    root.setAttribute('data-fade', 'in')
    const t = makeEnv()
    releaseFade(t.env)
    expect(root.getAttribute('data-fade')).toBe('release')
    t.advance(FADE_IN_MS - 1)
    expect(root.getAttribute('data-fade')).toBe('release')
    t.advance(1)
    expect(root.getAttribute('data-fade')).toBeNull()
  })

  it('does nothing unless data-fade is in', () => {
    const root = stubDocumentWithRoot()
    const t = makeEnv()
    releaseFade(t.env)
    expect(root.getAttribute('data-fade')).toBeNull()
    root.setAttribute('data-fade', 'out')
    releaseFade(t.env)
    expect(root.getAttribute('data-fade')).toBe('out')
    expect(t.pendingTimers).toBe(0)
  })

  it('a second call while releasing schedules nothing more', () => {
    const root = stubDocumentWithRoot()
    root.setAttribute('data-fade', 'in')
    const t = makeEnv()
    releaseFade(t.env)
    releaseFade(t.env)
    expect(t.pendingTimers).toBe(1)
  })

  it('does not strip an out set by a navigation that started during the release', () => {
    const root = stubDocumentWithRoot()
    root.setAttribute('data-fade', 'in')
    const t = makeEnv()
    releaseFade(t.env)
    root.setAttribute('data-fade', 'out')
    t.advance(FADE_IN_MS)
    expect(root.getAttribute('data-fade')).toBe('out')
  })

  it('does not throw without a document', () => {
    const t = makeEnv()
    expect(() => releaseFade(t.env)).not.toThrow()
  })
})

describe('releaseFadeWhen', () => {
  it('releases on the first frame where ready() is true', () => {
    const root = stubDocumentWithRoot()
    root.setAttribute('data-fade', 'in')
    const t = makeEnv()
    let ready = false
    releaseFadeWhen(() => ready, t.env)
    expect(root.getAttribute('data-fade')).toBe('in')
    t.runFrame()
    expect(root.getAttribute('data-fade')).toBe('in')
    ready = true
    t.runFrame()
    expect(root.getAttribute('data-fade')).toBe('release')
    expect(t.pendingFrames).toBe(0)
    t.advance(FADE_IN_MS)
    expect(root.getAttribute('data-fade')).toBeNull()
  })

  it('an already-ready page releases without waiting for a frame', () => {
    const root = stubDocumentWithRoot()
    root.setAttribute('data-fade', 'in')
    const t = makeEnv()
    releaseFadeWhen(() => true, t.env)
    expect(root.getAttribute('data-fade')).toBe('release')
    expect(t.pendingFrames).toBe(0)
  })

  it('a ready that never comes still releases at HOLD_CAP_MS, then polling stops', () => {
    const root = stubDocumentWithRoot()
    root.setAttribute('data-fade', 'in')
    const t = makeEnv()
    const ready = vi.fn(() => false)
    releaseFadeWhen(ready, t.env)
    let elapsed = 0
    while (root.getAttribute('data-fade') === 'in' && elapsed < HOLD_CAP_MS * 2) {
      t.runFrame(100)
      elapsed += 100
    }
    expect(elapsed).toBe(HOLD_CAP_MS)
    expect(root.getAttribute('data-fade')).toBe('release')
    expect(t.pendingFrames).toBe(0)
    const callsAtRelease = ready.mock.calls.length
    t.runFrame(100)
    t.runFrame(100)
    expect(ready.mock.calls.length).toBe(callsAtRelease)
  })

  it('holds just under the cap', () => {
    const root = stubDocumentWithRoot()
    root.setAttribute('data-fade', 'in')
    const t = makeEnv()
    releaseFadeWhen(() => false, t.env)
    t.runFrame(HOLD_CAP_MS - 1)
    expect(root.getAttribute('data-fade')).toBe('in')
    expect(t.pendingFrames).toBe(1)
  })

  it('releases exactly once when ready turns true after a release', () => {
    const root = stubDocumentWithRoot()
    root.setAttribute('data-fade', 'in')
    const t = makeEnv()
    let ready = false
    releaseFadeWhen(() => ready, t.env)
    t.runFrame(HOLD_CAP_MS)
    ready = true
    t.runFrame()
    t.runFrame()
    expect(t.pendingTimers).toBe(1)
    expect(t.pendingFrames).toBe(0)
  })

  it('treats a throwing ready() as not ready, and the cap still releases', () => {
    const root = stubDocumentWithRoot()
    root.setAttribute('data-fade', 'in')
    const t = makeEnv()
    releaseFadeWhen(() => {
      throw new Error('not mounted')
    }, t.env)
    t.runFrame(HOLD_CAP_MS)
    expect(root.getAttribute('data-fade')).toBe('release')
  })
})

describe('installPageFade', () => {
  function setup(
    env: FadeEnv,
    location = { origin: 'https://x.test', href: 'https://x.test/jgun/' },
    baseURI: string = location.href,
  ) {
    const root = makeElement('html')
    const view = makeTarget()
    const doc = Object.assign(makeTarget(), { documentElement: root, defaultView: view, baseURI, location })
    vi.stubGlobal('document', doc)
    const uninstall = installPageFade(doc as unknown as Document, env)
    return { root, view, doc, uninstall }
  }

  function link(attrs: Record<string, string>) {
    const anchor = makeElement('a', attrs)
    const inner = makeElement('span', {}, anchor)
    return { anchor, inner }
  }

  function click(target: FakeElement, override: FakeEvent = {}) {
    let prevented = 0
    const event: FakeEvent = {
      button: 0,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      defaultPrevented: false,
      target,
      preventDefault() {
        prevented += 1
        event.defaultPrevented = true
      },
      ...override,
    }
    return { event, prevented: () => prevented }
  }

  it('a primary click on a data-fade link (or inside it) fades out, then navigates once', () => {
    const t = makeEnv({ start: 7000 })
    const { root, doc } = setup(t.env)
    const { inner } = link({ href: '/quiet-machine/', 'data-fade': '' })
    const { event, prevented } = click(inner)
    doc.dispatch('click', event)
    expect(prevented()).toBe(1)
    expect(root.getAttribute('data-fade')).toBe('out')
    expect(t.setItem).toHaveBeenCalledWith(FADE_KEY, '7000')
    expect(t.assigns).toEqual([])
    t.advance(FADE_FALLBACK_MS)
    expect(t.assigns).toEqual(['https://x.test/quiet-machine/'])
  })

  it('a second click during the fade-out is swallowed and does not start another navigation', () => {
    const t = makeEnv()
    const { doc } = setup(t.env)
    const { anchor } = link({ href: '/quiet-machine/', 'data-fade': '' })
    doc.dispatch('click', click(anchor).event)
    const second = click(anchor)
    doc.dispatch('click', second.event)
    expect(second.prevented()).toBe(1)
    t.advance(FADE_FALLBACK_MS * 2)
    expect(t.assigns).toEqual(['https://x.test/quiet-machine/'])
    expect(t.setItem).toHaveBeenCalledTimes(1)
  })

  it('resolves a relative href against the document base', () => {
    const t = makeEnv()
    const { doc } = setup(t.env)
    const { anchor } = link({ href: '../m249/?quality=lite', 'data-fade': '' })
    doc.dispatch('click', click(anchor).event)
    t.advance(FADE_FALLBACK_MS)
    expect(t.assigns).toEqual(['https://x.test/m249/?quality=lite'])
  })

  it.each([
    ['a/', 'https://x.test/dir/page/a/'],
    ['../x', 'https://x.test/dir/x'],
  ])('resolves %s against baseURI, which differs from location.href', (href, expected) => {
    const t = makeEnv()
    const { doc } = setup(t.env, { origin: 'https://x.test', href: 'https://x.test/' }, 'https://x.test/dir/page/')
    const { anchor } = link({ href, 'data-fade': '' })
    doc.dispatch('click', click(anchor).event)
    t.advance(FADE_FALLBACK_MS)
    expect(t.assigns).toEqual([expected])
  })

  describe('a link that only changes the fragment', () => {
    it.each([
      ['a bare fragment', '#details'],
      ['an empty fragment', '#'],
      ['the same path with a fragment', '/jgun/#details'],
      ['the absolute same URL with a fragment', 'https://x.test/jgun/#details'],
    ])('%s is left to the browser: no prevent, no fade, no flag, no assign', (_name, href) => {
      const t = makeEnv()
      const { root, doc } = setup(t.env)
      const { anchor } = link({ href, 'data-fade': '' })
      const { event, prevented } = click(anchor)
      doc.dispatch('click', event)
      t.advance(FADE_MAX_AGE_MS * 2)
      expect(prevented()).toBe(0)
      expect(root.getAttribute('data-fade')).toBeNull()
      expect(t.setItem).not.toHaveBeenCalled()
      expect(t.assigns).toEqual([])
    })

    it('still fades for another path with a fragment, and for the same path with another query', () => {
      for (const [href, expected] of [
        ['/quiet-machine/#air', 'https://x.test/quiet-machine/#air'],
        ['/jgun/?quality=lite#air', 'https://x.test/jgun/?quality=lite#air'],
      ]) {
        const t = makeEnv()
        const { doc } = setup(t.env)
        const { anchor } = link({ href, 'data-fade': '' })
        const { event, prevented } = click(anchor)
        doc.dispatch('click', event)
        expect(prevented()).toBe(1)
        t.advance(FADE_FALLBACK_MS)
        expect(t.assigns).toEqual([expected])
      }
    })

    it('is compared with the document location, so a fragment under another base is a real navigation', () => {
      const t = makeEnv()
      const { doc } = setup(t.env, { origin: 'https://x.test', href: 'https://x.test/' }, 'https://x.test/dir/page/')
      const { anchor } = link({ href: '#top', 'data-fade': '' })
      const { event, prevented } = click(anchor)
      doc.dispatch('click', event)
      expect(prevented()).toBe(1)
      t.advance(FADE_FALLBACK_MS)
      expect(t.assigns).toEqual(['https://x.test/dir/page/#top'])
    })
  })

  describe('recovery when the navigation does not unload the page', () => {
    function clickLink(doc: ReturnType<typeof setup>['doc'], href = '/quiet-machine/') {
      const { anchor } = link({ href, 'data-fade': '' })
      const { event, prevented } = click(anchor)
      doc.dispatch('click', event)
      return prevented
    }

    it('an assign that throws clears out and the flag at once and rethrows nothing', () => {
      const t = makeEnv()
      const { root, doc } = setup(t.env)
      t.env.assign = () => {
        throw new Error('blocked')
      }
      clickLink(doc)
      expect(root.getAttribute('data-fade')).toBe('out')
      expect(t.store.has(FADE_KEY)).toBe(true)
      expect(() => t.advance(FADE_FALLBACK_MS)).not.toThrow()
      expect(root.getAttribute('data-fade')).toBeNull()
      expect(t.store.has(FADE_KEY)).toBe(false)
      expect(t.pendingTimers).toBe(0)
    })

    it('an assign that never unloads the page recovers at exactly FADE_MAX_AGE_MS after assign, not before', () => {
      const t = makeEnv()
      const { root, doc } = setup(t.env)
      clickLink(doc)
      t.advance(FADE_FALLBACK_MS)
      expect(t.assigns).toEqual(['https://x.test/quiet-machine/'])
      expect(root.getAttribute('data-fade')).toBe('out')
      t.advance(FADE_MAX_AGE_MS - 1)
      expect(root.getAttribute('data-fade')).toBe('out')
      expect(t.store.has(FADE_KEY)).toBe(true)
      t.advance(1)
      expect(root.getAttribute('data-fade')).toBeNull()
      expect(t.store.has(FADE_KEY)).toBe(false)
    })

    it('a second click after recovery navigates normally', () => {
      const t = makeEnv()
      const { root, doc } = setup(t.env)
      clickLink(doc)
      t.advance(FADE_FALLBACK_MS + FADE_MAX_AGE_MS)
      expect(root.getAttribute('data-fade')).toBeNull()
      const prevented = clickLink(doc, '/m249/')
      expect(prevented()).toBe(1)
      expect(root.getAttribute('data-fade')).toBe('out')
      t.advance(FADE_FALLBACK_MS)
      expect(t.assigns).toEqual(['https://x.test/quiet-machine/', 'https://x.test/m249/'])
    })

    it('a persisted pageshow and a newer navigation neutralise the older recovery', () => {
      const t = makeEnv()
      const { root, view, doc } = setup(t.env)
      clickLink(doc)
      t.advance(FADE_FALLBACK_MS)
      t.advance(1000)
      view.dispatch('pageshow', { persisted: true })
      expect(root.getAttribute('data-fade')).toBeNull()
      clickLink(doc, '/m249/')
      expect(root.getAttribute('data-fade')).toBe('out')
      // The first navigation's recovery falls due inside this window and must not strip the
      // second one's out; the second navigation's own recovery is still ahead.
      t.advance(FADE_MAX_AGE_MS)
      expect(t.assigns).toEqual(['https://x.test/quiet-machine/', 'https://x.test/m249/'])
      expect(root.getAttribute('data-fade')).toBe('out')
      expect(t.store.has(FADE_KEY)).toBe(true)
      t.advance(FADE_MAX_AGE_MS)
      expect(root.getAttribute('data-fade')).toBeNull()
    })

    it('a bfcache restore alone neutralises the recovery, even if the attribute reads out again', () => {
      const t = makeEnv()
      const { root, view, doc } = setup(t.env)
      clickLink(doc)
      t.advance(FADE_FALLBACK_MS)
      view.dispatch('pageshow', { persisted: true })
      root.setAttribute('data-fade', 'out')
      t.advance(FADE_MAX_AGE_MS)
      expect(root.getAttribute('data-fade')).toBe('out')
    })

    it('reduced motion schedules no recovery, and an assign that throws is swallowed', () => {
      const t = makeEnv({ reduced: true })
      const { root, doc } = setup(t.env)
      t.env.assign = () => {
        throw new Error('blocked')
      }
      expect(() => clickLink(doc)).not.toThrow()
      expect(root.getAttribute('data-fade')).toBeNull()
      expect(t.pendingTimers).toBe(0)
    })
  })

  it.each([
    ['a link without data-fade', { href: '/quiet-machine/' }, {}],
    ['a cross-origin href', { href: 'https://other.test/', 'data-fade': '' }, {}],
    ['a different scheme', { href: 'http://x.test/', 'data-fade': '' }, {}],
    ['a link with no href', { 'data-fade': '' }, {}],
    ['a link that opens elsewhere', { href: '/a/', 'data-fade': '', target: '_blank' }, {}],
    ['a download link', { href: '/a.pdf', 'data-fade': '', download: '' }, {}],
    ['a ctrl click', { href: '/a/', 'data-fade': '' }, { ctrlKey: true }],
    ['a meta click', { href: '/a/', 'data-fade': '' }, { metaKey: true }],
    ['a shift click', { href: '/a/', 'data-fade': '' }, { shiftKey: true }],
    ['an alt click', { href: '/a/', 'data-fade': '' }, { altKey: true }],
    ['a middle click', { href: '/a/', 'data-fade': '' }, { button: 1 }],
    ['an already-prevented click', { href: '/a/', 'data-fade': '' }, { defaultPrevented: true }],
  ])('leaves %s alone', (_name, attrs, override) => {
    const t = makeEnv()
    const { root, doc } = setup(t.env)
    const { anchor } = link(attrs)
    const { event, prevented } = click(anchor, override)
    doc.dispatch('click', event)
    t.advance(FADE_FALLBACK_MS * 2)
    expect(prevented()).toBe(0)
    expect(root.getAttribute('data-fade')).toBeNull()
    expect(t.setItem).not.toHaveBeenCalled()
    expect(t.assigns).toEqual([])
  })

  it('leaves a click on a non-link element alone', () => {
    const t = makeEnv()
    const { doc } = setup(t.env)
    const { event, prevented } = click(makeElement('div'))
    doc.dispatch('click', event)
    expect(prevented()).toBe(0)
    expect(t.assigns).toEqual([])
  })

  it('under reduced motion a click navigates at once and sets no flag', () => {
    const t = makeEnv({ reduced: true })
    const { root, doc } = setup(t.env)
    const { anchor } = link({ href: '/quiet-machine/', 'data-fade': '' })
    doc.dispatch('click', click(anchor).event)
    expect(t.assigns).toEqual(['https://x.test/quiet-machine/'])
    expect(t.setItem).not.toHaveBeenCalled()
    expect(root.getAttribute('data-fade')).toBeNull()
  })

  it('a persisted pageshow (bfcache) clears data-fade and the flag', () => {
    const t = makeEnv()
    const { root, view } = setup(t.env)
    root.setAttribute('data-fade', 'out')
    t.store.set(FADE_KEY, '99')
    view.dispatch('pageshow', { persisted: true })
    expect(root.getAttribute('data-fade')).toBeNull()
    expect(t.removeItem).toHaveBeenCalledWith(FADE_KEY)
    expect(t.store.has(FADE_KEY)).toBe(false)
  })

  it('a pageshow that is not persisted leaves the attribute and the flag', () => {
    const t = makeEnv()
    const { root, view } = setup(t.env)
    root.setAttribute('data-fade', 'in')
    t.store.set(FADE_KEY, '99')
    view.dispatch('pageshow', { persisted: false })
    expect(root.getAttribute('data-fade')).toBe('in')
    expect(t.removeItem).not.toHaveBeenCalled()
    expect(t.store.get(FADE_KEY)).toBe('99')
  })

  it('the returned uninstall removes both listeners and the page is left alone afterwards', () => {
    const t = makeEnv()
    const { root, view, doc, uninstall } = setup(t.env)
    expect(doc.listenerCount('click')).toBe(1)
    expect(view.listenerCount('pageshow')).toBe(1)
    uninstall()
    expect(doc.listenerCount('click')).toBe(0)
    expect(view.listenerCount('pageshow')).toBe(0)
    root.setAttribute('data-fade', 'out')
    view.dispatch('pageshow', { persisted: true })
    expect(root.getAttribute('data-fade')).toBe('out')
    const { anchor } = link({ href: '/quiet-machine/', 'data-fade': '' })
    const { event, prevented } = click(anchor)
    doc.dispatch('click', event)
    expect(prevented()).toBe(0)
  })

  it('install twice with two uninstalls leaves no listener behind', () => {
    const t = makeEnv()
    const first = setup(t.env)
    const second = installPageFade(first.doc as unknown as Document, t.env)
    expect(first.doc.listenerCount('click')).toBe(2)
    first.uninstall()
    second()
    expect(first.doc.listenerCount('click')).toBe(0)
    expect(first.view.listenerCount('pageshow')).toBe(0)
  })
})

describe('prefetchPage', () => {
  function makeHeadDoc(existing: string[] = []) {
    const links: FakeElement[] = existing.map((href) => makeElement('link', { rel: 'prefetch', href }))
    const doc = {
      head: {
        appendChild: (node: FakeElement) => {
          links.push(node)
          return node
        },
        querySelectorAll: () => links.filter((node) => node.getAttribute('rel') === 'prefetch'),
      },
      createElement: (tag: string) => makeElement(tag),
    }
    return { doc: doc as unknown as Document, links }
  }

  it('appends one prefetch link per href, deduplicated', () => {
    const { doc, links } = makeHeadDoc()
    prefetchPage(doc, ['/quiet-machine/', '/m249/', '/quiet-machine/'])
    expect(links.map((node) => [node.getAttribute('rel'), node.getAttribute('href')])).toEqual([
      ['prefetch', '/quiet-machine/'],
      ['prefetch', '/m249/'],
    ])
  })

  it('does not repeat a link already in the head, across calls', () => {
    const { doc, links } = makeHeadDoc(['/quiet-machine/'])
    prefetchPage(doc, ['/quiet-machine/', '/m249/'])
    prefetchPage(doc, ['/m249/'])
    expect(links.map((node) => node.getAttribute('href'))).toEqual(['/quiet-machine/', '/m249/'])
  })

  it('skips empty hrefs and handles an empty list', () => {
    const { doc, links } = makeHeadDoc()
    prefetchPage(doc, ['', '/a/'])
    prefetchPage(doc, [])
    expect(links.map((node) => node.getAttribute('href'))).toEqual(['/a/'])
  })

  it('never throws on a null document or a document without a head', () => {
    expect(() => prefetchPage(null as unknown as Document, ['/a/'])).not.toThrow()
    expect(() => prefetchPage({} as unknown as Document, ['/a/'])).not.toThrow()
  })
})

describe('the default env, built at call time', () => {
  it('is inert and silent without a window, a document or sessionStorage', () => {
    vi.useFakeTimers()
    expect(() => fadeNavigate('/x')).not.toThrow()
    vi.advanceTimersByTime(FADE_FALLBACK_MS)
    expect(() => releaseFade()).not.toThrow()
    expect(() => releaseFadeWhen(() => true)).not.toThrow()
  })

  it('binds window.location.assign and the reduced-motion media query', () => {
    const assign = vi.fn()
    const matchMedia = vi.fn(() => ({ matches: true }))
    vi.stubGlobal('window', { location: { assign }, matchMedia })
    fadeNavigate('/quiet-machine/')
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    expect(assign).toHaveBeenCalledWith('/quiet-machine/')
  })

  it('binds sessionStorage and navigates after the fallback when motion is allowed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(424_242)
    const assign = vi.fn()
    const setItem = vi.fn()
    vi.stubGlobal('window', { location: { assign }, matchMedia: () => ({ matches: false }), sessionStorage: { setItem } })
    fadeNavigate('/x')
    expect(setItem).toHaveBeenCalledWith(FADE_KEY, '424242')
    expect(assign).not.toHaveBeenCalled()
    vi.advanceTimersByTime(FADE_FALLBACK_MS)
    expect(assign).toHaveBeenCalledWith('/x')
  })

  it('survives a sessionStorage that throws on access', () => {
    vi.useFakeTimers()
    const assign = vi.fn()
    const hostile = {
      location: { assign },
      matchMedia: () => ({ matches: false }),
      get sessionStorage(): never {
        throw new Error('SecurityError')
      },
    }
    vi.stubGlobal('window', hostile)
    expect(() => fadeNavigate('/x')).not.toThrow()
    vi.advanceTimersByTime(FADE_FALLBACK_MS)
    expect(assign).toHaveBeenCalledTimes(1)
  })

  it('polls with requestAnimationFrame when the window has one', () => {
    const root = stubDocumentWithRoot()
    root.setAttribute('data-fade', 'in')
    const queue: (() => void)[] = []
    vi.stubGlobal('window', { requestAnimationFrame: (fn: () => void) => queue.push(fn) })
    let ready = false
    releaseFadeWhen(() => ready)
    expect(queue).toHaveLength(1)
    ready = true
    queue.shift()?.()
    expect(root.getAttribute('data-fade')).toBe('release')
  })
})
