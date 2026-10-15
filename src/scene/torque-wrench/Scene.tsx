// One private conductor and persistent renderer, loaded exclusively below cadGate.
import { Suspense, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import type { TorqueSceneProps } from './cadGate'
import { ScrollConductor } from './ScrollConductor'
import { TORQUE_BEATS, TORQUE_SCROLL_VIEWPORTS } from './beats'
import RuntimeWorld from './RuntimeWorld'
import { createPrivateRenderer } from './createPrivateRenderer'

export default function TorqueScene({ store, onFailure, playback }: TorqueSceneProps) {
  const rendererFactory = useMemo(() => createPrivateRenderer(onFailure), [onFailure])
  const rendererSupported = useMemo(() => {
    try {
      const canvas = document.createElement('canvas')
      return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
    } catch {
      return false
    }
  }, [])
  useEffect(() => {
    const page = document.querySelector<HTMLElement>('.torque-page')
    page?.style.setProperty('--torque-scroll-viewports', String(TORQUE_SCROLL_VIEWPORTS))
    const probe = {
      snapshot: () => {
        const s = store.getNarrativeSample()
        return {
          progress: s.progress, beatId: s.beat.id, localProgress: s.localProgress,
          phase: s.phase, stateKey: s.stateKey, previousId: s.previousId, nextId: s.nextId,
        }
      },
      beats: TORQUE_BEATS.map(({ id, start, end, poster }) => ({ id, start, end, chapter: poster })),
      diagnostics: () => store.getConductorDiagnostics(),
    }
    const target = window as unknown as Record<string, unknown>
    target.__torqueNarrative = probe
    const activateStory = () => {
      const sample = store.getNarrativeSample()
      const chapter = sample.beat.poster
      page?.setAttribute('data-torque-active-beat', sample.beat.id)
      for (const section of document.querySelectorAll<HTMLElement>('[data-torque-chapter]')) {
        section.dataset.torqueActive = String(section.dataset.torqueChapter === chapter)
      }
    }
    activateStory()
    const unsubscribeBeat = store.subscribeBeat(activateStory)
    return () => {
      unsubscribeBeat()
      if (target.__torqueNarrative === probe) delete target.__torqueNarrative
      page?.style.removeProperty('--torque-scroll-viewports')
      page?.removeAttribute('data-torque-active-beat')
      for (const section of document.querySelectorAll<HTMLElement>('[data-torque-chapter]')) {
        delete section.dataset.torqueActive
      }
    }
  }, [store])

  useEffect(() => {
    if (!rendererSupported) onFailure(new Error('Private WebGL renderer unavailable'))
  }, [rendererSupported, onFailure])

  return (
    <div className="torque-scene" data-torque-scene="live">
      <ScrollConductor store={store} onFailure={onFailure} />
      {rendererSupported && <Canvas camera={{ near: 0.001, far: 30, position: [0.32, 0.16, 0.42], fov: 42 }}
        dpr={store.getState().tier === 'lite' ? 1 : [1, 1.5]}
        gl={rendererFactory}
      >
        <Suspense fallback={null}><RuntimeWorld store={store} onFailure={onFailure} playback={playback} /></Suspense>
      </Canvas>}
    </div>
  )
}
