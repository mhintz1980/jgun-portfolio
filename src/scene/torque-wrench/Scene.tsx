// One private conductor and persistent renderer, loaded exclusively below cadGate.
import { Suspense, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { configureTextBuilder } from 'troika-three-text'
import type { TorqueSceneProps } from './cadGate'
import { ScrollConductor } from './ScrollConductor'
import { TORQUE_BEATS, TORQUE_SCROLL_VIEWPORTS } from './beats'
import RuntimeWorld from './RuntimeWorld'
import { createPrivateRenderer } from './createPrivateRenderer'
import { BackgroundWorld } from './BackgroundWorld'
import { createInspectionIsolationSample } from './inspectionIsolation'
import { torqueScrollFraction, torqueNarrativeProgress, TORQUE_PACING_SCALE } from './scrollPacing'
import { TorqueInspectionOverlay } from './TorqueInspectionOverlay'

// This lazy module runs only in the private live document, before its first text
// request. Keep the exact pinned symbol fallback local (not a runtime CDN lookup).
// Primary Barlow/reference lettering and the legacy document remain unchanged.
configureTextBuilder({ defaultFontURL: '/fonts/NotoSansSymbols-unicode-resolver-v1.0.1.woff' })

export default function TorqueScene({ store, onFailure, playback }: TorqueSceneProps) {
  const isolation = useMemo(() => createInspectionIsolationSample(), [])
  const rendererFactory = useMemo(() => createPrivateRenderer(onFailure, () => store.getState().tier === 'lite' ? 'lite' : 'full'), [onFailure, store])
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
    let pacingExtra = page ? parseFloat(getComputedStyle(page).getPropertyValue('--torque-pacing-extra')) : 0
    // The shell fallback is expressed in vh; convert before subtracting its
    // already-reserved space. Never shrink the live document during restoration.
    if (page && getComputedStyle(page).getPropertyValue('--torque-pacing-extra').includes('vh')) pacingExtra *= innerHeight / 100
    const resizePacing = () => {
      const baseRange = Math.max(0, document.documentElement.scrollHeight - innerHeight - pacingExtra)
      pacingExtra = baseRange * (TORQUE_PACING_SCALE - 1)
      page?.style.setProperty('--torque-pacing-extra', `${pacingExtra}px`)
    }
    resizePacing()
    window.addEventListener('resize', resizePacing)
    // The conductor installs before this effect; refresh its measured document range.
    window.dispatchEvent(new Event('resize'))
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
      scrollFraction: torqueScrollFraction,
      narrativeProgress: torqueNarrativeProgress,
      pacing: () => ({ scale: TORQUE_PACING_SCALE, baselineRange: pacingExtra / (TORQUE_PACING_SCALE - 1),
        actualRange: document.documentElement.scrollHeight - innerHeight }),
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
      window.removeEventListener('resize', resizePacing)
      if (target.__torqueNarrative === probe) delete target.__torqueNarrative
      page?.style.removeProperty('--torque-scroll-viewports')
      page?.style.removeProperty('--torque-pacing-extra')
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
        <BackgroundWorld store={store} onFailure={onFailure} isolation={isolation} />
        <Suspense fallback={null}><RuntimeWorld store={store} onFailure={onFailure} playback={playback} isolation={isolation} /></Suspense>
      </Canvas>}
      {rendererSupported && <TorqueInspectionOverlay />}
    </div>
  )
}
