import { Environment, Lightformer } from '@react-three/drei'

interface StudioLightingProps {
  glowColor?: string
  ambientDarkness?: number
}

/**
 * Studio Lighting Rig for StudioMark 3D Logo Scene.
 * Uses Drei Environment with strategically placed Lightformers AND direct
 * front/rim accent lights so metallic bevels, ceramic ridges, and optical glass
 * facets read with razor-sharp contrast against the dark storm backdrop.
 */
export function StudioLighting({
  glowColor = '#d2c4a3',
  ambientDarkness = 0.8,
}: StudioLightingProps) {
  const ambientIntensity = (1.0 - ambientDarkness) * 0.55 + 0.18

  return (
    <>
      {/* Base Dark Storm Ambient Fill */}
      <ambientLight color="#1a2436" intensity={ambientIntensity} />

      {/* Warm Key Front-Left Fill for Monogram Bevels & Ceramic Crests */}
      <directionalLight
        position={[-3.5, 4.5, 5.5]}
        color="#fff6e6"
        intensity={1.65}
      />

      {/* Crisp Cool Front-Right Specular Rim Light */}
      <directionalLight
        position={[4.0, 3.2, 4.5]}
        color="#dbeafe"
        intensity={1.35}
      />

      {/* Dedicated Front Monogram Grazing Point Light for Gold Trim & Glass Facets */}
      <pointLight
        position={[0, 1.45, 2.4]}
        color={glowColor}
        intensity={2.0}
        distance={6.5}
        decay={2}
      />

      {/* Drei Studio Environment combining Faraz's Shanghai Bund Night HDRI with Specular Lightformers */}
      <Environment resolution={256} environmentIntensity={0.85}>
        <Environment files="/textures/studiomark-road/shanghai_bund_2k.hdr" />
        {/* Front-Upper Softbox Strip (lights front bevels of titanium, gold & ceramic) */}
        <Lightformer
          form="rect"
          intensity={3.0}
          color="#fffaf0"
          scale={[7, 2.2]}
          target={[0, 1.24, 0]}
          position={[0, 4.2, 5.5]}
        />

        {/* Front-Lower Grazing Strip (catches bottom gold chamfers & M chevrons) */}
        <Lightformer
          form="rect"
          intensity={1.6}
          color={glowColor}
          scale={[6, 1.2]}
          target={[0, 1.24, 0]}
          position={[0, 0.5, 4.8]}
        />

        {/* High-Angle Rear Rim Softbox (angled down, reflects in wet street puddle) */}
        <Lightformer
          form="rect"
          intensity={2.6}
          color={glowColor}
          scale={[8, 2.5]}
          target={[0, 1.24, 0]}
          position={[0, 6.5, -6]}
        />

        {/* Crisp Left Rim Lightformer for Facet Edges */}
        <Lightformer
          form="rect"
          intensity={3.2}
          color="#f0f6ff"
          scale={[6, 3.5]}
          target={[0, 1.24, 0]}
          position={[-6, 2.4, 1.5]}
        />

        {/* Crisp Right Rim Lightformer for Facet Edges */}
        <Lightformer
          form="rect"
          intensity={3.2}
          color={glowColor}
          scale={[6, 3.5]}
          target={[0, 1.24, 0]}
          position={[6, 2.4, 1.5]}
        />

        {/* Overhead Rain Streak Specular Ring */}
        <Lightformer
          form="ring"
          intensity={2.0}
          color="#d0e2ff"
          scale={[8, 8]}
          target={[0, 0, 0]}
          position={[0, 8, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      </Environment>
    </>
  )
}
