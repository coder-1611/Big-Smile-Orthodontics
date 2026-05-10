// Inject shared nav + footer so sub-pages stay DRY
(function(){
  const navHTML = `
<nav class="nav">
  <a href="big-smile.html" class="nav__logo">
    <svg class="mark" viewBox="0 0 60 76" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#0077B6" d="M9,27C8,10 18,4 30,4C42,4 52,10 51,27C50,41 45,51 42,56L38,70C37,74 33,74 32,70L30,63L28,70C27,74 23,74 22,70L18,56C15,51 10,41 9,27Z"/><path d="M21,35Q30,46 39,35" stroke="white" stroke-width="6" fill="none" stroke-linecap="round"/></svg>
    <span>Big Smile <em>Orthodontics</em></span>
  </a>
  <ul class="nav__links">
    <li><a href="services.html">Services</a></li>
    <li><a href="dr-asrar.html">Dr. Asrar</a></li>
    <li><a href="smile-gallery.html">Smile Gallery</a></li>
    <li><a href="for-patients.html">For Patients</a></li>
    <li><a href="contact.html">Contact</a></li>
  </ul>
  <a href="contact.html" class="nav__cta" data-hover>
    <span class="dot"></span>
    <span class="label">Book free consult</span>
  </a>
  <button class="nav__hamburger" aria-label="Toggle menu">
    <span></span><span></span><span></span>
  </button>
</nav>
<div class="nav__mobile">
  <a href="services.html">Services</a>
  <a href="dr-asrar.html">Dr. Asrar</a>
  <a href="smile-gallery.html">Smile Gallery</a>
  <a href="for-patients.html">For Patients</a>
  <a href="contact.html">Contact</a>
  <a href="contact.html" class="btn btn--primary">Book free consult</a>
</div>`;

  const footerHTML = `
<footer class="site-footer">
  <div class="site-footer__inner">
    <div class="site-footer__brand">
      Big Smile <em>Orthodontics</em>
      <p>Dr. Saba Asrar &amp; team · Crafting confident, life-changing smiles in Round Rock, TX.</p>
    </div>
    <div>
      <h4>Explore</h4>
      <ul>
        <li><a href="big-smile.html">Home</a></li>
        <li><a href="dr-asrar.html">Dr. Asrar</a></li>
        <li><a href="services.html">Services</a></li>
        <li><a href="smile-gallery.html">Smile Gallery</a></li>
      </ul>
    </div>
    <div>
      <h4>Patients</h4>
      <ul>
        <li><a href="for-patients.html">For Patients</a></li>
        <li><a href="for-patients.html#first-visit">Your First Visit</a></li>
        <li><a href="for-patients.html#forms">Patient Forms</a></li>
        <li><a href="for-patients.html#insurance">Insurance</a></li>
      </ul>
    </div>
    <div>
      <h4>Visit</h4>
      <ul>
        <li>1025 Sendero Springs Dr, Ste 110</li>
        <li>Round Rock, TX 78681</li>
        <li><a href="tel:5128287900">(512) 828-7900</a></li>
        <li><a href="mailto:info@bigsmileorthodontics.com">info@bigsmileorthodontics.com</a></li>
      </ul>
    </div>
  </div>
  <div class="site-footer__bottom">
    <div>© 2026 Big Smile Orthodontics</div>
    <div>Round Rock · Cedar Park · Georgetown · North Austin</div>
    <div>Designed with <span style="color:var(--warm)">♥</span> in Texas</div>
  </div>
</footer>`;

  // Inject: prepend nav to body, append footer before </body>
  const navMount = document.getElementById('nav-mount');
  const footMount = document.getElementById('footer-mount');
  if (navMount) navMount.outerHTML = navHTML;
  if (footMount) footMount.outerHTML = footerHTML;
})();
