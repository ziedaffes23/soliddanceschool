/* Solid Dance School — admin dashboard shell, auth, CRUD and settings. */
const DEFAULT_DATA={siteSettings:{schoolName:'Solid Dance School',tagline:'Move different.',imageTreatment:'bw',address:'Dance School Solide, Sfax, Tunisia',phone:'+216 55 939 535 / +216 93 939 526',email:'tarakbouzid@gmail.com',hours:'[HOURS]',story:'',social:{instagram:'[INSTAGRAM_LINK]',facebook:'[FACEBOOK_LINK]',tiktok:'[TIKTOK_LINK]'}},hero:{type:'image',imageUrl:'',mobileImageUrl:'',videoUrl:'',posterUrl:'',headline:['SOLID','DANCE','SCHOOL'],subheadline:'Move different.',label:'Sfax / Tunisia',ctaText:'Discover classes',ctaUrl:'/cours',overlay:55,active:true},classes:[],teachers:[],schedules:[],events:[],news:[],videos:[],gallery:[],registrations:[],translations:{fr:{},en:{},ar:{}}};
const clone=o=>JSON.parse(JSON.stringify(o));
function getData(){try{const stored=JSON.parse(localStorage.getItem('solidData')||'{}');const d=Object.assign(clone(DEFAULT_DATA),stored);d.siteSettings=Object.assign(clone(DEFAULT_DATA.siteSettings),stored.siteSettings||{});d.siteSettings.social=Object.assign(clone(DEFAULT_DATA.siteSettings.social),(stored.siteSettings||{}).social||{});return d}catch{return clone(DEFAULT_DATA)}}
function saveData(data){localStorage.setItem('solidData',JSON.stringify(data));window.solidCloud?.save(data)}
function escapeHTML(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

const adminSections={dashboard:'Dashboard',registrations:'Registrations',leads:'Leads / Interested',students:'Students / Classes',payments:'Payments',packs:'Packs & Pricing',classes:'Classes',schedules:'Schedules',teachers:'Teachers',events:'Events',news:'News',videos:'Videos',gallery:'Gallery',hero:'Hero / Homepage',pages:'Site content',settings:'Settings'};
const ADMIN_ACCESS={admin:Object.keys(adminSections),manager:['dashboard','registrations','leads','students','payments']};
function adminLang(){return localStorage.getItem('solidAdminLang')==='fr'?'fr':'en'}
const ADMIN_FR={'DASHBOARD':'Tableau de bord','REGISTRATIONS':'Inscriptions','LEADS / INTERESTED':'Prospects intéressés','STUDENTS / CLASSES':'Élèves / Classes','PAYMENTS':'Paiements','PACKS & PRICING':'Forfaits & tarifs','CLASSES':'Cours','SCHEDULES':'Horaires','TEACHERS':'Professeurs','EVENTS':'Événements','NEWS':'Actualités','VIDEOS':'Vidéos','GALLERY':'Galerie','HERO / HOMEPAGE':'Accueil','SITE CONTENT':'Contenu du site','SETTINGS':'Paramètres','SAVE':'Enregistrer','EDIT':'Modifier','DELETE':'Supprimer','CANCEL':'Annuler'};
function adminText(en){return adminLang()==='fr'?(ADMIN_FR[String(en).toUpperCase()]||en):en}
function translateAdminDOM(root=document){if(adminLang()!=='fr')return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;return !p||p.closest('script,style,input,textarea,select,option')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(n=>{const raw=n.nodeValue||'',trim=raw.trim(),translated=ADMIN_FR[trim.toUpperCase()];if(translated&&translated!==trim){const lead=raw.match(/^\s*/)?.[0]||'',trail=raw.match(/\s*$/)?.[0]||'';n.nodeValue=lead+translated+trail}})}
function currentAdminRole(){return sessionStorage.getItem('solidAdminRole')||'manager'}
function canAccessAdminSection(section){return (ADMIN_ACCESS[currentAdminRole()]||[]).includes(section)}
function adminAuth(active){if(sessionStorage.getItem('solidAdmin')!=='true'&&document.body.dataset.admin!=='login'){location.href='/admin/login';return false}if(active&&!canAccessAdminSection(active)){location.href='/admin';return false}return true}
function adminNav(active){const groups=[['OPERATIONS',[['dashboard','Dashboard','/admin'],['registrations','Registrations','/admin/registrations'],['students','Students / Classes','/admin/students']]],['MONEY',[['payments','Payments / Facilité','/admin/payments']]],['STUDIO',[['classes','Classes','/admin/classes']]],['MORE TOOLS',[['leads','Leads / Interested','/admin/leads'],['packs','Packs & Pricing','/admin/packs'],['schedules','Schedules','/admin/schedules'],['teachers','Teachers','/admin/teachers'],['events','Events','/admin/events'],['news','News','/admin/news'],['videos','Videos','/admin/videos'],['gallery','Gallery','/admin/gallery'],['hero','Homepage','/admin/hero'],['pages','Site content','/admin/pages'],['settings','Settings','/admin/settings']]]],advanced=['leads','packs','schedules','teachers','events','news','videos','gallery','hero','pages','settings'].includes(active),visibleGroups=groups.map(([label,items])=>[label,items.filter(g=>canAccessAdminSection(g[0]))]).filter(([,items])=>items.length);return `<aside class="admin-sidebar ops-sidebar ${advanced?'nav-expanded':''}"><a class="ops-brand" href="/admin"><img src="/assets/solid-dance-school-logo-dark.png" alt="Solid Dance School"></a><div class="ops-sidebar-meta"><span class="ops-rail-label">${currentAdminRole().toUpperCase()} ACCOUNT</span><span class="ops-sidebar-status"><i></i> ${adminLang()==='fr'?'Opérations en direct':'Live operations'}</span></div><nav class="admin-nav">${visibleGroups.map(([label,items])=>label==='MORE TOOLS'?`<button type="button" class="nav-more-toggle" onclick="toggleAdminMore(event)"><span>MORE TOOLS</span><b>+</b></button><div class="nav-group nav-advanced">${items.map(g=>`<a class="${g[0]===active?'active':''}" href="${g[2]}"><span>${adminText(g[1])}</span></a>`).join('')}</div>`:`<div class="nav-group"><span class="nav-group-label">${adminText(label)}</span>${items.map(g=>`<a class="${g[0]===active?'active':''}" href="${g[2]}"><span>${adminText(g[1])}</span>${g[0]==='payments'?'<b class="nav-dot">●</b>':''}</a>`).join('')}</div>`).join('')}</nav><div class="ops-sidebar-footer"><a class="admin-btn secondary" href="/">View site</a><button class="admin-btn secondary" onclick="window.solidCloud?.api('/api/logout',{method:'POST'}).finally(()=>{sessionStorage.removeItem('solidAdmin');sessionStorage.removeItem('solidAdminRole');sessionStorage.removeItem('solidAdminUser');location.href='/admin/login'})">Log out</button></div></aside>`}
function toggleAdminMore(ev){ev.preventDefault();document.querySelector('.ops-sidebar')?.classList.toggle('nav-expanded')}
function toast(msg){const t=document.querySelector('.toast');if(!t)return;t.textContent=msg;translateAdminDOM(document);t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function adminStart(active){if(!adminAuth(active))return false;document.querySelector('.ops-root').insertAdjacentHTML('afterbegin',adminNav(active));translateAdminDOM(document);return true}
function deleteRecord(key,i){if(!confirm('Delete this item?'))return;const d=getData();d[key].splice(i,1);saveData(d);location.reload()}

/* ---------- generic editable CRUD (teachers / events / news / videos / gallery / schedules) ---------- */
function renderEditableTable(key,columns){
  const data=getData()[key]||[],el=document.querySelector('[data-table]');if(!el)return;
  el.innerHTML=`<table class="data-table"><thead><tr>${columns.map(c=>`<th>${c.l}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${
    data.length?data.map((row,i)=>`<tr>${columns.map(c=>`<td>${escapeHTML(String(row[c.k]??'')).slice(0,140)}</td>`).join('')}<td class="ops-actions"><button class="admin-btn secondary" type="button" onclick="editRecord('${key}','${escapeHTML(row.id)}')">Edit</button><button class="admin-btn secondary" type="button" onclick="deleteRecord('${key}',${i})">Delete</button></td></tr>`).join(''):`<tr><td colspan="${columns.length+1}"><div class="notice">No items yet. Add the first one above.</div></td></tr>`
  }</tbody></table>`;
}
window.editRecord=function(key,id){
  const row=(getData()[key]||[]).find(x=>String(x.id)===String(id)),f=document.querySelector('[data-crud-form]');
  if(!row||!f)return;
  if(f.elements.id)f.elements.id.value=row.id;
  Array.from(f.elements).forEach(el=>{if(!el.name||el.name==='id')return;if(row[el.name]!==undefined)el.value=row[el.name]});
  const title=document.querySelector('[data-crud-title]');if(title)title.textContent='Edit item';
  const save=f.querySelector('button[type=submit]');if(save)save.textContent='Update item';
  const cancel=document.querySelector('[data-crud-cancel]');if(cancel)cancel.hidden=false;
  if(key==='gallery'&&row.imageUrl)window.previewGalleryImage?.(row.imageUrl);
  f.scrollIntoView({behavior:'smooth',block:'start'});
};
function resetCrudForm(f){f.reset();if(f.elements.id)f.elements.id.value='';const title=document.querySelector('[data-crud-title]');if(title)title.textContent='Add item';const save=f.querySelector('button[type=submit]');if(save)save.textContent='Save item';const cancel=document.querySelector('[data-crud-cancel]');if(cancel)cancel.hidden=true;const preview=document.querySelector('#galleryImagePreview');if(preview){preview.hidden=true;preview.innerHTML=''}}
function setupCrud(key,columns){
  const f=document.querySelector('[data-crud-form]');if(!f)return;
  if(!f.elements.id){const h=document.createElement('input');h.type='hidden';h.name='id';f.prepend(h)}
  f.onsubmit=e=>{
    e.preventDefault();
    const d=getData();d[key]=Array.isArray(d[key])?d[key]:[];
    const fd=new FormData(f),id=fd.get('id'),row=Object.fromEntries(fd);delete row.id;
    if(id){const idx=d[key].findIndex(x=>String(x.id)===String(id));if(idx>-1)d[key][idx]=Object.assign({},d[key][idx],row)}
    else{row.id=key[0].toUpperCase()+Date.now().toString().slice(-7);d[key].push(row)}
    saveData(d);resetCrudForm(f);toast(id?'Item updated':'Item saved');renderEditableTable(key,columns);
  };
  document.querySelector('[data-crud-cancel]')?.addEventListener('click',()=>resetCrudForm(f));
  renderEditableTable(key,columns);
}
window.previewGalleryImage=function(url){const el=document.querySelector('#galleryImagePreview');if(!el)return;const raw=String(url||'').trim();if(!raw){el.hidden=true;el.innerHTML='';return}el.hidden=false;el.innerHTML=`<img src="${escapeHTML(raw)}" alt="Gallery preview" onerror="this.parentElement.innerHTML='<span>Image link could not be loaded.</span>'">`};

/* ---------- login ---------- */
async function setupLogin(){const f=document.querySelector('#loginForm');if(!f)return;f.onsubmit=async e=>{e.preventDefault();const fd=new FormData(f),user=String(fd.get('username')||'').trim(),pass=String(fd.get('password')||''),n=document.querySelector('#loginNotice');n.textContent='';try{const result=await window.solidCloud.api('/api/login',{method:'POST',body:JSON.stringify({username:user,password:pass})});sessionStorage.setItem('solidAdmin','true');sessionStorage.setItem('solidAdminUser',result.user.username);sessionStorage.setItem('solidAdminRole',result.user.role);location.href='/admin'}catch(err){n.textContent=err.message||'Invalid admin credentials.';n.classList.add('notice')}}}

/* ---------- admin users ---------- */
let adminUsersCache=[];
async function fetchAdminUsers(){const result=await window.solidCloud.api('/api/admin-users');adminUsersCache=Array.isArray(result.users)?result.users:[];return adminUsersCache}
function renderAdminUsers(){const el=document.querySelector('#adminUsersList');if(!el)return;const current=sessionStorage.getItem('solidAdminUser');el.innerHTML=adminUsersCache.map(u=>`<div class="admin-user-row"><div class="admin-user-avatar">${escapeHTML((u.username||'?').slice(0,1).toUpperCase())}</div><div><strong>${escapeHTML(u.username)}</strong><small>${u.role==='admin'?'Full administrator':'Operations manager'}${u.username===current?' · You':''}</small></div><span class="admin-user-role ${u.role}">${u.role}</span><div class="admin-user-actions"><button type="button" class="admin-btn secondary" onclick="editAdminUser('${escapeHTML(u.id)}')">Edit</button><button type="button" class="admin-btn danger" onclick="removeAdminUser('${escapeHTML(u.id)}')">Remove</button></div></div>`).join('')||'<div class="notice">No managed users yet.</div>'}
window.editAdminUser=function(id){const u=adminUsersCache.find(x=>x.id===id),f=document.querySelector('#adminUserForm');if(!u||!f)return;f.elements.userId.value=u.id;f.elements.username.value=u.username;f.elements.role.value=u.role;f.elements.password.value='';document.querySelector('#adminUserFormTitle').textContent='Edit user';document.querySelector('#adminUserSave').textContent='Update user';document.querySelector('#adminUserCancel').hidden=false;f.elements.password.placeholder='Leave blank to keep the current password';f.elements.username.focus()}
window.cancelAdminUserEdit=function(){const f=document.querySelector('#adminUserForm');if(!f)return;f.reset();f.elements.userId.value='';document.querySelector('#adminUserFormTitle').textContent='Add a user';document.querySelector('#adminUserSave').textContent='Add user';document.querySelector('#adminUserCancel').hidden=true;f.elements.password.placeholder='Temporary password'}
window.removeAdminUser=async function(id){const u=adminUsersCache.find(x=>x.id===id),current=sessionStorage.getItem('solidAdminUser');if(!u)return;if(u.username===current){toast('You cannot remove the account currently in use');return}if(!confirm(`Remove user ${u.username}?`))return;try{const result=await window.solidCloud.api(`/api/admin-users/${encodeURIComponent(id)}`,{method:'DELETE'});adminUsersCache=result.users||[];renderAdminUsers();toast('User removed')}catch(err){toast(err.message||'User could not be removed')}}
function setupAdminUsers(){const f=document.querySelector('#adminUserForm');if(!f||currentAdminRole()!=='admin')return;fetchAdminUsers().then(renderAdminUsers).catch(err=>toast(err.message||'Users could not be loaded'));f.onsubmit=async e=>{e.preventDefault();const username=String(f.elements.username.value||'').trim(),role=f.elements.role.value==='manager'?'manager':'admin',password=String(f.elements.password.value||''),userId=f.elements.userId.value;if(!/^[a-zA-Z0-9._-]{3,32}$/.test(username)){toast('Use 3–32 letters, numbers, dots, dashes, or underscores');return}if(!userId&&!password){toast('A password is required for a new user');return}if(password&&password.length<8){toast('Password must contain at least 8 characters');return}try{const result=await window.solidCloud.api('/api/admin-users',{method:'POST',body:JSON.stringify({id:userId||undefined,username,role,password})});adminUsersCache=result.users||[];cancelAdminUserEdit();renderAdminUsers();toast(userId?'User updated':'User added')}catch(err){toast(err.message||'User could not be saved')}};document.querySelector('#adminUserCancel').onclick=cancelAdminUserEdit}
function setupAdminLanguage(){const f=document.querySelector('#adminLanguageForm');if(!f)return;f.elements.adminLanguage.value=adminLang();f.onsubmit=e=>{e.preventDefault();localStorage.setItem('solidAdminLang',f.elements.adminLanguage.value==='fr'?'fr':'en');location.reload()}}
function setupImageSettings(){const f=document.querySelector('#imageSettingsForm');if(!f)return;const mode=getData().siteSettings.imageTreatment==='color'?'color':'bw';if(f.elements.imageTreatment)f.elements.imageTreatment.value=mode;f.onsubmit=e=>{e.preventDefault();const d=getData();d.siteSettings.imageTreatment=f.elements.imageTreatment.value==='color'?'color':'bw';saveData(d);toast(d.siteSettings.imageTreatment==='color'?'Image mode: original color':'Image mode: black & white')}}

/* ---------- hero ---------- */
function setupHeroAdmin(){const f=document.querySelector('#heroForm');if(!f)return;const h=getData().hero;for(const [k,v] of Object.entries(h)){const el=f.elements[k];if(el)el.type==='checkbox'?el.checked=v:el.value=Array.isArray(v)?v.join('\n'):v}f.onsubmit=e=>{e.preventDefault();const d=getData();const fd=new FormData(f);Object.keys(h).forEach(k=>{const el=f.elements[k];if(!el)return;d.hero[k]=el.type==='checkbox'?el.checked:el.value});d.hero.headline=String(d.hero.headline).split('\n').filter(Boolean);saveData(d);toast('Hero saved')}}

/* ---------- site content (story / contact / hours / social) ---------- */
function setupSiteContentAdmin(){
  const f=document.querySelector('#siteContentForm');if(!f)return;
  const s=getData().siteSettings;
  ['schoolName','tagline','story','address','phone','email','hours'].forEach(k=>{if(f.elements[k])f.elements[k].value=s[k]||''});
  ['instagram','facebook','tiktok'].forEach(k=>{if(f.elements['social_'+k])f.elements['social_'+k].value=(s.social||{})[k]||''});
  f.onsubmit=e=>{
    e.preventDefault();
    const d=getData();
    ['schoolName','tagline','story','address','phone','email','hours'].forEach(k=>{if(f.elements[k])d.siteSettings[k]=f.elements[k].value});
    d.siteSettings.social=d.siteSettings.social||{};
    ['instagram','facebook','tiktok'].forEach(k=>{if(f.elements['social_'+k])d.siteSettings.social[k]=f.elements['social_'+k].value});
    saveData(d);toast('Site content saved');
  };
}

/* ---------- classes (dedicated, supports edit already) ---------- */
function renderClassTable(){const data=getData().classes||[],el=document.querySelector('[data-class-table]');if(!el)return;el.innerHTML=`<table class="data-table"><thead><tr><th>Name</th><th>Style</th><th>Age</th><th>Level</th><th>Teacher</th><th>Schedule</th><th>Actions</th></tr></thead><tbody>${data.map((row,i)=>`<tr><td>${escapeHTML(row.name)}</td><td>${escapeHTML(row.style)}</td><td>${escapeHTML(row.age)}</td><td>${escapeHTML(row.level)}</td><td>${escapeHTML(row.teacher)}</td><td>${escapeHTML(row.schedule)}</td><td class="ops-actions"><button class="admin-btn" type="button" onclick="editClass('${row.id}')">Edit</button><button class="admin-btn secondary" type="button" onclick="deleteRecord('classes',${i})">Delete</button></td></tr>`).join('')||'<tr><td colspan="7"><div class="notice">No classes yet. Add the first class above.</div></td></tr>'}</tbody></table>`}
function resetClassForm(){const f=document.querySelector('#classForm');if(!f)return;f.reset();f.elements.id.value='';document.querySelector('#classFormTitle').textContent='Add class';document.querySelector('#classSaveButton').textContent='Save class';document.querySelector('#classCancelButton').hidden=true}
window.editClass=function(id){const row=(getData().classes||[]).find(x=>x.id===id),f=document.querySelector('#classForm');if(!row||!f)return;['id','name','style','age','level','teacher','schedule','description'].forEach(k=>{if(f.elements[k])f.elements[k].value=row[k]||''});document.querySelector('#classFormTitle').textContent='Edit class';document.querySelector('#classSaveButton').textContent='Update class';document.querySelector('#classCancelButton').hidden=false;f.scrollIntoView({behavior:'smooth',block:'start'});f.elements.name.focus()};
function setupClassCrud(){const f=document.querySelector('#classForm');if(!f)return;document.querySelector('#classCancelButton').onclick=resetClassForm;f.onsubmit=e=>{e.preventDefault();if(!f.reportValidity())return;const d=getData(),fd=new FormData(f),id=fd.get('id'),row=Object.fromEntries(fd);delete row.id;d.classes=d.classes||[];if(id){const index=d.classes.findIndex(x=>x.id===id);if(index>-1)d.classes[index]=Object.assign({},d.classes[index],row)}else{row.id='C'+Date.now().toString().slice(-7);d.classes.push(row)}saveData(d);resetClassForm();toast(id?'Class updated':'Class saved');renderClassTable()}}

/* ---------- entry point ---------- */
function initAdmin(active){
  if(!adminStart(active))return;
  if(active==='dashboard'){const d=getData();document.querySelector('#kpis').innerHTML=[['registrations',d.registrations.length],['new registrations',d.registrations.filter(x=>x.status==='New').length],['classes',d.classes.length],['teachers',d.teachers.length]].map(x=>`<div class="kpi"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('')}
  if(active==='hero')setupHeroAdmin();
  if(active==='pages')setupSiteContentAdmin();
  if(active==='settings'){setupImageSettings();setupAdminLanguage();setupAdminUsers();}
  if(active==='classes'){renderClassTable();setupClassCrud();translateAdminDOM(document);return}
  const EDIT_MAPS={
    teachers:['teachers',[{k:'name',l:'Name'},{k:'styles',l:'Styles'},{k:'bio',l:'Bio'}]],
    schedules:['schedules',[{k:'day',l:'Day'},{k:'time',l:'Time'},{k:'class',l:'Class'},{k:'teacher',l:'Teacher'},{k:'room',l:'Room'},{k:'availability',l:'Availability'}]],
    events:['events',[{k:'title',l:'Title'},{k:'date',l:'Date'},{k:'location',l:'Location'},{k:'published',l:'Published'}]],
    news:['news',[{k:'title',l:'Title'},{k:'date',l:'Date'},{k:'author',l:'Author'},{k:'published',l:'Published'}]],
    videos:['videos',[{k:'title',l:'Title'},{k:'url',l:'Url'},{k:'published',l:'Published'}]],
    gallery:['gallery',[{k:'caption',l:'Caption'},{k:'published',l:'Published'}]]
  };
  if(EDIT_MAPS[active])setupCrud(...EDIT_MAPS[active]);
  translateAdminDOM(document);
}
