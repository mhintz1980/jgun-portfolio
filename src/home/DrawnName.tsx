import { useEffect, useRef, useState } from 'react'
import './name.css'

interface DrawnNameProps {
  href: string
  label: string
  text?: string
  /** Use the page fade when the link leaves the page. */
  fade?: boolean
}

// Mark's name, large and bold, drawn onto the page: the outline is traced in Revision Orange,
// then the letters fill with ink. The SVG viewBox is fitted to the text once the font is in, so
// the name spans exactly its box (half the screen on desktop). Reduced motion: shown filled.
export default function DrawnName({ href, label, text = 'MARK HINTZ', fade = false }: DrawnNameProps) {
  const textRef = useRef<SVGTextElement>(null)
  const [box, setBox] = useState<string | null>(null)

  useEffect(() => {
    let done = false
    const fit = () => {
      const node = textRef.current
      if (done || !node) return
      done = true
      const b = node.getBBox()
      setBox(`${b.x.toFixed(1)} ${b.y.toFixed(1)} ${b.width.toFixed(1)} ${b.height.toFixed(1)}`)
    }
    const fallback = window.setTimeout(fit, 1500)
    if (document.fonts?.load) {
      document.fonts.load('900 100px "Archivo"', text).then(fit, fit)
    } else {
      fit()
    }
    return () => window.clearTimeout(fallback)
  }, [text])

  return (
    <a className="home-name" href={href} aria-label={label} data-ready={box ? '' : undefined} data-fade={fade ? '' : undefined}>
      <svg className="home-name-svg" viewBox={box ?? '0 -74 640 76'} aria-hidden="true" focusable="false">
        <text ref={textRef} className="home-name-text" x="0" y="0">
          {text}
        </text>
      </svg>
    </a>
  )
}
