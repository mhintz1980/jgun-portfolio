/* Contact form: Turnstile + honeypot + timing → /api/contact (Resend) */
(()=>{const SK='0x4AAAAAAFjWMWRsJ55j1mkc',T0=Date.now();
const ready=new Promise(r=>{window.__onTs=()=>r(window.turnstile)});
document.querySelectorAll('form[data-hform]').forEach(f=>{
 const st=f.querySelector('.st'),bt=f.querySelector('button[type=submit]'),box=f.querySelector('.ts-slot');let tok='',id=null,loaded=false;
 const load=()=>{if(loaded)return;loaded=true;const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__onTs';s.async=1;document.head.appendChild(s);
  ready.then(ts=>{id=ts.render(box,{sitekey:SK,action:'contact',appearance:'interaction-only',size:'flexible',callback:t=>{tok=t},'expired-callback':()=>{tok='';ts.reset(id)},'error-callback':()=>{st.textContent='Security check failed to load. Refresh and try again.'}})})};
 f.addEventListener('focusin',load,{once:true});new IntersectionObserver((e,o)=>{if(e.some(x=>x.isIntersecting)){load();o.disconnect()}},{rootMargin:'300px'}).observe(f);
 f.addEventListener('submit',async e=>{e.preventDefault();if(f.dataset.busy)return;const d=Object.fromEntries(new FormData(f));
  if(!tok){try{tok=window.turnstile&&id!=null?window.turnstile.getResponse(id)||'':''}catch{}}
  if(!tok){st.textContent='Please wait a moment for the security check, then try again.';load();return}
  f.dataset.busy=1;bt.disabled=true;st.textContent='Sending…';
  try{const r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:d.name,email:d.email,need:d.need||'',message:d.message,honeypot:d.website,t:T0,turnstile:tok,site:f.dataset.hform,test:/^TEST\b/.test(d.message||'')})});
   const j=await r.json().catch(()=>({}));
   if(r.ok){f.innerHTML='<p class="st done" role="status">Thanks, your message is in. John will reply by email.</p>';return}
   st.textContent=j.error||'Something went wrong. Write to connect@hanusek.com'}catch{st.textContent='Could not send. Write to connect@hanusek.com'}
  bt.disabled=false;tok='';try{window.turnstile.reset(id)}catch{}delete f.dataset.busy})})})();
