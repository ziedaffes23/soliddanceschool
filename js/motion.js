/* Solid Dance School — lightweight public-site motion.
   Scroll reveal, mobile nav, header shade, pinned culture track, scroll-linked heading fill.
   Replaces the old uploaded-motion.js (custom cursor / page-curtain / grain
   JS removed in favour of a pure-CSS grain overlay and simpler, more robust
   interactions). Honours prefers-reduced-motion for effects that play on their own. */
(function () {
  function revealOnScroll() {
    const targets = Array.from(document.querySelectorAll('.class-card,.event-card,.video-card,.teacher-feature,.news-row,.schedule-day,.section-head,.manifest-card,.gallery-item,.index-row,.owner-card'));
    targets.forEach(el => {
      el.classList.add('motion-reveal');
      const sibs = el.parentElement ? Array.from(el.parentElement.children).filter(c => c.classList.contains('motion-reveal') || targets.includes(c)) : [];
      el.style.setProperty('--i', Math.min(6, Math.max(0, sibs.indexOf(el))));
    });
    if (!('IntersectionObserver' in window)) { targets.forEach(el => el.classList.add('is-visible')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(el => io.observe(el));
  }

  const frameTasks = [];
  let frameQueued = false;
  function runFrame() { frameQueued = false; frameTasks.forEach(fn => fn()); }
  function requestFrame() { if (!frameQueued) { frameQueued = true; requestAnimationFrame(runFrame); } }
  function onFrame(fn) { frameTasks.push(fn); }
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame);

  // Wraps each heading's content in one inline span (text nodes stay whole, so the
  // phrase-based translator in main.js still matches) and fills it with colour as it scrolls up.
  let wordTargets = [];
  function scrollWords() {
    wordTargets = Array.from(document.querySelectorAll('[data-scroll-words]')).map(el => {
      let fill = el.querySelector(':scope > .sw-fill');
      if (!fill) {
        fill = document.createElement('span');
        fill.className = 'sw-fill';
        while (el.firstChild) fill.appendChild(el.firstChild);
        el.appendChild(fill);
      }
      const total = (fill.textContent || '').length || 1;
      const inner = fill.querySelector('span');
      const lead = inner ? Math.max(0, total - (inner.textContent || '').length) / total : 1;
      return { el, fill, inner, lead, pin: el.closest('[data-culture-pin]') };
    });
    requestFrame();
  }
  onFrame(() => {
    const vh = window.innerHeight;
    wordTargets.forEach(t => {
      let p;
      if (t.pin) {
        const top = t.pin.getBoundingClientRect().top;
        const stickTop = parseFloat(getComputedStyle(t.pin.firstElementChild).top) || 0;
        p = (vh - top) / Math.max(1, vh - stickTop);
      } else {
        const top = t.el.getBoundingClientRect().top;
        p = (vh * 0.92 - top) / (vh * 0.5);
      }
      p = Math.min(1, Math.max(0, p));
      t.fill.style.setProperty('--sw', `${(Math.min(1, p / t.lead) * 106).toFixed(1)}%`);
      if (t.inner) t.inner.style.setProperty('--sw-inner', `${(Math.max(0, (p - t.lead) / Math.max(0.0001, 1 - t.lead)) * 106).toFixed(1)}%`);
    });
  });

  function headerShade() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const update = () => header.style.background = window.scrollY > 10 ? 'rgba(10,10,10,.96)' : 'rgba(10,10,10,.82)';
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  function mobileMenu() {
    const burger = document.querySelector('.menu-btn');
    const menu = document.querySelector('.mobile-nav');
    if (!burger || !menu) return;
    const close = () => { menu.classList.remove('open'); document.body.classList.remove('nav-open'); burger.setAttribute('aria-expanded', 'false'); };
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      document.body.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    menu.querySelector('[data-nav-close]')?.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  let pinState = null;
  function culturePin() {
    const pin = document.querySelector('[data-culture-pin]');
    const sticky = document.querySelector('[data-culture-sticky]');
    const track = document.querySelector('[data-culture-track]');
    const bar = document.querySelector('[data-culture-progress]');
    if (!pin || !sticky || !track) return;
    // Stays on under prefers-reduced-motion: the track only moves as the visitor scrolls, never on its own.
    const first = !pinState;
    pinState = { pin, sticky, track, bar, shift: 0, stickTop: 0, sign: -1, raw: -1, userRaw: null, scrolled: false, width: window.innerWidth };
    measurePin();
    if (first) {
      window.addEventListener('scroll', () => { pinState.scrolled = true; }, { passive: true });
      window.addEventListener('resize', measurePin);
      window.addEventListener('load', measurePin);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(measurePin);
      onFrame(updatePin);
      pin.addEventListener('wheel', sidewaysWheel, { passive: false });
    }
  }
  function measurePin() {
    if (!pinState) return;
    const s = pinState;
    // A width change (rotation, window resize) reflows everything above, so put the visitor back
    // where they last scrolled to in the strip. userRaw only changes on real scrolls, not on reflows.
    const u = s.userRaw;
    const keep = s.width !== window.innerWidth && u !== null && u >= 0 && u <= 1 ? u : null;
    s.width = window.innerWidth;
    s.stickTop = parseFloat(getComputedStyle(s.sticky).top) || 0;
    s.shift = Math.max(0, s.track.scrollWidth - s.sticky.clientWidth);
    // In RTL (Arabic) the track overflows to the left, so it has to slide the other way.
    s.sign = getComputedStyle(s.track).direction === 'rtl' ? 1 : -1;
    s.pin.style.height = `${s.sticky.offsetHeight + s.shift}px`;
    if (keep !== null) window.scrollTo({ top: s.pin.getBoundingClientRect().top + window.scrollY - s.stickTop + keep * s.shift, behavior: 'instant' });
    updatePin();
  }
  function updatePin() {
    if (!pinState) return;
    const s = pinState;
    s.raw = s.shift ? (s.stickTop - s.pin.getBoundingClientRect().top) / s.shift : -1;
    if (s.scrolled || s.userRaw === null) { s.userRaw = s.raw; s.scrolled = false; }
    const p = Math.min(1, Math.max(0, s.raw));
    s.track.style.transform = `translate3d(${(s.sign * p * s.shift).toFixed(1)}px,0,0)`;
    if (s.bar) s.bar.style.width = `${(p * 100).toFixed(2)}%`;
    cultureType(s, p);
  }
  // Community strip is type only: giant outlined words fill with lime as they cross the screen,
  // quotes colour in left to right, and the word CLASS gets struck through.
  function cultureType(s, p) {
    const vw = window.innerWidth;
    const rtl = s.sign === 1;
    const edge = r => (rtl ? vw - r.right : r.left);
    s.track.querySelectorAll('[data-cx-big]').forEach(el => {
      const r = el.getBoundingClientRect();
      const l = edge(r);
      const f = Math.min(1, Math.max(0, (vw * 0.92 - l) / (r.width + vw * 0.55)));
      el.style.setProperty('--p', `${(f * 106).toFixed(1)}%`);
      el.style.setProperty('--dy', `${(((l + r.width / 2) / vw - 0.5) * -46).toFixed(1)}px`);
    });
    s.track.querySelectorAll('.cq').forEach(el => {
      const r = el.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (vw * 0.88 - edge(r)) / (vw * 0.42)));
      el.style.setProperty('--sw', `${(f * 106).toFixed(1)}%`);
    });
    const st = s.track.querySelector('.cx-strike');
    if (st) st.style.setProperty('--strike', Math.min(1, Math.max(0, (p - 0.02) / 0.1)).toFixed(3));
  }
  // A clearly sideways trackpad swipe, tilt wheel or Shift+wheel drives the strip by scrolling the page,
  // only while it is pinned, clamped to its ends, so the visitor is never trapped or thrown past it.
  function sidewaysWheel(e) {
    const s = pinState;
    let dy;
    if (e.shiftKey) dy = e.deltaX || e.deltaY;
    else if (Math.abs(e.deltaX) > 2 * Math.abs(e.deltaY)) dy = -s.sign * e.deltaX;
    else return;
    dy *= e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
    const raw = (s.stickTop - s.pin.getBoundingClientRect().top) / (s.shift || 1);
    if (!s.shift || raw < 0 || raw > 1) return;
    dy = dy > 0 ? Math.min(dy, (1 - raw) * s.shift) : Math.max(dy, -raw * s.shift);
    if (Math.abs(dy) < 0.5) return;
    e.preventDefault();
    window.scrollBy({ top: dy, behavior: 'instant' });
  }

  function countUp() {
    const nodes = document.querySelectorAll('[data-count]');
    if (!nodes.length) return;
    const animate = el => {
      const target = Number(el.dataset.count) || 0;
      const start = performance.now();
      const dur = 900;
      const step = now => {
        const p = Math.min(1, (now - start) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { nodes.forEach(animate); return; }
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); } }), { threshold: 0.6 });
    nodes.forEach(el => io.observe(el));
  }

  function pageCurtain() {
    const curtain = document.querySelector('.page-curtain');
    if (!curtain) return;
    setTimeout(() => curtain.classList.add('is-hidden'), 350);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('a[href]').forEach(a => {
      if (a.target === '_blank' || a.hasAttribute('download') || a.href.startsWith('mailto:') || a.href.startsWith('tel:')) return;
      let url;
      try { url = new URL(a.href, location.href); } catch (e) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      a.addEventListener('click', e => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        curtain.classList.remove('is-hidden');
        setTimeout(() => { location.href = a.href; }, reduced ? 0 : 320);
      });
    });
  }


  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // ---- masked letter rise: hero lines, page titles, big section titles, footer monument ----
  function splitChars(el) {
    if (!el || el.querySelector(':scope .sx-ch')) return;
    let ci = 0;
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.nodeValue.split(/(\s+)/).forEach(tok => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'sx-word';
            w.setAttribute('aria-hidden', 'true');
            Array.from(tok).forEach(c => {
              const ch = document.createElement('span');
              ch.className = 'sx-ch';
              ch.style.setProperty('--ci', ci++);
              ch.textContent = c;
              w.appendChild(ch);
            });
            frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    walk(el);
  }
  function letterRise() {
    const heroLines = document.querySelectorAll('.hero h1 > span');
    heroLines.forEach(line => { splitChars(line); line.classList.add('sx-in'); });
    document.querySelectorAll('.page-hero h1').forEach(h => { splitChars(h); h.classList.add('sx-in'); });
    const later = document.querySelectorAll('.page-cta h2:not([data-scroll-words]),.footer-monument');
    later.forEach(el => splitChars(el));
    if (reducedMotion || !('IntersectionObserver' in window)) { later.forEach(el => el.classList.add('sx-in', 'sx-now')); return; }
    if (!letterRise.io) letterRise.io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('sx-in', 'sx-now'); letterRise.io.unobserve(e.target); }
    }), { threshold: 0.35 });
    later.forEach(el => { if (!el.classList.contains('sx-now')) letterRise.io.observe(el); });
  }

  // ---- scroll thread (progress) + hero parallax ----
  function scrollThread() {
    if (document.querySelector('.scroll-thread')) return;
    const bar = document.createElement('div');
    bar.className = 'scroll-thread';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    onFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--thread', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
    });
    if (reducedMotion) return;
    const ph = document.querySelector('.hero-placeholder');
    const hero = document.querySelector('.hero');
    if (hero) onFrame(() => {
      const y = window.scrollY;
      if (y > window.innerHeight * 1.2) return;
      hero.style.setProperty('--hpy', `${(y * 0.22).toFixed(1)}px`);
    });
    document.querySelectorAll('.u-media').forEach(m => onFrame(() => {
      const r = m.getBoundingClientRect();
      if (r.bottom < -100 || r.top > window.innerHeight + 100) return;
      m.style.transform = `translate3d(0,${(((r.top + r.height / 2) / window.innerHeight - 0.5) * -34).toFixed(1)}px,0)`;
    }));
  }

  // ---- pointer-driven effects: hero light, card spotlight, magnetic buttons, cursor ring ----
  function pointerFX() {
    if (!finePointer || reducedMotion) return;
    const hero = document.querySelector('.hero');
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring);
    let rx = 0, ry = 0, tx = 0, ty = 0, raf = 0;
    const loop = () => {
      rx += (tx - rx) * 0.2; ry += (ty - ry) * 0.2;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;
      raf = Math.abs(tx - rx) + Math.abs(ty - ry) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    document.addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      ring.classList.add('on');
      if (!raf) raf = requestAnimationFrame(loop);
      if (hero) {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--hx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        hero.style.setProperty('--hy', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
        hero.style.setProperty('--hpx', `${((e.clientX / window.innerWidth - 0.5) * -28).toFixed(1)}px`);
      }
      const t = e.target.closest ? e.target : null;
      const card = t && t.closest('.class-card,.event-card,.video-card,.manifest-card,.owner-card');
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
      ring.classList.toggle('big', !!(t && t.closest('a,button,.filter,select,.gallery-item')));
    }, { passive: true });
    document.addEventListener('mouseleave', () => ring.classList.remove('on'));
    // magnetic pull on buttons
    document.addEventListener('mousemove', e => {
      const b = e.target.closest && e.target.closest('.button,.nav-cta');
      document.querySelectorAll('.button.is-mag,.nav-cta.is-mag').forEach(x => {
        if (x !== b) { x.style.transform = ''; x.classList.remove('is-mag'); }
      });
      if (!b) return;
      const r = b.getBoundingClientRect();
      b.classList.add('is-mag');
      b.style.transform = `translate(${((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1)}px,${((e.clientY - (r.top + r.height / 2)) * 0.32).toFixed(1)}px)`;
    }, { passive: true });
  }

  // ---- scroll-scrubbed type bands (every page, above the closing call to action) ----
  const BAND_WORDS = ['Hip hop', 'House', 'Breaking', 'Contemporary', 'Jazz', 'K-pop', 'Afro', 'Heels'];
  function scrubBands() {
    if (document.querySelector('.scrub-band')) { requestFrame(); return; }
    const make = (words, cls, dir) => {
      const band = document.createElement('div');
      band.className = `scrub-band ${cls}`;
      band.setAttribute('aria-hidden', 'true');
      band.dataset.dir = dir;
      const track = document.createElement('div');
      track.className = 'scrub-track';
      for (let k = 0; k < 3; k++) words.forEach(w => {
        const sp = document.createElement('span'); sp.textContent = w; track.appendChild(sp);
        const dot = document.createElement('i'); dot.textContent = '✱'; track.appendChild(dot);
      });
      band.appendChild(track);
      return band;
    };
    const cta = document.querySelector('.page-cta');
    if (cta) cta.parentElement.insertBefore(make(BAND_WORDS, '', 'l'), cta);
    // home only: a lime band between the school and the teachers
    const school = document.querySelector('.school-grid');
    if (school && document.body.dataset.page === 'home') {
      const sec = school.closest('section');
      sec.parentElement.insertBefore(make(['Not a class', 'A crew', 'Move different'], 'lime', 'r'), sec.nextSibling);
    }
    document.querySelectorAll('.scrub-band').forEach(band => {
      const track = band.firstElementChild;
      onFrame(() => {
        if (reducedMotion) return;
        const r = band.getBoundingClientRect();
        if (r.bottom < -50 || r.top > window.innerHeight + 50) return;
        const prog = (window.innerHeight - r.top) / (window.innerHeight + r.height);
        const span = Math.max(0, track.scrollWidth - window.innerWidth);
        const x = band.dataset.dir === 'r' ? -span + prog * span * 0.9 : -prog * span * 0.9;
        track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      });
    });
    requestFrame();
  }

  function init() {
    headerShade();
    mobileMenu();
    revealOnScroll();
    culturePin();
    scrollWords();
    countUp();
    pageCurtain();
    letterRise();
    scrollThread();
    scrubBands();
    pointerFX();
    requestAnimationFrame(() => document.body.classList.add('page-ready'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.addEventListener('solid:content-updated', () => { revealOnScroll(); scrollWords(); letterRise(); measurePin(); });
})();
