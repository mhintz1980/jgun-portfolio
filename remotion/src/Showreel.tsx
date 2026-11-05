import type { ReactNode } from 'react'
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion'
import { EASE, mix, ramp } from './ease'
import { C } from './theme'
import { Grain } from './ui/Backdrop'
import { Opening, OPENING_FRAMES } from './scenes/Opening'
import { WrenchAct, WRENCH_FRAMES } from './scenes/WrenchAct'
import { MachineAct, MACHINE_FRAMES } from './scenes/MachineAct'
import { ArmamentAct, ARMAMENT_FRAMES } from './scenes/ArmamentAct'
import { Close, CLOSE_FRAMES } from './scenes/Close'

/** Overlap between acts that hand over with a thread wipe. */
export const WIPE = 24

export const T = (() => {
  const a = 0
  const b = a + OPENING_FRAMES
  const c = b + WRENCH_FRAMES - WIPE
  const d = c + MACHINE_FRAMES - WIPE
  const e = d + ARMAMENT_FRAMES
  return { a, b, c, d, e, end: e + CLOSE_FRAMES }
})()

export const SHOWREEL_FRAMES = T.end

/** The next act enters from the right behind a vertical Revision-Orange cut line. */
function ThreadWipe({ children }: { children: ReactNode }) {
  const f = useCurrentFrame()
  const t = ramp(f, 0, WIPE, EASE.inOut)
  const x = mix(1920 + 30, -30, t)
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: t < 1 ? `inset(0 0 0 ${Math.max(0, x)}px)` : undefined }}>{children}</AbsoluteFill>
      {t > 0 && t < 1 && (
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <line x1={x} y1={0} x2={x} y2={1080} stroke={C.orange} strokeWidth={16} opacity={0.22} />
          <line x1={x} y1={0} x2={x} y2={1080} stroke={C.orangeLit} strokeWidth={3} />
        </svg>
      )}
    </AbsoluteFill>
  )
}

export function Showreel() {
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Sequence name="Opening — the thread" from={T.a} durationInFrames={OPENING_FRAMES} premountFor={30}>
        <Opening />
      </Sequence>
      <Sequence name="01 Torque wrench — drawing becomes object" from={T.b} durationInFrames={WRENCH_FRAMES} premountFor={60}>
        <WrenchAct />
      </Sequence>
      <Sequence name="02 Quiet machine — in section" from={T.c} durationInFrames={MACHINE_FRAMES} premountFor={60}>
        <ThreadWipe>
          <MachineAct />
        </ThreadWipe>
      </Sequence>
      <Sequence name="03 Armament — light table" from={T.d} durationInFrames={ARMAMENT_FRAMES} premountFor={30}>
        <ThreadWipe>
          <ArmamentAct />
        </ThreadWipe>
      </Sequence>
      <Sequence name="Close — pull the thread" from={T.e} durationInFrames={CLOSE_FRAMES} premountFor={30}>
        <Close />
      </Sequence>
      <Grain strength={0.05} />
    </AbsoluteFill>
  )
}
