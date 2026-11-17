const HT=document.querySelector('#crewHead h1')?'h1':'h2';
import * as THREE from 'three';
import {BUILD} from './crewparts.js';
const host=document.getElementById('crew'),stageEl=document.getElementById('crewStage'),headEl=document.getElementById('crewHead');
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const CREW=[
 {id:'sonar',name:'Sonar',role:'Strategy & Research',color:0xF1EEE8,acc:0xE4572E,rx:.05,ry:-.35,eye:'pills',rows:16,head:['Listens', '<em>first</em>.'],
  a:['01 · Strategy & Research','Sonar','Finds the real problem before anyone builds.'],b:['Display','Pill eyes','Narrow, focused, always taking notes.'],moods:{surprised:'surprised'}},
 {id:'glyph',name:'Glyph',role:'Brand',color:0x1E1E1E,acc:0xE4572E,rx:.95,ry:-.25,eye:'cups',rows:12,head:['Gives it a', '<em>voice</em>.'],
  a:['02 · Brand','Glyph','Voice, logo, type and tokens that hold together everywhere.'],b:['Button','One red key','Approve or reject. Glyph has opinions.'],moods:{surprised:'surprised'}},
 {id:'swatch',name:'Swatch',role:'Design',color:0xE4572E,acc:0xF1EEE8,rx:.05,ry:-.4,eye:'goggles',rows:20,head:['Makes it', '<em>beautiful</em>.'],
  a:['03 · Design','Swatch','Wireframes, layouts and the scroll moments you remember.'],b:['Controls','Palette keys','Three keys, one slider, endless swatches.'],moods:{surprised:'surprised'}},
 {id:'rivet',name:'Rivet',role:'Code',color:0x6F6B66,acc:0xE4572E,rx:.25,ry:-.3,eye:'blocks',rows:10,head:['Builds it.', '<em>Ships</em> it.'],
  a:['04 · Code','Rivet','Front end, back end, integrations and the agent architecture underneath.'],b:['Status','Run light','Red means a build is in progress.'],moods:{surprised:'surprised'}},
 {id:'vibe',name:'Vibe',role:'Growth',color:0xF1EEE8,acc:0xE4572E,rx:.05,ry:-.35,eye:'round',rows:20,head:['Gets it', '<em>found</em>.'],
  a:['05 · Growth','Vibe','Found in search and AI answers, then launched with a plan.'],b:['Antenna','Always listening','Watches search trends and audience pulse.'],moods:{surprised:'surprised'}},
 {id:'patch',name:'Patch',role:'Care',color:0xA29D95,acc:0xE4572E,rx:.1,ry:-.3,eye:'crescent',rows:14,head:['Keeps it', '<em>running</em>.'],
  a:['06 · Care','Patch',"Tested, fast, secure, updated. Up at 3 AM so you aren't."],b:['Status','Care light','Glows when something needs attention.'],moods:{surprised:'sigh'}},
];
const R=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});R.setPixelRatio(Math.min(devicePixelRatio,2));
R.outputColorSpace=THREE.SRGBColorSpace;R.toneMapping=THREE.ACESFilmicToneMapping;document.getElementById('crewCanvas').appendChild(R.domElement);
const S=new THREE.Scene();S.background=new THREE.Color(0xFBFAF7);const cam=new THREE.PerspectiveCamera(30,1,.1,100);cam.position.set(0,.3,10);
S.add(new THREE.HemisphereLight(0xffffff,0xe9e3d8,1.1));
const key=new THREE.DirectionalLight(0xfff4e6,2.1);key.position.set(-4,6,5);S.add(key);
const rim=new THREE.DirectionalLight(0xffffff,2.6);rim.position.set(4,3,-5);S.add(rim);
const fill=new THREE.DirectionalLight(0xe8eefc,.5);fill.position.set(5,-1,4);S.add(fill);
function blobTex(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(20,20,20,.35)');r.addColorStop(1,'rgba(20,20,20,0)');g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
const shTex=blobTex();

// ---- eye styles ----
function eyeFn(style){return (c,r,C,Rw,e,b,lk)=>{const cy=Rw/2-.5+lk.y*Rw*.08,ox=lk.x*C*.05;
 const L={x:C*.3+ox,y:cy},Rr={x:C*.7+ox,y:cy};const s=Rw/20; // scale unit
 const closed=b>.5;const E=[L,Rr];
 for(const [k,p] of E.entries()){const dx=c-p.x,dy=r-p.y,d=Math.hypot(dx,dy);
  if(closed){if(Math.abs(dy)<.7&&Math.abs(dx)<Rw*.22)return 1;continue;}
  const skL=e==='skeptical'&&k===0, skR=e==='skeptical'&&k===1;
  switch(style){
   case'round':{const rad=Rw*.27;if(e==='happy'){if(d<rad*1.05&&d>rad*.66&&dy<.4)return 1;}else if(e==='surprised'){if(d<rad*1.1&&d>rad*.75)return 1;}else if(skL){if(d<rad*.95&&dy>-rad*.2)return 1;}else if(d<rad)return 1;break;}
   case'pills':{const hw=Math.max(.9,C*.07),hh=Rw*.3;if(e==='happy'){if(Math.abs(dx)<hw*1.6&&Math.abs(dy+Math.abs(dx)*.9+hh*.2)<1)return 1;}
     else if(e==='surprised'){if(Math.abs(dx)<=hw+1&&Math.abs(dy)<=hh+1&&(Math.abs(dx)>hw-.2||Math.abs(dy)>hh-.2))return 1;}
     else if(skR){if(Math.abs(dx)<hw&&dy>-hh*.1&&dy<hh*.5)return 1;}else if(Math.abs(dx)<hw&&Math.abs(dy)<hh)return 1;break;}
   case'cups':{const rad=Rw*.33; if(e==='happy'){if(d<rad&&d>rad*.6&&dy<0)return 1;} else if(e==='surprised'){if(d<rad*.9)return 1;}
     else if(skL){if(Math.abs(dy-(dx*.35)+rad*.2)<.8&&Math.abs(dx)<rad)return 1;} else { if(d<rad&&dy>-rad*.05)return 1;} break;}
   case'goggles':{const hw=C*.13,hh=Rw*.2;const ring=(a,bb)=>{const q=(dx/a)**2+(dy/bb)**2;return q<1.15&&q>.6;};
     if((c+r)%2)break; // dotted
     if(e==='happy'){if(ring(hw,hh)&&dy<0)return 1;}else if(e==='surprised'){if(ring(hw*.8,hh*1.1))return 1;}else if(skL){if(Math.abs(dy)<.8&&Math.abs(dx)<hw)return 1;}else if(ring(hw,hh))return 1;break;}
   case'blocks':{const h=Math.max(1,Rw*.12);if(e==='happy'){if(Math.abs(dx)<=h+.5&&Math.abs(dy+Math.abs(dx)-h*.5)<.6)return 1;}else if(e==='surprised'){if(Math.abs(dx)<=h+1&&Math.abs(dy)<=h+1)return 1;}else if(skR){if(Math.abs(dx)<=h&&Math.abs(dy)<.6)return 1;}else if(Math.abs(dx)<=h&&Math.abs(dy)<=h)return 1;break;}
   case'crescent':{const rad=Rw*.3;if(e==='happy'){if(d<rad&&d>rad*.6&&dy<0)return 1;}else if(e==='surprised'){if(d<rad&&d>rad*.62)return 1;}else if(skL){if(d<rad&&d>rad*.6&&dy>rad*.1)return 1;if(Math.abs(dy+rad*.2)<.6&&Math.abs(dx)<rad)return 1;}else if(d<rad&&d>rad*.6&&dy>0)return 1;break;}
  }}
 // mouths / extras
 const mx=C/2+ox,my=Rw*.82;
 if(style==='round'||style==='goggles'){if(e==='happy'){const dx=c-mx,dy=r-(my-Rw*.12);const q=Math.hypot(dx,dy*1.4);if(q<Rw*.2&&q>Rw*.13&&dy>0)return 2;}
   if(e==='surprised'&&Math.hypot(c-mx,r-my)<Rw*.07)return 2;if(e==='skeptical'&&Math.abs(r-my)<.6&&Math.abs(c-mx)<Rw*.15)return 2;
   if(style==='goggles'&&e==='neutral'&&Math.abs(r-my)<.6&&Math.abs(c-mx)<Rw*.12&&c%2)return 1;}
 
 return 0;};}

// ---- load crew ----
const chars=[];let loaded=0;
CREW.forEach((c,i)=>{
 const g=new THREE.Group();g.visible=false;S.add(g);const inner=new THREE.Group();g.add(inner);
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(4,1.5),new THREE.MeshBasicMaterial({map:shTex,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-1.95;g.add(shadow);
 const ch={c,g,inner,shadow,expr:'neutral',blink:0,nextBlink:performance.now()+1500+i*700,look:{x:0,y:0},played:false,lastMood:0,ready:false};
 const B=BUILD[c.id](c);const root=B.root;ch.anim=B.anim;
 const {glass:disp,w:geomW,h:geomH}=B.D;
 const rows=c.rows,cols=Math.max(8,Math.round(rows*geomW/geomH));
 const cv=document.createElement('canvas');const cell=Math.max(6,Math.floor(512/cols));cv.width=cols*cell;cv.height=rows*cell;
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 disp.material=new THREE.MeshPhysicalMaterial({map:tex,emissiveMap:tex,emissive:0xffffff,emissiveIntensity:1,roughness:.2,clearcoat:1,clearcoatRoughness:.05,color:0x111111});
 Object.assign(ch,{cv,cx:cv.getContext('2d'),tex,rows,cols,cell,fn:eyeFn(c.eye)});
 inner.add(root);
 const b=new THREE.Box3().setFromObject(root),sz=b.getSize(new THREE.Vector3()),ctr=b.getCenter(new THREE.Vector3());
 root.position.sub(ctr);const k=3.3/Math.max(sz.x,sz.y,sz.z*1.3);inner.scale.setScalar(k);inner.rotation.x=c.rx;
 inner.updateMatrixWorld(true);const ab=o=>inner.worldToLocal(new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()));
 ch.aLocal=c.id==='sonar'?[ab(B.acc),ab(disp)]:[ab(disp),ab(B.acc)];
 ch.ready=true;loaded++;if(loaded===CREW.length)window.__ready=1;
 // sounds
 const moodFor={happy:'happy',skeptical:'hmm',surprised:c.moods.surprised};
 ch.snd={};['signature','happy','hmm',c.moods.surprised].forEach(k=>{const a=new Audio(`/sfx/${c.id}-${k}.web.mp3`);a.preload='none';a.volume=.7;ch.snd[k]=a;});
 ch.moodFor=moodFor;chars.push(ch);
});
function drawEyes(ch){const {cx,rows,cols,cell,fn}=ch;cx.fillStyle='#0d0d0d';cx.fillRect(0,0,cols*cell,rows*cell);
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const v=fn(c,r,cols,rows,ch.expr,ch.blink,ch.look);cx.beginPath();cx.arc((c+.5)*cell,(r+.5)*cell,cell*.36,0,7);
  cx.fillStyle=v===1?'#ffe9c4':v===2?'#ff5a2c':'#262422';cx.shadowBlur=v?cell*.9:0;cx.shadowColor=v===2?'#ff4010':'#ffcf80';cx.fill();}
 cx.shadowBlur=0;ch.tex.needsUpdate=true;}

// ---- sound ----
let soundOn=false;const btn=document.getElementById('snd');
btn.onclick=()=>{soundOn=!soundOn;btn.setAttribute('aria-pressed',soundOn);btn.textContent=soundOn?'Sound on':'Sound off';if(soundOn&&cur>=0&&cur<6&&!chars[cur].played){chars[cur].played=true;play(chars[cur],'signature',true);}};
function play(ch,k,force){if(!soundOn||!k)return;const n=performance.now();if(!force&&n-ch.lastMood<1500)return;ch.lastMood=n;const a=ch.snd[k];if(!a)return;a.currentTime=0;a.play().catch(()=>{});}

// ---- callouts ----
const svg=document.getElementById('svg');const cA=document.getElementById('cA'),cB=document.getElementById('cB');
const lines=[0,1].map(()=>{const l=document.createElementNS('http://www.w3.org/2000/svg','polyline');l.setAttribute('fill','none');l.setAttribute('stroke','#141414');l.setAttribute('stroke-width','.75');svg.appendChild(l);const d=document.createElementNS('http://www.w3.org/2000/svg','circle');d.setAttribute('r','3');d.setAttribute('fill','#E4572E');svg.appendChild(d);return{l,d};});
function setCall(el,arr){el.querySelector('small').textContent=arr[0];el.querySelector('b').textContent=arr[1];el.querySelector('span').textContent=arr[2];}

let W,H,mob;function size(){W=stageEl.clientWidth;H=stageEl.clientHeight;mob=W<720;R.setSize(W,H);cam.aspect=W/H;cam.fov=mob?44:30;cam.updateProjectionMatrix();}
addEventListener('resize',size);size();
let mx=0,my=0;addEventListener('pointermove',e=>{mx=e.clientX/innerWidth*2-1;my=e.clientY/innerHeight*2-1;});
const clock=new THREE.Clock();let cur=-2,sp=0;const hud=document.getElementById('hud'),lineupEl=document.getElementById('lineup');
const EX=['neutral','happy','skeptical','surprised'];
let lastT=0;function frame(){const t=clock.getElapsedTime(),now=performance.now();const dt=Math.min(.25,t-lastT);lastT=t;const A=a=>RM?1:1-Math.pow(1-a,dt*60);
 const hr=host.getBoundingClientRect();if(hr.bottom<0||hr.top>innerHeight){requestAnimationFrame(frame);return;}
 const P=Math.min(.9999,Math.max(0,-hr.top/(hr.height-innerHeight)));const idx=Math.floor(P*7),local=P*7-idx;
 sp+=(local-sp)*(RM?1:.1);const lineup=idx===6;
 if(idx!==cur){cur=idx;headEl.innerHTML=lineup?`<span class="chip">S.02b · The crew</span><${HT}>Six agents.<br>One <em>human</em>.</${HT}>`:`<span class="chip">S.02b · 0${idx+1}/06 · ${CREW[idx].role}</span><${HT}>${CREW[idx].head[0]}<br>${CREW[idx].head[1]}</${HT}>`;if(!lineup){const c=CREW[idx];setCall(cA,c.a);setCall(cB,c.b);const ch=chars[idx];if(soundOn&&!ch.played){ch.played=true;play(ch,'signature',true);}}}
 lineupEl.classList.toggle('on',lineup);
 chars.forEach((ch,i)=>{if(!ch.ready)return;const g=ch.g;
  if(lineup){g.visible=true;
   const n=6,slot=i;
   let x,y,s;if(mob){const row=i<3?0:1,colI=i%3;x=(colI-1)*1.2;y=row?.4:2.0;s=.3;}else{x=(slot-2.5)*1.12;y=.45;s=.3;}
   g.position.lerp(new THREE.Vector3(x,y,0),A(.12));g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x,s,A(.12)));
   g.rotation.y=THREE.MathUtils.lerp(g.rotation.y,ch.c.ry*.6+(RM?0:Math.sin(t*.8+i)*.08),.1);ch.shadow.visible=true;
   const want=EX[Math.floor((t*.25+i*.37)%4)];if(!RM&&ch.expr!==want){ch.expr=want;}
  } else {const on=i===idx;g.visible=on||Math.abs(i-idx)===1&&g.scale.x>.02;
   const tgt=on?1:0.001;g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x,tgt,A(.15)));
   const xOff=mob?0:.95;g.position.set(xOff,(mob?.55:.2)+(RM?0:Math.sin(t*1.3)*.07),0);
   if(on){g.rotation.y=ch.c.ry+sp*1.1+(RM?0:mx*.08);g.rotation.x=(RM?0:my*.04);
    const e=EX[Math.min(3,Math.floor(local*4.2))];if(e!==ch.expr){ch.expr=e;play(ch,ch.moodFor[e]);}}
  }
  ch.look.x+=((lineup?0:mx)-ch.look.x)*.1;ch.look.y+=((lineup?0:-my)-ch.look.y)*.1;
  if(!RM&&now>ch.nextBlink){ch.blink=1;if(now>ch.nextBlink+120){ch.blink=0;ch.nextBlink=now+2200+Math.random()*3000;}}
  if(g.visible)drawEyes(ch);
 });
 if(hud)hud.textContent=lineup?'lineup':(CREW[idx].name+' · '+(chars[idx].expr||''));
 // callouts
 if(true){}chars.forEach(c2=>c2.anim&&c2.g.visible&&c2.anim(t,RM));const ch=chars[idx];const show=!lineup&&ch&&ch.ready;
 [cA,cB].forEach((el,k)=>{const on=show&&(k===0?local>.08:local>.4)&&(!mob||k===(local>.4?1:0));el.classList.toggle('on',on);
  if(!show){lines[k].l.setAttribute('points','');lines[k].d.style.opacity=0;return;}
  const pos=mob?[16,H*.12]:(k===0?[W*.06,H*.2]:[W*.78,H*.18]);el.style.left=pos[0]+'px';el.style.top=pos[1]+'px';
  const v=ch.aLocal[k].clone();ch.inner.updateMatrixWorld();const wv=ch.inner.localToWorld(v).project(cam);const ax=(wv.x+1)/2*W,ay=(1-wv.y)/2*H;
  const r=el.getBoundingClientRect(),ly=r.bottom+6,x0=r.left,x1=r.left+Math.min(r.width,200);
  lines[k].l.setAttribute('points',on?(ax<x0+100?`${x1},${ly} ${x0},${ly} ${ax},${ay}`:`${x0},${ly} ${x1},${ly} ${ax},${ay}`):'');
  lines[k].d.setAttribute('cx',ax);lines[k].d.setAttribute('cy',ay);lines[k].d.style.opacity=on?1:0;});
 R.render(S,cam);requestAnimationFrame(frame);}
frame();
