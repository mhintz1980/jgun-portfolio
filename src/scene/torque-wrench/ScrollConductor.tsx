// Browser wrapper for the page-local conductor. Mount it only in a live scene tier; it renders
// nothing and never subscribes React to per-frame narrative progress.
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import type { TorqueWrenchStore } from '../../state/torqueWrenchStore'
import {
  createTorqueScrollConductor,
  type TorqueConductorDependencies,
} from './conductorRuntime'

let scrollTriggerRegistered = false

export interface ScrollConductorProps {
  store: TorqueWrenchStore
  /** Synchronous conductor startup failures use the same terminal scene-failure path as CAD. */
  onFailure: (error: unknown) => void
}

function browserDependencies(): TorqueConductorDependencies {
  return {
    window,
    document,
    gsap,
    scrollTrigger: ScrollTrigger as unknown as TorqueConductorDependencies['scrollTrigger'],
    Lenis: Lenis as unknown as TorqueConductorDependencies['Lenis'],
    registerPlugin: () => gsap.registerPlugin(ScrollTrigger),
  }
}

/**
 * The effect body as a testable function. A successful call returns the React cleanup function;
 * an initialization fault is reported through onFailure and returns a no-op cleanup.
 */
export function installScrollConductor(
  store: TorqueWrenchStore,
  onFailure: (error: unknown) => void,
  dependencies: TorqueConductorDependencies = browserDependencies(),
): () => void {
  try {
    if (!scrollTriggerRegistered) {
      dependencies.registerPlugin()
      scrollTriggerRegistered = true
    }
    const conductor = createTorqueScrollConductor({ store, ...dependencies, onCleanupFailure: onFailure })
    return () => conductor.dispose()
  } catch (error) {
    onFailure(error)
    return () => {}
  }
}

export function ScrollConductor({ store, onFailure }: ScrollConductorProps) {
  useEffect(() => installScrollConductor(store, onFailure), [store, onFailure])
  return null
}
