import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
const out=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/i,'$1'))
const browser=await chromium.launch({channel:'chrome',headless:true})
const report={started:new Date().toISOString(),method:'Simulate unavailable WebGL before app startup, native scroll through all four chapter cards, keyboard Enter/Space station navigation, DOM bounds and focus checks. Scoped accessibility checks; not a WCAG audit.',cases:[]}
try {
  for(const [width,height] of [[1600,900],[768,1024],[390,844]]) {
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1})
    const page=await context.newPage();const r={width,height,errors:[],failures:[],checkpoints:[],navigation:[]};report.cases.push(r)
    page.on('pageerror',e=>r.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')r.errors.push(m.text())})
    await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:original.call(this,type,...args)}})
    const read=()=>page.evaluate(()=>({canvasCount:document.querySelectorAll('canvas').length,headings:[...document.querySelectorAll('main h2')].map(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON()})),buttons:[...document.querySelectorAll('nav[aria-label="Station navigation"] button')].map(e=>({name:e.getAttribute('aria-label'),current:e.getAttribute('aria-current'),rect:e.getBoundingClientRect().toJSON()})),scrollY,maxScroll:document.documentElement.scrollHeight-innerHeight,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,focus:{tag:document.activeElement.tagName,name:document.activeElement.getAttribute('aria-label'),shadow:getComputedStyle(document.activeElement).boxShadow},bodyText:document.body.innerText}))
    try{
      await page.goto('http://localhost:4173/',{waitUntil:'networkidle'})
      await page.getByRole('navigation',{name:'Station navigation'}).waitFor()
      for(const [index,fraction] of [0,.45,.7,.9].entries()){
        await page.evaluate(f=>window.scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*f),fraction);await page.waitForTimeout(400)
        const snap=await read();r.checkpoints.push({index,fraction,...snap})
        if(snap.canvasCount || snap.headings.length!==1 || snap.buttons.length!==3 || snap.horizontalOverflow)r.failures.push(`chapter ${index}: canvas/card/nav/overflow gate`)
        const h=snap.headings[0]?.rect;if(!h || h.x<0 || h.y<0 || h.right>width || h.bottom>height)r.failures.push(`chapter ${index}: heading out of viewport`)
        await page.screenshot({path:path.join(out,`poster-${width}x${height}-chapter-${index}.png`)})
      }
      for(let index=0;index<3;index++){
        const button=page.getByRole('navigation',{name:'Station navigation'}).getByRole('button').nth(index)
        await button.focus();await page.keyboard.press(index===1?'Space':'Enter')
        // Native smooth scrolling of a ~16k px station jump can exceed a fixed
        // 1200 ms wait (station 2 was still 389 px short on 2026-09-27). Poll
        // until BOTH the target's state settles AND the scroll reaches the
        // expected raw position (paced→raw via rawScrollFor; ±48 px tolerance)
        // — crossing the chapter threshold alone is not target accuracy.
        // Verified against src/scene/drawing/introTimeline.ts (node --experimental-strip-types):
        // rawScrollFor(0.60)=0.6818181818, rawScrollFor(0.85)=0.8806818182.
        const expectedRaw=index===1?0.6818181818:index===2?0.8806818182:0
        for(let poll=0;poll<25;poll++){
          await page.waitForTimeout(200)
          const probe=await read()
          const target=probe.buttons[index]
          const maxScroll=probe.maxScroll
          const settled=target?.current==='true' && probe.focus.name===target?.name && probe.headings.length===1
          const atTarget=Math.abs(probe.scrollY-maxScroll*expectedRaw)<=48
          if(settled&&atTarget) break
        }
        const snap=await read();r.navigation.push({index,...snap})
        if(snap.buttons[index].current!=='true' || snap.focus.name!==snap.buttons[index].name || snap.headings.length!==1)r.failures.push(`station ${index}: keyboard navigation/current/focus failed`)
      }
      await page.getByRole('navigation',{name:'Station navigation'}).getByRole('button').first().focus();await page.keyboard.press('Tab')
      r.tabFocus=await page.evaluate(()=>document.activeElement.getAttribute('aria-label'))
      if(r.tabFocus!==r.navigation[0].buttons[1].name)r.failures.push('Tab order failed')
      await fs.promises.writeFile(path.join(out,`poster-${width}x${height}-accessibility.txt`),await page.locator('body').ariaSnapshot())
    }catch(e){r.failures.push(String(e))}finally{r.passed=r.failures.length===0 && r.errors.length===0;await context.close();console.log(JSON.stringify({width,height,passed:r.passed,failures:r.failures,errors:r.errors}));fs.writeFileSync(path.join(out,'poster-results.json'),JSON.stringify(report,null,2))}
  }
}finally{await browser.close();report.finished=new Date().toISOString();report.passed=report.cases.length===3 && report.cases.every(r=>r.passed);fs.writeFileSync(path.join(out,'poster-results.json'),JSON.stringify(report,null,2))}
process.exitCode=report.passed?0:1
