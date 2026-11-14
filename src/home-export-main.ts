import { arcGeometry, arcPlace } from './home/arcMath'
import { CONTACT, CORE_PROJECTS, STACKS } from './home/content'
import { installPageFade, releaseFadeWhen } from './shared/pageFade'
import './home/export-fonts.css'
import './home/export.css'

// The approved exported document owns the page structure. This module only supplies
// the ordinary website controls that the design canvas represents visually.
const root = document.querySelector<HTMLElement>('[data-home-design]')
if (!root) throw new Error('Missing approved homepage document')
installPageFade(document)
const reduced = matchMedia('(prefers-reduced-motion: reduce)')
const themeButton = root.querySelector<HTMLButtonElement>('.design-header > button')
const syncTheme = () => {
  const dark = document.documentElement.dataset.theme !== 'light'
  themeButton?.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme')
  themeButton?.setAttribute('aria-pressed', String(dark))
}
themeButton?.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem('sm:theme', theme)
  } catch {
    /* Theme still works without storage. */
  }
  syncTheme()
})
syncTheme()

root.querySelectorAll<HTMLElement>('.design-gallery').forEach((gallery, index) => {
  const project = CORE_PROJECTS[index]
  const images = STACKS[project.id] ?? []
  if (!images.length) return
  const caption = gallery.querySelector<HTMLElement>('.design-caption')!
  const heading = caption.querySelector<HTMLElement>('h3')!
  const number = caption.querySelector<HTMLElement>('p')!
  const meta = heading.nextElementSibling
  const originalTitle = heading.textContent || ''
  const controls = [...caption.querySelectorAll<HTMLButtonElement>('button')]
  gallery.setAttribute('aria-roledescription', 'carousel')
  const live = document.createElement('p')
  live.className = 'design-sr'
  live.setAttribute('aria-live', 'polite')
  gallery.append(live)
  const cards = [...gallery.querySelectorAll<HTMLImageElement>('img[data-wheel-offset]')].map((image) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'design-card'
    button.style.cssText = image.style.cssText
    button.style.border = '0'
    button.style.margin = '0'
    button.style.boxSizing = 'border-box'
    const offset = Number(image.dataset.wheelOffset)
    image.replaceWith(button)
    button.append(image)
    image.removeAttribute('style')
    image.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none'
    return { button, image, offset }
  })
  let position = 0
  let target = 0
  let frame = 0
  let active = -1
  let ignoreClickUntil = 0
  let dragging: { y: number; start: number; moved: boolean } | null = null
  const wrap = (value: number) => ((value % images.length) + images.length) % images.length
  const paint = () => {
    const cardFocused = cards.some(({ button }) => button === document.activeElement)
    const base = Math.floor(position)
    const fraction = position - base
    const geometry = arcGeometry(gallery.clientWidth, gallery.clientHeight)
    if (innerWidth < 1000) geometry.hubY = gallery.clientHeight * 0.3
    const current = Math.min(images.length - 1, Math.max(0, Math.round(position)))
    for (const { button, image, offset } of cards) {
      const imageIndex = wrap(base + offset)
      const item = images[imageIndex]
      const place = arcPlace(offset - fraction, 15, geometry)
      button.style.left = `${Math.round(place.x - geometry.cardW / 2)}px`
      button.style.top = `${Math.round(place.y - geometry.cardH / 2)}px`
      button.style.width = `${geometry.cardW}px`
      button.style.height = `${Math.round(geometry.cardH)}px`
      button.style.transform = `rotate(${place.rot}deg)`
      button.style.padding = project.id === 'torque-wrench' && imageIndex === 0 ? '7px' : '0'
      image.style.objectFit = project.id === 'torque-wrench' && imageIndex === 0 ? 'contain' : 'cover'
      if (image.getAttribute('src') !== item.src) image.src = item.src
      image.alt = imageIndex === 0 && project.id === 'armament' ? 'Billet lower receiver, CAD render' : item.label
      button.setAttribute('aria-label', `${project.title}: ${image.alt}`)
      const selected = imageIndex === current && offset === current - base
      button.tabIndex = selected ? 0 : -1
      button.setAttribute('aria-current', String(selected))
      button.setAttribute('aria-hidden', String(!selected))
    }
    if (current !== active) {
      active = current
      heading.textContent = current === 0 ? originalTitle : images[current].label
      if (meta)
        meta.textContent = `${project.number} · ${project.title} · ${images[current].kind === 'drawing' ? 'Drawing' : images[current].kind === 'photo' ? 'Photo' : 'Render'}`
      number.textContent = `${String(current + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`
      live.textContent = `Image ${current + 1} of ${images.length}: ${heading.textContent}`
      controls[0]?.setAttribute('aria-disabled', String(current === 0))
      controls[1]?.setAttribute('aria-disabled', String(current === images.length - 1))
    }
    if (cardFocused) cards.find(({ button }) => button.tabIndex === 0)?.button.focus({ preventScroll: true })
  }
  const go = (next: number) => {
    target = Math.max(0, Math.min(images.length - 1, next))
    cancelAnimationFrame(frame)
    const start = position,
      began = performance.now()
    const tick = (now: number) => {
      const progress = reduced.matches ? 1 : Math.min(1, (now - began) / 360)
      position = start + (target - start) * (1 - (1 - progress) ** 3)
      paint()
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  }
  controls[0]?.addEventListener('click', () => {
    if (target > 0) go(target - 1)
  })
  controls[1]?.addEventListener('click', () => {
    if (target < images.length - 1) go(target + 1)
  })
  gallery.addEventListener('keydown', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) return
    if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      go(
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? images.length - 1
            : target + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1),
      )
    }
  })
  cards.forEach(({ button, offset }) =>
    button.addEventListener('click', () => {
      if (performance.now() >= ignoreClickUntil) go(wrap(Math.floor(position) + offset))
    }),
  )
  gallery.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || !(event.target instanceof Element) || !event.target.closest('.design-card'))
      return
    dragging = { y: event.clientY, start: target, moved: false }
  })
  gallery.addEventListener('pointermove', (event) => {
    if (!dragging) return
    const distance = dragging.y - event.clientY
    if (Math.abs(distance) > 8) {
      dragging.moved = true
      gallery.setPointerCapture(event.pointerId)
    }
    if (dragging.moved) {
      cancelAnimationFrame(frame)
      position = Math.max(0, Math.min(images.length - 1, dragging.start + distance / 180))
      paint()
    }
  })
  gallery.addEventListener('pointerup', () => {
    if (dragging?.moved) {
      ignoreClickUntil = performance.now() + 100
      go(Math.round(position))
    }
    dragging = null
  })
  gallery.addEventListener('pointercancel', () => {
    dragging = null
    go(Math.round(position))
  })
  // The page keeps native vertical scrolling. Wheel/key interaction is scoped to
  // explicitly focused gallery controls, never a full-page scroll trap.
  gallery.addEventListener(
    'wheel',
    (event) => {
      if (!gallery.contains(document.activeElement) || Math.abs(event.deltaY) < 12) return
      const next = target + Math.sign(event.deltaY)
      if (next < 0 || next >= images.length) return
      event.preventDefault()
      go(next)
    },
    { passive: false },
  )
  new ResizeObserver(paint).observe(gallery)
  paint()
})

const pull = root.querySelector<HTMLButtonElement>('button[aria-label="Pull the thread"]')
pull?.addEventListener('click', () => {
  const parent = pull.parentElement!
  const line = parent.querySelector('svg path')
  const straight = pull.getAttribute('aria-pressed') !== 'true'
  if (!line?.getAttribute('data-tangled')) line?.setAttribute('data-tangled', line.getAttribute('d') || '')
  line?.setAttribute('d', straight ? 'M6 110H700' : line.getAttribute('data-tangled') || '')
  pull.setAttribute('aria-pressed', String(straight))
  pull.style.left = straight ? `${Math.max(0, parent.clientWidth - 44)}px` : '269px'
  if (parent.nextElementSibling) parent.nextElementSibling.textContent = straight ? CONTACT.pulled : CONTACT.pull
})

const drawings = root.querySelector<HTMLElement>('.design-drawings')
if (drawings && matchMedia('(hover:hover)').matches) {
  const loupe = drawings.cloneNode(true) as HTMLElement
  loupe.classList.add('design-loupe')
  for (const child of loupe.children) (child as HTMLElement).style.opacity = '0.7'
  drawings.after(loupe)
  root.addEventListener('pointermove', (event) => {
    const rect = root.getBoundingClientRect(),
      x = event.clientX - rect.left,
      y = event.clientY - rect.top
    loupe.style.maskImage = `radial-gradient(circle 105px at ${x}px ${y + 10}px,#000 65%,transparent 100%)`
    loupe.style.visibility = y < 900 ? 'visible' : 'hidden'
  })
  root.addEventListener('pointerleave', () => {
    loupe.style.visibility = 'hidden'
  })
}
let fontsReady = false
void document.fonts.ready.then(() => {
  fontsReady = true
  root.dataset.ready = ''
})
releaseFadeWhen(() => fontsReady)
