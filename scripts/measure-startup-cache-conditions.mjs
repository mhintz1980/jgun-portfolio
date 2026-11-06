// Three-condition fresh-context startup diagnostics; separate from natural warm-cache pairs.
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { gunzipSync, gzipSync } from 'node:zlib'
import path from 'node:path'
import { PROFILES, validateIdentity, sha256 } from './lib/performance-contract.mjs'
const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
  const m=/^--(base|identity|out|cache-file)=(.+)$/.exec(arg)
  if(!m)throw new Error(`Unknown option ${arg}`)
  return[m[1],m[2]]
}))
for(const key of ['base','identity','out','cache-file'])if(!args[key])throw new Error(`--${key} required`)
const identity=JSON.parse(readFileSync(args.identity,'utf8'))
validateIdentity(identity,'torque')
const original=readFileSync(args['cache-file']),decoded=gunzipSync(original)
if(sha256(original)!==identity.files.find(f=>f.path==='drawing/jgun-sheet-v2.bin.gz')?.sha256)throw new Error('Fixture does not match artifact cache bytes')
if(decoded.subarray(0,4).toString()!=='JGD3')throw new Error('Expected JGD3 drawing cache')
const version=decoded.readUInt32LE(8)
const staleDecoded=Buffer.from(decoded);staleDecoded.writeUInt32LE(Math.max(0,version-1),8)
const stale=gzipSync(staleDecoded)
mkdirSync(args.out,{recursive:true})
const output=path.join(args.out,'startup-cache-conditions.json')
if(existsSync(output))throw new Error('Choose a fresh --out')
const response=await fetch(new URL('/torque-wrench/index.html',args.base))
if(response.status!==200||sha256(Buffer.from(await response.arrayBuffer()))!==identity.routes.torque.htmlSha256)throw new Error('Served HTML mismatch')
const preflightIdentity=[]
for(const url of [identity.routes.torque.entry,identity.routes.torque.scene,'/models/Default.glb']){
  const expected=identity.files.find(f=>'/'+f.path===url),res=await fetch(new URL(url,args.base))
  if(res.status!==200||!expected||sha256(Buffer.from(await res.arrayBuffer()))!==expected.sha256)throw new Error(`Served identity mismatch ${url}`)
  preflightIdentity.push({path:url,sha256:expected.sha256})
}
const browser=await chromium.launch({headless:true,timeout:15000,args:['--use-angle=d3d11','--enable-gpu']})
const rows=[]
try{
  for(const profile of ['desktop','narrow'])for(const condition of ['valid','missing','stale']){
    const context=await browser.newContext(PROFILES[profile])
    const row={profile,condition,source:identity.source,artifactManifestSha256:identity.artifactManifestSha256,
      browser:browser.version(),cacheVersion:version,fixtureVersion:condition==='stale'?Math.max(0,version-1):version,
      fixtureSha256:condition==='missing'?null:sha256(condition==='stale'?stale:original),
      cacheState:'fresh-context; request interception disables browser HTTP cache',preflightIdentity,readinessObservationResolutionMs:1000,intercepted:0,errors:[],consoleErrors:[]}
    try{
      await context.route('**/drawing/jgun-sheet-v2.bin.gz',async route=>{
        row.intercepted++
        await route.fulfill(condition==='missing'?{status:404,body:'missing startup fixture'}:
          {status:200,contentType:'application/octet-stream',body:condition==='stale'?stale:original})
      })
      const page=await context.newPage()
      page.on('pageerror',e=>row.errors.push(e.message))
      page.on('console',m=>{if(m.type()==='error')row.consoleErrors.push(m.text())})
      const nav=await page.goto(new URL('/torque-wrench/',args.base).href,{waitUntil:'domcontentloaded',timeout:30000})
      if(nav.status()!==200||new URL(page.url()).pathname!=='/torque-wrench/')throw new Error('Fallback route')
      if(sha256(await nav.body())!==identity.routes.torque.htmlSha256)throw new Error('Navigation HTML byte mismatch')
      await page.waitForFunction(()=>window.__torqueWorld?.snapshot?.().ready===true,null,{timeout:60000,polling:1000})
      row.sceneReadyMs=await page.evaluate(()=>performance.now())
      await page.waitForFunction(()=>window.__torqueWorld?.snapshot?.().sheet?.baked===true,null,{timeout:60000,polling:1000})
      row.sheetReadyMs=await page.evaluate(()=>performance.now())
      row.sheet=await page.evaluate(()=>window.__torqueWorld.snapshot().sheet)
      const precomputed=row.sheet.stats?.basePrecomputed??row.sheet.stats?.precomputed
      row.valid=row.intercepted===1&&row.errors.length===0&&precomputed===(condition==='valid'?1:0)
      if(!row.valid)row.errors.push(`Expected basePrecomputed ${condition==='valid'?1:0}, observed ${precomputed}; interceptions=${row.intercepted}`)
      if(condition!=='missing'&&row.consoleErrors.length){row.valid=false;row.errors.push('Unexpected console errors')}
    }catch(error){row.valid=false;row.errors.push(String(error.stack??error))}
    finally{await context.close();rows.push(row);console.log(JSON.stringify({profile,condition,valid:row.valid,errors:row.errors,sceneReadyMs:row.sceneReadyMs,sheetReadyMs:row.sheetReadyMs}));
      writeFileSync(output,JSON.stringify({source:identity.source,artifactManifestSha256:identity.artifactManifestSha256,rows,
        limitations:['Injected cache-condition diagnostics, not natural HTTP cache timings or performance budget acceptance.',
          'Missing and stale have the same fallback outcome; fixture version/hash/interception records distinguish the inputs.',
          'No GPU/program compilation, power or full 20-phase Lean-V1 completion claim.']},null,2)+'\n')}
  }
}finally{await browser.close()}
process.exitCode=rows.some(r=>!r.valid)?1:0
