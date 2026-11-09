import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'
import { DRAWING_LAYERS } from './content'
import type { ProjectId } from './content'
import {
  COARSE_QUERY,
  LOUPE_RADIUS,
  LOUPE_RADIUS_PHONE,
  PHONE_QUERY,
  REDUCED_QUERY,
  focusRole,
  focusTransform,
  ghostOpacity,
  layerBox,
  scrollTransform,
  sweepPosition,
  transformCss,
  visibleLayers,
} from './vaultMath'
import type { Viewport } from './vaultMath'
import './vault.css'

export interface VaultProps {
  /** The project whose drawings come forward (hover preview), or null for the resting state. */
  focus: ProjectId | null
}

function useMedia(query: string): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', notify)
      return () => list.removeEventListener('change', notify)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

function readViewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight }
}

// Ghost drawing layers + loupe. Fixed, behind content, aria-hidden, no pointer events.
// Scroll drift is written straight to the drift wrappers in one rAF; focus is a CSS transition on
// the inner layer, so the two never fight. Only transform, opacity and the loupe mask vars change.
export default function Vault({ focus }: VaultProps) {
  const phone = useMedia(PHONE_QUERY)
  const reduced = useMedia(REDUCED_QUERY)
  const coarse = useMedia(COARSE_QUERY)
  const [viewport, setViewport] = useState<Viewport>(readViewport)
  const viewportRef = useRef(viewport)
  viewportRef.current = viewport

  const rootRef = useRef<HTMLDivElement>(null)
  const loupeRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const drifts = useRef(new Map<string, HTMLDivElement>())

  const layers = visibleLayers(DRAWING_LAYERS, { phone, reduced })
  const loupeOn = !reduced
  const radius = phone ? LOUPE_RADIUS_PHONE : LOUPE_RADIUS

  // Resize: the only place the viewport is measured. Height-only jitter (mobile URL bar) is ignored.
  useEffect(() => {
    let frame = 0
    const onResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = readViewport()
        const prev = viewportRef.current
        if (next.width !== prev.width || Math.abs(next.height - prev.height) > 100) setViewport(next)
      })
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Scroll drift (+ the touch loupe sweep): one rAF per scroll change, transform writes only.
  useLayoutEffect(() => {
    let frame = 0
    let applied = Number.NaN
    const byId = new Map(layers.map((layer) => [layer.id, layer]))
    const apply = () => {
      frame = 0
      const y = window.scrollY
      if (y === applied) return
      applied = y
      drifts.current.forEach((el, key) => {
        const layer = byId.get(key.slice(key.indexOf(':') + 1))
        if (layer) el.style.transform = transformCss(scrollTransform(layer, y, reduced))
      })
      if (loupeOn && coarse) moveLoupe(sweepPosition(y, viewportRef.current))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply)
    }
    apply()
    if (loupeOn && coarse) rootRef.current?.setAttribute('data-loupe', 'on')
    if (reduced) return // static layers, no loupe
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
    // layers is derived from phone/reduced; viewport changes re-place the sweep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, reduced, coarse, loupeOn, viewport])

  // Pointer loupe (fine pointers only): hidden until the first move, fades when the pointer leaves.
  useEffect(() => {
    const root = rootRef.current
    if (!loupeOn || coarse || !root) return
    root.removeAttribute('data-loupe')
    let frame = 0
    let x = 0
    let y = 0
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      x = event.clientX
      y = event.clientY
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0
          moveLoupe({ x, y })
          root.setAttribute('data-loupe', 'on')
        })
    }
    const onOut = (event: PointerEvent) => {
      if (!event.relatedTarget) root.setAttribute('data-loupe', 'off')
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerout', onOut, { passive: true })
    document.documentElement.addEventListener('mouseleave', onOut as unknown as EventListener)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerout', onOut)
      document.documentElement.removeEventListener('mouseleave', onOut as unknown as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loupeOn, coarse])

  function moveLoupe(p: { x: number; y: number }) {
    const plane = loupeRef.current
    const ring = ringRef.current
    if (plane) {
      plane.style.setProperty('--lx', `${p.x.toFixed(1)}px`)
      plane.style.setProperty('--ly', `${p.y.toFixed(1)}px`)
    }
    if (ring) ring.style.transform = `translate3d(${(p.x - radius).toFixed(1)}px, ${(p.y - radius).toFixed(1)}px, 0)`
  }

  const setDrift = (key: string) => (el: HTMLDivElement | null) => {
    if (el) drifts.current.set(key, el)
    else drifts.current.delete(key)
  }

  const renderPlane = (plane: 'ghost' | 'loupe') =>
    layers.map((layer) => {
      const box = layerBox(layer, viewport, phone)
      const role = focusRole(layer, focus)
      const ft = focusTransform(layer, role, viewport, reduced)
      const driftStyle: CSSProperties = {
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
      }
      const mask = `url("${layer.src}")`
      const layerStyle: CSSProperties = {
        maskImage: mask,
        WebkitMaskImage: mask,
        transform: transformCss(ft),
        opacity: plane === 'ghost' ? ghostOpacity(role) : role === 'dimmed' ? 0.35 : 1,
      }
      return (
        <div key={layer.id} ref={setDrift(`${plane}:${layer.id}`)} className="home-vault-drift" style={driftStyle}>
          <div className="home-vault-layer" data-layer={layer.id} data-role={role} style={layerStyle} />
        </div>
      )
    })

  return (
    <div ref={rootRef} className="home-vault" aria-hidden="true" data-loupe="off">
      <div className="home-vault-plane home-vault-ghost">{renderPlane('ghost')}</div>
      {loupeOn && (
        <>
          <div
            ref={loupeRef}
            className="home-vault-plane home-vault-loupe"
            style={{ '--lr': `${radius}px` } as CSSProperties}
          >
            {renderPlane('loupe')}
          </div>
          <div ref={ringRef} className="home-vault-ring" style={{ width: radius * 2, height: radius * 2 }}>
            <span className="home-vault-tick home-vault-tick-n" />
            <span className="home-vault-tick home-vault-tick-e" />
            <span className="home-vault-tick home-vault-tick-s" />
            <span className="home-vault-tick home-vault-tick-w" />
          </div>
        </>
      )}
    </div>
  )
}
