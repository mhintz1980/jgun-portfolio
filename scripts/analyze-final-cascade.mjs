import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
const input=process.argv[2]??'output/playwright/final-cascade-2026-10-26/final-verified/report.json'
const report=JSON.parse(readFileSync(input,'utf8')),degrees=180/Math.PI
const ratios=[1,.2,.04,0,.008,.0016,.0016,0],multipliers=[3.5,10/3,36/13,0,52/11,6,0,0]
const wrap=x=>Math.atan2(Math.sin(x),Math.cos(x))
const screenAngle=node=>{
  const a=node.points.find(p=>p.label==='origin').pixel,b=node.points.find(p=>p.label==='x5mm').pixel
  return Math.atan2(-(b[1]-a[1]),b[0]-a[0])
}
const results=report.cases.map(c=>{
  const motions=c.captures.map(x=>x.motion)
  let ratioResidual=0,planetResidual=0,meshResidual=0
  for(const m of motions){
    meshResidual=Math.max(meshResidual,m.meshPhaseError)
    for(let i=0;i<ratios.length;i++){
      ratioResidual=Math.max(ratioResidual,Math.abs(m.carriers[i]-m.carriers[0]*ratios[i]))
      for(const p of m.planets[i]??[])planetResidual=Math.max(planetResidual,Math.abs(p+m.carriers[i]*multipliers[i]))
    }
  }
  const heroes=[{stage:2,index:1,t:53.2},{stage:5,index:2,t:58.2},{stage:3,index:4,t:61.2},{stage:4,index:5,t:64}].map(h=>{
    const a=c.captures.find(x=>x.time===h.t),b=c.captures.find(x=>Math.abs(x.time-h.t-.1)<1e-8)
    if(!a||!b)return {...h,missing:true}
    const dt=b.motion.time-a.motion.time
    const cageA=a.capture.landmarks.find(x=>x.cascadeIndex===h.index),cageB=b.capture.landmarks.find(x=>x.cascadeIndex===h.index)
    const planetA=a.capture.landmarks.find(x=>new RegExp(`^MERGED stage${h.stage} Planet \\d+$`).test(x.name))
    const planetB=planetA&&b.capture.landmarks.find(x=>x.uuid===planetA.uuid)
    const projectedCage=cageA&&cageB?Math.abs(wrap(screenAngle(cageB)-screenAngle(cageA)))*degrees/dt:null
    const projectedPlanet=planetA&&planetB?Math.abs(wrap(screenAngle(planetB)-screenAngle(planetA)))*degrees/dt:null
    const cageFeature=`stage${h.stage}Sun`,planetFeature=`stage${h.stage}Planets`
    return {...h,dt,cageDegreesPerSecond:Math.abs(b.motion.carriers[h.index]-a.motion.carriers[h.index])*degrees/dt,
      absolutePlanetDegreesPerSecond:Math.abs((b.motion.carriers[h.index]+b.motion.planets[h.index][0])-(a.motion.carriers[h.index]+a.motion.planets[h.index][0]))*degrees/dt,
      projectedCageDegreesPerSecond:projectedCage,projectedPlanetDegreesPerSecond:projectedPlanet,
      cagePixelContribution:a.capture.features[cageFeature]?.identityDifference.pixels,
      planetPixelContribution:a.capture.features[planetFeature]?.identityDifference.pixels}
  })
  const drops=heroes.slice(1).map((h,i)=>({from:heroes[i].stage,to:h.stage,
    cage:heroes[i].projectedCageDegreesPerSecond/h.projectedCageDegreesPerSecond,
    planet:heroes[i].projectedPlanetDegreesPerSecond/h.projectedPlanetDegreesPerSecond}))
  const scaleSamples=c.captures.filter(x=>[52.2,53.1,56.4,60,63.15,66.9].includes(x.time)).map(x=>{
    const stage=x.capture.landmarks.find(n=>n.cascadeIndex===1),a=stage?.points.find(p=>p.label==='origin').pixel,b=stage?.points.find(p=>p.label==='x5mm').pixel
    return {time:x.time,stage2FiveMmAxisPixels:a&&b?Math.hypot(a[0]-b[0],a[1]-b[1]):null}
  })
  return {name:c.name,ratioResidual,planetResidual,meshResidual,heroes,drops,scaleSamples,cadence:c.cadence,
    pixelWindowRatios:c.windows?.map(w=>({time:w.time,ratio:w.ratio,pixels:w.pixels})),denseFrames:c.dense?.length,
    denseFailures:c.dense?.filter(x=>!x.valid||x.failed.length),
    gates:{ratiosAndPhase:ratioResidual<1e-9&&planetResidual<1e-9&&meshResidual<1e-9,
      projectedReduction:drops.length===3&&drops.every(x=>x.cage>=1.5&&x.planet>=1.5)&&heroes.every(x=>x.cagePixelContribution>0&&x.planetPixelContribution>0),
      headed60Hz:report.headed&&Math.abs((c.cadence?.medianMs??0)-1000/60)<1,
      windows:c.windows?.every(w=>Math.abs(w.ratio/1.5-1)<=.02)}}
})
const analysis={input,created:new Date().toISOString(),cases:results,originalGates:report.gates,
  pass:report.pass&&results.every(x=>Object.values(x.gates).every(Boolean))}
const output=path.join(path.dirname(input),'analysis.json');writeFileSync(output,JSON.stringify(analysis,null,2))
console.log(JSON.stringify({output,pass:analysis.pass,cases:results.map(x=>({name:x.name,gates:x.gates,heroes:x.heroes,drops:x.drops}))}));process.exitCode=analysis.pass?0:1
