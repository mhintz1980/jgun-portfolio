import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ShaftStoryLayer } from '../../../../../../src/components/ShaftStoryLayer'
import { createShaftScriptFrame, sampleShaftScript } from '../../../../../../src/scene/inspection/shaft/script'

document.body.style.margin = '0'
document.body.style.fontFamily = 'ui-sans-serif, system-ui, "Segoe UI", sans-serif'
document.body.style.background = '#050a10'

interface ShaftHarnessGlobal {
  setTime(t: number): void
  setReduced(v: boolean): void
  sample(t: number, reduced: boolean): Record<string, unknown>
}

function Harness() {
  const [time, setTime] = useState(0)
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    (window as unknown as { __shaftHarness?: ShaftHarnessGlobal }).__shaftHarness = {
      setTime: (t: number) => setTime(Math.max(0, Math.min(43, t))),
      setReduced: (v: boolean) => setReduced(v),
      sample: (t: number, r: boolean) => {
        const frame = createShaftScriptFrame()
        sampleShaftScript(t, r, frame)
        return { ...frame }
      },
    }
  }, [])
  return <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#050a10' }}>
    <ShaftStoryLayer time={time} reducedMotion={reduced} />
    <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', gap: 16, alignItems: 'center', font: '12px monospace', color: '#9db2c0' }}>
      <label>time <input type="range" min={0} max={43} step={0.01} value={time} onChange={e => setTime(e.currentTarget.valueAsNumber)} /></label>
      <output>{time.toFixed(2)} s</output>
      <label><input type="checkbox" checked={reduced} onChange={e => setReduced(e.currentTarget.checked)} /> reduced motion</label>
    </div>
  </div>
}

createRoot(document.getElementById('root')!).render(<Harness />)
