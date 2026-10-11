// Page-fade runtime: the cross-page fade shared by every page of the site.
// Zero imports by design. It carries no scroll length and never reads page progress.
//
// Lifecycle. A same-origin `a[data-fade]` click goes: data-fade="out", write FADE_KEY, assign
// the href once. The next page's head shell script reads FADE_KEY (younger than
// FADE_MAX_AGE_MS), sets data-fade="in" and removes the key; the page calls releaseFadeWhen(ready),
// which sets data-fade="release" and removes the attribute FADE_IN_MS later.
//
// Recovery. A navigation that does not unload the page (Stop or Esc, a 204 response, a download,
// an assign that throws) must not leave data-fade="out" on a page whose cover layer is opaque. A
// link that only changes the fragment is never intercepted. After assign, a recovery runs at
// FADE_MAX_AGE_MS and clears "out" and the flag if the page is still here and still "out".
//
// Nothing here runs at module load. defaultEnv() is built when a function is called without an env.

export const FADE_KEY = 'jg:fade'
/** A flag older than this is stale and is ignored by the next page. */
export const FADE_MAX_AGE_MS = 5000
/** The CSS fade-out duration. */
export const FADE_OUT_MS = 400
/** Navigate after this long even if no animationend arrives. */
export const FADE_FALLBACK_MS = 450
/** The keyframe that fades the cover out. The shell fade styles in each page define it. */
export const FADE_OUT_ANIMATION = 'shell-fade-out'
/** The CSS fade-in (release) duration. */
export const FADE_IN_MS = 600
/** How long a caller waits before showing a status line. Caller-owned; the shell only names it. */
export const STATUS_DELAY_MS = 800
/** The longest the fade-in is held for a page that is not ready. */
export const HOLD_CAP_MS = 2500

const ATTRIBUTE = 'data-fade'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Identifies the navigation that owns data-fade="out". A recovery runs only for the navigation
 * that scheduled it: a newer navigation, or a bfcache restore, bumps this and neutralises it.
 */
let navigationSerial = 0

export interface FadeEnv {
  now(): number
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  reducedMotion(): boolean
  assign(href: string): void
  schedule(fn: () => void, ms: number): number
  frame(fn: () => void): number
}

/**
 * The browser environment, bound when called. Safe without a window (every member degrades to a
 * no-op or a plain timer) and safe when sessionStorage or matchMedia throw.
 */
function defaultEnv(): FadeEnv {
  const win = typeof window === 'undefined' ? null : window
  const storage = (): Storage | null => {
    try {
      return win ? win.sessionStorage : null
    } catch {
      return null
    }
  }
  return {
    now: () => Date.now(),
    storage: {
      getItem(key) {
        try {
          return storage()?.getItem(key) ?? null
        } catch {
          return null
        }
      },
      setItem(key, value) {
        try {
          storage()?.setItem(key, value)
        } catch {
          // Private mode or a full quota: the fade degrades to a plain navigation.
        }
      },
      removeItem(key) {
        try {
          storage()?.removeItem(key)
        } catch {
          // Same.
        }
      },
    },
    reducedMotion() {
      try {
        return Boolean(win?.matchMedia?.(REDUCED_MOTION_QUERY).matches)
      } catch {
        return false
      }
    },
    assign(href) {
      win?.location.assign(href)
    },
    schedule: (fn, ms) => setTimeout(fn, ms) as unknown as number,
    frame: (fn) =>
      win && typeof win.requestAnimationFrame === 'function'
        ? win.requestAnimationFrame(() => fn())
        : (setTimeout(fn, 16) as unknown as number),
  }
}

function rootElement(): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.documentElement
}

/** A primary-button click with no modifier that nobody has already handled. */
export function shouldIntercept(
  e: Pick<MouseEvent, 'button' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey' | 'defaultPrevented'>,
): boolean {
  return e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && !e.defaultPrevented
}

/** True for a stored flag that is a finite timestamp, not in the future, younger than FADE_MAX_AGE_MS. */
export function isFreshFlag(raw: string | null, now: number): boolean {
  if (raw === null || raw.trim() === '') return false
  const stamp = Number(raw)
  if (!Number.isFinite(stamp)) return false
  const age = now - stamp
  return age >= 0 && age < FADE_MAX_AGE_MS
}

/**
 * Fade out, then navigate. Reduced motion navigates at once with no flag and no attribute.
 * `assign` runs exactly once: on the root element's own FADE_OUT_ANIMATION animationend (the
 * cover is a keyframe animation, not a transition) or after FADE_FALLBACK_MS, whichever comes
 * first. If assign throws, the attribute and the flag are cleared at once and
 * nothing is rethrown. Otherwise a recovery is scheduled FADE_MAX_AGE_MS after assign.
 */
export function fadeNavigate(href: string, env: FadeEnv = defaultEnv()): void {
  if (env.reducedMotion()) {
    try {
      env.assign(href)
    } catch {
      // Nothing to clear: no attribute and no flag were set on this path.
    }
    return
  }
  const root = rootElement()
  navigationSerial += 1
  const serial = navigationSerial
  root?.setAttribute(ATTRIBUTE, 'out')
  try {
    env.storage.setItem(FADE_KEY, String(env.now()))
  } catch {
    // No flag means no fade-in on the next page; the navigation still happens.
  }
  let done = false
  /** Clears this navigation's "out" and flag, unless something newer or a restore took over. */
  const recover = () => {
    if (serial !== navigationSerial) return
    if (root && root.getAttribute(ATTRIBUTE) !== 'out') return
    root?.removeAttribute(ATTRIBUTE)
    try {
      env.storage.removeItem(FADE_KEY)
    } catch {
      // The flag goes stale on its own after FADE_MAX_AGE_MS.
    }
  }
  const onEnd = (event: Event) => {
    // The cover is the root's ::after, so its animationend targets the root. An animation on a
    // descendant bubbles up here and must not navigate; the release keyframe also ends on the
    // root, and it must not navigate either.
    if (event.target !== root) return
    if ((event as AnimationEvent).animationName !== FADE_OUT_ANIMATION) return
    go()
  }
  const go = () => {
    if (done) return
    done = true
    root?.removeEventListener('animationend', onEnd)
    try {
      env.assign(href)
    } catch {
      recover()
      return
    }
    // Still here FADE_MAX_AGE_MS after assign means the navigation did not unload this page.
    env.schedule(recover, FADE_MAX_AGE_MS)
  }
  root?.addEventListener('animationend', onEnd)
  env.schedule(go, FADE_FALLBACK_MS)
}

/** True when `destination` differs from the current document URL only by its fragment. */
function isFragmentOnly(destination: URL, currentHref: string): boolean {
  if (!destination.href.includes('#')) return false
  try {
    const current = new URL(currentHref)
    return (
      destination.origin === current.origin &&
      destination.pathname === current.pathname &&
      destination.search === current.search
    )
  } catch {
    return false
  }
}

/**
 * Delegated link handling plus bfcache cleanup. Returns an uninstall function that removes both
 * listeners.
 */
export function installPageFade(doc: Document, env: FadeEnv = defaultEnv()): () => void {
  const onClick = (event: MouseEvent) => {
    if (!shouldIntercept(event)) return
    const target = event.target as Element | null
    const anchor = target && typeof target.closest === 'function' ? target.closest('a[data-fade]') : null
    if (!anchor) return
    const raw = anchor.getAttribute('href')
    if (!raw) return
    const where = anchor.getAttribute('target')
    if ((where && where !== '_self') || anchor.hasAttribute('download')) return
    let destination: URL
    try {
      destination = new URL(raw, doc.baseURI)
    } catch {
      return
    }
    if (destination.origin !== doc.location.origin) return
    // A fragment-only link scrolls this document; the browser handles it and nothing fades.
    if (isFragmentOnly(destination, doc.location.href)) return
    event.preventDefault()
    // A navigation is already fading out: a second click must not start another.
    if (doc.documentElement.getAttribute(ATTRIBUTE) === 'out') return
    fadeNavigate(destination.href, env)
  }

  // pageshow fires on the window. persisted means the page came back from the bfcache with
  // whatever attribute and flag it left behind, so both are cleared.
  const onPageShow = (event: Event) => {
    if (!(event as PageTransitionEvent).persisted) return
    navigationSerial += 1
    doc.documentElement.removeAttribute(ATTRIBUTE)
    env.storage.removeItem(FADE_KEY)
  }

  const view: Pick<EventTarget, 'addEventListener' | 'removeEventListener'> = doc.defaultView ?? doc
  doc.addEventListener('click', onClick)
  view.addEventListener('pageshow', onPageShow)
  return () => {
    doc.removeEventListener('click', onClick)
    view.removeEventListener('pageshow', onPageShow)
  }
}

/** data-fade="in" becomes "release", and the attribute is removed FADE_IN_MS later. */
export function releaseFade(env: FadeEnv = defaultEnv()): void {
  const root = rootElement()
  if (!root || root.getAttribute(ATTRIBUTE) !== 'in') return
  root.setAttribute(ATTRIBUTE, 'release')
  env.schedule(() => {
    // A navigation that began during the release owns the attribute now.
    if (root.getAttribute(ATTRIBUTE) === 'release') root.removeAttribute(ATTRIBUTE)
  }, FADE_IN_MS)
}

/**
 * Hold the fade-in until `ready()`, or until HOLD_CAP_MS has passed since this call, then
 * release once. A `ready` that throws counts as not ready.
 */
export function releaseFadeWhen(ready: () => boolean, env: FadeEnv = defaultEnv()): void {
  const start = env.now()
  let released = false
  const check = () => {
    if (released) return
    let isReady = false
    try {
      isReady = ready()
    } catch {
      isReady = false
    }
    if (isReady || env.now() - start >= HOLD_CAP_MS) {
      released = true
      releaseFade(env)
      return
    }
    env.frame(check)
  }
  check()
}

/** Append one `<link rel="prefetch">` per href; a href already prefetched in this document is skipped. */
export function prefetchPage(doc: Document, hrefs: readonly string[]): void {
  if (!doc || !doc.head) return
  const seen = new Set<string>()
  doc.head.querySelectorAll('link[rel="prefetch"]').forEach((node) => {
    const known = node.getAttribute('href')
    if (known) seen.add(known)
  })
  for (const href of hrefs) {
    if (!href || seen.has(href)) continue
    seen.add(href)
    const link = doc.createElement('link')
    link.setAttribute('rel', 'prefetch')
    link.setAttribute('href', href)
    doc.head.appendChild(link)
  }
}
