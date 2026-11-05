import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'

interface PostProcessingProps {
  bloomIntensity?: number
}

export function PostProcessing({ bloomIntensity = 0.45 }: PostProcessingProps) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.8}
        luminanceSmoothing={0.25}
        mipmapBlur
        intensity={bloomIntensity}
      />
      <ToneMapping />
    </EffectComposer>
  )
}

