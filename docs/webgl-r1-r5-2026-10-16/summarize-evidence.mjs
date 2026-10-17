import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const here=path.dirname(fileURLToPath(import.meta.url)), root=path.resolve(here,'../..')
const read=f=>JSON.parse(readFileSync(path.join(here,f),'utf8'))
const candidate=read('candidate-verified/telemetry.json'), baseline=read('baseline-matched/telemetry.json')
const historical=JSON.parse(readFileSync(path.join(root,'docs/webgl-review-2026-10-16/evidence/runtime-telemetry-probe.json')))
const lighting=candidate.stops.filter(s=>s.lighting).map(s=>({p:s.p,...s.lighting,pass:s.lighting.subject.pixels>1000&&s.lighting.subject.p99>=215&&s.lighting.subject.p99<=248&&s.lighting.subject.clippedFraction<0.0025}))
const gears=lighting.find(s=>s.p===.35).roles
const gearMedians=Object.fromEntries(['toolSteel','cageSteel','planetSteel'].map(r=>[r,gears[r].median]))
const differences=[Math.abs(gearMedians.toolSteel-gearMedians.cageSteel),Math.abs(gearMedians.cageSteel-gearMedians.planetSteel),Math.abs(gearMedians.toolSteel-gearMedians.planetSteel)]
const sourceIdentity=Object.entries(candidate.sourceHashes).map(([file,expected])=>({file,expected,actual:createHash('sha256').update(readFileSync(path.join(root,file))).digest('hex')}))
const cameras=candidate.stops.map(s=>{
  const expected=historical.stops.find(h=>h.id===s.id).camera, actual=s.snapshot.telemetry.camera
  const positionError=Math.hypot(actual.x-expected.position[0],actual.y-expected.position[1],actual.z-expected.position[2])
  const fresh=baseline.stops.find(a=>a.id===s.id).snapshot.telemetry.camera
  const freshError=Math.hypot(actual.x-fresh.x,actual.y-fresh.y,actual.z-fresh.z)
  return {p:s.p,historicalPositionErrorMetres:positionError,historicalFovErrorDegrees:Math.abs(actual.fov-expected.fov),freshPositionErrorMetres:freshError,freshFovErrorDegrees:Math.abs(actual.fov-fresh.fov),pass:freshError<0.002&&Math.abs(actual.fov-fresh.fov)<0.02}
})
const gains=candidate.stops.find(s=>s.p===.35).snapshot.materials.filter(m=>m.compiledRoleEnvGain!==undefined)
const symmetric = existsSync(path.join(here,'perf-candidate/telemetry.json')) ? { baseline:read('perf-baseline/telemetry.json'), candidate:read('perf-candidate/telemetry.json') } : null
const acceptance={
  candidate:'candidate-verified/telemetry.json',baseline:'baseline-matched/telemetry.json',historical:'../webgl-review-2026-10-16/evidence/runtime-telemetry-probe.json',
  runtimePassed:candidate.passed,runtimeChecks:candidate.checks.length,lighting,gearMedians,gearMedianPairwiseGaps:differences,
  lightingPassed:lighting.length===4&&lighting.every(s=>s.pass)&&differences.every(d=>d>=12),
  sourceIdentity,sourceIdentityPassed:sourceIdentity.every(s=>s.expected===s.actual),cameras,cameraMatchPassed:cameras.every(s=>s.pass),
  historicalCameraDiscrepancy:'Historical p=.85 position was ~29.57mm short of its own goal. Fresh A/B settled positions match within0.068mm at every stop; compare fresh A/B for framing preservation, retain historical pixel deltas as observations with this confound.',
  pointerYawAssertion:{source:'Saved actual hero-frame callback samples, independent postprocessing assertion added after reviewer finding',pass:candidate.r5.pointerResponses.length===4&&candidate.r5.pointerResponses.every(r=>Math.abs(r.yaw-0.08*(1-Math.exp(-8)))<1e-8)},
  compiledRoleGains:{count:gains.length,pass:gains.length>=15&&gains.every(m=>Math.abs(m.compiledRoleEnvGain-m.envMapIntensity)<1e-9)},
  performance:{historical:historical.perfSweepAtDpr2,freshBaseline:baseline.perfSweep,candidate:candidate.perfSweep,note:'120 rAF samples,119 intervals in fresh arms; short CPU/rAF sweep, not GPU timer-query timings or proof of steady 60fps. Hardware/driver identical; OS caches/load and adaptation differ. Historical DPR2 label is not the recorded actual DPR.'},
  symmetricPerformance:symmetric?{baseline:symmetric.baseline.perfRuns,candidate:symmetric.candidate.perfRuns,note:'Separate no-mask/no-screenshot performance-only arms, same actual DPR1. First run flagged warmup; compare three subsequent sweeps, no sustained60fps claim.'}:null,
  pixels:candidate.stops.map(s=>({id:s.id,p:s.p,historical:s.historicalPixelComparison,fresh:s.freshPixelComparison})),
  knownSuiteFailure:'Existing portalGeometry.test.ts ring7 fold [9282,9306] reproduces on pre-task module baseline; see static-checks.json.',
  ownerVisualApproval:'OPEN; no commit, push or deploy authorized',
}
acceptance.passed=acceptance.runtimePassed&&acceptance.lightingPassed&&acceptance.sourceIdentityPassed&&acceptance.cameraMatchPassed&&acceptance.compiledRoleGains.pass&&acceptance.pointerYawAssertion.pass
writeFileSync(path.join(here,'acceptance.json'),JSON.stringify(acceptance,null,2))
const line=(v,d=2)=>Number(v).toFixed(d)
let markdown='# R1–R5 hardware verification\n\n'
markdown+=`Measured acceptance: **${acceptance.passed?'PASS':'OPEN'}**. ${candidate.checks.length} rendering/runtime gates; four lighting stops; compiled role gains; source identity and camera framing. Owner visual approval remains open.\n\n`
markdown+='The three Sol/high implementation lanes wrote only the five authorized source files. A GLM-5.3/max follow-up wrote one fill panel then hit HTTP429; parent inspected and completed calibration. Reviewer binding is Astra/medium; see independent-review.md for actual reviewer result.\n\n'
markdown+='| Capture | Subject p99 | Clipped >252 | Status |\n|---|---:|---:|---|\n'
for(const s of lighting)markdown+=`| ${s.p} | ${s.subject.p99} | ${line(s.subject.clippedFraction*100,4)}% | ${s.pass?'PASS':'OPEN'} |\n`
markdown+=`\nExploded-stop role medians: tool ${gearMedians.toolSteel}, carrier ${gearMedians.cageSteel}, planet ${gearMedians.planetSteel}; pairwise gaps ${differences.join('/')}. Flat-ID masks exclude translucent composites and erode silhouettes by two pixels. Matching screenshots retain DOM overlays, a measurement limitation. Role statistics apply where the role has visible samples.\n\n`
markdown+='| Sweep | p50 ms | p95 ms | p99 ms |\n|---|---:|---:|---:|\n'
for(const [name,s] of [['Historical supplied',historical.perfSweepAtDpr2],['Fresh pre-task A',baseline.perfSweep],['Final candidate B',candidate.perfSweep]])markdown+=`| ${name} | ${line(s.p50Ms)} | ${line(s.p95Ms)} | ${line(s.p99Ms)} |\n`
if(symmetric){
  markdown+='\nSeparate symmetric performance-only arms exclude mask/screenshot work in both and fix actual DPR1. First run is warmup; post-warm samples:\n\n| Arm/run | p50 ms | p95 ms | p99 ms |\n|---|---:|---:|---:|\n'
  for(const [arm,d] of Object.entries(symmetric))for(const s of d.perfRuns.filter(s=>!s.warmup))markdown+=`| ${arm}/${s.run} | ${line(s.p50Ms)} | ${line(s.p95Ms)} | ${line(s.p99Ms)} |\n`
  markdown+='\nCandidate p95 improves in these short repeated observations; median varies between17.0 and33.0ms. Long frames remain, including the original capture-run p99 785.4ms and symmetric max83.6ms. This does not establish sustained60fps or a general startup/performance acceptance.\n'
}
markdown+='\nThe sweep is a short rAF observation, not a GPU timing benchmark or a steady-60fps claim. Fresh A reproduced the stale 2880×1800 composer buffer and cold-warm decline. B resizes the composer to the requested drawing buffer; full uses supported 4× samples, lite uses SMAA at DPR1, and final EffectPass output dithers. Poster and reduced-motion unmount the canvas/composer.\n\n'
markdown+='| Stop | Historical changed pixels (>8/channel) | Historical mean channel delta | Fresh A changed pixels |\n|---|---:|---:|---:|\n'
for(const s of acceptance.pixels)markdown+=`| ${s.p} | ${line(s.historical.fraction*100)}% | ${line(s.historical.meanChannelDelta)} | ${line(s.fresh.fraction*100)}% |\n`
markdown+='\nBoth matching arms use real Lenis seeks and confirm all seven historical explode/ghost states. Camera differences are recorded in acceptance.json; shader compilation, connected-canvas context loss and page/console/HTTP errors are checked. Diagnostic staircase, tier transitions, overlay cycles and actual hero-frame callbacks are explicitly forced probes, separate from natural seek evidence. The disconnected WebGL capability probe is excluded from context-loss failures.\n\n'
markdown+='Historical p=.85 camera position is 29.57mm short of its own goal; fresh A/B endpoints match. Framing preservation uses fresh A/B, whose maximum difference is below0.068mm. Historical pixel changes at that stop include the baseline settling discrepancy. Saved actual yaw samples also pass the independent expected exponential-response assertion across30/60/120/144Hz.\n\n'
markdown+='Initial baseline/candidate folders omitted real scrolling and are diagnostic history only. candidate-matched precedes lighting calibration; candidate-final used hero gain12 and measured p99 212. candidate-verified is the final evidence. Frozen source hashes in its telemetry must match current files.\n\n'
markdown+='Build and suite details: static-checks.json. Controlled suite: 1013 passed, four skipped, one existing portal geometry fold failure, independently reproduced with pre-task source. Full suite is therefore not green. Final production checks: production-smoke.json. Preservation: preservation-manifest.json and preservation-final.json. No protected assets, canonical dirty files, existing evidence, or .scratch are authorized write paths.\n'
writeFileSync(path.join(here,'results.md'),markdown)
console.log(JSON.stringify({passed:acceptance.passed,runtime:candidate.checks.length,lighting:lighting.map(s=>({p:s.p,p99:s.subject.p99,clipped:s.subject.clippedFraction,pass:s.pass})),gearMedians,differences,sourceIdentityPassed:acceptance.sourceIdentityPassed,cameraMatchPassed:acceptance.cameraMatchPassed,compiledRoleGains:acceptance.compiledRoleGains,perf:candidate.perfSweep}))
