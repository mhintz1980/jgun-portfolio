/**
 * ASME Y14.5 geometric characteristic symbols (JG-021 remediation).
 *
 * Feature control frames and tolerance callouts must lead with the standard
 * characteristic SYMBOL, not the spelled-out word (owner visual pass finding
 * #3). Glyph geometry follows the registered style references at
 * `project/context/references/media/gdt/`: single-weight strokes matching the
 * frame border, drawn as SVG paths (Unicode coverage for ⌖/⌓ is unreliable).
 * Words survive in prose (`detail`, `processNote`, aria-labels) where natural
 * language belongs.
 */

import type { ReactElement } from 'react'

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** Canonical glyph paths, 20×20 viewBox. */
const GLYPHS: Record<string, ReactElement> = {
  // ⏥ — parallelogram
  FLATNESS: (
    <svg viewBox="0 0 20 20" className="h-[14px] w-[14px]" aria-hidden="true" focusable="false">
      <path d="M3.5 14.5 L7.5 5.5 L16.5 5.5 L12.5 14.5 Z" {...stroke} />
    </svg>
  ),
  // ⌖ — circle with crosshair extending past the ring
  POSITION: (
    <svg viewBox="0 0 20 20" className="h-[14px] w-[14px]" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="3.4" {...stroke} />
      <path d="M2.5 10 H17.5 M10 2.5 V17.5" {...stroke} />
    </svg>
  ),
  // ⌓ with underline — profile of a surface
  PROFILE: (
    <svg viewBox="0 0 20 20" className="h-[14px] w-[14px]" aria-hidden="true" focusable="false">
      <path d="M3 12 A 7 7 0 0 1 17 12 L3 12 Z" {...stroke} />
      <path d="M5 16 H15" {...stroke} />
    </svg>
  ),
  // ∥ — two parallel strokes
  PARALLELISM: (
    <svg viewBox="0 0 20 20" className="h-[14px] w-[14px]" aria-hidden="true" focusable="false">
      <path d="M7.5 4 V16 M12.5 4 V16" {...stroke} />
    </svg>
  ),
  // circular runout — 45° arrow rising from a circle
  RUNOUT: (
    <svg viewBox="0 0 20 20" className="h-[14px] w-[14px]" aria-hidden="true" focusable="false">
      <circle cx="6.2" cy="13.6" r="2.6" {...stroke} />
      <path d="M8.1 11.7 L14.8 5.2" {...stroke} />
      <path d="M14.8 5.2 L10.9 5.5 M14.8 5.2 L14.5 9.1" {...stroke} />
    </svg>
  ),
}

const KEY_ALIASES: Record<string, string> = {
  'POSITION ⌖': 'POSITION',
  'PROFILE ⌓': 'PROFILE',
  'PROFILE OF A SURFACE ⌓': 'PROFILE',
  'PARALLELISM //': 'PARALLELISM',
  'CIRCULARITY ⭘': 'CIRCULARITY',
  'TOTAL RUNOUT': 'RUNOUT',
  'CIRCULAR RUNOUT': 'RUNOUT',
}

/** Resolve a data vocabulary string to a symbol key, or null for prose/spec text. */
export function characteristicKey(text: string | undefined): string | null {
  if (!text) return null
  const trimmed = text.trim()
  if (GLYPHS[trimmed]) return trimmed
  const aliased = KEY_ALIASES[trimmed]
  if (aliased && GLYPHS[aliased]) return aliased
  // Bare words ('RUNOUT', 'FLATNESS') resolve directly
  if (GLYPHS[trimmed.toUpperCase()]) return trimmed.toUpperCase()
  return null
}

/**
 * Render the Y14.5 characteristic symbol for a data vocabulary string, or null
 * when the string is a non-Y14.5 spec (e.g. 'ATTENUATION') that legitimately
 * stays as text.
 */
export function GdtSymbol({ name }: { name: string }): ReactElement | null {
  const key = characteristicKey(name)
  if (!key) return null
  return GLYPHS[key]
}
