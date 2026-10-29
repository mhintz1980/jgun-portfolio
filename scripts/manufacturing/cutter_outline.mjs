#!/usr/bin/env node
/**
 * JG-035 shaft tooling leaf (producer): conjugate shaper-cutter outline.
 *
 * Reads the certified meridian profile study (camera/profile-study.json) and derives the
 * illustrative 60-tooth prototype outline by the conjugate-envelope method, then writes
 * src/scene/inspection/shaft/cutterOutline.json.
 *
 * Node only, no dependencies. Deterministic: no timestamps, no randomness, stable key order.
 * Read-only on every input; writes only the outline JSON.
 *
 * Usage (repo root): node scripts/manufacturing/cutter_outline.mjs [--check]
 * --check regenerates in memory and compares without changing a file.
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '..', '..')

const PROFILE_REL = 'project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/camera/profile-study.json'
const OUT_REL = 'src/scene/inspection/shaft/cutterOutline.json'
const PROFILE_PATH = join(REPO, PROFILE_REL)
const OUT_PATH = join(REPO, OUT_REL)

// Owner-directed 60-tooth presentation prototype. The measured work profile
// is historical input; clearance-v4 certifies only the old 20-tooth tool.
const CHECK = process.argv.includes('--check')
const SCHEMA = 'jgun-shaper-cutter-outline/v2-prototype-60t'
const MODULE_MM = 1
const CUTTER_TEETH = 60
const CENTRE_MM = MODULE_MM * (CUTTER_TEETH + 10) / 2
const SIGNED_RATIO_WORK_OVER_CUTTER = -CUTTER_TEETH / 10
const WORK_TEETH = 10 // measured: 36 deg pitch
const WORK_TIP_MM = 6.0834 // measured legacy face tip radius
const WORK_ROOT_MM = 4.2918 // measured face root radius
const CUTTER_TIP_MM = 30.7032 // CENTRE - WORK_ROOT - stock; illustrative, not a clearance pass
const STOCK_MM = 0.005 // shrink the entire tool envelope to leave 5 um radial work stock
const ROOT_CLEARANCE_MM = 0.15 // cutter valley clearance past the work tip
const TOOTH_SPAN_DEG = 360 / CUTTER_TEETH // 6
const ROLL_STEP_DEG = 0.02 // <= 0.02 per spec
const BIN_DEG = 0.05 // <= 0.05 per spec
const TOOTH_BINS = Math.round(TOOTH_SPAN_DEG / BIN_DEG) // 120

const TIP_LIMIT_MM = CUTTER_TIP_MM
const ROOT_LIMIT_MM = CENTRE_MM - WORK_TIP_MM - ROOT_CLEARANCE_MM

const DEG = Math.PI / 180

function fail(message) {
  process.stderr.write('cutter_outline: ' + message + '\n')
  process.exit(1)
}

function main() {
  // Match the source-hash convention used by tools.test.ts across CRLF/LF checkouts.
  const raw = Buffer.from(readFileSync(PROFILE_PATH,'utf8').replace(/\r\n/g,'\n'))
  const digest = createHash('sha256').update(raw).digest('hex')
  const study = JSON.parse(raw.toString('utf8'))

  const workProfile = study?.profiles?.legacy?.['6.0']
  if (!Array.isArray(workProfile) || workProfile.length !== 7200) fail('profile-study.json profiles.legacy["6.0"] must contain 7200 radii')
  const angularStepDeg = Number(study?.angular_step_deg)
  if (angularStepDeg !== 0.05) fail('angular_step_deg must be 0.05')
  if (workProfile.some((r) => !Number.isFinite(r) || r <= 0)) fail('work profile contains an invalid radius')

  const samples = workProfile.length
  const workX = new Float64Array(samples)
  const workY = new Float64Array(samples)
  for (let i = 0; i < samples; i++) {
    const phi = i * angularStepDeg * DEG
    const r = workProfile[i]
    workX[i] = r * Math.cos(phi)
    workY[i] = r * Math.sin(phi)
  }

  const toothPitchRad = (2 * Math.PI) / CUTTER_TEETH
  const minRadius = new Float64Array(TOOTH_BINS).fill(Infinity)
  const rollSteps = Math.round(TOOTH_SPAN_DEG / ROLL_STEP_DEG)

  // Roll one cutter pitch; the family is 2*pi/CUTTER_TEETH periodic in the cutter frame, so the
  // cutter polar angle is folded into a single tooth before binning.
  for (let step = 0; step <= rollSteps; step++) {
    const thetaC = step * ROLL_STEP_DEG * DEG
    const thetaW = SIGNED_RATIO_WORK_OVER_CUTTER * thetaC
    const cosW = Math.cos(thetaW)
    const sinW = Math.sin(thetaW)
    const cosC = Math.cos(-thetaC)
    const sinC = Math.sin(-thetaC)
    for (let i = 0; i < samples; i++) {
      const fx = CENTRE_MM + workX[i] * cosW - workY[i] * sinW
      const fy = workX[i] * sinW + workY[i] * cosW
      const cx = fx * cosC - fy * sinC
      const cy = fx * sinC + fy * cosC
      const radius = Math.sqrt(cx * cx + cy * cy)
      let angle = Math.atan2(cy, cx)
      if (angle < 0) angle += 2 * Math.PI
      const folded = angle - Math.floor(angle / toothPitchRad) * toothPitchRad
      let bin = Math.floor((folded / toothPitchRad) * TOOTH_BINS)
      if (bin < 0) bin = 0
      if (bin >= TOOTH_BINS) bin = TOOTH_BINS - 1
      if (radius < minRadius[bin]) minRadius[bin] = radius
    }
  }

  // Fill any empty polar bin by interpolating between populated neighbours.
  let emptyBefore = 0
  for (let b = 0; b < TOOTH_BINS; b++) if (!Number.isFinite(minRadius[b])) emptyBefore++
  if (emptyBefore > 0) {
    for (let b = 0; b < TOOTH_BINS; b++) {
      if (Number.isFinite(minRadius[b])) continue
      let back = 1
      while (back < TOOTH_BINS && !Number.isFinite(minRadius[(b - back + TOOTH_BINS) % TOOTH_BINS])) back++
      let fwd = 1
      while (fwd < TOOTH_BINS && !Number.isFinite(minRadius[(b + fwd) % TOOTH_BINS])) fwd++
      const a = minRadius[(b - back + TOOTH_BINS) % TOOTH_BINS]
      const c = minRadius[(b + fwd) % TOOTH_BINS]
      minRadius[b] = a + (c - a) * (back / (back + fwd))
    }
  }

  // Leave stock on the flanks and crest, then clamp to the derived prototype bounds.
  const points = new Array(TOOTH_BINS)
  let minOut = Infinity
  let maxOut = -Infinity
  for (let b = 0; b < TOOTH_BINS; b++) {
    let r = minRadius[b] - STOCK_MM
    if (!Number.isFinite(r)) r = TIP_LIMIT_MM
    if (r < ROOT_LIMIT_MM) r = ROOT_LIMIT_MM
    if (r > TIP_LIMIT_MM) r = TIP_LIMIT_MM
    if (r < minOut) minOut = r
    if (r > maxOut) maxOut = r
    const angleRad = b * BIN_DEG * DEG
    points[b] = [Number(angleRad.toFixed(9)), Number(r.toFixed(6))]
  }

  const diagnostics = CUTTER_TEETH===20 ? compareToMatchedShaper(study, points)
    : { comparable:false,reason:'no certified matched-shaper diagnostic exists for the 60-tooth prototype' }

  const document = {
    schema: SCHEMA,
    method: 'conjugate envelope: roll one cutter pitch, fold the cutter polar angle into one tooth, keep the minimum work-material radius per 0.05 deg bin, subtract 0.005 mm radial stock, clamp to the derived prototype envelope',
    source: { profile_study: PROFILE_REL, sha256: digest, angular_step_deg: angularStepDeg, work_profile: 'profiles.legacy["6.0"]' },
    parameters: {
      cutter_teeth: CUTTER_TEETH,
      work_teeth: WORK_TEETH,
      centre_distance_mm: CENTRE_MM,
      signed_ratio_work_over_cutter: SIGNED_RATIO_WORK_OVER_CUTTER,
      work_tip_radius_mm: WORK_TIP_MM,
      work_root_radius_mm: WORK_ROOT_MM,
      cutter_tip_radius_mm: CUTTER_TIP_MM,
      stock_mm: STOCK_MM,
      root_clearance_mm: ROOT_CLEARANCE_MM,
      root_limit_mm: Number(ROOT_LIMIT_MM.toFixed(6)),
      tip_limit_mm: Number(TIP_LIMIT_MM.toFixed(6)),
      roll_step_deg: ROLL_STEP_DEG,
      bin_deg: BIN_DEG,
    },
    tooth: { angle_span_deg: TOOTH_SPAN_DEG, point_count: points.length, min_radius_mm: Number(minOut.toFixed(6)), max_radius_mm: Number(maxOut.toFixed(6)), points },
    prototype: {
      status:'illustrative-derived-prototype',module_mm:MODULE_MM,
      work_pitch_radius_mm:MODULE_MM*WORK_TEETH/2,cutter_pitch_radius_mm:MODULE_MM*CUTTER_TEETH/2,
      centre_distance_mm:CENTRE_MM,
      derivation:'centre = sum of pitch radii; tip = centre - work root - stock; root limit = centre - work tip - clearance',
      historical_certified_outline:'20-tooth clearance-v4 outline (centre 15.5, ratio -2) is unchanged in the certified report',
      owner_approved:false,manufacturing_acceptance:false,
      generator:'scripts/manufacturing/cutter_outline.mjs (60-tooth prototype; --check verifies without writing)',
    },
    diagnostics: { empty_bins_filled: emptyBefore, matched_shaper: diagnostics },
  }

  if(CHECK){
    const installed=JSON.parse(readFileSync(OUT_PATH,'utf8'))
    // Compare values recursively; JSON property order is not geometry.
    const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'
      ?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value
    if(JSON.stringify(stable(installed))!==JSON.stringify(stable(document))){
      const mismatches=[]
      const compare=(a,b,path)=>{
        if(mismatches.length>=5)return
        if(a&&b&&typeof a==='object'&&typeof b==='object'){
          for(const key of new Set([...Object.keys(a),...Object.keys(b)]))compare(a[key],b[key],path+'.'+key)
        }else if(a!==b)mismatches.push(path+': '+JSON.stringify(a)+' != '+JSON.stringify(b))
      }
      compare(installed,document,'outline')
      fail('installed outline differs from regenerated prototype: '+mismatches.join('; '))
    }
  }else writeFileSync(OUT_PATH, JSON.stringify(document, null, 1) + '\n')

  const ds = diagnostics
  process.stdout.write('cutter_outline: ' + (CHECK?'verified ':'wrote ') + OUT_REL + '\n')
  process.stdout.write('  profile sha256 ' + digest + '\n')
  process.stdout.write('  points ' + points.length + ' (span ' + TOOTH_SPAN_DEG + ' deg), radius ' + minOut.toFixed(6) + '..' + maxOut.toFixed(6) + ' mm\n')
  process.stdout.write('  empty_bins_filled ' + emptyBefore + '\n')
  if (ds.comparable) {
    process.stdout.write('  matched_shaper_diagnostics: shift ' + ds.shiftBins + ' bins, max |outline - diag| ' + ds.maxDeviationMm.toFixed(6) + ' mm, rms ' + ds.rmsDeviationMm.toFixed(6) + ' mm (unaligned max ' + ds.unalignedMaxDeviationMm.toFixed(6) + ' mm)\n')
  } else {
    process.stdout.write('  matched_shaper_diagnostics: not comparable (' + ds.reason + ')\n')
  }
}

// Compare the derived one-tooth outline against the recorded MATCHED_SHAPER profile. The diagnostic
// is one 0.05 deg polar period of the same cutter, so an integer bin shift aligns the two phases.
function compareToMatchedShaper(study, points) {
  const diag = study?.matched_shaper_diagnostics?.[0]?.radii_mm
  if (!Array.isArray(diag) || diag.length < TOOTH_BINS) return { comparable: false, reason: 'no matched_shaper radii' }
  const period = new Float64Array(TOOTH_BINS)
  let finite = 0
  for (let b = 0; b < TOOTH_BINS; b++) {
    const v = diag[b]
    period[b] = Number.isFinite(v) && v > 0 ? v : 0
    if (period[b] > 0) finite++
  }
  if (finite < TOOTH_BINS * 0.5) return { comparable: false, reason: 'matched_shaper radii mostly empty' }
  const radius = points.map((p) => p[1])
  let bestShift = 0
  let bestRms = Infinity
  for (let shift = 0; shift < TOOTH_BINS; shift++) {
    let sum = 0
    for (let b = 0; b < TOOTH_BINS; b++) {
      const d = radius[(b + shift) % TOOTH_BINS] - period[b]
      sum += d * d
    }
    const rms = Math.sqrt(sum / TOOTH_BINS)
    if (rms < bestRms) {
      bestRms = rms
      bestShift = shift
    }
  }
  let maxDev = 0
  for (let b = 0; b < TOOTH_BINS; b++) {
    const d = Math.abs(radius[(b + bestShift) % TOOTH_BINS] - period[b])
    if (d > maxDev) maxDev = d
  }
  let unalignedMax = 0
  for (let b = 0; b < TOOTH_BINS; b++) {
    const d = Math.abs(radius[b] - period[b])
    if (d > unalignedMax) unalignedMax = d
  }
  return {
    comparable: true,
    shiftBins: bestShift,
    shift_deg: Number((bestShift * BIN_DEG).toFixed(4)),
    maxDeviationMm: Number(maxDev.toFixed(6)),
    rmsDeviationMm: Number(bestRms.toFixed(6)),
    unalignedMaxDeviationMm: Number(unalignedMax.toFixed(6)),
  }
}

main()
