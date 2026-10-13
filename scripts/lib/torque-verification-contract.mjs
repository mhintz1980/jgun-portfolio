// Approved JG-038 contract 18. Pure report validation; no renderer, filesystem or acceptance
// side effects. A missing observable remains unverified and prevents a performance PASS.
export const TORQUE_BUDGETS = Object.freeze({
  full: Object.freeze({ dpr: 1.5, pixels: 3686400, p50: 17.2, p95: 20, p99: 33.4, tailPercent: 1, maximum: 100 }),
  lite: Object.freeze({ dpr: 1, pixels: 2073600, p50: 17.2, p95: 22.2, p99: 33.4, tailPercent: 1, maximum: 100 }),
})

export const TORQUE_PHASE_BUDGETS = Object.freeze({
  drafting: Object.freeze({ full: [350, 2000000, 192], lite: [250, 1500000, 128] }),
  breakthrough: Object.freeze({ full: [500, 3000000, 256], lite: [350, 2000000, 160] }),
  mechanism: Object.freeze({ full: [300, 2000000, 192], lite: [220, 1500000, 128] }),
  inspection: Object.freeze({ full: [400, 2500000, 256], lite: [280, 1750000, 160] }),
  close: Object.freeze({ full: [200, 1000000, 192], lite: [150, 750000, 128] }),
})

const finite = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0
const nonempty = (s) => typeof s === 'string' && s.trim().length > 0

/**
 * One run/phase report. Caller retains all three independent runs for each D/N live tier;
 * this validator never pools samples, averages passes or downgrades a failed full case.
 * Inputs are measured presented-frame totals. Count-only texture metrics are insufficient.
 */
export function validateTorquePerformanceSample(report) {
  const errors = [], unverified = []
  const missing = (key) => unverified.push(`Missing or invalid ${key}`)
  const check = (key, value, max) => {
    if (!finite(value)) missing(key)
    else if (value > max) errors.push(`${key} ${value} exceeds ${max}`)
  }
  if (!report || typeof report !== 'object') return { pass: false, errors, unverified: ['Missing report'] }
  const budget = TORQUE_BUDGETS[report.requestedTier]
  if (!budget) errors.push('Requested tier must be full or lite')
  if (report.effectiveTier !== report.requestedTier) errors.push('Effective tier does not match requested tier')
  if (report.qualityLock !== false) errors.push('Natural adaptation requires qualityLock:false')
  if (report.hardwareGL !== true) errors.push('Hardware performance requires observed hardware GL')
  if (report.captureActive !== false || report.throttled !== false) errors.push('Primary performance requires capture-free, unthrottled measurements')
  for (const key of ['runId', 'device', 'os', 'browser', 'renderer', 'backend', 'power', 'inputScript', 'sourceHash', 'buildHash', 'assetHash', 'servedHash']) {
    if (!nonempty(report[key])) missing(key)
  }
  if (!['D', 'N'].includes(report.viewportCase)) errors.push('Primary case must be D or N')
  if (!Number.isInteger(report.run) || report.run < 1 || report.run > 3) errors.push('Independent run index must be 1..3')
  if (!finite(report.refreshHz) || report.refreshHz === 0) missing('refreshHz')
  if (!finite(report.observationSeconds) || report.observationSeconds < 60) errors.push('Phase observation must cover at least 60 seconds')
  if (report.prewarmComplete !== true || report.ready !== true) errors.push('Prewarm and readiness must complete before measurement')
  if (report.phaseInput?.forwardSeconds !== 20 || report.phaseInput?.reverseSeconds !== 20 || report.phaseInput?.holdSeconds !== 20) {
    errors.push('Phase input must retain separate 20s forward/reverse/hold portions')
  }
  const phase = TORQUE_PHASE_BUDGETS[report.phase]?.[report.requestedTier]
  if (!phase) errors.push('Unknown phase or phase tier')
  if (budget) {
    for (const [key, max] of Object.entries(budget)) check(key, report[key], max)
  }
  if (phase) {
    check('peakFrameCalls', report.peakFrameCalls, phase[0])
    check('peakFrameTriangles', report.peakFrameTriangles, phase[1])
    check('residentTextureTargetMiB', report.residentTextureTargetMiB, phase[2])
  }
  if (report.allPassTotals !== true) errors.push('Calls/triangles must sum every render pass per presented frame')
  if (!nonempty(report.memoryMethod)) missing('memoryMethod with dimensions/formats/mipmaps/faces/depth/MSAA')
  if (!finite(report.geometryBufferBytes)) missing('geometryBufferBytes')
  if (!finite(report.lineSegments) || !finite(report.points)) missing('lineSegments/points')
  if (report.programCreationObserved !== true) missing('program-creation/link-event observability')
  check('newWarmPrograms', report.newWarmPrograms, 0)
  if (!finite(report.instrumentationOverheadMs)) missing('instrumentationOverheadMs')
  return { pass: errors.length === 0 && unverified.length === 0, errors, unverified }
}

export function validateTorquePerformanceRoster(reports) {
  const errors = [], unverified = [], results = []
  if (!Array.isArray(reports)) return { pass: false, errors, unverified: ['Missing report roster'], results }
  const keys = new Set(), runIds = new Map(), sourceTuples = new Set()
  for (const report of reports) {
    const key = `${report?.viewportCase}/${report?.requestedTier}/${report?.run}/${report?.phase}`
    if (keys.has(key)) errors.push(`Duplicate phase sample ${key}`)
    keys.add(key)
    const result = validateTorquePerformanceSample(report)
    results.push({ key, ...result })
    errors.push(...result.errors.map((e) => `${key}: ${e}`))
    unverified.push(...result.unverified.map((e) => `${key}: ${e}`))
    const runKey = `${report?.viewportCase}/${report?.requestedTier}/${report?.run}`
    if (nonempty(report?.runId)) {
      if (runIds.has(runKey) && runIds.get(runKey) !== report.runId) errors.push(`Run identity changes within ${runKey}`)
      runIds.set(runKey, report.runId)
    }
    sourceTuples.add(JSON.stringify([report?.sourceHash, report?.buildHash, report?.assetHash, report?.servedHash]))
  }
  if (sourceTuples.size > 1) errors.push('Roster source/build/asset/served identity changes')
  const usedIds = new Set()
  for (const [runKey, id] of runIds) {
    if (usedIds.has(id)) errors.push(`Run ID reused across independent cases: ${runKey}`)
    usedIds.add(id)
  }
  for (const viewport of ['D', 'N']) for (const tier of ['full', 'lite']) for (const run of [1, 2, 3]) {
    for (const phase of Object.keys(TORQUE_PHASE_BUDGETS)) {
      const key = `${viewport}/${tier}/${run}/${phase}`
      if (!keys.has(key)) unverified.push(`Missing ${key}`)
    }
  }
  return { pass: errors.length === 0 && unverified.length === 0, errors, unverified, results }
}
