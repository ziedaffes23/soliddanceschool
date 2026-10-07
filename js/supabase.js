/* Solid Dance School server-backed persistence.
   The browser never receives the Supabase service-role key. Public pages use a
   filtered data response; authenticated admin pages use the protected API. */
(function(){
  const json=v=>JSON.stringify(v);
  function localData(){try{return JSON.parse(localStorage.getItem('solidData')||'null')}catch{return null}}
  async function api(path, options={}){
    const response=await fetch(path,{credentials:'include',headers:{'content-type':'application/json',...(options.headers||{})},...options});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||`Request failed (${response.status})`);
    return data;
  }
  async function restore(){
    if(document.body.dataset.admin==='login')return;
    try{
      const scope=document.body.dataset.admin?'?scope=admin':'';
      const result=await api(`/api/data${scope}`);
      if(result.data){
        const current=localData();
        if(json(current)!==json(result.data)){
          localStorage.setItem('solidData',json(result.data));
          if(document.readyState!=='loading')location.reload();
        }
      }
    }catch(err){console.warn('[Solid API] restore skipped:',err.message||err)}
  }
  async function save(data){
    localStorage.setItem('solidData',json(data));
    try{return await api('/api/data',{method:'PUT',body:JSON.stringify({data})})}
    catch(err){console.warn('[Solid API] save skipped:',err.message||err);return {ok:false,error:err.message}}
  }
  async function savePublicRegistration(entry){return api('/api/public-registration',{method:'POST',body:JSON.stringify({entry})})}
  async function session(){return api('/api/session')}
  window.solidCloud={enabled:true,restore,save,savePublicRegistration,session,api};
  window.addEventListener('load',()=>setTimeout(restore,120));
})();
