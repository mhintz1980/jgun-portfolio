import { Composition, Folder } from 'remotion'
import { loadFonts } from './theme'
import { Showreel, SHOWREEL_FRAMES } from './Showreel'
import { Opening, OPENING_FRAMES } from './scenes/Opening'
import { WrenchAct, WRENCH_FRAMES } from './scenes/WrenchAct'
import { MachineAct, MACHINE_FRAMES } from './scenes/MachineAct'
import { ArmamentAct, ARMAMENT_FRAMES } from './scenes/ArmamentAct'
import { Close, CLOSE_FRAMES } from './scenes/Close'

loadFonts()

const HD = { fps: 30, width: 1920, height: 1080 } as const

export const RemotionRoot = () => (
  <>
    <Composition id="Showreel" component={Showreel} durationInFrames={SHOWREEL_FRAMES} {...HD} />
    <Folder name="Acts">
      <Composition id="Opening" component={Opening} durationInFrames={OPENING_FRAMES} {...HD} />
      <Composition id="WrenchAct" component={WrenchAct} durationInFrames={WRENCH_FRAMES} {...HD} />
      <Composition id="MachineAct" component={MachineAct} durationInFrames={MACHINE_FRAMES} {...HD} />
      <Composition id="ArmamentAct" component={ArmamentAct} durationInFrames={ARMAMENT_FRAMES} {...HD} />
      <Composition id="Close" component={Close} durationInFrames={CLOSE_FRAMES} {...HD} />
    </Folder>
  </>
)
