// Page composition for the private /torque-wrench/ document. Story is mounted once and never
// remounted; the scene/poster stage layers swap around it. The only narrative import path is
// cadGate's dynamic import, triggered here for non-poster tiers; failure is terminal for the
// document, keeps the DOM story, controls, and footer usable, and loads no further CAD.
import { useCallback, useEffect, useState, useSyncExternalStore, type ComponentType } from 'react'
import { PageNav } from '../../shared/PageNav'
import { releaseFade } from '../../shared/pageFade'
import { createTorqueWrenchStore } from '../../state/torqueWrenchStore'
import Poster from './Poster'
import { SceneBoundary } from './SceneBoundary'
import { runSceneLifecycle } from './sceneLifecycle'
import type { TorqueSceneProps } from './cadGate'
import Story from './Story'
import { REDUCED_MOTION_QUERY, downgradeForReducedMotion } from './tier'
import './torque-wrench.css'

export interface TorqueWrenchPageProps {
  store: ReturnType<typeof createTorqueWrenchStore>
}

export function TorqueWrenchPage({ store }: TorqueWrenchPageProps) {
  const { tier, sceneStatus } = useSyncExternalStore(store.subscribe, store.getState, store.getState)
  const [SceneComponent, setSceneComponent] = useState<ComponentType<TorqueSceneProps> | null>(null)
  const sceneWanted = tier !== 'poster'
  const posterLayer = tier === 'poster' || sceneStatus === 'failed'

  const failScene = useCallback((_error: unknown) => {
    setSceneComponent(null)
    store.setSceneStatus('failed')
  }, [store])

  // The DOM story is mounted; release the shared fade-in now (releaseFade is a no-op when the
  // head shell never set data-fade="in").
  useEffect(() => {
    releaseFade()
  }, [])

  // A reduced-motion change mid-session steps down to the poster floor and never back up.
  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY)
    const onChange = () => {
      const next = downgradeForReducedMotion(store.getState().tier, query.matches)
      if (next) store.setTier(next)
    }
    query.addEventListener('change', onChange)
    onChange()
    return () => query.removeEventListener('change', onChange)
  }, [store])

  // Lazy scene lifecycle. The store-owned lifecycle sets loading, mounts the resolved component,
  // and seals failure; cadGate caches the import, so StrictMode's setup/cleanup/setup resolves
  // from one in-flight promise. Failure (import or render, via the boundary) is terminal for the
  // document: the poster layer takes over and nothing imports narrative CAD again.
  useEffect(() => {
    if (!sceneWanted) return
    const handle = runSceneLifecycle({
      store,
      onReady: (sceneComponent) => setSceneComponent(() => sceneComponent),
      onFailure: failScene,
    })
    return () => handle.dispose()
  }, [sceneWanted, store, failScene])

  const stage = posterLayer ? 'poster' : SceneComponent && sceneStatus === 'ready' ? 'scene' : 'pending'

  return (
    <div className="torque-page">
      <a className="torque-skip" href="#torque-story">
        Skip to story
      </a>
      <header className="torque-header">
        <PageNav current="torque-wrench" tier={tier} variant="header" />
        <div className="torque-hero">
          <p className="torque-hero__eyebrow">Private rebuild · JG-038</p>
          <h1 className="torque-hero__title">JGUN Torque Wrench</h1>
          <p className="torque-hero__intro">
            The rebuilt torque-wrench story in five chapters. The interactive scene is pending —
            this build presents the complete story and controls as plain DOM.
          </p>
        </div>
      </header>
      <main className="torque-main">
        <div className="torque-stage" data-torque-stage={stage} aria-hidden="true">
          {SceneComponent && sceneStatus === 'ready' && !posterLayer && (
            <SceneBoundary onFailure={failScene}>
              <SceneComponent onFailure={failScene} />
            </SceneBoundary>
          )}
          {posterLayer && <Poster />}
        </div>
        <Story />
      </main>
      <footer className="torque-footer">
        <PageNav current="torque-wrench" tier={tier} variant="endcard" />
        <p className="torque-colophon">
          JGUN Torque Wrench — private rebuild (JG-038). Temporary placeholder art throughout;
          final offline posters arrive in a later stage.
        </p>
      </footer>
    </div>
  )
}

export default TorqueWrenchPage
