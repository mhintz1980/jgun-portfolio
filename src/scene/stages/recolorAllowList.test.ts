import { describe, expect, it } from 'vitest'
import {
  CHASSIS_RECOLOR,
  PANEL_RECOLOR,
  recolorSpecFor,
} from './recolorAllowList'

/**
 * JG-032 — Recolor allow-list predicate tests.
 * The NEGATIVE cases are the regression guard against the JG-021 failure
 * bands (1) black/rubber→grey bleed and (2) yellow→saturated-wall repaint;
 * they matter more than the positives. Node names below are in their
 * GLTFLoader-sanitized form ('/' and '.' dropped, whitespace → '_').
 */
describe('JG-032 recolor allow-list — positive cases', () => {
  it('recolors the chassis frame plates with the chassis matrix', () => {
    const spec = recolorSpecFor('V2RL300-FPL-0001-1', 'MSP_BLACK_CHASSIS')
    expect(spec).toBe(CHASSIS_RECOLOR)
    expect(spec?.color).toBe('#0a1a3a')
    expect(spec?.roughness).toBeCloseTo(0.42, 6)
    expect(spec?.metalness).toBeCloseTo(0.5, 6)
    expect(spec?.envMapIntensity).toBeCloseTo(0.75, 6)
    expect(recolorSpecFor('V2RL300-FPL-0002-1', 'MSP_BLACK_CHASSIS')).toBe(CHASSIS_RECOLOR)
    expect(recolorSpecFor('RL300-CPM-3001-1', 'MSP_BLACK_CHASSIS')).toBe(CHASSIS_RECOLOR)
    expect(recolorSpecFor('V2RL300-FTS-1009-3', 'MSP_BLACK_CHASSIS')).toBe(CHASSIS_RECOLOR)
    expect(recolorSpecFor('V2ECP-SM-5000-2', 'MSP_BLACK_CHASSIS')).toBe(CHASSIS_RECOLOR)
  })

  it('recolors the composite panel sheets with the panel matrix', () => {
    const spec = recolorSpecFor('STD-LBAP-4001-1', 'MSP_BLACK_CHASSIS')
    expect(spec).toBe(PANEL_RECOLOR)
    expect(spec?.color).toBe('#132a4a')
    expect(spec?.roughness).toBeCloseTo(0.48, 6)
    expect(spec?.metalness).toBeCloseTo(0.4, 6)
    expect(spec?.envMapIntensity).toBeCloseTo(0.7, 6)
    // GLTFLoader-sanitized LBA child ('/' dropped from the GLB name)
    expect(
      recolorSpecFor('G2RL200-LBA-SAF-2000-3G2RL200-SAF-1049-2', 'MSP_BLACK_CHASSIS'),
    ).toBe(PANEL_RECOLOR)
    expect(recolorSpecFor('V2RL300-SAF-1066-4', 'MSP_BLACK_CHASSIS')).toBe(PANEL_RECOLOR)
    expect(recolorSpecFor('V2RL300-SAF-1047-1', 'MSP_BLACK_CHASSIS')).toBe(PANEL_RECOLOR)
  })

  it('stays below the documented milky-grey failure band (draft: metalness 0.78 / env 1.05)', () => {
    for (const spec of [CHASSIS_RECOLOR, PANEL_RECOLOR]) {
      expect(spec.metalness).toBeLessThan(0.78)
      expect(spec.envMapIntensity).toBeLessThan(1.05)
    }
  })
})

describe('JG-032 recolor allow-list — negative cases (JG-021 failure-band guards)', () => {
  it('rejects every MSP_YELLOW_PAINT mesh, including the G2RL300-SAF-1003-2 intake grille', () => {
    // Failure band (2), by name — the grille that read as "the cyan panel"
    expect(recolorSpecFor('G2RL300-SAF-1003-2', 'MSP_YELLOW_PAINT')).toBeNull()
    // The big yellow composite wall sheets
    expect(recolorSpecFor('G2C07-0085-3', 'MSP_YELLOW_PAINT')).toBeNull()
    expect(recolorSpecFor('G2RL300-SAF-1001-1', 'MSP_YELLOW_PAINT')).toBeNull()
    expect(recolorSpecFor('MirrorG2RL300-SAF-2002-1', 'MSP_YELLOW_PAINT')).toBeNull()
    // Yellow chassis members
    expect(recolorSpecFor('RL300-PEM-1001-1', 'MSP_YELLOW_PAINT')).toBeNull()
    expect(recolorSpecFor('RL300-SIF-1008-1', 'MSP_YELLOW_PAINT')).toBeNull()
    // Even an allow-listed NAME with a yellow material is rejected (material gate)
    expect(recolorSpecFor('V2RL300-FPL-0001-1', 'MSP_YELLOW_PAINT')).toBeNull()
  })

  it('rejects PUMP_HOUSING children — the heat source keeps its orange/steel identity', () => {
    expect(recolorSpecFor('V2SKF-TB-5500-03-1', 'MSP_BLACK_CHASSIS')).toBeNull()
    expect(recolorSpecFor('V2SKF-TB-5500-03-2', 'MSP_BLACK_CHASSIS')).toBeNull()
    expect(recolorSpecFor('V2BMP-RL-VX186-02-1', 'MSP_BLACK_CHASSIS')).toBeNull()
    expect(recolorSpecFor('5182996_REV03_MS-1', 'MSP_BLACK_CHASSIS')).toBeNull()
  })

  it('rejects ISOLATION_MOUNTS — dark rubber stays untouched (failure band 1)', () => {
    expect(recolorSpecFor('ISO_MOUNT_1', 'MSP_RUBBER')).toBeNull()
    expect(recolorSpecFor('ISO_MOUNT_6', 'MSP_RUBBER')).toBeNull()
    expect(recolorSpecFor('V2BRC-SP-VX186-RS-01-1', 'MSP_RUBBER')).toBeNull()
  })

  it('rejects the translucent airway volume and both ducts', () => {
    expect(recolorSpecFor('DUCT_INTAKE_AIRWAY', 'MSP_AIRWAY_VOLUME')).toBeNull()
    expect(recolorSpecFor('EXHAUST_PIPE-1', 'MSP_STAINLESS')).toBeNull()
    expect(recolorSpecFor('G2RL200-SAF-1004-2', 'MSP_YELLOW_PAINT')).toBeNull()
  })

  it('rejects hardware and latch parts regardless of material', () => {
    expect(recolorSpecFor('HWR-NUT-H8Z-075-1', 'MSP_STAINLESS')).toBeNull()
    expect(recolorSpecFor('V2HWR-BLT-HZ-050-150-1003', 'MSP_PLASTIC')).toBeNull()
    // Allegis latch hardware is baked black but NOT allow-listed
    expect(
      recolorSpecFor('2751-10282-S1-Allegis-100020185-2-1', 'MSP_BLACK_CHASSIS'),
    ).toBeNull()
  })

  it('rejects unknown part numbers even on the recolorable material', () => {
    expect(recolorSpecFor('SOME-FUTURE-PART-9000-1', 'MSP_BLACK_CHASSIS')).toBeNull()
    expect(recolorSpecFor('', 'MSP_BLACK_CHASSIS')).toBeNull()
    expect(recolorSpecFor('V2RL300-FPL-0001-1', '')).toBeNull()
  })
})
