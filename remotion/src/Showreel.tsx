import { AbsoluteFill, Sequence } from 'remotion'
import { Grain } from './ui/Backdrop'
import { ThreadWipe, WIPE } from './ui/ThreadWipe'
import { Opening, OPENING_FRAMES } from './scenes/Opening'
import { WrenchAct, WRENCH_FRAMES } from './scenes/WrenchAct'
import { MachineAct, MACHINE_FRAMES } from './scenes/MachineAct'
import { ArmamentAct, ARMAMENT_FRAMES } from './scenes/ArmamentAct'
import { Close, CLOSE_FRAMES } from './scenes/Close'
import { LogoIdent, LOGO_FRAMES } from './scenes/LogoIdent'
import { C } from './theme'

export { WIPE }

export const T = (() => {
  const a = 0
  const b = a + OPENING_FRAMES
  const c = b + WRENCH_FRAMES - WIPE
  const d = c + MACHINE_FRAMES - WIPE
  const e = d + ARMAMENT_FRAMES
  const f = e + CLOSE_FRAMES - WIPE
  return { a, b, c, d, e, f, end: f + LOGO_FRAMES }
})()

export const SHOWREEL_FRAMES = T.end

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
      <Sequence name="StudioMark ident — back to paper" from={T.f} durationInFrames={LOGO_FRAMES} premountFor={30}>
        <ThreadWipe>
          <LogoIdent />
        </ThreadWipe>
      </Sequence>
      <Grain strength={0.05} />
    </AbsoluteFill>
  )
}
