/* Solid Dance School — lightweight public-site motion.
   Scroll reveal, mobile nav, header shade on scroll, culture-track progress.
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

  function cultureProgress() {
    const track = document.querySelector('[data-culture-track]');
    const bar = document.querySelector('[data-culture-progress]');
    if (!track || !bar) return;
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      bar.style.width = max > 0 ? `${Math.min(100, (track.scrollLeft / max) * 100)}%` : '0%';
    };
    track.addEventListener('scroll', update, { passive: true });
    update();
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

  function init() {
    headerShade();
    mobileMenu();
    revealOnScroll();
    cultureProgress();
    countUp();
    requestAnimationFrame(() => document.body.classList.add('page-ready'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.addEventListener('solid:content-updated', () => { revealOnScroll(); cultureProgress(); });
})();
