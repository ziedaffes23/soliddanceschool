/* Solid Dance School server-backed persistence.
   The browser never receives the Supabase service-role key. Public pages use a
   filtered data response; authenticated admin pages use the protected API.
   Admin pages: the session is verified with the server on every load, saves are
   queued (one at a time), carry a snapshot of known record ids so concurrent
   public registrations are never overwritten, and failures are surfaced. */
(function(){
  const json=v=>JSON.stringify(v);
  const mode=document.body?.dataset.admin||'';           // '' public, 'login', or an admin page
  const isAdminPage=!!mode&&mode!=='login';
  const PRIVATE_KEYS=['registrations','notifications','paymentMethods','opsVersion','_rev'];
  const BASE_KEY='solidBase';
  function localData(){try{return JSON.parse(localStorage.getItem('solidData')||'null')}catch{return null}}
  function readBase(){try{return JSON.parse(localStorage.getItem(BASE_KEY)||'null')||{}}catch{return {}}}
  function ids(list){return Array.isArray(list)?list.map(x=>x&&x.id).filter(Boolean):[]}
  function writeBase(data,rev){try{localStorage.setItem(BASE_KEY,json({rev,known:{registrations:ids(data.registrations),notifications:ids(data.notifications)}}))}catch{}}
  function clearAdminFlags(){['solidAdmin','solidAdminRole','solidAdminUser'].forEach(k=>sessionStorage.removeItem(k))}
  function banner(msg){
    if(!document.body)return;let el=document.querySelector('#solidSaveBanner');
    if(!msg){el&&el.remove();return}
    if(!el){el=document.createElement('div');el.id='solidSaveBanner';el.setAttribute('role','alert');el.style.cssText='position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;background:#e0442f;color:#fff;font:600 14px/1.4 system-ui,sans-serif;padding:12px 18px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.35);max-width:92vw';document.body.appendChild(el)}
    el.textContent=msg;
  }
  function sessionLost(){clearAdminFlags();if(isAdminPage)location.replace('/admin/login')}

  async function api(path,options={}){
    const response=await fetch(path,{credentials:'same-origin',...options,headers:{'content-type':'application/json',...(options.headers||{})}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){
      if(response.status===401&&isAdminPage&&path!=='/api/login'){sessionLost()}
      if(response.status===403&&data.code==='password_change_required'&&isAdminPage){clearAdminFlags();location.replace('/admin/login?change=1')}
      const err=new Error(data.error||`Request failed (${response.status})`);err.status=response.status;err.code=data.code;throw err;
    }
    return data;
  }

  /* ---- saving: serialised, with conflict-safe merge ---- */
  let chain=Promise.resolve(),pending=0;
  function doSave(data){
    const base=readBase();
    return api('/api/data',{method:'PUT',body:json({data,rev:base.rev,known:base.known})}).then(res=>{
      const local=localData()||data;
      // Merge rows that arrived on the server while this admin was editing.
      if(res.merged){['registrations','notifications'].forEach(k=>{if(Array.isArray(res.merged[k])&&json(res.merged[k])!==json(local[k]))local[k]=res.merged[k]});localStorage.setItem('solidData',json(local))}
      writeBase(local,res.rev);banner('');
      window.dispatchEvent(new CustomEvent('solid:saved',{detail:res}));
      return res;
    });
  }
  function save(data){
    localStorage.setItem('solidData',json(data));
    pending++;
    const run=chain.then(()=>doSave(data)).then(r=>({ok:true,...r}),err=>{
      console.warn('[Solid API] save failed:',err.message||err);
      if(err.status!==401)banner('⚠ Changes could not be saved to the server: '+(err.message||'network error')+'. Do not close this page — retry in a moment.');
      window.dispatchEvent(new CustomEvent('solid:save-error',{detail:err}));
      return {ok:false,error:err.message};
    }).finally(()=>{pending--});
    chain=run;return run;
  }
  const flush=()=>chain;

  async function restore(){
    if(mode==='login')return;
    try{
      if(pending>0)await flush();   // don't clobber edits that are still being written
      const result=await api(`/api/data${isAdminPage?'?scope=admin':''}`);
      if(!result.data)return;
      if(isAdminPage&&result.role&&sessionStorage.getItem('solidAdminRole')!==result.role){sessionStorage.setItem('solidAdminRole',result.role);location.reload();return}
      const current=localData();
      if(isAdminPage)writeBase(result.data,result.rev||0);
      if(json(current)!==json(result.data)){
        localStorage.setItem('solidData',json(result.data));
        if(document.readyState!=='loading'&&pending===0)location.reload();
      }
    }catch(err){console.warn('[Solid API] restore skipped:',err.message||err)}
  }

  async function verifySession(){
    if(!isAdminPage)return;
    try{
      const {user}=await api('/api/session');
      if(!user){sessionLost();return}
      if(user.mustChange){clearAdminFlags();location.replace('/admin/login?change=1');return}
      const changed=sessionStorage.getItem('solidAdminRole')!==user.role;
      sessionStorage.setItem('solidAdmin','true');sessionStorage.setItem('solidAdminUser',user.username);sessionStorage.setItem('solidAdminRole',user.role);
      if(changed)location.reload();
    }catch(err){if(err.status===401)sessionLost()}
  }

  /** Log out: end the server session and drop private records from this browser. */
  async function logout(){
    try{await flush()}catch{}
    try{await api('/api/logout',{method:'POST'})}catch{}
    clearAdminFlags();
    try{const d=localData();if(d){PRIVATE_KEYS.forEach(k=>delete d[k]);localStorage.setItem('solidData',json(d))}localStorage.removeItem(BASE_KEY)}catch{}
    location.href='/admin/login';
  }

  async function savePublicRegistration(entry){return api('/api/public-registration',{method:'POST',body:json({entry})})}
  async function session(){return api('/api/session')}
  window.solidCloud={enabled:true,restore,save,flush,logout,savePublicRegistration,session,api};
  window.addEventListener('beforeunload',e=>{if(pending>0){e.preventDefault();e.returnValue=''}});
  verifySession();
  window.addEventListener('load',()=>setTimeout(restore,120));
})();
