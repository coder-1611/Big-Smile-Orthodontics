// Shared site interactions
(function(){
  // Scroll progress + nav solid
  const bar = document.querySelector('.scroll-bar');
  const nav = document.querySelector('.nav');
  function onScroll(){
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 || 0;
    if (bar) bar.style.width = pct + '%';
    if (nav){
      if (h.scrollTop > 60) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  // Cursor dot — rAF lerp, not a CSS transition.
  // The old version wrote `transform` on every mousemove while the CSS also
  // transitioned `transform`, so each event restarted a half-finished
  // interpolation. That fight is what produced the stuttering trail.
  const dot = document.querySelector('.cursor-dot');
  const finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (dot && finePointer && !reduceMotion){
    let tx = -100, ty = -100, cx = -100, cy = -100, raf = null, seen = false;

    const step = () => {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      dot.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0) translate(-50%,-50%)`;
      // park the loop once it has caught up, so idle pages cost nothing
      raf = (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1)
        ? requestAnimationFrame(step)
        : null;
    };

    window.addEventListener('pointermove', e => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      if (!seen){ seen = true; cx = tx; cy = ty; }   // no fly-in from the corner
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive:true });

    // Delegated hover state — one pair of listeners instead of two per element.
    const HOVER = 'a, button, [data-hover]';
    document.addEventListener('pointerover', e => {
      if (e.target.closest && e.target.closest(HOVER)) dot.classList.add('is-hover');
    }, { passive:true });
    document.addEventListener('pointerout', e => {
      if (e.target.closest && e.target.closest(HOVER)) dot.classList.remove('is-hover');
    }, { passive:true });

    // Iframes swallow pointer events — hide the dot rather than stranding it.
    document.querySelectorAll('iframe').forEach(frame => {
      const wrap = frame.closest('div') || frame.parentElement;
      if (!wrap) return;
      wrap.addEventListener('pointerenter', () => { dot.style.opacity = '0'; });
      wrap.addEventListener('pointerleave', () => { dot.style.opacity = ''; });
    });

    document.addEventListener('pointerleave', () => { dot.style.opacity = '0'; });
    document.addEventListener('pointerenter', () => { dot.style.opacity = ''; });
  } else if (dot){
    dot.remove();
  }

  // Reveals
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target);} });
  }, { threshold:.12, rootMargin:'0px 0px -60px 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

  // Mobile menu
  const ham = document.querySelector('.nav__hamburger');
  if (ham){
    ham.addEventListener('click', () => document.body.classList.toggle('menu-open'));
    document.querySelectorAll('.nav__mobile a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));
  }

  // Mark active nav link
  const path = location.pathname.split('/').pop() || 'big-smile.html';
  document.querySelectorAll('.nav__links a, .nav__mobile a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    const file = href.split('/').pop();
    if (file === path) a.classList.add('is-active');
  });
})();
