/* Solid School Dance — motion + home orchestration layer.
   Runs after main.js (initPublic). Business logic, data, payments and admin stay untouched. */
(function(){
  'use strict';
  const body=document.body;
  if(!body||!body.dataset||!body.dataset.page)return; /* public pages only — admin stays CSS-driven */

  const reduced=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  const fine=!!(window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches);
  const coarse=!!(window.matchMedia&&matchMedia('(hover:none)').matches);
  const qs=(s,c=document)=>c.querySelector(s);
  const qsa=(s,c=document)=>[...c.querySelectorAll(s)];
  const valid=v=>v!=null&&String(v).trim()!==''&&!/^\[[A-Z_]+\]$/.test(String(v).trim());
  const esc=s=>String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const add=(tag,cls,html)=>{const e=document.createElement(tag);e.className=cls;if(html!=null)e.innerHTML=html;body.appendChild(e);return e};
  const data=()=>{try{return typeof getData==='function'?getData():{}}catch(err){return {}}};

  /* ---------- 1. Dynamic home content (renders even with reduced motion) ---------- */

  function buildTeachers(){
    const rail=qs('[data-home-teachers]');if(!rail)return;
    const src=(data().teachers||[]).filter(t=>t&&t.published!==false&&valid(t.name)).slice(0,3);
    const list=src.length?src:[{name:'Solid Faculty',styles:'Contemporary · Hip Hop · Movement',bio:'A teaching team dedicated to technique, musicality and confident expression.'}];
    rail.innerHTML=list.map(t=>{
      const img=valid(t.imageurl)?t.imageurl:(valid(t.imageUrl)?t.imageUrl:'');
      const first=String(t.name).trim().split(/\s+/)[0].toUpperCase();
      return '<a class="teacher-tile" href="/professeurs">'
        +'<span class="teacher-media" data-ph="'+esc(first)+'">'+(img?'<img src="'+esc(img)+'" alt="'+esc(t.name)+'" loading="lazy" onerror="this.remove()">':'')+'</span>'
        +'<h3>'+esc(t.name)+'</h3>'
        +'<span class="tagline">'+esc(valid(t.styles)?t.styles:'Solid Dance School')+'</span>'
        +(valid(t.bio)?'<span class="quote">'+esc(t.bio)+'</span>':'')
        +'</a>';
    }).join('');
  }

  function buildSchedule(){
    const daysEl=qs('[data-home-days]'),listEl=qs('[data-home-schedule]');
    if(!daysEl||!listEl)return;
    const order=['monday','tuesday','wednesday','thursday','friday','saturday','sunday','lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
    const rows=(data().schedules||[]).filter(r=>r&&(valid(r.className)||valid(r.class)||valid(r.time))&&valid(r.day));
    const groups={};
    rows.forEach(r=>{const d=String(r.day).trim();(groups[d]||(groups[d]=[])).push(r)});
    const days=Object.keys(groups).sort((a,b)=>{const ia=order.indexOf(a.toLowerCase()),ib=order.indexOf(b.toLowerCase());return(ia<0?99:ia)-(ib<0?99:ib)||a.localeCompare(b)});
    if(!days.length){
      daysEl.innerHTML='';
      listEl.innerHTML='<div class="home-schedule-row"><strong>Schedule coming soon</strong><span>Contact the school for current availability</span><em>TBA</em></div>';
      return;
    }
    const todayName=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
    let active=days.find(d=>d.toLowerCase()===todayName)||days[0];
    const renderDays=()=>{daysEl.innerHTML=days.map(d=>'<button type="button" role="tab" aria-selected="'+(d===active)+'" data-day="'+esc(d)+'">'+esc(d.slice(0,3))+'</button>').join('')};
    const renderRows=()=>{
      const rs=groups[active].slice().sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
      listEl.innerHTML=rs.map((r,i)=>'<div class="home-schedule-row" style="--r:'+i+'">'
        +'<time>'+esc(valid(r.time)?r.time:'TBA')+'</time>'
        +'<strong>'+esc(r.className||r.class||'Class')+'</strong>'
        +'<span>'+esc([r.teacher,r.room].filter(valid).join(' · ')||'Solid studio')+'</span>'
        +'<em>'+esc(valid(r.availability)?r.availability:'Open')+'</em>'
        +'</div>').join('');
    };
    renderDays();renderRows();
    daysEl.addEventListener('click',e=>{
      const b=e.target.closest('button[data-day]');
      if(!b||b.dataset.day===active)return;
      active=b.dataset.day;renderDays();renderRows();
    });
  }

  function buildCultureImages(){
    const track=qs('[data-culture-track]');if(!track)return;
    const imgs=(data().gallery||[]).filter(g=>g&&g.published!==false&&valid(g.imageUrl));
    qsa('.culture-card',track).forEach((card,i)=>{
      const g=imgs[i];if(!g)return;
      const img=document.createElement('img');
      img.src=g.imageUrl;img.alt=g.caption||'Solid Dance School community';img.loading='lazy';
      img.onerror=()=>img.remove();
      card.appendChild(img);
      if(valid(g.caption))card.dataset.ph=g.caption;
    });
  }

  function buildContact(){
    const s=data().siteSettings||{};
    const clean=(v,f)=>valid(v)?String(v).trim():f;
    const email=qs('[data-contact="email"]');
    if(email){const v=clean(s.email,'tarakbouzid@gmail.com');email.textContent=v;email.href='mailto:'+v}
    const phone=qs('[data-contact="phone"]');
    if(phone){const v=clean(s.phone,'+216 55 939 535');const first=v.split('/')[0].trim();phone.textContent=first;phone.href='tel:'+first.replace(/[^+\d]/g,'')}
    const insta=qs('[data-contact="instagram"]');
    if(insta){
      const raw=s.social&&valid(s.social.instagram)?s.social.instagram:'https://www.instagram.com/solide_dance/';
      insta.href=raw;
      const m=String(raw).match(/instagram\.com\/([^/?#]+)/i);
      insta.textContent='@'+(m?m[1]:'solide_dance');
    }
    const addr=qs('[data-contact="address"]');
    if(addr)addr.textContent=clean(s.address,'Sfax, Tunisia');
  }

  function fixPortraitPlaceholders(){
    qsa('.teacher-portrait').forEach((p,i)=>{
      if(!p.dataset.ph){
        const name=p.closest('.teacher-feature')?.querySelector('h2')?.textContent||'Solid Faculty';
        p.dataset.ph=name.trim().split(/\s+/)[0].toUpperCase()||('0'+(i+1));
      }
      const fb=qs('.portrait-fallback',p);if(fb)fb.setAttribute('aria-hidden','true');
    });
  }

  buildTeachers();
  buildSchedule();
  buildCultureImages();
  buildContact();
  fixPortraitPlaceholders();

  /* ---------- 2. Counters ---------- */
  const counters=qsa('[data-count]');
  function runCounter(el){
    const target=parseInt(el.dataset.count,10)||0;
    if(reduced){el.textContent=target;return}
    const t0=performance.now(),dur=1500;
    const tick=now=>{
      const p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,4);
      el.textContent=Math.round(target*e);
      if(p<1)requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- 3. Scrub text ([data-scrub]) ---------- */
  const scrubEls=[];
  function splitScrub(el){
    const text=el.textContent||'';
    el.dataset.scrubText=text;
    el.innerHTML='';
    const words=text.split(/\s+/).filter(Boolean);
    const hot=/rhythm|move|moves|moving|body|work|corps|bouge|travail|حركة|جسد/i;
    words.forEach((w,i)=>{
      const span=document.createElement('span');
      span.className='w'+((hot.test(w)||i===words.length-1)?' hot':'');
      span.textContent=w;
      el.appendChild(span);
      el.appendChild(document.createTextNode(' '));
    });
  }
  function initScrub(){
    qsa('[data-scrub]').forEach(el=>{
      splitScrub(el);
      scrubEls.push(el);
      new MutationObserver(()=>{
        if(el.textContent.trim()!==(el.dataset.scrubText||'').trim())splitScrub(el);
      }).observe(el,{childList:true,characterData:true,subtree:true});
    });
  }
  function updateScrub(){
    const vh=innerHeight;
    scrubEls.forEach(el=>{
      const r=el.getBoundingClientRect();
      if(r.bottom<-80||r.top>vh+80)return;
      const p=Math.min(1,Math.max(0,(vh*0.88-r.top)/(vh*0.62)));
      const words=el.querySelectorAll('.w'),n=words.length;
      const lit=Math.floor(p*n);
      words.forEach((w,i)=>w.classList.toggle('on',i<lit));
    });
  }

  /* ---------- 4. Marquee duplication (seamless -50% loop) ---------- */
  function initMarquee(){
    const track=qs('[data-home-contact-marquee]');if(!track)return;
    const apply=()=>{
      const text=(track.dataset.marquee||track.textContent||'').replace(/\s+/g,' ').trim();
      if(!text)return;
      track.dataset.marquee=text;
      track.innerHTML='';
      const seg=document.createElement('span');
      seg.textContent=text+' ';
      track.appendChild(seg);
      let guard=0;
      while(track.scrollWidth<innerWidth*2.1&&guard<14){
        const c=seg.cloneNode(true);
        c.setAttribute('aria-hidden','true');
        track.appendChild(c);
        guard++;
      }
      if(guard%2===1){const c=seg.cloneNode(true);c.setAttribute('aria-hidden','true');track.appendChild(c)}
    };
    apply();
    window.addEventListener('load',apply);
    let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(apply,250)});
    new MutationObserver(()=>{
      if(!track.querySelector('span'))apply();
    }).observe(track,{childList:true});
  }

  initScrub();
  initMarquee();

  /* ---------- 5. Reduced motion: stop here, everything visible ---------- */
  if(reduced){
    body.classList.add('uploaded-ready');
    counters.forEach(el=>{el.textContent=el.dataset.count});
    qsa('[data-scrub] .w').forEach(w=>w.classList.add('on'));
    return;
  }

  /* ---------- 6. Grain / curtain / cursor ---------- */
  const grain=add('div','uploaded-grain');grain.setAttribute('aria-hidden','true');
  const curtain=add('div','uploaded-curtain','<span>SOLID</span>');curtain.setAttribute('aria-hidden','true');

  let cursor=null,dot=null,cursorLabel=null;
  if(fine){
    cursor=add('div','uploaded-cursor','<span></span>');
    dot=add('div','uploaded-dot');
    cursorLabel=qs('span',cursor);
    let mx=-100,my=-100,cx=-100,cy=-100;
    window.addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;body.classList.add('has-uploaded-cursor')},{passive:true});
    const loop=()=>{
      cx+=(mx-cx)*.16;cy+=(my-cy)*.16;
      cursor.style.transform='translate3d('+cx+'px,'+cy+'px,0)';
      dot.style.transform='translate3d('+mx+'px,'+my+'px,0)';
      requestAnimationFrame(loop);
    };
    loop();
    const bindCursor=root=>{
      qsa('a,button,select,[data-magnetic]',root).forEach(el=>{
        if(el.dataset.uCursor)return;el.dataset.uCursor='1';
        el.addEventListener('pointerenter',()=>{
          cursor.classList.add('is-link');
          cursorLabel.textContent=el.dataset.cursor||(el.closest('.home-v2-program-item')?'OPEN':el.closest('.teacher-tile')?'MEET':el.closest('.gallery-item,.culture-card,.video-card')?'VIEW':'');
        });
        el.addEventListener('pointerleave',()=>{cursor.classList.remove('is-link');cursorLabel.textContent=''});
      });
    };
    bindCursor(document);
  }

  /* ---------- 7. Word wrap (skip what main.js already wrapped) ---------- */
  function wrapWords(el){
    if(el.dataset.uploadedMotion||el.dataset.motionReady)return;
    el.dataset.uploadedMotion='1';
    let i=0;
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{
      acceptNode:n=>n.parentElement&&n.parentElement.closest('script,style')?NodeFilter.FILTER_REJECT:(n.nodeValue||'').trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT
    });
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const frag=document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(part=>{
        if(!part.trim()){frag.appendChild(document.createTextNode(part));return}
        const span=document.createElement('span');
        span.className='word';
        span.style.setProperty('--word-index',i++);
        span.textContent=part;
        frag.appendChild(span);
      });
      node.parentNode.replaceChild(frag,node);
    });
    el.classList.add('motion-words');
  }
  qsa('.hero-only h1,.page-hero h1,.section-title,.home-v2-title,.home-v2-program-head h2,.page-cta h2,.zero-join h2,.culture-statement,.teacher-copy h2,.event-card h2,.class-card .card-title,.school-grid .copy h2').forEach(wrapWords);

  /* ---------- 8. Reveals ---------- */
  qsa('.home-v2-section,.section,.page-cta,.class-card,.teacher-feature,.event-card,.video-card,.gallery-item,.home-v2-manifest-card,.home-v2-program-item,.u-sec-head,.school-grid>*,.teacher-tile,.contact-info>div,.cta-copy,.culture-quote,.culture-card,.footer-grid,.owner-card,.map-panel,.schedule-intro,.admin-panel').forEach((el,i)=>{
    if(el.classList.contains('motion-reveal'))return;
    el.classList.add('motion-reveal');
    el.style.setProperty('--reveal-index',i%8);
  });

  /* undo anything main.js already revealed — we re-run it after the curtain lifts */
  const preRevealed=qsa('.motion-words.is-visible,.motion-reveal.is-visible');
  preRevealed.forEach(el=>el.classList.remove('is-visible'));

  const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    entry.target.classList.add('is-visible');
    if(entry.target.hasAttribute('data-count'))runCounter(entry.target);
    io.unobserve(entry.target);
  }),{threshold:.12,rootMargin:'0px 0px -8% 0px'});

  /* ---------- 9. Curtain lift ---------- */
  let lifted=false;
  function lift(){
    if(lifted)return;lifted=true;
    body.classList.add('uploaded-ready');
    qsa('.motion-words,.motion-reveal,[data-count]').forEach(el=>io.observe(el));
    updateScrub();
    updateCulture();
    updateParallax();
  }
  setTimeout(lift,650);
  window.addEventListener('load',()=>setTimeout(lift,300));

  /* ---------- 10. Scroll engine: scrub + culture pin + parallax ---------- */
  const culture=qs('.home-culture');
  const cultureTrack=qs('[data-culture-track]');
  const cultureBar=qs('[data-culture-progress]');
  function updateCulture(){
    if(!culture||!cultureTrack)return;
    const max=Math.max(1,cultureTrack.scrollWidth-cultureTrack.clientWidth);
    const p=Math.min(1,Math.max(0,cultureTrack.scrollLeft/max));
    cultureTrack.style.transform='none';
    if(cultureBar)cultureBar.style.transform='scaleX('+p+')';
    culture.classList.toggle('community-active',p>0.01);
  }

  const heroMedia=qs('.hero-only .hero-media');
  const floaters=qsa('.zero-signal .photo-a,.zero-signal .photo-b,[data-parallax]');
  function updateParallax(){
    const y=scrollY;
    if(heroMedia&&y<innerHeight*1.4)heroMedia.style.transform='translate3d(0,'+(y*.14)+'px,0)';
    floaters.forEach((el,i)=>{
      const r=el.getBoundingClientRect();
      if(r.bottom<0||r.top>innerHeight)return;
      const p=(r.top+r.height/2-innerHeight/2)/innerHeight;
      el.style.transform='translate3d(0,'+(p*(i%2?-26:34))+'px,0)';
    });
  }

  let ticking=false;
  function onScroll(){
    if(ticking)return;ticking=true;
    requestAnimationFrame(()=>{updateScrub();updateCulture();updateParallax();ticking=false});
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  cultureTrack?.addEventListener('scroll',updateCulture,{passive:true});

  /* ---------- 11. Floating style preview for programme rows ---------- */
  const progList=qs('[data-home-program]');
  if(fine&&progList){
    const prev=add('div','style-preview');
    prev.setAttribute('aria-hidden','true');
    let tx=0,ty=0,px=0,py=0,on=false;
    window.addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY},{passive:true});
    const follow=()=>{
      px+=(tx-px)*.14;py+=(ty-py)*.14;
      if(on){
        const w=prev.offsetWidth,h=prev.offsetHeight;
        const x=Math.min(px+30,innerWidth-w-20);
        const y=Math.min(Math.max(py-h/2,20),innerHeight-h-20);
        prev.style.transform='translate3d('+x+'px,'+y+'px,0) scale(1)';
      }else{
        prev.style.transform='translate3d('+px+'px,'+py+'px,0) scale(.85)';
      }
      requestAnimationFrame(follow);
    };
    follow();
    progList.addEventListener('pointerover',e=>{
      const row=e.target.closest('.home-v2-program-item');if(!row)return;
      prev.dataset.name=row.querySelector('h3')?row.querySelector('h3').textContent:'';
      prev.classList.add('on');on=true;
    });
    progList.addEventListener('pointerleave',()=>{prev.classList.remove('on');on=false});
    progList.addEventListener('pointerout',e=>{
      if(e.relatedTarget&&progList.contains(e.relatedTarget))return;
      prev.classList.remove('on');on=false;
    });
  }

  /* ---------- 12. Touch: first tap expands a programme row, second navigates ---------- */
  if(coarse&&progList){
    progList.addEventListener('click',e=>{
      const row=e.target.closest('.home-v2-program-item');if(!row)return;
      if(row.getAttribute('aria-expanded')!=='true'){
        e.preventDefault();
        qsa('.home-v2-program-item[aria-expanded]',progList).forEach(r=>r.removeAttribute('aria-expanded'));
        row.setAttribute('aria-expanded','true');
      }
    });
  }

  /* ---------- 13. Magnetic controls ---------- */
  if(fine){
    qsa('.button,.filter,.schedule-days button,.icon-btn').forEach(el=>{
      el.addEventListener('pointermove',e=>{
        const r=el.getBoundingClientRect();
        const x=(e.clientX-(r.left+r.width/2))*.14,y=(e.clientY-(r.top+r.height/2))*.18;
        el.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px)';
      },{passive:true});
      el.addEventListener('pointerleave',()=>{el.style.transform=''});
    });
  }

  /* ---------- 14. Tilt ---------- */
  if(fine){
    qsa('.gallery-item,.video-card,.teacher-feature,.teacher-tile .teacher-media,.culture-card,.class-card,.event-card').forEach(el=>{
      el.addEventListener('pointermove',e=>{
        const r=el.getBoundingClientRect();
        const rx=(e.clientY-r.top-r.height/2)/r.height,ry=(e.clientX-r.left-r.width/2)/r.width;
        el.style.transform='perspective(900px) rotateX('+(rx*-2.2).toFixed(2)+'deg) rotateY('+(ry*2.2).toFixed(2)+'deg)';
      },{passive:true});
      el.addEventListener('pointerleave',()=>{el.style.transform=''});
    });
  }

  /* ---------- 15. Curtain page transitions (capture phase beats the legacy handler) ---------- */
  document.addEventListener('click',e=>{
    const link=e.target.closest('a[href]');
    if(!link)return;
    const href=link.getAttribute('href');
    if(!href||href.startsWith('#')||/^(mailto:|tel:|javascript:)/i.test(href))return;
    if(link.target==='_blank'||link.hasAttribute('download')||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    if(coarse&&link.classList.contains('home-v2-program-item')&&link.getAttribute('aria-expanded')!=='true')return;
    let url;
    try{url=new URL(href,location.href)}catch(err){return}
    if(url.origin!==location.origin)return;
    if(url.pathname===location.pathname&&url.hash)return;
    e.preventDefault();
    e.stopPropagation();
    body.classList.add('uploaded-enter');
    setTimeout(()=>{location.href=url.href},460);
  },true);

  /* ---------- 16. Re-bind cursor for late-rendered rows ---------- */
  if(fine&&progList){
    new MutationObserver(()=>{
      qsa('.home-v2-program-item',progList).forEach(el=>{
        if(el.dataset.uCursor)return;el.dataset.uCursor='1';
        el.addEventListener('pointerenter',()=>{cursor.classList.add('is-link');cursorLabel.textContent='OPEN'});
        el.addEventListener('pointerleave',()=>{cursor.classList.remove('is-link');cursorLabel.textContent=''});
      });
    }).observe(progList,{childList:true});
  }
  /* ---------- v3. Logo + page choreography ---------- */
  function initLogo(){
    const logo=qs('.site-header .site-logo');
    if(!logo)return;
    logo.alt='Solid School Dance — Sfax';
    const frame=logo.closest('.logo');
    if(frame&&!frame.dataset.logoBound){
      frame.dataset.logoBound='1';
      frame.addEventListener('pointerenter',()=>frame.classList.add('logo-active'));
      frame.addEventListener('pointerleave',()=>frame.classList.remove('logo-active'));
    }
  }
  function initScrollRail(){
    const rail=add('div','uploaded-progress');
    const scan=add('div','uploaded-scanline');
    rail.setAttribute('aria-hidden','true');scan.setAttribute('aria-hidden','true');
    const update=()=>{
      const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
      rail.style.transform='scaleX('+Math.min(1,Math.max(0,scrollY/max))+')';
    };
    window.addEventListener('scroll',update,{passive:true});update();
  }
  function initMagnetic(){
    if(!fine)return;
    qsa('[data-magnetic],.hero-actions .button,.page-cta .button').forEach(el=>{
      if(el.dataset.magneticBound)return;el.dataset.magneticBound='1';
      el.addEventListener('pointermove',e=>{
        const r=el.getBoundingClientRect(),x=(e.clientX-(r.left+r.width/2))*.08,y=(e.clientY-(r.top+r.height/2))*.08;
        el.style.transform='translate3d('+x+'px,'+y+'px,0)';
      });
      el.addEventListener('pointerleave',()=>{el.style.transform=''});
    });
  }
  initLogo();
  initScrollRail();
  initMagnetic();

})();
