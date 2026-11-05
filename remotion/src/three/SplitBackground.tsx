import { useMemo } from 'react'
import { Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from 'three'
import type { V3 } from './track'

/** Full-screen backdrop drawn inside the WebGL frame: `left` colour left of the split, `right`
 *  colour beyond it, with a soft feather. Colours are linear and pre-tone-mapped (see
 *  preToneMapped) so they land exactly on the site's paper and navy. */
export function SplitBackground({ left, right, split, feather = 0.04 }: { left: V3; right: V3; split: number; feather?: number }) {
  const mesh = useMemo(() => {
    const m = new Mesh(
      new PlaneGeometry(2, 2),
      new ShaderMaterial({
        uniforms: { uLeft: { value: new Vector3() }, uRight: { value: new Vector3() }, uSplit: { value: 0 }, uFeather: { value: 0.04 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.99999, 1.0); }',
        fragmentShader:
          'uniform vec3 uLeft; uniform vec3 uRight; uniform float uSplit; uniform float uFeather; varying vec2 vUv;' +
          'void main(){ float t = smoothstep(uSplit - uFeather, uSplit + uFeather, vUv.x); gl_FragColor = vec4(mix(uLeft, uRight, t), 1.0); }',
        depthWrite: false,
        depthTest: false,
      }),
    )
    m.frustumCulled = false
    m.renderOrder = -1000
    return m
  }, [])
  const mat = mesh.material as ShaderMaterial
  ;(mat.uniforms.uLeft.value as Vector3).set(...left)
  ;(mat.uniforms.uRight.value as Vector3).set(...right)
  mat.uniforms.uSplit.value = split
  mat.uniforms.uFeather.value = feather
  return <primitive object={mesh} />
}

