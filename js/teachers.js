function initTeachers(){
  const el=document.querySelector('[data-teachers]');
  if(!el)return;
  const invalid=value=>!value||/^\[[A-Z_]+\]$/.test(String(value).trim());
  const source=(Array.isArray(getData().teachers)?getData().teachers:[]).filter(t=>t.published!==false);
  const teachers=source.length?source:[{name:'Solid Dance Faculty',styles:'Contemporary · Hip Hop · Movement',bio:'A teaching team dedicated to technique, musicality and confident expression.',published:true}];
  el.innerHTML=teachers.map((t,i)=>{
    const name=invalid(t.name)?'Solid Dance Faculty':t.name;
    const styles=invalid(t.styles)?'Contemporary · Hip Hop · Movement':t.styles;
    const bio=invalid(t.bio)?'A teaching team dedicated to technique, musicality and confident expression.':t.bio;
    const image=invalid(t.imageurl)?(invalid(t.imageUrl)?'':t.imageUrl):t.imageurl;
    const portrait=image?`<img class="teacher-image" src="${escapeHTML(image)}" alt="${escapeHTML(t.alt||t.altText||name)}" onload="this.nextElementSibling.hidden=true;this.nextElementSibling.style.display='none'" onerror="this.remove();this.nextElementSibling.hidden=false;this.nextElementSibling.style.display='grid'">`:'';
    return `<article class="teacher-feature"><div class="teacher-portrait">${portrait}<div class="portrait-fallback" ${image?'hidden':''}>SOLID<br>FACULTY</div></div><div class="teacher-copy"><div class="eyebrow">${String(i+1).padStart(2,'0')} / Faculty</div><h2>${escapeHTML(name)}</h2><div class="meta"><span class="tag">${escapeHTML(styles)}</span></div><p>${escapeHTML(bio)}</p></div></article>`;
  }).join('');
}
