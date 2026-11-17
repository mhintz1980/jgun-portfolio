(()=>{const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const b=document.getElementById('menuBtn'),m=document.getElementById('menu');
if(b&&m){let open=false,tm=0;const eyes=[...m.querySelectorAll('.eye')],bg=m.querySelector('.menu-bg'),bot=m.querySelector('.mbot');
 const look=(x,y)=>{const r=bot.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy)||1,k=Math.min(1,d/220);
  eyes.forEach(e=>e.style.transform=`translate(${dx/d*7*k}px,${dy/d*5*k}px)`);bot.style.transform=`rotate(${Math.max(-8,Math.min(8,dx/40))}deg)`;
  if(!RM&&bg)bg.style.transform=`translate(${(x/innerWidth-.5)*-24}px,${(y/innerHeight-.5)*-24}px)`;};
 m.addEventListener('pointermove',e=>look(e.clientX,e.clientY));m.addEventListener('pointerdown',e=>{look(e.clientX,e.clientY);bot.classList.remove('react');void bot.offsetWidth;bot.classList.add('react');});
 const foc=()=>[...m.querySelectorAll('a')].concat([b]);
 const set=o=>{if(o===open)return;open=o;clearTimeout(tm);const r=b.getBoundingClientRect();m.style.setProperty('--cx',(r.left+r.width/2)+'px');m.style.setProperty('--cy',(r.top+r.height/2)+'px');
  b.setAttribute('aria-expanded',o);b.setAttribute('aria-label',o?'Close menu':'Open menu');b.querySelector('.mb-l').textContent=o?'Close':'Menu';document.body.classList.toggle('menu-open',o);
  if(o){m.hidden=false;requestAnimationFrame(()=>requestAnimationFrame(()=>m.classList.add('open')));setTimeout(()=>(m.querySelector('[aria-current]')||m.querySelector('a')).focus({preventScroll:true}),RM?0:350);}
  else{m.classList.remove('open');m.classList.add('closing');tm=setTimeout(()=>{m.hidden=true;m.classList.remove('closing');},RM?0:720);b.focus({preventScroll:true});}};
 b.onclick=()=>set(!open);m.addEventListener('click',e=>{if(e.target.closest('a'))set(false);});
 addEventListener('keydown',e=>{if(!open)return;if(e.key==='Escape'){set(false);return;}
  if(e.key==='Tab'){const f=foc(),i=f.indexOf(document.activeElement);e.preventDefault();f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus();}});}
if(document.body.classList.contains('pg')){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.1});document.querySelectorAll('.reveal').forEach(el=>io.observe(el));}
// lazy videos: poster + shimmer until canplay; mp4 first (Safari); play only in view
const done=v=>{const w=v.closest('.vwrap');if(w)w.classList.remove('loading');};
const load=v=>{if(v._l)return;v._l=1;const w=v.closest('.vwrap');if(w)w.classList.add('loading');v.preload='metadata';v.querySelectorAll('source[data-src]').forEach(s=>s.src=s.dataset.src);
 ['canplay','playing'].forEach(e=>v.addEventListener(e,()=>done(v),{once:true}));v.addEventListener('error',()=>done(v),true);v.load();};
const play=v=>{const p=v.play();if(p)p.catch(()=>{v.controls=true;done(v);});};
if(RM)document.querySelectorAll('video.mv').forEach(v=>{v.controls=true;v.preload='none';v.querySelectorAll('source[data-src]').forEach(s=>s.src=s.dataset.src);});
const vio=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){if(RM)return;load(v);if(!v.classList.contains('hov')||matchMedia('(hover:none)').matches)play(v);}else v.pause();}),{rootMargin:'200px 0px',threshold:.01});
document.querySelectorAll('video.mv').forEach(v=>{vio.observe(v);if(v.classList.contains('hov')){const c=v.closest('a')||v;c.addEventListener('mouseenter',()=>{if(RM)return;load(v);play(v);});c.addEventListener('mouseleave',()=>v.pause());}});
})();
