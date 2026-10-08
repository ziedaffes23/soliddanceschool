/* Motion layer inspired by the user-supplied index(7).html. Business logic stays in main.js. */
(function(){
  'use strict';
  const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const page=document.body?.dataset?.page;
  if(!page||reduced){document.body?.classList.add('uploaded-ready');return}
  const qs=(s,c=document)=>c.querySelector(s), qsa=(s,c=document)=>[...c.querySelectorAll(s)];
  const add=(tag,cls,html='')=>{const e=document.createElement(tag);e.className=cls;e.innerHTML=html;document.body.appendChild(e);return e};
  const grain=add('div','uploaded-grain');grain.setAttribute('aria-hidden','true');
  const curtain=add('div','uploaded-curtain','<span>SOLID</span>');curtain.setAttribute('aria-hidden','true');
  const cursor=add('div','uploaded-cursor','<span></span>');const dot=add('div','uploaded-dot');
  let mx=-100,my=-100,cx=-100,cy=-100;
  const move=e=>{mx=e.clientX;my=e.clientY;document.body.classList.add('has-uploaded-cursor')};
  window.addEventListener('pointermove',move,{passive:true});
  const render=()=>{cx+=(mx-cx)*.18;cy+=(my-cy)*.18;cursor.style.transform=`translate3d(${cx}px,${cy}px,0)`;dot.style.transform=`translate3d(${mx}px,${my}px,0)`;requestAnimationFrame(render)};render();
  qsa('a,button,[data-magnetic]').forEach(el=>{el.addEventListener('pointerenter',()=>{cursor.classList.add('is-link');const label=el.dataset.cursor||'';qs('span',cursor).textContent=label});el.addEventListener('pointerleave',()=>{cursor.classList.remove('is-link');qs('span',cursor).textContent=''});el.addEventListener('pointermove',e=>{if(!el.hasAttribute('data-magnetic'))return;const r=el.getBoundingClientRect(),x=(e.clientX-(r.left+r.width/2))*.12,y=(e.clientY-(r.top+r.height/2))*.12;el.style.transform=`translate(${x}px,${y}px)`});el.addEventListener('pointerleave',()=>{if(el.hasAttribute('data-magnetic'))el.style.transform=''})});
  const wrapWords=el=>{if(el.dataset.uploadedMotion)return;el.dataset.uploadedMotion='1';let i=0;const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest('script,style')?NodeFilter.FILTER_REJECT:(n.nodeValue||'').trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(node=>{const frag=document.createDocumentFragment();node.nodeValue.split(/(\s+)/).forEach(part=>{if(!part.trim()){frag.appendChild(document.createTextNode(part));return}const span=document.createElement('span');span.className='word';span.style.setProperty('--word-index',i++);span.textContent=part;frag.appendChild(span)});node.parentNode.replaceChild(frag,node)});el.classList.add('motion-words')};
  qsa('.hero-only h1,.page-hero h1,.section-title,.home-v2-title,.home-v2-program-head h2,.page-cta h2,.teacher-copy h2,.event-card h2,.class-card .card-title').forEach(wrapWords);
  qsa('.section,.page-cta,.class-card,.teacher-feature,.event-card,.video-card,.gallery-item,.home-v2-manifest-card,.home-v2-program-item,.footer-grid,.owner-card,.map-panel').forEach((el,i)=>{el.classList.add('motion-reveal');el.style.setProperty('--reveal-index',i%8)});
  const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target)}}),{threshold:.12,rootMargin:'0px 0px -8% 0px'});qsa('.motion-words,.motion-reveal').forEach(el=>io.observe(el));
  qsa('img[data-parallax],.hero-media img,.teacher-portrait img').forEach(img=>{const parent=img.closest('figure,.hero-media')||img;const update=()=>{const r=parent.getBoundingClientRect(),p=(r.top+ r.height/2-innerHeight/2)/innerHeight;img.style.transform=`translate3d(0,${Math.max(-24,Math.min(24,p*-28))}px,0) scale(1.08)`};window.addEventListener('scroll',update,{passive:true});update()});
  requestAnimationFrame(()=>document.body.classList.add('uploaded-ready'));
  qsa('a[href]').forEach(link=>link.addEventListener('click',e=>{const href=link.getAttribute('href');if(!href||href.startsWith('#')||href.startsWith('mailto:')||href.startsWith('tel:')||link.target==='_blank'||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;let url;try{url=new URL(href,location.href)}catch{return}if(url.origin!==location.origin)return;e.preventDefault();document.body.classList.remove('uploaded-ready');document.body.classList.add('uploaded-enter');setTimeout(()=>{location.href=url.href},420)}));
  qsa('.gallery-item,.video-card,.teacher-feature,.class-card').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),rx=(e.clientY-r.top-r.height/2)/r.height,ry=(e.clientX-r.left-r.width/2)/r.width;el.style.transform=`perspective(900px) rotateX(${rx*-2}deg) rotateY(${ry*2}deg)`},{passive:true});el.addEventListener('pointerleave',()=>{el.style.transform=''})});
})();
