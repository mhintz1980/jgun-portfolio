import { describe, expect, it } from 'vitest'
import {
  DRIVELINE_STAGE_IDS,
  GEAR_RATIOS,
  ROTATION_TURNS,
  STAGE_IDS,
} from '../../data/caseStudies'

describe('JG-031 Epicyclic Gear Rotation Ratios', () => {
  it('defines 5 reduction stages with exact JG-031 physical driveline display turns', () => {
    expect(STAGE_IDS).toEqual(['stage1', 'stage2', 'stage3', 'stage4', 'stage5'])
    expect(DRIVELINE_STAGE_IDS).toEqual(['stage1', 'stage2', 'stage5', 'stage3', 'stage4'])
    expect(ROTATION_TURNS.stage1).toBe(8)
    expect(ROTATION_TURNS.stage2).toBe(5.2)
    expect(ROTATION_TURNS.stage5).toBe(3.38)
    expect(ROTATION_TURNS.stage3).toBe(2.2)
    expect(ROTATION_TURNS.stage4).toBe(1.43)
  })

  it('enforces strictly monotonic reduction along the physical driveline from motor to snout', () => {
    for (let i = 0; i < DRIVELINE_STAGE_IDS.length - 1; i++) {
      const currentStage = DRIVELINE_STAGE_IDS[i]
      const nextStage = DRIVELINE_STAGE_IDS[i + 1]
      expect(
        ROTATION_TURNS[nextStage],
        `Physical next stage ${nextStage} must turn slower than ${currentStage}`
      ).toBeLessThan(ROTATION_TURNS[currentStage])
    }
  })

  it('maintains a consistent ~65% speed ratio (0.64 - 0.66) between consecutive physical stages', () => {
    for (let i = 0; i < DRIVELINE_STAGE_IDS.length - 1; i++) {
      const currentStage = DRIVELINE_STAGE_IDS[i]
      const nextStage = DRIVELINE_STAGE_IDS[i + 1]
      const ratio = ROTATION_TURNS[nextStage] / ROTATION_TURNS[currentStage]
      expect(
        ratio,
        `Ratio ${nextStage}/${currentStage} (${ratio.toFixed(4)}) should be approximately 0.65`
      ).toBeGreaterThanOrEqual(0.64)
      expect(
        ratio,
        `Ratio ${nextStage}/${currentStage} (${ratio.toFixed(4)}) should be approximately 0.65`
      ).toBeLessThanOrEqual(0.66)
    }
  })

  it('preserves the planet counter-rotation multiplier at 3.5', () => {
    expect(GEAR_RATIOS.planetMultiplier).toBe(3.5)
  })

  it('ensures the slowest physical stage (stage4 at snout) completes > 1.0 turn for clear visual motion', () => {
    expect(ROTATION_TURNS.stage4).toBeGreaterThan(1.0)
    expect(ROTATION_TURNS.stage4).toBeCloseTo(1.43, 2)
  })
})
