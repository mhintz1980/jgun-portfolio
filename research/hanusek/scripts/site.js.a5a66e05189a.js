(()=>{const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
// nav colour
const nav=document.getElementById('nav'),hero=document.querySelector('.hero');
// ink-in statements: split words
document.querySelectorAll('[data-ink]').forEach(p=>{const walk=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(t=>{if(!t)return;if(/^\s+$/.test(t))f.appendChild(document.createTextNode(t));else{const s=document.createElement('span');s.className='w';s.textContent=t;f.appendChild(s);}});c.replaceWith(f);}else walk(c);});};walk(p);});
const inks=[...document.querySelectorAll('[data-ink]')].map(p=>({p,w:[...p.querySelectorAll('.w')]}));
// reveals
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.15});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
// blueprint
const bp=document.getElementById('blueprint'),wire=[...document.querySelectorAll('#wire .d')],agent=[...document.querySelectorAll('#agent .d')],lbl=[...document.querySelectorAll('#agent .lbl')];
[...wire,...agent].forEach(e=>{let L=600;try{L=e.getTotalLength()}catch(_){}e.style.setProperty('--len',L);e._L=L;});
const cap=document.getElementById('bpCap'),bpa=document.querySelector('.bp-a'),bpb=document.querySelector('.bp-b');
// work wheel
const W=[["NowAgentic", "AI agent team that takes real work off your plate. Our flagship.", "https://media.hanusek.com/hanusek/media/work/agentfy-v16", "https://nowagentic.ai", "/work/nowagentic/"], ["Lever House", "Interactive web experience showcasing modern design principles", "https://media.hanusek.com/hanusek/media/work/leverhouse-v17b", "https://leverhousenyc.com", "/work/leverhouse/"], ["The Guild", "Creative web experience with dynamic user interactions", "https://media.hanusek.com/hanusek/media/work/theguild-v17", "https://theguildbk.com/", "/work/theguild/"], ["Journal Squared", "Modern design and development for a luxury real estate brand", "https://media.hanusek.com/hanusek/media/work/journalsquared-v17", "https://www.journalsquared.com/", "/work/journalsquared/"], ["Essex Crossing", "Creative approach to neighborhood offerings through an interactive 3D maps", "https://media.hanusek.com/hanusek/media/work/essexcrossing-v17", "https://essexcrossingnyc.com", "/work/essexcrossing/"], ["Chelsea Canvas", "Artistic approach to showcasing luxury living spaces", "https://media.hanusek.com/hanusek/media/work/chelseacanvas-v17b", "https://chelseacanvasnyc.com/", "/work/chelseacanvas/"], ["Manhattan West", "Modern architectural visualization and presentation for high-end commercial real estate", "https://media.hanusek.com/hanusek/media/work/manhattanwest-v17b", "https://manhattanwestnyc.com/", "/work/manhattanwest/"], ["YBCA", "ybca.org", "https://media.hanusek.com/hanusek/media/work/ybca", "https://ybca.org", "/work/ybca/"], ["Fort Mason Center", "fortmason.org", "https://media.hanusek.com/hanusek/media/work/fortmason", "https://fortmason.org", "/work/fortmason/"], ["SF Civic Center", "sfciviccenter.org", "https://media.hanusek.com/hanusek/media/work/sfciviccenter-v17", "https://sfciviccenter.org", "/work/sfciviccenter/"], ["The GPS Store", "thegpsstore.com", "https://media.hanusek.com/hanusek/media/work/thegpsstore", "https://thegpsstore.com", "/work/thegpsstore/"], ["Prestige Civil Contractors", "prestigecivilcontractors.com", "https://media.hanusek.com/hanusek/media/work/prestige", "https://prestigecivilcontractors.com", "/work/prestige/"], ["Casa Di Coble", "casadicoble.com", "https://media.hanusek.com/hanusek/media/work/casadicoble-v17", "https://casadicoble.com", "/work/casadicoble/"]];
const wheel=document.getElementById('wheel'),work=document.getElementById('work'),link=document.getElementById('pvLink'),frame=link,
 layers=[...frame.querySelectorAll('.pv-layer')],nameEl=document.getElementById('pvName'),nextEl=document.getElementById('pvNext'),desc=document.getElementById('pvDesc'),num=document.getElementById('pvNum');
W.forEach((w,i)=>{const li=document.createElement('li');const a=document.createElement('a');a.href=w[4];a.textContent=w[0];li.appendChild(a);wheel.appendChild(li);});
W.forEach(w=>{const im=new Image();im.decoding='async';im.src=w[2]+'.jpg';});
const p2=n=>String(n).padStart(2,'0');let inView=false,cur=-1,want=0,busy=false,front=0;
const prime=(L,i)=>{const v=L.querySelector('video'),im=L.querySelector('img');im.src=W[i][2]+'.jpg';L.classList.remove('ready');
 if(v.dataset.i!=String(i)){v.dataset.i=i;v.src=W[i][2]+'.mp4';v.load();}
 const ok=()=>{L.classList.add('ready');frame.classList.remove('loading');};
 if(!RM){v.play().then(()=>{if(v.readyState>=3)ok();else v.addEventListener('playing',ok,{once:true});}).catch(()=>{});}};
const swapText=(el,t)=>{if(RM){el.textContent=t;return;}el.classList.add('out');setTimeout(()=>{el.textContent=t;el.classList.remove('out');el.classList.add('pre');void el.offsetWidth;el.classList.remove('pre');},260);};
function show(i){want=i;if(i===cur)return;if(busy)return;busy=true;const first=cur<0;cur=i;
 [...wheel.children].forEach((li,k)=>li.classList.toggle('on',k===i));
 const F=layers[front],B=layers[1-front];
 if(first){F.querySelector('img').src=W[i][2]+'.jpg';F.classList.add('front');busy=false;}
 else{frame.classList.add('loading');prime(B,i);
  const go=()=>{B.classList.add('enter');F.classList.add('leave');requestAnimationFrame(()=>{B.classList.add('front');});
   setTimeout(()=>{F.classList.remove('front','leave');B.classList.remove('enter');const v=F.querySelector('video');v.pause();front=1-front;busy=false;if(want!==cur)show(want);},RM?0:900);};
  const v=B.querySelector('video');if(RM||v.readyState>=2)go();else{let done=false;const g=()=>{if(!done){done=true;go();}};v.addEventListener('loadeddata',g,{once:true});setTimeout(g,450);}}
 swapText(nameEl,W[i][0]);swapText(nextEl,W[(i+1)%W.length][0]);desc.textContent=W[i][1];num.textContent=`${p2(i+1)} / ${p2(W.length)}`;
 link.href=W[i][4];link.setAttribute('aria-label',`${W[i][0]}: project page`);
 // warm the next clip
 const n=W[(i+1)%W.length][2]+'.mp4';if(!document.querySelector(`link[href="${n}"]`)){const l=document.createElement('link');l.rel='prefetch';l.href=n;document.head.appendChild(l);}}
function setWork(i){show(i);}
new IntersectionObserver(es=>{inView=es[0].isIntersecting;if(inView&&!layers[front].querySelector('video').dataset.i)prime(layers[front],cur);layers.forEach(L=>{const v=L.querySelector('video');if(!inView)v.pause();else if(!RM&&L.classList.contains('front'))v.play().catch(()=>{});});},{rootMargin:'50% 0px'}).observe(work);
setWork(0);

const prog=el=>{const r=el.getBoundingClientRect();return Math.min(1,Math.max(0,-r.top/(r.height-innerHeight)));};
function tick(){const y=scrollY;nav.classList.toggle('solid',y>hero.offsetHeight-80);
 inks.forEach(({p,w})=>{const r=p.getBoundingClientRect();const t=RM?1:Math.min(1,Math.max(0,(innerHeight*.85-r.top)/(innerHeight*.55+r.height*.4)));const n=Math.round(t*w.length);w.forEach((s,i)=>s.classList.toggle('on',i<n));});
 const b=prog(bp);const w1=Math.min(1,b/.4),fadeW=Math.min(1,Math.max(0,(b-.4)/.15)),a1=Math.min(1,Math.max(0,(b-.5)/.4));
 wire.forEach(e=>{e.style.strokeDashoffset=e._L*(1-w1);e.style.opacity=1-fadeW*.88;});agent.forEach(e=>{e.style.strokeDashoffset=e._L*(1-a1);});lbl.forEach(e=>e.style.opacity=a1>.85?1:0);
 bpa.style.opacity=b<.5?1:.25;bpb.style.opacity=b<.45?.25:1;cap.textContent=b<.5?'A website wireframe: header, hero, content, footer.':'An agent system: inputs, agents, a human approval, outputs.';
 setWork(Math.min(W.length-1,Math.floor(prog(work)*W.length)));
}
let raf=0;addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;tick();});},{passive:true});addEventListener('resize',tick);tick();
})();
