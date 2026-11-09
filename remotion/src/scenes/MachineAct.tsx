import { ThreeCanvas } from '@remotion/three'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { ACESFilmicToneMapping } from 'three'
import { evaluateShot } from '../../../src/scene/rl300/shot'
import { MACHINE } from '../copy'
import { EASE, mix, ramp } from '../ease'
import { C, F } from '../theme'
import { CameraRig } from '../three/CameraRig'
import { PostFX } from '../three/PostFX'
import { QuietMachine } from '../three/QuietMachine'
import { StudioEnvironment } from '../three/studioEnv'
import { GridLayer } from '../ui/Backdrop'
import { Eyebrow, Rise, RuleTag } from '../ui/Type'

export const MACHINE_FRAMES = 540

/** Film frames → the site's own RL300 study progress `u` (beats.ts). The "second breath"
 *  underside pass is skipped with a cut; the proposed lower intake is captioned as a concept. */
const SEGMENTS: { f0: number; f1: number; u0: number; u1: number; beat: number }[] = [
  { f0: 0, f1: 96, u0: 0.0, u1: 0.115, beat: 0 },
  { f0: 96, f1: 206, u0: 0.12, u1: 0.265, beat: 1 },
  { f0: 206, f1: 322, u0: 0.27, u1: 0.405, beat: 2 },
  { f0: 322, f1: 426, u0: 0.615, u1: 0.755, beat: 3 },
  { f0: 426, f1: 560, u0: 0.765, u1: 0.9, beat: 4 },
]
export const MACHINE_CUT = 322

function segmentAt(f: number) {
  let s = SEGMENTS[0]
  for (const seg of SEGMENTS) if (f >= seg.f0) s = seg
  const t = Math.min(1, Math.max(0, (f - s.f0) / (s.f1 - s.f0)))
  // Each segment eases out of the previous one's speed; the site's own camera smoothing
  // (evaluateShot) does the rest.
  return { u: mix(s.u0, s.u1, s === SEGMENTS[0] ? EASE.out(t) : t), beat: s.beat, local: f - s.f0, len: s.f1 - s.f0 }
}

export function MachineAct() {
  const f = useCurrentFrame()
  const { u, beat, local, len } = segmentAt(f)
  const shot = evaluateShot(u, false)
  // A slow extra push on top of the site's camera keeps the film moving between keys.
  const push = 1.12 - 0.06 * ramp(local, 0, len, EASE.inOut)
  const pos: [number, number, number] = [
    shot.target[0] + (shot.position[0] - shot.target[0]) * push,
    shot.target[1] + (shot.position[1] - shot.target[1]) * push,
    shot.target[2] + (shot.position[2] - shot.target[2]) * push,
  ]
  const titleIn = ramp(f, 14, 40)
  const titleOut = ramp(f, 150, 170, EASE.in)
  const captionIn = ramp(local, 6, 24) * (1 - ramp(local, len - 16, len - 2, EASE.in))
  const b = MACHINE.beats[beat]
  // Cut flash: the line cuts across the frame at the jump between beats.
  const slash = ramp(f, MACHINE_CUT - 5, MACHINE_CUT + 5, EASE.inOut)

  return (
    <AbsoluteFill style={{ background: '#101b24' }}>
      <ThreeCanvas width={1920} height={1080} shadows gl={{ antialias: false, stencil: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping
          gl.toneMappingExposure = 0.85
        }}>
        <color attach="background" args={['#101b24']} />
        <fog attach="fog" args={['#101b24', 12, 30]} />
        <PostFX stencil bloom={0.14} bloomThreshold={0.95} bloomRadius={0.4} />
        <CameraRig position={pos} target={shot.target} fov={shot.fov} near={0.02} far={60} shiftX={250} />
        <StudioEnvironment kind="room" intensity={0.38} />
        <hemisphereLight args={['#c8e3ef', '#26303c', 0.35]} />
        <directionalLight position={[4, 6, 3]} intensity={1.7} color="#e6f1ff" castShadow shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-normalBias={0.015} />
        <directionalLight position={[-3, 3, -2]} intensity={0.8} color="#75bfff" />
        <directionalLight position={[-4, 1.2, 3]} intensity={0.55} color="#ff8a4c" />
        <pointLight position={[0.35, 1, -0.35]} intensity={1.2} distance={2.5} decay={2} color="#ffbd7b" />
        <pointLight position={[0.6, 0.02, 0.7]} intensity={0.65} distance={1.8} decay={2} color="#b7eaff" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.22, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#0a141c" roughness={0.8} metalness={0.1} />
        </mesh>
        {[-0.53, 0.53].flatMap((x) => [-1.355051, -0.055051, 1.244949].map((z) => (
          <mesh key={`${x}/${z}`} position={[x, -0.11, z]} castShadow>
            <cylinderGeometry args={[0.075, 0.09, 0.22, 16]} />
            <meshStandardMaterial color="#15212b" metalness={0.5} roughness={0.5} />
          </mesh>
        )))}
        <QuietMachine u={u} />
      </ThreeCanvas>

      <GridLayer tone="dark" style={{ opacity: 0.5 }} />
      {/* Type scrim: the studio darkens toward the left edge where the copy sits. */}
      <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(11,22,34,0.82) 0%, rgba(11,22,34,0.55) 28%, rgba(11,22,34,0) 52%)' }} />

      {/* Title block */}
      <div style={{ position: 'absolute', left: 96, top: 92, opacity: 1 - titleOut }}>
        <Rise t={titleIn}>
          <RuleTag color={C.creamMuted}>{MACHINE.eyebrow}</RuleTag>
        </Rise>
        <Rise t={ramp(f, 22, 50)} style={{ marginTop: 18 }}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 78, letterSpacing: '-0.02em', color: C.cream, lineHeight: 1 }}>{MACHINE.title}</div>
        </Rise>
        <Rise t={ramp(f, 32, 60)} style={{ marginTop: 14 }}>
          <div style={{ fontFamily: F.body, fontSize: 30, color: C.creamMuted }}>{MACHINE.line}</div>
        </Rise>
      </div>

      {/* Beat caption, the site's own vocabulary */}
      <div style={{ position: 'absolute', left: 96, bottom: 84, width: 760, opacity: captionIn }}>
        <Eyebrow color={C.orangeLit}>{`0${beat + 1} / 0${MACHINE.beats.length}`}</Eyebrow>
        <Rise t={captionIn} style={{ marginTop: 12 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 44, color: C.cream, letterSpacing: '-0.01em' }}>{b.title}</div>
        </Rise>
        <div style={{ marginTop: 8, fontFamily: F.body, fontSize: 25, lineHeight: 1.35, color: C.creamMuted }}>{b.caption}</div>
        {beat === 3 && (
          <div style={{ marginTop: 18 }}>
            <RuleTag color={C.cream} rule={C.orangeLit} w={0.6}>{MACHINE.concept}</RuleTag>
          </div>
        )}
      </div>

      {/* Tags on the way out */}
      <div style={{ position: 'absolute', right: 96, top: 96, opacity: ramp(f, 470, 492) }}>
        <Eyebrow color={C.creamMuted}>{MACHINE.tags}</Eyebrow>
      </div>

      {slash > 0 && slash < 1 && (
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <line x1={mix(-40, 1960, slash)} y1={0} x2={mix(-40, 1960, slash)} y2={1080} stroke={C.orange} strokeWidth={14} opacity={0.25} />
          <line x1={mix(-40, 1960, slash)} y1={0} x2={mix(-40, 1960, slash)} y2={1080} stroke={C.orangeLit} strokeWidth={3} />
        </svg>
      )}
    </AbsoluteFill>
  )
}
