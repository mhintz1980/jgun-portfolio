import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'

interface PostProcessingProps {
  bloomIntensity?: number
}

export function PostProcessing({ bloomIntensity = 0.45 }: PostProcessingProps) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={1.15} luminanceSmoothing={0.12} mipmapBlur intensity={bloomIntensity * 0.28} />
      <ToneMapping />
    </EffectComposer>
  )
}
