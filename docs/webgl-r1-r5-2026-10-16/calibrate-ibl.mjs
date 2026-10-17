import { createServer } from 'vite'
import { chromium } from 'playwright'
import { launchBrowser } from '../../scripts/lib/browser-launch.mjs'
import { pixels } from '../../scripts/lib/preview-pixels.mjs'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const root=fileURLToPath(new URL('../../',import.meta.url)),out=fileURLToPath(new URL('./ibl-calibration/',import.meta.url))
mkdirSync(out,{recursive:true})
let server,browser
const result=[]
try {
  server=await createServer({root,logLevel:'warn',server:{host:'localhost',port:5199,strictPort:true,hmr:false,watch:null}});await server.listen()
  browser=await launchBrowser(chromium)
  const c=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2}),p=await c.newPage()
  await p.goto('http://localhost:5199/?qualityLock=1&qualityDiagnostics=1')
  await p.waitForFunction(()=>window.__telemetry?.performance?.warmReady,null,{timeout:180000})
  for(const [id,progress] of [['03-ch01-hero-pbr',0.15],['04-ch02-explode-ghost',0.35],['05-ch02-lcd-dwell',0.47],['06-ch03-station2-cut',0.65]]){
    await p.evaluate(async value=>{const {rawScrollFor}=await import('/src/scene/drawing/introTimeline.ts');window.__lenis.scrollTo((document.documentElement.scrollHeight-innerHeight)*rawScrollFor(value),{immediate:true})},progress)
    await p.waitForTimeout(3300)
    const mask=pixels(readFileSync(new URL(`./candidate-matched/${id}-role-mask.png`,import.meta.url)))
    for(const gain of [1,2,4,6,8]){
      // StudioRig normally owns this value each frame. Use a one-frame useFrame probe
      // inserted before the composer to override ONLY this deliberate calibration.
      await p.evaluate(gain=>{
        const state=window.__threeScene.__r3f.root.getState()
        window.__reviewCalibrationUnsub?.()
        window.__reviewCalibrationUnsub=state.internal.subscribe({current:()=>{window.__threeScene.environmentIntensity=gain*(window.__telemetry.scroll.progress>=0.525&&window.__telemetry.scroll.progress<=0.72?0.35:1)}},0,window.__threeScene.__r3f.root)
      },gain)
      await p.waitForTimeout(250)
      const png=await p.screenshot({path:`${out}/${id}-gain${gain}.png`}),image=pixels(png),hist=new Uint32Array(256)
      let count=0,clipped=0
      for(let y=2;y<image.height-2;y++)for(let x=2;x<image.width-2;x++){
        const at=(y*image.width+x)*mask.channels,id=mask.data[at]
        if(id<1||id>8||mask.data[at-2*mask.channels]!==id||mask.data[at+2*mask.channels]!==id||mask.data[at-2*image.width*mask.channels]!==id||mask.data[at+2*image.width*mask.channels]!==id)continue
        const i=(y*image.width+x)*image.channels,l=Math.round(.2126*image.data[i]+.7152*image.data[i+1]+.0722*image.data[i+2]);hist[l]++;count++;if(l>252)clipped++
      }
      let accumulated=0,p99;for(let l=0;l<256;l++){accumulated+=hist[l];if(accumulated>=count*.99){p99=l;break}}
      const row={id,progress,gain,p99,clippedFraction:clipped/count,pixels:count};result.push(row);console.log(JSON.stringify(row))
    }
    await p.evaluate(()=>window.__reviewCalibrationUnsub?.())
  }
}catch(e){result.push({fatal:String(e.stack??e)})}finally{await browser?.close();await server?.close();writeFileSync(`${out}/summary.json`,JSON.stringify(result,null,2))}
