/* Solid Dance School — lightweight public-site motion.
   Scroll reveal, mobile nav, header shade, pinned culture track, scroll-linked heading fill.
   Replaces the old uploaded-motion.js (custom cursor / page-curtain / grain
   JS removed in favour of a pure-CSS grain overlay and simpler, more robust
   interactions). Honours prefers-reduced-motion throughout. */
(function () {
  function revealOnScroll() {
    const targets = document.querySelectorAll('.class-card,.event-card,.video-card,.teacher-feature,.news-row,.schedule-day,.section-head,.manifest-card,.gallery-item,.index-row');
    targets.forEach(el => el.classList.add('motion-reveal'));
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const update = () => {
        const max = track.scrollWidth - track.clientWidth;
        if (bar) bar.style.width = max > 0 ? `${Math.min(100, (track.scrollLeft / max) * 100)}%` : '0%';
      };
      track.addEventListener('scroll', update, { passive: true });
      update();
      return;
    }
    const first = !pinState;
    pinState = { pin, sticky, track, bar, shift: 0, stickTop: 0 };
    measurePin();
    if (first) {
      window.addEventListener('resize', measurePin);
      window.addEventListener('load', measurePin);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(measurePin);
      onFrame(updatePin);
    }
  }
  function measurePin() {
    if (!pinState) return;
    const { pin, sticky, track } = pinState;
    pinState.stickTop = parseFloat(getComputedStyle(sticky).top) || 0;
    pinState.shift = Math.max(0, track.scrollWidth - sticky.clientWidth);
    pin.style.height = `${sticky.offsetHeight + pinState.shift}px`;
    updatePin();
  }
  function updatePin() {
    if (!pinState) return;
    const { pin, track, bar, shift, stickTop } = pinState;
    const p = shift ? Math.min(1, Math.max(0, (stickTop - pin.getBoundingClientRect().top) / shift)) : 0;
    track.style.transform = `translate3d(${(-p * shift).toFixed(1)}px,0,0)`;
    if (bar) bar.style.width = `${(p * 100).toFixed(2)}%`;
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

  function init() {
    headerShade();
    mobileMenu();
    revealOnScroll();
    culturePin();
    scrollWords();
    countUp();
    pageCurtain();
    requestAnimationFrame(() => document.body.classList.add('page-ready'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.addEventListener('solid:content-updated', () => { revealOnScroll(); scrollWords(); measurePin(); });
})();
