/* Solid Dance School cloud persistence.
   The app remains usable offline through localStorage and syncs the same solidData
   document to Supabase when the public site_data table is configured. */
(function(){
  const cfg=window.SOLID_SUPABASE_CONFIG||{};
  const ready=!!(window.supabase&&cfg.url&&cfg.anonKey);
  const client=ready?window.supabase.createClient(cfg.url,cfg.anonKey):null;
  let restoring=false;
  const json=v=>JSON.stringify(v);
  function localData(){try{return JSON.parse(localStorage.getItem('solidData')||'null')}catch{return null}}
  async function restore(){
    if(!client||restoring)return;
    restoring=true;
    try{
      const {data,error}=await client.from('site_data').select('data').eq('id','default').maybeSingle();
      if(error)throw error;
      if(data&&data.data){
        const current=localData();
        if(json(current)!==json(data.data)){
          localStorage.setItem('solidData',json(data.data));
          if(document.readyState!=='loading')location.reload();
        }
      }else{
        const current=localData();
        if(current)await client.from('site_data').upsert({id:'default',data:current,updated_at:new Date().toISOString()});
      }
    }catch(err){console.warn('[Supabase] restore skipped:',err.message||err)}
    finally{restoring=false}
  }
  async function save(data){
    localStorage.setItem('solidData',json(data));
    if(!client)return;
    try{
      const {error}=await client.from('site_data').upsert({id:'default',data,updated_at:new Date().toISOString()});
      if(error)throw error;
    }catch(err){console.warn('[Supabase] cloud save skipped:',err.message||err)}
  }
  window.solidCloud={enabled:!!client,restore,save,client};
  if(client)window.addEventListener('load',()=>setTimeout(restore,120));
})();
