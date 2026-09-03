import { forwardRef, useImperativeHandle, useMemo } from 'react'
import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'

const fragmentShader = /* glsl */ `
uniform float uRipple;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 centered = uv - 0.5;
  float distanceFromCenter = length(centered);
  float ring = sin(distanceFromCenter * 86.0 - uRipple * 9.0);
  float envelope = smoothstep(0.52, 0.0, distanceFromCenter) * uRipple;
  vec2 distortedUv = uv + normalize(centered + vec2(0.0001)) * ring * envelope * 0.0032;
  outputColor = uRipple > 0.0001 ? texture2D(inputBuffer, distortedUv) : inputColor;
}
`

export class PondRippleEffect extends Effect {
  constructor() {
    super('PondRippleEffect', fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map([['uRipple', new Uniform(0)]]),
    })
  }

  set intensity(value: number) {
    this.uniforms.get('uRipple')!.value = value
  }
}

export const PondRipple = forwardRef<PondRippleEffect>(function PondRipple(_, forwardedRef) {
  const effect = useMemo(() => new PondRippleEffect(), [])
  useImperativeHandle(forwardedRef, () => effect, [effect])
  return <primitive object={effect} dispose={null} />
})
