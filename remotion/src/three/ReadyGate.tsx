import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

/** Inside a <ThreeCanvas>: once the prepared model is mounted, draw it and release the render
 *  hold. ThreeCanvas only advances on frame changes, so without this the first frame a tab
 *  renders after a slow GLB load would be captured empty. */
export function ReadyGate({ ready, release }: { ready: boolean; release: () => void }) {
  const advance = useThree((s) => s.advance)
  useEffect(() => {
    if (!ready) return
    advance(performance.now())
    // One more tick so the compositor has the presented buffer before the screenshot.
    const id = requestAnimationFrame(() => release())
    return () => cancelAnimationFrame(id)
  }, [ready, advance, release])
  return null
}
