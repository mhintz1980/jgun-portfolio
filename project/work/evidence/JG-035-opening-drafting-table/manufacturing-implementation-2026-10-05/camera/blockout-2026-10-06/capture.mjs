import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
const out = path.dirname(fileURLToPath(import.meta.url)), root = process.cwd()
const url = process.argv.find(a=>a.startsWith('--url='))?.slice(6) ?? 'http://localhost:4173'
const sha = b=>createHash('sha256').update(b).digest('hex')
const anchors = [
  ['grooved-blank', 0.5, 'Original grooved shaft blank before gear shaping.'],
  ['cutter-exit', 8.5, 'Disc cutter at the face exit beside the original relief groove.'],
  ['failed-4140', 16.4, 'AISI 4140, 40–45 HRC, failed on the original grooved design, according to the designer.'],
  ['failed-4340', 18.8, 'AISI 4340, 48–50 HRC, failed on the original grooved design, according to the designer.'],
  ['failed-c300', 21.5, 'C300, 56–58 HRC, failed on the original grooved design, according to the designer.'],
  ['revised-blank', 24, 'Revised smooth blank retains material where the earlier relief groove was.'],
  ['hobbing', 28, 'Illustrative single-start hob generates the revised tooth and lead-out region.'],
  ['runout-withdrawn', 32.4, 'Approved tooth runout with the hob withdrawn.'],
  ['revised-4340', 34, 'Revised AISI 4340, heat treated to 48–50 HRC, with a cool illustrative stress concentration overlay.'],
  ['support-before', 35.8, 'Legacy bearing and retaining ring position beside the original housing-seat witness.'],
  ['support-after', 38.2, 'Approved bearing and retaining ring at the final position, displaced 2.75 millimetres in shaft-local Y.'],
  ['assembly', 41.8, 'Revised shaft, supports, housing and gear carriers in the assembled inspection study.'],
]
const hashes = {}
for (const f of ['public/models/manufacturing-core-full.glb','public/models/manufacturing-core-lite.glb','src/scene/inspection/shaft/camera.ts','src/scene/inspection/shaft/shaftRuntime.ts','src/components/ShaftStoryLayer.css','dist/index.html']) hashes[f]=sha(await fs.readFile(path.join(root,f)))
const report = {schema:1,url,generated_utc:new Date().toISOString(),input_hashes:hashes,anchors:[],defects:[],note:'Conservative projected CAD/action anchors measured with live camera on the same rendered session; image visibility remains available in raster captures. Frame timing is not assessed.'}
const browser = await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11','--disable-background-timer-throttling','--disable-renderer-backgrounding']})
try {
 for (const [layout,width,height] of [['desktop',1440,900],['narrow',390,844]]) {
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'no-preference'})
  const page=await context.newPage(), errors=[], bundleRequests=[]
  page.on('pageerror',e=>errors.push(String(e)))
  page.on('request',q=>{if(/manufacturing-core-(full|lite)\.glb/.test(q.url()))bundleRequests.push(q.url())})
  await page.goto(`${url}/?chapter=1&inspectionProof=1`,{waitUntil:'networkidle',timeout:120000})
  await page.waitForFunction(()=>!!window.__rig&&!!window.__threeCamera,null,{timeout:120000})
  await page.locator('[data-story="shaft-p001835"]').waitFor({state:'visible',timeout:30000})
  await page.locator('[data-story="shaft-p001835"]').click()
  await page.waitForFunction(()=>window.__inspection?.loaded&&window.__inspection.status==='ready',null,{timeout:120000})
  await page.waitForTimeout(1400)
  await page.evaluate(()=>{
    const r=window.__threeRenderer,original=r.render
    window.__cameraAcceptance={sequence:0,last:null}
    r.render=function(scene,camera,...args){const value=original.call(this,scene,camera,...args);if(scene===window.__threeScene){
      const p=window.__inspection,h=window.__cameraAcceptance;h.sequence++
      h.last={sequence:h.sequence,session:p.session,time:p.sampledTime,sampleStamp:p.sampleStamp,cameraSampleStamp:p.cameraSampleStamp,cameraTime:p.cameraSampleTime,calls:this.info.render.calls,triangles:this.info.render.triangles}
    }return value}
  })
  for (const [name,time,alt] of anchors) {
   await page.locator('#inspection-seek').fill(String(time))
   await page.waitForFunction(time=>{const p=window.__inspection,h=window.__cameraAcceptance.last;return h&&Math.abs(p.time-time)<1e-5&&Math.abs(h.time-time)<1e-5&&h.sampleStamp===h.cameraSampleStamp},time,{timeout:15000})
   await page.waitForTimeout(200)
   const measurement=await page.evaluate(({name,width,height})=>{
    const cam=window.__threeCamera,scene=window.__threeScene,p=window.__inspection,root=scene.getObjectByName('manufacturing-study-root')
    const world=cam.position.clone(), pts=[]
    const rect=points=>{const pixels=points.map(v=>{world.copy(v).project(cam);return[(world.x+1)*width/2,(1-world.y)*height/2,world.z]});return pixels.length?{min:[Math.min(...pixels.map(v=>v[0])),Math.min(...pixels.map(v=>v[1]))],max:[Math.max(...pixels.map(v=>v[0])),Math.max(...pixels.map(v=>v[1]))],depth:[Math.min(...pixels.map(v=>v[2])),Math.max(...pixels.map(v=>v[2]))]}:null}
    const box=(xmin,xmax,ymin,ymax,zmin,zmax)=>{const a=[];for(const x of[xmin,xmax])for(const y of[ymin,ymax])for(const z of[zmin,zmax])a.push(cam.position.clone().set(x/1000,z/1000,-y/1000));return a}
    const dom=selector=>{const el=document.querySelector(selector);if(!el)return null;const r=el.getBoundingClientRect();return{min:[r.left,r.top],max:[r.right,r.bottom],text:el.textContent}}
    const projected={}
    for(const n of ['study-legacyshaft','study-approvedshaft','shaper-cutter-disc','hob-thread','shaft-single-rake-chip','study-approvedbearing','study-approvedring']){
      const ob=root.getObjectByName(n);if(!ob)continue
      const ps=[];ob.updateWorldMatrix(true,true)
      let visible=ob.visible;for(let c=ob.parent;c&&c!==root;c=c.parent)visible=visible&&c.visible
      if(visible)ob.traverse(child=>{if(!child.isMesh)return;const a=child.geometry.attributes.position;for(let i=0;i<a.count;i++){world.set(a.getX(i),a.getY(i),a.getZ(i)).applyMatrix4(child.matrixWorld);if(n.includes('shaft')&&(-world.z*1000<3.2||-world.z*1000>20))continue;ps.push(world.clone())}})
      projected[n]={visible,bounds:rect(ps),vertices:ps.length}
    }
    const exit=rect(box(-1.5,1.5,8.67,10.94,3.8,7.2))
    const card=dom('.shaft-story-column'),header=dom('.ring-inspection-dialog header'),copy=dom('.ring-inspection-copy'),footer=dom('.ring-inspection-dialog footer')
    const action={min:[width*.08,Math.max(height*.08,copy.max[1]+8)],max:[width*.92,Math.min(height*.92,footer.min[1]-8)]}
    const margins={left:exit.min[0]/width,right:(width-exit.max[0])/width,top:exit.min[1]/height,bottom:(height-exit.max[1])/height}
    const intersects=(a,b)=>a&&b&&a.min[0]<b.max[0]&&a.max[0]>b.min[0]&&a.min[1]<b.max[1]&&a.max[1]>b.min[1]
    const key=p.time<22.6?'study-legacyshaft':'study-approvedshaft',shaft=projected[key]?.bounds
    const passExit=name!=='cutter-exit'||(Object.values(margins).every(x=>x>=.08)&&!intersects(exit,header)&&!intersects(exit,copy)&&!intersects(exit,footer))
    const cardCollision=card&&card.max[1]>card.min[1]&&intersects(shaft,card)
    return {telemetry:JSON.parse(JSON.stringify(p)),rendered:window.__cameraAcceptance.last,camera:{position:cam.position.toArray(),quaternion:cam.quaternion.toArray(),up:cam.up.toArray(),fov:cam.fov,projection:cam.projectionMatrix.toArray(),world:cam.matrixWorld.toArray()},viewport:[width,height],projected,exit_critical_roi:exit,exit_margin_fraction:margins,dom:{card,materialCard:dom('.shaft-card'),attribution:dom('.shaft-attribution'),caption:dom('.shaft-caption'),header,copy,footer},action_region:action,exit_8_percent_margin_pass:passExit,card_action_overlap:!!cardCollision,narrativeTelemetryTier:window.__telemetry?.performance?.tier??null,rendererDevice:window.__threeRenderer.getContext().getParameter(window.__threeRenderer.getContext().getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL??0x1F01)}
   },{name,width,height})
   const full=`${layout}-${name}.png`,canvas=`${layout}-${name}-canvas.png`
   await page.screenshot({path:path.join(out,full)})
   const hide=await page.addStyleTag({content:'.ring-inspection-portal{visibility:hidden!important}'})
   await page.locator('canvas[data-engine]').screenshot({path:path.join(out,canvas)})
   await hide.evaluate(el=>el.remove())
   const after=await page.evaluate(()=>({session:window.__inspection.session,time:window.__inspection.time,rendered:window.__cameraAcceptance.last}))
   const actualBundle=bundleRequests.at(-1),tier=actualBundle?.includes('-full.glb')?'full':actualBundle?.includes('-lite.glb')?'lite':'unresolved'
   const row={layout,name,time,alt,full_png:full,canvas_png:canvas,clean_canvas_capture:'Inspection portal hidden temporarily through a measurement-only style element; unchanged paused WebGL scene captured, then style removed.',...measurement,actualBundle,tier,bundleRequests:[...bundleRequests],after_capture:after}
   if(!row.exit_8_percent_margin_pass)report.defects.push({layout,name,kind:'exit-margin-or-controls-overlap',margins:row.exit_margin_fraction})
   if(row.card_action_overlap)report.defects.push({layout,name,kind:'card-action-overlap'})
   if(after.session!==row.rendered.session||Math.abs(after.time-time)>1e-5)report.defects.push({layout,name,kind:'session-or-time-changed'})
   report.anchors.push(row)
   await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2))
   console.log('ANCHOR',layout,name,'margin',row.exit_8_percent_margin_pass,'cardOverlap',row.card_action_overlap)
  }
  report.defects.push(...errors.map(error=>({layout,kind:'pageerror',error})))
  await context.close()
 }
}catch(e){report.defects.push({kind:'capture-error',error:String(e)});throw e}
finally{await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log('CAMERA_CAPTURE_DONE',report.anchors.length,'defects',report.defects.length)
