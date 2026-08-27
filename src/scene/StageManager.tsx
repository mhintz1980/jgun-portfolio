import { type ReactNode } from 'react'
import { SpatialWorld } from './SpatialWorld'
import { Station2_AcousticEnclosure } from './stages/Station2_AcousticEnclosure'
import { AirflowField } from './stages/AirflowField'
import { M249Stage } from './stages/M249Stage'

/**
 * Multi-chapter stage & spatial world orchestrator.
 *
 * Wraps the three engineering stations in the measured 3D SpatialWorld:
 *   Station 1 (`[0, 0, 0]`):     JGUN D1-AP Multi-Stage Torque Multiplier (CH.01/02)
 *   Station 2 (`[28, 0, -6]`):   RL-300 / MSP Acoustic SAFE Enclosure + AirflowField (CH.03)
 *   Station 3 (`[56, 0, -12]`):  M249 / MK46 Reverse-Engineered Platform (CH.04)
 */
export function StageManager({ children }: { children: ReactNode }) {
  return <SpatialWorld>{children}</SpatialWorld>
}

export { Station2_AcousticEnclosure, AirflowField, M249Stage, SpatialWorld }
