// Inject shared nav + footer so sub-pages stay DRY
(function(){
  const navHTML = `
<nav class="nav">
  <a href="/" class="nav__logo">
    <img src="/assets/logo.png" alt="Big Smile Orthodontics">
  </a>
  <ul class="nav__links">
    <li><a href="/services.html">Services</a></li>
    <li><a href="/invisalign-clear-aligners.html">Invisalign</a></li>
    <li><a href="/dr-asrar.html">Dr. Asrar</a></li>
    <li><a href="/smile-gallery.html">Smile Gallery</a></li>
    <li><a href="/for-patients.html">For Patients</a></li>
    <li><a href="/blog">Blog</a></li>
    <li><a href="/contact.html">Contact</a></li>
  </ul>
  <a href="/contact.html" class="nav__cta" data-hover>
    <span class="dot"></span>
    <span class="label">Book free consult</span>
  </a>
  <button class="nav__hamburger" aria-label="Toggle menu">
    <span></span><span></span><span></span>
  </button>
</nav>
<div class="nav__mobile">
  <a href="/services.html">Services</a>
  <a href="/invisalign-clear-aligners.html">Invisalign</a>
  <a href="/dr-asrar.html">Dr. Asrar</a>
  <a href="/smile-gallery.html">Smile Gallery</a>
  <a href="/for-patients.html">For Patients</a>
  <a href="/blog">Blog</a>
  <a href="/contact.html">Contact</a>
  <a href="/contact.html" class="btn btn--primary">Book free consult</a>
</div>`;

  const footerHTML = `
<footer class="site-footer">
  <div class="site-footer__inner">
    <div class="site-footer__brand">
      Big Smile <em>Orthodontics</em>
      <p>Dr. Saba Asrar &amp; team · Crafting confident, life-changing smiles in Round Rock, TX.</p>
    </div>
    <div>
      <h4>Treatments</h4>
      <ul>
        <li><a href="/invisalign-clear-aligners.html">Invisalign Clear Aligners</a></li>
        <li><a href="/traditional-orthodontics.html">Traditional Braces</a></li>
        <li><a href="/clear-ceramic-braces.html">Clear Ceramic Braces</a></li>
        <li><a href="/phase-1-orthodontics.html">Phase 1 for Kids</a></li>
        <li><a href="/retainers-orthodontic-appliances.html">Retainers &amp; Appliances</a></li>
        <li><a href="/orthodontic-emergencies.html">Orthodontic Emergencies</a></li>
      </ul>
    </div>
    <div>
      <h4>Practice</h4>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/dr-asrar.html">Dr. Saba Asrar</a></li>
        <li><a href="/services.html">All Services</a></li>
        <li><a href="/smile-gallery.html">Smile Gallery</a></li>
        <li><a href="/reviews.html">Patient Reviews</a></li>
        <li><a href="/blog">Blog</a></li>
      </ul>
    </div>
    <div>
      <h4>Patients</h4>
      <ul>
        <li><a href="/for-patients.html">For Patients</a></li>
        <li><a href="/life-with-braces.html">Life with Braces</a></li>
        <li><a href="/dental-insurance.html">Insurance &amp; Financing</a></li>
        <li><a href="/for-patients.html#forms">Patient Forms</a></li>
        <li><a href="/for-patients.html#first-visit">Your First Visit</a></li>
        <li><a href="/contact.html">Book a Consult</a></li>
      </ul>
    </div>
    <div>
      <h4>Visit</h4>
      <ul>
        <li>1025 Sendero Springs Dr, Ste 110</li>
        <li>Round Rock, TX 78681</li>
        <li><a href="tel:5128287900">(512) 828-7900</a></li>
        <li><a href="mailto:info@bigsmileorthodontics.com">info@bigsmileorthodontics.com</a></li>
        <li><a href="https://www.google.com/maps/place/Big+Smile+Orthodontics" target="_blank" rel="noopener">Get Directions</a></li>
        <li><a href="/sitemap.html">Sitemap</a></li>
      </ul>
    </div>
  </div>
  <div class="site-footer__bottom">
    <div>© 2026 Big Smile Orthodontics</div>
    <div>Round Rock · Cedar Park · Georgetown · North Austin</div>
    <div>Designed with <span style="color:var(--warm)">♥</span> in Texas</div>
    <div>Made by Soham Sthitpragya</div>
  </div>
</footer>`;

  // Inject: prepend nav to body, append footer before </body>
  const navMount = document.getElementById('nav-mount');
  const footMount = document.getElementById('footer-mount');
  if (navMount) navMount.outerHTML = navHTML;
  if (footMount) footMount.outerHTML = footerHTML;
})();
