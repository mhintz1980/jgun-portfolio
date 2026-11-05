import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { HalfFloatType, Vector2, WebGLRenderTarget } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

/** Owns the frame's render: scene → (bloom) → SMAA → tone map + sRGB. MSAA costs ~4× on
 *  SwiftShader; SMAA gives clean edges for a fraction of that. */
export function PostFX({ bloom = 0, bloomThreshold = 0.85, bloomRadius = 0.4, stencil = false }: { bloom?: number; bloomThreshold?: number; bloomRadius?: number; stencil?: boolean }) {
  const { gl, scene, camera, size } = useThree()
  const { composer, bloomPass } = useMemo(() => {
    const target = new WebGLRenderTarget(size.width, size.height, { type: HalfFloatType, stencilBuffer: stencil })
    const composer = new EffectComposer(gl, target)
    composer.setPixelRatio(1)
    composer.addPass(new RenderPass(scene, camera))
    const bloomPass = new UnrealBloomPass(new Vector2(size.width, size.height), bloom, bloomRadius, bloomThreshold)
    bloomPass.enabled = bloom > 0
    composer.addPass(bloomPass)
    composer.addPass(new SMAAPass())
    composer.addPass(new OutputPass())
    composer.setSize(size.width, size.height)
    return { composer, bloomPass }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera, size.width, size.height])
  useEffect(() => () => composer.dispose(), [composer])
  bloomPass.strength = bloom
  bloomPass.enabled = bloom > 0.001
  bloomPass.threshold = bloomThreshold
  bloomPass.radius = bloomRadius
  useFrame(() => composer.render(), 1)
  return null
}
