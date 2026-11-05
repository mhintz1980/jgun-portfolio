import { useEffect, useState } from 'react'
import { continueRender, delayRender, staticFile } from 'remotion'
import type { Group } from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const cache = new Map<string, Promise<Group | null>>()

function loader() {
  const draco = new DRACOLoader().setDecoderPath(staticFile('draco/draco_decoder.js').replace(/draco_decoder\.js$/, ''))
  return new GLTFLoader().setDRACOLoader(draco)
}

/** Load a GLB from the site's public/ once per tab. `optional` resolves null on failure. */
export function loadGlb(file: string, optional = false): Promise<Group | null> {
  let p = cache.get(file)
  if (!p) {
    p = new Promise<Group | null>((resolve, reject) => {
      loader().load(
        staticFile(file),
        (gltf) => resolve(gltf.scene),
        undefined,
        (err) => (optional ? resolve(null) : reject(err)),
      )
    })
    cache.set(file, p)
  }
  return p
}

const prepared = new Map<string, unknown>()

/** Load one or more GLBs and run `prepare` once per tab, holding the render until the canvas
 *  has drawn the prepared model (see <ReadyGate>). */
export function usePrepared<T>(files: string[], prepare: (scenes: (Group | null)[]) => T, label: string): [T | null, () => void] {
  const key = label
  const [value, setValue] = useState<T | null>(() => (prepared.get(key) as T) ?? null)
  const [handle] = useState(() => delayRender(label, { timeoutInMilliseconds: 240000 }))
  const [release] = useState(() => {
    let done = false
    return () => {
      if (!done) {
        done = true
        continueRender(handle)
      }
    }
  })
  useEffect(() => {
    let alive = true
    if (value) return
    Promise.all(files.map((f) => loadGlb(f, f.includes('extra'))))
      .then((scenes) => {
        if (!alive) return
        let v = prepared.get(key) as T | undefined
        if (!v) {
          v = prepare(scenes)
          prepared.set(key, v)
        }
        setValue(v)
      })
      .catch((err) => {
        console.error(err)
        throw err
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return [value, release]
}
