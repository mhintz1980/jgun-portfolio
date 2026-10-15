import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const root=process.cwd(),base='project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery'
const hash=b=>createHash('sha256').update(b).digest('hex')
const sourcePath=base+'/source-20261013-s.json',sourceBytes=readFileSync(sourcePath),source=JSON.parse(sourceBytes)
const requiredBindings=['scripts/verify-torque-stage4-effects.mjs','src/scene/torque-wrench/PrivateSheet.tsx'].map(path=>{const f=source.files.find(f=>f.path===path);if(!f)throw new Error('Missing required frozen input '+path);return f})
const sourceDrift=source.files.filter(f=>hash(readFileSync(f.path))!==f.sha256).map(f=>f.path)
const protectedDrift=source.preserved.filter(f=>hash(readFileSync(f.path))!==f.sha256).map(f=>f.path)
if(sourceDrift.length||protectedDrift.length)throw new Error('Source/protected drift '+JSON.stringify({sourceDrift,protectedDrift}))
const reports=[],artifacts=[]
for(const v of ['D','N'])for(const kind of ['effects','continuity']){
 const dir=base+'/'+(kind==='effects'?'effects-20261013-s-':'continuity-20261014-s3-')+v,file=dir+'/'+(kind==='effects'?'stage4-effects-report.json':'continuity-report.json'),bytes=readFileSync(file),j=JSON.parse(bytes)
 if(kind==='effects'&&(!j.runtime.pass||!j.served.pass))throw new Error('Failed effects '+v)
 if(j.provenance.verifierSha256!==requiredBindings[0].sha256||j.provenance.source.aggregateSha256!==source.sourceAggregateSha256||j.provenance.source.sha256!==hash(sourceBytes))throw new Error('Required source/verifier binding mismatch '+file)
 if(kind==='continuity'){
  if(j.errors.length||j.requestFailures?.length)throw new Error('Continuity errors/requests '+v)
  if(j.harnessSha256!==hash(readFileSync(base+'/continuity-harness-20261014.mjs')))throw new Error('Continuity harness mismatch '+v)
  const effectsFile=base+'/effects-20261013-s-'+v+'/stage4-effects-report.json'
  if(j.effectsBinding.path!==effectsFile||j.effectsBinding.sha256!==hash(readFileSync(effectsFile)))throw new Error('Continuity effects binding mismatch '+v)
  const expectedViewport={D:[1440,900,1],N:[390,844,3]}[v]
  if(j.observed.innerWidth!==expectedViewport[0]||j.observed.innerHeight!==expectedViewport[1]||j.observed.devicePixelRatio!==expectedViewport[2]||j.observed.shaderWarmReady!==1)throw new Error('Continuity viewport/warmup mismatch '+v)
  if(Object.values(j.bySweep).some(s=>s.gapsOver100ms.length))throw new Error('Observed opening stall '+v)
 }
 const rows=kind==='effects'?j.runtime.artifacts:j.artifacts
 reports.push({path:file,sha256:hash(bytes),kind,viewport:v,buildAggregate:j.provenance.aggregateSha256,sourceAggregate:j.provenance.source.aggregateSha256,verifierSha256:j.provenance.verifierSha256,harnessSha256:j.harnessSha256??null,assertions:kind==='effects'?j.runtime.assertions.length:null,unverified:kind==='effects'?j.runtime.unverified:[],bySweep:j.bySweep??null})
 for(const a of rows){const path=dir+'/'+a.file,png=readFileSync(path),width=png.readUInt32BE(16),height=png.readUInt32BE(20);if(hash(png)!==a.sha256||png.length!==a.bytes)throw new Error('PNG mismatch '+path);if(width!==(v==='D'?1440:1170)||height!==(v==='D'?900:2532))throw new Error('PNG raster mismatch '+path)
  const requested=Number(/-p([\d.]+)\.png$/.exec(a.file)?.[1]);const sample=kind==='effects'?j.runtime.samples.find(s=>s.requested===requested):null;const point=kind==='effects'?j.runtime.continuity.flatMap(w=>w.points).find(p=>p.requested===requested):null
  artifacts.push({path,bytes:a.bytes,sha256:a.sha256,width,height,kind,viewport:v,requestedProgress:requested,observedProgress:a.observation?.progress??sample?.progress??(point?JSON.parse(point.stateKey)[0]:null),report:file,buildAggregate:j.provenance.aggregateSha256})
 }
}
const evidenceAggregateSha256=hash(Buffer.from(JSON.stringify({source:hash(sourceBytes),requiredBindings,reports:reports.map(x=>({path:x.path,sha256:x.sha256})),artifacts:artifacts.map(x=>({path:x.path,sha256:x.sha256}))})))
const result={schema:'JG038-stage4-review-manifest-v1',createdAt:new Date().toISOString(),workspace:root,branch:source.branch,head:source.head,sourceManifest:{path:sourcePath,sha256:hash(sourceBytes),aggregateSha256:source.sourceAggregateSha256},requiredBindings,evidenceAggregateSha256,build:source.buildDir,sourceFilesChecked:source.files.length,preserved:source.preserved,sourceDrift,protectedDrift,reports,artifacts,scope:'Prepared technical/effects and owner unaltered-PNG review. No Astra/owner acceptance or gate closure. PNGs remain unaltered; full G5 motion and continuous clearance remain open.'}
writeFileSync(base+'/review-manifest-20261013-s.json',JSON.stringify(result,null,2));console.log('Verified source347, protected'+source.preserved.length+', reports'+reports.length+', unaltered PNGs'+artifacts.length)
