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

  // Cursor dot
  const dot = document.querySelector('.cursor-dot');
  if (dot){
    window.addEventListener('mousemove', e => {
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
    });
    document.querySelectorAll('a, button, [data-hover]').forEach(el => {
      el.addEventListener('mouseenter', () => dot.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => dot.classList.remove('is-hover'));
    });
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
